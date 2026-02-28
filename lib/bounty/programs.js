import { randomUUID } from 'crypto';
import { eq, desc } from 'drizzle-orm';
import { getDb } from '../db/index.js';
import { programs, targets } from '../db/schema.js';

export function createProgram({ name, platform = 'custom', url, scopeUrl, minBounty, maxBounty, notes }) {
  const db = getDb();
  const now = Date.now();
  const id = randomUUID();
  db.insert(programs).values({ id, name, platform, url, scopeUrl, minBounty, maxBounty, notes, status: 'active', createdAt: now, updatedAt: now }).run();
  return { id, name, platform };
}

export function getPrograms() {
  const db = getDb();
  return db.select().from(programs).orderBy(desc(programs.updatedAt)).all();
}

export function getProgramById(id) {
  const db = getDb();
  return db.select().from(programs).where(eq(programs.id, id)).get();
}

export function updateProgram(id, data) {
  const db = getDb();
  db.update(programs).set({ ...data, updatedAt: Date.now() }).where(eq(programs.id, id)).run();
}

export function deleteProgram(id) {
  const db = getDb();
  // Cascade: delete targets belonging to this program first
  db.delete(targets).where(eq(targets.programId, id)).run();
  db.delete(programs).where(eq(programs.id, id)).run();
}
