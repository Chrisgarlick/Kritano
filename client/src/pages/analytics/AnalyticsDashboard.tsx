import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { BarChart3, TrendingUp, TrendingDown, Minus, Globe, ChevronDown } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { analyticsApi, sitesApi } from '../../services/api';
import type { SiteWithStats } from '../../types/site.types';
import type { UserOverview, ScoreCategory } from '../../types/analytics.types';
import { getScoreColor } from '../../types/analytics.types';
import { Sparkline } from '../../components/analytics/Sparkline';
import { HealthPulse } from '../../components/analytics/HealthPulse';
import { SmartChangelog } from '../../components/analytics/SmartChangelog';
import { DotPlot } from '../../components/analytics/DotPlot';

function TrendBadge({ trend }: { trend: 'improving' | 'declining' | 'stable' }) {
  if (trend === 'improving') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
        <TrendingUp className="w-3 h-3" />
        Improving
      </span>
    );
  }
  if (trend === 'declining') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
        <TrendingDown className="w-3 h-3" />
        Declining
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
      <Minus className="w-3 h-3" />
      Stable
    </span>
  );
}

function ScoreCell({ score }: { score: number | null }) {
  if (score === null) return <span className="text-slate-300 dark:text-slate-600">-</span>;
  return <span className="font-semibold" style={{ color: getScoreColor(score) }}>{score}</span>;
}

interface SiteCardProps {
  site: SiteWithStats;
  trend: 'improving' | 'declining' | 'stable';
  scoreHistory?: Record<ScoreCategory, (number | null)[]>;
  onClick: () => void;
}

