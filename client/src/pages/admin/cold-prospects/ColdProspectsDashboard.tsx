import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  Crosshair, Globe, Mail, UserCheck, TrendingUp,
  ArrowRight, Settings, Upload, FileJson, Loader2, RefreshCw,
  Send, Pause, Play, Eye, MousePointerClick,
} from 'lucide-react';
import { AdminLayout } from '../../../components/layout/AdminLayout';
import {
  coldProspectsApi,
  type ColdProspectStats,
  type ColdProspectSettings,
  type ColdProspectDailyStats,
  type OutreachStats,
  type OutreachSend,
} from '../../../services/api';
import { useToast } from '../../../components/ui/Toast';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-slate-600' },
  checking: { label: 'Checking', color: 'bg-indigo-600' },
  live: { label: 'Live', color: 'bg-sky-600' },
  extracting: { label: 'Extracting', color: 'bg-violet-600' },
  qualified: { label: 'Qualified', color: 'bg-emerald-600' },
  contacted: { label: 'Contacted', color: 'bg-amber-600' },
  converted: { label: 'Converted', color: 'bg-green-600' },
  dead: { label: 'Dead', color: 'bg-red-900' },
};

const SEND_STATUS_COLORS: Record<string, string> = {
  queued: 'text-slate-500',
  sending: 'text-amber-400',
  sent: 'text-emerald-400',
  failed: 'text-red-400',
  bounced: 'text-red-500',
};

