import { Link } from 'react-router-dom';
import { PublicLayout } from '../../components/layout/PublicLayout';
import PageSeo from '../../components/seo/PageSeo';
import DocsLayout from '../../components/docs/DocsLayout';
import CodeBlock from '../../components/docs/CodeBlock';
import { AlertTriangle, Info } from 'lucide-react';

export default function DocsAuthPage() {
  return (
    <PublicLayout>
      <PageSeo
        title="Authentication - API Docs"
        description="Learn how to authenticate your Kritano API requests using API keys and Bearer tokens."
        path="/docs/authentication"
        useOverrides={true}
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://kritano.com' },
            { '@type': 'ListItem', position: 2, name: 'API Docs', item: 'https://kritano.com/docs' },
            { '@type': 'ListItem', position: 3, name: 'Authentication', item: 'https://kritano.com/docs/authentication' },
          ],
        }}
      />
      <DocsLayout>
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-6 mb-6">
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white mb-2">Authentication</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            API authentication is the process of verifying that a request comes from an authorised client. The Kritano API uses API keys, which are long-lived tokens that identify your account and control what endpoints you can access.
          </p>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            You can create and manage API keys from your{' '}
            <Link to="/app/settings/api-keys" className="text-indigo-600 dark:text-indigo-400 font-medium underline underline-offset-2 decoration-indigo-300 hover:decoration-indigo-600">Settings &rarr; API Keys</Link> page. Each key has scoped permissions so you can limit access to only what is needed.
          </p>

          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-3">API Key Format</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-3">
            All API keys are prefixed with <code className="text-sm bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-indigo-700 dark:text-indigo-400 font-mono">kt_live_</code> followed by a randomly generated token. Your full key is only shown once at creation - store it securely.
          </p>
          <CodeBlock code="kt_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" language="http" label="API Key Format" />

          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-3 mt-8">Sending Your API Key</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-3">
            You can authenticate using either of two headers. The API checks them in this order:
          </p>

          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 mt-4">Option 1: Authorization Header (recommended)</h3>
          <CodeBlock code="Authorization: Bearer kt_live_your_api_key_here" language="http" label="HTTP Header" />

          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 mt-4">Option 2: X-API-Key Header</h3>
          <CodeBlock code="X-API-Key: kt_live_your_api_key_here" language="http" label="HTTP Header" />

          <div className="flex gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg my-6">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-sm text-slate-900 dark:text-white mb-1">Keep Your Keys Secure</div>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                Never expose your API keys in client-side code, public repositories, or browser requests. API keys grant access to your account resources based on their scopes. If you suspect a key has been compromised, revoke it immediately from the dashboard.
              </p>
            </div>
          </div>

          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-3 mt-8">Complete Example</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-3">
            Here's a full request that authenticates and creates an audit:
          </p>
          <CodeBlock
            language="bash"
            label="cURL"
            code={`curl -X POST "https://app.kritano.io/api/v1/audits" \\
  -H "Authorization: Bearer kt_live_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://example.com"}'`}
          />
        </div>

        {/* Scopes */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">API Scopes</h2>
          <p className="text-slate-600 mb-4">
            When creating an API key you select which scopes it has. Each endpoint requires a specific scope - if your key is missing a required scope, you'll get a <code className="text-sm bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-indigo-700 dark:text-indigo-400 font-mono">403 Forbidden</code> response.
          </p>
          <div className="border border-slate-200 rounded-lg overflow-hidden mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left px-4 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">Scope</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">Endpoints</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">Description</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { scope: 'audits:read', endpoints: 'GET /info, GET /audits, GET /audits/:id', desc: 'Read audit data and results' },
                  { scope: 'audits:write', endpoints: 'POST /audits, POST /cancel, DELETE', desc: 'Create, cancel and delete audits' },
                  { scope: 'findings:read', endpoints: 'GET /audits/:id/findings', desc: 'Retrieve audit findings' },
                  { scope: 'findings:write', endpoints: 'None yet', desc: 'Reserved for future use' },
                  { scope: 'exports:read', endpoints: 'None yet', desc: 'Reserved for future use' },
                ].map(s => (
                  <tr key={s.scope} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-mono text-xs text-indigo-600 font-medium whitespace-nowrap">{s.scope}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{s.endpoints}</td>
                    <td className="px-4 py-3 text-slate-600">{s.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-sm text-slate-900 dark:text-white mb-1">Tip</div>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                Follow the principle of least privilege - only grant scopes your integration actually needs. You can create multiple API keys with different scopes for different purposes.
              </p>
            </div>
          </div>
        </div>

        {/* Auth Errors */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Authentication Errors</h2>

          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Missing API Key (401)</h3>
          <p className="text-slate-600 text-sm mb-2">Returned when no API key is provided in the request.</p>
          <CodeBlock
            language="json"
            label="401 Unauthorized"
            code={`{
  "error": "API key required",
  "code": "API_KEY_REQUIRED",
  "message": "Provide API key via Authorization header (Bearer kt_live_xxx) or X-API-Key header"
}`}
          />

          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 mt-6">Invalid API Key (401)</h3>
          <p className="text-slate-600 text-sm mb-2">Returned when the key is invalid, expired, or has been revoked.</p>
          <CodeBlock
            language="json"
            label="401 Unauthorized"
            code={`{
  "error": "Invalid API key",
  "code": "API_KEY_INVALID",
  "message": "The provided API key is invalid, expired, or revoked"
}`}
          />

          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 mt-6">Insufficient Scope (403)</h3>
          <p className="text-slate-600 text-sm mb-2">Returned when your key doesn't have the required scope for an endpoint.</p>
          <CodeBlock
            language="json"
            label="403 Forbidden"
            code={`{
  "error": "Insufficient permissions",
  "code": "SCOPE_REQUIRED",
  "requiredScopes": ["audits:write"],
  "yourScopes": ["audits:read", "findings:read"],
  "message": "This endpoint requires one of these scopes: audits:write"
}`}
          />
        </div>

        {/* Key Management */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Key Management</h2>
          <div className="space-y-4 text-sm text-slate-600">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">1</div>
              <div><strong className="text-slate-800">Creating keys:</strong> Go to <Link to="/app/settings/api-keys" className="text-indigo-600 underline underline-offset-2 decoration-indigo-300 hover:decoration-indigo-600">Settings &rarr; API Keys</Link>. Give the key a name and select its scopes. The full key is shown only once - copy it immediately.</div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">2</div>
              <div><strong className="text-slate-800">Revoking keys:</strong> Click the revoke button next to any active key. Revoked keys are rejected immediately on all subsequent requests.</div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">3</div>
              <div><strong className="text-slate-800">Key expiry:</strong> Keys can optionally have an expiry date. Expired keys are rejected in the same way as revoked keys.</div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">4</div>
              <div><strong className="text-slate-800">Multiple keys:</strong> You can create multiple keys with different scopes for different environments or integrations (e.g., one for CI/CD, one for a dashboard).</div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-6">
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            <strong>Key takeaway:</strong> create an API key in your settings, send it as a Bearer token in the Authorization header, and store it securely. Never expose keys in client-side code or public repositories. Use scoped keys with the minimum permissions needed for each integration.
          </p>
        </div>
      </DocsLayout>
    </PublicLayout>
  );
}
