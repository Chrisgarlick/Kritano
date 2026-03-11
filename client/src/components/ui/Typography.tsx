import { type ReactNode } from 'react';

/**
 * Typography Component System
 *
 * Enforces brand typography throughout the application:
 * - Display: Instrument Serif for hero headlines, page titles, marketing moments
 * - Heading: Outfit 600 weight for section headers
 * - Body: Outfit 400 for paragraph text
 * - Mono: JetBrains Mono for URLs, code, technical data
 */

// =============================================
// Display Component - Instrument Serif
// =============================================

type DisplaySize = '2xl' | 'xl' | 'lg' | 'md' | 'sm' | 'xs';

interface DisplayProps {
  children: ReactNode;
  size?: DisplaySize;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'span' | 'p';
  className?: string;
  italic?: boolean;
}

const displaySizes: Record<DisplaySize, string> = {
  '2xl': 'text-display-2xl',
  'xl': 'text-display-xl',
  'lg': 'text-display-lg',
  'md': 'text-display-md',
  'sm': 'text-display-sm',
  'xs': 'text-display-xs',
};

export function Display({
  children,
  size = 'lg',
  as: Component = 'h1',
  className = '',
  italic = false,
}: DisplayProps) {
  return (
    <Component
      className={`
        font-display ${displaySizes[size]}
        text-slate-900 dark:text-white
        ${italic ? 'italic' : ''}
        ${className}
      `}
    >
      {children}
    </Component>
  );
}

// =============================================
// Heading Component - Outfit Semibold
// =============================================

type HeadingSize = 'xl' | 'lg' | 'md' | 'sm' | 'xs';

interface HeadingProps {
  children: ReactNode;
  size?: HeadingSize;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'span';
  className?: string;
}

const headingSizes: Record<HeadingSize, string> = {
  'xl': 'text-2xl',
  'lg': 'text-xl',
  'md': 'text-lg',
  'sm': 'text-base',
  'xs': 'text-sm',
};

export function Heading({
  children,
  size = 'lg',
  as: Component = 'h2',
  className = '',
}: HeadingProps) {
  return (
    <Component
      className={`
        font-sans font-semibold ${headingSizes[size]}
        text-slate-900 dark:text-white
        ${className}
      `}
    >
      {children}
    </Component>
  );
}

// =============================================
// Body Component - Outfit Regular
// =============================================

type BodySize = 'lg' | 'md' | 'sm' | 'xs';

interface BodyProps {
  children: ReactNode;
  size?: BodySize;
  as?: 'p' | 'span' | 'div';
  className?: string;
  muted?: boolean;
}

const bodySizes: Record<BodySize, string> = {
  'lg': 'text-lg',
  'md': 'text-base',
  'sm': 'text-sm',
  'xs': 'text-xs',
};

export function Body({
  children,
  size = 'md',
  as: Component = 'p',
  className = '',
  muted = false,
}: BodyProps) {
  return (
    <Component
      className={`
        font-sans font-normal ${bodySizes[size]}
        ${muted
          ? 'text-slate-500 dark:text-slate-400'
          : 'text-slate-700 dark:text-slate-300'}
        ${className}
      `}
    >
      {children}
    </Component>
  );
}

// =============================================
// Mono Component - JetBrains Mono
// =============================================

interface MonoProps {
  children: ReactNode;
  size?: 'md' | 'sm' | 'xs';
  as?: 'code' | 'span' | 'pre';
  className?: string;
  highlight?: boolean;
}

const monoSizes: Record<string, string> = {
  'md': 'text-sm',
  'sm': 'text-xs',
  'xs': 'text-[11px]',
};

export function Mono({
  children,
  size = 'sm',
  as: Component = 'code',
  className = '',
  highlight = false,
}: MonoProps) {
  return (
    <Component
      className={`
        font-mono ${monoSizes[size]}
        ${highlight
          ? 'bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-indigo-600 dark:text-indigo-400'
          : 'text-slate-600 dark:text-slate-400'}
        ${className}
      `}
    >
      {children}
    </Component>
  );
}

// =============================================
// Label Component - Small uppercase text
// =============================================

interface LabelProps {
  children: ReactNode;
  className?: string;
}

export function Label({ children, className = '' }: LabelProps) {
  return (
    <span
      className={`
        font-sans font-medium text-xs uppercase tracking-wider
        text-slate-500 dark:text-slate-400
        ${className}
      `}
    >
      {children}
    </span>
  );
}

// =============================================
// Score Number Component - Large serif for scores
// =============================================

interface ScoreNumberProps {
  children: ReactNode;
  size?: 'xl' | 'lg' | 'md' | 'sm';
  className?: string;
}

const scoreNumberSizes: Record<string, string> = {
  'xl': 'text-6xl',
  'lg': 'text-5xl',
  'md': 'text-4xl',
  'sm': 'text-3xl',
};

export function ScoreNumber({
  children,
  size = 'lg',
  className = '',
}: ScoreNumberProps) {
  return (
    <span
      className={`
        font-display font-normal ${scoreNumberSizes[size]}
        text-slate-900 dark:text-white
        tabular-nums
        ${className}
      `}
    >
      {children}
    </span>
  );
}
