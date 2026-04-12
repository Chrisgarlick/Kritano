/**
 * ScoreForecast - Linear regression trend projection for score categories.
 * Shows a dashed line extending the trend into the future.
 * Only shown when R-squared is reasonable (>0.3) and there are 4+ data points.
 */

import { useMemo } from 'react';
import type { ScoreDataPoint, ScoreCategory } from '../../types/analytics.types';
import { CATEGORY_LABELS, CATEGORY_COLORS, getScoreColor } from '../../types/analytics.types';

interface ScoreForecastProps {
  scores: ScoreDataPoint[];
  categories?: ScoreCategory[];
}

interface Forecast {
  category: ScoreCategory;
  currentScore: number;
  projectedScore: number;
  auditsTo90: number | null;
  trend: 'improving' | 'declining' | 'stable';
  rSquared: number;
  slope: number;
}

function linearRegression(values: number[]): { slope: number; intercept: number; rSquared: number } {
  const n = values.length;
  if (n < 3) return { slope: 0, intercept: values[0] || 0, rSquared: 0 };

  const xs = values.map((_, i) => i);
  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = values.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((a, x, i) => a + x * values[i], 0);
  const sumX2 = xs.reduce((a, x) => a + x * x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // R-squared
  const meanY = sumY / n;
  const ssRes = values.reduce((a, y, i) => a + (y - (intercept + slope * i)) ** 2, 0);
  const ssTot = values.reduce((a, y) => a + (y - meanY) ** 2, 0);
  const rSquared = ssTot === 0 ? 0 : 1 - ssRes / ssTot;

  return { slope, intercept, rSquared };
}

export function ScoreForecast({
  scores,
  categories = ['seo', 'accessibility', 'security', 'performance', 'content'],
}: ScoreForecastProps) {
  const forecasts = useMemo<Forecast[]>(() => {
    const result: Forecast[] = [];

    for (const cat of categories) {
      const values = scores.map(s => s[cat]).filter((v): v is number => v !== null);
      if (values.length < 4) continue;

      const { slope, intercept, rSquared } = linearRegression(values);
      if (rSquared < 0.3) continue; // Not enough signal

      const currentScore = values[values.length - 1];
      const projectedScore = Math.min(100, Math.max(0, Math.round(intercept + slope * (values.length + 2))));

      let auditsTo90: number | null = null;
      if (slope > 0.5 && currentScore < 90) {
        auditsTo90 = Math.ceil((90 - currentScore) / slope);
        if (auditsTo90 > 50) auditsTo90 = null; // Too far out
      }

      result.push({
        category: cat,
        currentScore,
        projectedScore,
        auditsTo90,
        trend: slope > 0.5 ? 'improving' : slope < -0.5 ? 'declining' : 'stable',
        rSquared,
        slope,
      });
    }

    return result.sort((a, b) => Math.abs(b.slope) - Math.abs(a.slope));
  }, [scores, categories]);

  if (forecasts.length === 0) {
    return null; // Don't show if no reliable forecasts
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
      <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Score Forecast</h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Projected trend based on recent audit history</p>

      <div className="space-y-3">
        {forecasts.map(f => {
          const delta = f.projectedScore - f.currentScore;
          const color = CATEGORY_COLORS[f.category];

          return (
            <div key={f.category} className="flex items-center gap-3">
              {/* Category label */}
              <div className="w-20 text-xs font-medium text-right flex-shrink-0" style={{ color }}>
                {CATEGORY_LABELS[f.category]}
              </div>

              {/* Current -> Projected visual */}
              <div className="flex-1 flex items-center gap-2">
                <span className="text-sm font-semibold w-8 text-right" style={{ color: getScoreColor(f.currentScore) }}>
                  {f.currentScore}
                </span>

                {/* Arrow track */}
                <div className="flex-1 relative h-4">
                  <div className="absolute inset-y-0 left-0 right-0 flex items-center">
                    <div className="w-full h-px" style={{ backgroundColor: color, opacity: 0.3 }} />
                  </div>
                  {/* Dashed projection */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 h-0.5"
                    style={{
                      left: `${f.currentScore}%`,
                      width: `${Math.abs(f.projectedScore - f.currentScore)}%`,
                      borderTop: `2px dashed ${color}`,
                      opacity: 0.6,
                    }}
                  />
                </div>

                <span className="text-sm font-semibold w-8" style={{ color: getScoreColor(f.projectedScore) }}>
                  {f.projectedScore}
                </span>

                {/* Delta badge */}
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                  delta > 0
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                    : delta < 0
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}>
                  {delta > 0 ? '+' : ''}{delta}
                </span>
              </div>

              {/* Audits to 90 */}
              <div className="w-24 text-right flex-shrink-0">
                {f.auditsTo90 !== null ? (
                  <span className="text-[10px] text-slate-500">~{f.auditsTo90} audits to 90</span>
                ) : f.currentScore >= 90 ? (
                  <span className="text-[10px] text-emerald-600">At target</span>
                ) : (
                  <span className="text-[10px] text-slate-400">-</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-slate-400 mt-3">Based on linear regression of last {scores.length} audits. Projection is ~3 audits ahead.</p>
    </div>
  );
}
