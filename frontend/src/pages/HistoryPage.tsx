import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  FolderOpenIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { getScanHistory, downloadReport } from '../api/client';
import type { InspectionHistoryItem } from '../types';

type StatusFilterType = 'all' | 'verified' | 'manual_review' | 'potential_issue' | 'ineligible';

export default function HistoryPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [items, setItems] = useState<InspectionHistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeStatus, setActiveStatus] = useState<StatusFilterType>('all');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fetchHistory = useCallback(async (query?: string, statusFilter?: StatusFilterType) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getScanHistory({
        query: query?.trim() || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        limit: 100,
        offset: 0,
      });
      setItems(res.items);
      setTotal(res.total);
    } catch (err: unknown) {
      setError('Failed to fetch inspection records from database.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory(searchQuery, activeStatus);
  }, [activeStatus, fetchHistory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchHistory(searchQuery, activeStatus);
  };

  const handleDownload = async (scanId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (downloadingId) return;
    setDownloadingId(scanId);
    try {
      const blob = await downloadReport(scanId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `LABEL_LENS_INSPECTION_${scanId.slice(0, 8)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: unknown) {
      alert('Unable to download PDF report. Please check that the scan is complete.');
    } finally {
      setDownloadingId(null);
    }
  };

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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            {t('results.statusVerified', 'Verified')}
          </span>
        );
      case 'manual_review':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            {t('results.statusReview', 'Requires Review')}
          </span>
        );
      case 'potential_issue':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            {t('results.statusIssue', 'Potential Issue')}
          </span>
        );
      case 'ineligible':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-white/10">
            {t('history.notAnalyzed', 'Not Analyzed')}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800/80 text-slate-400 border border-white/10">
            Uploaded
          </span>
        );
    }
  };

  const filterButtons: { labelKey: string; defaultLabel: string; value: StatusFilterType }[] = [
    { labelKey: 'history.all', defaultLabel: 'All Inspections', value: 'all' },
    { labelKey: 'history.verified', defaultLabel: 'Verified', value: 'verified' },
    { labelKey: 'history.review', defaultLabel: 'Requires Review', value: 'manual_review' },
    { labelKey: 'history.issues', defaultLabel: 'Potential Issue', value: 'potential_issue' },
    { labelKey: 'history.notAnalyzed', defaultLabel: 'Not Analyzed', value: 'ineligible' },
  ];

  return (
    <div className="min-h-screen bg-[#07111F] text-slate-100 pb-20 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              {t('history.title', 'Inspection History')}
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              {t('history.subtitle', 'Search, filter, and review all official packaged commodity audits stored in the database.')}
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => fetchHistory(searchQuery, activeStatus)}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-300 bg-[#10263F] border border-white/10 rounded-xl hover:bg-[#16324F] transition cursor-pointer"
            >
              <ArrowPathIcon className={`w-4 h-4 text-[#38BDF8] ${loading ? 'animate-spin' : ''}`} />
              {t('common.refresh', 'Refresh')}
            </button>
            <button
              onClick={() => navigate('/scan')}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-extrabold text-white bg-[#2563EB] hover:bg-[#1d4ed8] rounded-xl shadow-lg shadow-blue-500/25 transition cursor-pointer"
            >
              {t('hero.scanCTA', 'Scan New Package')}
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="mt-6 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('history.searchPlaceholder', 'Search by product name, scan ID, or file...')}
              className="w-full pl-10 pr-24 py-2.5 text-xs bg-[#10263F] border border-white/10 rounded-xl focus:outline-none focus:border-[#38BDF8] text-white placeholder-slate-500"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 text-xs font-bold text-white bg-[#2563EB] hover:bg-[#1d4ed8] rounded-lg transition cursor-pointer"
            >
              {t('common.search', 'Search')}
            </button>
          </form>

          {/* Status Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {filterButtons.map((btn) => {
              const active = activeStatus === btn.value;
              return (
                <button
                  key={btn.value}
                  onClick={() => setActiveStatus(btn.value)}
                  className={`px-3.5 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                    active
                      ? 'bg-[#2563EB] text-white shadow-md shadow-blue-500/20'
                      : 'bg-[#10263F] text-slate-400 hover:text-white border border-white/10'
                  }`}
                >
                  {t(btn.labelKey, btn.defaultLabel)}
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="mt-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => fetchHistory(searchQuery, activeStatus)} className="underline font-bold cursor-pointer">
              {t('common.retry', 'Retry')}
            </button>
          </div>
        )}

        {/* History Results Table */}
        <div className="mt-6 bg-[#0B1F3A]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#10263F]/90 text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/10">
                <tr>
                  <th className="px-6 py-3.5 font-extrabold">Product / Scan ID</th>
                  <th className="px-6 py-3.5 font-extrabold">Status Category</th>
                  <th className="px-6 py-3.5 font-extrabold">Timestamp</th>
                  <th className="px-6 py-3.5 font-extrabold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                      <div className="inline-flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-[#38BDF8] border-t-transparent rounded-full animate-spin" />
                        <span>Loading inspection audit history...</span>
                      </div>
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-16 text-center text-slate-400">
                      <FolderOpenIcon className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                      <p className="font-bold text-slate-300 text-sm">{t('common.noData', 'No inspection records found.')}</p>
                      <p className="text-xs text-slate-500 mt-1">Try clearing filters or search query.</p>
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => navigate(`/results?scan_id=${item.id}`)}
                      className="hover:bg-white/[0.03] transition cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="font-bold text-white text-sm">
                          {item.product_name || item.original_filename || 'Packaged Commodity'}
                        </div>
                        <div className="text-[11px] font-mono text-[#38BDF8] mt-0.5">
                          ID: {item.id}
                        </div>
                      </td>
                      <td className="px-6 py-4">{renderStatusBadge(item)}</td>
                      <td className="px-6 py-4 text-slate-300 font-mono text-[11px]">
                        {formatDate(item.created_at)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => navigate(`/results?scan_id=${item.id}`)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[#10263F] border border-white/10 hover:bg-[#16324F] transition cursor-pointer"
                          >
                            <EyeIcon className="w-3.5 h-3.5 text-[#38BDF8]" />
                            <span>View Audit</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDownload(item.id, e)}
                            disabled={downloadingId === item.id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[#2563EB] hover:bg-[#1d4ed8] transition cursor-pointer disabled:opacity-50"
                            title="Download PDF Inspection Report"
                          >
                            <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                            <span>{downloadingId === item.id ? 'Downloading...' : 'PDF'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
