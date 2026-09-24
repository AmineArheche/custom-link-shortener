import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import LinkCreator from './components/LinkCreator';
import LinkList from './components/LinkList';
import AnalyticsView from './components/AnalyticsView';
import TrafficSim from './components/TrafficSim';
import QRCodeModal from './components/QRCodeModal';
import GitHubTaskHub from './components/GitHubTaskHub';
import Footer from './components/Footer';
import { fetchOverview, fetchLinks, fetchLinkAnalytics } from './services/api';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics' | 'links' | 'tasks' | 'simulator'
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
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
      {/* Top Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onRefresh={() => loadData(true)}
        isRefreshing={isRefreshing}
      />

      {/* Main Content Area */}
      <main style={{
        maxWidth: 1280,
        width: '100%',
        margin: '0 auto',
        padding: '36px 24px 64px',
        display: 'flex',
        flexDirection: 'column',
        gap: 32,
        flex: 1,
      }}>
        {/* Backend Connectivity Alert */}
        {errorMessage && (
          <div className="animate-fade-in" style={{
            background: 'rgba(244, 63, 94, 0.12)',
            border: '1px solid rgba(244, 63, 94, 0.35)',
            color: '#fb7185',
            padding: '14px 20px',
            borderRadius: 'var(--radius-md)',
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            boxShadow: '0 8px 24px rgba(244, 63, 94, 0.15)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertCircle size={20} />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => loadData(true)}
              className="btn btn-secondary btn-sm"
              style={{ color: '#fff', borderColor: 'rgba(244, 63, 94, 0.4)' }}
            >
              <RefreshCw size={14} />
              <span>Retry Connection</span>
            </button>
          </div>
        )}

        {/* Global Link Creation Section */}
        <LinkCreator
          onLinkCreated={() => loadData(true)}
          onOpenQR={(link) => setSelectedQRLink(link)}
        />

        {/* Dynamic Tab Views */}
        {activeTab === 'analytics' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <AnalyticsView
              analyticsData={selectedLinkCode ? singleLinkAnalytics : overviewData}
              selectedLinkCode={selectedLinkCode}
              onClearSelectedLink={handleClearSelectedLink}
              allLinks={links}
            />
            {/* Quick Contributor Task Section in Analytics Hub */}
            <GitHubTaskHub />
          </div>
        )}

        {activeTab === 'links' && (
          <div className="animate-fade-in">
            <LinkList
              links={links}
              onRefresh={() => loadData(true)}
              onSelectAnalytics={handleSelectAnalytics}
              onOpenQR={(link) => setSelectedQRLink(link)}
            />
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="animate-fade-in">
            <GitHubTaskHub />
          </div>
        )}

        {activeTab === 'simulator' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
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

      {/* Modern Footer */}
      <Footer onSelectTab={(tab) => {
        setActiveTab(tab);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }} />
    </div>
  );
}
