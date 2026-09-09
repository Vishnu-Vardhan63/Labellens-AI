import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  DocumentMagnifyingGlassIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ArrowRightIcon,
  ArrowPathIcon,
  EyeIcon,
  FolderOpenIcon,
  CheckCircleIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { getDashboardStats } from '../api/client';
import type { DashboardStatsResponse, InspectionHistoryItem } from '../types';

export default function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (err: unknown) {
      setError('Unable to load inspection metrics from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatDate = (iso: string | null) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  const renderStatusBadge = (item: InspectionHistoryItem) => {
    switch (item.status_category) {
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Verified
          </span>
        );
      case 'manual_review':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Requires Review
          </span>
        );
      case 'potential_issue':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            Potential Issue
          </span>
        );
      case 'ineligible':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-white/10">
            Suspended
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800/80 text-slate-400 border border-white/10">
            Uploaded
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#07111F] text-slate-100 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
        {/* Top Hero Section */}
        <section className="bg-[#0B1F3A]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2.5 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#2563EB]/15 text-[#38BDF8] border border-[#2563EB]/30">
                <ShieldCheckIcon className="w-4 h-4 text-[#38BDF8]" />
                <span>Legal Metrology (Packaged Commodities) Rules, 2011</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                {t('dashboard.title', 'AI-Assisted Packaged Commodity Inspection')}
              </h1>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                {t('dashboard.subtitle', 'Automated statutory declaration screening for Legal Metrology officers and compliance auditors.')}
              </p>
            </div>

            {/* Primary & Secondary Actions */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 flex-shrink-0">
              <button
                onClick={() => navigate('/scan')}
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl text-sm font-extrabold text-white bg-[#2563EB] hover:bg-[#1d4ed8] active:bg-[#1e40af] shadow-lg shadow-blue-500/25 transition cursor-pointer"
              >
                <DocumentMagnifyingGlassIcon className="w-5 h-5 text-white" />
                <span>Scan a Package</span>
              </button>
              <button
                onClick={() => navigate('/results?scan_id=9e573e39-0695-445a-846e-53195cf08716&demo=true')}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-[#38BDF8] bg-[#10263F] border border-blue-400/30 hover:bg-[#16324F] transition cursor-pointer shadow-md"
                title="View pre-analyzed inspection with complete evidence mapping"
              >
                <SparklesIcon className="w-4 h-4 text-[#38BDF8]" />
                <span>Try Sample Inspection</span>
              </button>
              <button
                onClick={() => navigate('/history')}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer text-center"
              >
                <span>View Inspection History →</span>
              </button>
            </div>
          </div>
        </section>

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center justify-between shadow-lg">
            <span>{error}</span>
            <button onClick={fetchStats} className="underline font-medium text-xs cursor-pointer">Retry</button>
          </div>
        )}

        {/* Real Metrics Grid */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-xl font-bold text-white">
              Inspection Overview
            </h2>
            <button
              onClick={fetchStats}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 bg-[#10263F] border border-white/10 rounded-xl hover:bg-[#16324F] transition cursor-pointer"
              title="Refresh database statistics"
            >
              <ArrowPathIcon className={`w-3.5 h-3.5 text-[#38BDF8] ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Metrics</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Scans Card */}
            <div className="bg-[#0B1F3A]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-xl transition-all hover:border-[#38BDF8]/40">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                  Total Inspections
                </span>
                <div className="w-9 h-9 rounded-xl bg-[#2563EB]/20 text-[#38BDF8] flex items-center justify-center border border-blue-400/20">
                  <FolderOpenIcon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-white mt-3 tracking-tight">
                {loading ? '—' : stats?.total_scans ?? 0}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Database scan sessions logged
              </p>
            </div>

            {/* Eligible / Verified Packages Card */}
            <div className="bg-[#0B1F3A]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-xl transition-all hover:border-emerald-500/40">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                  Verified
                </span>
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <ShieldCheckIcon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-white mt-3 tracking-tight">
                {loading ? '—' : stats?.eligible_analyses ?? 0}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Eligible packages screened
              </p>
            </div>

            {/* Manual Review Required Card */}
            <div className="bg-[#0B1F3A]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-xl transition-all hover:border-amber-500/40">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                  Requires Review
                </span>
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <ClockIcon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-white mt-3 tracking-tight">
                {loading ? '—' : stats?.requires_manual_review ?? 0}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Partial panels / manual confirmation
              </p>
            </div>

            {/* Potential Issues Card */}
            <div className="bg-[#0B1F3A]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-xl transition-all hover:border-rose-500/40">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                  Potential Issues
                </span>
                <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
                  <ExclamationTriangleIcon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-white mt-3 tracking-tight">
                {loading ? '—' : stats?.potential_issues ?? 0}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Structural non-compliances flagged
              </p>
            </div>
          </div>
        </section>

        {/* Recent Activity Table */}
        <section className="bg-[#0B1F3A]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-xl font-bold text-white">
                Recent Inspections
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Most recent package evaluations stored in audit database.
              </p>
            </div>
            <Link
              to="/history"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#38BDF8] hover:underline transition no-underline"
            >
              <span>View all</span>
              <ArrowRightIcon className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#10263F] border-b border-white/10 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-5 sm:px-6">Product / Scan</th>
                  <th className="py-3.5 px-5 sm:px-6">Status</th>
                  <th className="py-3.5 px-5 sm:px-6 hidden sm:table-cell">Date</th>
                  <th className="py-3.5 px-5 sm:px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-400 text-xs">
                      <div className="w-6 h-6 border-2 border-[#38BDF8] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      Loading inspections...
                    </td>
                  </tr>
                ) : !stats?.recent_inspections || stats.recent_inspections.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-400 text-xs">
                      No inspections found. Click <strong className="text-white">Scan a Package</strong> to begin.
                    </td>
                  </tr>
                ) : (
                  stats.recent_inspections.map((scan) => (
                    <tr
                      key={scan.id}
                      onClick={() => navigate(`/results?scan_id=${scan.id}`)}
                      className="hover:bg-[#10263F]/60 transition cursor-pointer group"
                    >
                      <td className="py-4 px-5 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#2563EB]/20 text-[#38BDF8] flex items-center justify-center flex-shrink-0 font-mono text-xs font-bold border border-blue-400/20">
                            {scan.product_name ? scan.product_name.slice(0, 2).toUpperCase() : 'PK'}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-white block truncate max-w-xs group-hover:text-[#38BDF8] transition-colors">
                              {scan.product_name || scan.original_filename}
                            </span>
                            <span className="text-xs text-slate-400 font-mono block">
                              ID: {scan.id.slice(0, 8)}...
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-5 sm:px-6 whitespace-nowrap">
                        {renderStatusBadge(scan)}
                      </td>
                      <td className="py-4 px-5 sm:px-6 text-xs text-slate-400 whitespace-nowrap hidden sm:table-cell font-mono">
                        {formatDate(scan.created_at)}
                      </td>
                      <td className="py-4 px-5 sm:px-6 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/results?scan_id=${scan.id}`);
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-[#2563EB] hover:bg-[#1d4ed8] transition cursor-pointer shadow-md"
                        >
                          <EyeIcon className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Regulatory Scope Notice */}
        <div className="p-5 rounded-2xl bg-[#0B1F3A]/80 backdrop-blur-xl border border-white/10 flex items-start gap-3.5 text-xs text-slate-300 shadow-xl">
          <CheckCircleIcon className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-extrabold text-white block text-sm mb-0.5">
              Official Legal Metrology Screening Support
            </span>
            <span className="leading-relaxed">
              LABEL LENS AI provides automated compliance screening under Rule 6 of the Legal Metrology (Packaged Commodities) Rules, 2011. Automated findings are designed to support inspectors and require physical verification where indicated.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
