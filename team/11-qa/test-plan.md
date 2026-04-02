# Test Plan — Kritano Iteration 2

**Date:** 2026-03-25
**Scope:** CQS, Fix Snippets, EAA Compliance Passport

---

## 1. Content Quality Score (CQS)

### Happy Path

| ID | Test Case | Priority | Status |
|----|-----------|----------|--------|
| CQS-01 | Run audit on a content-rich page (>500 words); verify CQS score appears in audit detail alongside SEO/A11y/Security/Performance | P0 | Manual |
| CQS-02 | Click CQS score card to expand breakdown; verify 5 sub-scores displayed with coloured bars | P0 | Manual |
| CQS-03 | Export audit as PDF; verify CQS score appears in the report | P0 | Manual |
| CQS-04 | As Starter user, call `GET /api/audits/:id/content-quality`; verify `breakdown` present but `pages` absent | P1 | Manual |
| CQS-05 | As Pro user, call `GET /api/audits/:id/content-quality`; verify `pages` array with per-page scores | P1 | Manual |
| CQS-06 | As Free user, view CQS on audit detail; verify score visible but breakdown locked with upgrade CTA | P1 | Manual |
| CQS-07 | Verify CQS weighted calculation: quality*0.25 + eeat*0.25 + readability*0.20 + engagement*0.15 + structure*0.15 | P0 | Unit test |

### Edge Cases

| ID | Test Case | Priority | Status |
|----|-----------|----------|--------|
| CQS-08 | Audit a page with no text content (image gallery); verify CQS = null, displays "Not applicable" | P1 | Manual |
| CQS-09 | Audit with content checks disabled (Free tier); verify CQS = null | P1 | Manual |
| CQS-10 | Page with <100 words; verify CQS calculated but flagged | P2 | Manual |
| CQS-11 | All sub-scores null; verify CQS = null (not NaN or 0) | P1 | Unit test |
| CQS-12 | Some sub-scores null; verify weight redistribution is proportional | P1 | Unit test |
| CQS-13 | Homepage at depth=0 gets 3x weight in audit aggregate | P1 | Unit test |

### Sad Path

| ID | Test Case | Priority | Status |
|----|-----------|----------|--------|
| CQS-14 | API call with invalid audit ID returns 404 | P2 | Manual |
| CQS-15 | Unauthenticated user cannot access CQS endpoint | P1 | Manual |
| CQS-16 | User accessing another user's audit CQS returns 403 | P1 | Manual |

---

## 2. Fix Snippets

### Happy Path

| ID | Test Case | Priority | Status |
|----|-----------|----------|--------|
| FIX-01 | Run audit; view findings; verify "How to Fix" accordion visible for findings with templates | P0 | Manual |
| FIX-02 | Expand "How to Fix"; verify code block, explanation, effort badge, learn more link | P0 | Manual |
| FIX-03 | Click copy button; verify code copied to clipboard and button shows checkmark | P0 | Manual |
| FIX-04 | As Free user, expand "How to Fix"; verify explanation visible but code hidden with upgrade CTA | P1 | Manual |
| FIX-05 | As Starter user, expand "How to Fix"; verify full code snippet visible | P1 | Manual |
| FIX-06 | Verify template variable resolution: {{selector}}, {{snippet}}, {{pageUrl}} populated from finding context | P1 | Unit test |
| FIX-07 | Verify fallback template used when variables can't be resolved | P1 | Unit test |

### Edge Cases

| ID | Test Case | Priority | Status |
|----|-----------|----------|--------|
| FIX-08 | Finding with no matching template; verify no "How to Fix" accordion shown | P1 | Manual |
| FIX-09 | Finding with very long code snippet (>50 lines); verify scrollable code block | P2 | Manual |
| FIX-10 | Template with all variables unresolvable; verify fallback renders correctly | P1 | Unit test |

### Export Integration

| ID | Test Case | Priority | Status |
|----|-----------|----------|--------|
| FIX-11 | Export audit as PDF; verify fix snippets appear for each finding | P0 | **BLOCKED** — not implemented |
| FIX-12 | Export audit as CSV; verify fix snippet columns present | P0 | **BLOCKED** — not implemented |
| FIX-13 | Export audit as JSON; verify fixSnippet objects in findings array | P0 | **BLOCKED** — not implemented |

---

## 3. EAA Compliance Passport

### Happy Path

| ID | Test Case | Priority | Status |
|----|-----------|----------|--------|
| CMP-01 | Run audit with accessibility checks; navigate to compliance report; verify clause table loads | P0 | Manual |
| CMP-02 | Verify compliance status banner shows correct status (compliant/partial/non-compliant) | P0 | Manual |
| CMP-03 | Verify executive summary: total clauses, passing, failing, manual review, not tested counts | P0 | Manual |
| CMP-04 | Click a failing clause row; verify linked findings expand | P1 | Manual |
| CMP-05 | Filter clauses by status (passing/failing/manual); verify table updates | P1 | Manual |
| CMP-06 | Sort clauses by clause number and status; verify order changes | P1 | Manual |
| CMP-07 | Export compliance as JSON; verify correct data structure | P1 | Manual |
| CMP-08 | Verify disclaimer text is prominently displayed | P0 | Manual |
| CMP-09 | As Pro user, generate accessibility statement; verify output with contact info | P1 | Manual |
| CMP-10 | Export accessibility statement as HTML file | P1 | Manual |

### Tier Gating

| ID | Test Case | Priority | Status |
|----|-----------|----------|--------|
| CMP-11 | As Free user, visit compliance report; verify executive summary visible but clause table blurred with upgrade CTA | P1 | Manual |
| CMP-12 | As Starter user, verify same behaviour as Free | P1 | Manual |
| CMP-13 | As Pro user, verify full clause breakdown visible | P1 | Manual |
| CMP-14 | As Free user, verify accessibility statement generator is locked | P1 | Manual |

### Edge Cases

| ID | Test Case | Priority | Status |
|----|-----------|----------|--------|
| CMP-15 | Audit without accessibility checks; verify "Not Assessed" status | P1 | Manual |
| CMP-16 | Audit with 0 accessibility findings; verify "Compliant" status | P1 | Manual |
| CMP-17 | Audit with only manual-review clauses failing; verify "Partially Compliant" not "Non-Compliant" | P2 | Manual |
| CMP-18 | Very large audit (100+ pages); verify compliance endpoint performs within 3s | P2 | Manual |

### Export Integration

| ID | Test Case | Priority | Status |
|----|-----------|----------|--------|
| CMP-19 | Export standard audit PDF; verify compliance section included | P0 | **BLOCKED** — not implemented |

---

## Test Case Summary

| Category | Total | P0 | P1 | P2 | Blocked |
|----------|-------|----|----|----|---------|
| CQS | 16 | 3 | 9 | 3 | 0 |
| Fix Snippets | 13 | 5 | 5 | 1 | 3 |
| Compliance | 19 | 5 | 10 | 3 | 1 |
| **Total** | **48** | **13** | **24** | **7** | **4** |

**4 test cases blocked** due to missing export implementations.
