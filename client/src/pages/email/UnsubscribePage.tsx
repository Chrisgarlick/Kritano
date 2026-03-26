/**
 * Unsubscribe Page
 *
 * Public page that processes one-click unsubscribe via signed token.
 * Accessed from email footer "Unsubscribe" links.
 */

import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams, Link } from 'react-router-dom';
import { emailPreferencesApi } from '../../services/api';
import {
  MailX,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Settings,
  ArrowLeft,
} from 'lucide-react';

type Status = 'processing' | 'success' | 'error' | 'no-token';

export default function UnsubscribePage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<Status>('processing');
  const [message, setMessage] = useState('');

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('no-token');
      return;
    }

    processUnsubscribe(token);
  }, [token]);

  const processUnsubscribe = async (t: string) => {
    try {
      setStatus('processing');
      const { data } = await emailPreferencesApi.unsubscribeWithToken(t);
      setMessage(data.message);
      setStatus('success');
    } catch {
      setStatus('error');
      setMessage('Unable to process your unsubscribe request. The link may have expired or already been used.');
    }
  };

  return (
    <>
      <Helmet><title>Unsubscribe | PagePulser</title></Helmet>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            PagePulser
          </h1>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-8">
          {status === 'processing' && (
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Processing...
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-500">
                Updating your email preferences.
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Unsubscribed
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-500 mb-6">
                {message || 'You have been unsubscribed from all marketing emails. You will still receive essential account emails.'}
              </p>

              <div className="space-y-3">
                {token && (
                  <Link
                    to={`/email/preferences?token=${encodeURIComponent(token)}`}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 rounded-lg text-sm font-medium transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Manage Preferences
                  </Link>
                )}
                <Link
                  to="/"
                  className="flex items-center justify-center gap-2 w-full px-4 py-2 text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-sm transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to PagePulser
                </Link>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Something Went Wrong
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-500 mb-6">
                {message}
              </p>

              <div className="space-y-3">
                {token && (
                  <button
                    onClick={() => processUnsubscribe(token)}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Try Again
                  </button>
                )}
                <Link
                  to="/settings/notifications"
                  className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 rounded-lg text-sm font-medium transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Manage Preferences (requires login)
                </Link>
                <Link
                  to="/"
                  className="flex items-center justify-center gap-2 w-full px-4 py-2 text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-sm transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to PagePulser
                </Link>
              </div>
            </div>
          )}

          {status === 'no-token' && (
            <div className="text-center">
              <MailX className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Invalid Link
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-500 mb-6">
                This unsubscribe link is missing required information. Please use the link from your email, or manage your preferences from your account settings.
              </p>

              <div className="space-y-3">
                <Link
                  to="/settings/notifications"
                  className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Manage Preferences (requires login)
                </Link>
                <Link
                  to="/"
                  className="flex items-center justify-center gap-2 w-full px-4 py-2 text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-sm transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to PagePulser
                </Link>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-500 dark:text-slate-500 mt-6">
          &copy; {new Date().getFullYear()} PagePulser. All rights reserved.
        </p>
      </div>
    </div>
    </>
  );
}
