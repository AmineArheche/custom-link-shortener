import React, { useState } from 'react';
import { 
  Link2, Sparkles, ChevronDown, ChevronUp, Copy, Check, 
  QrCode, ExternalLink, ArrowRight, Globe, 
  Layers, Megaphone, AlertCircle, RefreshCw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { createShortLink, bulkCreateShortLinks } from '../services/api';
import { copyTextToClipboard } from '../utils/helpers';

export default function LinkCreator({ onLinkCreated, onOpenQR }) {
  const [mode, setMode] = useState('single'); // 'single' | 'bulk'
  
  // Single link state
  const [url, setUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [title, setTitle] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState([]);
  const [expiryPreset, setExpiryPreset] = useState('never');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showUtmBuilder, setShowUtmBuilder] = useState(false);
  
  // UTM Builder state
  const [utmSource, setUtmSource] = useState('');
  const [utmMedium, setUtmMedium] = useState('');
  const [utmCampaign, setUtmCampaign] = useState('');
  const [utmTerm, setUtmTerm] = useState('');
  const [utmContent, setUtmContent] = useState('');

  // Bulk mode state
  const [bulkUrls, setBulkUrls] = useState('');
  const [bulkTags, setBulkTags] = useState('');
  const [bulkResults, setBulkResults] = useState(null);

  // General state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [createdLink, setCreatedLink] = useState(null);
  const [copied, setCopied] = useState(false);

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

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const calculateExpiryDate = (preset) => {
    if (preset === 'never') return null;
    const now = new Date();
    if (preset === '24h') now.setHours(now.getHours() + 24);
    if (preset === '7d') now.setDate(now.getDate() + 7);
    if (preset === '30d') now.setDate(now.getDate() + 30);
    return now.toISOString();
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
      if (utmSource) parsed.searchParams.set('utm_source', utmSource.trim());
      if (utmMedium) parsed.searchParams.set('utm_medium', utmMedium.trim());
      if (utmCampaign) parsed.searchParams.set('utm_campaign', utmCampaign.trim());
      if (utmTerm) parsed.searchParams.set('utm_term', utmTerm.trim());
      if (utmContent) parsed.searchParams.set('utm_content', utmContent.trim());
      setUrl(parsed.toString());
      setShowUtmBuilder(false);
    } catch {
      alert('Invalid URL format for UTM appending');
    }
  };

  const handleSingleSubmit = async (e) => {
    e.preventDefault();
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
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981'],
        });
      } catch {
        // silent fallback
      }

      // Reset form
      setUrl('');
      setCustomAlias('');
      setTitle('');
      setTags([]);
      setTagInput('');
      setUtmSource('');
      setUtmMedium('');
      setUtmCampaign('');
      setUtmTerm('');
      setUtmContent('');
    } catch (err) {
      setError(err.message || 'Failed to create short link');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    const rawLines = bulkUrls.split('\n').map((l) => l.trim()).filter(Boolean);
    if (rawLines.length === 0) return;

    setIsLoading(true);
    setError(null);
    setBulkResults(null);

    const parsedTags = bulkTags.split(',').map((t) => t.trim()).filter(Boolean);

    const items = rawLines.map((line) => {
      // Supports line format: URL or "URL | Alias | Title"
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
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#10b981', '#06b6d4', '#6366f1'],
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

  return (
    <div className="glass-panel" style={{ padding: '28px 32px', position: 'relative', overflow: 'hidden' }}>
      {/* Background ambient lighting */}
      <div style={{
        position: 'absolute',
        top: -60,
        right: -60,
        width: 220,
        height: 220,
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Header with Mode Switcher */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 22
      }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Sparkles size={22} color="var(--accent-secondary)" />
            <span>Shorten Any Destination URL</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
            Generate ultra-clean short URLs with custom branding, instant redirects, and telemetry.
          </p>
        </div>

        {/* Mode Switch Pills */}
        <div style={{
          display: 'flex',
          background: 'rgba(255, 255, 255, 0.05)',
          padding: 3,
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)'
        }}>
          <button
            type="button"
            onClick={() => setMode('single')}
            className="btn btn-sm"
            style={{
              background: mode === 'single' ? 'var(--gradient-primary)' : 'transparent',
              color: mode === 'single' ? '#fff' : 'var(--text-muted)',
              border: 'none',
              borderRadius: 8,
              padding: '6px 14px',
            }}
          >
            <Link2 size={14} />
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
              borderRadius: 8,
              padding: '6px 14px',
            }}
          >
            <Layers size={14} />
            <span>Bulk Shortener</span>
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          background: 'rgba(244, 63, 94, 0.12)',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          color: '#fb7185',
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          marginBottom: 20,
          fontSize: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* SINGLE LINK FORM */}
      {mode === 'single' && (
        <form onSubmit={handleSingleSubmit}>
          {/* Main URL Input Row */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 320px', position: 'relative' }}>
              <div style={{
                position: 'absolute',
                left: 14,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-dim)',
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center'
              }}>
                <Globe size={18} />
              </div>
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: 42, fontSize: 15 }}
                placeholder="Paste destination URL (e.g. https://yourcompany.com/blog/launch)..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !url.trim()}
              className="btn btn-primary"
              style={{ padding: '12px 28px', minWidth: 160 }}
            >
              {isLoading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
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

          {/* Quick Helper Badges */}
          <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="btn btn-ghost btn-sm"
              style={{ padding: '5px 10px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <span>{showAdvanced ? 'Hide Advanced Options' : 'Custom Alias, Expiry & Tags'}</span>
              {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            <button
              type="button"
              onClick={() => setShowUtmBuilder(!showUtmBuilder)}
              className="btn btn-ghost btn-sm"
              style={{
                padding: '5px 10px',
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                color: showUtmBuilder ? 'var(--accent-secondary)' : 'var(--text-muted)'
              }}
            >
              <Megaphone size={14} />
              <span>UTM Campaign Builder</span>
              {showUtmBuilder ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>

          {/* UTM Builder Drawer */}
          {showUtmBuilder && (
            <div className="animate-fade-in" style={{
              marginTop: 16,
              padding: '20px',
              background: 'rgba(99, 102, 241, 0.08)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#c7d2fe' }}>
                  🎯 UTM Marketing Parameter Generator
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                  Appends standard tracking tokens to destination
                </span>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 12,
              }}>
                <div>
                  <label className="form-label" style={{ fontSize: 11 }}>Source (utm_source)</label>
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
                  <label className="form-label" style={{ fontSize: 11 }}>Medium (utm_medium)</label>
                  <input
                    type="text"
                    className="form-input"
                    style={{ padding: '8px 12px', fontSize: 13 }}
                    placeholder="e.g. cpc, email, banner"
                    value={utmMedium}
                    onChange={(e) => setUtmMedium(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: 11 }}>Campaign (utm_campaign)</label>
                  <input
                    type="text"
                    className="form-input"
                    style={{ padding: '8px 12px', fontSize: 13 }}
                    placeholder="e.g. spring_launch_2026"
                    value={utmCampaign}
                    onChange={(e) => setUtmCampaign(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: 11 }}>Content (utm_content)</label>
                  <input
                    type="text"
                    className="form-input"
                    style={{ padding: '8px 12px', fontSize: 13 }}
                    placeholder="e.g. hero_cta, textlink"
                    value={utmContent}
                    onChange={(e) => setUtmContent(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={applyUtmParameters}
                  disabled={!url.trim()}
                  className="btn btn-primary btn-sm"
                >
                  <Check size={14} />
                  <span>Apply UTM to URL</span>
                </button>
              </div>
            </div>
          )}

          {/* Advanced Collapsible Drawer */}
          {showAdvanced && (
            <div className="animate-fade-in" style={{
              marginTop: 18,
              padding: '20px',
              background: 'rgba(7, 9, 19, 0.6)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 16,
            }}>
              {/* Custom Alias */}
              <div>
                <label className="form-label">Custom Alias (Back-half)</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <span style={{
                    position: 'absolute',
                    left: 12,
                    color: 'var(--accent-secondary)',
                    fontSize: 13,
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 600,
                    pointerEvents: 'none'
                  }}>
                    /r/
                  </span>
                  <input
                    type="text"
                    className="form-input"
                    style={{ paddingLeft: 36, fontFamily: 'var(--font-mono)', fontSize: 14 }}
                    placeholder="e.g. spring-sale-2026"
                    value={customAlias}
                    onChange={(e) => setCustomAlias(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                  />
                </div>
              </div>

              {/* Custom Title */}
              <div>
                <label className="form-label">Link Title (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Product Hunt Launch Link"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              {/* Expiration Preset */}
              <div>
                <label className="form-label">Expiration Policy</label>
                <select
                  className="form-input"
                  style={{ cursor: 'pointer' }}
                  value={expiryPreset}
                  onChange={(e) => setExpiryPreset(e.target.value)}
                >
                  <option value="never">Never Expire (Permanent)</option>
                  <option value="24h">Expires in 24 Hours</option>
                  <option value="7d">Expires in 7 Days</option>
                  <option value="30d">Expires in 30 Days</option>
                </select>
              </div>

              {/* Tags */}
              <div>
                <label className="form-label">Categorization Tags</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                  {tags.map((t) => (
                    <span key={t} className="badge badge-indigo" style={{ padding: '4px 8px', fontSize: 12 }}>
                      #{t}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(t)}
                        style={{ background: 'transparent', border: 'none', color: '#fda4af', cursor: 'pointer', marginLeft: 4 }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Type tag and press Enter..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                />
              </div>
            </div>
          )}
        </form>
      )}

      {/* BULK SHORTENER FORM */}
      {mode === 'bulk' && (
        <form onSubmit={handleBulkSubmit} className="animate-fade-in">
          <div style={{ marginBottom: 14 }}>
            <label className="form-label">Paste URLs (One per line, up to 50 links)</label>
            <textarea
              className="form-input"
              rows={5}
              style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}
              placeholder={`https://example.com/page1\nhttps://example.com/page2 | my-custom-alias | Page 2 Title\nhttps://github.com/project`}
              value={bulkUrls}
              onChange={(e) => setBulkUrls(e.target.value)}
              required
            />
            <span style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4, display: 'block' }}>
              💡 Optional format: <code>URL | custom_alias | Title</code>
            </span>
          </div>

          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ flex: '1 1 240px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Comma-separated tags (e.g. marketing, launch, 2026)..."
                value={bulkTags}
                onChange={(e) => setBulkTags(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !bulkUrls.trim()}
              className="btn btn-primary"
              style={{ padding: '12px 28px' }}
            >
              {isLoading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Processing Batch...</span>
                </>
              ) : (
                <>
                  <Layers size={16} />
                  <span>Shorten All Links</span>
                </>
              )}
            </button>
          </div>

          {/* Bulk Results Table */}
          {bulkResults && (
            <div className="animate-fade-in" style={{
              marginTop: 24,
              padding: 20,
              background: 'rgba(13, 18, 36, 0.8)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>
                  Batch Shortening Summary
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span className="badge badge-emerald">Success: {bulkResults.total_success}</span>
                  {bulkResults.total_failed > 0 && (
                    <span className="badge badge-rose">Failed: {bulkResults.total_failed}</span>
                  )}
                </div>
              </div>

              <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {bulkResults.results.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '8px 12px',
                      background: item.success ? 'rgba(16, 185, 129, 0.08)' : 'rgba(244, 63, 94, 0.08)',
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: 13,
                    }}
                  >
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                      {item.success ? (
                        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-secondary)', fontWeight: 600 }}>
                          {item.short_url}
                        </span>
                      ) : (
                        <span style={{ color: '#fb7185' }}>❌ {item.original_url} ({item.error})</span>
                      )}
                    </div>
                    {item.success && (
                      <button
                        type="button"
                        onClick={() => handleCopy(item.short_url)}
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '4px 8px', fontSize: 12 }}
                      >
                        <Copy size={12} />
                        <span>Copy</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </form>
      )}

      {/* Success Notification Banner for Single Mode */}
      {createdLink && mode === 'single' && (
        <div className="animate-fade-in" style={{
          marginTop: 24,
          padding: '18px 24px',
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10b981'
            }}>
              <Check size={22} strokeWidth={3} />
            </div>
            <div>
              <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6ee7b7', fontWeight: 700 }}>
                Link Shortened Successfully!
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                {createdLink.short_url}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={() => handleCopy(createdLink.short_url)}
              className="btn btn-secondary btn-sm"
              style={{ background: copied ? 'rgba(16, 185, 129, 0.2)' : undefined }}
            >
              {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
              <span>{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenQR && onOpenQR(createdLink)}
              className="btn btn-secondary btn-sm"
              title="View QR Code"
            >
              <QrCode size={14} />
              <span>QR Code</span>
            </button>

            <a
              href={createdLink.short_url}
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary btn-sm"
              title="Test Redirect in new tab"
            >
              <ExternalLink size={14} />
              <span>Visit Link</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
