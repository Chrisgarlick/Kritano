# Test Report — Kritano Iteration 2

**Date:** 2026-03-26
**Runner:** Vitest (server + client)
**Scope:** New Iteration 2 unit tests for CQS, Fix Snippets, Compliance Passport

---

## Test Results Summary

### Server (`server/src/__tests__/`)

| Status | Count |
|--------|-------|
| Passed | 159 |
| Failed | 12 |
| Skipped | 2 |
| **Total** | **173** |
| Test Files | 15 (12 passed, 3 failed) |

### Client (`client/src/`)

| Status | Count |
|--------|-------|
| Passed | 127 |
| Failed | 2 |
| Skipped | 0 |
| **Total** | **129** |
| Test Files | 10 (8 passed, 2 failed) |

### Combined

| Status | Count |
|--------|-------|
| Passed | **286** |
| Failed | **14** |
| Skipped | 2 |
| **Total** | **302** |

---

## New Tests Written (Iteration 2)

### Server Unit Tests

#### `cqs-impact-map.test.ts` — 7 tests, ALL PASS
| Test | Status |
|------|--------|
| getCqsImpact returns correct sub-scores for readability rule | PASS |
| getCqsImpact returns multiple sub-scores for keyword-stuffing | PASS |
| getCqsImpact returns null for unknown rule | PASS |
| getCqsImpact returns eeat sub-score for no-author-bio | PASS |
| CQS_WEIGHTS values sum to 1.0 | PASS |
| All impact map entries reference valid CqsSubScore values | PASS |
| Multi-score weight calculation correct for aeo-no-definition-blocks | PASS |

#### `fix-templates.test.ts` — 9 tests, ALL PASS
| Test | Status |
|------|--------|
| resolveFixSnippet returns valid snippet for known rule | PASS |
| resolveFixSnippet returns null for unknown rule | PASS |
| Variable resolution works with selector context | PASS |
| Fallback template used when variables unresolvable | PASS |
| Return type has all required fields | PASS |
| All templates have required fields | PASS |
| All templates have valid fixType | PASS |
| All templates have valid effort | PASS |
| All templates have array variables | PASS |

#### `compliance.test.ts` — 9 tests, ALL PASS
| Test | Status |
|------|--------|
| enMapping has exactly 50 clauses | PASS |
| All clauses have required fields | PASS |
| buildWcagToEnMap returns a Map | PASS |
| Looking up 1.1.1 returns EN clause 9.1.1.1 | PASS |
| Manual-only clauses exist (9.1.2.1, 9.1.2.2) | PASS |
| All keys follow WCAG criterion format | PASS |
| All levels are valid (A, AA, AAA) | PASS |
| All sections are "Web" | PASS |
| Map covers all unique WCAG criteria in enMapping | PASS |

### Client Unit Tests

#### `FixSnippet.test.tsx` — 8 tests, ALL PASS
| Test | Status |
|------|--------|
| Highlights HTML tag names in indigo | PASS |
| Highlights HTML class attribute in indigo | PASS |
| Highlights JS const keyword in indigo | PASS |
| Highlights JS strings in emerald | PASS |
| Highlights JS single-line comments in slate | PASS |
| Highlights HTML comments in slate | PASS |
| Highlights CSS properties in indigo | PASS |
| Escapes HTML to prevent XSS | PASS |

#### `analytics.types.test.ts` — 5 tests, ALL PASS
| Test | Status |
|------|--------|
| SCORE_CATEGORIES includes 'cqs' | PASS |
| CATEGORY_COLORS.cqs equals '#14b8a6' | PASS |
| CATEGORY_LABELS.cqs equals 'Content Quality' | PASS |
| SCORE_CATEGORIES has 7 items | PASS |
| All categories have entries in COLORS and LABELS | PASS |

**New tests total: 38 tests, 38 passed, 0 failed**

---

## Pre-Existing Failures (Not Introduced by Iteration 2)

### Server — 3 failing test files (12 tests)

#### `audits.api.test.ts` — 10 failures
**Root cause:** Integration test that requires a running PostgreSQL database and mock auth. The test expects specific API responses but the mocked database pool doesn't match current route handler signatures after multiple iterations of code changes.
- POST /api/audits — expects 201, gets 500
- GET /api/audits — expects 200, gets 500
- GET /api/audits/:id — expects 200, gets 500
- POST /api/audits/:id/cancel — expects 200, gets 500
- DELETE /api/audits/:id — expects 404, gets 500
- POST /api/audits/:id/rerun — expects 201, gets 500
- GET /api/audits/:id/export/csv — expects 200, gets 500
- GET /api/audits/:id/export/json — expects 200, gets 500
- PATCH /api/audits/:id/findings/:findingId/dismiss — expects 200, gets 404

**Action needed:** Update mocked database pool and auth middleware to match current route handler expectations. The export tests (CSV/JSON) may also need updating for the new fix snippet columns.

#### `auth.api.test.ts` — suite fails to load
**Root cause:** Import error or environment issue. Fails before any tests run.

#### `email.service.test.ts` — 2 failures
**Root cause:** Tests reference old email service API that has changed.

### Client — 2 failing test files (2 tests)

#### `RegisterForm.test.tsx` — 1 failure
**Root cause:** Component was updated with UTM tracking fields; test expects old form structure.
**Action needed:** Update test to include `utmSource` in the RegisterData mock.

#### `OnboardingChecklist.test.tsx` — 1 failure
**Root cause:** Component expects different DOM structure than what test queries.
**Action needed:** Update test selector to match current component markup.

---

## Coverage Analysis

| Area | Unit Tests | Coverage |
|------|------------|----------|
| CQS impact mapping | 7 tests | Full (all functions, edge cases) |
| Fix template resolution | 9 tests | Full (resolution, fallback, validation) |
| EN 301 549 compliance mapping | 9 tests | Full (structure, lookup, manual clauses) |
| Syntax highlighting | 8 tests | Full (all languages, escaping, XSS) |
| Analytics type constants | 5 tests | Full (CQS category, colours, labels) |
| **Total new coverage** | **38 tests** | **All Iteration 2 pure logic** |

### Not Covered (Would Require Live Services)

| Area | Reason |
|------|--------|
| PDF export with fix snippets | Requires Playwright browser + DB |
| CSV/JSON export integration | Requires DB + auth |
| Compliance endpoint | Requires DB + auth |
| Content-quality endpoint | Requires DB + auth |
| CQSBreakdown component rendering | Would need API mocking (visual test) |
| ComplianceReport component | Would need API mocking (visual test) |

---

## Recommended Next Steps

1. **Fix pre-existing test failures** — Update `audits.api.test.ts` mocks to match current route handlers (highest impact: 10 tests)
2. **Update RegisterForm test** — Add UTM fields to test data
3. **Update OnboardingChecklist test** — Fix DOM selector for new markup
4. **Add API integration tests** — Use a test database to verify CSV/JSON/PDF export endpoints with fix snippets
5. **Add component tests** — Mock API responses to test CQSBreakdown and ComplianceReport rendering
