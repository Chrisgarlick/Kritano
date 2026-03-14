/**
 * Discovery Worker Service
 *
 * Phase 1 of the two-phase audit pipeline.
 * Handles lightweight HTTP-only work: robots.txt, sitemaps, exposed files,
 * Google dorking. No Playwright browser needed.
 *
 * Runs at high concurrency (default 5) since it's just HTTP fetches.
 */

import { Pool } from 'pg';
import os from 'os';
import { createRobotsParser } from '../spider/robots-parser.service';
import { createSitemapParser } from '../spider/sitemap-parser.service';
import { createUrlNormalizer } from '../spider/url-normalizer.service';
import { createRateLimiter } from '../spider/rate-limiter.service';
import { createAuditEngineCoordinator } from '../audit-engines';
import { createGoogleIndexExposureService } from '../google-index-exposure.service';
import { getDomainSettingsForAudit } from '../domain-verification.service.js';
import { addActivityLog, addToQueue, shouldExcludeUrl } from './audit-shared';
import type { AuditJob } from '../../types/audit.types';
import {
  UNVERIFIED_DOMAIN_LIMITS,
  RATE_LIMIT_PROFILES,
  SCANNER_INFO,
  type RateLimitProfile,
} from '../../constants/consent.constants.js';

export interface DiscoveryWorkerConfig {
  pool: Pool;
  pollingIntervalMs?: number;
  maxConcurrent?: number;
  onJobStart?: (job: AuditJob) => void | Promise<void>;
  onJobFail?: (job: AuditJob, error: Error) => void | Promise<void>;
}

export class DiscoveryWorkerService {
  private pool: Pool;
  private workerId: string;
  private isRunning: boolean = false;
  private maxConcurrent: number;
  private pollingIntervalMs: number;
  private config: DiscoveryWorkerConfig;
  private activeJobs = new Map<string, Promise<void>>();
  private auditCoordinator: ReturnType<typeof createAuditEngineCoordinator>;

  constructor(config: DiscoveryWorkerConfig) {
    this.config = config;
    this.pool = config.pool;
    this.maxConcurrent = config.maxConcurrent ?? 5;
    this.pollingIntervalMs = config.pollingIntervalMs ?? 1000;
    this.workerId = `discovery-${os.hostname()}-${process.pid}-${Date.now()}`;
    this.auditCoordinator = createAuditEngineCoordinator(config.pool);
  }

  getWorkerId(): string {
    return this.workerId;
  }

  async start(): Promise<void> {
    console.log(`🔍 Starting discovery worker: ${this.workerId} (max ${this.maxConcurrent} concurrent)`);
    this.isRunning = true;

    // Recover stale discovering jobs back to pending
    const recovered = await this.recoverStaleJobs();
    if (recovered > 0) {
      console.log(`♻️  Recovered ${recovered} stale discovery job(s)`);
    }

    await this.processLoop();
  }

  async stop(): Promise<void> {
    console.log('🛑 Stopping discovery worker...');
    this.isRunning = false;

    // Release any claimed discovering jobs back to pending
    for (const jobId of this.activeJobs.keys()) {
      try {
        await this.pool.query(`
          UPDATE audit_jobs
          SET status = 'pending', worker_id = NULL, locked_at = NULL, updated_at = NOW()
          WHERE id = $1 AND status = 'discovering' AND worker_id = $2
        `, [jobId, this.workerId]);
      } catch {
        // Best effort
      }
    }

    if (this.activeJobs.size > 0) {
      console.log(`⏳ Waiting for ${this.activeJobs.size} active discovery job(s)...`);
      await Promise.allSettled(this.activeJobs.values());
    }

    console.log('✅ Discovery worker stopped');
  }

  /**
   * Claim a pending job and set it to discovering
   */
  private async claimJob(): Promise<AuditJob | null> {
    const result = await this.pool.query<AuditJob>(`
      UPDATE audit_jobs
      SET
        status = 'discovering',
        worker_id = $1,
        locked_at = NOW(),
        updated_at = NOW()
      WHERE id = (
        SELECT id FROM audit_jobs
        WHERE status = 'pending'
        ORDER BY created_at ASC
        FOR UPDATE SKIP LOCKED
        LIMIT 1
      )
      RETURNING *
    `, [this.workerId]);

    return result.rows[0] || null;
  }

  /**
   * Mark job as ready for the Playwright phase
   */
  private async markReady(jobId: string): Promise<void> {
    await this.pool.query(`
      UPDATE audit_jobs
      SET
        status = 'ready',
        worker_id = NULL,
        locked_at = NULL,
        updated_at = NOW()
      WHERE id = $1 AND status = 'discovering'
    `, [jobId]);
  }

