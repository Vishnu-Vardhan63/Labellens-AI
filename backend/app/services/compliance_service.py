"""Compliance Service — Phase 3.

Configurable, explainable compliance evaluation engine.
Evaluates extracted packaged commodity declarations against the
Legal Metrology (Packaged Commodities) Rules, 2011.

Adheres strictly to the legal safety requirement:
- Never makes definitive legal conclusions or declares packages "illegal"
- Uses explainable screening statuses:
    * VERIFIED ("Verified from detected information")
    * MANUAL REVIEW REQUIRED ("Requires manual verification")
    * POTENTIAL ISSUE ("Could not be verified from uploaded image")
- Distinguishes "NOT DETECTED FROM IMAGE" from "MISSING FROM PACKAGE"
"""
from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

# Path to configurable rules JSON
RULES_FILE = Path(__file__).resolve().parent.parent / "rules" / "packaged_commodities_rules.json"


class ComplianceStatus:
    VERIFIED = "verified"
    MANUAL_REVIEW = "manual_review"
    POTENTIAL_ISSUE = "potential_issue"
    NOT_DETECTED = "not_detected"


class OverallAssessment:
    INFORMATION_VERIFIED = "information_verified"
    MANUAL_REVIEW_RECOMMENDED = "manual_review_recommended"
    POTENTIAL_ISSUES_DETECTED = "potential_issues_detected"
    INSUFFICIENT_PACKAGE_LABEL_EVIDENCE = "INSUFFICIENT_PACKAGE_LABEL_EVIDENCE"
    NO_READABLE_TEXT = "NO_READABLE_TEXT"


