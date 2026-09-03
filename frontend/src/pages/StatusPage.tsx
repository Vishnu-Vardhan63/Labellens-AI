import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { ArrowLeftIcon, ClockIcon } from '@heroicons/react/24/outline';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import type { UploadResponse } from '../types';

function formatTimestamp(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false,
    });
  } catch {
    return iso;
  }
}

export default function StatusPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { result?: UploadResponse; preview?: string } | null;

  if (!state?.result) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 text-center">
        <p className="text-sm mb-4" style={{ color: '#64748B' }}>No upload data found.</p>
        <Button variant="secondary" onClick={() => navigate('/home')}>Go to Home</Button>
      </div>
    );
  }

  const { result, preview } = state;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Back */}
        <button
          onClick={() => navigate('/home')}
          className="flex items-center gap-2 text-sm mb-6 hover:underline cursor-pointer"
          style={{ color: '#64748B' }}
          aria-label="Back to home"
        >
          <ArrowLeftIcon className="w-4 h-4" aria-hidden />
          Back to Home
        </button>

        {/* Success header */}
        <div className="flex items-start gap-3 mb-6">
          <CheckCircleIcon className="w-8 h-8 flex-shrink-0" style={{ color: '#16A34A' }} aria-hidden />
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#0F172A' }}>
              Image received
            </h1>
            <p className="text-sm mt-0.5" style={{ color: '#64748B' }}>
              The image has been stored and a scan record has been created.
            </p>
          </div>
        </div>

        {/* System status notice */}
        <div
          className="p-3 rounded-lg border mb-6 text-sm"
          style={{ backgroundColor: '#FFFBEB', borderColor: '#FDE68A', color: '#92400E' }}
          role="status"
          aria-label="System status"
        >
          <strong>System status:</strong> Analysis modules will be connected in the next
          development phase. No compliance analysis has been performed.
        </div>

        {/* Image preview */}
        {preview && (
          <div className="rounded-xl overflow-hidden border mb-4" style={{ borderColor: '#E2E8F0' }}>
            <img
              src={preview}
              alt="Uploaded package label"
              className="w-full object-contain max-h-56 bg-surface"
            />
          </div>
        )}

        {/* Upload details */}
        <Card className="mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: '#64748B' }}>
            Upload Details
          </h2>
          <dl className="space-y-3">
            <div className="flex justify-between items-start gap-4">
              <dt className="text-sm" style={{ color: '#64748B' }}>Status</dt>
              <dd><Badge variant="success">Uploaded</Badge></dd>
            </div>
            <div className="flex justify-between items-start gap-4">
              <dt className="text-sm" style={{ color: '#64748B' }}>Image ID</dt>
              <dd className="text-sm font-mono break-all" style={{ color: '#0F172A' }}>{result.image_id}</dd>
            </div>
            <div className="flex justify-between items-start gap-4">
              <dt className="text-sm" style={{ color: '#64748B' }}>Filename</dt>
              <dd className="text-sm truncate max-w-[200px]" style={{ color: '#0F172A' }}>
                {result.original_filename}
              </dd>
            </div>
            <div className="flex justify-between items-start gap-4">
              <dt className="text-sm flex items-center gap-1" style={{ color: '#64748B' }}>
                <ClockIcon className="w-3.5 h-3.5" aria-hidden />
                Timestamp
              </dt>
              <dd className="text-sm" style={{ color: '#0F172A' }}>
                {formatTimestamp(result.upload_timestamp)}
              </dd>
            </div>
          </dl>
        </Card>

        {/* Server message */}
        <Card className="mb-8" padding="sm">
          <p className="text-xs" style={{ color: '#64748B' }}>
            <strong style={{ color: '#0F172A' }}>Server message:</strong> {result.message}
          </p>
        </Card>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button fullWidth onClick={() => navigate('/scan')}>
            Scan another package
          </Button>
          <Button variant="secondary" fullWidth onClick={() => navigate('/home')}>
            Go to Home
          </Button>
        </div>

        {/* Mobile bottom padding */}
        <div className="h-20 sm:hidden" aria-hidden />
      </div>
    </div>
  );
}
