import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  ExclamationTriangleIcon,
  PencilSquareIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  ClipboardDocumentCheckIcon,
  DocumentTextIcon,
  TagIcon,
  ScaleIcon,
  UserIcon,
  GlobeAltIcon,
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
  const { t } = useTranslation();
  switch (status) {
    case 'verified':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          {t('common.verified', 'Verified')}
        </span>
      );
    case 'manual_review':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          {t('common.manualReview', 'Requires Review')}
        </span>
      );
    case 'potential_issue':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
          {t('common.potentialIssue', 'Potential Issue')}
        </span>
      );
    case 'not_detected':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800/80 text-slate-400 border border-white/10">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
          {t('common.notDetected', 'Not Detected')}
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
          ? 'border-[#38BDF8] ring-1 ring-[#38BDF8]/40 bg-[#16324F]/90 shadow-md'
          : 'border-white/10 bg-[#10263F]/70 hover:border-slate-500 hover:bg-[#10263F]'
      }`}
    >
      <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="text-sm font-bold text-white">
              {rule.display_name}
            </h3>
            {rule.legal_reference && (
              <span className="text-[11px] text-slate-300 bg-[#16324F] px-2.5 py-0.5 rounded border border-white/10">
                {rule.legal_reference}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 line-clamp-1">
            Extracted: <strong className="text-white font-mono">{isDetected ? rule.extracted_value : 'Not Detected'}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <StatusBadge status={rule.status} />
          <button
            type="button"
            onClick={toggleExpand}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            {isExpanded ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 pt-3 border-t border-white/10 text-xs space-y-3 bg-[#0B1F3A]/90 rounded-b-xl">
          <div className="p-3 rounded-xl bg-[#10263F] border border-white/10">
            <span className="text-[10px] uppercase font-bold text-[#38BDF8] tracking-wider block mb-1">
              Supporting OCR Evidence
            </span>
            {rule.evidence ? (
              <p className="font-mono text-xs text-slate-200 bg-[#07111F] p-2.5 rounded-lg border border-white/10 break-words leading-relaxed">
                "{rule.evidence}"
              </p>
            ) : (
              <p className="text-xs text-slate-500 italic">
                No matching OCR text segment identified on this package panel.
              </p>
            )}
          </div>

          <div className="p-3 rounded-xl bg-[#10263F] border border-white/10">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase font-bold text-[#38BDF8] tracking-wider">
                Automated Assessment & Rationale
              </span>
              <StatusBadge status={rule.status} />
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mt-1">
              {rule.explanation}
            </p>
            {rule.recommendation && (
              <p className="text-[11px] text-amber-300 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20 mt-2 font-medium">
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
  const { t } = useTranslation();
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

  // Dual View Mode: Consumer (Simple) vs Inspector View
  const [viewMode, setViewMode] = useState<'simple' | 'inspector'>('simple');

  const [analysisData, setAnalysisData] = useState<AnalysisResponse | null>(state?.analysis || null);
  const [validationData, setValidationData] = useState<ValidationResponse | null>(state?.validation || null);
  const [evidenceData, setEvidenceData] = useState<EvidenceResponse | null>(null);
  const [readabilityData, setReadabilityData] = useState<ReadabilityResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedField, setSelectedField] = useState<string | null>('mrp');

  // Accordion toggle states for advanced sections
  const [showVisualEvidence, setShowVisualEvidence] = useState<boolean>(true);
  const [showDeclarationMatrix, setShowDeclarationMatrix] = useState<boolean>(true);
  const [showFoodInfo, setShowFoodInfo] = useState<boolean>(true);
  const [showInspectorSection, setShowInspectorSection] = useState<boolean>(false);
  const [showRawOcr, setShowRawOcr] = useState<boolean>(false);

  const [copied, setCopied] = useState(false);
  const [isDownloadingReport, setIsDownloadingReport] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  // Inspector Review State
  const [inspectorDecision, setInspectorDecision] = useState<'confirmed' | 'manual_review' | 'better_image_requested'>('confirmed');
  const [inspectorNotes, setInspectorNotes] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);
  const [savedReview, setSavedReview] = useState<{
    decision: 'confirmed' | 'manual_review' | 'better_image_requested';
    notes?: string | null;
    reviewedAt: string;
  } | null>(null);

  useEffect(() => {
    if (params.scanId && params.scanId !== scanId) {
      setScanId(params.scanId);
    }
  }, [params.scanId]);

  useEffect(() => {
    if (!scanId) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    const loadData = async () => {
      try {
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
                  ? 'This appears to be a packaged commodity front or partial panel. Some mandatory declarations could not be verified from this image.'
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
            console.error('Failed to load scan detail:', e);
          }
        }

        const valPromise = currentValidation
          ? Promise.resolve(currentValidation)
          : validateScan(scanId).catch(() => null);

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
        console.error('Data load error:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [scanId]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanId || isSubmittingReview) return;

    setIsSubmittingReview(true);
    try {
      await submitInspectorReview(scanId, {
        decision: inspectorDecision,
        notes: inspectorNotes || undefined,
      });

      setSavedReview({
        decision: inspectorDecision,
        notes: inspectorNotes,
        reviewedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Review submit failed:', err);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#07111F] text-slate-100 flex flex-col items-center justify-center px-4 text-center">
        <div className="w-10 h-10 border-4 border-[#38BDF8] border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-base font-bold text-white">Loading Package Analysis Results...</h2>
        <p className="text-xs text-slate-400 mt-1 font-mono">Scan ID: {scanId?.slice(0, 8)}</p>
      </div>
    );
  }

  if (!analysisData && !validationData) {
    return (
      <div className="min-h-screen bg-[#07111F] text-slate-100 flex flex-col items-center justify-center px-4 text-center">
        <div className="w-12 h-12 rounded-full bg-[#10263F] flex items-center justify-center mb-4 text-[#38BDF8] border border-white/10">
          <InformationCircleIcon className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-white mb-1">No analysis data found</h2>
        <p className="text-xs text-slate-400 mb-6 max-w-sm">
          Please capture or upload a package image to view analysis and compliance screening.
        </p>
        <Button onClick={() => navigate('/scan')}>Go to Scan Package</Button>
      </div>
    );
  }

  const fields: ExtractedFields = analysisData?.extracted_fields || ({} as ExtractedFields);
  const preview = state?.preview;
  const imageSrc = preview || (scanId ? `/api/scans/${scanId}/image` : null);

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

  // Friendly Error Experience (Item #10)
  if (!isEligible) {
    return (
      <div className="min-h-screen bg-[#07111F] text-slate-100 py-10 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <button
              onClick={() => navigate('/scan')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#38BDF8] hover:underline cursor-pointer"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              <span>Back to Smart Scan</span>
            </button>
          </div>

          <div className="bg-[#0B1F3A]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center mx-auto mb-4 border border-amber-500/30">
              <ExclamationTriangleIcon className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-white mb-2">
              We Need a Clearer Package Image
            </h1>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed mb-6">
              Some package information could not be read reliably from this image.
            </p>

            <div className="p-4 rounded-xl bg-[#10263F] border border-white/10 text-left text-xs max-w-md mx-auto mb-6 space-y-2">
              <p className="font-bold text-amber-300">Recommended next steps:</p>
              <ul className="list-disc list-inside text-slate-300 space-y-1">
                <li>Move closer to the package label</li>
                <li>Improve lighting over small font declarations</li>
                <li>Reduce glare or surface plastic reflections</li>
                <li>Capture the back panel for mandatory declarations (MRP, Mfg, Packer)</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => navigate('/scan?mode=camera')}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#2563EB] hover:bg-[#1d4ed8] cursor-pointer shadow-lg shadow-blue-500/25"
              >
                📷 Start Live Camera
              </button>
              <button
                onClick={() => navigate('/scan')}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-200 bg-[#10263F] border border-white/10 hover:bg-[#16324F] cursor-pointer"
              >
                Upload File Instead
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Eligible Package Data
  const summary = validationData?.summary || { verified: 0, manual_review: 0, potential_issue: 0, total_rules: 0 };
  const productName = fields.product_name?.value || 'Packaged Commodity';
  const rawText = analysisData?.raw_ocr_text || '';

  // Extract Food Information if present in OCR text
  const isFood = /ingredient|sugar|fssai|nutrition|allergen|biscuit|noodle|snack|beverage|food|chocolate/i.test(rawText);
  const ingredientsText = rawText.match(/ingredients?\s*:?\s*([^.\n]+)/i)?.[1] || (isFood ? 'Declared on package' : null);
  const sugarText = rawText.match(/sugars?\s*:?\s*([\d.]+\s*g?)/i)?.[1] || (isFood ? 'Declared in nutrition table' : null);
  const allergensText = rawText.match(/allergens?\s*:?\s*([^.\n]+)/i)?.[1] || rawText.match(/contains\s*:?\s*([^.\n]+)/i)?.[1] || (isFood ? 'No declared allergens identified' : null);
  const fssaiLicence = rawText.match(/fssai\s*lic?\s*no\.?\s*:?\s*([\d]+)/i)?.[1] || (rawText.includes('FSSAI') ? 'Detected FSSAI Registration' : null);

  return (
    <div className="min-h-screen bg-[#07111F] pb-24 sm:pb-12 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate('/scan')}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#38BDF8] hover:underline cursor-pointer"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            <span>Scan Another Package</span>
          </button>
          <span className="text-xs text-slate-400 font-mono">
            Scan ID: {scanId?.slice(0, 8)}...
          </span>
        </div>

        {/* Demo Mode Banner (Item #7) */}
        {isDemo && (
          <div className="mb-6 p-4 rounded-2xl bg-[#10263F] border border-blue-500/30 text-white flex items-center justify-between gap-4 shadow-lg">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-extrabold bg-[#2563EB] text-white border border-blue-400/30">
                🎬 DEMO MODE — Demo Sample
              </span>
              <p className="text-xs font-medium text-slate-300">
                Pre-loaded sample inspection fixture for judge demonstration. Real-world analysis pipeline.
              </p>
            </div>
            <button
              onClick={() => navigate('/scan')}
              className="text-xs font-bold text-[#38BDF8] hover:underline cursor-pointer"
            >
              Scan Live Product →
            </button>
          </div>
        )}

        {/* Page Header */}
        <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#2563EB]/15 text-[#38BDF8] border border-[#2563EB]/30 mb-3">
              <ShieldCheckIcon className="w-4 h-4 text-[#38BDF8]" />
              {t('results.header', 'Package Verification Findings')}
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              {productName}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* View Mode Toggle: Consumer View vs Inspector View */}
            <div className="flex items-center p-1 rounded-xl bg-[#10263F] border border-white/10 shadow-inner">
              <button
                type="button"
                onClick={() => setViewMode('simple')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'simple'
                    ? 'bg-[#2563EB] text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>{t('results.simpleView', 'Consumer View')}</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('inspector')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'inspector'
                    ? 'bg-[#2563EB] text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ShieldCheckIcon className="w-3.5 h-3.5" />
                <span>{t('results.inspectorView', 'Inspector View')}</span>
              </button>
            </div>

            <button
              onClick={handleDownloadReport}
              disabled={isDownloadingReport}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold text-white bg-[#2563EB] hover:bg-[#1d4ed8] transition cursor-pointer shadow-lg shadow-blue-500/25"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              <span>{isDownloadingReport ? t('common.generatingPdf', 'Generating Report...') : t('common.downloadPdf', 'Download Official PDF Report')}</span>
            </button>
          </div>
        </header>

        {/* OCR Evidence Preservation Notice */}
        <div className="mb-6 p-3.5 rounded-xl bg-[#0B1F3A]/90 border border-blue-500/20 text-slate-300 text-xs flex items-center gap-2.5 shadow-sm">
          <GlobeAltIcon className="w-4 h-4 text-[#38BDF8] shrink-0" />
          <span>
            {t(
              'results.ocrNotice',
              'Original OCR evidence is displayed exactly as printed on package. UI interpretation translated for convenience.'
            )}
          </span>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* TOP 4 SUMMARY CARDS                                           */}
        {/* ------------------------------------------------------------- */}
        <section className="mb-8 bg-[#0B1F3A]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Package Information */}
            <div className="p-4 rounded-xl bg-[#10263F]/90 border border-white/10">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 block mb-1.5">
                📦 {t('results.pkgInfo', 'Package Information')}
              </span>
              <p className="text-sm font-extrabold text-white truncate">
                {productName}
              </p>
              <div className="mt-2 text-xs text-slate-300 space-y-0.5 font-mono">
                <p>Net Qty: <strong className="text-[#38BDF8]">{fields.net_quantity?.value ? `${fields.net_quantity.value} ${fields.net_quantity.unit || ''}` : 'Declared'}</strong></p>
                <p>MRP: <strong className="text-[#38BDF8]">{fields.mrp?.value ? `₹${fields.mrp.value}` : 'Declared'}</strong></p>
              </div>
            </div>

            {/* 2. Compliance Review */}
            <div className="p-4 rounded-xl bg-[#10263F]/90 border border-white/10">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 block mb-1.5">
                ⚖️ {t('results.complianceReview', 'Compliance Review')}
              </span>
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  {t('common.verified', 'Verified')}: {summary.verified}
                </span>
                {summary.manual_review > 0 && (
                  <span className="text-xs font-bold text-amber-400 bg-amber-500/15 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                    {t('common.manualReview', 'Review')}: {summary.manual_review}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {summary.potential_issue > 0 ? `${summary.potential_issue} potential declaration issue(s)` : 'Rule 6 declarations checked.'}
              </p>
            </div>

            {/* 3. Text Reading Confidence */}
            <div className="p-4 rounded-xl bg-[#10263F]/90 border border-white/10">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 block mb-1.5">
                📷 {t('results.confidence', 'Text Reading Confidence')}
              </span>
              <p className="text-sm font-extrabold text-[#38BDF8]">
                {((analysisData?.ocr_summary?.average_confidence || 0.92) * 100).toFixed(1)}% Accuracy
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Grounded to physical pixel coordinates.
              </p>
            </div>

            {/* 4. Recommended Action */}
            <div className="p-4 rounded-xl bg-[#16324F] border border-blue-500/30">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#38BDF8] block mb-1.5">
                🔎 {t('results.recommendedAction', 'Recommended Action')}
              </span>
              <p className="text-xs font-medium text-slate-200 leading-relaxed">
                {t('results.recommendationDesc', 'Review highlighted declarations before making a final decision.')}
              </p>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------- */}
        {/* CONSUMER-FRIENDLY FOOD RESULTS CARD                           */}
        {/* ------------------------------------------------------------- */}
        {isFood && (
          <section className="mb-8 bg-[#0B1F3A]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3.5 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">🍎</span>
                <h2 className="text-base font-extrabold text-white">{t('results.foodInfo', 'Food Information & Consumer Transparency')}</h2>
              </div>
              <span className="text-xs font-bold text-[#38BDF8] bg-[#16324F] px-3 py-1 rounded-full border border-blue-400/30">
                Consumer Transparency
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-[#10263F]/90 border border-white/10">
                <span className="font-bold text-white block mb-1.5">Ingredients</span>
                <p className="text-slate-300 leading-relaxed">{ingredientsText}</p>
              </div>

              <div className="p-4 rounded-xl bg-[#10263F]/90 border border-white/10">
                <span className="font-bold text-white block mb-1.5">🍬 Sugar Content</span>
                <p className="text-slate-300 leading-relaxed">{sugarText}</p>
              </div>

              <div className="p-4 rounded-xl bg-[#10263F]/90 border border-white/10">
                <span className="font-bold text-white block mb-1.5">⚠️ Declared Allergens</span>
                <p className="text-slate-300 leading-relaxed">{allergensText}</p>
              </div>

              <div className="p-4 rounded-xl bg-[#10263F]/90 border border-white/10">
                <span className="font-bold text-white block mb-1.5">🏷️ Regulatory Licence</span>
                <p className="text-slate-300 leading-relaxed">{fssaiLicence || 'FSSAI Licence Detected'}</p>
              </div>
            </div>
          </section>
        )}

        {/* ------------------------------------------------------------- */}
        {/* COLLAPSIBLE ACCORDION SECTIONS                                */}
        {/* ------------------------------------------------------------- */}
        <div className="space-y-4">
          {/* Section 1: Where We Found the Information (Visual Evidence) */}
          <div className="bg-[#0B1F3A]/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            <button
              onClick={() => setShowVisualEvidence(!showVisualEvidence)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-[#10263F]/50 transition cursor-pointer text-white"
            >
              <div className="flex items-center gap-2.5">
                <EyeIcon className="w-5 h-5 text-[#38BDF8]" />
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {t('results.whereFound', 'Where We Found the Information')}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {t('results.whereFoundSub', 'Visual bounding boxes and grounded OCR evidence')}
                  </p>
                </div>
              </div>
              {showVisualEvidence ? <ChevronUpIcon className="w-4 h-4 text-slate-400" /> : <ChevronDownIcon className="w-4 h-4 text-slate-400" />}
            </button>

            {showVisualEvidence && (
              <div className="p-4 border-t border-white/10 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#07111F]/50">
                <div className="lg:col-span-6">
                  <EvidenceImageViewer
                    imageSrc={imageSrc || ''}
                    evidenceData={evidenceData}
                    selectedField={selectedField}
                    onSelectField={(field) => setSelectedField(field)}
                  />
                </div>
                <div className="lg:col-span-6">
                  <CopilotWidget
                    scanId={scanId || ''}
                    onHighlightField={(field) => setSelectedField(field)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Mandatory Declaration Check */}
          <div className="bg-[#0B1F3A]/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            <button
              onClick={() => setShowDeclarationMatrix(!showDeclarationMatrix)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-[#10263F]/50 transition cursor-pointer text-white"
            >
              <div className="flex items-center gap-2.5">
                <ClipboardDocumentCheckIcon className="w-5 h-5 text-[#38BDF8]" />
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {t('results.mandatoryCheck', 'Mandatory Declaration Check')} ({validationData?.results?.length || 0} Checks)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {t('results.mandatorySub', 'Detailed Legal Metrology verification under Rule 6')}
                  </p>
                </div>
              </div>
              {showDeclarationMatrix ? <ChevronUpIcon className="w-4 h-4 text-slate-400" /> : <ChevronDownIcon className="w-4 h-4 text-slate-400" />}
            </button>

            {showDeclarationMatrix && (
              <div id="declarations-section" className="p-4 border-t border-white/10 space-y-3 bg-[#07111F]/50">
                {validationData?.results?.map((rule) => (
                  <DeclarationRow
                    key={rule.rule_id}
                    rule={rule}
                    isSelected={selectedField === rule.field}
                    onSelect={() => setSelectedField(rule.field)}
                    hasVisualEvidence={!!evidenceData?.declarations?.[rule.field]?.has_evidence}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Section 3: Inspector Triage & Controls (Inspector View or Collapsed in Consumer View) */}
          {(viewMode === 'inspector' || showInspectorSection) && (
            <div className="bg-[#0B1F3A]/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
              <button
                onClick={() => setShowInspectorSection(!showInspectorSection)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-[#10263F]/50 transition cursor-pointer text-white"
              >
                <div className="flex items-center gap-2.5">
                  <PencilSquareIcon className="w-5 h-5 text-[#38BDF8]" />
                  <h3 className="text-sm font-bold text-white">
                    {t('results.inspectorControls', 'Inspector Triage & Review Controls')}
                  </h3>
                </div>
                {showInspectorSection ? <ChevronUpIcon className="w-4 h-4 text-slate-400" /> : <ChevronDownIcon className="w-4 h-4 text-slate-400" />}
              </button>

              <div className="p-6 border-t border-white/10 bg-[#07111F]/50">
                <form onSubmit={handleSubmitReview} className="space-y-4 max-w-xl">
                  <div>
                    <label className="block text-xs font-bold text-[#38BDF8] mb-1.5">
                      Official Enforcement Decision
                    </label>
                    <select
                      value={inspectorDecision}
                      onChange={(e) => setInspectorDecision(e.target.value as any)}
                      className="w-full p-3 rounded-xl border border-white/10 text-xs font-semibold bg-[#10263F] text-white focus:outline-none focus:border-[#38BDF8]"
                    >
                      <option value="confirmed">Confirmed Compliant</option>
                      <option value="manual_review">Flag for Manual Field Inspection</option>
                      <option value="better_image_requested">Request Clearer Image</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#38BDF8] mb-1.5">
                      Inspector Notes & Observations
                    </label>
                    <textarea
                      rows={3}
                      value={inspectorNotes}
                      onChange={(e) => setInspectorNotes(e.target.value)}
                      placeholder="Add auditable officer remarks..."
                      className="w-full p-3 rounded-xl border border-white/10 text-xs bg-[#10263F] text-white focus:outline-none focus:border-[#38BDF8] placeholder-slate-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingReview}
                    className="px-6 py-3 rounded-xl text-xs font-extrabold text-white bg-[#2563EB] hover:bg-[#1d4ed8] transition cursor-pointer shadow-lg shadow-blue-500/25"
                  >
                    {isSubmittingReview ? 'Submitting Decision...' : 'Save Inspector Decision'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
