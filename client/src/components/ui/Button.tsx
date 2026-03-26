import { type ButtonHTMLAttributes, type ReactNode, forwardRef } from 'react';

/**
 * Button Component
 *
 * Enhanced button system with multiple variants:
 * - primary: Indigo solid (default)
 * - secondary: Slate solid
 * - outline: Border only
 * - ghost: Transparent hover
 * - danger: Red for destructive actions
 * - accent: Amber gradient for CTAs
 * - glow: Primary with pulse glow animation
 */

type ButtonVariant = 'primary' | 'secondary' | 'dark' | 'outline' | 'ghost' | 'danger' | 'accent' | 'glow';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  /** Left icon element */
  leftIcon?: ReactNode;
  /** Right icon element */
  rightIcon?: ReactNode;
  /** Full width button */
  fullWidth?: boolean;
}

const variants: Record<ButtonVariant, string> = {
  primary: `
    bg-indigo-600 text-white
    hover:bg-indigo-700
    focus:ring-indigo-500
    shadow-sm hover:shadow-md
  `,
  secondary: `
    bg-white border border-slate-200
    text-slate-700
    hover:bg-slate-50
    focus:ring-indigo-500
    shadow-sm
  `,
  dark: `
    bg-slate-600 text-white
    hover:bg-slate-700
    focus:ring-slate-500
    shadow-sm
  `,
  outline: `
    border border-slate-300 dark:border-slate-600
    text-slate-700 dark:text-slate-200
    hover:bg-slate-50 dark:hover:bg-slate-800
    hover:border-slate-400 dark:hover:border-slate-500
    focus:ring-indigo-500
  `,
  ghost: `
    text-slate-700 dark:text-slate-200
    hover:bg-slate-100 dark:hover:bg-slate-800
    focus:ring-slate-500
  `,
  danger: `
    bg-red-600 text-white
    hover:bg-red-700
    focus:ring-red-500
    shadow-sm
  `,
  accent: `
    bg-gradient-to-r from-amber-400 to-amber-500
    text-slate-900 font-semibold
    hover:from-amber-500 hover:to-amber-600
    focus:ring-amber-500
    shadow-md shadow-amber-500/25
    hover:shadow-lg hover:shadow-amber-500/30
    hover:-translate-y-0.5
    transition-all
  `,
  glow: `
    bg-indigo-600 text-white
    hover:bg-indigo-700
    focus:ring-indigo-500
    shadow-md shadow-indigo-500/25
    animate-pulse-glow
  `,
};

const sizes: Record<ButtonSize, string> = {
  xs: 'px-2 py-1 text-xs gap-1',
  sm: 'px-3 py-2 text-sm gap-1.5',
  md: 'px-4 py-2.5 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className = '',
      disabled,
      ...props
    },
    ref
  ) {
    const baseStyles = `
      inline-flex items-center justify-center font-medium rounded-lg
      focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900
      disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
      transition-all duration-200
    `;

    return (
      <button
        ref={ref}
        className={`
          ${baseStyles}
          ${variants[variant]}
          ${sizes[size]}
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <LoadingSpinner size={size} />
        ) : leftIcon ? (
          <span className="flex-shrink-0">{leftIcon}</span>
        ) : null}
        {children}
        {!isLoading && rightIcon && (
          <span className="flex-shrink-0">{rightIcon}</span>
        )}
      </button>
    );
  }
);

// =============================================
// Icon Button - For icon-only buttons
// =============================================

interface IconButtonProps extends Omit<ButtonProps, 'leftIcon' | 'rightIcon' | 'children'> {
  icon: ReactNode;
  'aria-label': string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton({ icon, size = 'md', className = '', ...props }, ref) {
    const iconSizes: Record<ButtonSize, string> = {
      xs: 'p-1',
      sm: 'p-1.5',
      md: 'p-2',
      lg: 'p-2.5',
    };

    return (
      <Button
        ref={ref}
        size={size}
        className={`${iconSizes[size]} ${className}`}
        {...props}
      >
        {icon}
      </Button>
    );
  }
);

// =============================================
// Loading Spinner
// =============================================

function LoadingSpinner({ size }: { size: ButtonSize }) {
  const spinnerSizes: Record<ButtonSize, string> = {
    xs: 'h-3 w-3',
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <svg
      className={`animate-spin ${spinnerSizes[size]}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

// =============================================
// Button Group - For grouped buttons
// =============================================

interface ButtonGroupProps {
  children: ReactNode;
  className?: string;
}

export function ButtonGroup({ children, className = '', 'aria-label': ariaLabel }: ButtonGroupProps & { 'aria-label'?: string }) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={`
        inline-flex rounded-lg overflow-hidden
        [&>button]:rounded-none
        [&>button:first-child]:rounded-l-lg
        [&>button:last-child]:rounded-r-lg
        [&>button:not(:last-child)]:border-r
        [&>button:not(:last-child)]:border-r-white/20
        ${className}
      `}
    >
      {children}
    </div>
  );
}
