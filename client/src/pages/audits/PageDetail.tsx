import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Alert } from '../../components/ui/Alert';
import { ContentAnalysisPanel } from '../../components/audits/ContentAnalysisPanel';
import { FixSnippetAccordion } from '../../components/audit';
import { KeywordAnalysisPanel } from '../../components/audits/KeywordAnalysisPanel';
import { auditsApi } from '../../services/api';
import type { AuditPage, Finding, FindingCategory, Severity, FindingsSummary } from '../../types/audit.types';
import { formatDate, formatBytes } from '../../utils/format';
import { severityColors, categoryColors, categoryLabels } from '../../utils/constants';
import {
  Image, FileText, Video, Music, Type, Palette, FileCode, File,
  ChevronDown, ChevronRight, ExternalLink,
} from 'lucide-react';
import type { AuditAsset } from '../../types/audit.types';

function ScoreCircle({ score, label }: { score: number | null; label: string }) {
  const getScoreColor = (s: number | null) => {
    if (s === null) return { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-500 dark:text-slate-400', ring: 'ring-slate-200 dark:ring-slate-700' };
    if (s >= 90) return { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400', ring: 'ring-emerald-200 dark:ring-emerald-800' };
    if (s >= 70) return { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400', ring: 'ring-amber-200 dark:ring-amber-800' };
    if (s >= 50) return { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-600 dark:text-orange-400', ring: 'ring-orange-200 dark:ring-orange-800' };
    return { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600 dark:text-red-400', ring: 'ring-red-200 dark:ring-red-800' };
  };

  const colors = getScoreColor(score);

  return (
    <div className="text-center">
      <div className={`w-16 h-16 rounded-full ${colors.bg} ${colors.ring} ring-2 flex items-center justify-center mx-auto`}>
        <span className={`text-xl font-bold ${colors.text}`}>{score ?? '-'}</span>
      </div>
      <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">{label}</div>
    </div>
  );
}

export default function PageDetailPage() {
  const { id: auditId, pageId } = useParams<{ id: string; pageId: string }>();
  const [page, setPage] = useState<AuditPage | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [summary, setSummary] = useState<FindingsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageAssets, setPageAssets] = useState<AuditAsset[]>([]);
  const [assetsExpanded, setAssetsExpanded] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['seo', 'accessibility', 'security', 'performance', 'content', 'content-eeat', 'content-aeo', 'structured-data']));
  const [categoryFilter, setCategoryFilter] = useState<FindingCategory | null>(null);
  const [severityFilter, setSeverityFilter] = useState<Severity | null>(null);

  // Computed filtered findings
  const filteredFindings = findings.filter(f => {
    if (categoryFilter && f.category !== categoryFilter) return false;
    if (severityFilter && f.severity !== severityFilter) return false;
    return true;
  });

  const filteredFindingsByCategory: Record<string, Finding[]> = {};
  for (const finding of filteredFindings) {
    if (!filteredFindingsByCategory[finding.category]) {
      filteredFindingsByCategory[finding.category] = [];
    }
    filteredFindingsByCategory[finding.category].push(finding);
  }

  const categoriesToShow: FindingCategory[] = categoryFilter
    ? [categoryFilter]
    : (['seo', 'accessibility', 'security', 'performance', 'content', 'content-eeat', 'content-aeo', 'structured-data'] as FindingCategory[]);

  // Compute counts for filter buttons (category counts respect severity filter, severity counts respect category filter)
  const getCategoryCount = (cat: FindingCategory) => {
    return findings.filter(f => f.category === cat && (!severityFilter || f.severity === severityFilter)).length;
  };

  const getSeverityCount = (sev: Severity) => {
    return findings.filter(f => f.severity === sev && (!categoryFilter || f.category === categoryFilter)).length;
  };

  const fetchPageData = useCallback(async () => {
    if (!auditId || !pageId) return;
    try {
      setLoading(true);
      setError(null);
      const [response, assetsRes] = await Promise.all([
        auditsApi.getPage(auditId, pageId),
        auditsApi.getPageAssets(auditId, pageId).catch(() => null),
      ]);
      setPage(response.data.page);
      setFindings(response.data.findings);
      setSummary(response.data.summary);
      if (assetsRes?.data?.assets) {
        setPageAssets(assetsRes.data.assets as unknown as AuditAsset[]);
      }
    } catch (err) {
      setError('Failed to load page details.');
      console.error('Failed to fetch page:', err);
    } finally {
      setLoading(false);
    }
  }, [auditId, pageId]);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <svg className="animate-spin h-8 w-8 text-indigo-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      </DashboardLayout>
    );
  }

  if (!page) {
    return (
      <DashboardLayout>
        <Alert variant="error">
          Page not found. <Link to={`/app/audits/${auditId}`} className="underline">Return to audit</Link>
        </Alert>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Helmet><title>Page Details | Kritano</title></Helmet>
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400 mb-4">
        <Link to="/app/audits" className="hover:text-slate-700 dark:hover:text-slate-300">Audits</Link>
        <span>/</span>
        <Link to={`/app/audits/${auditId}`} className="hover:text-slate-700 dark:hover:text-slate-300">Audit Details</Link>
        <span>/</span>
        <span className="text-slate-900 dark:text-white truncate max-w-xs">{page.title || page.url}</span>
      </div>

      {error && (
        <Alert variant="error" className="mb-6">{error}</Alert>
      )}

      {/* Page Header */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white truncate">{page.title || 'Untitled Page'}</h1>
            <a
              href={page.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center mt-1"
            >
              {page.url}
              <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
          <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
            page.crawl_status === 'crawled' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300' :
            page.crawl_status === 'failed' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' :
            'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300'
          }`}>
            {page.crawl_status}
          </span>
        </div>

        {/* Scores (R3: flex-wrap for mobile responsiveness) */}
        <div className="flex flex-wrap justify-center gap-4 sm:gap-8 mt-6 pt-6 border-t border-slate-100 dark:border-slate-700/50">
          <ScoreCircle score={page.seo_score} label="SEO" />
          <ScoreCircle score={page.accessibility_score} label="Accessibility" />
          <ScoreCircle score={page.security_score} label="Security" />
          <ScoreCircle score={page.performance_score} label="Performance" />
        </div>
      </div>

      {/* Page Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {/* Technical Info */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-4">Technical Information</h3>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-slate-500 dark:text-slate-400">Status Code</dt>
              <dd className={`text-sm font-medium ${
                page.status_code && page.status_code >= 200 && page.status_code < 300 ? 'text-emerald-600' :
                page.status_code && page.status_code >= 300 && page.status_code < 400 ? 'text-amber-600' :
                page.status_code && page.status_code >= 400 ? 'text-red-600' : 'text-slate-900'
              }`}>{page.status_code || '-'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-slate-500 dark:text-slate-400">Content Type</dt>
              <dd className="text-sm font-medium text-slate-900 dark:text-white">{page.content_type || '-'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-slate-500 dark:text-slate-400">Page Size</dt>
              <dd className="text-sm font-medium text-slate-900 dark:text-white">{formatBytes(page.page_size_bytes)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-slate-500 dark:text-slate-400">Response Time</dt>
              <dd className={`text-sm font-medium ${
                page.response_time_ms && page.response_time_ms > 3000 ? 'text-red-600' :
                page.response_time_ms && page.response_time_ms > 1000 ? 'text-amber-600' : 'text-emerald-600'
              }`}>{page.response_time_ms ? `${page.response_time_ms}ms` : '-'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-slate-500 dark:text-slate-400">Depth</dt>
              <dd className="text-sm font-medium text-slate-900 dark:text-white">{page.depth}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-slate-500 dark:text-slate-400">Crawled At</dt>
              <dd className="text-sm font-medium text-slate-900 dark:text-white">{formatDate(page.crawled_at)}</dd>
            </div>
          </dl>
        </div>

        {/* SEO Info */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-4">SEO Information</h3>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm text-slate-500 dark:text-slate-400">Title</dt>
              <dd className="text-sm font-medium text-slate-900 mt-1">{page.title || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500 dark:text-slate-400">Meta Description</dt>
              <dd className="text-sm text-slate-700 dark:text-slate-300 mt-1 line-clamp-3">{page.meta_description || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500 dark:text-slate-400">H1</dt>
              <dd className="text-sm font-medium text-slate-900 mt-1">{page.h1_text || '-'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-slate-500 dark:text-slate-400">Word Count</dt>
              <dd className="text-sm font-medium text-slate-900 dark:text-white">{page.word_count ?? '-'}</dd>
            </div>
            {page.canonical_url && (
              <div>
                <dt className="text-sm text-slate-500 dark:text-slate-400">Canonical URL</dt>
                <dd className="text-sm text-slate-700 dark:text-slate-300 mt-1 truncate">{page.canonical_url}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Issues Summary */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-4">Issues Summary</h3>
          {summary && (
            <>
              <div className="text-3xl font-bold text-slate-900 dark:text-white mb-4">{summary.total} issues</div>
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">By Severity</h4>
                {(['critical', 'serious', 'moderate', 'minor', 'info'] as Severity[]).map(sev => (
                  summary.bySeverity[sev] > 0 && (
                    <div key={sev} className="flex justify-between items-center">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${severityColors[sev]}`}>
                        {sev}
                      </span>
                      <span className="text-sm font-medium text-slate-900 dark:text-white tabular-nums">{summary.bySeverity[sev]}</span>
                    </div>
                  )
                ))}
              </div>
              <div className="mt-4 space-y-2">
                <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">By Category</h4>
                {(['seo', 'accessibility', 'security', 'performance', 'content'] as FindingCategory[]).map(cat => (
                  summary.byCategory[cat] > 0 && (
                    <div key={cat} className="flex justify-between items-center">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${categoryColors[cat]}`}>
                        {categoryLabels[cat]}
                      </span>
                      <span className="text-sm font-medium text-slate-900 dark:text-white">{summary.byCategory[cat]}</span>
                    </div>
                  )
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Keyword Analysis Panel */}
      {page.keyword_data && (
        <div className="mb-6">
          <KeywordAnalysisPanel keywordData={page.keyword_data} />
        </div>
      )}

      {/* Content Analysis Panel */}
      {page.content_score !== null && (
        <div className="mb-6">
          <ContentAnalysisPanel
            metrics={{
              content_quality_score: page.content_quality_score,
              content_readability_score: page.content_readability_score,
              content_structure_score: page.content_structure_score,
              content_engagement_score: page.content_engagement_score,
              eeat_score: page.eeat_score,
              eeat_experience_score: page.eeat_experience_score,
              eeat_expertise_score: page.eeat_expertise_score,
              eeat_authoritativeness_score: page.eeat_authoritativeness_score,
              eeat_trustworthiness_score: page.eeat_trustworthiness_score,
              has_author_bio: page.has_author_bio,
              has_author_credentials: page.has_author_credentials,
              citation_count: page.citation_count,
              has_contact_info: page.has_contact_info,
              has_privacy_policy: page.has_privacy_policy,
              has_terms_of_service: page.has_terms_of_service,
              eeat_tier: page.eeat_tier,
              eeat_evidence: page.eeat_evidence,
              aeo_score: page.aeo_score,
              aeo_nugget_score: page.aeo_nugget_score,
              aeo_factual_density_score: page.aeo_factual_density_score,
              aeo_source_authority_score: page.aeo_source_authority_score,
              aeo_tier: page.aeo_tier,
              aeo_nuggets: page.aeo_nuggets,
              flesch_kincaid_grade: page.flesch_kincaid_grade,
              flesch_reading_ease: page.flesch_reading_ease,
              word_count: page.word_count,
              reading_time_minutes: page.reading_time_minutes,
              detected_content_type: page.detected_content_type,
            }}
            contentScore={page.content_score}
            eeatFindings={findings.filter(f => f.category === 'content-eeat').map(f => ({
              ruleId: f.rule_id,
              ruleName: f.rule_name,
              severity: f.severity,
              message: f.message,
              description: f.description,
              recommendation: f.recommendation,
            }))}
            aeoFindings={findings.filter(f => f.category === 'content-aeo').map(f => ({
              ruleId: f.rule_id,
              ruleName: f.rule_name,
              severity: f.severity,
              message: f.message,
              description: f.description,
              recommendation: f.recommendation,
            }))}
          />
        </div>
      )}

      {/* Files & Assets Section */}
      {pageAssets.length > 0 && (
        <div className="mb-6">
          <button
            onClick={() => setAssetsExpanded(!assetsExpanded)}
            className="flex items-center gap-2 w-full text-left bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            {assetsExpanded ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
            <File className="w-4 h-4 text-indigo-500" />
            <span className="text-sm font-medium text-slate-900 dark:text-white">Files & Assets</span>
            <span className="ml-auto text-xs text-slate-500 dark:text-slate-400">{pageAssets.length} file{pageAssets.length !== 1 ? 's' : ''}</span>
          </button>
          {assetsExpanded && (
            <div className="mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/50">
                    <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 px-4 py-2">Type</th>
                    <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 px-4 py-2">File</th>
                    <th className="text-right text-xs font-medium text-slate-500 dark:text-slate-400 px-4 py-2">Size</th>
                    <th className="text-center text-xs font-medium text-slate-500 dark:text-slate-400 px-4 py-2">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {pageAssets.map((asset) => {
                    const typeIcons: Record<string, typeof Image> = {
                      image: Image, document: FileText, video: Video, audio: Music,
                      font: Type, stylesheet: Palette, script: FileCode, other: File,
                    };
                    const Icon = typeIcons[asset.asset_type] || File;
                    return (
                      <tr key={asset.id} className="hover:bg-slate-50 dark:hover:bg-slate-700">
                        <td className="px-4 py-2">
                          <Icon className="w-4 h-4 text-slate-500" />
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-900 dark:text-white truncate max-w-xs">{asset.file_name || 'Unknown'}</span>
                            {asset.file_extension && (
                              <span className="px-1 py-0.5 text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded">.{asset.file_extension}</span>
                            )}
                            <a href={asset.url} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-indigo-500">
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-right text-xs text-slate-500">
                          {asset.file_size_bytes ? formatBytes(asset.file_size_bytes) : '—'}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <span className="text-[10px] font-medium text-slate-500">
                            {asset.source === 'both' ? 'HTML+Net' : asset.source === 'network' ? 'Network' : 'HTML'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Findings Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-lg font-medium text-slate-900 dark:text-white">Findings</h2>

          {/* Filters */}
          {findings.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {/* Category Filter */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                <button
                  onClick={() => setCategoryFilter(null)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    categoryFilter === null ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  All
                </button>
                {(['seo', 'accessibility', 'security', 'performance', 'content'] as FindingCategory[]).map(cat => {
                  const count = getCategoryCount(cat);
                  const totalCount = summary?.byCategory[cat] || 0;
                  if (totalCount === 0) return null;
                  return (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        categoryFilter === cat ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      } ${count === 0 && severityFilter ? 'opacity-50' : ''}`}
                    >
                      {categoryLabels[cat]} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Severity Filter */}
              <select
                value={severityFilter || ''}
                onChange={(e) => setSeverityFilter(e.target.value as Severity || null)}
                className="px-3 py-1.5 text-xs font-medium border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Severities</option>
                {(['critical', 'serious', 'moderate', 'minor', 'info'] as Severity[]).map(sev => {
                  const totalCount = summary?.bySeverity[sev] || 0;
                  if (totalCount === 0) return null;
                  const count = getSeverityCount(sev);
                  return (
                    <option key={sev} value={sev}>
                      {sev.charAt(0).toUpperCase() + sev.slice(1)} ({count})
                    </option>
                  );
                })}
              </select>
            </div>
          )}
        </div>

        {findings.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 text-center text-slate-500 dark:text-slate-400">
            No issues found on this page.
          </div>
        ) : filteredFindings.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 text-center text-slate-500 dark:text-slate-400">
            No issues match your filters.
          </div>
        ) : (
          categoriesToShow.map(category => {
            const categoryFindings = filteredFindingsByCategory[category] || [];
            if (categoryFindings.length === 0) return null;

            return (
              <div key={category} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <button
                  onClick={() => toggleCategory(category)}
                  aria-expanded={expandedCategories.has(category)}
                  aria-controls={`category-panel-${category}`}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${categoryColors[category]}`}>
                      {categoryLabels[category]}
                    </span>
                    <span className="text-sm text-slate-600 dark:text-slate-400">{categoryFindings.length} issues</span>
                  </div>
                  <svg
                    className={`w-5 h-5 text-slate-500 transition-transform ${expandedCategories.has(category) ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {expandedCategories.has(category) && (
                  <div id={`category-panel-${category}`} className="border-t border-slate-100 dark:border-slate-700/50">
                    {categoryFindings.map((finding) => (
                      <div key={finding.id} className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/50 last:border-b-0">
                        <div className="flex items-start justify-between mb-2">
                          <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${severityColors[finding.severity]}`}>
                            {finding.severity}
                          </span>
                        </div>

                        <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-1">{finding.rule_name}</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{finding.message}</p>

                        {finding.description && (
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{finding.description}</p>
                        )}

                        {finding.recommendation && (
                          <div className="mt-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                            <p className="text-sm text-indigo-800 dark:text-indigo-300">
                              <span className="font-medium">Recommendation:</span> {finding.recommendation}
                            </p>
                          </div>
                        )}

                        {finding.fixSnippet && (
                          <FixSnippetAccordion fixSnippet={finding.fixSnippet} />
                        )}

                        {finding.selector && (
                          <div className="mt-2">
                            <span className="text-xs text-slate-500 dark:text-slate-400">Selector: </span>
                            <code className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1 py-0.5 rounded">{finding.selector}</code>
                          </div>
                        )}

                        {finding.snippet && (
                          <pre className="mt-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-xs text-slate-700 dark:text-slate-300 overflow-x-auto">
                            {finding.snippet}
                          </pre>
                        )}

                        {finding.wcag_criteria && finding.wcag_criteria.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {finding.wcag_criteria.map((criteria, i) => (
                              <span key={i} className="inline-flex px-2 py-0.5 text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded">
                                {criteria}
                              </span>
                            ))}
                          </div>
                        )}

                        {finding.help_url && (
                          <a
                            href={finding.help_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Learn more about ${finding.rule_name}`}
                            className="mt-2 inline-flex items-center text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                          >
                            Learn more
                            <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </DashboardLayout>
  );
}
