/**
 * CategoryRadar Component
 *
 * Radar/Spider chart for displaying category scores.
 * Shows SEO, Accessibility, Security, and Performance in a visual comparison.
 */

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { Body } from './Typography';

interface CategoryScores {
  seo: number | null;
  accessibility: number | null;
  security: number | null;
  performance: number | null;
  content?: number | null;
  structuredData?: number | null;
}

interface CategoryRadarProps {
  /** Category scores */
  scores: CategoryScores;
  /** Size of the chart */
  size?: number;
  /** Whether to show the score values on axes */
  showValues?: boolean;
  /** Fill color (defaults to indigo) */
  color?: 'indigo' | 'emerald' | 'amber';
  /** Additional CSS classes */
  className?: string;
}

const colorConfig = {
  indigo: {
    stroke: '#6366f1',
    fill: 'rgba(99, 102, 241, 0.3)',
  },
  emerald: {
    stroke: '#10b981',
    fill: 'rgba(16, 185, 129, 0.3)',
  },
  amber: {
    stroke: '#f59e0b',
    fill: 'rgba(245, 158, 11, 0.3)',
  },
};

export function CategoryRadar({
  scores,
  size = 250,
  showValues = true,
  color = 'indigo',
  className = '',
}: CategoryRadarProps) {
  const colors = colorConfig[color];

  // Transform scores into chart data format
  const data = [
    { category: 'SEO', value: scores.seo ?? 0, fullMark: 100 },
    { category: 'A11Y', value: scores.accessibility ?? 0, fullMark: 100 },
    { category: 'Security', value: scores.security ?? 0, fullMark: 100 },
    { category: 'Perf', value: scores.performance ?? 0, fullMark: 100 },
    { category: 'Content', value: scores.content ?? 0, fullMark: 100 },
    { category: 'Schema', value: scores.structuredData ?? 0, fullMark: 100 },
  ];

  // Check if we have any valid scores
  const hasScores = Object.values(scores).some(s => s !== null);

  if (!hasScores) {
    return (
      <div
        className={`flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-lg ${className}`}
        style={{ width: size, height: size }}
      >
        <Body muted>No scores available</Body>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg px-3 py-2">
          <p className="text-xs text-slate-500 dark:text-slate-500">
            {data.category}
          </p>
          <p className="text-lg font-semibold text-slate-900 dark:text-white">
            {data.value}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={className} style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
          <PolarGrid
            stroke="currentColor"
            className="text-slate-200 dark:text-slate-700"
          />
          <PolarAngleAxis
            dataKey="category"
            tick={{ fontSize: 12, fill: 'currentColor' }}
            className="text-slate-600 dark:text-slate-500"
          />
          {showValues && (
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: 'currentColor' }}
              className="text-slate-500 dark:text-slate-500"
              tickCount={5}
            />
          )}
          <Tooltip content={<CustomTooltip />} />
          <Radar
            name="Score"
            dataKey="value"
            stroke={colors.stroke}
            fill={colors.fill}
            strokeWidth={2}
            dot={{
              fill: colors.stroke,
              stroke: '#fff',
              strokeWidth: 2,
              r: 4,
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

// =============================================
// Category Comparison (two datasets)
// =============================================

interface CategoryComparisonProps {
  /** Current category scores */
  current: CategoryScores;
  /** Previous/comparison category scores */
  previous?: CategoryScores;
  /** Size of the chart */
  size?: number;
  /** Additional CSS classes */
  className?: string;
}

export function CategoryComparison({
  current,
  previous,
  size = 280,
  className = '',
}: CategoryComparisonProps) {
  // Transform scores into chart data format
  const data = [
    {
      category: 'SEO',
      current: current.seo ?? 0,
      previous: previous?.seo ?? 0,
      fullMark: 100,
    },
    {
      category: 'A11Y',
      current: current.accessibility ?? 0,
      previous: previous?.accessibility ?? 0,
      fullMark: 100,
    },
    {
      category: 'Security',
      current: current.security ?? 0,
      previous: previous?.security ?? 0,
      fullMark: 100,
    },
    {
      category: 'Perf',
      current: current.performance ?? 0,
      previous: previous?.performance ?? 0,
      fullMark: 100,
    },
    {
      category: 'Content',
      current: current.content ?? 0,
      previous: previous?.content ?? 0,
      fullMark: 100,
    },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg px-3 py-2">
          <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
            {data.category}
          </p>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500" />
                <span className="text-xs text-slate-500">Current</span>
              </div>
              <span className="text-sm font-semibold text-slate-900 dark:text-white">
                {data.current}
              </span>
            </div>
            {previous && (
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-slate-400" />
                  <span className="text-xs text-slate-500">Previous</span>
                </div>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  {data.previous}
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={className} style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
          <PolarGrid
            stroke="currentColor"
            className="text-slate-200 dark:text-slate-700"
          />
          <PolarAngleAxis
            dataKey="category"
            tick={{ fontSize: 12, fill: 'currentColor' }}
            className="text-slate-600 dark:text-slate-500"
          />
          <Tooltip content={<CustomTooltip />} />

          {/* Previous scores (background) */}
          {previous && (
            <Radar
              name="Previous"
              dataKey="previous"
              stroke="#94a3b8"
              fill="rgba(148, 163, 184, 0.2)"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
            />
          )}

          {/* Current scores (foreground) */}
          <Radar
            name="Current"
            dataKey="current"
            stroke="#6366f1"
            fill="rgba(99, 102, 241, 0.3)"
            strokeWidth={2}
            dot={{
              fill: '#6366f1',
              stroke: '#fff',
              strokeWidth: 2,
              r: 4,
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

// =============================================
// Compact Category Bars (alternative to radar)
// =============================================

interface CategoryBarsProps {
  scores: CategoryScores;
  showLabels?: boolean;
  className?: string;
}

export function CategoryBars({
  scores,
  showLabels = true,
  className = '',
}: CategoryBarsProps) {
  const categories = [
    { key: 'seo', label: 'SEO', color: 'bg-indigo-500', value: scores.seo },
    { key: 'accessibility', label: 'A11Y', color: 'bg-emerald-500', value: scores.accessibility },
    { key: 'security', label: 'Security', color: 'bg-red-500', value: scores.security },
    { key: 'performance', label: 'Perf', color: 'bg-amber-500', value: scores.performance },
    { key: 'content', label: 'Content', color: 'bg-purple-500', value: scores.content },
  ];

  return (
    <div className={`space-y-3 ${className}`}>
      {categories.map((cat) => (
        <div key={cat.key}>
          {showLabels && (
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-slate-600 dark:text-slate-500">{cat.label}</span>
              <span className="text-sm font-semibold text-slate-900 dark:text-white tabular-nums">
                {cat.value ?? '—'}
              </span>
            </div>
          )}
          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full ${cat.color} rounded-full transition-all duration-500`}
              style={{ width: cat.value !== null ? `${cat.value}%` : '0%' }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// =============================================
// Issue Severity Donut
// =============================================

interface SeverityData {
  critical: number;
  serious: number;
  moderate: number;
  minor: number;
  info?: number;
}

interface SeverityDonutProps {
  data: SeverityData;
  size?: number;
  className?: string;
}

export function SeverityDonut({
  data,
  size = 160,
  className = '',
}: SeverityDonutProps) {
  const total = data.critical + data.serious + data.moderate + data.minor + (data.info || 0);

  if (total === 0) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
      >
        <div className="text-center">
          <div className="text-3xl font-semibold text-emerald-600 dark:text-emerald-400">0</div>
          <div className="text-sm text-slate-500 dark:text-slate-500">No issues</div>
        </div>
      </div>
    );
  }

  // Calculate stroke dash values for the donut segments
  const circumference = 2 * Math.PI * 45; // radius = 45
  const segments = [
    { key: 'critical', value: data.critical, color: '#ef4444' },
    { key: 'serious', value: data.serious, color: '#f97316' },
    { key: 'moderate', value: data.moderate, color: '#f59e0b' },
    { key: 'minor', value: data.minor, color: '#0ea5e9' },
    { key: 'info', value: data.info || 0, color: '#64748b' },
  ];

  let currentOffset = 0;

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          className="text-slate-200 dark:text-slate-700"
        />

        {/* Segments */}
        {segments.map((segment) => {
          if (segment.value === 0) return null;
          const percentage = segment.value / total;
          const strokeLength = percentage * circumference;
          const offset = currentOffset;
          currentOffset += strokeLength;

          return (
            <circle
              key={segment.key}
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={segment.color}
              strokeWidth="10"
              strokeDasharray={`${strokeLength} ${circumference - strokeLength}`}
              strokeDashoffset={-offset}
              className="transition-all duration-500"
            />
          );
        })}
      </svg>

      {/* Center text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-semibold text-slate-900 dark:text-white">{total}</div>
          <div className="text-xs text-slate-500 dark:text-slate-500">issues</div>
        </div>
      </div>
    </div>
  );
}

// =============================================
// Severity Legend
// =============================================

interface SeverityLegendProps {
  data: SeverityData;
  className?: string;
}

export function SeverityLegend({ data, className = '' }: SeverityLegendProps) {
  const items = [
    { key: 'critical', label: 'Critical', color: 'bg-red-500', value: data.critical },
    { key: 'serious', label: 'Serious', color: 'bg-orange-500', value: data.serious },
    { key: 'moderate', label: 'Moderate', color: 'bg-amber-500', value: data.moderate },
    { key: 'minor', label: 'Minor', color: 'bg-sky-500', value: data.minor },
    ...(data.info ? [{ key: 'info', label: 'Info', color: 'bg-slate-500', value: data.info }] : []),
  ];

  return (
    <div className={`space-y-2 ${className}`}>
      {items.map((item) => (
        <div key={item.key} className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${item.color}`} />
            <span className="text-sm text-slate-600 dark:text-slate-500">{item.label}</span>
          </div>
          <span className="text-sm font-semibold text-slate-900 dark:text-white tabular-nums">
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}
