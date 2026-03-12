/**
 * Cookie Preferences Modal
 *
 * Granular toggle controls for each cookie category.
 * Accessible with focus trap, keyboard navigation, and ARIA attributes.
 */

import { useState, useEffect, useRef } from 'react';
import { useCookieConsent } from '../../contexts/CookieConsentContext';
import { X } from 'lucide-react';
import type { CookieCategoryInfo } from '../../types/consent.types';

const CATEGORIES: Array<{ key: 'necessary' | 'analytics' | 'marketing'; info: CookieCategoryInfo }> = [
  {
    key: 'necessary',
    info: {
      label: 'Strictly Necessary',
      description: 'Essential for security, authentication, and core functionality. Cannot be disabled.',
      required: true,
      cookies: ['access_token', 'refresh_token', 'csrf_token'],
    },
  },
  {
    key: 'analytics',
    info: {
      label: 'Analytics',
      description: 'Help us understand how visitors use PagePulser by collecting anonymous usage data.',
      required: false,
      cookies: ['_ga', '_gid', '_gat'],
    },
  },
  {
    key: 'marketing',
    info: {
      label: 'Marketing',
      description: 'Used to deliver relevant ads and track campaign effectiveness.',
      required: false,
      cookies: ['_fbp', '_gcl_au'],
    },
  },
];

export default function CookiePreferencesModal() {
  const { consent, rejectAll, savePreferences, closePreferences } = useCookieConsent();
  const [analytics, setAnalytics] = useState(consent?.categories.analytics ?? false);
  const [marketing, setMarketing] = useState(consent?.categories.marketing ?? false);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Focus trap & escape key
  useEffect(() => {
    closeRef.current?.focus();

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closePreferences();
        return;
      }

      // Focus trap
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [role="switch"], [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [closePreferences]);

  // Prevent body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleSave = () => {
    savePreferences({ analytics, marketing });
  };

  const handleRejectAll = () => {
    rejectAll();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={closePreferences}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="Cookie preferences"
        className="relative bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-0">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Cookie Preferences</h2>
          <button
            ref={closeRef}
            onClick={closePreferences}
            aria-label="Close cookie preferences"
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Description */}
        <p className="text-sm text-slate-500 dark:text-slate-400 px-6 mt-3 leading-relaxed">
          We use cookies and similar technologies to help personalise content and provide a better experience.
          You can manage your preferences below.
        </p>

        {/* Categories */}
        <div className="p-6 space-y-3">
          {CATEGORIES.map(({ key, info }) => {
            const isOn = key === 'necessary' ? true : key === 'analytics' ? analytics : marketing;
            const toggle = key === 'analytics' ? setAnalytics : key === 'marketing' ? setMarketing : null;

            return (
              <div
                key={key}
                className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700"
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    id={`cookie-cat-${key}`}
                    className="text-sm font-medium text-slate-900 dark:text-white"
                  >
                    {info.label}
                  </span>

                  {info.required ? (
                    <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                      Always On
                    </span>
                  ) : (
                    <button
                      role="switch"
                      aria-checked={isOn}
                      aria-labelledby={`cookie-cat-${key}`}
                      onClick={() => toggle?.(!isOn)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                        isOn ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          isOn ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  )}
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {info.description}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">
                  Cookies: {info.cookies.join(', ')}
                </p>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2">
          <button
            onClick={handleRejectAll}
            className="text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 px-4 py-2 rounded-lg transition-colors"
          >
            Reject All
          </button>
          <button
            onClick={handleSave}
            className="text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg transition-colors"
          >
            Save Preferences
          </button>
        </div>

        <p className="px-6 pb-4 text-xs text-slate-400 dark:text-slate-500 text-center">
          You can change your preferences at any time from the footer.
        </p>
      </div>
    </div>
  );
}
