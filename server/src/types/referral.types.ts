export interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  referral_code: string;
  status: 'pending' | 'qualified' | 'rewarded' | 'voided';
  email_verified_at: string | null;
  first_audit_completed_at: string | null;
  qualified_at: string | null;
  rewarded_at: string | null;
  voided_at: string | null;
  void_reason: string | null;
  referrer_reward_type: string | null;
  referrer_reward_value: number | null;
  referred_reward_type: string | null;
  referred_reward_value: number | null;
  referrer_ip: string | null;
  referred_ip: string | null;
  referrer_tier: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReferralWithUser extends Referral {
  referred_email?: string;
  referred_name?: string;
  referrer_email?: string;
  referrer_name?: string;
}

export interface ReferralStats {
  totalReferred: number;
  pendingCount: number;
  qualifiedCount: number;
  rewardedCount: number;
  voidedCount: number;
  totalBonusAuditsEarned: number;
  bonusAuditsRemaining: number;
  referralCode: string;
  referralLink: string;
}

export interface AdminReferralStats {
  totalReferrals: number;
  pendingCount: number;
  qualifiedCount: number;
  rewardedCount: number;
  voidedCount: number;
  conversionRate: number;
  totalBonusAuditsAwarded: number;
  topReferrers: Array<{
    user_id: string;
    email: string;
    name: string;
    referral_count: number;
  }>;
}

export interface ReferralConfig {
  enabled: boolean;
  maxReferralsPerMonth: number;
  rewards: {
    referrer: Record<string, number>;
    referred: number;
    milestones: Record<string, { tier: string; days: number }>;
  };
}

export interface ReferralReward {
  id: string;
  user_id: string;
  referral_id: string | null;
  type: string;
  amount: number;
  balance_after: number;
  description: string | null;
  created_at: string;
}
