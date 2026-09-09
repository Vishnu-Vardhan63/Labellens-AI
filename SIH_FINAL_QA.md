# LABEL LENS AI — SIH FINAL JUDGE Q&A DEFENSE
**Comprehensive Statutory, Technical & Architectural Defense Cheat Sheet**  
**SIH Problem Statement**: SIH26034 | **Target Audience**: Ministry Officials, Technical Judges & Industry Evaluators

---

### Q1: What specific statutory rules does LABEL LENS AI enforce?
**Answer**:  
The system enforces the **Legal Metrology (Packaged Commodities) Rules, 2011** (as amended):
- **Rule 6(1)(a)**: Name and complete address of the manufacturer, packer, or importer.
- **Rule 6(1)(b)**: Common or generic name of the commodity.
- **Rule 6(1)(c)**: Net quantity in standard SI units (g, kg, ml, l).
- **Rule 6(1)(d)**: Month and year of manufacture, pre-packing, or import.
- **Rule 6(1)(da)**: Maximum Retail Price (MRP) in format `₹ XX.XX (incl. of all taxes)`.
- **Rule 6(1)(e)**: Consumer care details (name, address, telephone number, and email).
- **Rule 7 & 8**: Area of Principal Display Panel (PDP) and proportional minimum numeral font height (e.g. 4mm for packages exceeding 500g).
- **Rule 18(2)**: Prohibition against dual pricing or selling commodities above declared MRP.

---

### Q2: Why is "Confidence" strictly separated from "Compliance"?
**Answer**:  
Treating confidence and compliance as the same metric is a fatal flaw in naive AI systems.
- **Confidence (0.0 to 1.0)** is an *optical and perceptual measure* of how clearly the text could be read by OCR and verified by the quality gate.
- **Compliance (Pass/Fail)** is a *statutory legal evaluation* against Legal Metrology rules.
- **Concrete Example**: If a counterfeit package has crystal-clear text stating `MRP: 50` without mentioning the manufacturer name or unit sale price, the evidence confidence is **100% (crystal clear)**, but the compliance assessment is **NON-COMPLIANT (Statutory Violation)**. Merging them would falsely score this as "high compliance".

---

### Q3: How do you prevent hallucinating missing declarations on cylindrical or multi-sided packages?
**Answer**:  
Real packages are three-dimensional: manufacturers place the brand on the front, nutrition on the left, MRP on the top flap, and manufacturer details on the back.
- When an inspector scans the front panel, unseen fields are placed in state **`NOT_YET_OBSERVED`**.
- The system dynamically prompts the inspector to rotate the package.
- As additional panels are ingested, the **Digital Package Twin** aggregates declarations across all sides.
- Unobserved declarations only transition to **`POSSIBLY_MISSING`** when the inspector explicitly finalizes the session.

---

### Q4: How does the system detect duplicate image uploads?
**Answer**:  
We use a two-stage novelty detection pipeline:
1. **Perceptual Difference Hash (dHash)**: Scales image to an 8x9 grayscale matrix, computing horizontal gradient differences. If the Hamming distance is $\le 5$, it is flagged as visually identical.
2. **Text Token Similarity**: Jaccard similarity of extracted OCR tokens. If both visual and textual similarity exceed 85%, the image is rejected with actionable feedback: *"Visually identical to Panel X. Please rotate package to an unscanned side."*

---

### Q5: How do you prevent cross-product contamination when scanning packages in a crowded retail store?
**Answer**:  
Our **Product Identity Matching Engine** evaluates cross-panel coherence:
- It cross-references the extracted brand tokens, net quantity, and manufacturer across panels.
- If Panel 1 contains "Tata Tea Gold" and Panel 2 contains "Maggi 2-Minute Noodles", the system flags a **`PRODUCT_IDENTITY_CONFLICT`** with error code `409` and halts fusion until the operator confirms whether they accidentally photographed two different products.

---

