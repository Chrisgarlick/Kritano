/**
 * Email Analytics Dashboard
 *
 * Aggregate email delivery stats with period selector, summary cards,
 * delivery chart, and per-template performance table.
 */

import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { AdminLayout } from '../../../components/layout/AdminLayout';
import { adminApi } from '../../../services/api';
import type { EmailAnalyticsDay, EmailAnalyticsTotals, TemplatePerformanceItem } from '../../../services/api';
import {
  BarChart3, Send, Eye, MousePointerClick, AlertTriangle,
  ArrowUpDown,
} from 'lucide-react';

const PERIODS = [
  { value: 7, label: '7 days' },
  { value: 30, label: '30 days' },
  { value: 90, label: '90 days' },
];

type SortField = 'total_sent' | 'delivery_rate' | 'open_rate' | 'click_rate';

export default function EmailAnalyticsPage() {
  const [days, setDays] = useState(30);
  const [totals, setTotals] = useState<EmailAnalyticsTotals | null>(null);
  const [daily, setDaily] = useState<EmailAnalyticsDay[]>([]);
  const [templates, setTemplates] = useState<TemplatePerformanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [templateSort, setTemplateSort] = useState<SortField>('total_sent');
  const [templateSortDir, setTemplateSortDir] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadAnalytics();
  }, [days]);

  useEffect(() => {
    loadTemplatePerformance();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.getEmailAnalytics(days);
      setTotals(data.totals);
      setDaily(data.daily);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplatePerformance = async () => {
    try {
      const { data } = await adminApi.getTemplatePerformance();
      setTemplates(data.templates);
    } catch (err) {
      console.error('Failed to load template performance:', err);
    }
  };

  const sortedTemplates = [...templates].sort((a, b) => {
    const aVal = Number(a[templateSort]) || 0;
    const bVal = Number(b[templateSort]) || 0;
    return templateSortDir === 'desc' ? bVal - aVal : aVal - bVal;
  });

  const handleTemplateSort = (field: SortField) => {
    if (templateSort === field) {
      setTemplateSortDir(d => d === 'desc' ? 'asc' : 'desc');
    } else {
      setTemplateSort(field);
      setTemplateSortDir('desc');
    }
  };

  const formatRate = (value: number) => `${value.toFixed(1)}%`;

  // Calculate chart bar heights
  const maxSent = Math.max(...daily.map(d => Number(d.sent)), 1);

  return (
    <AdminLayout>
      <Helmet><title>Admin: Email Analytics | Kritano</title></Helmet>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight font-display">Email Analytics</h1>
            <p className="text-sm text-slate-500 mt-1">
              Track delivery rates, opens, clicks, and bounces across all emails.
            </p>
          </div>
          <div className="flex items-center gap-1 bg-white/[0.02] border border-white/[0.06] rounded-lg p-1">
            {PERIODS.map(p => (
              <button
                key={p.value}
                onClick={() => setDays(p.value)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  days === p.value
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-500 hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-white/[0.02] rounded-lg animate-pulse" />
            ))}
          </div>
        ) : totals && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Send className="w-4 h-4 text-indigo-400" />
                <span className="text-xs text-slate-500">Total Sent</span>
              </div>
              <div className="text-2xl font-bold text-white">{totals.sent.toLocaleString()}</div>
            </div>
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-4 h-4 text-green-400" />
                <span className="text-xs text-slate-500">Avg Open Rate</span>
              </div>
              <div className="text-2xl font-bold text-green-400">
                {totals.sent > 0 ? formatRate((totals.opened / totals.sent) * 100) : '—'}
              </div>
            </div>
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <MousePointerClick className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-slate-500">Avg Click Rate</span>
              </div>
              <div className="text-2xl font-bold text-blue-400">
                {totals.sent > 0 ? formatRate((totals.clicked / totals.sent) * 100) : '—'}
              </div>
            </div>
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span className="text-xs text-slate-500">Bounce Rate</span>
              </div>
              <div className="text-2xl font-bold text-red-400">
                {totals.sent > 0 ? formatRate((totals.bounced / totals.sent) * 100) : '—'}
              </div>
            </div>
          </div>
        )}

        {/* Delivery Chart */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-6">
          <h2 className="text-sm font-medium text-slate-300 mb-4">Delivery Over Time</h2>
          {daily.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">No data for this period</div>
          ) : (
            <div className="space-y-2">
              {/* Chart */}
              <div className="flex items-end gap-[2px] h-[200px]">
                {daily.map((day, i) => {
                  const sent = Number(day.sent);
                  const delivered = Number(day.delivered);
                  const bounced = Number(day.bounced);
                  const barHeight = maxSent > 0 ? (sent / maxSent) * 100 : 0;
                  const deliveredHeight = maxSent > 0 ? (delivered / maxSent) * 100 : 0;
                  const bouncedHeight = maxSent > 0 ? (bounced / maxSent) * 100 : 0;

                  return (
                    <div
                      key={i}
                      className="flex-1 flex flex-col items-stretch justify-end gap-0 group relative"
                      title={`${day.date}: ${sent} sent, ${delivered} delivered, ${bounced} bounced`}
                    >
                      {/* Bounced */}
                      {bouncedHeight > 0 && (
                        <div
                          className="bg-red-500/60 rounded-t-sm min-h-[1px]"
                          style={{ height: `${bouncedHeight}%` }}
                        />
                      )}
                      {/* Delivered */}
                      {deliveredHeight > 0 && (
                        <div
                          className="bg-indigo-500 rounded-t-sm min-h-[1px]"
                          style={{ height: `${deliveredHeight}%` }}
                        />
                      )}
                      {/* Remaining sent */}
                      {barHeight > deliveredHeight + bouncedHeight && (
                        <div
                          className="bg-slate-600 rounded-t-sm min-h-[1px]"
                          style={{ height: `${barHeight - deliveredHeight - bouncedHeight}%` }}
                        />
                      )}

                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-10">
                        <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-xs whitespace-nowrap shadow-lg">
                          <div className="text-slate-300 font-medium">{day.date}</div>
                          <div className="text-slate-500 mt-1">Sent: {sent}</div>
                          <div className="text-indigo-400">Delivered: {delivered}</div>
                          <div className="text-red-400">Bounced: {bounced}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center gap-4 pt-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-indigo-500" />
                  <span className="text-xs text-slate-500">Delivered</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-red-500/60" />
                  <span className="text-xs text-slate-500">Bounced</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-slate-600" />
                  <span className="text-xs text-slate-500">Pending</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Template Performance Table */}
        <div className="space-y-3">
          <h2 className="text-lg font-medium text-white">Template Performance</h2>
          {templates.length === 0 ? (
            <div className="text-center py-12 bg-white/[0.02] border border-white/[0.06] rounded-lg">
              <BarChart3 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No email sends recorded yet</p>
            </div>
          ) : (
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Template</th>
                    <th className="text-right text-xs font-medium text-slate-500 px-4 py-3">
                      <button
                        onClick={() => handleTemplateSort('total_sent')}
                        className="flex items-center gap-1 ml-auto hover:text-white transition-colors"
                      >
                        Total Sent
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="text-right text-xs font-medium text-slate-500 px-4 py-3">
                      <button
                        onClick={() => handleTemplateSort('delivery_rate')}
                        className="flex items-center gap-1 ml-auto hover:text-white transition-colors"
                      >
                        Delivery %
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="text-right text-xs font-medium text-slate-500 px-4 py-3">
                      <button
                        onClick={() => handleTemplateSort('open_rate')}
                        className="flex items-center gap-1 ml-auto hover:text-white transition-colors"
                      >
                        Open %
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="text-right text-xs font-medium text-slate-500 px-4 py-3">
                      <button
                        onClick={() => handleTemplateSort('click_rate')}
                        className="flex items-center gap-1 ml-auto hover:text-white transition-colors"
                      >
                        Click %
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTemplates.map((t) => (
                    <tr key={t.template_id} className="border-b border-white/[0.04] hover:bg-white/[0.03]">
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-white">{t.template_name}</div>
                        <div className="text-xs text-slate-500">{t.template_slug}</div>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-slate-300">
                        {Number(t.total_sent).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-sm font-medium ${Number(t.delivery_rate) >= 95 ? 'text-green-400' : Number(t.delivery_rate) >= 80 ? 'text-amber-400' : 'text-red-400'}`}>
                          {formatRate(Number(t.delivery_rate))}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm text-slate-300">{formatRate(Number(t.open_rate))}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm text-slate-300">{formatRate(Number(t.click_rate))}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
