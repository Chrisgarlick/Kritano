import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ExternalLink, AlertTriangle, ChevronRight, Play, Clock, AlertCircle } from 'lucide-react';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { ScoreLineChart } from '../../components/analytics/ScoreLineChart';
import { ComparisonBars } from '../../components/analytics/ComparisonBars';
import { analyticsApi, sitesApi, auditsApi } from '../../services/api';
import type { SiteWithStats } from '../../types/site.types';
import type { UrlAnalytics as UrlAnalyticsType } from '../../types/analytics.types';
import { getScoreColor } from '../../types/analytics.types';

export default function UrlAnalytics() {
  const { siteId, urlId } = useParams<{ siteId: string; urlId: string }>();
  const navigate = useNavigate();

  const [site, setSite] = useState<SiteWithStats | null>(null);
  const [data, setData] = useState<UrlAnalyticsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startingAudit, setStartingAudit] = useState(false);

  useEffect(() => {
    if (!siteId || !urlId) return;

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const [siteRes, analyticsRes] = await Promise.all([
          sitesApi.get(siteId!),
          analyticsApi.getUrlAnalytics(siteId!, urlId!),
        ]);

        setSite(siteRes.data.site);
        setData(analyticsRes.data);
      } catch (err: any) {
        console.error('Failed to fetch URL analytics:', err);
        setError('Failed to load URL analytics');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [siteId, urlId]);

  const handleRunAudit = async () => {
    if (!data || !siteId) return;

    try {
      setStartingAudit(true);
      const response = await auditsApi.start({
        targetUrl: data.url.fullUrl,
        siteId,
        options: { maxPages: 1 },
      });
      navigate(`/audits/${response.data.audit.id}`);
    } catch (err: any) {
      console.error('Failed to start audit:', err);
      setError('Failed to start audit');
    } finally {
      setStartingAudit(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-4 w-64 bg-slate-200 rounded" />
            <div className="h-8 w-48 bg-slate-200 rounded" />
            <div className="h-64 bg-slate-200 rounded-lg" />
            <div className="h-80 bg-slate-200 rounded-lg" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !site || !data) {
    return (
      <DashboardLayout>
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-700">{error || 'Failed to load URL analytics'}</p>
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
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm flex-wrap">
          <Link to="/analytics" className="text-indigo-600 hover:text-indigo-700">
            Analytics
          </Link>
          <ChevronRight className="w-4 h-4 text-slate-400" />
          <Link
            to={`/analytics/sites/${siteId}`}
            className="text-indigo-600 hover:text-indigo-700"
          >
            {site.name}
          </Link>
          <ChevronRight className="w-4 h-4 text-slate-400" />
          <span className="text-slate-900 font-mono text-xs bg-slate-100 px-2 py-1 rounded">
            {data.url.urlPath || '/'}
          </span>
        </nav>

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-slate-900 font-mono truncate">
              {data.url.urlPath || '/'}
            </h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
              <span className="inline-flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {data.url.auditCount} audit{data.url.auditCount !== 1 ? 's' : ''}
              </span>
              {data.url.lastAuditedAt && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Last audited {formatDistanceToNow(parseISO(data.url.lastAuditedAt), { addSuffix: true })}
                </span>
              )}
              <a
                href={data.url.fullUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700"
              >
                View Page
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
          <Button
            variant="primary"
            onClick={handleRunAudit}
            disabled={startingAudit}
          >
            <Play className="w-4 h-4 mr-2" />
            {startingAudit ? 'Starting...' : 'Run New Audit'}
          </Button>
        </div>

        {/* Comparison to Site Average */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-medium text-slate-900 mb-4">Comparison to Site Average</h2>
          <ComparisonBars data={data.comparisonToSite} />
        </div>

        {/* Score History */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-medium text-slate-900 mb-4">Score History</h2>
          {data.scoreHistory.scores.length > 0 ? (
            <ScoreLineChart
              data={data.scoreHistory.scores}
              onPointClick={(auditId) => navigate(`/audits/${auditId}`)}
            />
          ) : (
            <div className="flex items-center justify-center h-[300px] text-slate-500">
              No score history available. Run an audit to see trends.
            </div>
          )}
        </div>

        {/* Recent Audits */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-medium text-slate-900 mb-4">Recent Audits</h2>

          {data.recentAudits.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No audits for this URL yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">
                      Date
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-slate-500 uppercase">
                      SEO
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-slate-500 uppercase">
                      A11y
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-slate-500 uppercase">
                      Security
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-slate-500 uppercase">
                      Perf
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-slate-500 uppercase">
                      Content
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-slate-500 uppercase">
                      Issues
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentAudits.map(audit => (
                    <tr
                      key={audit.id}
                      onClick={() => navigate(`/audits/${audit.id}`)}
                      className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4">
                        <span className="text-sm text-slate-700">
                          {format(parseISO(audit.completedAt), 'MMM d, yyyy h:mm a')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className="font-semibold text-sm"
                          style={{ color: getScoreColor(audit.scores.seo) }}
                        >
                          {audit.scores.seo ?? '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className="font-semibold text-sm"
                          style={{ color: getScoreColor(audit.scores.accessibility) }}
                        >
                          {audit.scores.accessibility ?? '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className="font-semibold text-sm"
                          style={{ color: getScoreColor(audit.scores.security) }}
                        >
                          {audit.scores.security ?? '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className="font-semibold text-sm"
                          style={{ color: getScoreColor(audit.scores.performance) }}
                        >
                          {audit.scores.performance ?? '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className="font-semibold text-sm"
                          style={{ color: getScoreColor(audit.scores.content ?? null) }}
                        >
                          {audit.scores.content ?? '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-sm text-slate-600">
                          {audit.totalIssues}
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
