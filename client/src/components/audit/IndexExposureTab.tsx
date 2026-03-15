import { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, ExternalLink, Search, Lock, ShieldAlert } from 'lucide-react';
import { auditsApi, userApi } from '../../services/api';
import { SeverityBadge } from '../ui/StatusBadge';
import type { Severity } from '../../types/audit.types';

interface IndexExposureFinding {
  id: string;
  rule_id: string;
  rule_name: string;
  severity: string;
  message: string;
  description: string | null;
  recommendation: string | null;
  selector: string | null;
  snippet: string | null;
  help_url: string | null;
  created_at: string;
}

interface IndexExposureData {
  total: number;
  bySeverity: { critical: number; serious: number; moderate: number; minor: number; info: number };
  byCategory: Record<string, number>;
  findings: IndexExposureFinding[];
  scanPerformed: boolean;
}

interface IndexExposureTabProps {
  auditId: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  'config-file': 'Configuration File',
  'env-file': 'Environment File',
  'database': 'Database Export',
  'git': 'Git Repository',
  'log-file': 'Log File',
  'admin-panel': 'Admin Panel',
  'login-page': 'Login Page',
  'phpinfo': 'PHP Info',
  'staging': 'Staging Environment',
  'dev-environment': 'Dev Environment',
  'backup': 'Backup File',
  'debug': 'Debug Endpoint',
  'unknown': 'Sensitive URL',
};

export function IndexExposureTab({ auditId }: IndexExposureTabProps) {
  const [data, setData] = useState<IndexExposureData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFreeUser, setIsFreeUser] = useState(false);
  const [tier, setTier] = useState<string>('free');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [exposureRes, subRes] = await Promise.all([
          auditsApi.getIndexExposure(auditId),
          userApi.getSubscription().catch(() => null),
        ]);
        setData(exposureRes.data);
        const userTier = (subRes?.data?.subscription as any)?.tier || 'free';
        setTier(userTier);
        setIsFreeUser(userTier === 'free' || userTier === 'starter');
      } catch {
        setError('Failed to load index exposure data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [auditId]);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-48 mb-4" />
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32 mb-2" />
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-64" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center text-slate-500 dark:text-slate-500">
        {error}
      </div>
    );
  }

  // Upgrade banner for non-Pro users
  if (isFreeUser) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30">
            <Lock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              Index Exposure Detection
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-500">
              Available on Pro plan and above
            </p>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 mb-4">
          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            What is Index Exposure?
          </h4>
          <p className="text-sm text-slate-600 dark:text-slate-500 mb-3">
            Google dorking detects when sensitive files and pages on your site have been indexed by Google,
            making them discoverable by anyone with a search query.
          </p>
          <ul className="text-sm text-slate-600 dark:text-slate-500 space-y-1.5">
            <li className="flex items-start gap-2">
              <span className="text-indigo-500 mt-0.5">&#8226;</span>
              Exposed .env files, database dumps, and git repositories
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-500 mt-0.5">&#8226;</span>
              Indexed admin panels, login pages, and phpinfo pages
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-500 mt-0.5">&#8226;</span>
              Staging, development, and debug environments visible in search
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-500 mt-0.5">&#8226;</span>
              Cross-referenced with robots.txt to explain why the leak happened
            </li>
          </ul>
        </div>

        <a
          href="/settings/billing"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Upgrade to Pro
        </a>
      </div>
    );
  }

  // No findings state
  if (!data || data.total === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              No Exposed URLs Found
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-500">
              {data?.scanPerformed
                ? 'Google has not indexed any sensitive URLs for this domain.'
                : 'Index exposure scan was not performed for this audit.'}
            </p>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
          <p className="text-sm text-slate-600 dark:text-slate-500">
            This check uses Google Custom Search to detect indexed sensitive files, admin panels,
            staging environments, and other URLs that should not be publicly discoverable.
          </p>
        </div>
      </div>
    );
  }

  // Findings state
  const { total, bySeverity, byCategory, findings } = data;

  return (
    <div className="space-y-6">
      {/* Warning Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30">
            <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              {total} Exposed URL{total !== 1 ? 's' : ''} Found in Google Index
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-500">
              These URLs are indexed by Google and discoverable via search queries
            </p>
          </div>
        </div>

        {/* Severity Breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
          {(['critical', 'serious', 'moderate', 'minor', 'info'] as const).map(sev => (
            <div key={sev} className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 text-center">
              <div className={`text-lg font-bold tabular-nums ${
                bySeverity[sev] > 0
                  ? sev === 'critical' ? 'text-red-600 dark:text-red-400'
                    : sev === 'serious' ? 'text-orange-600 dark:text-orange-400'
                    : sev === 'moderate' ? 'text-amber-600 dark:text-amber-400'
                    : 'text-slate-600 dark:text-slate-500'
                  : 'text-slate-300 dark:text-slate-600'
              }`}>
                {bySeverity[sev]}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-500 capitalize">{sev}</div>
            </div>
          ))}
        </div>

        {/* Category Breakdown */}
        {Object.keys(byCategory).length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-slate-500 dark:text-slate-500 uppercase tracking-wider mb-2">
              By Category
            </h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(byCategory).map(([cat, count]) => (
                <span
                  key={cat}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                >
                  {CATEGORY_LABELS[cat] || cat}
                  <span className="bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                    {count}
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Finding Cards */}
      <div className="space-y-3">
        {findings.map(finding => {
          const category = finding.rule_id.replace('google-indexed-', '');
          return (
            <div
              key={finding.id}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5"
            >
              <div className="flex items-start gap-3 mb-3">
                <SeverityBadge severity={finding.severity as Severity} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex px-2 py-0.5 text-[10px] font-medium rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-500">
                      {CATEGORY_LABELS[category] || category}
                    </span>
                  </div>
                  {finding.selector && (
                    <a
                      href={finding.selector}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-mono text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline break-all flex items-center gap-1"
                    >
                      {finding.selector}
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    </a>
                  )}
                </div>
              </div>

              {finding.description && (
                <p className="text-sm text-slate-600 dark:text-slate-500 mb-3">
                  {finding.description}
                </p>
              )}

              {finding.recommendation && (
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <Search className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-slate-600 dark:text-slate-500">
                      {finding.recommendation}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
