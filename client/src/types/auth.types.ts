// User types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  companyName?: string;
  emailVerified: boolean;
  role: UserRole;
  createdAt?: string;
}

export type UserRole = 'user' | 'admin' | 'super_admin';

// Auth state
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// API response types
export interface AuthResponse {
  message: string;
  user: User;
  expiresIn?: number;
}

export interface ErrorResponse {
  error: string;
  code: string;
  details?: Array<{ field: string; message: string }>;
  retryAfter?: number;
}

// Form input types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyName?: string;
  acceptedTos?: boolean;
  referralCode?: string;
  earlyAccessChannel?: 'email' | 'social';
}

export interface PasswordResetRequestData {
  email: string;
}

export interface PasswordResetData {
  token: string;
  password: string;
}

export interface VerifyEmailData {
  token: string;
}
