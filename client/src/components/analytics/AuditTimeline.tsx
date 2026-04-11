/**
 * AuditTimeline — Horizontal timeline showing audits as annotated dots.
 * Dot size = total issues, dot colour = overall health, hover for details.
 */

import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { getScoreColor } from '../../types/analytics.types';

interface TimelineAudit {
  auditId: string;
  completedAt: string;
  overallScore: number;
  totalIssues: number;
  pagesCrawled: number;
}

interface AuditTimelineProps {
  audits: TimelineAudit[];
  onDotClick?: (auditId: string) => void;
}

export function AuditTimeline({ audits, onDotClick }: AuditTimelineProps) {
  const sorted = useMemo(() => {
    return [...audits].sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime());
  }, [audits]);

  if (sorted.length === 0) return null;

  const maxIssues = Math.max(...sorted.map(a => a.totalIssues), 1);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
      <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">Audit Timeline</h3>

      <div className="relative">
        {/* Horizontal line */}
        <div className="absolute top-6 left-8 right-8 h-px bg-slate-200 dark:bg-slate-700" />

        {/* Dots */}
        <div className="flex items-start justify-between px-4" style={{ minHeight: 80 }}>
          {sorted.map((audit) => {
            const dotSize = 12 + (audit.totalIssues / maxIssues) * 16;
            const color = getScoreColor(audit.overallScore);

            return (
              <div
                key={audit.auditId}
                className="relative flex flex-col items-center group"
                style={{ flex: 1 }}
              >
                {/* Dot */}
                <button
                  onClick={() => onDotClick?.(audit.auditId)}
                  className="relative z-10 rounded-full border-2 border-white dark:border-slate-800 shadow-sm transition-transform group-hover:scale-125"
                  style={{
                    width: dotSize,
                    height: dotSize,
                    backgroundColor: color,
                    marginTop: 6 + (28 - dotSize) / 2,
                  }}
                  title={`Score: ${audit.overallScore}, Issues: ${audit.totalIssues}`}
                />

                {/* Score label */}
                <span
                  className="text-[10px] font-bold mt-1.5"
                  style={{ color }}
                >
                  {audit.overallScore}
                </span>

                {/* Date */}
                <span className="text-[9px] text-slate-400 mt-0.5">
                  {format(parseISO(audit.completedAt), 'MMM d')}
                </span>

                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 hidden group-hover:block z-20">
                  <div className="bg-slate-900 dark:bg-slate-700 text-white text-[10px] rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                    <p className="font-medium">{format(parseISO(audit.completedAt), 'MMM d, yyyy h:mm a')}</p>
                    <p>Score: {audit.overallScore} | Issues: {audit.totalIssues}</p>
                    <p>{audit.pagesCrawled} pages crawled</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-3 text-[10px] text-slate-500">
        <span>Dot size = issue count</span>
        <span>&middot;</span>
        <span>
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-600 mr-0.5" /> 90+
        </span>
        <span>
          <span className="inline-block w-2 h-2 rounded-full bg-amber-500 mr-0.5" /> 70-89
        </span>
        <span>
          <span className="inline-block w-2 h-2 rounded-full bg-red-600 mr-0.5" /> &lt;70
        </span>
      </div>
    </div>
  );
}
