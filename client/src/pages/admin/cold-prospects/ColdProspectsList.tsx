import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Crosshair, Search, Loader2, Mail, User, Globe, Shield,
  ChevronLeft, ChevronRight, Trash2, RotateCcw, ExternalLink, Filter, MailX,
} from 'lucide-react';
import { AdminLayout } from '../../../components/layout/AdminLayout';
import { coldProspectsApi, type ColdProspectItem } from '../../../services/api';
import { useToast } from '../../../components/ui/Toast';

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-slate-600/20 text-slate-500' },
  checking: { label: 'Checking', className: 'bg-indigo-600/20 text-indigo-400' },
  live: { label: 'Live', className: 'bg-sky-600/20 text-sky-400' },
  extracting: { label: 'Extracting', className: 'bg-violet-600/20 text-violet-400' },
  qualified: { label: 'Qualified', className: 'bg-emerald-600/20 text-emerald-400' },
  contacted: { label: 'Contacted', className: 'bg-amber-600/20 text-amber-400' },
  converted: { label: 'Converted', className: 'bg-green-600/20 text-green-400' },
  dead: { label: 'Dead', className: 'bg-red-600/20 text-red-400' },
};

export default function ColdProspectsList() {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [prospects, setProspects] = useState<ColdProspectItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tlds, setTlds] = useState<string[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Filters from URL params
  const status = searchParams.get('status') || '';
  const tld = searchParams.get('tld') || '';
  const search = searchParams.get('search') || '';
  const hasEmail = searchParams.get('hasEmail') === 'true';
  const hasName = searchParams.get('hasName') === 'true';
  const isUnsubscribed = searchParams.get('isUnsubscribed') === 'true';
  const page = parseInt(searchParams.get('page') || '1');
  const sortBy = searchParams.get('sortBy') || 'created_at';
  const sortOrder = searchParams.get('sortOrder') || 'desc';
  const limit = 25;

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    if (key !== 'page') params.set('page', '1');
    setSearchParams(params);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [prospectsRes, tldsRes] = await Promise.all([
        coldProspectsApi.list({
          status: status || undefined,
          tld: tld || undefined,
          hasEmail: hasEmail || undefined,
          hasName: hasName || undefined,
          isUnsubscribed: isUnsubscribed || undefined,
          search: search || undefined,
          page,
          limit,
          sortBy,
          sortOrder,
        }),
        coldProspectsApi.getTlds(),
      ]);
      setProspects(prospectsRes.data.prospects);
      setTotal(prospectsRes.data.pagination.total);
      setTlds(tldsRes.data.tlds);
      setSelected(new Set());
    } catch {
      toast('Failed to load prospects', 'error');
    } finally {
      setLoading(false);
    }
  }, [status, tld, hasEmail, hasName, isUnsubscribed, search, page, sortBy, sortOrder, toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalPages = Math.ceil(total / limit);

  const handleExclude = async (id: string) => {
    try {
      await coldProspectsApi.exclude(id, 'Manually excluded');
      toast('Prospect excluded', 'success');
      fetchData();
    } catch {
      toast('Failed to exclude', 'error');
    }
  };

  const handleRetry = async (id: string) => {
    try {
      await coldProspectsApi.retry(id);
      toast('Prospect queued for retry', 'success');
      fetchData();
    } catch {
      toast('Failed to retry', 'error');
    }
  };

  const handleBulkExclude = async () => {
    if (selected.size === 0) return;
    try {
      await coldProspectsApi.bulkExclude(Array.from(selected), 'Bulk excluded');
      toast(`${selected.size} prospects excluded`, 'success');
      setSelected(new Set());
      fetchData();
    } catch {
      toast('Failed to bulk exclude', 'error');
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const toggleSelectAll = () => {
    if (selected.size === prospects.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(prospects.map(p => p.id)));
    }
  };

  const handleSort = (col: string) => {
    const params = new URLSearchParams(searchParams);
    if (sortBy === col) {
      params.set('sortOrder', sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      params.set('sortBy', col);
      params.set('sortOrder', 'desc');
    }
    setSearchParams(params);
  };

  const SortIcon = ({ col }: { col: string }) => {
    if (sortBy !== col) return null;
    return <span className="text-indigo-400 ml-1">{sortOrder === 'asc' ? '\u2191' : '\u2193'}</span>;
  };

  return (
    <AdminLayout>
      <Helmet><title>Admin: Prospects List | Kritano</title></Helmet>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link to="/admin/cold-prospects" className="text-slate-500 hover:text-white">
              <Crosshair className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-white tracking-tight font-display">Prospects</h1>
            <span className="text-sm text-slate-500">{total.toLocaleString()} total</span>
          </div>
          {selected.size > 0 && (
            <button
              onClick={handleBulkExclude}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              Exclude {selected.size} selected
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search domains, emails, names..."
              value={search}
              onChange={(e) => updateParam('search', e.target.value)}
              className="w-full pl-10 pr-3 py-2 bg-white/[0.02] border border-white/[0.06] rounded-lg text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <select
            value={status}
            onChange={(e) => updateParam('status', e.target.value)}
            className="bg-white/[0.02] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="">All Statuses</option>
            {Object.entries(STATUS_BADGES).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>

          <select
            value={tld}
            onChange={(e) => updateParam('tld', e.target.value)}
            className="bg-white/[0.02] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="">All TLDs</option>
            {tlds.map(t => <option key={t} value={t}>.{t}</option>)}
          </select>

          <button
            onClick={() => updateParam('hasEmail', hasEmail ? '' : 'true')}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border transition-colors ${
              hasEmail ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400' : 'bg-white/[0.02] border-white/[0.06] text-slate-500 hover:text-white'
            }`}
          >
            <Mail className="w-3 h-3" />
            Has Email
          </button>

          <button
            onClick={() => updateParam('hasName', hasName ? '' : 'true')}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border transition-colors ${
              hasName ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400' : 'bg-white/[0.02] border-white/[0.06] text-slate-500 hover:text-white'
            }`}
          >
            <User className="w-3 h-3" />
            Has Name
          </button>

          <button
            onClick={() => updateParam('isUnsubscribed', isUnsubscribed ? '' : 'true')}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border transition-colors ${
              isUnsubscribed ? 'bg-orange-600/20 border-orange-500 text-orange-400' : 'bg-white/[0.02] border-white/[0.06] text-slate-500 hover:text-white'
            }`}
          >
            <MailX className="w-3 h-3" />
            Unsubscribed
          </button>

          {(status || tld || search || hasEmail || hasName || isUnsubscribed) && (
            <button
              onClick={() => setSearchParams(new URLSearchParams())}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-500 hover:text-white"
            >
              <Filter className="w-3 h-3" />
              Clear
            </button>
          )}
        </div>

        {/* Table */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
            </div>
          ) : prospects.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-500">
              <Globe className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">No prospects found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] text-left">
                    <th className="p-3">
                      <input
                        type="checkbox"
                        checked={selected.size === prospects.length && prospects.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-white/[0.08]"
                      />
                    </th>
                    <th className="p-3 text-slate-500 font-medium cursor-pointer hover:text-white" onClick={() => handleSort('domain')}>
                      Domain<SortIcon col="domain" />
                    </th>
                    <th className="p-3 text-slate-500 font-medium">Status</th>
                    <th className="p-3 text-slate-500 font-medium cursor-pointer hover:text-white" onClick={() => handleSort('quality_score')}>
                      Score<SortIcon col="quality_score" />
                    </th>
                    <th className="p-3 text-slate-500 font-medium">Contact</th>
                    <th className="p-3 text-slate-500 font-medium">Tech</th>
                    <th className="p-3 text-slate-500 font-medium cursor-pointer hover:text-white" onClick={() => handleSort('created_at')}>
                      Added<SortIcon col="created_at" />
                    </th>
                    <th className="p-3 text-slate-500 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {prospects.map((p) => {
                    const badge = STATUS_BADGES[p.status] || STATUS_BADGES.pending;
                    return (
                      <tr key={p.id} className={`border-b border-white/[0.04] hover:bg-white/[0.02] ${p.is_unsubscribed ? 'opacity-60' : ''}`}>
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={selected.has(p.id)}
                            onChange={() => toggleSelect(p.id)}
                            className="rounded border-white/[0.08]"
                          />
                        </td>
                        <td className="p-3">
                          <Link to={`/admin/cold-prospects/${p.id}`} className="text-white hover:text-indigo-400 font-medium">
                            {p.domain}
                          </Link>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-slate-500">.{p.tld}</span>
                            {p.has_ssl && <span title="SSL"><Shield className="w-3 h-3 text-emerald-400" /></span>}
                            {p.title && <span className="text-[10px] text-slate-500 truncate max-w-[200px]">{p.title}</span>}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${badge.className}`}>
                              {badge.label}
                            </span>
                            {p.is_unsubscribed && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-orange-600/20 text-orange-400 rounded-md">
                                <MailX className="w-2.5 h-2.5" />
                                Unsubscribed
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <span className={`text-sm font-mono ${
                            p.quality_score >= 60 ? 'text-emerald-400' :
                            p.quality_score >= 30 ? 'text-amber-400' : 'text-slate-500'
                          }`}>
                            {p.quality_score}
                          </span>
                        </td>
                        <td className="p-3">
                          {p.contact_email ? (
                            <div>
                              <div className="flex items-center gap-1.5">
                                <Mail className="w-3 h-3 text-emerald-400" />
                                <span className={`text-xs text-white ${p.is_unsubscribed ? 'line-through' : ''}`}>{p.contact_email}</span>
                              </div>
                              {p.contact_name && (
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <User className="w-3 h-3 text-sky-400" />
                                  <span className="text-xs text-slate-300">{p.contact_name}</span>
                                  {p.contact_role && <span className="text-[10px] text-slate-500">({p.contact_role})</span>}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500">-</span>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1">
                            {(p.technology_stack || []).slice(0, 3).map(t => (
                              <span key={t} className="text-[10px] bg-white/[0.06] text-slate-300 px-1.5 py-0.5 rounded">
                                {t}
                              </span>
                            ))}
                            {(p.technology_stack || []).length > 3 && (
                              <span className="text-[10px] text-slate-500">+{p.technology_stack.length - 3}</span>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="text-xs text-slate-500">
                            {new Date(p.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <a
                              href={`https://${p.domain}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-slate-500 hover:text-white rounded hover:bg-white/[0.06]"
                              title="Visit site"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                            <button
                              onClick={() => handleRetry(p.id)}
                              className="p-1.5 text-slate-500 hover:text-indigo-400 rounded hover:bg-white/[0.06]"
                              title="Retry processing"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleExclude(p.id)}
                              className="p-1.5 text-slate-500 hover:text-red-400 rounded hover:bg-white/[0.06]"
                              title="Exclude"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-slate-500">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateParam('page', String(page - 1))}
                disabled={page <= 1}
                className="p-2 text-slate-500 hover:text-white disabled:opacity-30 rounded hover:bg-white/[0.06]"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => updateParam('page', String(page + 1))}
                disabled={page >= totalPages}
                className="p-2 text-slate-500 hover:text-white disabled:opacity-30 rounded hover:bg-white/[0.06]"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
