'use client';

import { useState, useEffect } from 'react';
import { PackageIcon, PlusIcon, SearchIcon, SpinnerIcon, CheckIcon, TrashIcon, ChevronDownIcon, DownloadIcon, GlobeIcon } from './icons.js';
import { getCatalog, getInstalledTools, installTool, installCustomTool, uninstallTool, toggleTool, installFromGithub, getContainers, spawnContainer, stopContainer } from '../../registry/actions.js';

const CATEGORY_COLORS = {
  recon: 'bg-blue-500/10 text-blue-500',
  scanning: 'bg-cyan-500/10 text-cyan-500',
  web: 'bg-orange-500/10 text-orange-500',
  osint: 'bg-green-500/10 text-green-500',
  cloud: 'bg-purple-500/10 text-purple-500',
  credential: 'bg-red-500/10 text-red-500',
  exploitation: 'bg-red-600/10 text-red-600',
  binary: 'bg-gray-500/10 text-gray-500',
  forensics: 'bg-yellow-500/10 text-yellow-500',
  automation: 'bg-indigo-500/10 text-indigo-500',
  custom: 'bg-muted text-muted-foreground',
};

function CatalogToolCard({ tool, installed, onInstall, installing }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/30 transition-colors">
      <div className="shrink-0 rounded-md bg-muted p-2"><PackageIcon size={14} /></div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{tool.name}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{tool.description}</p>
      </div>
      <span className={`shrink-0 inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${CATEGORY_COLORS[tool.category] || CATEGORY_COLORS.custom}`}>{tool.category}</span>
      {installed ? (
        <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-green-500/10 text-green-500 px-2 py-0.5 text-[10px] font-medium"><CheckIcon size={10} /> installed</span>
      ) : (
        <button
          onClick={() => onInstall(tool.id)}
          disabled={installing === tool.id}
          className="shrink-0 inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium border hover:bg-accent/50 transition-colors disabled:opacity-50"
        >
          {installing === tool.id ? <SpinnerIcon size={12} /> : <DownloadIcon size={12} />}
          Install
        </button>
      )}
    </div>
  );
}

