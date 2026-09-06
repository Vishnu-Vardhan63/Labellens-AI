"""
Inspection Dashboard & History Routes for LABEL LENS AI.
Provides real-data statistics, recent inspections, and searchable inspection history.
Grounded strictly in stored database records — zero hardcoded fake stats or mock items.
"""
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models.scan import Scan
from app.services.image_service import ImageService
from app.services.label_gate_service import LabelEligibilityStatus

router = APIRouter(tags=["dashboard"])

def _format_scan_item(s: Scan) -> Dict[str, Any]:
    extracted = s.extracted_fields or {}
    label_det = extracted.get("label_detection") or {}
    is_eligible = (
        label_det.get("is_eligible") is not False
        and s.overall_assessment not in [
            LabelEligibilityStatus.INSUFFICIENT_PACKAGE_LABEL_EVIDENCE,
            LabelEligibilityStatus.NO_READABLE_TEXT,
        ]
    )

    product_name_obj = extracted.get("product_name") or {}
    product_name = product_name_obj.get("value")
    if not product_name:
        if not is_eligible:
            product_name = "Non-Package Document / Certificate" if s.overall_assessment == LabelEligibilityStatus.INSUFFICIENT_PACKAGE_LABEL_EVIDENCE else "Unreadable Image"
        else:
            product_name = "Packaged Commodity (Unlabeled Title)"

    # Label & assessment
    overall = s.overall_assessment or "uploaded"
    if overall == "information_verified":
        overall_label = "Information Verified"
        status_category = "verified"
    elif overall == "manual_review_recommended":
        overall_label = "Manual Review Recommended"
        status_category = "manual_review"
    elif overall == "potential_issues_detected":
        overall_label = "Potential Issue Detected"
        status_category = "potential_issue"
    elif overall == LabelEligibilityStatus.INSUFFICIENT_PACKAGE_LABEL_EVIDENCE:
        overall_label = "Analysis Not Performed"
        status_category = "ineligible"
    elif overall == LabelEligibilityStatus.NO_READABLE_TEXT:
        overall_label = "No Readable Text"
        status_category = "ineligible"
    else:
        overall_label = "Uploaded"
        status_category = "uploaded"

    return {
        "id": s.id,
        "product_name": product_name,
        "original_filename": s.original_filename,
        "created_at": s.created_at.isoformat() if s.created_at else None,
        "status": s.status,
        "compliance_status": s.compliance_status,
        "overall_assessment": s.overall_assessment,
        "overall_label": overall_label,
        "status_category": status_category,
        "is_eligible": is_eligible,
        "summary": s.compliance_summary or {"verified": 0, "manual_review": 0, "potential_issue": 0, "total_rules": 0},
    }

@router.get("/api/dashboard/stats")
def get_dashboard_stats(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Get real-time database metrics for the Inspection Dashboard.
    Uses real database counts — zero synthetic or fake data.
    """
    all_scans = db.query(Scan).order_by(desc(Scan.created_at)).all()
    total_scans = len(all_scans)

    eligible_count = 0
    verified_count = 0
    manual_review_count = 0
    potential_issues_count = 0
    ineligible_count = 0

    recent_items = []
    for s in all_scans:
        item = _format_scan_item(s)
        if len(recent_items) < 10:
            recent_items.append(item)

        if item["is_eligible"]:
            eligible_count += 1
            if item["overall_assessment"] == "information_verified":
                verified_count += 1
            elif item["overall_assessment"] == "manual_review_recommended":
                manual_review_count += 1
            elif item["overall_assessment"] == "potential_issues_detected":
                potential_issues_count += 1
        else:
            ineligible_count += 1

    return {
        "total_scans": total_scans,
        "eligible_analyses": eligible_count,
        "verified_count": verified_count,
        "requires_manual_review": manual_review_count,
        "potential_issues": potential_issues_count,
        "ineligible_count": ineligible_count,
        "recent_inspections": recent_items,
    }

@router.get("/api/scans")
def list_scans(
    query: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Search and filter inspection history from real database records.
    Supports filtering by product name, scan ID, or compliance status.
    """
    scans_query = db.query(Scan).order_by(desc(Scan.created_at))
    all_scans = scans_query.all()

    filtered_items = []
    q_clean = query.strip().lower() if query else None

    for s in all_scans:
        item = _format_scan_item(s)

        # Status filter
        if status_filter and status_filter.lower() != "all":
            sf = status_filter.lower()
            if sf in ["verified", "information_verified"] and item["status_category"] != "verified":
                continue
            elif sf in ["review", "manual_review", "manual_review_recommended"] and item["status_category"] != "manual_review":
                continue
            elif sf in ["issue", "issues", "potential_issue", "potential_issues_detected"] and item["status_category"] != "potential_issue":
                continue
            elif sf in ["ineligible", "not_analyzed"] and item["status_category"] != "ineligible":
                continue

        # Text search filter
        if q_clean:
            match_id = q_clean in item["id"].lower()
            match_name = q_clean in item["product_name"].lower()
            match_file = q_clean in item["original_filename"].lower()
            if not (match_id or match_name or match_file):
                continue

        filtered_items.append(item)

    total_matched = len(filtered_items)
    paginated = filtered_items[offset : offset + limit]

    return {
        "total": total_matched,
        "limit": limit,
        "offset": offset,
        "items": paginated,
    }
