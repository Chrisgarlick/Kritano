// Analytics Types for PagePulser Frontend

export interface ScoreDataPoint {
  auditId: string;
  completedAt: string;
  seo: number | null;
  accessibility: number | null;
  security: number | null;
  performance: number | null;
  content: number | null;
  structuredData: number | null;
}

export interface ScoreSummary {
  averages: {
    seo: number | null;
    accessibility: number | null;
    security: number | null;
    performance: number | null;
    content: number | null;
    structuredData: number | null;
  };
  trends: {
    seo: TrendDirection;
    accessibility: TrendDirection;
    security: TrendDirection;
    performance: TrendDirection;
    content: TrendDirection;
    structuredData: TrendDirection;
  };
  totalAudits: number;
}

export interface ScoreHistory {
  scores: ScoreDataPoint[];
  summary: ScoreSummary;
}

export interface IssueTrendPoint {
  period: string;
  bySeverity: {
    critical: number;
    serious: number;
    moderate: number;
    minor: number;
  };
  byCategory: {
    seo: number;
    accessibility: number;
    security: number;
    performance: number;
    content: number;
    'structured-data': number;
  };
  total: number;
}

export interface IssueTrends {
  trends: IssueTrendPoint[];
}

export interface AuditSummary {
  id: string;
  siteName: string;
  domain: string;
  completedAt: string;
  scores: {
    seo: number | null;
    accessibility: number | null;
    security: number | null;
    performance: number | null;
    content: number | null;
    structuredData: number | null;
  };
  issues: {
    total: number;
    critical: number;
    serious: number;
    moderate: number;
    minor: number;
  };
  pagesCrawled: number;
}

export interface ScoreDelta {
  from: string;
  to: string;
  deltas: {
    seo: number | null;
    accessibility: number | null;
    security: number | null;
    performance: number | null;
    content: number | null;
    structuredData: number | null;
  };
}

export interface IssueDiffItem {
  ruleId: string;
  ruleName: string;
  category: string;
  severity?: string;
}

export interface CommonIssue extends IssueDiffItem {
  presentIn: string[];
}

export interface ResolvedIssue extends IssueDiffItem {
  resolvedIn: string;
}

export interface NewIssue extends IssueDiffItem {
  introducedIn: string;
}

export interface AuditComparison {
  audits: AuditSummary[];
  comparison: {
    scoreDeltas: ScoreDelta[];
    commonIssues: CommonIssue[];
    resolvedIssues: ResolvedIssue[];
    newIssues: NewIssue[];
  };
}

export interface SiteAnalyticsSummary {
  id: string;
  name: string;
  domain: string;
  latestScores: {
    seo: number | null;
    accessibility: number | null;
    security: number | null;
    performance: number | null;
    content: number | null;
    structuredData: number | null;
  };
  lastAuditAt: string | null;
  auditCount: number;
  trend: OverallTrend;
}

export interface OrgAnalytics {
  sites: SiteAnalyticsSummary[];
  aggregates: {
    totalAudits: number;
    averageScores: {
      seo: number | null;
      accessibility: number | null;
      security: number | null;
      performance: number | null;
      content: number | null;
      structuredData: number | null;
    };
    topIssues: Array<{
      ruleId: string;
      ruleName: string;
      count: number;
      category: string;
    }>;
  };
}

export interface SiteComparisonEntry {
  id: string;
  name: string;
  domain: string;
  latestAudit: {
    id: string;
    completedAt: string;
    scores: {
      seo: number | null;
      accessibility: number | null;
      security: number | null;
      performance: number | null;
      content: number | null;
      structuredData: number | null;
    };
    totalIssues: number;
  } | null;
  historicalAverage: {
    seo: number | null;
    accessibility: number | null;
    security: number | null;
    performance: number | null;
    content: number | null;
    structuredData: number | null;
  };
}

export interface SiteComparison {
  sites: SiteComparisonEntry[];
}

export type TimeRange = '7d' | '30d' | '90d' | '1y' | 'all' | 'custom';
export type GroupBy = 'day' | 'week' | 'month';
export type TrendDirection = 'up' | 'down' | 'stable';
export type OverallTrend = 'improving' | 'declining' | 'stable';

export type ScoreCategory = 'seo' | 'accessibility' | 'security' | 'performance' | 'content' | 'structuredData';

export const SCORE_CATEGORIES: ScoreCategory[] = ['seo', 'accessibility', 'security', 'performance', 'content', 'structuredData'];

export const CATEGORY_COLORS: Record<ScoreCategory, string> = {
  seo: '#8b5cf6',        // violet-500
  accessibility: '#10b981', // emerald-500
  security: '#ef4444',    // red-500
  performance: '#0ea5e9', // sky-500
  content: '#f59e0b',     // amber-500
  structuredData: '#6366f1', // indigo-500
};

export const CATEGORY_LABELS: Record<ScoreCategory, string> = {
  seo: 'SEO',
  accessibility: 'Accessibility',
  security: 'Security',
  performance: 'Performance',
  content: 'Content',
  structuredData: 'Schema',
};

export const SEVERITY_COLORS: Record<string, string> = {
  critical: '#dc2626', // red-600
  serious: '#f97316',  // orange-500
  moderate: '#f59e0b', // amber-500
  minor: '#0ea5e9',    // sky-500
};

export function getScoreColor(score: number | null): string {
  if (score === null) return '#94a3b8'; // slate-400
  if (score >= 90) return '#10b981';    // emerald-500
  if (score >= 70) return '#f59e0b';    // amber-500
  if (score >= 50) return '#f97316';    // orange-500
  return '#ef4444';                      // red-500
}

