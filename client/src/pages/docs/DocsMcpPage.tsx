import { Link } from 'react-router-dom';
import { PublicLayout } from '../../components/layout/PublicLayout';
import PageSeo from '../../components/seo/PageSeo';
import DocsLayout from '../../components/docs/DocsLayout';
import CodeBlock from '../../components/docs/CodeBlock';
import { Info, AlertTriangle } from 'lucide-react';

const TOOL_GROUPS = [
  {
    category: 'Audits',
    tools: [
      { name: 'start_audit', description: 'Start a new website audit' },
      { name: 'get_audit', description: 'Get audit status and scores' },
      { name: 'get_audit_progress', description: 'Real-time progress tracking' },
      { name: 'list_audits', description: 'Browse recent audits' },
      { name: 'cancel_audit', description: 'Cancel a running audit' },
      { name: 'compare_audits', description: 'Side-by-side audit comparison' },
    ],
  },
  {
    category: 'Findings',
    tools: [
      { name: 'list_findings', description: 'Filter findings by severity, category, WCAG criterion' },
      { name: 'get_finding_detail', description: 'Full detail with code snippets and fix suggestions' },
      { name: 'search_findings', description: 'Full-text search across findings' },
      { name: 'get_findings_summary', description: 'Aggregated stats and top issues' },
      { name: 'get_wcag_coverage', description: 'WCAG criterion-level coverage report' },
    ],
  },
  {
    category: 'Sites',
    tools: [
      { name: 'list_sites', description: 'List all sites with verification status' },
      { name: 'get_site', description: 'Site details with latest audit scores' },
      { name: 'create_site', description: 'Add a new site' },
      { name: 'get_site_history', description: 'Audit score trends over time' },
    ],
  },
  {
    category: 'Analytics',
    tools: [
      { name: 'get_score_trends', description: 'Historical score progression (7d to 365d)' },
      { name: 'get_top_issues', description: 'Most common issues across audits' },
      { name: 'get_improvement_summary', description: 'Regressions and improvements between runs' },
    ],
  },
  {
    category: 'Compliance',
    tools: [
      { name: 'get_compliance_status', description: 'EN 301 549 compliance passport' },
      { name: 'get_clause_detail', description: 'Specific clause mapping to WCAG findings' },
    ],
  },
  {
    category: 'Exports',
    tools: [
      { name: 'generate_pdf_report', description: 'PDF export with download URL' },
      { name: 'export_findings_csv', description: 'CSV export' },
      { name: 'export_findings_json', description: 'Structured JSON export' },
    ],
  },
  {
    category: 'Google Search Console',
    tools: [
      { name: 'get_gsc_overview', description: 'Top queries, pages, and CTR' },
      { name: 'get_gsc_opportunities', description: 'CTR optimisation targets' },
      { name: 'get_gsc_cannibalisations', description: 'Keyword competition detection' },
    ],
  },
];

