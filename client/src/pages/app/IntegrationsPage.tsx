import { Link } from 'react-router-dom';
import { Plug, Copy, Check, ExternalLink, Terminal } from 'lucide-react';
import { useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
      title="Copy to clipboard"
    >
      {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-slate-400" />}
    </button>
  );
}

const MCP_CONFIG = `{
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
        "KRITANO_API_KEY": "Bearer YOUR_API_KEY_HERE"
      }
    }
  }
}`;

const TOOL_CATEGORIES = [
  { name: 'Audits', count: 6, description: 'Start, monitor, cancel, and compare audits' },
  { name: 'Findings', count: 5, description: 'Search, filter, and analyse audit findings' },
  { name: 'Sites', count: 4, description: 'Manage sites and view score history' },
  { name: 'Analytics', count: 3, description: 'Score trends and improvement tracking' },
  { name: 'Compliance', count: 2, description: 'EN 301 549 compliance reports' },
  { name: 'Exports', count: 3, description: 'PDF, CSV, and JSON exports' },
  { name: 'Search Console', count: 3, description: 'GSC data and optimisation opportunities' },
];

export default function IntegrationsPage() {
  return (
    <DashboardLayout>
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Plug className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Integrations</h1>
        </div>
        <p className="text-slate-600 dark:text-slate-400">
          Connect Kritano to your development tools.
        </p>
      </div>

      {/* MCP Card */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm overflow-hidden mb-6">
        {/* MCP Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                <Terminal className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Claude Code (MCP)</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Run audits and query findings from your terminal</p>
              </div>
            </div>
            <Link
              to="/docs/mcp"
              className="flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
            >
              Full docs <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* What you can do */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">What you can do</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            The MCP integration gives Claude Code direct access to 26 Kritano tools. Ask it to audit a site, show findings, compare scores, or export reports -- all in natural language.
          </p>
          <div className="grid sm:grid-cols-2 gap-2">
            {TOOL_CATEGORIES.map(cat => (
              <div key={cat.name} className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded">{cat.count}</span>
                <div>
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{cat.name}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 ml-1.5">{cat.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Setup */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">Quick setup</h3>

          <div className="space-y-4">
            {/* Step 1 */}
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-1">Create an API key</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                  Go to{' '}
                  <Link to="/app/settings/api-keys" className="text-indigo-600 dark:text-indigo-400 underline underline-offset-2 decoration-indigo-300 hover:decoration-indigo-600">
                    Settings &rarr; API Keys
                  </Link>
                  {' '}and create a key with the scopes you need. Copy the key -- it's only shown once.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-1">Set the environment variable</p>
                <div className="flex items-center gap-2 bg-slate-950 rounded-lg px-4 py-2.5 font-mono text-sm text-slate-300 mt-1">
                  <span className="flex-1 overflow-x-auto whitespace-nowrap">export KRITANO_API_KEY="kt_live_your_key_here"</span>
                  <CopyButton text='export KRITANO_API_KEY="kt_live_your_key_here"' />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Add this to your ~/.zshrc or ~/.bashrc</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-1">Add to your project</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                  Create a <code className="text-xs bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-indigo-700 dark:text-indigo-400 font-mono">.mcp.json</code> file in your project root:
                </p>
                <div className="relative bg-slate-950 rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
                    <span className="text-xs text-slate-400 font-mono">.mcp.json</span>
                    <CopyButton text={MCP_CONFIG} />
                  </div>
                  <pre className="p-4 text-sm text-slate-300 font-mono overflow-x-auto whitespace-pre">{MCP_CONFIG}</pre>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Replace <code className="text-xs bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded font-mono">YOUR_API_KEY_HERE</code> with your actual key. Remember to add <code className="text-xs bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded font-mono">.mcp.json</code> to <code className="text-xs bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded font-mono">.gitignore</code>.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold">4</div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-1">Restart Claude Code</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Close and reopen Claude Code. Type <code className="text-xs bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-indigo-700 dark:text-indigo-400 font-mono">/mcp</code> to verify the connection shows as <span className="text-emerald-600 font-medium">connected</span>.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Try it */}
        <div className="p-6 bg-slate-50 dark:bg-slate-800/50">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">Try it out</h3>
          <div className="grid sm:grid-cols-2 gap-2">
            {[
              'List all my sites',
              'Start an audit on example.com',
              'Show critical findings from the last audit',
              'Export findings as CSV',
            ].map(example => (
              <div key={example} className="flex items-center gap-2 p-2.5 bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg">
                <span className="text-indigo-500 font-mono text-xs">&gt;</span>
                <span className="text-sm text-slate-600 dark:text-slate-300 italic">{example}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
            Having trouble? See the{' '}
            <Link to="/docs/mcp" className="text-indigo-600 dark:text-indigo-400 underline underline-offset-2">full documentation</Link>
            {' '}for troubleshooting tips.
          </p>
        </div>
      </div>

      {/* More integrations coming */}
      <div className="text-center py-8">
        <p className="text-sm text-slate-400 dark:text-slate-500">More integrations coming soon</p>
      </div>
    </div>
    </DashboardLayout>
  );
}
