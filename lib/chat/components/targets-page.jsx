'use client';

import { useState, useEffect } from 'react';
import { CrosshairIcon, PlusIcon, TrashIcon, ChevronDownIcon, GlobeIcon, SpinnerIcon, DownloadIcon, CheckIcon } from './icons.js';
import { getPrograms, createProgram, deleteProgram, getTargets, createTarget, deleteTarget, updateTarget, syncTargetsFromPlatform, syncAllTargets, getSyncStatus } from '../../bounty/actions.js';

const PLATFORMS = [
  { id: 'hackerone', label: 'HackerOne', color: 'bg-purple-500/10 text-purple-500', border: 'border-purple-500/20' },
  { id: 'bugcrowd', label: 'Bugcrowd', color: 'bg-orange-500/10 text-orange-500', border: 'border-orange-500/20' },
  { id: 'intigriti', label: 'Intigriti', color: 'bg-blue-500/10 text-blue-500', border: 'border-blue-500/20' },
  { id: 'yeswehack', label: 'YesWeHack', color: 'bg-teal-500/10 text-teal-500', border: 'border-teal-500/20' },
  { id: 'federacy', label: 'Federacy', color: 'bg-pink-500/10 text-pink-500', border: 'border-pink-500/20' },
  { id: 'custom', label: 'Custom', color: 'bg-muted text-muted-foreground', border: 'border-border' },
];

