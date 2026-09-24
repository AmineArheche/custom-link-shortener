import React from 'react';
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
  TrendingUp, X, Download, BarChart2, ShieldCheck, Activity
} from 'lucide-react';
import ClicksFeed from './ClicksFeed';
import { downloadAnalyticsCsv } from '../services/api';

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

export default function AnalyticsView({
  analyticsData,
  onClearSelectedLink
}) {
  if (!analyticsData) {
    return (
      <div className="glass-panel" style={{
        padding: 48,
        textAlign: 'center',
        color: 'var(--text-muted)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
      }}>
        <div className="animate-spin">
          <Activity size={28} color="var(--accent-secondary)" />
        </div>
        <p style={{ fontSize: 15, fontWeight: 500 }}>Aggregating telemetry intelligence...</p>
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
    device_types = [],
    top_referrers = [],
    recent_clicks = [],
    link = null
  } = analyticsData;

  // Chart 1: Timeline Line Area Chart
  const timelineLabels = clicks_timeline.map((p) => p.label);
  const timelineValues = clicks_timeline.map((p) => p.count);

  const timelineChartData = {
    labels: timelineLabels,
    datasets: [
      {
        label: 'Clicks',
        data: timelineValues,
        borderColor: '#8b5cf6',
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 260);
          gradient.addColorStop(0, 'rgba(139, 92, 246, 0.45)');
          gradient.addColorStop(0.7, 'rgba(99, 102, 241, 0.12)');
          gradient.addColorStop(1, 'rgba(99, 102, 241, 0.0)');
          return gradient;
        },
        fill: true,
        tension: 0.38,
        borderWidth: 2.5,
        pointBackgroundColor: '#06b6d4',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
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
        ticks: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans', size: 12 }, precision: 0 },
      },
    },
  };

  // Chart 2: Browsers Donut Chart
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

  // Chart 3: Devices Bar Chart
  const deviceChartData = {
    labels: device_types.map((d) => d.name),
    datasets: [
      {
        label: 'Devices',
        data: device_types.map((d) => d.count),
        backgroundColor: ['#6366f1', '#06b6d4', '#10b981', '#f59e0b'],
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
      }
    },
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8', font: { size: 12, family: 'Plus Jakarta Sans' } },
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(255, 255, 255, 0.04)' },
        ticks: { color: '#94a3b8', precision: 0, font: { family: 'JetBrains Mono', size: 11 } },
      },
    },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header bar with Export */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
      }}>
        <div>
          <h3 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>
            {link ? `Telemetry Dashboard: /r/${link.short_code}` : 'Global Performance & Telemetry Hub'}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>
            Real-time analytics across browsers, platforms, operating systems, and referrers
          </p>
        </div>

        <button
          type="button"
          onClick={downloadAnalyticsCsv}
          className="btn btn-secondary btn-sm"
          title="Download full visitor telemetry log in CSV"
        >
          <Download size={14} />
          <span>Export Telemetry CSV</span>
        </button>
      </div>

      {/* Filter notification banner if specific link is selected */}
      {link && (
        <div className="glass-panel animate-fade-in" style={{
          padding: '16px 24px',
          background: 'rgba(99, 102, 241, 0.1)',
          border: '1px solid var(--border-glow)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="badge badge-indigo">Filtering Single Link</span>
              <span style={{ fontWeight: 700, fontSize: 16, color: '#fff' }}>
                {link.title || link.short_code}
              </span>
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
              Target: <span style={{ color: '#fff' }}>{link.original_url}</span> • Short: <span style={{ color: 'var(--accent-secondary)' }}>{link.short_url}</span>
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

      {/* KPI Stat Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: 16,
      }}>
        {/* Card 1: Total Clicks */}
        <div className="glass-panel glass-card-interactive" style={{ padding: '22px 24px', position: 'relative', overflow: 'hidden' }}>
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
          <div style={{ fontSize: 34, fontWeight: 800, fontFamily: 'var(--font-heading)', color: '#fff', marginTop: 6 }}>
            {total_clicks.toLocaleString()}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--accent-emerald)', marginTop: 4 }}>
            <TrendingUp size={14} />
            <span>Live Relational Telemetry</span>
          </div>
        </div>

        {/* Card 2: Traffic Channels */}
        <div className="glass-panel glass-card-interactive" style={{ padding: '22px 24px' }}>
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
          <div style={{ fontSize: 34, fontWeight: 800, fontFamily: 'var(--font-heading)', color: '#fff', marginTop: 6 }}>
            {top_referrers.length} Sources
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            Top: <strong style={{ color: '#fff' }}>{top_referrer || 'Direct'}</strong>
          </div>
        </div>

        {/* Card 3: Top Browser */}
        <div className="glass-panel glass-card-interactive" style={{ padding: '22px 24px' }}>
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
          <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-heading)', color: '#fff', marginTop: 6 }}>
            {top_browser}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            Operating System: <strong style={{ color: '#fff' }}>{top_os}</strong>
          </div>
        </div>

        {/* Card 4: Top Device */}
        <div className="glass-panel glass-card-interactive" style={{ padding: '22px 24px' }}>
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
          <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-heading)', color: '#fff', marginTop: 6 }}>
            {top_device}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            {total_links > 0 ? `${total_links} links registered` : 'Real-time telemetry'}
          </div>
        </div>
      </div>

      {/* Main Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
        {/* Timeline Area Chart */}
        <div className="glass-panel" style={{ padding: '26px 30px', gridColumn: 'span 2 / span 2', minWidth: 320 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h4 style={{ fontSize: 18, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                <BarChart2 size={18} color="var(--accent-secondary)" />
                <span>Click Velocity & Trends</span>
              </h4>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>Daily traffic velocity for the last 7 days</p>
            </div>
            <span className="badge badge-indigo">7-Day Trajectory</span>
          </div>
          <div style={{ height: 260 }}>
            <Line data={timelineChartData} options={lineOptions} />
          </div>
        </div>

        {/* Browser Share Donut */}
        <div className="glass-panel" style={{ padding: '26px 30px' }}>
          <div style={{ marginBottom: 18 }}>
            <h4 style={{ fontSize: 18, fontWeight: 800 }}>Browser Share</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>Parsed User-Agent engine breakdown</p>
          </div>
          {browsers.length === 0 ? (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)' }}>
              No click data logged yet
            </div>
          ) : (
            <div style={{ height: 220 }}>
              <Doughnut data={browserChartData} options={doughnutOptions} />
            </div>
          )}
        </div>

        {/* Device Categories Bar Chart */}
        <div className="glass-panel" style={{ padding: '26px 30px' }}>
          <div style={{ marginBottom: 18 }}>
            <h4 style={{ fontSize: 18, fontWeight: 800 }}>Device Distribution</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>Desktop vs Mobile vs Tablet</p>
          </div>
          {device_types.length === 0 ? (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)' }}>
              No device data logged yet
            </div>
          ) : (
            <div style={{ height: 220 }}>
              <Bar data={deviceChartData} options={barOptions} />
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row: Top Referrers & Live Feed */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
        {/* Top Referrers List */}
        <div className="glass-panel" style={{ padding: '26px 30px' }}>
          <div style={{ marginBottom: 18 }}>
            <h4 style={{ fontSize: 18, fontWeight: 800 }}>Top Referrer Channels</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>Where your visitors originate from</p>
          </div>

          {top_referrers.length === 0 ? (
            <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--text-dim)' }}>
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

        {/* Real-time Click Event Stream */}
        <ClicksFeed recentClicks={recent_clicks} />
      </div>
    </div>
  );
}
