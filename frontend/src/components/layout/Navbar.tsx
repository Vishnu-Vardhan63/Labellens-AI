import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Squares2X2Icon,
  DocumentMagnifyingGlassIcon,
  ClockIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

export function Navbar() {
  const location = useLocation();

  const navLinks = [
    { to: '/', label: 'Dashboard', icon: Squares2X2Icon },
    { to: '/scan', label: 'Scan', icon: DocumentMagnifyingGlassIcon },
    { to: '/history', label: 'History', icon: ClockIcon },
    { to: '/about', label: 'About', icon: InformationCircleIcon },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#E2E8F0] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Title */}
        <Link to="/" className="flex items-center gap-3 no-underline group" aria-label="Label Lens AI dashboard">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-black tracking-wider shadow-xs transition-transform group-hover:scale-102"
            style={{ backgroundColor: '#163A5F' }}
            aria-hidden
          >
            LL
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight text-[#163A5F]">
                LABEL LENS AI
              </span>
              <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold bg-[#163A5F]/10 text-[#163A5F]">
                GOV/LM
              </span>
            </div>
            <span className="text-[11px] font-medium text-[#667085] tracking-tight">
              Legal Metrology Compliance
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Primary navigation">
          {navLinks.map(({ to, label, icon: Icon }) => {
            const isActive =
              to === '/'
                ? location.pathname === '/' || location.pathname === '/dashboard' || location.pathname === '/home'
                : location.pathname.startsWith(to);

            return (
              <Link
                key={to}
                to={to}
                className={[
                  'relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all no-underline cursor-pointer',
                  isActive
                    ? 'text-[#163A5F] bg-[#163A5F]/6 font-semibold'
                    : 'text-[#667085] hover:text-[#172033] hover:bg-[#F5F7FA]',
                ].join(' ')}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#163A5F]' : 'text-[#667085]'}`} aria-hidden />
                <span>{label}</span>
                {isActive && (
                  <span
                    className="absolute bottom-0 left-3.5 right-3.5 h-0.5 rounded-full bg-[#163A5F]"
                    aria-hidden
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Action button in Navbar */}
        <div className="hidden sm:flex items-center gap-3">
          <Link
            to="/scan"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1d4ed8] active:bg-[#1e40af] shadow-xs transition no-underline cursor-pointer"
          >
            <DocumentMagnifyingGlassIcon className="w-3.5 h-3.5" aria-hidden />
            <span>Scan Package</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
