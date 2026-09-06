import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheckIcon,
  DocumentMagnifyingGlassIcon,
  EyeIcon,
  CheckBadgeIcon,
  ArrowRightIcon,
  ScaleIcon,
  CpuChipIcon,
  CheckCircleIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { Button } from '../components/ui/Button';

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

export default function AboutPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#172033] pb-20">
      {/* Hero Header */}
      <section className="bg-[#163A5F] text-white pt-12 pb-16 px-4 border-b border-[#0f2942]">
        <div className="max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-blue-200 border border-white/15 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            Smart India Hackathon · Problem Statement SIH26034
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            LABEL LENS AI
          </h1>
          <p className="text-base sm:text-lg text-slate-200 max-w-3xl leading-relaxed">
            Autonomous verification and statutory compliance screening for packaged commodities
            under the Legal Metrology (Packaged Commodities) Rules, 2011. Engineered for
            field enforcement officers and enterprise regulatory teams.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              size="lg"
              onClick={() => navigate('/scan')}
              className="bg-[#2563EB] hover:bg-[#1d4ed8] text-white gap-2 font-semibold shadow-xs"
            >
              <DocumentMagnifyingGlassIcon className="w-5 h-5" />
              Launch Package Inspection
            </Button>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate('/history')}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              Browse Inspection Records
            </Button>
          </div>
        </div>
      </section>

      {/* Main Content Container */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-6 space-y-12">
        {/* Core Pillars */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PILLARS.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.title}
                className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#172033] mb-1">
                    {pillar.title}
                  </h3>
                  <p className="text-xs text-[#667085] leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              </div>
            );
          })}
        </section>

        {/* 5-Step Inspection Workflow */}
        <section className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-xs">
          <div className="max-w-2xl mb-8">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#2563EB] mb-1">
              End-to-End Architecture
            </h2>
            <h3 className="text-xl font-bold text-[#172033]">
              The 5-Stage Verification Workflow
            </h3>
            <p className="text-xs text-[#667085] mt-1">
              How LABEL LENS AI processes physical packages from raw pixels to verified statutory verdicts.
            </p>
          </div>

          <div className="space-y-6 relative before:absolute before:inset-0 before:left-4 before:h-full before:w-0.5 before:bg-[#E2E8F0] ml-2">
            {WORKFLOW_STEPS.map((step) => (
              <div key={step.step} className="relative flex items-start gap-5 pl-2">
                <div className="w-8 h-8 rounded-full bg-[#163A5F] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 z-10 shadow-xs">
                  {step.step}
                </div>
                <div className="flex-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                    <h4 className="text-sm font-bold text-[#172033]">
                      {step.title}
                    </h4>
                    <span className="text-[11px] font-semibold text-[#2563EB] bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      {step.subtitle}
                    </span>
                  </div>
                  <p className="text-xs text-[#667085] leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Statutory Regulatory Framework Card */}
        <section className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-xs">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-[#163A5F] flex items-center justify-center flex-shrink-0">
              <ScaleIcon className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-[#172033] mb-1">
                Statutory Charter & Legal Scope
              </h3>
              <p className="text-xs text-[#667085] leading-relaxed mb-4">
                Under the <strong>Legal Metrology Act, 2009</strong> and the{' '}
                <strong>Legal Metrology (Packaged Commodities) Rules, 2011</strong>, pre-packaged commodities
                sold in India must bear mandatory declarations in prescribed font sizes, formats, and positions.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                  <strong className="text-[#172033] block mb-1">Rule 6(1)(a) – Commodity Name</strong>
                  <span className="text-[#667085]">Generic or common name of the commodity contained in package.</span>
                </div>
                <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                  <strong className="text-[#172033] block mb-1">Rule 6(1)(b) – Manufacturer / Packer</strong>
                  <span className="text-[#667085]">Full name, registered office address, and country of origin if imported.</span>
                </div>
                <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                  <strong className="text-[#172033] block mb-1">Rule 6(1)(c) – Net Quantity</strong>
                  <span className="text-[#667085]">Declared in standard units of weight, volume, or count with units.</span>
                </div>
                <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                  <strong className="text-[#172033] block mb-1">Rule 6(1)(d) & (e) – MRP & Dates</strong>
                  <span className="text-[#667085]">Maximum Retail Price (incl. of all taxes) and month/year of manufacture.</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SIH Presentation Footer Info */}
        <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200/80 text-center text-xs text-[#667085]">
          <span className="font-semibold text-[#163A5F]">Smart India Hackathon 2024 · Ministry of Consumer Affairs, Food & Public Distribution</span>
          <p className="mt-1 text-[11px]">Department of Consumer Affairs · Legal Metrology Division</p>
        </div>
      </div>
    </div>
  );
}

