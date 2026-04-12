/**
 * WaterfallChart - Shows issue flow between audits (fixed, new, remaining).
 * Custom SVG implementation for clean visual storytelling.
 */

import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';

interface WaterfallStep {
  auditId: string;
  completedAt: string;
  totalIssues: number;
  fixed: number;
  introduced: number;
}

interface WaterfallChartProps {
  steps: WaterfallStep[];
  height?: number;
  onBarClick?: (auditId: string) => void;
}

export function WaterfallChart({ steps, height = 280, onBarClick }: WaterfallChartProps) {
  const chartData = useMemo(() => {
    if (steps.length === 0) return null;

    const maxIssues = Math.max(...steps.map(s => s.totalIssues), 1);
    const padding = { top: 20, right: 20, bottom: 40, left: 50 };
    const barWidth = Math.min(40, (600 - padding.left - padding.right) / steps.length - 8);

    return { maxIssues, padding, barWidth };
  }, [steps]);

  if (!chartData || steps.length === 0) {
    return (
      <div className="flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700" style={{ height }}>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Run multiple audits to see the issue waterfall</p>
      </div>
    );
  }

  const { maxIssues, padding, barWidth } = chartData;
  const innerH = height - padding.top - padding.bottom;
  const innerW = 600 - padding.left - padding.right;
  const stepWidth = innerW / steps.length;

  const scaleY = (val: number) => padding.top + innerH - (val / maxIssues) * innerH;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
      <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Issue Waterfall</h3>
      <svg viewBox={`0 0 600 ${height}`} className="w-full" style={{ maxHeight: height }}>
        {/* Y-axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map(pct => {
          const val = Math.round(maxIssues * pct);
          const y = scaleY(val);
          return (
            <g key={pct}>
              <line x1={padding.left} y1={y} x2={600 - padding.right} y2={y} stroke="#e2e8f0" strokeDasharray="2 2" />
              <text x={padding.left - 8} y={y + 4} textAnchor="end" className="text-[10px] fill-slate-400">{val}</text>
            </g>
          );
        })}

        {/* Bars */}
        {steps.map((step, i) => {
          const x = padding.left + i * stepWidth + (stepWidth - barWidth) / 2;
          const barH = (step.totalIssues / maxIssues) * innerH;
          const y = scaleY(step.totalIssues);

          // Split bar: green (fixed portion from previous) + red (new) + grey (remaining)
          const fixedH = step.fixed > 0 ? (step.fixed / maxIssues) * innerH : 0;
          const newH = step.introduced > 0 ? (step.introduced / maxIssues) * innerH : 0;

          return (
            <g
              key={step.auditId}
              onClick={() => onBarClick?.(step.auditId)}
              className={onBarClick ? 'cursor-pointer' : ''}
            >
              {/* Main bar (total issues) */}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barH}
                rx={3}
                fill="#6366f1"
                opacity={0.8}
                className="transition-opacity hover:opacity-100"
              />

              {/* Fixed indicator (green pip above) */}
              {step.fixed > 0 && i > 0 && (
                <g>
                  <rect
                    x={x - 2}
                    y={y - fixedH - 4}
                    width={barWidth / 3}
                    height={Math.max(fixedH, 4)}
                    rx={2}
                    fill="#059669"
                    opacity={0.7}
                  />
                  <text x={x + barWidth / 6 - 2} y={y - fixedH - 8} textAnchor="middle" className="text-[9px] fill-emerald-600 dark:fill-emerald-400 font-medium">
                    -{step.fixed}
                  </text>
                </g>
              )}

              {/* New indicator (red pip above) */}
              {step.introduced > 0 && i > 0 && (
                <g>
                  <rect
                    x={x + barWidth - barWidth / 3 + 2}
                    y={y - newH - 4}
                    width={barWidth / 3}
                    height={Math.max(newH, 4)}
                    rx={2}
                    fill="#dc2626"
                    opacity={0.7}
                  />
                  <text x={x + barWidth - barWidth / 6 + 2} y={y - newH - 8} textAnchor="middle" className="text-[9px] fill-red-600 dark:fill-red-400 font-medium">
                    +{step.introduced}
                  </text>
                </g>
              )}

              {/* Total label on bar */}
              <text x={x + barWidth / 2} y={y - 4} textAnchor="middle" className="text-[11px] fill-slate-700 dark:fill-slate-300 font-semibold">
                {step.totalIssues}
              </text>

              {/* Date label */}
              <text x={x + barWidth / 2} y={height - 10} textAnchor="middle" className="text-[10px] fill-slate-500">
                {format(parseISO(step.completedAt), 'MMM d')}
              </text>
            </g>
          );
        })}

        {/* Connector lines between bars */}
        {steps.slice(1).map((step, i) => {
          const prevStep = steps[i];
          const x1 = padding.left + i * stepWidth + (stepWidth + barWidth) / 2;
          const x2 = padding.left + (i + 1) * stepWidth + (stepWidth - barWidth) / 2;
          const y1 = scaleY(prevStep.totalIssues);
          const y2 = scaleY(step.totalIssues);
          return (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#94a3b8" strokeDasharray="4 2" strokeWidth={1} />
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-indigo-500" /> Total Issues
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-emerald-600" /> Fixed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-red-600" /> New
        </span>
      </div>
    </div>
  );
}
