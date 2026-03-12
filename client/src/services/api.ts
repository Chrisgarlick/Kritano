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

// User API functions (subscription endpoints available in later phases)
export const userApi = {
  getSubscription: () =>
    api.get<{ subscription: Subscription | null; limits: TierLimits | null }>('/user/subscription'),
};

// Audit API functions
export const auditsApi = {
  start: (data: { targetUrl: string; options?: object }) =>
    api.post('/audits', data),

  list: (params?: { status?: string; limit?: number; offset?: number }) =>
    api.get('/audits', { params }),

  get: (id: string) =>
    api.get(`/audits/${id}`),

  getFindings: (id: string, params?: { category?: string; severity?: string; limit?: number; page?: number }) =>
    api.get(`/audits/${id}/findings`, { params }),

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

  cancel: (id: string) =>
    api.post(`/audits/${id}/cancel`),

  delete: (id: string) =>
    api.delete(`/audits/${id}`),

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
