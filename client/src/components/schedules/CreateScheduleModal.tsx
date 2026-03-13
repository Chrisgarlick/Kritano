import { useState, useEffect } from 'react';
import { X, CalendarClock, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { schedulesApi, type CreateSchedulePayload, type ScheduleFrequency } from '../../services/api';
import { useToast } from '../ui/Toast';

interface CreateScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  tier?: string;
}

const FREQUENCY_OPTIONS: Array<{
  value: ScheduleFrequency;
  label: string;
  description: string;
  icon: string;
  minTier: string;
}> = [
  { value: 'monthly', label: 'Monthly', description: '1st of each month', icon: '📅', minTier: 'starter' },
  { value: 'biweekly', label: 'Biweekly', description: 'Every 2 weeks', icon: '📆', minTier: 'starter' },
  { value: 'weekly', label: 'Weekly', description: 'Once a week', icon: '🗓️', minTier: 'starter' },
  { value: 'daily', label: 'Daily', description: 'Every day', icon: '⏰', minTier: 'pro' },
  { value: 'custom', label: 'Custom', description: 'Cron expression', icon: '⚙️', minTier: 'agency' },
];

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIER_RANK: Record<string, number> = { free: 0, starter: 1, pro: 2, agency: 3, enterprise: 4 };

export function CreateScheduleModal({ isOpen, onClose, onCreated, tier = 'free' }: CreateScheduleModalProps) {
  const { toast } = useToast();
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [frequency, setFrequency] = useState<ScheduleFrequency>('weekly');
  const [dayOfWeek, setDayOfWeek] = useState(1); // Monday
  const [hourOfDay, setHourOfDay] = useState(6);
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [cronExpression, setCronExpression] = useState('');
  const [notifyCompletion, setNotifyCompletion] = useState(true);
  const [notifyFailure, setNotifyFailure] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setUrl('');
      setName('');
      setFrequency('weekly');
      setDayOfWeek(1);
      setHourOfDay(6);
      setError('');
    }
  }, [isOpen]);

  const userTierRank = TIER_RANK[tier] ?? 0;

  const canUseFrequency = (minTier: string) => {
    return (TIER_RANK[minTier] ?? 0) <= userTierRank;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const payload: CreateSchedulePayload = {
        targetUrl: url,
        name: name || undefined,
        frequency,
        dayOfWeek,
        hourOfDay,
        timezone,
        notifyOnCompletion: notifyCompletion,
        notifyOnFailure: notifyFailure,
      };

      if (frequency === 'custom') {
        payload.cronExpression = cronExpression;
      }

      await schedulesApi.create(payload);
      toast('Schedule created successfully', 'success');
      onCreated();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to create schedule';
      setError(msg);
      toast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-lg max-h-[90vh] overflow-y-auto mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">New Schedule</h2>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          {/* URL */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Website URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              required
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Domain must be verified</p>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Schedule Name <span className="text-slate-400">(optional)</span></label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Weekly SEO check"
              maxLength={255}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Frequency */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Frequency</label>
            <div className="grid grid-cols-2 gap-2">
              {FREQUENCY_OPTIONS.map((opt) => {
                const allowed = canUseFrequency(opt.minTier);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={!allowed}
                    onClick={() => allowed && setFrequency(opt.value)}
                    className={`
                      relative flex flex-col items-start p-3 rounded-lg border text-left transition-all
                      ${frequency === opt.value
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 ring-2 ring-indigo-500/20'
                        : allowed
                          ? 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 bg-white dark:bg-slate-900'
                          : 'border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 opacity-50 cursor-not-allowed'
                      }
                    `}
                  >
                    <span className="text-sm font-medium text-slate-900 dark:text-white">{opt.label}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{opt.description}</span>
                    {!allowed && (
                      <span className="absolute top-1 right-1 text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-medium">
                        {opt.minTier}+
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom cron */}
          {frequency === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cron Expression</label>
              <input
                type="text"
                value={cronExpression}
                onChange={(e) => setCronExpression(e.target.value)}
                placeholder="0 6 * * 1"
                required
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md text-sm font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          )}

          {/* Day / Hour pickers (not for daily/custom) */}
          {frequency !== 'custom' && frequency !== 'daily' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Day</label>
                <select
                  value={dayOfWeek}
                  onChange={(e) => setDayOfWeek(parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md text-sm text-slate-900 dark:text-white"
                >
                  {DAYS.map((d, i) => (
                    <option key={i} value={i}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Time</label>
                <select
                  value={hourOfDay}
                  onChange={(e) => setHourOfDay(parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md text-sm text-slate-900 dark:text-white"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>{String(i).padStart(2, '0')}:00</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Hour picker for daily */}
          {frequency === 'daily' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Time</label>
              <select
                value={hourOfDay}
                onChange={(e) => setHourOfDay(parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md text-sm text-slate-900 dark:text-white"
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>{String(i).padStart(2, '0')}:00</option>
                ))}
              </select>
            </div>
          )}

          {/* Timezone */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Timezone</label>
            <input
              type="text"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Advanced */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              Advanced Options
            </button>
            {showAdvanced && (
              <div className="mt-3 space-y-3 pl-2 border-l-2 border-slate-200 dark:border-slate-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyCompletion}
                    onChange={(e) => setNotifyCompletion(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">Notify on completion</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyFailure}
                    onChange={(e) => setNotifyFailure(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">Notify on failure</span>
                </label>
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Zap className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <CalendarClock className="w-4 h-4" />
                  Create Schedule
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
