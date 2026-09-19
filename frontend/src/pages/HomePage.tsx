import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  CameraIcon,
  ClipboardDocumentCheckIcon,
  EyeIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  BriefcaseIcon,
} from '@heroicons/react/24/outline';

export default function HomePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-[#07111F] text-[#F8FAFC] font-sans selection:bg-[#2563EB] selection:text-white">
      {/* ------------------------------------------------------------- */}
      {/* SECTION 1 — HERO / PRODUCT INTRO                               */}
      {/* ------------------------------------------------------------- */}
      <section className="relative flex items-center bg-[#07111F] border-b border-[#16324F] px-4 sm:px-6 lg:px-12 py-16 sm:py-20">
        <div className="max-w-4xl mx-auto w-full text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold bg-[#10263F] text-[#38BDF8] border border-[#16324F]">
            <span className="w-2 h-2 rounded-full bg-[#38BDF8]" />
            <span>{t('hero.badge', 'AI-Assisted Package Intelligence')}</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
              {t('hero.title', 'LABEL LENS AI')}
            </h1>
            <p className="text-xl sm:text-2xl font-bold text-[#38BDF8] tracking-tight">
              {t('hero.subtitle', 'AI-Assisted Packaged Commodity Inspection')}
            </p>
          </div>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
            {t('hero.description', 'Screen packaged commodity labels against mandatory Rule 6 declarations and trace findings back to visual evidence.')}
          </p>

          {/* Primary & Secondary Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <button
              onClick={() => navigate('/scan')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg text-xs font-extrabold text-white bg-[#2563EB] hover:bg-[#1d4ed8] active:bg-[#1e40af] transition cursor-pointer tracking-wider shadow-md"
            >
              <CameraIcon className="w-4 h-4" aria-hidden />
              <span>{t('hero.scanCTA', 'SCAN A PACKAGE')}</span>
            </button>

            <button
              onClick={() => navigate('/how-it-works')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-6 py-3.5 rounded-lg text-xs font-semibold text-slate-200 bg-[#10263F] hover:bg-[#16324F] border border-[#16324F] transition cursor-pointer"
            >
              <span>{t('hero.howItWorksCTA', 'HOW IT WORKS →')}</span>
            </button>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 2 — WHY LABEL LENS AI?                                */}
      {/* ------------------------------------------------------------- */}
      <section className="py-14 bg-[#07111F] text-white px-4 sm:px-6 lg:px-12 border-b border-[#16324F]">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#38BDF8]">
              {t('home.rationale', 'SYSTEM RATIONALE')}
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {t('home.whyTitle', 'Why LabelLens AI?')}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-lg bg-[#0B1F3A] border border-[#16324F] space-y-2">
              <DocumentTextIcon className="w-5 h-5 text-[#38BDF8]" />
              <h3 className="text-xs font-bold text-white">{t('home.autoExtractTitle', 'Automated Extraction')}</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {t('home.autoExtractDesc', 'RapidOCR reads raw text and coordinates without manual typing.')}
              </p>
            </div>

            <div className="p-5 rounded-lg bg-[#0B1F3A] border border-[#16324F] space-y-2">
              <ClipboardDocumentCheckIcon className="w-5 h-5 text-[#38BDF8]" />
              <h3 className="text-xs font-bold text-white">{t('home.ruleScreeningTitle', 'Rule 6 Screening')}</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {t('home.ruleScreeningDesc', 'Screens MRP, Net Qty, Dates, Packer info against statutory standards.')}
              </p>
            </div>

            <div className="p-5 rounded-lg bg-[#0B1F3A] border border-[#16324F] space-y-2">
              <EyeIcon className="w-5 h-5 text-[#38BDF8]" />
              <h3 className="text-xs font-bold text-white">{t('home.visualGroundingTitle', 'Visual Evidence Grounding')}</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {t('home.visualGroundingDesc', 'Every extracted finding maps to bounding box coordinates on the package image.')}
              </p>
            </div>

            <div className="p-5 rounded-lg bg-[#0B1F3A] border border-[#16324F] space-y-2">
              <ShieldCheckIcon className="w-5 h-5 text-[#38BDF8]" />
              <h3 className="text-xs font-bold text-white">{t('home.humanReviewTitle', 'Human Review')}</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {t('home.humanReviewDesc', 'Ambiguous or missing declarations flag authorized officers for decision-making.')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 3 — BUILT FOR INSPECTION WORKFLOWS                    */}
      {/* ------------------------------------------------------------- */}
      <section className="py-14 bg-[#0B1F3A] text-white px-4 sm:px-6 lg:px-12 border-b border-[#16324F]">
        <div className="max-w-4xl mx-auto space-y-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-semibold bg-[#10263F] text-emerald-400 border border-[#16324F]">
            <BriefcaseIcon className="w-4 h-4 text-emerald-400" />
            <span>{t('home.builtForInspection', 'Built for Inspection Workflows')}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {t('home.designedForOfficers', 'Designed for Regulatory Officers & Compliance Teams')}
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            {t('home.legalDisclaimer', 'LabelLens AI serves as a first-level decision support tool. Final enforcement determinations remain with authorized officers under Legal Metrology Act, 2009.')}
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => navigate('/inspector')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-xs font-bold text-white bg-[#10263F] hover:bg-[#16324F] border border-[#16324F] transition cursor-pointer"
            >
              <span>{t('hero.inspectorCTA', 'OPEN INSPECTOR WORKSPACE →')}</span>
            </button>

            <button
              onClick={() => navigate('/about')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer"
            >
              <span>{t('home.readScope', 'Read Scope & Legal Limitations →')}</span>
            </button>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 4 — READY TO ANALYZE CTA                             */}
      {/* ------------------------------------------------------------- */}
      <section className="py-16 bg-[#07111F] text-white px-4 sm:px-6 lg:px-12">
        <div className="max-w-4xl mx-auto bg-[#10263F] border border-[#16324F] rounded-2xl p-8 sm:p-10 text-center shadow-xl space-y-6">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
            {t('home.readyTitle', 'Ready to Analyze a Package?')}
          </h2>
          <p className="text-sm text-[#94A3B8] max-w-xl mx-auto leading-relaxed">
            {t('home.readyDesc', 'Experience AI-assisted package label analysis through a simple scan.')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={() => navigate('/scan')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl text-xs font-bold text-white bg-[#2563EB] hover:bg-[#1d4ed8] active:bg-[#1e40af] shadow-lg shadow-blue-500/25 transition cursor-pointer tracking-wider"
            >
              <CameraIcon className="w-4 h-4" aria-hidden />
              <span>📷 {t('hero.scanCTA', 'SCAN A PACKAGE')}</span>
            </button>

            <button
              onClick={() => navigate('/inspector')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-xs font-bold text-[#F8FAFC] bg-[#16324F] hover:bg-[#1f4f82] border border-[#16324F] transition cursor-pointer"
            >
              <span>{t('hero.inspectorCTA', 'OPEN INSPECTOR WORKSPACE →')}</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
