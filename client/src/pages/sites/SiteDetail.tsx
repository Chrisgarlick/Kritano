import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { useToast } from '../../components/ui/Toast';
import { sitesApi } from '../../services/api';
import { formatDate } from '../../utils/format';
import { getScoreColor } from '../../utils/constants';
import type { SiteWithStats, ScoreHistoryEntry, SiteUrl, SitePermission } from '../../types/site.types';

type TabType = 'overview' | 'audits' | 'urls' | 'settings';

interface Audit {
  id: string;
  targetUrl: string;
  targetDomain: string;
  status: string;
  pagesFound: number;
  pagesCrawled: number;
  pagesAudited: number;
  totalIssues: number;
  criticalIssues: number;
  seoScore: number | null;
  accessibilityScore: number | null;
  securityScore: number | null;
  performanceScore: number | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

function ScoreCard({ label, score, prevScore }: { label: string; score: number | null; prevScore?: number | null }) {
  if (score === null) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700 p-4">
        <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">{label}</div>
        <div className="text-2xl font-bold text-slate-300 dark:text-slate-600">-</div>
      </div>
    );
  }

  const diff = prevScore !== null && prevScore !== undefined ? score - prevScore : null;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700 p-4">
      <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">{label}</div>
      <div className={`text-2xl font-bold ${getScoreColor(score)}`}>
        {score}
        {diff !== null && diff !== 0 && (
          <span className={`ml-2 text-sm ${diff > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {diff > 0 ? '+' : ''}{diff}
          </span>
        )}
      </div>
    </div>
  );
}

function ScoreHistoryChart({ history }: { history: ScoreHistoryEntry[] }) {
  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400 dark:text-slate-500">
        No score history yet
      </div>
    );
  }

  const categories = ['seo', 'accessibility', 'security', 'performance', 'content'] as const;
  const colors = {
    seo: '#3b82f6',
    accessibility: '#8b5cf6',
    security: '#10b981',
    performance: '#f59e0b',
    content: '#f97316',
  };

  const maxScore = 100;
  const chartHeight = 120;
  const chartWidth = 100;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700 p-4">
      <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">Score History (30 days)</h3>
      <div className="flex gap-4 flex-wrap">
        {categories.map(cat => {
          const data = history.filter(h => h[cat] !== null).map(h => h[cat] as number);
          if (data.length === 0) return null;

          const points = data.map((score, i) => {
            const x = (i / (data.length - 1 || 1)) * chartWidth;
            const y = chartHeight - (score / maxScore) * chartHeight;
            return `${x},${y}`;
          }).join(' ');

          return (
            <div key={cat} className="flex-1 min-w-[120px]">
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-2 capitalize">{cat}</div>
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-16">
                <polyline
                  fill="none"
                  stroke={colors[cat]}
                  strokeWidth="2"
                  points={points}
                />
              </svg>
              <div className="text-xs text-slate-400 dark:text-slate-500 text-center">
                {data[data.length - 1]}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function SiteDetailPage() {
  const { siteId } = useParams<{ siteId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [site, setSite] = useState<SiteWithStats | null>(null);
  const [scoreHistory, setScoreHistory] = useState<ScoreHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Audits state
  const [audits, setAudits] = useState<Audit[]>([]);
  const [auditsLoading, setAuditsLoading] = useState(false);
  const [auditsPagination, setAuditsPagination] = useState({ total: 0, limit: 20, offset: 0 });

  // URLs state
  const [urls, setUrls] = useState<SiteUrl[]>([]);
  const [urlsLoading, setUrlsLoading] = useState(false);
  const [urlsPagination, setUrlsPagination] = useState({ total: 0, limit: 20, offset: 0 });
  const [discoveringPages, setDiscoveringPages] = useState(false);

  // Verification state
  const [verifying, setVerifying] = useState(false);
  const [verificationInstructions, setVerificationInstructions] = useState<any>(null);

  const fetchSite = useCallback(async () => {
    if (!siteId) return;
    try {
      setLoading(true);
      setError(null);
      const response = await sitesApi.get(siteId);
      // Merge permission into site object (it's returned at top level)
      setSite({
        ...response.data.site,
        permission: response.data.permission,
      });
      setScoreHistory(response.data.scoreHistory);
    } catch (err: any) {
      console.error('Failed to fetch site:', err);
      setError('Failed to load site. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [siteId]);

  const fetchAudits = useCallback(async () => {
    if (!siteId) return;
    try {
      setAuditsLoading(true);
      const response = await sitesApi.getAudits(siteId, {
        limit: auditsPagination.limit,
        offset: auditsPagination.offset,
      });
      setAudits(response.data.audits);
      setAuditsPagination(response.data.pagination);
    } catch (err: any) {
      console.error('Failed to fetch audits:', err);
    } finally {
      setAuditsLoading(false);
    }
  }, [siteId, auditsPagination.limit, auditsPagination.offset]);

  const fetchUrls = useCallback(async () => {
    if (!siteId) return;
    try {
      setUrlsLoading(true);
      const response = await sitesApi.getUrls(siteId, {
        limit: urlsPagination.limit,
        offset: urlsPagination.offset,
      });
      setUrls(response.data.urls);
      setUrlsPagination(response.data.pagination);
    } catch (err: any) {
      console.error('Failed to fetch URLs:', err);
    } finally {
      setUrlsLoading(false);
    }
  }, [siteId, urlsPagination.limit, urlsPagination.offset]);

  useEffect(() => {
    fetchSite();
  }, [fetchSite]);

  useEffect(() => {
    if (activeTab === 'audits') {
      fetchAudits();
    } else if (activeTab === 'urls') {
      fetchUrls();
    }
  }, [activeTab, fetchAudits, fetchUrls]);

  const handleDiscoverPages = async () => {
    if (!siteId) return;
    try {
      setDiscoveringPages(true);
      const response = await sitesApi.discoverPages(siteId);
      toast(response.data.message, 'success');
      fetchUrls();
    } catch (err: any) {
      toast(err.response?.data?.error || 'Failed to discover pages', 'error');
    } finally {
      setDiscoveringPages(false);
    }
  };

  const handleDeleteSite = async () => {
    if (!siteId || !site) return;
    if (!confirm(`Delete "${site.name}"? This will NOT delete audit history, but the site will be removed.`)) return;

    try {
      await sitesApi.delete(siteId);
      toast('Site deleted', 'success');
      navigate('/sites');
    } catch (err: any) {
      toast(err.response?.data?.error || 'Failed to delete site', 'error');
    }
  };

  const handleGenerateVerificationToken = async () => {
    if (!siteId) return;
    try {
      setVerifying(true);
      const response = await sitesApi.generateVerificationToken(siteId);
      setVerificationInstructions(response.data);
    } catch (err: any) {
      toast(err.response?.data?.error || 'Failed to generate verification token', 'error');
    } finally {
      setVerifying(false);
    }
  };

  const handleVerify = async (method: 'dns' | 'file') => {
    if (!siteId) return;
    try {
      setVerifying(true);
      const response = await sitesApi.verify(siteId, method);
      if (response.data.verified) {
        toast('Site verified successfully!', 'success');
        fetchSite();
        setVerificationInstructions(null);
      } else {
        toast(response.data.error || 'Verification failed', 'error');
      }
    } catch (err: any) {
      toast(err.response?.data?.error || 'Verification failed', 'error');
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-6xl mx-auto space-y-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !site) {
    return (
      <DashboardLayout>
        <div className="max-w-6xl mx-auto">
          <Alert variant="error">{error || 'Site not found'}</Alert>
          <Link to="/sites" className="text-indigo-600 hover:underline mt-4 inline-block">
            &larr; Back to Sites
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const tabs: { id: TabType; label: string; requirePermission?: SitePermission[] }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'audits', label: 'Audits' },
    { id: 'urls', label: 'URLs' },
    { id: 'settings', label: 'Settings', requirePermission: ['owner', 'admin'] },
  ];

  const visibleTabs = tabs.filter(tab => {
    if (!tab.requirePermission) return true;
    return tab.requirePermission.includes(site.permission);
  });

  const prevScore = scoreHistory.length > 1 ? scoreHistory[scoreHistory.length - 2] : null;
  const canManage = site.permission === 'owner' || site.permission === 'admin';
  const canEdit = canManage || site.permission === 'editor';

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-2">
              <Link to="/sites" className="hover:text-indigo-600">&larr; Sites</Link>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{site.name}</h1>
              {site.verified && (
                <span className="px-2 py-0.5 text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full">
                  Verified
                </span>
              )}
              <span className="px-2 py-0.5 text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full capitalize">
                {site.permission}
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 mt-1">{site.domain}</p>
            {site.description && (
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">{site.description}</p>
            )}
          </div>
          <div className="flex gap-2">
            {canManage && (
              <Button variant="outline" onClick={handleDeleteSite}>
                Delete
              </Button>
            )}
            {canEdit && (
              <Button onClick={() => navigate(`/audits/new?domain=${encodeURIComponent(site.domain)}&siteId=${site.id}`)}>
                Run Audit
              </Button>
            )}
          </div>
        </div>

        {/* Score Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ScoreCard label="SEO" score={site.stats.latestScores?.seo ?? null} prevScore={prevScore?.seo} />
          <ScoreCard label="Accessibility" score={site.stats.latestScores?.accessibility ?? null} prevScore={prevScore?.accessibility} />
          <ScoreCard label="Security" score={site.stats.latestScores?.security ?? null} prevScore={prevScore?.security} />
          <ScoreCard label="Performance" score={site.stats.latestScores?.performance ?? null} prevScore={prevScore?.performance} />
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200 dark:border-slate-700">
          <nav className="flex gap-6">
            {visibleTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <ScoreHistoryChart history={scoreHistory} />

            <div className="grid md:grid-cols-2 gap-6">
              {/* Quick Stats */}
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="font-medium text-slate-900 dark:text-white mb-4">Quick Stats</h3>
                <dl className="space-y-3">
                  <div className="flex justify-between">
                    <dt className="text-slate-500 dark:text-slate-400">Total Audits</dt>
                    <dd className="font-medium text-slate-900 dark:text-white">{site.stats.totalAudits}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500 dark:text-slate-400">URLs Tracked</dt>
                    <dd className="font-medium text-slate-900 dark:text-white">{site.stats.urlCount}</dd>
                  </div>
                  {site.stats.lastAuditAt && (
                    <div className="flex justify-between">
                      <dt className="text-slate-500 dark:text-slate-400">Last Audit</dt>
                      <dd className="font-medium text-slate-900 dark:text-white">{formatDate(site.stats.lastAuditAt)}</dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt className="text-slate-500 dark:text-slate-400">Created</dt>
                    <dd className="font-medium text-slate-900 dark:text-white">{formatDate(site.createdAt)}</dd>
                  </div>
                </dl>
              </div>

              {/* Recent Activity */}
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="font-medium text-slate-900 dark:text-white mb-4">Recent Audits</h3>
                {audits.length === 0 && !auditsLoading ? (
                  <p className="text-slate-400 dark:text-slate-500 text-sm">No audits yet</p>
                ) : auditsLoading ? (
                  <p className="text-slate-400 dark:text-slate-500 text-sm">Loading...</p>
                ) : (
                  <ul className="space-y-3">
                    {audits.slice(0, 5).map(audit => (
                      <li key={audit.id}>
                        <Link
                          to={`/audits/${audit.id}`}
                          className="flex justify-between items-center text-sm hover:bg-slate-50 dark:hover:bg-slate-700/50 -mx-2 px-2 py-1 rounded"
                        >
                          <span className="text-slate-700 dark:text-slate-300">{formatDate(audit.createdAt)}</span>
                          <span className={`font-medium ${
                            audit.status === 'completed' ? 'text-emerald-600' :
                            audit.status === 'failed' ? 'text-red-600' :
                            'text-amber-600'
                          }`}>
                            {audit.status}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
                {audits.length > 5 && (
                  <button
                    onClick={() => setActiveTab('audits')}
                    className="text-indigo-600 dark:text-indigo-400 text-sm mt-3 hover:underline"
                  >
                    View all audits &rarr;
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'audits' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {auditsPagination.total} total audits
              </span>
              {canEdit && (
                <Button onClick={() => navigate(`/audits/new?domain=${encodeURIComponent(site.domain)}&siteId=${site.id}`)}>
                  Run New Audit
                </Button>
              )}
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700">
              {auditsLoading ? (
                <div className="p-8 text-center text-slate-400 dark:text-slate-500">Loading audits...</div>
              ) : audits.length === 0 ? (
                <div className="p-8 text-center">
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No audits yet</h3>
                  <p className="text-slate-500 dark:text-slate-400 mb-4">Run your first audit to see results.</p>
                  {canEdit && (
                    <Button onClick={() => navigate(`/audits/new?domain=${encodeURIComponent(site.domain)}&siteId=${site.id}`)}>
                      Run First Audit
                    </Button>
                  )}
                </div>
              ) : (
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                  <thead className="bg-slate-50 dark:bg-slate-900/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">SEO</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">A11y</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Security</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Perf</th>
                      <th className="px-6 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                    {audits.map(audit => (
                      <tr key={audit.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                        <td className="px-6 py-4">
                          <div className="text-sm text-slate-900 dark:text-white">{formatDate(audit.createdAt)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            audit.status === 'completed' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' :
                            audit.status === 'failed' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                            'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                          }`}>
                            {audit.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {audit.seoScore !== null ? (
                            <span className={getScoreColor(audit.seoScore)}>{audit.seoScore}</span>
                          ) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {audit.accessibilityScore !== null ? (
                            <span className={getScoreColor(audit.accessibilityScore)}>{audit.accessibilityScore}</span>
                          ) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {audit.securityScore !== null ? (
                            <span className={getScoreColor(audit.securityScore)}>{audit.securityScore}</span>
                          ) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {audit.performanceScore !== null ? (
                            <span className={getScoreColor(audit.performanceScore)}>{audit.performanceScore}</span>
                          ) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <Link to={`/audits/${audit.id}`} className="text-indigo-600 dark:text-indigo-400 hover:underline">
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {activeTab === 'urls' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {urlsPagination.total} URLs tracked
              </span>
              {canEdit && (
                <Button
                  variant="outline"
                  onClick={handleDiscoverPages}
                  isLoading={discoveringPages}
                >
                  Discover from Sitemap
                </Button>
              )}
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700">
              {urlsLoading ? (
                <div className="p-8 text-center text-slate-400 dark:text-slate-500">Loading URLs...</div>
              ) : urls.length === 0 ? (
                <div className="p-8 text-center">
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No URLs tracked yet</h3>
                  <p className="text-slate-500 dark:text-slate-400 mb-4">
                    URLs are discovered automatically when you run audits or discover from sitemap.
                  </p>
                  {canEdit && (
                    <Button onClick={handleDiscoverPages} isLoading={discoveringPages}>
                      Discover from Sitemap
                    </Button>
                  )}
                </div>
              ) : (
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                  <thead className="bg-slate-50 dark:bg-slate-900/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">URL Path</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Source</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Audits</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Last Audit</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Scores</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                    {urls.map(url => (
                      <tr key={url.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                        <td className="px-6 py-4">
                          <div className="text-sm text-slate-900 dark:text-white font-mono truncate max-w-[300px]" title={url.urlPath}>
                            {url.urlPath || '/'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            url.source === 'sitemap' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                            url.source === 'audit' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' :
                            'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                          }`}>
                            {url.source}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                          {url.auditCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                          {url.lastAuditedAt ? formatDate(url.lastAuditedAt) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex gap-2">
                            {url.lastSeoScore !== null && <span className={getScoreColor(url.lastSeoScore)}>{url.lastSeoScore}</span>}
                            {url.lastAccessibilityScore !== null && <span className={getScoreColor(url.lastAccessibilityScore)}>{url.lastAccessibilityScore}</span>}
                            {url.lastSecurityScore !== null && <span className={getScoreColor(url.lastSecurityScore)}>{url.lastSecurityScore}</span>}
                            {url.lastPerformanceScore !== null && <span className={getScoreColor(url.lastPerformanceScore)}>{url.lastPerformanceScore}</span>}
                            {url.lastSeoScore === null && '-'}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && canManage && (
          <div className="space-y-6">
            {/* Domain Verification */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Domain Verification</h3>

              {site.verified ? (
                <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-emerald-800 dark:text-emerald-300">Domain Verified</p>
                    <p className="text-sm text-emerald-600 dark:text-emerald-400">
                      {site.verificationMethod
                        ? `Verified via ${site.verificationMethod} on ${site.verifiedAt ? new Date(site.verifiedAt).toLocaleDateString() : 'unknown'}`
                        : 'Domain ownership confirmed'
                      }
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-slate-600 dark:text-slate-400">
                    Verify your domain ownership to unlock multi-page audits and faster scanning.
                  </p>

                  {!verificationInstructions ? (
                    <Button onClick={handleGenerateVerificationToken} isLoading={verifying}>
                      Start Verification
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Choose one of the methods below to prove you own <span className="font-medium text-slate-700 dark:text-slate-300">{site.domain}</span>. You only need to complete one.
                      </p>

                      {/* DNS Option */}
                      <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                        <h4 className="font-medium text-slate-900 dark:text-white mb-1">Option 1: DNS TXT Record</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                          Best if you have access to your domain's DNS settings (e.g. Cloudflare, GoDaddy, Namecheap, Route 53).
                        </p>

                        <div className="space-y-3">
                          <div>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Record type</p>
                            <code className="block p-2 bg-slate-100 dark:bg-slate-900 rounded text-sm font-mono">TXT</code>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Host / Name</p>
                            <code className="block p-2 bg-slate-100 dark:bg-slate-900 rounded text-sm font-mono">_pagepulser</code>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Value</p>
                            <code className="block p-2 bg-slate-100 dark:bg-slate-900 rounded text-sm font-mono break-all">
                              {verificationInstructions.instructions.dns.value}
                            </code>
                          </div>
                        </div>

                        <details className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                          <summary className="cursor-pointer hover:text-slate-700 dark:hover:text-slate-300 font-medium">
                            Step-by-step guide
                          </summary>
                          <ol className="mt-2 ml-4 list-decimal space-y-1.5">
                            <li>Log in to your DNS provider (wherever you bought or manage your domain)</li>
                            <li>Find the DNS records or DNS management section</li>
                            <li>Add a new <strong>TXT</strong> record with host <code className="font-mono text-xs bg-slate-100 dark:bg-slate-900 px-1 rounded">_pagepulser</code></li>
                            <li>Paste the token above as the record value</li>
                            <li>Save the record and wait a few minutes for DNS propagation (can take up to 24 hours, but usually 5-10 minutes)</li>
                            <li>Click "Verify DNS" below once the record is live</li>
                          </ol>
                        </details>

                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-3"
                          onClick={() => handleVerify('dns')}
                          isLoading={verifying}
                        >
                          Verify DNS
                        </Button>
                      </div>

                      {/* File Option */}
                      <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                        <h4 className="font-medium text-slate-900 dark:text-white mb-1">Option 2: Verification File</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                          Best if you have SSH or FTP access to your web server.
                        </p>

                        <div className="space-y-3">
                          <div>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">File URL (must be publicly accessible)</p>
                            <code className="block p-2 bg-slate-100 dark:bg-slate-900 rounded text-sm font-mono break-all">
                              https://{site.domain}{verificationInstructions.instructions.file.path}
                            </code>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">File contents (paste this exact token)</p>
                            <code className="block p-2 bg-slate-100 dark:bg-slate-900 rounded text-sm font-mono break-all">
                              {verificationInstructions.instructions.file.content}
                            </code>
                          </div>
                        </div>

                        <details className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                          <summary className="cursor-pointer hover:text-slate-700 dark:hover:text-slate-300 font-medium">
                            Step-by-step guide
                          </summary>
                          <ol className="mt-2 ml-4 list-decimal space-y-1.5">
                            <li>Connect to your server via SSH or FTP</li>
                            <li>Navigate to your website's <strong>public root</strong> directory (where your <code className="font-mono text-xs bg-slate-100 dark:bg-slate-900 px-1 rounded">index.html</code> or <code className="font-mono text-xs bg-slate-100 dark:bg-slate-900 px-1 rounded">index.php</code> lives — for Laravel/Symfony this is the <code className="font-mono text-xs bg-slate-100 dark:bg-slate-900 px-1 rounded">public/</code> folder)</li>
                            <li>Create the <code className="font-mono text-xs bg-slate-100 dark:bg-slate-900 px-1 rounded">.well-known</code> directory if it doesn't exist: <code className="font-mono text-xs bg-slate-100 dark:bg-slate-900 px-1 rounded">mkdir -p .well-known</code></li>
                            <li>Create the verification file with your token:
                              <code className="block mt-1 p-1.5 bg-slate-100 dark:bg-slate-900 rounded text-xs font-mono break-all">echo "{verificationInstructions.instructions.file.content}" &gt; .well-known/pagepulser-verification.txt</code>
                            </li>
                            <li>Check the file is accessible by visiting <code className="font-mono text-xs bg-slate-100 dark:bg-slate-900 px-1 rounded break-all">https://{site.domain}{verificationInstructions.instructions.file.path}</code> in your browser — you should see the token text</li>
                            <li>If you get a 403 or 404, your web server may block dotfile directories — check your server config allows access to <code className="font-mono text-xs bg-slate-100 dark:bg-slate-900 px-1 rounded">/.well-known/</code></li>
                          </ol>
                        </details>

                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-3"
                          onClick={() => handleVerify('file')}
                          isLoading={verifying}
                        >
                          Verify File
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Scanner Settings (only for verified sites) */}
            {site.verified && (
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Scanner Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-700 dark:text-slate-300">Ignore robots.txt</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Allow scanner to access pages blocked by robots.txt</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      site.ignoreRobotsTxt
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                    }`}>
                      {site.ignoreRobotsTxt ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-700 dark:text-slate-300">Rate Limit Profile</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Scanner request frequency</p>
                    </div>
                    <span className="px-2 py-1 text-xs rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 capitalize">
                      {site.rateLimitProfile}
                    </span>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}
      </div>

    </DashboardLayout>
  );
}
