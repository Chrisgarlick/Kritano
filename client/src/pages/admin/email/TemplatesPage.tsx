/**
 * Email Template Library
 *
 * Grid of email templates with category filters, search, and CRUD actions.
 */

import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../../../components/layout/AdminLayout';
import { adminApi } from '../../../services/api';
import {
  Mail, Plus, Search, Copy, Trash2, Eye, Lock,
  RefreshCw, ChevronLeft, ChevronRight,
} from 'lucide-react';

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'transactional', label: 'Transactional' },
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'engagement', label: 'Engagement' },
  { value: 'upgrade', label: 'Upgrade' },
  { value: 'security', label: 'Security' },
  { value: 'win_back', label: 'Win Back' },
  { value: 'educational', label: 'Educational' },
  { value: 'announcement', label: 'Announcement' },
  { value: 'digest', label: 'Digest' },
];

const CATEGORY_COLORS: Record<string, string> = {
  transactional: 'bg-blue-500/20 text-blue-300',
  onboarding: 'bg-green-500/20 text-green-300',
  engagement: 'bg-purple-500/20 text-purple-300',
  upgrade: 'bg-amber-500/20 text-amber-300',
  security: 'bg-red-500/20 text-red-300',
  win_back: 'bg-orange-500/20 text-orange-300',
  educational: 'bg-teal-500/20 text-teal-300',
  announcement: 'bg-indigo-500/20 text-indigo-300',
  digest: 'bg-slate-500/20 text-slate-300',
};

interface Template {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  subject: string;
  category: string;
  is_system: boolean;
  is_active: boolean;
  branding_mode: string;
  created_at: string;
  updated_at: string;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, limit: 24 };
      if (category) params.category = category;
      if (search) params.search = search;
      const { data: res } = await adminApi.listTemplates(params as Parameters<typeof adminApi.listTemplates>[0]);
      setTemplates(res.templates);
      setTotalPages(res.pagination.pages);
      setTotal(res.pagination.total);
    } catch (err) {
      console.error('Failed to load templates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [page, category, search]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete template "${name}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await adminApi.deleteTemplate(id);
      setTemplates(prev => prev.filter(t => t.id !== id));
      setTotal(prev => prev - 1);
    } catch (err) {
      alert('Failed to delete template. System templates cannot be deleted.');
    } finally {
      setDeleting(null);
    }
  };

  const handleDuplicate = async (id: string, slug: string, name: string) => {
    const newSlug = prompt('Enter slug for the copy:', `${slug}_copy`);
    if (!newSlug) return;
    const newName = prompt('Enter name for the copy:', `${name} (Copy)`);
    if (!newName) return;
    try {
      await adminApi.duplicateTemplate(id, newSlug, newName);
      fetchTemplates();
    } catch (err) {
      alert('Failed to duplicate template. The slug may already exist.');
    }
  };

  return (
    <AdminLayout>
      <Helmet><title>Admin: Email Templates | PagePulser</title></Helmet>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight" style={{ fontFamily: "'Instrument Serif', serif" }}>Email Templates</h1>
            <p className="text-sm text-slate-500 mt-1">
              {total} template{total !== 1 ? 's' : ''} — manage your transactional and campaign emails
            </p>
          </div>
          <Link
            to="/admin/email/templates/new"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Template
          </Link>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search templates..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 bg-white/[0.02] border border-white/[0.06] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-white/[0.02] border border-white/[0.06] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            {CATEGORIES.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <button
            onClick={fetchTemplates}
            className="p-2 text-slate-500 hover:text-white transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Template Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 bg-white/[0.02] rounded-lg animate-pulse" />
            ))}
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-16">
            <Mail className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-1">No templates found</h3>
            <p className="text-sm text-slate-500">
              {search || category ? 'Try adjusting your filters.' : 'Create your first email template to get started.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-5 hover:border-white/[0.1] transition-colors group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[template.category] || 'bg-white/[0.06] text-slate-300'}`}>
                      {template.category.replace('_', ' ')}
                    </span>
                    {template.is_system && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/[0.06] text-slate-500 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> System
                      </span>
                    )}
                  </div>
                  {!template.is_active && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-300">
                      Inactive
                    </span>
                  )}
                </div>

                <Link to={`/admin/email/templates/${template.id}`} className="block mb-2">
                  <h3 className="text-white font-medium group-hover:text-indigo-300 transition-colors">
                    {template.name}
                  </h3>
                </Link>

                <p className="text-sm text-slate-500 mb-1 truncate" title={template.subject}>
                  Subject: {template.subject}
                </p>

                {template.description && (
                  <p className="text-xs text-slate-500 mb-3 line-clamp-2">
                    {template.description}
                  </p>
                )}

                <div className="text-xs text-slate-500 mb-3">
                  Slug: <code className="text-slate-500">{template.slug}</code>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 pt-3 border-t border-white/[0.04]">
                  <Link
                    to={`/admin/email/templates/${template.id}`}
                    className="p-1.5 text-slate-500 hover:text-white transition-colors"
                    title="Edit"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleDuplicate(template.id, template.slug, template.name)}
                    className="p-1.5 text-slate-500 hover:text-white transition-colors"
                    title="Duplicate"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  {!template.is_system && (
                    <button
                      onClick={() => handleDelete(template.id, template.name)}
                      disabled={deleting === template.id}
                      className="p-1.5 text-slate-500 hover:text-red-400 transition-colors ml-auto"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 text-slate-500 hover:text-white disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-slate-500">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 text-slate-500 hover:text-white disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
