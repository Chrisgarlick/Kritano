# pagepulser - Phase 4: Innovation Roadmap

Detailed implementation plan for transformative features including AI-powered insights, API access, CI/CD integration, and team collaboration.

**Created:** 2026-01-29
**Status:** Planning
**Dependencies:** Phases 1-3 complete

---

## Table of Contents

1. [AI-Powered Features](#1-ai-powered-features)
2. [Public API Access](#2-public-api-access)
3. [CI/CD Integration](#3-cicd-integration)
4. [Team Workspaces](#4-team-workspaces)
5. [Integrations](#5-integrations)
6. [Implementation Priority](#6-implementation-priority)
7. [Database Schema Changes](#7-database-schema-changes)

---

## 1. AI-Powered Features

### 1.1 Auto-Fix Suggestions

**Goal:** Generate actionable code fixes for audit findings using LLMs.

#### Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Audit Finding  │────▶│  Context Builder │────▶│  Claude API     │
│  + Page HTML    │     │  (prompt engine) │     │  (Anthropic)    │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                          │
                        ┌──────────────────┐              │
                        │  Fix Suggestion  │◀─────────────┘
                        │  (code + explain)│
                        └──────────────────┘
```

#### Implementation

**New Service: `server/src/services/ai/fix-generator.service.ts`**

```typescript
interface FixSuggestion {
  findingId: string;
  originalCode: string;
  fixedCode: string;
  explanation: string;
  confidence: 'high' | 'medium' | 'low';
  appliesTo: 'html' | 'css' | 'javascript' | 'meta';
}

class FixGeneratorService {
  async generateFix(finding: AuditFinding, pageHtml: string): Promise<FixSuggestion>;
  async batchGenerateFixes(findings: AuditFinding[]): Promise<FixSuggestion[]>;
}
```

**Prompt Engineering Strategy:**

1. **Context Window Optimization**
   - Extract only relevant HTML snippet (selector + surrounding context)
   - Include finding metadata (rule, severity, WCAG criteria)
   - Limit to ~2000 tokens of context per finding

2. **Category-Specific Prompts**
   - **Accessibility:** Focus on ARIA, semantic HTML, color contrast
   - **SEO:** Meta tags, headings, structured data
   - **Security:** CSP headers, input sanitization, HTTPS
   - **Performance:** Image optimization, lazy loading, caching headers

3. **Output Format**
   ```json
   {
     "original": "<img src='photo.jpg'>",
     "fixed": "<img src='photo.jpg' alt='Description of image' loading='lazy'>",
     "explanation": "Added alt text for screen readers and lazy loading for performance",
     "confidence": "high"
   }
   ```

#### API Endpoints

```
POST /api/audits/:id/findings/:findingId/generate-fix
GET  /api/audits/:id/findings/:findingId/fix-suggestion
POST /api/audits/:id/generate-all-fixes  (batch, async job)
```

#### UI Components

- "Generate Fix" button on each finding card
- Code diff viewer (original vs. fixed)
- Copy-to-clipboard for fixed code
- Feedback buttons (helpful/not helpful) for training

#### Cost Management

- Cache generated fixes in database (don't regenerate)
- Rate limit: 50 fixes/day for free tier, unlimited for paid
- Use Claude Haiku for simple fixes, Sonnet for complex ones
- Batch similar findings to reduce API calls

---

### 1.2 Priority Scoring

**Goal:** Rank findings by business impact using ML heuristics.

#### Scoring Factors

| Factor | Weight | Description |
|--------|--------|-------------|
| Severity | 30% | critical=100, serious=75, moderate=50, minor=25 |
| Page Importance | 25% | Homepage=100, /pricing=90, deep pages=50 |
| Affected Users | 20% | Based on page traffic (if analytics connected) |
| Fix Effort | 15% | Simple HTML=100, JS change=50, backend=25 |
| Compliance Risk | 10% | WCAG required=100, best practice=50 |

#### Implementation

```typescript
interface PriorityScore {
  findingId: string;
  score: number;  // 0-100
  factors: {
    severity: number;
    pageImportance: number;
    affectedUsers: number;
    fixEffort: number;
    complianceRisk: number;
  };
  recommendation: string;
}

class PriorityScoringService {
  calculateScore(finding: AuditFinding, page: AuditPage): PriorityScore;
  rankFindings(findings: AuditFinding[]): AuditFinding[];
}
```

#### Page Importance Heuristics

```typescript
const PAGE_IMPORTANCE = {
  '/': 100,
  '/pricing': 95,
  '/signup': 95,
  '/login': 90,
  '/product': 85,
  '/contact': 80,
  '/about': 70,
  '/blog': 60,
  // Default based on depth: 100 - (depth * 15)
};
```

---

### 1.3 Natural Language Reports

**Goal:** Generate executive summaries and recommendations using LLMs.

#### Report Types

1. **Executive Summary** (1 paragraph)
   - Overall health assessment
   - Key metrics and trends
   - Top 3 priorities

2. **Technical Summary** (detailed)
   - Category-by-category breakdown
   - Specific recommendations
   - Estimated fix effort

3. **Trend Analysis** (for recurring audits)
   - Score changes over time
   - New vs. resolved issues
   - Regression alerts

#### Implementation

```typescript
interface GeneratedReport {
  type: 'executive' | 'technical' | 'trend';
  content: string;
  generatedAt: Date;
  auditId: string;
  tokenCount: number;
}

class ReportGeneratorService {
  async generateExecutiveSummary(audit: AuditJob): Promise<string>;
  async generateTechnicalReport(audit: AuditJob, findings: AuditFinding[]): Promise<string>;
  async generateTrendAnalysis(audits: AuditJob[]): Promise<string>;
}
```

#### API Endpoints

```
POST /api/audits/:id/generate-report
  body: { type: 'executive' | 'technical' | 'trend' }

GET /api/audits/:id/reports
  returns: GeneratedReport[]
```

---

### 1.4 Anomaly Detection

**Goal:** Alert users when scores drop unexpectedly.

#### Detection Rules

| Rule | Trigger | Alert Level |
|------|---------|-------------|
| Score Drop | Any score drops >10 points | Warning |
| Critical Spike | Critical issues increase >50% | Critical |
| New Category Failure | Category drops below 50 | Warning |
| Regression | Previously fixed issue reappears | Info |

#### Implementation

```typescript
interface Anomaly {
  type: 'score_drop' | 'critical_spike' | 'category_failure' | 'regression';
  severity: 'critical' | 'warning' | 'info';
  message: string;
  previousValue: number;
  currentValue: number;
  delta: number;
}

class AnomalyDetectionService {
  detectAnomalies(currentAudit: AuditJob, previousAudit: AuditJob): Anomaly[];
  async processAndAlert(auditId: string): Promise<void>;
}
```

---

## 2. Public API Access

### 2.1 API Authentication

#### API Key Management

```sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  key_hash VARCHAR(255) NOT NULL,  -- SHA-256 of the key
  key_prefix VARCHAR(8) NOT NULL,   -- First 8 chars for identification
  scopes TEXT[] DEFAULT '{}',       -- ['audits:read', 'audits:write', ...]
  rate_limit_tier VARCHAR(20) DEFAULT 'free',
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_user ON api_keys(user_id);
```

#### Key Format

```
pp_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxx  (production)
pp_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxx  (sandbox)
```

#### Authentication Flow

```
Authorization: Bearer pp_live_xxxxx

OR

X-API-Key: pp_live_xxxxx
```

### 2.2 Rate Limiting Tiers

| Tier | Requests/min | Requests/day | Concurrent Audits | Price |
|------|--------------|--------------|-------------------|-------|
| Free | 10 | 100 | 1 | $0 |
| Starter | 60 | 1,000 | 3 | $29/mo |
| Pro | 300 | 10,000 | 10 | $99/mo |
| Enterprise | 1,000 | Unlimited | 50 | Custom |

### 2.3 API Endpoints

#### Audits

```yaml
# Start a new audit
POST /api/v1/audits
  body:
    url: string (required)
    options:
      maxPages: number (1-1000, default 100)
      maxDepth: number (1-10, default 5)
      checks: ['seo', 'accessibility', 'security', 'performance']
  response:
    id: string
    status: 'pending'
    estimatedTime: number (seconds)

# Get audit status
GET /api/v1/audits/:id
  response:
    id: string
    status: 'pending' | 'processing' | 'completed' | 'failed'
    progress:
      pagesFound: number
      pagesCrawled: number
      pagesAudited: number
    scores:
      seo: number | null
      accessibility: number | null
      security: number | null
      performance: number | null

# Get audit findings
GET /api/v1/audits/:id/findings
  query:
    category: string
    severity: string
    page: number
    limit: number
  response:
    findings: AuditFinding[]
    pagination: { page, limit, total, pages }

# List user's audits
GET /api/v1/audits
  query:
    status: string
    domain: string
    page: number
    limit: number

# Cancel an audit
POST /api/v1/audits/:id/cancel

# Delete an audit
DELETE /api/v1/audits/:id
```

#### AI Features (Premium)

```yaml
# Generate fix suggestion
POST /api/v1/audits/:id/findings/:findingId/fix
  response:
    original: string
    fixed: string
    explanation: string
    confidence: string

# Generate report
POST /api/v1/audits/:id/report
  body:
    type: 'executive' | 'technical'
  response:
    content: string
    generatedAt: string
```

### 2.4 Webhooks

#### Webhook Events

```yaml
events:
  - audit.created
  - audit.started
  - audit.progress    # Every 10% progress
  - audit.completed
  - audit.failed
  - anomaly.detected
```

#### Webhook Payload

```json
{
  "event": "audit.completed",
  "timestamp": "2026-01-29T12:00:00Z",
  "data": {
    "auditId": "uuid",
    "url": "https://example.com",
    "status": "completed",
    "scores": {
      "seo": 85,
      "accessibility": 72,
      "security": 90,
      "performance": 68
    },
    "summary": {
      "totalIssues": 42,
      "criticalIssues": 3
    }
  }
}
```

#### Webhook Configuration

```sql
CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  url VARCHAR(500) NOT NULL,
  secret VARCHAR(255) NOT NULL,  -- For HMAC signature
  events TEXT[] NOT NULL,
  is_active BOOLEAN DEFAULT true,
  failure_count INTEGER DEFAULT 0,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 3. CI/CD Integration

### 3.1 GitHub Action

**Repository:** `pagepulser/github-action`

#### Usage

```yaml
# .github/workflows/audit.yml
name: Website Audit

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: pagepulser/action@v1
        with:
          api-key: ${{ secrets.PAGEPULSER_API_KEY }}
          url: https://preview-${{ github.event.pull_request.number }}.example.com
          # Or use deployment URL
          # url: ${{ steps.deploy.outputs.url }}

          # Fail conditions
          fail-on-score-below: 70
          fail-on-critical: true
          fail-on-regression: true

          # Categories to check
          checks: seo,accessibility,security,performance

          # Compare against
          baseline: main  # Compare against main branch audit
```

#### Action Outputs

```yaml
outputs:
  audit-id:
    description: 'The audit ID'
  audit-url:
    description: 'Link to full audit report'
  seo-score:
    description: 'SEO score (0-100)'
  accessibility-score:
    description: 'Accessibility score (0-100)'
  security-score:
    description: 'Security score (0-100)'
  performance-score:
    description: 'Performance score (0-100)'
  total-issues:
    description: 'Total issues found'
  critical-issues:
    description: 'Critical issues found'
  passed:
    description: 'Whether the audit passed all checks'
```

#### PR Comment

```markdown
## 🛡️ pagepulser Results

| Category | Score | Change |
|----------|-------|--------|
| SEO | 85 | +3 |
| Accessibility | 72 | -5 ⚠️ |
| Security | 90 | — |
| Performance | 68 | +12 |

### Summary
- **Total Issues:** 42 (3 critical)
- **New Issues:** 5
- **Resolved:** 8

[View Full Report](https://app.pagepulser.io/audits/xxx)

---
⚠️ **Accessibility score dropped by 5 points.** Review the [accessibility findings](https://app.pagepulser.io/audits/xxx?category=accessibility) before merging.
```

### 3.2 CLI Tool

**Package:** `@pagepulser/cli`

#### Installation

```bash
npm install -g @pagepulser/cli
# or
npx @pagepulser/cli scan https://example.com
```

#### Commands

```bash
# Authentication
pagepulser login
pagepulser logout
pagepulser whoami

# Scanning
pagepulser scan <url> [options]
  --max-pages <n>       Maximum pages to crawl (default: 100)
  --max-depth <n>       Maximum crawl depth (default: 5)
  --checks <list>       Comma-separated checks (default: all)
  --wait                Wait for completion (default: true)
  --json                Output as JSON
  --fail-under <n>      Exit code 1 if any score below threshold
  --baseline <id>       Compare against previous audit

# Results
pagepulser status <audit-id>
pagepulser findings <audit-id> [--category] [--severity]
pagepulser report <audit-id> [--format pdf|json|csv]

# History
pagepulser list [--domain] [--status] [--limit]
pagepulser compare <audit-id-1> <audit-id-2>
```

#### Example Output

```
$ pagepulser scan https://example.com --wait

🔍 Starting audit for https://example.com...

Progress: [████████████████████░░░░] 80% (80/100 pages)
Current: https://example.com/blog/article-5

✅ Audit completed in 2m 34s

┌─────────────────┬───────┬────────┐
│ Category        │ Score │ Issues │
├─────────────────┼───────┼────────┤
│ SEO             │ 85    │ 12     │
│ Accessibility   │ 72    │ 23     │
│ Security        │ 90    │ 5      │
│ Performance     │ 68    │ 18     │
└─────────────────┴───────┴────────┘

Critical Issues: 3
Total Issues: 58

View full report: https://app.pagepulser.io/audits/abc123
```

### 3.3 Regression Prevention

#### Database Schema

```sql
CREATE TABLE audit_baselines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  domain VARCHAR(255) NOT NULL,
  branch VARCHAR(100) DEFAULT 'main',
  audit_id UUID REFERENCES audit_jobs(id),
  scores JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, domain, branch)
);
```

#### Comparison Logic

```typescript
interface RegressionCheck {
  passed: boolean;
  changes: {
    category: string;
    baseline: number;
    current: number;
    delta: number;
    status: 'improved' | 'unchanged' | 'regressed';
  }[];
  newIssues: AuditFinding[];
  resolvedIssues: AuditFinding[];
}

class RegressionService {
  async compare(baselineId: string, currentId: string): Promise<RegressionCheck>;
  async setBaseline(domain: string, branch: string, auditId: string): Promise<void>;
  async getBaseline(domain: string, branch: string): Promise<AuditBaseline | null>;
}
```

---

## 4. Team Workspaces

### 4.1 Organization Model

```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  owner_id UUID NOT NULL REFERENCES users(id),
  plan VARCHAR(20) DEFAULT 'team',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL DEFAULT 'member',  -- owner, admin, member, viewer
  invited_by UUID REFERENCES users(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  UNIQUE(organization_id, user_id)
);

CREATE TABLE organization_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'member',
  token_hash VARCHAR(255) NOT NULL,
  invited_by UUID NOT NULL REFERENCES users(id),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.2 Role-Based Access Control (RBAC)

| Permission | Owner | Admin | Member | Viewer |
|------------|-------|-------|--------|--------|
| View audits | ✅ | ✅ | ✅ | ✅ |
| Create audits | ✅ | ✅ | ✅ | ❌ |
| Delete audits | ✅ | ✅ | Own only | ❌ |
| Dismiss findings | ✅ | ✅ | ✅ | ❌ |
| Manage members | ✅ | ✅ | ❌ | ❌ |
| Manage billing | ✅ | ❌ | ❌ | ❌ |
| Delete org | ✅ | ❌ | ❌ | ❌ |
| API keys | ✅ | ✅ | Own only | ❌ |
| Integrations | ✅ | ✅ | ❌ | ❌ |

### 4.3 Issue Assignment

```sql
ALTER TABLE audit_findings ADD COLUMN assigned_to UUID REFERENCES users(id);
ALTER TABLE audit_findings ADD COLUMN assigned_at TIMESTAMPTZ;
ALTER TABLE audit_findings ADD COLUMN due_date DATE;
ALTER TABLE audit_findings ADD COLUMN notes TEXT;

CREATE TABLE finding_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  finding_id UUID NOT NULL REFERENCES audit_findings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.4 API Endpoints

```yaml
# Organizations
POST   /api/v1/organizations
GET    /api/v1/organizations
GET    /api/v1/organizations/:slug
PATCH  /api/v1/organizations/:slug
DELETE /api/v1/organizations/:slug

# Members
GET    /api/v1/organizations/:slug/members
POST   /api/v1/organizations/:slug/members/invite
DELETE /api/v1/organizations/:slug/members/:userId
PATCH  /api/v1/organizations/:slug/members/:userId/role

# Assignment
PATCH  /api/v1/audits/:id/findings/:findingId/assign
  body: { userId: string, dueDate?: string }
POST   /api/v1/audits/:id/findings/:findingId/comments
```

---

## 5. Integrations

### 5.1 Jira Integration

#### OAuth Flow

1. User connects Jira account via OAuth 2.0
2. Store access/refresh tokens encrypted
3. Fetch projects and issue types
4. Map finding severities to Jira priorities

#### Sync Logic

```typescript
interface JiraConfig {
  projectKey: string;
  issueType: string;
  priorityMapping: Record<FindingSeverity, string>;
  labelPrefix: string;
  autoSync: boolean;
}

class JiraIntegrationService {
  async createIssue(finding: AuditFinding): Promise<JiraIssue>;
  async syncFinding(finding: AuditFinding): Promise<void>;
  async linkExistingIssue(findingId: string, issueKey: string): Promise<void>;
}
```

### 5.2 Linear Integration

Similar to Jira but using Linear's GraphQL API.

### 5.3 Slack Integration

#### Webhook Events to Slack

```typescript
const SLACK_TEMPLATES = {
  'audit.completed': {
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: '🛡️ Audit Complete' }
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: '*URL:*\n{url}' },
          { type: 'mrkdwn', text: '*Status:*\n{status}' },
          { type: 'mrkdwn', text: '*SEO:* {seoScore}' },
          { type: 'mrkdwn', text: '*A11y:* {a11yScore}' },
        ]
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: 'View Report' },
            url: '{reportUrl}'
          }
        ]
      }
    ]
  }
};
```

### 5.4 Discord Integration

Similar to Slack using Discord webhooks.

---

## 6. Implementation Priority

### Phase 4.1: API Foundation (Week 1-2)

| Task | Priority | Effort |
|------|----------|--------|
| API key management | P0 | Medium |
| Rate limiting middleware | P0 | Medium |
| Public API endpoints (CRUD) | P0 | High |
| API documentation (OpenAPI) | P1 | Medium |
| Webhook infrastructure | P1 | High |

### Phase 4.2: Developer Tools (Week 3-4)

| Task | Priority | Effort |
|------|----------|--------|
| CLI tool (basic) | P0 | High |
| GitHub Action | P0 | High |
| Regression comparison | P1 | Medium |
| Baseline management | P1 | Low |

### Phase 4.3: AI Features (Week 5-6)

| Task | Priority | Effort |
|------|----------|--------|
| Fix suggestion generation | P0 | High |
| Priority scoring algorithm | P1 | Medium |
| Executive summary generation | P1 | Medium |
| Anomaly detection | P2 | Medium |

### Phase 4.4: Collaboration (Week 7-8)

| Task | Priority | Effort |
|------|----------|--------|
| Organization model | P0 | High |
| RBAC implementation | P0 | High |
| Member invitations | P1 | Medium |
| Finding assignment | P1 | Medium |

### Phase 4.5: Integrations (Week 9-10)

| Task | Priority | Effort |
|------|----------|--------|
| Slack integration | P1 | Medium |
| Jira integration | P2 | High |
| Linear integration | P2 | Medium |
| Discord integration | P3 | Low |

---

## 7. Database Schema Changes

### Migration: 010_api_keys.sql

```sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  key_hash VARCHAR(255) NOT NULL,
  key_prefix VARCHAR(8) NOT NULL,
  scopes TEXT[] DEFAULT '{}',
  rate_limit_tier VARCHAR(20) DEFAULT 'free',
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_user ON api_keys(user_id);
CREATE INDEX idx_api_keys_prefix ON api_keys(key_prefix);
```

### Migration: 011_webhooks.sql

```sql
CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  url VARCHAR(500) NOT NULL,
  secret VARCHAR(255) NOT NULL,
  events TEXT[] NOT NULL,
  is_active BOOLEAN DEFAULT true,
  failure_count INTEGER DEFAULT 0,
  last_triggered_at TIMESTAMPTZ,
  last_response_code INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  event VARCHAR(50) NOT NULL,
  payload JSONB NOT NULL,
  response_code INTEGER,
  response_body TEXT,
  duration_ms INTEGER,
  delivered_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_webhook_deliveries_webhook ON webhook_deliveries(webhook_id);
CREATE INDEX idx_webhook_deliveries_event ON webhook_deliveries(event);
```

### Migration: 012_organizations.sql

```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  owner_id UUID NOT NULL REFERENCES users(id),
  plan VARCHAR(20) DEFAULT 'team',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL DEFAULT 'member',
  invited_by UUID REFERENCES users(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  UNIQUE(organization_id, user_id)
);

CREATE TABLE organization_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'member',
  token_hash VARCHAR(255) NOT NULL,
  invited_by UUID NOT NULL REFERENCES users(id),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add organization_id to audit_jobs for team audits
ALTER TABLE audit_jobs ADD COLUMN organization_id UUID REFERENCES organizations(id);
CREATE INDEX idx_audit_jobs_org ON audit_jobs(organization_id);
```

### Migration: 013_ai_features.sql

```sql
CREATE TABLE fix_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  finding_id UUID NOT NULL REFERENCES audit_findings(id) ON DELETE CASCADE,
  original_code TEXT,
  fixed_code TEXT NOT NULL,
  explanation TEXT NOT NULL,
  confidence VARCHAR(10) NOT NULL,
  applies_to VARCHAR(20) NOT NULL,
  model_used VARCHAR(50) NOT NULL,
  tokens_used INTEGER,
  feedback VARCHAR(20),  -- 'helpful', 'not_helpful', null
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(finding_id)
);

CREATE TABLE generated_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES audit_jobs(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  model_used VARCHAR(50) NOT NULL,
  tokens_used INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE audit_baselines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  organization_id UUID REFERENCES organizations(id),
  domain VARCHAR(255) NOT NULL,
  branch VARCHAR(100) DEFAULT 'main',
  audit_id UUID REFERENCES audit_jobs(id),
  scores JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, domain, branch)
);
```

### Migration: 014_integrations.sql

```sql
CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL,  -- 'slack', 'jira', 'linear', 'discord'
  config JSONB NOT NULL,
  credentials JSONB NOT NULL,  -- Encrypted
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE integration_syncs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  finding_id UUID REFERENCES audit_findings(id) ON DELETE SET NULL,
  external_id VARCHAR(100) NOT NULL,  -- Jira issue key, etc.
  external_url VARCHAR(500),
  status VARCHAR(20) DEFAULT 'synced',
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- Finding assignment columns
ALTER TABLE audit_findings ADD COLUMN assigned_to UUID REFERENCES users(id);
ALTER TABLE audit_findings ADD COLUMN assigned_at TIMESTAMPTZ;
ALTER TABLE audit_findings ADD COLUMN due_date DATE;
ALTER TABLE audit_findings ADD COLUMN notes TEXT;

CREATE TABLE finding_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  finding_id UUID NOT NULL REFERENCES audit_findings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 8. Success Metrics

| Feature | Metric | Target |
|---------|--------|--------|
| API | Monthly active API users | 100+ |
| API | API requests/day | 10,000+ |
| GitHub Action | Installations | 500+ |
| CLI | Downloads/month | 1,000+ |
| AI Fixes | Fix generation success rate | 85%+ |
| AI Fixes | User satisfaction (helpful) | 70%+ |
| Teams | Organizations created | 50+ |
| Teams | Average members per org | 4+ |
| Integrations | Connected integrations | 30%+ of paid users |

---

## 9. Security Considerations

### API Security

- API keys stored as SHA-256 hashes
- Keys prefixed for identification without exposing full key
- Rate limiting per key with sliding window
- Scope-based permissions (read-only keys possible)
- Key rotation support

### Webhook Security

- HMAC signature verification (SHA-256)
- Payload timestamp validation (prevent replay)
- Automatic disable after consecutive failures
- IP allowlisting option

### Organization Security

- Audit trail for all admin actions
- Minimum 2 admins for enterprise plans
- SSO/SAML support (enterprise)
- Data isolation per organization

---

*Innovation Roadmap v1.0 - 2026-01-29*
*Next review: After Phase 4.1 completion*
