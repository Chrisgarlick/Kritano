import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { Sidebar } from './Sidebar';
import { FeedbackButton } from '../feedback/FeedbackButton';
import SkipLink from '../a11y/SkipLink';
import { Clock, ArrowRight } from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, subscription } = useAuth();
  useKeyboardShortcuts();

  const isTrialing = subscription?.status === 'trialing';
  const daysRemaining = subscription?.daysRemaining ?? null;

  // Color shifts: indigo (>3 days), amber (<=3 days), red (0 days)
  const trialBannerClasses = daysRemaining !== null && daysRemaining <= 0
    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
    : daysRemaining !== null && daysRemaining <= 3
    ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200'
    : 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-200';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
      <SkipLink />
      <Sidebar />

      <main id="main-content" className="flex-1 min-w-0">
        <div className="max-w-7xl mx-auto pt-14 pb-8 md:py-8 px-4 sm:px-6 lg:px-8">
          {!user?.emailVerified && (
            <div className="mb-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-lg">
              <p className="text-amber-800 dark:text-amber-200 text-sm">
                Please verify your email address to access all features.
              </p>
            </div>
          )}

          {isTrialing && daysRemaining !== null && (
            <div className={`mb-6 border p-4 rounded-lg flex items-center justify-between ${trialBannerClasses}`}>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 flex-shrink-0" />
                <p className="text-sm font-medium">
                  {daysRemaining <= 0
                    ? 'Your trial has expired. Upgrade to keep your features.'
                    : `${daysRemaining} day${daysRemaining === 1 ? '' : 's'} left in your ${subscription?.tier} trial.`
                  }
                </p>
              </div>
              <Link
                to="/settings/profile"
                className="flex items-center gap-1 text-sm font-medium hover:underline flex-shrink-0"
              >
                Upgrade <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {children}
        </div>
      </main>

      {/* Feedback Button - Always visible */}
      <FeedbackButton />
    </div>
  );
}
