import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  FolderOpenIcon,
  ArrowPathIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { getScanHistory, downloadReport } from '../api/client';
import type { InspectionHistoryItem } from '../types';

type StatusFilterType = 'all' | 'verified' | 'manual_review' | 'potential_issue' | 'ineligible';

export default function HistoryPage() {
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

  const filterButtons: { label: string; value: StatusFilterType }[] = [
    { label: 'All Inspections', value: 'all' },
    { label: 'Verified', value: 'verified' },
    { label: 'Requires Review', value: 'manual_review' },
    { label: 'Potential Issue', value: 'potential_issue' },
    { label: 'Not Analyzed', value: 'ineligible' },
  ];

  return (
    <div className="min-h-screen bg-[#F6F8FB] text-[#172033]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E5EAF0]">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#172033]">
              Inspection History
            </h1>
            <p className="text-sm text-[#667085] mt-1">
              Search, filter, and review all official packaged commodity audits stored in the database.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchHistory(searchQuery, activeStatus)}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#667085] bg-white border border-[#E5EAF0] rounded-lg hover:bg-slate-50 transition cursor-pointer"
            >
              <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => navigate('/scan')}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1d4ed8] rounded-lg shadow-xs transition cursor-pointer"
            >
              Scan New Package
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="mt-6 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#667085]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by product name, scan ID, or file..."
              className="w-full pl-10 pr-20 py-2 text-sm bg-white border border-[#E5EAF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] text-[#172033] placeholder-[#667085]"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 text-xs font-semibold text-white bg-[#163A5F] hover:bg-[#234d7a] rounded-md transition"
            >
              Search
            </button>
          </form>

          {/* Status Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {filterButtons.map((btn) => {
              const active = activeStatus === btn.value;
              return (
                <button
                  key={btn.value}
                  onClick={() => setActiveStatus(btn.value)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                    active
                      ? 'bg-[#163A5F] text-white shadow-xs'
                      : 'bg-white text-[#667085] border border-[#E5EAF0] hover:bg-slate-50'
                  }`}
                >
                  {btn.label}
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="mt-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => fetchHistory(searchQuery, activeStatus)} className="underline font-medium text-xs">
              Retry
            </button>
          </div>
        )}

        {/* History Table */}
        <div className="mt-6 bg-white border border-[#E5EAF0] rounded-xl shadow-xs overflow-hidden">
          <div className="px-6 py-3.5 bg-[#F8F9FA] border-b border-[#E5EAF0] flex items-center justify-between text-xs text-[#667085]">
            <span>Showing {items.length} of {total} inspection records</span>
            <span>Grounded Database Records</span>
          </div>

          {loading ? (
            <div className="p-16 text-center text-sm text-[#667085]">
              <span className="inline-block w-6 h-6 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin mb-3" />
              <p>Querying inspection history database...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-[#667085] flex items-center justify-center mx-auto mb-3">
                <FolderOpenIcon className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-[#172033]">
                No matching inspections found
              </h3>
              <p className="text-xs text-[#667085] mt-1 max-w-sm mx-auto">
                {searchQuery || activeStatus !== 'all'
                  ? 'Try adjusting your search keywords or filter criteria to see stored inspections.'
                  : 'No inspection records are currently stored in the database.'}
              </p>
              {(searchQuery || activeStatus !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setActiveStatus('all');
                    fetchHistory('', 'all');
                  }}
                  className="mt-4 px-3 py-1.5 text-xs font-semibold text-[#2563EB] bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-[#F8F9FA] text-[#667085] text-xs font-semibold uppercase tracking-wider border-b border-[#E5EAF0]">
                    <th className="px-6 py-3">Product / Commodity</th>
                    <th className="px-6 py-3">Audit Verdict</th>
                    <th className="px-6 py-3">Verified Rules</th>
                    <th className="px-6 py-3">Inspection Date</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5EAF0]">
                  {items.map((item) => (
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
                        {item.is_eligible ? (
                          <span>
                            <strong className="text-emerald-700">{item.summary?.verified ?? 0}</strong> verified,{' '}
                            <strong className="text-amber-700">{item.summary?.manual_review ?? 0}</strong> review,{' '}
                            <strong className="text-rose-700">{item.summary?.potential_issue ?? 0}</strong> issues
                          </span>
                        ) : (
                          <span className="italic">Screening suspended</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-[#667085]">
                        {formatDate(item.created_at)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => navigate(`/results/${item.id}`)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#163A5F] bg-[#F1F5F9] hover:bg-[#E2E8F0] rounded-md transition"
                            title="View Inspection"
                          >
                            <EyeIcon className="w-3.5 h-3.5" />
                            View
                          </button>
                          <button
                            onClick={(e) => handleDownload(item.id, e)}
                            disabled={downloadingId === item.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#2563EB] bg-blue-50 hover:bg-blue-100 rounded-md transition"
                            title="Download PDF Report"
                          >
                            <ArrowDownTrayIcon className={`w-3.5 h-3.5 ${downloadingId === item.id ? 'animate-bounce' : ''}`} />
                            PDF
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