export default function ColdProspectsDashboard() {
  const { toast } = useToast();
  const [stats, setStats] = useState<ColdProspectStats | null>(null);
  const [settings, setSettings] = useState<ColdProspectSettings | null>(null);
  const [dailyStats, setDailyStats] = useState<ColdProspectDailyStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [csvContent, setCsvContent] = useState('');
  const [importing, setImporting] = useState(false);
  const [importingJson, setImportingJson] = useState(false);
  const [settingsForm, setSettingsForm] = useState<Partial<ColdProspectSettings>>({});
  const [savingSettings, setSavingSettings] = useState(false);

  // Outreach state
  const [outreachStats, setOutreachStats] = useState<OutreachStats | null>(null);
  const [outreachSends, setOutreachSends] = useState<OutreachSend[]>([]);
  const [outreachEnabled, setOutreachEnabled] = useState(false);
  const [triggeringOutreach, setTriggeringOutreach] = useState(false);
  const [togglingOutreach, setTogglingOutreach] = useState(false);
  const [showOutreach, setShowOutreach] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, settingsRes, dailyRes] = await Promise.all([
        coldProspectsApi.getStats(),
        coldProspectsApi.getSettings(),
        coldProspectsApi.getDailyStats(30),
      ]);
      setStats(statsRes.data.stats);
      setSettings(settingsRes.data.settings);
      setSettingsForm(settingsRes.data.settings);
      setDailyStats(dailyRes.data.stats);
      setOutreachEnabled(settingsRes.data.settings.autoOutreachEnabled || false);
    } catch {
      toast('Failed to load dashboard', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchOutreach = useCallback(async () => {
    try {
      const [statsRes, sendsRes] = await Promise.all([
        coldProspectsApi.getOutreachStats(),
        coldProspectsApi.getSends(1, 10),
      ]);
      setOutreachStats(statsRes.data.stats);
      setOutreachSends(sendsRes.data.sends);
    } catch {
      // Silent fail - outreach tables might not exist yet
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { if (showOutreach) fetchOutreach(); }, [showOutreach, fetchOutreach]);

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await coldProspectsApi.updateSettings(settingsForm);
      toast('Settings saved', 'success');
      fetchData();
    } catch {
      toast('Failed to save settings', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleImport = async () => {
    if (!csvContent.trim()) return;
    setImporting(true);
    try {
      const res = await coldProspectsApi.import(csvContent);
      toast(`Imported ${res.data.imported} domains (${res.data.duplicates} duplicates, ${res.data.errors} errors)`, 'success');
      setCsvContent('');
      setShowImport(false);
      fetchData();
    } catch {
      toast('Failed to import CSV', 'error');
    } finally {
      setImporting(false);
    }
  };

  const handleJsonImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportingJson(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const prospects = Array.isArray(data) ? data : [data];

      const res = await coldProspectsApi.importJson(prospects);
      toast(`Imported ${res.data.imported} prospects (${res.data.duplicates} duplicates, ${res.data.errors} errors)`, 'success');
      fetchData();
    } catch {
      toast('Failed to import JSON - check the file format', 'error');
    } finally {
      setImportingJson(false);
      e.target.value = '';
    }
  };

  const handleTriggerOutreach = async () => {
    setTriggeringOutreach(true);
    try {
      const res = await coldProspectsApi.triggerOutreach(25);
      toast(`Outreach: ${res.data.queued} queued, ${res.data.sent} sent, ${res.data.failed} failed`, 'success');
      fetchOutreach();
      fetchData();
    } catch {
      toast('Failed to trigger outreach', 'error');
    } finally {
      setTriggeringOutreach(false);
    }
  };

  const handleToggleOutreach = async () => {
    setTogglingOutreach(true);
    try {
      const res = await coldProspectsApi.pauseOutreach();
      setOutreachEnabled(res.data.enabled);
      toast(res.data.enabled ? 'Auto outreach enabled' : 'Auto outreach paused', 'success');
    } catch {
      toast('Failed to toggle outreach', 'error');
    } finally {
      setTogglingOutreach(false);
    }
  };

  // Simple bar chart for daily stats
  const maxImported = Math.max(...dailyStats.map(d => d.imported), 1);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Helmet><title>Admin: Cold Prospects | Kritano</title></Helmet>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Crosshair className="w-6 h-6 text-indigo-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight font-display">Cold Prospects</h1>
          </div>
          <div className="flex items-center gap-2">
            <label
              className={`flex items-center gap-2 px-3 py-2 text-sm bg-white/[0.06] text-slate-300 rounded-lg hover:bg-white/[0.06] transition-colors cursor-pointer ${importingJson ? 'opacity-50 pointer-events-none' : ''}`}
            >
              {importingJson ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileJson className="w-4 h-4" />}
              Import JSON
              <input
                type="file"
                accept=".json"
                onChange={handleJsonImport}
                className="hidden"
                disabled={importingJson}
              />
            </label>
            <button
              onClick={() => setShowImport(!showImport)}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-white/[0.06] text-slate-300 rounded-lg hover:bg-white/[0.06] transition-colors"
            >
              <Upload className="w-4 h-4" />
              Import CSV
            </button>
            <button
              onClick={() => { setShowOutreach(!showOutreach); }}
              className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                showOutreach ? 'bg-amber-600 text-white' : 'bg-white/[0.06] text-slate-300 hover:bg-white/[0.06]'
              }`}
            >
              <Send className="w-4 h-4" />
              Outreach
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-white/[0.06] text-slate-300 rounded-lg hover:bg-white/[0.06] transition-colors"
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>
            <button
              onClick={fetchData}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Import CSV panel */}
        {showImport && (
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-white mb-2">Manual CSV Import</h3>
            <p className="text-xs text-slate-500 mb-3">Paste domain names (one per line or CSV with domain column).</p>
            <textarea
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              placeholder="domain&#10;example.com&#10;mysite.co.uk"
              className="w-full h-32 bg-white/[0.03] border border-white/[0.06] rounded-lg p-3 text-sm text-white font-mono placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            <div className="flex justify-end gap-2 mt-3">
              <button onClick={() => { setShowImport(false); setCsvContent(''); }} className="px-3 py-1.5 text-sm text-slate-500 hover:text-white">
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={importing || !csvContent.trim()}
                className="flex items-center gap-2 px-4 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {importing && <Loader2 className="w-3 h-3 animate-spin" />}
                Import
              </button>
            </div>
          </div>
        )}

        {/* Outreach panel */}
        {showOutreach && (
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-6 mb-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-amber-400" />
                Email Outreach
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleToggleOutreach}
                  disabled={togglingOutreach}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg transition-colors ${
                    outreachEnabled
                      ? 'bg-amber-600/20 text-amber-400 border border-amber-600/30'
                      : 'bg-white/[0.06] text-slate-500 border border-white/[0.08]'
                  }`}
                >
                  {togglingOutreach ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : outreachEnabled ? (
                    <Pause className="w-3 h-3" />
                  ) : (
                    <Play className="w-3 h-3" />
                  )}
                  {outreachEnabled ? 'Auto: ON' : 'Auto: OFF'}
                </button>
                <button
                  onClick={handleTriggerOutreach}
                  disabled={triggeringOutreach}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {triggeringOutreach ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                  Send Batch
                </button>
              </div>
            </div>

            {/* Outreach stats */}
            {outreachStats && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  { label: 'Total Sent', value: outreachStats.sent, icon: Send, color: 'text-emerald-400' },
                  { label: 'Queued', value: outreachStats.queued, icon: Mail, color: 'text-amber-400' },
                  { label: 'Opened', value: outreachStats.opened, icon: Eye, color: 'text-sky-400' },
                  { label: 'Clicked', value: outreachStats.clicked, icon: MousePointerClick, color: 'text-indigo-400' },
                  { label: 'Today', value: outreachStats.sentToday, icon: TrendingUp, color: 'text-white' },
                ].map((s) => (
                  <div key={s.label} className="bg-white/[0.02] p-3 rounded-lg border border-white/[0.04]">
                    <div className="flex items-center gap-1.5 mb-1">
                      <s.icon className={`w-3 h-3 ${s.color}`} />
                      <span className="text-[10px] text-slate-500 uppercase">{s.label}</span>
                    </div>
                    <p className={`text-base font-bold ${s.color}`}>{s.value}</p>
                  </div>
                ))}
              </div>
            )}

            {outreachStats && (outreachStats.openRate > 0 || outreachStats.clickRate > 0) && (
              <div className="flex gap-4 text-xs text-slate-500">
                <span>Open rate: <strong className="text-white">{outreachStats.openRate}%</strong></span>
                <span>Click rate: <strong className="text-white">{outreachStats.clickRate}%</strong></span>
                <span>Unsubscribed: <strong className="text-white">{outreachStats.unsubscribed}</strong></span>
                <span>Failed: <strong className="text-red-400">{outreachStats.failed}</strong></span>
              </div>
            )}

            {/* Recent sends table */}
            {outreachSends.length > 0 && (
              <div>
                <h3 className="text-xs font-medium text-slate-500 uppercase mb-2">Recent Sends</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-slate-500 border-b border-white/[0.06]">
                        <th className="text-left py-2 pr-3">Domain</th>
                        <th className="text-left py-2 pr-3">To</th>
                        <th className="text-left py-2 pr-3">Template</th>
                        <th className="text-left py-2 pr-3">Status</th>
                        <th className="text-left py-2">Sent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {outreachSends.map((send) => (
                        <tr key={send.id} className="border-b border-slate-800">
                          <td className="py-2 pr-3 text-white">{send.domain}</td>
                          <td className="py-2 pr-3 text-slate-500">{send.to_email}</td>
                          <td className="py-2 pr-3 text-slate-500">{send.template_slug.replace('cold_outreach_', '')}</td>
                          <td className={`py-2 pr-3 font-medium ${SEND_STATUS_COLORS[send.status] || 'text-slate-500'}`}>
                            {send.status}
                          </td>
                          <td className="py-2 text-slate-500">
                            {send.sent_at ? new Date(send.sent_at).toLocaleDateString() : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {outreachSends.length === 0 && outreachStats && outreachStats.totalSends === 0 && (
              <p className="text-xs text-slate-500 text-center py-4">
                No outreach emails sent yet. Click "Send Batch" to start or enable auto outreach.
              </p>
            )}
          </div>
        )}

        {/* Stats cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
            {[
              { label: 'Total Domains', value: stats.total.toLocaleString(), icon: Globe, color: 'text-white' },
              { label: 'With Email', value: stats.withEmail.toLocaleString(), icon: Mail, color: 'text-emerald-400' },
              { label: 'With Name', value: stats.withName.toLocaleString(), icon: UserCheck, color: 'text-sky-400' },
              { label: 'Qualified', value: (stats.byStatus['qualified'] || 0).toLocaleString(), icon: Crosshair, color: 'text-indigo-400' },
              { label: 'Today Imported', value: stats.todayImported.toLocaleString(), icon: TrendingUp, color: 'text-amber-400' },
              { label: 'Conversion', value: `${stats.conversionRate}%`, icon: TrendingUp, color: 'text-green-400' },
            ].map((s) => (
              <div key={s.label} className="bg-white/[0.02] p-4 rounded-lg border border-white/[0.06]">
                <div className="flex items-center gap-2 mb-1">
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                  <span className="text-xs text-slate-500">{s.label}</span>
                </div>
                <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Pipeline funnel */}
        {stats && (
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-6 mb-6">
            <h2 className="text-sm font-semibold text-white mb-4">Pipeline Funnel</h2>
            <div className="flex items-center gap-1 overflow-x-auto pb-2">
              {['pending', 'checking', 'live', 'extracting', 'qualified', 'contacted', 'converted', 'dead'].map((status, idx) => {
                const count = stats.byStatus[status] || 0;
                const info = STATUS_LABELS[status];
                const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;

                return (
                  <div key={status} className="flex items-center">
                    <Link
                      to={`/admin/cold-prospects/list?status=${status}`}
                      className="flex flex-col items-center min-w-[80px] p-3 rounded-lg hover:bg-white/[0.04] transition-colors"
                    >
                      <div className={`w-10 h-10 rounded-full ${info.color} flex items-center justify-center mb-2`}>
                        <span className="text-xs font-bold text-white">{count > 999 ? `${(count / 1000).toFixed(1)}k` : count}</span>
                      </div>
                      <span className="text-xs text-slate-500">{info.label}</span>
                      <span className="text-[10px] text-slate-500">{pct}%</span>
                    </Link>
                    {idx < 7 && <ArrowRight className="w-3 h-3 text-slate-600 flex-shrink-0" />}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Daily stats chart */}
        {dailyStats.length > 0 && (
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-6 mb-6">
            <h2 className="text-sm font-semibold text-white mb-4">Daily Intake (Last 30 Days)</h2>
            <div className="flex items-end gap-[2px] h-32">
              {dailyStats.map((d) => {
                const height = Math.max(2, (d.imported / maxImported) * 100);
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center justify-end group relative">
                    <div
                      className="w-full bg-indigo-600 rounded-t hover:bg-indigo-500 transition-colors min-h-[2px]"
                      style={{ height: `${height}%` }}
                    />
                    <div className="absolute bottom-full mb-2 hidden group-hover:block bg-white/[0.03] border border-white/[0.06] rounded px-2 py-1 text-xs text-white whitespace-nowrap z-10">
                      {d.date}: {d.imported} imported, {d.qualified} qualified
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-[10px] text-slate-500">{dailyStats[0]?.date}</span>
              <span className="text-[10px] text-slate-500">{dailyStats[dailyStats.length - 1]?.date}</span>
            </div>
          </div>
        )}

        {/* Quick links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Link
            to="/admin/cold-prospects/list?status=qualified&hasEmail=true"
            className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-4 hover:border-indigo-500/50 transition-colors"
          >
            <h3 className="text-sm font-medium text-white mb-1">Qualified with Email</h3>
            <p className="text-xs text-slate-500">Ready for outreach - has verified email and good quality score</p>
            <span className="text-indigo-400 text-xs mt-2 inline-block">View prospects &rarr;</span>
          </Link>
          <Link
            to="/admin/cold-prospects/list?hasName=true&hasEmail=true"
            className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-4 hover:border-indigo-500/50 transition-colors"
          >
            <h3 className="text-sm font-medium text-white mb-1">With Name + Email</h3>
            <p className="text-xs text-slate-500">Best leads - has a person's name and email address</p>
            <span className="text-indigo-400 text-xs mt-2 inline-block">View prospects &rarr;</span>
          </Link>
          <Link
            to="/admin/cold-prospects/list"
            className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-4 hover:border-indigo-500/50 transition-colors"
          >
            <h3 className="text-sm font-medium text-white mb-1">All Prospects</h3>
            <p className="text-xs text-slate-500">Browse the full pipeline with filters</p>
            <span className="text-indigo-400 text-xs mt-2 inline-block">View all &rarr;</span>
          </Link>
        </div>

        {/* Settings panel */}
        {showSettings && settings && (
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-6">
            <h2 className="text-sm font-semibold text-white mb-4">Pipeline Settings</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Target TLDs</label>
                <input
                  type="text"
                  value={(settingsForm.targetTlds || []).join(', ')}
                  onChange={(e) => setSettingsForm({ ...settingsForm, targetTlds: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Excluded Keywords</label>
                <input
                  type="text"
                  value={(settingsForm.excludedKeywords || []).join(', ')}
                  onChange={(e) => setSettingsForm({ ...settingsForm, excludedKeywords: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Min Quality Score</label>
                <input
                  type="number"
                  value={settingsForm.minQualityScore || 30}
                  onChange={(e) => setSettingsForm({ ...settingsForm, minQualityScore: parseInt(e.target.value) })}
                  min={0}
                  max={100}
                  className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Daily Check Limit</label>
                <input
                  type="number"
                  value={settingsForm.dailyCheckLimit || 500}
                  onChange={(e) => setSettingsForm({ ...settingsForm, dailyCheckLimit: parseInt(e.target.value) })}
                  min={10}
                  max={10000}
                  className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Daily Email Limit</label>
                <input
                  type="number"
                  value={settingsForm.dailyEmailLimit || 50}
                  onChange={(e) => setSettingsForm({ ...settingsForm, dailyEmailLimit: parseInt(e.target.value) })}
                  min={1}
                  max={1000}
                  className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="block text-xs text-slate-500">Auto Outreach</label>
                <button
                  onClick={() => setSettingsForm({ ...settingsForm, autoOutreachEnabled: !settingsForm.autoOutreachEnabled })}
                  className={`relative w-10 h-5 rounded-full transition-colors ${
                    settingsForm.autoOutreachEnabled ? 'bg-indigo-600' : 'bg-slate-600'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                      settingsForm.autoOutreachEnabled ? 'translate-x-5' : ''
                    }`}
                  />
                </button>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {savingSettings && <Loader2 className="w-3 h-3 animate-spin" />}
                Save Settings
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
