import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { adminResourcesApi, type AdminResourceSummary } from '../../services/api';
import {
  BookOpen,
  Edit3,
  RefreshCw,
  Eye,
  EyeOff,
  Download,
  Loader2,
  Plus,
  ExternalLink,
} from 'lucide-react';

export default function AdminResources(): JSX.Element {
  const [resources, setResources] = useState<AdminResourceSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await adminResourcesApi.list();
      setResources(res.data.resources);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to load resources');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const togglePublished = async (r: AdminResourceSummary): Promise<void> => {
    setActioningId(r.id);
    try {
      await adminResourcesApi.update(r.id, { published: !r.published });
      await load();
    } catch (err) {
      console.error(err);
      setError('Failed to update');
    } finally {
      setActioningId(null);
    }
  };

  const regenerate = async (r: AdminResourceSummary): Promise<void> => {
    setActioningId(r.id);
    try {
      await adminResourcesApi.regenerate(r.id);
      await load();
    } catch (err) {
      console.error(err);
      setError('Failed to regenerate hash');
    } finally {
      setActioningId(null);
    }
  };

  return (
    <AdminLayout>
      <Helmet><title>Admin: Gated Resources | Kritano</title></Helmet>

      <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight font-display">Gated Resources</h1>
          <p className="text-sm text-slate-500 mt-1">Lead-magnet library managed end to end.</p>
        </div>
        <Link
          to="/admin/resources/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 hover:bg-indigo-500/20 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          New resource
        </Link>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 rounded-lg bg-red-500/[0.06] border border-red-500/20 text-sm text-red-300">
          {error}
        </div>
      )}

      {!resources && (
        <div className="flex items-center justify-center py-20 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      )}

      {resources && resources.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <BookOpen className="w-10 h-10 mb-3 opacity-40" />
          <p className="text-sm">No resources yet. Create one to start capturing leads.</p>
        </div>
      )}

      {resources && resources.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.02] border-b border-white/[0.06]">
              <tr className="text-left text-xs text-slate-500 uppercase tracking-wider">
                <th className="px-5 py-3 font-medium">Title</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Formats</th>
                <th className="px-5 py-3 font-medium text-right">Downloads</th>
                <th className="px-5 py-3 font-medium text-right">Leads</th>
                <th className="px-5 py-3 font-medium text-right">30d</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {resources.map((r) => (
                <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-4">
                    <Link
                      to={`/admin/resources/${r.id}`}
                      className="font-medium text-white hover:text-indigo-300 transition-colors"
                    >
                      {r.title}
                    </Link>
                    <div className="text-xs text-slate-500 mt-0.5 font-mono">{r.slug}</div>
                  </td>
                  <td className="px-5 py-4 text-slate-300">{r.category}</td>
                  <td className="px-5 py-4">
                    <div className="flex gap-1 flex-wrap">
                      {r.formats.map((f) => (
                        <span
                          key={f}
                          className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right text-slate-300 tabular-nums">{r.download_count}</td>
                  <td className="px-5 py-4 text-right text-slate-300 tabular-nums">{r.lead_count}</td>
                  <td className="px-5 py-4 text-right text-slate-300 tabular-nums">{r.downloads_30d}</td>
                  <td className="px-5 py-4">
                    {r.published ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-300">
                        <Eye className="w-3 h-3" /> Published
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                        <EyeOff className="w-3 h-3" /> Draft
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() => togglePublished(r)}
                        disabled={actioningId === r.id}
                        className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors disabled:opacity-40"
                        title={r.published ? 'Unpublish' : 'Publish'}
                      >
                        {r.published ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => regenerate(r)}
                        disabled={actioningId === r.id}
                        className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors disabled:opacity-40"
                        title="Recompute content hash from disk"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${actioningId === r.id ? 'animate-spin' : ''}`} />
                      </button>
                      <a
                        href={adminResourcesApi.exportLeadsUrl(r.id)}
                        className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                        title="Export leads as CSV"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                      <Link
                        to={`/admin/resources/${r.id}`}
                        className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                        title="Edit"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </Link>
                      {r.published && (
                        <a
                          href={`/resources/${r.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                          title="View public page"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
