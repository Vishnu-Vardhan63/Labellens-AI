import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { Button } from '../components/ui/Button';
import { analyzeScan, validateScan } from '../api/client';
import type { ProcessingStep } from '../types';

const STAGES: ProcessingStep[] = [
  { id: 'uploaded', label: 'Image uploaded', description: 'Image received and scan session initialized.' },
  { id: 'preparing', label: 'Preparing image', description: 'Applying adaptive contrast and noise reduction.' },
  { id: 'ocr', label: 'Reading package label', description: 'Detecting text lines with PaddleOCR engine.' },
  { id: 'extracting', label: 'Extracting package information', description: 'Identifying MRP, Net Qty, dates, and manufacturer.' },
  { id: 'finishing', label: 'Preparing results', description: 'Structuring package data for inspection review.' },
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
    setCurrentStep(1); // Step 1: Preparing image

    // Visual progression timers to inform user of current activity
    const timer1 = setTimeout(() => setCurrentStep(c => Math.max(c, 2)), 800);  // Step 2: Reading label
    const timer2 = setTimeout(() => setCurrentStep(c => Math.max(c, 3)), 2000); // Step 3: Extracting

    try {
      const result = await analyzeScan(scanId);
      const validation = await validateScan(scanId).catch(err => {
        console.warn('Validation error:', err);
        return null;
      });
      clearTimeout(timer1);
      clearTimeout(timer2);

      setCurrentStep(4); // Step 4: Preparing results
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
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 text-center">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
          style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}
        >
          <ExclamationTriangleIcon className="w-6 h-6" />
        </div>
        <h1 className="text-lg font-bold mb-2" style={{ color: '#0F172A' }}>
          No image provided
        </h1>
        <p className="text-sm mb-6 max-w-xs" style={{ color: '#64748B' }}>
          Please choose or photograph a packaged commodity label to begin analysis.
        </p>
        <Button onClick={() => navigate('/scan')}>Go to Scan</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        {/* Thumbnail preview if available */}
        {preview && (
          <div
            className="w-20 h-20 mx-auto mb-6 rounded-xl overflow-hidden border shadow-sm"
            style={{ borderColor: '#E2E8F0' }}
          >
            <img
              src={preview}
              alt="Analyzing package"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <h1 className="text-xl font-bold mb-1 text-center" style={{ color: '#0F172A' }}>
          Analyzing Package
        </h1>
        <p className="text-xs text-center mb-8" style={{ color: '#64748B' }}>
          Reading label declarations using Legal Metrology compliance parser
        </p>

        {/* Error state */}
        {error ? (
          <div className="space-y-4">
            <div
              className="p-4 rounded-xl border text-sm"
              style={{ backgroundColor: '#FEF2F2', borderColor: '#FECACA', color: '#B91C1C' }}
              role="alert"
            >
              <div className="flex items-start gap-2.5">
                <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0 mt-0.5 text-error" />
                <div>
                  <p className="font-semibold text-sm mb-1" style={{ color: '#991B1B' }}>
                    Analysis could not be completed
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: '#B91C1C' }}>
                    {error}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button fullWidth onClick={handleRetry} loading={isRetrying}>
                Retry Analysis
              </Button>
              <Button variant="secondary" fullWidth onClick={() => navigate('/scan')}>
                Choose Another Image
              </Button>
            </div>
          </div>
        ) : (
          /* Staged progress indicator */
          <ol className="space-y-4" aria-label="Processing stages">
            {STAGES.map((step, index) => {
              const isCompleted = index < currentStep;
              const isActive = index === currentStep;
              const isPending = index > currentStep;

              return (
                <li key={step.id} className="flex items-start gap-4">
                  {/* Icon indicator */}
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
                    style={{
                      backgroundColor: isCompleted ? '#16A34A' : isActive ? '#2563EB' : '#F1F5F9',
                      color: isCompleted || isActive ? 'white' : '#94A3B8',
                    }}
                    aria-hidden
                  >
                    {isCompleted ? (
                      <CheckIcon className="w-4 h-4" />
                    ) : isActive ? (
                      <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin block" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-current" />
                    )}
                  </div>

                  {/* Text label */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium"
                      style={{ color: isPending ? '#94A3B8' : '#0F172A' }}
                    >
                      {step.label}
                    </p>
                    <p
                      className="text-xs mt-0.5"
                      style={{ color: isPending ? '#CBD5E1' : '#64748B' }}
                    >
                      {step.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}

