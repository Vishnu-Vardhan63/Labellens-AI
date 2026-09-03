"""
Automated Test Suite for Phase 3: Configurable Compliance Validation Engine.
Tests all 5 required scenarios:
1. Strong detection -> VERIFIED status
2. Low / moderate confidence -> MANUAL REVIEW REQUIRED
3. Missing detection -> POTENTIAL ISSUE (with careful non-deceptive wording)
4. Invalid format -> MANUAL REVIEW or POTENTIAL ISSUE
5. Full End-to-End API workflow (Upload -> Analyze -> Validate -> Query)
"""
import io
import sys
import json
import urllib.request
import cv2
import numpy as np

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
sys.path.insert(0, ".")

from app.services.compliance_service import ComplianceService, ComplianceStatus, OverallAssessment
from app.database import create_tables

def test_scenario_1_strong_detection():
    print("\n[Scenario 1] Testing Strong Detection -> VERIFIED")
    comp = ComplianceService()
    strong_fields = {
        "product_name": {
            "detected": True,
            "value": "Tata Tea Gold",
            "confidence": 0.92,
            "confidence_level": "high",
            "raw_text": "Tata Tea Gold",
        },
        "mrp": {
            "detected": True,
            "value": 380,
            "currency": "INR",
            "inclusive_of_taxes": True,
            "confidence": 0.95,
            "confidence_level": "high",
            "raw_text": "MRP Rs. 380 (incl of all taxes)",
        },
        "net_quantity": {
            "detected": True,
            "value": 500,
            "unit": "g",
            "confidence": 0.94,
            "confidence_level": "high",
            "raw_text": "Net Qty: 500 g",
        },
        "manufacturer_packer": {
            "detected": True,
            "organization_name": "Tata Consumer Products Ltd",
            "address": "Kirloskar Park, Bengaluru - 560024",
            "postal_code": "560024",
            "confidence": 0.90,
            "confidence_level": "high",
            "raw_text": "Tata Consumer Products Ltd, Bengaluru 560024",
        },
        "date_information": {
            "detected": True,
            "mfg_date": "11/2024",
            "expiry_date": "11/2025",
            "best_before": "12 months",
            "batch_number": "TTG-42",
            "confidence": 0.88,
            "confidence_level": "high",
            "raw_text": "Mfg: 11/2024 Exp: 11/2025",
        },
        "consumer_care": {
            "detected": True,
            "toll_free": "1800-345-1720",
            "email": "care@tataconsumer.com",
            "confidence": 0.92,
            "confidence_level": "high",
            "raw_text": "1800-345-1720 care@tataconsumer.com",
        },
    }

    res = comp.evaluate(strong_fields)
    assert res["overall_assessment"] == OverallAssessment.INFORMATION_VERIFIED, f"Expected verified, got {res['overall_assessment']}"
    assert res["summary"]["verified"] == 6, f"Expected 6 verified, got {res['summary']}"
    assert res["summary"]["potential_issue"] == 0
    print(f"  -> Overall: {res['overall_label']}")
    print(f"  -> Verified Count: {res['summary']['verified']} / {res['summary']['total_rules']}")
    print("  [PASS] Scenario 1 passed!")


def test_scenario_2_low_confidence():
    print("\n[Scenario 2] Testing Low/Moderate Confidence -> MANUAL REVIEW REQUIRED")
    comp = ComplianceService()
    low_conf_fields = {
        "product_name": {
            "detected": True,
            "value": "Unclear Drink",
            "confidence": 0.60,
            "confidence_level": "moderate",
            "raw_text": "Unclear Drink",
        },
        "mrp": {
            "detected": True,
            "value": 45,
            "currency": "INR",
            "inclusive_of_taxes": True,
            "confidence": 0.65,
            "confidence_level": "moderate",
            "raw_text": "MRP 45",
        },
        "net_quantity": {
            "detected": True,
            "value": 200,
            "unit": "ml",
            "confidence": 0.62,
            "confidence_level": "moderate",
            "raw_text": "200 ml",
        },
        "manufacturer_packer": {
            "detected": True,
            "organization_name": "Beverage Co",
            "address": "Industrial Area",
            "confidence": 0.55,
            "confidence_level": "moderate",
            "raw_text": "Beverage Co Industrial Area",
        },
        "date_information": {
            "detected": True,
            "mfg_date": "2024",
            "confidence": 0.58,
            "confidence_level": "moderate",
            "raw_text": "2024",
        },
        "consumer_care": {
            "detected": True,
            "phone": "9876543210",
            "confidence": 0.55,
            "confidence_level": "moderate",
            "raw_text": "Ph 9876543210",
        },
    }

    res = comp.evaluate(low_conf_fields)
    assert res["overall_assessment"] == OverallAssessment.MANUAL_REVIEW_RECOMMENDED
    assert res["summary"]["manual_review"] > 0
    print(f"  -> Overall: {res['overall_label']}")
    print(f"  -> Manual Review Count: {res['summary']['manual_review']}")
    print("  [PASS] Scenario 2 passed!")


