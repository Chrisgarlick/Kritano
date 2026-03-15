import {
  Tag,
  AlertTriangle,
  Check,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useState } from 'react';

interface KeywordData {
  keyword: string;
  density: number;
  occurrences: number;
  inTitle: boolean;
  inH1: boolean;
  inFirstParagraph: boolean;
  inMetaDescription: boolean;
  inUrl: boolean;
  inAltText: boolean;
  inLastParagraph: boolean;
  variationsUsed: string[];
  isStuffed: boolean;
}

interface KeywordAnalysisPanelProps {
  keywordData: KeywordData;
  className?: string;
}

// Density color: 1-2% is optimal, <0.5% too low, >3% too high
function getDensityColor(d: number) {
  if (d >= 1 && d <= 2) return 'text-emerald-600 dark:text-emerald-400';
  if (d >= 0.5 && d <= 3) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

function getDensityBarColor(d: number) {
  if (d >= 1 && d <= 2) return 'bg-emerald-500';
  if (d >= 0.5 && d <= 3) return 'bg-amber-500';
  return 'bg-red-500';
}

function getDensityLabel(d: number) {
  if (d >= 1 && d <= 2) return 'Optimal';
  if (d < 0.5) return 'Too Low';
  if (d > 3) return 'Too High';
  return 'Acceptable';
}

export function KeywordAnalysisPanel({ keywordData, className = '' }: KeywordAnalysisPanelProps) {
  const [expanded, setExpanded] = useState(false);

  const placements = [
    { label: 'Title', value: keywordData.inTitle },
    { label: 'H1', value: keywordData.inH1 },
    { label: 'Opening Paragraph', value: keywordData.inFirstParagraph },
    { label: 'Meta Description', value: keywordData.inMetaDescription },
    { label: 'URL', value: keywordData.inUrl },
    { label: 'Alt Text', value: keywordData.inAltText },
    { label: 'Closing Paragraph', value: keywordData.inLastParagraph },
  ];

  const placementCount = placements.filter(p => p.value).length;

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden ${className}`}>
      {/* Header — clickable accordion toggle */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-left cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <Tag className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Keyword Analysis
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-500">
                Placement, density & optimization for <span className="font-medium text-indigo-600 dark:text-indigo-400">{keywordData.keyword}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-500">
              {placementCount}/{placements.length} placements
            </span>
            {expanded ? (
              <ChevronUp className="w-5 h-5 text-slate-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-500" />
            )}
          </div>
        </div>
      </button>

      {/* Content — collapsible */}
      {expanded && (
        <div className="p-5 space-y-5">
          {/* Stuffing Warning */}
          {keywordData.isStuffed && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-700 dark:text-red-400">Keyword Stuffing Detected</p>
                <p className="text-xs text-red-600 dark:text-red-400/80 mt-0.5">
                  The keyword density is unusually high, which may trigger search engine penalties.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Placement Checklist */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
              <h5 className="text-xs font-semibold text-slate-600 dark:text-slate-500 uppercase tracking-wider mb-3">
                Keyword Placement ({placementCount}/{placements.length})
              </h5>
              <div className="space-y-1.5">
                {placements.map((placement) => (
                  <div key={placement.label} className="flex items-center gap-2 py-0.5">
                    {placement.value ? (
                      <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <X className="w-4 h-4 text-slate-300 dark:text-slate-600 flex-shrink-0" />
                    )}
                    <span className={`text-sm ${
                      placement.value
                        ? 'text-slate-700 dark:text-slate-300'
                        : 'text-slate-500 dark:text-slate-500'
                    }`}>
                      {placement.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Density & Stats */}
            <div className="space-y-4">
              {/* Density Meter */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
                <h5 className="text-xs font-semibold text-slate-600 dark:text-slate-500 uppercase tracking-wider mb-3">
                  Keyword Density
                </h5>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className={`text-2xl font-bold ${getDensityColor(keywordData.density)}`}>
                    {keywordData.density.toFixed(2)}%
                  </span>
                  <span className={`text-xs font-medium ${getDensityColor(keywordData.density)}`}>
                    {getDensityLabel(keywordData.density)}
                  </span>
                </div>
                {/* Density bar with optimal range */}
                <div className="relative h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`absolute inset-y-0 left-0 ${getDensityBarColor(keywordData.density)} rounded-full transition-all duration-500`}
                    style={{ width: `${Math.min(100, (keywordData.density / 5) * 100)}%` }}
                  />
                  {/* Optimal range indicator (1-2% mapped to 0-5% scale) */}
                  <div
                    className="absolute inset-y-0 border-l-2 border-r-2 border-emerald-400/50"
                    style={{ left: '20%', right: '60%' }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-500 mt-1">
                  <span>0%</span>
                  <span>1-2% optimal</span>
                  <span>5%+</span>
                </div>
              </div>

              {/* Occurrences */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-xs font-semibold text-slate-600 dark:text-slate-500 uppercase tracking-wider">
                    Occurrences
                  </h5>
                  <span className="text-lg font-bold text-slate-900 dark:text-white">
                    {keywordData.occurrences}
                  </span>
                </div>
                {keywordData.variationsUsed.length > 0 && (
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-500">Variations: </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {keywordData.variationsUsed.map((v, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-500"
                        >
                          {v}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
