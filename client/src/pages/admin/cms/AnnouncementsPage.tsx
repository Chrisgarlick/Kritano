/**
 * Announcements Manager
 *
 * Admin page for creating, scheduling, and managing dashboard banners.
 * Supports targeting by tier, scheduling with start/end dates,
 * and toggling active/inactive status.
 */

import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '../../../components/layout/AdminLayout';
import { adminApi } from '../../../services/api';
import type { AnnouncementItem, AnnouncementType, CreateAnnouncementInput, UpdateAnnouncementInput } from '../../../services/api';
import type { Pagination } from '../../../types/audit.types';
import { useToast } from '../../../components/ui/Toast';
import {
  Megaphone, Plus, Pencil, Trash2, RefreshCw,
  ChevronLeft, ChevronRight, X, Save, Eye, EyeOff,
  Info, CheckCircle, AlertTriangle, Wrench, ExternalLink,
  Calendar,
} from 'lucide-react';

const TYPE_OPTIONS: { value: AnnouncementType; label: string }[] = [
  { value: 'info', label: 'Info' },
  { value: 'success', label: 'Success' },
  { value: 'warning', label: 'Warning' },
  { value: 'maintenance', label: 'Maintenance' },
];

const TYPE_BADGE: Record<AnnouncementType, string> = {
  info: 'bg-blue-500/20 text-blue-300',
  success: 'bg-green-500/20 text-green-300',
  warning: 'bg-amber-500/20 text-amber-300',
  maintenance: 'bg-orange-500/20 text-orange-300',
};

const TYPE_ICON: Record<AnnouncementType, React.ComponentType<{ className?: string }>> = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  maintenance: Wrench,
};

const TIER_OPTIONS = ['free', 'starter', 'pro', 'agency', 'enterprise'];

interface AnnouncementForm {
  title: string;
  body: string;
  type: AnnouncementType;
  target_tiers: string[];
  allTiers: boolean;
  cta_label: string;
  cta_url: string;
  starts_at: string;
  ends_at: string;
  is_dismissible: boolean;
}

const EMPTY_FORM: AnnouncementForm = {
  title: '',
  body: '',
  type: 'info',
  target_tiers: [],
  allTiers: true,
  cta_label: '',
  cta_url: '',
  starts_at: '',
  ends_at: '',
  is_dismissible: true,
};

