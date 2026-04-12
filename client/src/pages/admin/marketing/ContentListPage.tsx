/**
 * Marketing Content List Page
 *
 * Table-based layout for browsing and managing marketing social content.
 * Includes platform/campaign/status/week/day filters, stats bar, and quick actions.
 */

import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../../../components/layout/AdminLayout';
import { adminApi } from '../../../services/api';
import { useToast } from '../../../components/ui/Toast';
import type {
  MarketingContent,
  MarketingContentStats,
  MarketingCampaign,
  MarketingPlatform,
  MarketingContentStatus,
} from '../../../types/admin.types';
import type { Pagination } from '../../../types/audit.types';
import {
  Plus, Search, Copy, Pencil, Trash2, Share2,
  ChevronLeft, ChevronRight,
} from 'lucide-react';

const DAY_NAMES: Record<number, string> = {
  1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday',
  5: 'Friday', 6: 'Saturday', 7: 'Sunday',
};

const DAY_SHORT: Record<number, string> = {
  1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu',
  5: 'Fri', 6: 'Sat', 7: 'Sun',
};

// Platform config
const PLATFORMS: { value: MarketingPlatform; label: string; color: string; icon: string }[] = [
  { value: 'twitter', label: 'Twitter/X', color: 'bg-sky-500/20 text-sky-300', icon: '𝕏' },
  { value: 'linkedin', label: 'LinkedIn', color: 'bg-blue-500/20 text-blue-300', icon: 'in' },
  { value: 'instagram', label: 'Instagram', color: 'bg-pink-500/20 text-pink-300', icon: '📷' },
  { value: 'facebook', label: 'Facebook', color: 'bg-blue-600/20 text-blue-300', icon: 'f' },
  { value: 'threads', label: 'Threads', color: 'bg-slate-500/20 text-slate-300', icon: '@' },
  { value: 'other', label: 'Blog', color: 'bg-emerald-500/20 text-emerald-300', icon: '✎' },
];

const STATUS_BADGES: Record<MarketingContentStatus, string> = {
  draft: 'bg-slate-500/20 text-slate-300',
  ready: 'bg-amber-500/20 text-amber-300',
  posted: 'bg-green-500/20 text-green-300',
  archived: 'bg-slate-500/20 text-slate-500',
};

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'ready', label: 'Ready' },
  { value: 'posted', label: 'Posted' },
  { value: 'archived', label: 'Archived' },
];

