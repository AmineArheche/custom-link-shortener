import React from 'react';
import { 
  Link2, BarChart3, Zap, QrCode, Terminal, ShieldCheck, 
  Layers, Activity, Heart, ExternalLink, Globe, Cpu, Sparkles, BookOpen
} from 'lucide-react';

function GithubIcon({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

export default function Footer({ onSelectTab }) {
  return (
    <footer style={{
      marginTop: 'auto',
      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
      background: 'linear-gradient(180deg, rgba(6, 9, 19, 0.85) 0%, #04060d 100%)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      padding: '56px 24px 36px',
      color: 'var(--text-muted)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Ambient background glow orb */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '60%',
        height: '1px',
        background: 'linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.6), rgba(6, 182, 212, 0.6), transparent)',
        boxShadow: '0 0 25px rgba(99, 102, 241, 0.5)',
      }} />

      <div style={{
        maxWidth: 1280,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 44,
      }}>
        {/* Top Multi-Column Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 36,
        }}>
          {/* Column 1: Brand & Bio */}
          <div style={{ gridColumn: 'span 2 / span 2', minWidth: 260 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'var(--gradient-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 22px rgba(99, 102, 241, 0.45)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}>
                <Link2 size={20} color="#fff" strokeWidth={2.5} />
              </div>
              <div>
                <span style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 22,
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  background: 'linear-gradient(135deg, #ffffff 40%, #c7d2fe 80%, #38bdf8 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  AuraLink
                </span>
                <span className="badge badge-indigo" style={{ fontSize: 11, marginLeft: 8, padding: '2px 8px' }}>
                  v1.2 PRO
                </span>
              </div>
            </div>

            <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-muted)', maxWidth: 420 }}>
              Next-generation URL shortening platform engineered for speed, custom branding, deep telemetry analytics, and developer workflow automation.
            </p>

            {/* Live Operational Status Capsule */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
              borderRadius: 20,
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              fontSize: 12,
              fontWeight: 600,
              color: '#6ee7b7',
              marginTop: 18,
            }}>
              <div className="pulse-container">
                <div className="pulse-ring" />
                <div className="pulse-dot" />
              </div>
              <span>All Systems Operational • 99.99% Uptime</span>
            </div>
          </div>

          {/* Column 2: Platform Features */}
          <div>
            <h4 style={{
              fontSize: 14,
              fontWeight: 700,
              color: '#fff',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <Sparkles size={15} color="var(--accent-secondary)" />
              <span>Features</span>
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectTab && onSelectTab('analytics')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontFamily: 'inherit',
                    fontSize: 'inherit',
                    transition: 'color 0.2s ease',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.color = '#fff')}
                  onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                >
                  <BarChart3 size={14} color="var(--accent-secondary)" />
                  <span>Real-Time Analytics Hub</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectTab && onSelectTab('links')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontFamily: 'inherit',
                    fontSize: 'inherit',
                    transition: 'color 0.2s ease',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.color = '#fff')}
                  onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                >
                  <Link2 size={14} color="var(--accent-cyan)" />
                  <span>Custom Alias & Tag Routing</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectTab && onSelectTab('simulator')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontFamily: 'inherit',
                    fontSize: 'inherit',
                    transition: 'color 0.2s ease',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.color = '#fff')}
                  onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                >
                  <Zap size={14} color="var(--accent-amber)" />
                  <span>Traffic Simulation Engine</span>
                </button>
              </li>
              <li>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
                  <Layers size={14} color="var(--accent-emerald)" />
                  <span>Batch Bulk Shortener</span>
                </span>
              </li>
              <li>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
                  <QrCode size={14} color="var(--accent-pink)" />
                  <span>Multi-Theme QR Studio</span>
                </span>
              </li>
            </ul>
          </div>

          {/* Column 3: Developer & API */}
          <div>
            <h4 style={{
              fontSize: 14,
              fontWeight: 700,
              color: '#fff',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <Terminal size={15} color="var(--accent-cyan)" />
              <span>Developers</span>
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
              <li>
                <a
                  href="/docs"
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}
                  onMouseOver={(e) => (e.currentTarget.style.color = '#fff')}
                  onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                >
                  <Terminal size={14} />
                  <span>Swagger API Explorer</span>
                  <ExternalLink size={11} style={{ opacity: 0.6 }} />
                </a>
              </li>
              <li>
                <a
                  href="/redoc"
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}
                  onMouseOver={(e) => (e.currentTarget.style.color = '#fff')}
                  onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                >
                  <BookOpen size={14} />
                  <span>ReDoc OpenAPI Specs</span>
                  <ExternalLink size={11} style={{ opacity: 0.6 }} />
                </a>
              </li>
              <li>
                <a
                  href="/api/analytics/export/csv"
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}
                  onMouseOver={(e) => (e.currentTarget.style.color = '#fff')}
                  onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                >
                  <Activity size={14} />
                  <span>Visitor Telemetry CSV API</span>
                  <ExternalLink size={11} style={{ opacity: 0.6 }} />
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/AmineArheche/custom-link-shortener"
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}
                  onMouseOver={(e) => (e.currentTarget.style.color = '#fff')}
                  onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                >
                  <GithubIcon size={14} />
                  <span>Source Code Repository</span>
                  <ExternalLink size={11} style={{ opacity: 0.6 }} />
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Technology & Trust */}
          <div>
            <h4 style={{
              fontSize: 14,
              fontWeight: 700,
              color: '#fff',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <Cpu size={15} color="var(--accent-emerald)" />
              <span>Core Stack</span>
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
              <span className="badge badge-indigo" style={{ fontSize: 11 }}>FastAPI</span>
              <span className="badge badge-cyan" style={{ fontSize: 11 }}>React 19</span>
              <span className="badge badge-purple" style={{ fontSize: 11 }}>Vite</span>
              <span className="badge badge-emerald" style={{ fontSize: 11 }}>SQLite / PostgreSQL</span>
              <span className="badge badge-amber" style={{ fontSize: 11 }}>Chart.js</span>
              <span className="badge badge-rose" style={{ fontSize: 11 }}>Docker</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#34d399', fontSize: 12 }}>
              <ShieldCheck size={16} />
              <span>OWASP Top 10 Hardened</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(255, 255, 255, 0.07)', width: '100%' }} />

        {/* Bottom Bar: Copyright & Author Signature */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          fontSize: 13,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-dim)' }}>
            <span>Engineered with</span>
            <Heart size={14} color="#f43f5e" fill="#f43f5e" />
            <span>by</span>
            <strong style={{ color: '#fff' }}>Amine Arheche</strong>
            <span>• Open Source MIT License</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, color: 'var(--text-dim)', fontSize: 12 }}>
            <span>© {new Date().getFullYear()} AuraLink</span>
            <span>•</span>
            <span>Zero-Tracking Privacy Default</span>
            <span>•</span>
            <span>Ultra Low-Latency</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
