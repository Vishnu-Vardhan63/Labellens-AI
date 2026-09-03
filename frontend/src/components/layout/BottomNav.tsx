import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HomeIcon, MagnifyingGlassIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { HomeIcon as HomeIconSolid, MagnifyingGlassIcon as ScanIconSolid } from '@heroicons/react/24/solid';

const navItems = [
  { to: '/home', label: 'Home', Icon: HomeIcon, ActiveIcon: HomeIconSolid },
  { to: '/scan', label: 'Scan', Icon: MagnifyingGlassIcon, ActiveIcon: ScanIconSolid },
  { to: '/about', label: 'About', Icon: InformationCircleIcon, ActiveIcon: InformationCircleIcon },
];

export function BottomNav() {
  const location = useLocation();
  // Only show on pages where it makes sense
  const hiddenPaths = ['/splash', '/processing', '/status'];
  if (hiddenPaths.some(p => location.pathname.startsWith(p))) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border sm:hidden"
      aria-label="Mobile navigation"
    >
      <div className="flex">
        {navItems.map(({ to, label, Icon, ActiveIcon }) => {
          const isActive = location.pathname === to;
          const Ic = isActive ? ActiveIcon : Icon;
          return (
            <Link
              key={to}
              to={to}
              className={[
                'flex-1 flex flex-col items-center gap-0.5 py-3 text-xs font-medium transition-colors no-underline',
                isActive ? 'text-accent' : 'text-text-secondary',
              ].join(' ')}
              aria-current={isActive ? 'page' : undefined}
            >
              <Ic className="w-5 h-5" aria-hidden />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
