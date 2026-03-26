/**
 * Admin Feature Requests Page
 *
 * List and manage all user-submitted feature requests.
 */

import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  Lightbulb,
  Eye,
  CalendarCheck,
  Clock,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { adminFeatureRequestsApi, type FeatureRequest, type FeatureRequestStats } from '../../services/api';
import { formatDate } from '../../utils/format';

const statusColors: Record<string, string> = {
  submitted: 'bg-amber-900/30 text-amber-300',
  under_review: 'bg-indigo-900/30 text-indigo-300',
  planned: 'bg-purple-900/30 text-purple-300',
  in_progress: 'bg-blue-900/30 text-blue-300',
  completed: 'bg-emerald-900/30 text-emerald-300',
  declined: 'bg-white/[0.06] text-slate-300',
};

const impactColors: Record<string, string> = {
  critical_for_workflow: 'text-red-400',
  important: 'text-orange-400',
  would_be_helpful: 'text-amber-400',
  nice_to_have: 'text-slate-500',
};

const impactLabels: Record<string, string> = {
  critical_for_workflow: 'Critical',
  important: 'Important',
  would_be_helpful: 'Helpful',
  nice_to_have: 'Nice to Have',
};

export default function AdminFeatureRequests() {
  const [requests, setRequests] = useState<FeatureRequest[]>([]);
  const [stats, setStats] = useState<FeatureRequestStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    status: '',
    impact: '',
    search: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [requestsRes, statsRes] = await Promise.all([
        adminFeatureRequestsApi.list({
          page,
          limit: 25,
          status: filters.status || undefined,
          impact: filters.impact || undefined,
          search: filters.search || undefined,
        }),
        adminFeatureRequestsApi.getStats(),
      ]);
      setRequests(requestsRes.data.items);
      setTotalPages(requestsRes.data.pages);
      setStats(statsRes.data);
    } catch (err) {
      console.error('Failed to load feature requests:', err);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  return (
    <AdminLayout>
      <Helmet><title>Admin: Feature Requests | PagePulser</title></Helmet>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-300">Feature Requests</h2>
            <p className="text-slate-500 text-sm mt-1">
              Manage user-submitted feature requests
            </p>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-white/[0.06] hover:bg-white/[0.06] text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/[0.02] p-4 rounded-lg border border-white/[0.06]">
            <div className="flex items-center gap-2 text-amber-400 mb-2">
              <Lightbulb className="w-5 h-5" />
              <span className="text-sm font-medium">Submitted</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.submitted}</p>
          </div>
          <div className="bg-white/[0.02] p-4 rounded-lg border border-white/[0.06]">
            <div className="flex items-center gap-2 text-indigo-400 mb-2">
              <Eye className="w-5 h-5" />
              <span className="text-sm font-medium">Under Review</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.under_review}</p>
          </div>
          <div className="bg-white/[0.02] p-4 rounded-lg border border-white/[0.06]">
            <div className="flex items-center gap-2 text-purple-400 mb-2">
              <CalendarCheck className="w-5 h-5" />
              <span className="text-sm font-medium">Planned</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.planned}</p>
          </div>
          <div className="bg-white/[0.02] p-4 rounded-lg border border-white/[0.06]">
            <div className="flex items-center gap-2 text-blue-400 mb-2">
              <Clock className="w-5 h-5" />
              <span className="text-sm font-medium">In Progress</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.in_progress}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white/[0.02] p-4 rounded-lg border border-white/[0.06] mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search requests..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-white/[0.08]
                       rounded-lg bg-white/[0.03] text-white placeholder-slate-500
                       focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="px-4 py-2 border border-white/[0.08]
                     rounded-lg bg-white/[0.03] text-white"
          >
            <option value="">All Status</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="planned">Planned</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="declined">Declined</option>
          </select>
          <select
            value={filters.impact}
            onChange={(e) => handleFilterChange('impact', e.target.value)}
            className="px-4 py-2 border border-white/[0.08]
                     rounded-lg bg-white/[0.03] text-white"
          >
            <option value="">All Impact</option>
            <option value="critical_for_workflow">Critical</option>
            <option value="important">Important</option>
            <option value="would_be_helpful">Helpful</option>
            <option value="nice_to_have">Nice to Have</option>
          </select>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white/[0.02] rounded-lg border border-white/[0.06] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-slate-500 mx-auto" />
          </div>
        ) : requests.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No feature requests found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/[0.03]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Request
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Impact
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Reporter
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {requests.map((request) => (
                  <tr key={request.id} className="hover:bg-white/[0.04]">
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-medium text-white">{request.title}</p>
                        <p className="text-sm text-slate-500">{request.category.replace('_', '/')}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`font-medium ${impactColors[request.impact]}`}>
                        {impactLabels[request.impact]}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[request.status]}`}>
                        {request.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-500">
                      {request.reporter_email}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-500">
                      {formatDate(request.created_at)}
                    </td>
                    <td className="px-4 py-4">
                      <Link
                        to={`/admin/feature-requests/${request.id}`}
                        className="px-3 py-1.5 text-sm bg-white/[0.06] hover:bg-white/[0.06] text-white rounded-lg transition-colors"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-white/[0.06] flex items-center justify-between">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="flex items-center px-3 py-1.5 text-sm bg-white/[0.06] hover:bg-white/[0.06] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </button>
            <span className="text-sm text-slate-500">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="flex items-center px-3 py-1.5 text-sm bg-white/[0.06] hover:bg-white/[0.06] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
