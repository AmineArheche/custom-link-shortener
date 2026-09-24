import React from 'react';
import { Link2, BarChart3, Zap, RefreshCw, Sparkles, CheckSquare } from 'lucide-react';

function GithubIcon({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

export default function Navbar({ activeTab, setActiveTab, onRefresh, isRefreshing }) {
  return (
    <header style={{
      borderBottom: '1px solid var(--border-subtle)',
      background: 'rgba(6, 9, 19, 0.82)',
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
        flexWrap: 'wrap',
        gap: 16,
      }}>
        {/* Brand Logo & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: 'var(--gradient-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 25px rgba(99, 102, 241, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
          }}>
            <Link2 size={22} color="#fff" strokeWidth={2.5} />
          </div>
          <div>
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
              <span className="badge badge-indigo" style={{ fontSize: 11, padding: '2px 8px' }}>
                PRO
              </span>
            </div>
          </div>
        </div>

        {/* Center Segmented Tabs Navigation */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          background: 'rgba(255, 255, 255, 0.04)',
          padding: '4px',
          borderRadius: 14,
          border: '1px solid var(--border-subtle)',
          boxShadow: 'inset 0 1px 4px rgba(0, 0, 0, 0.3)',
          flexWrap: 'wrap',
        }}>
          <button
            onClick={() => setActiveTab('analytics')}
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
            <span>Analytics Hub</span>
          </button>

          <button
            onClick={() => setActiveTab('links')}
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
            <span>Manage Links</span>
          </button>

          <button
            onClick={() => setActiveTab('tasks')}
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

          <button
            onClick={() => setActiveTab('simulator')}
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
        </nav>

        {/* Right Status Indicator & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Live Ping Pulse */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 14px',
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
            <span>Telemetry Live</span>
          </div>

          {/* Quick Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="btn btn-secondary btn-sm"
            title="Refresh analytics data"
            style={{ padding: '8px 12px' }}
          >
            <RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} />
          </button>

          {/* GitHub Repo link */}
          <a
            href="https://github.com/AmineArheche/custom-link-shortener"
            target="_blank"
            rel="noreferrer"
            className="btn btn-ghost btn-sm"
            style={{ padding: '8px 10px', color: 'var(--text-muted)' }}
            title="GitHub Repository"
          >
            <GithubIcon size={17} />
          </a>
        </div>
      </div>
    </header>
  );
}
