import { useMemo, useState } from 'react';
import {
  ArrowUp,
  ArrowDown,
  Minus,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Trophy,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  FileText,
  Zap,
  Code2,
} from 'lucide-react';
import { ScoreRadarChart } from '../analytics/ScoreRadarChart';
import { getScoreColor, CATEGORY_COLORS } from '../../types/analytics.types';
import type {
  UrlComparison,
  UrlPageSnapshot,
  UrlComparisonInsight,
  UrlFindingItem,
  SiteComparisonEntry,
  ScoreCategory,
} from '../../types/analytics.types';

interface UrlComparisonViewProps {
  comparison: UrlComparison;
}

function ScoreBadge({ score, label }: { score: number | null; label?: string }) {
  if (score === null) return <span className="text-sm text-slate-500">N/A</span>;
  return (
    <div className="text-center">
      {label && <div className="text-xs text-slate-500 mb-1">{label}</div>}
      <span
        className="text-lg font-bold"
        style={{ color: getScoreColor(score) }}
      >
        {score}
      </span>
    </div>
  );
}

function DeltaIndicator({ delta }: { delta: number | null }) {
  if (delta === null) return <span className="text-xs text-slate-500">--</span>;
  if (Math.abs(delta) < 1) return <Minus className="w-4 h-4 text-slate-500 mx-auto" />;
  if (delta > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-600">
        <ArrowUp className="w-3 h-3" />+{Math.round(delta)}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-xs font-medium text-red-500">
      <ArrowDown className="w-3 h-3" />{Math.round(delta)}
    </span>
  );
}

function ProgressBar({ value, max = 100, color }: { value: number | null; max?: number; color?: string }) {
  if (value === null) return <div className="h-2 bg-slate-100 rounded-full" />;
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all"
        style={{
          width: `${pct}%`,
          backgroundColor: color || getScoreColor(value),
        }}
      />
    </div>
  );
}

function TrustSignalRow({ label, valueA, valueB }: { label: string; valueA: boolean | null; valueB: boolean | null }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="text-slate-600">{label}</span>
      <div className="flex items-center gap-8">
        <span className="w-16 text-center">
          {valueA === null ? (
            <span className="text-slate-500">--</span>
          ) : valueA ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
          ) : (
            <XCircle className="w-4 h-4 text-red-400 mx-auto" />
          )}
        </span>
        <span className="w-16 text-center">
          {valueB === null ? (
            <span className="text-slate-500">--</span>
          ) : valueB ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
          ) : (
            <XCircle className="w-4 h-4 text-red-400 mx-auto" />
          )}
        </span>
      </div>
    </div>
  );
}

function InsightCard({ insight, labelA, labelB }: { insight: UrlComparisonInsight; labelA: string; labelB: string }) {
  const severityStyles = {
    high: 'border-red-200 bg-red-50/50',
    medium: 'border-amber-200 bg-amber-50/50',
    low: 'border-slate-200 bg-slate-50/50',
  };

  const severityBadge = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-amber-100 text-amber-700',
    low: 'bg-slate-100 text-slate-600',
  };

  const winnerLabel = insight.winner === 'a' ? labelA : insight.winner === 'b' ? labelB : 'Tie';

  return (
    <div className={`rounded-lg border p-4 ${severityStyles[insight.severity]}`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${severityBadge[insight.severity]}`}>
            {insight.severity}
          </span>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
            {insight.category}
          </span>
        </div>
        {insight.winner !== 'tie' && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
            <Trophy className="w-3 h-3" />
            {winnerLabel}
          </span>
        )}
      </div>
      <h4 className="font-medium text-slate-900 text-sm mb-1">{insight.title}</h4>
      <p className="text-sm text-slate-600 mb-2">{insight.description}</p>
      <div className="flex items-start gap-2 text-sm text-indigo-700 bg-indigo-50 rounded-md px-3 py-2">
        <Lightbulb className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <span>{insight.recommendation}</span>
      </div>
    </div>
  );
}

function CollapsibleSection({ title, icon, children, defaultOpen = false, badge }: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-lg border border-slate-200">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-lg font-medium text-slate-900">{title}</h2>
          {badge}
        </div>
        {open ? <ChevronDown className="w-5 h-5 text-slate-500" /> : <ChevronRight className="w-5 h-5 text-slate-500" />}
      </button>
      {open && <div className="px-6 pb-6 -mt-2">{children}</div>}
    </div>
  );
}

function formatBytes(bytes: number | null): string {
  if (bytes === null) return '--';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatMs(ms: number | null): string {
  if (ms === null) return '--';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function ResponseTimeColor({ ms }: { ms: number | null }) {
  if (ms === null) return <span className="text-slate-500">--</span>;
  const color = ms < 500 ? 'text-emerald-600' : ms < 1500 ? 'text-amber-600' : 'text-red-600';
  return <span className={`font-medium ${color}`}>{formatMs(ms)}</span>;
}

function SeverityBadge({ severity }: { severity: string }) {
  const styles: Record<string, string> = {
    critical: 'bg-red-100 text-red-700',
    serious: 'bg-orange-100 text-orange-700',
    moderate: 'bg-amber-100 text-amber-700',
    minor: 'bg-sky-100 text-sky-700',
  };
  return (
    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${styles[severity] || 'bg-slate-100 text-slate-600'}`}>
      {severity}
    </span>
  );
}

