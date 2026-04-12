import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { Users, Search, RefreshCw, ChevronLeft, ChevronRight, TrendingUp, UserPlus, Zap, AlertTriangle } from 'lucide-react';
import { AdminLayout } from '../../../components/layout/AdminLayout';
import { Tooltip } from '../../../components/ui/Tooltip';
import { adminApi } from '../../../services/api';
import type { CrmLead, CrmStats } from '../../../services/api';
import type { Pagination } from '../../../types/audit.types';

const STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'new', label: 'New' },
  { value: 'activated', label: 'Activated' },
  { value: 'engaged', label: 'Engaged' },
  { value: 'power_user', label: 'Power User' },
  { value: 'upgrade_prospect', label: 'Upgrade Prospect' },
  { value: 'churning', label: 'Churning' },
  { value: 'churned', label: 'Churned' },
];

const SORT_OPTIONS = [
  { value: 'lead_score', label: 'Lead Score' },
  { value: 'created_at', label: 'Date Joined' },
  { value: 'last_login_at', label: 'Last Login' },
];

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-white/[0.06] text-slate-300',
  activated: 'bg-blue-900/60 text-blue-300',
  engaged: 'bg-green-900/60 text-green-300',
  power_user: 'bg-purple-900/60 text-purple-300',
  upgrade_prospect: 'bg-amber-900/60 text-amber-300',
  churning: 'bg-orange-900/60 text-orange-300',
  churned: 'bg-red-900/60 text-red-300',
};

const STATUS_STAT_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  new: { bg: 'bg-white/[0.02]', text: 'text-slate-300', icon: 'text-slate-500' },
  activated: { bg: 'bg-white/[0.02]', text: 'text-blue-300', icon: 'text-blue-400' },
  engaged: { bg: 'bg-white/[0.02]', text: 'text-green-300', icon: 'text-green-400' },
  power_user: { bg: 'bg-white/[0.02]', text: 'text-purple-300', icon: 'text-purple-400' },
  upgrade_prospect: { bg: 'bg-white/[0.02]', text: 'text-amber-300', icon: 'text-amber-400' },
  churning: { bg: 'bg-white/[0.02]', text: 'text-orange-300', icon: 'text-orange-400' },
  churned: { bg: 'bg-white/[0.02]', text: 'text-red-300', icon: 'text-red-400' },
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  new: <UserPlus className="w-4 h-4" />,
  activated: <Zap className="w-4 h-4" />,
  engaged: <TrendingUp className="w-4 h-4" />,
  power_user: <Users className="w-4 h-4" />,
  upgrade_prospect: <TrendingUp className="w-4 h-4" />,
  churning: <AlertTriangle className="w-4 h-4" />,
  churned: <AlertTriangle className="w-4 h-4" />,
};

const STATUS_TOOLTIPS: Record<string, string> = {
  new: 'Registered but hasn\'t run an audit or verified a domain yet',
  activated: 'Has completed at least one audit - showing initial interest',
  engaged: 'Regularly running audits and actively using the platform',
  power_user: 'Heavy usage - multiple sites, team members, or frequent audits',
  upgrade_prospect: 'Hitting plan limits or using features available on higher tiers',
  churning: 'Activity has dropped significantly - at risk of leaving',
  churned: 'No activity for an extended period - considered inactive',
};

function getScoreBadgeColor(score: number): string {
  if (score >= 70) return 'bg-green-900/60 text-green-300';
  if (score >= 50) return 'bg-blue-900/60 text-blue-300';
  if (score >= 30) return 'bg-amber-900/60 text-amber-300';
  return 'bg-red-900/60 text-red-300';
}

