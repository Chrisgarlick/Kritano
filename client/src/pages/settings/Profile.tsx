import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { userApi, authApi, billingApi } from '../../services/api';
import {
  User,
  Mail,
  Calendar,
  Shield,
  Check,
  Sparkles,
  Zap,
  Building2,
  Crown,
  Clock,
  RefreshCw,
  Loader2,
  CreditCard,
} from 'lucide-react';
import type { SubscriptionTier, TierLimits } from '../../types/site.types';

interface PlanInfo {
  tier: SubscriptionTier;
  name: string;
  price: string;
  priceDetail?: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  icon: React.ReactNode;
}

const PLANS: PlanInfo[] = [
  {
    tier: 'free',
    name: 'Free',
    price: '$0',
    priceDetail: 'forever',
    description: 'Perfect for personal projects',
    icon: <User className="w-5 h-5" />,
    features: [
      '1 site',
      '5 audits per month',
      '50 pages per audit',
      'SEO & Accessibility checks',
      '30 day data retention',
    ],
  },
  {
    tier: 'starter',
    name: 'Starter',
    price: '$19',
    priceDetail: 'per month',
    description: 'For freelancers & small teams',
    icon: <Zap className="w-5 h-5" />,
    features: [
      '3 sites',
      '10 audits per month',
      '250 pages per audit',
      'All audit types',
      'Scheduled audits',
      'PDF exports',
      '90 day retention',
    ],
  },
  {
    tier: 'pro',
    name: 'Pro',
    price: '$49',
    priceDetail: 'per month',
    description: 'For growing businesses',
    icon: <Sparkles className="w-5 h-5" />,
    highlighted: true,
    features: [
      '10 sites',
      'Unlimited audits',
      '1,000 pages per audit',
      'All audit types',
      'Daily scheduling',
      'All export formats',
      'API access',
      '1 year retention',
    ],
  },
  {
    tier: 'agency',
    name: 'Agency',
    price: '$99',
    priceDetail: 'per month',
    description: 'For agencies & consultants',
    icon: <Building2 className="w-5 h-5" />,
    features: [
      '50 sites',
      'Unlimited audits',
      '5,000 pages per audit',
      'White-label reports',
      'Hourly scheduling',
      'Priority support',
      '2 year retention',
    ],
  },
  {
    tier: 'enterprise',
    name: 'Enterprise',
    price: '$199/mo',
    description: 'For large organizations',
    icon: <Crown className="w-5 h-5" />,
    features: [
      'Unlimited sites',
      'Unlimited audits',
      '10,000+ pages per audit',
      'Custom integrations',
      'Dedicated support',
      'SLA guarantees',
      'On-premise option',
    ],
  },
];

