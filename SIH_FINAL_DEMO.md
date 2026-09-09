# LABEL LENS AI — SIH FINAL JUDGE DEMONSTRATION SCRIPT
**Smart India Hackathon (SIH26034) Live Evaluation Guide**  
**Estimated Run Time**: 90 seconds (Pitch) / 3–5 minutes (Full Technical Deep Dive)

---

## 1. The 90-Second Winning Elevator Pitch

> *"Respected Judges, India has over 10 million retail commodities sold every day, but enforcement of the Legal Metrology (Packaged Commodities) Rules 2011 currently relies on manual field sampling. Generic AI tools fail because they treat packages as flat single photos and hallucinate text when labels are blurry or glare-covered.*
>
> *We present **LABEL LENS AI** — India's first multi-panel, explainable packaged commodity compliance and inspector triage platform.*
>
> *1. It **actively guides** the user across multiple panels (front, back, sides) and fuses them into an immutable **Digital Package Twin**.*  
> *2. It strictly enforces **evidentiary separation**: high confidence does NOT mean compliant, and missing evidence is NEVER declared an automatic violation while scanning.*  
> *3. It catches **critical consumer harm**: dual MRP tampering, missing net quantity, and hidden allergens.*  
> *4. It operates **100% locally and offline** with zero hallucinated verification stamps and zero data sent to foreign clouds.*
>
> *Let us demonstrate this live in 90 seconds."*

---

## 2. Interactive SIH Judge Mode (One-Click)

The platform includes a dedicated **SIH Judge Mode** button located in the top navigation bar (`⚖️ SIH Judge Mode`).

Clicking this button reveals a 5-step interactive benchmark lab:
1. **Scenario 1: Complete Package (Tata Tea Gold)** — Demonstrates 100% evidence completeness across 4 panels, statutory compliance verification, and instant court-admissible PDF generation.
2. **Scenario 2: Multi-Panel Smart Scan (Maggi Noodles)** — Demonstrates multi-side panel fusion where MRP is on the back, Net Qty on the front, and Manufacturer on the side.
3. **Scenario 3: Optical Failure-First (Blurry Label)** — Demonstrates how the Automated Quality Gate immediately rejects blurred text before expensive OCR, prompting actionable retake guidance.
4. **Scenario 4: Specular Glare Rejection** — Demonstrates glare detection on reflective foil packaging, prompting the user to tilt the package.
5. **Scenario 5: Conflict Intelligence (Dual MRP Tampering)** — Demonstrates two panels declaring different MRPs (₹20 vs ₹25). The system escalates the case directly to `HIGH_PRIORITY` in the Inspector Queue.

---

## 3. Step-by-Step Live Demonstration Walkthrough

### Act I: The Multi-Panel Smart Scan (90 seconds)
1. Navigate to **Smart Scan** (`/smart-scan`).
2. Click **Start New Session**.
3. Upload or capture **Front Panel**:
   - Point out that the system extracts `Product Name` and `Net Quantity: 500 g`.
   - Point out the checklist: other fields display as `NOT_YET_OBSERVED` (not "Violation").
   - Point out the actionable dynamic guidance: *"Rotate package to capture back panel for MRP and manufacturing date."*
4. Upload **Back Panel**:
   - Point out the dHash novelty detection: it recognizes this as new evidentiary content.
   - MRP (`₹380.00`) and MFD are extracted and fused into the Digital Package Twin.
5. Upload **Duplicate Image**:
   - Show that the system immediately flags: *"Duplicate image detected. Visually identical to Panel 2."* It prevents wasteful duplicate storage.
6. Click **Finalize & Generate Twin**:
   - The Digital Package Twin consolidates all 4 sides.
   - Click **Download Statutory PDF Report** to view the court-admissible audit certificate.

### Act II: Failure-First Quality Gate & Glare (60 seconds)
1. Select the **Blurry Image** or **Specular Glare** sample.
2. Observe that the system **refuses to guess**:
   - Error code: `RETAKE_IMAGE` or `REDUCE_GLARE`.
   - Clear tripartite contract displayed:
     - **What happened**: *"High specular glare detected on package surface."*
     - **Why**: *"Reflections wash out character contrast, violating legal audit standards."*
     - **What to do next**: *"Tilt the package away from direct light or turn off camera flash."*

### Act III: Inspector Queue & Case Triage (60 seconds)
1. Navigate to **Inspector Queue** (`/queue`).
2. Filter by `HIGH_PRIORITY`.
3. Open the **Dual MRP Conflict** case:
   - Highlight the Conflict Intelligence Card: displays Panel 1 (₹20) vs Panel 2 (₹25) side-by-side with bounding polygon evidence.
   - Show the Inspector Action Workspace:
     - The AI does **NOT** resolve cases automatically (Human-in-the-Loop invariant).
     - Select decision: `VIOLATION_CONFIRMED`.
     - Enter inspector note: *"Dual MRP sticker detected over statutory print."*
     - Click **Submit Resolution**.
   - Review the append-only audit trail logging the inspector's identity and timestamp.

---

## 4. Key Talking Points for Judges

| If the Judge Asks... | Deliver this Exact Technical Answer: |
|---|---|
| *"Why not just send the image to GPT-4o or Claude?"* | *"Cloud LLMs are stochastic and black-box. In Legal Metrology enforcement, every prosecution requires reproducible evidence. Our engine runs RapidOCR and deterministic rule checks locally with zero risk of prompt injection, zero network latency, and complete data privacy."* |
| *"What if a package declaration is genuinely missing?"* | *"Our system uses a two-stage state machine: fields are NOT_YET_OBSERVED during capture, and only become POSSIBLY_MISSING after the operator completes all panels. This eliminates false positive citations against legitimate manufacturers."* |
| *"How do you handle different packaging types and languages?"* | *"We support Latin and Devanagari scripts with transliteration fallback, parsing statutory Hindi declarations (e.g. 'शुद्ध मात्रा', 'अधिकतम खुदरा मूल्य'). Our food intelligence module additionally flags high sugar and common Indian allergens."* |
