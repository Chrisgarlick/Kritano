/**
 * Audit Advice Template Editor
 *
 * Admin page for managing contextual advice that appears alongside audit findings.
 * Supports CRUD with search, category filtering, and inline editing.
 */

import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { AdminLayout } from '../../../components/layout/AdminLayout';
import { adminApi } from '../../../services/api';
import type { AuditAdviceTemplate, UpsertAdviceInput } from '../../../services/api';
import type { Pagination } from '../../../types/audit.types';
import { useToast } from '../../../components/ui/Toast';
import {
  BookOpen, Search, Plus, Pencil, Trash2, RefreshCw,
  ChevronLeft, ChevronRight, X, Save, ExternalLink,
  AlertTriangle, AlertCircle, Info, Shield,
} from 'lucide-react';

const CATEGORY_OPTIONS = [
  { value: '', label: 'All Categories' },
  { value: 'seo', label: 'SEO' },
  { value: 'accessibility', label: 'Accessibility' },
  { value: 'security', label: 'Security' },
  { value: 'performance', label: 'Performance' },
  { value: 'content-quality', label: 'Content Quality' },
  { value: 'structured-data', label: 'Structured Data' },
  { value: 'eeat', label: 'E-E-A-T' },
  { value: 'aeo', label: 'AEO' },
];

const SEVERITY_OPTIONS = ['critical', 'serious', 'moderate', 'minor', 'info'];

const SEVERITY_BADGE: Record<string, string> = {
  critical: 'bg-red-500/20 text-red-300',
  serious: 'bg-orange-500/20 text-orange-300',
  moderate: 'bg-amber-500/20 text-amber-300',
  minor: 'bg-blue-500/20 text-blue-300',
  info: 'bg-slate-500/20 text-slate-300',
};

const SEVERITY_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  critical: AlertCircle,
  serious: AlertTriangle,
  moderate: Info,
  minor: Info,
  info: Shield,
};

