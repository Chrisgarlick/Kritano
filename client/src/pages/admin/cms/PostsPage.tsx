/**
 * Blog Posts Management
 *
 * Admin list page for managing CMS blog posts with search, filters,
 * status/category dropdowns, stats bar, and full CRUD actions.
 */

import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../../../components/layout/AdminLayout';
import { adminApi } from '../../../services/api';
import type { BlogPostSummary, BlogPostCategory, BlogPostStatus } from '../../../services/api';
import type { Pagination } from '../../../types/audit.types';
import { useToast } from '../../../components/ui/Toast';
import {
  FileText, Plus, Search, Pencil, Trash2, Eye, EyeOff,
  ChevronLeft, ChevronRight, RefreshCw, Clock, BarChart3,
  Archive,
} from 'lucide-react';

/* ---------- Constants ---------- */

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
];

const CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'All Categories' },
  { value: 'seo', label: 'SEO' },
  { value: 'accessibility', label: 'Accessibility' },
  { value: 'security', label: 'Security' },
  { value: 'performance', label: 'Performance' },
  { value: 'content-quality', label: 'Content Quality' },
  { value: 'structured-data', label: 'Structured Data' },
  { value: 'eeat', label: 'E-E-A-T' },
  { value: 'aeo', label: 'AEO' },
  { value: 'guides', label: 'Guides' },
  { value: 'case-studies', label: 'Case Studies' },
  { value: 'product-updates', label: 'Product Updates' },
];

const STATUS_BADGE: Record<BlogPostStatus, string> = {
  draft: 'bg-slate-500/20 text-slate-300',
  published: 'bg-green-500/20 text-green-300',
  archived: 'bg-amber-500/20 text-amber-300',
};

const STATUS_LABEL: Record<BlogPostStatus, string> = {
  draft: 'Draft',
  published: 'Published',
  archived: 'Archived',
};

