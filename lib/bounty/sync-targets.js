import { randomUUID } from 'crypto';
import { eq, and, isNotNull, sql, inArray } from 'drizzle-orm';
import { getDb } from '../db/index.js';
import { programs, targets } from '../db/schema.js';

const BASE_URL = 'https://raw.githubusercontent.com/arkadiyt/bounty-targets-data/master/data';

const PLATFORM_CONFIGS = {
  hackerone: {
    url: `${BASE_URL}/hackerone_data.json`,
    parseProgramName: (p) => p.name,
    parseProgramHandle: (p) => p.handle,
    parseProgramUrl: (p) => `https://hackerone.com/${p.handle}`,
    parseMaxBounty: (p) => {
      const amounts = (p.targets?.in_scope || []).map(t => t.max_severity_bounty || 0);
      return amounts.length > 0 ? Math.max(...amounts) : null;
    },
    parseTargets: (p) => (p.targets?.in_scope || []).map(t => ({
      type: mapAssetType(t.asset_type),
      value: t.asset_identifier,
    })),
  },
  bugcrowd: {
    url: `${BASE_URL}/bugcrowd_data.json`,
    parseProgramName: (p) => p.name,
    parseProgramHandle: (p) => p.code || slugify(p.name),
    parseProgramUrl: (p) => p.url || `https://bugcrowd.com/${p.code}`,
    parseMaxBounty: (p) => p.max_payout || null,
    parseTargets: (p) => (p.targets?.in_scope || p.target_groups || []).flatMap(g => {
      if (g.targets) return g.targets.map(t => ({ type: mapAssetType(t.type || t.category), value: t.name || t.uri }));
      return [{ type: mapAssetType(g.type || g.category), value: g.name || g.uri }];
    }),
  },
  intigriti: {
    url: `${BASE_URL}/intigriti_data.json`,
    parseProgramName: (p) => p.name,
    parseProgramHandle: (p) => p.company_handle || p.handle || slugify(p.name),
    parseProgramUrl: (p) => p.url || `https://app.intigriti.com/programs/${p.company_handle}`,
    parseMaxBounty: (p) => p.max_bounty || null,
    parseTargets: (p) => (p.targets?.in_scope || []).map(t => ({
      type: mapAssetType(t.type),
      value: t.endpoint || t.description,
    })),
  },
  yeswehack: {
    url: `${BASE_URL}/yeswehack_data.json`,
    parseProgramName: (p) => p.title || p.name,
    parseProgramHandle: (p) => p.slug || slugify(p.title || p.name || ''),
    parseProgramUrl: (p) => p.url || `https://yeswehack.com/programs/${p.slug}`,
    parseMaxBounty: (p) => p.max_bounty || null,
    parseTargets: (p) => (p.targets || p.scopes || []).map(t => ({
      type: mapAssetType(t.type || t.scope_type),
      value: t.target || t.scope,
    })),
  },
  federacy: {
    url: `${BASE_URL}/federacy_data.json`,
    parseProgramName: (p) => p.name,
    parseProgramHandle: (p) => p.slug || slugify(p.name),
    parseProgramUrl: (p) => p.url || `https://federacy.com/programs/${p.slug}`,
    parseMaxBounty: (p) => p.max_bounty || null,
    parseTargets: (p) => (p.targets || p.scope || []).map(t => ({
      type: mapAssetType(typeof t === 'string' ? 'url' : t.type),
      value: typeof t === 'string' ? t : t.target || t.url,
    })),
  },
};

function slugify(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '');
}

// Map platform asset type strings to our target types.
// Uses exact matches for short strings to avoid false positives (e.g. 'ip' matching 'script').
const ASSET_TYPE_MAP = {
  'url': 'domain', 'website': 'domain', 'domain': 'domain', 'web': 'domain',
  'wildcard': 'wildcard',
  'ip_address': 'ip', 'ip': 'ip',
  'cidr': 'cidr',
  'api': 'api', 'endpoint': 'api',
  'mobile': 'mobile', 'android': 'mobile', 'ios': 'mobile',
  'other': 'domain',
};

function mapAssetType(raw) {
  if (!raw) return 'domain';
  const lower = ('' + raw).toLowerCase().trim();
  // Exact match first
  if (ASSET_TYPE_MAP[lower]) return ASSET_TYPE_MAP[lower];
  // Substring matches for compound types like "Android App"
  if (lower.includes('wildcard') || lower.includes('*.')) return 'wildcard';
  if (lower.includes('android') || lower.includes('ios') || lower.includes('mobile')) return 'mobile';
  if (lower.includes('cidr')) return 'cidr';
  if (lower.includes('api')) return 'api';
  return 'domain';
}

async function fetchPlatformData(platform) {
  const config = PLATFORM_CONFIGS[platform];
  if (!config) throw new Error(`Unknown platform: ${platform}`);

  const response = await fetch(config.url);
  if (!response.ok) throw new Error(`Failed to fetch ${platform} data: ${response.status}`);
  return response.json();
}

/**
 * Sync targets from a specific platform's bounty-targets-data.
 * Pre-fetches existing programs/targets to avoid N+1 queries.
 */
