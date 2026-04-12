"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invitationsRouter = void 0;
const express_1 = require("express");
const auth_middleware_js_1 = require("../../middleware/auth.middleware.js");
const organization_service_js_1 = require("../../services/organization.service.js");
const router = (0, express_1.Router)();
/**
 * GET /api/invitations/:token
 * Get invitation details by token
 */
router.get('/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const invitation = await (0, organization_service_js_1.getInvitationByToken)(token);
        if (!invitation) {
            res.status(404).json({ error: 'Invitation not found or expired', code: 'INVITE_NOT_FOUND' });
            return;
        }
        res.json({
            invitation: {
                id: invitation.id,
                email: invitation.email,
                role: invitation.role,
                organizationId: invitation.organization_id,
                expiresAt: invitation.expires_at,
            },
        });
    }
    catch (error) {
        console.error('Get invitation error:', error);
        res.status(500).json({ error: 'Failed to get invitation', code: 'GET_INVITE_FAILED' });
    }
});
/**
 * POST /api/invitations/:token/accept
 * Accept an invitation (requires authentication)
 */
router.post('/:token/accept', auth_middleware_js_1.authenticate, async (req, res) => {
    try {
        const { token } = req.params;
        const userId = req.user.id;
        const membership = await (0, organization_service_js_1.acceptInvitation)(token, userId);
        // Log activity
        await (0, organization_service_js_1.logActivity)(membership.organization_id, userId, 'member.joined', 'member', membership.id, {}, req.ip, req.get('user-agent'));
        res.json({
            message: 'Invitation accepted',
            membership: {
                id: membership.id,
                organizationId: membership.organization_id,
                role: membership.role,
            },
        });
    }
    catch (error) {
        console.error('Accept invitation error:', error);
        const message = error instanceof Error ? error.message : 'Failed to accept invitation';
        res.status(400).json({ error: message, code: 'ACCEPT_INVITE_FAILED' });
    }
});
/**
 * POST /api/invitations/:token/decline
 * Decline an invitation
 */
router.post('/:token/decline', async (req, res) => {
    try {
        const { token } = req.params;
        await (0, organization_service_js_1.declineInvitation)(token);
        res.json({ message: 'Invitation declined' });
    }
    catch (error) {
        console.error('Decline invitation error:', error);
        const message = error instanceof Error ? error.message : 'Failed to decline invitation';
        res.status(400).json({ error: message, code: 'DECLINE_INVITE_FAILED' });
    }
});
exports.invitationsRouter = router;
//# sourceMappingURL=index.js.map