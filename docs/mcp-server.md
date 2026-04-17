# MCP Server Implementation Plan

## Overview

Build an MCP (Model Context Protocol) server for Kritano that exposes website auditing capabilities as tools and resources to AI assistants like Claude. This lets users interact with Kritano through natural language -- running audits, viewing results, analysing findings, managing sites, and generating reports -- all from within Claude Code or any MCP-compatible client.

The MCP server will be a standalone process in the existing monorepo, reusing existing services and database access. It authenticates via API key (reusing the existing `api_keys` table) and respects tier limits.

## Key Decisions

1. **Standalone process** -- new entry point at `server/src/mcp.ts`, not bolted onto Express
2. **Reuses existing services** -- imports audit.service, site.service, analytics.service, etc. directly
3. **API key auth** -- users provide their Kritano API key; the MCP server validates it against the existing `api_keys` table and enforces scopes/tier limits
4. **stdio transport** -- standard MCP transport for local use (Claude Code, Cursor, etc.)
5. **SSE transport (optional, phase 2)** -- for remote/web-based MCP clients
6. **No new database tables** -- reuses existing schema entirely
7. **Read-heavy, write-light** -- most tools are read operations; write operations (start audit, create site) require explicit confirmation via tool descriptions

## Database Changes

None. The MCP server reuses:
- `api_keys` -- authentication and scope enforcement
- `api_requests` -- request logging (optional, for rate limiting)
- All existing audit, site, finding, and analytics tables

## Backend Changes

### New Files

```
server/src/mcp.ts                          # Entry point (stdio transport)
server/src/mcp/
  index.ts                                 # MCP server setup and tool/resource registration
  auth.ts                                  # API key validation and user context resolution
  tools/
    audit-tools.ts                         # Audit lifecycle tools
    site-tools.ts                          # Site management tools
    finding-tools.ts                       # Finding query tools
    analytics-tools.ts                     # Analytics and trend tools
    compliance-tools.ts                    # EAA compliance tools
    export-tools.ts                        # Report generation tools
    gsc-tools.ts                           # Google Search Console tools
  resources/
    audit-resources.ts                     # Audit data as MCP resources
    site-resources.ts                      # Site data as MCP resources
  utils/
    pagination.ts                          # Cursor-based pagination helpers
    formatting.ts                          # Markdown/text formatting for tool responses
```

### Package Changes

Add to `server/package.json`:

```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.12.0"
  },
  "scripts": {
    "mcp": "tsx src/mcp.ts",
    "mcp:build": "tsc && echo 'MCP server built'"
  }
}
```

### Entry Point: `server/src/mcp.ts`

```typescript
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createMcpServer } from "./mcp/index.js";

async function main() {
  const server = await createMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("MCP server failed to start:", err);
  process.exit(1);
});
```

### Server Setup: `server/src/mcp/index.ts`

- Creates `McpServer` instance with name "kritano" and version from package.json
- Registers all tools and resources
- Initialises database pool (reuses `server/src/db/index.ts`)
- Handles graceful shutdown (pool cleanup)

### Authentication: `server/src/mcp/auth.ts`

Reuses existing API key validation logic:
1. Reads API key from environment variable `KRITANO_API_KEY`
2. Hashes it with SHA-256, looks up in `api_keys` table
3. Resolves the associated user and organisation
4. Returns a context object: `{ userId, orgId, tier, scopes }`
5. All tool handlers receive this context and enforce scopes

## Tools

### 1. Audit Lifecycle (`audit-tools.ts`)

| Tool | Description | Scope Required |
|---|---|---|
| `start_audit` | Start a new audit for a URL. Params: url, max_pages?, max_depth?, checks[]? | `audits:write` |
| `get_audit` | Get audit status and scores by audit ID | `audits:read` |
| `list_audits` | List recent audits. Params: site_id?, status?, limit? | `audits:read` |
| `get_audit_progress` | Get real-time progress of a running audit | `audits:read` |
| `cancel_audit` | Cancel a running audit by ID | `audits:write` |
| `compare_audits` | Compare two audit runs side-by-side (score deltas, new/fixed issues) | `audits:read` |

**`start_audit` detail:**
- Validates URL is not on a blocked domain
- Checks tier limits (audits/month, concurrent audits, max pages)
- Creates audit job via `audit.service.ts`
- Returns audit ID and estimated completion time
- Tool description explicitly states "This will start a real audit that counts against your monthly quota"

**`get_audit` response format:**
```
Audit #abc123 -- https://example.com
Status: completed
Started: 2026-04-17 10:30 | Finished: 2026-04-17 10:35
Pages crawled: 47/50

Scores:
  SEO:            82/100
  Accessibility:  71/100
  Security:       95/100
  Performance:    68/100
  Content:        77/100

Issues: 23 unique (4 critical, 7 serious, 8 moderate, 4 minor)
```

### 2. Finding Query (`finding-tools.ts`)

