/**
 * ScoreDisplay Component
 *
 * A distinctive, animated score visualization combining:
 * - Large serif number (Instrument Serif)
 * - Circular progress ring around score
 * - Color based on score range
 * - Trend arrow with percentage delta
 * - Optional label and description
 */

import { ProgressRing, getScoreColorClass } from './ProgressRing';
import { TrendIndicator, type TrendDirection } from './TrendIndicator';
import { ScoreNumber, Label } from './Typography';

type ScoreSize = 'sm' | 'md' | 'lg' | 'xl';

interface ScoreDisplayProps {
  /** The score value (0-100) */
  score: number;
  /** Optional label above the score */
  label?: string;
  /** Trend direction */
  trend?: TrendDirection;
  /** Delta value for the trend */
  trendDelta?: number;
  /** Size of the display */
  size?: ScoreSize;
  /** Whether to animate on mount */
  animated?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Optional description below the score */
  description?: string;
  /** Whether to show the label for the score quality */
  showQualityLabel?: boolean;
}

// Size configurations
const sizeConfig: Record<ScoreSize, {
  ring: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  number: 'xl' | 'lg' | 'md' | 'sm';
  labelSize: string;
}> = {
  sm: { ring: 'sm', number: 'sm', labelSize: 'text-xs' },
  md: { ring: 'md', number: 'md', labelSize: 'text-xs' },
  lg: { ring: 'lg', number: 'lg', labelSize: 'text-sm' },
  xl: { ring: 'xl', number: 'xl', labelSize: 'text-sm' },
};

// Score quality labels
function getScoreQuality(score: number): { label: string; color: string } {
  if (score >= 90) return { label: 'Excellent', color: 'text-emerald-600 dark:text-emerald-500' };
  if (score >= 70) return { label: 'Good', color: 'text-amber-500 dark:text-amber-400' };
  if (score >= 50) return { label: 'Fair', color: 'text-orange-500 dark:text-orange-400' };
  return { label: 'Poor', color: 'text-red-700 dark:text-red-500' };
}

export function ScoreDisplay({
  score,
  label,
  trend,
  trendDelta,
  size = 'md',
  animated = true,
  className = '',
  description,
  showQualityLabel = false,
}: ScoreDisplayProps) {
  const config = sizeConfig[size];
  const quality = getScoreQuality(score);
  const colorClass = getScoreColorClass(score);

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Label */}
      {label && (
        <Label className={`mb-2 ${config.labelSize}`}>
          {label}
        </Label>
      )}

      {/* Score ring with number */}
      <ProgressRing
        value={score}
        size={config.ring}
        animated={animated}
        autoColor
      >
        <div className="flex flex-col items-center justify-center">
          <ScoreNumber size={config.number} className={colorClass}>
            {Math.round(score)}
          </ScoreNumber>
        </div>
      </ProgressRing>

      {/* Quality label */}
      {showQualityLabel && (
        <span className={`mt-1 text-sm font-medium ${quality.color}`}>
          {quality.label}
        </span>
      )}

      {/* Trend indicator */}
      {trend && (
        <div className="mt-2">
          <TrendIndicator
            direction={trend}
            delta={trendDelta}
            size="sm"
            animated={animated}
          />
        </div>
      )}

      {/* Description */}
      {description && (
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 text-center">
          {description}
        </p>
      )}
    </div>
  );
}

// =============================================
// Compact Score Display - For lists and cards
// =============================================

interface CompactScoreProps {
  score: number;
  label?: string;
  trend?: TrendDirection;
  trendDelta?: number;
  className?: string;
}

export function CompactScore({
  score,
  label,
  trend,
  trendDelta,
  className = '',
}: CompactScoreProps) {
  const quality = getScoreQuality(score);

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <ProgressRing value={score} size="xs" animated autoColor>
        <span className={`text-xs font-semibold ${getScoreColorClass(score)}`}>
          {Math.round(score)}
        </span>
      </ProgressRing>

      <div className="flex flex-col">
        {label && (
          <span className="text-sm font-medium text-slate-900 dark:text-white">
            {label}
          </span>
        )}
        <div className="flex items-center gap-2">
          <span className={`text-xs ${quality.color}`}>{quality.label}</span>
          {trend && (
            <TrendIndicator
              direction={trend}
              delta={trendDelta}
              size="xs"
            />
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================
// Category Score - For SEO, A11Y, Security, Performance
// =============================================

type CategoryType = 'seo' | 'accessibility' | 'security' | 'performance' | 'content' | 'structured-data' | 'cqs';

interface CategoryScoreProps {
  category: CategoryType;
  score: number;
  trend?: TrendDirection;
  trendDelta?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

// Category configurations matching brand guidelines
const categoryConfig: Record<CategoryType, {
  label: string;
  bgColor: string;
  textColor: string;
  ringColor: string;
}> = {
  seo: {
    label: 'SEO',
    bgColor: 'bg-violet-100 dark:bg-violet-900/30',
    textColor: 'text-violet-700 dark:text-violet-400',
    ringColor: '#8b5cf6', // violet-500
  },
  accessibility: {
    label: 'Accessibility',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    textColor: 'text-emerald-700 dark:text-emerald-400',
    ringColor: '#10b981', // emerald-500
  },
  security: {
    label: 'Security',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    textColor: 'text-red-700 dark:text-red-400',
    ringColor: '#ef4444', // red-500
  },
  performance: {
    label: 'Performance',
    bgColor: 'bg-sky-100 dark:bg-sky-900/30',
    textColor: 'text-sky-700 dark:text-sky-400',
    ringColor: '#0ea5e9', // sky-500
  },
  content: {
    label: 'Content',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    textColor: 'text-amber-700 dark:text-amber-400',
    ringColor: '#f59e0b', // amber-500
  },
  'structured-data': {
    label: 'Schema',
    bgColor: 'bg-teal-100 dark:bg-teal-900/30',
    textColor: 'text-teal-700 dark:text-teal-400',
    ringColor: '#14b8a6', // teal-500
  },
  cqs: {
    label: 'CQS',
    bgColor: 'bg-teal-100 dark:bg-teal-900/30',
    textColor: 'text-teal-700 dark:text-teal-400',
    ringColor: '#14b8a6', // teal-500
  },
};

export function CategoryScore({
  category,
  score,
  trend,
  trendDelta,
  size = 'md',
  className = '',
  onClick,
}: CategoryScoreProps) {
  const config = categoryConfig[category];
  const sizeMap = { sm: 'sm', md: 'md', lg: 'lg' } as const;
  const ringSize = sizeMap[size];

  return (
    <div
      className={`
        flex flex-col items-center p-4 rounded-xl
        ${config.bgColor}
        ${onClick ? 'cursor-pointer hover:ring-2 hover:ring-offset-2 hover:ring-indigo-500 transition-all' : ''}
        ${className}
      `}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <span className={`text-xs font-medium uppercase tracking-wider mb-2 ${config.textColor}`}>
        {config.label}
      </span>

      <ProgressRing
        value={score}
        size={ringSize}
        color={config.ringColor}
        autoColor={false}
        animated
      >
        <span className={`font-display text-2xl ${config.textColor}`}>
          {Math.round(score)}
        </span>
      </ProgressRing>

      {trend && (
        <div className="mt-2">
          <TrendIndicator
            direction={trend}
            delta={trendDelta}
            size="xs"
          />
        </div>
      )}
    </div>
  );
}

// Re-export for convenience
export { getScoreQuality };
