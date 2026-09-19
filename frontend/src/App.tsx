import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { BottomNav } from './components/layout/BottomNav';
import { Footer } from './components/layout/Footer';
import SplashPage from './pages/SplashPage';
import DashboardPage from './pages/DashboardPage';
import HomePage from './pages/HomePage';
import HowItWorksPage from './pages/HowItWorksPage';
import TeamPage from './pages/TeamPage';
import ScanPage from './pages/ScanPage';
import ProcessingPage from './pages/ProcessingPage';
import StatusPage from './pages/StatusPage';
import ResultsPage from './pages/ResultsPage';
import HistoryPage from './pages/HistoryPage';
import AboutPage from './pages/AboutPage';

const HIDE_CHROME_PATHS = ['/splash'];

export default function App() {
  const location = useLocation();
  const hideChrome = HIDE_CHROME_PATHS.includes(location.pathname);

  return (
    <div className="flex flex-col min-h-screen bg-[#07111F] text-[#F8FAFC]">
      {!hideChrome && <Navbar />}
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/team" element={<TeamPage />} />
          <Route path="/inspector" element={<DashboardPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/scan" element={<ScanPage />} />
          <Route path="/processing" element={<ProcessingPage />} />
          <Route path="/status" element={<StatusPage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/results/:scanId" element={<ResultsPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/splash" element={<SplashPage />} />
          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      {!hideChrome && <Footer />}
      {!hideChrome && <BottomNav />}
    </div>
  );
}
