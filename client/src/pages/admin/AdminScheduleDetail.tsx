import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  CalendarClock, ArrowLeft, Loader2, CheckCircle2, XCircle, Pause,
  AlertTriangle, Trash2, Play, Activity, Clock, User,
} from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { adminSchedulesApi, schedulesApi, type AdminScheduleItem, type ScheduleRunSummary } from '../../services/api';
import { useToast } from '../../components/ui/Toast';

function formatDate(d: string | null) {
  if (!d) return '-';
  return new Date(d).toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function AdminScheduleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [schedule, setSchedule] = useState<AdminScheduleItem | null>(null);
  const [runs, setRuns] = useState<ScheduleRunSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      const [schedRes, runsRes] = await Promise.all([
        adminSchedulesApi.get(id),
        schedulesApi.getRuns(id, 50, 0).catch(() => ({ data: { runs: [], total: 0 } })),
      ]);
      setSchedule(schedRes.data.schedule);
      setRuns(runsRes.data.runs);
    } catch {
      toast('Failed to load schedule', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToggle = async (enabled: boolean) => {
    if (!id) return;
    try {
      await adminSchedulesApi.update(id, { enabled });
      toast(enabled ? 'Schedule enabled' : 'Schedule disabled', 'success');
      fetchData();
    } catch {
      toast('Failed to update schedule', 'error');
    }
  };

  const handleDelete = async () => {
    if (!id || !window.confirm('Delete this schedule?')) return;
    try {
      await adminSchedulesApi.delete(id);
      toast('Schedule deleted', 'success');
      navigate('/admin/schedules');
    } catch {
      toast('Failed to delete schedule', 'error');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (!schedule) {
    return (
      <AdminLayout>
        <div className="text-center py-20">
          <p className="text-slate-400">Schedule not found</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl">
        <Link
          to="/admin/schedules"
          className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-indigo-400 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          All Schedules
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-indigo-400" />
              {schedule.name || schedule.target_domain}
            </h1>
            <p className="text-sm text-slate-400 mt-1">{schedule.target_url}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleToggle(!schedule.enabled)}
              className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg border ${
                schedule.enabled
                  ? 'text-amber-300 border-amber-800 hover:bg-amber-900/20'
                  : 'text-emerald-300 border-emerald-800 hover:bg-emerald-900/20'
              }`}
            >
              {schedule.enabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {schedule.enabled ? 'Disable' : 'Enable'}
            </button>
            <button
              onClick={handleDelete}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-red-300 border border-red-800 rounded-lg hover:bg-red-900/20"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          {[
            { label: 'User', value: schedule.user_email, icon: User },
            { label: 'Frequency', value: schedule.frequency, icon: CalendarClock },
            { label: 'Cron', value: schedule.cron_expression, icon: Clock },
            { label: 'Runs', value: String(schedule.run_count), icon: Activity },
            { label: 'Failures', value: String(schedule.consecutive_failures), icon: AlertTriangle },
            { label: 'Next Run', value: formatDate(schedule.next_run_at), icon: Clock },
          ].map((item) => (
            <div key={item.label} className="bg-white/[0.02] p-4 rounded-lg border border-white/[0.06]">
              <div className="flex items-center gap-2 mb-1">
                <item.icon className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-xs text-slate-400">{item.label}</span>
              </div>
              <p className="text-sm font-medium text-white truncate">{item.value}</p>
            </div>
          ))}
        </div>

        {/* Status */}
        {schedule.paused_reason && (
          <div className="bg-amber-900/20 border border-amber-800 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-amber-300 text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-medium">Paused:</span>
              {schedule.paused_reason}
            </div>
          </div>
        )}

        {/* Run History */}
        <div className="bg-white/[0.02] rounded-lg border border-white/[0.06] overflow-hidden">
          <div className="px-4 py-3 border-b border-white/[0.06]">
            <h2 className="text-sm font-semibold text-white">Run History ({runs.length})</h2>
          </div>
          {runs.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-slate-500">No runs yet</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-white/[0.03]">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-400">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-400">Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-400">SEO</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-400">A11y</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-400">Issues</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {runs.map((run) => (
                  <tr key={run.id} className="hover:bg-white/[0.04]">
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center gap-1">
                        {run.status === 'completed' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : run.status === 'failed' ? (
                          <XCircle className="w-3.5 h-3.5 text-red-400" />
                        ) : (
                          <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                        )}
                        <span className="text-xs text-slate-300 capitalize">{run.status}</span>
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-400">{formatDate(run.created_at)}</td>
                    <td className="px-4 py-2.5 text-xs text-slate-300">{run.seo_score ?? '-'}</td>
                    <td className="px-4 py-2.5 text-xs text-slate-300">{run.accessibility_score ?? '-'}</td>
                    <td className="px-4 py-2.5 text-xs text-slate-300">{run.total_issues ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
