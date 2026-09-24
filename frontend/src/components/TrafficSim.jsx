import React, { useState } from 'react';
import { Zap, Play, CheckCircle2, RefreshCw, Flame, Sparkles } from 'lucide-react';
import { simulateTraffic } from '../services/api';

export default function TrafficSim({ links = [], onTrafficSimulated }) {
  const [selectedLink, setSelectedLink] = useState(links[0]?.short_code || '');
  const [clickCount, setClickCount] = useState(15);
  const [browser, setBrowser] = useState('');
  const [os, setOs] = useState('');
  const [referrer, setReferrer] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [resultMessage, setResultMessage] = useState(null);

  const handleSimulate = async (e) => {
    e.preventDefault();
    setIsSimulating(true);
    setResultMessage(null);

    try {
      const payload = {
        short_code: selectedLink || undefined,
        count: parseInt(clickCount, 10),
        browser: browser || undefined,
        os: os || undefined,
        referrer: referrer || undefined,
      };

      const res = await simulateTraffic(payload);
      setResultMessage(res.message);
      if (onTrafficSimulated) {
        onTrafficSimulated();
      }
    } catch (err) {
      alert(err.message || 'Simulation failed');
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="glass-panel" style={{
      padding: '30px 34px',
      position: 'relative',
      overflow: 'hidden',
      border: '1px solid rgba(245, 158, 11, 0.25)',
      boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.6), 0 0 20px rgba(245, 158, 11, 0.08)',
    }}>
      {/* Top amber accent line */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        background: 'linear-gradient(90deg, #f59e0b, #ef4444, #ec4899)',
      }} />

      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: 'rgba(245, 158, 11, 0.18)',
            color: '#fbbf24',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(245, 158, 11, 0.35)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
          }}>
            <Zap size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>
              Real-Time Traffic Simulator
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>
              Generate synthetic clicks from diverse browsers, operating systems, and referrers to test live analytics dashboard telemetry.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSimulate}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}>
          {/* Target Link */}
          <div>
            <label className="form-label">Target Link</label>
            <select
              className="form-input"
              value={selectedLink}
              onChange={(e) => setSelectedLink(e.target.value)}
              required
            >
              <option value="">-- Select Short Link --</option>
              {links.map((l) => (
                <option key={l.id} value={l.short_code}>
                  /{l.short_code} ({l.title || l.original_url.substring(0, 30)})
                </option>
              ))}
            </select>
          </div>

          {/* Click Volume */}
          <div>
            <label className="form-label">Simulate Click Volume</label>
            <select
              className="form-input"
              value={clickCount}
              onChange={(e) => setClickCount(e.target.value)}
            >
              <option value="1">1 Click (Instant)</option>
              <option value="5">5 Clicks</option>
              <option value="15">15 Clicks (Recommended)</option>
              <option value="30">30 Clicks</option>
              <option value="60">60 Clicks (Heavy Traffic Burst)</option>
            </select>
          </div>

          {/* Browser Preset */}
          <div>
            <label className="form-label">Browser Profile</label>
            <select
              className="form-input"
              value={browser}
              onChange={(e) => setBrowser(e.target.value)}
            >
              <option value="">Random Real-World Mix</option>
              <option value="Chrome">Google Chrome</option>
              <option value="Safari">Apple Safari</option>
              <option value="Firefox">Mozilla Firefox</option>
              <option value="Edge">Microsoft Edge</option>
              <option value="Opera">Opera</option>
            </select>
          </div>

          {/* Operating System */}
          <div>
            <label className="form-label">Operating System</label>
            <select
              className="form-input"
              value={os}
              onChange={(e) => setOs(e.target.value)}
            >
              <option value="">Random Real-World Mix</option>
              <option value="Windows">Windows 11 / 10</option>
              <option value="macOS">macOS Sonoma</option>
              <option value="iOS">iOS (iPhone)</option>
              <option value="Android">Android</option>
              <option value="Linux">Linux Ubuntu</option>
            </select>
          </div>

          {/* Referrer Source */}
          <div style={{ gridColumn: 'span 2 / span 2' }}>
            <label className="form-label">Referrer Channel</label>
            <select
              className="form-input"
              value={referrer}
              onChange={(e) => setReferrer(e.target.value)}
            >
              <option value="">Random (Twitter, GitHub, HackerNews, Reddit, Direct)</option>
              <option value="https://twitter.com/post">Twitter / X (twitter.com)</option>
              <option value="https://news.ycombinator.com">Hacker News (news.ycombinator.com)</option>
              <option value="https://github.com/project">GitHub (github.com)</option>
              <option value="https://reddit.com/r/programming">Reddit (reddit.com)</option>
              <option value="https://linkedin.com/feed">LinkedIn (linkedin.com)</option>
              <option value="Direct">Direct / None</option>
            </select>
          </div>
        </div>

        {/* Action Button & Status */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <button
            type="submit"
            disabled={isSimulating || links.length === 0}
            className="btn btn-primary"
            style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
              boxShadow: '0 4px 18px rgba(245, 158, 11, 0.45)',
              borderColor: 'rgba(255, 255, 255, 0.2)',
              padding: '12px 28px',
            }}
          >
            {isSimulating ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>Simulating Traffic Velocity...</span>
              </>
            ) : (
              <>
                <Play size={16} fill="#fff" />
                <span>Fire {clickCount} Simulated Clicks</span>
              </>
            )}
          </button>

          {resultMessage && (
            <div className="animate-fade-in" style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: '#10b981',
              fontSize: 14,
              fontWeight: 600,
              background: 'rgba(16, 185, 129, 0.1)',
              padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
            }}>
              <CheckCircle2 size={18} />
              <span>{resultMessage}</span>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
