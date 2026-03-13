import { ExternalLink, Clock } from 'lucide-react';
import type { SiteComparisonEntry } from '../../types/analytics.types';
import { getScoreColor, CATEGORY_LABELS } from '../../types/analytics.types';

interface SiteRankingTableProps {
  sites: SiteComparisonEntry[];
  onSiteClick?: (siteId: string) => void;
}

function calculateOverallScore(scores: {
  seo: number | null;
  accessibility: number | null;
  security: number | null;
  performance: number | null;
  content?: number | null;
  structuredData?: number | null;
}): number | null {
  const validScores = [
    scores.seo,
    scores.accessibility,
    scores.security,
    scores.performance,
    scores.content ?? null,
    scores.structuredData ?? null,
  ].filter((s): s is number => s !== null);

  if (validScores.length === 0) return null;
  return Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length);
}

function ScoreCell({ score }: { score: number | null }) {
  if (score === null) {
    return <span className="text-slate-400">N/A</span>;
  }

  return (
    <span
      className="font-semibold"
      style={{ color: getScoreColor(score) }}
    >
      {score}
    </span>
  );
}

function isStale(dateStr: string): boolean {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  return diffMs > 30 * 24 * 60 * 60 * 1000; // 30 days
}

export function SiteRankingTable({ sites, onSiteClick }: SiteRankingTableProps) {
  // Sort sites by overall score (descending)
  const sortedSites = [...sites].sort((a, b) => {
    const aScore = calculateOverallScore(a.latestAudit?.scores || { seo: null, accessibility: null, security: null, performance: null });
    const bScore = calculateOverallScore(b.latestAudit?.scores || { seo: null, accessibility: null, security: null, performance: null });
    if (aScore === null && bScore === null) return 0;
    if (aScore === null) return 1;
    if (bScore === null) return -1;
    return bScore - aScore;
  });

  if (sites.length === 0) {
    return (
      <div className="p-6 bg-slate-50 rounded-lg border border-slate-200 text-center text-slate-500">
        No sites to compare
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
              Rank
            </th>
            <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
              Site
            </th>
            <th className="text-center py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
              {CATEGORY_LABELS.seo}
            </th>
            <th className="text-center py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
              {CATEGORY_LABELS.accessibility}
            </th>
            <th className="text-center py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
              {CATEGORY_LABELS.security}
            </th>
            <th className="text-center py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
              {CATEGORY_LABELS.performance}
            </th>
            <th className="text-center py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
              {CATEGORY_LABELS.content}
            </th>
            <th className="text-center py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
              {CATEGORY_LABELS.structuredData}
            </th>
            <th className="text-center py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
              Overall
            </th>
            <th className="text-center py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
              Issues
            </th>
            <th className="text-center py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
              Last Audited
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {sortedSites.map((site, index) => {
            const scores = site.latestAudit?.scores || { seo: null, accessibility: null, security: null, performance: null, content: null, structuredData: null };
            const overallScore = calculateOverallScore(scores);
            const completedAt = site.latestAudit?.completedAt;
            const stale = completedAt ? isStale(completedAt) : false;

            return (
              <tr
                key={site.id}
                className={`hover:bg-slate-50 transition-colors ${onSiteClick ? 'cursor-pointer' : ''}`}
                onClick={() => onSiteClick?.(site.id)}
              >
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                    index === 0 ? 'bg-amber-100 text-amber-700' :
                    index === 1 ? 'bg-slate-200 text-slate-700' :
                    index === 2 ? 'bg-amber-50 text-amber-600' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    {index + 1}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div>
                      <div className="text-sm font-medium text-slate-900">
                        {site.name}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        {site.domain}
                        <ExternalLink className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-center">
                  <ScoreCell score={scores.seo} />
                </td>
                <td className="py-3 px-4 text-center">
                  <ScoreCell score={scores.accessibility} />
                </td>
                <td className="py-3 px-4 text-center">
                  <ScoreCell score={scores.security} />
                </td>
                <td className="py-3 px-4 text-center">
                  <ScoreCell score={scores.performance} />
                </td>
                <td className="py-3 px-4 text-center">
                  <ScoreCell score={scores.content ?? null} />
                </td>
                <td className="py-3 px-4 text-center">
                  <ScoreCell score={scores.structuredData ?? null} />
                </td>
                <td className="py-3 px-4 text-center">
                  {overallScore !== null ? (
                    <span
                      className="inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold"
                      style={{
                        backgroundColor: `${getScoreColor(overallScore)}15`,
                        color: getScoreColor(overallScore),
                      }}
                    >
                      {overallScore}
                    </span>
                  ) : (
                    <span className="text-slate-400">N/A</span>
                  )}
                </td>
                <td className="py-3 px-4 text-center">
                  {site.latestAudit ? (
                    <span className="text-sm text-slate-600">
                      {site.latestAudit.totalIssues}
                    </span>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>
                <td className="py-3 px-4 text-center">
                  {completedAt ? (
                    <span className={`inline-flex items-center gap-1 text-xs ${stale ? 'text-amber-600' : 'text-slate-500'}`}>
                      {stale && <Clock className="w-3 h-3" />}
                      {new Date(completedAt).toLocaleDateString()}
                    </span>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
