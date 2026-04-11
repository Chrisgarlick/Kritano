import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  LayoutGrid,
  List,
  Globe,
  Search,
  X,
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { Display, Body, Heading } from '../../components/ui/Typography';
import { NoSitesEmptyState } from '../../components/ui/EmptyState';
import { SiteCard, SiteCardGrid, SiteListItem } from '../../components/ui/SiteCard';
import { useToast } from '../../components/ui/Toast';
import { sitesApi } from '../../services/api';
import type { SiteWithStats } from '../../types/site.types';
import type { Audit } from '../../types/audit.types';

type ViewMode = 'grid' | 'list';

const STORAGE_KEY = 'sites-view-mode';

export default function SiteListPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [sites, setSites] = useState<SiteWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [_error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<{ sites: number; maxSites: number | null; canAddMore: boolean } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // View mode state (persisted)
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return (stored === 'list' || stored === 'grid') ? stored : 'grid';
  });

  // Add site modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDomain, setNewDomain] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [adding, setAdding] = useState(false);

  // Persist view mode
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, viewMode);
  }, [viewMode]);

  const fetchSites = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await sitesApi.list();
      setSites(response.data.sites);
      setUsage(response.data.usage);
    } catch (err: any) {
      console.error('Failed to fetch sites:', err);
      setError('Failed to load sites. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  const handleAddSite = async () => {
    if (!newName.trim() || !newDomain.trim()) return;

    try {
      setAdding(true);
      const response = await sitesApi.create({
        name: newName.trim(),
        domain: newDomain.trim(),
        description: newDescription.trim() || undefined,
      });
      toast('Site added successfully', 'success');
      setShowAddModal(false);
      setNewName('');
      setNewDomain('');
      setNewDescription('');
      navigate(`/app/sites/${response.data.site.id}`);
    } catch (err: any) {
      toast(err.response?.data?.error || 'Failed to add site', 'error');
    } finally {
      setAdding(false);
    }
  };

  const handleRunAudit = (site: SiteWithStats) => {
    navigate(`/app/audits/new?domain=${encodeURIComponent(site.domain)}&siteId=${site.id}`);
  };

  const handleSiteClick = (site: SiteWithStats) => {
    navigate(`/app/sites/${site.id}`);
  };

  // Convert site stats to a mock Audit object for SiteCard
  const siteToLatestAudit = (site: SiteWithStats): Audit | null => {
    if (!site.stats.latestScores) return null;
    return {
      id: '',
      target_url: `https://${site.domain}`,
      target_domain: site.domain,
      status: 'completed',
      pages_found: 0,
      pages_crawled: 0,
      pages_audited: 0,
      current_url: null,
      total_issues: 0,
      critical_issues: 0,
      seo_score: site.stats.latestScores.seo,
      accessibility_score: site.stats.latestScores.accessibility,
      security_score: site.stats.latestScores.security,
      performance_score: site.stats.latestScores.performance,
      content_score: site.stats.latestScores.content ?? null,
      structured_data_score: site.stats.latestScores.structuredData ?? null,
      cqs_score: null,
      started_at: null,
      completed_at: site.stats.lastAuditAt,
      created_at: site.stats.lastAuditAt || '',
    };
  };

  // Filter sites by search query
  const filteredSites = sites.filter(site => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      site.name.toLowerCase().includes(query) ||
      site.domain.toLowerCase().includes(query)
    );
  });

  return (
    <DashboardLayout>
      <Helmet><title>Sites | Kritano</title></Helmet>
      <div className="dashboard-bg min-h-full">
        {/* Header */}
        <div className="mb-8 animate-reveal-up">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <Display size="sm" as="h1" className="text-slate-900 dark:text-white flex items-center gap-2">
                <Globe className="w-6 h-6 text-indigo-600" />
                Your Sites
              </Display>
              <Body muted className="mt-1">
                Manage and monitor your websites
              </Body>
            </div>

            <div className="flex items-center gap-3">
              {usage && (
                <span className="text-sm text-slate-500 dark:text-slate-500 tabular-nums">
                  {usage.sites} / {usage.maxSites ?? '∞'} sites
                </span>
              )}
              <Button
                variant="accent"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => setShowAddModal(true)}
                disabled={usage ? !usage.canAddMore : false}
              >
                Add Site
              </Button>
            </div>
          </div>
        </div>

        {/* Usage Warning */}
        {usage && usage.maxSites !== null && usage.sites >= usage.maxSites && (
          <div className="mb-6 animate-reveal-up stagger-1">
            <Alert variant="warning">
              You've reached your site limit. Upgrade your plan to add more sites.
            </Alert>
          </div>
        )}

        {/* Loading */}
        {loading && <SitesLoadingSkeleton viewMode={viewMode} />}

        {/* Empty State - show when no sites, regardless of error */}
        {!loading && sites.length === 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 animate-reveal-up stagger-1">
            <NoSitesEmptyState onAddSite={() => setShowAddModal(true)} />
          </div>
        )}

        {/* Sites List/Grid */}
        {!loading && sites.length > 0 && (
          <>
            {/* Toolbar */}
            <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-reveal-up stagger-1">
              {/* Search */}
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search sites..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                  title="Grid view"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                  title="List view"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Grid View */}
            {viewMode === 'grid' && (
              <SiteCardGrid className="animate-reveal-up stagger-2">
                {filteredSites.map((site, index) => (
                  <div key={site.id} className={`animate-reveal-up stagger-${Math.min(index + 3, 10)}`}>
                    <SiteCard
                      domain={site.domain}
                      url={`https://${site.domain}`}
                      latestAudit={siteToLatestAudit(site)}
                      isVerified={site.verified}
                      ownerTier={site.ownerTier}
                      onClick={() => handleSiteClick(site)}
                      onRunAudit={() => handleRunAudit(site)}
                    />
                  </div>
                ))}
              </SiteCardGrid>
            )}

            {/* List View */}
            {viewMode === 'list' && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-reveal-up stagger-2">
                {/* List Header */}
                <div className="hidden sm:flex items-center gap-4 px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-500 dark:text-slate-500 uppercase tracking-wider">
                  <span className="w-8"></span>
                  <span className="flex-1">Site</span>
                  <span className="w-20">Status</span>
                  <span className="w-20 text-right">Issues</span>
                  <span className="w-20 text-right">Last Audit</span>
                  <span className="w-10"></span>
                </div>

                {/* List Items */}
                {filteredSites.map((site, index) => (
                  <div key={site.id} className={`animate-reveal-up stagger-${Math.min(index + 3, 10)}`}>
                    <SiteListItem
                      domain={site.domain}
                      url={`https://${site.domain}`}
                      latestAudit={siteToLatestAudit(site)}
                      isVerified={site.verified}
                      ownerTier={site.ownerTier}
                      onClick={() => handleSiteClick(site)}
                      onRunAudit={() => handleRunAudit(site)}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* No Results */}
            {filteredSites.length === 0 && searchQuery && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
                <Globe className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <Heading size="sm" className="text-slate-700 dark:text-slate-300">
                  No sites found
                </Heading>
                <Body muted className="mt-2">
                  No sites match "{searchQuery}"
                </Body>
                <Button
                  variant="ghost"
                  onClick={() => setSearchQuery('')}
                  className="mt-4"
                >
                  Clear search
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Site Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full p-6 animate-scale-in border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                <Globe className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <Heading size="md" as="h2" className="text-slate-900 dark:text-white">
                  Add Site
                </Heading>
                <Body size="sm" muted>Add a new website to monitor</Body>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Site Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="My Website"
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label htmlFor="domain" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Domain <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="domain"
                  value={newDomain}
                  onChange={e => setNewDomain(e.target.value)}
                  placeholder="example.com"
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors font-mono text-sm"
                />
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-1.5">
                  Enter the domain without http:// or www.
                </p>
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Description <span className="text-slate-500">(optional)</span>
                </label>
                <textarea
                  id="description"
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  placeholder="Brief description of this site..."
                  rows={2}
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
              <Button variant="ghost" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button
                variant="accent"
                onClick={handleAddSite}
                isLoading={adding}
                disabled={!newName.trim() || !newDomain.trim()}
              >
                Add Site
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

// Loading skeleton
function SitesLoadingSkeleton({ viewMode }: { viewMode: ViewMode }) {
  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 animate-pulse"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-full bg-slate-200 dark:bg-slate-700" />
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-32" />
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-40" />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20" />
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-16" />
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-4 gap-2">
              {[...Array(4)].map((_, j) => (
                <div key={j} className="text-center space-y-1">
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-8 mx-auto" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-6 mx-auto" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 px-4 py-3 border-b border-slate-200 dark:border-slate-800 last:border-b-0 animate-pulse"
        >
          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32" />
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-48" />
          </div>
          <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-16" />
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-12" />
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-16" />
        </div>
      ))}
    </div>
  );
}
