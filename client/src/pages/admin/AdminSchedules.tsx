import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarClock, Search, Loader2, CheckCircle2, Pause, XCircle, Activity,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { adminSchedulesApi, type AdminScheduleItem, type AdminScheduleStats } from '../../services/api';
import { useToast } from '../../components/ui/Toast';

type StatusFilter = 'all' | 'active' | 'paused' | 'disabled';

export default function AdminSchedulesPage() {
  const { toast } = useToast();
  const [schedules, setSchedules] = useState<AdminScheduleItem[]>([]);
  const [stats, setStats] = useState<AdminScheduleStats | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 25;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [schedulesRes, statsRes] = await Promise.all([
        adminSchedulesApi.list({
          status: filter === 'all' ? undefined : filter,
          search: search || undefined,
          page,
          limit,
        }),
        adminSchedulesApi.getStats(),
      ]);
      setSchedules(schedulesRes.data.schedules);
      setTotal(schedulesRes.data.total);
      setStats(statsRes.data.stats);
    } catch {
      toast('Failed to load schedules', 'error');
    } finally {
      setLoading(false);
    }
  }, [filter, search, page, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setPage(1);
  }, [filter, search]);

  const totalPages = Math.ceil(total / limit);

  const formatDate = (d: string | null) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <CalendarClock className="w-6 h-6 text-indigo-400" />
          <h1 className="text-2xl font-bold text-white tracking-tight" style={{ fontFamily: "'Instrument Serif', serif" }}>Scheduled Audits</h1>
        </div>

        {/* Stats cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
            {[
              { label: 'Total', value: stats.total, icon: CalendarClock, color: 'text-white' },
              { label: 'Active', value: stats.active, icon: CheckCircle2, color: 'text-emerald-400' },
              { label: 'Paused', value: stats.paused, icon: Pause, color: 'text-amber-400' },
              { label: 'Disabled', value: stats.disabled, icon: XCircle, color: 'text-slate-500' },
              { label: 'Ran Today', value: stats.ranToday, icon: Activity, color: 'text-indigo-400' },
            ].map((s) => (
              <div key={s.label} className="bg-white/[0.02] p-4 rounded-lg border border-white/[0.06]">
                <div className="flex items-center gap-2 mb-1">
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                  <span className="text-xs text-slate-500">{s.label}</span>
                </div>
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white/[0.02] p-4 rounded-lg border border-white/[0.06] mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by domain, name, or email..."
                className="w-full pl-9 pr-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-md text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as StatusFilter)}
              className="px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-md text-sm text-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
          </div>
        ) : (
          <div className="bg-white/[0.02] rounded-lg border border-white/[0.06] overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead className="bg-white/[0.03]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Domain / Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Frequency</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Runs</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Next Run</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {schedules.map((s) => (
                  <tr key={s.id} className="hover:bg-white/[0.04]">
                    <td className="px-4 py-3">
                      <Link to={`/admin/schedules/${s.id}`} className="text-indigo-400 hover:text-indigo-300 font-medium">
                        {s.name || s.target_domain}
                      </Link>
                      <p className="text-xs text-slate-500 truncate max-w-xs">{s.target_url}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-300">{s.user_email}</td>
                    <td className="px-4 py-3 text-xs text-slate-300 capitalize">{s.frequency}</td>
                    <td className="px-4 py-3">
                      {s.paused_reason ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-900/30 text-amber-300">
                          <Pause className="w-3 h-3" /> Paused
                        </span>
                      ) : s.enabled ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-900/30 text-emerald-300">
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-white/[0.06] text-slate-500">
                          <XCircle className="w-3 h-3" /> Disabled
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-300">{s.run_count}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{formatDate(s.next_run_at)}</td>
                  </tr>
                ))}
                {schedules.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      No schedules found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06]">
                <span className="text-xs text-slate-500">
                  Showing {((page - 1) * limit) + 1}-{Math.min(page * limit, total)} of {total}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="p-1 text-slate-500 hover:text-white disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-slate-500">Page {page} of {totalPages}</span>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="p-1 text-slate-500 hover:text-white disabled:opacity-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
