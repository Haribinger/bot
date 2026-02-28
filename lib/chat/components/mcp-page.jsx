'use client';

import { useState, useEffect } from 'react';
import { PlugIcon, RefreshIcon, SpinnerIcon, ChevronDownIcon, WrenchIcon } from './icons.js';
import { getMcpServers, getMcpStatus, getOwnMcpServerInfo, testMcpTool, reloadMcpClient } from '../../mcp/actions.js';

// ─────────────────────────────────────────────────────────────────────────────
// Section Header
// ─────────────────────────────────────────────────────────────────────────────

function SectionHeader({ label, count }) {
  return (
    <div className="flex items-center gap-2 pt-4 pb-1">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
      {count !== undefined && <span className="text-xs text-muted-foreground">({count})</span>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Server Tool/Resource Card
// ─────────────────────────────────────────────────────────────────────────────

function ItemCard({ name, description, badge }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
      <div className="shrink-0 rounded-md bg-muted p-2">
        <WrenchIcon size={14} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium font-mono truncate">{name}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{description}</p>}
      </div>
      {badge && (
        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground shrink-0">
          {badge}
        </span>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// External Server Card
// ─────────────────────────────────────────────────────────────────────────────

function ServerCard({ server }) {
  const [expanded, setExpanded] = useState(false);
  const disabled = server.enabled === false;

  return (
    <div className={`rounded-lg border bg-card transition-opacity ${disabled ? 'opacity-60' : ''}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-3 w-full text-left p-4 hover:bg-accent/50 rounded-lg"
      >
        <div className="shrink-0 rounded-md bg-muted p-2">
          <PlugIcon size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{server.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5 font-mono truncate">{server.url}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
            server.transport === 'http' ? 'bg-blue-500/10 text-blue-500' : 'bg-orange-500/10 text-orange-500'
          }`}>
            {server.transport || 'http'}
          </span>
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
            disabled ? 'bg-muted text-muted-foreground' : 'bg-green-500/10 text-green-500'
          }`}>
            {disabled ? 'disabled' : 'enabled'}
          </span>
          <span className={`transition-transform ${expanded ? 'rotate-180' : ''}`}>
            <ChevronDownIcon size={14} />
          </span>
        </div>
      </button>

      {expanded && (
        <div className="border-t px-4 py-3">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">URL:</span>
              <span className="text-xs font-mono">{server.url}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Transport:</span>
              <span className="text-xs font-mono">{server.transport || 'http'}</span>
            </div>
            {server.headers && Object.keys(server.headers).length > 0 && (
              <div>
                <span className="text-xs font-medium text-muted-foreground">Headers:</span>
                <pre className="text-xs bg-muted rounded-md p-2 mt-1 font-mono overflow-auto max-h-24">
                  {JSON.stringify(server.headers, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tool Card with Test button
// ─────────────────────────────────────────────────────────────────────────────

function ToolCard({ tool }) {
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

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
      <div className="shrink-0 rounded-md bg-muted p-2 mt-0.5">
        <WrenchIcon size={14} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium font-mono truncate">{tool.name}</p>
        {tool.description && <p className="text-xs text-muted-foreground mt-0.5">{tool.description}</p>}
        {result && (
          <pre className="text-xs bg-muted rounded-md p-2 mt-2 font-mono overflow-auto max-h-32 whitespace-pre-wrap break-words">
            {result.error ? `Error: ${result.error}` : JSON.stringify(result.result, null, 2)}
          </pre>
        )}
      </div>
      <button
        onClick={handleTest}
        disabled={testing}
        className="shrink-0 inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium border hover:bg-accent/50 transition-colors disabled:opacity-50"
      >
        {testing ? <SpinnerIcon size={12} /> : 'Test'}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

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
          <div key={i} className="h-20 animate-pulse rounded-lg bg-border/50" />
        ))}
      </div>
    );
  }

  const enabledServers = servers.filter(s => s.enabled !== false);
  const disabledServers = servers.filter(s => s.enabled === false);

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {status?.toolCount || 0} external tool{status?.toolCount !== 1 ? 's' : ''} loaded
          {servers.length > 0 && ` from ${enabledServers.length} server${enabledServers.length !== 1 ? 's' : ''}`}
        </p>
        <button
          onClick={handleReload}
          disabled={reloading}
          className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium border hover:bg-accent/50 transition-colors disabled:opacity-50"
        >
          {reloading ? <SpinnerIcon size={12} /> : <RefreshIcon size={12} />}
          Reload
        </button>
      </div>

      {/* ── thepopebot MCP Server ── */}
      {serverInfo && (
        <>
          <SectionHeader label="Server — Exposed to External Clients" count={serverInfo.tools.length + serverInfo.resources.length} />
          <p className="text-xs text-muted-foreground mb-3">
            External MCP clients can connect to <span className="font-mono">/api/mcp</span> with an API key.
          </p>
          <div className="flex flex-col gap-2 mb-2">
            {serverInfo.tools.map(t => (
              <ItemCard key={t.name} name={t.name} description={t.description} badge="tool" />
            ))}
            {serverInfo.resources.map(r => (
              <ItemCard key={r.uri} name={r.uri} description={r.description} badge="resource" />
            ))}
            {serverInfo.prompts.map(p => (
              <ItemCard key={p.name} name={p.name} description={p.description} badge="prompt" />
            ))}
          </div>
        </>
      )}

      {/* ── External MCP Servers (Client) ── */}
      <SectionHeader label="Client — External MCP Servers" count={servers.length} />
      {servers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <PlugIcon size={24} />
          </div>
          <p className="text-sm font-medium mb-1">No external MCP servers configured</p>
          <p className="text-xs text-muted-foreground max-w-sm">
            Add servers by editing <span className="font-mono">config/MCP_SERVERS.json</span> in your project.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {enabledServers.length > 0 && enabledServers.map((s, i) => (
            <ServerCard key={`enabled-${i}`} server={s} />
          ))}
          {disabledServers.length > 0 && (
            <>
              <div className="flex items-center gap-2 pt-2 pb-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Disabled</span>
                <span className="text-xs text-muted-foreground">({disabledServers.length})</span>
              </div>
              {disabledServers.map((s, i) => (
                <ServerCard key={`disabled-${i}`} server={s} />
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
            {status.tools.map(t => (
              <ToolCard key={t.name} tool={t} />
            ))}
          </div>
        </>
      )}
    </>
  );
}
