/**
 * Cold Prospect Worker Service
 *
 * Orchestrates the cold prospect pipeline:
 * - Downloads daily NRD feeds
 * - Checks domains for live websites
 * - Extracts contact emails and names
 *
 * Runs inside the main worker.ts process.
 */

import { Pool } from 'pg';
import {
  setPool as setNrdFeedPool,
  downloadDailyFeed,
  parseFeed,
  importDomains,
  getSettings,
  updateSetting,
  cleanupTempFiles,
} from '../cold-prospect/nrd-feed.service.js';
import {
  setPool as setDomainCheckerPool,
  processPendingBatch,
  processDnsBatch,
} from '../cold-prospect/domain-checker.service.js';
import {
  setPool as setEmailExtractorPool,
  processLiveBatch,
} from '../cold-prospect/email-extractor.service.js';
import {
  setPool as setAdminPool,
} from '../cold-prospect/cold-prospect-admin.service.js';
import {
  setPool as setOutreachPool,
  queueOutreachBatch,
  processOutreachQueue,
  queueFollowups,
} from '../cold-prospect/outreach.service.js';
import { getSetting } from '../system-settings.service.js';

// Polling intervals
const NRD_FEED_CHECK_MS = 60 * 60 * 1000;     // Check for new feed every hour
const MX_CHECK_MS = 2 * 60 * 1000;             // MX filter every 2 minutes (fast)
const DOMAIN_CHECK_MS = 5 * 60 * 1000;         // Check domains every 5 minutes
const EMAIL_EXTRACT_MS = 5 * 60 * 1000;        // Extract emails every 5 minutes
const OUTREACH_MS = 10 * 60 * 1000;             // Outreach every 10 minutes

interface ColdProspectWorkerConfig {
  pool: Pool;
}

