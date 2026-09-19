import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  DocumentMagnifyingGlassIcon,
  ScaleIcon,
  CpuChipIcon,
  CheckCircleIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

export default function AboutPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const WORKFLOW_STEPS = [
    {
      step: '01',
      title: 'High-Fidelity Capture',
      subtitle: 'Edge Image Ingestion',
      description:
        'Photograph or upload package panels with automatic perspective normalization, contrast checking, and resolution assessment.',
    },
    {
      step: '02',
      title: 'Text Extraction & Grounding',
      subtitle: 'PaddleOCR ONNX Engine',
      description:
        'Deterministic OCR identifies text lines with exact pixel bounding boxes, preventing LLM hallucination.',
    },
    {
      step: '03',
      title: 'Package Eligibility Gate',
      subtitle: 'Multi-Signal Screening',
      description:
        'Discriminates packaged commodities from certificates, IDs, and general paperwork before initiating regulatory audits.',
    },
    {
      step: '04',
      title: 'Statutory Compliance Audit',
      subtitle: 'Rule 6 Declaration Matrix',
      description:
        'Validates MRP, Net Quantity, Manufacturer details, Consumer Care, Dates, and Country of Origin against PC Rules, 2011.',
    },
    {
      step: '05',
      title: 'Auditable Report & Evidence',
      subtitle: 'Official Inspection Record',
      description:
        'Produces court-ready PDF audit reports with visual bounding box highlights and grounded Copilot assistant.',
    },
  ];

  const PILLARS = [
    {
      icon: CpuChipIcon,
      title: 'Deterministic OCR Extraction',
      description:
        'Zero hallucination pipeline. Every declared value is directly traced back to raw OCR text and physical package coordinates.',
    },
    {
      icon: CheckCircleIcon,
      title: 'Human-in-the-Loop Audit',
      description:
        'Officers retain complete control with automated flags categorized as Verified, Requires Review, or Potential Issue.',
    },
    {
      icon: ScaleIcon,
      title: 'Statutory Rule Enforcement',
      description:
        'Strict adherence to Legal Metrology Act, 2009 and Legal Metrology (Packaged Commodities) Rules, 2011 (Rule 6).',
    },
    {
      icon: DocumentTextIcon,
      title: 'Certified Digital Reports',
      description:
        'Instant generation of standardized government inspection records complete with timestamped verification hashes.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#07111F] text-slate-100 pb-24 font-sans">
      {/* Hero Header */}
      <section className="bg-[#0B1F3A]/90 text-white pt-12 pb-16 px-4 border-b border-white/10">
        <div className="max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#2563EB]/15 text-[#38BDF8] border border-[#2563EB]/30 mb-4">
            <span className="w-2 h-2 rounded-full bg-[#38BDF8] animate-pulse" />
            <span>{t('about.sihBadge', 'Smart India Hackathon · Problem Statement SIH26034')}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4 text-white">
            {t('about.title', 'LABEL LENS AI')}
          </h1>
          <p className="text-base sm:text-lg text-slate-300 max-w-3xl leading-relaxed">
            {t('about.subtitle', 'Autonomous verification and statutory compliance screening for packaged commodities under the Legal Metrology (Packaged Commodities) Rules, 2011.')}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/scan')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-extrabold text-white bg-[#2563EB] hover:bg-[#1d4ed8] shadow-lg shadow-blue-500/25 transition cursor-pointer"
            >
              <DocumentMagnifyingGlassIcon className="w-5 h-5 text-white" />
              <span>{t('about.launchBtn', 'Launch Package Inspection')}</span>
            </button>
            <button
              onClick={() => navigate('/inspector')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold text-slate-200 bg-[#10263F] hover:bg-[#16324F] border border-white/10 transition cursor-pointer"
            >
              <span>{t('about.browseBtn', 'Browse Inspection Records')}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Content Container */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-8 space-y-12">
        {/* Core Pillars */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PILLARS.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.title}
                className="bg-[#0B1F3A]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-xl flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-[#2563EB]/20 text-[#38BDF8] flex items-center justify-center flex-shrink-0 border border-blue-400/20">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white mb-1">
                    {pillar.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              </div>
            );
          })}
        </section>

        {/* 5-Step Inspection Workflow */}
        <section className="bg-[#0B1F3A]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="max-w-2xl mb-8">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#38BDF8] mb-1">
              {t('about.archTitle', 'End-to-End Architecture')}
            </h2>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white">
              {t('about.workflowTitle', 'The 5-Stage Verification Workflow')}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {t('about.workflowSubtitle', 'How LABEL LENS AI processes physical packages from raw pixels to verified statutory verdicts.')}
            </p>
          </div>

          <div className="space-y-6 relative before:absolute before:inset-0 before:left-4 before:h-full before:w-0.5 before:bg-white/10 ml-2">
            {WORKFLOW_STEPS.map((step) => (
              <div key={step.step} className="relative flex items-start gap-5 pl-2">
                <div className="w-8 h-8 rounded-full bg-[#2563EB] text-white text-xs font-extrabold flex items-center justify-center flex-shrink-0 z-10 shadow-lg shadow-blue-500/30">
                  {step.step}
                </div>
                <div className="flex-1 bg-[#10263F]/80 border border-white/10 rounded-2xl p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                    <h4 className="text-sm font-bold text-white">
                      {step.title}
                    </h4>
                    <span className="text-[11px] font-semibold text-[#38BDF8] bg-[#16324F] px-2.5 py-0.5 rounded-full border border-blue-400/20">
                      {step.subtitle}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Statutory Regulatory Framework Card */}
        <section className="bg-[#0B1F3A]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#2563EB]/20 text-[#38BDF8] flex items-center justify-center flex-shrink-0 border border-blue-400/20">
              <ScaleIcon className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-extrabold text-white mb-1">
                {t('about.charterTitle', 'Statutory Charter & Legal Scope')}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                {t('about.charterDesc', 'Under the Legal Metrology Act, 2009 and the Legal Metrology (Packaged Commodities) Rules, 2011, pre-packaged commodities sold in India must bear mandatory declarations in prescribed font sizes, formats, and positions.')}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-[#10263F]/90 border border-white/10">
                  <strong className="text-white block mb-1">{t('about.ruleA', 'Rule 6(1)(a) – Commodity Name')}</strong>
                  <span className="text-slate-400">{t('about.ruleADesc', 'Generic or common name of the commodity contained in package.')}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#10263F]/90 border border-white/10">
                  <strong className="text-white block mb-1">{t('about.ruleB', 'Rule 6(1)(b) – Manufacturer / Packer')}</strong>
                  <span className="text-slate-400">{t('about.ruleBDesc', 'Full name, registered office address, and country of origin if imported.')}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#10263F]/90 border border-white/10">
                  <strong className="text-white block mb-1">{t('about.ruleC', 'Rule 6(1)(c) – Net Quantity')}</strong>
                  <span className="text-slate-400">{t('about.ruleCDesc', 'Declared in standard units of weight, volume, or count with units.')}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#10263F]/90 border border-white/10">
                  <strong className="text-white block mb-1">{t('about.ruleD', 'Rule 6(1)(d) & (e) – MRP & Dates')}</strong>
                  <span className="text-slate-400">{t('about.ruleDDesc', 'Maximum Retail Price (incl. of all taxes) and month/year of manufacture.')}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SIH Presentation Footer Info */}
        <div className="p-5 rounded-2xl bg-[#0B1F3A]/80 backdrop-blur-xl border border-white/10 text-center text-xs text-slate-400 shadow-xl">
          <span className="font-extrabold text-[#38BDF8]">{t('about.sihFooter', 'Smart India Hackathon 2026 · Ministry of Consumer Affairs, Food & Public Distribution')}</span>
          <p className="mt-1 text-[11px] text-slate-300">{t('about.deptFooter', 'Department of Consumer Affairs · Legal Metrology Division')}</p>
        </div>
      </div>
    </div>
  );
}
