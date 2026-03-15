import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  CalendarClock, ArrowLeft, Clock, Activity, CheckCircle2, XCircle,
  AlertTriangle, Trash2, Loader2, ExternalLink, Settings,
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { schedulesApi, type AuditScheduleDetail, type ScheduleRunSummary } from '../../services/api';
import { useToast } from '../../components/ui/Toast';

const frequencyLabels: Record<string, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  biweekly: 'Biweekly',
  monthly: 'Monthly',
  custom: 'Custom',
};

function formatDate(d: string | null) {
  if (!d) return 'Never';
  return new Date(d).toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function getStatusBadge(schedule: AuditScheduleDetail) {
  if (schedule.paused_reason) return { label: 'Paused', cls: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' };
  if (!schedule.enabled) return { label: 'Disabled', cls: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-500' };
  return { label: 'Active', cls: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' };
}

export default function ScheduleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [schedule, setSchedule] = useState<AuditScheduleDetail | null>(null);
  const [allRuns, setAllRuns] = useState<ScheduleRunSummary[]>([]);
  const [totalRuns, setTotalRuns] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const fetchSchedule = useCallback(async () => {
    if (!id) return;
    try {
      const { data } = await schedulesApi.get(id);
      setSchedule(data.schedule);

      // Fetch full runs
      const runsRes = await schedulesApi.getRuns(id, 50, 0);
      setAllRuns(runsRes.data.runs);
      setTotalRuns(runsRes.data.total);
    } catch {
      toast('Failed to load schedule', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  const handleToggle = async () => {
    if (!schedule) return;
    try {
      const { data } = await schedulesApi.toggle(schedule.id, !schedule.enabled);
      setSchedule(data.schedule);
      toast(data.schedule.enabled ? 'Schedule enabled' : 'Schedule disabled', 'success');
    } catch (err: any) {
      toast(err.response?.data?.error || 'Failed to toggle schedule', 'error');
    }
  };

  const handleDelete = async () => {
    if (!schedule || !window.confirm('Delete this schedule? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await schedulesApi.delete(schedule.id);
      toast('Schedule deleted', 'success');
      navigate('/schedules');
    } catch {
      toast('Failed to delete schedule', 'error');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!schedule) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <h2 className="text-lg font-medium text-slate-900 dark:text-white">Schedule not found</h2>
          <Link to="/schedules" className="text-sm text-indigo-600 hover:text-indigo-700 mt-2 inline-block">
            Back to schedules
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const statusBadge = getStatusBadge(schedule);
  const successRate = schedule.run_count > 0
    ? Math.round(((schedule.run_count - schedule.failure_count) / schedule.run_count) * 100)
    : 0;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Back link */}
        <Link
          to="/schedules"
          className="inline-flex items-center gap-1 text-sm text-slate-500 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Schedules
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {schedule.name || schedule.target_domain}
              </h1>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusBadge.cls}`}>
                {statusBadge.label}
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-500 mt-1 flex items-center gap-1">
              {schedule.target_url}
              <a href={schedule.target_url} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600">
                <ExternalLink className="w-3 h-3" />
              </a>
            </p>
            {schedule.paused_reason && (
              <div className="mt-2 flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-4 h-4" />
                {schedule.paused_reason}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleToggle}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors ${
                schedule.enabled
                  ? 'text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
                  : 'text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
              }`}
            >
              {schedule.enabled ? 'Disable' : 'Enable'}
            </button>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-500 mb-1">
              <CalendarClock className="w-4 h-4" />
              <span className="text-xs">Frequency</span>
            </div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              {frequencyLabels[schedule.frequency] || schedule.frequency}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-500 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs">Next Run</span>
            </div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              {schedule.enabled && !schedule.paused_reason ? formatDate(schedule.next_run_at) : 'Paused'}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-500 mb-1">
              <Activity className="w-4 h-4" />
              <span className="text-xs">Total Runs</span>
            </div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{schedule.run_count}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-500 mb-1">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-xs">Success Rate</span>
            </div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              {schedule.run_count > 0 ? `${successRate}%` : '-'}
            </p>
          </div>
        </div>

        {/* Settings */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6 mb-6">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
            <Settings className="w-4 h-4" />
            Settings
          </h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-500 dark:text-slate-500">Cron</span>
              <p className="font-mono text-slate-900 dark:text-white">{schedule.cron_expression}</p>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-500">Timezone</span>
              <p className="text-slate-900 dark:text-white">{schedule.timezone}</p>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-500">Last Run</span>
              <p className="text-slate-900 dark:text-white">{formatDate(schedule.last_run_at)}</p>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-500">Created</span>
              <p className="text-slate-900 dark:text-white">{formatDate(schedule.created_at)}</p>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-500">Notify on completion</span>
              <p className="text-slate-900 dark:text-white">{schedule.notify_on_completion ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-500">Notify on failure</span>
              <p className="text-slate-900 dark:text-white">{schedule.notify_on_failure ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </div>

        {/* Run History */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Run History ({totalRuns})
            </h2>
          </div>
          {allRuns.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-slate-500 dark:text-slate-500">
              No runs yet. The schedule will execute at the next scheduled time.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900/50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-500">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-500">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-500">SEO</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-500">A11y</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-500">Security</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-500">Perf</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-500">Issues</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {allRuns.map((run) => (
                    <tr key={run.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <td className="px-4 py-2.5">
                        <Link
                          to={`/audits/${run.id}`}
                          className="inline-flex items-center gap-1.5"
                        >
                          {run.status === 'completed' ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          ) : run.status === 'failed' ? (
                            <XCircle className="w-3.5 h-3.5 text-red-500" />
                          ) : (
                            <Loader2 className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
                          )}
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-300 capitalize">
                            {run.status}
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-slate-600 dark:text-slate-500">
                        {formatDate(run.created_at)}
                      </td>
                      <td className="px-4 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                        {run.seo_score ?? '-'}
                      </td>
                      <td className="px-4 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                        {run.accessibility_score ?? '-'}
                      </td>
                      <td className="px-4 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                        {run.security_score ?? '-'}
                      </td>
                      <td className="px-4 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                        {run.performance_score ?? '-'}
                      </td>
                      <td className="px-4 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                        {run.total_issues ?? '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Danger Zone */}
        <div className="bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900/50 rounded-lg p-6">
          <h2 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-2">Danger Zone</h2>
          <p className="text-xs text-slate-500 dark:text-slate-500 mb-4">
            Permanently delete this schedule. Run history will be preserved in your audit list.
          </p>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            {deleting ? 'Deleting...' : 'Delete Schedule'}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
