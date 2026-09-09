import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  CameraIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XMarkIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  PhotoIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

export interface CapturedPanel {
  id: string;
  type: 'front' | 'back' | 'nutrition';
  label: string;
  file: File;
  previewUrl: string;
}

interface LiveCameraProps {
  onCapturesComplete: (files: File[], primaryFile: File) => void;
  onCancel: () => void;
}

export function LiveCamera({ onCapturesComplete, onCancel }: LiveCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  const [capturedPanels, setCapturedPanels] = useState<CapturedPanel[]>([]);
  const [activePanelType, setActivePanelType] = useState<'front' | 'back' | 'nutrition'>('front');

  // Stop camera stream helper
  const stopCameraStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  }, [stream]);

  // Start camera stream
  const startCamera = useCallback(async (deviceId?: string, mode?: 'environment' | 'user') => {
    setCameraError(null);
    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId } }
          : { facingMode: mode || facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);
      setIsCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        videoRef.current.play().catch(console.warn);
      }

      // Enumerate available video inputs
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((d) => d.kind === 'videoinput');
      setAvailableDevices(videoDevices);
    } catch (err: unknown) {
      console.error('Camera access error:', err);
      const msg = err instanceof Error ? err.message : 'Camera access failed';
      setCameraError(
        `Unable to access live camera (${msg}). Please check browser permissions or switch to file upload.`
      );
      setIsCameraActive(false);
    }
  }, [stream, facingMode]);

  // Auto-start camera on mount
  useEffect(() => {
    startCamera();
    return () => {
      stopCameraStream();
    };
  }, []);

  // Switch camera front/back
  const handleSwitchCamera = () => {
    const newMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newMode);
    startCamera(undefined, newMode);
  };

  // Capture current frame
  const handleCaptureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) return;

      const filename = `package_${activePanelType}_${Date.now()}.jpg`;
      const capturedFile = new File([blob], filename, { type: 'image/jpeg' });
      const previewUrl = URL.createObjectURL(blob);

      const panelLabel =
        activePanelType === 'front'
          ? 'Front Panel'
          : activePanelType === 'back'
          ? 'Back Panel'
          : 'Nutrition / Ingredients';

      const newPanel: CapturedPanel = {
        id: `${activePanelType}_${Date.now()}`,
        type: activePanelType,
        label: panelLabel,
        file: capturedFile,
        previewUrl,
      };

      setCapturedPanels((prev) => {
        // Replace existing panel of same type or add
        const filtered = prev.filter((p) => p.type !== activePanelType);
        return [...filtered, newPanel];
      });

      // Automatically advance to next panel type
      if (activePanelType === 'front') {
        setActivePanelType('back');
      } else if (activePanelType === 'back') {
        setActivePanelType('nutrition');
      }
    }, 'image/jpeg', 0.92);
  };

  // Remove panel
  const handleRemovePanel = (panelId: string) => {
    setCapturedPanels((prev) => {
      const target = prev.find((p) => p.id === panelId);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((p) => p.id !== panelId);
    });
  };

  // Submit captures for analysis
  const handleAnalyzeCaptured = () => {
    if (capturedPanels.length === 0) return;

    stopCameraStream();

    const files = capturedPanels.map((p) => p.file);
    // Primary file is front panel or first captured panel
    const primary = capturedPanels.find((p) => p.type === 'front')?.file || files[0];

    onCapturesComplete(files, primary);
  };

  const frontCaptured = capturedPanels.some((p) => p.type === 'front');
  const backCaptured = capturedPanels.some((p) => p.type === 'back');
  const nutritionCaptured = capturedPanels.some((p) => p.type === 'nutrition');

  return (
    <div className="bg-[#0B1F3A]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6 shadow-2xl max-w-3xl mx-auto text-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#2563EB]/20 text-[#38BDF8] flex items-center justify-center border border-[#2563EB]/30">
            <CameraIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Live Camera Scanner</h3>
            <p className="text-xs text-slate-400">
              Position package label inside frame & capture required panels
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            stopCameraStream();
            onCancel();
          }}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          aria-label="Close Camera"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Hidden Canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Main Viewport & Guidance */}
      {cameraError ? (
        <div className="p-6 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center my-4">
          <ExclamationTriangleIcon className="w-8 h-8 text-amber-400 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-amber-300 mb-1">Camera Access Notice</h4>
          <p className="text-xs text-amber-200/80 max-w-md mx-auto mb-4">{cameraError}</p>
          <button
            onClick={() => startCamera()}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#2563EB] hover:bg-[#1d4ed8] shadow-lg shadow-blue-500/20 cursor-pointer"
          >
            Retry Camera Access
          </button>
        </div>
      ) : (
        <div className="relative bg-black rounded-xl overflow-hidden shadow-inner aspect-[4/3] sm:aspect-[16/9] flex items-center justify-center border border-white/10">
          <video
            ref={videoRef}
            playsInline
            muted
            className="w-full h-full object-cover"
          />

          {/* Camera Frame Overlay Guidance */}
          <div className="absolute inset-4 sm:inset-8 border-2 border-dashed border-[#38BDF8]/60 rounded-xl pointer-events-none flex flex-col justify-between p-3">
            <div className="flex justify-between items-start">
              <span className="bg-[#07111F]/80 backdrop-blur-md text-[#38BDF8] text-[11px] font-mono font-bold px-3 py-1 rounded-lg border border-[#38BDF8]/30">
                TARGET: {activePanelType.toUpperCase()} PANEL
              </span>
              <span className="bg-[#2563EB] text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-md">
                LIVE
              </span>
            </div>

            {/* Guidance Overlay */}
            <div className="bg-[#07111F]/90 backdrop-blur-md text-white text-center rounded-xl p-2.5 max-w-xs mx-auto border border-white/15">
              <p className="text-xs font-bold text-[#38BDF8]">Capture Guidance</p>
              <p className="text-[11px] text-slate-300 mt-0.5">
                • Keep package inside frame &bull; Move closer for text &bull; Reduce glare
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Camera Controls Bar */}
      <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-white/10">
        <div className="flex items-center gap-2">
          {availableDevices.length > 1 && (
            <button
              type="button"
              onClick={handleSwitchCamera}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#10263F] text-slate-200 hover:bg-[#16324F] border border-white/10 transition cursor-pointer"
            >
              <ArrowPathIcon className="w-4 h-4 text-[#38BDF8]" />
              <span>Flip Camera</span>
            </button>
          )}

          {!isCameraActive && !cameraError && (
            <button
              type="button"
              onClick={() => startCamera()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#2563EB] hover:bg-[#1d4ed8] shadow-lg shadow-blue-500/20 cursor-pointer"
            >
              <CameraIcon className="w-4 h-4" />
              <span>Start Camera</span>
            </button>
          )}
        </div>

        {/* Capture Snapshot Button */}
        {isCameraActive && (
          <button
            type="button"
            onClick={handleCaptureFrame}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold text-white bg-[#2563EB] hover:bg-[#1d4ed8] shadow-lg shadow-blue-500/25 transition transform active:scale-95 cursor-pointer"
          >
            <CameraIcon className="w-4.5 h-4.5" />
            <span>CAPTURE {activePanelType.toUpperCase()}</span>
          </button>
        )}
      </div>

      {/* Multi-Panel Progress List */}
      <div className="mt-6 bg-[#10263F]/70 border border-white/10 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#38BDF8]">
            PACKAGE CAPTURE PROGRESS
          </h4>
          <span className="text-xs text-slate-400 font-mono">
            {capturedPanels.length} Panel(s) Captured
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          {/* Front Panel Step */}
          <div
            className={`p-3 rounded-xl border transition-all ${
              frontCaptured
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : activePanelType === 'front'
                ? 'bg-[#16324F] border-[#38BDF8] ring-2 ring-[#38BDF8]/20'
                : 'bg-[#0B1F3A]/60 border-white/5'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-white">1. Front Panel</span>
              {frontCaptured ? (
                <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
              ) : (
                <span className="text-[10px] text-amber-400 font-bold uppercase">Required</span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">Brand & Identity panel</p>
          </div>

          {/* Back Panel Step */}
          <div
            className={`p-3 rounded-xl border transition-all ${
              backCaptured
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : activePanelType === 'back'
                ? 'bg-[#16324F] border-[#38BDF8] ring-2 ring-[#38BDF8]/20'
                : 'bg-[#0B1F3A]/60 border-white/5'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-white">2. Back Panel</span>
              {backCaptured ? (
                <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
              ) : (
                <span className="text-[10px] text-amber-400 font-bold uppercase">Required</span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">MRP, Dates & Packer details</p>
          </div>

          {/* Nutrition / Ingredients Step */}
          <div
            className={`p-3 rounded-xl border transition-all ${
              nutritionCaptured
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : activePanelType === 'nutrition'
                ? 'bg-[#16324F] border-[#38BDF8] ring-2 ring-[#38BDF8]/20'
                : 'bg-[#0B1F3A]/60 border-white/5'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-white">3. Ingredients</span>
              {nutritionCaptured ? (
                <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
              ) : (
                <span className="text-[10px] text-slate-400 font-medium uppercase">Optional</span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">Nutrition & Allergens panel</p>
          </div>
        </div>

        {/* Captured Thumbnails List */}
        {capturedPanels.length > 0 && (
          <div className="flex items-center gap-3 overflow-x-auto pb-2 mb-4">
            {capturedPanels.map((panel) => (
              <div
                key={panel.id}
                className="relative flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border border-white/10 bg-[#07111F] group shadow-md"
              >
                <img
                  src={panel.previewUrl}
                  alt={panel.label}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1">
                  <button
                    onClick={() => handleRemovePanel(panel.id)}
                    className="p-1.5 rounded-full bg-rose-600 text-white cursor-pointer"
                    title="Remove snapshot"
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
                <span className="absolute bottom-0 inset-x-0 bg-[#07111F]/90 text-slate-200 text-[9px] font-bold text-center py-0.5 truncate px-1 border-t border-white/10">
                  {panel.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Analyze Package Button */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleAnalyzeCaptured}
            disabled={capturedPanels.length === 0}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-extrabold text-white bg-[#2563EB] hover:bg-[#1d4ed8] transition disabled:opacity-50 cursor-pointer shadow-lg shadow-blue-500/25"
          >
            <SparklesIcon className="w-4 h-4 text-[#38BDF8]" />
            <span>ANALYZE PACKAGE ({capturedPanels.length} PANELS)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
