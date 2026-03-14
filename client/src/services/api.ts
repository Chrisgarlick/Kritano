import axios, { type AxiosInstance, type AxiosError } from 'axios';
import type { ErrorResponse } from '../types/auth.types';
import type {
  Site,
  SiteWithStats,
  SiteUrl,
  SitePermission,
  CreateSiteInput,
  UpdateSiteInput,
  SiteUsage,
  ScoreHistoryEntry,
  Subscription,
  TierLimits,
  VerificationInstructions,
} from '../types/site.types';

// Get CSRF token from cookie
function getCsrfToken(): string | null {
  const match = document.cookie.match(/csrf_token=([^;]+)/);
  return match ? match[1] : null;
}

// Create axios instance
export const api: AxiosInstance = axios.create({
  baseURL: '/api',
  withCredentials: true, // Send cookies with requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add CSRF token to requests
api.interceptors.request.use((config) => {
  const csrfToken = getCsrfToken();
  if (csrfToken && !['GET', 'HEAD', 'OPTIONS'].includes(config.method?.toUpperCase() || '')) {
    config.headers['x-csrf-token'] = csrfToken;
  }
  return config;
});

// Response interceptor for handling token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(undefined);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ErrorResponse>) => {
    const originalRequest = error.config;
    const errorCode = error.response?.data?.code;

    // Handle 401 errors
    if (error.response?.status === 401) {
      // If token expired, try to refresh
      if (
        errorCode === 'TOKEN_EXPIRED' &&
        originalRequest &&
        !(originalRequest as typeof originalRequest & { _retry?: boolean })._retry
      ) {
        if (isRefreshing) {
          // Queue this request until refresh completes
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then(() => api(originalRequest));
        }

        (originalRequest as typeof originalRequest & { _retry?: boolean })._retry = true;
        isRefreshing = true;

        try {
          await api.post('/auth/refresh');
          processQueue(null);
          return api(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError);
          // Redirect to login on refresh failure
          window.location.href = '/login';
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      // For other auth errors, redirect to login (unless on public pages)
      const publicPaths = ['/', '/login', '/register'];
      const currentPath = window.location.pathname;
      const isPublicPage = publicPaths.includes(currentPath) ||
                           currentPath.startsWith('/login') ||
                           currentPath.startsWith('/register');
      if (!isPublicPage) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Auth API functions
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    companyName?: string;
    acceptedTos?: boolean;
  }) => api.post('/auth/register', data),

  logout: () => api.post('/auth/logout'),

  logoutAll: () => api.post('/auth/logout-all'),

  refresh: () => api.post('/auth/refresh'),

  me: () => api.get('/auth/me'),

  verifyEmail: (token: string) => api.post('/auth/verify-email', { token }),

  resendVerification: (email: string) =>
    api.post('/auth/resend-verification', { email }),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),

  getSessions: () => api.get('/auth/sessions'),
};

// User API functions
export const userApi = {
  getSubscription: () =>
    api.get<{ subscription: Subscription | null; limits: TierLimits | null }>('/subscription'),

  startTrial: (tier: string) =>
    api.post('/subscription/start-trial', { tier }),

  getUsage: () =>
    api.get('/usage'),
};

// Billing API functions
export const billingApi = {
  createCheckout: (tier: string) =>
    api.post<{ url: string }>('/subscription/checkout', { tier }),

  createPortal: () =>
    api.post<{ url: string }>('/subscription/portal'),
};

// Early Access API functions
export const earlyAccessApi = {
  getStatus: () =>
    api.get<{ enabled: boolean; spotsRemaining: number; maxSpots: number; isFull: boolean }>('/early-access/status'),
};

// Coming Soon API functions
export const comingSoonApi = {
  getStatus: () =>
    api.get<{ enabled: boolean; headline: string; description: string }>('/coming-soon/status'),

  signup: (data: { email: string; name?: string }) =>
    api.post('/coming-soon/signup', data),
};

// Audit API functions
export const auditsApi = {
  start: (data: { targetUrl: string; siteId?: string; options?: object; consent?: { accepted: boolean; dontShowAgain?: boolean } }) =>
    api.post('/audits', data),

  getDomainStatus: (url: string) =>
    api.get<{
      domain: string;
      isVerified: boolean;
      requiresConsent: boolean;
      userSkipsWarning: boolean;
      scanLimits: {
        maxPages: number;
        minDelayMs: number;
        robotsTxtRequired: boolean;
        sequential: boolean;
      } | null;
    }>('/audits/domain-status', { params: { url } }),

  list: (params?: { status?: string; limit?: number; offset?: number; siteId?: string }) =>
    api.get('/audits', { params }),

  get: (id: string) =>
    api.get(`/audits/${id}`),

  getFindings: (id: string, params?: { category?: string; severity?: string; limit?: number; page?: number }) =>
    api.get(`/audits/${id}/findings`, { params }),

  getBrokenLinks: (id: string) =>
    api.get(`/audits/${id}/broken-links`),

  getPages: (id: string, params?: { status?: string; limit?: number; page?: number }) =>
    api.get(`/audits/${id}/pages`, { params }),

  getPage: (auditId: string, pageId: string) =>
    api.get(`/audits/${auditId}/pages/${pageId}`),

  dismiss: (auditId: string, findingId: string, status: 'dismissed' | 'active') =>
    api.patch(`/audits/${auditId}/findings/${findingId}/dismiss`, { status }),

  bulkDismiss: (auditId: string, ruleId: string, message: string, status?: 'dismissed' | 'active') =>
    api.patch(`/audits/${auditId}/findings/bulk-dismiss`, { ruleId, message, status }),

  rerun: (id: string) =>
    api.post(`/audits/${id}/rerun`),

  checkUrl: (url: string) =>
    api.get<{ reachable: boolean; status?: number; error?: string; finalUrl?: string }>('/audits/check-url', { params: { url } }),

  cancel: (id: string) =>
    api.post(`/audits/${id}/cancel`),

  delete: (id: string) =>
    api.delete(`/audits/${id}`),

  getRecentUrls: () =>
    api.get<{ urls: Array<{ target_url: string; target_domain: string }> }>('/audits/recent-urls'),

  dismissFinding: (auditId: string, findingId: string, status: 'dismissed' | 'active') =>
    api.patch(`/audits/${auditId}/findings/${findingId}/dismiss`, { status }),

  exportCsv: (id: string) =>
    api.get(`/audits/${id}/export/csv`, { responseType: 'blob' }),

  exportJson: (id: string) =>
    api.get(`/audits/${id}/export/json`, { responseType: 'blob' }),

  exportMarkdown: (id: string) =>
    api.get(`/audits/${id}/export/markdown`, { responseType: 'blob' }),

  exportHtml: (id: string) =>
    api.get(`/audits/${id}/export/html`, { responseType: 'blob' }),

  exportPdf: (id: string) =>
    api.get(`/audits/${id}/export/pdf`, { responseType: 'blob' }),

  getScoreHistory: (id: string) =>
    api.get<{ history: Array<{ id: string; created_at: string; seo_score: number | null; accessibility_score: number | null; security_score: number | null; performance_score: number | null }> }>(`/audits/${id}/score-history`),

  getIndexExposure: (id: string) =>
    api.get<{
      total: number;
      bySeverity: { critical: number; serious: number; moderate: number; minor: number; info: number };
      byCategory: Record<string, number>;
      findings: Array<{
        id: string;
        rule_id: string;
        rule_name: string;
        severity: string;
        message: string;
        description: string | null;
        recommendation: string | null;
        selector: string | null;
        snippet: string | null;
        help_url: string | null;
        created_at: string;
      }>;
      scanPerformed: boolean;
    }>(`/audits/${id}/index-exposure`),

  getSchemaSummary: (id: string) =>
    api.get<{
      hasStructuredData: boolean;
      jsonLdCount: number;
      hasOpenGraph: boolean;
      hasTwitterCard: boolean;
      detectedTypes: string[];
      pagesWithSchema: number;
      pagesWithoutSchema: number;
      totalPages: number;
      pages: Array<{
        id: string;
        url: string;
        title: string | null;
        metaDescription: string | null;
        jsonLdCount: number;
        hasOg: boolean;
        hasTc: boolean;
        detectedTypes: string[];
        detectedPageType: string | null;
        ogData: Record<string, unknown> | null;
        tcData: Record<string, unknown> | null;
        jsonLdItems: Array<Record<string, unknown>> | null;
      }>;
    }>(`/audits/${id}/schema-summary`),

  generateSchema: (auditId: string, pageId: string) =>
    api.post<{ jsonLd: string; pageType: string }>(`/audits/${auditId}/pages/${pageId}/generate-schema`),

  generateSchemaAll: (auditId: string) =>
    api.post<{
      pages: Array<{ pageId: string; url: string; title: string | null; pageType: string; jsonLd: string }>;
      combined: string;
    }>(`/audits/${auditId}/generate-schema-all`),

  getAssets: (id: string, params?: { type?: string; search?: string; sort?: string; order?: string; limit?: number; offset?: number }) =>
    api.get(`/audits/${id}/assets`, { params }),

  getAssetPages: (auditId: string, assetId: string) =>
    api.get<{ pages: Array<{ id: string; url: string; title: string | null; html_element: string | null; html_attribute: string | null }> }>(
      `/audits/${auditId}/assets/${assetId}/pages`
    ),

  getPageAssets: (auditId: string, pageId: string) =>
    api.get<{ assets: Array<{
      id: string; url: string; asset_type: string; mime_type: string | null; file_extension: string | null;
      file_name: string | null; file_size_bytes: number | null; source: string; http_status: number | null;
      page_count: number; html_element: string | null; html_attribute: string | null;
    }> }>(`/audits/${auditId}/pages/${pageId}/assets`),

  createProgressStream: (id: string) =>
    new EventSource(`/api/audits/${id}/stream`, { withCredentials: true } as EventSourceInit),
};

// Sites API functions
export const sitesApi = {
  list: () =>
    api.get<{
      sites: SiteWithStats[];
      usage: SiteUsage & { canAddMore: boolean };
    }>('/sites'),

  create: (data: CreateSiteInput) =>
    api.post<{ site: Site }>('/sites', data),

  get: (siteId: string) =>
    api.get<{
      site: SiteWithStats;
      permission: SitePermission;
      isOwner: boolean;
      scoreHistory: ScoreHistoryEntry[];
    }>(`/sites/${siteId}`),

  update: (siteId: string, data: UpdateSiteInput) =>
    api.patch<{ site: Site }>(`/sites/${siteId}`, data),

  delete: (siteId: string) =>
    api.delete(`/sites/${siteId}`),

  getAudits: (siteId: string, params: { limit?: number; offset?: number; status?: string } = {}) => {
    const searchParams = new URLSearchParams();
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.offset) searchParams.set('offset', String(params.offset));
    if (params.status) searchParams.set('status', params.status);
    const query = searchParams.toString();
    return api.get<{
      audits: Array<{
        id: string;
        targetUrl: string;
        targetDomain: string;
        status: string;
        pagesFound: number;
        pagesCrawled: number;
        pagesAudited: number;
        totalIssues: number;
        criticalIssues: number;
        seoScore: number | null;
        accessibilityScore: number | null;
        securityScore: number | null;
        performanceScore: number | null;
        startedAt: string | null;
        completedAt: string | null;
        createdAt: string;
      }>;
      pagination: { total: number; limit: number; offset: number };
    }>(`/sites/${siteId}/audits${query ? `?${query}` : ''}`);
  },

  getUrls: (siteId: string, params?: {
    search?: string;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.offset) searchParams.set('offset', String(params.offset));
    if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder);
    const query = searchParams.toString();
    return api.get<{
      urls: SiteUrl[];
      pagination: { total: number; limit: number; offset: number };
    }>(`/sites/${siteId}/urls${query ? `?${query}` : ''}`);
  },

  getUrlsCount: (siteId: string) =>
    api.get<{ count: number }>(`/sites/${siteId}/urls-count`),

  addUrl: (siteId: string, url: string) =>
    api.post<{ url: SiteUrl }>(`/sites/${siteId}/urls`, { url }),

  getUrl: (siteId: string, urlId: string) =>
    api.get<{ url: SiteUrl }>(`/sites/${siteId}/urls/${urlId}`),

  getUrlAudits: (siteId: string, urlId: string, params?: { limit?: number; offset?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.offset) searchParams.set('offset', String(params.offset));
    const query = searchParams.toString();
    return api.get(`/sites/${siteId}/urls/${urlId}/audits${query ? `?${query}` : ''}`);
  },

  discoverPages: (siteId: string) =>
    api.post<{
      message: string;
      urlsDiscovered: number;
      errors?: string[];
    }>(`/sites/${siteId}/discover-urls`),

  generateVerificationToken: (siteId: string, regenerate: boolean = false) =>
    api.post<{
      token: string;
      instructions: VerificationInstructions;
    }>(`/sites/${siteId}/verification-token`, { regenerate }),

  verify: (siteId: string, method: 'dns' | 'file') =>
    api.post<{
      verified: boolean;
      method?: 'dns' | 'file';
      error?: string;
      details?: string;
    }>(`/sites/${siteId}/verify`, { method }),

  extractBranding: (siteId: string) =>
    api.post<{
      palette: { primary: string; secondary: string; accent: string };
      companyName: string;
      allColors: string[];
    }>(`/sites/${siteId}/extract-branding`),

  // Sharing
  getShares: (siteId: string) =>
    api.get<{
      shares: Array<{
        id: string;
        userId: string;
        email: string;
        name: string;
        permission: string;
        invitedAt: string;
        acceptedAt: string | null;
      }>;
      memberLimit: { used: number; max: number | null; tier: string };
    }>(`/sites/${siteId}/shares`),

  shareByEmail: (siteId: string, email: string, permission: string) =>
    api.post(`/sites/${siteId}/shares`, { email, permission }),

  updateShare: (siteId: string, shareId: string, permission: string) =>
    api.patch(`/sites/${siteId}/shares/${shareId}`, { permission }),

  removeShare: (siteId: string, shareId: string) =>
    api.delete(`/sites/${siteId}/shares/${shareId}`),

  getInvitations: (siteId: string) =>
    api.get<{
      invitations: Array<{
        id: string;
        email: string;
        permission: string;
        status: string;
        invitedBy: string;
        expiresAt: string;
        createdAt: string;
      }>;
    }>(`/sites/${siteId}/invitations`),

  createInvitation: (siteId: string, email: string, permission: string) =>
    api.post(`/sites/${siteId}/invitations`, { email, permission }),

  cancelInvitation: (siteId: string, invitationId: string) =>
    api.delete(`/sites/${siteId}/invitations/${invitationId}`),
};

