import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams } from 'react-router-dom';
import { GitCompareArrows, Globe, ClipboardList, Link2, AlertTriangle } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { SiteComparisonContent } from '../analytics/SiteComparison';
import { AuditComparisonContent } from '../analytics/AuditComparison';
import { UrlSelector } from '../../components/compare/UrlSelector';
import { UrlComparisonView } from '../../components/compare/UrlComparisonView';
import { analyticsApi } from '../../services/api';
import type { UrlComparison } from '../../types/analytics.types';

type TabId = 'urls' | 'sites' | 'audits';

const TABS: { id: TabId; label: string; icon: typeof Link2 }[] = [
  { id: 'urls', label: 'URLs', icon: Link2 },
  { id: 'sites', label: 'Sites', icon: Globe },
  { id: 'audits', label: 'Audits', icon: ClipboardList },
];

export default function ComparePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as TabId) || 'urls';

  const [urlComparison, setUrlComparison] = useState<UrlComparison | null>(null);
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  const setTab = (tab: TabId) => {
    setSearchParams({ tab });
    // Reset URL comparison state when switching tabs
    if (tab !== 'urls') {
      setUrlComparison(null);
      setUrlError(null);
    }
  };

  const handleUrlCompare = async (specs: [{ siteId: string; urlId: string }, { siteId: string; urlId: string }]) => {
    try {
      setUrlLoading(true);
      setUrlError(null);
      const response = await analyticsApi.compareUrls(specs);
      setUrlComparison(response.data);
    } catch (err: any) {
      console.error('Failed to compare URLs:', err);
      setUrlError(err.response?.data?.error || 'Failed to compare URLs');
      setUrlComparison(null);
    } finally {
      setUrlLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <Helmet><title>Compare | PagePulser</title></Helmet>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <GitCompareArrows className="w-6 h-6 text-indigo-600" />
            Compare
          </h1>
          <p className="text-slate-500 mt-1">
            Compare URLs, sites, and audits side-by-side
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200">
          <nav className="flex gap-0 -mb-px">
            {TABS.map(tab => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    isActive
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab content */}
        {activeTab === 'urls' && (
          <div className="space-y-6">
            <UrlSelector onCompare={handleUrlCompare} loading={urlLoading} />

            {urlLoading && (
              <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
                <div className="animate-spin w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full mx-auto mb-4" />
                <p className="text-slate-500">Comparing URLs...</p>
              </div>
            )}

            {urlError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <p className="text-red-700">{urlError}</p>
              </div>
            )}

            {urlComparison && !urlLoading && (
              <UrlComparisonView comparison={urlComparison} />
            )}
          </div>
        )}

        {activeTab === 'sites' && <SiteComparisonContent />}
        {activeTab === 'audits' && <AuditComparisonContent />}
      </div>
    </DashboardLayout>
  );
}
