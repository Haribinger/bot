'use client';

import { useState, useEffect } from 'react';
import { ShieldIcon, PlusIcon, ChevronDownIcon, SpinnerIcon } from './icons.js';
import { getFindings, createFinding, updateFinding, deleteFinding, getFindingCounts } from '../../bounty/actions.js';

const SEVERITY_CONFIG = {
  critical: { color: 'bg-red-600/15 text-red-500 border-red-500/20', dot: 'bg-red-500', label: 'Critical' },
  high: { color: 'bg-orange-500/15 text-orange-500 border-orange-500/20', dot: 'bg-orange-500', label: 'High' },
  medium: { color: 'bg-yellow-500/15 text-yellow-500 border-yellow-500/20', dot: 'bg-yellow-500', label: 'Medium' },
  low: { color: 'bg-blue-500/15 text-blue-500 border-blue-500/20', dot: 'bg-blue-500', label: 'Low' },
  info: { color: 'bg-muted text-muted-foreground border-border', dot: 'bg-muted-foreground', label: 'Info' },
};

const STATUS_FLOW = ['new', 'triaging', 'confirmed', 'reported', 'duplicate', 'resolved', 'bounty_paid'];
const STATUS_COLORS = {
  new: 'bg-blue-500/10 text-blue-500',
  triaging: 'bg-yellow-500/10 text-yellow-500',
  confirmed: 'bg-green-500/10 text-green-500',
  reported: 'bg-purple-500/10 text-purple-500',
  duplicate: 'bg-muted text-muted-foreground',
  resolved: 'bg-emerald-500/10 text-emerald-500',
  bounty_paid: 'bg-green-600/10 text-green-600',
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
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
      {[
        { label: 'Total', value: counts.total, color: 'text-foreground' },
        { label: 'Critical', value: counts.critical, color: 'text-red-500' },
        { label: 'High', value: counts.high, color: 'text-orange-500' },
        { label: 'Confirmed', value: counts.confirmed, color: 'text-green-500' },
        { label: 'Reported', value: counts.reported, color: 'text-purple-500' },
        { label: 'Bounty', value: counts.totalBounty > 0 ? `$${counts.totalBounty.toLocaleString()}` : '$0', color: 'text-emerald-500' },
      ].map(s => (
        <div key={s.label} className="rounded-lg border bg-card p-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{s.label}</p>
          <p className={`text-xl font-semibold mt-0.5 ${s.color}`}>{s.value}</p>
        </div>
      ))}
    </div>
  );
}

