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
