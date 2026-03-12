import { useState } from 'react';
import { Copy, Check, Code2, Lock, Info, ChevronDown, ChevronRight, FileCode } from 'lucide-react';
import { auditsApi } from '../../services/api';
import { Button } from '../ui/Button';

const SCHEMA_DESCRIPTIONS: Record<string, string> = {
  Organization: 'Identifies who owns and operates this website',
  WebSite: 'Enables sitelinks search box in Google results',
  Article: 'Rich article results with author, date, and images',
  NewsArticle: 'Rich news results in Google News and Top Stories',
  Product: 'Rich product results with pricing and availability',
  FAQPage: 'Expandable FAQ rich results in search',
  WebPage: 'Helps search engines understand the page structure',
  Event: 'Rich event results with dates, venue, and tickets',
  LocalBusiness: 'Local business panel with address, hours, and contact',
  Recipe: 'Rich recipe results with ratings, cook time, and nutrition',
};

interface SchemaPage {
  id: string;
  url: string;
  title: string | null;
  detectedPageType: string | null;
}

interface GeneratedPage {
  pageId: string;
  url: string;
  title: string | null;
  pageType: string;
  jsonLd: string;
}

interface GenerateSchemaPanelProps {
  auditId: string;
  pages: SchemaPage[];
  isFreeUser: boolean;
}

function extractSchemaTypes(jsonLd: string): string[] {
  try {
    const match = jsonLd.match(/<script type="application\/ld\+json">\n([\s\S]*?)\n<\/script>/);
    if (!match) return [];
    const parsed = JSON.parse(match[1]);
    if (parsed['@graph']) {
      return parsed['@graph'].map((item: any) => item['@type']).filter(Boolean);
    }
    return parsed['@type'] ? [parsed['@type']] : [];
  } catch {
    return [];
  }
}

function CopyButton({ text, className = '' }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={`p-1.5 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors ${className}`}
      title="Copy to clipboard"
    >
      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
    </button>
  );
}

function SchemaTypeInfo({ types }: { types: string[] }) {
  if (types.length === 0) return null;
  return (
    <div className="mb-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
      <div className="flex items-start gap-2">
        <Info className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
        <div className="space-y-1">
          {types.map(type => (
            <div key={type} className="flex items-center gap-2 text-xs">
              <span className="font-medium text-slate-700 dark:text-slate-300">{type}</span>
              <span className="text-slate-500 dark:text-slate-400">
                — {SCHEMA_DESCRIPTIONS[type] || 'Structured data markup'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CodeBlock({ code }: { code: string }) {
  return (
    <div className="relative">
      <CopyButton text={code} className="absolute top-3 right-3 z-10" />
      <pre className="bg-slate-900 rounded-lg p-4 pr-12 overflow-x-auto text-sm text-slate-300 font-mono leading-relaxed max-h-80 overflow-y-auto">
        {code}
      </pre>
    </div>
  );
}

export function GenerateSchemaPanel({ auditId, pages, isFreeUser }: GenerateSchemaPanelProps) {
  const [generatedPages, setGeneratedPages] = useState<GeneratedPage[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedPageId, setExpandedPageId] = useState<string | null>(null);

  const handleGenerateAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await auditsApi.generateSchemaAll(auditId);
      setGeneratedPages(res.data.pages);
      // Auto-expand first page
      if (res.data.pages.length > 0) {
        setExpandedPageId(res.data.pages[0].pageId);
      }
    } catch (err: any) {
      if (err.response?.data?.code === 'TIER_REQUIRED') {
        setError('Schema generation requires Starter tier or above.');
      } else {
        setError('Failed to generate schema. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (isFreeUser) {
    return (
      <div className="mt-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-6 text-center">
        <Lock className="w-8 h-8 text-slate-400 dark:text-slate-500 mx-auto mb-3" />
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Generate Structured Data
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Upgrade to Starter to automatically generate JSON-LD structured data for your pages.
        </p>
        <Button variant="primary" size="sm" onClick={() => window.location.href = '/settings/billing'}>
          Upgrade to Starter
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Code2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Generate Structured Data
          </h3>
        </div>
        {pages.length > 0 && (
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {pages.length} page{pages.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {!generatedPages && (
        <>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Generate JSON-LD schema for all {pages.length} page{pages.length !== 1 ? 's' : ''}.
            Each page gets the appropriate schema type with cross-references linking back to your homepage.
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={handleGenerateAll}
            isLoading={loading}
            disabled={pages.length === 0}
          >
            <FileCode className="w-4 h-4 mr-1.5" />
            Generate for All Pages
          </Button>
        </>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {generatedPages && generatedPages.length > 0 && (
        <div className="space-y-2">
          {generatedPages.map((gp) => {
            const isExpanded = expandedPageId === gp.pageId;
            const types = extractSchemaTypes(gp.jsonLd);
            const displayPath = (() => {
              try {
                const u = new URL(gp.url);
                return u.pathname === '/' ? '/ (homepage)' : u.pathname;
              } catch {
                return gp.url;
              }
            })();

            return (
              <div key={gp.pageId} className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedPageId(isExpanded ? null : gp.pageId)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  {isExpanded
                    ? <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    : <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  }
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {gp.title || displayPath}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate">
                      {displayPath}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {types.map(t => (
                      <span
                        key={t}
                        className="inline-flex px-1.5 py-0.5 text-[10px] font-medium rounded bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-slate-100 dark:border-slate-800 pt-3">
                    <SchemaTypeInfo types={types} />
                    <CodeBlock code={gp.jsonLd} />
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      Add this to <code className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-xs">&lt;head&gt;</code> of <span className="font-medium">{displayPath}</span>.
                      Replace placeholder comments with your actual data.
                    </p>
                  </div>
                )}
              </div>
            );
          })}

          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setGeneratedPages(null);
                setExpandedPageId(null);
              }}
            >
              Regenerate
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
