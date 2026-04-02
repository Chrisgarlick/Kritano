/**
 * Marketing Content Editor Page
 *
 * Create/edit a marketing content item.
 * Two-column layout: content on left, metadata on right.
 * Live character counting with platform-specific limits.
 */

import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AdminLayout } from '../../../components/layout/AdminLayout';
import { adminApi } from '../../../services/api';
import { useToast } from '../../../components/ui/Toast';
import type {
  MarketingContent,
  MarketingCampaign,
  MarketingPlatform,
  MarketingContentStatus,
} from '../../../types/admin.types';
import {
  ArrowLeft, Save, Trash2, ChevronDown, ChevronUp, Calendar,
} from 'lucide-react';

const DAY_NAMES: Record<number, string> = {
  1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday',
  5: 'Friday', 6: 'Saturday', 7: 'Sunday',
};

// Platform config with character limits
const PLATFORMS: {
  value: MarketingPlatform;
  label: string;
  icon: string;
  color: string;
  activeColor: string;
  limit: number | null;
}[] = [
  { value: 'twitter', label: 'Twitter/X', icon: '𝕏', color: 'border-white/[0.06] text-slate-500', activeColor: 'border-sky-500 bg-sky-500/10 text-sky-300', limit: 280 },
  { value: 'linkedin', label: 'LinkedIn', icon: 'in', color: 'border-white/[0.06] text-slate-500', activeColor: 'border-blue-500 bg-blue-500/10 text-blue-300', limit: 3000 },
  { value: 'instagram', label: 'Instagram', icon: '📷', color: 'border-white/[0.06] text-slate-500', activeColor: 'border-pink-500 bg-pink-500/10 text-pink-300', limit: 2200 },
  { value: 'facebook', label: 'Facebook', icon: 'f', color: 'border-white/[0.06] text-slate-500', activeColor: 'border-blue-600 bg-blue-600/10 text-blue-300', limit: 63206 },
  { value: 'threads', label: 'Threads', icon: '@', color: 'border-white/[0.06] text-slate-500', activeColor: 'border-slate-400 bg-slate-500/10 text-slate-200', limit: 500 },
  { value: 'other', label: 'Other', icon: '•', color: 'border-white/[0.06] text-slate-500', activeColor: 'border-slate-400 bg-slate-500/10 text-slate-200', limit: null },
];

const STATUS_OPTIONS: { value: MarketingContentStatus; label: string; color: string }[] = [
  { value: 'draft', label: 'Draft', color: 'text-slate-500' },
  { value: 'ready', label: 'Ready', color: 'text-amber-400' },
  { value: 'posted', label: 'Posted', color: 'text-green-400' },
  { value: 'archived', label: 'Archived', color: 'text-slate-500' },
];

