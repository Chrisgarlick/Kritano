import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import {
  Globe,
  FileSearch,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Plus,
  Activity,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import {
  Display,
  Heading,
  Body,
  Mono,
} from '../../components/ui/Typography';
import {
  StatCard,
  StatGroup,
} from '../../components/ui/StatCard';
import {
  ScoreDisplay,
  CompactScore,
} from '../../components/ui/ScoreDisplay';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { NoAuditsEmptyState } from '../../components/ui/EmptyState';
import { OnboardingChecklist } from '../../components/onboarding/OnboardingChecklist';
import { auditsApi, sitesApi } from '../../services/api';
import type { Audit } from '../../types/audit.types';
import type { SiteWithStats } from '../../types/site.types';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recentAudits, setRecentAudits] = useState<Audit[]>([]);
  const [sites, setSites] = useState<SiteWithStats[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    issues: 0,
    sites: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [auditsResponse, sitesResponse] = await Promise.all([
          auditsApi.list({ limit: 5 }),
          sitesApi.list(),
        ]);
        const audits = auditsResponse.data.audits;
        setRecentAudits(audits);
        setSites(sitesResponse.data.sites);

        // Calculate stats
        const uniqueDomains = new Set(audits.map(a => a.target_domain));
        setStats({
          total: auditsResponse.data.pagination.total,
          completed: audits.filter(a => a.status === 'completed').length,
          issues: audits.reduce((sum, a) => sum + (a.total_issues || 0), 0),
          sites: uniqueDomains.size,
        });
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Helper to calculate overall score from category scores
  const getOverallScore = (audit: Audit): number | null => {
    const scores = [
      audit.seo_score,
      audit.accessibility_score,
      audit.security_score,
      audit.performance_score,
    ].filter((s): s is number => s !== null);

    if (scores.length === 0) return null;
    return Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length);
  };

  // Calculate average score from completed audits
  const completedAudits = recentAudits.filter(a => a.status === 'completed' && getOverallScore(a) !== null);
  const avgScore = completedAudits.length > 0
    ? Math.round(completedAudits.reduce((sum, a) => sum + (getOverallScore(a) || 0), 0) / completedAudits.length)
    : null;

  const handleNewAudit = () => navigate('/audits/new');

  return (
    <DashboardLayout>
      <Helmet><title>Dashboard | Kritano</title></Helmet>
      <div className="dashboard-bg min-h-full">
        {/* Header Section */}
        <div className="mb-8 animate-reveal-up">
          <div className="flex items-start justify-between">
            <div>
              <Display size="sm" as="h1" className="text-slate-900 dark:text-white">
                Welcome back, <span className="italic text-indigo-600 dark:text-indigo-400">{user?.firstName}</span>
              </Display>
              <Body muted className="mt-1">
                Here's the verdict on your sites
              </Body>
            </div>
            <Button
              variant="accent"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={handleNewAudit}
            >
              New Audit
            </Button>
          </div>
        </div>

        {/* Onboarding Checklist */}
        <OnboardingChecklist
          sites={sites}
          audits={recentAudits}
          loading={loading}
        />

        {loading ? (
          <DashboardSkeleton />
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
            <p className="text-red-700 dark:text-red-400">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Retry
            </button>
          </div>
        ) : recentAudits.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12">
            <NoAuditsEmptyState onCreateAudit={handleNewAudit} />
          </div>
        ) : (
          <>
            {/* Health Score Hero */}
            {avgScore !== null && (
              <div className="mb-8 animate-reveal-up stagger-1">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                  <div className="flex items-center gap-8">
                    <ScoreDisplay
                      score={avgScore}
                      label="Overall Health"
                      size="lg"
                      showQualityLabel
                    />
                    <div className="flex-1">
                      <Heading size="md">Your sites are doing well</Heading>
                      <Body muted className="mt-1">
                        Based on {completedAudits.length} completed audit{completedAudits.length !== 1 ? 's' : ''}
                      </Body>
                      <div className="mt-4 flex items-center gap-4">
                        <Link to="/sites" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                          View all sites <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Stats Grid */}
            <div className="mb-8 animate-reveal-up stagger-2">
              <StatGroup columns={4}>
                <StatCard
                  label="Total Audits"
                  value={stats.total}
                  icon={<FileSearch className="w-5 h-5" />}
                  iconBg="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                  onClick={() => navigate('/sites')}
                />
                <StatCard
                  label="Sites Monitored"
                  value={stats.sites}
                  icon={<Globe className="w-5 h-5" />}
                  iconBg="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                  onClick={() => navigate('/sites')}
                />
                <StatCard
                  label="Issues Found"
                  value={stats.issues}
                  icon={<AlertTriangle className="w-5 h-5" />}
                  iconBg="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                />
                <StatCard
                  label="Completed"
                  value={stats.completed}
                  icon={<CheckCircle className="w-5 h-5" />}
                  iconBg="bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400"
                />
              </StatGroup>
            </div>

            {/* Recent Audits */}
            <div className="animate-reveal-up stagger-3">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-slate-500" />
                    <Heading size="sm" as="h3">Recent Audits</Heading>
                  </div>
                  <Link
                    to="/sites"
                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    View all <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                  {recentAudits.map((audit, index) => (
                    <li key={audit.id} className={`animate-reveal-up stagger-${index + 4}`}>
                      <Link
                        to={`/audits/${audit.id}`}
                        className="group block px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 min-w-0">
                            {/* Score indicator */}
                            {getOverallScore(audit) !== null ? (
                              <CompactScore
                                score={getOverallScore(audit)!}
                                className="flex-shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                <Activity className="w-4 h-4 text-slate-500" />
                              </div>
                            )}

                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                {audit.target_domain}
                              </p>
                              <Mono size="xs" className="truncate block">
                                {audit.target_url}
                              </Mono>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 flex-shrink-0">
                            <StatusBadge status={audit.status} size="sm" />
                            {audit.total_issues > 0 && (
                              <span className="text-sm text-slate-500 dark:text-slate-500 tabular-nums">
                                {audit.total_issues} issue{audit.total_issues !== 1 ? 's' : ''}
                              </span>
                            )}
                            <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

// Loading skeleton
function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Hero skeleton */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 h-40 animate-pulse">
        <div className="flex items-center gap-8">
          <div className="w-24 h-24 rounded-full bg-slate-200 dark:bg-slate-700" />
          <div className="flex-1 space-y-3">
            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-48" />
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32" />
          </div>
        </div>
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 animate-pulse"
          >
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-20 mb-3" />
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-16" />
          </div>
        ))}
      </div>

      {/* List skeleton */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-32" />
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 last:border-0 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-40" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-56" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
