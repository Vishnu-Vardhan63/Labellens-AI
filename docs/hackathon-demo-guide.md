# LABEL LENS AI — Smart India Hackathon Demo Guide

**Problem Statement**: SIH26034  
**Project**: LABEL LENS AI ("Smart Packaged Commodity Compliance Assistant")  
**Regulatory Framework**: Legal Metrology Act, 2009 & Legal Metrology (Packaged Commodities) Rules, 2011 (Rule 6)  
**Target Demo Duration**: 2–3 Minutes  

---

## 1. Hackathon Pitch (30 Seconds)

> *"Good morning/afternoon, esteemed judges.  
> Every day, millions of packaged commodities enter the Indian market. Under Rule 6 of the Legal Metrology (Packaged Commodities) Rules, 2011, every package must mandatorily declare its Product Name, Maximum Retail Price inclusive of all taxes, Net Quantity in standard metric units, Manufacturer and Packer details with PIN code, Date of Manufacture/Packing, and Consumer Care contacts.  
> Today, field inspectors have to manually examine small, dense, curved labels with magnifying tools — a slow, error-prone process.  
> We built **LABEL LENS AI**: a zero-hallucination, explainable compliance screening assistant designed specifically for packaged commodity inspectors."*

---

## 2. Step-by-Step 8-Stage Demo Flow

### Step 1: Open the Application
- Open the application at `http://localhost:5173` (or on your Android device/emulator).
- Point out the clean, professional, enterprise-grade inspection UI:
  - High clarity, zero distracting flashy animations.
  - Regulatory scope banner: *Legal Metrology · PC(PWMG) Rules, 2011*.

### Step 2: Scan or Upload a Package Label
- Click **"Scan Package"** or **"Upload Image"**.
- Drag and drop or photograph a real packaged commodity label:
  - *Recommended sample*: Tea packet, biscuit wrapper, dairy pack, or detergent pouch.
- The UI previews the image, validates file size and format, and displays filename details.
- Click **"Continue"**.

### Step 3: Real OCR Pipeline & Preprocessing
- Show the **Processing** stage:
  - Adaptive CLAHE contrast enhancement & bilateral noise reduction.
  - Local RapidOCR (PaddleOCR ONNX) reading text with bounding box coordinates.
  - *Emphasize to judges*: No external cloud OCR and no latency/cost bottlenecks.

### Step 4: Structured Information Extraction
- Arrive at the **Results Page**:
  - Show the **Package Details** card:
    - Product Name, MRP, Net Quantity, Manufacturer details, Dates & Batch, Consumer Care.
    - Confidence scores (High / Moderate / Low) derived from real OCR reading.

### Step 5: Statutory Compliance Review (Rule 6 Evaluation)
- Direct attention to the **Overall Assessment Banner**:
  - 🟢 *Information Verified*, 🟡 *Manual Review Recommended*, or 🔴 *Potential Declaration Issues Detected*.
  - Show the statutory disclaimer:
    > *"This assessment is based on automated analysis of the uploaded image and should be manually verified where required."*
  - Show summary counter badges: `X Verified`, `Y Require Review`, `Z Potential Issue`.

### Step 6: Explainable Visual Evidence Mapping
- Click on any declaration card (e.g. **Maximum Retail Price** or **Net Quantity**):
  - Watch the package image highlight the exact physical region with an animated bounding box!
  - Point out that coordinates are **not hardcoded or simulated**: they are derived directly from the OCR engine.
  - Toggle **"Show All OCR"** to display all detected text boxes across the entire package.

### Step 7: Ask the AI Compliance Assistant (Copilot)
- Scroll to or focus on the **LABEL LENS AI Assistant** widget.
- Click one of the quick inquiry chips:
  - Click: **"What should I check manually?"**
  - Copilot returns an actionable checklist:
    1. *Check crimp stamping for date of manufacture.*
    2. *Confirm presence of registered consumer helpline on reverse panel.*
- Point out the clickable visual shortcuts inside the answer: `[ 🔍 Highlight MRP on Image ]`.

### Step 8: Download Official Inspection Report (PDF)
- Click the prominent button: **"📄 Download Inspection Report"**.
- The system generates and downloads `LabelLensAI_Report_<id>.pdf`.
- Open the PDF in front of the judges and highlight:
  1. Authoritative header citing SIH26034 and Legal Metrology Rules, 2011.
  2. Package metadata and embedded label thumbnail.
  3. Declaration summary table.
  4. Per-declaration findings with Rule 6 citations and OCR evidence snippets.
  5. Field Inspector Sign-Off block with signature, designation, and action taken checkboxes.

---

## 3. Recommended Sample Test Images

For best results during live hackathon judging, use images that showcase the system's nuance:

1. **Test Sample A — Tata Tea Gold (Full Compliant Label)**:
   - Contains: Product name, ₹380 incl. of taxes, 500 g net quantity, complete manufacturer address with PIN code, 1800 consumer helpline.
   - Outcome: 🟢 *Information Verified* (Demonstrates high-accuracy full compliance).

2. **Test Sample B — Biscuit Wrapper (Manual Review Example)**:
   - Contains: Printed price and net weight, but date/batch is faintly ink-jet stamped on crimp fold.
   - Outcome: 🟡 *Manual Review Recommended* (Demonstrates that the system does NOT pretend to read unreadable text; it safely alerts the inspector to verify the crimp).

3. **Test Sample C — Generic Unlabeled Container (Missing Declarations)**:
   - Contains: Product brand only, no MRP or consumer care on front panel.
   - Outcome: 🔴 *Potential Declaration Issues Detected* (Demonstrates zero hallucination; flags missing mandatory declarations honestly).

---

## 4. Judge Q&A Defense Cheat Sheet

| Question | Recommended Answer |
|---|---|
| *"Are you calling OpenAI or a paid cloud API?"* | **No.** LABEL LENS AI runs 100% locally. OCR uses an ONNX-optimized PaddleOCR model, and the Copilot is a deterministic rule-grounded reasoning engine. No recurring API costs, complete data privacy, and full offline field readiness. |
| *"What happens if text is blurry or glare obscures the date?"* | The system classifies low/moderate confidence as **Manual Review Required** and tells the inspector exactly which physical region to confirm. We never guess or fabricate declarations. |
| *"Is this compliant with the actual Legal Metrology law?"* | **Yes.** Our validation rules are modeled directly on Rule 6 of the Legal Metrology (Packaged Commodities) Rules, 2011, covering mandatory unit schedules, inclusive-of-taxes syntax, and consumer care channels. |
| *"Can an inspector use this on their phone in the field?"* | **Yes.** The UI is built mobile-first and packaged with Capacitor for Android. Inspectors can use their device camera to snap and verify labels directly on retail shelves. |