def test_scenario_3_missing_detection():
    print("\n[Scenario 3] Testing Missing Detection -> POTENTIAL ISSUE (Careful Wording)")
    comp = ComplianceService()
    # Missing MRP and Consumer Care
    missing_fields = {
        "product_name": {
            "detected": True,
            "value": "Sample Biscuit",
            "confidence": 0.90,
            "confidence_level": "high",
            "raw_text": "Sample Biscuit",
        },
        "mrp": {
            "detected": False,
            "value": None,
            "confidence": 0.0,
            "confidence_level": "not_detected",
            "raw_text": None,
        },
        "net_quantity": {
            "detected": True,
            "value": 100,
            "unit": "g",
            "confidence": 0.90,
            "confidence_level": "high",
            "raw_text": "100 g",
        },
        "manufacturer_packer": {
            "detected": True,
            "organization_name": "Bakeries Ltd",
            "address": "Delhi - 110001",
            "postal_code": "110001",
            "confidence": 0.85,
            "confidence_level": "high",
            "raw_text": "Bakeries Ltd Delhi 110001",
        },
        "date_information": {
            "detected": True,
            "mfg_date": "10/2024",
            "confidence": 0.85,
            "confidence_level": "high",
            "raw_text": "Mfg: 10/2024",
        },
        "consumer_care": {
            "detected": False,
            "toll_free": None,
            "email": None,
            "confidence": 0.0,
            "confidence_level": "not_detected",
            "raw_text": None,
        },
    }

    res = comp.evaluate(missing_fields)
    assert res["overall_assessment"] == OverallAssessment.POTENTIAL_ISSUES_DETECTED
    assert res["summary"]["potential_issue"] >= 1

    # Verify legal safety phrasing: MUST state "could not be verified from the uploaded image", NEVER "illegal"
    mrp_rule = next(r for r in res["rule_results"] if r["field"] == "mrp")
    assert mrp_rule["status"] == ComplianceStatus.POTENTIAL_ISSUE
    assert "could not be verified from the uploaded image" in mrp_rule["explanation"].lower()
    assert "illegal" not in mrp_rule["explanation"].lower()
    print(f"  -> Overall: {res['overall_label']}")
    print(f"  -> Explanation (Safety Check): \"{mrp_rule['explanation']}\"")
    print("  [PASS] Scenario 3 passed!")


def test_scenario_4_invalid_format():
    print("\n[Scenario 4] Testing Invalid Format (Non-metric unit or negative price)")
    comp = ComplianceService()
    invalid_format_fields = {
        "product_name": {"detected": True, "value": "Imported Candy", "confidence": 0.85, "confidence_level": "high"},
        "mrp": {
            "detected": True,
            "value": -10,  # Negative price
            "currency": "INR",
            "confidence": 0.90,
            "confidence_level": "high",
            "raw_text": "MRP -10",
        },
        "net_quantity": {
            "detected": True,
            "value": 16,
            "unit": "ounces",  # Non-standard imperial unit
            "confidence": 0.85,
            "confidence_level": "high",
            "raw_text": "Net Wt: 16 ounces",
        },
        "manufacturer_packer": {"detected": True, "organization_name": "Global Candies", "confidence": 0.8, "confidence_level": "high"},
        "date_information": {"detected": True, "mfg_date": "08/2024", "confidence": 0.8, "confidence_level": "high"},
        "consumer_care": {"detected": True, "toll_free": "1800-000-0000", "confidence": 0.8, "confidence_level": "high"},
    }

    res = comp.evaluate(invalid_format_fields)
    mrp_rule = next(r for r in res["rule_results"] if r["field"] == "mrp")
    qty_rule = next(r for r in res["rule_results"] if r["field"] == "net_quantity")

    assert mrp_rule["status"] == ComplianceStatus.POTENTIAL_ISSUE, f"Expected potential issue for negative price, got {mrp_rule['status']}"
    assert qty_rule["status"] in [ComplianceStatus.MANUAL_REVIEW, ComplianceStatus.POTENTIAL_ISSUE], f"Expected manual review/issue for ounces, got {qty_rule['status']}"
    print(f"  -> MRP Negative Status: {mrp_rule['status']} ({mrp_rule['explanation']})")
    print(f"  -> Non-metric Unit Status: {qty_rule['status']} ({qty_rule['explanation']})")
    print("  [PASS] Scenario 4 passed!")


