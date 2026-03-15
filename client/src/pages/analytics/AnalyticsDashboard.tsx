import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, TrendingUp, TrendingDown, Minus, ArrowRight, Globe, FileSearch, ChevronDown, FileText, Link2, AlertCircle, Zap, Eye, Settings, User } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { analyticsApi, sitesApi } from '../../services/api';
import type { SiteWithStats } from '../../types/site.types';
import type { UserOverview } from '../../types/analytics.types';
import { getScoreColor, CATEGORY_LABELS } from '../../types/analytics.types';

function TrendBadge({ trend }: { trend: 'improving' | 'declining' | 'stable' }) {
  if (trend === 'improving') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
        <TrendingUp className="w-3 h-3" />
        Improving
      </span>
    );
  }
  if (trend === 'declining') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
        <TrendingDown className="w-3 h-3" />
        Declining
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
      <Minus className="w-3 h-3" />
      Stable
    </span>
  );
}

function ScoreCell({ score }: { score: number | null }) {
  if (score === null) {
    return <span className="text-slate-300">-</span>;
  }
  return (
    <span className="font-semibold" style={{ color: getScoreColor(score) }}>
      {score}
    </span>
  );
}

interface SiteCardProps {
  site: SiteWithStats;
  onClick: () => void;
}

function SiteCard({ site, onClick }: SiteCardProps) {
  const scores = [
    site.stats.latestScores?.seo,
    site.stats.latestScores?.accessibility,
    site.stats.latestScores?.security,
    site.stats.latestScores?.performance,
  ].filter((s): s is number => s !== null);

  const avgScore = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : null;

  // Determine trend based on score history if available
  const trend: 'improving' | 'declining' | 'stable' = 'stable';

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md hover:border-indigo-200 cursor-pointer transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-medium text-slate-900 truncate max-w-[180px]">{site.name}</h3>
          <p className="text-xs text-slate-500 truncate max-w-[180px]">{site.domain}</p>
        </div>
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
          style={{
            backgroundColor: avgScore !== null ? `${getScoreColor(avgScore)}15` : '#f1f5f9',
            color: avgScore !== null ? getScoreColor(avgScore) : '#94a3b8',
          }}
        >
          {avgScore ?? '-'}
        </div>
      </div>

      <div className="grid grid-cols-5 sm:grid-cols-6 gap-1 sm:gap-2 mb-3">
        {(['seo', 'accessibility', 'security', 'performance', 'content', 'structuredData'] as const).map(cat => (
          <div key={cat} className={`text-center ${cat === 'structuredData' ? 'hidden sm:block' : ''}`}>
            <div className="text-[10px] text-slate-500 uppercase">
              {cat === 'accessibility' ? 'A11y' : cat === 'structuredData' ? 'Sch' : cat.slice(0, 3)}
            </div>
            <div className="text-sm font-medium">
              <ScoreCell score={site.stats.latestScores?.[cat] ?? null} />
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <TrendBadge trend={trend} />
        <span className="text-xs text-slate-500">
          {site.stats.totalAudits} audit{site.stats.totalAudits !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
}

interface SiteSelectorProps {
  sites: SiteWithStats[];
  value: string | null;
  onChange: (siteId: string | null) => void;
  placeholder?: string;
}

function SiteSelector({ sites, value, onChange, placeholder = 'Select a site...' }: SiteSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedSite = sites.find(s => s.id === value);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors min-w-[200px]"
      >
        <Globe className="w-4 h-4 text-slate-500" />
        <span className="flex-1 text-left truncate">
          {selectedSite ? selectedSite.name : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-1 max-h-64 overflow-auto">
            {sites.map(site => (
              <button
                key={site.id}
                onClick={() => {
                  onChange(site.id);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                  site.id === value
                    ? 'bg-indigo-50 text-indigo-700 font-medium'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="font-medium truncate">{site.name}</div>
                <div className="text-xs text-slate-500 truncate">{site.domain}</div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function AnalyticsDashboard() {
  const navigate = useNavigate();

  const [sites, setSites] = useState<SiteWithStats[]>([]);
  const [overview, setOverview] = useState<UserOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const [overviewRes, sitesRes] = await Promise.all([
          analyticsApi.getUserOverview(),
          sitesApi.list(),
        ]);

        setOverview(overviewRes.data);
        setSites(sitesRes.data.sites);
      } catch (err: any) {
        console.error('Failed to fetch analytics:', err);
        setError('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 bg-slate-200 rounded" />
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-24 bg-slate-200 rounded-lg" />
              ))}
            </div>
            <div className="h-64 bg-slate-200 rounded-lg" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !overview) {
    return (
      <DashboardLayout>
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-indigo-600" />
              Analytics
            </h1>
            <p className="text-slate-500 mt-1">
              Overview of all your sites' health and performance
            </p>
          </div>

          {/* Empty state */}
          <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No analytics data yet</h3>
            <p className="text-slate-500 mb-6 max-w-md mx-auto">
              Add your first site and run an audit to start tracking your website's health and performance over time.
            </p>
            <Button variant="accent" onClick={() => navigate('/sites')}>
              Add Your First Site
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-indigo-600" />
              Analytics
            </h1>
            <p className="text-slate-500 mt-1">
              Overview of all your sites' health and performance
            </p>
          </div>
          <div className="flex items-center gap-3">
            <SiteSelector
              sites={sites}
              value={null}
              onChange={(id) => {
                if (id) navigate(`/analytics/sites/${id}`);
              }}
              placeholder="Jump to site..."
            />
            {sites.length >= 2 && (
              <Button
                variant="outline"
                onClick={() => navigate('/analytics/compare-sites')}
              >
                Compare Sites
              </Button>
            )}
          </div>
        </div>

        {/* Aggregate Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
              <Globe className="w-4 h-4" />
              Sites
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {overview.totalSites}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
              <FileSearch className="w-4 h-4" />
              Total Audits
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {overview.totalAudits}
            </div>
          </div>
          {(['seo', 'accessibility', 'security'] as const).map(cat => (
            <div key={cat} className="bg-white rounded-lg border border-slate-200 p-4">
              <div className="text-sm text-slate-500 mb-1">{CATEGORY_LABELS[cat]} Avg</div>
              <div
                className="text-2xl font-bold"
                style={{ color: getScoreColor(overview.avgScores[cat]) }}
              >
                {overview.avgScores[cat] ?? '-'}
              </div>
            </div>
          ))}
        </div>

        {/* Sites Needing Attention */}
        {overview.sitesNeedingAttention.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="w-5 h-5 text-amber-600" />
              <h2 className="font-medium text-amber-800">Sites Needing Attention</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {overview.sitesNeedingAttention.map(site => (
                <button
                  key={site.id}
                  onClick={() => navigate(`/analytics/sites/${site.id}`)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-white rounded-lg border border-amber-200 text-sm text-amber-800 hover:bg-amber-100 transition-colors"
                >
                  {site.name}
                  <ArrowRight className="w-3 h-3" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Site Grid */}
        {sites.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No sites yet</h3>
            <p className="text-slate-500 mb-4">
              Add a site and run audits to see analytics data here.
            </p>
            <Button onClick={() => navigate('/sites')}>
              Manage Sites
            </Button>
          </div>
        ) : (
          <div>
            <h2 className="text-lg font-medium text-slate-900 mb-4">All Sites</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sites.map(site => (
                <SiteCard
                  key={site.id}
                  site={site}
                  onClick={() => navigate(`/analytics/sites/${site.id}`)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {overview.recentActivity.length > 0 && (
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-medium text-slate-900 mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {overview.recentActivity.map((activity) => (
                <div
                  key={activity.auditId}
                  onClick={() => navigate(`/audits/${activity.auditId}`)}
                  className="p-4 rounded-lg border border-slate-100 hover:border-indigo-200 hover:shadow-sm cursor-pointer transition-all group"
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Left side - Site info and audit details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {activity.siteName}
                        </span>
                        <span className="text-xs text-slate-500">{activity.domain}</span>
                      </div>

                      {/* Scan type and details */}
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          {activity.scanType === 'single-page' && (
                            <>
                              <Link2 className="w-3 h-3" />
                              Single Page
                            </>
                          )}
                          {activity.scanType === 'quick-scan' && (
                            <>
                              <Zap className="w-3 h-3" />
                              Quick Scan
                            </>
                          )}
                          {activity.scanType === 'full-audit' && (
                            <>
                              <Globe className="w-3 h-3" />
                              Full Audit
                            </>
                          )}
                          {activity.scanType === 'accessibility' && (
                            <>
                              <Eye className="w-3 h-3" />
                              Accessibility
                            </>
                          )}
                          {activity.scanType === 'custom' && (
                            <>
                              <Settings className="w-3 h-3" />
                              Custom
                            </>
                          )}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {activity.pagesCrawled} page{activity.pagesCrawled !== 1 ? 's' : ''}
                        </span>
                        {activity.totalIssues > 0 && (
                          <span className="inline-flex items-center gap-1 text-amber-600">
                            <AlertCircle className="w-3 h-3" />
                            {activity.totalIssues} issue{activity.totalIssues !== 1 ? 's' : ''}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 text-slate-500">
                          <User className="w-3 h-3" />
                          {activity.startedBy.name || activity.startedBy.email.split('@')[0]}
                        </span>
                      </div>

                      {/* URL for single-url audits */}
                      {activity.url && (
                        <p className="text-xs text-slate-500 mt-1 truncate font-mono">
                          {activity.url}
                        </p>
                      )}
                    </div>

                    {/* Right side - Scores and timestamp */}
                    <div className="flex flex-col items-end gap-2">
                      {/* Overall score circle */}
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                        style={{
                          backgroundColor: `${getScoreColor(activity.overallScore)}15`,
                          color: getScoreColor(activity.overallScore),
                        }}
                      >
                        {activity.overallScore}
                      </div>

                      {/* Timestamp */}
                      <span className="text-xs text-slate-500">
                        {format(parseISO(activity.completedAt), 'MMM d, h:mm a')}
                      </span>
                    </div>
                  </div>

                  {/* Score breakdown bar */}
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-50">
                    {(['seo', 'accessibility', 'security', 'performance', 'content', 'structuredData'] as const).map(cat => (
                      <div key={cat} className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-500 uppercase w-8">
                          {cat === 'accessibility' ? 'A11y' : cat === 'structuredData' ? 'Sch' : cat.slice(0, 3)}
                        </span>
                        <span
                          className="text-xs font-medium"
                          style={{ color: getScoreColor(activity.scores[cat]) }}
                        >
                          {activity.scores[cat] ?? '-'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
