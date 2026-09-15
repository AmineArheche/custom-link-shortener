import React from 'react';
import { Link2, BarChart3, PlusCircle, Zap, Activity, RefreshCw } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, isLive, onRefresh, isRefreshing }) {
  return (
    <header style={{
      borderBottom: '1px solid var(--border-subtle)',
      background: 'rgba(7, 9, 19, 0.85)',
      backdropFilter: 'blur(20px)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      padding: '14px 24px'
    }}>
      <div style={{
        maxWidth: 1280,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: 'var(--gradient-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)'
          }}>
            <Link2 size={22} color="#fff" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 20,
                fontWeight: 800,
                letterSpacing: '-0.02em',
                background: 'linear-gradient(to right, #ffffff, #a5b4fc)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                AuraLink
              </span>
              <span className="badge badge-indigo" style={{ fontSize: 11, padding: '2px 8px' }}>
                v1.0
              </span>
            </div>
          </div>
        </div>

        {/* Center Tabs Navigation */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'rgba(255, 255, 255, 0.04)',
          padding: 4,
          borderRadius: 12,
          border: '1px solid var(--border-subtle)'
        }}>
          <button
            onClick={() => setActiveTab('analytics')}
            className="btn btn-sm"
            style={{
              background: activeTab === 'analytics' ? 'var(--gradient-primary)' : 'transparent',
              color: activeTab === 'analytics' ? '#fff' : 'var(--text-muted)',
              borderRadius: 8,
              transition: 'all 0.2s ease',
              padding: '8px 16px',
            }}
          >
            <BarChart3 size={16} />
            <span>Analytics Hub</span>
          </button>

          <button
            onClick={() => setActiveTab('links')}
            className="btn btn-sm"
            style={{
              background: activeTab === 'links' ? 'var(--gradient-primary)' : 'transparent',
              color: activeTab === 'links' ? '#fff' : 'var(--text-muted)',
              borderRadius: 8,
              transition: 'all 0.2s ease',
              padding: '8px 16px',
            }}
          >
            <Link2 size={16} />
            <span>Manage Links</span>
          </button>

          <button
            onClick={() => setActiveTab('simulator')}
            className="btn btn-sm"
            style={{
              background: activeTab === 'simulator' ? 'var(--gradient-primary)' : 'transparent',
              color: activeTab === 'simulator' ? '#fff' : 'var(--text-muted)',
              borderRadius: 8,
              transition: 'all 0.2s ease',
              padding: '8px 16px',
            }}
          >
            <Zap size={16} />
            <span>Traffic Sim</span>
          </button>
        </nav>

        {/* Right Status Indicator & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 12px',
            borderRadius: 20,
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-subtle)',
            fontSize: 13,
            color: 'var(--text-muted)'
          }}>
            <div className="pulse-live" />
            <span>System Live</span>
          </div>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="btn btn-secondary btn-sm"
            title="Refresh analytics data"
            style={{ padding: '8px 12px' }}
          >
            <RefreshCw size={15} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>
      </div>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </header>
  );
}
