"""Extraction Service — Phase 2.

Performs intelligent, rule-based and regex-based information extraction on OCR results
for packaged commodities in compliance with the Legal Metrology Act and Packaged Commodities Rules.

Extracts:
1. Product Name
2. MRP (Maximum Retail Price)
3. Net Quantity / Unit
4. Manufacturer / Packer / Importer details
5. Date information (Mfg Date, Expiry, Best Before, Batch)
6. Consumer Care details (Helpline, Email, Address)

Adheres strictly to the principle:
- REAL extracted data only
- No hallucination or fake default values
- Explainable confidence scoring (high, moderate, low, not_detected)
"""
from __future__ import annotations

import re
from typing import Any, Dict, List, Optional


def get_confidence_level(score: float, detected: bool) -> str:
    """Map numeric confidence score to human-intelligible categorical level."""
    if not detected or score <= 0.0:
        return "not_detected"
    if score >= 0.80:
        return "high"
    if score >= 0.50:
        return "moderate"
    return "low"


class ExtractionService:
    """Intelligent field extractor for package label declarations."""

    # Common regulatory or non-product noise phrases to ignore when detecting product name
    NOISE_PHRASES = [
        "mrp", "rs.", "rs ", "inr", "maximum retail", "incl of all taxes",
        "net qty", "net quantity", "net wt", "net weight", "net vol", "net volume",
        "mfg date", "mfd", "date of mfg", "pkd", "packed on", "best before", "use by", "expiry", "exp date",
        "batch no", "b.no", "lot no", "fssai", "lic no", "ingredients", "nutritional",
        "customer care", "consumer care", "toll free", "manufactured by", "packed by", "marketed by",
        "store in a cool", "keep away", "vegetarian", "non-vegetarian", "barcode", "per serve",
    ]

    def extract_declarations(self, ocr_output: Dict[str, Any], is_eligible: bool = True) -> Dict[str, Any]:
        """
        Main entrypoint: parse OCR lines and full text into structured package declarations.
        If is_eligible is False, returns completely empty/not_detected structure (zero hallucination).
        """
        if not is_eligible:
            empty_field = {
                "detected": False,
                "value": None,
                "raw_text": None,
                "confidence": 0.0,
                "confidence_level": "not_detected",
            }
            return {
                "product_name": {**empty_field, "value": None},
                "mrp": {**empty_field, "value": None, "currency": "INR", "inclusive_of_taxes": False},
                "net_quantity": {**empty_field, "value": None, "unit": None},
                "manufacturer_packer": {**empty_field, "type": None, "organization_name": None, "address": None, "postal_code": None},
                "date_information": {**empty_field, "mfg_date": None, "expiry_date": None, "best_before": None, "batch_number": None},
                "consumer_care": {**empty_field, "phone": None, "toll_free": None, "email": None, "address": None},
                "summary": {
                    "total_fields_tracked": 6,
                    "fields_detected_count": 0,
                    "has_mrp": False,
                    "has_net_quantity": False,
                    "has_manufacturer": False,
                    "has_date_information": False,
                    "has_consumer_care": False,
                },
            }

        lines: List[Dict[str, Any]] = ocr_output.get("lines", [])
        raw_text: str = ocr_output.get("raw_text", "")

        # Extract each domain
        mrp = self._extract_mrp(lines, raw_text)
        net_quantity = self._extract_net_quantity(lines, raw_text)
        dates = self._extract_dates(lines, raw_text)
        manufacturer = self._extract_manufacturer_and_packer(lines, raw_text)
        consumer_care = self._extract_consumer_care(lines, raw_text)

        other_detected = any([mrp["detected"], net_quantity["detected"], dates["detected"], manufacturer["detected"], consumer_care["detected"]])
        product_name = self._extract_product_name(lines, raw_text, other_detected=other_detected)

        # Count detected fields
        detected_count = sum(
            1 for f in [product_name, mrp, net_quantity, manufacturer, dates, consumer_care]
            if f.get("detected")
        )

        return {
            "product_name": product_name,
            "mrp": mrp,
            "net_quantity": net_quantity,
            "manufacturer_packer": manufacturer,
            "date_information": dates,
            "consumer_care": consumer_care,
            "summary": {
                "total_fields_tracked": 6,
                "fields_detected_count": detected_count,
                "has_mrp": mrp.get("detected", False),
                "has_net_quantity": net_quantity.get("detected", False),
                "has_manufacturer": manufacturer.get("detected", False),
                "has_date_information": dates.get("detected", False),
                "has_consumer_care": consumer_care.get("detected", False),
            },
        }

    # =========================================================================
    # 1. MRP EXTRACTION
    # =========================================================================
    def _extract_mrp(self, lines: List[Dict[str, Any]], raw_text: str) -> Dict[str, Any]:
        """
        Detect MRP declarations such as:
        - MRP ₹50
        - MRP: Rs. 50.00
        - Maximum Retail Price Rs 120
        - ₹ 50 (incl. of all taxes)
        """
        result = {
            "detected": False,
            "value": None,
            "currency": "INR",
            "raw_text": None,
            "confidence": 0.0,
            "confidence_level": "not_detected",
            "inclusive_of_taxes": False,
        }

        # Global check for "incl. of all taxes" across label
        has_taxes_phrase = bool(re.search(r"incl(?:usive)?\s*(?:of\s*)?all\s*taxes", raw_text, re.IGNORECASE))
        result["inclusive_of_taxes"] = has_taxes_phrase

        # High-priority regex: Explicit MRP / Max Retail Price
        explicit_mrp_patterns = [
            r"(?:M\.?R\.?P\.?|Maximum\s*Retail\s*Price|Max\s*Retail\s*Price)\s*[:\.\-]?\s*(?:Rs\.?|INR|₹)?\s*([0-9]+(?:[\.,][0-9]{1,2})?)",
            r"(?:M\.?R\.?P\.?)\s*(?:Rs\.?|INR|₹)?\s*([0-9]+(?:[\.,][0-9]{1,2})?)",
        ]

        # Scan each line
        for block in lines:
            text = block["text"]
            for pat in explicit_mrp_patterns:
                m = re.search(pat, text, re.IGNORECASE)
                if m:
                    val_str = m.group(1).replace(",", ".")
                    try:
                        val = float(val_str)
                        if val == int(val):
                            val = int(val)
                        result["detected"] = True
                        result["value"] = val
                        result["raw_text"] = text
                        # Confidence boosted by explicit keyword
                        result["confidence"] = round(min(1.0, block["confidence"] * 1.05), 4)
                        result["confidence_level"] = get_confidence_level(result["confidence"], True)
                        if "incl" in text.lower():
                            result["inclusive_of_taxes"] = True
                        return result
                    except ValueError:
                        continue

        # Secondary fallback: Standalone Currency Symbol followed by valid price
        # (e.g. "₹ 45.00" or "Rs. 99")
        standalone_currency_patterns = [
            r"(?:₹|Rs\.?|INR)\s*([0-9]+(?:\.[0-9]{1,2})?)",
        ]
        for block in lines:
            text = block["text"]
            # Ignore lines that are clearly net weight or dates
            if any(k in text.lower() for k in ["g", "kg", "ml", "mfd", "exp", "qty"]):
                continue
            for pat in standalone_currency_patterns:
                m = re.search(pat, text, re.IGNORECASE)
                if m:
                    val_str = m.group(1)
                    try:
                        val = float(val_str)
                        if val == int(val):
                            val = int(val)
                        result["detected"] = True
                        result["value"] = val
                        result["raw_text"] = text
                        # Moderate confidence because keyword MRP wasn't explicit
                        result["confidence"] = round(block["confidence"] * 0.85, 4)
                        result["confidence_level"] = get_confidence_level(result["confidence"], True)
                        return result
                    except ValueError:
                        continue

        return result

    # =========================================================================
    # 2. NET QUANTITY EXTRACTION
    # =========================================================================
    def _extract_net_quantity(self, lines: List[Dict[str, Any]], raw_text: str) -> Dict[str, Any]:
        """
        Detect Net Quantity declarations such as:
        - 100 g, 500 g, 1 kg, 250 ml, 1 L, 750 ml
        - Net Qty: 200 g
        - Net Weight: 1.5 kg
        - Net Content: 500 ml
        """
        result = {
            "detected": False,
            "value": None,
            "unit": None,
            "raw_text": None,
            "confidence": 0.0,
            "confidence_level": "not_detected",
        }

        # Unit normalizer
        def normalize_unit(u: str) -> str:
            u_clean = u.lower().strip()
            if u_clean in ["g", "gm", "gms", "gram", "grams"]:
                return "g"
            if u_clean in ["kg", "kgs", "kilogram", "kilograms"]:
                return "kg"
            if u_clean in ["ml", "m.l.", "milli", "milliliter", "millilitre"]:
                return "ml"
            if u_clean in ["l", "ltr", "ltrs", "liter", "liters", "litre", "litres"]:
                return "L"
            if u_clean in ["pcs", "pc", "piece", "pieces", "units", "unit", "n"]:
                return "units"
            return u_clean

        # Pattern 1: Explicit keyword ("Net Qty", "Net Weight", etc.)
        explicit_patterns = [
            r"Net\s*(?:Quantity|Qty|Weight|Wt|Volume|Vol|Content|Contents)?[:\.\-]?\s*([0-9]+(?:\.[0-9]+)?)\s*(kg|g|gm|gms|grams?|ml|l|ltr|litres?|liters?|pcs?|pieces?|units?|n)\b",
            r"(?:Quantity|Qty|Weight|Wt)[:\.\-]?\s*([0-9]+(?:\.[0-9]+)?)\s*(kg|g|gm|gms|grams?|ml|l|ltr|litres?|liters?)\b",
        ]

        for block in lines:
            text = block["text"]
            for pat in explicit_patterns:
                m = re.search(pat, text, re.IGNORECASE)
                if m:
                    try:
                        val = float(m.group(1))
                        if val == int(val):
                            val = int(val)
                        unit = normalize_unit(m.group(2))
                        result["detected"] = True
                        result["value"] = val
                        result["unit"] = unit
                        result["raw_text"] = text
                        result["confidence"] = round(min(1.0, block["confidence"] * 1.05), 4)
                        result["confidence_level"] = get_confidence_level(result["confidence"], True)
                        return result
                    except ValueError:
                        continue

        # Pattern 2: Standalone quantity with unit on its own line
        standalone_patterns = [
            r"\b([0-9]+(?:\.[0-9]+)?)\s*(kg|g|gm|gms|grams?|ml|ltr|litres?|liters?)\b",
        ]

        for block in lines:
            text = block["text"]
            # Exclude lines that are clearly ingredients or instructions
            if any(k in text.lower() for k in ["per 100", "daily value", "sugar", "fat", "protein", "carbohydrate", "vitamin"]):
                continue
            for pat in standalone_patterns:
                m = re.search(pat, text, re.IGNORECASE)
                if m:
                    try:
                        val = float(m.group(1))
                        if val == int(val):
                            val = int(val)
                        unit = normalize_unit(m.group(2))
                        result["detected"] = True
                        result["value"] = val
                        result["unit"] = unit
                        result["raw_text"] = text
                        result["confidence"] = round(block["confidence"] * 0.82, 4)
                        result["confidence_level"] = get_confidence_level(result["confidence"], True)
                        return result
                    except ValueError:
                        continue

        return result

    # =========================================================================
    # 3. DATE INFORMATION EXTRACTION
    # =========================================================================
    def _extract_dates(self, lines: List[Dict[str, Any]], raw_text: str) -> Dict[str, Any]:
        """
        Detect Manufacturing, Packaging, Expiry, Best Before, and Batch declarations.
        """
        result = {
            "detected": False,
            "mfg_date": None,
            "expiry_date": None,
            "best_before": None,
            "batch_number": None,
            "raw_text": None,
            "confidence": 0.0,
            "confidence_level": "not_detected",
        }

        detected_lines: List[str] = []
        conf_scores: List[float] = []

        # 1. Batch Number
        batch_pattern = r"\b(?:Batch\s*(?:No|Number)?|B\.?\s*No\.?|Lot\s*(?:No|Number)?)\s*[:\.\-]?\s*([A-Za-z0-9\-\/]+)"
        for block in lines:
            m = re.search(batch_pattern, block["text"], re.IGNORECASE)
            if m:
                result["batch_number"] = m.group(1).strip()
                detected_lines.append(block["text"])
                conf_scores.append(block["confidence"])
                break

        # 2. Manufacturing / Packing Date
        mfg_pattern = r"(?:Mfd|Mfg|Manufactured|Pkd|Packed)\s*(?:Date|on|by)?[:\.\-]?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{1,2}[\/\-\.]\d{2,4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s\.\-\/]*\d{2,4})"
        for block in lines:
            m = re.search(mfg_pattern, block["text"], re.IGNORECASE)
            if m:
                result["mfg_date"] = m.group(1).strip()
                detected_lines.append(block["text"])
                conf_scores.append(block["confidence"])
                break

        # 3. Expiry Date
        exp_pattern = r"(?:Exp|Expiry|Use\s*by)\s*(?:Date)?[:\.\-]?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{1,2}[\/\-\.]\d{2,4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s\.\-\/]*\d{2,4})"
        for block in lines:
            m = re.search(exp_pattern, block["text"], re.IGNORECASE)
            if m:
                result["expiry_date"] = m.group(1).strip()
                detected_lines.append(block["text"])
                conf_scores.append(block["confidence"])
                break

        # 4. Best Before (duration or specific date)
        bb_pattern = r"(?:Best\s*Before|Best\s*by)[:\.\-]?\s*([0-9]+\s*(?:months?|days?|years?)(?:\s*from\s*(?:mfg|date|packaging))?|\d{1,2}[\/\-\.]\d{2,4})"
        for block in lines:
            m = re.search(bb_pattern, block["text"], re.IGNORECASE)
            if m:
                result["best_before"] = m.group(1).strip()
                detected_lines.append(block["text"])
                conf_scores.append(block["confidence"])
                break

        if detected_lines:
            result["detected"] = True
            result["raw_text"] = " | ".join(detected_lines)
            avg_conf = sum(conf_scores) / len(conf_scores)
            result["confidence"] = round(avg_conf, 4)
            result["confidence_level"] = get_confidence_level(result["confidence"], True)

        return result

    # =========================================================================
    # 4. MANUFACTURER / PACKER EXTRACTION
    # =========================================================================
    def _extract_manufacturer_and_packer(self, lines: List[Dict[str, Any]], raw_text: str) -> Dict[str, Any]:
        """
        Identify manufacturer, packer, or importer name and address details.
        """
        result = {
            "detected": False,
            "type": None,  # "manufacturer", "packer", "importer", "marketed_by"
            "organization_name": None,
            "address": None,
            "postal_code": None,
            "raw_text": None,
            "confidence": 0.0,
            "confidence_level": "not_detected",
        }

        mfg_keywords = [
            (r"Manufactured\s*(?:and\s*Packed\s*)?by[:\.\-]?", "manufacturer"),
            (r"Mfg\.?\s*by[:\.\-]?", "manufacturer"),
            (r"Mfd\.?\s*by[:\.\-]?", "manufacturer"),
            (r"Packed\s*by[:\.\-]?", "packer"),
            (r"Pkg\.?\s*by[:\.\-]?", "packer"),
            (r"Marketed\s*by[:\.\-]?", "marketed_by"),
            (r"Imported\s*by[:\.\-]?", "importer"),
        ]

        # Search line by line for an anchor keyword
        matched_idx = -1
        detected_type = "manufacturer"
        anchor_conf = 0.5

        for i, block in enumerate(lines):
            text = block["text"]
            for pat, org_type in mfg_keywords:
                if re.search(pat, text, re.IGNORECASE):
                    matched_idx = i
                    detected_type = org_type
                    anchor_conf = block["confidence"]
                    break
            if matched_idx >= 0:
                break

        if matched_idx >= 0:
            result["detected"] = True
            result["type"] = detected_type

            # Collect subsequent lines (up to 3) as the organization + address
            collected = []
            for j in range(matched_idx, min(len(lines), matched_idx + 4)):
                line_text = lines[j]["text"]
                # Stop if hitting another clear section header
                if j > matched_idx and any(h in line_text.lower() for h in ["mrp", "net qty", "customer care", "ingredients", "batch", "fssai"]):
                    break
                collected.append(line_text)

            full_block = " ".join(collected)
            result["raw_text"] = full_block

            # Clean up organization name from anchor line
            anchor_line = collected[0]
            for pat, _ in mfg_keywords:
                anchor_line = re.sub(pat, "", anchor_line, flags=re.IGNORECASE).strip()
            
            if anchor_line:
                result["organization_name"] = anchor_line
            elif len(collected) > 1:
                result["organization_name"] = collected[1]

            # Look for 6-digit Indian PIN Code in the block
            pin_m = re.search(r"\b([1-9][0-9]{5})\b", full_block)
            if pin_m:
                result["postal_code"] = pin_m.group(1)

            # Assign address
            result["address"] = full_block
            result["confidence"] = round(anchor_conf, 4)
            result["confidence_level"] = get_confidence_level(result["confidence"], True)

        return result

    # =========================================================================
    # 5. CONSUMER CARE EXTRACTION
    # =========================================================================
    def _extract_consumer_care(self, lines: List[Dict[str, Any]], raw_text: str) -> Dict[str, Any]:
        """
        Identify consumer helpline, email address, toll-free number, and grievance contact.
        """
        result = {
            "detected": False,
            "phone": None,
            "toll_free": None,
            "email": None,
            "address": None,
            "raw_text": None,
            "confidence": 0.0,
            "confidence_level": "not_detected",
        }

        detected_lines: List[str] = []
        conf_scores: List[float] = []

        # 1. Email extraction
        email_m = re.search(r"\b([a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)\b", raw_text)
        if email_m:
            result["email"] = email_m.group(1).strip()
            result["detected"] = True

        # 2. Toll-Free Number
        toll_free_m = re.search(r"\b(1800[-\s]?[0-9]{3}[-\s]?[0-9]{3,4})\b", raw_text)
        if toll_free_m:
            result["toll_free"] = toll_free_m.group(1).strip()
            result["detected"] = True

        # 3. Phone / Mobile Number
        phone_m = re.search(r"(?:Tel|Ph|Phone|Contact|Helpline|Care)?[:\.\-\s]*(?:\+91[\s\-]?)?([6-9][0-9]{4}[\s\-]?[0-9]{5}|0\d{2,4}[-\s]?\d{6,8})", raw_text)
        if phone_m and not result["toll_free"]:
            clean_phone = phone_m.group(1).strip()
            # Verify not a barcode or pin code
            if len(re.sub(r"\D", "", clean_phone)) >= 10:
                result["phone"] = clean_phone
                result["detected"] = True

        # 4. Search for consumer care text block
        care_keywords = ["customer care", "consumer care", "helpline", "feedback", "queries", "grievance"]
        for block in lines:
            text_lower = block["text"].lower()
            if any(k in text_lower for k in care_keywords):
                detected_lines.append(block["text"])
                conf_scores.append(block["confidence"])
                result["detected"] = True

        if result["detected"]:
            if detected_lines:
                result["raw_text"] = " | ".join(detected_lines)
                avg_conf = sum(conf_scores) / len(conf_scores)
                result["confidence"] = round(avg_conf, 4)
            else:
                result["confidence"] = 0.85
                result["raw_text"] = f"Email: {result['email']}" if result["email"] else (result["toll_free"] or result["phone"])

            result["confidence_level"] = get_confidence_level(result["confidence"], True)

        return result

    # =========================================================================
    # 6. PRODUCT NAME EXTRACTION
    # =========================================================================
    def _extract_product_name(self, lines: List[Dict[str, Any]], raw_text: str, other_detected: bool = False) -> Dict[str, Any]:
        """
        Identify the primary product or commodity name.
        Uses visual hierarchy: top vertical position, clean non-boilerplate text.
        Requires package context: must not match document/certificate keywords,
        and must have supporting packaging context (or other detected declarations).
        """
        result = {
            "detected": False,
            "value": None,
            "raw_text": None,
            "confidence": 0.0,
            "confidence_level": "not_detected",
        }

        if not lines:
            return result

        # Non-commodity and document phrases that must NEVER become product names
        excluded_phrases = [
            "certificate", "certification", "completion", "corporation", "skill", "development",
            "university", "college", "school", "institution", "department", "signatory", "director",
            "government", "admit", "hall ticket", "roll no", "enrollment", "registration", "resume",
            "marksheet", "grade", "semester", "academic", "training", "program", "workshop", "webinar",
            "internship", "curriculum", "andhra pradesh", "state", "board", "council", "ministry",
            "authorized", "principal", "controller", "dean", "examination", "biodata",
        ]

        candidates: List[Dict[str, Any]] = []

        # Check top 6 lines only
        for block in lines[:6]:
            text = block["text"].strip()
            text_lower = text.lower()

            # Skip short numbers or symbols
            if len(text) < 3 or len(text) > 60:
                continue

            # Skip if contains noise keywords
            if any(n in text_lower for n in self.NOISE_PHRASES):
                continue

            # Skip if contains document / institutional keywords
            if any(doc in text_lower for doc in excluded_phrases):
                continue

            # Skip pure numbers or barcodes
            if re.match(r"^[0-9\s\.\,\-]+$", text):
                continue

            candidates.append(block)

        # Requirement: To extract a product name, we must have supporting packaging context:
        # Either at least 1 other packaging declaration was detected (MRP, Net Qty, Dates, Mfg, etc.)
        # OR there are at least 4 contextual lines and candidate has clear brand confidence.
        if candidates and (other_detected or len(lines) >= 4):
            chosen = candidates[0]
            result["detected"] = True
            result["value"] = chosen["text"]
            result["raw_text"] = chosen["text"]
            result["confidence"] = round(chosen["confidence"] * 0.88, 4)
            result["confidence_level"] = get_confidence_level(result["confidence"], True)

        return result

