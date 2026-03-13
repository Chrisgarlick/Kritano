import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Layers, Plus, X, AlertTriangle, Globe, TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { analyticsApi, sitesApi } from '../../services/api';
import { ScoreRadarChart, SiteRankingTable } from '../../components/analytics';
import { getScoreColor, CATEGORY_LABELS, SCORE_CATEGORIES } from '../../types/analytics.types';
import type { SiteComparison as SiteComparisonType, SiteComparisonEntry } from '../../types/analytics.types';

interface SiteOption {
  id: string;
  name: string;
  domain: string;
}

function SiteSummaryCards({ sites }: { sites: SiteComparisonEntry[] }) {
  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(sites.length, 3)}, 1fr)` }}>
      {sites.map(site => {
        const scores = site.latestAudit?.scores;
        const validScores = scores
          ? [scores.seo, scores.accessibility, scores.security, scores.performance, scores.content, scores.structuredData]
              .filter((s): s is number => s !== null)
          : [];
        const overall = validScores.length > 0
          ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
          : null;

        return (
          <div key={site.id} className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-slate-900 truncate">{site.name}</h3>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <Globe className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{site.domain}</span>
                </p>
              </div>
              {overall !== null && (
                <span
                  className="inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold flex-shrink-0"
                  style={{ backgroundColor: `${getScoreColor(overall)}15`, color: getScoreColor(overall) }}
                >
                  {overall}
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-xs text-slate-400">Last Audit</p>
                <p className="text-sm font-medium text-slate-700">
                  {site.latestAudit
                    ? new Date(site.latestAudit.completedAt).toLocaleDateString()
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Issues</p>
                <p className="text-sm font-medium text-slate-700">
                  {site.latestAudit?.totalIssues ?? 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Categories</p>
                <p className="text-sm font-medium text-slate-700">{validScores.length}/6</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DeltaCell({ value }: { value: number | null }) {
  if (value === null) return <span className="text-slate-400 text-xs">N/A</span>;
  if (value > 0) return (
    <span className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-600">
      <TrendingUp className="w-3 h-3" />+{value}
    </span>
  );
  if (value < 0) return (
    <span className="inline-flex items-center gap-0.5 text-xs font-medium text-red-600">
      <TrendingDown className="w-3 h-3" />{value}
    </span>
  );
  return (
    <span className="inline-flex items-center gap-0.5 text-xs text-slate-400">
      <Minus className="w-3 h-3" />0
    </span>
  );
}

function LatestVsAverageTable({ sites }: { sites: SiteComparisonEntry[] }) {
  const categories = SCORE_CATEGORIES;

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
              Category
            </th>
            {sites.map(site => (
              <th key={site.id} colSpan={3} className="text-center py-3 px-3 text-xs font-medium text-slate-500 uppercase tracking-wider border-l border-slate-100">
                <div className="truncate max-w-[120px] mx-auto">{site.name}</div>
              </th>
            ))}
          </tr>
          <tr className="border-b border-slate-100">
            <th />
            {sites.map(site => (
              <>
                <th key={`${site.id}-l`} className="text-center py-1 px-2 text-[10px] font-medium text-slate-400 border-l border-slate-100">Latest</th>
                <th key={`${site.id}-a`} className="text-center py-1 px-2 text-[10px] font-medium text-slate-400">Avg</th>
                <th key={`${site.id}-d`} className="text-center py-1 px-2 text-[10px] font-medium text-slate-400">Delta</th>
              </>
            ))}
          </tr>
        </thead>
        <tbody>
          {categories.map(cat => (
            <tr key={cat} className="border-b border-slate-50">
              <td className="py-2 px-4 text-sm text-slate-700">{CATEGORY_LABELS[cat]}</td>
              {sites.map(site => {
                const latest = site.latestAudit?.scores?.[cat] ?? null;
                const avg = site.historicalAverage?.[cat] ?? null;
                const delta = latest !== null && avg !== null ? latest - avg : null;
                return (
                  <>
                    <td key={`${site.id}-l`} className="py-2 px-2 text-center border-l border-slate-50">
                      <span className="text-sm font-semibold" style={{ color: getScoreColor(latest) }}>
                        {latest ?? 'N/A'}
                      </span>
                    </td>
                    <td key={`${site.id}-a`} className="py-2 px-2 text-center">
                      <span className="text-sm text-slate-500">{avg ?? 'N/A'}</span>
                    </td>
                    <td key={`${site.id}-d`} className="py-2 px-2 text-center">
                      <DeltaCell value={delta !== null ? Math.round(delta) : null} />
                    </td>
                  </>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function IssueCountComparison({ sites }: { sites: SiteComparisonEntry[] }) {
  const sorted = [...sites]
    .filter(s => s.latestAudit)
    .sort((a, b) => (b.latestAudit?.totalIssues ?? 0) - (a.latestAudit?.totalIssues ?? 0));

  const max = Math.max(...sorted.map(s => s.latestAudit?.totalIssues ?? 0), 1);

  if (sorted.length === 0) {
    return <p className="text-sm text-slate-400">No audit data available.</p>;
  }

  return (
    <div className="space-y-3">
      {sorted.map(site => {
        const count = site.latestAudit?.totalIssues ?? 0;
        const pct = (count / max) * 100;
        const color = count > 50 ? '#ef4444' : count > 20 ? '#f59e0b' : '#10b981';
        return (
          <div key={site.id} className="flex items-center gap-3">
            <div className="w-32 text-sm text-slate-700 truncate flex-shrink-0">{site.name}</div>
            <div className="flex-1 h-6 bg-slate-100 rounded overflow-hidden">
              <div
                className="h-full rounded transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: color }}
              />
            </div>
            <span className="text-sm font-medium text-slate-700 w-10 text-right">{count}</span>
          </div>
        );
      })}
    </div>
  );
}

export function SiteComparisonContent() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [comparison, setComparison] = useState<SiteComparisonType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // For site selector
  const [availableSites, setAvailableSites] = useState<SiteOption[]>([]);
  const [sitesLoading, setSitesLoading] = useState(false);
  const [showSelector, setShowSelector] = useState(false);

  const selectedSiteIds = searchParams.get('sites')?.split(',').filter(Boolean) || [];

  // Helper to update search params while preserving existing ones (like tab)
  const updateParams = useCallback((updates: Record<string, string | null>) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      for (const [key, value] of Object.entries(updates)) {
        if (value === null) {
          next.delete(key);
        } else {
          next.set(key, value);
        }
      }
      return next;
    });
  }, [setSearchParams]);

  // Fetch available sites
  useEffect(() => {
    async function fetchSites() {
      try {
        setSitesLoading(true);
        const response = await sitesApi.list();
        setAvailableSites(response.data.sites.map((s: any) => ({
          id: s.id,
          name: s.name,
          domain: s.domain,
        })));
      } catch (err: any) {
        console.error('Failed to fetch sites:', err);
      } finally {
        setSitesLoading(false);
      }
    }
    fetchSites();
  }, []);

  // Fetch comparison when site IDs change
  useEffect(() => {
    async function fetchComparison() {
      if (selectedSiteIds.length < 2) {
        setComparison(null);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const response = await analyticsApi.compareSites(selectedSiteIds);
        setComparison(response.data);
      } catch (err: any) {
        console.error('Failed to compare sites:', err);
        setError(err.response?.data?.error || 'Failed to compare sites');
        setComparison(null);
      } finally {
        setLoading(false);
      }
    }
    fetchComparison();
  }, [selectedSiteIds.join(',')]);

  const addSite = (siteId: string) => {
    if (selectedSiteIds.length >= 6) return;
    if (selectedSiteIds.includes(siteId)) return;
    const newIds = [...selectedSiteIds, siteId];
    updateParams({ sites: newIds.join(',') });
    setShowSelector(false);
  };

  const removeSite = (siteId: string) => {
    const newIds = selectedSiteIds.filter(id => id !== siteId);
    updateParams({ sites: newIds.length > 0 ? newIds.join(',') : null });
  };

  const selectAll = () => {
    const allIds = availableSites.slice(0, 6).map(s => s.id);
    updateParams({ sites: allIds.join(',') });
    setShowSelector(false);
  };

  const selectedSites = selectedSiteIds
    .map(id => availableSites.find(s => s.id === id))
    .filter((s): s is SiteOption => s !== undefined);

  return (
    <div className="space-y-6">
      {/* Site Selector */}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium text-slate-900">Selected Sites ({selectedSiteIds.length}/6)</h2>
          <div className="flex gap-2">
            {availableSites.length > 1 && selectedSiteIds.length < availableSites.length && (
              <Button
                variant="ghost"
                size="sm"
                onClick={selectAll}
              >
                Select All
              </Button>
            )}
            {selectedSiteIds.length < 6 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSelector(!showSelector)}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Site
              </Button>
            )}
          </div>
        </div>

        {/* Selected Sites */}
        {selectedSites.length > 0 ? (
          <div className="flex flex-wrap gap-2 mb-4">
            {selectedSites.map(site => (
              <div
                key={site.id}
                className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-lg"
              >
                <div className="text-sm">
                  <span className="font-medium text-slate-700">{site.name}</span>
                  <span className="text-slate-400 text-xs ml-1">({site.domain})</span>
                </div>
                <button
                  onClick={() => removeSite(site.id)}
                  className="text-slate-400 hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-400 text-sm mb-4">
            Select at least 2 sites to compare
          </p>
        )}

        {/* Site Picker Dropdown */}
        {showSelector && (
          <div className="border border-slate-200 rounded-lg max-h-64 overflow-y-auto">
            {sitesLoading ? (
              <div className="p-4 text-center text-slate-400">Loading sites...</div>
            ) : availableSites.length === 0 ? (
              <div className="p-4 text-center text-slate-400">No sites found</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {availableSites
                  .filter(s => !selectedSiteIds.includes(s.id))
                  .map(site => (
                    <button
                      key={site.id}
                      onClick={() => addSite(site.id)}
                      className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors"
                    >
                      <span className="font-medium text-slate-700">{site.name}</span>
                      <span className="text-slate-400 text-sm ml-2">({site.domain})</span>
                    </button>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Comparison Results */}
      {loading ? (
        <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full mx-auto mb-4" />
          <p className="text-slate-500">Comparing sites...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-700">{error}</p>
        </div>
      ) : comparison ? (
        <div className="space-y-6">
          {/* Summary Cards */}
          <SiteSummaryCards sites={comparison.sites} />

          {/* Radar Chart */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-medium text-slate-900 mb-4">Score Comparison</h2>
            <ScoreRadarChart sites={comparison.sites} height={400} />
          </div>

          {/* Ranking Table */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-medium text-slate-900 mb-4">Site Rankings</h2>
            <SiteRankingTable sites={comparison.sites} />
          </div>

          {/* Latest vs Historical Average */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-medium text-slate-900 mb-1">Latest vs Historical Average</h2>
            <p className="text-sm text-slate-500 mb-4">
              Compare each site's latest audit scores against their historical averages
            </p>
            <LatestVsAverageTable sites={comparison.sites} />
          </div>

          {/* Issue Count Comparison */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-slate-400" />
              <h2 className="text-lg font-medium text-slate-900">Issue Count Comparison</h2>
            </div>
            <IssueCountComparison sites={comparison.sites} />
          </div>

          {/* Site Quick Links */}
          <div className="text-sm text-slate-500">
            Click on a site in the table to view its detail page.
          </div>
        </div>
      ) : selectedSiteIds.length < 2 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
          <Layers className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">Select Sites to Compare</h3>
          <p className="text-slate-500">
            Choose 2-6 sites to see how they compare across all metrics.
          </p>
        </div>
      ) : null}
    </div>
  );
}

export default function SiteComparison() {
  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
              <Link to="/analytics" className="hover:text-indigo-600">&larr; Analytics</Link>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-6 h-6 text-indigo-600" />
              Compare Sites
            </h1>
            <p className="text-slate-500 mt-1">
              Benchmark your sites against each other
            </p>
          </div>
        </div>

        <SiteComparisonContent />
      </div>
    </DashboardLayout>
  );
}
