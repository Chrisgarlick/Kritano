# Database & Infrastructure Optimisation

## Overview

A comprehensive cleanup of the PostgreSQL schema and Docker infrastructure to reduce memory usage, remove redundant objects accumulated across 90 migrations, and tune container resource limits. The database had grown organically through multiple architectural phases (org-centric → user-centric) leaving behind dead tables, duplicate indexes, redundant trigger functions, and unconstrained columns.

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| Drop redundant indexes rather than add new ones | Indexes consume memory (shared_buffers) and slow writes. Removing 10 redundant indexes frees significant memory. |
| Consolidate trigger functions | 6 identical `updated_at` functions → 1 shared function. Each function definition consumes catalog memory. |
| Drop `site_known_pages` table | Fully replaced by `site_urls` in migration 025. Zero references in application code. |
| Constrain TEXT → VARCHAR | Unbounded TEXT columns increase planner overhead. Practical limits prevent runaway inserts. |
| Keep organisation tables | Despite the user-centric migration, org tables are still actively referenced in 8+ service files. Not safe to drop yet. |
| Tune PostgreSQL at container level | Default Alpine PostgreSQL settings are far too conservative for a dev environment with 90 tables and heavy JSONB usage. |

---

## What Changed

### Migration 091: `091_schema_cleanup_memory_optimization.sql`

#### 1. Redundant Indexes Dropped (10 total)

| Index | Table | Why Redundant |
|-------|-------|---------------|
| `idx_audit_findings_category` | audit_findings | Covered by composite `idx_audit_findings_category_severity(job_id, category, severity)` |
| `idx_audit_findings_severity` | audit_findings | Covered by same composite index |
| `idx_audit_findings_rule_category` | audit_findings | Overlaps with `idx_audit_findings_rule(job_id, rule_id)` |
| `idx_audit_findings_job_created` | audit_findings | Overlaps with existing category/severity indexes |
| `idx_rate_limits_identifier` | rate_limit_records | Exact duplicate of `UNIQUE(identifier, action)` constraint |
| `idx_audit_jobs_user_status` | audit_jobs | Redundant with `idx_audit_jobs_user_id` + partial indexes for pending/processing |
| `idx_audit_jobs_org_completed` | audit_jobs | Organisation-era index, superseded by site-based queries |
| `idx_subscriptions_org` | subscriptions | Duplicate of `UNIQUE(organization_id)` constraint |
| `idx_organizations_slug` | organizations | Duplicate of `UNIQUE(slug)` constraint |
| `idx_org_invites_token` | organization_invitations | Duplicate of `UNIQUE(token)` constraint |

**Impact**: Each B-tree index consumes memory in `shared_buffers` and adds overhead to every INSERT/UPDATE/DELETE. Removing 10 redundant indexes reduces write amplification and frees buffer pool space.

#### 2. Dead Objects Removed

| Object | Type | Why Dead |
|--------|------|----------|
| `site_known_pages` | Table | Replaced by `site_urls` in migration 025. Zero references in `server/src/`. |
| `create_default_subscription()` | Function + Trigger | Org-era auto-creation trigger. App now creates subscriptions explicitly. |
| `add_owner_as_member()` | Function + Trigger | Org-era auto-creation trigger. App now manages membership explicitly. |

#### 3. Trigger Function Consolidation

**Before**: 6 near-identical functions doing `NEW.updated_at = NOW(); RETURN NEW;`

| Old Function | Created In |
|-------------|------------|
| `update_updated_at_column()` | Migration 001 |
| `update_audit_jobs_updated_at()` | Migration 006 |
| `update_updated_at()` | Migration 016 |
| `update_site_timestamp()` | Migration 019 |
| `update_site_urls_timestamp()` | Migration 029 |
| `update_competitor_profile_timestamp()` | Migration 018 |

**After**: Single `shared_update_timestamp()` function used by all 10 tables with `updated_at` columns:

- `users`
- `audit_jobs`
- `organizations`
- `organization_members`
- `subscriptions`
- `organization_domains`
- `usage_records`
- `sites`
- `site_urls`
- `competitor_profiles`

#### 4. TEXT Column Constraints

