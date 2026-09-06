import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  DocumentDuplicateIcon,
  CheckIcon,
  InformationCircleIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
  SparklesIcon,
  PhotoIcon,
  ExclamationTriangleIcon,
  PencilSquareIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { Button } from '../components/ui/Button';
import {
  validateScan,
  getScanEvidence,
  downloadReport,
  getScanReadability,
  getScanDetail,
  submitInspectorReview,
} from '../api/client';
import { EvidenceImageViewer } from '../components/evidence/EvidenceImageViewer';
import { CopilotWidget } from '../components/copilot/CopilotWidget';
import type {
  AnalysisResponse,
  ExtractedFields,
  ValidationResponse,
  ComplianceRuleResult,
  ComplianceStatus,
  EvidenceResponse,
  ReadabilityResponse,
} from '../types';

function StatusBadge({ status }: { status: ComplianceStatus | 'not_detected' }) {
  switch (status) {
    case 'verified':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Verified
        </span>
      );
    case 'manual_review':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Manual Review
        </span>
      );
    case 'potential_issue':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          Potential Issue
        </span>
      );
    case 'not_detected':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          Not Detected
        </span>
      );
  }
}

interface DeclarationRowProps {
  rule: ComplianceRuleResult;
  isSelected: boolean;
  onSelect: () => void;
  hasVisualEvidence: boolean;
}

