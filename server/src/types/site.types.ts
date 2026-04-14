// Site Types - Server (User-centric model)

export interface Site {
  id: string;
  owner_id: string;
  organization_id?: string; // Legacy, kept for backward compatibility during migration
  name: string;
  domain: string;
  description: string | null;
  logo_url: string | null;
  verified: boolean;
  verification_token: string | null;
  verified_at: Date | null;
  verification_method: string | null;
  verification_attempts: number;
  last_verification_attempt: Date | null;
  ignore_robots_txt: boolean;
  rate_limit_profile: string;
  send_verification_header: boolean;
  badge_enabled: boolean;
  settings: SiteSettings;
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface SiteSettings {
  defaultAuditOptions?: {
    maxPages?: number;
    maxDepth?: number;
    checkSeo?: boolean;
    checkAccessibility?: boolean;
    checkSecurity?: boolean;
    checkPerformance?: boolean;
  };
  notifications?: {
    emailOnComplete?: boolean;
    emailOnScoreChange?: boolean;
    scoreChangeThreshold?: number;
  };
  display?: {
    color?: string;
    icon?: string;
  };
  // Branding for PDF exports (only available for verified domains)
  branding?: {
    companyName?: string;
    logoUrl?: string;
    primaryColor?: string;    // Hex color e.g. '#1e3a5f'
    secondaryColor?: string;  // Hex color e.g. '#3b82f6'
    accentColor?: string;     // Hex color for highlights
    footerText?: string;      // Agency+ per-site override e.g. "Prepared by Agency X"
  };
}

export interface SiteStats {
  totalAudits: number;
  lastAuditAt: Date | null;
  latestScores: {
    seo: number | null;
    accessibility: number | null;
    security: number | null;
    performance: number | null;
    content: number | null;
    structuredData: number | null;
    cqs: number | null;
  } | null;
  urlCount: number;
}

export interface SiteWithStats extends Site {
  stats: SiteStats;
}

export interface SiteWithStatsRow extends Site {
  // Flattened stats from SQL query
  total_audits: string;
  last_audit_at: Date | null;
  latest_seo_score: number | null;
  latest_accessibility_score: number | null;
  latest_security_score: number | null;
  latest_performance_score: number | null;
  latest_content_score: number | null;
  latest_structured_data_score: number | null;
  latest_cqs_score: number | null;
  url_count: string;
  owner_tier?: string;
}

export interface ScoreHistoryEntry {
  date: Date;
  seo: number | null;
  accessibility: number | null;
  security: number | null;
  performance: number | null;
  content: number | null;
  structuredData: number | null;
  cqs: number | null;
}

export interface CreateSiteInput {
  name: string;
  domain: string;
  description?: string;
}

export interface UpdateSiteInput {
  name?: string;
  description?: string;
  logo_url?: string | null;
  settings?: Partial<SiteSettings>;
}

// Site URL (first-class URL entity)
export interface SiteUrl {
  id: string;
  site_id: string;
  url: string;
  url_path: string;
  source: 'sitemap' | 'audit' | 'manual';
  last_audit_id: string | null;
  last_audited_at: Date | null;
  last_seo_score: number | null;
  last_accessibility_score: number | null;
  last_security_score: number | null;
  last_performance_score: number | null;
  last_content_score: number | null;
  sitemap_priority: number | null;
  sitemap_changefreq: string | null;
  audit_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface SiteUrlWithLatestAudit extends SiteUrl {
  latest_audit?: {
    id: string;
    status: string;
    completed_at: Date | null;
  };
}

export interface GetUrlsOptions {
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'url_path' | 'last_audited_at' | 'audit_count' | 'sitemap_priority' | 'last_seo_score' | 'last_accessibility_score' | 'last_security_score' | 'last_performance_score';
  sortOrder?: 'asc' | 'desc';
}

// User site access (owned + shared)
export interface UserSiteAccess {
  site: SiteWithStats;
  permission: 'owner' | 'admin' | 'editor' | 'viewer';
  ownerTier: string;
  sharedBy?: string;
  sharedAt?: Date;
}