// Site Invitations API functions
export const siteInvitationsApi = {
  get: (token: string) =>
    api.get(`/invitations/${token}`),

  accept: (token: string) =>
    api.post(`/invitations/${token}/accept`),

  decline: (token: string) =>
    api.post(`/invitations/${token}/decline`),

  getPending: () =>
    api.get<{
      invitations: Array<{
        id: string;
        email: string;
        permission: string;
        siteName: string;
        siteDomain: string;
        inviterName: string;
        expiresAt: string;
        token: string;
      }>;
    }>('/invitations/pending/me'),
};

// Organizations API functions
export const organizationsApi = {
  list: () =>
    api.get('/organizations'),

  create: (data: { name: string; slug?: string }) =>
    api.post('/organizations', data),

  get: (orgId: string) =>
    api.get(`/organizations/${orgId}`),

  update: (orgId: string, data: { name?: string; slug?: string }) =>
    api.patch(`/organizations/${orgId}`, data),

  delete: (orgId: string) =>
    api.delete(`/organizations/${orgId}`),

  getMembers: (orgId: string) =>
    api.get(`/organizations/${orgId}/members`),

  inviteMember: (orgId: string, data: { email: string; role?: string }) =>
    api.post(`/organizations/${orgId}/members`, data),

  removeMember: (orgId: string, memberId: string) =>
    api.delete(`/organizations/${orgId}/members/${memberId}`),

  updateMemberRole: (orgId: string, memberId: string, role: string) =>
    api.patch(`/organizations/${orgId}/members/${memberId}`, { role }),

  getSubscription: (orgId: string) =>
    api.get(`/organizations/${orgId}/subscription`),
};

// Consent API functions
export const consentApi = {
  logCookieConsent: (data: {
    consent_version: string;
    categories: Record<string, boolean>;
    action: string;
    page_url: string;
  }) => api.post<{ success: boolean; logged_at: string }>('/consent/cookies', data),
};

// Schedule types
export type ScheduleFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom';

export interface AuditScheduleSummary {
  id: string;
  user_id: string;
  site_id: string | null;
  name: string | null;
  target_url: string;
  target_domain: string;
  frequency: ScheduleFrequency;
  cron_expression: string;
  next_run_at: string | null;
  last_run_at: string | null;
  last_status: string | null;
  enabled: boolean;
  paused_reason: string | null;
  run_count: number;
  consecutive_failures: number;
  timezone: string;
  created_at: string;
  site_name?: string;
  site_verified?: boolean;
}

