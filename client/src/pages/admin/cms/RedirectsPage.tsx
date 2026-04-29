/**
 * Blog Redirects Manager
 *
 * View, create, and delete slug redirects so old blog URLs
 * 301-redirect to the current slug.
 */

import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { AdminLayout } from '../../../components/layout/AdminLayout';
import { adminApi } from '../../../services/api';
import type { BlogRedirectItem, BlogPostSummary } from '../../../services/api';
import { useToast } from '../../../components/ui/Toast';
import {
  ArrowRight, Plus, Trash2, RefreshCw, Search, X,
  ChevronLeft, ChevronRight, ExternalLink,
} from 'lucide-react';

export default function RedirectsPage() {
  const { toast } = useToast();

  const [redirects, setRedirects] = useState<BlogRedirectItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [newOldSlug, setNewOldSlug] = useState('');
  const [newPostId, setNewPostId] = useState('');
  const [postSearch, setPostSearch] = useState('');
  const [postResults, setPostResults] = useState<BlogPostSummary[]>([]);
  const [postSearching, setPostSearching] = useState(false);
  const [selectedPost, setSelectedPost] = useState<BlogPostSummary | null>(null);
  const [creating, setCreating] = useState(false);

  const fetchRedirects = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.listRedirects({ search: search || undefined, page, limit: 50 });
      setRedirects(data.redirects);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      toast('Failed to load redirects', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchRedirects();
  }, [fetchRedirects]);

  // Debounced post search for create form
  useEffect(() => {
    if (!postSearch.trim()) {
      setPostResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setPostSearching(true);
      try {
        const { data } = await adminApi.listPosts({ search: postSearch, limit: 10 });
        setPostResults(data.posts);
      } catch {
        // ignore
      } finally {
        setPostSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [postSearch]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this redirect? The old URL will return a 404.')) return;
    setActionLoading(id);
    try {
      await adminApi.deleteRedirect(id);
      toast('Redirect deleted', 'success');
      fetchRedirects();
    } catch {
      toast('Failed to delete redirect', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreate = async () => {
    if (!newOldSlug.trim() || !newPostId) {
      toast('Please enter a slug and select a target post', 'error');
      return;
    }

    const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugPattern.test(newOldSlug)) {
      toast('Slug must be lowercase letters, numbers, and hyphens only', 'error');
      return;
    }

    setCreating(true);
    try {
      await adminApi.createRedirect({ post_id: newPostId, old_slug: newOldSlug });
      toast('Redirect created', 'success');
      setShowCreate(false);
      setNewOldSlug('');
      setNewPostId('');
      setSelectedPost(null);
      setPostSearch('');
      fetchRedirects();
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Failed to create redirect';
      toast(msg, 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchRedirects();
  };

  return (
    <AdminLayout>
      <Helmet><title>Admin: Redirects | Kritano</title></Helmet>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight font-display">Blog Redirects</h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage slug redirects so old blog URLs forward to the current post
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Redirect
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10">
              <ArrowRight className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{total}</p>
              <p className="text-xs text-slate-500">Total Redirects</p>
            </div>
          </div>
        </div>

        {/* Search + Refresh */}
        <div className="flex items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by slug, title..."
              className="w-full pl-10 pr-4 py-2 bg-white/[0.02] border border-white/[0.06] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </form>
          <button
            onClick={fetchRedirects}
            className="p-2 bg-white/[0.02] border border-white/[0.06] rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Redirects Table */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading redirects...</div>
          ) : redirects.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              {search ? 'No redirects match your search' : 'No redirects yet. They are created automatically when you change a blog post slug.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Old Slug</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                      <span className="hidden sm:inline">Redirects To</span>
                      <span className="sm:hidden">Target</span>
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden lg:table-cell">Post</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden md:table-cell">Created</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {redirects.map(r => (
                    <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <code className="text-xs font-mono text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded">
                          /blog/{r.old_slug}
                        </code>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <ArrowRight className="w-3 h-3 text-slate-600 flex-shrink-0" />
                          <code className="text-xs font-mono text-green-300 bg-green-500/10 px-2 py-0.5 rounded">
                            /blog/{r.current_slug}
                          </code>
                          <a
                            href={`/blog/${r.current_slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-500 hover:text-white transition-colors flex-shrink-0"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="flex items-center gap-2">
                          <span className="text-white text-xs truncate max-w-[200px]">{r.post_title}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                            r.post_status === 'published'
                              ? 'bg-green-500/20 text-green-300'
                              : r.post_status === 'draft'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-slate-500/20 text-slate-400'
                          }`}>
                            {r.post_status}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 hidden md:table-cell">
                        {new Date(r.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDelete(r.id)}
                          disabled={actionLoading === r.id}
                          className="p-1.5 text-slate-500 hover:text-red-400 transition-colors disabled:opacity-50"
                          title="Delete redirect"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">{total} redirect{total !== 1 ? 's' : ''}</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-2 bg-white/[0.02] border border-white/[0.06] rounded-lg text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-slate-500">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-2 bg-white/[0.02] border border-white/[0.06] rounded-lg text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Create Redirect Modal */}
        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-[#15171e] border border-white/[0.08] rounded-xl shadow-2xl w-full max-w-lg mx-4">
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                <h2 className="text-lg font-bold text-white">Create Redirect</h2>
                <button onClick={() => setShowCreate(false)} className="text-slate-500 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Old slug */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Old Slug</label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">/blog/</span>
                    <input
                      type="text"
                      value={newOldSlug}
                      onChange={e => {
                        const val = e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9-]/g, '')
                          .replace(/-+/g, '-');
                        setNewOldSlug(val);
                      }}
                      placeholder="old-post-slug"
                      className="flex-1 px-3 py-2 bg-white/[0.02] border border-white/[0.06] rounded-lg text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1">The old URL that should redirect</p>
                </div>

                {/* Target post */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Redirect To (Post)</label>
                  {selectedPost ? (
                    <div className="flex items-center justify-between bg-white/[0.02] border border-white/[0.06] rounded-lg px-3 py-2">
                      <div>
                        <p className="text-sm text-white">{selectedPost.title}</p>
                        <code className="text-xs text-slate-500 font-mono">/blog/{selectedPost.slug}</code>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedPost(null);
                          setNewPostId('');
                          setPostSearch('');
                        }}
                        className="text-slate-500 hover:text-white ml-2"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        type="text"
                        value={postSearch}
                        onChange={e => setPostSearch(e.target.value)}
                        placeholder="Search for a post by title..."
                        className="w-full px-3 py-2 bg-white/[0.02] border border-white/[0.06] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                      {postSearching && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <RefreshCw className="w-3 h-3 text-slate-500 animate-spin" />
                        </div>
                      )}
                      {postResults.length > 0 && (
                        <div className="absolute z-10 mt-1 w-full bg-[#1a1d26] border border-white/[0.08] rounded-lg shadow-xl max-h-48 overflow-y-auto">
                          {postResults.map(p => (
                            <button
                              key={p.id}
                              onClick={() => {
                                setSelectedPost(p);
                                setNewPostId(p.id);
                                setPostResults([]);
                                setPostSearch('');
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-white/[0.04] transition-colors border-b border-white/[0.04] last:border-0"
                            >
                              <p className="text-sm text-white truncate">{p.title}</p>
                              <code className="text-xs text-slate-500 font-mono">/blog/{p.slug}</code>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Preview */}
                {newOldSlug && selectedPost && (
                  <div className="bg-white/[0.02] border border-white/[0.04] rounded-lg p-3">
                    <p className="text-xs text-slate-500 mb-1">Preview</p>
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="text-amber-300">/blog/{newOldSlug}</span>
                      <ArrowRight className="w-3 h-3 text-slate-500" />
                      <span className="text-green-300">/blog/{selectedPost.slug}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/[0.06]">
                <button
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={creating || !newOldSlug || !newPostId}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {creating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Create Redirect
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