  /**
   * Recover stale discovering jobs back to pending
   */
  private async recoverStaleJobs(): Promise<number> {
    const staleThreshold = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes for discovery

    const result = await this.pool.query(`
      UPDATE audit_jobs
      SET status = 'pending', worker_id = NULL, locked_at = NULL, updated_at = NOW()
      WHERE status = 'discovering' AND locked_at < $1
      RETURNING id
    `, [staleThreshold]);

    return result.rowCount || 0;
  }

  private async processLoop(): Promise<void> {
    while (this.isRunning) {
      try {
        // Clean up settled jobs
        for (const [jobId, promise] of this.activeJobs) {
          const isSettled = await Promise.race([
            promise.then(() => true).catch(() => true),
            Promise.resolve(false),
          ]);
          if (isSettled) {
            this.activeJobs.delete(jobId);
          }
        }

        // Fill available slots
        while (this.activeJobs.size < this.maxConcurrent) {
          const job = await this.claimJob();
          if (!job) break;

          console.log(`🔍 Discovery: ${job.target_url} (${job.id})`);

          const jobPromise = this.processJob(job).catch((error) => {
            console.error(`Discovery job ${job.id} failed:`, error);
          });

          this.activeJobs.set(job.id, jobPromise);
        }

        if (this.activeJobs.size === 0) {
          await this.sleep(this.pollingIntervalMs);
        } else {
          await this.sleep(500);
        }
      } catch (error) {
        console.error('Error in discovery loop:', error);
        await this.sleep(5000);
      }
    }
  }

  private async processJob(job: AuditJob): Promise<void> {
    try {
      await this.config.onJobStart?.(job);
      await this.runDiscovery(job);
      await this.markReady(job.id);
      console.log(`✅ Discovery done: ${job.target_url} (${job.id})`);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error(`❌ Discovery failed for ${job.id}:`, err.message);

      await this.pool.query(`
        UPDATE audit_jobs
        SET status = 'failed', error_message = $2, completed_at = NOW(),
            worker_id = NULL, locked_at = NULL, updated_at = NOW()
        WHERE id = $1
      `, [job.id, err.message]);

      await this.config.onJobFail?.(job, err);
    }
  }