export interface AuditScheduleDetail extends AuditScheduleSummary {
  config: Record<string, unknown>;
  last_audit_id: string | null;
  failure_count: number;
  max_consecutive_failures: number;
  paused_at: string | null;
  notify_on_completion: boolean;
  notify_on_failure: boolean;
  updated_at: string;
}

export interface ScheduleRunSummary {
  id: string;
  status: string;
  target_url: string;
  created_at: string;
  completed_at: string | null;
  seo_score: number | null;
  accessibility_score: number | null;
  security_score: number | null;
  performance_score: number | null;
  total_issues: number | null;
}

export interface CreateSchedulePayload {
  targetUrl: string;
  name?: string;
  frequency: ScheduleFrequency;
  cronExpression?: string;
  config?: Record<string, unknown>;
  notifyOnCompletion?: boolean;
  notifyOnFailure?: boolean;
  timezone?: string;
  dayOfWeek?: number;
  hourOfDay?: number;
}

export interface UpdateSchedulePayload {
  name?: string;
  frequency?: ScheduleFrequency;
  cronExpression?: string;
  config?: Record<string, unknown>;
  notifyOnCompletion?: boolean;
  notifyOnFailure?: boolean;
  timezone?: string;
  dayOfWeek?: number;
  hourOfDay?: number;
}

// Schedules API functions
export const schedulesApi = {
  list: (siteId?: string) => {
    const params = siteId ? `?siteId=${siteId}` : '';
    return api.get<{ schedules: AuditScheduleSummary[] }>(`/audits/schedules${params}`);
  },

  get: (id: string) =>
    api.get<{ schedule: AuditScheduleDetail; recentRuns: ScheduleRunSummary[] }>(`/audits/schedules/${id}`),

  create: (data: CreateSchedulePayload) =>
    api.post<{ schedule: AuditScheduleDetail }>('/audits/schedules', data),

  update: (id: string, data: UpdateSchedulePayload) =>
    api.patch<{ schedule: AuditScheduleDetail }>(`/audits/schedules/${id}`, data),

  delete: (id: string) =>
    api.delete(`/audits/schedules/${id}`),

  toggle: (id: string, enabled: boolean) =>
    api.post<{ schedule: AuditScheduleDetail }>(`/audits/schedules/${id}/toggle`, { enabled }),

  getRuns: (id: string, limit = 20, offset = 0) =>
    api.get<{ runs: ScheduleRunSummary[]; total: number }>(`/audits/schedules/${id}/runs?limit=${limit}&offset=${offset}`),
};

// Analytics API functions
import type {
  ScoreHistory,
  IssueTrends,
  AuditComparison,
  SiteComparison,
  TimeRange,
  GroupBy,
  UserOverview,
  UrlAnalytics,
  UrlComparison,
  UserAuditedUrl,
} from '../types/analytics.types';

export const analyticsApi = {
  getSiteScores: (siteId: string, options?: { range?: TimeRange; from?: string; to?: string }) =>
    api.get<ScoreHistory>(`/analytics/sites/${siteId}/scores`, { params: options }),

  getSiteIssues: (siteId: string, options?: { range?: TimeRange; groupBy?: GroupBy }) =>
    api.get<IssueTrends>(`/analytics/sites/${siteId}/issues`, { params: options }),

  compareAudits: (auditIds: string[]) =>
    api.get<AuditComparison>('/analytics/compare', { params: { audits: auditIds.join(',') } }),

  compareSites: (siteIds: string[]) =>
    api.get<SiteComparison>('/analytics/compare-sites', { params: { sites: siteIds.join(',') } }),

  getUserOverview: () =>
    api.get<UserOverview>('/analytics/overview'),

  getUrlAnalytics: (siteId: string, urlId: string) =>
    api.get<UrlAnalytics>(`/analytics/sites/${siteId}/urls/${urlId}`),

  getUrlScores: (siteId: string, urlId: string, options?: { range?: TimeRange }) =>
    api.get<ScoreHistory>(`/analytics/sites/${siteId}/urls/${urlId}/scores`, { params: options }),

  getUserUrls: (search?: string, limit?: number) =>
    api.get<UserAuditedUrl[]>('/analytics/user-urls', { params: { search, limit } }),

  compareUrls: (urlSpecs: [{ siteId: string; urlId: string }, { siteId: string; urlId: string }]) =>
    api.get<UrlComparison>('/analytics/compare-urls', {
      params: { urls: urlSpecs.map(s => `${s.siteId}:${s.urlId}`).join(',') },
    }),
};

// CRM & Email types
export interface CrmLead {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  lead_score: number;
  lead_status: string;
  lead_score_updated_at: string;
  email_verified: boolean;
  last_login_at: string | null;
  created_at: string;
  tier: string;
  total_audits: number;
  completed_audits: number;
  total_sites: number;
  verified_domains: number;
  team_members: number;
  has_exported_pdf: boolean;
}

export interface CrmStats {
  total: number;
  avg_score: number;
  by_status: Record<string, number>;
}

export interface CrmTrigger {
  id: string;
  user_id: string;
  trigger_type: string;
  status: string;
  context: Record<string, unknown>;
  created_at: string;
  actioned_at: string | null;
  actioned_by: string | null;
  user_email?: string;
  user_first_name?: string;
  user_last_name?: string;
  user_lead_score?: number;
  user_lead_status?: string;
}

export interface CrmTriggerStats {
  total: number;
  pending: number;
  sent: number;
  dismissed: number;
  actioned: number;
  by_type: Record<string, number>;
}

export interface CrmTimelineEvent {
  event: string;
  detail: string;
  timestamp: string;
}

export interface CrmMembership {
  site_id: string;
  site_name: string;
  site_domain: string;
  role: string;
  tier: string;
  verified: boolean;
  last_audit_at: string | null;
  audit_count: number;
}

export interface CrmOutreachRecord {
  id: string;
  template_id: string;
  subject: string;
  status: string;
  created_at: string;
  template_name?: string;
  template_slug?: string;
  sent_by_email?: string;
}

export interface EmailCampaignItem {
  id: string;
  name: string;
  description: string | null;
  template_id: string;
  status: string;
  segment: Record<string, unknown>;
  audience_count: number;
  scheduled_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  stats: {
    total: number;
    queued: number;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    complained: number;
    failed: number;
  };
  send_rate_per_second: number;
  max_recipients: number;
  created_at: string;
  template_name?: string;
  template_slug?: string;
}

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

export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'paused' | 'sent' | 'cancelled' | 'failed';

export interface EmailSendRecord {
  id: string;
  to_email: string;
  status: string;
  resend_message_id?: string;
  sent_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  error_message?: string;
  created_at: string;
}

export interface EmailAnalyticsDay {
  date: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  complained: number;
}

export interface EmailAnalyticsTotals {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  complained: number;
}

