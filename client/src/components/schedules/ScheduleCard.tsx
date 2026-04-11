import { Link } from 'react-router-dom';
import { CalendarClock, Clock, AlertTriangle, CheckCircle2, XCircle, Pause } from 'lucide-react';
import type { AuditScheduleSummary } from '../../services/api';

interface ScheduleCardProps {
  schedule: AuditScheduleSummary;
  onToggle?: (id: string, enabled: boolean) => void;
}

const frequencyLabels: Record<string, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  biweekly: 'Biweekly',
  monthly: 'Monthly',
  custom: 'Custom',
};

function getStatusInfo(schedule: AuditScheduleSummary) {
  if (schedule.paused_reason) {
    return { label: 'Paused', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30', icon: Pause };
  }
  if (!schedule.enabled) {
    return { label: 'Disabled', color: 'text-slate-500 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800', icon: XCircle };
  }
  if (schedule.last_status === 'failed') {
    return { label: 'Last run failed', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30', icon: AlertTriangle };
  }
  return { label: 'Active', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30', icon: CheckCircle2 };
}

function formatNextRun(nextRunAt: string | null) {
  if (!nextRunAt) return 'Not scheduled';
  const date = new Date(nextRunAt);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();

  if (diffMs < 0) return 'Overdue';
  if (diffMs < 60 * 60 * 1000) return `in ${Math.round(diffMs / 60000)}m`;
  if (diffMs < 24 * 60 * 60 * 1000) return `in ${Math.round(diffMs / 3600000)}h`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function ScheduleCard({ schedule, onToggle }: ScheduleCardProps) {
  const status = getStatusInfo(schedule);
  const StatusIcon = status.icon;

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <Link
            to={`/app/schedules/${schedule.id}`}
            className="text-sm font-semibold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 truncate block"
          >
            {schedule.name || schedule.target_domain}
          </Link>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
            {schedule.target_url}
          </p>
        </div>

        {onToggle && (
          <button
            onClick={() => onToggle(schedule.id, !schedule.enabled)}
            className={`
              relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent
              transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500/20
              ${schedule.enabled && !schedule.paused_reason ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'}
            `}
            role="switch"
            aria-checked={schedule.enabled}
          >
            <span
              className={`
                pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0
                transition duration-200 ease-in-out
                ${schedule.enabled && !schedule.paused_reason ? 'translate-x-4' : 'translate-x-0'}
              `}
            />
          </button>
        )}
      </div>

      <div className="flex items-center gap-3 mt-3">
        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${status.bg} ${status.color}`}>
          <StatusIcon className="w-3 h-3" />
          {status.label}
        </span>
        <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
          <CalendarClock className="w-3 h-3" />
          {frequencyLabels[schedule.frequency] || schedule.frequency}
        </span>
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
          <Clock className="w-3 h-3" />
          <span>Next: {schedule.enabled && !schedule.paused_reason ? formatNextRun(schedule.next_run_at) : 'Paused'}</span>
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {schedule.run_count} run{schedule.run_count !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
}
