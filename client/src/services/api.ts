import axios, { type AxiosInstance, type AxiosError } from 'axios';
import type { ErrorResponse } from '../types/auth.types';
import type { Audit, Finding, AuditPage, StartAuditInput, Pagination, FindingsSummary, PagesSummary, PageDetailResponse } from '../types/audit.types';
import type {
  Site,
  SiteWithStats,
  SiteUrl,
  SiteShare,
  SiteInvitation,
  SitePermission,
  CreateSiteInput,
  UpdateSiteInput,
  SiteUsage,
  ScoreHistoryEntry,
  Subscription,
  TierLimits,
  UsageStats,
  VerificationInstructions,
  MemberLimit,
} from '../types/site.types';
import type {
  MarketingCampaign,
  MarketingContent,
  MarketingContentStats,
  CreateMarketingContentInput,
  CreateMarketingCampaignInput,
} from '../types/admin.types';

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

      // For other auth errors (AUTH_REQUIRED, TOKEN_INVALID, etc.), redirect to login
      // But don't redirect if we're on auth pages or public pages
      const publicPaths = ['/', '/login', '/register', '/about', '/services', '/pricing', '/contact', '/blog', '/privacy', '/terms', '/docs'];
      const currentPath = window.location.pathname;
      const isPublicPage = publicPaths.includes(currentPath) ||
                           currentPath.startsWith('/login') ||
                           currentPath.startsWith('/register') ||
                           currentPath.startsWith('/blog/') ||
                           currentPath.startsWith('/services/') ||
                           currentPath.startsWith('/docs/') ||
                           currentPath.startsWith('/email/unsubscribe') ||
                           currentPath.startsWith('/site-invitations/') ||
                           currentPath.startsWith('/auth/callback/') ||
                           currentPath.startsWith('/auth/oauth/');
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
    referralCode?: string;
    earlyAccess?: boolean;
    marketingOptIn?: boolean;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
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

  // OAuth
  getOAuthUrl: (provider: string, mode?: 'login' | 'link') =>
    api.get(`/auth/oauth/${provider}/url${mode ? `?mode=${mode}` : ''}`),

  oauthCallback: (provider: string, code: string, state: string) =>
    api.post(`/auth/oauth/${provider}/callback`, { code, state }),

  getLinkedProviders: () => api.get('/auth/oauth/providers'),

  linkProvider: (provider: string, code: string, state: string) =>
    api.post(`/auth/oauth/${provider}/link`, { code, state }),

  unlinkProvider: (provider: string) =>
    api.delete(`/auth/oauth/${provider}`),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),
};

// Audits API functions
export const auditsApi = {
  // Start a new audit
  start: (data: StartAuditInput & { consent?: { accepted: boolean; dontShowAgain?: boolean } }) =>
    api.post<{ audit: Audit }>('/audits', {
      targetUrl: data.targetUrl,
      siteId: data.siteId,
      options: data.options,
      consent: data.consent,
    }),

  // Check domain verification status before audit
  getDomainStatus: (url: string) =>
    api.get<{
      domain: string;
      siteId: string | null;
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

  // List all audits for current user
  list: (params?: { status?: string; limit?: number; offset?: number; siteId?: string }) =>
    api.get<{ audits: Audit[]; pagination: Pagination }>('/audits', { params }),

  // Get a single audit by ID
  get: (id: string) =>
    api.get<{ audit: Audit }>(`/audits/${id}`),

  // Get findings for an audit
  getFindings: (
    id: string,
    params?: {
      category?: string;
      severity?: string;
      page?: number;
      limit?: number;
    }
  ) =>
    api.get<{ findings: Finding[]; summary: FindingsSummary; pagination: Pagination }>(
      `/audits/${id}/findings`,
      { params }
    ),

  // Get broken links for an audit
  getBrokenLinks: (id: string) =>
    api.get<{ brokenLinks: Finding[]; unverifiableLinks?: Finding[]; total: number }>(`/audits/${id}/broken-links`),

  // Get Content Quality Score breakdown
  getContentQuality: (id: string) =>
    api.get<{
      cqsScore: number | null;
      breakdown?: {
        quality: number | null;
        eeat: number | null;
        readability: number | null;
        engagement: number | null;
        structure: number | null;
      };
      pages?: Array<{
        url: string;
        cqs: number | null;
        depth: number;
        quality: number | null;
        eeat: number | null;
        readability: number | null;
        engagement: number | null;
        structure: number | null;
      }>;
      summary?: string;
    }>(`/audits/${id}/content-quality`),

  // Get pages for an audit
  getPages: (
    id: string,
    params?: {
      status?: string;
      page?: number;
      limit?: number;
    }
  ) =>
    api.get<{ pages: AuditPage[]; summary: PagesSummary; pagination: Pagination }>(
      `/audits/${id}/pages`,
      { params }
    ),

  // Get a single page with full details and findings
  getPage: (auditId: string, pageId: string) =>
    api.get<PageDetailResponse>(`/audits/${auditId}/pages/${pageId}`),

  // Re-run an audit with same config (#41)
  rerun: (id: string) =>
    api.post<{ audit: Audit }>(`/audits/${id}/rerun`),

  // Check URL reachability (#44)
  checkUrl: (url: string) =>
    api.get<{ reachable: boolean; status?: number; error?: string; finalUrl?: string }>('/audits/check-url', { params: { url } }),

  // Get recent URLs for autocomplete (#45)
  getRecentUrls: () =>
    api.get<{ urls: Array<{ target_url: string; target_domain: string }> }>('/audits/recent-urls'),

  // Cancel a running audit
  cancel: (id: string) =>
    api.post<{ audit: Audit }>(`/audits/${id}/cancel`),

  // Delete an audit
  delete: (id: string) =>
    api.delete(`/audits/${id}`),

  // Dismiss/reactivate a finding
  dismissFinding: (auditId: string, findingId: string, status: 'dismissed' | 'active') =>
    api.patch(`/audits/${auditId}/findings/${findingId}/dismiss`, { status }),

  // Bulk dismiss by rule
  bulkDismiss: (auditId: string, ruleId: string, message: string, status: 'dismissed' | 'active') =>
    api.patch(`/audits/${auditId}/findings/bulk-dismiss`, { ruleId, message, status }),

  // Export CSV
  exportCsv: (id: string) =>
    api.get(`/audits/${id}/export/csv`, { responseType: 'blob' }),

  // Export JSON
  exportJson: (id: string) =>
    api.get(`/audits/${id}/export/json`, { responseType: 'blob' }),

  // Export Markdown
  exportMarkdown: (id: string) =>
    api.get(`/audits/${id}/export/markdown`, { responseType: 'blob' }),

  // Export HTML
  exportHtml: (id: string) =>
    api.get(`/audits/${id}/export/html`, { responseType: 'blob' }),

  // Export PDF (#47)
  exportPdf: (id: string) =>
    api.get(`/audits/${id}/export/pdf`, { responseType: 'blob' }),

  // Score history
  getScoreHistory: (id: string) =>
    api.get<{ history: Array<{ id: string; created_at: string; seo_score: number | null; accessibility_score: number | null; security_score: number | null; performance_score: number | null }> }>(`/audits/${id}/score-history`),

  // Index exposure (Google dorking) findings
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

  // Schema summary (structured data across all pages)
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
        jsonLdCount: number;
        hasOg: boolean;
        hasTc: boolean;
        detectedTypes: string[];
        detectedPageType: string | null;
      }>;
    }>(`/audits/${id}/schema-summary`),

  // Generate JSON-LD for a page (Starter+ tier)
  generateSchema: (auditId: string, pageId: string) =>
    api.post<{ jsonLd: string; pageType: string }>(`/audits/${auditId}/pages/${pageId}/generate-schema`),

  // Generate JSON-LD for all pages in an audit (Starter+ tier)
  generateSchemaAll: (auditId: string) =>
    api.post<{
      pages: Array<{ pageId: string; url: string; title: string | null; pageType: string; jsonLd: string }>;
      combined: string;
    }>(`/audits/${auditId}/generate-schema-all`),

  // File extraction / assets
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

  // Share an audit report (generate public link)
  share: (id: string) =>
    api.post<{ shareUrl: string; token: string; expiresAt: string }>(`/audits/${id}/share`),

  // Revoke a shared audit report link
  revokeShare: (id: string) =>
    api.delete(`/audits/${id}/share`),

  // Accessibility statement data (Pro+ tier)
  getStatementData: (id: string) =>
    api.get<{
      domain: string;
      auditDate: string;
      overallScore: number;
      conformanceLevel: 'Full' | 'Partial' | 'Non-conformant';
      standard: string;
      issuesByCategory: Record<string, Array<{ ruleName: string; count: number; description: string }>>;
      totalIssues: number;
      pagesAudited: number;
      categoriesChecked: string[];
    }>(`/audits/${id}/statement-data`),

  // EAA Compliance Passport report
  getCompliance: (id: string) =>
    api.get<{
      status: 'compliant' | 'partially_compliant' | 'non_compliant' | 'not_assessed';
      wcagLevel?: string;
      aaStatus?: 'compliant' | 'partially_compliant' | 'non_compliant' | 'not_assessed';
      aaaStatus?: 'compliant' | 'partially_compliant' | 'non_compliant' | 'not_assessed';
      standard: string;
      summary: {
        totalClauses: number;
        passing: number;
        failing: number;
        manualReview: number;
        notTested: number;
      };
      clauses: Array<{
        clause: string;
        title: string;
        wcagCriteria: string;
        status: 'pass' | 'fail' | 'manual_review' | 'not_tested';
        issueCount: number;
        findings: Array<{
          ruleId: string;
          severity: string;
          count: number;
        }>;
      }>;
      auditDate: string;
      domain: string;
      pagesAudited: number;
      tierLocked?: boolean;
      requiredTier?: string;
    }>(`/audits/${id}/compliance`),

  // Create SSE connection for real-time progress
  createProgressStream: (id: string): EventSource => {
    const url = `/api/audits/${id}/stream`;
    return new EventSource(url, { withCredentials: true });
  },
};

