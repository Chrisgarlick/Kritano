# pagepulser - Scraper V2 Roadmap

Comprehensive review and enhancement plan based on full codebase audit.
Covers bugs, security, UX/UI, architecture, and transformative new features.

**Review Date:** 2026-01-28
**Reviewed By:** Claude Code + Developer
**V1 Status:** Complete (70/70 items)

---

## 1. Critical Bug Fixes

### 1.1 Findings Count Mismatch (CRITICAL)
**Problem:** Findings tab shows 1005 but category filters only sum to 149.

| Display | Count | Source |
|---------|-------|--------|
| Tab header | 1005 | `audit.total_issues` (individual findings) |
| Category filters | 149 | `allGrouped.length` (grouped by rule_id+message) |

**Root Cause:**
1. Tab displays raw `audit.total_issues` from database
2. Filters count grouped findings (deduplicated)
3. Dismissed findings included in counts even when `showDismissed` is off

**Fix:**
```tsx
// AuditDetail.tsx lines 483-493
const getCategoryCount = (cat: FindingCategory) => {
  return allGrouped.filter(g =>
    g.category === cat &&
    (!severityFilter || g.severity === severityFilter) &&
    (showDismissed || !g.dismissed)  // ADD THIS
  ).length;
};

// Also fix tab header to show grouped count, not raw total
{tab === 'findings' && !isRunning && ` (${filteredGroups.length})`}
```

**Files:**
- `client/src/pages/audits/AuditDetail.tsx:483-493, 849`

### 1.2 Broken Link Selector Displayed as URL
**Problem:** `link.selector` is a CSS selector but rendered as clickable link.
**File:** `client/src/pages/audits/AuditDetail.tsx:1129-1136`
**Fix:** Display selector as code, not as anchor tag.

### 1.3 SSE Error Silently Ignored
**Problem:** Real-time updates stop without user notification.
**File:** `client/src/pages/audits/AuditDetail.tsx:621-624`
**Fix:** Show toast notification when SSE connection fails.

---

## 2. Security Hardening

### 2.1 CRITICAL Security Issues

| # | Issue | File | Line | Fix |
|---|-------|------|------|-----|
| S1 | Hardcoded DB credentials | `server/src/index.ts` | 38 | Remove fallback, require env var |
| S2 | Hardcoded DB credentials | `server/src/worker.ts` | 27 | Remove fallback, require env var |
| S3 | SSRF via check-url endpoint | `server/src/routes/audits/index.ts` | 192-246 | Add IP validation before fetch |
| S4 | CSP allows unsafe-inline | `server/src/middleware/security.middleware.ts` | 16 | Use nonce-based CSP |
| S5 | SQL interval interpolation | `server/src/middleware/rateLimit.middleware.ts` | 48-49 | Use `make_interval(secs => $N)` |

### 2.2 HIGH Security Issues

| # | Issue | File | Fix |
|---|-------|------|-----|
| S6 | Error details exposed | `server/src/index.ts:107-121` | Always sanitize in production |
| S7 | Missing validation on resend-verification | `server/src/routes/auth/index.ts:471` | Add validateBody middleware |
| S8 | JWT uses HS256 | `server/src/config/auth.config.ts:17` | Migrate to RS256 |
| S9 | Rate limiter fails open | `server/src/middleware/rateLimit.middleware.ts:95` | Implement fallback memory limiter |
| S10 | Refresh token rotation vulnerability | `server/src/services/token.service.ts` | Add family ID tracking |
| S11 | Sessions endpoint exposes IPs | `server/src/routes/auth/index.ts:406` | Anonymize IP addresses |
| S12 | ~~No worker health check~~ | `server/src/worker.ts` | ✅ Added /health, /status, /ready endpoints |

### 2.3 MEDIUM Security Issues

