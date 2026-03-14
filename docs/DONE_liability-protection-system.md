# Liability Protection System

**Implementation Date:** 2026-02-01
**Status:** Complete
**Plan File:** `/Users/chris/.claude/plans/eager-inventing-ripple.md`

---

## Overview

This document details the comprehensive liability protection system implemented to protect Siteseer from legal exposure when users scan websites they don't own. The system was created after a spider scan incident that took down a client's website.

## Problem Statement

- A spider scan on a client's website (im360) caused the site to go down
- Users could scan any website without proving ownership
- No consent or liability acceptance was recorded
- The competitor scanning feature created additional legal grey areas

## Solution Architecture

### Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Verification methods | Both DNS TXT + File | Gives users flexibility based on their access level |
| Unverified scan limit | 3 pages | Conservative - enough for homepage + 2 pages, minimal server impact |
| Competitor feature | Disabled | Users can still scan any URL via standard audit flow with consent |
| ToS at registration | Required | Creates baseline legal protection before any scanning |

---

## Database Changes

### New Migration: `021_liability_protection.sql`

**Location:** `server/src/db/migrations/021_liability_protection.sql`

#### New Tables

##### `audit_consent_log`
Logs every consent acceptance for unverified domain scans.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `audit_job_id` | UUID | FK to audit_jobs |
| `user_id` | UUID | FK to users |
| `organization_id` | UUID | FK to organizations (nullable) |
| `target_url` | TEXT | Full URL being scanned |
| `target_domain` | VARCHAR(255) | Domain extracted from URL |
| `is_verified` | BOOLEAN | Whether domain was verified at time of scan |
| `accepted_at` | TIMESTAMPTZ | When consent was given |
| `ip_address` | INET | User's IP address |
| `user_agent` | TEXT | User's browser/client |
| `consent_text_hash` | VARCHAR(64) | SHA-256 hash of consent text (for versioning) |
| `consent_version` | VARCHAR(20) | Version of consent text (e.g., "1.0") |
| `dont_show_again` | BOOLEAN | User's preference (still logs even if true) |

**Indexes:**
- `idx_consent_log_audit` - By audit job
- `idx_consent_log_user` - By user
- `idx_consent_log_org` - By organization
- `idx_consent_log_domain` - By domain
- `idx_consent_log_date` - By date (DESC)

##### `user_consents`
Tracks ToS, privacy policy, and other legal document acceptances.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK to users |
| `consent_type` | VARCHAR(50) | Type: 'terms_of_service', 'privacy_policy', etc. |
| `consent_version` | VARCHAR(20) | Version accepted |
| `consent_text_hash` | VARCHAR(64) | Hash of document content |
| `accepted_at` | TIMESTAMPTZ | When accepted |
| `ip_address` | INET | User's IP |
| `user_agent` | TEXT | User's browser |

**Unique constraint:** `(user_id, consent_type, consent_version)`

#### Table Modifications

##### `organization_domains`
```sql
ADD COLUMN verification_method VARCHAR(20)     -- 'dns', 'file', null
ADD COLUMN verification_attempts INTEGER       -- Track retry count
ADD COLUMN last_verification_attempt TIMESTAMPTZ
```

##### `users`
```sql
ADD COLUMN tos_accepted_at TIMESTAMPTZ
ADD COLUMN tos_version VARCHAR(20)
ADD COLUMN settings JSONB DEFAULT '{}'::jsonb  -- Includes skipUnverifiedDomainWarning
```

##### `audit_jobs`
```sql
ADD COLUMN unverified_mode BOOLEAN DEFAULT FALSE
```

##### `tier_limits`
```sql
UPDATE SET competitor_comparison = FALSE  -- Disable for all tiers
```

---

## Backend Services

### New Files

#### 1. `server/src/constants/consent.constants.ts`

Defines all constants for the liability system:

```typescript
// Unverified domain scan limits
UNVERIFIED_DOMAIN_LIMITS = {
  MAX_PAGES: 3,
  MIN_DELAY_MS: 2500,
  MAX_DELAY_MS: 5000,
  REQUESTS_PER_SECOND: 0.4,
  CONCURRENT_PAGES: 1,  // Sequential only
  RESPECT_ROBOTS_TXT: true,  // Mandatory
}

// Version tracking
CONSENT_VERSION = '1.0'
TOS_VERSION = '1.0'

// Verification settings
VERIFICATION_TOKEN_PREFIX = 'siteseer-verify='
VERIFICATION_FILE_PATH = '/.well-known/siteseer-verify.txt'
VERIFICATION_DNS_SUBDOMAIN = '_siteseer'
```

