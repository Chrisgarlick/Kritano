import { Pool } from 'pg';
import type { OrganizationDomain, CreateDomainInput } from '../types/organization.types.js';
export declare function setPool(dbPool: Pool): void;
/**
 * Add a domain to an organization
 */
export declare function addDomain(organizationId: string, userId: string, input: CreateDomainInput): Promise<OrganizationDomain>;
/**
 * Get all domains for an organization
 */
export declare function getOrganizationDomains(organizationId: string): Promise<OrganizationDomain[]>;
/**
 * Get domain by ID
 */
export declare function getDomainById(domainId: string): Promise<OrganizationDomain | null>;
/**
 * Update domain settings
 */
export declare function updateDomain(domainId: string, updates: {
    include_subdomains?: boolean;
    ignore_robots_txt?: boolean;
    rate_limit_profile?: 'conservative' | 'normal' | 'aggressive';
    send_verification_header?: boolean;
}): Promise<OrganizationDomain>;
/**
 * Remove domain from organization
 */
export declare function removeDomain(domainId: string): Promise<void>;
/**
 * Lock domain after first audit (FREE tier)
 * Called when an audit is started on a FREE tier organization
 */
export declare function lockDomainForFreeTier(organizationId: string, domain: string): Promise<void>;
/**
 * Request domain change for FREE tier
 * The new domain will become active on the next billing cycle
 */
export declare function requestDomainChange(organizationId: string, currentDomainId: string, newDomain: string): Promise<OrganizationDomain>;
/**
 * Cancel pending domain change
 */
export declare function cancelDomainChange(domainId: string): Promise<OrganizationDomain>;
/**
 * Process domain changes at start of new billing period
 * Should be called by a scheduled job on the 1st of each month
 */
export declare function processMonthlyDomainResets(): Promise<number>;
/**
 * Check if a URL is allowed for audit based on organization's domains
 */
export declare function isUrlAllowedForAudit(organizationId: string, url: string): Promise<{
    allowed: boolean;
    reason?: string;
    matchedDomain?: OrganizationDomain;
}>;
//# sourceMappingURL=domain.service.d.ts.map