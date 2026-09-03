import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { CameraIcon, ArrowUpTrayIcon, XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
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

  // Auto-trigger mode from URL param
  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'camera') {
      // Small delay to ensure DOM is ready
      const t = setTimeout(() => cameraInputRef.current?.click(), 100);
      return () => clearTimeout(t);
    } else if (mode === 'upload') {
      const t = setTimeout(() => fileInputRef.current?.click(), 100);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
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
    <div className="min-h-screen bg-white">
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-xl font-bold mb-1" style={{ color: '#0F172A' }}>
            Scan a package
          </h1>
          <p className="text-sm" style={{ color: '#64748B' }}>
            Photograph or upload the package label clearly. Ensure all text is legible.
          </p>
        </div>

        {!state.file ? (
          // Selection UI
          <div className="space-y-3">
            {/* Camera capture */}
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="w-full flex items-center gap-4 p-5 rounded-xl border-2 border-dashed text-left transition-colors hover:border-accent hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-accent cursor-pointer"
              style={{ borderColor: '#CBD5E1' }}
              aria-label="Capture image using camera"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: '#EFF6FF' }}
              >
                <CameraIcon className="w-6 h-6" style={{ color: '#2563EB' }} aria-hidden />
              </div>
              <div>
                <p className="font-semibold text-sm mb-0.5" style={{ color: '#0F172A' }}>
                  Capture with Camera
                </p>
                <p className="text-xs" style={{ color: '#64748B' }}>
                  Use your device camera to photograph the label
                </p>
              </div>
            </button>

            {/* File upload */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              className="w-full flex items-center gap-4 p-5 rounded-xl border-2 border-dashed cursor-pointer text-left transition-colors hover:border-accent hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-accent"
              style={{ borderColor: '#CBD5E1' }}
              aria-label="Upload image from device"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: '#F0FDF4' }}
              >
                <ArrowUpTrayIcon className="w-6 h-6" style={{ color: '#16A34A' }} aria-hidden />
              </div>
              <div>
                <p className="font-semibold text-sm mb-0.5" style={{ color: '#0F172A' }}>
                  Upload from Device
                </p>
                <p className="text-xs" style={{ color: '#64748B' }}>
                  JPEG, PNG, or WebP · Max 10 MB
                </p>
              </div>
            </div>

            {/* Error */}
            {state.error && (
              <div
                className="p-3 rounded-lg border text-sm"
                style={{ backgroundColor: '#FEF2F2', borderColor: '#FECACA', color: '#DC2626' }}
                role="alert"
              >
                {state.error}
              </div>
            )}
          </div>
        ) : (
          // Preview UI
          <div className="space-y-4">
            {/* Image preview */}
            <div className="relative rounded-xl overflow-hidden border" style={{ borderColor: '#E2E8F0' }}>
              <img
                src={state.preview!}
                alt="Selected package label"
                className="w-full object-contain max-h-80 bg-surface"
              />
              <button
                onClick={handleRemove}
                disabled={isUploading}
                className="absolute top-3 right-3 w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                style={{ backgroundColor: 'rgba(0,0,0,0.55)', color: 'white' }}
                aria-label="Remove selected image"
              >
                <XMarkIcon className="w-4 h-4" aria-hidden />
              </button>
            </div>

            {/* File info */}
            <div
              className="flex items-center justify-between p-3 rounded-lg border"
              style={{ backgroundColor: '#F8F9FA', borderColor: '#E2E8F0' }}
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: '#0F172A' }}>
                  {state.file.name}
                </p>
                <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>
                  {formatFileSize(state.file.size)}
                </p>
              </div>
              <button
                onClick={handleRemove}
                disabled={isUploading}
                className="ml-3 text-xs flex items-center gap-1 flex-shrink-0 cursor-pointer"
                style={{ color: '#64748B' }}
                aria-label="Replace image"
              >
                <ArrowPathIcon className="w-3.5 h-3.5" aria-hidden />
                Replace
              </button>
            </div>

            {/* Error */}
            {state.error && (
              <div
                className="p-3 rounded-lg border text-sm"
                style={{ backgroundColor: '#FEF2F2', borderColor: '#FECACA', color: '#DC2626' }}
                role="alert"
              >
                {state.error}
              </div>
            )}

            {/* Continue button */}
            <Button
              size="lg"
              fullWidth
              onClick={handleContinue}
              loading={isUploading}
              disabled={isUploading}
            >
              {isUploading ? 'Uploading…' : 'Continue'}
            </Button>

            <p className="text-xs text-center" style={{ color: '#64748B' }}>
              The image will be sent to the server for processing.
            </p>
          </div>
        )}

        {/* Hidden inputs */}
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

      {/* Mobile bottom padding */}
      <div className="h-20 sm:hidden" aria-hidden />
    </div>
  );
}