#### 2. `server/src/services/domain-verification.service.ts`

Handles actual domain ownership verification.

**Key Functions:**

| Function | Purpose |
|----------|---------|
| `generateVerificationToken(orgId, domainId)` | Creates unique token, stores in DB, returns instructions |
| `verifyDnsTxt(domain, token)` | Queries DNS TXT records for verification |
| `verifyFile(domain, token)` | Fetches `/.well-known/siteseer-verify.txt` |
| `attemptVerification(orgId, domainId, method)` | Main verification function, updates DB on success |
| `isDomainVerifiedForOrg(orgId, hostname)` | Checks if domain is verified (used before audits) |
| `getVerificationStatus(orgId, domainId)` | Returns current verification state |

**DNS Verification Flow:**
1. User adds TXT record: `siteseer-verify=<token>`
2. Can be on root domain OR `_siteseer.<domain>`
3. System queries with 10s timeout
4. On match, marks domain as verified with method='dns'

**File Verification Flow:**
1. User creates `/.well-known/siteseer-verify.txt`
2. File contains just the token
3. System fetches via HTTPS with 5s timeout
4. On match, marks domain as verified with method='file'

#### 3. `server/src/services/consent.service.ts`

Handles consent logging and user preferences.

**Key Functions:**

| Function | Purpose |
|----------|---------|
| `logAuditConsent(data)` | Logs consent to `audit_consent_log` |
| `getUserConsentPreference(userId)` | Gets "don't show again" preference |
| `updateConsentPreference(userId, skip)` | Updates user's settings.skipUnverifiedDomainWarning |
| `recordTosAcceptance(userId, ip, ua, version)` | Records ToS acceptance |
| `hasAcceptedTos(userId, minVersion?)` | Checks if user has accepted ToS |
| `getConsentAuditTrail(filters, limit)` | For compliance/audit purposes |
| `getConsentStats()` | Dashboard statistics |

---

## Backend Route Changes

### 1. `server/src/routes/audits/index.ts`

#### Modified: `POST /api/audits`

**New Flow:**
```
1. Validate URL
2. Check domain verification status via isDomainVerifiedForOrg()
3. If NOT verified:
   a. Check if consent provided in request body
   b. If no consent: return 400 with CONSENT_REQUIRED code
   c. If consent: enforce limits, set unverified_mode=true
4. Create audit job with unverified_mode flag
5. Log consent to audit_consent_log
6. Continue with existing flow
```

**Request Body Addition:**
```typescript
consent?: {
  accepted: boolean;
  dontShowAgain?: boolean;
}
```

**Error Response (when consent needed):**
```json
{
  "error": "Consent required for unverified domain",
  "code": "CONSENT_REQUIRED",
  "requiresConsent": true,
  "domain": "example.com",
  "isVerified": false,
  "scanLimits": {
    "maxPages": 3,
    "minDelayMs": 2500,
    "robotsTxtRequired": true,
    "sequential": true
  }
}
```

#### New: `GET /api/audits/domain-status`

Checks domain verification before starting audit.

**Query Parameters:**
- `url` - The URL to check

**Response:**
```json
{
  "domain": "example.com",
  "isVerified": false,
  "requiresConsent": true,
  "userSkipsWarning": false,
  "scanLimits": {
    "maxPages": 3,
    "minDelayMs": 2500,
    "robotsTxtRequired": true,
    "sequential": true
  }
}
```

### 2. `server/src/routes/auth/index.ts`

#### Modified: `POST /api/auth/register`

**Changes:**
- Added `acceptedTos` to validation schema (required, must be true)
- After user creation, calls `recordTosAcceptance()`
- Records IP address and user agent

### 3. `server/src/routes/organizations/index.ts`

#### New: `POST /api/organizations/:orgId/domains/:domainId/verification-token`

Generates verification token and returns instructions.

**Response:**
```json
{
  "token": "uuid-token-here",
  "instructions": {
    "dns": {
      "recordType": "TXT",
      "name": "example.com",
      "alternativeName": "_siteseer.example.com",
      "value": "siteseer-verify=uuid-token-here"
    },
    "file": {
      "path": "/.well-known/siteseer-verify.txt",
      "url": "https://example.com/.well-known/siteseer-verify.txt",
      "content": "uuid-token-here"
    }
  }
}
```