// Public (unauthenticated) shared report API
export const publicReportsApi = {
  get: (token: string) =>
    api.get<{
      audit: {
        targetUrl: string;
        targetDomain: string;
        status: string;
        createdAt: string;
        completedAt: string | null;
        pagesFound: number;
        pagesCrawled: number;
        pagesAudited: number;
        scores: {
          seo: number | null;
          accessibility: number | null;
          security: number | null;
          performance: number | null;
          content: number | null;
        };
        totalIssues: number;
        criticalIssues: number;
      };
      findingsSummary: Record<string, number>;
      categorySummary: Record<string, number>;
      expiresAt: string;
    }>(`/public/reports/${token}`),
};

// API Key types
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

// API Keys API functions
export const apiKeysApi = {
  // List all API keys
  list: () =>
    api.get<{ keys: ApiKey[] }>('/api-keys'),

  // Create a new API key
  create: (data: { name: string; scopes?: string[]; expiresInDays?: number }) =>
    api.post<CreateApiKeyResponse>('/api-keys', data),

  // Get a specific API key
  get: (keyId: string) =>
    api.get<{ key: ApiKey }>(`/api-keys/${keyId}`),

  // Get API key usage stats
  getStats: (keyId: string) =>
    api.get<{ stats: ApiKeyStats }>(`/api-keys/${keyId}/stats`),

  // Update an API key
  update: (keyId: string, data: { name?: string; scopes?: string[] }) =>
    api.patch<{ message: string; key: ApiKey }>(`/api-keys/${keyId}`, data),

  // Revoke an API key
  revoke: (keyId: string, reason?: string) =>
    api.post<{ message: string }>(`/api-keys/${keyId}/revoke`, { reason }),

  // Delete an API key
  delete: (keyId: string) =>
    api.delete<{ message: string }>(`/api-keys/${keyId}`),

  // Get available scopes
  getScopes: () =>
    api.get<{ scopes: Array<{ id: string; name: string; description: string }> }>('/api-keys/scopes/available'),

  // Get rate limit tiers info
  getTiers: () =>
    api.get<{ tiers: Array<{ name: string; requestsPerMinute: number; requestsPerDay: number | string; concurrentAudits: number }> }>('/api-keys/tiers/info'),
};

