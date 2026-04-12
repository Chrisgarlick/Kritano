import type { Request, Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from './auth.middleware.js';
import type { Pool } from 'pg';
export type SitePermission = 'owner' | 'admin' | 'editor' | 'viewer';
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
export interface SiteRequest extends AuthenticatedRequest {
    site?: SiteWithAccess;
    sitePermission?: SitePermission;
    siteId?: string;
}
export declare function setPool(dbPool: Pool): void;
/**
 * Get a site with the user's access level
 * Uses COALESCE(owner_id, created_by) for backward compatibility
 */
export declare function getSiteWithAccess(siteId: string, userId: string): Promise<{
    site: SiteWithAccess;
    permission: SitePermission;
} | null>;
/**
 * Load site context from route parameter
 * Expects :siteId in route params
 */
export declare function loadSite(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * Require specific permission level(s)
 * Owner always has access
 */
export declare function requireSitePermission(...allowed: SitePermission[]): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Require minimum permission level
 * Useful for "editor or higher" type checks
 */
export declare function requireMinPermission(minPermission: SitePermission): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Require site owner
 */
export declare function requireSiteOwner(req: Request, res: Response, next: NextFunction): void;
/**
 * Check if site is verified (for multi-URL audits)
 */
export declare function requireVerifiedSite(req: Request, res: Response, next: NextFunction): void;
/**
 * Helper: Check if user can edit based on permission
 */
export declare function canEdit(permission: SitePermission | undefined): boolean;
/**
 * Helper: Check if user can manage (admin level)
 */
export declare function canManage(permission: SitePermission | undefined): boolean;
/**
 * Helper: Check if user is owner
 */
export declare function isOwner(permission: SitePermission | undefined): boolean;
//# sourceMappingURL=site.middleware.d.ts.map