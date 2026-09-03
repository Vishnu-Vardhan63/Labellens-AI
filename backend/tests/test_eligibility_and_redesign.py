"""
Automated Regression Test Suite:
1. Real Packaged Commodity -> ELIGIBLE_FOR_PACKAGE_ANALYSIS, extraction works, compliance runs
2. Certificate Image (AP State Skill Development Corp) -> INSUFFICIENT_PACKAGE_LABEL_EVIDENCE, zero product name hallucination, compliance suspended
3. Random Photo / Isolated Word ("REDBULL") -> INSUFFICIENT_PACKAGE_LABEL_EVIDENCE, no fake product
4. Blank / Unreadable Image -> NO_READABLE_TEXT
5. Sequential Scan Isolation -> Independent state across consecutive scans
"""
import io
import sys
import os

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
backend_dir = r"C:\Users\maram\Downloads\vishnu\backend"
sys.path.insert(0, backend_dir)

from app.services.label_gate_service import LabelGateService, LabelEligibilityStatus
from app.services.extraction_service import ExtractionService
from app.services.compliance_service import ComplianceService, ComplianceStatus, OverallAssessment

def test_1_real_packaged_commodity():
    print("\n--- Test 1: Real Packaged Commodity ---")
    gate = LabelGateService()
    extractor = ExtractionService()
    compliance = ComplianceService()

    ocr_output = {
        "raw_text": (
            "TATA TEA GOLD\n"
            "NET QUANTITY: 500 g\n"
            "MRP Rs. 380.00 (INCL. OF ALL TAXES)\n"
            "MFD: 15/05/2026\n"
            "EXP: 14/05/2027\n"
            "BATCH NO: TTG2026A\n"
            "MANUFACTURED BY: TATA CONSUMER PRODUCTS LTD\n"
            "BANGALORE 560024\n"
            "CONSUMER CARE: 1800-345-1720\n"
            "EMAIL: CARE@TATACONSUMER.COM"
        ),
        "lines": [
            {"text": "TATA TEA GOLD", "confidence": 0.95, "bounding_box": [[10, 10], [200, 10], [200, 40], [10, 40]]},
            {"text": "NET QUANTITY: 500 g", "confidence": 0.92, "bounding_box": [[10, 50], [200, 50], [200, 80], [10, 80]]},
            {"text": "MRP Rs. 380.00 (INCL. OF ALL TAXES)", "confidence": 0.94, "bounding_box": [[10, 90], [300, 90], [300, 120], [10, 120]]},
            {"text": "MFD: 15/05/2026", "confidence": 0.91, "bounding_box": [[10, 130], [150, 130], [150, 160], [10, 160]]},
            {"text": "MANUFACTURED BY: TATA CONSUMER PRODUCTS LTD", "confidence": 0.90, "bounding_box": [[10, 170], [350, 170], [350, 200], [10, 200]]},
        ],
    }

    # 1. Gate check
    eligibility = gate.evaluate_eligibility(ocr_output)
    print(f"Eligibility Status: {eligibility['status']}")
    print(f"Matched Categories: {eligibility['matched_categories']}")
    assert eligibility["is_eligible"] is True
    assert eligibility["status"] == LabelEligibilityStatus.ELIGIBLE_FOR_PACKAGE_ANALYSIS

    # 2. Extraction check
    extracted = extractor.extract_declarations(ocr_output, is_eligible=True)
    print(f"Detected Product: {extracted['product_name']['value']}")
    print(f"Detected MRP: {extracted['mrp']['value']}")
    print(f"Detected Net Qty: {extracted['net_quantity']['value']} {extracted['net_quantity']['unit']}")
    assert extracted["product_name"]["detected"] is True
    assert "TATA TEA GOLD" in extracted["product_name"]["value"]
    assert extracted["mrp"]["value"] == 380.0
    assert extracted["net_quantity"]["value"] == 500.0

    # 3. Compliance check
    eval_res = compliance.evaluate(
        extracted,
        ocr_output["raw_text"],
        is_eligible=True,
        eligibility_status=eligibility["status"],
    )
    print(f"Overall Assessment: {eval_res['overall_assessment']}")
    print(f"Summary: {eval_res['summary']}")
    assert eval_res["is_eligible"] is True
    assert eval_res["summary"]["verified"] >= 4
    assert eval_res["summary"]["potential_issue"] == 0
    print("✓ Test 1 Passed: Real package verified without false issues.")


