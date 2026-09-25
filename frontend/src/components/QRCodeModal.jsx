import React, { useState, useRef, useEffect, useMemo } from 'react';
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import {
  X, Download, Copy, Check, QrCode, Palette, Sparkles,
  ExternalLink, Layers, Sliders, Image, CheckCircle2,
  ShieldCheck, Share2, Printer, Zap, RefreshCw,
  Upload, Trash2, Smartphone, Star, Rocket,
  Globe, Link as LinkIcon, Camera, ArrowRight, Lock
} from 'lucide-react';
import { copyTextToClipboard } from '../utils/helpers';

// Preset Color Palettes
const QR_THEMES = [
  { id: 'dark', name: 'Midnight Onyx', fg: '#0f172a', bg: '#ffffff', glow: '#0f172a' },
  { id: 'indigo', name: 'Cyber Violet', fg: '#4f46e5', bg: '#ffffff', glow: '#6366f1' },
  { id: 'cyan', name: 'Neon Cyan', fg: '#0284c7', bg: '#ffffff', glow: '#06b6d4' },
  { id: 'emerald', name: 'Emerald Mint', fg: '#059669', bg: '#ffffff', glow: '#10b981' },
  { id: 'sunset', name: 'Sunset Coral', fg: '#e11d48', bg: '#ffffff', glow: '#f43f5e' },
  { id: 'amber', name: 'Solar Amber', fg: '#d97706', bg: '#ffffff', glow: '#f59e0b' },
  { id: 'dark_luxe', name: 'Dark Luxe', fg: '#38bdf8', bg: '#0b1120', glow: '#38bdf8' },
  { id: 'gold_matrix', name: 'Gold Matrix', fg: '#f59e0b', bg: '#060913', glow: '#f59e0b' },
  { id: 'monokai', name: 'Cyber Hacker', fg: '#a6e22e', bg: '#131822', glow: '#a6e22e' },
  { id: 'amethyst', name: 'Royal Velvet', fg: '#c084fc', bg: '#130a24', glow: '#c084fc' },
  { id: 'glacier', name: 'Glacier Ice', fg: '#0284c7', bg: '#f0f9ff', glow: '#0284c7' },
  { id: 'crimson', name: 'Crimson Night', fg: '#ef4444', bg: '#180a0a', glow: '#ef4444' },
];

