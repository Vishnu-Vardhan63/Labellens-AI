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
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

export default function HowItWorksPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const DETAILED_STEPS = [
    {
      step: '01',
      tagKey: 'howItWorks.step1Tag',
      defaultTag: 'CAPTURE / UPLOAD',
      titleKey: 'howItWorks.step1Title',
      defaultTitle: 'Package Image Ingestion',
      descKey: 'howItWorks.step1Desc',
      defaultDesc: 'Product package label image is captured via live camera or uploaded as a digital image file (JPEG, PNG, WebP, HEIC).',
      detailKey: 'howItWorks.step1Detail',
      defaultDetail: 'Supports multi-panel capture including front, back, and side product surfaces.',
      icon: CameraIcon,
    },
    {
      step: '02',
      tagKey: 'howItWorks.step2Tag',
      defaultTag: 'OCR EXTRACTION',
      titleKey: 'howItWorks.step2Title',
      defaultTitle: 'RapidOCR + PP-OCRv4 ONNX Text Detection',
      descKey: 'howItWorks.step2Desc',
      defaultDesc: 'RapidOCR engine detects raw text blocks across package panels and generates 4-point bounding box pixel coordinates.',
      detailKey: 'howItWorks.step2Detail',
      defaultDetail: 'Execution runs on lightweight ONNX runtime engine without external cloud API dependencies.',
      icon: DocumentTextIcon,
    },
    {
      step: '03',
      tagKey: 'howItWorks.step3Tag',
      defaultTag: 'DECLARATION EXTRACTION',
      titleKey: 'howItWorks.step3Title',
      defaultTitle: 'Statutory Field Identification',
      descKey: 'howItWorks.step3Desc',
      defaultDesc: 'The extraction service parses OCR bounding box lines to extract mandatory product declarations.',
      detailKey: 'howItWorks.step3Detail',
      defaultDetail: 'Identifies MRP, Net Quantity, Manufacturer / Packer Details, Dates (Mfg/Expiry/Pack), Consumer Care, and FSSAI information.',
      icon: MagnifyingGlassIcon,
    },
    {
      step: '04',
      tagKey: 'howItWorks.step4Tag',
      defaultTag: 'RULE 6 VALIDATION',
      titleKey: 'howItWorks.step4Title',
      defaultTitle: 'Legal Metrology Compliance Screening',
      descKey: 'howItWorks.step4Desc',
      defaultDesc: 'Deterministic rule evaluation checks extracted fields against Legal Metrology (Packaged Commodities) Rules, 2011.',
      detailKey: 'howItWorks.step4Detail',
      defaultDetail: 'Screens for mandatory presence, unit formatting, manufacturer address completeness, and date legibility.',
      icon: ClipboardDocumentCheckIcon,
    },
    {
      step: '05',
      tagKey: 'howItWorks.step5Tag',
      defaultTag: 'VISUAL EVIDENCE',
      titleKey: 'howItWorks.step5Title',
      defaultTitle: 'Pixel-Level Evidence Grounding',
      descKey: 'howItWorks.step5Desc',
      defaultDesc: 'Every extracted declaration and finding is directly mapped to its exact visual bounding box on the original package image.',
      detailKey: 'howItWorks.step5Detail',
      defaultDetail: 'Eliminates unexplainable AI outputs by making every finding 100% auditable and visually verifiable.',
      icon: EyeIcon,
    },
    {
      step: '06',
      tagKey: 'howItWorks.step6Tag',
      defaultTag: 'HUMAN REVIEW',
      titleKey: 'howItWorks.step6Title',
      defaultTitle: 'Human-in-the-Loop Triage',
      descKey: 'howItWorks.step6Desc',
      defaultDesc: 'Automated screening flags ambiguous or unverified items for authorized enforcement officer review.',
      detailKey: 'howItWorks.step6Detail',
      defaultDetail: 'Officers can confirm compliance, request manual field inspection, or ask for a clearer image capture.',
      icon: ShieldCheckIcon,
    },
    {
      step: '07',
      tagKey: 'howItWorks.step7Tag',
      defaultTag: 'INSPECTION REPORT',
      titleKey: 'howItWorks.step7Title',
      defaultTitle: 'Auditable PDF Report Generation',
      descKey: 'howItWorks.step7Desc',
      defaultDesc: 'Generates an official inspection PDF summary report containing extracted fields, Rule 6 audit findings, and timestamped log.',
      detailKey: 'howItWorks.step7Detail',
      defaultDetail: 'PDF reports can be downloaded and attached to physical enforcement case files.',
      icon: DocumentTextIcon,
    },
  ];

  return (
    <div className="min-h-screen bg-[#07111F] text-[#F8FAFC] py-12 px-4 sm:px-6 lg:px-12 font-sans">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Page Header */}
        <div className="text-center space-y-3 pb-8 border-b border-[#16324F]">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-md text-xs font-semibold bg-[#10263F] text-[#38BDF8] border border-[#16324F]">
            <span>{t('howItWorks.badge', 'SYSTEM ARCHITECTURE & WORKFLOW')}</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            {t('howItWorks.title', 'How LabelLens AI Works')}
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            {t('howItWorks.subtitle', 'A step-by-step overview of our deterministic package screening pipeline from raw label capture to visual evidence grounding and officer triage.')}
          </p>
          <div className="pt-2">
            <button
              onClick={() => navigate('/scan')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-xs font-extrabold text-white bg-[#2563EB] hover:bg-[#1d4ed8] transition cursor-pointer"
            >
              <CameraIcon className="w-4 h-4" />
              <span>{t('howItWorks.scanCTA', 'SCAN A PACKAGE NOW')}</span>
            </button>
          </div>
        </div>

        {/* 7-Step Detailed Workflow */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white mb-6">
            {t('howItWorks.pipelineTitle', '7-Step Inspection Pipeline')}
          </h2>
          
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
                        {t(item.tagKey, item.defaultTag)}
                      </span>
                      <h3 className="text-base font-bold text-white">
                        {t(item.titleKey, item.defaultTitle)}
                      </h3>
                      <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
                        {t(item.descKey, item.defaultDesc)}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono pt-1">
                        ℹ️ {t(item.detailKey, item.defaultDetail)}
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
            <h2 className="text-xl font-bold text-white">{t('howItWorks.whyApproachTitle', 'Why This Approach?')}</h2>
            <p className="text-xs text-slate-400 mt-1">
              {t('howItWorks.whyApproachDesc', 'Rationale behind our deterministic, evidence-grounded screening system design.')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-lg bg-[#10263F] border border-[#16324F] space-y-2">
              <span className="font-bold text-[#38BDF8] block">{t('howItWorks.point1Title', '1. OCR Reads the Package')}</span>
              <p className="text-slate-300 leading-relaxed">
                {t('howItWorks.point1Desc', 'RapidOCR extracts raw text and 4-point pixel coordinates without making compliance assumptions.')}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-[#10263F] border border-[#16324F] space-y-2">
              <span className="font-bold text-[#38BDF8] block">{t('howItWorks.point2Title', '2. Extraction Structures Information')}</span>
              <p className="text-slate-300 leading-relaxed">
                {t('howItWorks.point2Desc', 'Extraction service parses raw OCR text into standardized fields (MRP, Net Quantity, Dates, Manufacturer).')}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-[#10263F] border border-[#16324F] space-y-2">
              <span className="font-bold text-[#38BDF8] block">{t('howItWorks.point3Title', '3. Rules Perform Compliance Screening')}</span>
              <p className="text-slate-300 leading-relaxed">
                {t('howItWorks.point3Desc', 'Deterministic Legal Metrology Rule 6 validation engine evaluates extracted values against statutory standards.')}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-[#10263F] border border-[#16324F] space-y-2">
              <span className="font-bold text-[#38BDF8] block">{t('howItWorks.point4Title', '4. Visual Evidence Makes Findings Traceable')}</span>
              <p className="text-slate-300 leading-relaxed">
                {t('howItWorks.point4Desc', 'Every declaration links directly to its bounding box on the original package image for instant verification.')}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-[#10263F] border border-[#38BDF8]/30 text-xs text-slate-300 flex items-center gap-3">
            <CheckCircleIcon className="w-5 h-5 text-[#22C55E] shrink-0" />
            <span>
              {t('howItWorks.safeguard', 'Human-in-the-loop safeguard: Unclear or ambiguous findings are flagged for human review rather than guessing compliance.')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
