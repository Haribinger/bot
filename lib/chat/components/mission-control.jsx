'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SpinnerIcon, RefreshIcon, ChevronDownIcon, BellIcon } from './icons.js';
import { getSwarmStatus, getNotifications, createAgentJob } from '../actions.js';

// ─────────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────────

function formatDuration(seconds) {
  if (!seconds || seconds < 0) return '0s';
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (minutes < 60) return `${minutes}m ${secs}s`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

function timeAgo(timestamp) {
  if (!timestamp) return '';
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function getJobId(branch) {
  if (!branch) return '';
  return branch.replace('job/', '').slice(0, 8);
}

// Deterministic color from agent codename
const AGENT_COLORS = ['#0ea5e9', '#8b5cf6', '#ef4444', '#f59e0b', '#10b981', '#ec4899', '#06b6d4', '#f97316'];

function getAgentColor(codename) {
  if (!codename) return AGENT_COLORS[0];
  let hash = 0;
  for (let i = 0; i < codename.length; i++) {
    hash = codename.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AGENT_COLORS[Math.abs(hash) % AGENT_COLORS.length];
}

// ─────────────────────────────────────────────────────────────────────────────
// Agent Roster Panel (Left)
// ─────────────────────────────────────────────────────────────────────────────

function AgentRoster({ agents, runs, selectedAgent, onSelect, collapsed, onToggleCollapse }) {
  const agentJobCounts = {};
  for (const run of runs) {
    const branch = run.branch || '';
    for (const agent of agents) {
      const codename = (agent.codename || agent.name || agent.id || '').toLowerCase();
      if (branch.toLowerCase().includes(codename)) {
        agentJobCounts[codename] = (agentJobCounts[codename] || 0) + 1;
      }
    }
  }

  const activeRuns = runs.filter(r => r.status === 'in_progress' || r.status === 'queued');
  const agentActivity = {};
  for (const run of activeRuns) {
    const branch = (run.branch || '').toLowerCase();
    for (const agent of agents) {
      const codename = (agent.codename || agent.name || agent.id || '').toLowerCase();
      if (branch.includes(codename)) {
        agentActivity[codename] = run.status === 'in_progress' ? 'active' : 'queued';
      }
    }
  }

  return (
    <div className={`shrink-0 border-r border-white/[0.06] transition-all ${collapsed ? 'w-14' : 'w-60'}`}>
      <div className="flex items-center justify-between p-3 border-b border-white/[0.06]">
        {!collapsed && <h2 className="text-[10px] font-mono font-medium uppercase tracking-wider text-muted-foreground">Agents</h2>}
        <button
          onClick={onToggleCollapse}
          className="p-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronDownIcon size={14} className={`transition-transform ${collapsed ? '-rotate-90' : 'rotate-90'}`} />
        </button>
      </div>

      <div className="flex flex-col gap-1 p-2 overflow-y-auto max-h-[calc(100vh-16rem)] scrollbar-thin">
        {/* All filter */}
        <button
          onClick={() => onSelect(null)}
          className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors ${
            selectedAgent === null ? 'bg-[--cyan]/10 text-[--cyan]' : 'hover:bg-white/[0.04] text-muted-foreground hover:text-foreground'
          }`}
        >
          <div className="w-2 h-2 rounded-full bg-[--cyan] shrink-0" />
          {!collapsed && <span className="text-xs font-mono truncate">All Agents</span>}
        </button>

        {agents.map((agent, i) => {
          const codename = agent.codename || agent.name || agent.id;
          const lcCodename = codename.toLowerCase();
          const activity = agentActivity[lcCodename];
          const isSelected = selectedAgent === agent.id;
          const avatarColor = getAgentColor(lcCodename);

          return (
            <motion.button
              key={agent.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: i * 0.03 }}
              onClick={() => onSelect(agent.id)}
              className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors ${
                isSelected ? 'bg-[--cyan]/10 text-[--cyan]' : 'hover:bg-white/[0.04] text-foreground/80 hover:text-foreground'
              }`}
            >
              <div className={`w-2 h-2 rounded-full shrink-0 ${
                activity === 'active' ? 'bg-green-500 animate-pulse' :
                activity === 'queued' ? 'bg-yellow-500' :
                'bg-muted-foreground/40'
              }`} />
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-mono font-medium truncate block">@{codename.toUpperCase()}</span>
                  {agent.role && <span className="text-[10px] font-mono text-muted-foreground truncate block">{agent.role}</span>}
                </div>
              )}
              {!collapsed && (
                <div
                  className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-[8px] font-mono font-bold text-black"
                  style={{ backgroundColor: avatarColor }}
                >
                  {codename.charAt(0).toUpperCase()}
                </div>
              )}
            </motion.button>
          );
        })}

        {agents.length === 0 && !collapsed && (
          <div className="text-center py-4">
            <p className="text-[10px] font-mono text-muted-foreground">No agents configured</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mission Queue Panel (Center)
// ─────────────────────────────────────────────────────────────────────────────

function MissionCard({ run, agents, index, viewMode }) {
  const [expanded, setExpanded] = useState(false);
  const isActive = run.status === 'in_progress';
  const isQueued = run.status === 'queued';
  const isFailed = run.conclusion === 'failure';
  const isSuccess = run.conclusion === 'success';
  const jobId = getJobId(run.branch);
  const isCompact = viewMode === 'compact';

  // Try to match agent by branch name
  const branch = (run.branch || '').toLowerCase();
  const matchedAgent = agents.find(a => {
    const codename = (a.codename || a.name || a.id || '').toLowerCase();
    return branch.includes(codename);
  });

  // Extract prompt excerpt from job.md content if available, or fall back to workflow name
  const promptText = run.prompt || run.job_prompt || run.workflow_name || '';
  const promptExcerpt = promptText.length > 100 ? promptText.slice(0, 100) + '…' : promptText;

  // Agent avatar
  const agentCodename = matchedAgent
    ? (matchedAgent.codename || matchedAgent.name || matchedAgent.id || '')
    : '';
  const avatarColor = agentCodename ? getAgentColor(agentCodename.toLowerCase()) : null;

  // Priority badge
  const priority = run.priority;
  const priorityStyles = {
    1: 'bg-red-500/10 text-red-500 border-red-500/20',
    2: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    3: 'bg-sky-500/10 text-sky-500 border-sky-500/20',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      layout
      className={`rounded-lg border bg-[--card] transition-all ${
        isActive ? 'border-green-500/30 shadow-[0_0_15px_oklch(0.7_0.17_145/10%)]' :
        isFailed ? 'border-red-500/20' :
        'border-white/[0.06] hover:border-[--cyan]/20'
      }`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className={`flex items-center gap-3 w-full text-left hover:bg-white/[0.02] rounded-lg transition-colors ${isCompact ? 'p-2' : 'p-3'}`}
      >
        {/* Agent avatar or status dot */}
        {avatarColor && !isCompact ? (
          <div
            className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-mono font-bold text-black"
            style={{ backgroundColor: avatarColor }}
          >
            {agentCodename.charAt(0).toUpperCase()}
          </div>
        ) : (
          <div className={`shrink-0 w-2.5 h-2.5 rounded-full ${
            isActive ? 'bg-green-500 animate-pulse' :
            isQueued ? 'bg-yellow-500' :
            isFailed ? 'bg-red-500' :
            isSuccess ? 'bg-green-500' :
            'bg-muted-foreground'
          }`} />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-medium text-foreground/90 truncate">
              {run.workflow_name || run.branch || 'Unknown'}
            </span>
            {priority && priorityStyles[priority] && (
              <span className={`inline-flex rounded-full px-1.5 py-0.5 text-[9px] font-mono border shrink-0 ${priorityStyles[priority]}`}>
                P{priority}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {jobId && <span className="text-[10px] font-mono text-muted-foreground">{jobId}</span>}
            {matchedAgent && (
              <span className="inline-flex rounded-full bg-[--cyan]/10 border border-[--cyan]/20 px-1.5 py-0.5 text-[9px] font-mono text-[--cyan]">
                @{(matchedAgent.codename || matchedAgent.name || matchedAgent.id).toUpperCase()}
              </span>
            )}
          </div>
          {/* Prompt excerpt — hidden in compact mode */}
          {!isCompact && promptExcerpt && (
            <p className="text-[10px] font-mono text-muted-foreground/60 line-clamp-2 mt-0.5">
              {promptExcerpt}
            </p>
          )}
        </div>

        {/* Time */}
        <span className="text-[10px] font-mono text-muted-foreground shrink-0">
          {(isActive || isQueued) ? formatDuration(run.duration_seconds) : timeAgo(run.updated_at || run.started_at)}
        </span>

        {/* Status badge */}
        {!isActive && !isQueued && (
          <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-mono font-medium border ${
            isFailed ? 'bg-red-500/10 text-red-500 border-red-500/20' :
            isSuccess ? 'bg-green-500/10 text-green-500 border-green-500/20' :
            'bg-white/5 text-muted-foreground border-white/10'
          }`}>
            {run.conclusion || 'unknown'}
          </span>
        )}

        <ChevronDownIcon size={14} className={`shrink-0 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/[0.06] px-4 py-3 flex flex-col gap-2">
              {run.branch && (
                <div className="flex gap-2 text-xs items-baseline">
                  <span className="text-muted-foreground font-mono text-[10px] uppercase tracking-wider w-16 shrink-0">Branch</span>
                  <span className="font-mono text-foreground/80">{run.branch}</span>
                </div>
              )}
              {run.started_at && (
                <div className="flex gap-2 text-xs items-baseline">
                  <span className="text-muted-foreground font-mono text-[10px] uppercase tracking-wider w-16 shrink-0">Started</span>
                  <span className="font-mono text-foreground/80">{new Date(run.started_at).toLocaleString()}</span>
                </div>
              )}
              {run.duration_seconds > 0 && (
                <div className="flex gap-2 text-xs items-baseline">
                  <span className="text-muted-foreground font-mono text-[10px] uppercase tracking-wider w-16 shrink-0">Duration</span>
                  <span className="font-mono text-foreground/80">{formatDuration(run.duration_seconds)}</span>
                </div>
              )}
              {run.html_url && (
                <div className="mt-1">
                  <a href={run.html_url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-mono text-[--cyan] hover:underline">
                    View on GitHub &rarr;
                  </a>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function MissionQueue({ runs, agents, selectedAgent, quickFilter, viewMode }) {
  // Filter runs by selected agent
  const agentFiltered = selectedAgent
    ? runs.filter(r => {
        const branch = (r.branch || '').toLowerCase();
        const agent = agents.find(a => a.id === selectedAgent);
        if (!agent) return false;
        const codename = (agent.codename || agent.name || agent.id || '').toLowerCase();
        return branch.includes(codename);
      })
    : runs;

  // Apply quick filter
  const quickFiltered = (() => {
    switch (quickFilter) {
      case 'active':
        return agentFiltered.filter(r => r.status === 'in_progress');
      case 'failed':
        return agentFiltered.filter(r => r.conclusion === 'failure');
      case 'mine':
        return agentFiltered; // placeholder — include all
      default:
        return agentFiltered;
    }
  })();

  // Split into columns
  const queued = quickFiltered.filter(r => r.status === 'queued');
  const active = quickFiltered.filter(r => r.status === 'in_progress');
  const completed = quickFiltered.filter(r => r.status !== 'queued' && r.status !== 'in_progress');

  const columns = [
    { id: 'queued', label: 'QUEUED', runs: queued, color: 'text-yellow-500', dotColor: 'bg-yellow-500' },
    { id: 'active', label: 'IN PROGRESS', runs: active, color: 'text-green-500', dotColor: 'bg-green-500 animate-pulse' },
    { id: 'completed', label: 'COMPLETED', runs: completed, color: 'text-muted-foreground', dotColor: 'bg-muted-foreground' },
  ];

  return (
    <div className="flex-1 min-w-0 p-4 overflow-y-auto scrollbar-thin">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
        {columns.map(col => (
          <div key={col.id} className="flex flex-col min-h-0">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/[0.06]">
              <div className={`w-2 h-2 rounded-full ${col.dotColor}`} />
              <h3 className={`text-[10px] font-mono font-medium uppercase tracking-wider ${col.color}`}>
                {col.label}
              </h3>
              <span className="text-[10px] font-mono text-muted-foreground">({col.runs.length})</span>
            </div>
            <div className="flex flex-col gap-2 overflow-y-auto scrollbar-thin flex-1">
              <AnimatePresence>
                {col.runs.map((run, i) => (
                  <MissionCard key={run.run_id} run={run} agents={agents} index={i} viewMode={viewMode} />
                ))}
              </AnimatePresence>
              {col.runs.length === 0 && (
                <div className="flex items-center justify-center py-8 text-[10px] font-mono text-muted-foreground/50">
                  No missions
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Live Feed Panel (Right)
// ─────────────────────────────────────────────────────────────────────────────

function LiveFeed({ runs, notifications, collapsed, onToggleCollapse }) {
  // Build a unified event feed from runs and notifications
  const events = [];

  for (const run of runs.slice(0, 20)) {
    const isActive = run.status === 'in_progress';
    const isQueued = run.status === 'queued';
    const isFailed = run.conclusion === 'failure';
    const isSuccess = run.conclusion === 'success';

    events.push({
      id: `run-${run.run_id}`,
      time: run.updated_at || run.started_at || run.created_at,
      type: isActive ? 'job_started' : isQueued ? 'job_created' : isFailed ? 'job_failed' : isSuccess ? 'job_completed' : 'job_completed',
      label: isActive ? 'Running' : isQueued ? 'Queued' : isFailed ? 'Failed' : 'Completed',
      description: run.workflow_name || getJobId(run.branch) || 'job',
      color: isActive ? 'text-green-500' : isQueued ? 'text-yellow-500' : isFailed ? 'text-[--destructive]' : 'text-green-500',
      dotColor: isActive ? 'bg-green-500 animate-pulse' : isQueued ? 'bg-yellow-500' : isFailed ? 'bg-red-500' : 'bg-green-500',
      url: run.html_url,
    });
  }

  for (const notif of (notifications || []).slice(0, 10)) {
    const payload = typeof notif.payload === 'string' ? JSON.parse(notif.payload) : notif.payload;
    events.push({
      id: `notif-${notif.id}`,
      time: notif.createdAt,
      type: 'notification',
      label: payload?.conclusion === 'failure' ? 'Failed' : 'PR Merged',
      description: payload?.title || payload?.pr_title || 'Notification',
      color: payload?.conclusion === 'failure' ? 'text-[--destructive]' : 'text-[--cyan]',
      dotColor: payload?.conclusion === 'failure' ? 'bg-red-500' : 'bg-[--cyan]',
      url: payload?.pr_url || payload?.html_url,
    });
  }

  // Sort by time, newest first
  events.sort((a, b) => {
    const ta = a.time ? new Date(a.time).getTime() : 0;
    const tb = b.time ? new Date(b.time).getTime() : 0;
    return tb - ta;
  });

  const unique = [];
  const seen = new Set();
  for (const e of events) {
    if (!seen.has(e.id)) {
      seen.add(e.id);
      unique.push(e);
    }
  }

  return (
    <div className={`shrink-0 border-l border-white/[0.06] transition-all ${collapsed ? 'w-14' : 'w-72'}`}>
      <div className="flex items-center justify-between p-3 border-b border-white/[0.06]">
        <button
          onClick={onToggleCollapse}
          className="p-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronDownIcon size={14} className={`transition-transform ${collapsed ? 'rotate-90' : '-rotate-90'}`} />
        </button>
        {!collapsed && <h2 className="text-[10px] font-mono font-medium uppercase tracking-wider text-muted-foreground">Live Feed</h2>}
      </div>

      {!collapsed && (
        <div className="flex flex-col overflow-y-auto max-h-[calc(100vh-16rem)] scrollbar-thin">
          {unique.slice(0, 30).map((event, i) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: i * 0.02 }}
              className="flex items-start gap-2 px-3 py-2 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
            >
              <div className={`shrink-0 w-1.5 h-1.5 rounded-full mt-1.5 ${event.dotColor}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={`text-[9px] font-mono font-medium ${event.color}`}>{event.label}</span>
                  <span className="text-[9px] font-mono text-muted-foreground">{timeAgo(event.time)}</span>
                </div>
                {event.url ? (
                  <a href={event.url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-mono text-foreground/70 hover:text-[--cyan] truncate block transition-colors">
                    {event.description}
                  </a>
                ) : (
                  <p className="text-[10px] font-mono text-foreground/70 truncate">{event.description}</p>
                )}
              </div>
            </motion.div>
          ))}

          {unique.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <BellIcon size={16} />
              <p className="text-[10px] font-mono text-muted-foreground mt-2">No events yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Quick Spawn Panel
// ─────────────────────────────────────────────────────────────────────────────

function QuickSpawn({ agents, onSpawned }) {
  const [spawnPrompt, setSpawnPrompt] = useState('');
  const [spawnAgent, setSpawnAgent] = useState('');
  const [spawning, setSpawning] = useState(false);
  const [spawnError, setSpawnError] = useState('');
  const [spawnSuccess, setSpawnSuccess] = useState(false);

  async function handleSpawn(e) {
    e.preventDefault();
    if (!spawnPrompt.trim()) return;
    setSpawning(true);
    setSpawnError('');
    setSpawnSuccess(false);
    try {
      const result = await createAgentJob(spawnAgent || null, spawnPrompt.trim());
      if (result?.error) {
        setSpawnError(result.error);
      } else {
        setSpawnSuccess(true);
        setSpawnPrompt('');
        setSpawnAgent('');
        if (onSpawned) onSpawned();
        setTimeout(() => setSpawnSuccess(false), 3000);
      }
    } catch (err) {
      setSpawnError(err.message || 'Failed to spawn job');
    } finally {
      setSpawning(false);
    }
  }

  return (
    <div className="border border-white/[0.06] rounded-lg bg-[--card] overflow-hidden">
      {/* Traffic lights header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06]">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
        </div>
        <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-muted-foreground ml-1">
          Quick Spawn
        </span>
        {spawnSuccess && (
          <motion.span
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="ml-auto text-[10px] font-mono text-green-500"
          >
            Job spawned
          </motion.span>
        )}
        {spawnError && (
          <span className="ml-auto text-[10px] font-mono text-red-500 truncate max-w-xs">{spawnError}</span>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleSpawn} className="flex items-center gap-2 p-3">
        <input
          type="text"
          value={spawnPrompt}
          onChange={e => setSpawnPrompt(e.target.value)}
          placeholder="Task prompt..."
          disabled={spawning}
          className="flex-1 text-sm border border-white/[0.06] rounded-md px-3 py-2 bg-black/20 font-mono text-foreground/80 focus:outline-none focus:border-[--cyan]/40 focus:ring-1 focus:ring-[--cyan]/20 disabled:opacity-50 placeholder:text-muted-foreground/40 transition-colors"
        />

        <select
          value={spawnAgent}
          onChange={e => setSpawnAgent(e.target.value)}
          disabled={spawning}
          className="text-sm border border-white/[0.06] rounded-md px-3 py-2 bg-black/20 font-mono text-foreground/80 focus:outline-none focus:border-[--cyan]/40 focus:ring-1 focus:ring-[--cyan]/20 disabled:opacity-50 transition-colors appearance-none cursor-pointer"
        >
          <option value="">Any Agent</option>
          {agents.map(agent => {
            const codename = agent.codename || agent.name || agent.id;
            return (
              <option key={agent.id} value={agent.id}>
                @{codename.toUpperCase()}
              </option>
            );
          })}
        </select>

        <button
          type="submit"
          disabled={spawning || !spawnPrompt.trim()}
          className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-mono font-medium bg-[--cyan]/10 text-[--cyan] border border-[--cyan]/20 hover:bg-[--cyan] hover:text-[--primary-foreground] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {spawning ? <SpinnerIcon size={13} /> : null}
          {spawning ? 'Spawning...' : 'Spawn'}
        </button>
      </form>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

const QUICK_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'failed', label: 'Failed' },
  { id: 'mine', label: 'Mine' },
];

export function MissionControlPage() {
  const [agents, setAgents] = useState([]);
  const [runs, setRuns] = useState([]);
  const [notifications_, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [quickFilter, setQuickFilter] = useState('all');
  const [viewMode, setViewMode] = useState('detailed');

  const fetchData = useCallback(async () => {
    try {
      const [swarm, notifs, agentProfiles] = await Promise.all([
        getSwarmStatus(1),
        getNotifications(),
        import('../actions.js').then(m => m.getAgentProfiles ? m.getAgentProfiles() : []).catch(() => []),
      ]);
      setRuns(swarm.runs || []);
      setNotifications(notifs || []);
      setAgents(agentProfiles || []);
    } catch (err) {
      console.error('Failed to fetch mission control data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-refresh every 10s
  useEffect(() => {
    const interval = setInterval(() => fetchData(), 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const activeCount = runs.filter(r => r.status === 'in_progress').length;
  const queuedCount = runs.filter(r => r.status === 'queued').length;

  if (loading) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-white/[0.04]" />
        <div className="grid grid-cols-3 gap-4 flex-1">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex flex-col gap-3">
              {[...Array(4)].map((_, j) => (
                <div key={j} className="h-16 animate-pulse rounded-lg bg-white/[0.04] border border-white/[0.06]" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full -m-4">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-mono font-semibold text-[--cyan] text-glow-cyan">Mission Control</h1>
          <div className="flex items-center gap-2">
            {activeCount > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-mono font-medium bg-green-500/10 text-green-500 border border-green-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                {activeCount} active
              </span>
            )}
            {queuedCount > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-mono font-medium bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                {queuedCount} queued
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-mono font-medium bg-[--cyan]/10 text-[--cyan] border border-[--cyan]/20">
              {agents.length} agents
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Compact / Detailed toggle */}
          <button
            onClick={() => setViewMode(v => v === 'detailed' ? 'compact' : 'detailed')}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-mono font-medium border transition-colors ${
              viewMode === 'compact'
                ? 'bg-[--cyan]/10 text-[--cyan] border-[--cyan]/20'
                : 'border-white/[0.06] text-muted-foreground hover:text-foreground hover:bg-white/[0.04]'
            }`}
            title={viewMode === 'detailed' ? 'Switch to compact view' : 'Switch to detailed view'}
          >
            {viewMode === 'detailed' ? (
              // Detailed icon: three lines of different widths
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="1" y="2" width="12" height="2" rx="1" fill="currentColor" />
                <rect x="1" y="6" width="8" height="2" rx="1" fill="currentColor" opacity="0.6" />
                <rect x="1" y="10" width="10" height="2" rx="1" fill="currentColor" opacity="0.4" />
              </svg>
            ) : (
              // Compact icon: tighter rows
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="1" y="1.5" width="12" height="1.5" rx="0.75" fill="currentColor" />
                <rect x="1" y="4.5" width="12" height="1.5" rx="0.75" fill="currentColor" />
                <rect x="1" y="7.5" width="12" height="1.5" rx="0.75" fill="currentColor" />
                <rect x="1" y="10.5" width="12" height="1.5" rx="0.75" fill="currentColor" />
              </svg>
            )}
            {viewMode === 'detailed' ? 'Detailed' : 'Compact'}
          </button>

          <button
            onClick={() => { setRefreshing(true); fetchData(); }}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-mono font-medium border border-white/[0.06] text-muted-foreground hover:text-foreground hover:bg-white/[0.04] disabled:opacity-50 transition-colors"
          >
            {refreshing ? <SpinnerIcon size={14} /> : <RefreshIcon size={14} />}
            {refreshing ? 'Refreshing' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="flex items-center gap-1.5 px-4 py-2 border-b border-white/[0.06]">
        {QUICK_FILTERS.map(filter => (
          <button
            key={filter.id}
            onClick={() => setQuickFilter(filter.id)}
            className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-medium border transition-colors ${
              quickFilter === filter.id
                ? 'bg-[--cyan]/10 text-[--cyan] border-[--cyan]/20'
                : 'border-white/[0.06] text-muted-foreground hover:text-foreground hover:border-white/[0.12]'
            }`}
          >
            {filter.label}
          </button>
        ))}
        {/* Live run count for active filter context */}
        <span className="ml-auto text-[10px] font-mono text-muted-foreground/50">
          {runs.length} total
        </span>
      </div>

      {/* 3-panel layout - desktop */}
      <div className="hidden md:flex flex-1 min-h-0">
        <AgentRoster
          agents={agents}
          runs={runs}
          selectedAgent={selectedAgent}
          onSelect={setSelectedAgent}
          collapsed={leftCollapsed}
          onToggleCollapse={() => setLeftCollapsed(!leftCollapsed)}
        />
        <div className="flex flex-col flex-1 min-w-0 min-h-0">
          <MissionQueue
            runs={runs}
            agents={agents}
            selectedAgent={selectedAgent}
            quickFilter={quickFilter}
            viewMode={viewMode}
          />
          {/* Quick Spawn — bottom of center column */}
          <div className="px-4 pb-4 shrink-0">
            <QuickSpawn agents={agents} onSpawned={() => { setRefreshing(true); fetchData(); }} />
          </div>
        </div>
        <LiveFeed
          runs={runs}
          notifications={notifications_}
          collapsed={rightCollapsed}
          onToggleCollapse={() => setRightCollapsed(!rightCollapsed)}
        />
      </div>

      {/* Mobile layout - tabbed */}
      <MobileMissionControl
        agents={agents}
        runs={runs}
        notifications={notifications_}
        selectedAgent={selectedAgent}
        onSelectAgent={setSelectedAgent}
        quickFilter={quickFilter}
        onQuickFilter={setQuickFilter}
        viewMode={viewMode}
        onSpawned={() => { setRefreshing(true); fetchData(); }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mobile Layout
// ─────────────────────────────────────────────────────────────────────────────

function MobileMissionControl({ agents, runs, notifications, selectedAgent, onSelectAgent, quickFilter, onQuickFilter, viewMode, onSpawned }) {
  const [tab, setTab] = useState('missions');

  const tabs = [
    { id: 'agents', label: 'AGENTS', count: agents.length },
    { id: 'missions', label: 'MISSIONS', count: runs.length },
    { id: 'feed', label: 'FEED', count: null },
    { id: 'spawn', label: 'SPAWN', count: null },
  ];

  return (
    <div className="flex flex-col flex-1 md:hidden">
      <div className="flex gap-1 border-b border-white/[0.06] px-2">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-2 text-[10px] font-mono font-medium uppercase tracking-wider border-b-2 transition-colors ${
              tab === t.id
                ? 'border-[--cyan] text-[--cyan]'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label} {t.count !== null && <span className="text-muted-foreground">({t.count})</span>}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {tab === 'agents' && (
          <div className="flex flex-col gap-1">
            <button
              onClick={() => { onSelectAgent(null); setTab('missions'); }}
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-left transition-colors ${
                selectedAgent === null ? 'bg-[--cyan]/10 text-[--cyan]' : 'hover:bg-white/[0.04]'
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-[--cyan]" />
              <span className="text-xs font-mono">All Agents</span>
            </button>
            {agents.map(agent => {
              const codename = agent.codename || agent.name || agent.id;
              const avatarColor = getAgentColor(codename.toLowerCase());
              return (
                <button
                  key={agent.id}
                  onClick={() => { onSelectAgent(agent.id); setTab('missions'); }}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-left transition-colors ${
                    selectedAgent === agent.id ? 'bg-[--cyan]/10 text-[--cyan]' : 'hover:bg-white/[0.04]'
                  }`}
                >
                  <div
                    className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[9px] font-mono font-bold text-black"
                    style={{ backgroundColor: avatarColor }}
                  >
                    {codename.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="text-xs font-mono font-medium block">@{codename.toUpperCase()}</span>
                    {agent.role && <span className="text-[10px] font-mono text-muted-foreground block">{agent.role}</span>}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {tab === 'missions' && (
          <div className="flex flex-col gap-3">
            {/* Quick filters on mobile */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {QUICK_FILTERS.map(filter => (
                <button
                  key={filter.id}
                  onClick={() => onQuickFilter(filter.id)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-medium border transition-colors ${
                    quickFilter === filter.id
                      ? 'bg-[--cyan]/10 text-[--cyan] border-[--cyan]/20'
                      : 'border-white/[0.06] text-muted-foreground hover:text-foreground hover:border-white/[0.12]'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <MissionQueue
              runs={runs}
              agents={agents}
              selectedAgent={selectedAgent}
              quickFilter={quickFilter}
              viewMode={viewMode}
            />
          </div>
        )}

        {tab === 'feed' && (
          <LiveFeed runs={runs} notifications={notifications} collapsed={false} onToggleCollapse={() => {}} />
        )}

        {tab === 'spawn' && (
          <QuickSpawn agents={agents} onSpawned={onSpawned} />
        )}
      </div>
    </div>
  );
}
