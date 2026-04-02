# Scheduled Audits — Ultrathink Plan

## Overview

Scheduled audits allow users to automatically run recurring website audits on a configurable cadence. The database table (`audit_schedules`) and three basic API routes already exist, but the system lacks the **execution engine**, **tier enforcement**, **update endpoint**, **frontend UI**, and **admin management**. This plan completes the feature end-to-end.

## Current State

### What Exists
| Component | Status | Location |
|-----------|--------|----------|
| `audit_schedules` table | ✅ Created | `server/src/db/migrations/014_create_audit_schedules.sql` |
| `tier_limits.scheduled_audits` flag | ✅ Created | `server/src/db/migrations/016_create_organizations.sql:243` |
| `tier_limits.min_schedule_interval` | ✅ Created | `server/src/db/migrations/016_create_organizations.sql:244` |
| `POST /api/audits/schedules` | ✅ Basic | `server/src/routes/audits/index.ts:2018-2051` |
| `GET /api/audits/schedules` | ✅ Basic | `server/src/routes/audits/index.ts:2053-2069` |
| `DELETE /api/audits/schedules/:id` | ✅ Basic | `server/src/routes/audits/index.ts:2071-2092` |
| Schedule permissions (`schedule:read/write/delete`) | ✅ Defined | `server/src/types/organization.types.ts` |
| Frontend `TierLimits.scheduledAudits` type | ✅ Defined | `client/src/types/site.types.ts:217-218` |

### What's Missing
| Component | Priority |
|-----------|----------|
| Schedule executor (polls `audit_schedules`, creates `audit_jobs`) | **Critical** |
| Cron expression parser (calculate `next_run_at` from cron expression) | **Critical** |
| Tier enforcement on create/update (check `scheduled_audits` flag + `min_schedule_interval`) | **Critical** |
| `PATCH /api/audits/schedules/:id` endpoint | High |
| Database migration: add missing columns (`name`, `site_id`, `last_status`, `run_count`, `failure_count`, `paused_reason`, `max_consecutive_failures`) | High |
| Schedule service layer (encapsulate all schedule logic) | High |
| Frontend: Schedules list page | High |
| Frontend: Create/edit schedule modal | High |
| Frontend: Schedule detail with run history | Medium |
| Admin: Schedule overview + management | Medium |
| Email notifications for scheduled audit results | Low (already exists for audits) |

## Key Decisions

### 1. Execution Strategy: Worker-Integrated Poller (not a separate process)

Add a `SchedulePollerService` that runs inside the existing `worker.ts` process on a 60-second interval. It queries `audit_schedules WHERE enabled = true AND next_run_at <= NOW()`, creates `audit_jobs` entries (reusing the existing audit creation logic), and updates `next_run_at` to the next cron occurrence.

**Why not a separate process?** Kritano already runs a worker process with health endpoints. Adding a lightweight poller avoids operational complexity (another process to manage/monitor). The poller is non-blocking — it just inserts rows into `audit_jobs` and the existing worker picks them up.

**Why not BullMQ repeatable jobs?** The codebase uses a PostgreSQL-based job queue (no Redis/BullMQ). Staying consistent with the PG-based approach avoids introducing a new dependency.

### 2. Cron Expression: Use `croner` library

The `croner` library is lightweight (~5KB), has zero dependencies, supports standard 5-field cron expressions, and can calculate the next occurrence from a given date. No need for a heavier library like `node-cron`.

### 3. Schedule Ownership: Site-Scoped

Schedules should be tied to a **site** (not just a user), since tier limits are resolved via the site owner's subscription. The existing table has `user_id` but no `site_id` — we'll add `site_id` in a migration. This also enables shared team members to view/manage schedules for sites they have access to.

### 4. Failure Handling: Pause After 3 Consecutive Failures

If a scheduled audit fails 3 times in a row (e.g., domain unreachable, security blocking), the schedule is automatically paused with a reason. The user can review and re-enable it. This prevents wasting resources on permanently broken schedules.

### 5. Frontend: Dedicated `/schedules` Page (not nested under Sites)

A top-level `/schedules` route in the sidebar provides a unified view of all schedules across sites. Users can also create schedules from the site detail page or after completing an audit.

