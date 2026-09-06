"""
Comprehensive End-to-End QA Verification Script for LABEL LENS AI.
Tests all 5 required operational scenarios against the running backend API:
1. Real Packaged Commodity (e.g. Tata Tea Gold)
2. Certificate of Completion (APSSDC)
3. Random Photograph with isolated text ("REDBULL" on shirt)
4. Blank / Unclear Image
5. Sequential Uploads (Isolation verification)
"""
import io
import sys
import json
import urllib.request
import urllib.error
import cv2
import numpy as np

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
API_BASE = "http://127.0.0.1:8000"

def upload_image_bytes(filename: str, img_bytes: bytes) -> str:
    boundary = b"----BoundaryQA998234"
    body = (
        b"--" + boundary + b"\r\n"
        + f'Content-Disposition: form-data; name="file"; filename="{filename}"\r\n'.encode()
        + b"Content-Type: image/jpeg\r\n\r\n"
        + img_bytes
        + b"\r\n--" + boundary + b"--\r\n"
    )
    req = urllib.request.Request(
        f"{API_BASE}/api/upload",
        data=body,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary.decode()}"},
        method="POST"
    )
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read())
        return data["image_id"]

def analyze_scan(scan_id: str) -> dict:
    req = urllib.request.Request(f"{API_BASE}/api/scans/{scan_id}/analyze", method="POST")
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())

def validate_scan(scan_id: str) -> dict:
    req = urllib.request.Request(f"{API_BASE}/api/scans/{scan_id}/validate", method="POST")
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())

def get_evidence(scan_id: str) -> dict:
    req = urllib.request.Request(f"{API_BASE}/api/scans/{scan_id}/evidence", method="GET")
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())

def query_copilot(scan_id: str, query: str) -> dict:
    body = json.dumps({"query": query}).encode()
    req = urllib.request.Request(
        f"{API_BASE}/api/scans/{scan_id}/copilot",
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())

def make_real_package_image() -> bytes:
    img = np.ones((700, 900, 3), dtype=np.uint8) * 255
    font = cv2.FONT_HERSHEY_SIMPLEX
    cv2.putText(img, "TATA TEA GOLD PREMIUM", (40, 70), font, 1.1, (20, 20, 20), 2)
    cv2.putText(img, "NET QUANTITY: 500 g", (40, 140), font, 0.8, (0, 0, 0), 2)
    cv2.putText(img, "MRP Rs. 380.00 (INCL. OF ALL TAXES)", (40, 200), font, 0.8, (0, 0, 0), 2)
    cv2.putText(img, "MFD: 15/05/2026", (40, 260), font, 0.75, (0, 0, 0), 2)
    cv2.putText(img, "EXP: 14/05/2027", (40, 310), font, 0.75, (0, 0, 0), 2)
    cv2.putText(img, "BATCH NO: TTG2026A", (40, 360), font, 0.75, (0, 0, 0), 2)
    cv2.putText(img, "MANUFACTURED BY: TATA CONSUMER PRODUCTS LTD", (40, 420), font, 0.65, (20, 20, 20), 2)
    cv2.putText(img, "BANGALORE - 560024, KARNATAKA", (40, 460), font, 0.65, (20, 20, 20), 2)
    cv2.putText(img, "CONSUMER CARE TOLL FREE: 1800-345-1720", (40, 520), font, 0.65, (20, 20, 20), 2)
    cv2.putText(img, "EMAIL: CARE@TATACONSUMER.COM", (40, 560), font, 0.65, (20, 20, 20), 2)
    _, buf = cv2.imencode(".jpg", img)
    return buf.tobytes()

def make_certificate_image() -> bytes:
    img = np.ones((700, 950, 3), dtype=np.uint8) * 255
    font = cv2.FONT_HERSHEY_SIMPLEX
    cv2.putText(img, "ANDHRA PRADESH STATE SKILL DEVELOPMENT CORPORATION", (30, 80), font, 0.75, (10, 10, 80), 2)
    cv2.putText(img, "DEPARTMENT OF SKILLS DEVELOPMENT AND TRAINING", (100, 140), font, 0.7, (20, 20, 20), 2)
    cv2.putText(img, "CERTIFICATE OF COMPLETION", (180, 220), font, 1.1, (10, 10, 120), 2)
    cv2.putText(img, "THIS IS TO CERTIFY THAT", (260, 290), font, 0.7, (40, 40, 40), 2)
    cv2.putText(img, "MR. KANDAGATLA VISHNU VARDHAN", (150, 360), font, 1.0, (10, 10, 10), 2)
    cv2.putText(img, "HAS SUCCESSFULLY COMPLETED 06 WEEKS INTERNSHIP", (80, 430), font, 0.7, (30, 30, 30), 2)
    cv2.putText(img, "ON PYTHON PROGRAMMING AND MACHINE LEARNING", (110, 480), font, 0.7, (30, 30, 30), 2)
    cv2.putText(img, "CONDUCTED FROM 26-05-2026 TO 07-07-2026", (160, 530), font, 0.65, (40, 40, 40), 2)
    cv2.putText(img, "DIRECTOR GENERAL & MANAGING DIRECTOR", (60, 620), font, 0.6, (20, 20, 20), 2)
    cv2.putText(img, "EXECUTIVE DIRECTOR", (600, 620), font, 0.6, (20, 20, 20), 2)
    _, buf = cv2.imencode(".jpg", img)
    return buf.tobytes()

