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
} from '@heroicons/react/24/outline';
import { Button } from '../components/ui/Button';
import {
  validateScan,
  getScanEvidence,
  downloadReport,
  getScanReadability,
  getScanDetail,
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

      {/* Expanded Accordion Details */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-slate-100 text-xs space-y-3 bg-slate-50/50 rounded-b-xl">
          {/* Assessment Rationale */}
          <div>
            <span className="font-semibold text-text-primary block mb-0.5">
              Assessment Rationale:
            </span>
            <p className="text-text-secondary leading-relaxed">
              {rule.explanation}
            </p>
          </div>

          {/* Supporting OCR Evidence */}
          {rule.evidence && (
            <div className="p-2.5 rounded-lg bg-white border border-slate-200">
              <span className="font-medium text-slate-600 block mb-1">
                Supporting OCR Evidence:
              </span>
              <p className="font-mono text-xs text-slate-900 break-words leading-relaxed">
                "{rule.evidence}"
              </p>
            </div>
          )}

          {/* Visual evidence status */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="text-[11px] text-text-secondary flex items-center gap-1.5">
              {hasVisualEvidence ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Mapped to OCR coordinates on package</span>
                </>
              ) : isDetected ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span>Detected in text, bounding box coordinates not mapped</span>
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  <span>No visual evidence detected on this image</span>
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
                className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
              >
                <EyeIcon className="w-3.5 h-3.5" />
                <span>Highlight on Image</span>
              </button>
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

  const state = location.state as {
    analysis?: AnalysisResponse;
    validation?: ValidationResponse | null;
    scanId?: string;
    preview?: string;
  } | null;

  const [scanId, setScanId] = useState<string | null>(
    params.scanId || state?.scanId || state?.analysis?.scan_id || null
  );
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
              currentValidation = {
                success: true,
                scan_id: detail.id,
                overall_assessment: (detail.overall_assessment as any) || 'COMPLIANT_WITH_OBSERVATIONS',
                overall_label: 'COMPLIANCE SCREENING COMPLETED',
                overall_description: 'Declarations reviewed against Legal Metrology (Packaged Commodities) Rules, 2011.',
                disclaimer: 'Inspection aid only.',
                summary: detail.compliance_summary,
                results: detail.compliance_results,
                is_eligible: detail.is_eligible ?? true,
                eligibility_status: detail.overall_assessment || 'ELIGIBLE',
                validated_at: detail.validated_at || detail.created_at,
                message: 'Loaded from scan history',
              };
              if (isMounted) setValidationData(currentValidation);
            }
          } catch (e) {
            console.error('Failed to load scan detail:', e);
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

          {/* RIGHT COLUMN: Summary, Readability, & Declarations Accordion */}
          <div className="lg:col-span-7 space-y-6">
            {/* Analysis Summary Card */}
            <div className="bg-white border border-[#E5EAF0] rounded-2xl p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5EAF0]">
                <div>
                  <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
                    Product Identification
                  </span>
                  <h2 className="text-base font-bold text-text-primary mt-0.5">
                    {detectedProductName}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
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

              {/* Assessment Message */}
              <div className="pt-3 text-xs text-text-secondary leading-relaxed">
                {validationData?.overall_description ||
                  'Declarations reviewed against Legal Metrology (Packaged Commodities) Rules, 2011.'}
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
            <div className="flex items-center justify-between">
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
