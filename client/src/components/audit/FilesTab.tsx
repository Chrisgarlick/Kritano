import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Image, FileText, Video, Music, Type, Palette, FileCode, File,
  ExternalLink, ChevronDown, ChevronRight, Search, ArrowUpDown,
} from 'lucide-react';
import { auditsApi } from '../../services/api';
import type { AuditAsset, AssetCategory, AssetTypeSummary, AssetPageRef } from '../../types/audit.types';
import { formatBytes } from '../../utils/format';

interface FilesTabProps {
  auditId: string;
}

const ASSET_TYPE_CONFIG: Record<AssetCategory, { icon: typeof Image; label: string; color: string }> = {
  image:      { icon: Image,    label: 'Images',      color: 'bg-blue-100 text-blue-700' },
  document:   { icon: FileText, label: 'Documents',   color: 'bg-amber-100 text-amber-700' },
  video:      { icon: Video,    label: 'Videos',      color: 'bg-purple-100 text-purple-700' },
  audio:      { icon: Music,    label: 'Audio',       color: 'bg-pink-100 text-pink-700' },
  font:       { icon: Type,     label: 'Fonts',       color: 'bg-emerald-100 text-emerald-700' },
  stylesheet: { icon: Palette,  label: 'Stylesheets', color: 'bg-cyan-100 text-cyan-700' },
  script:     { icon: FileCode, label: 'Scripts',     color: 'bg-orange-100 text-orange-700' },
  other:      { icon: File,     label: 'Other',       color: 'bg-slate-100 text-slate-600' },
};

const SORT_OPTIONS = [
  { value: 'page_count', label: 'Most pages' },
  { value: 'file_size', label: 'Largest' },
  { value: 'name', label: 'Name A-Z' },
];

