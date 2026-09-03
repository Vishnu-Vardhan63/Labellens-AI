"""OCR Service — Phase 2.

Provides optical character recognition for package label images using PaddleOCR
(via the RapidOCR ONNX runtime engine).

Captures:
- Extracted text
- Exact 4-point bounding boxes
- Confidence scores
- Preserves top-to-bottom, left-to-right reading order
- Abstracted so another engine can be substituted cleanly
"""
from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

import numpy as np

logger = logging.getLogger(__name__)

# Global cached engine instance
_ENGINE_INSTANCE: Optional[Any] = None


def get_ocr_engine():
    """Lazy-load and cache the RapidOCR (PaddleOCR ONNX) engine."""
    global _ENGINE_INSTANCE
    if _ENGINE_INSTANCE is None:
        try:
            from rapidocr_onnxruntime import RapidOCR
            _ENGINE_INSTANCE = RapidOCR()
            logger.info("RapidOCR (PaddleOCR ONNX engine) initialized successfully.")
        except Exception as e:
            logger.error(f"Failed to initialize RapidOCR engine: {e}")
            raise RuntimeError(f"OCR engine initialization failed: {e}") from e
    return _ENGINE_INSTANCE


class OcrService:
    """Production OCR service for package label text detection."""

    def __init__(self, engine=None) -> None:
        self.engine = engine or get_ocr_engine()

    def run_ocr(self, image_input: Union[Path, str, np.ndarray]) -> Dict[str, Any]:
        """
        Run OCR on an image file path or numpy array.

        Returns:
            dict containing:
                - lines: list of dicts with text, confidence, bounding_box
                - raw_text: full concatenated text preserving reading order
                - line_count: total detected lines
                - average_confidence: mean confidence score (0.0 to 1.0)
                - engine: name of OCR provider used
        """
        img_arg: Any = image_input
        if isinstance(image_input, (str, Path)):
            import cv2
            path = Path(image_input)
            if not path.exists():
                raise FileNotFoundError(f"Image not found at {path}")
            with open(path, "rb") as f:
                bytes_data = np.frombuffer(f.read(), dtype=np.uint8)
                img_arg = cv2.imdecode(bytes_data, cv2.IMREAD_COLOR)

        try:
            raw_results, elapse = self.engine(img_arg)
        except Exception as e:
            logger.error(f"OCR inference failed: {e}")
            return {
                "lines": [],
                "raw_text": "",
                "line_count": 0,
                "average_confidence": 0.0,
                "engine": "PaddleOCR (ONNX)",
                "error": str(e),
            }

        if not raw_results:
            return {
                "lines": [],
                "raw_text": "",
                "line_count": 0,
                "average_confidence": 0.0,
                "engine": "PaddleOCR (ONNX)",
            }

        # raw_results format from RapidOCR:
        # [ [ [[x1,y1], [x2,y2], [x3,y3], [x4,y4]], text_str, score_str_or_float ], ... ]
        parsed_blocks = []
        for item in raw_results:
            if len(item) < 3:
                continue
            box, text, score = item[0], item[1], item[2]
            clean_text = str(text).strip()
            if not clean_text:
                continue
            try:
                conf = float(score)
            except (ValueError, TypeError):
                conf = 0.5

            # Calculate box geometric properties for reading-order sorting
            pts = [(float(p[0]), float(p[1])) for p in box]
            min_y = min(p[1] for p in pts)
            min_x = min(p[0] for p in pts)
            max_y = max(p[1] for p in pts)
            height = max_y - min_y

            parsed_blocks.append({
                "text": clean_text,
                "confidence": round(conf, 4),
                "bounding_box": [[round(p[0], 1), round(p[1], 1)] for p in pts],
                "_min_y": min_y,
                "_min_x": min_x,
                "_height": max(height, 8.0),
            })

        # Sort lines into natural human reading order:
        # 1. Sort primarily by vertical position (Y).
        # 2. Cluster items within roughly the same vertical line band (tolerance = half line height).
        # 3. Sort left-to-right (X) within each band.
        sorted_lines = self._sort_reading_order(parsed_blocks)

        # Build clean output without internal sort keys
        output_lines = []
        conf_sum = 0.0
        for block in sorted_lines:
            output_lines.append({
                "text": block["text"],
                "confidence": block["confidence"],
                "bounding_box": block["bounding_box"],
            })
            conf_sum += block["confidence"]

        avg_conf = round(conf_sum / len(output_lines), 4) if output_lines else 0.0
        raw_text = "\n".join(b["text"] for b in output_lines)

        return {
            "lines": output_lines,
            "raw_text": raw_text,
            "line_count": len(output_lines),
            "average_confidence": avg_conf,
            "engine": "PaddleOCR (ONNX)",
        }

    def _sort_reading_order(self, blocks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Sort detected text blocks in natural reading order (top-to-bottom, left-to-right)."""
        if not blocks:
            return []

        # Sort by Y first
        sorted_by_y = sorted(blocks, key=lambda b: b["_min_y"])

        # Group lines with overlapping vertical spans
        lines: List[List[Dict[str, Any]]] = []
        current_line: List[Dict[str, Any]] = [sorted_by_y[0]]
        current_y = sorted_by_y[0]["_min_y"]
        current_h = sorted_by_y[0]["_height"]

        for b in sorted_by_y[1:]:
            y_diff = abs(b["_min_y"] - current_y)
            # If within 50% of current line height, consider same horizontal line
            if y_diff <= (current_h * 0.5):
                current_line.append(b)
            else:
                lines.append(sorted(current_line, key=lambda x: x["_min_x"]))
                current_line = [b]
                current_y = b["_min_y"]
                current_h = b["_height"]

        if current_line:
            lines.append(sorted(current_line, key=lambda x: x["_min_x"]))

        # Flatten
        ordered = []
        for line in lines:
            ordered.extend(line)
        return ordered
