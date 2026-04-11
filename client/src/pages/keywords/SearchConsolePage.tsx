import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import {
  Search,
  ArrowUpDown,
  ExternalLink,
  RefreshCw,
  Link2,
  Unlink,
  TrendingUp,
  TrendingDown,
  MousePointerClick,
  Eye,
  Target,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Lock,
} from 'lucide-react';

interface GscConnection {
  id: string;
  site_id: string;
  domain: string;
  google_email: string;
  gsc_property: string;
  connected_at: string;
  last_sync_at: string | null;
  sync_status: string;
  sync_error: string | null;
}

interface OverviewStats {
  total_clicks: number;
  total_impressions: number;
  avg_ctr: number;
  avg_position: number;
  unique_queries: number;
  unique_pages: number;
}

interface TrendPoint {
  date: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface QueryRow {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  pages: number;
}

interface PageRow {
  page_url: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  queries: number;
}

interface Opportunity {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface CannibalResult {
  query: string;
  pageCount: number;
  pages: { url: string; clicks: number; impressions: number; position: number }[];
}

interface DomainOption {
  id: string;
  domain: string;
  verified: boolean;
}

type Tab = 'overview' | 'queries' | 'pages' | 'opportunities' | 'cannibalisation';

export default function SearchConsolePage() {
  const { subscription } = useAuth();
  const tier = subscription?.tier || 'free';
  const isGscAvailable = tier !== 'free';

  const [connections, setConnections] = useState<GscConnection[]>([]);
  const [domains, setDomains] = useState<DomainOption[]>([]);
  const [activeConnection, setActiveConnection] = useState<GscConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [connectSiteId, setConnectSiteId] = useState('');
  const [connectError, setConnectError] = useState<string | null>(null);

  // Data state
  const [tab, setTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [queries, setQueries] = useState<QueryRow[]>([]);
  const [queriesTotal, setQueriesTotal] = useState(0);
  const [pages, setPages] = useState<PageRow[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [cannibalisation, setCannibalisation] = useState<CannibalResult[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<string>('clicks');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [days, setDays] = useState(28);
  const [dataLoading, setDataLoading] = useState(false);
  const [expandedCannibal, setExpandedCannibal] = useState<string | null>(null);

  // Load connections and domains
  useEffect(() => {
    if (!isGscAvailable) {
      setLoading(false);
      return;
    }
    loadConnections();
  }, [isGscAvailable]);

  const loadConnections = async () => {
    try {
      const [connRes, domainsRes] = await Promise.all([
        api.get('/gsc/connections'),
        api.get('/gsc/domains'),
      ]);
      const conns = connRes.data.connections || [];
      setConnections(conns);
      setDomains(domainsRes.data.domains || []);

      if (conns.length > 0) {
        setActiveConnection(conns[0]);
      }
    } catch (err) {
      console.error('Failed to load GSC data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load data when connection or tab changes
  useEffect(() => {
    if (!activeConnection) return;
    loadTabData();
  }, [activeConnection, tab, days, sortBy, sortDir]);

  const loadTabData = useCallback(async () => {
    if (!activeConnection) return;
    setDataLoading(true);
    try {
      const connId = activeConnection.id;
      switch (tab) {
        case 'overview': {
          const res = await api.get(`/gsc/data/${connId}/overview?days=${days}`);
          setStats(res.data.stats);
          setTrend(res.data.trend);
          break;
        }
        case 'queries': {
          const params = new URLSearchParams({
            sortBy,
            sortDir,
            limit: '50',
            ...(searchTerm && { search: searchTerm }),
          });
          const res = await api.get(`/gsc/data/${connId}/queries?${params}`);
          setQueries(res.data.queries);
          setQueriesTotal(res.data.total);
          break;
        }
        case 'pages': {
          const params = new URLSearchParams({
            sortBy,
            sortDir,
            limit: '50',
            ...(searchTerm && { search: searchTerm }),
          });
          const res = await api.get(`/gsc/data/${connId}/pages?${params}`);
          setPages(res.data.pages);
          break;
        }
        case 'opportunities': {
          const res = await api.get(`/gsc/data/${connId}/opportunities?days=${days}`);
          setOpportunities(res.data.opportunities);
          break;
        }
        case 'cannibalisation': {
          const res = await api.get(`/gsc/data/${connId}/cannibalisation?days=${days}`);
          setCannibalisation(res.data.cannibalisation);
          break;
        }
      }
    } catch (err) {
      console.error('Failed to load tab data:', err);
    } finally {
      setDataLoading(false);
    }
  }, [activeConnection, tab, days, sortBy, sortDir, searchTerm]);

  const handleConnect = async () => {
    if (!connectSiteId) return;
    setConnecting(true);
    setConnectError(null);
    try {
      const res = await api.post('/gsc/connect', { siteId: connectSiteId });
      // Redirect to Google OAuth
      window.location.href = res.data.url;
    } catch (err: any) {
      setConnectError(err.response?.data?.error || 'Failed to connect');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!activeConnection || !confirm('Disconnect Search Console? All synced data will be deleted.')) return;
    try {
      await api.delete(`/gsc/connections/${activeConnection.site_id}`);
      setActiveConnection(null);
      loadConnections();
    } catch (err) {
      console.error('Failed to disconnect:', err);
    }
  };

  const handleSync = async () => {
    if (!activeConnection) return;
    setSyncing(true);
    try {
      await api.post(`/gsc/connections/${activeConnection.id}/sync`);
      loadTabData();
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setSyncing(false);
    }
  };

  const toggleSort = (col: string) => {
    if (sortBy === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortDir('desc');
    }
  };

  const formatNumber = (n: number) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toLocaleString();
  };

  const formatCtr = (ctr: number) => (ctr * 100).toFixed(1) + '%';
  const formatPosition = (pos: number) => pos.toFixed(1);

  // ========== Gated State ==========
  if (!isGscAvailable) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto text-center py-16">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <Lock className="w-8 h-8 text-slate-400" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white mb-3">
            Search Console
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Connect Google Search Console to see which queries drive traffic to your site,
            find CTR opportunities, and detect keyword cannibalisation.
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-500">
            Available on Starter plans and above.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
        </div>
      </DashboardLayout>
    );
  }

  // ========== No Connection State ==========
  if (!activeConnection) {
    const unconnectedDomains = domains.filter(
      d => !connections.some(c => c.site_id === d.id)
    );

    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto py-8">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2">
            Search Console
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-8">
            Connect a verified domain to Google Search Console to unlock keyword performance data.
          </p>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                <Link2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h2 className="font-medium text-slate-900 dark:text-white">Connect Search Console</h2>
                <p className="text-sm text-slate-500">Choose a verified domain to connect</p>
              </div>
            </div>

            {unconnectedDomains.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No verified domains available. Verify a domain in your site settings first.
              </p>
            ) : (
              <div className="space-y-4">
                {connectError && (
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300">
                    {connectError}
                  </div>
                )}
                <select
                  value={connectSiteId}
                  onChange={e => setConnectSiteId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="">Select a domain...</option>
                  {unconnectedDomains.map(d => (
                    <option key={d.id} value={d.id}>{d.domain}</option>
                  ))}
                </select>
                <button
                  onClick={handleConnect}
                  disabled={!connectSiteId || connecting}
                  className="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {connecting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Connecting...</>
                  ) : (
                    <><Link2 className="w-4 h-4" /> Connect with Google</>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ========== Connected Dashboard ==========
  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'overview', label: 'Overview', icon: TrendingUp },
    { key: 'queries', label: 'Queries', icon: Search },
    { key: 'pages', label: 'Pages', icon: ExternalLink },
    { key: 'opportunities', label: 'CTR Opportunities', icon: Target },
    { key: 'cannibalisation', label: 'Cannibalisation', icon: AlertTriangle },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
              Search Console
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {activeConnection.gsc_property} &middot; {activeConnection.google_email}
              {activeConnection.last_sync_at && (
                <> &middot; Last synced {new Date(activeConnection.last_sync_at).toLocaleDateString()}</>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={days}
              onChange={e => setDays(Number(e.target.value))}
              className="px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              <option value={7}>7 days</option>
              <option value={28}>28 days</option>
              <option value={90}>3 months</option>
            </select>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              Sync
            </button>
            <button
              onClick={handleDisconnect}
              className="px-3 py-1.5 text-sm border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-1.5"
            >
              <Unlink className="w-3.5 h-3.5" />
              Disconnect
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200 dark:border-slate-700">
          <nav className="flex gap-6 -mb-px">
            {tabs.map(t => {
              const Icon = t.icon;
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors ${
                    active
                      ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                      : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {t.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Loading */}
        {dataLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
          </div>
        )}

        {/* Overview Tab */}
        {!dataLoading && tab === 'overview' && stats && (
          <div className="space-y-6">
            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total Clicks" value={formatNumber(stats.total_clicks)} icon={MousePointerClick} color="indigo" />
              <StatCard label="Impressions" value={formatNumber(stats.total_impressions)} icon={Eye} color="blue" />
              <StatCard label="Avg CTR" value={formatCtr(stats.avg_ctr)} icon={Target} color="emerald" />
              <StatCard label="Avg Position" value={formatPosition(stats.avg_position)} icon={ArrowUpDown} color="amber" />
            </div>

            {/* Trend Chart (simple bar visualization) */}
            {trend.length > 0 && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-6">
                <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-4">Clicks Over Time</h3>
                <div className="flex items-end gap-[2px] h-32">
                  {trend.map((point, i) => {
                    const maxClicks = Math.max(...trend.map(t => t.clicks), 1);
                    const height = (point.clicks / maxClicks) * 100;
                    return (
                      <div
                        key={i}
                        className="flex-1 bg-indigo-500 dark:bg-indigo-400 rounded-t-sm hover:bg-indigo-600 dark:hover:bg-indigo-300 transition-colors cursor-default group relative"
                        style={{ height: `${Math.max(height, 1)}%` }}
                        title={`${point.date}: ${point.clicks} clicks`}
                      />
                    );
                  })}
                </div>
                <div className="flex justify-between mt-2 text-[10px] text-slate-400">
                  <span>{trend[0]?.date}</span>
                  <span>{trend[trend.length - 1]?.date}</span>
                </div>
              </div>
            )}

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-6">
                <p className="text-sm text-slate-500 dark:text-slate-400">Unique Queries</p>
                <p className="text-2xl font-semibold text-slate-900 dark:text-white mt-1">
                  {formatNumber(stats.unique_queries)}
                </p>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-6">
                <p className="text-sm text-slate-500 dark:text-slate-400">Indexed Pages</p>
                <p className="text-2xl font-semibold text-slate-900 dark:text-white mt-1">
                  {formatNumber(stats.unique_pages)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Queries Tab */}
        {!dataLoading && tab === 'queries' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter queries..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && loadTabData()}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <span className="text-sm text-slate-500">{queriesTotal.toLocaleString()} queries</span>
            </div>
            <DataTable
              columns={[
                { key: 'query', label: 'Query', sortable: true },
                { key: 'clicks', label: 'Clicks', sortable: true, align: 'right' },
                { key: 'impressions', label: 'Impressions', sortable: true, align: 'right' },
                { key: 'ctr', label: 'CTR', sortable: true, align: 'right' },
                { key: 'position', label: 'Position', sortable: true, align: 'right' },
              ]}
              rows={queries}
              sortBy={sortBy}
              sortDir={sortDir}
              onSort={toggleSort}
              renderCell={(row, col) => {
                if (col === 'query') return <span className="font-medium text-slate-900 dark:text-white">{row.query}</span>;
                if (col === 'ctr') return formatCtr(row.ctr);
                if (col === 'position') return formatPosition(row.position);
                if (col === 'clicks' || col === 'impressions') return formatNumber(row[col]);
                return row[col];
              }}
            />
          </div>
        )}

        {/* Pages Tab */}
        {!dataLoading && tab === 'pages' && (
          <div className="space-y-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Filter pages..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && loadTabData()}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <DataTable
              columns={[
                { key: 'page_url', label: 'Page', sortable: false },
                { key: 'clicks', label: 'Clicks', sortable: true, align: 'right' },
                { key: 'impressions', label: 'Impressions', sortable: true, align: 'right' },
                { key: 'ctr', label: 'CTR', sortable: true, align: 'right' },
                { key: 'position', label: 'Position', sortable: true, align: 'right' },
                { key: 'queries', label: 'Queries', sortable: false, align: 'right' },
              ]}
              rows={pages}
              sortBy={sortBy}
              sortDir={sortDir}
              onSort={toggleSort}
              renderCell={(row, col) => {
                if (col === 'page_url') {
                  const path = (() => { try { return new URL(row.page_url).pathname; } catch { return row.page_url; } })();
                  return (
                    <a href={row.page_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm truncate max-w-xs inline-block" title={row.page_url}>
                      {path}
                    </a>
                  );
                }
                if (col === 'ctr') return formatCtr(row.ctr);
                if (col === 'position') return formatPosition(row.position);
                if (col === 'clicks' || col === 'impressions' || col === 'queries') return formatNumber(row[col]);
                return row[col];
              }}
            />
          </div>
        )}

        {/* CTR Opportunities Tab */}
        {!dataLoading && tab === 'opportunities' && (
          <div className="space-y-4">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                These queries have high impressions but low CTR (under 3%). Improving your title tag and meta description for these queries could significantly increase traffic.
              </p>
            </div>
            {opportunities.length === 0 ? (
              <p className="text-sm text-slate-500 py-8 text-center">No CTR opportunities found. This is good - your titles and descriptions are performing well!</p>
            ) : (
              <DataTable
                columns={[
                  { key: 'query', label: 'Query', sortable: false },
                  { key: 'impressions', label: 'Impressions', sortable: false, align: 'right' },
                  { key: 'clicks', label: 'Clicks', sortable: false, align: 'right' },
                  { key: 'ctr', label: 'CTR', sortable: false, align: 'right' },
                  { key: 'position', label: 'Avg Position', sortable: false, align: 'right' },
                ]}
                rows={opportunities}
                sortBy=""
                sortDir="desc"
                onSort={() => {}}
                renderCell={(row, col) => {
                  if (col === 'query') return <span className="font-medium text-slate-900 dark:text-white">{row.query}</span>;
                  if (col === 'ctr') return <span className="text-red-600 dark:text-red-400 font-medium">{formatCtr(row.ctr)}</span>;
                  if (col === 'position') return formatPosition(row.position);
                  if (col === 'clicks' || col === 'impressions') return formatNumber(row[col]);
                  return row[col];
                }}
              />
            )}
          </div>
        )}

        {/* Cannibalisation Tab */}
        {!dataLoading && tab === 'cannibalisation' && (
          <div className="space-y-4">
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
              <p className="text-sm text-orange-800 dark:text-orange-200">
                These queries rank for multiple pages on your site. This can split ranking signals and hurt performance. Consider consolidating content or using canonical tags.
              </p>
            </div>
            {cannibalisation.length === 0 ? (
              <p className="text-sm text-slate-500 py-8 text-center">No cannibalisation detected. Each query maps to a single page.</p>
            ) : (
              <div className="space-y-3">
                {cannibalisation.map(item => (
                  <div key={item.query} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm">
                    <button
                      onClick={() => setExpandedCannibal(expandedCannibal === item.query ? null : item.query)}
                      className="w-full flex items-center justify-between p-4 text-left"
                    >
                      <div>
                        <span className="font-medium text-slate-900 dark:text-white">{item.query}</span>
                        <span className="ml-3 text-xs px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
                          {item.pageCount} pages
                        </span>
                      </div>
                      {expandedCannibal === item.query ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                    {expandedCannibal === item.query && (
                      <div className="border-t border-slate-100 dark:border-slate-800 px-4 pb-4">
                        <table className="w-full text-sm mt-3">
                          <thead>
                            <tr className="text-left text-slate-500 dark:text-slate-400">
                              <th className="pb-2 font-medium">Page</th>
                              <th className="pb-2 font-medium text-right">Clicks</th>
                              <th className="pb-2 font-medium text-right">Impressions</th>
                              <th className="pb-2 font-medium text-right">Position</th>
                            </tr>
                          </thead>
                          <tbody>
                            {item.pages.map((page, i) => {
                              const path = (() => { try { return new URL(page.url).pathname; } catch { return page.url; } })();
                              return (
                                <tr key={i} className="border-t border-slate-50 dark:border-slate-800/50">
                                  <td className="py-2">
                                    <a href={page.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline truncate max-w-xs inline-block">
                                      {path}
                                    </a>
                                  </td>
                                  <td className="py-2 text-right text-slate-700 dark:text-slate-300">{page.clicks}</td>
                                  <td className="py-2 text-right text-slate-700 dark:text-slate-300">{page.impressions}</td>
                                  <td className="py-2 text-right text-slate-700 dark:text-slate-300">{page.position}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

// ========== Reusable Components ==========

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: React.ElementType; color: string }) {
  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
    blue: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    amber: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-5">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
          <p className="text-xl font-semibold text-slate-900 dark:text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}

interface Column {
  key: string;
  label: string;
  sortable: boolean;
  align?: 'left' | 'right';
}

function DataTable({
  columns,
  rows,
  sortBy,
  sortDir,
  onSort,
  renderCell,
}: {
  columns: Column[];
  rows: any[];
  sortBy: string;
  sortDir: 'asc' | 'desc';
  onSort: (col: string) => void;
  renderCell: (row: any, col: string) => React.ReactNode;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-slate-500 py-8 text-center">No data available yet. Data will appear after the first sync.</p>;
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800">
              {columns.map(col => (
                <th
                  key={col.key}
                  className={`px-4 py-3 font-medium text-slate-500 dark:text-slate-400 ${
                    col.align === 'right' ? 'text-right' : 'text-left'
                  } ${col.sortable ? 'cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 select-none' : ''}`}
                  onClick={() => col.sortable && onSort(col.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sortable && sortBy === col.key && (
                      sortDir === 'desc' ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                {columns.map(col => (
                  <td key={col.key} className={`px-4 py-3 text-slate-700 dark:text-slate-300 ${col.align === 'right' ? 'text-right' : ''}`}>
                    {renderCell(row, col.key)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
