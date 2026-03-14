import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  RefreshCw,
  Mail,
  ShieldCheck,
  ShieldX,
  User,
  Globe,
  Users,
  FileText,
  CheckCircle2,
  Clock,
  Star,
  Zap,
  Trophy,
  UserPlus,
  Activity,
  Send,
  X,
  Loader2,
  BadgeCheck,
  AlertCircle,
} from 'lucide-react';
import { AdminLayout } from '../../../components/layout/AdminLayout';
import { adminApi } from '../../../services/api';
import type {
  CrmLead,
  CrmTimelineEvent,
  CrmMembership,
  CrmOutreachRecord,
} from '../../../services/api';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 30) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getScoreBadgeClasses(score: number): string {
  if (score >= 70) return 'bg-green-500/20 text-green-400 border-green-500/30';
  if (score >= 50) return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  if (score >= 30) return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
  return 'bg-red-500/20 text-red-400 border-red-500/30';
}

function getStatusPillClasses(status: string): string {
  const map: Record<string, string> = {
    new: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    activated: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    engaged: 'bg-green-500/20 text-green-400 border-green-500/30',
    power_user: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    upgrade_prospect: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    churning: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    churned: 'bg-red-500/20 text-red-400 border-red-500/30',
  };
  return map[status] || 'bg-slate-500/20 text-slate-300 border-slate-500/30';
}

function getTierBadgeClasses(tier: string): string {
  const map: Record<string, string> = {
    free: 'bg-slate-600/30 text-slate-300',
    starter: 'bg-blue-600/30 text-blue-300',
    professional: 'bg-indigo-600/30 text-indigo-300',
    enterprise: 'bg-purple-600/30 text-purple-300',
  };
  return map[tier?.toLowerCase()] || 'bg-slate-600/30 text-slate-300';
}

function getTimelineIcon(eventType: string) {
  if (eventType === 'registered') return User;
  if (eventType === 'email_verified') return Mail;
  if (eventType === 'first_audit') return FileText;
  if (eventType === 'milestone_3_audits') return Star;
  if (eventType === 'milestone_10_audits') return Trophy;
  if (eventType === 'domain_verified') return ShieldCheck;
  if (eventType === 'team_member_added') return UserPlus;
  if (eventType.startsWith('trigger_')) return Zap;
  return Activity;
}

function getTimelineIconColor(eventType: string): string {
  if (eventType === 'registered') return 'text-blue-400 bg-blue-500/20';
  if (eventType === 'email_verified') return 'text-green-400 bg-green-500/20';
  if (eventType === 'first_audit') return 'text-indigo-400 bg-indigo-500/20';
  if (eventType.startsWith('milestone_')) return 'text-amber-400 bg-amber-500/20';
  if (eventType === 'domain_verified') return 'text-emerald-400 bg-emerald-500/20';
  if (eventType === 'team_member_added') return 'text-purple-400 bg-purple-500/20';
  if (eventType.startsWith('trigger_')) return 'text-orange-400 bg-orange-500/20';
  return 'text-slate-400 bg-slate-500/20';
}