  private async runDiscovery(job: AuditJob): Promise<void> {
    const isSinglePageMode = job.max_pages === 1;
    const isUnverifiedMode = (job as AuditJob & { unverified_mode?: boolean }).unverified_mode === true;

    await addActivityLog(this.pool, job.id, 'Starting discovery phase...', 'info');

    // Look up domain settings for verified domains
    const domainSettings = job.organization_id
      ? await getDomainSettingsForAudit(job.organization_id, job.target_domain)
      : null;

    // Determine robots.txt behavior
    let respectRobotsTxt = job.respect_robots_txt;
    if (isUnverifiedMode) {
      respectRobotsTxt = true;
    } else if (domainSettings?.verified && domainSettings.ignoreRobotsTxt) {
      respectRobotsTxt = false;
    }

    // Log mode info
    if (isUnverifiedMode) {
      console.log(`⚠️  Discovery in RESTRICTED MODE (unverified domain)`);
      await addActivityLog(
        this.pool, job.id,
        `Running in restricted mode (unverified domain): Max ${UNVERIFIED_DOMAIN_LIMITS.MAX_PAGES} pages`,
        'info'
      );
    } else if (domainSettings?.verified) {
      const profileName = domainSettings.rateLimitProfile
        ? RATE_LIMIT_PROFILES[domainSettings.rateLimitProfile as RateLimitProfile]?.label || 'Default'
        : 'Default';
      console.log(`✓ Verified domain - Rate profile: ${profileName}`);
      await addActivityLog(
        this.pool, job.id,
        `Verified domain scan - ${profileName} speed${!respectRobotsTxt ? ', robots.txt bypassed' : ''}`,
        'info'
      );
    }

    // Single-page mode: skip robots/sitemap, just add seed URL
    if (isSinglePageMode) {
      console.log(`📄 Single page audit mode - scanning only ${job.target_url}`);
      await addActivityLog(this.pool, job.id, 'Single page audit - skipping sitemap discovery', 'info');
      await addToQueue(this.pool, job.id, job.target_url, 0, null, 100);
      return;
    }

    // Load robots.txt
    const robotsParser = createRobotsParser(SCANNER_INFO.USER_AGENT);
    let robotsSitemaps: string[] = [];
    if (respectRobotsTxt) {
      await robotsParser.loadFromUrl(job.target_url);
      robotsSitemaps = robotsParser.getSitemaps();
    }

    // Discover and parse sitemaps
    console.log(`🗺️  Discovering sitemaps for ${job.target_url}`);
    await addActivityLog(this.pool, job.id, 'Discovering sitemaps...', 'info');

    const urlNormalizer = createUrlNormalizer(job.target_url, job.include_subdomains);
    const sitemapParser = createSitemapParser({
      userAgent: SCANNER_INFO.USER_AGENT,
      timeoutMs: 30000,
    });
    const { urls: sitemapUrls, errors: sitemapErrors } = await sitemapParser.discoverAndParse(
      job.target_url,
      robotsSitemaps
    );

    if (sitemapErrors.length > 0) {
      console.log(`   ⚠️  Sitemap warnings: ${sitemapErrors.slice(0, 3).join(', ')}${sitemapErrors.length > 3 ? '...' : ''}`);
    }

    // Seed queue with sitemap URLs
    let sitemapUrlsAdded = 0;
    for (const sitemapUrl of sitemapUrls) {
      if (shouldExcludeUrl(sitemapUrl.loc)) continue;

      const validation = urlNormalizer.normalize(sitemapUrl.loc);
      if (validation.isValid && validation.isInScope) {
        const priority = sitemapUrl.priority !== undefined ? Math.round(sitemapUrl.priority * 100) : 50;
        await addToQueue(this.pool, job.id, sitemapUrl.loc, 0, 'sitemap', priority);
        sitemapUrlsAdded++;
      }
    }

    if (sitemapUrlsAdded > 0) {
      console.log(`   ✓ Added ${sitemapUrlsAdded} URLs from sitemap`);
      await addActivityLog(this.pool, job.id, `Found ${sitemapUrlsAdded} URLs in sitemap`, 'success');
    } else {
      console.log(`   ℹ️  No sitemap URLs found`);
      await addActivityLog(this.pool, job.id, 'No sitemap found, discovering via crawling', 'info');
    }

    // Security file probing
    if (job.check_security) {
      await addActivityLog(this.pool, job.id, 'Checking for exposed sensitive files...', 'info');
      const exposedFiles = await this.auditCoordinator.probeExposedFiles(job.target_url);
      if (exposedFiles.length > 0) {
        await this.auditCoordinator.storeFindings(job.id, null, exposedFiles);
        const uniqueRuleIds = new Set(exposedFiles.map(f => f.ruleId));
        const uniqueCriticalRuleIds = new Set(exposedFiles.filter(f => f.severity === 'critical').map(f => f.ruleId));

        // Use the job queue to update progress
        await this.pool.query(`
          UPDATE audit_jobs SET
            total_issues = $2,
            critical_issues = $3,
            updated_at = NOW()
          WHERE id = $1
        `, [job.id, uniqueRuleIds.size, uniqueCriticalRuleIds.size]);

        await addActivityLog(this.pool, job.id, `Found ${exposedFiles.length} exposed file(s)`, 'warning');
      }
    }

    // Google Index Exposure (dorking) scan
    if (job.check_security) {
      try {
        const googleDorking = createGoogleIndexExposureService();
        if (googleDorking.isConfigured()) {
          const tierCheck = await this.pool.query<{ available_checks: string[] }>(
            `SELECT tl.available_checks FROM tier_limits tl
             JOIN users u ON u.id = $1
             LEFT JOIN subscriptions s ON s.user_id = u.id AND s.status = 'active'
             WHERE tl.tier = COALESCE(s.tier, 'free')
             LIMIT 1`,
            [job.user_id]
          );
          const availableChecks = tierCheck.rows[0]?.available_checks || [];
          if (availableChecks.includes('google-dorking')) {
            await addActivityLog(this.pool, job.id, 'Checking Google index for exposed URLs...', 'info');
            const indexedItems = await googleDorking.scanDomain(job.target_domain);
            if (indexedItems.length > 0) {
              const indexFindings = googleDorking.convertToFindings(indexedItems, robotsParser);
              await this.auditCoordinator.storeFindings(job.id, null, indexFindings);
              await addActivityLog(
                this.pool, job.id,
                `Found ${indexFindings.length} Google-indexed sensitive URL(s)`,
                'warning'
              );
            } else {
              await addActivityLog(this.pool, job.id, 'No exposed URLs found in Google index', 'success');
            }
          }
        }
      } catch (error) {
        console.warn('Google dorking scan failed (non-blocking):', error instanceof Error ? error.message : String(error));
      }
    }

    // Add seed URL to queue (deduped if already in sitemap)
    await addToQueue(this.pool, job.id, job.target_url, 0, null, 100);

    await addActivityLog(this.pool, job.id, 'Discovery complete, queued for scanning', 'success');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export function createDiscoveryWorker(config: DiscoveryWorkerConfig): DiscoveryWorkerService {
  return new DiscoveryWorkerService(config);
}