function CategoryBadge({ category }: { category: string }) {
  return (
    <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700">
      {category}
    </span>
  );
}

function CharLengthIndicator({ length, optMin, optMax }: { length: number; optMin: number; optMax: number }) {
  const color = length === 0 ? 'text-red-600' : length >= optMin && length <= optMax ? 'text-emerald-600' : 'text-amber-600';
  return <span className={`text-xs ${color}`}>({length} chars)</span>;
}

// =============================================
// Main Component
// =============================================

export function UrlComparisonView({ comparison }: UrlComparisonViewProps) {
  const [a, b] = comparison.urls;

  const radarSites: SiteComparisonEntry[] = useMemo(() => {
    return comparison.urls.map(snap => ({
      id: snap.urlId,
      name: snap.urlPath || '/',
      domain: snap.siteDomain,
      latestAudit: {
        id: snap.auditId,
        completedAt: snap.auditedAt,
        scores: snap.scores,
        totalIssues: 0,
      },
      historicalAverage: snap.scores,
    }));
  }, [comparison.urls]);

  const scoreRows: { key: string; label: string }[] = [
    { key: 'seo', label: 'SEO' },
    { key: 'accessibility', label: 'Accessibility' },
    { key: 'security', label: 'Security' },
    { key: 'performance', label: 'Performance' },
    { key: 'content', label: 'Content' },
    { key: 'structuredData', label: 'Structured Data' },
  ];

  const urlLabelA = a.urlPath || '/';
  const urlLabelB = b.urlPath || '/';

  const aTotalIssues = Object.values(a.issueCountByCategory).reduce((s, v) => s + v, 0);
  const bTotalIssues = Object.values(b.issueCountByCategory).reduce((s, v) => s + v, 0);

  return (
    <div className="space-y-6">
      {/* 1. Header cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <HeaderCard snapshot={a} label="URL A" />
        <HeaderCard snapshot={b} label="URL B" />
      </div>

      {/* 2. Radar Chart */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-medium text-slate-900 mb-4">Score Overview</h2>
        <ScoreRadarChart sites={radarSites} height={350} />
      </div>

      {/* 3. Main score table */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-medium text-slate-900 mb-4">Score Comparison</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-slate-500 uppercase tracking-wider">
                <th className="text-left pb-3 font-medium">Category</th>
                <th className="text-center pb-3 font-medium w-24">URL A</th>
                <th className="text-center pb-3 font-medium w-20">Delta</th>
                <th className="text-center pb-3 font-medium w-24">URL B</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {scoreRows.map(row => (
                <tr key={row.key}>
                  <td className="py-3 text-sm font-medium text-slate-700">{row.label}</td>
                  <td className="py-3 text-center">
                    <ScoreBadge score={a.scores[row.key as keyof typeof a.scores]} />
                  </td>
                  <td className="py-3 text-center">
                    <DeltaIndicator delta={comparison.scoreDeltas[row.key]} />
                  </td>
                  <td className="py-3 text-center">
                    <ScoreBadge score={b.scores[row.key as keyof typeof b.scores]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Issue Count Summary Bar (NEW) */}
      {(aTotalIssues > 0 || bTotalIssues > 0) && (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-medium text-slate-900 mb-4">
            Issue Summary
            <span className="text-sm font-normal text-slate-500 ml-2">
              ({aTotalIssues} vs {bTotalIssues} total)
            </span>
          </h2>
          <div className="space-y-4">
            <IssueBar snapshot={a} label="URL A" total={aTotalIssues} />
            <IssueBar snapshot={b} label="URL B" total={bTotalIssues} />
          </div>
        </div>
      )}

      {/* 5. HTTP & Performance Metrics (NEW) */}
      {(a.httpPerformance.statusCode !== null || b.httpPerformance.statusCode !== null) && (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-medium text-slate-900">HTTP & Performance</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-slate-500 uppercase tracking-wider">
                  <th className="text-left pb-3 font-medium">Metric</th>
                  <th className="text-center pb-3 font-medium w-32">URL A</th>
                  <th className="text-center pb-3 font-medium w-32">URL B</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3 text-sm text-slate-700">Status Code</td>
                  <td className="py-3 text-center">
                    <StatusCodeBadge code={a.httpPerformance.statusCode} />
                  </td>
                  <td className="py-3 text-center">
                    <StatusCodeBadge code={b.httpPerformance.statusCode} />
                  </td>
                </tr>
                <tr>
                  <td className="py-3 text-sm text-slate-700">
                    Response Time
                    <span className="text-xs text-slate-500 ml-1">(green &lt;500ms)</span>
                  </td>
                  <td className="py-3 text-center text-sm">
                    <ResponseTimeColor ms={a.httpPerformance.responseTimeMs} />
                  </td>
                  <td className="py-3 text-center text-sm">
                    <ResponseTimeColor ms={b.httpPerformance.responseTimeMs} />
                  </td>
                </tr>
                <tr>
                  <td className="py-3 text-sm text-slate-700">Page Size</td>
                  <td className="py-3 text-center text-sm font-medium text-slate-700">
                    {formatBytes(a.httpPerformance.pageSizeBytes)}
                  </td>
                  <td className="py-3 text-center text-sm font-medium text-slate-700">
                    {formatBytes(b.httpPerformance.pageSizeBytes)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Content subscores */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-medium text-slate-900 mb-4">Content Subscores</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(['quality', 'readability', 'structure', 'engagement'] as const).map(key => {
            const aVal = a.contentSubscores[key];
            const bVal = b.contentSubscores[key];
            const delta = aVal !== null && bVal !== null ? bVal - aVal : null;
            return (
              <div key={key} className="bg-slate-50 rounded-lg p-4">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3 capitalize">{key}</div>
                <div className="flex items-end justify-between gap-2">
                  <ScoreBadge score={aVal} label="A" />
                  <DeltaIndicator delta={delta} />
                  <ScoreBadge score={bVal} label="B" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 7. Content & SEO Signals (ENHANCED) */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-medium text-slate-900">Content & SEO Signals</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-slate-500 uppercase tracking-wider">
                <th className="text-left pb-3 font-medium">Metric</th>
                <th className="text-center pb-3 font-medium w-[40%]">URL A</th>
                <th className="text-center pb-3 font-medium w-[40%]">URL B</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-3 text-sm text-slate-700">
                  Title <span className="text-xs text-slate-500">(50-60 chars)</span>
                </td>
                <td className="py-3 px-2">
                  <div className="text-sm text-slate-700 truncate max-w-[250px]" title={a.meta.title || ''}>
                    {a.meta.title || <span className="text-red-500 italic">Missing</span>}
                  </div>
                  {a.meta.title && <CharLengthIndicator length={a.meta.title.length} optMin={50} optMax={60} />}
                </td>
                <td className="py-3 px-2">
                  <div className="text-sm text-slate-700 truncate max-w-[250px]" title={b.meta.title || ''}>
                    {b.meta.title || <span className="text-red-500 italic">Missing</span>}
                  </div>
                  {b.meta.title && <CharLengthIndicator length={b.meta.title.length} optMin={50} optMax={60} />}
                </td>
              </tr>
              <tr>
                <td className="py-3 text-sm text-slate-700">
                  Meta Description <span className="text-xs text-slate-500">(150-160)</span>
                </td>
                <td className="py-3 px-2">
                  <div className="text-sm text-slate-700 truncate max-w-[250px]" title={a.meta.metaDescription || ''}>
                    {a.meta.metaDescription || <span className="text-red-500 italic">Missing</span>}
                  </div>
                  {a.meta.metaDescription && <CharLengthIndicator length={a.meta.metaDescription.length} optMin={150} optMax={160} />}
                </td>
                <td className="py-3 px-2">
                  <div className="text-sm text-slate-700 truncate max-w-[250px]" title={b.meta.metaDescription || ''}>
                    {b.meta.metaDescription || <span className="text-red-500 italic">Missing</span>}
                  </div>
                  {b.meta.metaDescription && <CharLengthIndicator length={b.meta.metaDescription.length} optMin={150} optMax={160} />}
                </td>
              </tr>
              <tr>
                <td className="py-3 text-sm text-slate-700">H1</td>
                <td className="py-3 px-2 text-sm text-slate-700 truncate max-w-[250px]" title={a.meta.h1Text || ''}>
                  {a.meta.h1Text || <span className="text-slate-500">--</span>}
                </td>
                <td className="py-3 px-2 text-sm text-slate-700 truncate max-w-[250px]" title={b.meta.h1Text || ''}>
                  {b.meta.h1Text || <span className="text-slate-500">--</span>}
                </td>
              </tr>
              <tr>
                <td className="py-3 text-sm text-slate-700">Canonical URL</td>
                <td className="py-3 px-2">
                  {a.meta.canonicalUrl ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400 mx-auto" />
                  )}
                </td>
                <td className="py-3 px-2">
                  {b.meta.canonicalUrl ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400 mx-auto" />
                  )}
                </td>
              </tr>
              <ReadabilityRow
                label="Grade Level"
                valueA={a.readability.fleschKincaidGrade}
                valueB={b.readability.fleschKincaidGrade}
                format={v => v?.toFixed(1) ?? '--'}
                optimal="7-9"
              />
              <ReadabilityRow
                label="Reading Ease"
                valueA={a.readability.fleschReadingEase}
                valueB={b.readability.fleschReadingEase}
                format={v => v?.toFixed(1) ?? '--'}
                optimal="60-70"
              />
              <ReadabilityRow
                label="Word Count"
                valueA={a.meta.wordCount}
                valueB={b.meta.wordCount}
                format={v => v?.toLocaleString() ?? '--'}
              />
              <ReadabilityRow
                label="Reading Time"
                valueA={a.readability.readingTimeMinutes}
                valueB={b.readability.readingTimeMinutes}
                format={v => v !== null && v !== undefined ? `${v} min` : '--'}
              />
              <ReadabilityRow
                label="Content Type"
                valueA={a.meta.contentType}
                valueB={b.meta.contentType}
                format={v => (v as string) || '--'}
              />
            </tbody>
          </table>
        </div>
      </div>

      {/* 8. E-E-A-T comparison (ENHANCED with evidence) */}
      {(a.eeat.overall !== null || b.eeat.overall !== null) && (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-medium text-slate-900 mb-4">E-E-A-T Analysis</h2>

          {(a.eeat.tier || b.eeat.tier) && (
            <div className="flex items-center gap-4 mb-4">
              <TierBadge tier={a.eeat.tier} label="A" />
              <span className="text-slate-300">vs</span>
              <TierBadge tier={b.eeat.tier} label="B" />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {(['experience', 'expertise', 'authoritativeness', 'trustworthiness'] as const).map(pillar => (
              <div key={pillar} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700 capitalize">{pillar}</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 w-4">A</span>
                    <div className="flex-1"><ProgressBar value={a.eeat[pillar]} color="#4f46e5" /></div>
                    <span className="text-xs font-medium text-slate-600 w-8 text-right">{a.eeat[pillar] ?? '--'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 w-4">B</span>
                    <div className="flex-1"><ProgressBar value={b.eeat[pillar]} color="#10b981" /></div>
                    <span className="text-xs font-medium text-slate-600 w-8 text-right">{b.eeat[pillar] ?? '--'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Trust signals */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-slate-700 mb-2">Trust Signals</h3>
            <div className="bg-slate-50 rounded-lg px-4 py-2">
              <div className="flex items-center justify-between py-1 text-xs font-medium text-slate-500 uppercase tracking-wider">
                <span>Signal</span>
                <div className="flex items-center gap-8">
                  <span className="w-16 text-center">URL A</span>
                  <span className="w-16 text-center">URL B</span>
                </div>
              </div>
              <TrustSignalRow label="Author Bio" valueA={a.eeat.trustSignals.hasAuthorBio} valueB={b.eeat.trustSignals.hasAuthorBio} />
              <TrustSignalRow label="Author Credentials" valueA={a.eeat.trustSignals.hasAuthorCredentials} valueB={b.eeat.trustSignals.hasAuthorCredentials} />
              <TrustSignalRow label="Contact Info" valueA={a.eeat.trustSignals.hasContactInfo} valueB={b.eeat.trustSignals.hasContactInfo} />
              <TrustSignalRow label="Privacy Policy" valueA={a.eeat.trustSignals.hasPrivacyPolicy} valueB={b.eeat.trustSignals.hasPrivacyPolicy} />
              <TrustSignalRow label="Terms of Service" valueA={a.eeat.trustSignals.hasTermsOfService} valueB={b.eeat.trustSignals.hasTermsOfService} />
              <div className="flex items-center justify-between py-1.5 text-sm">
                <span className="text-slate-600">Citations</span>
                <div className="flex items-center gap-8">
                  <span className="w-16 text-center text-sm font-medium text-slate-700">
                    {a.eeat.trustSignals.citationCount ?? '--'}
                  </span>
                  <span className="w-16 text-center text-sm font-medium text-slate-700">
                    {b.eeat.trustSignals.citationCount ?? '--'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Evidence Details (NEW) */}
          {(a.eeat.evidence.length > 0 || b.eeat.evidence.length > 0) && (
            <EvidenceSection evidenceA={a.eeat.evidence} evidenceB={b.eeat.evidence} />
          )}
        </div>
      )}

      {/* 9. AEO comparison (ENHANCED with nuggets) */}
      {(a.aeo.overall !== null || b.aeo.overall !== null) && (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-medium text-slate-900 mb-4">AEO (AI Engine Optimization)</h2>

          {(a.aeo.tier || b.aeo.tier) && (
            <div className="flex items-center gap-4 mb-4">
              <TierBadge tier={a.aeo.tier} label="A" />
              <span className="text-slate-300">vs</span>
              <TierBadge tier={b.aeo.tier} label="B" />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {([
              { key: 'nuggetScore' as const, label: 'Nugget Score' },
              { key: 'factualDensity' as const, label: 'Factual Density' },
              { key: 'sourceAuthority' as const, label: 'Source Authority' },
            ]).map(({ key, label }) => (
              <div key={key} className="space-y-2">
                <span className="text-sm font-medium text-slate-700">{label}</span>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 w-4">A</span>
                    <div className="flex-1"><ProgressBar value={a.aeo[key]} color="#4f46e5" /></div>
                    <span className="text-xs font-medium text-slate-600 w-8 text-right">{a.aeo[key] ?? '--'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 w-4">B</span>
                    <div className="flex-1"><ProgressBar value={b.aeo[key]} color="#10b981" /></div>
                    <span className="text-xs font-medium text-slate-600 w-8 text-right">{b.aeo[key] ?? '--'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* AEO Nuggets (NEW) */}
          {(a.aeo.nuggets.length > 0 || b.aeo.nuggets.length > 0) && (
            <NuggetsSection nuggetsA={a.aeo.nuggets} nuggetsB={b.aeo.nuggets} />
          )}
        </div>
      )}

      {/* 10. Structured Data Deep Dive (NEW) */}
      {(a.structuredDataDetail.jsonLdCount > 0 || b.structuredDataDetail.jsonLdCount > 0 ||
        a.structuredDataDetail.hasOpenGraph || b.structuredDataDetail.hasOpenGraph) && (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Code2 className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-medium text-slate-900">Structured Data</h2>
          </div>
          <StructuredDataSection a={a} b={b} />
        </div>
      )}

      {/* 11. Keyword comparison */}
      {(a.keyword || b.keyword) && (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-medium text-slate-900 mb-4">Keyword Analysis</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <KeywordCard snapshot={a} label="URL A" />
            <KeywordCard snapshot={b} label="URL B" />
          </div>
        </div>
      )}

      {/* 12. Actionable Insights */}
      {comparison.insights.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-medium text-slate-900 mb-4">
            Actionable Insights
            <span className="text-sm font-normal text-slate-500 ml-2">({comparison.insights.length})</span>
          </h2>
          <div className="space-y-3">
            {comparison.insights.map((insight, idx) => (
              <InsightCard
                key={idx}
                insight={insight}
                labelA={urlLabelA}
                labelB={urlLabelB}
              />
            ))}
          </div>
        </div>
      )}

      {/* 13. Issue Diff Table (NEW) */}
      {comparison.findingsDiff && (
        comparison.findingsDiff.uniqueToA.length > 0 ||
        comparison.findingsDiff.uniqueToB.length > 0 ||
        comparison.findingsDiff.shared.length > 0
      ) && (
        <CollapsibleSection
          title="Detailed Issue Comparison"
          icon={<AlertTriangle className="w-5 h-5 text-indigo-600" />}
          badge={
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full ml-2">
              {comparison.findingsDiff.uniqueToA.length + comparison.findingsDiff.uniqueToB.length + comparison.findingsDiff.shared.length} findings
            </span>
          }
        >
          <FindingsDiffView
            diff={comparison.findingsDiff}
            labelA={urlLabelA}
            labelB={urlLabelB}
          />
        </CollapsibleSection>
      )}
    </div>
  );
}

// =============================================
// Sub-components
// =============================================

function HeaderCard({ snapshot, label }: { snapshot: UrlPageSnapshot; label: string }) {
  const scores = [snapshot.scores.seo, snapshot.scores.accessibility, snapshot.scores.security,
    snapshot.scores.performance, snapshot.scores.content, snapshot.scores.structuredData]
    .filter((s): s is number => s !== null);
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium text-indigo-600 uppercase tracking-wider mb-1">{label}</div>
          <h3 className="text-sm font-semibold text-slate-900 truncate" title={snapshot.url}>
            {snapshot.urlPath || '/'}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">{snapshot.siteName} ({snapshot.siteDomain})</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Audited {new Date(snapshot.auditedAt).toLocaleDateString()}
          </p>
        </div>
        {avgScore !== null && (
          <div className="text-center flex-shrink-0">
            <div className="text-xs text-slate-500 mb-1">Average</div>
            <span className="text-2xl font-bold" style={{ color: getScoreColor(avgScore) }}>
              {avgScore}
            </span>
          </div>
        )}
      </div>
      {snapshot.meta.title && (
        <p className="text-xs text-slate-500 mt-3 truncate border-t border-slate-100 pt-2" title={snapshot.meta.title}>
          {snapshot.meta.title}
        </p>
      )}
    </div>
  );
}

function TierBadge({ tier, label }: { tier: string | null; label: string }) {
  if (!tier) return <span className="text-sm text-slate-500">{label}: No tier</span>;

  const tierStyles: Record<string, string> = {
    'ghost-content': 'bg-slate-100 text-slate-600',
    'standard-web': 'bg-amber-100 text-amber-700',
    'expert-verified': 'bg-emerald-100 text-emerald-700',
    'ignored': 'bg-slate-100 text-slate-600',
    'general-reference': 'bg-amber-100 text-amber-700',
    'primary-source': 'bg-emerald-100 text-emerald-700',
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-500">{label}:</span>
      <span className={`text-xs font-medium px-2 py-1 rounded-full ${tierStyles[tier] || 'bg-slate-100 text-slate-600'}`}>
        {tier.replace(/-/g, ' ')}
      </span>
    </div>
  );
}

function StatusCodeBadge({ code }: { code: number | null }) {
  if (code === null) return <span className="text-slate-500">--</span>;
  const color = code >= 200 && code < 300 ? 'text-emerald-600 bg-emerald-50' :
    code >= 300 && code < 400 ? 'text-amber-600 bg-amber-50' :
    'text-red-600 bg-red-50';
  return <span className={`text-sm font-medium px-2 py-0.5 rounded ${color}`}>{code}</span>;
}

function IssueBar({ snapshot, label, total }: { snapshot: UrlPageSnapshot; label: string; total: number }) {
  const cats: { key: ScoreCategory; label: string }[] = [
    { key: 'seo', label: 'SEO' },
    { key: 'accessibility', label: 'A11y' },
    { key: 'security', label: 'Sec' },
    { key: 'performance', label: 'Perf' },
    { key: 'content', label: 'Content' },
    { key: 'structuredData', label: 'Schema' },
  ];

  const maxWidth = Math.max(total, 1);

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className="text-xs text-slate-500">{total} issues</span>
      </div>
      <div className="flex h-6 rounded-full overflow-hidden bg-slate-100">
        {cats.map(cat => {
          const count = snapshot.issueCountByCategory[cat.key];
          if (count === 0) return null;
          const pct = (count / maxWidth) * 100;
          return (
            <div
              key={cat.key}
              className="h-full flex items-center justify-center text-[10px] font-medium text-white relative group"
              style={{ width: `${pct}%`, backgroundColor: CATEGORY_COLORS[cat.key], minWidth: count > 0 ? '20px' : '0' }}
              title={`${cat.label}: ${count}`}
            >
              {pct > 8 && count}
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
        {cats.map(cat => {
          const count = snapshot.issueCountByCategory[cat.key];
          if (count === 0) return null;
          return (
            <span key={cat.key} className="inline-flex items-center gap-1 text-xs text-slate-500">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[cat.key] }} />
              {cat.label}: {count}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function StructuredDataSection({ a, b }: { a: UrlPageSnapshot; b: UrlPageSnapshot }) {
  const sdA = a.structuredDataDetail;
  const sdB = b.structuredDataDetail;

  const allSchemaTypes = useMemo(() => {
    const all = new Set([...sdA.detectedSchemaTypes, ...sdB.detectedSchemaTypes]);
    return Array.from(all).sort();
  }, [sdA.detectedSchemaTypes, sdB.detectedSchemaTypes]);

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-xs text-slate-500 uppercase tracking-wider">
              <th className="text-left pb-3 font-medium">Feature</th>
              <th className="text-center pb-3 font-medium w-28">URL A</th>
              <th className="text-center pb-3 font-medium w-28">URL B</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <tr>
              <td className="py-3 text-sm text-slate-700">JSON-LD Blocks</td>
              <td className="py-3 text-center text-sm font-medium text-slate-700">{sdA.jsonLdCount}</td>
              <td className="py-3 text-center text-sm font-medium text-slate-700">{sdB.jsonLdCount}</td>
            </tr>
            <tr>
              <td className="py-3 text-sm text-slate-700">Open Graph</td>
              <td className="py-3 text-center">
                {sdA.hasOpenGraph ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /> : <XCircle className="w-4 h-4 text-red-400 mx-auto" />}
              </td>
              <td className="py-3 text-center">
                {sdB.hasOpenGraph ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /> : <XCircle className="w-4 h-4 text-red-400 mx-auto" />}
              </td>
            </tr>
            <tr>
              <td className="py-3 text-sm text-slate-700">Twitter Card</td>
              <td className="py-3 text-center">
                {sdA.hasTwitterCard ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /> : <XCircle className="w-4 h-4 text-red-400 mx-auto" />}
              </td>
              <td className="py-3 text-center">
                {sdB.hasTwitterCard ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /> : <XCircle className="w-4 h-4 text-red-400 mx-auto" />}
              </td>
            </tr>
            <tr>
              <td className="py-3 text-sm text-slate-700">Detected Page Type</td>
              <td className="py-3 text-center text-sm text-slate-700">{sdA.detectedPageType || '--'}</td>
              <td className="py-3 text-center text-sm text-slate-700">{sdB.detectedPageType || '--'}</td>
            </tr>
            <tr>
              <td className="py-3 text-sm text-slate-700">Structured Data Issues</td>
              <td className="py-3 text-center text-sm font-medium text-slate-700">{sdA.structuredDataIssues}</td>
              <td className="py-3 text-center text-sm font-medium text-slate-700">{sdB.structuredDataIssues}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {allSchemaTypes.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-slate-700 mb-2">Detected Schema Types</h3>
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="grid grid-cols-3 gap-2 text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 pb-2 border-b border-slate-200">
              <span>Type</span>
              <span className="text-center">URL A</span>
              <span className="text-center">URL B</span>
            </div>
            {allSchemaTypes.map(type => {
              const inA = sdA.detectedSchemaTypes.includes(type);
              const inB = sdB.detectedSchemaTypes.includes(type);
              return (
                <div key={type} className="grid grid-cols-3 gap-2 py-1.5 items-center">
                  <span className="text-sm text-slate-700">{type}</span>
                  <span className="text-center">
                    {inA ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /> : <XCircle className="w-4 h-4 text-slate-300 mx-auto" />}
                  </span>
                  <span className="text-center">
                    {inB ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /> : <XCircle className="w-4 h-4 text-slate-300 mx-auto" />}
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

function EvidenceSection({ evidenceA, evidenceB }: {
  evidenceA: Array<{ pillar: string; type: string; label: string; text: string }>;
  evidenceB: Array<{ pillar: string; type: string; label: string; text: string }>;
}) {
  const [expanded, setExpanded] = useState(false);
  const pillars = ['Experience', 'Expertise', 'Authoritativeness', 'Trustworthiness'];

  const groupByPillar = (items: typeof evidenceA) => {
    const grouped: Record<string, typeof evidenceA> = {};
    for (const item of items) {
      const key = item.pillar || 'Other';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    }
    return grouped;
  };

  const groupedA = groupByPillar(evidenceA);
  const groupedB = groupByPillar(evidenceB);

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 mb-3"
      >
        {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        Evidence Details
        <span className="text-xs text-slate-500 font-normal">
          ({evidenceA.length} vs {evidenceB.length} items)
        </span>
      </button>

      {expanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-xs font-medium text-indigo-600 uppercase tracking-wider mb-2">URL A</div>
            {pillars.map(pillar => {
              const items = groupedA[pillar] || [];
              if (items.length === 0) return null;
              return (
                <div key={pillar} className="mb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-slate-700">{pillar}</span>
                    <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{items.length}</span>
                  </div>
                  <div className="space-y-1">
                    {items.map((item, idx) => (
                      <div key={idx} className="bg-slate-50 rounded px-3 py-2 text-xs">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="font-medium text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">{item.type}</span>
                          <span className="font-medium text-slate-700">{item.label}</span>
                        </div>
                        <p className="text-slate-500 line-clamp-2">{item.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {evidenceA.length === 0 && <p className="text-xs text-slate-500">No evidence items found</p>}
          </div>
          <div>
            <div className="text-xs font-medium text-emerald-600 uppercase tracking-wider mb-2">URL B</div>
            {pillars.map(pillar => {
              const items = groupedB[pillar] || [];
              if (items.length === 0) return null;
              return (
                <div key={pillar} className="mb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-slate-700">{pillar}</span>
                    <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{items.length}</span>
                  </div>
                  <div className="space-y-1">
                    {items.map((item, idx) => (
                      <div key={idx} className="bg-slate-50 rounded px-3 py-2 text-xs">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">{item.type}</span>
                          <span className="font-medium text-slate-700">{item.label}</span>
                        </div>
                        <p className="text-slate-500 line-clamp-2">{item.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {evidenceB.length === 0 && <p className="text-xs text-slate-500">No evidence items found</p>}
          </div>
        </div>
      )}
    </div>
  );
}

function NuggetsSection({ nuggetsA, nuggetsB }: {
  nuggetsA: Array<{ text: string; type: string; wordCount: number }>;
  nuggetsB: Array<{ text: string; type: string; wordCount: number }>;
}) {
  const [expanded, setExpanded] = useState(false);

  const getTypesUsed = (nuggets: typeof nuggetsA) => {
    const types = new Set(nuggets.map(n => n.type));
    return Array.from(types);
  };

  const avgWordCount = (nuggets: typeof nuggetsA) => {
    if (nuggets.length === 0) return 0;
    return Math.round(nuggets.reduce((s, n) => s + n.wordCount, 0) / nuggets.length);
  };

  const typeBadgeColor: Record<string, string> = {
    definition: 'bg-blue-100 text-blue-700',
    statistic: 'bg-purple-100 text-purple-700',
    'how-to': 'bg-amber-100 text-amber-700',
    fact: 'bg-emerald-100 text-emerald-700',
    quote: 'bg-pink-100 text-pink-700',
    comparison: 'bg-orange-100 text-orange-700',
    list: 'bg-cyan-100 text-cyan-700',
  };

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 mb-3"
      >
        {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        AI-Extractable Nuggets
        <span className="text-xs text-slate-500 font-normal">
          ({nuggetsA.length} vs {nuggetsB.length} nuggets)
        </span>
      </button>

      {expanded && (
        <div>
          {/* Summary row */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-xs text-slate-500 uppercase tracking-wider pt-1">Metric</div>
            <div className="text-center">
              <span className="text-xs font-medium text-indigo-600">URL A</span>
            </div>
            <div className="text-center">
              <span className="text-xs font-medium text-emerald-600">URL B</span>
            </div>

            <span className="text-sm text-slate-600">Total Nuggets</span>
            <span className="text-center text-sm font-medium text-slate-700">{nuggetsA.length}</span>
            <span className="text-center text-sm font-medium text-slate-700">{nuggetsB.length}</span>

            <span className="text-sm text-slate-600">Types Found</span>
            <span className="text-center text-sm font-medium text-slate-700">{getTypesUsed(nuggetsA).length}</span>
            <span className="text-center text-sm font-medium text-slate-700">{getTypesUsed(nuggetsB).length}</span>

            <span className="text-sm text-slate-600">Avg Word Count</span>
            <span className="text-center text-sm font-medium text-slate-700">{avgWordCount(nuggetsA)}</span>
            <span className="text-center text-sm font-medium text-slate-700">{avgWordCount(nuggetsB)}</span>
          </div>

          {/* Nuggets side-by-side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-medium text-indigo-600 uppercase tracking-wider mb-2">URL A Nuggets</div>
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {nuggetsA.length === 0 ? (
                  <p className="text-xs text-slate-500">No nuggets found</p>
                ) : nuggetsA.map((nugget, idx) => (
                  <div key={idx} className="bg-slate-50 rounded px-3 py-2 text-xs">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={`font-medium px-1.5 py-0.5 rounded ${typeBadgeColor[nugget.type] || 'bg-slate-100 text-slate-600'}`}>
                        {nugget.type}
                      </span>
                      <span className="text-slate-500">{nugget.wordCount} words</span>
                    </div>
                    <p className="text-slate-600 line-clamp-2">{nugget.text}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-emerald-600 uppercase tracking-wider mb-2">URL B Nuggets</div>
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {nuggetsB.length === 0 ? (
                  <p className="text-xs text-slate-500">No nuggets found</p>
                ) : nuggetsB.map((nugget, idx) => (
                  <div key={idx} className="bg-slate-50 rounded px-3 py-2 text-xs">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={`font-medium px-1.5 py-0.5 rounded ${typeBadgeColor[nugget.type] || 'bg-slate-100 text-slate-600'}`}>
                        {nugget.type}
                      </span>
                      <span className="text-slate-500">{nugget.wordCount} words</span>
                    </div>
                    <p className="text-slate-600 line-clamp-2">{nugget.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FindingsDiffView({ diff, labelA, labelB }: {
  diff: { uniqueToA: UrlFindingItem[]; uniqueToB: UrlFindingItem[]; shared: UrlFindingItem[]; summaryA: Record<string, number>; summaryB: Record<string, number> };
  labelA: string;
  labelB: string;
}) {
  const [activeTab, setActiveTab] = useState<'uniqueA' | 'uniqueB' | 'shared'>('uniqueA');

  const tabs = [
    { id: 'uniqueA' as const, label: `Only ${labelA}`, count: diff.uniqueToA.length, color: 'text-indigo-600' },
    { id: 'uniqueB' as const, label: `Only ${labelB}`, count: diff.uniqueToB.length, color: 'text-emerald-600' },
    { id: 'shared' as const, label: 'Shared', count: diff.shared.length, color: 'text-slate-600' },
  ];

  const activeFindings = activeTab === 'uniqueA' ? diff.uniqueToA :
    activeTab === 'uniqueB' ? diff.uniqueToB : diff.shared;

  return (
    <div>
      {/* Severity summary */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-indigo-50/50 rounded-lg p-3">
          <div className="text-xs font-medium text-indigo-600 mb-1.5">URL A Findings</div>
          <div className="flex gap-3 text-xs">
            {diff.summaryA.critical > 0 && <span className="text-red-600">{diff.summaryA.critical} critical</span>}
            {diff.summaryA.serious > 0 && <span className="text-orange-600">{diff.summaryA.serious} serious</span>}
            {diff.summaryA.moderate > 0 && <span className="text-amber-600">{diff.summaryA.moderate} moderate</span>}
            {diff.summaryA.minor > 0 && <span className="text-sky-600">{diff.summaryA.minor} minor</span>}
          </div>
        </div>
        <div className="bg-emerald-50/50 rounded-lg p-3">
          <div className="text-xs font-medium text-emerald-600 mb-1.5">URL B Findings</div>
          <div className="flex gap-3 text-xs">
            {diff.summaryB.critical > 0 && <span className="text-red-600">{diff.summaryB.critical} critical</span>}
            {diff.summaryB.serious > 0 && <span className="text-orange-600">{diff.summaryB.serious} serious</span>}
            {diff.summaryB.moderate > 0 && <span className="text-amber-600">{diff.summaryB.moderate} moderate</span>}
            {diff.summaryB.minor > 0 && <span className="text-sky-600">{diff.summaryB.minor} minor</span>}
          </div>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 mb-4 bg-slate-100 rounded-lg p-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 text-sm font-medium px-3 py-2 rounded-md transition-colors ${
              activeTab === tab.id ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label} <span className="text-xs text-slate-500 ml-1">({tab.count})</span>
          </button>
        ))}
      </div>

      {/* Findings list */}
      {activeFindings.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-4">No findings in this category</p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {activeFindings.map((finding, idx) => (
            <FindingRow key={idx} finding={finding} />
          ))}
        </div>
      )}
    </div>
  );
}

function FindingRow({ finding }: { finding: UrlFindingItem }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-slate-200 rounded-lg">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-slate-50/50 transition-colors"
      >
        <SeverityBadge severity={finding.severity} />
        <CategoryBadge category={finding.category} />
        <span className="text-sm font-medium text-slate-700 flex-1 truncate">{finding.ruleName}</span>
        {expanded ? <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-500 flex-shrink-0" />}
      </button>
      {expanded && (
        <div className="px-3 pb-3 text-sm border-t border-slate-100 pt-2">
          <p className="text-slate-600 mb-2">{finding.message}</p>
          {finding.recommendation && (
            <div className="flex items-start gap-2 text-indigo-700 bg-indigo-50 rounded-md px-3 py-2 text-xs">
              <Lightbulb className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>{finding.recommendation}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function KeywordCard({ snapshot, label }: { snapshot: UrlPageSnapshot; label: string }) {
  const kw = snapshot.keyword;

  if (!kw) {
    return (
      <div className="bg-slate-50 rounded-lg p-4">
        <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">{label}</div>
        <p className="text-sm text-slate-500">No keyword data available</p>
      </div>
    );
  }

  const placements = [
    { label: 'Title', value: kw.inTitle },
    { label: 'H1', value: kw.inH1 },
    { label: 'First Paragraph', value: kw.inFirstParagraph },
    { label: 'Meta Description', value: kw.inMetaDescription },
    { label: 'URL', value: kw.inUrl },
    { label: 'Alt Text', value: kw.inAltText },
    { label: 'Last Paragraph', value: kw.inLastParagraph },
  ];

  const placementCount = placements.filter(p => p.value).length;
  const densityOptimal = kw.density >= 1 && kw.density <= 2;

  return (
    <div className="bg-slate-50 rounded-lg p-4">
      <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">{label}</div>
      <div className="mb-3">
        <span className="text-sm font-medium text-slate-900">"{kw.keyword}"</span>
        <span className="text-xs text-slate-500 ml-2">({kw.occurrences} occurrences)</span>
      </div>

      <div className="flex items-center gap-3 mb-3">
        <div className="text-xs text-slate-500">Density:</div>
        <span className={`text-sm font-medium ${densityOptimal ? 'text-emerald-600' : kw.isStuffed ? 'text-red-600' : 'text-amber-600'}`}>
          {kw.density.toFixed(1)}%
        </span>
        {kw.isStuffed && (
          <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded">Stuffed</span>
        )}
      </div>

      <div className="text-xs text-slate-500 mb-1">Placements ({placementCount}/7)</div>
      <div className="space-y-1">
        {placements.map(p => (
          <div key={p.label} className="flex items-center gap-2 text-xs">
            {p.value ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <XCircle className="w-3.5 h-3.5 text-slate-300" />
            )}
            <span className={p.value ? 'text-slate-700' : 'text-slate-500'}>{p.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReadabilityRow({ label, valueA, valueB, format, optimal }: {
  label: string;
  valueA: any;
  valueB: any;
  format: (v: any) => string;
  optimal?: string;
}) {
  return (
    <tr>
      <td className="py-3 text-sm text-slate-700">
        {label}
        {optimal && <span className="text-xs text-slate-500 ml-1">(optimal: {optimal})</span>}
      </td>
      <td className="py-3 text-center text-sm font-medium text-slate-700">{format(valueA)}</td>
      <td className="py-3 text-center text-sm font-medium text-slate-700">{format(valueB)}</td>
    </tr>
  );
}
