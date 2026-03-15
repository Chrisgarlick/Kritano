import { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { useToast } from '../../components/ui/Toast';
import type { AdminUser, Pagination } from '../../types/admin.types';
import { Search, Loader2, ShieldCheck, ShieldX, Trash2, ChevronLeft, ChevronRight, MailX } from 'lucide-react';

export default function AdminUsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 25, total: 0, pages: 0 });
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <AdminLayout>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight" style={{ fontFamily: "'Instrument Serif', serif" }}>
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
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">User</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Status</th>
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
