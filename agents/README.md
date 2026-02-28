# Harbinger Agent System

The Harbinger framework provides a system of customizable agent profiles, each with a distinct identity, personality, and skill set. Agents can be routed to via `@mentions` in chat or selected explicitly via the MCP `chat` tool.

## How Agent Selection Works

In chat (web UI, Telegram, or MCP), prefix your message with `@CODENAME` to route to a specific agent:

```
@PATHFINDER enumerate subdomains for example.com
@BREACH test the login form for SQL injection
@SAM refactor the authentication module
```

The system matches against agent codenames, directory names, and display names (case-insensitive). If no match is found, the default event handler agent is used.

Via MCP, pass the `agent_id` parameter to the `chat` tool:

```json
{ "thread_id": "abc", "message": "scan for open ports", "agent_id": "recon-scout" }
```

## Agent Profiles

Each agent profile directory contains:

| File | Purpose |
|------|---------|
| **SOUL.md** | Core personality, communication style, and system prompt |
| **IDENTITY.md** | Name, codename, role, and specialization |
| **CONFIG.yaml** | Model, temperature, Docker image, handoff rules |
| **SKILLS.md** | Techniques, methodologies, and knowledge domains |
| **TOOLS.md** | Command-line tools and APIs the agent is proficient with |
| **HEARTBEAT.md** | Health check template |

### Available Agents

| Codename | Name | Role |
|----------|------|------|
| SPECTER | OSINT Detective | Open-source intelligence gathering |
| SAM | Coding Assistant | Code generation, review, debugging |
| SAGE | Learning Agent | Workflow optimization |
| PATHFINDER | Recon Scout | Attack surface discovery |
| BREACH | Web Hacker | Web vulnerability discovery |
| PHANTOM | Cloud Infiltrator | Cloud security assessment |
| CIPHER | Binary Reverser | Binary analysis, reverse engineering |
| SCRIBE | Report Writer | Vulnerability report generation |
| LENS | Browser Agent | Browser automation via CDP |
| MAINTAINER | Code Quality | Nightly code quality enforcement |
| BRIEF | Morning Brief | Automated daily reporting |

## Implementation Status

Agent profiles provide **personality and knowledge context** when selected. The SOUL.md becomes the system prompt, and SKILLS.md + TOOLS.md are appended as context.

The runtime agent engine (`lib/ai/agent.js`) provides:
- LangGraph agent with tool use and SQLite checkpointing
- 4 built-in tools: `create_job`, `get_job_status`, `get_system_technical_specs`, `get_skill_building_guide`
- External MCP tools (from `config/MCP_SERVERS.json`)

Agent-specific Docker containers and direct tool execution (e.g., running `nuclei` or `subfinder`) are planned for future releases. Currently, agents can instruct jobs to use these tools via the Docker agent container.

## Creating a Custom Agent

1. Copy `agents/_template/` to `agents/my-agent/`
2. Edit all `.md` and `.yaml` files to define your agent's identity
3. The agent is auto-discovered at startup and available via `@MY_AGENT_CODENAME`

## Runtime Infrastructure

| Component | Location | Description |
|-----------|----------|-------------|
| Agent Discovery | `lib/agents.js` | Scans `agents/` for profiles |
| Agent Runtime | `lib/ai/agent.js` | LangGraph agent with profile-specific system prompts |
| Model Router | `lib/ai/model-router.js` | Complexity-based model selection |
| Autonomous Engine | `lib/ai/autonomous-engine.js` | Background thinking loop (opt-in) |
