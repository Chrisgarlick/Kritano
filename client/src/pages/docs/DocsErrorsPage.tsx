import { PublicLayout } from '../../components/layout/PublicLayout';
import PageSeo from '../../components/seo/PageSeo';
import DocsLayout from '../../components/docs/DocsLayout';
import CodeBlock from '../../components/docs/CodeBlock';

const STATUS_CODES = [
  { code: '200', description: 'Success — Request completed successfully', category: 'success' },
  { code: '201', description: 'Created — Resource was created successfully (returned by POST /audits)', category: 'success' },
  { code: '204', description: 'No Content — Successful deletion (returned by DELETE /audits/:id)', category: 'success' },
  { code: '400', description: 'Bad Request — Invalid parameters, malformed JSON, or validation failure', category: 'error' },
  { code: '401', description: 'Unauthorized — Missing or invalid API key', category: 'error' },
  { code: '403', description: 'Forbidden — API key lacks the required scope for this endpoint', category: 'error' },
  { code: '404', description: 'Not Found — The audit doesn\'t exist or doesn\'t belong to your account', category: 'error' },
  { code: '429', description: 'Too Many Requests — Rate limit exceeded or concurrent audit limit reached', category: 'error' },
  { code: '500', description: 'Internal Server Error — Something went wrong on our end', category: 'error' },
];

const ERROR_CODES = [
  { code: 'API_KEY_REQUIRED', status: '401', meaning: 'No API key was provided in the request headers' },
  { code: 'API_KEY_INVALID', status: '401', meaning: 'The API key is invalid, expired, or has been revoked' },
  { code: 'SCOPE_REQUIRED', status: '403', meaning: 'Your API key doesn\'t have the required scope for this endpoint' },
  { code: 'VALIDATION_ERROR', status: '400', meaning: 'One or more request parameters failed validation' },
  { code: 'INVALID_URL', status: '400', meaning: 'The provided URL is not valid or not publicly accessible' },
  { code: 'RATE_LIMIT_EXCEEDED', status: '429', meaning: 'You\'ve exceeded your per-minute or per-day request limit' },
  { code: 'AUDIT_LIMIT_REACHED', status: '429', meaning: 'You\'ve reached your concurrent audit limit for this tier' },
  { code: 'AUDIT_NOT_FOUND', status: '404', meaning: 'The requested audit doesn\'t exist or belongs to another account' },
  { code: 'AUDIT_ALREADY_COMPLETED', status: '400', meaning: 'Cannot cancel an audit that has already finished' },
  { code: 'CONCURRENT_LIMIT', status: '429', meaning: 'You have reached your concurrent audit limit' },
  { code: 'CREATE_AUDIT_FAILED', status: '500', meaning: 'An internal error occurred while creating the audit' },
];

