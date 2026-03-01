# MCP Integration

Harbinger supports the [Model Context Protocol](https://modelcontextprotocol.io/) (MCP), enabling two-way tool sharing between your agents and external AI clients.

---

## Overview

| Feature | What it does |
|---------|-------------|
| **MCP Server** | Exposes Harbinger's capabilities to external clients (Claude Desktop, Cursor, etc.) |
| **MCP Client** | Consumes tools from external MCP servers, making them available to your agents |
| **MCP UI** | Manage both from Settings → MCP in the web interface |

---

## MCP Server

Harbinger exposes an MCP server at `/api/mcp` using the Streamable HTTP transport. External AI clients can connect to call your agent's tools, read resources, and use prompts.

### Authentication

All MCP requests require a valid API key in the `x-api-key` header. Generate API keys from Settings → Secrets in the web UI.

### Connecting from Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "Harbinger": {
      "url": "https://your-app-url/api/mcp",
      "headers": {
        "x-api-key": "YOUR_API_KEY"
      }
    }
  }
}
```

### Connecting from Cursor

In Cursor settings, add an MCP server with:
- **URL**: `https://your-app-url/api/mcp`
- **Header**: `x-api-key: YOUR_API_KEY`

### Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `create_job` | Create a new autonomous agent job | `job_description` (string) |
| `get_job_status` | Get status of running/recent jobs | `job_id` (optional string) |
| `chat` | Send a message to the AI chat agent | `thread_id` (string), `message` (string), `agent_id` (optional string — route to specific agent profile) |
| `list_agents` | List all discovered agent profiles | none |
| `get_agent_profile` | Get full profile for a specific agent | `agent_id` (string) |

### Resources

| URI | Description |
|-----|-------------|
| `agent://agents` | List of all agent profiles |
| `agent://{agentId}/soul` | SOUL.md system prompt for a specific agent |
| `config://soul` | Main SOUL.md configuration |
| `config://crons` | Configured cron jobs (CRONS.json) |
| `config://triggers` | Configured webhook triggers (TRIGGERS.json) |

### Prompts

| Name | Description | Parameters |
|------|-------------|------------|
| `agent-prompt` | System prompt for an agent | `agent_id` (optional) |

### Testing

Use the MCP Inspector to test your server:

```bash
npx @modelcontextprotocol/inspector https://your-app-url/api/mcp \
  --header "x-api-key:YOUR_API_KEY"
```

Or use the **Test** button in Settings → MCP in the web UI.

---

## MCP Client

Harbinger can consume tools from external MCP servers, making them available to your LangChain agents alongside the built-in tools.

### Configuration

Create `config/MCP_SERVERS.json` (or it's scaffolded by `harbinger init`):

```json
[
  {
    "name": "my-tool-server",
    "transport": "http",
    "url": "http://localhost:3001/mcp",
    "headers": {},
    "enabled": true
  }
]
```

Each entry:

| Field | Required | Default | Description |
|-------|----------|---------|-------------|
| `name` | yes | — | Display name for the server |
| `transport` | no | `"http"` | Transport type (`http` or `stdio`) |
| `url` | yes | — | Server URL |
| `headers` | no | `{}` | Additional HTTP headers (e.g., auth tokens) |
| `enabled` | no | `true` | Set `false` to disable without removing |

### How It Works

1. On server startup, Harbinger reads `MCP_SERVERS.json` and connects to enabled servers using `@langchain/mcp-adapters`
2. External tools are converted to LangChain-compatible tools
3. These tools are spread into every agent's tool array alongside built-in tools
4. Agents can invoke external MCP tools just like built-in ones

### Managing from the UI

Visit **Settings → MCP** to:

- View your MCP server's exposed tools and resources
- See connected external servers and their status
- Browse all loaded external tools
- Test individual tools with custom arguments
- Reload the MCP client (picks up config changes without restart)

### Reloading

After changing `MCP_SERVERS.json`, either:
- Click **Reload** in Settings → MCP
- Restart the server

The client will reconnect and reload all external tools.

---

## Package Export

The MCP server module is also available as an NPM export for programmatic use:

```js
import { createMcpServer } from '@harbinger-ai/harbinger/mcp';

const server = createMcpServer();
// Use with any MCP transport
```

---

## Architecture

```
External AI Client (Claude Desktop, Cursor, etc.)
    │
    ▼ POST /api/mcp (JSON-RPC)
┌──────────────────────┐
│  MCP Server          │ ◄── lib/mcp/server.js (tools, resources, prompts)
│  (Streamable HTTP)   │ ◄── lib/mcp/handler.js (HTTP handler)
└──────────────────────┘
          │
          ▼ calls existing Harbinger functions
   createJob(), chat(), discoverAgents(), etc.


┌──────────────────────┐
│  MCP Client          │ ◄── lib/mcp/client.js (MultiServerMCPClient)
│  (connects to        │ ◄── config/MCP_SERVERS.json
│   external servers)  │
└──────────────────────┘
          │
          ▼ tools injected into
   LangChain Agent tool array (lib/ai/agent.js)
```
