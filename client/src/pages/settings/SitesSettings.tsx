import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { Globe, Shield, ShieldCheck, Plus, ExternalLink, Copy, Check, Trash2, AlertTriangle, Palette, Wand2, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { sitesApi, userApi } from '../../services/api';
import type { SiteWithStats, TierLimits } from '../../types/site.types';

interface VerificationInstructions {
  dns: { recordType?: string; type?: string; name: string; alternativeName?: string; value: string };
  file: { path: string; content: string };
}

export default function SitesSettings() {
  const { toast } = useToast();
  const [sites, setSites] = useState<SiteWithStats[]>([]);
  const [usage, setUsage] = useState<{ sites: number; maxSites: number | null; canAddMore: boolean } | null>(null);
  const [tierLimits, setTierLimits] = useState<TierLimits | null>(null);
  const [loading, setLoading] = useState(true);

  // Verification state
  const [verifyingSiteId, setVerifyingSiteId] = useState<string | null>(null);
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [verificationInstructions, setVerificationInstructions] = useState<VerificationInstructions | null>(null);
  const [verificationMethod, setVerificationMethod] = useState<'dns' | 'file'>('file');
  const [verifying, setVerifying] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  // Delete confirmation
  const [deletingSiteId, setDeletingSiteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Add site modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSiteName, setNewSiteName] = useState('');
  const [newSiteDomain, setNewSiteDomain] = useState('');
  const [addingSite, setAddingSite] = useState(false);

  // Branding state
  const [brandingSiteId, setBrandingSiteId] = useState<string | null>(null);
  const [brandingForm, setBrandingForm] = useState({
    companyName: '',
    logoUrl: '',
    primaryColor: '#4f46e5',
    secondaryColor: '#6366f1',
    accentColor: '#f59e0b',
  });
  const [savingBranding, setSavingBranding] = useState(false);
  const [scanningBranding, setScanningBranding] = useState(false);
  const [extractedColors, setExtractedColors] = useState<string[]>([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [sitesRes, subRes] = await Promise.all([
        sitesApi.list(),
        userApi.getSubscription(),
      ]);
      setSites(sitesRes.data.sites);
      setUsage(sitesRes.data.usage);
      setTierLimits(subRes.data.limits);
    } catch (err) {
      console.error('Failed to load sites:', err);
      toast('Failed to load sites', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddSite = async () => {
    if (!newSiteName.trim() || !newSiteDomain.trim()) return;

    try {
      setAddingSite(true);
      await sitesApi.create({
        name: newSiteName.trim(),
        domain: newSiteDomain.trim(),
      });
      toast('Site added successfully', 'success');
      setShowAddModal(false);
      setNewSiteName('');
      setNewSiteDomain('');
      fetchData();
    } catch (err: any) {
      toast(err.response?.data?.error || 'Failed to add site', 'error');
    } finally {
      setAddingSite(false);
    }
  };

  const handleStartVerification = async (siteId: string, regenerate: boolean = false) => {
    try {
      const response = await sitesApi.generateVerificationToken(siteId, regenerate);
      setVerifyingSiteId(siteId);
      setVerificationToken(response.data.token);
      setVerificationInstructions(response.data.instructions);
      if (regenerate) {
        toast('New verification token generated', 'success');
      }
    } catch (err) {
      toast('Failed to generate verification token', 'error');
    }
  };

  const handleVerify = async () => {
    if (!verifyingSiteId) return;

    try {
      setVerifying(true);
      const response = await sitesApi.verify(verifyingSiteId, verificationMethod);

      if (response.data.verified) {
        toast('Domain verified successfully!', 'success');
        setVerifyingSiteId(null);
        setVerificationToken(null);
        setVerificationInstructions(null);
        fetchData();
      } else {
        toast(response.data.error || response.data.details || 'Verification failed', 'error');
      }
    } catch (err: any) {
      toast(err.response?.data?.error || 'Verification failed', 'error');
    } finally {
      setVerifying(false);
    }
  };

  const handleCopy = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDelete = async (siteId: string) => {
    try {
      setDeleting(true);
      await sitesApi.delete(siteId);
      toast('Site deleted', 'success');
      setDeletingSiteId(null);
      fetchData();
    } catch (err: any) {
      toast(err.response?.data?.error || 'Failed to delete site', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleStartBranding = (site: SiteWithStats) => {
    const branding = site.settings?.branding;
    setBrandingForm({
      companyName: branding?.companyName || '',
      logoUrl: branding?.logoUrl || '',
      primaryColor: branding?.primaryColor || '#4f46e5',
      secondaryColor: branding?.secondaryColor || '#6366f1',
      accentColor: branding?.accentColor || '#f59e0b',
    });
    setExtractedColors([]);
    setBrandingSiteId(site.id);
  };

  const handleSaveBranding = async () => {
    if (!brandingSiteId) return;
    try {
      setSavingBranding(true);
      await sitesApi.update(brandingSiteId, {
        settings: {
          branding: {
            companyName: brandingForm.companyName.trim() || undefined,
            logoUrl: brandingForm.logoUrl.trim() || undefined,
            primaryColor: brandingForm.primaryColor,
            secondaryColor: brandingForm.secondaryColor,
            accentColor: brandingForm.accentColor,
          },
        },
      });
      toast('Branding saved', 'success');
      setBrandingSiteId(null);
      fetchData();
    } catch (err: any) {
      toast('Failed to save branding', 'error');
    } finally {
      setSavingBranding(false);
    }
  };

  const handleResetBranding = () => {
    setBrandingForm({
      companyName: '',
      logoUrl: '',
      primaryColor: '#4f46e5',
      secondaryColor: '#6366f1',
      accentColor: '#f59e0b',
    });
    setExtractedColors([]);
  };

  const handleScanBranding = async () => {
    if (!brandingSiteId) return;
    try {
      setScanningBranding(true);
      const response = await sitesApi.extractBranding(brandingSiteId);
      const { palette, companyName, allColors } = response.data;

      setBrandingForm(f => ({
        ...f,
        companyName: companyName || f.companyName,
        primaryColor: palette.primary,
        secondaryColor: palette.secondary,
        accentColor: palette.accent,
      }));
      setExtractedColors(allColors);
      toast('Colors extracted from site', 'success');
    } catch (err: any) {
      toast(err.response?.data?.error || 'Failed to scan site', 'error');
    } finally {
      setScanningBranding(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-slate-200 rounded" />
          <div className="h-24 bg-slate-100 rounded-lg" />
          <div className="h-24 bg-slate-100 rounded-lg" />
        </div>
      </div>
    );
  }

  const ownedSites = sites.filter(s => s.permission === 'owner');
  const sharedSites = sites.filter(s => s.permission !== 'owner');

  return (
    <>
      <Helmet><title>Sites Settings | PagePulser</title></Helmet>
      <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">My Sites</h2>
          <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
            Manage your domains and verification status
          </p>
        </div>
        {usage?.canAddMore && (
          <Button
            variant="accent"
            size="sm"
            onClick={() => setShowAddModal(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Site
          </Button>
        )}
      </div>

      {/* Usage & Limits */}
      {usage && tierLimits && (
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg flex items-center justify-center">
                <Globe className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-900 dark:text-white">
                  {usage.sites} of {usage.maxSites} sites used
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-500">
                  {tierLimits.tier.charAt(0).toUpperCase() + tierLimits.tier.slice(1)} plan
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Progress bar */}
              {usage.maxSites !== null && (
                <div className="w-32 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full transition-all"
                    style={{ width: `${Math.min((usage.sites / usage.maxSites) * 100, 100)}%` }}
                  />
                </div>
              )}
            </div>
          </div>
          {!usage.canAddMore && (
            <div className="mt-3 flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>Site limit reached. Upgrade your plan to add more sites.</span>
            </div>
          )}
        </div>
      )}

      {/* Owned Sites */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <h3 className="text-base font-medium text-slate-900 dark:text-white">Your Sites</h3>
        </div>
        {ownedSites.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <Globe className="w-7 h-7 text-slate-500" />
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-500 mb-4">
              No sites yet. Add a site manually or run an audit to create one automatically.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="accent"
                size="sm"
                onClick={() => setShowAddModal(true)}
                disabled={!usage?.canAddMore}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Site
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = '/audits/new'}
              >
                Run an Audit
              </Button>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-slate-700">
            {ownedSites.map(site => (
              <li
                key={site.id}
                className="px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      site.verified
                        ? 'bg-emerald-100 dark:bg-emerald-900/50'
                        : 'bg-slate-100 dark:bg-slate-800'
                    }`}>
                      {site.verified ? (
                        <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Shield className="w-5 h-5 text-slate-500" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900 dark:text-white">
                          {site.domain}
                        </span>
                        {site.verified && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 rounded-full">
                            Verified
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">
                        {site.stats.totalAudits} audit{site.stats.totalAudits !== 1 ? 's' : ''} · {site.stats.urlCount} URL{site.stats.urlCount !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/sites/${site.id}`}
                      className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1"
                    >
                      View
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                    {!site.verified && verifyingSiteId !== site.id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStartVerification(site.id)}
                      >
                        Verify
                      </Button>
                    )}
                    {site.verified && (
                      <button
                        onClick={() => brandingSiteId === site.id ? setBrandingSiteId(null) : handleStartBranding(site)}
                        className={`p-1.5 transition-colors rounded ${
                          brandingSiteId === site.id
                            ? 'text-indigo-600 bg-indigo-50'
                            : 'text-slate-500 hover:text-indigo-500'
                        }`}
                        title="PDF branding"
                      >
                        <Palette className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => setDeletingSiteId(site.id)}
                      className="p-1.5 text-slate-500 hover:text-red-500 transition-colors"
                      title="Delete site"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Verification Panel */}
                {verifyingSiteId === site.id && verificationInstructions && (
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-slate-900 dark:text-white">
                        Verify ownership of {site.domain}
                      </h4>
                      <button
                        onClick={() => handleStartVerification(site.id, true)}
                        className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                      >
                        Regenerate token
                      </button>
                    </div>

                    {/* Method Tabs */}
                    <div className="flex gap-2 mb-4">
                      <button
                        onClick={() => setVerificationMethod('file')}
                        className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                          verificationMethod === 'file'
                            ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400'
                            : 'text-slate-600 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        File Upload
                      </button>
                      <button
                        onClick={() => setVerificationMethod('dns')}
                        className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                          verificationMethod === 'dns'
                            ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400'
                            : 'text-slate-600 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        DNS Record
                      </button>
                    </div>

                    {verificationMethod === 'file' ? (
                      <div className="space-y-3">
                        <p className="text-sm text-slate-600 dark:text-slate-500">
                          Create a file at the following path on your website:
                        </p>
                        <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3 font-mono text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-700 dark:text-slate-300">
                              {verificationInstructions.file.path}
                            </span>
                            <button
                              onClick={() => handleCopy(verificationInstructions.file.path, 'path')}
                              className="text-slate-500 hover:text-slate-600"
                            >
                              {copied === 'path' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-500">
                          With this content:
                        </p>
                        <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3 font-mono text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-700 dark:text-slate-300 break-all">
                              {verificationToken}
                            </span>
                            <button
                              onClick={() => handleCopy(verificationToken!, 'token')}
                              className="text-slate-500 hover:text-slate-600 flex-shrink-0 ml-2"
                            >
                              {copied === 'token' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm text-slate-600 dark:text-slate-500">
                          Add a TXT record to your DNS settings:
                        </p>
                        <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-xs text-slate-500">Name/Host</span>
                              <div className="font-mono text-sm text-slate-700 dark:text-slate-300">
                                {verificationInstructions.dns.name}
                              </div>
                            </div>
                            <button
                              onClick={() => handleCopy(verificationInstructions.dns.name, 'dnsName')}
                              className="text-slate-500 hover:text-slate-600"
                            >
                              {copied === 'dnsName' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                            </button>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                            <div>
                              <span className="text-xs text-slate-500">Value</span>
                              <div className="font-mono text-sm text-slate-700 dark:text-slate-300 break-all">
                                {verificationToken}
                              </div>
                            </div>
                            <button
                              onClick={() => handleCopy(verificationToken!, 'dnsValue')}
                              className="text-slate-500 hover:text-slate-600 flex-shrink-0 ml-2"
                            >
                              {copied === 'dnsValue' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-500">
                          DNS changes may take up to 24 hours to propagate.
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-3 mt-4">
                      <Button
                        onClick={handleVerify}
                        isLoading={verifying}
                      >
                        Verify Now
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setVerifyingSiteId(null);
                          setVerificationToken(null);
                          setVerificationInstructions(null);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* Delete Confirmation */}
                {deletingSiteId === site.id && (
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-start gap-3 bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                      <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-red-800 dark:text-red-300">
                          Delete this site?
                        </p>
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                          This will remove the site and all associated data. Audits will be preserved.
                        </p>
                        <div className="flex items-center gap-2 mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(site.id)}
                            isLoading={deleting}
                            className="border-red-300 text-red-700 hover:bg-red-100"
                          >
                            Delete
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingSiteId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Branding Panel (verified sites only) */}
                {brandingSiteId === site.id && site.verified && (
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-1">
                          PDF Report Branding
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-500">
                          Customize exported PDF reports with your company branding
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleScanBranding}
                        disabled={scanningBranding}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50 rounded-md transition-colors disabled:opacity-50"
                      >
                        {scanningBranding ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Wand2 className="w-3.5 h-3.5" />
                        )}
                        {scanningBranding ? 'Scanning...' : 'Scan Site'}
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-slate-600 dark:text-slate-500 mb-1">
                            Company Name
                          </label>
                          <input
                            type="text"
                            value={brandingForm.companyName}
                            onChange={e => setBrandingForm(f => ({ ...f, companyName: e.target.value }))}
                            placeholder="Your Company"
                            className="w-full px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 dark:text-slate-500 mb-1">
                            Logo URL
                          </label>
                          <input
                            type="url"
                            value={brandingForm.logoUrl}
                            onChange={e => setBrandingForm(f => ({ ...f, logoUrl: e.target.value }))}
                            placeholder="https://..."
                            className="w-full px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-600 dark:text-slate-500 mb-1">
                            Primary
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={brandingForm.primaryColor}
                              onChange={e => setBrandingForm(f => ({ ...f, primaryColor: e.target.value }))}
                              className="w-8 h-8 p-0.5 rounded border border-slate-300 dark:border-slate-600 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={brandingForm.primaryColor}
                              onChange={e => setBrandingForm(f => ({ ...f, primaryColor: e.target.value }))}
                              className="flex-1 px-2 py-1 text-xs border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 dark:text-slate-500 mb-1">
                            Secondary
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={brandingForm.secondaryColor}
                              onChange={e => setBrandingForm(f => ({ ...f, secondaryColor: e.target.value }))}
                              className="w-8 h-8 p-0.5 rounded border border-slate-300 dark:border-slate-600 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={brandingForm.secondaryColor}
                              onChange={e => setBrandingForm(f => ({ ...f, secondaryColor: e.target.value }))}
                              className="flex-1 px-2 py-1 text-xs border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 dark:text-slate-500 mb-1">
                            Accent
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={brandingForm.accentColor}
                              onChange={e => setBrandingForm(f => ({ ...f, accentColor: e.target.value }))}
                              className="w-8 h-8 p-0.5 rounded border border-slate-300 dark:border-slate-600 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={brandingForm.accentColor}
                              onChange={e => setBrandingForm(f => ({ ...f, accentColor: e.target.value }))}
                              className="flex-1 px-2 py-1 text-xs border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Extracted Colors Palette */}
                      {extractedColors.length > 0 && (
                        <div>
                          <label className="block text-xs font-medium text-slate-600 dark:text-slate-500 mb-2">
                            Colors found on site (click to apply)
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            {extractedColors.map((color, idx) => (
                              <div key={idx} className="flex flex-col items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    // Cycle through: primary → secondary → accent → primary
                                    if (brandingForm.primaryColor !== color) {
                                      setBrandingForm(f => ({ ...f, primaryColor: color }));
                                    } else if (brandingForm.secondaryColor !== color) {
                                      setBrandingForm(f => ({ ...f, secondaryColor: color }));
                                    } else {
                                      setBrandingForm(f => ({ ...f, accentColor: color }));
                                    }
                                  }}
                                  className="w-7 h-7 rounded border-2 border-white shadow-sm hover:scale-110 transition-transform"
                                  style={{ backgroundColor: color }}
                                  title={`${color} - Click to apply`}
                                />
                                <span className="text-[9px] font-mono text-slate-500">{color.slice(1, 4)}</span>
                              </div>
                            ))}
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1.5">
                            Tip: Click a color multiple times to cycle through Primary → Secondary → Accent
                          </p>
                        </div>
                      )}

                      {/* Preview */}
                      <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                        <div className="px-3 py-2 text-white text-xs font-medium" style={{ backgroundColor: brandingForm.primaryColor }}>
                          {brandingForm.companyName || 'Your Company'} - Report Preview
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-900">
                          <div className="text-xs font-medium mb-1" style={{ color: brandingForm.secondaryColor }}>
                            Section Header
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500">
                            <span className="px-1.5 py-0.5 rounded text-white" style={{ backgroundColor: brandingForm.accentColor }}>
                              Tag
                            </span>
                            <span>Sample content</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={handleResetBranding}
                          className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-500"
                        >
                          Reset to defaults
                        </button>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setBrandingSiteId(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleSaveBranding}
                            isLoading={savingBranding}
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Shared Sites */}
      {sharedSites.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Shared with me</h3>
          <div className="space-y-3">
            {sharedSites.map(site => (
              <div
                key={site.id}
                className="border border-slate-200 dark:border-slate-700 rounded-lg p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      site.verified
                        ? 'bg-emerald-100 dark:bg-emerald-900/50'
                        : 'bg-slate-100 dark:bg-slate-800'
                    }`}>
                      {site.verified ? (
                        <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Shield className="w-5 h-5 text-slate-500" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900 dark:text-white">
                          {site.domain}
                        </span>
                        <span className="px-2 py-0.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-500 rounded-full capitalize">
                          {site.permission}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">
                        Shared by owner
                      </div>
                    </div>
                  </div>
                  <Link
                    to={`/sites/${site.id}`}
                    className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1"
                  >
                    View
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Verification Benefits */}
      <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4">
        <h4 className="text-sm font-medium text-indigo-900 dark:text-indigo-300 mb-2">
          Why verify your domains?
        </h4>
        <ul className="text-sm text-indigo-700 dark:text-indigo-400 space-y-1">
          <li className="flex items-start gap-2">
            <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>Run multi-page audits (crawl entire site)</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>Faster crawling speeds</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>Skip consent prompts for your own domains</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>Share site access with team members</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>Custom PDF report branding with your colors and company name</span>
          </li>
        </ul>
      </div>

      {/* Add Site Modal */}
      {showAddModal && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                <Globe className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Add Site
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-500">
                  Add a new website to manage
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="siteName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Site Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="siteName"
                  value={newSiteName}
                  onChange={(e) => setNewSiteName(e.target.value)}
                  placeholder="My Website"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label htmlFor="siteDomain" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Domain <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="siteDomain"
                  value={newSiteDomain}
                  onChange={(e) => setNewSiteDomain(e.target.value)}
                  placeholder="example.com"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors font-mono text-sm"
                />
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-1.5">
                  Enter the domain without http:// or www
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowAddModal(false);
                  setNewSiteName('');
                  setNewSiteDomain('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="accent"
                onClick={handleAddSite}
                isLoading={addingSite}
                disabled={!newSiteName.trim() || !newSiteDomain.trim()}
              >
                Add Site
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
    </>
  );
}
