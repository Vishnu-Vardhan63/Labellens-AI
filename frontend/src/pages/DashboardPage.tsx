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
            {t('results.statusVerified', 'Verified')}
          </span>
        );
      case 'manual_review':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            {t('results.statusReview', 'Requires Review')}
          </span>
        );
      case 'potential_issue':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            {t('results.statusIssue', 'Potential Issue')}
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
    <div className="min-h-screen bg-[#07111F] text-slate-100 pb-20 font-sans">
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
                <span>{t('hero.scanCTA', 'SCAN A PACKAGE')}</span>
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
            <button onClick={fetchStats} className="underline font-medium text-xs cursor-pointer">{t('common.retry', 'Retry')}</button>
          </div>
        )}

        {/* Real Metrics Grid */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-xl font-bold text-white">
              {t('dashboard.overview', 'Inspection Overview')}
            </h2>
            <button
              onClick={fetchStats}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 bg-[#10263F] border border-white/10 rounded-xl hover:bg-[#16324F] transition cursor-pointer"
              title="Refresh database statistics"
            >
              <ArrowPathIcon className={`w-3.5 h-3.5 text-[#38BDF8] ${loading ? 'animate-spin' : ''}`} />
              <span>{t('common.refresh', 'Refresh')}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Scans Card */}
            <div className="bg-[#0B1F3A]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-xl transition-all hover:border-[#38BDF8]/40">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                  {t('dashboard.totalScans', 'Total Inspections')}
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
                  {t('dashboard.verifiedScans', 'Verified')}
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
                  {t('dashboard.reviewScans', 'Requires Review')}
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
                  {t('dashboard.issueScans', 'Potential Issues')}
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
                {t('dashboard.recentInspections', 'Recent Inspections')}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Most recent package evaluations stored in audit database.
              </p>
            </div>
            <button
              onClick={() => navigate('/history')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#38BDF8] hover:text-blue-300 transition cursor-pointer"
            >
              <span>View All</span>
              <ArrowRightIcon className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#10263F]/90 text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/10">
                <tr>
                  <th className="px-6 py-3 font-extrabold">Product / Scan ID</th>
                  <th className="px-6 py-3 font-extrabold">Status Category</th>
                  <th className="px-6 py-3 font-extrabold">Timestamp</th>
                  <th className="px-6 py-3 font-extrabold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                      Loading audit database records...
                    </td>
                  </tr>
                ) : stats?.recent_inspections?.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                      No inspections found in database.
                    </td>
                  </tr>
                ) : (
                  stats?.recent_inspections?.map((item) => (
                    <tr key={item.id} className="hover:bg-white/[0.02] transition">
                      <td className="px-6 py-4">
                        <div className="font-bold text-white">
                          {item.product_name || item.original_filename || 'Packaged Commodity'}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                          ID: {item.id}
                        </div>
                      </td>
                      <td className="px-6 py-4">{renderStatusBadge(item)}</td>
                      <td className="px-6 py-4 text-slate-300 font-mono text-[11px]">
                        {formatDate(item.created_at)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`/results?scan_id=${item.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#38BDF8] bg-[#10263F] border border-blue-400/20 hover:bg-[#16324F] transition"
                        >
                          <EyeIcon className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
