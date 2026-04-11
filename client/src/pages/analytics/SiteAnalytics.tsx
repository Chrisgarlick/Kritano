import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, Minus, ExternalLink, AlertTriangle, ChevronRight, ArrowUp, ArrowDown } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { ScoreLineChart } from '../../components/analytics/ScoreLineChart';
import { IssueTrendChart } from '../../components/analytics/IssueTrendChart';
import { DateRangePicker } from '../../components/analytics/DateRangePicker';
import { SiteSelector } from '../../components/analytics/SiteSelector';
import { WaterfallChart } from '../../components/analytics/WaterfallChart';
import { FixVelocityChart } from '../../components/analytics/FixVelocityChart';
import { AuditTimeline } from '../../components/analytics/AuditTimeline';
import { analyticsApi, sitesApi } from '../../services/api';
import type { SiteWithStats, SiteUrl } from '../../types/site.types';
import type { ScoreHistory, IssueTrends, TimeRange, GroupBy, TrendDirection, ScoreCategory } from '../../types/analytics.types';
import { getScoreColor, CATEGORY_LABELS, CATEGORY_COLORS } from '../../types/analytics.types';

type UrlSortBy = 'url_path' | 'last_audited_at' | 'last_seo_score' | 'last_accessibility_score' | 'last_security_score' | 'last_performance_score' | 'last_content_score';
type SortOrder = 'asc' | 'desc';

function TrendIcon({ trend, light = false }: { trend: TrendDirection; light?: boolean }) {
  if (trend === 'up') {
    return <TrendingUp className={`w-4 h-4 ${light ? 'text-white/80' : 'text-emerald-500'}`} />;
  }
  if (trend === 'down') {
    return <TrendingDown className={`w-4 h-4 ${light ? 'text-white/80' : 'text-red-500'}`} />;
  }
  return <Minus className={`w-4 h-4 ${light ? 'text-white/60' : 'text-slate-500'}`} />;
}

