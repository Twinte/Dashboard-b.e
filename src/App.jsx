import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import axios from 'axios';
import SponsorsScreen from './components/SponsorsScreen';
import DashboardPage from './components/DashboardPage';
import HistoricalPage from './components/HistoricalPage';
import ConfigPage from './components/ConfigPage';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';
import { ConfigProvider, useConfig } from './context/ConfigContext';
import { API_URL } from './utils/api';
import './App.css';

const AppContent = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedChart, setSelectedChart] = useState('all');
  const [showSponsors, setShowSponsors] = useState(() => !sessionStorage.getItem('splashScreenShown'));
  const { settings } = useConfig();

  const fetchData = useCallback(() => {
    axios.get(`${API_URL}/dados`)
      .then(res => {
        if (res.data && Array.isArray(res.data)) {
          setHistory(res.data.slice(-100));
          if (error) setError(null);
        }
      })
      .catch(() => { setError('Não foi possível ligar ao servidor.'); })
      .finally(() => { if (loading) setLoading(false); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (showSponsors) return;
    fetchData();
    const refreshMs = (settings.refreshRate || 5) * 1000;
    const intervalId = setInterval(fetchData, refreshMs);
    return () => clearInterval(intervalId);
  }, [showSponsors, fetchData, settings.refreshRate]);

  const latestData = history.length > 0 ? history[history.length - 1] : null;
  const handleSponsorsFinished = () => { sessionStorage.setItem('splashScreenShown', 'true'); setShowSponsors(false); };

  if (showSponsors) {
    return <SponsorsScreen onFinished={handleSponsorsFinished} />;
  }

  return (
    <div className="app-container">
      <Header />
      <Sidebar selectedChart={selectedChart} onSelectChart={setSelectedChart} />
      <main className="content">
        <div className="main-view-wrapper">
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<DashboardPage history={history} latestData={latestData} selectedChart={selectedChart} loading={loading && history.length === 0} error={error} />} />
              <Route path="/historico" element={<HistoricalPage />} />
              <Route path="/configuracao" element={<ConfigPage />} />
            </Routes>
          </ErrorBoundary>
        </div>
        <Footer />
      </main>
    </div>
  );
};

const App = () => (
  <BrowserRouter>
    <ConfigProvider>
      <AppContent />
    </ConfigProvider>
  </BrowserRouter>
);
export default App;
