const BASE_API = '/api';

export async function fetchOverview() {
  const res = await fetch(`${BASE_API}/analytics/overview`);
  if (!res.ok) throw new Error('Failed to load analytics overview');
  return res.json();
}

export async function fetchLinks({ query = '', tag = '', status_filter = 'all', sort_by = 'created_desc', limit = 50 } = {}) {
  const params = new URLSearchParams();
  if (query) params.append('query', query);
  if (tag) params.append('tag', tag);
  if (status_filter) params.append('status_filter', status_filter);
  if (sort_by) params.append('sort_by', sort_by);
  if (limit) params.append('limit', limit);

  const res = await fetch(`${BASE_API}/links?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch links');
  return res.json();
}

export async function createShortLink(data) {
  const res = await fetch(`${BASE_API}/links`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to create short link');
  }
  return res.json();
}

export async function bulkCreateShortLinks(items) {
  const res = await fetch(`${BASE_API}/links/bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to execute bulk link creation');
  }
  return res.json();
}

export async function updateShortLink(id, data) {
  const res = await fetch(`${BASE_API}/links/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to update link');
  }
  return res.json();
}

export async function deleteShortLink(id) {
  const res = await fetch(`${BASE_API}/links/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete short link');
  return true;
}

export async function cleanupExpiredLinks() {
  const res = await fetch(`${BASE_API}/links/cleanup-expired`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to clean up expired links');
  return res.json();
}

export async function fetchLinkAnalytics(idOrCode) {
  const res = await fetch(`${BASE_API}/analytics/links/${idOrCode}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to fetch link analytics');
  }
  return res.json();
}

export async function simulateTraffic(payload) {
  const res = await fetch(`${BASE_API}/analytics/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to simulate clicks');
  }
  return res.json();
}

export function downloadLinksCsv() {
  window.open(`${BASE_API}/links/export/csv`, '_blank');
}

export function downloadAnalyticsCsv() {
  window.open(`${BASE_API}/analytics/export/csv`, '_blank');
}

export async function checkBackendHealth() {
  try {
    const res = await fetch(`${BASE_API}/health`);
    return res.ok;
  } catch {
    return false;
  }
}

