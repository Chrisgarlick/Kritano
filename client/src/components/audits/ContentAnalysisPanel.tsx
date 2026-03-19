/**
 * ContentAnalysisPanel Component
 *
 * Displays comprehensive content analysis metrics including
 * subscores, readability gauge, and content quality indicators.
 */

import { useState } from 'react';
import {
  BookOpen,
  FileText,
  List,
  MessageSquare,
  Clock,
  BarChart3,
  AlignLeft,
  Type,
  Shield,
  User,
  Brain,
  Award,
  ShieldCheck,
  Check,
  X,
  Bot,
  Search,
  Database,
  Link2,
  ChevronDown,
  ChevronUp,
  Quote,
  Lock,
  Info,
} from 'lucide-react';

interface ContentMetrics {
  // Subscores
  content_quality_score?: number | null;
  content_readability_score?: number | null;
  content_structure_score?: number | null;
  content_engagement_score?: number | null;
  // E-E-A-T metrics
  eeat_score?: number | null;
  eeat_experience_score?: number | null;
  eeat_expertise_score?: number | null;
  eeat_authoritativeness_score?: number | null;
  eeat_trustworthiness_score?: number | null;
  has_author_bio?: boolean | null;
  has_author_credentials?: boolean | null;
  citation_count?: number | null;
  has_contact_info?: boolean | null;
  has_privacy_policy?: boolean | null;
  has_terms_of_service?: boolean | null;
  eeat_tier?: string | null;
  eeat_evidence?: Array<{ pillar: string; type: string; label: string; text?: string }> | null;
  // AEO metrics
  aeo_score?: number | null;
  aeo_nugget_score?: number | null;
  aeo_factual_density_score?: number | null;
  aeo_source_authority_score?: number | null;
  aeo_tier?: string | null;
  aeo_nuggets?: Array<{ text: string; type: string; wordCount: number }> | null;
  aeo_content_frontloaded?: boolean | null;
  aeo_content_frontloading_ratio?: number | null;
  // Readability metrics
  flesch_kincaid_grade?: number | null;
  flesch_reading_ease?: number | null;
  // Other metrics
  word_count?: number | null;
  reading_time_minutes?: number | null;
  detected_content_type?: string | null;
}

interface ContentFinding {
  ruleId: string;
  ruleName: string;
  severity: string;
  message: string;
  description?: string | null;
  recommendation?: string | null;
}

interface ContentAnalysisPanelProps {
  metrics: ContentMetrics;
  contentScore: number | null;
  eeatFindings?: ContentFinding[];
  aeoFindings?: ContentFinding[];
  className?: string;
}

// Reading level descriptions
function getReadingLevel(grade: number | null | undefined): { level: string; audience: string; color: string } {
  if (grade === null || grade === undefined) {
    return { level: 'Unknown', audience: 'N/A', color: 'text-slate-500' };
  }
  if (grade <= 6) return { level: 'Very Easy', audience: 'Elementary', color: 'text-emerald-600' };
  if (grade <= 8) return { level: 'Easy', audience: 'Middle School', color: 'text-emerald-500' };
  if (grade <= 10) return { level: 'Standard', audience: 'High School', color: 'text-blue-500' };
  if (grade <= 12) return { level: 'Moderate', audience: 'High School+', color: 'text-amber-500' };
  if (grade <= 16) return { level: 'Difficult', audience: 'College', color: 'text-orange-500' };
  return { level: 'Very Difficult', audience: 'Academic', color: 'text-red-500' };
}

// Flesch Reading Ease interpretation
function getFleschEaseLevel(score: number | null | undefined): { label: string; color: string } {
  if (score === null || score === undefined) {
    return { label: 'Unknown', color: 'text-slate-500' };
  }
  if (score >= 90) return { label: 'Very Easy', color: 'text-emerald-600' };
  if (score >= 80) return { label: 'Easy', color: 'text-emerald-500' };
  if (score >= 70) return { label: 'Fairly Easy', color: 'text-blue-500' };
  if (score >= 60) return { label: 'Standard', color: 'text-blue-400' };
  if (score >= 50) return { label: 'Fairly Difficult', color: 'text-amber-500' };
  if (score >= 30) return { label: 'Difficult', color: 'text-orange-500' };
  return { label: 'Very Difficult', color: 'text-red-500' };
}

