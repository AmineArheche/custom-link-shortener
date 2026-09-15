import React, { useState } from 'react';
import { Link2, Sparkles, ChevronDown, ChevronUp, Copy, Check, QrCode, ExternalLink, ArrowRight, Tag, Clock, Globe } from 'lucide-react';
import confetti from 'canvas-confetti';
import { createShortLink } from '../services/api';
import { copyTextToClipboard } from '../utils/helpers';

export default function LinkCreator({ onLinkCreated, onOpenQR, onSelectLinkAnalytics }) {
  const [url, setUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [title, setTitle] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState([]);
  const [expiryPreset, setExpiryPreset] = useState('never');
  const [showAdvanced, setShowAdvanced] = useState(false);
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

  const handleSubmit = async (e) => {
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
      onLinkCreated && onLinkCreated(result);

      // Trigger celebratory confetti effect
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981'],
        });
      } catch (err) {
        // silent fallback
      }

      // Reset form
      setUrl('');
      setCustomAlias('');
      setTitle('');
      setTags([]);
      setTagInput('');
    } catch (err) {
      setError(err.message || 'Failed to create short link');
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
        width: 180,
        height: 180,
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ marginBottom: 22 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Sparkles size={22} color="var(--accent-secondary)" />
          <span>Shorten Any Destination URL</span>
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
          Generate ultra-clean short URLs with custom branding, instant redirects, and visitor intelligence.
        </p>
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
        }}>
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
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
              <span>Shortening...</span>
            ) : (
              <>
                <span>Shorten URL</span>
                <ArrowRight size={17} />
              </>
            )}
          </button>
        </div>

        {/* Advanced Settings Toggle */}
        <div style={{ marginTop: 16 }}>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="btn btn-ghost btn-sm"
            style={{ padding: '6px 10px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <span>{showAdvanced ? 'Hide Advanced Options' : 'Custom Alias, Expiration & Tags'}</span>
            {showAdvanced ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>

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

      {/* Success Notification Banner */}
      {createdLink && (
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