function FindingCard({ finding, onUpdate, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const sev = SEVERITY_CONFIG[finding.severity] || SEVERITY_CONFIG.info;

  return (
    <div className={`rounded-lg border bg-card ${sev.color.split(' ')[0].replace('/15', '/5').replace('/10', '/5')}`}>
      <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-3 w-full text-left p-4 hover:bg-accent/30 rounded-lg">
        <div className={`shrink-0 w-2 h-2 rounded-full ${sev.dot}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{finding.title}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium border ${sev.color}`}>{sev.label}</span>
            <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{finding.type}</span>
            {finding.agentId && <span className="inline-flex rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-medium text-purple-500">{finding.agentId}</span>}
            <span className="text-[10px] text-muted-foreground">{timeAgo(finding.createdAt)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <select
            value={finding.status}
            onClick={e => e.stopPropagation()}
            onChange={e => { e.stopPropagation(); onUpdate(finding.id, { status: e.target.value }); }}
            className={`text-[10px] font-medium rounded-full px-2 py-0.5 border-0 cursor-pointer ${STATUS_COLORS[finding.status] || ''}`}
          >
            {STATUS_FLOW.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
          <span className={`transition-transform ${expanded ? 'rotate-180' : ''}`}><ChevronDownIcon size={14} /></span>
        </div>
      </button>

      {expanded && (
        <div className="border-t px-4 py-3 flex flex-col gap-3">
          {finding.description && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Description</p>
              <p className="text-xs whitespace-pre-wrap">{finding.description}</p>
            </div>
          )}
          {finding.stepsToReproduce && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Steps to Reproduce</p>
              <pre className="text-xs bg-muted rounded-md p-3 whitespace-pre-wrap break-words font-mono overflow-auto max-h-48">{finding.stepsToReproduce}</pre>
            </div>
          )}
          {finding.impact && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Impact</p>
              <p className="text-xs">{finding.impact}</p>
            </div>
          )}
          {finding.rawOutput && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Raw Output</p>
              <pre className="text-xs bg-muted rounded-md p-3 whitespace-pre-wrap break-words font-mono overflow-auto max-h-32">{finding.rawOutput}</pre>
            </div>
          )}
          <div className="flex items-center gap-2">
            {finding.bountyAmount > 0 && <span className="inline-flex rounded-full bg-emerald-500/10 text-emerald-500 px-2 py-0.5 text-[10px] font-medium">${finding.bountyAmount}</span>}
            {finding.reportUrl && <a href={finding.reportUrl} target="_blank" rel="noopener" className="text-[10px] text-blue-500 hover:underline">View Report</a>}
            <div className="flex-1" />
            <button onClick={() => onDelete(finding.id)} className="text-[10px] text-muted-foreground hover:text-destructive">Delete</button>
          </div>
        </div>
      )}
    </div>
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

  if (loading) return <div className="flex flex-col gap-3">{[...Array(4)].map((_, i) => <div key={i} className="h-16 animate-pulse rounded-lg bg-border/50" />)}</div>;

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold">Findings</h1>
          <p className="text-sm text-muted-foreground mt-1">Vulnerability discoveries across all agents and tools</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium bg-foreground text-background hover:opacity-90">
          <PlusIcon size={12} /> New Finding
        </button>
      </div>

      <StatsBar counts={counts} />

      {/* Add form */}
      {showAdd && (
        <div className="rounded-lg border bg-card p-4 mb-4 flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input placeholder="Title" value={newFinding.title} onChange={e => setNewFinding({ ...newFinding, title: e.target.value })} className="text-sm border rounded-md px-3 py-2 bg-background col-span-1 sm:col-span-3" />
            <select value={newFinding.severity} onChange={e => setNewFinding({ ...newFinding, severity: e.target.value })} className="text-sm border rounded-md px-3 py-2 bg-background">
              {Object.keys(SEVERITY_CONFIG).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={newFinding.type} onChange={e => setNewFinding({ ...newFinding, type: e.target.value })} className="text-sm border rounded-md px-3 py-2 bg-background">
              {FINDING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <textarea placeholder="Description..." value={newFinding.description} onChange={e => setNewFinding({ ...newFinding, description: e.target.value })} className="text-sm border rounded-md px-3 py-2 bg-background min-h-[80px]" />
          <div className="flex gap-2">
            <button onClick={handleCreate} className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium bg-foreground text-background hover:opacity-90">Save</button>
            <button onClick={() => setShowAdd(false)} className="text-xs text-muted-foreground hover:text-foreground px-3 py-1.5">Cancel</button>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto">
        {['all', ...Object.keys(SEVERITY_CONFIG)].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filter === f ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
            {f === 'all' ? `All (${findings_.length})` : `${SEVERITY_CONFIG[f].label} (${findings_.filter(x => x.severity === f).length})`}
          </button>
        ))}
      </div>

      {/* Findings list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-muted p-4 mb-4"><ShieldIcon size={24} /></div>
          <p className="text-sm font-medium mb-1">No findings yet</p>
          <p className="text-xs text-muted-foreground max-w-sm">Findings will appear here as your agents discover vulnerabilities, or add them manually.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">{filtered.map(f => <FindingCard key={f.id} finding={f} onUpdate={handleUpdate} onDelete={handleDelete} />)}</div>
      )}
    </>
  );
}
