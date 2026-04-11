/**
 * Sparkline — Tiny inline SVG line chart for score trends.
 * No dependencies, pure SVG. ~80x24px by default.
 */

import { useMemo } from 'react';
import { getScoreColor } from '../../types/analytics.types';

interface SparklineProps {
  data: (number | null)[];
  width?: number;
  height?: number;
  strokeWidth?: number;
  color?: string;
  showEndDot?: boolean;
  className?: string;
}

export function Sparkline({
  data,
  width = 80,
  height = 24,
  strokeWidth = 1.5,
  color,
  showEndDot = true,
  className = '',
}: SparklineProps) {
  const { points, endPoint, resolvedColor } = useMemo(() => {
    const valid = data.filter((d): d is number => d !== null);
    if (valid.length < 2) return { points: '', endPoint: null, resolvedColor: '#94a3b8' };

    const min = Math.min(...valid);
    const max = Math.max(...valid);
    const range = max - min || 1;
    const padding = 4;
    const innerW = width - padding * 2;
    const innerH = height - padding * 2;

    let idx = 0;
    const coords: [number, number][] = [];
    for (const d of data) {
      if (d !== null) {
        const x = padding + (idx / (valid.length - 1)) * innerW;
        const y = padding + innerH - ((d - min) / range) * innerH;
        coords.push([x, y]);
        idx++;
      }
    }

    const lastVal = valid[valid.length - 1];
    const resolvedColor = color || getScoreColor(lastVal);
    const points = coords.map(([x, y]) => `${x},${y}`).join(' ');
    const endPoint = coords[coords.length - 1];

    return { points, endPoint, resolvedColor };
  }, [data, width, height, color]);

  if (!points) {
    return (
      <svg width={width} height={height} className={className}>
        <line x1={4} y1={height / 2} x2={width - 4} y2={height / 2} stroke="#e2e8f0" strokeWidth={1} strokeDasharray="2 2" />
      </svg>
    );
  }

  return (
    <svg width={width} height={height} className={className}>
      <polyline
        points={points}
        fill="none"
        stroke={resolvedColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {showEndDot && endPoint && (
        <circle cx={endPoint[0]} cy={endPoint[1]} r={2.5} fill={resolvedColor} />
      )}
    </svg>
  );
}