function ScoreSummaryCard({
  category,
  score,
  trend,
}: {
  category: ScoreCategory;
  score: number | null;
  trend: TrendDirection;
}) {
  return (
    <div
      className="rounded-lg p-4 backdrop-blur-sm border shadow-sm"
      style={{
        background: `linear-gradient(135deg, ${CATEGORY_COLORS[category]}15, ${CATEGORY_COLORS[category]}25)`,
        borderColor: `${CATEGORY_COLORS[category]}30`,
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span
          className="text-sm font-medium"
          style={{ color: CATEGORY_COLORS[category] }}
        >
          {CATEGORY_LABELS[category]}
        </span>
        <TrendIcon trend={trend} />
      </div>
      <div
        className="text-3xl font-bold"
        style={{ color: CATEGORY_COLORS[category] }}
      >
        {score ?? '-'}
      </div>
    </div>
  );
}

export default function SiteAnalytics() {
  const { siteId } = useParams<{ siteId: string }>();
  const navigate = useNavigate();

  const [site, setSite] = useState<SiteWithStats | null>(null);
  const [allSites, setAllSites] = useState<SiteWithStats[]>([]);
  const [scoreHistory, setScoreHistory] = useState<ScoreHistory | null>(null);
  const [issueTrends, setIssueTrends] = useState<IssueTrends | null>(null);
  const [urls, setUrls] = useState<SiteUrl[]>([]);
  const [urlsTotal, setUrlsTotal] = useState(0);
  const [range, setRange] = useState<TimeRange>('30d');
  const [groupBy] = useState<GroupBy>('week');
  const [loading, setLoading] = useState(true);
  const [urlsLoading, setUrlsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlSortBy, setUrlSortBy] = useState<UrlSortBy>('last_audited_at');
  const [urlSortOrder, setUrlSortOrder] = useState<SortOrder>('desc');
  const [waterfallSteps, setWaterfallSteps] = useState<Array<{ auditId: string; completedAt: string; totalIssues: number; fixed: number; introduced: number }>>([]);
  const [fixVelocityPoints, setFixVelocityPoints] = useState<Array<{ auditId: string; completedAt: string; cumulativeFixed: number; cumulativeNew: number; netChange: number }>>([]);

  // Fetch all sites for the site selector
  useEffect(() => {
    sitesApi.list().then(res => {
      setAllSites(res.data.sites);
    }).catch(() => {
      // Ignore errors for site selector
    });
  }, []);

  // Main data fetch (site, scores, issues)
  useEffect(() => {
    if (!siteId) return;

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const [siteRes, scoresRes, issuesRes] = await Promise.all([
          sitesApi.get(siteId!),
          analyticsApi.getSiteScores(siteId!, { range }),
          analyticsApi.getSiteIssues(siteId!, { range, groupBy }),
        ]);

        setSite(siteRes.data.site);
        setScoreHistory(scoresRes.data);
        setIssueTrends(issuesRes.data);

        // Fetch waterfall and fix velocity in background
        Promise.all([
          analyticsApi.getIssueWaterfall(siteId!),
          analyticsApi.getFixVelocity(siteId!),
        ]).then(([waterfallRes, velocityRes]) => {
          setWaterfallSteps(waterfallRes.data.steps);
          setFixVelocityPoints(velocityRes.data.points);
        }).catch(() => { /* non-critical */ });
      } catch (err: any) {
        console.error('Failed to fetch site analytics:', err);
        setError('Failed to load site analytics');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [siteId, range, groupBy]);

  // Separate URL fetch (responds to sorting without full page reload)
  useEffect(() => {
    if (!siteId) return;

    async function fetchUrls() {
      try {
        setUrlsLoading(true);
        const urlsRes = await sitesApi.getUrls(siteId!, { limit: 10, sortBy: urlSortBy, sortOrder: urlSortOrder });
        setUrls(urlsRes.data.urls);
        setUrlsTotal(urlsRes.data.pagination.total);
      } catch (err: any) {
        console.error('Failed to fetch URLs:', err);
      } finally {
        setUrlsLoading(false);
      }
    }

    fetchUrls();
  }, [siteId, urlSortBy, urlSortOrder]);

  // Handle column header click for sorting
  const handleSort = useCallback((column: UrlSortBy) => {
    if (urlSortBy === column) {
      // Toggle sort order if same column
      setUrlSortOrder(urlSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // New column - default to descending for scores, ascending for url_path
      setUrlSortBy(column);
      setUrlSortOrder(column === 'url_path' ? 'asc' : 'desc');
    }
  }, [urlSortBy, urlSortOrder]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-4 w-48 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-8 w-64 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 bg-slate-200 dark:bg-slate-700 rounded-lg" />
              ))}
            </div>
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="h-80 bg-slate-200 dark:bg-slate-700 rounded-lg" />
              <div className="h-80 bg-slate-200 dark:bg-slate-700 rounded-lg" />
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !site || !scoreHistory) {
    return (
      <DashboardLayout>
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
            <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-700 dark:text-red-400">{error || 'Failed to load site analytics'}</p>
            <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Helmet><title>Site Analytics | Kritano</title></Helmet>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm">
          <Link to="/app/analytics" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300">
            Analytics
          </Link>
          <ChevronRight className="w-4 h-4 text-slate-500" />
          <span className="text-slate-900 dark:text-white font-medium">{site.name}</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{site.name}</h1>
            <a
              href={`https://${site.domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              {site.domain}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <SiteSelector
              sites={allSites}
              currentSiteId={siteId}
              onChange={(id) => navigate(`/app/analytics/sites/${id}`)}
            />
            <DateRangePicker value={range} onChange={setRange} />
            <Button
              variant="outline"
              onClick={() => navigate(`/app/sites/${siteId}`)}
            >
              View Site
            </Button>
          </div>
        </div>

        {/* Score Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {(['seo', 'accessibility', 'security', 'performance', 'content', 'structuredData', 'cqs'] as const).map(cat => (
            <ScoreSummaryCard
              key={cat}
              category={cat}
              score={scoreHistory.summary.averages[cat] ?? null}
              trend={scoreHistory.summary.trends[cat] ?? 'stable'}
            />
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Score History</h2>
            <ScoreLineChart
              data={scoreHistory.scores}
              categories={['seo', 'accessibility', 'security', 'performance', 'content', 'structuredData', 'cqs']}
              onPointClick={(auditId) => navigate(`/app/audits/${auditId}`)}
            />
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Issue Trends</h2>
            {issueTrends && issueTrends.trends.length > 0 ? (
              <IssueTrendChart data={issueTrends.trends} />
            ) : (
              <div className="flex items-center justify-center h-[300px] text-slate-500 dark:text-slate-400">
                No issue data available
              </div>
            )}
          </div>
        </div>

        {/* Audit Timeline */}
        {scoreHistory.scores.length >= 2 && (
          <AuditTimeline
            audits={scoreHistory.scores.map(s => {
              const mainScores = [s.seo, s.accessibility, s.security, s.performance].filter((v): v is number => v !== null);
              const overall = mainScores.length > 0 ? Math.round(mainScores.reduce((a, b) => a + b, 0) / mainScores.length) : 0;
              return {
                auditId: s.auditId,
                completedAt: s.completedAt,
                overallScore: overall,
                totalIssues: 0, // Will be filled by waterfall data if available
                pagesCrawled: 0,
              };
            })}
            onDotClick={(auditId) => navigate(`/app/audits/${auditId}`)}
          />
        )}

        {/* Waterfall + Fix Velocity Row */}
        {(waterfallSteps.length >= 2 || fixVelocityPoints.length >= 2) && (
          <div className="grid lg:grid-cols-2 gap-6">
            {waterfallSteps.length >= 2 && (
              <WaterfallChart
                steps={waterfallSteps}
                onBarClick={(auditId) => navigate(`/app/audits/${auditId}`)}
              />
            )}
            {fixVelocityPoints.length >= 2 && (
              <FixVelocityChart
                points={fixVelocityPoints}
                onPointClick={(auditId) => navigate(`/app/audits/${auditId}`)}
              />
            )}
          </div>
        )}

        {/* URLs Table */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-slate-900 dark:text-white">
              URLs ({urlsTotal})
            </h2>
            <Link
              to={`/app/sites/${siteId}`}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
            >
              View All URLs
            </Link>
          </div>

          {urls.length === 0 && !urlsLoading ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              No URLs audited yet. Run an audit to see URL data here.
            </div>
          ) : (
            <div className={`overflow-x-auto transition-opacity duration-150 ${urlsLoading ? 'opacity-50' : ''}`}>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th
                      className="text-left py-3 px-4 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase cursor-pointer hover:text-slate-700 dark:hover:text-slate-300 select-none"
                      onClick={() => handleSort('url_path')}
                    >
                      <span className="inline-flex items-center gap-1">
                        URL Path
                        {urlSortBy === 'url_path' && (
                          urlSortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                        )}
                      </span>
                    </th>
                    <th
                      className="text-center py-3 px-4 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase cursor-pointer hover:text-slate-700 dark:hover:text-slate-300 select-none"
                      onClick={() => handleSort('last_seo_score')}
                    >
                      <span className="inline-flex items-center justify-center gap-1">
                        SEO
                        {urlSortBy === 'last_seo_score' && (
                          urlSortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                        )}
                      </span>
                    </th>
                    <th
                      className="text-center py-3 px-4 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase cursor-pointer hover:text-slate-700 dark:hover:text-slate-300 select-none"
                      onClick={() => handleSort('last_accessibility_score')}
                    >
                      <span className="inline-flex items-center justify-center gap-1">
                        A11y
                        {urlSortBy === 'last_accessibility_score' && (
                          urlSortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                        )}
                      </span>
                    </th>
                    <th
                      className="text-center py-3 px-4 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase cursor-pointer hover:text-slate-700 dark:hover:text-slate-300 select-none"
                      onClick={() => handleSort('last_security_score')}
                    >
                      <span className="inline-flex items-center justify-center gap-1">
                        Security
                        {urlSortBy === 'last_security_score' && (
                          urlSortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                        )}
                      </span>
                    </th>
                    <th
                      className="text-center py-3 px-4 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase cursor-pointer hover:text-slate-700 dark:hover:text-slate-300 select-none"
                      onClick={() => handleSort('last_performance_score')}
                    >
                      <span className="inline-flex items-center justify-center gap-1">
                        Perf
                        {urlSortBy === 'last_performance_score' && (
                          urlSortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                        )}
                      </span>
                    </th>
                    <th
                      className="text-center py-3 px-4 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase cursor-pointer hover:text-slate-700 dark:hover:text-slate-300 select-none"
                      onClick={() => handleSort('last_content_score')}
                    >
                      <span className="inline-flex items-center justify-center gap-1">
                        Content
                        {urlSortBy === 'last_content_score' && (
                          urlSortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                        )}
                      </span>
                    </th>
                    <th
                      className="text-right py-3 px-4 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase cursor-pointer hover:text-slate-700 dark:hover:text-slate-300 select-none"
                      onClick={() => handleSort('last_audited_at')}
                    >
                      <span className="inline-flex items-center justify-end gap-1">
                        Last Audited
                        {urlSortBy === 'last_audited_at' && (
                          urlSortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                        )}
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {urls.map(url => (
                    <tr
                      key={url.id}
                      onClick={() => navigate(`/app/analytics/sites/${siteId}/urls/${url.id}`)}
                      className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4">
                        <span className="font-mono text-sm text-slate-700 dark:text-slate-300 truncate block max-w-[300px]">
                          {url.urlPath || '/'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className="font-semibold text-sm"
                          style={{ color: getScoreColor(url.lastSeoScore) }}
                        >
                          {url.lastSeoScore ?? '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className="font-semibold text-sm"
                          style={{ color: getScoreColor(url.lastAccessibilityScore) }}
                        >
                          {url.lastAccessibilityScore ?? '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className="font-semibold text-sm"
                          style={{ color: getScoreColor(url.lastSecurityScore) }}
                        >
                          {url.lastSecurityScore ?? '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className="font-semibold text-sm"
                          style={{ color: getScoreColor(url.lastPerformanceScore) }}
                        >
                          {url.lastPerformanceScore ?? '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className="font-semibold text-sm"
                          style={{ color: getScoreColor(url.lastContentScore ?? null) }}
                        >
                          {url.lastContentScore ?? '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-sm text-slate-500">
                          {url.lastAuditedAt
                            ? format(parseISO(url.lastAuditedAt), 'MMM d, yyyy')
                            : 'Never'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
