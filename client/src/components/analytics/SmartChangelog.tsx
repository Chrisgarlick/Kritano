/**
 * SmartChangelog - Insight-driven activity feed that highlights meaningful changes.
 * Replaces the basic "recent activity" list with contextual, actionable summaries.
 */

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, AlertTriangle, Trophy, Wrench, Clock } from 'lucide-react';
import { parseISO, differenceInDays } from 'date-fns';
import type { UserOverview } from '../../types/analytics.types';
import { CATEGORY_LABELS, type ScoreCategory } from '../../types/analytics.types';

interface SmartChangelogProps {
  recentActivity: UserOverview['recentActivity'];
  previousScores?: Record<string, Record<string, number | null>>;
  maxItems?: number;
}

interface ChangelogEntry {
  id: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  title: string;
  detail: string;
  timestamp: string;
  auditId: string;
  type: 'improvement' | 'regression' | 'milestone' | 'alert' | 'activity';
}

export function SmartChangelog({ recentActivity, maxItems = 8 }: SmartChangelogProps) {
  const navigate = useNavigate();

  const entries = useMemo<ChangelogEntry[]>(() => {
    const result: ChangelogEntry[] = [];

    for (let i = 0; i < recentActivity.length; i++) {
      const activity = recentActivity[i];
      const scores = activity.scores;

      // Check for milestones (all scores 90+)
      const mainScores = [scores.seo, scores.accessibility, scores.security, scores.performance].filter((s): s is number => s !== null);
      const allAbove90 = mainScores.length >= 4 && mainScores.every(s => s >= 90);
      const allAbove80 = mainScores.length >= 4 && mainScores.every(s => s >= 80);

      if (allAbove90) {
        result.push({
          id: `milestone-90-${activity.auditId}`,
          icon: Trophy,
          iconColor: '#d97706',
          iconBg: '#fef3c7',
          title: `${activity.siteName} achieved 90+ in all categories`,
          detail: `Scores: SEO ${scores.seo}, A11y ${scores.accessibility}, Security ${scores.security}, Performance ${scores.performance}`,
          timestamp: activity.completedAt,
          auditId: activity.auditId,
          type: 'milestone',
        });
        continue;
      }

      if (allAbove80) {
        result.push({
          id: `milestone-80-${activity.auditId}`,
          icon: Trophy,
          iconColor: '#059669',
          iconBg: '#d1fae5',
          title: `${activity.siteName} is all green`,
          detail: 'All main categories scoring 80+',
          timestamp: activity.completedAt,
          auditId: activity.auditId,
          type: 'milestone',
        });
        continue;
      }

      // Check for critical issues
      if (activity.totalIssues > 20) {
        result.push({
          id: `alert-${activity.auditId}`,
          icon: AlertTriangle,
          iconColor: '#dc2626',
          iconBg: '#fee2e2',
          title: `${activity.siteName} has ${activity.totalIssues} issues`,
          detail: `${activity.pagesCrawled} pages scanned. Overall score: ${activity.overallScore}`,
          timestamp: activity.completedAt,
          auditId: activity.auditId,
          type: 'alert',
        });
        continue;
      }

      // Find the weakest and strongest categories
      const catScores: { cat: ScoreCategory; score: number }[] = [];
      for (const [cat, score] of Object.entries(scores)) {
        if (score !== null && cat !== 'cqs') catScores.push({ cat: cat as ScoreCategory, score });
      }
      catScores.sort((a, b) => a.score - b.score);

      const weakest = catScores[0];
      const strongest = catScores[catScores.length - 1];

      if (weakest && weakest.score < 50) {
        result.push({
          id: `weak-${activity.auditId}`,
          icon: TrendingDown,
          iconColor: '#dc2626',
          iconBg: '#fee2e2',
          title: `${activity.siteName} ${CATEGORY_LABELS[weakest.cat]} needs attention`,
          detail: `Scoring ${weakest.score}/100. ${strongest ? `Strongest: ${CATEGORY_LABELS[strongest.cat]} at ${strongest.score}` : ''}`,
          timestamp: activity.completedAt,
          auditId: activity.auditId,
          type: 'regression',
        });
      } else if (activity.overallScore >= 80) {
        result.push({
          id: `good-${activity.auditId}`,
          icon: TrendingUp,
          iconColor: '#059669',
          iconBg: '#d1fae5',
          title: `${activity.siteName} scored ${activity.overallScore}`,
          detail: `${activity.pagesCrawled} pages, ${activity.totalIssues} issue${activity.totalIssues !== 1 ? 's' : ''} found`,
          timestamp: activity.completedAt,
          auditId: activity.auditId,
          type: 'improvement',
        });
      } else {
        result.push({
          id: `activity-${activity.auditId}`,
          icon: activity.totalIssues === 0 ? Wrench : Clock,
          iconColor: '#6366f1',
          iconBg: '#e0e7ff',
          title: `${activity.siteName} audited`,
          detail: `Score: ${activity.overallScore}. ${activity.pagesCrawled} pages, ${activity.totalIssues} issue${activity.totalIssues !== 1 ? 's' : ''}`,
          timestamp: activity.completedAt,
          auditId: activity.auditId,
          type: 'activity',
        });
      }
    }

    return result.slice(0, maxItems);
  }, [recentActivity, maxItems]);

  if (entries.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
      <h2 className="text-lg font-medium text-slate-900 dark:text-white mb-4">What Changed</h2>
      <div className="space-y-1">
        {entries.map((entry, idx) => {
          const Icon = entry.icon;
          const daysAgo = differenceInDays(new Date(), parseISO(entry.timestamp));
          const timeLabel = daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo}d ago`;

          return (
            <div
              key={entry.id}
              onClick={() => navigate(`/app/audits/${entry.auditId}`)}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors group"
            >
              {/* Timeline dot + line */}
              <div className="flex flex-col items-center mt-0.5">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: entry.iconBg }}
                >
                  <Icon className="w-4 h-4" style={{ color: entry.iconColor }} />
                </div>
                {idx < entries.length - 1 && (
                  <div className="w-px h-full min-h-[16px] bg-slate-200 dark:bg-slate-700 mt-1" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {entry.title}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {entry.detail}
                </p>
              </div>

              {/* Timestamp */}
              <span className="text-xs text-slate-400 dark:text-slate-500 flex-shrink-0 mt-1">
                {timeLabel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
