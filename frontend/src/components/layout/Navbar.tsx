import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from '../../i18n';
import {
  HomeIcon,
  InformationCircleIcon,
  UserGroupIcon,
  CameraIcon,
  Squares2X2Icon,
  QuestionMarkCircleIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';

export function Navbar() {
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const { t, i18n } = useTranslation();

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value;
    i18n.changeLanguage(newLang);
    localStorage.setItem('label_lens_lang', newLang);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleScrollToHash = (e: React.MouseEvent<HTMLAnchorElement>, hash: string) => {
    if (location.pathname === '/' || location.pathname === '/home') {
      e.preventDefault();
      const el = document.getElementById(hash);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.location.hash = hash;
      }
    }
  };

  const navLinks = [
    { to: '/', label: 'Home', icon: HomeIcon, isHash: false },
    { to: '/#how-it-works', label: 'How It Works', icon: QuestionMarkCircleIcon, isHash: true, hash: 'how-it-works' },
    { to: '/about', label: 'About', icon: InformationCircleIcon, isHash: false },
    { to: '/#team', label: 'Team', icon: UserGroupIcon, isHash: true, hash: 'team' },
  ];

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#07111F]/90 backdrop-blur-md border-b border-[#16324F] shadow-lg'
          : 'bg-[#07111F] border-b border-[#0B1F3A]'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand Logo & Title */}
        <Link to="/" className="flex items-center gap-3 no-underline group" aria-label="Label Lens AI home">
          <div className="bg-white rounded-lg p-1 shadow-sm border border-white/20 flex items-center justify-center h-9 overflow-hidden transition-transform group-hover:scale-105">
            <img
              src="/logo.png"
              alt="LabelLens AI Logo"
              className="h-full w-auto object-contain"
            />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold tracking-tight text-[#F8FAFC]">
                LABEL LENS AI
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#2563EB]/20 text-[#38BDF8] border border-[#38BDF8]/30">
                GOV-READY
              </span>
            </div>
            <span className="text-[11px] font-medium text-[#94A3B8] tracking-tight">
              AI-Assisted Package Intelligence
            </span>
          </div>
        </Link>

        {/* Center Navigation */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Primary navigation">
          {navLinks.map(({ to, label, icon: Icon, isHash, hash }) => {
            const isActive =
              !isHash && to === '/'
                ? location.pathname === '/' || location.pathname === '/home'
                : !isHash && location.pathname.startsWith(to);

            return (
              <Link
                key={label}
                to={to}
                onClick={isHash && hash ? (e) => handleScrollToHash(e, hash) : undefined}
                className={[
                  'relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all no-underline cursor-pointer',
                  isActive
                    ? 'text-[#F8FAFC] bg-[#16324F] font-semibold'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#10263F]',
                ].join(' ')}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#38BDF8]' : 'text-[#94A3B8]'}`} aria-hidden />
                <span>{label}</span>
                {isActive && (
                  <span
                    className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-[#38BDF8]"
                    aria-hidden
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right: Secondary & Primary Actions + Global Language Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Global Multilingual Selector */}
          <div className="relative flex items-center">
            <GlobeAltIcon className="w-4 h-4 text-[#38BDF8] absolute left-2.5 pointer-events-none z-10" />
            <select
              value={i18n.language}
              onChange={handleLanguageChange}
              aria-label="Select Language"
              className="bg-[#10263F] text-[#F8FAFC] text-xs font-medium pl-8 pr-3 py-1.5 rounded-lg border border-[#16324F] hover:border-[#38BDF8]/50 focus:border-[#38BDF8] focus:outline-none cursor-pointer transition appearance-none"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code} className="bg-[#0B1F3A] text-white py-1">
                  {lang.flag} {lang.nativeName} ({lang.name})
                </option>
              ))}
            </select>
          </div>

          <Link
            to="/dashboard"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-[#F8FAFC] bg-[#10263F] hover:bg-[#16324F] border border-[#16324F] transition cursor-pointer"
          >
            <Squares2X2Icon className="w-4 h-4 text-[#38BDF8]" />
            <span>{t('nav.inspector', 'Inspector Workspace')}</span>
          </Link>

          <Link
            to="/scan"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold text-white bg-[#2563EB] hover:bg-[#1d4ed8] active:bg-[#1e40af] shadow-xs transition no-underline cursor-pointer tracking-wider"
          >
            <CameraIcon className="w-4 h-4" aria-hidden />
            <span>📷 {t('hero.scanCTA', 'SCAN A PACKAGE')}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
