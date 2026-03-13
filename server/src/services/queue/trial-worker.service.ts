/**
 * Trial Worker Service
 *
 * Polls every 5 minutes to check for expiring and expired trials.
 * Sends warning emails 3 days before expiry and downgrades expired trials to free.
 */

import { Pool } from 'pg';
import { checkTrialExpiry } from '../trial.service.js';

const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

interface TrialWorkerConfig {
  pool: Pool;
}

export function createTrialWorker(_config: TrialWorkerConfig) {
  let running = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  async function poll(): Promise<void> {
    if (!running) return;

    try {
      await checkTrialExpiry();
    } catch (err) {
      console.error('Trial worker poll error:', err);
    }

    if (running) {
      timer = setTimeout(poll, POLL_INTERVAL_MS);
    }
  }

  return {
    async start(): Promise<void> {
      running = true;
      console.log('Trial worker started (polling every 5m)');
      poll();
    },

    async stop(): Promise<void> {
      running = false;
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      console.log('Trial worker stopped');
    },
  };
}
