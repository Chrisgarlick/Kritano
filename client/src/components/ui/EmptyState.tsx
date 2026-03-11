/**
 * EmptyState Component
 *
 * Elegant empty state displays with:
 * - Illustrated icons using brand colors
 * - Serif headlines
 * - Action buttons
 */

import { type ReactNode } from 'react';
import { Button } from './Button';
import { Display, Body } from './Typography';

interface EmptyStateProps {
  /** Icon or illustration to display */
  icon?: ReactNode;
  /** Main headline (uses serif font) */
  title: string;
  /** Description text */
  description?: string;
  /** Primary action button text */
  actionLabel?: string;
  /** Primary action click handler */
  onAction?: () => void;
  /** Secondary action button text */
  secondaryLabel?: string;
  /** Secondary action click handler */
  onSecondaryAction?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

const sizeConfig = {
  sm: {
    container: 'py-8 px-4',
    icon: 'w-12 h-12',
    title: 'xs' as const,
    gap: 'gap-3',
  },
  md: {
    container: 'py-12 px-6',
    icon: 'w-16 h-16',
    title: 'sm' as const,
    gap: 'gap-4',
  },
  lg: {
    container: 'py-16 px-8',
    icon: 'w-20 h-20',
    title: 'md' as const,
    gap: 'gap-5',
  },
};

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondaryAction,
  className = '',
  size = 'md',
}: EmptyStateProps) {
  const config = sizeConfig[size];

  return (
    <div
      className={`
        flex flex-col items-center justify-center text-center
        ${config.container}
        ${className}
      `}
    >
      {/* Icon */}
      {icon && (
        <div className={`${config.icon} text-slate-300 dark:text-slate-600 mb-4`}>
          {icon}
        </div>
      )}

      {/* Title */}
      <Display size={config.title} as="h3" className="text-slate-700 dark:text-slate-300">
        {title}
      </Display>

      {/* Description */}
      {description && (
        <Body muted className="mt-2 max-w-sm">
          {description}
        </Body>
      )}

      {/* Actions */}
      {(actionLabel || secondaryLabel) && (
        <div className={`flex items-center ${config.gap} mt-6`}>
          {actionLabel && onAction && (
            <Button variant="accent" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
          {secondaryLabel && onSecondaryAction && (
            <Button variant="ghost" onClick={onSecondaryAction}>
              {secondaryLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================
// Preset Empty States
// =============================================

// No Audits Empty State
export function NoAuditsEmptyState({ onCreateAudit }: { onCreateAudit?: () => void }) {
  return (
    <EmptyState
      icon={<PulseLineIcon />}
      title="No audits yet"
      description="Run your first audit to see the pulse of your website's health"
      actionLabel="Run First Audit"
      onAction={onCreateAudit}
    />
  );
}

// No Sites Empty State
export function NoSitesEmptyState({ onAddSite }: { onAddSite?: () => void }) {
  return (
    <EmptyState
      icon={<GlobeSearchIcon />}
      title="No sites added"
      description="Add your first website to start monitoring its health"
      actionLabel="Add Your First Site"
      onAction={onAddSite}
    />
  );
}

// No Issues (Celebratory) Empty State
export function NoIssuesEmptyState() {
  return (
    <EmptyState
      icon={<CheckmarkConfettiIcon />}
      title="All clear!"
      description="No issues found. Your site is looking healthy."
      size="sm"
    />
  );
}

// No Team Members Empty State
export function NoTeamEmptyState({ onInvite }: { onInvite?: () => void }) {
  return (
    <EmptyState
      icon={<TeamIcon />}
      title="No team members"
      description="Invite your team to collaborate on website audits"
      actionLabel="Invite Team Member"
      onAction={onInvite}
    />
  );
}

// No API Keys Empty State
export function NoApiKeysEmptyState({ onCreate }: { onCreate?: () => void }) {
  return (
    <EmptyState
      icon={<KeyIcon />}
      title="No API keys"
      description="Create an API key to integrate PagePulser with your workflow"
      actionLabel="Create API Key"
      onAction={onCreate}
    />
  );
}

// Search No Results Empty State
export function NoSearchResultsEmptyState({ query, onClear }: { query: string; onClear?: () => void }) {
  return (
    <EmptyState
      icon={<SearchIcon />}
      title="No results found"
      description={`No results match "${query}". Try a different search term.`}
      actionLabel="Clear Search"
      onAction={onClear}
      size="sm"
    />
  );
}

// =============================================
// Icons - Simple line illustrations
// =============================================

function PulseLineIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full">
      <path
        d="M4 32h12l4-12 6 24 6-16 4 8h12l4-8 4 8h4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-indigo-400"
      />
      <circle cx="32" cy="32" r="28" strokeOpacity="0.2" />
    </svg>
  );
}

function GlobeSearchIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full">
      <circle cx="28" cy="28" r="20" strokeOpacity="0.3" />
      <ellipse cx="28" cy="28" rx="8" ry="20" strokeOpacity="0.3" />
      <path d="M8 28h40" strokeOpacity="0.3" />
      <circle cx="28" cy="28" r="20" className="text-indigo-400" strokeDasharray="4 4" />
      <circle cx="48" cy="48" r="10" className="text-amber-400" />
      <path d="M54 54l6 6" className="text-amber-400" strokeLinecap="round" strokeWidth="3" />
    </svg>
  );
}

function CheckmarkConfettiIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full">
      <circle cx="32" cy="32" r="24" className="text-emerald-400" />
      <path d="M22 32l6 6 14-14" className="text-emerald-400" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
      {/* Confetti */}
      <circle cx="12" cy="12" r="2" fill="currentColor" className="text-amber-400" />
      <circle cx="52" cy="16" r="2" fill="currentColor" className="text-indigo-400" />
      <circle cx="8" cy="40" r="2" fill="currentColor" className="text-emerald-300" />
      <circle cx="56" cy="44" r="2" fill="currentColor" className="text-amber-300" />
      <rect x="48" y="8" width="4" height="4" fill="currentColor" className="text-indigo-300" transform="rotate(45 50 10)" />
      <rect x="6" cy="24" width="4" height="4" fill="currentColor" className="text-amber-300" transform="rotate(45 8 26)" />
    </svg>
  );
}

function TeamIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full">
      <circle cx="32" cy="20" r="10" className="text-indigo-400" />
      <path d="M16 52c0-10 7-16 16-16s16 6 16 16" className="text-indigo-400" strokeLinecap="round" />
      <circle cx="12" cy="24" r="6" strokeOpacity="0.3" />
      <path d="M4 48c0-6 4-10 8-10" strokeOpacity="0.3" strokeLinecap="round" />
      <circle cx="52" cy="24" r="6" strokeOpacity="0.3" />
      <path d="M60 48c0-6-4-10-8-10" strokeOpacity="0.3" strokeLinecap="round" />
    </svg>
  );
}

function KeyIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full">
      <circle cx="20" cy="20" r="12" className="text-indigo-400" />
      <circle cx="20" cy="20" r="4" className="text-indigo-400" />
      <path d="M28 28l24 24M44 44l8 8M48 44l4 4" className="text-amber-400" strokeLinecap="round" strokeWidth="3" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full">
      <circle cx="28" cy="28" r="18" className="text-slate-400" />
      <path d="M42 42l14 14" className="text-slate-400" strokeLinecap="round" strokeWidth="3" />
      <path d="M20 28h16M28 20v16" strokeOpacity="0.3" strokeLinecap="round" />
    </svg>
  );
}
