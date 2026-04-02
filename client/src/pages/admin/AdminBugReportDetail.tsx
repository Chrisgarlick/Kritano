/**
 * Admin Bug Report Detail Page
 *
 * View and manage a single bug report with comments.
 */

import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Bug,
  Clock,
  User,
  Monitor,
  Globe,
  Send,
  Loader2,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { useToast } from '../../components/ui/Toast';
import { adminBugReportsApi, type BugReport, type BugReportComment } from '../../services/api';
import { formatDate } from '../../utils/format';

const statusColors: Record<string, string> = {
  open: 'bg-amber-900/30 text-amber-300',
  in_progress: 'bg-indigo-900/30 text-indigo-300',
  resolved: 'bg-emerald-900/30 text-emerald-300',
  closed: 'bg-white/[0.06] text-slate-300',
};

const severityColors: Record<string, string> = {
  critical: 'bg-red-900/30 text-red-300',
  major: 'bg-orange-900/30 text-orange-300',
  minor: 'bg-amber-900/30 text-amber-300',
  trivial: 'bg-white/[0.06] text-slate-300',
};

const priorityColors: Record<string, string> = {
  urgent: 'bg-red-900/30 text-red-300',
  high: 'bg-orange-900/30 text-orange-300',
  medium: 'bg-amber-900/30 text-amber-300',
  low: 'bg-white/[0.06] text-slate-300',
};

export default function AdminBugReportDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [report, setReport] = useState<(BugReport & { comments: BugReportComment[] }) | null>(null);
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

  const loadReport = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await adminBugReportsApi.getById(id);
      setReport(res.data.report);
      setStatus(res.data.report.status);
      setPriority(res.data.report.priority || '');
      setAdminNotes((res.data.report as any).admin_notes || '');
      setResolutionNotes((res.data.report as any).resolution_notes || '');
    } catch (err) {
      console.error('Failed to load bug report:', err);
      toast('Failed to load bug report', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const handleUpdate = async () => {
    if (!id) return;
    try {
      setUpdating(true);
      await adminBugReportsApi.update(id, {
        status: status as any,
        priority: priority ? (priority as any) : null,
        adminNotes,
        resolutionNotes,
      });
      toast('Bug report updated', 'success');
      loadReport();
    } catch (err) {
      console.error('Failed to update bug report:', err);
      toast('Failed to update bug report', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !window.confirm('Are you sure you want to delete this bug report?')) return;
    try {
      setDeleting(true);
      await adminBugReportsApi.delete(id);
      toast('Bug report deleted', 'success');
      navigate('/admin/bug-reports');
    } catch (err) {
      console.error('Failed to delete bug report:', err);
      toast('Failed to delete bug report', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleAddComment = async () => {
    if (!id || !newComment.trim()) return;
    try {
      setSendingComment(true);
      await adminBugReportsApi.addComment(id, newComment.trim());
      setNewComment('');
      toast('Comment added', 'success');
      loadReport();
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

  if (!report) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <Bug className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">
            Report not found
          </h2>
          <Link
            to="/admin/bug-reports"
            className="inline-flex items-center px-4 py-2 bg-white/[0.06] hover:bg-white/[0.06] text-white rounded-lg transition-colors"
          >
            Back to Reports
          </Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Helmet><title>Admin: Bug Report | Kritano</title></Helmet>
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/admin/bug-reports"
          className="inline-flex items-center text-sm text-slate-500 hover:text-white mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Bug Reports
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">
              {report.title}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${severityColors[report.severity]}`}>
                {report.severity}
              </span>
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[report.status]}`}>
                {report.status.replace('_', ' ')}
              </span>
              {report.priority && (
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${priorityColors[report.priority]}`}>
                  {report.priority}
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
              {report.description}
            </p>
          </div>

          {/* Context */}
          <div className="bg-white/[0.02] rounded-lg border border-white/[0.06] p-6">
            <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4">
              Context
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {report.page_url && (
                <div className="flex items-start gap-3">
                  <Globe className="w-5 h-5 text-slate-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-300">Page URL</p>
                    <a
                      href={report.page_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                    >
                      {report.page_url}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}
              {(report as any).screen_size && (
                <div className="flex items-start gap-3">
                  <Monitor className="w-5 h-5 text-slate-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-300">Screen Size</p>
                    <p className="text-sm text-slate-500">{(report as any).screen_size}</p>
                  </div>
                </div>
              )}
              {(report as any).browser_info && (
                <div className="flex items-start gap-3">
                  <Bug className="w-5 h-5 text-slate-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-300">Browser</p>
                    <p className="text-sm text-slate-500">
                      {(report as any).browser_info.name} {(report as any).browser_info.version} / {(report as any).browser_info.os}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Comments */}
          <div className="bg-white/[0.02] rounded-lg border border-white/[0.06] p-6">
            <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4">
              Comments ({report.comments.length})
            </h3>

            {report.comments.length > 0 ? (
              <div className="space-y-4 mb-6">
                {report.comments.map((comment) => (
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
              Reporter
            </h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/[0.06] rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-slate-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  {report.reporter_email}
                </p>
                <p className="text-xs text-slate-500">
                  Reported {formatDate(report.created_at)}
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
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
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
                  placeholder="How was this resolved?"
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
                Update Report
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
                <span className="text-white">{formatDate(report.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Updated</span>
                <span className="text-white">{formatDate(report.updated_at)}</span>
              </div>
              {report.resolved_at && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Resolved</span>
                  <span className="text-white">{formatDate(report.resolved_at)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