export default function AnnouncementsPage() {
  const { toast } = useToast();

  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AnnouncementForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.listAnnouncements({
        page: pagination.page,
        limit: pagination.limit,
      });
      setAnnouncements(data.announcements);
      setPagination(data.pagination);
    } catch {
      toast('Failed to load announcements', 'error');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleCreate = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowEditor(true);
  };

  const handleEdit = (item: AnnouncementItem) => {
    setForm({
      title: item.title,
      body: item.body,
      type: item.type,
      target_tiers: item.target_tiers || [],
      allTiers: !item.target_tiers,
      cta_label: item.cta_label || '',
      cta_url: item.cta_url || '',
      starts_at: item.starts_at ? new Date(item.starts_at).toISOString().slice(0, 16) : '',
      ends_at: item.ends_at ? new Date(item.ends_at).toISOString().slice(0, 16) : '',
      is_dismissible: item.is_dismissible,
    });
    setEditingId(item.id);
    setShowEditor(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.body) {
      toast('Title and body are required', 'error');
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        const input: UpdateAnnouncementInput = {
          title: form.title,
          body: form.body,
          type: form.type,
          target_tiers: form.allTiers ? null : form.target_tiers,
          cta_label: form.cta_label || null,
          cta_url: form.cta_url || null,
          starts_at: form.starts_at || undefined,
          ends_at: form.ends_at || null,
          is_dismissible: form.is_dismissible,
        };
        await adminApi.updateAnnouncement(editingId, input);
        toast('Announcement updated', 'success');
      } else {
        const input: CreateAnnouncementInput = {
          title: form.title,
          body: form.body,
          type: form.type,
          target_tiers: form.allTiers ? null : form.target_tiers,
          cta_label: form.cta_label || null,
          cta_url: form.cta_url || null,
          starts_at: form.starts_at || undefined,
          ends_at: form.ends_at || null,
          is_dismissible: form.is_dismissible,
        };
        await adminApi.createAnnouncement(input);
        toast('Announcement created', 'success');
      }
      setShowEditor(false);
      fetchAnnouncements();
    } catch {
      toast('Failed to save announcement', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (item: AnnouncementItem) => {
    setActionLoading(item.id);
    try {
      await adminApi.updateAnnouncement(item.id, { is_active: !item.is_active });
      toast(item.is_active ? 'Announcement deactivated' : 'Announcement activated', 'success');
      fetchAnnouncements();
    } catch {
      toast('Failed to update announcement', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this announcement permanently?')) return;
    setActionLoading(id);
    try {
      await adminApi.deleteAnnouncement(id);
      toast('Announcement deleted', 'success');
      fetchAnnouncements();
    } catch {
      toast('Failed to delete announcement', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatus = (item: AnnouncementItem): { label: string; cls: string } => {
    if (!item.is_active) return { label: 'Inactive', cls: 'bg-slate-500/20 text-slate-500' };
    const now = new Date();
    const start = new Date(item.starts_at);
    if (start > now) return { label: 'Scheduled', cls: 'bg-blue-500/20 text-blue-300' };
    if (item.ends_at && new Date(item.ends_at) < now) return { label: 'Expired', cls: 'bg-slate-500/20 text-slate-500' };
    return { label: 'Active', cls: 'bg-green-500/20 text-green-300' };
  };

  const goToPage = (p: number) =>
    setPagination((prev) => ({ ...prev, page: p }));

  const activeCount = announcements.filter((a) => {
    if (!a.is_active) return false;
    const now = new Date();
    const start = new Date(a.starts_at);
    if (start > now) return false;
    if (a.ends_at && new Date(a.ends_at) < now) return false;
    return true;
  }).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight" style={{ fontFamily: "'Instrument Serif', serif" }}>Announcements</h1>
            <p className="text-sm text-slate-500 mt-1">
              Create and schedule in-app announcements and banners
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Announcement
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total" value={pagination.total} icon={Megaphone} color="text-white" bgColor="bg-white/[0.03]" />
          <StatCard label="Active" value={activeCount} icon={Eye} color="text-green-400" bgColor="bg-green-500/10" />
          <StatCard
            label="Scheduled"
            value={announcements.filter((a) => a.is_active && new Date(a.starts_at) > new Date()).length}
            icon={Calendar}
            color="text-blue-400"
            bgColor="bg-blue-500/10"
          />
          <StatCard
            label="Inactive"
            value={announcements.filter((a) => !a.is_active).length}
            icon={EyeOff}
            color="text-slate-500"
            bgColor="bg-white/[0.02]"
          />
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchAnnouncements()}
            className="p-2 text-slate-500 hover:text-white transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* List */}
        <div className="space-y-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="h-5 w-1/3 bg-white/[0.06] rounded animate-pulse" />
                    <div className="h-4 w-2/3 bg-white/[0.04] rounded animate-pulse" />
                  </div>
                  <div className="h-5 w-16 bg-white/[0.06] rounded-full animate-pulse" />
                </div>
              </div>
            ))
          ) : announcements.length === 0 ? (
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg text-center py-16">
              <Megaphone className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-1">No announcements yet</h3>
              <p className="text-sm text-slate-500">Create your first announcement to notify users.</p>
            </div>
          ) : (
            announcements.map((item) => {
              const TypeIcon = TYPE_ICON[item.type];
              const status = getStatus(item);

              return (
                <div
                  key={item.id}
                  className={`bg-white/[0.02] border rounded-lg p-6 transition-colors ${
                    item.is_active ? 'border-white/[0.06]' : 'border-white/[0.04] opacity-70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`p-2 rounded-lg ${TYPE_BADGE[item.type]}`}>
                        <TypeIcon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium text-white">{item.title}</h3>
                          <span className={`inline-flex px-2 py-0.5 text-xs rounded-full font-medium ${TYPE_BADGE[item.type]}`}>
                            {item.type}
                          </span>
                          <span className={`inline-flex px-2 py-0.5 text-xs rounded-full font-medium ${status.cls}`}>
                            {status.label}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 mt-1 line-clamp-2">{item.body}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                          <span>
                            Starts: {new Date(item.starts_at).toLocaleDateString()}
                          </span>
                          {item.ends_at && (
                            <span>Ends: {new Date(item.ends_at).toLocaleDateString()}</span>
                          )}
                          {item.target_tiers ? (
                            <span>Tiers: {item.target_tiers.join(', ')}</span>
                          ) : (
                            <span>All tiers</span>
                          )}
                          {item.cta_label && (
                            <span className="flex items-center gap-1">
                              <ExternalLink className="w-3 h-3" />
                              {item.cta_label}
                            </span>
                          )}
                          {item.is_dismissible && <span>Dismissible</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-1.5 text-slate-500 hover:text-white transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(item)}
                        disabled={actionLoading === item.id}
                        className="p-1.5 text-slate-500 hover:text-amber-400 transition-colors disabled:opacity-50"
                        title={item.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {item.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={actionLoading === item.id}
                        className="p-1.5 text-slate-500 hover:text-red-400 transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
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
                {editingId ? 'Edit Announcement' : 'New Announcement'}
              </h2>
              <button onClick={() => setShowEditor(false)} className="p-1 text-slate-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Announcement title"
                  className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Body</label>
                <textarea
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  rows={3}
                  placeholder="Announcement message..."
                  className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-y"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Type</label>
                <div className="flex gap-2">
                  {TYPE_OPTIONS.map((t) => {
                    const Icon = TYPE_ICON[t.value];
                    return (
                      <button
                        key={t.value}
                        onClick={() => setForm({ ...form, type: t.value })}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                          form.type === t.value
                            ? `${TYPE_BADGE[t.value]} border-current`
                            : 'border-white/[0.06] text-slate-500 hover:text-white hover:border-white/[0.1]'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Target Tiers */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Target Tiers</label>
                <label className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                  <input
                    type="checkbox"
                    checked={form.allTiers}
                    onChange={(e) => setForm({ ...form, allTiers: e.target.checked, target_tiers: [] })}
                    className="rounded border-white/[0.08] bg-white/[0.03] text-indigo-600 focus:ring-indigo-500/20"
                  />
                  All tiers
                </label>
                {!form.allTiers && (
                  <div className="flex flex-wrap gap-2">
                    {TIER_OPTIONS.map((tier) => (
                      <button
                        key={tier}
                        onClick={() => {
                          const tiers = form.target_tiers.includes(tier)
                            ? form.target_tiers.filter((t) => t !== tier)
                            : [...form.target_tiers, tier];
                          setForm({ ...form, target_tiers: tiers });
                        }}
                        className={`px-3 py-1 rounded-lg text-sm font-medium border transition-colors ${
                          form.target_tiers.includes(tier)
                            ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                            : 'border-white/[0.06] text-slate-500 hover:text-white'
                        }`}
                      >
                        {tier}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* CTA */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">CTA Label <span className="text-slate-500">(optional)</span></label>
                  <input
                    type="text"
                    value={form.cta_label}
                    onChange={(e) => setForm({ ...form, cta_label: e.target.value })}
                    placeholder="Learn More"
                    className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">CTA URL <span className="text-slate-500">(optional)</span></label>
                  <input
                    type="url"
                    value={form.cta_url}
                    onChange={(e) => setForm({ ...form, cta_url: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Schedule */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Starts At</label>
                  <input
                    type="datetime-local"
                    value={form.starts_at}
                    onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                    className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Ends At <span className="text-slate-500">(optional)</span></label>
                  <input
                    type="datetime-local"
                    value={form.ends_at}
                    onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
                    className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Dismissible */}
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={form.is_dismissible}
                  onChange={(e) => setForm({ ...form, is_dismissible: e.target.checked })}
                  className="rounded border-white/[0.08] bg-white/[0.03] text-indigo-600 focus:ring-indigo-500/20"
                />
                Users can dismiss this announcement
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
