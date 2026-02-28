import { randomUUID } from 'crypto';
import { eq, desc } from 'drizzle-orm';
import { getDb } from '../db/index.js';
import { tools, dockerContainers } from '../db/schema.js';

export function installTool({ catalogId, name, slug, category, description, dockerImage, installCmd, sourceUrl, version }) {
  const db = getDb();
  const now = Date.now();
  const id = randomUUID();
  db.insert(tools).values({ id, catalogId, name, slug, category, description, dockerImage, installCmd, sourceUrl, version, installed: 1, enabled: 1, createdAt: now, updatedAt: now }).run();
  return { id, name, slug };
}

export function getInstalledTools() {
  const db = getDb();
  return db.select().from(tools).orderBy(tools.category).all();
}

export function getToolBySlug(slug) {
  const db = getDb();
  return db.select().from(tools).where(eq(tools.slug, slug)).get();
}

export function getToolById(id) {
  const db = getDb();
  return db.select().from(tools).where(eq(tools.id, id)).get();
}

export function updateTool(id, data) {
  const db = getDb();
  db.update(tools).set({ ...data, updatedAt: Date.now() }).where(eq(tools.id, id)).run();
}

export function uninstallTool(id) {
  const db = getDb();
  db.delete(tools).where(eq(tools.id, id)).run();
}

export function toggleTool(id) {
  const db = getDb();
  const tool = db.select().from(tools).where(eq(tools.id, id)).get();
  if (!tool) return null;
  const enabled = tool.enabled ? 0 : 1;
  db.update(tools).set({ enabled, updatedAt: Date.now() }).where(eq(tools.id, id)).run();
  return enabled;
}

// ── Docker Containers ──────────────────────────────────────────────────────

export function createContainer({ toolId, containerId, imageName, agentId, ports, env }) {
  const db = getDb();
  const now = Date.now();
  const id = randomUUID();
  db.insert(dockerContainers).values({ id, toolId, containerId, imageName, status: 'pending', agentId, ports: ports ? JSON.stringify(ports) : null, env: env ? JSON.stringify(env) : null, createdAt: now }).run();
  return { id, containerId };
}

export function getContainers() {
  const db = getDb();
  return db.select().from(dockerContainers).orderBy(desc(dockerContainers.createdAt)).all();
}

export function updateContainer(id, data) {
  const db = getDb();
  db.update(dockerContainers).set(data).where(eq(dockerContainers.id, id)).run();
}

export function stopContainer(id) {
  const db = getDb();
  db.update(dockerContainers).set({ status: 'stopped', stoppedAt: Date.now() }).where(eq(dockerContainers.id, id)).run();
}
