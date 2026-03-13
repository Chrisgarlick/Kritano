import { Router } from 'express';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middleware/auth.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import {
  loadOrganization,
  requirePermission,
  requireRole,
  requireOwner,
  type OrganizationRequest,
} from '../../middleware/organization.middleware.js';
import {
  createOrganization,
  getUserOrganizations,
  getOrganizationById,
  updateOrganization,
  deleteOrganization,
  getMembersWithUsers,
  updateMemberRole,
  removeMember,
  createInvitation,
  getPendingInvitations,
  acceptInvitation,
  declineInvitation,
  cancelInvitation,
  getSubscription,
  getOrganizationLimits,
  getCurrentUsage,
  logActivity,
} from '../../services/organization.service.js';
import {
  addDomain,
  getOrganizationDomains,
  getDomainById,
  updateDomain,
  removeDomain,
  requestDomainChange,
  cancelDomainChange,
} from '../../services/domain.service.js';
import {
  generateVerificationToken,
  attemptVerification,
  getVerificationStatus,
} from '../../services/domain-verification.service.js';
import {
  SCANNER_INFO,
  RATE_LIMIT_PROFILES,
} from '../../constants/consent.constants.js';

const router = Router();

// =============================================
// Validation Schemas
// =============================================

const createOrgSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens').optional(),
});

const brandingSchema = z.object({
  companyName: z.string().max(100).optional(),
  logoUrl: z.string().url().optional(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a hex color').optional(),
  secondaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a hex color').optional(),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a hex color').optional(),
  footerText: z.string().max(200).optional(),
}).optional();

const updateOrgSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens').optional(),
  logo_url: z.string().url().nullable().optional(),
  settings: z.object({
    defaultAuditChecks: z.array(z.string()).optional(),
    requireDomainVerification: z.boolean().optional(),
    allowMemberInvites: z.boolean().optional(),
    auditNotifications: z.boolean().optional(),
    branding: brandingSchema,
  }).optional(),
});

const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'member', 'viewer']),
});

const updateMemberRoleSchema = z.object({
  role: z.enum(['admin', 'member', 'viewer']),
});

const addDomainSchema = z.object({
  domain: z.string().min(3).max(255),
  include_subdomains: z.boolean().optional(),
});

const updateDomainSchema = z.object({
  include_subdomains: z.boolean().optional(),
  // Bypass settings (only for verified domains)
  ignore_robots_txt: z.boolean().optional(),
  rate_limit_profile: z.enum(['conservative', 'normal', 'aggressive']).optional(),
  send_verification_header: z.boolean().optional(),
});

const requestDomainChangeSchema = z.object({
  newDomain: z.string().min(3).max(255),
});

const verifyDomainSchema = z.object({
  method: z.enum(['dns', 'file']),
});

// =============================================
// Scanner Info Route (must be before parameterized routes)
// =============================================

/**
 * GET /api/organizations/scanner-info
 * Get scanner identification info for whitelisting
 */
router.get(
  '/scanner-info',
  authenticate,
  async (_req: Request, res: Response): Promise<void> => {
    try {
      res.json({
        userAgent: SCANNER_INFO.USER_AGENT,
        botInfoUrl: SCANNER_INFO.BOT_INFO_URL,
        ips: SCANNER_INFO.IPS,
        verificationHeader: SCANNER_INFO.VERIFICATION_HEADER,
        rateLimitProfiles: Object.entries(RATE_LIMIT_PROFILES).map(([key, profile]) => ({
          id: key,
          label: profile.label,
          description: profile.description,
        })),
      });
    } catch (error) {
      console.error('Get scanner info error:', error);
      res.status(500).json({ error: 'Failed to get scanner info', code: 'GET_SCANNER_INFO_FAILED' });
    }
  }
);

// =============================================
// Organization CRUD Routes
// =============================================

/**
 * GET /api/organizations
 * List user's organizations
 */
router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const organizations = await getUserOrganizations(userId);
    res.json({ organizations });
  } catch (error) {
    console.error('List organizations error:', error);
    res.status(500).json({ error: 'Failed to list organizations', code: 'LIST_ORGS_FAILED' });
  }
});

/**
 * POST /api/organizations
 * Create a new organization
 */
