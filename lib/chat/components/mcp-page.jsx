'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlugIcon, RefreshIcon, SpinnerIcon, ChevronDownIcon, WrenchIcon, CheckIcon, XIcon, SearchIcon, PlusIcon, TrashIcon, DownloadIcon } from './icons.js';
import { getMcpServers, getMcpStatus, getOwnMcpServerInfo, testMcpTool, reloadMcpClient, getMcpRegistry, addMcpServer, removeMcpServer, toggleMcpServer } from '../../mcp/actions.js';

// ─── Animation variants ─────────────────────────────────────────────────────

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.3, ease: 'easeOut' },
  }),
};

const CATEGORY_COLORS = {
  search: { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/20' },
  web: { bg: 'bg-orange-500/10', text: 'text-orange-500', border: 'border-orange-500/20' },
  dev: { bg: 'bg-purple-500/10', text: 'text-purple-500', border: 'border-purple-500/20' },
  communication: { bg: 'bg-green-500/10', text: 'text-green-500', border: 'border-green-500/20' },
  system: { bg: 'bg-gray-500/10', text: 'text-gray-500', border: 'border-gray-500/20' },
  database: { bg: 'bg-cyan-500/10', text: 'text-cyan-500', border: 'border-cyan-500/20' },
  monitoring: { bg: 'bg-yellow-500/10', text: 'text-yellow-500', border: 'border-yellow-500/20' },
  cloud: { bg: 'bg-indigo-500/10', text: 'text-indigo-500', border: 'border-indigo-500/20' },
};

function getCatStyle(cat) {
  return CATEGORY_COLORS[cat] || { bg: 'bg-white/5', text: 'text-muted-foreground', border: 'border-white/10' };
}

// ─── Section Header ──────────────────────────────────────────────────────────

function SectionHeader({ label, count }) {
  return (
    <div className="flex items-center gap-2 pt-6 pb-2">
      <span className="font-mono text-[10px] font-medium text-[--cyan] uppercase tracking-wider">{label}</span>
      {count !== undefined && (
        <span className="inline-flex items-center rounded-full bg-[--cyan]/10 px-2 py-0.5 text-[10px] font-mono font-medium text-[--cyan]">
          {count}
        </span>
      )}
    </div>
  );
}

// ─── Item Card (server tool/resource/prompt) ─────────────────────────────────

function ItemCard({ name, description, badge, index = 0 }) {
  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="flex items-center gap-3 p-3 rounded-lg border border-white/[0.06] bg-[--card]"
    >
      <div className="shrink-0 rounded-md bg-[--cyan]/10 p-2">
        <WrenchIcon size={14} className="text-[--cyan]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium font-mono truncate text-foreground">{name}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{description}</p>}
      </div>
      {badge && (
        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-mono font-medium bg-white/[0.04] text-muted-foreground shrink-0 border border-white/[0.06]">
          {badge}
        </span>
      )}
      <div className="w-2 h-2 rounded-full bg-[--success] shrink-0" />
    </motion.div>
  );
}

// ─── Registry Card ──────────────────────────────────────────────────────────

