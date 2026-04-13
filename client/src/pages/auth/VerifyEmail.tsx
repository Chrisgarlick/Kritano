import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { authApi } from '../../services/api';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link. No token provided.');
      return;
    }

    let cancelled = false;

    authApi
      .verifyEmail(token)
      .then(() => {
        if (!cancelled) {
          setStatus('success');
          setMessage('Your email has been verified successfully!');
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setStatus('error');
          const msg = err.response?.data?.error || 'Verification failed. The link may have expired.';
          setMessage(msg);
        }
      });

    return () => { cancelled = true; };
  }, [token]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
      <Helmet>
        <title>Verify Email - Kritano</title>
      </Helmet>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Verifying your email...</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Please wait while we verify your email address.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Email Verified</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">{message}</p>
            <Link
              to="/app/dashboard"
              className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition"
            >
              Go to Dashboard
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Verification Failed</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">{message}</p>
            <Link
              to="/login"
              className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition"
            >
              Go to Login
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