def test_2_certificate_image_zero_hallucination():
    print("\n--- Test 2: Certificate Image (APSSDC) -> Zero Hallucination ---")
    gate = LabelGateService()
    extractor = ExtractionService()
    compliance = ComplianceService()

    # Exact text structure from the user's certificate test
    ocr_output = {
        "raw_text": (
            "ANDHRA PRADESH STATE SKILL DEVELOPMENT CORPORATION\n"
            "DEPARTMENT OF SKILLS DEVELOPMENT AND TRAINING, GOVERNMENT OF ANDHRA PRADESH\n"
            "CERTIFICATE OF COMPLETION\n"
            "THIS IS TO CERTIFY THAT\n"
            "MR. KANDAGATLA VISHNU VARDHAN\n"
            "HAS SUCCESSFULLY COMPLETED 06 WEEKS INTERNSHIP ON PYTHON PROGRAMMING\n"
            "CONDUCTED FROM 26-05-2026 TO 07-07-2026\n"
            "DIRECTOR GENERAL & MANAGING DIRECTOR\n"
            "EXECUTIVE DIRECTOR"
        ),
        "lines": [
            {"text": "ANDHRA PRADESH STATE SKILL DEVELOPMENT CORPORATION", "confidence": 0.94, "bounding_box": [[10, 10], [500, 10], [500, 40], [10, 40]]},
            {"text": "DEPARTMENT OF SKILLS DEVELOPMENT AND TRAINING", "confidence": 0.89, "bounding_box": [[10, 50], [450, 50], [450, 75], [10, 75]]},
            {"text": "CERTIFICATE OF COMPLETION", "confidence": 0.96, "bounding_box": [[10, 80], [300, 80], [300, 110], [10, 110]]},
            {"text": "THIS IS TO CERTIFY THAT", "confidence": 0.92, "bounding_box": [[10, 115], [250, 115], [250, 140], [10, 140]]},
            {"text": "MR. KANDAGATLA VISHNU VARDHAN", "confidence": 0.95, "bounding_box": [[10, 145], [350, 145], [350, 175], [10, 175]]},
            {"text": "DIRECTOR GENERAL & MANAGING DIRECTOR", "confidence": 0.91, "bounding_box": [[10, 180], [380, 180], [380, 210], [10, 210]]},
        ],
    }

    # 1. Gate check: must block certificate
    eligibility = gate.evaluate_eligibility(ocr_output)
    print(f"Eligibility Status: {eligibility['status']}")
    print(f"Reason: {eligibility['reason']}")
    assert eligibility["is_eligible"] is False
    assert eligibility["status"] == LabelEligibilityStatus.INSUFFICIENT_PACKAGE_LABEL_EVIDENCE

    # 2. Extraction check: must NOT extract product name or any declarations
    extracted = extractor.extract_declarations(ocr_output, is_eligible=False)
    print(f"Extracted Product Name: {extracted['product_name']['value']}")
    print(f"Fields Detected Count: {extracted['summary']['fields_detected_count']}")
    assert extracted["product_name"]["detected"] is False
    assert extracted["product_name"]["value"] is None
    assert extracted["summary"]["fields_detected_count"] == 0

    # 3. Compliance check: screening must be suspended
    eval_res = compliance.evaluate(
        extracted,
        ocr_output["raw_text"],
        is_eligible=False,
        eligibility_status=eligibility["status"],
        eligibility_reason=eligibility["reason"],
    )
    print(f"Overall Assessment: {eval_res['overall_assessment']}")
    print(f"Total Rules Evaluated: {len(eval_res['rule_results'])}")
    print(f"Potential Issues Count: {eval_res['summary']['potential_issue']}")
    assert eval_res["is_eligible"] is False
    assert eval_res["overall_assessment"] == LabelEligibilityStatus.INSUFFICIENT_PACKAGE_LABEL_EVIDENCE
    assert eval_res["summary"]["potential_issue"] == 0
    assert eval_res["summary"]["verified"] == 0
    assert len(eval_res["rule_results"]) == 0
    print("✓ Test 2 Passed: Certificate cleanly rejected with ZERO false violations and ZERO product name hallucination.")


def test_3_random_photo_isolated_word():
    print("\n--- Test 3: Random Photo with Isolated Word ('REDBULL' on shirt) ---")
    gate = LabelGateService()
    extractor = ExtractionService()
    compliance = ComplianceService()

    ocr_output = {
        "raw_text": "REDBULL\nRON",
        "lines": [
            {"text": "REDBULL", "confidence": 0.88, "bounding_box": [[50, 50], [200, 50], [200, 100], [50, 100]]},
            {"text": "RON", "confidence": 0.72, "bounding_box": [[60, 110], [120, 110], [120, 140], [60, 140]]},
        ],
    }

    eligibility = gate.evaluate_eligibility(ocr_output)
    print(f"Eligibility Status: {eligibility['status']}")
    assert eligibility["is_eligible"] is False
    assert eligibility["status"] == LabelEligibilityStatus.INSUFFICIENT_PACKAGE_LABEL_EVIDENCE

    extracted = extractor.extract_declarations(ocr_output, is_eligible=False)
    assert extracted["product_name"]["detected"] is False
    assert extracted["product_name"]["value"] is None

    eval_res = compliance.evaluate(
        extracted,
        ocr_output["raw_text"],
        is_eligible=False,
        eligibility_status=eligibility["status"],
    )
    assert eval_res["summary"]["potential_issue"] == 0
    assert len(eval_res["rule_results"]) == 0
    print("✓ Test 3 Passed: Isolated brand on non-package photo does not fabricate commodity screening.")


