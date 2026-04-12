/**
 * Early Access Service
 *
 * Manages the founding members early access campaign:
 * - 250 founding member spots (single consolidated link)
 * - Claim a spot on registration, activate all at once later
 * - 30-day Agency trial + lifetime discount for founding members
 */
export declare function isEarlyAccessEnabled(): Promise<boolean>;
export interface EarlyAccessStatus {
    enabled: boolean;
    maxSpots: number;
    claimed: number;
    remaining: number;
    activated: boolean;
}
export declare function getEarlyAccessStatus(): Promise<EarlyAccessStatus>;
export declare function canClaimSpot(): Promise<boolean>;
/**
 * Claim an early access spot for a user.
 * Uses a CTE count check to prevent race conditions.
 */
export declare function claimSpot(userId: string, channel?: string): Promise<boolean>;
export interface ChannelBreakdown {
    email: number;
    social: number;
    total: number;
}
export declare function getChannelBreakdown(): Promise<ChannelBreakdown>;
export interface EarlyAccessUser {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    channel: string;
    emailVerified: boolean;
    activatedAt: string | null;
    createdAt: string;
}
export declare function getEarlyAccessUsers(page?: number, limit?: number, search?: string): Promise<{
    users: EarlyAccessUser[];
    total: number;
}>;
/**
 * Activate all early access users: start 30-day Agency trial for each.
 * Idempotent — skips already-activated users.
 */
export declare function activateAll(adminId: string): Promise<{
    activated: number;
    skipped: number;
}>;
//# sourceMappingURL=early-access.service.d.ts.map