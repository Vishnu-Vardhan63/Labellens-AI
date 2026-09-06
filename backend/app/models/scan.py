"""Scan ORM model — represents one package scan session."""
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Integer, String, Text, JSON

from app.database import Base


class ScanStatus(str):
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class AnalysisStatus(str):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class Scan(Base):
    __tablename__ = "scans"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    filename = Column(String(255), nullable=False)          # stored filename (uuid-based)
    original_filename = Column(String(255), nullable=False)  # original upload filename
    file_path = Column(String(512), nullable=False)          # absolute path on disk
    file_size = Column(Integer, nullable=False)
    mime_type = Column(String(64), nullable=False)
    status = Column(
        String(20),
        nullable=False,
        default="uploaded",
    )
    
    # Phase 2: Analysis & OCR Data
    analysis_status = Column(
        String(20),
        nullable=False,
        default="pending",
    )
    raw_ocr_text = Column(Text, nullable=True)
    ocr_results = Column(JSON, nullable=True)             # List of {text, confidence, bounding_box}
    extracted_fields = Column(JSON, nullable=True)        # Structured package data dictionary
    analysis_error = Column(Text, nullable=True)
    analyzed_at = Column(DateTime(timezone=True), nullable=True)

    # Phase 3: Compliance Validation
    compliance_status = Column(
        String(30),
        nullable=False,
        default="pending",
    )
    overall_assessment = Column(String(50), nullable=True)
    compliance_summary = Column(JSON, nullable=True)
    compliance_results = Column(JSON, nullable=True)
    validated_at = Column(DateTime(timezone=True), nullable=True)

    # Final Phase: Human-in-the-Loop Inspector Review
    inspector_decision = Column(String(50), nullable=True)  # confirmed, manual_review, better_image_requested
    inspector_notes = Column(Text, nullable=True)
    inspector_reviewed_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
