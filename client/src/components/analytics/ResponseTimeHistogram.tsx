/**
 * ResponseTimeHistogram — Distribution of page response times.
 * Shows buckets with colour coding (green < 200ms, amber < 500ms, red > 500ms).
 */

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Bucket {
  range: string;
  count: number;
  min: number;
  max: number;
}

interface Stats {
  median: number;
  p75: number;
  p95: number;
  max: number;
  total: number;
}

interface ResponseTimeHistogramProps {
  buckets: Bucket[];
  stats: Stats;
  height?: number;
}

function getBucketColor(min: number): string {
  if (min < 200) return '#059669';  // emerald-600
  if (min < 500) return '#f59e0b';  // amber-500
  return '#dc2626';                  // red-600
}

function formatMs(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.round(ms)}ms`;
}

export function ResponseTimeHistogram({ buckets, stats, height = 240 }: ResponseTimeHistogramProps) {
  if (buckets.length === 0 || stats.total === 0) {
    return (
      <div className="flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700" style={{ height }}>
        <p className="text-slate-500 dark:text-slate-400 text-sm">No response time data available</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const data = payload[0].payload;
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-2 text-xs">
        <p className="font-medium text-slate-900 dark:text-white">{data.range}</p>
        <p className="text-slate-600 dark:text-slate-400">{data.count} page{data.count !== 1 ? 's' : ''}</p>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">Response Times</h3>
        <span className="text-xs text-slate-500">{stats.total} pages</span>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 mb-3">
        {[
          { label: 'Median', value: stats.median },
          { label: 'P75', value: stats.p75 },
          { label: 'P95', value: stats.p95 },
          { label: 'Max', value: stats.max },
        ].map(stat => (
          <div key={stat.label} className="text-center">
            <div className="text-[10px] text-slate-500 uppercase">{stat.label}</div>
            <div className="text-sm font-semibold" style={{ color: getBucketColor(stat.value) }}>
              {formatMs(stat.value)}
            </div>
          </div>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={buckets} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="range" tick={{ fontSize: 10, fill: '#64748b' }} />
          <YAxis tick={{ fontSize: 10, fill: '#64748b' }} width={30} allowDecimals={false} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {buckets.map((bucket, i) => (
              <Cell key={i} fill={getBucketColor(bucket.min)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