router.post(
  '/',
  authenticate,
  validateBody(createOrgSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { name, slug } = req.body as z.infer<typeof createOrgSchema>;

      const organization = await createOrganization(userId, { name, slug });

      // Log activity
      await logActivity(organization.id, userId, 'organization.created', 'organization', organization.id, {
        name: organization.name,
      }, req.ip, req.get('user-agent'));

      res.status(201).json({ organization });
    } catch (error) {
      console.error('Create organization error:', error);
      const message = error instanceof Error ? error.message : 'Failed to create organization';
      res.status(400).json({ error: message, code: 'CREATE_ORG_FAILED' });
    }
  }
);

/**
 * GET /api/organizations/:organizationId
 * Get organization details
 */
router.get(
  '/:organizationId',
  authenticate,
  loadOrganization,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const orgReq = req as OrganizationRequest;
      const organization = orgReq.organization!;
      const membership = orgReq.membership!;
      const subscription = orgReq.subscription;
      const tierLimits = orgReq.tierLimits;

      // Get member count
      const members = await getMembersWithUsers(organization.id);

      // Get domain count
      const domains = await getOrganizationDomains(organization.id);

      // Get current usage
      const usage = await getCurrentUsage(organization.id);

      res.json({
        organization,
        membership: {
          role: membership.role,
          joinedAt: membership.joined_at,
        },
        subscription,
        tierLimits,
        stats: {
          memberCount: members.length,
          domainCount: domains.length,
          currentUsage: usage,
        },
      });
    } catch (error) {
      console.error('Get organization error:', error);
      res.status(500).json({ error: 'Failed to get organization', code: 'GET_ORG_FAILED' });
    }
  }
);

/**
 * PATCH /api/organizations/:organizationId
 * Update organization settings
 */
router.patch(
  '/:organizationId',
  authenticate,
  loadOrganization,
  requirePermission('org:write'),
  validateBody(updateOrgSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const orgReq = req as OrganizationRequest;
      const organizationId = orgReq.organizationId!;
      const userId = orgReq.user!.id;
      const updates = req.body as z.infer<typeof updateOrgSchema>;

      // Tier gate: branding settings require white_label (agency+)
      if (updates.settings?.branding) {
        const limits = await getOrganizationLimits(organizationId);
        if (!limits?.white_label) {
          res.status(403).json({
            error: 'Organization branding requires Agency plan or higher',
            code: 'TIER_WHITE_LABEL_DENIED',
          });
          return;
        }
      }

      const organization = await updateOrganization(organizationId, updates);

      // Log activity
      await logActivity(organizationId, userId, 'organization.updated', 'organization', organizationId, {
        updates: Object.keys(updates),
      }, req.ip, req.get('user-agent'));

      res.json({ organization });
    } catch (error) {
      console.error('Update organization error:', error);
      const message = error instanceof Error ? error.message : 'Failed to update organization';
      res.status(400).json({ error: message, code: 'UPDATE_ORG_FAILED' });
    }
  }
);

/**
 * DELETE /api/organizations/:organizationId
 * Delete organization (owner only)
 */
router.delete(
  '/:organizationId',
  authenticate,
  loadOrganization,
  requireOwner,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const orgReq = req as OrganizationRequest;
      const organizationId = orgReq.organizationId!;
      const userId = orgReq.user!.id;

      // Check if user has other organizations (can't delete last one)
      const userOrgs = await getUserOrganizations(userId);
      if (userOrgs.length <= 1) {
        res.status(400).json({
          error: 'Cannot delete your only organization',
          code: 'LAST_ORG_ERROR',
        });
        return;
      }

      await deleteOrganization(organizationId);

      res.json({ message: 'Organization deleted' });
    } catch (error) {
      console.error('Delete organization error:', error);
      res.status(500).json({ error: 'Failed to delete organization', code: 'DELETE_ORG_FAILED' });
    }
  }
);

// =============================================
// Team Member Routes
// =============================================

/**
 * GET /api/organizations/:organizationId/members
 * List organization members
 */
router.get(
  '/:organizationId/members',
  authenticate,
  loadOrganization,
  requirePermission('team:read'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const orgReq = req as OrganizationRequest;
      const members = await getMembersWithUsers(orgReq.organizationId!);
      res.json({ members });
    } catch (error) {
      console.error('List members error:', error);
      res.status(500).json({ error: 'Failed to list members', code: 'LIST_MEMBERS_FAILED' });
    }
  }
);

