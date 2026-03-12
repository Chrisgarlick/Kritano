import { useState, useEffect, useRef, useCallback } from 'react';
import { sitesApi } from '../../services/api';
import { formatDate } from '../../utils/format';

interface KnownPage {
  id: string;
  url: string;
  urlPath: string;
  source: 'sitemap' | 'audit' | 'manual';
  lastSeenAt: string;
  lastAuditedAt: string | null;
  lastAuditId: string | null;
  priority: number | null;
  changefreq: string | null;
  createdAt: string;
}

interface KnownUrlPickerProps {
  siteId: string;
  onSelect: (url: string) => void;
  onClose: () => void;
}

export function KnownUrlPicker({
  siteId,
  onSelect,
  onClose,
}: KnownUrlPickerProps) {
  const [pages, setPages] = useState<KnownPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [pagination, setPagination] = useState({ total: 0, limit: 20, offset: 0 });
  const [discovering, setDiscovering] = useState(false);
  const [discoverMessage, setDiscoverMessage] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search input
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPagination(p => ({ ...p, offset: 0 }));
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  // Fetch pages
  const fetchPages = useCallback(async () => {
    try {
      setLoading(true);
      const response = await sitesApi.getUrls(siteId, {
        search: debouncedSearch || undefined,
        limit: pagination.limit,
        offset: pagination.offset,
        sortBy: 'url_path',
        sortOrder: 'asc',
      });
      // Map urls to pages format for compatibility
      setPages(response.data.urls.map(u => ({
        id: u.id,
        url: u.url,
        urlPath: u.urlPath,
        source: u.source,
        lastSeenAt: u.updatedAt,
        lastAuditedAt: u.lastAuditedAt,
        lastAuditId: u.lastAuditId,
        priority: u.sitemapPriority,
        changefreq: u.sitemapChangefreq,
        createdAt: u.createdAt,
      })));
      setPagination(response.data.pagination);
    } catch (err) {
      console.error('Failed to fetch known pages:', err);
    } finally {
      setLoading(false);
    }
  }, [siteId, debouncedSearch, pagination.limit, pagination.offset]);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  // Focus search input on mount
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Reset selection when pages change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [pages]);

  const handleDiscover = async () => {
    try {
      setDiscovering(true);
      setDiscoverMessage(null);
      const response = await sitesApi.discoverPages(siteId);
      setDiscoverMessage(response.data.message);
      // Refresh the list
      await fetchPages();
    } catch (err: any) {
      setDiscoverMessage(err.response?.data?.error || 'Failed to discover pages');
    } finally {
      setDiscovering(false);
    }
  };

  const handleSelectPage = (page: KnownPage) => {
    onSelect(page.url);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (pages.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < pages.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : pages.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < pages.length) {
          handleSelectPage(pages[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const item = listRef.current.children[selectedIndex] as HTMLElement;
      if (item) {
        item.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="url-picker-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-500 bg-opacity-75 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col"
          onKeyDown={handleKeyDown}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <h2 id="url-picker-title" className="text-lg font-semibold text-slate-900">
                Browse Known Pages
              </h2>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 transition-colors"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Select a page to audit from your sitemap or previously audited pages.
            </p>
          </div>

          {/* Search and Discover */}
          <div className="px-6 py-3 border-b border-slate-100 flex items-center gap-3">
            <div className="relative flex-1">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search pages by path..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <button
              onClick={handleDiscover}
              disabled={discovering}
              className="px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {discovering ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Discovering...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Discover from Sitemap
                </>
              )}
            </button>
          </div>

          {/* Discovery message */}
          {discoverMessage && (
            <div className={`px-6 py-2 text-sm ${
              discoverMessage.includes('Failed') ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
            }`}>
              {discoverMessage}
            </div>
          )}

          {/* Page list */}
          <div ref={listRef} className="flex-1 overflow-y-auto min-h-[200px]">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <svg className="w-6 h-6 text-indigo-600 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            ) : pages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-sm font-medium text-slate-900 mb-1">No pages found</h3>
                <p className="text-sm text-slate-500 max-w-xs">
                  {search
                    ? 'Try a different search term or discover pages from your sitemap.'
                    : 'Click "Discover from Sitemap" to find pages on your site.'}
                </p>
              </div>
            ) : (
              pages.map((page, index) => (
                <button
                  key={page.id}
                  onClick={() => handleSelectPage(page)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full text-left px-6 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                    index === selectedIndex ? 'bg-indigo-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-900 truncate" title={page.url}>
                        {page.urlPath || '/'}
                      </div>
                      <div className="text-xs text-slate-400 truncate mt-0.5" title={page.url}>
                        {page.url}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Source badge */}
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        page.source === 'sitemap' ? 'bg-blue-100 text-blue-700' :
                        page.source === 'audit' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {page.source}
                      </span>
                      {/* Last audit date */}
                      {page.lastAuditedAt && (
                        <span className="text-xs text-slate-400">
                          Audited {formatDate(page.lastAuditedAt)}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer with pagination */}
          {pagination.total > 0 && (
            <div className="px-6 py-3 border-t border-slate-200 flex items-center justify-between">
              <span className="text-sm text-slate-500">
                {pagination.offset + 1}-{Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total} pages
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination(p => ({ ...p, offset: Math.max(0, p.offset - p.limit) }))}
                  disabled={pagination.offset === 0}
                  className="px-3 py-1 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination(p => ({ ...p, offset: p.offset + p.limit }))}
                  disabled={pagination.offset + pagination.limit >= pagination.total}
                  className="px-3 py-1 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