function InstalledToolCard({ tool, onUninstall, onToggle, onSpawn }) {
  const [expanded, setExpanded] = useState(false);
  const disabled = !tool.enabled;

  return (
    <div className={`rounded-lg border bg-card transition-opacity ${disabled ? 'opacity-60' : ''}`}>
      <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-3 w-full text-left p-3 hover:bg-accent/30 rounded-lg">
        <div className="shrink-0 rounded-md bg-muted p-2"><PackageIcon size={14} /></div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{tool.name}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{tool.description}</p>
        </div>
        <span className={`shrink-0 inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${CATEGORY_COLORS[tool.category] || CATEGORY_COLORS.custom}`}>{tool.category}</span>
        <span className={`shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}><ChevronDownIcon size={14} /></span>
      </button>
      {expanded && (
        <div className="border-t px-4 py-3 flex flex-col gap-2">
          {tool.dockerImage && <div className="flex gap-2 text-xs"><span className="text-muted-foreground">Docker:</span><span className="font-mono">{tool.dockerImage}</span></div>}
          {tool.installCmd && <div className="flex gap-2 text-xs"><span className="text-muted-foreground">Install:</span><code className="font-mono bg-muted px-1.5 py-0.5 rounded text-[11px] break-all">{tool.installCmd}</code></div>}
          {tool.sourceUrl && <div className="flex gap-2 text-xs"><span className="text-muted-foreground">Source:</span><a href={tool.sourceUrl} target="_blank" rel="noopener" className="text-blue-500 hover:underline truncate">{tool.sourceUrl}</a></div>}
          <div className="flex items-center gap-2 mt-1">
            {tool.dockerImage && <button onClick={() => onSpawn(tool.id)} className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium border hover:bg-accent/50">Spawn Container</button>}
            <button onClick={() => onToggle(tool.id)} className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium border hover:bg-accent/50">{tool.enabled ? 'Disable' : 'Enable'}</button>
            <div className="flex-1" />
            <button onClick={() => onUninstall(tool.id)} className="text-xs text-muted-foreground hover:text-destructive">Uninstall</button>
          </div>
        </div>
      )}
    </div>
  );
}

function GithubInstaller({ onInstall }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  async function handleInstall() {
    if (!url) return;
    setLoading(true);
    setResult(null);
    const res = await onInstall(url);
    setResult(res);
    setLoading(false);
    if (!res.error) setUrl('');
  }

  return (
    <div className="rounded-lg border bg-card p-4 mb-4">
      <p className="text-sm font-medium mb-2">Install from GitHub</p>
      <p className="text-xs text-muted-foreground mb-3">Paste a GitHub repository URL to add any tool to your registry.</p>
      <div className="flex gap-2">
        <input placeholder="https://github.com/owner/repo" value={url} onChange={e => setUrl(e.target.value)} className="flex-1 text-sm border rounded-md px-3 py-2 bg-background font-mono" />
        <button onClick={handleInstall} disabled={loading || !url} className="inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-xs font-medium bg-foreground text-background hover:opacity-90 disabled:opacity-50">
          {loading ? <SpinnerIcon size={12} /> : <DownloadIcon size={12} />} Install
        </button>
      </div>
      {result && (
        <p className={`text-xs mt-2 ${result.error ? 'text-destructive' : 'text-green-500'}`}>
          {result.error || `Installed ${result.name}`}
        </p>
      )}
    </div>
  );
}

export function RegistryPage() {
  const [catalog, setCatalog] = useState({ tools: [], categories: [] });
  const [installed, setInstalled] = useState([]);
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [installing, setInstalling] = useState(null);
  const [tab, setTab] = useState('catalog'); // catalog, installed, containers

  async function load() {
    const [c, i, cont] = await Promise.all([getCatalog(), getInstalledTools(), getContainers()]);
    setCatalog(c);
    setInstalled(i);
    setContainers(cont);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const installedSlugs = new Set(installed.map(t => t.slug));

  async function handleInstall(catalogId) {
    setInstalling(catalogId);
    await installTool(catalogId);
    await load();
    setInstalling(null);
  }

  async function handleGithubInstall(url) {
    const result = await installFromGithub(url);
    if (!result.error) await load();
    return result;
  }

  async function handleUninstall(id) { await uninstallTool(id); load(); }
  async function handleToggle(id) { await toggleTool(id); load(); }
  async function handleSpawn(toolId) { await spawnContainer(toolId); load(); }
  async function handleStop(id) { await stopContainer(id); load(); }

  const filteredCatalog = catalog.tools.filter(t => {
    if (activeCategory !== 'all' && t.category !== activeCategory) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase()) && !t.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (loading) return <div className="flex flex-col gap-3">{[...Array(5)].map((_, i) => <div key={i} className="h-14 animate-pulse rounded-lg bg-border/50" />)}</div>;

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold">Toolbox</h1>
          <p className="text-sm text-muted-foreground mt-1">{installed.length} installed, {catalog.tools.length} available in catalog</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border mb-4">
        {[
          { id: 'catalog', label: `Catalog (${catalog.tools.length})` },
          { id: 'installed', label: `Installed (${installed.length})` },
          { id: 'containers', label: `Containers (${containers.filter(c => c.status === 'running').length})` },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t.id ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>{t.label}</button>
        ))}
      </div>

      {tab === 'catalog' && (
        <>
          {/* Search + category filter */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <SearchIcon size={14} />
              <input placeholder="Search tools..." value={search} onChange={e => setSearch(e.target.value)} className="w-full text-sm border rounded-md pl-3 pr-3 py-2 bg-background" />
            </div>
          </div>
          <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
            <button onClick={() => setActiveCategory('all')} className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${activeCategory === 'all' ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>All ({catalog.tools.length})</button>
            {catalog.categories.map(c => (
              <button key={c.id} onClick={() => setActiveCategory(c.id)} className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${activeCategory === c.id ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
                {c.name} ({catalog.tools.filter(t => t.category === c.id).length})
              </button>
            ))}
          </div>

          <GithubInstaller onInstall={handleGithubInstall} />

          <div className="flex flex-col gap-2">
            {filteredCatalog.map(t => (
              <CatalogToolCard key={t.id} tool={t} installed={installedSlugs.has(t.id)} onInstall={handleInstall} installing={installing} />
            ))}
            {filteredCatalog.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">No tools match your search.</p>
            )}
          </div>
        </>
      )}

      {tab === 'installed' && (
        <>
          {installed.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-muted p-4 mb-4"><PackageIcon size={24} /></div>
              <p className="text-sm font-medium mb-1">No tools installed</p>
              <p className="text-xs text-muted-foreground">Browse the catalog to install security tools for your agents.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {installed.map(t => <InstalledToolCard key={t.id} tool={t} onUninstall={handleUninstall} onToggle={handleToggle} onSpawn={handleSpawn} />)}
            </div>
          )}
        </>
      )}

      {tab === 'containers' && (
        <>
          {containers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-muted p-4 mb-4"><PackageIcon size={24} /></div>
              <p className="text-sm font-medium mb-1">No containers running</p>
              <p className="text-xs text-muted-foreground">Spawn containers from installed tools to give agents terminal access.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {containers.map(c => (
                <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                  <div className={`shrink-0 w-2 h-2 rounded-full ${c.status === 'running' ? 'bg-green-500 animate-pulse' : c.status === 'stopped' ? 'bg-muted-foreground' : 'bg-red-500'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-mono truncate">{c.imageName}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{c.containerId?.slice(0, 12)} — {c.status}</p>
                  </div>
                  {c.status === 'running' && (
                    <button onClick={() => handleStop(c.id)} className="text-xs text-muted-foreground hover:text-destructive">Stop</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
