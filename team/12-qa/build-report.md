<!-- Version: 2 | Department: qa | Updated: 2026-04-02 -->

# Build Verification Report

**Date:** 2026-04-02
**Branch:** phase-16

---

## Build Results

### Client (Vite + React)
- **Command:** `npm run build`
- **Status:** **PASS**
- **Build time:** 5.74s
- **Output directory:** `client/dist/` (12MB total incl. source maps)
- **Errors:** 0
- **Warnings:** 0

### Server (TypeScript)
- **Command:** `npm run build` (`tsc`)
- **Status:** **PASS**
- **Build time:** <3s
- **Errors:** 0
- **Warnings:** 0

---

## Test Suite Results

### Client Tests (Vitest + React Testing Library)
- **Test files:** 10 passed, 0 failed
- **Tests:** 129 passed, 0 failed
- **Duration:** 3.22s

### Server Tests (Vitest)
- **Test files:** 13 passed, **2 failed**
- **Tests:** 172 passed, 2 skipped
- **Duration:** 881ms

### Failed Tests

#### 1. `auth.api.test.ts` — HIGH severity
**Error:** `ReferenceError: Cannot access 'mockUserService' before initialization`
**Root cause:** `vi.mock` factory references a variable declared after the mock. Vitest hoists `vi.mock` to the top of the file, but the variable isn't available yet.
**Suggested fix:** Move mock object inside the `vi.mock` factory, then use `vi.mocked()` in tests.

#### 2. `email.service.test.ts` — MEDIUM severity
**Error:** `Error: JWT_SECRET environment variable is required`
**Root cause:** `email-preference.service.ts` throws at import time if `JWT_SECRET` is missing.
**Suggested fix:** Add `process.env.JWT_SECRET = 'test-secret'` in `beforeAll`.

---

## Route Enumeration

**Total routes:** 78

| Category | Count | Status |
|----------|-------|--------|
| Public (pages + auth) | 16 | All build |
| Content (docs + blog) | 8 | All build |
| Protected (app) | 20 | All build |
| Settings (nested) | 5 | All build |
| Admin | 30 | All build |
| Utility (invitations, unsubscribe, shared reports) | 3 | All build |
| Error (500 + 404 catch-all) | 2 | All build |

All 78 routes compile and code-split correctly via `React.lazy()`.

---

## Summary

| Check | Status | Details |
|-------|--------|---------|
| Client build | **PASS** | 0 errors, 5.74s |
| Server build | **PASS** | 0 errors |
| Client tests | **PASS** | 129/129 |
| Server tests | **FAIL** | 172/174 pass (2 test setup issues) |
| Route coverage | **PASS** | 78 routes, all build cleanly |