export default function ContentEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isNew = !id;

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [existing, setExisting] = useState<MarketingContent | null>(null);

  // Form state
  const [platformVal, setPlatformVal] = useState<MarketingPlatform>('twitter');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [statusVal, setStatusVal] = useState<MarketingContentStatus>('draft');
  const [campaignIdVal, setCampaignIdVal] = useState('');
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [weekNumberVal, setWeekNumberVal] = useState(0);
  const [dayOfWeekVal, setDayOfWeekVal] = useState(0);

  // Campaigns
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);

  // Delete confirm
  const [showDelete, setShowDelete] = useState(false);

  // Load campaigns
  useEffect(() => {
    adminApi.listMarketingCampaigns()
      .then(res => setCampaigns(res.data.campaigns))
      .catch(() => {});
  }, []);

  // Load existing content
  useEffect(() => {
    if (id) {
      loadContent(id);
    }
  }, [id]);

  const loadContent = async (contentId: string) => {
    try {
      const { data } = await adminApi.getMarketingContent(contentId);
      const c = data.content;
      setExisting(c);
      setPlatformVal(c.platform);
      setTitle(c.title || '');
      setBody(c.body);
      setStatusVal(c.status);
      setCampaignIdVal(c.campaign_id || '');
      setNotes(c.notes || '');
      if (c.notes) setShowNotes(true);
      setWeekNumberVal(c.week_number || 0);
      setDayOfWeekVal(c.day_of_week || 0);
    } catch {
      toast('Failed to load content', 'error');
      navigate('/admin/marketing/content');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = useCallback(async () => {
    if (!body.trim()) {
      toast('Content body is required', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        platform: platformVal,
        title: title.trim() || undefined,
        body: body,
        campaign_id: campaignIdVal || null,
        status: statusVal,
        notes: notes.trim() || undefined,
        week_number: weekNumberVal || null,
        day_of_week: dayOfWeekVal || null,
      };

      if (isNew) {
        const { data } = await adminApi.createMarketingContent(payload);
        toast('Content created', 'success');
        navigate(`/admin/marketing/content/${data.content.id}/edit`, { replace: true });
      } else if (existing) {
        await adminApi.updateMarketingContent(existing.id, payload);
        toast('Content saved', 'success');
        loadContent(existing.id);
      }
    } catch {
      toast('Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  }, [platformVal, title, body, campaignIdVal, statusVal, notes, weekNumberVal, dayOfWeekVal, isNew, existing, navigate]);

  const handleDelete = async () => {
    if (!existing) return;
    try {
      await adminApi.deleteMarketingContent(existing.id);
      toast('Content deleted', 'success');
      navigate('/admin/marketing/content');
    } catch {
      toast('Failed to delete', 'error');
    }
  };

  // Character counting
  const plainText = body.replace(/[#*_~`>\[\]()!]/g, '').replace(/\n+/g, ' ').trim();
  const charCount = plainText.length;
  const currentPlatform = PLATFORMS.find(p => p.value === platformVal)!;
  const charLimit = currentPlatform.limit;
  const charPercent = charLimit ? Math.min((charCount / charLimit) * 100, 100) : 0;
  const isOverLimit = charLimit ? charCount > charLimit : false;

  // Char bar color
  let charBarColor = 'bg-green-500';
  if (charLimit) {
    if (charPercent > 100) charBarColor = 'bg-red-500';
    else if (charPercent > 90) charBarColor = 'bg-red-400';
    else if (charPercent > 75) charBarColor = 'bg-amber-400';
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-4">
          <div className="h-10 bg-white/[0.02] rounded animate-pulse" />
          <div className="h-64 bg-white/[0.02] rounded animate-pulse" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Helmet><title>Admin: Content Editor | Kritano</title></Helmet>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/admin/marketing/content"
              className="p-2 text-slate-500 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-white tracking-tight font-display">
              {isNew ? 'New Content' : 'Edit Content'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {!isNew && (
              <button
                onClick={() => setShowDelete(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 border border-red-500/30 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saving || !body.trim()}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {/* Delete confirmation */}
        {showDelete && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center justify-between">
            <span className="text-sm text-red-300">Are you sure you want to delete this content?</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDelete}
                className="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDelete(false)}
                className="px-3 py-1.5 text-sm text-slate-500 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Two column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: content */}
          <div className="lg:col-span-2 space-y-4">
            {/* Platform selector */}
            <div>
              <label className="text-xs font-medium text-slate-500 mb-2 block">Platform</label>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map(p => (
                  <button
                    key={p.value}
                    onClick={() => setPlatformVal(p.value)}
                    className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm font-medium transition-all ${
                      platformVal === p.value ? p.activeColor : p.color + ' hover:border-white/[0.1]'
                    }`}
                  >
                    <span>{p.icon}</span>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1.5 block">Title (optional)</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Internal title for reference..."
                maxLength={200}
                className="w-full px-4 py-2.5 bg-white/[0.02] border border-white/[0.06] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            {/* Body */}
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1.5 block">Content</label>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="Write your post content..."
                rows={10}
                className="w-full px-4 py-3 bg-white/[0.02] border border-white/[0.06] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-y font-mono"
              />
              {/* Character count bar */}
              <div className="mt-2">
                {charLimit ? (
                  <div className="space-y-1">
                    <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${charBarColor}`}
                        style={{ width: `${Math.min(charPercent, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between">
                      <span className={`text-xs ${isOverLimit ? 'text-red-400 font-medium' : 'text-slate-500'}`}>
                        {charCount} / {charLimit} characters
                        {isOverLimit && ` (${charCount - charLimit} over)`}
                      </span>
                      <span className="text-xs text-slate-600">
                        {currentPlatform.label} limit
                      </span>
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-slate-500">{charCount} characters</span>
                )}
              </div>
            </div>

            {/* Notes (collapsible) */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg">
              <button
                onClick={() => setShowNotes(!showNotes)}
                className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                Internal Notes
                {showNotes ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {showNotes && (
                <div className="px-4 pb-4">
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Add internal notes..."
                    rows={3}
                    maxLength={2000}
                    className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right column: metadata */}
          <div className="space-y-4">
            {/* Status */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-4">
              <label className="text-xs font-medium text-slate-500 mb-2 block">Status</label>
              <div className="space-y-1.5">
                {STATUS_OPTIONS.map(s => (
                  <label
                    key={s.value}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                      statusVal === s.value
                        ? 'bg-white/[0.03]'
                        : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="status"
                      value={s.value}
                      checked={statusVal === s.value}
                      onChange={e => setStatusVal(e.target.value as MarketingContentStatus)}
                      className="accent-indigo-500"
                    />
                    <span className={`text-sm ${s.color}`}>{s.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Campaign */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-4">
              <label className="text-xs font-medium text-slate-500 mb-2 block">Campaign</label>
              <select
                value={campaignIdVal}
                onChange={e => setCampaignIdVal(e.target.value)}
                className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="">No campaign</option>
                {campaigns.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <Link
                to="/admin/marketing/campaigns"
                className="text-xs text-indigo-400 hover:text-indigo-300 mt-2 inline-block"
              >
                Manage campaigns
              </Link>
            </div>

            {/* Schedule (Week / Day) */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-4">
              <label className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Schedule
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-500 mb-1 block">Week</label>
                  <select
                    value={weekNumberVal}
                    onChange={e => setWeekNumberVal(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value={0}>None</option>
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>Week {i + 1}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 mb-1 block">Day</label>
                  <select
                    value={dayOfWeekVal}
                    onChange={e => setDayOfWeekVal(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value={0}>None</option>
                    {Object.entries(DAY_NAMES).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Preview card */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-4">
              <label className="text-xs font-medium text-slate-500 mb-3 block">Preview</label>
              <div className="bg-white rounded-lg p-4 text-sm text-slate-800">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    PP
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-900">Kritano</div>
                    <div className="text-[10px] text-slate-500">@kritano</div>
                  </div>
                </div>
                <p className="text-slate-700 text-sm whitespace-pre-wrap break-words leading-relaxed">
                  {body || <span className="text-slate-500 italic">Your content will appear here...</span>}
                </p>
              </div>
            </div>

            {/* Post info (existing only) */}
            {existing && (
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-4 space-y-2">
                <div className="text-xs text-slate-500">
                  Created {new Date(existing.created_at).toLocaleDateString()}
                </div>
                <div className="text-xs text-slate-500">
                  Updated {new Date(existing.updated_at).toLocaleDateString()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
