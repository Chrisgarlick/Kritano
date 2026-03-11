/**
 * StatCard Component
 *
 * Displays a statistic with:
 * - Animated counter
 * - Trend indicator
 * - Optional sparkline
 * - Icon support
 */

import { type ReactNode } from 'react';
import { TrendIndicator, type TrendDirection } from './TrendIndicator';
import { Label } from './Typography';

interface StatCardProps {
  /** The statistic label */
  label: string;
  /** The statistic value */
  value: number | string;
  /** Trend direction */
  trend?: TrendDirection;
  /** Trend delta value */
  trendDelta?: number;
  /** Trend label (e.g., "from last week") */
  trendLabel?: string;
  /** Invert trend colors (for metrics where down is good) */
  invertTrend?: boolean;
  /** Icon to display */
  icon?: ReactNode;
  /** Icon background color class */
  iconBg?: string;
  /** Additional CSS classes */
  className?: string;
  /** Whether to animate the value on mount */
  animated?: boolean;
  /** Card variant */
  variant?: 'default' | 'outlined' | 'filled';
  /** Click handler */
  onClick?: () => void;
}

const variantStyles = {
  default: 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm',
  outlined: 'bg-transparent border border-slate-200 dark:border-slate-700',
  filled: 'bg-slate-50 dark:bg-slate-800/50 border border-transparent',
};

export function StatCard({
  label,
  value,
  trend,
  trendDelta,
  trendLabel,
  invertTrend = false,
  icon,
  iconBg = 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
  className = '',
  animated = true,
  variant = 'default',
  onClick,
}: StatCardProps) {
  const isClickable = !!onClick;

  return (
    <div
      className={`
        rounded-xl p-5
        ${variantStyles[variant]}
        ${animated ? 'animate-reveal-up' : ''}
        ${isClickable ? 'cursor-pointer hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-md transition-all' : ''}
        ${className}
      `}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Label className="text-slate-500 dark:text-slate-400">
            {label}
          </Label>

          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-slate-900 dark:text-white tabular-nums">
              {value}
            </span>
          </div>

          {trend && (
            <div className="mt-2 flex items-center gap-1.5">
              <TrendIndicator
                direction={trend}
                delta={trendDelta}
                size="sm"
                invertColors={invertTrend}
              />
              {trendLabel && (
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {trendLabel}
                </span>
              )}
            </div>
          )}
        </div>

        {icon && (
          <div className={`p-2.5 rounded-lg ${iconBg}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================
// Mini Stat - Compact inline version
// =============================================

interface MiniStatProps {
  label: string;
  value: number | string;
  trend?: TrendDirection;
  trendDelta?: number;
  invertTrend?: boolean;
  className?: string;
}

export function MiniStat({
  label,
  value,
  trend,
  trendDelta,
  invertTrend = false,
  className = '',
}: MiniStatProps) {
  return (
    <div className={`flex items-center justify-between py-2 ${className}`}>
      <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-slate-900 dark:text-white tabular-nums">
          {value}
        </span>
        {trend && (
          <TrendIndicator
            direction={trend}
            delta={trendDelta}
            size="xs"
            invertColors={invertTrend}
            showDelta={false}
          />
        )}
      </div>
    </div>
  );
}

// =============================================
// Stat Group - For displaying multiple stats together
// =============================================

interface StatGroupProps {
  children: ReactNode;
  className?: string;
  columns?: 2 | 3 | 4;
}

export function StatGroup({
  children,
  className = '',
  columns = 4,
}: StatGroupProps) {
  const gridCols = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={`grid grid-cols-1 ${gridCols[columns]} gap-4 ${className}`}>
      {children}
    </div>
  );
}

// =============================================
// Hero Stat - Large featured statistic
// =============================================

interface HeroStatProps {
  label: string;
  value: number | string;
  description?: string;
  trend?: TrendDirection;
  trendDelta?: number;
  trendLabel?: string;
  className?: string;
}

export function HeroStat({
  label,
  value,
  description,
  trend,
  trendDelta,
  trendLabel,
  className = '',
}: HeroStatProps) {
  return (
    <div
      className={`
        bg-gradient-to-br from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-700
        rounded-2xl p-6 text-white
        ${className}
      `}
    >
      <Label className="text-indigo-100 uppercase tracking-wider">
        {label}
      </Label>

      <div className="mt-3 flex items-baseline gap-3">
        <span className="text-5xl font-display tabular-nums">
          {value}
        </span>
        {trend && (
          <div className="flex items-center gap-1 text-indigo-100">
            <TrendIndicator
              direction={trend}
              delta={trendDelta}
              size="md"
              className="!text-white"
            />
          </div>
        )}
      </div>

      {(description || trendLabel) && (
        <p className="mt-2 text-sm text-indigo-100">
          {description || trendLabel}
        </p>
      )}
    </div>
  );
}
