import { Pool } from 'pg';
import type { Referral, ReferralWithUser, ReferralStats, AdminReferralStats, ReferralConfig } from '../types/referral.types.js';
export declare function setPool(dbPool: Pool): void;
export declare function getConfig(): Promise<ReferralConfig>;
export declare function updateConfig(key: string, value: unknown): Promise<void>;
export declare function getOrCreateReferralCode(userId: string): Promise<string>;
export declare function resolveReferralCode(code: string): Promise<{
    userId: string;
    email: string;
} | null>;
export declare function createReferral(referrerId: string, referredId: string, code: string, referredIp?: string): Promise<Referral | null>;
export declare function checkAndQualifyReferral(referredUserId: string): Promise<void>;
export declare function consumeBonusAudit(userId: string): Promise<boolean>;
export declare function getReferralStats(userId: string): Promise<ReferralStats>;
export declare function getUserReferrals(userId: string, page?: number, limit?: number): Promise<{
    referrals: ReferralWithUser[];
    total: number;
}>;
export declare function sendInviteEmails(userId: string, emails: string[]): Promise<{
    sent: number;
    errors: string[];
}>;
export declare function adminGetStats(): Promise<AdminReferralStats>;
export declare function adminListReferrals(page?: number, limit?: number, status?: string, search?: string): Promise<{
    referrals: ReferralWithUser[];
    total: number;
}>;
export declare function adminVoidReferral(referralId: string, reason: string, adminId: string): Promise<Referral>;
//# sourceMappingURL=referral.service.d.ts.map