/**
 * HealthPulse - Horizontal segmented bar showing portfolio health distribution.
 * Green (healthy: all scores 80+), Amber (needs work: any 50-79), Red (critical: any <50).
 */

import { useMemo } from 'react';

interface Site {
  id: string;
  name: string;
  domain: string;
  scores: {
    seo: number | null;
    accessibility: number | null;
    security: number | null;
    performance: number | null;
    content: number | null;
    structuredData: number | null;
  };
}

interface HealthPulseProps {
  sites: Site[];
  onSegmentClick?: (status: 'healthy' | 'needs-work' | 'critical', siteIds: string[]) => void;
}

interface HealthBucket {
  status: 'healthy' | 'needs-work' | 'critical';
  label: string;
  color: string;
  bgColor: string;
  sites: Site[];
}

function classifySite(site: Site): 'healthy' | 'needs-work' | 'critical' {
  const scores = [
    site.scores.seo,
    site.scores.accessibility,
    site.scores.security,
    site.scores.performance,
    site.scores.content,
  ].filter((s): s is number => s !== null);

  if (scores.length === 0) return 'needs-work';
  if (scores.some(s => s < 50)) return 'critical';
  if (scores.every(s => s >= 80)) return 'healthy';
  return 'needs-work';
}

export function HealthPulse({ sites, onSegmentClick }: HealthPulseProps) {
  const buckets = useMemo<HealthBucket[]>(() => {
    const healthy: Site[] = [];
    const needsWork: Site[] = [];
    const critical: Site[] = [];

    for (const site of sites) {
      const status = classifySite(site);
      if (status === 'healthy') healthy.push(site);
      else if (status === 'critical') critical.push(site);
      else needsWork.push(site);
    }

    return ([
      { status: 'healthy' as const, label: 'Healthy', color: '#059669', bgColor: '#d1fae5', sites: healthy },
      { status: 'needs-work' as const, label: 'Needs Work', color: '#d97706', bgColor: '#fef3c7', sites: needsWork },
      { status: 'critical' as const, label: 'Critical', color: '#dc2626', bgColor: '#fee2e2', sites: critical },
    ]).filter(b => b.sites.length > 0);
  }, [sites]);

  if (sites.length === 0) return null;

  const total = sites.length;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">Portfolio Health</h3>
        <span className="text-xs text-slate-500">{total} site{total !== 1 ? 's' : ''}</span>
      </div>

      {/* Segmented bar */}
      <div className="flex h-8 rounded-lg overflow-hidden mb-3">
        {buckets.map(bucket => {
          const pct = (bucket.sites.length / total) * 100;
          return (
            <button
              key={bucket.status}
              onClick={() => onSegmentClick?.(bucket.status, bucket.sites.map(s => s.id))}
              className="relative group transition-opacity hover:opacity-90"
              style={{
                width: `${pct}%`,
                backgroundColor: bucket.color,
                minWidth: bucket.sites.length > 0 ? '24px' : '0',
              }}
              title={`${bucket.label}: ${bucket.sites.length} site${bucket.sites.length !== 1 ? 's' : ''}`}
            >
              {pct >= 15 && (
                <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-semibold">
                  {bucket.sites.length}
                </span>
              )}

              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                <div className="bg-slate-900 dark:bg-slate-700 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                  <div className="font-medium mb-1">{bucket.label} ({bucket.sites.length})</div>
                  {bucket.sites.slice(0, 5).map(s => (
                    <div key={s.id} className="text-slate-300">{s.name}</div>
                  ))}
                  {bucket.sites.length > 5 && (
                    <div className="text-slate-400 mt-1">+{bucket.sites.length - 5} more</div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4">
        {buckets.map(bucket => (
          <div key={bucket.status} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: bucket.color }} />
            <span className="text-xs text-slate-600 dark:text-slate-400">
              {bucket.label} ({bucket.sites.length})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
