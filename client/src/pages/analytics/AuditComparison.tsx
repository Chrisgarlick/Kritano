import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { GitCompare, Plus, X, AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { analyticsApi, sitesApi } from '../../services/api';
import { ScoreComparisonTable, ScoreComparisonBar, IssueDiffTable } from '../../components/analytics';
import { getScoreColor, SEVERITY_COLORS } from '../../types/analytics.types';
import type { AuditComparison as AuditComparisonType, AuditSummary } from '../../types/analytics.types';

interface AuditOption {
  id: string;
  siteName: string;
  domain: string;
  completedAt: string;
  targetUrl: string;
  pagesCrawled: number;
  totalIssues: number;
  seoScore: number | null;
  accessibilityScore: number | null;
  securityScore: number | null;
  performanceScore: number | null;
}

function MiniScore({ score }: { score: number | null }) {
  if (score === null) return null;
  return (
    <span
      className="text-xs font-medium px-1.5 py-0.5 rounded"
      style={{ color: getScoreColor(score), backgroundColor: `${getScoreColor(score)}15` }}
    >
      {score}
    </span>
  );
}

function AuditSummaryCards({ audits }: { audits: AuditSummary[] }) {
  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(audits.length, 4)}, 1fr)` }}>
      {audits.map((audit, idx) => {
        const validScores = [
          audit.scores.seo, audit.scores.accessibility, audit.scores.security,
          audit.scores.performance, audit.scores.content, audit.scores.structuredData,
        ].filter((s): s is number => s !== null);
        const overall = validScores.length > 0
          ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
          : null;

        return (
          <div key={audit.id} className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center flex-shrink-0">
                    {idx + 1}
                  </span>
                  <h3 className="text-sm font-semibold text-slate-900 truncate">{audit.siteName}</h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {new Date(audit.completedAt).toLocaleDateString()}
                </p>
              </div>
              {overall !== null && (
                <span
                  className="inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold flex-shrink-0"
                  style={{ backgroundColor: `${getScoreColor(overall)}15`, color: getScoreColor(overall) }}
                >
                  {overall}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div>
                <p className="text-xs text-slate-400">Pages</p>
                <p className="text-sm font-medium text-slate-700">{audit.pagesCrawled}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Issues</p>
                <p className="text-sm font-medium text-slate-700">{audit.issues.total}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const SEVERITY_ORDER = ['critical', 'serious', 'moderate', 'minor'] as const;
const SEVERITY_LABELS: Record<string, string> = {
  critical: 'Critical',
  serious: 'Serious',
  moderate: 'Moderate',
  minor: 'Minor',
};

function SeverityBreakdown({ audits }: { audits: AuditSummary[] }) {
  // Sum unique issue counts from severity breakdown (not total_issues which counts occurrences)
  const uniqueTotal = (a: AuditSummary) => a.issues.critical + a.issues.serious + a.issues.moderate + a.issues.minor;
  const maxIssues = Math.max(...audits.map(a => uniqueTotal(a)), 1);

  return (
    <div className="space-y-6">
      {/* Stacked bars */}
      <div className="space-y-4">
        {audits.map((audit, idx) => (
          <div key={audit.id}>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center flex-shrink-0">
                {idx + 1}
              </span>
              <span className="text-sm font-medium text-slate-700 truncate">{audit.siteName}</span>
              <span className="text-xs text-slate-400">
                {new Date(audit.completedAt).toLocaleDateString()}
              </span>
              <span className="text-xs text-slate-500 ml-auto">{uniqueTotal(audit)} unique issues</span>
            </div>
            <div className="h-8 bg-slate-100 rounded overflow-hidden flex">
              {SEVERITY_ORDER.map(sev => {
                const count = audit.issues[sev];
                if (count === 0) return null;
                const pct = (count / maxIssues) * 100;
                return (
                  <div
                    key={sev}
                    className="h-full flex items-center justify-center text-[10px] font-medium text-white"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: SEVERITY_COLORS[sev],
                      minWidth: count > 0 ? '20px' : '0',
                    }}
                    title={`${SEVERITY_LABELS[sev]}: ${count}`}
                  >
                    {pct > 8 ? count : ''}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 justify-center">
        {SEVERITY_ORDER.map(sev => (
          <div key={sev} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: SEVERITY_COLORS[sev] }} />
            <span className="text-xs text-slate-600">{SEVERITY_LABELS[sev]}</span>
          </div>
        ))}
      </div>

      {/* Delta row (if 2+ audits) */}
      {audits.length >= 2 && (
        <div className="border-t border-slate-200 pt-4">
          <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
            Change (First → Last)
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {SEVERITY_ORDER.map(sev => {
              const first = audits[0].issues[sev];
              const last = audits[audits.length - 1].issues[sev];
              const delta = last - first;
              return (
                <div key={sev} className="text-center">
                  <p className="text-xs text-slate-400 mb-0.5">{SEVERITY_LABELS[sev]}</p>
                  <span className={`inline-flex items-center gap-0.5 text-sm font-medium ${
                    delta > 0 ? 'text-red-600' : delta < 0 ? 'text-emerald-600' : 'text-slate-400'
                  }`}>
                    {delta > 0 ? <TrendingUp className="w-3.5 h-3.5" /> :
                     delta < 0 ? <TrendingDown className="w-3.5 h-3.5" /> :
                     <Minus className="w-3.5 h-3.5" />}
                    {delta > 0 ? `+${delta}` : delta}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function AuditComparisonContent() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [comparison, setComparison] = useState<AuditComparisonType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // For audit selector
  const [availableAudits, setAvailableAudits] = useState<AuditOption[]>([]);
  const [auditsLoading, setAuditsLoading] = useState(false);
  const [showSelector, setShowSelector] = useState(false);

  const selectedAuditIds = searchParams.get('audits')?.split(',').filter(Boolean) || [];

  // Helper to update search params while preserving existing ones (like tab)
  const updateParams = useCallback((updates: Record<string, string | null>) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      for (const [key, value] of Object.entries(updates)) {
        if (value === null) {
          next.delete(key);
        } else {
          next.set(key, value);
        }
      }
      return next;
    });
  }, [setSearchParams]);

  // Fetch available audits from all sites
  useEffect(() => {
    async function fetchAudits() {
      try {
        setAuditsLoading(true);
        const sitesRes = await sitesApi.list();
        const sites = sitesRes.data.sites;

        const allAudits: AuditOption[] = [];
        for (const site of sites) {
          const auditsRes = await sitesApi.getAudits(site.id, { limit: 10 });
          const audits = auditsRes.data.audits.filter((a: any) => a.status === 'completed');
          audits.forEach((audit: any) => {
            allAudits.push({
              id: audit.id,
              siteName: site.name,
              domain: site.domain,
              completedAt: audit.completedAt,
              targetUrl: audit.targetUrl,
              pagesCrawled: audit.pagesCrawled || 0,
              totalIssues: audit.totalIssues || 0,
              seoScore: audit.seoScore,
              accessibilityScore: audit.accessibilityScore,
              securityScore: audit.securityScore,
              performanceScore: audit.performanceScore,
            });
          });
        }

        // Sort by date descending
        allAudits.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
        setAvailableAudits(allAudits);
      } catch (err: any) {
        console.error('Failed to fetch audits:', err);
      } finally {
        setAuditsLoading(false);
      }
    }
    fetchAudits();
  }, []);

  // Fetch comparison when audit IDs change
  useEffect(() => {
    async function fetchComparison() {
      if (selectedAuditIds.length < 2) {
        setComparison(null);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const response = await analyticsApi.compareAudits(selectedAuditIds);
        setComparison(response.data);
      } catch (err: any) {
        console.error('Failed to compare audits:', err);
        setError(err.response?.data?.error || 'Failed to compare audits');
        setComparison(null);
      } finally {
        setLoading(false);
      }
    }
    fetchComparison();
  }, [selectedAuditIds.join(',')]);

  const addAudit = (auditId: string) => {
    if (selectedAuditIds.length >= 4) return;
    if (selectedAuditIds.includes(auditId)) return;
    const newIds = [...selectedAuditIds, auditId];
    updateParams({ audits: newIds.join(',') });
    setShowSelector(false);
  };

  const removeAudit = (auditId: string) => {
    const newIds = selectedAuditIds.filter(id => id !== auditId);
    updateParams({ audits: newIds.length > 0 ? newIds.join(',') : null });
  };

  const selectedAudits = selectedAuditIds
    .map(id => availableAudits.find(a => a.id === id))
    .filter((a): a is AuditOption => a !== undefined);

  return (
    <div className="space-y-6">
      {/* Audit Selector */}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium text-slate-900">Selected Audits ({selectedAuditIds.length}/4)</h2>
          {selectedAuditIds.length < 4 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSelector(!showSelector)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Audit
            </Button>
          )}
        </div>

        {/* Selected Audits */}
        {selectedAudits.length > 0 ? (
          <div className="flex flex-wrap gap-2 mb-4">
            {selectedAudits.map((audit, idx) => (
              <div
                key={audit.id}
                className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-lg"
              >
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center">
                  {idx + 1}
                </span>
                <div className="text-sm">
                  <span className="font-medium text-slate-700">{audit.siteName}</span>
                  <span className="text-slate-400 mx-1">&middot;</span>
                  <span className="text-slate-500">
                    {new Date(audit.completedAt).toLocaleDateString()}
                  </span>
                  <span className="text-slate-400 mx-1">&middot;</span>
                  <span className="text-slate-500">{audit.pagesCrawled} pages</span>
                </div>
                <button
                  onClick={() => removeAudit(audit.id)}
                  className="text-slate-400 hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-400 text-sm mb-4">
            Select at least 2 audits to compare
          </p>
        )}

        {/* Audit Picker Dropdown */}
        {showSelector && (
          <div className="border border-slate-200 rounded-lg max-h-80 overflow-y-auto">
            {auditsLoading ? (
              <div className="p-4 text-center text-slate-400">Loading audits...</div>
            ) : availableAudits.length === 0 ? (
              <div className="p-4 text-center text-slate-400">No completed audits found</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {availableAudits
                  .filter(a => !selectedAuditIds.includes(a.id))
                  .map(audit => (
                    <button
                      key={audit.id}
                      onClick={() => addAudit(audit.id)}
                      className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-700">{audit.siteName}</span>
                            <span className="text-slate-400 text-xs">({audit.domain})</span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                            <span>{audit.pagesCrawled} pages</span>
                            <span className="text-slate-300">&middot;</span>
                            <span>{audit.totalIssues} issues</span>
                            <span className="text-slate-300">&middot;</span>
                            <span className="truncate max-w-[200px]">{audit.targetUrl}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="flex gap-1">
                            <MiniScore score={audit.seoScore} />
                            <MiniScore score={audit.accessibilityScore} />
                            <MiniScore score={audit.securityScore} />
                            <MiniScore score={audit.performanceScore} />
                          </div>
                          <span className="text-xs text-slate-500 whitespace-nowrap">
                            {new Date(audit.completedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Comparison Results */}
      {loading ? (
        <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full mx-auto mb-4" />
          <p className="text-slate-500">Comparing audits...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-700">{error}</p>
        </div>
      ) : comparison ? (
        <div className="space-y-6">
          {/* Summary Cards */}
          <AuditSummaryCards audits={comparison.audits} />

          {/* Score Comparison Table */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-medium text-slate-900 mb-4">Score Comparison</h2>
            <ScoreComparisonTable
              audits={comparison.audits}
              scoreDeltas={comparison.comparison.scoreDeltas}
            />
          </div>

          {/* Score Bar Chart */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-medium text-slate-900 mb-4">Score Breakdown</h2>
            <ScoreComparisonBar
              audits={comparison.audits}
              scoreDeltas={comparison.comparison.scoreDeltas}
            />
          </div>

          {/* Severity Breakdown */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-medium text-slate-900 mb-1">Severity Breakdown</h2>
            <p className="text-sm text-slate-500 mb-4">
              Compare issue severity distribution across audits
            </p>
            <SeverityBreakdown audits={comparison.audits} />
          </div>

          {/* Issue Diff */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-medium text-slate-900 mb-4">Issue Changes</h2>
            <IssueDiffTable
              commonIssues={comparison.comparison.commonIssues}
              resolvedIssues={comparison.comparison.resolvedIssues}
              newIssues={comparison.comparison.newIssues}
            />
          </div>

          {/* Quick Links */}
          <div className="flex gap-2 text-sm">
            {comparison.audits.map(audit => (
              <Link
                key={audit.id}
                to={`/audits/${audit.id}`}
                className="text-indigo-600 hover:text-indigo-800 hover:underline"
              >
                View {audit.siteName} audit &rarr;
              </Link>
            ))}
          </div>
        </div>
      ) : selectedAuditIds.length < 2 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
          <GitCompare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">Select Audits to Compare</h3>
          <p className="text-slate-500">
            Choose 2-4 audits from any of your sites to see score changes and issue differences.
          </p>
        </div>
      ) : null}
    </div>
  );
}

export default function AuditComparison() {
  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
              <Link to="/analytics" className="hover:text-indigo-600">&larr; Analytics</Link>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <GitCompare className="w-6 h-6 text-indigo-600" />
              Compare Audits
            </h1>
            <p className="text-slate-500 mt-1">
              Compare scores and issues between audits
            </p>
          </div>
        </div>

        <AuditComparisonContent />
      </div>
    </DashboardLayout>
  );
}
