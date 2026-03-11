/**
 * ScoreChart Component
 *
 * Line chart for displaying score history over time.
 * Uses Recharts with brand styling.
 */

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { Body } from './Typography';

interface ScoreDataPoint {
  /** Date/time of the score */
  date: string;
  /** Score value (0-100) */
  score: number;
  /** Optional label for the data point */
  label?: string;
}

interface ScoreChartProps {
  /** Array of score data points */
  data: ScoreDataPoint[];
  /** Height of the chart in pixels */
  height?: number;
  /** Whether to show the grid lines */
  showGrid?: boolean;
  /** Whether to show the area fill under the line */
  showArea?: boolean;
  /** Chart line color (defaults to indigo) */
  color?: 'indigo' | 'emerald' | 'amber' | 'red';
  /** Show dots on data points */
  showDots?: boolean;
  /** Additional CSS classes */
  className?: string;
}

const colorConfig = {
  indigo: {
    stroke: '#6366f1',
    fill: 'url(#colorIndigo)',
    dot: '#4f46e5',
  },
  emerald: {
    stroke: '#10b981',
    fill: 'url(#colorEmerald)',
    dot: '#059669',
  },
  amber: {
    stroke: '#f59e0b',
    fill: 'url(#colorAmber)',
    dot: '#d97706',
  },
  red: {
    stroke: '#ef4444',
    fill: 'url(#colorRed)',
    dot: '#dc2626',
  },
};

export function ScoreChart({
  data,
  height = 200,
  showGrid = true,
  showArea = true,
  color = 'indigo',
  showDots = true,
  className = '',
}: ScoreChartProps) {
  const colors = colorConfig[color];

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg px-3 py-2">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {formatDate(data.date)}
          </p>
          <p className="text-lg font-semibold text-slate-900 dark:text-white">
            {data.score}
          </p>
          {data.label && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {data.label}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  if (data.length === 0) {
    return (
      <div
        className={`flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-lg ${className}`}
        style={{ height }}
      >
        <Body muted>No score history available</Body>
      </div>
    );
  }

  return (
    <div className={className} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorIndigo" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorEmerald" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorAmber" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorRed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>

          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="currentColor"
              className="text-slate-200 dark:text-slate-700"
              vertical={false}
            />
          )}

          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12 }}
            className="text-slate-500 dark:text-slate-400"
          />

          <YAxis
            domain={[0, 100]}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12 }}
            className="text-slate-500 dark:text-slate-400"
            ticks={[0, 25, 50, 75, 100]}
          />

          <Tooltip content={<CustomTooltip />} />

          {showArea && (
            <Area
              type="monotone"
              dataKey="score"
              stroke={colors.stroke}
              strokeWidth={2}
              fill={colors.fill}
              dot={showDots ? {
                fill: '#fff',
                stroke: colors.dot,
                strokeWidth: 2,
                r: 4,
              } : false}
              activeDot={{
                fill: colors.dot,
                stroke: '#fff',
                strokeWidth: 2,
                r: 6,
              }}
            />
          )}

          {!showArea && (
            <Line
              type="monotone"
              dataKey="score"
              stroke={colors.stroke}
              strokeWidth={2}
              dot={showDots ? {
                fill: '#fff',
                stroke: colors.dot,
                strokeWidth: 2,
                r: 4,
              } : false}
              activeDot={{
                fill: colors.dot,
                stroke: '#fff',
                strokeWidth: 2,
                r: 6,
              }}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// =============================================
// Multi-line Score Chart (for comparing categories)
// =============================================

interface MultiScoreDataPoint {
  date: string;
  seo?: number | null;
  accessibility?: number | null;
  security?: number | null;
  performance?: number | null;
  content?: number | null;
}

interface MultiScoreChartProps {
  data: MultiScoreDataPoint[];
  height?: number;
  showGrid?: boolean;
  categories?: ('seo' | 'accessibility' | 'security' | 'performance' | 'content')[];
  className?: string;
}

const categoryConfig = {
  seo: { color: '#6366f1', name: 'SEO' },
  accessibility: { color: '#10b981', name: 'Accessibility' },
  security: { color: '#ef4444', name: 'Security' },
  performance: { color: '#f59e0b', name: 'Performance' },
  content: { color: '#a855f7', name: 'Content' },
};

export function MultiScoreChart({
  data,
  height = 250,
  showGrid = true,
  categories = ['seo', 'accessibility', 'security', 'performance', 'content'],
  className = '',
}: MultiScoreChartProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg px-3 py-2">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
            {formatDate(data.date)}
          </p>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-xs text-slate-600 dark:text-slate-300">
                    {categoryConfig[entry.dataKey as keyof typeof categoryConfig]?.name || entry.dataKey}
                  </span>
                </div>
                <span className="text-sm font-semibold text-slate-900 dark:text-white tabular-nums">
                  {entry.value ?? '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  if (data.length === 0) {
    return (
      <div
        className={`flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-lg ${className}`}
        style={{ height }}
      >
        <Body muted>No score history available</Body>
      </div>
    );
  }

  return (
    <div className={className} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="currentColor"
              className="text-slate-200 dark:text-slate-700"
              vertical={false}
            />
          )}

          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12 }}
            className="text-slate-500 dark:text-slate-400"
          />

          <YAxis
            domain={[0, 100]}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12 }}
            className="text-slate-500 dark:text-slate-400"
            ticks={[0, 25, 50, 75, 100]}
          />

          <Tooltip content={<CustomTooltip />} />

          {categories.map((category) => (
            <Line
              key={category}
              type="monotone"
              dataKey={category}
              stroke={categoryConfig[category].color}
              strokeWidth={2}
              dot={false}
              activeDot={{
                fill: categoryConfig[category].color,
                stroke: '#fff',
                strokeWidth: 2,
                r: 5,
              }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// =============================================
// Chart Legend
// =============================================

interface ChartLegendProps {
  categories?: ('seo' | 'accessibility' | 'security' | 'performance' | 'content')[];
  className?: string;
}

export function ChartLegend({
  categories = ['seo', 'accessibility', 'security', 'performance', 'content'],
  className = '',
}: ChartLegendProps) {
  return (
    <div className={`flex flex-wrap items-center gap-4 ${className}`}>
      {categories.map((category) => (
        <div key={category} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: categoryConfig[category].color }}
          />
          <span className="text-sm text-slate-600 dark:text-slate-400">
            {categoryConfig[category].name}
          </span>
        </div>
      ))}
    </div>
  );
}

// =============================================
// Sparkline (mini inline chart)
// =============================================

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: 'indigo' | 'emerald' | 'amber' | 'red';
  className?: string;
}

export function Sparkline({
  data,
  width = 80,
  height = 24,
  color = 'indigo',
  className = '',
}: SparklineProps) {
  const colors = colorConfig[color];
  const chartData = data.map((value, index) => ({ index, value }));

  if (data.length < 2) {
    return <div className={className} style={{ width, height }} />;
  }

  return (
    <div className={className} style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={colors.stroke}
            strokeWidth={1.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
