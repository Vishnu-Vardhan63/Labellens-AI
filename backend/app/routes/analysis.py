"""Package label analysis and scan query routes — Phase 2."""
import logging
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.scan import Scan, ScanStatus, AnalysisStatus
from app.schemas.scan import (
    AnalysisResponse,
    ScanDetailResponse,
    ValidationResponse,
    ComplianceSummary,
    ComplianceRuleResultItem,
    EvidenceResponse,
    CopilotQueryRequest,
    CopilotResponse,
)
from app.services.image_service import ImageService
from app.services.ocr_service import OcrService
from app.services.extraction_service import ExtractionService
from app.services.compliance_service import ComplianceService
from app.services.evidence_service import EvidenceService
from app.services.copilot_service import CopilotService
from app.services.report_service import ReportService
from app.services.label_gate_service import LabelGateService, LabelEligibilityStatus
from app.services.readability_service import readability_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/scans", tags=["Analysis, Compliance, Evidence & Reports"])

# Service singletons / instances
ocr_service = OcrService()
extraction_service = ExtractionService()
compliance_service = ComplianceService()
evidence_service = EvidenceService()
copilot_service = CopilotService()
report_service = ReportService()
label_gate = LabelGateService()


@router.post("/{scan_id}/analyze", response_model=AnalysisResponse)
async def analyze_scan(
    scan_id: str,
    db: Session = Depends(get_db),
) -> AnalysisResponse:
    """
    Run the Phase 2 analysis pipeline on an uploaded package label:
    1. Load image and record from database
    2. Apply OpenCV image preprocessing (adaptive CLAHE contrast, bilateral filtering, resizing)
    3. Run PaddleOCR (RapidOCR ONNX) to extract text, bounding boxes, and confidence
    4. Run package label eligibility gate (stops certificates, documents, random photos)
    5. Run intelligent rule-based field extraction for MRP, Net Qty, Dates, Manufacturer, Consumer Care
    6. Run compliance validation if eligible, or suspend if not a packaged commodity
    7. Save structured results to the database
    8. Return explainable analysis response
    """
    image_service = ImageService(db)
    scan = image_service.get_scan(scan_id)

    # Update state to processing
    scan.analysis_status = AnalysisStatus.PROCESSING
    db.commit()

    try:
        # Step 1: Preprocess image with OpenCV
        processed_img, processed_path = image_service.preprocess_image_for_ocr(scan)

        # Step 2: Run OCR
        ocr_result = ocr_service.run_ocr(processed_img)

        # Step 2.5: Package Label Eligibility Gate
        eligibility = label_gate.evaluate_eligibility(ocr_result)
        is_eligible = eligibility["is_eligible"]
        eligibility_status = eligibility["status"]
        eligibility_reason = eligibility["reason"]

        # Step 3: Extract declarations (strictly respecting eligibility)
        extracted_fields = extraction_service.extract_declarations(ocr_result, is_eligible=is_eligible)

        # Step 4: Run compliance validation (suspends if ineligible)
        comp_res = compliance_service.evaluate(
            extracted_fields,
            ocr_result.get("raw_text", ""),
            is_eligible=is_eligible,
            eligibility_status=eligibility_status,
            eligibility_reason=eligibility_reason,
        )

        # Step 5: Persist in database
        now = datetime.now(timezone.utc)
        scan.raw_ocr_text = ocr_result.get("raw_text", "")
        scan.ocr_results = ocr_result.get("lines", [])
        scan.extracted_fields = extracted_fields
        scan.analysis_status = AnalysisStatus.COMPLETED
        scan.status = ScanStatus.COMPLETED
        scan.analyzed_at = now
        scan.analysis_error = None

        # Store compliance results
        scan.compliance_status = "completed" if is_eligible else "not_performed"
        scan.overall_assessment = comp_res.get("overall_assessment")
        scan.compliance_summary = comp_res.get("summary")
        scan.compliance_results = comp_res.get("rule_results")
        scan.validated_at = now

        db.commit()
        db.refresh(scan)

        return AnalysisResponse(
            success=True,
            scan_id=scan.id,
            analysis_status=scan.analysis_status,
            analysis_timestamp=scan.analyzed_at,
            raw_ocr_text=scan.raw_ocr_text,
            ocr_lines=ocr_result.get("lines", []),
            ocr_summary={
                "line_count": ocr_result.get("line_count", 0),
                "average_confidence": ocr_result.get("average_confidence", 0.0),
                "engine": ocr_result.get("engine", "PaddleOCR (ONNX)"),
            },
            extracted_fields=extracted_fields,
            label_detection=eligibility,
            message="Package label analysis completed successfully" if is_eligible else "Image processed: Not eligible as a packaged commodity label",
        )

    except Exception as exc:
        logger.exception(f"Analysis failed for scan '{scan_id}': {exc}")
        scan.analysis_status = AnalysisStatus.FAILED
        scan.status = ScanStatus.FAILED
        scan.analysis_error = str(exc)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis pipeline encountered an error: {str(exc)}",
        ) from exc


