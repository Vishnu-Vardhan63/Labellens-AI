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
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

export function Navbar() {
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t, i18n } = useTranslation();

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value;
    i18n.changeLanguage(newLang);
    localStorage.setItem('label_lens_lang', newLang);
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
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
      setMobileMenuOpen(false);
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
          ? 'bg-[#07111F]/95 backdrop-blur-md border-b border-[#16324F] shadow-xl'
          : 'bg-[#07111F] border-b border-[#16324F]'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-[72px] flex items-center justify-between gap-4">
        {/* LEFT: Brand Logo & Title */}
        <Link to="/" className="flex items-center gap-3 no-underline group shrink-0" aria-label="LabelLens AI Home">
          <div className="bg-white/95 rounded-lg p-1 border border-white/20 flex items-center justify-center h-9 w-9 overflow-hidden transition-transform group-hover:scale-105 shadow-sm">
            <img
              src="/logo.png"
              alt="LabelLens AI Logo"
              className="h-full w-full object-contain"
            />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black tracking-tight text-white group-hover:text-[#38BDF8] transition-colors">
                LABEL LENS AI
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#2563EB]/20 text-[#38BDF8] border border-[#38BDF8]/30">
                RULE 6 SCREENING
              </span>
            </div>
            <span className="text-[10px] font-medium text-[#94A3B8] tracking-tight">
              AI-Assisted Package Intelligence
            </span>
          </div>
        </Link>

        {/* CENTER: Navigation Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-1.5" aria-label="Primary navigation">
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
                  'relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all no-underline cursor-pointer',
                  isActive
                    ? 'text-white bg-[#10263F] border border-[#16324F]'
                    : 'text-[#94A3B8] hover:text-white hover:bg-[#10263F]/60',
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

        {/* RIGHT: Language, Inspector Workspace & Scan CTA */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Compact Language Selector */}
          <div className="relative flex items-center">
            <GlobeAltIcon className="w-3.5 h-3.5 text-[#38BDF8] absolute left-2.5 pointer-events-none z-10" />
            <select
              value={i18n.language}
              onChange={handleLanguageChange}
              aria-label="Select Language"
              className="bg-[#10263F] text-[#F8FAFC] text-xs font-medium pl-7 pr-2.5 py-2 rounded-lg border border-[#16324F] hover:border-[#38BDF8]/40 focus:border-[#38BDF8] focus:outline-none cursor-pointer transition appearance-none"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code} className="bg-[#0B1F3A] text-white py-1">
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
          </div>

          {/* Secondary CTA: Inspector Workspace */}
          <Link
            to="/dashboard"
            className="hidden lg:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-[#F8FAFC] bg-[#10263F] hover:bg-[#16324F] border border-[#16324F] transition cursor-pointer shrink-0"
          >
            <Squares2X2Icon className="w-4 h-4 text-[#38BDF8]" />
            <span>Inspector Workspace</span>
          </Link>

          {/* Primary CTA: Scan a Package */}
          <Link
            to="/scan"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-extrabold text-white bg-[#2563EB] hover:bg-[#1d4ed8] active:bg-[#1e40af] shadow-md shadow-blue-500/20 transition no-underline cursor-pointer shrink-0"
          >
            <CameraIcon className="w-4 h-4" aria-hidden />
            <span>SCAN A PACKAGE</span>
          </Link>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-[#10263F] transition cursor-pointer"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <XMarkIcon className="w-5 h-5" /> : <Bars3Icon className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#07111F] border-b border-[#16324F] px-4 py-3 space-y-2 shadow-2xl">
          <nav className="flex flex-col space-y-1">
            {navLinks.map(({ to, label, icon: Icon, isHash, hash }) => (
              <Link
                key={label}
                to={to}
                onClick={(e) => {
                  if (isHash && hash) handleScrollToHash(e, hash);
                  else setMobileMenuOpen(false);
                }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-200 hover:bg-[#10263F] transition"
              >
                <Icon className="w-4 h-4 text-[#38BDF8]" />
                <span>{label}</span>
              </Link>
            ))}
            <Link
              to="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-200 hover:bg-[#10263F] transition"
            >
              <Squares2X2Icon className="w-4 h-4 text-[#38BDF8]" />
              <span>Inspector Workspace</span>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
