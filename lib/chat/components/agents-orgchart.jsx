'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UsersIcon, ChevronDownIcon, ChevronRightIcon } from './icons.js';

// ─────────────────────────────────────────────────────────────────────────────
// Avatar color palette — deterministic by codename initial
// ─────────────────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  'bg-[--cyan]/20 text-[--cyan] border-[--cyan]/30',
  'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'bg-pink-500/20 text-pink-400 border-pink-500/30',
  'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'bg-red-500/20 text-red-400 border-red-500/30',
];

function avatarColor(codename) {
  const idx = (codename || 'A').charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

// ─────────────────────────────────────────────────────────────────────────────
// ConnectorLines — pure div-based connector between parent and children row
// ─────────────────────────────────────────────────────────────────────────────

function ConnectorLines({ childCount, childWidths, nodeWidth }) {
  if (childCount === 0) return null;

  // Vertical stem down from parent
  return (
    <div className="flex flex-col items-center w-full pointer-events-none select-none">
      {/* Vertical line down from parent node */}
      <div className="w-px h-5 bg-white/[0.12]" />
      {/* Horizontal bar spanning children — only drawn when >1 child */}
      {childCount > 1 && (
        <div className="h-px bg-white/[0.12] w-full" />
      )}
    </div>
  );
}

function ChildConnector() {
  // Vertical line from horizontal bar up into the child node
  return (
    <div className="flex justify-center pointer-events-none select-none">
      <div className="w-px h-5 bg-white/[0.12]" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// OrgChartNode
// ─────────────────────────────────────────────────────────────────────────────

function OrgChartNode({ agent, isSelected, hasChildren, isCollapsed, onSelect, onToggleCollapse }) {
  const codename = (agent.codename || agent.id || '').toUpperCase();
  const initial = codename.charAt(0) || '?';
  const colorClass = avatarColor(initial);
  const isActive = agent.status === 'active';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`
        relative rounded-lg border bg-[--card] cursor-pointer transition-all duration-200
        w-44 shrink-0
        ${isSelected
          ? 'border-[--cyan]/50 shadow-[0_0_18px_oklch(0.7_0.2_200/18%)]'
          : 'border-white/[0.06] hover:border-[--cyan]/20 hover:shadow-[0_0_12px_oklch(0.7_0.2_200/8%)]'
        }
      `}
      onClick={() => onSelect(agent)}
    >
      {/* Active glow strip */}
      {isActive && (
        <div className="absolute inset-x-0 top-0 h-px rounded-t-lg bg-gradient-to-r from-transparent via-green-500/60 to-transparent" />
      )}

      <div className="p-3 flex flex-col gap-2">
        {/* Top row: avatar + status dot */}
        <div className="flex items-start justify-between gap-2">
          <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-mono font-bold shrink-0 ${colorClass}`}>
            {initial}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            {/* Status indicator */}
            <div className={`w-2 h-2 rounded-full shrink-0 ${isActive ? 'bg-green-500 shadow-[0_0_6px_rgb(34,197,94)]' : 'bg-white/20'}`} />
            {isActive && <div className="absolute w-2 h-2 rounded-full bg-green-500/30 animate-ping" style={{ right: 12, top: 14 }} />}
          </div>
        </div>

        {/* Codename */}
        <div>
          <p className="text-[11px] font-mono font-semibold text-[--cyan] leading-tight truncate">
            @{codename}
          </p>
          {agent.name && agent.name !== agent.codename && (
            <p className="text-[10px] font-mono text-foreground/60 truncate mt-0.5">{agent.name}</p>
          )}
        </div>

        {/* Role */}
        {agent.role && (
          <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider truncate">
            {agent.role}
          </p>
        )}

        {/* Specialization badge */}
        {agent.specialization && (
          <span className="inline-flex self-start rounded border border-white/[0.06] bg-white/[0.04] px-1.5 py-0.5 text-[9px] font-mono text-foreground/50 truncate max-w-full">
            {agent.specialization}
          </span>
        )}

        {/* Handoff targets */}
        {agent.config?.handoff_to?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-0.5">
            {agent.config.handoff_to.slice(0, 3).map(target => (
              <span
                key={target}
                className="inline-flex rounded border border-[--cyan]/15 bg-[--cyan]/5 px-1 py-0.5 text-[8px] font-mono text-[--cyan]/70 truncate"
              >
                -{target.toUpperCase()}
              </span>
            ))}
            {agent.config.handoff_to.length > 3 && (
              <span className="inline-flex rounded border border-white/[0.06] bg-white/[0.03] px-1 py-0.5 text-[8px] font-mono text-muted-foreground">
                +{agent.config.handoff_to.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Expand/collapse toggle — shown when node has children */}
      {hasChildren && (
        <button
          onClick={e => { e.stopPropagation(); onToggleCollapse(agent.id); }}
          className="flex items-center justify-center w-full border-t border-white/[0.06] py-1 text-muted-foreground hover:text-foreground hover:bg-white/[0.03] transition-colors rounded-b-lg"
          title={isCollapsed ? 'Expand' : 'Collapse'}
        >
          {isCollapsed
            ? <ChevronRightIcon size={11} />
            : <ChevronDownIcon size={11} />
          }
        </button>
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// OrgChartTree — recursive flexbox tree
// ─────────────────────────────────────────────────────────────────────────────

function OrgChartTree({ agent, childrenMap, selectedId, collapsedIds, onSelect, onToggleCollapse, depth = 0 }) {
  const children = childrenMap[agent.id] || [];
  const hasChildren = children.length > 0;
  const isCollapsed = collapsedIds.has(agent.id);
  const isSelected = selectedId === agent.id;

  return (
    <div className="flex flex-col items-center" style={{ minWidth: 176 }}>
      {/* The node itself */}
      <OrgChartNode
        agent={agent}
        isSelected={isSelected}
        hasChildren={hasChildren}
        isCollapsed={isCollapsed}
        onSelect={onSelect}
        onToggleCollapse={onToggleCollapse}
      />

      {/* Children subtree */}
      <AnimatePresence>
        {hasChildren && !isCollapsed && (
          <motion.div
            key="children"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }}
            className="flex flex-col items-center w-full overflow-hidden"
          >
            {/* Connector from parent down */}
            <ConnectorLines childCount={children.length} />

            {/* Children row */}
            <div className="flex flex-row items-start gap-8 relative">
              {children.map((child, idx) => (
                <div key={child.id} className="flex flex-col items-center">
                  {/* Vertical stub up into child */}
                  {children.length > 1 && <ChildConnector />}
                  <OrgChartTree
                    agent={child}
                    childrenMap={childrenMap}
                    selectedId={selectedId}
                    collapsedIds={collapsedIds}
                    onSelect={onSelect}
                    onToggleCollapse={onToggleCollapse}
                    depth={depth + 1}
                  />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Flat grid fallback — when no hierarchy is defined
// ─────────────────────────────────────────────────────────────────────────────

function FlatGrid({ agents, selectedId, onSelect }) {
  return (
    <div className="flex flex-wrap gap-5 justify-center p-8">
      {agents.map((agent, i) => (
        <motion.div
          key={agent.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: i * 0.04 }}
        >
          <OrgChartNode
            agent={agent}
            isSelected={selectedId === agent.id}
            hasChildren={false}
            isCollapsed={false}
            onSelect={onSelect}
            onToggleCollapse={() => {}}
          />
        </motion.div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Agent detail panel — shown when a node is selected
// ─────────────────────────────────────────────────────────────────────────────

function AgentDetailPanel({ agent, onClose }) {
  if (!agent) return null;

  const codename = (agent.codename || agent.id || '').toUpperCase();
  const isActive = agent.status === 'active';

  return (
    <motion.div
      key={agent.id}
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16 }}
      transition={{ duration: 0.2 }}
      className="w-72 shrink-0 rounded-xl border border-white/[0.06] bg-[--card] overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-[--cyan]/5">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 shadow-[0_0_6px_rgb(34,197,94)]' : 'bg-white/20'}`} />
          <span className="text-xs font-mono font-semibold text-[--cyan]">@{codename}</span>
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors text-lg leading-none font-mono"
        >
          x
        </button>
      </div>

      <div className="p-4 flex flex-col gap-3">
        {/* Status badge */}
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[10px] font-mono font-medium ${
            isActive
              ? 'bg-green-500/10 text-green-400 border-green-500/20'
              : 'bg-white/5 text-muted-foreground border-white/10'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-500' : 'bg-white/30'}`} />
            {isActive ? 'Active' : 'Idle'}
          </span>
        </div>

        {/* Fields */}
        {[
          { label: 'Name', value: agent.name },
          { label: 'Role', value: agent.role },
          { label: 'Specialization', value: agent.specialization },
          { label: 'Reports to', value: agent.config?.reports_to ? `@${agent.config.reports_to.toUpperCase()}` : null },
        ].filter(f => f.value).map(field => (
          <div key={field.label}>
            <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider mb-0.5">{field.label}</p>
            <p className="text-xs font-mono text-foreground/80">{field.value}</p>
          </div>
        ))}

        {/* Handoff targets */}
        {agent.config?.handoff_to?.length > 0 && (
          <div>
            <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider mb-1.5">Hands off to</p>
            <div className="flex flex-wrap gap-1.5">
              {agent.config.handoff_to.map(target => (
                <span
                  key={target}
                  className="inline-flex rounded border border-[--cyan]/20 bg-[--cyan]/8 px-1.5 py-0.5 text-[10px] font-mono text-[--cyan]/80"
                >
                  @{target.toUpperCase()}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// OrgChartView — main export
// ─────────────────────────────────────────────────────────────────────────────

const ZOOM_LEVELS = [0.5, 0.65, 0.8, 1, 1.2, 1.4, 1.6];
const DEFAULT_ZOOM_IDX = 3; // 1.0

export function OrgChartView({ agents = [] }) {
  const [zoomIdx, setZoomIdx] = useState(DEFAULT_ZOOM_IDX);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [collapsedIds, setCollapsedIds] = useState(new Set());
  const scrollRef = useRef(null);

  const zoom = ZOOM_LEVELS[zoomIdx];

  // ── Build the tree ─────────────────────────────────────────────────────────
  // Index agents by codename (case-insensitive) for O(1) lookup
  const byCodename = {};
  for (const agent of agents) {
    const key = (agent.codename || agent.id || '').toLowerCase();
    byCodename[key] = agent;
  }

  // Build children map keyed by parent agent id
  const childrenMap = {};
  const childIds = new Set();

  for (const agent of agents) {
    const reportsTo = agent.config?.reports_to;
    if (reportsTo) {
      const parent = byCodename[reportsTo.toLowerCase()];
      if (parent) {
        if (!childrenMap[parent.id]) childrenMap[parent.id] = [];
        childrenMap[parent.id].push(agent);
        childIds.add(agent.id);
      }
    }
  }

  // Roots = agents not listed as any agent's child
  const roots = agents.filter(a => !childIds.has(a.id));

  // Detect whether a real hierarchy exists
  const hasHierarchy = childIds.size > 0;

  // ── Interaction handlers ───────────────────────────────────────────────────
  const handleSelect = useCallback((agent) => {
    setSelectedAgent(prev => prev?.id === agent.id ? null : agent);
  }, []);

  const handleToggleCollapse = useCallback((agentId) => {
    setCollapsedIds(prev => {
      const next = new Set(prev);
      if (next.has(agentId)) next.delete(agentId);
      else next.add(agentId);
      return next;
    });
  }, []);

  const zoomIn = () => setZoomIdx(i => Math.min(i + 1, ZOOM_LEVELS.length - 1));
  const zoomOut = () => setZoomIdx(i => Math.max(i - 1, 0));
  const resetZoom = () => setZoomIdx(DEFAULT_ZOOM_IDX);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const activeCount = agents.filter(a => a.status === 'active').length;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full font-mono">
      {/* ── Toolbar ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-3">
          <UsersIcon size={14} className="text-[--cyan]" />
          <h2 className="text-sm font-mono font-semibold text-[--cyan]">Command Hierarchy</h2>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded border border-[--cyan]/20 bg-[--cyan]/8 px-2 py-0.5 text-[10px] font-mono text-[--cyan]">
              {agents.length} agent{agents.length !== 1 ? 's' : ''}
            </span>
            {activeCount > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded border border-green-500/20 bg-green-500/10 px-2 py-0.5 text-[10px] font-mono text-green-400">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                {activeCount} active
              </span>
            )}
          </div>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={zoomOut}
            disabled={zoomIdx === 0}
            className="w-7 h-7 rounded border border-white/[0.06] bg-[--card] text-muted-foreground hover:text-foreground hover:border-[--cyan]/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center text-sm"
            title="Zoom out"
          >
            -
          </button>
          <button
            onClick={resetZoom}
            className="h-7 px-2 rounded border border-white/[0.06] bg-[--card] text-[10px] font-mono text-muted-foreground hover:text-foreground hover:border-[--cyan]/20 transition-all"
            title="Reset zoom"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={zoomIn}
            disabled={zoomIdx === ZOOM_LEVELS.length - 1}
            className="w-7 h-7 rounded border border-white/[0.06] bg-[--card] text-muted-foreground hover:text-foreground hover:border-[--cyan]/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center text-sm"
            title="Zoom in"
          >
            +
          </button>
          {collapsedIds.size > 0 && (
            <button
              onClick={() => setCollapsedIds(new Set())}
              className="h-7 px-2 rounded border border-white/[0.06] bg-[--card] text-[10px] font-mono text-muted-foreground hover:text-foreground hover:border-[--cyan]/20 transition-all ml-1"
              title="Expand all"
            >
              Expand all
            </button>
          )}
        </div>
      </div>

      {/* ── Main area ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Chart scroll area */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-auto scrollbar-thin"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, oklch(0.22 0.04 240 / 40%) 0%, transparent 70%)' }}
        >
          {agents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center p-12">
              <UsersIcon size={32} className="text-muted-foreground/30" />
              <p className="text-sm font-mono text-muted-foreground">No agents configured</p>
              <p className="text-[11px] font-mono text-muted-foreground/60">
                Create agent profiles to visualize the command hierarchy.
              </p>
            </div>
          ) : !hasHierarchy ? (
            /* Flat grid — no reports_to relationships defined */
            <div
              style={{ transform: `scale(${zoom})`, transformOrigin: 'top center', transition: 'transform 0.2s ease' }}
            >
              <div className="py-4">
                <div className="text-center mb-4">
                  <span className="inline-flex rounded border border-white/[0.06] bg-white/[0.03] px-3 py-1 text-[10px] font-mono text-muted-foreground">
                    No hierarchy defined — showing flat roster
                  </span>
                </div>
                <FlatGrid
                  agents={agents}
                  selectedId={selectedAgent?.id}
                  onSelect={handleSelect}
                />
              </div>
            </div>
          ) : (
            /* Tree layout */
            <div
              style={{ transform: `scale(${zoom})`, transformOrigin: 'top center', transition: 'transform 0.2s ease' }}
              className="py-8 px-8 inline-block min-w-full"
            >
              {/* Scanline grid overlay for cyber aesthetic */}
              <div
                className="absolute inset-0 pointer-events-none opacity-[0.015]"
                style={{
                  backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 23px, rgba(255,255,255,0.3) 24px)',
                  zIndex: 0,
                }}
              />

              <div className="relative flex flex-col items-center gap-0" style={{ zIndex: 1 }}>
                {roots.map((root, i) => (
                  <div key={root.id} className={i > 0 ? 'mt-12' : ''}>
                    {/* Separator label between disconnected trees */}
                    {i > 0 && (
                      <div className="flex items-center gap-3 mb-8">
                        <div className="flex-1 h-px bg-white/[0.06]" />
                        <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest">Independent tree</span>
                        <div className="flex-1 h-px bg-white/[0.06]" />
                      </div>
                    )}
                    <OrgChartTree
                      agent={root}
                      childrenMap={childrenMap}
                      selectedId={selectedAgent?.id}
                      collapsedIds={collapsedIds}
                      onSelect={handleSelect}
                      onToggleCollapse={handleToggleCollapse}
                      depth={0}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Detail panel — slides in when a node is selected */}
        <AnimatePresence>
          {selectedAgent && (
            <div className="shrink-0 border-l border-white/[0.06] p-4 overflow-y-auto scrollbar-thin">
              <AgentDetailPanel
                agent={selectedAgent}
                onClose={() => setSelectedAgent(null)}
              />
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Legend ────────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-5 px-4 py-2 border-t border-white/[0.06] shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_6px_rgb(34,197,94)]" />
          <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">Active</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-white/20" />
          <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">Idle</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-px bg-white/[0.12]" />
          <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">Reports to</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-px bg-[--cyan]/30" />
          <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">Handoff</span>
        </div>
        <div className="ml-auto text-[9px] font-mono text-muted-foreground/40 uppercase tracking-widest">
          Harbinger // Command Hierarchy
        </div>
      </div>
    </div>
  );
}
