'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PackageIcon, SearchIcon, SpinnerIcon, CheckIcon, ChevronDownIcon, DownloadIcon, GlobeIcon } from './icons.js';
import { getCatalog, getInstalledTools, installTool, uninstallTool, toggleTool, installFromGithub, getContainers, spawnContainer, stopContainer } from '../../registry/actions.js';

const CATEGORY_COLORS = {
  recon: { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/20' },
  scanning: { bg: 'bg-cyan-500/10', text: 'text-cyan-500', border: 'border-cyan-500/20' },
  web: { bg: 'bg-orange-500/10', text: 'text-orange-500', border: 'border-orange-500/20' },
  osint: { bg: 'bg-green-500/10', text: 'text-green-500', border: 'border-green-500/20' },
  cloud: { bg: 'bg-purple-500/10', text: 'text-purple-500', border: 'border-purple-500/20' },
  credential: { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/20' },
  exploitation: { bg: 'bg-red-600/10', text: 'text-red-600', border: 'border-red-600/20' },
  binary: { bg: 'bg-gray-500/10', text: 'text-gray-500', border: 'border-gray-500/20' },
  forensics: { bg: 'bg-yellow-500/10', text: 'text-yellow-500', border: 'border-yellow-500/20' },
  automation: { bg: 'bg-indigo-500/10', text: 'text-indigo-500', border: 'border-indigo-500/20' },
  custom: { bg: 'bg-white/5', text: 'text-muted-foreground', border: 'border-white/10' },
};

function getCatStyle(cat) {
  return CATEGORY_COLORS[cat] || CATEGORY_COLORS.custom;
}

function CatalogToolCard({ tool, installed, onInstall, installing, index }) {
  const cat = getCatStyle(tool.category);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.02 }}
      className="group rounded-lg border border-white/[0.06] bg-[--card] hover:border-[--cyan]/20 transition-colors overflow-hidden"
    >
      <div className="flex items-center gap-3 p-3">
        <div className="flex items-center gap-1 shrink-0">
          <div className="w-2 h-2 rounded-full bg-[#ff5f57]" />
          <div className="w-2 h-2 rounded-full bg-[#febc2e]" />
          <div className="w-2 h-2 rounded-full bg-[#28c840]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-mono font-medium truncate">{tool.name}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1 font-mono">{tool.description}</p>
        </div>
        <span className={`shrink-0 inline-flex rounded-full px-2 py-0.5 text-[10px] font-mono font-medium border ${cat.bg} ${cat.text} ${cat.border}`}>
          {tool.category}
        </span>
        {installed ? (
          <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-green-500/10 text-green-500 border border-green-500/20 px-2 py-0.5 text-[10px] font-mono font-medium">
            <CheckIcon size={10} /> installed
          </span>
        ) : (
          <button
            onClick={() => onInstall(tool.id)}
            disabled={installing === tool.id}
            className="shrink-0 inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-mono font-medium bg-[--cyan]/10 text-[--cyan] border border-[--cyan]/20 hover:bg-[--cyan] hover:text-[--primary-foreground] transition-colors disabled:opacity-50"
          >
            {installing === tool.id ? <SpinnerIcon size={12} /> : <DownloadIcon size={12} />}
            Install
          </button>
        )}
      </div>
    </motion.div>
  );
}

