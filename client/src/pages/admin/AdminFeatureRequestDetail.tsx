/**
 * Admin Feature Request Detail Page
 *
 * View and manage a single feature request with comments.
 */

import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Lightbulb,
  Clock,
  User,
  Globe,
  Send,
  Loader2,
  Trash2,
} from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { useToast } from '../../components/ui/Toast';
import { adminFeatureRequestsApi, type FeatureRequest, type FeatureRequestComment } from '../../services/api';
import { formatDate } from '../../utils/format';

const statusColors: Record<string, string> = {
  submitted: 'bg-amber-900/30 text-amber-300',
  under_review: 'bg-indigo-900/30 text-indigo-300',
  planned: 'bg-purple-900/30 text-purple-300',
  in_progress: 'bg-blue-900/30 text-blue-300',
  completed: 'bg-emerald-900/30 text-emerald-300',
  declined: 'bg-white/[0.06] text-slate-300',
};

const impactColors: Record<string, string> = {
  critical_for_workflow: 'bg-red-900/30 text-red-300',
  important: 'bg-orange-900/30 text-orange-300',
  would_be_helpful: 'bg-amber-900/30 text-amber-300',
  nice_to_have: 'bg-white/[0.06] text-slate-300',
};

const impactLabels: Record<string, string> = {
  critical_for_workflow: 'Critical for Workflow',
  important: 'Important',
  would_be_helpful: 'Would Be Helpful',
  nice_to_have: 'Nice to Have',
};

const priorityColors: Record<string, string> = {
  urgent: 'bg-red-900/30 text-red-300',
  high: 'bg-orange-900/30 text-orange-300',
  medium: 'bg-amber-900/30 text-amber-300',
  low: 'bg-white/[0.06] text-slate-300',
};

