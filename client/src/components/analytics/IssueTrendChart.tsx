import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import type { IssueTrendPoint } from '../../types/analytics.types';
import { SEVERITY_COLORS, CATEGORY_COLORS } from '../../types/analytics.types';

type ViewMode = 'severity' | 'category';

interface IssueTrendChartProps {
  data: IssueTrendPoint[];
  viewMode?: ViewMode;
  height?: number;
}

interface ChartDataPoint {
  period: string;
  formattedPeriod: string;
  critical?: number;
  serious?: number;
  moderate?: number;
  minor?: number;
  seo?: number;
  accessibility?: number;
  security?: number;
  performance?: number;
  total: number;
}

const SEVERITY_LABELS: Record<string, string> = {
  critical: 'Critical',
  serious: 'Serious',
  moderate: 'Moderate',
  minor: 'Minor',
};

const CATEGORY_LABELS: Record<string, string> = {
  seo: 'SEO',
  accessibility: 'Accessibility',
  security: 'Security',
  performance: 'Performance',
};

export function IssueTrendChart({
  data,
  viewMode = 'severity',
  height = 300,
}: IssueTrendChartProps) {
  const chartData = useMemo(() => {
    return data.map(point => ({
      period: point.period,
      formattedPeriod: format(parseISO(point.period), 'MMM d'),
      ...(viewMode === 'severity' ? point.bySeverity : point.byCategory),
      total: point.total,
    }));
  }, [data, viewMode]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const dataPoint = payload[0]?.payload as ChartDataPoint;
    const fullDate = format(parseISO(dataPoint.period), 'MMM d, yyyy');

    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium text-slate-900 dark:text-white mb-2">{fullDate}</p>
        <div className="space-y-1">
          {payload.reverse().map((entry: any) => (
            <div key={entry.dataKey} className="flex items-center justify-between gap-4 text-sm">
              <span className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-slate-600 dark:text-slate-400">
                  {viewMode === 'severity'
                    ? SEVERITY_LABELS[entry.dataKey]
                    : CATEGORY_LABELS[entry.dataKey]}
                </span>
              </span>
              <span className="font-medium text-slate-900 dark:text-white">{entry.value}</span>
            </div>
          ))}
          <div className="pt-1 mt-1 border-t border-slate-100 dark:border-slate-700 flex justify-between">
            <span className="text-slate-600 dark:text-slate-400">Total</span>
            <span className="font-medium text-slate-900 dark:text-white">{dataPoint.total}</span>
          </div>
        </div>
      </div>
    );
  };

  if (chartData.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700"
        style={{ height }}
      >
        <p className="text-slate-500 dark:text-slate-400">No issue data available</p>
      </div>
    );
  }

  const colors: Record<string, string> = viewMode === 'severity' ? SEVERITY_COLORS : CATEGORY_COLORS;
  const labels: Record<string, string> = viewMode === 'severity' ? SEVERITY_LABELS : CATEGORY_LABELS;
  const keys = viewMode === 'severity'
    ? ['minor', 'moderate', 'serious', 'critical']
    : ['performance', 'security', 'accessibility', 'seo'];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={chartData}
        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          dataKey="formattedPeriod"
          tick={{ fontSize: 12, fill: '#64748b' }}
          tickLine={{ stroke: '#e2e8f0' }}
          axisLine={{ stroke: '#e2e8f0' }}
        />
        <YAxis
          tick={{ fontSize: 12, fill: '#64748b' }}
          tickLine={{ stroke: '#e2e8f0' }}
          axisLine={{ stroke: '#e2e8f0' }}
          width={35}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconType="square"
          wrapperStyle={{ paddingTop: '10px' }}
          formatter={(value: string) => (
            <span className="text-sm text-slate-600 dark:text-slate-400">{labels[value]}</span>
          )}
        />
        {keys.map(key => (
          <Bar
            key={key}
            dataKey={key}
            stackId="a"
            fill={colors[key]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
