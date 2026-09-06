import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export function Navbar() {
  const location = useLocation();

  const navLinks = [
    { to: '/', label: 'Dashboard' },
    { to: '/scan', label: 'Scan Package' },
    { to: '/history', label: 'Inspection History' },
    { to: '/about', label: 'About' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#E5EAF0] shadow-2xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-15 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 no-underline" aria-label="Label Lens AI dashboard">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold tracking-wider shadow-2xs"
            style={{ backgroundColor: '#163A5F' }}
            aria-hidden
          >
            LL
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight" style={{ color: '#163A5F' }}>
              LABEL LENS AI
            </span>
            <span className="text-[10px] font-semibold text-[#667085] tracking-wide uppercase -mt-0.5">
              Legal Metrology Compliance
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-1.5" aria-label="Primary navigation">
          {navLinks.map(link => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={[
                  'px-3.5 py-1.5 rounded-lg text-xs font-semibold transition no-underline',
                  isActive
                    ? 'bg-[#163A5F] text-white shadow-2xs'
                    : 'text-[#667085] hover:text-[#172033] hover:bg-[#F6F8FB]',
                ].join(' ')}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
