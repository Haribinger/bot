import fs from 'fs';
import { mcpServersFile } from '../paths.js';

let _client = null;
let _promise = null;

/**
 * Load MCP tools from configured external servers in MCP_SERVERS.json.
 * Uses @langchain/mcp-adapters MultiServerMCPClient to connect and
 * convert external MCP tools into LangChain-compatible tools.
 *
 * Returns an empty array if no servers are configured or the config file doesn't exist.
 * Uses promise-based singleton to prevent concurrent initialization races.
 */
export function loadMcpTools() {
  if (!_promise) {
    _promise = _loadMcpToolsImpl().catch(err => {
      _promise = null; // allow retry on failure
      throw err;
    });
  }
  return _promise;
}

async function _loadMcpToolsImpl() {
  // Read config
  if (!fs.existsSync(mcpServersFile)) return [];

  let servers;
  try {
    servers = JSON.parse(fs.readFileSync(mcpServersFile, 'utf8'));
  } catch {
    return [];
  }

  if (!Array.isArray(servers) || servers.length === 0) return [];

  // Filter to enabled servers only
  const enabled = servers.filter(s => s.enabled !== false);
  if (enabled.length === 0) return [];

  // Build config for MultiServerMCPClient
  const mcpConfig = {};
  for (const server of enabled) {
    if (!server.name || !server.url) continue;
    mcpConfig[server.name] = {
      transport: server.transport || 'http',
      url: server.url,
      headers: server.headers || {},
    };
  }

  if (Object.keys(mcpConfig).length === 0) return [];

  try {
    const { MultiServerMCPClient } = await import('@langchain/mcp-adapters');
    _client = new MultiServerMCPClient(mcpConfig);
    // Race against a timeout to prevent hanging on unresponsive MCP servers
    const tools = await Promise.race([
      _client.getTools(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('MCP tool loading timed out after 15s')), 15000)),
    ]);
    return tools;
  } catch (err) {
    console.error('Failed to load MCP tools:', err.message);
    return [];
  }
}

/**
 * Reset the MCP client singleton so tools are reloaded on next call.
 */
export async function resetMcpClient() {
  if (_client) {
    try { await _client.close(); } catch {}
  }
  _client = null;
  _promise = null;
}
