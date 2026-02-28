import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import fs from 'fs';
import { createRequire } from 'module';
import { soulMd, cronsFile, triggersFile } from '../paths.js';

const require = createRequire(import.meta.url);
const { version } = require('../../package.json');

/**
 * Create a fresh McpServer instance with all tools, resources, and prompts registered.
 */
export function createMcpServer() {
  const server = new McpServer({
    name: 'harbinger',
    version,
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Tools
  // ─────────────────────────────────────────────────────────────────────────

  server.tool(
    'create_job',
    'Create a new autonomous agent job. The agent runs in a Docker container and creates a PR with results.',
    { job_description: z.string().describe('Description of the task for the agent to perform') },
    async ({ job_description }) => {
      const { createJob } = await import('../tools/create-job.js');
      const result = await createJob(job_description);
      return { content: [{ type: 'text', text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    'get_job_status',
    'Get the status of running or recent agent jobs.',
    { job_id: z.string().optional().describe('Optional specific job ID to check') },
    async ({ job_id }) => {
      const { getJobStatus } = await import('../tools/github.js');
      const result = await getJobStatus(job_id);
      return { content: [{ type: 'text', text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    'chat',
    'Send a message to the AI chat agent and get a response. Use agent_id to route to a specific Harbinger agent profile.',
    {
      thread_id: z.string().describe('Conversation thread ID'),
      message: z.string().describe('Message to send'),
      agent_id: z.string().optional().describe('Optional agent profile ID to route to (e.g. recon-scout, web-hacker)'),
    },
    async ({ thread_id, message, agent_id }) => {
      const { chat } = await import('../ai/index.js');
      const response = await chat(thread_id, message, [], agent_id ? { agentId: agent_id } : {});
      return { content: [{ type: 'text', text: response }] };
    }
  );

  server.tool(
    'list_agents',
    'List all discovered agent profiles with their identities and roles.',
    {},
    async () => {
      const { discoverAgents } = await import('../agents.js');
      const agents = discoverAgents();
      return { content: [{ type: 'text', text: JSON.stringify(agents.map(a => ({ id: a.id, codename: a.codename, name: a.name, role: a.role }))) }] };
    }
  );

  server.tool(
    'get_agent_profile',
    'Get the full profile for a specific agent including SOUL, skills, and tools.',
    { agent_id: z.string().describe('Directory name of the agent profile') },
    async ({ agent_id }) => {
      const { loadAgentProfile } = await import('../agents.js');
      const profile = loadAgentProfile(agent_id);
      if (!profile) return { content: [{ type: 'text', text: JSON.stringify({ error: 'Agent not found' }) }] };
      return { content: [{ type: 'text', text: JSON.stringify(profile) }] };
    }
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Resources
  // ─────────────────────────────────────────────────────────────────────────

  server.resource(
    'agents-list',
    'agent://agents',
    'List of all discovered agent profiles',
    async () => {
      const { discoverAgents } = await import('../agents.js');
      const agents = discoverAgents();
      return { contents: [{ uri: 'agent://agents', text: JSON.stringify(agents.map(a => ({ id: a.id, codename: a.codename, name: a.name, role: a.role }))) }] };
    }
  );

  server.resource(
    'agent-soul',
    'agent://{agentId}/soul',
    'SOUL.md system prompt for a specific agent',
    async (uri) => {
      const agentId = uri.pathname.split('/')[0] || uri.host;
      const { loadAgentProfile } = await import('../agents.js');
      const profile = loadAgentProfile(agentId);
      const text = profile?.soul || 'Agent not found or has no SOUL.md';
      return { contents: [{ uri: uri.href, text }] };
    }
  );

  server.resource(
    'config-soul',
    'config://soul',
    'The main SOUL.md configuration file',
    async () => {
      const text = fs.existsSync(soulMd) ? fs.readFileSync(soulMd, 'utf8') : 'SOUL.md not found';
      return { contents: [{ uri: 'config://soul', text }] };
    }
  );

  server.resource(
    'config-crons',
    'config://crons',
    'Configured cron jobs from CRONS.json',
    async () => {
      const text = fs.existsSync(cronsFile) ? fs.readFileSync(cronsFile, 'utf8') : '[]';
      return { contents: [{ uri: 'config://crons', text }] };
    }
  );

  server.resource(
    'config-triggers',
    'config://triggers',
    'Configured webhook triggers from TRIGGERS.json',
    async () => {
      const text = fs.existsSync(triggersFile) ? fs.readFileSync(triggersFile, 'utf8') : '[]';
      return { contents: [{ uri: 'config://triggers', text }] };
    }
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Prompts
  // ─────────────────────────────────────────────────────────────────────────

  server.prompt(
    'agent-prompt',
    'Get the system prompt for an agent (default: main event handler)',
    { agent_id: z.string().optional().describe('Optional agent profile ID') },
    async ({ agent_id }) => {
      if (agent_id) {
        const { loadAgentProfile } = await import('../agents.js');
        const profile = loadAgentProfile(agent_id);
        if (profile?.soul) {
          return { messages: [{ role: 'user', content: { type: 'text', text: profile.soul } }] };
        }
      }
      const { eventHandlerMd } = await import('../paths.js');
      const { render_md } = await import('../utils/render-md.js');
      const text = render_md(eventHandlerMd);
      return { messages: [{ role: 'user', content: { type: 'text', text } }] };
    }
  );

  return server;
}
