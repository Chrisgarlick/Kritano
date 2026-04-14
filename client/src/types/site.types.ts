// Site Types - Client (User-Centric Model)

// Site permission levels for sharing
export type SitePermission = 'owner' | 'admin' | 'editor' | 'viewer';

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
  lastAuditAt: string | null;
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

export interface Site {
  id: string;
  ownerId: string;
  name: string;
  domain: string;
  description: string | null;
  logoUrl: string | null;
  verified: boolean;
  verificationToken: string | null;
  verifiedAt: string | null;
  verificationMethod: 'dns' | 'file' | null;
  ignoreRobotsTxt: boolean;
  rateLimitProfile: 'conservative' | 'normal' | 'aggressive';
  sendVerificationHeader: boolean;
  badgeEnabled: boolean;
  settings: SiteSettings;
  createdAt: string;
  updatedAt: string;
}

export interface SiteWithStats extends Site {
  stats: SiteStats;
  permission: SitePermission;
  ownerTier?: string;
}

export interface ScoreHistoryEntry {
  date: string;
  seo: number | null;
  accessibility: number | null;
  security: number | null;
  performance: number | null;
  content: number | null;
  structuredData: number | null;
  cqs: number | null;
}

export interface SiteDetail extends Site {
  stats: SiteStats;
  permission: SitePermission;
  ownerTier?: string;
  scoreHistory: ScoreHistoryEntry[];
}

export interface CreateSiteInput {
  name: string;
  domain: string;
  description?: string;
}

export interface UpdateSiteInput {
  name?: string;
  description?: string;
  logoUrl?: string | null;
  settings?: Partial<SiteSettings>;
  ignoreRobotsTxt?: boolean;
  rateLimitProfile?: 'conservative' | 'normal' | 'aggressive';
  sendVerificationHeader?: boolean;
}

export interface SiteUsage {
  sites: number;
  maxSites: number | null;
}

// Site URL types
export interface SiteUrl {
  id: string;
  siteId: string;
  url: string;
  urlPath: string;
  source: 'sitemap' | 'audit' | 'manual';
  lastAuditId: string | null;
  lastAuditedAt: string | null;
  lastSeoScore: number | null;
  lastAccessibilityScore: number | null;
  lastSecurityScore: number | null;
  lastPerformanceScore: number | null;
  lastContentScore: number | null;
  sitemapPriority: number | null;
  sitemapChangefreq: string | null;
  auditCount: number;
  createdAt: string;
  updatedAt: string;
}

// Site sharing types
export interface SiteShare {
  id: string;
  siteId: string;
  userId: string;
  permission: SitePermission;
  invitedBy: string | null;
  invitedAt: string;
  acceptedAt: string | null;
  createdAt: string;
  // Joined user data
  userEmail?: string;
  userFirstName?: string | null;
  userLastName?: string | null;
}

export interface SiteInvitation {
  id: string;
  siteId: string;
  email: string;
  permission: SitePermission;
  invitedBy: string;
  token: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expiresAt: string;
  createdAt: string;
  respondedAt: string | null;
  // Joined data
  siteName?: string;
  siteDomain?: string;
  inviterName?: string;
}

// Verification types
export interface VerificationInstructions {
  dns: {
    recordType: string;
    name: string;
    alternativeName: string;
    value: string;
  };
  file: {
    path: string;
    url: string;
    content: string;
  };
}

// Subscription and tier types (moved from organization.types.ts)
export type SubscriptionTier = 'free' | 'starter' | 'pro' | 'agency' | 'enterprise';
export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'trialing' | 'paused';

export interface Subscription {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: string | null;
  trialStart: string | null;
  trialEnd: string | null;
  daysRemaining: number | null;
  hasUsedTrial: boolean;
  includedSeats: number;
  extraSeats: number;
  addons: SubscriptionAddon[];
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionAddon {
  type: string;
  quantity?: number;
  enabled?: boolean;
}

export interface TierLimits {
  tier: SubscriptionTier;
  maxSites: number | null;
  maxAuditsPerMonth: number | null;
  maxPagesPerAudit: number;
  maxAuditDepth: number;
  availableChecks: string[];
  scheduledAudits: boolean;
  minScheduleInterval: string | null;
  dataRetentionDays: number | null;
  apiRequestsPerDay: number | null;
  apiRequestsPerMinute: number;
  concurrentAudits: number;
  exportPdf: boolean;
  exportCsv: boolean;
  exportJson: boolean;
  whiteLabel: boolean;
  maxMembersPerSite: number | null;
}

export interface MemberLimit {
  used: number;
  max: number | null;
  tier: string;
}

export interface UsageStats {
  audits: number;
  sites: number;
  apiRequests: number;
  periodStart: string;
  periodEnd: string;
}

// Tier info for display
export const TIER_INFO: Record<SubscriptionTier, {
  name: string;
  price: string;
  description: string;
  color: string;
}> = {
  free: {
    name: 'Free',
    price: '$0',
    description: 'For personal projects',
    color: 'gray',
  },
  starter: {
    name: 'Starter',
    price: '$19/mo',
    description: 'For small teams',
    color: 'blue',
  },
  pro: {
    name: 'Pro',
    price: '$49/mo',
    description: 'For growing teams',
    color: 'purple',
  },
  agency: {
    name: 'Agency',
    price: '$99/mo',
    description: 'For agencies & consultants',
    color: 'indigo',
  },
  enterprise: {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For large organizations',
    color: 'yellow',
  },
};

// Site permission info
export const PERMISSION_INFO: Record<SitePermission, {
  label: string;
  description: string;
}> = {
  owner: {
    label: 'Owner',
    description: 'Full control, can delete site',
  },
  admin: {
    label: 'Admin',
    description: 'Manage settings and sharing',
  },
  editor: {
    label: 'Editor',
    description: 'Run audits and add URLs',
  },
  viewer: {
    label: 'Viewer',
    description: 'View audits and analytics',
  },
};
