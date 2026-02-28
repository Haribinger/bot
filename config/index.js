/**
 * Next.js config wrapper for Harbinger.
 * Enables instrumentation hook for cron scheduling on server start.
 *
 * Usage in user's next.config.mjs:
 *   import { withHarbinger } from '@harbinger-ai/harbinger/config';
 *   export default withHarbinger({});
 *
 * Legacy alias also available:
 *   import { withThepopebot } from '@harbinger-ai/harbinger/config';
 *
 * @param {Object} nextConfig - User's Next.js config
 * @returns {Object} Enhanced Next.js config
 */
export const withHarbinger = withThepopebot;

export function withThepopebot(nextConfig = {}) {
  return {
    ...nextConfig,
    distDir: process.env.NEXT_BUILD_DIR || '.next',
    serverExternalPackages: [
      ...(nextConfig.serverExternalPackages || []),
      'better-sqlite3',
      'drizzle-orm',
    ],
  };
}
