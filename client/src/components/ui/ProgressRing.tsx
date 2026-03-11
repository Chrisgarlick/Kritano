import { type ReactNode, useMemo } from 'react';

/**
 * ProgressRing Component
 *
 * A circular progress indicator with animated fill.
 * Used for score displays and progress tracking.
 */

type RingSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface ProgressRingProps {
  /** Progress value from 0 to 100 */
  value: number;
  /** Maximum value (default 100) */
  max?: number;
  /** Size of the ring */
  size?: RingSize;
  /** Stroke width of the ring */
  strokeWidth?: number;
  /** Custom color for the progress (overrides auto color) */
  color?: string;
  /** Whether to auto-color based on value */
  autoColor?: boolean;
  /** Whether to animate the fill on mount */
  animated?: boolean;
  /** Content to display in the center */
  children?: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Show the background track */
  showTrack?: boolean;
}

// Size configurations
const sizeConfig: Record<RingSize, { size: number; strokeWidth: number }> = {
  xs: { size: 32, strokeWidth: 3 },
  sm: { size: 48, strokeWidth: 4 },
  md: { size: 72, strokeWidth: 5 },
  lg: { size: 96, strokeWidth: 6 },
  xl: { size: 128, strokeWidth: 8 },
};

// Score-based color thresholds
function getScoreColor(value: number): string {
  if (value >= 90) return '#10b981'; // emerald-500
  if (value >= 70) return '#f59e0b'; // amber-500
  if (value >= 50) return '#f97316'; // orange-500
  return '#ef4444'; // red-500
}

// Score-based color classes for Tailwind
function getScoreColorClass(value: number): string {
  if (value >= 90) return 'text-emerald-500';
  if (value >= 70) return 'text-amber-500';
  if (value >= 50) return 'text-orange-500';
  return 'text-red-500';
}

export function ProgressRing({
  value,
  max = 100,
  size = 'md',
  strokeWidth: customStrokeWidth,
  color,
  autoColor = true,
  animated = true,
  children,
  className = '',
  showTrack = true,
}: ProgressRingProps) {
  const config = sizeConfig[size];
  const svgSize = config.size;
  const strokeWidth = customStrokeWidth ?? config.strokeWidth;

  // Calculate dimensions
  const radius = (svgSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const normalizedValue = Math.min(Math.max(value, 0), max);
  const progress = (normalizedValue / max) * 100;
  const offset = circumference - (progress / 100) * circumference;

  // Determine color
  const progressColor = color ?? (autoColor ? getScoreColor(progress) : '#4f46e5');

  // Create animation style
  const animationStyle = useMemo(() => {
    if (!animated) return {};
    return {
      '--progress-circumference': circumference,
      '--progress-offset': offset,
    } as React.CSSProperties;
  }, [animated, circumference, offset]);

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: svgSize, height: svgSize }}
    >
      <svg
        width={svgSize}
        height={svgSize}
        viewBox={`0 0 ${svgSize} ${svgSize}`}
        className="transform -rotate-90"
      >
        {/* Background track */}
        {showTrack && (
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-200 dark:text-slate-700"
          />
        )}

        {/* Progress ring */}
        <circle
          cx={svgSize / 2}
          cy={svgSize / 2}
          r={radius}
          fill="none"
          stroke={progressColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={animated ? circumference : offset}
          style={animationStyle}
          className={animated ? 'animate-progress-fill' : ''}
        />
      </svg>

      {/* Center content */}
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}

// Export helper functions for external use
export { getScoreColor, getScoreColorClass };
