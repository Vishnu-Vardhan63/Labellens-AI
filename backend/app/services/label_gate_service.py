"""Package Label Eligibility Gate Service — Multi-Signal Architecture.

Implements two distinct evaluation concepts:
1. PACKAGE IDENTIFICATION / CLASSIFICATION
   "Is this image likely a packaged commodity / product package?"
   Evaluated across:
   - Category A: Regulatory / statutory signals (MRP, Net Qty, Mfg, Date/Batch, Consumer Care)
   - Category B: Product identity & FMCG terminology (food/beverage/personal care/commodity descriptors)
   - Category C: Package-like OCR structure (multiple short product text lines, density, brand blocks)
   - Category D: Anti-document & Anti-stray protection (blocks certificates, invoices, bills, single clothing words)

2. COMPLIANCE EVIDENCE SUFFICIENCY
   "Does this visible panel contain complete or partial compliance evidence?"
   - SUFFICIENT_FOR_SCREENING (3+ statutory domains detected)
   - PARTIAL_PANEL_EVIDENCE (e.g. front panel with product name + net qty or FMCG terms, but MRP/Mfg on back)
   - INSUFFICIENT_IMAGE_QUALITY (no readable text)

Safety Guarantee:
- Certificates, resumes, academic transcripts, and invoices are strictly blocked.
- Stray isolated words (e.g. "REDBULL" on a shirt, "EXIT") remain blocked.
- Front panels of packaged food (e.g. MAGGI, chips, biscuits, soaps) are correctly recognized as ELIGIBLE_PACKAGE.
"""
from __future__ import annotations

import re
from typing import Any, Dict, List, Tuple


class PackageEligibilityStatus:
    ELIGIBLE_PACKAGE = "ELIGIBLE_PACKAGE"
    INELIGIBLE_NON_PACKAGE = "INELIGIBLE_NON_PACKAGE"
    UNCERTAIN = "UNCERTAIN"


class ComplianceEvidenceStatus:
    SUFFICIENT_FOR_SCREENING = "SUFFICIENT_FOR_SCREENING"
    PARTIAL_PANEL_EVIDENCE = "PARTIAL_PANEL_EVIDENCE"
    INSUFFICIENT_IMAGE_QUALITY = "INSUFFICIENT_IMAGE_QUALITY"


# Backward-compatible status aliases for existing API consumers
class LabelEligibilityStatus:
    ELIGIBLE_FOR_PACKAGE_ANALYSIS = "ELIGIBLE_FOR_PACKAGE_ANALYSIS"
    INSUFFICIENT_PACKAGE_LABEL_EVIDENCE = "INSUFFICIENT_PACKAGE_LABEL_EVIDENCE"
    NO_READABLE_TEXT = "NO_READABLE_TEXT"
    PARTIAL_PANEL_EVIDENCE = "PARTIAL_PANEL_EVIDENCE"


