import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { BottomNav } from './components/layout/BottomNav';
import SplashPage from './pages/SplashPage';
import DashboardPage from './pages/DashboardPage';
import HomePage from './pages/HomePage';
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
    <div className="flex flex-col min-h-screen">
      {!hideChrome && <Navbar />}
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/splash" element={<SplashPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/home" element={<DashboardPage />} />
          <Route path="/scan" element={<ScanPage />} />
          <Route path="/processing" element={<ProcessingPage />} />
          <Route path="/status" element={<StatusPage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/results/:scanId" element={<ResultsPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/about" element={<AboutPage />} />
          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      {!hideChrome && <BottomNav />}
    </div>
  );
}
