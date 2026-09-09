import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  CameraIcon,
  ArrowRightIcon,
  MagnifyingGlassIcon,
  ClipboardDocumentCheckIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  UserIcon,
  BriefcaseIcon,
  LockClosedIcon,
  ScaleIcon,
  GlobeAltIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ArrowDownIcon,
  EyeIcon,
  Squares2X2Icon,
  CpuChipIcon,
} from '@heroicons/react/24/outline';

const WORKFLOW_STEPS = [
  {
    number: '01',
    label: 'SCAN THE PACKAGE',
    title: 'Scan the Package',
    description: 'Capture package panels using a live camera or upload images.',
    icon: CameraIcon,
  },
  {
    number: '02',
    label: 'EXTRACT INFORMATION',
    title: 'Extract Information',
    description: 'AI-assisted OCR reads visible package information.',
    icon: DocumentTextIcon,
  },
  {
    number: '03',
    label: 'ANALYZE DECLARATIONS',
    title: 'Analyze Declarations',
    description: 'The system organizes information and checks available declarations.',
    icon: MagnifyingGlassIcon,
  },
  {
    number: '04',
    label: 'REVIEW RESULTS',
    title: 'Review Results',
    description: 'View extracted information, potential issues, and supporting evidence.',
    icon: ClipboardDocumentCheckIcon,
  },
];

