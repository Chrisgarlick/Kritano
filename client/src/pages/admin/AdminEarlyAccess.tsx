import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { adminEarlyAccessApi } from '../../services/api';
import {
  Rocket, Mail, Share2, Download, Play,
  Loader2, Search, CheckCircle, Copy, Check,
  ChevronLeft, ChevronRight,
} from 'lucide-react';

interface EarlyAccessStats {
  enabled: boolean;
  maxSpots: number;
  claimed: number;
  remaining: number;
  activated: boolean;
  channels: { email: number; social: number; total: number };
}

interface EarlyAccessUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  channel: string;
  emailVerified: boolean;
  activatedAt: string | null;
  createdAt: string;
}

export default function AdminEarlyAccessPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<EarlyAccessStats | null>(null);
  const [users, setUsers] = useState<EarlyAccessUser[]>([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [activating, setActivating] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    try {
      const res = await adminEarlyAccessApi.getStats();
      setStats(res.data);
    } catch (err) {
      console.error('Failed to load early access stats:', err);
    }
  }, []);

  const loadUsers = useCallback(async (page = 1) => {
    try {
      const res = await adminEarlyAccessApi.getUsers({ page, search: search || undefined });
      setUsers(res.data.users);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error('Failed to load early access users:', err);
    }
  }, [search]);

  useEffect(() => {
    Promise.all([loadStats(), loadUsers()]).finally(() => setLoading(false));
  }, [loadStats, loadUsers]);

  const handleActivate = async () => {
    setActivating(true);
    try {
      await adminEarlyAccessApi.activate();
      await loadStats();
      await loadUsers(pagination.page);
      setShowConfirm(false);
    } catch (err) {
      console.error('Failed to activate early access:', err);
    } finally {
      setActivating(false);
    }
  };

  const handleExport = async () => {
    try {
      const res = await adminEarlyAccessApi.exportUsers();
      const blob = new Blob([res.data as BlobPart], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'early-access-users.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export:', err);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadUsers(1);
  };

  const copyLink = async (channel: string) => {
    const url = `${window.location.origin}/register?ea=${channel}`;
    await navigator.clipboard.writeText(url);
    setCopiedLink(channel);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-400/50" />
        </div>
      </AdminLayout>
    );
  }

  const claimedPct = stats ? Math.round((stats.claimed / stats.maxSpots) * 100) : 0;

  return (
    <AdminLayout>
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight" style={{ fontFamily: "'Instrument Serif', serif" }}>
              Early Access
            </h1>
            <p className="text-sm text-slate-500 mt-1">Founding member campaign</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExport}
              className="flex items-center space-x-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-white/[0.04] border border-white/[0.06] text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] transition-all duration-200"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
            <button
              onClick={() => setShowConfirm(true)}
              disabled={!stats || stats.activated || stats.claimed === 0}
              className="flex items-center space-x-1.5 px-4 py-2 text-xs font-medium rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{stats?.activated ? 'Activated' : 'Activate All'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {/* Progress card — wider, with bar */}
          <div className="col-span-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Rocket className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-semibold text-slate-300">Spots Claimed</span>
              </div>
              <span className="text-2xl font-bold text-white tabular-nums">
                {stats.claimed}<span className="text-slate-600 text-lg">/{stats.maxSpots}</span>
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full h-2 bg-white/[0.04] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
                style={{ width: `${claimedPct}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-[11px] text-slate-500">{claimedPct}% filled</span>
              <span className="text-[11px] text-slate-500">{stats.remaining} remaining</span>
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
            <div className="flex items-center space-x-2 mb-2">
              <Mail className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[11px] text-slate-500 uppercase tracking-wider">Email</span>
            </div>
            <span className="text-2xl font-bold text-white tabular-nums">{stats.channels.email}</span>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
            <div className="flex items-center space-x-2 mb-2">
              <Share2 className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-[11px] text-slate-500 uppercase tracking-wider">Social</span>
            </div>
            <span className="text-2xl font-bold text-white tabular-nums">{stats.channels.social}</span>
          </div>
        </div>
      )}

      {/* Share Links */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 mb-6">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Share Links</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {['email', 'social'].map((channel) => (
            <div key={channel} className="flex items-center justify-between bg-white/[0.02] border border-white/[0.04] rounded-lg px-4 py-3">
              <div className="min-w-0 mr-3">
                <p className="text-xs font-medium text-slate-300 capitalize">{channel} Link</p>
                <p className="text-[11px] text-slate-600 truncate font-mono">{window.location.origin}/register?ea={channel}</p>
              </div>
              <button
                onClick={() => copyLink(channel)}
                className="flex-shrink-0 p-2 rounded-lg text-slate-500 hover:text-indigo-300 hover:bg-indigo-500/10 transition-all duration-200"
                title="Copy link"
              >
                {copiedLink === channel ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Activation status */}
      {stats?.activated && (
        <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.05] p-4 flex items-center space-x-3 mb-6">
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <p className="text-emerald-300 text-sm">
            Early access activated. All founding members have received their 30-day Agency trial.
          </p>
        </div>
      )}

      {/* Users Table */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between border-b border-white/[0.06]">
          <h2 className="text-sm font-semibold text-slate-300">
            Founding Members
            <span className="text-slate-600 ml-2 tabular-nums">({pagination.total})</span>
          </h2>
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="pl-9 pr-3 py-1.5 w-44 bg-white/[0.03] border border-white/[0.06] rounded-lg text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/40 transition-all duration-200"
            />
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-white/[0.04]">
                <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-slate-600 uppercase tracking-wider">Name</th>
                <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-slate-600 uppercase tracking-wider">Email</th>
                <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-slate-600 uppercase tracking-wider">Channel</th>
                <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-slate-600 uppercase tracking-wider">Verified</th>
                <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-slate-600 uppercase tracking-wider">Activated</th>
                <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-slate-600 uppercase tracking-wider">Registered</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-600 text-sm">
                    No early access users yet
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors duration-150">
                    <td className="px-5 py-3 text-sm text-white">
                      {user.firstName} {user.lastName}
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-400">{user.email}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium border ${
                        user.channel === 'email'
                          ? 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                          : 'bg-violet-500/10 text-violet-300 border-violet-500/20'
                      }`}>
                        {user.channel}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {user.emailVerified ? (
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <span className="text-[11px] text-slate-600">No</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500 tabular-nums">
                      {user.activatedAt
                        ? new Date(user.activatedAt).toLocaleDateString()
                        : <span className="text-slate-600">—</span>
                      }
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500 tabular-nums">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.06]">
            <p className="text-xs text-slate-500 tabular-nums">
              Page {pagination.page} of {pagination.pages}
            </p>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => loadUsers(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/[0.04] disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => loadUsers(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/[0.04] disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Activation Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowConfirm(false)} />
          <div className="relative rounded-xl border border-white/[0.08] bg-[#141620] p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-semibold text-white mb-2">Activate Early Access</h3>
            <p className="text-sm text-slate-400 mb-4">
              This will start a <strong className="text-white">30-day Agency trial</strong> for
              all <strong className="text-white">{stats?.claimed || 0} founding members</strong> and
              send them an activation email.
            </p>
            <p className="text-xs text-amber-400/80 mb-6">
              This action cannot be undone.
            </p>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={activating}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-200 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleActivate}
                disabled={activating}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 hover:bg-emerald-500/25 disabled:opacity-50 transition-all duration-200"
              >
                {activating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5" />
                )}
                <span>{activating ? 'Activating...' : 'Confirm'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
