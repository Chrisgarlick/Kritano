/**
 * Email Campaign Types
 *
 * Campaign model, segment definitions, stats tracking, and webhook events.
 */

// ========================================
// Campaign Status
// ========================================

export type CampaignStatus =
  | 'draft'
  | 'scheduled'
  | 'sending'
  | 'paused'
  | 'sent'
  | 'cancelled'
  | 'failed';

// ========================================
// Campaign Segment
// ========================================

export interface CampaignSegment {
  tiers?: string[];
  leadStatuses?: string[];
  minLeadScore?: number;
  maxLeadScore?: number;
  verifiedDomain?: boolean;
  auditCountMin?: number;
  auditCountMax?: number;
  lastLoginAfter?: string;
  lastLoginBefore?: string;
  registeredAfter?: string;
  registeredBefore?: string;
  excludeUserIds?: string[];
}

// ========================================
// Campaign Stats
// ========================================

export interface CampaignStats {
  total: number;
  queued: number;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  complained: number;
  failed: number;
}

// ========================================
// Campaign Model
// ========================================

export interface EmailCampaign {
  id: string;
  name: string;
  description: string | null;
  template_id: string;
  status: CampaignStatus;
  segment: CampaignSegment;
  audience_count: number;
  scheduled_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  stats: CampaignStats;
  send_rate_per_second: number;
  max_recipients: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  template_name?: string;
  template_slug?: string;
}

export interface CreateCampaignInput {
  name: string;
  description?: string;
  template_id: string;
  segment?: CampaignSegment;
  send_rate_per_second?: number;
  max_recipients?: number;
}

export interface UpdateCampaignInput {
  name?: string;
  description?: string;
  template_id?: string;
  segment?: CampaignSegment;
  send_rate_per_second?: number;
  max_recipients?: number;
}

// ========================================
// Campaign Filters
// ========================================

export interface CampaignFilters {
  status?: CampaignStatus;
  search?: string;
  page?: number;
  limit?: number;
}

// ========================================
// Email Events (Webhook)
// ========================================

export type EmailEventType =
  | 'email.sent'
  | 'email.delivered'
  | 'email.delivery_delayed'
  | 'email.opened'
  | 'email.clicked'
  | 'email.bounced'
  | 'email.complained';

export interface EmailEvent {
  id: string;
  email_send_id: string;
  campaign_id: string | null;
  event_type: EmailEventType;
  payload: Record<string, unknown>;
  resend_event_id: string | null;
  created_at: string;
}

// ========================================
// Email Analytics
// ========================================

export interface EmailAnalyticsSummary {
  date: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  complained: number;
}

export interface TemplatePerformance {
  template_id: string;
  template_name: string;
  template_slug: string;
  total_sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  delivery_rate: number;
  open_rate: number;
  click_rate: number;
}
