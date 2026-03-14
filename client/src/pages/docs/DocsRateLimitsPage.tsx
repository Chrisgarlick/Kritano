import { PublicLayout } from '../../components/layout/PublicLayout';
import PageSeo from '../../components/seo/PageSeo';
import DocsLayout from '../../components/docs/DocsLayout';
import CodeBlock from '../../components/docs/CodeBlock';
import { Info, AlertTriangle } from 'lucide-react';

const TIERS = [
  { name: 'Free', rpm: '10', rpd: '100', concurrent: '1', style: 'bg-slate-100 text-slate-600' },
  { name: 'Starter', rpm: '60', rpd: '1,000', concurrent: '3', style: 'bg-emerald-100 text-emerald-700' },
  { name: 'Pro', rpm: '300', rpd: '10,000', concurrent: '10', style: 'bg-blue-100 text-blue-700' },
  { name: 'Enterprise', rpm: '1,000', rpd: 'Unlimited', concurrent: '50', style: 'bg-purple-50 text-purple-600' },
];

export default function DocsRateLimitsPage() {
  return (
    <PublicLayout>
      <PageSeo
        title="Rate Limits - API Docs"
        description="Understand PagePulser API rate limits by plan tier, rate limit headers, and how to handle 429 responses."
        path="/docs/rate-limits"
        useOverrides={true}
      />
      <DocsLayout>
        {/* Tier Limits */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 mb-6">
          <h1 className="font-display text-2xl font-bold text-slate-900 mb-2">Rate Limits</h1>
          <p className="text-slate-600 mb-6">
            API requests are rate limited based on your subscription tier. Limits are applied <strong>per API key</strong> to ensure fair usage. There are two types of limits: <strong>request rate limits</strong> (per minute and per day) and <strong>concurrent audit limits</strong>.
          </p>

          <h2 className="text-lg font-semibold text-slate-800 mb-3">Limits by Tier</h2>
          <div className="border border-slate-200 rounded-lg overflow-hidden mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left px-4 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">Tier</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">Requests / min</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">Requests / day</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">Concurrent Audits</th>
                </tr>
              </thead>
              <tbody>
                {TIERS.map(tier => (
                  <tr key={tier.name} className="border-t border-slate-100 hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase ${tier.style}`}>{tier.name}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-700 font-medium">{tier.rpm}</td>
                    <td className="px-4 py-3 text-slate-700 font-medium">{tier.rpd}</td>
                    <td className="px-4 py-3 text-slate-700 font-medium">{tier.concurrent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-sm text-slate-500">
            Your current tier is shown in the <code className="text-xs bg-slate-100 px-1 py-0.5 rounded text-indigo-700 font-mono">GET /api/v1/info</code> response. To upgrade, visit the <a href="/pricing" className="text-indigo-600 hover:underline">pricing page</a>.
          </p>
        </div>

        {/* Rate Limit Headers */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Rate Limit Headers</h2>
          <p className="text-slate-600 mb-3">
            Every API response includes these headers so you can track your usage in real time:
          </p>
          <CodeBlock
            language="http"
            label="Response Headers"
            code={`X-RateLimit-Limit: 60
X-RateLimit-Remaining: 58
X-RateLimit-Reset: 1706540400`}
          />
          <div className="border border-slate-200 rounded-lg overflow-hidden mt-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left px-4 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">Header</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-slate-100">
                  <td className="px-4 py-3 font-mono text-xs text-indigo-600 font-medium whitespace-nowrap">X-RateLimit-Limit</td>
                  <td className="px-4 py-3 text-slate-600">Maximum requests allowed per minute for your tier</td>
                </tr>
                <tr className="border-t border-slate-100">
                  <td className="px-4 py-3 font-mono text-xs text-indigo-600 font-medium whitespace-nowrap">X-RateLimit-Remaining</td>
                  <td className="px-4 py-3 text-slate-600">Number of requests remaining in the current 60-second window</td>
                </tr>
                <tr className="border-t border-slate-100">
                  <td className="px-4 py-3 font-mono text-xs text-indigo-600 font-medium whitespace-nowrap">X-RateLimit-Reset</td>
                  <td className="px-4 py-3 text-slate-600">Unix timestamp (seconds) when the current rate limit window resets</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Handling 429 */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Handling Rate Limit Errors</h2>
          <p className="text-slate-600 mb-3">
            When you exceed your per-minute or per-day rate limit, the API returns <code className="text-sm bg-slate-100 px-1.5 py-0.5 rounded text-indigo-700 font-mono">429 Too Many Requests</code>:
          </p>
          <CodeBlock
            language="json"
            label="429 — Rate Limit Exceeded"
            code={`{
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 60,
  "message": "Rate limit exceeded. Try again in 60 seconds."
}`}
          />

          <p className="text-slate-600 mb-3 mt-4">
            The <code className="text-sm bg-slate-100 px-1.5 py-0.5 rounded text-indigo-700 font-mono">retryAfter</code> field tells you exactly how many seconds to wait before retrying.
          </p>

          <div className="flex gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-sm text-slate-900 mb-1">Best Practice: Exponential Backoff</div>
              <p className="text-sm text-slate-700">
                Implement exponential backoff with jitter when you receive a 429. Start with the <code className="text-xs bg-blue-100 px-1 py-0.5 rounded font-mono">retryAfter</code> value and double the wait on each consecutive 429. Also check <code className="text-xs bg-blue-100 px-1 py-0.5 rounded font-mono">X-RateLimit-Remaining</code> proactively to throttle requests before hitting the limit.
              </p>
            </div>
          </div>

          <h3 className="text-sm font-semibold text-slate-700 mb-2">Example: Retry with Backoff (JavaScript)</h3>
          <CodeBlock
            language="bash"
            label="JavaScript"
            code={`async function apiCall(url, options, maxRetries = 3) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch(url, options);

    if (res.status === 429) {
      const body = await res.json();
      const wait = body.retryAfter * 1000 * Math.pow(2, attempt);
      console.log(\`Rate limited. Retrying in \${wait / 1000}s...\`);
      await new Promise(r => setTimeout(r, wait));
      continue;
    }

    return res;
  }
  throw new Error('Max retries exceeded');
}`}
          />
        </div>

        {/* Concurrent Audit Limits */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Concurrent Audit Limits</h2>
          <p className="text-slate-600 mb-3">
            In addition to request rate limits, there's a limit on how many audits can be running at the same time. An audit counts as "active" when it's in any of these states: <code className="text-xs bg-slate-100 px-1 py-0.5 rounded text-indigo-700 font-mono">pending</code>, <code className="text-xs bg-slate-100 px-1 py-0.5 rounded text-indigo-700 font-mono">discovering</code>, <code className="text-xs bg-slate-100 px-1 py-0.5 rounded text-indigo-700 font-mono">ready</code>, or <code className="text-xs bg-slate-100 px-1 py-0.5 rounded text-indigo-700 font-mono">processing</code>.
          </p>
          <p className="text-slate-600 mb-3">
            If you try to create an audit when at your limit, you'll receive:
          </p>
          <CodeBlock
            language="json"
            label="429 — Audit Limit"
            code={`{
  "error": "Concurrent audit limit reached",
  "code": "AUDIT_LIMIT_REACHED",
  "limit": 3,
  "message": "Your plan allows 3 concurrent audits. Wait for existing audits to complete."
}`}
          />

          <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg mt-4">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-sm text-slate-900 mb-1">Tip</div>
              <p className="text-sm text-slate-700">
                If you need to free up a slot, you can cancel a pending audit with <code className="text-xs bg-amber-100 px-1 py-0.5 rounded font-mono">POST /api/v1/audits/:id/cancel</code>.
              </p>
            </div>
          </div>
        </div>
      </DocsLayout>
    </PublicLayout>
  );
}
