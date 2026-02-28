# Shared Agent Infrastructure

The runtime implementations for agent infrastructure live in the main package:

| Feature | Location | Description |
|---------|----------|-------------|
| **Model Router** | `lib/ai/model-router.js` | SmartModelRouter — complexity-based model selection |
| **Autonomous Engine** | `lib/ai/autonomous-engine.js` | Background thinking loop (enabled via `AUTONOMOUS_THINKING=true`) |
| **Agent Discovery** | `lib/agents.js` | Discovers and loads agent profiles from `agents/` directories |
| **Agent Runtime** | `lib/ai/agent.js` | LangGraph agent with tool use and memory checkpointing |

Agent profiles in `agents/{name}/` provide identity, personality, and skill documentation.
The runtime code in `lib/` provides the actual execution engine.
