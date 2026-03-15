/**
 * Notification Settings
 *
 * User-facing email preference management.
 * Allows toggling individual email categories and a master unsubscribe.
 */

import { useState, useEffect } from 'react';
import { useToast } from '../../components/ui/Toast';
import { emailPreferencesApi } from '../../services/api';
import type { EmailPreferences } from '../../services/api';
import {
  Bell,
  BellOff,
  Mail,
  BarChart3,
  Lightbulb,
  Megaphone,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

interface PreferenceToggle {
  key: keyof Pick<EmailPreferences, 'audit_notifications' | 'product_updates' | 'educational' | 'marketing'>;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const PREFERENCE_TOGGLES: PreferenceToggle[] = [
  {
    key: 'audit_notifications',
    label: 'Audit Notifications',
    description: 'Get notified when your audits complete, including score summaries and key findings.',
    icon: <BarChart3 className="w-5 h-5" />,
  },
  {
    key: 'product_updates',
    label: 'Product Updates',
    description: 'New features, improvements, and changes to PagePulser.',
    icon: <Bell className="w-5 h-5" />,
  },
  {
    key: 'educational',
    label: 'Tips & Education',
    description: 'SEO tips, best practices, and guides to help improve your site scores.',
    icon: <Lightbulb className="w-5 h-5" />,
  },
  {
    key: 'marketing',
    label: 'Promotions & Offers',
    description: 'Special offers, plan upgrades, and promotional announcements.',
    icon: <Megaphone className="w-5 h-5" />,
  },
];

export default function NotificationSettings() {
  const [preferences, setPreferences] = useState<EmailPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await emailPreferencesApi.getMyPreferences();
      setPreferences(data.preferences);
    } catch {
      setError('Failed to load email preferences.');
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (key: string, value: boolean) => {
    if (!preferences) return;

    const prev = { ...preferences };
    setPreferences({ ...preferences, [key]: value });

    try {
      setSaving(true);
      const { data } = await emailPreferencesApi.updateMyPreferences({ [key]: value });
      setPreferences(data.preferences);
      toast('Preferences updated', 'success');
    } catch {
      setPreferences(prev);
      toast('Failed to update preferences', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUnsubscribeAll = async () => {
    if (!preferences) return;
    const newValue = !preferences.unsubscribed_all;
    const msg = newValue
      ? 'This will stop all non-essential emails. You will still receive critical account emails (password resets, security alerts).'
      : 'This will re-enable your previous email preferences.';
    if (!confirm(msg)) return;

    const prev = { ...preferences };
    setPreferences({ ...preferences, unsubscribed_all: newValue });

    try {
      setSaving(true);
      const { data } = await emailPreferencesApi.updateMyPreferences({ unsubscribed_all: newValue });
      setPreferences(data.preferences);
      toast(
        newValue ? 'Unsubscribed from all marketing emails' : 'Email preferences re-enabled',
        'success'
      );
    } catch {
      setPreferences(prev);
      toast('Failed to update preferences', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (error || !preferences) {
    return (
      <div className="text-center py-16">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
        <p className="text-slate-600 dark:text-slate-500 mb-4">{error || 'Something went wrong.'}</p>
        <button
          onClick={loadPreferences}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Email Notifications</h2>
        <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
          Choose which emails you'd like to receive. Essential account emails (password resets, security alerts) are always sent.
        </p>
      </div>

      {/* Master unsubscribe warning */}
      {preferences.unsubscribed_all && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg">
          <BellOff className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              All non-essential emails are paused
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-400 mt-0.5">
              You won't receive any of the emails below until you re-enable notifications.
            </p>
          </div>
        </div>
      )}

      {/* Individual toggles */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg divide-y divide-slate-200 dark:divide-slate-700">
        {PREFERENCE_TOGGLES.map((toggle) => {
          const isEnabled = preferences[toggle.key] && !preferences.unsubscribed_all;
          return (
            <div key={toggle.key} className="flex items-center justify-between p-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className={`mt-0.5 shrink-0 ${isEnabled ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-500'}`}>
                  {toggle.icon}
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-medium ${isEnabled ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-500'}`}>
                    {toggle.label}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">
                    {toggle.description}
                  </p>
                </div>
              </div>
              <button
                onClick={() => updatePreference(toggle.key, !preferences[toggle.key])}
                disabled={saving || preferences.unsubscribed_all}
                className={`
                  relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out
                  focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:ring-offset-2 dark:focus:ring-offset-slate-800
                  disabled:opacity-50 disabled:cursor-not-allowed
                  ${isEnabled ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-600'}
                `}
                role="switch"
                aria-checked={isEnabled}
              >
                <span
                  className={`
                    pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                    ${isEnabled ? 'translate-x-5' : 'translate-x-0'}
                  `}
                />
              </button>
            </div>
          );
        })}
      </div>

      {/* Transactional info */}
      <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg">
        <Mail className="w-5 h-5 text-slate-500 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Essential Account Emails
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">
            Password resets, email verification, and security alerts are always sent regardless of your preferences.
          </p>
        </div>
      </div>

      {/* Master unsubscribe toggle */}
      <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
        <button
          onClick={handleUnsubscribeAll}
          disabled={saving}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
            ${preferences.unsubscribed_all
              ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
              : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300'
            }
            disabled:opacity-50
          `}
        >
          {preferences.unsubscribed_all ? (
            <>
              <Bell className="w-4 h-4" />
              Re-enable All Notifications
            </>
          ) : (
            <>
              <BellOff className="w-4 h-4" />
              Unsubscribe from All
            </>
          )}
        </button>
      </div>
    </div>
  );
}
