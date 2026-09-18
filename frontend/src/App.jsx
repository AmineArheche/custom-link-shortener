import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import LinkCreator from './components/LinkCreator';
import LinkList from './components/LinkList';
import AnalyticsView from './components/AnalyticsView';
import TrafficSim from './components/TrafficSim';
import QRCodeModal from './components/QRCodeModal';
import { fetchOverview, fetchLinks, fetchLinkAnalytics } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics' | 'links' | 'simulator'
  const [overviewData, setOverviewData] = useState(null);
  const [links, setLinks] = useState([]);
  const [selectedLinkCode, setSelectedLinkCode] = useState(null);
  const [singleLinkAnalytics, setSingleLinkAnalytics] = useState(null);
  const [selectedQRLink, setSelectedQRLink] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Load core data from FastAPI backend
  const loadData = useCallback(async (showIndicator = false) => {
    if (showIndicator) setIsRefreshing(true);
    try {
      const [overviewRes, linksRes] = await Promise.all([
        fetchOverview(),
        fetchLinks({ limit: 100 })
      ]);
      setOverviewData(overviewRes);
      setLinks(linksRes.items || []);
      setErrorMessage(null);

      // If viewing a specific link, refresh its detailed analytics too
      if (selectedLinkCode) {
        const linkData = await fetchLinkAnalytics(selectedLinkCode);
        setSingleLinkAnalytics(linkData);
      }
    } catch (err) {
      console.error('Data loading error:', err);
      setErrorMessage('Could not connect to backend server on http://localhost:8000. Ensure FastAPI is running.');
    } finally {
      if (showIndicator) setIsRefreshing(false);
    }
  }, [selectedLinkCode]);

  useEffect(() => {
    let isMounted = true;
    const execute = async () => {
      if (isMounted) await loadData(false);
    };
    execute();

    // Auto-refresh analytics every 10 seconds
    const interval = setInterval(() => {
      if (isMounted) loadData(false);
    }, 10000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [loadData]);

  // Handle drill down to specific link analytics
  const handleSelectAnalytics = async (shortCode) => {
    setSelectedLinkCode(shortCode);
    setActiveTab('analytics');
    setIsRefreshing(true);
    try {
      const data = await fetchLinkAnalytics(shortCode);
      setSingleLinkAnalytics(data);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleClearSelectedLink = () => {
    setSelectedLinkCode(null);
    setSingleLinkAnalytics(null);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isLive={true}
        onRefresh={() => loadData(true)}
        isRefreshing={isRefreshing}
      />

      {/* Main Content Area */}
      <main style={{
        maxWidth: 1280,
        width: '100%',
        margin: '0 auto',
        padding: '32px 24px 64px',
        display: 'flex',
        flexDirection: 'column',
        gap: 32,
      }}>
        {/* Backend Connectivity Alert */}
        {errorMessage && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.4)',
            color: '#fb7185',
            padding: '14px 20px',
            borderRadius: 'var(--radius-md)',
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span>⚠️ {errorMessage}</span>
            <button
              onClick={() => loadData(true)}
              className="btn btn-secondary btn-sm"
              style={{ color: '#fff' }}
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Global Link Creation Section */}
        <LinkCreator
          onLinkCreated={() => loadData(true)}
          onOpenQR={(link) => setSelectedQRLink(link)}
          onSelectLinkAnalytics={handleSelectAnalytics}
        />

        {/* Dynamic Tab Views */}
        {activeTab === 'analytics' && (
          <AnalyticsView
            analyticsData={selectedLinkCode ? singleLinkAnalytics : overviewData}
            selectedLinkCode={selectedLinkCode}
            onClearSelectedLink={handleClearSelectedLink}
            allLinks={links}
          />
        )}

        {activeTab === 'links' && (
          <LinkList
            links={links}
            onRefresh={() => loadData(true)}
            onSelectAnalytics={handleSelectAnalytics}
            onOpenQR={(link) => setSelectedQRLink(link)}
          />
        )}

        {activeTab === 'simulator' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <TrafficSim
              links={links}
              onTrafficSimulated={() => loadData(true)}
            />
            {/* Show updated analytics immediately below the simulator */}
            <AnalyticsView
              analyticsData={overviewData}
              selectedLinkCode={null}
              onClearSelectedLink={handleClearSelectedLink}
              allLinks={links}
            />
          </div>
        )}
      </main>

      {/* QR Code Popup Modal */}
      {selectedQRLink && (
        <QRCodeModal
          link={selectedQRLink}
          onClose={() => setSelectedQRLink(null)}
        />
      )}
    </div>
  );
}