// SVG Icon Data URIs for Center Logos
const LOGO_PRESETS = [
  { id: 'none', label: 'None', icon: null, src: null },
  {
    id: 'link',
    label: 'Link',
    icon: LinkIcon,
    src: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="6" fill="%236366f1"/><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="%23ffffff" stroke-width="2.2" stroke-linecap="round"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="%23ffffff" stroke-width="2.2" stroke-linecap="round"/></svg>`,
  },
  {
    id: 'zap',
    label: 'Lightning',
    icon: Zap,
    src: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="6" fill="%23f59e0b"/><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="%23ffffff" stroke="%23ffffff" stroke-width="1.5"/></svg>`,
  },
  {
    id: 'shield',
    label: 'Shield',
    icon: ShieldCheck,
    src: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="6" fill="%2310b981"/><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="%2310b981"/><polyline points="9 12 11 14 15 10" stroke="%23ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  },
  {
    id: 'star',
    label: 'Star',
    icon: Star,
    src: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="6" fill="%23a855f7"/><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="%23ffffff"/></svg>`,
  },
  {
    id: 'rocket',
    label: 'Rocket',
    icon: Rocket,
    src: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="6" fill="%23ec4899"/><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" stroke="%23ffffff" stroke-width="1.8" fill="%23ffffff"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" stroke="%23ffffff" stroke-width="1.8" fill="%23ffffff"/></svg>`,
  },
  {
    id: 'globe',
    label: 'Globe',
    icon: Globe,
    src: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="6" fill="%2306b6d4"/><circle cx="12" cy="12" r="7" stroke="%23ffffff" stroke-width="2"/><line x1="5" y1="12" x2="19" y2="12" stroke="%23ffffff" stroke-width="1.8"/><path d="M12 5a15.3 15.3 0 0 1 3.5 7 15.3 15.3 0 0 1-3.5 7 15.3 15.3 0 0 1-3.5-7 15.3 15.3 0 0 1 3.5-7z" stroke="%23ffffff" stroke-width="1.8"/></svg>`,
  },
];

const RESOLUTION_PRESETS = [
  { label: 'Standard Web', size: 512, multiplier: 1, desc: '512 × 512 px (Fast Web/Email)' },
  { label: 'HD Vector (2x)', size: 1024, multiplier: 2, desc: '1024 × 1024 px (Social & Media)' },
  { label: 'Ultra Print 4K', size: 2048, multiplier: 4, desc: '2048 × 2048 px (Signage & Posters)' },
];

const FRAME_PRESETS = [
  { id: 'none', name: 'Minimal', desc: 'Pure QR Code without extra borders' },
  { id: 'scan_me', name: 'Scan Me Pill', desc: 'Top action badge banner' },
  { id: 'card', name: 'Branded Card', desc: 'Card with Title and Short Link' },
  { id: 'cyber', name: 'Cyber Neon', desc: 'Tech frame with glowing corners' },
];

export default function QRCodeModal({ link, onClose }) {
  const [activeTab, setActiveTab] = useState('palette'); // 'palette' | 'logo' | 'frames' | 'export'
  const [selectedTheme, setSelectedTheme] = useState(QR_THEMES[0]);
  const [customFg, setCustomFg] = useState('#0f172a');
  const [customBg, setCustomBg] = useState('#ffffff');
  const [isCustomColor, setIsCustomColor] = useState(false);
  const [isTransparentBg, setIsTransparentBg] = useState(false);

  // Logo Overlay States
  const [selectedLogoPreset, setSelectedLogoPreset] = useState('none');
  const [customLogoUrl, setCustomLogoUrl] = useState(null);
  const [logoSizePercent, setLogoSizePercent] = useState(24); // 15% - 32%
  const [excavateLogo, setExcavateLogo] = useState(true);

  // Framing & Style
  const [frameStyle, setFrameStyle] = useState('none');
  const [customCaption, setCustomCaption] = useState('SCAN ME');
  const [marginModules, setMarginModules] = useState(3);

  // Resolution & Quality
  const [selectedResolution, setSelectedResolution] = useState(RESOLUTION_PRESETS[1]);
  const [errorCorrection, setErrorCorrection] = useState('H'); // L, M, Q, H

  // Simulator Mode
  const [isSimulatingScan, setIsSimulatingScan] = useState(false);

  // Status & Feedback States
  const [toastMessage, setToastMessage] = useState(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);

  const fileInputRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Derived Active Colors
  const currentFg = isCustomColor ? customFg : selectedTheme.fg;
  const currentBg = isTransparentBg ? 'transparent' : (isCustomColor ? customBg : selectedTheme.bg);

  // Active Logo Source
  const activeLogoSrc = useMemo(() => {
    if (customLogoUrl) return customLogoUrl;
    const preset = LOGO_PRESETS.find((p) => p.id === selectedLogoPreset);
    return preset?.src || null;
  }, [customLogoUrl, selectedLogoPreset]);

  // If a logo is active, recommend/boost ECC to 'H'
  const effectiveECC = activeLogoSrc ? 'H' : errorCorrection;

  // Calculate contrast ratio score for scannability
  const contrastRating = useMemo(() => {
    if (isTransparentBg) return { text: 'Transparent Background', level: 'good', score: 'Variable' };
    const getLuminance = (hex) => {
      if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) return 0.5;
      const rgb = parseInt(hex.slice(1), 16);
      const r = ((rgb >> 16) & 255) / 255;
      const g = ((rgb >> 8) & 255) / 255;
      const b = (rgb & 255) / 255;
      return 0.299 * r + 0.587 * g + 0.114 * b;
    };
    const l1 = getLuminance(currentFg);
    const l2 = getLuminance(currentBg);
    const diff = Math.abs(l1 - l2);
    if (diff > 0.6) return { text: 'Optimal Contrast (100% Scannable)', level: 'optimal', score: 'A+' };
    if (diff > 0.35) return { text: 'Good Contrast (High Scannability)', level: 'good', score: 'B+' };
    return { text: 'Low Contrast Warning (May not scan easily)', level: 'warning', score: 'C' };
  }, [currentFg, currentBg, isTransparentBg]);

  if (!link) return null;

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const triggerConfettiBurst = () => {
    try {
      confetti({
        particleCount: 45,
        spread: 55,
        origin: { y: 0.75 },
        colors: ['#6366f1', '#a855f7', '#06b6d4', '#10b981', '#f59e0b'],
      });
    } catch {
      // ignore
    }
  };

  // Swap / Invert Colors
  const handleInvertColors = () => {
    const tempFg = currentFg;
    const tempBg = isTransparentBg ? '#ffffff' : currentBg;
    setCustomFg(tempBg);
    setCustomBg(tempFg);
    setIsCustomColor(true);
    setIsTransparentBg(false);
    showToast('Inverted Colors!');
  };

  // Handle Logo Upload
  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Logo file must be under 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setCustomLogoUrl(event.target.result);
      setSelectedLogoPreset('custom');
      showToast('Custom Logo Uploaded!');
    };
    reader.readAsDataURL(file);
  };

  const handleClearCustomLogo = () => {
    setCustomLogoUrl(null);
    setSelectedLogoPreset('none');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Handle Copy Short URL
  const handleCopyUrl = () => {
    copyTextToClipboard(link.short_url);
    setCopiedUrl(true);
    showToast('Short URL copied to clipboard!');
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  // Composite high-res canvas renderer for PNG export (with optional Frames)
  const renderCompositeExportCanvas = (targetQrSize = 1024) => {
    const qrCanvas = document.getElementById('qr-code-canvas');
    if (!qrCanvas) return null;

    if (frameStyle === 'none') {
      // Pure high-res QR export
      const offscreen = document.createElement('canvas');
      offscreen.width = targetQrSize;
      offscreen.height = targetQrSize;
      const ctx = offscreen.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      if (!isTransparentBg) {
        ctx.fillStyle = currentBg;
        ctx.fillRect(0, 0, targetQrSize, targetQrSize);
      }
      ctx.drawImage(qrCanvas, 0, 0, targetQrSize, targetQrSize);
      return offscreen;
    }

    // Framed Export (Scan Me Pill, Branded Card, or Cyber Neon)
    const padding = Math.round(targetQrSize * 0.08);
    let topHeaderHeight = 0;
    let bottomFooterHeight = 0;

    if (frameStyle === 'scan_me') {
      topHeaderHeight = Math.round(targetQrSize * 0.14);
      bottomFooterHeight = Math.round(targetQrSize * 0.08);
    } else if (frameStyle === 'card') {
      topHeaderHeight = Math.round(targetQrSize * 0.16);
      bottomFooterHeight = Math.round(targetQrSize * 0.16);
    } else if (frameStyle === 'cyber') {
      topHeaderHeight = Math.round(targetQrSize * 0.12);
      bottomFooterHeight = Math.round(targetQrSize * 0.12);
    }

    const totalWidth = targetQrSize + padding * 2;
    const totalHeight = targetQrSize + padding * 2 + topHeaderHeight + bottomFooterHeight;

    const canvas = document.createElement('canvas');
    canvas.width = totalWidth;
    canvas.height = totalHeight;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Background Card
    const cardBgColor = isTransparentBg ? (currentBg === 'transparent' ? '#0f172a' : currentBg) : (currentBg === '#ffffff' ? '#ffffff' : currentBg);
    const cardTextColor = currentBg === '#ffffff' ? '#0f172a' : (currentFg === '#ffffff' ? '#ffffff' : '#f8fafc');

    ctx.fillStyle = cardBgColor;
    ctx.beginPath();
    ctx.roundRect(0, 0, totalWidth, totalHeight, Math.round(totalWidth * 0.05));
    ctx.fill();

    // Frame Borders / Cyber Accents
    if (frameStyle === 'cyber') {
      ctx.strokeStyle = currentFg;
      ctx.lineWidth = Math.round(totalWidth * 0.008);
      ctx.strokeRect(padding * 0.5, padding * 0.5, totalWidth - padding, totalHeight - padding);
    } else {
      ctx.strokeStyle = 'rgba(128, 128, 128, 0.2)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Top Header Banner
    if (frameStyle === 'scan_me') {
      const bannerW = totalWidth * 0.6;
      const bannerH = topHeaderHeight * 0.65;
      const bannerX = (totalWidth - bannerW) / 2;
      const bannerY = padding;

      ctx.fillStyle = currentFg;
      ctx.beginPath();
      ctx.roundRect(bannerX, bannerY, bannerW, bannerH, bannerH / 2);
      ctx.fill();

      ctx.fillStyle = currentBg === 'transparent' ? '#ffffff' : currentBg;
      ctx.font = `bold ${Math.round(bannerH * 0.5)}px system-ui, -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(customCaption || 'SCAN ME', totalWidth / 2, bannerY + bannerH / 2);
    } else if (frameStyle === 'card') {
      ctx.fillStyle = cardTextColor;
      ctx.font = `bold ${Math.round(topHeaderHeight * 0.35)}px system-ui, -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const titleText = link.title || customCaption || 'Scan to Visit';
      ctx.fillText(titleText, totalWidth / 2, padding + topHeaderHeight * 0.5);
    }

    // Draw Main QR Canvas
    const qrX = padding;
    const qrY = padding + topHeaderHeight;
    ctx.drawImage(qrCanvas, qrX, qrY, targetQrSize, targetQrSize);

    // Bottom Footer Link Text
    if (frameStyle === 'card' || frameStyle === 'scan_me' || frameStyle === 'cyber') {
      ctx.fillStyle = cardTextColor;
      ctx.font = `600 ${Math.round(targetQrSize * 0.038)}px monospace, system-ui`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const footerY = totalHeight - padding - bottomFooterHeight * 0.45;
      ctx.fillText(link.short_url, totalWidth / 2, footerY);
    }

    return canvas;
  };

  // Download High-Resolution PNG
  const handleDownloadPNG = () => {
    const exportCanvas = renderCompositeExportCanvas(selectedResolution.size);
    if (!exportCanvas) return;

    const dataUrl = exportCanvas.toDataURL('image/png');
    const downloadLink = document.createElement('a');
    downloadLink.href = dataUrl;
    downloadLink.download = `qr-${link.short_code}-${selectedTheme.id}-${selectedResolution.label.toLowerCase().replace(/\s+/g, '_')}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    triggerConfettiBurst();
    showToast(`✨ Downloaded ${selectedResolution.label} PNG!`);
  };

  // Download Infinite Scalable Vector SVG
  const handleDownloadSVG = () => {
    const svgEl = document.getElementById('qr-code-svg');
    if (!svgEl) return;

    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svgEl);
    if (!source.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)) {
      source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qr-${link.short_code}-${selectedTheme.id}-vector.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    triggerConfettiBurst();
    showToast('✨ Vector SVG exported successfully!');
  };

  // Copy Image to Clipboard
  const handleCopyImageToClipboard = async () => {
    const exportCanvas = renderCompositeExportCanvas(1024);
    if (!exportCanvas) return;

    try {
      exportCanvas.toBlob(async (blob) => {
        if (!blob) return;
        if (navigator.clipboard && window.ClipboardItem) {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob }),
          ]);
          setCopiedImage(true);
          triggerConfettiBurst();
          showToast('📋 QR Image copied to clipboard!');
          setTimeout(() => setCopiedImage(false), 2000);
        } else {
          handleDownloadPNG();
        }
      });
    } catch (err) {
      console.warn('Clipboard image fallback:', err);
      handleDownloadPNG();
    }
  };

  // Web Share API
  const handleShare = async () => {
    const exportCanvas = renderCompositeExportCanvas(1024);
    if (!exportCanvas) return;

    if (navigator.share) {
      try {
        exportCanvas.toBlob(async (blob) => {
          if (!blob) return;
          const file = new File([blob], `qr-${link.short_code}.png`, { type: 'image/png' });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: `QR Code for ${link.title || link.short_code}`,
              text: `Scan or visit ${link.short_url}`,
              url: link.short_url,
              files: [file],
            });
          } else {
            await navigator.share({
              title: `QR Code for ${link.title || link.short_code}`,
              text: `Scan or visit ${link.short_url}`,
              url: link.short_url,
            });
          }
          showToast('Shared successfully!');
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          handleCopyUrl();
        }
      }
    } else {
      handleCopyUrl();
    }
  };

  // Clean Print Format
  const handlePrint = () => {
    const exportCanvas = renderCompositeExportCanvas(1024);
    if (!exportCanvas) return;
    const imgDataUrl = exportCanvas.toDataURL('image/png');

    const printWindow = window.open('', '_blank', 'width=750,height=850');
    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print QR Code - ${link.short_code}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 90vh;
              margin: 0;
              background: #fff;
              color: #0f172a;
            }
            .card {
              border: 2px solid #e2e8f0;
              border-radius: 20px;
              padding: 36px 32px;
              text-align: center;
              max-width: 440px;
              box-shadow: 0 4px 20px rgba(0,0,0,0.06);
            }
            h2 { margin: 0 0 6px; font-size: 22px; color: #0f172a; }
            .url-sub { margin: 0 0 24px; color: #64748b; font-size: 13.5px; word-break: break-all; }
            img { width: 280px; height: 280px; display: block; margin: 0 auto 20px; border-radius: 12px; }
            .badge {
              display: inline-block;
              background: #f8fafc;
              color: #4f46e5;
              font-family: monospace;
              font-weight: 700;
              font-size: 16px;
              padding: 8px 18px;
              border-radius: 99px;
              border: 1.5px solid #cbd5e1;
            }
            .footer {
              margin-top: 20px;
              font-size: 11px;
              color: #94a3b8;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            @media print {
              body { margin: 0; padding: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>${link.title || 'Scan QR Code'}</h2>
            <div class="url-sub">${link.original_url}</div>
            <img src="${imgDataUrl}" alt="QR Code" />
            <div class="badge">${link.short_url}</div>
            <div class="footer">Generated with Custom Link Shortener &bull; High Resolution Vector</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // QR preview pixel size for the modal canvas
  const previewSize = 220;
  const logoPixelSize = Math.round((previewSize * logoSizePercent) / 100);

  return (
    <div className="modal-backdrop animate-fade-in" onClick={onClose} style={{ zIndex: 1200 }}>
      {/* Dynamic Toast Message */}
      {toastMessage && (
        <div className="qr-toast-notice">
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      <div
        className="qr-studio-dialog animate-fade-in"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: `0 35px 80px -15px rgba(0, 0, 0, 0.85), 0 0 50px ${selectedTheme.glow}33`,
        }}
      >
        {/* Top Decorative Gradient Bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3.5,
            background: 'linear-gradient(90deg, #6366f1 0%, #a855f7 35%, #06b6d4 70%, #10b981 100%)',
          }}
        />

        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
            flexWrap: 'wrap',
            gap: 12,
            paddingBottom: 16,
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(168, 85, 247, 0.3) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#c084fc',
                boxShadow: '0 0 25px rgba(168, 85, 247, 0.4)',
                border: '1px solid rgba(168, 85, 247, 0.45)',
              }}
            >
              <QrCode size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
                  QR Code Studio Pro
                </h3>
                <span className="badge badge-indigo" style={{ fontSize: 11, padding: '2px 8px' }}>
                  Ultra Vector & 4K
                </span>
                {activeLogoSrc && (
                  <span className="badge badge-emerald" style={{ fontSize: 11, padding: '2px 8px' }}>
                    <Sparkles size={11} /> Logo Active
                  </span>
                )}
              </div>
              <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>
                Design, customize, simulate and export ultra-sharp QR codes with vector accuracy
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={() => setIsSimulatingScan(!isSimulatingScan)}
              className="btn btn-sm"
              style={{
                background: isSimulatingScan ? 'rgba(6, 182, 212, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                color: isSimulatingScan ? '#67e8f9' : 'var(--text-muted)',
                borderColor: isSimulatingScan ? 'rgba(6, 182, 212, 0.5)' : 'var(--border-subtle)',
                fontSize: 12,
              }}
              title="Toggle Live Camera Scan Simulation"
            >
              <Smartphone size={14} />
              <span>{isSimulatingScan ? 'Exit Scanner' : 'Simulate Scan'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost btn-sm"
              style={{ padding: 8, borderRadius: '50%', color: 'var(--text-muted)' }}
              title="Close modal (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Main Studio Body: 2 Columns */}
        <div className="qr-studio-body">
          {/* ================= LEFT COLUMN: LIVE PREVIEW & QUICK ACTIONS ================= */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Card Frame Container */}
            <div
              style={{
                background: currentBg === 'transparent' ? 'rgba(255, 255, 255, 0.03)' : currentBg,
                backgroundImage: isTransparentBg
                  ? 'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)'
                  : undefined,
                backgroundSize: isTransparentBg ? '12px 12px' : undefined,
                padding: frameStyle === 'none' ? '22px' : '20px 24px 24px',
                borderRadius: 22,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                boxShadow: `0 20px 50px rgba(0, 0, 0, 0.7), 0 0 35px ${selectedTheme.glow}25`,
                border: frameStyle === 'cyber'
                  ? `2px solid ${currentFg}`
                  : '1px solid rgba(255, 255, 255, 0.12)',
                transition: 'all 0.25s ease',
              }}
            >
              {/* Scan Me Banner Frame */}
              {frameStyle === 'scan_me' && (
                <div
                  style={{
                    background: currentFg,
                    color: currentBg === 'transparent' ? '#ffffff' : (currentBg === '#ffffff' ? '#ffffff' : currentBg),
                    padding: '6px 18px',
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginBottom: 14,
                    boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                  }}
                >
                  <Camera size={14} />
                  <span>{customCaption || 'SCAN ME'}</span>
                </div>
              )}

              {/* Branded Card Header */}
              {frameStyle === 'card' && (
                <div style={{ textAlign: 'center', marginBottom: 12, maxWidth: 220 }}>
                  <div
                    style={{
                      fontSize: 13.5,
                      fontWeight: 800,
                      color: currentBg === '#ffffff' ? '#0f172a' : '#f8fafc',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {link.title || customCaption || 'Scan to Visit'}
                  </div>
                </div>
              )}

              {/* Cyber Frame Corner Accents */}
              {frameStyle === 'cyber' && (
                <>
                  <div style={{ position: 'absolute', top: 6, left: 6, width: 10, height: 10, borderTop: `3px solid ${currentFg}`, borderLeft: `3px solid ${currentFg}` }} />
                  <div style={{ position: 'absolute', top: 6, right: 6, width: 10, height: 10, borderTop: `3px solid ${currentFg}`, borderRight: `3px solid ${currentFg}` }} />
                  <div style={{ position: 'absolute', bottom: 6, left: 6, width: 10, height: 10, borderBottom: `3px solid ${currentFg}`, borderLeft: `3px solid ${currentFg}` }} />
                  <div style={{ position: 'absolute', bottom: 6, right: 6, width: 10, height: 10, borderBottom: `3px solid ${currentFg}`, borderRight: `3px solid ${currentFg}` }} />
                </>
              )}

              {/* The Interactive QR Canvas */}
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <QRCodeCanvas
                  id="qr-code-canvas"
                  value={link.short_url}
                  size={previewSize}
                  fgColor={currentFg}
                  bgColor={currentBg}
                  level={effectiveECC}
                  marginSize={marginModules}
                  imageSettings={
                    activeLogoSrc
                      ? {
                          src: activeLogoSrc,
                          height: logoPixelSize,
                          width: logoPixelSize,
                          excavate: excavateLogo,
                        }
                      : undefined
                  }
                />

                {/* Laser scan animation overlay when simulator is turned on */}
                {isSimulatingScan && <div className="qr-scan-laser" />}
              </div>

              {/* Hidden SVG element for true vector extraction */}
              <div style={{ display: 'none' }}>
                <QRCodeSVG
                  id="qr-code-svg"
                  value={link.short_url}
                  size={1024}
                  fgColor={currentFg}
                  bgColor={currentBg}
                  level={effectiveECC}
                  marginSize={marginModules}
                  imageSettings={
                    activeLogoSrc
                      ? {
                          src: activeLogoSrc,
                          height: Math.round((1024 * logoSizePercent) / 100),
                          width: Math.round((1024 * logoSizePercent) / 100),
                          excavate: excavateLogo,
                        }
                      : undefined
                  }
                />
              </div>

              {/* Bottom short URL text for card and cyber styles */}
              {(frameStyle === 'card' || frameStyle === 'cyber') && (
                <div
                  style={{
                    marginTop: 12,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    fontWeight: 700,
                    color: currentBg === '#ffffff' ? '#4f46e5' : '#38bdf8',
                  }}
                >
                  {link.short_code}
                </div>
              )}
            </div>

            {/* Scan Simulation HUD Card */}
            {isSimulatingScan && (
              <div
                className="animate-fade-in"
                style={{
                  background: 'rgba(6, 182, 212, 0.08)',
                  border: '1px solid rgba(6, 182, 212, 0.35)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 14px',
                  boxShadow: '0 0 20px rgba(6, 182, 212, 0.15)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#22d3ee', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Camera Scan Readout
                  </span>
                  <span className="badge badge-cyan" style={{ fontSize: 10, padding: '1px 6px' }}>
                    <Lock size={10} /> SSL Secure
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#fff', fontWeight: 600, wordBreak: 'break-all' }}>
                  {link.short_url}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span>Target:</span>
                  <span style={{ color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {link.original_url}
                  </span>
                </div>
                <a
                  href={link.short_url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-sm btn-primary"
                  style={{ width: '100%', marginTop: 8, fontSize: 11.5, padding: '5px 10px' }}
                >
                  <span>Open Target Destination</span>
                  <ArrowRight size={13} />
                </a>
              </div>
            )}

            {/* Scannability Quality Meter */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldCheck
                  size={16}
                  color={
                    contrastRating.level === 'optimal'
                      ? '#10b981'
                      : contrastRating.level === 'good'
                      ? '#06b6d4'
                      : '#f59e0b'
                  }
                />
                <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{contrastRating.text}</span>
              </div>
              <span
                className={`badge ${
                  contrastRating.level === 'optimal'
                    ? 'badge-emerald'
                    : contrastRating.level === 'good'
                    ? 'badge-cyan'
                    : 'badge-amber'
                }`}
                style={{ fontSize: 10, padding: '1px 6px' }}
              >
                {contrastRating.score}
              </span>
            </div>

            {/* Quick Actions Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <button
                type="button"
                onClick={handleCopyImageToClipboard}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: 12 }}
                title="Copy QR image directly to clipboard"
              >
                {copiedImage ? <Check size={14} color="#10b981" /> : <Image size={14} />}
                <span>{copiedImage ? 'Copied!' : 'Copy Img'}</span>
              </button>

              <button
                type="button"
                onClick={handleCopyUrl}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: 12 }}
                title="Copy text URL"
              >
                {copiedUrl ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                <span>{copiedUrl ? 'Copied!' : 'Copy URL'}</span>
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: 12 }}
                title="Share QR Code via system dialog"
              >
                <Share2 size={14} />
                <span>Share</span>
              </button>
            </div>
          </div>

          {/* ================= RIGHT COLUMN: STUDIO CONTROLS & SETTINGS ================= */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Control Tabs */}
            <div
              style={{
                display: 'flex',
                gap: 4,
                background: 'rgba(255, 255, 255, 0.04)',
                padding: 4,
                borderRadius: 12,
                border: '1px solid var(--border-subtle)',
              }}
            >
              <button
                type="button"
                onClick={() => setActiveTab('palette')}
                className="btn btn-sm"
                style={{
                  flex: 1,
                  background: activeTab === 'palette' ? 'var(--gradient-primary)' : 'transparent',
                  color: activeTab === 'palette' ? '#fff' : 'var(--text-muted)',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  padding: '7px 8px',
                }}
              >
                <Palette size={13} />
                <span>Colors</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('logo')}
                className="btn btn-sm"
                style={{
                  flex: 1,
                  background: activeTab === 'logo' ? 'var(--gradient-primary)' : 'transparent',
                  color: activeTab === 'logo' ? '#fff' : 'var(--text-muted)',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  padding: '7px 8px',
                }}
              >
                <Sparkles size={13} />
                <span>Logo & Icon</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('frames')}
                className="btn btn-sm"
                style={{
                  flex: 1,
                  background: activeTab === 'frames' ? 'var(--gradient-primary)' : 'transparent',
                  color: activeTab === 'frames' ? '#fff' : 'var(--text-muted)',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  padding: '7px 8px',
                }}
              >
                <Layers size={13} />
                <span>Card & Frame</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('export')}
                className="btn btn-sm"
                style={{
                  flex: 1,
                  background: activeTab === 'export' ? 'var(--gradient-primary)' : 'transparent',
                  color: activeTab === 'export' ? '#fff' : 'var(--text-muted)',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  padding: '7px 8px',
                }}
              >
                <Sliders size={13} />
                <span>Export Pro</span>
              </button>
            </div>

            {/* TAB 1: COLOR PALETTES & CUSTOM PICKER */}
            {activeTab === 'palette' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <label className="form-label" style={{ margin: 0 }}>Curated Color Themes</label>
                    <button
                      type="button"
                      onClick={handleInvertColors}
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: 11, padding: '2px 6px', height: 22 }}
                    >
                      <RefreshCw size={11} />
                      <span>Invert Colors</span>
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {QR_THEMES.map((theme) => {
                      const isSelected = !isCustomColor && selectedTheme.id === theme.id;
                      return (
                        <button
                          key={theme.id}
                          type="button"
                          onClick={() => {
                            setSelectedTheme(theme);
                            setIsCustomColor(false);
                            setIsTransparentBg(false);
                          }}
                          className="btn btn-sm"
                          style={{
                            padding: '8px 10px',
                            fontSize: 11.5,
                            background: isSelected ? 'rgba(99, 102, 241, 0.22)' : 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid',
                            borderColor: isSelected ? 'rgba(99, 102, 241, 0.6)' : 'var(--border-subtle)',
                            color: isSelected ? '#fff' : 'var(--text-muted)',
                            borderRadius: 9,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-start',
                            gap: 8,
                            boxShadow: isSelected ? `0 0 14px ${theme.glow}40` : 'none',
                          }}
                        >
                          <span
                            style={{
                              width: 14,
                              height: 14,
                              borderRadius: '50%',
                              background: theme.fg,
                              border: `2px solid ${theme.bg === '#ffffff' ? '#cbd5e1' : 'rgba(255,255,255,0.3)'}`,
                              flexShrink: 0,
                            }}
                          />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {theme.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Hex Color Pickers */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 12,
                  }}
                >
                  <div>
                    <label className="form-label">Foreground (QR Dots)</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="color"
                        value={currentFg.startsWith('#') ? currentFg : '#0f172a'}
                        onChange={(e) => {
                          setCustomFg(e.target.value);
                          setIsCustomColor(true);
                        }}
                        style={{ width: 34, height: 34, borderRadius: 8, border: 'none', cursor: 'pointer', background: 'transparent' }}
                      />
                      <input
                        type="text"
                        className="form-input"
                        style={{ padding: '6px 10px', fontFamily: 'var(--font-mono)', fontSize: 12 }}
                        value={currentFg}
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
                        disabled={isTransparentBg}
                        value={currentBg.startsWith('#') ? currentBg : '#ffffff'}
                        onChange={(e) => {
                          setCustomBg(e.target.value);
                          setIsCustomColor(true);
                          setIsTransparentBg(false);
                        }}
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 8,
                          border: 'none',
                          cursor: isTransparentBg ? 'not-allowed' : 'pointer',
                          opacity: isTransparentBg ? 0.3 : 1,
                          background: 'transparent',
                        }}
                      />
                      <input
                        type="text"
                        disabled={isTransparentBg}
                        className="form-input"
                        style={{
                          padding: '6px 10px',
                          fontFamily: 'var(--font-mono)',
                          fontSize: 12,
                          opacity: isTransparentBg ? 0.4 : 1,
                        }}
                        value={isTransparentBg ? 'Transparent' : currentBg}
                        onChange={(e) => {
                          setCustomBg(e.target.value);
                          setIsCustomColor(true);
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Transparent BG Toggle */}
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 12.5,
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isTransparentBg}
                    onChange={(e) => setIsTransparentBg(e.target.checked)}
                    style={{ accentColor: '#6366f1', width: 15, height: 15, cursor: 'pointer' }}
                  />
                  <span>Transparent Background (Recommended for design overlays & PNG/SVG exports)</span>
                </label>
              </div>
            )}

            {/* TAB 2: LOGO & ICON OVERLAY */}
            {activeTab === 'logo' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label className="form-label">Center Icon Presets</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                    {LOGO_PRESETS.map((p) => {
                      const IconComp = p.icon;
                      const isSelected = selectedLogoPreset === p.id && !customLogoUrl;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setSelectedLogoPreset(p.id);
                            setCustomLogoUrl(null);
                          }}
                          className="btn btn-sm"
                          style={{
                            padding: '8px 6px',
                            fontSize: 11.5,
                            background: isSelected ? 'rgba(99, 102, 241, 0.22)' : 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid',
                            borderColor: isSelected ? 'rgba(99, 102, 241, 0.6)' : 'var(--border-subtle)',
                            color: isSelected ? '#fff' : 'var(--text-muted)',
                            borderRadius: 9,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          {IconComp ? <IconComp size={16} /> : <X size={16} />}
                          <span>{p.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Logo File Upload */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px dashed var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {customLogoUrl ? (
                      <img
                        src={customLogoUrl}
                        alt="Custom Logo"
                        style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'contain', background: '#fff', padding: 2 }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 8,
                          background: 'rgba(255, 255, 255, 0.05)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--text-dim)',
                        }}
                      >
                        <Upload size={18} />
                      </div>
                    )}
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: '#fff' }}>
                        {customLogoUrl ? 'Custom Brand Logo Active' : 'Upload Custom Logo'}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        PNG, SVG, or JPG (max 2MB)
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 6 }}>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      style={{ display: 'none' }}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: 12 }}
                    >
                      <Upload size={13} />
                      <span>{customLogoUrl ? 'Change' : 'Upload'}</span>
                    </button>
                    {customLogoUrl && (
                      <button
                        type="button"
                        onClick={handleClearCustomLogo}
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--accent-rose)', padding: '6px 8px' }}
                        title="Remove custom logo"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Logo Size Slider */}
                {activeLogoSrc && (
                  <div
                    className="animate-fade-in"
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '12px 14px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <label className="form-label" style={{ margin: 0 }}>Logo Scale: {logoSizePercent}%</label>
                      <span style={{ fontSize: 11, color: 'var(--accent-emerald)', fontWeight: 600 }}>
                        Auto ECC Level H (Rugged)
                      </span>
                    </div>
                    <input
                      type="range"
                      min="15"
                      max="32"
                      value={logoSizePercent}
                      onChange={(e) => setLogoSizePercent(Number(e.target.value))}
                      className="qr-range-slider"
                    />

                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: 12,
                        color: 'var(--text-muted)',
                        marginTop: 10,
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={excavateLogo}
                        onChange={(e) => setExcavateLogo(e.target.checked)}
                        style={{ accentColor: '#6366f1', width: 14, height: 14, cursor: 'pointer' }}
                      />
                      <span>Excavate background (clears dots behind logo for crispness)</span>
                    </label>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: FRAMES & CARD CUSTOMIZATION */}
            {activeTab === 'frames' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label className="form-label">Framing & Presentation Style</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {FRAME_PRESETS.map((f) => {
                      const isSelected = frameStyle === f.id;
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setFrameStyle(f.id)}
                          className="btn btn-sm"
                          style={{
                            padding: '10px 12px',
                            background: isSelected ? 'rgba(99, 102, 241, 0.22)' : 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid',
                            borderColor: isSelected ? 'rgba(99, 102, 241, 0.6)' : 'var(--border-subtle)',
                            color: isSelected ? '#fff' : 'var(--text-muted)',
                            borderRadius: 9,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                            textAlign: 'left',
                            gap: 2,
                          }}
                        >
                          <span style={{ fontWeight: 700, fontSize: 12.5, color: isSelected ? '#fff' : 'var(--text-main)' }}>
                            {f.name}
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                            {f.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Caption Banner Input */}
                {frameStyle !== 'none' && (
                  <div className="animate-fade-in">
                    <label className="form-label">Custom Banner / Header Text</label>
                    <input
                      type="text"
                      className="form-input"
                      value={customCaption}
                      onChange={(e) => setCustomCaption(e.target.value)}
                      placeholder="e.g. SCAN ME, POINT CAMERA HERE..."
                      style={{ fontSize: 13 }}
                    />
                  </div>
                )}

                {/* Quiet Zone Margin Slider */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <label className="form-label" style={{ margin: 0 }}>Quiet Zone Margin: {marginModules} modules</label>
                    <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>Standard: 3 - 4</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    value={marginModules}
                    onChange={(e) => setMarginModules(Number(e.target.value))}
                    className="qr-range-slider"
                  />
                </div>
              </div>
            )}

            {/* TAB 4: EXPORT PRO & RESOLUTION */}
            {activeTab === 'export' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Resolution Preset Picker */}
                <div>
                  <label className="form-label">Target Export Resolution</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {RESOLUTION_PRESETS.map((r) => {
                      const isSelected = selectedResolution.label === r.label;
                      return (
                        <button
                          key={r.label}
                          type="button"
                          onClick={() => setSelectedResolution(r)}
                          className="btn btn-sm"
                          style={{
                            padding: '10px 8px',
                            background: isSelected ? 'rgba(99, 102, 241, 0.22)' : 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid',
                            borderColor: isSelected ? 'rgba(99, 102, 241, 0.6)' : 'var(--border-subtle)',
                            color: isSelected ? '#fff' : 'var(--text-muted)',
                            borderRadius: 9,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                            gap: 3,
                          }}
                        >
                          <span style={{ fontWeight: 700, fontSize: 12, color: isSelected ? '#fff' : 'var(--text-main)' }}>
                            {r.label}
                          </span>
                          <span style={{ fontSize: 10.5, color: 'var(--text-dim)' }}>
                            {r.size}px
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Error Correction Level */}
                <div>
                  <label className="form-label">Error Correction Level (ECC)</label>
                  <select
                    className="form-input"
                    value={errorCorrection}
                    onChange={(e) => setErrorCorrection(e.target.value)}
                    style={{ fontSize: 12.5, cursor: 'pointer' }}
                  >
                    <option value="L">Level L (7% Damage Recovery - Fastest)</option>
                    <option value="M">Level M (15% Standard - Balanced)</option>
                    <option value="Q">Level Q (25% High Reliability)</option>
                    <option value="H">Level H (30% Max Rugged - Best for Logos & Badges)</option>
                  </select>
                </div>

                {/* Format Features Info */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px',
                    fontSize: 12,
                    color: 'var(--text-muted)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#38bdf8', fontWeight: 700 }}>
                    <Zap size={14} />
                    <span>Multi-Format Output Engine</span>
                  </div>
                  <div>&bull; <strong>PNG:</strong> High-density bitmap with custom card frame rendering.</div>
                  <div>&bull; <strong>SVG Vector:</strong> Infinite resolution vector for print, Figma, & Illustrator.</div>
                  <div>&bull; <strong>Direct Print:</strong> Formatted layout for physical posters & table tents.</div>
                </div>
              </div>
            )}

            {/* Target Encoded Info Pill */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: 'auto',
              }}
            >
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '75%' }}>
                <div style={{ fontSize: 10.5, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
                  Short Link Target
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, fontWeight: 700, color: 'var(--accent-secondary)' }}>
                  {link.short_url}
                </div>
              </div>

              <a
                href={link.short_url}
                target="_blank"
                rel="noreferrer"
                className="btn btn-ghost btn-sm"
                style={{ fontSize: 11.5, padding: '4px 8px', color: '#38bdf8' }}
                title="Test target redirect in new tab"
              >
                <span>Test Link</span>
                <ExternalLink size={12} />
              </a>
            </div>

            {/* Bottom Export Action Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 0.8fr', gap: 8 }}>
              <button
                type="button"
                onClick={handleDownloadPNG}
                className="btn btn-primary"
                style={{ fontSize: 12.5, padding: '9px 12px' }}
                title={`Download ${selectedResolution.label} PNG`}
              >
                <Download size={14} />
                <span>Download PNG</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadSVG}
                className="btn btn-secondary"
                style={{ fontSize: 12.5, padding: '9px 12px' }}
                title="Download infinite resolution SVG Vector"
              >
                <Sparkles size={14} />
                <span>Vector SVG</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="btn btn-secondary"
                style={{ fontSize: 12.5, padding: '9px 12px' }}
                title="Print physical card"
              >
                <Printer size={14} />
                <span>Print</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