| # | Issue | Fix |
|---|-------|-----|
| S13 | Only 30 common passwords checked | Integrate Have I Been Pwned API |
| S14 | Rate limiting IP-only | Add per-user rate limiting |
| S15 | Weak IPv6 regex | Use proper validation library |
| S16 | No export size limits | Add pagination/streaming for exports |
| S17 | ~~No audit event logging~~ | ✅ Implemented comprehensive audit logging |
| S18 | No CSRF token rotation after login | Rotate on successful auth |
| S19 | Missing security.txt | Add /.well-known/security.txt |
| S20 | PDF export unbounded | Limit findings per category |

---

## 3. UX/UI Improvements

### 3.1 Accessibility (WCAG 2.1 AA Compliance)

| # | Issue | File | Line | Fix |
|---|-------|------|------|-----|
| A1 | Missing ARIA labels on checkboxes | AuditList.tsx | 254-259 | Add aria-label="Select all" |
| A2 | Sort icons lack meaning | AuditList.tsx | 125-129 | Add aria-label for direction |
| A3 | Form inputs missing label association | AuditList.tsx | 189-200 | Add htmlFor and id |
| A4 | Color-only status indication | AuditList.tsx | 11-25 | Add icons to status badges |
| A5 | Accordion buttons need aria-expanded | AuditDetail.tsx | 203-218 | Add aria-expanded={isOpen} |
| A6 | Sort headers not keyboard accessible | AuditList.tsx | 270 | Convert th to button |

### 3.2 Error Handling

| # | Issue | File | Fix |
|---|-------|------|-----|
| E1 | Silent bulk delete failures | AuditList.tsx:157-163 | Track and report individual failures |
| E2 | Generic bulk dismiss errors | AuditDetail.tsx:544-553 | Show which findings failed |
| E3 | SSE errors not reported | AuditDetail.tsx:621-624 | Toast notification on disconnect |
| E4 | URL unreachable allows submit | NewAudit.tsx:254-285 | Disable submit or show warning |

### 3.3 Loading & Feedback

| # | Issue | Fix |
|---|-------|-----|
| L1 | Inconsistent loading spinners | Create unified LoadingSpinner component |
| L2 | No loading state on tab switch | Show skeleton while findings load |
| L3 | Skeleton placeholders unused | Apply SkeletonCard to findings tab |

### 3.4 Responsive Design

| # | Issue | File | Fix |
|---|-------|------|-----|
| R1 | Long URLs break mobile layout | AuditList.tsx:296 | Use responsive max-w classes |
| R2 | Score columns overflow | AuditList.tsx:314 | Stack scores on mobile |
| R3 | Page scores don't stack | PageDetail.tsx:206 | Add flex-wrap |
| R4 | Autocomplete ignores keyboard | NewAudit.tsx:232 | Add viewport-aware positioning |

### 3.5 Component Refactoring

| # | Issue | Fix |
|---|-------|-----|
| C1 | Duplicate color maps (3 files) | Extract to shared constants |
| C2 | Duplicate formatDate (3 files) | Extract to utils/format.ts |
| C3 | Duplicate formatBytes (2 files) | Extract to utils/format.ts |
| C4 | Large inline components | Extract ScoreCard, PageAccordion |
| C5 | GroupedFindingCard type mismatch | Fix TypeScript interface |

### 3.6 Performance

| # | Issue | Fix |
|---|-------|-----|
| P1 | Category counts not memoized | useMemo for getCategoryCount |
| P2 | Full refetch on dismiss | Update single finding in state |
| P3 | No pagination for 1000+ audits | Implement virtualized list |
| P4 | checkUrlReachability recreated | Fix useCallback dependencies |
| P5 | SVG charts recreated on render | Memoize chart data |

### 3.7 Keyboard Navigation

| # | Issue | Fix |
|---|-------|-----|
| K1 | Sort headers not focusable | Use button elements |
| K2 | Tabs lack arrow key support | Implement WAI-ARIA tabs pattern |
| K3 | Accordion not keyboard accessible | Add Enter/Space handlers |
| K4 | Autocomplete not navigable | Add arrow key + Enter support |

---

## 4. Architecture Improvements