/**
 * POST /api/organizations/:organizationId/invitations
 * Invite a new member
 */
router.post(
  '/:organizationId/invitations',
  authenticate,
  loadOrganization,
  requirePermission('team:invite'),
  validateBody(inviteMemberSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const orgReq = req as OrganizationRequest;
      const organizationId = orgReq.organizationId!;
      const userId = orgReq.user!.id;
      const { email, role } = req.body as z.infer<typeof inviteMemberSchema>;

      const invitation = await createInvitation(organizationId, userId, { email, role });

      // Log activity
      await logActivity(organizationId, userId, 'member.invited', 'invitation', invitation.id, {
        email,
        role,
      }, req.ip, req.get('user-agent'));

      res.status(201).json({
        invitation: {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          expiresAt: invitation.expires_at,
        },
      });
    } catch (error) {
      console.error('Create invitation error:', error);
      const message = error instanceof Error ? error.message : 'Failed to create invitation';
      res.status(400).json({ error: message, code: 'INVITE_FAILED' });
    }
  }
);

/**
 * GET /api/organizations/:organizationId/invitations
 * List pending invitations
 */
router.get(
  '/:organizationId/invitations',
  authenticate,
  loadOrganization,
  requirePermission('team:read'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const orgReq = req as OrganizationRequest;
      const invitations = await getPendingInvitations(orgReq.organizationId!);
      res.json({ invitations });
    } catch (error) {
      console.error('List invitations error:', error);
      res.status(500).json({ error: 'Failed to list invitations', code: 'LIST_INVITES_FAILED' });
    }
  }
);

/**
 * DELETE /api/organizations/:organizationId/invitations/:invitationId
 * Cancel a pending invitation
 */
router.delete(
  '/:organizationId/invitations/:invitationId',
  authenticate,
  loadOrganization,
  requirePermission('team:invite'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const orgReq = req as OrganizationRequest;
      const { invitationId } = req.params;
      const userId = orgReq.user!.id;

      await cancelInvitation(invitationId, orgReq.organizationId!);

      // Log activity
      await logActivity(orgReq.organizationId!, userId, 'invitation.cancelled', 'invitation', invitationId, {},
        req.ip, req.get('user-agent'));

      res.json({ message: 'Invitation cancelled' });
    } catch (error) {
      console.error('Cancel invitation error:', error);
      const message = error instanceof Error ? error.message : 'Failed to cancel invitation';
      res.status(400).json({ error: message, code: 'CANCEL_INVITE_FAILED' });
    }
  }
);

/**
 * PATCH /api/organizations/:organizationId/members/:memberId/role
 * Update member role
 */
router.patch(
  '/:organizationId/members/:memberId/role',
  authenticate,
  loadOrganization,
  requirePermission('team:role'),
  validateBody(updateMemberRoleSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const orgReq = req as OrganizationRequest;
      const { memberId } = req.params;
      const userId = orgReq.user!.id;
      const { role } = req.body as z.infer<typeof updateMemberRoleSchema>;

      const member = await updateMemberRole(orgReq.organizationId!, memberId, role);

      // Log activity
      await logActivity(orgReq.organizationId!, userId, 'member.role_updated', 'member', memberId, {
        newRole: role,
      }, req.ip, req.get('user-agent'));

      res.json({ member });
    } catch (error) {
      console.error('Update member role error:', error);
      const message = error instanceof Error ? error.message : 'Failed to update member role';
      res.status(400).json({ error: message, code: 'UPDATE_ROLE_FAILED' });
    }
  }
);

/**
 * DELETE /api/organizations/:organizationId/members/:memberId
 * Remove a member from the organization
 */
router.delete(
  '/:organizationId/members/:memberId',
  authenticate,
  loadOrganization,
  requirePermission('team:remove'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const orgReq = req as OrganizationRequest;
      const { memberId } = req.params;
      const userId = orgReq.user!.id;

      await removeMember(orgReq.organizationId!, memberId);

      // Log activity
      await logActivity(orgReq.organizationId!, userId, 'member.removed', 'member', memberId, {},
        req.ip, req.get('user-agent'));

      res.json({ message: 'Member removed' });
    } catch (error) {
      console.error('Remove member error:', error);
      const message = error instanceof Error ? error.message : 'Failed to remove member';
      res.status(400).json({ error: message, code: 'REMOVE_MEMBER_FAILED' });
    }
  }
);

