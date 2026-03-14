# Worker Scalability Plan — Cheap DigitalOcean Droplet

## The Problem

Right now, each audit job is monolithic: sitemap discovery → crawling → Playwright auditing all happen sequentially within one claimed job. Playwright is the expensive part (~200-400MB RAM per Chromium instance). With 3 concurrent audits, that's potentially 1.2GB just for browsers.

On a basic DO droplet (1-2GB RAM, 1-2 vCPUs), we need to be smart about resource usage.

---

## Current Architecture

```
[API Server] → INSERT audit_jobs (status=pending)
                        ↓
[Worker Process] → polls audit_jobs with SKIP LOCKED
                        ↓
              claims job → runs EVERYTHING:
                1. Fetch robots.txt (HTTP)
                2. Parse sitemaps (HTTP)
                3. Probe exposed files (HTTP)
                4. Crawl + audit each page (PLAYWRIGHT - heavy)
                5. Score and complete
```

**Bottleneck**: Steps 1-3 are lightweight HTTP. Step 4 is CPU/RAM heavy. They're bundled together, so a job holds a "slot" even during the lightweight phases.

---

## Phase 1: Immediate Wins (No Architecture Changes) ✅ DONE

### 1A. Reduce Concurrent Audits ✅
Configurable via `WORKER_MAX_CONCURRENT_JOBS` env var (defaults to 1).

### 1B. Add Queue Position to SSE Stream ✅
Queue position calculated in SSE endpoint, shown in UI.

### 1C. Estimated Wait Time ✅
Based on 7-day average audit duration, factored by concurrency slots.

### 1D. Browser Reuse
Already in place — Playwright browser reused across jobs.

**Also done:**
- Cold prospect worker removed from main worker process (runs separately via `npm run prospects`)
- Admin queue backlog panel with cancel buttons, summary stats, top 5 pending, recent failures
- Admin cancel single job / cancel all pending endpoints

---

## Phase 2: Two-Phase Job Pipeline ✅ DONE

Split each audit into two phases so lightweight work doesn't block Playwright slots.

### New Job Statuses
```
pending → discovering → ready → processing → completed/failed
```

### What Was Built
- **Discovery Worker** (`server/src/services/queue/discovery-worker.service.ts`): Claims `pending` → `discovering`, runs robots.txt/sitemaps/file probing/Google dorking via HTTP, marks `ready`. Default concurrency 5 (`DISCOVERY_MAX_CONCURRENT` env var).
- **Shared Utilities** (`server/src/services/queue/audit-shared.ts`): Extracted `addActivityLog`, `addToQueue`, `shouldExcludeUrl`, `buildAuditConfig` for use by both workers.
- **Audit Worker** now claims `ready` jobs (not `pending`), skips all discovery logic, loads existing findings from discovery phase.
- **Migration** `086_audit_two_phase_statuses.sql`: CHECK constraint updated, partial indexes for `ready` and `discovering`.
- **Job Queue** updated: `claimJob()` claims `ready`, `releaseCurrentJob()` resets to `ready`, `recoverStaleJobs()` handles both `processing` → `ready` and `discovering` → `pending`.
- **All routes** updated: SSE queue position for `pending`/`ready`, concurrent limits and cancel include all active statuses.
- **Frontend**: 5-step progress indicator (Submitted → Discovering → Queued → Scanning → Complete), `discovering` status badge (sky blue, search icon), `ready` badge, admin dashboard shows all phases.

---

## Phase 3: Smart Resource Management ✅ DONE

### 3A. Memory-Aware Job Claiming ✅
`server/src/services/queue/memory-monitor.ts` — checks system memory via `os.freemem()`/`os.totalmem()`. Threshold configurable via `WORKER_MEMORY_THRESHOLD` env var (default 85%). Worker skips claiming new jobs when memory exceeds threshold.

### 3B. Adaptive Concurrency ✅
`effectiveConcurrency` in audit worker adjusts automatically:
- Memory < 60%: up to 2x configured max concurrent jobs
- Memory 60-85%: configured default
- Memory > 85%: freeze at current active count (no new claims)
Logs when effective concurrency changes.

