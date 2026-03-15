import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../../../components/layout/AdminLayout';
import { adminSettingsApi } from '../../../services/api';
import { Settings, Eye, Loader2, Save, ExternalLink, Zap, Rocket } from 'lucide-react';

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
  const [comingSoonEnabled, setComingSoonEnabled] = useState(false);
  const [headline, setHeadline] = useState('');
  const [description, setDescription] = useState('');
  const [triggerSettings, setTriggerSettings] = useState<Record<string, boolean>>({});
  const [earlyAccessEnabled, setEarlyAccessEnabled] = useState(false);
  const [earlyAccessMaxSpots, setEarlyAccessMaxSpots] = useState(200);
  const [earlyAccessDiscount, setEarlyAccessDiscount] = useState(50);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await adminSettingsApi.getAll();
      const s = res.data.settings;
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
      setEarlyAccessMaxSpots(Number(s.early_access_max_spots) || 200);
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight flex items-center space-x-2" style={{ fontFamily: "'Instrument Serif', serif" }}>
              <Settings className="w-6 h-6" />
              <span>System Settings</span>
            </h1>
            <p className="text-slate-500 mt-1">Manage app-wide configuration</p>
          </div>
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

        {/* Early Access */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center space-x-2">
                <Rocket className="w-5 h-5 text-amber-400" />
                <span>Early Access</span>
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                When enabled, users can claim founding member spots via <code className="text-xs bg-white/[0.06] px-1 py-0.5 rounded">/register?ea=email</code> or <code className="text-xs bg-white/[0.06] px-1 py-0.5 rounded">/register?ea=social</code>.
              </p>
            </div>
            <button
              onClick={async () => {
                const newValue = !earlyAccessEnabled;
                setEarlyAccessEnabled(newValue);
                await saveSetting('early_access_enabled', newValue);
              }}
              disabled={saving}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                earlyAccessEnabled ? 'bg-indigo-600' : 'bg-slate-600'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  earlyAccessEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
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
              <label className="block text-sm font-medium text-slate-300 mb-1">Discount %</label>
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

        {/* Coming Soon Mode */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Coming Soon Mode</h2>
              <p className="text-sm text-slate-500 mt-1">
                When enabled, all public pages show a coming soon landing page with email capture.
                Admin routes remain accessible.
              </p>
            </div>
            <button
              onClick={handleToggle}
              disabled={saving}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                comingSoonEnabled ? 'bg-indigo-600' : 'bg-slate-600'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  comingSoonEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {comingSoonEnabled && (
            <div className="bg-amber-900/20 border border-amber-700/30 rounded-lg p-3 text-amber-300 text-sm">
              Coming Soon Mode is <strong>active</strong>. All public visitors see the landing page instead of the app.
            </div>
          )}

          <div className="border-t border-white/[0.06] pt-6 space-y-4">
            <h3 className="text-sm font-medium text-slate-300 uppercase tracking-wider">Landing Page Content</h3>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Headline</label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                placeholder="Something great is on its way."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 resize-none"
                placeholder="We're building something amazing..."
              />
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleSaveContent}
                disabled={saving}
                className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save Content</span>
              </button>
              <Link
                to="/admin/coming-soon"
                className="flex items-center space-x-2 px-4 py-2 bg-white/[0.06] hover:bg-white/[0.06] text-slate-200 text-sm font-medium rounded-lg transition"
              >
                <Eye className="w-4 h-4" />
                <span>View Signups</span>
              </Link>
            </div>
          </div>

          {/* Preview */}
          <div className="border-t border-white/[0.06] pt-6">
            <h3 className="text-sm font-medium text-slate-300 uppercase tracking-wider mb-3 flex items-center space-x-2">
              <Eye className="w-4 h-4" />
              <span>Preview</span>
            </h3>
            <div className="bg-white rounded-lg p-8 text-center space-y-4">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">P</span>
                </div>
                <span className="text-lg font-bold text-slate-900" style={{ fontFamily: "'Instrument Serif', serif" }}>
                  PagePulser
                </span>
              </div>
              <h2
                className="text-2xl font-bold text-slate-900"
                style={{ fontFamily: "'Instrument Serif', serif" }}
              >
                {headline || 'Something great is on its way.'}
              </h2>
              <p className="text-slate-600 text-sm max-w-sm mx-auto">
                {description || 'Your description will appear here...'}
              </p>
              <div className="flex justify-center">
                <div className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg">
                  <ExternalLink className="w-4 h-4" />
                  <span>Notify me</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
