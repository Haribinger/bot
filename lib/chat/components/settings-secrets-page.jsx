'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { KeyIcon, CopyIcon, CheckIcon, TrashIcon, RefreshIcon, SpinnerIcon, GlobeIcon, ZapIcon } from './icons.js';
import { createNewApiKey, getApiKeys, deleteApiKey, getIntegrationStatus, testIntegration } from '../actions.js';

function timeAgo(ts) {
  if (!ts) return 'Never';
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function formatDate(ts) {
  if (!ts) return '\u2014';
  return new Date(ts).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-mono font-medium border border-white/[0.06] hover:bg-white/[0.04] hover:border-[--cyan]/30 hover:text-[--cyan] transition-colors"
    >
      {copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

// ─── Section Header ──────────────────────────────────────────────────────────

function SectionHeader({ label, description }) {
  return (
    <div className="pb-2 mb-4">
      <span className="font-mono text-[10px] font-medium text-[--cyan] uppercase tracking-wider">{label}</span>
      {description && (
        <p className="text-xs text-muted-foreground mt-1 font-mono">{description}</p>
      )}
    </div>
  );
}

// ─── API Key section ─────────────────────────────────────────────────────────

function ApiKeySection() {
  const [currentKey, setCurrentKey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);
  const [error, setError] = useState(null);

  const loadKey = async () => {
    try {
      const result = await getApiKeys();
      setCurrentKey(result);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKey();
  }, []);

  const handleCreate = async () => {
    if (creating) return;
    setCreating(true);
    setError(null);
    setConfirmRegenerate(false);
    try {
      const result = await createNewApiKey();
      if (result.error) {
        setError(result.error);
      } else {
        setNewKey(result.key);
        await loadKey();
      }
    } catch {
      setError('Failed to create API key');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    try {
      await deleteApiKey();
      setCurrentKey(null);
      setNewKey(null);
      setConfirmDelete(false);
    } catch {}
  };

  const handleRegenerate = () => {
    if (!confirmRegenerate) {
      setConfirmRegenerate(true);
      setTimeout(() => setConfirmRegenerate(false), 3000);
      return;
    }
    handleCreate();
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        <div className="h-16 animate-shimmer rounded-lg border border-white/[0.06] bg-[--card]" />
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="rounded-md border border-[--destructive]/20 bg-[--destructive]/5 px-3 py-2 mb-4">
          <p className="text-xs font-mono text-[--destructive]">{error}</p>
        </div>
      )}

      {/* New key banner */}
      {newKey && (
        <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-4 mb-4">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-[#ff5f57]" />
              <div className="w-2 h-2 rounded-full bg-[#febc2e]" />
              <div className="w-2 h-2 rounded-full bg-[#28c840]" />
            </div>
            <span className="font-mono text-[9px] text-green-500 ml-1">new api key</span>
            <button
              onClick={() => setNewKey(null)}
              className="text-[10px] font-mono text-muted-foreground hover:text-foreground ml-auto"
            >
              Dismiss
            </button>
          </div>
          <p className="text-xs font-mono text-green-500 mb-2">
            Copy this key now. You won't be able to see it again.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-md bg-black/30 border border-white/[0.04] px-3 py-2 text-[11px] font-mono break-all select-all text-foreground/80">
              {newKey}
            </code>
            <CopyButton text={newKey} />
          </div>
        </div>
      )}

      {currentKey ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-white/[0.06] bg-[--card] hover:border-[--cyan]/20 transition-colors"
        >
          <div className="flex items-center gap-3 p-4">
            <div className="flex items-center gap-1 shrink-0">
              <div className="w-2 h-2 rounded-full bg-[#ff5f57]" />
              <div className="w-2 h-2 rounded-full bg-[#febc2e]" />
              <div className="w-2 h-2 rounded-full bg-[#28c840]" />
            </div>
            <div className="shrink-0 rounded-md bg-[--cyan]/10 p-2">
              <KeyIcon size={16} className="text-[--cyan]" />
            </div>
            <div className="flex-1 min-w-0">
              <code className="text-sm font-mono text-foreground">{currentKey.keyPrefix}...</code>
              <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                Created {formatDate(currentKey.createdAt)}
                {currentKey.lastUsedAt && (
                  <span className="ml-2">\u00b7 Last used {timeAgo(currentKey.lastUsedAt)}</span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-2 h-2 rounded-full bg-[--success]" />
              <button
                onClick={handleRegenerate}
                disabled={creating}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-mono font-medium border transition-colors disabled:opacity-50 ${
                  confirmRegenerate
                    ? 'border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10'
                    : 'border-white/[0.06] text-muted-foreground hover:bg-white/[0.04] hover:border-[--cyan]/30 hover:text-[--cyan]'
                }`}
              >
                {creating ? <SpinnerIcon size={12} /> : <RefreshIcon size={12} />}
                {creating ? 'Generating...' : confirmRegenerate ? 'Confirm' : 'Regenerate'}
              </button>
              <button
                onClick={handleDelete}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-mono font-medium border transition-colors ${
                  confirmDelete
                    ? 'border-[--destructive]/30 text-[--destructive] hover:bg-[--destructive]/10'
                    : 'border-white/[0.06] text-muted-foreground hover:text-[--destructive] hover:border-[--destructive]/20'
                }`}
              >
                <TrashIcon size={12} />
                {confirmDelete ? 'Confirm' : 'Delete'}
              </button>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center rounded-lg border border-white/[0.06] bg-[--card]">
          <div className="rounded-full bg-[--cyan]/10 p-4 mb-4">
            <KeyIcon size={24} className="text-[--cyan]" />
          </div>
          <p className="text-sm font-mono font-medium mb-1">No API key configured</p>
          <p className="text-[11px] text-muted-foreground font-mono mb-4">
            Generate a key to authenticate external requests to /api endpoints.
          </p>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-xs font-mono font-medium bg-[--cyan]/10 text-[--cyan] border border-[--cyan]/20 hover:bg-[--cyan] hover:text-[--primary-foreground] transition-colors disabled:opacity-50"
          >
            {creating ? <SpinnerIcon size={12} /> : <KeyIcon size={12} />}
            {creating ? 'Creating...' : 'Create API Key'}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Integration Status ───────────────────────────────────────────────────────

function IntegrationRow({ integration }) {
  const allConfigured = integration.keys.every((k) => k.configured);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null); // null | 'ok' | 'error'

  const handleTest = async () => {
    if (testing) return;
    setTesting(true);
    setTestResult(null);
    try {
      const result = await testIntegration(integration.name);
      setTestResult(result?.ok ? 'ok' : 'error');
    } catch {
      setTestResult('error');
    } finally {
      setTesting(false);
      setTimeout(() => setTestResult(null), 3000);
    }
  };

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/[0.04] last:border-b-0">
      {/* Status dot */}
      <div
        className={`w-2 h-2 rounded-full shrink-0 ${
          allConfigured ? 'bg-[--success]' : 'bg-muted-foreground/40'
        }`}
      />

      {/* Name */}
      <span className="text-sm font-mono text-foreground/80 w-40 shrink-0">
        {integration.name}
      </span>

      {/* Keys */}
      <div className="flex-1 flex flex-col gap-0.5 min-w-0">
        {integration.keys.map((k) => (
          <div key={k.key} className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-muted-foreground/60 w-40 shrink-0 truncate">
              {k.key}
            </span>
            <span
              className={`text-[10px] font-mono truncate ${
                k.configured ? 'text-muted-foreground' : 'text-muted-foreground/40'
              }`}
            >
              {k.configured ? k.masked : 'Not Set'}
            </span>
          </div>
        ))}
      </div>

      {/* Test button */}
      <div className="shrink-0 flex items-center gap-2">
        <AnimatePresence mode="wait">
          {testResult === 'ok' && (
            <motion.span
              key="ok"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="text-[--success]"
            >
              <CheckIcon size={12} />
            </motion.span>
          )}
          {testResult === 'error' && (
            <motion.span
              key="error"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="text-[--destructive] text-[10px] font-mono"
            >
              ✕
            </motion.span>
          )}
        </AnimatePresence>
        <button
          onClick={handleTest}
          disabled={testing}
          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-mono font-medium border border-white/[0.06] hover:bg-white/[0.04] hover:border-[--cyan]/30 hover:text-[--cyan] transition-colors disabled:opacity-50"
        >
          {testing ? <SpinnerIcon size={12} /> : <ZapIcon size={12} />}
          Test
        </button>
      </div>
    </div>
  );
}

function IntegrationStatusSection() {
  const [integrations, setIntegrations] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getIntegrationStatus()
      .then((data) => setIntegrations(data ?? []))
      .catch(() => setIntegrations([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-12 animate-shimmer rounded-lg border border-white/[0.06] bg-[--card]"
          />
        ))}
      </div>
    );
  }

  if (!integrations || integrations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center rounded-lg border border-white/[0.06] bg-[--card]">
        <div className="rounded-full bg-[--cyan]/10 p-4 mb-4">
          <GlobeIcon size={24} className="text-[--cyan]" />
        </div>
        <p className="text-sm font-mono font-medium mb-1">No integrations found</p>
        <p className="text-[11px] text-muted-foreground font-mono">
          Configure service API keys in your .env file to see integration status.
        </p>
      </div>
    );
  }

  // Group by group field
  const grouped = integrations.reduce((acc, integration) => {
    const g = integration.group || 'Other';
    if (!acc[g]) acc[g] = [];
    acc[g].push(integration);
    return acc;
  }, {});

  const groupOrder = ['GitHub', 'Telegram', 'LLM Providers', 'Search', 'Webhook'];
  const sortedGroups = [
    ...groupOrder.filter((g) => grouped[g]),
    ...Object.keys(grouped).filter((g) => !groupOrder.includes(g)),
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-6"
    >
      {sortedGroups.map((groupName) => (
        <div key={groupName}>
          {/* Group header */}
          <div className="flex items-center gap-2 mb-2 px-1">
            <span className="text-[10px] font-mono font-medium text-[--cyan] uppercase tracking-wider">
              {groupName}
            </span>
            <div className="flex-1 h-px bg-white/[0.04]" />
          </div>

          {/* Integration rows */}
          <div className="rounded-lg border border-white/[0.06] bg-[--card] overflow-hidden">
            {grouped[groupName].map((integration) => (
              <IntegrationRow key={integration.name} integration={integration} />
            ))}
          </div>
        </div>
      ))}
    </motion.div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export function SettingsSecretsPage() {
  return (
    <div>
      <SectionHeader
        label="API Key"
        description="Authenticates external requests to /api endpoints. Pass via the x-api-key header."
      />
      <ApiKeySection />

      <div className="mt-10">
        <SectionHeader
          label="Integration Status"
          description="Status of configured service integrations and API keys."
        />
        <IntegrationStatusSection />
      </div>
    </div>
  );
}
