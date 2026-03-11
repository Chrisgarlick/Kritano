/**
 * TrendIndicator Component
 *
 * Shows trend direction (up/down/stable) with an optional delta value.
 * Used for score changes, stats comparisons, etc.
 */

import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from '@heroicons/react/20/solid';

export type TrendDirection = 'up' | 'down' | 'stable';
type TrendSize = 'xs' | 'sm' | 'md' | 'lg';

interface TrendIndicatorProps {
  /** The direction of the trend */
  direction: TrendDirection;
  /** The delta value to display (e.g., +5, -3) */
  delta?: number | string;
  /** Show as percentage */
  asPercentage?: boolean;
  /** Size of the indicator */
  size?: TrendSize;
  /** Invert colors (good = down, bad = up) - useful for issues/errors */
  invertColors?: boolean;
  /** Additional label text */
  label?: string;
  /** Additional CSS classes */
  className?: string;
  /** Show the delta value */
  showDelta?: boolean;
  /** Animate on mount */
  animated?: boolean;
}

// Size configurations
const sizeConfig: Record<TrendSize, { icon: string; text: string; gap: string }> = {
  xs: { icon: 'w-3 h-3', text: 'text-xs', gap: 'gap-0.5' },
  sm: { icon: 'w-3.5 h-3.5', text: 'text-xs', gap: 'gap-0.5' },
  md: { icon: 'w-4 h-4', text: 'text-sm', gap: 'gap-1' },
  lg: { icon: 'w-5 h-5', text: 'text-base', gap: 'gap-1' },
};

export function TrendIndicator({
  direction,
  delta,
  asPercentage = false,
  size = 'sm',
  invertColors = false,
  label,
  className = '',
  showDelta = true,
  animated = true,
}: TrendIndicatorProps) {
  const config = sizeConfig[size];

  // Determine colors based on direction and inversion
  const getColors = () => {
    const isPositive = direction === 'up';
    const isNegative = direction === 'down';
    const isStable = direction === 'stable';

    if (isStable) {
      return 'text-slate-500 dark:text-slate-400';
    }

    // For normal metrics (higher is better)
    if (!invertColors) {
      if (isPositive) return 'text-emerald-600 dark:text-emerald-500';
      if (isNegative) return 'text-red-600 dark:text-red-500';
    }

    // For inverted metrics (lower is better, like error counts)
    if (invertColors) {
      if (isPositive) return 'text-red-600 dark:text-red-500';
      if (isNegative) return 'text-emerald-600 dark:text-emerald-500';
    }

    return 'text-slate-500';
  };

  // Format delta value
  const formatDelta = () => {
    if (delta === undefined || delta === null) return null;

    const numericDelta = typeof delta === 'string' ? parseFloat(delta) : delta;
    const sign = numericDelta > 0 ? '+' : '';
    const value = asPercentage ? `${sign}${numericDelta}%` : `${sign}${numericDelta}`;

    return value;
  };

  // Get icon component
  const IconComponent = () => {
    const iconClass = config.icon;

    switch (direction) {
      case 'up':
        return <ArrowUpIcon className={iconClass} />;
      case 'down':
        return <ArrowDownIcon className={iconClass} />;
      case 'stable':
      default:
        return <MinusIcon className={iconClass} />;
    }
  };

  const formattedDelta = formatDelta();
  const colorClass = getColors();

  return (
    <span
      className={`
        inline-flex items-center ${config.gap} ${config.text} font-medium
        ${colorClass}
        ${animated ? 'animate-fade-in' : ''}
        ${className}
      `}
    >
      <IconComponent />
      {showDelta && formattedDelta && <span>{formattedDelta}</span>}
      {label && <span className="text-slate-500 dark:text-slate-400 font-normal">{label}</span>}
    </span>
  );
}

// =============================================
// Helper function to determine trend from values
// =============================================

export function calculateTrend(
  current: number,
  previous: number
): { direction: TrendDirection; delta: number } {
  const delta = current - previous;

  if (delta > 0) {
    return { direction: 'up', delta };
  } else if (delta < 0) {
    return { direction: 'down', delta };
  } else {
    return { direction: 'stable', delta: 0 };
  }
}

// =============================================
// Compact variant for inline use
// =============================================

interface TrendBadgeProps {
  direction: TrendDirection;
  delta?: number;
  invertColors?: boolean;
  className?: string;
}

export function TrendBadge({
  direction,
  delta,
  invertColors = false,
  className = '',
}: TrendBadgeProps) {
  // Determine background colors
  const getBgColors = () => {
    const isPositive = direction === 'up';
    const isNegative = direction === 'down';
    const isStable = direction === 'stable';

    if (isStable) {
      return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400';
    }

    if (!invertColors) {
      if (isPositive) return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400';
      if (isNegative) return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
    }

    if (invertColors) {
      if (isPositive) return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
      if (isNegative) return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400';
    }

    return 'bg-slate-100 text-slate-600';
  };

  const IconComponent = direction === 'up'
    ? ArrowUpIcon
    : direction === 'down'
    ? ArrowDownIcon
    : MinusIcon;

  return (
    <span
      className={`
        inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full
        text-xs font-medium
        ${getBgColors()}
        ${className}
      `}
    >
      <IconComponent className="w-3 h-3" />
      {delta !== undefined && (
        <span>{delta > 0 ? `+${delta}` : delta}</span>
      )}
    </span>
  );
}