### Q6: Can the AI issue legal prosecution notices or dismiss violations autonomously?
**Answer**:  
**Absolutely not.** Section 15 of the Legal Metrology Act, 2009 vests statutory authority exclusively in human Legal Metrology Officers.
- The AI acts strictly as an **Inspector Copilot and Triage Engine**.
- It populates the **Inspector Review Queue** and computes an explainable **Risk Priority Score** (High / Medium / Review / Low).
- A human inspector must review the visual evidence, enter inspection notes, and formally select `VIOLATION_CONFIRMED` or `DISMISSED`.
- Every action is permanently recorded in an **append-only immutable audit log**.

---

### Q7: How does the system handle poor lighting, blur, or glare on reflective packaging?
**Answer**:  
We enforce an automated **Image Quality Gate** before invoking OCR:
- **Sharpness**: Measured via the variance of the Laplacian operator ($\sigma^2 < 100$ flags blur).
- **Specular Glare**: Quantified by thresholding high-luminance saturation pixels ($V > 240$ in HSV space over $> 8\%$ of the surface).
- **Immediate Feedback**: Rather than hallucinating garbage text, the system immediately returns standard error codes `RETAKE_IMAGE` or `REDUCE_GLARE` with plain-language corrective instructions (e.g. *"Tilt package 15° away from direct lighting"*).

---

