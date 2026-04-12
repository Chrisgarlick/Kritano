/**
 * Cold Prospect Outreach Service
 *
 * Handles automated email outreach to qualified cold prospects.
 * Separate from user email system since prospects aren't registered users.
 */
import { Pool } from 'pg';
export declare function setPool(dbPool: Pool): void;
/**
 * Check if an email is a generic/role-based business address.
 * Returns false for personal named emails.
 */
export declare function isGenericBusinessEmail(email: string): boolean;
/**
 * Queue outreach emails for qualified prospects who haven't been contacted.
 * Respects daily limit and unsubscribe list.
 */
export declare function queueOutreachBatch(limit?: number): Promise<{
    queued: number;
}>;
/**
 * Process queued outreach sends. Claims rows with FOR UPDATE SKIP LOCKED.
 */
export declare function processOutreachQueue(batchSize?: number): Promise<{
    sent: number;
    failed: number;
    drafted: number;
}>;
export interface OutreachStats {
    totalSends: number;
    sent: number;
    queued: number;
    failed: number;
    opened: number;
    clicked: number;
    unsubscribed: number;
    sentToday: number;
    openRate: number;
    clickRate: number;
}
export declare function getOutreachStats(): Promise<OutreachStats>;
/**
 * Get paginated send history.
 */
export declare function getSendHistory(page?: number, limit?: number): Promise<{
    sends: unknown[];
    total: number;
}>;
/**
 * Process an unsubscribe request.
 */
export declare function processUnsubscribe(email: string, prospectId?: string): Promise<void>;
export declare function generateUnsubscribeToken(email: string, prospectId: string): string;
export declare function verifyUnsubscribeToken(token: string): {
    email: string;
    prospectId: string;
} | null;
/**
 * Delete cold prospects with no engagement after 6 months.
 * Required by LIA — see /docs/cold-prospects-LIA.md
 */
export declare function purgeStaleProspects(): Promise<{
    deleted: number;
}>;
//# sourceMappingURL=outreach.service.d.ts.map