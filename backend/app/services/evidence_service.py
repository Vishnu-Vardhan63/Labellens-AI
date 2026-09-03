"""Evidence Service — Phase 4.

Connects extracted package declarations with real OCR bounding box coordinates.
Provides deterministic, explainable field-to-evidence mapping without fabricating data.

Capabilities:
- Deterministic text and token matching against actual OCR blocks
- Multiple evidence block aggregation (e.g. manufacturer name + address lines)
- Normalized percentage coordinates (0% to 100%) for responsive image overlay
- Honest fallbacks when visual evidence cannot be mapped
"""
from __future__ import annotations

import logging
import re
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)


class EvidenceService:
    """Service to map extracted declarations to physical OCR bounding boxes."""

    def build_evidence_map(
        self,
        scan_id: str,
        extracted_fields: Dict[str, Any],
        ocr_lines: List[Dict[str, Any]],
        image_dimensions: Optional[Tuple[int, int]] = None,
    ) -> Dict[str, Any]:
        """
        Map all extracted fields to their supporting OCR line blocks and bounding boxes.

        Args:
            scan_id: Unique scan identifier
            extracted_fields: Dict from extraction_service
            ocr_lines: List of {text, confidence, bounding_box} from ocr_service
            image_dimensions: (width, height) of image in coordinate space of OCR

        Returns:
            Structured evidence mapping dictionary
        """
        img_w, img_h = self._resolve_dimensions(ocr_lines, image_dimensions)

        declarations: Dict[str, Any] = {}
        fields_to_check = [
            ("product_name", "Generic / Common Name", self._match_product_name),
            ("mrp", "Maximum Retail Price (MRP)", self._match_mrp),
            ("net_quantity", "Net Quantity", self._match_net_quantity),
            ("manufacturer_packer", "Manufacturer / Packer / Importer", self._match_manufacturer),
            ("date_information", "Date & Batch Declarations", self._match_dates),
            ("consumer_care", "Consumer Care Contact", self._match_consumer_care),
        ]

        mapped_count = 0
        for field_key, display_name, matcher in fields_to_check:
            field_data = extracted_fields.get(field_key, {})
            detected = field_data.get("detected", False)
            raw_text = field_data.get("raw_text")

            if not detected:
                declarations[field_key] = {
                    "field": field_key,
                    "display_name": display_name,
                    "detected": False,
                    "has_evidence": False,
                    "detected_value": None,
                    "message": "Field was not detected from this image.",
                    "evidence_blocks": [],
                    "bounding_box_union": None,
                }
                continue

            # Find matching OCR blocks
            matched_blocks = matcher(field_data, ocr_lines, img_w, img_h)

            if matched_blocks:
                union_box = self._compute_union_box(matched_blocks)
                declarations[field_key] = {
                    "field": field_key,
                    "display_name": display_name,
                    "detected": True,
                    "has_evidence": True,
                    "detected_value": self._format_detected_value(field_key, field_data),
                    "raw_text": raw_text,
                    "evidence_blocks": matched_blocks,
                    "bounding_box_union": union_box,
                }
                mapped_count += 1
            else:
                declarations[field_key] = {
                    "field": field_key,
                    "display_name": display_name,
                    "detected": True,
                    "has_evidence": False,
                    "detected_value": self._format_detected_value(field_key, field_data),
                    "raw_text": raw_text,
                    "message": "Visual evidence could not be confidently mapped to OCR regions.",
                    "evidence_blocks": [],
                    "bounding_box_union": None,
                }

        # Build normalized representation for all OCR lines for full-label background inspection
        all_blocks = []
        for idx, line in enumerate(ocr_lines):
            box = line.get("bounding_box", [])
            norm_rect = self._normalize_box(box, img_w, img_h)
            all_blocks.append({
                "line_index": idx,
                "text": line.get("text", ""),
                "confidence": line.get("confidence", 0.0),
                "bounding_box": box,
                "normalized_rect": norm_rect,
            })

        return {
            "scan_id": scan_id,
            "image_dimensions": {"width": img_w, "height": img_h},
            "total_mapped_declarations": mapped_count,
            "declarations": declarations,
            "all_ocr_blocks": all_blocks,
        }

    # -------------------------------------------------------------------------
    # Specific Matchers
    # -------------------------------------------------------------------------
    def _match_product_name(
        self, field_data: Dict[str, Any], ocr_lines: List[Dict[str, Any]], img_w: int, img_h: int
    ) -> List[Dict[str, Any]]:
        val = str(field_data.get("value") or "").strip().lower()
        raw = str(field_data.get("raw_text") or "").strip().lower()
        if not val and not raw:
            return []

        matched = []
        for line in ocr_lines:
            txt = line.get("text", "").strip().lower()
            if not txt:
                continue
            # Exact or substring match
            if val and (val in txt or txt in val):
                matched.append(self._format_block(line, img_w, img_h))
            elif raw and (raw in txt or txt in raw):
                matched.append(self._format_block(line, img_w, img_h))

        return matched

    def _match_mrp(
        self, field_data: Dict[str, Any], ocr_lines: List[Dict[str, Any]], img_w: int, img_h: int
    ) -> List[Dict[str, Any]]:
        val = str(field_data.get("value") or "").strip()
        raw = str(field_data.get("raw_text") or "").strip().lower()

        matched = []
        for line in ocr_lines:
            txt = line.get("text", "").strip().lower()
            if not txt:
                continue

            is_match = False
            # Check for price keywords + value
            if ("mrp" in txt or "maximum retail" in txt or "rs." in txt or "₹" in txt):
                if val and val in txt:
                    is_match = True
                elif "tax" in txt or "incl" in txt or "mrp" in txt:
                    is_match = True

            # Match raw text snippet
            if not is_match and raw and (raw in txt or txt in raw):
                is_match = True

            # Match standalone value if line contains currency symbol
            if not is_match and val and val in txt and ("rs" in txt or "₹" in txt or "/" in txt):
                is_match = True

            if is_match:
                matched.append(self._format_block(line, img_w, img_h))

        return matched

    def _match_net_quantity(
        self, field_data: Dict[str, Any], ocr_lines: List[Dict[str, Any]], img_w: int, img_h: int
    ) -> List[Dict[str, Any]]:
        val = str(field_data.get("value") or "").strip()
        unit = str(field_data.get("unit") or "").strip().lower()
        raw = str(field_data.get("raw_text") or "").strip().lower()

        matched = []
        for line in ocr_lines:
            txt = line.get("text", "").strip().lower()
            if not txt:
                continue

            is_match = False
            # Check for explicit net quantity labels
            if any(k in txt for k in ["net qty", "net weight", "net wt", "net content", "net quantity", "n.w."]):
                is_match = True
            elif val and unit and f"{val} {unit}" in txt:
                is_match = True
            elif val and unit and f"{val}{unit}" in txt:
                is_match = True
            elif raw and (raw in txt or txt in raw):
                is_match = True

            if is_match:
                matched.append(self._format_block(line, img_w, img_h))

        return matched

    def _match_manufacturer(
        self, field_data: Dict[str, Any], ocr_lines: List[Dict[str, Any]], img_w: int, img_h: int
    ) -> List[Dict[str, Any]]:
        org = str(field_data.get("organization_name") or "").strip().lower()
        pin = str(field_data.get("postal_code") or "").strip()
        raw = str(field_data.get("raw_text") or "").strip().lower()

        matched = []
        for line in ocr_lines:
            txt = line.get("text", "").strip().lower()
            if not txt:
                continue

            is_match = False
            if any(k in txt for k in ["mfg by", "manufactured by", "packed by", "pkd by", "imported by", "marketed by"]):
                is_match = True
            elif org and len(org) > 4 and (org in txt or txt in org):
                is_match = True
            elif pin and pin in txt:
                is_match = True
            elif raw and (raw in txt or txt in raw):
                is_match = True

            if is_match:
                matched.append(self._format_block(line, img_w, img_h))

        return matched

    def _match_dates(
        self, field_data: Dict[str, Any], ocr_lines: List[Dict[str, Any]], img_w: int, img_h: int
    ) -> List[Dict[str, Any]]:
        mfg = str(field_data.get("mfg_date") or "").strip().lower()
        exp = str(field_data.get("expiry_date") or "").strip().lower()
        batch = str(field_data.get("batch_number") or "").strip().lower()
        raw = str(field_data.get("raw_text") or "").strip().lower()

        matched = []
        for line in ocr_lines:
            txt = line.get("text", "").strip().lower()
            if not txt:
                continue

            is_match = False
            if any(k in txt for k in ["mfg", "pkd", "packed on", "best before", "use by", "expiry", "exp date", "batch", "lot no"]):
                is_match = True
            elif mfg and mfg in txt:
                is_match = True
            elif exp and exp in txt:
                is_match = True
            elif batch and batch in txt:
                is_match = True
            elif raw and (raw in txt or txt in raw):
                is_match = True

            if is_match:
                matched.append(self._format_block(line, img_w, img_h))

        return matched

    def _match_consumer_care(
        self, field_data: Dict[str, Any], ocr_lines: List[Dict[str, Any]], img_w: int, img_h: int
    ) -> List[Dict[str, Any]]:
        toll_free = str(field_data.get("toll_free") or "").strip().lower()
        phone = str(field_data.get("phone") or "").strip().lower()
        email = str(field_data.get("email") or "").strip().lower()
        raw = str(field_data.get("raw_text") or "").strip().lower()

        matched = []
        for line in ocr_lines:
            txt = line.get("text", "").strip().lower()
            if not txt:
                continue

            is_match = False
            if any(k in txt for k in ["consumer care", "customer care", "toll free", "helpline", "grievance", "complaint"]):
                is_match = True
            elif toll_free and toll_free in txt:
                is_match = True
            elif phone and phone in txt:
                is_match = True
            elif email and email in txt:
                is_match = True
            elif "@" in txt and ("care" in txt or "support" in txt or "help" in txt or "info" in txt):
                is_match = True
            elif raw and (raw in txt or txt in raw):
                is_match = True

            if is_match:
                matched.append(self._format_block(line, img_w, img_h))

        return matched

    # -------------------------------------------------------------------------
    # Geometric Helpers
    # -------------------------------------------------------------------------
    def _format_block(self, line: Dict[str, Any], img_w: int, img_h: int) -> Dict[str, Any]:
        box = line.get("bounding_box", [])
        norm = self._normalize_box(box, img_w, img_h)
        return {
            "text": line.get("text", ""),
            "confidence": line.get("confidence", 0.0),
            "bounding_box": box,
            "normalized_rect": norm,
        }

    def _normalize_box(self, box: List[List[float]], img_w: int, img_h: int) -> Dict[str, float]:
        if not box or len(box) < 4 or img_w <= 0 or img_h <= 0:
            return {"x": 0.0, "y": 0.0, "width": 0.0, "height": 0.0}

        xs = [float(p[0]) for p in box]
        ys = [float(p[1]) for p in box]
        min_x = max(0.0, min(xs))
        max_x = min(float(img_w), max(xs))
        min_y = max(0.0, min(ys))
        max_y = min(float(img_h), max(ys))

        width = max(1.0, max_x - min_x)
        height = max(1.0, max_y - min_y)

        return {
            "x": round((min_x / img_w) * 100.0, 2),
            "y": round((min_y / img_h) * 100.0, 2),
            "width": round((width / img_w) * 100.0, 2),
            "height": round((height / img_h) * 100.0, 2),
        }

    def _compute_union_box(self, blocks: List[Dict[str, Any]]) -> Optional[Dict[str, float]]:
        if not blocks:
            return None

        rects = [b["normalized_rect"] for b in blocks if "normalized_rect" in b]
        if not rects:
            return None

        min_x = min(r["x"] for r in rects)
        min_y = min(r["y"] for r in rects)
        max_x = max(r["x"] + r["width"] for r in rects)
        max_y = max(r["y"] + r["height"] for r in rects)

        return {
            "x": round(min_x, 2),
            "y": round(min_y, 2),
            "width": round(max_x - min_x, 2),
            "height": round(max_y - min_y, 2),
        }

    def _resolve_dimensions(
        self, ocr_lines: List[Dict[str, Any]], image_dimensions: Optional[Tuple[int, int]]
    ) -> Tuple[int, int]:
        if image_dimensions and image_dimensions[0] > 0 and image_dimensions[1] > 0:
            return image_dimensions

        # Infer from max bounding box coordinates
        max_x = 800.0
        max_y = 600.0
        for line in ocr_lines:
            for p in line.get("bounding_box", []):
                if len(p) >= 2:
                    max_x = max(max_x, float(p[0]))
                    max_y = max(max_y, float(p[1]))

        return int(max_x * 1.05), int(max_y * 1.05)

    def _format_detected_value(self, field_key: str, field_data: Dict[str, Any]) -> Optional[str]:
        if field_key == "mrp":
            val = field_data.get("value")
            if val is not None:
                incl = " (incl. of all taxes)" if field_data.get("inclusive_of_taxes") else ""
                return f"₹{val}{incl}"
        elif field_key == "net_quantity":
            val = field_data.get("value")
            unit = field_data.get("unit", "")
            if val is not None:
                return f"{val} {unit}".strip()
        elif field_key == "manufacturer_packer":
            return field_data.get("organization_name") or field_data.get("address")
        elif field_key == "date_information":
            parts = []
            if field_data.get("mfg_date"):
                parts.append(f"Mfg: {field_data['mfg_date']}")
            if field_data.get("expiry_date"):
                parts.append(f"Exp: {field_data['expiry_date']}")
            if field_data.get("best_before"):
                parts.append(f"BB: {field_data['best_before']}")
            return ", ".join(parts) if parts else None
        elif field_key == "consumer_care":
            parts = []
            if field_data.get("toll_free"):
                parts.append(f"Toll Free: {field_data['toll_free']}")
            if field_data.get("phone"):
                parts.append(f"Ph: {field_data['phone']}")
            if field_data.get("email"):
                parts.append(f"Email: {field_data['email']}")
            return " | ".join(parts) if parts else None
        elif field_key == "product_name":
            return field_data.get("value")

        return field_data.get("value") or field_data.get("raw_text")
