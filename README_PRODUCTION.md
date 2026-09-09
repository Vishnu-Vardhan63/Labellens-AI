# LABEL LENS AI — PRODUCTION OPERATOR MANUAL
**Problem Statement SIH26034**: AI-Assisted Smart Packaged Commodity Compliance, Food Intelligence & Inspector Triage System  
**Version**: `1.0.0-production` | **Status**: Verified Production Release (Phases 1–14)

---

## 1. Executive Summary

**LABEL LENS AI** is an end-to-end, multi-panel package intelligence and statutory compliance platform built for the **Legal Metrology Department** and conscious Indian consumers. 

Unlike generic OCR wrappers or black-box LLMs that hallucinate package contents, LABEL LENS AI operates on **strict evidentiary principles**:
1. **Separation of Concerns**: Evidence Reliability (Confidence), Statutory Rule Compliance (Legal Metrology), and Operational Triage (Priority) are three separate, non-fungible metrics.
2. **Deterministic Statutory Verification**: Indian Legal Metrology (Packaged Commodities) Rules 2011 (Rules 6, 7, 8, 9, 10, 18) are verified deterministically without LLM ambiguity.
3. **Multi-Panel Digital Package Twin**: Fuses front, back, side, top, and bottom panels into an immutable digital twin with dHash novelty deduplication and visual polygon source provenance.
4. **Offline Resilience & Data Sovereignty**: All neural inference (RapidOCR ONNX, OpenCV, heuristics) executes locally with zero data transfer to third-party generative clouds and zero simulated verifications.

---

## 2. System Prerequisites & Dependencies

| Layer | Component | Supported Versions | Notes |
|---|---|---|---|
| **OS** | Windows 10/11, Linux (Ubuntu 22.04+), macOS | x86_64 / ARM64 | Cross-platform Python & Node environment |
| **Backend Runtime** | Python | 3.10 – 3.14 (3.14.0 verified) | Async FastAPI + SQLAlchemy + Uvicorn |
| **Frontend Runtime** | Node.js | v20.18.0+ | Vite 5 + React 18 + Tailwind CSS |
| **Computer Vision** | OpenCV + RapidOCR ONNX | OpenCV 4.10+, RapidOCR 1.3+ | Embedded ONNX model; no GPU required |
| **Mobile Runtime** | Capacitor Android | 6.0+ | Native webview wrapper; requires JDK 17+ for Gradle builds |

---

## 3. Quick Start: Local Production Mode

### Step 1: Start the Backend Server
```powershell
# Set Python path and launch Uvicorn on port 8000
$env:PYTHONPATH="C:\SIH\vishnu\vishnu\backend;C:\SIH\vishnu\vishnu\backend\.venv\Lib\site-packages;C:\Users\kotes\AppData\Roaming\Python\Python314\site-packages"
& "C:\Program Files\Python314\python.exe" -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```
Backend API will be accessible at:
- **Root / Health**: `http://localhost:8000/api/health`
- **System Audit Status**: `http://localhost:8000/api/system/status`
- **Interactive Swagger Docs**: `http://localhost:8000/docs`

### Step 2: Start or Build the Frontend
```powershell
# In a separate terminal
$env:PATH = "c:\SIH\vishnu\vishnu\_tools\node-v20.18.0-win-x64;" + $env:PATH
cd frontend
npm run build      # Generates optimized static bundle in frontend/dist
npm run preview    # Or run vite dev server via: npm run dev
```
Frontend Web Application: `http://localhost:5173`

---

## 4. Subsystem Verification & Health Audit

LABEL LENS AI provides an automated subsystem probe at `GET /api/system/status`.

```json
{
  "overall_status": "READY",
  "app_version": "1.0.0",
  "subsystems": {
    "backend": { "status": "READY", "description": "FastAPI async application core, middlewares, and CORS." },
    "database": { "status": "READY", "description": "SQLAlchemy SQLite database connectivity established." },
    "ocr": { "status": "READY", "description": "RapidOCR ONNX model initialized for local neural inference." },
    "smart_scan": { "status": "READY", "description": "Image quality gate, glare detection, and dHash novelty engine active." },
    "digital_package_twin": { "status": "READY", "description": "Multi-panel evidence fusion, field confidence, and PDF report generator active." },
    "legal_metrology": { "status": "READY", "description": "PCR 2011 statutory rules, font-size verification, and unit checks active." },
    "food_intelligence": { "status": "READY", "description": "Ingredient parsing, sugar/sodium awareness, allergen & FSSAI lookup active." },
    "confidence_engine": { "status": "READY", "description": "Multi-factor reliability scoring and strict confidence/compliance separation active." },
    "risk_engine": { "status": "READY", "description": "Triage severity scoring, consumer harm weighting, and priority sorting active." },
    "inspector_queue": { "status": "READY", "description": "Case workflow management, inspector notes, and append-only audit trail active." },
    "judge_mode": { "status": "READY", "description": "10 real-world commodity packages, golden dataset evaluation, and metrics active." },
    "demo_mode": { "status": "READY", "description": "Reproducible judge scenarios (Tata Tea, Maggi, glare, conflict) loaded." }
  },
  "security": {
    "magic_byte_validation": "ACTIVE",
    "decompression_bomb_guard": "ACTIVE (50MP max)",
    "max_upload_size": "15 MB",
    "path_traversal_prevention": "ACTIVE",
    "security_headers": "ACTIVE"
  },
  "privacy": {
    "local_storage_mode": "ACTIVE",
    "data_purge_endpoints": ["DELETE /api/scans/{id}", "DELETE /api/package-sessions/{id}"],
    "cloud_persistence": "OPTIONAL / DISABLED_BY_DEFAULT"
  },
  "offline_resilience": {
    "simulated_verification": "DISABLED (Strict zero-simulation policy)",
    "fallback_behavior": "SOURCE UNAVAILABLE"
  }
}
```