export function getScoreLabel(score: number | null): string {
  if (score === null) return 'N/A';
  if (score >= 90) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Fair';
  return 'Poor';
}

// =============================================
// User-Centric Analytics Types
// =============================================

export interface UserOverview {
  totalSites: number;
  totalAudits: number;
  avgScores: {
    seo: number | null;
    accessibility: number | null;
    security: number | null;
    performance: number | null;
    content: number | null;
    structuredData: number | null;
  };
  sitesNeedingAttention: Array<{
    id: string;
    name: string;
    domain: string;
    latestScores: {
      seo: number | null;
      accessibility: number | null;
      security: number | null;
      performance: number | null;
      content: number | null;
      structuredData: number | null;
    };
    trend: 'declining';
  }>;
  recentActivity: Array<{
    auditId: string;
    siteName: string;
    domain: string;
    completedAt: string;
    overallScore: number;
    scanType: 'single-page' | 'quick-scan' | 'full-audit' | 'accessibility' | 'custom';
    pagesCrawled: number;
    totalIssues: number;
    url: string | null;
    scores: {
      seo: number | null;
      accessibility: number | null;
      security: number | null;
      performance: number | null;
      content: number | null;
      structuredData: number | null;
    };
    startedBy: {
      name: string;
      email: string;
    };
  }>;
}

// =============================================
// URL Comparison Types
// =============================================

export interface UrlPageSnapshot {
  urlId: string;
  siteId: string;
  siteName: string;
  siteDomain: string;
  url: string;
  urlPath: string;
  auditId: string;
  auditedAt: string;
  pageId: string;
  scores: {
    seo: number | null;
    accessibility: number | null;
    security: number | null;
    performance: number | null;
    content: number | null;
    structuredData: number | null;
  };
  issueCountByCategory: {
    seo: number;
    accessibility: number;
    security: number;
    performance: number;
    content: number;
    structuredData: number;
  };
  httpPerformance: {
    statusCode: number | null;
    responseTimeMs: number | null;
    pageSizeBytes: number | null;
  };
  contentSubscores: {
    quality: number | null;
    readability: number | null;
    structure: number | null;
    engagement: number | null;
  };
  eeat: {
    overall: number | null;
    experience: number | null;
    expertise: number | null;
    authoritativeness: number | null;
    trustworthiness: number | null;
    tier: string | null;
    trustSignals: {
      hasAuthorBio: boolean | null;
      hasAuthorCredentials: boolean | null;
      citationCount: number | null;
      hasContactInfo: boolean | null;
      hasPrivacyPolicy: boolean | null;
      hasTermsOfService: boolean | null;
    };
    evidence: Array<{ pillar: string; type: string; label: string; text: string }>;
  };
  aeo: {
    overall: number | null;
    nuggetScore: number | null;
    factualDensity: number | null;
    sourceAuthority: number | null;
    tier: string | null;
    nuggets: Array<{ text: string; type: string; wordCount: number }>;
  };
  keyword: {
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
  } | null;
  readability: {
    fleschKincaidGrade: number | null;
    fleschReadingEase: number | null;
    readingTimeMinutes: number | null;
  };
  meta: {
    wordCount: number | null;
    title: string | null;
    metaDescription: string | null;
    h1Text: string | null;
    contentType: string | null;
    canonicalUrl: string | null;
  };
  structuredDataDetail: {
    jsonLdCount: number;
    hasOpenGraph: boolean;
    hasTwitterCard: boolean;
    detectedSchemaTypes: string[];
    detectedPageType: string | null;
    structuredDataIssues: number;
  };
}

export interface UrlComparisonInsight {
  category: string;
  winner: 'a' | 'b' | 'tie';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  recommendation: string;
}

export interface UrlFindingItem {
  ruleId: string;
  ruleName: string;
  category: string;
  severity: string;
  message: string;
  recommendation: string;
}

export interface UrlFindingsDiff {
  uniqueToA: UrlFindingItem[];
  uniqueToB: UrlFindingItem[];
  shared: UrlFindingItem[];
  summaryA: { critical: number; serious: number; moderate: number; minor: number };
  summaryB: { critical: number; serious: number; moderate: number; minor: number };
}

export interface UrlComparison {
  urls: [UrlPageSnapshot, UrlPageSnapshot];
  scoreDeltas: Record<string, number | null>;
  insights: UrlComparisonInsight[];
  findingsDiff: UrlFindingsDiff;
}

export interface UserAuditedUrl {
  urlId: string;
  siteId: string;
  siteName: string;
  siteDomain: string;
  url: string;
  urlPath: string;
  lastAuditedAt: string;
  seoScore: number | null;
  contentScore: number | null;
}

export interface UrlAnalytics {
  url: {
    id: string;
    urlPath: string;
    fullUrl: string;
    auditCount: number;
    lastAuditedAt: string | null;
  };
  scoreHistory: ScoreHistory;
  comparisonToSite: {
    seo: { url: number | null; site: number | null; diff: number | null };
    accessibility: { url: number | null; site: number | null; diff: number | null };
    security: { url: number | null; site: number | null; diff: number | null };
    performance: { url: number | null; site: number | null; diff: number | null };
    content: { url: number | null; site: number | null; diff: number | null };
    structuredData: { url: number | null; site: number | null; diff: number | null };
  };
  recentAudits: Array<{
    id: string;
    completedAt: string;
    scores: {
      seo: number | null;
      accessibility: number | null;
      security: number | null;
      performance: number | null;
      content: number | null;
      structuredData: number | null;
    };
    totalIssues: number;
  }>;
}
