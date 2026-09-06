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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            Verified
          </span>
        );
      case 'manual_review':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Requires Review
          </span>
        );
      case 'potential_issue':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
            Potential Issue
          </span>
        );
      case 'ineligible':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
            Not Analyzed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200">
            Uploaded
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB] text-[#172033]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E5EAF0]">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#163A5F]/10 text-[#163A5F] mb-2">
              Legal Metrology Compliance · SIH26034
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#172033]">
              Inspection Dashboard
            </h1>
            <p className="text-sm text-[#667085] mt-1">
              Real-time audit overview grounded in verified database inspections.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchStats}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#667085] bg-white border border-[#E5EAF0] rounded-lg hover:bg-slate-50 transition cursor-pointer"
              title="Refresh database statistics"
            >
              <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => navigate('/scan')}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1d4ed8] rounded-lg shadow-xs transition cursor-pointer"
            >
              <DocumentMagnifyingGlassIcon className="w-4 h-4" />
              Scan Package
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={fetchStats} className="underline font-medium text-xs">Retry</button>
          </div>
        )}

        {/* Real Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {/* Total Scans */}
          <div className="bg-white border border-[#E5EAF0] rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#667085] uppercase tracking-wider">
                Total Inspections
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center">
                <FolderOpenIcon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-[#172033] mt-3">
              {loading ? '—' : stats?.total_scans ?? 0}
            </p>
            <p className="text-xs text-[#667085] mt-1">
              Database scan sessions logged
            </p>
          </div>

          {/* Eligible Analyses */}
          <div className="bg-white border border-[#E5EAF0] rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#667085] uppercase tracking-wider">
                Eligible Packages
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ShieldCheckIcon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-[#172033] mt-3">
              {loading ? '—' : stats?.eligible_analyses ?? 0}
            </p>
            <p className="text-xs text-[#667085] mt-1">
              Passed package eligibility gate
            </p>
          </div>

          {/* Manual Review Required */}
          <div className="bg-white border border-[#E5EAF0] rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#667085] uppercase tracking-wider">
                Requires Review
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <ClockIcon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-[#172033] mt-3">
              {loading ? '—' : stats?.requires_manual_review ?? 0}
            </p>
            <p className="text-xs text-[#667085] mt-1">
              Physical verification recommended
            </p>
          </div>

          {/* Potential Issues */}
          <div className="bg-white border border-[#E5EAF0] rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#667085] uppercase tracking-wider">
                Potential Issues
              </span>
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <ExclamationTriangleIcon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-[#172033] mt-3">
              {loading ? '—' : stats?.potential_issues ?? 0}
            </p>
            <p className="text-xs text-[#667085] mt-1">
              Configured rule conflict detected
            </p>
          </div>
        </div>

        {/* Recent Inspections Table Section */}
        <div className="mt-8 bg-white border border-[#E5EAF0] rounded-xl shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E5EAF0] flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#172033]">
                Recent Inspections
              </h2>
              <p className="text-xs text-[#667085] mt-0.5">
                Latest package audit records from local database
              </p>
            </div>
            <Link
              to="/history"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:text-[#1d4ed8]"
            >
              View Full History <ArrowRightIcon className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="p-12 text-center text-sm text-[#667085]">
              <span className="inline-block w-5 h-5 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin mb-2" />
              <p>Loading database records...</p>
            </div>
          ) : !stats || stats.recent_inspections.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-[#667085] flex items-center justify-center mx-auto mb-3">
                <FolderOpenIcon className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-[#172033]">
                No inspection data is available yet.
              </h3>
              <p className="text-xs text-[#667085] mt-1 max-w-sm mx-auto">
                Scan your first packaged commodity label to begin tracking compliance records under Legal Metrology Rules.
              </p>
              <button
                onClick={() => navigate('/scan')}
                className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#2563EB] rounded-lg hover:bg-[#1d4ed8]"
              >
                Scan First Package
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-[#F8F9FA] text-[#667085] text-xs font-semibold uppercase tracking-wider border-b border-[#E5EAF0]">
                    <th className="px-6 py-3">Product / Subject</th>
                    <th className="px-6 py-3">Screening Status</th>
                    <th className="px-6 py-3">Inspection Date</th>
                    <th className="px-6 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5EAF0]">
                  {stats.recent_inspections.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/70 transition cursor-pointer"
                      onClick={() => navigate(`/results/${item.id}`)}
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-[#172033] max-w-xs truncate">
                          {item.product_name}
                        </div>
                        <div className="text-xs text-[#667085] font-mono mt-0.5">
                          ID: {item.id.slice(0, 8)} · {item.original_filename}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {renderStatusBadge(item)}
                      </td>
                      <td className="px-6 py-4 text-xs text-[#667085]">
                        {formatDate(item.created_at)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/results/${item.id}`);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#163A5F] bg-[#F1F5F9] hover:bg-[#E2E8F0] rounded-md transition"
                        >
                          <EyeIcon className="w-3.5 h-3.5" />
                          View Scan
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Regulatory Scope Notice */}
        <div className="mt-8 p-4 rounded-xl bg-white border border-[#E5EAF0] flex items-start gap-3 text-xs text-[#667085]">
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
