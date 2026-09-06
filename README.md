# LABEL LENS AI

**Smart Packaged Commodity Compliance Assistant**

A compliance verification tool for inspecting packaged commodity labels against requirements under the **Legal Metrology Act, 2009** and the **Legal Metrology (Packaged Commodities) Rules, 2011**.

> **Smart India Hackathon · SIH26034 · All 5 Phases Complete**

---

## Project Overview

LABEL LENS AI enables inspectors and consumers to photograph or upload packaged commodity labels and verify compliance with mandatory declaration requirements — including product name, net quantity, MRP, manufacturer/packer details, batch numbers, manufacturing/expiry dates, and consumer care information.

### Phase Roadmap

| Phase | Scope | Status |
|-------|-------|--------|
| **Phase 1** | Foundation · UI · Upload · Backend · Database | ✅ Complete |
| **Phase 2** | Real OCR · Preprocessing · Information Extraction · Results UX | ✅ Complete |
| **Phase 3** | Configurable Compliance Rule Engine · Statutory Citations | ✅ Complete |
| **Phase 4** | Explainability · Interactive SVG Visual Evidence · Grounded Copilot | ✅ Complete |
| **Phase 5** | Official PDF Inspection Report · Capacitor Android Packaging · Hackathon Demo Readiness | ✅ Complete |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite 5 |
| Styling | Tailwind CSS v4 |
| Routing | React Router v6 |
| Icons | Heroicons v2 |
| Backend | Python 3.10+ · FastAPI 0.115 |
| OCR Engine | PaddleOCR (via RapidOCR PP-OCRv4 ONNX) |
| Preprocessing | OpenCV (`opencv-python-headless`) + NumPy |
| ORM | SQLAlchemy 2.0 |
| Database | SQLite (dev) → PostgreSQL (prod) |
| Server | Uvicorn with hot-reload |
| Android | Capacitor (architecture verified) |

---

## Core Workflow (Phase 2)

```
Image Upload (Camera / File)
      ↓
OpenCV Preprocessing (CLAHE, Bilateral Filter, Smart Resizing)
      ↓
PaddleOCR (Text, Bounding Boxes, Confidence Scores)
      ↓
Reading-Order Spatial Text Assembly
      ↓
Intelligent Deterministic Field Extraction (Zero-Hallucination)
      ↓
Structured Package Data Saved to Database
      ↓
Interactive Results Page (Details, Confidence Badges, OCR Evidence)
```

---

## Installation & Running Locally

### Prerequisites

- Node.js 18+
- Python 3.10+

### 1. Running the Backend

```bash
cd backend
python -m venv .venv

# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
python run.py
```

* Backend runs at: **http://localhost:8000**
* Interactive Swagger Docs: **http://localhost:8000/docs**

### 2. Running the Frontend

```bash
cd frontend
npm install
npm run dev
```

* Frontend runs at: **http://localhost:5173**
* Vite automatically proxies `/api` and `/health` requests to `http://localhost:8000`.

---

## API Endpoints

### 1. Health Check
* **`GET /health`**
* Returns status, version, and database connectivity.

### 2. Upload Image
* **`POST /api/upload`**
* Multipart image upload (`file` field). Validates type (JPEG, PNG, WebP, HEIC) and size (<=10 MB).
* Saves original image with UUID name to `uploads/`. Creates initial `Scan` database record.
* Returns `image_id`, `filename`, `upload_timestamp`.

### 3. Analyze Package Label
* **`POST /api/scans/{scan_id}/analyze`**
* Runs OpenCV preprocessing pipeline.
* Executes PaddleOCR engine to obtain text blocks, 4-point bounding boxes, and confidence.
* Runs intelligent field extraction (Product Name, MRP, Net Qty, Dates, Manufacturer/Packer, Consumer Care).
* Stores extracted results, raw OCR text, and line items in the database.
* Returns structured `AnalysisResponse`.

### 4. Run Compliance Validation
* **`POST /api/scans/{scan_id}/validate`**
* Evaluates extracted declarations against configured rules in `packaged_commodities_rules.json`.
* Generates declaration-level verdicts (`verified`, `manual_review`, `potential_issue`), explanations, and recommendations.
* Computes overall assessment (`information_verified`, `manual_review_recommended`, `potential_issues_detected`).
* Persists validation outcomes in the database and returns structured `ValidationResponse`.

### 5. Query Scan, Analysis & Compliance
* **`GET /api/scans/{scan_id}`**
* Retrieves scan status, image metadata, extraction results, and compliance validation details.

### 6. Retrieve Package Image
* **`GET /api/scans/{scan_id}/image`**
* Returns the uploaded image file directly with proper MIME type for frontend display.

---

## Phase 3 Features

### 1. Configurable Rules Architecture
* Rule definitions stored in `backend/app/rules/packaged_commodities_rules.json` — zero hardcoded scattered Python conditionals.
* Grounded in the **Legal Metrology (Packaged Commodities) Rules, 2011** (Rule 6).
* Configurable parameters: `rule_id`, `field`, `display_name`, `legal_reference`, `required`, `severity`, `validation_type`, `confidence_thresholds`, `recommendation_on_verified`, `recommendation_on_review`, `recommendation_on_issue`.
* Supports dynamic runtime ingestion and straightforward rule extension.

