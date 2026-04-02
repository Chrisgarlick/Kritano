import { PublicLayout } from '../../components/layout/PublicLayout';
import PageSeo from '../../components/seo/PageSeo';
import DocsLayout from '../../components/docs/DocsLayout';
import CodeBlock from '../../components/docs/CodeBlock';
import EndpointCard from '../../components/docs/EndpointCard';
import ParamTable from '../../components/docs/ParamTable';
import { Info, AlertTriangle } from 'lucide-react';

export default function DocsEndpointsPage() {
  return (
    <PublicLayout>
      <PageSeo
        title="Endpoints - API Docs"
        description="Complete reference for all Kritano API v1 endpoints — create audits, list results, retrieve findings, and more."
        path="/docs/endpoints"
        useOverrides={true}
      />
      <DocsLayout>
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-6 mb-6">
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white mb-2">Endpoints</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-2">
            All endpoints are relative to the base URL:
          </p>
          <CodeBlock code="https://app.kritano.io/api/v1" language="http" label="Base URL" />
          <p className="text-slate-600 dark:text-slate-400 mt-4 mb-2">
            Every endpoint requires authentication via <code className="text-xs bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded text-indigo-700 dark:text-indigo-400 font-mono">Authorization: Bearer kt_live_xxx</code>. See the <a href="/docs/authentication" className="text-indigo-600 dark:text-indigo-400 hover:underline">authentication guide</a> for details.
          </p>
        </div>

        {/* ── GET /api/v1/info ── */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">API Info</h2>
          <EndpointCard method="GET" path="/api/v1/info" description="Get API version, your tier, and current rate limits" defaultOpen>
            <div className="space-y-1 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Scope:</span>
                <code className="text-xs font-mono font-medium text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">audits:read</code>
              </div>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Returns your API version, subscription tier, rate limit numbers, and the scopes assigned to your API key. Useful for verifying your key works and checking current limits.</p>

            <CodeBlock
              language="bash"
              label="cURL"
              code={`curl "https://app.kritano.io/api/v1/info" \\
  -H "Authorization: Bearer kt_live_your_key"`}
            />
            <CodeBlock
              language="json"
              label="Response · 200 OK"
              code={`{
  "version": "1.0.0",
  "tier": "pro",
  "limits": {
    "requestsPerMinute": 300,
    "requestsPerDay": 10000,
    "concurrentAudits": 10
  },
  "scopes": ["audits:read", "audits:write", "findings:read"],
  "documentation": "/docs"
}`}
            />
          </EndpointCard>
        </div>

        {/* ── POST /api/v1/audits ── */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Create Audit</h2>
          <EndpointCard method="POST" path="/api/v1/audits" description="Create a new website audit" defaultOpen>
            <div className="space-y-1 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Scope:</span>
                <code className="text-xs font-mono font-medium text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">audits:write</code>
              </div>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Start a new website audit. The audit is queued and processed asynchronously — the response returns immediately with status <code className="text-xs bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded text-indigo-700 dark:text-indigo-400 font-mono">"pending"</code>. Poll <code className="text-xs bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded text-indigo-700 dark:text-indigo-400 font-mono">GET /api/v1/audits/:id</code> to track progress.
            </p>

            <ParamTable
              title="Request Body"
              params={[
                { name: 'url', type: 'string', required: true, description: 'The URL to audit. Must be a valid, publicly accessible URL. WWW prefix is stripped automatically for domain matching.' },
                { name: 'options.maxPages', type: 'integer', description: 'Maximum pages to crawl. Min: 1, Max: 1,000. Default: 100' },
                { name: 'options.maxDepth', type: 'integer', description: 'Maximum crawl depth from the starting URL. Min: 1, Max: 10. Default: 5' },
                { name: 'options.checks', type: 'array', description: 'Categories to check: seo, accessibility, security, performance, content, file-extraction. Default: all except file-extraction' },
                { name: 'options.respectRobotsTxt', type: 'boolean', description: 'Whether to respect robots.txt directives. Default: true' },
                { name: 'options.includeSubdomains', type: 'boolean', description: 'Whether to include subdomains in the crawl. Default: false' },
              ]}
            />

            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mt-6 mb-2">Example Request</h4>
            <CodeBlock
              language="bash"
              label="cURL"
              code={`curl -X POST "https://app.kritano.io/api/v1/audits" \\
  -H "Authorization: Bearer kt_live_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://example.com",
    "options": {
      "maxPages": 50,
      "maxDepth": 3,
      "checks": ["seo", "accessibility", "security"],
      "respectRobotsTxt": true,
      "includeSubdomains": false
    }
  }'`}
            />
            <CodeBlock
              language="json"
              label="Response · 201 Created"
              code={`{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "url": "https://example.com",
  "domain": "example.com",
  "status": "pending",
  "createdAt": "2026-03-14T10:00:00.000Z",
  "_links": {
    "self": "/api/v1/audits/550e8400-e29b-41d4-a716-446655440000",
    "findings": "/api/v1/audits/550e8400-e29b-41d4-a716-446655440000/findings"
  }
}`}
            />

            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mt-6 mb-2">Error Responses</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <code className="text-xs bg-red-50 text-red-700 px-1.5 py-0.5 rounded font-mono flex-shrink-0">400</code>
                <span className="text-slate-600">Invalid URL format or validation error (see <code className="text-xs bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded text-indigo-700 dark:text-indigo-400 font-mono">details</code> array for per-field errors)</span>
              </div>
              <div className="flex items-start gap-2">
                <code className="text-xs bg-red-50 text-red-700 px-1.5 py-0.5 rounded font-mono flex-shrink-0">429</code>
                <span className="text-slate-600">Concurrent audit limit reached — wait for existing audits to complete or cancel one</span>
              </div>
            </div>
          </EndpointCard>
        </div>

        {/* ── GET /api/v1/audits ── */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">List Audits</h2>
          <EndpointCard method="GET" path="/api/v1/audits" description="List all audits with pagination and filtering" defaultOpen>
            <div className="space-y-1 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Scope:</span>
                <code className="text-xs font-mono font-medium text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">audits:read</code>
              </div>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">List all audits for your account. Results are sorted by creation date (newest first) and support pagination and filtering.</p>

            <ParamTable
              title="Query Parameters"
              params={[
                { name: 'status', type: 'string', description: 'Filter by status: pending, discovering, ready, processing, completed, failed, cancelled' },
                { name: 'domain', type: 'string', description: 'Filter by exact domain match (e.g., "example.com")' },
                { name: 'page', type: 'integer', description: 'Page number (starts at 1). Default: 1' },
                { name: 'limit', type: 'integer', description: 'Results per page. Min: 1, Max: 100. Default: 20' },
              ]}
            />

            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mt-6 mb-2">Example Request</h4>
            <CodeBlock
              language="bash"
              label="cURL"
              code={`curl "https://app.kritano.io/api/v1/audits?status=completed&domain=example.com&limit=10" \\
  -H "Authorization: Bearer kt_live_your_key"`}
            />
            <CodeBlock
              language="json"
              label="Response · 200 OK"
              code={`{
  "audits": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "url": "https://example.com",
      "domain": "example.com",
      "status": "completed",
      "progress": {
        "pagesFound": 45,
        "pagesCrawled": 45,
        "pagesAudited": 45
      },
      "issues": { "total": 23, "critical": 2 },
      "scores": {
        "seo": 85,
        "accessibility": 72,
        "security": 90,
        "performance": 68
      },
      "createdAt": "2026-03-14T10:00:00.000Z",
      "startedAt": "2026-03-14T10:00:30.000Z",
      "completedAt": "2026-03-14T10:05:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "pages": 5
  }
}`}
            />

            <div className="flex gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg mt-4">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-sm text-slate-900 mb-1">Pagination</div>
                <p className="text-sm text-slate-700">
                  Use <code className="text-xs bg-blue-100 px-1 py-0.5 rounded font-mono">pagination.pages</code> to know the total number of pages. Increment <code className="text-xs bg-blue-100 px-1 py-0.5 rounded font-mono">page</code> until you reach it. The maximum <code className="text-xs bg-blue-100 px-1 py-0.5 rounded font-mono">limit</code> is 100 — values above 100 are clamped.
                </p>
              </div>
            </div>
          </EndpointCard>
        </div>

        {/* ── GET /api/v1/audits/:id ── */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Get Audit</h2>
          <EndpointCard method="GET" path="/api/v1/audits/:id" description="Get detailed audit information including config and scores" defaultOpen>
            <div className="space-y-1 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Scope:</span>
                <code className="text-xs font-mono font-medium text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">audits:read</code>
              </div>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Retrieve detailed information about a specific audit including its configuration, progress, scores, and HATEOAS links. Use this endpoint to poll for audit completion.
            </p>

            <ParamTable
              title="Path Parameters"
              params={[
                { name: 'id', type: 'uuid', required: true, description: 'The audit ID returned from POST /audits' },
              ]}
            />

            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mt-6 mb-2">Example Request</h4>
            <CodeBlock
              language="bash"
              label="cURL"
              code={`curl "https://app.kritano.io/api/v1/audits/550e8400-e29b-41d4-a716-446655440000" \\
  -H "Authorization: Bearer kt_live_your_key"`}
            />
            <CodeBlock
              language="json"
              label="Response · 200 OK"
              code={`{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "url": "https://example.com",
  "domain": "example.com",
  "status": "completed",
  "progress": {
    "pagesFound": 45,
    "pagesCrawled": 45,
    "pagesAudited": 45,
    "currentUrl": null
  },
  "issues": { "total": 23, "critical": 2 },
  "scores": {
    "seo": 85,
    "accessibility": 72,
    "security": 90,
    "performance": 68
  },
  "config": {
    "maxPages": 100,
    "maxDepth": 5,
    "respectRobotsTxt": true,
    "includeSubdomains": false,
    "checks": {
      "seo": true,
      "accessibility": true,
      "security": true,
      "performance": true
    }
  },
  "startedAt": "2026-03-14T10:00:30.000Z",
  "completedAt": "2026-03-14T10:05:00.000Z",
  "createdAt": "2026-03-14T10:00:00.000Z",
  "_links": {
    "self": "/api/v1/audits/550e8400-e29b-41d4-a716-446655440000",
    "findings": "/api/v1/audits/550e8400-e29b-41d4-a716-446655440000/findings"
  }
}`}
            />

            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mt-6 mb-2">Audit Status Lifecycle</h4>
            <p className="text-sm text-slate-600 mb-3">An audit moves through these states:</p>
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              {['pending', 'discovering', 'ready', 'processing', 'completed'].map((s, i) => (
                <span key={s}>
                  {i > 0 && <span className="text-slate-500 mx-1">&rarr;</span>}
                  <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded">{s}</span>
                </span>
              ))}
            </div>
            <p className="text-sm text-slate-500 mt-2">
              An audit can also end in <code className="text-xs bg-red-50 text-red-700 px-1.5 py-0.5 rounded font-mono">failed</code> or <code className="text-xs bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono">cancelled</code> at any point.
            </p>

            <div className="flex gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg mt-4">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-sm text-slate-900 mb-1">Polling for Completion</div>
                <p className="text-sm text-slate-700">
                  Poll this endpoint every 5-10 seconds. Check <code className="text-xs bg-blue-100 px-1 py-0.5 rounded font-mono">status</code> — when it's <code className="text-xs bg-blue-100 px-1 py-0.5 rounded font-mono">"completed"</code>, the <code className="text-xs bg-blue-100 px-1 py-0.5 rounded font-mono">scores</code> and <code className="text-xs bg-blue-100 px-1 py-0.5 rounded font-mono">issues</code> fields will be populated. While processing, <code className="text-xs bg-blue-100 px-1 py-0.5 rounded font-mono">progress.currentUrl</code> shows the page currently being audited.
                </p>
              </div>
            </div>
          </EndpointCard>
        </div>

        {/* ── GET /api/v1/audits/:id/findings ── */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Get Findings</h2>
          <EndpointCard method="GET" path="/api/v1/audits/:id/findings" description="Retrieve findings with filtering by category and severity" defaultOpen>
            <div className="space-y-1 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Scope:</span>
                <code className="text-xs font-mono font-medium text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">findings:read</code>
              </div>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Retrieve all findings for a completed audit. Results are sorted by severity (critical first) then by creation date. Supports filtering by category and severity.
            </p>

            <ParamTable
              title="Path Parameters"
              params={[
                { name: 'id', type: 'uuid', required: true, description: 'The audit ID' },
              ]}
            />
            <ParamTable
              title="Query Parameters"
              params={[
                { name: 'category', type: 'string', description: 'Filter by category: seo, accessibility, security, performance, content, structured-data' },
                { name: 'severity', type: 'string', description: 'Filter by severity: critical, serious, moderate, minor, info' },
                { name: 'page', type: 'integer', description: 'Page number (starts at 1). Default: 1' },
                { name: 'limit', type: 'integer', description: 'Results per page. Min: 1, Max: 100. Default: 50' },
              ]}
            />

            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mt-6 mb-2">Example Request</h4>
            <CodeBlock
              language="bash"
              label="cURL — All critical accessibility findings"
              code={`curl "https://app.kritano.io/api/v1/audits/550e8400.../findings?category=accessibility&severity=critical" \\
  -H "Authorization: Bearer kt_live_your_key"`}
            />
            <CodeBlock
              language="json"
              label="Response · 200 OK"
              code={`{
  "findings": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "category": "accessibility",
      "severity": "critical",
      "ruleId": "color-contrast",
      "ruleName": "Ensure sufficient color contrast",
      "message": "Element has insufficient color contrast (2.5:1 vs 4.5:1 required)",
      "description": "Text must have sufficient color contrast for readability",
      "recommendation": "Increase contrast between text and background colors",
      "pageUrl": "https://example.com/about",
      "selector": ".header-text",
      "snippet": "<h1 class=\\"header-text\\">About Us</h1>",
      "wcagCriteria": ["WCAG2AA.Principle4.Guideline4_3.4_3_1.G18.Fail"],
      "helpUrl": "https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum",
      "status": "active"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 127,
    "pages": 3
  }
}`}
            />

            <div className="flex gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg mt-4">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-sm text-slate-900 mb-1">Severity Order</div>
                <p className="text-sm text-slate-700">
                  Findings are sorted by severity: <strong>critical</strong> &rarr; <strong>serious</strong> &rarr; <strong>moderate</strong> &rarr; <strong>minor</strong> &rarr; <strong>info</strong>, then by creation date (newest first) within each severity level.
                </p>
              </div>
            </div>
          </EndpointCard>
        </div>

        {/* ── POST /api/v1/audits/:id/cancel ── */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Cancel Audit</h2>
          <EndpointCard method="POST" path="/api/v1/audits/:id/cancel" description="Cancel a pending or in-progress audit" defaultOpen>
            <div className="space-y-1 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Scope:</span>
                <code className="text-xs font-mono font-medium text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">audits:write</code>
              </div>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Cancel a running audit. Only audits in these states can be cancelled: <code className="text-xs bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded text-indigo-700 dark:text-indigo-400 font-mono">pending</code>, <code className="text-xs bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded text-indigo-700 dark:text-indigo-400 font-mono">discovering</code>, <code className="text-xs bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded text-indigo-700 dark:text-indigo-400 font-mono">ready</code>, <code className="text-xs bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded text-indigo-700 dark:text-indigo-400 font-mono">processing</code>. No request body is needed.
            </p>

            <ParamTable
              title="Path Parameters"
              params={[
                { name: 'id', type: 'uuid', required: true, description: 'The audit ID to cancel' },
              ]}
            />

            <CodeBlock
              language="bash"
              label="cURL"
              code={`curl -X POST "https://app.kritano.io/api/v1/audits/550e8400.../cancel" \\
  -H "Authorization: Bearer kt_live_your_key"`}
            />
            <CodeBlock
              language="json"
              label="Response · 200 OK"
              code={`{
  "message": "Audit cancelled",
  "status": "cancelled"
}`}
            />

            <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg mt-4">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-slate-700">
                Returns <code className="text-xs bg-amber-100 px-1 py-0.5 rounded font-mono">404</code> if the audit is already completed, failed, or cancelled. Check the audit's status first if you're unsure.
              </p>
            </div>
          </EndpointCard>
        </div>

        {/* ── DELETE /api/v1/audits/:id ── */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Delete Audit</h2>
          <EndpointCard method="DELETE" path="/api/v1/audits/:id" description="Permanently delete an audit and all its data" defaultOpen>
            <div className="space-y-1 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Scope:</span>
                <code className="text-xs font-mono font-medium text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">audits:write</code>
              </div>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Permanently delete an audit and all associated findings and page data. Only audits in terminal states can be deleted: <code className="text-xs bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded text-indigo-700 dark:text-indigo-400 font-mono">completed</code>, <code className="text-xs bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded text-indigo-700 dark:text-indigo-400 font-mono">failed</code>, <code className="text-xs bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded text-indigo-700 dark:text-indigo-400 font-mono">cancelled</code>. This action cannot be undone.
            </p>

            <ParamTable
              title="Path Parameters"
              params={[
                { name: 'id', type: 'uuid', required: true, description: 'The audit ID to delete' },
              ]}
            />

            <CodeBlock
              language="bash"
              label="cURL"
              code={`curl -X DELETE "https://app.kritano.io/api/v1/audits/550e8400-e29b-41d4-a716-446655440000" \\
  -H "Authorization: Bearer kt_live_your_key"`}
            />

            <div className="flex gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg mt-4">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-slate-700">
                Returns <code className="text-xs bg-blue-100 px-1 py-0.5 rounded font-mono">204 No Content</code> on success with an empty response body. Returns <code className="text-xs bg-blue-100 px-1 py-0.5 rounded font-mono">404</code> if the audit is still running or doesn't exist.
              </p>
            </div>
          </EndpointCard>
        </div>
      </DocsLayout>
    </PublicLayout>
  );
}
