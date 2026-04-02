import { useState, useEffect, useMemo } from 'react';
import { Search, X, Link2 } from 'lucide-react';
import { analyticsApi } from '../../services/api';
import { Button } from '../ui/Button';
import { getScoreColor } from '../../types/analytics.types';
import type { UserAuditedUrl } from '../../types/analytics.types';

interface UrlSpec {
  siteId: string;
  urlId: string;
  url: string;
  siteName: string;
  siteDomain: string;
}

interface UrlSelectorProps {
  onCompare: (specs: [UrlSpec, UrlSpec]) => void;
  loading?: boolean;
}

export function UrlSelector({ onCompare, loading }: UrlSelectorProps) {
  const [urls, setUrls] = useState<UserAuditedUrl[]>([]);
  const [urlsLoading, setUrlsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [slotA, setSlotA] = useState<UrlSpec | null>(null);
  const [slotB, setSlotB] = useState<UrlSpec | null>(null);

  useEffect(() => {
    async function fetchUrls() {
      try {
        setUrlsLoading(true);
        const response = await analyticsApi.getUserUrls(undefined, 100);
        setUrls(response.data);
      } catch (err) {
        console.error('Failed to fetch URLs:', err);
      } finally {
        setUrlsLoading(false);
      }
    }
    fetchUrls();
  }, []);

  const filteredUrls = useMemo(() => {
    if (!search.trim()) return urls;
    const q = search.toLowerCase();
    return urls.filter(u =>
      u.url.toLowerCase().includes(q) ||
      u.siteName.toLowerCase().includes(q) ||
      u.siteDomain.toLowerCase().includes(q)
    );
  }, [urls, search]);

  // Group by site
  const groupedUrls = useMemo(() => {
    const groups: Record<string, { siteName: string; siteDomain: string; urls: UserAuditedUrl[] }> = {};
    for (const u of filteredUrls) {
      if (!groups[u.siteId]) {
        groups[u.siteId] = { siteName: u.siteName, siteDomain: u.siteDomain, urls: [] };
      }
      groups[u.siteId].urls.push(u);
    }
    return Object.entries(groups);
  }, [filteredUrls]);

  const selectUrl = (u: UserAuditedUrl) => {
    const spec: UrlSpec = {
      siteId: u.siteId,
      urlId: u.urlId,
      url: u.url,
      siteName: u.siteName,
      siteDomain: u.siteDomain,
    };

    if (!slotA) {
      setSlotA(spec);
    } else if (!slotB && u.urlId !== slotA.urlId) {
      setSlotB(spec);
    }
  };

  const isSelected = (urlId: string) =>
    slotA?.urlId === urlId || slotB?.urlId === urlId;

  const canCompare = slotA && slotB;

  return (
    <div className="space-y-4">
      {/* Selected slots */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Slot A */}
        <div className={`rounded-lg border-2 border-dashed p-4 ${slotA ? 'border-indigo-300 dark:border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20' : 'border-slate-200 dark:border-slate-600'}`}>
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">URL A</div>
          {slotA ? (
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{slotA.url}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{slotA.siteName}</p>
              </div>
              <button
                onClick={() => setSlotA(null)}
                className="text-slate-500 dark:text-slate-400 hover:text-red-500 flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">Select a URL from the list below</p>
          )}
        </div>

        {/* Slot B */}
        <div className={`rounded-lg border-2 border-dashed p-4 ${slotB ? 'border-indigo-300 dark:border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20' : 'border-slate-200 dark:border-slate-600'}`}>
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">URL B</div>
          {slotB ? (
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{slotB.url}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{slotB.siteName}</p>
              </div>
              <button
                onClick={() => setSlotB(null)}
                className="text-slate-500 dark:text-slate-400 hover:text-red-500 flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">Select a second URL to compare</p>
          )}
        </div>
      </div>

      {/* Compare button */}
      {canCompare && (
        <div className="flex justify-center">
          <Button
            onClick={() => onCompare([slotA!, slotB!])}
            disabled={loading}
          >
            {loading ? 'Comparing...' : 'Compare URLs'}
          </Button>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-400" />
        <input
          type="text"
          placeholder="Search URLs, sites..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
        />
      </div>

      {/* URL list */}
      <div className="border border-slate-200 dark:border-slate-700 rounded-lg max-h-96 overflow-y-auto bg-white dark:bg-slate-800">
        {urlsLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-6 h-6 border-4 border-indigo-200 dark:border-indigo-800 border-t-indigo-600 rounded-full mx-auto mb-2" />
            <p className="text-sm text-slate-500 dark:text-slate-400">Loading URLs...</p>
          </div>
        ) : groupedUrls.length === 0 ? (
          <div className="p-8 text-center">
            <Link2 className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {search ? 'No URLs match your search' : 'No audited URLs found'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {groupedUrls.map(([siteId, group]) => (
              <div key={siteId}>
                <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700 sticky top-0">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    {group.siteName}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">({group.siteDomain})</span>
                </div>
                {group.urls.map(u => {
                  const selected = isSelected(u.urlId);
                  return (
                    <button
                      key={u.urlId}
                      onClick={() => !selected && selectUrl(u)}
                      disabled={selected || (!!slotA && !!slotB)}
                      className={`w-full px-4 py-3 text-left transition-colors ${
                        selected
                          ? 'bg-indigo-50 dark:bg-indigo-900/20 cursor-default'
                          : slotA && slotB
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-slate-700 dark:text-slate-300 truncate">{u.urlPath || '/'}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{u.url}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {u.seoScore !== null && (
                            <span
                              className="text-xs font-medium px-1.5 py-0.5 rounded"
                              style={{ color: getScoreColor(u.seoScore), backgroundColor: `${getScoreColor(u.seoScore)}15` }}
                            >
                              SEO {u.seoScore}
                            </span>
                          )}
                          {u.contentScore !== null && (
                            <span
                              className="text-xs font-medium px-1.5 py-0.5 rounded"
                              style={{ color: getScoreColor(u.contentScore), backgroundColor: `${getScoreColor(u.contentScore)}15` }}
                            >
                              Content {u.contentScore}
                            </span>
                          )}
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {new Date(u.lastAuditedAt).toLocaleDateString()}
                          </span>
                          {selected && (
                            <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">Selected</span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
