import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, Globe, Twitter, Code2, Eye } from 'lucide-react';
import { auditsApi } from '../../services/api';
import { userApi } from '../../services/api';
import { GenerateSchemaPanel } from './GenerateSchemaPanel';
import { RichSnippetPreview } from './RichSnippetPreview';

interface OgData {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  siteName?: string;
}

interface TcData {
  card?: string;
  title?: string;
  description?: string;
  image?: string;
  site?: string;
}

interface JsonLdItem {
  '@type'?: string;
  name?: string;
  headline?: string;
  description?: string;
  image?: string | { url?: string };
  author?: string | { name?: string; '@type'?: string };
  publisher?: string | { name?: string };
  price?: string;
  priceCurrency?: string;
  availability?: string;
  ratingValue?: string | number;
  reviewCount?: string | number;
  datePublished?: string;
  startDate?: string;
  endDate?: string;
  location?: string | { name?: string; address?: any };
  address?: string | { streetAddress?: string; addressLocality?: string };
  telephone?: string;
  priceRange?: string;
  mainEntity?: any[];
  aggregateRating?: { ratingValue?: number; reviewCount?: number; bestRating?: number };
  offers?: { price?: string; priceCurrency?: string; availability?: string };
  brand?: string | { name?: string };
}

interface SchemaSummary {
  hasStructuredData: boolean;
  jsonLdCount: number;
  hasOpenGraph: boolean;
  hasTwitterCard: boolean;
  detectedTypes: string[];
  pagesWithSchema: number;
  pagesWithoutSchema: number;
  totalPages: number;
  pages: Array<{
    id: string;
    url: string;
    title: string | null;
    metaDescription: string | null;
    jsonLdCount: number;
    hasOg: boolean;
    hasTc: boolean;
    detectedTypes: string[];
    detectedPageType: string | null;
    ogData: OgData | null;
    tcData: TcData | null;
    jsonLdItems: JsonLdItem[] | null;
  }>;
}

interface SchemaTabProps {
  auditId: string;
}

