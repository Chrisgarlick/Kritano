import { CATEGORY_LABELS, CATEGORY_COLORS, getScoreColor, type ScoreCategory } from '../../types/analytics.types';

interface ComparisonData {
  url: number | null;
  site: number | null;
  diff: number | null;
}

interface ComparisonBarsProps {
  data: {
    seo: ComparisonData;
    accessibility: ComparisonData;
    security: ComparisonData;
    performance: ComparisonData;
    content?: ComparisonData;
  };
}

function ComparisonBar({ category, data }: { category: ScoreCategory; data: ComparisonData }) {
  const hasData = data.url !== null || data.site !== null;

  return (
    <div className="py-3 border-b border-slate-100 last:border-0">
      <div className="flex items-center justify-between mb-2">
        <span
          className="text-sm font-medium"
          style={{ color: CATEGORY_COLORS[category] }}
        >
          {CATEGORY_LABELS[category]}
        </span>
        {data.diff !== null && (
          <span
            className={`text-sm font-medium px-2 py-0.5 rounded-full ${
              data.diff > 0
                ? 'bg-emerald-100 text-emerald-700'
                : data.diff < 0
                ? 'bg-red-100 text-red-700'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {data.diff > 0 ? '+' : ''}{data.diff}
          </span>
        )}
      </div>

      {hasData ? (
        <div className="space-y-2">
          {/* URL Score Bar */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 w-16">This URL</span>
            <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
              {data.url !== null && (
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${data.url}%`,
                    backgroundColor: getScoreColor(data.url),
                  }}
                />
              )}
            </div>
            <span
              className="text-sm font-semibold w-8 text-right"
              style={{ color: data.url !== null ? getScoreColor(data.url) : '#94a3b8' }}
            >
              {data.url ?? '-'}
            </span>
          </div>

          {/* Site Average Bar */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 w-16">Site Avg</span>
            <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
              {data.site !== null && (
                <div
                  className="h-full rounded-full transition-all duration-300 opacity-60"
                  style={{
                    width: `${data.site}%`,
                    backgroundColor: getScoreColor(data.site),
                  }}
                />
              )}
            </div>
            <span
              className="text-sm font-semibold w-8 text-right opacity-60"
              style={{ color: data.site !== null ? getScoreColor(data.site) : '#94a3b8' }}
            >
              {data.site ?? '-'}
            </span>
          </div>
        </div>
      ) : (
        <div className="text-sm text-slate-400 py-2">No data available</div>
      )}
    </div>
  );
}

export function ComparisonBars({ data }: ComparisonBarsProps) {
  const categories: ScoreCategory[] = ['seo', 'accessibility', 'security', 'performance', 'content'];

  return (
    <div className="divide-y divide-slate-100">
      {categories.map(category => {
        const categoryData = data[category as keyof typeof data];
        if (!categoryData) return null;
        return <ComparisonBar key={category} category={category} data={categoryData} />;
      })}
    </div>
  );
}
