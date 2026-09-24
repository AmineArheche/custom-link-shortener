import React, { useState, useEffect, useId } from 'react';
import { 
  Link2, Sparkles, ChevronDown, ChevronUp, Copy, Check, 
  QrCode, ExternalLink, ArrowRight, Globe, 
  Layers, Megaphone, AlertCircle, RefreshCw, X, Tag, Clock,
  Clipboard, ShieldCheck, Share2, Download, FileText, CheckCircle2,
  Sliders, Zap, HelpCircle, Eye, CornerDownRight, ArrowUpRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { QRCodeCanvas } from 'qrcode.react';
import { createShortLink, bulkCreateShortLinks } from '../services/api';
import { copyTextToClipboard } from '../utils/helpers';

const UTM_PRESETS = [
  { name: 'Twitter / X', source: 'twitter', medium: 'social' },
  { name: 'LinkedIn', source: 'linkedin', medium: 'social' },
  { name: 'Google Ads', source: 'google', medium: 'cpc' },
  { name: 'Meta / FB', source: 'facebook', medium: 'paid_social' },
  { name: 'Newsletter', source: 'newsletter', medium: 'email' },
  { name: 'YouTube', source: 'youtube', medium: 'video' },
  { name: 'TikTok', source: 'tiktok', medium: 'social' },
  { name: 'Product Hunt', source: 'producthunt', medium: 'referral' },
  { name: 'Reddit', source: 'reddit', medium: 'community' },
];

const SUGGESTED_TAGS = ['marketing', 'campaign', 'social', 'newsletter', 'github', 'promo', 'product', 'event'];

const SAMPLE_BULK_DATA = `https://github.com/AmineArheche/custom-link-shortener | repo-hub | Project Repository
https://react.dev | react-docs | React Documentation
https://fastapi.tiangolo.com | fastapi-docs | FastAPI Guide
https://tailwindcss.com | tailwind-home | Tailwind CSS
https://developer.mozilla.org | mdn-web-docs | MDN Web Docs`;

export default function LinkCreator({ onLinkCreated, onOpenQR }) {
  const [mode, setMode] = useState('single'); // 'single' | 'bulk' | 'utm'
  const qrCanvasId = useId();
  
  // Single link state
  const [url, setUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [title, setTitle] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState([]);
  const [expiryPreset, setExpiryPreset] = useState('never');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeTab, setActiveTab] = useState('alias'); // 'alias' | 'utm' | 'expiry' | 'tags'
  
  // UTM Builder state
  const [utmSource, setUtmSource] = useState('');
  const [utmMedium, setUtmMedium] = useState('');
  const [utmCampaign, setUtmCampaign] = useState('');
  const [utmTerm, setUtmTerm] = useState('');
  const [utmContent, setUtmContent] = useState('');
  const [utmAppliedAlert, setUtmAppliedAlert] = useState(false);

  // Bulk mode state
  const [bulkUrls, setBulkUrls] = useState('');
  const [bulkTags, setBulkTags] = useState('');
  const [bulkResults, setBulkResults] = useState(null);
  const [bulkCopiedAll, setBulkCopiedAll] = useState(false);

  // General state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [createdLink, setCreatedLink] = useState(null);
  const [copied, setCopied] = useState(false);
  const [detectedDomain, setDetectedDomain] = useState('');

  // Extract domain name whenever URL changes
  useEffect(() => {
    if (!url.trim()) {
      setDetectedDomain('');
      return;
    }
    try {
      let raw = url.trim();
      if (!/^https?:\/\//i.test(raw)) {
        raw = 'https://' + raw;
      }
      const parsed = new URL(raw);
      setDetectedDomain(parsed.hostname.replace(/^www\./, ''));
    } catch {
      setDetectedDomain('');
    }
  }, [url]);

  const handleAddTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = tagInput.trim().replace(/^,+|,+$/g, '');
      if (val && !tags.includes(val)) {
        setTags([...tags, val]);
        setTagInput('');
      }
    }
  };

  const handleAddSuggestedTag = (suggested) => {
    if (!tags.includes(suggested)) {
      setTags([...tags, suggested]);
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const calculateExpiryDate = (preset) => {
    if (preset === 'never') return null;
    const now = new Date();
    if (preset === '1h') now.setHours(now.getHours() + 1);
    if (preset === '24h') now.setHours(now.getHours() + 24);
    if (preset === '7d') now.setDate(now.getDate() + 7);
    if (preset === '30d') now.setDate(now.getDate() + 30);
    if (preset === '90d') now.setDate(now.getDate() + 90);
    return now.toISOString();
  };

  const applyUtmPreset = (preset) => {
    setUtmSource(preset.source);
    setUtmMedium(preset.medium);
    if (!utmCampaign) setUtmCampaign('promo_launch');
  };

  const clearUtmFields = () => {
    setUtmSource('');
    setUtmMedium('');
    setUtmCampaign('');
    setUtmTerm('');
    setUtmContent('');
  };

  // Build UTM Decorated URL
  const applyUtmParameters = () => {
    if (!url.trim()) return;
    try {
      let base = url.trim();
      if (!/^https?:\/\//i.test(base)) {
        base = 'https://' + base;
      }
      const parsed = new URL(base);
      if (utmSource.trim()) parsed.searchParams.set('utm_source', utmSource.trim());
      if (utmMedium.trim()) parsed.searchParams.set('utm_medium', utmMedium.trim());
      if (utmCampaign.trim()) parsed.searchParams.set('utm_campaign', utmCampaign.trim());
      if (utmTerm.trim()) parsed.searchParams.set('utm_term', utmTerm.trim());
      if (utmContent.trim()) parsed.searchParams.set('utm_content', utmContent.trim());
      setUrl(parsed.toString());
      setUtmAppliedAlert(true);
      setTimeout(() => setUtmAppliedAlert(false), 2500);
    } catch {
      setError('Invalid URL format for appending UTM parameters');
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          setUrl(text.trim());
        }
      }
    } catch (err) {
      console.warn('Clipboard read error:', err);
    }
  };

  const handleSingleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!url.trim()) return;

    setIsLoading(true);
    setError(null);
    setCreatedLink(null);

    try {
      const payload = {
        original_url: url.trim(),
        custom_alias: customAlias.trim() || undefined,
        title: title.trim() || undefined,
        expires_at: calculateExpiryDate(expiryPreset),
        tags: tags,
      };

      const result = await createShortLink(payload);
      setCreatedLink(result);
      if (onLinkCreated) {
        onLinkCreated(result);
      }

      try {
        confetti({
          particleCount: 110,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#ec4899', '#f59e0b'],
        });
      } catch {
        // silent fallback
      }

      // Reset form fields
      setUrl('');
      setCustomAlias('');
      setTitle('');
      setTags([]);
      setTagInput('');
      clearUtmFields();
      setShowAdvanced(false);
    } catch (err) {
      setError(err.message || 'Failed to create short link');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkSubmit = async (e) => {
    if (e) e.preventDefault();
    const rawLines = bulkUrls.split('\n').map((l) => l.trim()).filter(Boolean);
    if (rawLines.length === 0) return;

    setIsLoading(true);
    setError(null);
    setBulkResults(null);

    const parsedTags = bulkTags.split(',').map((t) => t.trim()).filter(Boolean);

    const items = rawLines.map((line) => {
      const parts = line.split('|').map((p) => p.trim());
      return {
        original_url: parts[0],
        custom_alias: parts[1] || undefined,
        title: parts[2] || undefined,
        tags: parsedTags,
      };
    });

    try {
      const res = await bulkCreateShortLinks(items);
      setBulkResults(res);
      if (onLinkCreated) {
        onLinkCreated();
      }
      try {
        confetti({
          particleCount: 130,
          spread: 90,
          origin: { y: 0.6 },
          colors: ['#10b981', '#06b6d4', '#6366f1', '#a855f7'],
        });
      } catch {}
    } catch (err) {
      setError(err.message || 'Bulk creation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (shortUrl) => {
    copyTextToClipboard(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyAllBulk = () => {
    if (!bulkResults || !bulkResults.results) return;
    const urls = bulkResults.results
      .filter((r) => r.success && r.short_url)
      .map((r) => r.short_url)
      .join('\n');
    if (urls) {
      copyTextToClipboard(urls);
      setBulkCopiedAll(true);
      setTimeout(() => setBulkCopiedAll(false), 2000);
    }
  };

  const handleExportBulkCsv = () => {
    if (!bulkResults || !bulkResults.results) return;
    const rows = [
      ['Original URL', 'Short URL', 'Short Code', 'Status', 'Error'],
      ...bulkResults.results.map((r) => [
        `"${r.original_url.replace(/"/g, '""')}"`,
        r.short_url ? `"${r.short_url}"` : '""',
        r.short_code ? `"${r.short_code}"` : '""',
        r.success ? 'Success' : 'Failed',
        r.error ? `"${r.error.replace(/"/g, '""')}"` : '""',
      ]),
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `bulk-shortened-links-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = (platform, linkUrl) => {
    const encoded = encodeURIComponent(linkUrl);
    let shareUrl = '';
    if (platform === 'twitter') {
      shareUrl = `https://twitter.com/intent/tweet?url=${encoded}&text=${encodeURIComponent('Check out this link!')}`;
    } else if (platform === 'linkedin') {
      shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`;
    } else if (platform === 'whatsapp') {
      shareUrl = `https://api.whatsapp.com/send?text=${encoded}`;
    } else if (platform === 'telegram') {
      shareUrl = `https://t.me/share/url?url=${encoded}`;
    } else if (platform === 'reddit') {
      shareUrl = `https://reddit.com/submit?url=${encoded}&title=${encodeURIComponent('Check this link')}`;
    } else if (platform === 'email') {
      shareUrl = `mailto:?subject=${encodeURIComponent('Link share')}&body=${encoded}`;
    }
    if (shareUrl) window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };

  // Preview alias generator
  const previewSlug = customAlias ? customAlias.trim() : 'custom-code';
  const previewShortUrl = `${window.location.protocol}//${window.location.host}/r/${previewSlug}`;

  const hasActiveUtm = Boolean(utmSource || utmMedium || utmCampaign || utmTerm || utmContent);
  const bulkLinesCount = bulkUrls.split('\n').filter((l) => l.trim().length > 0).length;

  return (
    <div className="glass-panel" style={{
      position: 'relative',
      overflow: 'hidden',
      border: '1px solid rgba(255, 255, 255, 0.12)',
      borderRadius: 'var(--radius-xl)',
      background: 'linear-gradient(180deg, rgba(17, 24, 46, 0.95) 0%, rgba(10, 15, 30, 0.98) 100%)',
      boxShadow: '0 24px 60px -15px rgba(0, 0, 0, 0.75), 0 0 40px rgba(99, 102, 241, 0.08)',
    }}>
      {/* Top Animated Luminous Gradient Accent Line */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        background: 'linear-gradient(90deg, #6366f1 0%, #a855f7 30%, #06b6d4 70%, #10b981 100%)',
      }} />

      {/* Background Ambient Glow Spheres */}
      <div style={{
        position: 'absolute',
        top: -100,
        right: -80,
        width: 320,
        height: 320,
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.22) 0%, transparent 70%)',
        pointerEvents: 'none',
        filter: 'blur(30px)',
      }} />
      <div style={{
        position: 'absolute',
        bottom: -120,
        left: -80,
        width: 300,
        height: 300,
        background: 'radial-gradient(circle, rgba(6, 182, 212, 0.18) 0%, transparent 70%)',
        pointerEvents: 'none',
        filter: 'blur(30px)',
      }} />

      {/* Main Container Padding */}
      <div style={{ padding: '32px 36px', position: 'relative', zIndex: 1 }}>
        
        {/* Header Bar with Live Badge & Mode Switcher */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 18,
          marginBottom: 28,
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(168, 85, 247, 0.3) 100%)',
                border: '1px solid rgba(168, 85, 247, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#c084fc',
                boxShadow: '0 0 15px rgba(168, 85, 247, 0.35)',
              }}>
                <Sparkles size={18} />
              </div>
              <h2 style={{
                fontSize: 22,
                fontWeight: 800,
                letterSpacing: '-0.025em',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                <span>Smart URL Shortener Studio</span>
              </h2>
              <span className="badge badge-indigo" style={{ fontSize: 11, padding: '3px 8px' }}>
                <Zap size={11} />
                <span>v2.0 Pro</span>
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: 13.5, marginTop: 6, maxWidth: 620 }}>
              Convert lengthy URLs into ultra-fast branded vanity links with custom slugs, UTM attribution, instant QR codes, and click telemetry.
            </p>
          </div>

          {/* Mode Navigation Tabs */}
          <div style={{
            display: 'flex',
            background: 'rgba(15, 23, 42, 0.8)',
            padding: 4,
            borderRadius: 14,
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.4)',
          }}>
            <button
              type="button"
              onClick={() => setMode('single')}
              className="btn btn-sm"
              style={{
                background: mode === 'single' ? 'var(--gradient-primary)' : 'transparent',
                color: mode === 'single' ? '#fff' : 'var(--text-muted)',
                border: 'none',
                borderRadius: 10,
                padding: '8px 16px',
                fontWeight: 700,
                fontSize: 13,
                boxShadow: mode === 'single' ? '0 4px 14px rgba(99, 102, 241, 0.45)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              <Link2 size={15} />
              <span>Single Link</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('bulk')}
              className="btn btn-sm"
              style={{
                background: mode === 'bulk' ? 'var(--gradient-primary)' : 'transparent',
                color: mode === 'bulk' ? '#fff' : 'var(--text-muted)',
                border: 'none',
                borderRadius: 10,
                padding: '8px 16px',
                fontWeight: 700,
                fontSize: 13,
                boxShadow: mode === 'bulk' ? '0 4px 14px rgba(99, 102, 241, 0.45)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              <Layers size={15} />
              <span>Bulk Shortener</span>
              {bulkLinesCount > 0 && (
                <span style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: 10,
                  fontSize: 10,
                  padding: '1px 6px',
                  marginLeft: 4,
                }}>
                  {bulkLinesCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="animate-fade-in" style={{
            background: 'rgba(244, 63, 94, 0.12)',
            border: '1px solid rgba(244, 63, 94, 0.4)',
            color: '#fb7185',
            padding: '14px 18px',
            borderRadius: 'var(--radius-md)',
            marginBottom: 22,
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            boxShadow: '0 8px 24px rgba(244, 63, 94, 0.18)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertCircle size={18} />
              <span style={{ fontWeight: 500 }}>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              style={{ background: 'transparent', border: 'none', color: '#fb7185', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* UTM Applied Notification Banner */}
        {utmAppliedAlert && (
          <div className="animate-fade-in" style={{
            background: 'rgba(6, 182, 212, 0.12)',
            border: '1px solid rgba(6, 182, 212, 0.4)',
            color: '#67e8f9',
            padding: '12px 18px',
            borderRadius: 'var(--radius-md)',
            marginBottom: 20,
            fontSize: 13.5,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <CheckCircle2 size={16} />
            <span>UTM campaign parameters successfully appended to destination URL!</span>
          </div>
        )}

        {/* ========================================================= */}
        {/* SINGLE LINK CREATION VIEW                                */}
        {/* ========================================================= */}
        {mode === 'single' && (
          <form onSubmit={handleSingleSubmit}>
            {/* Primary Input Container */}
            <div style={{
              background: 'rgba(11, 17, 32, 0.75)',
              padding: '6px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexWrap: 'wrap',
              transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            }}>
              {/* Left Protocol / Globe Icon */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                paddingLeft: 12,
                color: detectedDomain ? '#38bdf8' : 'var(--text-dim)',
              }}>
                <Globe size={18} />
                {detectedDomain && (
                  <span style={{
                    fontSize: 12,
                    fontWeight: 700,
                    background: 'rgba(56, 189, 248, 0.12)',
                    color: '#38bdf8',
                    padding: '2px 8px',
                    borderRadius: 6,
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    fontFamily: 'var(--font-mono)',
                  }}>
                    {detectedDomain}
                  </span>
                )}
              </div>

              {/* Main Destination URL Input */}
              <div style={{ flex: '1 1 280px', position: 'relative' }}>
                <input
                  type="text"
                  className="form-input"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    boxShadow: 'none',
                    fontSize: 15,
                    height: 48,
                    padding: '0 8px',
                    color: '#fff',
                  }}
                  placeholder="Paste long destination URL (e.g. https://yourbrand.com/products/promo)..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                />
              </div>

              {/* Action Buttons Inside Input Row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingRight: 4 }}>
                {url ? (
                  <button
                    type="button"
                    onClick={() => setUrl('')}
                    className="btn btn-ghost btn-sm"
                    style={{ padding: '6px 8px', color: 'var(--text-muted)' }}
                    title="Clear input"
                  >
                    <X size={16} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handlePasteFromClipboard}
                    className="btn btn-ghost btn-sm"
                    style={{
                      padding: '6px 12px',
                      fontSize: 12,
                      gap: 4,
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-muted)',
                    }}
                    title="Paste from clipboard"
                  >
                    <Clipboard size={13} />
                    <span>Paste</span>
                  </button>
                )}

                {/* Primary Shorten Action Button */}
                <button
                  type="submit"
                  disabled={isLoading || !url.trim()}
                  className="btn btn-primary"
                  style={{
                    padding: '0 26px',
                    height: 46,
                    minWidth: 160,
                    fontSize: 14.5,
                    fontWeight: 700,
                  }}
                >
                  {isLoading ? (
                    <>
                      <RefreshCw size={17} className="animate-spin" />
                      <span>Shortening...</span>
                    </>
                  ) : (
                    <>
                      <span>Shorten URL</span>
                      <ArrowRight size={17} />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Option Toolbar Chips */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 10,
              marginTop: 14,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="btn btn-ghost btn-sm"
                  style={{
                    padding: '6px 14px',
                    fontSize: 13,
                    fontWeight: 600,
                    borderRadius: 'var(--radius-sm)',
                    background: showAdvanced ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid',
                    borderColor: showAdvanced ? 'rgba(255, 255, 255, 0.2)' : 'var(--border-subtle)',
                    color: showAdvanced ? '#fff' : 'var(--text-muted)',
                  }}
                >
                  <Sliders size={14} />
                  <span>{showAdvanced ? 'Hide Customization Hub' : 'Custom Alias, UTM & Expiry'}</span>
                  {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {/* Indicator Badges of Active Settings */}
                {customAlias && (
                  <span className="badge badge-indigo" style={{ fontSize: 11 }}>
                    Alias: /r/{customAlias}
                  </span>
                )}
                {hasActiveUtm && (
                  <span className="badge badge-cyan" style={{ fontSize: 11 }}>
                    <Megaphone size={11} />
                    UTM Configured
                  </span>
                )}
                {expiryPreset !== 'never' && (
                  <span className="badge badge-amber" style={{ fontSize: 11 }}>
                    <Clock size={11} />
                    TTL: {expiryPreset}
                  </span>
                )}
                {tags.length > 0 && (
                  <span className="badge badge-purple" style={{ fontSize: 11 }}>
                    <Tag size={11} />
                    {tags.length} Tag{tags.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              <div style={{ fontSize: 12, color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 5 }}>
                <span>💡 Tip: Press</span>
                <kbd style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  padding: '2px 6px',
                  borderRadius: 4,
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                }}>
                  Enter ↵
                </kbd>
                <span>to shorten instantly</span>
              </div>
            </div>

            {/* EXPANDED CUSTOMIZATION HUB */}
            {showAdvanced && (
              <div className="animate-fade-in" style={{
                marginTop: 18,
                background: 'rgba(13, 19, 38, 0.9)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '20px',
                boxShadow: '0 12px 35px rgba(0, 0, 0, 0.45)',
              }}>
                {/* Sub-tab Navigation for Clean Organization */}
                <div style={{
                  display: 'flex',
                  gap: 8,
                  borderBottom: '1px solid var(--border-subtle)',
                  paddingBottom: 14,
                  marginBottom: 18,
                  overflowX: 'auto',
                }}>
                  <button
                    type="button"
                    onClick={() => setActiveTab('alias')}
                    className="btn btn-sm"
                    style={{
                      background: activeTab === 'alias' ? 'rgba(99, 102, 241, 0.18)' : 'transparent',
                      color: activeTab === 'alias' ? '#a5b4fc' : 'var(--text-muted)',
                      border: activeTab === 'alias' ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
                      fontWeight: 600,
                      fontSize: 13,
                    }}
                  >
                    <Tag size={14} />
                    <span>Branding & Alias</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('utm')}
                    className="btn btn-sm"
                    style={{
                      background: activeTab === 'utm' ? 'rgba(6, 182, 212, 0.18)' : 'transparent',
                      color: activeTab === 'utm' ? '#67e8f9' : 'var(--text-muted)',
                      border: activeTab === 'utm' ? '1px solid rgba(6, 182, 212, 0.4)' : '1px solid transparent',
                      fontWeight: 600,
                      fontSize: 13,
                    }}
                  >
                    <Megaphone size={14} />
                    <span>UTM Campaign Builder</span>
                    {hasActiveUtm && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#06b6d4' }} />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('expiry')}
                    className="btn btn-sm"
                    style={{
                      background: activeTab === 'expiry' ? 'rgba(245, 158, 11, 0.18)' : 'transparent',
                      color: activeTab === 'expiry' ? '#fcd34d' : 'var(--text-muted)',
                      border: activeTab === 'expiry' ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid transparent',
                      fontWeight: 600,
                      fontSize: 13,
                    }}
                  >
                    <Clock size={14} />
                    <span>Expiration & TTL</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('tags')}
                    className="btn btn-sm"
                    style={{
                      background: activeTab === 'tags' ? 'rgba(168, 85, 247, 0.18)' : 'transparent',
                      color: activeTab === 'tags' ? '#d8b4fe' : 'var(--text-muted)',
                      border: activeTab === 'tags' ? '1px solid rgba(168, 85, 247, 0.4)' : '1px solid transparent',
                      fontWeight: 600,
                      fontSize: 13,
                    }}
                  >
                    <Layers size={14} />
                    <span>Categorization Tags ({tags.length})</span>
                  </button>
                </div>

                {/* TAB 1: BRANDING & CUSTOM ALIAS */}
                {activeTab === 'alias' && (
                  <div className="animate-fade-in" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: 18,
                  }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <label className="form-label" style={{ margin: 0 }}>Custom Alias (Back-half)</label>
                        <span style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                          {customAlias.length}/50
                        </span>
                      </div>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <span style={{
                          position: 'absolute',
                          left: 14,
                          color: '#a855f7',
                          fontSize: 13,
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          pointerEvents: 'none',
                        }}>
                          /r/
                        </span>
                        <input
                          type="text"
                          className="form-input"
                          style={{
                            paddingLeft: 38,
                            paddingRight: 36,
                            fontFamily: 'var(--font-mono)',
                            fontSize: 13.5,
                            borderColor: customAlias ? 'rgba(168, 85, 247, 0.4)' : undefined,
                          }}
                          placeholder="e.g. spring-sale-2026"
                          value={customAlias}
                          onChange={(e) => setCustomAlias(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                          maxLength={50}
                        />
                        {customAlias && (
                          <button
                            type="button"
                            onClick={() => setCustomAlias('')}
                            style={{
                              position: 'absolute',
                              right: 12,
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-dim)',
                              cursor: 'pointer',
                            }}
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                      <p style={{ fontSize: 11.5, color: 'var(--text-dim)', marginTop: 6 }}>
                        Allowed characters: letters, numbers, hyphens (-) and underscores (_).
                      </p>
                    </div>

                    <div>
                      <label className="form-label">Link Title (Internal Reference)</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Q3 Investor Presentation Deck"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        maxLength={255}
                      />
                      <p style={{ fontSize: 11.5, color: 'var(--text-dim)', marginTop: 6 }}>
                        A friendly title displayed on your analytics cards and exported logs.
                      </p>
                    </div>
                  </div>
                )}

                {/* TAB 2: UTM MARKETING STUDIO */}
                {activeTab === 'utm' && (
                  <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                      <div>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#67e8f9', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Megaphone size={16} />
                          <span>Channel Attribution Presets</span>
                        </span>
                        <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>
                          Click a platform preset to auto-populate source and medium attributes
                        </p>
                      </div>

                      {/* Quick Presets */}
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {UTM_PRESETS.map((preset) => (
                          <button
                            key={preset.name}
                            type="button"
                            onClick={() => applyUtmPreset(preset)}
                            className="btn btn-ghost btn-sm"
                            style={{
                              padding: '3px 10px',
                              fontSize: 11.5,
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: 6,
                            }}
                          >
                            {preset.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: 12,
                    }}>
                      <div>
                        <label className="form-label">Source (utm_source)</label>
                        <input
                          type="text"
                          className="form-input"
                          style={{ padding: '8px 12px', fontSize: 13 }}
                          placeholder="e.g. twitter, google, newsletter"
                          value={utmSource}
                          onChange={(e) => setUtmSource(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="form-label">Medium (utm_medium)</label>
                        <input
                          type="text"
                          className="form-input"
                          style={{ padding: '8px 12px', fontSize: 13 }}
                          placeholder="e.g. social, cpc, email"
                          value={utmMedium}
                          onChange={(e) => setUtmMedium(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="form-label">Campaign (utm_campaign)</label>
                        <input
                          type="text"
                          className="form-input"
                          style={{ padding: '8px 12px', fontSize: 13 }}
                          placeholder="e.g. black_friday_2026"
                          value={utmCampaign}
                          onChange={(e) => setUtmCampaign(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="form-label">Term / Keyword (utm_term)</label>
                        <input
                          type="text"
                          className="form-input"
                          style={{ padding: '8px 12px', fontSize: 13 }}
                          placeholder="e.g. link_shortener"
                          value={utmTerm}
                          onChange={(e) => setUtmTerm(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="form-label">Content / Variation (utm_content)</label>
                        <input
                          type="text"
                          className="form-input"
                          style={{ padding: '8px 12px', fontSize: 13 }}
                          placeholder="e.g. top_cta_button"
                          value={utmContent}
                          onChange={(e) => setUtmContent(e.target.value)}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
                      {hasActiveUtm && (
                        <button
                          type="button"
                          onClick={clearUtmFields}
                          className="btn btn-ghost btn-sm"
                          style={{ fontSize: 12.5 }}
                        >
                          Clear UTM Fields
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={applyUtmParameters}
                        disabled={!url.trim() || !hasActiveUtm}
                        className="btn btn-primary btn-sm"
                        style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)' }}
                      >
                        <Check size={14} />
                        <span>Append UTMs to URL</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 3: EXPIRATION & TTL */}
                {activeTab === 'expiry' && (
                  <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div>
                      <label className="form-label">Automatic Expiration Policy</label>
                      <select
                        className="form-input"
                        style={{ cursor: 'pointer', maxWidth: 360 }}
                        value={expiryPreset}
                        onChange={(e) => setExpiryPreset(e.target.value)}
                      >
                        <option value="never">Permanent (Never Expire)</option>
                        <option value="1h">1 Hour (Flash Campaign / Temporary)</option>
                        <option value="24h">24 Hours (Daily Deals & Promos)</option>
                        <option value="7d">7 Days (Weekly Special)</option>
                        <option value="30d">30 Days (Monthly Campaign)</option>
                        <option value="90d">90 Days (Quarterly Initiative)</option>
                      </select>
                    </div>
                    <div style={{
                      padding: '12px 16px',
                      background: 'rgba(245, 158, 11, 0.08)',
                      border: '1px solid rgba(245, 158, 11, 0.25)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 12.5,
                      color: '#fcd34d',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      maxWidth: 500,
                    }}>
                      <Clock size={16} />
                      <span>
                        {expiryPreset === 'never'
                          ? 'This link will remain active indefinitely and will never expire automatically.'
                          : `Link will automatically deactivate after ${expiryPreset === '1h' ? '1 hour' : expiryPreset === '24h' ? '24 hours' : expiryPreset === '7d' ? '7 days' : expiryPreset === '30d' ? '30 days' : '90 days'}.`}
                      </span>
                    </div>
                  </div>
                )}

                {/* TAB 4: CATEGORIZATION TAGS */}
                {activeTab === 'tags' && (
                  <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div>
                      <label className="form-label">Add Tags (Press Enter or Comma)</label>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                        {tags.map((t) => (
                          <span
                            key={t}
                            className="badge badge-purple"
                            style={{ padding: '5px 10px', fontSize: 12.5, display: 'inline-flex', alignItems: 'center' }}
                          >
                            #{t}
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(t)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#fda4af',
                                cursor: 'pointer',
                                marginLeft: 6,
                                display: 'inline-flex',
                                alignItems: 'center',
                              }}
                            >
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                      </div>

                      <input
                        type="text"
                        className="form-input"
                        placeholder="Type tag name and press Enter or comma..."
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleAddTag}
                      />
                    </div>

                    <div>
                      <span style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700, letterSpacing: '0.05em' }}>
                        Quick Suggested Tags:
                      </span>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                        {SUGGESTED_TAGS.map((sug) => (
                          <button
                            key={sug}
                            type="button"
                            onClick={() => handleAddSuggestedTag(sug)}
                            className="btn btn-ghost btn-sm"
                            style={{
                              padding: '3px 9px',
                              fontSize: 11.5,
                              background: tags.includes(sug) ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                              color: tags.includes(sug) ? '#d8b4fe' : 'var(--text-muted)',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: 6,
                            }}
                          >
                            +{sug}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </form>
        )}

        {/* ========================================================= */}
        {/* BULK SHORTENING VIEW                                     */}
        {/* ========================================================= */}
        {mode === 'bulk' && (
          <form onSubmit={handleBulkSubmit} className="animate-fade-in">
            <div style={{
              background: 'rgba(11, 17, 32, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px',
              marginBottom: 16,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                <label className="form-label" style={{ margin: 0 }}>
                  Paste Destination URLs (One per line, up to 50 links)
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setBulkUrls(SAMPLE_BULK_DATA)}
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: 11.5, padding: '4px 10px', color: '#a5b4fc', background: 'rgba(99, 102, 241, 0.1)' }}
                  >
                    <FileText size={13} />
                    <span>Load Sample Template</span>
                  </button>
                  {bulkUrls && (
                    <button
                      type="button"
                      onClick={() => setBulkUrls('')}
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: 11.5, padding: '4px 8px', color: 'var(--text-dim)' }}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <textarea
                className="form-input"
                rows={6}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 13,
                  lineHeight: 1.6,
                  padding: '12px 14px',
                  background: 'rgba(7, 11, 22, 0.9)',
                }}
                placeholder={`https://example.com/page1\nhttps://example.com/page2 | custom-slug | Optional Page Title\nhttps://github.com/project`}
                value={bulkUrls}
                onChange={(e) => setBulkUrls(e.target.value)}
                required
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, fontSize: 12, color: 'var(--text-dim)' }}>
                <span>
                  Format: <code>URL</code> or <code>URL | custom_alias | Title</code>
                </span>
                <span>
                  Lines: <strong style={{ color: bulkLinesCount > 0 ? '#67e8f9' : 'inherit' }}>{bulkLinesCount}</strong> / 50 max
                </span>
              </div>
            </div>

            {/* Batch Tags and Execute Row */}
            <div style={{
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ flex: '1 1 280px' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Batch categorization tags (e.g. marketing, launch, 2026)..."
                  value={bulkTags}
                  onChange={(e) => setBulkTags(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !bulkUrls.trim()}
                className="btn btn-primary"
                style={{ padding: '0 28px', height: 46, minWidth: 180 }}
              >
                {isLoading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Processing Batch...</span>
                  </>
                ) : (
                  <>
                    <Layers size={16} />
                    <span>Shorten {bulkLinesCount > 0 ? `${bulkLinesCount} Links` : 'Batch'}</span>
                  </>
                )}
              </button>
            </div>

            {/* Bulk Results Table */}
            {bulkResults && (
              <div className="animate-fade-in" style={{
                marginTop: 24,
                padding: '22px',
                background: 'rgba(11, 17, 32, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: '0 12px 35px rgba(0, 0, 0, 0.5)',
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16,
                  flexWrap: 'wrap',
                  gap: 12,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontWeight: 800, fontSize: 16, color: '#fff' }}>
                      Batch Shortening Report
                    </span>
                    <span className="badge badge-emerald">
                      Success: {bulkResults.total_success}
                    </span>
                    {bulkResults.total_failed > 0 && (
                      <span className="badge badge-rose">
                        Failed: {bulkResults.total_failed}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      onClick={handleCopyAllBulk}
                      className="btn btn-secondary btn-sm"
                      style={{
                        background: bulkCopiedAll ? 'rgba(16, 185, 129, 0.2)' : undefined,
                        borderColor: bulkCopiedAll ? '#10b981' : undefined,
                      }}
                    >
                      {bulkCopiedAll ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                      <span>{bulkCopiedAll ? 'All Copied!' : 'Copy All Links'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleExportBulkCsv}
                      className="btn btn-secondary btn-sm"
                    >
                      <Download size={13} />
                      <span>Export CSV</span>
                    </button>
                  </div>
                </div>

                <div style={{
                  maxHeight: 280,
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}>
                  {bulkResults.results.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '12px 16px',
                        background: item.success ? 'rgba(16, 185, 129, 0.06)' : 'rgba(244, 63, 94, 0.06)',
                        borderRadius: 10,
                        border: `1px solid ${item.success ? 'rgba(16, 185, 129, 0.25)' : 'rgba(244, 63, 94, 0.25)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                        fontSize: 13,
                      }}
                    >
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                        {item.success ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontFamily: 'var(--font-mono)', color: '#34d399', fontWeight: 700 }}>
                              {item.short_url}
                            </span>
                            <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>
                              → {item.original_url}
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: '#fb7185' }}>
                            ❌ {item.original_url} <span style={{ color: 'var(--text-dim)' }}>({item.error})</span>
                          </span>
                        )}
                      </div>

                      {item.success && (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            type="button"
                            onClick={() => handleCopy(item.short_url)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '4px 10px', fontSize: 12 }}
                          >
                            <Copy size={12} />
                            <span>Copy</span>
                          </button>
                          <a
                            href={item.short_url}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-ghost btn-sm"
                            style={{ padding: '4px 8px' }}
                            title="Visit link"
                          >
                            <ExternalLink size={13} />
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </form>
        )}

        {/* ========================================================= */}
        {/* SUCCESS NOTIFICATION / RESULT HERO CARD FOR SINGLE LINK   */}
        {/* ========================================================= */}
        {createdLink && mode === 'single' && (
          <div className="animate-fade-in" style={{
            marginTop: 26,
            padding: '24px 28px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 182, 212, 0.08) 50%, rgba(99, 102, 241, 0.1) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            boxShadow: '0 15px 40px rgba(16, 185, 129, 0.15), 0 0 30px rgba(6, 182, 212, 0.1)',
          }}>
            {/* Top row: Status header + Core Short URL */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 16,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: 'rgba(16, 185, 129, 0.22)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.5)',
                  boxShadow: '0 0 20px rgba(16, 185, 129, 0.35)',
                }}>
                  <Check size={26} strokeWidth={3} />
                </div>
                <div>
                  <div style={{
                    fontSize: 12,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: '#6ee7b7',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}>
                    <ShieldCheck size={14} />
                    <span>Link Generated & Live Globally</span>
                  </div>
                  <div style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: '#fff',
                    fontFamily: 'var(--font-mono)',
                    marginTop: 3,
                  }}>
                    {createdLink.short_url}
                  </div>
                </div>
              </div>

              {/* Main Link Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => handleCopy(createdLink.short_url)}
                  className="btn btn-primary btn-sm"
                  style={{
                    padding: '8px 16px',
                    fontSize: 13,
                    background: copied ? 'rgba(16, 185, 129, 0.9)' : undefined,
                  }}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copied ? 'Copied to Clipboard!' : 'Copy Short Link'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenQR && onOpenQR(createdLink)}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '8px 14px', fontSize: 13 }}
                  title="View and download high-res QR code"
                >
                  <QrCode size={14} />
                  <span>QR Code</span>
                </button>

                <a
                  href={createdLink.short_url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '8px 14px', fontSize: 13 }}
                  title="Test redirect in new tab"
                >
                  <ExternalLink size={14} />
                  <span>Visit Link</span>
                </a>
              </div>
            </div>

            {/* Bottom Row: Social Share Bar + Destination metadata */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 14,
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              paddingTop: 16,
            }}>
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '60%' }}>
                <span style={{ color: 'var(--text-dim)' }}>Destination: </span>
                <span style={{ color: '#e2e8f0', fontFamily: 'var(--font-mono)' }}>
                  {createdLink.original_url}
                </span>
              </div>

              {/* Social Share Icons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11.5, color: 'var(--text-dim)', marginRight: 4 }}>
                  Share:
                </span>
                <button
                  type="button"
                  onClick={() => handleShare('twitter', createdLink.short_url)}
                  className="btn btn-ghost btn-sm"
                  style={{ padding: '5px 8px', fontSize: 11.5, background: 'rgba(255, 255, 255, 0.04)', borderRadius: 6 }}
                  title="Share on X / Twitter"
                >
                  Twitter / X
                </button>
                <button
                  type="button"
                  onClick={() => handleShare('linkedin', createdLink.short_url)}
                  className="btn btn-ghost btn-sm"
                  style={{ padding: '5px 8px', fontSize: 11.5, background: 'rgba(255, 255, 255, 0.04)', borderRadius: 6 }}
                  title="Share on LinkedIn"
                >
                  LinkedIn
                </button>
                <button
                  type="button"
                  onClick={() => handleShare('whatsapp', createdLink.short_url)}
                  className="btn btn-ghost btn-sm"
                  style={{ padding: '5px 8px', fontSize: 11.5, background: 'rgba(255, 255, 255, 0.04)', borderRadius: 6 }}
                  title="Share on WhatsApp"
                >
                  WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => handleShare('telegram', createdLink.short_url)}
                  className="btn btn-ghost btn-sm"
                  style={{ padding: '5px 8px', fontSize: 11.5, background: 'rgba(255, 255, 255, 0.04)', borderRadius: 6 }}
                  title="Share on Telegram"
                >
                  Telegram
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