export function SchemaTab({ auditId }: SchemaTabProps) {
  const [summary, setSummary] = useState<SchemaSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFreeUser, setIsFreeUser] = useState(true);
  const [showGenerate, setShowGenerate] = useState(false);
  const [previewPageId, setPreviewPageId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [schemaRes, subRes] = await Promise.all([
          auditsApi.getSchemaSummary(auditId),
          userApi.getSubscription().catch(() => null),
        ]);
        setSummary(schemaRes.data as SchemaSummary);
        const tier = (subRes?.data?.subscription as any)?.tier || 'free';
        setIsFreeUser(tier === 'free');
      } catch {
        setError('Failed to load schema data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [auditId]);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-48 mb-4" />
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32 mb-2" />
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-64" />
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center text-slate-500 dark:text-slate-500">
        {error || 'No schema data available.'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Indicator */}
      {summary.hasStructuredData ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Structured Data Detected
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-500">
                {summary.pagesWithSchema} of {summary.totalPages} page{summary.totalPages !== 1 ? 's' : ''} have structured data
              </p>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">{summary.jsonLdCount}</div>
              <div className="text-xs text-slate-500 dark:text-slate-500">JSON-LD Blocks</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 text-center">
              <div className={`text-lg font-bold ${summary.hasOpenGraph ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-500'}`}>
                {summary.hasOpenGraph ? 'Yes' : 'No'}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-500">Open Graph</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 text-center">
              <div className={`text-lg font-bold ${summary.hasTwitterCard ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-500'}`}>
                {summary.hasTwitterCard ? 'Yes' : 'No'}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-500">Twitter Card</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">{summary.detectedTypes.length}</div>
              <div className="text-xs text-slate-500 dark:text-slate-500">Schema Types</div>
            </div>
          </div>

          {/* Detected Types */}
          {summary.detectedTypes.length > 0 && (
            <div className="mb-6">
              <h4 className="text-xs font-medium text-slate-500 dark:text-slate-500 uppercase tracking-wider mb-2">
                Detected Schema Types
              </h4>
              <div className="flex flex-wrap gap-2">
                {summary.detectedTypes.map(type => (
                  <span
                    key={type}
                    className="inline-flex px-2.5 py-1 text-xs font-medium rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400"
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Per-Page Breakdown */}
          <div>
            <h4 className="text-xs font-medium text-slate-500 dark:text-slate-500 uppercase tracking-wider mb-3">
              Per-Page Breakdown
            </h4>
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50">
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 dark:text-slate-500 uppercase tracking-wider">Page</th>
                    <th className="text-center px-3 py-2.5 text-xs font-medium text-slate-500 dark:text-slate-500 uppercase tracking-wider w-20">JSON-LD</th>
                    <th className="text-center px-3 py-2.5 text-xs font-medium text-slate-500 dark:text-slate-500 uppercase tracking-wider w-16">OG</th>
                    <th className="text-center px-3 py-2.5 text-xs font-medium text-slate-500 dark:text-slate-500 uppercase tracking-wider w-16">TC</th>
                    <th className="text-left px-3 py-2.5 text-xs font-medium text-slate-500 dark:text-slate-500 uppercase tracking-wider hidden sm:table-cell">Types</th>
                    <th className="text-center px-3 py-2.5 text-xs font-medium text-slate-500 dark:text-slate-500 uppercase tracking-wider w-20"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {summary.pages.map(page => {
                    const hasAny = page.jsonLdCount > 0 || page.hasOg || page.hasTc;
                    return (
                    <React.Fragment key={page.id}>
                      <tr className={`${hasAny ? '' : 'bg-amber-50/50 dark:bg-amber-900/10'}`}>
                        <td className="px-4 py-2.5">
                          <a
                            href={page.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline truncate block max-w-xs font-mono text-xs"
                          >
                            {page.url}
                          </a>
                          {page.title && (
                            <div className="text-xs text-slate-500 dark:text-slate-500 truncate max-w-xs">{page.title}</div>
                          )}
                        </td>
                        <td className="text-center px-3 py-2.5 tabular-nums">
                          {page.jsonLdCount > 0 ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">{page.jsonLdCount}</span>
                          ) : (
                            <span className="text-slate-500 dark:text-slate-500">0</span>
                          )}
                        </td>
                        <td className="text-center px-3 py-2.5">
                          {page.hasOg ? (
                            <Globe className="w-4 h-4 text-emerald-500 mx-auto" />
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600">—</span>
                          )}
                        </td>
                        <td className="text-center px-3 py-2.5">
                          {page.hasTc ? (
                            <Twitter className="w-4 h-4 text-emerald-500 mx-auto" />
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 hidden sm:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {page.detectedTypes.length > 0 ? (
                              page.detectedTypes.map(t => (
                                <span key={t} className="inline-flex px-1.5 py-0.5 text-[10px] font-medium rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-500">
                                  {t}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-slate-500 dark:text-slate-500">None</span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          {(page.jsonLdCount > 0 || page.hasOg || page.hasTc) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewPageId(previewPageId === page.id ? null : page.id);
                              }}
                              className={`inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded transition-colors ${
                                previewPageId === page.id
                                  ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                                  : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400'
                              }`}
                            >
                              <Eye className="w-3 h-3" />
                              Preview
                            </button>
                          )}
                        </td>
                      </tr>
                      {previewPageId === page.id && (
                        <tr>
                          <td colSpan={6} className="px-4 py-4 bg-slate-50/50 dark:bg-slate-800/30">
                            <RichSnippetPreview
                              url={page.url}
                              title={page.title}
                              metaDescription={page.metaDescription}
                              detectedTypes={page.detectedTypes}
                              detectedPageType={page.detectedPageType}
                              hasOg={page.hasOg}
                              hasBreadcrumb={page.detectedTypes.includes('BreadcrumbList')}
                              ogData={page.ogData}
                              jsonLdItems={page.jsonLdItems}
                            />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* No Schema State */
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                No Structured Data Found
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-500">
                None of the {summary.totalPages} crawled page{summary.totalPages !== 1 ? 's' : ''} contain structured data
              </p>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 mb-4">
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Why structured data matters
            </h4>
            <ul className="text-sm text-slate-600 dark:text-slate-500 space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 mt-0.5">&#8226;</span>
                Enables rich results in Google Search (stars, FAQs, breadcrumbs)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 mt-0.5">&#8226;</span>
                Improves click-through rates from search results
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 mt-0.5">&#8226;</span>
                Helps search engines understand your page content and context
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 mt-0.5">&#8226;</span>
                Powers knowledge graph entries and social media previews
              </li>
            </ul>
          </div>

          {!showGenerate && (
            <button
              onClick={() => setShowGenerate(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Code2 className="w-4 h-4" />
              Generate Structured Data
            </button>
          )}
        </div>
      )}

      {/* Generate Panel - always available */}
      {(showGenerate || summary.hasStructuredData) && summary.pages.length > 0 && (
        <GenerateSchemaPanel
          auditId={auditId}
          pages={summary.pages.map(p => ({
            id: p.id,
            url: p.url,
            title: p.title,
            detectedPageType: p.detectedPageType,
          }))}
          isFreeUser={isFreeUser}
        />
      )}
    </div>
  );
}
