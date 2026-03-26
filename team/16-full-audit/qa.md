# QA Audit

**Overall Assessment:** NEEDS WORK
**Score:** 4/10

## What's Working Well

1. **TypeScript strict mode is enabled on both server and client.** Server `tsconfig.json` has `"strict": true` and client has `"strict": true` plus `noUnusedLocals` and `noUnusedParameters`. This catches a large class of bugs at compile time.

2. **CI/CD pipeline exists and covers the fundamentals.** `.github/workflows/ci.yml` runs lint, type check, and tests for the server, and lint, type check, and build for the client. It provisions real Postgres and Redis services for server tests. Branch triggers cover `main` and `phase-*` branches.

3. **Server unit tests are well-structured where they exist.** `audits.api.test.ts` (344 lines, 14 test cases) covers CRUD, authorization edge cases, export endpoints, and error responses. `seo.engine.test.ts` (269 lines, 25+ test cases) thoroughly validates SEO rule detection with positive and negative cases.

4. **Playwright E2E suite is purpose-built and useful.** Mobile-specific tests cover public routes (14 routes), protected routes (15 routes), and admin routes (25 routes) for horizontal overflow, clipped content, and tap target sizing. Auth fixtures and setup file show proper test infrastructure.

5. **ESLint and Prettier are configured consistently.** Both client and server have flat ESLint configs with sensible rules (`no-explicit-any` as warning, unused vars detection, `no-var`). Prettier config enforces single quotes, trailing commas, and 100-char line width.

## Issues Found

### Extremely Low Server Test Coverage
**Severity:** CRITICAL
**Location:** `server/src/__tests__/` (only 2 test files)
**Finding:** There are only 2 test files covering 165 server source files. Only the audits API routes and the SEO engine have tests. Major untested areas include: all auth routes, analytics service, organization service, email service, GDPR service, PDF report service, blog service, cold prospect services, Stripe webhook handler, rate limiting middleware, and all other API routes.
**Impact:** Bugs in authentication, billing, data export, email, and GDPR compliance could ship undetected. The audit service (the core product) has some coverage, but supporting services have zero.
**Recommendation:** Prioritize tests for auth routes, Stripe webhook handler, rate limiting middleware, and GDPR service. These are security- and compliance-critical paths. Use the existing vitest + supertest pattern from `audits.api.test.ts` as a template.

### Zero Frontend Unit/Component Tests
**Severity:** HIGH
**Location:** `client/src/`
**Finding:** There are no unit or component tests anywhere in the client codebase (0 `.test.ts`, 0 `.test.tsx`, 0 `.spec.ts` files in `client/src/`). No test runner (vitest, jest) is configured for the client. The CI pipeline only runs lint, type check, and build for the client -- no test step.
**Impact:** UI logic bugs, form validation issues, state management problems, and component regressions are only caught by manual testing or the limited Playwright E2E suite. With 182 source files, this is a significant gap.
**Recommendation:** Add vitest to the client with React Testing Library. Start with tests for critical user flows: login/register forms, audit creation, dashboard data rendering, and any components with conditional logic.

### Playwright Config Missing Desktop Browser Projects
**Severity:** MEDIUM
**Location:** `playwright.config.ts`
**Finding:** The Playwright config only defines mobile projects (`mobile-safari` via iPhone 12, `mobile-chrome` via Pixel 5). There are no desktop browser projects (Chromium, Firefox, WebKit). All E2E tests only run on mobile viewports.
**Impact:** Desktop layout regressions, hover interactions, and desktop-specific UI behavior are completely untested by automation.
**Recommendation:** Add at least a `chromium` desktop project to the Playwright config. The existing mobile tests are valuable, but desktop is likely the primary usage context for a SaaS auditing tool.

