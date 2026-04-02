# Ops Audit

**Overall Assessment:** STRONG
**Score:** 8/10

## What's Working Well

1. **Excellent deployment documentation.** `docs/deploy.md` is a comprehensive, step-by-step guide covering everything from droplet provisioning through post-deploy verification. Memory budgets are realistic, the PostgreSQL tuning section has configs for both 2GB and 4GB tiers, and there is a genuine smoke-test checklist. This is production-ready documentation.

2. **PostgreSQL-based job queue with SKIP LOCKED.** The `JobQueueService` uses `FOR UPDATE SKIP LOCKED` for job claiming, which is a rock-solid concurrency pattern that eliminates the need for a separate queue broker (like RabbitMQ). Stale job recovery, retry limits, and graceful lock release on shutdown are all implemented correctly.

3. **Graceful shutdown throughout.** The worker process (`worker.ts`) handles SIGTERM, SIGINT, uncaught exceptions, and unhandled rejections. It stops all sub-workers (discovery, audit, campaign, trial, schedule poller, GDPR), releases job locks back to "ready" state, drains the DB pool, and flushes Sentry before exiting. This means PM2 restarts and deploys will not lose in-flight work.

4. **Memory-aware job scheduling.** The `memory-monitor.ts` module checks system memory before accepting new jobs (85% threshold in production), and the audit worker exposes `getEffectiveConcurrency()` to dynamically reduce parallelism under memory pressure. This is critical for a 2GB droplet running Playwright.

5. **Sensible CI pipeline.** The GitHub Actions workflow runs lint, type-check, and tests for both server and client, with proper service containers for PostgreSQL and Redis. Branch triggers on `main` and `phase-*` match the development workflow.

## Issues Found

### No Off-Site Backup Automation
**Severity:** HIGH
**Location:** `docs/deploy.md` Section 16.3
**Finding:** The backup strategy documents daily local `pg_dump` with 14-day retention, but off-site backup (to DO Spaces or S3) is described as "recommended" with a manual `s3cmd` example that is commented out. There is no actual script or cron job that copies backups off the droplet.
**Impact:** If the droplet's disk fails, all backups are lost along with the database. A single point of failure for all customer data.
**Recommendation:** Add the `s3cmd put` or `doctl spaces` upload command directly into `backup-db.sh` as a non-optional step. Test the upload in CI or via a canary cron that alerts on failure. Also consider enabling PostgreSQL WAL archiving for point-in-time recovery rather than relying solely on daily dumps.

### No CD Pipeline -- Deployments Are Manual SSH
**Severity:** MEDIUM
**Location:** `.github/workflows/ci.yml`, `docs/deploy.md` Section 17
**Finding:** CI runs lint/typecheck/test but there is no continuous deployment step. Deployments require SSH-ing into the droplet and running `/home/deploy/scripts/deploy.sh` by hand. The deploy script itself runs `git pull`, `npm install`, build, migrate, and `pm2 restart all` in sequence with no rollback mechanism.
**Impact:** Manual deploys are error-prone and slow. A failed migration leaves the app in a partially-deployed state with no automated rollback. This also means deploys cannot happen when the operator is unavailable.
**Recommendation:** Add a GitHub Actions CD job triggered on `main` pushes that SSH-deploys automatically (e.g., via `appleboy/ssh-action` or a self-hosted runner). Add a pre-deploy database backup step and a post-deploy health check that rolls back (`git checkout` to previous commit + `pm2 restart`) on failure.

### Deploy Script Has No Rollback or Pre-Deploy Backup
**Severity:** MEDIUM
**Location:** `docs/deploy.md` Section 17 (deploy.sh)
**Finding:** The deploy script runs migrations and restarts in a single forward-only pass. If a migration fails mid-way, the database is in a partially-migrated state. There is no snapshot taken before deploy, and no mechanism to revert to the previous build.
**Impact:** A bad deploy could require manual database surgery to recover from, causing extended downtime.
**Recommendation:** Add `pg_dump` before migrations in the deploy script. Keep the previous `dist/` directories (e.g., `dist.bak/`) so `pm2 restart` can fall back. Consider tagging releases so `git checkout` to a known-good state is straightforward.

