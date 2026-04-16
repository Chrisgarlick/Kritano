import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { api } from '../../services/api';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import {
  TrendingUp,
  TrendingDown,
  Search,
  Loader2,
  ChevronDown,
  Tag,
  Clock,
  Check,
  Info,
  MousePointerClick,
  Eye,
  Hash,
  ArrowUpDown,
  Minus,
} from 'lucide-react';

interface GscConnection {
  id: string;
  site_id: string;
  domain: string;
  gsc_property: string;
}

interface QueryRow {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  pages: number;
}

interface TrendPoint {
  date: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

type MetricKey = 'clicks' | 'impressions' | 'position' | 'ctr';

const DAYS_OPTIONS = [
  { value: 7, label: '7 days' },
  { value: 14, label: '14 days' },
  { value: 28, label: '28 days' },
  { value: 90, label: '90 days' },
];

const METRIC_TABS: { key: MetricKey; label: string; icon: React.ElementType; color: string }[] = [
  { key: 'clicks', label: 'Clicks', icon: MousePointerClick, color: '#4f46e5' },
  { key: 'impressions', label: 'Impressions', icon: Eye, color: '#0891b2' },
  { key: 'position', label: 'Position', icon: Hash, color: '#d97706' },
  { key: 'ctr', label: 'CTR', icon: ArrowUpDown, color: '#059669' },
];

const LINE_COLORS = ['#4f46e5', '#d97706', '#0891b2', '#dc2626', '#7c3aed'];

interface KeywordTrends {
  [keyword: string]: TrendPoint[];
}

export default function GoogleTrendsPage() {
  // Connection
  const [connections, setConnections] = useState<GscConnection[]>([]);
  const [activeConnectionId, setActiveConnectionId] = useState('');
  const [connectionsLoading, setConnectionsLoading] = useState(true);

  // Keywords list from GSC
  const [keywords, setKeywords] = useState<QueryRow[]>([]);
  const [keywordsLoading, setKeywordsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Selected keywords for charting
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);

  // Trend data
  const [trends, setTrends] = useState<KeywordTrends>({});
  const [trendsLoading, setTrendsLoading] = useState(false);

  // Filters
  const [days, setDays] = useState(28);
  const [activeMetric, setActiveMetric] = useState<MetricKey>('clicks');

  // Load connections
  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/gsc/connections');
        const conns: GscConnection[] = res.data.connections;
        setConnections(conns);
        if (conns.length > 0) {
          setActiveConnectionId(conns[0].id);
        }
      } catch {
        // ignore
      } finally {
        setConnectionsLoading(false);
      }
    };
    load();
  }, []);

  // Load keywords when connection or days change
  const loadKeywords = useCallback(async () => {
    if (!activeConnectionId) return;

    setKeywordsLoading(true);
    try {
      const res = await api.get(`/gsc/data/${activeConnectionId}/queries`, {
        params: {
          sortBy: 'clicks',
          sortDir: 'desc',
          limit: 100,
          search: searchTerm || undefined,
        },
      });
      setKeywords(res.data.queries || []);
    } catch {
      setKeywords([]);
    } finally {
      setKeywordsLoading(false);
    }
  }, [activeConnectionId, searchTerm]);

  useEffect(() => {
    loadKeywords();
  }, [loadKeywords]);

  // Load trend data for selected keywords
  const loadTrends = useCallback(async () => {
    if (!activeConnectionId || selectedKeywords.length === 0) {
      setTrends({});
      return;
    }

    setTrendsLoading(true);
    try {
      const results: KeywordTrends = {};
      await Promise.all(
        selectedKeywords.map(async (kw) => {
          const res = await api.get(
            `/gsc/data/${activeConnectionId}/queries/${encodeURIComponent(kw)}/trend`,
            { params: { days } }
          );
          results[kw] = res.data.trend || [];
        })
      );
      setTrends(results);
    } catch {
      // ignore
    } finally {
      setTrendsLoading(false);
    }
  }, [activeConnectionId, selectedKeywords, days]);

  useEffect(() => {
    loadTrends();
  }, [loadTrends]);

  const toggleKeyword = (kw: string) => {
    setSelectedKeywords((prev) => {
      if (prev.includes(kw)) {
        return prev.filter((k) => k !== kw);
      }
      if (prev.length >= 5) return prev;
      return [...prev, kw];
    });
  };

  // Build chart data - merge all keyword trends into one dataset keyed by date
  const chartData = (() => {
    const dateMap: Record<string, Record<string, number>> = {};

    selectedKeywords.forEach((kw) => {
      const points = trends[kw] || [];
      points.forEach((p) => {
        if (!dateMap[p.date]) dateMap[p.date] = {};
        dateMap[p.date][kw] = activeMetric === 'ctr' ? p.ctr * 100 : p[activeMetric];
      });
    });

    return Object.entries(dateMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, values]) => ({
        date,
        formattedDate: format(parseISO(date), 'MMM d'),
        ...values,
      }));
  })();

  // Calculate summary stats per keyword
  const getKeywordStats = (kw: string) => {
    const points = trends[kw] || [];
    if (points.length < 2) return null;

    const half = Math.floor(points.length / 2);
    const recent = points.slice(half);
    const earlier = points.slice(0, half);

    const avg = (arr: TrendPoint[], key: MetricKey) => {
      if (arr.length === 0) return 0;
      const sum = arr.reduce((s, p) => s + (key === 'ctr' ? p.ctr * 100 : p[key]), 0);
      return sum / arr.length;
    };

    const recentAvg = avg(recent, activeMetric);
    const earlierAvg = avg(earlier, activeMetric);
    const change = earlierAvg === 0 ? 0 : ((recentAvg - earlierAvg) / earlierAvg) * 100;

    return { recentAvg, change };
  };

  const formatMetricValue = (value: number) => {
    if (activeMetric === 'ctr') return `${value.toFixed(1)}%`;
    if (activeMetric === 'position') return value.toFixed(1);
    return value.toLocaleString();
  };

  // No connections state
  if (!connectionsLoading && connections.length === 0) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto text-center py-16">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <TrendingUp className="w-8 h-8 text-slate-400" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2">
            Keyword Trends
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            Connect Google Search Console first to track how your keywords perform over time.
          </p>
          <a
            href="/app/search-console"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Go to Search Console
          </a>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
              Keyword Trends
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Track how your keywords perform over time using Search Console data
            </p>
          </div>
        </div>

        {/* Controls row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Connection selector */}
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
              Property
            </label>
            <div className="relative">
              <select
                value={activeConnectionId}
                onChange={(e) => {
                  setActiveConnectionId(e.target.value);
                  setSelectedKeywords([]);
                  setTrends({});
                }}
                disabled={connectionsLoading}
                className="w-full appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 pr-8 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-50"
              >
                {connections.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.domain}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Time range */}
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
              <Clock className="w-3.5 h-3.5 inline mr-1" />
              Time Range
            </label>
            <div className="relative">
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="w-full appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 pr-8 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                {DAYS_OPTIONS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Search */}
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
              <Search className="w-3.5 h-3.5 inline mr-1" />
              Filter Keywords
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search keywords..."
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Keyword list sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm">
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Tag className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Keywords
                  {selectedKeywords.length > 0 && (
                    <span className="text-xs font-normal text-slate-500">
                      ({selectedKeywords.length}/5 selected)
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Select up to 5 to compare trends
                </p>
              </div>

              <div className="max-h-[600px] overflow-y-auto">
                {keywordsLoading && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                  </div>
                )}

                {!keywordsLoading && keywords.length === 0 && (
                  <div className="px-4 py-8 text-center">
                    <Tag className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      No keyword data yet
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      Sync Search Console to see your keywords here
                    </p>
                  </div>
                )}

                {!keywordsLoading &&
                  keywords.map((kw, idx) => {
                    const isSelected = selectedKeywords.includes(kw.query);
                    const colorIdx = selectedKeywords.indexOf(kw.query);

                    return (
                      <button
                        key={kw.query}
                        onClick={() => toggleKeyword(kw.query)}
                        disabled={!isSelected && selectedKeywords.length >= 5}
                        className={`w-full text-left flex items-center gap-2.5 px-4 py-3 border-b border-slate-100 dark:border-slate-700/50 last:border-b-0 transition-colors ${
                          isSelected
                            ? 'bg-indigo-50 dark:bg-indigo-900/20'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                        } disabled:opacity-40 disabled:cursor-not-allowed`}
                      >
                        {/* Checkbox */}
                        <div
                          className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'border-transparent text-white'
                              : 'border-slate-300 dark:border-slate-600'
                          }`}
                          style={isSelected ? { backgroundColor: LINE_COLORS[colorIdx] || LINE_COLORS[0] } : undefined}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${
                            isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'
                          }`}>
                            {kw.query}
                          </p>
                          <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                            <span>{kw.clicks.toLocaleString()} clicks</span>
                            <span>pos {kw.position}</span>
                          </div>
                        </div>

                        {/* Rank badge */}
                        <span className="flex-shrink-0 text-xs text-slate-400 dark:text-slate-500 font-medium">
                          #{idx + 1}
                        </span>
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* Charts area */}
          <div className="lg:col-span-3 space-y-4">
            {selectedKeywords.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm">
                <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                  <TrendingUp className="w-12 h-12 text-slate-200 dark:text-slate-700 mb-3" />
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                    Select keywords from the list to compare their trends over time
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Selected keyword chips */}
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedKeywords.map((kw, idx) => (
                    <span
                      key={kw}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-white"
                      style={{ backgroundColor: LINE_COLORS[idx] }}
                    >
                      {kw}
                      <button
                        onClick={() => toggleKeyword(kw)}
                        className="hover:opacity-75"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                  {selectedKeywords.length > 1 && (
                    <button
                      onClick={() => setSelectedKeywords([])}
                      className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                {/* Metric tabs */}
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm">
                  <div className="border-b border-slate-200 dark:border-slate-700 px-4">
                    <nav className="flex gap-6 -mb-px">
                      {METRIC_TABS.map((mt) => {
                        const Icon = mt.icon;
                        const active = activeMetric === mt.key;
                        return (
                          <button
                            key={mt.key}
                            onClick={() => setActiveMetric(mt.key)}
                            className={`flex items-center gap-2 pb-3 pt-4 text-sm font-medium border-b-2 transition-colors ${
                              active
                                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            {mt.label}
                          </button>
                        );
                      })}
                    </nav>
                  </div>

                  <div className="p-4">
                    {trendsLoading ? (
                      <div className="flex items-center justify-center py-16">
                        <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                      </div>
                    ) : chartData.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <Info className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          No trend data available for this period
                        </p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={350}>
                        <LineChart
                          data={chartData}
                          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis
                            dataKey="formattedDate"
                            tick={{ fontSize: 12, fill: '#64748b' }}
                            tickLine={{ stroke: '#e2e8f0' }}
                            axisLine={{ stroke: '#e2e8f0' }}
                          />
                          <YAxis
                            tick={{ fontSize: 12, fill: '#64748b' }}
                            tickLine={{ stroke: '#e2e8f0' }}
                            axisLine={{ stroke: '#e2e8f0' }}
                            width={45}
                            reversed={activeMetric === 'position'}
                            tickFormatter={(v: number) =>
                              activeMetric === 'ctr' ? `${v}%` : v.toLocaleString()
                            }
                          />
                          <Tooltip
                            content={({ active, payload, label }) => {
                              if (!active || !payload || !payload.length) return null;
                              return (
                                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-3">
                                  <p className="text-sm font-medium text-slate-900 dark:text-white mb-2">
                                    {label}
                                  </p>
                                  <div className="space-y-1">
                                    {payload.map((entry: any) => (
                                      <div key={entry.dataKey} className="flex items-center justify-between gap-4 text-sm">
                                        <span className="flex items-center gap-2">
                                          <span
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: entry.color }}
                                          />
                                          <span className="text-slate-600 dark:text-slate-400 truncate max-w-[150px]">
                                            {entry.dataKey}
                                          </span>
                                        </span>
                                        <span className="font-medium text-slate-900 dark:text-white">
                                          {formatMetricValue(entry.value)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            }}
                          />
                          <Legend
                            wrapperStyle={{ paddingTop: '10px' }}
                            formatter={(value: string) => (
                              <span className="text-sm text-slate-600 dark:text-slate-400">{value}</span>
                            )}
                          />
                          {selectedKeywords.map((kw, idx) => (
                            <Line
                              key={kw}
                              type="monotone"
                              dataKey={kw}
                              stroke={LINE_COLORS[idx]}
                              strokeWidth={2}
                              dot={{ r: 3, fill: LINE_COLORS[idx] }}
                              activeDot={{ r: 5 }}
                            />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Summary cards */}
                {!trendsLoading && chartData.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedKeywords.map((kw, idx) => {
                      const stats = getKeywordStats(kw);
                      const isPositionMetric = activeMetric === 'position';
                      // For position, lower is better so flip the trend direction
                      const trendPositive = stats
                        ? isPositionMetric
                          ? stats.change < 0
                          : stats.change > 0
                        : false;
                      const trendNegative = stats
                        ? isPositionMetric
                          ? stats.change > 0
                          : stats.change < 0
                        : false;

                      return (
                        <div
                          key={kw}
                          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-4"
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <span
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: LINE_COLORS[idx] }}
                            />
                            <span className="text-sm font-medium text-slate-900 dark:text-white truncate">
                              {kw}
                            </span>
                          </div>
                          {stats ? (
                            <div className="flex items-end justify-between">
                              <div>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                  {formatMetricValue(stats.recentAvg)}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                  avg ({METRIC_TABS.find((m) => m.key === activeMetric)?.label})
                                </p>
                              </div>
                              <div className={`flex items-center gap-1 text-sm font-medium ${
                                trendPositive
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : trendNegative
                                    ? 'text-red-600 dark:text-red-400'
                                    : 'text-slate-400'
                              }`}>
                                {trendPositive ? (
                                  <TrendingUp className="w-4 h-4" />
                                ) : trendNegative ? (
                                  <TrendingDown className="w-4 h-4" />
                                ) : (
                                  <Minus className="w-4 h-4" />
                                )}
                                {Math.abs(stats.change).toFixed(1)}%
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-slate-400">Not enough data</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* Data source note */}
            <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
              Data from Google Search Console
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
