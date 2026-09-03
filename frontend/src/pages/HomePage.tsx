import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { CameraIcon, ArrowUpTrayIcon, DocumentMagnifyingGlassIcon } from '@heroicons/react/24/outline';

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Scan or Upload',
    description: 'Capture the package label using your camera, or upload an existing image.',
  },
  {
    step: '02',
    title: 'Extract Information',
    description: 'The system reads and identifies all declared information on the label.',
  },
  {
    step: '03',
    title: 'Verify Compliance',
    description: 'Declarations are checked against Legal Metrology Act requirements.',
  },
  {
    step: '04',
    title: 'Review Report',
    description: 'Receive a clear compliance report with actionable findings.',
  },
];

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="max-w-2xl mx-auto px-4 pt-12 pb-10 text-center">
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-6 border"
          style={{
            backgroundColor: '#EFF6FF',
            color: '#2563EB',
            borderColor: '#BFDBFE',
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: '#2563EB' }}
            aria-hidden
          />
          Legal Metrology · PC(PWMG) Rules
        </div>

        <h1
          className="text-3xl sm:text-4xl font-bold tracking-tight mb-4 leading-tight"
          style={{ color: '#0F172A' }}
        >
          Check a package label
          <br />
          <span style={{ color: '#1A3A5C' }}>in seconds.</span>
        </h1>

        <p
          className="text-base sm:text-lg mb-8 leading-relaxed"
          style={{ color: '#64748B' }}
        >
          Upload or capture a packaged commodity label to begin compliance analysis
          under the Legal Metrology Act, 2009.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            size="lg"
            onClick={() => navigate('/scan?mode=camera')}
          >
            <CameraIcon className="w-5 h-5" aria-hidden />
            Scan Package
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => navigate('/scan?mode=upload')}
          >
            <ArrowUpTrayIcon className="w-5 h-5" aria-hidden />
            Upload Image
          </Button>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-2xl mx-auto px-4">
        <hr style={{ borderColor: '#E2E8F0' }} />
      </div>

      {/* How it works */}
      <section className="max-w-2xl mx-auto px-4 py-10">
        <h2
          className="text-xs font-semibold uppercase tracking-widest mb-6"
          style={{ color: '#64748B' }}
        >
          How it works
        </h2>
        <ol className="space-y-6" aria-label="Process steps">
          {HOW_IT_WORKS.map(({ step, title, description }) => (
            <li key={step} className="flex gap-4">
              <div
                className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                style={{ backgroundColor: '#F1F5F9', color: '#1A3A5C' }}
                aria-hidden
              >
                {step}
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-1" style={{ color: '#0F172A' }}>
                  {title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: '#64748B' }}>
                  {description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Notice */}
      <section className="max-w-2xl mx-auto px-4 pb-24 sm:pb-10">
        <div
          className="rounded-xl p-4 border"
          style={{ backgroundColor: '#F8FAFF', borderColor: '#DBEAFE' }}
        >
          <div className="flex gap-3">
            <DocumentMagnifyingGlassIcon
              className="w-5 h-5 flex-shrink-0 mt-0.5"
              style={{ color: '#2563EB' }}
              aria-hidden
            />
            <div>
              <p className="text-sm font-medium mb-1" style={{ color: '#1A3A5C' }}>
                Compliance scope
              </p>
              <p className="text-sm" style={{ color: '#64748B' }}>
                This tool checks declarations as required under the Legal Metrology
                (Packaged Commodities) Rules, 2011 — including net quantity, MRP,
                manufacturer details, and mandatory declarations.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