// =============================================
// Domain Routes
// =============================================

/**
 * GET /api/organizations/:organizationId/domains
 * List organization domains
 */
router.get(
  '/:organizationId/domains',
  authenticate,
  loadOrganization,
  requirePermission('domain:read'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const orgReq = req as OrganizationRequest;
      const domains = await getOrganizationDomains(orgReq.organizationId!);

      // Add verification status for each domain
      const domainsWithStatus = await Promise.all(
        domains.map(async (domain) => {
          if (!domain.verified && domain.verification_token) {
            const status = await getVerificationStatus(orgReq.organizationId!, domain.id);
            return { ...domain, verificationStatus: status };
          }
          return domain;
        })
      );

      res.json({ domains: domainsWithStatus });
    } catch (error) {
      console.error('List domains error:', error);
      res.status(500).json({ error: 'Failed to list domains', code: 'LIST_DOMAINS_FAILED' });
    }
  }
);

/**
 * POST /api/organizations/:organizationId/domains
 * Add a domain to the organization
 */
router.post(
  '/:organizationId/domains',
  authenticate,
  loadOrganization,
  requirePermission('domain:write'),
  validateBody(addDomainSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const orgReq = req as OrganizationRequest;
      const organizationId = orgReq.organizationId!;
      const userId = orgReq.user!.id;
      const input = req.body as z.infer<typeof addDomainSchema>;

      const domain = await addDomain(organizationId, userId, input);

      // Log activity
      await logActivity(organizationId, userId, 'domain.added', 'domain', domain.id, {
        domain: domain.domain,
      }, req.ip, req.get('user-agent'));

      res.status(201).json({
        domain,
        message: 'Domain added. Use the verification-token endpoint to get verification instructions.',
      });
    } catch (error) {
      console.error('Add domain error:', error);
      const message = error instanceof Error ? error.message : 'Failed to add domain';
      res.status(400).json({ error: message, code: 'ADD_DOMAIN_FAILED' });
    }
  }
);

/**
 * PATCH /api/organizations/:organizationId/domains/:domainId
 * Update domain settings
 */
router.patch(
  '/:organizationId/domains/:domainId',
  authenticate,
  loadOrganization,
  requirePermission('domain:write'),
  validateBody(updateDomainSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const orgReq = req as OrganizationRequest;
      const { domainId } = req.params;
      const userId = orgReq.user!.id;
      const updates = req.body as z.infer<typeof updateDomainSchema>;

      // Verify domain belongs to this org
      const existingDomain = await getDomainById(domainId);
      if (!existingDomain || existingDomain.organization_id !== orgReq.organizationId) {
        res.status(404).json({ error: 'Domain not found', code: 'DOMAIN_NOT_FOUND' });
        return;
      }

      // Check if trying to set bypass settings on unverified domain
      const bypassSettings = ['ignore_robots_txt', 'rate_limit_profile', 'send_verification_header'];
      const hasBypassSettings = bypassSettings.some(key => key in updates);

      if (hasBypassSettings && !existingDomain.verified) {
        res.status(400).json({
          error: 'Bypass settings can only be configured for verified domains',
          code: 'DOMAIN_NOT_VERIFIED',
        });
        return;
      }

      const domain = await updateDomain(domainId, updates);

      // Log activity
      await logActivity(orgReq.organizationId!, userId, 'domain.updated', 'domain', domainId, {
        updates: Object.keys(updates),
      }, req.ip, req.get('user-agent'));

      res.json({ domain });
    } catch (error) {
      console.error('Update domain error:', error);
      const message = error instanceof Error ? error.message : 'Failed to update domain';
      res.status(400).json({ error: message, code: 'UPDATE_DOMAIN_FAILED' });
    }
  }
);

/**
 * POST /api/organizations/:organizationId/domains/:domainId/verification-token
 * Generate a verification token for a domain
 */
