"""Copilot Service — Phase 4.

Lightweight, explainable AI Compliance Copilot for package label inspection.
Provides deterministic, structured insights strictly derived from actual scan data:
- OCR text results
- Extracted package fields
- Compliance rule validation outcomes

Adheres strictly to zero-hallucination principles:
- Never invents package declarations or external legal certifications
- Transparently cites detected evidence and bounding coordinates
- Operates 100% locally and offline without external paid LLM APIs
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


class CopilotIntent:
    WHY_REVIEW = "WHY_REVIEW"
    SHOW_DETECTED = "SHOW_DETECTED_INFORMATION"
    SHOW_ISSUES = "SHOW_POTENTIAL_ISSUES"
    WHAT_TO_CHECK = "WHAT_TO_CHECK_MANUALLY"
    FIELD_QUERY = "FIELD_QUERY"
    GENERAL = "GENERAL"


class CopilotService:
    """Inspector compliance assistant grounded exclusively in real scan data."""

    def answer_query(
        self,
        scan_id: str,
        extracted_fields: Dict[str, Any],
        compliance_results: List[Dict[str, Any]],
        overall_assessment: Optional[str] = None,
        raw_ocr_text: str = "",
        intent: Optional[str] = None,
        query: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Produce a grounded, explainable answer based on real scan data.
        """
        # Resolve intent from query string if intent not explicitly passed
        resolved_intent = self._resolve_intent(intent, query)

        if resolved_intent == CopilotIntent.WHY_REVIEW:
            return self._handle_why_review(scan_id, compliance_results, overall_assessment)
        elif resolved_intent == CopilotIntent.SHOW_DETECTED:
            return self._handle_show_detected(scan_id, extracted_fields, compliance_results)
        elif resolved_intent == CopilotIntent.SHOW_ISSUES:
            return self._handle_show_issues(scan_id, compliance_results)
        elif resolved_intent == CopilotIntent.WHAT_TO_CHECK:
            return self._handle_what_to_check(scan_id, extracted_fields, compliance_results)
        else:
            return self._handle_general_query(scan_id, query or "", extracted_fields, compliance_results, raw_ocr_text)

    def _resolve_intent(self, intent: Optional[str], query: Optional[str]) -> str:
        if intent in [
            CopilotIntent.WHY_REVIEW,
            CopilotIntent.SHOW_DETECTED,
            CopilotIntent.SHOW_ISSUES,
            CopilotIntent.WHAT_TO_CHECK,
        ]:
            return intent

        q = (query or "").lower().strip()
        if not q:
            return CopilotIntent.SHOW_DETECTED

        if any(k in q for k in ["why", "review", "manual", "attention", "moderate", "flag"]):
            return CopilotIntent.WHY_REVIEW
        elif any(k in q for k in ["issue", "problem", "missing", "potential", "failed", "violation", "alert"]):
            return CopilotIntent.SHOW_ISSUES
        elif any(k in q for k in ["check", "inspect", "recommend", "next", "action", "physical"]):
            return CopilotIntent.WHAT_TO_CHECK
        elif any(k in q for k in ["detected", "extract", "found", "summary", "read", "details", "info"]):
            return CopilotIntent.SHOW_DETECTED

        return CopilotIntent.GENERAL

    # -------------------------------------------------------------------------
    # Intent Handlers
    # -------------------------------------------------------------------------
    def _handle_why_review(
        self, scan_id: str, compliance_results: List[Dict[str, Any]], overall_assessment: Optional[str]
    ) -> Dict[str, Any]:
        review_items = [r for r in compliance_results if r.get("status") == "manual_review"]

        if not review_items:
            if overall_assessment == "information_verified":
                answer = (
                    "None of the mandatory declarations currently require manual review. "
                    "All required package declarations were detected with high OCR confidence (≥ 80%) "
                    "and conformed to structural standards under the Legal Metrology Rules, 2011."
                )
            else:
                answer = (
                    "There are no items flagged specifically for manual review. "
                    "However, please inspect the declarations flagged under 'Potential Issues' to verify whether "
                    "they appear on other panels of the package."
                )
            return {
                "scan_id": scan_id,
                "intent": CopilotIntent.WHY_REVIEW,
                "question": "Why does this package require review?",
                "answer": answer,
                "evidence_fields": [],
                "suggested_actions": ["Review overall declaration summary"],
            }

        reasons = []
        evidence_fields = []
        suggested_actions = []

        for item in review_items:
            name = item.get("display_name", item.get("field", "Declaration"))
            exp = item.get("explanation", "Moderate OCR confidence or formatting ambiguity.")
            field_key = item.get("field", "")
            evidence_fields.append(field_key)
            reasons.append(f"• {name}: {exp}")

            if item.get("recommendation"):
                suggested_actions.append(item["recommendation"])

        answer = (
            f"This package was flagged for manual review because {len(review_items)} declaration(s) "
            f"could not be automatically verified with full confidence:\n\n"
            + "\n".join(reasons)
            + "\n\nAutomated screening flags these items to prevent false assumptions when text is partially obscured or ambiguous."
        )

        return {
            "scan_id": scan_id,
            "intent": CopilotIntent.WHY_REVIEW,
            "question": "Why does this package require review?",
            "answer": answer,
            "evidence_fields": evidence_fields,
            "suggested_actions": suggested_actions[:3],
        }

    def _handle_show_detected(
        self, scan_id: str, extracted_fields: Dict[str, Any], compliance_results: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        detected_items = []
        evidence_fields = []

        field_labels = {
            "product_name": "Product Name",
            "mrp": "Maximum Retail Price",
            "net_quantity": "Net Quantity",
            "manufacturer_packer": "Manufacturer/Packer",
            "date_information": "Dates / Batch",
            "consumer_care": "Consumer Care",
        }

        for field_key, label in field_labels.items():
            f_data = extracted_fields.get(field_key, {})
            if f_data.get("detected"):
                val = f_data.get("value")
                if field_key == "mrp":
                    incl = " (incl. of all taxes)" if f_data.get("inclusive_of_taxes") else ""
                    val_str = f"₹{val}{incl}"
                elif field_key == "net_quantity":
                    val_str = f"{val} {f_data.get('unit', '')}"
                elif field_key == "manufacturer_packer":
                    val_str = f_data.get("organization_name") or f_data.get("address")
                elif field_key == "date_information":
                    d_parts = [f"Mfg: {f_data['mfg_date']}"] if f_data.get("mfg_date") else []
                    if f_data.get("expiry_date"):
                        d_parts.append(f"Exp: {f_data['expiry_date']}")
                    val_str = ", ".join(d_parts) or f_data.get("raw_text")
                elif field_key == "consumer_care":
                    val_str = f_data.get("toll_free") or f_data.get("email") or f_data.get("phone")
                else:
                    val_str = str(val)

                conf_pct = (f_data.get("confidence", 0.0)) * 100
                detected_items.append(f"• {label}: {val_str} (OCR Confidence: {conf_pct:.0f}%)")
                evidence_fields.append(field_key)

        if not detected_items:
            answer = (
                "The uploaded image does not provide enough evidence to detect mandatory package declarations clearly. "
                "Please verify the label image quality and ensure proper illumination."
            )
        else:
            answer = (
                f"The automated extraction engine identified {len(detected_items)} declaration(s) on the package label:\n\n"
                + "\n".join(detected_items)
                + "\n\nEach item has been mapped to physical OCR bounding box coordinates on the package image."
            )

        return {
            "scan_id": scan_id,
            "intent": CopilotIntent.SHOW_DETECTED,
            "question": "What information was detected on this package?",
            "answer": answer,
            "evidence_fields": evidence_fields,
            "suggested_actions": ["Select a declaration to highlight its position on the image"],
        }

    def _handle_show_issues(
        self, scan_id: str, compliance_results: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        issues = [r for r in compliance_results if r.get("status") == "potential_issue"]

        if not issues:
            answer = (
                "No potential declaration issues were detected on this image! "
                "All mandatory Legal Metrology declarations that were required were either verified "
                "or flagged for minor manual confirmation."
            )
            return {
                "scan_id": scan_id,
                "intent": CopilotIntent.SHOW_ISSUES,
                "question": "Show potential issues",
                "answer": answer,
                "evidence_fields": [],
                "suggested_actions": ["Review verified declarations on the package image"],
            }

        issue_lines = []
        evidence_fields = []
        suggested_actions = []

        for item in issues:
            name = item.get("display_name", item.get("field", "Declaration"))
            exp = item.get("explanation", "Could not be verified from the uploaded image.")
            ref = item.get("legal_reference", "Rule 6, PC Rules 2011")
            field_key = item.get("field", "")
            evidence_fields.append(field_key)
            issue_lines.append(f"• {name} ({ref}):\n  {exp}")

            if item.get("recommendation"):
                suggested_actions.append(item["recommendation"])

        answer = (
            f"The screening engine identified {len(issues)} potential declaration issue(s) based on the uploaded image:\n\n"
            + "\n\n".join(issue_lines)
            + "\n\nNote: 'Could not be verified from the image' does not confirm that the information is missing from the physical package. "
            "Please check if these declarations are stamped on other faces, seals, or crimps of the packaging."
        )

        return {
            "scan_id": scan_id,
            "intent": CopilotIntent.SHOW_ISSUES,
            "question": "Show potential issues",
            "answer": answer,
            "evidence_fields": evidence_fields,
            "suggested_actions": suggested_actions[:3],
        }

    def _handle_what_to_check(
        self, scan_id: str, extracted_fields: Dict[str, Any], compliance_results: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        checklist = []
        evidence_fields = []

        # Find items that need manual check
        review_or_issue = [r for r in compliance_results if r.get("status") in ["manual_review", "potential_issue"]]

        if not review_or_issue:
            checklist.append("1. Principal Display Panel: Verify that all declared text is legible to the naked eye.")
            checklist.append("2. Barcode & Batch Code: Ensure the ink-jet batch code matches the printed manufacturing date.")
            checklist.append("3. Tamper Seal: Verify that package seals are intact.")
        else:
            for idx, item in enumerate(review_or_issue, 1):
                name = item.get("display_name", item.get("field", "Declaration"))
                rec = item.get("recommendation", f"Manually verify {name} on the physical package.")
                field_key = item.get("field", "")
                evidence_fields.append(field_key)
                checklist.append(f"{idx}. {name}: {rec}")

        answer = (
            "Recommended Inspector Physical Verification Checklist:\n\n"
            + "\n\n".join(checklist)
            + "\n\nThis checklist is dynamically prioritized based on the declarations that could not be verified automatically."
        )

        return {
            "scan_id": scan_id,
            "intent": CopilotIntent.WHAT_TO_CHECK,
            "question": "What should an inspector check manually?",
            "answer": answer,
            "evidence_fields": evidence_fields,
            "suggested_actions": ["Examine package seals and physical packaging panels"],
        }

    def _handle_general_query(
        self,
        scan_id: str,
        query: str,
        extracted_fields: Dict[str, Any],
        compliance_results: List[Dict[str, Any]],
        raw_ocr_text: str,
    ) -> Dict[str, Any]:
        q = query.lower()

        # Specific field inquiry routing
        if "mrp" in q or "price" in q or "cost" in q:
            mrp_data = extracted_fields.get("mrp", {})
            if mrp_data.get("detected"):
                val = mrp_data.get("value")
                incl = "inclusive of all taxes" if mrp_data.get("inclusive_of_taxes") else "tax inclusion unconfirmed"
                answer = f"The detected Maximum Retail Price is ₹{val} ({incl}) with {mrp_data.get('confidence_level')} OCR confidence."
                return {
                    "scan_id": scan_id,
                    "intent": CopilotIntent.FIELD_QUERY,
                    "question": query,
                    "answer": answer,
                    "evidence_fields": ["mrp"],
                    "suggested_actions": ["Highlight MRP on package image"],
                }
            else:
                return {
                    "scan_id": scan_id,
                    "intent": CopilotIntent.FIELD_QUERY,
                    "question": query,
                    "answer": "Maximum Retail Price (MRP) was not detected from this image. Please check the physical package panel.",
                    "evidence_fields": ["mrp"],
                    "suggested_actions": ["Search package for price marking"],
                }

        if "quantity" in q or "weight" in q or "volume" in q or "qty" in q:
            qty_data = extracted_fields.get("net_quantity", {})
            if qty_data.get("detected"):
                answer = f"The detected Net Quantity is {qty_data.get('value')} {qty_data.get('unit')} ({qty_data.get('confidence_level')} confidence)."
                return {
                    "scan_id": scan_id,
                    "intent": CopilotIntent.FIELD_QUERY,
                    "question": query,
                    "answer": answer,
                    "evidence_fields": ["net_quantity"],
                    "suggested_actions": ["Highlight Net Quantity on package image"],
                }
            else:
                return {
                    "scan_id": scan_id,
                    "intent": CopilotIntent.FIELD_QUERY,
                    "question": query,
                    "answer": "Net Quantity was not detected from this image.",
                    "evidence_fields": ["net_quantity"],
                    "suggested_actions": ["Inspect label for metric volume or weight declaration"],
                }

        if "manufacturer" in q or "packer" in q or "who made" in q or "company" in q:
            mfg_data = extracted_fields.get("manufacturer_packer", {})
            if mfg_data.get("detected"):
                org = mfg_data.get("organization_name") or "Declared organization"
                addr = mfg_data.get("address") or ""
                pin = f" PIN: {mfg_data.get('postal_code')}" if mfg_data.get("postal_code") else ""
                answer = f"Manufacturer / Packer identified: {org}. {addr}{pin}"
                return {
                    "scan_id": scan_id,
                    "intent": CopilotIntent.FIELD_QUERY,
                    "question": query,
                    "answer": answer,
                    "evidence_fields": ["manufacturer_packer"],
                    "suggested_actions": ["Highlight Manufacturer details on package image"],
                }
            else:
                return {
                    "scan_id": scan_id,
                    "intent": CopilotIntent.FIELD_QUERY,
                    "question": query,
                    "answer": "Manufacturer or packer details could not be verified from this image.",
                    "evidence_fields": ["manufacturer_packer"],
                    "suggested_actions": ["Check back panel of package"],
                }

        # Fallback honest response
        return {
            "scan_id": scan_id,
            "intent": CopilotIntent.GENERAL,
            "question": query,
            "answer": (
                f"The uploaded image does not provide enough evidence to answer '{query}' confidently. "
                "You can select one of the suggested inquiry chips below to inspect verified declarations, "
                "review manual review reasons, or examine potential compliance issues."
            ),
            "evidence_fields": [],
            "suggested_actions": [
                "Why does this item require review?",
                "What was detected?",
                "Show potential issues",
            ],
        }
