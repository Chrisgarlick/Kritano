import { PublicLayout } from '../../components/layout/PublicLayout';
import PageSeo from '../../components/seo/PageSeo';
import DocsLayout from '../../components/docs/DocsLayout';
import CodeBlock from '../../components/docs/CodeBlock';

const AUDIT_FIELDS = [
  { field: 'id', type: 'string (uuid)', description: 'Unique identifier for the audit' },
  { field: 'url', type: 'string', description: 'The target URL being audited' },
  { field: 'domain', type: 'string', description: 'The domain extracted from the URL (www prefix stripped)' },
  { field: 'status', type: 'string', description: 'Current audit status (see lifecycle below)' },
  { field: 'progress', type: 'object', description: 'Real-time crawl and audit progress' },
  { field: 'progress.pagesFound', type: 'integer', description: 'Total pages discovered during crawl' },
  { field: 'progress.pagesCrawled', type: 'integer', description: 'Pages that have been successfully crawled' },
  { field: 'progress.pagesAudited', type: 'integer', description: 'Pages that have been fully audited' },
  { field: 'progress.currentUrl', type: 'string | null', description: 'URL currently being processed (null when idle or complete)' },
  { field: 'issues', type: 'object', description: 'Summary of unique issues found' },
  { field: 'issues.total', type: 'integer', description: 'Total number of unique issues across all categories' },
  { field: 'issues.critical', type: 'integer', description: 'Number of critical severity issues' },
  { field: 'scores', type: 'object', description: 'Category scores (populated on completion)' },
  { field: 'scores.seo', type: 'integer | null', description: 'SEO score (0-100), null if check not enabled' },
  { field: 'scores.accessibility', type: 'integer | null', description: 'Accessibility score (0-100)' },
  { field: 'scores.security', type: 'integer | null', description: 'Security score (0-100)' },
  { field: 'scores.performance', type: 'integer | null', description: 'Performance score (0-100)' },
  { field: 'config', type: 'object', description: 'Audit configuration (only in single-audit responses)' },
  { field: 'config.maxPages', type: 'integer', description: 'Maximum pages that were set to crawl' },
  { field: 'config.maxDepth', type: 'integer', description: 'Maximum crawl depth from start URL' },
  { field: 'config.respectRobotsTxt', type: 'boolean', description: 'Whether robots.txt was respected' },
  { field: 'config.includeSubdomains', type: 'boolean', description: 'Whether subdomains were included' },
  { field: 'config.checks', type: 'object', description: 'Which check categories were enabled (boolean per category)' },
  { field: 'createdAt', type: 'string', description: 'ISO 8601 timestamp - when the audit was created' },
  { field: 'startedAt', type: 'string | null', description: 'When processing actually began' },
  { field: 'completedAt', type: 'string | null', description: 'When the audit finished (completed, failed, or cancelled)' },
  { field: '_links', type: 'object', description: 'HATEOAS links (only in single-audit and create responses)' },
  { field: '_links.self', type: 'string', description: 'URL to this audit' },
  { field: '_links.findings', type: 'string', description: 'URL to this audit\'s findings' },
];

const FINDING_FIELDS = [
  { field: 'id', type: 'string (uuid)', description: 'Unique finding identifier' },
  { field: 'category', type: 'string', description: 'Issue category: seo, accessibility, security, performance, content, structured-data' },
  { field: 'severity', type: 'string', description: 'Severity level: critical, serious, moderate, minor, info' },
  { field: 'ruleId', type: 'string', description: 'Machine-readable rule identifier (e.g., "color-contrast")' },
  { field: 'ruleName', type: 'string', description: 'Human-readable rule name (e.g., "Ensure sufficient color contrast")' },
  { field: 'message', type: 'string', description: 'Specific issue message for this finding instance' },
  { field: 'description', type: 'string', description: 'General description of what this rule checks for' },
  { field: 'recommendation', type: 'string | null', description: 'Actionable advice on how to fix the issue' },
  { field: 'pageUrl', type: 'string', description: 'Full URL of the page where the issue was found' },
  { field: 'selector', type: 'string | null', description: 'CSS selector of the affected DOM element' },
  { field: 'snippet', type: 'string | null', description: 'HTML snippet showing the problematic element' },
  { field: 'wcagCriteria', type: 'string[] | null', description: 'WCAG success criteria references (e.g., ["1.4.3"])' },
  { field: 'helpUrl', type: 'string | null', description: 'Link to detailed documentation or WCAG understanding doc' },
  { field: 'status', type: 'string', description: 'Finding status: active, dismissed, acknowledged' },
];