| Tool | Description | Scope Required |
|---|---|---|
| `list_findings` | List findings for an audit. Params: audit_id, severity?, category?, wcag_criterion?, page_url?, limit? | `findings:read` |
| `get_finding_detail` | Get full detail for a specific finding including code snippet and fix suggestion | `findings:read` |
| `search_findings` | Full-text search across finding descriptions/rules for an audit | `findings:read` |
| `get_findings_summary` | Aggregated summary: counts by severity, category, top rules, top pages | `findings:read` |
| `get_wcag_coverage` | Show WCAG criterion coverage -- which criteria have issues, which pass | `findings:read` |

**`list_findings` response format:**
```
Findings for audit #abc123 (showing 10 of 23)

1. [CRITICAL] Missing alt text on images (accessibility)
   WCAG: 1.1.1 Non-text Content (Level A)
   Pages affected: 12
   Rule: image-alt

2. [SERIOUS] Links do not have discernible text (accessibility)
   WCAG: 2.4.4 Link Purpose (Level A)
   Pages affected: 8
   Rule: link-name
...
```

### 3. Site Management (`site-tools.ts`)

| Tool | Description | Scope Required |
|---|---|---|
| `list_sites` | List all sites in the user's organisation | `audits:read` |
| `get_site` | Get site detail including latest audit scores and verification status | `audits:read` |
| `create_site` | Add a new site to the organisation. Params: domain, name? | `audits:write` |
| `get_site_history` | Get audit score history/trends for a site | `audits:read` |

### 4. Analytics (`analytics-tools.ts`)

| Tool | Description | Scope Required |
|---|---|---|
| `get_score_trends` | Score trends over time for a site. Params: site_id, period? (7d/30d/90d) | `audits:read` |
| `get_top_issues` | Most common issues across all audits for a site | `audits:read` |
| `get_improvement_summary` | What improved/regressed between the last two audits | `audits:read` |

### 5. EAA Compliance (`compliance-tools.ts`)

| Tool | Description | Scope Required |
|---|---|---|
| `get_compliance_status` | EN 301 549 compliance passport for an audit | `audits:read` |
| `get_clause_detail` | Detail for a specific EN 301 549 clause including mapped WCAG findings | `audits:read` |

### 6. Export (`export-tools.ts`)

| Tool | Description | Scope Required |
|---|---|---|
| `generate_pdf_report` | Generate a PDF report for an audit and return a download URL | `exports:read` |
| `export_findings_csv` | Export findings as CSV data | `exports:read` |
| `export_findings_json` | Export findings as structured JSON | `exports:read` |

### 7. Google Search Console (`gsc-tools.ts`)

| Tool | Description | Scope Required |
|---|---|---|
| `get_gsc_overview` | Top queries, pages, CTR for a connected GSC property | `audits:read` |
| `get_gsc_opportunities` | CTR opportunity finder -- queries where ranking is good but CTR is low | `audits:read` |
| `get_gsc_cannibalisations` | Pages competing for the same keywords | `audits:read` |

## Resources

MCP resources provide read-only data that the AI can pull in as context.

### Audit Resources (`audit-resources.ts`)

| Resource URI | Description |
|---|---|
| `kritano://audits/{id}` | Full audit data (scores, metadata) |
| `kritano://audits/{id}/findings` | All findings for an audit |
| `kritano://audits/{id}/pages` | All crawled pages with per-page scores |
| `kritano://audits/{id}/compliance` | EN 301 549 compliance data |

### Site Resources (`site-resources.ts`)

| Resource URI | Description |
|---|---|
| `kritano://sites` | List of all sites |
| `kritano://sites/{id}` | Site detail with latest scores |
| `kritano://sites/{id}/history` | Audit history for a site |

### Resource Templates

Dynamic resource templates for parameterised access:

```typescript
server.resource(
  "audit-findings",
  new ResourceTemplate("kritano://audits/{auditId}/findings", {
    list: async () => { /* list recent audit IDs */ },
  }),
  async (uri, { auditId }) => { /* return findings */ }
);
```

## Configuration

### MCP Client Config (`.mcp.json` update)

Add to the existing `.mcp.json`:

```json
{
  "mcpServers": {
    "kritano": {
      "command": "npx",
      "args": ["tsx", "server/src/mcp.ts"],
      "env": {
        "KRITANO_API_KEY": "pp_live_xxx",
        "DATABASE_URL": "postgresql://...",
        "REDIS_URL": "redis://..."
      }
    }
  }
}
```

### Environment Variables

The MCP server needs:
- `KRITANO_API_KEY` -- the user's API key (required)
- `DATABASE_URL` -- PostgreSQL connection string (or inherits from existing `.env`)
- `REDIS_URL` -- Redis connection string (optional, for rate limiting)

The server will also read from `server/.env` if it exists, so existing dev setups work without extra config.

## Response Formatting

All tool responses should be formatted as clean, readable text/markdown since the AI will relay them to the user. Guidelines:

1. **Scores** -- show as `82/100` not raw decimals
2. **Severity** -- use brackets: `[CRITICAL]`, `[SERIOUS]`, `[MODERATE]`, `[MINOR]`
3. **Tables** -- use markdown tables for comparative data
4. **Lists** -- numbered lists for findings, bullet lists for summaries
5. **Truncation** -- default to 10-20 items per list, mention total count
6. **Links** -- include Kritano dashboard URLs where relevant (e.g., `View full report: https://app.kritano.com/audits/abc123`)

## Error Handling

- **Invalid API key** -- clear error: "Invalid or expired API key. Generate one at Settings > API Keys."
- **Scope denied** -- "Your API key doesn't have the `audits:write` scope. Update it at Settings > API Keys."
- **Tier limit** -- "You've reached your monthly audit limit (5/5). Upgrade at kritano.com/pricing."
- **Not found** -- "Audit #abc123 not found or not accessible with your API key."
- **Rate limited** -- "Rate limited. Try again in X seconds."

## Security Considerations

1. **API key only** -- no JWT/session auth in MCP context; API keys are scoped and revocable
2. **Read-only by default** -- write tools (start_audit, create_site) have explicit descriptions warning about side effects
3. **No admin tools** -- the MCP server does NOT expose admin, cold prospect, or CRM functionality
4. **Tier enforcement** -- all operations check tier limits server-side
5. **SSRF protection** -- start_audit validates URLs through existing SSRF checks
6. **No credential exposure** -- API key is in env vars, never logged or returned in responses
7. **Rate limiting** -- respects existing API rate limits from `api_keys.rate_limit_tier`

## Testing Plan

### Unit Tests

- `server/src/__tests__/mcp/auth.test.ts` -- API key validation, scope checking, tier resolution
- `server/src/__tests__/mcp/tools/audit-tools.test.ts` -- audit tool handlers with mocked services
- `server/src/__tests__/mcp/tools/finding-tools.test.ts` -- finding query tools
- `server/src/__tests__/mcp/tools/site-tools.test.ts` -- site management tools
- `server/src/__tests__/mcp/formatting.test.ts` -- response formatting

### Integration Tests

- Start MCP server with test database
- Send tool calls via MCP client SDK
- Verify correct data returned and tier limits enforced

### Manual Testing

- Add to `.mcp.json` and test via Claude Code
- Run each tool and verify response quality
- Test error cases (invalid key, wrong scope, tier limit)

## Implementation Order

### Phase 1: Core (MVP)
1. Install `@modelcontextprotocol/sdk` dependency
2. Create `server/src/mcp.ts` entry point with stdio transport
3. Create `server/src/mcp/index.ts` -- server setup, DB pool init
4. Create `server/src/mcp/auth.ts` -- API key auth from env var
5. Implement `audit-tools.ts` -- `start_audit`, `get_audit`, `list_audits`
6. Implement `finding-tools.ts` -- `list_findings`, `get_findings_summary`
7. Implement `site-tools.ts` -- `list_sites`, `get_site`
8. Create `server/src/mcp/utils/formatting.ts` -- response formatting
9. Add to `.mcp.json` config
10. Manual testing with Claude Code

### Phase 2: Full Feature Set
11. Implement `finding-tools.ts` -- `get_finding_detail`, `search_findings`, `get_wcag_coverage`
12. Implement `analytics-tools.ts` -- `get_score_trends`, `get_top_issues`, `get_improvement_summary`
13. Implement `compliance-tools.ts` -- `get_compliance_status`, `get_clause_detail`
14. Implement `export-tools.ts` -- `generate_pdf_report`, `export_findings_csv`, `export_findings_json`
15. Implement `gsc-tools.ts` -- GSC tools
16. Implement `compare_audits` tool
17. Add MCP resources (audit, site, findings)

### Phase 3: Polish
18. Unit tests for auth and tool handlers
19. Integration tests
20. Rate limiting enforcement
21. SSE transport option for remote clients
22. Documentation for users (how to connect, available tools)

## Critical Files Summary

| File | Purpose |
|---|---|
| `server/src/mcp.ts` | Entry point -- stdio transport |
| `server/src/mcp/index.ts` | Server setup, tool/resource registration |
| `server/src/mcp/auth.ts` | API key validation and context |
| `server/src/mcp/tools/*.ts` | Tool implementations (7 files) |
| `server/src/mcp/resources/*.ts` | Resource implementations (2 files) |
| `server/src/mcp/utils/*.ts` | Helpers (pagination, formatting) |
| `.mcp.json` | MCP client configuration |
| `server/package.json` | New dependency and scripts |
| `docs/tiers.md` | Tier limits (reference, no changes) |

## Tier Impact

The MCP server is gated behind API key access. Per `docs/tiers.md`, API access is available on **Pro tier and above**. No tier changes needed -- the MCP server is simply a new interface to the existing API.

| Tier | MCP Access | Rate Limit |
|---|---|---|
| Free | No (no API keys) | - |
| Starter | No (no API keys) | - |
| Pro | Yes | 300 req/min, 10k/day |
| Agency | Yes | 1,000 req/min, 100k/day |
| Enterprise | Yes | 2,000 req/min, unlimited |
