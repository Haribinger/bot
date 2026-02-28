import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createMcpServer } from './server.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { version } = require('../../package.json');

// Cache the MCP server instance — it's stateless, only the transport is per-request
let _mcpServer = null;
function getMcpServer() {
  if (!_mcpServer) _mcpServer = createMcpServer();
  return _mcpServer;
}

/**
 * Handle MCP HTTP requests at /api/mcp.
 * Auth is handled by the main API router (api/index.js checkAuth).
 *
 * - POST: JSON-RPC messages (tool calls, resource reads, etc.)
 * - GET: Server capability info
 * - DELETE: Not supported (stateless, no sessions)
 */
export async function handleMcpRequest(request) {
  const method = request.method;

  if (method === 'DELETE') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    if (method === 'POST') {
      const server = getMcpServer();
      const transport = new StreamableHTTPServerTransport({ enableJsonResponse: true });
      await server.connect(transport);
      const body = await request.json();
      const result = await transport.handleRequest(request, body);
      if (result instanceof Response) return result;
      return Response.json(result);
    }

    if (method === 'GET') {
      return Response.json({
        name: 'thepopebot',
        version,
        description: 'thepopebot MCP server — autonomous AI agent platform',
        tools: ['create_job', 'get_job_status', 'chat', 'list_agents', 'get_agent_profile'],
        resources: ['agent://agents', 'agent://{agentId}/soul', 'config://soul', 'config://crons', 'config://triggers'],
        prompts: ['agent-prompt'],
      });
    }

    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  } catch (err) {
    console.error('MCP handler error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
