import type { Request, Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from './auth.middleware.js';
import type { Permission, OrgRole, OrganizationMember, Organization, Subscription, TierLimits } from '../types/organization.types.js';
export interface OrganizationRequest extends AuthenticatedRequest {
    organization?: Organization;
    membership?: OrganizationMember;
    subscription?: Subscription;
    tierLimits?: TierLimits;
    organizationId?: string;
}
/**
 * Load organization context from route parameter
 * Expects :organizationId in route params
 */
export declare function loadOrganization(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * Require specific permissions for the organization
 */
export declare function requirePermission(...requiredPermissions: Permission[]): (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Require minimum role level
 */
export declare function requireRole(...allowedRoles: OrgRole[]): (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Check if user is the organization owner
 */
export declare function requireOwner(req: Request, res: Response, next: NextFunction): void;
/**
 * Check tier requirement
 */
export declare function requireTier(...allowedTiers: string[]): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Check if a specific feature is available in the current tier
 */
export declare function requireFeature(feature: keyof TierLimits): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Helper: Check if user can edit a specific resource
 * For members, they can only edit their own resources
 */
export declare function canEditResource(membership: OrganizationMember, resourceCreatedBy: string): boolean;
/**
 * Helper: Check if user can delete a specific resource
 * Only owner/admin can delete any resource
 * Members cannot delete (only edit their own)
 */
export declare function canDeleteResource(membership: OrganizationMember): boolean;
/**
 * Get organization from request or header
 * Supports both route param and X-Organization-ID header
 */
export declare function resolveOrganization(req: Request, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=organization.middleware.d.ts.map