export function createColdProspectWorker(config: ColdProspectWorkerConfig) {
  const { pool } = config;
  let running = false;
  let feedTimer: ReturnType<typeof setTimeout> | null = null;
  let mxTimer: ReturnType<typeof setTimeout> | null = null;
  let domainTimer: ReturnType<typeof setTimeout> | null = null;
  let emailTimer: ReturnType<typeof setTimeout> | null = null;
  let outreachTimer: ReturnType<typeof setTimeout> | null = null;

  // Initialize all service pools
  setNrdFeedPool(pool);
  setDomainCheckerPool(pool);
  setEmailExtractorPool(pool);
  setAdminPool(pool);
  setOutreachPool(pool);

  /**
   * Check if today's NRD feed is available and import it
   */
  async function pollNrdFeed(): Promise<void> {
    if (!running) return;

    try {
      const settings = await getSettings();
      const today = new Date().toISOString().split('T')[0];

      // Skip if already imported today
      if (settings.lastFeedDate === today) {
        scheduleFeedPoll();
        return;
      }

      // Try to download yesterday's feed (published ~04:00 UTC for previous day)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      try {
        const csvPath = await downloadDailyFeed(yesterday);
        const domains = await parseFeed(csvPath, settings.targetTlds, settings.excludedKeywords);

        if (domains.length > 0) {
          // Apply daily check limit
          const limitedDomains = domains.slice(0, settings.dailyCheckLimit);
          const result = await importDomains(limitedDomains, yesterday);
          console.log(`🎯 NRD import: ${result.imported} new, ${result.duplicates} duplicates (of ${domains.length} total)`);

          await updateSetting('last_feed_date', today);
        }

        // Clean up old temp files
        cleanupTempFiles(7);
      } catch (feedErr) {
        // Feed might not be available yet, will retry next hour
        console.log(`🎯 NRD feed not available yet, will retry later`);
      }
    } catch (err) {
      console.error('🎯 NRD feed poll error:', err);
    }

    scheduleFeedPoll();
  }

  function scheduleFeedPoll(): void {
    if (running) {
      feedTimer = setTimeout(pollNrdFeed, NRD_FEED_CHECK_MS);
    }
  }

  /**
   * Fast DNS pre-filter — kills domains without A/AAAA records before slow HTTP checks
   */
  async function pollDnsFilter(): Promise<void> {
    if (!running) return;

    try {
      const result = await processDnsBatch(500);
      if (result.checked > 0) {
        console.log(`🎯 DNS filter: ${result.checked} checked, ${result.killed} killed, ${result.passed} passed`);
      }
    } catch (err) {
      console.error('🎯 DNS filter poll error:', err);
    }

    if (running) {
      mxTimer = setTimeout(pollDnsFilter, MX_CHECK_MS);
    }
  }

  /**
   * Process pending domains for liveness checks
   */
  async function pollDomainChecker(): Promise<void> {
    if (!running) return;

    try {
      const settings = await getSettings();
      const processed = await processPendingBatch(Math.min(50, settings.dailyCheckLimit));
      if (processed > 0) {
        console.log(`🎯 Domain check: ${processed} domains processed`);
      }
    } catch (err) {
      console.error('🎯 Domain checker poll error:', err);
    }

    if (running) {
      domainTimer = setTimeout(pollDomainChecker, DOMAIN_CHECK_MS);
    }
  }

  /**
   * Process live domains for email extraction
   */
  async function pollEmailExtractor(): Promise<void> {
    if (!running) return;

    try {
      const processed = await processLiveBatch(20);
      if (processed > 0) {
        console.log(`📧 Email extraction: ${processed} domains processed`);
      }
    } catch (err) {
      console.error('📧 Email extractor poll error:', err);
    }

    if (running) {
      emailTimer = setTimeout(pollEmailExtractor, EMAIL_EXTRACT_MS);
    }
  }

  /**
   * Process cold prospect outreach emails
   */
  async function pollOutreach(): Promise<void> {
    if (!running) return;

    try {
      // Check if outreach is enabled
      const enabled = await getSetting('trigger_auto_send_cold_outreach');
      if (enabled !== true && enabled !== 'true') {
        if (running) {
          outreachTimer = setTimeout(pollOutreach, OUTREACH_MS);
        }
        return;
      }

      // Queue new outreach emails
      const queued = await queueOutreachBatch();
      if (queued.queued > 0) {
        console.log(`📨 Cold outreach: ${queued.queued} emails queued`);
      }

      // Process the queue
      const result = await processOutreachQueue(10);
      if (result.sent > 0 || result.failed > 0) {
        console.log(`📨 Cold outreach: ${result.sent} sent, ${result.failed} failed`);
      }

      // Queue follow-ups
      const followups = await queueFollowups();
      if (followups.queued > 0) {
        console.log(`📨 Cold outreach: ${followups.queued} follow-ups queued`);
      }
    } catch (err) {
      console.error('📨 Cold outreach poll error:', err);
    }

    if (running) {
      outreachTimer = setTimeout(pollOutreach, OUTREACH_MS);
    }
  }

  return {
    async start(): Promise<void> {
      running = true;
      console.log('🎯 Cold prospect worker started');
      console.log('   NRD feed check: every 1 hour');
      console.log('   DNS filter: every 2 minutes');
      console.log('   Domain checker: every 5 minutes');
      console.log('   Email extractor: every 5 minutes');
      console.log('   Outreach: every 10 minutes');

      // Stagger start times
      pollNrdFeed();
      setTimeout(pollDnsFilter, 15 * 1000);       // Start 15s after
      setTimeout(pollDomainChecker, 30 * 1000);   // Start 30s after
      setTimeout(pollEmailExtractor, 60 * 1000);  // Start 60s after
      setTimeout(pollOutreach, 90 * 1000);         // Start 90s after
    },

    async stop(): Promise<void> {
      running = false;
      if (feedTimer) { clearTimeout(feedTimer); feedTimer = null; }
      if (mxTimer) { clearTimeout(mxTimer); mxTimer = null; }
      if (domainTimer) { clearTimeout(domainTimer); domainTimer = null; }
      if (emailTimer) { clearTimeout(emailTimer); emailTimer = null; }
      if (outreachTimer) { clearTimeout(outreachTimer); outreachTimer = null; }
      console.log('🎯 Cold prospect worker stopped');
    },
  };
}
