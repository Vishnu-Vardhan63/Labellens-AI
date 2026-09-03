"""Package Label Eligibility Gate Service.

Determines whether an uploaded image contains sufficient genuine packaging
declaration markers to constitute a packaged commodity label under the
Legal Metrology (Packaged Commodities) Rules, 2011 before running extraction
and compliance screening.

Outcomes:
1. ELIGIBLE_FOR_ANALYSIS
   -> Sufficient packaging declaration markers detected.
   -> Proceed with extraction, declaration review, and visual evidence.
2. INSUFFICIENT_LABEL_EVIDENCE
   -> Non-package photo, blank image, or stray isolated text without packaging declarations.
   -> Suspend compliance screening; do NOT declare non-compliance or potential legal issues.
   -> Return clear guidance: "We could not confidently identify a packaged commodity label in this image."
"""
from __future__ import annotations

import re
from typing import Any, Dict, List, Tuple


class LabelEligibilityStatus:
    ELIGIBLE_FOR_PACKAGE_ANALYSIS = "ELIGIBLE_FOR_PACKAGE_ANALYSIS"
    INSUFFICIENT_PACKAGE_LABEL_EVIDENCE = "INSUFFICIENT_PACKAGE_LABEL_EVIDENCE"
    NO_READABLE_TEXT = "NO_READABLE_TEXT"


