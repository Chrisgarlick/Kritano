import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Gift, Users, TrendingUp, Ban, Search } from 'lucide-react';
import { AdminLayout } from '../../../components/layout/AdminLayout';
import { adminReferralsApi } from '../../../services/api';

interface AdminStats {
  totalReferrals: number;
  pendingCount: number;
  qualifiedCount: number;
  rewardedCount: number;
  voidedCount: number;
  conversionRate: number;
  totalBonusAuditsAwarded: number;
  topReferrers: Array<{ user_id: string; email: string; name: string; referral_count: number }>;
}

interface ReferralItem {
  id: string;
  referrer_email: string;
  referrer_name: string;
  referred_email: string;
  referred_name: string;
  status: string;
  referrer_reward_value: number | null;
  referred_reward_value: number | null;
  void_reason: string | null;
  created_at: string;
  qualified_at: string | null;
  rewarded_at: string | null;
  voided_at: string | null;
}

const statusColors: Record<string, string> = {
  pending: 'bg-amber-500/20 text-amber-300',
  qualified: 'bg-blue-500/20 text-blue-300',
  rewarded: 'bg-emerald-500/20 text-emerald-300',
  voided: 'bg-red-500/20 text-red-300',
};

export default function AdminReferralsDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [referrals, setReferrals] = useState<ReferralItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [voidingId, setVoidingId] = useState<string | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [selectedId, setSelectedId] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    loadReferrals();
  }, [page, statusFilter, search]);

  async function loadStats() {
    try {
      const res = await adminReferralsApi.getStats();
      setStats(res.data.stats);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  }

  async function loadReferrals() {
    setLoading(true);
    try {
      const res = await adminReferralsApi.list({ page, status: statusFilter || undefined, search: search || undefined });
      setReferrals(res.data.referrals);
      setTotalPages(res.data.pagination.pages);
    } catch (err) {
      console.error('Failed to load referrals:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleVoid() {
    if (!selectedId || !voidReason.trim()) return;
    setVoidingId(selectedId);
    try {
      await adminReferralsApi.void(selectedId, voidReason);
      setShowVoidModal(false);
      setVoidReason('');
      loadReferrals();
      loadStats();
    } catch (err) {
      console.error('Failed to void referral:', err);
    } finally {
      setVoidingId(null);
    }
  }

  return (
    <AdminLayout>
      <Helmet><title>Referrals - Admin - PagePulser</title></Helmet>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">Referral Program</h1>
        <p className="text-slate-500 mt-1">Manage referrals, view stats, and configure rewards.</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <AdminStatCard label="Total Referrals" value={stats.totalReferrals} icon={Users} />
          <AdminStatCard label="Conversion Rate" value={`${stats.conversionRate}%`} icon={TrendingUp} />
          <AdminStatCard label="Bonus Audits Awarded" value={stats.totalBonusAuditsAwarded} icon={Gift} />
          <AdminStatCard label="Voided" value={stats.voidedCount} icon={Ban} />
        </div>
      )}

      {/* Top Referrers */}
      {stats && stats.topReferrers.length > 0 && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-4 mb-6">
          <h2 className="text-sm font-semibold text-white mb-3">Top Referrers</h2>
          <div className="space-y-2">
            {stats.topReferrers.slice(0, 5).map((r, i) => (
              <div key={r.user_id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 w-5">{i + 1}.</span>
                  <span className="text-white">{r.name}</span>
                  <span className="text-slate-500">({r.email})</span>
                </div>
                <span className="text-indigo-400 font-medium">{r.referral_count} referrals</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 pr-3 py-2 bg-white/[0.02] border border-white/[0.06] rounded-md text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 bg-white/[0.02] border border-white/[0.06] rounded-md text-sm text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="qualified">Qualified</option>
          <option value="rewarded">Rewarded</option>
          <option value="voided">Voided</option>
        </select>
      </div>

      {/* Referrals Table */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500" />
          </div>
        ) : referrals.length === 0 ? (
          <div className="py-12 text-center text-slate-500">No referrals found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.01]">
                  <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Referrer</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Referred</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Rewards</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Date</th>
                  <th className="text-right text-xs font-medium text-slate-500 px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {referrals.map((ref) => (
                  <tr key={ref.id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <div className="text-sm text-white">{ref.referrer_name}</div>
                      <div className="text-xs text-slate-500">{ref.referrer_email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-white">{ref.referred_name}</div>
                      <div className="text-xs text-slate-500">{ref.referred_email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[ref.status] || statusColors.pending}`}>
                        {ref.status}
                      </span>
                      {ref.void_reason && (
                        <div className="text-xs text-red-400 mt-1">{ref.void_reason}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">
                      {ref.referrer_reward_value ? `+${ref.referrer_reward_value}` : '-'} / {ref.referred_reward_value ? `+${ref.referred_reward_value}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {new Date(ref.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {ref.status !== 'voided' && (
                        <button
                          onClick={() => { setSelectedId(ref.id); setShowVoidModal(true); }}
                          className="text-xs text-red-400 hover:text-red-300 font-medium"
                        >
                          Void
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06]">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="text-sm text-slate-500 hover:text-white disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="text-sm text-slate-500 hover:text-white disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Void Modal */}
      {showVoidModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-3">Void Referral</h3>
            <p className="text-sm text-slate-500 mb-4">
              This will reverse any rewards given. Please provide a reason.
            </p>
            <textarea
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              placeholder="Reason for voiding..."
              className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-md text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/20 mb-4"
              rows={3}
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setShowVoidModal(false); setVoidReason(''); }}
                className="px-4 py-2 text-sm text-slate-500 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleVoid}
                disabled={!voidReason.trim() || voidingId !== null}
                className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-md disabled:opacity-50"
              >
                {voidingId ? 'Voiding...' : 'Void Referral'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

function AdminStatCard({ label, value, icon: Icon }: { label: string; value: number | string; icon: React.ElementType }) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-indigo-400" />
        <span className="text-xs font-medium text-slate-500">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
