import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, Link } from 'react-router-dom';
import { Shield, TrendingUp, Accessibility, Zap, FileText, AlertTriangle, Clock, Sparkles } from 'lucide-react';
import { publicReportsApi } from '../../services/api';
import { Body, Display, Heading } from '../../components/ui/Typography';

interface SharedAuditData {
  audit: {
    targetUrl: string;
    targetDomain: string;
    status: string;
    createdAt: string;
    completedAt: string | null;
    pagesFound: number;
    pagesCrawled: number;
    pagesAudited: number;
    scores: {
      seo: number | null;
      accessibility: number | null;
      security: number | null;
      performance: number | null;
      content: number | null;
      cqs?: number | null;
    };
    totalIssues: number;
    criticalIssues: number;
  };
  findingsSummary: Record<string, number>;
  categorySummary: Record<string, number>;
  expiresAt: string;
}

const severityConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  critical: { label: 'Critical', color: 'text-red-700', bgColor: 'bg-red-50 border-red-200' },
  serious: { label: 'Serious', color: 'text-orange-700', bgColor: 'bg-orange-50 border-orange-200' },
  moderate: { label: 'Moderate', color: 'text-amber-700', bgColor: 'bg-amber-50 border-amber-200' },
  minor: { label: 'Minor', color: 'text-blue-700', bgColor: 'bg-blue-50 border-blue-200' },
  info: { label: 'Info', color: 'text-slate-600', bgColor: 'bg-slate-50 border-slate-200' },
};

const categoryConfig: Record<string, { label: string; icon: typeof Shield; color: string }> = {
  seo: { label: 'SEO', icon: TrendingUp, color: 'text-purple-600' },
  accessibility: { label: 'Accessibility', icon: Accessibility, color: 'text-emerald-600' },
  security: { label: 'Security', icon: Shield, color: 'text-red-600' },
  performance: { label: 'Performance', icon: Zap, color: 'text-indigo-600' },
  content: { label: 'Content', icon: FileText, color: 'text-amber-600' },
};

function getScoreColor(score: number | null): string {
  if (score === null) return 'text-slate-400';
  if (score >= 80) return 'text-emerald-600';
  if (score >= 60) return 'text-amber-600';
  return 'text-red-600';
}

function getScoreBg(score: number | null): string {
  if (score === null) return 'bg-slate-50 border-slate-200';
  if (score >= 80) return 'bg-emerald-50 border-emerald-200';
  if (score >= 60) return 'bg-amber-50 border-amber-200';
  return 'bg-red-50 border-red-200';
}

function ScoreCard({ score, label, icon: Icon }: { score: number | null; label: string; icon: typeof Shield }) {
  return (
    <div className={`rounded-xl border p-5 text-center ${getScoreBg(score)}`} aria-label={`${label}: ${score !== null ? `${score} out of 100` : 'not available'}`}>
      <Icon className={`w-5 h-5 mx-auto mb-2 ${getScoreColor(score)}`} />
      <div className={`text-3xl font-bold font-['Instrument_Serif'] ${getScoreColor(score)}`}>
        {score !== null ? score : '--'}
      </div>
      <div className="text-sm text-slate-600 dark:text-slate-400 mt-1 font-['Outfit']">{label}</div>
    </div>
  );
}

