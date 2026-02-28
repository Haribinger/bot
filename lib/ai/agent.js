import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { SystemMessage } from '@langchain/core/messages';
import { createModel } from './model.js';
import { createJobTool, getJobStatusTool, getSystemTechnicalSpecsTool, getSkillBuildingGuideTool } from './tools.js';
import { SqliteSaver } from '@langchain/langgraph-checkpoint-sqlite';
import { eventHandlerMd, thepopebotDb } from '../paths.js';
import { render_md } from '../utils/render-md.js';
import { loadAgentProfile } from '../agents.js';

let _agent = null;

/**
 * Get or create the LangGraph agent singleton.
 * Uses createReactAgent which handles the tool loop automatically.
 * Prompt is a function so {{datetime}} resolves fresh each invocation.
 */
export async function getAgent() {
  if (!_agent) {
    const model = await createModel();
    const tools = [createJobTool, getJobStatusTool, getSystemTechnicalSpecsTool, getSkillBuildingGuideTool];
    const checkpointer = SqliteSaver.fromConnString(thepopebotDb);

    _agent = createReactAgent({
      llm: model,
      tools,
      checkpointSaver: checkpointer,
      prompt: (state) => [new SystemMessage(render_md(eventHandlerMd)), ...state.messages],
    });
  }
  return _agent;
}

/**
 * Reset the agent singleton (e.g., when config changes).
 */
export function resetAgent() {
  _agent = null;
}

// Per-profile agent instances
const _agents = new Map();

/**
 * Get or create an agent for a specific agent profile.
 * Uses the agent's SOUL.md as the system prompt instead of EVENT_HANDLER.md.
 * Falls back to getAgent() if no profile found.
 *
 * @param {string} profileName - Directory name of the agent profile (e.g. 'recon-scout')
 */
export async function getAgentForProfile(profileName) {
  if (_agents.has(profileName)) return _agents.get(profileName);

  const profile = loadAgentProfile(profileName);
  if (!profile || !profile.soul) return getAgent(); // fallback to default

  const model = await createModel();
  const tools = [createJobTool, getJobStatusTool, getSystemTechnicalSpecsTool, getSkillBuildingGuideTool];
  const checkpointer = SqliteSaver.fromConnString(thepopebotDb);

  // Build the system prompt from the agent's SOUL + optional SKILLS + TOOLS
  const systemParts = [profile.soul];
  if (profile.skills) systemParts.push('\n\n## Skills\n\n' + profile.skills);
  if (profile.tools) systemParts.push('\n\n## Tools\n\n' + profile.tools);
  const systemPrompt = systemParts.join('');

  const agent = createReactAgent({
    llm: model,
    tools,
    checkpointSaver: checkpointer,
    prompt: (state) => [new SystemMessage(systemPrompt), ...state.messages],
  });

  _agents.set(profileName, agent);
  return agent;
}

/**
 * Reset a specific profile agent (e.g., when config changes).
 */
export function resetAgentForProfile(profileName) {
  _agents.delete(profileName);
}
