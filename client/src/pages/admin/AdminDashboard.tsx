import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { adminApi } from '../../services/api';
import type {
  WorkerStatus,
  QueueBacklog,
  CrmStats,
  CrmTriggerStats,
  EmailAnalyticsTotals,
  CmsStatsResponse,
  AdminRevenueAnalytics,
} from '../../services/api';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { useToast } from '../../components/ui/Toast';
import type { DashboardStats, SystemHealth, AnalyticsDataPoint } from '../../types/admin.types';
import {
  UserSearch, Zap, Mail, FileText, DollarSign,
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  Users, Eye, Send, AlertTriangle,
  Database, Cpu, Activity, CircleAlert,
  RefreshCw, Power, Loader2, Clock, XCircle,
} from 'lucide-react';

function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return 'Never';
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 0 }).format(n);
}

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString();
}

export default function AdminDashboardPage() {
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsDataPoint[]>([]);
  const [workerStatus, setWorkerStatus] = useState<WorkerStatus | null>(null);
  const [workerError, setWorkerError] = useState(false);
  const [queueBacklog, setQueueBacklog] = useState<QueueBacklog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRestarting, setIsRestarting] = useState(false);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);

  const [crmStats, setCrmStats] = useState<CrmStats | null>(null);
  const [triggerStats, setTriggerStats] = useState<CrmTriggerStats | null>(null);
  const [emailTotals, setEmailTotals] = useState<EmailAnalyticsTotals | null>(null);
  const [cmsStats, setCmsStats] = useState<CmsStatsResponse | null>(null);
  const [revenue, setRevenue] = useState<AdminRevenueAnalytics | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setIsLoading(true);
      const [dashboardRes, analyticsRes] = await Promise.all([
        adminApi.getDashboard(),
        adminApi.getAnalytics(14),
      ]);
      setStats(dashboardRes.data.stats);
      setHealth(dashboardRes.data.health);
      setAnalytics(analyticsRes.data.analytics);
    } catch {
      toast('Failed to load dashboard', 'error');
    } finally {
      setIsLoading(false);
    }
    loadWorkerStatus();
    loadModuleSummaries();
  };

  const loadWorkerStatus = async () => {
    try {
      const { data } = await adminApi.getWorkerStatus();
      setWorkerStatus(data);
      setWorkerError(false);
    } catch {
      setWorkerStatus(null);
      setWorkerError(true);
    }
    // Also load queue backlog
    try {
      const { data } = await adminApi.getQueueBacklog();
      setQueueBacklog(data);
    } catch { /* ignore */ }
  };

  const loadModuleSummaries = async () => {
    const [crmRes, trigRes, emailRes, cmsRes, revRes] = await Promise.allSettled([
      adminApi.getCrmStats(),
      adminApi.getTriggerStats(),
      adminApi.getEmailAnalytics(7),
      adminApi.getCmsStats(),
      adminApi.getRevenueAnalytics(),
    ]);
    if (crmRes.status === 'fulfilled') setCrmStats(crmRes.value.data.stats);
    if (trigRes.status === 'fulfilled') setTriggerStats(trigRes.value.data.stats);
    if (emailRes.status === 'fulfilled') setEmailTotals(emailRes.value.data.totals);
    if (cmsRes.status === 'fulfilled') setCmsStats(cmsRes.value.data);
    if (revRes.status === 'fulfilled') setRevenue(revRes.value.data);
  };

  const handleRestart = async () => {
    setShowRestartConfirm(false);
    setIsRestarting(true);
    try {
      await adminApi.restartWorker();
      toast('Worker restart initiated', 'success');
      setWorkerStatus(null);
      setWorkerError(false);
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        try {
          const { data } = await adminApi.getWorkerStatus();
          if (data.status === 'healthy') {
            setWorkerStatus(data);
            setWorkerError(false);
            setIsRestarting(false);
            clearInterval(poll);
            toast('Worker restarted successfully', 'success');
          }
        } catch { /* still restarting */ }
        if (attempts >= 30) {
          clearInterval(poll);
          setIsRestarting(false);
          setWorkerError(true);
          toast('Worker did not come back up within 30 seconds', 'error');
        }
      }, 1000);
    } catch {
      toast('Failed to restart worker', 'error');
      setIsRestarting(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-400/50" />
        </div>
      </AdminLayout>
    );
  }

  const churnRiskCount = crmStats?.by_status?.churning ?? 0;
  const pendingTriggers = triggerStats?.pending ?? 0;
  const emailOpenRate = emailTotals && emailTotals.delivered > 0
    ? Math.round((emailTotals.opened / emailTotals.delivered) * 1000) / 10
    : 0;
  const paidSubscribers = revenue
    ? Object.entries(revenue.byTier)
        .filter(([tier]) => tier !== 'free')
        .reduce((sum, [, t]) => sum + t.count, 0)
    : 0;
  const netMrr = revenue
    ? (revenue.newThisMonth.mrrGained ?? 0) - (revenue.churnThisMonth.mrrLost ?? 0)
    : 0;

  const maxChartVal = analytics.length > 0
    ? Math.max(...analytics.map(d => d.new_users + d.audits_today), 1)
    : 1;

  return (
    <AdminLayout>
      <Helmet><title>Admin: Dashboard | Kritano</title></Helmet>
      {/* Page Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white tracking-tight font-display">
          Dashboard
        </h1>
        <p className="text-sm text-slate-500 mt-1">Platform overview and system health</p>
      </div>

      {/* System Health Strip */}
      {health && (
        <div className="mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <HealthCard
              icon={Database}
              label="Database"
              value={health.database ? 'Connected' : 'Disconnected'}
              status={health.database ? 'good' : 'critical'}
            />
            <HealthCard
              icon={Activity}
              label="Queue Size"
              value={String(health.queueSize)}
              status="neutral"
            />
            <HealthCard
              icon={Cpu}
              label="Active Audits"
              value={String(health.activeAudits)}
              status={health.activeAudits > 0 ? 'active' : 'neutral'}
            />
            <HealthCard
              icon={CircleAlert}
              label="Failed Today"
              value={String(health.failedAuditsToday)}
              status={health.failedAuditsToday > 0 ? 'warning' : 'neutral'}
            />
          </div>
        </div>
      )}

      {/* Worker Status */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Worker Process</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={loadWorkerStatus}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white/[0.04] border border-white/[0.06] text-slate-500 hover:text-slate-200 hover:bg-white/[0.06] transition-all duration-200"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => setShowRestartConfirm(true)}
              disabled={isRestarting || workerError}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 hover:bg-amber-500/20 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Power className="w-3 h-3" />
              <span>{isRestarting ? 'Restarting...' : 'Restart'}</span>
            </button>
          </div>
        </div>

        {workerError && !isRestarting ? (
          <div className="admin-card border-red-500/20 bg-red-500/[0.06]">
            <div className="flex items-center space-x-3 p-5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-lg shadow-red-500/30" />
              <div>
                <div className="text-red-300 font-medium text-sm">Worker Offline</div>
                <div className="text-xs text-red-400/60 mt-0.5">
                  The worker process is not responding. It may have crashed or not been started.
                </div>
              </div>
            </div>
          </div>
        ) : isRestarting ? (
          <div className="admin-card border-amber-500/20 bg-amber-500/[0.06]">
            <div className="flex items-center space-x-3 p-5">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <div>
                <div className="text-amber-300 font-medium text-sm">Restarting...</div>
                <div className="text-xs text-amber-400/60 mt-0.5">Waiting for the worker to come back online.</div>
              </div>
            </div>
          </div>
        ) : workerStatus ? (
          <div className="admin-card overflow-hidden">
            <div className="px-5 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${workerStatus.isProcessing ? 'bg-indigo-400 animate-pulse shadow-lg shadow-indigo-400/30' : 'bg-emerald-400 shadow-lg shadow-emerald-400/30'}`} />
                <span className="text-white font-medium text-sm">
                  {workerStatus.isProcessing ? 'Processing' : 'Idle'}
                </span>
                <span className="text-slate-600 text-xs font-mono">{workerStatus.workerId}</span>
              </div>
              <span className="text-xs text-slate-500 font-mono">{formatUptime(workerStatus.uptime)}</span>
            </div>
            <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
            <div className="grid grid-cols-2 md:grid-cols-5">
              <WorkerStat label="Processed" value={workerStatus.stats.jobsProcessed} color="text-emerald-400" />
              <WorkerStat label="Failed" value={workerStatus.stats.jobsFailed} color={workerStatus.stats.jobsFailed > 0 ? 'text-red-400' : 'text-slate-500'} />
              <WorkerStat label="Last Job" value={formatRelativeTime(workerStatus.stats.lastJobTime)} isText />
              <WorkerStat
                label="Queue (24h)"
                value={`${workerStatus.queue24h.pending} / ${workerStatus.queue24h.processing} / ${workerStatus.queue24h.completed}`}
                isText
                sub="pend / proc / done"
              />
              <WorkerStat label="Failed (24h)" value={workerStatus.queue24h.failed} color={workerStatus.queue24h.failed > 0 ? 'text-red-400' : 'text-slate-500'} />
            </div>
            {workerStatus.memory && (
              <>
                <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
                <div className="px-5 py-3 flex items-center gap-4">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[11px] text-slate-500 uppercase tracking-wider font-medium shrink-0">Memory</span>
                    <div className="flex-1 h-2 bg-white/[0.04] rounded-full overflow-hidden min-w-[80px] max-w-[160px]">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          workerStatus.memory.usedPercent > workerStatus.memory.threshold
                            ? 'bg-red-500'
                            : workerStatus.memory.usedPercent > 60
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${workerStatus.memory.usedPercent}%` }}
                      />
                    </div>
                    <span className={`text-xs font-mono font-medium ${
                      workerStatus.memory.usedPercent > workerStatus.memory.threshold
                        ? 'text-red-400'
                        : workerStatus.memory.usedPercent > 60
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}>
                      {workerStatus.memory.usedPercent}%
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-600 font-mono shrink-0">
                    {workerStatus.memory.freeMB.toLocaleString()} MB free / {workerStatus.memory.totalMB.toLocaleString()} MB
                  </span>
                  <span className="text-[11px] text-slate-600 shrink-0">
                    Concurrency: <span className="text-slate-500 font-mono">{workerStatus.memory.effectiveConcurrency}</span>
                  </span>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="admin-card p-5">
            <div className="h-5 w-28 bg-white/[0.04] rounded animate-pulse" />
          </div>
        )}
      </div>

      {/* Queue Backlog */}
      {queueBacklog && (
        <QueueBacklogPanel
          data={queueBacklog}
          onRefresh={loadWorkerStatus}
          toast={toast}
          onDataChange={async () => {
            try {
              const { data } = await adminApi.getQueueBacklog();
              setQueueBacklog(data);
            } catch { /* ignore */ }
          }}
        />
      )}

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            title="Users"
            value={stats.users.total}
            link="/admin/users"
            accent="indigo"
            rows={[
              { label: 'Verified', value: String(stats.users.verified), color: 'text-emerald-400' },
              { label: 'New today', value: `+${stats.users.newToday}`, color: 'text-indigo-400' },
              { label: 'This week', value: `+${stats.users.newThisWeek}`, color: 'text-indigo-400' },
            ]}
          />
          <MetricCard
            title="Organizations"
            value={stats.organizations.total}
            link="/admin/organizations"
            accent="violet"
            rows={[
              { label: 'New today', value: `+${stats.organizations.newToday}`, color: 'text-indigo-400' },
              { label: 'This week', value: `+${stats.organizations.newThisWeek}`, color: 'text-indigo-400' },
            ]}
          />
          <div className="admin-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-300">Subscriptions</h3>
            </div>
            <div className="space-y-2.5">
              {[
                { label: 'Free', count: stats.subscriptions.free, color: 'bg-slate-500' },
                { label: 'Starter', count: stats.subscriptions.starter, color: 'bg-indigo-500' },
                { label: 'Pro', count: stats.subscriptions.pro, color: 'bg-indigo-400' },
                { label: 'Agency', count: stats.subscriptions.agency, color: 'bg-violet-500' },
                { label: 'Enterprise', count: stats.subscriptions.enterprise, color: 'bg-amber-500' },
              ].map((tier) => (
                <div key={tier.label} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${tier.color}`} />
                    <span className="text-sm text-slate-500">{tier.label}</span>
                  </div>
                  <span className="text-sm font-medium text-slate-200 tabular-nums">{tier.count}</span>
                </div>
              ))}
            </div>
          </div>
          <MetricCard
            title="Audits"
            value={stats.audits.total}
            accent="emerald"
            rows={[
              { label: 'Today', value: `+${stats.audits.today}`, color: 'text-emerald-400' },
              { label: 'This week', value: `+${stats.audits.thisWeek}`, color: 'text-emerald-400' },
              { label: 'Pages today', value: String(stats.audits.pagesCrawledToday), color: 'text-indigo-400' },
            ]}
          />
        </div>
      )}

      {/* Module Summaries */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* CRM */}
          <ModuleCard
            icon={UserSearch}
            iconColor="text-indigo-400"
            iconBg="bg-indigo-500/10"
            title="CRM"
            link="/admin/crm/leads"
            loading={!crmStats}
          >
            {crmStats && (
              <>
                <div className="mb-3">
                  <span className="text-2xl font-bold text-white tabular-nums">{formatNumber(crmStats.total)}</span>
                  <span className="text-xs text-slate-500 ml-2">leads</span>
                </div>
                <div className="space-y-2">
                  <ModuleRow label="Avg score" value={String(Math.round(crmStats.avg_score))} color="text-indigo-400" />
                  {pendingTriggers > 0 && (
                    <ModuleAlert icon={Zap} color="amber" text={`${pendingTriggers} pending triggers`} />
                  )}
                  {churnRiskCount > 0 && (
                    <ModuleAlert icon={AlertTriangle} color="red" text={`${churnRiskCount} churn risk`} />
                  )}
                </div>
              </>
            )}
          </ModuleCard>

          {/* Email */}
          <ModuleCard
            icon={Mail}
            iconColor="text-blue-400"
            iconBg="bg-blue-500/10"
            title="Email"
            link="/admin/email/analytics"
            loading={!emailTotals}
          >
            {emailTotals && (
              <>
                <div className="mb-3">
                  <span className="text-2xl font-bold text-white tabular-nums">{formatNumber(emailTotals.sent)}</span>
                  <span className="text-xs text-slate-500 ml-2">sent (7d)</span>
                </div>
                <div className="space-y-2">
                  <ModuleRow label="Open rate" value={`${emailOpenRate}%`} color="text-emerald-400" />
                  <ModuleRow label="Delivered" value={formatNumber(emailTotals.delivered)} />
                  <ModuleRow label="Clicked" value={formatNumber(emailTotals.clicked)} color="text-blue-400" />
                  {emailTotals.bounced > 0 && (
                    <ModuleRow label="Bounced" value={String(emailTotals.bounced)} color="text-red-400" />
                  )}
                </div>
              </>
            )}
          </ModuleCard>

          {/* CMS */}
          <ModuleCard
            icon={FileText}
            iconColor="text-violet-400"
            iconBg="bg-violet-500/10"
            title="CMS"
            link="/admin/cms/posts"
            loading={!cmsStats}
          >
            {cmsStats && (
              <>
                <div className="mb-3">
                  <span className="text-2xl font-bold text-white tabular-nums">{cmsStats.published}</span>
                  <span className="text-xs text-slate-500 ml-2">published</span>
                </div>
                <div className="space-y-2">
                  <ModuleRow label="Total views" value={formatNumber(cmsStats.totalViews)} icon={Eye} />
                  {cmsStats.drafts > 0 && (
                    <ModuleAlert icon={Send} color="indigo" text={`${cmsStats.drafts} drafts`} />
                  )}
                  <ModuleRow label="Media files" value={String(cmsStats.totalMedia)} />
                </div>
              </>
            )}
          </ModuleCard>

          {/* Revenue */}
          <ModuleCard
            icon={DollarSign}
            iconColor="text-emerald-400"
            iconBg="bg-emerald-500/10"
            title="Revenue"
            link="/admin/analytics/revenue"
            loading={!revenue}
          >
            {revenue && (
              <>
                <div className="mb-3">
                  <span className="text-2xl font-bold text-emerald-400 tabular-nums">{formatCurrency(revenue.mrr)}</span>
                  <span className="text-xs text-slate-500 ml-2">MRR</span>
                </div>
                <div className="space-y-2">
                  <ModuleRow label="Paid subscribers" value={String(paidSubscribers)} icon={Users} />
                  {netMrr !== 0 && (
                    <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg ${
                      netMrr >= 0 ? 'bg-emerald-500/[0.08] border border-emerald-500/15' : 'bg-red-500/[0.08] border border-red-500/15'
                    }`}>
                      {netMrr >= 0 ? (
                        <><ArrowUpRight className="w-3 h-3 text-emerald-400" /><span className="text-[11px] text-emerald-300 font-medium">+{formatCurrency(netMrr)} this month</span></>
                      ) : (
                        <><ArrowDownRight className="w-3 h-3 text-red-400" /><span className="text-[11px] text-red-300 font-medium">{formatCurrency(netMrr)} this month</span></>
                      )}
                    </div>
                  )}
                  {revenue.churnThisMonth.count > 0 && (
                    <ModuleRow label="Churn" value={String(revenue.churnThisMonth.count)} color="text-red-400" icon={TrendingDown} />
                  )}
                  {revenue.newThisMonth.count > 0 && (
                    <ModuleRow label="New" value={`+${revenue.newThisMonth.count}`} color="text-emerald-400" icon={TrendingUp} />
                  )}
                </div>
              </>
            )}
          </ModuleCard>
        </div>
      </div>

      {/* Activity Chart */}
      {analytics.length > 0 && (
        <div className="admin-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-semibold text-slate-300">14-Day Activity</h3>
            <div className="flex items-center space-x-4 text-[11px] text-slate-500">
              <span className="flex items-center space-x-1.5"><span className="w-2 h-2 rounded-sm bg-indigo-500" /> <span>Users + Audits</span></span>
            </div>
          </div>
          <div className="flex items-end justify-between gap-1.5 h-32">
            {analytics.map((day, index) => {
              const val = day.new_users + day.audits_today;
              const heightPct = maxChartVal > 0 ? (val / maxChartVal) * 100 : 0;
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center group">
                  <div className="relative w-full flex justify-center mb-2">
                    {/* Tooltip */}
                    <div className="absolute -top-8 hidden group-hover:block bg-[#1a1d28] border border-white/[0.08] text-[10px] text-slate-300 px-2 py-1 rounded-md whitespace-nowrap z-10 shadow-xl">
                      {day.new_users}u · {day.audits_today}a
                    </div>
                    <div
                      className="w-full max-w-[20px] rounded-sm bg-gradient-to-t from-indigo-600/80 to-indigo-400/80 transition-all duration-300 group-hover:from-indigo-500 group-hover:to-indigo-300"
                      style={{
                        height: `${Math.max(3, heightPct)}%`,
                        opacity: 0.5 + (index / analytics.length) * 0.5,
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-600 tabular-nums">
                    {new Date(day.date).getDate()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Restart confirmation modal */}
      {showRestartConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowRestartConfirm(false)} />
          <div className="relative admin-card w-full max-w-md mx-4 p-6 shadow-2xl">
            <h3 className="text-base font-semibold text-white mb-2">Restart Worker?</h3>
            <p className="text-sm text-slate-500 mb-4">
              This will gracefully shut down the worker process. Any in-progress audits will be interrupted and retried when the worker restarts.
            </p>
            <p className="text-xs text-amber-400/80 mb-6">
              The worker must be managed by a process manager (PM2, Docker, systemd) for automatic restart.
            </p>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowRestartConfirm(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-200 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleRestart}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-amber-500/15 border border-amber-500/25 text-amber-300 hover:bg-amber-500/25 transition-all duration-200"
              >
                Restart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shared admin card styles */}
      <style>{`
        .admin-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          backdrop-filter: blur(12px);
        }
        .admin-card:hover {
          border-color: rgba(255, 255, 255, 0.08);
        }
      `}</style>
    </AdminLayout>
  );
}

/* ---------- Subcomponents ---------- */

function HealthCard({
  icon: Icon,
  label,
  value,
  status,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  status: 'good' | 'warning' | 'critical' | 'active' | 'neutral';
}) {
  const config = {
    good:     { bg: 'bg-emerald-500/[0.06]', border: 'border-emerald-500/20', text: 'text-emerald-400', icon: 'text-emerald-500/60' },
    warning:  { bg: 'bg-amber-500/[0.06]', border: 'border-amber-500/20', text: 'text-amber-400', icon: 'text-amber-500/60' },
    critical: { bg: 'bg-red-500/[0.06]', border: 'border-red-500/20', text: 'text-red-400', icon: 'text-red-500/60' },
    active:   { bg: 'bg-indigo-500/[0.06]', border: 'border-indigo-500/20', text: 'text-indigo-400', icon: 'text-indigo-500/60' },
    neutral:  { bg: 'bg-white/[0.02]', border: 'border-white/[0.06]', text: 'text-slate-200', icon: 'text-slate-600' },
  }[status];

  return (
    <div className={`rounded-xl p-4 ${config.bg} border ${config.border} transition-colors duration-200`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] text-slate-500 uppercase tracking-wider mb-1">{label}</p>
          <p className={`text-lg font-semibold tabular-nums ${config.text}`}>{value}</p>
        </div>
        <Icon className={`w-5 h-5 ${config.icon}`} />
      </div>
    </div>
  );
}

function WorkerStat({ label, value, color, isText, sub }: {
  label: string;
  value: string | number;
  color?: string;
  isText?: boolean;
  sub?: string;
}) {
  return (
    <div className="px-4 py-3 border-r border-b md:border-b-0 border-white/[0.04] last:border-r-0">
      <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-1">{label}</p>
      <p className={`${isText ? 'text-sm' : 'text-base'} font-semibold tabular-nums ${color || 'text-slate-300'}`}>{value}</p>
      {sub && <p className="text-[10px] text-slate-600 mt-0.5">{sub}</p>}
    </div>
  );
}

function MetricCard({
  title,
  value,
  link,
  accent,
  rows,
}: {
  title: string;
  value: number;
  link?: string;
  accent: 'indigo' | 'violet' | 'emerald';
  rows: Array<{ label: string; value: string; color?: string }>;
}) {
  const accentColors = {
    indigo: 'from-indigo-500/20 to-transparent',
    violet: 'from-violet-500/20 to-transparent',
    emerald: 'from-emerald-500/20 to-transparent',
  };

  return (
    <div className="admin-card p-5 relative overflow-hidden">
      {/* Subtle top gradient accent */}
      <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r ${accentColors[accent]}`} />
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-300">{title}</h3>
        {link && <Link to={link} className="text-[11px] text-indigo-400/70 hover:text-indigo-300 transition-colors">View all</Link>}
      </div>
      <div className="text-3xl font-bold text-white mb-3 tabular-nums">{value.toLocaleString()}</div>
      <div className="space-y-1.5">
        {rows.map((row) => (
          <div key={row.label} className="flex justify-between text-sm">
            <span className="text-slate-500">{row.label}</span>
            <span className={`font-medium tabular-nums ${row.color || 'text-slate-300'}`}>{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ModuleCard({
  icon: Icon,
  iconColor,
  iconBg,
  title,
  link,
  loading,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  iconBg: string;
  title: string;
  link: string;
  loading: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="admin-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2.5">
          <div className={`w-7 h-7 rounded-lg ${iconBg} flex items-center justify-center`}>
            <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
          </div>
          <h3 className="text-sm font-semibold text-slate-300">{title}</h3>
        </div>
        <Link to={link} className="text-[11px] text-indigo-400/70 hover:text-indigo-300 transition-colors">View</Link>
      </div>
      {loading ? <LoadingPlaceholder /> : children}
    </div>
  );
}

function ModuleRow({ label, value, color, icon: Icon }: {
  label: string;
  value: string;
  color?: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-slate-500 flex items-center gap-1.5">
        {Icon && <Icon className="w-3 h-3 text-slate-600" />}
        {label}
      </span>
      <span className={`font-medium tabular-nums ${color || 'text-slate-300'}`}>{value}</span>
    </div>
  );
}

function ModuleAlert({ icon: Icon, color, text }: {
  icon: React.ComponentType<{ className?: string }>;
  color: 'amber' | 'red' | 'indigo';
  text: string;
}) {
  const colors = {
    amber: 'bg-amber-500/[0.08] border-amber-500/15 text-amber-300',
    red: 'bg-red-500/[0.08] border-red-500/15 text-red-300',
    indigo: 'bg-indigo-500/[0.08] border-indigo-500/15 text-indigo-300',
  };
  const iconColors = {
    amber: 'text-amber-400',
    red: 'text-red-400',
    indigo: 'text-indigo-400',
  };

  return (
    <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border ${colors[color]}`}>
      <Icon className={`w-3 h-3 ${iconColors[color]}`} />
      <span className="text-[11px] font-medium">{text}</span>
    </div>
  );
}

function LoadingPlaceholder() {
  return (
    <div className="space-y-3">
      <div className="h-7 w-16 bg-white/[0.04] rounded animate-pulse" />
      <div className="h-4 w-28 bg-white/[0.03] rounded animate-pulse" />
      <div className="h-4 w-20 bg-white/[0.03] rounded animate-pulse" />
    </div>
  );
}

// =============================================
// Queue Backlog Panel
// =============================================

function QueueBacklogPanel({
  data,
  onRefresh,
  onDataChange,
  toast,
}: {
  data: QueueBacklog;
  onRefresh: () => void;
  onDataChange: () => void;
  toast: (msg: string, type: 'success' | 'error') => void;
}) {
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancellingAll, setCancellingAll] = useState(false);

  const handleCancel = async (jobId: string) => {
    if (!confirm('Cancel this audit job?')) return;
    setCancellingId(jobId);
    try {
      await adminApi.cancelQueueJob(jobId);
      toast('Job cancelled', 'success');
      onDataChange();
    } catch {
      toast('Failed to cancel job', 'error');
    } finally {
      setCancellingId(null);
    }
  };

  const handleCancelAll = async () => {
    const pendingCount = data.counts.pending;
    if (!confirm(`Cancel all ${pendingCount} pending jobs?`)) return;
    setCancellingAll(true);
    try {
      const { data: result } = await adminApi.cancelAllPending();
      toast(`${result.cancelled} jobs cancelled`, 'success');
      onDataChange();
    } catch {
      toast('Failed to cancel jobs', 'error');
    } finally {
      setCancellingAll(false);
    }
  };

  const processingJobs = data.jobs.filter(j => j.status === 'processing');
  const discoveringJobs = data.jobs.filter(j => j.status === 'discovering');
  const readyJobs = data.jobs.filter(j => j.status === 'ready');
  const pendingJobs = data.jobs.filter(j => j.status === 'pending');
  const totalPending = data.counts.pending + data.counts.discovering + data.counts.ready;
  const allWaitingJobs = [...pendingJobs, ...discoveringJobs, ...readyJobs];
  const shownWaiting = allWaitingJobs.slice(0, 5);
  const hiddenWaiting = totalPending - shownWaiting.length;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Audit Queue</h2>
        <div className="flex items-center gap-2">
          {data.counts.pending > 1 && (
            <button
              onClick={handleCancelAll}
              disabled={cancellingAll}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 hover:bg-red-500/20 transition-all duration-200 disabled:opacity-40"
            >
              <XCircle className="w-3 h-3" />
              <span>{cancellingAll ? 'Cancelling...' : 'Cancel All Pending'}</span>
            </button>
          )}
          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white/[0.04] border border-white/[0.06] text-slate-500 hover:text-slate-200 hover:bg-white/[0.06] transition-all duration-200"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 md:grid-cols-7 gap-3 mb-4">
        <div className="admin-card px-4 py-3">
          <div className="text-[10px] uppercase tracking-wider text-slate-600 mb-1">Pending</div>
          <div className={`text-xl font-bold tabular-nums ${data.counts.pending > 0 ? 'text-amber-300' : 'text-slate-500'}`}>{data.counts.pending}</div>
        </div>
        <div className="admin-card px-4 py-3">
          <div className="text-[10px] uppercase tracking-wider text-slate-600 mb-1">Discovering</div>
          <div className={`text-xl font-bold tabular-nums ${data.counts.discovering > 0 ? 'text-sky-300' : 'text-slate-500'}`}>{data.counts.discovering}</div>
        </div>
        <div className="admin-card px-4 py-3">
          <div className="text-[10px] uppercase tracking-wider text-slate-600 mb-1">Ready</div>
          <div className={`text-xl font-bold tabular-nums ${data.counts.ready > 0 ? 'text-amber-300' : 'text-slate-500'}`}>{data.counts.ready}</div>
        </div>
        <div className="admin-card px-4 py-3">
          <div className="text-[10px] uppercase tracking-wider text-slate-600 mb-1">Processing</div>
          <div className={`text-xl font-bold tabular-nums ${data.counts.processing > 0 ? 'text-indigo-300' : 'text-slate-500'}`}>{data.counts.processing}</div>
        </div>
        <div className="admin-card px-4 py-3">
          <div className="text-[10px] uppercase tracking-wider text-slate-600 mb-1">Done (24h)</div>
          <div className="text-xl font-bold tabular-nums text-emerald-400">{data.counts.completed24h}</div>
        </div>
        <div className="admin-card px-4 py-3">
          <div className="text-[10px] uppercase tracking-wider text-slate-600 mb-1">Failed (24h)</div>
          <div className={`text-xl font-bold tabular-nums ${data.counts.failed24h > 0 ? 'text-red-400' : 'text-slate-500'}`}>{data.counts.failed24h}</div>
        </div>
        <div className="admin-card px-4 py-3">
          <div className="text-[10px] uppercase tracking-wider text-slate-600 mb-1">Avg Duration</div>
          <div className="text-xl font-bold tabular-nums text-slate-300">
            {data.counts.avgDurationSeconds ? `${Math.round(data.counts.avgDurationSeconds / 60)}m` : 'N/A'}
          </div>
        </div>
      </div>

      {/* Job lists */}
      {data.jobs.length === 0 && data.recentFailed.length === 0 ? (
        <div className="admin-card p-5">
          <p className="text-sm text-slate-500">Queue is empty. No pending or active audits.</p>
        </div>
      ) : (
        <div className="admin-card overflow-hidden">
          {/* Processing jobs */}
          {processingJobs.length > 0 && (
            <>
              <div className="px-5 py-2.5 bg-white/[0.02] border-b border-white/[0.04]">
                <span className="text-[10px] uppercase tracking-wider text-indigo-400 font-semibold flex items-center gap-1.5">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Processing Now
                </span>
              </div>
              <div className="divide-y divide-white/[0.04]">
                {processingJobs.map(job => {
                  const progress = job.pages_found > 0
                    ? Math.round((job.pages_crawled / job.pages_found) * 100)
                    : 0;
                  const runningFor = job.started_at
                    ? Math.round((Date.now() - new Date(job.started_at).getTime()) / 60000)
                    : 0;

                  return (
                    <div key={job.id} className="px-5 py-3.5">
                      <div className="flex items-center gap-4">
                        <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse shadow-lg shadow-indigo-400/30 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white">{job.target_domain}</span>
                            <span className="text-xs text-slate-600">{job.max_pages} pages max</span>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {job.user_first_name} ({job.user_email}) &middot; Running {runningFor}m
                          </div>
                        </div>
                        <button
                          onClick={() => handleCancel(job.id)}
                          disabled={cancellingId === job.id}
                          className="flex-shrink-0 p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
                          title="Cancel job"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                      {/* Progress bar */}
                      <div className="mt-2.5 ml-6">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-slate-500">{job.pages_crawled}/{job.pages_found || '?'} pages &middot; {job.pages_audited} audited &middot; {job.total_issues} issues</span>
                          <span className="text-[10px] text-slate-500 font-mono">{progress}%</span>
                        </div>
                        <div className="w-full bg-white/[0.06] rounded-full h-1.5">
                          <div className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${Math.max(2, progress)}%` }} />
                        </div>
                        {job.current_url && (
                          <div className="text-[10px] text-slate-600 truncate mt-1">{job.current_url}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Waiting jobs: discovering, ready, pending (top 5) */}
          {shownWaiting.length > 0 && (
            <>
              <div className="px-5 py-2.5 bg-white/[0.02] border-b border-white/[0.04]">
                <span className="text-[10px] uppercase tracking-wider text-amber-400 font-semibold flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  Queued ({totalPending} total)
                </span>
              </div>
              <div className="divide-y divide-white/[0.04]">
                {shownWaiting.map((job, index) => {
                  const waitingFor = Math.round((Date.now() - new Date(job.created_at).getTime()) / 60000);
                  const statusLabel = job.status === 'discovering' ? 'Discovering' : job.status === 'ready' ? 'Ready' : 'Pending';
                  const statusColor = job.status === 'discovering' ? 'text-sky-400' : job.status === 'ready' ? 'text-amber-300' : 'text-slate-500';

                  return (
                    <div key={job.id} className="px-5 py-3 flex items-center gap-4">
                      <div className="flex-shrink-0 w-6 text-center">
                        <span className="text-xs text-slate-600 font-mono">#{index + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">{job.target_domain}</span>
                          <span className={`text-[10px] font-medium ${statusColor}`}>{statusLabel}</span>
                          <span className="text-xs text-slate-600">{job.max_pages} pages</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {job.user_first_name} ({job.user_email}) &middot; Waiting {waitingFor}m
                        </div>
                      </div>
                      <button
                        onClick={() => handleCancel(job.id)}
                        disabled={cancellingId === job.id}
                        className="flex-shrink-0 p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        title="Cancel job"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
                {hiddenWaiting > 0 && (
                  <div className="px-5 py-2.5 text-center">
                    <span className="text-xs text-slate-600">+{hiddenWaiting} more queued jobs</span>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Recent Failed */}
          {data.recentFailed.length > 0 && (
            <>
              <div className="px-5 py-2.5 bg-white/[0.02] border-b border-white/[0.04]">
                <span className="text-[10px] uppercase tracking-wider text-red-400 font-semibold flex items-center gap-1.5">
                  <XCircle className="w-3 h-3" />
                  Recent Failures (24h)
                </span>
              </div>
              <div className="divide-y divide-white/[0.04]">
                {data.recentFailed.map(job => (
                  <div key={job.id} className="px-5 py-3 flex items-center gap-4">
                    <div className="w-6" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-red-300">{job.target_domain}</span>
                        <span className="text-xs text-slate-600">{job.user_first_name} ({job.user_email})</span>
                      </div>
                      {job.error_message && (
                        <div className="text-xs text-red-400/60 truncate mt-0.5">{job.error_message}</div>
                      )}
                    </div>
                    <span className="text-xs text-slate-600 font-mono flex-shrink-0">
                      {job.completed_at ? formatRelativeTime(job.completed_at) : ''}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
