'use server';

import { auth } from '../auth/index.js';

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  return session.user;
}

/**
 * List all job logs (scans logs/ directory for job directories).
 */
export async function listJobLogs() {
  await requireAuth();
  try {
    const fs = await import('fs');
    const path = await import('path');
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) return [];

    const entries = fs.readdirSync(logsDir, { withFileTypes: true });
    const jobs = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const jobDir = path.join(logsDir, entry.name);
      const jobMd = path.join(jobDir, 'job.md');

      let title = '';
      let size = 0;
      let timestamp = 0;

      try {
        const stat = fs.statSync(jobDir);
        timestamp = stat.mtimeMs;
      } catch {}

      if (fs.existsSync(jobMd)) {
        try {
          const content = fs.readFileSync(jobMd, 'utf8');
          title = content.split('\n')[0]?.replace(/^#\s*/, '').slice(0, 100) || entry.name;
          size = Buffer.byteLength(content, 'utf8');
        } catch {}
      }

      // Check for session log
      const sessionFiles = fs.readdirSync(jobDir).filter(f => f.endsWith('.jsonl'));
      const totalSize = sessionFiles.reduce((sum, f) => {
        try { return sum + fs.statSync(path.join(jobDir, f)).size; } catch { return sum; }
      }, size);

      jobs.push({
        jobId: entry.name,
        title: title || entry.name,
        timestamp,
        size: totalSize,
        hasSession: sessionFiles.length > 0,
      });
    }

    // Sort newest first
    jobs.sort((a, b) => b.timestamp - a.timestamp);
    return jobs.slice(0, 100);
  } catch {
    return [];
  }
}

/**
 * Get the full log content for a specific job.
 */
export async function getJobLogs(jobId) {
  await requireAuth();
  // Validate jobId to prevent path traversal
  if (!jobId || /[\/\\]/.test(jobId)) return { prompt: '', lines: [] };

  try {
    const fs = await import('fs');
    const path = await import('path');
    const jobDir = path.join(process.cwd(), 'logs', jobId);
    if (!fs.existsSync(jobDir)) return { prompt: '', lines: [] };

    let prompt = '';
    const jobMd = path.join(jobDir, 'job.md');
    if (fs.existsSync(jobMd)) {
      prompt = fs.readFileSync(jobMd, 'utf8');
    }

    // Parse session JSONL files
    const lines = [];
    const sessionFiles = fs.readdirSync(jobDir)
      .filter(f => f.endsWith('.jsonl'))
      .sort();

    for (const sf of sessionFiles) {
      try {
        const content = fs.readFileSync(path.join(jobDir, sf), 'utf8');
        for (const line of content.split('\n')) {
          if (!line.trim()) continue;
          try {
            const entry = JSON.parse(line);
            // Format based on common JSONL log formats
            const ts = entry.timestamp || entry.ts || entry.time || '';
            const msg = entry.message || entry.content || entry.text || JSON.stringify(entry);
            const timeStr = ts ? new Date(ts).toLocaleTimeString() : '';
            lines.push(timeStr ? `[${timeStr}] ${msg}` : msg);
          } catch {
            // Raw text line
            lines.push(line);
          }
        }
      } catch {}
    }

    // If no JSONL, check for other log files
    if (lines.length === 0) {
      const otherFiles = fs.readdirSync(jobDir).filter(f => f !== 'job.md' && !f.endsWith('.jsonl'));
      for (const f of otherFiles.slice(0, 5)) {
        try {
          const content = fs.readFileSync(path.join(jobDir, f), 'utf8');
          lines.push(`--- ${f} ---`, ...content.split('\n'));
        } catch {}
      }
    }

    return { prompt, lines: lines.slice(0, 5000) };
  } catch {
    return { prompt: '', lines: [] };
  }
}
