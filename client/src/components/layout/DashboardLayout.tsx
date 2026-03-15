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
  const { showHelp, setShowHelp } = useKeyboardShortcuts();

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

      {/* Keyboard Shortcuts Help Modal */}
      {showHelp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowHelp(false)}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-6 max-w-sm w-full mx-4"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Keyboard Shortcuts</h2>
            <dl className="space-y-3 text-sm">
              {[
                ['n', 'New audit'],
                ['/', 'Focus search'],
                ['Esc', 'Close / unfocus'],
                ['?', 'Show this help'],
              ].map(([key, desc]) => (
                <div key={key} className="flex items-center justify-between">
                  <dt className="text-slate-500 dark:text-slate-500">{desc}</dt>
                  <dd>
                    <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-xs font-mono text-slate-700 dark:text-slate-300">
                      {key}
                    </kbd>
                  </dd>
                </div>
              ))}
            </dl>
            <button
              onClick={() => setShowHelp(false)}
              className="mt-5 w-full text-center text-sm text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
            >
              Press <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-xs font-mono">Esc</kbd> to close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
