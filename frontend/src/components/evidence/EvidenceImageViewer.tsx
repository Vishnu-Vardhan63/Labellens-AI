import React, { useState } from 'react';
import {
  ArrowsPointingOutIcon,
  XMarkIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';
import type { EvidenceResponse, DeclarationEvidence, NormalizedRect } from '../../types';

interface EvidenceImageViewerProps {
  imageSrc: string;
  evidenceData: EvidenceResponse | null;
  selectedField: string | null;
  onSelectField: (fieldKey: string) => void;
  statusMap?: Record<string, 'verified' | 'manual_review' | 'potential_issue'>;
}

export function EvidenceImageViewer({
  imageSrc,
  evidenceData,
  selectedField,
  onSelectField,
  statusMap = {},
}: EvidenceImageViewerProps) {
  const [showAllBoxes, setShowAllBoxes] = useState(false);
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  // Active selected declaration evidence
  const activeDecl: DeclarationEvidence | undefined = selectedField && evidenceData
    ? evidenceData.declarations[selectedField]
    : undefined;

  const activeStatus = selectedField ? statusMap[selectedField] || 'verified' : 'verified';

  // Get color styles for active highlight based on compliance status
  const getHighlightColors = (status: string) => {
    switch (status) {
      case 'potential_issue':
        return {
          stroke: '#E11D48', // rose-600
          fill: 'rgba(244, 63, 94, 0.22)',
          border: 'border-rose-500',
          badge: 'bg-rose-600 text-white',
        };
      case 'manual_review':
        return {
          stroke: '#D97706', // amber-600
          fill: 'rgba(245, 158, 11, 0.24)',
          border: 'border-amber-500',
          badge: 'bg-amber-600 text-white',
        };
      case 'verified':
      default:
        return {
          stroke: '#059669', // emerald-600
          fill: 'rgba(16, 185, 129, 0.22)',
          border: 'border-emerald-500',
          badge: 'bg-emerald-600 text-white',
        };
    }
  };

  const colors = getHighlightColors(activeStatus);

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0B1F3A]/90 backdrop-blur-xl shadow-xl overflow-hidden text-slate-100">
      {/* Viewer Header Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#10263F] text-xs">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-white uppercase tracking-wider text-[11px]">
            Package Label Evidence
          </span>
          {activeDecl && activeDecl.has_evidence && (
            <span className="px-2.5 py-0.5 rounded-full font-bold bg-[#2563EB]/20 text-[#38BDF8] border border-blue-400/30 text-[11px]">
              {activeDecl.evidence_blocks.length} region{activeDecl.evidence_blocks.length > 1 ? 's' : ''} mapped
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Toggle All Boxes */}
          <button
            type="button"
            onClick={() => setShowAllBoxes(!showAllBoxes)}
            className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors cursor-pointer font-semibold"
            title="Toggle display of all OCR detected bounding boxes"
          >
            {showAllBoxes ? (
              <>
                <EyeSlashIcon className="w-4 h-4 text-[#38BDF8]" />
                <span className="hidden sm:inline">Hide All Blocks</span>
              </>
            ) : (
              <>
                <EyeIcon className="w-4 h-4 text-slate-400" />
                <span className="hidden sm:inline">Show All OCR</span>
              </>
            )}
          </button>

          {/* Zoom Lightbox */}
          <button
            type="button"
            onClick={() => setIsZoomOpen(true)}
            className="flex items-center gap-1 text-[#38BDF8] hover:underline cursor-pointer font-bold"
          >
            <ArrowsPointingOutIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Zoom</span>
          </button>
        </div>
      </div>

      {/* Main Image Stage with SVG Overlay */}
      <div className="relative bg-black/40 flex items-center justify-center p-3 select-none">
        <div className="relative inline-block max-w-full">
          {/* The Package Image */}
          <img
            src={imageSrc}
            alt="Packaged commodity label"
            className="block max-h-[380px] w-auto max-w-full object-contain rounded-lg shadow-inner"
          />

          {/* Interactive SVG Bounding Box Layer */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-auto"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-label="OCR Bounding Box Overlays"
          >
            {/* 1. All OCR Blocks (when toggled on) */}
            {showAllBoxes &&
              evidenceData?.all_ocr_blocks.map((block, idx) => {
                const r = block.normalized_rect;
                return (
                  <rect
                    key={`all-${idx}`}
                    x={r.x}
                    y={r.y}
                    width={r.width}
                    height={r.height}
                    fill="rgba(56, 189, 248, 0.1)"
                    stroke="#38BDF8"
                    strokeWidth="0.35"
                    strokeDasharray="1 0.6"
                    className="transition-all hover:fill-cyan-400/30"
                  >
                    <title>{block.text}</title>
                  </rect>
                );
              })}

            {/* 2. Unselected Mapped Declarations (subtle dashed outlines) */}
            {evidenceData &&
              Object.entries(evidenceData.declarations).map(([fKey, decl]) => {
                if (fKey === selectedField || !decl.has_evidence) return null;
                return decl.evidence_blocks.map((b, bIdx) => (
                  <rect
                    key={`unsel-${fKey}-${bIdx}`}
                    x={b.normalized_rect.x}
                    y={b.normalized_rect.y}
                    width={b.normalized_rect.width}
                    height={b.normalized_rect.height}
                    fill="rgba(255, 255, 255, 0.05)"
                    stroke="#64748B"
                    strokeWidth="0.4"
                    strokeDasharray="1 0.8"
                    className="cursor-pointer hover:stroke-[#38BDF8] hover:fill-blue-500/20 transition-all"
                    onClick={() => onSelectField(fKey)}
                  >
                    <title>{`${decl.display_name}: ${b.text}`}</title>
                  </rect>
                ));
              })}

            {/* 3. Active Highlighted Declaration Bounding Boxes */}
            {activeDecl &&
              activeDecl.has_evidence &&
              activeDecl.evidence_blocks.map((b, bIdx) => {
                const r = b.normalized_rect;
                return (
                  <g key={`active-${bIdx}`}>
                    {/* Pulsing outer glow */}
                    <rect
                      x={r.x - 0.6}
                      y={r.y - 0.6}
                      width={r.width + 1.2}
                      height={r.height + 1.2}
                      fill="none"
                      stroke={colors.stroke}
                      strokeWidth="0.8"
                      strokeOpacity="0.4"
                      rx="0.5"
                      className="animate-pulse"
                    />
                    {/* Primary Highlight Rect */}
                    <rect
                      x={r.x}
                      y={r.y}
                      width={r.width}
                      height={r.height}
                      fill={colors.fill}
                      stroke={colors.stroke}
                      strokeWidth="0.9"
                      rx="0.3"
                    >
                      <title>{`${activeDecl.display_name}: ${b.text}`}</title>
                    </rect>
                  </g>
                );
              })}
          </svg>

          {/* Floating Pill Tag for Active Field */}
          {activeDecl && activeDecl.has_evidence && activeDecl.bounding_box_union && (
            <div
              className="absolute pointer-events-none transition-all duration-200 z-10"
              style={{
                left: `${Math.min(80, Math.max(2, activeDecl.bounding_box_union.x))}%`,
                top: `${Math.max(2, activeDecl.bounding_box_union.y - 6.5)}%`,
              }}
            >
              <div
                className={`px-2 py-0.5 rounded shadow-lg text-[10px] font-bold tracking-tight uppercase whitespace-nowrap flex items-center gap-1 ${colors.badge}`}
              >
                <span>{activeDecl.display_name}</span>
                {activeDecl.detected_value && (
                  <span className="opacity-90 font-normal">
                    · {activeDecl.detected_value.slice(0, 18)}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Viewer Footer: Evidence Info & Guidance */}
      <div className="px-4 py-3 border-t border-white/10 bg-[#10263F] text-xs">
        {activeDecl ? (
          activeDecl.has_evidence ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <div>
                <span className="font-bold text-white">
                  Highlighted: {activeDecl.display_name}
                </span>
                <span className="text-slate-400 ml-1.5">
                  ({activeDecl.evidence_blocks.length} OCR text block{activeDecl.evidence_blocks.length > 1 ? 's' : ''})
                </span>
              </div>
              <span className="text-[11px] text-[#38BDF8] font-mono">
                Coordinates derived from actual OCR bounding boxes
              </span>
            </div>
          ) : (
            <div className="text-amber-300 bg-amber-500/10 px-3 py-2 rounded-xl border border-amber-500/20 text-xs">
              <strong>Visual Evidence: </strong>
              {activeDecl.message || 'No visual evidence could be confidently mapped for this declaration.'}
            </div>
          )
        ) : (
          <div className="text-slate-300 text-xs flex items-center justify-between">
            <span>Select any declaration below to view and highlight its position on the package.</span>
            <span className="text-[11px] text-slate-400">Click outlines to inspect</span>
          </div>
        )}
      </div>

      {/* Lightbox Zoom Modal */}
      {isZoomOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-md"
          onClick={() => setIsZoomOpen(false)}
        >
          <div
            className="relative max-w-5xl max-h-[92vh] bg-[#0B1F3A] border border-white/10 rounded-2xl overflow-hidden shadow-2xl p-2 flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3 border-b border-white/10">
              <span className="text-sm font-bold text-white">
                Full-Resolution Visual Evidence Inspector
              </span>
              <button
                type="button"
                onClick={() => setIsZoomOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-auto p-4 flex items-center justify-center bg-black/50">
              <div className="relative inline-block">
                <img
                  src={imageSrc}
                  alt="Full package label"
                  className="max-h-[78vh] w-auto object-contain rounded-lg shadow-inner"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