### 6. Preset Frequencies Instead of Raw Cron

Users select from preset frequencies (daily, weekly, biweekly, monthly) rather than writing raw cron expressions. The system converts these to cron expressions internally. Power users (Agency/Enterprise) can optionally set custom cron expressions.

## Database Changes

### Migration: `065_enhance_audit_schedules.sql`

```sql
-- Add missing columns to audit_schedules
ALTER TABLE audit_schedules ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE audit_schedules ADD COLUMN IF NOT EXISTS site_id UUID REFERENCES sites(id) ON DELETE CASCADE;
ALTER TABLE audit_schedules ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE audit_schedules ADD COLUMN IF NOT EXISTS frequency VARCHAR(50) NOT NULL DEFAULT 'weekly';
  -- Values: 'daily', 'weekly', 'biweekly', 'monthly', 'custom'
ALTER TABLE audit_schedules ADD COLUMN IF NOT EXISTS last_status VARCHAR(20);
  -- Values: 'completed', 'failed', NULL
ALTER TABLE audit_schedules ADD COLUMN IF NOT EXISTS last_audit_id UUID REFERENCES audit_jobs(id) ON DELETE SET NULL;
ALTER TABLE audit_schedules ADD COLUMN IF NOT EXISTS run_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE audit_schedules ADD COLUMN IF NOT EXISTS failure_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE audit_schedules ADD COLUMN IF NOT EXISTS consecutive_failures INTEGER NOT NULL DEFAULT 0;
ALTER TABLE audit_schedules ADD COLUMN IF NOT EXISTS max_consecutive_failures INTEGER NOT NULL DEFAULT 3;
ALTER TABLE audit_schedules ADD COLUMN IF NOT EXISTS paused_reason TEXT;
ALTER TABLE audit_schedules ADD COLUMN IF NOT EXISTS paused_at TIMESTAMPTZ;
ALTER TABLE audit_schedules ADD COLUMN IF NOT EXISTS notify_on_completion BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE audit_schedules ADD COLUMN IF NOT EXISTS notify_on_failure BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE audit_schedules ADD COLUMN IF NOT EXISTS timezone VARCHAR(100) NOT NULL DEFAULT 'UTC';

-- Populate site_id from existing schedules (match target_domain to sites table)
UPDATE audit_schedules s
SET site_id = (
  SELECT id FROM sites
  WHERE domain = s.target_domain AND (created_by = s.user_id OR owner_id = s.user_id)
  LIMIT 1
)
WHERE s.site_id IS NULL;

-- Index for the poller query
CREATE INDEX IF NOT EXISTS idx_audit_schedules_due
  ON audit_schedules(next_run_at)
  WHERE enabled = true AND paused_reason IS NULL;

-- Index for site-scoped lookups
CREATE INDEX IF NOT EXISTS idx_audit_schedules_site ON audit_schedules(site_id);

-- Link audit_jobs back to the schedule that triggered them
ALTER TABLE audit_jobs ADD COLUMN IF NOT EXISTS schedule_id UUID REFERENCES audit_schedules(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_audit_jobs_schedule ON audit_jobs(schedule_id) WHERE schedule_id IS NOT NULL;
```

## Backend Changes

### New Files

#### 1. `server/src/services/schedule.service.ts` — Schedule Service

Core business logic for scheduled audits.

**Functions:**
- `createSchedule(userId, data)` → Validates tier access, enforces `min_schedule_interval`, calculates `next_run_at` from cron expression, inserts row
- `updateSchedule(userId, scheduleId, data)` → Validates ownership, re-calculates `next_run_at` if cron changed
- `deleteSchedule(userId, scheduleId)` → Soft or hard delete with ownership check
- `getScheduleById(scheduleId)` → Full schedule with site info
- `getSchedulesByUser(userId)` → All schedules for user (across their sites)
- `getSchedulesBySite(siteId)` → All schedules for a site
- `toggleSchedule(userId, scheduleId, enabled)` → Enable/disable with paused_reason clear
- `getScheduleRunHistory(scheduleId, page, limit)` → Query `audit_jobs WHERE schedule_id = $1`
- `getDueSchedules()` → Query for poller: `WHERE enabled = true AND paused_reason IS NULL AND next_run_at <= NOW()`
- `markScheduleRun(scheduleId, auditJobId, status)` → Update `last_run_at`, `last_status`, `last_audit_id`, `run_count`, reset/increment `consecutive_failures`
- `pauseSchedule(scheduleId, reason)` → Set `paused_reason`, `paused_at`, `enabled = false`
- `getScheduleStats(userId)` → Count by status for dashboard widget