@router.post("/{scan_id}/validate", response_model=ValidationResponse)
def validate_scan(
    scan_id: str,
    db: Session = Depends(get_db),
) -> ValidationResponse:
    """
    Evaluate extracted declarations against configured Legal Metrology compliance rules.
    If image is not eligible, suspends evaluation cleanly without false violations.
    """
    image_service = ImageService(db)
    scan = image_service.get_scan(scan_id)

    if not scan.extracted_fields:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Scan has not been analyzed yet. Please run /analyze before validation.",
        )

    now = datetime.now(timezone.utc)

    # Check if scan was flagged as ineligible
    if scan.compliance_status == "not_performed" or scan.overall_assessment in [
        LabelEligibilityStatus.INSUFFICIENT_PACKAGE_LABEL_EVIDENCE,
        LabelEligibilityStatus.NO_READABLE_TEXT,
    ]:
        is_no_text = scan.overall_assessment == LabelEligibilityStatus.NO_READABLE_TEXT
        return ValidationResponse(
            success=True,
            scan_id=scan.id,
            overall_assessment=scan.overall_assessment or LabelEligibilityStatus.INSUFFICIENT_PACKAGE_LABEL_EVIDENCE,
            overall_label="Analysis Not Performed",
            overall_description=(
                "No readable text could be detected in this image. Please upload a clear image of the product packaging."
                if is_no_text
                else "This image does not appear to be a packaged commodity label. Compliance validation was not performed."
            ),
            disclaimer="Screening suspended: Image lacks required packaging declaration markers.",
            summary=ComplianceSummary(verified=0, manual_review=0, potential_issue=0, total_rules=0),
            results=[],
            is_eligible=False,
            eligibility_status=scan.overall_assessment,
            eligibility_reason="Image lacks required packaging declaration markers.",
            validated_at=now,
            message="Image not eligible for packaged commodity compliance screening",
        )

    comp_res = compliance_service.evaluate(scan.extracted_fields, scan.raw_ocr_text or "")

    scan.compliance_status = "completed"
    scan.overall_assessment = comp_res["overall_assessment"]
    scan.compliance_summary = comp_res["summary"]
    scan.compliance_results = comp_res["rule_results"]
    scan.validated_at = now
    db.commit()
    db.refresh(scan)

    return ValidationResponse(
        success=True,
        scan_id=scan.id,
        overall_assessment=comp_res["overall_assessment"],
        overall_label=comp_res["overall_label"],
        overall_description=comp_res["overall_description"],
        disclaimer=comp_res["disclaimer"],
        summary=ComplianceSummary(**comp_res["summary"]),
        results=[ComplianceRuleResultItem(**r) for r in comp_res["rule_results"]],
        is_eligible=True,
        eligibility_status=LabelEligibilityStatus.ELIGIBLE_FOR_PACKAGE_ANALYSIS,
        validated_at=now,
        message="Compliance validation completed successfully",
    )