// Content type label
function getContentTypeLabel(type: string | null | undefined): string {
  if (!type) return 'Unknown';
  const labels: Record<string, string> = {
    article: 'Article',
    product: 'Product Page',
    landing: 'Landing Page',
    documentation: 'Documentation',
    blog: 'Blog Post',
    other: 'Other',
  };
  return labels[type] || type.charAt(0).toUpperCase() + type.slice(1);
}

// Info tooltip component
function InfoTooltip({ text }: { text: string }) {
  return (
    <span className="relative group/tip inline-flex">
      <Info className="w-3 h-3 text-slate-500 dark:text-slate-500 cursor-help" />
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 text-[11px] leading-snug text-white bg-slate-800 dark:bg-slate-700 rounded-md shadow-lg whitespace-normal w-48 text-center opacity-0 invisible group-hover/tip:opacity-100 group-hover/tip:visible transition-all duration-150 pointer-events-none z-50">
        {text}
        <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-slate-800 dark:border-t-slate-700" />
      </span>
    </span>
  );
}

// Score color helper
function getScoreColor(score: number | null | undefined): string {
  if (score === null || score === undefined) return 'text-slate-500';
  if (score >= 90) return 'text-emerald-600 dark:text-emerald-400';
  if (score >= 70) return 'text-blue-600 dark:text-blue-400';
  if (score >= 50) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

// Score background color helper
function getScoreBgColor(score: number | null | undefined): string {
  if (score === null || score === undefined) return 'bg-slate-100 dark:bg-slate-800';
  if (score >= 90) return 'bg-emerald-50 dark:bg-emerald-900/30';
  if (score >= 70) return 'bg-blue-50 dark:bg-blue-900/30';
  if (score >= 50) return 'bg-amber-50 dark:bg-amber-900/30';
  return 'bg-red-50 dark:bg-red-900/30';
}

export function ContentAnalysisPanel({
  metrics,
  contentScore,
  eeatFindings = [],
  aeoFindings = [],
  className = '',
}: ContentAnalysisPanelProps) {
  const [expanded, setExpanded] = useState(false);

  // Coerce Postgres string values to numbers
  const fkGrade = metrics.flesch_kincaid_grade != null ? Number(metrics.flesch_kincaid_grade) : null;
  const frEase = metrics.flesch_reading_ease != null ? Number(metrics.flesch_reading_ease) : null;

  const readingLevel = getReadingLevel(fkGrade);
  const fleschEase = getFleschEaseLevel(frEase);

  const subscores = [
    {
      key: 'quality',
      label: 'Quality',
      score: metrics.content_quality_score,
      icon: FileText,
      description: 'Content depth & freshness',
      tooltip: 'Measures content depth, originality, freshness, and how well the topic is covered.',
    },
    {
      key: 'readability',
      label: 'Readability',
      score: metrics.content_readability_score,
      icon: BookOpen,
      description: 'Reading level & clarity',
      tooltip: 'How easy your content is to read based on sentence length, vocabulary, and clarity.',
    },
    {
      key: 'structure',
      label: 'Structure',
      score: metrics.content_structure_score,
      icon: List,
      description: 'Headings & organization',
      tooltip: 'Evaluates heading hierarchy, paragraph length, use of lists, and logical content flow.',
    },
    {
      key: 'engagement',
      label: 'Engagement',
      score: metrics.content_engagement_score,
      icon: MessageSquare,
      description: 'Hooks, CTAs & flow',
      tooltip: 'Measures hooks, calls-to-action, internal links, and elements that keep readers on the page.',
    },
    {
      key: 'eeat',
      label: 'E-E-A-T',
      score: metrics.eeat_score,
      icon: Shield,
      description: 'Trust & authority signals',
      tooltip: 'Google\'s Experience, Expertise, Authoritativeness, and Trustworthiness framework for content quality.',
      proOnly: true,
    },
    {
      key: 'aeo',
      label: 'AI Citability',
      score: metrics.aeo_score,
      icon: Bot,
      description: 'AI citation readiness',
      tooltip: 'How likely AI models (ChatGPT, Perplexity, etc.) are to cite your content as a source.',
      proOnly: true,
    },
  ];

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
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Content Analysis
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-500">
                Quality, readability & engagement metrics
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {contentScore !== null && (
              <div className={`text-3xl font-bold ${getScoreColor(contentScore)}`}>
                {contentScore}
              </div>
            )}
            {expanded ? (
              <ChevronUp className="w-5 h-5 text-slate-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-500" />
            )}
          </div>
        </div>
      </button>

      {/* Content — collapsible */}
      {expanded && <div className="p-5 space-y-6">
        {/* Subscores Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {subscores.map((item) => {
            const Icon = item.icon;
            const isLocked = item.proOnly && item.score == null;

            if (isLocked) {
              return (
                <a
                  key={item.key}
                  href="/settings/billing"
                  className="relative rounded-lg p-4 bg-slate-100 dark:bg-slate-800 overflow-hidden group cursor-pointer block no-underline"
                >
                  {/* Blurred placeholder */}
                  <div className="blur-[2px] opacity-40 select-none">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-4 h-4 text-slate-500" />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {item.label}
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-slate-500">
                      72
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {item.description}
                    </div>
                  </div>
                  {/* Lock overlay */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/60 dark:bg-slate-800/60">
                    <Lock className="w-4 h-4 text-indigo-500 mb-1.5" />
                    <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:underline">
                      Upgrade to Pro
                    </span>
                  </div>
                </a>
              );
            }

            return (
              <div
                key={item.key}
                className={`rounded-lg p-4 ${getScoreBgColor(item.score)}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4 text-slate-500 dark:text-slate-500" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {item.label}
                  </span>
                  <InfoTooltip text={item.tooltip} />
                </div>
                <div className={`text-2xl font-bold ${getScoreColor(item.score)}`}>
                  {item.score ?? '—'}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                  {item.description}
                </div>
              </div>
            );
          })}
        </div>

        {/* Readability Section */}
        <div className="border-t border-slate-200 dark:border-slate-700 pt-5">
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Readability Analysis
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Flesch-Kincaid Grade */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-slate-600 dark:text-slate-500">
                  Grade Level
                </span>
                <span className={`text-lg font-bold ${readingLevel.color}`}>
                  {fkGrade?.toFixed(1) ?? '—'}
                </span>
              </div>
              <ReadabilityGauge value={fkGrade} maxValue={18} />
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className={`font-medium ${readingLevel.color}`}>
                  {readingLevel.level}
                </span>
                <span className="text-slate-500 dark:text-slate-500">
                  {readingLevel.audience}
                </span>
              </div>
            </div>

            {/* Flesch Reading Ease */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-slate-600 dark:text-slate-500">
                  Reading Ease
                </span>
                <span className={`text-lg font-bold ${fleschEase.color}`}>
                  {frEase?.toFixed(1) ?? '—'}
                </span>
              </div>
              <ReadabilityGauge value={frEase} maxValue={100} inverted />
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className={`font-medium ${fleschEase.color}`}>
                  {fleschEase.label}
                </span>
                <span className="text-slate-500 dark:text-slate-500">
                  0-100 scale
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* E-E-A-T Detail Section */}
        {metrics.eeat_score != null ? (
          <div className="border-t border-slate-200 dark:border-slate-700 pt-5">
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              E-E-A-T Analysis
              {metrics.eeat_tier && (
                <EeatTierBadge tier={metrics.eeat_tier} />
              )}
            </h4>

            {/* 4-Pillar Mini Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {([
                { key: 'experience', label: 'Experience', score: metrics.eeat_experience_score, icon: User, weight: '20%', tooltip: 'Does the content show first-hand experience with the topic? Look for personal anecdotes, original photos, or real-world usage.' },
                { key: 'expertise', label: 'Expertise', score: metrics.eeat_expertise_score, icon: Brain, weight: '25%', tooltip: 'Does the author demonstrate subject-matter knowledge? Looks for author credentials, technical depth, and accurate information.' },
                { key: 'authority', label: 'Authority', score: metrics.eeat_authoritativeness_score, icon: Award, weight: '30%', tooltip: 'Is the site/author recognised as a go-to source? Measures citations, backlinks, author bio presence, and domain reputation.' },
                { key: 'trust', label: 'Trust', score: metrics.eeat_trustworthiness_score, icon: ShieldCheck, weight: '25%', tooltip: 'Can users trust this content? Checks for contact info, privacy policy, terms of service, HTTPS, and transparent sourcing.' },
              ] as const).map((pillar) => {
                const PillarIcon = pillar.icon;
                const pillarEvidence = (metrics.eeat_evidence || []).filter(e => e.pillar === pillar.key);
                return (
                  <div key={pillar.label} className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <PillarIcon className="w-3.5 h-3.5 text-slate-500 dark:text-slate-500" />
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-500">
                        {pillar.label}
                      </span>
                      <InfoTooltip text={pillar.tooltip} />
                      <span className="text-[10px] text-slate-500 dark:text-slate-500 ml-auto">
                        {pillar.weight}
                      </span>
                    </div>
                    <div className={`text-xl font-bold ${getScoreColor(pillar.score)}`}>
                      {pillar.score ?? '—'}
                    </div>
                    {pillar.score != null && (
                      <div className="mt-1.5 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            pillar.score >= 70 ? 'bg-emerald-500' :
                            pillar.score >= 40 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${pillar.score}%` }}
                        />
                      </div>
                    )}
                    {/* Evidence items */}
                    {pillarEvidence.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1">
                        {pillarEvidence.map((ev, i) => (
                          <div key={i} className="flex items-start gap-1.5">
                            <Check className="w-3 h-3 text-emerald-500 flex-shrink-0 mt-0.5" />
                            <div className="text-[11px] leading-snug text-slate-600 dark:text-slate-500">
                              <span className="font-medium">{ev.label}</span>
                              {ev.text && (
                                <span className="text-slate-500 dark:text-slate-500 block italic mt-0.5 line-clamp-2">
                                  {ev.text}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Trust Signals Checklist */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
              <h5 className="text-xs font-semibold text-slate-600 dark:text-slate-500 uppercase tracking-wider mb-3">
                Trust Signals
              </h5>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {[
                  { label: 'Author Bio', value: metrics.has_author_bio, tooltip: 'A visible author bio section on the page that identifies who wrote the content.' },
                  { label: 'Credentials', value: metrics.has_author_credentials, tooltip: 'Author qualifications, certifications, or professional titles that demonstrate expertise.' },
                  { label: 'Contact Info', value: metrics.has_contact_info, tooltip: 'Reachable contact details such as email, phone, or a contact form on the site.' },
                  { label: 'Privacy Policy', value: metrics.has_privacy_policy, tooltip: 'A linked privacy policy page — required for GDPR compliance and a key trust signal.' },
                  { label: 'Terms of Service', value: metrics.has_terms_of_service, tooltip: 'A linked terms of service page that outlines usage rules and legal protections.' },
                  { label: 'Citations', value: (metrics.citation_count ?? 0) > 0, count: metrics.citation_count, tooltip: 'External references or citations that back up claims made in the content.' },
                ].map((signal) => (
                  <div key={signal.label} className="flex items-center gap-2 py-1">
                    {signal.value ? (
                      <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <X className="w-4 h-4 text-slate-300 dark:text-slate-600 flex-shrink-0" />
                    )}
                    <span className={`text-sm flex items-center gap-1.5 ${
                      signal.value
                        ? 'text-slate-700 dark:text-slate-300'
                        : 'text-slate-500 dark:text-slate-500'
                    }`}>
                      {signal.label}
                      {'count' in signal && signal.count != null && signal.count > 0 && (
                        <span className="text-xs text-slate-500 dark:text-slate-500">
                          ({signal.count})
                        </span>
                      )}
                      <InfoTooltip text={signal.tooltip} />
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* E-E-A-T Recommendations */}
            {eeatFindings.length > 0 && (
              <EeatRecommendations findings={eeatFindings} />
            )}
          </div>
        ) : (
          <LockedSection
            icon={Shield}
            title="E-E-A-T Analysis"
            description="Analyze Experience, Expertise, Authoritativeness and Trustworthiness signals on your pages."
          />
        )}

        {/* AEO Detail Section */}
        {metrics.aeo_score != null ? (
          <AeoDetailSection metrics={metrics} findings={aeoFindings} />
        ) : (
          <LockedSection
            icon={Bot}
            title="AI Citability (AEO)"
            description="Discover how likely AI models are to cite your content as a primary source."
          />
        )}

        {/* Quick Stats */}
        <div className="border-t border-slate-200 dark:border-slate-700 pt-5">
          <div className="grid grid-cols-3 gap-4">
            {/* Word Count */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-slate-500 dark:text-slate-500 mb-1">
                <AlignLeft className="w-4 h-4" />
                <span className="text-xs">Words</span>
              </div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">
                {metrics.word_count?.toLocaleString() ?? '—'}
              </div>
            </div>

            {/* Reading Time */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-slate-500 dark:text-slate-500 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-xs">Read Time</span>
              </div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">
                {metrics.reading_time_minutes ? `${metrics.reading_time_minutes} min` : '—'}
              </div>
            </div>

            {/* Content Type */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-slate-500 dark:text-slate-500 mb-1">
                <Type className="w-4 h-4" />
                <span className="text-xs">Type</span>
              </div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">
                {getContentTypeLabel(metrics.detected_content_type)}
              </div>
            </div>
          </div>
        </div>
      </div>}
    </div>
  );
}

// =============================================
// E-E-A-T Tier Badge
// =============================================

function EeatTierBadge({ tier }: { tier: string }) {
  const config: Record<string, { label: string; bg: string; text: string }> = {
    'expert-verified': {
      label: 'Expert Verified',
      bg: 'bg-emerald-100 dark:bg-emerald-900/30',
      text: 'text-emerald-700 dark:text-emerald-400',
    },
    'standard-web': {
      label: 'Standard Web',
      bg: 'bg-amber-100 dark:bg-amber-900/30',
      text: 'text-amber-700 dark:text-amber-400',
    },
    'ghost-content': {
      label: 'Ghost Content',
      bg: 'bg-red-100 dark:bg-red-900/30',
      text: 'text-red-700 dark:text-red-400',
    },
  };

  const c = config[tier] || config['ghost-content'];

  return (
    <span className={`ml-auto inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}

// =============================================
// Locked Section (Pro upgrade prompt)
// =============================================

function LockedSection({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <div className="border-t border-slate-200 dark:border-slate-700 pt-5">
      <a
        href="/settings/billing"
        className="block rounded-lg border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-800/30 p-6 text-center no-underline hover:border-indigo-300 hover:bg-indigo-50/30 dark:hover:border-indigo-600 dark:hover:bg-indigo-900/10 transition-colors group"
      >
        <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mx-auto mb-3">
          <Lock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center justify-center gap-2 mb-1">
          <Icon className="w-4 h-4" />
          {title}
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-500 mb-3 max-w-xs mx-auto">
          {description}
        </p>
        <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 group-hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors">
          <Lock className="w-3 h-3" />
          Upgrade to Pro
        </span>
      </a>
    </div>
  );
}

// =============================================
// E-E-A-T Recommendations
// =============================================

function EeatRecommendations({ findings }: { findings: ContentFinding[] }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? findings : findings.slice(0, 3);

  const severityColors: Record<string, string> = {
    critical: 'border-red-400 bg-red-50 dark:bg-red-900/20',
    serious: 'border-orange-400 bg-orange-50 dark:bg-orange-900/20',
    moderate: 'border-amber-400 bg-amber-50 dark:bg-amber-900/20',
    minor: 'border-blue-400 bg-blue-50 dark:bg-blue-900/20',
    info: 'border-slate-300 bg-slate-50 dark:bg-slate-800/50',
  };

  const severityBadgeColors: Record<string, string> = {
    serious: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    moderate: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    minor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    info: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-500',
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
      <h5 className="text-xs font-semibold text-slate-600 dark:text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <Shield className="w-3.5 h-3.5" />
        E-E-A-T Recommendations ({findings.length})
      </h5>
      <div className="space-y-2">
        {visible.map((finding, idx) => (
          <div
            key={idx}
            className={`rounded-lg p-3 ${severityColors[finding.severity] || severityColors.info}`}
            style={{ borderLeftWidth: '3px', borderLeftStyle: 'solid' }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {finding.ruleName}
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                severityBadgeColors[finding.severity] || severityBadgeColors.info
              }`}>
                {finding.severity}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-500 mb-1.5">{finding.message}</p>
            {finding.recommendation && (
              <p className="text-xs text-indigo-700 dark:text-indigo-400">
                {finding.recommendation}
              </p>
            )}
          </div>
        ))}
      </div>
      {findings.length > 3 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-3 flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
        >
          {showAll ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              Show fewer
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              Show all {findings.length} recommendations
            </>
          )}
        </button>
      )}
    </div>
  );
}

// =============================================
// AEO Detail Section
// =============================================

function AeoDetailSection({ metrics, findings = [] }: { metrics: ContentMetrics; findings?: ContentFinding[] }) {
  const [showAllNuggets, setShowAllNuggets] = useState(false);
  const [showAllFindings, setShowAllFindings] = useState(false);
  const nuggets = metrics.aeo_nuggets || [];
  const visibleNuggets = showAllNuggets ? nuggets : nuggets.slice(0, 5);
  const visibleFindings = showAllFindings ? findings : findings.slice(0, 3);

  const nuggetTypeLabels: Record<string, { label: string; color: string }> = {
    definition: { label: 'Definition', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    summary: { label: 'Summary', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
    'faq-answer': { label: 'FAQ', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    'data-table': { label: 'Table', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
    list: { label: 'List', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400' },
    'concise-answer': { label: 'Answer', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
  };

  const findingSeverityColors: Record<string, string> = {
    critical: 'border-red-400 bg-red-50 dark:bg-red-900/20',
    serious: 'border-orange-400 bg-orange-50 dark:bg-orange-900/20',
    moderate: 'border-amber-400 bg-amber-50 dark:bg-amber-900/20',
    minor: 'border-blue-400 bg-blue-50 dark:bg-blue-900/20',
    info: 'border-slate-300 bg-slate-50 dark:bg-slate-800/50',
  };

  // Pick best nugget for the simulated AI response
  const bestNugget = nuggets.find(n => n.type === 'definition')
    || nuggets.find(n => n.type === 'concise-answer')
    || nuggets.find(n => n.type === 'summary')
    || nuggets[0];

  return (
    <div className="border-t border-slate-200 dark:border-slate-700 pt-5">
      <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
        <Bot className="w-4 h-4" />
        AI Citability (AEO)
        {metrics.aeo_tier && (
          <AeoTierBadge tier={metrics.aeo_tier} />
        )}
      </h4>

      {/* 3-Pillar Mini Grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: 'Nuggets', score: metrics.aeo_nugget_score, icon: Search, weight: '40%', tooltip: 'Self-contained, quotable snippets that AI can extract and cite directly — definitions, answers, lists, and summaries.' },
          { label: 'Factual Density', score: metrics.aeo_factual_density_score, icon: Database, weight: '30%', tooltip: 'How many verifiable facts, statistics, and concrete data points your content contains per paragraph.' },
          { label: 'Source Authority', score: metrics.aeo_source_authority_score, icon: Link2, weight: '30%', tooltip: 'Signals that make AI trust your content: citations, author credentials, external references, and structured data.' },
        ].map((pillar) => {
          const PillarIcon = pillar.icon;
          return (
            <div key={pillar.label} className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <PillarIcon className="w-3.5 h-3.5 text-slate-500 dark:text-slate-500" />
                <span className="text-xs font-medium text-slate-600 dark:text-slate-500">
                  {pillar.label}
                </span>
                <InfoTooltip text={pillar.tooltip} />
                <span className="text-[10px] text-slate-500 dark:text-slate-500 ml-auto">
                  {pillar.weight}
                </span>
              </div>
              <div className={`text-xl font-bold ${getScoreColor(pillar.score)}`}>
                {pillar.score ?? '—'}
              </div>
              {pillar.score != null && (
                <div className="mt-1.5 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      pillar.score >= 70 ? 'bg-emerald-500' :
                      pillar.score >= 40 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${pillar.score}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Content Front-Loading Indicator */}
      {metrics.aeo_content_frontloaded != null && (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg mb-4 text-xs font-medium ${
          metrics.aeo_content_frontloaded
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
            : 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
        }`}>
          <span>{metrics.aeo_content_frontloaded ? 'Content is front-loaded' : 'Content is not front-loaded'}</span>
          {metrics.aeo_content_frontloading_ratio != null && (
            <span className="text-[10px] opacity-75 ml-auto">
              {Math.round(metrics.aeo_content_frontloading_ratio * 100)}% in first third
            </span>
          )}
          <InfoTooltip text="AI models often weight early content more heavily and may truncate long pages. Front-loaded content is more likely to be cited." />
        </div>
      )}

      {/* Simulated AI Response */}
      {bestNugget && (
        <div className="bg-gradient-to-br from-slate-50 to-indigo-50/30 dark:from-slate-800/50 dark:to-indigo-900/10 rounded-lg p-4 mb-4 border border-slate-200 dark:border-slate-700">
          <h5 className="text-xs font-semibold text-slate-600 dark:text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Bot className="w-3.5 h-3.5" />
            Simulated AI Response
          </h5>
          <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                <p>
                  {metrics.aeo_tier === 'primary-source' ? (
                    <>According to the page, <span className="italic">"{bestNugget.text}"</span></>
                  ) : metrics.aeo_tier === 'general-reference' ? (
                    <>One source suggests that <span className="italic">"{bestNugget.text}"</span> — though this may need further verification.</>
                  ) : (
                    <>
                      <span className="text-slate-500 dark:text-slate-500">
                        AI models are unlikely to cite this page. With improvements, a response could look like:
                      </span>
                      {' '}<span className="italic">"{bestNugget.text}"</span>
                    </>
                  )}
                </p>
                {metrics.aeo_tier !== 'ignored' && (
                  <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                    Source: your page
                  </p>
                )}
              </div>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-500 mt-2">
            This is a simulation of how an AI might reference your content based on the best extractable nugget.
          </p>
        </div>
      )}

      {/* AI-Ready Nuggets */}
      {nuggets.length > 0 && (
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 mb-4">
          <h5 className="text-xs font-semibold text-slate-600 dark:text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Quote className="w-3.5 h-3.5" />
            AI-Ready Nuggets ({nuggets.length})
          </h5>
          <div className="space-y-2">
            {visibleNuggets.map((nugget, idx) => {
              const typeConfig = nuggetTypeLabels[nugget.type] || { label: nugget.type, color: 'bg-slate-100 text-slate-600' };
              return (
                <div
                  key={idx}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded ${typeConfig.color}`}>
                      {typeConfig.label}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-500">
                      {nugget.wordCount} words
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed border-l-2 border-indigo-300 dark:border-indigo-600 pl-3">
                    {nugget.text}
                  </p>
                </div>
              );
            })}
          </div>
          {nuggets.length > 5 && (
            <button
              onClick={() => setShowAllNuggets(!showAllNuggets)}
              className="mt-3 flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
            >
              {showAllNuggets ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  Show fewer
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  Show all {nuggets.length} nuggets
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* AEO Recommendations */}
      {findings.length > 0 && (
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
          <h5 className="text-xs font-semibold text-slate-600 dark:text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5" />
            AEO Recommendations ({findings.length})
          </h5>
          <div className="space-y-2">
            {visibleFindings.map((finding, idx) => (
              <div
                key={idx}
                className={`border-l-3 rounded-lg p-3 ${findingSeverityColors[finding.severity] || findingSeverityColors.info}`}
                style={{ borderLeftWidth: '3px' }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {finding.ruleName}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                    finding.severity === 'serious' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                    finding.severity === 'moderate' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                    finding.severity === 'minor' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                    'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-500'
                  }`}>
                    {finding.severity}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-500 mb-1.5">{finding.message}</p>
                {finding.recommendation && (
                  <p className="text-xs text-indigo-700 dark:text-indigo-400">
                    {finding.recommendation}
                  </p>
                )}
              </div>
            ))}
          </div>
          {findings.length > 3 && (
            <button
              onClick={() => setShowAllFindings(!showAllFindings)}
              className="mt-3 flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
            >
              {showAllFindings ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  Show fewer
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  Show all {findings.length} recommendations
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================
// AEO Tier Badge
// =============================================

function AeoTierBadge({ tier }: { tier: string }) {
  const config: Record<string, { label: string; bg: string; text: string }> = {
    'primary-source': {
      label: 'Primary Source',
      bg: 'bg-emerald-100 dark:bg-emerald-900/30',
      text: 'text-emerald-700 dark:text-emerald-400',
    },
    'general-reference': {
      label: 'General Reference',
      bg: 'bg-amber-100 dark:bg-amber-900/30',
      text: 'text-amber-700 dark:text-amber-400',
    },
    'ignored': {
      label: 'Ignored',
      bg: 'bg-red-100 dark:bg-red-900/30',
      text: 'text-red-700 dark:text-red-400',
    },
  };

  const c = config[tier] || config['ignored'];

  return (
    <span className={`ml-auto inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}

// =============================================
// Readability Gauge Subcomponent
// =============================================

interface ReadabilityGaugeProps {
  value: number | null | undefined;
  maxValue: number;
  inverted?: boolean; // For Flesch Reading Ease, higher is better
}

function ReadabilityGauge({ value, maxValue, inverted = false }: ReadabilityGaugeProps) {
  if (value === null || value === undefined) {
    return (
      <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full" />
    );
  }

  const percentage = Math.min(100, Math.max(0, (value / maxValue) * 100));

  // Determine color based on value
  const getGaugeColor = () => {
    const normalizedValue = inverted ? percentage : 100 - percentage;
    if (normalizedValue >= 70) return 'bg-emerald-500';
    if (normalizedValue >= 50) return 'bg-blue-500';
    if (normalizedValue >= 30) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="relative h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
      <div
        className={`absolute inset-y-0 left-0 ${getGaugeColor()} rounded-full transition-all duration-500`}
        style={{ width: `${percentage}%` }}
      />
      {/* Optimal zone indicator for grade level (7-9 is ideal) */}
      {!inverted && (
        <div
          className="absolute inset-y-0 border-l-2 border-r-2 border-emerald-400/50"
          style={{
            left: `${(7 / maxValue) * 100}%`,
            right: `${100 - (10 / maxValue) * 100}%`,
          }}
        />
      )}
    </div>
  );
}

// =============================================
// Compact Content Score Badge
// =============================================

interface ContentScoreBadgeProps {
  score: number | null;
  size?: 'sm' | 'md' | 'lg';
}

export function ContentScoreBadge({ score, size = 'md' }: ContentScoreBadgeProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-lg',
  };

  return (
    <div
      className={`${sizeClasses[size]} rounded-lg ${getScoreBgColor(score)} flex items-center justify-center font-bold ${getScoreColor(score)}`}
    >
      {score ?? '—'}
    </div>
  );
}

// =============================================
// Content Issues Summary
// =============================================

interface ContentIssuesSummaryProps {
  issues: {
    quality: number;
    readability: number;
    structure: number;
    engagement: number;
    keywords: number;
  };
  className?: string;
}

export function ContentIssuesSummary({ issues, className = '' }: ContentIssuesSummaryProps) {
  const categories = [
    { key: 'quality', label: 'Quality', count: issues.quality, color: 'bg-purple-500' },
    { key: 'readability', label: 'Readability', count: issues.readability, color: 'bg-blue-500' },
    { key: 'structure', label: 'Structure', count: issues.structure, color: 'bg-amber-500' },
    { key: 'engagement', label: 'Engagement', count: issues.engagement, color: 'bg-emerald-500' },
    { key: 'keywords', label: 'Keywords', count: issues.keywords, color: 'bg-indigo-500' },
  ];

  const total = Object.values(issues).reduce((sum, n) => sum + n, 0);

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Content Issues
        </span>
        <span className="text-sm font-bold text-slate-900 dark:text-white">
          {total}
        </span>
      </div>
      <div className="space-y-2">
        {categories.map((cat) => (
          <div key={cat.key} className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${cat.color}`} />
            <span className="text-sm text-slate-600 dark:text-slate-500 flex-1">
              {cat.label}
            </span>
            <span className="text-sm font-medium text-slate-900 dark:text-white tabular-nums">
              {cat.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
