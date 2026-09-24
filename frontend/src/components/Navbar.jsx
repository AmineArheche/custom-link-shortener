import React, { useState, useEffect, useRef } from 'react';
import { 
  Link2, BarChart3, Zap, RefreshCw, CheckSquare, 
  Menu, X, ChevronDown, ExternalLink, Terminal, 
  Layers, Megaphone, QrCode, Download, Plus, Sparkles
} from 'lucide-react';

function GithubIcon({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

export default function Navbar({ activeTab, setActiveTab, onRefresh, isRefreshing }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toolsDropdownOpen, setToolsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setToolsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFocusShortener = () => {
    setMobileMenuOpen(false);
    setToolsDropdownOpen(false);
    const input = document.querySelector('input[placeholder*="destination URL"]');
    if (input) {
      input.focus();
      input.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <header style={{
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      background: 'rgba(6, 9, 19, 0.88)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      padding: '12px 24px',
      boxShadow: '0 4px 30px rgba(0, 0, 0, 0.4)',
    }}>
      <div style={{
        maxWidth: 1280,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
      }}>
        {/* Brand Logo & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="button"
            onClick={() => handleTabClick('analytics')}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: 'var(--gradient-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 25px rgba(99, 102, 241, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              transition: 'transform 0.2s ease',
            }}
            onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
            onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <Link2 size={22} color="#fff" strokeWidth={2.5} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 22,
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  background: 'linear-gradient(135deg, #ffffff 30%, #c7d2fe 70%, #38bdf8 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  AuraLink
                </span>
                <span className="badge badge-indigo" style={{ fontSize: 10, padding: '2px 8px' }}>
                  PRO
                </span>
              </div>
            </div>
          </button>
        </div>

        {/* Center Desktop Navigation Menu */}
        <nav className="desktop-menu" style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          background: 'rgba(255, 255, 255, 0.04)',
          padding: '4px',
          borderRadius: 14,
          border: '1px solid var(--border-subtle)',
          boxShadow: 'inset 0 1px 4px rgba(0, 0, 0, 0.3)',
        }}>
          {/* Tab 1: Analytics Hub */}
          <button
            onClick={() => handleTabClick('analytics')}
            className="btn btn-sm"
            style={{
              background: activeTab === 'analytics' ? 'var(--gradient-primary)' : 'transparent',
              color: activeTab === 'analytics' ? '#fff' : 'var(--text-muted)',
              borderRadius: 10,
              border: activeTab === 'analytics' ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid transparent',
              boxShadow: activeTab === 'analytics' ? '0 4px 15px rgba(99, 102, 241, 0.4)' : 'none',
              padding: '7px 14px',
              fontWeight: 600,
            }}
          >
            <BarChart3 size={15} />
            <span>Analytics</span>
          </button>

          {/* Tab 2: Manage Links */}
          <button
            onClick={() => handleTabClick('links')}
            className="btn btn-sm"
            style={{
              background: activeTab === 'links' ? 'var(--gradient-primary)' : 'transparent',
              color: activeTab === 'links' ? '#fff' : 'var(--text-muted)',
              borderRadius: 10,
              border: activeTab === 'links' ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid transparent',
              boxShadow: activeTab === 'links' ? '0 4px 15px rgba(99, 102, 241, 0.4)' : 'none',
              padding: '7px 14px',
              fontWeight: 600,
            }}
          >
            <Link2 size={15} />
            <span>Links</span>
          </button>

          {/* Tab 3: Tasks & Contributions */}
          <button
            onClick={() => handleTabClick('tasks')}
            className="btn btn-sm"
            style={{
              background: activeTab === 'tasks' ? 'var(--gradient-emerald)' : 'transparent',
              color: activeTab === 'tasks' ? '#fff' : 'var(--text-muted)',
              borderRadius: 10,
              border: activeTab === 'tasks' ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid transparent',
              boxShadow: activeTab === 'tasks' ? '0 4px 15px rgba(16, 185, 129, 0.4)' : 'none',
              padding: '7px 14px',
              fontWeight: 600,
            }}
          >
            <CheckSquare size={15} color={activeTab === 'tasks' ? '#fff' : '#10b981'} />
            <span>Tasks & GitHub</span>
          </button>

          {/* Tab 4: Traffic Simulator */}
          <button
            onClick={() => handleTabClick('simulator')}
            className="btn btn-sm"
            style={{
              background: activeTab === 'simulator' ? 'var(--gradient-amber)' : 'transparent',
              color: activeTab === 'simulator' ? '#fff' : 'var(--text-muted)',
              borderRadius: 10,
              border: activeTab === 'simulator' ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid transparent',
              boxShadow: activeTab === 'simulator' ? '0 4px 15px rgba(245, 158, 11, 0.4)' : 'none',
              padding: '7px 14px',
              fontWeight: 600,
            }}
          >
            <Zap size={15} />
            <span>Traffic Sim</span>
          </button>

          {/* Dropdown Menu: Quick Tools */}
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setToolsDropdownOpen(!toolsDropdownOpen)}
              className="btn btn-ghost btn-sm"
              style={{
                padding: '7px 12px',
                fontSize: 13,
                gap: 4,
                color: toolsDropdownOpen ? '#fff' : 'var(--text-muted)',
                background: toolsDropdownOpen ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                borderRadius: 10,
              }}
            >
              <span>Quick Tools</span>
              <ChevronDown size={14} style={{ transform: toolsDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
            </button>

            {/* Dropdown Panel */}
            {toolsDropdownOpen && (
              <div className="animate-fade-in" style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: 240,
                background: 'rgba(11, 17, 32, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-md)',
                padding: 8,
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.7), 0 0 25px rgba(99, 102, 241, 0.2)',
                zIndex: 110,
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}>
                <button
                  type="button"
                  onClick={handleFocusShortener}
                  className="btn btn-ghost btn-sm"
                  style={{ justifyContent: 'flex-start', padding: '8px 12px', fontSize: 13, color: '#fff' }}
                >
                  <Plus size={15} color="var(--accent-primary)" />
                  <span>Shorten New Link</span>
                </button>

                <a
                  href="/docs"
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-ghost btn-sm"
                  style={{ justifyContent: 'flex-start', padding: '8px 12px', fontSize: 13, color: 'var(--text-main)' }}
                >
                  <Terminal size={15} color="var(--accent-cyan)" />
                  <span>Swagger API Docs</span>
                </a>

                <a
                  href="/api/analytics/export/csv"
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-ghost btn-sm"
                  style={{ justifyContent: 'flex-start', padding: '8px 12px', fontSize: 13, color: 'var(--text-main)' }}
                >
                  <Download size={15} color="var(--accent-emerald)" />
                  <span>Export Telemetry CSV</span>
                </a>

                <div style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 0' }} />

                <a
                  href="https://github.com/AmineArheche/custom-link-shortener"
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-ghost btn-sm"
                  style={{ justifyContent: 'flex-start', padding: '8px 12px', fontSize: 13, color: 'var(--text-muted)' }}
                >
                  <GithubIcon size={15} />
                  <span>GitHub Repository</span>
                  <ExternalLink size={11} style={{ marginLeft: 'auto', opacity: 0.6 }} />
                </a>
              </div>
            )}
          </div>
        </nav>

        {/* Right Section: Status Indicator, Action Button & Hamburger Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Quick Shorten CTA Button */}
          <button
            type="button"
            onClick={handleFocusShortener}
            className="btn btn-primary btn-sm cta-button"
            style={{
              padding: '7px 16px',
              fontSize: 13,
              gap: 6,
            }}
          >
            <Plus size={15} />
            <span>Create Link</span>
          </button>

          {/* Live Ping Pulse */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 12px',
            borderRadius: 20,
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            fontSize: 12,
            fontWeight: 600,
            color: '#6ee7b7',
          }}>
            <div className="pulse-container">
              <div className="pulse-ring" />
              <div className="pulse-dot" />
            </div>
            <span className="live-status-text">Live</span>
          </div>

          {/* Quick Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="btn btn-secondary btn-sm"
            title="Refresh analytics data"
            style={{ padding: '8px 10px' }}
          >
            <RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} />
          </button>

          {/* Mobile Hamburger Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="btn btn-secondary btn-sm mobile-menu-toggle"
            aria-label="Toggle Navigation Menu"
            style={{ padding: '8px 10px' }}
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Drawer Menu */}
      {mobileMenuOpen && (
        <div className="animate-fade-in" style={{
          marginTop: 12,
          padding: '16px 20px',
          background: 'rgba(11, 17, 32, 0.98)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-medium)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.8)',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}>
          <button
            onClick={() => handleTabClick('analytics')}
            className="btn btn-sm"
            style={{
              justifyContent: 'flex-start',
              background: activeTab === 'analytics' ? 'var(--gradient-primary)' : 'transparent',
              color: activeTab === 'analytics' ? '#fff' : 'var(--text-muted)',
              padding: '10px 14px',
            }}
          >
            <BarChart3 size={16} />
            <span>Analytics Hub</span>
          </button>

          <button
            onClick={() => handleTabClick('links')}
            className="btn btn-sm"
            style={{
              justifyContent: 'flex-start',
              background: activeTab === 'links' ? 'var(--gradient-primary)' : 'transparent',
              color: activeTab === 'links' ? '#fff' : 'var(--text-muted)',
              padding: '10px 14px',
            }}
          >
            <Link2 size={16} />
            <span>Manage Links</span>
          </button>

          <button
            onClick={() => handleTabClick('tasks')}
            className="btn btn-sm"
            style={{
              justifyContent: 'flex-start',
              background: activeTab === 'tasks' ? 'var(--gradient-emerald)' : 'transparent',
              color: activeTab === 'tasks' ? '#fff' : 'var(--text-muted)',
              padding: '10px 14px',
            }}
          >
            <CheckSquare size={16} color={activeTab === 'tasks' ? '#fff' : '#10b981'} />
            <span>Tasks & GitHub Contributions</span>
          </button>

          <button
            onClick={() => handleTabClick('simulator')}
            className="btn btn-sm"
            style={{
              justifyContent: 'flex-start',
              background: activeTab === 'simulator' ? 'var(--gradient-amber)' : 'transparent',
              color: activeTab === 'simulator' ? '#fff' : 'var(--text-muted)',
              padding: '10px 14px',
            }}
          >
            <Zap size={16} />
            <span>Traffic Simulator</span>
          </button>

          <div style={{ height: 1, background: 'var(--border-subtle)', margin: '6px 0' }} />

          <a
            href="/docs"
            target="_blank"
            rel="noreferrer"
            className="btn btn-ghost btn-sm"
            style={{ justifyContent: 'flex-start', padding: '10px 14px', color: 'var(--text-main)' }}
          >
            <Terminal size={16} color="var(--accent-cyan)" />
            <span>API Docs (Swagger)</span>
            <ExternalLink size={12} style={{ marginLeft: 'auto', opacity: 0.6 }} />
          </a>

          <a
            href="https://github.com/AmineArheche/custom-link-shortener"
            target="_blank"
            rel="noreferrer"
            className="btn btn-ghost btn-sm"
            style={{ justifyContent: 'flex-start', padding: '10px 14px', color: 'var(--text-muted)' }}
          >
            <GithubIcon size={16} />
            <span>GitHub Repository</span>
            <ExternalLink size={12} style={{ marginLeft: 'auto', opacity: 0.6 }} />
          </a>
        </div>
      )}

      {/* Media Queries for responsive toggle */}
      <style>{`
        @media (max-width: 860px) {
          .desktop-menu {
            display: none !important;
          }
          .mobile-menu-toggle {
            display: inline-flex !important;
          }
          .cta-button {
            display: none !important;
          }
        }
        @media (min-width: 861px) {
          .mobile-menu-toggle {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
}
