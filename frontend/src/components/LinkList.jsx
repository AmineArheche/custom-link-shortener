import React, { useState, useMemo } from 'react';
import { 
  Search, Copy, Check, QrCode, BarChart3, ExternalLink, 
  Trash2, Power, Download, Clock, AlertTriangle, X, Filter, 
  ArrowUpDown, LayoutGrid, List, Tag, Globe, CheckSquare, 
  Square, Edit3, Share2, Sparkles, SlidersHorizontal, RefreshCw,
  TrendingUp, Activity, CheckCircle2, AlertCircle, ChevronLeft, ChevronRight,
  MousePointerClick, Calendar, Zap, Layers, Lock, ShieldAlert
} from 'lucide-react';
import { copyTextToClipboard, truncateUrl, formatDate, timeAgo } from '../utils/helpers';
import { updateShortLink, deleteShortLink, downloadLinksCsv, cleanupExpiredLinks } from '../services/api';

export default function LinkList({ links, onRefresh, onSelectAnalytics, onOpenQR }) {
  // Filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'disabled' | 'expired'
  const [sortBy, setSortBy] = useState('created_desc'); // 'created_desc' | 'created_asc' | 'clicks_desc' | 'clicks_asc' | 'title_asc' | 'title_desc'
  
  // View preferences
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  // Selection & Actions
  const [selectedIds, setSelectedIds] = useState([]);
  const [copiedId, setCopiedId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [isCleaningExpired, setIsCleaningExpired] = useState(false);
  
  // Quick Edit Modal state
  const [editingLink, setEditingLink] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editTags, setEditTags] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const now = new Date();

  // Extract all unique tags
  const allTags = useMemo(() => {
    return Array.from(new Set(links.flatMap((link) => link.tags || []))).sort();
  }, [links]);

  // Max clicks count for relative percentage calculation
  const maxClicks = useMemo(() => {
    return Math.max(1, ...links.map((l) => l.clicks_count || 0));
  }, [links]);

  // Filter links
  const filteredLinks = useMemo(() => {
    return links.filter((link) => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch = !q ||
        link.short_code.toLowerCase().includes(q) ||
        link.original_url.toLowerCase().includes(q) ||
        (link.title && link.title.toLowerCase().includes(q)) ||
        (link.tags && link.tags.some((t) => t.toLowerCase().includes(q)));

      const matchesTag =
        selectedTag === 'all' || (link.tags && link.tags.includes(selectedTag));

      const isExpired = link.expires_at && new Date(link.expires_at) <= now;
      let matchesStatus = true;
      if (statusFilter === 'active') matchesStatus = link.is_active && !isExpired;
      else if (statusFilter === 'disabled') matchesStatus = !link.is_active;
      else if (statusFilter === 'expired') matchesStatus = isExpired;

      return matchesSearch && matchesTag && matchesStatus;
    });
  }, [links, searchTerm, selectedTag, statusFilter, now]);

  // Sort links
  const sortedLinks = useMemo(() => {
    return [...filteredLinks].sort((a, b) => {
      if (sortBy === 'created_asc') {
        return new Date(a.created_at || 0) - new Date(b.created_at || 0);
      }
      if (sortBy === 'clicks_desc') {
        return (b.clicks_count || 0) - (a.clicks_count || 0);
      }
      if (sortBy === 'clicks_asc') {
        return (a.clicks_count || 0) - (b.clicks_count || 0);
      }
      if (sortBy === 'title_asc') {
        const titleA = (a.title || a.short_code).toLowerCase();
        const titleB = (b.title || b.short_code).toLowerCase();
        return titleA.localeCompare(titleB);
      }
      if (sortBy === 'title_desc') {
        const titleA = (a.title || a.short_code).toLowerCase();
        const titleB = (b.title || b.short_code).toLowerCase();
        return titleB.localeCompare(titleA);
      }
      // Default: created_desc
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });
  }, [filteredLinks, sortBy]);

  // Pagination calculation
  const totalPages = Math.ceil(sortedLinks.length / pageSize) || 1;
  const paginatedLinks = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedLinks.slice(start, start + pageSize);
  }, [sortedLinks, currentPage, pageSize]);

  // Summary Metrics for Active View
  const stats = useMemo(() => {
    const totalClicks = sortedLinks.reduce((acc, curr) => acc + (curr.clicks_count || 0), 0);
    const activeCount = sortedLinks.filter((l) => l.is_active && (!l.expires_at || new Date(l.expires_at) > now)).length;
    const expiredCount = sortedLinks.filter((l) => l.expires_at && new Date(l.expires_at) <= now).length;
    const disabledCount = sortedLinks.filter((l) => !l.is_active).length;
    return { totalClicks, activeCount, expiredCount, disabledCount };
  }, [sortedLinks, now]);

  // Handlers
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
    if (!window.confirm('Are you sure you want to delete this short link and all associated telemetry records?')) {
      return;
    }
    setDeletingId(id);
    try {
      await deleteShortLink(id);
      setSelectedIds((prev) => prev.filter((i) => i !== id));
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

  // Selection handlers
  const handleSelectAllOnPage = () => {
    const pageIds = paginatedLinks.map((l) => l.id);
    const allSelected = pageIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleToggleSelectId = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleCopySelectedUrls = () => {
    const selectedUrls = links
      .filter((l) => selectedIds.includes(l.id))
      .map((l) => l.short_url)
      .join('\n');
    if (selectedUrls) {
      copyTextToClipboard(selectedUrls);
      alert(`Copied ${selectedIds.length} link URLs to clipboard!`);
    }
  };

  const handleDeleteSelected = async () => {
    if (!window.confirm(`Permanently delete ${selectedIds.length} selected links?`)) return;
    try {
      for (const id of selectedIds) {
        await deleteShortLink(id);
      }
      setSelectedIds([]);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert('Error deleting some links: ' + err.message);
    }
  };

  // Quick edit modal handler
  const handleOpenEdit = (link) => {
    setEditingLink(link);
    setEditTitle(link.title || '');
    setEditTags((link.tags || []).join(', '));
  };

  const handleSaveEdit = async () => {
    if (!editingLink) return;
    setIsSavingEdit(true);
    try {
      const parsedTags = editTags.split(',').map((t) => t.trim()).filter(Boolean);
      await updateShortLink(editingLink.id, {
        title: editTitle.trim() || undefined,
        tags: parsedTags,
      });
      setEditingLink(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Domain extraction for favicon badge
  const getDomainName = (rawUrl) => {
    try {
      const u = new URL(rawUrl.startsWith('http') ? rawUrl : 'https://' + rawUrl);
      return u.hostname.replace(/^www\./, '');
    } catch {
      return 'web';
    }
  };

  return (
    <div className="glass-panel" style={{
      padding: '30px 34px',
      position: 'relative',
      borderRadius: 'var(--radius-xl)',
      background: 'linear-gradient(180deg, rgba(16, 23, 42, 0.94) 0%, rgba(9, 14, 28, 0.98) 100%)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '0 20px 50px -15px rgba(0, 0, 0, 0.7)',
    }}>
      {/* Top Subtle Luminous Accent Line */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        background: 'linear-gradient(90deg, #8b5cf6 0%, #06b6d4 50%, #10b981 100%)',
      }} />

      {/* Header Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 18,
        marginBottom: 24,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(6, 182, 212, 0.3) 100%)',
              border: '1px solid rgba(139, 92, 246, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#c084fc',
              boxShadow: '0 0 15px rgba(139, 92, 246, 0.3)',
            }}>
              <Layers size={18} />
            </div>
            <h3 style={{
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: '-0.025em',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}>
              <span>Shortened Links Registry</span>
              <span className="badge badge-indigo" style={{ fontSize: 12.5, padding: '3px 10px' }}>
                {filteredLinks.length} {filteredLinks.length === 1 ? 'Link' : 'Links'}
              </span>
            </h3>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 13.5, marginTop: 5 }}>
            Central link dispatching hub with real-time routing management, telemetry drilldowns, and batch operations.
          </p>
        </div>

        {/* Global Action Controls */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* View Mode Toggle */}
          <div style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.05)',
            padding: 3,
            borderRadius: 10,
            border: '1px solid var(--border-subtle)',
          }}>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className="btn btn-sm"
              style={{
                padding: '6px 10px',
                background: viewMode === 'grid' ? 'var(--gradient-primary)' : 'transparent',
                color: viewMode === 'grid' ? '#fff' : 'var(--text-muted)',
                border: 'none',
                borderRadius: 7,
              }}
              title="Card Grid View"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className="btn btn-sm"
              style={{
                padding: '6px 10px',
                background: viewMode === 'table' ? 'var(--gradient-primary)' : 'transparent',
                color: viewMode === 'table' ? '#fff' : 'var(--text-muted)',
                border: 'none',
                borderRadius: 7,
              }}
              title="Dense Table View"
            >
              <List size={15} />
            </button>
          </div>

          <button
            type="button"
            onClick={downloadLinksCsv}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: 13, gap: 6 }}
            title="Download full CSV export of link database"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handleCleanupExpired}
            disabled={isCleaningExpired || stats.expiredCount === 0}
            className="btn btn-ghost btn-sm"
            style={{
              fontSize: 13,
              gap: 6,
              color: stats.expiredCount > 0 ? '#fb7185' : 'var(--text-dim)',
              background: stats.expiredCount > 0 ? 'rgba(244, 63, 94, 0.1)' : 'transparent',
              borderColor: stats.expiredCount > 0 ? 'rgba(244, 63, 94, 0.3)' : 'transparent',
            }}
            title="Deactivate past expiration links"
          >
            <Clock size={14} />
            <span>Clean Expired ({stats.expiredCount})</span>
          </button>
        </div>
      </div>

      {/* Metrics Ribbon */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: 12,
        marginBottom: 22,
      }}>
        <div style={{
          background: 'rgba(11, 17, 32, 0.7)',
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <div style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            background: 'rgba(99, 102, 241, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#a5b4fc',
          }}>
            <MousePointerClick size={16} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>
              Filtered Clicks
            </div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-mono)' }}>
              {stats.totalClicks.toLocaleString()}
            </div>
          </div>
        </div>

        <div style={{
          background: 'rgba(11, 17, 32, 0.7)',
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <div style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            background: 'rgba(16, 185, 129, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6ee7b7',
          }}>
            <Activity size={16} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>
              Active Routing
            </div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#10b981', fontFamily: 'var(--font-mono)' }}>
              {stats.activeCount} <span style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 500 }}>online</span>
            </div>
          </div>
        </div>

        <div style={{
          background: 'rgba(11, 17, 32, 0.7)',
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <div style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            background: 'rgba(245, 158, 11, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fcd34d',
          }}>
            <Power size={16} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>
              Deactivated
            </div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#f59e0b', fontFamily: 'var(--font-mono)' }}>
              {stats.disabledCount}
            </div>
          </div>
        </div>

        <div style={{
          background: 'rgba(11, 17, 32, 0.7)',
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <div style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            background: 'rgba(244, 63, 94, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fda4af',
          }}>
            <Clock size={16} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>
              Expired
            </div>
            <div style={{ fontSize: 17, fontWeight: 800, color: stats.expiredCount > 0 ? '#f43f5e' : '#fff', fontFamily: 'var(--font-mono)' }}>
              {stats.expiredCount}
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div style={{
        background: 'rgba(11, 17, 32, 0.85)',
        padding: '16px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        marginBottom: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}>
        {/* Row 1: Search, Status Tabs, Sorting */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 12,
          alignItems: 'center',
        }}>
          {/* Search Input */}
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: 38, paddingRight: searchTerm ? 32 : 12, fontSize: 13.5, height: 42 }}
              placeholder="Search slug, destination, title or #tag..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setCurrentPage(1);
                }}
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

          {/* Status Filter Selector */}
          <div style={{ position: 'relative' }}>
            <select
              className="form-input"
              style={{ fontSize: 13, height: 42, cursor: 'pointer' }}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">⚡ All Statuses</option>
              <option value="active">🟢 Active Only</option>
              <option value="disabled">🟡 Deactivated Only</option>
              <option value="expired">🔴 Expired Only</option>
            </select>
          </div>

          {/* Sort Dropdown */}
          <div style={{ position: 'relative' }}>
            <select
              className="form-input"
              style={{ fontSize: 13, height: 42, cursor: 'pointer' }}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="created_desc">⏱️ Date: Newest First</option>
              <option value="created_asc">⏱️ Date: Oldest First</option>
              <option value="clicks_desc">🔥 Popularity: Most Clicks</option>
              <option value="clicks_asc">❄️ Popularity: Fewest Clicks</option>
              <option value="title_asc">🔤 Title: A to Z</option>
              <option value="title_desc">🔤 Title: Z to A</option>
            </select>
          </div>
        </div>

        {/* Row 2: Tag Filter Pills */}
        {allTags.length > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            flexWrap: 'wrap',
            paddingTop: 8,
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          }}>
            <span style={{ fontSize: 12, color: 'var(--text-dim)', fontWeight: 600, marginRight: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Tag size={13} />
              <span>Tags:</span>
            </span>

            <button
              type="button"
              onClick={() => {
                setSelectedTag('all');
                setCurrentPage(1);
              }}
              className="btn btn-sm"
              style={{
                padding: '4px 10px',
                fontSize: 11.5,
                background: selectedTag === 'all' ? 'var(--gradient-primary)' : 'rgba(255, 255, 255, 0.05)',
                color: selectedTag === 'all' ? '#fff' : 'var(--text-muted)',
                border: '1px solid',
                borderColor: selectedTag === 'all' ? 'rgba(255, 255, 255, 0.2)' : 'var(--border-subtle)',
                borderRadius: 20,
              }}
            >
              All Tags
            </button>

            {allTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  setSelectedTag(selectedTag === tag ? 'all' : tag);
                  setCurrentPage(1);
                }}
                className="btn btn-sm"
                style={{
                  padding: '4px 10px',
                  fontSize: 11.5,
                  background: selectedTag === tag ? 'rgba(168, 85, 247, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                  color: selectedTag === tag ? '#d8b4fe' : 'var(--text-muted)',
                  border: '1px solid',
                  borderColor: selectedTag === tag ? 'rgba(168, 85, 247, 0.5)' : 'var(--border-subtle)',
                  borderRadius: 20,
                }}
              >
                #{tag}
              </button>
            ))}

            {(selectedTag !== 'all' || statusFilter !== 'all' || searchTerm) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedTag('all');
                  setStatusFilter('all');
                  setSearchTerm('');
                  setCurrentPage(1);
                }}
                className="btn btn-ghost btn-sm"
                style={{ padding: '3px 8px', fontSize: 11, color: 'var(--text-dim)', marginLeft: 'auto' }}
              >
                Reset Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Multi-Select Floating Action Bar */}
      {selectedIds.length > 0 && (
        <div className="animate-fade-in" style={{
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.45)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 18px',
          marginBottom: 18,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          boxShadow: '0 8px 24px rgba(99, 102, 241, 0.2)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="badge badge-indigo" style={{ fontSize: 12 }}>
              {selectedIds.length} Selected
            </span>
            <span style={{ fontSize: 13, color: '#e2e8f0' }}>
              Perform bulk operations on selected links:
            </span>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleCopySelectedUrls}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: 12 }}
            >
              <Copy size={13} />
              <span>Copy Selected URLs</span>
            </button>

            <button
              type="button"
              onClick={handleDeleteSelected}
              className="btn btn-danger btn-sm"
              style={{ fontSize: 12 }}
            >
              <Trash2 size={13} />
              <span>Delete Selected</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="btn btn-ghost btn-sm"
              style={{ fontSize: 12 }}
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* NO RESULTS EMPTY STATE */}
      {sortedLinks.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: 'var(--text-muted)',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: 'var(--radius-lg)',
          border: '1px dashed var(--border-subtle)',
        }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.04)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            color: 'var(--text-dim)',
          }}>
            <AlertTriangle size={28} />
          </div>
          <h4 style={{ fontSize: 17, fontWeight: 700, color: '#fff' }}>No shortened links match your criteria</h4>
          <p style={{ fontSize: 13.5, color: 'var(--text-dim)', marginTop: 6, maxWidth: 440, margin: '6px auto 18px' }}>
            Try clearing your search query, switching the status filter, or generating a new short link.
          </p>
          {(searchTerm || selectedTag !== 'all' || statusFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedTag('all');
                setStatusFilter('all');
                setCurrentPage(1);
              }}
              className="btn btn-secondary btn-sm"
            >
              Clear All Filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* ========================================================= */}
          {/* VIEW MODE 1: GRID CARDS VIEW                             */}
          {/* ========================================================= */}
          {viewMode === 'grid' && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
              gap: 16,
            }}>
              {paginatedLinks.map((link) => {
                const isExpired = link.expires_at && new Date(link.expires_at) <= now;
                const isSelected = selectedIds.includes(link.id);
                const clickPercentage = Math.round(((link.clicks_count || 0) / maxClicks) * 100);
                const domain = getDomainName(link.original_url);

                return (
                  <div
                    key={link.id}
                    className="glass-card-interactive"
                    style={{
                      background: isSelected
                        ? 'linear-gradient(180deg, rgba(99, 102, 241, 0.12) 0%, rgba(15, 23, 42, 0.9) 100%)'
                        : 'rgba(11, 17, 32, 0.82)',
                      border: '1px solid',
                      borderColor: isSelected
                        ? 'rgba(99, 102, 241, 0.5)'
                        : 'var(--border-subtle)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '20px 22px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: 16,
                      position: 'relative',
                      opacity: link.is_active && !isExpired ? 1 : 0.65,
                      boxShadow: isSelected ? '0 8px 30px rgba(99, 102, 241, 0.2)' : undefined,
                    }}
                  >
                    {/* Card Top: Checkbox, Title & Status */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                          <button
                            type="button"
                            onClick={() => handleToggleSelectId(link.id)}
                            style={{ background: 'transparent', border: 'none', color: isSelected ? '#a5b4fc' : 'var(--text-dim)', cursor: 'pointer', padding: 0 }}
                          >
                            {isSelected ? <CheckSquare size={17} /> : <Square size={17} />}
                          </button>

                          <h4 style={{
                            fontSize: 16,
                            fontWeight: 700,
                            color: '#fff',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>
                            {link.title || link.short_code}
                          </h4>
                        </div>

                        {/* Status Badge */}
                        {!link.is_active ? (
                          <span className="badge badge-amber" style={{ fontSize: 11 }}>
                            Deactivated
                          </span>
                        ) : isExpired ? (
                          <span className="badge badge-rose" style={{ fontSize: 11 }}>
                            Expired
                          </span>
                        ) : (
                          <span className="badge badge-emerald" style={{ fontSize: 11 }}>
                            Active
                          </span>
                        )}
                      </div>

                      {/* Short Link Display Pill */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'rgba(99, 102, 241, 0.08)',
                        border: '1px solid rgba(99, 102, 241, 0.25)',
                        borderRadius: 8,
                        padding: '6px 10px',
                        marginBottom: 10,
                      }}>
                        <span style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 13,
                          fontWeight: 700,
                          color: '#c7d2fe',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {link.short_url}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleCopy(link.id, link.short_url)}
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '3px 6px', color: copiedId === link.id ? '#10b981' : 'var(--text-muted)' }}
                          title="Copy link"
                        >
                          {copiedId === link.id ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                        </button>
                      </div>

                      {/* Destination URL & Domain badge */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 10 }}>
                        <span className="badge badge-cyan" style={{ fontSize: 10, padding: '1px 6px' }}>
                          {domain}
                        </span>
                        <a
                          href={link.original_url}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            color: 'var(--text-dim)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            maxWidth: '75%',
                          }}
                          title={link.original_url}
                        >
                          <span>{truncateUrl(link.original_url, 38)}</span>
                          <ExternalLink size={11} />
                        </a>
                      </div>

                      {/* Tags */}
                      {link.tags && link.tags.length > 0 && (
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 12 }}>
                          {link.tags.map((t) => (
                            <span key={t} className="badge badge-purple" style={{ fontSize: 10.5, padding: '2px 7px' }}>
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Click Activity Velocity Bar */}
                      <div style={{ marginBottom: 4 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'var(--text-dim)', marginBottom: 4 }}>
                          <span>Engagement Share</span>
                          <strong style={{ color: '#fff', fontFamily: 'var(--font-mono)' }}>
                            {link.clicks_count.toLocaleString()} Clicks
                          </strong>
                        </div>
                        <div style={{ height: 5, background: 'rgba(255, 255, 255, 0.05)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            width: `${Math.max(5, clickPercentage)}%`,
                            background: 'linear-gradient(90deg, #6366f1, #06b6d4)',
                            borderRadius: 3,
                          }} />
                        </div>
                      </div>
                    </div>

                    {/* Card Footer: Metadata & Actions */}
                    <div style={{
                      borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                      paddingTop: 12,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 10,
                    }}>
                      <div style={{ fontSize: 11.5, color: 'var(--text-dim)' }}>
                        <span>Created {timeAgo(link.created_at)}</span>
                        {link.expires_at && (
                          <div style={{ color: isExpired ? '#fb7185' : '#fcd34d', fontSize: 11 }}>
                            {isExpired ? 'Expired' : 'Expires'} {formatDate(link.expires_at)}
                          </div>
                        )}
                      </div>

                      {/* Action Icon Group */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button
                          type="button"
                          onClick={() => onSelectAnalytics && onSelectAnalytics(link.short_code)}
                          className="btn btn-primary btn-sm"
                          style={{ padding: '5px 10px', fontSize: 12 }}
                          title="Open detailed telemetry analytics"
                        >
                          <BarChart3 size={13} />
                          <span>Stats</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onOpenQR && onOpenQR(link)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '5px 8px' }}
                          title="View vector QR code"
                        >
                          <QrCode size={13} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEdit(link)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '5px 8px' }}
                          title="Quick edit title & tags"
                        >
                          <Edit3 size={13} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleActive(link)}
                          className="btn btn-ghost btn-sm"
                          style={{
                            padding: '5px 8px',
                            color: link.is_active ? '#10b981' : 'var(--text-dim)',
                          }}
                          title={link.is_active ? 'Deactivate link' : 'Activate link'}
                        >
                          <Power size={13} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(link.id)}
                          disabled={deletingId === link.id}
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '5px 8px', color: '#fb7185' }}
                          title="Delete short link"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ========================================================= */}
          {/* VIEW MODE 2: DENSE ENTERPRISE TABLE VIEW                  */}
          {/* ========================================================= */}
          {viewMode === 'table' && (
            <div style={{
              overflowX: 'auto',
              background: 'rgba(11, 17, 32, 0.8)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13.5 }}>
                <thead>
                  <tr style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    color: 'var(--text-muted)',
                    fontSize: 12,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}>
                    <th style={{ padding: '14px 16px', width: 40 }}>
                      <button
                        type="button"
                        onClick={handleSelectAllOnPage}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
                      >
                        {paginatedLinks.length > 0 && paginatedLinks.every((l) => selectedIds.includes(l.id)) ? (
                          <CheckSquare size={16} />
                        ) : (
                          <Square size={16} />
                        )}
                      </button>
                    </th>
                    <th style={{ padding: '14px 16px' }}>Link & Title</th>
                    <th style={{ padding: '14px 16px' }}>Target Destination</th>
                    <th style={{ padding: '14px 16px' }}>Status</th>
                    <th style={{ padding: '14px 16px', textAlign: 'right' }}>Clicks</th>
                    <th style={{ padding: '14px 16px' }}>Created</th>
                    <th style={{ padding: '14px 16px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedLinks.map((link) => {
                    const isExpired = link.expires_at && new Date(link.expires_at) <= now;
                    const isSelected = selectedIds.includes(link.id);

                    return (
                      <tr
                        key={link.id}
                        style={{
                          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                          background: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                          transition: 'background 0.15s ease',
                        }}
                      >
                        {/* Selection checkbox */}
                        <td style={{ padding: '14px 16px' }}>
                          <button
                            type="button"
                            onClick={() => handleToggleSelectId(link.id)}
                            style={{ background: 'transparent', border: 'none', color: isSelected ? '#a5b4fc' : 'var(--text-dim)', cursor: 'pointer' }}
                          >
                            {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                          </button>
                        </td>

                        {/* Title & Short URL */}
                        <td style={{ padding: '14px 16px', minWidth: 220 }}>
                          <div style={{ fontWeight: 700, color: '#fff', marginBottom: 3 }}>
                            {link.title || link.short_code}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-secondary)', fontSize: 12.5 }}>
                              {link.short_url}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(link.id, link.short_url)}
                              className="btn btn-ghost btn-sm"
                              style={{ padding: '2px 4px', color: copiedId === link.id ? '#10b981' : 'var(--text-dim)' }}
                              title="Copy short link"
                            >
                              {copiedId === link.id ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                            </button>
                          </div>
                          {link.tags && link.tags.length > 0 && (
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                              {link.tags.map((t) => (
                                <span key={t} className="badge badge-purple" style={{ fontSize: 9.5, padding: '1px 5px' }}>
                                  #{t}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>

                        {/* Target Destination */}
                        <td style={{ padding: '14px 16px', maxWidth: 260 }}>
                          <a
                            href={link.original_url}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              color: 'var(--text-muted)',
                              fontSize: 12.5,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: 240,
                            }}
                            title={link.original_url}
                          >
                            <span>{truncateUrl(link.original_url, 35)}</span>
                            <ExternalLink size={12} />
                          </a>
                        </td>

                        {/* Status */}
                        <td style={{ padding: '14px 16px' }}>
                          {!link.is_active ? (
                            <span className="badge badge-amber" style={{ fontSize: 11 }}>Disabled</span>
                          ) : isExpired ? (
                            <span className="badge badge-rose" style={{ fontSize: 11 }}>Expired</span>
                          ) : (
                            <span className="badge badge-emerald" style={{ fontSize: 11 }}>Active</span>
                          )}
                        </td>

                        {/* Clicks */}
                        <td style={{ padding: '14px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#67e8f9' }}>
                          {link.clicks_count.toLocaleString()}
                        </td>

                        {/* Created Date */}
                        <td style={{ padding: '14px 16px', fontSize: 12, color: 'var(--text-dim)' }}>
                          {timeAgo(link.created_at)}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                            <button
                              type="button"
                              onClick={() => onSelectAnalytics && onSelectAnalytics(link.short_code)}
                              className="btn btn-primary btn-sm"
                              style={{ padding: '4px 8px', fontSize: 12 }}
                              title="Analytics"
                            >
                              <BarChart3 size={13} />
                            </button>

                            <button
                              type="button"
                              onClick={() => onOpenQR && onOpenQR(link)}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '4px 8px' }}
                              title="QR Code"
                            >
                              <QrCode size={13} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenEdit(link)}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '4px 8px' }}
                              title="Edit"
                            >
                              <Edit3 size={13} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleActive(link)}
                              className="btn btn-ghost btn-sm"
                              style={{ padding: '4px 8px', color: link.is_active ? '#10b981' : 'var(--text-dim)' }}
                              title={link.is_active ? 'Deactivate' : 'Activate'}
                            >
                              <Power size={13} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDelete(link.id)}
                              disabled={deletingId === link.id}
                              className="btn btn-ghost btn-sm"
                              style={{ padding: '4px 8px', color: '#fb7185' }}
                              title="Delete"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ========================================================= */}
          {/* PAGINATION CONTROLS                                       */}
          {/* ========================================================= */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 14,
            marginTop: 24,
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            paddingTop: 18,
          }}>
            <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>
              Showing <strong>{Math.min(sortedLinks.length, (currentPage - 1) * pageSize + 1)}</strong> -{' '}
              <strong>{Math.min(sortedLinks.length, currentPage * pageSize)}</strong> of{' '}
              <strong>{sortedLinks.length}</strong> links
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Page Size Selector */}
              <select
                className="form-input"
                style={{ padding: '4px 8px', fontSize: 12, height: 32, cursor: 'pointer' }}
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={12}>12 per page</option>
                <option value={24}>24 per page</option>
                <option value={48}>48 per page</option>
                <option value={100}>100 per page</option>
              </select>

              {/* Page Navigator Buttons */}
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="btn btn-secondary btn-sm"
                style={{ padding: '5px 10px' }}
              >
                <ChevronLeft size={14} />
                <span>Prev</span>
              </button>

              <span style={{ fontSize: 12.5, color: '#fff', fontWeight: 600, padding: '0 4px' }}>
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="btn btn-secondary btn-sm"
                style={{ padding: '5px 10px' }}
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </>
      )}

      {/* ========================================================= */}
      {/* QUICK EDIT MODAL                                         */}
      {/* ========================================================= */}
      {editingLink && (
        <div className="modal-backdrop" onClick={() => setEditingLink(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'rgba(99, 102, 241, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#818cf8',
                }}>
                  <Edit3 size={18} />
                </div>
                <div>
                  <h4 style={{ fontSize: 17, fontWeight: 800 }}>Quick Edit Short Link</h4>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent-secondary)' }}>
                    {editingLink.short_url}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingLink(null)}
                className="btn btn-ghost btn-sm"
                style={{ padding: 4 }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="form-label">Friendly Link Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Landing Page Promo"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="form-label">Categorization Tags (Comma-separated)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. marketing, social, 2026"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setEditingLink(null)}
                  className="btn btn-ghost btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={isSavingEdit}
                  className="btn btn-primary btn-sm"
                >
                  {isSavingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
