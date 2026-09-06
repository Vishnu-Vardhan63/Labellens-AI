import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SplashPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => navigate('/', { replace: true }), 2200);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{ backgroundColor: '#1A3A5C' }}
    >
      {/* Wordmark */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
          >
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
              <rect x="2" y="6" width="24" height="16" rx="2" stroke="white" strokeWidth="2"/>
              <line x1="7" y1="11" x2="21" y2="11" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="7" y1="14" x2="17" y2="14" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="7" y1="17" x2="13" y2="17" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="text-left">
            <h1 className="text-2xl font-bold text-white tracking-tight leading-none">
              Label Lens AI
            </h1>
          </div>
        </div>
        <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.65)' }}>
          Smart Packaged Commodity Compliance Assistant
        </p>
      </div>

      {/* Bottom attribution */}
      <div
        className="absolute bottom-8 text-xs text-center"
        style={{ color: 'rgba(255,255,255,0.4)' }}
      >
        <p>Smart India Hackathon · SIH26034</p>
        <p className="mt-1">Legal Metrology Compliance</p>
      </div>
    </div>
  );
}