def test_4_blank_image():
    print("\n--- Test 4: Blank Image with No Readable Text ---")
    gate = LabelGateService()
    extractor = ExtractionService()
    compliance = ComplianceService()

    ocr_output = {
        "raw_text": "",
        "lines": [],
    }

    eligibility = gate.evaluate_eligibility(ocr_output)
    print(f"Eligibility Status: {eligibility['status']}")
    assert eligibility["is_eligible"] is False
    assert eligibility["status"] == LabelEligibilityStatus.NO_READABLE_TEXT

    extracted = extractor.extract_declarations(ocr_output, is_eligible=False)
    assert extracted["summary"]["fields_detected_count"] == 0

    eval_res = compliance.evaluate(
        extracted,
        "",
        is_eligible=False,
        eligibility_status=eligibility["status"],
    )
    assert eval_res["overall_assessment"] == LabelEligibilityStatus.NO_READABLE_TEXT
    print("✓ Test 4 Passed: Blank image properly flagged as NO_READABLE_TEXT.")


def test_5_sequential_scans_isolation():
    print("\n--- Test 5: Sequential Scans Isolation ---")
    gate = LabelGateService()
    extractor = ExtractionService()

    # Scan 1: Product package
    scan1_ocr = {
        "raw_text": "AMUL BUTTER\nNET 500g\nMRP Rs 275.00 INCL TAXES\nMFD 01/2026\nAMUL DAIRY ANAND",
        "lines": [
            {"text": "AMUL BUTTER", "confidence": 0.95, "bounding_box": []},
            {"text": "NET 500g", "confidence": 0.93, "bounding_box": []},
            {"text": "MRP Rs 275.00 INCL TAXES", "confidence": 0.92, "bounding_box": []},
        ],
    }
    el1 = gate.evaluate_eligibility(scan1_ocr)
    ex1 = extractor.extract_declarations(scan1_ocr, is_eligible=el1["is_eligible"])
    assert el1["is_eligible"] is True
    assert ex1["product_name"]["value"] == "AMUL BUTTER"

    # Scan 2: Certificate
    scan2_ocr = {
        "raw_text": "UNIVERSITY OF TECHNOLOGY\nCERTIFICATE OF MERIT\nAWARDED TO JOHN DOE",
        "lines": [
            {"text": "UNIVERSITY OF TECHNOLOGY", "confidence": 0.95, "bounding_box": []},
            {"text": "CERTIFICATE OF MERIT", "confidence": 0.93, "bounding_box": []},
        ],
    }
    el2 = gate.evaluate_eligibility(scan2_ocr)
    ex2 = extractor.extract_declarations(scan2_ocr, is_eligible=el2["is_eligible"])
    assert el2["is_eligible"] is False
    assert ex2["product_name"]["value"] is None  # Never leaked from Scan 1!

    # Scan 3: Another Product package
    scan3_ocr = {
        "raw_text": "PARLE-G\nNET WEIGHT: 250 g\nMRP Rs. 30\nMFD 02/2026\nPARLE PRODUCTS MUMBAI",
        "lines": [
            {"text": "PARLE-G", "confidence": 0.96, "bounding_box": []},
            {"text": "NET WEIGHT: 250 g", "confidence": 0.94, "bounding_box": []},
            {"text": "MRP Rs. 30", "confidence": 0.91, "bounding_box": []},
        ],
    }
    el3 = gate.evaluate_eligibility(scan3_ocr)
    ex3 = extractor.extract_declarations(scan3_ocr, is_eligible=el3["is_eligible"])
    assert el3["is_eligible"] is True
    assert ex3["product_name"]["value"] == "PARLE-G"

    print("✓ Test 5 Passed: Strict state isolation across sequential scans verified.")


if __name__ == "__main__":
    test_1_real_packaged_commodity()
    test_2_certificate_image_zero_hallucination()
    test_3_random_photo_isolated_word()
    test_4_blank_image()
    test_5_sequential_scans_isolation()
    print("\n=======================================================")
    print("ALL 5 REGRESSION TESTS PASSED SUCCESSFULLY!")
    print("=======================================================")