### 4.1 Shared Utilities
Create `client/src/utils/` with:
- `format.ts` - formatDate, formatBytes, formatNumber
- `constants.ts` - statusColors, severityColors, categoryColors
- `accessibility.ts` - ARIA helper functions

### 4.2 Component Library
Extract to `client/src/components/audit/`:
- `ScoreCard.tsx`
- `PageAccordion.tsx`
- `FindingCard.tsx`
- `SeverityBadge.tsx`
- `StatusBadge.tsx`

### 4.3 Server Structure
- Move SQL queries to repository layer
- Add request/response DTOs
- Implement proper error classes
- Add OpenAPI/Swagger documentation

### 4.4 Testing Infrastructure
- Add Vitest coverage reporting
- Add Playwright E2E tests
- Add accessibility testing with axe-core
- Add API contract testing

---

## 5. Transformative New Features

### 5.1 Competitive Intelligence

| Feature | Description | Impact |
|---------|-------------|--------|
| **Competitor Comparison** | Audit multiple sites, compare scores side-by-side | High |
| **Industry Benchmarks** | Compare against anonymized industry averages | High |
| **Historical Tracking** | Track competitor scores over time | Medium |

### 5.2 AI-Powered Insights

| Feature | Description | Impact |
|---------|-------------|--------|
| **Auto-Fix Suggestions** | LLM generates code fixes for findings | Very High |
| **Priority Scoring** | ML model ranks findings by business impact | High |
| **Natural Language Reports** | Generate executive summaries via LLM | High |
| **Anomaly Detection** | Alert on unusual score drops | Medium |

### 5.3 Advanced Scanning

| Feature | Description | Impact |
|---------|-------------|--------|
| **JavaScript Rendering Depth** | Full SPA crawling with interaction | High |
| **API Endpoint Discovery** | Detect and test JSON/REST endpoints | High |
| **Cookie Consent Audit** | GDPR/CCPA compliance checking | Medium |
| **Carbon Footprint Analysis** | Website sustainability score | Medium |
| **Third-Party Risk Analysis** | Audit external scripts and services | High |

### 5.4 Collaboration & Workflow

| Feature | Description | Impact |
|---------|-------------|--------|
| **Team Workspaces** | Multi-user organizations with RBAC | Very High |
| **Issue Assignment** | Assign findings to team members | High |
| **Jira/Linear Integration** | Sync findings to issue trackers | High |
| **Slack/Discord Alerts** | Real-time notifications | Medium |
| **White-Label Reports** | Custom branding for agencies | High |

### 5.5 Continuous Monitoring

| Feature | Description | Impact |
|---------|-------------|--------|
| **Scheduled Audits** | Cron-based recurring audits | High (exists) |
| **Real-Time Monitoring** | Lighthouse-style continuous checks | Very High |
| **Uptime Monitoring** | Detect outages and slow responses | Medium |
| **Change Detection** | Alert when page content changes significantly | Medium |
| **Regression Prevention** | Block deployments that reduce scores (CI/CD) | Very High |

### 5.6 Developer Experience

| Feature | Description | Impact |
|---------|-------------|--------|
| **CLI Tool** | `pagepulser scan https://example.com` | High |
| **GitHub Action** | Audit PRs automatically | Very High |
| **VS Code Extension** | In-editor issue highlighting | Medium |
| **API Access** | Full REST API for integrations | High |
| **Webhooks** | Push notifications on audit events | Medium |

### 5.7 Monetization Features

| Feature | Description | Impact |
|---------|-------------|--------|
| **Usage-Based Billing** | Pay per page scanned | Revenue |
| **Team Seats** | Per-seat pricing for organizations | Revenue |
| **Priority Scanning** | Faster queues for paid users | Revenue |
| **API Rate Limits** | Tiered API access | Revenue |
| **White-Label Licensing** | SaaS-in-a-box for agencies | Revenue |

---

## 6. Implementation Phases

