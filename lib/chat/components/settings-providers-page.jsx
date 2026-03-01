'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CpuIcon, CheckIcon, SpinnerIcon, EyeIcon, EyeOffIcon, XIcon,
  RefreshIcon, WifiIcon, ServerIcon, ScanIcon, GlobeIcon, ZapIcon,
  ChevronUpIcon, ArrowDownIcon,
} from './icons.js';
import {
  getLlmProviders,
  saveLlmProvider,
  setActiveProvider,
  testLlmConnection,
  getActiveProvider,
  scanLocalProviders,
  getLocalModels,
  getRoleModels,
  setRoleModel,
  getFallbackChain,
  saveFallbackChain,
} from '../actions.js';

// ─── Provider Metadata ─────────────────────────────────────────────────────────

const CLOUD_PROVIDERS = {
  anthropic: {
    name: 'Anthropic', icon: 'A', color: '#d4a574',
    keyPrefix: 'sk-ant-', keyEnv: 'ANTHROPIC_API_KEY',
    models: [
      'claude-sonnet-4-20250514', 'claude-opus-4-20250514',
      'claude-haiku-4-5-20251001', 'claude-3-5-sonnet-20241022',
    ],
  },
  openai: {
    name: 'OpenAI', icon: 'O', color: '#74aa9c',
    keyPrefix: 'sk-', keyEnv: 'OPENAI_API_KEY',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'o1', 'o1-mini', 'o3-mini'],
  },
  google: {
    name: 'Google', icon: 'G', color: '#4285f4',
    keyPrefix: 'AI', keyEnv: 'GOOGLE_API_KEY',
    models: ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.0-flash'],
  },
};

const LOCAL_PROVIDERS = {
  ollama: { name: 'Ollama', icon: '🦙', defaultUrl: 'http://localhost:11434' },
  lmstudio: { name: 'LM Studio', icon: '🔬', defaultUrl: 'http://localhost:1234/v1' },
  localai: { name: 'LocalAI', icon: '🤖', defaultUrl: 'http://localhost:8080/v1' },
  llamacpp: { name: 'llama.cpp', icon: '🔧', defaultUrl: 'http://localhost:8081' },
  vllm: { name: 'vLLM', icon: '⚡', defaultUrl: 'http://localhost:8000/v1' },
  jan: { name: 'Jan', icon: '🌐', defaultUrl: 'http://localhost:1337/v1' },
};

// ─── Traffic Light Header ──────────────────────────────────────────────────────

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

// ─── Provider Card ─────────────────────────────────────────────────────────────

