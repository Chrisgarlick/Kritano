import { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import type { AdminOrganization, Pagination, SubscriptionTier, SubscriptionStatus } from '../../types/admin.types';
import { TIER_LABELS } from '../../types/admin.types';

export default function AdminOrganizationsPage() {
  const { toast } = useToast();
  const [organizations, setOrganizations] = useState<AdminOrganization[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 25, total: 0, pages: 0 });
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [editingOrg, setEditingOrg] = useState<AdminOrganization | null>(null);
  const [newTier, setNewTier] = useState<SubscriptionTier>('free');
  const [newStatus, setNewStatus] = useState<SubscriptionStatus>('active');

  useEffect(() => {
    loadOrganizations();
  }, [pagination.page, search, tierFilter]);

  const loadOrganizations = async () => {
    try {
      setIsLoading(true);
      const response = await adminApi.listOrganizations({
        page: pagination.page,
        limit: pagination.limit,
        search: search || undefined,
        tier: tierFilter || undefined,
        sortBy: 'created_at',
        sortOrder: 'desc',
      });
      setOrganizations(response.data.organizations);
      setPagination(response.data.pagination);
    } catch (error) {
      toast('Failed to load organizations', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    loadOrganizations();
  };

  const handleEditSubscription = (org: AdminOrganization) => {
    setEditingOrg(org);
    setNewTier(org.tier);
    setNewStatus(org.status);
  };

  const handleSaveSubscription = async () => {
    if (!editingOrg) return;

    try {
      await adminApi.updateSubscription(editingOrg.id, {
        tier: newTier,
        status: newStatus,
      });
      toast('Subscription updated', 'success');
      setEditingOrg(null);
      loadOrganizations();
    } catch (error) {
      toast('Failed to update subscription', 'error');
    }
  };

  const getTierBadgeClass = (tier: SubscriptionTier) => {
    const colorMap: Record<SubscriptionTier, string> = {
      free: 'bg-white/[0.06] text-slate-300',
      starter: 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20',
      pro: 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20',
      agency: 'bg-purple-500/10 text-purple-300 border border-purple-500/20',
      enterprise: 'bg-amber-500/10 text-amber-300 border border-amber-500/20',
    };
    return colorMap[tier];
  };

  const getStatusBadgeClass = (status: SubscriptionStatus) => {
    const colorMap: Record<SubscriptionStatus, string> = {
      active: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20',
      past_due: 'bg-amber-500/10 text-amber-300 border border-amber-500/20',
      canceled: 'bg-red-500/10 text-red-300 border border-red-500/20',
      trialing: 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20',
      paused: 'bg-white/[0.06] text-slate-300',
    };
    return colorMap[status];
  };

  return (
    <AdminLayout>
      {/* Page Title & Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h1 className="text-3xl font-bold text-white tracking-tight mb-4 sm:mb-0" style={{ fontFamily: "'Instrument Serif', serif" }}>
            Organizations ({pagination.total})
          </h1>
          <div className="flex space-x-2">
            <select
              value={tierFilter}
              onChange={(e) => {
                setTierFilter(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="px-3 py-2 bg-white/[0.02] border border-white/[0.06] rounded-lg text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Tiers</option>
              <option value="free">Free</option>
              <option value="starter">Starter</option>
              <option value="pro">Pro</option>
              <option value="agency">Agency</option>
              <option value="enterprise">Enterprise</option>
            </select>
            <form onSubmit={handleSearch} className="flex space-x-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="px-4 py-2 bg-white/[0.02] border border-white/[0.06] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <Button type="submit" size="sm">Search</Button>
            </form>
          </div>
        </div>

        {/* Organizations Table */}
        <div className="bg-white/[0.02] rounded-lg border border-white/[0.06] overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto" />
            </div>
          ) : organizations.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No organizations found</div>
          ) : (
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-white/[0.06] text-left text-sm text-slate-400">
                  <th className="px-6 py-3 font-medium">Organization</th>
                  <th className="px-6 py-3 font-medium">Owner</th>
                  <th className="px-6 py-3 font-medium">Subscription</th>
                  <th className="px-6 py-3 font-medium">Members</th>
                  <th className="px-6 py-3 font-medium">Audits</th>
                  <th className="px-6 py-3 font-medium">Created</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {organizations.map(org => (
                  <tr key={org.id} className="hover:bg-white/[0.04]">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-white">{org.name}</div>
                        <div className="text-sm text-slate-400">{org.slug}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-300">{org.owner_name}</div>
                      <div className="text-xs text-slate-500">{org.owner_email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col space-y-1">
                        <span className={`inline-flex px-2 py-0.5 text-xs rounded-full w-fit ${getTierBadgeClass(org.tier)}`}>
                          {TIER_LABELS[org.tier]}
                        </span>
                        <span className={`inline-flex px-2 py-0.5 text-xs rounded-full w-fit ${getStatusBadgeClass(org.status)}`}>
                          {org.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-300">{org.member_count}</td>
                    <td className="px-6 py-4 text-slate-300">{org.audit_count}</td>
                    <td className="px-6 py-4 text-slate-400 text-sm">
                      {new Date(org.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end">
                        <button
                          onClick={() => handleEditSubscription(org)}
                          className="text-xs px-2 py-1 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 hover:bg-indigo-800"
                        >
                          Edit Plan
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-slate-400">
              Page {pagination.page} of {pagination.pages}
            </div>
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.pages}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Edit Subscription Modal */}
        {editingOrg && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white/[0.02] rounded-lg shadow-xl w-full max-w-md p-6 border border-white/[0.06]">
              <h3 className="text-lg font-semibold text-white mb-4">
                Edit Subscription: {editingOrg.name}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Subscription Tier
                  </label>
                  <select
                    value={newTier}
                    onChange={(e) => setNewTier(e.target.value as SubscriptionTier)}
                    className="w-full px-3 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="free">Free</option>
                    <option value="starter">Starter ($19/mo)</option>
                    <option value="pro">Pro ($49/mo)</option>
                    <option value="agency">Agency ($99/mo)</option>
                    <option value="enterprise">Enterprise ($199/mo)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Subscription Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as SubscriptionStatus)}
                    className="w-full px-3 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="active">Active</option>
                    <option value="trialing">Trialing</option>
                    <option value="past_due">Past Due</option>
                    <option value="paused">Paused</option>
                    <option value="canceled">Canceled</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setEditingOrg(null)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveSubscription}>
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        )}
    </AdminLayout>
  );
}