function RegistryCard({ server, installed, onInstall, installing, index }) {
  const [apiKey, setApiKey] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const cat = getCatStyle(server.category);

  function handleAdd() {
    if (server.requiresKey && !apiKey && !showKeyInput) {
      setShowKeyInput(true);
      return;
    }
    const config = {
      name: server.name,
      url: server.url || '',
      transport: server.transport || 'http',
      enabled: true,
    };
    if (apiKey && server.keyEnvVar) {
      config.headers = { Authorization: `Bearer ${apiKey}` };
    }
    if (server.npmPackage) {
      config.command = 'npx';
      config.args = ['-y', server.npmPackage];
      config.transport = 'stdio';
    }
    onInstall(config);
  }

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
          <p className="text-sm font-mono font-medium truncate">{server.name}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1 font-mono">{server.description}</p>
        </div>
        <span className={`shrink-0 inline-flex rounded-full px-2 py-0.5 text-[10px] font-mono font-medium border ${cat.bg} ${cat.text} ${cat.border}`}>
          {server.category}
        </span>
        {installed ? (
          <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-green-500/10 text-green-500 border border-green-500/20 px-2 py-0.5 text-[10px] font-mono font-medium">
            <CheckIcon size={10} /> added
          </span>
        ) : (
          <button
            onClick={handleAdd}
            disabled={installing}
            className="shrink-0 inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-mono font-medium bg-[--cyan]/10 text-[--cyan] border border-[--cyan]/20 hover:bg-[--cyan] hover:text-[--primary-foreground] transition-colors disabled:opacity-50"
          >
            {installing ? <SpinnerIcon size={12} /> : <DownloadIcon size={12} />}
            Add
          </button>
        )}
      </div>
      {showKeyInput && !installed && (
        <div className="border-t border-white/[0.06] px-3 py-2.5 flex gap-2">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={`${server.keyEnvVar || 'API_KEY'}...`}
            className="flex-1 text-xs border border-white/[0.06] rounded-md px-2.5 py-1.5 bg-black/20 font-mono text-foreground/80 placeholder:text-muted-foreground/50 focus:outline-none focus:border-[--cyan]/40 focus:ring-1 focus:ring-[--cyan]/20 transition-colors"
            autoFocus
          />
          <button
            onClick={handleAdd}
            disabled={!apiKey}
            className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-mono font-medium bg-[--cyan]/10 text-[--cyan] border border-[--cyan]/20 hover:bg-[--cyan] hover:text-[--primary-foreground] transition-colors disabled:opacity-50"
          >
            Add
          </button>
        </div>
      )}
    </motion.div>
  );
}

// ─── External Server Card ────────────────────────────────────────────────────

