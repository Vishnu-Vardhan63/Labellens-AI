export type ConfidenceLevel = 'high' | 'moderate' | 'low' | 'not_detected';

export interface ExtractedProduct {
  detected: boolean;
  value: string | null;
  raw_text: string | null;
  confidence: number;
  confidence_level: ConfidenceLevel;
}

export interface ExtractedMrp {
  detected: boolean;
  value: number | null;
  currency: string;
  raw_text: string | null;
  confidence: number;
  confidence_level: ConfidenceLevel;
  inclusive_of_taxes: boolean;
}

export interface ExtractedNetQuantity {
  detected: boolean;
  value: number | null;
  unit: string | null;
  raw_text: string | null;
  confidence: number;
  confidence_level: ConfidenceLevel;
}

export interface ExtractedManufacturerPacker {
  detected: boolean;
  type: 'manufacturer' | 'packer' | 'importer' | 'marketed_by' | null;
  organization_name: string | null;
  address: string | null;
  postal_code: string | null;
  raw_text: string | null;
  confidence: number;
  confidence_level: ConfidenceLevel;
}

export interface ExtractedDates {
  detected: boolean;
  mfg_date: string | null;
  expiry_date: string | null;
  best_before: string | null;
  batch_number: string | null;
  raw_text: string | null;
  confidence: number;
  confidence_level: ConfidenceLevel;
}

export interface ExtractedConsumerCare {
  detected: boolean;
  phone: string | null;
  toll_free: string | null;
  email: string | null;
  address: string | null;
  raw_text: string | null;
  confidence: number;
  confidence_level: ConfidenceLevel;
}

export interface ExtractionSummary {
  total_fields_tracked: number;
  fields_detected_count: number;
  has_mrp: boolean;
  has_net_quantity: boolean;
  has_manufacturer: boolean;
  has_date_information: boolean;
  has_consumer_care: boolean;
}

export interface ExtractedFields {
  product_name: ExtractedProduct;
  mrp: ExtractedMrp;
  net_quantity: ExtractedNetQuantity;
  manufacturer_packer: ExtractedManufacturerPacker;
  date_information: ExtractedDates;
  consumer_care: ExtractedConsumerCare;
  summary: ExtractionSummary;
}

export interface OcrLineItem {
  text: string;
  confidence: number;
  bounding_box: number[][];
}

export interface OcrSummary {
  line_count: number;
  average_confidence: number;
  engine: string;
}

export interface LabelDetectionResult {
  is_eligible: boolean;
  status: 'ELIGIBLE_FOR_PACKAGE_ANALYSIS' | 'INSUFFICIENT_PACKAGE_LABEL_EVIDENCE' | 'NO_READABLE_TEXT';
  matched_categories: string[];
  signal_score: number;
  reason: string;
  message: string;
}

export interface AnalysisResponse {
  success: boolean;
  scan_id: string;
  analysis_status: 'pending' | 'processing' | 'completed' | 'failed';
  analysis_timestamp: string;
  raw_ocr_text: string;
  ocr_lines: OcrLineItem[];
  ocr_summary: OcrSummary;
  extracted_fields: ExtractedFields;
  label_detection?: LabelDetectionResult;
  message: string;
}

export type ComplianceStatus = 'verified' | 'manual_review' | 'potential_issue' | 'not_detected';

export type OverallAssessment =
  | 'information_verified'
  | 'manual_review_recommended'
  | 'potential_issues_detected'
  | 'INSUFFICIENT_PACKAGE_LABEL_EVIDENCE'
  | 'NO_READABLE_TEXT'
  | 'insufficient_label_evidence';

export interface ComplianceRuleResult {
  rule_id: string;
  field: string;
  display_name: string;
  legal_reference?: string | null;
  severity: 'high' | 'medium' | 'low';
  status: ComplianceStatus;
  extracted_value?: string | null;
  confidence: ConfidenceLevel;
  explanation: string;
  evidence?: string | null;
  recommendation?: string | null;
}

export interface ComplianceSummary {
  verified: number;
  manual_review: number;
  potential_issue: number;
  total_rules: number;
}

export interface ValidationResponse {
  success: boolean;
  scan_id: string;
  overall_assessment: OverallAssessment;
  overall_label: string;
  overall_description: string;
  disclaimer: string;
  summary: ComplianceSummary;
  results: ComplianceRuleResult[];
  is_eligible?: boolean;
  eligibility_status?: string;
  eligibility_reason?: string;
  validated_at: string;
  message: string;
}

export interface ScanDetailResponse {
  id: string;
  filename: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  status: string;
  analysis_status: string;
  compliance_status?: string;
  overall_assessment?: OverallAssessment | null;
  compliance_summary?: ComplianceSummary | null;
  compliance_results?: ComplianceRuleResult[] | null;
  created_at: string;
  analyzed_at?: string | null;
  validated_at?: string | null;
  raw_ocr_text?: string | null;
  ocr_results?: OcrLineItem[] | null;
  extracted_fields?: ExtractedFields | null;
  analysis_error?: string | null;
}

// --- Phase 4: Visual Evidence & Copilot Types ---

export interface NormalizedRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface EvidenceBlock {
  text: string;
  confidence: number;
  bounding_box: number[][];
  normalized_rect: NormalizedRect;
}

export interface DeclarationEvidence {
  field: string;
  display_name: string;
  detected: boolean;
  has_evidence: boolean;
  detected_value?: string | null;
  raw_text?: string | null;
  message?: string | null;
  evidence_blocks: EvidenceBlock[];
  bounding_box_union?: NormalizedRect | null;
}

export interface EvidenceResponse {
  success: boolean;
  scan_id: string;
  image_dimensions: { width: number; height: number };
  total_mapped_declarations: number;
  declarations: Record<string, DeclarationEvidence>;
  all_ocr_blocks: Array<{
    line_index: number;
    text: string;
    confidence: number;
    bounding_box: number[][];
    normalized_rect: NormalizedRect;
  }>;
}

export interface CopilotResponse {
  success: boolean;
  scan_id: string;
  intent: string;
  question: string;
  answer: string;
  evidence_fields: string[];
  suggested_actions: string[];
}

export interface UploadResponse {
  success: boolean;
  image_id: string;
  filename: string;
  original_filename: string;
  upload_timestamp: string;
  file_size: number;
  message: string;
}

export interface HealthResponse {
  status: string;
  version: string;
  timestamp: string;
  environment?: string;
  database?: string;
}

export interface UploadState {
  file: File | null;
  preview: string | null;
  status: 'idle' | 'uploading' | 'success' | 'error';
  error: string | null;
  response: UploadResponse | null;
}

export type ProcessingStepId =
  | 'uploaded'
  | 'preparing'
  | 'ocr'
  | 'extracting'
  | 'finishing';

export interface ProcessingStep {
  id: ProcessingStepId;
  label: string;
  description: string;
}