router.post(
  '/:organizationId/domains/:domainId/verification-token',
  authenticate,
  loadOrganization,
  requirePermission('domain:write'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const orgReq = req as OrganizationRequest;
      const { domainId } = req.params;

      // Verify domain belongs to this org
      const existingDomain = await getDomainById(domainId);
      if (!existingDomain || existingDomain.organization_id !== orgReq.organizationId) {
        res.status(404).json({ error: 'Domain not found', code: 'DOMAIN_NOT_FOUND' });
        return;
      }

      // Check if already verified
      if (existingDomain.verified) {
        res.status(400).json({
          error: 'Domain is already verified',
          code: 'ALREADY_VERIFIED',
        });
        return;
      }

      const instructions = await generateVerificationToken(orgReq.organizationId!, domainId);

      res.json({
        token: instructions.token,
        instructions: {
          dns: instructions.dns,
          file: instructions.file,
        },
      });
    } catch (error) {
      console.error('Generate verification token error:', error);
      const message = error instanceof Error ? error.message : 'Failed to generate verification token';
      res.status(400).json({ error: message, code: 'GENERATE_TOKEN_FAILED' });
    }
  }
);

/**
 * POST /api/organizations/:organizationId/domains/:domainId/verify
 * Attempt to verify domain ownership via DNS or file
 */
router.post(
  '/:organizationId/domains/:domainId/verify',
  authenticate,
  loadOrganization,
  requirePermission('domain:write'),
  validateBody(verifyDomainSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const orgReq = req as OrganizationRequest;
      const { domainId } = req.params;
      const userId = orgReq.user!.id;
      const { method } = req.body as z.infer<typeof verifyDomainSchema>;

      // Verify domain belongs to this org
      const existingDomain = await getDomainById(domainId);
      if (!existingDomain || existingDomain.organization_id !== orgReq.organizationId) {
        res.status(404).json({ error: 'Domain not found', code: 'DOMAIN_NOT_FOUND' });
        return;
      }

      // Check if already verified
      if (existingDomain.verified) {
        res.json({
          verified: true,
          method: existingDomain.verification_method,
          message: 'Domain is already verified',
        });
        return;
      }

      // Attempt verification
      const result = await attemptVerification(orgReq.organizationId!, domainId, method);

      if (result.verified) {
        // Log activity
        await logActivity(orgReq.organizationId!, userId, 'domain.verified', 'domain', domainId, {
          domain: existingDomain.domain,
          method,
        }, req.ip, req.get('user-agent'));
      }

      res.json(result);
    } catch (error) {
      console.error('Verify domain error:', error);
      const message = error instanceof Error ? error.message : 'Failed to verify domain';
      res.status(400).json({ error: message, code: 'VERIFY_DOMAIN_FAILED' });
    }
  }
);

/**
 * GET /api/organizations/:organizationId/domains/:domainId/verification-status
 * Get verification status for a domain
 */
router.get(
  '/:organizationId/domains/:domainId/verification-status',
  authenticate,
  loadOrganization,
  requirePermission('domain:read'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const orgReq = req as OrganizationRequest;
      const { domainId } = req.params;

      // Verify domain belongs to this org
      const existingDomain = await getDomainById(domainId);
      if (!existingDomain || existingDomain.organization_id !== orgReq.organizationId) {
        res.status(404).json({ error: 'Domain not found', code: 'DOMAIN_NOT_FOUND' });
        return;
      }

      const status = await getVerificationStatus(orgReq.organizationId!, domainId);

      res.json(status);
    } catch (error) {
      console.error('Get verification status error:', error);
      res.status(500).json({ error: 'Failed to get verification status', code: 'GET_STATUS_FAILED' });
    }
  }
);

/**
 * POST /api/organizations/:organizationId/domains/:domainId/request-change
 * Request domain change (FREE tier only)
 */
