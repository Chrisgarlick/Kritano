import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { RegisterForm } from '../../components/auth/RegisterForm';
import { earlyAccessApi, comingSoonApi } from '../../services/api';
import { Sparkles, Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const eaParam = searchParams.get('ea');
  const isEarlyAccess = !!eaParam;

  const [eaStatus, setEaStatus] = useState<{ loading: boolean; isFull: boolean; spotsRemaining: number; maxSpots: number }>({
    loading: isEarlyAccess,
    isFull: false,
    spotsRemaining: 0,
    maxSpots: 250,
  });
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);
  const [waitlistError, setWaitlistError] = useState('');

  useEffect(() => {
    if (!isEarlyAccess) return;
    earlyAccessApi.getStatus()
      .then((res) => {
        setEaStatus({
          loading: false,
          isFull: res.data.isFull,
          spotsRemaining: res.data.spotsRemaining,
          maxSpots: res.data.maxSpots,
        });
      })
      .catch(() => {
        setEaStatus({ loading: false, isFull: false, spotsRemaining: 0, maxSpots: 250 });
      });
  }, [isEarlyAccess]);

  const handleWaitlistSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setWaitlistError('');
    try {
      await comingSoonApi.signup({ email: waitlistEmail });
      setWaitlistSubmitted(true);
    } catch {
      setWaitlistError('Failed to sign up. Please try again.');
    }
  };

  // Loading state for early access check
  if (isEarlyAccess && eaStatus.loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
      </main>
    );
  }

  // Early access is full - show waitlist
  if (isEarlyAccess && eaStatus.isFull) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
        <Helmet>
          <title>Early Access Full | Kritano</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <p className="text-3xl font-display text-indigo-600 dark:text-indigo-400">Kritano</p>
            <h1 className="mt-4 text-xl font-semibold text-slate-900 dark:text-white">Early Access is Full</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              All founding member spots have been claimed. Join the waitlist and we'll notify you when we launch.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            {waitlistSubmitted ? (
              <div className="text-center">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="text-slate-900 dark:text-white font-medium">You're on the list!</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">We'll let you know when we launch.</p>
              </div>
            ) : (
              <form onSubmit={handleWaitlistSignup} className="space-y-4">
                <div>
                  <label htmlFor="waitlist-email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Email address
                  </label>
                  <input
                    id="waitlist-email"
                    type="email"
                    required
                    value={waitlistEmail}
                    onChange={(e) => setWaitlistEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    placeholder="you@example.com"
                  />
                </div>
                {waitlistError && <p className="text-sm text-red-600 dark:text-red-400">{waitlistError}</p>}
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition"
                >
                  Join the Waitlist
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      <Helmet>
        <title>{isEarlyAccess ? 'Early Access' : 'Create Account'} | Kritano</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <p className="text-3xl font-display text-indigo-600 dark:text-indigo-400">Kritano</p>
          {isEarlyAccess ? (
            <>
              <h1 className="mt-4 text-xl font-semibold text-slate-900 dark:text-white flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                Claim Your Early Access
              </h1>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                {eaStatus.spotsRemaining} of {eaStatus.maxSpots} founding member spots remaining
              </p>
            </>
          ) : (
            <>
              <h1 className="mt-4 text-xl font-semibold text-slate-900 dark:text-white">Create your account</h1>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Start scanning websites for SEO, accessibility, and security issues
              </p>
            </>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <RegisterForm />
        </div>
      </div>
    </main>
  );
}
