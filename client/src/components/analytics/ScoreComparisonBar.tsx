import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { AuditSummary, ScoreDelta, ScoreCategory } from '../../types/analytics.types';
import { CATEGORY_LABELS, getScoreColor } from '../../types/analytics.types';

interface ScoreComparisonBarProps {
  audits: AuditSummary[];
  scoreDeltas: ScoreDelta[];
}

const CATEGORIES: ScoreCategory[] = ['seo', 'accessibility', 'security', 'performance', 'content', 'structuredData'];

function DeltaIndicator({ delta }: { delta: number | null }) {
  if (delta === null) {
    return <span className="text-slate-400 text-sm">N/A</span>;
  }

  if (delta > 0) {
    return (
      <span className="inline-flex items-center gap-1 text-emerald-600 text-sm font-medium">
        <TrendingUp className="w-4 h-4" />
        +{delta}
      </span>
    );
  }

  if (delta < 0) {
    return (
      <span className="inline-flex items-center gap-1 text-red-600 text-sm font-medium">
        <TrendingDown className="w-4 h-4" />
        {delta}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-slate-400 text-sm">
      <Minus className="w-4 h-4" />
      0
    </span>
  );
}

function ScoreBar({ score, maxWidth = 100 }: { score: number | null; maxWidth?: number }) {
  if (score === null) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-6 bg-slate-100 rounded" style={{ width: maxWidth }} />
        <span className="text-sm text-slate-400 font-medium w-8">N/A</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="h-6 bg-slate-100 rounded overflow-hidden" style={{ width: maxWidth }}>
        <div
          className="h-full rounded transition-all duration-500"
          style={{
            width: `${score}%`,
            backgroundColor: getScoreColor(score),
          }}
        />
      </div>
      <span
        className="text-sm font-medium w-8"
        style={{ color: getScoreColor(score) }}
      >
        {score}
      </span>
    </div>
  );
}

export function ScoreComparisonBar({ audits, scoreDeltas }: ScoreComparisonBarProps) {
  if (audits.length < 2) {
    return (
      <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-center text-slate-500">
        Select at least 2 audits to compare
      </div>
    );
  }

  // Get delta for consecutive audits
  const getDelta = (category: ScoreCategory, fromIdx: number, toIdx: number) => {
    const delta = scoreDeltas.find(
      d => d.from === audits[fromIdx].id && d.to === audits[toIdx].id
    );
    return delta?.deltas[category] ?? null;
  };

  return (
    <div className="space-y-6">
      {CATEGORIES.map(category => (
        <div key={category} className="space-y-3">
          <h4 className="text-sm font-medium text-slate-700">
            {CATEGORY_LABELS[category]}
          </h4>
          <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${audits.length}, 1fr)` }}>
            {audits.map((audit, idx) => (
              <div key={audit.id} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 truncate max-w-[80%]">
                    {new Date(audit.completedAt).toLocaleDateString()}
                  </span>
                  {idx > 0 && (
                    <DeltaIndicator delta={getDelta(category, idx - 1, idx)} />
                  )}
                </div>
                <ScoreBar score={audit.scores[category]} maxWidth={120} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Simpler horizontal comparison view
export function ScoreComparisonTable({ audits, scoreDeltas }: ScoreComparisonBarProps) {
  if (audits.length < 2) {
    return (
      <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-center text-slate-500">
        Select at least 2 audits to compare
      </div>
    );
  }

  const getDelta = (category: ScoreCategory) => {
    if (scoreDeltas.length === 0) return null;
    // Get delta from first to last audit
    const firstAudit = audits[0];
    const lastAudit = audits[audits.length - 1];
    const fromScore = firstAudit.scores[category];
    const toScore = lastAudit.scores[category];
    if (fromScore === null || toScore === null) return null;
    return toScore - fromScore;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">
              Category
            </th>
            {audits.map(audit => (
              <th key={audit.id} className="text-center py-3 px-4 text-sm font-medium text-slate-600">
                <div className="truncate max-w-[100px]">{audit.siteName}</div>
                <div className="text-xs text-slate-400 font-normal">
                  {new Date(audit.completedAt).toLocaleDateString()}
                </div>
              </th>
            ))}
            <th className="text-center py-3 px-4 text-sm font-medium text-slate-600">
              Change
            </th>
          </tr>
        </thead>
        <tbody>
          {CATEGORIES.map(category => (
            <tr key={category} className="border-b border-slate-100">
              <td className="py-3 px-4 text-sm text-slate-700">
                {CATEGORY_LABELS[category]}
              </td>
              {audits.map(audit => (
                <td key={audit.id} className="py-3 px-4 text-center">
                  <span
                    className="text-lg font-semibold"
                    style={{ color: getScoreColor(audit.scores[category]) }}
                  >
                    {audit.scores[category] ?? 'N/A'}
                  </span>
                </td>
              ))}
              <td className="py-3 px-4 text-center">
                <DeltaIndicator delta={getDelta(category)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
