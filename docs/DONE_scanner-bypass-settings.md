# Scanner Bypass Settings

**Implementation Date:** 2026-02-01
**Status:** Complete

---

## Overview

This feature allows verified domain owners to configure how the SiteSeer scanner interacts with their website. It addresses the problem of WAF/security systems (like Cloudflare, IM360) blocking the scanner, by providing multiple whitelisting options.

## Problem Statement

- Verified domain owners may have security protection that blocks the scanner
- Users need a way to whitelist the scanner in their WAF/firewall
- Different sites have different capacity - one crawl speed doesn't fit all
- Some users want to scan pages blocked by their own robots.txt

---

## Scanner Identification

### User-Agent String

```
SiteSeer-Scanner/1.0 (+https://siteseer.io/bot)
```

This User-Agent is used for all scanner requests. Users can whitelist this string in their WAF rules.

### IP Addresses

Scanner IPs are configured via the `SCANNER_IPS` environment variable (comma-separated).

```bash
# Example
SCANNER_IPS=203.0.113.10,203.0.113.11
```

### Verification Header

When enabled, the scanner sends:

```
X-SiteSeer-Token: <domain-verification-token>
```

This allows users to create WAF rules that only allow requests with their specific token.

---

## Rate Limit Profiles

Verified domain owners can choose from three crawl speed profiles:

| Profile | Delay Between Requests | Concurrent Pages | Best For |
|---------|----------------------|------------------|----------|
| **Conservative** | 1,500ms | 1 | Shared hosting, limited resources |
| **Normal** | 500ms | 2 | Standard servers, most websites |
| **Aggressive** | 100ms | 4 | Robust servers, CDN-backed sites |

### Configuration

```typescript
RATE_LIMIT_PROFILES = {
  conservative: {
    label: 'Conservative',
    description: 'Safest option - minimal impact on your server',
    minDelayMs: 1500,
    maxDelayMs: 3000,
    requestsPerSecond: 0.7,
    concurrentPages: 1,
  },
  normal: {
    label: 'Normal',
    description: 'Balanced speed - suitable for most servers',
    minDelayMs: 500,
    maxDelayMs: 1500,
    requestsPerSecond: 2,
    concurrentPages: 2,
  },
  aggressive: {
    label: 'Aggressive',
    description: 'Faster crawling - only for robust servers',
    minDelayMs: 100,
    maxDelayMs: 500,
    requestsPerSecond: 5,
    concurrentPages: 4,
  },
}
```

---

## Database Schema

### Migration: `022_scanner_bypass_settings.sql`

```sql
-- Add bypass settings to organization_domains
ALTER TABLE organization_domains
ADD COLUMN IF NOT EXISTS ignore_robots_txt BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS rate_limit_profile VARCHAR(20) DEFAULT 'conservative',
ADD COLUMN IF NOT EXISTS send_verification_header BOOLEAN DEFAULT TRUE;

-- Constraint for valid profile values
ALTER TABLE organization_domains
ADD CONSTRAINT organization_domains_rate_limit_profile_check
CHECK (rate_limit_profile IN ('conservative', 'normal', 'aggressive'));
```

---

## API Endpoints

### GET /api/organizations/scanner-info

Returns scanner identification details for whitelisting.

**Authentication:** Required

**Response:**
```json
{
  "userAgent": "SiteSeer-Scanner/1.0 (+https://siteseer.io/bot)",
  "botInfoUrl": "https://siteseer.io/bot",
  "ips": ["203.0.113.10", "203.0.113.11"],
  "verificationHeader": "X-SiteSeer-Token",
  "rateLimitProfiles": [
    {
      "id": "conservative",
      "label": "Conservative",
      "description": "Safest option - minimal impact on your server"
    },
    {
      "id": "normal",
      "label": "Normal",
      "description": "Balanced speed - suitable for most servers"
    },
    {
      "id": "aggressive",
      "label": "Aggressive",
      "description": "Faster crawling - only for robust servers"
    }
  ]
}
```

### PATCH /api/organizations/:orgId/domains/:domainId

Update domain settings including bypass options.

**Authentication:** Required
**Permission:** `domain:write`

**Request Body:**
```json
{
  "ignore_robots_txt": true,
  "rate_limit_profile": "normal",
  "send_verification_header": true
}
```

**Response:**
```json
{
  "domain": {
    "id": "uuid",
    "domain": "example.com",
    "verified": true,
    "ignore_robots_txt": true,
    "rate_limit_profile": "normal",
    "send_verification_header": true
  }
}
```

**Error (if domain not verified):**
```json
{
  "error": "Bypass settings can only be configured for verified domains",
  "code": "DOMAIN_NOT_VERIFIED"
}
```

---

## Backend Implementation

### Domain Settings Lookup

`server/src/services/domain-verification.service.ts`:

```typescript
export interface DomainAuditSettings {
  verified: boolean;
  ignoreRobotsTxt: boolean;
  rateLimitProfile: string | null;
  sendVerificationHeader: boolean;
  verificationToken: string | null;
}

export async function getDomainSettingsForAudit(
  organizationId: string,
  hostname: string
): Promise<DomainAuditSettings | null>
```

### Audit Worker Integration

`server/src/services/queue/audit-worker.service.ts`:

1. Looks up domain settings at audit start
2. Applies rate limit profile if verified domain
3. Respects `ignore_robots_txt` setting
4. Adds verification header to requests if enabled

