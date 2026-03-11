import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  RefreshCw,
  Trash2,
  XCircle,
  ExternalLink,
  CheckCircle,
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { SkeletonScoreCards, SkeletonCard } from '../../components/ui/Skeleton';
import { useToast } from '../../components/ui/Toast';
import { SecurityBlockedAlert, AuditErrorSummary } from '../../components/audit';
import { auditsApi } from '../../services/api';
import type { Audit, Finding, AuditPage, AuditProgress, Severity, FindingCategory } from '../../types/audit.types';
import { formatDate } from '../../utils/format';
import { severityColors, categoryColors, categoryLabels, getScoreColor } from '../../utils/constants';

interface GroupedFinding {
  ruleId: string;
  ruleName: string;
  severity: Severity;
  category: FindingCategory;
  message: string;
  description: string | null;
  recommendation: string | null;
  helpUrl: string | null;
  wcagCriteria: string[] | null;
  count: number;
  pages: string[];
  status?: 'active' | 'dismissed';
}

type TabType = 'overview' | 'findings' | 'pages';

function ScoreCard({ label, score }: { label: string; score: number | null }) {
  if (score === null) return null;
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-center">
      <div className={`text-3xl font-bold ${getScoreColor(score)}`}>{score}</div>
      <div className="text-sm text-slate-500 mt-1">{label}</div>
    </div>
  );
}