function formatStatusLabel(status: string): string {
  return status
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function formatRelativeDate(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-6 py-4">
        <div className="flex flex-col gap-2">
          <div className="h-4 w-32 bg-white/[0.06] rounded" />
          <div className="h-3 w-48 bg-white/[0.04] rounded" />
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="h-6 w-12 bg-white/[0.06] rounded-full" />
      </td>
      <td className="px-6 py-4">
        <div className="h-6 w-20 bg-white/[0.06] rounded-full" />
      </td>
      <td className="px-6 py-4">
        <div className="h-4 w-16 bg-white/[0.06] rounded" />
      </td>
      <td className="px-6 py-4">
        <div className="h-4 w-10 bg-white/[0.06] rounded" />
      </td>
      <td className="px-6 py-4">
        <div className="h-4 w-10 bg-white/[0.06] rounded" />
      </td>
      <td className="px-6 py-4">
        <div className="h-4 w-16 bg-white/[0.06] rounded" />
      </td>
    </tr>
  );
}

export default function LeadsPage() {
  const navigate = useNavigate();

  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 25, total: 0, pages: 0 });
  const [stats, setStats] = useState<CrmStats | null>(null);

  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sort, setSort] = useState('lead_score');
  const [order, setOrder] = useState<'desc' | 'asc'>('desc');

  const [isLoading, setIsLoading] = useState(true);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    loadLeads();
  }, [pagination.page, search, statusFilter, sort, order]);

  const loadStats = async () => {
    try {
      setIsStatsLoading(true);
      const { data } = await adminApi.getCrmStats();
      setStats(data.stats);
    } catch {
      // Stats are non-critical, silently fail
    } finally {
      setIsStatsLoading(false);
    }
  };

  const loadLeads = async () => {
    try {
      setIsLoading(true);
      const { data } = await adminApi.getLeads({
        page: pagination.page,
        limit: pagination.limit,
        search: search || undefined,
        status: statusFilter || undefined,
        sort,
        order,
      });
      setLeads(data.leads);
      setPagination(data.pagination);
    } catch {
      // Error state handled by empty leads array
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([loadLeads(), loadStats()]);
    setIsRefreshing(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSortChange = (value: string) => {
    setSort(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePrevPage = () => {
    if (pagination.page > 1) {
      setPagination((prev) => ({ ...prev, page: prev.page - 1 }));
    }
  };

  const handleNextPage = () => {
    if (pagination.page < pagination.pages) {
      setPagination((prev) => ({ ...prev, page: prev.page + 1 }));
    }
  };

  return (
    <AdminLayout>
      <Helmet><title>Admin: Leads | Kritano</title></Helmet>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex items-center gap-3 mb-4 sm:mb-0">
          <div className="p-2 bg-indigo-600/20 rounded-lg">
            <Users className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight font-display">CRM Leads</h1>
            <p className="text-sm text-slate-500">
              {pagination.total > 0
                ? `${pagination.total} lead${pagination.total === 1 ? '' : 's'} tracked`
                : 'Manage your growth pipeline'}
            </p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
        {/* Total */}
        <Tooltip content="Total number of leads across all statuses">
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-3 cursor-help">
            <div className="text-xs text-slate-500 mb-1">Total</div>
            {isStatsLoading ? (
              <div className="h-6 w-12 bg-white/[0.06] rounded animate-pulse" />
            ) : (
              <div className="text-lg font-semibold text-white">{stats?.total ?? 0}</div>
            )}
          </div>
        </Tooltip>
        {/* Per status */}
        {['new', 'activated', 'engaged', 'power_user', 'upgrade_prospect', 'churning', 'churned'].map((status) => {
          const colors = STATUS_STAT_COLORS[status];
          return (
            <Tooltip key={status} content={STATUS_TOOLTIPS[status]}>
              <div className={`${colors.bg} border border-white/[0.06] rounded-lg p-3 cursor-help`}>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={colors.icon}>{STATUS_ICONS[status]}</span>
                  <span className="text-xs text-slate-500 truncate">{formatStatusLabel(status)}</span>
                </div>
                {isStatsLoading ? (
                  <div className="h-6 w-8 bg-white/[0.06] rounded animate-pulse" />
                ) : (
                  <div className={`text-lg font-semibold ${colors.text}`}>
                    {stats?.by_status?.[status] ?? 0}
                  </div>
                )}
              </div>
            </Tooltip>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex flex-1 gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-10 pr-4 py-2 bg-white/[0.02] border border-white/[0.06] rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Search
          </button>
        </form>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="px-3 py-2 bg-white/[0.02] border border-white/[0.06] rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => handleSortChange(e.target.value)}
          className="px-3 py-2 bg-white/[0.02] border border-white/[0.06] rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
        >
          {SORT_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        {/* Order toggle */}
        <button
          onClick={() => setOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
          className="px-3 py-2 bg-white/[0.02] border border-white/[0.06] rounded-lg text-slate-300 text-sm hover:bg-white/[0.06] transition-colors"
          title={order === 'desc' ? 'Descending' : 'Ascending'}
        >
          {order === 'desc' ? 'DESC' : 'ASC'}
        </button>
      </div>

      {/* Leads Table */}
      <div className="bg-white/[0.02] rounded-lg border border-white/[0.06] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-sm text-slate-500">
                <th className="px-6 py-3 font-medium">User</th>
                <th className="px-6 py-3 font-medium">Score</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Tier</th>
                <th className="px-6 py-3 font-medium">Audits</th>
                <th className="px-6 py-3 font-medium">Sites</th>
                <th className="px-6 py-3 font-medium">Last Login</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {isLoading ? (
                <>
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <Users className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                    <p className="text-sm">No leads found</p>
                    {(search || statusFilter) && (
                      <p className="text-xs text-slate-600 mt-1">Try adjusting your filters</p>
                    )}
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr
                    key={lead.id}
                    onClick={() => navigate(`/admin/crm/leads/${lead.id}`)}
                    className="hover:bg-white/[0.04] cursor-pointer transition-colors"
                  >
                    {/* User */}
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-white">
                          {lead.first_name || lead.last_name
                            ? `${lead.first_name ?? ''} ${lead.last_name ?? ''}`.trim()
                            : lead.email}
                        </div>
                        <div className="text-sm text-slate-500">{lead.email}</div>
                      </div>
                    </td>

                    {/* Score */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getScoreBadgeColor(lead.lead_score)}`}
                      >
                        {lead.lead_score}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[lead.lead_status] ?? 'bg-white/[0.06] text-slate-300'}`}
                      >
                        {formatStatusLabel(lead.lead_status)}
                      </span>
                    </td>

                    {/* Tier */}
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-300 capitalize">{lead.tier}</span>
                    </td>

                    {/* Audits */}
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-300">{lead.completed_audits}/{lead.total_audits}</span>
                    </td>

                    {/* Sites */}
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-300">{lead.total_sites}</span>
                    </td>

                    {/* Last Login */}
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-500">
                        {formatRelativeDate(lead.last_login_at)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-3">
          <div className="text-sm text-slate-500">
            Showing {(pagination.page - 1) * pagination.limit + 1}
            {' '}-{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)}
            {' '}of {pagination.total} leads
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevPage}
              disabled={pagination.page === 1}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-white/[0.02] border border-white/[0.06] rounded-lg text-sm text-slate-300 hover:bg-white/[0.06] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => {
                let pageNum: number;
                if (pagination.pages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.page <= 3) {
                  pageNum = i + 1;
                } else if (pagination.page >= pagination.pages - 2) {
                  pageNum = pagination.pages - 4 + i;
                } else {
                  pageNum = pagination.page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPagination((prev) => ({ ...prev, page: pageNum }))}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      pageNum === pagination.page
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white/[0.02] text-slate-500 hover:bg-white/[0.06] border border-white/[0.06]'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={handleNextPage}
              disabled={pagination.page === pagination.pages}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-white/[0.02] border border-white/[0.06] rounded-lg text-sm text-slate-300 hover:bg-white/[0.06] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