const TARGET_TYPES = ['domain', 'wildcard', 'ip', 'cidr', 'url', 'api', 'mobile'];
const STATUS_COLORS = {
  in_scope: 'bg-green-500/10 text-green-500',
  out_of_scope: 'bg-red-500/10 text-red-500',
  testing: 'bg-yellow-500/10 text-yellow-500',
  completed: 'bg-blue-500/10 text-blue-500',
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

function SyncPanel({ onSync, syncStatus }) {
  const [syncing, setSyncing] = useState(null); // platform name or 'all'
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
    <div className="rounded-lg border bg-card p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-medium">Sync from Bounty Platforms</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Import programs and targets from bounty-targets-data (arkadiyt/bounty-targets-data)
          </p>
        </div>
        {syncStatus?.lastSyncedAt && (
          <span className="text-[10px] text-muted-foreground">Last sync: {timeAgo(syncStatus.lastSyncedAt)}</span>
        )}
      </div>

      {/* Platform sync buttons */}
      <div className="flex flex-wrap gap-2 mb-3">
        {syncablePlatforms.map(p => {
          const count = syncStatus?.platformCounts?.[p.id] || 0;
          return (
            <button
              key={p.id}
              onClick={() => handleSync(p.id)}
              disabled={syncing !== null}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium border transition-colors hover:bg-accent/50 disabled:opacity-50 ${p.border}`}
            >
              {syncing === p.id ? <SpinnerIcon size={12} /> : <DownloadIcon size={12} />}
              {p.label}
              {count > 0 && <span className={`inline-flex rounded-full px-1.5 py-0.5 text-[9px] ${p.color}`}>{count}</span>}
            </button>
          );
        })}
        <button
          onClick={() => handleSync('all')}
          disabled={syncing !== null}
          className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium bg-foreground text-background hover:opacity-90 disabled:opacity-50"
        >
          {syncing === 'all' ? <SpinnerIcon size={12} /> : <DownloadIcon size={12} />}
          Sync All
        </button>
      </div>

      {/* Max programs limit */}
      <div className="flex items-center gap-2 mb-3">
        <label className="text-[10px] text-muted-foreground">Max programs per platform:</label>
        <input
          type="number"
          value={maxPrograms}
          onChange={e => setMaxPrograms(e.target.value)}
          className="w-20 text-xs border rounded-md px-2 py-1 bg-background"
          min="0"
          placeholder="0 = all"
        />
        <span className="text-[10px] text-muted-foreground">(0 = unlimited)</span>
      </div>

      {/* Sync results */}
      {results && (
        <div className="rounded-md bg-muted/50 p-3 mt-2">
          {results.error ? (
            <p className="text-xs text-destructive">{results.error}</p>
          ) : (
            <div className="flex flex-col gap-1">
              {Object.entries(results).map(([platform, stats]) => (
                <div key={platform} className="flex items-center gap-3 text-xs">
                  <span className="font-medium w-24">{platform}</span>
                  <span className="text-green-500">+{stats.programsAdded} programs</span>
                  <span className="text-blue-500">{stats.programsUpdated} updated</span>
                  <span className="text-green-500">+{stats.targetsAdded} targets</span>
                  <span className="text-muted-foreground">{stats.targetsSkipped} skipped</span>
                  {stats.errors?.length > 0 && <span className="text-destructive">{stats.errors.length} errors</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sync status summary */}
      {syncStatus && syncStatus.totalSyncedPrograms > 0 && (
        <div className="flex items-center gap-3 mt-2 pt-2 border-t">
          <span className="text-[10px] text-muted-foreground">{syncStatus.totalSyncedPrograms} synced programs:</span>
          {Object.entries(syncStatus.platformCounts || {}).map(([p, count]) => {
            const plat = PLATFORMS.find(x => x.id === p);
            return (
              <span key={p} className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-medium ${plat?.color || ''}`}>
                {plat?.label || p} ({count})
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ProgramCard({ program, onSelect, selected, onDelete }) {
  const platform = PLATFORMS.find(p => p.id === program.platform) || PLATFORMS[5];
  return (
    <button
      onClick={() => onSelect(program.id)}
      className={`flex items-center gap-3 w-full text-left p-3 rounded-lg border transition-colors ${selected ? 'border-foreground bg-accent/50' : 'bg-card hover:bg-accent/30'}`}
    >
      <div className="shrink-0 rounded-md bg-muted p-2"><GlobeIcon size={14} /></div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{program.name}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${platform.color}`}>{platform.label}</span>
          {program.maxBounty > 0 && <span className="text-[10px] text-muted-foreground">Up to ${program.maxBounty.toLocaleString()}</span>}
          {program.syncHandle && <span className="inline-flex rounded-full bg-cyan-500/10 px-1.5 py-0.5 text-[9px] text-cyan-500">synced</span>}
        </div>
      </div>
      {!program.syncHandle && (
        <button onClick={(e) => { e.stopPropagation(); onDelete(program.id); }} className="shrink-0 p-1 text-muted-foreground hover:text-destructive rounded"><TrashIcon size={12} /></button>
      )}
    </button>
  );
}

function TargetRow({ target, onDelete, onStatusChange }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
      <div className="shrink-0 rounded-md bg-muted p-2"><CrosshairIcon size={14} /></div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-mono font-medium truncate">{target.value}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{target.type}</span>
          {target.syncSource && <span className="inline-flex rounded-full bg-cyan-500/10 px-1.5 py-0.5 text-[9px] text-cyan-500">{target.syncSource}</span>}
          {target.technologies && <span className="text-[10px] text-muted-foreground truncate">{JSON.parse(target.technologies).join(', ')}</span>}
        </div>
      </div>
      <select
        value={target.status}
        onChange={(e) => onStatusChange(target.id, e.target.value)}
        className={`text-[10px] font-medium rounded-full px-2 py-0.5 border-0 cursor-pointer ${STATUS_COLORS[target.status] || ''}`}
      >
        <option value="in_scope">in scope</option>
        <option value="testing">testing</option>
        <option value="completed">completed</option>
        <option value="out_of_scope">out of scope</option>
      </select>
      <button onClick={() => onDelete(target.id)} className="shrink-0 p-1 text-muted-foreground hover:text-destructive rounded"><TrashIcon size={12} /></button>
    </div>
  );
}

function AddForm({ fields, onSubmit }) {
  const [values, setValues] = useState({});
  const [open, setOpen] = useState(false);

  if (!open) return (
    <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium border border-dashed hover:bg-accent/50 transition-colors text-muted-foreground hover:text-foreground">
      <PlusIcon size={12} /> Add
    </button>
  );

  return (
    <div className="flex flex-wrap items-end gap-2 p-3 rounded-lg border bg-card">
      {fields.map(f => (
        <div key={f.name} className="flex flex-col gap-1">
          <label className="text-[10px] text-muted-foreground">{f.label}</label>
          {f.type === 'select' ? (
            <select value={values[f.name] || ''} onChange={e => setValues({ ...values, [f.name]: e.target.value })} className="text-xs border rounded-md px-2 py-1.5 bg-background">
              {f.options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          ) : (
            <input type={f.type || 'text'} placeholder={f.placeholder} value={values[f.name] || ''} onChange={e => setValues({ ...values, [f.name]: e.target.value })} className="text-xs border rounded-md px-2 py-1.5 bg-background min-w-[120px]" />
          )}
        </div>
      ))}
      <button onClick={() => { onSubmit(values); setValues({}); setOpen(false); }} className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium bg-foreground text-background hover:opacity-90">Save</button>
      <button onClick={() => { setValues({}); setOpen(false); }} className="text-xs text-muted-foreground hover:text-foreground px-2 py-1.5">Cancel</button>
    </div>
  );
}

export function TargetsPage() {
  const [programs_, setPrograms] = useState([]);
  const [targets_, setTargets] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState(null);
  const [platformFilter, setPlatformFilter] = useState('all');

  async function load() {
    const [p, ss] = await Promise.all([getPrograms(), getSyncStatus()]);
    setPrograms(p);
    setSyncStatus(ss);
    if (p.length > 0 && !selectedProgram) setSelectedProgram(p[0].id);
    setLoading(false);
  }

  async function loadTargets() {
    if (!selectedProgram) { setTargets([]); return; }
    const t = await getTargets(selectedProgram);
    setTargets(t);
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
  }

  async function handleDeleteTarget(id) {
    await deleteTarget(id);
    loadTargets();
  }

  async function handleStatusChange(id, status) {
    await updateTarget(id, { status });
    loadTargets();
  }

  const filteredPrograms = platformFilter === 'all'
    ? programs_
    : programs_.filter(p => p.platform === platformFilter);

  if (loading) return <div className="flex flex-col gap-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 animate-pulse rounded-lg bg-border/50" />)}</div>;

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Targets</h1>
        <p className="text-sm text-muted-foreground mt-1">{programs_.length} program{programs_.length !== 1 ? 's' : ''}, {targets_.length} target{targets_.length !== 1 ? 's' : ''} in scope</p>
      </div>

      {/* Sync Panel */}
      <SyncPanel onSync={handleSync} syncStatus={syncStatus} />

      {/* Platform filter tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
        <button onClick={() => setPlatformFilter('all')} className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${platformFilter === 'all' ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
          All ({programs_.length})
        </button>
        {PLATFORMS.filter(p => programs_.some(prog => prog.platform === p.id)).map(p => (
          <button key={p.id} onClick={() => setPlatformFilter(p.id)} className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${platformFilter === p.id ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
            {p.label} ({programs_.filter(prog => prog.platform === p.id).length})
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Programs panel */}
        <div className="lg:col-span-1">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium">Programs</h2>
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
          <div className="flex flex-col gap-2 max-h-[600px] overflow-y-auto">
            {filteredPrograms.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <div className="rounded-full bg-muted p-3 mb-3"><GlobeIcon size={20} /></div>
                <p className="text-xs text-muted-foreground">No programs yet</p>
                <p className="text-[10px] text-muted-foreground mt-1">Sync from platforms or add manually</p>
              </div>
            ) : filteredPrograms.map(p => (
              <ProgramCard key={p.id} program={p} selected={selectedProgram === p.id} onSelect={setSelectedProgram} onDelete={handleDeleteProgram} />
            ))}
          </div>
        </div>

        {/* Targets panel */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium">Targets {selectedProgram && `\u2014 ${programs_.find(p => p.id === selectedProgram)?.name || ''}`}</h2>
            {selectedProgram && (
              <AddForm
                fields={[
                  { name: 'value', label: 'Target', placeholder: '*.example.com' },
                  { name: 'type', label: 'Type', type: 'select', options: TARGET_TYPES },
                ]}
                onSubmit={handleAddTarget}
              />
            )}
          </div>
          {!selectedProgram ? (
            <div className="flex flex-col items-center py-12 text-center">
              <div className="rounded-full bg-muted p-4 mb-4"><CrosshairIcon size={24} /></div>
              <p className="text-sm font-medium mb-1">Select a program</p>
              <p className="text-xs text-muted-foreground">Choose a program to manage its targets</p>
            </div>
          ) : targets_.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <div className="rounded-full bg-muted p-4 mb-4"><CrosshairIcon size={24} /></div>
              <p className="text-sm font-medium mb-1">No targets yet</p>
              <p className="text-xs text-muted-foreground">Add domains, IPs, and URLs to start hunting</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 max-h-[600px] overflow-y-auto">
              {targets_.map(t => <TargetRow key={t.id} target={t} onDelete={handleDeleteTarget} onStatusChange={handleStatusChange} />)}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
