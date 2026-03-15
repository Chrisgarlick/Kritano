import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { authApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import type { AxiosError } from 'axios';
import type { ErrorResponse } from '../../types/auth.types';

export default function OAuthCallbackPage() {
  const { provider } = useParams<{ provider: string }>();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const state = params.get('state');
      const errorParam = params.get('error');

      if (errorParam) {
        setError(errorParam === 'access_denied'
          ? 'Authorization was cancelled. Please try again.'
          : `Authorization failed: ${errorParam}`
        );
        return;
      }

      if (!code || !state || !provider) {
        setError('Missing authorization parameters. Please try again.');
        return;
      }

      // Check if this is a link operation (state ends with :link)
      const isLinkMode = state.endsWith(':link');

      try {
        if (isLinkMode) {
          await authApi.linkProvider(provider, code, state);
          await refreshUser();
          navigate('/settings/profile', { replace: true });
        } else {
          await authApi.oauthCallback(provider, code, state);
          await refreshUser();
          navigate('/dashboard', { replace: true });
        }
      } catch (err) {
        const axiosError = err as AxiosError<ErrorResponse>;
        const errorData = axiosError.response?.data;
        setError(errorData?.error || 'Authentication failed. Please try again.');
      }
    };

    handleCallback();
  }, [provider, navigate, refreshUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 py-12 px-4">
      <Helmet>
        <title>Authenticating... | PagePulser</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="max-w-md w-full text-center">
        <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-8">PagePulser</p>

        {error ? (
          <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="text-red-600 dark:text-red-400 mb-4">
              <svg className="w-12 h-12 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="text-lg font-semibold">Authentication Failed</p>
            </div>
            <p className="text-slate-600 dark:text-slate-500 mb-6">{error}</p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Back to Sign In
            </Link>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto mb-4" />
            <p className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              Completing sign in...
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-500">
              Please wait while we verify your account.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
