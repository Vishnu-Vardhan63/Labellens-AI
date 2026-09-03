import io
import sys
import json
import urllib.request
import cv2
import numpy as np

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

print("=== 1. Health & Server Status ===")
with urllib.request.urlopen("http://localhost:8000/health") as r:
    health = json.loads(r.read())
    print(f"  Backend: {health['status']} v{health['version']}")
with urllib.request.urlopen("http://localhost:5173/") as r:
    print(f"  Frontend Dev Server: HTTP {r.status}")

print("\n=== 2. Creating Real Test Commodity (Tata Tea Gold) ===")
img = np.ones((500, 800, 3), dtype=np.uint8) * 255
font = cv2.FONT_HERSHEY_SIMPLEX
cv2.putText(img, "TATA TEA GOLD PREMIUM", (30, 60), font, 1.0, (15, 15, 15), 2)
cv2.putText(img, "Net Quantity: 500 g", (30, 130), font, 0.8, (0, 0, 0), 2)
cv2.putText(img, "MRP Rs. 380.00 (incl. of all taxes)", (30, 200), font, 0.8, (0, 0, 0), 2)
cv2.putText(img, "Mfg Date: 11/2024  Exp Date: 11/2025", (30, 270), font, 0.7, (0, 0, 0), 2)
cv2.putText(img, "Batch No: TTG-2024-X12", (30, 330), font, 0.7, (0, 0, 0), 2)
cv2.putText(img, "Mfg by: Tata Consumer Products Ltd, PIN: 560024", (30, 390), font, 0.65, (0, 0, 0), 2)
cv2.putText(img, "Consumer Care: 1800-345-1720 care@tataconsumer.com", (30, 450), font, 0.65, (0, 0, 0), 2)

_, img_bytes = cv2.imencode(".jpg", img, [int(cv2.IMWRITE_JPEG_QUALITY), 95])

print("\n=== 3. Uploading Image to Backend (POST /api/upload) ===")
boundary = b"BoundaryVerifyFullFlow"
body = (
    b"--" + boundary + b"\r\n"
    + b"Content-Disposition: form-data; name=\"file\"; filename=\"tata_tea_gold_label.jpg\"\r\n"
    + b"Content-Type: image/jpeg\r\n\r\n"
    + img_bytes.tobytes()
    + b"\r\n--" + boundary + b"--\r\n"
)
req_upload = urllib.request.Request(
    "http://localhost:8000/api/upload",
    data=body,
    headers={"Content-Type": f"multipart/form-data; boundary={boundary.decode()}"},
    method="POST",
)
with urllib.request.urlopen(req_upload) as resp:
    upload_res = json.loads(resp.read())
    scan_id = upload_res["image_id"]
    print("  Uploaded Successfully!")
    print("  Image ID:", scan_id)
    print("  Filename:", upload_res["original_filename"])

print("\n=== 4. Processing & OCR Analysis (POST /api/scans/{id}/analyze) ===")
req_analyze = urllib.request.Request(
    f"http://localhost:8000/api/scans/{scan_id}/analyze",
    data=b"",
    headers={"Content-Type": "application/json"},
    method="POST",
)
with urllib.request.urlopen(req_analyze) as resp:
    analysis = json.loads(resp.read())
    print("  OCR Engine:", analysis["ocr_summary"]["engine"])
    print("  Lines Detected:", analysis["ocr_summary"]["line_count"])
    print(f"  Average Confidence: {analysis['ocr_summary']['average_confidence']*100:.1f}%")
    print("  Detected Product:", analysis["extracted_fields"]["product_name"]["value"])
    print("  Detected MRP: Rs.", analysis["extracted_fields"]["mrp"]["value"])
    print(f"  Detected Net Qty: {analysis['extracted_fields']['net_quantity']['value']} {analysis['extracted_fields']['net_quantity']['unit']}")

print("\n=== 5. Statutory Declaration Review (Rule 6 Evaluation) ===")
with urllib.request.urlopen(f"http://localhost:8000/api/scans/{scan_id}") as resp:
    scan_detail = json.loads(resp.read())
    print("  Overall Assessment:", scan_detail["overall_assessment"])
    summary = scan_detail["compliance_summary"]
    print(f"  Summary: {summary['verified']} Verified | {summary['manual_review']} Require Review | {summary['potential_issue']} Potential Issues")
    for r in scan_detail["compliance_results"]:
        status_symbol = "[VERIFIED]" if r["status"] == "verified" else "[REVIEW]" if r["status"] == "manual_review" else "[ISSUE]"
        print(f"    • {r['display_name']} ({r.get('legal_reference', 'Rule 6')}): {status_symbol} -> {r.get('extracted_value')}")

print("\n=== 6. Visual Evidence Mapping (GET /api/scans/{id}/evidence) ===")
with urllib.request.urlopen(f"http://localhost:8000/api/scans/{scan_id}/evidence") as resp:
    ev_data = json.loads(resp.read())
    print("  Mapped Declarations:", ev_data["total_mapped_declarations"])
    mrp_ev = ev_data["declarations"]["mrp"]
    print("  MRP Normalized Rect:", mrp_ev["evidence_blocks"][0]["normalized_rect"])
    print("  MRP Supporting OCR Text:", mrp_ev["evidence_blocks"][0]["text"])

print("\n=== 7. AI Compliance Copilot (POST /api/scans/{id}/copilot) ===")
copilot_query = json.dumps({"intent": "WHAT_TO_CHECK_MANUALLY"}).encode()
req_copilot = urllib.request.Request(
    f"http://localhost:8000/api/scans/{scan_id}/copilot",
    data=copilot_query,
    headers={"Content-Type": "application/json"},
    method="POST",
)
with urllib.request.urlopen(req_copilot) as resp:
    copilot_res = json.loads(resp.read())
    print("  Question:", copilot_res["question"])
    snippet = copilot_res["answer"][:140].replace("\n", " ")
    print(f"  Answer: \"{snippet}...\"")

print("\n=== 8. PDF Inspection Report Download (GET /api/scans/{id}/report) ===")
with urllib.request.urlopen(f"http://localhost:8000/api/scans/{scan_id}/report") as resp:
    pdf_bytes = resp.read()
    print("  HTTP Status:", resp.status)
    print("  Content-Type:", resp.headers.get("Content-Type"))
    print("  Content-Disposition:", resp.headers.get("Content-Disposition"))
    print(f"  PDF File Size: {len(pdf_bytes)} bytes")
    assert pdf_bytes.startswith(b"%PDF-")
    print("  Report Verified: Valid %PDF- stream!")

print("\n============================================================")
print("  COMPLETE 8-STAGE END-TO-END WORKFLOW VERIFIED SUCCESSFULLY!")
print("============================================================")
