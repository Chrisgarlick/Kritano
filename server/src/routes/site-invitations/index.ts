import { Router, Request, Response } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import {
  getInvitationByToken,
  acceptInvitation,
  declineInvitation,
  getPendingInvitationsForEmail,
} from '../../services/site-sharing.service.js';

const router = Router();

/**
 * GET /api/site-invitations/:token
 * Get invitation details by token (public)
 */
router.get('/:token', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;

    const invitation = await getInvitationByToken(token);

    if (!invitation) {
      res.status(404).json({ error: 'Invitation not found' });
      return;
    }

    // Check if expired
    if (new Date(invitation.expires_at) < new Date()) {
      res.status(410).json({
        error: 'Invitation has expired',
        code: 'INVITATION_EXPIRED',
      });
      return;
    }

    if (invitation.status !== 'pending') {
      res.status(410).json({
        error: `Invitation has already been ${invitation.status}`,
        code: 'INVITATION_NOT_PENDING',
      });
      return;
    }

    res.json({
      invitation: {
        id: invitation.id,
        email: invitation.email,
        permission: invitation.permission,
        siteName: invitation.site_name,
        siteDomain: invitation.site_domain,
        invitedBy: invitation.inviter_name,
        expiresAt: invitation.expires_at,
        createdAt: invitation.created_at,
      },
    });
  } catch (error: unknown) {
    console.error('Get invitation error:', error);
    res.status(500).json({ error: 'Failed to get invitation' });
  }
});

/**
 * POST /api/site-invitations/:token/accept
 * Accept an invitation (requires auth)
 */
router.post('/:token/accept', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;
    const userId = req.user!.id;

    const share = await acceptInvitation(token, userId);

    res.json({
      success: true,
      message: 'Invitation accepted! You now have access to this site.',
      share: {
        id: share.id,
        siteId: share.site_id,
        permission: share.permission,
      },
    });
  } catch (error: unknown) {
    console.error('Accept invitation error:', error);
    const message = error instanceof Error ? error.message : 'Failed to accept invitation';
    res.status(400).json({ error: message });
  }
});

/**
 * POST /api/site-invitations/:token/decline
 * Decline an invitation (public - no auth required)
 */
router.post('/:token/decline', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;

    await declineInvitation(token);

    res.json({
      success: true,
      message: 'Invitation declined.',
    });
  } catch (error: unknown) {
    console.error('Decline invitation error:', error);
    const message = error instanceof Error ? error.message : 'Failed to decline invitation';
    res.status(400).json({ error: message });
  }
});

/**
 * GET /api/site-invitations/pending/me
 * Get pending invitations for the current user's email
 */
router.get('/pending/me', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userEmail = req.user!.email;

    const invitations = await getPendingInvitationsForEmail(userEmail);

    res.json({
      invitations: invitations.map(i => ({
        id: i.id,
        token: i.token,
        permission: i.permission,
        siteName: i.site_name,
        siteDomain: i.site_domain,
        invitedBy: i.inviter_name,
        expiresAt: i.expires_at,
        createdAt: i.created_at,
      })),
    });
  } catch (error: unknown) {
    console.error('Get pending invitations error:', error);
    res.status(500).json({ error: 'Failed to get pending invitations' });
  }
});

export default router;