// Sites API (User-Centric - no org prefix)
export const sitesApi = {
  // List all sites (owned + shared)
  list: () =>
    api.get<{
      sites: SiteWithStats[];
      usage: SiteUsage & { canAddMore: boolean };
    }>('/sites'),

  // Create a site
  create: (data: CreateSiteInput) =>
    api.post<{ site: Site }>('/sites', data),

  // Get site detail
  get: (siteId: string) =>
    api.get<{
      site: SiteWithStats;
      permission: SitePermission;
      isOwner: boolean;
      ownerTier: string;
      scoreHistory: ScoreHistoryEntry[];
    }>(`/sites/${siteId}`),

  // Update a site
  update: (siteId: string, data: UpdateSiteInput) =>
    api.patch<{ site: Site }>(`/sites/${siteId}`, data),

  // Delete a site
  delete: (siteId: string) =>
    api.delete(`/sites/${siteId}`),

  // Get site audits
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
        wcagLevel?: string;
        checkAccessibility?: boolean;
      }>;
      pagination: { total: number; limit: number; offset: number };
    }>(`/sites/${siteId}/audits${query ? `?${query}` : ''}`);
  },

  // =============================================
  // Site URLs
  // =============================================

  // Get site URLs
  getUrls: (siteId: string, params?: {
    search?: string;
    limit?: number;
    offset?: number;
    sortBy?: 'url_path' | 'last_audited_at' | 'priority' | 'last_seo_score' | 'last_accessibility_score' | 'last_security_score' | 'last_performance_score' | 'last_content_score';
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

  // Get URL count
  getUrlsCount: (siteId: string) =>
    api.get<{ count: number }>(`/sites/${siteId}/urls-count`),

  // Add URL manually
  addUrl: (siteId: string, url: string) =>
    api.post<{ url: SiteUrl }>(`/sites/${siteId}/urls`, { url }),

  // Get single URL detail
  getUrl: (siteId: string, urlId: string) =>
    api.get<{ url: SiteUrl }>(`/sites/${siteId}/urls/${urlId}`),

  // Get audits for a specific URL
  getUrlAudits: (siteId: string, urlId: string, params?: { limit?: number; offset?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.offset) searchParams.set('offset', String(params.offset));
    const query = searchParams.toString();
    return api.get<{
      audits: Audit[];
      pagination: { total: number; limit: number; offset: number };
    }>(`/sites/${siteId}/urls/${urlId}/audits${query ? `?${query}` : ''}`);
  },

  // Discover pages from sitemap
  discoverPages: (siteId: string) =>
    api.post<{
      message: string;
      pagesDiscovered: number;
      errors?: string[];
    }>(`/sites/${siteId}/discover-pages`),

  // =============================================
  // Site Sharing
  // =============================================

  // Get site shares (includes member limit info)
  getShares: (siteId: string) =>
    api.get<{ shares: SiteShare[]; memberLimit: MemberLimit }>(`/sites/${siteId}/shares`),

  // Create share (direct user ID)
  createShare: (siteId: string, data: { userId: string; permission: SitePermission }) =>
    api.post<{ share: SiteShare }>(`/sites/${siteId}/shares`, data),

  // Share by email (handles both existing users and invitations)
  shareByEmail: (siteId: string, data: { email: string; permission: SitePermission }) =>
    api.post<{ type: 'share' | 'invitation'; message: string; share?: SiteShare; invitation?: SiteInvitation }>(
      `/sites/${siteId}/shares`,
      data
    ),

  // Update share permission
  updateShare: (siteId: string, shareId: string, data: { permission: SitePermission }) =>
    api.patch<{ share: SiteShare }>(`/sites/${siteId}/shares/${shareId}`, data),

  // Remove share
  removeShare: (siteId: string, shareId: string) =>
    api.delete(`/sites/${siteId}/shares/${shareId}`),

  // Get site invitations
  getInvitations: (siteId: string) =>
    api.get<{ invitations: SiteInvitation[] }>(`/sites/${siteId}/invitations`),

  // Create invitation (by email)
  invite: (siteId: string, data: { email: string; permission: SitePermission }) =>
    api.post<{ invitation: SiteInvitation }>(`/sites/${siteId}/invitations`, data),

  // Cancel invitation
  cancelInvitation: (siteId: string, invitationId: string) =>
    api.delete(`/sites/${siteId}/invitations/${invitationId}`),

  // Transfer ownership
  transferOwnership: (siteId: string, email: string) =>
    api.post<{ site: { id: string; name: string; domain: string; ownerId: string }; message: string }>(
      `/sites/${siteId}/transfer`,
      { email }
    ),

  // =============================================
  // Site Verification
  // =============================================

  // Generate verification token (returns existing unless regenerate=true)
  generateVerificationToken: (siteId: string, regenerate: boolean = false) =>
    api.post<{
      token: string;
      instructions: VerificationInstructions;
    }>(`/sites/${siteId}/verification-token`, { regenerate }),

  // Verify site
  verify: (siteId: string, method: 'dns' | 'file') =>
    api.post<{
      verified: boolean;
      method?: 'dns' | 'file';
      error?: string;
      details?: string;
    }>(`/sites/${siteId}/verify`, { method }),

  // Extract branding colors from site
  extractBranding: (siteId: string) =>
    api.post<{
      palette: {
        primary: string;
        secondary: string;
        accent: string;
      };
      companyName: string;
      allColors: string[];
    }>(`/sites/${siteId}/extract-branding`),

  // Get scanner info (for whitelisting)
  getScannerInfo: () =>
    api.get<{
      userAgent: string;
      botInfoUrl: string;
      ips: string[];
      verificationHeader: string;
      rateLimitProfiles: Array<{ id: string; label: string; description: string }>;
    }>('/sites/scanner-info'),

  // Toggle public badge
  toggleBadge: (siteId: string, enabled: boolean) =>
    api.put<{ success: boolean; badgeEnabled: boolean }>(`/sites/${siteId}/badge`, { enabled }),
};

// Site Invitations API (public routes)
export const siteInvitationsApi = {
  // Get invitation details by token
  get: (token: string) =>
    api.get<{
      invitation: {
        id: string;
        email: string;
        permission: SitePermission;
        siteName: string;
        siteDomain: string;
        invitedBy: string;
        expiresAt: string;
        createdAt: string;
      };
    }>(`/site-invitations/${token}`),

  // Accept invitation (requires auth)
  accept: (token: string) =>
    api.post<{
      success: boolean;
      message: string;
      share: { id: string; siteId: string; permission: SitePermission };
    }>(`/site-invitations/${token}/accept`),

  // Decline invitation (public)
  decline: (token: string) =>
    api.post<{ success: boolean; message: string }>(`/site-invitations/${token}/decline`),

  // Get pending invitations for current user
  getPendingForMe: () =>
    api.get<{
      invitations: Array<{
        id: string;
        token: string;
        permission: SitePermission;
        siteName: string;
        siteDomain: string;
        invitedBy: string;
        expiresAt: string;
        createdAt: string;
      }>;
    }>('/site-invitations/pending/me'),
};

// Organizations API
export const organizationsApi = {
  list: () =>
    api.get<{ organizations: Array<{ id: string; name: string; role: string; subscription: { tier: string } }> }>('/organizations'),

  get: (orgId: string) =>
    api.get<{
      organization: { id: string; name: string; settings: Record<string, unknown> };
      tierLimits: Record<string, unknown> | null;
    }>(`/organizations/${orgId}`),

  create: (data: { name: string; slug?: string }) =>
    api.post<{ organization: { id: string; name: string; settings: Record<string, unknown> } }>('/organizations', data),

  update: (orgId: string, data: Record<string, unknown>) =>
    api.patch(`/organizations/${orgId}`, data),
};

// User API (subscription, usage)
export const userApi = {
  // Get current user's subscription
  getSubscription: () =>
    api.get<{ subscription: Subscription; limits: TierLimits }>('/subscription'),

  // Get current user's usage
  getUsage: () =>
    api.get<{ usage: UsageStats; limits: TierLimits }>('/usage'),

  // Start a free trial on a paid tier
  startTrial: (tier: 'starter' | 'pro' | 'agency') =>
    api.post<{ subscription: Subscription }>('/subscription/start-trial', { tier }),
};

// Billing API (Stripe checkout + portal)
export const billingApi = {
  createCheckout: (tier: string) =>
    api.post<{ url: string }>('/subscription/checkout', { tier }),

  createPortal: () =>
    api.post<{ url: string }>('/subscription/portal'),
};

// Admin API (super admin only)
import type {
  DashboardStats,
  SystemHealth,
  AdminUser,
  AdminOrganization,
  AdminActivity,
  AnalyticsDataPoint,
  SubscriptionTier as AdminSubscriptionTier,
  SubscriptionStatus as AdminSubscriptionStatus,
} from '../types/admin.types';

export const adminApi = {
  // Check admin status
  check: () =>
    api.get<{ isAdmin: boolean; admin: { id: string; email: string } }>('/admin/check'),

  // Dashboard
  getDashboard: () =>
    api.get<{ stats: DashboardStats; health: SystemHealth }>('/admin/dashboard'),

  // Analytics
  getAnalytics: (days: number = 30) =>
    api.get<{ analytics: AnalyticsDataPoint[] }>(`/admin/analytics?days=${days}`),

  // Founder Analytics (Phase 6)
  getFunnelAnalytics: (range: string = '30d') =>
    api.get<AdminFunnelAnalytics>(`/admin/analytics/funnel?range=${range}`),

  getGlobalTrends: (range: string = '30d') =>
    api.get<AdminGlobalTrends>(`/admin/analytics/trends?range=${range}`),

  getRevenueAnalytics: () =>
    api.get<AdminRevenueAnalytics>('/admin/analytics/revenue'),

  // Users
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

  updateUser: (userId: string, data: { is_super_admin?: boolean; tier?: string }) =>
    api.patch<{ user: AdminUser }>(`/admin/users/${userId}`, data),

  deleteUser: (userId: string) =>
    api.delete<{ success: boolean }>(`/admin/users/${userId}`),

  // Organizations (kept for admin but deprecated)
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

  // Activity log
  getActivityLog: (params: { page?: number; limit?: number; adminId?: string } = {}) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', String(params.page));
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.adminId) searchParams.set('adminId', params.adminId);
    return api.get<{ activities: AdminActivity[]; pagination: Pagination }>(`/admin/activity?${searchParams.toString()}`);
  },

  // Email Templates
  listTemplates: (params: { page?: number; limit?: number; category?: string; is_system?: boolean; search?: string } = {}) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', String(params.page));
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.category) searchParams.set('category', params.category);
    if (params.is_system !== undefined) searchParams.set('is_system', String(params.is_system));
    if (params.search) searchParams.set('search', params.search);
    return api.get<{ templates: EmailTemplateListItem[]; pagination: Pagination }>(`/admin/email/templates?${searchParams.toString()}`);
  },

  getTemplate: (id: string) =>
    api.get<{ template: EmailTemplateDetail }>(`/admin/email/templates/${id}`),

  createTemplate: (data: CreateEmailTemplateInput) =>
    api.post<{ template: EmailTemplateDetail }>('/admin/email/templates', data),

  updateTemplate: (id: string, data: Partial<CreateEmailTemplateInput>) =>
    api.put<{ template: EmailTemplateDetail }>(`/admin/email/templates/${id}`, data),

  deleteTemplate: (id: string) =>
    api.delete<{ success: boolean }>(`/admin/email/templates/${id}`),

  previewTemplate: (id: string, variables?: Record<string, string>) =>
    api.post<{ html: string }>(`/admin/email/templates/${id}/preview`, { variables }),

  testSendTemplate: (id: string, variables?: Record<string, string>) =>
    api.post<{ success: boolean; sentTo: string }>(`/admin/email/templates/${id}/test`, { variables }),

  duplicateTemplate: (id: string, slug: string, name: string) =>
    api.post<{ template: EmailTemplateDetail }>(`/admin/email/templates/${id}/duplicate`, { slug, name }),

  // CRM - Leads
  getLeads: (params: { status?: string; search?: string; sort?: string; order?: string; page?: number; limit?: number } = {}) => {
    const searchParams = new URLSearchParams();
    if (params.status) searchParams.set('status', params.status);
    if (params.search) searchParams.set('search', params.search);
    if (params.sort) searchParams.set('sort', params.sort);
    if (params.order) searchParams.set('order', params.order);
    if (params.page) searchParams.set('page', String(params.page));
    if (params.limit) searchParams.set('limit', String(params.limit));
    return api.get<{ leads: CrmLead[]; pagination: Pagination }>(`/admin/crm/leads?${searchParams.toString()}`);
  },

  getLead: (userId: string) =>
    api.get<{ lead: CrmLead; timeline: CrmTimelineEvent[]; memberships: CrmMembership[]; outreach: CrmOutreachRecord[] }>(`/admin/crm/leads/${userId}`),

  recalcLeadScore: (userId: string) =>
    api.post<{ score: number; status: string }>(`/admin/crm/leads/${userId}/recalc`),

  getCrmStats: () =>
    api.get<{ stats: CrmStats }>('/admin/crm/stats'),

  getLeadMemberships: (userId: string) =>
    api.get<{ memberships: CrmMembership[] }>(`/admin/crm/leads/${userId}/memberships`),

  // CRM - Triggers
  getTriggers: (params: { status?: string; type?: string; page?: number; limit?: number } = {}) => {
    const searchParams = new URLSearchParams();
    if (params.status) searchParams.set('status', params.status);
    if (params.type) searchParams.set('type', params.type);
    if (params.page) searchParams.set('page', String(params.page));
    if (params.limit) searchParams.set('limit', String(params.limit));
    return api.get<{ triggers: CrmTrigger[]; pagination: Pagination }>(`/admin/crm/triggers?${searchParams.toString()}`);
  },

  actionTrigger: (triggerId: string, status: 'sent' | 'dismissed' | 'actioned') =>
    api.patch<{ trigger: CrmTrigger }>(`/admin/crm/triggers/${triggerId}`, { status }),

  getTriggerStats: () =>
    api.get<{ stats: CrmTriggerStats }>('/admin/crm/triggers/stats'),

  // CRM - Outreach
  sendOutreach: (userId: string, templateSlug: string, variables?: Record<string, string>) =>
    api.post<{ success: boolean; sentTo: string }>(`/admin/crm/outreach/${userId}`, { templateSlug, variables }),

  getOutreachHistory: (params: { userId?: string; page?: number; limit?: number } = {}) => {
    const searchParams = new URLSearchParams();
    if (params.userId) searchParams.set('userId', params.userId);
    if (params.page) searchParams.set('page', String(params.page));
    if (params.limit) searchParams.set('limit', String(params.limit));
    return api.get<{ sends: CrmOutreachRecord[]; pagination: Pagination }>(`/admin/crm/outreach?${searchParams.toString()}`);
  },

  // Worker management
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

  // Email Campaigns
  listCampaigns: (params: { page?: number; limit?: number; status?: string; search?: string } = {}) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', String(params.page));
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.status) searchParams.set('status', params.status);
    if (params.search) searchParams.set('search', params.search);
    return api.get<{ campaigns: EmailCampaignItem[]; pagination: Pagination }>(`/admin/email/campaigns?${searchParams.toString()}`);
  },

  getCampaign: (id: string) =>
    api.get<{ campaign: EmailCampaignItem }>(`/admin/email/campaigns/${id}`),

  createCampaign: (data: CreateEmailCampaignInput) =>
    api.post<{ campaign: EmailCampaignItem }>('/admin/email/campaigns', data),

  updateCampaign: (id: string, data: Partial<CreateEmailCampaignInput>) =>
    api.put<{ campaign: EmailCampaignItem }>(`/admin/email/campaigns/${id}`, data),

  deleteCampaign: (id: string) =>
    api.delete<{ success: boolean }>(`/admin/email/campaigns/${id}`),

  launchCampaign: (id: string) =>
    api.post<{ campaign: EmailCampaignItem }>(`/admin/email/campaigns/${id}/launch`),

  scheduleCampaign: (id: string, scheduled_at: string) =>
    api.post<{ campaign: EmailCampaignItem }>(`/admin/email/campaigns/${id}/schedule`, { scheduled_at }),

  pauseCampaign: (id: string) =>
    api.post<{ campaign: EmailCampaignItem }>(`/admin/email/campaigns/${id}/pause`),

  resumeCampaign: (id: string) =>
    api.post<{ campaign: EmailCampaignItem }>(`/admin/email/campaigns/${id}/resume`),

  cancelCampaign: (id: string) =>
    api.post<{ campaign: EmailCampaignItem }>(`/admin/email/campaigns/${id}/cancel`),

  getCampaignAudienceCount: (segment: CampaignSegment) =>
    api.post<{ count: number }>('/admin/email/campaigns/audience-count', { segment }),

  getCampaignSends: (id: string, params: { page?: number; limit?: number; status?: string } = {}) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', String(params.page));
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.status) searchParams.set('status', params.status);
    return api.get<{ sends: EmailSendRecord[]; pagination: Pagination }>(`/admin/email/campaigns/${id}/sends?${searchParams.toString()}`);
  },

  getEmailSends: (params: { page?: number; limit?: number; status?: string; campaignId?: string } = {}) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', String(params.page));
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.status) searchParams.set('status', params.status);
    if (params.campaignId) searchParams.set('campaignId', params.campaignId);
    return api.get<{ sends: EmailSendRecord[]; pagination: Pagination }>(`/admin/email/sends?${searchParams.toString()}`);
  },

  getEmailAnalytics: (days: number = 30) =>
    api.get<{ totals: EmailAnalyticsTotals; daily: EmailAnalyticsDay[] }>(`/admin/email/analytics?days=${days}`),

  getTemplatePerformance: () =>
    api.get<{ templates: TemplatePerformanceItem[] }>('/admin/email/analytics/templates'),

  getUnsubscribeStats: () =>
    api.get<{ registeredUnsubscribed: number; coldProspectUnsubscribed: number; totalUnsubscribed: number }>('/admin/email/unsubscribe-stats'),

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

  renameMedia: (id: string, name: string) =>
    api.put<{ media: BlogMediaItem }>(`/admin/cms/media/${id}/rename`, { name }),

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

