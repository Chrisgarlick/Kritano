import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Zap,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Send,
  X,
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { AdminLayout } from '../../../components/layout/AdminLayout';
import { adminApi } from '../../../services/api';
import type { CrmTrigger, CrmTriggerStats } from '../../../services/api';
import { useToast } from '../../../components/ui/Toast';

// ---------------------------------------------------------------------------
// Trigger type config
// ---------------------------------------------------------------------------

const TRIGGER_TYPES = [
  'stalled_verification',
  'security_alert',
  'upgrade_nudge',
  'low_aeo_score',
  'low_content_score',
  'churn_risk',
  'score_improvement',
  'first_audit_complete',
] as const;

type TriggerType = (typeof TRIGGER_TYPES)[number];

const TRIGGER_TYPE_CONFIG: Record<TriggerType, { label: string; color: string; bg: string; text: string }> = {
  stalled_verification: {
    label: 'Stalled Verification',
    color: 'amber',
    bg: 'bg-amber-900/50',
    text: 'text-amber-300',
  },
  security_alert: {
    label: 'Security Alert',
    color: 'red',
    bg: 'bg-red-900/50',
    text: 'text-red-300',
  },
  upgrade_nudge: {
    label: 'Upgrade Nudge',
    color: 'purple',
    bg: 'bg-purple-900/50',
    text: 'text-purple-300',
  },
  low_aeo_score: {
    label: 'Low AEO Score',
    color: 'orange',
    bg: 'bg-orange-900/50',
    text: 'text-orange-300',
  },
  low_content_score: {
    label: 'Low Content Score',
    color: 'orange',
    bg: 'bg-orange-900/50',
    text: 'text-orange-300',
  },
  churn_risk: {
    label: 'Churn Risk',
    color: 'red',
    bg: 'bg-red-900/50',
    text: 'text-red-300',
  },
  score_improvement: {
    label: 'Score Improvement',
    color: 'green',
    bg: 'bg-emerald-900/50',
    text: 'text-emerald-300',
  },
  first_audit_complete: {
    label: 'First Audit',
    color: 'blue',
    bg: 'bg-blue-900/50',
    text: 'text-blue-300',
  },
};

const STATUS_OPTIONS = ['all', 'pending', 'sent', 'dismissed', 'actioned'] as const;

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: 'bg-amber-900/50', text: 'text-amber-300' },
  sent: { bg: 'bg-emerald-900/50', text: 'text-emerald-300' },
  dismissed: { bg: 'bg-white/[0.06]', text: 'text-slate-300' },
  actioned: { bg: 'bg-blue-900/50', text: 'text-blue-300' },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getTriggerConfig(type: string) {
  return TRIGGER_TYPE_CONFIG[type as TriggerType] ?? {
    label: type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    color: 'slate',
    bg: 'bg-white/[0.06]',
    text: 'text-slate-300',
  };
}

