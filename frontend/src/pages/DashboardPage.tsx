import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            Verified
          </span>
        );
      case 'manual_review':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Requires Review
          </span>
        );
      case 'potential_issue':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
            Potential Issue
          </span>
        );
      case 'ineligible':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
            Suspended
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200">
            Uploaded
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#172033]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
        {/* Top Hero Section */}
        <section className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#163A5F]/8 text-[#163A5F]">
                <ShieldCheckIcon className="w-3.5 h-3.5 text-[#163A5F]" />
                <span>Legal Metrology (Packaged Commodities) Rules, 2011</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#172033] leading-tight">
                AI-Assisted Packaged Commodity Inspection
              </h1>
              <p className="text-sm sm:text-base text-[#667085] leading-relaxed">
                Automated statutory declaration screening for Legal Metrology officers and compliance auditors. Evidence-backed, explainable, and grounded in OCR verification.
              </p>
            </div>

            {/* Primary & Secondary Actions */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 flex-shrink-0">
              <button
                onClick={() => navigate('/scan')}
                className="inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl text-sm font-semibold text-white bg-[#163A5F] hover:bg-[#1f4f82] active:bg-[#122e4c] shadow-sm transition-all cursor-pointer hover:shadow"
              >
                <DocumentMagnifyingGlassIcon className="w-5 h-5 text-white" />
                <span>Scan a Package</span>
              </button>
              <button
                onClick={() => navigate('/results?scan_id=9e573e39-0695-445a-846e-53195cf08716&demo=true')}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-[#2563EB] bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-all cursor-pointer"
                title="View pre-analyzed inspection with complete evidence mapping"
              >
                <SparklesIcon className="w-4 h-4 text-[#2563EB]" />
                <span>Try Sample Inspection</span>
              </button>
              <button
                onClick={() => navigate('/history')}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-[#667085] hover:text-[#172033] transition-all cursor-pointer text-center"
              >
                <span>View Inspection History →</span>
              </button>
            </div>
          </div>
        </section>

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center justify-between shadow-2xs">
            <span>{error}</span>
            <button onClick={fetchStats} className="underline font-medium text-xs cursor-pointer">Retry</button>
          </div>
        )}

        {/* Real Metrics Grid */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-[#172033]">
              Inspection Overview
            </h2>
            <button
              onClick={fetchStats}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#667085] bg-white border border-[#E2E8F0] rounded-lg hover:bg-slate-50 transition cursor-pointer"
              title="Refresh database statistics"
            >
              <ArrowPathIcon className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Metrics</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Scans Card */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs transition-all hover:border-[#163A5F]/30 hover:shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#667085] uppercase tracking-wider">
                  Total Inspections
                </span>
                <div className="w-9 h-9 rounded-lg bg-[#163A5F]/8 text-[#163A5F] flex items-center justify-center">
                  <FolderOpenIcon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-[#172033] mt-3 tracking-tight">
                {loading ? '—' : stats?.total_scans ?? 0}
              </p>
              <p className="text-xs text-[#667085] mt-1">
                Database scan sessions logged
              </p>
            </div>

            {/* Eligible / Verified Packages Card */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs transition-all hover:border-emerald-300 hover:shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#667085] uppercase tracking-wider">
                  Verified
                </span>
                <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ShieldCheckIcon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-[#172033] mt-3 tracking-tight">
                {loading ? '—' : stats?.eligible_analyses ?? 0}
              </p>
              <p className="text-xs text-[#667085] mt-1">
                Eligible packages screened
              </p>
            </div>

            {/* Manual Review Required Card */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs transition-all hover:border-amber-300 hover:shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#667085] uppercase tracking-wider">
                  Requires Review
                </span>
                <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <ClockIcon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-[#172033] mt-3 tracking-tight">
                {loading ? '—' : stats?.requires_manual_review ?? 0}
              </p>
              <p className="text-xs text-[#667085] mt-1">
                Partial panels / manual confirmation
              </p>
            </div>

            {/* Potential Issues Card */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs transition-all hover:border-rose-300 hover:shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#667085] uppercase tracking-wider">
                  Potential Issues
                </span>
                <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                  <ExclamationTriangleIcon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-[#172033] mt-3 tracking-tight">
                {loading ? '—' : stats?.potential_issues ?? 0}
              </p>
              <p className="text-xs text-[#667085] mt-1">
                Structural non-compliances flagged
              </p>
            </div>
          </div>
        </section>

        {/* Recent Activity Table */}
        <section className="bg-white border border-[#E2E8F0] rounded-2xl shadow-xs overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-[#E2E8F0] flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-[#172033]">
                Recent Inspections
              </h2>
              <p className="text-xs text-[#667085] mt-0.5">
                Most recent package evaluations stored in audit database.
              </p>
            </div>
            <Link
              to="/history"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] hover:text-[#1d4ed8] transition no-underline"
            >
              <span>View all</span>
              <ArrowRightIcon className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F5F7FA] border-b border-[#E2E8F0] text-[11px] font-bold uppercase tracking-wider text-[#667085]">
                  <th className="py-3 px-5 sm:px-6">Product / Scan</th>
                  <th className="py-3 px-5 sm:px-6">Status</th>
                  <th className="py-3 px-5 sm:px-6 hidden sm:table-cell">Date</th>
                  <th className="py-3 px-5 sm:px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-[#667085] text-xs">
                      <div className="w-6 h-6 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      Loading inspections...
                    </td>
                  </tr>
                ) : !stats?.recent_inspections || stats.recent_inspections.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-[#667085] text-xs">
                      No inspections found. Click <strong>Scan a Package</strong> to begin.
                    </td>
                  </tr>
                ) : (
                  stats.recent_inspections.map((scan) => (
                    <tr
                      key={scan.id}
                      onClick={() => navigate(`/results?scan_id=${scan.id}`)}
                      className="hover:bg-[#F5F7FA] transition cursor-pointer group"
                    >
                      <td className="py-4 px-5 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#163A5F]/6 text-[#163A5F] flex items-center justify-center flex-shrink-0 font-mono text-xs font-bold">
                            {scan.product_name ? scan.product_name.slice(0, 2).toUpperCase() : 'PK'}
                          </div>
                          <div className="min-w-0">
                            <span className="font-semibold text-[#172033] block truncate max-w-xs group-hover:text-[#2563EB] transition-colors">
                              {scan.product_name || scan.original_filename}
                            </span>
                            <span className="text-xs text-[#667085] font-mono block">
                              ID: {scan.id.slice(0, 8)}...
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-5 sm:px-6 whitespace-nowrap">
                        {renderStatusBadge(scan)}
                      </td>
                      <td className="py-4 px-5 sm:px-6 text-xs text-[#667085] whitespace-nowrap hidden sm:table-cell font-mono">
                        {formatDate(scan.created_at)}
                      </td>
                      <td className="py-4 px-5 sm:px-6 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/results?scan_id=${scan.id}`);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#163A5F] bg-slate-100 hover:bg-[#163A5F] hover:text-white transition cursor-pointer"
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
        <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] flex items-start gap-3 text-xs text-[#667085]">
          <CheckCircleIcon className="w-5 h-5 text-[#2563EB] shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-[#172033] block">
              Official Legal Metrology Screening Support
            </span>
            <span>
              LABEL LENS AI provides automated compliance screening under Rule 6 of the Legal Metrology (Packaged Commodities) Rules, 2011. Automated findings are designed to support inspectors and require physical verification where indicated.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
