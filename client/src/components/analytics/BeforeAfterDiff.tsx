/**
 * BeforeAfterDiff — Visual score diff between two audits.
 * Two overlapping bars per category with delta clearly shown.
 */

import { CATEGORY_LABELS, getScoreColor, type ScoreCategory } from '../../types/analytics.types';

interface BeforeAfterDiffProps {
  before: Partial<Record<ScoreCategory, number | null>>;
  after: Partial<Record<ScoreCategory, number | null>>;
  beforeLabel?: string;
  afterLabel?: string;
  categories?: ScoreCategory[];
}

export function BeforeAfterDiff({
  before,
  after,
  beforeLabel = 'Before',
  afterLabel = 'After',
  categories = ['seo', 'accessibility', 'security', 'performance', 'content', 'structuredData'],
}: BeforeAfterDiffProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">Score Changes</h3>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <span className="w-3 h-1.5 rounded-full bg-slate-300" /> {beforeLabel}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-1.5 rounded-full bg-indigo-500" /> {afterLabel}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {categories.map(cat => {
          const beforeVal = before[cat] ?? null;
          const afterVal = after[cat] ?? null;
          if (beforeVal === null && afterVal === null) return null;

          const delta = beforeVal !== null && afterVal !== null ? afterVal - beforeVal : null;
          const isImprovement = delta !== null && delta > 0;
          const isRegression = delta !== null && delta < 0;

          return (
            <div key={cat} className="flex items-center gap-3">
              {/* Label */}
              <div className="w-20 text-xs font-medium text-slate-600 dark:text-slate-400 text-right flex-shrink-0">
                {CATEGORY_LABELS[cat]}
              </div>

              {/* Bars */}
              <div className="flex-1 relative h-6">
                {/* Before bar (grey, behind) */}
                {beforeVal !== null && (
                  <div
                    className="absolute top-0 left-0 h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 transition-all"
                    style={{ width: `${beforeVal}%` }}
                  />
                )}

                {/* After bar (coloured, in front) */}
                {afterVal !== null && (
                  <div
                    className="absolute top-3 left-0 h-2.5 rounded-full transition-all"
                    style={{
                      width: `${afterVal}%`,
                      backgroundColor: getScoreColor(afterVal),
                    }}
                  />
                )}
              </div>

              {/* Scores + delta */}
              <div className="flex items-center gap-2 flex-shrink-0 w-28 justify-end">
                <span className="text-xs text-slate-400 w-6 text-right">
                  {beforeVal ?? '-'}
                </span>
                <span className="text-xs text-slate-400">&rarr;</span>
                <span className="text-xs font-semibold w-6 text-right" style={{ color: afterVal !== null ? getScoreColor(afterVal) : '#94a3b8' }}>
                  {afterVal ?? '-'}
                </span>
                {delta !== null && (
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                    isImprovement
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                      : isRegression
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}>
                    {delta > 0 ? '+' : ''}{delta}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