---

## 5. Key Production Endpoints Reference

| Endpoint | Method | Purpose | Input / Notes |
|---|---|---|---|
| `/api/system/status` | GET | Comprehensive 12-subsystem health & security audit | Returns subsystem status (`READY`/`WARNING`/`BLOCKER`) |
| `/api/package-sessions` | POST | Initialize autonomous multi-panel Smart Scan session | Returns unique `session_id` |
| `/api/package-sessions/{id}/images` | POST | Ingest camera panel; runs quality gate, novelty, & OCR | Form-data `file` (JPEG, PNG, WebP) |
| `/api/package-sessions/{id}/twin` | GET | Retrieve multi-panel Digital Package Twin | Aggregated declarations & conflict detections |
| `/api/package-sessions/{id}/pdf` | GET | Download court-admissible Legal Metrology Audit PDF | Formatted with visual evidence and rule checklist |
| `/api/package-sessions/{id}` | DELETE | GDPR/Right-to-be-Forgotten: Purge session, panels, & files | Physical unlinking + DB purge |
| `/api/scans/{id}` | DELETE | Purge single scan record and image file from disk | Privacy purge |
| `/api/cases` | GET | Triage inspection queue sorted by severity & risk | High / Medium / Review / Low Priority |
| `/api/cases/{id}/resolve` | POST | Human Legal Metrology Inspector formal decision | Violation Confirmed / Dismissed / Escalated |
| `/api/validation-lab/packages` | GET | SIH Golden Dataset of 10 real commodity packages | Front, back, side panels with ground truth |

---

## 6. Running Automated Regression Suites

All 9 test suites across Phases 1–14 are verified passing:

```powershell
$env:PYTHONPATH="C:\SIH\vishnu\vishnu\backend;C:\SIH\vishnu\vishnu\backend\.venv\Lib\site-packages;C:\Users\kotes\AppData\Roaming\Python\Python314\site-packages"

# 1. Phase 14 Production Hardening & Security
& "C:\Program Files\Python314\python.exe" -m unittest tests/test_phase14_production_hardening.py

# 2. Phase 13 Real-World Lab & Golden Dataset
& "C:\Program Files\Python314\python.exe" -m unittest tests/test_phase13_real_world_validation.py
& "C:\Program Files\Python314\python.exe" -m unittest tests/test_golden_packages.py

# 3. Phase 12 Field Validation & Explainability
& "C:\Program Files\Python314\python.exe" -m unittest tests/test_phase12_field_validation.py

# 4. Phase 11 Multilingual Food Intelligence
& "C:\Program Files\Python314\python.exe" -m unittest tests/test_phase11_food_intelligence.py

# 5. Phase 10 Risk Engine & Case Management
& "C:\Program Files\Python314\python.exe" -m unittest tests/test_phase10_risk_intelligence.py

# 6. Phase 9 Confidence & Smart Abstention
& "C:\Program Files\Python314\python.exe" -m unittest tests/test_phase9_confidence.py

# 7. Phase 7 Multi-Panel Smart Scan
& "C:\Program Files\Python314\python.exe" tests/test_phase7_smart_scan.py

# 8. Package Eligibility & Core Compliance
& "C:\Program Files\Python314\python.exe" tests/test_eligibility_and_redesign.py
```

---

## 7. Android Application Status

- **Web Assets**: Synchronized to `frontend/android/app/src/main/assets/public/` (Vite production bundle, 427KB JS, 64KB CSS).
- **Permissions**: `CAMERA`, `READ_MEDIA_IMAGES`, `READ_EXTERNAL_STORAGE`, `INTERNET` declared in `AndroidManifest.xml`.
- **Pre-Built Debug APK**: Available at `frontend/android/app/build/outputs/apk/debug/app-debug.apk` (4.2 MB).
- **Gradle Recompilation Note**: Fresh recompilation via `gradlew.bat` requires **JDK 17+** with `JAVA_HOME` configured on the building host machine.