@router.get("/{scan_id}", response_model=ScanDetailResponse)
def get_scan_detail(
    scan_id: str,
    db: Session = Depends(get_db),
) -> ScanDetailResponse:
    """Retrieve full scan record, analysis data, and compliance evaluation results."""
    image_service = ImageService(db)
    scan = image_service.get_scan(scan_id)

    is_eligible = scan.compliance_status != "not_performed" and scan.overall_assessment not in [
        LabelEligibilityStatus.INSUFFICIENT_PACKAGE_LABEL_EVIDENCE,
        LabelEligibilityStatus.NO_READABLE_TEXT,
    ]

    return ScanDetailResponse(
        id=scan.id,
        filename=scan.filename,
        original_filename=scan.original_filename,
        file_size=scan.file_size,
        mime_type=scan.mime_type,
        status=scan.status,
        analysis_status=scan.analysis_status,
        compliance_status=scan.compliance_status,
        overall_assessment=scan.overall_assessment,
        compliance_summary=scan.compliance_summary,
        compliance_results=scan.compliance_results,
        is_eligible=is_eligible,
        eligibility_status=scan.overall_assessment,
        created_at=scan.created_at,
        analyzed_at=scan.analyzed_at,
        validated_at=scan.validated_at,
        raw_ocr_text=scan.raw_ocr_text,
        ocr_results=scan.ocr_results,
        extracted_fields=scan.extracted_fields,
        analysis_error=scan.analysis_error,
    )


@router.get("/{scan_id}/image")
def get_scan_image(
    scan_id: str,
    db: Session = Depends(get_db),
):
    """Retrieve the original uploaded image file for preview/display."""
    image_service = ImageService(db)
    scan = image_service.get_scan(scan_id)

    file_path = Path(scan.file_path)
    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image file not found on disk.",
        )

    return FileResponse(
        path=file_path,
        media_type=scan.mime_type or "image/jpeg",
        filename=scan.original_filename,
    )


@router.get("/{scan_id}/evidence", response_model=EvidenceResponse)
def get_scan_evidence(
    scan_id: str,
    db: Session = Depends(get_db),
) -> EvidenceResponse:
    """
    Retrieve real visual evidence mapping for all extracted package declarations.
    Maps each field to exact OCR lines, bounding boxes, and normalized percentages.
    """
    image_service = ImageService(db)
    scan = image_service.get_scan(scan_id)

    if not scan.extracted_fields or not scan.ocr_results:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Scan has not been analyzed yet. Run /analyze before retrieving visual evidence.",
        )

    # If scan was flagged as ineligible, return clean suspended evidence response
    if scan.compliance_status == "not_performed" or scan.overall_assessment in [
        LabelEligibilityStatus.INSUFFICIENT_PACKAGE_LABEL_EVIDENCE,
        LabelEligibilityStatus.NO_READABLE_TEXT,
    ]:
        empty_declarations = {
            field: {
                "field": field,
                "display_name": name,
                "detected": False,
                "has_evidence": False,
                "detected_value": None,
                "message": "Analysis not performed for this image.",
                "evidence_blocks": [],
                "bounding_box_union": None,
            }
            for field, name in [
                ("product_name", "Generic / Common Name"),
                ("mrp", "Maximum Retail Price (MRP)"),
                ("net_quantity", "Net Quantity"),
                ("manufacturer_packer", "Manufacturer / Packer / Importer"),
                ("date_information", "Date & Batch Declarations"),
                ("consumer_care", "Consumer Care Contact"),
            ]
        }
        all_blocks = []
        for line in (scan.ocr_results or []):
            if "bounding_box" in line:
                all_blocks.append({
                    "text": line.get("text", ""),
                    "confidence": line.get("confidence", 0.0),
                    "bounding_box": line.get("bounding_box", []),
                    "normalized_rect": {"x": 0.0, "y": 0.0, "width": 0.0, "height": 0.0},
                })
        return EvidenceResponse(
            success=True,
            scan_id=scan.id,
            image_dimensions={"width": 800, "height": 600},
            total_mapped_declarations=0,
            declarations=empty_declarations,
            all_ocr_blocks=all_blocks,
        )

    # Determine image dimensions from disk
    img_dim: tuple[int, int] = (800, 600)
    try:
        from PIL import Image
        p = Path(scan.file_path)
        if p.exists():
            with Image.open(p) as im:
                img_dim = im.size  # (width, height)
    except Exception as e:
        logger.warning(f"Could not read image dimensions: {e}")

    ev_map = evidence_service.build_evidence_map(
        scan_id=scan.id,
        extracted_fields=scan.extracted_fields,
        ocr_lines=scan.ocr_results or [],
        image_dimensions=img_dim,
    )

    return EvidenceResponse(
        success=True,
        scan_id=scan.id,
        image_dimensions=ev_map["image_dimensions"],
        total_mapped_declarations=ev_map["total_mapped_declarations"],
        declarations=ev_map["declarations"],
        all_ocr_blocks=ev_map["all_ocr_blocks"],
    )


