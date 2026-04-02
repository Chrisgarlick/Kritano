import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Helmet } from 'react-helmet-async';
import { adminApi } from '../../services/api';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { useToast } from '../../components/ui/Toast';
import type { AdminUser, Pagination, SubscriptionTier } from '../../types/admin.types';
import { TIER_LABELS } from '../../types/admin.types';
import { Search, Loader2, ShieldCheck, ShieldX, Trash2, ChevronLeft, ChevronRight, MailX, ChevronDown, Check } from 'lucide-react';

const TIER_OPTIONS: SubscriptionTier[] = ['free', 'starter', 'pro', 'agency', 'enterprise'];

const TIER_BADGE_STYLES: Record<SubscriptionTier, string> = {
  free: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  starter: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
  pro: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
  agency: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
  enterprise: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
};

const TIER_DROPDOWN_STYLES: Record<SubscriptionTier, string> = {
  free: 'text-slate-400',
  starter: 'text-blue-400',
  pro: 'text-indigo-400',
  agency: 'text-purple-400',
  enterprise: 'text-amber-400',
};

export default function AdminUsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 25, total: 0, pages: 0 });
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [editingTierUserId, setEditingTierUserId] = useState<string | null>(null);
  const [updatingTier, setUpdatingTier] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, [pagination.page, search]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const response = await adminApi.listUsers({
        page: pagination.page,
        limit: pagination.limit,
        search: search || undefined,
        sortBy: 'created_at',
        sortOrder: 'desc',
      });
      setUsers(response.data.users);
      setPagination(response.data.pagination);
    } catch {
      toast('Failed to load users', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    loadUsers();
  };

  const handleToggleSuperAdmin = async (user: AdminUser) => {
    if (!confirm(`${user.is_super_admin ? 'Remove' : 'Grant'} super admin access for ${user.email}?`)) return;
    try {
      await adminApi.updateUser(user.id, { is_super_admin: !user.is_super_admin });
      toast(`Super admin access ${user.is_super_admin ? 'removed' : 'granted'}`, 'success');
      loadUsers();
    } catch {
      toast('Failed to update user', 'error');
    }
  };

  const handleDeleteUser = async (user: AdminUser) => {
    if (!confirm(`Delete user ${user.email}? This cannot be undone.`)) return;
    try {
      await adminApi.deleteUser(user.id);
      toast('User deleted', 'success');
      loadUsers();
    } catch (error: any) {
      toast(error.response?.data?.error || 'Failed to delete user', 'error');
    }
  };

  const handleChangeTier = async (user: AdminUser, newTier: SubscriptionTier) => {
    try {
      setUpdatingTier(user.id);
      await adminApi.updateUser(user.id, { tier: newTier });
      toast(`Plan updated to ${TIER_LABELS[newTier]}`, 'success');
      setEditingTierUserId(null);
      loadUsers();
    } catch {
      toast('Failed to update plan', 'error');
    } finally {
      setUpdatingTier(null);
    }
  };

  return (
    <AdminLayout>
      <Helmet><title>Admin: Users | Kritano</title></Helmet>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight font-display">
              Users
            </h1>
            <p className="text-sm text-slate-500 mt-1">{pagination.total.toLocaleString()} total users</p>
          </div>
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by email or name..."
              className="pl-10 pr-4 py-2 w-72 bg-white/[0.03] border border-white/[0.08] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all duration-200"
            />
          </form>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-400/50" />
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-sm">No users found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">User</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Plan</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Orgs</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Joined</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Last Login</th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors duration-150">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-white/[0.06] flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-semibold text-indigo-300">
                            {(user.first_name?.[0] || user.email[0]).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-white truncate">
                            {user.first_name && user.last_name
                              ? `${user.first_name} ${user.last_name}`
                              : user.email}
                          </div>
                          <div className="text-xs text-slate-500 truncate">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col space-y-1">
                        {user.is_super_admin && (
                          <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium bg-red-500/10 text-red-300 border border-red-500/20 rounded-md w-fit">
                            Admin
                          </span>
                        )}
                        {user.email_verified ? (
                          <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded-md w-fit">
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded-md w-fit">
                            Unverified
                          </span>
                        )}
                        {user.unsubscribed_all && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-orange-500/10 text-orange-300 border border-orange-500/20 rounded-md w-fit">
                            <MailX className="w-2.5 h-2.5" />
                            Unsub
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <TierDropdown
                        user={user}
                        isOpen={editingTierUserId === user.id}
                        onToggle={() => setEditingTierUserId(editingTierUserId === user.id ? null : user.id)}
                        onClose={() => setEditingTierUserId(null)}
                        onChangeTier={handleChangeTier}
                        updating={updatingTier === user.id}
                      />
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-500 tabular-nums">{user.organization_count}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-500 tabular-nums">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500 tabular-nums">
                      {user.last_login_at
                        ? new Date(user.last_login_at).toLocaleDateString()
                        : <span className="text-slate-600">Never</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end space-x-1.5">
                        <button
                          onClick={() => handleToggleSuperAdmin(user)}
                          className={`p-1.5 rounded-lg transition-all duration-200 ${
                            user.is_super_admin
                              ? 'text-slate-500 hover:text-amber-300 hover:bg-amber-500/10'
                              : 'text-slate-500 hover:text-indigo-300 hover:bg-indigo-500/10'
                          }`}
                          title={user.is_super_admin ? 'Remove admin' : 'Make admin'}
                        >
                          {user.is_super_admin ? <ShieldX className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200"
                          title="Delete user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.06]">
            <p className="text-xs text-slate-500 tabular-nums">
              Page {pagination.page} of {pagination.pages}
            </p>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/[0.04] disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.pages}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/[0.04] disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

// =============================================
// Tier Dropdown (portalled to body to escape overflow)
// =============================================

function TierDropdown({
  user,
  isOpen,
  onToggle,
  onClose,
  onChangeTier,
  updating,
}: {
  user: AdminUser;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onChangeTier: (user: AdminUser, tier: SubscriptionTier) => void;
  updating: boolean;
}) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const updatePos = useCallback(() => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 6, left: rect.left });
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      updatePos();
      window.addEventListener('scroll', onClose, true);
      return () => window.removeEventListener('scroll', onClose, true);
    }
  }, [isOpen, updatePos, onClose]);

  return (
    <>
      <button
        ref={btnRef}
        onClick={onToggle}
        disabled={updating}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border rounded-lg transition-all duration-200 hover:brightness-125 ${
          TIER_BADGE_STYLES[user.tier || 'free']
        }`}
        title="Click to change plan"
      >
        {updating && <Loader2 className="w-3 h-3 animate-spin" />}
        {TIER_LABELS[user.tier || 'free']}
        <ChevronDown className="w-3 h-3 opacity-60" />
      </button>

      {isOpen && createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onClick={onClose} />
          <div
            className="fixed z-[9999] w-44 py-1.5 rounded-xl border border-white/[0.08] bg-[#0f1117] shadow-2xl shadow-black/40"
            style={{ top: pos.top, left: pos.left }}
          >
            <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              Change plan
            </div>
            {TIER_OPTIONS.map(tier => {
              const isCurrent = tier === (user.tier || 'free');
              return (
                <button
                  key={tier}
                  onClick={() => onChangeTier(user, tier)}
                  disabled={updating || isCurrent}
                  className={`w-full px-3 py-2 text-left text-sm transition-colors duration-150 flex items-center justify-between gap-2 ${
                    isCurrent
                      ? `${TIER_DROPDOWN_STYLES[tier]} bg-white/[0.04]`
                      : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
                  }`}
                >
                  <span className={isCurrent ? 'font-medium' : ''}>{TIER_LABELS[tier]}</span>
                  {isCurrent && <Check className="w-3.5 h-3.5" />}
                </button>
              );
            })}
          </div>
        </>,
        document.body
      )}
    </>
  );
}
