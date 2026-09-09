# SIH Demo Checklist — LABEL LENS AI

**Smart India Hackathon (SIH) Jury Presentation & Live Booth Protocol**

This operational checklist ensures seamless, fail-safe live demonstrations of LABEL LENS AI during jury evaluations.

---

## 1. Quick Startup Steps (60 Seconds)

### Step 1: Start Backend
In PowerShell terminal:
```powershell
cd c:\SIH\vishnu\vishnu\backend
$env:PYTHONPATH="C:\SIH\vishnu\vishnu\backend;C:\SIH\vishnu\vishnu\backend\.venv\Lib\site-packages;C:\Users\kotes\AppData\Roaming\Python\Python314\site-packages"
& "C:\Program Files\Python314\python.exe" -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
*Verification*: Open `http://127.0.0.1:8000/docs` or `http://127.0.0.1:8000/api/demo/health`. Expect: `{"overall_status": "SYSTEM READY"}`.

### Step 2: Start Frontend
In second PowerShell terminal:
```powershell
cd c:\SIH\vishnu\vishnu\frontend
$env:PATH = "c:\SIH\vishnu\vishnu\_tools\node-v20.18.0-win-x64;" + $env:PATH
npm run dev
```
*Verification*: Open `http://localhost:5173/`. Top navigation bar displays **"⚖️ SIH Judge Mode"** button.

---

## 2. Pre-Flight Demo Health Check

1. Click **"⚖️ SIH Judge Mode"** in the top navigation bar.
2. Confirm the green badge reads: `SYSTEM READY (11/11)`:
   - Backend API: `READY`
   - Database Engine: `READY`
   - OCR Engine: `READY`
   - Legal Metrology Engine: `READY`
   - Food Intelligence: `READY`
   - Digital Package Twin: `READY`
   - Confidence Engine: `READY`
   - Inspector Risk Intelligence: `READY`
   - Inspection Queue: `READY`
   - Case Packet Dossier: `READY`
   - Demo Dataset: `READY`

---

## 3. Recommended 90-Second Demo Sequence

### Scenario A: Fully Compliant Commodity (Tata Tea Gold 500g)
1. In Judge Mode modal, select **"✅ Complete Package"**.
2. Walk the judge through the 12-stage pipeline:
   - *Capture & Quality*: 2 panels captured, sharpness 78.4, glare minimal.
   - *Digital Twin*: Source coordinates physically bound to declarations.
   - *Rule 6 Compliance*: 6/6 verified (MRP ₹380, Net Qty 500g, Unit Sale Price ₹0.76/g).
   - *Provenance*: Every token tagged (`OCR_OBSERVATION`, `CALCULATED_VALUE`).
3. Click **"2. 'Why This Result?' Explainability"** tab to show the WHAT / SOURCE / EVIDENCE / CONFIDENCE / RULE / DECISION matrix.

### Scenario B: Surfacing Real-World Failure — MRP Conflict (Spicy Chips)
1. Select **"⚠️ MRP Conflict"**.
2. Explain how the system catches statutory fraud:
   - Front promotional sticker declares `₹20.00`.
   - Back pre-printed pack declares `₹25.00`.
   - The engine **refuses to overwrite** or pick one arbitrarily; instead, it triggers `CONTRADICTORY_EVIDENCE` and flags `REVIEW_REQUIRED`.

### Scenario C: Image Degradation — Specular Glare / Blur
1. Select **"✨ Glare Package"** or **"🌫️ Blurry Package"**.
2. Point out the core safety principle:
   - Under severe blur or reflection, the system **ABSTAINS** and guides the inspector with `REDUCE_GLARE` or `RETAKE_IMAGE`.
   - The system **never hallucinates numbers** when evidence is occluded.

---

## 4. Demo Reset Procedure

Between different judge rounds, ensure clean demo state without wiping historical inspector records:
1. In the Judge Mode modal or Demo Runner widget, click **"🔄 Reset Demo State"**.
2. Confirms:
   - All `DEMO-*` cases and temporary sessions purged.
   - Real database inspections and audit logs strictly preserved.
3. Takes $< 50$ milliseconds.

---

## 5. Offline Fallback Procedure

If event WiFi drops or camera hardware disconnects:
- The entire evaluation runs **100% offline-first**.
- Click **"Launch Judge Mode"** or use the **SIH Demonstration Lab** widget on the Smart Scan page.
- All 8 canonical scenarios run deterministically with preloaded physical packaging captures and true ground truth.
