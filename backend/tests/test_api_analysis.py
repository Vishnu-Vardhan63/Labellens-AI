import io
import sys
import json
import urllib.request
import cv2
import numpy as np

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

# 1. Create a test label image
img = np.ones((400, 800, 3), dtype=np.uint8) * 255
font = cv2.FONT_HERSHEY_SIMPLEX
cv2.putText(img, "ORGANIC HONEY", (30, 50), font, 1.0, (10, 10, 10), 2)
cv2.putText(img, "Net Wt: 250 g", (30, 120), font, 0.75, (0, 0, 0), 2)
cv2.putText(img, "MRP Rs. 220.00 (incl of all taxes)", (30, 170), font, 0.75, (0, 0, 0), 2)
cv2.putText(img, "Mfg Date: 09/2024", (30, 220), font, 0.65, (0, 0, 0), 2)
cv2.putText(img, "Best Before 18 months from mfg", (30, 260), font, 0.65, (0, 0, 0), 2)
cv2.putText(img, "Manufactured by: Pure Naturals Ltd, Pune - 411001", (30, 310), font, 0.55, (20, 20, 20), 1)
cv2.putText(img, "Consumer Helpline: 1800-111-2222 care@purenaturals.in", (30, 350), font, 0.55, (20, 20, 20), 1)

_, img_bytes = cv2.imencode(".png", img)
png_data = img_bytes.tobytes()

# 2. Upload image
boundary = b'BoundaryTest7789'
body = (
    b'--' + boundary + b'\r\n'
    + b'Content-Disposition: form-data; name="file"; filename="organic_honey.png"\r\n'
    + b'Content-Type: image/png\r\n\r\n'
    + png_data
    + b'\r\n--' + boundary + b'--\r\n'
)
req = urllib.request.Request(
    'http://localhost:8000/api/upload',
    data=body,
    headers={'Content-Type': f'multipart/form-data; boundary={boundary.decode()}'},
    method='POST'
)

with urllib.request.urlopen(req) as resp:
    upload_res = json.loads(resp.read())

print("Upload Response:")
print(json.dumps(upload_res, indent=2))
scan_id = upload_res["image_id"]

# 3. Call Analyze endpoint
analyze_req = urllib.request.Request(
    f'http://localhost:8000/api/scans/{scan_id}/analyze',
    data=b'',
    headers={'Content-Type': 'application/json'},
    method='POST'
)
with urllib.request.urlopen(analyze_req) as resp:
    analysis_res = json.loads(resp.read())

print("\nAnalysis API Response:")
print(json.dumps(analysis_res, indent=2))

# 4. Verify fields
extracted = analysis_res["extracted_fields"]
assert extracted["product_name"]["detected"] is True
assert extracted["mrp"]["value"] == 220
assert extracted["net_quantity"]["value"] == 250 and extracted["net_quantity"]["unit"] == "g"
assert extracted["consumer_care"]["toll_free"] == "1800-111-2222"
assert analysis_res["analysis_status"] == "completed"

# 5. Verify GET /api/scans/{scan_id}
with urllib.request.urlopen(f'http://localhost:8000/api/scans/{scan_id}') as resp:
    detail_res = json.loads(resp.read())
assert detail_res["status"] == "completed"

# 6. Verify GET /api/scans/{scan_id}/image
with urllib.request.urlopen(f'http://localhost:8000/api/scans/{scan_id}/image') as resp:
    assert resp.status == 200
    assert len(resp.read()) == len(png_data)

print("\nAPI Integration Tests Passed Successfully!")
