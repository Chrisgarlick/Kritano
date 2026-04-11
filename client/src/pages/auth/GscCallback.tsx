import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Loader2, AlertCircle } from 'lucide-react';

export default function GscCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const state = params.get('state');
      const errorParam = params.get('error');

      if (errorParam) {
        setError(errorParam === 'access_denied'
          ? 'Authorization was cancelled.'
          : `Authorization failed: ${errorParam}`
        );
        return;
      }

      if (!code || !state) {
        setError('Missing authorization parameters.');
        return;
      }

      // State format: "gsc:<siteId>"
      const siteId = state.replace('gsc:', '');
      if (!siteId) {
        setError('Invalid state parameter.');
        return;
      }

      try {
        await api.post('/gsc/callback', { code, siteId });
        navigate('/search-console', { replace: true });
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to connect Search Console.');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-8 text-center">
          {error ? (
            <>
              <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
              <h1 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Connection Failed</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">{error}</p>
              <button
                onClick={() => navigate('/search-console', { replace: true })}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Back to Search Console
              </button>
            </>
          ) : (
            <>
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
              <p className="text-sm text-slate-600 dark:text-slate-400">Connecting Search Console...</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