// Email template types (client-side)
interface EmailTemplateListItem {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  subject: string;
  category: string;
  is_system: boolean;
  is_active: boolean;
  branding_mode: string;
  created_at: string;
  updated_at: string;
}

interface EmailTemplateDetail extends EmailTemplateListItem {
  preview_text: string | null;
  blocks: unknown[];
  compiled_html: string | null;
  compiled_at: string | null;
  variables: string[];
  created_by: string | null;
}

interface CreateEmailTemplateInput {
  slug: string;
  name: string;
  description?: string;
  subject: string;
  preview_text?: string;
  blocks: unknown[];
  category: string;
  variables?: string[];
  branding_mode?: string;
  is_active?: boolean;
}

// =============================================
// Email Campaign Types
// =============================================

export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'paused' | 'sent' | 'cancelled' | 'failed';

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

export interface EmailCampaignItem {
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
  template_name?: string;
  template_slug?: string;
}

export interface CreateEmailCampaignInput {
  name: string;
  description?: string;
  template_id: string;
  segment?: CampaignSegment;
  send_rate_per_second?: number;
  max_recipients?: number;
}

export interface EmailSendRecord {
  id: string;
  to_email: string;
  subject?: string;
  status: string;
  resend_message_id: string | null;
  sent_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  error_message: string | null;
  created_at: string;
  campaign_id?: string;
  template_name?: string;
  template_slug?: string;
}

