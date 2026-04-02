/**
 * Revenue Dashboard Page
 *
 * MRR, ARR, per-tier revenue breakdown, churn metrics, and new subscriber growth.
 * Uses config-driven pricing until Stripe integration is added.
 */

import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { AdminLayout } from '../../../components/layout/AdminLayout';
import { adminApi } from '../../../services/api';
import type { AdminRevenueAnalytics, AdminTierRevenue } from '../../../services/api';
import { useToast } from '../../../components/ui/Toast';
import {
  DollarSign, RefreshCw, TrendingUp, TrendingDown,
  Users, ArrowUpRight, ArrowDownRight, PieChart,
} from 'lucide-react';

const TIER_ORDER = ['free', 'starter', 'pro', 'agency', 'enterprise'];

const TIER_CONFIG: Record<string, { label: string; color: string; bgColor: string; chartColor: string }> = {
  free: { label: 'Free', color: 'text-slate-500', bgColor: 'bg-slate-600', chartColor: '#64748b' },
  starter: { label: 'Starter', color: 'text-blue-400', bgColor: 'bg-blue-600', chartColor: '#3b82f6' },
  pro: { label: 'Pro', color: 'text-indigo-400', bgColor: 'bg-indigo-600', chartColor: '#6366f1' },
  agency: { label: 'Agency', color: 'text-purple-400', bgColor: 'bg-purple-600', chartColor: '#a855f7' },
  enterprise: { label: 'Enterprise', color: 'text-amber-400', bgColor: 'bg-amber-600', chartColor: '#f59e0b' },
};

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 0 }).format(n);
}

function formatNumber(n: number): string {
  return n.toLocaleString();
}

