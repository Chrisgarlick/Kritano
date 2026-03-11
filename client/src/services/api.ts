import axios, { type AxiosInstance } from 'axios';

// Get CSRF token from cookie
function getCsrfToken(): string | null {
  const match = document.cookie.match(/csrf_token=([^;]+)/);
  return match ? match[1] : null;
}

// Create axios instance
export const api: AxiosInstance = axios.create({
  baseURL: '/api',
  withCredentials: true,
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

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Will be handled by AuthContext in Phase 2
      console.warn('Unauthorized request');
    }
    return Promise.reject(error);
  }
);