export interface EmailAnalyticsTotals {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  complained: number;
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

// =============================================
// Worker Types
// =============================================

export interface WorkerStatus {
  status: string;
  uptime: number;
  workerId: string;
  isProcessing: boolean;
  stats: {
    jobsProcessed: number;
    jobsFailed: number;
    lastJobTime: string | null;
  };
  queue24h: {
    pending: number;
    discovering: number;
    ready: number;
    processing: number;
    completed: number;
    failed: number;
  };
  memory?: {
    usedPercent: number;
    freeMB: number;
    totalMB: number;
    threshold: number;
    effectiveConcurrency: number;
  };
}

export interface QueueJob {
  id: string;
  target_url: string;
  target_domain: string;
  status: 'pending' | 'discovering' | 'ready' | 'processing';
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
  user_email: string;
  user_first_name: string;
  user_last_name: string;
}

export interface QueueFailedJob {
  id: string;
  target_url: string;
  target_domain: string;
  status: 'failed';
  error_message: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  user_email: string;
  user_first_name: string;
}

export interface QueueBacklog {
  jobs: QueueJob[];
  recentFailed: QueueFailedJob[];
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

// =============================================
// CRM Types
// =============================================

export interface CrmLead {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  lead_score: number;
  lead_status: string;
  lead_score_updated_at: string | null;
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
  user_id?: string;
  subject: string;
  status: string;
  created_at: string;
  template_name: string | null;
  template_slug: string | null;
  sent_by_email: string | null;
  user_email?: string;
  user_first_name?: string;
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

// =============================================
// Email Preferences API (user-facing)
// =============================================

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

export const emailPreferencesApi = {
  getMyPreferences: () =>
    api.get<{ preferences: EmailPreferences }>('/email/my-preferences'),

  updateMyPreferences: (prefs: Partial<Omit<EmailPreferences, 'user_id' | 'transactional' | 'updated_at'>>) =>
    api.put<{ preferences: EmailPreferences }>('/email/my-preferences', prefs),

  unsubscribeWithToken: (token: string) =>
    api.get<{ success: boolean; message: string }>(`/email/unsubscribe?token=${encodeURIComponent(token)}`),

  getPreferencesWithToken: (token: string) =>
    api.get<{ preferences: EmailPreferences }>(`/email/preferences?token=${encodeURIComponent(token)}`),

  updatePreferencesWithToken: (token: string, prefs: Partial<Omit<EmailPreferences, 'user_id' | 'transactional' | 'updated_at'>>) =>
    api.post<{ preferences: EmailPreferences }>(`/email/preferences?token=${encodeURIComponent(token)}`, prefs),
};

// =============================================
// Analytics API
// =============================================

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
  // Get score history for a site
  getSiteScores: (siteId: string, options?: { range?: TimeRange; from?: string; to?: string }) =>
    api.get<ScoreHistory>(`/analytics/sites/${siteId}/scores`, { params: options }),