function formatCategoryLabel(cat: string): string {
  return cat
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

interface AdviceForm {
  rule_id: string;
  rule_name: string;
  category: string;
  severity: string;
  description: string;
  recommendation: string;
  learn_more_url: string;
}

const EMPTY_FORM: AdviceForm = {
  rule_id: '',
  rule_name: '',
  category: 'seo',
  severity: 'moderate',
  description: '',
  recommendation: '',
  learn_more_url: '',
};

export default function AdvicePage() {
  const { toast } = useToast();

  const [advice, setAdvice] = useState<AuditAdviceTemplate[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 50, total: 0, pages: 0 });
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [form, setForm] = useState<AdviceForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchAdvice = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.listAdvice({
        page: pagination.page,
        limit: pagination.limit,
        search: search || undefined,
        category: categoryFilter || undefined,
      });
      setAdvice(data.advice);
      setPagination(data.pagination);
    } catch {
      toast('Failed to load advice templates', 'error');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, categoryFilter]);

  useEffect(() => {
    fetchAdvice();
  }, [fetchAdvice]);

  const handleCreate = () => {
    setForm(EMPTY_FORM);
    setEditingRuleId(null);
    setShowEditor(true);
  };

  const handleEdit = (item: AuditAdviceTemplate) => {
    setForm({
      rule_id: item.rule_id,
      rule_name: item.rule_name,
      category: item.category,
      severity: item.severity,
      description: item.description,
      recommendation: item.recommendation,
      learn_more_url: item.learn_more_url || '',
    });
    setEditingRuleId(item.rule_id);
    setShowEditor(true);
  };

  const handleSave = async () => {
    if (!form.rule_id || !form.rule_name || !form.description || !form.recommendation) {
      toast('Please fill in all required fields', 'error');
      return;
    }

    setSaving(true);
    try {
      const input: UpsertAdviceInput = {
        rule_name: form.rule_name,
        category: form.category,
        severity: form.severity,
        description: form.description,
        recommendation: form.recommendation,
        learn_more_url: form.learn_more_url || null,
      };

      await adminApi.upsertAdvice(editingRuleId || form.rule_id, input);
      toast(editingRuleId ? 'Advice updated' : 'Advice created', 'success');
      setShowEditor(false);
      fetchAdvice();
    } catch {
      toast('Failed to save advice', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (ruleId: string) => {
    if (!confirm('Delete this advice template? This reverts to engine defaults.')) return;
    try {
      await adminApi.deleteAdvice(ruleId);
      toast('Advice reverted to default', 'success');
      fetchAdvice();
    } catch {
      toast('Failed to delete advice', 'error');
    }
  };

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

  return (
    <AdminLayout>
      <Helmet><title>Admin: Audit Advice | PagePulser</title></Helmet>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight" style={{ fontFamily: "'Instrument Serif', serif" }}>Advice Editor</h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage contextual advice snippets that appear alongside audit findings
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Advice
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Rules" value={pagination.total} icon={BookOpen} color="text-white" bgColor="bg-white/[0.03]" />
          <StatCard
            label="Custom"
            value={advice.filter((a) => a.is_custom).length}
            icon={Pencil}
            color="text-indigo-400"
            bgColor="bg-indigo-500/10"
          />
          <StatCard
            label="Categories"
            value={new Set(advice.map((a) => a.category)).size}
            icon={BookOpen}
            color="text-amber-400"
            bgColor="bg-amber-500/10"
          />
          <StatCard
            label="Critical/Serious"
            value={advice.filter((a) => a.severity === 'critical' || a.severity === 'serious').length}
            icon={AlertTriangle}
            color="text-red-400"
            bgColor="bg-red-500/10"
          />
        </div>

        {/* Filter Row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search rule ID or name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="w-full pl-9 pr-4 py-2 bg-white/[0.02] border border-white/[0.06] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="px-3 py-2 bg-white/[0.02] border border-white/[0.06] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <button
            onClick={() => fetchAdvice()}
            className="p-2 text-slate-500 hover:text-white transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Table */}
        <div className="bg-white/[0.02] rounded-lg border border-white/[0.06] overflow-hidden">
          {loading ? (
            <div className="divide-y divide-white/[0.06]">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4">
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-2/3 bg-white/[0.06] rounded animate-pulse" />
                    <div className="h-3 w-1/3 bg-white/[0.04] rounded animate-pulse" />
                  </div>
                  <div className="h-5 w-16 bg-white/[0.06] rounded-full animate-pulse" />
                  <div className="h-5 w-16 bg-white/[0.06] rounded-full animate-pulse" />
                </div>
              ))}
            </div>
          ) : advice.length === 0 ? (
            <div className="text-center py-16">
              <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-1">No advice templates found</h3>
              <p className="text-sm text-slate-500 mb-4">
                {search || categoryFilter
                  ? 'Try adjusting your filters.'
                  : 'Create your first custom advice template.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.06] text-left text-sm text-slate-500">
                    <th className="px-6 py-3 font-medium">Rule</th>
                    <th className="px-6 py-3 font-medium">Category</th>
                    <th className="px-6 py-3 font-medium">Severity</th>
                    <th className="px-6 py-3 font-medium">Custom</th>
                    <th className="px-6 py-3 font-medium">Updated</th>
                    <th className="px-6 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {advice.map((item) => {
                    const SeverityIcon = SEVERITY_ICON[item.severity] || Info;
                    return (
                      <tr key={item.id} className="hover:bg-white/[0.04] transition-colors">
                        <td className="px-6 py-4 max-w-xs">
                          <div className="font-medium text-white truncate">{item.rule_name}</div>
                          <div className="text-xs text-slate-500 font-mono mt-0.5">{item.rule_id}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex px-2 py-0.5 text-xs rounded-full font-medium bg-indigo-500/20 text-indigo-300">
                            {formatCategoryLabel(item.category)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full font-medium ${SEVERITY_BADGE[item.severity] || SEVERITY_BADGE.info}`}>
                            <SeverityIcon className="w-3 h-3" />
                            {item.severity}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {item.is_custom ? (
                            <span className="inline-flex px-2 py-0.5 text-xs rounded-full font-medium bg-green-500/20 text-green-300">
                              Custom
                            </span>
                          ) : (
                            <span className="text-xs text-slate-500">Default</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                          {new Date(item.updated_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end items-center gap-1">
                            <button
                              onClick={() => handleEdit(item)}
                              className="p-1.5 text-slate-500 hover:text-white transition-colors"
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            {item.is_custom && (
                              <button
                                onClick={() => handleDelete(item.rule_id)}
                                className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                                title="Revert to default"
                              >
                                <Trash2 className="w-4 h-4" />
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
                    {showGap && <span className="px-1 text-slate-600">&hellip;</span>}
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

      {/* Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowEditor(false)} />
          <div className="relative bg-white/[0.02] border border-white/[0.06] rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
              <h2 className="text-lg font-bold text-white">
                {editingRuleId ? 'Edit Advice' : 'New Advice Template'}
              </h2>
              <button onClick={() => setShowEditor(false)} className="p-1 text-slate-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Rule ID */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Rule ID</label>
                <input
                  type="text"
                  value={form.rule_id}
                  onChange={(e) => setForm({ ...form, rule_id: e.target.value })}
                  disabled={!!editingRuleId}
                  placeholder="e.g., missing-meta-description"
                  className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-50 font-mono"
                />
              </div>

              {/* Rule Name */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Rule Name</label>
                <input
                  type="text"
                  value={form.rule_name}
                  onChange={(e) => setForm({ ...form, rule_name: e.target.value })}
                  placeholder="e.g., Missing Meta Description"
                  className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Category + Severity */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    {CATEGORY_OPTIONS.filter((c) => c.value).map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Severity</label>
                  <select
                    value={form.severity}
                    onChange={(e) => setForm({ ...form, severity: e.target.value })}
                    className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    {SEVERITY_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  placeholder="What this issue means..."
                  className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-y"
                />
              </div>

              {/* Recommendation */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Recommendation</label>
                <textarea
                  value={form.recommendation}
                  onChange={(e) => setForm({ ...form, recommendation: e.target.value })}
                  rows={3}
                  placeholder="How to fix it..."
                  className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-y"
                />
              </div>

              {/* Learn More URL */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Learn More URL <span className="text-slate-500">(optional)</span>
                </label>
                <div className="relative">
                  <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="url"
                    value={form.learn_more_url}
                    onChange={(e) => setForm({ ...form, learn_more_url: e.target.value })}
                    placeholder="https://..."
                    className="w-full pl-9 pr-4 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>
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