function getStatusColors(status: string) {
  return STATUS_COLORS[status] ?? { bg: 'bg-white/[0.06]', text: 'text-slate-300' };
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function truncateContext(context: Record<string, unknown>, maxLen = 80): string {
  const str = JSON.stringify(context);
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + '...';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TriggersPage() {
  const { toast } = useToast();

  // Data
  const [triggers, setTriggers] = useState<CrmTrigger[]>([]);
  const [stats, setStats] = useState<CrmTriggerStats | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const limit = 25;

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Loading
  const [isLoading, setIsLoading] = useState(true);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);

  // -----------------------------------
  // Data fetching
  // -----------------------------------

  const loadStats = async () => {
    try {
      setIsStatsLoading(true);
      const { data } = await adminApi.getTriggerStats();
      setStats(data.stats);
    } catch {
      toast('Failed to load trigger stats', 'error');
    } finally {
      setIsStatsLoading(false);
    }
  };

  const loadTriggers = async () => {
    try {
      setIsLoading(true);
      const { data } = await adminApi.getTriggers({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        type: typeFilter !== 'all' ? typeFilter : undefined,
        page,
        limit,
      });
      setTriggers(data.triggers);
      setTotalPages(data.pagination.pages);
      setTotal(data.pagination.total);
    } catch {
      toast('Failed to load triggers', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    loadTriggers();
  }, [page, statusFilter, typeFilter]);

  // -----------------------------------
  // Actions
  // -----------------------------------

  const handleAction = async (triggerId: string, action: 'sent' | 'dismissed') => {
    try {
      setActioningId(triggerId);
      await adminApi.actionTrigger(triggerId, action);
      toast(`Trigger marked as ${action}`, 'success');
      // Refresh both list and stats
      await Promise.all([loadTriggers(), loadStats()]);
    } catch {
      toast(`Failed to mark trigger as ${action}`, 'error');
    } finally {
      setActioningId(null);
    }
  };

  const handleFilterChange = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    setter(e.target.value);
    setPage(1);
  };

  const handleRefresh = () => {
    loadTriggers();
    loadStats();
  };

  // -----------------------------------
  // Render
  // -----------------------------------

  return (
    <AdminLayout>
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex items-center space-x-3 mb-4 sm:mb-0">
          <Zap className="w-6 h-6 text-indigo-400" />
          <h1 className="text-3xl font-bold text-white tracking-tight" style={{ fontFamily: "'Instrument Serif', serif" }}>CRM Triggers</h1>
        </div>
        <button
          onClick={handleRefresh}
          className="inline-flex items-center space-x-2 px-3 py-2 bg-white/[0.02] border border-white/[0.06] rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatsCard
          label="Total"
          value={stats?.total ?? '-'}
          icon={<Zap className="w-5 h-5 text-indigo-400" />}
          loading={isStatsLoading}
        />
        <StatsCard
          label="Pending"
          value={stats?.pending ?? '-'}
          icon={<Clock className="w-5 h-5 text-amber-400" />}
          loading={isStatsLoading}
          highlight
        />
        <StatsCard
          label="Sent"
          value={stats?.sent ?? '-'}
          icon={<CheckCircle className="w-5 h-5 text-emerald-400" />}
          loading={isStatsLoading}
        />
        <StatsCard
          label="Dismissed"
          value={stats?.dismissed ?? '-'}
          icon={<XCircle className="w-5 h-5 text-slate-400" />}
          loading={isStatsLoading}
        />
      </div>

      {/* By-type breakdown */}
      {stats && stats.by_type && Object.keys(stats.by_type).length > 0 && (
        <div className="bg-white/[0.02] rounded-lg border border-white/[0.06] p-4 mb-6">
          <h3 className="text-sm font-medium text-slate-400 mb-3">By Trigger Type</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.by_type).map(([type, count]) => {
              const cfg = getTriggerConfig(type);
              return (
                <span
                  key={type}
                  className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}
                >
                  <span>{cfg.label}</span>
                  <span className="opacity-75">{count}</span>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="flex items-center space-x-2">
          <Search className="w-4 h-4 text-slate-500" />
          <span className="text-sm text-slate-400">Filters:</span>
        </div>
        <select
          value={statusFilter}
          onChange={handleFilterChange(setStatusFilter)}
          className="px-3 py-2 bg-white/[0.02] border border-white/[0.06] rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={handleFilterChange(setTypeFilter)}
          className="px-3 py-2 bg-white/[0.02] border border-white/[0.06] rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="all">All Types</option>
          {TRIGGER_TYPES.map((t) => (
            <option key={t} value={t}>
              {getTriggerConfig(t).label}
            </option>
          ))}
        </select>
      </div>

      {/* Trigger list */}
      <div className="bg-white/[0.02] rounded-lg border border-white/[0.06] overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto" />
          </div>
        ) : triggers.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No triggers found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06] text-left text-sm text-slate-400">
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium hidden lg:table-cell">Context</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {triggers.map((trigger) => {
                  const cfg = getTriggerConfig(trigger.trigger_type);
                  const statusColor = getStatusColors(trigger.status);
                  const userName = [trigger.user_first_name, trigger.user_last_name]
                    .filter(Boolean)
                    .join(' ');
                  const isActioning = actioningId === trigger.id;

                  return (
                    <tr key={trigger.id} className="hover:bg-white/[0.04] transition-colors">
                      {/* Type */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}
                        >
                          {cfg.label}
                        </span>
                      </td>

                      {/* User */}
                      <td className="px-4 py-3">
                        <div className="min-w-0">
                          <Link
                            to={`/admin/crm/leads/${trigger.user_id}`}
                            className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors truncate block"
                          >
                            {userName || 'Unknown User'}
                          </Link>
                          <div className="text-sm text-slate-400 truncate">
                            {trigger.user_email ?? '-'}
                          </div>
                          {trigger.user_lead_score !== undefined && (
                            <div className="flex items-center space-x-1 mt-0.5">
                              <TrendingUp className="w-3 h-3 text-slate-500" />
                              <span className="text-xs text-slate-500">
                                Score: {trigger.user_lead_score}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Context (hidden on small screens) */}
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-xs text-slate-400 font-mono break-all">
                          {trigger.context
                            ? truncateContext(trigger.context)
                            : '-'}
                        </span>
                      </td>

                      {/* Created */}
                      <td className="px-4 py-3">
                        <span className="text-sm text-slate-400 whitespace-nowrap" title={formatDateTime(trigger.created_at)}>
                          {formatDate(trigger.created_at)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColor.bg} ${statusColor.text}`}
                        >
                          {trigger.status.charAt(0).toUpperCase() + trigger.status.slice(1)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex justify-end space-x-2">
                          {trigger.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleAction(trigger.id, 'sent')}
                                disabled={isActioning}
                                className="inline-flex items-center space-x-1 px-2.5 py-1.5 text-xs font-medium rounded-md bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Send className="w-3 h-3" />
                                <span>Send</span>
                              </button>
                              <button
                                onClick={() => handleAction(trigger.id, 'dismissed')}
                                disabled={isActioning}
                                className="inline-flex items-center space-x-1 px-2.5 py-1.5 text-xs font-medium rounded-md bg-white/[0.06] hover:bg-white/[0.06] text-slate-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <X className="w-3 h-3" />
                                <span>Dismiss</span>
                              </button>
                            </>
                          )}
                          {trigger.status !== 'pending' && (
                            <span className="text-xs text-slate-500 italic">
                              {trigger.actioned_at
                                ? formatDate(trigger.actioned_at)
                                : 'No action needed'}
                            </span>
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
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-slate-400">
            Page {page} of {totalPages} ({total} total)
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="inline-flex items-center space-x-1 px-3 py-1.5 text-sm rounded-md bg-white/[0.02] border border-white/[0.06] text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="inline-flex items-center space-x-1 px-3 py-1.5 text-sm rounded-md bg-white/[0.02] border border-white/[0.06] text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

// ---------------------------------------------------------------------------
// Stats card sub-component
// ---------------------------------------------------------------------------

function StatsCard({
  label,
  value,
  icon,
  loading,
  highlight,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  loading: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        highlight
          ? 'bg-amber-900/20 border-amber-700/50'
          : 'bg-white/[0.02] border-white/[0.06]'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-slate-400">{label}</span>
        {icon}
      </div>
      {loading ? (
        <div className="h-7 w-16 bg-white/[0.06] rounded animate-pulse" />
      ) : (
        <p
          className={`text-2xl font-bold ${
            highlight ? 'text-amber-300' : 'text-white'
          }`}
        >
          {value}
        </p>
      )}
    </div>
  );
}
