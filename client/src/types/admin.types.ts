// Admin Types

export interface DashboardStats {
  users: {
    total: number;
    verified: number;
    newToday: number;
    newThisWeek: number;
    newThisMonth: number;
  };
  organizations: {
    total: number;
    newToday: number;
    newThisWeek: number;
  };
  subscriptions: {
    free: number;
    starter: number;
    pro: number;
    agency: number;
    enterprise: number;
  };
  audits: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    pagesCrawledToday: number;
  };
}

export interface SystemHealth {
  database: boolean;
  queueSize: number;
  activeAudits: number;
  failedAuditsToday: number;
}

export interface AdminUser {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  email_verified: boolean;
  is_super_admin: boolean;
  created_at: string;
  last_login_at: string | null;
  organization_count: number;
}

export interface AdminOrganization {
  id: string;
  name: string;
  slug: string;
  owner_email: string;
  owner_name: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  member_count: number;
  domain_count: number;
  audit_count: number;
  created_at: string;
}

export interface AdminActivity {
  id: string;
  admin_email: string;
  action: string;
  target_type: string;
  target_id: string | null;
  details: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}

export interface AnalyticsDataPoint {
  date: string;
  total_users: number;
  new_users: number;
  active_users: number;
  total_audits: number;
  audits_today: number;
  pages_crawled_today: number;
}

// Re-export Pagination from audit.types.ts to avoid duplication
export type { Pagination } from './audit.types';

export type SubscriptionTier = 'free' | 'starter' | 'pro' | 'agency' | 'enterprise';
export type AdminSubscriptionTier = SubscriptionTier;
export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'trialing' | 'paused';
export type AdminSubscriptionStatus = SubscriptionStatus;

// Worker & Queue Types
export interface WorkerStatus {
  status: string;
  uptime: number;
  workerId: string;
  isProcessing: boolean;
  stats: { jobsProcessed: number; jobsFailed: number; lastJobTime: string | null };
  queue24h: { pending: number; processing: number; completed: number; failed: number };
  memory: { usedPercent: number; freeMB: number; totalMB: number; threshold: number; effectiveConcurrency: number };
}

export interface QueueJob {
  id: string;
  target_url: string;
  target_domain: string;
  status: string;
  max_pages: number;
  pages_found: number;
  pages_crawled: number;
  pages_audited: number;
  current_url: string | null;
  total_issues: number;
  critical_issues: number;
  worker_id: string | null;
  error_message: string | null;
  created_at: string;
  started_at: string | null;
  locked_at: string | null;
  completed_at: string | null;
  user_email: string;
  user_first_name: string;
  user_last_name: string;
}

export interface QueueBacklog {
  jobs: QueueJob[];
  recentFailed: QueueJob[];
  counts: {
    pending: number;
    discovering: number;
    ready: number;
    processing: number;
    completed24h: number;
    failed24h: number;
    avgDurationSeconds: number | null;
  };
}

// Bug Report Types
export interface BugReport {
  id: string;
  user_id: string;
  title: string;
  description: string;
  severity: 'critical' | 'major' | 'minor' | 'trivial';
  category: string;
  page_url: string | null;
  user_agent: string | null;
  screen_size: string | null;
  screenshot_url: string | null;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'urgent' | 'high' | 'medium' | 'low' | null;
  admin_notes: string | null;
  resolution_notes: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  reporter_email?: string;
  reporter_name?: string;
}

export interface BugReportComment {
  id: string;
  bug_report_id: string;
  user_id: string;
  is_admin_comment: boolean;
  content: string;
  created_at: string;
  email?: string;
  first_name?: string;
  last_name?: string;
}

export interface BugReportStats {
  total: number;
  open: number;
  in_progress: number;
  resolved: number;
  closed: number;
  critical: number;
  last_7_days: number;
  last_24_hours: number;
}

// Analytics Types
export interface AdminFunnelStage {
  name: string;
  count: number;
  rate: number;
}

export interface AdminFunnelAnalytics {
  stages: AdminFunnelStage[];
  period: string;
}

export interface AdminTopIssue {
  rule_id: string;
  rule_name: string;
  category: string;
  severity: string;
  count: number;
}

export interface AdminGlobalTrends {
  auditsPerDay: Array<{ date: string; count: number }>;
  pagesPerDay: Array<{ date: string; count: number }>;
  issuesPerDay: Array<{ date: string; count: number }>;
  topIssues: AdminTopIssue[];
  period: string;
}

export interface AdminTierRevenue {
  tier: string;
  count: number;
  mrr: number;
}

export interface AdminRevenueAnalytics {
  mrr: number;
  arr: number;
  totalRevenue: number;
  byTier: AdminTierRevenue[];
  churnRate: number;
  trialConversionRate: number;
}

// Admin Schedule Types
export interface AdminScheduleItem {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  site_id: string | null;
  site_name: string | null;
  name: string | null;
  target_url: string;
  frequency: string;
  cron_expression: string;
  enabled: boolean;
  paused_reason: string | null;
  run_count: number;
  consecutive_failures: number;
  max_consecutive_failures: number;
  next_run_at: string | null;
  last_run_at: string | null;
  last_status: string | null;
  created_at: string;
}

export interface AdminScheduleStats {
  total: number;
  active: number;
  paused: number;
  byFrequency: Record<string, number>;
}

export const TIER_LABELS: Record<SubscriptionTier, string> = {
  free: 'Free',
  starter: 'Starter',
  pro: 'Pro',
  agency: 'Agency',
  enterprise: 'Enterprise',
};

export const TIER_COLORS: Record<SubscriptionTier, string> = {
  free: 'gray',
  starter: 'blue',
  pro: 'indigo',
  agency: 'purple',
  enterprise: 'amber',
};

export const STATUS_COLORS: Record<SubscriptionStatus, string> = {
  active: 'green',
  past_due: 'yellow',
  canceled: 'red',
  trialing: 'blue',
  paused: 'gray',
};

// =============================================
// Marketing Types
// =============================================

export type MarketingPlatform = 'twitter' | 'linkedin' | 'instagram' | 'facebook' | 'threads' | 'other';
export type MarketingContentStatus = 'draft' | 'ready' | 'posted' | 'archived';

export interface MarketingCampaign {
  id: string;
  name: string;
  color: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  content_count?: number;
}

export interface MarketingContent {
  id: string;
  platform: MarketingPlatform;
  title: string | null;
  body: string;
  preview: string;
  media: { url: string; alt?: string; type?: string }[];
  campaign_id: string | null;
  campaign?: MarketingCampaign | null;
  status: MarketingContentStatus;
  notes: string | null;
  char_count: number;
  week_number: number | null;
  day_of_week: number | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface MarketingContentStats {
  total: number;
  by_platform: Record<string, number>;
  by_status: Record<string, number>;
  by_campaign: { id: string; name: string; count: number }[];
}

export interface CreateMarketingContentInput {
  platform: MarketingPlatform;
  title?: string;
  body: string;
  media?: { url: string; alt?: string; type?: string }[];
  campaign_id?: string | null;
  status?: MarketingContentStatus;
  notes?: string;
  week_number?: number | null;
  day_of_week?: number | null;
}

export interface CreateMarketingCampaignInput {
  name: string;
  color?: string;
  description?: string;
}
