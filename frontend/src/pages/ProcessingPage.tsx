import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  CheckIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { analyzeScan, validateScan } from '../api/client';
import type { ProcessingStep } from '../types';

const TIMELINE_STAGES: ProcessingStep[] = [
  { id: 'uploaded', label: 'Image received', description: 'Package image validated and stored in inspection database.' },
  { id: 'preparing', label: 'Preparing package image', description: 'Applying adaptive contrast, orientation check, and noise reduction.' },
  { id: 'ocr', label: 'Reading visible text', description: 'Executing ONNX text detection and character recognition.' },
  { id: 'identifying', label: 'Identifying package information', description: 'Screening multi-signal indicators and package typography.' },
  { id: 'extracting', label: 'Extracting declarations', description: 'Parsing Rule 6 mandatory fields (MRP, Net Quantity, Manufacturer, Dates).' },
  { id: 'reviewing', label: 'Reviewing compliance evidence', description: 'Grounded compliance screening under Legal Metrology Rules, 2011.' },
];

export default function ProcessingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as {
    scanId?: string;
    filename?: string;
    preview?: string;
  } | null;

  const [currentStep, setCurrentStep] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);
  const hasTriggeredRef = useRef(false);

  const scanId = state?.scanId;
  const preview = state?.preview;

  const runAnalysis = useCallback(async () => {
    if (!scanId) {
      setError('No active scan session found. Please upload a package image first.');
      return;
    }

    setError(null);
    setCurrentStep(1); // Preparing package image

    const timer1 = setTimeout(() => setCurrentStep(c => Math.max(c, 2)), 600);   // Reading visible text
    const timer2 = setTimeout(() => setCurrentStep(c => Math.max(c, 3)), 1400);  // Identifying package info
    const timer3 = setTimeout(() => setCurrentStep(c => Math.max(c, 4)), 2200);  // Extracting declarations

    try {
      const result = await analyzeScan(scanId);
      const validation = await validateScan(scanId).catch(err => {
        console.warn('Validation error:', err);
        return null;
      });

      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);

      setCurrentStep(5); // Reviewing compliance evidence

      setTimeout(() => {
        navigate('/results', {
          state: {
            analysis: result,
            validation: validation,
            preview: preview,
            scanId: scanId,
          },
          replace: true,
        });
      }, 700);
    } catch (err: unknown) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      const msg = err instanceof Error ? err.message : 'Analysis failed.';
      setError(
        msg.includes('404')
          ? 'Scan session was not found. Please upload the image again.'
          : "We couldn't complete the package analysis. Please try again with a clearer image or retry the analysis."
      );
    } finally {
      setIsRetrying(false);
    }
  }, [scanId, preview, navigate]);

  useEffect(() => {
    if (!hasTriggeredRef.current && scanId) {
      hasTriggeredRef.current = true;
      runAnalysis();
    }
  }, [scanId, runAnalysis]);

  const handleRetry = () => {
    setIsRetrying(true);
    setCurrentStep(0);
    runAnalysis();
  };

  if (!scanId) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex flex-col items-center justify-center px-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 border border-rose-200">
          <ExclamationTriangleIcon className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-[#172033] mb-1">
          No Package Ingestion Session Found
        </h2>
        <p className="text-sm text-[#667085] mb-6 max-w-sm">
          Please upload a packaged commodity image to begin automated compliance screening.
        </p>
        <button
          onClick={() => navigate('/scan')}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#163A5F] hover:bg-[#1f4f82] transition cursor-pointer"
        >
          Go to Scan Package
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#172033] py-12 px-4 flex flex-col items-center justify-center">
      <div className="w-full max-w-lg">
        {/* Card Container */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-xs">
          {/* Header */}
          <div className="text-center mb-8 pb-6 border-b border-[#E2E8F0]">
            <div className="w-11 h-11 rounded-2xl bg-[#163A5F]/8 text-[#163A5F] flex items-center justify-center mx-auto mb-3 shadow-2xs">
              <ShieldCheckIcon className="w-6 h-6 text-[#163A5F]" />
            </div>
            <h1 className="text-xl font-bold text-[#172033] tracking-tight">
              Analyzing Package Label
            </h1>
            <p className="text-xs sm:text-sm text-[#667085] mt-1">
              Evaluating declarations against Legal Metrology Rules, 2011.
            </p>
            {state?.filename && (
              <span className="inline-block mt-2 font-mono text-[11px] text-[#667085] bg-[#F5F7FA] px-2.5 py-1 rounded-md border border-[#E2E8F0]">
                {state.filename}
              </span>
            )}
          </div>

          {/* Timeline Stages */}
          <ol className="space-y-4" aria-label="Inspection progress stages">
            {TIMELINE_STAGES.map((stage, idx) => {
              const isDone = idx < currentStep;
              const isCurrent = idx === currentStep;
              const isPending = idx > currentStep;

              return (
                <li key={stage.id} className="flex items-start gap-4">
                  {/* Status Indicator Icon */}
                  <div className="flex-shrink-0 mt-0.5">
                    {isDone ? (
                      <div className="w-6 h-6 rounded-full bg-[#16A34A] text-white flex items-center justify-center shadow-2xs">
                        <CheckIcon className="w-3.5 h-3.5 stroke-3" />
                      </div>
                    ) : isCurrent ? (
                      <div className="w-6 h-6 rounded-full bg-[#2563EB] text-white flex items-center justify-center shadow-xs">
                        <span className="w-2.5 h-2.5 border-2 border-white border-t-transparent rounded-full animate-spin block" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 text-slate-400 flex items-center justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                      </div>
                    )}
                  </div>

                  {/* Stage Text */}
                  <div className="min-w-0 flex-1">
                    <p
                      className={[
                        'text-sm font-semibold leading-tight',
                        isDone
                          ? 'text-[#172033]'
                          : isCurrent
                          ? 'text-[#2563EB] font-bold'
                          : 'text-slate-400',
                      ].join(' ')}
                    >
                      {stage.label}
                    </p>
                    <p
                      className={[
                        'text-xs mt-0.5 leading-relaxed',
                        isPending ? 'text-slate-400' : 'text-[#667085]',
                      ].join(' ')}
                    >
                      {stage.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>

          {/* Error & Retry State */}
          {error && (
            <div className="mt-6 pt-6 border-t border-[#E2E8F0] space-y-4">
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
                <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed">{error}</p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleRetry}
                  disabled={isRetrying}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-[#163A5F] hover:bg-[#1f4f82] transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <ArrowPathIcon className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
                  <span>{isRetrying ? 'Retrying...' : 'Retry Analysis'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/scan')}
                  className="py-2.5 px-4 rounded-xl text-xs font-semibold text-[#172033] bg-white border border-[#E2E8F0] hover:bg-[#F5F7FA] transition cursor-pointer"
                >
                  Back to Scan
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
