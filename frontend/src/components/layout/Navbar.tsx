import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export function Navbar() {
  const location = useLocation();

  const navLinks = [
    { to: '/home', label: 'Home' },
    { to: '/scan', label: 'Scan' },
    { to: '/about', label: 'About' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-border">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/home" className="flex items-center gap-2 no-underline" aria-label="Label Lens AI home">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: '#1A3A5C' }}
            aria-hidden
          >
            LL
          </div>
          <span className="text-sm font-semibold" style={{ color: '#1A3A5C' }}>
            Label Lens AI
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-1" aria-label="Primary navigation">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={[
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors no-underline',
                location.pathname === link.to
                  ? 'bg-surface text-text-primary'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface',
              ].join(' ')}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