#### Modified: `POST /api/organizations/:orgId/domains/:domainId/verify`

Now requires method parameter and performs actual verification.

**Request Body:**
```json
{
  "method": "dns" | "file"
}
```

**Response:**
```json
{
  "verified": true,
  "method": "dns",
  "details": "Found matching TXT record on example.com"
}
```

Or on failure:
```json
{
  "verified": false,
  "error": "TXT record found but value does not match",
  "details": "Found 3 TXT record(s) but none matched expected value"
}
```

#### New: `GET /api/organizations/:orgId/domains/:domainId/verification-status`

Returns current verification status.

### 4. `server/src/routes/competitors/index.ts`

#### Disabled: All routes

Added middleware that returns 403 for all requests:

```typescript
router.use((_req, res) => {
  res.status(403).json({
    error: 'Competitor comparison feature is currently unavailable',
    code: 'FEATURE_DISABLED',
    message: 'You can still scan any website using the standard audit feature...'
  });
});
```

---

## Backend Worker Changes

### `server/src/services/queue/audit-worker.service.ts`

**Changes:**
1. Added import for `UNVERIFIED_DOMAIN_LIMITS`
2. Check `job.unverified_mode` flag when building spider config
3. If unverified mode:
   - `maxPages` capped at 3
   - `maxConcurrentPages` set to 1 (sequential)
   - `requestDelayMs` set to 2500ms
   - `respectRobotsTxt` forced to true
   - Activity log entry added

```typescript
if (isUnverifiedMode) {
  spiderConfig.maxPages = Math.min(job.max_pages, 3);
  spiderConfig.maxConcurrentPages = 1;
  spiderConfig.requestDelayMs = 2500;
  spiderConfig.respectRobotsTxt = true;
}
```

---

## Frontend Components

### New Components

#### 1. `client/src/components/audits/UnverifiedDomainConsentModal.tsx`

Modal displayed when user tries to scan an unverified domain.

**Props:**
```typescript
interface Props {
  domain: string;
  scanLimits: ScanLimits;
  isOpen: boolean;
  onAccept: (dontShowAgain: boolean) => void;
  onCancel: () => void;
}
```

**Features:**
- Warning icon and headline
- Three required checkboxes:
  1. "I have explicit authorization..."
  2. "I understand this may impact performance..."
  3. "I accept full responsibility..."
- Optional "Don't show again" checkbox
- Displays scan limitations
- Cancel/Accept buttons

#### 2. `client/src/components/domains/DomainVerification.tsx`

Wizard for domain verification process.

**Props:**
```typescript
interface Props {
  domain: string;
  domainId: string;
  organizationId: string;
  onVerificationSuccess: () => void;
  onGenerateToken: (domainId: string) => Promise<VerificationInstructions>;
  onVerify: (domainId: string, method: 'dns' | 'file') => Promise<VerificationResult>;
}
```

**Steps:**
1. **Choose Method** - DNS TXT or File upload cards
2. **Instructions** - Copy-to-clipboard values, guidance
3. **Verifying** - Loading spinner
4. **Success** - Green checkmark
5. **Error** - Error message with retry options

### Modified Components

#### `client/src/pages/audits/NewAudit.tsx`

**New State:**
```typescript
const [showConsentModal, setShowConsentModal] = useState(false);
const [domainStatus, setDomainStatus] = useState<DomainStatus | null>(null);
const [pendingSubmit, setPendingSubmit] = useState<string | null>(null);
```

**Modified handleSubmit:**
1. Check domain status via `auditsApi.getDomainStatus()`
2. If consent required and user hasn't opted out, show modal
3. On modal accept, resubmit with consent data
4. Handle `CONSENT_REQUIRED` error response

#### `client/src/components/auth/RegisterForm.tsx`

**Changes:**
- Added `acceptedTos` to Zod schema (required boolean, must be true)
- Added checkbox with links to Terms of Service and Privacy Policy
- Validation error displayed if not checked

#### `client/src/components/layout/DashboardLayout.tsx`

**Changes:**
- Removed competitor and comparisons links from navigation
- Added comment explaining why feature is disabled

---

## API Service Changes

### `client/src/services/api.ts`

**New in auditsApi:**
```typescript
getDomainStatus: (url: string) => api.get('/audits/domain-status', { params: { url } })
```

**Modified in auditsApi:**
```typescript
start: (data: StartAuditInput & { consent?: { accepted: boolean; dontShowAgain?: boolean } }) => ...
```

