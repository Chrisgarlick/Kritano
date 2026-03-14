import { Pool } from 'pg';
import crypto from 'crypto';
import { getSiteOwnerTierLimits } from './site.service.js';
import { recalculateScore } from './lead-scoring.service.js';

// Types
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
  // Joined fields
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
  // Joined fields
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

// Database pool
let pool: Pool;

export function setPool(dbPool: Pool): void {
  pool = dbPool;
}

// =============================================
// MEMBER LIMIT HELPERS
// =============================================

/**
 * Check if the site has room for another member (share or invitation).
 * Counts accepted shares + pending invitations against the site owner's tier limit.
 */
async function checkMemberLimit(siteId: string): Promise<void> {
  const tierLimits = await getSiteOwnerTierLimits(siteId);
  const maxMembers = tierLimits?.max_members_per_site as number | null | undefined;

  // null or undefined = unlimited (enterprise)
  if (maxMembers === null || maxMembers === undefined) return;

  const countResult = await pool.query<{ count: string }>(
    `SELECT (
       (SELECT COUNT(*) FROM site_shares WHERE site_id = $1) +
       (SELECT COUNT(*) FROM site_invitations WHERE site_id = $1 AND status = 'pending')
     ) as count`,
    [siteId]
  );
  const currentCount = parseInt(countResult.rows[0].count, 10);

  if (currentCount >= maxMembers) {
    throw new Error(`Member limit reached (${maxMembers}). Upgrade to add more members.`);
  }
}

// =============================================
// SITE SHARES
// =============================================

/**
 * Get all shares for a site
 */
export async function getSiteShares(siteId: string): Promise<SiteShare[]> {
  const result = await pool.query<SiteShare & { user_email: string; user_name: string }>(
    `SELECT ss.*,
            u.email as user_email,
            COALESCE(u.first_name || ' ' || u.last_name, u.email) as user_name
     FROM site_shares ss
     JOIN users u ON u.id = ss.user_id
     WHERE ss.site_id = $1
     ORDER BY ss.created_at`,
    [siteId]
  );
  return result.rows;
}

/**
 * Get a user's shares (sites shared with them)
 */
export async function getUserShares(userId: string): Promise<(SiteShare & { site_name: string; site_domain: string })[]> {
  const result = await pool.query<SiteShare & { site_name: string; site_domain: string }>(
    `SELECT ss.*, s.name as site_name, s.domain as site_domain
     FROM site_shares ss
     JOIN sites s ON s.id = ss.site_id
     WHERE ss.user_id = $1 AND ss.accepted_at IS NOT NULL
     ORDER BY ss.created_at DESC`,
    [userId]
  );
  return result.rows;
}

/**
 * Create a direct share (for existing users)
 */
export async function createShare(input: CreateShareInput): Promise<SiteShare> {
  const { siteId, userId, permission, invitedBy } = input;

  // Check member limit based on site owner's tier
  await checkMemberLimit(siteId);

  // Check if share already exists
  const existing = await pool.query(
    `SELECT id FROM site_shares WHERE site_id = $1 AND user_id = $2`,
    [siteId, userId]
  );

  if (existing.rows.length > 0) {
    throw new Error('User already has access to this site');
  }

  // Check if user is the owner
  const ownerCheck = await pool.query(
    `SELECT id FROM sites WHERE id = $1 AND owner_id = $2`,
    [siteId, userId]
  );

  if (ownerCheck.rows.length > 0) {
    throw new Error('Cannot share site with its owner');
  }

  const result = await pool.query<SiteShare>(
    `INSERT INTO site_shares (site_id, user_id, permission, invited_by, accepted_at)
     VALUES ($1, $2, $3, $4, NOW())
     RETURNING *`,
    [siteId, userId, permission, invitedBy]
  );

  // CRM: Recalculate score for the site owner (team member added signal)
  if (invitedBy) {
    recalculateScore(invitedBy).catch(err => console.error('CRM score recalc failed:', err));
  }

  return result.rows[0];
}

