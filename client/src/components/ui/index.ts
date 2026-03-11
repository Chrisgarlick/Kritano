/**
 * UI Component Library
 *
 * PagePulser's design system components.
 * Import from this file for convenience:
 *
 * import { Button, ScoreDisplay, Typography } from '@/components/ui';
 */

// Button system
export { Button, IconButton, ButtonGroup } from './Button';

// Typography system
export {
  Display,
  Heading,
  Body,
  Mono,
  Label,
  ScoreNumber,
} from './Typography';

// Score & Progress
export { ProgressRing, getScoreColor, getScoreColorClass } from './ProgressRing';
export {
  ScoreDisplay,
  CompactScore,
  CategoryScore,
  getScoreQuality,
} from './ScoreDisplay';

// Trend indicators
export {
  TrendIndicator,
  TrendBadge,
  calculateTrend,
} from './TrendIndicator';

// Status badges
export {
  StatusBadge,
  PulseIndicator,
  SeverityBadge,
  CountBadge,
} from './StatusBadge';

// Feedback
export { useToast, ToastProvider } from './Toast';
export { Alert } from './Alert';

// Form elements
export { Input } from './Input';

// Loading states
export { Skeleton } from './Skeleton';

// Stats
export {
  StatCard,
  MiniStat,
  StatGroup,
  HeroStat,
} from './StatCard';

// Empty states
export {
  EmptyState,
  NoAuditsEmptyState,
  NoSitesEmptyState,
  NoIssuesEmptyState,
  NoTeamEmptyState,
  NoApiKeysEmptyState,
  NoSearchResultsEmptyState,
} from './EmptyState';

// Charts
export {
  ScoreChart,
  MultiScoreChart,
  ChartLegend,
  Sparkline,
} from './ScoreChart';

export {
  CategoryRadar,
  CategoryComparison,
  CategoryBars,
  SeverityDonut,
  SeverityLegend,
} from './CategoryRadar';

// Activity feed
export {
  ActivityFeed,
  CompactActivityList,
  ActivityFeedSkeleton,
  type ActivityType,
} from './ActivityFeed';
