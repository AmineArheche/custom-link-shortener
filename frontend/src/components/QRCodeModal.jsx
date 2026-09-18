import React, { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { X, Download, Copy, Check, QrCode, Palette } from 'lucide-react';
import { copyTextToClipboard } from '../utils/helpers';

const QR_THEMES = [
  { id: 'dark', name: 'Midnight', fg: '#0f172a', bg: '#ffffff' },
  { id: 'indigo', name: 'Cyber Indigo', fg: '#4338ca', bg: '#ffffff' },
  { id: 'emerald', name: 'Emerald', fg: '#047857', bg: '#ffffff' },
  { id: 'amber', name: 'Sunset Amber', fg: '#b45309', bg: '#ffffff' },
  { id: 'rose', name: 'Rose Quartz', fg: '#be123c', bg: '#ffffff' },
];

export default function QRCodeModal({ link, onClose }) {
  const [copied, setCopied] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState(QR_THEMES[0]);

  if (!link) return null;

  const handleCopy = () => {
    copyTextToClipboard(link.short_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPNG = () => {
    const canvas = document.getElementById('qr-code-canvas');
    if (!canvas) return;
    const pngUrl = canvas.toDataURL('image/png');
    const downloadLink = document.createElement('a');
    downloadLink.href = pngUrl;
    downloadLink.download = `qr-${link.short_code}-${selectedTheme.id}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: 'rgba(99, 102, 241, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#818cf8'
            }}>
              <QrCode size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700 }}>QR Code Studio</h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>High-contrast QR code with custom styling</p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: 6 }}>
            <X size={18} />
          </button>
        </div>

        {/* QR Theme Selector */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontSize: 12, color: 'var(--text-muted)' }}>
            <Palette size={14} />
            <span>Select Color Palette</span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {QR_THEMES.map((theme) => (
              <button
                key={theme.id}
                type="button"
                onClick={() => setSelectedTheme(theme)}
                className="btn btn-sm"
                style={{
                  padding: '4px 10px',
                  fontSize: 12,
                  background: selectedTheme.id === theme.id ? 'var(--gradient-primary)' : 'rgba(255, 255, 255, 0.05)',
                  border: selectedTheme.id === theme.id ? '1px solid var(--accent-secondary)' : '1px solid var(--border-subtle)',
                  color: selectedTheme.id === theme.id ? '#fff' : 'var(--text-muted)',
                }}
              >
                <span style={{
                  display: 'inline-block',
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: theme.fg,
                  marginRight: 6,
                  border: '1px solid rgba(255,255,255,0.4)'
                }} />
                {theme.name}
              </button>
            ))}
          </div>
        </div>

        {/* QR Code Canvas */}
        <div style={{
          background: selectedTheme.bg,
          padding: 24,
          borderRadius: 16,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          margin: '0 auto 16px',
          width: 'fit-content',
          boxShadow: '0 12px 35px rgba(0, 0, 0, 0.5)'
        }}>
          <QRCodeCanvas
            id="qr-code-canvas"
            value={link.short_url}
            size={200}
            fgColor={selectedTheme.fg}
            bgColor={selectedTheme.bg}
            level="H"
            includeMargin={true}
          />
        </div>

        {/* Link Details Box */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '10px 14px',
          marginBottom: 18,
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Destination Target
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: 'var(--accent-secondary)', marginTop: 2 }}>
            {link.short_url}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleDownloadPNG} className="btn btn-primary" style={{ flex: 1 }}>
            <Download size={15} />
            <span>Download PNG</span>
          </button>
          <button onClick={handleCopy} className="btn btn-secondary" style={{ flex: 1 }}>
            {copied ? <Check size={15} color="#10b981" /> : <Copy size={15} />}
            <span>{copied ? 'Copied URL' : 'Copy URL'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
