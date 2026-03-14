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
export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'trialing' | 'paused';

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
