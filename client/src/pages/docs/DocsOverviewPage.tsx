import { Link } from 'react-router-dom';
import { PublicLayout } from '../../components/layout/PublicLayout';
import PageSeo from '../../components/seo/PageSeo';
import DocsLayout from '../../components/docs/DocsLayout';
import CodeBlock from '../../components/docs/CodeBlock';
import { Key, Zap, BarChart3, ArrowRight } from 'lucide-react';

const QUICK_START = [
  { href: '/docs/authentication', label: 'Authentication', description: 'Set up API key authentication in minutes.', icon: Key, color: 'bg-blue-50 text-blue-600' },
  { href: '/docs/endpoints', label: 'Quick Start', description: 'Create your first audit and retrieve findings.', icon: Zap, color: 'bg-emerald-50 text-emerald-600' },
  { href: '/docs/rate-limits', label: 'Rate Limits', description: 'Understand tier limits and best practices.', icon: BarChart3, color: 'bg-purple-50 text-purple-600' },
];

export default function DocsOverviewPage() {
  return (
    <PublicLayout>
      <PageSeo
        title="API Documentation"
        description="Comprehensive API documentation for Kritano - automate website audits, retrieve findings, and build custom integrations."
        path="/docs"
        useOverrides={true}
      />

      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 text-white py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-20">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              API Version 1.0
            </div>
            <h1 className="font-display text-4xl lg:text-5xl font-bold mb-5 leading-tight">
              Build with the <span className="text-indigo-300">Kritano API</span>
            </h1>
            <p className="text-lg text-slate-300 leading-relaxed mb-8">
              Integrate powerful website auditing into your workflow. Automate accessibility, SEO, security, and performance checks at scale.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/docs/authentication" className="px-5 py-3 bg-white text-slate-900 rounded-lg font-semibold text-sm hover:bg-slate-100 transition-colors">
                Read the Docs
              </Link>
              <Link to="/app/settings/api-keys" className="px-5 py-3 bg-white/10 border border-white/20 text-white rounded-lg font-semibold text-sm hover:bg-white/15 transition-colors">
                Get API Key
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Quick start cards */}
      <div className="max-w-7xl mx-auto px-6 lg:px-20 -mt-10 relative z-10 mb-8">
        <div className="grid md:grid-cols-3 gap-5">
          {QUICK_START.map(card => {
            const Icon = card.icon;
            return (
              <Link key={card.href} to={card.href} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${card.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{card.label}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">{card.description}</p>
              </Link>
            );
          })}
        </div>
      </div>

      <DocsLayout>
        {/* Getting Started */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white mb-4">Getting Started</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            The Kritano API lets you programmatically create website audits, retrieve detailed findings, and integrate audit results into your own tools and workflows. Follow these three steps to make your first API call.
          </p>

          {/* Step 1 */}
          <div className="flex gap-4 mb-8">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold">1</div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">Get your API key</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-3">
                Go to <Link to="/app/settings/api-keys" className="text-indigo-600 dark:text-indigo-400 font-medium underline underline-offset-2 decoration-indigo-300 hover:decoration-indigo-600">Settings &rarr; API Keys</Link> and create a new key. Select the scopes you need - at minimum <code className="text-xs bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-indigo-700 dark:text-indigo-400 font-mono">audits:read</code> and <code className="text-xs bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-indigo-700 dark:text-indigo-400 font-mono">audits:write</code>.
              </p>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                Your key will look like: <code className="text-xs bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-indigo-700 dark:text-indigo-400 font-mono">kt_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx</code>
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-4 mb-8">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold">2</div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">Create an audit</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-3">
                Send a POST request to create your first audit. The API will queue the audit and return immediately with a pending status.
              </p>
              <CodeBlock
                language="bash"
                label="cURL"
                code={`curl -X POST "https://app.kritano.io/api/v1/audits" \\
  -H "Authorization: Bearer kt_live_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://example.com",
    "options": {
      "maxPages": 50,
      "checks": ["seo", "accessibility"]
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
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-4 mb-8">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold">3</div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">Poll for results &amp; fetch findings</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-3">
                Poll the audit endpoint until <code className="text-xs bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-indigo-700 dark:text-indigo-400 font-mono">status</code> is <code className="text-xs bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-indigo-700 dark:text-indigo-400 font-mono">"completed"</code>, then fetch findings:
              </p>
              <CodeBlock
                language="bash"
                label="cURL - Check status"
                code={`curl "https://app.kritano.io/api/v1/audits/550e8400-e29b-41d4-a716-446655440000" \\
  -H "Authorization: Bearer kt_live_your_api_key"`}
              />
              <CodeBlock
                language="bash"
                label="cURL - Get findings"
                code={`curl "https://app.kritano.io/api/v1/audits/550e8400-e29b-41d4-a716-446655440000/findings" \\
  -H "Authorization: Bearer kt_live_your_api_key"`}
              />
            </div>
          </div>
        </div>

        {/* Base URL & Headers */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Base URL</h2>
          <CodeBlock code="https://app.kritano.io/api/v1" language="http" label="Base URL" />

          <p className="text-slate-600 dark:text-slate-400 mt-4 mb-2">All requests must include:</p>
          <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-1 text-sm">
            <li><code className="text-xs bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded text-indigo-700 dark:text-indigo-400 font-mono">Authorization: Bearer kt_live_xxx</code> or <code className="text-xs bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded text-indigo-700 dark:text-indigo-400 font-mono">X-API-Key: kt_live_xxx</code></li>
            <li><code className="text-xs bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded text-indigo-700 dark:text-indigo-400 font-mono">Content-Type: application/json</code> for POST requests</li>
          </ul>

          <p className="text-slate-600 dark:text-slate-400 mt-4 mb-2">All responses include rate limit headers:</p>
          <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-1 text-sm">
            <li><code className="text-xs bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded text-indigo-700 dark:text-indigo-400 font-mono">X-RateLimit-Limit</code> - Max requests per minute for your tier</li>
            <li><code className="text-xs bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded text-indigo-700 dark:text-indigo-400 font-mono">X-RateLimit-Remaining</code> - Requests remaining in current window</li>
            <li><code className="text-xs bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded text-indigo-700 dark:text-indigo-400 font-mono">X-RateLimit-Reset</code> - Unix timestamp when window resets</li>
          </ul>
        </div>

        {/* API Scopes */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">API Scopes</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Each API key is created with specific scopes that control what it can access. Endpoints require specific scopes - if your key is missing a required scope, you'll receive a <code className="text-xs bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-indigo-700 dark:text-indigo-400 font-mono">403</code> error.
          </p>
          <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50">
                  <th className="text-left px-4 py-3 font-semibold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider">Scope</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider">Used By</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider">Description</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { scope: 'audits:read', used: 'GET /audits, GET /audits/:id, GET /info', desc: 'List and retrieve audit details' },
                  { scope: 'audits:write', used: 'POST /audits, POST /cancel, DELETE', desc: 'Create, cancel and delete audits' },
                  { scope: 'findings:read', used: 'GET /audits/:id/findings', desc: 'Retrieve audit findings' },
                  { scope: 'findings:write', used: '-', desc: 'Reserved for future use' },
                  { scope: 'exports:read', used: '-', desc: 'Reserved for future use' },
                ].map(s => (
                  <tr key={s.scope} className="border-t border-slate-100 dark:border-slate-700/50">
                    <td className="px-4 py-3 font-mono text-xs text-indigo-600 font-medium whitespace-nowrap">{s.scope}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{s.used}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{s.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Endpoints overview */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Endpoints at a Glance</h2>
          <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50">
                  <th className="text-left px-4 py-3 font-semibold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider">Method</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider">Endpoint</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider hidden sm:table-cell">Description</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { method: 'GET', color: 'bg-emerald-100 text-emerald-700', path: '/api/v1/info', desc: 'API version, your tier and rate limits' },
                  { method: 'POST', color: 'bg-indigo-100 text-indigo-700', path: '/api/v1/audits', desc: 'Create a new audit' },
                  { method: 'GET', color: 'bg-emerald-100 text-emerald-700', path: '/api/v1/audits', desc: 'List all audits with pagination' },
                  { method: 'GET', color: 'bg-emerald-100 text-emerald-700', path: '/api/v1/audits/:id', desc: 'Get audit details, scores and config' },
                  { method: 'GET', color: 'bg-emerald-100 text-emerald-700', path: '/api/v1/audits/:id/findings', desc: 'Get findings with severity & category filters' },
                  { method: 'POST', color: 'bg-indigo-100 text-indigo-700', path: '/api/v1/audits/:id/cancel', desc: 'Cancel a pending or in-progress audit' },
                  { method: 'DELETE', color: 'bg-red-100 text-red-700', path: '/api/v1/audits/:id', desc: 'Permanently delete an audit' },
                ].map((e, i) => (
                  <tr key={i} className="border-t border-slate-100 hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold font-mono uppercase px-2 py-0.5 rounded ${e.color}`}>{e.method}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-800 dark:text-slate-200">{e.path}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 hidden sm:table-cell">{e.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Link to="/docs/endpoints" className="inline-flex items-center gap-1.5 mt-4 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300">
            View full endpoint reference <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </DocsLayout>
    </PublicLayout>
  );
}
