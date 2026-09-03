"""Image service — handles upload validation, storage, and scan record creation.

This is the only fully functional service in Phase 1.
"""
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models.scan import Scan
from app.schemas.scan import UploadResponse

ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
}

MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB

# Extension map derived from MIME type
EXTENSION_MAP = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/heic": ".heic",
    "image/heif": ".heif",
}


class ImageService:
    """Handles image upload, validation, disk persistence, and DB record creation."""

    def __init__(self, db: Session) -> None:
        self.db = db
        self.settings = get_settings()
        self._ensure_upload_dir()

    def _ensure_upload_dir(self) -> None:
        self.settings.upload_dir.mkdir(parents=True, exist_ok=True)

    async def handle_upload(self, file: UploadFile) -> UploadResponse:
        """Validate, store the image, create a Scan record, and return a response."""
        # --- 1. Validate content type ---
        content_type = (file.content_type or "").lower()
        if content_type not in ALLOWED_CONTENT_TYPES:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail=(
                    f"Unsupported file type: '{content_type}'. "
                    "Accepted types: JPEG, PNG, WebP, HEIC."
                ),
            )

        # --- 2. Read content and validate size ---
        contents = await file.read()
        file_size = len(contents)
        if file_size == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty.",
            )
        if file_size > MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="File too large. Maximum allowed size is 10 MB.",
            )

        # --- 3. Generate a unique filename and save to disk ---
        scan_id = str(uuid.uuid4())
        ext = EXTENSION_MAP.get(content_type, ".jpg")
        stored_filename = f"{scan_id}{ext}"
        file_path = self.settings.upload_dir / stored_filename

        try:
            file_path.write_bytes(contents)
        except OSError as exc:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save the uploaded file.",
            ) from exc

        # --- 4. Create Scan record in database ---
        original_filename = file.filename or stored_filename
        now = datetime.now(timezone.utc)

        scan = Scan(
            id=scan_id,
            filename=stored_filename,
            original_filename=original_filename,
            file_path=str(file_path.resolve()),
            file_size=file_size,
            mime_type=content_type,
            status="uploaded",
            created_at=now,
            updated_at=now,
        )
        self.db.add(scan)
        self.db.commit()
        self.db.refresh(scan)

        return UploadResponse(
            success=True,
            image_id=scan.id,
            filename=scan.filename,
            original_filename=scan.original_filename,
            upload_timestamp=scan.created_at,
            file_size=scan.file_size,
            message="Image uploaded successfully",
        )

    def get_scan(self, scan_id: str) -> Scan:
        """Fetch a Scan record by ID or raise 404."""
        scan = self.db.query(Scan).filter(Scan.id == scan_id).first()
        if not scan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Scan with ID '{scan_id}' not found.",
            )
        return scan

    def preprocess_image_for_ocr(self, scan: Scan):
        """
        Modular OpenCV preprocessing pipeline for package label images:
        - Safe image loading (handles various formats and Unicode paths)
        - Smart aspect-ratio preserving resizing (downscales massive images, upscales tiny ones)
        - CLAHE contrast enhancement on Luminance (LAB color space) to handle glare/gloss/shadows
        - Edge-preserving bilateral filtering to reduce noise while keeping font boundaries crisp
        - Returns (preprocessed_image_ndarray, preprocessed_path)
        Original uploaded file remains untouched.
        """
        import cv2
        import numpy as np

        file_path = Path(scan.file_path)
        if not file_path.exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Image file not found on disk.",
            )

        # 1. Read image safely (supports non-ASCII paths on Windows)
        try:
            with open(file_path, "rb") as f:
                bytes_data = np.frombuffer(f.read(), dtype=np.uint8)
                img = cv2.imdecode(bytes_data, cv2.IMREAD_COLOR)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to decode image: {str(e)}",
            )

        if img is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not decode image file as a valid graphic.",
            )

        h, w = img.shape[:2]

        # 2. Resizing for optimal OCR:
        # If image is very large (> 2200px), downsample to avoid memory blowup and OCR lag
        # If image is tiny (< 500px), upsample with bicubic interpolation so small fonts become readable
        max_dim = max(h, w)
        min_dim = min(h, w)
        scale = 1.0

        if max_dim > 2200:
            scale = 2200.0 / max_dim
        elif min_dim < 500 and min_dim > 0:
            scale = min(2.0, 600.0 / min_dim)

        if scale != 1.0:
            new_w = int(w * scale)
            new_h = int(h * scale)
            interp = cv2.INTER_AREA if scale < 1.0 else cv2.INTER_CUBIC
            img = cv2.resize(img, (new_w, new_h), interpolation=interp)

        # 3. Contrast enhancement using CLAHE in LAB color space
        # Enhances local contrast on the L-channel without distorting color or blowing out bright label text
        try:
            lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
            l, a, b = cv2.split(lab)
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
            cl = clahe.apply(l)
            limg = cv2.merge((cl, a, b))
            enhanced = cv2.cvtColor(limg, cv2.COLOR_LAB2BGR)
        except Exception:
            enhanced = img

        # 4. Mild bilateral filter (preserves sharp text edges while removing high-frequency camera noise)
        try:
            processed = cv2.bilateralFilter(enhanced, d=5, sigmaColor=50, sigmaSpace=50)
        except Exception:
            processed = enhanced

        # 5. Save processed copy separately (original remains untouched)
        processed_filename = f"{scan.id}_processed.jpg"
        processed_path = self.settings.upload_dir / processed_filename
        try:
            cv2.imwrite(str(processed_path.resolve()), processed, [int(cv2.IMWRITE_JPEG_QUALITY), 95])
        except Exception:
            # If writing fails, we still have the in-memory ndarray
            processed_path = file_path

        return processed, processed_path
