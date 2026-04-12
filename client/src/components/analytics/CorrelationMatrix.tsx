/**
 * CorrelationMatrix - Heat map grid showing which score categories move together.
 * Calculated entirely on the frontend from score history data.
 */

import { useMemo } from 'react';
import { CATEGORY_LABELS, type ScoreCategory, type ScoreDataPoint } from '../../types/analytics.types';

interface CorrelationMatrixProps {
  scores: ScoreDataPoint[];
  categories?: ScoreCategory[];
}

function pearsonCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 3) return 0;

  const xSlice = x.slice(0, n);
  const ySlice = y.slice(0, n);

  const sumX = xSlice.reduce((a, b) => a + b, 0);
  const sumY = ySlice.reduce((a, b) => a + b, 0);
  const sumXY = xSlice.reduce((a, b, i) => a + b * ySlice[i], 0);
  const sumX2 = xSlice.reduce((a, b) => a + b * b, 0);
  const sumY2 = ySlice.reduce((a, b) => a + b * b, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  if (denominator === 0) return 0;
  return numerator / denominator;
}

function correlationColor(r: number): string {
  const abs = Math.abs(r);
  if (abs >= 0.7) return r > 0 ? '#059669' : '#dc2626';
  if (abs >= 0.4) return r > 0 ? '#10b981' : '#f97316';
  if (abs >= 0.2) return r > 0 ? '#6ee7b7' : '#fdba74';
  return '#e2e8f0';
}

function correlationOpacity(r: number): number {
  return Math.max(0.2, Math.abs(r));
}

export function CorrelationMatrix({
  scores,
  categories = ['seo', 'accessibility', 'security', 'performance', 'content'],
}: CorrelationMatrixProps) {
  const matrix = useMemo(() => {
    // Extract arrays of non-null values per category
    const catValues: Record<string, number[]> = {};
    for (const cat of categories) {
      catValues[cat] = scores.map(s => s[cat]).filter((v): v is number => v !== null);
    }

    // Build correlation matrix
    const result: Record<string, Record<string, number>> = {};
    for (const catA of categories) {
      result[catA] = {};
      for (const catB of categories) {
        if (catA === catB) {
          result[catA][catB] = 1;
        } else {
          // Need to align: only use scores where both are non-null
          const pairs: [number, number][] = [];
          for (const s of scores) {
            const a = s[catA];
            const b = s[catB];
            if (a !== null && b !== null) pairs.push([a, b]);
          }
          if (pairs.length >= 3) {
            result[catA][catB] = pearsonCorrelation(pairs.map(p => p[0]), pairs.map(p => p[1]));
          } else {
            result[catA][catB] = 0;
          }
        }
      }
    }
    return result;
  }, [scores, categories]);

  if (scores.length < 4) {
    return (
      <div className="flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 h-40">
        <p className="text-slate-500 dark:text-slate-400 text-sm">Need 4+ audits for correlation analysis</p>
      </div>
    );
  }

  const shortLabels: Record<string, string> = {
    seo: 'SEO',
    accessibility: 'A11y',
    security: 'Sec',
    performance: 'Perf',
    content: 'Cnt',
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
      <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Score Correlations</h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Which categories move together across audits</p>

      <div className="overflow-x-auto">
        <table className="mx-auto">
          <thead>
            <tr>
              <th className="w-12" />
              {categories.map(cat => (
                <th key={cat} className="px-1 py-1 text-[10px] font-medium text-slate-500 text-center w-12">
                  {shortLabels[cat] || CATEGORY_LABELS[cat]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {categories.map(catA => (
              <tr key={catA}>
                <td className="pr-2 text-[10px] font-medium text-slate-500 text-right">
                  {shortLabels[catA] || CATEGORY_LABELS[catA]}
                </td>
                {categories.map(catB => {
                  const r = matrix[catA]?.[catB] ?? 0;
                  const isDiagonal = catA === catB;
                  return (
                    <td key={catB} className="px-1 py-1">
                      <div
                        className="w-10 h-10 rounded flex items-center justify-center text-[10px] font-medium transition-transform hover:scale-110"
                        style={{
                          backgroundColor: isDiagonal ? '#6366f115' : correlationColor(r),
                          opacity: isDiagonal ? 1 : correlationOpacity(r),
                          color: isDiagonal ? '#6366f1' : (Math.abs(r) >= 0.4 ? '#fff' : '#475569'),
                        }}
                        title={`${CATEGORY_LABELS[catA]} vs ${CATEGORY_LABELS[catB]}: ${r.toFixed(2)}`}
                      >
                        {isDiagonal ? '1.0' : r.toFixed(1)}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-center gap-3 mt-3 text-[10px] text-slate-500">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ backgroundColor: '#059669' }} /> Strong +</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ backgroundColor: '#6ee7b7' }} /> Weak +</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ backgroundColor: '#e2e8f0' }} /> None</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ backgroundColor: '#fdba74' }} /> Weak -</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ backgroundColor: '#dc2626' }} /> Strong -</span>
      </div>
    </div>
  );
}
