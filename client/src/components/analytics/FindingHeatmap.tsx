/**
 * FindingHeatmap - Grid showing pages x categories with severity-coloured cells.
 * Rows = pages, Columns = categories, Cell colour = issue severity.
 */

interface HeatmapPage {
  pageId: string;
  url: string;
  categories: Record<string, { count: number; maxSeverity: string }>;
}

interface FindingHeatmapProps {
  pages: HeatmapPage[];
  onCellClick?: (pageId: string, category: string) => void;
}

const CATEGORIES = ['seo', 'accessibility', 'security', 'performance', 'content'];
const CATEGORY_SHORT: Record<string, string> = {
  seo: 'SEO',
  accessibility: 'A11y',
  security: 'Sec',
  performance: 'Perf',
  content: 'Content',
};

function severityColor(severity: string, count: number): { bg: string; text: string } {
  if (count === 0 || !severity || severity === 'none') {
    return { bg: 'bg-emerald-50 dark:bg-emerald-900/10', text: 'text-emerald-600 dark:text-emerald-400' };
  }
  switch (severity) {
    case 'critical':
      return { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400' };
    case 'serious':
      return { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400' };
    case 'moderate':
      return { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400' };
    case 'minor':
      return { bg: 'bg-sky-50 dark:bg-sky-900/20', text: 'text-sky-700 dark:text-sky-400' };
    default:
      return { bg: 'bg-slate-50 dark:bg-slate-800', text: 'text-slate-500' };
  }
}

function truncateUrl(url: string, maxLength = 40): string {
  try {
    const u = new URL(url);
    const path = u.pathname;
    if (path.length <= maxLength) return path;
    return path.slice(0, maxLength - 3) + '...';
  } catch {
    return url.length > maxLength ? url.slice(0, maxLength - 3) + '...' : url;
  }
}

export function FindingHeatmap({ pages, onCellClick }: FindingHeatmapProps) {
  if (pages.length === 0) {
    return (
      <div className="flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 h-40">
        <p className="text-slate-500 dark:text-slate-400 text-sm">No page data available</p>
      </div>
    );
  }

  // Sort by total issues descending
  const sorted = [...pages].sort((a, b) => {
    const totalA = Object.values(a.categories).reduce((sum, c) => sum + c.count, 0);
    const totalB = Object.values(b.categories).reduce((sum, c) => sum + c.count, 0);
    return totalB - totalA;
  }).slice(0, 30); // Cap at 30 pages

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
      <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Finding Heatmap</h3>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="text-left font-medium text-slate-500 dark:text-slate-400 pb-2 pr-3 min-w-[200px]">Page</th>
              {CATEGORIES.map(cat => (
                <th key={cat} className="text-center font-medium text-slate-500 dark:text-slate-400 pb-2 px-1 w-16">
                  {CATEGORY_SHORT[cat]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map(page => (
              <tr key={page.pageId} className="group">
                <td className="py-0.5 pr-3 font-mono text-slate-600 dark:text-slate-400 truncate max-w-[200px]" title={page.url}>
                  {truncateUrl(page.url)}
                </td>
                {CATEGORIES.map(cat => {
                  const cell = page.categories[cat];
                  const count = cell?.count ?? 0;
                  const severity = cell?.maxSeverity ?? 'none';
                  const { bg, text } = severityColor(severity, count);

                  return (
                    <td key={cat} className="py-0.5 px-1">
                      <button
                        onClick={() => onCellClick?.(page.pageId, cat)}
                        className={`w-full h-7 rounded ${bg} ${text} font-medium flex items-center justify-center transition-opacity hover:opacity-80`}
                      >
                        {count > 0 ? count : '\u2713'}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-3 text-[10px] text-slate-500">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200" /> Clean</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-sky-50 dark:bg-sky-900/20 border border-sky-200" /> Minor</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-100 dark:bg-amber-900/30 border border-amber-200" /> Moderate</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-100 dark:bg-orange-900/30 border border-orange-200" /> Serious</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100 dark:bg-red-900/30 border border-red-200" /> Critical</span>
      </div>
    </div>
  );
}