function ServerCard({ server, onToggle, onRemove, index = 0 }) {
  const [expanded, setExpanded] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const disabled = server.enabled === false;

  function handleRemove() {
    if (!confirming) {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 3000);
      return;
    }
    onRemove(server.name);
  }

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className={`rounded-lg border border-white/[0.06] bg-[--card] transition-opacity ${disabled ? 'opacity-50' : ''}`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-3 w-full text-left p-4 hover:bg-white/[0.02] rounded-lg transition-colors"
      >
        <div className="shrink-0 rounded-md bg-[--cyan]/10 p-2">
          <PlugIcon size={16} className="text-[--cyan]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate text-foreground">{server.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5 font-mono truncate">{server.url}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-mono font-medium ${
            server.transport === 'http'
              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
              : server.transport === 'sse'
                ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
          }`}>
            {server.transport || 'http'}
          </span>
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-mono font-medium ${
            disabled
              ? 'bg-white/[0.04] text-muted-foreground border border-white/[0.06]'
              : 'bg-[--success]/10 text-[--success] border border-[--success]/20'
          }`}>
            {disabled ? 'disabled' : 'enabled'}
          </span>
          <span className={`transition-transform ${expanded ? 'rotate-180' : ''}`}>
            <ChevronDownIcon size={14} />
          </span>
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
            <div className="border-t border-white/[0.06] px-4 py-3">
              <div className="flex flex-col gap-1.5">
                {server.url && (
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-medium text-muted-foreground uppercase tracking-wider w-16 shrink-0">URL</span>
                    <span className="text-xs font-mono text-foreground/80">{server.url}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-medium text-muted-foreground uppercase tracking-wider w-16 shrink-0">Transport</span>
                  <span className="text-xs font-mono text-foreground/80">{server.transport || 'http'}</span>
                </div>
                {server.headers && Object.keys(server.headers).length > 0 && (
                  <div>
                    <span className="font-mono text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Headers</span>
                    <pre className="text-[11px] bg-black/30 rounded-md p-2.5 mt-1 font-mono overflow-auto max-h-24 text-foreground/80 border border-white/[0.04]">
                      {JSON.stringify(server.headers, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={(e) => { e.stopPropagation(); onToggle(server.name); }}
                  className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-mono font-medium border border-white/[0.06] hover:bg-white/[0.04] transition-colors"
                >
                  {disabled ? 'Enable' : 'Disable'}
                </button>
                <div className="flex-1" />
                <button
                  onClick={(e) => { e.stopPropagation(); handleRemove(); }}
                  className={`text-xs font-mono transition-colors ${
                    confirming ? 'text-[--destructive]' : 'text-muted-foreground hover:text-[--destructive]'
                  }`}
                >
                  {confirming ? 'Confirm remove' : 'Remove'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Add Custom Server Form ─────────────────────────────────────────────────

function AddServerForm({ onAdd }) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [transport, setTransport] = useState('http');
  const [headers, setHeaders] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  async function handleAdd() {
    if (!name || !url) return;
    setLoading(true);
    setResult(null);
    let headerObj = {};
    if (headers) {
      try { headerObj = JSON.parse(headers); } catch { setResult({ error: 'Invalid JSON headers' }); setLoading(false); return; }
    }
    const res = await onAdd({ name, url, transport, headers: headerObj, enabled: true });
    setResult(res);
    if (!res.error) { setName(''); setUrl(''); setHeaders(''); }
    setLoading(false);
  }

  return (
    <div className="rounded-lg border border-white/[0.06] bg-[--card] p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <PlusIcon size={14} />
        <p className="text-sm font-mono font-medium text-[--cyan]">Add Custom Server</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <input placeholder="Server name" value={name} onChange={(e) => setName(e.target.value)}
          className="text-sm border border-white/[0.06] rounded-md px-3 py-2 bg-black/20 font-mono text-foreground/80 placeholder:text-muted-foreground/50 focus:outline-none focus:border-[--cyan]/40 focus:ring-1 focus:ring-[--cyan]/20 transition-colors" />
        <input placeholder="https://mcp.example.com/sse" value={url} onChange={(e) => setUrl(e.target.value)}
          className="text-sm border border-white/[0.06] rounded-md px-3 py-2 bg-black/20 font-mono text-foreground/80 placeholder:text-muted-foreground/50 focus:outline-none focus:border-[--cyan]/40 focus:ring-1 focus:ring-[--cyan]/20 transition-colors" />
        <select value={transport} onChange={(e) => setTransport(e.target.value)}
          className="text-sm border border-white/[0.06] rounded-md px-3 py-2 bg-black/20 font-mono text-foreground/80 focus:outline-none focus:border-[--cyan]/40 focus:ring-1 focus:ring-[--cyan]/20 transition-colors appearance-none">
          <option value="http">HTTP</option>
          <option value="sse">SSE</option>
        </select>
        <input placeholder='{"Authorization": "Bearer ..."}' value={headers} onChange={(e) => setHeaders(e.target.value)}
          className="text-sm border border-white/[0.06] rounded-md px-3 py-2 bg-black/20 font-mono text-foreground/80 placeholder:text-muted-foreground/50 focus:outline-none focus:border-[--cyan]/40 focus:ring-1 focus:ring-[--cyan]/20 transition-colors" />
      </div>
      <div className="flex items-center gap-2">
        <button onClick={handleAdd} disabled={loading || !name || !url}
          className="inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-xs font-mono font-medium bg-[--cyan]/10 text-[--cyan] border border-[--cyan]/20 hover:bg-[--cyan] hover:text-[--primary-foreground] transition-colors disabled:opacity-50">
          {loading ? <SpinnerIcon size={12} /> : <PlusIcon size={12} />} Add Server
        </button>
        {result && (
          <p className={`text-xs font-mono ${result.error ? 'text-[--destructive]' : 'text-green-500'}`}>
            {result.error || 'Added successfully'}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Tool Card with Test ─────────────────────────────────────────────────────

function ToolCard({ tool, index = 0 }) {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState(null);

  async function handleTest() {
    setTesting(true);
    setResult(null);
    try {
      const res = await testMcpTool(tool.name, {});
      setResult(res);
    } catch (err) {
      setResult({ error: err.message });
    } finally {
      setTesting(false);
    }
  }

  const hasResult = result !== null;
  const isError = result?.error;

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="flex items-start gap-3 p-3 rounded-lg border border-white/[0.06] bg-[--card]"
    >
      <div className="shrink-0 rounded-md bg-[--cyan]/10 p-2 mt-0.5">
        <WrenchIcon size={14} className="text-[--cyan]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium font-mono truncate text-foreground">{tool.name}</p>
        {tool.description && <p className="text-xs text-muted-foreground mt-0.5">{tool.description}</p>}
        {hasResult && (
          <div className="mt-2 rounded-md border border-white/[0.04] bg-black/30 overflow-hidden">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 border-b border-white/[0.04]">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-[#ff5f57]" />
                <div className="w-2 h-2 rounded-full bg-[#febc2e]" />
                <div className="w-2 h-2 rounded-full bg-[#28c840]" />
              </div>
              <span className="font-mono text-[9px] text-muted-foreground ml-1">output</span>
              {isError ? <XIcon size={10} className="text-[--destructive] ml-auto" /> : <CheckIcon size={10} className="text-[--success] ml-auto" />}
            </div>
            <pre className="text-[11px] p-2.5 font-mono overflow-auto max-h-32 whitespace-pre-wrap break-words text-foreground/80">
              {isError ? `Error: ${result.error}` : JSON.stringify(result.result, null, 2)}
            </pre>
          </div>
        )}
      </div>
      <button onClick={handleTest} disabled={testing}
        className="shrink-0 inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-mono font-medium border border-white/[0.06] hover:bg-white/[0.04] hover:border-[--cyan]/30 hover:text-[--cyan] transition-colors disabled:opacity-50">
        {testing ? <SpinnerIcon size={12} /> : 'Test'}
      </button>
    </motion.div>
  );
}

// ─── Stats Card ──────────────────────────────────────────────────────────────

function StatsCard({ label, value }) {
  return (
    <div className="flex flex-col items-center justify-center p-4 rounded-lg border border-white/[0.06] bg-[--card]">
      <span className="text-2xl font-semibold text-[--cyan] font-mono">{value}</span>
      <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mt-1">{label}</span>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export function McpPage() {
  const [loading, setLoading] = useState(true);
  const [reloading, setReloading] = useState(false);
  const [servers, setServers] = useState([]);
  const [status, setStatus] = useState(null);
  const [serverInfo, setServerInfo] = useState(null);
  const [registry, setRegistry] = useState({ servers: [], categories: [] });
  const [search, setSearch] = useState('');
  const [installing, setInstalling] = useState(false);
  const [tab, setTab] = useState('servers');

  async function load() {
    try {
      const [s, st, info, reg] = await Promise.all([
        getMcpServers(),
        getMcpStatus(),
        getOwnMcpServerInfo(),
        getMcpRegistry(),
      ]);
      setServers(s);
      setStatus(st);
      setServerInfo(info);
      setRegistry(reg);
    } catch {}
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleReload() {
    setReloading(true);
    try {
      await reloadMcpClient();
      await load();
    } catch {}
    setReloading(false);
  }

  async function handleAddFromRegistry(config) {
    setInstalling(true);
    await addMcpServer(config);
    await load();
    setInstalling(false);
  }

  async function handleAddCustom(config) {
    const result = await addMcpServer(config);
    if (!result.error) await load();
    return result;
  }

  async function handleToggle(name) {
    await toggleMcpServer(name);
    await load();
  }

  async function handleRemove(name) {
    await removeMcpServer(name);
    await load();
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 animate-shimmer rounded-lg border border-white/[0.06] bg-[--card]" />
        ))}
      </div>
    );
  }

  const enabledServers = servers.filter(s => s.enabled !== false);
  const disabledServers = servers.filter(s => s.enabled === false);
  const serverNames = new Set(servers.map(s => s.name));

  const filteredRegistry = registry.servers.filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q) || s.category.toLowerCase().includes(q);
  });

  const tabs = [
    { id: 'servers', label: 'SERVERS', count: servers.length },
    { id: 'hub', label: 'MCP HUB', count: registry.servers.length },
    { id: 'tools', label: 'TOOLS', count: status?.toolCount || 0 },
  ];

  return (
    <>
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <StatsCard label="External Tools" value={status?.toolCount || 0} />
        <StatsCard label="Servers" value={enabledServers.length} />
        <StatsCard label="Server Tools" value={serverInfo?.tools?.length || 0} />
      </div>

      {/* Reload bar */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-muted-foreground font-mono">
          {status?.toolCount || 0} tool{status?.toolCount !== 1 ? 's' : ''} loaded
          {servers.length > 0 && ` from ${enabledServers.length} server${enabledServers.length !== 1 ? 's' : ''}`}
        </p>
        <button
          onClick={handleReload}
          disabled={reloading}
          className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-mono font-medium border border-white/[0.06] hover:bg-white/[0.04] hover:border-[--cyan]/30 hover:text-[--cyan] transition-colors disabled:opacity-50"
        >
          {reloading ? <SpinnerIcon size={12} /> : <RefreshIcon size={12} />}
          Reload
        </button>
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
        {/* Servers tab */}
        {tab === 'servers' && (
          <motion.div key="servers" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            {/* ── Server — Exposed MCP ── */}
            {serverInfo && (
              <>
                <SectionHeader label="Server — Exposed to External Clients" count={serverInfo.tools.length + serverInfo.resources.length} />
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-flex items-center rounded-md bg-[--card] border border-white/[0.06] px-2.5 py-1 text-[11px] font-mono text-muted-foreground">
                    /api/mcp
                  </span>
                  <div className="w-1.5 h-1.5 rounded-full bg-[--success]" />
                </div>
                <div className="flex flex-col gap-2 mb-2">
                  {serverInfo.tools.map((t, i) => (
                    <ItemCard key={t.name} name={t.name} description={t.description} badge="tool" index={i} />
                  ))}
                  {serverInfo.resources.map((r, i) => (
                    <ItemCard key={r.uri} name={r.uri} description={r.description} badge="resource" index={serverInfo.tools.length + i} />
                  ))}
                  {serverInfo.prompts.map((p, i) => (
                    <ItemCard key={p.name} name={p.name} description={p.description} badge="prompt" index={serverInfo.tools.length + serverInfo.resources.length + i} />
                  ))}
                </div>
              </>
            )}

            {/* ── Client — External MCP Servers ── */}
            <SectionHeader label="Client — External MCP Servers" count={servers.length} />

            <AddServerForm onAdd={handleAddCustom} />

            {servers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center rounded-lg border border-white/[0.06] bg-[--card]">
                <div className="rounded-full bg-[--cyan]/10 p-4 mb-4">
                  <PlugIcon size={24} className="text-[--cyan]" />
                </div>
                <p className="text-sm font-medium mb-1 text-foreground">No external MCP servers configured</p>
                <p className="text-xs text-muted-foreground max-w-sm">
                  Add servers from the <button onClick={() => setTab('hub')} className="text-[--cyan] hover:underline">MCP Hub</button> or add a custom server above.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {enabledServers.map((s, i) => (
                  <ServerCard key={`enabled-${s.name}-${i}`} server={s} onToggle={handleToggle} onRemove={handleRemove} index={i} />
                ))}
                {disabledServers.length > 0 && (
                  <>
                    <div className="flex items-center gap-2 pt-2 pb-1">
                      <span className="font-mono text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Disabled</span>
                      <span className="text-[10px] font-mono text-muted-foreground">({disabledServers.length})</span>
                    </div>
                    {disabledServers.map((s, i) => (
                      <ServerCard key={`disabled-${s.name}-${i}`} server={s} onToggle={handleToggle} onRemove={handleRemove} index={i} />
                    ))}
                  </>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* Hub tab */}
        {tab === 'hub' && (
          <motion.div key="hub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            {/* Search */}
            <div className="relative mb-4">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"><SearchIcon size={14} /></div>
              <input
                placeholder="Search MCP servers..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full text-sm border border-white/[0.06] rounded-md pl-9 pr-3 py-2 bg-black/20 font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:border-[--cyan]/40 focus:ring-1 focus:ring-[--cyan]/20 transition-colors"
              />
            </div>

            <div className="flex flex-col gap-2">
              {filteredRegistry.map((s, i) => (
                <RegistryCard
                  key={s.id}
                  server={s}
                  installed={serverNames.has(s.name)}
                  onInstall={handleAddFromRegistry}
                  installing={installing}
                  index={i}
                />
              ))}
              {filteredRegistry.length === 0 && (
                <div className="flex flex-col items-center py-12 text-center">
                  <div className="rounded-full bg-white/[0.04] border border-white/[0.06] p-4 mb-4"><SearchIcon size={24} /></div>
                  <p className="text-sm font-mono text-muted-foreground">No servers match your search.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Tools tab */}
        {tab === 'tools' && (
          <motion.div key="tools" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            {status?.tools?.length > 0 ? (
              <div className="flex flex-col gap-2">
                {status.tools.map((t, i) => (
                  <ToolCard key={t.name} tool={t} index={i} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="rounded-full bg-white/[0.04] border border-white/[0.06] p-4 mb-4"><WrenchIcon size={24} /></div>
                <p className="text-sm font-mono font-medium mb-1">No tools loaded</p>
                <p className="text-[11px] text-muted-foreground font-mono">Add MCP servers to load external tools.</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
