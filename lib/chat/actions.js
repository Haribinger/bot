'use server';

import { auth } from '../auth/index.js';
import {
  createChat as dbCreateChat,
  getChatById,
  getMessagesByChatId,
  deleteChat as dbDeleteChat,
  deleteAllChatsByUser,
  updateChatTitle,
  toggleChatStarred,
} from '../db/chats.js';
import {
  getNotifications as dbGetNotifications,
  getUnreadCount as dbGetUnreadCount,
  markAllRead as dbMarkAllRead,
} from '../db/notifications.js';

/**
 * Get the authenticated user or throw.
 */
async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }
  return session.user;
}

/**
 * Get all chats for the authenticated user (includes Telegram chats).
 * @returns {Promise<object[]>}
 */
export async function getChats() {
  const user = await requireAuth();
  const { or, eq, desc } = await import('drizzle-orm');
  const { getDb } = await import('../db/index.js');
  const { chats } = await import('../db/schema.js');
  const db = getDb();
  return db
    .select()
    .from(chats)
    .where(or(eq(chats.userId, user.id), eq(chats.userId, 'telegram')))
    .orderBy(desc(chats.updatedAt))
    .all();
}

/**
 * Get messages for a specific chat (with ownership check).
 * @param {string} chatId
 * @returns {Promise<object[]>}
 */
export async function getChatMessages(chatId) {
  const user = await requireAuth();
  const chat = getChatById(chatId);
  if (!chat || (chat.userId !== user.id && chat.userId !== 'telegram')) {
    return [];
  }
  return getMessagesByChatId(chatId);
}

/**
 * Create a new chat.
 * @param {string} [id] - Optional chat ID
 * @param {string} [title='New Chat']
 * @returns {Promise<object>}
 */
export async function createChat(id, title = 'New Chat') {
  const user = await requireAuth();
  return dbCreateChat(user.id, title, id);
}

/**
 * Delete a chat (with ownership check).
 * @param {string} chatId
 * @returns {Promise<{success: boolean}>}
 */
export async function deleteChat(chatId) {
  const user = await requireAuth();
  const chat = getChatById(chatId);
  if (!chat || chat.userId !== user.id) {
    return { success: false };
  }
  dbDeleteChat(chatId);
  return { success: true };
}

/**
 * Get the title of a specific chat (with ownership check).
 * @param {string} chatId
 * @returns {Promise<string|null>}
 */
export async function getChatTitle(chatId) {
  const user = await requireAuth();
  const chat = getChatById(chatId);
  if (!chat || (chat.userId !== user.id && chat.userId !== 'telegram')) {
    return null;
  }
  return chat.title;
}

/**
 * Rename a chat (with ownership check).
 * @param {string} chatId
 * @param {string} title
 * @returns {Promise<{success: boolean}>}
 */
export async function renameChat(chatId, title) {
  const user = await requireAuth();
  const chat = getChatById(chatId);
  if (!chat || chat.userId !== user.id) {
    return { success: false };
  }
  updateChatTitle(chatId, title);
  return { success: true };
}

/**
 * Toggle a chat's starred status (with ownership check).
 * @param {string} chatId
 * @returns {Promise<{success: boolean, starred?: number}>}
 */
export async function starChat(chatId) {
  const user = await requireAuth();
  const chat = getChatById(chatId);
  if (!chat || chat.userId !== user.id) {
    return { success: false };
  }
  const starred = toggleChatStarred(chatId);
  return { success: true, starred };
}

/**
 * Delete all chats for the authenticated user.
 * @returns {Promise<{success: boolean}>}
 */
export async function deleteAllChats() {
  const user = await requireAuth();
  deleteAllChatsByUser(user.id);
  return { success: true };
}

/**
 * Get all notifications, newest first.
 * @returns {Promise<object[]>}
 */
export async function getNotifications() {
  await requireAuth();
  return dbGetNotifications();
}

/**
 * Get count of unread notifications.
 * @returns {Promise<number>}
 */
export async function getUnreadNotificationCount() {
  await requireAuth();
  return dbGetUnreadCount();
}

/**
 * Mark all notifications as read.
 * @returns {Promise<{success: boolean}>}
 */
