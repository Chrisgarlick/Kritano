/**
 * 500 Server Error Page
 *
 * Displayed when an unexpected server error occurs.
 * Features auto-retry countdown and error reporting.
 */

import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Home, RefreshCw, AlertCircle, MessageSquare } from 'lucide-react';
import { Display, Body } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';

interface ServerErrorPageProps {
  /** Optional error message to display */
  error?: string;
  /** Whether to show auto-retry countdown */
  autoRetry?: boolean;
  /** Auto-retry delay in seconds */
  retryDelay?: number;
}

export default function ServerErrorPage({
  error,
  autoRetry = true,
  retryDelay = 30,
}: ServerErrorPageProps) {
  const [countdown, setCountdown] = useState(retryDelay);
  const [isRetrying, setIsRetrying] = useState(false);

  // Auto-retry countdown
  useEffect(() => {
    if (!autoRetry || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleRetry();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoRetry]);

  const handleRetry = () => {
    setIsRetrying(true);
    // Try to reload the current page
    window.location.reload();
  };

  const handleReportIssue = () => {
    // Open GitHub issues page or support email
    window.location.href = '/contact';
  };

  return (
    <>
      <Helmet><title>Server Error | Kritano</title></Helmet>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center px-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-red-500/5 dark:bg-red-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-slate-500/5 dark:bg-slate-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-lg w-full text-center">
        {/* Broken line illustration */}
        <div className="mb-8 flex justify-center">
          <div className="relative w-64 h-32">
            <svg
              className="w-full h-full"
              viewBox="0 0 256 100"
              preserveAspectRatio="none"
            >
              {/* Left segment - working */}
              <path
                d="M0,50 L60,50 L70,20 L80,80 L90,50 L100,50"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-indigo-500/50 dark:text-indigo-400/50"
              />

              {/* Gap - broken */}
              <circle
                cx="120"
                cy="50"
                r="4"
                className="text-red-500 fill-current animate-pulse"
              />
              <circle
                cx="136"
                cy="50"
                r="4"
                className="text-red-500 fill-current animate-pulse"
                style={{ animationDelay: '150ms' }}
              />

              {/* Right segment - flatline */}
              <path
                d="M156,50 L256,50"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                className="text-slate-300 dark:text-slate-600"
              />
            </svg>

            {/* Error badge */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-sm font-medium">
                <AlertCircle className="w-4 h-4" />
                500
              </div>
            </div>
          </div>
        </div>

        {/* Message */}
        <Display size="md" className="text-slate-900 dark:text-white mb-4">
          Something went wrong
        </Display>

        <Body size="lg" muted className="mb-6 max-w-md mx-auto">
          We encountered an unexpected error. Our team has been notified and is working on it.
        </Body>

        {/* Error details (if provided) */}
        {error && (
          <div className="mb-6 p-4 bg-slate-100 dark:bg-slate-900 rounded-lg text-left max-w-md mx-auto">
            <Body size="sm" className="font-mono text-slate-600 dark:text-slate-500 break-all">
              {error}
            </Body>
          </div>
        )}

        {/* Auto-retry countdown */}
        {autoRetry && countdown > 0 && !isRetrying && (
          <div className="mb-8 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg max-w-sm mx-auto">
            <Body size="sm" className="text-indigo-700 dark:text-indigo-300">
              Automatically retrying in{' '}
              <span className="font-semibold tabular-nums">{countdown}</span>{' '}
              second{countdown !== 1 ? 's' : ''}...
            </Body>
            <div className="mt-2 h-1 bg-indigo-200 dark:bg-indigo-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 transition-all duration-1000 ease-linear"
                style={{ width: `${((retryDelay - countdown) / retryDelay) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Button
            variant="primary"
            onClick={handleRetry}
            disabled={isRetrying}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
            {isRetrying ? 'Retrying...' : 'Try Again'}
          </Button>

          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <Home className="w-4 h-4" />
            Dashboard
          </Link>

          <Button
            variant="ghost"
            onClick={handleReportIssue}
            className="gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            Report Issue
          </Button>
        </div>

        {/* Status info */}
        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
          <Body size="sm" muted>
            If this problem persists, please{' '}
            <a
              href="mailto:support@kritano.com"
              className="text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              contact support
            </a>
            .
          </Body>
        </div>
      </div>
    </div>
    </>
  );
}
