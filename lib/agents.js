import fs from 'fs';
import path from 'path';
import { agentsDir } from './paths.js';

const SKIP_DIRS = ['shared', '_template', 'node_modules'];

/**
 * Parse flat YAML (key: value per line, simple arrays with [a, b]).
 * No external yaml dependency needed — CONFIG.yaml files are flat key-value.
 */
function parseSimpleYaml(content) {
  const result = {};
  for (const line of content.split('\n')) {
    const trimmed = line.split('#')[0].trim(); // strip comments
    if (!trimmed || trimmed.startsWith('-')) continue;

    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) continue;

    const key = trimmed.slice(0, colonIdx).trim();
    let value = trimmed.slice(colonIdx + 1).trim();

    // Parse arrays: [a, b, c]
    if (value.startsWith('[') && value.endsWith(']')) {
      value = value.slice(1, -1).split(',').map(v => v.trim()).filter(Boolean);
    }
    // Parse numbers
    else if (/^\d+(\.\d+)?$/.test(value)) {
      value = parseFloat(value);
    }
    // Parse booleans
    else if (value === 'true') value = true;
    else if (value === 'false') value = false;

    result[key] = value;
  }
  return result;
}

/**
 * Parse IDENTITY.md into structured fields.
 * Supports multiple formats:
 * - Single-line: "Name: X. Codename: Y. Role: Z. Specialization: W."
 * - Multi-line: "Name: X\nCodename: Y\nRole: Z\n..."
 * - Markdown: "**Codename:** X\n**Role:** Y\n..."
 */
function parseIdentity(content) {
  const identity = {};
  const text = content.trim();
  const fields = ['name', 'codename', 'role', 'specialization'];

  // Extract each field by scanning the full text with a regex
  // This handles both single-line ("Name: X. Codename: Y.") and multi-line formats
  for (const field of fields) {
    // Match "Field: value" or "**Field:** value" (case-insensitive)
    // Value ends at next field label, period-space-capital, newline, or end of string
    const pattern = new RegExp(
      `\\*{0,2}${field}\\*{0,2}[:\\s]+\\s*(.+?)(?=\\s*\\.\\s*(?:Name|Codename|Role|Specialization)\\b|\\n|$)`,
      'i'
    );
    const match = text.match(pattern);
    if (match) {
      identity[field] = match[1].trim().replace(/\.$/, '').replace(/^\*+\s*/, '').replace(/\s*\*+$/, '');
    }
  }

  // Fallback for markdown title: "# MAINTAINER — Code Quality Specialist"
  if (!identity.codename) {
    const titleMatch = text.match(/^#\s+(\w+)\s+[—–-]\s+(.+)/m);
    if (titleMatch) {
      identity.codename = titleMatch[1].trim();
      if (!identity.role) identity.role = titleMatch[2].trim();
    }
  }

  return identity;
}

/**
 * Load a single agent profile by directory name.
 * Returns null if the directory doesn't exist or is invalid.
 */
export function loadAgentProfile(agentDirName) {
  const agentPath = path.join(agentsDir, agentDirName);

  if (!fs.existsSync(agentPath)) return null;
  const stat = fs.statSync(agentPath);
  if (!stat.isDirectory()) return null;

  const profile = { id: agentDirName };

  // IDENTITY.md
  const identityPath = path.join(agentPath, 'IDENTITY.md');
  if (fs.existsSync(identityPath)) {
    const identityContent = fs.readFileSync(identityPath, 'utf8');
    Object.assign(profile, parseIdentity(identityContent));
  }

  // CONFIG.yaml
  const configPath = path.join(agentPath, 'CONFIG.yaml');
  if (fs.existsSync(configPath)) {
    const configContent = fs.readFileSync(configPath, 'utf8');
    profile.config = parseSimpleYaml(configContent);
  }

  // SOUL.md (raw content — used as system prompt)
  const soulPath = path.join(agentPath, 'SOUL.md');
  if (fs.existsSync(soulPath)) {
    profile.soul = fs.readFileSync(soulPath, 'utf8');
  }

  // SKILLS.md
  const skillsPath = path.join(agentPath, 'SKILLS.md');
  if (fs.existsSync(skillsPath)) {
    profile.skills = fs.readFileSync(skillsPath, 'utf8');
  }

  // TOOLS.md
  const toolsPath = path.join(agentPath, 'TOOLS.md');
  if (fs.existsSync(toolsPath)) {
    profile.tools = fs.readFileSync(toolsPath, 'utf8');
  }

  // HEARTBEAT.md
  const heartbeatPath = path.join(agentPath, 'HEARTBEAT.md');
  if (fs.existsSync(heartbeatPath)) {
    profile.heartbeat = fs.readFileSync(heartbeatPath, 'utf8');
  }

  return profile;
}

/**
 * Discover all agent profiles from agents/ directory.
 * Returns array of profile objects with id, name, codename, role, etc.
 */
export function discoverAgents() {
  if (!fs.existsSync(agentsDir)) return [];

  const entries = fs.readdirSync(agentsDir, { withFileTypes: true });
  const agents = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (SKIP_DIRS.includes(entry.name)) continue;

    const profile = loadAgentProfile(entry.name);
    if (profile) agents.push(profile);
  }

  return agents;
}

/**
 * Get a bullet-list summary of all discovered agents (for {{agents}} variable).
 */
export function loadAgentDescriptions() {
  const agents = discoverAgents();
  if (agents.length === 0) return 'No agent profiles configured.';

  return agents.map(a => {
    const name = a.codename || a.name || a.id;
    const role = a.role || 'general';
    return `- **${name}**: ${role}`;
  }).join('\n');
}