**Tier enforcement logic:**
```typescript
async function validateScheduleTier(siteId: string, cronExpression: string): Promise<void> {
  const tierLimits = await getSiteOwnerTierLimits(siteId);

  if (!tierLimits?.scheduled_audits) {
    throw new AppError('Scheduled audits are not available on your current plan', 'TIER_LIMIT', 403);
  }

  const minInterval = tierLimits.min_schedule_interval as string; // e.g., '7 days'
  const nextTwo = getNextTwoOccurrences(cronExpression);
  const intervalMs = nextTwo[1].getTime() - nextTwo[0].getTime();
  const minIntervalMs = parseInterval(minInterval);

  if (intervalMs < minIntervalMs) {
    throw new AppError(
      `Your plan requires at least ${minInterval} between scheduled audits`,
      'SCHEDULE_INTERVAL_TOO_SHORT',
      403
    );
  }
}
```

#### 2. `server/src/services/schedule-poller.service.ts` — Schedule Poller

Runs inside the worker process on a 60-second interval.

```typescript
export class SchedulePollerService {
  private pool: Pool;
  private interval: NodeJS.Timeout | null = null;
  private isProcessing = false;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  start(): void {
    // Poll every 60 seconds
    this.interval = setInterval(() => this.poll(), 60_000);
    // Run immediately on start
    this.poll();
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  private async poll(): Promise<void> {
    if (this.isProcessing) return; // Skip if still processing previous batch
    this.isProcessing = true;

    try {
      // Claim due schedules with row locking to prevent duplicate execution
      const dueSchedules = await this.pool.query(`
        UPDATE audit_schedules
        SET next_run_at = NULL  -- Clear to prevent re-pickup
        WHERE id IN (
          SELECT id FROM audit_schedules
          WHERE enabled = true
            AND paused_reason IS NULL
            AND next_run_at <= NOW()
          ORDER BY next_run_at ASC
          LIMIT 10
          FOR UPDATE SKIP LOCKED
        )
        RETURNING *
      `);

      for (const schedule of dueSchedules.rows) {
        await this.executeSchedule(schedule);
      }
    } catch (error) {
      console.error('Schedule poller error:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private async executeSchedule(schedule: AuditSchedule): Promise<void> {
    try {
      // 1. Verify tier still allows scheduling
      const tierLimits = await getSiteOwnerTierLimits(schedule.site_id);
      if (!tierLimits?.scheduled_audits) {
        await pauseSchedule(schedule.id, 'Plan no longer supports scheduled audits');
        return;
      }

      // 2. Check concurrent audit limit for the user
      const activeCount = await getActiveAuditCount(schedule.user_id);
      const maxConcurrent = (await getUserTierLimits(schedule.user_id))?.concurrent_audits || 3;
      if (activeCount >= maxConcurrent) {
        // Don't pause — just skip this run and reschedule
        await this.reschedule(schedule);
        return;
      }

      // 3. Create the audit job (reuse same logic as POST /api/audits)
      const auditJob = await createAuditFromSchedule(schedule);

      // 4. Calculate and set next_run_at
      const nextRun = getNextCronOccurrence(schedule.cron_expression, schedule.timezone);
      await markScheduleRun(schedule.id, auditJob.id, 'pending', nextRun);

      console.log(`📅 Scheduled audit created: ${schedule.target_url} (job ${auditJob.id})`);
    } catch (error) {
      console.error(`📅 Schedule ${schedule.id} failed:`, error);

      // Increment failure count
      await incrementScheduleFailure(schedule.id);

      // Check if we should pause
      if (schedule.consecutive_failures + 1 >= schedule.max_consecutive_failures) {
        await pauseSchedule(schedule.id, `Paused after ${schedule.max_consecutive_failures} consecutive failures`);
      } else {
        // Reschedule despite failure
        await this.reschedule(schedule);
      }
    }
  }

  private async reschedule(schedule: AuditSchedule): Promise<void> {
    const nextRun = getNextCronOccurrence(schedule.cron_expression, schedule.timezone);
    await this.pool.query(
      'UPDATE audit_schedules SET next_run_at = $2 WHERE id = $1',
      [schedule.id, nextRun]
    );
  }
}
```