export function FilesTab({ auditId }: FilesTabProps) {
  const [assets, setAssets] = useState<AuditAsset[]>([]);
  const [summary, setSummary] = useState<AssetTypeSummary[]>([]);
  const [totalAssets, setTotalAssets] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('page_count');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [expandedAsset, setExpandedAsset] = useState<string | null>(null);
  const [assetPages, setAssetPages] = useState<Record<string, AssetPageRef[]>>({});
  const [loadingPages, setLoadingPages] = useState<string | null>(null);
  const limit = 50;

  const fetchAssets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await auditsApi.getAssets(auditId, {
        type: typeFilter !== 'all' ? typeFilter : undefined,
        search: search || undefined,
        sort,
        order: sort === 'name' ? 'asc' : 'desc',
        limit,
        offset: currentPage * limit,
      });
      const data = response.data as any;
      setAssets(data.assets);
      setSummary(data.summary);
      setTotalAssets(data.totalAssets);
      setTotalPages(data.pagination.pages);
    } catch {
      setError('Failed to load file data.');
    } finally {
      setLoading(false);
    }
  }, [auditId, typeFilter, search, sort, currentPage]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(0);
  }, [typeFilter, search, sort]);

  const handleExpandAsset = async (assetId: string) => {
    if (expandedAsset === assetId) {
      setExpandedAsset(null);
      return;
    }
    setExpandedAsset(assetId);
    if (!assetPages[assetId]) {
      try {
        setLoadingPages(assetId);
        const response = await auditsApi.getAssetPages(auditId, assetId);
        setAssetPages(prev => ({ ...prev, [assetId]: response.data.pages }));
      } catch {
        // silently fail
      } finally {
        setLoadingPages(null);
      }
    }
  };

  if (loading && assets.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <svg className="animate-spin h-8 w-8 text-indigo-600" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400 text-sm">
        {error}
      </div>
    );
  }

  if (!loading && totalAssets === 0) {
    return (
      <div className="text-center py-16">
        <File className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No files discovered</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No files or assets were found during this audit. This could mean the pages had minimal external resources.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-slate-900 dark:text-white">
            {totalAssets.toLocaleString()} files discovered
          </h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {summary.map((s) => {
            const config = ASSET_TYPE_CONFIG[s.type as AssetCategory] || ASSET_TYPE_CONFIG.other;
            const Icon = config.icon;
            return (
              <button
                key={s.type}
                onClick={() => setTypeFilter(typeFilter === s.type ? 'all' : s.type)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  typeFilter === s.type
                    ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-300 dark:ring-indigo-700'
                    : config.color + ' hover:opacity-80'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {config.label}
                <span className="font-bold">{s.count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search files..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm
                       bg-white dark:bg-slate-900 text-slate-900 dark:text-white
                       focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-slate-500" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm
                       bg-white dark:bg-slate-900 text-slate-900 dark:text-white
                       focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Assets Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-500 px-4 py-3">Type</th>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-500 px-4 py-3">File</th>
                <th className="text-right text-xs font-medium text-slate-500 dark:text-slate-500 px-4 py-3">Size</th>
                <th className="text-center text-xs font-medium text-slate-500 dark:text-slate-500 px-4 py-3">Pages</th>
                <th className="text-center text-xs font-medium text-slate-500 dark:text-slate-500 px-4 py-3">Source</th>
                <th className="text-center text-xs font-medium text-slate-500 dark:text-slate-500 px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {assets.map((asset) => {
                const config = ASSET_TYPE_CONFIG[asset.asset_type] || ASSET_TYPE_CONFIG.other;
                const Icon = config.icon;
                const isExpanded = expandedAsset === asset.id;
                const pages = assetPages[asset.id];

                return (
                  <tr key={asset.id} className="group">
                    <td colSpan={6} className="p-0">
                      <div>
                        <div className="flex items-center px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          {/* Type */}
                          <div className="w-10 flex-shrink-0">
                            <div className={`w-8 h-8 rounded-lg ${config.color} flex items-center justify-center`}>
                              <Icon className="w-4 h-4" />
                            </div>
                          </div>

                          {/* File name + URL */}
                          <div className="flex-1 min-w-0 px-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                {asset.file_name || 'Unknown'}
                              </span>
                              {asset.file_extension && (
                                <span className="px-1.5 py-0.5 text-[10px] font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-500 rounded">
                                  .{asset.file_extension}
                                </span>
                              )}
                              <a
                                href={asset.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-slate-500 hover:text-indigo-500 flex-shrink-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-500 truncate mt-0.5 max-w-md">
                              {asset.url}
                            </p>
                          </div>

                          {/* Size */}
                          <div className="w-20 text-right text-sm text-slate-600 dark:text-slate-500 flex-shrink-0">
                            {asset.file_size_bytes ? formatBytes(asset.file_size_bytes) : '—'}
                          </div>

                          {/* Pages count (clickable) */}
                          <div className="w-20 text-center flex-shrink-0">
                            {asset.page_count > 1 ? (
                              <button
                                onClick={() => handleExpandAsset(asset.id)}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-md transition-colors"
                              >
                                {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                {asset.page_count}
                              </button>
                            ) : (
                              <span className="text-xs text-slate-500">1</span>
                            )}
                          </div>

                          {/* Source badge */}
                          <div className="w-20 text-center flex-shrink-0">
                            <span className={`inline-block px-2 py-0.5 text-[10px] font-medium rounded-full ${
                              asset.source === 'both' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' :
                              asset.source === 'network' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' :
                              'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-500'
                            }`}>
                              {asset.source === 'both' ? 'HTML+Net' : asset.source === 'network' ? 'Network' : 'HTML'}
                            </span>
                          </div>

                          {/* HTTP Status */}
                          <div className="w-16 text-center flex-shrink-0">
                            {asset.http_status ? (
                              <span className={`text-xs font-mono ${
                                asset.http_status >= 200 && asset.http_status < 300 ? 'text-emerald-600' :
                                asset.http_status >= 300 && asset.http_status < 400 ? 'text-amber-600' :
                                'text-red-600'
                              }`}>
                                {asset.http_status}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-500">—</span>
                            )}
                          </div>
                        </div>

                        {/* Expanded page list */}
                        {isExpanded && (
                          <div className="bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 px-12 py-3">
                            {loadingPages === asset.id ? (
                              <div className="text-xs text-slate-500">Loading pages...</div>
                            ) : pages && pages.length > 0 ? (
                              <div className="space-y-1.5">
                                <div className="text-xs font-medium text-slate-500 dark:text-slate-500 mb-2">
                                  Found on {pages.length} page{pages.length !== 1 ? 's' : ''}:
                                </div>
                                {pages.map((p) => (
                                  <div key={p.id} className="flex items-center gap-2 text-xs">
                                    <Link
                                      to={`/app/audits/${auditId}/pages/${p.id}`}
                                      className="text-indigo-600 dark:text-indigo-400 hover:underline truncate max-w-lg"
                                    >
                                      {p.title || p.url}
                                    </Link>
                                    {p.html_element && (
                                      <span className="text-slate-500 font-mono">
                                        &lt;{p.html_element}&gt;
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-xs text-slate-500">No page details available.</div>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            <div className="text-xs text-slate-500 dark:text-slate-500">
              Page {currentPage + 1} of {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className="px-3 py-1.5 text-xs font-medium border border-slate-200 dark:border-slate-700 rounded-md
                           text-slate-600 dark:text-slate-500 hover:bg-white dark:hover:bg-slate-800
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage >= totalPages - 1}
                className="px-3 py-1.5 text-xs font-medium border border-slate-200 dark:border-slate-700 rounded-md
                           text-slate-600 dark:text-slate-500 hover:bg-white dark:hover:bg-slate-800
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
