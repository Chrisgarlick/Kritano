<!-- Version: 2 | Department: qa | Updated: 2026-04-02 -->

# Static Analysis Report

**Date:** 2026-04-02
**Branch:** phase-16

---

## TypeScript Compilation

| Project | Status | Errors | Warnings |
|---------|--------|--------|----------|
| Client (`client/`) | **PASS** | 0 | 0 |
| Server (`server/`) | **PASS** | 0 | 0 |

Both projects compile cleanly with `tsc --noEmit`.

---

## ESLint

| Project | Errors | Auto-fixable | Rule |
|---------|--------|-------------|------|
| Client | ~60 | No | `@typescript-eslint/no-explicit-any` |
| Server | ~48 | No | `@typescript-eslint/no-explicit-any` |

**Total:** ~108 `no-explicit-any` violations across both projects.

**Severity:** LOW — These are type-safety warnings, not runtime errors. All are `any` type annotations in event handlers, API response types, and test mocks.

### Highest-concentration files (server):
- `server/src/routes/audits/index.ts` — 32 violations (route handler `req`/`res` types)
- `server/src/routes/analytics/index.ts` — 10 violations
- `server/src/routes/sites/index.ts` — 5 violations

### Highest-concentration files (client):
- `client/src/pages/admin/AdminBugReportDetail.tsx` — 10 violations
- `client/src/components/audit/RichSnippetPreview.tsx` — 5 violations
- `client/src/components/analytics/ScoreRadarChart.tsx` — 3 violations (Recharts callback types)

**Suggested Fix:** For Recharts callbacks, use the library's exported types (e.g., `TooltipProps`). For Express route handlers, type `req.params`, `req.body`, and `req.query` explicitly.

**No other ESLint categories violated** — no unused imports, no React hook violations, no accessibility lint failures.

---

## Circular Dependency Check

Not run — `madge` not installed in devDependencies. Recommend adding for future runs:
```
npm install --save-dev madge
```

**Severity:** INFO — No circular import errors surfaced during TypeScript compilation or Vite build, suggesting no blocking cycles exist.

---

## Environment Variable Audit

### Server (`server/src/`)
All `process.env.*` references cross-checked against `server/.env.example`:

| Variable | In Source | In .env.example | Status |
|----------|----------|-----------------|--------|
| `DATABASE_URL` | Yes | Yes | OK |
| `REDIS_URL` | Yes | Yes | OK |
| `JWT_SECRET` | Yes | Yes | OK |
| `NODE_ENV` | Yes | Yes | OK |
| `PORT` | Yes | Yes | OK |
| `CORS_ORIGIN` | Yes | Yes | OK |
| `LOG_LEVEL` | Yes | Yes | OK |
| `PG_POOL_MAX` | Yes | Yes | OK |
| `SMTP_HOST` | Yes | Yes | OK |
| `SMTP_PORT` | Yes | Yes | OK |
| `SMTP_USER` | Yes | Yes | OK |
| `SMTP_PASS` | Yes | Yes | OK |
| `RESEND_API_KEY` | Yes | Yes | OK |
| `EMAIL_FROM` | Yes | Yes | OK |
| `RESEND_WEBHOOK_SECRET` | Yes | Yes | OK |
| `APP_URL` | Yes | Yes | OK |
| `STRIPE_SECRET_KEY` | Yes | Yes | OK |
| `STRIPE_WEBHOOK_SECRET` | Yes | Yes | OK |
| `STRIPE_PRICE_*` (4 tiers) | Yes | Yes | OK |
| `STRIPE_COUPON_EARLY_ACCESS` | Yes | Yes | OK |
| `BUSINESS_ADDRESS` | Yes | Yes | OK |
| `GOOGLE_CLIENT_ID` | Yes | Yes | OK |
| `GOOGLE_CLIENT_SECRET` | Yes | Yes | OK |
| `FACEBOOK_APP_ID` | Yes | Yes | OK |
| `FACEBOOK_APP_SECRET` | Yes | Yes | OK |
| `COLD_OUTREACH_MODE` | Yes | Yes | OK |
| `SCANNER_IPS` | Yes | Yes | OK |
| `WORKER_HEALTH_PORT` | Yes | Yes | OK |
| `WORKER_MAX_CONCURRENT_JOBS` | Yes | Yes | OK |
| `WORKER_POLLING_MS` | Yes | Yes | OK |
| `WORKER_POOL_SIZE` | Yes | Yes | OK |
| `DISCOVERY_MAX_CONCURRENT` | Yes | Yes | OK |
| `SENTRY_DSN` | Yes | Yes | OK |
| `SEED_*` (4 vars) | Yes | Yes | OK |
| `WORKER_MEMORY_THRESHOLD` | Yes | Yes | OK |
| `GOOGLE_CSE_API_KEY` | Yes | Yes | OK |
| `GOOGLE_CSE_ID` | Yes | Yes | OK |

**All environment variables accounted for.** No missing keys, no hardcoded secrets in source.

### Client (`client/src/`)
- **No `VITE_` or `import.meta.env` references** found in client source.
- Client is fully server-driven (API calls) — no client-side env vars needed.

### .gitignore Coverage
- `.env`, `.env.local`, `.env.*.local` — all listed in `.gitignore`. **PASS.**

---

## Summary

| Check | Status | Issues |
|-------|--------|--------|
| TypeScript | **PASS** | 0 errors |
| ESLint | **WARN** | ~108 `no-explicit-any` (low severity) |
| Circular Deps | **SKIP** | `madge` not installed |
| Env Vars | **PASS** | All accounted for |
| .gitignore | **PASS** | .env files excluded |