export interface TemplatePerformanceItem {
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

// Admin API types - import for use in adminApi + re-export for admin pages
import type {
  DashboardStats,
  SystemHealth,
  AnalyticsDataPoint,
  AdminUser,
  AdminOrganization,
  AdminActivity,
  Pagination,
  AdminSubscriptionTier,
  AdminSubscriptionStatus,
  WorkerStatus,
  QueueBacklog,
  AdminFunnelAnalytics,
  AdminFunnelStage,
  AdminGlobalTrends,
  AdminTopIssue,
  AdminRevenueAnalytics,
  AdminTierRevenue,
  BugReport,
  BugReportComment,
  BugReportStats,
  AdminScheduleItem,
  AdminScheduleStats,
  AdminScoreDistribution,
  AdminTierAuditBreakdown,
  MarketingCampaign,
  MarketingContent,
  MarketingContentStats,
  CreateMarketingContentInput,
  CreateMarketingCampaignInput,
  MarketingPlatform,
  MarketingContentStatus,
} from '../types/admin.types';

export type {
  DashboardStats,
  SystemHealth,
  AnalyticsDataPoint,
  AdminUser,
  AdminOrganization,
  AdminActivity,
  Pagination,
  AdminSubscriptionTier,
  AdminSubscriptionStatus,
  WorkerStatus,
  QueueBacklog,
  AdminFunnelAnalytics,
  AdminFunnelStage,
  AdminGlobalTrends,
  AdminTopIssue,
  AdminRevenueAnalytics,
  AdminTierRevenue,
  BugReport,
  BugReportComment,
  BugReportStats,
  AdminScheduleItem,
  AdminScheduleStats,
  AdminScoreDistribution,
  AdminTierAuditBreakdown,
  MarketingCampaign,
  MarketingContent,
  MarketingContentStats,
  CreateMarketingContentInput,
  CreateMarketingCampaignInput,
  MarketingPlatform,
  MarketingContentStatus,
};

// Admin API functions
export const adminApi = {
  check: () =>
    api.get<{ isAdmin: boolean; admin: { id: string; email: string } }>('/admin/check'),

  getDashboard: () =>
    api.get<{ stats: DashboardStats; health: SystemHealth }>('/admin/dashboard'),

  getAnalytics: (days: number = 30) =>
    api.get<{ analytics: AnalyticsDataPoint[] }>(`/admin/analytics?days=${days}`),

  getFunnelAnalytics: (range: string = '30d') =>
    api.get<AdminFunnelAnalytics>(`/admin/analytics/funnel?range=${range}`),

  getGlobalTrends: (range: string = '30d') =>
    api.get<AdminGlobalTrends>(`/admin/analytics/trends?range=${range}`),

  getRevenueAnalytics: () =>
    api.get<AdminRevenueAnalytics>('/admin/analytics/revenue'),

  listUsers: (params: { page?: number; limit?: number; search?: string; sortBy?: string; sortOrder?: string } = {}) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', String(params.page));
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.search) searchParams.set('search', params.search);
    if (params.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);
    return api.get<{ users: AdminUser[]; pagination: Pagination }>(`/admin/users?${searchParams.toString()}`);
  },

  getUser: (userId: string) =>
    api.get<{ user: AdminUser }>(`/admin/users/${userId}`),

  updateUser: (userId: string, data: { is_super_admin?: boolean }) =>
    api.patch<{ user: AdminUser }>(`/admin/users/${userId}`, data),

  deleteUser: (userId: string) =>
    api.delete<{ success: boolean }>(`/admin/users/${userId}`),

  listOrganizations: (params: { page?: number; limit?: number; search?: string; tier?: string; sortBy?: string; sortOrder?: string } = {}) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', String(params.page));
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.search) searchParams.set('search', params.search);
    if (params.tier) searchParams.set('tier', params.tier);
    if (params.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);
    return api.get<{ organizations: AdminOrganization[]; pagination: Pagination }>(`/admin/organizations?${searchParams.toString()}`);
  },

  getOrganization: (orgId: string) =>
    api.get<{ organization: AdminOrganization }>(`/admin/organizations/${orgId}`),

  updateSubscription: (orgId: string, data: { tier?: AdminSubscriptionTier; status?: AdminSubscriptionStatus }) =>
    api.patch<{ organization: AdminOrganization }>(`/admin/organizations/${orgId}/subscription`, data),

  getActivityLog: (params: { page?: number; limit?: number; adminId?: string } = {}) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', String(params.page));
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.adminId) searchParams.set('adminId', params.adminId);
    return api.get<{ activities: AdminActivity[]; pagination: Pagination }>(`/admin/activity?${searchParams.toString()}`);
  },

  getWorkerStatus: () =>
    api.get<WorkerStatus>('/admin/worker/status'),

  getWorkerHealth: () =>
    api.get<{ status: string; uptime: number }>('/admin/worker/health'),

  restartWorker: () =>
    api.post<{ success: boolean; message: string }>('/admin/worker/restart'),

  getQueueBacklog: () =>
    api.get<QueueBacklog>('/admin/worker/queue'),

  cancelQueueJob: (jobId: string) =>
    api.post<{ success: boolean; message: string }>(`/admin/worker/queue/${jobId}/cancel`),

  cancelAllPending: () =>
    api.post<{ success: boolean; cancelled: number }>('/admin/worker/queue/cancel-all'),

  // CRM stats
  getCrmStats: () =>
    api.get('/admin/crm/stats'),

  getTriggerStats: () =>
    api.get('/admin/crm/triggers/stats'),

  // Email analytics
  getEmailAnalytics: (days: number = 30) =>
    api.get(`/admin/email/analytics?days=${days}`),

  // CRM Leads
  getLeads: (params?: { status?: string; search?: string; sort?: string; order?: string; page?: number; limit?: number }) =>
    api.get('/admin/crm/leads', { params }),

  getLead: (userId: string) =>
    api.get(`/admin/crm/leads/${userId}`),

  recalcLeadScore: (userId: string) =>
    api.post(`/admin/crm/leads/${userId}/recalc`),

  sendOutreach: (userId: string, templateSlugOrData: string | { templateSlug: string; variables?: Record<string, string> }) =>
    api.post(`/admin/crm/outreach/${userId}`, typeof templateSlugOrData === 'string' ? { templateSlug: templateSlugOrData } : templateSlugOrData),

  // CRM Triggers
  getTriggers: (params?: { status?: string; type?: string; userId?: string; page?: number; limit?: number }) =>
    api.get('/admin/crm/triggers', { params }),

  actionTrigger: (id: string, status: string) =>
    api.patch(`/admin/crm/triggers/${id}`, { status }),

  // Email Templates
  listTemplates: (params?: { category?: string; is_system?: string; search?: string; page?: number; limit?: number }) =>
    api.get('/admin/email/templates', { params }),

  getTemplate: (id: string) =>
    api.get(`/admin/email/templates/${id}`),

  createTemplate: (data: Record<string, unknown>) =>
    api.post('/admin/email/templates', data),

  updateTemplate: (id: string, data: Record<string, unknown>) =>
    api.put(`/admin/email/templates/${id}`, data),

  deleteTemplate: (id: string) =>
    api.delete(`/admin/email/templates/${id}`),

  previewTemplate: (id: string, variables?: Record<string, string>) =>
    api.post(`/admin/email/templates/${id}/preview`, { variables }),

  testSendTemplate: (id: string, variables?: Record<string, string>) =>
    api.post(`/admin/email/templates/${id}/test`, { variables }),

  duplicateTemplate: (id: string, slugOrData: string | { slug: string; name: string }, name?: string) =>
    api.post(`/admin/email/templates/${id}/duplicate`, typeof slugOrData === 'string' ? { slug: slugOrData, name: name! } : slugOrData),

  // Email Campaigns
  listCampaigns: (params?: { status?: string; search?: string; page?: number; limit?: number }) =>
    api.get('/admin/email/campaigns', { params }),

  getCampaign: (id: string) =>
    api.get(`/admin/email/campaigns/${id}`),

  createCampaign: (data: Record<string, unknown>) =>
    api.post('/admin/email/campaigns', data),

  updateCampaign: (id: string, data: Record<string, unknown>) =>
    api.put(`/admin/email/campaigns/${id}`, data),

  deleteCampaign: (id: string) =>
    api.delete(`/admin/email/campaigns/${id}`),

  launchCampaign: (id: string) =>
    api.post(`/admin/email/campaigns/${id}/launch`),

  scheduleCampaign: (id: string, scheduledAt: string) =>
    api.post(`/admin/email/campaigns/${id}/schedule`, { scheduled_at: scheduledAt }),

  pauseCampaign: (id: string) =>
    api.post(`/admin/email/campaigns/${id}/pause`),

  resumeCampaign: (id: string) =>
    api.post(`/admin/email/campaigns/${id}/resume`),

  cancelCampaign: (id: string) =>
    api.post(`/admin/email/campaigns/${id}/cancel`),

  getCampaignAudienceCount: (segment: CampaignSegment | Record<string, unknown>) =>
    api.post('/admin/email/campaigns/audience-count', { segment }),

  getCampaignSends: (id: string, params?: { status?: string; page?: number; limit?: number }) =>
    api.get(`/admin/email/campaigns/${id}/sends`, { params }),

  // Email Sends
  getSends: (params?: { status?: string; campaignId?: string; page?: number; limit?: number }) =>
    api.get('/admin/email/sends', { params }),

  // Email Analytics - Template Performance
  getTemplatePerformance: () =>
    api.get('/admin/email/analytics/templates'),

  // CMS - Posts
  listPosts: (params: { status?: string; category?: string; search?: string; page?: number; limit?: number } = {}) => {
    const searchParams = new URLSearchParams();
    if (params.status) searchParams.set('status', params.status);
    if (params.category) searchParams.set('category', params.category);
    if (params.search) searchParams.set('search', params.search);
    if (params.page) searchParams.set('page', String(params.page));
    if (params.limit) searchParams.set('limit', String(params.limit));
    return api.get<{ posts: BlogPostSummary[]; pagination: Pagination }>(`/admin/cms/posts?${searchParams.toString()}`);
  },

  getPost: (id: string) =>
    api.get<{ post: BlogPostDetail }>(`/admin/cms/posts/${id}`),

  createPost: (data: CreateBlogPostInput) =>
    api.post<{ post: BlogPostDetail }>('/admin/cms/posts', data),

  updatePost: (id: string, data: UpdateBlogPostInput & { revision_note?: string }) =>
    api.put<{ post: BlogPostDetail }>(`/admin/cms/posts/${id}`, data),

  deletePost: (id: string) =>
    api.delete<{ success: boolean }>(`/admin/cms/posts/${id}`),

  publishPost: (id: string) =>
    api.post<{ post: BlogPostDetail }>(`/admin/cms/posts/${id}/publish`),

  unpublishPost: (id: string) =>
    api.post<{ post: BlogPostDetail }>(`/admin/cms/posts/${id}/unpublish`),

  listRevisions: (postId: string) =>
    api.get<{ revisions: BlogRevision[] }>(`/admin/cms/posts/${postId}/revisions`),

  restoreRevision: (postId: string, revisionId: string) =>
    api.post<{ post: BlogPostDetail }>(`/admin/cms/posts/${postId}/revisions/${revisionId}/restore`),

  // CMS - Media
  listMedia: (params: { page?: number; limit?: number } = {}) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', String(params.page));
    if (params.limit) searchParams.set('limit', String(params.limit));
    return api.get<{ media: BlogMediaItem[]; pagination: Pagination }>(`/admin/cms/media?${searchParams.toString()}`);
  },

  uploadMedia: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<BlogMediaUploadResult>('/admin/cms/media', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  deleteMedia: (id: string) =>
    api.delete<{ success: boolean }>(`/admin/cms/media/${id}`),

  updateMediaAlt: (id: string, alt_text: string) =>
    api.patch<{ media: BlogMediaItem }>(`/admin/cms/media/${id}`, { alt_text }),

  // CMS - Stats
  getCmsStats: () =>
    api.get<CmsStatsResponse>('/admin/cms/stats'),

  // CMS - Advice Templates
  listAdvice: (params: { category?: string; search?: string; page?: number; limit?: number } = {}) => {
    const searchParams = new URLSearchParams();
    if (params.category) searchParams.set('category', params.category);
    if (params.search) searchParams.set('search', params.search);
    if (params.page) searchParams.set('page', String(params.page));
    if (params.limit) searchParams.set('limit', String(params.limit));
    return api.get<{ advice: AuditAdviceTemplate[]; pagination: Pagination }>(`/admin/cms/advice?${searchParams.toString()}`);
  },

  getAdvice: (ruleId: string) =>
    api.get<{ advice: AuditAdviceTemplate }>(`/admin/cms/advice/${encodeURIComponent(ruleId)}`),

  upsertAdvice: (ruleId: string, data: UpsertAdviceInput) =>
    api.put<{ advice: AuditAdviceTemplate }>(`/admin/cms/advice/${encodeURIComponent(ruleId)}`, data),

  deleteAdvice: (ruleId: string) =>
    api.delete<{ success: boolean }>(`/admin/cms/advice/${encodeURIComponent(ruleId)}`),

  // CMS - Announcements
  listAnnouncements: (params: { active?: boolean; page?: number; limit?: number } = {}) => {
    const searchParams = new URLSearchParams();
    if (params.active !== undefined) searchParams.set('active', String(params.active));
    if (params.page) searchParams.set('page', String(params.page));
    if (params.limit) searchParams.set('limit', String(params.limit));
    return api.get<{ announcements: AnnouncementItem[]; pagination: Pagination }>(`/admin/cms/announcements?${searchParams.toString()}`);
  },

  createAnnouncement: (data: CreateAnnouncementInput) =>
    api.post<{ announcement: AnnouncementItem }>('/admin/cms/announcements', data),

  updateAnnouncement: (id: string, data: UpdateAnnouncementInput) =>
    api.put<{ announcement: AnnouncementItem }>(`/admin/cms/announcements/${id}`, data),

  deleteAnnouncement: (id: string) =>
    api.delete<{ success: boolean }>(`/admin/cms/announcements/${id}`),

  // CMS - Success Stories
  listStories: (params: { page?: number; limit?: number } = {}) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', String(params.page));
    if (params.limit) searchParams.set('limit', String(params.limit));
    return api.get<{ stories: SuccessStoryItem[]; pagination: Pagination }>(`/admin/cms/stories?${searchParams.toString()}`);
  },

  createStory: (data: CreateSuccessStoryInput) =>
    api.post<{ story: SuccessStoryItem }>('/admin/cms/stories', data),

  updateStory: (id: string, data: UpdateSuccessStoryInput) =>
    api.put<{ story: SuccessStoryItem }>(`/admin/cms/stories/${id}`, data),

  deleteStory: (id: string) =>
    api.delete<{ success: boolean }>(`/admin/cms/stories/${id}`),

  // Marketing - Campaigns
  listMarketingCampaigns: () =>
    api.get<{ campaigns: MarketingCampaign[] }>('/admin/marketing/campaigns'),

  createMarketingCampaign: (data: CreateMarketingCampaignInput) =>
    api.post<{ campaign: MarketingCampaign }>('/admin/marketing/campaigns', data),

  updateMarketingCampaign: (id: string, data: Partial<CreateMarketingCampaignInput>) =>
    api.patch<{ campaign: MarketingCampaign }>(`/admin/marketing/campaigns/${id}`, data),

  deleteMarketingCampaign: (id: string) =>
    api.delete<{ success: boolean }>(`/admin/marketing/campaigns/${id}`),

  // Marketing - Content
  listMarketingContent: (params: { platform?: string; campaign_id?: string; status?: string; search?: string; week_number?: number; day_of_week?: number; page?: number; limit?: number } = {}) => {
    const searchParams = new URLSearchParams();
    if (params.platform) searchParams.set('platform', params.platform);
    if (params.campaign_id) searchParams.set('campaign_id', params.campaign_id);
    if (params.status) searchParams.set('status', params.status);
    if (params.search) searchParams.set('search', params.search);
    if (params.week_number) searchParams.set('week_number', String(params.week_number));
    if (params.day_of_week) searchParams.set('day_of_week', String(params.day_of_week));
    if (params.page) searchParams.set('page', String(params.page));
    if (params.limit) searchParams.set('limit', String(params.limit));
    return api.get<{ content: MarketingContent[]; pagination: Pagination }>(`/admin/marketing/content?${searchParams.toString()}`);
  },

  getMarketingContentStats: () =>
    api.get<{ stats: MarketingContentStats }>('/admin/marketing/content/stats'),

  getMarketingContent: (id: string) =>
    api.get<{ content: MarketingContent }>(`/admin/marketing/content/${id}`),

  createMarketingContent: (data: CreateMarketingContentInput) =>
    api.post<{ content: MarketingContent }>('/admin/marketing/content', data),

  updateMarketingContent: (id: string, data: Partial<CreateMarketingContentInput>) =>
    api.patch<{ content: MarketingContent }>(`/admin/marketing/content/${id}`, data),

  deleteMarketingContent: (id: string) =>
    api.delete<{ success: boolean }>(`/admin/marketing/content/${id}`),

  updateMarketingContentStatus: (id: string, status: string) =>
    api.patch<{ content: MarketingContent }>(`/admin/marketing/content/${id}/status`, { status }),
};

