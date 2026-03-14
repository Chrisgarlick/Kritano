/**
 * Success Stories Manager
 *
 * Admin page for managing customer success stories that showcase
 * impressive audit score improvements on the public-facing site.
 */

import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '../../../components/layout/AdminLayout';
import { adminApi } from '../../../services/api';
import type { SuccessStoryItem, CreateSuccessStoryInput, UpdateSuccessStoryInput } from '../../../services/api';
import type { Pagination } from '../../../types/audit.types';
import { useToast } from '../../../components/ui/Toast';
import {
  Trophy, Plus, Pencil, Trash2, RefreshCw,
  ChevronLeft, ChevronRight, X, Save, Eye, EyeOff,
  TrendingUp, ArrowUp,
} from 'lucide-react';

const CATEGORY_OPTIONS = [
  { value: 'seo', label: 'SEO' },
  { value: 'accessibility', label: 'Accessibility' },
  { value: 'security', label: 'Security' },
  { value: 'performance', label: 'Performance' },
  { value: 'content-quality', label: 'Content Quality' },
  { value: 'structured-data', label: 'Structured Data' },
  { value: 'eeat', label: 'E-E-A-T' },
  { value: 'aeo', label: 'AEO' },
];

function formatCategoryLabel(cat: string): string {
  return cat
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-400';
  if (score >= 60) return 'text-amber-400';
  if (score >= 40) return 'text-orange-400';
  return 'text-red-400';
}

interface StoryForm {
  domain: string;
  category: string;
  score_before: number;
  score_after: number;
  headline: string;
  is_published: boolean;
  display_order: number;
}

const EMPTY_FORM: StoryForm = {
  domain: '',
  category: 'seo',
  score_before: 0,
  score_after: 0,
  headline: '',
  is_published: false,
  display_order: 0,
};