**New in organizationsApi:**
```typescript
generateVerificationToken: (orgId, domainId) => api.post('.../verification-token')
verifyDomain: (orgId, domainId, method: 'dns' | 'file') => api.post('.../verify', { method })
getVerificationStatus: (orgId, domainId) => api.get('.../verification-status')
```

---

## Consent Text (For Legal Review)

```
IMPORTANT: You are about to scan a domain that is not verified as belonging
to your organization.

By proceeding, you acknowledge and agree that:

1. You have explicit authorization from the domain owner to perform this scan.
2. You understand that web scanning may impact the target website's
   performance or availability.
3. You accept full responsibility for any consequences resulting from this scan.
4. This scan will be limited to 3 pages maximum with reduced crawl speed
   for safety.

Siteseer and its operators are not liable for any damages, downtime, or issues
that may arise from scanning domains you do not own or have explicit
authorization to scan.

Unauthorized scanning of websites may violate computer access laws in your
jurisdiction.
```

---

## Testing Checklist

### Unit Tests Needed
- [ ] Domain verification service (DNS mocking, file fetch mocking)
- [ ] Consent service (logging, preference retrieval)
- [ ] Consent text hash generation

### Integration Tests Needed
- [ ] Audit creation with verified domain (no consent needed)
- [ ] Audit creation with unverified domain (consent required error)
- [ ] Audit creation with consent provided (succeeds with limits)
- [ ] Registration with ToS acceptance
- [ ] Registration without ToS (should fail)

### E2E Tests Needed
- [ ] Full flow: Register with ToS -> Add domain -> Verify domain -> Run audit
- [ ] Full flow: Start audit on unverified domain -> Consent modal -> Accept -> Audit runs with limits
- [ ] Consent modal "don't show again" still logs consent

### Manual Testing
- [ ] Verify 3-page limit is enforced
- [ ] Verify delays are slower (2.5s+)
- [ ] Verify sequential crawling (no concurrency)
- [ ] DNS verification with real domain
- [ ] File verification with real domain

---

## Deployment Steps

1. **Database Migration**
   ```bash
   psql -d siteseer -f server/src/db/migrations/021_liability_protection.sql
   ```

2. **Backend Deployment**
   - Deploy all backend changes
   - Verify new services are properly initialized

3. **Frontend Deployment**
   - Deploy all frontend changes
   - Verify modal displays correctly

4. **Post-Deployment**
   - Create `/terms` and `/privacy` pages
   - Monitor consent logs for any issues
   - Check competitor routes return 403

---

## Files Changed Summary

| File | Type | Description |
|------|------|-------------|
| `server/src/db/migrations/021_liability_protection.sql` | NEW | Database migration |
| `server/src/db/migrations/022_scanner_bypass_settings.sql` | NEW | Bypass settings migration |
| `server/src/constants/consent.constants.ts` | NEW | Constants, limits, scanner info |
| `server/src/services/domain-verification.service.ts` | NEW | DNS/file verification + bypass settings lookup |
| `server/src/services/consent.service.ts` | NEW | Consent logging |
| `server/src/routes/audits/index.ts` | MODIFIED | Consent check, new endpoint |
| `server/src/routes/auth/index.ts` | MODIFIED | ToS recording |
| `server/src/routes/organizations/index.ts` | MODIFIED | Verification + scanner-info endpoints |
| `server/src/routes/competitors/index.ts` | MODIFIED | Disabled with 403 |
| `server/src/services/queue/audit-worker.service.ts` | MODIFIED | Unverified mode + bypass settings |
| `server/src/services/domain.service.ts` | MODIFIED | Update bypass settings |
| `server/src/types/spider.types.ts` | MODIFIED | Added customHeaders |
| `server/src/services/spider/spider.service.ts` | MODIFIED | Custom headers support |
| `server/src/services/spider/coordinator.service.ts` | MODIFIED | SiteSeer user-agent |
| `server/src/services/spider/robots-parser.service.ts` | MODIFIED | SiteSeer user-agent |
| `server/src/services/spider/sitemap-parser.service.ts` | MODIFIED | SiteSeer user-agent |
| `server/src/services/audit-engines/security.engine.ts` | MODIFIED | SiteSeer user-agent |
| `server/src/schemas/auth.schemas.ts` | MODIFIED | acceptedTos field |
| `client/src/components/audits/UnverifiedDomainConsentModal.tsx` | NEW | Consent modal |
| `client/src/components/domains/DomainVerification.tsx` | NEW | Verification wizard |
| `client/src/components/domains/ScannerInfo.tsx` | NEW | Scanner info for whitelisting |
| `client/src/components/domains/VerifiedDomainSettings.tsx` | NEW | Bypass settings UI |
| `client/src/pages/audits/NewAudit.tsx` | MODIFIED | Consent flow integration |
| `client/src/components/auth/RegisterForm.tsx` | MODIFIED | ToS checkbox |
| `client/src/services/api.ts` | MODIFIED | New API methods |
| `client/src/types/organization.types.ts` | MODIFIED | Bypass settings fields |
| `client/src/components/layout/DashboardLayout.tsx` | MODIFIED | Removed competitor nav |

