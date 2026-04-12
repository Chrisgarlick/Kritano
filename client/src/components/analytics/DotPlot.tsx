/**
 * DotPlot - Strip chart showing score distribution across sites per category.
 * One row per category, one dot per site positioned on the 0-100 scale.
 */

import { CATEGORY_LABELS, getScoreColor, type ScoreCategory } from '../../types/analytics.types';

interface SiteScore {
  id: string;
  name: string;
  scores: Partial<Record<ScoreCategory, number | null>>;
}

interface DotPlotProps {
  sites: SiteScore[];
  categories?: ScoreCategory[];
  onDotClick?: (siteId: string) => void;
}

export function DotPlot({
  sites,
  categories = ['seo', 'accessibility', 'security', 'performance', 'content'],
  onDotClick,
}: DotPlotProps) {
  if (sites.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
      <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">Score Distribution</h3>

      <div className="space-y-3">
        {categories.map(cat => {
          const dots = sites
            .map(s => ({ id: s.id, name: s.name, score: s.scores[cat] ?? null }))
            .filter(d => d.score !== null) as { id: string; name: string; score: number }[];

          return (
            <div key={cat} className="flex items-center gap-3">
              {/* Label */}
              <div className="w-16 text-xs font-medium text-slate-600 dark:text-slate-400 text-right flex-shrink-0">
                {CATEGORY_LABELS[cat]}
              </div>

              {/* Track */}
              <div className="flex-1 relative h-6">
                {/* Background track */}
                <div className="absolute inset-y-0 left-0 right-0 flex items-center">
                  <div className="w-full h-px bg-slate-200 dark:bg-slate-700" />
                </div>

                {/* Zone indicators */}
                <div className="absolute inset-y-0 left-0 right-0 flex items-center pointer-events-none">
                  {/* Poor zone */}
                  <div className="absolute h-1 rounded-full bg-red-200/50 dark:bg-red-900/20" style={{ left: '0%', width: '50%' }} />
                  {/* Good zone */}
                  <div className="absolute h-1 rounded-full bg-emerald-200/50 dark:bg-emerald-900/20" style={{ left: '80%', width: '20%' }} />
                </div>

                {/* Dots */}
                {dots.map(dot => (
                  <button
                    key={dot.id}
                    onClick={() => onDotClick?.(dot.id)}
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 group z-10"
                    style={{ left: `${dot.score}%` }}
                    title={`${dot.name}: ${dot.score}`}
                  >
                    <div
                      className="w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-800 shadow-sm transition-transform group-hover:scale-150"
                      style={{ backgroundColor: getScoreColor(dot.score) }}
                    />

                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block">
                      <div className="bg-slate-900 dark:bg-slate-700 text-white text-[10px] rounded px-2 py-1 whitespace-nowrap shadow-lg">
                        {dot.name}: {dot.score}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Scale markers */}
              <div className="w-6 text-[10px] text-slate-400 text-right flex-shrink-0">100</div>
            </div>
          );
        })}
      </div>

      {/* Bottom scale */}
      <div className="flex items-center gap-3 mt-2">
        <div className="w-16" />
        <div className="flex-1 flex justify-between text-[10px] text-slate-400">
          <span>0</span>
          <span>25</span>
          <span>50</span>
          <span>75</span>
          <span>100</span>
        </div>
        <div className="w-6" />
      </div>
    </div>
  );
}
