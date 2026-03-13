import { useState, useEffect, useCallback } from 'react';
import { CalendarClock, Plus, Search, Loader2 } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { ScheduleCard } from '../../components/schedules/ScheduleCard';
import { CreateScheduleModal } from '../../components/schedules/CreateScheduleModal';
import { schedulesApi, type AuditScheduleSummary } from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../contexts/AuthContext';

type StatusFilter = 'all' | 'active' | 'paused' | 'disabled';

export default function ScheduleListPage() {
  const { subscription } = useAuth();
  const { toast } = useToast();
  const [schedules, setSchedules] = useState<AuditScheduleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const tier = subscription?.tier || 'free';
  const canSchedule = tier !== 'free';

  const fetchSchedules = useCallback(async () => {
    try {
      const { data } = await schedulesApi.list();
      setSchedules(data.schedules);
    } catch {
      toast('Failed to load schedules', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      await schedulesApi.toggle(id, enabled);
      toast(enabled ? 'Schedule enabled' : 'Schedule disabled', 'success');
      fetchSchedules();
    } catch (err: any) {
      toast(err.response?.data?.error || 'Failed to toggle schedule', 'error');
    }
  };

  const filtered = schedules.filter((s) => {
    // Status filter
    if (filter === 'active' && (!s.enabled || s.paused_reason)) return false;
    if (filter === 'paused' && !s.paused_reason) return false;
    if (filter === 'disabled' && s.enabled) return false;

    // Search
    if (search) {
      const q = search.toLowerCase();
      return (
        (s.name || '').toLowerCase().includes(q) ||
        s.target_domain.toLowerCase().includes(q) ||
        s.target_url.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const stats = {
    total: schedules.length,
    active: schedules.filter((s) => s.enabled && !s.paused_reason).length,
    paused: schedules.filter((s) => s.paused_reason).length,
    disabled: schedules.filter((s) => !s.enabled).length,
  };

  const filterTabs: Array<{ key: StatusFilter; label: string; count: number }> = [
    { key: 'all', label: 'All', count: stats.total },
    { key: 'active', label: 'Active', count: stats.active },
    { key: 'paused', label: 'Paused', count: stats.paused },
    { key: 'disabled', label: 'Disabled', count: stats.disabled },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CalendarClock className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              Scheduled Audits
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Automate recurring audits on your verified sites
            </p>
          </div>
          {canSchedule ? (
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Schedule
            </button>
          ) : (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-2 text-sm text-amber-700 dark:text-amber-300">
              Upgrade to Starter or above to schedule audits
            </div>
          )}
        </div>

        {/* Stats bar */}
        {schedules.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Total', value: stats.total, color: 'text-slate-900 dark:text-white' },
              { label: 'Active', value: stats.active, color: 'text-emerald-600 dark:text-emerald-400' },
              { label: 'Paused', value: stats.paused, color: 'text-amber-600 dark:text-amber-400' },
              { label: 'Disabled', value: stats.disabled, color: 'text-slate-500 dark:text-slate-400' },
            ].map((s) => (
              <div key={s.label} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-center">
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filter + Search */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 gap-1">
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`
                  px-3 py-1.5 text-xs font-medium rounded-md transition-colors
                  ${filter === tab.key
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }
                `}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search schedules..."
              className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <CalendarClock className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">
              {schedules.length === 0 ? 'No schedules yet' : 'No matching schedules'}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {schedules.length === 0
                ? 'Create your first scheduled audit to automate recurring checks.'
                : 'Try adjusting your filters or search term.'}
            </p>
            {schedules.length === 0 && canSchedule && (
              <button
                onClick={() => setShowCreate(true)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
              >
                <Plus className="w-4 h-4" />
                Create Schedule
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((schedule) => (
              <ScheduleCard
                key={schedule.id}
                schedule={schedule}
                onToggle={handleToggle}
              />
            ))}
          </div>
        )}
      </div>

      <CreateScheduleModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={fetchSchedules}
        tier={tier}
      />
    </DashboardLayout>
  );
}
