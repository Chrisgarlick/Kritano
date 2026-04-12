/**
 * Trial Service
 *
 * Handles free trial activation, expiry checks, and lifecycle emails.
 * One trial per user, ever. Trial grants paid-tier features for 14 days.
 */
/**
 * Start a free trial for a user on a paid tier.
 */
export declare function startTrial(userId: string, tier: 'starter' | 'pro' | 'agency', durationDays?: number): Promise<{
    subscriptionId: string;
    trialEnd: string;
}>;
/**
 * Check for expiring and expired trials.
 * Called by the trial worker every 5 minutes. Idempotent.
 */
export declare function checkTrialExpiry(): Promise<void>;
//# sourceMappingURL=trial.service.d.ts.map