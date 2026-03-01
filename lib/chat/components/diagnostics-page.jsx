'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ActivityIcon,
  CheckIcon,
  XIcon,
  SpinnerIcon,
  RefreshIcon,
  CpuIcon,
  PlugIcon,
  DatabaseIcon,
  ServerIcon,
  GlobeIcon,
} from './icons.js';
import { runDiagnostics } from '../actions.js';

// ─── Constants ────────────────────────────────────────────────────────────────

const AUTO_REFRESH_SECONDS = 60;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function maskValue(val) {
  if (!val || val === 'N/A') return val || 'N/A';
  if (val.length <= 6) return '***';
  return val.slice(0, 3) + '***' + val.slice(-3);
}

function formatUptime(seconds) {
  if (!seconds && seconds !== 0) return 'N/A';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${seconds % 60}s`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TrafficLights({ label }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 rounded-full bg-[#ff5f57]" />
        <div className="w-2 h-2 rounded-full bg-[#febc2e]" />
        <div className="w-2 h-2 rounded-full bg-[#28c840]" />
      </div>
      {label && (
        <span className="font-mono text-[10px] font-medium text-[--cyan] uppercase tracking-wider ml-1">
          {label}
        </span>
      )}
    </div>
  );
}

function StatusDot({ status }) {
  const color =
    status === 'ok' || status === 'connected'
      ? 'bg-[--success]'
      : status === 'warning'
        ? 'bg-yellow-500'
        : 'bg-[--destructive]';
  return <div className={`w-2 h-2 rounded-full ${color} shrink-0`} />;
}

function StatusBadge({ status }) {
  const isOk = status === 'ok' || status === 'connected';
  const isWarn = status === 'warning' || status === 'no_key';
  const styles = isOk
    ? 'bg-[--success]/10 text-[--success] border-[--success]/20'
    : isWarn
      ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
      : 'bg-[--destructive]/10 text-[--destructive] border-[--destructive]/20';
  const label = isOk ? 'ok' : isWarn ? 'warn' : 'error';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-mono font-medium border ${styles}`}
    >
      {isOk ? <CheckIcon size={9} /> : <XIcon size={9} />}
      {label}
    </span>
  );
}

function MetricRow({ label, value, status, icon: Icon }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-white/[0.04] last:border-0">
      <StatusDot status={status} />
      {Icon && (
        <div className="shrink-0 text-muted-foreground">
          <Icon size={13} />
        </div>
      )}
      <span className="flex-1 text-xs font-mono text-muted-foreground">{label}</span>
      <span className="text-xs font-mono text-foreground/80 truncate max-w-[180px] text-right">
        {value}
      </span>
      <StatusBadge status={status} />
    </div>
  );
}

function SectionPanel({ label, icon: Icon, children, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.07, ease: 'easeOut' }}
      className="rounded-lg border border-white/[0.06] bg-[--card] overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <TrafficLights label={label} />
        {Icon && (
          <div className="text-muted-foreground/50">
            <Icon size={14} />
          </div>
        )}
      </div>
      <div className="px-4 py-1">{children}</div>
    </motion.div>
  );
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────