// Admin Bug Reports API
export const adminBugReportsApi = {
  list: (params?: { page?: number; limit?: number; status?: string; severity?: string; category?: string; search?: string }) =>
    api.get<{ items: BugReport[]; total: number; page: number; limit: number; pages: number }>('/admin/bug-reports', { params }),

  getStats: () =>
    api.get<BugReportStats>('/admin/bug-reports/stats'),

  getById: (id: string) =>
    api.get<{ report: BugReport & { comments: BugReportComment[] } }>(`/admin/bug-reports/${id}`),

  update: (id: string, data: { status?: string; priority?: string | null; adminNotes?: string; resolutionNotes?: string; assignedTo?: string | null }) =>
    api.patch<{ report: BugReport }>(`/admin/bug-reports/${id}`, data),

  addComment: (id: string, content: string) =>
    api.post<{ comment: BugReportComment }>(`/admin/bug-reports/${id}/comments`, { content }),

  delete: (id: string) =>
    api.delete<{ success: boolean }>(`/admin/bug-reports/${id}`),
};

// Admin Feature Requests API
export interface FeatureRequest {
  id: string;
  user_id: string;
  title: string;
  description: string;
  impact: string;
  category: string;
  page_url: string | null;
  status: string;
  priority: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  reporter_email?: string;
}

export interface FeatureRequestComment {
  id: string;
  feature_request_id: string;
  user_id: string;
  is_admin_comment: boolean;
  content: string;
  created_at: string;
  email?: string;
  first_name?: string;
  last_name?: string;
}

export interface FeatureRequestStats {
  total: number;
  submitted: number;
  under_review: number;
  planned: number;
  in_progress: number;
  completed: number;
  last_7_days: number;
  last_24_hours: number;
}