#### 3. `server/src/types/schedule.types.ts` — TypeScript Types

```typescript
export interface AuditSchedule {
  id: string;
  user_id: string;
  site_id: string | null;
  organization_id: string | null;
  name: string | null;
  target_url: string;
  target_domain: string;
  config: AuditScheduleConfig;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom';
  cron_expression: string;
  timezone: string;
  next_run_at: string | null;
  last_run_at: string | null;
  last_status: 'completed' | 'failed' | null;
  last_audit_id: string | null;
  enabled: boolean;
  run_count: number;
  failure_count: number;
  consecutive_failures: number;
  max_consecutive_failures: number;
  paused_reason: string | null;
  paused_at: string | null;
  notify_on_completion: boolean;
  notify_on_failure: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuditScheduleConfig {
  maxPages?: number;
  maxDepth?: number;
  checkSeo?: boolean;
  checkAccessibility?: boolean;
  checkSecurity?: boolean;
  checkPerformance?: boolean;
  checkContent?: boolean;
  checkStructuredData?: boolean;
  checkFileExtraction?: boolean;
  wcagVersion?: string;
  wcagLevel?: string;
  respectRobotsTxt?: boolean;
  includeSubdomains?: boolean;
}

export interface CreateScheduleInput {
  targetUrl: string;
  siteId?: string;
  name?: string;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom';
  cronExpression?: string; // Only for 'custom' frequency
  timezone?: string;
  config?: AuditScheduleConfig;
  notifyOnCompletion?: boolean;
  notifyOnFailure?: boolean;
}

export interface UpdateScheduleInput {
  name?: string;
  frequency?: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom';
  cronExpression?: string;
  timezone?: string;
  config?: AuditScheduleConfig;
  enabled?: boolean;
  notifyOnCompletion?: boolean;
  notifyOnFailure?: boolean;
}
```

### Modified Files

#### 4. `server/src/routes/audits/index.ts` — Rewrite Schedule Endpoints

Replace the existing 3 basic endpoints (lines 2018-2092) with full CRUD + tier enforcement:

- **`POST /api/audits/schedules`** — Create schedule with tier validation
  - Validates `scheduled_audits` tier flag
  - Validates `min_schedule_interval` against chosen frequency
  - Resolves site from URL (reuse `findOrCreateSiteForDomain`)
  - Converts frequency preset → cron expression
  - Calculates initial `next_run_at`

- **`GET /api/audits/schedules`** — List user's schedules
  - Join with `sites` for domain/verification info
  - Join with `audit_jobs` for last run summary (score, issues)
  - Filter by `?siteId=` optional param

- **`GET /api/audits/schedules/:id`** — Get schedule detail
  - Include run history (last 10 audit_jobs)
  - Include site info

- **`PATCH /api/audits/schedules/:id`** — Update schedule
  - Validate ownership/permissions
  - Re-validate tier limits if frequency changes
  - Recalculate `next_run_at` if cron changes
  - Clear `paused_reason` if re-enabling

- **`DELETE /api/audits/schedules/:id`** — Delete schedule
  - Ownership check
  - Hard delete (schedules are lightweight)

- **`POST /api/audits/schedules/:id/toggle`** — Enable/disable
  - Quick toggle endpoint
  - Clear `paused_reason` + `consecutive_failures` on re-enable
  - Recalculate `next_run_at` on re-enable

- **`GET /api/audits/schedules/:id/runs`** — Run history
  - Paginated list of `audit_jobs` triggered by this schedule

#### 5. `server/src/worker.ts` — Integrate Schedule Poller

Add the `SchedulePollerService` alongside the existing audit and campaign workers:

