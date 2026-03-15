/**
 * SiteCard Component
 *
 * Grid card for displaying site information with:
 * - Circular score with color gradient
 * - Domain info and last audit timestamp
 * - Issue count with severity breakdown
 * - Hover actions for quick access
 */

import { type ReactNode } from 'react';
import {
  Globe,
  Clock,
  AlertTriangle,
  CheckCircle,
  Play,
  ExternalLink,
} from 'lucide-react';
import { CompactScore } from './ScoreDisplay';
import { Heading, Mono } from './Typography';
import { StatusBadge } from './StatusBadge';
import type { Audit } from '../../types/audit.types';

interface SiteCardProps {
  /** Site domain */
  domain: string;
  /** Site URL */
  url: string;
  /** Latest audit for this site */
  latestAudit?: Audit | null;
  /** Whether domain is verified */
  isVerified?: boolean;
  /** Click handler for the card */
  onClick?: () => void;
  /** Handler for running a new audit */
  onRunAudit?: () => void;
  /** Additional CSS classes */
  className?: string;
}

export function SiteCard({
  domain,
  url,
  latestAudit,
  isVerified = false,
  onClick,
  onRunAudit,
  className = '',
}: SiteCardProps) {
  // Calculate overall score from category scores
  const getOverallScore = (): number | null => {
    if (!latestAudit) return null;
    const scores = [
      latestAudit.seo_score,
      latestAudit.accessibility_score,
      latestAudit.security_score,
      latestAudit.performance_score,
    ].filter((s): s is number => s !== null);

    if (scores.length === 0) return null;
    return Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length);
  };

  const score = getOverallScore();
  const hasIssues = latestAudit && latestAudit.total_issues > 0;

  // Format relative time
  const getRelativeTime = (dateStr: string | null): string => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const lastAuditTime = latestAudit
    ? getRelativeTime(latestAudit.completed_at || latestAudit.created_at)
    : 'Never audited';

  return (
    <div
      className={`
        group relative bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800
        hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-lg
        transition-all duration-300 overflow-hidden
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {/* Card Content */}
      <div className="p-5">
        {/* Score & Domain */}
        <div className="flex items-start gap-4">
          {/* Score Circle */}
          <div className="flex-shrink-0">
            {score !== null ? (
              <CompactScore score={score} />
            ) : (
              <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Globe className="w-6 h-6 text-slate-500" />
              </div>
            )}
          </div>

          {/* Domain Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Heading size="sm" as="h3" className="text-slate-900 dark:text-white truncate">
                {domain}
              </Heading>
              {isVerified && (
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              )}
            </div>
            <Mono size="xs" className="truncate block mt-0.5">
              {url}
            </Mono>
          </div>
        </div>

        {/* Stats Row */}
        <div className="mt-4 flex items-center justify-between">
          {/* Last Audit */}
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-500">
            <Clock className="w-4 h-4" />
            <span className="text-sm">{lastAuditTime}</span>
          </div>

          {/* Status or Issues */}
          {latestAudit ? (
            latestAudit.status === 'completed' ? (
              hasIssues ? (
                <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {latestAudit.total_issues} issue{latestAudit.total_issues !== 1 ? 's' : ''}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">All clear</span>
                </div>
              )
            ) : (
              <StatusBadge status={latestAudit.status} size="sm" />
            )
          ) : (
            <span className="text-sm text-slate-500">No audits yet</span>
          )}
        </div>

        {/* Category Scores (if completed) */}
        {latestAudit?.status === 'completed' && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="grid grid-cols-4 gap-2">
              <CategoryMiniScore label="SEO" score={latestAudit.seo_score} />
              <CategoryMiniScore label="A11Y" score={latestAudit.accessibility_score} />
              <CategoryMiniScore label="SEC" score={latestAudit.security_score} />
              <CategoryMiniScore label="PERF" score={latestAudit.performance_score} />
            </div>
          </div>
        )}
      </div>

      {/* Hover Actions */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-white via-white dark:from-slate-900 dark:via-slate-900 to-transparent p-4 pt-8 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-2">
          {onRunAudit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRunAudit();
              }}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Play className="w-4 h-4" />
              Run Audit
            </button>
          )}
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}

// Mini score display for category breakdown
function CategoryMiniScore({ label, score }: { label: string; score: number | null }) {
  const getScoreColor = (s: number | null): string => {
    if (s === null) return 'text-slate-500';
    if (s >= 90) return 'text-emerald-600 dark:text-emerald-400';
    if (s >= 70) return 'text-amber-600 dark:text-amber-400';
    if (s >= 50) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="text-center">
      <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{label}</p>
      <p className={`text-sm font-semibold tabular-nums ${getScoreColor(score)}`}>
        {score !== null ? score : '—'}
      </p>
    </div>
  );
}

// =============================================
// Site Card Grid
// =============================================

interface SiteCardGridProps {
  children: ReactNode;
  className?: string;
}

export function SiteCardGrid({ children, className = '' }: SiteCardGridProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      {children}
    </div>
  );
}

// =============================================
// Site List Item (for list view)
// =============================================

interface SiteListItemProps {
  domain: string;
  url: string;
  latestAudit?: Audit | null;
  isVerified?: boolean;
  onClick?: () => void;
  onRunAudit?: () => void;
  className?: string;
}

export function SiteListItem({
  domain,
  url,
  latestAudit,
  isVerified = false,
  onClick,
  onRunAudit,
  className = '',
}: SiteListItemProps) {
  // Calculate overall score
  const getOverallScore = (): number | null => {
    if (!latestAudit) return null;
    const scores = [
      latestAudit.seo_score,
      latestAudit.accessibility_score,
      latestAudit.security_score,
      latestAudit.performance_score,
    ].filter((s): s is number => s !== null);

    if (scores.length === 0) return null;
    return Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length);
  };

  const score = getOverallScore();

  // Format relative time
  const getRelativeTime = (dateStr: string | null): string => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div
      className={`
        group flex items-center gap-4 px-4 py-3 bg-white dark:bg-slate-900
        border-b border-slate-200 dark:border-slate-800 last:border-b-0
        hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {/* Score */}
      {score !== null ? (
        <CompactScore score={score} />
      ) : (
        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <Globe className="w-4 h-4 text-slate-500" />
        </div>
      )}

      {/* Domain */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-900 dark:text-white truncate">
            {domain}
          </span>
          {isVerified && (
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
          )}
        </div>
        <Mono size="xs" className="truncate block">
          {url}
        </Mono>
      </div>

      {/* Status */}
      {latestAudit && (
        <StatusBadge status={latestAudit.status} size="sm" />
      )}

      {/* Issues */}
      {latestAudit?.total_issues ? (
        <span className="text-sm text-slate-500 dark:text-slate-500 tabular-nums">
          {latestAudit.total_issues} issue{latestAudit.total_issues !== 1 ? 's' : ''}
        </span>
      ) : null}

      {/* Last Audit Time */}
      <span className="text-sm text-slate-500 tabular-nums w-20 text-right">
        {latestAudit ? getRelativeTime(latestAudit.completed_at || latestAudit.created_at) : 'Never'}
      </span>

      {/* Actions */}
      {onRunAudit && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRunAudit();
          }}
          className="opacity-0 group-hover:opacity-100 p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all"
          title="Run Audit"
        >
          <Play className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