function DeclarationRow({
  rule,
  isSelected,
  onSelect,
  hasVisualEvidence,
}: DeclarationRowProps) {
  const [isExpanded, setIsExpanded] = useState(isSelected);

  useEffect(() => {
    if (isSelected) setIsExpanded(true);
  }, [isSelected]);

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
    onSelect();
  };

  const isDetected = rule.extracted_value && rule.extracted_value !== 'None';

  return (
    <div
      onClick={onSelect}
      className={`border rounded-xl transition-all cursor-pointer ${
        isSelected
          ? 'border-accent ring-1 ring-accent/30 bg-blue-50/20 shadow-xs'
          : 'border-border bg-white hover:border-slate-300'
      }`}
    >
      {/* Row Header */}
      <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="text-sm font-semibold text-text-primary">
              {rule.display_name}
            </h3>
            {rule.legal_reference && (
              <span className="text-[11px] text-text-secondary bg-slate-100 px-2 py-0.5 rounded">
                {rule.legal_reference}
              </span>
            )}
          </div>
          <p className="text-xs text-text-secondary truncate">
            {isDetected ? (
              <span className="font-mono text-text-primary font-medium">
                {rule.extracted_value}
              </span>
            ) : (
              <span className="italic text-slate-400">
                Not detected on this panel
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <StatusBadge status={rule.status} />

          <button
            type="button"
            onClick={toggleExpand}
            className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:text-accent-hover p-1 rounded transition-colors"
            title="Toggle details"
          >
            <span className="hidden sm:inline">
              {isExpanded ? 'Hide' : 'Details'}
            </span>
            {isExpanded ? (
              <ChevronUpIcon className="w-4 h-4" />
            ) : (
              <ChevronDownIcon className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Accordion Details: Traceability Chain */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-3 border-t border-slate-100 text-xs space-y-3 bg-slate-50/60 rounded-b-xl">
          {/* Step 1: Declaration & Value */}
          <div className="flex items-start justify-between gap-3 p-2.5 rounded-lg bg-white border border-[#E2E8F0]">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#667085] tracking-wider block">
                1. Declaration Target
              </span>
              <span className="font-semibold text-text-primary text-xs mt-0.5 block">
                {rule.display_name}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-[#667085] tracking-wider block">
                Extracted Value
              </span>
              <span className="font-mono text-xs font-bold text-[#163A5F] mt-0.5 block">
                {isDetected ? rule.extracted_value : 'Not Detected'}
              </span>
            </div>
          </div>

          {/* Step 2: Grounded OCR Evidence */}
          <div className="p-2.5 rounded-lg bg-white border border-[#E2E8F0]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] uppercase font-bold text-[#667085] tracking-wider">
                2. Supporting OCR Evidence
              </span>
              <span className="text-[11px] font-semibold text-[#667085]">
                Confidence: <strong className="text-[#172033]">{rule.confidence || 'Automated'}</strong>
              </span>
            </div>
            {rule.evidence ? (
              <p className="font-mono text-xs text-slate-900 bg-slate-50 p-2 rounded border border-slate-200 break-words leading-relaxed">
                "{rule.evidence}"
              </p>
            ) : (
              <p className="text-xs text-slate-400 italic">
                No matching OCR text segment identified on this package panel.
              </p>
            )}

            {/* Visual Bounding Box Evidence link */}
            <div className="flex items-center justify-between gap-2 pt-2 mt-1 border-t border-slate-100">
              <div className="text-[11px] text-text-secondary flex items-center gap-1.5">
                {hasVisualEvidence ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Mapped to physical pixel bounding box</span>
                  </>
                ) : isDetected ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span>Found in text line, bounding box unmapped</span>
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    <span>No visual evidence present on this image panel</span>
                  </>
                )}
              </div>

              {hasVisualEvidence && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect();
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline cursor-pointer"
                >
                  <EyeIcon className="w-3.5 h-3.5" />
                  <span>Highlight on Image</span>
                </button>
              )}
            </div>
          </div>

          {/* Step 3: Statutory Rule Requirement */}
          <div className="p-2.5 rounded-lg bg-white border border-[#E2E8F0]">
            <span className="text-[10px] uppercase font-bold text-[#667085] tracking-wider block mb-1">
              3. Statutory Rule / Legal Citation
            </span>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs text-[#163A5F] bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                {rule.legal_reference || 'Legal Metrology (Packaged Commodities) Rules, 2011'}
              </span>
            </div>
          </div>

          {/* Step 4 & 5: Assessment Verdict & Explanation */}
          <div className="p-2.5 rounded-lg bg-white border border-[#E2E8F0]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase font-bold text-[#667085] tracking-wider">
                4. Automated Assessment & Rationale
              </span>
              <StatusBadge status={rule.status} />
            </div>
            <p className="text-xs text-text-secondary leading-relaxed mt-1">
              {rule.explanation}
            </p>
            {rule.recommendation && (
              <p className="text-[11px] text-[#D97706] bg-amber-50/60 p-1.5 rounded border border-amber-200/60 mt-2 font-medium">
                Recommendation: {rule.recommendation}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams<{ scanId: string }>();
  const searchParams = new URLSearchParams(location.search);
  const queryScanId = searchParams.get('scan_id') || searchParams.get('id');

  const state = location.state as {
    analysis?: AnalysisResponse;
    validation?: ValidationResponse | null;
    scanId?: string;
    preview?: string;
  } | null;

  const [scanId, setScanId] = useState<string | null>(
    params.scanId || queryScanId || state?.scanId || state?.analysis?.scan_id || null
  );
  const isDemo = searchParams.get('demo') === 'true';

  const [analysisData, setAnalysisData] = useState<AnalysisResponse | null>(
    state?.analysis || null
  );
  const [validationData, setValidationData] = useState<ValidationResponse | null>(
    state?.validation || null
  );
  const [evidenceData, setEvidenceData] = useState<EvidenceResponse | null>(null);
  const [readabilityData, setReadabilityData] = useState<ReadabilityResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedField, setSelectedField] = useState<string | null>('mrp');
  const [showOcrText, setShowOcrText] = useState(false);
  const [showReadabilitySection, setShowReadabilitySection] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isDownloadingReport, setIsDownloadingReport] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  // Inspector Review State
  const [inspectorDecision, setInspectorDecision] = useState<'confirmed' | 'manual_review' | 'better_image_requested'>('confirmed');
  const [inspectorNotes, setInspectorNotes] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);
  const [reviewSavedMessage, setReviewSavedMessage] = useState<string | null>(null);
  const [savedReview, setSavedReview] = useState<{
    decision: 'confirmed' | 'manual_review' | 'better_image_requested';
    notes?: string | null;
    reviewedAt: string;
  } | null>(null);

  // Update scanId if route param changes
  useEffect(() => {
    if (params.scanId && params.scanId !== scanId) {
      setScanId(params.scanId);
    }
  }, [params.scanId]);

  // Main data loader
  useEffect(() => {
    if (!scanId) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    const loadData = async () => {
      try {
        // If analysisData or validationData aren't in memory, load them via getScanDetail
        let currentAnalysis = analysisData;
        let currentValidation = validationData;

        if (!currentAnalysis) {
          try {
            const detail = await getScanDetail(scanId);
            currentAnalysis = {
              success: true,
              scan_id: detail.id,
              original_filename: detail.original_filename,
              file_path: '',
              file_size: detail.file_size,
              mime_type: detail.mime_type,
              ocr_summary: {
                engine: 'PaddleOCR (ONNX)',
                execution_time_seconds: 0.1,
                line_count: detail.ocr_results?.length || 0,
                average_confidence: 0.9,
                device: 'cpu',
              },
              ocr_lines: detail.ocr_results || [],
              raw_ocr_text: detail.raw_ocr_text || '',
              extracted_fields: detail.extracted_fields || {},
              field_count: Object.keys(detail.extracted_fields || {}).length,
              status: detail.status,
              created_at: detail.created_at,
              analysis_status: 'completed',
              analysis_timestamp: detail.analyzed_at || detail.created_at,
              message: 'Inspection details loaded',
              label_detection: {
                is_eligible: detail.is_eligible ?? true,
                status: (detail.overall_assessment as any) || 'ELIGIBLE_FOR_PACKAGE_ANALYSIS',
                matched_categories: [],
                signal_score: 1.0,
                reason: '',
                message: '',
              },
            } as unknown as AnalysisResponse;

            if (isMounted) setAnalysisData(currentAnalysis);

            if (detail.compliance_results && detail.compliance_summary) {
              const isPartial = detail.is_partial_panel === true;
              currentValidation = {
                success: true,
                scan_id: detail.id,
                overall_assessment: (detail.overall_assessment as any) || 'COMPLIANT_WITH_OBSERVATIONS',
                overall_label: isPartial ? 'Partial Panel Evidence' : 'COMPLIANCE SCREENING COMPLETED',
                overall_description: isPartial
                  ? 'This appears to be a packaged commodity front or partial panel. Some mandatory declarations could not be verified from this image and may be located on another side of the package.'
                  : 'Declarations reviewed against Legal Metrology (Packaged Commodities) Rules, 2011.',
                disclaimer: 'Inspection aid only.',
                summary: detail.compliance_summary,
                results: detail.compliance_results,
                is_eligible: detail.is_eligible ?? true,
                is_partial_panel: isPartial,
                package_eligibility: detail.package_eligibility || undefined,
                compliance_evidence: detail.compliance_evidence || undefined,
                eligibility_status: detail.overall_assessment || 'ELIGIBLE',
                validated_at: detail.validated_at || detail.created_at,
                message: 'Loaded from scan history',
              };
              if (isMounted) setValidationData(currentValidation);
            }

            if (detail.inspector_decision) {
              if (isMounted) {
                setInspectorDecision(detail.inspector_decision);
                if (detail.inspector_notes) setInspectorNotes(detail.inspector_notes);
                setSavedReview({
                  decision: detail.inspector_decision,
                  notes: detail.inspector_notes,
                  reviewedAt: detail.inspector_reviewed_at || detail.created_at || new Date().toISOString(),
                });
              }
            }
          } catch (e) {
            console.error('Failed to load scan detail:', e);
          }
        } else {
          // If analysisData was already provided in router state, still fetch detail to get saved review status if any
          try {
            const detail = await getScanDetail(scanId);
            if (detail.inspector_decision && isMounted) {
              setInspectorDecision(detail.inspector_decision);
              if (detail.inspector_notes) setInspectorNotes(detail.inspector_notes);
              setSavedReview({
                decision: detail.inspector_decision,
                notes: detail.inspector_notes,
                reviewedAt: detail.inspector_reviewed_at || detail.created_at || new Date().toISOString(),
              });
            }
          } catch (e) {
            // Ignore optional fetch error
          }
        }

        // Fetch validation if still missing
        const valPromise = currentValidation
          ? Promise.resolve(currentValidation)
          : validateScan(scanId).catch(() => null);

        // Fetch visual evidence and readability in parallel
        const [vJson, eJson, rJson] = await Promise.all([
          valPromise,
          getScanEvidence(scanId).catch(() => null),
          getScanReadability(scanId).catch(() => null),
        ]);

        if (isMounted) {
          if (vJson) setValidationData(vJson);
          if (eJson) setEvidenceData(eJson);
          if (rJson) setReadabilityData(rJson);
        }
      } catch (err) {
        console.error('Failed to load scan inspection data:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [scanId]);

  const handleSaveReview = async () => {
    if (!scanId) return;
    setIsSubmittingReview(true);
    setReviewSavedMessage(null);
    try {
      const res = await submitInspectorReview(scanId, {
        decision: inspectorDecision,
        notes: inspectorNotes.trim() ? inspectorNotes.trim() : undefined,
      });
      setSavedReview({
        decision: res.inspector_decision as 'confirmed' | 'manual_review' | 'better_image_requested',
        notes: res.inspector_notes,
        reviewedAt: res.inspector_reviewed_at,
      });
      setReviewSavedMessage('Inspector review decision recorded successfully and linked to inspection record.');
      setTimeout(() => setReviewSavedMessage(null), 4000);
    } catch (err) {
      console.error('Failed to submit inspector review:', err);
      setReviewSavedMessage('Failed to save review decision. Please retry.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F6F8FB] flex flex-col items-center justify-center px-4 text-center">
        <div className="w-10 h-10 border-3 border-[#2563EB] border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-base font-semibold text-[#172033] mb-1">
          Loading Package Inspection
        </h2>
        <p className="text-xs text-[#667085]">
          Retrieving declarations, visual bounding boxes, and readability metrics...
        </p>
      </div>
    );
  }

  if (!analysisData && !validationData) {
    return (
      <div className="min-h-screen bg-[#F6F8FB] flex flex-col items-center justify-center px-4 text-center">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4 text-slate-400">
          <InformationCircleIcon className="w-6 h-6" />
        </div>
        <h2 className="text-base font-semibold text-text-primary mb-1">
          No analysis data found
        </h2>
        <p className="text-sm text-text-secondary mb-6 max-w-sm">
          Please upload a package image to view analysis and compliance screening.
        </p>
        <Button onClick={() => navigate('/scan')}>Go to Scan</Button>
      </div>
    );
  }

  const fields: ExtractedFields = analysisData?.extracted_fields || ({} as ExtractedFields);
  const preview = state?.preview;
  const imageSrc = preview || (scanId ? `/api/scans/${scanId}/image` : null);

  // Check if image was classified as ineligible
  const isEligible =
    validationData?.is_eligible !== false &&
    validationData?.overall_assessment !== 'INSUFFICIENT_PACKAGE_LABEL_EVIDENCE' &&
    validationData?.overall_assessment !== 'NO_READABLE_TEXT' &&
    analysisData?.label_detection?.is_eligible !== false;

  const handleCopyOcr = () => {
    if (analysisData?.raw_ocr_text) {
      navigator.clipboard.writeText(analysisData.raw_ocr_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadReport = async () => {
    if (!scanId || isDownloadingReport) return;
    setIsDownloadingReport(true);
    setReportError(null);
    try {
      const blob = await downloadReport(scanId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `LABEL_LENS_INSPECTION_${scanId.slice(0, 8)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Report download failed.';
      setReportError(msg);
    } finally {
      setIsDownloadingReport(false);
    }
  };

  // ---------------------------------------------------------------------------
  // STATE A: INSUFFICIENT EVIDENCE / NOT A PACKAGED COMMODITY
  // ---------------------------------------------------------------------------
  if (!isEligible) {
    const isNoText =
      validationData?.overall_assessment === 'NO_READABLE_TEXT' ||
      analysisData?.label_detection?.status === 'NO_READABLE_TEXT';

    return (
      <div className="min-h-screen bg-[#F6F8FB]">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Breadcrumb Navigation */}
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={() => navigate('/scan')}
              className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary cursor-pointer transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              <span>Scan Another Image</span>
            </button>
            <span className="text-xs text-text-secondary font-mono">
              Scan ID: {scanId?.slice(0, 8)}...
            </span>
          </div>

          {/* Page Header */}
          <header className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">
              Package Analysis
            </h1>
            <p className="text-sm text-text-secondary mt-1">
              Review detected packaging declarations and supporting evidence.
            </p>
          </header>

          {/* Clean Informational Card */}
          <div className="bg-white border border-[#E5EAF0] rounded-2xl p-6 sm:p-8 shadow-xs mb-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-600">
                <InformationCircleIcon className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 mb-2">
                  Analysis Not Performed
                </div>
                <h2 className="text-lg font-bold text-text-primary mb-2">
                  {isNoText
                    ? 'No readable text detected in uploaded image'
                    : 'This image does not appear to be a packaged commodity label'}
                </h2>
                <p className="text-sm text-text-secondary leading-relaxed mb-6">
                  {isNoText
                    ? 'LABEL LENS AI could not detect legible text in the uploaded image. Please ensure the camera is focused and lighting is clear.'
                    : 'LABEL LENS AI detected readable text, but identified insufficient evidence to classify this image as a packaged commodity label (e.g. certificates, institutional documents, cards, or non-package photographs). Compliance screening was safely suspended to prevent false violations.'}
                </p>

                {/* Helpful Guidance Checklist */}
                <div className="p-4 rounded-xl bg-[#F6F8FB] border border-[#E5EAF0] mb-6">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary mb-2">
                    What you can do:
                  </h3>
                  <ul className="text-xs text-text-secondary space-y-1.5 list-disc list-inside">
                    <li>Upload the front or back panel of a physical product package</li>
                    <li>Ensure packaging declarations are clearly visible and legible</li>
                    <li>Capture declarations such as MRP, Net Quantity, or Manufacturer details</li>
                  </ul>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    size="md"
                    onClick={() => navigate('/scan')}
                    className="gap-2"
                  >
                    <ArrowPathIcon className="w-4 h-4" />
                    Upload Another Image
                  </Button>
                  <Button
                    size="md"
                    variant="secondary"
                    onClick={() => navigate('/history')}
                  >
                    View Inspection History
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Raw OCR Text Viewer (Zero Hallucination Proof) */}
          <div className="border border-[#E5EAF0] rounded-xl overflow-hidden bg-white">
            <button
              type="button"
              onClick={() => setShowOcrText(!showOcrText)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-[#F6F8FB] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-text-primary">
                  View Detected Text (Raw OCR Evidence)
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">
                  {analysisData?.ocr_summary?.line_count ?? analysisData?.ocr_lines?.length ?? 0} lines
                </span>
              </div>
              {showOcrText ? (
                <ChevronUpIcon className="w-4 h-4 text-text-secondary" />
              ) : (
                <ChevronDownIcon className="w-4 h-4 text-text-secondary" />
              )}
            </button>

            {showOcrText && (
              <div className="p-4 border-t border-[#E5EAF0] bg-slate-50">
                <div className="flex items-center justify-between mb-3 text-xs text-text-secondary">
                  <span>
                    Engine: <strong className="text-text-primary">{analysisData?.ocr_summary?.engine || 'PaddleOCR (ONNX)'}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyOcr}
                    className="inline-flex items-center gap-1 text-accent hover:underline font-medium cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <CheckIcon className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600">Copied</span>
                      </>
                    ) : (
                      <>
                        <DocumentDuplicateIcon className="w-3.5 h-3.5" />
                        <span>Copy Text</span>
                      </>
                    )}
                  </button>
                </div>

                <pre className="p-3 bg-white border border-[#E5EAF0] rounded-lg text-xs font-mono text-slate-800 whitespace-pre-wrap break-words max-h-60 overflow-y-auto leading-relaxed">
                  {analysisData?.raw_ocr_text || 'No readable text was detected.'}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // STATE B: ELIGIBLE PACKAGE ANALYSIS (CLEAN ENTERPRISE REDESIGN)
  // ---------------------------------------------------------------------------
  const summary = validationData?.summary || {
    verified: 0,
    manual_review: 0,
    potential_issue: 0,
    total_rules: 0,
  };

  const detectedProductName =
    fields.product_name?.detected && fields.product_name?.value
      ? fields.product_name.value
      : 'Not Confidently Detected';

  const imageQuality = readabilityData?.image_quality;

  const isPartialPanel =
    validationData?.is_partial_panel === true ||
    validationData?.overall_label === 'Partial Panel Evidence' ||
    validationData?.compliance_evidence === 'PARTIAL_PANEL_EVIDENCE' ||
    analysisData?.label_detection?.is_partial_panel === true;

  return (
    <div className="min-h-screen bg-[#F6F8FB] pb-24 sm:pb-12 text-[#172033]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate('/history')}
            className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary cursor-pointer transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            <span>Inspection History</span>
          </button>
          <span className="text-xs text-text-secondary font-mono">
            Scan ID: {scanId?.slice(0, 8)}...
          </span>
        </div>

        {/* SIH Demo Banner if loaded in demo mode */}
        {isDemo && (
          <div className="mb-6 p-3.5 rounded-2xl bg-indigo-50/90 border border-indigo-200 text-indigo-900 shadow-xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-indigo-200/80 text-indigo-950 border border-indigo-300">
                DEMO SAMPLE
              </span>
              <p className="text-xs font-medium">
                Pre-analyzed inspection loaded for demonstration purposes. Grounded in actual database records.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/scan')}
              className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 underline underline-offset-2 flex-shrink-0 cursor-pointer"
            >
              Scan Live Package →
            </button>
          </div>
        )}

        {/* Partial Panel Notification Banner */}
        {isPartialPanel && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50/90 border border-amber-200 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0 text-amber-700 mt-0.5">
                  <InformationCircleIcon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-200/60 text-amber-900 uppercase tracking-wider">
                      Package Detected
                    </span>
                    <span className="text-xs font-semibold text-amber-900">
                      Partial Label / Panel Evidence
                    </span>
                  </div>
                  <p className="text-xs text-amber-800 leading-relaxed max-w-2xl">
                    Some compliance declarations could not be verified from this image. They may be located on another side of the package.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
                <button
                  type="button"
                  onClick={() => navigate('/scan?mode=upload')}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 text-white hover:bg-amber-700 transition-colors cursor-pointer shadow-xs"
                  title="Scan the back panel as a new inspection"
                >
                  Scan Back Panel
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/scan')}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white text-amber-900 border border-amber-300 hover:bg-amber-100/50 transition-colors cursor-pointer"
                  title="Scan another package image"
                >
                  Scan Another Image
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('declarations-section');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-amber-900 hover:underline cursor-pointer"
                >
                  Continue with Current Evidence ↓
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Page Header */}
        <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-accent border border-blue-200 mb-2">
              <ShieldCheckIcon className="w-3.5 h-3.5 text-accent" />
              Legal Metrology Compliance Screening
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
              Package Analysis
            </h1>
            <p className="text-sm text-text-secondary mt-1">
              Review detected packaging declarations, readability diagnostics, and visual evidence.
            </p>
          </div>

          {/* Header Action: Download Inspection Report */}
          <div className="flex-shrink-0 flex items-center gap-2">
            <Button
              size="md"
              loading={isDownloadingReport}
              disabled={isDownloadingReport}
              onClick={handleDownloadReport}
              className="gap-2"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              <span>{isDownloadingReport ? 'Generating Report...' : 'Download Inspection Report'}</span>
            </Button>
          </div>
        </header>

        {reportError && (
          <div className="mb-6 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {reportError}
          </div>
        )}

        {/* Balanced 2-Column Desktop Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: Visual Evidence Viewer & Copilot (Sticky on Desktop) */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-8">
            {/* Visual Evidence Viewer */}
            <div className="bg-white border border-[#E5EAF0] rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-text-primary">
                  Visual Evidence Viewer
                </h2>
                {selectedField && (
                  <span className="text-xs text-accent font-semibold">
                    Highlighting: {selectedField.replace('_', ' ')}
                  </span>
                )}
              </div>

              <EvidenceImageViewer
                imageSrc={imageSrc || ''}
                evidenceData={evidenceData}
                selectedField={selectedField}
                onSelectField={(field) => setSelectedField(field)}
              />
            </div>

            {/* AI Compliance Inspection Assistant */}
            <CopilotWidget
              scanId={scanId || ''}
              onHighlightField={(field) => setSelectedField(field)}
            />
          </div>

          {/* RIGHT COLUMN: Summary, Status Separation, Inspector Review, Readability, & Declarations */}
          <div className="lg:col-span-7 space-y-6">
            {/* Analysis Summary Card with Dual Status Model */}
            <div className="bg-white border border-[#E5EAF0] rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5EAF0]">
                <div>
                  <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
                    Product Identification
                  </span>
                  <h2 className="text-base font-bold text-text-primary mt-0.5">
                    {detectedProductName}
                  </h2>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Verified: {summary.verified}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Review: {summary.manual_review}
                  </span>
                  {summary.potential_issue > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      Issues: {summary.potential_issue}
                    </span>
                  )}
                </div>
              </div>

              {/* Strict Dual-Level Status Model */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Package Status
                  </span>
                  <div className="inline-flex items-center gap-1.5 font-semibold text-[#0F172A]">
                    <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
                    <span>Packaged Commodity Detected</span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Compliance Evidence Status
                  </span>
                  <div>
                    {isPartialPanel ? (
                      <span className="inline-flex items-center gap-1.5 font-semibold text-amber-700">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        Partial Panel Evidence
                      </span>
                    ) : summary.potential_issue > 0 ? (
                      <span className="inline-flex items-center gap-1.5 font-semibold text-rose-700">
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                        Potential Issue Detected
                      </span>
                    ) : summary.manual_review > 0 ? (
                      <span className="inline-flex items-center gap-1.5 font-semibold text-amber-700">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        Manual Review Recommended
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        Sufficient Evidence
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Assessment Message */}
              <div className="text-xs text-text-secondary leading-relaxed">
                {validationData?.overall_description ||
                  'Declarations reviewed against Legal Metrology (Packaged Commodities) Rules, 2011.'}
              </div>
            </div>

            {/* HUMAN-IN-THE-LOOP INSPECTOR REVIEW CARD */}
            <div className="bg-white border border-[#E5EAF0] rounded-2xl p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E5EAF0]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-accent flex items-center justify-center font-bold text-xs">
                    IR
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-text-primary">
                      Human-in-the-Loop Inspector Review
                    </h2>
                    <p className="text-[11px] text-text-secondary">
                      AI provides screening support; final legal authority belongs to the authorized inspector.
                    </p>
                  </div>
                </div>
                {savedReview && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-accent border border-blue-200">
                    <CheckCircleIcon className="w-3.5 h-3.5 text-accent" />
                    Status: {savedReview.decision.replace('_', ' ').toUpperCase()}
                  </span>
                )}
              </div>

              <div className="pt-4 space-y-4 text-xs">
                {/* Current AI Finding Context */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 flex items-start gap-2.5">
                  <InformationCircleIcon className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <span className="font-semibold text-slate-900 block mb-0.5">Automated AI Finding:</span>
                    <span>
                      {validationData?.overall_label || 'Compliance Screening Completed'} — {summary.verified} verified, {summary.manual_review} requires review, {summary.potential_issue} potential issues.
                    </span>
                  </div>
                </div>

                {/* Decision Radio/Button Selector */}
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-2">
                    Official Inspector Action
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setInspectorDecision('confirmed')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        inspectorDecision === 'confirmed'
                          ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 font-semibold ring-1 ring-emerald-600'
                          : 'border-border bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`w-2 h-2 rounded-full ${inspectorDecision === 'confirmed' ? 'bg-emerald-600' : 'bg-slate-300'}`} />
                        <span className="text-xs font-semibold">Confirm AI Finding</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Agree with automated declarations check
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setInspectorDecision('manual_review')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        inspectorDecision === 'manual_review'
                          ? 'border-amber-600 bg-amber-50/70 text-amber-950 font-semibold ring-1 ring-amber-600'
                          : 'border-border bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`w-2 h-2 rounded-full ${inspectorDecision === 'manual_review' ? 'bg-amber-600' : 'bg-slate-300'}`} />
                        <span className="text-xs font-semibold">Mark for Manual Review</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Dispute or flag for on-ground physical audit
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setInspectorDecision('better_image_requested')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        inspectorDecision === 'better_image_requested'
                          ? 'border-blue-600 bg-blue-50/70 text-blue-950 font-semibold ring-1 ring-blue-600'
                          : 'border-border bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`w-2 h-2 rounded-full ${inspectorDecision === 'better_image_requested' ? 'bg-blue-600' : 'bg-slate-300'}`} />
                        <span className="text-xs font-semibold">Request Better Image</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Capture higher resolution or other panel
                      </p>
                    </button>
                  </div>
                </div>

                {/* Inspector Notes */}
                <div>
                  <label htmlFor="inspector-notes" className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                    Inspector Observations & Notes (Optional)
                  </label>
                  <textarea
                    id="inspector-notes"
                    rows={2}
                    value={inspectorNotes}
                    onChange={(e) => setInspectorNotes(e.target.value)}
                    placeholder="Enter official audit observations, field officer remarks, or follow-up instructions..."
                    className="w-full p-2.5 text-xs rounded-xl border border-border focus:border-accent focus:ring-1 focus:ring-accent outline-none bg-[#FAFAFA]"
                  />
                </div>

                {/* Save Feedback and Action Button */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <div className="text-[11px] text-slate-500">
                    {savedReview ? (
                      <span>
                        Last saved: {new Date(savedReview.reviewedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} • Recorded in official SQLite audit trail & PDF report
                      </span>
                    ) : (
                      <span>Decision will be appended to the official PDF inspection report</span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveReview}
                    disabled={isSubmittingReview}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#163A5F] hover:bg-[#1f4f82] active:bg-[#122e4c] transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    {isSubmittingReview ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Saving Decision...</span>
                      </>
                    ) : (
                      <>
                        <CheckIcon className="w-3.5 h-3.5" />
                        <span>Save Decision</span>
                      </>
                    )}
                  </button>
                </div>

                {reviewSavedMessage && (
                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-1.5">
                    <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{reviewSavedMessage}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Readability & Quality Assessment Section */}
            {readabilityData && (
              <div className="bg-white border border-[#E5EAF0] rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-[#E5EAF0]">
                  <div className="flex items-center gap-2">
                    <SparklesIcon className="w-4 h-4 text-[#2563EB]" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-[#172033]">
                      Label Readability Assessment
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowReadabilitySection(!showReadabilitySection)}
                    className="text-xs text-[#2563EB] font-semibold hover:underline"
                  >
                    {showReadabilitySection ? 'Collapse' : 'Expand'}
                  </button>
                </div>

                {showReadabilitySection && (
                  <div className="pt-4 space-y-4">
                    {/* Quality Badges */}
                    {imageQuality && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-2.5 bg-[#F8F9FA] rounded-xl border border-[#E5EAF0]">
                          <span className="text-[10px] uppercase font-bold text-[#667085] block">Resolution</span>
                          <span className="text-xs font-bold text-[#172033] mt-0.5 block">
                            {imageQuality.width} × {imageQuality.height}
                          </span>
                          <span className="text-[11px] text-[#667085]">{imageQuality.megapixels} MP</span>
                        </div>

                        <div className="p-2.5 bg-[#F8F9FA] rounded-xl border border-[#E5EAF0]">
                          <span className="text-[10px] uppercase font-bold text-[#667085] block">Sharpness</span>
                          <span className="text-xs font-bold text-[#172033] mt-0.5 block">
                            {imageQuality.sharpness_label}
                          </span>
                          <span className="text-[11px] text-[#667085]">Var: {imageQuality.sharpness_score}</span>
                        </div>

                        <div className="p-2.5 bg-[#F8F9FA] rounded-xl border border-[#E5EAF0]">
                          <span className="text-[10px] uppercase font-bold text-[#667085] block">Contrast</span>
                          <span className="text-xs font-bold text-[#172033] mt-0.5 block">
                            {imageQuality.contrast_label}
                          </span>
                          <span className="text-[11px] text-[#667085]">Std: {imageQuality.contrast_score}</span>
                        </div>

                        <div className="p-2.5 bg-[#F8F9FA] rounded-xl border border-[#E5EAF0]">
                          <span className="text-[10px] uppercase font-bold text-[#667085] block">Overall Readability</span>
                          <span className="text-xs font-bold text-[#2563EB] mt-0.5 block">
                            {readabilityData.overall_readability}
                          </span>
                          <span className="text-[11px] text-emerald-600 font-medium">Algorithmic</span>
                        </div>
                      </div>
                    )}

                    {/* Per-Declaration Readability Breakdown */}
                    <div className="border border-[#E5EAF0] rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#F8F9FA] text-[#667085] font-semibold uppercase text-[10px] border-b border-[#E5EAF0]">
                          <tr>
                            <th className="p-2.5">Declaration</th>
                            <th className="p-2.5">Clarity</th>
                            <th className="p-2.5">OCR Conf</th>
                            <th className="p-2.5">Char Ht</th>
                            <th className="p-2.5 text-right">Guidance</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5EAF0]">
                          {Object.entries(readabilityData.declarations || {}).map(([key, item]) => (
                            <tr key={key} className="hover:bg-slate-50/50">
                              <td className="p-2.5 font-medium text-[#172033]">
                                {item.display_name}
                              </td>
                              <td className="p-2.5">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                    item.readability === 'Good'
                                      ? 'bg-emerald-50 text-emerald-700'
                                      : item.readability === 'Moderate'
                                      ? 'bg-amber-50 text-amber-700'
                                      : item.readability === 'Low Readability'
                                      ? 'bg-rose-50 text-rose-700'
                                      : 'bg-slate-100 text-slate-500'
                                  }`}
                                >
                                  {item.readability}
                                </span>
                              </td>
                              <td className="p-2.5 font-mono text-slate-700">
                                {item.ocr_confidence}
                              </td>
                              <td className="p-2.5 font-mono text-slate-700">
                                {item.pixel_height ? `${item.pixel_height} px` : '—'}
                              </td>
                              <td className="p-2.5 text-right text-[11px] text-[#667085] max-w-[140px] truncate" title={item.recommendation}>
                                {item.recommendation}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Statutory Disclaimer Box */}
                    <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl text-amber-900 text-xs flex items-start gap-2.5">
                      <InformationCircleIcon className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                      <p className="leading-relaxed">
                        <strong className="font-semibold">Statutory Disclaimer:</strong> {readabilityData.disclaimer}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Declarations Section Header */}
            <div id="declarations-section" className="flex items-center justify-between scroll-mt-6">
              <h2 className="text-sm font-bold text-text-primary">
                Mandatory Declarations (Rule 6)
              </h2>
              <span className="text-xs text-text-secondary">
                Click any row to inspect OCR evidence
              </span>
            </div>

            {/* Declarations Accordion List */}
            <div className="space-y-3">
              {validationData?.results && validationData.results.length > 0 ? (
                validationData.results.map((rule) => {
                  const hasEvidence =
                    evidenceData?.declarations?.[rule.field]?.has_evidence ?? false;
                  return (
                    <DeclarationRow
                      key={rule.rule_id}
                      rule={rule}
                      isSelected={selectedField === rule.field}
                      onSelect={() => setSelectedField(rule.field)}
                      hasVisualEvidence={hasEvidence}
                    />
                  );
                })
              ) : (
                <div className="p-6 text-center text-xs text-text-secondary bg-white rounded-xl border border-[#E5EAF0]">
                  Loading declaration rules...
                </div>
              )}
            </div>

            {/* Raw OCR Evidence (Collapsible) */}
            <div className="border border-[#E5EAF0] rounded-xl overflow-hidden bg-white mt-6">
              <button
                type="button"
                onClick={() => setShowOcrText(!showOcrText)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-[#F6F8FB] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-text-primary">
                    View Detected Text (Raw OCR Evidence)
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">
                    {analysisData?.ocr_summary?.line_count ?? analysisData?.ocr_lines?.length ?? 0} lines
                  </span>
                </div>
                {showOcrText ? (
                  <ChevronUpIcon className="w-4 h-4 text-text-secondary" />
                ) : (
                  <ChevronDownIcon className="w-4 h-4 text-text-secondary" />
                )}
              </button>

              {showOcrText && (
                <div className="p-4 border-t border-[#E5EAF0] bg-slate-50">
                  <div className="flex items-center justify-between mb-3 text-xs text-text-secondary">
                    <span>
                      Engine: <strong className="text-text-primary">{analysisData?.ocr_summary?.engine || 'PaddleOCR (ONNX)'}</strong> · Avg Conf: <strong className="text-text-primary">{((analysisData?.ocr_summary?.average_confidence || 0) * 100).toFixed(1)}%</strong>
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyOcr}
                      className="inline-flex items-center gap-1 text-accent hover:underline font-medium cursor-pointer"
                    >
                      {copied ? (
                        <>
                          <CheckIcon className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600">Copied</span>
                        </>
                      ) : (
                        <>
                          <DocumentDuplicateIcon className="w-3.5 h-3.5" />
                          <span>Copy Text</span>
                        </>
                      )}
                    </button>
                  </div>

                  <pre className="p-3 bg-white border border-[#E5EAF0] rounded-lg text-xs font-mono text-slate-800 whitespace-pre-wrap break-words max-h-60 overflow-y-auto leading-relaxed">
                    {analysisData?.raw_ocr_text || 'No text detected.'}
                  </pre>
                </div>
              )}
            </div>

            {/* Bottom Actions for Mobile / Page End */}
            <div className="pt-6 border-t border-[#E5EAF0] flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                className="flex-1"
                loading={isDownloadingReport}
                disabled={isDownloadingReport}
                onClick={handleDownloadReport}
              >
                <ArrowDownTrayIcon className="w-5 h-5" />
                <span>{isDownloadingReport ? 'Generating Report...' : 'Download Inspection Report'}</span>
              </Button>
              <Button
                size="lg"
                variant="secondary"
                className="flex-1"
                onClick={() => navigate('/scan')}
              >
                Scan Another Package
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