export default function SharedReport() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<SharedAuditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    publicReportsApi.get(token)
      .then(res => {
        setData(res.data);
      })
      .catch(err => {
        const status = err?.response?.status;
        if (status === 404) {
          setError('expired');
        } else {
          setError('error');
        }
      })
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin motion-reduce:animate-none" />
      </div>
    );
  }

  if (error === 'expired') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
        <Helmet><title>Report Expired | Kritano</title></Helmet>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm max-w-md w-full p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
            <Clock className="w-6 h-6 text-amber-600" />
          </div>
          <Heading size="md" as="h1" className="text-slate-900 dark:text-white mb-2">Report Link Expired</Heading>
          <Body size="md" className="text-slate-600 dark:text-slate-400 mb-6">
            This shared report link has expired or is no longer available. Shared links are valid for 48 hours.
          </Body>
          <Link
            to="/"
            className="inline-flex items-center justify-center px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            Go to Kritano
          </Link>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
        <Helmet><title>Error | Kritano</title></Helmet>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm max-w-md w-full p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <Heading size="md" as="h1" className="text-slate-900 dark:text-white mb-2">Something went wrong</Heading>
          <Body size="md" className="text-slate-600 dark:text-slate-400 mb-6">
            We could not load this report. Please try again later or contact the person who shared this link.
          </Body>
          <Link
            to="/"
            className="inline-flex items-center justify-center px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            Go to Kritano
          </Link>
        </div>
      </div>
    );
  }

  const { audit, findingsSummary, categorySummary } = data;

  const totalFindingsBySeverity = Object.values(findingsSummary).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Helmet>
        <title>Audit Report: {audit.targetDomain} | Kritano</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm font-['Instrument_Serif']">K</span>
            </div>
            <span className="text-lg font-semibold text-slate-900 dark:text-white font-['Instrument_Serif']">Kritano</span>
          </Link>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-['Outfit'] bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">Shared Report</span>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Title section */}
        <div className="mb-8">
          <Display size="sm" as="h1" className="text-slate-900 dark:text-white mb-1">{audit.targetDomain}</Display>
          <Body size="sm" className="text-slate-500 dark:text-slate-400 font-mono">{audit.targetUrl}</Body>
          <div className="flex items-center gap-4 mt-2 text-sm text-slate-500 dark:text-slate-400 font-['Outfit']">
            {audit.completedAt && (
              <span>Completed {new Date(audit.completedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            )}
            <span>{audit.pagesAudited} page{audit.pagesAudited !== 1 ? 's' : ''} audited</span>
          </div>
        </div>

        {/* Scores grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <ScoreCard score={audit.scores.seo} label="SEO" icon={TrendingUp} />
          <ScoreCard score={audit.scores.accessibility} label="Accessibility" icon={Accessibility} />
          <ScoreCard score={audit.scores.security} label="Security" icon={Shield} />
          <ScoreCard score={audit.scores.performance} label="Performance" icon={Zap} />
          <ScoreCard score={audit.scores.content} label="Content" icon={FileText} />
          {audit.scores.cqs != null && (
            <ScoreCard score={audit.scores.cqs} label="Content Quality" icon={Sparkles} />
          )}
        </div>

        {/* Issues summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* By Severity */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
            <Heading size="xs" as="h2" className="text-slate-900 dark:text-white mb-4">Issues by Severity</Heading>
            {totalFindingsBySeverity === 0 ? (
              <Body size="sm" muted>No issues found.</Body>
            ) : (
              <div className="space-y-3">
                {Object.entries(severityConfig).map(([key, config]) => {
                  const count = findingsSummary[key] || 0;
                  if (count === 0) return null;
                  return (
                    <div key={key} className={`flex items-center justify-between px-4 py-2.5 rounded-lg border ${config.bgColor}`}>
                      <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
                      <span className={`text-sm font-bold ${config.color}`}>{count} unique issue{count !== 1 ? 's' : ''}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* By Category */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
            <Heading size="xs" as="h2" className="text-slate-900 dark:text-white mb-4">Issues by Category</Heading>
            {Object.keys(categorySummary).length === 0 ? (
              <Body size="sm" muted>No issues found.</Body>
            ) : (
              <div className="space-y-3">
                {Object.entries(categoryConfig).map(([key, config]) => {
                  const count = categorySummary[key] || 0;
                  if (count === 0) return null;
                  const Icon = config.icon;
                  return (
                    <div key={key} className="flex items-center justify-between px-4 py-2.5 rounded-lg border border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/50">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${config.color}`} />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{config.label}</span>
                      </div>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{count} unique issue{count !== 1 ? 's' : ''}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Audit metadata */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 mb-8">
          <Heading size="xs" as="h2" className="text-slate-900 dark:text-white mb-4">Audit Summary</Heading>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <Body size="xs" muted className="uppercase tracking-wider">Pages Found</Body>
              <Body size="lg" className="text-slate-900 dark:text-white font-bold">{audit.pagesFound}</Body>
            </div>
            <div>
              <Body size="xs" muted className="uppercase tracking-wider">Pages Crawled</Body>
              <Body size="lg" className="text-slate-900 dark:text-white font-bold">{audit.pagesCrawled}</Body>
            </div>
            <div>
              <Body size="xs" muted className="uppercase tracking-wider">Total Issues</Body>
              <Body size="lg" className="text-slate-900 dark:text-white font-bold">{audit.totalIssues}</Body>
            </div>
            <div>
              <Body size="xs" muted className="uppercase tracking-wider">Critical Issues</Body>
              <Body size="lg" className={`font-bold ${audit.criticalIssues > 0 ? 'text-red-600' : 'text-slate-900 dark:text-white'}`}>{audit.criticalIssues}</Body>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 mt-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 text-center">
          <Body size="sm" className="text-slate-500 dark:text-slate-400 mb-3">
            Powered by <Link to="/" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium">Kritano</Link>
          </Body>
          <Link
            to="/register"
            className="inline-flex items-center justify-center px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            Start auditing your website for free
          </Link>
        </div>
      </footer>
    </div>
  );
}
