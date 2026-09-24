import React, { useState } from 'react';
import { 
  Search, Copy, Check, QrCode, BarChart3, ExternalLink, 
  Trash2, Power, Download, Clock, AlertTriangle, X, Filter, ArrowUpDown
} from 'lucide-react';
import { copyTextToClipboard, truncateUrl, formatDate, timeAgo } from '../utils/helpers';
import { updateShortLink, deleteShortLink, downloadLinksCsv, cleanupExpiredLinks } from '../services/api';

export default function LinkList({ links, onRefresh, onSelectAnalytics, onOpenQR }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'disabled' | 'expired'
  const [sortBy, setSortBy] = useState('created_desc'); // 'created_desc' | 'created_asc' | 'clicks_desc' | 'title_asc'
  const [copiedId, setCopiedId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [isCleaningExpired, setIsCleaningExpired] = useState(false);

  // Extract all unique tags
  const allTags = Array.from(
    new Set(links.flatMap((link) => link.tags || []))
  );

  const now = new Date();

  // Filter links
  const filteredLinks = links.filter((link) => {
    const matchesSearch =
      link.short_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.original_url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (link.title && link.title.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesTag =
      selectedTag === 'all' || (link.tags && link.tags.includes(selectedTag));

    const isExpired = link.expires_at && new Date(link.expires_at) <= now;
    let matchesStatus = true;
    if (statusFilter === 'active') matchesStatus = link.is_active && !isExpired;
    else if (statusFilter === 'disabled') matchesStatus = !link.is_active;
    else if (statusFilter === 'expired') matchesStatus = isExpired;

    return matchesSearch && matchesTag && matchesStatus;
  });

  // Sort links
  const sortedLinks = [...filteredLinks].sort((a, b) => {
    if (sortBy === 'created_asc') {
      return new Date(a.created_at || 0) - new Date(b.created_at || 0);
    }
    if (sortBy === 'clicks_desc') {
      return (b.clicks_count || 0) - (a.clicks_count || 0);
    }
    if (sortBy === 'title_asc') {
      const titleA = (a.title || a.short_code).toLowerCase();
      const titleB = (b.title || b.short_code).toLowerCase();
      return titleA.localeCompare(titleB);
    }
    // Default created_desc
    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
  });

  const handleCopy = (id, url) => {
    copyTextToClipboard(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleActive = async (link) => {
    try {
      await updateShortLink(link.id, { is_active: !link.is_active });
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this short link and all its telemetry history?')) {
      return;
    }
    setDeletingId(id);
    try {
      await deleteShortLink(id);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleCleanupExpired = async () => {
    if (!window.confirm('Deactivate all links whose expiration timestamp has passed?')) return;
    setIsCleaningExpired(true);
    try {
      const res = await cleanupExpiredLinks();
      alert(res.message);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsCleaningExpired(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '28px 32px' }}>
      {/* Header Controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 22
      }}>
        <div>
          <h3 style={{ fontSize: 22, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>Shortened Links Registry</span>
            <span className="badge badge-indigo" style={{ fontSize: 13, padding: '3px 10px' }}>
              {sortedLinks.length} {sortedLinks.length === 1 ? 'Link' : 'Links'}
            </span>
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
            Manage routing redirects, filter telemetry, and export dataset
          </p>
        </div>

        {/* Global Action Buttons */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={downloadLinksCsv}
            className="btn btn-secondary btn-sm"
            title="Download CSV report of all links"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handleCleanupExpired}
            disabled={isCleaningExpired}
            className="btn btn-ghost btn-sm"
            title="Deactivate past expiration links"
            style={{ color: '#fb7185' }}
          >
            <Clock size={14} />
            <span>Clean Expired</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: 12,
        marginBottom: 18,
      }}>
        {/* Search Input */}
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: 38, paddingRight: searchTerm ? 32 : 12, fontSize: 13 }}
            placeholder="Search alias, URL, or title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              style={{
                position: 'absolute',
                right: 10,
                top: '50%',
                transform: 'translateY(-50%)',
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

        {/* Status Filter */}
        <div style={{ position: 'relative' }}>
          <select
            className="form-input"
            style={{ fontSize: 13, cursor: 'pointer' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="disabled">Disabled Only</option>
            <option value="expired">Expired Only</option>
          </select>
        </div>

        {/* Sort Dropdown */}
        <div style={{ position: 'relative' }}>
          <select
            className="form-input"
            style={{ fontSize: 13, cursor: 'pointer' }}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="created_desc">Newest First</option>
            <option value="created_asc">Oldest First</option>
            <option value="clicks_desc">Most Clicks First</option>
            <option value="title_asc">Title (A to Z)</option>
          </select>
        </div>
      </div>

      {/* Tag Filter Pills */}
      {allTags.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
          <button
            onClick={() => setSelectedTag('all')}
            className={`badge ${selectedTag === 'all' ? 'badge-indigo' : 'btn-secondary'}`}
            style={{ cursor: 'pointer', padding: '5px 12px', border: 'none', fontSize: 12 }}
          >
            All Tags
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`badge ${selectedTag === tag ? 'badge-indigo' : 'btn-secondary'}`}
              style={{ cursor: 'pointer', padding: '5px 12px', border: 'none', fontSize: 12 }}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Links List View */}
      {sortedLinks.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '50px 20px',
          color: 'var(--text-muted)',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: 'var(--radius-md)',
          border: '1px dashed var(--border-subtle)'
        }}>
          <AlertTriangle size={36} style={{ opacity: 0.35, margin: '0 auto 12px' }} />
          <p style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>No shortened links match your filters</p>
          <p style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 4 }}>
            Try adjusting your search criteria or create a new link above.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {sortedLinks.map((link) => {
            const isExpired = link.expires_at && new Date(link.expires_at) <= now;
            return (
              <div
                key={link.id}
                className="glass-card-interactive"
                style={{
                  background: 'rgba(11, 17, 32, 0.8)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '18px 22px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 16,
                  opacity: link.is_active && !isExpired ? 1 : 0.65,
                }}
              >
                {/* Left Info */}
                <div style={{ flex: '1 1 320px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                    <span style={{
                      fontFamily: 'var(--font-heading)',
                      fontWeight: 700,
                      fontSize: 16,
                      color: '#fff',
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
                      background: 'rgba(139, 92, 246, 0.12)',
                      border: '1px solid rgba(139, 92, 246, 0.25)',
                      padding: '3px 10px',
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
                        maxWidth: 290,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={link.original_url}
                    >
                      <span>{truncateUrl(link.original_url, 40)}</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>

                  <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 8 }}>
                    Created {timeAgo(link.created_at)}
                    {link.expires_at && ` • Expires ${formatDate(link.expires_at)}`}
                  </div>
                </div>

                {/* Right Metrics & Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  {/* Click Count Badge */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    marginRight: 6,
                    padding: '4px 10px',
                    background: 'rgba(6, 182, 212, 0.08)',
                    borderRadius: 8,
                    border: '1px solid rgba(6, 182, 212, 0.2)',
                  }}>
                    <span style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--accent-cyan)', fontWeight: 700 }}>
                      Clicks
                    </span>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 18,
                      fontWeight: 800,
                      color: '#fff',
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