export const adminFeatureRequestsApi = {
  list: (params?: { page?: number; limit?: number; status?: string; impact?: string; category?: string; search?: string }) =>
    api.get<{ items: FeatureRequest[]; total: number; page: number; limit: number; pages: number }>('/admin/feature-requests', { params }),

  getStats: () =>
    api.get<FeatureRequestStats>('/admin/feature-requests/stats'),

  getById: (id: string) =>
    api.get<{ request: FeatureRequest & { comments: FeatureRequestComment[] } }>(`/admin/feature-requests/${id}`),

  update: (id: string, data: { status?: string; priority?: string | null; adminNotes?: string; resolutionNotes?: string; assignedTo?: string | null }) =>
    api.patch<{ request: FeatureRequest }>(`/admin/feature-requests/${id}`, data),

  addComment: (id: string, content: string) =>
    api.post<{ comment: FeatureRequestComment }>(`/admin/feature-requests/${id}/comments`, { content }),

  delete: (id: string) =>
    api.delete<{ success: boolean }>(`/admin/feature-requests/${id}`),
};

// Admin Schedules API
export const adminSchedulesApi = {
  list: (params?: { page?: number; limit?: number; status?: string; search?: string }) =>
    api.get('/admin/schedules', { params }),

  getStats: () =>
    api.get('/admin/schedules/stats'),

  get: (id: string) =>
    api.get(`/admin/schedules/${id}`),

  getById: (id: string) =>
    api.get(`/admin/schedules/${id}`),

  update: (id: string, data: { enabled?: boolean; paused_reason?: string | null; max_consecutive_failures?: number }) =>
    api.patch(`/admin/schedules/${id}`, data),

  delete: (id: string) =>
    api.delete(`/admin/schedules/${id}`),
};

// Admin SEO API
export const adminSeoApi = {
  list: () =>
    api.get('/admin/seo'),

  upsert: (data: {
    route_path: string;
    title?: string | null;
    description?: string | null;
    keywords?: string | null;
    og_title?: string | null;
    og_description?: string | null;
    og_image?: string | null;
    og_type?: string | null;
    twitter_card?: string | null;
    canonical_url?: string | null;
    featured_image?: string | null;
    structured_data?: Record<string, unknown> | null;
    noindex?: boolean;
  }) => api.put('/admin/seo', data),

  remove: (route_path: string) =>
    api.delete('/admin/seo', { data: { route_path } }),
};

// Admin Settings API
export const adminSettingsApi = {
  getAll: () =>
    api.get('/admin/settings'),

  update: (key: string, value: unknown) =>
    api.put('/admin/settings', { key, value }),
};

// Admin Coming Soon API
export const adminComingSoonApi = {
  getSignups: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get('/admin/coming-soon/signups', { params }),

  listSignups: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get('/admin/coming-soon/signups', { params }),

  deleteSignup: (id: string) =>
    api.delete(`/admin/coming-soon/signups/${id}`),

  exportSignups: () =>
    api.get('/admin/coming-soon/signups/export', { responseType: 'blob' }),

  getStats: () =>
    api.get('/admin/coming-soon/stats'),
};

// Admin Early Access API
export const adminEarlyAccessApi = {
  getStats: () =>
    api.get('/admin/early-access/stats'),

  getUsers: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get('/admin/early-access/users', { params }),

  activate: () =>
    api.post('/admin/early-access/activate', { confirm: true }),

  exportUsers: () =>
    api.get('/admin/early-access/users/export', { responseType: 'blob' }),
};

// Admin CRM API
export const adminCrmApi = {
  getLeads: (params?: { status?: string; search?: string; sort?: string; order?: string; page?: number; limit?: number }) =>
    api.get('/admin/crm/leads', { params }),

  getLead: (userId: string) =>
    api.get(`/admin/crm/leads/${userId}`),

  recalculateScore: (userId: string) =>
    api.post(`/admin/crm/leads/${userId}/recalc`),

  getStats: () =>
    api.get('/admin/crm/stats'),

  getMemberships: (userId: string) =>
    api.get(`/admin/crm/leads/${userId}/memberships`),

  getTriggers: (params?: { status?: string; type?: string; userId?: string; page?: number; limit?: number }) =>
    api.get('/admin/crm/triggers', { params }),

  actionTrigger: (triggerId: string, status: 'sent' | 'dismissed' | 'actioned') =>
    api.patch(`/admin/crm/triggers/${triggerId}`, { status }),

  getTriggerStats: () =>
    api.get('/admin/crm/triggers/stats'),

  sendOutreach: (userId: string, data: { templateSlug: string; variables?: Record<string, string> }) =>
    api.post(`/admin/crm/outreach/${userId}`, data),

  getOutreach: (params?: { userId?: string; page?: number; limit?: number }) =>
    api.get('/admin/crm/outreach', { params }),
};

// Admin Email API
export const adminEmailApi = {
  // Templates
  listTemplates: (params?: { category?: string; is_system?: string; search?: string; page?: number; limit?: number }) =>
    api.get('/admin/email/templates', { params }),

  getTemplate: (id: string) =>
    api.get(`/admin/email/templates/${id}`),

  createTemplate: (data: Record<string, unknown>) =>
    api.post('/admin/email/templates', data),

  updateTemplate: (id: string, data: Record<string, unknown>) =>
    api.put(`/admin/email/templates/${id}`, data),

  deleteTemplate: (id: string) =>
    api.delete(`/admin/email/templates/${id}`),

  previewTemplate: (id: string, variables?: Record<string, string>) =>
    api.post(`/admin/email/templates/${id}/preview`, { variables }),

  testSendTemplate: (id: string, variables?: Record<string, string>) =>
    api.post(`/admin/email/templates/${id}/test`, { variables }),

  duplicateTemplate: (id: string, data: { slug: string; name: string }) =>
    api.post(`/admin/email/templates/${id}/duplicate`, data),

  // Campaigns
  listCampaigns: (params?: { status?: string; search?: string; page?: number; limit?: number }) =>
    api.get('/admin/email/campaigns', { params }),

  getCampaign: (id: string) =>
    api.get(`/admin/email/campaigns/${id}`),

  createCampaign: (data: Record<string, unknown>) =>
    api.post('/admin/email/campaigns', data),

  updateCampaign: (id: string, data: Record<string, unknown>) =>
    api.put(`/admin/email/campaigns/${id}`, data),

  deleteCampaign: (id: string) =>
    api.delete(`/admin/email/campaigns/${id}`),

  launchCampaign: (id: string) =>
    api.post(`/admin/email/campaigns/${id}/launch`),

  scheduleCampaign: (id: string, scheduledAt: string) =>
    api.post(`/admin/email/campaigns/${id}/schedule`, { scheduled_at: scheduledAt }),

  pauseCampaign: (id: string) =>
    api.post(`/admin/email/campaigns/${id}/pause`),

  resumeCampaign: (id: string) =>
    api.post(`/admin/email/campaigns/${id}/resume`),

  cancelCampaign: (id: string) =>
    api.post(`/admin/email/campaigns/${id}/cancel`),

  getAudienceCount: (segment: Record<string, unknown>) =>
    api.post('/admin/email/campaigns/audience-count', { segment }),

  getCampaignSends: (id: string, params?: { status?: string; page?: number; limit?: number }) =>
    api.get(`/admin/email/campaigns/${id}/sends`, { params }),

  // Sends
  getSends: (params?: { status?: string; campaignId?: string; page?: number; limit?: number }) =>
    api.get('/admin/email/sends', { params }),

  // Analytics
  getAnalytics: (days: number = 30) =>
    api.get(`/admin/email/analytics?days=${days}`),

  getTemplatePerformance: () =>
    api.get('/admin/email/analytics/templates'),
};

// =============================================
// Blog CMS Types
// =============================================

export type BlogPostCategory =
  | 'seo' | 'accessibility' | 'security' | 'performance'
  | 'content-quality' | 'structured-data' | 'eeat' | 'aeo'
  | 'guides' | 'case-studies' | 'product-updates';

export type BlogPostStatus = 'draft' | 'published' | 'archived';

export type BlogBlockType =
  | 'text' | 'heading' | 'image' | 'two_column' | 'callout'
  | 'code' | 'quote' | 'divider' | 'embed' | 'cta'
  | 'stat_highlight' | 'audit_link';

export interface BlogContentBlock {
  id: string;
  type: BlogBlockType;
  props: Record<string, unknown>;
}

