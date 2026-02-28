import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull().default('admin'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const chats = sqliteTable('chats', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  title: text('title').notNull().default('New Chat'),
  starred: integer('starred').notNull().default(0),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const messages = sqliteTable('messages', {
  id: text('id').primaryKey(),
  chatId: text('chat_id').notNull(),
  role: text('role').notNull(),
  content: text('content').notNull(),
  createdAt: integer('created_at').notNull(),
});

export const notifications = sqliteTable('notifications', {
  id: text('id').primaryKey(),
  notification: text('notification').notNull(),
  payload: text('payload').notNull(),
  read: integer('read').notNull().default(0),
  createdAt: integer('created_at').notNull(),
});

export const subscriptions = sqliteTable('subscriptions', {
  id: text('id').primaryKey(),
  platform: text('platform').notNull(),
  channelId: text('channel_id').notNull(),
  createdAt: integer('created_at').notNull(),
});

export const settings = sqliteTable('settings', {
  id: text('id').primaryKey(),
  type: text('type').notNull(),
  key: text('key').notNull(),
  value: text('value').notNull(),
  createdBy: text('created_by'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

// ─────────────────────────────────────────────────────────────────────────────
// Bug Bounty
// ─────────────────────────────────────────────────────────────────────────────

export const programs = sqliteTable('programs', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  platform: text('platform').notNull().default('custom'), // hackerone, bugcrowd, intigriti, yeswehack, federacy, custom
  url: text('url'),
  scopeUrl: text('scope_url'),
  minBounty: integer('min_bounty'),
  maxBounty: integer('max_bounty'),
  status: text('status').notNull().default('active'), // active, paused, retired
  notes: text('notes'),
  syncHandle: text('sync_handle'), // platform-specific handle for synced programs
  lastSyncedAt: integer('last_synced_at'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const targets = sqliteTable('targets', {
  id: text('id').primaryKey(),
  programId: text('program_id'),
  type: text('type').notNull().default('domain'), // domain, ip, url, wildcard, api, mobile, cidr
  value: text('value').notNull(),
  status: text('status').notNull().default('in_scope'), // in_scope, out_of_scope, testing, completed
  technologies: text('technologies'), // JSON array of detected tech
  notes: text('notes'),
  lastScannedAt: integer('last_scanned_at'),
  syncSource: text('sync_source'), // hackerone, bugcrowd, intigriti, yeswehack, federacy
  syncProgramHandle: text('sync_program_handle'), // handle from synced platform
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const findings = sqliteTable('findings', {
  id: text('id').primaryKey(),
  targetId: text('target_id'),
  title: text('title').notNull(),
  severity: text('severity').notNull().default('info'), // critical, high, medium, low, info
  type: text('type').notNull(), // xss, sqli, ssrf, idor, rce, lfi, open_redirect, subdomain_takeover, info_disclosure, misconfig, etc.
  status: text('status').notNull().default('new'), // new, triaging, confirmed, reported, duplicate, resolved, bounty_paid
  description: text('description'),
  stepsToReproduce: text('steps_to_reproduce'),
  impact: text('impact'),
  evidence: text('evidence'), // JSON array of screenshot URLs or file paths
  bountyAmount: integer('bounty_amount'),
  reportUrl: text('report_url'),
  agentId: text('agent_id'), // which agent discovered this
  toolId: text('tool_id'), // which tool found it
  rawOutput: text('raw_output'), // raw tool output
  reportedAt: integer('reported_at'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

// ─────────────────────────────────────────────────────────────────────────────
// Tool Registry
// ─────────────────────────────────────────────────────────────────────────────

export const tools = sqliteTable('tools', {
  id: text('id').primaryKey(),
  catalogId: text('catalog_id'), // links to built-in catalog entry
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  category: text('category').notNull(),
  description: text('description'),
  dockerImage: text('docker_image'),
  installCmd: text('install_cmd'),
  sourceUrl: text('source_url'), // GitHub URL
  version: text('version'),
  installed: integer('installed').notNull().default(0),
  enabled: integer('enabled').notNull().default(1),
  config: text('config'), // JSON tool-specific config
  mcpServerId: text('mcp_server_id'), // if exposed via MCP
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const dockerContainers = sqliteTable('docker_containers', {
  id: text('id').primaryKey(),
  toolId: text('tool_id'),
  containerId: text('container_id'), // Docker container ID
  imageName: text('image_name').notNull(),
  status: text('status').notNull().default('created'), // created, running, stopped, error
  agentId: text('agent_id'),
  ports: text('ports'), // JSON port mapping
  env: text('env'), // JSON env vars (secrets redacted)
  logs: text('logs'),
  createdAt: integer('created_at').notNull(),
  stoppedAt: integer('stopped_at'),
});
