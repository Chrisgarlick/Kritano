/**
 * Email Template Types
 *
 * Block-based email template model, MJML compilation types, and branding resolution.
 */

// ========================================
// Block Types
// ========================================

export interface HeaderBlock {
  type: 'header';
  logoUrl?: string;
  companyName?: string;
  backgroundColor?: string;
}

export interface HeroImageBlock {
  type: 'hero_image';
  src: string;
  alt: string;
  href?: string;
  width?: number;
}

export interface TextBlock {
  type: 'text';
  content: string;
  align?: 'left' | 'center' | 'right';
  fontSize?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  padding?: string;
}

export interface ButtonBlock {
  type: 'button';
  label: string;
  href: string;
  align?: 'left' | 'center' | 'right';
  backgroundColor?: string;
  color?: string;
  borderRadius?: string;
}

export interface TwoColumnBlock {
  type: 'two_column';
  left: EmailBlock[];
  right: EmailBlock[];
  ratio?: '50:50' | '30:70' | '70:30';
}

export interface DividerBlock {
  type: 'divider';
  color?: string;
  width?: string;
  padding?: string;
}

export interface SpacerBlock {
  type: 'spacer';
  height?: string;
}

export interface ScoreTableBlock {
  type: 'score_table';
}

export interface IssuesSummaryBlock {
  type: 'issues_summary';
}

export interface FooterBlock {
  type: 'footer';
  text?: string;
  includeUnsubscribe: boolean;
  includeSocialLinks?: boolean;
}

export type EmailBlock =
  | HeaderBlock
  | HeroImageBlock
  | TextBlock
  | ButtonBlock
  | TwoColumnBlock
  | DividerBlock
  | SpacerBlock
  | ScoreTableBlock
  | IssuesSummaryBlock
  | FooterBlock;

// ========================================
// Template Category
// ========================================

export type TemplateCategory =
  | 'transactional'
  | 'onboarding'
  | 'engagement'
  | 'upgrade'
  | 'security'
  | 'win_back'
  | 'educational'
  | 'announcement'
  | 'digest';

export type BrandingMode = 'platform' | 'site' | 'org';

// ========================================
// Template Model
// ========================================

export interface EmailTemplate {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  subject: string;
  preview_text: string | null;
  blocks: EmailBlock[];
  compiled_html: string | null;
  compiled_at: string | null;
  category: TemplateCategory;
  variables: string[];
  is_system: boolean;
  is_active: boolean;
  branding_mode: BrandingMode;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTemplateInput {
  slug: string;
  name: string;
  description?: string;
  subject: string;
  preview_text?: string;
  blocks: EmailBlock[];
  category: TemplateCategory;
  variables?: string[];
  is_system?: boolean;
  branding_mode?: BrandingMode;
  created_by?: string;
}

export interface UpdateTemplateInput {
  name?: string;
  description?: string;
  subject?: string;
  preview_text?: string;
  blocks?: EmailBlock[];
  category?: TemplateCategory;
  variables?: string[];
  is_active?: boolean;
  branding_mode?: BrandingMode;
}

export interface TemplateFilters {
  category?: TemplateCategory;
  is_system?: boolean;
  is_active?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

// ========================================
// Email Send Model
// ========================================

export type EmailSendStatus =
  | 'queued'
  | 'sent'
  | 'delivered'
  | 'opened'
  | 'clicked'
  | 'bounced'
  | 'complained'
  | 'failed';

export interface EmailSend {
  id: string;
  template_id: string;
  campaign_id: string | null;
  user_id: string;
  sent_by: string | null;
  to_email: string;
  subject: string;
  variables: Record<string, string>;
  status: EmailSendStatus;
  resend_message_id: string | null;
  error_message: string | null;
  sent_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  created_at: string;
}

// ========================================
// Email Preferences
// ========================================

export interface EmailPreferences {
  user_id: string;
  transactional: boolean;
  audit_notifications: boolean;
  product_updates: boolean;
  educational: boolean;
  marketing: boolean;
  unsubscribed_all: boolean;
  updated_at: string;
}

// Map template categories to preference columns
export const CATEGORY_TO_PREFERENCE: Record<TemplateCategory, keyof EmailPreferences | null> = {
  transactional: 'transactional',
  onboarding: 'product_updates',
  engagement: 'marketing',
  upgrade: 'marketing',
  security: 'transactional',
  win_back: 'marketing',
  educational: 'educational',
  announcement: 'product_updates',
  digest: 'product_updates',
};

// ========================================
// Email Branding
// ========================================

export interface EmailBranding {
  headerBackground: string;
  headerTextColor: string;
  bodyBackground: string;
  bodyTextColor: string;
  buttonColor: string;
  buttonTextColor: string;
  footerBackground: string;
  footerTextColor: string;
  linkColor: string;
  dividerColor: string;
  companyName: string;
  logoUrl: string | null;
  footerText: string;
}

export const EMAIL_BRAND_DEFAULTS: EmailBranding = {
  headerBackground: '#4f46e5',
  headerTextColor: '#ffffff',
  bodyBackground: '#f8fafc',
  bodyTextColor: '#334155',
  buttonColor: '#4f46e5',
  buttonTextColor: '#ffffff',
  footerBackground: '#f1f5f9',
  footerTextColor: '#64748b',
  linkColor: '#4f46e5',
  dividerColor: '#e2e8f0',
  companyName: 'Kritano',
  logoUrl: null,
  footerText: 'Powered by Kritano',
};

// ========================================
// Send Template Params
// ========================================

export interface SendTemplateParams {
  templateSlug: string;
  to: {
    userId: string;
    email: string;
    firstName: string;
  };
  variables: Record<string, string>;
  sentBy?: string;
  campaignId?: string;
  siteId?: string;
}

// ========================================
// Font Size Mapping
// ========================================

export const FONT_SIZE_MAP: Record<string, string> = {
  sm: '14px',
  md: '16px',
  lg: '20px',
  xl: '24px',
};
