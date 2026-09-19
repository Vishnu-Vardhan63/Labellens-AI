import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  PlayIcon,
  FilmIcon,
} from '@heroicons/react/24/outline';
import { Button } from '../components/ui/Button';
import { validateImageFile, formatFileSize } from '../utils/fileValidation';
import { uploadImage } from '../api/client';
import { LiveCamera } from '../components/camera/LiveCamera';
import { DemoGuideModal } from '../components/demo/DemoGuideModal';
import type { UploadState } from '../types';

export default function ScanPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [state, setState] = useState<UploadState>({
    file: null,
    preview: null,
    status: 'idle',
    error: null,
    response: null,
  });

  const [isDragOver, setIsDragOver] = useState(false);
  const [showLiveCamera, setShowLiveCamera] = useState(false);

  // Verified Demo Scan IDs
  const DEMO_SCAN_ID = '9e573e39-0695-445a-846e-53195cf08716';

  // Auto-trigger mode from URL param
  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'camera') {
      setShowLiveCamera(true);
    } else if (mode === 'upload') {
      const t = setTimeout(() => fileInputRef.current?.click(), 150);
      return () => clearTimeout(t);
    }
  }, [searchParams]);

  const handleFile = useCallback((file: File) => {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setState((s) => ({ ...s, error: validation.error ?? 'Invalid file.', file: null, preview: null }));
      return;
    }
    const preview = URL.createObjectURL(file);
    setState((s) => ({ ...s, file, preview, error: null, status: 'idle' }));
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
    setState((s) => ({ ...s, status: 'uploading', error: null }));

    try {
      const uploadRes = await uploadImage(state.file);
      setState((s) => ({ ...s, status: 'success', response: uploadRes }));
      navigate('/processing', {
        state: {
          scanId: uploadRes.image_id,
          filename: uploadRes.original_filename,
          preview: state.preview,
        },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setState((s) => ({ ...s, status: 'error', error: msg }));
    }
  };

  // Multi-panel captures callback from LiveCamera component
  const handleCapturesComplete = async (files: File[], primaryFile: File) => {
    setShowLiveCamera(false);
    const preview = URL.createObjectURL(primaryFile);
    setState({ file: primaryFile, preview, status: 'uploading', error: null, response: null });

    try {
      const uploadRes = await uploadImage(primaryFile);
      setState((s) => ({ ...s, status: 'success', response: uploadRes }));
      navigate('/processing', {
        state: {
          scanId: uploadRes.image_id,
          filename: uploadRes.original_filename,
          preview: preview,
        },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to upload captured package.';
      setState((s) => ({ ...s, status: 'error', error: msg }));
    }
  };

  const isUploading = state.status === 'uploading';

  return (
    <div className="min-h-screen bg-[#07111F] text-slate-100 py-10 sm:py-14">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Centered Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#2563EB]/15 text-[#38BDF8] border border-[#2563EB]/30 mb-4 shadow-sm">
            <ShieldCheckIcon className="w-4 h-4 text-[#38BDF8]" />
            <span>Inspection Ingestion Portal</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
            {t('scan.title', 'Scan a Packaged Commodity')}
          </h1>
          <p className="text-sm sm:text-base text-slate-400 mt-2 max-w-lg mx-auto leading-relaxed">
            {t('scan.subtitle', 'Upload or capture package panels for AI-assisted declaration analysis and Legal Metrology compliance verification.')}
          </p>

          {/* Quick Demo CTA & Guide Modal */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={() => navigate(`/results?scan_id=${DEMO_SCAN_ID}&demo=true`)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-[#38BDF8] bg-[#10263F] border border-[#2563EB]/40 hover:bg-[#16324F] hover:border-[#38BDF8] transition cursor-pointer shadow-md"
            >
              <SparklesIcon className="w-4 h-4 text-[#38BDF8]" />
              <span>🎬 DEMO MODE — Pre-tested Sample Package</span>
            </button>
            <DemoGuideModal />
          </div>
        </div>

        {/* Live Camera Viewport Modal / Container */}
        {showLiveCamera ? (
          <LiveCamera
            onCapturesComplete={handleCapturesComplete}
            onCancel={() => setShowLiveCamera(false)}
          />
        ) : (
          <>
            {/* HOW TO CAPTURE GUIDANCE */}
            <div className="bg-[#0B1F3A]/70 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-xl mb-6">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#38BDF8] mb-3.5 flex items-center gap-2">
                <DocumentMagnifyingGlassIcon className="w-4 h-4 text-[#38BDF8]" />
                <span>How to Capture a Package</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-[#10263F]/80 border border-white/10 rounded-xl">
                  <span className="w-5 h-5 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-[10px] font-bold mb-1.5">
                    1
                  </span>
                  <p className="font-bold text-white mb-0.5">Front Panel</p>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Brand, product name, and net quantity declarations.
                  </p>
                </div>
                <div className="p-3 bg-[#10263F]/80 border border-white/10 rounded-xl">
                  <span className="w-5 h-5 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-[10px] font-bold mb-1.5">
                    2
                  </span>
                  <p className="font-bold text-white mb-0.5">Back / Side Panel</p>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    MRP, Mfg date, packer details, and consumer care info.
                  </p>
                </div>
                <div className="p-3 bg-[#10263F]/80 border border-white/10 rounded-xl">
                  <span className="w-5 h-5 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-[10px] font-bold mb-1.5">
                    3
                  </span>
                  <p className="font-bold text-white mb-0.5">Automated Check</p>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    AI extracts declarations and maps visual evidence.
                  </p>
                </div>
                <div className="p-3 bg-[#10263F]/80 border border-white/10 rounded-xl">
                  <span className="w-5 h-5 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-[10px] font-bold mb-1.5">
                    4
                  </span>
                  <p className="font-bold text-white mb-0.5">Inspector Review</p>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Officer verifies findings and confirms official decision.
                  </p>
                </div>
              </div>
            </div>

            {/* Main Upload / Camera Choice Card */}
            <div className="bg-[#0B1F3A]/70 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 shadow-xl mb-8">
              {!state.file ? (
                <div className="space-y-6">
                  {/* Start Live Camera Primary CTA */}
                  <div className="p-6 rounded-2xl bg-[#10263F]/90 border border-white/10 text-center">
                    <h3 className="text-base font-extrabold text-white mb-1">
                      Real-Time Live Camera Scanner
                    </h3>
                    <p className="text-xs text-slate-400 max-w-md mx-auto mb-4 leading-relaxed">
                      Position your device camera over package panels to capture live images with real-time framing guidance.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowLiveCamera(true)}
                      className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl text-sm font-extrabold text-white bg-[#2563EB] hover:bg-[#1d4ed8] active:bg-[#1e40af] shadow-lg shadow-blue-500/25 transition transform hover:scale-[1.02] cursor-pointer"
                    >
                      <CameraIcon className="w-5 h-5" />
                      <span>📷 START LIVE CAMERA</span>
                    </button>
                  </div>

                  {/* Divider */}
                  <div className="flex items-center gap-3">
                    <hr className="flex-1 border-white/10" />
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Or Upload File</span>
                    <hr className="flex-1 border-white/10" />
                  </div>

                  {/* Drop File Area */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={[
                      'relative flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center select-none',
                      isDragOver
                        ? 'border-[#38BDF8] bg-[#2563EB]/15 scale-[1.01]'
                        : 'border-white/15 bg-[#10263F]/40 hover:border-[#2563EB] hover:bg-[#10263F]/70',
                    ].join(' ')}
                    aria-label="Upload package label image"
                  >
                    <div className="w-12 h-12 rounded-xl bg-[#2563EB]/20 border border-[#2563EB]/30 shadow-md flex items-center justify-center mb-3 text-[#38BDF8]">
                      <ArrowUpTrayIcon className="w-6 h-6 text-[#38BDF8]" />
                    </div>
                    <h3 className="text-sm font-bold text-white mb-1">
                      Drop package image here
                    </h3>
                    <p className="text-xs text-slate-400 mb-3">
                      or <span className="text-[#38BDF8] font-semibold underline">browse files</span> from your device
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                      <span>JPEG • PNG • WEBP • HEIC</span>
                      <span>•</span>
                      <span>Max 10 MB</span>
                    </div>
                  </div>

                  {/* Error Message */}
                  {state.error && (
                    <div
                      className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium flex items-center gap-2"
                      role="alert"
                    >
                      <InformationCircleIcon className="w-4 h-4 flex-shrink-0 text-rose-400" />
                      <span>{state.error}</span>
                    </div>
                  )}
                </div>
              ) : (
                /* Preview & Confirmation UI */
                <div className="space-y-5">
                  <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black/40">
                    <img
                      src={state.preview!}
                      alt="Selected package label"
                      className="w-full object-contain max-h-80 mx-auto"
                    />
                    <button
                      type="button"
                      onClick={handleRemove}
                      disabled={isUploading}
                      className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-black/70 hover:bg-black/90 text-white flex items-center justify-center transition cursor-pointer border border-white/10"
                      aria-label="Remove image"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>

                  {/* File Info Card */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#10263F]/80 border border-white/10">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate">
                        {state.file.name}
                      </p>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">
                        {formatFileSize(state.file.size)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemove}
                      disabled={isUploading}
                      className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer ml-3"
                    >
                      <ArrowPathIcon className="w-3.5 h-3.5 text-[#38BDF8]" />
                      <span>Replace</span>
                    </button>
                  </div>

                  {/* Primary Ingestion Action */}
                  <button
                    type="button"
                    onClick={handleContinue}
                    disabled={isUploading}
                    className="w-full py-3.5 px-4 rounded-xl text-sm font-extrabold text-white bg-[#2563EB] hover:bg-[#1d4ed8] active:bg-[#1e40af] shadow-lg shadow-blue-500/25 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isUploading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Uploading Package Image...</span>
                      </>
                    ) : (
                      <span>ANALYZE PACKAGE →</span>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Tips for Better Results */}
            <section className="bg-[#0B1F3A]/70 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-4">
                Tips for accurate inspection results
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#10263F]/80 border border-white/5">
                  <CheckCircleIcon className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Capture the physical package label clearly under good lighting.</span>
                </div>
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#10263F]/80 border border-white/5">
                  <CheckCircleIcon className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Avoid reflections, plastic shadows, and glare over small fonts.</span>
                </div>
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#10263F]/80 border border-white/5">
                  <CheckCircleIcon className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Ensure mandatory declarations (MRP, Net Qty, Mfg) are legible.</span>
                </div>
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#10263F]/80 border border-white/5">
                  <CheckCircleIcon className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Front and back panels often carry different declarations.</span>
                </div>
              </div>
            </section>
          </>
        )}

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          className="sr-only"
          onChange={handleFileInput}
          aria-label="File upload input"
        />
      </div>
    </div>
  );
}