router.post(
  '/:organizationId/domains/:domainId/request-change',
  authenticate,
  loadOrganization,
  requirePermission('domain:write'),
  validateBody(requestDomainChangeSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const orgReq = req as OrganizationRequest;
      const { domainId } = req.params;
      const userId = orgReq.user!.id;
      const { newDomain } = req.body as z.infer<typeof requestDomainChangeSchema>;

      const domain = await requestDomainChange(orgReq.organizationId!, domainId, newDomain);

      // Log activity
      await logActivity(orgReq.organizationId!, userId, 'domain.change_requested', 'domain', domainId, {
        currentDomain: domain.domain,
        newDomain,
      }, req.ip, req.get('user-agent'));

      res.json({ domain });
    } catch (error) {
      console.error('Request domain change error:', error);
      const message = error instanceof Error ? error.message : 'Failed to request domain change';
      res.status(400).json({ error: message, code: 'DOMAIN_CHANGE_FAILED' });
    }
  }
);

/**
 * POST /api/organizations/:organizationId/domains/:domainId/cancel-change
 * Cancel pending domain change
 */
router.post(
  '/:organizationId/domains/:domainId/cancel-change',
  authenticate,
  loadOrganization,
  requirePermission('domain:write'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const orgReq = req as OrganizationRequest;
      const { domainId } = req.params;
      const userId = orgReq.user!.id;

      // Verify domain belongs to this org
      const existingDomain = await getDomainById(domainId);
      if (!existingDomain || existingDomain.organization_id !== orgReq.organizationId) {
        res.status(404).json({ error: 'Domain not found', code: 'DOMAIN_NOT_FOUND' });
        return;
      }

      const domain = await cancelDomainChange(domainId);

      // Log activity
      await logActivity(orgReq.organizationId!, userId, 'domain.change_cancelled', 'domain', domainId, {},
        req.ip, req.get('user-agent'));

      res.json({ domain });
    } catch (error) {
      console.error('Cancel domain change error:', error);
      const message = error instanceof Error ? error.message : 'Failed to cancel domain change';
      res.status(400).json({ error: message, code: 'CANCEL_CHANGE_FAILED' });
    }
  }
);

/**
 * DELETE /api/organizations/:organizationId/domains/:domainId
 * Remove a domain
 */
router.delete(
  '/:organizationId/domains/:domainId',
  authenticate,
  loadOrganization,
  requirePermission('domain:write'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const orgReq = req as OrganizationRequest;
      const { domainId } = req.params;
      const userId = orgReq.user!.id;

      // Verify domain belongs to this org
      const existingDomain = await getDomainById(domainId);
      if (!existingDomain || existingDomain.organization_id !== orgReq.organizationId) {
        res.status(404).json({ error: 'Domain not found', code: 'DOMAIN_NOT_FOUND' });
        return;
      }

      await removeDomain(domainId);

      // Log activity
      await logActivity(orgReq.organizationId!, userId, 'domain.removed', 'domain', domainId, {
        domain: existingDomain.domain,
      }, req.ip, req.get('user-agent'));

      res.json({ message: 'Domain removed' });
    } catch (error) {
      console.error('Remove domain error:', error);
      const message = error instanceof Error ? error.message : 'Failed to remove domain';
      res.status(400).json({ error: message, code: 'REMOVE_DOMAIN_FAILED' });
    }
  }
);

// =============================================
// Subscription/Usage Routes
// =============================================

/**
 * GET /api/organizations/:organizationId/subscription
 * Get subscription details
 */
router.get(
  '/:organizationId/subscription',
  authenticate,
  loadOrganization,
  requirePermission('billing:read'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const orgReq = req as OrganizationRequest;
      const subscription = await getSubscription(orgReq.organizationId!);
      const limits = await getOrganizationLimits(orgReq.organizationId!);

      res.json({ subscription, limits });
    } catch (error) {
      console.error('Get subscription error:', error);
      res.status(500).json({ error: 'Failed to get subscription', code: 'GET_SUBSCRIPTION_FAILED' });
    }
  }
);

/**
 * GET /api/organizations/:organizationId/usage
 * Get current usage
 */
router.get(
  '/:organizationId/usage',
  authenticate,
  loadOrganization,
  requirePermission('billing:read'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const orgReq = req as OrganizationRequest;
      const usage = await getCurrentUsage(orgReq.organizationId!);
      const limits = await getOrganizationLimits(orgReq.organizationId!);

      res.json({ usage, limits });
    } catch (error) {
      console.error('Get usage error:', error);
      res.status(500).json({ error: 'Failed to get usage', code: 'GET_USAGE_FAILED' });
    }
  }
);

export const organizationsRouter = router;
