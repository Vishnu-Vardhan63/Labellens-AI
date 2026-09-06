from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class UploadResponse(BaseModel):
    """Response returned after a successful image upload."""
    success: bool = True
    image_id: str = Field(..., description="UUID of the created scan record")
    filename: str = Field(..., description="Server-side stored filename")
    original_filename: str = Field(..., description="Original filename as uploaded")
    upload_timestamp: datetime = Field(..., description="UTC timestamp of upload")
    file_size: int = Field(..., description="File size in bytes")
    message: str = "Image uploaded successfully"


class HealthResponse(BaseModel):
    """Response for the GET /health endpoint."""
    status: str = "ok"
    version: str = "1.0.0"
    environment: str
    timestamp: datetime
    database: str


class OcrLineItem(BaseModel):
    text: str
    confidence: float
    bounding_box: list[list[float]]


class OcrSummary(BaseModel):
    line_count: int
    average_confidence: float
    engine: str = "PaddleOCR (ONNX)"


class AnalysisResponse(BaseModel):
    """Response returned by POST /api/scans/{scan_id}/analyze."""
    success: bool = True
    scan_id: str
    analysis_status: str
    analysis_timestamp: datetime
    raw_ocr_text: str = ""
    ocr_lines: list[dict] = []
    ocr_summary: dict = {}
    extracted_fields: dict
    label_detection: Optional[dict] = None
    message: str = "Analysis completed successfully"


class ScanDetailResponse(BaseModel):
    """Full detail of a scan session, its analysis, and compliance results."""
    id: str
    filename: str
    original_filename: str
    file_size: int
    mime_type: str
    status: str
    analysis_status: str
    compliance_status: Optional[str] = "pending"
    overall_assessment: Optional[str] = None
    compliance_summary: Optional[dict] = None
    compliance_results: Optional[list] = None
    is_eligible: Optional[bool] = True
    is_partial_panel: Optional[bool] = False
    package_eligibility: Optional[str] = None
    compliance_evidence: Optional[str] = None
    eligibility_status: Optional[str] = None
    created_at: datetime
    analyzed_at: Optional[datetime] = None
    validated_at: Optional[datetime] = None
    raw_ocr_text: Optional[str] = None
    ocr_results: Optional[list] = None
    extracted_fields: Optional[dict] = None
    analysis_error: Optional[str] = None
    inspector_decision: Optional[str] = None
    inspector_notes: Optional[str] = None
    inspector_reviewed_at: Optional[datetime] = None


class InspectorReviewRequest(BaseModel):
    """Request payload for POST /api/scans/{scan_id}/review."""
    decision: str = Field(..., description="confirmed | manual_review | better_image_requested")
    notes: Optional[str] = Field(None, description="Optional inspector audit notes")


class InspectorReviewResponse(BaseModel):
    """Response returned by POST /api/scans/{scan_id}/review."""
    success: bool = True
    scan_id: str
    inspector_decision: str
    inspector_notes: Optional[str] = None
    inspector_reviewed_at: datetime
    message: str = "Inspector review decision recorded successfully"


class ComplianceRuleResultItem(BaseModel):
    rule_id: str
    field: str
    display_name: str
    legal_reference: Optional[str] = None
    severity: str = "medium"
    status: str  # "verified", "manual_review", "potential_issue", "not_detected"
    extracted_value: Optional[str] = None
    confidence: str = "not_detected"
    explanation: str
    evidence: Optional[str] = None
    recommendation: Optional[str] = None


class ComplianceSummary(BaseModel):
    verified: int
    manual_review: int
    potential_issue: int
    total_rules: int


class ValidationResponse(BaseModel):
    """Response returned by POST /api/scans/{scan_id}/validate."""
    success: bool = True
    scan_id: str
    overall_assessment: str
    overall_label: str
    overall_description: str
    disclaimer: str
    summary: ComplianceSummary
    results: List[ComplianceRuleResultItem]
    is_eligible: bool = True
    is_partial_panel: bool = False
    package_eligibility: Optional[str] = None
    compliance_evidence: Optional[str] = None
    eligibility_status: Optional[str] = None
    eligibility_reason: Optional[str] = None
    validated_at: datetime
    message: str = "Compliance validation completed successfully"


# --- Phase 4: Visual Evidence & Copilot Schemas ---

class EvidenceBlock(BaseModel):
    text: str
    confidence: float
    bounding_box: List[List[float]]
    normalized_rect: Dict[str, float]


class DeclarationEvidence(BaseModel):
    field: str
    display_name: str
    detected: bool
    has_evidence: bool
    detected_value: Optional[str] = None
    raw_text: Optional[str] = None
    message: Optional[str] = None
    evidence_blocks: List[EvidenceBlock] = []
    bounding_box_union: Optional[Dict[str, float]] = None


class EvidenceResponse(BaseModel):
    """Response returned by GET /api/scans/{scan_id}/evidence."""
    success: bool = True
    scan_id: str
    image_dimensions: Dict[str, int]
    total_mapped_declarations: int
    declarations: Dict[str, DeclarationEvidence]
    all_ocr_blocks: List[Dict[str, Any]] = []


class CopilotQueryRequest(BaseModel):
    """Request payload for POST /api/scans/{scan_id}/copilot."""
    intent: Optional[str] = None
    query: Optional[str] = None


class CopilotResponse(BaseModel):
    """Response returned by POST /api/scans/{scan_id}/copilot."""
    success: bool = True
    scan_id: str
    intent: str
    question: str
    answer: str
    evidence_fields: List[str] = []
    suggested_actions: List[str] = []