export default function RevenuePage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AdminRevenueAnalytics | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getRevenueAnalytics();
      setData(res.data);
    } catch {
      toast('Failed to load revenue data', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalSubscribers = data
    ? Object.values(data.byTier).reduce((sum, t) => sum + t.count, 0)
    : 0;
  const paidSubscribers = data
    ? Object.entries(data.byTier)
        .filter(([tier]) => tier !== 'free')
        .reduce((sum, [, t]) => sum + t.count, 0)
    : 0;
  const arpu = paidSubscribers > 0 && data ? Math.round((data.mrr / paidSubscribers) * 100) / 100 : 0;

  return (
    <AdminLayout>
      <Helmet><title>Admin: Revenue | Kritano</title></Helmet>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <DollarSign className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight font-display">Revenue Dashboard</h1>
              <p className="text-sm text-slate-500">MRR, ARR, and subscriber metrics</p>
            </div>
          </div>

          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.06] text-slate-300 hover:bg-white/[0.06] disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading && !data ? (
          <div className="flex items-center justify-center py-24">
            <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
          </div>
        ) : data ? (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                label="MRR"
                value={formatCurrency(data.mrr)}
                icon={DollarSign}
                iconColor="text-emerald-400"
                iconBg="bg-emerald-500/10"
              />
              <MetricCard
                label="ARR"
                value={formatCurrency(data.arr)}
                icon={TrendingUp}
                iconColor="text-indigo-400"
                iconBg="bg-indigo-500/10"
              />
              <MetricCard
                label="Paid Subscribers"
                value={formatNumber(paidSubscribers)}
                subtitle={`${formatNumber(totalSubscribers)} total`}
                icon={Users}
                iconColor="text-blue-400"
                iconBg="bg-blue-500/10"
              />
              <MetricCard
                label="ARPU"
                value={formatCurrency(arpu)}
                subtitle="per paid subscriber"
                icon={PieChart}
                iconColor="text-amber-400"
                iconBg="bg-amber-500/10"
              />
            </div>

            {/* Month-over-Month Growth */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/[0.01] border border-white/[0.04] rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <ArrowUpRight className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-sm font-medium text-slate-300 uppercase tracking-wide">New This Month</h3>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-emerald-400">+{data.newThisMonth.count}</span>
                  <span className="text-sm text-slate-500">subscribers</span>
                </div>
                <p className="mt-2 text-sm text-emerald-400/80">
                  +{formatCurrency(data.newThisMonth.mrrGained ?? 0)} MRR gained
                </p>
              </div>

              <div className="bg-white/[0.01] border border-white/[0.04] rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <ArrowDownRight className="w-5 h-5 text-red-400" />
                  <h3 className="text-sm font-medium text-slate-300 uppercase tracking-wide">Churn This Month</h3>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-red-400">-{data.churnThisMonth.count}</span>
                  <span className="text-sm text-slate-500">subscribers</span>
                </div>
                <p className="mt-2 text-sm text-red-400/80">
                  -{formatCurrency(data.churnThisMonth.mrrLost ?? 0)} MRR lost
                </p>
              </div>
            </div>

            {/* Net MRR Change */}
            {(() => {
              const netMrr = (data.newThisMonth.mrrGained ?? 0) - (data.churnThisMonth.mrrLost ?? 0);
              const isPositive = netMrr >= 0;
              return (
                <div className={`bg-white/[0.01] border rounded-xl p-5 ${isPositive ? 'border-emerald-500/30' : 'border-red-500/30'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isPositive ? (
                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-red-400" />
                      )}
                      <span className="text-sm font-medium text-slate-300">Net MRR Change This Month</span>
                    </div>
                    <span className={`text-2xl font-bold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isPositive ? '+' : ''}{formatCurrency(netMrr)}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Tier Breakdown */}
            <div className="bg-white/[0.01] border border-white/[0.04] rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-6">Revenue by Tier</h2>

              {/* Stacked bar showing MRR distribution */}
              {data.mrr > 0 && (
                <div className="mb-6">
                  <div className="flex h-6 rounded-lg overflow-hidden">
                    {TIER_ORDER.filter((t) => t !== 'free' && data.byTier[t]?.mrr > 0).map((tier) => {
                      const tierData = data.byTier[tier];
                      const pct = (tierData.mrr / data.mrr) * 100;
                      const config = TIER_CONFIG[tier];
                      return (
                        <div
                          key={tier}
                          className={`${config.bgColor} transition-all duration-500`}
                          style={{ width: `${pct}%` }}
                          title={`${config.label}: ${formatCurrency(tierData.mrr)} (${Math.round(pct)}%)`}
                        />
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-4 mt-2 flex-wrap">
                    {TIER_ORDER.filter((t) => t !== 'free' && data.byTier[t]?.mrr > 0).map((tier) => {
                      const config = TIER_CONFIG[tier];
                      return (
                        <div key={tier} className="flex items-center gap-1.5 text-xs text-slate-500">
                          <div className={`w-2.5 h-2.5 rounded-sm ${config.bgColor}`} />
                          {config.label}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tier detail cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {TIER_ORDER.map((tier) => {
                  const tierData = data.byTier[tier];
                  if (!tierData) return null;
                  return (
                    <TierRevenueCard key={tier} tier={tier} data={tierData} totalMrr={data.mrr} />
                  );
                })}
              </div>
            </div>

            {/* Note about pricing source */}
            <div className="text-center py-2">
              <p className="text-xs text-slate-500">
                Revenue calculated from config-driven tier pricing. Stripe integration will replace this with real payment data.
              </p>
            </div>
          </>
        ) : null}
      </div>
    </AdminLayout>
  );
}

function MetricCard({
  label,
  value,
  subtitle,
  icon: Icon,
  iconColor,
  iconBg,
}: {
  label: string;
  value: string;
  subtitle?: string;
  icon: typeof DollarSign;
  iconColor: string;
  iconBg: string;
}) {
  return (
    <div className="bg-white/[0.01] border border-white/[0.04] rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className={`p-1.5 rounded-lg ${iconBg}`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
        <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
      {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
    </div>
  );
}

function TierRevenueCard({ tier, data, totalMrr }: { tier: string; data: AdminTierRevenue; totalMrr: number }) {
  const config = TIER_CONFIG[tier] ?? TIER_CONFIG.free;
  const pct = totalMrr > 0 ? Math.round((data.mrr / totalMrr) * 1000) / 10 : 0;

  return (
    <div className="bg-white/[0.02] rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-3 h-3 rounded-full ${config.bgColor}`} />
        <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
      </div>

      <div className="space-y-2">
        <div>
          <span className="text-xl font-bold text-white">{formatNumber(data.count)}</span>
          <span className="text-xs text-slate-500 ml-1">subscribers</span>
        </div>

        <div>
          <span className="text-lg font-bold text-emerald-400">{formatCurrency(data.mrr)}</span>
          <span className="text-xs text-slate-500 ml-1">/ mo</span>
        </div>

        {tier !== 'free' && pct > 0 && (
          <div className="text-xs text-slate-500">{pct}% of MRR</div>
        )}
      </div>
    </div>
  );
}