export default function AuditDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [audit, setAudit] = useState<Audit | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [pages, setPages] = useState<AuditPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [progress, setProgress] = useState<AuditProgress | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Severity filter
  const [severityFilter, setSeverityFilter] = useState<Severity | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<FindingCategory | null>(null);

  const fetchAudit = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const response = await auditsApi.get(id);
      setAudit(response.data.audit);
    } catch (err) {
      setError('Failed to load audit details.');
      console.error('Failed to fetch audit:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchFindings = useCallback(async () => {
    if (!id) return;
    try {
      const response = await auditsApi.getFindings(id, { limit: 5000 });
      setFindings(response.data.findings);
    } catch (err) {
      console.error('Failed to fetch findings:', err);
    }
  }, [id]);

  const fetchPages = useCallback(async () => {
    if (!id) return;
    try {
      const response = await auditsApi.getPages(id);
      setPages(response.data.pages);
    } catch (err) {
      console.error('Failed to fetch pages:', err);
    }
  }, [id]);

  useEffect(() => {
    fetchAudit();
  }, [fetchAudit]);

  useEffect(() => {
    if (audit && (audit.status === 'completed' || audit.status === 'failed')) {
      fetchFindings();
      fetchPages();
    }
  }, [audit?.status, fetchFindings, fetchPages]);

  // SSE for real-time progress
  useEffect(() => {
    if (!id || !audit) return;
    if (audit.status !== 'pending' && audit.status !== 'processing') return;

    const eventSource = auditsApi.createProgressStream(id);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'progress') {
          setProgress(data.data);
        } else if (data.type === 'completed' || data.type === 'failed' || data.type === 'cancelled') {
          eventSource.close();
          fetchAudit();
        }
      } catch {
        // ignore parse errors
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [id, audit?.status]);

  // Group findings by rule
  const groupedFindings = (() => {
    const groups: Record<string, GroupedFinding> = {};
    const filtered = findings.filter(f => {
      if (severityFilter && f.severity !== severityFilter) return false;
      if (categoryFilter && f.category !== categoryFilter) return false;
      return true;
    });

    for (const f of filtered) {
      const key = `${f.rule_id}::${f.message}`;
      if (!groups[key]) {
        groups[key] = {
          ruleId: f.rule_id,
          ruleName: f.rule_name,
          severity: f.severity,
          category: f.category,
          message: f.message,
          description: f.description,
          recommendation: f.recommendation,
          helpUrl: f.help_url,
          wcagCriteria: f.wcag_criteria,
          count: 0,
          pages: [],
          status: f.status,
        };
      }
      groups[key].count++;
      if (f.page_url && !groups[key].pages.includes(f.page_url)) {
        groups[key].pages.push(f.page_url);
      }
    }

    return Object.values(groups).sort((a, b) => {
      const sevOrder: Record<string, number> = { critical: 0, serious: 1, moderate: 2, minor: 3, info: 4 };
      return (sevOrder[a.severity] || 5) - (sevOrder[b.severity] || 5);
    });
  })();

  const handleCancel = async () => {
    if (!id || !confirm('Cancel this audit?')) return;
    try {
      await auditsApi.cancel(id);
      toast('Audit cancelled', 'success');
      fetchAudit();
    } catch {
      toast('Failed to cancel audit', 'error');
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm('Delete this audit? This action cannot be undone.')) return;
    try {
      await auditsApi.delete(id);
      toast('Audit deleted', 'success');
      navigate('/audits');
    } catch {
      toast('Failed to delete audit', 'error');
    }
  };

  const handleRerun = async () => {
    if (!id) return;
    try {
      const response = await auditsApi.rerun(id);
      toast('New audit started', 'success');
      navigate(`/audits/${response.data.audit.id}`);
    } catch {
      toast('Failed to re-run audit', 'error');
    }
  };

  const handleBulkDismiss = async (ruleId: string, message: string, currentStatus?: string) => {
    if (!id) return;
    const newStatus = currentStatus === 'dismissed' ? 'active' : 'dismissed';
    try {
      await auditsApi.bulkDismiss(id, ruleId, message, newStatus);
      toast(`Findings ${newStatus === 'dismissed' ? 'dismissed' : 'restored'}`, 'success');
      fetchFindings();
    } catch {
      toast('Failed to update findings', 'error');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <SkeletonScoreCards />
        <div className="mt-6"><SkeletonCard /></div>
      </DashboardLayout>
    );
  }

  if (!audit) {
    return (
      <DashboardLayout>
        <Alert variant="error">
          Audit not found. <Link to="/audits" className="underline">Back to audits</Link>
        </Alert>
      </DashboardLayout>
    );
  }

  const isActive = audit.status === 'pending' || audit.status === 'processing';
  const isComplete = audit.status === 'completed';
  const displayData = progress || {
    pagesFound: audit.pages_found,
    pagesCrawled: audit.pages_crawled,
    pagesAudited: audit.pages_audited,
    currentUrl: audit.current_url,
    totalIssues: audit.total_issues,
    criticalIssues: audit.critical_issues,
    seoScore: audit.seo_score,
    accessibilityScore: audit.accessibility_score,
    securityScore: audit.security_score,
    performanceScore: audit.performance_score,
    status: audit.status,
    activityLog: [],
    queuePosition: audit.queue_position ?? null,
    estimatedWaitSeconds: audit.estimated_wait_seconds ?? null,
    contentScore: null,
    structuredDataScore: null,
  };

  const tabs: { key: TabType; label: string; count?: number }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'findings', label: 'Findings', count: findings.length },
    { key: 'pages', label: 'Pages', count: pages.length },
  ];

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Link to="/audits" className="text-slate-400 hover:text-slate-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{audit.target_domain}</h1>
            <a
              href={audit.target_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              {audit.target_url}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isActive && (
            <Button variant="outline" size="sm" onClick={handleCancel}>
              <XCircle className="w-4 h-4 mr-1" /> Cancel
            </Button>
          )}
          {isComplete && (
            <Button variant="outline" size="sm" onClick={handleRerun}>
              <RefreshCw className="w-4 h-4 mr-1" /> Re-run
            </Button>
          )}
          {!isActive && (
            <Button variant="danger" size="sm" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-1" /> Delete
            </Button>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="error" className="mb-6">{error}</Alert>
      )}

      {/* Status bar for active audits */}
      {isActive && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-600 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="font-medium text-indigo-900">
                {displayData.status === 'pending' ? 'Waiting in queue...' : 'Audit in progress...'}
              </span>
            </div>
            {displayData.queuePosition && (
              <span className="text-sm text-indigo-700">Position #{displayData.queuePosition}</span>
            )}
          </div>
          {displayData.currentUrl && (
            <p className="text-sm text-indigo-700 truncate">
              Scanning: {displayData.currentUrl}
            </p>
          )}
          <div className="mt-3 grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-indigo-900">{displayData.pagesCrawled}/{displayData.pagesFound}</div>
              <div className="text-xs text-indigo-600">Pages crawled</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-indigo-900">{displayData.pagesAudited}</div>
              <div className="text-xs text-indigo-600">Pages audited</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-indigo-900">{displayData.totalIssues}</div>
              <div className="text-xs text-indigo-600">Issues found</div>
            </div>
          </div>
          {/* Activity log */}
          {displayData.activityLog && displayData.activityLog.length > 0 && (
            <div className="mt-4 border-t border-indigo-200 pt-4">
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {displayData.activityLog.slice(0, 10).map((entry, i) => (
                  <div key={i} className="text-xs text-indigo-700 flex items-start gap-2">
                    <span className="text-indigo-400 whitespace-nowrap">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </span>
                    <span>{entry.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error display */}
      {audit.status === 'failed' && audit.error_message && (
        <Alert variant="error" className="mb-6">
          Audit failed: {audit.error_message}
        </Alert>
      )}

      {/* Error summary */}
      {audit.error_summary && (
        <div className="mb-6">
          <AuditErrorSummary
            totalErrors={(audit.pages_timeout || 0) + (audit.pages_server_error || 0) + (audit.pages_blocked || 0)}
            errorSummary={audit.error_summary}
          />
        </div>
      )}

      {/* Security blocked alert */}
      {audit.pages_blocked && audit.pages_blocked > 0 && (
        <div className="mb-6">
          <SecurityBlockedAlert
            reason={`${audit.pages_blocked} page(s) were blocked by the website's security measures.`}
            suggestion="Try verifying domain ownership or contacting the website administrator to whitelist our scanner."
            pagesBlocked={audit.pages_blocked}
            totalPages={audit.pages_found}
          />
        </div>
      )}

      {/* Scores */}
      {isComplete && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <ScoreCard label="SEO" score={audit.seo_score} />
          <ScoreCard label="Accessibility" score={audit.accessibility_score} />
          <ScoreCard label="Security" score={audit.security_score} />
          <ScoreCard label="Performance" score={audit.performance_score} />
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-200 mb-6">
        <nav className="flex space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="ml-2 text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Audit Info */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-sm font-medium text-slate-900 mb-4">Audit Information</h3>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm text-slate-500">Status</dt>
                <dd className="text-sm font-medium text-slate-900 mt-1 capitalize">{audit.status}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Started</dt>
                <dd className="text-sm font-medium text-slate-900 mt-1">{formatDate(audit.started_at)}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Completed</dt>
                <dd className="text-sm font-medium text-slate-900 mt-1">{formatDate(audit.completed_at)}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Pages</dt>
                <dd className="text-sm font-medium text-slate-900 mt-1">{audit.pages_crawled}/{audit.pages_found} crawled</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Total Issues</dt>
                <dd className="text-sm font-medium text-slate-900 mt-1">{audit.total_issues}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Critical Issues</dt>
                <dd className="text-sm font-medium text-red-600 mt-1">{audit.critical_issues}</dd>
              </div>
            </dl>
          </div>

          {/* Quick findings summary */}
          {isComplete && groupedFindings.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-sm font-medium text-slate-900 mb-4">Top Issues</h3>
              <div className="space-y-3">
                {groupedFindings.slice(0, 5).map((g, i) => (
                  <div key={i} className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${severityColors[g.severity]}`}>
                        {g.severity}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{g.ruleName}</p>
                        <p className="text-xs text-slate-500">{g.message}</p>
                      </div>
                    </div>
                    <span className="text-sm text-slate-500">{g.count}x</span>
                  </div>
                ))}
              </div>
              {groupedFindings.length > 5 && (
                <button
                  onClick={() => setActiveTab('findings')}
                  className="mt-4 text-sm text-indigo-600 hover:text-indigo-800"
                >
                  View all {groupedFindings.length} findings
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Findings Tab */}
      {activeTab === 'findings' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setCategoryFilter(null)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  categoryFilter === null ? 'bg-white shadow text-slate-900' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
              {(['seo', 'accessibility', 'security', 'performance'] as FindingCategory[]).map(cat => {
                const count = findings.filter(f => f.category === cat).length;
                if (count === 0) return null;
                return (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(categoryFilter === cat ? null : cat)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      categoryFilter === cat ? 'bg-white shadow text-slate-900' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {categoryLabels[cat]} ({count})
                  </button>
                );
              })}
            </div>
            <select
              value={severityFilter || ''}
              onChange={(e) => setSeverityFilter(e.target.value as Severity || null)}
              className="px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-lg bg-white"
            >
              <option value="">All Severities</option>
              {(['critical', 'serious', 'moderate', 'minor', 'info'] as Severity[]).map(sev => (
                <option key={sev} value={sev}>{sev.charAt(0).toUpperCase() + sev.slice(1)}</option>
              ))}
            </select>
          </div>

          {groupedFindings.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
              {findings.length === 0 ? (
                <>
                  <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                  <p className="text-slate-700 font-medium">No issues found</p>
                </>
              ) : (
                <p className="text-slate-500">No findings match your filters.</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {groupedFindings.map((g, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${severityColors[g.severity]}`}>
                          {g.severity}
                        </span>
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${categoryColors[g.category]}`}>
                          {categoryLabels[g.category]}
                        </span>
                        {g.count > 1 && (
                          <span className="text-xs text-slate-500">{g.count} occurrences</span>
                        )}
                      </div>
                      <h4 className="text-sm font-medium text-slate-900">{g.ruleName}</h4>
                      <p className="text-sm text-slate-600 mt-1">{g.message}</p>
                      {g.recommendation && (
                        <div className="mt-2 p-2 bg-indigo-50 rounded-lg">
                          <p className="text-xs text-indigo-800">
                            <span className="font-medium">Fix:</span> {g.recommendation}
                          </p>
                        </div>
                      )}
                      {g.wcagCriteria && g.wcagCriteria.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {g.wcagCriteria.map((c, j) => (
                            <span key={j} className="inline-flex px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded">
                              {c}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleBulkDismiss(g.ruleId, g.message, g.status)}
                      className="text-xs text-slate-400 hover:text-slate-600 whitespace-nowrap"
                      title={g.status === 'dismissed' ? 'Restore' : 'Dismiss all'}
                    >
                      {g.status === 'dismissed' ? 'Restore' : 'Dismiss'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pages Tab */}
      {activeTab === 'pages' && (
        <div>
          {pages.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center text-slate-500">
              No pages crawled yet.
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">URL</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase hidden md:table-cell">SEO</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase hidden md:table-cell">A11y</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase hidden md:table-cell">Sec</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase hidden md:table-cell">Perf</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Issues</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {pages.map((page) => (
                    <tr key={page.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <Link
                          to={`/audits/${id}/pages/${page.id}`}
                          className="text-sm text-indigo-600 hover:text-indigo-800 truncate block max-w-xs"
                        >
                          {page.title || page.url}
                        </Link>
                        <div className="text-xs text-slate-500 truncate max-w-xs">{page.url}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                          page.crawl_status === 'crawled' ? 'bg-emerald-100 text-emerald-800' :
                          page.crawl_status === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {page.crawl_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center hidden md:table-cell">
                        <span className={getScoreColor(page.seo_score)}>{page.seo_score ?? '-'}</span>
                      </td>
                      <td className="px-6 py-4 text-center hidden md:table-cell">
                        <span className={getScoreColor(page.accessibility_score)}>{page.accessibility_score ?? '-'}</span>
                      </td>
                      <td className="px-6 py-4 text-center hidden md:table-cell">
                        <span className={getScoreColor(page.security_score)}>{page.security_score ?? '-'}</span>
                      </td>
                      <td className="px-6 py-4 text-center hidden md:table-cell">
                        <span className={getScoreColor(page.performance_score)}>{page.performance_score ?? '-'}</span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-slate-900">
                        {(page.seo_issues || 0) + (page.accessibility_issues || 0) + (page.security_issues || 0) + (page.performance_issues || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