/**
 * Update a share's permission
 */
export async function updateSharePermission(
  shareId: string,
  permission: SitePermission
): Promise<SiteShare> {
  const result = await pool.query<SiteShare>(
    `UPDATE site_shares
     SET permission = $1
     WHERE id = $2
     RETURNING *`,
    [permission, shareId]
  );

  if (result.rows.length === 0) {
    throw new Error('Share not found');
  }

  return result.rows[0];
}

/**
 * Remove a share
 */
export async function removeShare(shareId: string): Promise<void> {
  const result = await pool.query(
    `DELETE FROM site_shares WHERE id = $1 RETURNING id`,
    [shareId]
  );

  if (result.rows.length === 0) {
    throw new Error('Share not found');
  }
}

/**
 * Remove share by site and user
 */
export async function removeShareByUser(siteId: string, userId: string): Promise<void> {
  await pool.query(
    `DELETE FROM site_shares WHERE site_id = $1 AND user_id = $2`,
    [siteId, userId]
  );
}

// =============================================
// SITE INVITATIONS
// =============================================

/**
 * Get all pending invitations for a site
 */
export async function getSiteInvitations(siteId: string): Promise<SiteInvitation[]> {
  const result = await pool.query<SiteInvitation & { inviter_name: string }>(
    `SELECT si.*,
            COALESCE(u.first_name || ' ' || u.last_name, u.email) as inviter_name
     FROM site_invitations si
     JOIN users u ON u.id = si.invited_by
     WHERE si.site_id = $1
     ORDER BY si.created_at DESC`,
    [siteId]
  );
  return result.rows;
}

/**
 * Get invitation by token
 */