def test_scenario_5_end_to_end_api():
    print("\n[Scenario 5] Testing End-to-End Workflow via Live API (Upload -> Analyze -> Validate)")
    # Generate test image
    img = np.ones((400, 800, 3), dtype=np.uint8) * 255
    font = cv2.FONT_HERSHEY_SIMPLEX
    cv2.putText(img, "AMUL PURE GHEE", (30, 50), font, 1.0, (10, 10, 10), 2)
    cv2.putText(img, "Net Quantity: 1 L", (30, 120), font, 0.75, (0, 0, 0), 2)
    cv2.putText(img, "MRP Rs. 610.00 (incl of all taxes)", (30, 170), font, 0.75, (0, 0, 0), 2)
    cv2.putText(img, "Mfg Date: 10/2024", (30, 220), font, 0.65, (0, 0, 0), 2)
    cv2.putText(img, "Best Before 9 months from packaging", (30, 260), font, 0.65, (0, 0, 0), 2)
    cv2.putText(img, "Packed by: Gujarat Co-operative Milk Marketing, Anand - 388001", (30, 310), font, 0.55, (20, 20, 20), 1)
    cv2.putText(img, "Consumer Care Toll Free: 1800-258-3333 gcmmf@amul.coop", (30, 350), font, 0.55, (20, 20, 20), 1)

    _, img_bytes = cv2.imencode(".png", img)
    png_data = img_bytes.tobytes()

    boundary = b"BoundaryP3778"
    body = (
        b"--" + boundary + b"\r\n"
        + b"Content-Disposition: form-data; name=\"file\"; filename=\"amul_ghee.png\"\r\n"
        + b"Content-Type: image/png\r\n\r\n"
        + png_data
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
        upload_data = json.loads(resp.read())
    scan_id = upload_data["image_id"]
    print(f"  1. Uploaded -> Scan ID: {scan_id}")

    # 2. Analyze
    req_analyze = urllib.request.Request(
        f"http://localhost:8000/api/scans/{scan_id}/analyze",
        data=b"",
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req_analyze) as resp:
        analysis_data = json.loads(resp.read())
    print(f"  2. Analyzed -> {len(analysis_data['ocr_lines'])} OCR lines detected")

    # 3. Validate
    req_validate = urllib.request.Request(
        f"http://localhost:8000/api/scans/{scan_id}/validate",
        data=b"",
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req_validate) as resp:
        validation_data = json.loads(resp.read())
    
    print(f"  3. Validated -> Assessment: {validation_data['overall_label']}")
    print(f"     Summary: Verified={validation_data['summary']['verified']}, Review={validation_data['summary']['manual_review']}, Issues={validation_data['summary']['potential_issue']}")
    assert validation_data["success"] is True
    assert len(validation_data["results"]) == 6

    # 4. Fetch Scan Detail
    with urllib.request.urlopen(f"http://localhost:8000/api/scans/{scan_id}") as resp:
        detail_data = json.loads(resp.read())
    assert detail_data["compliance_status"] == "completed"
    assert detail_data["overall_assessment"] is not None
    print("  4. Verified Database Record: compliance_status=completed")
    print("  [PASS] Scenario 5 (Full Workflow) passed!")


def main():
    print("=" * 65)
    print("  LABEL LENS AI — Phase 3 Compliance Validation Test Suite")
    print("=" * 65)
    create_tables()
    test_scenario_1_strong_detection()
    test_scenario_2_low_confidence()
    test_scenario_3_missing_detection()
    test_scenario_4_invalid_format()
    test_scenario_5_end_to_end_api()
    print("\n" + "=" * 65)
    print("  ALL 5 PHASE 3 SCENARIOS PASSED SUCCESSFULLY!")
    print("=" * 65)


if __name__ == "__main__":
    main()