| Column | Table | Old Type | New Type | Rationale |
|--------|-------|----------|----------|-----------|
| `snippet` | audit_findings | TEXT | VARCHAR(500) | Already documented as "limited to 500 chars" |
| `selector` | audit_findings | TEXT | VARCHAR(1000) | CSS selectors have practical limits |
| `help_url` | audit_findings | TEXT | VARCHAR(2048) | URL max length |
| `current_url` | audit_jobs | TEXT | VARCHAR(2048) | URL max length |
| `error_message` | audit_jobs | TEXT | VARCHAR(2000) | Error messages don't need to be unbounded |
| `worker_id` | audit_jobs | TEXT | VARCHAR(100) | Worker identifiers are short strings |

---

### Docker Configuration: `docker-compose.yml`

#### PostgreSQL Tuning

| Setting | Old (Default) | New | Purpose |
|---------|--------------|-----|---------|
| `shared_buffers` | 32MB (Alpine default) | 128MB | Main data cache — larger = fewer disk reads |
| `work_mem` | 4MB (default) | 4MB | Per-sort/hash memory — kept conservative to avoid OOM with concurrent queries |
| `effective_cache_size` | 128MB (default) | 256MB | Planner hint for how much OS cache is available |
| `maintenance_work_mem` | 64MB (default) | 64MB | Memory for VACUUM, CREATE INDEX |
| `max_connections` | 100 (default) | 50 | Each connection reserves ~10MB. 50 is plenty for dev. Saves ~500MB potential overhead. |
| `statement_timeout` | 0 (none) | 30s | Kills runaway queries that would consume memory indefinitely |
| `idle_in_transaction_session_timeout` | 0 (none) | 60s | Kills forgotten transactions holding locks and memory |
| Container memory limit | Unlimited | 512MB | Hard cap prevents PostgreSQL from consuming all Docker memory |

#### Redis Tuning

| Setting | Old | New | Purpose |
|---------|-----|-----|---------|
| `maxmemory` | Unlimited | 128MB | Prevents unbounded memory growth from BullMQ job data |
| `maxmemory-policy` | N/A | `allkeys-lru` | Evicts least-recently-used keys when limit is hit |
| Container memory limit | Unlimited | 256MB | Hard cap on container |

---

## What Was NOT Changed (And Why)

### Organisation Tables — Still Active
Despite the user-centric migration (025/029), these tables are still actively referenced across 8+ service files:

- `organizations` — 24+ references
- `organization_members` — 24+ references
- `organization_domains` — 27+ references
- `organization_invitations` — 8 references
- `organization_audit_log` — 3 references
- `competitor_profiles` — 10 references
- `audit_comparisons` — 5 references

**These require a separate migration to remove properly**, with corresponding service code refactoring.

### Email Template Deduplication
20+ templates are seeded as large JSONB blocks across migrations 051–089. Consolidating these into a seed file would reduce migration size but doesn't affect runtime memory since the data volume is small.

### Table Partitioning
`api_requests` and `email_sends` would benefit from time-based partitioning at scale, but with an empty database this is premature.

---

## Future Optimisation Opportunities

| Priority | Item | Estimated Impact |
|----------|------|-----------------|
| High | Remove organisation tables + service code migration | Drops ~6 tables, ~15 indexes, ~5 triggers |
| Medium | Partition `api_requests` and `email_sends` by month | Faster queries, auto-archival |
| Medium | Consolidate tier_limits updates (10+ migrations) into single seed | Cleaner migrations, no runtime impact |
| Low | Add VIEWs for common composite queries | Reduce denormalisation maintenance |
| Low | Add missing indexes (`users.email_verified`, `audit_jobs.created_at DESC`) | Faster common queries |

---

## Testing

After running the migration:

```bash
# Verify migration applied
cd server && npm run migrate

# Verify PostgreSQL settings
docker exec kritano-db psql -U kritano -d kritano -c "SHOW shared_buffers; SHOW work_mem; SHOW max_connections;"

# Verify redundant indexes are gone
docker exec kritano-db psql -U kritano -d kritano -c "SELECT indexname FROM pg_indexes WHERE tablename = 'audit_findings' ORDER BY indexname;"

# Verify dead table dropped
docker exec kritano-db psql -U kritano -d kritano -c "SELECT tablename FROM pg_tables WHERE tablename = 'site_known_pages';"
```

## Implementation Order

1. ~~Docker memory tuning (docker-compose.yml)~~ Done
2. ~~Migration 091 — index cleanup, dead object removal, trigger consolidation, column constraints~~ Done
3. Future: Organisation table removal (requires service code changes)
4. Future: Table partitioning (when data volume warrants it)
