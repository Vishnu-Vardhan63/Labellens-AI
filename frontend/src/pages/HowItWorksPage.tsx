import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  CameraIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  ClipboardDocumentCheckIcon,
  EyeIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  ArrowDownIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

const DETAILED_STEPS = [
  {
    step: '01',
    title: 'CAPTURE / UPLOAD',
    name: 'Package Image Ingestion',
    description: 'Product package label image is captured via live camera or uploaded as a digital image file (JPEG, PNG, WebP, HEIC).',
    detail: 'Supports multi-panel capture including front, back, and side product surfaces.',
    icon: CameraIcon,
  },
  {
    step: '02',
    title: 'OCR EXTRACTION',
    name: 'RapidOCR + PP-OCRv4 ONNX Text Detection',
    description: 'RapidOCR engine detects raw text blocks across package panels and generates 4-point bounding box pixel coordinates.',
    detail: 'Execution runs on lightweight ONNX runtime engine without external cloud API dependencies.',
    icon: DocumentTextIcon,
  },
  {
    step: '03',
    title: 'DECLARATION EXTRACTION',
    name: 'Statutory Field Identification',
    description: 'The extraction service parses OCR bounding box lines to extract mandatory product declarations.',
    detail: 'Identifies MRP, Net Quantity, Manufacturer / Packer Details, Dates (Mfg/Expiry/Pack), Consumer Care, and FSSAI information.',
    icon: MagnifyingGlassIcon,
  },
  {
    step: '04',
    title: 'RULE 6 VALIDATION',
    name: 'Legal Metrology Compliance Screening',
    description: 'Deterministic rule evaluation checks extracted fields against Legal Metrology (Packaged Commodities) Rules, 2011.',
    detail: 'Screens for mandatory presence, unit formatting, manufacturer address completeness, and date legibility.',
    icon: ClipboardDocumentCheckIcon,
  },
  {
    step: '05',
    title: 'VISUAL EVIDENCE',
    name: 'Pixel-Level Evidence Grounding',
    description: 'Every extracted declaration and finding is directly mapped to its exact visual bounding box on the original package image.',
    detail: 'Eliminates unexplainable AI outputs by making every finding 100% auditable and visually verifiable.',
    icon: EyeIcon,
  },
  {
    step: '06',
    title: 'HUMAN REVIEW',
    name: 'Human-in-the-Loop Triage',
    description: 'Automated screening flags ambiguous or unverified items for authorized enforcement officer review.',
    detail: 'Officers can confirm compliance, request manual field inspection, or ask for a clearer image capture.',
    icon: ShieldCheckIcon,
  },
  {
    step: '07',
    title: 'INSPECTION REPORT',
    name: 'Auditable PDF Report Generation',
    description: 'Generates an official inspection PDF summary report containing extracted fields, Rule 6 audit findings, and timestamped log.',
    detail: 'PDF reports can be downloaded and attached to physical enforcement case files.',
    icon: DocumentTextIcon,
  },
];

export default function HowItWorksPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-[#07111F] text-[#F8FAFC] py-12 px-4 sm:px-6 lg:px-12 font-sans">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Page Header */}
        <div className="text-center space-y-3 pb-8 border-b border-[#16324F]">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-md text-xs font-semibold bg-[#10263F] text-[#38BDF8] border border-[#16324F]">
            <span>SYSTEM ARCHITECTURE & WORKFLOW</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            How LabelLens AI Works
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            A step-by-step overview of our deterministic package screening pipeline from raw label capture to visual evidence grounding and officer triage.
          </p>
          <div className="pt-2">
            <button
              onClick={() => navigate('/scan')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-xs font-extrabold text-white bg-[#2563EB] hover:bg-[#1d4ed8] transition cursor-pointer"
            >
              <CameraIcon className="w-4 h-4" />
              <span>SCAN A PACKAGE NOW</span>
            </button>
          </div>
        </div>

        {/* 7-Step Detailed Workflow */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white mb-6">7-Step Inspection Pipeline</h2>
          
          <div className="space-y-4">
            {DETAILED_STEPS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.step}
                  className="bg-[#0B1F3A] border border-[#16324F] rounded-lg p-5 sm:p-6 flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between"
                >
                  <div className="flex items-start gap-4">
                    <span className="text-xs font-mono font-bold text-[#38BDF8] bg-[#10263F] px-2.5 py-1 rounded border border-[#16324F] shrink-0">
                      {item.step}
                    </span>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-[#38BDF8] uppercase tracking-wider block">
                        {item.title}
                      </span>
                      <h3 className="text-base font-bold text-white">
                        {item.name}
                      </h3>
                      <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
                        {item.description}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono pt-1">
                        ℹ️ {item.detail}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 p-3 rounded-lg bg-[#10263F] border border-[#16324F] text-[#38BDF8] hidden sm:flex">
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section: WHY THIS APPROACH? */}
        <div className="bg-[#0B1F3A] border border-[#16324F] rounded-lg p-6 sm:p-8 space-y-6">
          <div className="border-b border-[#16324F] pb-4">
            <h2 className="text-xl font-bold text-white">Why This Approach?</h2>
            <p className="text-xs text-slate-400 mt-1">
              Rationale behind our deterministic, evidence-grounded screening system design.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-lg bg-[#10263F] border border-[#16324F] space-y-2">
              <span className="font-bold text-[#38BDF8] block">1. OCR Reads the Package</span>
              <p className="text-slate-300 leading-relaxed">
                RapidOCR extracts raw text and 4-point pixel coordinates without making compliance assumptions.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-[#10263F] border border-[#16324F] space-y-2">
              <span className="font-bold text-[#38BDF8] block">2. Extraction Structures Information</span>
              <p className="text-slate-300 leading-relaxed">
                Extraction service parses raw OCR text into standardized fields (MRP, Net Quantity, Dates, Manufacturer).
              </p>
            </div>

            <div className="p-4 rounded-lg bg-[#10263F] border border-[#16324F] space-y-2">
              <span className="font-bold text-[#38BDF8] block">3. Rules Perform Compliance Screening</span>
              <p className="text-slate-300 leading-relaxed">
                Deterministic Legal Metrology Rule 6 validation engine evaluates extracted values against statutory standards.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-[#10263F] border border-[#16324F] space-y-2">
              <span className="font-bold text-[#38BDF8] block">4. Visual Evidence Makes Findings Traceable</span>
              <p className="text-slate-300 leading-relaxed">
                Every declaration links directly to its bounding box on the original package image for instant verification.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-[#10263F] border border-[#38BDF8]/30 text-xs text-slate-300 flex items-center gap-3">
            <CheckCircleIcon className="w-5 h-5 text-[#22C55E] shrink-0" />
            <span>
              <strong>Human-in-the-loop safeguard:</strong> Unclear or ambiguous findings are flagged for human review rather than guessing compliance.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