function InstalledToolCard({ tool, onUninstall, onToggle, onSpawn, index }) {
  const [expanded, setExpanded] = useState(false);
  const disabled = !tool.enabled;
  const cat = getCatStyle(tool.category);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.03 }}
      className={`rounded-lg border border-white/[0.06] bg-[--card] transition-all ${disabled ? 'opacity-50' : 'hover:border-[--cyan]/20'}`}
    >
      <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-3 w-full text-left p-3 hover:bg-white/[0.02] rounded-lg transition-colors">
        <div className="flex items-center gap-1 shrink-0">
          <div className="w-2 h-2 rounded-full bg-[#ff5f57]" />
          <div className="w-2 h-2 rounded-full bg-[#febc2e]" />
          <div className="w-2 h-2 rounded-full bg-[#28c840]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-mono font-medium truncate">{tool.name}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5 truncate font-mono">{tool.description}</p>
        </div>
        <span className={`shrink-0 inline-flex rounded-full px-2 py-0.5 text-[10px] font-mono font-medium border ${cat.bg} ${cat.text} ${cat.border}`}>{tool.category}</span>
        <span className={`shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}><ChevronDownIcon size={14} /></span>
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
              {tool.dockerImage && (
                <div className="flex gap-2 text-xs items-baseline">
                  <span className="text-muted-foreground font-mono text-[10px] uppercase tracking-wider w-14 shrink-0">Docker</span>
                  <span className="font-mono text-foreground/80">{tool.dockerImage}</span>
                </div>
              )}
              {tool.installCmd && (
                <div className="flex gap-2 text-xs items-baseline">
                  <span className="text-muted-foreground font-mono text-[10px] uppercase tracking-wider w-14 shrink-0">Install</span>
                  <code className="font-mono bg-black/30 px-2 py-0.5 rounded text-[11px] text-foreground/80 border border-white/[0.04] break-all">{tool.installCmd}</code>
                </div>
              )}
              {tool.sourceUrl && (
                <div className="flex gap-2 text-xs items-baseline">
                  <span className="text-muted-foreground font-mono text-[10px] uppercase tracking-wider w-14 shrink-0">Source</span>
                  <a href={tool.sourceUrl} target="_blank" rel="noopener" className="text-[--cyan] hover:underline truncate font-mono">{tool.sourceUrl}</a>
                </div>
              )}
              <div className="flex items-center gap-2 mt-2">
                {tool.dockerImage && (
                  <button onClick={() => onSpawn(tool.id)} className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-mono font-medium bg-[--cyan]/10 text-[--cyan] border border-[--cyan]/20 hover:bg-[--cyan] hover:text-[--primary-foreground] transition-colors">
                    Spawn
                  </button>
                )}
                <button onClick={() => onToggle(tool.id)} className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-mono font-medium border border-white/[0.06] hover:bg-white/[0.04] transition-colors">
                  {tool.enabled ? 'Disable' : 'Enable'}
                </button>
                <div className="flex-1" />
                <button onClick={() => onUninstall(tool.id)} className="text-xs font-mono text-muted-foreground hover:text-[--destructive] transition-colors">
                  Uninstall
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
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
    <div className="rounded-lg border border-white/[0.06] bg-[--card] p-4 mb-4">
      <div className="flex items-center gap-2 mb-2">
        <GlobeIcon size={14} />
        <p className="text-sm font-mono font-medium text-[--cyan]">Install from GitHub</p>
      </div>
      <p className="text-[11px] text-muted-foreground mb-3 font-mono">Paste a GitHub repository URL to add any tool to your registry.</p>
      <div className="flex gap-2">
        <input
          placeholder="https://github.com/owner/repo"
          value={url}
          onChange={e => setUrl(e.target.value)}
          className="flex-1 text-sm border border-white/[0.06] rounded-md px-3 py-2 bg-black/20 font-mono text-foreground/80 placeholder:text-muted-foreground/50 focus:outline-none focus:border-[--cyan]/40 focus:ring-1 focus:ring-[--cyan]/20 transition-colors"
        />
        <button
          onClick={handleInstall}
          disabled={loading || !url}
          className="inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-xs font-mono font-medium bg-[--cyan] text-[--primary-foreground] hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {loading ? <SpinnerIcon size={12} /> : <DownloadIcon size={12} />} Install
        </button>
      </div>
      {result && (
        <p className={`text-xs font-mono mt-2 ${result.error ? 'text-[--destructive]' : 'text-green-500'}`}>
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
  const [tab, setTab] = useState('catalog');

  async function load() {
    const [c, i, cont] = await Promise.all([getCatalog(), getInstalledTools(), getContainers()]);
    setCatalog(c);
    setInstalled(i);
    setContainers(cont);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const installedSlugs = new Set(installed.map(t => t.slug));
  const runningContainers = containers.filter(c => c.status === 'running').length;

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

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-lg bg-white/[0.04] border border-white/[0.06]" />
        ))}
      </div>
    );
  }

  const tabs = [
    { id: 'catalog', label: 'CATALOG', count: catalog.tools.length },
    { id: 'installed', label: 'INSTALLED', count: installed.length },
    { id: 'containers', label: 'CONTAINERS', count: runningContainers },
  ];

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-mono font-semibold text-[--cyan] text-glow-cyan">Toolbox</h1>
          <p className="text-[11px] text-muted-foreground mt-1 font-mono">Security tool registry and container management</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-mono font-medium bg-[--cyan]/10 text-[--cyan] border border-[--cyan]/20">
            {catalog.tools.length} tools
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-mono font-medium bg-green-500/10 text-green-500 border border-green-500/20">
            {installed.length} installed
          </span>
          {runningContainers > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-mono font-medium bg-orange-500/10 text-orange-500 border border-orange-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
              {runningContainers} running
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/[0.06] mb-4">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-[11px] font-mono font-medium uppercase tracking-wider border-b-2 transition-colors ${
              tab === t.id
                ? 'border-[--cyan] text-[--cyan]'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label} <span className="text-muted-foreground">({t.count})</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'catalog' && (
          <motion.div key="catalog" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            {/* Search */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"><SearchIcon size={14} /></div>
                <input
                  placeholder="Search tools..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full text-sm border border-white/[0.06] rounded-md pl-9 pr-3 py-2 bg-black/20 font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:border-[--cyan]/40 focus:ring-1 focus:ring-[--cyan]/20 transition-colors"
                />
              </div>
            </div>

            {/* Category filter */}
            <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 scrollbar-thin">
              <button
                onClick={() => setActiveCategory('all')}
                className={`shrink-0 px-3 py-1 rounded-full text-[10px] font-mono font-medium border transition-colors ${
                  activeCategory === 'all'
                    ? 'bg-[--cyan]/10 text-[--cyan] border-[--cyan]/20'
                    : 'border-white/[0.06] text-muted-foreground hover:text-foreground hover:border-white/[0.12]'
                }`}
              >
                All ({catalog.tools.length})
              </button>
              {catalog.categories.map(c => {
                const cs = getCatStyle(c.id);
                const isActive = activeCategory === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setActiveCategory(c.id)}
                    className={`shrink-0 px-3 py-1 rounded-full text-[10px] font-mono font-medium border transition-colors ${
                      isActive
                        ? `${cs.bg} ${cs.text} ${cs.border}`
                        : 'border-white/[0.06] text-muted-foreground hover:text-foreground hover:border-white/[0.12]'
                    }`}
                  >
                    {c.name} ({catalog.tools.filter(t => t.category === c.id).length})
                  </button>
                );
              })}
            </div>

            <GithubInstaller onInstall={handleGithubInstall} />

            <div className="flex flex-col gap-2">
              {filteredCatalog.map((t, i) => (
                <CatalogToolCard key={t.id} tool={t} installed={installedSlugs.has(t.id)} onInstall={handleInstall} installing={installing} index={i} />
              ))}
              {filteredCatalog.length === 0 && (
                <div className="flex flex-col items-center py-12 text-center">
                  <div className="rounded-full bg-white/[0.04] border border-white/[0.06] p-4 mb-4"><SearchIcon size={24} /></div>
                  <p className="text-sm font-mono text-muted-foreground">No tools match your search.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {tab === 'installed' && (
          <motion.div key="installed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            {installed.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="rounded-full bg-white/[0.04] border border-white/[0.06] p-4 mb-4"><PackageIcon size={24} /></div>
                <p className="text-sm font-mono font-medium mb-1">No tools installed</p>
                <p className="text-[11px] text-muted-foreground font-mono">Browse the catalog to install security tools for your agents.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {installed.map((t, i) => <InstalledToolCard key={t.id} tool={t} onUninstall={handleUninstall} onToggle={handleToggle} onSpawn={handleSpawn} index={i} />)}
              </div>
            )}
          </motion.div>
        )}

        {tab === 'containers' && (
          <motion.div key="containers" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            {containers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="rounded-full bg-white/[0.04] border border-white/[0.06] p-4 mb-4"><PackageIcon size={24} /></div>
                <p className="text-sm font-mono font-medium mb-1">No containers running</p>
                <p className="text-[11px] text-muted-foreground font-mono">Spawn containers from installed tools to give agents terminal access.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {containers.map((c, i) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: i * 0.03 }}
                    className="flex items-center gap-3 p-3 rounded-lg border border-white/[0.06] bg-[--card] hover:border-[--cyan]/20 transition-colors"
                  >
                    <div className={`shrink-0 w-2.5 h-2.5 rounded-full ${
                      c.status === 'running' ? 'bg-green-500 animate-pulse' :
                      c.status === 'stopped' ? 'bg-muted-foreground' : 'bg-red-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-mono font-medium truncate">{c.imageName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-mono text-muted-foreground">{c.containerId?.slice(0, 12)}</span>
                        <span className={`inline-flex rounded-full px-1.5 py-0.5 text-[9px] font-mono font-medium ${
                          c.status === 'running' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                          'bg-white/5 text-muted-foreground border border-white/10'
                        }`}>{c.status}</span>
                      </div>
                    </div>
                    {c.status === 'running' && (
                      <button onClick={() => handleStop(c.id)} className="text-xs font-mono text-muted-foreground hover:text-[--destructive] transition-colors">Stop</button>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