function SkeletonPanel() {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-[--card] overflow-hidden animate-pulse">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-white/10" />
          <div className="w-2 h-2 rounded-full bg-white/10" />
          <div className="w-2 h-2 rounded-full bg-white/10" />
        </div>
        <div className="w-24 h-3 rounded bg-white/[0.06] ml-1" />
      </div>
      <div className="px-4 py-3 flex flex-col gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-white/10 shrink-0" />
            <div className="flex-1 h-3 rounded bg-white/[0.06]" />
            <div className="w-20 h-3 rounded bg-white/[0.06]" />
            <div className="w-12 h-4 rounded-full bg-white/[0.06]" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Section: System Health ───────────────────────────────────────────────────

function SystemHealthPanel({ gateway, db }) {
  if (!gateway && !db) return null;

  const rows = [
    {
      label: 'Gateway',
      value: 'reachable',
      status: 'ok',
      icon: GlobeIcon,
    },
    {
      label: 'Database',
      value: db?.path
        ? `${db.path}${db.size ? ` (${db.size})` : ''}`
        : 'N/A',
      status: db?.status || 'error',
      icon: DatabaseIcon,
    },
    {
      label: 'Uptime',
      value: formatUptime(gateway?.uptime),
      status: gateway?.uptime != null ? 'ok' : 'warning',
      icon: ActivityIcon,
    },
    {
      label: 'Memory',
      value:
        gateway?.memoryMb
          ? `${gateway.memoryMb.used} MB / ${gateway.memoryMb.total} MB`
          : 'N/A',
      status: gateway?.memoryMb ? 'ok' : 'warning',
      icon: CpuIcon,
    },
    {
      label: 'Node.js',
      value: gateway?.nodeVersion || 'N/A',
      status: gateway?.nodeVersion ? 'ok' : 'warning',
      icon: ServerIcon,
    },
    {
      label: 'Package',
      value: gateway?.packageVersion ? `v${gateway.packageVersion}` : 'N/A',
      status: gateway?.packageVersion ? 'ok' : 'warning',
      icon: ServerIcon,
    },
  ];

  return (
    <SectionPanel label="System Health" icon={ActivityIcon} index={0}>
      {rows.map((row) => (
        <MetricRow key={row.label} {...row} />
      ))}
    </SectionPanel>
  );
}

// ─── Section: Provider Status ─────────────────────────────────────────────────

function ProviderStatusPanel({ providers }) {
  if (!providers) return null;

  return (
    <SectionPanel label="Provider Status" icon={GlobeIcon} index={1}>
      {providers.length === 0 ? (
        <div className="flex items-center gap-2 py-4 text-muted-foreground">
          <XIcon size={13} />
          <span className="text-xs font-mono">No providers configured</span>
        </div>
      ) : (
        providers.map((p) => (
          <div
            key={p.name}
            className="flex items-center gap-3 py-2.5 border-b border-white/[0.04] last:border-0"
          >
            <StatusDot status={p.status} />
            <span className="flex-1 text-xs font-mono text-muted-foreground capitalize">
              {p.name}
            </span>
            <div className="flex items-center gap-2 shrink-0">
              {p.model && (
                <span className="hidden sm:inline text-[10px] font-mono text-muted-foreground/60 max-w-[120px] truncate">
                  {p.model}
                </span>
              )}
              {p.latencyMs != null && (
                <span className="text-[10px] font-mono text-muted-foreground/60">
                  {p.latencyMs}ms
                </span>
              )}
              <StatusBadge status={p.status} />
            </div>
          </div>
        ))
      )}
    </SectionPanel>
  );
}

// ─── Section: MCP Status ──────────────────────────────────────────────────────

function McpStatusPanel({ mcp }) {
  if (!mcp) return null;

  return (
    <SectionPanel label="MCP Servers" icon={PlugIcon} index={2}>
      {mcp.length === 0 ? (
        <div className="flex items-center gap-2 py-4 text-muted-foreground">
          <PlugIcon size={13} />
          <span className="text-xs font-mono">No MCP servers configured</span>
        </div>
      ) : (
        mcp.map((server) => (
          <div
            key={server.name}
            className="flex items-center gap-3 py-2.5 border-b border-white/[0.04] last:border-0"
          >
            <StatusDot status={server.status} />
            <span className="flex-1 text-xs font-mono text-muted-foreground">
              {server.name}
            </span>
            <div className="flex items-center gap-2 shrink-0">
              {server.toolCount != null && (
                <span className="inline-flex items-center rounded-full bg-[--cyan]/10 border border-[--cyan]/20 px-2 py-0.5 text-[10px] font-mono text-[--cyan]">
                  {server.toolCount} tool{server.toolCount !== 1 ? 's' : ''}
                </span>
              )}
              <StatusBadge status={server.status} />
            </div>
          </div>
        ))
      )}
    </SectionPanel>
  );
}

// ─── Section: Config Drift ────────────────────────────────────────────────────

function ConfigDriftPanel({ configDrift }) {
  if (!configDrift) return null;

  const drifted = configDrift.filter((r) => !r.match);
  const allMatch = drifted.length === 0;

  return (
    <SectionPanel label="Config Drift" icon={ServerIcon} index={3}>
      {configDrift.length === 0 ? (
        <div className="flex items-center gap-2 py-4 text-muted-foreground">
          <CheckIcon size={13} />
          <span className="text-xs font-mono">No config keys tracked</span>
        </div>
      ) : allMatch ? (
        <div className="flex items-center gap-2 py-4">
          <CheckIcon size={13} className="text-[--success]" />
          <span className="text-xs font-mono text-[--success]">
            All {configDrift.length} config key{configDrift.length !== 1 ? 's' : ''} in sync
          </span>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full min-w-[480px] text-[11px] font-mono mt-1 mb-1">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left py-2 pr-4 text-[10px] text-muted-foreground uppercase tracking-wider font-medium w-[35%]">
                  Key
                </th>
                <th className="text-left py-2 pr-4 text-[10px] text-muted-foreground uppercase tracking-wider font-medium w-[25%]">
                  .env
                </th>
                <th className="text-left py-2 pr-4 text-[10px] text-muted-foreground uppercase tracking-wider font-medium w-[25%]">
                  DB
                </th>
                <th className="text-right py-2 text-[10px] text-muted-foreground uppercase tracking-wider font-medium w-[15%]">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {configDrift.map((row) => (
                <tr
                  key={row.key}
                  className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors"
                >
                  <td className="py-2.5 pr-4 text-foreground/80">{row.key}</td>
                  <td className="py-2.5 pr-4 text-muted-foreground">
                    {maskValue(row.envValue)}
                  </td>
                  <td className="py-2.5 pr-4 text-muted-foreground">
                    {maskValue(row.dbValue)}
                  </td>
                  <td className="py-2.5 text-right">
                    {row.match ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[--success]/10 text-[--success] border border-[--success]/20 px-2 py-0.5 text-[10px]">
                        <CheckIcon size={9} /> match
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-2 py-0.5 text-[10px]">
                        <XIcon size={9} /> drift
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionPanel>
  );
}

// ─── Auto-refresh countdown ───────────────────────────────────────────────────

function RefreshCountdown({ seconds, onTick }) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    setRemaining(seconds);
  }, [seconds]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          onTick();
          return AUTO_REFRESH_SECONDS;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [onTick]);

  const pct = (remaining / AUTO_REFRESH_SECONDS) * 100;
  const circumference = 2 * Math.PI * 6;
  const dashoffset = circumference * (1 - pct / 100);

  return (
    <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
      <svg width="16" height="16" viewBox="0 0 16 16" className="-rotate-90">
        <circle
          cx="8"
          cy="8"
          r="6"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.15"
          strokeWidth="2"
        />
        <circle
          cx="8"
          cy="8"
          r="6"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.6"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          style={{ transition: 'stroke-dashoffset 1s linear' }}
        />
      </svg>
      <span>{remaining}s</span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function DiagnosticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);
  const [lastRun, setLastRun] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  async function runChecks() {
    if (running) return;
    setRunning(true);
    setError(null);
    try {
      const result = await runDiagnostics();
      if (isMounted.current) {
        setData(result);
        setLastRun(new Date());
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err.message || 'Diagnostics failed');
      }
    } finally {
      if (isMounted.current) {
        setRunning(false);
        setLoading(false);
      }
    }
  }

  function handleAutoRefresh() {
    setRefreshKey((k) => k + 1);
    runChecks();
  }

  useEffect(() => {
    runChecks();
  }, []);

  const overallOk =
    data &&
    data.gateway?.status === 'ok' &&
    data.db?.status === 'ok' &&
    (data.providers ?? []).every((p) => p.status === 'ok') &&
    (data.mcp ?? []).every((m) => m.status === 'connected') &&
    (data.configDrift ?? []).every((c) => c.match);

  const driftCount = (data?.configDrift ?? []).filter((c) => !c.match).length;
  const providerErrors = (data?.providers ?? []).filter(
    (p) => p.status !== 'ok'
  ).length;

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-mono font-semibold text-[--cyan] text-glow-cyan">
            Diagnostics
          </h1>
          <p className="text-[11px] text-muted-foreground mt-1 font-mono">
            System health, provider connectivity, and configuration integrity
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {!loading && data && (
            <RefreshCountdown key={refreshKey} seconds={AUTO_REFRESH_SECONDS} onTick={handleAutoRefresh} />
          )}
          <button
            onClick={runChecks}
            disabled={running}
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-mono font-medium bg-[--cyan]/10 text-[--cyan] border border-[--cyan]/20 hover:bg-[--cyan] hover:text-[--primary-foreground] transition-colors disabled:opacity-50"
          >
            {running ? <SpinnerIcon size={12} /> : <RefreshIcon size={12} />}
            Run All Checks
          </button>
        </div>
      </div>

      {/* Overall status bar */}
      <AnimatePresence>
        {!loading && data && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden mb-5"
          >
            <div
              className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${
                overallOk
                  ? 'border-[--success]/20 bg-[--success]/5'
                  : 'border-yellow-500/20 bg-yellow-500/5'
              }`}
            >
              <div
                className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                  overallOk ? 'bg-[--success]' : 'bg-yellow-500'
                }`}
              />
              <span
                className={`text-xs font-mono font-medium ${
                  overallOk ? 'text-[--success]' : 'text-yellow-500'
                }`}
              >
                {overallOk
                  ? 'All systems operational'
                  : `Issues detected — ${[
                      providerErrors > 0 && `${providerErrors} provider error${providerErrors !== 1 ? 's' : ''}`,
                      driftCount > 0 && `${driftCount} config drift${driftCount !== 1 ? 's' : ''}`,
                      data.db?.status !== 'ok' && 'database error',
                    ]
                      .filter(Boolean)
                      .join(', ')}`}
              </span>
              {lastRun && (
                <span className="ml-auto text-[10px] font-mono text-muted-foreground shrink-0">
                  Last run {lastRun.toLocaleTimeString()}
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error state */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-lg border border-[--destructive]/20 bg-[--destructive]/5 px-4 py-3 mb-5 flex items-center gap-2"
          >
            <XIcon size={14} className="text-[--destructive] shrink-0" />
            <span className="text-xs font-mono text-[--destructive]">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Panels */}
      {loading ? (
        <div className="flex flex-col gap-4">
          {[...Array(4)].map((_, i) => (
            <SkeletonPanel key={i} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <SystemHealthPanel gateway={data?.gateway} db={data?.db} />
          <ProviderStatusPanel providers={data?.providers} />
          <McpStatusPanel mcp={data?.mcp} />
          <ConfigDriftPanel configDrift={data?.configDrift} />
        </div>
      )}
    </>
  );
}
