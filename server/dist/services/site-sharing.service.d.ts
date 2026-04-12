import { Pool } from 'pg';
export type SitePermission = 'viewer' | 'editor' | 'admin';
export interface SiteShare {
    id: string;
    site_id: string;
    user_id: string;
    permission: SitePermission;
    invited_by: string | null;
    invited_at: Date;
    accepted_at: Date | null;
    created_at: Date;
    user_email?: string;
    user_name?: string;
}
export interface SiteInvitation {
    id: string;
    site_id: string;
    email: string;
    permission: SitePermission;
    invited_by: string;
    token: string;
    status: 'pending' | 'accepted' | 'declined' | 'expired';
    expires_at: Date;
    created_at: Date;
    responded_at: Date | null;
    inviter_name?: string;
    site_name?: string;
    site_domain?: string;
}
export interface CreateShareInput {
    siteId: string;
    userId: string;
    permission: SitePermission;
    invitedBy: string;
}
export interface CreateInvitationInput {
    siteId: string;
    email: string;
    permission: SitePermission;
    invitedBy: string;
}
export declare function setPool(dbPool: Pool): void;
/**
 * Get all shares for a site
 */
export declare function getSiteShares(siteId: string): Promise<SiteShare[]>;
/**
 * Get a user's shares (sites shared with them)
 */
export declare function getUserShares(userId: string): Promise<(SiteShare & {
    site_name: string;
    site_domain: string;
})[]>;
/**
 * Create a direct share (for existing users)
 */
export declare function createShare(input: CreateShareInput): Promise<SiteShare>;
/**
 * Update a share's permission
 */
export declare function updateSharePermission(shareId: string, permission: SitePermission): Promise<SiteShare>;
/**
 * Remove a share
 */
export declare function removeShare(shareId: string): Promise<void>;
/**
 * Remove share by site and user
 */
export declare function removeShareByUser(siteId: string, userId: string): Promise<void>;
/**
 * Get all pending invitations for a site
 */
export declare function getSiteInvitations(siteId: string): Promise<SiteInvitation[]>;
/**
 * Get invitation by token
 */
export declare function getInvitationByToken(token: string): Promise<SiteInvitation | null>;
/**
 * Create an invitation
 */
export declare function createInvitation(input: CreateInvitationInput): Promise<SiteInvitation>;
/**
 * Accept an invitation
 */
export declare function acceptInvitation(token: string, userId: string): Promise<SiteShare>;
/**
 * Decline an invitation
 */
export declare function declineInvitation(token: string): Promise<void>;
/**
 * Cancel an invitation
 */
export declare function cancelInvitation(invitationId: string, siteId: string): Promise<void>;
/**
 * Get pending invitations for a user's email
 */
export declare function getPendingInvitationsForEmail(email: string): Promise<SiteInvitation[]>;
/**
 * Find user by email
 */
export declare function findUserByEmail(email: string): Promise<{
    id: string;
    email: string;
    name: string;
} | null>;
/**
 * Share with user by email (creates invitation if user doesn't exist, direct share if they do)
 */
export declare function shareByEmail(siteId: string, email: string, permission: SitePermission, invitedBy: string): Promise<{
    type: 'share' | 'invitation';
    data: SiteShare | SiteInvitation;
}>;
//# sourceMappingURL=site-sharing.service.d.ts.map