export async function getInvitationByToken(token: string): Promise<SiteInvitation | null> {
  const result = await pool.query<SiteInvitation & { site_name: string; site_domain: string; inviter_name: string }>(
    `SELECT si.*,
            s.name as site_name,
            s.domain as site_domain,
            COALESCE(u.first_name || ' ' || u.last_name, u.email) as inviter_name
     FROM site_invitations si
     JOIN sites s ON s.id = si.site_id
     JOIN users u ON u.id = si.invited_by
     WHERE si.token = $1`,
    [token]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
}

/**
 * Create an invitation
 */
export async function createInvitation(input: CreateInvitationInput): Promise<SiteInvitation> {
  const { siteId, email, permission, invitedBy } = input;

  // Check member limit based on site owner's tier
  await checkMemberLimit(siteId);

  // Check if user is already a member or owner
  const existingAccess = await pool.query(
    `SELECT 1 FROM sites WHERE id = $1 AND owner_id = (SELECT id FROM users WHERE email = $2)
     UNION ALL
     SELECT 1 FROM site_shares ss JOIN users u ON u.id = ss.user_id WHERE ss.site_id = $1 AND u.email = $2`,
    [siteId, email.toLowerCase()]
  );

  if (existingAccess.rows.length > 0) {
    throw new Error('User already has access to this site');
  }

  // Check for pending invitation
  const existingInvite = await pool.query(
    `SELECT id FROM site_invitations
     WHERE site_id = $1 AND email = $2 AND status = 'pending'`,
    [siteId, email.toLowerCase()]
  );

  if (existingInvite.rows.length > 0) {
    throw new Error('Invitation already sent to this email');
  }

  // Generate secure token
  const token = crypto.randomBytes(32).toString('hex');

  // Set expiration (7 days)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const result = await pool.query<SiteInvitation>(
    `INSERT INTO site_invitations (site_id, email, permission, invited_by, token, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [siteId, email.toLowerCase(), permission, invitedBy, token, expiresAt]
  );

  return result.rows[0];
}

/**
 * Accept an invitation
 */
export async function acceptInvitation(token: string, userId: string): Promise<SiteShare> {
  // Get invitation
  const invitation = await getInvitationByToken(token);

  if (!invitation) {
    throw new Error('Invitation not found');
  }

  if (invitation.status !== 'pending') {
    throw new Error(`Invitation has already been ${invitation.status}`);
  }

  if (new Date(invitation.expires_at) < new Date()) {
    // Mark as expired
    await pool.query(
      `UPDATE site_invitations SET status = 'expired', responded_at = NOW() WHERE id = $1`,
      [invitation.id]
    );
    throw new Error('Invitation has expired');
  }

  // Verify the accepting user's email matches
  const userCheck = await pool.query<{ email: string }>(
    `SELECT email FROM users WHERE id = $1`,
    [userId]
  );

  if (userCheck.rows.length === 0) {
    throw new Error('User not found');
  }

  if (userCheck.rows[0].email.toLowerCase() !== invitation.email.toLowerCase()) {
    throw new Error('This invitation was sent to a different email address');
  }

  // Create share
  const share = await createShare({
    siteId: invitation.site_id,
    userId,
    permission: invitation.permission,
    invitedBy: invitation.invited_by,
  });

  // Update invitation status
  await pool.query(
    `UPDATE site_invitations SET status = 'accepted', responded_at = NOW() WHERE id = $1`,
    [invitation.id]
  );

  return share;
}

/**
 * Decline an invitation
 */
export async function declineInvitation(token: string): Promise<void> {
  const result = await pool.query(
    `UPDATE site_invitations
     SET status = 'declined', responded_at = NOW()
     WHERE token = $1 AND status = 'pending'
     RETURNING id`,
    [token]
  );

  if (result.rows.length === 0) {
    throw new Error('Invitation not found or already responded');
  }
}

/**
 * Cancel an invitation
 */
export async function cancelInvitation(invitationId: string, siteId: string): Promise<void> {
  const result = await pool.query(
    `DELETE FROM site_invitations
     WHERE id = $1 AND site_id = $2 AND status = 'pending'
     RETURNING id`,
    [invitationId, siteId]
  );

  if (result.rows.length === 0) {
    throw new Error('Invitation not found or already responded');
  }
}

/**
 * Get pending invitations for a user's email
 */
export async function getPendingInvitationsForEmail(email: string): Promise<SiteInvitation[]> {
  const result = await pool.query<SiteInvitation & { site_name: string; site_domain: string; inviter_name: string }>(
    `SELECT si.*,
            s.name as site_name,
            s.domain as site_domain,
            COALESCE(u.first_name || ' ' || u.last_name, u.email) as inviter_name
     FROM site_invitations si
     JOIN sites s ON s.id = si.site_id
     JOIN users u ON u.id = si.invited_by
     WHERE si.email = $1 AND si.status = 'pending' AND si.expires_at > NOW()
     ORDER BY si.created_at DESC`,
    [email.toLowerCase()]
  );

  return result.rows;
}

// =============================================
// USER LOOKUP (for share by email)
// =============================================

/**
 * Find user by email
 */
export async function findUserByEmail(email: string): Promise<{ id: string; email: string; name: string } | null> {
  const result = await pool.query<{ id: string; email: string; first_name: string; last_name: string }>(
    `SELECT id, email, first_name, last_name FROM users WHERE email = $1`,
    [email.toLowerCase()]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const user = result.rows[0];
  return {
    id: user.id,
    email: user.email,
    name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
  };
}

/**
 * Share with user by email (creates invitation if user doesn't exist, direct share if they do)
 */
export async function shareByEmail(
  siteId: string,
  email: string,
  permission: SitePermission,
  invitedBy: string
): Promise<{ type: 'share' | 'invitation'; data: SiteShare | SiteInvitation }> {
  const user = await findUserByEmail(email);

  if (user) {
    // User exists - create direct share
    const share = await createShare({
      siteId,
      userId: user.id,
      permission,
      invitedBy,
    });
    return { type: 'share', data: share };
  } else {
    // User doesn't exist - create invitation
    const invitation = await createInvitation({
      siteId,
      email,
      permission,
      invitedBy,
    });
    return { type: 'invitation', data: invitation };
  }
}