```typescript
import { createSchedulePoller } from './services/schedule-poller.service';

// ... existing worker setup ...

const schedulePoller = createSchedulePoller({ pool });

// Start all workers
Promise.all([
  worker.start(),
  campaignWorker.start(),
  schedulePoller.start(),
]).catch(async (error) => { ... });

// Graceful shutdown
const shutdown = async (signal: string) => {
  await Promise.all([worker.stop(), campaignWorker.stop(), schedulePoller.stop()]);
  ...
};
```

#### 6. `server/src/routes/admin/index.ts` — Admin Schedule Management

Add admin endpoints after existing feature-requests routes:

- **`GET /api/admin/schedules`** — All schedules with user/site info, filterable by status/tier
- **`GET /api/admin/schedules/stats`** — Aggregate stats (active, paused, total runs today)
- **`GET /api/admin/schedules/:id`** — Detail with full run history
- **`PATCH /api/admin/schedules/:id`** — Admin override (force enable/disable, change limits)
- **`DELETE /api/admin/schedules/:id`** — Admin delete

## Frontend Changes

### New Files

#### 7. `client/src/pages/schedules/ScheduleListPage.tsx` — Schedule List

Main schedules page accessible from sidebar.

**Layout:**
- Stats bar: Active schedules count, Next run time, Total runs this month, Paused count
- Filter tabs: All | Active | Paused | Disabled
- Table/card list:
  - Schedule name (or URL if no name)
  - Site domain + verification badge
  - Frequency badge (Daily, Weekly, etc.)
  - Next run countdown/date
  - Last run status (green check / red X / gray dash)
  - Last scores mini-display (small colored dots)
  - Actions: Edit, Toggle, Delete
- Empty state with CTA to create first schedule
- "New Schedule" button (gated by tier — shows upgrade prompt for Free tier)

#### 8. `client/src/pages/schedules/ScheduleDetailPage.tsx` — Schedule Detail

Detailed view of a single schedule.

**Layout:**
- Header: Schedule name, URL, frequency, enable/disable toggle
- Info cards: Next run, Last run, Total runs, Success rate
- Run history table:
  - Date/time
  - Status (completed/failed/pending)
  - Scores (mini score display)
  - Issues count
  - Duration
  - Link to full audit detail
- Settings panel (inline editable):
  - Name, URL, frequency, timezone
  - Audit configuration (checks to run, max pages, max depth)
  - Notification preferences
- Danger zone: Pause / Delete

#### 9. `client/src/components/schedules/CreateScheduleModal.tsx` — Create/Edit Modal

Shared modal for creating and editing schedules.

**Fields:**
- URL input (with domain auto-detection + verification status)
- Name (optional, auto-generated from domain if blank)
- Frequency selector: Radio cards for Daily / Weekly / Biweekly / Monthly
  - Custom option visible only for Agency/Enterprise tiers
  - Shows `min_schedule_interval` restriction per tier
- Day of week picker (for weekly/biweekly: Mon-Sun toggle buttons)
- Time picker (hour selector + timezone dropdown)
- Audit config section (collapsible "Advanced"):
  - Check toggles: SEO, Accessibility, Security, Performance, Content
  - Max pages slider
  - Max depth dropdown
- Notification toggles: "Email me when complete" / "Email me on failure"

**Tier gating:**
- Free users see an upgrade prompt instead of the form
- Starter users see "Weekly or less frequent" constraint
- Custom cron only for Agency/Enterprise

#### 10. `client/src/components/schedules/ScheduleCard.tsx` — Reusable Schedule Card

Used in the list page and potentially on the site detail page.

### Modified Files

#### 11. `client/src/services/api.ts` — API Client Methods

Add types and API methods:

