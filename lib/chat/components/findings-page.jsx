'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldIcon, PlusIcon, ChevronDownIcon, SpinnerIcon } from './icons.js';
import { getFindings, createFinding, updateFinding, deleteFinding, getFindingCounts } from '../../bounty/actions.js';

const SEVERITY_CONFIG = {
  critical: { bg: 'bg-red-600/15', text: 'text-red-500', border: 'border-red-500/20', dot: 'bg-red-500', glow: 'shadow-[0_0_20px_oklch(0.6_0.22_25/20%)]', label: 'Critical' },
  high: { bg: 'bg-orange-500/15', text: 'text-orange-500', border: 'border-orange-500/20', dot: 'bg-orange-500', glow: 'shadow-[0_0_20px_oklch(0.7_0.17_55/20%)]', label: 'High' },
  medium: { bg: 'bg-yellow-500/15', text: 'text-yellow-500', border: 'border-yellow-500/20', dot: 'bg-yellow-500', glow: '', label: 'Medium' },
  low: { bg: 'bg-blue-500/15', text: 'text-blue-500', border: 'border-blue-500/20', dot: 'bg-blue-500', glow: '', label: 'Low' },
  info: { bg: 'bg-white/5', text: 'text-muted-foreground', border: 'border-white/10', dot: 'bg-muted-foreground', glow: '', label: 'Info' },
};

const STATUS_FLOW = ['new', 'triaging', 'confirmed', 'reported', 'duplicate', 'resolved', 'bounty_paid'];
const STATUS_COLORS = {
  new: { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/20' },
  triaging: { bg: 'bg-yellow-500/10', text: 'text-yellow-500', border: 'border-yellow-500/20' },
  confirmed: { bg: 'bg-green-500/10', text: 'text-green-500', border: 'border-green-500/20' },
  reported: { bg: 'bg-purple-500/10', text: 'text-purple-500', border: 'border-purple-500/20' },
  duplicate: { bg: 'bg-white/5', text: 'text-muted-foreground', border: 'border-white/10' },
  resolved: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/20' },
  bounty_paid: { bg: 'bg-green-600/10', text: 'text-green-600', border: 'border-green-600/20' },
};

const FINDING_TYPES = ['xss', 'sqli', 'ssrf', 'idor', 'rce', 'lfi', 'open_redirect', 'subdomain_takeover', 'info_disclosure', 'misconfig', 'auth_bypass', 'rate_limit', 'cors', 'xxe', 'csrf', 'other'];

function timeAgo(ts) {
  if (!ts) return '';
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function StatsBar({ counts }) {
  if (!counts) return null;
  const stats = [
    { label: 'Total', value: counts.total, text: 'text-[--cyan]', glow: 'glow-cyan' },
    { label: 'Critical', value: counts.critical, text: 'text-red-500', glow: counts.critical > 0 ? 'shadow-[0_0_20px_oklch(0.6_0.22_25/15%)]' : '' },
    { label: 'High', value: counts.high, text: 'text-orange-500', glow: counts.high > 0 ? 'shadow-[0_0_20px_oklch(0.7_0.17_55/15%)]' : '' },
    { label: 'Confirmed', value: counts.confirmed, text: 'text-green-500', glow: '' },
    { label: 'Reported', value: counts.reported, text: 'text-purple-500', glow: '' },
    { label: 'Bounty', value: counts.totalBounty > 0 ? `$${counts.totalBounty.toLocaleString()}` : '$0', text: 'text-emerald-500', glow: counts.totalBounty > 0 ? 'shadow-[0_0_20px_oklch(0.7_0.17_160/15%)]' : '' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: i * 0.05 }}
          className={`rounded-lg border border-white/[0.06] bg-[--card] p-3 ${s.glow}`}
        >
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">{s.label}</p>
          <p className={`text-xl font-mono font-semibold mt-0.5 ${s.text}`}>{s.value}</p>
        </motion.div>
      ))}
    </div>
  );
}