def make_random_photo_image() -> bytes:
    img = np.ones((500, 600, 3), dtype=np.uint8) * 180  # grey photo background
    font = cv2.FONT_HERSHEY_SIMPLEX
    cv2.putText(img, "REDBULL", (180, 250), font, 1.2, (20, 20, 20), 3)
    cv2.putText(img, "RACING TEAM", (160, 300), font, 0.8, (40, 40, 40), 2)
    _, buf = cv2.imencode(".jpg", img)
    return buf.tobytes()

def make_blank_image() -> bytes:
    img = np.ones((400, 400, 3), dtype=np.uint8) * 240
    _, buf = cv2.imencode(".jpg", img)
    return buf.tobytes()

def run_e2e_qa():
    print("=" * 65)
    print("  LABEL LENS AI — FINAL LIVE END-TO-END QA VERIFICATION")
    print("=" * 65)

    # -------------------------------------------------------------------------
    # 1. Real Packaged Commodity
    # -------------------------------------------------------------------------
    print("\n[Scenario 1] Real Packaged Commodity (Tata Tea Gold)")
    img1 = make_real_package_image()
    scan_id1 = upload_image_bytes("tata_tea_gold.jpg", img1)
    print(f"  -> Uploaded Scan ID: {scan_id1}")
    
    an1 = analyze_scan(scan_id1)
    gate1 = an1.get("label_detection", {})
    prod1 = an1.get("extracted_fields", {}).get("product_name", {})
    print(f"  -> Eligibility: {gate1.get('status')} (is_eligible={gate1.get('is_eligible')})")
    print(f"  -> Extracted Product Name: {prod1.get('value')} (detected={prod1.get('detected')})")
    assert gate1.get("is_eligible") is True, "Scenario 1 should be eligible"
    assert prod1.get("detected") is True, "Product name should be detected"
    
    val1 = validate_scan(scan_id1)
    print(f"  -> Overall Assessment: {val1.get('overall_assessment')} ({val1.get('overall_label')})")
    print(f"  -> Summary: {val1.get('summary')}")
    assert val1.get("is_eligible") is True
    assert val1.get("summary", {}).get("potential_issue") == 0, "No false potential issues"
    assert val1.get("summary", {}).get("verified") >= 4
    
    ev1 = get_evidence(scan_id1)
    print(f"  -> Evidence Mapped Declarations: {ev1.get('total_mapped_declarations')}")
    assert ev1.get("total_mapped_declarations") >= 4
    print("  ✓ SCENARIO 1 PASSED: Real package verified with visual evidence.")

    # -------------------------------------------------------------------------
    # 2. Certificate Image
    # -------------------------------------------------------------------------
    print("\n[Scenario 2] Certificate of Completion (APSSDC)")
    img2 = make_certificate_image()
    scan_id2 = upload_image_bytes("apssdc_certificate.jpg", img2)
    print(f"  -> Uploaded Scan ID: {scan_id2}")
    
    an2 = analyze_scan(scan_id2)
    gate2 = an2.get("label_detection", {})
    prod2 = an2.get("extracted_fields", {}).get("product_name", {})
    print(f"  -> Eligibility: {gate2.get('status')} (is_eligible={gate2.get('is_eligible')})")
    print(f"  -> Reason: {gate2.get('reason')}")
    print(f"  -> Extracted Product Name: {prod2.get('value')} (detected={prod2.get('detected')})")
    assert gate2.get("is_eligible") is False, "Certificate must NOT be eligible"
    assert gate2.get("status") == "INSUFFICIENT_PACKAGE_LABEL_EVIDENCE"
    assert prod2.get("detected") is False, "Product name must NOT be detected for certificate"
    assert prod2.get("value") is None, "Product name must be None (Zero Hallucination)"

    val2 = validate_scan(scan_id2)
    print(f"  -> Overall Assessment: {val2.get('overall_assessment')} ({val2.get('overall_label')})")
    print(f"  -> Summary: {val2.get('summary')}")
    print(f"  -> Rules Evaluated Count: {len(val2.get('results', []))}")
    assert val2.get("is_eligible") is False
    assert val2.get("overall_assessment") == "INSUFFICIENT_PACKAGE_LABEL_EVIDENCE"
    assert val2.get("overall_label") == "Analysis Not Performed"
    assert val2.get("summary", {}).get("potential_issue") == 0
    assert len(val2.get("results", [])) == 0

    cp2 = query_copilot(scan_id2, "What product is this and why are there issues?")
    print(f"  -> Copilot Answer: {cp2.get('answer')[:120]}...")
    assert "not appear to be a packaged commodity" in cp2.get("answer").lower()
    print("  ✓ SCENARIO 2 PASSED: Certificate correctly rejected; zero false violations or hallucination.")

    # -------------------------------------------------------------------------
    # 3. Random Photo with Isolated Word ("REDBULL" on shirt)
    # -------------------------------------------------------------------------
    print("\n[Scenario 3] Random Photo with Isolated Text ('REDBULL' on shirt)")
    img3 = make_random_photo_image()
    scan_id3 = upload_image_bytes("redbull_shirt.jpg", img3)
    print(f"  -> Uploaded Scan ID: {scan_id3}")
    
    an3 = analyze_scan(scan_id3)
    gate3 = an3.get("label_detection", {})
    prod3 = an3.get("extracted_fields", {}).get("product_name", {})
    print(f"  -> Eligibility: {gate3.get('status')} (is_eligible={gate3.get('is_eligible')})")
    print(f"  -> Extracted Product Name: {prod3.get('value')} (detected={prod3.get('detected')})")
    assert gate3.get("is_eligible") is False
    assert prod3.get("detected") is False
    assert prod3.get("value") is None

    val3 = validate_scan(scan_id3)
    print(f"  -> Overall Assessment: {val3.get('overall_assessment')} ({val3.get('overall_label')})")
    print(f"  -> Potential Issues Count: {val3.get('summary', {}).get('potential_issue')}")
    assert val3.get("summary", {}).get("potential_issue") == 0
    print("  ✓ SCENARIO 3 PASSED: Random photo safely flagged ineligible without false product identification.")

    # -------------------------------------------------------------------------
    # 4. Blank / Unclear Image
    # -------------------------------------------------------------------------
    print("\n[Scenario 4] Blank / Unclear Image (No text)")
    img4 = make_blank_image()
    scan_id4 = upload_image_bytes("blank_image.jpg", img4)
    print(f"  -> Uploaded Scan ID: {scan_id4}")
    
    an4 = analyze_scan(scan_id4)
    gate4 = an4.get("label_detection", {})
    print(f"  -> Eligibility: {gate4.get('status')} (is_eligible={gate4.get('is_eligible')})")
    assert gate4.get("status") == "NO_READABLE_TEXT"
    assert gate4.get("is_eligible") is False

    val4 = validate_scan(scan_id4)
    print(f"  -> Overall Assessment: {val4.get('overall_assessment')} ({val4.get('overall_label')})")
    assert val4.get("overall_assessment") == "NO_READABLE_TEXT"
    print("  ✓ SCENARIO 4 PASSED: Blank image identified as NO_READABLE_TEXT.")

    # -------------------------------------------------------------------------
    # 5. Sequential Uploads Isolation
    # -------------------------------------------------------------------------
    print("\n[Scenario 5] Sequential Uploads Isolation (Scan A -> Scan B -> Scan C)")
    # Re-upload real package after certificate
    img5 = make_real_package_image()
    scan_id5 = upload_image_bytes("amul_sequential.jpg", img5)
    an5 = analyze_scan(scan_id5)
    val5 = validate_scan(scan_id5)

    print(f"  -> Scan A (Tata Tea): ID={scan_id1}, Eligible={val1['is_eligible']}")
    print(f"  -> Scan B (Certificate): ID={scan_id2}, Eligible={val2['is_eligible']}")
    print(f"  -> Scan C (New Package): ID={scan_id5}, Eligible={val5['is_eligible']}")
    
    assert scan_id1 != scan_id2 != scan_id5, "Scan IDs must be completely distinct"
    assert val2["is_eligible"] is False, "Scan B state must not be contaminated by Scan A"
    assert val5["is_eligible"] is True, "Scan C state must not be contaminated by Scan B"
    print("  ✓ SCENARIO 5 PASSED: Strict sequential scan isolation verified.")

    print("\n" + "=" * 65)
    print("  ALL 5 LIVE END-TO-END QA SCENARIOS PASSED WITH ZERO ERRORS!")
    print("=" * 65)

if __name__ == "__main__":
    run_e2e_qa()