function SiteCard({ site, trend, scoreHistory, onClick }: SiteCardProps) {
  const scores = [
    site.stats.latestScores?.seo,
    site.stats.latestScores?.accessibility,
    site.stats.latestScores?.security,
    site.stats.latestScores?.performance,
  ].filter((s): s is number => s !== null);

  const avgScore = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : null;

  const categories = ['seo', 'accessibility', 'security', 'performance', 'content', 'structuredData'] as const;

  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800 cursor-pointer transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-medium text-slate-900 dark:text-white truncate max-w-[180px]">{site.name}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[180px]">{site.domain}</p>
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

      {/* Score grid with sparklines */}
      <div className="space-y-1.5 mb-3">
        {categories.map(cat => {
          const score = site.stats.latestScores?.[cat] ?? null;
          const history = scoreHistory?.[cat];
          return (
            <div key={cat} className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500 uppercase w-8 flex-shrink-0">
                {cat === 'accessibility' ? 'A11y' : cat === 'structuredData' ? 'Sch' : cat === 'performance' ? 'Perf' : cat.slice(0, 3)}
              </span>
              <div className="flex-1 flex items-center gap-1.5">
                <span className="text-xs font-medium w-6 text-right">
                  <ScoreCell score={score} />
                </span>
                {history && history.length >= 2 && (
                  <Sparkline data={history} width={60} height={16} strokeWidth={1.5} />
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/50">
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
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors min-w-[200px]"
      >
        <Globe className="w-4 h-4 text-slate-500" />
        <span className="flex-1 text-left truncate">
          {selectedSite ? selectedSite.name : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-20 py-1 max-h-64 overflow-auto">
            {sites.map(site => (
              <button
                key={site.id}
                onClick={() => { onChange(site.id); setIsOpen(false); }}
                className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                  site.id === value
                    ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 font-medium'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
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
  const [siteScoreHistories, setSiteScoreHistories] = useState<Record<string, Record<ScoreCategory, (number | null)[]>>>({});

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

        // Fetch score history for sparklines (last 6 audits per site)
        const histories: Record<string, Record<ScoreCategory, (number | null)[]>> = {};
        const siteList = sitesRes.data.sites;
        if (siteList.length <= 10) {
          const historyPromises = siteList.map(async (site: SiteWithStats) => {
            try {
              const res = await analyticsApi.getSiteScores(site.id, { range: '90d' });
              const scores = res.data.scores.slice(-6);
              const cats: ScoreCategory[] = ['seo', 'accessibility', 'security', 'performance', 'content', 'structuredData'];
              const history: Record<string, (number | null)[]> = {};
              for (const cat of cats) {
                history[cat] = scores.map((s: any) => s[cat]);
              }
              histories[site.id] = history as Record<ScoreCategory, (number | null)[]>;
            } catch {
              // Silently skip sites with no history
            }
          });
          await Promise.all(historyPromises);
        }
        setSiteScoreHistories(histories);
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
            <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded-lg" />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-56 bg-slate-200 dark:bg-slate-700 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !overview) {
    return (
      <DashboardLayout>
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              Analytics
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Overview of all your sites' health and performance
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-12 text-center">
            <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No analytics data yet</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
              Add your first site and run an audit to start tracking your website's health and performance over time.
            </p>
            <Button variant="accent" onClick={() => navigate('/app/sites')}>
              Add Your First Site
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Build site data for HealthPulse and DotPlot
  const healthPulseSites = sites.map(s => ({
    id: s.id,
    name: s.name,
    domain: s.domain,
    scores: {
      seo: s.stats.latestScores?.seo ?? null,
      accessibility: s.stats.latestScores?.accessibility ?? null,
      security: s.stats.latestScores?.security ?? null,
      performance: s.stats.latestScores?.performance ?? null,
      content: s.stats.latestScores?.content ?? null,
      structuredData: s.stats.latestScores?.structuredData ?? null,
    },
  }));

  const dotPlotSites = sites.map(s => ({
    id: s.id,
    name: s.name,
    scores: {
      seo: s.stats.latestScores?.seo ?? null,
      accessibility: s.stats.latestScores?.accessibility ?? null,
      security: s.stats.latestScores?.security ?? null,
      performance: s.stats.latestScores?.performance ?? null,
      content: s.stats.latestScores?.content ?? null,
    } as Partial<Record<ScoreCategory, number | null>>,
  }));

  return (
    <DashboardLayout>
      <Helmet><title>Analytics | Kritano</title></Helmet>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              Analytics
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              {overview.totalSites} site{overview.totalSites !== 1 ? 's' : ''} &middot; {overview.totalAudits} audit{overview.totalAudits !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <SiteSelector
              sites={sites}
              value={null}
              onChange={(id) => {
                if (id) navigate(`/app/analytics/sites/${id}`);
              }}
              placeholder="Jump to site..."
            />
            {sites.length >= 2 && (
              <Button
                variant="outline"
                onClick={() => navigate('/app/analytics/compare-sites')}
              >
                Compare Sites
              </Button>
            )}
          </div>
        </div>

        {/* Health Pulse */}
        {sites.length > 0 && (
          <HealthPulse
            sites={healthPulseSites}
            onSegmentClick={(_status, siteIds) => {
              if (siteIds.length === 1) navigate(`/app/analytics/sites/${siteIds[0]}`);
            }}
          />
        )}

        {/* Sites Needing Attention */}
        {overview.sitesNeedingAttention.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <h2 className="font-medium text-amber-800 dark:text-amber-300">Sites Needing Attention</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {overview.sitesNeedingAttention.map(site => (
                <button
                  key={site.id}
                  onClick={() => navigate(`/app/analytics/sites/${site.id}`)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-lg border border-amber-200 dark:border-amber-800 text-sm text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                >
                  {site.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Two-column layout: Site Cards + Score Distribution */}
        {sites.length > 0 && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Site Grid */}
            <div className="lg:col-span-2">
              <h2 className="text-lg font-medium text-slate-900 dark:text-white mb-4">All Sites</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {sites.map(site => (
                  <SiteCard
                    key={site.id}
                    site={site}
                    trend={overview.siteTrends?.[site.id] || 'stable'}
                    scoreHistory={siteScoreHistories[site.id]}
                    onClick={() => navigate(`/app/analytics/sites/${site.id}`)}
                  />
                ))}
              </div>
            </div>

            {/* Score Distribution */}
            {sites.length >= 2 && (
              <div>
                <h2 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Distribution</h2>
                <DotPlot
                  sites={dotPlotSites}
                  onDotClick={(siteId) => navigate(`/app/analytics/sites/${siteId}`)}
                />
              </div>
            )}
          </div>
        )}

        {sites.length === 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-8 text-center">
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No sites yet</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4">
              Add a site and run audits to see analytics data here.
            </p>
            <Button onClick={() => navigate('/app/sites')}>
              Manage Sites
            </Button>
          </div>
        )}

        {/* Smart Changelog */}
        {overview.recentActivity.length > 0 && (
          <SmartChangelog recentActivity={overview.recentActivity} />
        )}
      </div>
    </DashboardLayout>
  );
}
