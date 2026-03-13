import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Mail, CheckCircle, Loader2 } from 'lucide-react';
import { comingSoonApi } from '../services/api';

interface ComingSoonProps {
  headline: string;
  description: string;
}

export default function ComingSoon({ headline, description }: ComingSoonProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    setErrorMsg('');

    try {
      await comingSoonApi.signup({ email, name: name || undefined });
      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.response?.data?.error || 'Something went wrong. Please try again.');
    }
  };

  return (
    <>
      <Helmet>
        <title>PagePulser - Coming Soon</title>
      </Helmet>
      <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col items-center justify-center px-4 relative overflow-hidden">
        {/* Background gradient accent */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-indigo-100 dark:bg-indigo-950/30 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-amber-50 dark:bg-amber-950/20 blur-3xl" />
        </div>

        <div className="relative z-10 max-w-lg w-full text-center space-y-8">
          {/* Logo */}
          <div className="flex items-center justify-center space-x-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <span className="text-2xl font-bold text-slate-900 dark:text-white" style={{ fontFamily: "'Instrument Serif', serif" }}>
              PagePulser
            </span>
          </div>

          {/* Headline */}
          <h1
            className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white leading-tight"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            {headline}
          </h1>

          {/* Description */}
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            {description}
          </p>

          {/* Email form */}
          {status === 'success' ? (
            <div className="flex items-center justify-center space-x-2 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg py-4 px-6">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Thanks! We'll let you know when we launch.</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3 max-w-sm mx-auto">
              <div>
                <input
                  type="text"
                  placeholder="Your name (optional)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
              </div>
              <div>
                <input
                  type="email"
                  placeholder="you@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
              </div>
              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium rounded-lg transition"
              >
                {status === 'loading' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Mail className="w-5 h-5" />
                    <span>Notify me</span>
                  </>
                )}
              </button>
              {status === 'error' && (
                <p className="text-sm text-red-600 dark:text-red-400">{errorMsg}</p>
              )}
            </form>
          )}

          {/* Footer */}
          <p className="text-sm text-slate-400 dark:text-slate-600 pt-8">
            &copy; {new Date().getFullYear()} PagePulser. All rights reserved.
          </p>
        </div>
      </div>
    </>
  );
}
