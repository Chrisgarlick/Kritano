import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { userApi, authApi, billingApi, accountApi } from '../../services/api';
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
  Link2,
  Unlink,
  Download,
  Trash2,
  AlertTriangle,
  X,
} from 'lucide-react';
import type { OAuthProviderSummary } from '../../types/auth.types';
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
      'SEO, Security & Content checks',
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
  const [linkedProviders, setLinkedProviders] = useState<OAuthProviderSummary[]>([]);
  const [hasPasswordSet, setHasPasswordSet] = useState(true);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [unlinkingProvider, setUnlinkingProvider] = useState<string | null>(null);
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);

  // GDPR state
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportPassword, setExportPassword] = useState('');
  const [requestingExport, setRequestingExport] = useState(false);
  const [exportStatus, setExportStatus] = useState<{
    id: string; status: string; expiresAt: string | null; fileSizeBytes: number | null;
  } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [requestingDeletion, setRequestingDeletion] = useState(false);
  const [cancellingDeletion, setCancellingDeletion] = useState(false);

  useEffect(() => {
    loadSubscription();
    loadLinkedProviders();
    loadExportStatus();
  }, []);

  const loadExportStatus = async () => {
    try {
      const response = await accountApi.getExportStatus();
      if (response.data.export) {
        setExportStatus(response.data.export);
      }
    } catch {
      // No export yet, that's fine
    }
  };

  const handleRequestExport = async () => {
    try {
      setRequestingExport(true);
      await accountApi.requestDataExport(exportPassword);
      toast('Data export started. You will be notified when it is ready.', 'success');
      setShowExportModal(false);
      setExportPassword('');
      await loadExportStatus();
    } catch (error: any) {
      const msg = error.response?.data?.error || 'Failed to request data export';
      toast(msg, 'error');
    } finally {
      setRequestingExport(false);
    }
  };

  const handleDownloadExport = async () => {
    if (!exportStatus?.id) return;
    try {
      const response = await accountApi.downloadExport(exportStatus.id);
      const blob = new Blob([response.data], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'kritano-data-export.zip';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      const msg = error.response?.data?.error || 'Failed to download export';
      toast(msg, 'error');
    }
  };

  const handleRequestDeletion = async () => {
    try {
      setRequestingDeletion(true);
      const response = await accountApi.requestAccountDeletion(deletePassword, deleteConfirmText);
      toast('Account deletion scheduled. You can cancel at any time.', 'success');
      setShowDeleteModal(false);
      setDeletePassword('');
      setDeleteConfirmText('');
      // Update the user object locally
      if (user) {
        (user as any).deletionScheduledFor = response.data.scheduledFor;
      }
      // Force re-render
      window.location.reload();
    } catch (error: any) {
      const msg = error.response?.data?.error || 'Failed to schedule deletion';
      toast(msg, 'error');
    } finally {
      setRequestingDeletion(false);
    }
  };

  const handleCancelDeletion = async () => {
    try {
      setCancellingDeletion(true);
      await accountApi.cancelAccountDeletion();
      toast('Account deletion cancelled. Your account is active again.', 'success');
      window.location.reload();
    } catch (error: any) {
      const msg = error.response?.data?.error || 'Failed to cancel deletion';
      toast(msg, 'error');
    } finally {
      setCancellingDeletion(false);
    }
  };

  const loadLinkedProviders = async () => {
    try {
      const response = await authApi.getLinkedProviders();
      setLinkedProviders(response.data.providers);
      setHasPasswordSet(response.data.hasPassword);
    } catch (error) {
      console.error('Failed to load linked providers:', error);
    } finally {
      setLoadingProviders(false);
    }
  };

  const handleConnectProvider = async (provider: 'google' | 'facebook') => {
    try {
      setConnectingProvider(provider);
      const response = await authApi.getOAuthUrl(provider, 'link');
      window.location.href = response.data.url;
    } catch {
      toast('Failed to start connection. Please try again.', 'error');
      setConnectingProvider(null);
    }
  };

  const handleUnlinkProvider = async (provider: string) => {
    if (!confirm(`Are you sure you want to disconnect your ${provider === 'google' ? 'Google' : 'Facebook'} account?`)) {
      return;
    }

    try {
      setUnlinkingProvider(provider);
      await authApi.unlinkProvider(provider);
      toast(`${provider === 'google' ? 'Google' : 'Facebook'} account disconnected.`, 'success');
      await loadLinkedProviders();
    } catch (error: any) {
      const msg = error.response?.data?.error || 'Failed to disconnect account';
      toast(msg, 'error');
    } finally {
      setUnlinkingProvider(null);
    }
  };

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
  }, [toast, refreshSubscription]); // eslint - toast and refreshSubscription are stable refs

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
      await authApi.changePassword(currentPassword, newPassword);
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
    <>
      <Helmet>
        <title>Profile | Kritano</title>
        <meta name="description" content="Manage your Kritano profile settings, account details, and notification preferences." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="space-y-8">
      {/* Account Information */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
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
              <p className="text-slate-500 dark:text-slate-500">{user.email}</p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3 text-sm">
              <User className="w-5 h-5 text-slate-500" />
              <div>
                <p className="text-slate-500 dark:text-slate-500">Full Name</p>
                <p className="text-slate-900 dark:text-white font-medium">
                  {user.firstName} {user.lastName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <Mail className="w-5 h-5 text-slate-500" />
              <div>
                <p className="text-slate-500 dark:text-slate-500">Email</p>
                <p className="text-slate-900 dark:text-white font-medium">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <Calendar className="w-5 h-5 text-slate-500" />
              <div>
                <p className="text-slate-500 dark:text-slate-500">Member Since</p>
                <p className="text-slate-900 dark:text-white font-medium">{createdDate}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <Shield className="w-5 h-5 text-slate-500" />
              <div>
                <p className="text-slate-500 dark:text-slate-500">Email Verified</p>
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
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Subscription Plan</h2>
              <p className="text-sm text-slate-500 dark:text-slate-500 mt-0.5">
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
                    className={`relative rounded-lg border-2 p-5 transition-all ${
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
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-500'
                      }`}>
                        {plan.icon}
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{plan.name}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-500">{plan.description}</p>
                    </div>

                    <div className="mb-4">
                      <span className="text-2xl font-bold text-slate-900 dark:text-white">{plan.price}</span>
                      {plan.priceDetail && (
                        <span className="text-sm text-slate-500 dark:text-slate-500 ml-1">/{plan.priceDetail}</span>
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
                        <li className="text-slate-500 dark:text-slate-500 text-xs">
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
                  <span className="text-slate-500 dark:text-slate-500">Sites</span>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {limits.maxSites === null ? 'Unlimited' : limits.maxSites}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-500">Audits/month</span>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {limits.maxAuditsPerMonth === null ? 'Unlimited' : limits.maxAuditsPerMonth}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-500">Pages/audit</span>
                  <p className="font-medium text-slate-900 dark:text-white">{limits.maxPagesPerAudit}</p>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-500">Concurrent audits</span>
                  <p className="font-medium text-slate-900 dark:text-white">{limits.concurrentAudits}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Connected Accounts */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Connected Accounts</h2>
          <p className="text-sm text-slate-500 dark:text-slate-500 mt-0.5">
            Link social accounts for faster sign-in
          </p>
        </div>

        <div className="p-6 space-y-4">
          {loadingProviders ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
            </div>
          ) : (
            <>
              {/* Google */}
              {(() => {
                const googleLink = linkedProviders.find(p => p.provider === 'google');
                return (
                  <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">Google</p>
                        <p className="text-sm text-slate-500 dark:text-slate-500">
                          {googleLink ? googleLink.email || 'Connected' : 'Not connected'}
                        </p>
                      </div>
                    </div>
                    {googleLink ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnlinkProvider('google')}
                        isLoading={unlinkingProvider === 'google'}
                        disabled={unlinkingProvider !== null}
                        className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
                      >
                        <Unlink className="w-4 h-4 mr-1.5" />
                        Disconnect
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleConnectProvider('google')}
                        isLoading={connectingProvider === 'google'}
                        disabled={connectingProvider !== null}
                      >
                        <Link2 className="w-4 h-4 mr-1.5" />
                        Connect
                      </Button>
                    )}
                  </div>
                );
              })()}

              {/* Facebook */}
              {(() => {
                const facebookLink = linkedProviders.find(p => p.provider === 'facebook');
                return (
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#1877F2] flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">Facebook</p>
                        <p className="text-sm text-slate-500 dark:text-slate-500">
                          {facebookLink ? facebookLink.email || 'Connected' : 'Not connected'}
                        </p>
                      </div>
                    </div>
                    {facebookLink ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnlinkProvider('facebook')}
                        isLoading={unlinkingProvider === 'facebook'}
                        disabled={unlinkingProvider !== null}
                        className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
                      >
                        <Unlink className="w-4 h-4 mr-1.5" />
                        Disconnect
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleConnectProvider('facebook')}
                        isLoading={connectingProvider === 'facebook'}
                        disabled={connectingProvider !== null}
                      >
                        <Link2 className="w-4 h-4 mr-1.5" />
                        Connect
                      </Button>
                    )}
                  </div>
                );
              })()}

              {!hasPasswordSet && linkedProviders.length > 0 && (
                <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <p className="text-sm text-amber-800 dark:text-amber-400">
                    You're signed in with social accounts only. Set a password below to add email/password sign-in as a backup.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
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

      {/* Download My Data */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Download My Data</h2>
          <p className="text-sm text-slate-500 dark:text-slate-500 mt-0.5">
            Export a copy of all your Kritano data
          </p>
        </div>

        <div className="p-6">
          {exportStatus?.status === 'pending' || exportStatus?.status === 'processing' ? (
            <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
              <span>Your data export is being prepared. You will be notified when it is ready.</span>
            </div>
          ) : exportStatus?.status === 'completed' && exportStatus.expiresAt && new Date(exportStatus.expiresAt) > new Date() ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-emerald-600 dark:text-emerald-400">
                <Check className="w-5 h-5" />
                <span>
                  Your data export is ready ({exportStatus.fileSizeBytes ? `${(exportStatus.fileSizeBytes / 1024).toFixed(0)} KB` : 'ready'}).
                  Expires {new Date(exportStatus.expiresAt).toLocaleString()}.
                </span>
              </div>
              <div className="flex gap-3">
                <Button variant="primary" size="sm" onClick={handleDownloadExport}>
                  <Download className="w-4 h-4 mr-1.5" />
                  Download Export
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowExportModal(true)}>
                  Request New Export
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-slate-600 dark:text-slate-500">
                Download a ZIP file containing all your account data, audit results, site configurations, and preferences in JSON format.
              </p>
              <Button variant="outline" size="sm" onClick={() => setShowExportModal(true)}>
                <Download className="w-4 h-4 mr-1.5" />
                Download My Data
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Export Password Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Confirm Data Export</h3>
              <button onClick={() => { setShowExportModal(false); setExportPassword(''); }} className="text-slate-500 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-500 mb-4">
              Enter your password to confirm this data export request.
            </p>
            <input
              type="password"
              value={exportPassword}
              onChange={(e) => setExportPassword(e.target.value)}
              placeholder="Enter your password"
              className="block w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-colors mb-4"
              onKeyDown={(e) => e.key === 'Enter' && exportPassword && handleRequestExport()}
            />
            <div className="flex justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => { setShowExportModal(false); setExportPassword(''); }}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleRequestExport}
                disabled={!exportPassword}
                isLoading={requestingExport}
              >
                Start Export
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-red-200 dark:border-red-900/50 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10">
          <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">Delete Account</h2>
        </div>

        <div className="p-6">
          {user.deletionScheduledFor ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-800 dark:text-red-300">
                    Your account is scheduled for deletion on{' '}
                    {new Date(user.deletionScheduledFor).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'long', day: 'numeric',
                    })}
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                    All your data will be permanently removed after this date. You can cancel at any time before then.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelDeletion}
                isLoading={cancellingDeletion}
              >
                Cancel Deletion
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-slate-600 dark:text-slate-500">
                Permanently delete your account and all associated data. There is a 30-day grace period during which you can cancel.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteModal(true)}
                className="border-red-500 text-red-600 hover:bg-red-50 dark:border-red-500 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                <Trash2 className="w-4 h-4 mr-1.5" />
                Delete Account
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">Delete Your Account</h3>
              <button onClick={() => { setShowDeleteModal(false); setDeletePassword(''); setDeleteConfirmText(''); }} className="text-slate-500 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-800 dark:text-red-300">
                  This will schedule your account for permanent deletion in 30 days. All your sites, audits, and data will be removed.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Enter your password"
                  className="block w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Type <span className="font-mono text-red-600">DELETE MY ACCOUNT</span> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE MY ACCOUNT"
                  className="block w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-colors font-mono"
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" size="sm" onClick={() => { setShowDeleteModal(false); setDeletePassword(''); setDeleteConfirmText(''); }}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleRequestDeletion}
                  disabled={!deletePassword || deleteConfirmText !== 'DELETE MY ACCOUNT'}
                  isLoading={requestingDeletion}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete My Account
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
