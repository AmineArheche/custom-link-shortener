import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, Circle, Clock, Plus, Trash2, GitPullRequest, 
  Flame, Award, Sparkles, Terminal, Copy, Check, Filter, 
  ExternalLink, Code2, Shield, Cpu, BookOpen, Layers, RefreshCw, AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { fetchTasks, createDevTask, updateDevTask, deleteDevTask } from '../services/api';
import { copyTextToClipboard } from '../utils/helpers';

function GithubIcon({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

// Simulated 16-week contribution calendar grid
const WEEKS = 18;
const DAYS_PER_WEEK = 7;
const CONTRIBUTION_LEVELS = [0, 1, 2, 3, 4];

export default function GitHubTaskHub() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // New task form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('feature');
  const [newDifficulty, setNewDifficulty] = useState('medium');
  const [newPoints, setNewPoints] = useState(20);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Copied CLI snippet tracking
  const [copiedSnippetId, setCopiedSnippetId] = useState(null);

  // Load tasks
  const loadTasks = async () => {
    try {
      setLoading(true);
      const res = await fetchTasks({
        category: categoryFilter,
        difficulty: difficultyFilter,
        status_filter: statusFilter,
      });
      setTasks(res.items || []);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Could not connect to task registry. Operating in local mode.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [categoryFilter, difficultyFilter, statusFilter]);

  const handleToggleTask = async (task) => {
    const isNowCompleted = task.status !== 'completed';
    const newStatus = isNowCompleted ? 'completed' : 'todo';

    try {
      await updateDevTask(task.id, { status: newStatus });
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
      );

      if (isNowCompleted) {
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#10b981', '#06b6d4', '#8b5cf6', '#f59e0b'],
          });
        } catch {}
      }
    } catch (err) {
      alert(err.message || 'Failed to update task');
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsSubmitting(true);
    try {
      const created = await createDevTask({
        title: newTitle.trim(),
        description: newDesc.trim() || undefined,
        category: newCategory,
        difficulty: newDifficulty,
        points: parseInt(newPoints, 10),
      });

      setTasks((prev) => [...prev, created]);
      setShowAddModal(false);
      setNewTitle('');
      setNewDesc('');
      try {
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });
      } catch {}
    } catch (err) {
      alert(err.message || 'Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTask = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await deleteDevTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      alert(err.message || 'Failed to delete task');
    }
  };

  const handleCopyGitCommand = (task) => {
    const gitCommand = `git add . ; git commit -m "feat(${task.category}): implement ${task.title.toLowerCase().replace(/[^a-z0-9 ]/g, '')}" ; git push origin main`;
    copyTextToClipboard(gitCommand);
    setCopiedSnippetId(task.id);
    setTimeout(() => setCopiedSnippetId(null), 2500);
  };

  // Stats calculation
  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const totalCount = tasks.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const earnedPoints = tasks
    .filter((t) => t.status === 'completed')
    .reduce((sum, t) => sum + (t.points || 10), 0);

  const filteredTasks = tasks.filter((t) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      (t.description && t.description.toLowerCase().includes(q))
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Hero Header Card */}
      <div className="glass-panel" style={{
        padding: '30px 34px',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid rgba(16, 185, 129, 0.25)',
        boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.6), 0 0 25px rgba(16, 185, 129, 0.1)',
      }}>
        {/* Top green-to-cyan accent strip */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: 'linear-gradient(90deg, #10b981, #06b6d4, #8b5cf6)',
        }} />

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 20,
          marginBottom: 24,
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'rgba(16, 185, 129, 0.18)',
                color: '#34d399',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(16, 185, 129, 0.35)',
              }}>
                <GithubIcon size={20} />
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>
                GitHub Contributor & Tasks Hub
              </h2>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
              Complete high-impact engineering milestones, maintain your commit streak, and push open-source contributions directly to GitHub.
            </p>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary"
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                boxShadow: '0 4px 18px rgba(16, 185, 129, 0.4)',
                borderColor: 'rgba(255, 255, 255, 0.2)',
              }}
            >
              <Plus size={16} />
              <span>Add Contributor Task</span>
            </button>

            <a
              href="https://github.com/AmineArheche/custom-link-shortener"
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary btn-sm"
              style={{ padding: '10px 16px', gap: 6 }}
            >
              <GithubIcon size={15} />
              <span>Open GitHub Repo</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </div>

        {/* 4 KPI Metrics Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}>
          {/* Card 1: Completed Tasks */}
          <div style={{
            background: 'rgba(11, 17, 32, 0.75)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '16px 20px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="form-label">Tasks Progress</span>
              <CheckCircle2 size={16} color="#10b981" />
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, fontFamily: 'var(--font-heading)', color: '#fff', marginTop: 4 }}>
              {completedCount} / {totalCount}
            </div>
            <div style={{ fontSize: 12, color: 'var(--accent-emerald)', marginTop: 2 }}>
              {progressPct}% Completed
            </div>
          </div>

          {/* Card 2: Contribution Points */}
          <div style={{
            background: 'rgba(11, 17, 32, 0.75)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '16px 20px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="form-label">Dev XP Score</span>
              <Award size={16} color="#f59e0b" />
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, fontFamily: 'var(--font-heading)', color: '#fbbf24', marginTop: 4 }}>
              {earnedPoints} XP
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              Rank: <strong>Core Maintainer</strong>
            </div>
          </div>

          {/* Card 3: Contribution Streak */}
          <div style={{
            background: 'rgba(11, 17, 32, 0.75)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '16px 20px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="form-label">Commit Streak</span>
              <Flame size={16} color="#f43f5e" />
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, fontFamily: 'var(--font-heading)', color: '#fda4af', marginTop: 4 }}>
              🔥 14 Days
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              Active on GitHub Main
            </div>
          </div>

          {/* Card 4: GitHub Profile Profile Target */}
          <div style={{
            background: 'rgba(11, 17, 32, 0.75)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '16px 20px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="form-label">GitHub Profile</span>
              <GithubIcon size={16} color="#818cf8" />
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-heading)', color: '#fff', marginTop: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              @AmineArheche
            </div>
            <div style={{ fontSize: 12, color: 'var(--accent-secondary)', marginTop: 2 }}>
              Verified Author & Owner
            </div>
          </div>
        </div>

        {/* Visual Simulated GitHub Contribution Grid */}
        <div style={{
          background: 'rgba(6, 9, 19, 0.7)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          padding: '18px 22px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
              <GitPullRequest size={14} color="#10b981" />
              <span>Contribution Activity Grid (2026 Commit Velocity)</span>
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)' }}>
              <span>Less</span>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(255, 255, 255, 0.05)' }} />
              <span style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(16, 185, 129, 0.3)' }} />
              <span style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(16, 185, 129, 0.6)' }} />
              <span style={{ width: 10, height: 10, borderRadius: 2, background: '#10b981' }} />
              <span>More</span>
            </div>
          </div>

          {/* Matrix of tiles */}
          <div style={{
            display: 'flex',
            gap: 4,
            overflowX: 'auto',
            paddingBottom: 6,
          }}>
            {Array.from({ length: WEEKS }).map((_, weekIdx) => (
              <div key={weekIdx} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {Array.from({ length: DAYS_PER_WEEK }).map((_, dayIdx) => {
                  // Generate realistic committed pattern with high activity on recent weeks
                  const rand = (weekIdx * 7 + dayIdx * 3) % 10;
                  let bg = 'rgba(255, 255, 255, 0.04)';
                  if (rand > 2 && rand < 5) bg = 'rgba(16, 185, 129, 0.35)';
                  else if (rand >= 5 && rand < 8) bg = 'rgba(16, 185, 129, 0.65)';
                  else if (rand >= 8) bg = '#10b981';

                  return (
                    <div
                      key={dayIdx}
                      title={`Activity Day: ${rand} commits`}
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 3,
                        background: bg,
                        transition: 'transform 0.15s ease',
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.3)')}
                      onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Task Filters & Search Bar */}
      <div className="glass-panel" style={{ padding: '20px 26px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12,
          alignItems: 'center',
        }}>
          {/* Search */}
          <input
            type="text"
            className="form-input"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {/* Category Filter */}
          <select
            className="form-input"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="feature">Features 🚀</option>
            <option value="security">Security 🛡️</option>
            <option value="performance">Performance ⚡</option>
            <option value="devops">DevOps 🐳</option>
            <option value="docs">Documentation 📚</option>
          </select>

          {/* Difficulty Filter */}
          <select
            className="form-input"
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
          >
            <option value="all">All Difficulties</option>
            <option value="good-first-issue">Good First Issue 🟢</option>
            <option value="medium">Intermediate 🟡</option>
            <option value="advanced">Advanced 🔴</option>
          </select>

          {/* Status Filter */}
          <select
            className="form-input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="todo">To Do</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Tasks List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {filteredTasks.map((task) => {
          const isDone = task.status === 'completed';
          return (
            <div
              key={task.id}
              className="glass-card-interactive"
              style={{
                background: isDone ? 'rgba(16, 185, 129, 0.05)' : 'rgba(11, 17, 32, 0.8)',
                border: isDone ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 16,
              }}
            >
              {/* Left Column with Checkbox & Text */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flex: '1 1 320px' }}>
                <button
                  type="button"
                  onClick={() => handleToggleTask(task)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    marginTop: 2,
                    color: isDone ? '#10b981' : 'var(--text-dim)',
                    transition: 'transform 0.15s ease',
                  }}
                  title={isDone ? 'Mark Incomplete' : 'Mark Completed (+XP)'}
                >
                  {isDone ? <CheckCircle2 size={22} strokeWidth={2.5} /> : <Circle size={22} />}
                </button>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                    <span style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: 16,
                      fontWeight: 700,
                      color: isDone ? '#94a3b8' : '#fff',
                      textDecoration: isDone ? 'line-through' : 'none',
                    }}>
                      {task.title}
                    </span>

                    {/* Category Pill */}
                    <span className="badge badge-indigo" style={{ fontSize: 11, textTransform: 'capitalize' }}>
                      {task.category}
                    </span>

                    {/* Difficulty Pill */}
                    {task.difficulty === 'good-first-issue' && (
                      <span className="badge badge-emerald" style={{ fontSize: 11 }}>Good First Issue</span>
                    )}
                    {task.difficulty === 'medium' && (
                      <span className="badge badge-amber" style={{ fontSize: 11 }}>Intermediate</span>
                    )}
                    {task.difficulty === 'advanced' && (
                      <span className="badge badge-rose" style={{ fontSize: 11 }}>Advanced</span>
                    )}

                    {/* XP Points */}
                    <span className="badge badge-cyan" style={{ fontSize: 11 }}>
                      +{task.points || 10} XP
                    </span>
                  </div>

                  {task.description && (
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, marginTop: 4 }}>
                      {task.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Right Column: Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                {/* Copy Git Commit CLI command */}
                <button
                  type="button"
                  onClick={() => handleCopyGitCommand(task)}
                  className="btn btn-secondary btn-sm"
                  title="Copy git commit & push CLI command for GitHub contribution"
                  style={{
                    background: copiedSnippetId === task.id ? 'rgba(16, 185, 129, 0.2)' : undefined,
                    borderColor: copiedSnippetId === task.id ? '#10b981' : undefined,
                  }}
                >
                  {copiedSnippetId === task.id ? <Check size={14} color="#10b981" /> : <Terminal size={14} />}
                  <span>{copiedSnippetId === task.id ? 'CLI Copied!' : 'Git Commit CLI'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteTask(task.id)}
                  className="btn btn-ghost btn-sm"
                  title="Remove task"
                  style={{ color: '#fda4af', padding: '6px 8px' }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>
              Add Open-Source Contributor Task
            </h3>
            <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="form-label">Task Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Add Geo-IP Country Map component..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="form-label">Description & Implementation Details</label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="Explain requirements and technical approach..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label">Category</label>
                  <select
                    className="form-input"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                  >
                    <option value="feature">Feature 🚀</option>
                    <option value="security">Security 🛡️</option>
                    <option value="performance">Performance ⚡</option>
                    <option value="devops">DevOps 🐳</option>
                    <option value="docs">Documentation 📚</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Difficulty</label>
                  <select
                    className="form-input"
                    value={newDifficulty}
                    onChange={(e) => setNewDifficulty(e.target.value)}
                  >
                    <option value="good-first-issue">Good First Issue</option>
                    <option value="medium">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label">XP Points Reward</label>
                <input
                  type="number"
                  className="form-input"
                  min="5"
                  max="100"
                  value={newPoints}
                  onChange={(e) => setNewPoints(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-ghost btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newTitle.trim()}
                  className="btn btn-primary btn-sm"
                >
                  {isSubmitting ? 'Saving...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