export default function ContentListPage() {
  const { toast } = useToast();
  const [content, setContent] = useState<MarketingContent[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 50, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<MarketingContentStats | null>(null);
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);

  // Filters
  const [platform, setPlatform] = useState('');
  const [campaignId, setCampaignId] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [weekNumber, setWeekNumber] = useState(0);
  const [dayOfWeek, setDayOfWeek] = useState(0);

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setSearchDebounced(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchContent = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.listMarketingContent({
        platform: platform || undefined,
        campaign_id: campaignId || undefined,
        status: status || undefined,
        search: searchDebounced || undefined,
        week_number: weekNumber || undefined,
        day_of_week: dayOfWeek || undefined,
        page: pagination.page,
        limit: pagination.limit,
      });
      setContent(data.content);
      setPagination(data.pagination);
    } catch {
      toast('Failed to load content', 'error');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, platform, campaignId, status, searchDebounced, weekNumber, dayOfWeek]);

  const fetchMeta = useCallback(async () => {
    try {
      const [statsRes, campaignsRes] = await Promise.all([
        adminApi.getMarketingContentStats(),
        adminApi.listMarketingCampaigns(),
      ]);
      setStats(statsRes.data.stats);
      setCampaigns(campaignsRes.data.campaigns);
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => { fetchContent(); }, [fetchContent]);
  useEffect(() => { fetchMeta(); }, [fetchMeta]);

  // Reset page on filter change
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [platform, campaignId, status, searchDebounced, weekNumber, dayOfWeek]);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast('Copied to clipboard', 'success');
    } catch {
      toast('Failed to copy', 'error');
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await adminApi.updateMarketingContentStatus(id, newStatus);
      toast('Status updated', 'success');
      fetchContent();
      fetchMeta();
    } catch {
      toast('Failed to update status', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminApi.deleteMarketingContent(id);
      toast('Content deleted', 'success');
      setDeleteId(null);
      fetchContent();
      fetchMeta();
    } catch {
      toast('Failed to delete', 'error');
    }
  };

  const getPlatformConfig = (p: string) =>
    PLATFORMS.find(pl => pl.value === p) || PLATFORMS[PLATFORMS.length - 1];

  const hasFilters = !!(platform || campaignId || status || searchDebounced || weekNumber || dayOfWeek);

  return (
    <AdminLayout>
      <Helmet><title>Admin: Marketing Content | Kritano</title></Helmet>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight font-display">Marketing Content</h1>
            {stats && (
              <div className="flex items-center gap-3 mt-2">
                <span className="text-sm text-slate-500">{stats.total} total items</span>
                <span className="text-slate-600">·</span>
                {PLATFORMS.map(p => {
                  const count = stats.by_platform[p.value] || 0;
                  if (count === 0) return null;
                  return (
                    <span key={p.value} className={`text-xs px-2 py-0.5 rounded-full ${p.color}`}>
                      {p.label}: {count}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
          <Link
            to="/admin/marketing/content/new"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Content
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search content..."
              className="w-full pl-9 pr-3 py-2 bg-white/[0.02] border border-white/[0.06] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <select
            value={weekNumber}
            onChange={e => setWeekNumber(Number(e.target.value))}
            className="px-3 py-2 bg-white/[0.02] border border-white/[0.06] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value={0}>All Weeks</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>Week {i + 1}</option>
            ))}
          </select>
          <select
            value={dayOfWeek}
            onChange={e => setDayOfWeek(Number(e.target.value))}
            className="px-3 py-2 bg-white/[0.02] border border-white/[0.06] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value={0}>All Days</option>
            {Object.entries(DAY_NAMES).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
          <select
            value={platform}
            onChange={e => setPlatform(e.target.value)}
            className="px-3 py-2 bg-white/[0.02] border border-white/[0.06] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="">All Platforms</option>
            {PLATFORMS.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
          <select
            value={campaignId}
            onChange={e => setCampaignId(e.target.value)}
            className="px-3 py-2 bg-white/[0.02] border border-white/[0.06] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="">All Campaigns</option>
            {campaigns.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="px-3 py-2 bg-white/[0.02] border border-white/[0.06] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            {STATUS_OPTIONS.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          {hasFilters && (
            <button
              onClick={() => { setPlatform(''); setCampaignId(''); setStatus(''); setSearch(''); setWeekNumber(0); setDayOfWeek(0); }}
              className="px-3 py-2 text-xs text-indigo-400 hover:text-indigo-300 border border-indigo-500/30 rounded-lg hover:bg-indigo-500/10 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Content table */}
        {loading ? (
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg overflow-hidden">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-white/[0.06] last:border-b-0 animate-pulse">
                <div className="h-3 bg-white/[0.06] rounded w-12" />
                <div className="h-3 bg-white/[0.06] rounded w-10" />
                <div className="h-3 bg-white/[0.06] rounded w-16" />
                <div className="h-3 bg-white/[0.06] rounded flex-1" />
                <div className="h-3 bg-white/[0.06] rounded w-20" />
                <div className="h-3 bg-white/[0.06] rounded w-16" />
              </div>
            ))}
          </div>
        ) : content.length === 0 ? (
          <div className="text-center py-16 bg-white/[0.02] border border-white/[0.06] rounded-lg">
            <Share2 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No content found</p>
            {hasFilters && (
              <button
                onClick={() => { setPlatform(''); setCampaignId(''); setStatus(''); setSearch(''); setWeekNumber(0); setDayOfWeek(0); }}
                className="text-xs text-indigo-400 hover:text-indigo-300 mt-2"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] text-left">
                    <th className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider w-16">Week</th>
                    <th className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider w-16">Day</th>
                    <th className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider w-24">Platform</th>
                    <th className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Content</th>
                    <th className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider w-28">Campaign</th>
                    <th className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider w-24">Status</th>
                    <th className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider w-16 text-right">Chars</th>
                    <th className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider w-28 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {content.map(item => {
                    const platformConfig = getPlatformConfig(item.platform);

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-white/[0.02] transition-colors group"
                      >
                        {/* Week */}
                        <td className="px-4 py-3">
                          {item.week_number ? (
                            <span className="text-xs font-mono text-indigo-400">W{item.week_number}</span>
                          ) : (
                            <span className="text-xs text-slate-600">-</span>
                          )}
                        </td>

                        {/* Day */}
                        <td className="px-4 py-3">
                          {item.day_of_week ? (
                            <span className="text-xs text-slate-300">{DAY_SHORT[item.day_of_week]}</span>
                          ) : (
                            <span className="text-xs text-slate-600">-</span>
                          )}
                        </td>

                        {/* Platform */}
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1 ${platformConfig.color}`}>
                            <span>{platformConfig.icon}</span>
                            {platformConfig.label}
                          </span>
                        </td>

                        {/* Content (title + preview) */}
                        <td className="px-4 py-3 max-w-md">
                          <Link
                            to={`/admin/marketing/content/${item.id}/edit`}
                            className="block hover:text-indigo-400 transition-colors"
                          >
                            {item.title && (
                              <div className="text-sm font-medium text-white truncate mb-0.5">{item.title}</div>
                            )}
                            <div className="text-xs text-slate-500 truncate">
                              {item.preview || item.body.slice(0, 120)}
                            </div>
                          </Link>
                        </td>

                        {/* Campaign */}
                        <td className="px-4 py-3">
                          {item.campaign ? (
                            <span
                              className="text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap"
                              style={{
                                backgroundColor: `${item.campaign.color}20`,
                                color: item.campaign.color,
                              }}
                            >
                              {item.campaign.name}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-600">-</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <select
                            value={item.status}
                            onChange={e => handleStatusChange(item.id, e.target.value)}
                            className={`text-xs px-2 py-1 rounded-full font-medium border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${STATUS_BADGES[item.status]}`}
                          >
                            <option value="draft">Draft</option>
                            <option value="ready">Ready</option>
                            <option value="posted">Posted</option>
                            <option value="archived">Archived</option>
                          </select>
                        </td>

                        {/* Chars */}
                        <td className="px-4 py-3 text-right">
                          <span className="text-xs text-slate-500 font-mono">{item.char_count}</span>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleCopy(item.body)}
                              className="p-1.5 text-slate-500 hover:text-white hover:bg-white/[0.06] rounded transition-colors"
                              title="Copy content"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <Link
                              to={`/admin/marketing/content/${item.id}/edit`}
                              className="p-1.5 text-slate-500 hover:text-white hover:bg-white/[0.06] rounded transition-colors"
                              title="Edit"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Link>
                            {deleteId === item.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleDelete(item.id)}
                                  className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                                >
                                  Yes
                                </button>
                                <button
                                  onClick={() => setDeleteId(null)}
                                  className="px-2 py-1 text-xs text-slate-500 hover:text-white transition-colors"
                                >
                                  No
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteId(item.id)}
                                className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">
              Page {pagination.page} of {pagination.pages} ({pagination.total} items)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page <= 1}
                className="p-2 text-slate-500 hover:text-white disabled:opacity-50 disabled:hover:text-slate-500 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page >= pagination.pages}
                className="p-2 text-slate-500 hover:text-white disabled:opacity-50 disabled:hover:text-slate-500 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