class LabelGateService:
    """Evaluates whether an OCR output qualifies as a packaged commodity label."""

    # 1. Statutory Price Keywords & Patterns
    PRICE_PATTERNS = [
        r"\b(?:m\.?r\.?p\.?|max(?:imum)?\s*retail\s*price)\b",
        r"\bincl(?:usive)?\s*(?:of\s*)?all\s*taxes\b",
        r"(?:₹|rs\.?|inr)\s*[0-9]+",
    ]

    # 2. Metric Net Quantity Keywords & Patterns
    QUANTITY_PATTERNS = [
        r"\b(?:net\s*qty|net\s*quantity|net\s*wt|net\s*weight|net\s*content|net\s*vol(?:ume)?)\b",
        r"\b[0-9]+(?:\.[0-9]+)?\s*(?:g|gm|gms|grams?|kg|kgs|kilograms?|ml|mls|millilitres?|l|ltr|litres?)\b",
        r"\b[0-9]+\s*(?:pieces?|units?|tablets?|capsules?|count|sachets?)\b",
    ]

    # 3. Manufacturer / Packer / Origin Keywords & Patterns
    MANUFACTURER_PATTERNS = [
        r"\b(?:mfg(?:\.|\s*by)?|manufactured\s*by|packed\s*by|pkd(?:\.|\s*by)?|marketed\s*by|imported\s*by)\b",
        r"\b(?:consumer\s*products|pvt\.?\s*ltd\.?|private\s*limited|limited|industries)\b",
        r"\b(?:pin(?:\s*code)?|pincode)[:\s\-]*[1-9][0-9]{5}\b",
        r"\bfssai\b",
        r"\blic(?:\.|\s*no)?[:\s\-]*[0-9]{10,14}\b",
        r"\bcountry\s*of\s*origin\b",
    ]

    # 4. Date / Batch Keywords & Patterns
    DATE_PATTERNS = [
        r"\b(?:mfg(?:\s*date)?|mfd|date\s*of\s*mfg|pkd|packed\s*on|packing\s*date)\b",
        r"\b(?:exp(?:iry)?(?:\s*date)?|use\s*by|best\s*before)\b",
        r"\b(?:batch(?:\s*no)?|lot(?:\s*no)?|b\.?\s*no\.?)\b",
    ]

    # 5. Consumer Care Keywords & Patterns
    CONSUMER_CARE_PATTERNS = [
        r"\b(?:consumer\s*care|customer\s*care|care\s*cell|toll\s*free|helpline|grievance|feedback)\b",
        r"\b1800[-\s]?[0-9]{3}[-\s]?[0-9]{3,4}\b",
        r"\b(?:care|contact|support)@[a-z0-9\.\-]+\.[a-z]{2,}\b",
    ]

    # 6. Secondary Packaging / Ingredients / Nutrition Keywords
    PACKAGING_CONTEXT_PATTERNS = [
        r"\b(?:ingredients|nutritional\s*info(?:rmation)?|nutrition\s*facts|per\s*100g|per\s*100ml|per\s*serving)\b",
        r"\b(?:store\s*in\s*a\s*cool|keep\s*refrigerated|shake\s*well\s*before|protect\s*from\s*sunlight)\b",
        r"\b(?:proprietary\s*food|ready\s*to\s*eat|energy\s*kcal|dietary\s*fibre)\b",
    ]

    # 7. Document / Non-Package Exclusion Keywords (Certificates, College IDs, Government Letters, etc.)
    DOCUMENT_EXCLUSION_PATTERNS = [
        r"\b(?:certificate(?:\s*of)?|certification|awarded\s*to|hereby\s*certif(?:y|ies))\b",
        r"\b(?:course\s*completion|successfully\s*completed|academic\s*year|training\s*program)\b",
        r"\b(?:skill\s*development|vocational|internship|workshop|seminar|webinar)\b",
        r"\b(?:roll\s*no|hall\s*ticket|student\s*id|registration\s*no|admit\s*card|enrollment)\b",
        r"\b(?:university|college|institute\s*of\s*technology|school\s*of|board\s*of\s*studies)\b",
        r"\b(?:authorized\s*signatory|director\s*general|principal|controller\s*of\s*examinations|dean)\b",
        r"\b(?:curriculum\s*vitae|resume|biodata|cover\s*letter|marksheet|grade\s*sheet|transcript)\b",
    ]

    def evaluate_eligibility(self, ocr_output: Dict[str, Any]) -> Dict[str, Any]:
        """
        Evaluate whether the OCR result possesses genuine packaged commodity signals.
        Returns a structured assessment dictionary.
        """
        lines: List[Dict[str, Any]] = ocr_output.get("lines", [])
        raw_text: str = ocr_output.get("raw_text", "")
        line_count: int = len(lines)

        # Case 1: Completely blank image or 0 text lines
        if line_count == 0 or not raw_text.strip():
            return {
                "is_eligible": False,
                "status": LabelEligibilityStatus.NO_READABLE_TEXT,
                "matched_categories": [],
                "signal_score": 0,
                "reason": "No readable text was detected in the uploaded image.",
                "message": "No readable text could be detected in this image. Please upload a clear photograph of the product packaging.",
            }

        # Case 2: Document / Certificate Detection
        # Check if the image contains prominent document/certificate terminology
        has_doc_indicators = any(re.search(p, raw_text, re.IGNORECASE) for p in self.DOCUMENT_EXCLUSION_PATTERNS)
        # Check if there is explicit statutory packaging proof (e.g. MRP + Net Qty)
        has_explicit_mrp = any(re.search(p, raw_text, re.IGNORECASE) for p in self.PRICE_PATTERNS)
        has_explicit_qty = any(re.search(p, raw_text, re.IGNORECASE) for p in self.QUANTITY_PATTERNS)

        if has_doc_indicators and not (has_explicit_mrp and has_explicit_qty):
            return {
                "is_eligible": False,
                "status": LabelEligibilityStatus.INSUFFICIENT_PACKAGE_LABEL_EVIDENCE,
                "matched_categories": ["document_exclusion"],
                "signal_score": 0,
                "reason": "This image appears to be an institutional document, certificate, or credential rather than a packaged commodity label.",
                "message": "This image does not appear to be a packaged commodity label. LABEL LENS AI detected readable text, but identified it as a document/certificate rather than a packaged commodity label.",
            }

        # Case 3: Only 1 isolated word / line (e.g. "REDBULL" on a shirt, or "EXIT")
        if line_count == 1:
            has_explicit_multi = bool(re.search(r"(?:mrp|net\s*qty|pkd)", raw_text, re.IGNORECASE)) and bool(re.search(r"\d", raw_text))
            if not has_explicit_multi:
                return {
                    "is_eligible": False,
                    "status": LabelEligibilityStatus.INSUFFICIENT_PACKAGE_LABEL_EVIDENCE,
                    "matched_categories": [],
                    "signal_score": 0,
                    "reason": f"Only a single isolated text fragment ('{raw_text.strip()}') was detected without packaging declarations.",
                    "message": "This image does not appear to be a packaged commodity label. LABEL LENS AI detected readable text, but there is insufficient evidence to identify this image as a packaged commodity label.",
                }

        # Case 4: Scan across all 6 packaging signal domains
        categories_matched: List[str] = []
        signal_score = 0

        # Category 1: Price / MRP
        if any(re.search(p, raw_text, re.IGNORECASE) for p in self.PRICE_PATTERNS):
            categories_matched.append("price_mrp")
            signal_score += 2

        # Category 2: Metric Net Quantity
        if any(re.search(p, raw_text, re.IGNORECASE) for p in self.QUANTITY_PATTERNS):
            categories_matched.append("net_quantity")
            signal_score += 2

        # Category 3: Manufacturer / Packer / Origin
        if any(re.search(p, raw_text, re.IGNORECASE) for p in self.MANUFACTURER_PATTERNS):
            categories_matched.append("manufacturer_packer")
            signal_score += 2

        # Category 4: Date / Batch
        if any(re.search(p, raw_text, re.IGNORECASE) for p in self.DATE_PATTERNS):
            categories_matched.append("date_batch")
            signal_score += 2

        # Category 5: Consumer Care
        if any(re.search(p, raw_text, re.IGNORECASE) for p in self.CONSUMER_CARE_PATTERNS):
            categories_matched.append("consumer_care")
            signal_score += 2

        # Category 6: Packaging Context / Nutrition
        if any(re.search(p, raw_text, re.IGNORECASE) for p in self.PACKAGING_CONTEXT_PATTERNS):
            categories_matched.append("packaging_context")
            signal_score += 1

        # Decision threshold:
        # A) 2 or more distinct packaging declaration categories matched
        # B) 1 strong statutory category matched AND at least 3 text lines present
        is_eligible = False
        reason = ""

        if len(categories_matched) >= 2:
            is_eligible = True
            reason = f"Detected {len(categories_matched)} packaging declaration domains ({', '.join(categories_matched)})."
        elif len(categories_matched) == 1 and line_count >= 3:
            is_eligible = True
            reason = f"Detected statutory domain '{categories_matched[0]}' with {line_count} contextual packaging lines."
        else:
            is_eligible = False
            if len(categories_matched) == 0:
                reason = "No packaging declaration markers (such as MRP, net quantity, dates, or manufacturer details) were detected."
            else:
                reason = f"Only sparse signal ('{categories_matched[0]}') without sufficient packaging context."

        if is_eligible:
            return {
                "is_eligible": True,
                "status": LabelEligibilityStatus.ELIGIBLE_FOR_PACKAGE_ANALYSIS,
                "matched_categories": categories_matched,
                "signal_score": signal_score,
                "reason": reason,
                "message": "Packaged commodity label verified as eligible for compliance screening.",
            }
        else:
            return {
                "is_eligible": False,
                "status": LabelEligibilityStatus.INSUFFICIENT_PACKAGE_LABEL_EVIDENCE,
                "matched_categories": categories_matched,
                "signal_score": signal_score,
                "reason": reason,
                "message": "This image does not appear to be a packaged commodity label. LABEL LENS AI detected readable text, but there is insufficient evidence to identify this image as a packaged commodity label.",
            }

