/**
 * Admin Bug Reports Page
 *
 * List and manage all user-submitted bug reports.
 */

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Bug,
  AlertTriangle,
  Clock,
  CheckCircle,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { adminBugReportsApi, type BugReport, type BugReportStats } from '../../services/api';
import { formatDate } from '../../utils/format';

const statusColors: Record<string, string> = {
  open: 'bg-amber-900/30 text-amber-300',
  in_progress: 'bg-indigo-900/30 text-indigo-300',
  resolved: 'bg-emerald-900/30 text-emerald-300',
  closed: 'bg-white/[0.06] text-slate-300',
};

const severityColors: Record<string, string> = {
  critical: 'text-red-400',
  major: 'text-orange-400',
  minor: 'text-amber-400',
  trivial: 'text-slate-500',
};

export default function AdminBugReports() {
  const [reports, setReports] = useState<BugReport[]>([]);
  const [stats, setStats] = useState<BugReportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    status: '',
    severity: '',
    search: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [reportsRes, statsRes] = await Promise.all([
        adminBugReportsApi.list({
          page,
          limit: 25,
          status: filters.status || undefined,
          severity: filters.severity || undefined,
          search: filters.search || undefined,
        }),
        adminBugReportsApi.getStats(),
      ]);
      setReports(reportsRes.data.items);
      setTotalPages(reportsRes.data.pages);
      setStats(statsRes.data);
    } catch (err) {
      console.error('Failed to load bug reports:', err);
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
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-300">Bug Reports</h2>
            <p className="text-slate-500 text-sm mt-1">
              Manage user-submitted bug reports
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
              <Clock className="w-5 h-5" />
              <span className="text-sm font-medium">Open</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.open}</p>
          </div>
          <div className="bg-white/[0.02] p-4 rounded-lg border border-white/[0.06]">
            <div className="flex items-center gap-2 text-indigo-400 mb-2">
              <Bug className="w-5 h-5" />
              <span className="text-sm font-medium">In Progress</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.in_progress}</p>
          </div>
          <div className={`p-4 rounded-lg border ${stats.critical_open > 0 ? 'bg-red-900/30 border-red-700' : 'bg-white/[0.02] border-white/[0.06]'}`}>
            <div className="flex items-center gap-2 text-red-400 mb-2">
              <AlertTriangle className="w-5 h-5" />
              <span className="text-sm font-medium">Critical Open</span>
            </div>
            <p className={`text-2xl font-bold ${stats.critical_open > 0 ? 'text-red-400' : 'text-white'}`}>
              {stats.critical_open}
            </p>
          </div>
          <div className="bg-white/[0.02] p-4 rounded-lg border border-white/[0.06]">
            <div className="flex items-center gap-2 text-emerald-400 mb-2">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-medium">Resolved</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.resolved}</p>
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
              placeholder="Search reports..."
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
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <select
            value={filters.severity}
            onChange={(e) => handleFilterChange('severity', e.target.value)}
            className="px-4 py-2 border border-white/[0.08]
                     rounded-lg bg-white/[0.03] text-white"
          >
            <option value="">All Severity</option>
            <option value="critical">Critical</option>
            <option value="major">Major</option>
            <option value="minor">Minor</option>
            <option value="trivial">Trivial</option>
          </select>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white/[0.02] rounded-lg border border-white/[0.06] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-slate-500 mx-auto" />
          </div>
        ) : reports.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No bug reports found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/[0.03]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Report
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Severity
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
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-white/[0.04]">
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-medium text-white">{report.title}</p>
                        <p className="text-sm text-slate-500">{report.category}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`font-medium capitalize ${severityColors[report.severity]}`}>
                        {report.severity}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[report.status]}`}>
                        {report.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-500">
                      {report.reporter_email}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-500">
                      {formatDate(report.created_at)}
                    </td>
                    <td className="px-4 py-4">
                      <Link
                        to={`/admin/bug-reports/${report.id}`}
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
