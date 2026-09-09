import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';

export function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="bg-[#07111F] border-t border-[#16324F] text-[#94A3B8] text-xs py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-[#16324F]">
          {/* Brand Logo & Tagline */}
          <div className="space-y-3">
            <Link to="/" className="flex items-center gap-3 no-underline group">
              <div className="bg-white rounded-lg p-1.5 shadow-sm border border-white/20 flex items-center justify-center h-10 overflow-hidden">
                <img
                  src="/logo.png"
                  alt="LabelLens AI — Scan • Analyze • Ensure Compliance"
                  className="h-full w-auto object-contain"
                />
              </div>
              <div>
                <span className="text-sm font-extrabold text-[#F8FAFC] tracking-tight block">
                  LABEL LENS AI
                </span>
                <span className="text-[11px] text-[#94A3B8] font-medium block">
                  AI-Assisted Package Intelligence Platform
                </span>
              </div>
            </Link>
          </div>

          {/* Quick Links */}
          <div className="flex flex-wrap gap-6 text-xs font-semibold text-slate-300">
            <Link to="/" className="hover:text-[#38BDF8] transition">{t('nav.home', 'Home')}</Link>
            <Link to="/scan" className="hover:text-[#38BDF8] transition">{t('nav.scan', 'Smart Scan')}</Link>
            <Link to="/dashboard" className="hover:text-[#38BDF8] transition">{t('nav.inspector', 'Inspector Workspace')}</Link>
            <Link to="/history" className="hover:text-[#38BDF8] transition">{t('nav.history', 'History')}</Link>
            <Link to="/about" className="hover:text-[#38BDF8] transition">{t('nav.about', 'About')}</Link>
          </div>
        </div>

        {/* Disclaimer & Copyright */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <p className="leading-relaxed max-w-2xl text-center sm:text-left">
            LABEL LENS AI provides AI-assisted analysis to support users and inspection workflows. Final regulatory decisions remain with authorized authorities under the Legal Metrology Act, 2009.
          </p>
          <div className="flex items-center gap-2 font-mono text-slate-500 shrink-0">
            <ShieldCheckIcon className="w-4 h-4 text-[#38BDF8]" />
            <span>Smart India Hackathon 2026</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
