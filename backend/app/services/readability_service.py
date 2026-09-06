"""
Readability Assessment Service for LABEL LENS AI.
Evaluates visual clarity, sharpness (Laplacian variance), contrast, resolution,
estimated character heights, and per-declaration OCR confidence.

Complies strictly with Legal Metrology safety guidelines:
Does NOT claim legal font-size compliance from pixel data alone;
Provides objective visual clarity assessments and recommendations.
"""
from typing import Dict, Any, List, Optional
import cv2
import numpy as np
import logging

logger = logging.getLogger(__name__)

STATUTORY_DISCLAIMER = (
    "Visual readability assessment only. Legal font-size verification under the "
    "Legal Metrology (Packaged Commodities) Rules, 2011 requires physical package "
    "dimensions and calibrated measurement."
)

class ReadabilityService:
    def evaluate_image_quality(self, image_path: str) -> Dict[str, Any]:
        """
        Analyze physical image metrics: resolution, blur/sharpness, and contrast.
        """
        try:
            img = cv2.imread(image_path)
            if img is None:
                return self._default_image_quality()

            h, w = img.shape[:2]
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

            # 1. Blur / Sharpness via Laplacian Variance
            laplacian_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
            if laplacian_var >= 150.0:
                sharpness_label = "Sharp"
                sharpness_rating = "good"
            elif laplacian_var >= 50.0:
                sharpness_label = "Moderate"
                sharpness_rating = "moderate"
            else:
                sharpness_label = "Low (Blur Detected)"
                sharpness_rating = "poor"

            # 2. Contrast via Luminance Standard Deviation
            contrast_std = float(np.std(gray))
            if contrast_std >= 45.0:
                contrast_label = "High Contrast"
                contrast_rating = "good"
            elif contrast_std >= 25.0:
                contrast_label = "Adequate Contrast"
                contrast_rating = "moderate"
            else:
                contrast_label = "Low Contrast"
                contrast_rating = "poor"

            # 3. Overall Image Quality Score
            if sharpness_rating == "good" and contrast_rating in ["good", "moderate"]:
                overall_quality = "Good"
            elif sharpness_rating == "poor" or contrast_rating == "poor":
                overall_quality = "Low"
            else:
                overall_quality = "Moderate"

            return {
                "width": w,
                "height": h,
                "megapixels": round((w * h) / 1_000_000, 2),
                "sharpness_score": round(laplacian_var, 1),
                "sharpness_label": sharpness_label,
                "sharpness_rating": sharpness_rating,
                "contrast_score": round(contrast_std, 1),
                "contrast_label": contrast_label,
                "contrast_rating": contrast_rating,
                "overall_quality": overall_quality,
            }
        except Exception as e:
            logger.warning(f"Failed to assess image quality: {e}")
            return self._default_image_quality()

    def evaluate_declarations_readability(
        self,
        extracted_fields: Dict[str, Any],
        ocr_lines: List[Dict[str, Any]],
        image_quality: Dict[str, Any],
        is_eligible: bool = True,
    ) -> Dict[str, Any]:
        """
        Evaluate readability and text clarity for each tracked packaging declaration.
        """
        if not is_eligible:
            return {
                "is_eligible": False,
                "status": "NOT_ANALYZED",
                "message": "Readability screening suspended: Image is not an eligible packaged commodity.",
                "declarations": {},
                "disclaimer": STATUTORY_DISCLAIMER,
            }

        decl_keys = [
            ("product_name", "Product Identity"),
            ("mrp", "Maximum Retail Price (MRP)"),
            ("net_quantity", "Net Quantity"),
            ("manufacturer_packer", "Manufacturer / Packer"),
            ("date_information", "Date / Batch Information"),
            ("consumer_care", "Consumer Grievance Care"),
        ]

        readability_results = {}
        all_ratings = []

        for key, display_name in decl_keys:
            field_data = extracted_fields.get(key, {})
            detected = field_data.get("detected", False)
            conf = field_data.get("confidence", 0.0)

            if not detected:
                readability_results[key] = {
                    "display_name": display_name,
                    "detected": False,
                    "readability": "Not Detected",
                    "text_clarity": "Not Detected on Panel",
                    "ocr_confidence": "N/A",
                    "pixel_height": None,
                    "notes": "Declaration was not detected from the uploaded image panel.",
                    "recommendation": "Inspect physical package for declaration presence.",
                }
                continue

            # Find matching OCR line bounding boxes to estimate character height
            raw_text = str(field_data.get("raw_text") or field_data.get("value") or "").lower()
            matched_heights = []
            for line in ocr_lines:
                line_text = line.get("text", "").lower()
                # Check for overlap
                if any(word in line_text for word in raw_text.split() if len(word) > 2):
                    box = line.get("bounding_box", [])
                    if len(box) == 4:
                        ys = [pt[1] for pt in box]
                        height = max(ys) - min(ys)
                        if height > 0:
                            matched_heights.append(height)

            avg_pixel_height = round(float(np.mean(matched_heights)), 1) if matched_heights else None

            # Determine text clarity and rating
            if conf >= 0.85 and image_quality.get("sharpness_rating") != "poor":
                readability = "Good"
                text_clarity = "Clear Typography"
                notes = f"High OCR confidence ({round(conf * 100)}%) with sharp edge definition."
                recommendation = "Visual evidence is legible and clear."
                all_ratings.append("good")
            elif conf >= 0.65:
                readability = "Moderate"
                text_clarity = "Moderate Clarity"
                notes = f"Moderate OCR confidence ({round(conf * 100)}%). Legible under digital inspection."
                recommendation = "Verify against physical package if high precision is required."
                all_ratings.append("moderate")
            else:
                readability = "Low Readability"
                text_clarity = "Low / Degraded Clarity"
                notes = (
                    f"Low OCR confidence ({round(conf * 100)}%). "
                    "May be affected by packaging curvature, gloss glare, or low contrast."
                )
                recommendation = "Capture a clearer image or manually inspect the package."
                all_ratings.append("low")

            readability_results[key] = {
                "display_name": display_name,
                "detected": True,
                "readability": readability,
                "text_clarity": text_clarity,
                "ocr_confidence": f"{round(conf * 100)}%",
                "pixel_height": avg_pixel_height,
                "notes": notes,
                "recommendation": recommendation,
            }

        # Overall summary rating
        if "low" in all_ratings:
            overall_readability = "Attention Recommended"
        elif all_ratings:
            overall_readability = "Clear & Legible"
        else:
            overall_readability = "Not Evaluated"

        return {
            "is_eligible": True,
            "overall_readability": overall_readability,
            "image_quality": image_quality,
            "declarations": readability_results,
            "disclaimer": STATUTORY_DISCLAIMER,
        }

    def _default_image_quality(self) -> Dict[str, Any]:
        return {
            "width": 0,
            "height": 0,
            "megapixels": 0.0,
            "sharpness_score": 0.0,
            "sharpness_label": "Unknown",
            "sharpness_rating": "moderate",
            "contrast_score": 0.0,
            "contrast_label": "Unknown",
            "contrast_rating": "moderate",
            "overall_quality": "Moderate",
        }

readability_service = ReadabilityService()
