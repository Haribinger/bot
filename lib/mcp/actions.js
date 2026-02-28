'use server';

import fs from 'fs';
import { auth } from '../auth/index.js';
import { mcpServersFile } from '../paths.js';

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }
  return session.user;
}

/**
 * Read MCP_SERVERS.json config.
 */
export async function getMcpServers() {
  await requireAuth();
  if (!fs.existsSync(mcpServersFile)) return [];
  try {
    return JSON.parse(fs.readFileSync(mcpServersFile, 'utf8'));
  } catch {
    return [];
  }
}

/**
 * Get status of loaded MCP tools from the client singleton.
 */
export async function getMcpStatus() {
  await requireAuth();
  try {
    const { loadMcpTools } = await import('./client.js');
    const tools = await loadMcpTools();
    return {
      loaded: true,
      toolCount: tools.length,
      tools: tools.map(t => ({ name: t.name, description: t.description })),
    };
  } catch (err) {
    return { loaded: false, toolCount: 0, tools: [], error: err.message };
  }
}

/**
 * Get metadata about Harbinger's own MCP server capabilities.
 */
export async function getOwnMcpServerInfo() {
  await requireAuth();
  return {
    tools: [
      { name: 'create_job', description: 'Create a new autonomous agent job' },
      { name: 'get_job_status', description: 'Get the status of running or recent agent jobs' },
      { name: 'chat', description: 'Send a message to the AI chat agent' },
      { name: 'list_agents', description: 'List all discovered agent profiles' },
      { name: 'get_agent_profile', description: 'Get the full profile for a specific agent' },
    ],
    resources: [
      { uri: 'agent://agents', description: 'List of all agent profiles' },
      { uri: 'agent://{agentId}/soul', description: 'SOUL.md for a specific agent' },
      { uri: 'config://soul', description: 'Main SOUL.md configuration' },
      { uri: 'config://crons', description: 'Cron jobs configuration' },
      { uri: 'config://triggers', description: 'Webhook triggers configuration' },
    ],
    prompts: [
      { name: 'agent-prompt', description: 'System prompt for an agent' },
    ],
  };
}

/**
 * Test an external MCP tool by invoking it.
 */
export async function testMcpTool(toolName, args = {}) {
  await requireAuth();
  try {
    const { loadMcpTools } = await import('./client.js');
    const tools = await loadMcpTools();
    const tool = tools.find(t => t.name === toolName);
    if (!tool) return { error: `Tool "${toolName}" not found` };
    const result = await tool.invoke(args);
    return { success: true, result };
  } catch (err) {
    return { error: err.message };
  }
}

/**
 * Reset the MCP client and agent singletons, then reload tools.
 */
export async function reloadMcpClient() {
  await requireAuth();
  try {
    const { resetMcpClient, loadMcpTools } = await import('./client.js');
    const { resetAgent } = await import('../ai/agent.js');
    await resetMcpClient();
    resetAgent();
    const tools = await loadMcpTools();
    return { success: true, toolCount: tools.length };
  } catch (err) {
    return { error: err.message };
  }
}
