/**
 * ContentRadar - Spider/radar chart of CQS sub-scores.
 * Quality (25%), E-E-A-T (25%), Readability (20%), Engagement (15%), Structure (15%).
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

interface ContentRadarProps {
  quality: number | null;
  readability: number | null;
  structure: number | null;
  engagement: number | null;
  eeat: number | null;
  overallCqs: number | null;
  height?: number;
}

export function ContentRadar({
  quality,
  readability,
  structure,
  engagement,
  eeat,
  overallCqs,
  height = 280,
}: ContentRadarProps) {
  const data = [
    { subject: 'Quality', value: quality ?? 0, weight: '25%' },
    { subject: 'E-E-A-T', value: eeat ?? 0, weight: '25%' },
    { subject: 'Readability', value: readability ?? 0, weight: '20%' },
    { subject: 'Engagement', value: engagement ?? 0, weight: '15%' },
    { subject: 'Structure', value: structure ?? 0, weight: '15%' },
  ];

  const allNull = quality === null && readability === null && structure === null && engagement === null && eeat === null;

  if (allNull) {
    return (
      <div className="flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700" style={{ height }}>
        <p className="text-slate-500 dark:text-slate-400 text-sm">No content quality data available</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-2 text-xs">
        <p className="font-medium text-slate-900 dark:text-white">{d.subject} ({d.weight})</p>
        <p className="text-slate-600 dark:text-slate-400">Score: {d.value}/100</p>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">Content Quality</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">CQS sub-score breakdown</p>
        </div>
        {overallCqs !== null && (
          <div className="text-right">
            <span className="text-2xl font-bold text-teal-600 dark:text-teal-400">{overallCqs}</span>
            <span className="text-xs text-slate-500 ml-1">/100</span>
          </div>
        )}
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <RadarChart data={data}>
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fontSize: 11, fill: '#64748b' }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fontSize: 9, fill: '#94a3b8' }}
            tickCount={5}
          />
          <Tooltip content={<CustomTooltip />} />
          <Radar
            name="Score"
            dataKey="value"
            stroke="#14b8a6"
            fill="#14b8a6"
            fillOpacity={0.2}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