### 2. Explainable Rule Engine (`ComplianceService`)
* **Reusable Validation Handlers**:
  - `presence_and_confidence`: Generic presence and confidence check.
  - `net_quantity_format`: Verifies positive numeric value and metric standard unit conformance (`g`, `kg`, `ml`, `L`, `units`).
  - `mrp_format`: Validates positive retail price, INR currency, and checks for the mandatory "inclusive of all taxes" clause.
  - `manufacturer_format`: Validates manufacturer/packer name and address details, checking for 6-digit Indian PIN codes.
  - `dates_format`: Validates manufacturing date, packaging date, expiry date, best before, or batch numbers.
  - `consumer_care_format`: Validates grievance contact mechanisms (1800-xxx-xxxx toll-free, phone, or email).
* **Strict Legal Safety Terminology**:
  - Distinguishes "not detected from image" from "missing from package".
  - Distinguishes "automated verification" from "legal certification".
  - Never labels a package "illegal" or "definitely non-compliant".
  - Statuses:
    - 🟢 `VERIFIED`: "Verified from detected information"
    - 🟡 `MANUAL REVIEW REQUIRED`: "Requires manual verification"
    - 🔴 `POTENTIAL ISSUE`: "Could not be verified from uploaded image"

### 3. Declaration Review UI
* Prominent **Screening Result Banner** indicating overall status:
  - 🟢 **Information Verified**
  - 🟡 **Manual Review Recommended**
  - 🔴 **Potential Declaration Issues Detected**
  - Mandatory disclaimer: *"This assessment is based on automated analysis of the uploaded image and should be manually verified where required."*
* Summary counters: `X Verified`, `Y Require Review`, `Z Potential Issue`.
* Individual declaration review cards displaying:
  - Status badge (🟢 / 🟡 / 🔴)
  - Statutory rule citation
  - Detected value
  - "Why this status was given" (Explanation)
  - "What should the user do next" (Actionable recommendation)
  - Collapsible detection evidence snippet

---

## Testing Verification

Automated test suites:
* `tests/test_phase3_compliance.py`:
  - Scenario 1 (Strong Detection): All 6 declarations verified -> `INFORMATION_VERIFIED` -> **PASS**.
  - Scenario 2 (Low/Moderate Confidence): Flags items for manual review -> `MANUAL_REVIEW_RECOMMENDED` -> **PASS**.
  - Scenario 3 (Missing Detection on Single Panel): Non-detected mandatory fields flagged for `MANUAL_REVIEW` with physical verification guidance -> **PASS**.
  - Scenario 4 (Invalid Format): True structural defect (negative MRP) flagged as `POTENTIAL_ISSUE`, non-standard unit for `MANUAL_REVIEW` -> **PASS**.
  - Scenario 5 (Full Workflow via Live API): Upload -> Analyze -> Validate -> Query -> **PASS**.
* `tests/test_phase2_ocr.py`: OCR multi-scenario suite -> **PASS**.
* `tests/test_phase4_evidence.py`: Bounding box normalization and visual evidence mapping -> **PASS**.
* `tests/test_phase5_report.py`: Official PDF inspection report generation and styling -> **PASS**.
* `tests/test_eligibility_and_redesign.py`: Package eligibility gate, zero-hallucination non-package rejection (certificates, institutional documents, random images), and sequential scan isolation -> **PASS**.
* Frontend: TypeScript compiled with 0 errors (`tsc -b`), Vite production build completed.

---

---

## Phase 4 Architecture: Explainable Visual Evidence & Compliance Copilot

Phase 4 brings explainability and visual grounding to LABEL LENS AI:

```
┌─────────────────────────────────────────────────────────────┐
│                    Package Label Image                      │
│            + Interactive SVG Bounding Box Layer             │
└──────────────────────────────┬──────────────────────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
┌──────────────────────────────┐    ┌──────────────────────────────┐
│       Evidence Service       │    │     Compliance Copilot       │
│  • Field-to-box mapping      │    │  • 100% Grounded responses   │
│  • Normalized % coordinates  │    │  • Zero paid LLM APIs        │
│  • Multi-block aggregation   │    │  • Predefined inquiry chips  │
│  • Honest unmapped fallback  │    │  • Visual shortcut links     │
└──────────────┬───────────────┘    └──────────────┬───────────────┘
               │                                   │
               ▼                                   ▼
┌──────────────────────────────┐    ┌──────────────────────────────┐
│  GET /api/scans/{id}/evidence│    │ POST /api/scans/{id}/copilot │
└──────────────────────────────┘    └──────────────────────────────┘
```

