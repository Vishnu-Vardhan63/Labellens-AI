"""
Phase 4 Automated Test Suite: Visual Evidence Mapping & AI Compliance Copilot.
Tests:
1. Field-to-Evidence Mapping (MRP single block)
2. Net Quantity Mapping (metric value + unit)
3. Multiple Evidence Blocks (Manufacturer multi-line & PIN)
4. No Evidence Fallback (honest message, zero fake coordinates)
5. Copilot Predefined Intents & Zero Hallucination
6. Live End-to-End API (/evidence and /copilot)
"""
import io
import sys
import json
import urllib.request
import cv2
import numpy as np

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
sys.path.insert(0, ".")

from app.services.evidence_service import EvidenceService
from app.services.copilot_service import CopilotService, CopilotIntent
from app.database import create_tables

SAMPLE_OCR_LINES = [
    {"text": "BRITANNIA GOOD DAY", "confidence": 0.94, "bounding_box": [[30, 40], [350, 40], [350, 75], [30, 75]]},
    {"text": "Net Quantity: 100 g", "confidence": 0.92, "bounding_box": [[30, 110], [220, 110], [220, 140], [30, 140]]},
    {"text": "MRP Rs. 30.00 (incl. of all taxes)", "confidence": 0.96, "bounding_box": [[30, 160], [380, 160], [380, 195], [30, 195]]},
    {"text": "Mfg Date: 12/2024  Exp: 12/2025", "confidence": 0.88, "bounding_box": [[30, 220], [360, 220], [360, 250], [30, 250]]},
    {"text": "Batch No: B42-X09", "confidence": 0.85, "bounding_box": [[30, 260], [200, 260], [200, 285], [30, 285]]},
    {"text": "Mfg by: Britannia Industries Ltd", "confidence": 0.89, "bounding_box": [[30, 310], [340, 310], [340, 335], [30, 335]]},
    {"text": "5/1A Hungerford Street, Kolkata - 700017", "confidence": 0.86, "bounding_box": [[30, 340], [420, 340], [420, 365], [30, 365]]},
    {"text": "Consumer Care: 1800-425-4449 feedback@britindia.com", "confidence": 0.91, "bounding_box": [[30, 390], [490, 390], [490, 420], [30, 420]]},
]

SAMPLE_EXTRACTED_FIELDS = {
    "product_name": {"detected": True, "value": "Britannia Good Day", "raw_text": "BRITANNIA GOOD DAY"},
    "mrp": {"detected": True, "value": 30.0, "currency": "INR", "inclusive_of_taxes": True, "raw_text": "MRP Rs. 30.00 (incl. of all taxes)"},
    "net_quantity": {"detected": True, "value": 100, "unit": "g", "raw_text": "Net Quantity: 100 g"},
    "manufacturer_packer": {
        "detected": True,
        "organization_name": "Britannia Industries Ltd",
        "address": "5/1A Hungerford Street, Kolkata - 700017",
        "postal_code": "700017",
        "raw_text": "Mfg by: Britannia Industries Ltd",
    },
    "date_information": {
        "detected": True,
        "mfg_date": "12/2024",
        "expiry_date": "12/2025",
        "batch_number": "B42-X09",
        "raw_text": "Mfg Date: 12/2024  Exp: 12/2025",
    },
    "consumer_care": {
        "detected": True,
        "toll_free": "1800-425-4449",
        "email": "feedback@britindia.com",
        "raw_text": "1800-425-4449 feedback@britindia.com",
    },
}


def test_1_mrp_evidence():
    print("\n[Test 1] Testing MRP Evidence Mapping")
    evidence_svc = EvidenceService()
    res = evidence_svc.build_evidence_map("scan-test-1", SAMPLE_EXTRACTED_FIELDS, SAMPLE_OCR_LINES, (800, 600))
    mrp_ev = res["declarations"]["mrp"]

    assert mrp_ev["detected"] is True
    assert mrp_ev["has_evidence"] is True
    assert len(mrp_ev["evidence_blocks"]) >= 1
    assert "MRP" in mrp_ev["evidence_blocks"][0]["text"]
    assert mrp_ev["bounding_box_union"] is not None
    # Verify percentage coordinates
    norm = mrp_ev["evidence_blocks"][0]["normalized_rect"]
    assert 0.0 <= norm["x"] <= 100.0
    assert 0.0 <= norm["y"] <= 100.0
    assert norm["width"] > 0.0
    assert norm["height"] > 0.0
    print(f"  -> MRP Evidence: \"{mrp_ev['evidence_blocks'][0]['text']}\"")
    print(f"  -> Normalized Rect: x={norm['x']}%, y={norm['y']}%, w={norm['width']}%, h={norm['height']}%")
    print("  [PASS] Test 1 passed!")