### 3C. Page Budget Priority ✅
`claimJob()` SQL orders by `max_pages ASC, created_at ASC` — smaller audits processed first.

### 3D. Health Endpoint + Admin Display ✅
`/status` endpoint returns `memory` object (usedPercent, freeMB, totalMB, threshold, effectiveConcurrency). Admin dashboard shows color-coded memory bar and concurrency in worker panel.

---

## Phase 4: UI Improvements for Queue Waiting ✅ DONE

### Pending State (In Queue) ✅
Shows queue position, estimated wait, step indicator (Submitted → In queue → Scanning → Complete), reassuring message about email notification.

### Discovering State ✅ (Built in Phase 2)
Shows "Discovering pages..." with sky-blue search icon, activity log updates, 5-step indicator.

### Processing State ✅
Shows progress bar, pages crawled/audited/issues found, current URL, step indicator.

---

## Recommended DO Droplet Specs

### Starting (MVP — up to ~50 users)
- **Droplet**: Basic, 2GB RAM / 1 vCPU ($12/mo)
- **Managed Postgres**: Basic, 1GB ($15/mo)
- **Config**: 1 concurrent Playwright audit, 5 concurrent discoveries
- **Total**: ~$27/mo

### Growth (50-200 users)
- **Droplet**: Basic, 4GB RAM / 2 vCPU ($24/mo)
- **Managed Postgres**: Basic, 2GB ($30/mo)
- **Config**: 2 concurrent Playwright audits, 10 concurrent discoveries
- **Total**: ~$54/mo

### Scale (200+ users)
- Split worker to its own droplet
- API server: 2GB droplet ($12/mo)
- Worker: 4GB droplet ($24/mo)
- Managed Postgres: $30/mo
- **Total**: ~$66/mo

---

## Implementation Order

1. ~~**Phase 1A-1C** — Quick wins: reduce concurrency, add queue position + ETA to SSE~~ ✅
2. ~~**Phase 4** — Better waiting UI~~ ✅
3. ~~**Phase 2** — Two-phase pipeline (biggest impact)~~ ✅
4. ~~**Phase 3** — Memory-aware claiming~~ ✅

---

## Key Files

| File | Status |
|------|--------|
| `server/src/db/migrations/086_audit_two_phase_statuses.sql` | ✅ NEW — CHECK constraint + indexes |
| `server/src/services/queue/audit-shared.ts` | ✅ NEW — Shared utilities |
| `server/src/services/queue/discovery-worker.service.ts` | ✅ NEW — Discovery worker |
| `server/src/services/queue/memory-monitor.ts` | ✅ NEW — Memory utility |
| `server/src/services/queue/audit-worker.service.ts` | ✅ Discovery removed, claims `ready`, adaptive concurrency |
| `server/src/services/queue/job-queue.service.ts` | ✅ New statuses, claim `ready`, page budget priority |
| `server/src/worker.ts` | ✅ Discovery worker, memory in /status endpoint |
| `server/src/routes/audits/index.ts` | ✅ SSE, concurrent limits, cancel updated |
| `server/src/routes/admin/index.ts` | ✅ Queue backlog, cancel updated |
| `server/src/routes/v1/index.ts` | ✅ Concurrent limits, cancel updated |
| `server/src/services/schedule.service.ts` | ✅ Concurrent limit updated |
| `client/src/components/ui/StatusBadge.tsx` | ✅ discovering + ready configs |
| `client/src/pages/audits/AuditDetail.tsx` | ✅ 5-step progress indicator |
| `client/src/pages/admin/AdminDashboard.tsx` | ✅ Queue panel shows all phases |
| `client/src/services/api.ts` | ✅ QueueJob, QueueBacklog types updated |
| `client/src/utils/constants.ts` | ✅ Status colors/labels/icons |
| `client/src/types/audit.types.ts` | ✅ AuditStatus type |
| `server/src/types/audit.types.ts` | ✅ AuditJobStatus type |