```typescript
// Types
export interface AuditScheduleSummary {
  id: string;
  name: string | null;
  target_url: string;
  target_domain: string;
  frequency: string;
  cron_expression: string;
  timezone: string;
  next_run_at: string | null;
  last_run_at: string | null;
  last_status: 'completed' | 'failed' | null;
  last_audit_id: string | null;
  enabled: boolean;
  run_count: number;
  consecutive_failures: number;
  paused_reason: string | null;
  site_verified: boolean;
  // Last run scores (joined)
  last_seo_score: number | null;
  last_accessibility_score: number | null;
  last_security_score: number | null;
  last_performance_score: number | null;
}

// API namespace
export const schedulesApi = {
  list: (params?: { siteId?: string }) =>
    api.get<{ schedules: AuditScheduleSummary[] }>('/audits/schedules', { params }),

  get: (id: string) =>
    api.get<{ schedule: AuditScheduleDetail }>(`/audits/schedules/${id}`),

  create: (data: CreateScheduleInput) =>
    api.post<{ schedule: AuditScheduleDetail }>('/audits/schedules', data),

  update: (id: string, data: UpdateScheduleInput) =>
    api.patch<{ schedule: AuditScheduleDetail }>(`/audits/schedules/${id}`, data),

  delete: (id: string) =>
    api.delete(`/audits/schedules/${id}`),

  toggle: (id: string, enabled: boolean) =>
    api.post(`/audits/schedules/${id}/toggle`, { enabled }),

  getRuns: (id: string, params?: { page?: number; limit?: number }) =>
    api.get<{ runs: AuditJobSummary[]; total: number; totalPages: number }>(
      `/audits/schedules/${id}/runs`, { params }
    ),
};

// Admin API
export const adminSchedulesApi = {
  list: (params?: { status?: string; page?: number }) =>
    api.get('/admin/schedules', { params }),
  getStats: () =>
    api.get('/admin/schedules/stats'),
  get: (id: string) =>
    api.get(`/admin/schedules/${id}`),
  update: (id: string, data: any) =>
    api.patch(`/admin/schedules/${id}`, data),
  delete: (id: string) =>
    api.delete(`/admin/schedules/${id}`),
};
```

#### 12. `client/src/components/layout/Sidebar.tsx` — Add Schedules Nav Item

Add to `mainNavItems` array (after Sites, before Analytics):

```typescript
{ href: '/schedules', label: 'Schedules', icon: CalendarClock },
```

#### 13. `client/src/App.tsx` — Add Schedule Routes

```typescript
import ScheduleListPage from './pages/schedules/ScheduleListPage';
import ScheduleDetailPage from './pages/schedules/ScheduleDetailPage';

// In dashboard routes:
<Route path="/schedules" element={<ScheduleListPage />} />
<Route path="/schedules/:id" element={<ScheduleDetailPage />} />

// In admin routes:
<Route path="/admin/schedules" element={<AdminSchedules />} />
<Route path="/admin/schedules/:id" element={<AdminScheduleDetail />} />
```

#### 14. `client/src/components/layout/AdminLayout.tsx` — Add Admin Nav Item

Add to the Overview group:

```typescript
{ href: '/admin/schedules', label: 'Schedules', icon: CalendarClock }
```

#### 15. Admin Pages

- **`client/src/pages/admin/AdminSchedules.tsx`** — List all schedules with filters (status, tier, user), stats cards
- **`client/src/pages/admin/AdminScheduleDetail.tsx`** — View/manage individual schedule, force run, pause, delete

## Frequency-to-Cron Mapping

| Frequency | Cron Expression | Description |
|-----------|----------------|-------------|
| `daily` | `0 {hour} * * *` | Every day at chosen hour |
| `weekly` | `0 {hour} * * {dow}` | Every week on chosen day at chosen hour |
| `biweekly` | `0 {hour} {1,15} * *` | 1st and 15th of each month at chosen hour |
| `monthly` | `0 {hour} 1 * *` | 1st of each month at chosen hour |
| `custom` | User-provided | Agency/Enterprise only |

Default: `weekly` on Monday at 6:00 AM UTC = `0 6 * * 1`

## Audit Creation from Schedule

When the poller executes a schedule, it must create an `audit_job` that mirrors the logic in `POST /api/audits`. Key considerations:

