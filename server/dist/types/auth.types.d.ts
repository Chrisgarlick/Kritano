import type { Request } from 'express';
export interface User {
    id: string;
    email: string;
    email_verified: boolean;
    email_verified_at: Date | null;
    password_hash: string | null;
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
    deletion_requested_at: Date | null;
    deletion_scheduled_for: Date | null;
    beta_access: boolean;
}
export type UserStatus = 'pending_verification' | 'active' | 'suspended' | 'deleted' | 'pending_deletion';
export type UserRole = 'user' | 'admin' | 'super_admin';
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
    deletion_requested_at: Date | null;
    deletion_scheduled_for: Date | null;
    beta_access: boolean;
}
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
export type AuditEventType = 'login_attempt' | 'login_success' | 'login_failure' | 'login_blocked' | 'logout' | 'logout_all_devices' | 'register' | 'email_verified' | 'email_verification_failed' | 'password_reset_requested' | 'password_reset_completed' | 'password_changed' | 'token_refresh' | 'token_refresh_failed' | 'token_revoked' | 'account_locked' | 'account_unlocked' | 'suspicious_activity' | 'oauth_login' | 'oauth_register' | 'oauth_link' | 'oauth_unlink' | 'oauth_auto_link' | 'audit_created' | 'audit_started' | 'audit_completed' | 'audit_failed' | 'audit_cancelled' | 'audit_deleted' | 'audit_bulk_deleted' | 'finding_dismissed' | 'finding_restored' | 'finding_bulk_dismissed' | 'export_pdf' | 'export_csv' | 'api_access';
export type AuditEventStatus = 'success' | 'failure' | 'blocked';
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
export interface JwtPayload {
    sub: string;
    email: string;
    role: UserRole;
    iat: number;
    exp: number;
    iss: string;
    aud: string;
}
export interface TokenPair {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}
export interface AuthenticatedUser {
    id: string;
    email: string;
    role: UserRole;
}
export interface AuthenticatedRequest extends Request {
    user: AuthenticatedUser;
}
export interface DeviceInfo {
    userAgent?: string;
    ipAddress?: string;
    fingerprint?: string;
}
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
export type OAuthProvider = 'google' | 'facebook';
export interface OAuthProfile {
    provider: OAuthProvider;
    providerUserId: string;
    email: string | null;
    emailVerified: boolean;
    firstName: string | null;
    lastName: string | null;
    name: string | null;
    avatarUrl: string | null;
    rawProfile: Record<string, unknown>;
}
export interface OAuthTokens {
    accessToken: string;
    refreshToken: string | null;
    expiresAt: Date | null;
}
export interface OAuthProviderRecord {
    id: string;
    user_id: string;
    provider: OAuthProvider;
    provider_user_id: string;
    email: string | null;
    name: string | null;
    avatar_url: string | null;
    access_token: string | null;
    refresh_token: string | null;
    token_expires_at: Date | null;
    raw_profile: Record<string, unknown> | null;
    linked_at: Date;
    updated_at: Date;
}
export interface OAuthProviderSummary {
    provider: OAuthProvider;
    email: string | null;
    name: string | null;
    avatarUrl: string | null;
    linkedAt: Date;
}
//# sourceMappingURL=auth.types.d.ts.map