@router.get("/{scan_id}/readability")
def get_scan_readability(
    scan_id: str,
    db: Session = Depends(get_db),
):
    """
    Get objective label readability and visual clarity assessment for the scan.
    Includes Laplacian blur variance, contrast score, resolution, and per-declaration text clarity.
    """
    image_service = ImageService(db)
    scan = image_service.get_scan(scan_id)

    if not scan.extracted_fields:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Scan has not been analyzed yet. Run /analyze before fetching readability.",
        )

    is_eligible = scan.compliance_status != "not_performed" and scan.overall_assessment not in [
        LabelEligibilityStatus.INSUFFICIENT_PACKAGE_LABEL_EVIDENCE,
        LabelEligibilityStatus.NO_READABLE_TEXT,
    ]

    img_quality = readability_service.evaluate_image_quality(scan.file_path)
    readability_data = readability_service.evaluate_declarations_readability(
        extracted_fields=scan.extracted_fields,
        ocr_lines=scan.ocr_results or [],
        image_quality=img_quality,
        is_eligible=is_eligible,
    )

    return {
        "success": True,
        "scan_id": scan.id,
        "is_eligible": is_eligible,
        **readability_data,
    }


@router.post("/{scan_id}/copilot", response_model=CopilotResponse)
def query_compliance_copilot(
    scan_id: str,
    req: CopilotQueryRequest,
    db: Session = Depends(get_db),
) -> CopilotResponse:
    """
    AI Compliance Copilot query endpoint.
    Answers inspector questions deterministically using real OCR and compliance screening data.
    """
    image_service = ImageService(db)
    scan = image_service.get_scan(scan_id)

    if not scan.extracted_fields:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Scan has not been analyzed yet. Run /analyze before using Copilot.",
        )

    # If scan was flagged as ineligible, return clear guidance
    if scan.compliance_status == "not_performed" or scan.overall_assessment in [
        LabelEligibilityStatus.INSUFFICIENT_PACKAGE_LABEL_EVIDENCE,
        LabelEligibilityStatus.NO_READABLE_TEXT,
    ]:
        return CopilotResponse(
            success=True,
            scan_id=scan.id,
            intent="INSUFFICIENT_PACKAGE_EVIDENCE",
            question=req.query or "Why was analysis not performed?",
            answer=(
                "This image does not appear to be a packaged commodity label.\n\n"
                "LABEL LENS AI detected readable text, but identified insufficient evidence of a packaged commodity "
                "(such as certificates, institutional documents, or general photographs).\n\n"
                "To inspect compliance under the Legal Metrology Act, please upload a clear photograph showing the "
                "product package with mandatory declarations like MRP, Net Quantity, or Manufacturer details."
            ),
            evidence_fields=[],
            suggested_actions=["Upload front or back of product package"],
        )

    res = copilot_service.answer_query(
        scan_id=scan.id,
        extracted_fields=scan.extracted_fields,
        compliance_results=scan.compliance_results or [],
        overall_assessment=scan.overall_assessment,
        raw_ocr_text=scan.raw_ocr_text or "",
        intent=req.intent,
        query=req.query,
    )

    return CopilotResponse(
        success=True,
        scan_id=scan.id,
        intent=res["intent"],
        question=res["question"],
        answer=res["answer"],
        evidence_fields=res.get("evidence_fields", []),
        suggested_actions=res.get("suggested_actions", []),
    )