function formatCategoryLabel(cat: BlogPostCategory): string {
  return cat
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/* ---------- Component ---------- */

export default function PostsPage() {
  const { toast } = useToast();

  const [posts, setPosts] = useState<BlogPostSummary[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  /* Stats derived from total counts - we track them separately so
     we can show all-time stats even when a filter is active. */
  const [stats, setStats] = useState({ total: 0, published: 0, draft: 0, archived: 0 });

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.listPosts({
        page: pagination.page,
        limit: pagination.limit,
        search: search || undefined,
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
      });
      setPosts(data.posts);
      setPagination(data.pagination);
    } catch (err) {
      toast('Failed to load blog posts', 'error');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, statusFilter, categoryFilter]);

  /** Fetch overall stats (unfiltered) once on mount. */
  const fetchStats = useCallback(async () => {
    try {
      const [allRes, pubRes, draftRes, archRes] = await Promise.all([
        adminApi.listPosts({ limit: 1 }),
        adminApi.listPosts({ limit: 1, status: 'published' }),
        adminApi.listPosts({ limit: 1, status: 'draft' }),
        adminApi.listPosts({ limit: 1, status: 'archived' }),
      ]);
      setStats({
        total: allRes.data.pagination.total,
        published: pubRes.data.pagination.total,
        draft: draftRes.data.pagination.total,
        archived: archRes.data.pagination.total,
      });
    } catch {
      /* stats are non-critical */
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  /* ---------- Actions ---------- */

  const handlePublish = async (post: BlogPostSummary) => {
    setActionLoading(post.id);
    try {
      await adminApi.publishPost(post.id);
      toast(`"${post.title}" published`, 'success');
      fetchPosts();
      fetchStats();
    } catch {
      toast('Failed to publish post', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnpublish = async (post: BlogPostSummary) => {
    setActionLoading(post.id);
    try {
      await adminApi.unpublishPost(post.id);
      toast(`"${post.title}" unpublished`, 'success');
      fetchPosts();
      fetchStats();
    } catch {
      toast('Failed to unpublish post', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (post: BlogPostSummary) => {
    if (!confirm(`Delete "${post.title}"? This cannot be undone.`)) return;
    setActionLoading(post.id);
    try {
      await adminApi.deletePost(post.id);
      toast('Post deleted', 'success');
      fetchPosts();
      fetchStats();
    } catch {
      toast('Failed to delete post', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setCategoryFilter('');
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  /* ---------- Pagination helpers ---------- */

  const goToPage = (p: number) =>
    setPagination((prev) => ({ ...prev, page: p }));

  const pageNumbers = (): number[] => {
    const { page, pages } = pagination;
    if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
    const nums: Set<number> = new Set([1, pages]);
    for (let i = Math.max(2, page - 1); i <= Math.min(pages - 1, page + 1); i++) {
      nums.add(i);
    }
    return Array.from(nums).sort((a, b) => a - b);
  };

  /* ---------- Render ---------- */

  return (
    <AdminLayout>
      <Helmet><title>Admin: Blog Posts | Kritano</title></Helmet>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight font-display">Blog Posts</h1>
            <p className="text-sm text-slate-500 mt-1">
              {stats.total} post{stats.total !== 1 ? 's' : ''} total &mdash; create and manage blog content
            </p>
          </div>
          <Link
            to="/admin/cms/posts/new"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Post
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total" value={stats.total} icon={FileText} color="text-white" bgColor="bg-white/[0.03]" />
          <StatCard label="Published" value={stats.published} icon={Eye} color="text-green-400" bgColor="bg-green-500/10" />
          <StatCard label="Drafts" value={stats.draft} icon={FileText} color="text-slate-300" bgColor="bg-white/[0.02]" />
          <StatCard label="Archived" value={stats.archived} icon={Archive} color="text-amber-400" bgColor="bg-amber-500/10" />
        </div>

        {/* Filter Row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search posts..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="w-full pl-9 pr-4 py-2 bg-white/[0.02] border border-white/[0.06] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="px-3 py-2 bg-white/[0.02] border border-white/[0.06] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="px-3 py-2 bg-white/[0.02] border border-white/[0.06] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => fetchPosts()}
            className="p-2 text-slate-500 hover:text-white transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Table */}
        <div className="bg-white/[0.02] rounded-lg border border-white/[0.06] overflow-hidden">
          {loading ? (
            /* Loading Skeleton */
            <div className="divide-y divide-white/[0.06]">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4">
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-2/3 bg-white/[0.06] rounded animate-pulse" />
                    <div className="h-3 w-1/3 bg-white/[0.04] rounded animate-pulse" />
                  </div>
                  <div className="h-5 w-16 bg-white/[0.06] rounded-full animate-pulse" />
                  <div className="h-5 w-16 bg-white/[0.06] rounded-full animate-pulse" />
                  <div className="h-4 w-10 bg-white/[0.06] rounded animate-pulse" />
                  <div className="h-4 w-14 bg-white/[0.06] rounded animate-pulse" />
                  <div className="h-4 w-20 bg-white/[0.06] rounded animate-pulse" />
                  <div className="h-6 w-24 bg-white/[0.06] rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            /* Empty State */
            <div className="text-center py-16">
              <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-1">No posts found</h3>
              <p className="text-sm text-slate-500 mb-4">
                {search || statusFilter || categoryFilter
                  ? 'Try adjusting your filters.'
                  : 'Create your first blog post to get started.'}
              </p>
              {(search || statusFilter || categoryFilter) && (
                <button
                  onClick={resetFilters}
                  className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.06] text-left text-sm text-slate-500">
                    <th className="px-6 py-3 font-medium">Title</th>
                    <th className="px-6 py-3 font-medium">Category</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium text-right">Views</th>
                    <th className="px-6 py-3 font-medium text-right">Reading Time</th>
                    <th className="px-6 py-3 font-medium">Date</th>
                    <th className="px-6 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {posts.map((post) => (
                    <tr key={post.id} className="hover:bg-white/[0.04] transition-colors">
                      {/* Title */}
                      <td className="px-6 py-4 max-w-xs">
                        <Link
                          to={`/admin/cms/posts/${post.id}/edit`}
                          className="block group"
                        >
                          <div className="font-medium text-white group-hover:text-indigo-300 transition-colors truncate">
                            {post.title}
                          </div>
                          {post.subtitle && (
                            <div className="text-sm text-slate-500 truncate">
                              {post.subtitle}
                            </div>
                          )}
                          <div className="text-xs text-slate-500 mt-0.5 truncate">
                            /{post.slug}
                          </div>
                          {post.excerpt && (
                            <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                              {post.excerpt}
                            </div>
                          )}
                        </Link>
                      </td>

                      {/* Category */}
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2 py-0.5 text-xs rounded-full font-medium bg-indigo-500/20 text-indigo-300">
                          {formatCategoryLabel(post.category)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-0.5 text-xs rounded-full font-medium ${STATUS_BADGE[post.status]}`}
                        >
                          {STATUS_LABEL[post.status]}
                        </span>
                      </td>

                      {/* Views */}
                      <td className="px-6 py-4 text-right text-sm text-slate-300">
                        <span className="inline-flex items-center gap-1">
                          <BarChart3 className="w-3.5 h-3.5 text-slate-500" />
                          {post.view_count.toLocaleString()}
                        </span>
                      </td>

                      {/* Reading Time */}
                      <td className="px-6 py-4 text-right text-sm text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          {post.reading_time_minutes} min
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                        {post.published_at
                          ? new Date(post.published_at).toLocaleDateString()
                          : new Date(post.updated_at).toLocaleDateString()}
                        <div className="text-xs text-slate-500">
                          {post.published_at ? 'Published' : 'Updated'}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex justify-end items-center gap-1">
                          <Link
                            to={`/admin/cms/posts/${post.id}/edit`}
                            className="p-1.5 text-slate-500 hover:text-white transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </Link>
                          {post.status === 'published' ? (
                            <button
                              onClick={() => handleUnpublish(post)}
                              disabled={actionLoading === post.id}
                              className="p-1.5 text-slate-500 hover:text-amber-400 transition-colors disabled:opacity-50"
                              title="Unpublish"
                            >
                              <EyeOff className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handlePublish(post)}
                              disabled={actionLoading === post.id}
                              className="p-1.5 text-slate-500 hover:text-green-400 transition-colors disabled:opacity-50"
                              title="Publish"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(post)}
                            disabled={actionLoading === post.id}
                            className="p-1.5 text-slate-500 hover:text-red-400 transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-sm text-slate-500">
              Showing {(pagination.page - 1) * pagination.limit + 1}&ndash;
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => goToPage(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="p-2 text-slate-500 hover:text-white disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {pageNumbers().map((num, idx, arr) => {
                const showGap = idx > 0 && num - arr[idx - 1] > 1;
                return (
                  <span key={num} className="flex items-center">
                    {showGap && (
                      <span className="px-1 text-slate-600">&hellip;</span>
                    )}
                    <button
                      onClick={() => goToPage(num)}
                      className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                        num === pagination.page
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-500 hover:text-white hover:bg-white/[0.06]'
                      }`}
                    >
                      {num}
                    </button>
                  </span>
                );
              })}
              <button
                onClick={() => goToPage(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="p-2 text-slate-500 hover:text-white disabled:opacity-30 transition-colors"
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

/* ---------- StatCard sub-component ---------- */

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  bgColor,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}) {
  return (
    <div className={`${bgColor} border border-white/[0.06] rounded-lg p-4 flex items-center gap-4`}>
      <div className={`p-2 rounded-lg bg-white/[0.02] ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value.toLocaleString()}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}
