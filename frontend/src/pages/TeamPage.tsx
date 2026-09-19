import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CameraIcon, CodeBracketIcon } from '@heroicons/react/24/outline';

const TEAM_MEMBERS = [
  {
    name: 'Vishnu',
    role: 'Team Lead & Full-Stack Development',
    contribution: 'Architecture, FastAPI backend integration, RapidOCR deployment, and database persistence.',
    initial: 'V',
    bg: 'bg-[#2563EB]',
  },
  {
    name: 'Harshini',
    role: 'ML / Data Engineering',
    contribution: 'OCR bounding box pipeline, ONNX runtime optimization, and text field extraction logic.',
    initial: 'H',
    bg: 'bg-[#38BDF8]',
  },
  {
    name: 'Bindhu',
    role: 'Frontend Development',
    contribution: 'React SPA layout, visual evidence viewer, i18n multilingual support, and responsive UI components.',
    initial: 'B',
    bg: 'bg-[#6366F1]',
  },
  {
    name: 'Aravind',
    role: 'Backend & API Development',
    contribution: 'FastAPI route optimization, database migration helpers, and CORS configuration.',
    initial: 'A',
    bg: 'bg-[#10B981]',
  },
  {
    name: 'Kotesh',
    role: 'Compliance Research & Testing',
    contribution: 'Legal Metrology Rule 6 requirements research, rule validation test cases, and PDF report generation.',
    initial: 'K',
    bg: 'bg-[#F59E0B]',
  },
  {
    name: 'Akhila',
    role: 'QA & UI Design',
    contribution: 'User experience testing, responsive mobile layout refinement, and accessibility testing.',
    initial: 'A',
    bg: 'bg-[#EC4899]',
  },
];

export default function TeamPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-[#07111F] text-[#F8FAFC] py-12 px-4 sm:px-6 lg:px-12 font-sans">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-3 pb-8 border-b border-[#16324F]">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-md text-xs font-semibold bg-[#10263F] text-[#38BDF8] border border-[#16324F]">
            <span>{t('team.badge', 'SIH 2026 ENGINEERING TEAM')}</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            {t('team.title', 'THE TEAM')}
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            {t('team.subtitle', 'Built by students combining AI, software engineering, and statutory problem solving for Legal Metrology package compliance.')}
          </p>
        </div>

        {/* Team Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {TEAM_MEMBERS.map((member) => (
            <div
              key={member.name}
              className="bg-[#0B1F3A] border border-[#16324F] rounded-lg p-6 space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-lg ${member.bg} text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0`}>
                    {member.initial}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white leading-snug">
                      {member.name}
                    </h2>
                    <p className="text-xs text-[#38BDF8] font-semibold">
                      {member.role}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#16324F]">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    {t('team.keyContribution', 'Key Contribution')}
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {member.contribution}
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-slate-400 bg-[#10263F] px-2.5 py-1 rounded border border-[#16324F]">
                  <CodeBracketIcon className="w-3 h-3 text-[#38BDF8]" />
                  <span>{t('team.studentRole', 'Student Contributor')}</span>
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Project Callout */}
        <div className="bg-[#0B1F3A] border border-[#16324F] rounded-lg p-6 text-center space-y-4">
          <h3 className="text-base font-bold text-white">
            {t('team.calloutTitle', 'LabelLens AI — Smart India Hackathon 2026')}
          </h3>
          <p className="text-xs text-slate-300 max-w-xl mx-auto leading-relaxed">
            {t('team.calloutDesc', 'Engineered to automate Statutory Packaged Commodity screening under the Legal Metrology (Packaged Commodities) Rules, 2011.')}
          </p>
          <button
            onClick={() => navigate('/scan')}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-bold text-white bg-[#2563EB] hover:bg-[#1d4ed8] transition cursor-pointer"
          >
            <CameraIcon className="w-4 h-4" />
            <span>{t('team.startScanBtn', 'START A PACKAGE INSPECTION')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
