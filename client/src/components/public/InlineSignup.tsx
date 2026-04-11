/**
 * InlineSignup - Reusable email capture / CTA component that adapts to site mode.
 *
 * Waitlist mode: name + email form, submits to waitlist API
 * Early Access mode: "Join Early Access" button linking to /register?ea=email
 * Live mode: "Get Started" button linking to /register
 *
 * Variants: hero (large), inline (medium), footer (compact), blog (card style)
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Loader2, Mail, ArrowRight } from 'lucide-react';
import { useSiteMode } from '../../contexts/SiteModeContext';
import { comingSoonApi } from '../../services/api';

interface InlineSignupProps {
  variant?: 'hero' | 'inline' | 'footer' | 'blog';
}

export function InlineSignup({ variant = 'inline' }: InlineSignupProps) {
  const mode = useSiteMode();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    setError('');
    try {
      await comingSoonApi.signup({ email, name: name || undefined });
      setStatus('success');
    } catch (err: unknown) {
      setStatus('error');
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
        : undefined;
      setError(msg || 'Something went wrong. Please try again.');
    }
  };

  // Early Access mode: show register button
  if (mode === 'early_access') {
    const isHero = variant === 'hero';
    return (
      <div className={`flex ${isHero ? 'flex-col sm:flex-row' : 'flex-row'} gap-3 ${isHero ? 'justify-center' : ''}`}>
        <Link
          to="/register?ea=email"
          className={`inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors ${
            isHero ? 'px-8 py-4 text-lg' : 'px-6 py-3'
          }`}
        >
          Join Early Access
          <ArrowRight className={isHero ? 'w-5 h-5' : 'w-4 h-4'} />
        </Link>
        <Link
          to="/login"
          className={`inline-flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium rounded-lg transition-colors ${
            isHero ? 'px-8 py-4 text-lg' : 'px-6 py-3'
          }`}
        >
          Sign In
        </Link>
      </div>
    );
  }

  // Live mode: show standard register button
  if (mode === 'live') {
    const isHero = variant === 'hero';
    return (
      <div className={`flex ${isHero ? 'flex-col sm:flex-row' : 'flex-row'} gap-3 ${isHero ? 'justify-center' : ''}`}>
        <Link
          to="/register"
          className={`inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors ${
            isHero ? 'px-8 py-4 text-lg' : 'px-6 py-3'
          }`}
        >
          Start Free Audit
          <ArrowRight className={isHero ? 'w-5 h-5' : 'w-4 h-4'} />
        </Link>
        <Link
          to="/login"
          className={`inline-flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium rounded-lg transition-colors ${
            isHero ? 'px-8 py-4 text-lg' : 'px-6 py-3'
          }`}
        >
          Sign In
        </Link>
      </div>
    );
  }

  // Waitlist mode: email capture form
  if (status === 'success') {
    return (
      <div className="inline-flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-6 py-4 rounded-xl">
        <CheckCircle className="w-5 h-5 flex-shrink-0" />
        <span className="font-medium">You're on the list. We'll be in touch.</span>
      </div>
    );
  }

  const isHero = variant === 'hero';
  const isFooter = variant === 'footer';
  const isBlog = variant === 'blog';
  const isCompact = isFooter;

  return (
    <form onSubmit={handleSubmit} className={isCompact ? 'w-full' : isBlog ? 'w-full max-w-sm' : 'w-full max-w-md'}>
      <div className={`flex ${isCompact ? 'flex-row' : isBlog ? 'flex-col' : 'flex-col sm:flex-row'} gap-2`}>
        {!isCompact && (
          <input
            type="text"
            placeholder="Name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
          />
        )}
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={`flex-1 px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition ${
            isCompact ? 'min-w-0' : ''
          }`}
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className={`inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors whitespace-nowrap ${
            isHero ? 'px-8 py-3 text-lg' : 'px-6 py-3'
          }`}
        >
          {status === 'loading' ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Mail className="w-4 h-4" />
              <span>{isCompact ? 'Join' : 'Join the Waitlist'}</span>
            </>
          )}
        </button>
      </div>
      {status === 'error' && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </form>
  );
}