export default function DocsErrorsPage() {
  return (
    <PublicLayout>
      <PageSeo
        title="Error Handling - API Docs"
        description="PagePulser API error codes, response format, and troubleshooting guide."
        path="/docs/errors"
        useOverrides={true}
      />
      <DocsLayout>
        {/* HTTP Status Codes */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 mb-6">
          <h1 className="font-display text-2xl font-bold text-slate-900 mb-2">Error Handling</h1>
          <p className="text-slate-600 mb-6">
            The API uses conventional HTTP response codes to indicate success or failure. Codes in the <strong>2xx</strong> range indicate success, <strong>4xx</strong> indicate client errors, and <strong>5xx</strong> indicate server errors.
          </p>

          <h2 className="text-lg font-semibold text-slate-800 mb-3">HTTP Status Codes</h2>
          <div className="border border-slate-200 rounded-lg overflow-hidden mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left px-4 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">Code</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">Description</th>
                </tr>
              </thead>
              <tbody>
                {STATUS_CODES.map(s => (
                  <tr key={s.code} className="border-t border-slate-100 hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <code className={`text-sm px-2 py-0.5 rounded font-mono font-medium ${
                        s.category === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                      }`}>{s.code}</code>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{s.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Error Response Format */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Error Response Format</h2>
          <p className="text-slate-600 mb-3">
            All error responses return a consistent JSON structure with an <code className="text-sm bg-slate-100 px-1.5 py-0.5 rounded text-indigo-700 font-mono">error</code> field, a machine-readable <code className="text-sm bg-slate-100 px-1.5 py-0.5 rounded text-indigo-700 font-mono">code</code>, and a human-readable <code className="text-sm bg-slate-100 px-1.5 py-0.5 rounded text-indigo-700 font-mono">message</code>:
          </p>
          <CodeBlock
            language="json"
            label="Standard Error Response"
            code={`{
  "error": "Short error title",
  "code": "MACHINE_READABLE_CODE",
  "message": "A detailed, human-readable explanation of what went wrong."
}`}
          />

          <h3 className="text-sm font-semibold text-slate-700 mb-2 mt-6">Validation Errors</h3>
          <p className="text-slate-600 text-sm mb-2">
            Validation errors include a <code className="text-xs bg-slate-100 px-1 py-0.5 rounded text-indigo-700 font-mono">details</code> array with per-field error information:
          </p>
          <CodeBlock
            language="json"
            label="400 — Validation Error"
            code={`{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "field": "url",
      "message": "Invalid URL format"
    },
    {
      "field": "options.maxPages",
      "message": "Must be at most 1000"
    }
  ]
}`}
          />

          <h3 className="text-sm font-semibold text-slate-700 mb-2 mt-6">Scope Errors</h3>
          <p className="text-slate-600 text-sm mb-2">
            Scope errors include both the required scopes and your key's current scopes:
          </p>
          <CodeBlock
            language="json"
            label="403 — Insufficient Scope"
            code={`{
  "error": "Insufficient permissions",
  "code": "SCOPE_REQUIRED",
  "requiredScopes": ["audits:write"],
  "yourScopes": ["audits:read", "findings:read"],
  "message": "This endpoint requires one of these scopes: audits:write"
}`}
          />

          <h3 className="text-sm font-semibold text-slate-700 mb-2 mt-6">Rate Limit Errors</h3>
          <p className="text-slate-600 text-sm mb-2">
            Rate limit errors include a <code className="text-xs bg-slate-100 px-1 py-0.5 rounded text-indigo-700 font-mono">retryAfter</code> value in seconds:
          </p>
          <CodeBlock
            language="json"
            label="429 — Rate Limit"
            code={`{
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 60,
  "message": "Rate limit exceeded. Try again in 60 seconds."
}`}
          />
        </div>

        {/* Error Code Reference */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Error Code Reference</h2>
          <p className="text-slate-600 mb-4">
            Use the <code className="text-sm bg-slate-100 px-1.5 py-0.5 rounded text-indigo-700 font-mono">code</code> field to programmatically handle specific errors:
          </p>
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left px-4 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">Code</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">HTTP</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">Description</th>
                </tr>
              </thead>
              <tbody>
                {ERROR_CODES.map(e => (
                  <tr key={e.code} className="border-t border-slate-100 hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-mono text-xs text-red-600 font-medium whitespace-nowrap">{e.code}</td>
                    <td className="px-4 py-3"><code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{e.status}</code></td>
                    <td className="px-4 py-3 text-slate-600">{e.meaning}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Troubleshooting */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Troubleshooting</h2>
          <div className="space-y-4">
            {[
              {
                q: 'I\'m getting 401 but my key looks correct',
                a: 'Make sure the key starts with pp_live_ and you\'re using the full key (not just the prefix shown in the dashboard). Check if the key has been revoked or has expired.',
              },
              {
                q: 'I\'m getting 403 but I have the key',
                a: 'Your key is valid but missing the required scope. Check the error response — it tells you which scopes are needed and which your key has. Create a new key with the missing scope or update the existing one.',
              },
              {
                q: 'I\'m getting 429 but I haven\'t made many requests',
                a: 'Check if you\'re hitting the per-day limit (not just per-minute). Also check if the error code is AUDIT_LIMIT_REACHED — this means too many concurrent audits, not too many requests.',
              },
              {
                q: 'I\'m getting 404 on an audit I just created',
                a: 'Make sure you\'re using the full UUID returned in the create response. Audits are scoped to your account — you can\'t access audits created by other users or API keys belonging to different users.',
              },
            ].map((item, i) => (
              <div key={i} className="border border-slate-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-slate-800 mb-1">{item.q}</h3>
                <p className="text-sm text-slate-600">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </DocsLayout>
    </PublicLayout>
  );
}