  // Get issue trends for a site
  getSiteIssues: (siteId: string, options?: { range?: TimeRange; groupBy?: GroupBy }) =>
    api.get<IssueTrends>(`/analytics/sites/${siteId}/issues`, { params: options }),

  // Compare multiple audits
  compareAudits: (auditIds: string[]) =>
    api.get<AuditComparison>('/analytics/compare', { params: { audits: auditIds.join(',') } }),

  // Compare multiple sites
  compareSites: (siteIds: string[]) =>
    api.get<SiteComparison>('/analytics/compare-sites', { params: { sites: siteIds.join(',') } }),

  // Get user analytics overview
  getUserOverview: () =>
    api.get<UserOverview>('/analytics/overview'),

  // Get full analytics for a specific URL
  getUrlAnalytics: (siteId: string, urlId: string) =>
    api.get<UrlAnalytics>(`/analytics/sites/${siteId}/urls/${urlId}`),

  // Get score history for a specific URL
  getUrlScores: (siteId: string, urlId: string, options?: { range?: TimeRange }) =>
    api.get<ScoreHistory>(`/analytics/sites/${siteId}/urls/${urlId}/scores`, { params: options }),

  // Get all audited URLs across user's sites (for URL comparison picker)
  getUserUrls: (search?: string, limit?: number) =>
    api.get<UserAuditedUrl[]>('/analytics/user-urls', { params: { search, limit } }),

  // Issue waterfall for a site
  getIssueWaterfall: (siteId: string) =>
    api.get<{ steps: Array<{ auditId: string; completedAt: string; totalIssues: number; fixed: number; introduced: number }> }>(`/analytics/sites/${siteId}/waterfall`),

  // Fix velocity for a site
  getFixVelocity: (siteId: string) =>
    api.get<{ points: Array<{ auditId: string; completedAt: string; cumulativeFixed: number; cumulativeNew: number; netChange: number }> }>(`/analytics/sites/${siteId}/fix-velocity`),

  // Page finding heatmap
  getPageHeatmap: (siteId: string, auditId: string) =>
    api.get<{ pages: Array<{ pageId: string; url: string; categories: Record<string, { count: number; maxSeverity: string }> }> }>(`/analytics/sites/${siteId}/heatmap/${auditId}`),

  // Response time distribution
  getResponseTimeDistribution: (siteId: string, auditId: string) =>
    api.get<{ buckets: Array<{ range: string; count: number; min: number; max: number }>; stats: { median: number; p75: number; p95: number; max: number; total: number } }>(`/analytics/sites/${siteId}/response-times/${auditId}`),

  // Page size distribution
  getPageSizeDistribution: (siteId: string, auditId: string) =>
    api.get<{ pages: Array<{ url: string; sizeBytes: number; overBudget: boolean }>; stats: { median: number; total: number; overBudgetCount: number }; budgetBytes: number }>(`/analytics/sites/${siteId}/page-sizes/${auditId}`),

