/**
 * Campaign Editor / Detail Page
 *
 * Smart routing: no id → wizard (new), draft → wizard (edit), other → detail view.
 * Wizard: Template → Audience → Schedule → Review
 * Detail: stats cards, per-recipient sends table.
 */

import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AdminLayout } from '../../../components/layout/AdminLayout';
import { adminApi } from '../../../services/api';
import type {
  EmailCampaignItem,
  CampaignSegment,
  CampaignStatus,
  EmailSendRecord,
} from '../../../services/api';
import type { Pagination } from '../../../types/audit.types';
import {
  ArrowLeft, ArrowRight, Send, Users, CheckCircle, Clock,
  Play, Pause, X, ChevronLeft, ChevronRight, Calendar, MailX,
} from 'lucide-react';

const TIERS = ['free', 'starter', 'professional', 'agency', 'enterprise'];
const LEAD_STATUSES = ['new', 'active', 'engaged', 'power_user', 'churning', 'dormant'];

const STATUS_BADGE: Record<CampaignStatus, string> = {
  draft: 'bg-slate-500/20 text-slate-300',
  scheduled: 'bg-blue-500/20 text-blue-300',
  sending: 'bg-amber-500/20 text-amber-300',
  paused: 'bg-orange-500/20 text-orange-300',
  sent: 'bg-green-500/20 text-green-300',
  cancelled: 'bg-red-500/20 text-red-300',
  failed: 'bg-red-500/20 text-red-300',
};

const SEND_STATUS_BADGE: Record<string, string> = {
  queued: 'bg-slate-500/20 text-slate-300',
  sending: 'bg-blue-500/20 text-blue-300',
  sent: 'bg-indigo-500/20 text-indigo-300',
  delivered: 'bg-green-500/20 text-green-300',
  opened: 'bg-emerald-500/20 text-emerald-300',
  clicked: 'bg-teal-500/20 text-teal-300',
  bounced: 'bg-red-500/20 text-red-300',
  complained: 'bg-orange-500/20 text-orange-300',
  failed: 'bg-red-500/20 text-red-300',
};

interface TemplateOption {
  id: string;
  name: string;
  slug: string;
  subject: string;
  category: string;
}

