# LABEL LENS AI — SECURITY & PRIVACY SPECIFICATION
**Security Hardening, Defensive Controls & Data Sovereignty Audit**  
**Document Version**: `1.0.0-production` | **Compliance**: ISO/IEC 27001, Indian DPDP Act 2023 Principles

---

## 1. Threat Model & Defensive Measures

| Threat Vector | Attack Scenario | Defensive Countermeasure Implemented | Verification Test |
|---|---|---|---|
| **MIME Spoofing** | Attacker uploads executable or PHP script masked with `.jpg` extension | Binary magic byte signature inspection (`\xff\xd8\xff`, `\x89PNG`, `RIFF...WEBP`) before disk write. Rejects with `415 UNSUPPORTED_FILE`. | `test_magic_byte_mime_spoofing_rejected` |
| **Decompression Bomb (DoS)** | Attacker uploads small 10KB file that unpacks into a 10-gigapixel memory exhaustion payload | Strict bounding of Pillow's decompression ceiling to `Image.MAX_IMAGE_PIXELS = 50_000_000` (50MP). Rejects immediately. | `test_decompression_bomb_limit_active` |
| **Path Traversal** | Attacker provides filename `../../../../etc/passwd` to overwrite arbitrary server files | Filename sanitized using `os.path.basename` and stripped of `..`, `/`, `\`. Destination strictly asserted: `file_path.resolve().is_relative_to(upload_dir.resolve())`. | `test_filename_sanitization` |
| **Clickjacking / Framing** | Malicious iframe embeds the Inspector Queue to induce unintended regulatory dismissals | `SecurityHeadersMiddleware` injects `X-Frame-Options: DENY` on all HTTP responses. | `test_security_headers_present_in_response` |
| **MIME Sniffing** | Browser interprets uploaded binary data as executable script | `X-Content-Type-Options: nosniff` enforced globally. | `test_security_headers_present_in_response` |
| **Sensitive Data Leakage in Logs** | Auth tokens, passwords, or personal PII logged in plain-text server stdout | `SafeLoggingMiddleware` filters out `Authorization`, `Cookie`, and `X-API-Key` headers; logs only request ID and timing. | `test_logging_middleware_attaches_request_id_and_timing` |
| **Unbounded File Flooding** | Attacker uploads 500MB raw video to crash disk | Strict 15MB file size limit enforced prior to stream ingestion: `file_size > 15 * 1024 * 1024` raises `413 IMAGE_TOO_LARGE`. | Automated image service guard |

---

## 2. Magic Byte Verification Specifications

File extension checks are inherently vulnerable to spoofing. LABEL LENS AI inspects raw binary headers:

```python
# app/services/image_service.py
def validate_magic_bytes(content: bytes, declared_type: str) -> bool:
    if declared_type in ("image/jpeg", "image/jpg"):
        return content.startswith(b"\xff\xd8\xff")
    elif declared_type == "image/png":
        return content.startswith(b"\x89PNG\r\n\x1a\n")
    elif declared_type == "image/webp":
        return content.startswith(b"RIFF") and len(content) >= 12 and content[8:12] == b"WEBP"
    elif declared_type in ("image/heic", "image/heif"):
        if len(content) >= 12:
            brand = content[8:12]
            return brand in (b"ftyp", b"heic", b"heix", b"hevc", b"mif1")
    return False
```

---

## 3. Privacy & Right-to-be-Forgotten Implementation

Under the **Digital Personal Data Protection (DPDP) Act 2023**, users and manufacturers have the right to request physical and digital erasure of processed images and associated audit logs.

### 1. Endpoints
- `DELETE /api/scans/{scan_id}`: Permanently removes the scan row and invokes `Path(file_path).unlink()` to delete the raw image bytes from storage.
- `DELETE /api/package-sessions/{session_id}`: Cascades through all associated `SessionPanel` records, permanently deletes their underlying image files from disk, disassociates linked triage cases, and removes the session record.

### 2. Local Storage Sovereignty
- Consumer profiles (allergies, diabetic watch, language choice) are stored exclusively in client `localStorage` (`label_lens_consumer_profile`).
- No profile data is ever synchronized to or stored on remote servers.
- A "Purge Local Cache" button is directly accessible from the navigation bar.

---

## 4. Offline Resilience & Zero-Simulation Policy

In accordance with strict Legal Metrology evidentiary standards:
- **No Simulated Verification**: When an external registry (such as a remote FSSAI or GS1 database) cannot be reached, the system strictly reports `SOURCE UNAVAILABLE`.
- **Zero Hallucination Guarantee**: The system never generates fake verification stamps, synthetic license validations, or assumed compliance. Missing evidence remains `INSUFFICIENT_EVIDENCE` or `NOT_YET_OBSERVED`.
