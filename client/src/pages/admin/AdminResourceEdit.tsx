import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AdminLayout } from '../../components/layout/AdminLayout';
import {
  adminResourcesApi,
  type AdminGatedResource,
  type AdminResourceLead,
} from '../../services/api';
import {
  ArrowLeft,
  Save,
  RefreshCw,
  Download,
  ExternalLink,
  Loader2,
  AlertCircle,
} from 'lucide-react';

const CATEGORIES = [
  'seo', 'accessibility', 'security', 'performance',
  'content-quality', 'structured-data', 'eeat', 'aeo',
  'guides', 'case-studies', 'product-updates',
] as const;

const FORMATS = ['md', 'pdf', 'html', 'docx'] as const;

const NEW_RESOURCE: Partial<AdminGatedResource> = {
  slug: '',
  title: '',
  subtitle: '',
  hook: '',
  category: 'guides',
  audience: '',
  description: '',
  preview_md: '',
  source_md_path: '',
  formats: ['md', 'pdf'],
  page_count: null,
};

export default function AdminResourceEdit(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const [resource, setResource] = useState<Partial<AdminGatedResource> | null>(
    isNew ? NEW_RESOURCE : null
  );
  const [leads, setLeads] = useState<AdminResourceLead[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const load = useCallback(async (): Promise<void> => {
    if (isNew || !id) return;
    try {
      const [resRes, leadsRes] = await Promise.all([
        adminResourcesApi.get(id),
        adminResourcesApi.listLeads(id, { page: 1, limit: 50 }),
      ]);
      setResource(resRes.data.resource);
      setLeads(leadsRes.data.leads);
    } catch (err) {
      console.error(err);
      setError('Failed to load resource');
    }
  }, [id, isNew]);

  useEffect(() => {
    void load();
  }, [load]);

  const update = <K extends keyof AdminGatedResource>(
    key: K,
    value: AdminGatedResource[K]
  ): void => {
    setResource((prev) => (prev ? { ...prev, [key]: value } : prev));
    setDirty(true);
  };

  const toggleFormat = (f: string): void => {
    if (!resource) return;
    const current = resource.formats || [];
    const next = current.includes(f) ? current.filter((x) => x !== f) : [...current, f];
    update('formats', next);
  };

  const save = async (): Promise<void> => {
    if (!resource) return;
    setSaving(true);
    setError(null);
    try {
      if (isNew) {
        const res = await adminResourcesApi.create(resource);
        navigate(`/admin/resources/${res.data.resource.id}`, { replace: true });
      } else if (id) {
        const patch = { ...resource };
        delete patch.id;
        delete patch.content_hash;
        delete patch.created_at;
        delete patch.updated_at;
        delete patch.download_count;
        await adminResourcesApi.update(id, patch);
        await load();
        setDirty(false);
      }
    } catch (err) {
      const message =
        (err as { response?: { data?: { error?: string } } }).response?.data?.error ||
        'Failed to save';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const regenerate = async (): Promise<void> => {
    if (!id || isNew) return;
    setSaving(true);
    try {
      await adminResourcesApi.regenerate(id);
      await load();
    } catch (err) {
      console.error(err);
      setError('Failed to regenerate hash');
    } finally {
      setSaving(false);
    }
  };

  if (!resource) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Helmet><title>Admin: {resource.title || 'New Resource'} | Kritano</title></Helmet>

      <div className="mb-6">
        <Link
          to="/admin/resources"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to resources
        </Link>
      </div>

      <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight font-display">
            {isNew ? 'New resource' : resource.title}
          </h1>
          {!isNew && (
            <p className="text-sm text-slate-500 mt-1 font-mono">{resource.slug}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isNew && resource.published && (
            <a
              href={`/resources/${resource.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-white/[0.04] border border-white/[0.06] text-slate-500 hover:text-slate-200 hover:bg-white/[0.06] transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View public page
            </a>
          )}
          {!isNew && (
            <button
              onClick={regenerate}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-white/[0.04] border border-white/[0.06] text-slate-500 hover:text-slate-200 hover:bg-white/[0.06] transition-all disabled:opacity-40"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${saving ? 'animate-spin' : ''}`} />
              Regenerate hash
            </button>
          )}
          <button
            onClick={save}
            disabled={saving || (!isNew && !dirty)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 hover:bg-indigo-500/20 transition-all disabled:opacity-40"
          >
            <Save className="w-3.5 h-3.5" />
            {isNew ? 'Create' : 'Save'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-2 px-4 py-3 rounded-lg bg-red-500/[0.06] border border-red-500/20 text-sm text-red-300">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main form */}
        <div className="lg:col-span-2 space-y-5">
          <FormSection title="Basics">
            <FormField label="Slug" hint="Lowercase letters, numbers, and dashes only. Cannot be changed once saved.">
              <input
                type="text"
                value={resource.slug || ''}
                onChange={(e) => update('slug', e.target.value)}
                disabled={!isNew}
                className="w-full px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.06] text-white font-mono text-sm focus:outline-none focus:border-indigo-500/40 disabled:opacity-50"
              />
            </FormField>
            <FormField label="Title">
              <input
                type="text"
                value={resource.title || ''}
                onChange={(e) => update('title', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.06] text-white text-sm focus:outline-none focus:border-indigo-500/40"
              />
            </FormField>
            <FormField label="Subtitle">
              <input
                type="text"
                value={resource.subtitle || ''}
                onChange={(e) => update('subtitle', e.target.value || null)}
                className="w-full px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.06] text-white text-sm focus:outline-none focus:border-indigo-500/40"
              />
            </FormField>
            <FormField label="Hook" hint="One-line value prop shown on the gate page and in cards.">
              <textarea
                rows={2}
                value={resource.hook || ''}
                onChange={(e) => update('hook', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.06] text-white text-sm focus:outline-none focus:border-indigo-500/40 resize-y"
              />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Category">
                <select
                  value={resource.category || 'guides'}
                  onChange={(e) => update('category', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.06] text-white text-sm focus:outline-none focus:border-indigo-500/40"
                >
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </FormField>
              <FormField label="Page count">
                <input
                  type="number"
                  value={resource.page_count ?? ''}
                  onChange={(e) => update('page_count', e.target.value ? parseInt(e.target.value, 10) : null)}
                  className="w-full px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.06] text-white text-sm focus:outline-none focus:border-indigo-500/40"
                />
              </FormField>
            </div>
            <FormField label="Audience">
              <input
                type="text"
                value={resource.audience || ''}
                onChange={(e) => update('audience', e.target.value || null)}
                placeholder="e.g. Agency owners, in-house developers"
                className="w-full px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.06] text-white text-sm focus:outline-none focus:border-indigo-500/40"
              />
            </FormField>
          </FormSection>

          <FormSection title="Content">
            <FormField label="Source MD path" hint="Relative to server/src/data/. The file must exist on disk to compute a content hash.">
              <input
                type="text"
                value={resource.source_md_path || ''}
                onChange={(e) => update('source_md_path', e.target.value)}
                placeholder="resources/my-checklist/source.md"
                className="w-full px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.06] text-white font-mono text-sm focus:outline-none focus:border-indigo-500/40"
              />
            </FormField>
            <FormField label="Description" hint="Shown on the gate page in a soft callout box.">
              <textarea
                rows={4}
                value={resource.description || ''}
                onChange={(e) => update('description', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.06] text-white text-sm focus:outline-none focus:border-indigo-500/40 resize-y"
              />
            </FormField>
            <FormField label="Preview MD" hint="Markdown shown publicly on the detail page above the form.">
              <textarea
                rows={10}
                value={resource.preview_md || ''}
                onChange={(e) => update('preview_md', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.06] text-white font-mono text-xs focus:outline-none focus:border-indigo-500/40 resize-y"
              />
            </FormField>
          </FormSection>

          <FormSection title="Formats">
            <div className="flex flex-wrap gap-2">
              {FORMATS.map((f) => {
                const active = (resource.formats || []).includes(f);
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => toggleFormat(f)}
                    className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-md transition-colors ${
                      active
                        ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                        : 'bg-white/[0.02] text-slate-500 border border-white/[0.06] hover:text-slate-300'
                    }`}
                  >
                    {f}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-slate-500 mt-3">
              MD is always served natively. PDF and DOCX route through typeset.chrisgarlick.com. HTML is reserved for when typeset adds support.
            </p>
          </FormSection>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {!isNew && (
            <FormSection title="Status">
              <button
                onClick={() => update('published', !resource.published)}
                className={`w-full px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  resource.published
                    ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/20'
                    : 'bg-white/[0.02] text-slate-400 border border-white/[0.06] hover:bg-white/[0.04]'
                }`}
              >
                {resource.published ? 'Published' : 'Draft'}
              </button>
              <div className="mt-4 text-xs text-slate-500 space-y-1">
                <div>Downloads: <span className="text-slate-300 tabular-nums">{resource.download_count ?? 0}</span></div>
                <div>Content hash: <span className="text-slate-300 font-mono break-all">{resource.content_hash?.slice(0, 12)}...</span></div>
                {resource.updated_at && (
                  <div>Updated: <span className="text-slate-300">{new Date(resource.updated_at).toLocaleString()}</span></div>
                )}
              </div>
            </FormSection>
          )}

          {!isNew && (
            <FormSection title={`Recent leads${leads ? ` (${leads.length})` : ''}`}>
              {leads === null ? (
                <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
              ) : leads.length === 0 ? (
                <p className="text-xs text-slate-500">No leads captured yet.</p>
              ) : (
                <>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {leads.map((l) => (
                      <div key={l.id} className="text-xs">
                        <div className="text-slate-300 truncate">{l.email}</div>
                        <div className="text-slate-600 flex items-center gap-2">
                          <span>{new Date(l.created_at).toLocaleDateString()}</span>
                          {l.consent_newsletter && <span className="text-emerald-400">opted in</span>}
                          {l.user_id && <span className="text-indigo-400">linked</span>}
                          {l.utm_source && <span className="font-mono">{l.utm_source}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                  <a
                    href={id ? adminResourcesApi.exportLeadsUrl(id) : '#'}
                    className="mt-4 inline-flex items-center gap-1.5 text-xs text-indigo-300 hover:text-indigo-200 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export all as CSV
                  </a>
                </>
              )}
            </FormSection>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }): JSX.Element {
  return (
    <section className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function FormField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-slate-400 mb-1.5">{label}</span>
      {children}
      {hint && <span className="block text-xs text-slate-600 mt-1">{hint}</span>}
    </label>
  );
}
