import React from 'react';
import { Link2, Shield, Terminal, Heart, Sparkles } from 'lucide-react';

function GithubIcon({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer style={{
      marginTop: 'auto',
      borderTop: '1px solid var(--border-subtle)',
      background: 'rgba(6, 9, 19, 0.95)',
      backdropFilter: 'blur(20px)',
      padding: '40px 24px 32px',
      color: 'var(--text-muted)',
    }}>
      <div style={{
        maxWidth: 1280,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 28,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 20,
        }}>
          {/* Brand Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: 'var(--gradient-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(99, 102, 241, 0.45)',
            }}>
              <Link2 size={18} color="#fff" strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 18,
                  fontWeight: 800,
                  color: '#fff',
                  letterSpacing: '-0.02em',
                }}>
                  AuraLink
                </span>
                <span className="badge badge-indigo" style={{ fontSize: 11, padding: '2px 8px' }}>
                  Enterprise Ready
                </span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 2 }}>
                High-performance URL shortening & real-time telemetry analytics platform
              </p>
            </div>
          </div>

          {/* Links & Quick Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <a
              href="https://github.com/AmineArheche/custom-link-shortener"
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary btn-sm"
              style={{ gap: 6 }}
            >
              <GithubIcon size={15} />
              <span>GitHub Repository</span>
            </a>

            <a
              href="/docs"
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary btn-sm"
              style={{ gap: 6 }}
            >
              <Terminal size={15} />
              <span>Interactive API Docs</span>
            </a>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--border-subtle)', width: '100%' }} />

        {/* Bottom bar with stack pills & copyright */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          fontSize: 13,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-dim)' }}>
            <span>Built with</span>
            <Heart size={14} color="#f43f5e" fill="#f43f5e" />
            <span>using FastAPI, React, Chart.js & SQLite</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#34d399', fontSize: 12 }}>
              <Shield size={14} />
              <span>OWASP Hardened & Rate-Limited</span>
            </div>
            <span style={{ color: 'var(--text-dim)' }}>•</span>
            <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>
              © {new Date().getFullYear()} AuraLink • Open Source MIT License
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
