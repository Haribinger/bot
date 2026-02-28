import { randomUUID } from 'crypto';
import { eq, desc } from 'drizzle-orm';
import { getDb } from '../db/index.js';
import { targets } from '../db/schema.js';

export function createTarget({ programId, type = 'domain', value, status = 'in_scope', notes }) {
  const db = getDb();
  const now = Date.now();
  const id = randomUUID();
  db.insert(targets).values({ id, programId, type, value, status, notes, createdAt: now, updatedAt: now }).run();
  return { id, value, type };
}

export function getTargets(programId) {
  const db = getDb();
  if (programId) return db.select().from(targets).where(eq(targets.programId, programId)).orderBy(desc(targets.updatedAt)).all();
  return db.select().from(targets).orderBy(desc(targets.updatedAt)).all();
}

export function getTargetById(id) {
  const db = getDb();
  return db.select().from(targets).where(eq(targets.id, id)).get();
}

export function updateTarget(id, data) {
  const db = getDb();
  db.update(targets).set({ ...data, updatedAt: Date.now() }).where(eq(targets.id, id)).run();
}

export function deleteTarget(id) {
  const db = getDb();
  db.delete(targets).where(eq(targets.id, id)).run();
}
