import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../../../components/layout/AdminLayout';
import { adminSettingsApi } from '../../../services/api';
import { Settings, Eye, Loader2, Save, ExternalLink, Zap, Rocket, Globe } from 'lucide-react';

const TRIGGER_TOGGLES: { key: string; label: string; description: string }[] = [
  { key: 'trigger_auto_send_first_audit_complete', label: 'First Audit Complete', description: 'Welcome email after first audit' },
  { key: 'trigger_auto_send_stalled_verification', label: 'Stalled Verification', description: 'Domain verification reminder after 48h' },
  { key: 'trigger_auto_send_security_alert', label: 'Security Alert', description: 'Critical security issue notification' },
  { key: 'trigger_auto_send_upgrade_nudge', label: 'Upgrade Nudge', description: 'Notification when hitting tier limits' },
  { key: 'trigger_auto_send_low_aeo_score', label: 'Low AEO Score', description: 'AEO improvement guide when score < 40' },
  { key: 'trigger_auto_send_low_content_score', label: 'Low Content Score', description: 'Content improvement guide when score < 40' },
  { key: 'trigger_auto_send_churn_risk', label: 'Churn Risk', description: 'Win-back email for disengaging users' },
  { key: 'trigger_auto_send_score_improvement', label: 'Score Improvement', description: 'Celebration when score improves 20+ points' },
];