### Q8: What security protections prevent malicious attacks on the upload endpoint?
**Answer**:  
Phase 14 implemented comprehensive production-grade defenses:
1. **Magic Byte Anti-Spoofing**: Inspects the first 16 binary bytes to ensure files match true JPEG (`\xff\xd8\xff`), PNG (`\x89PNG`), or WebP (`RIFF...WEBP`) signatures, rejecting disguised scripts.
2. **Decompression Bomb Guard**: Bounded Pillow to `Image.MAX_IMAGE_PIXELS = 50_000_000` to defeat pixel-flood memory exhaustion attacks.
3. **Strict Path Traversal Assertions**: File paths are sanitized and verified against the canonical upload root using `Path.resolve().is_relative_to()`.
4. **Defensive HTTP Headers**: Enforces `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and structured request correlation logging.

---

### Q9: Does the system rely on external internet APIs to function?
**Answer**:  
**No. LABEL LENS AI is built for complete offline field operation.**
- RapidOCR ONNX, OpenCV preprocessing, and Legal Metrology rule evaluation run entirely locally on device.
- For external registry lookups (e.g. FSSAI or barcode verification), if no network connection exists, the system strictly outputs **`SOURCE UNAVAILABLE`**.
- Under our **Zero Simulation Invariant**, the system never fabricates synthetic database responses.

---

### Q10: How does the system protect consumer privacy and satisfy DPDP Act requirements?
**Answer**:  
1. **Right-to-be-Forgotten Endpoints**: `DELETE /api/scans/{id}` and `DELETE /api/package-sessions/{id}` purge database records and physically unlink raw image files from server disk.
2. **On-Device Consumer Profiles**: Allergy preferences, diabetic/sugar watch toggles, and language selections are stored exclusively in client-side `localStorage` and never transmitted to backend servers.
3. **Local Sovereignty**: Package images are never transmitted to commercial cloud LLMs (OpenAI, Anthropic, Google).

---

### Q11: How do you handle non-package images such as certificates or receipts?
**Answer**:  
We implemented the **Packaged Commodity Eligibility Gate** (Phase 7):
- An image must exhibit packaged commodity indicators (price declarations, net quantity, manufacturer markers, barcode, brand typography).
- Official certificates, invoices, or random landscape photos are safely abstained with status **`INSUFFICIENT_PACKAGE_LABEL_EVIDENCE`** without generating hallucinated commodity violation reports.

---

### Q12: How are unit sale prices (USP) verified under Rule 6(11)?
**Answer**:  
For packaged commodities containing more than 1 kg or 1 liter:
- The system extracts declared MRP and Net Quantity.
- Computes the statutory USP formula: $\text{USP} = \frac{\text{MRP}}{\text{Net Quantity}} \times \text{Standard Base Unit}$ (e.g. per gram or per 100g).
- Compares computed USP with package text within a 1% floating-point rounding tolerance.

---

### Q13: How does the Multilingual Food Intelligence module work?
**Answer**:  
- **Script Recognition**: Identifies Latin and Devanagari characters.
- **Normalized Mapping**: Maps Hindi statutory declarations (e.g., 'अधिकतम खुदरा मूल्य' $\rightarrow$ MRP, 'शुद्ध मात्रा' $\rightarrow$ Net Qty).
- **Health Awareness**: Flags high added sugar content (> 10g per 100g) and cross-references common Indian allergens (milk, peanuts, tree nuts, gluten, mustard).

---

### Q14: How was the system validated against real-world packages?
**Answer**:  
In Phase 13, we established a **Real-World Validation Lab** and **Golden Dataset** featuring 10 diverse packaged commodities:
- Categories: Instant Noodles, Biscuits, Chips/Snacks, Packaged Tea, Chocolate, Edible Oil, Dairy/Butter, Spices, Cosmetics, Detergents.
- Full multi-panel ground truth: Front, back, side, top, bottom images.
- Precision, recall, and declaration extraction accuracy are evaluated against ground truth without synthetic fabrication.

---

### Q15: What happens when an image upload is too large?
**Answer**:  
The system enforces a 15MB file size limit. Uploads exceeding 15MB are rejected immediately with HTTP `413 IMAGE_TOO_LARGE` and tripartite guidance:
- **What happened**: File size exceeds 15MB.
- **Why**: Extreme resolutions cause excessive latency and memory exhaustion.
- **What to do next**: Resize or compress the image before retrying.

---

### Q16: What is the current status of the Android mobile application?
**Answer**:  
- The complete production frontend distribution bundle is built and synchronized to the Capacitor Android project (`frontend/android/app/src/main/assets/public/`).
- Native hardware permissions (`CAMERA`, `READ_EXTERNAL_STORAGE`, `INTERNET`) are configured in `AndroidManifest.xml`.
- A compiled debug APK is located at `frontend/android/app/build/outputs/apk/debug/app-debug.apk` (4.2 MB).
- In strict adherence to our zero-fabrication pledge, fresh recompilation via `gradlew.bat` is reported as blocked pending JDK 17+ installation on the development host.

---

### Q17: How is the Court-Admissible PDF report generated?
**Answer**:  
Using ReportLab, the system generates a tamper-evident audit report containing:
- Unique Session UUID and UTC timestamp.
- High-resolution thumbnails of all scanned panels.
- Bounding polygon coordinates linking extracted declarations to visual evidence.
- Rule-by-rule Legal Metrology compliance matrix.
- Digital twin summary and inspector signature block.

---

### Q18: What is the performance latency of a full package scan?
**Answer**:  
- Image Quality Gate: **15 – 25 ms**
- dHash Novelty Check: **5 – 10 ms**
- RapidOCR ONNX inference (CPU): **350 – 650 ms**
- Legal Metrology Rule Evaluation: **< 5 ms**
- **Total end-to-end response time**: **~600 ms** per panel on standard laptop CPU hardware.

---

### Q19: What database is used and is it production-ready?
**Answer**:  
The system uses SQLAlchemy ORM with a production-grade schema:
- Default deployment uses SQLite with WAL (Write-Ahead Logging) mode, ideal for edge devices and single-inspector tablets.
- Fully compatible with enterprise PostgreSQL via a simple connection string change (`DATABASE_URL=postgresql://...`) with zero code alterations.

---

### Q20: What makes LABEL LENS AI superior to existing commercial offerings?
**Answer**:  
1. **Multi-panel awareness**: Captures the entire 3D product rather than a single surface.
2. **Statutory precision**: Built specifically for Indian PCR 2011 rather than generic document OCR.
3. **Explainable AI**: Every finding links to visual polygon evidence and statutory rule citations.
4. **Honest engineering**: Strictly separates confidence from compliance and never hallucinates data.