export interface BlogPostSummary {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  excerpt: string;
  featured_image_url: string | null;
  category: BlogPostCategory;
  tags: string[];
  author_name: string;
  status: BlogPostStatus;
  published_at: string | null;
  reading_time_minutes: number;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface BlogPostDetail extends BlogPostSummary {
  featured_image_alt: string | null;
  content: BlogContentBlock[];
  author_id: string;
  seo_title: string | null;
  seo_description: string | null;
  related_post_ids: string[];
}

export interface CreateBlogPostInput {
  title: string;
  subtitle?: string | null;
  excerpt: string;
  featured_image_url?: string | null;
  featured_image_alt?: string | null;
  content: BlogContentBlock[];
  category: BlogPostCategory;
  tags?: string[];
  seo_title?: string | null;
  seo_description?: string | null;
}

export type UpdateBlogPostInput = Partial<CreateBlogPostInput> & {
  related_post_ids?: string[];
};

export interface BlogRevision {
  id: string;
  post_id: string;
  content: BlogContentBlock[];
  title: string;
  revision_note: string | null;
  created_by: string;
  created_at: string;
  editor_email?: string;
}

export interface BlogMediaItem {
  id: string;
  filename: string;
  storage_key: string;
  mime_type: string;
  file_size_bytes: number;
  width: number | null;
  height: number | null;
  alt_text: string | null;
  thumbnail_key: string | null;
  webp_key: string | null;
  uploaded_by: string;
  created_at: string;
  url: string;
  thumbnailUrl: string;
}

export interface BlogMediaUploadResult {
  id: string;
  url: string;
  thumbnailUrl: string;
  webpUrl: string;
  width: number;
  height: number;
  fileSizeBytes: number;
}

export interface CmsStatsResponse {
  totalPosts: number;
  published: number;
  drafts: number;
  archived: number;
  totalViews: number;
  totalMedia: number;
  topPosts: Array<{
    id: string;
    title: string;
    slug: string;
    view_count: number;
    published_at: string;
  }>;
}

export interface AuditAdviceTemplate {
  id: string;
  rule_id: string;
  rule_name: string;
  category: string;
  severity: string;
  description: string;
  recommendation: string;
  learn_more_url: string | null;
  is_custom: boolean;
  updated_at: string;
  updated_by: string | null;
}

export interface UpsertAdviceInput {
  rule_name: string;
  category: string;
  severity: string;
  description: string;
  recommendation: string;
  learn_more_url?: string | null;
}

export type AnnouncementType = 'info' | 'success' | 'warning' | 'maintenance';

export interface AnnouncementItem {
  id: string;
  title: string;
  body: string;
  type: AnnouncementType;
  target_tiers: string[] | null;
  cta_label: string | null;
  cta_url: string | null;
  starts_at: string;
  ends_at: string | null;
  is_dismissible: boolean;
  is_active: boolean;
  created_by: string;
  created_at: string;
}

export interface CreateAnnouncementInput {
  title: string;
  body: string;
  type?: AnnouncementType;
  target_tiers?: string[] | null;
  cta_label?: string | null;
  cta_url?: string | null;
  starts_at?: string;
  ends_at?: string | null;
  is_dismissible?: boolean;
}

export interface UpdateAnnouncementInput {
  title?: string;
  body?: string;
  type?: AnnouncementType;
  target_tiers?: string[] | null;
  cta_label?: string | null;
  cta_url?: string | null;
  starts_at?: string;
  ends_at?: string | null;
  is_dismissible?: boolean;
  is_active?: boolean;
}

export interface SuccessStoryItem {
  id: string;
  site_id: string | null;
  domain: string;
  category: string;
  score_before: number;
  score_after: number;
  headline: string;
  is_published: boolean;
  display_order: number;
  published_at: string | null;
  created_by: string;
  created_at: string;
}

export interface CreateSuccessStoryInput {
  site_id?: string | null;
  domain: string;
  category: string;
  score_before: number;
  score_after: number;
  headline: string;
  is_published?: boolean;
  display_order?: number;
}

export interface UpdateSuccessStoryInput {
  domain?: string;
  category?: string;
  score_before?: number;
  score_after?: number;
  headline?: string;
  is_published?: boolean;
  display_order?: number;
}

// Public blog API
export const blogApi = {
  listPosts: (params: { category?: string; tag?: string; page?: number; limit?: number } = {}) => {
    const searchParams = new URLSearchParams();
    if (params.category) searchParams.set('category', params.category);
    if (params.tag) searchParams.set('tag', params.tag);
    if (params.page) searchParams.set('page', String(params.page));
    if (params.limit) searchParams.set('limit', String(params.limit));
    return api.get<{ posts: BlogPostSummary[]; total: number; page: number; totalPages: number }>(`/blog/posts?${searchParams.toString()}`);
  },

  getPost: (slug: string) =>
    api.get<{ post: BlogPostDetail }>(`/blog/posts/${slug}`),

  getCategories: () =>
    api.get<{ categories: Array<{ category: string; count: number }> }>('/blog/categories'),

  getRelatedPosts: (slug: string) =>
    api.get<{ posts: BlogPostSummary[] }>(`/blog/posts/${slug}/related`),
};

// =============================================
// Cold Prospects API
// =============================================

export interface ColdProspectItem {
  id: string;
  domain: string;
  tld: string;
  registered_at: string | null;
  status: string;
  is_live: boolean;
  http_status: number | null;
  has_ssl: boolean;
  title: string | null;
  meta_description: string | null;
  technology_stack: string[];
  page_count_estimate: number | null;
  contact_email: string | null;
  contact_name: string | null;
  contact_role: string | null;
  emails: { email: string; name: string | null; role: string | null; source: string; confidence: string }[];
  contact_page_url: string | null;
  has_contact_form: boolean;
  social_links: Record<string, string>;
  quality_score: number;
  business_type: string | null;
  country: string | null;
  language: string | null;
  campaign_id: string | null;
  email_sent_at: string | null;
  email_opened_at: string | null;
  email_clicked_at: string | null;
  converted_user_id: string | null;
  batch_date: string;
  source: string;
  is_excluded: boolean;
  exclusion_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface ColdProspectStats {
  total: number;
  byStatus: Record<string, number>;
  todayImported: number;
  todayQualified: number;
  todayContacted: number;
  withEmail: number;
  withName: number;
  conversionRate: number;
  avgQualityScore: number;
}

export interface ColdProspectSettings {
  targetTlds: string[];
  excludedKeywords: string[];
  minQualityScore: number;
  dailyCheckLimit: number;
  dailyEmailLimit: number;
  autoOutreachEnabled: boolean;
  lastFeedDate: string | null;
}

export interface ColdProspectDailyStats {
  date: string;
  imported: number;
  qualified: number;
  contacted: number;
}

export interface OutreachStats {
  totalSends: number;
  sent: number;
  queued: number;
  failed: number;
  opened: number;
  clicked: number;
  unsubscribed: number;
  sentToday: number;
  openRate: number;
  clickRate: number;
}

export interface OutreachSend {
  id: string;
  prospect_id: string;
  template_slug: string;
  to_email: string;
  subject: string;
  status: string;
  error_message: string | null;
  sent_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  created_at: string;
  domain: string;
  contact_name: string | null;
}

export const coldProspectsApi = {
  list: (params: {
    status?: string;
    tld?: string;
    minScore?: number;
    maxScore?: number;
    batchDate?: string;
    hasEmail?: boolean;
    hasName?: boolean;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  } = {}) => {
    const searchParams = new URLSearchParams();
    if (params.status) searchParams.set('status', params.status);
    if (params.tld) searchParams.set('tld', params.tld);
    if (params.minScore !== undefined) searchParams.set('minScore', String(params.minScore));
    if (params.maxScore !== undefined) searchParams.set('maxScore', String(params.maxScore));
    if (params.batchDate) searchParams.set('batchDate', params.batchDate);
    if (params.hasEmail) searchParams.set('hasEmail', 'true');
    if (params.hasName) searchParams.set('hasName', 'true');
    if (params.search) searchParams.set('search', params.search);
    if (params.page) searchParams.set('page', String(params.page));
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);
    return api.get<{ prospects: ColdProspectItem[]; pagination: { page: number; limit: number; total: number; pages: number } }>(
      `/admin/cold-prospects?${searchParams.toString()}`
    );
  },

  get: (id: string) =>
    api.get<{ prospect: ColdProspectItem }>(`/admin/cold-prospects/${id}`),

  getStats: () =>
    api.get<{ stats: ColdProspectStats }>('/admin/cold-prospects/stats'),

  getDailyStats: (days: number = 30) =>
    api.get<{ stats: ColdProspectDailyStats[] }>(`/admin/cold-prospects/daily-stats?days=${days}`),

  getTlds: () =>
    api.get<{ tlds: string[] }>('/admin/cold-prospects/tlds'),

  getSettings: () =>
    api.get<{ settings: ColdProspectSettings }>('/admin/cold-prospects/settings'),

  updateSettings: (settings: Partial<ColdProspectSettings>) =>
    api.put<{ settings: ColdProspectSettings }>('/admin/cold-prospects/settings', settings),