class ComplianceService:
    """Configurable compliance rule engine for packaged commodities."""

    def __init__(self, rules_path: Optional[Path] = None) -> None:
        self.rules_path = rules_path or RULES_FILE
        self.rules_data = self._load_rules()

    def _load_rules(self) -> Dict[str, Any]:
        """Load and cache rules from JSON configuration file."""
        try:
            if self.rules_path.exists():
                with open(self.rules_path, "r", encoding="utf-8-sig") as f:
                    return json.load(f)
            else:
                logger.warning(f"Rules file not found at {self.rules_path}. Using fallback rules.")
                return {"rules": []}
        except Exception as e:
            logger.error(f"Failed to parse rules file {self.rules_path}: {e}")
            return {"rules": []}

    def evaluate(
        self,
        extracted_fields: Dict[str, Any],
        raw_ocr_text: str = "",
        is_eligible: bool = True,
        eligibility_status: str = "ELIGIBLE_FOR_PACKAGE_ANALYSIS",
        eligibility_reason: str = "",
    ) -> Dict[str, Any]:
        """
        Evaluate extracted package fields against all configured compliance rules.
        If is_eligible is False, screening is suspended without false violations.
        """
        if not is_eligible:
            is_no_text = eligibility_status == "NO_READABLE_TEXT"
            return {
                "overall_assessment": eligibility_status,
                "overall_label": "Analysis Not Performed",
                "overall_description": (
                    "No readable text could be detected in this image. Please upload a clear image of the product packaging."
                    if is_no_text
                    else "This image does not appear to be a packaged commodity label. Compliance screening was not performed."
                ),
                "disclaimer": "Screening was suspended because the image lacks required packaging declaration markers.",
                "summary": {
                    "verified": 0,
                    "manual_review": 0,
                    "potential_issue": 0,
                    "total_rules": 0,
                },
                "rule_results": [],
                "is_eligible": False,
                "eligibility_status": eligibility_status,
                "eligibility_reason": eligibility_reason,
            }

        rules = self.rules_data.get("rules", [])
        rule_results: List[Dict[str, Any]] = []

        for rule in rules:
            result = self._evaluate_rule(rule, extracted_fields, raw_ocr_text)
            rule_results.append(result)

        # Calculate counts
        verified_count = sum(1 for r in rule_results if r["status"] == ComplianceStatus.VERIFIED)
        manual_review_count = sum(1 for r in rule_results if r["status"] == ComplianceStatus.MANUAL_REVIEW)
        potential_issue_count = sum(1 for r in rule_results if r["status"] == ComplianceStatus.POTENTIAL_ISSUE)
        total_rules = len(rule_results)

        # Determine overall assessment:
        # POTENTIAL_ISSUES_DETECTED ONLY if there is a genuine structural conflict (e.g. negative price, non-standard unit)
        high_severity_issues = sum(
            1 for r in rule_results
            if r["status"] == ComplianceStatus.POTENTIAL_ISSUE and r.get("severity") == "high"
        )

        if high_severity_issues > 0:
            overall = OverallAssessment.POTENTIAL_ISSUES_DETECTED
            overall_label = "Potential Declaration Issues Detected"
            overall_description = (
                "A structural declaration issue was detected. Manual inspection of the physical package is recommended."
            )
        elif potential_issue_count > 0 or manual_review_count > 0:
            overall = OverallAssessment.MANUAL_REVIEW_RECOMMENDED
            overall_label = "Manual Review Recommended"
            overall_description = (
                "Declarations were reviewed. One or more declarations were not verified on this image panel "
                "or require human confirmation."
            )
        else:
            overall = OverallAssessment.INFORMATION_VERIFIED
            overall_label = "Information Verified"
            overall_description = (
                "All mandatory packaged commodity declarations were detected and verified from the uploaded image "
                "with high confidence."
            )

        return {
            "overall_assessment": overall,
            "overall_label": overall_label,
            "overall_description": overall_description,
            "disclaimer": (
                "This assessment is based on automated analysis of the uploaded image and should be "
                "manually verified where required. This screening tool does not constitute a legal certification."
            ),
            "summary": {
                "verified": verified_count,
                "manual_review": manual_review_count,
                "potential_issue": potential_issue_count,
                "total_rules": total_rules,
            },
            "rule_results": rule_results,
            "is_eligible": True,
            "eligibility_status": eligibility_status,
            "eligibility_reason": eligibility_reason,
        }

    def _evaluate_rule(
        self,
        rule: Dict[str, Any],
        extracted_fields: Dict[str, Any],
        raw_ocr_text: str,
    ) -> Dict[str, Any]:
        """Dispatcher for specific validation types."""
        v_type = rule.get("validation_type", "presence_and_confidence")
        field_name = rule.get("field")
        field_data = extracted_fields.get(field_name, {})

        if v_type == "presence_and_confidence":
            return self._validate_presence_and_confidence(rule, field_data)
        elif v_type == "net_quantity_format":
            return self._validate_net_quantity(rule, field_data)
        elif v_type == "mrp_format":
            return self._validate_mrp(rule, field_data, raw_ocr_text)
        elif v_type == "manufacturer_format":
            return self._validate_manufacturer(rule, field_data)
        elif v_type == "dates_format":
            return self._validate_dates(rule, field_data)
        elif v_type == "consumer_care_format":
            return self._validate_consumer_care(rule, field_data)
        else:
            return self._validate_presence_and_confidence(rule, field_data)

    # -------------------------------------------------------------------------
    # Rule Handlers
    # -------------------------------------------------------------------------
    def _validate_presence_and_confidence(
        self, rule: Dict[str, Any], field_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        detected = field_data.get("detected", False)
        val = field_data.get("value")
        raw_text = field_data.get("raw_text")
        conf_level = field_data.get("confidence_level", "not_detected")
        score = field_data.get("confidence", 0.0)

        thresholds = rule.get("confidence_thresholds", {"verified_min": 0.80, "review_min": 0.50})

        if not detected or not val:
            return {
                "rule_id": rule["rule_id"],
                "field": rule["field"],
                "display_name": rule["display_name"],
                "legal_reference": rule.get("legal_reference"),
                "severity": rule.get("severity", "medium"),
                "status": ComplianceStatus.POTENTIAL_ISSUE if rule.get("required") else ComplianceStatus.MANUAL_REVIEW,
                "extracted_value": None,
                "confidence": conf_level,
                "explanation": f"The {rule['display_name']} could not be verified from the uploaded image.",
                "evidence": None,
                "recommendation": rule.get("recommendation_on_issue"),
            }

        if score >= thresholds.get("verified_min", 0.80):
            return {
                "rule_id": rule["rule_id"],
                "field": rule["field"],
                "display_name": rule["display_name"],
                "legal_reference": rule.get("legal_reference"),
                "severity": rule.get("severity", "medium"),
                "status": ComplianceStatus.VERIFIED,
                "extracted_value": str(val),
                "confidence": conf_level,
                "explanation": f"The {rule['display_name']} was detected with high confidence ({score * 100:.1f}%).",
                "evidence": raw_text,
                "recommendation": rule.get("recommendation_on_verified"),
            }
        else:
            return {
                "rule_id": rule["rule_id"],
                "field": rule["field"],
                "display_name": rule["display_name"],
                "legal_reference": rule.get("legal_reference"),
                "severity": rule.get("severity", "medium"),
                "status": ComplianceStatus.MANUAL_REVIEW,
                "extracted_value": str(val),
                "confidence": conf_level,
                "explanation": (
                    f"Possible {rule['display_name']} detected, but OCR confidence ({score * 100:.1f}%) "
                    "requires visual confirmation."
                ),
                "evidence": raw_text,
                "recommendation": rule.get("recommendation_on_review"),
            }

    def _validate_net_quantity(
        self, rule: Dict[str, Any], field_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        detected = field_data.get("detected", False)
        val = field_data.get("value")
        unit = field_data.get("unit")
        raw_text = field_data.get("raw_text")
        conf_level = field_data.get("confidence_level", "not_detected")
        score = field_data.get("confidence", 0.0)

        thresholds = rule.get("confidence_thresholds", {"verified_min": 0.80, "review_min": 0.50})
        allowed_units = [u.lower() for u in rule.get("allowed_units", ["g", "kg", "ml", "l", "units"])]

        if not detected or val is None or not unit:
            return {
                "rule_id": rule["rule_id"],
                "field": rule["field"],
                "display_name": rule["display_name"],
                "legal_reference": rule.get("legal_reference"),
                "severity": rule.get("severity", "high"),
                "status": ComplianceStatus.MANUAL_REVIEW,
                "extracted_value": None,
                "confidence": conf_level,
                "explanation": "Net quantity declaration was not detected on this image panel. Physical verification of other package panels recommended.",
                "evidence": None,
                "recommendation": rule.get("recommendation_on_review") or rule.get("recommendation_on_issue"),
            }

        # Check numeric validity
        try:
            num_val = float(val)
            if num_val <= 0:
                return {
                    "rule_id": rule["rule_id"],
                    "field": rule["field"],
                    "display_name": rule["display_name"],
                    "legal_reference": rule.get("legal_reference"),
                    "severity": rule.get("severity", "high"),
                    "status": ComplianceStatus.POTENTIAL_ISSUE,
                    "extracted_value": f"{val} {unit}",
                    "confidence": conf_level,
                    "explanation": f"Detected net quantity value ({val}) is non-positive or structurally invalid.",
                    "evidence": raw_text,
                    "recommendation": rule.get("recommendation_on_issue"),
                }
        except (ValueError, TypeError):
            pass

        # Check unit validity
        unit_clean = str(unit).lower().strip()
        if unit_clean not in allowed_units:
            return {
                "rule_id": rule["rule_id"],
                "field": rule["field"],
                "display_name": rule["display_name"],
                "legal_reference": rule.get("legal_reference"),
                "severity": rule.get("severity", "high"),
                "status": ComplianceStatus.MANUAL_REVIEW,
                "extracted_value": f"{val} {unit}",
                "confidence": conf_level,
                "explanation": f"Detected measurement unit '{unit}' requires manual review for metric standard conformance.",
                "evidence": raw_text,
                "recommendation": rule.get("recommendation_on_review"),
            }

        # Conf check
        if score >= thresholds.get("verified_min", 0.80):
            return {
                "rule_id": rule["rule_id"],
                "field": rule["field"],
                "display_name": rule["display_name"],
                "legal_reference": rule.get("legal_reference"),
                "severity": rule.get("severity", "high"),
                "status": ComplianceStatus.VERIFIED,
                "extracted_value": f"{val} {unit}",
                "confidence": conf_level,
                "explanation": f"Net quantity ({val} {unit}) detected in standard metric units with high confidence.",
                "evidence": raw_text,
                "recommendation": rule.get("recommendation_on_verified"),
            }
        else:
            return {
                "rule_id": rule["rule_id"],
                "field": rule["field"],
                "display_name": rule["display_name"],
                "legal_reference": rule.get("legal_reference"),
                "severity": rule.get("severity", "high"),
                "status": ComplianceStatus.MANUAL_REVIEW,
                "extracted_value": f"{val} {unit}",
                "confidence": conf_level,
                "explanation": f"Net quantity ({val} {unit}) detected with moderate confidence ({score * 100:.1f}%).",
                "evidence": raw_text,
                "recommendation": rule.get("recommendation_on_review"),
            }

    def _validate_mrp(
        self, rule: Dict[str, Any], field_data: Dict[str, Any], raw_ocr_text: str
    ) -> Dict[str, Any]:
        detected = field_data.get("detected", False)
        val = field_data.get("value")
        currency = field_data.get("currency", "INR")
        tax_incl = field_data.get("inclusive_of_taxes", False)
        raw_text = field_data.get("raw_text")
        conf_level = field_data.get("confidence_level", "not_detected")
        score = field_data.get("confidence", 0.0)

        thresholds = rule.get("confidence_thresholds", {"verified_min": 0.80, "review_min": 0.50})

        if not detected or val is None:
            return {
                "rule_id": rule["rule_id"],
                "field": rule["field"],
                "display_name": rule["display_name"],
                "legal_reference": rule.get("legal_reference"),
                "severity": rule.get("severity", "high"),
                "status": ComplianceStatus.MANUAL_REVIEW,
                "extracted_value": None,
                "confidence": conf_level,
                "explanation": "Maximum Retail Price (MRP) declaration was not detected on this image panel. Physical verification recommended.",
                "evidence": None,
                "recommendation": rule.get("recommendation_on_review") or rule.get("recommendation_on_issue"),
            }

        # Check positive price value
        try:
            num_val = float(val)
            if num_val <= 0:
                return {
                    "rule_id": rule["rule_id"],
                    "field": rule["field"],
                    "display_name": rule["display_name"],
                    "legal_reference": rule.get("legal_reference"),
                    "severity": rule.get("severity", "high"),
                    "status": ComplianceStatus.POTENTIAL_ISSUE,
                    "extracted_value": f"₹{val}",
                    "confidence": conf_level,
                    "explanation": f"Detected MRP value (₹{val}) is zero or negative.",
                    "evidence": raw_text,
                    "recommendation": rule.get("recommendation_on_issue"),
                }
        except (ValueError, TypeError):
            pass

        # Check tax-inclusive declaration
        if not tax_incl:
            return {
                "rule_id": rule["rule_id"],
                "field": rule["field"],
                "display_name": rule["display_name"],
                "legal_reference": rule.get("legal_reference"),
                "severity": rule.get("severity", "high"),
                "status": ComplianceStatus.MANUAL_REVIEW,
                "extracted_value": f"₹{val}",
                "confidence": conf_level,
                "explanation": (
                    f"MRP of ₹{val} detected, but the mandatory 'incl. of all taxes' declaration was not clearly read. "
                    "Manual verification is recommended."
                ),
                "evidence": raw_text,
                "recommendation": rule.get("recommendation_on_review"),
            }

        if score >= thresholds.get("verified_min", 0.80):
            return {
                "rule_id": rule["rule_id"],
                "field": rule["field"],
                "display_name": rule["display_name"],
                "legal_reference": rule.get("legal_reference"),
                "severity": rule.get("severity", "high"),
                "status": ComplianceStatus.VERIFIED,
                "extracted_value": f"₹{val} (incl. of all taxes)",
                "confidence": conf_level,
                "explanation": f"MRP (₹{val}) detected with 'incl. of all taxes' under high confidence ({score * 100:.1f}%).",
                "evidence": raw_text,
                "recommendation": rule.get("recommendation_on_verified"),
            }
        else:
            return {
                "rule_id": rule["rule_id"],
                "field": rule["field"],
                "display_name": rule["display_name"],
                "legal_reference": rule.get("legal_reference"),
                "severity": rule.get("severity", "high"),
                "status": ComplianceStatus.MANUAL_REVIEW,
                "extracted_value": f"₹{val}",
                "confidence": conf_level,
                "explanation": f"MRP detected with moderate confidence ({score * 100:.1f}%). Manual inspection advised.",
                "evidence": raw_text,
                "recommendation": rule.get("recommendation_on_review"),
            }

    def _validate_manufacturer(
        self, rule: Dict[str, Any], field_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        detected = field_data.get("detected", False)
        org_name = field_data.get("organization_name")
        address = field_data.get("address")
        pin = field_data.get("postal_code")
        raw_text = field_data.get("raw_text")
        conf_level = field_data.get("confidence_level", "not_detected")
        score = field_data.get("confidence", 0.0)

        thresholds = rule.get("confidence_thresholds", {"verified_min": 0.75, "review_min": 0.50})

        if not detected or (not org_name and not address):
            return {
                "rule_id": rule["rule_id"],
                "field": rule["field"],
                "display_name": rule["display_name"],
                "legal_reference": rule.get("legal_reference"),
                "severity": rule.get("severity", "high"),
                "status": ComplianceStatus.MANUAL_REVIEW,
                "extracted_value": None,
                "confidence": conf_level,
                "explanation": "Manufacturer or packer details were not detected on this image panel. Physical verification recommended.",
                "evidence": None,
                "recommendation": rule.get("recommendation_on_review") or rule.get("recommendation_on_issue"),
            }

        summary_val = org_name or address or ""
        if pin and pin not in summary_val:
            summary_val += f" (PIN: {pin})"

        if score >= thresholds.get("verified_min", 0.75) and (pin or len(summary_val) > 25):
            return {
                "rule_id": rule["rule_id"],
                "field": rule["field"],
                "display_name": rule["display_name"],
                "legal_reference": rule.get("legal_reference"),
                "severity": rule.get("severity", "high"),
                "status": ComplianceStatus.VERIFIED,
                "extracted_value": summary_val,
                "confidence": conf_level,
                "explanation": "Manufacturer/packer name and location context verified from detected information.",
                "evidence": raw_text,
                "recommendation": rule.get("recommendation_on_verified"),
            }
        else:
            return {
                "rule_id": rule["rule_id"],
                "field": rule["field"],
                "display_name": rule["display_name"],
                "legal_reference": rule.get("legal_reference"),
                "severity": rule.get("severity", "high"),
                "status": ComplianceStatus.MANUAL_REVIEW,
                "extracted_value": summary_val,
                "confidence": conf_level,
                "explanation": (
                    "Manufacturer or packer details detected, but address completeness or postal PIN code "
                    "requires manual verification."
                ),
                "evidence": raw_text,
                "recommendation": rule.get("recommendation_on_review"),
            }

    def _validate_dates(
        self, rule: Dict[str, Any], field_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        detected = field_data.get("detected", False)
        mfg = field_data.get("mfg_date")
        exp = field_data.get("expiry_date")
        bb = field_data.get("best_before")
        batch = field_data.get("batch_number")
        raw_text = field_data.get("raw_text")
        conf_level = field_data.get("confidence_level", "not_detected")
        score = field_data.get("confidence", 0.0)

        thresholds = rule.get("confidence_thresholds", {"verified_min": 0.75, "review_min": 0.50})

        if not detected or not (mfg or exp or bb):
            return {
                "rule_id": rule["rule_id"],
                "field": rule["field"],
                "display_name": rule["display_name"],
                "legal_reference": rule.get("legal_reference"),
                "severity": rule.get("severity", "medium"),
                "status": ComplianceStatus.MANUAL_REVIEW,
                "extracted_value": None,
                "confidence": conf_level,
                "explanation": "Manufacturing date, expiry date, or batch details were not detected on this image panel.",
                "evidence": None,
                "recommendation": rule.get("recommendation_on_review") or rule.get("recommendation_on_issue"),
            }

        date_snippets = []
        if mfg:
            date_snippets.append(f"Mfg: {mfg}")
        if exp:
            date_snippets.append(f"Exp: {exp}")
        if bb:
            date_snippets.append(f"Best Before: {bb}")
        if batch:
            date_snippets.append(f"Batch: {batch}")

        summary_val = ", ".join(date_snippets)

        if score >= thresholds.get("verified_min", 0.75):
            return {
                "rule_id": rule["rule_id"],
                "field": rule["field"],
                "display_name": rule["display_name"],
                "legal_reference": rule.get("legal_reference"),
                "severity": rule.get("severity", "medium"),
                "status": ComplianceStatus.VERIFIED,
                "extracted_value": summary_val,
                "confidence": conf_level,
                "explanation": "Mandatory date declarations detected with sufficient confidence.",
                "evidence": raw_text,
                "recommendation": rule.get("recommendation_on_verified"),
            }
        else:
            return {
                "rule_id": rule["rule_id"],
                "field": rule["field"],
                "display_name": rule["display_name"],
                "legal_reference": rule.get("legal_reference"),
                "severity": rule.get("severity", "medium"),
                "status": ComplianceStatus.MANUAL_REVIEW,
                "extracted_value": summary_val,
                "confidence": conf_level,
                "explanation": "Date declarations detected with moderate confidence. Stamping requires human review.",
                "evidence": raw_text,
                "recommendation": rule.get("recommendation_on_review"),
            }

    def _validate_consumer_care(
        self, rule: Dict[str, Any], field_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        detected = field_data.get("detected", False)
        toll_free = field_data.get("toll_free")
        phone = field_data.get("phone")
        email = field_data.get("email")
        raw_text = field_data.get("raw_text")
        conf_level = field_data.get("confidence_level", "not_detected")
        score = field_data.get("confidence", 0.0)

        thresholds = rule.get("confidence_thresholds", {"verified_min": 0.75, "review_min": 0.50})

        if not detected or not (toll_free or phone or email):
            return {
                "rule_id": rule["rule_id"],
                "field": rule["field"],
                "display_name": rule["display_name"],
                "legal_reference": rule.get("legal_reference"),
                "severity": rule.get("severity", "medium"),
                "status": ComplianceStatus.MANUAL_REVIEW,
                "extracted_value": None,
                "confidence": conf_level,
                "explanation": "Consumer care contact details were not detected on this image panel. Check reverse or side panel.",
                "evidence": None,
                "recommendation": rule.get("recommendation_on_review") or rule.get("recommendation_on_issue"),
            }

        contact_parts = []
        if toll_free:
            contact_parts.append(f"Toll Free: {toll_free}")
        if phone:
            contact_parts.append(f"Ph: {phone}")
        if email:
            contact_parts.append(f"Email: {email}")

        summary_val = " | ".join(contact_parts)

        if score >= thresholds.get("verified_min", 0.75) and (toll_free or email):
            return {
                "rule_id": rule["rule_id"],
                "field": rule["field"],
                "display_name": rule["display_name"],
                "legal_reference": rule.get("legal_reference"),
                "severity": rule.get("severity", "medium"),
                "status": ComplianceStatus.VERIFIED,
                "extracted_value": summary_val,
                "confidence": conf_level,
                "explanation": "Consumer grievance redressal channel (toll-free number / email) verified.",
                "evidence": raw_text,
                "recommendation": rule.get("recommendation_on_verified"),
            }
        else:
            return {
                "rule_id": rule["rule_id"],
                "field": rule["field"],
                "display_name": rule["display_name"],
                "legal_reference": rule.get("legal_reference"),
                "severity": rule.get("severity", "medium"),
                "status": ComplianceStatus.MANUAL_REVIEW,
                "extracted_value": summary_val,
                "confidence": conf_level,
                "explanation": "Consumer care information detected, but contact channel completeness requires manual review.",
                "evidence": raw_text,
                "recommendation": rule.get("recommendation_on_review"),
            }
