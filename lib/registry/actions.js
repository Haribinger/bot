'use server';

import { auth } from '../auth/index.js';

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  return session.user;
}

// ── Tool Catalog ─────────────────────────────────────────────────────────────

export async function getCatalog() {
  await requireAuth();
  const { TOOL_CATALOG, TOOL_CATEGORIES } = await import('./catalog.js');
  return { tools: TOOL_CATALOG, categories: TOOL_CATEGORIES };
}

export async function searchCatalog(query) {
  await requireAuth();
  const { searchCatalog: search } = await import('./catalog.js');
  return search(query);
}

// ── Installed Tools ──────────────────────────────────────────────────────────

export async function getInstalledTools() {
  await requireAuth();
  const { getInstalledTools: dbGet } = await import('./tools.js');
  return dbGet();
}

export async function installTool(catalogId) {
  await requireAuth();
  const { TOOL_CATALOG } = await import('./catalog.js');
  const { installTool: dbInstall, getToolBySlug } = await import('./tools.js');

  const catalogEntry = TOOL_CATALOG.find(t => t.id === catalogId);
  if (!catalogEntry) return { error: 'Tool not found in catalog' };

  const existing = getToolBySlug(catalogEntry.id);
  if (existing) return { error: 'Tool already installed' };

  return dbInstall({
    catalogId: catalogEntry.id,
    name: catalogEntry.name,
    slug: catalogEntry.id,
    category: catalogEntry.category,
    description: catalogEntry.description,
    dockerImage: catalogEntry.dockerImage || null,
    installCmd: catalogEntry.installCmd || null,
    sourceUrl: catalogEntry.sourceUrl || null,
  });
}

export async function installCustomTool(data) {
  await requireAuth();
  const { installTool: dbInstall, getToolBySlug } = await import('./tools.js');

  if (!data.name || !data.slug || !data.category) return { error: 'Name, slug, and category are required' };

  const existing = getToolBySlug(data.slug);
  if (existing) return { error: 'Tool with this slug already exists' };

  return dbInstall(data);
}

export async function uninstallTool(id) {
  await requireAuth();
  const { uninstallTool: dbUninstall } = await import('./tools.js');
  dbUninstall(id);
  return { success: true };
}

export async function toggleTool(id) {
  await requireAuth();
  const { toggleTool: dbToggle } = await import('./tools.js');
  const enabled = dbToggle(id);
  return { success: true, enabled };
}

// ── Docker Containers ────────────────────────────────────────────────────────

export async function getContainers() {
  await requireAuth();
  const { getContainers: dbGet } = await import('./tools.js');
  return dbGet();
}

export async function spawnContainer(toolId, options = {}) {
  await requireAuth();
  const { getToolById, createContainer } = await import('./tools.js');

  const tool = getToolById(toolId);
  if (!tool) return { error: 'Tool not found' };
  if (!tool.dockerImage) return { error: 'Tool has no Docker image configured' };

  // Create container record with pending status — actual Docker spawn is triggered
  // by the agent/job system when it picks up the pending container
  const container = createContainer({
    toolId,
    containerId: `pending-${Date.now()}`,
    imageName: tool.dockerImage,
    agentId: options.agentId || null,
    ports: options.ports || null,
    env: options.env || null,
  });

  return { success: true, container };
}

export async function stopContainer(id) {
  await requireAuth();
  const { stopContainer: dbStop } = await import('./tools.js');
  dbStop(id);
  return { success: true };
}

// ── GitHub Tool Installer ────────────────────────────────────────────────────

export async function installFromGithub(githubUrl) {
  await requireAuth();

  // Validate and parse GitHub URL strictly
  let parsedUrl;
  try {
    parsedUrl = new URL(githubUrl);
    if (parsedUrl.hostname !== 'github.com') return { error: 'Only github.com URLs are supported' };
  } catch {
    return { error: 'Invalid URL format' };
  }

  const parts = parsedUrl.pathname.split('/').filter(Boolean);
  if (parts.length < 2) return { error: 'Invalid GitHub URL — expected github.com/owner/repo' };

  const [owner, repo] = parts;
  const cleanOwner = owner.replace(/[^a-zA-Z0-9_.-]/g, '');
  const cleanRepo = repo.replace(/[^a-zA-Z0-9_.-]/g, '').replace(/\.git$/, '');
  if (!cleanOwner || !cleanRepo) return { error: 'Invalid owner or repo name' };
  const slug = cleanRepo.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const safeUrl = `https://github.com/${cleanOwner}/${cleanRepo}`;

  const { getToolBySlug, installTool: dbInstall } = await import('./tools.js');
  const existing = getToolBySlug(slug);
  if (existing) return { error: 'Tool already installed' };

  // Fetch repo metadata from GitHub API
  let repoData = {};
  try {
    const res = await fetch(`https://api.github.com/repos/${cleanOwner}/${cleanRepo}`, {
      headers: process.env.GH_TOKEN ? { Authorization: `Bearer ${process.env.GH_TOKEN}` } : {},
    });
    if (res.ok) repoData = await res.json();
  } catch {}

  return dbInstall({
    name: repoData.name || cleanRepo,
    slug,
    category: 'custom',
    description: repoData.description || `Installed from ${safeUrl}`,
    sourceUrl: safeUrl,
    installCmd: `git clone ${safeUrl}`,
  });
}
