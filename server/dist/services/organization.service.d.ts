import { Pool } from 'pg';
import type { Organization, OrganizationWithMembership, OrganizationMember, OrganizationMemberWithUser, OrganizationInvitation, OrganizationAuditLogEntry, Subscription, TierLimits, CreateOrganizationInput, UpdateOrganizationInput, InviteMemberInput, OrgRole, SubscriptionTier } from '../types/organization.types.js';
export declare function setPool(dbPool: Pool): void;
/**
 * Create a new organization
 */
export declare function createOrganization(userId: string, input: CreateOrganizationInput): Promise<Organization>;
/**
 * Get organization by ID
 */
export declare function getOrganizationById(organizationId: string): Promise<Organization | null>;
/**
 * Get organization by slug
 */
export declare function getOrganizationBySlug(slug: string): Promise<Organization | null>;
/**
 * Get all organizations for a user with their role and subscription
 */
export declare function getUserOrganizations(userId: string): Promise<OrganizationWithMembership[]>;
/**
 * Update organization
 */
export declare function updateOrganization(organizationId: string, input: UpdateOrganizationInput): Promise<Organization>;
/**
 * Delete organization
 */
export declare function deleteOrganization(organizationId: string): Promise<void>;
/**
 * Transfer ownership to another member
 */
export declare function transferOwnership(organizationId: string, currentOwnerId: string, newOwnerId: string): Promise<void>;
/**
 * Get user's membership in an organization
 */
export declare function getMembership(organizationId: string, userId: string): Promise<OrganizationMember | null>;
/**
 * Get all members of an organization
 */
export declare function getOrganizationMembers(organizationId: string): Promise<OrganizationMemberWithUser[]>;
/**
 * Update member role
 */
export declare function updateMemberRole(organizationId: string, userId: string, newRole: OrgRole): Promise<OrganizationMember>;
/**
 * Remove member from organization
 */
export declare function removeMember(organizationId: string, userId: string): Promise<void>;
/**
 * Leave organization (self-remove)
 */
export declare function leaveOrganization(organizationId: string, userId: string): Promise<void>;
/**
 * Create invitation
 */
export declare function createInvitation(organizationId: string, invitedBy: string, input: InviteMemberInput): Promise<OrganizationInvitation>;
/**
 * Get invitation by token
 */
export declare function getInvitationByToken(token: string): Promise<(OrganizationInvitation & {
    organization_name: string;
    inviter_name: string;
}) | null>;
/**
 * Get pending invitations for an organization
 */
export declare function getOrganizationInvitations(organizationId: string): Promise<OrganizationInvitation[]>;
/**
 * Accept invitation
 */
export declare function acceptInvitation(token: string, userId: string): Promise<OrganizationMember>;
/**
 * Decline invitation
 */
export declare function declineInvitation(token: string): Promise<void>;
/**
 * Cancel/delete invitation
 */
export declare function cancelInvitation(invitationId: string, organizationId?: string): Promise<void>;
export declare const getMembersWithUsers: typeof getOrganizationMembers;
export declare const getPendingInvitations: typeof getOrganizationInvitations;
/**
 * Get subscription for organization
 */
export declare function getSubscription(organizationId: string): Promise<Subscription | null>;
/**
 * Get tier limits
 */
export declare function getTierLimits(tier: SubscriptionTier): Promise<TierLimits | null>;
/**
 * Get organization's tier limits
 */
export declare function getOrganizationLimits(organizationId: string): Promise<TierLimits | null>;
/**
 * Check if organization can add more seats
 */
export declare function checkSeatLimit(organizationId: string): Promise<boolean>;
/**
 * Check if organization can add more domains
 */
export declare function checkDomainLimit(organizationId: string): Promise<boolean>;
/**
 * Check if organization can create more audits this period
 */
export declare function checkAuditLimit(organizationId: string): Promise<boolean>;
/**
 * Get current usage for organization
 */
export declare function getCurrentUsage(organizationId: string): Promise<{
    audits: number;
    domains: number;
    domainsUsed: string[];
    members: number;
    apiRequests: number;
    periodStart: string;
    periodEnd: string;
    competitorDomains: number;
    competitorDomainsUsed: string[];
}>;
/**
 * Check if organization can audit a new domain
 * Returns true if the domain has been audited before or if under the limit
 */
export declare function canAuditDomain(organizationId: string, url: string): Promise<{
    allowed: boolean;
    reason?: string;
    domainsUsed: number;
    maxDomains: number | null;
}>;
/**
 * Log organization activity
 */
export declare function logActivity(organizationId: string, userId: string | null, action: string, resourceType?: string | null, resourceId?: string | null, details?: Record<string, unknown>, ipAddress?: string | null, userAgent?: string | null): Promise<void>;
/**
 * Get audit log for organization
 */
export declare function getAuditLog(organizationId: string, options?: {
    limit?: number;
    offset?: number;
}): Promise<{
    entries: OrganizationAuditLogEntry[];
    total: number;
}>;
//# sourceMappingURL=organization.service.d.ts.map