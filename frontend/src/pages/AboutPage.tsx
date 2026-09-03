import React from 'react';
import { Card } from '../components/ui/Card';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-xl font-bold mb-1" style={{ color: '#0F172A' }}>About</h1>
          <p className="text-sm" style={{ color: '#64748B' }}>Legal Metrology Compliance System</p>
        </div>

        <div className="space-y-4">
          <Card>
            <h2 className="text-sm font-semibold mb-2" style={{ color: '#0F172A' }}>What is Label Lens AI?</h2>
            <p className="text-sm leading-relaxed" style={{ color: '#64748B' }}>
              Label Lens AI is a compliance verification tool for packaged commodity inspectors.
              It enables rapid analysis of package labels against requirements under the Legal
              Metrology Act, 2009 and the Packaged Commodities (PC/PWMG) Rules, 2011.
            </p>
          </Card>

          <Card>
            <h2 className="text-sm font-semibold mb-2" style={{ color: '#0F172A' }}>Regulatory Scope</h2>
            <ul className="text-sm space-y-1" style={{ color: '#64748B' }}>
              <li>· Legal Metrology Act, 2009</li>
              <li>· Legal Metrology (Packaged Commodities) Rules, 2011</li>
              <li>· Mandatory declaration requirements for pre-packaged goods</li>
            </ul>
          </Card>

          <Card>
            <h2 className="text-sm font-semibold mb-2" style={{ color: '#0F172A' }}>Project</h2>
            <p className="text-sm" style={{ color: '#64748B' }}>Smart India Hackathon · SIH26034</p>
            <p className="text-sm mt-1" style={{ color: '#64748B' }}>Phase 1 — Foundation &amp; Image Capture</p>
          </Card>
        </div>

        {/* Mobile bottom padding */}
        <div className="h-20 sm:hidden" aria-hidden />
      </div>
    </div>
  );
}