---

---

## Scanner Bypass Settings (Added 2026-02-01)

For verified domains, users can configure bypass settings to handle WAF protection like Cloudflare, IM360, etc.

### Database Changes

#### Migration: `022_scanner_bypass_settings.sql`

**New columns on `organization_domains`:**
```sql
ADD COLUMN ignore_robots_txt BOOLEAN DEFAULT FALSE
ADD COLUMN rate_limit_profile VARCHAR(20) DEFAULT 'conservative'
ADD COLUMN send_verification_header BOOLEAN DEFAULT TRUE
```

### Backend Constants

**Added to `server/src/constants/consent.constants.ts`:**

```typescript
// Scanner identification
SCANNER_INFO = {
  USER_AGENT: 'SiteSeer-Scanner/1.0 (+https://siteseer.io/bot)',
  BOT_INFO_URL: 'https://siteseer.io/bot',
  IPS: string[],  // From SCANNER_IPS env var
  VERIFICATION_HEADER: 'X-SiteSeer-Token',
}

// Rate limit profiles
RATE_LIMIT_PROFILES = {
  conservative: { minDelayMs: 1500, concurrentPages: 1 },
  normal: { minDelayMs: 500, concurrentPages: 2 },
  aggressive: { minDelayMs: 100, concurrentPages: 4 },
}
```

### New API Endpoints

#### `GET /api/organizations/scanner-info`

Returns scanner details for whitelisting.

**Response:**
```json
{
  "userAgent": "SiteSeer-Scanner/1.0 (+https://siteseer.io/bot)",
  "botInfoUrl": "https://siteseer.io/bot",
  "ips": ["x.x.x.x"],
  "verificationHeader": "X-SiteSeer-Token",
  "rateLimitProfiles": [
    { "id": "conservative", "label": "Conservative", "description": "..." },
    { "id": "normal", "label": "Normal", "description": "..." },
    { "id": "aggressive", "label": "Aggressive", "description": "..." }
  ]
}
```

#### Modified: `PATCH /api/organizations/:orgId/domains/:domainId`

**Now accepts bypass settings:**
```json
{
  "ignore_robots_txt": true,
  "rate_limit_profile": "normal",
  "send_verification_header": true
}
```

*Note: Bypass settings only work for verified domains.*

### Backend Worker Changes

`audit-worker.service.ts` now:
1. Looks up domain bypass settings via `getDomainSettingsForAudit()`
2. Applies rate limit profile settings for verified domains
3. Respects robots.txt bypass flag
4. Sends verification header if enabled

### New Frontend Components

#### `client/src/components/domains/ScannerInfo.tsx`

Displays scanner details for WAF whitelisting:
- User-Agent string with copy button
- IP addresses with copy buttons
- Verification header name
- Cloudflare configuration instructions

#### `client/src/components/domains/VerifiedDomainSettings.tsx`

Settings panel for verified domains:
- Rate limit profile selector (conservative/normal/aggressive)
- "Ignore robots.txt" toggle
- "Send verification header" toggle

### Branding Updates

All references changed from "AuditArmor" to "SiteSeer-Scanner":
- Spider user-agent
- Sitemap parser user-agent
- Robots parser user-agent
- Security engine user-agent

---

## Future Considerations

1. **Re-enable Competitor Feature** - Could be re-enabled with consent flow applied
2. **Verification Expiry** - Consider adding expiration to domain verification
3. **Stricter Limits for Free Tier** - Could reduce to 2 pages or 1 page
4. **Whitelist Known Safe Domains** - Skip consent for certain domains
5. **Abuse Detection** - Flag users scanning many unverified domains
6. **IP Address Management** - Admin interface to manage scanner IPs
