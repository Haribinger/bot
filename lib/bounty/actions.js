'use server';

import { auth } from '../auth/index.js';

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  return session.user;
}

// ── Programs ─────────────────────────────────────────────────────────────────

export async function getPrograms() {
  await requireAuth();
  const { getPrograms: dbGet } = await import('./programs.js');
  return dbGet();
}

export async function createProgram(data) {
  await requireAuth();
  const { createProgram: dbCreate } = await import('./programs.js');
  return dbCreate(data);
}

export async function updateProgram(id, data) {
  await requireAuth();
  const { updateProgram: dbUpdate } = await import('./programs.js');
  dbUpdate(id, data);
  return { success: true };
}

export async function deleteProgram(id) {
  await requireAuth();
  const { deleteProgram: dbDelete } = await import('./programs.js');
  dbDelete(id);
  return { success: true };
}

// ── Targets ──────────────────────────────────────────────────────────────────

export async function getTargets(programId) {
  await requireAuth();
  const { getTargets: dbGet } = await import('./targets.js');
  return dbGet(programId);
}

export async function createTarget(data) {
  await requireAuth();
  const { createTarget: dbCreate } = await import('./targets.js');
  return dbCreate(data);
}

export async function updateTarget(id, data) {
  await requireAuth();
  const { updateTarget: dbUpdate } = await import('./targets.js');
  dbUpdate(id, data);
  return { success: true };
}

export async function deleteTarget(id) {
  await requireAuth();
  const { deleteTarget: dbDelete } = await import('./targets.js');
  dbDelete(id);
  return { success: true };
}

// ── Findings ─────────────────────────────────────────────────────────────────

export async function getFindings(filters) {
  await requireAuth();
  const { getFindings: dbGet } = await import('./findings.js');
  return dbGet(filters);
}

export async function createFinding(data) {
  await requireAuth();
  const { createFinding: dbCreate } = await import('./findings.js');
  return dbCreate(data);
}

export async function updateFinding(id, data) {
  await requireAuth();
  const { updateFinding: dbUpdate } = await import('./findings.js');
  dbUpdate(id, data);
  return { success: true };
}

export async function deleteFinding(id) {
  await requireAuth();
  const { deleteFinding: dbDelete } = await import('./findings.js');
  dbDelete(id);
  return { success: true };
}

export async function getFindingCounts() {
  await requireAuth();
  const { getFindingCounts: dbCounts } = await import('./findings.js');
  return dbCounts();
}

// ── Target Sync ─────────────────────────────────────────────────────────────

export async function syncTargetsFromPlatform(platform, options = {}) {
  await requireAuth();
  const { syncPlatform } = await import('./sync-targets.js');
  return syncPlatform(platform, options);
}

export async function syncAllTargets(options = {}) {
  await requireAuth();
  const { syncAllPlatforms } = await import('./sync-targets.js');
  return syncAllPlatforms(options);
}

export async function getSyncStatus() {
  await requireAuth();
  const { getSyncStatus: getStatus } = await import('./sync-targets.js');
  return getStatus();
}
