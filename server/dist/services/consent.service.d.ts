import { Pool } from 'pg';
export declare function setPool(dbPool: Pool): void;
export interface AuditConsentInput {
    auditJobId: string;
    userId: string;
    organizationId?: string;
    targetUrl: string;
    targetDomain: string;
    isVerified: boolean;
    ipAddress: string;
    userAgent?: string;
    dontShowAgain?: boolean;
    consentVersion?: string;
}
export interface UserConsentPreference {
    skipUnverifiedDomainWarning: boolean;
}
export interface AuditConsentLog {
    id: string;
    audit_job_id: string;
    user_id: string;
    organization_id: string | null;
    target_url: string;
    target_domain: string;
    is_verified: boolean;
    accepted_at: Date;
    ip_address: string;
    user_agent: string | null;
    consent_text_hash: string;
    consent_version: string;
    dont_show_again: boolean;
    created_at: Date;
}
export interface UserConsent {
    id: string;
    user_id: string;
    consent_type: string;
    consent_version: string;
    consent_text_hash: string;
    accepted_at: Date;
    ip_address: string;
    user_agent: string | null;
    created_at: Date;
}
/**
 * Log consent acceptance for an unverified domain audit
 * This is called every time an audit is started on an unverified domain,
 * regardless of the "don't show again" preference
 */
export declare function logAuditConsent(input: AuditConsentInput): Promise<AuditConsentLog>;
/**
 * Get consent logs for a specific audit
 */
export declare function getConsentLogsForAudit(auditJobId: string): Promise<AuditConsentLog[]>;
/**
 * Get all consent logs for a user
 */
export declare function getConsentLogsForUser(userId: string, limit?: number): Promise<AuditConsentLog[]>;
/**
 * Get consent logs for an organization
 */
export declare function getConsentLogsForOrg(organizationId: string, limit?: number): Promise<AuditConsentLog[]>;
/**
 * Get user's consent preference (skip warning for unverified domains)
 */
export declare function getUserConsentPreference(userId: string): Promise<UserConsentPreference>;
/**
 * Update user's consent preference
 */
export declare function updateConsentPreference(userId: string, skipWarning: boolean): Promise<void>;
/**
 * Reset user's consent preference (show warnings again)
 */
export declare function resetConsentPreference(userId: string): Promise<void>;
/**
 * Record ToS acceptance during registration
 */
export declare function recordTosAcceptance(userId: string, ipAddress: string, userAgent?: string, version?: string): Promise<UserConsent>;
/**
 * Check if user has accepted ToS
 */
export declare function hasAcceptedTos(userId: string, minVersion?: string): Promise<boolean>;
/**
 * Get user's ToS acceptance details
 */
export declare function getTosAcceptance(userId: string): Promise<UserConsent | null>;
/**
 * Record privacy policy acceptance
 */
export declare function recordPrivacyAcceptance(userId: string, ipAddress: string, userAgent?: string, version?: string): Promise<UserConsent>;
/**
 * Get all consent records for compliance/audit purposes
 */
export declare function getConsentAuditTrail(filters: {
    userId?: string;
    organizationId?: string;
    domain?: string;
    startDate?: Date;
    endDate?: Date;
}, limit?: number): Promise<AuditConsentLog[]>;
/**
 * Get statistics on consent records
 */
export declare function getConsentStats(): Promise<{
    totalConsents: number;
    uniqueUsers: number;
    uniqueDomains: number;
    consentsToday: number;
    consentsThisMonth: number;
}>;
//# sourceMappingURL=consent.service.d.ts.map