function FindingCard({ finding, onUpdate, onDelete, index }) {
  const [expanded, setExpanded] = useState(false);
  const sev = SEVERITY_CONFIG[finding.severity] || SEVERITY_CONFIG.info;
  const st = STATUS_COLORS[finding.status] || STATUS_COLORS.new;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.03 }}
      className={`rounded-lg border border-white/[0.06] bg-[--card] hover:border-[--cyan]/20 transition-all ${sev.glow}`}
    >
      <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-3 w-full text-left p-4 hover:bg-white/[0.02] rounded-lg transition-colors">
        <div className={`shrink-0 w-2.5 h-2.5 rounded-full ${sev.dot}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-mono font-medium truncate">{finding.title}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-mono font-medium border ${sev.bg} ${sev.text} ${sev.border}`}>{sev.label}</span>
            <span className="inline-flex rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] font-mono font-medium text-muted-foreground">{finding.type}</span>
            {finding.agentId && <span className="inline-flex rounded-full bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 text-[10px] font-mono font-medium text-purple-500">{finding.agentId}</span>}
            <span className="text-[10px] font-mono text-muted-foreground">{timeAgo(finding.createdAt)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <select
            value={finding.status}
            onClick={e => e.stopPropagation()}
            onChange={e => { e.stopPropagation(); onUpdate(finding.id, { status: e.target.value }); }}
            className={`text-[10px] font-mono font-medium rounded-full px-2 py-0.5 border cursor-pointer bg-transparent ${st.bg} ${st.text} ${st.border} focus:outline-none`}
          >
            {STATUS_FLOW.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
          <span className={`transition-transform ${expanded ? 'rotate-180' : ''}`}><ChevronDownIcon size={14} /></span>
        </div>
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
            <div className="border-t border-white/[0.06] px-4 py-3 flex flex-col gap-3">
              {finding.description && (
                <div>
                  <p className="text-[10px] font-mono font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Description</p>
                  <p className="text-xs font-mono whitespace-pre-wrap text-foreground/80">{finding.description}</p>
                </div>
              )}
              {finding.stepsToReproduce && (
                <div>
                  <p className="text-[10px] font-mono font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Steps to Reproduce</p>
                  <pre className="text-[11px] bg-black/30 border border-white/[0.04] rounded-md p-3 whitespace-pre-wrap break-words font-mono overflow-auto max-h-48 text-foreground/80 scrollbar-thin">{finding.stepsToReproduce}</pre>
                </div>
              )}
              {finding.impact && (
                <div>
                  <p className="text-[10px] font-mono font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Impact</p>
                  <p className="text-xs font-mono text-foreground/80">{finding.impact}</p>
                </div>
              )}
              {finding.rawOutput && (
                <div>
                  <p className="text-[10px] font-mono font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Raw Output</p>
                  <pre className="text-[11px] bg-black/30 border border-white/[0.04] rounded-md p-3 whitespace-pre-wrap break-words font-mono overflow-auto max-h-32 text-foreground/80 scrollbar-thin">{finding.rawOutput}</pre>
                </div>
              )}
              <div className="flex items-center gap-2 pt-1">
                {finding.bountyAmount > 0 && <span className="inline-flex rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-mono font-medium">${finding.bountyAmount}</span>}
                {finding.reportUrl && <a href={finding.reportUrl} target="_blank" rel="noopener" className="text-[10px] font-mono text-[--cyan] hover:underline">View Report</a>}
                <div className="flex-1" />
                <button onClick={() => onDelete(finding.id)} className="text-[10px] font-mono text-muted-foreground hover:text-[--destructive] transition-colors">Delete</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function FindingsPage() {
  const [findings_, setFindings] = useState([]);
  const [counts, setCounts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [newFinding, setNewFinding] = useState({ title: '', severity: 'medium', type: 'xss', description: '' });

  async function load() {
    const [f, c] = await Promise.all([getFindings(), getFindingCounts()]);
    setFindings(f);
    setCounts(c);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleCreate() {
    if (!newFinding.title) return;
    await createFinding(newFinding);
    setNewFinding({ title: '', severity: 'medium', type: 'xss', description: '' });
    setShowAdd(false);
    load();
  }

  async function handleUpdate(id, data) { await updateFinding(id, data); load(); }
  async function handleDelete(id) { await deleteFinding(id); load(); }

  const filtered = filter === 'all' ? findings_ : findings_.filter(f => f.severity === filter);

  if (loading) return <div className="flex flex-col gap-3">{[...Array(4)].map((_, i) => <div key={i} className="h-16 animate-pulse rounded-lg bg-white/[0.04] border border-white/[0.06]" />)}</div>;

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-mono font-semibold text-[--cyan] text-glow-cyan">Findings</h1>
          <p className="text-[11px] text-muted-foreground mt-1 font-mono">Vulnerability discoveries across all agents and tools</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-mono font-medium bg-[--cyan] text-[--primary-foreground] hover:opacity-90 transition-opacity"
        >
          <PlusIcon size={12} /> New Finding
        </button>
      </div>

      <StatsBar counts={counts} />

      {/* Add form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="rounded-lg border border-white/[0.06] bg-[--card] p-4 mb-4 flex flex-col gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input placeholder="Title" value={newFinding.title} onChange={e => setNewFinding({ ...newFinding, title: e.target.value })} className="text-sm border border-white/[0.06] rounded-md px-3 py-2 bg-black/20 col-span-1 sm:col-span-3 font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:border-[--cyan]/40 focus:ring-1 focus:ring-[--cyan]/20 transition-colors" />
                <select value={newFinding.severity} onChange={e => setNewFinding({ ...newFinding, severity: e.target.value })} className="text-sm border border-white/[0.06] rounded-md px-3 py-2 bg-black/20 font-mono focus:outline-none focus:border-[--cyan]/40 transition-colors">
                  {Object.keys(SEVERITY_CONFIG).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select value={newFinding.type} onChange={e => setNewFinding({ ...newFinding, type: e.target.value })} className="text-sm border border-white/[0.06] rounded-md px-3 py-2 bg-black/20 font-mono focus:outline-none focus:border-[--cyan]/40 transition-colors">
                  {FINDING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <textarea placeholder="Description..." value={newFinding.description} onChange={e => setNewFinding({ ...newFinding, description: e.target.value })} className="text-sm border border-white/[0.06] rounded-md px-3 py-2 bg-black/20 min-h-[80px] font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:border-[--cyan]/40 focus:ring-1 focus:ring-[--cyan]/20 transition-colors" />
              <div className="flex gap-2">
                <button onClick={handleCreate} className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-mono font-medium bg-[--cyan] text-[--primary-foreground] hover:opacity-90 transition-opacity">Save</button>
                <button onClick={() => setShowAdd(false)} className="text-xs font-mono text-muted-foreground hover:text-foreground px-3 py-1.5 transition-colors">Cancel</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter tabs */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto scrollbar-thin">
        {['all', ...Object.keys(SEVERITY_CONFIG)].map(f => {
          const isActive = filter === f;
          const sev = SEVERITY_CONFIG[f];
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`shrink-0 px-3 py-1 rounded-full text-[10px] font-mono font-medium border transition-colors ${
                isActive
                  ? f === 'all'
                    ? 'bg-[--cyan]/10 text-[--cyan] border-[--cyan]/20'
                    : `${sev.bg} ${sev.text} ${sev.border}`
                  : 'border-white/[0.06] text-muted-foreground hover:text-foreground hover:border-white/[0.12]'
              }`}
            >
              {f === 'all' ? `All (${findings_.length})` : `${sev.label} (${findings_.filter(x => x.severity === f).length})`}
            </button>
          );
        })}
      </div>

      {/* Findings list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-white/[0.04] border border-white/[0.06] p-4 mb-4"><ShieldIcon size={24} /></div>
          <p className="text-sm font-mono font-medium mb-1">No findings yet</p>
          <p className="text-[11px] font-mono text-muted-foreground max-w-sm">Findings will appear here as your agents discover vulnerabilities, or add them manually.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((f, i) => <FindingCard key={f.id} finding={f} onUpdate={handleUpdate} onDelete={handleDelete} index={i} />)}
        </div>
      )}
    </>
  );
}