### No Test Coverage Reporting in CI
**Severity:** MEDIUM
**Location:** `.github/workflows/ci.yml`
**Finding:** The server has a `test:coverage` script configured (`vitest run --coverage`), but CI runs `npm test` (plain `vitest run`) without coverage. No coverage thresholds are enforced, and no coverage reports are uploaded or tracked.
**Impact:** Test coverage can silently decline over time with no visibility. There is no gate preventing PRs that reduce coverage from merging.
**Recommendation:** Switch CI to `npm run test:coverage`, set a minimum coverage threshold in vitest config (start low, e.g., 30%, and ratchet up), and consider uploading coverage reports to a service like Codecov.

### ESLint Rules Are Too Lenient
**Severity:** MEDIUM
**Location:** `client/eslint.config.mjs`, `server/eslint.config.mjs`
**Finding:** `@typescript-eslint/no-explicit-any` is set to `warn` with a comment "tighten to error later." `no-empty` (catching swallowed errors) is also only `warn`. `prefer-const` is `warn`. None of these will block CI since ESLint typically only fails on errors.
**Impact:** `any` types proliferate without consequence, empty catch blocks silently swallow errors, and code quality rules have no enforcement teeth. Warnings are routinely ignored.
**Recommendation:** Promote `no-explicit-any` and `no-empty` (with `allowEmptyCatch: false`) to `error`. If there are too many existing violations, fix them in a dedicated cleanup pass and then flip to `error`.

### Skipped Tests in Audit API Suite
**Severity:** LOW
**Location:** `server/src/__tests__/audits.api.test.ts` (lines 258-281)
**Finding:** Two test groups (`GET /api/audits/check-url` and `GET /api/audits/recent-urls`) are marked with `describe.skip` due to Express route ordering issues in the test setup.
**Impact:** These endpoints have no automated test coverage. The comment says "The actual endpoints work correctly in the running server," but this is unverified by CI.
**Recommendation:** Fix the test app's route mounting order to match the production server, or test these endpoints via integration tests against the real server.

### No Playwright Tests in CI
**Severity:** MEDIUM
**Location:** `.github/workflows/ci.yml`
**Finding:** The CI workflow has no job for running Playwright E2E tests. The Playwright tests exist but are only runnable locally.
**Impact:** Mobile overflow regressions, authentication flow breakages, and navigation issues are not caught before merge.
**Recommendation:** Add a Playwright CI job. This requires both client and server running, so it may need a docker-compose setup or careful service orchestration. Even running just the public route tests (which don't require auth) would add value.

## Opportunities

1. **Add integration tests against a real database.** The current server tests mock the database pool. While fast, they don't catch SQL errors, missing columns, or migration issues. The CI already provisions Postgres and Redis -- use them for at least a subset of integration tests.

2. **Implement snapshot or visual regression testing.** Given the large number of UI pages (80+ routes across public, protected, and admin), visual regression testing (e.g., Playwright visual comparisons or Chromatic) would catch unintended styling changes efficiently.

3. **Add API contract testing.** With a growing API surface, consider adding schema validation tests (e.g., using zod schemas that already exist in the codebase) to ensure API responses match expected shapes.

4. **Create a pre-commit hook for lint and type check.** Currently these only run in CI. A husky + lint-staged setup would catch issues before they're committed, shortening the feedback loop.

5. **Add load/stress testing for the audit engine.** As the core product feature, the audit crawling and analysis pipeline would benefit from performance baselines to detect regressions in processing speed or memory usage.

## Summary

PagePulser has solid foundational tooling -- TypeScript strict mode, ESLint, Prettier, a CI pipeline, and the beginnings of both unit and E2E test suites. However, test coverage is critically low. The server has only 2 test files covering roughly 1% of its 165 source files, the client has zero tests, and the Playwright E2E suite only covers mobile viewports and is not integrated into CI. The existing tests that do exist are well-written and follow good patterns, which means the team knows how to write tests -- they just need to write more of them. The most urgent priorities are: (1) adding tests for auth, billing, and GDPR-critical server paths, (2) integrating Playwright into CI, and (3) promoting key ESLint rules from warning to error so code quality enforcement has real teeth.
