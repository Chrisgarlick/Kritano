import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Mail, Send, UserCheck, CreditCard, Search, Plus, Trash2, X,
  ChevronLeft, ChevronRight, ArrowUpDown, MessageSquare, FileSearch,
  CheckCircle2, XCircle, Loader2,
} from 'lucide-react';
import { AdminLayout } from '../../../components/layout/AdminLayout';
import { outreachLogApi, type OutreachLogEntry, type OutreachLogStats } from '../../../services/api';
import { useToast } from '../../../components/ui/Toast';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  sent: { label: 'Sent', color: 'text-slate-400', bg: 'bg-slate-500/10' },
  replied: { label: 'Replied', color: 'text-sky-400', bg: 'bg-sky-500/10' },
  nurturing: { label: 'Nurturing', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  converted: { label: 'Converted', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  dead: { label: 'Dead', color: 'text-red-400', bg: 'bg-red-500/10' },
};


export default function OutreachLogPage() {
  const { toast } = useToast();
  const [entries, setEntries] = useState<OutreachLogEntry[]>([]);
  const [stats, setStats] = useState<OutreachLogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sort, setSort] = useState('date_sent');
  const [order, setOrder] = useState<'DESC' | 'ASC'>('DESC');

  // Add form
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    domain: '',
    date_sent: new Date().toISOString().split('T')[0],
    subject: '',
    notes: '',
  });

  // Edit mode
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<OutreachLogEntry>>({});

  const fetchData = useCallback(async () => {
    try {
      const [entriesRes, statsRes] = await Promise.all([
        outreachLogApi.list({ page, search: search || undefined, status: statusFilter || undefined, sort, order }),
        outreachLogApi.stats(),
      ]);
      setEntries(entriesRes.data.items);
      setTotalPages(entriesRes.data.totalPages);
      setTotal(entriesRes.data.total);
      setStats(statsRes.data);
    } catch {
      toast('Failed to load outreach log', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, sort, order, toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAdd = async () => {
    if (!formData.email) return;
    setSaving(true);
    try {
      await outreachLogApi.create(formData);
      toast('Entry added', 'success');
      setShowAddForm(false);
      setFormData({ email: '', name: '', domain: '', date_sent: new Date().toISOString().split('T')[0], subject: '', notes: '' });
      fetchData();
    } catch {
      toast('Failed to add entry', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: string, data: Partial<OutreachLogEntry>) => {
    try {
      await outreachLogApi.update(id, data);
      setEditingId(null);
      setEditData({});
      fetchData();
    } catch {
      toast('Failed to update', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this entry?')) return;
    try {
      await outreachLogApi.delete(id);
      toast('Entry deleted', 'success');
      fetchData();
    } catch {
      toast('Failed to delete', 'error');
    }
  };

  const toggleSort = (col: string) => {
    if (sort === col) {
      setOrder(order === 'DESC' ? 'ASC' : 'DESC');
    } else {
      setSort(col);
      setOrder('DESC');
    }
  };

  const quickToggle = async (entry: OutreachLogEntry, field: 'replied' | 'free_audit_given' | 'became_user' | 'became_paid', dateField?: string) => {
    const newValue = !entry[field];
    const update: Partial<OutreachLogEntry> = { [field]: newValue } as Partial<OutreachLogEntry>;
    if (dateField && newValue) {
      (update as Record<string, unknown>)[dateField] = new Date().toISOString().split('T')[0];
    }
    // Auto-update status
    if (field === 'replied' && newValue) update.status = 'replied';
    if (field === 'became_paid' && newValue) update.status = 'converted';
    if (field === 'became_user' && newValue) update.became_user = true;

    await handleUpdate(entry.id, update);
  };

  return (
    <AdminLayout>
      <Helmet><title>Outreach Log | Admin</title></Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Cold Outreach Log</h1>
            <p className="text-sm text-slate-400 mt-1">Track manually sent cold emails and their outcomes</p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Log Email
          </button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <StatCard icon={<Send className="w-4 h-4" />} label="Total Sent" value={stats.total} sub={`${stats.sentLast7d} this week`} />
            <StatCard icon={<MessageSquare className="w-4 h-4" />} label="Replied" value={stats.replied} sub={`${stats.replyRate}% rate`} color="text-sky-400" />
            <StatCard icon={<FileSearch className="w-4 h-4" />} label="Free Audits" value={stats.freeAudits} color="text-violet-400" />
            <StatCard icon={<UserCheck className="w-4 h-4" />} label="Became User" value={stats.users} sub={`${stats.userRate}% rate`} color="text-amber-400" />
            <StatCard icon={<CreditCard className="w-4 h-4" />} label="Became Paid" value={stats.paid} sub={`${stats.paidRate}% rate`} color="text-emerald-400" />
            <StatCard
              icon={<Mail className="w-4 h-4" />}
              label="Last 30 Days"
              value={stats.sentLast30d}
              color="text-indigo-400"
            />
          </div>
        )}

        {/* Add Form */}
        {showAddForm && (
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Log New Email</h3>
              <button onClick={() => setShowAddForm(false)} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="email"
                placeholder="Email address *"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50"
              />
              <input
                type="text"
                placeholder="Contact name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50"
              />
              <input
                type="text"
                placeholder="Domain (e.g. example.com)"
                value={formData.domain}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50"
              />
              <input
                type="date"
                value={formData.date_sent}
                onChange={(e) => setFormData({ ...formData, date_sent: e.target.value })}
                className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50"
              />
              <input
                type="text"
                placeholder="Subject line"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50"
              />
              <input
                type="text"
                placeholder="Notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50"
              />
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleAdd}
                disabled={!formData.email || saving}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add Entry
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search email, name, domain..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          >
            <option value="">All Statuses</option>
            {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
              <option key={val} value={val}>{cfg.label}</option>
            ))}
          </select>
          <span className="text-xs text-slate-500">{total} entries</span>
        </div>

        {/* Table */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <SortHeader label="Date" col="date_sent" current={sort} order={order} onSort={toggleSort} />
                  <SortHeader label="Email" col="email" current={sort} order={order} onSort={toggleSort} />
                  <SortHeader label="Name" col="name" current={sort} order={order} onSort={toggleSort} />
                  <SortHeader label="Domain" col="domain" current={sort} order={order} onSort={toggleSort} />
                  <SortHeader label="Status" col="status" current={sort} order={order} onSort={toggleSort} />
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Replied</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Free Audit</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Paid</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {Array.from({ length: 10 }).map((__, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-4 bg-white/[0.04] rounded w-16" /></td>
                      ))}
                    </tr>
                  ))
                ) : entries.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-12 text-center text-slate-500">
                      No outreach logged yet. Click "Log Email" to add your first entry.
                    </td>
                  </tr>
                ) : (
                  entries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-white/[0.02] group">
                      <td className="px-4 py-3 text-slate-300 whitespace-nowrap text-xs">
                        {new Date(entry.date_sent).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-white font-mono text-xs">{entry.email}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{entry.name || '—'}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs">
                        {entry.domain ? (
                          <a href={`https://${entry.domain}`} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">
                            {entry.domain}
                          </a>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {editingId === entry.id ? (
                          <select
                            value={editData.status || entry.status}
                            onChange={(e) => setEditData({ ...editData, status: e.target.value as OutreachLogEntry['status'] })}
                            className="bg-white/[0.06] border border-white/[0.1] rounded px-2 py-1 text-xs text-white"
                          >
                            {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
                              <option key={val} value={val}>{cfg.label}</option>
                            ))}
                          </select>
                        ) : (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_CONFIG[entry.status]?.bg} ${STATUS_CONFIG[entry.status]?.color}`}>
                            {STATUS_CONFIG[entry.status]?.label || entry.status}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <ToggleButton active={entry.replied} onClick={() => quickToggle(entry, 'replied', 'reply_date')} />
                      </td>
                      <td className="px-4 py-3">
                        <ToggleButton active={entry.free_audit_given} onClick={() => quickToggle(entry, 'free_audit_given', 'free_audit_date')} />
                      </td>
                      <td className="px-4 py-3">
                        <ToggleButton active={entry.became_user} onClick={() => quickToggle(entry, 'became_user', 'user_signup_date')} />
                      </td>
                      <td className="px-4 py-3">
                        <ToggleButton active={entry.became_paid} onClick={() => quickToggle(entry, 'became_paid', 'paid_date')} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {editingId === entry.id ? (
                            <>
                              <button
                                onClick={() => handleUpdate(entry.id, editData)}
                                className="p-1 text-emerald-400 hover:bg-emerald-400/10 rounded"
                                title="Save"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => { setEditingId(null); setEditData({}); }}
                                className="p-1 text-slate-400 hover:bg-white/[0.06] rounded"
                                title="Cancel"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => { setEditingId(entry.id); setEditData({ status: entry.status }); }}
                                className="p-1 text-slate-400 hover:text-white hover:bg-white/[0.06] rounded"
                                title="Edit status"
                              >
                                <ArrowUpDown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(entry.id)}
                                className="p-1 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06]">
              <span className="text-xs text-slate-500">Page {page} of {totalPages}</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed rounded hover:bg-white/[0.06]"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed rounded hover:bg-white/[0.06]"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

// =============================================
// SUB-COMPONENTS
// =============================================

function StatCard({ icon, label, value, sub, color = 'text-white' }: {
  icon: React.ReactNode;
  label: string;
  value: number;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-slate-500">{icon}</span>
        <span className="text-xs text-slate-500 uppercase tracking-wide">{label}</span>
      </div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
    </div>
  );
}

function ToggleButton({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`p-1 rounded transition-colors ${
        active
          ? 'text-emerald-400 hover:bg-emerald-400/10'
          : 'text-slate-600 hover:text-slate-400 hover:bg-white/[0.04]'
      }`}
    >
      {active ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
    </button>
  );
}

function SortHeader({ label, col, current, order, onSort }: {
  label: string;
  col: string;
  current: string;
  order: string;
  onSort: (col: string) => void;
}) {
  return (
    <th
      className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase cursor-pointer hover:text-slate-300 select-none"
      onClick={() => onSort(col)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {current === col && (
          <span className="text-indigo-400">{order === 'ASC' ? '↑' : '↓'}</span>
        )}
      </span>
    </th>
  );
}
