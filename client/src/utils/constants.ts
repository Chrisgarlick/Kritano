/**
 * Shared constants for styling and display
 * Extracted from duplicate implementations across components (C1)
 * Updated to follow brand guidelines (indigo primary, slate neutrals, emerald success, amber warning)
 */

import type { AuditStatus } from '../types/audit.types';

// Severity types
export type Severity = 'critical' | 'serious' | 'moderate' | 'minor' | 'info';
export type FindingCategory = 'seo' | 'accessibility' | 'security' | 'performance' | 'content' | 'content-eeat' | 'content-aeo' | 'structured-data';

/**
 * Status colors for audit badges
 */
export const statusColors: Record<AuditStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  discovering: 'bg-sky-100 text-sky-800',
  ready: 'bg-amber-100 text-amber-800',
  processing: 'bg-indigo-100 text-indigo-800',
  completed: 'bg-emerald-100 text-emerald-800',
  failed: 'bg-red-100 text-red-800',
  cancelled: 'bg-slate-100 text-slate-800',
};

/**
 * Status labels for display
 */
export const statusLabels: Record<AuditStatus, string> = {
  pending: 'Pending',
  discovering: 'Discovering',
  ready: 'Ready',
  processing: 'Processing',
  completed: 'Completed',
  failed: 'Failed',
  cancelled: 'Cancelled',
};

/**
 * Status icons for accessibility (A4)
 */
export const statusIcons: Record<AuditStatus, string> = {
  pending: '⏳',
  discovering: '🔍',
  ready: '⏳',
  processing: '🔄',
  completed: '✓',
  failed: '✗',
  cancelled: '⊘',
};

/**
 * Severity colors for finding badges
 */
export const severityColors: Record<Severity, string> = {
  critical: 'bg-red-100 text-red-800 border-red-200',
  serious: 'bg-orange-100 text-orange-800 border-orange-200',
  moderate: 'bg-amber-100 text-amber-800 border-amber-200',
  minor: 'bg-sky-100 text-sky-800 border-sky-200',
  info: 'bg-slate-100 text-slate-800 border-slate-200',
};

/**
 * Severity labels for display
 */
export const severityLabels: Record<Severity, string> = {
  critical: 'Critical',
  serious: 'Serious',
  moderate: 'Moderate',
  minor: 'Minor',
  info: 'Info',
};

/**
 * Category colors for finding badges (per brand guidelines)
 */
export const categoryColors: Record<FindingCategory, string> = {
  seo: 'bg-violet-100 text-violet-800',
  accessibility: 'bg-emerald-100 text-emerald-800',
  security: 'bg-red-100 text-red-800',
  performance: 'bg-sky-100 text-sky-800',
  content: 'bg-amber-100 text-amber-800',
  'content-eeat': 'bg-amber-100 text-amber-800',
  'content-aeo': 'bg-indigo-100 text-indigo-800',
  'structured-data': 'bg-teal-100 text-teal-800',
};

/**
 * Category labels for display
 */
export const categoryLabels: Record<FindingCategory, string> = {
  seo: 'SEO',
  accessibility: 'Accessibility',
  security: 'Security',
  performance: 'Performance',
  content: 'Content',
  'content-eeat': 'E-E-A-T',
  'content-aeo': 'AI Citability',
  'structured-data': 'Structured Data',
};

/**
 * Get score color class based on score value
 */
export function getScoreColor(score: number | null): string {
  if (score === null) return 'text-slate-500';
  if (score >= 90) return 'text-emerald-600';
  if (score >= 70) return 'text-amber-500';
  if (score >= 50) return 'text-orange-500';
  return 'text-red-600';
}

/**
 * Get score background color class based on score value
 */
export function getScoreBgColor(score: number | null): string {
  if (score === null) return 'bg-slate-100';
  if (score >= 90) return 'bg-emerald-100';
  if (score >= 70) return 'bg-amber-100';
  if (score >= 50) return 'bg-orange-100';
  return 'bg-red-100';
}