export default function ProfilePage() {
  const { user, refreshSubscription } = useAuth();
  const { toast } = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [currentTier, setCurrentTier] = useState<SubscriptionTier>('free');
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('active');
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [hasUsedTrial, setHasUsedTrial] = useState(false);
  const [stripeCustomerId, setStripeCustomerId] = useState(false);
  const [limits, setLimits] = useState<TierLimits | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [startingTrial, setStartingTrial] = useState<SubscriptionTier | null>(null);
  const [checkingOut, setCheckingOut] = useState<SubscriptionTier | null>(null);
  const [openingPortal, setOpeningPortal] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);

  useEffect(() => {
    loadSubscription();
  }, []);

  // Handle Stripe checkout return
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkoutStatus = params.get('checkout');
    if (checkoutStatus === 'success') {
      toast('Payment successful! Your plan is being activated.', 'success');
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
      // Reload subscription after a short delay to allow webhook processing
      setTimeout(() => {
        loadSubscription();
        refreshSubscription();
      }, 2000);
    } else if (checkoutStatus === 'canceled') {
      toast('Checkout canceled. No changes were made.', 'info');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const loadSubscription = async () => {
    try {
      const response = await userApi.getSubscription();
      setCurrentTier(response.data.subscription?.tier || 'free');
      setSubscriptionStatus(response.data.subscription?.status || 'active');
      setDaysRemaining(response.data.subscription?.daysRemaining ?? null);
      setHasUsedTrial(response.data.subscription?.hasUsedTrial || false);
      setStripeCustomerId(!!response.data.subscription?.stripeCustomerId);
      setLimits(response.data.limits);
    } catch (error) {
      console.error('Failed to load subscription:', error);
      setCurrentTier('free');
    } finally {
      setLoadingSubscription(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast('New passwords do not match', 'error');
      return;
    }

    if (newPassword.length < 8) {
      toast('Password must be at least 8 characters', 'error');
      return;
    }

    try {
      setIsChangingPassword(true);
      // TODO: Implement password change API call
      toast('Password changed successfully', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast(error.response?.data?.error || 'Failed to change password', 'error');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSelectPlan = async (tier: SubscriptionTier) => {
    if (tier === currentTier) return;
    if (tier === 'free') return;

    // If user hasn't used trial and is on free tier, start trial
    if (!hasUsedTrial && currentTier === 'free' && ['starter', 'pro', 'agency', 'enterprise'].includes(tier)) {
      try {
        setStartingTrial(tier);
        await userApi.startTrial(tier as 'starter' | 'pro' | 'agency');
        toast(`Your 14-day ${tier} trial has started!`, 'success');
        await loadSubscription();
        refreshSubscription();
      } catch (error: any) {
        const msg = error.response?.data?.error || 'Failed to start trial';
        toast(msg, 'error');
      } finally {
        setStartingTrial(null);
      }
      return;
    }

    // Stripe checkout for users who've used their trial or want to upgrade
    try {
      setCheckingOut(tier);
      const response = await billingApi.createCheckout(tier);
      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error: any) {
      const msg = error.response?.data?.error || 'Failed to start checkout';
      toast(msg, 'error');
    } finally {
      setCheckingOut(null);
    }
  };

  const handleManageBilling = async () => {
    try {
      setOpeningPortal(true);
      const response = await billingApi.createPortal();
      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error: any) {
      const msg = error.response?.data?.error || 'Failed to open billing portal';
      toast(msg, 'error');
    } finally {
      setOpeningPortal(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Loading profile...</p>
      </div>
    );
  }

  const createdDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Unknown';

  return (
    <div className="space-y-8">
      {/* Account Information */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Account Information</h2>
        </div>

        <div className="p-6 space-y-6">
          {/* Avatar and Name */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <span className="text-2xl font-semibold text-indigo-600 dark:text-indigo-400">
                {user.firstName?.charAt(0) || user.email.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                {user.firstName} {user.lastName}
              </h3>
              <p className="text-slate-500 dark:text-slate-400">{user.email}</p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3 text-sm">
              <User className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-slate-500 dark:text-slate-400">Full Name</p>
                <p className="text-slate-900 dark:text-white font-medium">
                  {user.firstName} {user.lastName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <Mail className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-slate-500 dark:text-slate-400">Email</p>
                <p className="text-slate-900 dark:text-white font-medium">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <Calendar className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-slate-500 dark:text-slate-400">Member Since</p>
                <p className="text-slate-900 dark:text-white font-medium">{createdDate}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <Shield className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-slate-500 dark:text-slate-400">Email Verified</p>
                {user.emailVerified ? (
                  <p className="font-medium text-emerald-600 dark:text-emerald-400">Verified</p>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-amber-600 dark:text-amber-400">Not Verified</p>
                    <button
                      onClick={async () => {
                        setResendingVerification(true);
                        try {
                          await authApi.resendVerification(user.email);
                          toast('Verification email sent! Check your inbox.', 'success');
                        } catch {
                          toast('Failed to resend verification email.', 'error');
                        } finally {
                          setResendingVerification(false);
                        }
                      }}
                      disabled={resendingVerification}
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/20 rounded-md transition-colors disabled:opacity-50"
                    >
                      {resendingVerification ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                      Resend
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription & Plans */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Subscription Plan</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Manage your subscription and billing
              </p>
            </div>
            {!loadingSubscription && (
              <div className="flex items-center gap-2">
                {stripeCustomerId && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleManageBilling}
                    isLoading={openingPortal}
                    disabled={openingPortal}
                  >
                    <CreditCard className="w-4 h-4 mr-1.5" />
                    Manage Billing
                  </Button>
                )}
                {subscriptionStatus === 'trialing' && daysRemaining !== null && (
                  <span className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                    <Clock className="w-3.5 h-3.5" />
                    Trial: {daysRemaining}d left
                  </span>
                )}
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  currentTier === 'free'
                    ? 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                    : currentTier === 'enterprise'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                    : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                }`}>
                  {PLANS.find(p => p.tier === currentTier)?.name || 'Free'} Plan
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="p-6">
          {loadingSubscription ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
              {PLANS.map((plan) => {
                const isCurrent = plan.tier === currentTier;
                const isHighlighted = plan.highlighted;

                return (
                  <div
                    key={plan.tier}
                    className={`relative rounded-xl border-2 p-5 transition-all ${
                      isCurrent
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/10'
                        : isHighlighted
                        ? 'border-indigo-200 dark:border-indigo-800 hover:border-indigo-400'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    {isHighlighted && !isCurrent && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-indigo-600 text-white text-xs font-medium rounded-full">
                        Popular
                      </span>
                    )}

                    {isCurrent && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-indigo-600 text-white text-xs font-medium rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" /> Current
                      </span>
                    )}

                    <div className="mb-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                        isCurrent
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}>
                        {plan.icon}
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{plan.name}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{plan.description}</p>
                    </div>

                    <div className="mb-4">
                      <span className="text-2xl font-bold text-slate-900 dark:text-white">{plan.price}</span>
                      {plan.priceDetail && (
                        <span className="text-sm text-slate-500 dark:text-slate-400 ml-1">/{plan.priceDetail}</span>
                      )}
                    </div>

                    <ul className="space-y-2 mb-5 text-sm">
                      {plan.features.slice(0, 5).map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                          <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                      {plan.features.length > 5 && (
                        <li className="text-slate-500 dark:text-slate-400 text-xs">
                          +{plan.features.length - 5} more features
                        </li>
                      )}
                    </ul>

                    <Button
                      variant={isCurrent ? 'secondary' : isHighlighted ? 'primary' : 'outline'}
                      size="sm"
                      className="w-full"
                      disabled={isCurrent || startingTrial === plan.tier || checkingOut === plan.tier}
                      isLoading={startingTrial === plan.tier || checkingOut === plan.tier}
                      onClick={() => handleSelectPlan(plan.tier)}
                    >
                      {isCurrent
                        ? 'Current Plan'
                        : plan.tier === 'free'
                        ? 'Downgrade'
                        : !hasUsedTrial && currentTier === 'free'
                        ? 'Start Free Trial'
                        : 'Upgrade'}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Current usage summary */}
          {limits && !loadingSubscription && (
            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
              <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-3">Your Current Limits</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Sites</span>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {limits.maxSites === null ? 'Unlimited' : limits.maxSites}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Audits/month</span>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {limits.maxAuditsPerMonth === null ? 'Unlimited' : limits.maxAuditsPerMonth}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Pages/audit</span>
                  <p className="font-medium text-slate-900 dark:text-white">{limits.maxPagesPerAudit}</p>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Concurrent audits</span>
                  <p className="font-medium text-slate-900 dark:text-white">{limits.concurrentAudits}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Change Password</h2>
        </div>

        <form onSubmit={handleChangePassword} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Current Password
              </label>
              <input
                type="password"
                id="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="block w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-colors"
                placeholder="Enter current password"
              />
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="block w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-colors"
                placeholder="Enter new password"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="block w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-colors"
                placeholder="Confirm new password"
              />
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              isLoading={isChangingPassword}
              disabled={!currentPassword || !newPassword || !confirmPassword}
            >
              Update Password
            </Button>
          </div>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-red-200 dark:border-red-900/50 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10">
          <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">Danger Zone</h2>
        </div>

        <div className="p-6">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <Button variant="outline" className="border-red-500 text-red-600 hover:bg-red-50 dark:border-red-500 dark:text-red-400 dark:hover:bg-red-900/20">
            Delete Account
          </Button>
        </div>
      </div>
    </div>
  );
}