### Phase 1: Stability (1-2 weeks) - COMPLETE
- [x] Fix findings count bug
- [x] Fix all CRITICAL security issues (S1-S5)
- [x] Remove hardcoded credentials (S1, S2)
- [x] Add SSRF validation (S3)
- [x] Fix CSP configuration (S4)
- [x] Fix SQL interval interpolation (S5)

### Phase 2: Polish (2-3 weeks) - COMPLETE
- [x] All accessibility fixes (A1-A6)
- [x] All error handling improvements (E1-E4)
- [x] Responsive design fixes (R1-R4)
- [x] Component refactoring (C1-C5)

### Phase 3: Scale (2-3 weeks) - COMPLETE
- [x] Performance optimizations (P1-P5)
- [x] Pagination/virtualization
- [x] Worker health monitoring
- [x] Audit logging

### Phase 4: Innovation (ongoing)
- [ ] AI-powered features
- [ ] Team workspaces
- [ ] CI/CD integration
- [x] API access

---

## 7. Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Lighthouse Accessibility Score | ~70 | 95+ |
| WCAG 2.1 AA Compliance | Partial | Full |
| Security Issues | 30 | 0 critical/high |
| Mobile Usability | Poor | Excellent |
| Test Coverage | ~10% | 80%+ |
| API Documentation | None | Full OpenAPI |

---

## 8. Priority Matrix

| Priority | Items | Effort |
|----------|-------|--------|
| **P0 (Now)** | S1-S5, Bug 1.1, A1-A6 | 1 week |
| **P1 (Soon)** | S6-S12, E1-E4, R1-R4 | 2 weeks |
| **P2 (Next)** | C1-C5, P1-P5, K1-K4 | 2 weeks |
| **P3 (Later)** | All remaining + new features | Ongoing |

---

## 9. Detailed Issue Reference

### Client-Side Issues (49 total)

| Category | Count | Priority |
|----------|-------|----------|
| Accessibility | 6 | High |
| Error Handling | 4 | High |
| Loading States | 3 | Medium |
| Form Validation | 4 | Medium |
| Responsive Design | 4 | High |
| Edge Cases | 5 | Medium |
| Component Structure | 5 | Medium |
| Performance | 5 | Medium |
| Data Display | 3 | Low |
| Navigation | 3 | Medium |
| Keyboard Navigation | 4 | High |
| Visual Hierarchy | 3 | Low |

### Server-Side Issues (30 total)

| Severity | Count | Examples |
|----------|-------|----------|
| Critical | 5 | Hardcoded creds, SSRF, CSP |
| High | 7 | JWT HS256, Rate limit fail-open |
| Medium | 8 | No worker health, Export limits |
| Low | 10 | Console logging, Audit logs |

---

## 10. Positive Findings (Already Good)

The codebase already implements these security best practices:

1. **Strong Password Hashing:** Argon2id with OWASP 2024 recommendations
2. **SSRF Protection:** URL normalizer validates private IP ranges
3. **SQL Injection Prevention:** Parameterized queries throughout
4. **HTTPS Enforcement:** Forces HTTPS in production
5. **Rate Limiting:** Multiple levels (login, register, global)
6. **CSRF Protection:** Double-submit cookie with timing-safe comparison
7. **Account Lockout:** Progressive lockout after failed attempts
8. **Token Expiration:** Access (4h) and refresh (7d) with rotation
9. **HTTPOnly Cookies:** Access and refresh tokens are HTTPOnly, SameSite=Strict
10. **Security Headers:** Helmet middleware with sensible defaults
11. **Email Verification:** Two-step verification prevents account takeover
12. **Password Requirements:** 12+ chars, mixed case, numbers, special chars
13. **CORS Configured:** Not using wildcard origins
14. **Error Handling:** Environment-aware error messages
15. **Connection Pooling:** pg pool with reasonable max connections

---

*V2 Roadmap Generated: 2026-01-28*
*Based on comprehensive codebase review*
*V1: 70/70 items complete*
*V2: 100+ items identified across bugs, security, UX, and new features*
