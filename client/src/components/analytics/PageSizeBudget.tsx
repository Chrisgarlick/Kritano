/**
 * PageSizeBudget — Horizontal bars showing pages ranked by size with a budget line.
 * Green under budget, red over budget.
 */

interface PageSizeEntry {
  url: string;
  sizeBytes: number;
  overBudget: boolean;
}

interface PageSizeBudgetProps {
  pages: PageSizeEntry[];
  budgetBytes: number;
  stats: { median: number; total: number; overBudgetCount: number };
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

function truncateUrl(url: string, maxLength = 35): string {
  try {
    const u = new URL(url);
    const path = u.pathname;
    if (path.length <= maxLength) return path;
    return path.slice(0, maxLength - 3) + '...';
  } catch {
    return url.length > maxLength ? url.slice(0, maxLength - 3) + '...' : url;
  }
}

export function PageSizeBudget({ pages, budgetBytes, stats }: PageSizeBudgetProps) {
  if (pages.length === 0) {
    return (
      <div className="flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 h-40">
        <p className="text-slate-500 dark:text-slate-400 text-sm">No page size data available</p>
      </div>
    );
  }

  const maxSize = Math.max(...pages.map(p => p.sizeBytes), budgetBytes * 1.2);
  const budgetPct = (budgetBytes / maxSize) * 100;
  const top20 = pages.slice(0, 20);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">Page Sizes</h3>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span>Budget: {formatBytes(budgetBytes)}</span>
          {stats.overBudgetCount > 0 && (
            <span className="text-red-600 dark:text-red-400 font-medium">
              {stats.overBudgetCount} over budget
            </span>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        {top20.map((page, i) => {
          const pct = (page.sizeBytes / maxSize) * 100;
          return (
            <div key={i} className="flex items-center gap-2">
              {/* URL */}
              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 w-32 truncate flex-shrink-0 text-right" title={page.url}>
                {truncateUrl(page.url)}
              </span>

              {/* Bar */}
              <div className="flex-1 relative h-5">
                {/* Budget line */}
                <div
                  className="absolute top-0 bottom-0 w-px bg-slate-400 dark:bg-slate-500 z-10"
                  style={{ left: `${budgetPct}%` }}
                />

                {/* Size bar */}
                <div
                  className={`h-full rounded-r transition-all ${
                    page.overBudget
                      ? 'bg-red-400 dark:bg-red-600'
                      : 'bg-emerald-400 dark:bg-emerald-600'
                  }`}
                  style={{ width: `${pct}%`, minWidth: 4 }}
                />
              </div>

              {/* Size label */}
              <span className={`text-[10px] font-medium w-14 text-right flex-shrink-0 ${
                page.overBudget ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-400'
              }`}>
                {formatBytes(page.sizeBytes)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Stats footer */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/50 text-xs text-slate-500">
        <span>Median: {formatBytes(stats.median)}</span>
        <span>{stats.total} pages total</span>
      </div>
    </div>
  );
}
