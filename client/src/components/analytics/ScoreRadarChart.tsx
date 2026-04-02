import { useMemo } from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { SiteComparisonEntry } from '../../types/analytics.types';

interface ScoreRadarChartProps {
  sites: SiteComparisonEntry[];
  height?: number;
}

const SITE_COLORS = [
  '#4f46e5', // indigo-600
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#06b6d4', // cyan-500
];

const CATEGORY_LABELS: Record<string, string> = {
  seo: 'SEO',
  accessibility: 'Accessibility',
  security: 'Security',
  performance: 'Performance',
  content: 'Content',
  structuredData: 'Schema',
};

export function ScoreRadarChart({ sites, height = 400 }: ScoreRadarChartProps) {
  const chartData = useMemo(() => {
    const categories = ['seo', 'accessibility', 'security', 'performance', 'content', 'structuredData'] as const;

    return categories.map(category => {
      const point: Record<string, any> = {
        category: CATEGORY_LABELS[category],
      };

      sites.forEach(site => {
        point[site.id] = site.latestAudit?.scores[category] ?? 0;
      });

      return point;
    });
  }, [sites]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const category = payload[0]?.payload?.category;

    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium text-slate-900 dark:text-white mb-2">{category}</p>
        <div className="space-y-1">
          {payload.map((entry: any) => {
            const site = sites.find(s => s.id === entry.dataKey);
            return (
              <div key={entry.dataKey} className="flex items-center justify-between gap-4 text-sm">
                <span className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-slate-600 dark:text-slate-400 truncate max-w-[120px]">
                    {site?.name || site?.domain}
                  </span>
                </span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {entry.value !== null && entry.value !== 0 ? entry.value : 'N/A'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (sites.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700"
        style={{ height }}
      >
        <p className="text-slate-500 dark:text-slate-400">No sites to compare</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={chartData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
        <PolarGrid stroke="#e2e8f0" />
        <PolarAngleAxis
          dataKey="category"
          tick={{ fontSize: 12, fill: '#475569' }}
        />
        <PolarRadiusAxis
          angle={30}
          domain={[0, 100]}
          tick={{ fontSize: 10, fill: '#94a3b8' }}
          tickCount={6}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ paddingTop: '20px' }}
          formatter={(value: string) => {
            const site = sites.find(s => s.id === value);
            return (
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {site?.name || site?.domain}
              </span>
            );
          }}
        />
        {sites.map((site, index) => (
          <Radar
            key={site.id}
            name={site.id}
            dataKey={site.id}
            stroke={SITE_COLORS[index % SITE_COLORS.length]}
            fill={SITE_COLORS[index % SITE_COLORS.length]}
            fillOpacity={0.15}
            strokeWidth={2}
          />
        ))}
      </RadarChart>
    </ResponsiveContainer>
  );
}