  exclude: (id: string, reason?: string) =>
    api.delete(`/admin/cold-prospects/${id}${reason ? `?reason=${encodeURIComponent(reason)}` : ''}`),

  retry: (id: string) =>
    api.post(`/admin/cold-prospects/${id}/retry`),

  bulkExclude: (ids: string[], reason: string) =>
    api.post<{ excluded: number }>('/admin/cold-prospects/bulk-exclude', { ids, reason }),

  import: (csv: string) =>
    api.post<{ imported: number; duplicates: number; errors: number }>('/admin/cold-prospects/import', { csv }),

  importJson: (prospects: unknown[]) =>
    api.post<{ imported: number; duplicates: number; errors: number }>('/admin/cold-prospects/import-json', { prospects }),

  getOutreachStats: () =>
    api.get<{ stats: OutreachStats }>('/admin/cold-prospects/outreach-stats'),

  getSends: (page?: number, limit?: number) =>
    api.get<{ sends: OutreachSend[]; pagination: { page: number; limit: number; total: number; pages: number } }>(
      `/admin/cold-prospects/sends?page=${page || 1}&limit=${limit || 25}`
    ),

  triggerOutreach: (limit?: number) =>
    api.post<{ queued: number; sent: number; failed: number }>('/admin/cold-prospects/trigger-outreach', { limit }),

  pauseOutreach: () =>
    api.post<{ enabled: boolean }>('/admin/cold-prospects/pause-outreach'),
};

// =============================================
// API Keys
// =============================================

export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  rateLimitTier: string;
  lastUsedAt: string | null;
  lastUsedIp: string | null;
  requestCount: number;
  isActive: boolean;
  expiresAt: string | null;
  revokedAt: string | null;
  revokedReason: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface ApiKeyStats {
  totalRequests: number;
  requestsToday: number;
  requestsThisWeek: number;
  avgResponseTime: number;
  topEndpoints: { path: string; count: number }[];
}

export interface CreateApiKeyResponse {
  message: string;
  key: ApiKey;
  secretKey: string;
  warning: string;
}

export const apiKeysApi = {
  list: () =>
    api.get<{ keys: ApiKey[] }>('/api-keys'),

  create: (data: { name: string; scopes?: string[]; expiresInDays?: number }) =>
    api.post<CreateApiKeyResponse>('/api-keys', data),

  get: (keyId: string) =>
    api.get<{ key: ApiKey }>(`/api-keys/${keyId}`),

  getStats: (keyId: string) =>
    api.get<{ stats: ApiKeyStats }>(`/api-keys/${keyId}/stats`),

  update: (keyId: string, data: { name?: string; scopes?: string[] }) =>
    api.patch<{ message: string; key: ApiKey }>(`/api-keys/${keyId}`, data),

  revoke: (keyId: string, reason?: string) =>
    api.post<{ message: string }>(`/api-keys/${keyId}/revoke`, { reason }),

  delete: (keyId: string) =>
    api.delete<{ message: string }>(`/api-keys/${keyId}`),

  getScopes: () =>
    api.get<{ scopes: Array<{ id: string; name: string; description: string }> }>('/api-keys/scopes/available'),

  getTiers: () =>
    api.get<{ tiers: Array<{ name: string; requestsPerMinute: number; requestsPerDay: number | string; concurrentAudits: number }> }>('/api-keys/tiers/info'),
};

// =============================================
// Bug Reports (user-facing)
// =============================================

export interface CreateBugReportInput {
  title: string;
  description: string;
  severity: 'critical' | 'major' | 'minor' | 'trivial';
  category: 'ui' | 'functionality' | 'performance' | 'data' | 'security' | 'other';
  pageUrl?: string;
  browserInfo?: {
    name: string;
    version: string;
    os: string;
  };
  screenSize?: string;
  screenshotUrl?: string;
  screenshotKey?: string;
}

export const bugReportsApi = {
  create: (data: CreateBugReportInput) =>
    api.post<{ report: BugReport }>('/bug-reports', data),

  listMine: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get<{ items: BugReport[]; total: number; page: number; limit: number }>('/bug-reports/mine', { params }),

  getById: (id: string) =>
    api.get<{ report: BugReport }>(`/bug-reports/${id}`),

  getComments: (id: string) =>
    api.get<{ comments: BugReportComment[] }>(`/bug-reports/${id}/comments`),

  addComment: (id: string, content: string) =>
    api.post<{ comment: BugReportComment }>(`/bug-reports/${id}/comments`, { content }),
};

// =============================================
// Feature Requests (user-facing)
// =============================================

export interface CreateFeatureRequestInput {
  title: string;
  description: string;
  impact: 'nice_to_have' | 'would_be_helpful' | 'important' | 'critical_for_workflow';
  category: 'accessibility' | 'reporting' | 'ui_ux' | 'integrations' | 'performance' | 'other';
  pageUrl?: string;
  browserInfo?: {
    name: string;
    version: string;
    os: string;
  };
  screenSize?: string;
}

export const featureRequestsApi = {
  create: (data: CreateFeatureRequestInput) =>
    api.post<{ request: FeatureRequest }>('/feature-requests', data),

  listMine: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get<{ items: FeatureRequest[]; total: number; page: number; limit: number }>('/feature-requests/mine', { params }),

  getById: (id: string) =>
    api.get<{ request: FeatureRequest }>(`/feature-requests/${id}`),

  getComments: (id: string) =>
    api.get<{ comments: FeatureRequestComment[] }>(`/feature-requests/${id}/comments`),

  addComment: (id: string, content: string) =>
    api.post<{ comment: FeatureRequestComment }>(`/feature-requests/${id}/comments`, { content }),
};

// =============================================
// Referrals
// =============================================

export const referralsApi = {
  getCode: () =>
    api.get<{ code: string; link: string }>('/referrals/code'),

  getStats: () =>
    api.get<{ stats: {
      totalReferred: number;
      pendingCount: number;
      qualifiedCount: number;
      rewardedCount: number;
      voidedCount: number;
      totalBonusAuditsEarned: number;
      bonusAuditsRemaining: number;
      referralCode: string;
      referralLink: string;
    } }>('/referrals/stats'),

  list: (page: number = 1, limit: number = 20) =>
    api.get<{ referrals: Array<{
      id: string;
      referred_email: string;
      referred_name: string;
      status: string;
      referrer_reward_value: number | null;
      created_at: string;
      qualified_at: string | null;
      rewarded_at: string | null;
    }>; pagination: { page: number; limit: number; total: number; pages: number } }>(
      `/referrals/list?page=${page}&limit=${limit}`
    ),

  invite: (emails: string[]) =>
    api.post<{ sent: number; errors: string[] }>('/referrals/invite', { emails }),
};

export const adminReferralsApi = {
  getStats: () =>
    api.get<{ stats: {
      totalReferrals: number;
      pendingCount: number;
      qualifiedCount: number;
      rewardedCount: number;
      voidedCount: number;
      conversionRate: number;
      totalBonusAuditsAwarded: number;
      topReferrers: Array<{ user_id: string; email: string; name: string; referral_count: number }>;
    } }>('/admin/referrals/stats'),

  list: (params: { page?: number; limit?: number; status?: string; search?: string } = {}) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', String(params.page));
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.status) searchParams.set('status', params.status);
    if (params.search) searchParams.set('search', params.search);
    return api.get<{ referrals: Array<{
      id: string;
      referrer_email: string;
      referrer_name: string;
      referred_email: string;
      referred_name: string;
      status: string;
      referrer_reward_value: number | null;
      referred_reward_value: number | null;
      void_reason: string | null;
      created_at: string;
      qualified_at: string | null;
      rewarded_at: string | null;
      voided_at: string | null;
    }>; pagination: { page: number; limit: number; total: number; pages: number } }>(
      `/admin/referrals?${searchParams.toString()}`
    );
  },

  void: (id: string, reason: string) =>
    api.post(`/admin/referrals/${id}/void`, { reason }),

  getConfig: () =>
    api.get<{ config: { enabled: boolean; maxReferralsPerMonth: number; rewards: Record<string, unknown> } }>('/admin/referrals/config'),

  updateConfig: (key: string, value: unknown) =>
    api.patch('/admin/referrals/config', { key, value }),
};

// Email Preferences API (user-facing)
export const emailPreferencesApi = {
  get: () =>
    api.get('/email/my-preferences'),

  update: (prefs: { audit_notifications?: boolean; product_updates?: boolean; educational?: boolean; marketing?: boolean; unsubscribed_all?: boolean }) =>
    api.put('/email/my-preferences', prefs),

  unsubscribeWithToken: (token: string) =>
    api.post('/email/unsubscribe', { token }),
};