  // Compare two URLs side-by-side
  compareUrls: (urlSpecs: [{ siteId: string; urlId: string }, { siteId: string; urlId: string }]) =>
    api.get<UrlComparison>('/analytics/compare-urls', {
      params: { urls: urlSpecs.map(s => `${s.siteId}:${s.urlId}`).join(',') },
    }),
};

// =============================================
// Bug Reports API
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

export interface BugReport {
  id: string;
  user_id: string;
  title: string;
  description: string;
  severity: 'critical' | 'major' | 'minor' | 'trivial';
  category: string;
  page_url: string | null;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'urgent' | 'high' | 'medium' | 'low' | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  reporter_email?: string;
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
  critical_open: number;
  last_7_days: number;
  last_24_hours: number;
}

export const bugReportsApi = {
  // Create a new bug report
  create: (data: CreateBugReportInput) =>
    api.post<{ report: BugReport }>('/bug-reports', data),

  // List my bug reports
  listMine: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get<{ items: BugReport[]; total: number; page: number; limit: number }>('/bug-reports/mine', { params }),

  // Get a single bug report
  getById: (id: string) =>
    api.get<{ report: BugReport }>(`/bug-reports/${id}`),

  // Get comments for a bug report
  getComments: (id: string) =>
    api.get<{ comments: BugReportComment[] }>(`/bug-reports/${id}/comments`),

  // Add a comment to a bug report
  addComment: (id: string, content: string) =>
    api.post<{ comment: BugReportComment }>(`/bug-reports/${id}/comments`, { content }),
};

// =============================================
// Admin Bug Reports API
// =============================================

export const adminBugReportsApi = {
  // List all bug reports
  list: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    severity?: string;
    category?: string;
    search?: string;
  }) => api.get<{
    items: BugReport[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  }>('/admin/bug-reports', { params }),

  // Get bug report stats
  getStats: () =>
    api.get<BugReportStats>('/admin/bug-reports/stats'),

  // Get a single bug report with comments
  getById: (id: string) =>
    api.get<{ report: BugReport & { comments: BugReportComment[] } }>(`/admin/bug-reports/${id}`),

  // Update a bug report
  update: (id: string, data: {
    status?: 'open' | 'in_progress' | 'resolved' | 'closed';
    priority?: 'urgent' | 'high' | 'medium' | 'low' | null;
    adminNotes?: string;
    resolutionNotes?: string;
    assignedTo?: string | null;
  }) => api.patch<{ report: BugReport }>(`/admin/bug-reports/${id}`, data),

  // Add admin comment
  addComment: (id: string, content: string) =>
    api.post<{ comment: BugReportComment }>(`/admin/bug-reports/${id}/comments`, { content }),

  // Delete a bug report
  delete: (id: string) =>
    api.delete<{ success: boolean }>(`/admin/bug-reports/${id}`),
};

// =============================================
// Feature Requests API
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

export interface FeatureRequest {
  id: string;
  user_id: string;
  title: string;
  description: string;
  impact: 'nice_to_have' | 'would_be_helpful' | 'important' | 'critical_for_workflow';
  category: string;
  page_url: string | null;
  status: 'submitted' | 'under_review' | 'planned' | 'in_progress' | 'completed' | 'declined';
  priority: 'urgent' | 'high' | 'medium' | 'low' | null;
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

export const featureRequestsApi = {
  // Create a new feature request
  create: (data: CreateFeatureRequestInput) =>
    api.post<{ request: FeatureRequest }>('/feature-requests', data),

  // List my feature requests
  listMine: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get<{ items: FeatureRequest[]; total: number; page: number; limit: number }>('/feature-requests/mine', { params }),

  // Get a single feature request
  getById: (id: string) =>
    api.get<{ request: FeatureRequest }>(`/feature-requests/${id}`),

  // Get comments for a feature request
  getComments: (id: string) =>
    api.get<{ comments: FeatureRequestComment[] }>(`/feature-requests/${id}/comments`),

  // Add a comment to a feature request
  addComment: (id: string, content: string) =>
    api.post<{ comment: FeatureRequestComment }>(`/feature-requests/${id}/comments`, { content }),
};

// =============================================
// Admin Feature Requests API
// =============================================

export const adminFeatureRequestsApi = {
  // List all feature requests
  list: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    impact?: string;
    category?: string;
    search?: string;
  }) => api.get<{
    items: FeatureRequest[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  }>('/admin/feature-requests', { params }),

  // Get feature request stats
  getStats: () =>
    api.get<FeatureRequestStats>('/admin/feature-requests/stats'),

  // Get a single feature request with comments
  getById: (id: string) =>
    api.get<{ request: FeatureRequest & { comments: FeatureRequestComment[] } }>(`/admin/feature-requests/${id}`),

  // Update a feature request
  update: (id: string, data: {
    status?: 'submitted' | 'under_review' | 'planned' | 'in_progress' | 'completed' | 'declined';
    priority?: 'urgent' | 'high' | 'medium' | 'low' | null;
    adminNotes?: string;
    resolutionNotes?: string;
    assignedTo?: string | null;
  }) => api.patch<{ request: FeatureRequest }>(`/admin/feature-requests/${id}`, data),

  // Add admin comment
  addComment: (id: string, content: string) =>
    api.post<{ comment: FeatureRequestComment }>(`/admin/feature-requests/${id}/comments`, { content }),

  // Delete a feature request
  delete: (id: string) =>
    api.delete<{ success: boolean }>(`/admin/feature-requests/${id}`),
};

// Blog CMS types
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

export type BlogSchemaType = 'article' | 'howto' | 'faq' | 'claim_review';
export type BlogReviewRating = 'True' | 'MostlyTrue' | 'Mixed' | 'MostlyFalse' | 'False';

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
  schema_type: BlogSchemaType;
  created_at: string;
  updated_at: string;
}

