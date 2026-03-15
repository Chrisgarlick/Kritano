/**
 * Admin SEO Manager Page
 *
 * Lists all app routes from the route registry, merged with any saved
 * SEO overrides from the database. Allows admins to edit SEO metadata
 * for any route.
 */

import { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Search, Globe, EyeOff, ChevronDown, ChevronRight,
  Save, RotateCcw, Check, X, Filter,
} from 'lucide-react';
import { AdminLayout } from '../../../components/layout/AdminLayout';
import { routeRegistry, type RouteEntry } from '../../../config/routeRegistry';
import { adminSeoApi } from '../../../services/api';

interface SeoEntry {
  id?: string;
  route_path: string;
  title: string | null;
  description: string | null;
  keywords: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image: string | null;
  og_type: string;
  twitter_card: string;
  canonical_url: string | null;
  featured_image: string | null;
  structured_data: Record<string, unknown> | null;
  noindex: boolean;
  updated_at?: string;
}

type CategoryFilter = 'all' | RouteEntry['category'];

export default function SeoManagerPage() {
  const [overrides, setOverrides] = useState<Map<string, SeoEntry>>(new Map());
  const [loading, setLoading] = useState(true);
  const [expandedPath, setExpandedPath] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Form state for the currently expanded row
  const [form, setForm] = useState<Partial<SeoEntry>>({});

  useEffect(() => {
    loadOverrides();
  }, []);

  async function loadOverrides() {
    try {
      const res = await adminSeoApi.list();
      const map = new Map<string, SeoEntry>();
      for (const entry of res.data.entries) {
        map.set(entry.route_path, entry);
      }
      setOverrides(map);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }

  const filteredRoutes = useMemo(() => {
    return routeRegistry.filter((route) => {
      if (categoryFilter !== 'all' && route.category !== categoryFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          route.path.toLowerCase().includes(q) ||
          route.label.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [searchQuery, categoryFilter]);

  function openEditor(route: RouteEntry) {
    if (expandedPath === route.path) {
      setExpandedPath(null);
      return;
    }
    const existing = overrides.get(route.path);
    setForm({
      title: existing?.title ?? '',
      description: existing?.description ?? '',
      keywords: existing?.keywords ?? '',
      og_title: existing?.og_title ?? '',
      og_description: existing?.og_description ?? '',
      og_image: existing?.og_image ?? '',
      og_type: existing?.og_type ?? 'website',
      twitter_card: existing?.twitter_card ?? 'summary_large_image',
      canonical_url: existing?.canonical_url ?? '',
      featured_image: existing?.featured_image ?? '',
      structured_data: existing?.structured_data ?? null,
      noindex: existing?.noindex ?? route.noindex ?? false,
    });
    setExpandedPath(route.path);
    setSaveSuccess(null);
  }

  async function handleSave(routePath: string) {
    setSaving(true);
    try {
      await adminSeoApi.upsert({
        route_path: routePath,
        title: form.title || null,
        description: form.description || null,
        keywords: form.keywords || null,
        og_title: form.og_title || null,
        og_description: form.og_description || null,
        og_image: form.og_image || null,
        og_type: form.og_type || null,
        twitter_card: form.twitter_card || null,
        canonical_url: form.canonical_url || null,
        featured_image: form.featured_image || null,
        structured_data: form.structured_data || null,
        noindex: form.noindex ?? false,
      });
      await loadOverrides();
      setSaveSuccess(routePath);
      setTimeout(() => setSaveSuccess(null), 2000);
    } catch {
      // Error handling
    } finally {
      setSaving(false);
    }
  }

  async function handleReset(routePath: string) {
    try {
      await adminSeoApi.remove(routePath);
      await loadOverrides();
      setExpandedPath(null);
    } catch {
      // Error handling
    }
  }

  async function handleBulkNoindex(category: RouteEntry['category']) {
    const routes = routeRegistry.filter((r) => r.category === category);
    for (const route of routes) {
      await adminSeoApi.upsert({
        route_path: route.path,
        noindex: true,
      });
    }
    await loadOverrides();
  }

  const categoryBadgeClasses: Record<RouteEntry['category'], string> = {
    public: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    auth: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    dashboard: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    admin: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  };

  const previewTitle = form.title || routeRegistry.find((r) => r.path === expandedPath)?.defaultTitle || '';
  const previewDescription = form.description || routeRegistry.find((r) => r.path === expandedPath)?.defaultDescription || '';

  return (
    <AdminLayout>
      <Helmet><title>SEO Manager - Admin - PagePulser</title></Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight" style={{ fontFamily: "'Instrument Serif', serif" }}>SEO Manager</h1>
            <p className="text-slate-500 mt-1">
              Manage meta tags, Open Graph data and structured data for all routes.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">
              {routeRegistry.length} routes · {overrides.size} customised
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search routes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/[0.02] border border-white/[0.06] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-500" />
            {(['all', 'public', 'auth', 'dashboard', 'admin'] as CategoryFilter[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  categoryFilter === cat
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white/[0.02] text-slate-500 hover:bg-white/[0.06] hover:text-white'
                }`}
              >
                {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Bulk actions */}
        {categoryFilter !== 'all' && categoryFilter !== 'public' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkNoindex(categoryFilter)}
              className="px-3 py-1.5 text-xs font-medium rounded-md bg-white/[0.02] text-slate-500 hover:bg-white/[0.06] hover:text-white border border-white/[0.06] transition-colors"
            >
              <EyeOff className="h-3 w-3 inline mr-1" />
              Mark all {categoryFilter} routes as noindex
            </button>
          </div>
        )}

        {/* Routes list */}
        {loading ? (
          <div className="text-center py-12 text-slate-500">Loading…</div>
        ) : (
          <div className="space-y-1">
            {filteredRoutes.map((route) => {
              const hasOverride = overrides.has(route.path);
              const isExpanded = expandedPath === route.path;
              const override = overrides.get(route.path);

              return (
                <div key={route.path} className="bg-white/[0.01] border border-white/[0.06] rounded-lg overflow-hidden">
                  {/* Row header */}
                  <button
                    onClick={() => openEditor(route)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.02] transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-slate-500 shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-slate-500 shrink-0" />
                    )}
                    <Globe className="h-4 w-4 text-slate-500 shrink-0" />
                    <code className="text-sm text-white font-mono">{route.path}</code>
                    <span className="text-sm text-slate-500">{route.label}</span>
                    <span className={`ml-auto text-xs px-2 py-0.5 rounded border ${categoryBadgeClasses[route.category]}`}>
                      {route.category}
                    </span>
                    {hasOverride ? (
                      <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        Customised
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded bg-white/[0.03] text-slate-500 border border-white/[0.04]">
                        Default
                      </span>
                    )}
                    {(override?.noindex || (!hasOverride && route.noindex)) && (
                      <EyeOff className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    )}
                  </button>

                  {/* Expanded editor */}
                  {isExpanded && (
                    <div className="border-t border-white/[0.06] px-4 py-4 space-y-4">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left: Form fields */}
                        <div className="space-y-4">
                          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Meta Tags</h3>

                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">
                              Title <span className="text-slate-600">(max 200 chars)</span>
                            </label>
                            <input
                              type="text"
                              value={form.title || ''}
                              onChange={(e) => setForm({ ...form, title: e.target.value })}
                              placeholder={route.defaultTitle}
                              maxLength={200}
                              className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-md text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">
                              Description <span className="text-slate-600">(max 500 chars)</span>
                            </label>
                            <textarea
                              value={form.description || ''}
                              onChange={(e) => setForm({ ...form, description: e.target.value })}
                              placeholder={route.defaultDescription}
                              maxLength={500}
                              rows={3}
                              className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-md text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Keywords</label>
                            <input
                              type="text"
                              value={form.keywords || ''}
                              onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                              placeholder="comma, separated, keywords"
                              maxLength={500}
                              className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-md text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                          </div>

                          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider pt-2">Open Graph</h3>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1">OG Title</label>
                              <input
                                type="text"
                                value={form.og_title || ''}
                                onChange={(e) => setForm({ ...form, og_title: e.target.value })}
                                placeholder={form.title || route.defaultTitle}
                                maxLength={200}
                                className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-md text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1">OG Type</label>
                              <select
                                value={form.og_type || 'website'}
                                onChange={(e) => setForm({ ...form, og_type: e.target.value })}
                                className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                              >
                                <option value="website">website</option>
                                <option value="article">article</option>
                                <option value="product">product</option>
                                <option value="profile">profile</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">OG Description</label>
                            <textarea
                              value={form.og_description || ''}
                              onChange={(e) => setForm({ ...form, og_description: e.target.value })}
                              placeholder={form.description || route.defaultDescription}
                              maxLength={500}
                              rows={2}
                              className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-md text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">OG Image URL</label>
                            <input
                              type="text"
                              value={form.og_image || ''}
                              onChange={(e) => setForm({ ...form, og_image: e.target.value })}
                              placeholder="https://pagepulser.com/og-image.png"
                              maxLength={1000}
                              className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-md text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                          </div>

                          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider pt-2">Featured Image</h3>

                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">
                              Featured Image URL <span className="text-slate-600">(hero/banner image for the page)</span>
                            </label>
                            <input
                              type="text"
                              value={form.featured_image || ''}
                              onChange={(e) => setForm({ ...form, featured_image: e.target.value })}
                              placeholder="https://pagepulser.com/images/page-hero.jpg"
                              maxLength={1000}
                              className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-md text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                            {form.featured_image && (
                              <div className="mt-2 rounded-md overflow-hidden border border-white/[0.08]">
                                <img
                                  src={form.featured_image}
                                  alt="Featured preview"
                                  className="w-full h-32 object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              </div>
                            )}
                          </div>

                          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider pt-2">Advanced</h3>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1">Twitter Card</label>
                              <select
                                value={form.twitter_card || 'summary_large_image'}
                                onChange={(e) => setForm({ ...form, twitter_card: e.target.value })}
                                className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                              >
                                <option value="summary_large_image">summary_large_image</option>
                                <option value="summary">summary</option>
                              </select>
                            </div>
                            <div className="flex items-end">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={form.noindex ?? false}
                                  onChange={(e) => setForm({ ...form, noindex: e.target.checked })}
                                  className="w-4 h-4 rounded border-white/[0.08] bg-white/[0.03] text-indigo-500 focus:ring-indigo-500/20"
                                />
                                <span className="text-sm text-slate-300">noindex / nofollow</span>
                              </label>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Canonical URL</label>
                            <input
                              type="text"
                              value={form.canonical_url || ''}
                              onChange={(e) => setForm({ ...form, canonical_url: e.target.value })}
                              placeholder={`https://pagepulser.com${route.path}`}
                              maxLength={1000}
                              className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-md text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">
                              Structured Data (JSON-LD)
                            </label>
                            <textarea
                              value={form.structured_data ? JSON.stringify(form.structured_data, null, 2) : ''}
                              onChange={(e) => {
                                try {
                                  const parsed = e.target.value ? JSON.parse(e.target.value) : null;
                                  setForm({ ...form, structured_data: parsed });
                                } catch {
                                  // Allow invalid JSON while typing
                                }
                              }}
                              placeholder='{"@context": "https://schema.org", ...}'
                              rows={4}
                              className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-md text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none font-mono"
                            />
                          </div>
                        </div>

                        {/* Right: Preview panel */}
                        <div className="space-y-4">
                          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Google Preview</h3>
                          <div className="bg-white rounded-lg p-4 space-y-1">
                            <div className="text-sm text-green-700 font-mono truncate">
                              pagepulser.com{route.path === '/' ? '' : route.path}
                            </div>
                            <div className="text-xl text-blue-800 hover:underline cursor-default truncate">
                              {previewTitle || route.defaultTitle} | PagePulser
                            </div>
                            <div className="text-sm text-gray-600 line-clamp-2">
                              {previewDescription || route.defaultDescription}
                            </div>
                          </div>

                          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Social Preview</h3>
                          <div className="bg-white/[0.03] border border-white/[0.08] rounded-lg overflow-hidden">
                            {form.og_image ? (
                              <div className="h-40 bg-white/[0.06] flex items-center justify-center">
                                <img
                                  src={form.og_image}
                                  alt="OG preview"
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="h-40 bg-white/[0.06] flex items-center justify-center text-slate-500 text-sm">
                                No image set — will use default
                              </div>
                            )}
                            <div className="p-3 space-y-1">
                              <div className="text-xs text-slate-500 uppercase">pagepulser.com</div>
                              <div className="text-sm text-white font-medium truncate">
                                {form.og_title || previewTitle || route.defaultTitle}
                              </div>
                              <div className="text-xs text-slate-500 line-clamp-2">
                                {form.og_description || previewDescription || route.defaultDescription}
                              </div>
                            </div>
                          </div>

                          {/* Current status */}
                          {override && (
                            <div className="text-xs text-slate-500">
                              Last updated: {new Date(override.updated_at!).toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-3 pt-2 border-t border-white/[0.06]">
                        <button
                          onClick={() => handleSave(route.path)}
                          disabled={saving}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50"
                        >
                          {saveSuccess === route.path ? (
                            <><Check className="h-4 w-4" /> Saved</>
                          ) : (
                            <><Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save'}</>
                          )}
                        </button>

                        {hasOverride && (
                          <button
                            onClick={() => handleReset(route.path)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white/[0.06] hover:bg-white/[0.06] text-slate-300 text-sm font-medium rounded-md transition-colors"
                          >
                            <RotateCcw className="h-4 w-4" /> Reset to defaults
                          </button>
                        )}

                        <button
                          onClick={() => setExpandedPath(null)}
                          className="inline-flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-white text-sm transition-colors ml-auto"
                        >
                          <X className="h-4 w-4" /> Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {filteredRoutes.length === 0 && !loading && (
          <div className="text-center py-12 text-slate-500">
            No routes match your search.
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
