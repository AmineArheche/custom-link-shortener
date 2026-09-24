import React, { useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { 
  MousePointerClick, Compass, Laptop, Globe2, 
  TrendingUp, X, Download, BarChart2, Activity,
  Calendar, ArrowUpRight, Share2, Check, Copy,
  Zap, Smartphone, Monitor, Globe, Search, ChevronDown, PieChart
} from 'lucide-react';
import ClicksFeed from './ClicksFeed';
import { downloadAnalyticsCsv } from '../services/api';
import { copyTextToClipboard } from '../utils/helpers';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const COUNTRY_FLAGS = {
  'United States': '🇺🇸',
  'US': '🇺🇸',
  'United Kingdom': '🇬🇧',
  'UK': '🇬🇧',
  'Germany': '🇩🇪',
  'France': '🇫🇷',
  'Canada': '🇨🇦',
  'Japan': '🇯🇵',
  'Morocco': '🇲🇦',
  'Australia': '🇦🇺',
  'Netherlands': '🇳🇱',
  'Brazil': '🇧🇷',
  'India': '🇮🇳',
};

export default function AnalyticsView({
  analyticsData,
  selectedLinkCode,
  onClearSelectedLink,
  allLinks = []
}) {
  const [timeframe, setTimeframe] = useState('7d'); // '24h' | '7d' | '30d' | 'all'
  const [chartType, setChartType] = useState('area'); // 'area' | 'bar' | 'cumulative'
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [linkSearchTerm, setLinkSearchTerm] = useState('');

  if (!analyticsData) {
    return (
      <div className="glass-panel" style={{
        padding: 56,
        textAlign: 'center',
        color: 'var(--text-muted)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
      }}>
        <div className="animate-spin">
          <Activity size={32} color="var(--accent-secondary)" />
        </div>
        <div>
          <h4 style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>Aggregating Real-Time Telemetry</h4>
          <p style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 4 }}>
            Querying click events, device parsing, and geo-distribution logs...
          </p>
        </div>
      </div>
    );
  }

  const {
    total_clicks = 0,
    total_links = 0,
    top_browser = 'N/A',
    top_os = 'N/A',
    top_device = 'N/A',
    top_referrer = 'N/A',
    clicks_timeline = [],
    browsers = [],
    operating_systems = [],
    device_types = [],
    top_referrers = [],
    recent_clicks = [],
    link = null
  } = analyticsData;

  // Process timeline data according to timeframe selection
  const timelineLabels = clicks_timeline.map((p) => p.label);
  const rawTimelineValues = clicks_timeline.map((p) => p.count);

  // Cumulative trajectory
  const cumulativeTimelineValues = useMemo(() => {
    let sum = 0;
    return rawTimelineValues.map((v) => {
      sum += v;
      return sum;
    });
  }, [rawTimelineValues]);

  const activeTimelineValues = chartType === 'cumulative' ? cumulativeTimelineValues : rawTimelineValues;

  // Timeline Chart configuration
  const timelineChartData = {
    labels: timelineLabels.length > 0 ? timelineLabels : ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'],
    datasets: [
      {
        label: chartType === 'cumulative' ? 'Cumulative Growth' : 'Clicks',
        data: activeTimelineValues.length > 0 ? activeTimelineValues : [0, 0, 0, 0, 0, 0, 0],
        borderColor: chartType === 'cumulative' ? '#06b6d4' : '#8b5cf6',
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 280);
          if (chartType === 'cumulative') {
            gradient.addColorStop(0, 'rgba(6, 182, 212, 0.45)');
            gradient.addColorStop(0.7, 'rgba(6, 182, 212, 0.1)');
            gradient.addColorStop(1, 'rgba(6, 182, 212, 0.0)');
          } else {
            gradient.addColorStop(0, 'rgba(139, 92, 246, 0.45)');
            gradient.addColorStop(0.7, 'rgba(99, 102, 241, 0.12)');
            gradient.addColorStop(1, 'rgba(99, 102, 241, 0.0)');
          }
          return gradient;
        },
        fill: true,
        tension: 0.38,
        borderWidth: 2.5,
        pointBackgroundColor: '#06b6d4',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 7,
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(11, 17, 32, 0.95)',
        borderColor: 'rgba(139, 92, 246, 0.4)',
        borderWidth: 1,
        titleColor: '#fff',
        bodyColor: '#a5b4fc',
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
        titleFont: { family: 'Plus Jakarta Sans', weight: '700' },
        bodyFont: { family: 'JetBrains Mono', size: 13 },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.04)' },
        ticks: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans', size: 12 } },
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(255, 255, 255, 0.04)' },
        ticks: { color: '#94a3b8', font: { family: 'JetBrains Mono', size: 12 }, precision: 0 },
      },
    },
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(11, 17, 32, 0.95)',
        borderColor: 'rgba(99, 102, 241, 0.4)',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans', size: 12 } },
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(255, 255, 255, 0.04)' },
        ticks: { color: '#94a3b8', precision: 0, font: { family: 'JetBrains Mono' } },
      },
    },
  };

  // Browser Donut
  const browserColors = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'];
  const browserChartData = {
    labels: browsers.map((b) => b.name),
    datasets: [
      {
        data: browsers.map((b) => b.count),
        backgroundColor: browserColors.slice(0, browsers.length),
        borderWidth: 2,
        borderColor: '#0b1120',
        hoverOffset: 6,
      },
    ],
  };

  // Devices Breakdown
  const deviceChartData = {
    labels: device_types.map((d) => d.name),
    datasets: [
      {
        label: 'Devices',
        data: device_types.map((d) => d.count),
        backgroundColor: ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'],
        borderRadius: 8,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#cbd5e1',
          font: { family: 'Plus Jakarta Sans', size: 12 },
          boxWidth: 12,
          padding: 14,
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderColor: 'rgba(255, 255, 255, 0.12)',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
      },
    },
  };

  // Extract unique locations from recent_clicks
  const countryCounts = useMemo(() => {
    const map = {};
    recent_clicks.forEach((c) => {
      const country = c.country || 'Global / Unknown';
      map[country] = (map[country] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, count]) => ({
        name,
        count,
        percentage: total_clicks > 0 ? Math.round((count / total_clicks) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [recent_clicks, total_clicks]);

  // Copy Summary Intelligence
  const handleCopySummary = () => {
    const summary = `📊 AuraLink Telemetry Report\n• Total Clicks: ${total_clicks}\n• Top Browser: ${top_browser}\n• Top OS: ${top_os}\n• Top Device: ${top_device}\n• Top Channel: ${top_referrer || 'Direct'}\n• Active Links: ${total_links}`;
    copyTextToClipboard(summary);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Header Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h3 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>
              {link ? `Telemetry Intelligence: /r/${link.short_code}` : 'Global Performance & Telemetry Hub'}
            </h3>
            {link && (
              <span className="badge badge-indigo" style={{ fontSize: 12 }}>Single Link</span>
            )}
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
            Multi-dimensional telemetry across browsers, operating systems, devices, channels, and geo-traffic
          </p>
        </div>

        {/* Global Action Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Timeframe Filter Pills */}
          <div style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.05)',
            padding: 3,
            borderRadius: 10,
            border: '1px solid var(--border-subtle)',
          }}>
            {['24h', '7d', '30d', 'all'].map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeframe(tf)}
                className="btn btn-sm"
                style={{
                  padding: '4px 10px',
                  fontSize: 12,
                  background: timeframe === tf ? 'var(--gradient-primary)' : 'transparent',
                  color: timeframe === tf ? '#fff' : 'var(--text-muted)',
                  borderRadius: 7,
                  border: 'none',
                }}
              >
                {tf.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleCopySummary}
            className="btn btn-secondary btn-sm"
            title="Copy snapshot intelligence report"
          >
            {copiedSummary ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
            <span>{copiedSummary ? 'Copied' : 'Share Summary'}</span>
          </button>

          <button
            type="button"
            onClick={downloadAnalyticsCsv}
            className="btn btn-primary btn-sm"
            title="Download full visitor telemetry log in CSV format"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter notification banner if specific link is selected */}
      {link && (
        <div className="glass-panel animate-fade-in" style={{
          padding: '18px 24px',
          background: 'rgba(99, 102, 241, 0.1)',
          border: '1px solid var(--border-glow)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 14,
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="badge badge-indigo">Filtering Link</span>
              <span style={{ fontWeight: 800, fontSize: 17, color: '#fff' }}>
                {link.title || link.short_code}
              </span>
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <span>Target: <strong style={{ color: '#fff' }}>{link.original_url}</strong></span>
              <span>•</span>
              <span>Short Code: <strong style={{ color: 'var(--accent-secondary)' }}>/{link.short_code}</strong></span>
            </div>
          </div>

          <button
            onClick={onClearSelectedLink}
            className="btn btn-secondary btn-sm"
          >
            <X size={14} />
            <span>Show Global Overview</span>
          </button>
        </div>
      )}

      {/* 4 Glowing KPI Metric Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: 16,
      }}>
        {/* Card 1: Total Clicks & Velocity */}
        <div className="glass-panel glass-card-interactive" style={{ padding: '24px 26px', position: 'relative', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
          }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="form-label">Total Clicks</span>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'rgba(99, 102, 241, 0.18)',
              color: '#818cf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(99, 102, 241, 0.3)',
            }}>
              <MousePointerClick size={19} />
            </div>
          </div>
          <div style={{ fontSize: 36, fontWeight: 800, fontFamily: 'var(--font-heading)', color: '#fff', marginTop: 8 }}>
            {total_clicks.toLocaleString()}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--accent-emerald)', marginTop: 4 }}>
            <TrendingUp size={14} />
            <span>Active Click Velocity</span>
          </div>
        </div>

        {/* Card 2: Traffic Channels */}
        <div className="glass-panel glass-card-interactive" style={{ padding: '24px 26px', position: 'relative', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: 'linear-gradient(90deg, #06b6d4, #3b82f6)',
          }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="form-label">Traffic Channels</span>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'rgba(6, 182, 212, 0.18)',
              color: '#22d3ee',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(6, 182, 212, 0.3)',
            }}>
              <Compass size={19} />
            </div>
          </div>
          <div style={{ fontSize: 36, fontWeight: 800, fontFamily: 'var(--font-heading)', color: '#fff', marginTop: 8 }}>
            {top_referrers.length} Sources
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            Top: <strong style={{ color: '#fff' }}>{top_referrer || 'Direct'}</strong>
          </div>
        </div>

        {/* Card 3: Leading Browser Engine */}
        <div className="glass-panel glass-card-interactive" style={{ padding: '24px 26px', position: 'relative', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: 'linear-gradient(90deg, #10b981, #06b6d4)',
          }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="form-label">Leading Browser</span>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'rgba(16, 185, 129, 0.18)',
              color: '#34d399',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(16, 185, 129, 0.3)',
            }}>
              <Globe2 size={19} />
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-heading)', color: '#fff', marginTop: 8 }}>
            {top_browser}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            Operating System: <strong style={{ color: '#fff' }}>{top_os}</strong>
          </div>
        </div>

        {/* Card 4: Primary Device */}
        <div className="glass-panel glass-card-interactive" style={{ padding: '24px 26px', position: 'relative', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: 'linear-gradient(90deg, #f59e0b, #ec4899)',
          }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="form-label">Primary Device</span>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'rgba(245, 158, 11, 0.18)',
              color: '#fbbf24',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(245, 158, 11, 0.3)',
            }}>
              <Laptop size={19} />
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-heading)', color: '#fff', marginTop: 8 }}>
            {top_device}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            {total_links > 0 ? `${total_links} links monitored` : 'Real-time telemetry'}
          </div>
        </div>
      </div>

      {/* Main Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
        {/* Timeline Area & Bar Switcher Chart */}
        <div className="glass-panel" style={{ padding: '26px 30px', gridColumn: 'span 2 / span 2', minWidth: 320 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h4 style={{ fontSize: 18, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                <BarChart2 size={18} color="var(--accent-secondary)" />
                <span>Click Trajectory & Daily Volume</span>
              </h4>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>
                Traffic flow patterns and trajectory velocity over time
              </p>
            </div>

            {/* Chart Type Selector */}
            <div style={{
              display: 'flex',
              background: 'rgba(255, 255, 255, 0.05)',
              padding: 3,
              borderRadius: 8,
              border: '1px solid var(--border-subtle)',
            }}>
              <button
                type="button"
                onClick={() => setChartType('area')}
                className="btn btn-sm"
                style={{
                  padding: '4px 10px',
                  fontSize: 12,
                  background: chartType === 'area' ? 'var(--gradient-primary)' : 'transparent',
                  color: chartType === 'area' ? '#fff' : 'var(--text-muted)',
                  border: 'none',
                  borderRadius: 6,
                }}
              >
                Spline Area
              </button>
              <button
                type="button"
                onClick={() => setChartType('bar')}
                className="btn btn-sm"
                style={{
                  padding: '4px 10px',
                  fontSize: 12,
                  background: chartType === 'bar' ? 'var(--gradient-primary)' : 'transparent',
                  color: chartType === 'bar' ? '#fff' : 'var(--text-muted)',
                  border: 'none',
                  borderRadius: 6,
                }}
              >
                Daily Bars
              </button>
              <button
                type="button"
                onClick={() => setChartType('cumulative')}
                className="btn btn-sm"
                style={{
                  padding: '4px 10px',
                  fontSize: 12,
                  background: chartType === 'cumulative' ? 'var(--gradient-emerald)' : 'transparent',
                  color: chartType === 'cumulative' ? '#fff' : 'var(--text-muted)',
                  border: 'none',
                  borderRadius: 6,
                }}
              >
                Cumulative
              </button>
            </div>
          </div>

          <div style={{ height: 270 }}>
            {chartType === 'bar' ? (
              <Bar data={timelineChartData} options={barChartOptions} />
            ) : (
              <Line data={timelineChartData} options={lineOptions} />
            )}
          </div>
        </div>

        {/* Browser Share Donut */}
        <div className="glass-panel" style={{ padding: '26px 30px' }}>
          <div style={{ marginBottom: 18 }}>
            <h4 style={{ fontSize: 18, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
              <PieChart size={18} color="var(--accent-cyan)" />
              <span>Browser Distribution</span>
            </h4>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>Engine breakdown of visitor agents</p>
          </div>
          {browsers.length === 0 ? (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)' }}>
              No browser telemetry logged yet
            </div>
          ) : (
            <div style={{ height: 230 }}>
              <Doughnut data={browserChartData} options={doughnutOptions} />
            </div>
          )}
        </div>

        {/* Device Categories Bar Chart */}
        <div className="glass-panel" style={{ padding: '26px 30px' }}>
          <div style={{ marginBottom: 18 }}>
            <h4 style={{ fontSize: 18, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Laptop size={18} color="var(--accent-amber)" />
              <span>Device Breakdown</span>
            </h4>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>Desktop vs Mobile vs Tablet vs Bot</p>
          </div>
          {device_types.length === 0 ? (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)' }}>
              No device telemetry logged yet
            </div>
          ) : (
            <div style={{ height: 230 }}>
              <Bar data={deviceChartData} options={barChartOptions} />
            </div>
          )}
        </div>
      </div>

      {/* Geolocations & Top Referrers & Live Feed Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
        {/* Top Referrer Channels List */}
        <div className="glass-panel" style={{ padding: '26px 30px' }}>
          <div style={{ marginBottom: 18 }}>
            <h4 style={{ fontSize: 18, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Compass size={18} color="var(--accent-secondary)" />
              <span>Top Referrer Channels</span>
            </h4>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>Traffic origin sources & platforms</p>
          </div>

          {top_referrers.length === 0 ? (
            <div style={{ padding: '36px 0', textAlign: 'center', color: 'var(--text-dim)' }}>
              No referrer data logged yet
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {top_referrers.map((ref) => (
                <div key={ref.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
                    <span style={{ fontWeight: 600, color: '#fff' }}>{ref.name}</span>
                    <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {ref.count} clicks ({ref.percentage}%)
                    </span>
                  </div>
                  <div style={{ height: 7, background: 'rgba(255, 255, 255, 0.05)', borderRadius: 4, overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${ref.percentage}%`,
                        background: 'linear-gradient(to right, #6366f1, #06b6d4)',
                        borderRadius: 4,
                        transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Global Geolocations Breakdown */}
        <div className="glass-panel" style={{ padding: '26px 30px' }}>
          <div style={{ marginBottom: 18 }}>
            <h4 style={{ fontSize: 18, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Globe size={18} color="var(--accent-emerald)" />
              <span>Geographic Reach</span>
            </h4>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>Top country distribution of visitors</p>
          </div>

          {countryCounts.length === 0 ? (
            <div style={{ padding: '36px 0', textAlign: 'center', color: 'var(--text-dim)' }}>
              No location data logged yet
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {countryCounts.map((loc) => (
                <div key={loc.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
                    <span style={{ fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>{COUNTRY_FLAGS[loc.name] || '🌐'}</span>
                      <span>{loc.name}</span>
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {loc.count} hits ({loc.percentage}%)
                    </span>
                  </div>
                  <div style={{ height: 7, background: 'rgba(255, 255, 255, 0.05)', borderRadius: 4, overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${loc.percentage}%`,
                        background: 'linear-gradient(to right, #10b981, #06b6d4)',
                        borderRadius: 4,
                        transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Real-time Click Event Stream */}
        <ClicksFeed recentClicks={recent_clicks} />
      </div>
    </div>
  );
}