export default function StoriesPage() {
  const { toast } = useToast();

  const [stories, setStories] = useState<SuccessStoryItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<StoryForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchStories = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.listStories({
        page: pagination.page,
        limit: pagination.limit,
      });
      setStories(data.stories);
      setPagination(data.pagination);
    } catch {
      toast('Failed to load success stories', 'error');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit]);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  const handleCreate = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowEditor(true);
  };

  const handleEdit = (item: SuccessStoryItem) => {
    setForm({
      domain: item.domain,
      category: item.category,
      score_before: item.score_before,
      score_after: item.score_after,
      headline: item.headline,
      is_published: item.is_published,
      display_order: item.display_order,
    });
    setEditingId(item.id);
    setShowEditor(true);
  };

  const handleSave = async () => {
    if (!form.domain || !form.headline) {
      toast('Domain and headline are required', 'error');
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        const input: UpdateSuccessStoryInput = {
          domain: form.domain,
          category: form.category,
          score_before: form.score_before,
          score_after: form.score_after,
          headline: form.headline,
          is_published: form.is_published,
          display_order: form.display_order,
        };
        await adminApi.updateStory(editingId, input);
        toast('Story updated', 'success');
      } else {
        const input: CreateSuccessStoryInput = {
          domain: form.domain,
          category: form.category,
          score_before: form.score_before,
          score_after: form.score_after,
          headline: form.headline,
          is_published: form.is_published,
          display_order: form.display_order,
        };
        await adminApi.createStory(input);
        toast('Story created', 'success');
      }
      setShowEditor(false);
      fetchStories();
    } catch {
      toast('Failed to save story', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (item: SuccessStoryItem) => {
    setActionLoading(item.id);
    try {
      await adminApi.updateStory(item.id, { is_published: !item.is_published });
      toast(item.is_published ? 'Story unpublished' : 'Story published', 'success');
      fetchStories();
    } catch {
      toast('Failed to update story', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this success story permanently?')) return;
    setActionLoading(id);
    try {
      await adminApi.deleteStory(id);
      toast('Story deleted', 'success');
      fetchStories();
    } catch {
      toast('Failed to delete story', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const goToPage = (p: number) =>
    setPagination((prev) => ({ ...prev, page: p }));

  const publishedCount = stories.filter((s) => s.is_published).length;
  const avgImprovement = stories.length > 0
    ? Math.round(stories.reduce((sum, s) => sum + (s.score_after - s.score_before), 0) / stories.length)
    : 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight" style={{ fontFamily: "'Instrument Serif', serif" }}>Success Stories</h1>
            <p className="text-sm text-slate-400 mt-1">
              Showcase customer audit score improvements on the public site
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Story
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total" value={pagination.total} icon={Trophy} color="text-white" bgColor="bg-white/[0.03]" />
          <StatCard label="Published" value={publishedCount} icon={Eye} color="text-green-400" bgColor="bg-green-500/10" />
          <StatCard label="Drafts" value={pagination.total - publishedCount} icon={EyeOff} color="text-slate-400" bgColor="bg-white/[0.02]" />
          <StatCard label="Avg. Improvement" value={avgImprovement} icon={TrendingUp} color="text-amber-400" bgColor="bg-amber-500/10" suffix="pts" />
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchStories()}
            className="p-2 text-slate-400 hover:text-white transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Stories Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-6">
                <div className="space-y-3">
                  <div className="h-5 w-1/2 bg-white/[0.06] rounded animate-pulse" />
                  <div className="h-4 w-full bg-white/[0.04] rounded animate-pulse" />
                  <div className="h-10 w-full bg-white/[0.03] rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : stories.length === 0 ? (
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg text-center py-16">
            <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-1">No success stories yet</h3>
            <p className="text-sm text-slate-400">Create stories to showcase on the public site.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stories.map((story) => {
              const improvement = story.score_after - story.score_before;
              return (
                <div
                  key={story.id}
                  className={`bg-white/[0.02] border rounded-lg p-6 transition-colors ${
                    story.is_published ? 'border-white/[0.06]' : 'border-white/[0.04] opacity-80'
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex px-2 py-0.5 text-xs rounded-full font-medium bg-indigo-500/20 text-indigo-300">
                        {formatCategoryLabel(story.category)}
                      </span>
                      {story.is_published ? (
                        <span className="inline-flex px-2 py-0.5 text-xs rounded-full font-medium bg-green-500/20 text-green-300">
                          Published
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 text-xs rounded-full font-medium bg-slate-500/20 text-slate-400">
                          Draft
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500">#{story.display_order}</span>
                  </div>

                  {/* Domain */}
                  <p className="text-sm text-slate-400 font-mono mb-1">{story.domain}</p>

                  {/* Headline */}
                  <h3 className="font-medium text-white mb-3">{story.headline}</h3>

                  {/* Score Change */}
                  <div className="flex items-center gap-3 p-3 bg-white/[0.03] rounded-lg mb-4">
                    <div className="text-center">
                      <p className={`text-2xl font-bold ${getScoreColor(story.score_before)}`}>
                        {story.score_before}
                      </p>
                      <p className="text-xs text-slate-500">Before</p>
                    </div>
                    <div className="flex items-center gap-1 text-green-400">
                      <ArrowUp className="w-4 h-4" />
                      <span className="font-bold">+{improvement}</span>
                    </div>
                    <div className="text-center">
                      <p className={`text-2xl font-bold ${getScoreColor(story.score_after)}`}>
                        {story.score_after}
                      </p>
                      <p className="text-xs text-slate-500">After</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      {new Date(story.created_at).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEdit(story)}
                        className="p-1.5 text-slate-400 hover:text-white transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleTogglePublish(story)}
                        disabled={actionLoading === story.id}
                        className="p-1.5 text-slate-400 hover:text-amber-400 transition-colors disabled:opacity-50"
                        title={story.is_published ? 'Unpublish' : 'Publish'}
                      >
                        {story.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleDelete(story.id)}
                        disabled={actionLoading === story.id}
                        className="p-1.5 text-slate-400 hover:text-red-400 transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-sm text-slate-400">
              Showing {(pagination.page - 1) * pagination.limit + 1}&ndash;
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => goToPage(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="p-2 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => goToPage(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="p-2 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowEditor(false)} />
          <div className="relative bg-white/[0.02] border border-white/[0.06] rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
              <h2 className="text-lg font-bold text-white">
                {editingId ? 'Edit Story' : 'New Success Story'}
              </h2>
              <button onClick={() => setShowEditor(false)} className="p-1 text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Domain */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Domain</label>
                <input
                  type="text"
                  value={form.domain}
                  onChange={(e) => setForm({ ...form, domain: e.target.value })}
                  placeholder="example.com"
                  className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              {/* Scores */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Score Before</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={form.score_before}
                    onChange={(e) => setForm({ ...form, score_before: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Score After</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={form.score_after}
                    onChange={(e) => setForm({ ...form, score_after: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Preview */}
              {form.score_after > form.score_before && (
                <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-sm text-green-300">
                  <ArrowUp className="w-4 h-4" />
                  +{form.score_after - form.score_before} points improvement
                </div>
              )}

              {/* Headline */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Headline</label>
                <input
                  type="text"
                  value={form.headline}
                  onChange={(e) => setForm({ ...form, headline: e.target.value })}
                  placeholder='e.g., "SEO: 34 → 91 in 2 weeks"'
                  className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Display Order */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Display Order</label>
                <input
                  type="number"
                  min={0}
                  value={form.display_order}
                  onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <p className="text-xs text-slate-500 mt-1">Lower numbers appear first</p>
              </div>

              {/* Published */}
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={form.is_published}
                  onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
                  className="rounded border-white/[0.08] bg-white/[0.03] text-indigo-600 focus:ring-indigo-500/20"
                />
                Publish immediately
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-white/[0.06]">
              <button
                onClick={() => setShowEditor(false)}
                className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  bgColor,
  suffix,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  suffix?: string;
}) {
  return (
    <div className={`${bgColor} border border-white/[0.06] rounded-lg p-4 flex items-center gap-4`}>
      <div className={`p-2 rounded-lg bg-white/[0.02] ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-white">
          {value.toLocaleString()}{suffix && <span className="text-sm font-normal text-slate-400 ml-1">{suffix}</span>}
        </p>
        <p className="text-xs text-slate-400">{label}</p>
      </div>
    </div>
  );
}
