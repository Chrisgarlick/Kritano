import type { Request } from 'express';

// User types
export interface User {
  id: string;
  email: string;
  email_verified: boolean;
  email_verified_at: Date | null;
  password_hash: string;
  password_changed_at: Date;
  first_name: string;
  last_name: string;
  company_name: string | null;
  status: UserStatus;
  role: UserRole;
  failed_login_attempts: number;
  lockout_until: Date | null;
  last_login_at: Date | null;
  last_login_ip: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export type UserStatus = 'pending_verification' | 'active' | 'suspended' | 'deleted';
export type UserRole = 'user' | 'admin' | 'super_admin';

// Safe user object (without sensitive fields)
export interface SafeUser {
  id: string;
  email: string;
  email_verified: boolean;
  first_name: string;
  last_name: string;
  company_name: string | null;
  status: UserStatus;
  role: UserRole;
  created_at: Date;
}

// Refresh token types
export interface RefreshToken {
  id: string;
  user_id: string;
  token_hash: string;
  family_id: string;
  device_fingerprint: string | null;
  user_agent: string | null;
  ip_address: string | null;
  is_revoked: boolean;
  revoked_at: Date | null;
  revoked_reason: string | null;
  expires_at: Date;
  absolute_expires_at: Date;
  replaced_by_token_id: string | null;
  created_at: Date;
  last_used_at: Date | null;
}

// Email verification token types
export interface EmailVerificationToken {
  id: string;
  user_id: string;
  token_hash: string;
  token_type: EmailTokenType;
  is_used: boolean;
  used_at: Date | null;
  used_ip: string | null;
  expires_at: Date;
  created_at: Date;
}

export type EmailTokenType = 'email_verification' | 'password_reset';

// Audit log types
export interface AuthAuditLog {
  id: string;
  user_id: string | null;
  event_type: AuditEventType;
  event_status: AuditEventStatus;
  ip_address: string | null;
  user_agent: string | null;
  device_fingerprint: string | null;
  details: Record<string, unknown> | null;
  failure_reason: string | null;
  created_at: Date;
}

export type AuditEventType =
  // Authentication events
  | 'login_attempt'
  | 'login_success'
  | 'login_failure'
  | 'login_blocked'
  | 'logout'
  | 'logout_all_devices'
  | 'register'
  | 'email_verified'
  | 'email_verification_failed'
  | 'password_reset_requested'
  | 'password_reset_completed'
  | 'password_changed'
  | 'token_refresh'
  | 'token_refresh_failed'
  | 'token_revoked'
  | 'account_locked'
  | 'account_unlocked'
  | 'suspicious_activity'
  // Audit job events
  | 'audit_created'
  | 'audit_started'
  | 'audit_completed'
  | 'audit_failed'
  | 'audit_cancelled'
  | 'audit_deleted'
  | 'audit_bulk_deleted'
  // Finding events
  | 'finding_dismissed'
  | 'finding_restored'
  | 'finding_bulk_dismissed'
  // Export events
  | 'export_pdf'
  | 'export_csv'
  // API events
  | 'api_access';

export type AuditEventStatus = 'success' | 'failure' | 'blocked';

// Rate limit types
export interface RateLimitRecord {
  id: string;
  identifier: string;
  identifier_type: RateLimitIdentifierType;
  action: string;
  attempt_count: number;
  first_attempt_at: Date;
  last_attempt_at: Date;
  window_expires_at: Date;
  is_locked: boolean;
  locked_until: Date | null;
}

export type RateLimitIdentifierType = 'ip' | 'user' | 'email' | 'composite';

// JWT payload types
export interface JwtPayload {
  sub: string; // user id
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

// Token pair returned on login/refresh
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
}

// Request with authenticated user
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

// Device info for token tracking
export interface DeviceInfo {
  userAgent?: string;
  ipAddress?: string;
  fingerprint?: string;
}

// Auth service input types
export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyName?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface PasswordResetInput {
  token: string;
  password: string;
}
