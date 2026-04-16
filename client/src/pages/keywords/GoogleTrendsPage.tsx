import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { auditsApi } from '../../services/api';
import { GoogleTrendsEmbed } from '../../components/keywords/GoogleTrendsEmbed';
import {
  TrendingUp,
  Map as MapIcon,
  Search,
  Loader2,
  ChevronDown,
  Tag,
  Globe,
  Clock,
  Check,
  Info,
  ExternalLink,
} from 'lucide-react';
import type { Audit, AuditPage } from '../../types/audit.types';

type ChartType = 'TIMESERIES' | 'GEO_MAP' | 'RELATED_QUERIES';

const TIME_RANGES = [
  { value: 'now 1-H', label: 'Past hour' },
  { value: 'now 4-H', label: 'Past 4 hours' },
  { value: 'now 1-d', label: 'Past day' },
  { value: 'now 7-d', label: 'Past 7 days' },
  { value: 'today 1-m', label: 'Past month' },
  { value: 'today 3-m', label: 'Past 3 months' },
  { value: 'today 12-m', label: 'Past 12 months' },
  { value: 'today 5-y', label: 'Past 5 years' },
];

const GEO_OPTIONS = [
  { value: '', label: 'Worldwide' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'US', label: 'United States' },
  { value: 'CA', label: 'Canada' },
  { value: 'AU', label: 'Australia' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'ES', label: 'Spain' },
  { value: 'IT', label: 'Italy' },
  { value: 'NL', label: 'Netherlands' },
  { value: 'IE', label: 'Ireland' },
  { value: 'IN', label: 'India' },
  { value: 'JP', label: 'Japan' },
  { value: 'BR', label: 'Brazil' },
];

const CHART_TYPES: { key: ChartType; label: string; icon: React.ElementType }[] = [
  { key: 'TIMESERIES', label: 'Interest Over Time', icon: TrendingUp },
  { key: 'GEO_MAP', label: 'Interest by Region', icon: MapIcon },
  { key: 'RELATED_QUERIES', label: 'Related Queries', icon: Search },
];

interface KeywordItem {
  keyword: string;
  pageUrl: string;
  pageTitle: string | null;
  density: number;
  occurrences: number;
}

