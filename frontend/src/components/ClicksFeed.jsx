import React from 'react';
import { Activity, Monitor, Smartphone, Tablet, Bot, Globe } from 'lucide-react';
import { timeAgo } from '../utils/helpers';

export default function ClicksFeed({ recentClicks = [] }) {
  const getDeviceIcon = (deviceType) => {
    switch (deviceType) {
      case 'Mobile':
        return <Smartphone size={14} color="#10b981" />;
      case 'Tablet':
        return <Tablet size={14} color="#f59e0b" />;
      case 'Bot':
        return <Bot size={14} color="#f43f5e" />;
      default:
        return <Monitor size={14} color="#6366f1" />;
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '24px 28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h4 style={{ fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={18} color="#10b981" />
            <span>Recent Visitors Stream</span>
          </h4>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Live click-by-click telemetry</p>
        </div>
        <span className="badge badge-emerald">Real-time</span>
      </div>

      {recentClicks.length === 0 ? (
        <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--text-dim)' }}>
          No incoming clicks recorded yet
        </div>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          maxHeight: 320,
          overflowY: 'auto',
          paddingRight: 4
        }}>
          {recentClicks.map((click) => (
            <div
              key={click.id}
              style={{
                padding: '10px 14px',
                background: 'rgba(13, 18, 36, 0.6)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                fontSize: 13,
              }}
            >
              {/* Left: Device & Browser */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  background: 'rgba(255, 255, 255, 0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {getDeviceIcon(click.device_type)}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>{click.browser} {click.browser_version}</span>
                    <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>({click.os})</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Globe size={11} />
                    <span>{click.city ? `${click.city}, ` : ''}{click.country || 'Global'}</span>
                    <span>•</span>
                    <span>via {click.referrer_domain || 'Direct'}</span>
                  </div>
                </div>
              </div>

              {/* Right: Timestamp */}
              <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)' }}>
                {timeAgo(click.timestamp)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
