'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CrosshairIcon, PlusIcon, TrashIcon, ChevronDownIcon, GlobeIcon, SpinnerIcon, DownloadIcon, CheckIcon, SearchIcon, CopyIcon, UploadIcon, FilterIcon } from './icons.js';
import { getPrograms, createProgram, deleteProgram, getTargets, createTarget, deleteTarget, updateTarget, syncTargetsFromPlatform, syncAllTargets, getSyncStatus, getProgramTargetCounts, bulkImportTargets, exportTargets } from '../../bounty/actions.js';

const PLATFORMS = [
  { id: 'hackerone', label: 'HackerOne', bg: 'bg-purple-500/10', text: 'text-purple-500', border: 'border-purple-500/20' },
  { id: 'bugcrowd', label: 'Bugcrowd', bg: 'bg-orange-500/10', text: 'text-orange-500', border: 'border-orange-500/20' },
  { id: 'intigriti', label: 'Intigriti', bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/20' },
  { id: 'yeswehack', label: 'YesWeHack', bg: 'bg-teal-500/10', text: 'text-teal-500', border: 'border-teal-500/20' },
  { id: 'federacy', label: 'Federacy', bg: 'bg-pink-500/10', text: 'text-pink-500', border: 'border-pink-500/20' },
  { id: 'custom', label: 'Custom', bg: 'bg-white/5', text: 'text-muted-foreground', border: 'border-white/10' },
];

const TARGET_TYPES = ['domain', 'wildcard', 'ip', 'cidr', 'url', 'api', 'mobile'];
const TYPE_ICONS = { domain: '\u{1f310}', wildcard: '*', ip: '\u{1f4cd}', cidr: '\u{1f5a7}', url: '\u{1f517}', api: '\u{2699}\u{fe0f}', mobile: '\u{1f4f1}' };
const STATUS_COLORS = {
  in_scope: { bg: 'bg-green-500/10', text: 'text-green-500', border: 'border-green-500/20', dot: 'bg-green-500' },
  out_of_scope: { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/20', dot: 'bg-red-500' },
  testing: { bg: 'bg-yellow-500/10', text: 'text-yellow-500', border: 'border-yellow-500/20', dot: 'bg-yellow-500 animate-pulse' },
  completed: { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/20', dot: 'bg-blue-500' },
};

function timeAgo(ts) {
  if (!ts) return 'never';
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function getPlatStyle(platformId) {
  return PLATFORMS.find(p => p.id === platformId) || PLATFORMS[5];
}

// ─── Copy Button ──────────────────────────────────────────────────────────────

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(text); } catch { /* fallback */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={handleCopy} className="shrink-0 p-1 text-muted-foreground hover:text-[--cyan] transition-colors" title="Copy">
      {copied ? <CheckIcon size={12} /> : <CopyIcon size={12} />}
    </button>
  );
}

// ─── Sync Panel ───────────────────────────────────────────────────────────────

function SyncPanel({ onSync, syncStatus }) {
  const [syncing, setSyncing] = useState(null);
  const [results, setResults] = useState(null);
  const [maxPrograms, setMaxPrograms] = useState('50');

  async function handleSync(platform) {
    setSyncing(platform);
    setResults(null);
    try {
      const opts = { maxPrograms: parseInt(maxPrograms) || 0 };
      let res;
      if (platform === 'all') {
        res = await onSync(null, opts);
      } else {
        res = await onSync(platform, opts);
      }
      setResults(res);
    } catch (err) {
      setResults({ error: err.message });
    }
    setSyncing(null);
  }

  const syncablePlatforms = PLATFORMS.filter(p => p.id !== 'custom');

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
      className="rounded-lg border border-white/[0.06] bg-[--card] p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <DownloadIcon size={14} />
            <h3 className="text-sm font-mono font-medium text-[--cyan]">Sync from Bounty Platforms</h3>
          </div>
          <p className="text-[11px] text-muted-foreground font-mono">Import programs and targets from bounty-targets-data</p>
        </div>
        {syncStatus?.lastSyncedAt && (
          <span className="text-[10px] text-muted-foreground font-mono">Last sync: {timeAgo(syncStatus.lastSyncedAt)}</span>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {syncablePlatforms.map(p => {
          const count = syncStatus?.platformCounts?.[p.id] || 0;
          return (
            <button key={p.id} onClick={() => handleSync(p.id)} disabled={syncing !== null}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-mono font-medium border transition-colors hover:bg-white/[0.04] disabled:opacity-50 ${p.border}`}>
              {syncing === p.id ? <SpinnerIcon size={12} /> : <DownloadIcon size={12} />}
              {p.label}
              {count > 0 && <span className={`inline-flex rounded-full px-1.5 py-0.5 text-[9px] font-mono ${p.bg} ${p.text}`}>{count}</span>}
            </button>
          );
        })}
        <button onClick={() => handleSync('all')} disabled={syncing !== null}
          className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-mono font-medium bg-[--cyan] text-[--primary-foreground] hover:opacity-90 disabled:opacity-50 transition-opacity">
          {syncing === 'all' ? <SpinnerIcon size={12} /> : <DownloadIcon size={12} />}
          Sync All
        </button>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <label className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Max programs:</label>
        <input type="number" value={maxPrograms} onChange={e => setMaxPrograms(e.target.value)}
          className="w-20 text-xs border border-white/[0.06] rounded-md px-2 py-1 bg-black/20 font-mono focus:outline-none focus:border-[--cyan]/40 transition-colors"
          min="0" placeholder="0 = all" />
        <span className="text-[10px] text-muted-foreground font-mono">(0 = unlimited)</span>
      </div>

      <AnimatePresence>
        {results && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="rounded-md bg-black/30 border border-white/[0.04] p-3 mt-2">
              {results.error ? (
                <p className="text-xs font-mono text-[--destructive]">{results.error}</p>
              ) : (
                <div className="flex flex-col gap-1">
                  {Object.entries(results).map(([platform, stats]) => (
                    <div key={platform} className="flex items-center gap-3 text-xs font-mono">
                      <span className="font-medium w-24 text-foreground/80">{platform}</span>
                      <span className="text-green-500">+{stats.programsAdded} programs</span>
                      <span className="text-blue-500">{stats.programsUpdated} updated</span>
                      <span className="text-green-500">+{stats.targetsAdded} targets</span>
                      <span className="text-muted-foreground">{stats.targetsSkipped} skipped</span>
                      {stats.errors?.length > 0 && <span className="text-[--destructive]">{stats.errors.length} errors</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {syncStatus && syncStatus.totalSyncedPrograms > 0 && (
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/[0.06]">
          <span className="text-[10px] text-muted-foreground font-mono">{syncStatus.totalSyncedPrograms} synced:</span>
          {Object.entries(syncStatus.platformCounts || {}).map(([p, count]) => {
            const plat = getPlatStyle(p);
            return (
              <span key={p} className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-mono font-medium border ${plat.bg} ${plat.text} ${plat.border}`}>
                {plat.label} ({count})
              </span>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

// ─── Program Card ─────────────────────────────────────────────────────────────

function ProgramCard({ program, onSelect, selected, onDelete, index, targetCount }) {
  const plat = getPlatStyle(program.platform);
  const tc = targetCount || { total: 0, inScope: 0, outOfScope: 0 };
  const hasTargets = tc.total > 0;

  return (
    <motion.button
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: index * 0.02 }}
      onClick={() => onSelect(program.id)}
      className={`flex items-center gap-3 w-full text-left p-3 rounded-lg border transition-all ${
        selected
          ? 'border-[--cyan]/40 bg-[--cyan]/5 glow-cyan'
          : 'border-white/[0.06] bg-[--card] hover:border-[--cyan]/20'
      }`}
    >
      <div className={`shrink-0 w-2 h-2 rounded-full ${hasTargets ? 'bg-green-500' : 'bg-muted-foreground/30'}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-mono font-medium truncate">{program.name}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-mono font-medium border ${plat.bg} ${plat.text} ${plat.border}`}>{plat.label}</span>
          {program.maxBounty > 0 && <span className="text-[10px] font-mono text-green-500">Up to ${program.maxBounty.toLocaleString()}</span>}
          {program.syncHandle && <span className="inline-flex rounded-full bg-[--cyan]/10 border border-[--cyan]/20 px-1.5 py-0.5 text-[9px] font-mono text-[--cyan]">synced</span>}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {hasTargets && (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 text-green-500 border border-green-500/20 px-2 py-0.5 text-[9px] font-mono font-medium">
            {tc.total}
          </span>
        )}
        {!program.syncHandle && (
          <button onClick={(e) => { e.stopPropagation(); onDelete(program.id); }}
            className="shrink-0 p-1 text-muted-foreground hover:text-[--destructive] rounded transition-colors">
            <TrashIcon size={12} />
          </button>
        )}
      </div>
    </motion.button>
  );
}

// ─── Target Row ───────────────────────────────────────────────────────────────

function TargetRow({ target, onDelete, onStatusChange, onUpdate, index }) {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState(target.notes || '');
  const [savingNotes, setSavingNotes] = useState(false);
  const st = STATUS_COLORS[target.status] || STATUS_COLORS.in_scope;
  const icon = TYPE_ICONS[target.type] || '\u{1f310}';

  async function handleSaveNotes() {
    setSavingNotes(true);
    await onUpdate(target.id, { notes });
    setSavingNotes(false);
  }

  let techs = [];
  try { if (target.technologies) techs = JSON.parse(target.technologies); } catch {}

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.015, 0.3) }}
      className="rounded-lg border border-white/[0.06] bg-[--card] hover:border-[--cyan]/20 transition-colors"
    >
      <div className="flex items-center gap-3 p-3 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className={`shrink-0 w-2 h-2 rounded-full ${st.dot}`} />
        <span className="text-sm shrink-0 w-6 text-center">{icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-mono font-medium truncate select-all">{target.value}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="inline-flex rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] font-mono font-medium text-muted-foreground">{target.type}</span>
            {target.syncSource && <span className="inline-flex rounded-full bg-[--cyan]/10 border border-[--cyan]/20 px-1.5 py-0.5 text-[9px] font-mono text-[--cyan]">{target.syncSource}</span>}
            {techs.length > 0 && <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[200px]">{techs.join(', ')}</span>}
            {target.lastScannedAt && <span className="text-[9px] font-mono text-muted-foreground">scanned {timeAgo(target.lastScannedAt)}</span>}
          </div>
        </div>
        <CopyBtn text={target.value} />
        <select
          value={target.status}
          onClick={e => e.stopPropagation()}
          onChange={(e) => { e.stopPropagation(); onStatusChange(target.id, e.target.value); }}
          className={`text-[10px] font-mono font-medium rounded-full px-2 py-0.5 border cursor-pointer bg-transparent ${st.bg} ${st.text} ${st.border} focus:outline-none`}
        >
          <option value="in_scope">in scope</option>
          <option value="testing">testing</option>
          <option value="completed">completed</option>
          <option value="out_of_scope">out of scope</option>
        </select>
        <span className={`transition-transform shrink-0 text-muted-foreground ${expanded ? 'rotate-180' : ''}`}>
          <ChevronDownIcon size={14} />
        </span>
        <button onClick={(e) => { e.stopPropagation(); onDelete(target.id); }}
          className="shrink-0 p-1 text-muted-foreground hover:text-[--destructive] rounded transition-colors">
          <TrashIcon size={12} />
        </button>
      </div>

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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Type</span>
                  <p className="text-xs font-mono mt-0.5">{icon} {target.type}</p>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Status</span>
                  <p className="text-xs font-mono mt-0.5">{target.status.replace('_', ' ')}</p>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Added</span>
                  <p className="text-xs font-mono mt-0.5">{timeAgo(target.createdAt)}</p>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Last Scan</span>
                  <p className="text-xs font-mono mt-0.5">{target.lastScannedAt ? timeAgo(target.lastScannedAt) : '\u2014'}</p>
                </div>
              </div>
              {techs.length > 0 && (
                <div>
                  <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Technologies</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {techs.map(t => (
                      <span key={t} className="inline-flex rounded-full bg-purple-500/10 text-purple-500 border border-purple-500/20 px-2 py-0.5 text-[9px] font-mono">{t}</span>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Notes</span>
                <div className="flex gap-2 mt-1">
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={2}
                    placeholder="Add notes..."
                    className="flex-1 text-[11px] border border-white/[0.06] rounded-md p-2 bg-black/20 font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:border-[--cyan]/40 transition-colors resize-y"
                  />
                  <button onClick={handleSaveNotes} disabled={savingNotes}
                    className="self-end inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[10px] font-mono font-medium bg-[--cyan]/10 text-[--cyan] border border-[--cyan]/20 hover:bg-[--cyan] hover:text-[--primary-foreground] transition-colors disabled:opacity-50">
                    {savingNotes ? <SpinnerIcon size={10} /> : <CheckIcon size={10} />} Save
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Import Dialog ────────────────────────────────────────────────────────────

function ImportDialog({ programId, onClose, onImported }) {
  const [text, setText] = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const fileRef = useRef(null);

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setText(ev.target.result);
    reader.readAsText(file);
  }

  function parseTargets(raw) {
    const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
    return lines.map(line => {
      // Try JSON
      try { const obj = JSON.parse(line); if (obj.value) return obj; } catch {}
      // Try CSV: value,type
      const parts = line.split(',').map(s => s.trim());
      const value = parts[0];
      const type = TARGET_TYPES.includes(parts[1]) ? parts[1] : guessType(value);
      return { value, type };
    });
  }

  function guessType(v) {
    if (/^\*\./.test(v)) return 'wildcard';
    if (/^https?:\/\//.test(v)) return 'url';
    if (/\/\d{1,2}$/.test(v)) return 'cidr';
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(v)) return 'ip';
    return 'domain';
  }

  async function handleImport() {
    const items = parseTargets(text);
    if (items.length === 0) return;
    setImporting(true);
    const res = await bulkImportTargets(programId, items);
    setResult(res);
    setImporting(false);
    if (!res.error) onImported();
  }

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-lg border border-[--cyan]/20 bg-[--card] shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#ff5f57]" /><div className="w-2 h-2 rounded-full bg-[#febc2e]" /><div className="w-2 h-2 rounded-full bg-[#28c840]" /></div>
            <span className="font-mono text-[10px] font-medium text-[--cyan] uppercase tracking-wider ml-1">Import Targets</span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><span className="text-lg">&times;</span></button>
        </div>
        <div className="p-4">
          <p className="text-xs font-mono text-muted-foreground mb-3">Paste targets (one per line) or upload a file. Accepted: plain list, CSV (value,type), JSON.</p>
          <div className="flex gap-2 mb-3">
            <button onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-mono font-medium border border-white/[0.06] hover:bg-white/[0.04] transition-colors">
              <UploadIcon size={12} /> Upload File
            </button>
            <input ref={fileRef} type="file" accept=".txt,.csv,.json" className="hidden" onChange={handleFile} />
          </div>
          <textarea value={text} onChange={e => setText(e.target.value)} rows={8} placeholder={"example.com\n*.api.example.com\n10.0.0.0/8,cidr\nhttps://app.example.com,url"}
            className="w-full text-[11px] border border-white/[0.06] rounded-md p-3 bg-black/20 font-mono placeholder:text-muted-foreground/30 focus:outline-none focus:border-[--cyan]/40 focus:ring-1 focus:ring-[--cyan]/20 transition-colors resize-y" />
          {text && (
            <p className="text-[10px] font-mono text-muted-foreground mt-1">{parseTargets(text).length} targets detected</p>
          )}
          {result && (
            <p className={`text-xs font-mono mt-2 ${result.error ? 'text-[--destructive]' : 'text-green-500'}`}>
              {result.error || `${result.imported} targets imported`}
            </p>
          )}
          <div className="flex justify-end gap-2 mt-3">
            <button onClick={onClose} className="inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-xs font-mono font-medium border border-white/[0.06] hover:bg-white/[0.04] transition-colors text-muted-foreground">Cancel</button>
            <button onClick={handleImport} disabled={importing || !text.trim()}
              className="inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-xs font-mono font-medium bg-[--cyan]/10 text-[--cyan] border border-[--cyan]/20 hover:bg-[--cyan] hover:text-[--primary-foreground] transition-colors disabled:opacity-50">
              {importing ? <SpinnerIcon size={12} /> : <UploadIcon size={12} />} Import
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Add Target/Program Form ──────────────────────────────────────────────────

function AddForm({ fields, onSubmit }) {
  const [values, setValues] = useState({});
  const [open, setOpen] = useState(false);

  if (!open) return (
    <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-mono font-medium border border-dashed border-white/[0.12] hover:bg-white/[0.04] transition-colors text-muted-foreground hover:text-foreground">
      <PlusIcon size={12} /> Add
    </button>
  );

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
      className="flex flex-wrap items-end gap-2 p-3 rounded-lg border border-white/[0.06] bg-[--card]">
      {fields.map(f => (
        <div key={f.name} className="flex flex-col gap-1">
          <label className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">{f.label}</label>
          {f.type === 'select' ? (
            <select value={values[f.name] || ''} onChange={e => setValues({ ...values, [f.name]: e.target.value })}
              className="text-xs border border-white/[0.06] rounded-md px-2 py-1.5 bg-black/20 font-mono focus:outline-none focus:border-[--cyan]/40 transition-colors">
              {f.options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          ) : (
            <input type={f.type || 'text'} placeholder={f.placeholder} value={values[f.name] || ''} onChange={e => setValues({ ...values, [f.name]: e.target.value })}
              className="text-xs border border-white/[0.06] rounded-md px-2 py-1.5 bg-black/20 font-mono min-w-[120px] placeholder:text-muted-foreground/50 focus:outline-none focus:border-[--cyan]/40 transition-colors" />
          )}
        </div>
      ))}
      <button onClick={() => { onSubmit(values); setValues({}); setOpen(false); }} className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-mono font-medium bg-[--cyan] text-[--primary-foreground] hover:opacity-90 transition-opacity">Save</button>
      <button onClick={() => { setValues({}); setOpen(false); }} className="text-xs font-mono text-muted-foreground hover:text-foreground px-2 py-1.5 transition-colors">Cancel</button>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function TargetsPage() {
  const [programs_, setPrograms] = useState([]);
  const [targets_, setTargets] = useState([]);
  const [targetCounts, setTargetCounts] = useState({});
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingTargets, setLoadingTargets] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  const [platformFilter, setPlatformFilter] = useState('all');
  const [programSearch, setProgramSearch] = useState('');
  const [targetSearch, setTargetSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('default');
  const [showImport, setShowImport] = useState(false);
  const targetsRef = useRef(null);

  async function load() {
    const [p, ss, tc] = await Promise.all([getPrograms(), getSyncStatus(), getProgramTargetCounts()]);
    setPrograms(p);
    setSyncStatus(ss);
    setTargetCounts(tc);
    // Auto-select first program that has targets, or first overall
    if (p.length > 0 && !selectedProgram) {
      const withTargets = p.find(prog => tc[prog.id]?.total > 0);
      setSelectedProgram(withTargets ? withTargets.id : p[0].id);
    }
    setLoading(false);
  }

  async function loadTargets() {
    if (!selectedProgram) { setTargets([]); return; }
    setLoadingTargets(true);
    const t = await getTargets(selectedProgram);
    setTargets(t);
    setLoadingTargets(false);
    // Scroll targets panel to top on program change
    if (targetsRef.current) targetsRef.current.scrollTop = 0;
  }

  useEffect(() => { load(); }, []);
  useEffect(() => { if (selectedProgram) loadTargets(); }, [selectedProgram]);

  async function handleSync(platform, options) {
    let res;
    if (platform) {
      const stats = await syncTargetsFromPlatform(platform, options);
      res = { [platform]: stats };
    } else {
      res = await syncAllTargets(options);
    }
    await load();
    if (selectedProgram) loadTargets();
    return res;
  }

  async function handleAddProgram(values) {
    await createProgram({ name: values.name || 'Untitled', platform: values.platform || 'custom', url: values.url, maxBounty: values.maxBounty ? Number(values.maxBounty) : null });
    load();
  }

  async function handleDeleteProgram(id) {
    await deleteProgram(id);
    if (selectedProgram === id) setSelectedProgram(null);
    load();
  }

  async function handleAddTarget(values) {
    await createTarget({ programId: selectedProgram, type: values.type || 'domain', value: values.value || '' });
    loadTargets();
    load(); // refresh counts
  }

  async function handleDeleteTarget(id) {
    await deleteTarget(id);
    loadTargets();
    load(); // refresh counts
  }

  async function handleStatusChange(id, status) {
    await updateTarget(id, { status });
    loadTargets();
  }

  async function handleUpdateTarget(id, data) {
    await updateTarget(id, data);
    loadTargets();
  }

  async function handleExport() {
    if (!selectedProgram) return;
    const t = await exportTargets(selectedProgram);
    const prog = programs_.find(p => p.id === selectedProgram);
    const csv = ['value,type,status,notes', ...t.map(r => `${r.value},${r.type},${r.status},${(r.notes || '').replace(/,/g, ';')}`)].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(prog?.name || 'targets').replace(/\s+/g, '_').toLowerCase()}_targets.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ─── Filtering ──────────────────────────────────────────────────────────────

  // Sort programs: those with targets first, then alphabetical
  const sortedPrograms = [...programs_].sort((a, b) => {
    const aCount = targetCounts[a.id]?.total || 0;
    const bCount = targetCounts[b.id]?.total || 0;
    if (aCount > 0 && bCount === 0) return -1;
    if (aCount === 0 && bCount > 0) return 1;
    if (aCount !== bCount) return bCount - aCount;
    return a.name.localeCompare(b.name);
  });

  const filteredPrograms = sortedPrograms.filter(p => {
    if (platformFilter !== 'all' && p.platform !== platformFilter) return false;
    if (programSearch && !p.name.toLowerCase().includes(programSearch.toLowerCase())) return false;
    return true;
  });

  const selectedProg = programs_.find(p => p.id === selectedProgram);
  const tc = selectedProgram ? (targetCounts[selectedProgram] || { total: 0, inScope: 0, outOfScope: 0 }) : { total: 0, inScope: 0, outOfScope: 0 };

  // Filter and sort targets
  let displayTargets = [...targets_];
  if (targetSearch) {
    const q = targetSearch.toLowerCase();
    displayTargets = displayTargets.filter(t => t.value.toLowerCase().includes(q) || t.type.includes(q));
  }
  if (typeFilter !== 'all') {
    displayTargets = displayTargets.filter(t => t.type === typeFilter);
  }
  if (sortBy === 'type') {
    displayTargets.sort((a, b) => a.type.localeCompare(b.type));
  } else if (sortBy === 'status') {
    displayTargets.sort((a, b) => a.status.localeCompare(b.status));
  } else if (sortBy === 'alpha') {
    displayTargets.sort((a, b) => a.value.localeCompare(b.value));
  }

  // Group targets by type for header display
  const typeGroups = {};
  for (const t of displayTargets) {
    typeGroups[t.type] = (typeGroups[t.type] || 0) + 1;
  }

  const totalInScope = targets_.filter(t => t.status === 'in_scope').length;
  const totalTargets = Object.values(targetCounts).reduce((s, c) => s + c.total, 0);

  if (loading) return <div className="flex flex-col gap-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 animate-pulse rounded-lg bg-white/[0.04] border border-white/[0.06]" />)}</div>;

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-mono font-semibold text-[--cyan] text-glow-cyan">Targets</h1>
          <p className="text-[11px] text-muted-foreground mt-1 font-mono">Bug bounty program and target management</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-mono font-medium bg-[--cyan]/10 text-[--cyan] border border-[--cyan]/20">
            {programs_.length} programs
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-mono font-medium bg-green-500/10 text-green-500 border border-green-500/20">
            {totalTargets.toLocaleString()} targets
          </span>
        </div>
      </div>

      <SyncPanel onSync={handleSync} syncStatus={syncStatus} />

      {/* Platform filter tabs */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 scrollbar-thin">
        <button onClick={() => setPlatformFilter('all')}
          className={`shrink-0 px-3 py-1 rounded-full text-[10px] font-mono font-medium border transition-colors ${
            platformFilter === 'all' ? 'bg-[--cyan]/10 text-[--cyan] border-[--cyan]/20' : 'border-white/[0.06] text-muted-foreground hover:text-foreground hover:border-white/[0.12]'
          }`}>
          All ({programs_.length})
        </button>
        {PLATFORMS.filter(p => programs_.some(prog => prog.platform === p.id)).map(p => (
          <button key={p.id} onClick={() => setPlatformFilter(p.id)}
            className={`shrink-0 px-3 py-1 rounded-full text-[10px] font-mono font-medium border transition-colors ${
              platformFilter === p.id ? `${p.bg} ${p.text} ${p.border}` : 'border-white/[0.06] text-muted-foreground hover:text-foreground hover:border-white/[0.12]'
            }`}>
            {p.label} ({programs_.filter(prog => prog.platform === p.id).length})
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ minHeight: '60vh' }}>
        {/* Programs panel */}
        <div className="lg:col-span-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[10px] font-mono font-medium uppercase tracking-wider text-muted-foreground">Programs</h2>
            <AddForm
              fields={[
                { name: 'name', label: 'Name', placeholder: 'Program name' },
                { name: 'platform', label: 'Platform', type: 'select', options: ['hackerone', 'bugcrowd', 'intigriti', 'yeswehack', 'federacy', 'custom'] },
                { name: 'url', label: 'URL', placeholder: 'https://...' },
                { name: 'maxBounty', label: 'Max Bounty', placeholder: '10000', type: 'number' },
              ]}
              onSubmit={handleAddProgram}
            />
          </div>
          {/* Program search */}
          <div className="relative mb-2">
            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"><SearchIcon size={12} /></div>
            <input placeholder="Search programs..." value={programSearch} onChange={e => setProgramSearch(e.target.value)}
              className="w-full text-xs border border-white/[0.06] rounded-md pl-8 pr-3 py-1.5 bg-black/20 font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:border-[--cyan]/40 transition-colors" />
          </div>
          <div className="flex flex-col gap-2 flex-1 overflow-y-auto scrollbar-thin">
            {filteredPrograms.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <div className="rounded-full bg-white/[0.04] border border-white/[0.06] p-3 mb-3"><GlobeIcon size={20} /></div>
                <p className="text-xs font-mono text-muted-foreground">No programs yet</p>
                <p className="text-[10px] font-mono text-muted-foreground mt-1">Sync from platforms or add manually</p>
              </div>
            ) : filteredPrograms.map((p, i) => (
              <ProgramCard key={p.id} program={p} selected={selectedProgram === p.id} onSelect={setSelectedProgram} onDelete={handleDeleteProgram} index={i} targetCount={targetCounts[p.id]} />
            ))}
          </div>
        </div>

        {/* Targets panel */}
        <div className="lg:col-span-2 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[10px] font-mono font-medium uppercase tracking-wider text-muted-foreground">
              Targets {selectedProg && (<>
                {'\u2014'} {selectedProg.name}
                {tc.total > 0 && <span className="text-[--cyan] ml-1">({tc.total})</span>}
              </>)}
            </h2>
            {selectedProgram && (
              <div className="flex items-center gap-2">
                <button onClick={() => setShowImport(true)}
                  className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-mono font-medium border border-white/[0.06] hover:bg-white/[0.04] transition-colors text-muted-foreground hover:text-foreground">
                  <UploadIcon size={12} /> Import
                </button>
                {targets_.length > 0 && (
                  <button onClick={handleExport}
                    className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-mono font-medium border border-white/[0.06] hover:bg-white/[0.04] transition-colors text-muted-foreground hover:text-foreground">
                    <DownloadIcon size={12} /> Export
                  </button>
                )}
                <AddForm
                  fields={[
                    { name: 'value', label: 'Target', placeholder: '*.example.com' },
                    { name: 'type', label: 'Type', type: 'select', options: TARGET_TYPES },
                  ]}
                  onSubmit={handleAddTarget}
                />
              </div>
            )}
          </div>

          {/* Target filters */}
          {selectedProgram && targets_.length > 0 && (
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <div className="relative flex-1 min-w-[150px]">
                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"><SearchIcon size={12} /></div>
                <input placeholder="Search targets..." value={targetSearch} onChange={e => setTargetSearch(e.target.value)}
                  className="w-full text-xs border border-white/[0.06] rounded-md pl-8 pr-3 py-1.5 bg-black/20 font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:border-[--cyan]/40 transition-colors" />
              </div>
              <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
                className="text-xs border border-white/[0.06] rounded-md px-2 py-1.5 bg-black/20 font-mono focus:outline-none focus:border-[--cyan]/40 transition-colors">
                <option value="all">All types</option>
                {TARGET_TYPES.map(t => <option key={t} value={t}>{TYPE_ICONS[t]} {t}</option>)}
              </select>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                className="text-xs border border-white/[0.06] rounded-md px-2 py-1.5 bg-black/20 font-mono focus:outline-none focus:border-[--cyan]/40 transition-colors">
                <option value="default">Recent</option>
                <option value="type">By type</option>
                <option value="status">By status</option>
                <option value="alpha">A-Z</option>
              </select>
            </div>
          )}

          {/* Type summary chips */}
          {selectedProgram && Object.keys(typeGroups).length > 1 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {Object.entries(typeGroups).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
                <button key={type} onClick={() => setTypeFilter(typeFilter === type ? 'all' : type)}
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-mono font-medium border transition-colors cursor-pointer ${
                    typeFilter === type
                      ? 'bg-[--cyan]/10 text-[--cyan] border-[--cyan]/20'
                      : 'bg-white/5 border-white/10 text-muted-foreground hover:text-foreground'
                  }`}>
                  {TYPE_ICONS[type]} {type} ({count})
                </button>
              ))}
            </div>
          )}

          <AnimatePresence mode="wait">
            {!selectedProgram ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center py-12 text-center flex-1">
                <div className="rounded-full bg-white/[0.04] border border-white/[0.06] p-4 mb-4"><CrosshairIcon size={24} /></div>
                <p className="text-sm font-mono font-medium mb-1">Select a program</p>
                <p className="text-[11px] font-mono text-muted-foreground">Choose a program to manage its targets</p>
              </motion.div>
            ) : loadingTargets ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center py-12 text-center flex-1">
                <SpinnerIcon size={24} className="text-[--cyan] mb-3" />
                <p className="text-xs font-mono text-muted-foreground">Loading targets...</p>
              </motion.div>
            ) : displayTargets.length === 0 && targets_.length === 0 ? (
              <motion.div key="no-targets" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center py-12 text-center flex-1">
                <div className="rounded-full bg-white/[0.04] border border-white/[0.06] p-4 mb-4"><CrosshairIcon size={24} /></div>
                <p className="text-sm font-mono font-medium mb-1">No targets yet</p>
                <p className="text-[11px] font-mono text-muted-foreground mb-4">Add domains, IPs, and URLs to start hunting</p>
                <div className="flex gap-2">
                  <button onClick={() => setShowImport(true)}
                    className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-mono font-medium bg-[--cyan]/10 text-[--cyan] border border-[--cyan]/20 hover:bg-[--cyan] hover:text-[--primary-foreground] transition-colors">
                    <UploadIcon size={12} /> Import Targets
                  </button>
                </div>
              </motion.div>
            ) : displayTargets.length === 0 ? (
              <motion.div key="no-match" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center py-12 text-center flex-1">
                <div className="rounded-full bg-white/[0.04] border border-white/[0.06] p-4 mb-4"><SearchIcon size={24} /></div>
                <p className="text-sm font-mono text-muted-foreground">No targets match your filter</p>
              </motion.div>
            ) : (
              <motion.div key="targets" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                ref={targetsRef}
                className="flex flex-col gap-2 flex-1 overflow-y-auto scrollbar-thin">
                {displayTargets.map((t, i) => (
                  <TargetRow key={t.id} target={t} onDelete={handleDeleteTarget} onStatusChange={handleStatusChange} onUpdate={handleUpdateTarget} index={i} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Import dialog */}
      <AnimatePresence>
        {showImport && selectedProgram && (
          <ImportDialog
            programId={selectedProgram}
            onClose={() => setShowImport(false)}
            onImported={() => { setShowImport(false); loadTargets(); load(); }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