export async function syncPlatform(platform, options = {}) {
  const config = PLATFORM_CONFIGS[platform];
  if (!config) throw new Error(`Unknown platform: ${platform}`);

  const db = getDb();
  const now = Date.now();
  const stats = { programsAdded: 0, programsUpdated: 0, targetsAdded: 0, targetsSkipped: 0, errors: [] };
  const maxPrograms = options.maxPrograms || 0;

  let data;
  try {
    data = await fetchPlatformData(platform);
  } catch (err) {
    stats.errors.push(`Fetch failed: ${err.message}`);
    return stats;
  }

  if (!Array.isArray(data)) {
    stats.errors.push(`Expected array, got ${typeof data}`);
    return stats;
  }

  const programsToSync = maxPrograms > 0 ? data.slice(0, maxPrograms) : data;

  // Bulk-prefetch existing programs for this platform (avoids N+1)
  const existingPrograms = db.select().from(programs)
    .where(eq(programs.platform, platform)).all();
  const programByHandle = new Map(existingPrograms.map(p => [p.syncHandle, p]));

  // Bulk-prefetch existing target keys for all programs on this platform
  const programIds = existingPrograms.map(p => p.id);
  const existingTargetRows = programIds.length > 0
    ? db.select({ programId: targets.programId, type: targets.type, value: targets.value })
        .from(targets)
        .where(inArray(targets.programId, programIds))
        .all()
    : [];
  const existingTargetKeys = new Set(existingTargetRows.map(t => `${t.programId}:${t.type}:${t.value}`));

  for (const entry of programsToSync) {
    try {
      const handle = config.parseProgramHandle(entry);
      const name = config.parseProgramName(entry);
      if (!handle || !name) continue;

      let program = programByHandle.get(handle);

      if (program) {
        db.update(programs).set({
          name,
          url: config.parseProgramUrl(entry),
          maxBounty: config.parseMaxBounty(entry),
          lastSyncedAt: now,
          updatedAt: now,
        }).where(eq(programs.id, program.id)).run();
        stats.programsUpdated++;
      } else {
        const programId = randomUUID();
        db.insert(programs).values({
          id: programId,
          name,
          platform,
          url: config.parseProgramUrl(entry),
          maxBounty: config.parseMaxBounty(entry),
          syncHandle: handle,
          lastSyncedAt: now,
          status: 'active',
          createdAt: now,
          updatedAt: now,
        }).run();
        program = { id: programId };
        programByHandle.set(handle, program);
        stats.programsAdded++;
      }

      // Sync targets
      const parsedTargets = config.parseTargets(entry);
      for (const t of parsedTargets) {
        if (!t.value) continue;
        const key = `${program.id}:${t.type}:${t.value}`;
        if (existingTargetKeys.has(key)) {
          stats.targetsSkipped++;
          continue;
        }
        db.insert(targets).values({
          id: randomUUID(),
          programId: program.id,
          type: t.type,
          value: t.value,
          status: 'in_scope',
          syncSource: platform,
          syncProgramHandle: handle,
          createdAt: now,
          updatedAt: now,
        }).run();
        existingTargetKeys.add(key); // prevent duplicates within this sync
        stats.targetsAdded++;
      }
    } catch (err) {
      stats.errors.push(`${config.parseProgramName(entry) || 'unknown'}: ${err.message}`);
    }
  }

  return stats;
}

/**
 * Sync all platforms in parallel. Returns combined stats per platform.
 */
export async function syncAllPlatforms(options = {}) {
  const platforms = options.platforms || Object.keys(PLATFORM_CONFIGS);
  const entries = await Promise.allSettled(
    platforms.map(p => syncPlatform(p, options).then(stats => [p, stats]))
  );
  const results = {};
  for (const entry of entries) {
    if (entry.status === 'fulfilled') {
      const [p, stats] = entry.value;
      results[p] = stats;
    } else {
      // Extract platform name from error if possible
      results[entry.reason?.message || 'unknown'] = { programsAdded: 0, programsUpdated: 0, targetsAdded: 0, targetsSkipped: 0, errors: [entry.reason?.message || 'Unknown error'] };
    }
  }
  return results;
}

/**
 * Get sync status summary using SQL aggregation.
 */
export function getSyncStatus() {
  const db = getDb();
  const rows = db.select({
    platform: programs.platform,
    count: sql`count(*)`,
    lastSync: sql`max(last_synced_at)`,
  }).from(programs)
    .where(isNotNull(programs.syncHandle))
    .groupBy(programs.platform)
    .all();

  const platformCounts = {};
  let totalSyncedPrograms = 0;
  let lastSyncedAt = 0;
  for (const r of rows) {
    platformCounts[r.platform] = Number(r.count);
    totalSyncedPrograms += Number(r.count);
    lastSyncedAt = Math.max(lastSyncedAt, Number(r.lastSync) || 0);
  }

  return {
    totalSyncedPrograms,
    platformCounts,
    lastSyncedAt: lastSyncedAt || null,
    availablePlatforms: Object.keys(PLATFORM_CONFIGS),
  };
}
