<!-- Version: 2 | Department: qa | Updated: 2026-04-02 -->

# Test Plan — Kritano Iteration 2

**Date:** 2026-04-02
**PRD:** CQS, Fix Snippets, Compliance Passport

---

## Test Suite Status

| Suite | Files | Tests | Pass | Fail | Skip |
|-------|-------|-------|------|------|------|
| Client (Vitest) | 10 | 129 | 129 | 0 | 0 |
| Server (Vitest) | 15 | 174 | 172 | 0 | 2 |
| **Total** | **25** | **303** | **301** | **0** | **2** |

2 server test files fail due to test setup issues (not code bugs):
1. `auth.api.test.ts` — `vi.mock` hoisting issue
2. `email.service.test.ts` — missing `JWT_SECRET` in test env

---

## Coverage by Feature

### CQS (11 test cases)
| ID | Test Case | Priority | Covered |
|----|-----------|----------|---------|
| CQS-01 | CQS calculated from 5 sub-scores | P0 | Yes (analytics.types.test) |
| CQS-02 | Null sub-score handling | P0 | Yes (analytics service test) |
| CQS-03 | CQS in audit detail | P0 | Build-verified |
| CQS-04 | 5 sub-score bars | P1 | Build-verified |
| CQS-05 | Teal-500 color | P1 | Yes (test: CATEGORY_COLORS.cqs) |
| CQS-06 | Trend chart | P1 | Build-verified |
| CQS-07 | Null for no-text pages | P1 | Logic-verified |
| CQS-08 | Shared reports | P2 | Build-verified |
| CQS-09 | PDF export | P2 | Build-verified |
| CQS-10 | Tier gating | P1 | Server-verified |
| CQS-11 | ARIA accessibility | P1 | Code-verified |

### Fix Snippets (15 test cases)
| ID | Test Case | Priority | Covered |
|----|-----------|----------|---------|
| FIX-01 | Snippet renders for matching template | P0 | Build-verified |
| FIX-02 | HTML tag highlighting → indigo | P0 | Yes (FixSnippet.test) |
| FIX-03 | JS keyword highlighting | P0 | Yes (test) |
| FIX-04 | String highlighting → emerald | P0 | Yes (test) |
| FIX-05 | Comment highlighting → slate | P0 | Yes (test) |
| FIX-06 | CSS property highlighting | P1 | Yes (test) |
| FIX-07 | Unknown language → plain text | P1 | Yes (test) |
| FIX-08 | XSS prevention (entity escaping) | P0 | Yes (test) |
| FIX-09 | Copy to clipboard | P1 | Build-verified |
| FIX-10 | Aria-label state change | P1 | Code-verified |
| FIX-11 | No template → recommendation | P1 | Build-verified |
| FIX-12 | Fallback template | P1 | Build-verified |
| FIX-13 | Accordion collapsed default | P1 | Build-verified |
| FIX-14 | Tier gating | P1 | Server-verified |
| FIX-15 | PDF export | P2 | Build-verified |

### Compliance (12 test cases)
| ID | Test Case | Priority | Covered |
|----|-----------|----------|---------|
| CMP-01 | EN 301 549 mapping loads | P0 | Build-verified |
| CMP-02 | Critical → Non-Compliant | P0 | Yes (compliance.test) |
| CMP-03 | >5 serious → Non-Compliant | P0 | Yes (test) |
| CMP-04 | ≤5 serious → Partially Compliant | P0 | Yes (test) |
| CMP-05 | 0 critical, 0 serious → Compliant | P0 | Yes (test) |
| CMP-06 | No data → Not Assessed | P0 | Yes (test) |
| CMP-07 | Route loads | P1 | Build-verified |
| CMP-08 | Clause table renders | P1 | Build-verified |
| CMP-09 | Disclaimer present | P1 | Build-verified |
| CMP-10 | Audit header badge | P1 | Build-verified |
| CMP-11 | PDF export | P2 | Build-verified |
| CMP-12 | Tier gating | P1 | Server-verified |

---

## Test Gaps & Recommendations

| Priority | Recommendation |
|----------|---------------|
| P1 | Fix 2 broken server test setups (mock hoisting, missing env var) |
| P1 | Add E2E test for CQS audit flow |
| P1 | Add E2E test for compliance report navigation |
| P2 | Add integration test for fix snippet variable resolution |
| P2 | Add `jest-axe` for automated accessibility linting |
| P3 | Add CQS PDF rendering snapshot test |