export default function GoogleTrendsPage() {
  // Audit selection
  const [audits, setAudits] = useState<Audit[]>([]);
  const [selectedAuditId, setSelectedAuditId] = useState<string>('');
  const [auditsLoading, setAuditsLoading] = useState(true);

  // Keywords from audit pages
  const [keywords, setKeywords] = useState<KeywordItem[]>([]);
  const [keywordsLoading, setKeywordsLoading] = useState(false);

  // Selected keyword + comparison
  const [selectedKeyword, setSelectedKeyword] = useState<string>('');
  const [comparisonKeywords, setComparisonKeywords] = useState<string[]>([]);

  // Custom keyword search
  const [customKeyword, setCustomKeyword] = useState('');

  // Filters
  const [timeRange, setTimeRange] = useState('today 12-m');
  const [geo, setGeo] = useState('');
  const [activeChart, setActiveChart] = useState<ChartType>('TIMESERIES');

  // Load audits
  useEffect(() => {
    const load = async () => {
      try {
        const res = await auditsApi.list({ status: 'completed', limit: 50 });
        setAudits(res.data.audits);
        if (res.data.audits.length > 0) {
          setSelectedAuditId(res.data.audits[0].id);
        }
      } catch {
        // ignore
      } finally {
        setAuditsLoading(false);
      }
    };
    load();
  }, []);

  // Load keywords when audit changes
  const loadKeywords = useCallback(async () => {
    if (!selectedAuditId) return;

    setKeywordsLoading(true);
    setSelectedKeyword('');
    setComparisonKeywords([]);

    try {
      const res = await auditsApi.getPages(selectedAuditId, { limit: 200 });
      const pages: AuditPage[] = res.data.pages;

      const kws: KeywordItem[] = pages
        .filter((p) => p.keyword_data?.keyword)
        .map((p) => ({
          keyword: p.keyword_data!.keyword,
          pageUrl: p.url,
          pageTitle: p.title ?? null,
          density: p.keyword_data!.density,
          occurrences: p.keyword_data!.occurrences,
        }));

      // Deduplicate by keyword (keep highest occurrence)
      const uniqueMap: Record<string, KeywordItem> = {};
      kws.forEach((kw) => {
        const existing = uniqueMap[kw.keyword];
        if (!existing || kw.occurrences > existing.occurrences) {
          uniqueMap[kw.keyword] = kw;
        }
      });

      const sorted = Object.values(uniqueMap).sort(
        (a, b) => b.occurrences - a.occurrences
      );

      setKeywords(sorted);
      if (sorted.length > 0) {
        setSelectedKeyword(sorted[0].keyword);
      }
    } catch {
      // ignore
    } finally {
      setKeywordsLoading(false);
    }
  }, [selectedAuditId]);

  useEffect(() => {
    loadKeywords();
  }, [loadKeywords]);

  const toggleComparison = (kw: string) => {
    if (kw === selectedKeyword) return;
    setComparisonKeywords((prev) =>
      prev.includes(kw)
        ? prev.filter((k) => k !== kw)
        : prev.length >= 4
          ? prev
          : [...prev, kw]
    );
  };

  const handleCustomSearch = () => {
    const trimmed = customKeyword.trim();
    if (!trimmed) return;
    setSelectedKeyword(trimmed);
    setComparisonKeywords([]);
    setCustomKeyword('');
  };

  const allCompareKeywords = comparisonKeywords.filter(
    (k) => k !== selectedKeyword
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Info banner */}
        <div className="flex items-start gap-3 p-4 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800">
          <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-indigo-700 dark:text-indigo-300">
            <p className="font-medium mb-1">Keyword Trend Explorer</p>
            <p className="text-indigo-600 dark:text-indigo-400">
              See how your target keywords are trending on Google. Select an audit to load its page keywords,
              or search any keyword directly. Compare up to 5 keywords side by side.
            </p>
          </div>
        </div>

        {/* Controls row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Audit selector */}
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
              Audit
            </label>
            <div className="relative">
              <select
                value={selectedAuditId}
                onChange={(e) => setSelectedAuditId(e.target.value)}
                disabled={auditsLoading}
                className="w-full appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 pr-8 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-50"
              >
                {auditsLoading && <option>Loading audits...</option>}
                {!auditsLoading && audits.length === 0 && (
                  <option>No completed audits</option>
                )}
                {audits.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.target_domain} - {new Date(a.created_at).toLocaleDateString()}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Geo filter */}
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
              <Globe className="w-3.5 h-3.5 inline mr-1" />
              Region
            </label>
            <div className="relative">
              <select
                value={geo}
                onChange={(e) => setGeo(e.target.value)}
                className="w-full appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 pr-8 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                {GEO_OPTIONS.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
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
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="w-full appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 pr-8 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                {TIME_RANGES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Custom keyword search */}
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
              <Search className="w-3.5 h-3.5 inline mr-1" />
              Search Any Keyword
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customKeyword}
                onChange={(e) => setCustomKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCustomSearch()}
                placeholder="e.g. web accessibility"
                className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              <button
                onClick={handleCustomSearch}
                disabled={!customKeyword.trim()}
                className="px-3 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Go
              </button>
            </div>
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
                  Page Keywords
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Click to view, tick to compare (max 5)
                </p>
              </div>

              <div className="max-h-[500px] overflow-y-auto">
                {keywordsLoading && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                  </div>
                )}

                {!keywordsLoading && keywords.length === 0 && (
                  <div className="px-4 py-8 text-center">
                    <Tag className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      No keyword data found
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      Run an audit with a target keyword to see results here
                    </p>
                  </div>
                )}

                {!keywordsLoading &&
                  keywords.map((kw) => {
                    const isSelected = selectedKeyword === kw.keyword;
                    const isComparing = comparisonKeywords.includes(kw.keyword);

                    return (
                      <div
                        key={kw.keyword}
                        className={`flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-700/50 last:border-b-0 cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-indigo-50 dark:bg-indigo-900/20'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                        }`}
                      >
                        {/* Compare checkbox */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleComparison(kw.keyword);
                          }}
                          disabled={
                            isSelected ||
                            (!isComparing && comparisonKeywords.length >= 4)
                          }
                          className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            isComparing
                              ? 'bg-indigo-600 border-indigo-600 text-white'
                              : isSelected
                                ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-100 dark:bg-indigo-900/30'
                                : 'border-slate-300 dark:border-slate-600 hover:border-indigo-400'
                          } disabled:opacity-40 disabled:cursor-not-allowed`}
                          title={
                            isSelected
                              ? 'Primary keyword'
                              : isComparing
                                ? 'Remove from comparison'
                                : 'Add to comparison'
                          }
                        >
                          {(isComparing || isSelected) && (
                            <Check className="w-3 h-3" />
                          )}
                        </button>

                        {/* Keyword info */}
                        <div
                          className="flex-1 min-w-0"
                          onClick={() => {
                            setSelectedKeyword(kw.keyword);
                            setComparisonKeywords((prev) =>
                              prev.filter((k) => k !== kw.keyword)
                            );
                          }}
                        >
                          <p
                            className={`text-sm font-medium truncate ${
                              isSelected
                                ? 'text-indigo-600 dark:text-indigo-400'
                                : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            {kw.keyword}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {kw.pageTitle || kw.pageUrl}
                          </p>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-xs text-slate-400 dark:text-slate-500">
                              {kw.density.toFixed(1)}% density
                            </span>
                            <span className="text-xs text-slate-400 dark:text-slate-500">
                              {kw.occurrences}x
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* Trends charts */}
          <div className="lg:col-span-3 space-y-4">
            {/* Active keyword display */}
            {selectedKeyword && (
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium">
                        <TrendingUp className="w-3.5 h-3.5" />
                        {selectedKeyword}
                      </span>
                      {allCompareKeywords.map((kw) => (
                        <span
                          key={kw}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full text-sm font-medium"
                        >
                          {kw}
                          <button
                            onClick={() =>
                              setComparisonKeywords((prev) =>
                                prev.filter((k) => k !== kw)
                              )
                            }
                            className="hover:text-amber-900 dark:hover:text-amber-100"
                          >
                            &times;
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <a
                    href={`https://trends.google.com/trends/explore?q=${encodeURIComponent(selectedKeyword)}&geo=${geo}&date=${encodeURIComponent(timeRange)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
                  >
                    Open in Google Trends
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}

            {/* Chart type tabs */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm">
              <div className="border-b border-slate-200 dark:border-slate-700 px-4">
                <nav className="flex gap-6 -mb-px">
                  {CHART_TYPES.map((ct) => {
                    const Icon = ct.icon;
                    const active = activeChart === ct.key;
                    return (
                      <button
                        key={ct.key}
                        onClick={() => setActiveChart(ct.key)}
                        className={`flex items-center gap-2 pb-3 pt-4 text-sm font-medium border-b-2 transition-colors ${
                          active
                            ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                            : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {ct.label}
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="p-4">
                {!selectedKeyword ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <TrendingUp className="w-12 h-12 text-slate-200 dark:text-slate-700 mb-3" />
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                      Select a keyword from the sidebar or search one above to view trends
                    </p>
                  </div>
                ) : (
                  <GoogleTrendsEmbed
                    key={`${selectedKeyword}-${allCompareKeywords.join(',')}-${activeChart}-${geo}-${timeRange}`}
                    keyword={selectedKeyword}
                    comparisonKeywords={allCompareKeywords}
                    type={activeChart}
                    geo={geo}
                    time={timeRange}
                  />
                )}
              </div>
            </div>

            {/* Attribution */}
            <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
              Data provided by Google Trends
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
