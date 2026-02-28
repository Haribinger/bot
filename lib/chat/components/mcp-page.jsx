'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PlugIcon, RefreshIcon, SpinnerIcon, ChevronDownIcon, WrenchIcon, CheckIcon, XIcon } from './icons.js';
import { getMcpServers, getMcpStatus, getOwnMcpServerInfo, testMcpTool, reloadMcpClient } from '../../mcp/actions.js';

// ─── Animation variants ─────────────────────────────────────────────────────

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.3, ease: 'easeOut' },
  }),
};

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

// ─── External Server Card ────────────────────────────────────────────────────

function ServerCard({ server, index = 0 }) {
  const [expanded, setExpanded] = useState(false);
  const disabled = server.enabled === false;

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
              : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
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

      {expanded && (
        <div className="border-t border-white/[0.06] px-4 py-3">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] font-medium text-muted-foreground uppercase tracking-wider">URL</span>
              <span className="text-xs font-mono text-foreground/80">{server.url}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Transport</span>
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
        </div>
      )}
    </motion.div>
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

        {/* Terminal-style test output */}
        {hasResult && (
          <div className="mt-2 rounded-md border border-white/[0.04] bg-black/30 overflow-hidden">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 border-b border-white/[0.04]">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-[#ff5f57]" />
                <div className="w-2 h-2 rounded-full bg-[#febc2e]" />
                <div className="w-2 h-2 rounded-full bg-[#28c840]" />
              </div>
              <span className="font-mono text-[9px] text-muted-foreground ml-1">output</span>
              {isError ? (
                <XIcon size={10} className="text-[--destructive] ml-auto" />
              ) : (
                <CheckIcon size={10} className="text-[--success] ml-auto" />
              )}
            </div>
            <pre className="text-[11px] p-2.5 font-mono overflow-auto max-h-32 whitespace-pre-wrap break-words text-foreground/80">
              {isError ? `Error: ${result.error}` : JSON.stringify(result.result, null, 2)}
            </pre>
          </div>
        )}
      </div>
      <button
        onClick={handleTest}
        disabled={testing}
        className="shrink-0 inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-mono font-medium border border-white/[0.06] hover:bg-white/[0.04] hover:border-[--cyan]/30 hover:text-[--cyan] transition-colors disabled:opacity-50"
      >
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

  async function load() {
    try {
      const [s, st, info] = await Promise.all([
        getMcpServers(),
        getMcpStatus(),
        getOwnMcpServerInfo(),
      ]);
      setServers(s);
      setStatus(st);
      setServerInfo(info);
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
      {servers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center rounded-lg border border-white/[0.06] bg-[--card]">
          <div className="rounded-full bg-[--cyan]/10 p-4 mb-4">
            <PlugIcon size={24} className="text-[--cyan]" />
          </div>
          <p className="text-sm font-medium mb-1 text-foreground">No external MCP servers configured</p>
          <p className="text-xs text-muted-foreground max-w-sm">
            Add servers by editing <span className="font-mono text-[--cyan]">config/MCP_SERVERS.json</span> in your project.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {enabledServers.length > 0 && enabledServers.map((s, i) => (
            <ServerCard key={`enabled-${i}`} server={s} index={i} />
          ))}
          {disabledServers.length > 0 && (
            <>
              <div className="flex items-center gap-2 pt-2 pb-1">
                <span className="font-mono text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Disabled</span>
                <span className="text-[10px] font-mono text-muted-foreground">({disabledServers.length})</span>
              </div>
              {disabledServers.map((s, i) => (
                <ServerCard key={`disabled-${i}`} server={s} index={i} />
              ))}
            </>
          )}
        </div>
      )}

      {/* ── Loaded External Tools ── */}
      {status?.tools?.length > 0 && (
        <>
          <SectionHeader label="Loaded External Tools" count={status.tools.length} />
          <div className="flex flex-col gap-2">
            {status.tools.map((t, i) => (
              <ToolCard key={t.name} tool={t} index={i} />
            ))}
          </div>
        </>
      )}
    </>
  );
}
