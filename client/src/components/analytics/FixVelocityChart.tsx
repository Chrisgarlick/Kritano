/**
 * FixVelocityChart — Cumulative fixed vs new issues over time.
 * Shows whether you're fixing faster than you're breaking.
 */

import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { format, parseISO } from 'date-fns';

interface VelocityPoint {
  auditId: string;
  completedAt: string;
  cumulativeFixed: number;
  cumulativeNew: number;
  netChange: number;
}

interface FixVelocityChartProps {
  points: VelocityPoint[];
  height?: number;
  onPointClick?: (auditId: string) => void;
}

export function FixVelocityChart({ points, height = 280, onPointClick }: FixVelocityChartProps) {
  const chartData = useMemo(() => {
    return points.map(p => ({
      ...p,
      formattedDate: format(parseISO(p.completedAt), 'MMM d'),
    }));
  }, [points]);

  if (chartData.length < 2) {
    return (
      <div className="flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700" style={{ height }}>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Run multiple audits to see fix velocity</p>
      </div>
    );
  }

  const latestNet = chartData[chartData.length - 1].netChange;
  const isPositive = latestNet > 0;

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const data = payload[0].payload;
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-3 text-sm">
        <p className="font-medium text-slate-900 dark:text-white mb-1">{format(parseISO(data.completedAt), 'MMM d, yyyy')}</p>
        <div className="space-y-0.5">
          <p className="text-emerald-600">Fixed: {data.cumulativeFixed}</p>
          <p className="text-red-500">New: {data.cumulativeNew}</p>
          <p className={`font-medium ${data.netChange > 0 ? 'text-emerald-600' : data.netChange < 0 ? 'text-red-500' : 'text-slate-500'}`}>
            Net: {data.netChange > 0 ? '+' : ''}{data.netChange}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">Fix Velocity</h3>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
          isPositive
            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
        }`}>
          Net: {latestNet > 0 ? '+' : ''}{latestNet} issues
        </span>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart
          data={chartData}
          onClick={(e: any) => {
            if (onPointClick && e?.activePayload?.[0]?.payload?.auditId) {
              onPointClick(e.activePayload[0].payload.auditId);
            }
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="formattedDate" tick={{ fontSize: 11, fill: '#64748b' }} />
          <YAxis tick={{ fontSize: 11, fill: '#64748b' }} width={35} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
          <Area
            type="monotone"
            dataKey="cumulativeFixed"
            stroke="#059669"
            fill="#059669"
            fillOpacity={0.15}
            strokeWidth={2}
            name="Cumulative Fixed"
          />
          <Area
            type="monotone"
            dataKey="cumulativeNew"
            stroke="#dc2626"
            fill="#dc2626"
            fillOpacity={0.1}
            strokeWidth={2}
            name="Cumulative New"
          />
        </AreaChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-emerald-600" /> Cumulative Fixed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-red-600" /> Cumulative New
        </span>
      </div>
    </div>
  );
}