function getOutreachStatusClasses(status: string): string {
  const map: Record<string, string> = {
    sent: 'bg-green-500/20 text-green-400',
    delivered: 'bg-blue-500/20 text-blue-400',
    opened: 'bg-indigo-500/20 text-indigo-400',
    clicked: 'bg-purple-500/20 text-purple-400',
    bounced: 'bg-red-500/20 text-red-400',
    failed: 'bg-red-500/20 text-red-400',
    pending: 'bg-amber-500/20 text-amber-400',
  };
  return map[status] || 'bg-slate-500/20 text-slate-300';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LeadDetailPage() {
  const { userId } = useParams<{ userId: string }>();

  const [lead, setLead] = useState<CrmLead | null>(null);
  const [timeline, setTimeline] = useState<CrmTimelineEvent[]>([]);
  const [memberships, setMemberships] = useState<CrmMembership[]>([]);
  const [outreach, setOutreach] = useState<CrmOutreachRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recalculating, setRecalculating] = useState(false);

  // Outreach modal state
  const [showOutreachModal, setShowOutreachModal] = useState(false);
  const [outreachSlug, setOutreachSlug] = useState('');
  const [sendingOutreach, setSendingOutreach] = useState(false);
  const [outreachMessage, setOutreachMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getLead(userId);
      setLead(res.data.lead);
      setTimeline(res.data.timeline);
      setMemberships(res.data.memberships);
      setOutreach(res.data.outreach);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load lead data';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRecalculate = async () => {
    if (!userId || recalculating) return;
    setRecalculating(true);
    try {
      const res = await adminApi.recalcLeadScore(userId);
      // Update lead with new score/status
      setLead((prev) =>
        prev
          ? { ...prev, lead_score: res.data.score, lead_status: res.data.status }
          : prev
      );
    } catch {
      // Silently fail - could show toast
    } finally {
      setRecalculating(false);
    }
  };

  const handleSendOutreach = async () => {
    if (!userId || !outreachSlug.trim() || sendingOutreach) return;
    setSendingOutreach(true);
    setOutreachMessage(null);
    try {
      const res = await adminApi.sendOutreach(userId, outreachSlug.trim());
      setOutreachMessage({ type: 'success', text: `Email sent to ${res.data.sentTo}` });
      setOutreachSlug('');
      // Reload data to refresh outreach history
      loadData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send outreach email';
      setOutreachMessage({ type: 'error', text: message });
    } finally {
      setSendingOutreach(false);
    }
  };

  // Identify trigger events from timeline
  const triggerEvents = timeline.filter((e) => e.event.startsWith('trigger_'));

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (error || !lead) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <AlertCircle className="w-12 h-12 text-red-400" />
          <p className="text-red-400 text-lg">{error || 'Lead not found'}</p>
          <Link
            to="/admin/crm/leads"
            className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to leads</span>
          </Link>
        </div>
      </AdminLayout>
    );
  }

  const displayName = [lead.first_name, lead.last_name].filter(Boolean).join(' ') || lead.email;

  return (
    <AdminLayout>
      {/* ----------------------------------------------------------------- */}
      {/* Header                                                            */}
      {/* ----------------------------------------------------------------- */}
      <div className="mb-8">
        <Link
          to="/admin/crm/leads"
          className="inline-flex items-center space-x-1.5 text-sm text-slate-400 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to leads</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Left: Identity */}
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-full bg-white/[0.06] flex items-center justify-center text-xl font-bold text-slate-300">
              {(lead.first_name?.[0] || lead.email[0]).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight" style={{ fontFamily: "'Instrument Serif', serif" }}>{displayName}</h1>
              <div className="flex items-center space-x-3 mt-1">
                <span className="text-sm text-slate-400">{lead.email}</span>
                {lead.email_verified ? (
                  <span className="inline-flex items-center space-x-1 text-xs text-green-400">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Verified</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 text-xs text-red-400">
                    <ShieldX className="w-3.5 h-3.5" />
                    <span>Unverified</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Badges + Actions */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Lead Score Badge */}
            <div
              className={`px-4 py-2 rounded-lg border text-2xl font-bold ${getScoreBadgeClasses(lead.lead_score)}`}
            >
              {lead.lead_score}
            </div>

            {/* Status Pill */}
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full border text-xs font-medium capitalize ${getStatusPillClasses(lead.lead_status)}`}
            >
              {lead.lead_status.replace(/_/g, ' ')}
            </span>

            {/* Tier Badge */}
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium capitalize ${getTierBadgeClasses(lead.tier)}`}
            >
              {lead.tier}
            </span>

            {/* Last Login */}
            <span className="text-xs text-slate-500">
              Last login: {formatDate(lead.last_login_at)}
            </span>

            {/* Recalculate Button */}
            <button
              onClick={handleRecalculate}
              disabled={recalculating}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${recalculating ? 'animate-spin' : ''}`} />
              <span>Recalculate Score</span>
            </button>
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Stats Cards Row                                                   */}
      {/* ----------------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Audits"
          value={lead.total_audits}
          icon={FileText}
          iconColor="text-indigo-400"
        />
        <StatCard
          label="Total Sites"
          value={lead.total_sites}
          icon={Globe}
          iconColor="text-blue-400"
        />
        <StatCard
          label="Verified Domains"
          value={lead.verified_domains}
          icon={CheckCircle2}
          iconColor="text-green-400"
        />
        <StatCard
          label="Team Members"
          value={lead.team_members}
          icon={Users}
          iconColor="text-purple-400"
        />
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Timeline                                                          */}
      {/* ----------------------------------------------------------------- */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
          <Clock className="w-5 h-5 text-slate-400" />
          <span>Activity Timeline</span>
        </h2>
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-6">
          {timeline.length === 0 ? (
            <p className="text-sm text-slate-500">No timeline events recorded.</p>
          ) : (
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-4 top-0 bottom-0 w-px bg-white/[0.06]" />

              <div className="space-y-6">
                {timeline.map((event, idx) => {
                  const Icon = getTimelineIcon(event.event);
                  const colorClasses = getTimelineIconColor(event.event);
                  return (
                    <div key={idx} className="relative flex items-start space-x-4 pl-1">
                      <div
                        className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${colorClasses}`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <p className="text-sm text-slate-200">{event.detail}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {formatRelativeTime(event.timestamp)}
                          <span className="mx-1.5">--</span>
                          {formatDate(event.timestamp)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Sites & Memberships                                               */}
      {/* ----------------------------------------------------------------- */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
          <Globe className="w-5 h-5 text-slate-400" />
          <span>Sites &amp; Memberships</span>
        </h2>
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg overflow-hidden">
          {memberships.length === 0 ? (
            <div className="p-6">
              <p className="text-sm text-slate-500">No site memberships found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Site Domain
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Tier
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Verified
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Last Audit
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Audits
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {memberships.map((m) => (
                    <tr key={m.site_id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <span className="text-slate-200 font-medium">{m.site_domain}</span>
                          {m.site_name && m.site_name !== m.site_domain && (
                            <span className="text-xs text-slate-500 ml-2">({m.site_name})</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="capitalize text-slate-300">{m.role}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-xs font-medium capitalize ${getTierBadgeClasses(m.tier)}`}
                        >
                          {m.tier}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {m.verified ? (
                          <BadgeCheck className="w-4 h-4 text-green-400" />
                        ) : (
                          <X className="w-4 h-4 text-slate-600" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs">
                        {formatDate(m.last_audit_at)}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-300 font-medium">
                        {m.audit_count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Outreach History                                                   */}
      {/* ----------------------------------------------------------------- */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center space-x-2">
            <Send className="w-5 h-5 text-slate-400" />
            <span>Outreach History</span>
          </h2>
          <button
            onClick={() => {
              setShowOutreachModal(true);
              setOutreachMessage(null);
            }}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Send Email</span>
          </button>
        </div>

        <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg overflow-hidden">
          {outreach.length === 0 ? (
            <div className="p-6">
              <p className="text-sm text-slate-500">No outreach emails sent yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Template
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Sent By
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {outreach.map((o) => (
                    <tr key={o.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 text-slate-200 font-medium">
                        {o.template_name || o.template_slug || '--'}
                      </td>
                      <td className="px-4 py-3 text-slate-300">{o.subject}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-xs font-medium capitalize ${getOutreachStatusClasses(o.status)}`}
                        >
                          {o.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs">
                        {o.sent_by_email || '--'}
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs">
                        {formatDate(o.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Active Triggers                                                    */}
      {/* ----------------------------------------------------------------- */}
      {triggerEvents.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <span>Active Triggers</span>
          </h2>
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-6">
            <div className="space-y-3">
              {triggerEvents.map((t, idx) => (
                <div
                  key={idx}
                  className="flex items-center space-x-3 p-3 rounded-md bg-amber-500/5 border border-amber-500/20"
                >
                  <Zap className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200">{t.detail}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {formatRelativeTime(t.timestamp)}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-medium">
                    {t.event.replace('trigger_', '').replace(/_/g, ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Send Outreach Modal                                                */}
      {/* ----------------------------------------------------------------- */}
      {showOutreachModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowOutreachModal(false)}
          />
          {/* Modal */}
          <div className="relative bg-white/[0.02] border border-white/[0.06] rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Send Outreach Email</h3>
              <button
                onClick={() => setShowOutreachModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-slate-400 mb-4">
              Send an email to <span className="text-slate-200 font-medium">{lead.email}</span> using
              a template slug.
            </p>

            <div className="mb-4">
              <label htmlFor="template-slug" className="block text-sm font-medium text-slate-300 mb-1.5">
                Template Slug
              </label>
              <input
                id="template-slug"
                type="text"
                value={outreachSlug}
                onChange={(e) => setOutreachSlug(e.target.value)}
                placeholder="e.g. upgrade-reminder"
                className="w-full px-3 py-2 rounded-md bg-white/[0.03] border border-white/[0.08] text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
              />
            </div>

            {outreachMessage && (
              <div
                className={`mb-4 p-3 rounded-md text-sm ${
                  outreachMessage.type === 'success'
                    ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                    : 'bg-red-500/10 border border-red-500/20 text-red-400'
                }`}
              >
                {outreachMessage.text}
              </div>
            )}

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowOutreachModal(false)}
                className="px-4 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white bg-white/[0.06] hover:bg-white/[0.06] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendOutreach}
                disabled={sendingOutreach || !outreachSlug.trim()}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-md text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendingOutreach ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>{sendingOutreach ? 'Sending...' : 'Send'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  icon: Icon,
  iconColor,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
}) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-white/[0.03] flex items-center justify-center">
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
      </div>
    </div>
  );
}
