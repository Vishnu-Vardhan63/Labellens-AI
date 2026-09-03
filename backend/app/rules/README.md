# Configurable Compliance Rule System

This directory contains the rule definitions used by the **LABEL LENS AI** Compliance Service to evaluate packaged commodity declarations.

---

## 1. Rule Architecture

Rules are declared in structured JSON (`packaged_commodities_rules.json`), separating regulatory criteria from application logic. This guarantees that:
- Rules can be updated, extended, or customized for different commodity categories without recompiling Python code.
- Every rule is tied to a specific section of the **Legal Metrology (Packaged Commodities) Rules, 2011**.
- Rule outcomes are deterministic and explainable.

---

## 2. Rule Schema

Each rule object contains the following attributes:

| Field | Type | Description |
|---|---|---|
| `rule_id` | `string` | Unique identifier (e.g. `DECLARATION_MRP_001`) |
| `field` | `string` | Field key in `extracted_fields` (`mrp`, `net_quantity`, etc.) |
| `display_name` | `string` | Human-friendly title shown in inspector reviews |
| `legal_reference` | `string` | Rule reference under Legal Metrology Act / PC Rules |
| `required` | `boolean` | Whether declaration is mandatory under standard conditions |
| `severity` | `string` | `"high"`, `"medium"`, or `"low"` (affects overall assessment) |
| `validation_type` | `string` | Strategy handler in `ComplianceService` |
| `description` | `string` | Plain-language statutory requirement description |
| `confidence_thresholds` | `object` | `{ "verified_min": 0.80, "review_min": 0.50 }` |
| `recommendation_on_verified` | `string` | Guidance when verified |
| `recommendation_on_review` | `string` | Actionable recommendation when manual review is needed |
| `recommendation_on_issue` | `string` | Actionable recommendation when a potential issue is detected |

---

## 3. Supported Validation Types

1. **`presence_and_confidence`**:
   - Used for generic fields such as `product_name`.
   - Checks if the field was detected and whether OCR confidence >= `verified_min`.
2. **`net_quantity_format`**:
   - Checks numeric value existence, positive magnitude (> 0), and validates the unit against standard metric measurement categories (`g`, `kg`, `ml`, `L`, `units`).
3. **`mrp_format`**:
   - Checks positive retail price value, valid currency (`INR`), and verifies whether the mandatory "inclusive of all taxes" clause was detected. If MRP is detected without tax-inclusive phrasing, flags for **Manual Review** rather than outright violation.
4. **`manufacturer_format`**:
   - Validates organization name, address string length, and searches for 6-digit Indian postal PIN codes.
5. **`dates_format`**:
   - Validates presence of manufacturing date, packaging date, expiry date, best before period, or batch number.
6. **`consumer_care_format`**:
   - Validates presence of telephone helpline (especially 1800-xxx-xxxx toll-free), mobile contact, or support email.

---

## 4. Status Evaluation Matrix

| Condition | Status | Tone / Terminology |
|---|---|---|
| Required field detected, confidence >= `verified_min`, structural checks pass | 🟢 `verified` | *"Verified from detected information"* |
| Field detected with confidence between `review_min` and `verified_min`, or formatting is ambiguous | 🟡 `manual_review` | *"Manual review required"* |
| Required declaration not detected from image, or clear structural failure (e.g. non-positive price) | 🔴 `potential_issue` | *"Potential declaration issue detected — could not be verified from uploaded image"* |

---

## 5. How to Add a New Rule

1. Open `packaged_commodities_rules.json`.
2. Append a new rule object to the `"rules"` array with a unique `rule_id`.
3. Specify the corresponding `field` in the extraction payload and the target `validation_type`.
4. Define clear `recommendation_on_review` and `recommendation_on_issue` strings.
5. Restart or reload the backend service. The rule engine automatically ingests all rules dynamically on evaluation.