class LabelGateService:
    """Evaluates whether an OCR output qualifies as a packaged commodity label."""

    # -------------------------------------------------------------------------
    # CATEGORY A: REGULATORY & STATUTORY SIGNALS
    # -------------------------------------------------------------------------
    PRICE_PATTERNS = [
        r"\b(?:m\.?r\.?p\.?|max(?:imum)?\s*retail\s*price)\b",
        r"\bincl(?:usive)?\s*(?:of\s*)?all\s*taxes\b",
        r"(?:₹|rs\.?|inr)\s*[0-9]+",
    ]

    QUANTITY_PATTERNS = [
        r"\b(?:net\s*qty|net\s*quantity|net\s*wt|net\s*weight|net\s*content|net\s*vol(?:ume)?)\b",
        r"\b[0-9]+(?:\.[0-9]+)?\s*(?:g|gm|gms|grams?|kg|kgs|kilograms?|ml|mls|millilitres?|l|ltr|litres?)\b",
        r"\b[0-9]+\s*(?:pieces?|units?|tablets?|capsules?|count|sachets?|servings?)\b",
    ]

    MANUFACTURER_PATTERNS = [
        r"\b(?:mfg(?:\.|\s*by)?|manufactured\s*by|packed\s*by|pkd(?:\.|\s*by)?|marketed\s*by|imported\s*by)\b",
        r"\b(?:consumer\s*products|pvt\.?\s*ltd\.?|private\s*limited|limited|industries)\b",
        r"\b(?:pin(?:\s*code)?|pincode)[:\s\-]*[1-9][0-9]{5}\b",
        r"\bfssai\b",
        r"\blic(?:\.|\s*no)?[:\s\-]*[0-9]{10,14}\b",
        r"\bcountry\s*of\s*origin\b",
    ]

    DATE_PATTERNS = [
        r"\b(?:mfg(?:\s*date)?|mfd|date\s*of\s*mfg|pkd|packed\s*on|packing\s*date)\b",
        r"\b(?:exp(?:iry)?(?:\s*date)?|use\s*by|best\s*before)\b",
        r"\b(?:batch(?:\s*no)?|lot(?:\s*no)?|b\.?\s*no\.?)\b",
    ]

    CONSUMER_CARE_PATTERNS = [
        r"\b(?:consumer\s*care|customer\s*care|care\s*cell|toll\s*free|helpline|grievance|feedback)\b",
        r"\b1800[-\s]?[0-9]{3}[-\s]?[0-9]{3,4}\b",
        r"\b(?:care|contact|support)@[a-z0-9\.\-]+\.[a-z]{2,}\b",
    ]

    # -------------------------------------------------------------------------
    # CATEGORY B: PRODUCT IDENTITY & FMCG COMMODITY SIGNALS
    # -------------------------------------------------------------------------
    FMCG_PRODUCT_PATTERNS = [
        # Food & staples
        r"\b(?:noodles?|codles|pasta|macaroni|spaghetti|soup|sauce|ketchup|masala|spices?|seasoning)\b",
        r"\b(?:snack|snacks|chips|crisps|biscuits?|cookies?|wafers?|namkeen|bhujia|rusk)\b",
        r"\b(?:cereal|cornflakes|oats|muesli|atta|maida|suji|besan|flour|rice|dal|pulses?|sugar|salt)\b",
        r"\b(?:oil|ghee|butter|spread|cheese|paneer|curd|dahi|milk|dairy|yogurt|mayo(?:nnaise)?)\b",
        r"\b(?:tea|chai|coffee|juice|beverage|drink|squash|syrup|concentrate|soda|water)\b",
        r"\b(?:chocolate|candy|sweets?|mithai|toffees?|confectionery|bar|wafer)\b",
        # Personal care, hygiene & home
        r"\b(?:shampoo|conditioner|soap|bodywash|facewash|detergent|cleaner|toothpaste|toothbrush)\b",
        r"\b(?:lotion|cream|moisturizer|serum|sunscreen|powder|talc|sanitizer|wash|gel)\b",
        # Package marketing & nutritional front-panel descriptors
        r"\b(?:instant|ready\s*to\s*cook|ready\s*to\s*eat|minute|quick|breakfast|crunchy|crispy|tasty|delicious)\b",
        r"\b(?:rich\s*in|source\s*of|goodness\s*of|natural|pure|fresh|organic|premium|classic|original)\b",
        r"\b(?:flavor|flavour|flavoured|tangy|spicy|masala|sweet|salty|crunch|baked|roasted|fried)\b",
        r"\b(?:iron|calcium|protein|vitamin|vitamins|minerals?|fortified|energy|active|immunity|nutri)\b",
        r"\b(?:truly|good|tasty|health|healthy|super|power|powerpack|value)\b",
        # Container & package type descriptors
        r"\b(?:pack|packet|pouch|sachet|box|bottle|can|jar|tin|container|refill|combo|family\s*pack|super\s*saver)\b",
    ]

    PACKAGING_CONTEXT_PATTERNS = [
        r"\b(?:ingredients|nutritional\s*info(?:rmation)?|nutrition\s*facts|per\s*100g|per\s*100ml|per\s*serving)\b",
        r"\b(?:store\s*in\s*a\s*cool|keep\s*refrigerated|shake\s*well\s*before|protect\s*from\s*sunlight)\b",
        r"\b(?:proprietary\s*food|energy\s*kcal|dietary\s*fibre|vegetarian|non-veg|green\s*dot)\b",
    ]

    # -------------------------------------------------------------------------
    # CATEGORY D: DOCUMENT & NON-PACKAGE EXCLUSIONS
    # -------------------------------------------------------------------------
    DOCUMENT_EXCLUSION_PATTERNS = [
        # Academic & Credentials
        r"\b(?:certificate(?:\s*of)?|certification|awarded\s*to|hereby\s*certif(?:y|ies))\b",
        r"\b(?:course\s*completion|successfully\s*completed|academic\s*year|training\s*program)\b",
        r"\b(?:skill\s*development|vocational|internship|workshop|seminar|webinar)\b",
        r"\b(?:roll\s*no|hall\s*ticket|student\s*id|registration\s*no|admit\s*card|enrollment)\b",
        r"\b(?:university|college|institute\s*of\s*technology|school\s*of|board\s*of\s*studies)\b",
        r"\b(?:authorized\s*signatory|director\s*general|principal|controller\s*of\s*examinations|dean)\b",
        r"\b(?:curriculum\s*vitae|resume|biodata|cover\s*letter|marksheet|grade\s*sheet|transcript)\b",
        # Commercial Invoices, Receipts & Bills (not physical packaging)
        r"\b(?:invoice|tax\s*invoice|bill\s*of\s*supply|debit\s*note|credit\s*note|proforma)\b",
        r"\b(?:bill\s*to|ship\s*to|gstin|pan\s*no|hsn(?:\s*code)?|sac(?:\s*code)?|subtotal|grand\s*total)\b",
        r"\b(?:bank\s*details|ifsc\s*code|payment\s*terms|purchase\s*order|po\s*no|delivery\s*challan)\b",
    ]

    def evaluate_eligibility(self, ocr_output: Dict[str, Any]) -> Dict[str, Any]:
        """
        Multi-signal evaluation:
        1. Evaluates Package Eligibility (Is this a packaged commodity?)
        2. Evaluates Compliance Evidence Sufficiency (Does this panel have full or partial declarations?)
        """
        lines: List[Dict[str, Any]] = ocr_output.get("lines", [])
        raw_text: str = ocr_output.get("raw_text", "")
        line_count: int = len(lines)

        # ---------------------------------------------------------------------
        # 1. Blank image or 0 readable text
        # ---------------------------------------------------------------------
        if line_count == 0 or not raw_text.strip():
            return {
                "is_eligible": False,
                "package_eligibility": PackageEligibilityStatus.INELIGIBLE_NON_PACKAGE,
                "compliance_evidence": ComplianceEvidenceStatus.INSUFFICIENT_IMAGE_QUALITY,
                "status": LabelEligibilityStatus.NO_READABLE_TEXT,
                "matched_categories": [],
                "signal_score": 0,
                "is_partial_panel": False,
                "reason": "No readable text was detected in the uploaded image.",
                "message": "No readable text could be detected in this image. Please upload a clear photograph of the product packaging.",
            }

        # ---------------------------------------------------------------------
        # 2. Strict Document / Invoice Exclusion Check
        # ---------------------------------------------------------------------
        doc_matches = [
            p for p in self.DOCUMENT_EXCLUSION_PATTERNS
            if re.search(p, raw_text, re.IGNORECASE)
        ]
        has_explicit_mrp = any(re.search(p, raw_text, re.IGNORECASE) for p in self.PRICE_PATTERNS)
        has_explicit_qty = any(re.search(p, raw_text, re.IGNORECASE) for p in self.QUANTITY_PATTERNS)

        # If it has prominent document/invoice markers and lacks full dual statutory proof (MRP + Qty)
        if doc_matches and not (has_explicit_mrp and has_explicit_qty):
            return {
                "is_eligible": False,
                "package_eligibility": PackageEligibilityStatus.INELIGIBLE_NON_PACKAGE,
                "compliance_evidence": ComplianceEvidenceStatus.INSUFFICIENT_IMAGE_QUALITY,
                "status": LabelEligibilityStatus.INSUFFICIENT_PACKAGE_LABEL_EVIDENCE,
                "matched_categories": ["document_exclusion"],
                "signal_score": 0,
                "is_partial_panel": False,
                "reason": "This image appears to be an institutional document, certificate, invoice, or credential rather than a packaged commodity label.",
                "message": "This image does not appear to be a packaged commodity label. LABEL LENS AI detected readable text, but identified it as an institutional document or invoice.",
            }

        # ---------------------------------------------------------------------
        # 3. Stray Isolated Word Check (e.g. "REDBULL" on a shirt, "EXIT")
        # ---------------------------------------------------------------------
        # If fewer than 3 lines of text and NO explicit statutory markers
        if line_count <= 2:
            has_statutory = any([
                any(re.search(p, raw_text, re.IGNORECASE) for p in self.PRICE_PATTERNS),
                any(re.search(p, raw_text, re.IGNORECASE) for p in self.QUANTITY_PATTERNS),
                any(re.search(p, raw_text, re.IGNORECASE) for p in self.DATE_PATTERNS),
                any(re.search(p, raw_text, re.IGNORECASE) for p in self.MANUFACTURER_PATTERNS),
            ])
            # A 1-2 line image with no numbers or statutory declaration is stray text
            if not has_statutory and not re.search(r"\d", raw_text):
                return {
                    "is_eligible": False,
                    "package_eligibility": PackageEligibilityStatus.INELIGIBLE_NON_PACKAGE,
                    "compliance_evidence": ComplianceEvidenceStatus.INSUFFICIENT_IMAGE_QUALITY,
                    "status": LabelEligibilityStatus.INSUFFICIENT_PACKAGE_LABEL_EVIDENCE,
                    "matched_categories": [],
                    "signal_score": 0,
                    "is_partial_panel": False,
                    "reason": f"Only isolated text without packaging declarations was detected ('{raw_text.strip()}').",
                    "message": "This image does not appear to be a packaged commodity label. LABEL LENS AI detected readable text, but identified it as isolated text without packaging declarations.",
                }

        # ---------------------------------------------------------------------
        # 4. Multi-Signal Scoring across Category A, B & C
        # -------------------------------------------------------------------------
        categories_matched: List[str] = []
        signal_score = 0

        # Category A: Regulatory / Statutory Signals
        has_price = any(re.search(p, raw_text, re.IGNORECASE) for p in self.PRICE_PATTERNS)
        if has_price:
            categories_matched.append("price_mrp")
            signal_score += 3

        has_qty = any(re.search(p, raw_text, re.IGNORECASE) for p in self.QUANTITY_PATTERNS)
        if has_qty:
            categories_matched.append("net_quantity")
            signal_score += 3

        has_mfg = any(re.search(p, raw_text, re.IGNORECASE) for p in self.MANUFACTURER_PATTERNS)
        if has_mfg:
            categories_matched.append("manufacturer_packer")
            signal_score += 2

        has_date = any(re.search(p, raw_text, re.IGNORECASE) for p in self.DATE_PATTERNS)
        if has_date:
            categories_matched.append("date_batch")
            signal_score += 2

        has_care = any(re.search(p, raw_text, re.IGNORECASE) for p in self.CONSUMER_CARE_PATTERNS)
        if has_care:
            categories_matched.append("consumer_care")
            signal_score += 2

        has_nutrition = any(re.search(p, raw_text, re.IGNORECASE) for p in self.PACKAGING_CONTEXT_PATTERNS)
        if has_nutrition:
            categories_matched.append("packaging_context")
            signal_score += 2

        # Category B: Product Identity & FMCG Terminology
        fmcg_matches = [
            p for p in self.FMCG_PRODUCT_PATTERNS
            if re.search(p, raw_text, re.IGNORECASE)
        ]
        if fmcg_matches:
            categories_matched.append("product_fmcg_signals")
            # 2 points per distinct FMCG pattern match (max 6)
            signal_score += min(6, len(fmcg_matches) * 2)

        # Category C: Package-Like Typography Structure
        # Packages feature multiple distinct short lines (brand name, product category, variants)
        clean_lines = [l["text"].strip() for l in lines if len(l.get("text", "").strip()) >= 2]
        is_package_typography = (
            len(clean_lines) >= 3
            and not doc_matches
            and all(len(line) <= 60 for line in clean_lines)  # short marketing / label lines
        )
        if is_package_typography:
            categories_matched.append("package_typography")
            signal_score += 2

        # ---------------------------------------------------------------------
        # 5. Classification Decision Logic
        # ---------------------------------------------------------------------
        is_eligible_package = False
        compliance_evidence = ComplianceEvidenceStatus.PARTIAL_PANEL_EVIDENCE
        reason = ""

        regulatory_count = sum(1 for c in ["price_mrp", "net_quantity", "manufacturer_packer", "date_batch", "consumer_care"] if c in categories_matched)

        if regulatory_count >= 3:
            is_eligible_package = True
            compliance_evidence = ComplianceEvidenceStatus.SUFFICIENT_FOR_SCREENING
            reason = f"Complete package label detected ({regulatory_count} statutory declaration domains verified)."
        elif regulatory_count >= 1 and (fmcg_matches or is_package_typography or regulatory_count >= 2):
            is_eligible_package = True
            compliance_evidence = (
                ComplianceEvidenceStatus.SUFFICIENT_FOR_SCREENING
                if (has_price and has_qty)
                else ComplianceEvidenceStatus.PARTIAL_PANEL_EVIDENCE
            )
            reason = f"Packaged commodity panel detected ({regulatory_count} statutory domain(s) with supporting packaging signals)."
        elif len(fmcg_matches) >= 1 and is_package_typography and line_count >= 3:
            # Typical front panel (e.g. MAGGI / Noodles / 2-minute / Goodness of Iron)
            is_eligible_package = True
            compliance_evidence = ComplianceEvidenceStatus.PARTIAL_PANEL_EVIDENCE
            reason = f"Packaged commodity front panel detected (Product branding & FMCG terms with packaging typography)."
        elif signal_score >= 4 and line_count >= 3 and not doc_matches:
            is_eligible_package = True
            compliance_evidence = ComplianceEvidenceStatus.PARTIAL_PANEL_EVIDENCE
            reason = f"Packaged commodity characteristics detected (Multi-signal evidence score {signal_score})."
        else:
            is_eligible_package = False
            compliance_evidence = ComplianceEvidenceStatus.INSUFFICIENT_IMAGE_QUALITY
            reason = "No packaging declaration markers or product packaging characteristics were detected."

        if is_eligible_package:
            is_partial = compliance_evidence == ComplianceEvidenceStatus.PARTIAL_PANEL_EVIDENCE
            msg = (
                "Packaged commodity front panel detected. Some declarations may be located on other panels."
                if is_partial
                else "Packaged commodity label verified as eligible for compliance screening."
            )
            return {
                "is_eligible": True,
                "package_eligibility": PackageEligibilityStatus.ELIGIBLE_PACKAGE,
                "compliance_evidence": compliance_evidence,
                "status": LabelEligibilityStatus.ELIGIBLE_FOR_PACKAGE_ANALYSIS,
                "matched_categories": categories_matched,
                "signal_score": signal_score,
                "is_partial_panel": is_partial,
                "reason": reason,
                "message": msg,
            }
        else:
            return {
                "is_eligible": False,
                "package_eligibility": PackageEligibilityStatus.INELIGIBLE_NON_PACKAGE,
                "compliance_evidence": ComplianceEvidenceStatus.INSUFFICIENT_IMAGE_QUALITY,
                "status": LabelEligibilityStatus.INSUFFICIENT_PACKAGE_LABEL_EVIDENCE,
                "matched_categories": categories_matched,
                "signal_score": signal_score,
                "is_partial_panel": False,
                "reason": reason,
                "message": "This image does not appear to be a packaged commodity label. LABEL LENS AI detected readable text, but there is insufficient evidence to identify this image as a packaged commodity label.",
            }