export default function AdminFeatureRequestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [request, setRequest] = useState<(FeatureRequest & { comments: FeatureRequestComment[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [newComment, setNewComment] = useState('');
  const [sendingComment, setSendingComment] = useState(false);

  const loadRequest = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await adminFeatureRequestsApi.getById(id);
      setRequest(res.data.request);
      setStatus(res.data.request.status);
      setPriority(res.data.request.priority || '');
      setAdminNotes((res.data.request as any).admin_notes || '');
      setResolutionNotes((res.data.request as any).resolution_notes || '');
    } catch (err) {
      console.error('Failed to load feature request:', err);
      toast('Failed to load feature request', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    loadRequest();
  }, [loadRequest]);

  const handleUpdate = async () => {
    if (!id) return;
    try {
      setUpdating(true);
      await adminFeatureRequestsApi.update(id, {
        status: status as any,
        priority: priority ? (priority as any) : null,
        adminNotes,
        resolutionNotes,
      });
      toast('Feature request updated', 'success');
      loadRequest();
    } catch (err) {
      console.error('Failed to update feature request:', err);
      toast('Failed to update feature request', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !window.confirm('Are you sure you want to delete this feature request?')) return;
    try {
      setDeleting(true);
      await adminFeatureRequestsApi.delete(id);
      toast('Feature request deleted', 'success');
      navigate('/admin/feature-requests');
    } catch (err) {
      console.error('Failed to delete feature request:', err);
      toast('Failed to delete feature request', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleAddComment = async () => {
    if (!id || !newComment.trim()) return;
    try {
      setSendingComment(true);
      await adminFeatureRequestsApi.addComment(id, newComment.trim());
      setNewComment('');
      toast('Comment added', 'success');
      loadRequest();
    } catch (err) {
      console.error('Failed to add comment:', err);
      toast('Failed to add comment', 'error');
    } finally {
      setSendingComment(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
        </div>
      </AdminLayout>
    );
  }

  if (!request) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <Lightbulb className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">
            Request not found
          </h2>
          <Link
            to="/admin/feature-requests"
            className="inline-flex items-center px-4 py-2 bg-white/[0.06] hover:bg-white/[0.06] text-white rounded-lg transition-colors"
          >
            Back to Requests
          </Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Helmet><title>Admin: Feature Request | PagePulser</title></Helmet>
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/admin/feature-requests"
          className="inline-flex items-center text-sm text-slate-500 hover:text-white mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Feature Requests
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">
              {request.title}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${impactColors[request.impact]}`}>
                {impactLabels[request.impact]}
              </span>
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[request.status]}`}>
                {request.status.replace(/_/g, ' ')}
              </span>
              {request.priority && (
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${priorityColors[request.priority]}`}>
                  {request.priority}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white/[0.02] rounded-lg border border-white/[0.06] p-6">
            <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-3">
              Description
            </h3>
            <p className="text-white whitespace-pre-wrap">
              {request.description}
            </p>
          </div>

          {/* Context */}
          <div className="bg-white/[0.02] rounded-lg border border-white/[0.06] p-6">
            <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4">
              Context
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {request.page_url && (
                <div className="flex items-start gap-3">
                  <Globe className="w-5 h-5 text-slate-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-300">Page URL</p>
                    <p className="text-sm text-slate-500 break-all">{request.page_url}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-slate-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-300">Category</p>
                  <p className="text-sm text-slate-500">{request.category.replace(/_/g, '/')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Comments */}
          <div className="bg-white/[0.02] rounded-lg border border-white/[0.06] p-6">
            <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4">
              Comments ({request.comments.length})
            </h3>

            {request.comments.length > 0 ? (
              <div className="space-y-4 mb-6">
                {request.comments.map((comment) => (
                  <div
                    key={comment.id}
                    className={`p-4 rounded-lg ${
                      comment.is_admin_comment
                        ? 'bg-indigo-900/20 border-l-4 border-indigo-500'
                        : 'bg-white/[0.03]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-500" />
                        <span className="text-sm font-medium text-white">
                          {comment.first_name} {comment.last_name}
                        </span>
                        {comment.is_admin_comment && (
                          <span className="px-1.5 py-0.5 text-xs font-medium bg-indigo-900/50 text-indigo-300 rounded">
                            Admin
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500">
                        {formatDate(comment.created_at)}
                      </span>
                    </div>
                    <p className="text-slate-300 whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 mb-6">No comments yet</p>
            )}

            {/* Add Comment */}
            <div className="border-t border-white/[0.06] pt-4">
              <textarea
                rows={3}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="w-full px-3 py-2 border border-white/[0.08]
                         rounded-lg bg-white/[0.03] text-white resize-none placeholder-slate-500
                         focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || sendingComment}
                  className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingComment ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Reporter Info */}
          <div className="bg-white/[0.02] rounded-lg border border-white/[0.06] p-6">
            <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4">
              Requester
            </h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/[0.06] rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-slate-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  {request.reporter_email}
                </p>
                <p className="text-xs text-slate-500">
                  Requested {formatDate(request.created_at)}
                </p>
              </div>
            </div>
          </div>

          {/* Status & Priority */}
          <div className="bg-white/[0.02] rounded-lg border border-white/[0.06] p-6">
            <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4">
              Manage
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-white/[0.08]
                           rounded-lg bg-white/[0.03] text-white"
                >
                  <option value="submitted">Submitted</option>
                  <option value="under_review">Under Review</option>
                  <option value="planned">Planned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="declined">Declined</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3 py-2 border border-white/[0.08]
                           rounded-lg bg-white/[0.03] text-white"
                >
                  <option value="">Not Set</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Admin Notes
                </label>
                <textarea
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Internal notes..."
                  className="w-full px-3 py-2 border border-white/[0.08]
                           rounded-lg bg-white/[0.03] text-white resize-none placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Resolution Notes
                </label>
                <textarea
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="How was this addressed?"
                  className="w-full px-3 py-2 border border-white/[0.08]
                           rounded-lg bg-white/[0.03] text-white resize-none placeholder-slate-500"
                />
              </div>

              <button
                onClick={handleUpdate}
                disabled={updating}
                className="w-full flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {updating ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Clock className="w-4 h-4 mr-2" />
                )}
                Update Request
              </button>
            </div>
          </div>

          {/* Timestamps */}
          <div className="bg-white/[0.02] rounded-lg border border-white/[0.06] p-6">
            <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4">
              Timeline
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Created</span>
                <span className="text-white">{formatDate(request.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Updated</span>
                <span className="text-white">{formatDate(request.updated_at)}</span>
              </div>
              {request.completed_at && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Completed</span>
                  <span className="text-white">{formatDate(request.completed_at)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
