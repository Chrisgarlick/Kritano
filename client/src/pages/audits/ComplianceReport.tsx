import { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  FileDown,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Filter,
  Lock,
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { SkeletonCard, Skeleton } from '../../components/ui/Skeleton';
import { useToast } from '../../components/ui/Toast';
import { Display, Heading, Body, Mono } from '../../components/ui/Typography';
import { ComplianceBadgeInline } from '../../components/audit/ComplianceBadge';
import { useAuth } from '../../contexts/AuthContext';
import { auditsApi } from '../../services/api';
import { formatDate } from '../../utils/format';

// ─── Types ───────────────────────────────────────────────────────────

type ComplianceStatus = 'compliant' | 'partially_compliant' | 'non_compliant' | 'not_assessed';
type ClauseStatus = 'pass' | 'fail' | 'manual_review' | 'not_tested';
type FilterType = 'all' | 'failing' | 'manual_review';
type SortField = 'clause' | 'status' | 'issues';
type SortDir = 'asc' | 'desc';

interface ClauseResult {
  clause: string;
  title: string;
  wcagCriteria: string;
  status: ClauseStatus;
  issueCount: number;
  findings: Array<{
    ruleId: string;
    severity: string;
    count: number;
  }>;
}

interface ComplianceData {
  status: ComplianceStatus;
  standard: string;
  summary: {
    totalClauses: number;
    passing: number;
    failing: number;
    manualReview: number;
    notTested: number;
  };
  clauses: ClauseResult[];
  auditDate: string;
  domain: string;
  pagesAudited: number;
  tierLocked?: boolean;
  requiredTier?: string;
}

// ─── Status helpers ─────────────────────────────────────────────────

function clauseStatusIcon(status: ClauseStatus) {
  switch (status) {
    case 'pass':
      return <CheckCircle className="w-4 h-4 text-emerald-500" />;
    case 'fail':
      return <XCircle className="w-4 h-4 text-red-500" />;
    case 'manual_review':
      return <AlertTriangle className="w-4 h-4 text-amber-500" />;
    case 'not_tested':
      return <HelpCircle className="w-4 h-4 text-slate-400" />;
  }
}

function clauseStatusLabel(status: ClauseStatus) {
  switch (status) {
    case 'pass':
      return 'Pass';
    case 'fail':
      return 'Fail';
    case 'manual_review':
      return 'Manual Review';
    case 'not_tested':
      return 'Not Tested';
  }
}

function clauseStatusColour(status: ClauseStatus) {
  switch (status) {
    case 'pass':
      return 'text-emerald-700 dark:text-emerald-400';
    case 'fail':
      return 'text-red-700 dark:text-red-400';
    case 'manual_review':
      return 'text-amber-700 dark:text-amber-400';
    case 'not_tested':
      return 'text-slate-500 dark:text-slate-400';
  }
}

function severityColour(severity: string) {
  switch (severity) {
    case 'critical':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    case 'serious':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
    case 'moderate':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
    case 'minor':
      return 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300';
    default:
      return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
  }
}

const statusSortOrder: Record<ClauseStatus, number> = {
  fail: 0,
  manual_review: 1,
  not_tested: 2,
  pass: 3,
};

// ─── Component ──────────────────────────────────────────────────────

export default function ComplianceReportPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  // Auth context available if needed for future tier checks
  useAuth();

  const [data, setData] = useState<ComplianceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Table state
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortField, setSortField] = useState<SortField>('status');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [expandedClauses, setExpandedClauses] = useState<Set<string>>(new Set());

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await auditsApi.getCompliance(id);
      setData(response.data);
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Failed to load compliance report';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter + sort clauses
  const filteredClauses = useMemo(() => {
    if (!data?.clauses) return [];
    let clauses = [...data.clauses];

    // Filter
    if (filter === 'failing') {
      clauses = clauses.filter(c => c.status === 'fail');
    } else if (filter === 'manual_review') {
      clauses = clauses.filter(c => c.status === 'manual_review');
    }

    // Sort
    clauses.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'clause':
          cmp = a.clause.localeCompare(b.clause, undefined, { numeric: true });
          break;
        case 'status':
          cmp = statusSortOrder[a.status] - statusSortOrder[b.status];
          break;
        case 'issues':
          cmp = a.issueCount - b.issueCount;
          break;
      }
      return sortDir === 'desc' ? -cmp : cmp;
    });

    return clauses;
  }, [data?.clauses, filter, sortField, sortDir]);

  // Toggle expand
  const toggleExpand = (clause: string) => {
    setExpandedClauses(prev => {
      const next = new Set(prev);
      if (next.has(clause)) next.delete(clause);
      else next.add(clause);
      return next;
    });
  };

  // Sort handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  // Export JSON
  const handleExportJson = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eaa-compliance-${data.domain}-${new Date(data.auditDate).toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('JSON exported', 'success');
  };

  // Export PDF (re-use audit PDF with compliance focus)
  const handleExportPdf = async () => {
    if (!id) return;
    try {
      const res = await auditsApi.exportPdf(id);
      const blob = new Blob([res.data as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `eaa-compliance-${data?.domain || 'report'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast('PDF exported', 'success');
    } catch {
      toast('PDF export failed', 'error');
    }
  };

  // Progress percentage
  const progressPercent = data
    ? Math.round(((data.summary.passing) / Math.max(data.summary.totalClauses, 1)) * 100)
    : 0;

  // ─── Render ─────────────────────────────────────────────────────────

  return (
    <DashboardLayout>
      <Helmet>
        <title>EAA Compliance Report | PagePulser</title>
      </Helmet>

      <div className="max-w-5xl mx-auto space-y-6">
        {/* ─── Header ─────────────────────────────────────────── */}
        <div>
          <Link
            to={`/audits/${id}`}
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to audit
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <Display size="md" as="h1" className="text-slate-900 dark:text-white">
                EAA Compliance Report
              </Display>
              {data && (
                <Body className="text-slate-500 dark:text-slate-400 mt-1">
                  {data.domain} &middot; {formatDate(data.auditDate)} &middot; {data.pagesAudited} pages audited
                </Body>
              )}
            </div>

            {data && (
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<FileDown className="w-4 h-4" />}
                  onClick={handleExportPdf}
                >
                  Export PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Download className="w-4 h-4" />}
                  onClick={handleExportJson}
                >
                  Export JSON
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* ─── Loading State ──────────────────────────────────── */}
        {loading && (
          <div className="space-y-4">
            <SkeletonCard />
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </div>
        )}

        {/* ─── Error State ────────────────────────────────────── */}
        {error && !loading && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
            <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <Heading size="sm" as="h3" className="text-red-800 dark:text-red-300 mb-1">
              Failed to load report
            </Heading>
            <Body className="text-red-600 dark:text-red-400 text-sm">{error}</Body>
            <Button variant="outline" size="sm" className="mt-3" onClick={fetchData}>
              Try again
            </Button>
          </div>
        )}

        {/* ─── Not Assessed State ─────────────────────────────── */}
        {data && data.status === 'not_assessed' && !loading && (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-8 text-center">
            <HelpCircle className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <Heading size="md" as="h2" className="text-slate-900 dark:text-white mb-2">
              No accessibility data available
            </Heading>
            <Body className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-4">
              This audit did not include accessibility checks. Run a new audit with accessibility
              enabled to generate your EAA compliance report.
            </Body>
            <Button variant="primary" onClick={() => navigate('/audits/new')}>
              Run New Audit
            </Button>
          </div>
        )}

        {/* ─── Data Loaded ────────────────────────────────────── */}
        {data && data.status !== 'not_assessed' && !loading && (
          <>
            {/* ─── Executive Summary ───────────────────────────── */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-5">
                <div className="flex-1">
                  <Heading size="sm" as="h2" className="text-slate-900 dark:text-white mb-1">
                    Executive Summary
                  </Heading>
                  <Body className="text-sm text-slate-500 dark:text-slate-400">
                    {data.standard}
                  </Body>
                </div>
                <ComplianceBadgeInline status={data.status} />
              </div>

              {/* Count cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 text-center">
                  <p className="text-2xl font-semibold text-emerald-700 dark:text-emerald-300">
                    {data.summary.passing}
                  </p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    Passing
                  </p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center">
                  <p className="text-2xl font-semibold text-red-900 dark:text-red-300">
                    {data.summary.failing}
                  </p>
                  <p className="text-xs text-red-700 dark:text-red-400 font-medium">
                    Failing
                  </p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 text-center">
                  <p className="text-2xl font-semibold text-amber-700 dark:text-amber-300">
                    {data.summary.manualReview}
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                    Manual Review
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-semibold text-slate-700 dark:text-slate-300">
                    {data.summary.notTested}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Not Tested
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Body className="text-xs text-slate-500 dark:text-slate-400">
                    Automated pass rate
                  </Body>
                  <Body className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {progressPercent}%
                  </Body>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Compliant congratulations */}
              {data.status === 'compliant' && (
                <div className="mt-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4 flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <Body className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                      All automated checks passed
                    </Body>
                    <Body className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                      No critical or serious accessibility issues were detected. Some clauses still require manual review
                      to confirm full conformance.
                    </Body>
                  </div>
                </div>
              )}
            </div>

            {/* ─── Clause Table ────────────────────────────────── */}
            {data.tierLocked ? (
              /* Tier-locked overlay */
              <div className="relative">
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-6 blur-sm pointer-events-none select-none">
                  <div className="space-y-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 dark:bg-slate-800/60 rounded-lg">
                  <Lock className="w-8 h-8 text-slate-400 mb-3" />
                  <Heading size="sm" as="h3" className="text-slate-900 dark:text-white mb-1">
                    Detailed clause breakdown
                  </Heading>
                  <Body className="text-sm text-slate-500 dark:text-slate-400 mb-3 text-center max-w-sm">
                    Upgrade to Pro or above to view the full EN 301 549 clause-by-clause analysis
                    and linked findings.
                  </Body>
                  <Button variant="primary" size="sm" onClick={() => navigate('/settings/profile')}>
                    Upgrade Plan
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm overflow-hidden">
                {/* Filter pills */}
                <div className="px-4 sm:px-6 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2 flex-wrap">
                  <Filter className="w-4 h-4 text-slate-400" />
                  {([
                    ['all', 'All'],
                    ['failing', 'Failing'],
                    ['manual_review', 'Manual Review'],
                  ] as [FilterType, string][]).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setFilter(key)}
                      aria-pressed={filter === key}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                        filter === key
                          ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-slate-600'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                  <Body className="text-xs text-slate-400 ml-auto hidden sm:block">
                    {filteredClauses.length} clause{filteredClauses.length !== 1 ? 's' : ''}
                  </Body>
                </div>

                {/* Desktop table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <caption className="sr-only">EN 301 549 clause compliance breakdown</caption>
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
                        <th className="w-8" />
                        <SortableHeader
                          label="Clause"
                          field="clause"
                          current={sortField}
                          dir={sortDir}
                          onClick={handleSort}
                        />
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                          Title
                        </th>
                        <SortableHeader
                          label="Status"
                          field="status"
                          current={sortField}
                          dir={sortDir}
                          onClick={handleSort}
                        />
                        <SortableHeader
                          label="Issues"
                          field="issues"
                          current={sortField}
                          dir={sortDir}
                          onClick={handleSort}
                          className="text-right"
                        />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {filteredClauses.map(clause => {
                        const isExpanded = expandedClauses.has(clause.clause);
                        const hasFindings = clause.findings.length > 0;
                        return (
                          <ClauseRow
                            key={clause.clause}
                            clause={clause}
                            isExpanded={isExpanded}
                            hasFindings={hasFindings}
                            onToggle={() => toggleExpand(clause.clause)}
                          />
                        );
                      })}
                      {filteredClauses.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                            No clauses match the current filter.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="sm:hidden divide-y divide-slate-100 dark:divide-slate-700">
                  {filteredClauses.map(clause => (
                    <MobileClauseCard
                      key={clause.clause}
                      clause={clause}
                      isExpanded={expandedClauses.has(clause.clause)}
                      onToggle={() => toggleExpand(clause.clause)}
                    />
                  ))}
                  {filteredClauses.length === 0 && (
                    <div className="px-4 py-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                      No clauses match the current filter.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ─── Disclaimer ──────────────────────────────────── */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <Body className="text-sm font-medium text-amber-800 dark:text-amber-300">
                  Important disclaimer
                </Body>
                <Body className="text-xs text-amber-700 dark:text-amber-400 mt-1 leading-relaxed">
                  This report is generated by automated testing tools and does not constitute a formal
                  conformance assessment or legal advice. Automated testing can detect approximately 30-40%
                  of WCAG issues. Clauses marked &ldquo;Manual Review&rdquo; require human evaluation to
                  determine conformance. For a complete EN 301 549 assessment, consult a qualified
                  accessibility specialist.
                </Body>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────

function SortableHeader({
  label,
  field,
  current,
  dir,
  onClick,
  className = '',
}: {
  label: string;
  field: SortField;
  current: SortField;
  dir: SortDir;
  onClick: (field: SortField) => void;
  className?: string;
}) {
  const active = current === field;
  return (
    <th className={`px-4 py-2.5 ${className}`}>
      <button
        type="button"
        onClick={() => onClick(field)}
        className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase hover:text-slate-700 dark:hover:text-slate-300 select-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 rounded"
        aria-label={`Sort by ${label}${active ? (dir === 'asc' ? ', ascending' : ', descending') : ''}`}
      >
        {label}
        {active && (
          <ChevronDown
            className={`w-3 h-3 transition-transform ${dir === 'desc' ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        )}
      </button>
    </th>
  );
}

function ClauseRow({
  clause,
  isExpanded,
  hasFindings,
  onToggle,
}: {
  clause: ClauseResult;
  isExpanded: boolean;
  hasFindings: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr
        className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
          hasFindings ? 'cursor-pointer' : ''
        }`}
        onClick={hasFindings ? onToggle : undefined}
      >
        <td className="pl-4 py-2.5 w-8">
          {hasFindings ? (
            isExpanded ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )
          ) : (
            <span className="w-4 h-4 block" />
          )}
        </td>
        <td className="px-4 py-2.5">
          <Mono className="text-xs text-slate-700 dark:text-slate-300">{clause.clause}</Mono>
        </td>
        <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300 text-sm">
          {clause.title}
          <span className="text-slate-400 dark:text-slate-500 text-xs ml-1.5">
            (WCAG {clause.wcagCriteria})
          </span>
        </td>
        <td className="px-4 py-2.5">
          <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${clauseStatusColour(clause.status)}`}>
            {clauseStatusIcon(clause.status)}
            {clauseStatusLabel(clause.status)}
          </span>
        </td>
        <td className="px-4 py-2.5 text-right text-sm font-medium text-slate-700 dark:text-slate-300">
          {clause.issueCount > 0 ? clause.issueCount : '\u2014'}
        </td>
      </tr>
      {isExpanded && hasFindings && (
        <tr>
          <td colSpan={5} className="bg-slate-50 dark:bg-slate-900/50 px-10 py-3">
            <div className="space-y-1.5" aria-live="polite">
              {clause.findings.map((f, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <Mono className="text-slate-600 dark:text-slate-400">{f.ruleId}</Mono>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${severityColour(f.severity)}`}>
                      {f.severity}
                    </span>
                  </div>
                  <span className="text-slate-500 dark:text-slate-400 font-medium">
                    {f.count} issue{f.count !== 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function MobileClauseCard({
  clause,
  isExpanded,
  onToggle,
}: {
  clause: ClauseResult;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const hasFindings = clause.findings.length > 0;

  return (
    <div className="px-4 py-3">
      <button
        className="w-full text-left focus:outline-none focus:ring-2 focus:ring-indigo-500/20 rounded-lg disabled:opacity-50"
        onClick={hasFindings ? onToggle : undefined}
        disabled={!hasFindings}
        aria-label={hasFindings ? `Show details for clause ${clause.clause}` : `Clause ${clause.clause}, no findings`}
        aria-expanded={hasFindings ? isExpanded : undefined}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <Mono className="text-xs text-slate-600 dark:text-slate-400">{clause.clause}</Mono>
              <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${clauseStatusColour(clause.status)}`}>
                {clauseStatusIcon(clause.status)}
                {clauseStatusLabel(clause.status)}
              </span>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300">{clause.title}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              WCAG {clause.wcagCriteria}
              {clause.issueCount > 0 && ` \u00b7 ${clause.issueCount} issue${clause.issueCount !== 1 ? 's' : ''}`}
            </p>
          </div>
          {hasFindings && (
            <ChevronDown
              className={`w-4 h-4 text-slate-400 flex-shrink-0 mt-1 transition-transform ${
                isExpanded ? 'rotate-180' : ''
              }`}
            />
          )}
        </div>
      </button>

      {isExpanded && hasFindings && (
        <div className="mt-2 ml-2 pl-3 border-l-2 border-slate-200 dark:border-slate-700 space-y-1.5">
          {clause.findings.map((f, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Mono className="text-slate-600 dark:text-slate-400">{f.ruleId}</Mono>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${severityColour(f.severity)}`}>
                  {f.severity}
                </span>
              </div>
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                {f.count}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