export async function markNotificationsRead() {
  await requireAuth();
  dbMarkAllRead();
  return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// App info actions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get the installed package version and update status (auth-gated, never in client bundle).
 * @returns {Promise<{ version: string, updateAvailable: string|null }>}
 */
export async function getAppVersion() {
  await requireAuth();
  const { getInstalledVersion } = await import('../cron.js');
  const { getAvailableVersion, getReleaseNotes } = await import('../db/update-check.js');
  return {
    version: getInstalledVersion(),
    updateAvailable: getAvailableVersion(),
    changelog: getReleaseNotes(),
  };
}

/**
 * Trigger the upgrade-event-handler workflow via GitHub Actions.
 * @returns {Promise<{ success: boolean }>}
 */
export async function triggerUpgrade() {
  await requireAuth();
  const { triggerWorkflowDispatch } = await import('../tools/github.js');
  const { getAvailableVersion } = await import('../db/update-check.js');
  const targetVersion = getAvailableVersion();
  await triggerWorkflowDispatch('upgrade-event-handler.yml', 'main', {
    target_version: targetVersion || '',
  });
  return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// Agent profile actions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get all discovered agent profiles for Mission Control.
 * @returns {Promise<object[]>}
 */
export async function getAgentProfiles() {
  await requireAuth();
  try {
    const { discoverAgents } = await import('../agents.js');
    return discoverAgents();
  } catch (err) {
    console.error('Failed to discover agents:', err);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// API Key actions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create (or replace) the API key.
 * @returns {Promise<{ key: string, record: object } | { error: string }>}
 */
export async function createNewApiKey() {
  const user = await requireAuth();
  try {
    const { createApiKeyRecord } = await import('../db/api-keys.js');
    return createApiKeyRecord(user.id);
  } catch (err) {
    console.error('Failed to create API key:', err);
    return { error: 'Failed to create API key' };
  }
}

/**
 * Get the current API key metadata (no hash).
 * @returns {Promise<object|null>}
 */
export async function getApiKeys() {
  await requireAuth();
  try {
    const { getApiKey } = await import('../db/api-keys.js');
    return getApiKey();
  } catch (err) {
    console.error('Failed to get API key:', err);
    return null;
  }
}

/**
 * Delete the API key.
 * @returns {Promise<{ success: boolean } | { error: string }>}
 */
export async function deleteApiKey() {
  await requireAuth();
  try {
    const mod = await import('../db/api-keys.js');
    mod.deleteApiKey();
    return { success: true };
  } catch (err) {
    console.error('Failed to delete API key:', err);
    return { error: 'Failed to delete API key' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// LLM Provider actions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get all configured LLM providers from settings table.
 * @returns {Promise<object>} — { anthropic: { apiKey, model, maxTokens }, ... }
 */
export async function getLlmProviders() {
  await requireAuth();
  try {
    const { getDb } = await import('../db/index.js');
    const { settings } = await import('../db/schema.js');
    const { eq } = await import('drizzle-orm');
    const db = getDb();
    const rows = db.select().from(settings).where(eq(settings.type, 'llm_provider')).all();
    const result = {};
    for (const row of rows) {
      try {
        const val = JSON.parse(row.value);
        // Mask the API key for client — show first 8 + last 4 chars
        const masked = val.apiKey
          ? val.apiKey.slice(0, 8) + '***' + val.apiKey.slice(-4)
          : '';
        result[row.key] = { ...val, apiKey: masked, hasKey: !!val.apiKey };
      } catch {}
    }
    return result;
  } catch (err) {
    console.error('Failed to get LLM providers:', err);
    return {};
  }
}

/**
 * Save/update an LLM provider config.
 */
export async function saveLlmProvider(provider, config) {
  await requireAuth();
  try {
    const { getDb } = await import('../db/index.js');
    const { settings } = await import('../db/schema.js');
    const { eq, and } = await import('drizzle-orm');
    const fs = await import('fs');
    const path = await import('path');
    const db = getDb();

    // If existing row, read current to preserve apiKey if not changing
    const existing = db.select().from(settings)
      .where(and(eq(settings.type, 'llm_provider'), eq(settings.key, provider)))
      .get();

    let merged = { ...config };
    if (existing) {
      const prev = JSON.parse(existing.value);
      // If apiKey looks masked (contains ***) or empty, keep existing
      if ((!config.apiKey || config.apiKey.includes('***')) && prev.apiKey) {
        merged.apiKey = prev.apiKey;
      }
    }

    const value = JSON.stringify(merged);
    if (existing) {
      db.update(settings).set({ value }).where(and(eq(settings.type, 'llm_provider'), eq(settings.key, provider))).run();
    } else {
      db.insert(settings).values({ type: 'llm_provider', key: provider, value }).run();
    }

    // Map provider → env var names
    const envMap = {
      anthropic: { key: 'ANTHROPIC_API_KEY' },
      openai:    { key: 'OPENAI_API_KEY' },
      google:    { key: 'GOOGLE_API_KEY' },
      custom:    { key: 'CUSTOM_API_KEY' },
      ollama:    { key: null },
      lmstudio:  { key: null },
    };
    const mapping = envMap[provider];

    // CRITICAL: Update process.env so the running process can use the key immediately
    if (mapping?.key && merged.apiKey) {
      process.env[mapping.key] = merged.apiKey;
    }
    // For local providers, set the base URL in process.env
    if (merged.baseUrl) {
      process.env.OPENAI_BASE_URL = merged.baseUrl;
    }

    // Write to .env for persistence across container restarts
    if (mapping?.key && merged.apiKey) {
      try {
        const envPath = path.join(process.cwd(), '.env');
        let envContent = '';
        try { envContent = fs.readFileSync(envPath, 'utf8'); } catch {}
        const keyPattern = new RegExp(`^${mapping.key}=.*$`, 'm');
        if (keyPattern.test(envContent)) {
          envContent = envContent.replace(keyPattern, `${mapping.key}=${merged.apiKey}`);
        } else {
          envContent += `\n${mapping.key}=${merged.apiKey}`;
        }
        fs.writeFileSync(envPath, envContent);
      } catch (envErr) {
        console.error('Failed to write .env:', envErr);
      }
    }
    // Also persist base URL for local providers
    if (merged.baseUrl) {
      try {
        const envPath = path.join(process.cwd(), '.env');
        let envContent = '';
        try { envContent = fs.readFileSync(envPath, 'utf8'); } catch {}
        const pat = /^OPENAI_BASE_URL=.*$/m;
        if (pat.test(envContent)) {
          envContent = envContent.replace(pat, `OPENAI_BASE_URL=${merged.baseUrl}`);
        } else {
          envContent += `\nOPENAI_BASE_URL=${merged.baseUrl}`;
        }
        fs.writeFileSync(envPath, envContent);
      } catch {}
    }

    return { success: true };
  } catch (err) {
    console.error('Failed to save LLM provider:', err);
    return { error: err.message };
  }
}

/**
 * Set the active provider (writes to .env + settings).
 */
export async function setActiveProvider(provider, model) {
  await requireAuth();
  try {
    const { getDb } = await import('../db/index.js');
    const { settings } = await import('../db/schema.js');
    const { eq, and } = await import('drizzle-orm');
    const fs = await import('fs');
    const path = await import('path');
    const db = getDb();

    // For local providers (ollama, lmstudio), map to 'custom' for model.js
    const effectiveProvider = (provider === 'ollama' || provider === 'lmstudio') ? 'custom' : provider;

    const value = JSON.stringify({ provider, model });
    const existing = db.select().from(settings)
      .where(and(eq(settings.type, 'llm_config'), eq(settings.key, 'active_provider')))
      .get();

    if (existing) {
      db.update(settings).set({ value }).where(and(eq(settings.type, 'llm_config'), eq(settings.key, 'active_provider'))).run();
    } else {
      db.insert(settings).values({ type: 'llm_config', key: 'active_provider', value }).run();
    }

    // Also read the provider's API key from DB and apply it to process.env
    const provRow = db.select().from(settings)
      .where(and(eq(settings.type, 'llm_provider'), eq(settings.key, provider)))
      .get();

    const envKeyMap = {
      anthropic: 'ANTHROPIC_API_KEY',
      openai: 'OPENAI_API_KEY',
      google: 'GOOGLE_API_KEY',
      custom: 'CUSTOM_API_KEY',
    };

    if (provRow) {
      const provConfig = JSON.parse(provRow.value);
      const envKey = envKeyMap[effectiveProvider];
      if (envKey && provConfig.apiKey) {
        process.env[envKey] = provConfig.apiKey;
      }
      // Set base URL for local/custom providers
      if (provConfig.baseUrl) {
        process.env.OPENAI_BASE_URL = provConfig.baseUrl;
      } else if (provider === 'ollama') {
        process.env.OPENAI_BASE_URL = 'http://host.docker.internal:11434/v1';
      } else if (provider === 'lmstudio') {
        process.env.OPENAI_BASE_URL = 'http://host.docker.internal:1234/v1';
      } else {
        // Cloud provider — clear any local base URL
        delete process.env.OPENAI_BASE_URL;
      }
    }

    // Write to .env
    try {
      const envPath = path.join(process.cwd(), '.env');
      let envContent = '';
      try { envContent = fs.readFileSync(envPath, 'utf8'); } catch {}

      const updates = { LLM_PROVIDER: effectiveProvider, LLM_MODEL: model || '' };

      // For local providers set the base URL
      if (provider === 'ollama') {
        updates.OPENAI_BASE_URL = 'http://host.docker.internal:11434/v1';
      } else if (provider === 'lmstudio') {
        updates.OPENAI_BASE_URL = 'http://host.docker.internal:1234/v1';
      }

      for (const [envKey, envVal] of Object.entries(updates)) {
        const pat = new RegExp(`^${envKey}=.*$`, 'm');
        if (pat.test(envContent)) {
          envContent = envContent.replace(pat, `${envKey}=${envVal}`);
        } else {
          envContent += `\n${envKey}=${envVal}`;
        }
      }
      fs.writeFileSync(envPath, envContent);
    } catch {}

    // Update process.env for immediate effect
    process.env.LLM_PROVIDER = effectiveProvider;
    if (model) process.env.LLM_MODEL = model;

    return { success: true };
  } catch (err) {
    console.error('Failed to set active provider:', err);
    return { error: err.message };
  }
}

/**
 * Scan for locally running LLM providers (Ollama, LM Studio, etc.)
 * Returns array of detected providers with their models.
 */
export async function scanLocalProviders() {
  await requireAuth();
  const results = [];

  // Known local provider endpoints
  const localEndpoints = [
    { id: 'ollama', name: 'Ollama', urls: ['http://localhost:11434', 'http://host.docker.internal:11434'], modelsPath: '/api/tags' },
    { id: 'lmstudio', name: 'LM Studio', urls: ['http://localhost:1234/v1', 'http://host.docker.internal:1234/v1'], modelsPath: '/models' },
    { id: 'localai', name: 'LocalAI', urls: ['http://localhost:8080/v1', 'http://host.docker.internal:8080/v1'], modelsPath: '/models' },
    { id: 'llamacpp', name: 'llama.cpp', urls: ['http://localhost:8081', 'http://host.docker.internal:8081'], modelsPath: '/v1/models' },
    { id: 'vllm', name: 'vLLM', urls: ['http://localhost:8000/v1', 'http://host.docker.internal:8000/v1'], modelsPath: '/models' },
    { id: 'jan', name: 'Jan', urls: ['http://localhost:1337/v1', 'http://host.docker.internal:1337/v1'], modelsPath: '/models' },
  ];

  for (const endpoint of localEndpoints) {
    for (const baseUrl of endpoint.urls) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        const url = baseUrl.replace(/\/v1$/, '') + endpoint.modelsPath;
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);

        if (res.ok) {
          const data = await res.json();
          let models = [];

          // Parse models based on provider format
          if (endpoint.id === 'ollama') {
            models = (data.models || []).map(m => ({
              id: m.name || m.model,
              name: m.name || m.model,
              size: m.size,
              modified: m.modified_at,
              family: m.details?.family,
              paramSize: m.details?.parameter_size,
              quantization: m.details?.quantization_level,
            }));
          } else {
            // OpenAI-compatible format
            models = (data.data || data || []).map(m => ({
              id: m.id,
              name: m.id,
              owned_by: m.owned_by,
            }));
          }

          results.push({
            id: endpoint.id,
            name: endpoint.name,
            baseUrl: baseUrl,
            available: true,
            models,
          });
          break; // Found this provider, skip remaining URLs
        }
      } catch {
        // Not available at this URL, try next
      }
    }
  }

  return results;
}

/**
 * Get models from a specific local provider endpoint.
 */
export async function getLocalModels(providerUrl) {
  await requireAuth();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    // Try Ollama format first
    let url = providerUrl.replace(/\/v1$/, '') + '/api/tags';
    let res = await fetch(url, { signal: controller.signal }).catch(() => null);

    if (res?.ok) {
      clearTimeout(timeout);
      const data = await res.json();
      return (data.models || []).map(m => ({
        id: m.name || m.model,
        name: m.name || m.model,
        size: m.size,
        family: m.details?.family,
        paramSize: m.details?.parameter_size,
      }));
    }

    // Try OpenAI-compatible format
    url = providerUrl.replace(/\/$/, '') + (providerUrl.includes('/v1') ? '' : '/v1') + '/models';
    const controller2 = new AbortController();
    const timeout2 = setTimeout(() => controller2.abort(), 5000);
    res = await fetch(url, { signal: controller2.signal }).catch(() => null);
    clearTimeout(timeout2);

    if (res?.ok) {
      const data = await res.json();
      return (data.data || data || []).map(m => ({
        id: m.id,
        name: m.id,
        owned_by: m.owned_by,
      }));
    }

    return [];
  } catch {
    return [];
  }
}

/**
 * Test an LLM provider connection by sending a simple message.
 */
export async function testLlmConnection(provider) {
  await requireAuth();
  try {
    const { getDb } = await import('../db/index.js');
    const { settings } = await import('../db/schema.js');
    const { eq, and } = await import('drizzle-orm');
    const db = getDb();

    const row = db.select().from(settings)
      .where(and(eq(settings.type, 'llm_provider'), eq(settings.key, provider)))
      .get();

    if (!row) return { error: 'Provider not configured' };
    const config = JSON.parse(row.value);
    if (!config.apiKey) return { error: 'No API key configured' };

    // Simple connectivity test using fetch
    const endpoints = {
      anthropic: 'https://api.anthropic.com/v1/messages',
      openai: 'https://api.openai.com/v1/chat/completions',
      google: `https://generativelanguage.googleapis.com/v1beta/models/${config.model || 'gemini-2.0-flash'}:generateContent?key=${config.apiKey}`,
      custom: (config.baseUrl || 'https://api.openai.com/v1') + '/chat/completions',
    };

    if (provider === 'anthropic') {
      const res = await fetch(endpoints.anthropic, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: config.model || 'claude-sonnet-4-20250514',
          max_tokens: 32,
          messages: [{ role: 'user', content: 'Reply with only the word "connected"' }],
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        return { error: `HTTP ${res.status}: ${body.slice(0, 200)}` };
      }
      const data = await res.json();
      return { success: true, response: data.content?.[0]?.text || 'OK' };
    }

    if (provider === 'openai' || provider === 'custom') {
      const res = await fetch(endpoints[provider], {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model || 'gpt-4o-mini',
          max_tokens: 32,
          messages: [{ role: 'user', content: 'Reply with only the word "connected"' }],
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        return { error: `HTTP ${res.status}: ${body.slice(0, 200)}` };
      }
      const data = await res.json();
      return { success: true, response: data.choices?.[0]?.message?.content || 'OK' };
    }

    if (provider === 'google') {
      const res = await fetch(endpoints.google, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Reply with only the word "connected"' }] }],
          generationConfig: { maxOutputTokens: 32 },
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        return { error: `HTTP ${res.status}: ${body.slice(0, 200)}` };
      }
      const data = await res.json();
      return { success: true, response: data.candidates?.[0]?.content?.parts?.[0]?.text || 'OK' };
    }

    // Local providers (Ollama, LM Studio, etc.) — test via OpenAI-compatible endpoint
    if (provider === 'ollama' || provider === 'lmstudio' || provider === 'localai' || provider === 'llamacpp' || provider === 'vllm' || provider === 'jan') {
      const baseUrls = {
        ollama: 'http://host.docker.internal:11434/v1',
        lmstudio: 'http://host.docker.internal:1234/v1',
        localai: 'http://host.docker.internal:8080/v1',
        llamacpp: 'http://host.docker.internal:8081/v1',
        vllm: 'http://host.docker.internal:8000/v1',
        jan: 'http://host.docker.internal:1337/v1',
      };
      const base = config.baseUrl || baseUrls[provider] || baseUrls.ollama;
      const testModel = config.model || 'llama3';

      // First try to just list models (lightweight check)
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const modelsUrl = base.replace(/\/v1$/, '') + (provider === 'ollama' ? '/api/tags' : '/models');
        const modelsRes = await fetch(modelsUrl, { signal: controller.signal });
        clearTimeout(timeout);
        if (modelsRes.ok) {
          const data = await modelsRes.json();
          const count = data.models?.length || data.data?.length || 0;
          return { success: true, response: `Connected. ${count} model(s) available.` };
        }
        return { error: `Cannot reach ${provider} at ${base}` };
      } catch (e) {
        return { error: `Cannot reach ${provider}: ${e.message}` };
      }
    }

    return { error: 'Unknown provider' };
  } catch (err) {
    return { error: err.message };
  }
}

/**
 * Get the current active provider info.
 */
export async function getActiveProvider() {
  await requireAuth();
  try {
    const { getDb } = await import('../db/index.js');
    const { settings } = await import('../db/schema.js');
    const { eq, and } = await import('drizzle-orm');
    const db = getDb();

    const row = db.select().from(settings)
      .where(and(eq(settings.type, 'llm_config'), eq(settings.key, 'active_provider')))
      .get();

    if (row) {
      const active = JSON.parse(row.value);
      // Also return whether the API key is loaded in process.env
      const envKey = {
        anthropic: 'ANTHROPIC_API_KEY',
        openai: 'OPENAI_API_KEY',
        google: 'GOOGLE_API_KEY',
        custom: 'CUSTOM_API_KEY',
      }[active.provider === 'ollama' || active.provider === 'lmstudio' ? 'custom' : active.provider];
      active.keyLoaded = envKey ? !!process.env[envKey] : true;
      active.envProvider = process.env.LLM_PROVIDER;
      active.envModel = process.env.LLM_MODEL;
      return active;
    }

    // Fallback: read from env
    return {
      provider: process.env.LLM_PROVIDER || 'anthropic',
      model: process.env.LLM_MODEL || '',
      keyLoaded: !!process.env.ANTHROPIC_API_KEY,
      envProvider: process.env.LLM_PROVIDER,
      envModel: process.env.LLM_MODEL,
    };
  } catch (err) {
    return { provider: process.env.LLM_PROVIDER || 'anthropic', model: process.env.LLM_MODEL || '' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Agent management actions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get all agent profiles with their activity status from swarm.
 */
export async function getAgentProfilesWithStatus() {
  await requireAuth();
  try {
    const { discoverAgents } = await import('../agents.js');
    const agents = discoverAgents();

    // Cross-reference with swarm
    let runs = [];
    try {
      const { getSwarmStatus: fetchStatus } = await import('../tools/github.js');
      const swarm = await fetchStatus(1);
      runs = swarm.runs || [];
    } catch {}

    return agents.map((a) => {
      const codename = (a.codename || a.name || a.id || '').toLowerCase();
      const activeRuns = runs.filter(
        (r) =>
          (r.status === 'in_progress' || r.status === 'queued') &&
          (r.branch || '').toLowerCase().includes(codename)
      );
      return {
        ...a,
        activeJobs: activeRuns.length,
        status: activeRuns.length > 0 ? 'active' : 'idle',
      };
    });
  } catch (err) {
    console.error('Failed to get agent profiles with status:', err);
    return [];
  }
}

/**
 * Get a single agent's full profile (including markdown file content).
 */
export async function getAgentProfile(agentId) {
  await requireAuth();
  try {
    const { loadAgentProfile } = await import('../agents.js');
    return loadAgentProfile(agentId);
  } catch (err) {
    console.error('Failed to get agent profile:', err);
    return null;
  }
}

/**
 * Update an agent's file content (SOUL.md, SKILLS.md, TOOLS.md, IDENTITY.md, CONFIG.yaml).
 */
export async function updateAgentFile(agentId, filename, content) {
  await requireAuth();
  try {
    const fs = await import('fs');
    const path = await import('path');
    const { agentsDir } = await import('../paths.js');
    const allowed = ['SOUL.md', 'SKILLS.md', 'TOOLS.md', 'IDENTITY.md', 'CONFIG.yaml', 'HEARTBEAT.md'];
    if (!allowed.includes(filename)) return { error: 'File not allowed' };
    const filePath = path.join(agentsDir, agentId, filename);
    fs.writeFileSync(filePath, content, 'utf8');
    return { success: true };
  } catch (err) {
    console.error('Failed to update agent file:', err);
    return { error: err.message };
  }
}

/**
 * Create a new agent with identity files and optional extended configuration.
 */
export async function createAgent(identity) {
  await requireAuth();
  try {
    const fs = await import('fs');
    const path = await import('path');
    const { agentsDir } = await import('../paths.js');
    const dirName = (identity.name || identity.codename || 'new-agent').toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const agentPath = path.join(agentsDir, dirName);

    if (fs.existsSync(agentPath)) return { error: 'Agent directory already exists' };
    fs.mkdirSync(agentPath, { recursive: true });

    // IDENTITY.md
    const identityLines = [
      `Name: ${identity.name || dirName}`,
      `Codename: ${identity.codename || dirName.toUpperCase()}`,
      `Role: ${identity.role || 'General Agent'}`,
      `Specialization: ${identity.specialization || 'General'}`,
    ];
    if (identity.description) identityLines.push(`Description: ${identity.description}`);
    if (identity.tags?.length) identityLines.push(`Tags: ${identity.tags.join(', ')}`);
    if (identity.goal) identityLines.push(`Goal: ${identity.goal}`);
    fs.writeFileSync(path.join(agentPath, 'IDENTITY.md'), identityLines.join('\n'), 'utf8');

    // SOUL.md
    const soulContent = identity.soul || `# ${identity.codename || dirName.toUpperCase()}\n\nYou are ${identity.name || dirName}, a specialized AI agent.\n\n## Role\n${identity.role || 'General Agent'}\n\n## Specialization\n${identity.specialization || 'General purpose tasks'}`;
    fs.writeFileSync(path.join(agentPath, 'SOUL.md'), soulContent, 'utf8');

    // SKILLS.md
    if (identity.skills) {
      fs.writeFileSync(path.join(agentPath, 'SKILLS.md'), identity.skills, 'utf8');
    }

    // TOOLS.md
    if (identity.tools) {
      fs.writeFileSync(path.join(agentPath, 'TOOLS.md'), identity.tools, 'utf8');
    }

    // HEARTBEAT.md
    if (identity.heartbeat) {
      fs.writeFileSync(path.join(agentPath, 'HEARTBEAT.md'), identity.heartbeat, 'utf8');
    }

    // CONFIG.yaml — extended with LLM, scheduling, resources
    const configLines = [
      `codename: ${identity.codename || dirName.toUpperCase()}`,
      `role: ${identity.role || 'General Agent'}`,
      `active: true`,
    ];
    if (identity.llm) {
      configLines.push(`\n# LLM Configuration`);
      if (identity.llm.provider) configLines.push(`llm_provider: ${identity.llm.provider}`);
      if (identity.llm.model) configLines.push(`llm_model: ${identity.llm.model}`);
      if (identity.llm.temperature != null) configLines.push(`llm_temperature: ${identity.llm.temperature}`);
      if (identity.llm.maxTokens) configLines.push(`llm_max_tokens: ${identity.llm.maxTokens}`);
    }
    if (identity.scheduling) {
      configLines.push(`\n# Scheduling`);
      if (identity.scheduling.mode) configLines.push(`run_mode: ${identity.scheduling.mode}`);
      if (identity.scheduling.schedule) configLines.push(`schedule: "${identity.scheduling.schedule}"`);
      if (identity.scheduling.maxConcurrent) configLines.push(`max_concurrent: ${identity.scheduling.maxConcurrent}`);
      if (identity.scheduling.timeout) configLines.push(`timeout: ${identity.scheduling.timeout}`);
    }
    if (identity.resources) {
      configLines.push(`\n# Resources`);
      if (identity.resources.cpu) configLines.push(`cpu: ${identity.resources.cpu}`);
      if (identity.resources.memory) configLines.push(`memory: "${identity.resources.memory}"`);
      if (identity.resources.disk) configLines.push(`disk: "${identity.resources.disk}"`);
      if (identity.resources.network) configLines.push(`network: ${identity.resources.network}`);
    }
    if (identity.envVars && Object.keys(identity.envVars).length > 0) {
      configLines.push(`\n# Environment Variables`);
      configLines.push(`env:`);
      for (const [k, v] of Object.entries(identity.envVars)) {
        configLines.push(`  ${k}: "${v}"`);
      }
    }
    if (identity.mcpTools?.length) {
      configLines.push(`\n# MCP Tools`);
      configLines.push(`tools:`);
      for (const t of identity.mcpTools) {
        configLines.push(`  - ${t}`);
      }
    }
    if (identity.team) {
      configLines.push(`\n# Team`);
      if (identity.team.swarm) configLines.push(`swarm: ${identity.team.swarm}`);
      if (identity.team.supervisor) configLines.push(`supervisor: ${identity.team.supervisor}`);
    }
    fs.writeFileSync(path.join(agentPath, 'CONFIG.yaml'), configLines.join('\n'), 'utf8');

    return { success: true, id: dirName };
  } catch (err) {
    console.error('Failed to create agent:', err);
    return { error: err.message };
  }
}

/**
 * Get available MCP tool names for agent tool assignment.
 */
export async function getAvailableMcpTools() {
  await requireAuth();
  try {
    const { loadMcpTools } = await import('../mcp/client.js');
    const tools = await loadMcpTools();
    return tools.map(t => ({ name: t.name, description: t.description }));
  } catch {
    return [];
  }
}

/**
 * Create a job for a specific agent.
 */
export async function createAgentJob(agentId, prompt) {
  await requireAuth();
  try {
    const { createJob } = await import('../tools/github.js');
    // Prefix the prompt with agent mention
    const { loadAgentProfile } = await import('../agents.js');
    const profile = loadAgentProfile(agentId);
    const codename = profile?.codename || agentId;
    const fullPrompt = `@${codename.toUpperCase()} ${prompt}`;
    const result = await createJob(fullPrompt);
    return { success: true, ...result };
  } catch (err) {
    console.error('Failed to create agent job:', err);
    return { error: err.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Agent-Program Assignment actions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get program assignments for an agent.
 * Stored in settings table: type='agent_assignment', key=agentId.
 */
export async function getAgentAssignments(agentId) {
  await requireAuth();
  try {
    const { getDb } = await import('../db/index.js');
    const { settings } = await import('../db/schema.js');
    const { eq, and } = await import('drizzle-orm');
    const db = getDb();
    const row = db.select().from(settings)
      .where(and(eq(settings.type, 'agent_assignment'), eq(settings.key, agentId)))
      .get();
    if (!row) return { programs: [], targets: [] };
    return JSON.parse(row.value);
  } catch {
    return { programs: [], targets: [] };
  }
}

/**
 * Get assignments for ALL agents at once.
 */
export async function getAllAgentAssignments() {
  await requireAuth();
  try {
    const { getDb } = await import('../db/index.js');
    const { settings } = await import('../db/schema.js');
    const { eq } = await import('drizzle-orm');
    const db = getDb();
    const rows = db.select().from(settings)
      .where(eq(settings.type, 'agent_assignment'))
      .all();
    const result = {};
    for (const row of rows) {
      try { result[row.key] = JSON.parse(row.value); } catch {}
    }
    return result;
  } catch {
    return {};
  }
}

/**
 * Assign programs to an agent.
 */
export async function assignProgramsToAgent(agentId, programIds) {
  await requireAuth();
  try {
    const { getDb } = await import('../db/index.js');
    const { settings } = await import('../db/schema.js');
    const { eq, and } = await import('drizzle-orm');
    const { randomUUID } = await import('crypto');
    const db = getDb();

    const existing = db.select().from(settings)
      .where(and(eq(settings.type, 'agent_assignment'), eq(settings.key, agentId)))
      .get();

    const current = existing ? JSON.parse(existing.value) : { programs: [], targets: [] };
    current.programs = [...new Set([...current.programs, ...programIds])];
    const value = JSON.stringify(current);
    const now = Date.now();

    if (existing) {
      db.update(settings).set({ value, updatedAt: now })
        .where(and(eq(settings.type, 'agent_assignment'), eq(settings.key, agentId))).run();
    } else {
      db.insert(settings).values({
        id: randomUUID(), type: 'agent_assignment', key: agentId,
        value, createdAt: now, updatedAt: now,
      }).run();
    }
    return { success: true, assignments: current };
  } catch (err) {
    return { error: err.message };
  }
}

/**
 * Remove a program from an agent's assignments.
 */
export async function unassignProgramFromAgent(agentId, programId) {
  await requireAuth();
  try {
    const { getDb } = await import('../db/index.js');
    const { settings } = await import('../db/schema.js');
    const { eq, and } = await import('drizzle-orm');
    const db = getDb();

    const existing = db.select().from(settings)
      .where(and(eq(settings.type, 'agent_assignment'), eq(settings.key, agentId)))
      .get();
    if (!existing) return { success: true };

    const current = JSON.parse(existing.value);
    current.programs = current.programs.filter(id => id !== programId);
    db.update(settings).set({ value: JSON.stringify(current), updatedAt: Date.now() })
      .where(and(eq(settings.type, 'agent_assignment'), eq(settings.key, agentId))).run();
    return { success: true, assignments: current };
  } catch (err) {
    return { error: err.message };
  }
}

/**
 * Get programs with target counts for the assignment wizard.
 * Returns slimmed-down program list with counts.
 */
export async function getProgramsForAssignment() {
  await requireAuth();
  try {
    const { getDb } = await import('../db/index.js');
    const db = getDb();
    const rows = db.prepare(`
      SELECT p.id, p.name, p.platform, p.status, p.url,
        p.min_bounty, p.max_bounty,
        COUNT(t.id) as target_count,
        SUM(CASE WHEN t.status = 'in_scope' THEN 1 ELSE 0 END) as in_scope_count
      FROM programs p
      LEFT JOIN targets t ON t.program_id = p.id
      GROUP BY p.id
      ORDER BY target_count DESC, p.name ASC
    `).all();
    return rows.map(r => ({
      id: r.id, name: r.name, platform: r.platform, status: r.status, url: r.url,
      minBounty: r.min_bounty, maxBounty: r.max_bounty,
      targetCount: r.target_count, inScopeCount: r.in_scope_count,
    }));
  } catch (err) {
    return [];
  }
}

/**
 * Get targets for a list of program IDs (for agent deep dive).
 */
export async function getTargetsForPrograms(programIds) {
  await requireAuth();
  if (!Array.isArray(programIds) || programIds.length === 0) return [];
  try {
    const { getDb } = await import('../db/index.js');
    const db = getDb();
    const placeholders = programIds.map(() => '?').join(',');
    const rows = db.prepare(`
      SELECT t.*, p.name as program_name, p.platform as program_platform
      FROM targets t
      JOIN programs p ON p.id = t.program_id
      WHERE t.program_id IN (${placeholders})
      AND t.status = 'in_scope'
      ORDER BY p.name, t.type, t.value
    `).all(...programIds);
    return rows;
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Swarm actions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get swarm status (active + completed jobs with counts).
 * @returns {Promise<object>}
 */
export async function getSwarmStatus(page = 1) {
  await requireAuth();
  try {
    const { getSwarmStatus: fetchStatus } = await import('../tools/github.js');
    return await fetchStatus(page);
  } catch (err) {
    console.error('Failed to get swarm status:', err);
    return { error: 'Failed to get swarm status', runs: [], hasMore: false };
  }
}

/**
 * Get swarm config (crons + triggers).
 * @returns {Promise<{ crons: object[], triggers: object[] }>}
 */
export async function getSwarmConfig() {
  await requireAuth();
  const { cronsFile, triggersFile } = await import('../paths.js');
  const fs = await import('fs');
  let crons = [];
  let triggers = [];
  try { crons = JSON.parse(fs.readFileSync(cronsFile, 'utf8')); } catch {}
  try { triggers = JSON.parse(fs.readFileSync(triggersFile, 'utf8')); } catch {}
  return { crons, triggers };
}

// ─────────────────────────────────────────────────────────────────────────────
// Diagnostics actions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Run full system diagnostics — gateway, DB, providers, MCP, config drift.
 */
export async function runDiagnostics() {
  await requireAuth();
  const result = { gateway: {}, db: {}, providers: [], mcp: [], configDrift: [] };

  try {
    const { getInstalledVersion } = await import('../cron.js');
    result.gateway = {
      status: 'ok',
      uptime: Math.floor(process.uptime()),
      memoryMb: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      },
      nodeVersion: process.version,
      packageVersion: getInstalledVersion(),
    };
  } catch (err) {
    result.gateway = { status: 'error', error: err.message };
  }

  try {
    const { getDb } = await import('../db/index.js');
    const db = getDb();
    db.prepare('SELECT 1').get();
    const fs = await import('fs');
    const path = await import('path');
    const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'thepopebot.sqlite');
    let size = 'unknown';
    try { const stat = fs.statSync(dbPath); size = (stat.size / 1024 / 1024).toFixed(1) + ' MB'; } catch {}
    result.db = { status: 'ok', path: dbPath, size };
  } catch (err) {
    result.db = { status: 'error', error: err.message };
  }

  try {
    const { getDb } = await import('../db/index.js');
    const { settings } = await import('../db/schema.js');
    const { eq } = await import('drizzle-orm');
    const db = getDb();
    const rows = db.select().from(settings).where(eq(settings.type, 'llm_provider')).all();
    for (const row of rows) {
      try {
        const config = JSON.parse(row.value);
        result.providers.push({ name: row.key, status: config.apiKey ? 'configured' : 'no_key', model: config.model || 'default' });
      } catch {}
    }
  } catch {}

  try {
    const { loadMcpTools } = await import('../mcp/client.js');
    const tools = await loadMcpTools();
    result.mcp.push({ name: 'default', status: 'connected', toolCount: tools.length });
  } catch {
    result.mcp.push({ name: 'default', status: 'error', toolCount: 0 });
  }

  try {
    const { getDb } = await import('../db/index.js');
    const { settings } = await import('../db/schema.js');
    const { eq, and } = await import('drizzle-orm');
    const db = getDb();
    const activeRow = db.select().from(settings).where(and(eq(settings.type, 'llm_config'), eq(settings.key, 'active_provider'))).get();
    if (activeRow) {
      const dbActive = JSON.parse(activeRow.value);
      const envProvider = process.env.LLM_PROVIDER || '';
      const envModel = process.env.LLM_MODEL || '';
      if (envProvider && dbActive.provider && envProvider !== dbActive.provider) {
        result.configDrift.push({ key: 'LLM_PROVIDER', envValue: envProvider, dbValue: dbActive.provider, match: false });
      }
      if (envModel && dbActive.model && envModel !== dbActive.model) {
        result.configDrift.push({ key: 'LLM_MODEL', envValue: envModel, dbValue: dbActive.model, match: false });
      }
    }
  } catch {}

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Model roles & fallback chain actions
// ─────────────────────────────────────────────────────────────────────────────

export async function getRoleModels() {
  await requireAuth();
  try {
    const { getDb } = await import('../db/index.js');
    const { settings } = await import('../db/schema.js');
    const { eq, and } = await import('drizzle-orm');
    const db = getDb();
    const roles = {};
    for (const role of ['chat', 'agent', 'tool']) {
      const row = db.select().from(settings).where(and(eq(settings.type, 'llm_config'), eq(settings.key, `role_${role}`))).get();
      if (row) try { roles[role] = JSON.parse(row.value); } catch {}
    }
    return roles;
  } catch { return {}; }
}

export async function setRoleModel(role, provider, model) {
  await requireAuth();
  try {
    const { getDb } = await import('../db/index.js');
    const { settings } = await import('../db/schema.js');
    const { eq, and } = await import('drizzle-orm');
    const { randomUUID } = await import('crypto');
    const db = getDb();
    const key = `role_${role}`;
    const value = JSON.stringify({ provider, model });
    const now = Date.now();
    const existing = db.select().from(settings).where(and(eq(settings.type, 'llm_config'), eq(settings.key, key))).get();
    if (existing) {
      db.update(settings).set({ value, updatedAt: now }).where(and(eq(settings.type, 'llm_config'), eq(settings.key, key))).run();
    } else {
      db.insert(settings).values({ id: randomUUID(), type: 'llm_config', key, value, createdAt: now, updatedAt: now }).run();
    }
    return { success: true };
  } catch (err) { return { error: err.message }; }
}

export async function getFallbackChain() {
  await requireAuth();
  try {
    const { getDb } = await import('../db/index.js');
    const { settings } = await import('../db/schema.js');
    const { eq, and } = await import('drizzle-orm');
    const db = getDb();
    const chainRow = db.select().from(settings).where(and(eq(settings.type, 'llm_config'), eq(settings.key, 'fallback_chain'))).get();
    const configRow = db.select().from(settings).where(and(eq(settings.type, 'llm_config'), eq(settings.key, 'fallback_config'))).get();
    return {
      chain: chainRow ? JSON.parse(chainRow.value) : [],
      config: configRow ? JSON.parse(configRow.value) : { mode: 'on_error', timeoutMs: 30000 },
    };
  } catch { return { chain: [], config: { mode: 'on_error', timeoutMs: 30000 } }; }
}

export async function saveFallbackChain(chain, config) {
  await requireAuth();
  try {
    const { getDb } = await import('../db/index.js');
    const { settings } = await import('../db/schema.js');
    const { eq, and } = await import('drizzle-orm');
    const { randomUUID } = await import('crypto');
    const db = getDb();
    const now = Date.now();
    for (const [key, val] of [['fallback_chain', chain], ['fallback_config', config]]) {
      const value = JSON.stringify(val);
      const existing = db.select().from(settings).where(and(eq(settings.type, 'llm_config'), eq(settings.key, key))).get();
      if (existing) {
        db.update(settings).set({ value, updatedAt: now }).where(and(eq(settings.type, 'llm_config'), eq(settings.key, key))).run();
      } else {
        db.insert(settings).values({ id: randomUUID(), type: 'llm_config', key, value, createdAt: now, updatedAt: now }).run();
      }
    }
    return { success: true };
  } catch (err) { return { error: err.message }; }
}

// ─────────────────────────────────────────────────────────────────────────────
// Integration status actions
// ─────────────────────────────────────────────────────────────────────────────

const KNOWN_INTEGRATIONS = [
  { name: 'GitHub', keys: ['GH_TOKEN', 'GH_OWNER', 'GH_REPO'], category: 'core' },
  { name: 'Telegram', keys: ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID'], category: 'core' },
  { name: 'Anthropic', keys: ['ANTHROPIC_API_KEY'], category: 'llm' },
  { name: 'OpenAI', keys: ['OPENAI_API_KEY'], category: 'llm' },
  { name: 'Google', keys: ['GOOGLE_API_KEY'], category: 'llm' },
  { name: 'Brave Search', keys: ['BRAVE_API_KEY'], category: 'search' },
  { name: 'Webhook', keys: ['GH_WEBHOOK_SECRET'], category: 'webhook' },
];

export async function getIntegrationStatus() {
  await requireAuth();
  return KNOWN_INTEGRATIONS.map(({ name, keys, category }) => {
    const statuses = keys.map(key => ({
      key, configured: !!process.env[key],
      masked: process.env[key] ? process.env[key].slice(0, 4) + '****' + process.env[key].slice(-4) : null,
    }));
    const allConfigured = statuses.every(s => s.configured);
    const anyConfigured = statuses.some(s => s.configured);
    return { name, category, status: allConfigured ? 'connected' : anyConfigured ? 'partial' : 'not_set', keys: statuses };
  });
}

export async function testIntegration(name) {
  await requireAuth();
  try {
    if (name === 'GitHub') {
      const token = process.env.GH_TOKEN;
      if (!token) return { error: 'GH_TOKEN not set' };
      const res = await fetch('https://api.github.com/user', { headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json' } });
      if (!res.ok) return { error: `HTTP ${res.status}` };
      const data = await res.json();
      return { success: true, response: `Authenticated as ${data.login}` };
    }
    if (name === 'Telegram') {
      const token = process.env.TELEGRAM_BOT_TOKEN;
      if (!token) return { error: 'TELEGRAM_BOT_TOKEN not set' };
      const res = await fetch(`https://api.telegram.org/bot${token}/getMe`);
      if (!res.ok) return { error: `HTTP ${res.status}` };
      const data = await res.json();
      return { success: true, response: `Bot: @${data.result?.username}` };
    }
    if (['Anthropic', 'OpenAI', 'Google'].includes(name)) {
      return await testLlmConnection(name.toLowerCase());
    }
    return { error: 'Test not available' };
  } catch (err) { return { error: err.message }; }
}

// ─────────────────────────────────────────────────────────────────────────────
// Agent hierarchy & workspace actions
// ─────────────────────────────────────────────────────────────────────────────

export async function getAgentHierarchy() {
  await requireAuth();
  try {
    const { discoverAgents } = await import('../agents.js');
    const agents = discoverAgents();
    const childrenMap = {};
    const hasParent = new Set();
    for (const agent of agents) {
      const reportsTo = agent.config?.reports_to || agent.config?.supervisor;
      if (reportsTo) {
        const parentId = agents.find(a => (a.codename || '').toLowerCase() === reportsTo.toLowerCase() || a.id === reportsTo)?.id;
        if (parentId) {
          if (!childrenMap[parentId]) childrenMap[parentId] = [];
          childrenMap[parentId].push(agent.id);
          hasParent.add(agent.id);
        }
      }
    }
    const rootIds = agents.filter(a => !hasParent.has(a.id)).map(a => a.id);
    return { agents, tree: { rootIds, childrenMap } };
  } catch (err) {
    return { agents: [], tree: { rootIds: [], childrenMap: {} } };
  }
}

export async function getAgentWorkspace(agentId) {
  await requireAuth();
  try {
    const fs = await import('fs');
    const path = await import('path');
    const { agentsDir } = await import('../paths.js');
    const agentPath = path.join(agentsDir, agentId);
    if (!fs.existsSync(agentPath)) return { files: [] };
    const entries = fs.readdirSync(agentPath);
    const files = [];
    for (const name of entries) {
      const fullPath = path.join(agentPath, name);
      const stat = fs.statSync(fullPath);
      if (!stat.isFile()) continue;
      const content = fs.readFileSync(fullPath, 'utf8');
      files.push({ name, size: stat.size, modified: stat.mtimeMs, content, editable: /\.(md|yaml|yml|txt|json)$/i.test(name) });
    }
    return { files };
  } catch (err) { return { files: [] }; }
}