export default function CampaignEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id || id === 'new';

  const [campaign, setCampaign] = useState<EmailCampaignItem | null>(null);
  const [loading, setLoading] = useState(!isNew);

  // Wizard state
  const [step, setStep] = useState(0);
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [previewHtml, setPreviewHtml] = useState('');
  const [segment, setSegment] = useState<CampaignSegment>({});
  const [audienceCount, setAudienceCount] = useState<number | null>(null);
  const [audienceLoading, setAudienceLoading] = useState(false);
  const [campaignName, setCampaignName] = useState('');
  const [campaignDescription, setCampaignDescription] = useState('');
  const [scheduleMode, setScheduleMode] = useState<'now' | 'later'>('now');
  const [scheduledAt, setScheduledAt] = useState('');
  const [saving, setSaving] = useState(false);

  // Unsubscribe stats
  const [unsubCount, setUnsubCount] = useState<number | null>(null);

  // Detail view state
  const [sends, setSends] = useState<EmailSendRecord[]>([]);
  const [sendsPagination, setSendsPagination] = useState<Pagination | null>(null);
  const [sendsPage, setSendsPage] = useState(1);
  const [sendsStatusFilter, setSendsStatusFilter] = useState('');
  const [sendsLoading, setSendsLoading] = useState(false);

  // Load campaign if editing
  useEffect(() => {
    if (!isNew) {
      loadCampaign();
    }
    loadTemplates();
  }, [id]);

  const loadCampaign = async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.getCampaign(id!);
      setCampaign(data.campaign);
      // Populate wizard fields if draft
      if (data.campaign.status === 'draft') {
        setSelectedTemplateId(data.campaign.template_id);
        setSegment(data.campaign.segment || {});
        setCampaignName(data.campaign.name);
        setCampaignDescription(data.campaign.description || '');
      }
    } catch (err) {
      console.error('Failed to load campaign:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const { data } = await adminApi.listTemplates({ limit: 100 });
      setTemplates(data.templates.filter((t: TemplateOption & { is_active: boolean }) => t.is_active));
    } catch (err) {
      console.error('Failed to load templates:', err);
    }
  };

  // Audience count with debounce
  const fetchAudienceCount = useCallback(async (seg: CampaignSegment) => {
    setAudienceLoading(true);
    try {
      const { data } = await adminApi.getCampaignAudienceCount(seg);
      setAudienceCount(data.count);
    } catch {
      setAudienceCount(null);
    } finally {
      setAudienceLoading(false);
    }
  }, []);

  useEffect(() => {
    if (step === 1) {
      const timer = setTimeout(() => fetchAudienceCount(segment), 500);
      // Fetch unsubscribe stats when audience step mounts
      adminApi.getUnsubscribeStats().then(({ data }) => {
        setUnsubCount(data.registeredUnsubscribed);
      }).catch(() => {});
      return () => clearTimeout(timer);
    }
  }, [segment, step, fetchAudienceCount]);

  // Load template preview
  useEffect(() => {
    if (selectedTemplateId && step === 0) {
      adminApi.previewTemplate(selectedTemplateId).then(({ data }) => {
        setPreviewHtml(data.html);
      }).catch(() => setPreviewHtml(''));
    }
  }, [selectedTemplateId, step]);

  // Load sends for detail view
  useEffect(() => {
    if (campaign && campaign.status !== 'draft') {
      loadSends();
    }
  }, [campaign?.id, sendsPage, sendsStatusFilter]);

  const loadSends = async () => {
    if (!campaign) return;
    setSendsLoading(true);
    try {
      const params: Record<string, unknown> = { page: sendsPage, limit: 20 };
      if (sendsStatusFilter) params.status = sendsStatusFilter;
      const { data } = await adminApi.getCampaignSends(campaign.id, params as Parameters<typeof adminApi.getCampaignSends>[1]);
      setSends(data.sends);
      setSendsPagination(data.pagination);
    } catch (err) {
      console.error('Failed to load sends:', err);
    } finally {
      setSendsLoading(false);
    }
  };

  const handleSave = async (launch: boolean) => {
    setSaving(true);
    try {
      let campaignId = campaign?.id;

      const payload = {
        name: campaignName,
        description: campaignDescription || undefined,
        template_id: selectedTemplateId,
        segment,
      };

      if (isNew || !campaignId) {
        const { data } = await adminApi.createCampaign(payload);
        campaignId = data.campaign.id;
      } else {
        await adminApi.updateCampaign(campaignId, payload);
      }

      if (launch) {
        if (scheduleMode === 'later' && scheduledAt) {
          await adminApi.scheduleCampaign(campaignId!, scheduledAt);
        } else {
          await adminApi.launchCampaign(campaignId!);
        }
      }

      navigate(launch ? `/admin/email/campaigns/${campaignId}` : '/admin/email/campaigns');
    } catch (err) {
      alert(`Failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleLifecycleAction = async (action: string) => {
    if (!campaign) return;
    try {
      switch (action) {
        case 'pause': await adminApi.pauseCampaign(campaign.id); break;
        case 'resume': await adminApi.resumeCampaign(campaign.id); break;
        case 'cancel':
          if (!confirm('Cancel this campaign? Queued emails will be discarded.')) return;
          await adminApi.cancelCampaign(campaign.id);
          break;
      }
      loadCampaign();
    } catch (err) {
      alert(`Action failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-4">
          <div className="h-8 bg-white/[0.02] rounded w-1/3 animate-pulse" />
          <div className="h-64 bg-white/[0.02] rounded-lg animate-pulse" />
        </div>
      </AdminLayout>
    );
  }

  // Detail view for non-draft campaigns
  if (campaign && campaign.status !== 'draft') {
    return (
      <AdminLayout>
        <Helmet><title>Admin: Campaign Details | Kritano</title></Helmet>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/admin/email/campaigns" className="p-2 text-slate-500 hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl font-bold text-white tracking-tight font-display">{campaign.name}</h1>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[campaign.status]}`}>
                    {campaign.status}
                  </span>
                </div>
                {campaign.description && (
                  <p className="text-sm text-slate-500 mt-1">{campaign.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {campaign.status === 'sending' && (
                <>
                  <button onClick={() => handleLifecycleAction('pause')} className="flex items-center gap-2 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors">
                    <Pause className="w-4 h-4" /> Pause
                  </button>
                  <button onClick={() => handleLifecycleAction('cancel')} className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors">
                    <X className="w-4 h-4" /> Cancel
                  </button>
                </>
              )}
              {campaign.status === 'paused' && (
                <>
                  <button onClick={() => handleLifecycleAction('resume')} className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors">
                    <Play className="w-4 h-4" /> Resume
                  </button>
                  <button onClick={() => handleLifecycleAction('cancel')} className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors">
                    <X className="w-4 h-4" /> Cancel
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {
                label: 'Delivered',
                value: campaign.stats.total > 0
                  ? `${((campaign.stats.delivered / campaign.stats.total) * 100).toFixed(1)}%`
                  : '-',
                sub: `${campaign.stats.delivered} / ${campaign.stats.total}`,
                color: 'text-green-400',
              },
              {
                label: 'Opened',
                value: campaign.stats.delivered > 0
                  ? `${((campaign.stats.opened / campaign.stats.delivered) * 100).toFixed(1)}%`
                  : '-',
                sub: `${campaign.stats.opened} opens`,
                color: 'text-blue-400',
              },
              {
                label: 'Clicked',
                value: campaign.stats.delivered > 0
                  ? `${((campaign.stats.clicked / campaign.stats.delivered) * 100).toFixed(1)}%`
                  : '-',
                sub: `${campaign.stats.clicked} clicks`,
                color: 'text-indigo-400',
              },
              {
                label: 'Bounced',
                value: campaign.stats.total > 0
                  ? `${((campaign.stats.bounced / campaign.stats.total) * 100).toFixed(1)}%`
                  : '-',
                sub: `${campaign.stats.bounced} bounced`,
                color: 'text-red-400',
              },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-4">
                <div className="text-xs text-slate-500 mb-1">{stat.label}</div>
                <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-xs text-slate-500 mt-1">{stat.sub}</div>
              </div>
            ))}
          </div>

          {/* Campaign Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-4">
              <div className="text-xs text-slate-500">Template</div>
              <div className="text-sm text-white mt-1">{campaign.template_name || '-'}</div>
            </div>
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-4">
              <div className="text-xs text-slate-500">Audience</div>
              <div className="text-sm text-white mt-1">{campaign.audience_count.toLocaleString()} recipients</div>
            </div>
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-4">
              <div className="text-xs text-slate-500">Started</div>
              <div className="text-sm text-white mt-1">
                {campaign.started_at ? new Date(campaign.started_at).toLocaleString() : '-'}
              </div>
            </div>
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-4">
              <div className="text-xs text-slate-500">Completed</div>
              <div className="text-sm text-white mt-1">
                {campaign.completed_at ? new Date(campaign.completed_at).toLocaleString() : '-'}
              </div>
            </div>
          </div>

          {/* Progress bar for sending campaigns */}
          {(campaign.status === 'sending' || campaign.status === 'paused') && campaign.stats.total > 0 && (
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-300">Sending Progress</span>
                <span className="text-sm text-white font-medium">
                  {campaign.stats.sent + campaign.stats.failed} / {campaign.stats.total}
                </span>
              </div>
              <div className="w-full bg-white/[0.06] rounded-full h-2">
                <div
                  className="bg-indigo-500 h-2 rounded-full transition-all"
                  style={{ width: `${((campaign.stats.sent + campaign.stats.failed) / campaign.stats.total) * 100}%` }}
                />
              </div>
              <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                <span>{campaign.stats.queued} queued</span>
                <span>{campaign.stats.sent} sent</span>
                <span>{campaign.stats.failed} failed</span>
              </div>
            </div>
          )}

          {/* Per-recipient Sends Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-white">Recipients</h2>
              <select
                value={sendsStatusFilter}
                onChange={(e) => { setSendsStatusFilter(e.target.value); setSendsPage(1); }}
                className="px-3 py-1.5 bg-white/[0.02] border border-white/[0.06] rounded-lg text-sm text-white"
              >
                <option value="">All Statuses</option>
                {['queued', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'failed'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {sendsLoading ? (
              <div className="h-32 bg-white/[0.02] rounded-lg animate-pulse" />
            ) : sends.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">No sends yet</div>
            ) : (
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Email</th>
                      <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Status</th>
                      <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Sent</th>
                      <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Opened</th>
                      <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Clicked</th>
                      <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sends.map((send) => (
                      <tr key={send.id} className="border-b border-white/[0.04]">
                        <td className="px-4 py-2 text-sm text-white">{send.to_email}</td>
                        <td className="px-4 py-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SEND_STATUS_BADGE[send.status] || 'bg-white/[0.06] text-slate-300'}`}>
                            {send.status}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-xs text-slate-500">
                          {send.sent_at ? new Date(send.sent_at).toLocaleString() : '-'}
                        </td>
                        <td className="px-4 py-2 text-xs text-slate-500">
                          {send.opened_at ? new Date(send.opened_at).toLocaleString() : '-'}
                        </td>
                        <td className="px-4 py-2 text-xs text-slate-500">
                          {send.clicked_at ? new Date(send.clicked_at).toLocaleString() : '-'}
                        </td>
                        <td className="px-4 py-2 text-xs text-red-400 truncate max-w-[200px]">
                          {send.error_message || ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {sendsPagination && sendsPagination.pages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setSendsPage(p => Math.max(1, p - 1))}
                  disabled={sendsPage === 1}
                  className="p-2 text-slate-500 hover:text-white disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-slate-500">
                  Page {sendsPage} of {sendsPagination.pages}
                </span>
                <button
                  onClick={() => setSendsPage(p => Math.min(sendsPagination!.pages, p + 1))}
                  disabled={sendsPage === sendsPagination.pages}
                  className="p-2 text-slate-500 hover:text-white disabled:opacity-30 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Wizard view
  const steps = ['Template', 'Audience', 'Schedule', 'Review'];
  const canProceed = () => {
    switch (step) {
      case 0: return !!selectedTemplateId;
      case 1: return true;
      case 2: return !!campaignName && (scheduleMode === 'now' || !!scheduledAt);
      case 3: return true;
      default: return false;
    }
  };

  return (
    <AdminLayout>
      <Helmet><title>Admin: Campaign Editor | Kritano</title></Helmet>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link to="/admin/email/campaigns" className="p-2 text-slate-500 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-3xl font-bold text-white tracking-tight font-display">
            {isNew ? 'New Campaign' : `Edit: ${campaign?.name || ''}`}
          </h1>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-2">
          {steps.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <button
                onClick={() => i < step && setStep(i)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  i === step
                    ? 'bg-indigo-600 text-white'
                    : i < step
                    ? 'bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30'
                    : 'bg-white/[0.02] text-slate-500'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-black/20 flex items-center justify-center text-xs">
                  {i < step ? <CheckCircle className="w-3.5 h-3.5" /> : i + 1}
                </span>
                {label}
              </button>
              {i < steps.length - 1 && (
                <div className={`w-8 h-px ${i < step ? 'bg-indigo-500' : 'bg-white/[0.06]'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-6 min-h-[400px]">
          {/* Step 0: Template */}
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-white">Choose a Template</h2>
              <p className="text-sm text-slate-500">Select the email template to use for this campaign.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTemplateId(t.id)}
                    className={`text-left p-4 rounded-lg border transition-colors ${
                      selectedTemplateId === t.id
                        ? 'border-indigo-500 bg-indigo-500/10'
                        : 'border-white/[0.06] hover:border-white/[0.1]'
                    }`}
                  >
                    <div className="text-sm font-medium text-white">{t.name}</div>
                    <div className="text-xs text-slate-500 mt-1 truncate">{t.subject}</div>
                    <div className="text-xs text-slate-500 mt-1">{t.category.replace('_', ' ')}</div>
                  </button>
                ))}
              </div>
              {selectedTemplateId && previewHtml && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-slate-300 mb-2">Preview</h3>
                  <div className="bg-white rounded-lg overflow-hidden" style={{ maxHeight: '300px' }}>
                    <iframe
                      srcDoc={previewHtml}
                      className="w-full h-[300px] border-0"
                      title="Template preview"
                      sandbox="allow-same-origin"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 1: Audience */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-medium text-white">Define Audience</h2>
                  <p className="text-sm text-slate-500">Segment your recipients based on criteria below.</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 bg-white/[0.06] rounded-lg px-4 py-2">
                    <Users className="w-4 h-4 text-indigo-400" />
                    <span className="text-sm font-medium text-white">
                      {audienceLoading ? '...' : audienceCount !== null ? audienceCount.toLocaleString() : '-'} recipients
                    </span>
                  </div>
                  {unsubCount !== null && unsubCount > 0 && (
                    <div className="flex items-center gap-1.5 mt-1.5 text-xs text-orange-400">
                      <MailX className="w-3 h-3" />
                      {unsubCount} user{unsubCount !== 1 ? 's' : ''} auto-excluded (unsubscribed)
                    </div>
                  )}
                </div>
              </div>

              {/* Tier filter */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">Subscription Tiers</label>
                <div className="flex flex-wrap gap-2">
                  {TIERS.map((tier) => (
                    <button
                      key={tier}
                      onClick={() => {
                        setSegment(prev => {
                          const current = prev.tiers || [];
                          const updated = current.includes(tier)
                            ? current.filter(t => t !== tier)
                            : [...current, tier];
                          return { ...prev, tiers: updated.length > 0 ? updated : undefined };
                        });
                      }}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        (segment.tiers || []).includes(tier)
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white/[0.06] text-slate-300 hover:bg-white/[0.06]'
                      }`}
                    >
                      {tier}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lead status filter */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">Lead Statuses</label>
                <div className="flex flex-wrap gap-2">
                  {LEAD_STATUSES.map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        setSegment(prev => {
                          const current = prev.leadStatuses || [];
                          const updated = current.includes(status)
                            ? current.filter(s => s !== status)
                            : [...current, status];
                          return { ...prev, leadStatuses: updated.length > 0 ? updated : undefined };
                        });
                      }}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        (segment.leadStatuses || []).includes(status)
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white/[0.06] text-slate-300 hover:bg-white/[0.06]'
                      }`}
                    >
                      {status.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Score range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-1 block">Min Lead Score</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={segment.minLeadScore ?? ''}
                    onChange={(e) => setSegment(prev => ({
                      ...prev,
                      minLeadScore: e.target.value ? parseInt(e.target.value) : undefined,
                    }))}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-sm text-white placeholder-slate-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-1 block">Max Lead Score</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={segment.maxLeadScore ?? ''}
                    onChange={(e) => setSegment(prev => ({
                      ...prev,
                      maxLeadScore: e.target.value ? parseInt(e.target.value) : undefined,
                    }))}
                    placeholder="100"
                    className="w-full px-3 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-sm text-white placeholder-slate-500"
                  />
                </div>
              </div>

              {/* Verified domain toggle */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSegment(prev => ({
                    ...prev,
                    verifiedDomain: prev.verifiedDomain ? undefined : true,
                  }))}
                  className={`relative w-10 h-6 rounded-full transition-colors ${
                    segment.verifiedDomain ? 'bg-indigo-600' : 'bg-slate-600'
                  }`}
                >
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    segment.verifiedDomain ? 'left-5' : 'left-1'
                  }`} />
                </button>
                <label className="text-sm text-slate-300">Only verified domain owners</label>
              </div>

              {/* Date filters */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-1 block">Registered After</label>
                  <input
                    type="date"
                    value={segment.registeredAfter || ''}
                    onChange={(e) => setSegment(prev => ({
                      ...prev,
                      registeredAfter: e.target.value || undefined,
                    }))}
                    className="w-full px-3 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-1 block">Last Login After</label>
                  <input
                    type="date"
                    value={segment.lastLoginAfter || ''}
                    onChange={(e) => setSegment(prev => ({
                      ...prev,
                      lastLoginAfter: e.target.value || undefined,
                    }))}
                    className="w-full px-3 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-sm text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Schedule */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-lg font-medium text-white">Campaign Details & Schedule</h2>

              <div>
                <label className="text-sm font-medium text-slate-300 mb-1 block">Campaign Name *</label>
                <input
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="e.g., February Feature Announcement"
                  className="w-full px-3 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-sm text-white placeholder-slate-500"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-300 mb-1 block">Description</label>
                <textarea
                  value={campaignDescription}
                  onChange={(e) => setCampaignDescription(e.target.value)}
                  placeholder="Internal notes about this campaign..."
                  rows={3}
                  className="w-full px-3 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-sm text-white placeholder-slate-500 resize-none"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-300 mb-3 block">When to send?</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setScheduleMode('now')}
                    className={`flex-1 flex items-center gap-3 p-4 rounded-lg border transition-colors ${
                      scheduleMode === 'now'
                        ? 'border-indigo-500 bg-indigo-500/10'
                        : 'border-white/[0.06] hover:border-white/[0.1]'
                    }`}
                  >
                    <Send className="w-5 h-5 text-indigo-400" />
                    <div className="text-left">
                      <div className="text-sm font-medium text-white">Send Now</div>
                      <div className="text-xs text-slate-500">Start sending immediately after review</div>
                    </div>
                  </button>
                  <button
                    onClick={() => setScheduleMode('later')}
                    className={`flex-1 flex items-center gap-3 p-4 rounded-lg border transition-colors ${
                      scheduleMode === 'later'
                        ? 'border-indigo-500 bg-indigo-500/10'
                        : 'border-white/[0.06] hover:border-white/[0.1]'
                    }`}
                  >
                    <Calendar className="w-5 h-5 text-blue-400" />
                    <div className="text-left">
                      <div className="text-sm font-medium text-white">Schedule</div>
                      <div className="text-xs text-slate-500">Choose a specific date and time</div>
                    </div>
                  </button>
                </div>
              </div>

              {scheduleMode === 'later' && (
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-1 block">Scheduled Date & Time</label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full px-3 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-sm text-white"
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-lg font-medium text-white">Review & Launch</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/[0.03] rounded-lg p-4 space-y-3">
                  <h3 className="text-sm font-medium text-slate-300">Campaign</h3>
                  <div className="text-sm text-white">{campaignName || '-'}</div>
                  {campaignDescription && (
                    <div className="text-xs text-slate-500">{campaignDescription}</div>
                  )}
                </div>

                <div className="bg-white/[0.03] rounded-lg p-4 space-y-3">
                  <h3 className="text-sm font-medium text-slate-300">Template</h3>
                  <div className="text-sm text-white">
                    {templates.find(t => t.id === selectedTemplateId)?.name || '-'}
                  </div>
                </div>

                <div className="bg-white/[0.03] rounded-lg p-4 space-y-3">
                  <h3 className="text-sm font-medium text-slate-300">Audience</h3>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-400" />
                    <span className="text-sm text-white font-medium">
                      {audienceCount !== null ? audienceCount.toLocaleString() : '-'} recipients
                    </span>
                  </div>
                  {segment.tiers && segment.tiers.length > 0 && (
                    <div className="text-xs text-slate-500">Tiers: {segment.tiers.join(', ')}</div>
                  )}
                  {segment.leadStatuses && segment.leadStatuses.length > 0 && (
                    <div className="text-xs text-slate-500">Statuses: {segment.leadStatuses.join(', ')}</div>
                  )}
                  {segment.verifiedDomain && (
                    <div className="text-xs text-slate-500">Verified domains only</div>
                  )}
                </div>

                <div className="bg-white/[0.03] rounded-lg p-4 space-y-3">
                  <h3 className="text-sm font-medium text-slate-300">Schedule</h3>
                  <div className="flex items-center gap-2">
                    {scheduleMode === 'now' ? (
                      <>
                        <Send className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-white">Send immediately</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-4 h-4 text-blue-400" />
                        <span className="text-sm text-white">
                          {scheduledAt ? new Date(scheduledAt).toLocaleString() : '-'}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Template preview */}
              {previewHtml && (
                <div>
                  <h3 className="text-sm font-medium text-slate-300 mb-2">Template Preview</h3>
                  <div className="bg-white rounded-lg overflow-hidden">
                    <iframe
                      srcDoc={previewHtml}
                      className="w-full h-[300px] border-0"
                      title="Template preview"
                      sandbox="allow-same-origin"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setStep(s => Math.max(0, s - 1))}
            disabled={step === 0}
            className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-white disabled:opacity-30 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <div className="flex items-center gap-3">
            {step < 3 && (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={!canProceed()}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
            )}
            {step === 3 && (
              <>
                <button
                  onClick={() => handleSave(false)}
                  disabled={saving}
                  className="px-4 py-2 bg-white/[0.06] hover:bg-white/[0.06] text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Save as Draft
                </button>
                <button
                  onClick={() => handleSave(true)}
                  disabled={saving || !campaignName}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Send className="w-4 h-4" />
                  {scheduleMode === 'later' ? 'Schedule Campaign' : 'Launch Campaign'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
