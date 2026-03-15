/**
 * Global Trends Page
 *
 * Platform-wide audit trends: top issues, score distributions, tier breakdown.
 * Useful for marketing content and understanding platform health.
 */

import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '../../../components/layout/AdminLayout';
import { adminApi } from '../../../services/api';
import type { AdminGlobalTrends, AdminTopIssue, AdminScoreDistribution, AdminTierAuditBreakdown } from '../../../services/api';
import { useToast } from '../../../components/ui/Toast';
import {
  TrendingUp, RefreshCw, BarChart3, AlertTriangle,
  Shield, Eye, Gauge, Search,
} from 'lucide-react';

const RANGE_OPTIONS = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '365d', label: 'Last year' },
];

const CATEGORY_CONFIG: Record<string, { label: string; icon: typeof TrendingUp; color: string }> = {
  seo: { label: 'SEO', icon: Search, color: 'text-blue-400' },
  accessibility: { label: 'Accessibility', icon: Eye, color: 'text-purple-400' },
  security: { label: 'Security', icon: Shield, color: 'text-red-400' },
  performance: { label: 'Performance', icon: Gauge, color: 'text-amber-400' },
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  serious: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  moderate: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  minor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  info: 'bg-slate-500/20 text-slate-500 border-slate-500/30',
};

const TIER_COLORS: Record<string, string> = {
  free: 'bg-white/[0.06]',
  starter: 'bg-blue-600',
  pro: 'bg-indigo-600',
  agency: 'bg-purple-600',
  enterprise: 'bg-amber-600',
};

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString();
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-400';
  if (score >= 60) return 'text-amber-400';
  if (score >= 40) return 'text-orange-400';
  return 'text-red-400';
}