### Visual Evidence Features:
* **Real OCR Bounding Boxes**: Highlights exact detection regions on the package without fabricated coordinates.
* **Proportional Scaling**: Coordinates normalized to percentage values (`0%` to `100%`), ensuring pixel-perfect overlays across mobile screens and desktop monitors.
* **Multi-Block Mapping**: Aggregates multi-line declarations (e.g. Manufacturer name + address + PIN, or Mfg date + Expiry + Batch).
* **Honest Fallback**: When visual evidence cannot be mapped, reports: *"Visual evidence could not be confidently mapped for this declaration."*
* **Inspect All Blocks**: Toggle button to view all OCR text boxes detected across the packaging label.
* **Interactive Linking**:
  - Clicking any declaration card highlights its bounding box on the image.
  - Clicking a bounding box on the image selects that declaration.

### AI Compliance Copilot:
* **Grounded Screening Intelligence**: Operates offline, citing verified declarations, OCR confidence, and statutory rules.
* **Predefined Intent Chips**:
  - `WHY_REVIEW`: Explains reasons for moderate confidence or formatting ambiguity.
  - `SHOW_DETECTED_INFORMATION`: Summarizes all verified and detected package attributes.
  - `SHOW_POTENTIAL_ISSUES`: Identifies declarations that could not be verified on the image.
  - `WHAT_TO_CHECK_MANUALLY`: Prioritized checklist for physical inspection.
* **Visual Evidence Shortcuts**: Copilot answers link directly to `[ Highlight on Package ]` buttons.

---

## Phase 5: Official Inspection Report, Android Packaging & Hackathon Demo

Phase 5 finalizes LABEL LENS AI into a complete, presentation-ready product:

```
┌─────────────────────────────────────────────────────────────┐
│                       Final Product                         │
│   Package Image → OCR → Extraction → Review → Evidence      │
└──────────────────────────────┬──────────────────────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
┌──────────────────────────────┐    ┌──────────────────────────────┐
│     Report Generation        │    │     Android Packaging        │
│  • ReportLab pure-Python PDF │    │  • Capacitor native bridge   │
│  • High-density layout       │    │  • Camera & storage access   │
│  • Embedded label thumbnail  │    │  • Mobile emulator fallback  │
│  • Inspector sign-off block  │    │  • docs/android-packaging.md │
└──────────────┬───────────────┘    └──────────────────────────────┘
               │
               ▼
┌──────────────────────────────┐
│  GET /api/scans/{id}/report  │
└──────────────────────────────┘
```

### Key Deliverables:
1. **Official Inspection Report (PDF)**:
   - High-density, professional formatting generated via `services/report_service.py`.
   - Complete scan metadata, package thumbnail, overall assessment, and statutory disclaimer.
   - Summary statistics table and item-by-item Rule 6 review findings with OCR evidence snippets.
   - Official field inspector physical audit sign-off block with action-taken check boxes.
   - Two-pass `NumberedCanvas` generating authoritative `Page X of Y` footers.
2. **Capacitor Android Packaging**:
   - Native Android Studio project generated in `frontend/android/`.
   - Web distribution bundled and synced.
   - Camera and media permissions configured in `AndroidManifest.xml`.
   - Comprehensive packaging guide: `docs/android-packaging.md`.
3. **Smart India Hackathon Demo Guide**:
   - 2–3 minute judging presentation flow: `docs/hackathon-demo-guide.md`.
   - Recommended real packaged commodity test samples (Tata Tea, biscuits, dairy).
   - Defense cheat sheet for judge Q&A.

---

## Complete Test Verification

All phases have automated test suites:
* `tests/test_phase5_report.py`:
  - Test 1 (Direct PDF Generation): Valid bytes, `%PDF-` header -> **PASS**.
  - Test 2 (Long OCR Content & Unicode Safety): Special characters and multi-line text handled without layout overflow -> **PASS**.
  - Test 3 (Image Embedding): Scaled thumbnail embedding and missing-image fallback -> **PASS**.
  - Test 4 (Live API Report Download): `GET /api/scans/{id}/report` HTTP 200, Content-Type `application/pdf`, valid attachment header -> **PASS**.
  - Test 5 (API Error Handling): 404 on missing scan -> **PASS**.
* `tests/test_phase4_evidence.py`: 6 visual evidence and Copilot tests -> **PASS**.
* `tests/test_phase3_compliance.py`: 5 statutory compliance scenarios -> **PASS**.
* `tests/test_phase2_ocr.py`: Multi-scenario OCR and zero-hallucination tests -> **PASS**.
* Frontend: `tsc -b` and `vite build` completed with **0 errors and 0 warnings**.

---

## How to Run the Application

### 1. Backend (FastAPI)
```bash
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
python run.py
```
Backend runs at `http://localhost:8000`. Interactive API docs at `http://localhost:8000/docs`.

### 2. Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at `http://localhost:5173`.

### 3. Running All Tests
```bash
cd backend
.\.venv\Scripts\python.exe tests/test_phase2_ocr.py
.\.venv\Scripts\python.exe tests/test_phase3_compliance.py
.\.venv\Scripts\python.exe tests/test_phase4_evidence.py
.\.venv\Scripts\python.exe tests/test_phase5_report.py
```