```typescript
// Look up domain bypass settings for verified domains
const domainSettings = job.organization_id
  ? await getDomainSettingsForAudit(job.organization_id, job.target_domain)
  : null;

// Apply rate limit profile
if (domainSettings?.verified && domainSettings.rateLimitProfile) {
  const profile = RATE_LIMIT_PROFILES[domainSettings.rateLimitProfile];
  rateLimitConfig = {
    minDelayMs: profile.minDelayMs,
    concurrentPages: profile.concurrentPages,
  };
}

// Apply robots.txt bypass
if (domainSettings?.verified && domainSettings.ignoreRobotsTxt) {
  respectRobotsTxt = false;
}

// Add verification header
if (domainSettings?.verified && domainSettings.sendVerificationHeader) {
  customHeaders[SCANNER_INFO.VERIFICATION_HEADER] = domainSettings.verificationToken;
}
```

### Spider Custom Headers

`server/src/types/spider.types.ts`:

```typescript
export interface SpiderConfig {
  // ... existing fields
  customHeaders?: Record<string, string>;
}
```

`server/src/services/spider/spider.service.ts`:

```typescript
// Merge fingerprint headers with any custom headers from config
const headers = {
  ...fingerprint.headers,
  ...(this.config.customHeaders || {}),
};
```

---

## Frontend Components

### ScannerInfo Component

**Location:** `client/src/components/domains/ScannerInfo.tsx`

Displays scanner details for whitelisting:
- User-Agent string with copy button
- IP addresses with copy buttons
- Verification header name
- Cloudflare configuration instructions

### VerifiedDomainSettings Component

**Location:** `client/src/components/domains/VerifiedDomainSettings.tsx`

Settings panel for verified domains:
- Rate limit profile selector (radio buttons)
- "Ignore robots.txt" checkbox
- "Send verification header" checkbox
- Save button with loading state

---

## WAF Configuration Examples

### Cloudflare

1. Go to **Security > WAF > Custom Rules**
2. Create a new rule with action **Skip**
3. Add condition: `User-Agent contains "SiteSeer-Scanner"`

Or using IP allowlist:
1. Go to **Security > WAF > Tools**
2. Add scanner IPs to the IP Access Rules with **Allow** action

### Generic WAF (Using Header)

Allow requests where:
```
Header "X-SiteSeer-Token" equals "<your-verification-token>"
```

### Nginx

```nginx
# Allow by User-Agent
if ($http_user_agent ~* "SiteSeer-Scanner") {
    set $allow_scanner 1;
}

# Allow by IP
geo $scanner_ip {
    default 0;
    203.0.113.10 1;
    203.0.113.11 1;
}

# Allow by verification header
if ($http_x_siteseer_token = "your-verification-token") {
    set $allow_scanner 1;
}
```

### Apache (.htaccess)

```apache
# Allow SiteSeer scanner
SetEnvIfNoCase User-Agent "SiteSeer-Scanner" allow_scanner

# Or by IP
SetEnvIf Remote_Addr "203\.0\.113\.10" allow_scanner
SetEnvIf Remote_Addr "203\.0\.113\.11" allow_scanner

<RequireAny>
    Require env allow_scanner
    Require all granted
</RequireAny>
```

---

## Files Changed

| File | Type | Description |
|------|------|-------------|
| `server/src/db/migrations/022_scanner_bypass_settings.sql` | NEW | Database migration |
| `server/src/constants/consent.constants.ts` | MODIFIED | Added SCANNER_INFO, RATE_LIMIT_PROFILES |
| `server/src/services/domain-verification.service.ts` | MODIFIED | Added getDomainSettingsForAudit |
| `server/src/services/domain.service.ts` | MODIFIED | Updated updateDomain for bypass settings |
| `server/src/routes/organizations/index.ts` | MODIFIED | Added scanner-info endpoint, bypass validation |
| `server/src/services/queue/audit-worker.service.ts` | MODIFIED | Bypass settings integration |
| `server/src/types/spider.types.ts` | MODIFIED | Added customHeaders to SpiderConfig |
| `server/src/services/spider/spider.service.ts` | MODIFIED | Custom headers support |
| `server/src/services/spider/*.ts` | MODIFIED | Updated to SiteSeer user-agent |
| `server/src/services/audit-engines/security.engine.ts` | MODIFIED | Updated to SiteSeer user-agent |
| `client/src/components/domains/ScannerInfo.tsx` | NEW | Scanner info display |
| `client/src/components/domains/VerifiedDomainSettings.tsx` | NEW | Bypass settings UI |
| `client/src/services/api.ts` | MODIFIED | Added getScannerInfo, updated updateDomain |
| `client/src/types/organization.types.ts` | MODIFIED | Added bypass fields to OrganizationDomain |

---

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `SCANNER_IPS` | Comma-separated list of scanner IP addresses | `203.0.113.10,203.0.113.11` |

---

## Security Considerations

1. **Bypass settings only for verified domains** - Users must prove ownership before configuring these settings
2. **Verification header is domain-specific** - Each domain has a unique token
3. **Rate limits still apply** - Even aggressive profile has reasonable limits
4. **Activity logging** - All scans are logged regardless of bypass settings

---

## Testing Checklist

- [ ] Verify scanner-info endpoint returns correct data
- [ ] Verify bypass settings can only be set for verified domains
- [ ] Test conservative rate profile (should be slow)
- [ ] Test normal rate profile (balanced speed)
- [ ] Test aggressive rate profile (faster crawling)
- [ ] Test robots.txt bypass for verified domain
- [ ] Test verification header is sent when enabled
- [ ] Test verification header is NOT sent when disabled
- [ ] Test ScannerInfo component displays all information
- [ ] Test VerifiedDomainSettings saves correctly
