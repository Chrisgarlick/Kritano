/**
 * BlogCTA - Mode-aware call-to-action block for the bottom of blog posts.
 *
 * Adapts messaging and action based on site mode:
 * - Waitlist: "Want to try Kritano?" + email signup form
 * - Early Access: "Kritano is in early access" + founding member benefits + EA link
 * - Live: "Ready to audit your website?" + register link
 */

import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useSiteMode } from '../../contexts/SiteModeContext';
import { InlineSignup } from '../public/InlineSignup';

export function BlogCTA() {
  const mode = useSiteMode();

  if (mode === 'waitlist') {
    return (
      <div className="mt-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-8 md:p-10 text-center">
        <h3 className="font-display text-2xl text-slate-900 dark:text-white mb-3">
          Want to try Kritano when it launches?
        </h3>
        <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-lg mx-auto">
          We're building a website auditing platform that covers accessibility, SEO, security, performance, content quality, and AI readiness - all in one scan. Join the waitlist to be first in.
        </p>
        <div className="flex justify-center">
          <InlineSignup variant="blog" />
        </div>
      </div>
    );
  }

  if (mode === 'early_access') {
    return (
      <div className="mt-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-8 md:p-10 text-center">
        <h3 className="font-display text-2xl text-slate-900 dark:text-white mb-3">
          Kritano is in early access
        </h3>
        <p className="text-slate-600 dark:text-slate-400 mb-4 max-w-lg mx-auto">
          Join as a founding member and get a 30-day Agency trial plus 50% off for life.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/register?ea=email"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
          >
            Join Early Access
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold rounded-lg transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  // Live mode
  return (
    <div className="mt-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-8 md:p-10 text-center">
      <h3 className="font-display text-2xl text-slate-900 dark:text-white mb-3">
        Ready to audit your website?
      </h3>
      <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-lg mx-auto">
        Kritano scans your site for SEO, accessibility, security, and performance issues.
      </p>
      <Link
        to="/register"
        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
      >
        Start Free Audit
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
