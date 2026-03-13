/**
 * Funnel Analytics Page
 *
 * Visualizes user conversion through the core journey:
 * Registered → Verified Email → First Audit → Domain Verified → Paid Subscriber
 */

import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '../../../components/layout/AdminLayout';
import { adminApi } from '../../../services/api';
import type { AdminFunnelAnalytics, AdminFunnelStage } from '../../../services/api';
import { useToast } from '../../../components/ui/Toast';
import {
  Funnel, RefreshCw, Users, MailCheck, ScanSearch,
  ShieldCheck, CreditCard, ArrowDown, TrendingDown,
} from 'lucide-react';

const RANGE_OPTIONS = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '365d', label: 'Last year' },
];

const STAGE_ICONS = [Users, MailCheck, ScanSearch, ShieldCheck, CreditCard];
const STAGE_COLORS = [
  'from-indigo-500 to-indigo-600',
  'from-blue-500 to-blue-600',
  'from-cyan-500 to-cyan-600',
  'from-teal-500 to-teal-600',
  'from-emerald-500 to-emerald-600',
];

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString();
}

export default function FunnelPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('30d');
  const [data, setData] = useState<AdminFunnelAnalytics | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getFunnelAnalytics(range);
      setData(res.data);
    } catch {
      toast('Failed to load funnel data', 'error');
    } finally {
      setLoading(false);
    }
  }, [range, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const maxCount = data?.stages.reduce((max, s) => Math.max(max, s.count), 0) ?? 1;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10">
              <Funnel className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight" style={{ fontFamily: "'Instrument Serif', serif" }}>Conversion Funnel</h1>
              <p className="text-sm text-slate-400">Track user progression from signup to paid subscriber</p>
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
            {/* Funnel Visualization */}
            <div className="bg-white/[0.01] border border-white/[0.04] rounded-xl p-8">
              <div className="space-y-1">
                {data.stages.map((stage, i) => (
                  <FunnelStageRow
                    key={stage.name}
                    stage={stage}
                    index={i}
                    maxCount={maxCount}
                    isLast={i === data.stages.length - 1}
                  />
                ))}
              </div>
            </div>

            {/* Conversion Drop-off Cards */}
            <div>
              <h2 className="text-lg font-semibold text-white mb-4">Stage-to-Stage Drop-off</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {data.stages.slice(1).map((stage, i) => {
                  const prev = data.stages[i];
                  const dropOff = prev.count > 0 ? prev.count - stage.count : 0;
                  const dropOffPct = prev.count > 0 ? Math.round((dropOff / prev.count) * 1000) / 10 : 0;

                  return (
                    <div key={stage.name} className="bg-white/[0.01] border border-white/[0.04] rounded-xl p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingDown className="w-4 h-4 text-red-400" />
                        <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">
                          {prev.name} → {stage.name}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-red-400">{dropOffPct}%</span>
                        <span className="text-sm text-slate-500">drop-off</span>
                      </div>
                      <p className="text-sm text-slate-400 mt-1">
                        {formatNumber(dropOff)} users lost
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/[0.01] border border-white/[0.04] rounded-xl p-5">
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">Overall Conversion</p>
                <p className="text-3xl font-bold text-indigo-400">
                  {data.stages[0].count > 0
                    ? `${Math.round((data.stages[data.stages.length - 1].count / data.stages[0].count) * 1000) / 10}%`
                    : '0%'}
                </p>
                <p className="text-sm text-slate-500 mt-1">Registered → Paid</p>
              </div>

              <div className="bg-white/[0.01] border border-white/[0.04] rounded-xl p-5">
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">Biggest Drop-off</p>
                {(() => {
                  let maxDrop = 0;
                  let maxDropLabel = '';
                  data.stages.slice(1).forEach((stage, i) => {
                    const prev = data.stages[i];
                    const dropPct = prev.count > 0 ? ((prev.count - stage.count) / prev.count) * 100 : 0;
                    if (dropPct > maxDrop) {
                      maxDrop = dropPct;
                      maxDropLabel = `${prev.name} → ${stage.name}`;
                    }
                  });
                  return (
                    <>
                      <p className="text-3xl font-bold text-red-400">{Math.round(maxDrop * 10) / 10}%</p>
                      <p className="text-sm text-slate-500 mt-1">{maxDropLabel}</p>
                    </>
                  );
                })()}
              </div>

              <div className="bg-white/[0.01] border border-white/[0.04] rounded-xl p-5">
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">Activation Rate</p>
                <p className="text-3xl font-bold text-emerald-400">
                  {data.stages[0].count > 0 && data.stages.length >= 3
                    ? `${Math.round((data.stages[2].count / data.stages[0].count) * 1000) / 10}%`
                    : '0%'}
                </p>
                <p className="text-sm text-slate-500 mt-1">Registered → First Audit</p>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </AdminLayout>
  );
}

function FunnelStageRow({
  stage,
  index,
  maxCount,
  isLast,
}: {
  stage: AdminFunnelStage;
  index: number;
  maxCount: number;
  isLast: boolean;
}) {
  const Icon = STAGE_ICONS[index] ?? Users;
  const colorGradient = STAGE_COLORS[index] ?? STAGE_COLORS[0];
  const widthPct = maxCount > 0 ? Math.max((stage.count / maxCount) * 100, 8) : 8;

  return (
    <div>
      <div className="flex items-center gap-4 py-3">
        {/* Icon */}
        <div className={`flex-shrink-0 p-2 rounded-lg bg-gradient-to-br ${colorGradient} bg-opacity-20`}>
          <Icon className="w-5 h-5 text-white" />
        </div>

        {/* Bar + Label */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-slate-200">{stage.name}</span>
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-white">{formatNumber(stage.count)}</span>
              {stage.conversionFromPrevious !== null && (
                <span className="text-xs font-medium text-slate-400 bg-white/[0.03] px-2 py-0.5 rounded">
                  {stage.conversionFromPrevious}%
                </span>
              )}
            </div>
          </div>
          <div className="h-8 bg-white/[0.02] rounded-lg overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${colorGradient} rounded-lg transition-all duration-700 ease-out`}
              style={{ width: `${widthPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Arrow connector */}
      {!isLast && (
        <div className="flex justify-center py-0.5">
          <ArrowDown className="w-4 h-4 text-slate-600" />
        </div>
      )}
    </div>
  );
}