@router.get("/{scan_id}/report")
def get_scan_report(
    scan_id: str,
    db: Session = Depends(get_db),
):
    """
    Generate and download the official Legal Metrology compliance inspection report (PDF).
    Includes package metadata, overall screening result, summary metrics,
    per-declaration findings with legal references, OCR evidence, and inspector sign-off block.
    """
    image_service = ImageService(db)
    scan = image_service.get_scan(scan_id)

    if not scan.extracted_fields:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Scan has not been analyzed yet. Run /analyze before generating an inspection report.",
        )

    isIneligible = scan.compliance_status == "not_performed" or scan.overall_assessment in [
        LabelEligibilityStatus.INSUFFICIENT_PACKAGE_LABEL_EVIDENCE,
        LabelEligibilityStatus.NO_READABLE_TEXT,
    ]

    # Ensure validation results are computed and present
    if scan.compliance_results is None:
        if isIneligible:
            scan.compliance_results = []
            scan.compliance_summary = {"verified": 0, "manual_review": 0, "potential_issue": 0, "total_rules": 0}
        else:
            comp_res = compliance_service.evaluate(scan.extracted_fields, scan.raw_ocr_text or "")
            scan.compliance_status = "completed"
            scan.overall_assessment = comp_res["overall_assessment"]
            scan.compliance_summary = comp_res["summary"]
            scan.compliance_results = comp_res["rule_results"]
            scan.validated_at = datetime.now(timezone.utc)
            db.commit()
            db.refresh(scan)

    scan_data = {
        "original_filename": scan.original_filename,
        "extracted_fields": scan.extracted_fields or {},
        "created_at": scan.created_at,
    }

    validation_data = {
        "overall_assessment": scan.overall_assessment or ("INSUFFICIENT_PACKAGE_LABEL_EVIDENCE" if isIneligible else "manual_review_recommended"),
        "overall_label": "Analysis Not Performed" if isIneligible else (scan.overall_assessment or "manual_review_recommended").replace("_", " ").title(),
        "overall_description": (
            "This image does not appear to be a packaged commodity label. Compliance screening was safely suspended."
            if isIneligible
            else "Automated Legal Metrology screening assessment based on detected declarations."
        ),
        "disclaimer": "This assessment is based on automated analysis of the uploaded image and should be manually verified where required.",
        "summary": scan.compliance_summary or {"verified": 0, "manual_review": 0, "potential_issue": 0, "total_rules": 0},
        "results": scan.compliance_results or [],
    }

    img_quality = readability_service.evaluate_image_quality(scan.file_path)
    validation_data["readability"] = readability_service.evaluate_declarations_readability(
        extracted_fields=scan.extracted_fields or {},
        ocr_lines=scan.ocr_results or [],
        image_quality=img_quality,
        is_eligible=not isIneligible,
    )

    try:
        pdf_bytes = report_service.generate_pdf_report(
            scan_id=scan.id,
            scan_data=scan_data,
            validation_data=validation_data,
            image_path=scan.file_path,
        )
    except Exception as e:
        logger.error(f"Failed to render PDF report: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="We could not generate the report. Please try again.",
        )

    filename = f"LabelLensAI_Report_{scan.id[:8]}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=\"{filename}\"",
            "Content-Type": "application/pdf",
        },
    )