def test_2_net_quantity_evidence():
    print("\n[Test 2] Testing Net Quantity Evidence Mapping")
    evidence_svc = EvidenceService()
    res = evidence_svc.build_evidence_map("scan-test-2", SAMPLE_EXTRACTED_FIELDS, SAMPLE_OCR_LINES, (800, 600))
    qty_ev = res["declarations"]["net_quantity"]

    assert qty_ev["has_evidence"] is True
    assert any("100" in b["text"] or "Net" in b["text"] for b in qty_ev["evidence_blocks"])
    norm = qty_ev["evidence_blocks"][0]["normalized_rect"]
    print(f"  -> Quantity Evidence: \"{qty_ev['evidence_blocks'][0]['text']}\"")
    print(f"  -> Normalized Rect: x={norm['x']}%, y={norm['y']}%")
    print("  [PASS] Test 2 passed!")


def test_3_multiple_evidence_blocks():
    print("\n[Test 3] Testing Multiple Evidence Blocks (Manufacturer & Dates)")
    evidence_svc = EvidenceService()
    res = evidence_svc.build_evidence_map("scan-test-3", SAMPLE_EXTRACTED_FIELDS, SAMPLE_OCR_LINES, (800, 600))
    mfg_ev = res["declarations"]["manufacturer_packer"]
    dates_ev = res["declarations"]["date_information"]

    # Manufacturer matches both org name line and address/PIN line
    assert len(mfg_ev["evidence_blocks"]) >= 2, f"Expected multiple mfg blocks, got {len(mfg_ev['evidence_blocks'])}"
    assert mfg_ev["bounding_box_union"] is not None
    print(f"  -> Manufacturer mapped to {len(mfg_ev['evidence_blocks'])} OCR blocks:")
    for b in mfg_ev["evidence_blocks"]:
        print(f"     - \"{b['text']}\"")

    # Dates match mfg date and batch line
    assert len(dates_ev["evidence_blocks"]) >= 2, f"Expected multiple date blocks, got {len(dates_ev['evidence_blocks'])}"
    print(f"  -> Date Information mapped to {len(dates_ev['evidence_blocks'])} OCR blocks")
    print("  [PASS] Test 3 passed!")


def test_4_no_evidence_fallback():
    print("\n[Test 4] Testing Fallback When Field Is Missing Or Unmapped (Zero Hallucination)")
    sparse_fields = {
        "product_name": {"detected": True, "value": "Mystery Snack", "raw_text": None},
        "mrp": {"detected": False},
        "consumer_care": {"detected": False},
    }
    sparse_lines = [
        {"text": "Different Brand", "confidence": 0.8, "bounding_box": [[10, 10], [100, 10], [100, 30], [10, 30]]}
    ]
    evidence_svc = EvidenceService()
    res = evidence_svc.build_evidence_map("sparse-scan", sparse_fields, sparse_lines, (800, 600))

    # Missing field
    assert res["declarations"]["mrp"]["has_evidence"] is False
    assert res["declarations"]["mrp"]["evidence_blocks"] == []

    # Detected without matching OCR block
    assert res["declarations"]["product_name"]["has_evidence"] is False
    assert "could not be confidently mapped" in res["declarations"]["product_name"]["message"].lower()
    assert res["declarations"]["product_name"]["evidence_blocks"] == []
    print(f"  -> Honest missing message: \"{res['declarations']['mrp']['message']}\"")
    print(f"  -> Honest unmapped message: \"{res['declarations']['product_name']['message']}\"")
    print("  [PASS] Test 4 passed!")


def test_5_copilot_intents():
    print("\n[Test 5] Testing AI Compliance Copilot Predefined Intents")
    copilot = CopilotService()
    sample_rules = [
        {"field": "mrp", "display_name": "Maximum Retail Price", "status": "verified", "explanation": "High confidence ₹30."},
        {"field": "date_information", "display_name": "Dates", "status": "manual_review", "explanation": "Date stamping requires physical review.", "recommendation": "Check crimp stamping."},
        {"field": "consumer_care", "display_name": "Consumer Care", "status": "potential_issue", "explanation": "Could not be verified from image.", "recommendation": "Locate customer care line."},
    ]

    # Intent 1: WHY_REVIEW
    res_why = copilot.answer_query("copilot-1", SAMPLE_EXTRACTED_FIELDS, sample_rules, intent=CopilotIntent.WHY_REVIEW)
    assert "manual review" in res_why["answer"].lower()
    assert "Dates" in res_why["answer"]
    print("  -> WHY_REVIEW answer generated successfully")

    # Intent 2: SHOW_DETECTED
    res_show = copilot.answer_query("copilot-1", SAMPLE_EXTRACTED_FIELDS, sample_rules, intent=CopilotIntent.SHOW_DETECTED)
    assert "Britannia Good Day" in res_show["answer"]
    assert "₹30" in res_show["answer"]
    print("  -> SHOW_DETECTED answer generated successfully")

    # Intent 3: SHOW_ISSUES
    res_issues = copilot.answer_query("copilot-1", SAMPLE_EXTRACTED_FIELDS, sample_rules, intent=CopilotIntent.SHOW_ISSUES)
    assert "Consumer Care" in res_issues["answer"]
    assert "Could not be verified" in res_issues["answer"]
    print("  -> SHOW_ISSUES answer generated successfully")

    # Intent 4: WHAT_TO_CHECK
    res_check = copilot.answer_query("copilot-1", SAMPLE_EXTRACTED_FIELDS, sample_rules, intent=CopilotIntent.WHAT_TO_CHECK)
    assert "Check crimp stamping" in res_check["answer"]
    print("  -> WHAT_TO_CHECK answer generated successfully")

    # Intent 5: Out of scope honest fallback
    res_fallback = copilot.answer_query("copilot-1", SAMPLE_EXTRACTED_FIELDS, sample_rules, query="Is this vegan?")
    assert "does not provide enough evidence" in res_fallback["answer"].lower()
    print("  -> Out-of-scope honest fallback returned successfully")
    print("  [PASS] Test 5 passed!")


