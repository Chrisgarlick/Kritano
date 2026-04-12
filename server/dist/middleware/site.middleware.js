"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setPool = setPool;
exports.getSiteWithAccess = getSiteWithAccess;
exports.loadSite = loadSite;
exports.requireSitePermission = requireSitePermission;
exports.requireMinPermission = requireMinPermission;
exports.requireSiteOwner = requireSiteOwner;
exports.requireVerifiedSite = requireVerifiedSite;
exports.canEdit = canEdit;
exports.canManage = canManage;
exports.isOwner = isOwner;
// Permission hierarchy (higher = more permissions)
const PERMISSION_LEVEL = {
    owner: 100,
    admin: 75,
    editor: 50,
    viewer: 25,
};
// Database pool - will be injected
let pool;
function setPool(dbPool) {
    pool = dbPool;
}
/**
 * Get a site with the user's access level
 * Uses COALESCE(owner_id, created_by) for backward compatibility
 */
async function getSiteWithAccess(siteId, userId) {
    // First check if user is the owner (using COALESCE for backward compatibility)
    const ownerResult = await pool.query(`SELECT * FROM sites WHERE id = $1 AND COALESCE(owner_id, created_by) = $2`, [siteId, userId]);
    if (ownerResult.rows.length > 0) {
        return {
            site: ownerResult.rows[0],
            permission: 'owner',
        };
    }
    // Check if user has a share
    const shareResult = await pool.query(`SELECT s.*, ss.permission
     FROM sites s
     JOIN site_shares ss ON ss.site_id = s.id
     WHERE s.id = $1 AND ss.user_id = $2 AND ss.accepted_at IS NOT NULL`, [siteId, userId]);
    if (shareResult.rows.length > 0) {
        const row = shareResult.rows[0];
        return {
            site: row,
            permission: row.permission,
        };
    }
    return null;
}
/**
 * Load site context from route parameter
 * Expects :siteId in route params
 */
async function loadSite(req, res, next) {
    try {
        const siteReq = req;
        const siteId = req.params.siteId;
        if (!siteId) {
            res.status(400).json({ error: 'Site ID is required' });
            return;
        }
        const userId = siteReq.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        const access = await getSiteWithAccess(siteId, userId);
        if (!access) {
            res.status(404).json({ error: 'Site not found' });
            return;
        }
        // Attach to request
        siteReq.site = access.site;
        siteReq.sitePermission = access.permission;
        siteReq.siteId = siteId;
        next();
    }
    catch (error) {
        console.error('Error loading site:', error);
        res.status(500).json({ error: 'Failed to load site context' });
    }
}
/**
 * Require specific permission level(s)
 * Owner always has access
 */
function requireSitePermission(...allowed) {
    return (req, res, next) => {
        const siteReq = req;
        if (!siteReq.sitePermission) {
            res.status(403).json({ error: 'Site access required' });
            return;
        }
        // Owner always has access
        if (siteReq.sitePermission === 'owner') {
            next();
            return;
        }
        // Check if user's permission is in allowed list
        if (!allowed.includes(siteReq.sitePermission)) {
            res.status(403).json({
                error: 'Insufficient permission',
                required: allowed,
                current: siteReq.sitePermission,
            });
            return;
        }
        next();
    };
}
/**
 * Require minimum permission level
 * Useful for "editor or higher" type checks
 */
function requireMinPermission(minPermission) {
    return (req, res, next) => {
        const siteReq = req;
        if (!siteReq.sitePermission) {
            res.status(403).json({ error: 'Site access required' });
            return;
        }
        const userLevel = PERMISSION_LEVEL[siteReq.sitePermission];
        const requiredLevel = PERMISSION_LEVEL[minPermission];
        if (userLevel < requiredLevel) {
            res.status(403).json({
                error: 'Insufficient permission',
                required: minPermission,
                current: siteReq.sitePermission,
            });
            return;
        }
        next();
    };
}
/**
 * Require site owner
 */
function requireSiteOwner(req, res, next) {
    const siteReq = req;
    if (siteReq.sitePermission !== 'owner') {
        res.status(403).json({ error: 'Only the site owner can perform this action' });
        return;
    }
    next();
}
/**
 * Check if site is verified (for multi-URL audits)
 */
function requireVerifiedSite(req, res, next) {
    const siteReq = req;
    if (!siteReq.site?.verified) {
        res.status(403).json({
            error: 'Site verification required for this action',
            code: 'VERIFICATION_REQUIRED',
            siteId: siteReq.siteId,
        });
        return;
    }
    next();
}
/**
 * Helper: Check if user can edit based on permission
 */
function canEdit(permission) {
    if (!permission)
        return false;
    return PERMISSION_LEVEL[permission] >= PERMISSION_LEVEL.editor;
}
/**
 * Helper: Check if user can manage (admin level)
 */
function canManage(permission) {
    if (!permission)
        return false;
    return PERMISSION_LEVEL[permission] >= PERMISSION_LEVEL.admin;
}
/**
 * Helper: Check if user is owner
 */
function isOwner(permission) {
    return permission === 'owner';
}
//# sourceMappingURL=site.middleware.js.map