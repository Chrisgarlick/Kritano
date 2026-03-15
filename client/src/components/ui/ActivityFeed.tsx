/**
 * ActivityFeed Component
 *
 * Timeline-style feed for displaying recent activity.
 * Used on dashboard to show audit completions, issues found, etc.
 */

import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Play,
  Globe,
  Shield,
  type LucideIcon,
} from 'lucide-react';
import { Body, Mono } from './Typography';

// Activity types
export type ActivityType =
  | 'audit_completed'
  | 'audit_started'
  | 'audit_failed'
  | 'issue_found'
  | 'issue_resolved'
  | 'score_improved'
  | 'score_decreased'
  | 'site_added'
  | 'site_verified';

interface ActivityItem {
  /** Unique identifier */
  id: string;
  /** Type of activity */
  type: ActivityType;
  /** Main message */
  message: string;
  /** Optional secondary details */
  details?: string;
  /** URL or domain involved */
  target?: string;
  /** Timestamp */
  timestamp: Date | string;
  /** Optional link to navigate to */
  href?: string;
}

interface ActivityFeedProps {
  /** Array of activity items */
  activities: ActivityItem[];
  /** Maximum number of items to show */
  limit?: number;
  /** Show timestamps */
  showTimestamps?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// Activity type configurations
const activityConfig: Record<ActivityType, { icon: LucideIcon; color: string; bgColor: string }> = {
  audit_completed: {
    icon: CheckCircle,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
  },
  audit_started: {
    icon: Play,
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
  },
  audit_failed: {
    icon: XCircle,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
  },
  issue_found: {
    icon: AlertTriangle,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
  },
  issue_resolved: {
    icon: CheckCircle,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
  },
  score_improved: {
    icon: TrendingUp,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
  },
  score_decreased: {
    icon: TrendingDown,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
  },
  site_added: {
    icon: Globe,
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
  },
  site_verified: {
    icon: Shield,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
  },
};

// Format relative time
function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return then.toLocaleDateString();
}

export function ActivityFeed({
  activities,
  limit = 10,
  showTimestamps = true,
  className = '',
}: ActivityFeedProps) {
  const displayActivities = activities.slice(0, limit);

  if (displayActivities.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center py-8 ${className}`}>
        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
          <Clock className="w-6 h-6 text-slate-500" />
        </div>
        <Body muted className="text-center">No recent activity</Body>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Timeline line */}
      <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-700" />

      {/* Activity items */}
      <div className="space-y-4">
        {displayActivities.map((activity, index) => {
          const config = activityConfig[activity.type];
          const Icon = config.icon;

          const content = (
            <div
              className={`
                relative flex items-start gap-4 pl-10 pr-4 py-2
                animate-reveal-up
                ${activity.href ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg -ml-2 pl-12' : ''}
              `}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Icon */}
              <div
                className={`
                  absolute left-0 w-10 h-10 rounded-full flex items-center justify-center
                  ${config.bgColor} z-10
                `}
              >
                <Icon className={`w-5 h-5 ${config.color}`} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pt-1">
                <Body className="text-slate-900 dark:text-white">
                  {activity.message}
                </Body>
                {activity.target && (
                  <Mono size="xs" className="truncate block mt-0.5">
                    {activity.target}
                  </Mono>
                )}
                {activity.details && (
                  <Body size="sm" muted className="mt-1">
                    {activity.details}
                  </Body>
                )}
              </div>

              {/* Timestamp */}
              {showTimestamps && (
                <span className="text-xs text-slate-500 dark:text-slate-500 whitespace-nowrap pt-1.5">
                  {formatRelativeTime(activity.timestamp)}
                </span>
              )}
            </div>
          );

          return activity.href ? (
            <a key={activity.id} href={activity.href} className="block">
              {content}
            </a>
          ) : (
            <div key={activity.id}>{content}</div>
          );
        })}
      </div>
    </div>
  );
}

// =============================================
// Compact Activity List (for smaller spaces)
// =============================================

interface CompactActivityProps {
  activities: ActivityItem[];
  limit?: number;
  className?: string;
}

export function CompactActivityList({
  activities,
  limit = 5,
  className = '',
}: CompactActivityProps) {
  const displayActivities = activities.slice(0, limit);

  if (displayActivities.length === 0) {
    return (
      <div className={`text-center py-4 ${className}`}>
        <Body size="sm" muted>No recent activity</Body>
      </div>
    );
  }

  return (
    <div className={`divide-y divide-slate-100 dark:divide-slate-800 ${className}`}>
      {displayActivities.map((activity, index) => {
        const config = activityConfig[activity.type];
        const Icon = config.icon;

        return (
          <div
            key={activity.id}
            className="flex items-center gap-3 py-3 animate-reveal-up"
            style={{ animationDelay: `${index * 30}ms` }}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${config.bgColor}`}>
              <Icon className={`w-4 h-4 ${config.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <Body size="sm" className="truncate text-slate-700 dark:text-slate-300">
                {activity.message}
              </Body>
            </div>
            <span className="text-xs text-slate-500 whitespace-nowrap">
              {formatRelativeTime(activity.timestamp)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// =============================================
// Activity Feed Skeleton
// =============================================

export function ActivityFeedSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="relative">
      <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-700" />
      <div className="space-y-4">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="relative flex items-start gap-4 pl-10 py-2">
            <div className="absolute left-0 w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-3/4" />
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
