import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { ProgressRing } from '../ui/ProgressRing';
import { Body } from '../ui/Typography';
import { auditsApi } from '../../services/api';

interface CQSBreakdownProps {
  auditId: string;
  cqsScore: number | null;
}

interface SubScore {
  key: string;
  label: string;
  value: number | null;
}

function getBarColor(score: number): string {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 60) return 'bg-amber-500';
  if (score >= 50) return 'bg-orange-500';
  return 'bg-red-500';
}

export function CQSBreakdown({ auditId, cqsScore }: CQSBreakdownProps) {
  const [data, setData] = useState<{
    cqsScore: number | null;
    breakdown?: {
      quality: number | null;
      eeat: number | null;
      readability: number | null;
      engagement: number | null;
      structure: number | null;
    };
    pages?: Array<{
      url: string;
      cqs: number | null;
      depth: number;
      quality: number | null;
      eeat: number | null;
      readability: number | null;
      engagement: number | null;
      structure: number | null;
      wordCount?: number | null;
    }>;
    summary?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    auditsApi.getContentQuality(auditId)
      .then(res => {
        if (!cancelled) {
          setData(res.data);
          setLoading(false);
        }
      })
      .catch(err => {
        if (!cancelled) {
          // Tier gate returns 403
          if (err?.response?.status === 403) {
            setData({ cqsScore: cqsScore });
          } else {
            setError('Failed to load content quality data');
          }
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [auditId, cqsScore]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm p-6 animate-pulse">
        <div className="h-20 w-20 rounded-full bg-slate-200 dark:bg-slate-700 mx-auto mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-4 bg-slate-200 dark:bg-slate-700 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm p-6">
        <Body size="sm" className="text-slate-500">{error}</Body>
      </div>
    );
  }

  const score = data?.cqsScore ?? cqsScore;
  const breakdown = data?.breakdown;
  const summary = data?.summary;
  const pages = data?.pages;

  const subScores: SubScore[] = breakdown ? [
    { key: 'quality', label: 'Quality', value: breakdown.quality },
    { key: 'eeat', label: 'E-E-A-T', value: breakdown.eeat },
    { key: 'readability', label: 'Readability', value: breakdown.readability },
    { key: 'engagement', label: 'Engagement', value: breakdown.engagement },
    { key: 'structure', label: 'Structure', value: breakdown.structure },
  ] : [];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm p-6">
      {/* CQS Ring + Summary */}
      <div className="flex flex-col sm:flex-row items-center gap-6 mb-6">
        <div className="flex-shrink-0" aria-label={score !== null ? `Content Quality Score: ${score} out of 100` : 'Content Quality Score: not available'} role="img">
          <ProgressRing
            value={score ?? 0}
            size="lg"
            strokeWidth={8}
            color="#14b8a6"
            autoColor={false}
            animated
          >
            <div className="text-center">
              <span className="font-display text-2xl text-teal-700 dark:text-teal-400">
                {score ?? '-'}
              </span>
            </div>
          </ProgressRing>
        </div>
        <div className="text-center sm:text-left">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-400 mb-1">
            Content Quality Score
          </h3>
          {summary && (
            <Body size="sm" className="text-slate-600 dark:text-slate-400">
              {summary}
            </Body>
          )}
        </div>
      </div>

      {/* Sub-score bars */}
      {subScores.length > 0 && (
        <div className="space-y-3">
          {subScores.map(sub => (
            <div key={sub.key}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-slate-600 dark:text-slate-400">{sub.label}</span>
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  {sub.value !== null ? sub.value : '-'}
                </span>
              </div>
              <div className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                {sub.value !== null && (
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out motion-reduce:transition-none ${getBarColor(sub.value)}`}
                    style={{ width: `${sub.value}%` }}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Page-level breakdown (Pro+ only) */}
      {pages && pages.length > 0 && (
        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-500 mb-3">
            Page Scores
          </h4>
          <div className="space-y-2 max-h-64 overflow-y-auto" role="region" aria-label="Page-level content quality scores">
            {pages.map((page, idx) => (
              <div key={idx} className="flex items-center gap-3 text-xs">
                <span className={`font-medium tabular-nums w-8 text-right ${
                  page.cqs !== null && page.cqs >= 80 ? 'text-emerald-600 dark:text-emerald-400' :
                  page.cqs !== null && page.cqs >= 60 ? 'text-amber-600 dark:text-amber-400' :
                  page.cqs !== null && page.cqs >= 50 ? 'text-orange-600 dark:text-orange-400' :
                  'text-red-600 dark:text-red-400'
                }`}>
                  {page.cqs ?? '-'}
                </span>
                <span className="text-slate-500 dark:text-slate-500 truncate flex-1" title={page.url}>
                  {page.url}
                </span>
                {page.wordCount != null && page.wordCount < 100 && (
                  <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400" title="Limited content - score may not be representative">
                    <AlertTriangle className="w-3 h-3" />
                    <span className="text-[10px]">Low content</span>
                  </span>
                )}
                <span className="text-slate-400 dark:text-slate-600 text-[10px]">
                  {page.depth === 0 ? 'Homepage' : page.depth === 1 ? 'Top-level' : `Depth ${page.depth}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