### Worker Health Port Collision Risk
**Severity:** LOW
**Location:** `server/src/worker.ts` lines 248-356
**Finding:** The worker health server defaults to port 3001 (same as the API) and walks ports upward if occupied. The env var is `WORKER_HEALTH_PORT` and the deploy guide sets it to 3002, but the code defaults to 3001. If someone forgets the env var, the worker silently binds to a random high port, making health checks from external monitors unreliable.
**Impact:** Uptime monitoring and the admin panel's worker health check could silently fail or hit the wrong endpoint.
**Recommendation:** Change the default in code to 3002 to match the documented convention: `const BASE_HEALTH_PORT = parseInt(process.env.WORKER_HEALTH_PORT || '3002', 10);`

### No Log Aggregation or Alerting
**Severity:** LOW
**Location:** `docs/deploy.md` Section 15
**Finding:** Monitoring relies on PM2 logs (local files with logrotate), Sentry (marked optional), and an external uptime monitor. There is no structured logging, no log shipping to a centralized service, and no alerting on error spikes, memory threshold breaches, or failed backups.
**Impact:** Issues may go unnoticed until a user reports them. On a single droplet, disk space from unmonitored log growth could cause outages.
**Recommendation:** At minimum, configure PM2 to output JSON-formatted logs. Consider a lightweight agent (Vector, Promtail) shipping to a free-tier service (Grafana Cloud, Better Stack). Set up email/Slack alerts for: backup failures, PM2 restart loops, and disk usage above 80%.

### Multiple Pool Instances in the Same Process
**Severity:** LOW
**Location:** `server/src/db/index.ts`, `server/src/index.ts`
**Finding:** `server/src/db/index.ts` exports a `pool` singleton with `max: 20`, but `server/src/index.ts` creates its own `new Pool({ max: 20 })`. Both are in the API process. If any service imports from `db/index.ts` while routes use the pool from `index.ts`, the API opens up to 40 connections -- dangerously close to the PostgreSQL `max_connections = 50` limit, especially since the worker also creates a pool.
**Impact:** Under load, connection exhaustion could cause cascading failures across both API and worker.
**Recommendation:** Audit imports to ensure only one pool is used per process. Either remove the pool in `db/index.ts` or have `index.ts` re-export it. On the 2GB config (`max_connections = 50`), budget: API = 15, Worker = 5, system/monitoring = 5, headroom = 25.

## Opportunities

1. **Add database connection pooling with PgBouncer.** On the 2GB droplet with `max_connections = 50`, adding PgBouncer in transaction mode would let both API and worker share a smaller set of real connections while handling bursts safely. It is trivially installable via apt and adds negligible memory overhead.

2. **Implement zero-downtime deploys properly.** The deploy guide mentions `pm2 reload` for graceful restarts but the deploy script uses `pm2 restart all`. Switch to `pm2 reload` and consider running the API in cluster mode with 2 instances (feasible on the 4GB tier) for true zero-downtime.

3. **Add a simple deploy versioning mechanism.** Tag each deploy with `git rev-parse HEAD > /home/deploy/kritano/REVISION` and expose it via the `/health` endpoint. This makes it trivial to verify which version is running and to roll back to a specific commit.

4. **Harden Redis.** The deploy guide does not configure a Redis password or bind address. While UFW blocks external access, defense-in-depth says Redis should require authentication (`requirepass`) and bind only to `127.0.0.1`. A compromised service on the same box could otherwise manipulate queue state.

5. **Add migration dry-run or staging verification.** The migration system runs SQL files in a transaction (good), but there is no way to test migrations against a staging database before production. A `migrate:dry-run` command that runs in a transaction and rolls back would catch SQL errors before they hit prod.

## Summary

Kritano's ops setup is genuinely strong for an early-stage single-droplet deployment. The deployment guide is thorough and realistic about resource constraints, the PostgreSQL-based job queue is well-engineered with proper locking and stale job recovery, graceful shutdown is handled correctly across all worker processes, and memory-aware job scheduling shows thoughtful attention to the 2GB RAM constraint. The main gaps are in the backup and deployment automation layer: off-site backups are documented but not wired up, deployments are manual with no rollback path, and there is no alerting pipeline beyond optional Sentry. Fixing the off-site backup gap should be the immediate priority since it is the only true data-loss risk. The remaining items -- CD pipeline, connection pool consolidation, and structured alerting -- are natural next steps as the product grows beyond its first handful of users.
