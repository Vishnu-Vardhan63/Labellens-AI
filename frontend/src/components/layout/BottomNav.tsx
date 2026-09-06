import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Squares2X2Icon, DocumentMagnifyingGlassIcon, ClockIcon } from '@heroicons/react/24/outline';
import { Squares2X2Icon as DashboardSolid, DocumentMagnifyingGlassIcon as ScanSolid, ClockIcon as HistorySolid } from '@heroicons/react/24/solid';

const navItems = [
  { to: '/', label: 'Dashboard', Icon: Squares2X2Icon, ActiveIcon: DashboardSolid },
  { to: '/scan', label: 'Scan', Icon: DocumentMagnifyingGlassIcon, ActiveIcon: ScanSolid },
  { to: '/history', label: 'History', Icon: ClockIcon, ActiveIcon: HistorySolid },
];

export function BottomNav() {
  const location = useLocation();
  const hiddenPaths = ['/splash', '/processing', '/status'];
  if (hiddenPaths.some(p => location.pathname.startsWith(p))) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#E2E8F0] shadow-md sm:hidden"
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around h-16">
        {navItems.map(({ to, label, Icon, ActiveIcon }) => {
          const isActive =
            to === '/'
              ? location.pathname === '/' || location.pathname === '/dashboard' || location.pathname === '/home'
              : location.pathname.startsWith(to);
          const CurrentIcon = isActive ? ActiveIcon : Icon;

          return (
            <Link
              key={to}
              to={to}
              className={[
                'flex-1 flex flex-col items-center justify-center h-full gap-1 text-[11px] font-medium transition-colors no-underline cursor-pointer',
                isActive ? 'text-[#163A5F] font-semibold' : 'text-[#667085] hover:text-[#172033]',
              ].join(' ')}
              aria-current={isActive ? 'page' : undefined}
            >
              <CurrentIcon className={`w-5 h-5 ${isActive ? 'text-[#163A5F]' : 'text-[#667085]'}`} aria-hidden />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
