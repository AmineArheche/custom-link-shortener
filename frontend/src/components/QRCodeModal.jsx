import React, { useState, useRef, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { 
  X, Download, Copy, Check, QrCode, Palette, Sparkles, 
  ExternalLink, Layers, Sliders, Image, CheckCircle2, 
  ShieldCheck, Share2, Printer, Eye, Zap
} from 'lucide-react';
import { copyTextToClipboard } from '../utils/helpers';

const QR_THEMES = [
  { id: 'dark', name: 'Midnight', fg: '#0f172a', bg: '#ffffff' },
  { id: 'indigo', name: 'Cyber Violet', fg: '#4f46e5', bg: '#ffffff' },
  { id: 'cyan', name: 'Neon Cyan', fg: '#0284c7', bg: '#ffffff' },
  { id: 'emerald', name: 'Emerald Mint', fg: '#059669', bg: '#ffffff' },
  { id: 'amber', name: 'Sunset Amber', fg: '#d97706', bg: '#ffffff' },
  { id: 'rose', name: 'Berry Rose', fg: '#e11d48', bg: '#ffffff' },
  { id: 'dark_invert', name: 'Dark Luxe', fg: '#38bdf8', bg: '#0b1120' },
  { id: 'cyber_gold', name: 'Gold Matrix', fg: '#f59e0b', bg: '#060913' },
];

const SIZE_PRESETS = [
  { label: 'Standard', size: 180, exportScale: 2 },
  { label: 'High Res (HD)', size: 220, exportScale: 4 },
  { label: 'Ultra Print (4K)', size: 260, exportScale: 6 },
];

export default function QRCodeModal({ link, onClose }) {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState(QR_THEMES[0]);
  const [customFg, setCustomFg] = useState('#0f172a');
  const [customBg, setCustomBg] = useState('#ffffff');
  const [isCustomColor, setIsCustomColor] = useState(false);
  
  const [selectedSizePreset, setSelectedSizePreset] = useState(SIZE_PRESETS[1]);
  const [errorCorrection, setErrorCorrection] = useState('H'); // 'L' | 'M' | 'Q' | 'H'
  const [includeMargin, setIncludeMargin] = useState(true);
  const [activeTab, setActiveTab] = useState('themes'); // 'themes' | 'custom' | 'settings'

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!link) return null;

  const currentFg = isCustomColor ? customFg : selectedTheme.fg;
  const currentBg = isCustomColor ? customBg : selectedTheme.bg;

  const handleCopyUrl = () => {
    copyTextToClipboard(link.short_url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleDownloadPNG = (highRes = false) => {
    const canvas = document.getElementById('qr-code-canvas');
    if (!canvas) return;

    if (!highRes) {
      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `qr-${link.short_code}-${selectedTheme.id}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      return;
    }

    // High-Resolution Export using offscreen canvas scale
    const scale = selectedSizePreset.exportScale;
    const offscreen = document.createElement('canvas');
    offscreen.width = canvas.width * scale;
    offscreen.height = canvas.height * scale;
    const ctx = offscreen.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(canvas, 0, 0, offscreen.width, offscreen.height);

    const highResUrl = offscreen.toDataURL('image/png');
    const downloadLink = document.createElement('a');
    downloadLink.href = highResUrl;
    downloadLink.download = `qr-${link.short_code}-${selectedTheme.id}-${selectedSizePreset.label.toLowerCase().replace(/\s+/g, '_')}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const handleCopyImageToClipboard = async () => {
    const canvas = document.getElementById('qr-code-canvas');
    if (!canvas) return;

    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        if (navigator.clipboard && window.ClipboardItem) {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob }),
          ]);
          setCopiedImage(true);
          setTimeout(() => setCopiedImage(false), 2000);
        } else {
          handleDownloadPNG(false);
        }
      });
    } catch (err) {
      console.warn('Clipboard image copy fallback to download:', err);
      handleDownloadPNG(false);
    }
  };

  return (
    <div className="modal-backdrop animate-fade-in" onClick={onClose} style={{ zIndex: 1200 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 580,
          background: 'linear-gradient(180deg, rgba(16, 23, 42, 0.98) 0%, rgba(8, 12, 24, 0.99) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: 'var(--radius-xl)',
          padding: '28px 32px',
          boxShadow: '0 30px 70px -15px rgba(0, 0, 0, 0.8), 0 0 45px rgba(99, 102, 241, 0.2)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Top Gradient Decorative Bar */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: 'linear-gradient(90deg, #6366f1 0%, #a855f7 40%, #06b6d4 100%)',
        }} />

        {/* Modal Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
          flexWrap: 'wrap',
          gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(168, 85, 247, 0.25) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#a855f7',
              boxShadow: '0 0 20px rgba(168, 85, 247, 0.35)',
              border: '1px solid rgba(168, 85, 247, 0.4)',
            }}>
              <QrCode size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ fontSize: 19, fontWeight: 800, color: '#fff' }}>QR Code Studio Pro</h3>
                <span className="badge badge-indigo" style={{ fontSize: 11, padding: '2px 7px' }}>
                  HD Vector
                </span>
              </div>
              <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>
                Custom high-resolution vector QR codes ready for print and mobile scanning
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-sm"
            style={{ padding: 6, borderRadius: '50%', color: 'var(--text-muted)' }}
            title="Close dialog (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Customization Sub-Tabs */}
        <div style={{
          display: 'flex',
          gap: 6,
          background: 'rgba(255, 255, 255, 0.04)',
          padding: 3,
          borderRadius: 10,
          marginBottom: 18,
          border: '1px solid var(--border-subtle)',
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('themes')}
            className="btn btn-sm"
            style={{
              flex: 1,
              background: activeTab === 'themes' ? 'var(--gradient-primary)' : 'transparent',
              color: activeTab === 'themes' ? '#fff' : 'var(--text-muted)',
              border: 'none',
              borderRadius: 7,
              fontSize: 12.5,
              fontWeight: 600,
            }}
          >
            <Palette size={13} />
            <span>Color Palettes</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('custom')}
            className="btn btn-sm"
            style={{
              flex: 1,
              background: activeTab === 'custom' ? 'var(--gradient-primary)' : 'transparent',
              color: activeTab === 'custom' ? '#fff' : 'var(--text-muted)',
              border: 'none',
              borderRadius: 7,
              fontSize: 12.5,
              fontWeight: 600,
            }}
          >
            <Sliders size={13} />
            <span>Custom Colors</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className="btn btn-sm"
            style={{
              flex: 1,
              background: activeTab === 'settings' ? 'var(--gradient-primary)' : 'transparent',
              color: activeTab === 'settings' ? '#fff' : 'var(--text-muted)',
              border: 'none',
              borderRadius: 7,
              fontSize: 12.5,
              fontWeight: 600,
            }}
          >
            <Layers size={13} />
            <span>Resolution & Margin</span>
          </button>
        </div>

        {/* TAB 1: CURATED THEMES */}
        {activeTab === 'themes' && (
          <div className="animate-fade-in" style={{ marginBottom: 18 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {QR_THEMES.map((theme) => {
                const isSelected = !isCustomColor && selectedTheme.id === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => {
                      setSelectedTheme(theme);
                      setIsCustomColor(false);
                    }}
                    className="btn btn-sm"
                    style={{
                      padding: '8px 10px',
                      fontSize: 12,
                      background: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid',
                      borderColor: isSelected ? 'rgba(99, 102, 241, 0.5)' : 'var(--border-subtle)',
                      color: isSelected ? '#fff' : 'var(--text-muted)',
                      borderRadius: 9,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    <span style={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      background: theme.fg,
                      border: '1.5px solid rgba(255, 255, 255, 0.3)',
                    }} />
                    <span>{theme.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: CUSTOM COLOR PICKER */}
        {activeTab === 'custom' && (
          <div className="animate-fade-in" style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
            marginBottom: 18,
            padding: '12px 16px',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
          }}>
            <div>
              <label className="form-label">Foreground (QR Pattern)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="color"
                  value={customFg}
                  onChange={(e) => {
                    setCustomFg(e.target.value);
                    setIsCustomColor(true);
                  }}
                  style={{ width: 36, height: 36, borderRadius: 8, border: 'none', cursor: 'pointer', background: 'transparent' }}
                />
                <input
                  type="text"
                  className="form-input"
                  style={{ padding: '6px 10px', fontFamily: 'var(--font-mono)', fontSize: 12 }}
                  value={customFg}
                  onChange={(e) => {
                    setCustomFg(e.target.value);
                    setIsCustomColor(true);
                  }}
                />
              </div>
            </div>

            <div>
              <label className="form-label">Background Color</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="color"
                  value={customBg}
                  onChange={(e) => {
                    setCustomBg(e.target.value);
                    setIsCustomColor(true);
                  }}
                  style={{ width: 36, height: 36, borderRadius: 8, border: 'none', cursor: 'pointer', background: 'transparent' }}
                />
                <input
                  type="text"
                  className="form-input"
                  style={{ padding: '6px 10px', fontFamily: 'var(--font-mono)', fontSize: 12 }}
                  value={customBg}
                  onChange={(e) => {
                    setCustomBg(e.target.value);
                    setIsCustomColor(true);
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: RESOLUTION & MARGIN SETTINGS */}
        {activeTab === 'settings' && (
          <div className="animate-fade-in" style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 14,
            marginBottom: 18,
            padding: '14px 16px',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
          }}>
            <div>
              <label className="form-label">Resolution Quality</label>
              <select
                className="form-input"
                style={{ fontSize: 12.5, cursor: 'pointer', height: 38 }}
                value={selectedSizePreset.label}
                onChange={(e) => {
                  const found = SIZE_PRESETS.find((s) => s.label === e.target.value);
                  if (found) setSelectedSizePreset(found);
                }}
              >
                {SIZE_PRESETS.map((s) => (
                  <option key={s.label} value={s.label}>
                    {s.label} ({s.size}px)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Error Recovery (ECC)</label>
              <select
                className="form-input"
                style={{ fontSize: 12.5, cursor: 'pointer', height: 38 }}
                value={errorCorrection}
                onChange={(e) => setErrorCorrection(e.target.value)}
              >
                <option value="L">Level L (7% Damage Recovery)</option>
                <option value="M">Level M (15% Standard)</option>
                <option value="Q">Level Q (25% High Density)</option>
                <option value="H">Level H (30% Max Rugged)</option>
              </select>
            </div>
          </div>
        )}

        {/* QR Code Canvas Display Box */}
        <div style={{
          background: currentBg,
          padding: 24,
          borderRadius: 20,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          margin: '0 auto 18px',
          width: 'fit-content',
          boxShadow: '0 20px 45px rgba(0, 0, 0, 0.65), 0 0 30px rgba(99, 102, 241, 0.15)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          transition: 'all 0.25s ease',
        }}>
          <QRCodeCanvas
            id="qr-code-canvas"
            value={link.short_url}
            size={selectedSizePreset.size}
            fgColor={currentFg}
            bgColor={currentBg}
            level={errorCorrection}
            includeMargin={includeMargin}
          />
        </div>

        {/* Link Details Pill */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 18px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10,
        }}>
          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '75%' }}>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
              Encoded Short Link Target
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13.5, fontWeight: 700, color: 'var(--accent-secondary)', marginTop: 2 }}>
              {link.short_url}
            </div>
          </div>

          <a
            href={link.short_url}
            target="_blank"
            rel="noreferrer"
            className="btn btn-ghost btn-sm"
            style={{ fontSize: 12, padding: '4px 8px', color: '#38bdf8' }}
            title="Test target redirect in new tab"
          >
            <span>Test URL</span>
            <ExternalLink size={12} />
          </a>
        </div>

        {/* Bottom Action Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
          <button
            type="button"
            onClick={() => handleDownloadPNG(true)}
            className="btn btn-primary"
            style={{ fontSize: 13 }}
            title="Download high-resolution image"
          >
            <Download size={15} />
            <span>Download PNG</span>
          </button>

          <button
            type="button"
            onClick={handleCopyImageToClipboard}
            className="btn btn-secondary"
            style={{ fontSize: 13 }}
            title="Copy QR image to clipboard"
          >
            {copiedImage ? <Check size={15} color="#10b981" /> : <Image size={15} />}
            <span>{copiedImage ? 'Image Copied!' : 'Copy Image'}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyUrl}
            className="btn btn-secondary"
            style={{ fontSize: 13 }}
            title="Copy text URL"
          >
            {copiedUrl ? <Check size={15} color="#10b981" /> : <Copy size={15} />}
            <span>{copiedUrl ? 'Copied URL' : 'Copy URL'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