export interface BlogPostDetail extends BlogPostSummary {
  featured_image_alt: string | null;
  content: BlogContentBlock[];
  author_id: string;
  seo_title: string | null;
  seo_description: string | null;
  focus_keyword: string | null;
  related_post_ids: string[];
  schema_claim_reviewed: string | null;
  schema_review_rating: BlogReviewRating | null;
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
  focus_keyword?: string | null;
  schema_type?: BlogSchemaType;
  schema_claim_reviewed?: string | null;
  schema_review_rating?: BlogReviewRating | null;
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

// CMS Extras types (Phase 5)
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

// Public announcements API (user-facing)
export const announcementsApi = {
  getActive: () =>
    api.get<{ announcements: AnnouncementItem[] }>('/announcements/active'),

  dismiss: (id: string) =>
    api.post<{ success: boolean }>(`/announcements/${id}/dismiss`),
};

// Public success stories API
export const publicApi = {
  getSuccessStories: (limit: number = 6) =>
    api.get<{ stories: SuccessStoryItem[] }>(`/public/success-stories?limit=${limit}`),
};

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

// Cookie consent API (public, no auth)
export const consentApi = {
  logCookieConsent: (data: {
    consent_version: string;
    categories: Record<string, boolean>;
    action: string;
    page_url: string;
  }) => api.post<{ success: boolean; logged_at: string }>('/consent/cookies', data),
};

// =============================================
// Admin Analytics Types (Phase 6)
// =============================================

export interface AdminFunnelStage {
  name: string;
  count: number;
  conversionFromPrevious: number | null;
}

export interface AdminFunnelAnalytics {
  range: string;
  stages: AdminFunnelStage[];
}

export interface AdminTopIssue {
  ruleId: string;
  ruleName: string;
  category: string;
  severity: string;
  affectedAudits: number;
  percentage: number;
}

export interface AdminScoreDistribution {
  avg: number;
  median: number;
  p10: number;
  p90: number;
}

export interface AdminTierAuditBreakdown {
  audits: number;
  avgScore: number;
}

export interface AdminGlobalTrends {
  range: string;
  totalAuditsCompleted: number;
  totalPagesScanned: number;
  topIssues: AdminTopIssue[];
  scoreDistribution: Record<string, AdminScoreDistribution>;
  tierBreakdown: Record<string, AdminTierAuditBreakdown>;
}

export interface AdminTierRevenue {
  count: number;
  mrr: number;
}

export interface AdminRevenueAnalytics {
  mrr: number;
  arr: number;
  byTier: Record<string, AdminTierRevenue>;
  churnThisMonth: { count: number; mrrLost?: number };
  newThisMonth: { count: number; mrrGained?: number };
}

// =============================================
// Scheduled Audits Types & API
// =============================================

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

export interface AdminScheduleStats {
  total: number;
  active: number;
  paused: number;
  disabled: number;
  ranToday: number;
}

export interface AdminScheduleItem extends AuditScheduleSummary {
  user_email: string;
  first_name: string;
}

export const adminSchedulesApi = {
  list: (params: { status?: string; search?: string; page?: number; limit?: number } = {}) => {
    const searchParams = new URLSearchParams();
    if (params.status) searchParams.set('status', params.status);
    if (params.search) searchParams.set('search', params.search);
    if (params.page) searchParams.set('page', String(params.page));
    if (params.limit) searchParams.set('limit', String(params.limit));
    return api.get<{ schedules: AdminScheduleItem[]; total: number }>(`/admin/schedules?${searchParams.toString()}`);
  },

  getStats: () =>
    api.get<{ stats: AdminScheduleStats }>('/admin/schedules/stats'),

  get: (id: string) =>
    api.get<{ schedule: AdminScheduleItem }>(`/admin/schedules/${id}`),

  update: (id: string, data: { enabled?: boolean; paused_reason?: string | null; max_consecutive_failures?: number }) =>
    api.patch<{ schedule: AdminScheduleItem }>(`/admin/schedules/${id}`, data),

  delete: (id: string) =>
    api.delete(`/admin/schedules/${id}`),
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
  is_unsubscribed?: boolean;
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
    isUnsubscribed?: boolean;
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
    if (params.isUnsubscribed) searchParams.set('isUnsubscribed', 'true');
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

  // Outreach
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

// ─── Referrals API ─────────────────────────────────────

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

// Coming Soon (public, no auth)
export const comingSoonApi = {
  getStatus: () =>
    api.get<{ enabled: boolean; mode: 'waitlist' | 'early_access' | 'live'; headline: string; description: string }>('/coming-soon/status'),
  signup: (data: { email: string; name?: string }) =>
    api.post('/coming-soon/signup', data),
};

// Admin System Settings
export const adminSettingsApi = {
  getAll: () =>
    api.get<{ settings: Record<string, unknown> }>('/admin/settings'),
  update: (key: string, value: unknown) =>
    api.patch('/admin/settings', { key, value }),
};

// Admin Coming Soon Signups
export const adminComingSoonApi = {
  listSignups: (params?: { page?: number; search?: string }) =>
    api.get<{
      signups: Array<{ id: string; email: string; name: string | null; ip_address: string | null; created_at: string }>;
      pagination: { page: number; limit: number; total: number; pages: number };
    }>('/admin/coming-soon/signups', { params }),
  exportSignups: () =>
    api.get('/admin/coming-soon/signups/export', { responseType: 'blob' }),
  deleteSignup: (id: string) =>
    api.delete(`/admin/coming-soon/signups/${id}`),
};

// Admin SEO Management
export const adminSeoApi = {
  list: () =>
    api.get<{ entries: Array<{
      id: string;
      route_path: string;
      title: string | null;
      description: string | null;
      keywords: string | null;
      og_title: string | null;
      og_description: string | null;
      og_image: string | null;
      og_type: string;
      twitter_card: string;
      canonical_url: string | null;
      featured_image: string | null;
      structured_data: Record<string, unknown> | null;
      noindex: boolean;
      updated_at: string;
      updated_by: string | null;
    }> }>('/admin/seo'),

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

// Public SEO entries
export const seoApi = {
  getAll: () =>
    api.get<{ entries: Array<{
      route_path: string;
      title: string | null;
      description: string | null;
      keywords: string | null;
      og_title: string | null;
      og_description: string | null;
      og_image: string | null;
      og_type: string;
      twitter_card: string;
      canonical_url: string | null;
      featured_image: string | null;
      structured_data: Record<string, unknown> | null;
      noindex: boolean;
    }> }>('/seo'),
};

// Early Access (public)
export const earlyAccessApi = {
  getStatus: () =>
    api.get<{ enabled: boolean; spotsRemaining: number; maxSpots: number; isFull: boolean }>('/early-access/status'),
};

// Admin Early Access
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

// Account management (GDPR: data export, deletion)
export const accountApi = {
  requestDataExport: (password: string) =>
    api.post<{ message: string; exportId: string }>('/account/export', { password }),

  getExportStatus: () =>
    api.get<{ export: {
      id: string;
      status: string;
      createdAt: string;
      completedAt: string | null;
      expiresAt: string | null;
      fileSizeBytes: number | null;
    } | null }>('/account/export/status'),

  downloadExport: (exportId: string) =>
    api.get(`/account/export/${exportId}/download`, { responseType: 'blob' }),

  requestAccountDeletion: (password: string, confirmText: string) =>
    api.post<{ message: string; scheduledFor: string }>('/account/delete', { password, confirmText }),

  cancelAccountDeletion: () =>
    api.post<{ message: string }>('/account/cancel-deletion'),
};

// =============================================
// COLD OUTREACH LOG
// =============================================

export interface OutreachLogEntry {
  id: string;
  email: string;
  name?: string;
  domain?: string;
  date_sent: string;
  subject?: string;
  notes?: string;
  status: 'sent' | 'replied' | 'nurturing' | 'converted' | 'dead';
  replied: boolean;
  reply_date?: string;
  reply_notes?: string;
  free_audit_given: boolean;
  free_audit_date?: string;
  became_user: boolean;
  user_signup_date?: string;
  user_id?: string;
  became_paid: boolean;
  paid_date?: string;
  plan_tier?: string;
  created_at: string;
  updated_at: string;
}

export interface OutreachLogStats {
  total: number;
  replied: number;
  replyRate: string;
  freeAudits: number;
  users: number;
  userRate: string;
  paid: number;
  paidRate: string;
  byStatus: Record<string, number>;
  sentLast7d: number;
  sentLast30d: number;
}

export const outreachLogApi = {
  list: (params: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    sort?: string;
    order?: string;
    replied?: string;
    became_user?: string;
    became_paid?: string;
    free_audit?: string;
  } = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined) searchParams.set(key, String(val));
    });
    const qs = searchParams.toString();
    return api.get<{ items: OutreachLogEntry[]; total: number; page: number; limit: number; totalPages: number }>(
      `/admin/outreach-log${qs ? `?${qs}` : ''}`
    );
  },

  stats: () => api.get<OutreachLogStats>('/admin/outreach-log/stats'),

  get: (id: string) => api.get<OutreachLogEntry>(`/admin/outreach-log/${id}`),

  create: (data: Partial<OutreachLogEntry>) =>
    api.post<OutreachLogEntry>('/admin/outreach-log', data),

  update: (id: string, data: Partial<OutreachLogEntry>) =>
    api.patch<OutreachLogEntry>(`/admin/outreach-log/${id}`, data),

  delete: (id: string) =>
    api.delete<{ deleted: boolean }>(`/admin/outreach-log/${id}`),
};

export default api;