1. **Site resolution**: Use `schedule.site_id` directly (already resolved at schedule creation)
2. **Tier limits**: Re-check at execution time (user may have downgraded)
3. **Domain verification**: Check `sites.verified` — unverified domains get restricted mode
4. **Consent**: Not required for scheduled audits on verified domains; schedules on unverified domains should be blocked at creation time
5. **Concurrent limit check**: If user has too many active audits, skip this run (don't fail)
6. **Config**: Use `schedule.config` JSONB for all audit options
7. **`schedule_id` reference**: Set `audit_jobs.schedule_id` so we can track run history

## Security Considerations

- **Tier enforcement at creation AND execution**: User could create a schedule on Pro, then downgrade to Free. The poller must re-validate tier access before creating the audit job.
- **No scheduling unverified domains**: Schedules require the domain to be verified (or at minimum, the site to exist). Prevent scheduling audits on arbitrary URLs without verification.
- **Rate limiting**: The poller processes at most 10 schedules per poll cycle, preventing thundering herd if many schedules are due simultaneously.
- **User ownership**: All schedule endpoints verify user ownership or site membership before allowing access.
- **Schedule limits per tier**: Consider adding `max_schedules` to tier_limits (e.g., Starter: 3, Pro: 10, Agency: 50, Enterprise: unlimited).

## Testing Plan

1. **Unit tests for cron parsing**: Verify frequency-to-cron conversion and `next_run_at` calculation
2. **Integration tests for schedule CRUD**: Create, read, update, delete with tier enforcement
3. **Poller tests**:
   - Due schedule creates audit job
   - Skipped when concurrent limit reached
   - Paused after consecutive failures
   - Tier re-validation at execution time
4. **Frontend E2E**:
   - Create schedule from schedules page
   - View schedule list with status indicators
   - Edit schedule frequency
   - Toggle enable/disable
   - View run history
5. **Admin tests**: List/filter/manage schedules, force actions

## Implementation Order

1. **Database migration** (`065_enhance_audit_schedules.sql`)
2. **Install `croner`** — `npm install croner` in server
3. **Backend types** (`schedule.types.ts`)
4. **Schedule service** (`schedule.service.ts`)
5. **Schedule poller** (`schedule-poller.service.ts`)
6. **Rewrite API routes** (audits/index.ts schedule endpoints)
7. **Integrate poller into worker** (worker.ts)
8. **Admin routes** (admin/index.ts)
9. **Frontend API client** (api.ts)
10. **Frontend pages**: ScheduleListPage → CreateScheduleModal → ScheduleDetailPage → ScheduleCard
11. **Sidebar + App.tsx routes**
12. **Admin pages**: AdminSchedules → AdminScheduleDetail
13. **Admin nav** (AdminLayout.tsx)

## Critical Files Summary

### New Files (10)
| # | File | Purpose |
|---|------|---------|
| 1 | `server/src/db/migrations/065_enhance_audit_schedules.sql` | Schema enhancements |
| 2 | `server/src/types/schedule.types.ts` | TypeScript types |
| 3 | `server/src/services/schedule.service.ts` | Business logic |
| 4 | `server/src/services/schedule-poller.service.ts` | Execution engine |
| 5 | `client/src/pages/schedules/ScheduleListPage.tsx` | User list page |
| 6 | `client/src/pages/schedules/ScheduleDetailPage.tsx` | User detail page |
| 7 | `client/src/components/schedules/CreateScheduleModal.tsx` | Create/edit modal |
| 8 | `client/src/components/schedules/ScheduleCard.tsx` | Reusable card component |
| 9 | `client/src/pages/admin/AdminSchedules.tsx` | Admin list page |
| 10 | `client/src/pages/admin/AdminScheduleDetail.tsx` | Admin detail page |

### Modified Files (7)
| # | File | Change |
|---|------|--------|
| 1 | `server/src/routes/audits/index.ts` | Rewrite schedule endpoints with full CRUD + tier enforcement |
| 2 | `server/src/worker.ts` | Add schedule poller startup/shutdown |
| 3 | `server/src/routes/admin/index.ts` | Add admin schedule routes |
| 4 | `client/src/services/api.ts` | Add schedule types + API methods |
| 5 | `client/src/components/layout/Sidebar.tsx` | Add Schedules nav item |
| 6 | `client/src/components/layout/AdminLayout.tsx` | Add admin Schedules nav |
| 7 | `client/src/App.tsx` | Add schedule routes (user + admin) |
