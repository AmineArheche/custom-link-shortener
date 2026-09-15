import React, { useState } from 'react';
import { 
  Search, Copy, Check, QrCode, BarChart3, ExternalLink, 
  Trash2, Power, Eye, Tag, Calendar, ShieldAlert 
} from 'lucide-react';
import { copyTextToClipboard, truncateUrl, formatDate, timeAgo } from '../utils/helpers';
import { updateShortLink, deleteShortLink } from '../services/api';

export default function LinkList({ links, onRefresh, onSelectAnalytics, onOpenQR }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('all');
  const [copiedId, setCopiedId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Extract all unique tags
  const allTags = Array.from(
    new Set(links.flatMap((link) => link.tags || []))
  );

  const filteredLinks = links.filter((link) => {
    const matchesSearch =
      link.short_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.original_url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (link.title && link.title.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesTag =
      selectedTag === 'all' || (link.tags && link.tags.includes(selectedTag));

    return matchesSearch && matchesTag;
  });

  const handleCopy = (id, url) => {
    copyTextToClipboard(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleActive = async (link) => {
    try {
      await updateShortLink(link.id, { is_active: !link.is_active });
      onRefresh && onRefresh();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this short link and its analytics?')) {
      return;
    }
    setDeletingId(id);
    try {
      await deleteShortLink(id);
      onRefresh && onRefresh();
    } catch (err) {
      alert(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '24px 28px' }}>
      {/* Header Controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 20
      }}>
        <div>
          <h3 style={{ fontSize: 20, fontWeight: 700 }}>
            Active Shortened Links ({filteredLinks.length})
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            Manage redirects, monitor clicks, and inspect real-time traffic
          </p>
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', width: 280 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: 36, paddingRight: 12, paddingTop: 8, paddingBottom: 8, fontSize: 13 }}
            placeholder="Search links or destination..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Tag Filters */}
      {allTags.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
          <button
            onClick={() => setSelectedTag('all')}
            className={`badge ${selectedTag === 'all' ? 'badge-indigo' : 'btn-secondary'}`}
            style={{ cursor: 'pointer', padding: '5px 12px', border: 'none' }}
          >
            All Tags
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`badge ${selectedTag === tag ? 'badge-indigo' : 'btn-secondary'}`}
              style={{ cursor: 'pointer', padding: '5px 12px', border: 'none' }}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Links List */}
      {filteredLinks.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '48px 20px',
          color: 'var(--text-muted)',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: 'var(--radius-md)',
          border: '1px dashed var(--border-subtle)'
        }}>
          <Link2 size={36} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
          <p style={{ fontSize: 15, fontWeight: 500 }}>No shortened links found</p>
          <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>Try changing your search query or create a new link above.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filteredLinks.map((link) => {
            const isExpired = link.expires_at && new Date() > new Date(link.expires_at);
            return (
              <div
                key={link.id}
                style={{
                  background: 'rgba(13, 18, 36, 0.7)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 16,
                  transition: 'border-color 0.2s ease, background 0.2s ease',
                  opacity: link.is_active && !isExpired ? 1 : 0.65
                }}
              >
                {/* Left Info */}
                <div style={{ flex: '1 1 300px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                    <span style={{
                      fontFamily: 'var(--font-heading)',
                      fontWeight: 700,
                      fontSize: 16,
                      color: '#fff'
                    }}>
                      {link.title || link.short_code}
                    </span>

                    {/* Status Badge */}
                    {!link.is_active ? (
                      <span className="badge badge-amber">Disabled</span>
                    ) : isExpired ? (
                      <span className="badge badge-rose">Expired</span>
                    ) : (
                      <span className="badge badge-emerald">Active</span>
                    )}

                    {/* Tags */}
                    {link.tags && link.tags.map((t) => (
                      <span key={t} className="badge badge-indigo" style={{ fontSize: 11 }}>
                        #{t}
                      </span>
                    ))}
                  </div>

                  {/* Short Link & Target */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: 6 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontFamily: 'var(--font-mono)',
                      fontSize: 13,
                      color: 'var(--accent-secondary)',
                      background: 'rgba(139, 92, 246, 0.1)',
                      padding: '3px 8px',
                      borderRadius: 6,
                    }}>
                      <span>{link.short_url}</span>
                    </div>

                    <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>→</span>

                    <a
                      href={link.original_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        color: 'var(--text-muted)',
                        fontSize: 13,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        maxWidth: 260,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                      title={link.original_url}
                    >
                      <span>{truncateUrl(link.original_url, 35)}</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>

                  <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 8 }}>
                    Created {timeAgo(link.created_at)}
                    {link.expires_at && ` • Expires ${formatDate(link.expires_at)}`}
                  </div>
                </div>

                {/* Right Metrics & Quick Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  {/* Click Count Badge */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    marginRight: 8
                  }}>
                    <span style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700 }}>
                      Clicks
                    </span>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 18,
                      fontWeight: 800,
                      color: 'var(--accent-cyan)'
                    }}>
                      {link.clicks_count.toLocaleString()}
                    </span>
                  </div>

                  {/* Copy Button */}
                  <button
                    onClick={() => handleCopy(link.id, link.short_url)}
                    className="btn btn-secondary btn-sm"
                    title="Copy Short URL"
                  >
                    {copiedId === link.id ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                    <span>{copiedId === link.id ? 'Copied' : 'Copy'}</span>
                  </button>

                  {/* Analytics Button */}
                  <button
                    onClick={() => onSelectAnalytics && onSelectAnalytics(link.short_code)}
                    className="btn btn-primary btn-sm"
                    title="Open Detailed Analytics"
                  >
                    <BarChart3 size={14} />
                    <span>Analytics</span>
                  </button>

                  {/* QR Code Button */}
                  <button
                    onClick={() => onOpenQR && onOpenQR(link)}
                    className="btn btn-secondary btn-sm"
                    title="View QR Code"
                  >
                    <QrCode size={14} />
                  </button>

                  {/* Toggle Active Switch */}
                  <button
                    onClick={() => handleToggleActive(link)}
                    className={`btn btn-sm ${link.is_active ? 'btn-secondary' : 'btn-ghost'}`}
                    title={link.is_active ? 'Deactivate Link' : 'Activate Link'}
                    style={{ color: link.is_active ? '#10b981' : 'var(--text-dim)' }}
                  >
                    <Power size={14} />
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDelete(link.id)}
                    disabled={deletingId === link.id}
                    className="btn btn-danger btn-sm"
                    title="Delete Link"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
