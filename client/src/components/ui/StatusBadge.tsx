/**
 * StatusBadge Component
 *
 * Animated status indicators with pulse effects:
 * - Processing: Animated pulse dot
 * - Completed: Checkmark with success flash on mount
 * - Failed: Subtle shake animation
 * - Pending: Fading pulse
 */

import { CheckCircleIcon, XCircleIcon, ClockIcon, ArrowPathIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid';

type StatusType = 'pending' | 'discovering' | 'ready' | 'processing' | 'completed' | 'failed' | 'cancelled';
type BadgeSize = 'xs' | 'sm' | 'md';

interface StatusBadgeProps {
  /** The status to display */
  status: StatusType;
  /** Optional custom label (overrides default) */
  label?: string;
  /** Size of the badge */
  size?: BadgeSize;
  /** Whether to show the icon */
  showIcon?: boolean;
  /** Whether to animate on mount */
  animated?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// Status configurations matching brand guidelines
const statusConfig: Record<StatusType, {
  label: string;
  bgColor: string;
  textColor: string;
  dotColor: string;
  icon: typeof CheckCircleIcon;
  animation?: string;
}> = {
  pending: {
    label: 'Pending',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    textColor: 'text-amber-800 dark:text-amber-300',
    dotColor: 'bg-amber-500',
    icon: ClockIcon,
    animation: 'animate-pulse',
  },
  discovering: {
    label: 'Discovering',
    bgColor: 'bg-sky-100 dark:bg-sky-900/30',
    textColor: 'text-sky-800 dark:text-sky-300',
    dotColor: 'bg-sky-500',
    icon: MagnifyingGlassIcon,
    animation: 'animate-pulse',
  },
  ready: {
    label: 'Ready',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    textColor: 'text-amber-800 dark:text-amber-300',
    dotColor: 'bg-amber-500',
    icon: ClockIcon,
    animation: 'animate-pulse',
  },
  processing: {
    label: 'Processing',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
    textColor: 'text-indigo-800 dark:text-indigo-300',
    dotColor: 'bg-indigo-500',
    icon: ArrowPathIcon,
    animation: 'animate-pulse-glow',
  },
  completed: {
    label: 'Completed',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    textColor: 'text-emerald-800 dark:text-emerald-300',
    dotColor: 'bg-emerald-500',
    icon: CheckCircleIcon,
    animation: 'animate-success-flash',
  },
  failed: {
    label: 'Failed',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    textColor: 'text-red-800 dark:text-red-300',
    dotColor: 'bg-red-500',
    icon: XCircleIcon,
    animation: 'animate-shake',
  },
  cancelled: {
    label: 'Cancelled',
    bgColor: 'bg-slate-100 dark:bg-slate-800',
    textColor: 'text-slate-600 dark:text-slate-500',
    dotColor: 'bg-slate-400',
    icon: XCircleIcon,
    animation: undefined,
  },
};

// Size configurations
const sizeConfig: Record<BadgeSize, {
  padding: string;
  text: string;
  dot: string;
  icon: string;
  gap: string;
}> = {
  xs: { padding: 'px-1.5 py-0.5', text: 'text-xs', dot: 'w-1.5 h-1.5', icon: 'w-3 h-3', gap: 'gap-1' },
  sm: { padding: 'px-2 py-0.5', text: 'text-xs', dot: 'w-2 h-2', icon: 'w-3.5 h-3.5', gap: 'gap-1' },
  md: { padding: 'px-2.5 py-1', text: 'text-sm', dot: 'w-2 h-2', icon: 'w-4 h-4', gap: 'gap-1.5' },
};

export function StatusBadge({
  status,
  label,
  size = 'sm',
  showIcon = true,
  animated = true,
  className = '',
}: StatusBadgeProps) {
  const config = statusConfig[status];
  const sizeConf = sizeConfig[size];

  return (
    <span
      className={`
        inline-flex items-center ${sizeConf.gap} ${sizeConf.padding}
        rounded-full font-medium ${sizeConf.text}
        ${config.bgColor} ${config.textColor}
        ${animated && config.animation ? config.animation : ''}
        ${className}
      `}
    >
      {showIcon && (
        <PulseIndicator status={status} size={size} />
      )}
      <span>{label || config.label}</span>
    </span>
  );
}

// =============================================
// Pulse Indicator - Animated dot
// =============================================

interface PulseIndicatorProps {
  status: StatusType;
  size?: BadgeSize;
  className?: string;
}

export function PulseIndicator({
  status,
  size = 'sm',
  className = '',
}: PulseIndicatorProps) {
  const config = statusConfig[status];
  const sizeConf = sizeConfig[size];

  // Processing status gets a spinning icon instead
  if (status === 'processing') {
    return (
      <ArrowPathIcon
        className={`${sizeConf.icon} animate-spin ${className}`}
      />
    );
  }

  // Discovering status gets a pulsing search icon
  if (status === 'discovering') {
    return (
      <MagnifyingGlassIcon
        className={`${sizeConf.icon} animate-pulse ${className}`}
      />
    );
  }

  // Other statuses get a dot with optional pulse
  return (
    <span className={`relative flex ${sizeConf.dot} ${className}`}>
      {/* Pulse ring for pending/ready */}
      {(status === 'pending' || status === 'ready') && (
        <span
          className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${config.dotColor}`}
        />
      )}
      <span
        className={`relative inline-flex rounded-full h-full w-full ${config.dotColor}`}
      />
    </span>
  );
}

// =============================================
// Severity Badge - For findings
// =============================================

type SeverityType = 'critical' | 'serious' | 'moderate' | 'minor' | 'info';

interface SeverityBadgeProps {
  severity: SeverityType;
  label?: string;
  size?: BadgeSize;
  showDot?: boolean;
  className?: string;
}

const severityConfig: Record<SeverityType, {
  label: string;
  bgColor: string;
  textColor: string;
  dotColor: string;
}> = {
  critical: {
    label: 'Critical',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    textColor: 'text-red-800 dark:text-red-300',
    dotColor: 'bg-red-500',
  },
  serious: {
    label: 'Serious',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    textColor: 'text-orange-800 dark:text-orange-300',
    dotColor: 'bg-orange-500',
  },
  moderate: {
    label: 'Moderate',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    textColor: 'text-amber-800 dark:text-amber-300',
    dotColor: 'bg-amber-500',
  },
  minor: {
    label: 'Minor',
    bgColor: 'bg-sky-100 dark:bg-sky-900/30',
    textColor: 'text-sky-800 dark:text-sky-300',
    dotColor: 'bg-sky-500',
  },
  info: {
    label: 'Info',
    bgColor: 'bg-slate-100 dark:bg-slate-800',
    textColor: 'text-slate-600 dark:text-slate-500',
    dotColor: 'bg-slate-400',
  },
};

export function SeverityBadge({
  severity,
  label,
  size = 'sm',
  showDot = true,
  className = '',
}: SeverityBadgeProps) {
  const config = severityConfig[severity];
  const sizeConf = sizeConfig[size];

  return (
    <span
      className={`
        inline-flex items-center ${sizeConf.gap} ${sizeConf.padding}
        rounded-full font-medium ${sizeConf.text}
        ${config.bgColor} ${config.textColor}
        ${className}
      `}
    >
      {showDot && (
        <span className={`rounded-full ${sizeConf.dot} ${config.dotColor}`} />
      )}
      <span>{label || config.label}</span>
    </span>
  );
}

// =============================================
// Count Badge - For showing counts
// =============================================

interface CountBadgeProps {
  count: number;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  size?: 'xs' | 'sm';
  className?: string;
}

const countVariants = {
  default: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-500',
  primary: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400',
  success: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  warning: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  danger: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
};

export function CountBadge({
  count,
  variant = 'default',
  size = 'sm',
  className = '',
}: CountBadgeProps) {
  const sizeClasses = size === 'xs'
    ? 'min-w-[18px] h-[18px] text-[10px] px-1'
    : 'min-w-[22px] h-[22px] text-xs px-1.5';

  return (
    <span
      className={`
        inline-flex items-center justify-center
        rounded-full font-semibold
        ${sizeClasses}
        ${countVariants[variant]}
        ${className}
      `}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}
