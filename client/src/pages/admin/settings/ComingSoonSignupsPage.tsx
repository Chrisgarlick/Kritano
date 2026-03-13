import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../../../components/layout/AdminLayout';
import { adminComingSoonApi } from '../../../services/api';
import { Clock, Download, Trash2, Search, Loader2, ArrowLeft, Users } from 'lucide-react';

interface Signup {
  id: string;
  email: string;
  name: string | null;
  ip_address: string | null;
  created_at: string;
}

export default function ComingSoonSignupsPage() {
  const [signups, setSignups] = useState<Signup[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadSignups();
  }, [page, search]);

  const loadSignups = async () => {
    try {
      const res = await adminComingSoonApi.listSignups({ page, search: search || undefined });
      setSignups(res.data.signups);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error('Failed to load signups:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this signup?')) return;
    try {
      await adminComingSoonApi.deleteSignup(id);
      setSignups((prev) => prev.filter((s) => s.id !== id));
      setPagination((prev) => ({ ...prev, total: prev.total - 1 }));
    } catch (err) {
      console.error('Failed to delete signup:', err);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await adminComingSoonApi.exportSignups();
      const blob = new Blob([res.data as BlobPart], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'coming-soon-signups.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export:', err);
    } finally {
      setExporting(false);
    }
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <Link to="/admin/settings" className="text-slate-400 hover:text-white transition">
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <h1 className="text-3xl font-bold text-white tracking-tight flex items-center space-x-2" style={{ fontFamily: "'Instrument Serif', serif" }}>
                <Clock className="w-6 h-6" />
                <span>Coming Soon Signups</span>
              </h1>
            </div>
            <p className="text-slate-400">
              <Users className="w-4 h-4 inline mr-1" />
              {pagination.total} total signup{pagination.total !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={handleExport}
            disabled={exporting || pagination.total === 0}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>Export CSV</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by email or name..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/[0.02] border border-white/[0.06] rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
          />
        </div>

        {/* Table */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : signups.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              {search ? 'No signups match your search.' : 'No signups yet.'}
            </div>
          ) : (
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Email</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">IP</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {signups.map((signup) => (
                  <tr key={signup.id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-sm text-white font-medium">{signup.email}</td>
                    <td className="px-4 py-3 text-sm text-slate-300">{signup.name || '—'}</td>
                    <td className="px-4 py-3 text-sm text-slate-400 font-mono text-xs">{signup.ip_address || '—'}</td>
                    <td className="px-4 py-3 text-sm text-slate-400">
                      {new Date(signup.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(signup.id)}
                        className="text-slate-400 hover:text-red-400 transition"
                        title="Delete signup"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-center space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm bg-white/[0.02] border border-white/[0.06] rounded-lg text-slate-300 hover:bg-white/[0.06] disabled:opacity-50 transition"
            >
              Previous
            </button>
            <span className="text-sm text-slate-400">
              Page {page} of {pagination.pages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={page === pagination.pages}
              className="px-3 py-1.5 text-sm bg-white/[0.02] border border-white/[0.06] rounded-lg text-slate-300 hover:bg-white/[0.06] disabled:opacity-50 transition"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
