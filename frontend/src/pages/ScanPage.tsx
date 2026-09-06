import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  CameraIcon,
  ArrowUpTrayIcon,
  XMarkIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  PhotoIcon,
  InformationCircleIcon,
  SparklesIcon,
  DocumentMagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { Button } from '../components/ui/Button';
import { validateImageFile, formatFileSize } from '../utils/fileValidation';
import { uploadImage } from '../api/client';
import type { UploadState } from '../types';

export default function ScanPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [state, setState] = useState<UploadState>({
    file: null,
    preview: null,
    status: 'idle',
    error: null,
    response: null,
  });

  const [isDragOver, setIsDragOver] = useState(false);

  // Sample inspection scan ID (verified demo package)
  const DEMO_SCAN_ID = '9e573e39-0695-445a-846e-53195cf08716';

  // Auto-trigger mode from URL param
  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'camera') {
      const t = setTimeout(() => cameraInputRef.current?.click(), 150);
      return () => clearTimeout(t);
    } else if (mode === 'upload') {
      const t = setTimeout(() => fileInputRef.current?.click(), 150);
      return () => clearTimeout(t);
    }
  }, [searchParams]);

  const handleFile = useCallback((file: File) => {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setState(s => ({ ...s, error: validation.error ?? 'Invalid file.', file: null, preview: null }));
      return;
    }
    const preview = URL.createObjectURL(file);
    setState(s => ({ ...s, file, preview, error: null, status: 'idle' }));
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleRemove = () => {
    if (state.preview) URL.revokeObjectURL(state.preview);
    setState({ file: null, preview: null, status: 'idle', error: null, response: null });
  };

  const handleContinue = async () => {
    if (!state.file) return;
    setState(s => ({ ...s, status: 'uploading', error: null }));

    try {
      const uploadRes = await uploadImage(state.file);
      setState(s => ({ ...s, status: 'success', response: uploadRes }));
      navigate('/processing', {
        state: {
          scanId: uploadRes.image_id,
          filename: uploadRes.original_filename,
          preview: state.preview,
        },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setState(s => ({ ...s, status: 'error', error: msg }));
    }
  };

  const isUploading = state.status === 'uploading';

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#172033] py-10 sm:py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        {/* Centered Workflow Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#163A5F]/8 text-[#163A5F] mb-3">
            <ShieldCheckIcon className="w-4 h-4 text-[#163A5F]" />
            <span>Inspection Ingestion Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#172033]">
            Scan a Packaged Commodity
          </h1>
          <p className="text-sm sm:text-base text-[#667085] mt-2 max-w-lg mx-auto leading-relaxed">
            Upload or capture a package label for AI-assisted declaration analysis and Legal Metrology compliance verification.
          </p>

          {/* Quick Demo CTA for judges */}
          <div className="mt-4 flex items-center justify-center">
            <button
              type="button"
              onClick={() => navigate(`/results?scan_id=${DEMO_SCAN_ID}&demo=true`)}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold text-accent bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer shadow-2xs"
            >
              <SparklesIcon className="w-3.5 h-3.5 text-accent" />
              <span>Try Sample Inspection (Pre-tested Demo) →</span>
            </button>
          </div>
        </div>

        {/* HOW TO CAPTURE A PACKAGE GUIDANCE */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#163A5F] mb-3 flex items-center gap-1.5">
            <DocumentMagnifyingGlassIcon className="w-4 h-4 text-accent" />
            <span>How to Capture a Package</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
              <span className="w-5 h-5 rounded-full bg-[#163A5F] text-white flex items-center justify-center text-[10px] font-bold mb-1.5">
                1
              </span>
              <p className="font-semibold text-slate-900 mb-0.5">Front Panel</p>
              <p className="text-[11px] text-slate-500 leading-normal">
                Brand, product name, and net quantity declarations.
              </p>
            </div>
            <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
              <span className="w-5 h-5 rounded-full bg-[#163A5F] text-white flex items-center justify-center text-[10px] font-bold mb-1.5">
                2
              </span>
              <p className="font-semibold text-slate-900 mb-0.5">Back / Side Panel</p>
              <p className="text-[11px] text-slate-500 leading-normal">
                MRP, Mfg date, packer details, and consumer care info.
              </p>
            </div>
            <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
              <span className="w-5 h-5 rounded-full bg-[#163A5F] text-white flex items-center justify-center text-[10px] font-bold mb-1.5">
                3
              </span>
              <p className="font-semibold text-slate-900 mb-0.5">Automated Check</p>
              <p className="text-[11px] text-slate-500 leading-normal">
                AI extracts declarations and maps visual evidence.
              </p>
            </div>
            <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
              <span className="w-5 h-5 rounded-full bg-[#163A5F] text-white flex items-center justify-center text-[10px] font-bold mb-1.5">
                4
              </span>
              <p className="font-semibold text-slate-900 mb-0.5">Inspector Review</p>
              <p className="text-[11px] text-slate-500 leading-normal">
                Officer verifies findings and confirms official decision.
              </p>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-2.5 italic">
            * Note: Package panels are processed as independent scans. If a front panel is missing back-panel declarations, the system intelligently flags it as "Partial Panel Evidence".
          </p>
        </div>

        {/* Main Card Container */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-xs mb-8">
          {!state.file ? (
            <div className="space-y-6">
              {/* Large Interactive Upload Area */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={[
                  'relative flex flex-col items-center justify-center p-8 sm:p-12 rounded-xl border-2 border-dashed transition-all cursor-pointer text-center select-none',
                  isDragOver
                    ? 'border-[#2563EB] bg-blue-50/50 scale-[1.01]'
                    : 'border-[#CBD5E1] bg-[#F8F9FA] hover:border-[#2563EB] hover:bg-blue-50/20',
                ].join(' ')}
                aria-label="Upload package label image"
              >
                <div className="w-14 h-14 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs flex items-center justify-center mb-4 text-[#163A5F] transition-transform group-hover:scale-105">
                  <ArrowUpTrayIcon className="w-7 h-7 text-[#2563EB]" />
                </div>
                <h3 className="text-base font-semibold text-[#172033] mb-1">
                  Drop package image here
                </h3>
                <p className="text-xs text-[#667085] mb-4">
                  or <span className="text-[#2563EB] font-semibold underline underline-offset-2">browse files</span> from your device
                </p>

                <div className="flex items-center gap-3 text-[11px] text-[#667085] font-mono">
                  <span>JPG • PNG • WEBP</span>
                  <span>•</span>
                  <span>Max 10 MB</span>
                </div>
              </div>

              {/* Action Buttons: Camera Capture vs Browse */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl border border-[#E2E8F0] bg-white text-[#172033] text-sm font-semibold hover:bg-slate-50 hover:border-slate-300 active:bg-slate-100 transition-all cursor-pointer shadow-2xs"
                >
                  <CameraIcon className="w-5 h-5 text-[#2563EB]" />
                  <span>Use Device Camera</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl border border-[#E2E8F0] bg-white text-[#172033] text-sm font-semibold hover:bg-slate-50 hover:border-slate-300 active:bg-slate-100 transition-all cursor-pointer shadow-2xs"
                >
                  <PhotoIcon className="w-5 h-5 text-[#163A5F]" />
                  <span>Choose Image File</span>
                </button>
              </div>

              {/* Error Message */}
              {state.error && (
                <div
                  className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2"
                  role="alert"
                >
                  <InformationCircleIcon className="w-4 h-4 flex-shrink-0" />
                  <span>{state.error}</span>
                </div>
              )}
            </div>
          ) : (
            // Preview & Inspection Confirmation UI
            <div className="space-y-5">
              <div className="relative rounded-xl overflow-hidden border border-[#E2E8F0] bg-[#172033]/5">
                <img
                  src={state.preview!}
                  alt="Selected package label"
                  className="w-full object-contain max-h-80 mx-auto"
                />
                <button
                  type="button"
                  onClick={handleRemove}
                  disabled={isUploading}
                  className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors cursor-pointer shadow-sm"
                  aria-label="Remove image"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>

              {/* File Info Card */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#F5F7FA] border border-[#E2E8F0]">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#172033] truncate">
                    {state.file.name}
                  </p>
                  <p className="text-xs text-[#667085] font-mono mt-0.5">
                    {formatFileSize(state.file.size)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRemove}
                  disabled={isUploading}
                  className="text-xs font-semibold text-[#667085] hover:text-[#172033] flex items-center gap-1 cursor-pointer ml-3"
                >
                  <ArrowPathIcon className="w-3.5 h-3.5" />
                  <span>Replace</span>
                </button>
              </div>

              {/* Error Alert */}
              {state.error && (
                <div
                  className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2"
                  role="alert"
                >
                  <InformationCircleIcon className="w-4 h-4 flex-shrink-0" />
                  <span>{state.error}</span>
                </div>
              )}

              {/* Primary Ingestion Action */}
              <button
                type="button"
                onClick={handleContinue}
                disabled={isUploading}
                className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-[#163A5F] hover:bg-[#1f4f82] active:bg-[#122e4c] shadow-sm transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isUploading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Uploading Package Image...</span>
                  </>
                ) : (
                  <span>Continue to Declaration Analysis →</span>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Tips for Better Results Section */}
        <section className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#667085] mb-4">
            Tips for accurate inspection results
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#172033]">
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[#F5F7FA]">
              <CheckCircleIcon className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
              <span>Capture the physical package label clearly under good lighting.</span>
            </div>
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[#F5F7FA]">
              <CheckCircleIcon className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
              <span>Avoid reflections, plastic shadows, and glare over small fonts.</span>
            </div>
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[#F5F7FA]">
              <CheckCircleIcon className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
              <span>Ensure mandatory declarations (MRP, Net Qty, Mfg) are legible.</span>
            </div>
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[#F5F7FA]">
              <CheckCircleIcon className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
              <span>Front and back panels often carry different declarations.</span>
            </div>
          </div>
        </section>

        {/* Hidden Inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          className="sr-only"
          onChange={handleFileInput}
          aria-label="File upload input"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={handleFileInput}
          aria-label="Camera capture input"
        />
      </div>
    </div>
  );
}
