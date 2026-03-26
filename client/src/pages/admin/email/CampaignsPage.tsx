/**
 * Email Campaigns List
 *
 * Campaign management with status filters, search, and lifecycle actions.
 */

import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../../../components/layout/AdminLayout';
import { adminApi } from '../../../services/api';
import type { EmailCampaignItem, CampaignStatus } from '../../../services/api';
import {
  Send, Plus, Search, RefreshCw, ChevronLeft, ChevronRight,
  Play, Pause, X, Eye, Pencil, Trash2, Users,
} from 'lucide-react';

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'sending', label: 'Sending' },
  { value: 'paused', label: 'Paused' },
  { value: 'sent', label: 'Sent' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'failed', label: 'Failed' },
];

const STATUS_BADGE: Record<CampaignStatus, string> = {
  draft: 'bg-slate-500/20 text-slate-300',
  scheduled: 'bg-blue-500/20 text-blue-300',
  sending: 'bg-amber-500/20 text-amber-300',
  paused: 'bg-orange-500/20 text-orange-300',
  sent: 'bg-green-500/20 text-green-300',
  cancelled: 'bg-red-500/20 text-red-300',
  failed: 'bg-red-500/20 text-red-300',
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<EmailCampaignItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      const { data: res } = await adminApi.listCampaigns(params as Parameters<typeof adminApi.listCampaigns>[0]);
      setCampaigns(res.campaigns);
      setTotalPages(res.pagination.pages);
      setTotal(res.pagination.total);
    } catch (err) {
      console.error('Failed to load campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [page, statusFilter, search]);

  const handleAction = async (id: string, action: string) => {
    setActionLoading(id);
    try {
      switch (action) {
        case 'launch':
          if (!confirm('Launch this campaign? Emails will begin sending immediately.')) return;
          await adminApi.launchCampaign(id);
          break;
        case 'pause':
          await adminApi.pauseCampaign(id);
          break;
        case 'resume':
          await adminApi.resumeCampaign(id);
          break;
        case 'cancel':
          if (!confirm('Cancel this campaign? Queued emails will be discarded.')) return;
          await adminApi.cancelCampaign(id);
          break;
        case 'delete':
          if (!confirm('Delete this draft campaign? This cannot be undone.')) return;
          await adminApi.deleteCampaign(id);
          break;
      }
      fetchCampaigns();
    } catch (err) {
      alert(`Action failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setActionLoading(null);
    }
  };

  const formatRate = (numerator: number, denominator: number) => {
    if (denominator === 0) return '—';
    return `${((numerator / denominator) * 100).toFixed(1)}%`;
  };

  // Stats summary
  const statCounts = campaigns.reduce(
    (acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <AdminLayout>
      <Helmet><title>Admin: Email Campaigns | PagePulser</title></Helmet>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight" style={{ fontFamily: "'Instrument Serif', serif" }}>Email Campaigns</h1>
            <p className="text-sm text-slate-500 mt-1">
              {total} campaign{total !== 1 ? 's' : ''} — send targeted emails to segmented audiences
            </p>
          </div>
          <Link
            to="/admin/email/campaigns/new"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Campaign
          </Link>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total', value: total, color: 'text-white' },
            { label: 'Sending', value: statCounts['sending'] || 0, color: 'text-amber-400' },
            { label: 'Scheduled', value: statCounts['scheduled'] || 0, color: 'text-blue-400' },
            { label: 'Completed', value: statCounts['sent'] || 0, color: 'text-green-400' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-4">
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search campaigns..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 bg-white/[0.02] border border-white/[0.06] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-white/[0.02] border border-white/[0.06] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            {STATUS_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <button
            onClick={fetchCampaigns}
            className="p-2 text-slate-500 hover:text-white transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Campaign Table */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-white/[0.02] rounded-lg animate-pulse" />
            ))}
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-16">
            <Send className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-1">No campaigns found</h3>
            <p className="text-sm text-slate-500">
              {search || statusFilter ? 'Try adjusting your filters.' : 'Create your first campaign to get started.'}
            </p>
          </div>
        ) : (
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Campaign</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Template</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Status</th>
                  <th className="text-right text-xs font-medium text-slate-500 px-4 py-3">Audience</th>
                  <th className="text-right text-xs font-medium text-slate-500 px-4 py-3">Open Rate</th>
                  <th className="text-right text-xs font-medium text-slate-500 px-4 py-3">Click Rate</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Date</th>
                  <th className="text-right text-xs font-medium text-slate-500 px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} className="border-b border-white/[0.04] hover:bg-white/[0.03]">
                    <td className="px-4 py-3">
                      <Link
                        to={`/admin/email/campaigns/${campaign.id}`}
                        className="text-sm font-medium text-white hover:text-indigo-300 transition-colors"
                      >
                        {campaign.name}
                      </Link>
                      {campaign.description && (
                        <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[200px]">
                          {campaign.description}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-slate-300">{campaign.template_name || '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[campaign.status]}`}>
                        {campaign.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm text-slate-300 flex items-center justify-end gap-1">
                        <Users className="w-3 h-3" />
                        {campaign.audience_count.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm text-slate-300">
                        {formatRate(campaign.stats.opened, campaign.stats.delivered || campaign.stats.sent)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm text-slate-300">
                        {formatRate(campaign.stats.clicked, campaign.stats.delivered || campaign.stats.sent)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-500">
                        {campaign.scheduled_at
                          ? new Date(campaign.scheduled_at).toLocaleDateString()
                          : new Date(campaign.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {campaign.status === 'draft' && (
                          <>
                            <Link
                              to={`/admin/email/campaigns/${campaign.id}`}
                              className="p-1.5 text-slate-500 hover:text-white transition-colors"
                              title="Edit"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Link>
                            <button
                              onClick={() => handleAction(campaign.id, 'launch')}
                              disabled={actionLoading === campaign.id}
                              className="p-1.5 text-slate-500 hover:text-green-400 transition-colors"
                              title="Launch"
                            >
                              <Play className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleAction(campaign.id, 'delete')}
                              disabled={actionLoading === campaign.id}
                              className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        {campaign.status === 'sending' && (
                          <>
                            <button
                              onClick={() => handleAction(campaign.id, 'pause')}
                              disabled={actionLoading === campaign.id}
                              className="p-1.5 text-slate-500 hover:text-orange-400 transition-colors"
                              title="Pause"
                            >
                              <Pause className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleAction(campaign.id, 'cancel')}
                              disabled={actionLoading === campaign.id}
                              className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        {campaign.status === 'paused' && (
                          <>
                            <button
                              onClick={() => handleAction(campaign.id, 'resume')}
                              disabled={actionLoading === campaign.id}
                              className="p-1.5 text-slate-500 hover:text-green-400 transition-colors"
                              title="Resume"
                            >
                              <Play className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleAction(campaign.id, 'cancel')}
                              disabled={actionLoading === campaign.id}
                              className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        {campaign.status === 'scheduled' && (
                          <button
                            onClick={() => handleAction(campaign.id, 'cancel')}
                            disabled={actionLoading === campaign.id}
                            className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {(campaign.status === 'sent' || campaign.status === 'cancelled' || campaign.status === 'failed') && (
                          <Link
                            to={`/admin/email/campaigns/${campaign.id}`}
                            className="p-1.5 text-slate-500 hover:text-white transition-colors"
                            title="View"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 text-slate-500 hover:text-white disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-slate-500">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 text-slate-500 hover:text-white disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
