import { sqliteTable, AnySQLiteColumn, text, integer, uniqueIndex } from "drizzle-orm/sqlite-core"
  import { sql } from "drizzle-orm"

export const programs = sqliteTable("programs", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	platform: text().default("custom").notNull(),
	url: text(),
	scopeUrl: text("scope_url"),
	minBounty: integer("min_bounty"),
	maxBounty: integer("max_bounty"),
	status: text().default("active").notNull(),
	notes: text(),
	createdAt: integer("created_at").notNull(),
	updatedAt: integer("updated_at").notNull(),
	syncHandle: text("sync_handle"),
	lastSyncedAt: integer("last_synced_at"),
});

export const targets = sqliteTable("targets", {
	id: text().primaryKey().notNull(),
	programId: text("program_id"),
	type: text().default("domain").notNull(),
	value: text().notNull(),
	status: text().default("in_scope").notNull(),
	technologies: text(),
	notes: text(),
	lastScannedAt: integer("last_scanned_at"),
	createdAt: integer("created_at").notNull(),
	updatedAt: integer("updated_at").notNull(),
	syncSource: text("sync_source"),
	syncProgramHandle: text("sync_program_handle"),
});

export const findings = sqliteTable("findings", {
	id: text().primaryKey().notNull(),
	targetId: text("target_id"),
	title: text().notNull(),
	severity: text().default("info").notNull(),
	type: text().notNull(),
	status: text().default("new").notNull(),
	description: text(),
	stepsToReproduce: text("steps_to_reproduce"),
	impact: text(),
	evidence: text(),
	bountyAmount: integer("bounty_amount"),
	reportUrl: text("report_url"),
	agentId: text("agent_id"),
	toolId: text("tool_id"),
	rawOutput: text("raw_output"),
	reportedAt: integer("reported_at"),
	createdAt: integer("created_at").notNull(),
	updatedAt: integer("updated_at").notNull(),
});

export const tools = sqliteTable("tools", {
	id: text().primaryKey().notNull(),
	catalogId: text("catalog_id"),
	name: text().notNull(),
	slug: text().notNull(),
	category: text().notNull(),
	description: text(),
	dockerImage: text("docker_image"),
	installCmd: text("install_cmd"),
	sourceUrl: text("source_url"),
	version: text(),
	installed: integer().default(0).notNull(),
	enabled: integer().default(1).notNull(),
	config: text(),
	mcpServerId: text("mcp_server_id"),
	createdAt: integer("created_at").notNull(),
	updatedAt: integer("updated_at").notNull(),
},
(table) => [
	uniqueIndex("tools_slug_unique").on(table.slug),
]);

export const dockerContainers = sqliteTable("docker_containers", {
	id: text().primaryKey().notNull(),
	toolId: text("tool_id"),
	containerId: text("container_id"),
	imageName: text("image_name").notNull(),
	status: text().default("created").notNull(),
	agentId: text("agent_id"),
	ports: text(),
	env: text(),
	logs: text(),
	createdAt: integer("created_at").notNull(),
	stoppedAt: integer("stopped_at"),
});

export const chats = sqliteTable("chats", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	title: text().default("New Chat").notNull(),
	starred: integer().default(0).notNull(),
	createdAt: integer("created_at").notNull(),
	updatedAt: integer("updated_at").notNull(),
});

export const messages = sqliteTable("messages", {
	id: text().primaryKey().notNull(),
	chatId: text("chat_id").notNull(),
	role: text().notNull(),
	content: text().notNull(),
	createdAt: integer("created_at").notNull(),
});

export const notifications = sqliteTable("notifications", {
	id: text().primaryKey().notNull(),
	notification: text().notNull(),
	payload: text().notNull(),
	read: integer().default(0).notNull(),
	createdAt: integer("created_at").notNull(),
});

export const settings = sqliteTable("settings", {
	id: text().primaryKey().notNull(),
	type: text().notNull(),
	key: text().notNull(),
	value: text().notNull(),
	createdBy: text("created_by"),
	createdAt: integer("created_at").notNull(),
	updatedAt: integer("updated_at").notNull(),
});

export const subscriptions = sqliteTable("subscriptions", {
	id: text().primaryKey().notNull(),
	platform: text().notNull(),
	channelId: text("channel_id").notNull(),
	createdAt: integer("created_at").notNull(),
});

export const users = sqliteTable("users", {
	id: text().primaryKey().notNull(),
	email: text().notNull(),
	passwordHash: text("password_hash").notNull(),
	role: text().default("admin").notNull(),
	createdAt: integer("created_at").notNull(),
	updatedAt: integer("updated_at").notNull(),
},
(table) => [
	uniqueIndex("users_email_unique").on(table.email),
]);