const PAGINATION_FIELDS = [
  { field: 'page', type: 'integer', description: 'Current page number (starts at 1)' },
  { field: 'limit', type: 'integer', description: 'Number of items per page' },
  { field: 'total', type: 'integer', description: 'Total number of items matching the query' },
  { field: 'pages', type: 'integer', description: 'Total number of pages (Math.ceil(total / limit))' },
];

function ObjectTable({ fields }: { fields: { field: string; type: string; description: string }[] }) {
  return (
    <div className="border border-slate-200 rounded-lg overflow-x-auto" tabIndex={0} role="region" aria-label="Object fields">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-800/50">
            <th className="text-left px-4 py-3 font-semibold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider whitespace-nowrap">Field</th>
            <th className="text-left px-4 py-3 font-semibold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider whitespace-nowrap">Type</th>
            <th className="text-left px-4 py-3 font-semibold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider">Description</th>
          </tr>
        </thead>
        <tbody>
          {fields.map(f => (
            <tr key={f.field} className="border-t border-slate-100 dark:border-slate-700/50 hover:bg-slate-50/50">
              <td className="px-4 py-3 font-mono text-xs text-indigo-600 font-medium whitespace-nowrap">{f.field}</td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">{f.type}</span>
              </td>
              <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{f.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function DocsObjectsPage() {
  return (
    <PublicLayout>
      <PageSeo
        title="Object Reference - API Docs"
        description="Complete reference for Kritano API objects - Audit and Finding data structures with field descriptions."
        path="/docs/objects"
        useOverrides={true}
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://kritano.com' },
            { '@type': 'ListItem', position: 2, name: 'API Docs', item: 'https://kritano.com/docs' },
            { '@type': 'ListItem', position: 3, name: 'Object Reference', item: 'https://kritano.com/docs/objects' },
          ],
        }}
      />
      <DocsLayout>
        {/* Audit Object */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-6 mb-6">
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white mb-6">Object Reference</h1>

          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2" id="audit-object">Audit Object</h2>
          <h3 className="text-sm font-semibold text-slate-700 mb-3 mt-4">Overview</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            The audit object represents a website audit job. It contains configuration, real-time progress, scores, and issue counts. The shape varies slightly between list and detail endpoints - the detail endpoint includes <code className="text-xs bg-slate-100 px-1 py-0.5 rounded text-indigo-700 font-mono">config</code> and <code className="text-xs bg-slate-100 px-1 py-0.5 rounded text-indigo-700 font-mono">_links</code>.
          </p>
          <h3 className="text-sm font-semibold text-slate-700 mb-3 mt-6">Audit Fields</h3>
          <ObjectTable fields={AUDIT_FIELDS} />

          <h3 className="text-sm font-semibold text-slate-700 mb-3 mt-6">Audit Status Lifecycle</h3>
          <p className="text-sm text-slate-600 mb-3">An audit progresses through these states:</p>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4">
            <div className="flex flex-wrap items-center gap-1 text-xs font-mono mb-3">
              {['pending', 'discovering', 'ready', 'processing', 'completed'].map((s, i) => (
                <span key={s} className="flex items-center">
                  {i > 0 && <span className="text-slate-500 mx-1.5">&rarr;</span>}
                  <span className="bg-white border border-slate-200 text-slate-700 px-2.5 py-1 rounded shadow-sm">{s}</span>
                </span>
              ))}
            </div>
            <ul className="text-xs text-slate-500 space-y-1 list-disc list-inside">
              <li><strong>pending</strong> - Queued, waiting for a worker</li>
              <li><strong>discovering</strong> - Initial URL discovery and crawl in progress</li>
              <li><strong>ready</strong> - Pages discovered, about to begin auditing</li>
              <li><strong>processing</strong> - Actively auditing pages</li>
              <li><strong>completed</strong> - All checks finished, scores available</li>
              <li><strong>failed</strong> - An error occurred (can happen at any stage)</li>
              <li><strong>cancelled</strong> - User cancelled the audit</li>
            </ul>
          </div>

          <h3 className="text-sm font-semibold text-slate-700 mb-3">Full Audit Example</h3>
          <CodeBlock
            language="json"
            label="GET /api/v1/audits/:id"
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
        </div>

        {/* Finding Object */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2" id="finding-object">Finding Object</h2>
          <h3 className="text-sm font-semibold text-slate-700 mb-3 mt-4">Overview</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            A finding represents an individual issue discovered during the audit. Each finding includes the issue location, severity, remediation advice, and links to relevant standards documentation.
          </p>
          <h3 className="text-sm font-semibold text-slate-700 mb-3 mt-6">Finding Fields</h3>
          <ObjectTable fields={FINDING_FIELDS} />

          <h3 className="text-sm font-semibold text-slate-700 mb-3 mt-6">Finding Categories</h3>
          <div className="grid sm:grid-cols-2 gap-2 mb-6">
            {[
              { cat: 'seo', desc: 'Search engine optimisation issues (meta tags, headings, links, etc.)' },
              { cat: 'accessibility', desc: 'WCAG 2.x compliance issues (contrast, alt text, ARIA, etc.)' },
              { cat: 'security', desc: 'Security vulnerabilities (headers, mixed content, etc.)' },
              { cat: 'performance', desc: 'Performance issues (large images, render-blocking resources, etc.)' },
              { cat: 'content', desc: 'Content quality issues (spelling, readability, broken links)' },
              { cat: 'structured-data', desc: 'Schema.org and structured data issues' },
            ].map(c => (
              <div key={c.cat} className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg">
                <code className="text-xs font-mono font-medium text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded whitespace-nowrap">{c.cat}</code>
                <span className="text-xs text-slate-600">{c.desc}</span>
              </div>
            ))}
          </div>

          <h3 className="text-sm font-semibold text-slate-700 mb-3">Severity Levels</h3>
          <div className="flex flex-wrap gap-2 mb-6">
            {[
              { level: 'critical', color: 'bg-red-100 text-red-700', desc: 'Must fix - blocks users or has serious legal/security implications' },
              { level: 'serious', color: 'bg-orange-100 text-orange-700', desc: 'Should fix - significant impact on user experience' },
              { level: 'moderate', color: 'bg-amber-100 text-amber-700', desc: 'Recommended - noticeable impact, but not blocking' },
              { level: 'minor', color: 'bg-yellow-100 text-yellow-700', desc: 'Nice to fix - minor improvement opportunity' },
              { level: 'info', color: 'bg-blue-100 text-blue-700', desc: 'Informational - observation, not necessarily a problem' },
            ].map(s => (
              <div key={s.level} className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg w-full sm:w-auto sm:flex-1">
                <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase whitespace-nowrap ${s.color}`}>{s.level}</span>
                <span className="text-xs text-slate-600">{s.desc}</span>
              </div>
            ))}
          </div>

          <h3 className="text-sm font-semibold text-slate-700 mb-3">Full Finding Example</h3>
          <CodeBlock
            language="json"
            label="Finding Object"
            code={`{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "category": "accessibility",
  "severity": "critical",
  "ruleId": "color-contrast",
  "ruleName": "Ensure sufficient color contrast",
  "message": "Element has insufficient color contrast (2.5:1 vs 4.5:1 required)",
  "description": "Text must have sufficient color contrast for readability",
  "recommendation": "Increase contrast between text and background colors to at least 4.5:1",
  "pageUrl": "https://example.com/about",
  "selector": "main > .hero-section > h1",
  "snippet": "<h1 class=\\"header-text\\" style=\\"color: #999\\">About Us</h1>",
  "wcagCriteria": ["WCAG2AA.Principle4.Guideline4_3.4_3_1.G18.Fail"],
  "helpUrl": "https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum",
  "status": "active"
}`}
          />
        </div>

        {/* Pagination Object */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2" id="pagination">Pagination Object</h2>
          <h3 className="text-sm font-semibold text-slate-700 mb-3 mt-4">Overview</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            All list endpoints include a <code className="text-xs bg-slate-100 px-1 py-0.5 rounded text-indigo-700 font-mono">pagination</code> object. Use it to iterate through results.
          </p>
          <h3 className="text-sm font-semibold text-slate-700 mb-3 mt-6">Pagination Fields</h3>
          <ObjectTable fields={PAGINATION_FIELDS} />

          <h3 className="text-sm font-semibold text-slate-700 mb-3 mt-6">Pagination Example</h3>
          <CodeBlock
            language="json"
            label="Pagination Object"
            code={`{
  "pagination": {
    "page": 2,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}`}
          />
          <p className="text-sm text-slate-500 mt-3">
            To fetch the next page, increment the <code className="text-xs bg-slate-100 px-1 py-0.5 rounded text-indigo-700 font-mono">page</code> query parameter. Stop when <code className="text-xs bg-slate-100 px-1 py-0.5 rounded text-indigo-700 font-mono">page</code> equals <code className="text-xs bg-slate-100 px-1 py-0.5 rounded text-indigo-700 font-mono">pagination.pages</code>. The maximum <code className="text-xs bg-slate-100 px-1 py-0.5 rounded text-indigo-700 font-mono">limit</code> is 100 - any value above is clamped.
          </p>
        </div>
      </DocsLayout>
    </PublicLayout>
  );
}