export default function DocsMcpPage() {
  return (
    <PublicLayout>
      <PageSeo
        title="MCP Integration - API Docs"
        description="Connect Kritano to Claude Code via MCP. Start audits, query findings, and export reports directly from your terminal."
        path="/docs/mcp"
        useOverrides={true}
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://kritano.com' },
            { '@type': 'ListItem', position: 2, name: 'API Docs', item: 'https://kritano.com/docs' },
            { '@type': 'ListItem', position: 3, name: 'MCP Integration', item: 'https://kritano.com/docs/mcp' },
          ],
        }}
      />
      <DocsLayout>
        {/* Overview */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-6 mb-6">
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white mb-2">MCP Integration</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            The Kritano MCP server lets you run audits, query findings, and export reports directly from{' '}
            <a href="https://claude.ai/claude-code" target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 font-medium underline underline-offset-2 decoration-indigo-300 hover:decoration-indigo-600">Claude Code</a>.
            Instead of switching between your terminal and the Kritano dashboard, you can ask Claude to audit a site, summarise findings, or compare scores -- all in natural language.
          </p>
          <p className="text-slate-600 dark:text-slate-400">
            The integration uses the <a href="https://modelcontextprotocol.io" target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 font-medium underline underline-offset-2 decoration-indigo-300 hover:decoration-indigo-600">Model Context Protocol (MCP)</a>, an open standard for connecting AI assistants to external tools.
            Kritano exposes 27 tools across audits, findings, analytics, compliance, and exports.
          </p>
        </div>

        {/* Prerequisites */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-3">Prerequisites</h2>
          <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
            <li className="flex items-start gap-2">
              <span className="text-indigo-500 mt-0.5">1.</span>
              <span>
                <strong className="text-slate-900 dark:text-white">Claude Code</strong> installed and running.
                Install via <code className="text-xs bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-indigo-700 dark:text-indigo-400 font-mono">npm install -g @anthropic-ai/claude-code</code>
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-500 mt-0.5">2.</span>
              <span>
                <strong className="text-slate-900 dark:text-white">Node.js 18+</strong> (required by the MCP proxy).
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-500 mt-0.5">3.</span>
              <span>
                <strong className="text-slate-900 dark:text-white">Kritano API key</strong> with the scopes you need.
                Create one from{' '}
                <Link to="/app/settings/api-keys" className="text-indigo-600 dark:text-indigo-400 font-medium underline underline-offset-2 decoration-indigo-300 hover:decoration-indigo-600">Settings &rarr; API Keys</Link>.
              </span>
            </li>
          </ul>

          <div className="flex gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-lg mt-4">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-sm text-slate-900 dark:text-white mb-1">Keep your API key secure</div>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                Store your API key in an environment variable rather than hardcoding it in config files. If a config file containing your key is committed to git, revoke the key immediately and generate a new one.
              </p>
            </div>
          </div>
        </div>

        {/* Setup */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-3">Setup</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Claude Code connects to Kritano via a lightweight proxy that bridges the local stdio transport with Kritano's remote SSE endpoint. This avoids OAuth discovery issues that can occur with direct HTTP connections.
          </p>

          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 mt-6">Step 1: Set your API key as an environment variable</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
            Add this to your shell profile (<code className="text-xs bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-indigo-700 dark:text-indigo-400 font-mono">~/.zshrc</code>, <code className="text-xs bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-indigo-700 dark:text-indigo-400 font-mono">~/.bashrc</code>, etc.):
          </p>
          <CodeBlock
            language="bash"
            label="Shell Profile"
            code='export KRITANO_API_KEY="kt_live_your_key_here"'
          />

          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 mt-6">Step 2: Add the MCP server to your project</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
            Create a <code className="text-xs bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-indigo-700 dark:text-indigo-400 font-mono">.mcp.json</code> file in your project root:
          </p>
          <CodeBlock
            language="json"
            label=".mcp.json"
            code={`{
  "mcpServers": {
    "kritano": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://kritano.com/mcp/sse",
        "--header",
        "Authorization:\${KRITANO_API_KEY}"
      ],
      "env": {
        "KRITANO_API_KEY": "Bearer \${KRITANO_API_KEY}"
      }
    }
  }
}`}
          />

          <div className="flex gap-3 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30 rounded-lg mt-4">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-sm text-slate-900 dark:text-white mb-1">Why mcp-remote?</div>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                Claude Code's built-in HTTP and SSE transports use OAuth discovery, which requires additional server-side setup. The <code className="text-xs bg-blue-100 dark:bg-blue-800/30 px-1 py-0.5 rounded font-mono">mcp-remote</code> package acts as a local stdio proxy that connects to the remote SSE endpoint with your Bearer token directly -- no OAuth needed.
              </p>
            </div>
          </div>

          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 mt-6">Step 3: Add .mcp.json to .gitignore</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
            Prevent your API key from being committed:
          </p>
          <CodeBlock
            language="bash"
            label=".gitignore"
            code=".mcp.json"
          />

          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 mt-6">Step 4: Restart Claude Code</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Close and reopen Claude Code (or start a new session) so it picks up the MCP configuration.
          </p>
        </div>

        {/* Verification */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-3">Verification</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Once Claude Code restarts, type <code className="text-xs bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-indigo-700 dark:text-indigo-400 font-mono">/mcp</code> to check the connection status:
          </p>
          <div className="bg-slate-950 rounded-lg p-4 font-mono text-sm text-slate-300 mb-4">
            <div className="text-slate-500 mb-2"># Expected output:</div>
            <div>kritano <span className="text-emerald-400">connected</span></div>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            You can also verify by asking Claude a question like <em>"list my sites"</em> or <em>"what tools do you have from Kritano?"</em>
          </p>
        </div>

        {/* Available Tools */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Available Tools</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            The Kritano MCP server exposes {TOOL_GROUPS.reduce((acc, g) => acc + g.tools.length, 0)} tools across {TOOL_GROUPS.length} categories. All tools are prefixed with <code className="text-xs bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-indigo-700 dark:text-indigo-400 font-mono">mcp__kritano__</code> in Claude Code.
          </p>

          <div className="space-y-6">
            {TOOL_GROUPS.map(group => (
              <div key={group.category}>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{group.category}</h3>
                <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
                  <table className="w-full text-sm">
                    <tbody>
                      {group.tools.map((tool, i) => (
                        <tr key={tool.name} className={i % 2 === 0 ? 'bg-slate-50 dark:bg-slate-700/30' : 'bg-white dark:bg-slate-800'}>
                          <td className="px-3 py-2 font-mono text-xs text-indigo-700 dark:text-indigo-400 whitespace-nowrap">{tool.name}</td>
                          <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{tool.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Usage Examples */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-3">Usage Examples</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Once connected, you can interact with Kritano in natural language. Here are some examples:
          </p>

          <div className="space-y-3">
            {[
              'List all my sites and their latest scores',
              'Start an audit on https://example.com',
              'Show me the critical and serious findings from the last audit',
              'Compare the last two audits for example.com',
              'What WCAG criteria are we failing on?',
              'Export the findings as a CSV',
              'Show me score trends for the last 90 days',
            ].map(example => (
              <div key={example} className="flex items-start gap-2 p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
                <span className="text-indigo-500 font-mono text-xs mt-0.5">&gt;</span>
                <span className="text-sm text-slate-700 dark:text-slate-300 italic">{example}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Scopes */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-3">API Key Scopes</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            MCP tools require the same scopes as the corresponding REST API endpoints. For full access, enable all scopes when creating your key:
          </p>
          <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-700/50">
                  <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Scope</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Required For</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { scope: 'audits:read', desc: 'list_audits, get_audit, get_audit_progress, compare_audits' },
                  { scope: 'audits:write', desc: 'start_audit, cancel_audit, create_site' },
                  { scope: 'findings:read', desc: 'list_findings, get_finding_detail, search_findings, get_findings_summary, get_wcag_coverage' },
                  { scope: 'exports:read', desc: 'generate_pdf_report, export_findings_csv, export_findings_json' },
                ].map((row, i) => (
                  <tr key={row.scope} className={i % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-700/30'}>
                    <td className="px-3 py-2 font-mono text-xs text-indigo-700 dark:text-indigo-400 whitespace-nowrap">{row.scope}</td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-400 font-mono text-xs">{row.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Troubleshooting */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Troubleshooting</h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">"Needs authentication" or OAuth 405 error</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                This happens when Claude Code tries to use its built-in OAuth discovery with <code className="text-xs bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded font-mono">type: "http"</code> or <code className="text-xs bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded font-mono">type: "sse"</code> transports. The fix is to use the stdio proxy approach described above instead.
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Also check that your <code className="text-xs bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded font-mono">~/.claude.json</code> file doesn't have a stale MCP server entry for "kritano" under your project path. If it does, remove the <code className="text-xs bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded font-mono">mcpServers.kritano</code> entry from there and restart Claude Code.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Tools not appearing after restart</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                Check that <code className="text-xs bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded font-mono">"kritano"</code> is in the <code className="text-xs bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded font-mono">enabledMcpjsonServers</code> array in <code className="text-xs bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded font-mono">.claude/settings.local.json</code>. If it's missing, add it or run <code className="text-xs bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded font-mono">/mcp</code> in Claude Code and enable the server from the dialog.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Rate limit exceeded</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                MCP tools share the same rate limits as the REST API. Your limit is determined by your plan tier. Check your current limits on the{' '}
                <Link to="/docs/rate-limits" className="text-indigo-600 dark:text-indigo-400 font-medium underline underline-offset-2 decoration-indigo-300 hover:decoration-indigo-600">Rate Limits</Link> page. If you're hitting limits during normal usage, contact support to review your tier.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">MCP disconnects after server restart</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                The SSE connection drops when the Kritano server restarts (e.g. during deployments). Restart Claude Code to reconnect, or start a new conversation.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">"Authentication required" when calling tools</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                This means the Bearer token isn't reaching the server. Check that your <code className="text-xs bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded font-mono">KRITANO_API_KEY</code> environment variable is set and that the <code className="text-xs bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded font-mono">--header</code> argument in your config matches the format shown above.
              </p>
            </div>
          </div>
        </div>
      </DocsLayout>
    </PublicLayout>
  );
}