function ProviderCard({ id, meta, config, isActive, isLocal, detected, onEdit, index }) {
  const hasKey = !isLocal && (config?.hasKey || !!config?.apiKey);
  const isDetected = isLocal && detected;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      className={`rounded-lg border bg-[--card] transition-all cursor-pointer hover:border-[--cyan]/20 ${
        isActive ? 'border-[--cyan]/30 shadow-[0_0_15px_oklch(0.7_0.17_195/8%)]' : 'border-white/[0.06]'
      }`}
      onClick={onEdit}
    >
      <div className="flex items-center gap-3 p-3.5">
        {/* Icon */}
        <div className={`shrink-0 w-9 h-9 rounded-md flex items-center justify-center text-sm font-bold ${
          isLocal
            ? 'bg-emerald-500/10 text-emerald-400'
            : 'bg-[--cyan]/10 text-[--cyan]'
        }`}>
          {isLocal ? (
            <span className="text-base">{meta.icon}</span>
          ) : (
            <span className="font-mono">{meta.icon}</span>
          )}
        </div>

        {/* Name + model */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-mono font-medium">{meta.name}</p>
            {isLocal && (
              <span className="inline-flex items-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0 text-[9px] font-mono">
                local
              </span>
            )}
          </div>
          {config?.model && (
            <p className="text-[10px] font-mono text-muted-foreground mt-0.5 truncate">{config.model}</p>
          )}
          {isLocal && detected?.models?.length > 0 && !config?.model && (
            <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
              {detected.models.length} model(s) available
            </p>
          )}
        </div>

        {/* Status */}
        <div className="flex items-center gap-2 shrink-0">
          {isLocal ? (
            <>
              <div className={`w-2 h-2 rounded-full ${isDetected ? 'bg-emerald-400 animate-pulse' : 'bg-muted-foreground/40'}`} />
              <span className={`text-[10px] font-mono ${isDetected ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                {isDetected ? 'running' : 'not found'}
              </span>
            </>
          ) : (
            <>
              <div className={`w-2 h-2 rounded-full ${hasKey ? 'bg-[--success]' : 'bg-muted-foreground/40'}`} />
              <span className={`text-[10px] font-mono ${hasKey ? 'text-[--success]' : 'text-muted-foreground'}`}>
                {hasKey ? 'configured' : 'no key'}
              </span>
            </>
          )}
          {isActive && (
            <span className="inline-flex items-center rounded-full bg-[--cyan]/10 text-[--cyan] border border-[--cyan]/20 px-2 py-0.5 text-[10px] font-mono font-medium">
              active
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Cloud Provider Setup Form ─────────────────────────────────────────────────

function CloudSetupForm({ provider, meta, config, isActive, onSave, onSetActive, onClose }) {
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState(config?.model || meta.models[0] || '');
  const [maxTokens, setMaxTokens] = useState(config?.maxTokens || 4096);
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  async function handleSave() {
    setSaving(true);
    try {
      // Only send apiKey if user typed a new one (not the masked display)
      const saveConfig = { model, maxTokens: parseInt(maxTokens) };
      if (apiKey && !apiKey.includes('***')) {
        saveConfig.apiKey = apiKey;
      }
      await onSave(provider, saveConfig);
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await testLlmConnection(provider);
      setTestResult(result);
    } catch (err) {
      setTestResult({ error: err.message });
    } finally {
      setTesting(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
      <div className="rounded-lg border border-[--cyan]/20 bg-[--card] p-5 mt-2">
        <div className="flex items-center justify-between mb-4">
          <TrafficLights label={`${meta.name} Setup`} />
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <XIcon size={14} />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {/* API Key */}
          <div>
            <label className="block text-[10px] font-mono font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
              API Key
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={config?.hasKey ? '(saved — enter new key to change)' : `${meta.keyPrefix}...`}
                  className="w-full text-sm border border-white/[0.06] rounded-md px-3 py-2 bg-black/20 font-mono text-foreground/80 placeholder:text-muted-foreground/50 focus:outline-none focus:border-[--cyan]/40 focus:ring-1 focus:ring-[--cyan]/20 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showKey ? <EyeOffIcon size={14} /> : <EyeIcon size={14} />}
                </button>
              </div>
              <button
                onClick={handleTest}
                disabled={testing || (!apiKey && !config?.hasKey)}
                className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-mono font-medium border border-white/[0.06] hover:bg-white/[0.04] hover:border-[--cyan]/30 hover:text-[--cyan] transition-colors disabled:opacity-50"
              >
                {testing ? <SpinnerIcon size={12} /> : <ZapIcon size={12} />}
                Test
              </button>
            </div>
            {config?.hasKey && (
              <p className="text-[10px] font-mono text-muted-foreground/60 mt-1">
                Key saved: {config.apiKey}
              </p>
            )}
          </div>

          {/* Model */}
          <div>
            <label className="block text-[10px] font-mono font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
              Model
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full text-sm border border-white/[0.06] rounded-md px-3 py-2 bg-black/20 font-mono text-foreground/80 focus:outline-none focus:border-[--cyan]/40 focus:ring-1 focus:ring-[--cyan]/20 transition-colors appearance-none"
            >
              {meta.models.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Max Tokens */}
          <div>
            <label className="block text-[10px] font-mono font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
              Max Tokens
            </label>
            <input
              type="number"
              value={maxTokens}
              onChange={(e) => setMaxTokens(e.target.value)}
              className="w-32 text-sm border border-white/[0.06] rounded-md px-3 py-2 bg-black/20 font-mono text-foreground/80 focus:outline-none focus:border-[--cyan]/40 focus:ring-1 focus:ring-[--cyan]/20 transition-colors"
            />
          </div>

          {/* Test Result */}
          <TestResultBox result={testResult} />

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-xs font-mono font-medium bg-[--cyan]/10 text-[--cyan] border border-[--cyan]/20 hover:bg-[--cyan] hover:text-[--primary-foreground] transition-colors disabled:opacity-50"
            >
              {saving ? <SpinnerIcon size={12} /> : <CheckIcon size={12} />}
              Save
            </button>
            {!isActive && (config?.hasKey || apiKey) && (
              <button
                onClick={() => onSetActive(provider, model)}
                className="inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-xs font-mono font-medium border border-white/[0.06] hover:bg-white/[0.04] hover:border-[--cyan]/30 hover:text-[--cyan] transition-colors"
              >
                Set as Active
              </button>
            )}
            <button
              onClick={onClose}
              className="inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-xs font-mono font-medium border border-white/[0.06] hover:bg-white/[0.04] transition-colors text-muted-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Local Provider Setup Form ─────────────────────────────────────────────────

function LocalSetupForm({ provider, meta, config, detected, isActive, onSave, onSetActive, onClose }) {
  const detectedModels = detected?.models || [];
  const [model, setModel] = useState(config?.model || detectedModels[0]?.id || '');
  const [customModel, setCustomModel] = useState('');
  const [baseUrl, setBaseUrl] = useState(config?.baseUrl || detected?.baseUrl || meta.defaultUrl || '');
  const [maxTokens, setMaxTokens] = useState(config?.maxTokens || 4096);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [models, setModels] = useState(detectedModels);

  async function handleRefreshModels() {
    setRefreshing(true);
    try {
      const fetched = await getLocalModels(baseUrl);
      setModels(fetched);
      if (fetched.length > 0 && !model) setModel(fetched[0].id);
    } catch {}
    setRefreshing(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const selectedModel = customModel || model;
      await onSave(provider, {
        model: selectedModel,
        maxTokens: parseInt(maxTokens),
        baseUrl,
        apiKey: 'not-needed',
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await testLlmConnection(provider);
      setTestResult(result);
    } catch (err) {
      setTestResult({ error: err.message });
    } finally {
      setTesting(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
      <div className="rounded-lg border border-emerald-500/20 bg-[--card] p-5 mt-2">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-[#ff5f57]" />
              <div className="w-2 h-2 rounded-full bg-[#febc2e]" />
              <div className="w-2 h-2 rounded-full bg-[#28c840]" />
            </div>
            <span className="font-mono text-[10px] font-medium text-emerald-400 uppercase tracking-wider ml-1">
              {meta.name} Setup
            </span>
            {detected && (
              <span className="inline-flex items-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0 text-[9px] font-mono">
                detected
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <XIcon size={14} />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {/* Base URL */}
          <div>
            <label className="block text-[10px] font-mono font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
              Base URL
            </label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder={meta.defaultUrl}
              className="w-full text-sm border border-white/[0.06] rounded-md px-3 py-2 bg-black/20 font-mono text-foreground/80 placeholder:text-muted-foreground/50 focus:outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
            />
          </div>

          {/* Model selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] font-mono font-medium text-muted-foreground uppercase tracking-wider">
                Model
              </label>
              <button
                onClick={handleRefreshModels}
                disabled={refreshing}
                className="inline-flex items-center gap-1 text-[10px] font-mono text-muted-foreground hover:text-emerald-400 transition-colors disabled:opacity-50"
              >
                {refreshing ? <SpinnerIcon size={10} /> : <RefreshIcon size={10} />}
                Scan Models
              </button>
            </div>

            {models.length > 0 ? (
              <select
                value={model}
                onChange={(e) => { setModel(e.target.value); setCustomModel(''); }}
                className="w-full text-sm border border-white/[0.06] rounded-md px-3 py-2 bg-black/20 font-mono text-foreground/80 focus:outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20 transition-colors appearance-none"
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}{m.paramSize ? ` (${m.paramSize})` : ''}{m.family ? ` — ${m.family}` : ''}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={customModel}
                onChange={(e) => setCustomModel(e.target.value)}
                placeholder="model-name (or click Scan Models)"
                className="w-full text-sm border border-white/[0.06] rounded-md px-3 py-2 bg-black/20 font-mono text-foreground/80 placeholder:text-muted-foreground/50 focus:outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
              />
            )}

            {/* Model details */}
            {models.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {models.slice(0, 8).map((m) => (
                  <button
                    key={m.id}
                    onClick={() => { setModel(m.id); setCustomModel(''); }}
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-mono border transition-colors ${
                      model === m.id
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : 'bg-white/[0.02] text-muted-foreground border-white/[0.06] hover:border-emerald-500/20'
                    }`}
                  >
                    {m.name}
                  </button>
                ))}
                {models.length > 8 && (
                  <span className="text-[9px] font-mono text-muted-foreground self-center">
                    +{models.length - 8} more
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Max Tokens */}
          <div>
            <label className="block text-[10px] font-mono font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
              Max Tokens
            </label>
            <input
              type="number"
              value={maxTokens}
              onChange={(e) => setMaxTokens(e.target.value)}
              className="w-32 text-sm border border-white/[0.06] rounded-md px-3 py-2 bg-black/20 font-mono text-foreground/80 focus:outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
            />
          </div>

          {/* Test Result */}
          <TestResultBox result={testResult} />

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={handleSave}
              disabled={saving || (!model && !customModel)}
              className="inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-xs font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-colors disabled:opacity-50"
            >
              {saving ? <SpinnerIcon size={12} /> : <CheckIcon size={12} />}
              Save
            </button>
            <button
              onClick={handleTest}
              disabled={testing}
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-mono font-medium border border-white/[0.06] hover:bg-white/[0.04] hover:border-emerald-500/30 hover:text-emerald-400 transition-colors disabled:opacity-50"
            >
              {testing ? <SpinnerIcon size={12} /> : <ZapIcon size={12} />}
              Test
            </button>
            {!isActive && (model || customModel) && (
              <button
                onClick={() => onSetActive(provider, customModel || model)}
                className="inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-xs font-mono font-medium border border-white/[0.06] hover:bg-white/[0.04] hover:border-[--cyan]/30 hover:text-[--cyan] transition-colors"
              >
                Set as Active
              </button>
            )}
            <button
              onClick={onClose}
              className="inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-xs font-mono font-medium border border-white/[0.06] hover:bg-white/[0.04] transition-colors text-muted-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Custom Provider Form ──────────────────────────────────────────────────────

function CustomSetupForm({ config, isActive, onSave, onSetActive, onClose }) {
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState(config?.model || '');
  const [baseUrl, setBaseUrl] = useState(config?.baseUrl || '');
  const [maxTokens, setMaxTokens] = useState(config?.maxTokens || 4096);
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  async function handleSave() {
    setSaving(true);
    try {
      const saveConfig = { model, maxTokens: parseInt(maxTokens), baseUrl };
      if (apiKey && !apiKey.includes('***')) saveConfig.apiKey = apiKey;
      await onSave('custom', saveConfig);
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await testLlmConnection('custom');
      setTestResult(result);
    } catch (err) {
      setTestResult({ error: err.message });
    } finally {
      setTesting(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
      <div className="rounded-lg border border-purple-500/20 bg-[--card] p-5 mt-2">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-[#ff5f57]" />
              <div className="w-2 h-2 rounded-full bg-[#febc2e]" />
              <div className="w-2 h-2 rounded-full bg-[#28c840]" />
            </div>
            <span className="font-mono text-[10px] font-medium text-purple-400 uppercase tracking-wider ml-1">
              Custom Provider (OpenAI-Compatible)
            </span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <XIcon size={14} />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-[10px] font-mono font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Base URL</label>
            <input type="text" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="https://api.example.com/v1"
              className="w-full text-sm border border-white/[0.06] rounded-md px-3 py-2 bg-black/20 font-mono text-foreground/80 placeholder:text-muted-foreground/50 focus:outline-none focus:border-purple-500/40 focus:ring-1 focus:ring-purple-500/20 transition-colors" />
          </div>
          <div>
            <label className="block text-[10px] font-mono font-medium text-muted-foreground uppercase tracking-wider mb-1.5">API Key</label>
            <div className="flex-1 relative">
              <input type={showKey ? 'text' : 'password'} value={apiKey} onChange={(e) => setApiKey(e.target.value)}
                placeholder={config?.hasKey ? '(saved)' : 'sk-... (or leave empty if not needed)'}
                className="w-full text-sm border border-white/[0.06] rounded-md px-3 py-2 bg-black/20 font-mono text-foreground/80 placeholder:text-muted-foreground/50 focus:outline-none focus:border-purple-500/40 focus:ring-1 focus:ring-purple-500/20 transition-colors" />
              <button type="button" onClick={() => setShowKey(!showKey)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {showKey ? <EyeOffIcon size={14} /> : <EyeIcon size={14} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-mono font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Model</label>
            <input type="text" value={model} onChange={(e) => setModel(e.target.value)} placeholder="model-name"
              className="w-full text-sm border border-white/[0.06] rounded-md px-3 py-2 bg-black/20 font-mono text-foreground/80 placeholder:text-muted-foreground/50 focus:outline-none focus:border-purple-500/40 focus:ring-1 focus:ring-purple-500/20 transition-colors" />
          </div>
          <div>
            <label className="block text-[10px] font-mono font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Max Tokens</label>
            <input type="number" value={maxTokens} onChange={(e) => setMaxTokens(e.target.value)}
              className="w-32 text-sm border border-white/[0.06] rounded-md px-3 py-2 bg-black/20 font-mono text-foreground/80 focus:outline-none focus:border-purple-500/40 focus:ring-1 focus:ring-purple-500/20 transition-colors" />
          </div>
          <TestResultBox result={testResult} />
          <div className="flex items-center gap-2 pt-2">
            <button onClick={handleSave} disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-xs font-mono font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500 hover:text-white transition-colors disabled:opacity-50">
              {saving ? <SpinnerIcon size={12} /> : <CheckIcon size={12} />} Save
            </button>
            <button onClick={handleTest} disabled={testing}
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-mono font-medium border border-white/[0.06] hover:bg-white/[0.04] hover:border-purple-500/30 hover:text-purple-400 transition-colors disabled:opacity-50">
              {testing ? <SpinnerIcon size={12} /> : <ZapIcon size={12} />} Test
            </button>
            {!isActive && model && (
              <button onClick={() => onSetActive('custom', model)}
                className="inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-xs font-mono font-medium border border-white/[0.06] hover:bg-white/[0.04] hover:border-[--cyan]/30 hover:text-[--cyan] transition-colors">
                Set as Active
              </button>
            )}
            <button onClick={onClose}
              className="inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-xs font-mono font-medium border border-white/[0.06] hover:bg-white/[0.04] transition-colors text-muted-foreground">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Test Result Display ───────────────────────────────────────────────────────

function TestResultBox({ result }) {
  if (!result) return null;
  return (
    <div className="rounded-md border border-white/[0.04] bg-black/30 overflow-hidden">
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 border-b border-white/[0.04]">
        <TrafficLights />
        <span className="font-mono text-[9px] text-muted-foreground ml-1">connection test</span>
        {result.error ? (
          <XIcon size={10} className="text-[--destructive] ml-auto" />
        ) : (
          <CheckIcon size={10} className="text-[--success] ml-auto" />
        )}
      </div>
      <pre className="text-[11px] p-2.5 font-mono overflow-auto max-h-24 whitespace-pre-wrap break-words text-foreground/80">
        {result.error ? `Error: ${result.error}` : `Connected. ${result.response || 'OK'}`}
      </pre>
    </div>
  );
}

// ─── Stats Card ────────────────────────────────────────────────────────────────

function StatsCard({ label, value, color = 'cyan' }) {
  const colors = {
    cyan: { border: 'border-[--cyan]/20', text: 'text-[--cyan]' },
    emerald: { border: 'border-emerald-500/20', text: 'text-emerald-400' },
    purple: { border: 'border-purple-500/20', text: 'text-purple-400' },
    default: { border: 'border-white/[0.06]', text: 'text-foreground' },
  };
  const c = colors[color] || colors.default;
  return (
    <div className={`flex flex-col items-center justify-center p-3 rounded-lg border bg-[--card] ${c.border}`}>
      <span className={`text-xl font-semibold font-mono ${c.text}`}>{value}</span>
      <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">{label}</span>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export function SettingsProvidersPage() {
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState({});
  const [activeProviderInfo, setActiveProviderInfo] = useState(null);
  const [editingProvider, setEditingProvider] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [localDetected, setLocalDetected] = useState({});

  const load = useCallback(async () => {
    try {
      const [provs, active] = await Promise.all([
        getLlmProviders(),
        getActiveProvider(),
      ]);
      setProviders(provs || {});
      setActiveProviderInfo(active || {});
    } catch {}
    setLoading(false);
  }, []);

  async function handleScan() {
    setScanning(true);
    try {
      const results = await scanLocalProviders();
      const detected = {};
      for (const r of results) {
        detected[r.id] = r;
      }
      setLocalDetected(detected);
    } catch {}
    setScanning(false);
  }

  useEffect(() => {
    load();
    // Auto-scan local providers on mount
    handleScan();
  }, []);

  // ─── Model Roles state ──────────────────────────────────────────────────────
  const [roleModels, setRoleModels] = useState({
    chat: { provider: '', model: '' },
    agent: { provider: '', model: '' },
    tool: { provider: '', model: '' },
  });
  const [roleModelsSaving, setRoleModelsSaving] = useState({});
  const [roleModelsSaved, setRoleModelsSaved] = useState({});

  useEffect(() => {
    getRoleModels().then((data) => {
      if (data) setRoleModels((prev) => ({ ...prev, ...data }));
    }).catch(() => {});
  }, []);

  async function handleSaveRoleModel(role) {
    setRoleModelsSaving((s) => ({ ...s, [role]: true }));
    try {
      await setRoleModel(role, roleModels[role].provider, roleModels[role].model);
      setRoleModelsSaved((s) => ({ ...s, [role]: true }));
      setTimeout(() => setRoleModelsSaved((s) => ({ ...s, [role]: false })), 2000);
    } catch {}
    setRoleModelsSaving((s) => ({ ...s, [role]: false }));
  }

  // ─── Fallback Chain state ────────────────────────────────────────────────────
  const [fallbackChain, setFallbackChain] = useState([]);
  const [fallbackConfig, setFallbackConfig] = useState({ mode: 'on_error', timeout: 30 });
  const [fallbackSaving, setFallbackSaving] = useState(false);
  const [fallbackSaved, setFallbackSaved] = useState(false);
  const [newFallbackProvider, setNewFallbackProvider] = useState('');
  const [newFallbackModel, setNewFallbackModel] = useState('');

  useEffect(() => {
    getFallbackChain().then((data) => {
      if (data?.chain) setFallbackChain(data.chain);
      if (data?.config) setFallbackConfig((prev) => ({ ...prev, ...data.config }));
    }).catch(() => {});
  }, []);

  async function handleSaveFallbackChain() {
    setFallbackSaving(true);
    try {
      await saveFallbackChain(fallbackChain, fallbackConfig);
      setFallbackSaved(true);
      setTimeout(() => setFallbackSaved(false), 2000);
    } catch {}
    setFallbackSaving(false);
  }

  function handleFallbackMoveUp(index) {
    if (index === 0) return;
    setFallbackChain((chain) => {
      const next = [...chain];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }

  function handleFallbackMoveDown(index) {
    setFallbackChain((chain) => {
      if (index === chain.length - 1) return chain;
      const next = [...chain];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  }

  function handleFallbackRemove(index) {
    setFallbackChain((chain) => chain.filter((_, i) => i !== index));
  }

  function handleFallbackAdd() {
    if (!newFallbackProvider) return;
    const entry = { provider: newFallbackProvider, model: newFallbackModel || '' };
    setFallbackChain((chain) => [...chain, entry]);
    setNewFallbackProvider('');
    setNewFallbackModel('');
  }

  async function handleSave(provider, config) {
    await saveLlmProvider(provider, config);
    await load();
    setEditingProvider(null);
  }

  async function handleSetActive(provider, model) {
    await setActiveProvider(provider, model);
    await load();
    setEditingProvider(null);
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 animate-shimmer rounded-lg border border-white/[0.06] bg-[--card]" />
        ))}
      </div>
    );
  }

  const cloudCount = Object.keys(CLOUD_PROVIDERS).filter(p => providers[p]?.hasKey).length;
  const localCount = Object.keys(localDetected).length;
  const cloudList = Object.keys(CLOUD_PROVIDERS);
  const localList = Object.keys(LOCAL_PROVIDERS);

  return (
    <>
      {/* Active provider banner */}
      {activeProviderInfo?.provider && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-[--cyan]/20 bg-[--cyan]/5 p-4 mb-6"
        >
          <div className="flex items-center gap-3">
            <div className="shrink-0 rounded-md bg-[--cyan]/10 p-2">
              <CpuIcon size={16} className="text-[--cyan]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-medium text-[--cyan] uppercase tracking-wider">Active Provider</span>
                <div className="w-2 h-2 rounded-full bg-[--success] animate-pulse" />
              </div>
              <p className="text-sm font-mono font-medium mt-0.5">
                {CLOUD_PROVIDERS[activeProviderInfo.provider]?.name
                  || LOCAL_PROVIDERS[activeProviderInfo.provider]?.name
                  || activeProviderInfo.provider}
                {activeProviderInfo.model && (
                  <span className="text-muted-foreground ml-2">/ {activeProviderInfo.model}</span>
                )}
              </p>
              {activeProviderInfo.keyLoaded === false && (
                <p className="text-[10px] font-mono text-amber-400 mt-1">
                  Warning: API key not loaded in process. Save the provider config or restart the server.
                </p>
              )}
            </div>
            <div className="text-right shrink-0">
              <p className="text-[9px] font-mono text-muted-foreground/50">env: {activeProviderInfo.envProvider || 'not set'}</p>
              <p className="text-[9px] font-mono text-muted-foreground/50">model: {activeProviderInfo.envModel || 'default'}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <StatsCard label="Cloud" value={cloudList.length} />
        <StatsCard label="Configured" value={cloudCount} color="cyan" />
        <StatsCard label="Local" value={localCount} color="emerald" />
        <StatsCard label="Active" value={activeProviderInfo?.provider ? 1 : 0} color="purple" />
      </div>

      {/* ─── Cloud Providers ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 pb-2 mb-3">
        <GlobeIcon size={12} className="text-[--cyan]" />
        <span className="font-mono text-[10px] font-medium text-[--cyan] uppercase tracking-wider">Cloud Providers</span>
        <span className="inline-flex items-center rounded-full bg-[--cyan]/10 px-2 py-0.5 text-[10px] font-mono font-medium text-[--cyan]">
          {cloudCount}/{cloudList.length}
        </span>
      </div>

      <div className="flex flex-col gap-2 mb-8">
        {cloudList.map((p, i) => (
          <div key={p}>
            <ProviderCard
              id={p}
              meta={CLOUD_PROVIDERS[p]}
              config={providers[p]}
              isActive={activeProviderInfo?.provider === p}
              isLocal={false}
              onEdit={() => setEditingProvider(editingProvider === p ? null : p)}
              index={i}
            />
            <AnimatePresence>
              {editingProvider === p && (
                <CloudSetupForm
                  provider={p}
                  meta={CLOUD_PROVIDERS[p]}
                  config={providers[p]}
                  isActive={activeProviderInfo?.provider === p}
                  onSave={handleSave}
                  onSetActive={handleSetActive}
                  onClose={() => setEditingProvider(null)}
                />
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* ─── Local Providers ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pb-2 mb-3">
        <div className="flex items-center gap-2">
          <ServerIcon size={12} className="text-emerald-400" />
          <span className="font-mono text-[10px] font-medium text-emerald-400 uppercase tracking-wider">Local Providers</span>
          <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono font-medium text-emerald-400">
            {localCount} detected
          </span>
        </div>
        <button
          onClick={handleScan}
          disabled={scanning}
          className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[10px] font-mono font-medium border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 transition-colors disabled:opacity-50"
        >
          {scanning ? <SpinnerIcon size={10} /> : <ScanIcon size={10} />}
          {scanning ? 'Scanning...' : 'Scan Network'}
        </button>
      </div>

      <div className="flex flex-col gap-2 mb-8">
        {/* Show detected providers first, then remaining */}
        {localList
          .sort((a, b) => {
            const aD = localDetected[a] ? 1 : 0;
            const bD = localDetected[b] ? 1 : 0;
            return bD - aD;
          })
          .map((p, i) => (
            <div key={p}>
              <ProviderCard
                id={p}
                meta={LOCAL_PROVIDERS[p]}
                config={providers[p]}
                isActive={activeProviderInfo?.provider === p}
                isLocal={true}
                detected={localDetected[p]}
                onEdit={() => setEditingProvider(editingProvider === p ? null : p)}
                index={i}
              />
              <AnimatePresence>
                {editingProvider === p && (
                  <LocalSetupForm
                    provider={p}
                    meta={LOCAL_PROVIDERS[p]}
                    config={providers[p]}
                    detected={localDetected[p]}
                    isActive={activeProviderInfo?.provider === p}
                    onSave={handleSave}
                    onSetActive={handleSetActive}
                    onClose={() => setEditingProvider(null)}
                  />
                )}
              </AnimatePresence>
            </div>
          ))}
      </div>

      {/* ─── Custom Provider ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 pb-2 mb-3">
        <WifiIcon size={12} className="text-purple-400" />
        <span className="font-mono text-[10px] font-medium text-purple-400 uppercase tracking-wider">Custom Provider</span>
        <span className="text-[9px] font-mono text-muted-foreground">(OpenAI-Compatible)</span>
      </div>

      <div className="flex flex-col gap-2">
        <ProviderCard
          id="custom"
          meta={{ name: 'Custom', icon: '⚙', color: '#a78bfa' }}
          config={providers.custom}
          isActive={activeProviderInfo?.provider === 'custom'}
          isLocal={false}
          onEdit={() => setEditingProvider(editingProvider === 'custom' ? null : 'custom')}
          index={0}
        />
        <AnimatePresence>
          {editingProvider === 'custom' && (
            <CustomSetupForm
              config={providers.custom}
              isActive={activeProviderInfo?.provider === 'custom'}
              onSave={handleSave}
              onSetActive={handleSetActive}
              onClose={() => setEditingProvider(null)}
            />
          )}
        </AnimatePresence>
      </div>

      {/* ─── Model Roles ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 pb-2 mb-3 mt-8">
        <CpuIcon size={12} className="text-[--cyan]" />
        <span className="font-mono text-[10px] font-medium text-[--cyan] uppercase tracking-wider">Model Roles</span>
        <span className="text-[9px] font-mono text-muted-foreground">assign models per usage role</span>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="rounded-lg border border-white/[0.06] bg-[--card] mb-8 overflow-hidden"
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
          <TrafficLights label="Model Roles" />
        </div>

        <div className="divide-y divide-white/[0.04]">
          {['chat', 'agent', 'tool'].map((role) => {
            const selectedProvider = roleModels[role]?.provider || '';
            const modelOptions = CLOUD_PROVIDERS[selectedProvider]?.models || [];

            return (
              <div key={role} className="flex items-center gap-3 px-4 py-3">
                <div className="w-16 shrink-0">
                  <span className="text-[10px] font-mono font-medium text-muted-foreground uppercase tracking-wider">
                    {role}
                  </span>
                </div>

                {/* Provider dropdown */}
                <select
                  value={selectedProvider}
                  onChange={(e) => {
                    const p = e.target.value;
                    const firstModel = CLOUD_PROVIDERS[p]?.models?.[0] || '';
                    setRoleModels((prev) => ({
                      ...prev,
                      [role]: { provider: p, model: firstModel },
                    }));
                  }}
                  className="flex-1 text-sm border border-white/[0.06] rounded-md px-3 py-2 bg-black/20 font-mono text-foreground/80 focus:outline-none focus:border-[--cyan]/40 focus:ring-1 focus:ring-[--cyan]/20 transition-colors appearance-none"
                >
                  <option value="">— select provider —</option>
                  {Object.entries(CLOUD_PROVIDERS).map(([id, meta]) => (
                    <option key={id} value={id}>{meta.name}</option>
                  ))}
                  {Object.entries(LOCAL_PROVIDERS).map(([id, meta]) => (
                    <option key={id} value={id}>{meta.name} (local)</option>
                  ))}
                </select>

                {/* Model dropdown */}
                {modelOptions.length > 0 ? (
                  <select
                    value={roleModels[role]?.model || ''}
                    onChange={(e) =>
                      setRoleModels((prev) => ({
                        ...prev,
                        [role]: { ...prev[role], model: e.target.value },
                      }))
                    }
                    className="flex-1 text-sm border border-white/[0.06] rounded-md px-3 py-2 bg-black/20 font-mono text-foreground/80 focus:outline-none focus:border-[--cyan]/40 focus:ring-1 focus:ring-[--cyan]/20 transition-colors appearance-none"
                  >
                    <option value="">— select model —</option>
                    {modelOptions.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={roleModels[role]?.model || ''}
                    onChange={(e) =>
                      setRoleModels((prev) => ({
                        ...prev,
                        [role]: { ...prev[role], model: e.target.value },
                      }))
                    }
                    placeholder="model name"
                    className="flex-1 text-sm border border-white/[0.06] rounded-md px-3 py-2 bg-black/20 font-mono text-foreground/80 placeholder:text-muted-foreground/50 focus:outline-none focus:border-[--cyan]/40 focus:ring-1 focus:ring-[--cyan]/20 transition-colors"
                  />
                )}

                {/* Save button */}
                <button
                  onClick={() => handleSaveRoleModel(role)}
                  disabled={roleModelsSaving[role]}
                  className="inline-flex items-center gap-1.5 shrink-0 rounded-md px-3 py-2 text-xs font-mono font-medium bg-[--cyan]/10 text-[--cyan] border border-[--cyan]/20 hover:bg-[--cyan] hover:text-[--primary-foreground] transition-colors disabled:opacity-50"
                >
                  {roleModelsSaving[role] ? (
                    <SpinnerIcon size={12} />
                  ) : roleModelsSaved[role] ? (
                    <CheckIcon size={12} />
                  ) : (
                    <CheckIcon size={12} />
                  )}
                  {roleModelsSaved[role] ? 'Saved' : 'Save'}
                </button>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* ─── Fallback Chain ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 pb-2 mb-3">
        <GlobeIcon size={12} className="text-[--cyan]" />
        <span className="font-mono text-[10px] font-medium text-[--cyan] uppercase tracking-wider">Fallback Chain</span>
        <span className="text-[9px] font-mono text-muted-foreground">ordered provider fallback list</span>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.04 }}
        className="rounded-lg border border-white/[0.06] bg-[--card] mb-8 overflow-hidden"
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
          <TrafficLights label="Fallback Chain" />
        </div>

        {/* Chain items */}
        <div className="divide-y divide-white/[0.04]">
          {fallbackChain.length === 0 && (
            <div className="px-4 py-6 text-center">
              <span className="text-[10px] font-mono text-muted-foreground/50">
                No fallback providers configured
              </span>
            </div>
          )}
          {fallbackChain.map((entry, index) => {
            const meta = CLOUD_PROVIDERS[entry.provider] || LOCAL_PROVIDERS[entry.provider];
            const isLocal = !!LOCAL_PROVIDERS[entry.provider];
            const hasKey = !isLocal && providers[entry.provider]?.hasKey;
            const isDetected = isLocal && localDetected[entry.provider];
            const isLive = isLocal ? isDetected : hasKey;

            return (
              <motion.div
                key={`${entry.provider}-${index}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-3 px-4 py-2.5"
              >
                {/* Order number */}
                <span className="w-5 shrink-0 text-[10px] font-mono text-muted-foreground/50 text-center">
                  {index + 1}
                </span>

                {/* Status dot */}
                <div
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    isLive ? 'bg-[--success]' : 'bg-muted-foreground/30'
                  }`}
                />

                {/* Provider name + model */}
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-mono font-medium text-foreground/80">
                    {meta?.name || entry.provider}
                  </span>
                  {entry.model && (
                    <span className="text-[10px] font-mono text-muted-foreground ml-2">
                      ({entry.model})
                    </span>
                  )}
                </div>

                {/* Move up */}
                <button
                  onClick={() => handleFallbackMoveUp(index)}
                  disabled={index === 0}
                  className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-white/[0.06] text-muted-foreground hover:border-[--cyan]/20 hover:text-[--cyan] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Move up"
                >
                  <ChevronUpIcon size={12} />
                </button>

                {/* Move down */}
                <button
                  onClick={() => handleFallbackMoveDown(index)}
                  disabled={index === fallbackChain.length - 1}
                  className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-white/[0.06] text-muted-foreground hover:border-[--cyan]/20 hover:text-[--cyan] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Move down"
                >
                  <ArrowDownIcon size={12} />
                </button>

                {/* Remove */}
                <button
                  onClick={() => handleFallbackRemove(index)}
                  className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-white/[0.06] text-muted-foreground hover:border-[--destructive]/40 hover:text-[--destructive] transition-colors"
                  title="Remove"
                >
                  <XIcon size={12} />
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* Add fallback */}
        <div className="px-4 py-3 border-t border-white/[0.06] flex items-center gap-2">
          <select
            value={newFallbackProvider}
            onChange={(e) => {
              setNewFallbackProvider(e.target.value);
              setNewFallbackModel(CLOUD_PROVIDERS[e.target.value]?.models?.[0] || '');
            }}
            className="flex-1 text-sm border border-white/[0.06] rounded-md px-3 py-2 bg-black/20 font-mono text-foreground/80 focus:outline-none focus:border-[--cyan]/40 focus:ring-1 focus:ring-[--cyan]/20 transition-colors appearance-none"
          >
            <option value="">— add provider —</option>
            {Object.entries(CLOUD_PROVIDERS).map(([id, meta]) => (
              <option key={id} value={id}>{meta.name}</option>
            ))}
            {Object.entries(LOCAL_PROVIDERS).map(([id, meta]) => (
              <option key={id} value={id}>{meta.name} (local)</option>
            ))}
          </select>

          {CLOUD_PROVIDERS[newFallbackProvider]?.models?.length > 0 ? (
            <select
              value={newFallbackModel}
              onChange={(e) => setNewFallbackModel(e.target.value)}
              className="flex-1 text-sm border border-white/[0.06] rounded-md px-3 py-2 bg-black/20 font-mono text-foreground/80 focus:outline-none focus:border-[--cyan]/40 focus:ring-1 focus:ring-[--cyan]/20 transition-colors appearance-none"
            >
              {CLOUD_PROVIDERS[newFallbackProvider].models.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          ) : newFallbackProvider ? (
            <input
              type="text"
              value={newFallbackModel}
              onChange={(e) => setNewFallbackModel(e.target.value)}
              placeholder="model name (optional)"
              className="flex-1 text-sm border border-white/[0.06] rounded-md px-3 py-2 bg-black/20 font-mono text-foreground/80 placeholder:text-muted-foreground/50 focus:outline-none focus:border-[--cyan]/40 focus:ring-1 focus:ring-[--cyan]/20 transition-colors"
            />
          ) : null}

          <button
            onClick={handleFallbackAdd}
            disabled={!newFallbackProvider}
            className="inline-flex items-center gap-1.5 shrink-0 rounded-md px-3 py-2 text-xs font-mono font-medium bg-[--cyan]/10 text-[--cyan] border border-[--cyan]/20 hover:bg-[--cyan] hover:text-[--primary-foreground] transition-colors disabled:opacity-50"
          >
            Add Fallback
          </button>
        </div>

        {/* Config section */}
        <div className="px-4 py-3 border-t border-white/[0.06] flex flex-wrap items-center gap-4">
          {/* Mode toggle */}
          <div>
            <label className="block text-[10px] font-mono font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Mode
            </label>
            <div className="flex items-center gap-1">
              {['on_error', 'on_timeout'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setFallbackConfig((c) => ({ ...c, mode }))}
                  className={`inline-flex items-center rounded-md px-3 py-1.5 text-xs font-mono font-medium border transition-colors ${
                    fallbackConfig.mode === mode
                      ? 'bg-[--cyan]/10 text-[--cyan] border-[--cyan]/20'
                      : 'border-white/[0.06] text-muted-foreground hover:border-[--cyan]/10 hover:text-foreground/70'
                  }`}
                >
                  {mode === 'on_error' ? 'On Error' : 'On Timeout'}
                </button>
              ))}
            </div>
          </div>

          {/* Timeout input */}
          <div>
            <label className="block text-[10px] font-mono font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Timeout (seconds)
            </label>
            <input
              type="number"
              min={1}
              value={fallbackConfig.timeout}
              onChange={(e) =>
                setFallbackConfig((c) => ({ ...c, timeout: parseInt(e.target.value) || 30 }))
              }
              className="w-24 text-sm border border-white/[0.06] rounded-md px-3 py-1.5 bg-black/20 font-mono text-foreground/80 focus:outline-none focus:border-[--cyan]/40 focus:ring-1 focus:ring-[--cyan]/20 transition-colors"
            />
          </div>

          {/* Save button */}
          <div className="ml-auto">
            <button
              onClick={handleSaveFallbackChain}
              disabled={fallbackSaving}
              className="inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-xs font-mono font-medium bg-[--cyan]/10 text-[--cyan] border border-[--cyan]/20 hover:bg-[--cyan] hover:text-[--primary-foreground] transition-colors disabled:opacity-50"
            >
              {fallbackSaving ? (
                <SpinnerIcon size={12} />
              ) : fallbackSaved ? (
                <CheckIcon size={12} />
              ) : (
                <CheckIcon size={12} />
              )}
              {fallbackSaved ? 'Saved' : 'Save Chain'}
            </button>
          </div>
        </div>
      </motion.div>

      {/* ─── Model Registry ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 pb-2 mb-3">
        <ServerIcon size={12} className="text-[--cyan]" />
        <span className="font-mono text-[10px] font-medium text-[--cyan] uppercase tracking-wider">Model Registry</span>
        <span className="text-[9px] font-mono text-muted-foreground">all available models across providers</span>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.08 }}
        className="rounded-lg border border-white/[0.06] bg-[--card] mb-8 overflow-hidden"
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
          <TrafficLights label="Model Registry" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.04]">
                <th className="px-4 py-2 text-left text-[10px] font-mono font-medium text-muted-foreground uppercase tracking-wider">Provider</th>
                <th className="px-4 py-2 text-left text-[10px] font-mono font-medium text-muted-foreground uppercase tracking-wider">Model</th>
                <th className="px-4 py-2 text-left text-[10px] font-mono font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="px-4 py-2 text-left text-[10px] font-mono font-medium text-muted-foreground uppercase tracking-wider">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {/* Cloud provider rows */}
              {Object.entries(CLOUD_PROVIDERS).flatMap(([providerId, meta]) =>
                meta.models.map((model) => {
                  const hasKey = providers[providerId]?.hasKey;
                  const assignedRoles = Object.entries(roleModels)
                    .filter(([, rm]) => rm.provider === providerId && rm.model === model)
                    .map(([role]) => role.charAt(0).toUpperCase() + role.slice(1));

                  return (
                    <tr
                      key={`${providerId}-${model}`}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-4 py-2">
                        <span className="text-xs font-mono font-medium text-foreground/70">
                          {meta.name}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <span className="text-xs font-mono text-foreground/60">{model}</span>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-1.5">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              hasKey ? 'bg-[--success]' : 'bg-muted-foreground/30'
                            }`}
                          />
                          <span
                            className={`text-[10px] font-mono ${
                              hasKey ? 'text-[--success]' : 'text-muted-foreground/50'
                            }`}
                          >
                            {hasKey ? 'Live' : 'Not Set'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        {assignedRoles.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {assignedRoles.map((r) => (
                              <span
                                key={r}
                                className="inline-flex items-center rounded-full bg-[--cyan]/10 text-[--cyan] border border-[--cyan]/20 px-1.5 py-0 text-[9px] font-mono"
                              >
                                {r}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] font-mono text-muted-foreground/30">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}

              {/* Local provider rows — only show detected ones */}
              {Object.entries(LOCAL_PROVIDERS).flatMap(([providerId, meta]) => {
                const detected = localDetected[providerId];
                if (!detected) return [];
                const detectedModels = detected.models || [];
                if (detectedModels.length === 0) {
                  return [(
                    <tr
                      key={`${providerId}-detected`}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-4 py-2">
                        <span className="text-xs font-mono font-medium text-emerald-400/80">
                          {meta.name}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <span className="text-[10px] font-mono text-muted-foreground/40">
                          (no models loaded)
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-emerald-400" />
                          <span className="text-[10px] font-mono text-emerald-400">Local</span>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <span className="text-[10px] font-mono text-muted-foreground/30">—</span>
                      </td>
                    </tr>
                  )];
                }
                return detectedModels.map((m) => {
                  const modelId = m.id || m.name || m;
                  const modelName = m.name || m.id || m;
                  const assignedRoles = Object.entries(roleModels)
                    .filter(([, rm]) => rm.provider === providerId && rm.model === modelId)
                    .map(([role]) => role.charAt(0).toUpperCase() + role.slice(1));

                  return (
                    <tr
                      key={`${providerId}-${modelId}`}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-4 py-2">
                        <span className="text-xs font-mono font-medium text-emerald-400/80">
                          {meta.name}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <span className="text-xs font-mono text-foreground/60">{modelName}</span>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-emerald-400" />
                          <span className="text-[10px] font-mono text-emerald-400">Local</span>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        {assignedRoles.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {assignedRoles.map((r) => (
                              <span
                                key={r}
                                className="inline-flex items-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0 text-[9px] font-mono"
                              >
                                {r}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] font-mono text-muted-foreground/30">—</span>
                        )}
                      </td>
                    </tr>
                  );
                });
              })}

              {/* Custom provider row */}
              {providers.custom?.model && (
                <tr className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-2">
                    <span className="text-xs font-mono font-medium text-purple-400/80">Custom</span>
                  </td>
                  <td className="px-4 py-2">
                    <span className="text-xs font-mono text-foreground/60">{providers.custom.model}</span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-1.5">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          providers.custom?.hasKey ? 'bg-[--success]' : 'bg-muted-foreground/30'
                        }`}
                      />
                      <span
                        className={`text-[10px] font-mono ${
                          providers.custom?.hasKey ? 'text-[--success]' : 'text-muted-foreground/50'
                        }`}
                      >
                        {providers.custom?.hasKey ? 'Live' : 'Not Set'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    {(() => {
                      const assignedRoles = Object.entries(roleModels)
                        .filter(([, rm]) => rm.provider === 'custom' && rm.model === providers.custom.model)
                        .map(([role]) => role.charAt(0).toUpperCase() + role.slice(1));
                      return assignedRoles.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {assignedRoles.map((r) => (
                            <span
                              key={r}
                              className="inline-flex items-center rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 px-1.5 py-0 text-[9px] font-mono"
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[10px] font-mono text-muted-foreground/30">—</span>
                      );
                    })()}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </>
  );
}