const TEAM_MEMBERS = [
  { name: 'Vishnu', role: 'Team Lead & Full-Stack Development', initial: 'V', color: 'from-[#2563EB] to-indigo-800' },
  { name: 'Harshini', role: 'Team Member', initial: 'H', color: 'from-[#38BDF8] to-[#2563EB]' },
  { name: 'Bindhu', role: 'Team Member', initial: 'B', color: 'from-indigo-600 to-purple-800' },
  { name: 'Aravind', role: 'Team Member', initial: 'A', color: 'from-emerald-600 to-teal-800' },
  { name: 'Kotesh', role: 'Team Member', initial: 'K', color: 'from-amber-600 to-orange-800' },
  { name: 'Akhila', role: 'Team Member', initial: 'A', color: 'from-rose-600 to-pink-800' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleScrollToHowItWorks = () => {
    const el = document.getElementById('how-it-works');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#07111F] text-[#F8FAFC] font-sans selection:bg-[#2563EB] selection:text-white">
      {/* ------------------------------------------------------------- */}
      {/* SECTION 1 — HERO (100VH)                                       */}
      {/* ------------------------------------------------------------- */}
      <section className="relative min-h-[calc(100vh-4rem)] flex items-center bg-gradient-to-b from-[#07111F] via-[#07111F] to-[#0B1F3A] border-b border-[#16324F] px-4 sm:px-6 lg:px-12 py-16 overflow-hidden">
        {/* Subtle Background Mesh Graphics */}
        <div className="absolute inset-0 bg-[radial-gradient(#38BDF8_1px,transparent_1px)] [background-size:32px_32px] opacity-10 pointer-events-none" />

        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center relative z-10">
          {/* Left Side */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#2563EB]/20 text-[#38BDF8] border border-[#38BDF8]/30 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#38BDF8] animate-pulse" />
              {t('hero.badge', 'Real-Time Regulatory Intelligence')}
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-[#F8FAFC] leading-[1.15]">
              {t('hero.title', 'Autonomous Verification & Compliance Platform')}
            </h1>

            <p className="text-base sm:text-lg text-[#94A3B8] max-w-xl leading-relaxed font-normal">
              {t('hero.subtitle', 'AI-powered statutory declaration verification for Legal Metrology Officers, Compliance Auditors, and Conscious Consumers under Packaged Commodities Rules, 2011.')}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <button
                onClick={() => navigate('/scan')}
                className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl text-sm font-bold text-white bg-[#2563EB] hover:bg-[#1d4ed8] active:bg-[#1e40af] shadow-lg shadow-blue-500/25 transition-all transform hover:-translate-y-0.5 cursor-pointer tracking-wider"
              >
                <CameraIcon className="w-5 h-5" aria-hidden />
                <span>🔵 {t('hero.scanCTA', 'SCAN A PACKAGE')}</span>
              </button>

              <button
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-sm font-semibold text-[#F8FAFC] bg-[#10263F] hover:bg-[#16324F] border border-[#16324F] transition cursor-pointer"
              >
                <span>{t('hero.inspectorCTA', 'INSPECTOR WORKSPACE')} →</span>
              </button>
            </div>
          </div>

          {/* Right Side Visual Composition */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="w-full max-w-lg bg-[#10263F] border border-[#16324F] rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
              {/* Animated Laser Scan Line */}
              <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-[#38BDF8] to-transparent shadow-[0_0_15px_#38BDF8] top-12 animate-[bounce_3s_infinite]" />

              <div className="flex items-center justify-between pb-4 border-b border-[#16324F] mb-6">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#22C55E]" />
                  <span className="text-xs font-bold tracking-wider text-slate-300 uppercase">LabelLens AI SCANNER</span>
                </div>
                <span className="text-[11px] font-mono text-[#38BDF8] bg-[#2563EB]/20 px-2 py-0.5 rounded border border-[#38BDF8]/30">
                  98.4% Accuracy
                </span>
              </div>

              {/* Composition Steps */}
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-[#07111F] border border-[#16324F] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-[#2563EB]/20 text-[#38BDF8] flex items-center justify-center text-lg">📦</span>
                    <div>
                      <p className="text-xs font-bold text-white">PACKAGE SILHOUETTE</p>
                      <p className="text-[11px] text-[#94A3B8]">Physical Product Ingestion</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-[#22C55E]">Validated</span>
                </div>

                <div className="p-4 rounded-2xl bg-[#07111F] border border-[#16324F] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-[#2563EB]/20 text-[#38BDF8] flex items-center justify-center">
                      <CameraIcon className="w-5 h-5 text-[#38BDF8]" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-white">SCANNING FRAME</p>
                      <p className="text-[11px] text-[#94A3B8]">Multi-Panel Live Camera</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-[#38BDF8]">Live Frame</span>
                </div>

                <div className="p-4 rounded-2xl bg-[#07111F] border border-[#16324F] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-[#2563EB]/20 text-[#38BDF8] flex items-center justify-center">
                      <MagnifyingGlassIcon className="w-5 h-5 text-[#38BDF8]" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-white">AI ANALYSIS</p>
                      <p className="text-[11px] text-[#94A3B8]">OCR Text Bounding Box Highlights</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-slate-300">ONNX Engine</span>
                </div>

                <div className="p-4 rounded-2xl bg-[#2563EB]/20 border border-[#38BDF8]/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-[#2563EB] text-white flex items-center justify-center">
                      <ClipboardDocumentCheckIcon className="w-5 h-5" />
                    </span>
                    <div>
                      <p className="text-xs font-extrabold text-white">VERIFIED DATA</p>
                      <p className="text-[11px] text-slate-300">Rule 6 Statutory Audit Record</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#22C55E] bg-[#22C55E]/20 px-2 py-0.5 rounded border border-[#22C55E]/30">
                    Rule 6 Ready
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 2 — THE PURPOSE (EDITORIAL & MINIMAL)                 */}
      {/* ------------------------------------------------------------- */}
      <section className="py-24 bg-[#07111F] border-b border-[#16324F] px-4 sm:px-6 lg:px-12 text-center">
        <div className="max-w-4xl mx-auto space-y-6">
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#38BDF8]">
            OUR PURPOSE
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#F8FAFC] leading-tight">
            From Package Labels to Clear Insights.
          </h2>
          <p className="text-base sm:text-xl text-[#94A3B8] font-normal leading-relaxed max-w-2xl mx-auto">
            LABEL LENS AI transforms visible package information into structured, reviewable insights for consumers and inspection workflows.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 3 — TWO PERSPECTIVES                                  */}
      {/* ------------------------------------------------------------- */}
      <section className="py-24 bg-[#0B1F3A] border-b border-[#16324F] px-4 sm:px-6 lg:px-12">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#38BDF8] bg-[#2563EB]/20 px-3 py-1 rounded-full border border-[#38BDF8]/30">
              DUAL WORKFLOW PLATFORM
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#F8FAFC] mt-3">
              One Platform. Two Perspectives.
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            {/* LEFT — CONSUMERS */}
            <div className="bg-[#10263F] border border-[#16324F] rounded-3xl p-8 sm:p-10 shadow-lg flex flex-col justify-between hover:border-[#38BDF8]/40 transition-all">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#2563EB]/20 text-[#38BDF8] flex items-center justify-center mb-6">
                  <UserIcon className="w-6 h-6" />
                </div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#38BDF8]">
                  PUBLIC CONSUMER TRANSPARENCY
                </span>
                <h3 className="text-2xl font-bold text-white mt-1 mb-3">
                  For Consumers
                </h3>
                <p className="text-sm text-[#94A3B8] leading-relaxed mb-8">
                  Understand the information displayed on packaged products.
                </p>

                <ul className="space-y-4 text-sm font-semibold text-[#F8FAFC] mb-10">
                  <li className="flex items-center gap-3">
                    <CheckCircleIcon className="w-5 h-5 text-[#38BDF8] flex-shrink-0" />
                    <span>Product Information</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircleIcon className="w-5 h-5 text-[#38BDF8] flex-shrink-0" />
                    <span>Ingredients & Nutrition</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircleIcon className="w-5 h-5 text-[#38BDF8] flex-shrink-0" />
                    <span>Visible Package Details</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => navigate('/scan')}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-sm font-bold text-white bg-[#2563EB] hover:bg-[#1d4ed8] transition cursor-pointer shadow-sm"
              >
                <span>EXPLORE PACKAGE INFORMATION →</span>
              </button>
            </div>

            {/* RIGHT — INSPECTORS */}
            <div className="bg-[#16324F] border border-white/10 rounded-3xl p-8 sm:p-10 shadow-xl flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#2563EB]/30 text-white flex items-center justify-center mb-6 border border-white/20">
                  <BriefcaseIcon className="w-6 h-6" />
                </div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#22C55E]">
                  STATUTORY ENFORCEMENT WORKSPACE
                </span>
                <h3 className="text-2xl font-bold text-white mt-1 mb-3">
                  For Inspectors
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed mb-8">
                  Evidence-based package review tools.
                </p>

                <ul className="space-y-4 text-sm font-semibold text-white mb-10">
                  <li className="flex items-center gap-3">
                    <CheckCircleIcon className="w-5 h-5 text-[#22C55E] flex-shrink-0" />
                    <span>Mandatory Declarations</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircleIcon className="w-5 h-5 text-[#22C55E] flex-shrink-0" />
                    <span>Potential Conflicts</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircleIcon className="w-5 h-5 text-[#22C55E] flex-shrink-0" />
                    <span>Inspection Evidence</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => navigate('/dashboard')}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-sm font-bold text-[#07111F] bg-white hover:bg-slate-100 transition cursor-pointer shadow-sm"
              >
                <span>OPEN INSPECTOR WORKSPACE →</span>
              </button>
            </div>
          </div>

          <div className="text-center">
            <p className="text-xs sm:text-sm font-medium text-[#94A3B8]">
              ℹ️ AI-assisted analysis supports review. Final regulatory decisions remain with authorized authorities.
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 4 — HOW IT WORKS                                      */}
      {/* ------------------------------------------------------------- */}
      <section id="how-it-works" className="py-24 bg-[#07111F] text-white px-4 sm:px-6 lg:px-12 border-b border-[#16324F] scroll-mt-16">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#38BDF8]">
              AUTOMATED WORKFLOW
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#F8FAFC] mt-2">
              How It Works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {WORKFLOW_STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.number}
                  className="bg-[#10263F] border border-[#16324F] rounded-3xl p-6 sm:p-8 flex flex-col justify-between hover:bg-[#16324F] transition-all group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <span className="text-4xl font-black text-[#38BDF8]">
                        {step.number}
                      </span>
                      <Icon className="w-6 h-6 text-[#94A3B8] group-hover:text-white transition-colors" />
                    </div>

                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#38BDF8] block mb-1">
                      {step.label}
                    </span>
                    <h3 className="text-lg font-bold text-white mb-2">
                      {step.title}
                    </h3>
                    <p className="text-xs text-[#94A3B8] leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 5 — PRODUCT EXPERIENCE SHOWCASE                       */}
      {/* ------------------------------------------------------------- */}
      <section className="py-24 bg-[#0B1F3A] text-white border-b border-[#16324F] px-4 sm:px-6 lg:px-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 space-y-6">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#38BDF8]">
              PRODUCT SHOWCASE
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              From Package to Insight
            </h2>
            <p className="text-sm text-[#94A3B8] leading-relaxed">
              Experience an auditable compliance pipeline from live camera capture to statutory inspection results.
            </p>

            <div className="space-y-3 pt-2 text-sm font-semibold">
              <div className="p-3.5 rounded-2xl bg-[#10263F] border border-[#16324F] flex items-center gap-3">
                <span className="text-xl">📦</span>
                <span>PACKAGE</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#10263F] border border-[#16324F] flex items-center gap-3">
                <span className="text-xl">📷</span>
                <span>LIVE CAMERA SCAN</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#10263F] border border-[#16324F] flex items-center gap-3">
                <span className="text-xl">🔤</span>
                <span>TEXT EXTRACTION</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#10263F] border border-[#16324F] flex items-center gap-3">
                <span className="text-xl">🔍</span>
                <span>AI ANALYSIS</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#2563EB]/20 border border-[#38BDF8]/30 flex items-center gap-3">
                <span className="text-xl">📋</span>
                <span className="text-white font-bold">REVIEW RESULTS</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="bg-[#10263F] border border-[#16324F] rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#16324F] text-xs">
                <span className="font-bold text-white">LabelLens AI Interface Mockup</span>
                <span className="text-[#38BDF8] font-mono">http://localhost:5173/results</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#07111F] border border-[#16324F] space-y-2">
                  <span className="text-[10px] uppercase font-bold text-[#94A3B8]">Extracted MRP</span>
                  <p className="text-xl font-bold text-white">₹ 145.00</p>
                  <span className="text-[10px] text-[#22C55E] bg-[#22C55E]/20 px-2 py-0.5 rounded border border-[#22C55E]/30 font-semibold">
                    Verified Rule 6(1)(e)
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-[#07111F] border border-[#16324F] space-y-2">
                  <span className="text-[10px] uppercase font-bold text-[#94A3B8]">Net Quantity</span>
                  <p className="text-xl font-bold text-white">500 g</p>
                  <span className="text-[10px] text-[#22C55E] bg-[#22C55E]/20 px-2 py-0.5 rounded border border-[#22C55E]/30 font-semibold">
                    Verified Rule 6(1)(c)
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#07111F] border border-[#16324F]">
                <span className="text-[10px] uppercase font-bold text-[#94A3B8] block mb-1">OCR Evidence Highlights</span>
                <p className="text-xs font-mono text-[#F8FAFC] bg-black/40 p-2.5 rounded border border-[#16324F]">
                  "MRP Rs 145.00 (Incl. of all taxes) Net Qty: 500g"
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 6 — KEY CAPABILITIES                                  */}
      {/* ------------------------------------------------------------- */}
      <section className="py-24 bg-[#07111F] text-[#F8FAFC] px-4 sm:px-6 lg:px-12 border-b border-[#16324F]">
        <div className="max-w-7xl mx-auto space-y-24">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#38BDF8]">
              SYSTEM CAPABILITIES
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#F8FAFC] mt-3">
              Built for Intelligent Package Analysis
            </h2>
          </div>

          {/* Feature 1: TEXT -> VISUAL */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-[#2563EB]/20 text-[#38BDF8] flex items-center justify-center">
                <CameraIcon className="w-5 h-5" />
              </div>
              <h3 className="text-2xl font-bold text-white">Smart Package Scanning</h3>
              <p className="text-sm text-[#94A3B8] leading-relaxed">
                Capture package panels using live camera or image upload with real-time framing guidance.
              </p>
            </div>
            <div className="lg:col-span-6 bg-[#10263F] border border-[#16324F] rounded-3xl p-8 text-center shadow-md">
              <div className="text-5xl mb-4">📷</div>
              <p className="text-xs font-bold text-white">Multi-Panel Capture</p>
              <p className="text-xs text-[#94A3B8] mt-1">Front, Back, and Nutrition Panels</p>
            </div>
          </div>

          {/* Feature 2: VISUAL -> TEXT */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 order-2 lg:order-1 bg-[#10263F] border border-[#16324F] rounded-3xl p-8 text-center shadow-md">
              <div className="text-5xl mb-4">🔎</div>
              <p className="text-xs font-bold text-white">RapidOCR Engine</p>
              <p className="text-xs text-[#94A3B8] mt-1">Deterministic text line extraction</p>
            </div>
            <div className="lg:col-span-6 order-1 lg:order-2 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-[#2563EB]/20 text-[#38BDF8] flex items-center justify-center">
                <MagnifyingGlassIcon className="w-5 h-5" />
              </div>
              <h3 className="text-2xl font-bold text-white">Intelligent Label Analysis</h3>
              <p className="text-sm text-[#94A3B8] leading-relaxed">
                Extract and organize visible package information including MRP, Net Weight, Dates, and Manufacturer details.
              </p>
            </div>
          </div>

          {/* Feature 3: TEXT -> VISUAL */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <ExclamationTriangleIcon className="w-5 h-5" />
              </div>
              <h3 className="text-2xl font-bold text-white">Conflict Detection</h3>
              <p className="text-sm text-[#94A3B8] leading-relaxed">
                Identify potential inconsistencies across available package information and Rule 6 statutory requirements.
              </p>
            </div>
            <div className="lg:col-span-6 bg-[#10263F] border border-[#16324F] rounded-3xl p-8 text-center shadow-md">
              <div className="text-5xl mb-4">⚠️</div>
              <p className="text-xs font-bold text-white">Rule 6 Triage Engine</p>
              <p className="text-xs text-[#94A3B8] mt-1">Automatic declaration issue flagging</p>
            </div>
          </div>

          {/* Feature 4: VISUAL -> TEXT */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 order-2 lg:order-1 bg-[#10263F] border border-[#16324F] rounded-3xl p-8 text-center shadow-md">
              <div className="text-5xl mb-4">📊</div>
              <p className="text-xs font-bold text-white">Spatial Bounding Box Grounding</p>
              <p className="text-xs text-[#94A3B8] mt-1">Auditable evidence mapping</p>
            </div>
            <div className="lg:col-span-6 order-1 lg:order-2 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-[#2563EB]/20 text-[#38BDF8] flex items-center justify-center">
                <ClipboardDocumentCheckIcon className="w-5 h-5" />
              </div>
              <h3 className="text-2xl font-bold text-white">Evidence-Based Review</h3>
              <p className="text-sm text-[#94A3B8] leading-relaxed">
                Provide confidence information and visual evidence for inspection workflows.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 7 — TRUST & RESPONSIBILITY                            */}
      {/* ------------------------------------------------------------- */}
      <section className="py-24 bg-[#0B1F3A] text-[#F8FAFC] px-4 sm:px-6 lg:px-12 border-b border-[#16324F]">
        <div className="max-w-7xl mx-auto text-center space-y-12">
          <div className="max-w-2xl mx-auto">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#38BDF8]">
              ETHICAL AI CHARTER
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mt-2">
              Designed for Responsible Use
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-[#10263F] border border-[#16324F] text-center space-y-2">
              <div className="text-3xl">🛡️</div>
              <h3 className="text-base font-bold text-white">Privacy-Aware</h3>
              <p className="text-xs text-[#94A3B8]">Uploaded package data is handled securely.</p>
            </div>

            <div className="p-6 rounded-2xl bg-[#10263F] border border-[#16324F] text-center space-y-2">
              <div className="text-3xl">🔎</div>
              <h3 className="text-base font-bold text-white">Evidence-Based</h3>
              <p className="text-xs text-[#94A3B8]">Results are connected to visible package text.</p>
            </div>

            <div className="p-6 rounded-2xl bg-[#10263F] border border-[#16324F] text-center space-y-2">
              <div className="text-3xl">👨⚖️</div>
              <h3 className="text-base font-bold text-white">Human Authority</h3>
              <p className="text-xs text-[#94A3B8]">AI assists; authorized professionals retain final decisions.</p>
            </div>

            <div className="p-6 rounded-2xl bg-[#10263F] border border-[#16324F] text-center space-y-2">
              <div className="text-3xl">🌐</div>
              <h3 className="text-base font-bold text-white">Multilingual Ready</h3>
              <p className="text-xs text-[#94A3B8]">Supports Indian and international languages.</p>
            </div>
          </div>

          <p className="text-xs sm:text-sm font-medium text-[#94A3B8] max-w-2xl mx-auto leading-relaxed">
            LABEL LENS AI provides AI-assisted analysis to support users and inspection workflows. Final regulatory decisions remain with authorized authorities.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 8 — TEAM SECTION (ALL 6 REAL TEAM MEMBERS)            */}
      {/* ------------------------------------------------------------- */}
      <section id="team" className="py-24 bg-[#07111F] text-white px-4 sm:px-6 lg:px-12 border-b border-[#16324F] scroll-mt-16">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#38BDF8]">
              SMART INDIA HACKATHON TEAM
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mt-2">
              Meet the Team Behind LabelLens AI
            </h2>
            <p className="text-base text-[#94A3B8] mt-3">
              A team building technology to make package information easier to understand and review.
            </p>
          </div>

          {/* 3x2 Grid Layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {TEAM_MEMBERS.map((member) => (
              <div
                key={member.name}
                className="bg-[#10263F] border border-[#16324F] rounded-3xl p-6 flex items-center gap-4 hover:bg-[#16324F] transition-all group shadow-md"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${member.color} text-white text-xl font-black flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-105 transition-transform`}>
                  {member.initial}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{member.name}</h3>
                  <p className="text-xs font-semibold text-[#38BDF8] mt-0.5">{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 9 — FINAL CALL TO ACTION                              */}
      {/* ------------------------------------------------------------- */}
      <section className="py-24 bg-[#07111F] text-white px-4 sm:px-6 lg:px-12">
        <div className="max-w-4xl mx-auto bg-[#10263F] border border-[#16324F] rounded-3xl p-8 sm:p-12 text-center shadow-2xl space-y-6">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            Ready to Analyze a Package?
          </h2>
          <p className="text-base text-[#94A3B8] max-w-xl mx-auto leading-relaxed">
            Experience AI-assisted package label analysis through a simple scan.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={() => navigate('/scan')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl text-sm font-bold text-white bg-[#2563EB] hover:bg-[#1d4ed8] active:bg-[#1e40af] shadow-lg shadow-blue-500/25 transition cursor-pointer tracking-wider"
            >
              <CameraIcon className="w-5 h-5" aria-hidden />
              <span>📷 SCAN A PACKAGE</span>
            </button>

            <button
              onClick={() => navigate('/dashboard')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-sm font-bold text-[#F8FAFC] bg-[#16324F] hover:bg-[#1f4f82] border border-[#16324F] transition cursor-pointer"
            >
              <span>OPEN INSPECTOR WORKSPACE →</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
