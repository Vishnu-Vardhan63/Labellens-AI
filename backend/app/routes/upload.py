"""POST /api/upload — image upload endpoint."""
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.scan import UploadResponse
from app.services.image_service import ImageService

router = APIRouter(prefix="/api", tags=["Upload"])


@router.post("/upload", response_model=UploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_image(
    file: UploadFile = File(..., description="Package label image"),
    db: Session = Depends(get_db),
) -> UploadResponse:
    """
    Accept an image file, validate it, persist it to disk, and create a Scan record.

    Returns the scan ID, filename, and upload timestamp.
    Phase 2 will add OCR processing triggered from this endpoint.
    """
    service = ImageService(db)
    return await service.handle_upload(file)
