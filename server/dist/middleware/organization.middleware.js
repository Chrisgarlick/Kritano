"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadOrganization = loadOrganization;
exports.requirePermission = requirePermission;
exports.requireRole = requireRole;
exports.requireOwner = requireOwner;
exports.requireTier = requireTier;
exports.requireFeature = requireFeature;
exports.canEditResource = canEditResource;
exports.canDeleteResource = canDeleteResource;
exports.resolveOrganization = resolveOrganization;
const organization_types_js_1 = require("../types/organization.types.js");
const organization_service_js_1 = require("../services/organization.service.js");
/**
 * Load organization context from route parameter
 * Expects :organizationId in route params
 */
async function loadOrganization(req, res, next) {
    try {
        const orgReq = req;
        const organizationId = req.params.organizationId;
        if (!organizationId) {
            res.status(400).json({ error: 'Organization ID is required' });
            return;
        }
        // Load organization
        const organization = await (0, organization_service_js_1.getOrganizationById)(organizationId);
        if (!organization) {
            res.status(404).json({ error: 'Organization not found' });
            return;
        }
        // Load user's membership
        const userId = orgReq.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        const membership = await (0, organization_service_js_1.getMembership)(organizationId, userId);
        if (!membership) {
            res.status(403).json({ error: 'You are not a member of this organization' });
            return;
        }
        // Load subscription and limits
        const [subscription, tierLimits] = await Promise.all([
            (0, organization_service_js_1.getSubscription)(organizationId),
            (0, organization_service_js_1.getOrganizationLimits)(organizationId),
        ]);
        // Attach to request
        orgReq.organization = organization;
        orgReq.membership = membership;
        orgReq.subscription = subscription || undefined;
        orgReq.tierLimits = tierLimits || undefined;
        orgReq.organizationId = organizationId;
        next();
    }
    catch (error) {
        console.error('Error loading organization:', error);
        res.status(500).json({ error: 'Failed to load organization context' });
    }
}
/**
 * Require specific permissions for the organization
 */
function requirePermission(...requiredPermissions) {
    return async (req, res, next) => {
        const orgReq = req;
        if (!orgReq.membership) {
            res.status(403).json({ error: 'Organization membership required' });
            return;
        }
        const role = orgReq.membership.role;
        const userPermissions = organization_types_js_1.ROLE_PERMISSIONS[role];
        const hasAllPermissions = requiredPermissions.every((permission) => userPermissions.includes(permission));
        if (!hasAllPermissions) {
            res.status(403).json({
                error: 'Insufficient permissions',
                required: requiredPermissions,
                role: role,
            });
            return;
        }
        next();
    };
}
/**
 * Require minimum role level
 */
function requireRole(...allowedRoles) {
    return async (req, res, next) => {
        const orgReq = req;
        if (!orgReq.membership) {
            res.status(403).json({ error: 'Organization membership required' });
            return;
        }
        if (!allowedRoles.includes(orgReq.membership.role)) {
            res.status(403).json({
                error: 'Insufficient role',
                required: allowedRoles,
                current: orgReq.membership.role,
            });
            return;
        }
        next();
    };
}
/**
 * Check if user is the organization owner
 */
function requireOwner(req, res, next) {
    const orgReq = req;
    if (!orgReq.membership || orgReq.membership.role !== 'owner') {
        res.status(403).json({ error: 'Only the organization owner can perform this action' });
        return;
    }
    next();
}
/**
 * Check tier requirement
 */
function requireTier(...allowedTiers) {
    return (req, res, next) => {
        const orgReq = req;
        if (!orgReq.subscription) {
            res.status(403).json({ error: 'Subscription required' });
            return;
        }
        if (!allowedTiers.includes(orgReq.subscription.tier)) {
            res.status(403).json({
                error: 'Feature not available on your plan',
                required: allowedTiers,
                current: orgReq.subscription.tier,
                upgradeUrl: `/app/settings/billing`,
            });
            return;
        }
        next();
    };
}
/**
 * Check if a specific feature is available in the current tier
 */
function requireFeature(feature) {
    return (req, res, next) => {
        const orgReq = req;
        if (!orgReq.tierLimits) {
            res.status(403).json({ error: 'Unable to verify feature availability' });
            return;
        }
        const featureValue = orgReq.tierLimits[feature];
        // Check if feature is enabled (boolean) or has a value (number > 0 or not null)
        const isEnabled = featureValue === true ||
            (typeof featureValue === 'number' && featureValue > 0) ||
            (featureValue !== null && featureValue !== false);
        if (!isEnabled) {
            res.status(403).json({
                error: `This feature (${feature}) is not available on your plan`,
                current: orgReq.subscription?.tier,
                upgradeUrl: `/app/settings/billing`,
            });
            return;
        }
        next();
    };
}
/**
 * Helper: Check if user can edit a specific resource
 * For members, they can only edit their own resources
 */
function canEditResource(membership, resourceCreatedBy) {
    if (membership.role === 'owner' || membership.role === 'admin') {
        return true;
    }
    if (membership.role === 'member') {
        return resourceCreatedBy === membership.user_id;
    }
    return false;
}
/**
 * Helper: Check if user can delete a specific resource
 * Only owner/admin can delete any resource
 * Members cannot delete (only edit their own)
 */
function canDeleteResource(membership) {
    return membership.role === 'owner' || membership.role === 'admin';
}
/**
 * Get organization from request or header
 * Supports both route param and X-Organization-ID header
 */
async function resolveOrganization(req, res, next) {
    try {
        const orgReq = req;
        // Check route param first
        let organizationId = req.params.organizationId;
        // Fall back to header
        if (!organizationId) {
            organizationId = req.headers['x-organization-id'];
        }
        if (!organizationId) {
            res.status(400).json({
                error: 'Organization ID required',
                message: 'Provide organization ID in route params or X-Organization-ID header',
            });
            return;
        }
        // Use loadOrganization logic
        req.params.organizationId = organizationId;
        await loadOrganization(req, res, next);
    }
    catch (error) {
        console.error('Error resolving organization:', error);
        res.status(500).json({ error: 'Failed to resolve organization' });
    }
}
//# sourceMappingURL=organization.middleware.js.map