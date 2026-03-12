import type { Request, Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from './auth.middleware.js';
import type { Pool } from 'pg';

// Site permission levels
export type SitePermission = 'owner' | 'admin' | 'editor' | 'viewer';

// Permission hierarchy (higher = more permissions)
const PERMISSION_LEVEL: Record<SitePermission, number> = {
  owner: 100,
  admin: 75,
  editor: 50,
  viewer: 25,
};

// Site with access info
export interface SiteWithAccess {
  id: string;
  owner_id: string;
  name: string;
  domain: string;
  description: string | null;
  logo_url: string | null;
  verified: boolean;
  verification_token: string | null;
  verified_at: Date | null;
  verification_method: string | null;
  verification_attempts: number;
  last_verification_attempt: Date | null;
  ignore_robots_txt: boolean;
  rate_limit_profile: string;
  send_verification_header: boolean;
  settings: Record<string, unknown>;
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
}

// Extended request type with site context
export interface SiteRequest extends AuthenticatedRequest {
  site?: SiteWithAccess;
  sitePermission?: SitePermission;
  siteId?: string;
}

// Database pool - will be injected
let pool: Pool;

export function setPool(dbPool: Pool): void {
  pool = dbPool;
}

/**
 * Get a site with the user's access level
 * Uses COALESCE(owner_id, created_by) for backward compatibility
 */
export async function getSiteWithAccess(
  siteId: string,
  userId: string
): Promise<{ site: SiteWithAccess; permission: SitePermission } | null> {
  // First check if user is the owner (using COALESCE for backward compatibility)
  const ownerResult = await pool.query<SiteWithAccess>(
    `SELECT * FROM sites WHERE id = $1 AND COALESCE(owner_id, created_by) = $2`,
    [siteId, userId]
  );

  if (ownerResult.rows.length > 0) {
    return {
      site: ownerResult.rows[0],
      permission: 'owner',
    };
  }

  // Check if user has a share
  const shareResult = await pool.query<SiteWithAccess & { permission: string }>(
    `SELECT s.*, ss.permission
     FROM sites s
     JOIN site_shares ss ON ss.site_id = s.id
     WHERE s.id = $1 AND ss.user_id = $2 AND ss.accepted_at IS NOT NULL`,
    [siteId, userId]
  );

  if (shareResult.rows.length > 0) {
    const row = shareResult.rows[0];
    return {
      site: row,
      permission: row.permission as SitePermission,
    };
  }

  return null;
}

/**
 * Load site context from route parameter
 * Expects :siteId in route params
 */
export async function loadSite(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const siteReq = req as SiteRequest;
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
  } catch (error) {
    console.error('Error loading site:', error);
    res.status(500).json({ error: 'Failed to load site context' });
  }
}

/**
 * Require specific permission level(s)
 * Owner always has access
 */
export function requireSitePermission(...allowed: SitePermission[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const siteReq = req as SiteRequest;

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
export function requireMinPermission(minPermission: SitePermission) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const siteReq = req as SiteRequest;

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
export function requireSiteOwner(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const siteReq = req as SiteRequest;

  if (siteReq.sitePermission !== 'owner') {
    res.status(403).json({ error: 'Only the site owner can perform this action' });
    return;
  }

  next();
}

/**
 * Check if site is verified (for multi-URL audits)
 */
export function requireVerifiedSite(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const siteReq = req as SiteRequest;

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
export function canEdit(permission: SitePermission | undefined): boolean {
  if (!permission) return false;
  return PERMISSION_LEVEL[permission] >= PERMISSION_LEVEL.editor;
}

/**
 * Helper: Check if user can manage (admin level)
 */
export function canManage(permission: SitePermission | undefined): boolean {
  if (!permission) return false;
  return PERMISSION_LEVEL[permission] >= PERMISSION_LEVEL.admin;
}

/**
 * Helper: Check if user is owner
 */
export function isOwner(permission: SitePermission | undefined): boolean {
  return permission === 'owner';
}