export default function SystemSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingTrigger, setSavingTrigger] = useState<string | null>(null);

  // Local form state
  const [siteMode, setSiteMode] = useState<'waitlist' | 'early_access' | 'live'>('live');
  const [comingSoonEnabled, setComingSoonEnabled] = useState(false);
  const [headline, setHeadline] = useState('');
  const [description, setDescription] = useState('');
  const [triggerSettings, setTriggerSettings] = useState<Record<string, boolean>>({});
  const [earlyAccessEnabled, setEarlyAccessEnabled] = useState(false);
  const [earlyAccessMaxSpots, setEarlyAccessMaxSpots] = useState(250);
  const [earlyAccessDiscount, setEarlyAccessDiscount] = useState(50);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await adminSettingsApi.getAll();
      const s = res.data.settings;
      const mode = s.site_mode as string;
      if (mode === 'waitlist' || mode === 'early_access' || mode === 'live') setSiteMode(mode);
      setComingSoonEnabled(s.coming_soon_enabled === true);
      setHeadline((s.coming_soon_headline as string) || '');
      setDescription((s.coming_soon_description as string) || '');

      // Load trigger toggle states
      const triggers: Record<string, boolean> = {};
      for (const t of TRIGGER_TOGGLES) {
        triggers[t.key] = s[t.key] === true || s[t.key] === 'true';
      }
      setTriggerSettings(triggers);

      // Load early access settings
      setEarlyAccessEnabled(s.early_access_enabled === true || s.early_access_enabled === 'true');
      setEarlyAccessMaxSpots(Number(s.early_access_max_spots) || 250);
      setEarlyAccessDiscount(Number(s.early_access_discount_percent) || 50);
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveSetting = async (key: string, value: unknown) => {
    setSaving(true);
    try {
      await adminSettingsApi.update(key, value);
      sessionStorage.removeItem('coming_soon_status');
      sessionStorage.removeItem('kritano-site-mode');
    } catch (err) {
      console.error('Failed to save setting:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async () => {
    const newValue = !comingSoonEnabled;
    setComingSoonEnabled(newValue);
    await saveSetting('coming_soon_enabled', newValue);
  };

  const handleSaveContent = async () => {
    await saveSetting('coming_soon_headline', headline);
    await saveSetting('coming_soon_description', description);
  };

  const handleTriggerToggle = async (key: string) => {
    const newValue = !triggerSettings[key];
    setTriggerSettings(prev => ({ ...prev, [key]: newValue }));
    setSavingTrigger(key);
    try {
      await adminSettingsApi.update(key, newValue);
    } catch (err) {
      console.error('Failed to save trigger setting:', err);
      // Revert on error
      setTriggerSettings(prev => ({ ...prev, [key]: !newValue }));
    } finally {
      setSavingTrigger(null);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Helmet><title>Admin: System Settings | Kritano</title></Helmet>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight flex items-center space-x-2 font-display">
              <Settings className="w-6 h-6" />
              <span>System Settings</span>
            </h1>
            <p className="text-slate-500 mt-1">Manage app-wide configuration</p>
          </div>
        </div>

        {/* Site Mode */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center space-x-2">
              <Globe className="w-5 h-5 text-indigo-400" />
              <span>Site Mode</span>
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Controls which version of the public website visitors see.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {([
              { value: 'waitlist' as const, label: 'Waitlist', desc: 'Marketing site visible, no pricing. CTAs drive to waitlist signup. Blog accessible.' },
              { value: 'early_access' as const, label: 'Early Access', desc: 'Full site with pricing. Founding members can sign in. New users join early access.' },
              { value: 'live' as const, label: 'Live', desc: 'Full site, standard registration open to everyone.' },
            ]).map((option) => (
              <button
                key={option.value}
                onClick={async () => {
                  setSiteMode(option.value);
                  await saveSetting('site_mode', option.value);
                }}
                disabled={saving}
                className={`text-left p-4 rounded-lg border transition-colors ${
                  siteMode === option.value
                    ? 'border-indigo-500 bg-indigo-500/10'
                    : 'border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15]'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-3 h-3 rounded-full ${
                    siteMode === option.value ? 'bg-indigo-500' : 'bg-slate-600'
                  }`} />
                  <span className="text-sm font-semibold text-white">{option.label}</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{option.desc}</p>
              </button>
            ))}
          </div>

          {siteMode === 'waitlist' && (
            <div className="bg-amber-900/20 border border-amber-700/30 rounded-lg p-3 text-amber-300 text-sm">
              <strong>Waitlist mode active.</strong> Public visitors see the full marketing site with waitlist CTAs. Pricing and sign-in are hidden.
            </div>
          )}
          {siteMode === 'early_access' && (
            <div className="bg-indigo-900/20 border border-indigo-700/30 rounded-lg p-3 text-indigo-300 text-sm">
              <strong>Early Access mode active.</strong> Founding members can sign in and use the app. New visitors see the marketing site with early access CTAs.
            </div>
          )}
        </div>

        {/* Trigger Automation */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center space-x-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <span>Trigger Automation</span>
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              When enabled, CRM triggers automatically send their mapped email template to the user.
              Disabled triggers create pending records for manual review.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TRIGGER_TOGGLES.map((t) => (
              <div
                key={t.key}
                className="flex items-center justify-between p-3 bg-white/[0.02] rounded-lg border border-white/[0.04]"
              >
                <div className="mr-3">
                  <p className="text-sm font-medium text-white">{t.label}</p>
                  <p className="text-xs text-slate-500">{t.description}</p>
                </div>
                <button
                  onClick={() => handleTriggerToggle(t.key)}
                  disabled={savingTrigger === t.key}
                  className={`relative inline-flex h-6 w-10 flex-shrink-0 items-center rounded-full transition-colors ${
                    triggerSettings[t.key] ? 'bg-indigo-600' : 'bg-slate-600'
                  }`}
                >
                  {savingTrigger === t.key ? (
                    <Loader2 className="w-3 h-3 animate-spin text-white mx-auto" />
                  ) : (
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        triggerSettings[t.key] ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Early Access Config */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center space-x-2">
              <Rocket className="w-5 h-5 text-amber-400" />
              <span>Early Access Campaign</span>
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {siteMode === 'early_access'
                ? 'Early access is active. Founding members register via the public site.'
                : 'Configure the early access campaign. Set site mode to "Early Access" above to activate.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Max Spots</label>
              <input
                type="number"
                value={earlyAccessMaxSpots}
                onChange={(e) => setEarlyAccessMaxSpots(Number(e.target.value))}
                onBlur={() => saveSetting('early_access_max_spots', earlyAccessMaxSpots)}
                min={1}
                className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Lifetime Discount %</label>
              <input
                type="number"
                value={earlyAccessDiscount}
                onChange={(e) => setEarlyAccessDiscount(Number(e.target.value))}
                onBlur={() => saveSetting('early_access_discount_percent', earlyAccessDiscount)}
                min={0}
                max={100}
                className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <Link
              to="/admin/early-access"
              className="flex items-center space-x-2 text-sm text-indigo-400 hover:text-indigo-300 transition"
            >
              <ExternalLink className="w-4 h-4" />
              <span>View Early Access Dashboard</span>
            </Link>
          </div>
        </div>

        {/* Waitlist Signups Link */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center space-x-2">
                <Eye className="w-5 h-5 text-slate-400" />
                <span>Waitlist Signups</span>
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                View and manage email signups from the waitlist.
              </p>
            </div>
            <Link
              to="/admin/coming-soon"
              className="flex items-center space-x-2 px-4 py-2 bg-white/[0.06] hover:bg-white/[0.10] text-slate-200 text-sm font-medium rounded-lg transition"
            >
              <ExternalLink className="w-4 h-4" />
              <span>View Signups</span>
            </Link>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
