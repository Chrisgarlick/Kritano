import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { SkeletonTable } from '../../components/ui/Skeleton';
import { useToast } from '../../components/ui/Toast';
import { auditsApi } from '../../services/api';
import { formatDate } from '../../utils/format';
import { statusColors, statusLabels, statusIcons, getScoreColor } from '../../utils/constants';
import type { Audit } from '../../types/audit.types';
import { FileSearch } from 'lucide-react';

type SortField = 'created_at' | 'seo_score' | 'accessibility_score' | 'security_score' | 'performance_score' | 'total_issues';
type SortDir = 'asc' | 'desc';

function ScoreBadge({ score, label }: { score: number | null; label: string }) {
  if (score === null) return null;

  return (
    <div className="text-center" role="group" aria-label={`${label} score`}>
      <div className={`text-lg font-semibold ${getScoreColor(score)}`} aria-label={`${score} out of 100`}>
        {score}
      </div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}

export default function AuditListPage() {
  const { toast } = useToast();
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const pageSize = 20;

  const fetchAudits = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: { status?: string; limit?: number; offset?: number } = {
        limit: pageSize,
        offset: (page - 1) * pageSize,
      };
      if (statusFilter) params.status = statusFilter;
      const response = await auditsApi.list(params);
      setAudits(response.data.audits);
      setTotalCount(response.data.pagination.total);
    } catch (err) {
      setError('Failed to load audits. Please try again.');
      console.error('Failed to fetch audits:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    fetchAudits();
  }, [fetchAudits]);

  // Reset page when filter changes
  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  // Client-side search + sort
  const filtered = audits
    .filter(a => !searchQuery || a.target_url.toLowerCase().includes(searchQuery.toLowerCase()) || a.target_domain.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      const av = a[sortField];
      const bv = b[sortField];
      if (av === null && bv === null) return 0;
      if (av === null) return 1;
      if (bv === null) return -1;
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  // A2: Sort icons with aria-label for screen readers
  const SortIcon = ({ field }: { field: SortField }) => {
    const isActive = sortField === field;
    const direction = isActive ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none';
    const icon = isActive ? (sortDir === 'asc' ? '\u25B2' : '\u25BC') : '\u25B4';

    return (
      <span
        className="ml-1 text-slate-500"
        aria-label={`Sort ${direction}`}
        aria-hidden={!isActive}
      >
        {icon}
      </span>
    );
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(a => a.id)));
    }
  };

  // E1: Improved bulk delete with detailed error reporting
  const handleBulkDelete = async () => {
    const deletable = filtered.filter(a => selectedIds.has(a.id) && ['completed', 'failed', 'cancelled'].includes(a.status));
    if (deletable.length === 0) {
      toast('No deletable audits selected (only completed/failed/cancelled can be deleted)', 'warning');
      return;
    }
    if (!confirm(`Delete ${deletable.length} audit(s)? This action cannot be undone and will remove all associated data.`)) return;

    setBulkDeleting(true);
    let deleted = 0;
    const failures: string[] = [];

    for (const a of deletable) {
      try {
        await auditsApi.delete(a.id);
        deleted++;
      } catch (err) {
        failures.push(a.target_domain);
      }
    }

    // Report results with details
    if (failures.length === 0) {
      toast(`Successfully deleted ${deleted} audit(s)`, 'success');
    } else if (deleted > 0) {
      toast(`Deleted ${deleted} audit(s). Failed to delete: ${failures.join(', ')}`, 'warning');
    } else {
      toast(`Failed to delete audits: ${failures.join(', ')}`, 'error');
    }

    setSelectedIds(new Set());
    setBulkDeleting(false);
    fetchAudits();
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  // A6: Handle keyboard events for sortable headers
  const handleSortKeyDown = (e: React.KeyboardEvent, field: SortField) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleSort(field);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
            <FileSearch className="w-6 h-6 text-indigo-600" />
            Audits
          </h1>
          <p className="text-slate-600 mt-1">View and manage your website audits</p>
        </div>
        <Link to="/audits/new">
          <Button>New Audit</Button>
        </Link>
      </div>

      {/* Filters Row */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        {/* A3: Proper label association */}
        <div className="flex items-center gap-2">
          <label htmlFor="status-filter" className="text-sm font-medium text-slate-700">
            Status:
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            aria-label="Filter audits by status"
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="flex-1 min-w-[200px] max-w-sm">
          <label htmlFor="search-audits" className="sr-only">Search audits by URL</label>
          <input
            id="search-audits"
            type="text"
            placeholder="Search by URL..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            aria-label="Search audits by URL"
          />
        </div>

        {selectedIds.size > 0 && (
          <Button variant="danger" size="sm" onClick={handleBulkDelete} isLoading={bulkDeleting}>
            Delete Selected ({selectedIds.size})
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="error" className="mb-6" role="alert">
          {error}
        </Alert>
      )}

      {loading ? (
        <SkeletonTable rows={5} />
      ) : filtered.length === 0 && !searchQuery && !statusFilter ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <div className="text-slate-300 mb-4">
            <svg className="w-20 h-20 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-slate-900 mb-2">No audits yet</h3>
          <p className="text-slate-500 mb-6 max-w-sm mx-auto">
            Start your first website audit to discover SEO, accessibility, security, and performance issues.
          </p>
          <Link to="/audits/new">
            <Button>Run Your First Audit</Button>
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center text-slate-500" role="status">
          No audits match your filters.
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200" role="grid" aria-label="Audits list">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 w-8" scope="col">
                    {/* A1: ARIA label for select all checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedIds.size === filtered.length && filtered.length > 0}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                      aria-label={selectedIds.size === filtered.length ? "Deselect all audits" : "Select all audits"}
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider" scope="col">
                    Website
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider" scope="col">
                    Status
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider hidden sm:table-cell" scope="col">
                    Pages
                  </th>
                  {/* A6: Keyboard accessible sort button */}
                  <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider" scope="col">
                    <button
                      type="button"
                      onClick={() => toggleSort('total_issues')}
                      onKeyDown={(e) => handleSortKeyDown(e, 'total_issues')}
                      className="inline-flex items-center hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 rounded"
                      aria-label={`Sort by issues, currently ${sortField === 'total_issues' ? sortDir : 'not sorted'}`}
                    >
                      Issues<SortIcon field="total_issues" />
                    </button>
                  </th>
                  {/* R2: Hide scores on small screens, show on md+ */}
                  <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider hidden md:table-cell" scope="col">
                    Scores
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider hidden lg:table-cell" scope="col">
                    <button
                      type="button"
                      onClick={() => toggleSort('created_at')}
                      onKeyDown={(e) => handleSortKeyDown(e, 'created_at')}
                      className="inline-flex items-center hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 rounded"
                      aria-label={`Sort by date, currently ${sortField === 'created_at' ? sortDir : 'not sorted'}`}
                    >
                      Started<SortIcon field="created_at" />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider" scope="col">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filtered.map((audit) => (
                  <tr key={audit.id} className={`hover:bg-slate-50 ${selectedIds.has(audit.id) ? 'bg-indigo-50' : ''}`}>
                    <td className="px-4 py-4">
                      {/* A1: ARIA label for row checkbox */}
                      <input
                        type="checkbox"
                        checked={selectedIds.has(audit.id)}
                        onChange={() => toggleSelect(audit.id)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                        aria-label={`Select audit for ${audit.target_domain}`}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-900">{audit.target_domain}</div>
                      {/* R1: Responsive URL truncation */}
                      <div className="text-sm text-slate-500 truncate max-w-[150px] sm:max-w-[200px] md:max-w-xs">{audit.target_url}</div>
                    </td>
                    <td className="px-6 py-4">
                      {/* A4: Status badge with icon for non-color indication */}
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${statusColors[audit.status]}`}
                        role="status"
                        aria-label={`Status: ${statusLabels[audit.status]}`}
                      >
                        <span aria-hidden="true">{statusIcons[audit.status]}</span>
                        {statusLabels[audit.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center hidden sm:table-cell">
                      <div className="text-sm text-slate-900">{audit.pages_crawled} / {audit.pages_found}</div>
                      <div className="text-xs text-slate-500">crawled</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-sm text-slate-900">{audit.total_issues}</div>
                      {audit.critical_issues > 0 && (
                        <div className="text-xs text-red-600" aria-label={`${audit.critical_issues} critical issues`}>
                          {audit.critical_issues} critical
                        </div>
                      )}
                    </td>
                    {/* R2: Responsive scores - hidden on mobile, stacked on tablet, inline on desktop */}
                    <td className="px-6 py-4 hidden md:table-cell">
                      <div className="flex flex-wrap justify-center gap-2 lg:gap-4">
                        <ScoreBadge score={audit.seo_score} label="SEO" />
                        <ScoreBadge score={audit.accessibility_score} label="A11y" />
                        <ScoreBadge score={audit.security_score} label="Sec" />
                        <ScoreBadge score={audit.performance_score} label="Perf" />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 hidden lg:table-cell">
                      <time dateTime={audit.started_at || audit.created_at || undefined}>
                        {formatDate(audit.started_at || audit.created_at)}
                      </time>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/audits/${audit.id}`}
                        className="text-indigo-600 hover:text-indigo-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 rounded"
                        aria-label={`View details for ${audit.target_domain}`}
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav className="flex items-center justify-between mt-4" aria-label="Pagination">
              <div className="text-sm text-slate-500">
                Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, totalCount)} of {totalCount}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 text-sm border border-slate-300 rounded-lg disabled:opacity-50 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  aria-label="Go to previous page"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const p = page <= 3 ? i + 1 : page + i - 2;
                  if (p < 1 || p > totalPages) return null;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`px-3 py-1 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        p === page ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-300 hover:bg-slate-50'
                      }`}
                      aria-label={`Go to page ${p}`}
                      aria-current={p === page ? 'page' : undefined}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 text-sm border border-slate-300 rounded-lg disabled:opacity-50 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  aria-label="Go to next page"
                >
                  Next
                </button>
              </div>
            </nav>
          )}
        </>
      )}
    </DashboardLayout>
  );
}
