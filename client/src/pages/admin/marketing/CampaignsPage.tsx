/**
 * Marketing Campaigns Page
 *
 * Simple CRUD list for marketing campaign labels/tags.
 * Campaigns are used to group marketing content items.
 */

import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { AdminLayout } from '../../../components/layout/AdminLayout';
import { adminApi } from '../../../services/api';
import { useToast } from '../../../components/ui/Toast';
import type { MarketingCampaign } from '../../../types/admin.types';
import { Tags, Plus, Pencil, Trash2, Check, X, FileText } from 'lucide-react';

export default function CampaignsPage() {
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const [loading, setLoading] = useState(true);

  // New campaign form
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#6366f1');
  const [newDescription, setNewDescription] = useState('');
  const [creating, setCreating] = useState(false);

  // Inline edit
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchCampaigns = useCallback(async () => {
    try {
      const { data } = await adminApi.listMarketingCampaigns();
      setCampaigns(data.campaigns);
    } catch {
      toast('Failed to load campaigns', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await adminApi.createMarketingCampaign({
        name: newName.trim(),
        color: newColor,
        description: newDescription.trim() || undefined,
      });
      toast('Campaign created', 'success');
      setNewName('');
      setNewColor('#6366f1');
      setNewDescription('');
      setShowCreate(false);
      fetchCampaigns();
    } catch {
      toast('Failed to create campaign', 'error');
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (c: MarketingCampaign) => {
    setEditId(c.id);
    setEditName(c.name);
    setEditColor(c.color);
    setEditDescription(c.description || '');
  };

  const handleUpdate = async () => {
    if (!editId || !editName.trim()) return;
    setSaving(true);
    try {
      await adminApi.updateMarketingCampaign(editId, {
        name: editName.trim(),
        color: editColor,
        description: editDescription.trim() || undefined,
      });
      toast('Campaign updated', 'success');
      setEditId(null);
      fetchCampaigns();
    } catch {
      toast('Failed to update campaign', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminApi.deleteMarketingCampaign(id);
      toast('Campaign deleted', 'success');
      setDeleteId(null);
      fetchCampaigns();
    } catch {
      toast('Failed to delete campaign', 'error');
    }
  };

  const PRESET_COLORS = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
    '#f97316', '#eab308', '#22c55e', '#06b6d4',
    '#3b82f6', '#64748b',
  ];

  return (
    <AdminLayout>
      <Helmet><title>Admin: Marketing Campaigns | Kritano</title></Helmet>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight font-display">Marketing Campaigns</h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage campaign labels for organizing social content
            </p>
          </div>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Campaign
          </button>
        </div>

        {/* Create form */}
        {showCreate && (
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-5">
            <h3 className="text-sm font-medium text-white mb-4">New Campaign</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1.5 block">Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. Q1 Launch"
                  maxLength={100}
                  className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1.5 block">Color</label>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5 flex-wrap">
                    {PRESET_COLORS.map(c => (
                      <button
                        key={c}
                        onClick={() => setNewColor(c)}
                        className={`w-6 h-6 rounded-full border-2 transition-all ${
                          newColor === c ? 'border-white scale-110' : 'border-transparent hover:border-slate-400'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1.5 block">Description</label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  placeholder="Optional description..."
                  maxLength={500}
                  className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowCreate(false)}
                className="px-3 py-2 text-sm text-slate-500 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!newName.trim() || creating}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create Campaign'}
              </button>
            </div>
          </div>
        )}

        {/* Campaigns table */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Name</th>
                <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Color</th>
                <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Description</th>
                <th className="text-center text-xs font-medium text-slate-500 px-4 py-3">Content</th>
                <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Created</th>
                <th className="text-right text-xs font-medium text-slate-500 px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/[0.04]">
                    <td colSpan={6} className="px-4 py-3">
                      <div className="h-5 bg-white/[0.06] rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : campaigns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <Tags className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">No campaigns yet</p>
                    <p className="text-xs text-slate-500 mt-1">Create a campaign to organise your content</p>
                  </td>
                </tr>
              ) : (
                campaigns.map(campaign => (
                  <tr key={campaign.id} className="border-b border-white/[0.04] hover:bg-white/[0.01]">
                    {editId === campaign.id ? (
                      <>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                            maxLength={100}
                            className="w-full px-2 py-1.5 bg-white/[0.03] border border-white/[0.08] rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex gap-1">
                            {PRESET_COLORS.map(c => (
                              <button
                                key={c}
                                onClick={() => setEditColor(c)}
                                className={`w-5 h-5 rounded-full border-2 transition-all ${
                                  editColor === c ? 'border-white scale-110' : 'border-transparent'
                                }`}
                                style={{ backgroundColor: c }}
                              />
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={editDescription}
                            onChange={e => setEditDescription(e.target.value)}
                            maxLength={500}
                            className="w-full px-2 py-1.5 bg-white/[0.03] border border-white/[0.08] rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                          />
                        </td>
                        <td />
                        <td />
                        <td className="px-4 py-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={handleUpdate}
                              disabled={saving || !editName.trim()}
                              className="p-1.5 text-green-400 hover:text-green-300 transition-colors disabled:opacity-50"
                              title="Save"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditId(null)}
                              className="p-1.5 text-slate-500 hover:text-white transition-colors"
                              title="Cancel"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-white">{campaign.name}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div
                            className="w-5 h-5 rounded-full border border-white/[0.08]"
                            style={{ backgroundColor: campaign.color }}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-slate-500">
                            {campaign.description || <span className="text-slate-600">—</span>}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                            <FileText className="w-3 h-3" />
                            {campaign.content_count ?? 0}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-slate-500">
                            {new Date(campaign.created_at).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {deleteId === campaign.id ? (
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-xs text-amber-400">Content will be untagged</span>
                              <button
                                onClick={() => handleDelete(campaign.id)}
                                className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                              >
                                Delete
                              </button>
                              <button
                                onClick={() => setDeleteId(null)}
                                className="px-2 py-1 text-xs text-slate-500 hover:text-white transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => startEdit(campaign)}
                                className="p-1.5 text-slate-500 hover:text-white transition-colors"
                                title="Edit"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeleteId(campaign.id)}
                                className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
