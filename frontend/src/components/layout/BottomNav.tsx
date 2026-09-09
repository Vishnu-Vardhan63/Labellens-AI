import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  CameraIcon,
  Squares2X2Icon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeSolid,
  CameraIcon as CameraSolid,
  Squares2X2Icon as DashboardSolid,
  ClockIcon as HistorySolid,
} from '@heroicons/react/24/solid';

const navItems = [
  { to: '/', label: 'Home', Icon: HomeIcon, ActiveIcon: HomeSolid },
  { to: '/scan', label: 'Scan', Icon: CameraIcon, ActiveIcon: CameraSolid },
  { to: '/dashboard', label: 'Inspector', Icon: Squares2X2Icon, ActiveIcon: DashboardSolid },
  { to: '/history', label: 'History', Icon: ClockIcon, ActiveIcon: HistorySolid },
];

export function BottomNav() {
  const location = useLocation();
  const hiddenPaths = ['/splash', '/processing', '/status'];
  if (hiddenPaths.some((p) => location.pathname.startsWith(p))) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-[#07111F]/90 backdrop-blur-xl border-t border-white/10 shadow-2xl md:hidden"
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around h-16 max-w-md mx-auto px-2">
        {navItems.map(({ to, label, Icon, ActiveIcon }) => {
          const isActive =
            to === '/'
              ? location.pathname === '/' || location.pathname === '/home'
              : location.pathname.startsWith(to);
          const CurrentIcon = isActive ? ActiveIcon : Icon;

          return (
            <Link
              key={to}
              to={to}
              className={[
                'flex-1 flex flex-col items-center justify-center h-full gap-1 text-[11px] font-medium transition-colors no-underline cursor-pointer',
                isActive ? 'text-[#38BDF8] font-bold' : 'text-slate-400 hover:text-white',
              ].join(' ')}
              aria-current={isActive ? 'page' : undefined}
            >
              <CurrentIcon className={`w-5 h-5 ${isActive ? 'text-[#38BDF8]' : 'text-slate-400'}`} aria-hidden />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

