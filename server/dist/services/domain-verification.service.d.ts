import { Pool } from 'pg';
export declare function setPool(dbPool: Pool): void;
export interface VerificationInstructions {
    token: string;
    dns: {
        recordType: 'TXT';
        name: string;
        alternativeName: string;
        value: string;
    };
    file: {
        path: string;
        url: string;
        content: string;
    };
}
export interface VerificationResult {
    verified: boolean;
    method?: 'dns' | 'file';
    error?: string;
    details?: string;
}
/**
 * Generate a unique verification token for a domain
 * If a token already exists and is not expired, return the existing one
 */
export declare function generateVerificationToken(organizationId: string, domainId: string): Promise<VerificationInstructions>;
/**
 * Verify domain ownership via DNS TXT record
 * Looks for kritano-verify=<token> in:
 * 1. Root domain TXT records
 * 2. _kritano.<domain> TXT records
 */
export declare function verifyDnsTxt(domain: string, expectedToken: string): Promise<VerificationResult>;
/**
 * Verify domain ownership via file upload
 * Fetches /.well-known/kritano-verify.txt and checks content
 */
export declare function verifyFile(domain: string, expectedToken: string): Promise<VerificationResult>;
/**
 * Attempt to verify a domain using the specified method
 * Updates the database on success
 */
export declare function attemptVerification(organizationId: string, domainId: string, method: 'dns' | 'file'): Promise<VerificationResult>;
/**
 * Get the current verification status of a domain
 */
export declare function getVerificationStatus(organizationId: string, domainId: string): Promise<{
    verified: boolean;
    method: string | null;
    verifiedAt: Date | null;
    hasToken: boolean;
    attempts: number;
}>;
/**
 * Check if a domain (by hostname) is verified for an organization
 * Used when starting an audit to determine if consent is required
 */
export declare function isDomainVerifiedForOrg(organizationId: string, hostname: string): Promise<{
    verified: boolean;
    domainId?: string;
}>;
/**
 * Revoke domain verification (for admin use or testing)
 */
export declare function revokeVerification(organizationId: string, domainId: string): Promise<void>;
export interface DomainAuditSettings {
    verified: boolean;
    ignoreRobotsTxt: boolean;
    rateLimitProfile: string | null;
    sendVerificationHeader: boolean;
    verificationToken: string | null;
}
/**
 * Get domain bypass settings for audit worker
 * Used to apply custom settings for verified domains
 */
export declare function getDomainSettingsForAudit(organizationId: string, hostname: string): Promise<DomainAuditSettings | null>;
//# sourceMappingURL=domain-verification.service.d.ts.map