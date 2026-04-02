# kritano - Team Workspaces & Subscription Plan

Comprehensive implementation plan for team workspaces, subscription tiers, and billing infrastructure.

**Created:** 2026-01-29
**Status:** Planning
**Priority:** High

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Subscription Tiers](#2-subscription-tiers)
3. [Team & Organization Structure](#3-team--organization-structure)
4. [Domain Management](#4-domain-management)
5. [API Allocations](#5-api-allocations)
6. [Database Schema](#6-database-schema)
7. [Permission System (RBAC)](#7-permission-system-rbac)
8. [Billing Integration](#8-billing-integration)
9. [Migration Strategy](#9-migration-strategy)
10. [Implementation Phases](#10-implementation-phases)
11. [UI/UX Considerations](#11-uiux-considerations)
12. [Security Considerations](#12-security-considerations)

---

## 1. Executive Summary

### Goals
- Enable team collaboration on website audits
- Implement tiered subscription model for monetization
- Provide flexible domain management per tier
- Scale API access based on subscription level
- Support agency use cases with white-labeling

### Key Constraints
- **Free tier must be genuinely useful** (not just a trial)
- **Domain locking** prevents abuse of free tier
- **Seat-based pricing** for teams encourages organic growth
- **API limits** tied to organization, not individual users

---

## 2. Subscription Tiers

### 2.1 Tier Comparison Matrix

| Feature | FREE | STARTER | PRO | AGENCY | ENTERPRISE |
|---------|------|---------|-----|--------|------------|
| **Price** | $0/mo | $19/mo | $49/mo | $149/mo | Custom |
| **Team Members** | 1 | 1 | 5 | Unlimited | Unlimited |
| **Extra Seats** | - | - | $10/seat | $15/seat | Custom |
| **Domains** | 1 (locked) | 3 | 10 | Unlimited | Unlimited |
| **Audits/Month** | 5 | 10 | Unlimited | Unlimited | Unlimited |
| **Pages/Audit** | 50 | 250 | 1,000 | 5,000 | 10,000+ |
| **Audit Depth** | 3 levels | 5 levels | 10 levels | 10 levels | Custom |
| **Checks** | SEO, A11y | All | All | All + Custom | All + Custom |
| **Scheduled Audits** | - | Weekly | Daily | Hourly | Custom |
| **Data Retention** | 30 days | 90 days | 1 year | 2 years | Unlimited |
| **API Requests/Day** | 100 | 1,000 | 10,000 | 100,000 | Unlimited |
| **Concurrent Audits** | 1 | 3 | 10 | 50 | Custom |
| **Exports** | - | PDF | PDF, CSV, JSON | All + White-label | All |
| **Support** | Community | Email | Priority | Dedicated | Account Manager |
| **SSO/SAML** | - | - | - | Add-on | Included |
| **SLA** | - | - | - | 99.5% | 99.9% |

### 2.2 Tier Details

#### FREE ($0/month)
```
Purpose: Allow users to try the product with real value
Target: Individual developers, small personal sites

Constraints:
- 1 domain LOCKED per billing cycle
- Domain can be changed, but new domain only auditable next month
- Encourages upgrade when user has multiple sites
```

**Domain Locking Logic:**
```
1. User sets their domain in settings (e.g., "mysite.com")
2. First audit of the month "locks" that domain
3. User can change domain setting anytime
4. Changed domain becomes active on next billing cycle (1st of month)
5. Shows countdown: "New domain active in X days"
```

#### STARTER ($19/month)
```
Purpose: Individual professionals with multiple small sites
Target: Freelancers, consultants, small business owners

Value Proposition:
- 3 domains covers typical portfolio
- 10 audits/month allows weekly checks
- PDF exports for client reports
```

#### PRO ($49/month)
```
Purpose: Small teams and growing agencies
Target: Dev teams, marketing agencies, in-house SEO teams

Value Proposition:
- Team collaboration (5 seats included)
- 10 domains for client work
- Unlimited audits for continuous monitoring
- Scheduled audits for automation
- 1 year data retention for trend analysis
```

#### AGENCY ($149/month)
```
Purpose: Full-service agencies managing many clients
Target: Digital agencies, enterprise consultants

Value Proposition:
- Unlimited everything for scale
- White-label reports with custom branding
- High API limits for integrations
- Dedicated support channel
```

#### ENTERPRISE (Custom Pricing)
```
Purpose: Large organizations with specific needs
Target: Fortune 500, government, healthcare

Additional Features:
- SSO/SAML integration
- Custom SLA
- On-premise deployment option
- Dedicated infrastructure
- Custom integrations
- Compliance certifications (SOC2, HIPAA)
```

### 2.3 Add-ons (Available for PRO+)

| Add-on | Price | Description |
|--------|-------|-------------|
| Extra Seats | $10-15/seat/mo | Additional team members |
| Extra Domains | $5/domain/mo | Beyond tier limit |
| Extended Retention | $20/mo | +1 year data retention |
| SSO/SAML | $50/mo | Enterprise authentication |
| Priority Queue | $30/mo | Faster audit processing |
| Custom Rules | $25/mo | Create custom audit rules |

---

## 3. Team & Organization Structure

### 3.1 Hierarchy

```
Organization (Workspace)
│
├── Settings
│   ├── General (name, slug, logo)
│   ├── Billing (subscription, payment method)
│   ├── Domains (allowed domains list)
│   └── Security (SSO, 2FA requirements)
│
├── Team
│   ├── Owner (1) - Cannot be removed, can transfer
│   ├── Admins (n) - Full management access
│   ├── Members (n) - Create and manage audits
│   └── Viewers (n) - Read-only access
│
├── Resources
│   ├── Audits (owned by organization)
│   ├── API Keys (organization-scoped)
│   ├── Scheduled Jobs (organization-scoped)
│   └── Reports (organization-scoped)
│
└── Audit Log
    └── All organization activity
```

### 3.2 Role Permissions

| Permission | Owner | Admin | Member | Viewer |
|------------|-------|-------|--------|--------|
| **Organization** |
| View organization | ✓ | ✓ | ✓ | ✓ |
| Edit organization settings | ✓ | ✓ | - | - |
| Delete organization | ✓ | - | - | - |
| Transfer ownership | ✓ | - | - | - |
| **Billing** |
| View billing | ✓ | ✓ | - | - |
| Manage subscription | ✓ | ✓ | - | - |
| Update payment method | ✓ | ✓ | - | - |
| **Team** |
| View team members | ✓ | ✓ | ✓ | ✓ |
| Invite members | ✓ | ✓ | - | - |
| Remove members | ✓ | ✓ | - | - |
| Change member roles | ✓ | ✓* | - | - |
| **Domains** |
| View domains | ✓ | ✓ | ✓ | ✓ |
| Add/remove domains | ✓ | ✓ | - | - |
| **Audits** |
| View all audits | ✓ | ✓ | ✓ | ✓ |
| Create audits | ✓ | ✓ | ✓ | - |
| Edit/delete own audits | ✓ | ✓ | ✓ | - |
| Edit/delete any audit | ✓ | ✓ | - | - |
| Export audits | ✓ | ✓ | ✓ | - |
| **API Keys** |
| View API keys | ✓ | ✓ | ✓ | - |
| Create API keys | ✓ | ✓ | - | - |
| Revoke API keys | ✓ | ✓ | - | - |
| **Scheduled Audits** |
| View schedules | ✓ | ✓ | ✓ | ✓ |
| Create/edit schedules | ✓ | ✓ | ✓ | - |
| Delete schedules | ✓ | ✓ | - | - |

*Admins cannot promote to Owner or demote other Admins

### 3.3 Invitation Flow

```
1. Admin enters email address
2. System checks if email exists in platform
   a. If exists: Send "join organization" invite
   b. If not: Send "signup + join" invite
3. Invite includes:
   - Organization name
   - Inviter name
   - Assigned role
   - Expiry (7 days)
4. Recipient clicks link
5. If new user: Complete registration first
6. Accept/decline invitation
7. On accept: Added to organization with role
```

### 3.4 Personal vs Organization Context

Users can belong to multiple organizations:
```
User Account
├── Personal Workspace (default, always exists)
│   └── FREE tier unless upgraded individually
│
├── Organization A (invited as Admin)
│   └── PRO tier
│
└── Organization B (invited as Member)
    └── AGENCY tier
```

**Context Switching:**
- Dropdown in header to switch organizations
- Each org has separate audits, API keys, etc.
- User's role determines permissions in each context

---

## 4. Domain Management

### 4.1 Domain Model

```typescript
interface OrganizationDomain {
  id: string;
  organizationId: string;
  domain: string;              // e.g., "example.com"
  includeSubdomains: boolean;  // Allow *.example.com
  verified: boolean;           // DNS verification complete
  verificationToken: string;   // For DNS TXT record
  status: 'active' | 'pending' | 'locked';
  lockedUntil: Date | null;    // For FREE tier locking
  addedAt: Date;
  addedBy: string;             // User ID
}
```

### 4.2 Domain Rules by Tier

#### FREE Tier Domain Locking
```
State Machine:

UNSET → [User sets domain] → PENDING
PENDING → [First audit starts] → LOCKED
LOCKED → [Billing cycle resets] → ACTIVE
ACTIVE → [User changes domain] → PENDING_CHANGE
PENDING_CHANGE → [Billing cycle resets] → PENDING (new domain)

Timeline Example:
Jan 15: User sets domain to "site-a.com" → PENDING
Jan 16: User runs audit on "site-a.com" → LOCKED until Feb 1
Jan 20: User changes domain to "site-b.com" → Still LOCKED on "site-a.com"
Feb 1:  Billing cycle resets → "site-b.com" becomes PENDING
Feb 3:  User runs audit on "site-b.com" → LOCKED until Mar 1
```

#### Paid Tier Domain Management
```
- Can add domains up to tier limit
- All domains active immediately
- No locking mechanism
- Can remove domains anytime
- Removing domain doesn't delete audit history
```

### 4.3 Domain Verification (Optional)

For enhanced security, organizations can verify domain ownership:

```
1. System generates unique token: "kritano-verify=abc123xyz"
2. User adds DNS TXT record to their domain
3. System checks for TXT record periodically
4. On success: Domain marked as verified
5. Verified domains get badge in UI
6. Optional: Require verification for audits (enterprise feature)
```

### 4.4 Subdomain Handling

```
Configuration per domain:
- Include subdomains: ON/OFF

If ON:
  - "example.com" allows audits of:
    - example.com
    - www.example.com
    - blog.example.com
    - app.example.com

If OFF:
  - Only exact domain match allowed
  - Subdomains count as separate domains
```

---

## 5. API Allocations

### 5.1 Rate Limits by Tier

| Tier | Requests/Minute | Requests/Day | Burst Limit |
|------|-----------------|--------------|-------------|
| FREE | 10 | 100 | 20 |
| STARTER | 60 | 1,000 | 100 |
| PRO | 300 | 10,000 | 500 |
| AGENCY | 1,000 | 100,000 | 2,000 |
| ENTERPRISE | Custom | Unlimited | Custom |

### 5.2 Concurrent Audit Limits

| Tier | Concurrent Audits | Queue Priority |
|------|-------------------|----------------|
| FREE | 1 | Low |
| STARTER | 3 | Normal |
| PRO | 10 | High |
| AGENCY | 50 | Highest |
| ENTERPRISE | Custom | Dedicated |

### 5.3 API Key Scopes by Tier

| Scope | FREE | STARTER | PRO | AGENCY |
|-------|------|---------|-----|--------|
| `audits:read` | ✓ | ✓ | ✓ | ✓ |
| `audits:write` | ✓ | ✓ | ✓ | ✓ |
| `findings:read` | ✓ | ✓ | ✓ | ✓ |
| `findings:write` | - | ✓ | ✓ | ✓ |
| `schedules:read` | - | ✓ | ✓ | ✓ |
| `schedules:write` | - | ✓ | ✓ | ✓ |
| `team:read` | - | - | ✓ | ✓ |
| `team:write` | - | - | ✓ | ✓ |
| `webhooks:manage` | - | - | ✓ | ✓ |
| `exports:create` | - | ✓ | ✓ | ✓ |
| `whitelabel:use` | - | - | - | ✓ |

### 5.4 Rate Limit Headers

All API responses include:
```http
X-RateLimit-Limit: 300
X-RateLimit-Remaining: 298
X-RateLimit-Reset: 1706540400
X-RateLimit-Tier: pro
X-Concurrent-Audits-Limit: 10
X-Concurrent-Audits-Used: 3
```

---

## 6. Database Schema

### 6.1 New Tables

```sql
-- =============================================
-- ORGANIZATIONS
-- =============================================
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,  -- URL-friendly identifier
  logo_url TEXT,

  -- Ownership
  owner_id UUID NOT NULL REFERENCES users(id),

  -- Settings
  settings JSONB DEFAULT '{}',
  -- {
  --   "defaultAuditChecks": ["seo", "accessibility", "security", "performance"],
  --   "requireDomainVerification": false,
  --   "allowMemberInvites": false,
  --   "auditNotifications": true
  -- }

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_organizations_owner ON organizations(owner_id);
CREATE INDEX idx_organizations_slug ON organizations(slug);

-- =============================================
-- ORGANIZATION MEMBERS
-- =============================================
CREATE TYPE org_role AS ENUM ('owner', 'admin', 'member', 'viewer');

CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role org_role NOT NULL DEFAULT 'member',

  invited_by UUID REFERENCES users(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ,

  UNIQUE(organization_id, user_id)
);

CREATE INDEX idx_org_members_org ON organization_members(organization_id);
CREATE INDEX idx_org_members_user ON organization_members(user_id);

-- =============================================
-- ORGANIZATION INVITATIONS
-- =============================================
CREATE TYPE invite_status AS ENUM ('pending', 'accepted', 'declined', 'expired');

CREATE TABLE organization_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role org_role NOT NULL DEFAULT 'member',

  invited_by UUID NOT NULL REFERENCES users(id),
  token VARCHAR(64) UNIQUE NOT NULL,
  status invite_status DEFAULT 'pending',

  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);

CREATE INDEX idx_org_invites_org ON organization_invitations(organization_id);
CREATE INDEX idx_org_invites_email ON organization_invitations(email);
CREATE INDEX idx_org_invites_token ON organization_invitations(token);

-- =============================================
-- SUBSCRIPTIONS
-- =============================================
CREATE TYPE subscription_tier AS ENUM ('free', 'starter', 'pro', 'agency', 'enterprise');
CREATE TYPE subscription_status AS ENUM ('active', 'past_due', 'canceled', 'trialing', 'paused');

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID UNIQUE NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Tier
  tier subscription_tier NOT NULL DEFAULT 'free',
  status subscription_status NOT NULL DEFAULT 'active',

  -- Stripe Integration
  stripe_customer_id VARCHAR(50),
  stripe_subscription_id VARCHAR(50),
  stripe_price_id VARCHAR(50),

  -- Billing Cycle
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMPTZ,

  -- Trial
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,

  -- Seats (for PRO+)
  included_seats INTEGER NOT NULL DEFAULT 1,
  extra_seats INTEGER DEFAULT 0,

  -- Add-ons
  addons JSONB DEFAULT '[]',
  -- [
  --   { "type": "extra_domains", "quantity": 5 },
  --   { "type": "sso", "enabled": true }
  -- ]

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_org ON subscriptions(organization_id);
CREATE INDEX idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_stripe_sub ON subscriptions(stripe_subscription_id);

-- =============================================
-- ORGANIZATION DOMAINS
-- =============================================
CREATE TYPE domain_status AS ENUM ('active', 'pending', 'locked', 'pending_change');

CREATE TABLE organization_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  domain VARCHAR(255) NOT NULL,
  include_subdomains BOOLEAN DEFAULT TRUE,

  -- Verification
  verified BOOLEAN DEFAULT FALSE,
  verification_token VARCHAR(64),
  verified_at TIMESTAMPTZ,

  -- Status (for FREE tier locking)
  status domain_status DEFAULT 'active',
  locked_until TIMESTAMPTZ,
  pending_domain VARCHAR(255),  -- New domain waiting for next cycle

  added_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, domain)
);

CREATE INDEX idx_org_domains_org ON organization_domains(organization_id);
CREATE INDEX idx_org_domains_domain ON organization_domains(domain);

-- =============================================
-- USAGE TRACKING
-- =============================================
CREATE TABLE usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Counters
  audits_count INTEGER DEFAULT 0,
  pages_crawled INTEGER DEFAULT 0,
  api_requests INTEGER DEFAULT 0,
  exports_count INTEGER DEFAULT 0,

  -- Snapshots (for billing reconciliation)
  domains_snapshot INTEGER DEFAULT 0,
  seats_snapshot INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, period_start)
);

CREATE INDEX idx_usage_org ON usage_records(organization_id);
CREATE INDEX idx_usage_period ON usage_records(period_start, period_end);

-- =============================================
-- AUDIT LOG
-- =============================================
CREATE TABLE organization_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),

  action VARCHAR(100) NOT NULL,
  -- Examples: 'member.invited', 'member.removed', 'subscription.upgraded',
  -- 'domain.added', 'audit.created', 'settings.updated'

  resource_type VARCHAR(50),
  resource_id UUID,

  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_log_org ON organization_audit_log(organization_id);
CREATE INDEX idx_audit_log_user ON organization_audit_log(user_id);
CREATE INDEX idx_audit_log_created ON organization_audit_log(created_at DESC);

-- =============================================
-- MODIFY EXISTING TABLES
-- =============================================

-- Add organization_id to audit_jobs
ALTER TABLE audit_jobs
  ADD COLUMN organization_id UUID REFERENCES organizations(id);

CREATE INDEX idx_audit_jobs_org ON audit_jobs(organization_id);

-- Add organization_id to api_keys
ALTER TABLE api_keys
  ADD COLUMN organization_id UUID REFERENCES organizations(id);

CREATE INDEX idx_api_keys_org ON api_keys(organization_id);

-- =============================================
-- TIER LIMITS (Reference Table)
-- =============================================
CREATE TABLE tier_limits (
  tier subscription_tier PRIMARY KEY,

  -- Team
  max_seats INTEGER,              -- NULL = unlimited

  -- Domains
  max_domains INTEGER,            -- NULL = unlimited
  domain_locking BOOLEAN DEFAULT FALSE,

  -- Audits
  max_audits_per_month INTEGER,   -- NULL = unlimited
  max_pages_per_audit INTEGER NOT NULL,
  max_audit_depth INTEGER NOT NULL,

  -- Features
  available_checks TEXT[] NOT NULL,
  scheduled_audits BOOLEAN DEFAULT FALSE,
  min_schedule_interval INTERVAL,  -- e.g., '1 day', '1 hour'

  -- Data
  data_retention_days INTEGER NOT NULL,

  -- API
  api_requests_per_day INTEGER,   -- NULL = unlimited
  api_requests_per_minute INTEGER NOT NULL,
  concurrent_audits INTEGER NOT NULL,

  -- Exports
  export_pdf BOOLEAN DEFAULT FALSE,
  export_csv BOOLEAN DEFAULT FALSE,
  export_json BOOLEAN DEFAULT FALSE,
  white_label BOOLEAN DEFAULT FALSE
);

-- Insert tier configurations
INSERT INTO tier_limits VALUES
  ('free', 1, 1, TRUE, 1, 50, 3,
   ARRAY['seo', 'accessibility'], FALSE, NULL, 30,
   100, 10, 1, FALSE, FALSE, FALSE, FALSE),

  ('starter', 1, 3, FALSE, 10, 250, 5,
   ARRAY['seo', 'accessibility', 'security', 'performance'], TRUE, '7 days', 90,
   1000, 60, 3, TRUE, FALSE, FALSE, FALSE),

  ('pro', 5, 10, FALSE, NULL, 1000, 10,
   ARRAY['seo', 'accessibility', 'security', 'performance'], TRUE, '1 day', 365,
   10000, 300, 10, TRUE, TRUE, TRUE, FALSE),

  ('agency', NULL, NULL, FALSE, NULL, 5000, 10,
   ARRAY['seo', 'accessibility', 'security', 'performance'], TRUE, '1 hour', 730,
   100000, 1000, 50, TRUE, TRUE, TRUE, TRUE),

  ('enterprise', NULL, NULL, FALSE, NULL, 10000, 10,
   ARRAY['seo', 'accessibility', 'security', 'performance'], TRUE, '15 minutes', NULL,
   NULL, 2000, 100, TRUE, TRUE, TRUE, TRUE);
```

### 6.2 Migration for Existing Users

```sql
-- Create personal organization for each existing user
INSERT INTO organizations (name, slug, owner_id)
SELECT
  CONCAT(first_name, '''s Workspace'),
  CONCAT('user-', id),
  id
FROM users;

-- Create owner membership
INSERT INTO organization_members (organization_id, user_id, role, joined_at)
SELECT o.id, o.owner_id, 'owner', NOW()
FROM organizations o;

-- Create free subscription for each organization
INSERT INTO subscriptions (organization_id, tier, status)
SELECT id, 'free', 'active'
FROM organizations;

-- Migrate existing audits to personal organizations
UPDATE audit_jobs aj
SET organization_id = o.id
FROM organizations o
WHERE aj.user_id = o.owner_id;

-- Migrate existing API keys to personal organizations
UPDATE api_keys ak
SET organization_id = o.id
FROM organizations o
WHERE ak.user_id = o.owner_id;
```

---

## 7. Permission System (RBAC)

### 7.1 Permission Middleware

```typescript
// Types
type Permission =
  | 'org:read' | 'org:write' | 'org:delete'
  | 'billing:read' | 'billing:write'
  | 'team:read' | 'team:invite' | 'team:remove' | 'team:role'
  | 'domain:read' | 'domain:write'
  | 'audit:read' | 'audit:create' | 'audit:edit' | 'audit:delete'
  | 'apikey:read' | 'apikey:write'
  | 'schedule:read' | 'schedule:write' | 'schedule:delete'
  | 'export:create';

// Role -> Permissions mapping
const ROLE_PERMISSIONS: Record<OrgRole, Permission[]> = {
  owner: ['*'],  // All permissions
  admin: [
    'org:read', 'org:write',
    'billing:read', 'billing:write',
    'team:read', 'team:invite', 'team:remove', 'team:role',
    'domain:read', 'domain:write',
    'audit:read', 'audit:create', 'audit:edit', 'audit:delete',
    'apikey:read', 'apikey:write',
    'schedule:read', 'schedule:write', 'schedule:delete',
    'export:create'
  ],
  member: [
    'org:read',
    'team:read',
    'domain:read',
    'audit:read', 'audit:create', 'audit:edit',  // Own audits only
    'apikey:read',
    'schedule:read', 'schedule:write',
    'export:create'
  ],
  viewer: [
    'org:read',
    'team:read',
    'domain:read',
    'audit:read',
    'schedule:read'
  ]
};

// Middleware
function requirePermission(...permissions: Permission[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const { organizationId } = req.params;
    const userId = req.user.id;

    const membership = await getMembership(organizationId, userId);
    if (!membership) {
      return res.status(403).json({ error: 'Not a member of this organization' });
    }

    const userPermissions = ROLE_PERMISSIONS[membership.role];
    const hasPermission = permissions.every(p =>
      userPermissions.includes('*') || userPermissions.includes(p)
    );

    if (!hasPermission) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    req.membership = membership;
    next();
  };
}
```

### 7.2 Resource-Level Permissions

For audits, members can only edit their own:

```typescript
function canEditAudit(membership: Membership, audit: Audit): boolean {
  if (membership.role === 'owner' || membership.role === 'admin') {
    return true;
  }
  if (membership.role === 'member') {
    return audit.createdBy === membership.userId;
  }
  return false;
}
```

---

## 8. Billing Integration

### 8.1 Stripe Products Setup

```javascript
// Products in Stripe Dashboard
const STRIPE_PRODUCTS = {
  starter: {
    productId: 'prod_starter',
    prices: {
      monthly: 'price_starter_monthly',  // $19/mo
      yearly: 'price_starter_yearly'     // $190/yr (2 months free)
    }
  },
  pro: {
    productId: 'prod_pro',
    prices: {
      monthly: 'price_pro_monthly',      // $49/mo
      yearly: 'price_pro_yearly'         // $490/yr
    }
  },
  agency: {
    productId: 'prod_agency',
    prices: {
      monthly: 'price_agency_monthly',   // $149/mo
      yearly: 'price_agency_yearly'      // $1490/yr
    }
  },
  extra_seat_pro: {
    productId: 'prod_extra_seat_pro',
    prices: {
      monthly: 'price_seat_pro_monthly'  // $10/mo per seat
    }
  },
  extra_seat_agency: {
    productId: 'prod_extra_seat_agency',
    prices: {
      monthly: 'price_seat_agency_monthly'  // $15/mo per seat
    }
  }
};
```

### 8.2 Webhook Events

```typescript
// Stripe webhook handler
const WEBHOOK_HANDLERS = {
  'checkout.session.completed': handleCheckoutComplete,
  'customer.subscription.created': handleSubscriptionCreated,
  'customer.subscription.updated': handleSubscriptionUpdated,
  'customer.subscription.deleted': handleSubscriptionDeleted,
  'invoice.paid': handleInvoicePaid,
  'invoice.payment_failed': handlePaymentFailed,
  'customer.subscription.trial_will_end': handleTrialEnding,
};

async function handleSubscriptionUpdated(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;

  // Map Stripe price to tier
  const tier = mapPriceToTier(subscription.items.data[0].price.id);

  await db.query(`
    UPDATE subscriptions
    SET
      tier = $1,
      status = $2,
      current_period_start = $3,
      current_period_end = $4,
      cancel_at_period_end = $5,
      updated_at = NOW()
    WHERE stripe_subscription_id = $6
  `, [
    tier,
    mapStripeStatus(subscription.status),
    new Date(subscription.current_period_start * 1000),
    new Date(subscription.current_period_end * 1000),
    subscription.cancel_at_period_end,
    subscription.id
  ]);

  // Log the change
  await logOrganizationActivity(orgId, null, 'subscription.updated', {
    tier,
    status: subscription.status
  });
}
```

### 8.3 Billing Portal

```typescript
// Create Stripe billing portal session
async function createBillingPortalSession(organizationId: string) {
  const subscription = await getSubscription(organizationId);

  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.stripe_customer_id,
    return_url: `${APP_URL}/org/${organizationId}/settings/billing`,
  });

  return session.url;
}
```

### 8.4 Usage-Based Billing (Future)

For enterprise customers with usage-based pricing:

```typescript
// Report usage to Stripe
async function reportUsage(organizationId: string) {
  const subscription = await getSubscription(organizationId);
  const usage = await getMonthlyUsage(organizationId);

  // Report metered usage
  await stripe.subscriptionItems.createUsageRecord(
    subscription.stripe_subscription_item_id,
    {
      quantity: usage.pagesAudited,
      timestamp: Math.floor(Date.now() / 1000),
      action: 'set',
    }
  );
}
```

---

## 9. Migration Strategy

### 9.1 Phases

#### Phase 1: Database Schema (Week 1)
1. Create new tables (organizations, members, subscriptions, etc.)
2. Add organization_id columns to existing tables
3. Create tier_limits reference table
4. Add indexes

#### Phase 2: Data Migration (Week 1)
1. Create personal organization for each user
2. Set all existing users to FREE tier
3. Migrate audits to personal organizations
4. Migrate API keys to personal organizations

#### Phase 3: Backend Services (Week 2-3)
1. Organization CRUD service
2. Membership service
3. Invitation service
4. Permission middleware
5. Update audit service for org context
6. Update API key service for org context

#### Phase 4: Billing Integration (Week 3-4)
1. Stripe account setup
2. Product/price configuration
3. Checkout flow
4. Webhook handlers
5. Billing portal integration
6. Subscription management

#### Phase 5: Frontend (Week 4-5)
1. Organization context provider
2. Organization switcher
3. Team management UI
4. Billing/subscription UI
5. Domain management UI
6. Update existing pages for org context

#### Phase 6: Testing & Launch (Week 6)
1. Integration testing
2. Billing flow testing
3. Permission testing
4. Migration testing
5. Staged rollout

### 9.2 Backward Compatibility

During migration:
- All existing functionality continues to work
- Users see their "Personal Workspace" by default
- No forced upgrades
- Existing API keys continue to work (mapped to personal org)

### 9.3 Rollback Plan

If issues arise:
1. Revert frontend to pre-org version
2. API continues to work (falls back to user_id)
3. New data preserved in org tables
4. Can re-attempt migration after fixes

---

## 10. Implementation Phases

### Phase 1: Core Infrastructure (Priority: Critical)
- [ ] Database schema creation
- [ ] Organization service
- [ ] Membership service
- [ ] Permission middleware
- [ ] Data migration scripts

### Phase 2: Team Features (Priority: High)
- [ ] Invitation system
- [ ] Role management
- [ ] Organization settings
- [ ] Team management UI
- [ ] Organization switcher

### Phase 3: Billing (Priority: High)
- [ ] Stripe integration
- [ ] Checkout flow
- [ ] Subscription management
- [ ] Webhook handlers
- [ ] Billing portal

### Phase 4: Domain Management (Priority: Medium)
- [ ] Domain CRUD
- [ ] FREE tier locking logic
- [ ] Domain verification (optional)
- [ ] Subdomain handling

### Phase 5: Usage & Limits (Priority: Medium)
- [ ] Usage tracking
- [ ] Limit enforcement
- [ ] Overage handling
- [ ] Usage dashboard

### Phase 6: Advanced Features (Priority: Low)
- [ ] Audit log
- [ ] White-label exports
- [ ] SSO integration
- [ ] Custom branding

---

## 11. UI/UX Considerations

### 11.1 Organization Switcher

```
┌─────────────────────────────┐
│ ▼ Chris's Workspace         │
├─────────────────────────────┤
│   Personal Workspace    ✓   │
│   Acme Agency          PRO  │
│   Client Corp       AGENCY  │
├─────────────────────────────┤
│ + Create Organization       │
│ ⚙ Organization Settings     │
└─────────────────────────────┘
```

### 11.2 Team Settings Page

```
Organization Settings
├── General
│   ├── Name
│   ├── Slug (URL)
│   └── Logo
├── Team
│   ├── Members list
│   ├── Pending invitations
│   └── Invite member button
├── Billing
│   ├── Current plan
│   ├── Usage this period
│   ├── Payment method
│   └── Billing history
├── Domains
│   ├── Domain list
│   ├── Add domain
│   └── Verification status
└── Security
    ├── SSO configuration
    └── 2FA requirements
```

### 11.3 Upgrade Prompts

Show contextual upgrade prompts when:
- User hits domain limit
- User hits audit limit
- User tries to access PRO feature
- Team size exceeds seat limit

```
┌─────────────────────────────────────────┐
│ 🚀 Upgrade to PRO                       │
│                                         │
│ You've reached your domain limit.       │
│ Upgrade to PRO for:                     │
│                                         │
│ ✓ 10 domains (currently 1)              │
│ ✓ Unlimited audits                      │
│ ✓ Team collaboration (5 seats)          │
│ ✓ Scheduled audits                      │
│                                         │
│ Starting at $49/month                   │
│                                         │
│ [Upgrade Now]  [Maybe Later]            │
└─────────────────────────────────────────┘
```

### 11.4 FREE Tier Domain Lock UI

```
┌─────────────────────────────────────────┐
│ Domain Settings                         │
├─────────────────────────────────────────┤
│ Current Domain: mysite.com              │
│ Status: 🔒 Locked until Feb 1, 2026     │
│                                         │
│ [Change Domain for Next Month]          │
│                                         │
│ ─────────────────────────────────────── │
│                                         │
│ Pending Change: newsite.com             │
│ Active from: Feb 1, 2026 (12 days)      │
│                                         │
│ [Cancel Change]                         │
│                                         │
│ ─────────────────────────────────────── │
│                                         │
│ 💡 Upgrade to STARTER for 3 domains     │
│    with no monthly lock                 │
│                                         │
│ [View Plans]                            │
└─────────────────────────────────────────┘
```

---

## 12. Security Considerations

### 12.1 Access Control
- All organization resources require membership check
- API keys scoped to organization
- Audit logs for compliance
- Rate limiting per organization

### 12.2 Data Isolation
- Strict organization_id filtering on all queries
- No cross-organization data leakage
- Separate API rate limit buckets

### 12.3 Billing Security
- Stripe handles all payment data
- No credit card numbers stored
- Webhook signature verification
- Idempotent webhook handling

### 12.4 Invitation Security
- Cryptographically random tokens
- Short expiration (7 days)
- Single-use tokens
- Email verification for new users

### 12.5 SSO Considerations (Enterprise)
- SAML 2.0 support
- Just-in-time provisioning
- Role mapping from IdP
- Session management

---

## Appendix A: API Endpoints

### Organization Endpoints
```
POST   /api/organizations                    Create organization
GET    /api/organizations                    List user's organizations
GET    /api/organizations/:id                Get organization details
PATCH  /api/organizations/:id                Update organization
DELETE /api/organizations/:id                Delete organization
```

### Team Endpoints
```
GET    /api/organizations/:id/members        List members
POST   /api/organizations/:id/invitations    Send invitation
DELETE /api/organizations/:id/members/:uid   Remove member
PATCH  /api/organizations/:id/members/:uid   Update member role
GET    /api/invitations/:token               Get invitation details
POST   /api/invitations/:token/accept        Accept invitation
POST   /api/invitations/:token/decline       Decline invitation
```

### Domain Endpoints
```
GET    /api/organizations/:id/domains        List domains
POST   /api/organizations/:id/domains        Add domain
DELETE /api/organizations/:id/domains/:did   Remove domain
POST   /api/organizations/:id/domains/:did/verify  Verify domain
```

### Billing Endpoints
```
GET    /api/organizations/:id/subscription   Get subscription details
POST   /api/organizations/:id/checkout       Create checkout session
POST   /api/organizations/:id/billing-portal Create billing portal session
GET    /api/organizations/:id/usage          Get usage statistics
GET    /api/organizations/:id/invoices       List invoices
```

---

## Appendix B: Environment Variables

```bash
# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_live_...

# Stripe Product IDs
STRIPE_PRODUCT_STARTER=prod_...
STRIPE_PRODUCT_PRO=prod_...
STRIPE_PRODUCT_AGENCY=prod_...

# Stripe Price IDs
STRIPE_PRICE_STARTER_MONTHLY=price_...
STRIPE_PRICE_STARTER_YEARLY=price_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_PRO_YEARLY=price_...
STRIPE_PRICE_AGENCY_MONTHLY=price_...
STRIPE_PRICE_AGENCY_YEARLY=price_...
STRIPE_PRICE_EXTRA_SEAT_PRO=price_...
STRIPE_PRICE_EXTRA_SEAT_AGENCY=price_...

# Trial
TRIAL_DAYS=14
```

---

*Document Version: 1.0*
*Last Updated: 2026-01-29*
