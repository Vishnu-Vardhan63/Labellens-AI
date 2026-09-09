import React, { useState } from 'react';
import {
  QuestionMarkCircleIcon,
  XMarkIcon,
  CheckCircleIcon,
  SparklesIcon,
  CameraIcon,
  DocumentMagnifyingGlassIcon,
  ShieldCheckIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

export function DemoGuideModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-slate-300 bg-[#10263F] hover:bg-[#16324F] hover:text-white border border-white/10 transition cursor-pointer shadow-md"
        aria-label="How to Demo Label Lens AI"
      >
        <QuestionMarkCircleIcon className="w-4 h-4 text-[#38BDF8]" />
        <span>How to Demo Label Lens AI</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0B1F3A] border border-white/10 rounded-2xl p-6 shadow-2xl max-w-md w-full relative text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <SparklesIcon className="w-5 h-5 text-[#38BDF8]" />
                <h3 className="text-base font-bold text-white">
                  How to Demo Label Lens AI
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <ol className="space-y-3 text-xs">
              <li className="flex items-start gap-3 p-3 rounded-xl bg-[#10263F] border border-white/10">
                <span className="w-5 h-5 rounded-full bg-[#2563EB] text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <p className="font-bold text-white">Scan a packaged product</p>
                  <p className="text-[11px] text-slate-400">
                    Use live camera or file upload on the Smart Scan page.
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-3 p-3 rounded-xl bg-[#10263F] border border-white/10">
                <span className="w-5 h-5 rounded-full bg-[#2563EB] text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <p className="font-bold text-white">Capture readable package panels</p>
                  <p className="text-[11px] text-slate-400">
                    Ensure MRP, net weight, dates, and manufacturer text are legible.
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-3 p-3 rounded-xl bg-[#10263F] border border-white/10">
                <span className="w-5 h-5 rounded-full bg-[#2563EB] text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <p className="font-bold text-white">Review extracted information</p>
                  <p className="text-[11px] text-slate-400">
                    Inspect detected product identity, MRP, net quantity, and dates.
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-3 p-3 rounded-xl bg-[#10263F] border border-white/10">
                <span className="w-5 h-5 rounded-full bg-[#2563EB] text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                  4
                </span>
                <div>
                  <p className="font-bold text-white">Review potential declaration observations</p>
                  <p className="text-[11px] text-slate-400">
                    Check verified Rule 6 compliance flags and missing details.
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-3 p-3 rounded-xl bg-[#10263F] border border-white/10">
                <span className="w-5 h-5 rounded-full bg-[#2563EB] text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                  5
                </span>
                <div>
                  <p className="font-bold text-white">Inspect supporting evidence</p>
                  <p className="text-[11px] text-slate-400">
                    View spatial OCR bounding boxes or open Inspector Workspace (`/dashboard`).
                  </p>
                </div>
              </li>
            </ol>

            <div className="mt-5 pt-3 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setIsOpen(false)}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#2563EB] hover:bg-[#1d4ed8]"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
