"""Report Service — Phase 5.

Generates formal, printable Legal Metrology inspection reports in PDF format.
Uses ReportLab to render a clean, high-density, authoritative document suitable
for packaged commodity field screening under the Legal Metrology (Packaged Commodities) Rules, 2011.

Features:
- Package metadata and optional thumbnail preview
- Overall Screening Assessment with required statutory disclaimer
- Status summary counters (Verified / Review / Issues)
- Detailed per-declaration findings with legal citations and OCR evidence
- Inspector physical audit sign-off block
- Two-pass canvas for automatic "Page X of Y" pagination
"""
from __future__ import annotations

import io
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from reportlab.platypus import (
    HRFlowable,
    Image as PlatypusImage,
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

logger = logging.getLogger(__name__)

# Primary brand colors
COLOR_PRIMARY = colors.HexColor("#1A3A5C")       # Deep Navy
COLOR_ACCENT = colors.HexColor("#2563EB")        # Royal Blue
COLOR_VERIFIED = colors.HexColor("#059669")      # Emerald
COLOR_REVIEW = colors.HexColor("#D97706")        # Amber
COLOR_ISSUE = colors.HexColor("#E11D48")         # Rose Red
COLOR_SURFACE = colors.HexColor("#F8FAFC")       # Light Slate
COLOR_BORDER = colors.HexColor("#CBD5E1")        # Border Gray
COLOR_TEXT = colors.HexColor("#0F172A")          # Charcoal text


class NumberedCanvas(canvas.Canvas):
    """Two-pass canvas to compute and print total page numbers."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, total_pages: int):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))

        # Footer divider line
        self.setStrokeColor(COLOR_BORDER)
        self.setLineWidth(0.5)
        self.line(36, 32, A4[0] - 36, 32)

        # Footer text
        footer_text = "LABEL LENS AI · Smart India Hackathon (SIH26034) · Legal Metrology Screening Report"
        self.drawString(36, 20, footer_text)
        page_str = f"Page {self._pageNumber} of {total_pages}"
        self.drawRightString(A4[0] - 36, 20, page_str)
        self.restoreState()


class ReportService:
    """Service to generate downloadable compliance screening PDFs."""

    def generate_pdf_report(
        self,
        scan_id: str,
        scan_data: Dict[str, Any],
        validation_data: Dict[str, Any],
        image_path: Optional[str] = None,
    ) -> bytes:
        """
        Build and return the PDF report as raw bytes.
        """
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            leftMargin=36,
            rightMargin=36,
            topMargin=36,
            bottomMargin=46,
        )

        styles = self._create_styles()
        story = []

        # 1. Header Banner
        story.extend(self._build_header(styles))
        story.append(Spacer(1, 10))

        # 2. Package Information & Image Preview
        story.extend(self._build_package_info(scan_id, scan_data, image_path, styles))
        story.append(Spacer(1, 12))

        # 3. Overall Assessment
        story.extend(self._build_overall_assessment(validation_data, styles))
        story.append(Spacer(1, 12))

        # 4. Summary Counters
        story.extend(self._build_summary_table(validation_data, styles))
        story.append(Spacer(1, 14))

        # 5. Detailed Declaration Findings
        story.extend(self._build_detailed_findings(validation_data, styles))
        story.append(Spacer(1, 16))

        # 6. Inspector Sign-Off Block
        story.extend(self._build_signoff_block(styles))

        doc.build(story, canvasmaker=NumberedCanvas)
        buffer.seek(0)
        return buffer.getvalue()

    def _create_styles(self) -> Dict[str, ParagraphStyle]:
        base_styles = getSampleStyleSheet()

        return {
            "Title": ParagraphStyle(
                "RepTitle",
                parent=base_styles["Title"],
                fontName="Helvetica-Bold",
                fontSize=18,
                leading=22,
                textColor=colors.white,
                alignment=0,
            ),
            "Subtitle": ParagraphStyle(
                "RepSubtitle",
                parent=base_styles["Normal"],
                fontName="Helvetica",
                fontSize=9,
                leading=12,
                textColor=colors.HexColor("#E2E8F0"),
            ),
            "SectionHeading": ParagraphStyle(
                "RepSectionHeading",
                parent=base_styles["Heading2"],
                fontName="Helvetica-Bold",
                fontSize=12,
                leading=15,
                textColor=COLOR_PRIMARY,
                spaceAfter=4,
            ),
            "Body": ParagraphStyle(
                "RepBody",
                parent=base_styles["BodyText"],
                fontName="Helvetica",
                fontSize=9,
                leading=12,
                textColor=COLOR_TEXT,
            ),
            "BodyBold": ParagraphStyle(
                "RepBodyBold",
                parent=base_styles["BodyText"],
                fontName="Helvetica-Bold",
                fontSize=9,
                leading=12,
                textColor=COLOR_TEXT,
            ),
            "Caption": ParagraphStyle(
                "RepCaption",
                parent=base_styles["Normal"],
                fontName="Helvetica",
                fontSize=8,
                leading=10,
                textColor=colors.HexColor("#64748B"),
            ),
            "Mono": ParagraphStyle(
                "RepMono",
                parent=base_styles["Normal"],
                fontName="Courier",
                fontSize=8,
                leading=10,
                textColor=colors.HexColor("#1E293B"),
            ),
            "Disclaimer": ParagraphStyle(
                "RepDisclaimer",
                parent=base_styles["Normal"],
                fontName="Helvetica-Oblique",
                fontSize=8,
                leading=11,
                textColor=colors.HexColor("#475569"),
            ),
            "Badge": ParagraphStyle(
                "RepBadge",
                parent=base_styles["Normal"],
                fontName="Helvetica-Bold",
                fontSize=8,
                leading=9,
                alignment=1,
            ),
        }

    def _build_header(self, styles: Dict[str, ParagraphStyle]) -> List[Any]:
        header_table_data = [
            [
                Paragraph("<b>LABEL LENS AI</b>", styles["Title"]),
                Paragraph("<b>SMART INDIA HACKATHON</b><br/>Problem Statement: SIH26034", styles["Subtitle"]),
            ],
            [
                Paragraph("Smart Packaged Commodity Declaration Review", styles["Subtitle"]),
                Paragraph("Legal Metrology (Packaged Commodities) Rules, 2011", styles["Subtitle"]),
            ],
        ]

        header_table = Table(header_table_data, colWidths=[330, 193])
        header_table.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), COLOR_PRIMARY),
                ("TEXTCOLOR", (0, 0), (-1, -1), colors.white),
                ("TOPPADDING", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
                ("LEFTPADDING", (0, 0), (-1, -1), 12),
                ("RIGHTPADDING", (0, 0), (-1, -1), 12),
                ("ALIGN", (1, 0), (1, -1), "RIGHT"),
            ])
        )
        return [header_table]

    def _build_package_info(
        self,
        scan_id: str,
        scan_data: Dict[str, Any],
        image_path: Optional[str],
        styles: Dict[str, ParagraphStyle],
    ) -> List[Any]:
        extracted = scan_data.get("extracted_fields") or {}
        prod_data = extracted.get("product_name") or {}
        product_name = prod_data.get("value") or "Generic Packaged Commodity (Unspecified)"

        now_str = datetime.now(timezone.utc).strftime("%d %b %Y, %H:%M:%S UTC")

        info_rows = [
            [Paragraph("<b>Scan Identifier:</b>", styles["Caption"]), Paragraph(f"<font name='Courier'>{scan_id}</font>", styles["Body"])],
            [Paragraph("<b>Report Generated:</b>", styles["Caption"]), Paragraph(now_str, styles["Body"])],
            [Paragraph("<b>Detected Product:</b>", styles["Caption"]), Paragraph(f"<b>{self._sanitize(product_name)}</b>", styles["Body"])],
            [Paragraph("<b>Original File:</b>", styles["Caption"]), Paragraph(self._sanitize(scan_data.get("original_filename", "package_label.jpg")), styles["Body"])],
        ]

        info_table = Table(info_rows, colWidths=[100, 220])
        info_table.setStyle(
            TableStyle([
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (-1, -1), 3),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                ("LEFTPADDING", (0, 0), (-1, -1), 4),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4),
            ])
        )

        # Build thumbnail image if file exists
        img_element = None
        if image_path and Path(image_path).exists():
            try:
                img_element = PlatypusImage(image_path, width=170, height=105, kind="proportional")
            except Exception as e:
                logger.warning(f"Could not load image into report: {e}")
                img_element = Paragraph("<font color='#64748B'><i>[Package Label Image Stored]</i></font>", styles["Caption"])
        else:
            img_element = Paragraph("<font color='#64748B'><i>[Package Label Image]</i></font>", styles["Caption"])

        main_box = Table(
            [[info_table, img_element]],
            colWidths=[330, 193],
        )
        main_box.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), COLOR_SURFACE),
                ("BOX", (0, 0), (-1, -1), 0.5, COLOR_BORDER),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("ALIGN", (1, 0), (1, 0), "CENTER"),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ])
        )
        return [main_box]

    def _build_overall_assessment(
        self, validation_data: Dict[str, Any], styles: Dict[str, ParagraphStyle]
    ) -> List[Any]:
        assessment = validation_data.get("overall_assessment", "manual_review_recommended")
        label = validation_data.get("overall_label", "Manual Review Recommended")
        description = validation_data.get(
            "overall_description",
            "Declarations require manual verification against physical packaging.",
        )
        disclaimer = validation_data.get(
            "disclaimer",
            "This assessment is based on automated analysis of the uploaded image and should be manually verified where required.",
        )

        bg_color = colors.HexColor("#FEF3C7")  # Amber default
        border_color = COLOR_REVIEW
        badge_text = f"<font color='#92400E'><b>{label.upper()}</b></font>"

        if assessment == "information_verified":
            bg_color = colors.HexColor("#D1FAE5")
            border_color = COLOR_VERIFIED
            badge_text = f"<font color='#065F46'><b>{label.upper()}</b></font>"
        elif assessment in ["INSUFFICIENT_PACKAGE_LABEL_EVIDENCE", "NO_READABLE_TEXT", "insufficient_label_evidence"]:
            bg_color = colors.HexColor("#F1F5F9")
            border_color = colors.HexColor("#CBD5E1")
            badge_text = "<font color='#475569'><b>ANALYSIS NOT PERFORMED</b></font>"
        elif assessment == "potential_issues_detected":
            bg_color = colors.HexColor("#FFE4E6")
            border_color = COLOR_ISSUE
            badge_text = f"<font color='#9F1239'><b>{label.upper()}</b></font>"

        content = [
            [Paragraph(f"<b>SCREENING ASSESSMENT:</b> {badge_text}", styles["BodyBold"])],
            [Paragraph(self._sanitize(description), styles["Body"])],
            [Spacer(1, 3)],
            [Paragraph(f"<b>Statutory Disclaimer:</b> {self._sanitize(disclaimer)}", styles["Disclaimer"])],
        ]

        table = Table(content, colWidths=[523])
        table.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), bg_color),
                ("BOX", (0, 0), (-1, -1), 1.0, border_color),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
            ])
        )
        return [table]

    def _build_summary_table(
        self, validation_data: Dict[str, Any], styles: Dict[str, ParagraphStyle]
    ) -> List[Any]:
        summary = validation_data.get("summary") or {}
        verified = summary.get("verified", 0)
        review = summary.get("manual_review", 0)
        issues = summary.get("potential_issue", 0)
        total = summary.get("total_rules", 6)

        data = [
            [
                Paragraph("<b>Rule Evaluation Summary</b>", styles["Caption"]),
                Paragraph(f"<b>{verified}</b> Verified", styles["Badge"]),
                Paragraph(f"<b>{review}</b> Require Review", styles["Badge"]),
                Paragraph(f"<b>{issues}</b> Potential Issue", styles["Badge"]),
                Paragraph(f"Total Rules: <b>{total}</b>", styles["Caption"]),
            ]
        ]

        table = Table(data, colWidths=[140, 95, 105, 95, 88])
        table.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), COLOR_SURFACE),
                ("BOX", (0, 0), (-1, -1), 0.5, COLOR_BORDER),
                ("ALIGN", (1, 0), (3, 0), "CENTER"),
                ("TEXTCOLOR", (1, 0), (1, 0), COLOR_VERIFIED),
                ("TEXTCOLOR", (2, 0), (2, 0), COLOR_REVIEW),
                ("TEXTCOLOR", (3, 0), (3, 0), COLOR_ISSUE),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ])
        )
        return [table]

    def _build_detailed_findings(
        self, validation_data: Dict[str, Any], styles: Dict[str, ParagraphStyle]
    ) -> List[Any]:
        results: List[Dict[str, Any]] = validation_data.get("results") or []
        items = [Paragraph("<b>Mandatory Declaration Review Findings (Rule 6)</b>", styles["SectionHeading"])]

        if not results:
            empty_table = Table(
                [[Paragraph("<i>No declarations were evaluated. The uploaded image was identified as having insufficient evidence to constitute a packaged commodity label under Legal Metrology Rules.</i>", styles["Body"])]],
                colWidths=[523],
            )
            empty_table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), COLOR_SURFACE),
                ("BOX", (0, 0), (-1, -1), 0.5, COLOR_BORDER),
                ("TOPPADDING", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
            ]))
            items.append(empty_table)
            return items

        for rule in results:
            name = rule.get("display_name", "Declaration")
            status = rule.get("status", "verified")
            legal_ref = rule.get("legal_reference", "Legal Metrology Rules, 2011")
            extracted_val = rule.get("extracted_value") or "Not detected from uploaded image"
            explanation = rule.get("explanation", "")
            recommendation = rule.get("recommendation", "")
            evidence = rule.get("evidence", "")

            # Format status badge
            if status == "verified":
                status_color = COLOR_VERIFIED
                status_label = "VERIFIED"
            elif status == "manual_review":
                status_color = COLOR_REVIEW
                status_label = "MANUAL REVIEW REQUIRED"
            else:
                status_color = COLOR_ISSUE
                status_label = "POTENTIAL ISSUE"

            # Build card content
            card_rows = [
                [
                    Paragraph(f"<b>{self._sanitize(name)}</b> <font color='#64748B'>· {self._sanitize(legal_ref)}</font>", styles["BodyBold"]),
                    Paragraph(f"<font color='{status_color.hexval()}'><b>{status_label}</b></font>", styles["Badge"]),
                ],
                [
                    Paragraph(f"<b>Detected Value:</b> {self._sanitize(extracted_val)}", styles["Body"]),
                    "",
                ],
                [
                    Paragraph(f"<b>Why this status:</b> {self._sanitize(explanation)}", styles["Body"]),
                    "",
                ],
            ]

            if recommendation:
                card_rows.append([
                    Paragraph(f"<b>Recommendation:</b> <font color='#1E293B'>{self._sanitize(recommendation)}</font>", styles["Body"]),
                    "",
                ])

            if evidence:
                clean_ev = self._sanitize(evidence).strip()
                card_rows.append([
                    Paragraph(f"<b>Supporting OCR Text:</b> <font name='Courier' color='#334155'>{clean_ev}</font>", styles["Caption"]),
                    "",
                ])

            card_table = Table(card_rows, colWidths=[410, 113])
            card_table.setStyle(
                TableStyle([
                    ("SPAN", (0, 1), (1, 1)),
                    ("SPAN", (0, 2), (1, 2)),
                    *([("SPAN", (0, i), (1, i)) for i in range(3, len(card_rows))]),
                    ("BACKGROUND", (0, 0), (-1, -1), colors.white),
                    ("BOX", (0, 0), (-1, -1), 0.5, COLOR_BORDER),
                    ("TOPPADDING", (0, 0), (-1, -1), 4),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                    ("LEFTPADDING", (0, 0), (-1, -1), 8),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                    ("ALIGN", (1, 0), (1, 0), "RIGHT"),
                ])
            )

            # Keep card content together to avoid awkward page-breaks
            items.append(KeepTogether([card_table, Spacer(1, 6)]))

        return items

    def _build_signoff_block(self, styles: Dict[str, ParagraphStyle]) -> List[Any]:
        signoff_data = [
            [
                Paragraph("<b>FIELD INSPECTION AUDIT SIGN-OFF</b>", styles["Caption"]),
                Paragraph("<b>ACTION TAKEN</b>", styles["Caption"]),
            ],
            [
                Paragraph("Inspecting Officer Name: ____________________________", styles["Body"]),
                Paragraph("[  ] Verified Compliant on Physical Package", styles["Body"]),
            ],
            [
                Paragraph("Designation / Jurisdiction: ________________________", styles["Body"]),
                Paragraph("[  ] Notice Issued for Non-Compliance", styles["Body"]),
            ],
            [
                Paragraph("Date & Time: __________________ Signature: _________", styles["Body"]),
                Paragraph("[  ] Sample Seized for Lab Verification", styles["Body"]),
            ],
        ]

        signoff_table = Table(signoff_data, colWidths=[310, 213])
        signoff_table.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), COLOR_SURFACE),
                ("BOX", (0, 0), (-1, -1), 0.5, COLOR_BORDER),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ])
        )

        return [KeepTogether([
            Spacer(1, 4),
            signoff_table,
        ])]

    def _sanitize(self, text: Any) -> str:
        """Sanitize text to avoid ReportLab XML parsing errors and font encoding crashes."""
        if text is None:
            return ""
        s = str(text)
        # Replace Rupee symbol with Rs. for standard Helvetica font compatibility
        s = s.replace("₹", "Rs. ")
        # Escape XML entities
        s = s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
        return s
