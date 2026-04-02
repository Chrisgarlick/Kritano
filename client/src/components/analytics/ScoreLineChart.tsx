import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import type { ScoreDataPoint, ScoreCategory } from '../../types/analytics.types';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '../../types/analytics.types';

interface ScoreLineChartProps {
  data: ScoreDataPoint[];
  categories?: ScoreCategory[];
  height?: number;
  onPointClick?: (auditId: string) => void;
}

interface ChartDataPoint {
  date: string;
  formattedDate: string;
  auditId: string;
  seo: number | null;
  accessibility: number | null;
  security: number | null;
  performance: number | null;
  content: number | null;
  structuredData: number | null;
  cqs: number | null;
}

export function ScoreLineChart({
  data,
  categories = ['seo', 'accessibility', 'security', 'performance', 'content', 'structuredData'],
  height = 300,
  onPointClick,
}: ScoreLineChartProps) {
  const chartData = useMemo(() => {
    return data.map(point => ({
      date: point.completedAt,
      formattedDate: format(parseISO(point.completedAt), 'MMM d'),
      auditId: point.auditId,
      seo: point.seo,
      accessibility: point.accessibility,
      security: point.security,
      performance: point.performance,
      content: point.content ?? null,
      structuredData: point.structuredData ?? null,
      cqs: point.cqs ?? null,
    }));
  }, [data]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const dataPoint = payload[0]?.payload as ChartDataPoint;
    const fullDate = format(parseISO(dataPoint.date), 'MMM d, yyyy h:mm a');

    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium text-slate-900 dark:text-white mb-2">{fullDate}</p>
        <div className="space-y-1">
          {payload.map((entry: any) => (
            <div key={entry.dataKey} className="flex items-center justify-between gap-4 text-sm">
              <span className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-slate-600 dark:text-slate-400">
                  {CATEGORY_LABELS[entry.dataKey as ScoreCategory]}
                </span>
              </span>
              <span className="font-medium text-slate-900 dark:text-white">
                {entry.value !== null ? entry.value : 'N/A'}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const handleClick = (data: any) => {
    if (onPointClick && data?.activePayload?.[0]?.payload?.auditId) {
      onPointClick(data.activePayload[0].payload.auditId);
    }
  };

  if (chartData.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700"
        style={{ height }}
      >
        <p className="text-slate-500 dark:text-slate-400">No score data available</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart
        data={chartData}
        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        onClick={handleClick}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          dataKey="formattedDate"
          tick={{ fontSize: 12, fill: '#64748b' }}
          tickLine={{ stroke: '#e2e8f0' }}
          axisLine={{ stroke: '#e2e8f0' }}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 12, fill: '#64748b' }}
          tickLine={{ stroke: '#e2e8f0' }}
          axisLine={{ stroke: '#e2e8f0' }}
          width={35}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconType="circle"
          wrapperStyle={{ paddingTop: '10px' }}
          formatter={(value: string) => (
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {CATEGORY_LABELS[value as ScoreCategory]}
            </span>
          )}
        />
        {categories.includes('seo') && (
          <Line
            type="monotone"
            dataKey="seo"
            stroke={CATEGORY_COLORS.seo}
            strokeWidth={2}
            dot={{ r: 4, fill: CATEGORY_COLORS.seo }}
            activeDot={{ r: 6, cursor: onPointClick ? 'pointer' : 'default' }}
            connectNulls
          />
        )}
        {categories.includes('accessibility') && (
          <Line
            type="monotone"
            dataKey="accessibility"
            stroke={CATEGORY_COLORS.accessibility}
            strokeWidth={2}
            dot={{ r: 4, fill: CATEGORY_COLORS.accessibility }}
            activeDot={{ r: 6, cursor: onPointClick ? 'pointer' : 'default' }}
            connectNulls
          />
        )}
        {categories.includes('security') && (
          <Line
            type="monotone"
            dataKey="security"
            stroke={CATEGORY_COLORS.security}
            strokeWidth={2}
            dot={{ r: 4, fill: CATEGORY_COLORS.security }}
            activeDot={{ r: 6, cursor: onPointClick ? 'pointer' : 'default' }}
            connectNulls
          />
        )}
        {categories.includes('performance') && (
          <Line
            type="monotone"
            dataKey="performance"
            stroke={CATEGORY_COLORS.performance}
            strokeWidth={2}
            dot={{ r: 4, fill: CATEGORY_COLORS.performance }}
            activeDot={{ r: 6, cursor: onPointClick ? 'pointer' : 'default' }}
            connectNulls
          />
        )}
        {categories.includes('content') && (
          <Line
            type="monotone"
            dataKey="content"
            stroke={CATEGORY_COLORS.content}
            strokeWidth={2}
            dot={{ r: 4, fill: CATEGORY_COLORS.content }}
            activeDot={{ r: 6, cursor: onPointClick ? 'pointer' : 'default' }}
            connectNulls
          />
        )}
        {categories.includes('structuredData') && (
          <Line
            type="monotone"
            dataKey="structuredData"
            stroke={CATEGORY_COLORS.structuredData}
            strokeWidth={2}
            dot={{ r: 4, fill: CATEGORY_COLORS.structuredData }}
            activeDot={{ r: 6, cursor: onPointClick ? 'pointer' : 'default' }}
            connectNulls
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