export default function TrendsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('30d');
  const [data, setData] = useState<AdminGlobalTrends | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getGlobalTrends(range);
      setData(res.data);
    } catch {
      toast('Failed to load trends data', 'error');
    } finally {
      setLoading(false);
    }
  }, [range, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10">
              <TrendingUp className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight" style={{ fontFamily: "'Instrument Serif', serif" }}>Global Trends</h1>
              <p className="text-sm text-slate-500">Platform-wide audit trends and issue patterns</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="px-3 py-2 bg-white/[0.02] border border-white/[0.06] rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            >
              {RANGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            <button
              onClick={fetchData}
              disabled={loading}
              className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.06] text-slate-300 hover:bg-white/[0.06] disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {loading && !data ? (
          <div className="flex items-center justify-center py-24">
            <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
          </div>
        ) : data ? (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/[0.01] border border-white/[0.04] rounded-xl p-5">
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">Audits Completed</p>
                <p className="text-3xl font-bold text-white">{formatNumber(data.totalAuditsCompleted)}</p>
              </div>
              <div className="bg-white/[0.01] border border-white/[0.04] rounded-xl p-5">
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">Pages Scanned</p>
                <p className="text-3xl font-bold text-white">{formatNumber(data.totalPagesScanned)}</p>
              </div>
            </div>

            {/* Score Distribution */}
            <div className="bg-white/[0.01] border border-white/[0.04] rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-400" />
                Score Distribution
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(data.scoreDistribution).map(([cat, dist]) => (
                  <ScoreDistributionCard key={cat} category={cat} distribution={dist} />
                ))}
              </div>
            </div>

            {/* Top Issues */}
            <div className="bg-white/[0.01] border border-white/[0.04] rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                Top Issues ({data.topIssues.length})
              </h2>
              {data.topIssues.length === 0 ? (
                <p className="text-slate-500 text-sm py-4">No issue data available for this period.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/[0.04]">
                        <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide pb-3 pr-4">#</th>
                        <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide pb-3 pr-4">Issue</th>
                        <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide pb-3 pr-4">Category</th>
                        <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide pb-3 pr-4">Severity</th>
                        <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wide pb-3 pr-4">Affected Audits</th>
                        <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wide pb-3">% of Audits</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.topIssues.map((issue, i) => (
                        <TopIssueRow key={issue.ruleId} issue={issue} rank={i + 1} totalAudits={data.totalAuditsCompleted} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Tier Breakdown */}
            <div className="bg-white/[0.01] border border-white/[0.04] rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Tier Breakdown</h2>
              {Object.keys(data.tierBreakdown).length === 0 ? (
                <p className="text-slate-500 text-sm py-4">No tier data available for this period.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {['free', 'starter', 'pro', 'agency', 'enterprise'].map((tier) => {
                    const info = data.tierBreakdown[tier];
                    if (!info) return null;
                    return (
                      <TierBreakdownCard key={tier} tier={tier} data={info} totalAudits={data.totalAuditsCompleted} />
                    );
                  })}
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </AdminLayout>
  );
}

function ScoreDistributionCard({ category, distribution }: { category: string; distribution: AdminScoreDistribution }) {
  const config = CATEGORY_CONFIG[category];
  const Icon = config?.icon ?? BarChart3;

  return (
    <div className="bg-white/[0.02] rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-4 h-4 ${config?.color ?? 'text-slate-500'}`} />
        <span className="text-sm font-medium text-slate-200">{config?.label ?? category}</span>
      </div>

      <div className="flex items-baseline gap-2 mb-3">
        <span className={`text-2xl font-bold ${getScoreColor(distribution.avg)}`}>{distribution.avg}</span>
        <span className="text-xs text-slate-500">avg</span>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">Median</span>
          <span className={`font-medium ${getScoreColor(distribution.median)}`}>{distribution.median}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">P10 (worst)</span>
          <span className={`font-medium ${getScoreColor(distribution.p10)}`}>{distribution.p10}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">P90 (best)</span>
          <span className={`font-medium ${getScoreColor(distribution.p90)}`}>{distribution.p90}</span>
        </div>
      </div>

      {/* Visual range bar */}
      <div className="mt-3 relative h-2 bg-slate-600/50 rounded-full overflow-hidden">
        <div
          className="absolute h-full bg-gradient-to-r from-red-500 via-amber-500 to-green-500 rounded-full opacity-30"
          style={{ left: `${distribution.p10}%`, width: `${Math.max(distribution.p90 - distribution.p10, 2)}%` }}
        />
        <div
          className="absolute h-full w-1 bg-white rounded-full"
          style={{ left: `${distribution.median}%` }}
        />
      </div>
    </div>
  );
}

function TopIssueRow({ issue, rank, totalAudits }: { issue: AdminTopIssue; rank: number; totalAudits: number }) {
  const severityClass = SEVERITY_COLORS[issue.severity] ?? SEVERITY_COLORS.info;
  const barWidth = totalAudits > 0 ? Math.max((issue.affectedAudits / totalAudits) * 100, 2) : 2;

  return (
    <tr className="border-b border-white/[0.03] hover:bg-white/[0.01] transition-colors">
      <td className="py-3 pr-4 text-sm text-slate-500 font-mono">{rank}</td>
      <td className="py-3 pr-4">
        <div className="text-sm text-slate-200 font-medium">{issue.ruleName}</div>
        <code className="text-xs text-slate-500">{issue.ruleId}</code>
      </td>
      <td className="py-3 pr-4">
        <span className="text-xs font-medium text-slate-300 capitalize">{issue.category}</span>
      </td>
      <td className="py-3 pr-4">
        <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded border ${severityClass}`}>
          {issue.severity}
        </span>
      </td>
      <td className="py-3 pr-4 text-right">
        <div>
          <span className="text-sm font-medium text-white">{formatNumber(issue.affectedAudits)}</span>
        </div>
        <div className="mt-1 h-1.5 w-24 bg-white/[0.03] rounded-full overflow-hidden ml-auto">
          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${barWidth}%` }} />
        </div>
      </td>
      <td className="py-3 text-right">
        <span className="text-sm font-bold text-indigo-400">{issue.percentage}%</span>
      </td>
    </tr>
  );
}

function TierBreakdownCard({ tier, data, totalAudits }: { tier: string; data: AdminTierAuditBreakdown; totalAudits: number }) {
  const bgColor = TIER_COLORS[tier] ?? TIER_COLORS.free;
  const pct = totalAudits > 0 ? Math.round((data.audits / totalAudits) * 1000) / 10 : 0;

  return (
    <div className="bg-white/[0.02] rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-3 h-3 rounded-full ${bgColor}`} />
        <span className="text-sm font-medium text-slate-200 capitalize">{tier}</span>
      </div>

      <div className="space-y-2">
        <div>
          <span className="text-2xl font-bold text-white">{formatNumber(data.audits)}</span>
          <span className="text-xs text-slate-500 ml-1">audits ({pct}%)</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Avg Score:</span>
          <span className={`text-sm font-bold ${getScoreColor(data.avgScore)}`}>{data.avgScore}</span>
        </div>

        {/* Mini bar showing percentage of total */}
        <div className="h-1.5 bg-slate-600/50 rounded-full overflow-hidden">
          <div className={`h-full ${bgColor} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}
