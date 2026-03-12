/**
 * Cookie Consent Banner
 *
 * Full-width bottom banner shown on first visit.
 * GDPR-compliant with Accept All, Reject All, and Manage Preferences.
 */

import { useEffect, useRef, useState } from 'react';
import { useCookieConsent } from '../../contexts/CookieConsentContext';
import { Shield } from 'lucide-react';

export default function CookieBanner() {
  const { acceptAll, rejectAll, openPreferences } = useCookieConsent();
  const [visible, setVisible] = useState(false);
  const acceptRef = useRef<HTMLButtonElement>(null);

  // Slide-up animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Focus the Accept All button on mount
  useEffect(() => {
    if (visible && acceptRef.current) {
      acceptRef.current.focus();
    }
  }, [visible]);

  // Escape key = Reject All
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') rejectAll();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [rejectAll]);

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className={`fixed bottom-0 inset-x-0 z-[60] bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 shadow-lg transform transition-transform duration-300 ease-out ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                We use cookies to improve your experience
              </h2>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              We use essential cookies for security and authentication. With your permission,
              we'd also like to use analytics cookies to understand how you use PagePulser so we can make it better.{' '}
              <a href="/privacy" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                Privacy Policy
              </a>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto flex-shrink-0">
            <button
              onClick={openPreferences}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors px-3 py-2 order-3 sm:order-1"
            >
              Manage Preferences
            </button>
            <button
              onClick={rejectAll}
              className="text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 px-4 py-2 rounded-lg transition-colors order-2"
            >
              Reject All
            </button>
            <button
              ref={acceptRef}
              onClick={acceptAll}
              className="text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg transition-colors order-1 sm:order-3"
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
