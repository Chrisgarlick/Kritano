import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Gift, Copy, Check, Send, Users, Award, Clock, XCircle } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';
import { referralsApi } from '../../services/api';

interface ReferralStats {
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

interface ReferralItem {
  id: string;
  referred_email: string;
  referred_name: string;
  status: string;
  referrer_reward_value: number | null;
  created_at: string;
  qualified_at: string | null;
  rewarded_at: string | null;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: Clock },
  qualified: { label: 'Qualified', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: Check },
  rewarded: { label: 'Rewarded', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: Award },
  voided: { label: 'Voided', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
};

export default function ReferralDashboard() {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [referrals, setReferrals] = useState<ReferralItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [inviteEmails, setInviteEmails] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState<{ sent: number; errors: string[] } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [statsRes, listRes] = await Promise.all([
        referralsApi.getStats(),
        referralsApi.list(1, 20),
      ]);
      setStats(statsRes.data.stats);
      setReferrals(listRes.data.referrals);
    } catch (err) {
      console.error('Failed to load referral data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function copyLink() {
    if (!stats) return;
    await navigator.clipboard.writeText(stats.referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleInvite() {
    const emails = inviteEmails.split(',').map(e => e.trim()).filter(Boolean);
    if (emails.length === 0 || emails.length > 5) return;

    setInviting(true);
    setInviteResult(null);
    try {
      const res = await referralsApi.invite(emails);
      setInviteResult(res.data);
      if (res.data.sent > 0) {
        setInviteEmails('');
        loadData();
      }
    } catch (err) {
      console.error('Failed to send invites:', err);
    } finally {
      setInviting(false);
    }
  }

  // Milestone progress
  const qualifiedCount = stats ? stats.rewardedCount + stats.qualifiedCount : 0;
  const nextMilestone = qualifiedCount < 5 ? 5 : qualifiedCount < 10 ? 10 : null;

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Helmet><title>Referrals - PagePulser</title></Helmet>
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8 max-w-5xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Referrals</h1>
          <p className="text-slate-500 dark:text-slate-500 mt-1">
            Invite friends and earn bonus audits for every successful referral.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : stats ? (
          <div className="space-y-6">
            {/* Referral Link Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                  <Gift className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Your Referral Link</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-500">Share this link to earn bonus audits</p>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-sm text-slate-700 dark:text-slate-300 font-mono truncate">
                  {stats.referralLink}
                </div>
                <Button onClick={copyLink} variant="secondary" className="flex-shrink-0">
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  <span className="ml-2">{copied ? 'Copied' : 'Copy'}</span>
                </Button>
              </div>
              {/* Social sharing */}
              <div className="flex items-center gap-2 mt-3">
                <span className="text-xs text-slate-500 dark:text-slate-400">Share via:</span>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent('I use PagePulser to audit my website for accessibility, SEO, and security issues — try it free:')}&url=${encodeURIComponent(stats.referralLink)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                  Twitter
                </a>
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(stats.referralLink)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                  LinkedIn
                </a>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent('Check out PagePulser — it finds accessibility, SEO, and security issues on your website: ' + stats.referralLink)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                  WhatsApp
                </a>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Total Referred" value={stats.totalReferred} icon={Users} />
              <StatCard label="Rewarded" value={stats.rewardedCount} icon={Award} color="emerald" />
              <StatCard label="Bonus Audits Earned" value={stats.totalBonusAuditsEarned} icon={Gift} color="indigo" />
              <StatCard label="Bonus Audits Left" value={stats.bonusAuditsRemaining} icon={Gift} color="amber" />
            </div>

            {/* Milestone Progress */}
            {nextMilestone && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-6">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">
                  Milestone Progress
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-500 mb-3">
                  {nextMilestone === 5
                    ? 'Reach 5 qualified referrals for a free month of Starter!'
                    : 'Reach 10 qualified referrals for a free month of Pro!'}
                </p>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5">
                  <div
                    className="bg-indigo-600 h-2.5 rounded-full transition-all"
                    style={{ width: `${Math.min((qualifiedCount / nextMilestone) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                  {qualifiedCount} / {nextMilestone} referrals
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-3">
                  A referral qualifies when the invited user <strong className="text-slate-600 dark:text-slate-300">verifies their email</strong> and <strong className="text-slate-600 dark:text-slate-300">completes their first audit</strong>.
                </p>
              </div>
            )}

            {/* Invite by Email */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-6">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <Send className="w-4 h-4" />
                Invite by Email
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-500 mb-4">
                Enter up to 5 email addresses separated by commas.
              </p>
              <div className="flex gap-2">
                <Input
                  value={inviteEmails}
                  onChange={(e) => setInviteEmails(e.target.value)}
                  placeholder="friend@example.com, colleague@example.com"
                  className="flex-1"
                />
                <Button onClick={handleInvite} isLoading={inviting} disabled={!inviteEmails.trim()}>
                  Send Invites
                </Button>
              </div>
              {inviteResult && (
                <div className="mt-3">
                  {inviteResult.sent > 0 && (
                    <Alert variant="success">{inviteResult.sent} invite(s) sent successfully!</Alert>
                  )}
                  {inviteResult.errors.length > 0 && (
                    <Alert variant="warning" className="mt-2">
                      {inviteResult.errors.join(', ')}
                    </Alert>
                  )}
                </div>
              )}
            </div>

            {/* Referrals Table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Your Referrals</h3>
              </div>
              {referrals.length === 0 ? (
                <div className="px-6 py-12 text-center text-slate-500 dark:text-slate-500">
                  No referrals yet. Share your link to get started!
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                        <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-500 px-6 py-3">User</th>
                        <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-500 px-6 py-3">Status</th>
                        <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-500 px-6 py-3">Reward</th>
                        <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-500 px-6 py-3">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {referrals.map((ref) => {
                        const status = statusConfig[ref.status] || statusConfig.pending;
                        const StatusIcon = status.icon;
                        return (
                          <tr key={ref.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                            <td className="px-6 py-3">
                              <div className="text-sm font-medium text-slate-900 dark:text-white">{ref.referred_name}</div>
                              <div className="text-xs text-slate-500 dark:text-slate-500">{ref.referred_email}</div>
                            </td>
                            <td className="px-6 py-3">
                              <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${status.color}`}>
                                <StatusIcon className="w-3 h-3" />
                                {status.label}
                              </span>
                            </td>
                            <td className="px-6 py-3 text-sm text-slate-700 dark:text-slate-300">
                              {ref.referrer_reward_value ? `+${ref.referrer_reward_value} audits` : '-'}
                            </td>
                            <td className="px-6 py-3 text-sm text-slate-500 dark:text-slate-500">
                              {new Date(ref.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* How It Works */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-6">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">How It Works</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <Step number={1} title="Share Your Link" description="Send your unique referral link to friends and colleagues." />
                <Step number={2} title="They Sign Up" description="Your friend creates an account and verifies their email." />
                <Step number={3} title="Both Get Rewarded" description="Once they complete their first audit, you both get bonus audits!" />
              </div>
            </div>
          </div>
        ) : (
          <Alert variant="error">Failed to load referral data. Please try again.</Alert>
        )}
      </main>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color = 'slate' }: { label: string; value: number; icon: React.ElementType; color?: string }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 text-${color}-500`} />
        <span className="text-xs font-medium text-slate-500 dark:text-slate-500">{label}</span>
      </div>
      <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}

function Step({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
        <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{number}</span>
      </div>
      <div>
        <h4 className="text-sm font-medium text-slate-900 dark:text-white">{title}</h4>
        <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">{description}</p>
      </div>
    </div>
  );
}
