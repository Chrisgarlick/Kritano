import { pool } from '../../db/index.js';
import { gdprService } from '../gdpr.service.js';

const EXPORT_POLL_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface GdprWorkerConfig {
  pool: unknown;
}

export function createGdprWorker(_config: GdprWorkerConfig) {
  let running = false;
  let exportTimer: ReturnType<typeof setTimeout> | null = null;
  let cleanupTimer: ReturnType<typeof setTimeout> | null = null;

  async function pollExports(): Promise<void> {
    if (!running) return;
    try {
      const pending = await pool.query<{ id: string }>(
        `SELECT id FROM account_data_exports WHERE status = 'pending' ORDER BY created_at ASC LIMIT 5`
      );

      for (const row of pending.rows) {
        try {
          await gdprService.processExport(row.id);
          console.log(`GDPR: Processed export ${row.id}`);
        } catch (err) {
          console.error(`GDPR: Failed to process export ${row.id}:`, err);
        }
      }
    } catch (err) {
      console.error('GDPR export poll error:', err);
    }
    if (running) {
      exportTimer = setTimeout(pollExports, EXPORT_POLL_INTERVAL_MS);
    }
  }

  async function pollCleanup(): Promise<void> {
    if (!running) return;
    try {
      const result = await gdprService.runRetentionCleanup();
      if (result.deletionsProcessed > 0 || result.exportsExpired > 0 || result.logsDeleted > 0) {
        console.log(`GDPR cleanup: ${result.deletionsProcessed} deletions, ${result.exportsExpired} exports expired, ${result.logsDeleted} logs purged`);
      }
    } catch (err) {
      console.error('GDPR cleanup poll error:', err);
    }
    if (running) {
      cleanupTimer = setTimeout(pollCleanup, CLEANUP_INTERVAL_MS);
    }
  }

  return {
    async start(): Promise<void> {
      running = true;
      console.log('GDPR worker started (exports every 1h, cleanup every 24h)');
      // Run first export poll after 2 minutes, cleanup after 5 minutes
      exportTimer = setTimeout(pollExports, 2 * 60 * 1000);
      cleanupTimer = setTimeout(pollCleanup, 5 * 60 * 1000);
    },
    async stop(): Promise<void> {
      running = false;
      if (exportTimer) {
        clearTimeout(exportTimer);
        exportTimer = null;
      }
      if (cleanupTimer) {
        clearTimeout(cleanupTimer);
        cleanupTimer = null;
      }
    },
  };
}
