import { randomUUID } from 'crypto';
import { eq, and, desc, sql } from 'drizzle-orm';
import { getDb } from '../db/index.js';
import { findings } from '../db/schema.js';

export function createFinding({ targetId, title, severity = 'info', type, description, stepsToReproduce, impact, agentId, toolId, rawOutput }) {
  const db = getDb();
  const now = Date.now();
  const id = randomUUID();
  db.insert(findings).values({ id, targetId, title, severity, type, status: 'new', description, stepsToReproduce, impact, agentId, toolId, rawOutput, createdAt: now, updatedAt: now }).run();
  return { id, title, severity };
}

export function getFindings(filters = {}) {
  const db = getDb();
  const conditions = [];
  if (filters.targetId) conditions.push(eq(findings.targetId, filters.targetId));
  if (filters.severity) conditions.push(eq(findings.severity, filters.severity));
  if (filters.status) conditions.push(eq(findings.status, filters.status));
  let query = db.select().from(findings);
  if (conditions.length > 0) query = query.where(and(...conditions));
  return query.orderBy(desc(findings.createdAt)).all();
}

export function getFindingById(id) {
  const db = getDb();
  return db.select().from(findings).where(eq(findings.id, id)).get();
}

export function updateFinding(id, data) {
  const db = getDb();
  db.update(findings).set({ ...data, updatedAt: Date.now() }).where(eq(findings.id, id)).run();
}

export function deleteFinding(id) {
  const db = getDb();
  db.delete(findings).where(eq(findings.id, id)).run();
}

export function getFindingCounts() {
  const db = getDb();
  const [row] = db.select({
    total: sql`count(*)`,
    critical: sql`sum(case when severity='critical' then 1 else 0 end)`,
    high: sql`sum(case when severity='high' then 1 else 0 end)`,
    medium: sql`sum(case when severity='medium' then 1 else 0 end)`,
    low: sql`sum(case when severity='low' then 1 else 0 end)`,
    info: sql`sum(case when severity='info' then 1 else 0 end)`,
    confirmed: sql`sum(case when status='confirmed' then 1 else 0 end)`,
    reported: sql`sum(case when status='reported' then 1 else 0 end)`,
    totalBounty: sql`coalesce(sum(bounty_amount), 0)`,
  }).from(findings).all();
  return {
    total: Number(row.total) || 0,
    critical: Number(row.critical) || 0,
    high: Number(row.high) || 0,
    medium: Number(row.medium) || 0,
    low: Number(row.low) || 0,
    info: Number(row.info) || 0,
    confirmed: Number(row.confirmed) || 0,
    reported: Number(row.reported) || 0,
    totalBounty: Number(row.totalBounty) || 0,
  };
}