def test_6_live_api_evidence_and_copilot():
    print("\n[Test 6] Testing Live API Endpoints (/evidence & /copilot)")
    # Generate test image
    img = np.ones((400, 800, 3), dtype=np.uint8) * 255
    font = cv2.FONT_HERSHEY_SIMPLEX
    cv2.putText(img, "AMUL BUTTER", (30, 60), font, 1.0, (10, 10, 10), 2)
    cv2.putText(img, "Net Qty: 500 g", (30, 130), font, 0.75, (0, 0, 0), 2)
    cv2.putText(img, "MRP Rs. 275.00 (incl of all taxes)", (30, 190), font, 0.75, (0, 0, 0), 2)
    cv2.putText(img, "Mfg Date: 01/2025", (30, 250), font, 0.65, (0, 0, 0), 2)

    _, img_bytes = cv2.imencode(".png", img)
    boundary = b"BoundaryP4888"
    body = (
        b"--" + boundary + b"\r\n"
        + b"Content-Disposition: form-data; name=\"file\"; filename=\"amul_butter.png\"\r\n"
        + b"Content-Type: image/png\r\n\r\n"
        + img_bytes.tobytes()
        + b"\r\n--" + boundary + b"--\r\n"
    )

    # 1. Upload
    req_upload = urllib.request.Request(
        "http://localhost:8000/api/upload",
        data=body,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary.decode()}"},
        method="POST",
    )
    with urllib.request.urlopen(req_upload) as resp:
        scan_id = json.loads(resp.read())["image_id"]
    print(f"  1. Uploaded scan: {scan_id}")

    # 2. Analyze
    req_analyze = urllib.request.Request(
        f"http://localhost:8000/api/scans/{scan_id}/analyze",
        data=b"",
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req_analyze) as resp:
        json.loads(resp.read())
    print("  2. Analyzed scan successfully")

    # 3. Fetch Evidence API
    req_ev = urllib.request.Request(f"http://localhost:8000/api/scans/{scan_id}/evidence")
    with urllib.request.urlopen(req_ev) as resp:
        ev_data = json.loads(resp.read())
    assert ev_data["success"] is True
    assert ev_data["total_mapped_declarations"] >= 2
    assert "mrp" in ev_data["declarations"]
    print(f"  3. GET /evidence returned {ev_data['total_mapped_declarations']} mapped declarations")

    # 4. Query Copilot API
    copilot_payload = json.dumps({"intent": "WHY_REVIEW"}).encode()
    req_copilot = urllib.request.Request(
        f"http://localhost:8000/api/scans/{scan_id}/copilot",
        data=copilot_payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req_copilot) as resp:
        copilot_data = json.loads(resp.read())
    assert copilot_data["success"] is True
    assert len(copilot_data["answer"]) > 10
    print(f"  4. POST /copilot returned: \"{copilot_data['answer'][:60]}...\"")
    print("  [PASS] Test 6 passed!")


def main():
    print("=" * 65)
    print("  LABEL LENS AI — Phase 4 Visual Evidence & Copilot Test Suite")
    print("=" * 65)
    create_tables()
    test_1_mrp_evidence()
    test_2_net_quantity_evidence()
    test_3_multiple_evidence_blocks()
    test_4_no_evidence_fallback()
    test_5_copilot_intents()
    test_6_live_api_evidence_and_copilot()
    print("\n" + "=" * 65)
    print("  ALL 6 PHASE 4 TESTS PASSED SUCCESSFULLY!")
    print("=" * 65)


if __name__ == "__main__":
    main()
