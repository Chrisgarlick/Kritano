import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Palette,
  Building2,
  Globe,
  ShieldCheck,
  Loader2,
  Wand2,
  Image,
  Type,
  Lock,
  ToggleLeft,
  ToggleRight,
  Check,
  ArrowUpRight,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../contexts/AuthContext';
import { sitesApi, organizationsApi } from '../../services/api';
import type { SiteWithStats } from '../../types/site.types';

interface OrgBranding {
  companyName?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  footerText?: string;
}

interface BrandingForm {
  companyName: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  footerText: string;
}

const DEFAULT_BRANDING: BrandingForm = {
  companyName: '',
  logoUrl: '',
  primaryColor: '#4f46e5',
  secondaryColor: '#6366f1',
  accentColor: '#f59e0b',
  footerText: '',
};

export default function BrandingSettings() {
  const { toast } = useToast();
  const { subscription, user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [sites, setSites] = useState<SiteWithStats[]>([]);

  // Org id — may be null if none exists yet (auto-created on first save)
  const [orgId, setOrgId] = useState<string | null>(null);

  // Org branding form (agency+ only)
  const [orgForm, setOrgForm] = useState<BrandingForm>(DEFAULT_BRANDING);
  const [savingOrg, setSavingOrg] = useState(false);

  // Site branding
  const [editingSiteId, setEditingSiteId] = useState<string | null>(null);
  const [siteForm, setSiteForm] = useState<BrandingForm>(DEFAULT_BRANDING);
  const [savingSite, setSavingSite] = useState(false);
  const [scanningBranding, setScanningBranding] = useState(false);
  const [extractedColors, setExtractedColors] = useState<string[]>([]);

  // Per-site toggle: use org branding vs site branding
  const [siteUseOrg, setSiteUseOrg] = useState<Record<string, boolean>>({});

  const tier = subscription?.tier || 'free';
  const isFree = tier === 'free';
  const isAgencyPlus = tier === 'agency' || tier === 'enterprise';

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const sitesRes = await sitesApi.list();
      setSites(sitesRes.data.sites);

      // Load org data for agency+ users
      if (isAgencyPlus) {
        try {
          const orgsRes = await organizationsApi.list();
          const orgs = orgsRes.data.organizations;
          if (orgs.length > 0) {
            const orgDetail = await organizationsApi.get(orgs[0].id);
            const orgData = orgDetail.data.organization;
            const branding = (orgData.settings as { branding?: OrgBranding })?.branding;

            setOrgId(orgData.id);

            if (branding) {
              setOrgForm({
                companyName: branding.companyName || '',
                logoUrl: branding.logoUrl || '',
                primaryColor: branding.primaryColor || DEFAULT_BRANDING.primaryColor,
                secondaryColor: branding.secondaryColor || DEFAULT_BRANDING.secondaryColor,
                accentColor: branding.accentColor || DEFAULT_BRANDING.accentColor,
                footerText: branding.footerText || '',
              });
            }
          }
        } catch {
          // No org yet — that's fine, we'll create one on first save
        }

        // Determine which sites currently use org branding (no site-specific branding set)
        const useOrgMap: Record<string, boolean> = {};
        for (const site of sitesRes.data.sites) {
          const hasSiteBranding = site.settings?.branding &&
            (site.settings.branding.companyName || site.settings.branding.logoUrl ||
             (site.settings.branding.primaryColor && site.settings.branding.primaryColor !== '#4f46e5'));
          useOrgMap[site.id] = !hasSiteBranding;
        }
        setSiteUseOrg(useOrgMap);
      }
    } catch (err) {
      console.error('Failed to load branding data:', err);
      toast('Failed to load branding data', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast, isAgencyPlus]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Ensure we have an org — create one if needed
  const ensureOrg = async (): Promise<string> => {
    if (orgId) return orgId;

    const name = user?.firstName
      ? `${user.firstName}'s Organization`
      : 'My Organization';
    const res = await organizationsApi.create({ name });
    const newId = res.data.organization.id;
    setOrgId(newId);
    return newId;
  };

  // Save org branding
  const handleSaveOrgBranding = async () => {
    try {
      setSavingOrg(true);
      const id = await ensureOrg();
      await organizationsApi.update(id, {
        settings: {
          branding: {
            companyName: orgForm.companyName.trim() || undefined,
            logoUrl: orgForm.logoUrl.trim() || undefined,
            primaryColor: orgForm.primaryColor,
            secondaryColor: orgForm.secondaryColor,
            accentColor: orgForm.accentColor,
            footerText: orgForm.footerText.trim() || undefined,
          },
        },
      });
      toast('Organization branding saved', 'success');
      fetchData();
    } catch (err: any) {
      toast(err.response?.data?.error || 'Failed to save organization branding', 'error');
    } finally {
      setSavingOrg(false);
    }
  };

  // Start editing site branding
  const handleEditSite = (site: SiteWithStats) => {
    const branding = site.settings?.branding;
    setSiteForm({
      companyName: branding?.companyName || '',
      logoUrl: branding?.logoUrl || '',
      primaryColor: branding?.primaryColor || DEFAULT_BRANDING.primaryColor,
      secondaryColor: branding?.secondaryColor || DEFAULT_BRANDING.secondaryColor,
      accentColor: branding?.accentColor || DEFAULT_BRANDING.accentColor,
      footerText: branding?.footerText || '',
    });
    setExtractedColors([]);
    setEditingSiteId(site.id);
  };

  // Save site branding
  const handleSaveSiteBranding = async () => {
    if (!editingSiteId) return;
    try {
      setSavingSite(true);
      await sitesApi.update(editingSiteId, {
        settings: {
          branding: {
            companyName: siteForm.companyName.trim() || undefined,
            logoUrl: siteForm.logoUrl.trim() || undefined,
            primaryColor: siteForm.primaryColor,
            secondaryColor: siteForm.secondaryColor,
            accentColor: siteForm.accentColor,
            footerText: siteForm.footerText.trim() || undefined,
          },
        },
      });
      toast('Site branding saved', 'success');
      setEditingSiteId(null);
      fetchData();
    } catch (err: any) {
      toast('Failed to save site branding', 'error');
    } finally {
      setSavingSite(false);
    }
  };

  // Toggle site between org and site branding
  const handleToggleSiteOrg = async (siteId: string, useOrg: boolean) => {
    setSiteUseOrg(prev => ({ ...prev, [siteId]: useOrg }));

    if (useOrg) {
      // Clear site-level branding so org branding applies
      try {
        await sitesApi.update(siteId, {
          settings: {
            branding: {
              companyName: undefined,
              logoUrl: undefined,
              primaryColor: undefined,
              secondaryColor: undefined,
              accentColor: undefined,
              footerText: undefined,
            },
          },
        });
        setEditingSiteId(null);
        toast('Site will use organization branding', 'success');
        fetchData();
      } catch {
        toast('Failed to update', 'error');
        setSiteUseOrg(prev => ({ ...prev, [siteId]: !useOrg }));
      }
    } else {
      // Switching to site branding — open the editor
      const site = sites.find(s => s.id === siteId);
      if (site) handleEditSite(site);
    }
  };

  // Scan site for colors
  const handleScanSite = async () => {
    if (!editingSiteId) return;
    try {
      setScanningBranding(true);
      const response = await sitesApi.extractBranding(editingSiteId);
      const { palette, companyName, allColors } = response.data;

      setSiteForm(f => ({
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
          <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-32 bg-slate-100 dark:bg-slate-800 rounded-lg" />
          <div className="h-32 bg-slate-100 dark:bg-slate-800 rounded-lg" />
        </div>
      </div>
    );
  }

  if (isFree) {
    return (
      <div className="p-6">
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-slate-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            PDF Branding
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-500 max-w-md mx-auto mb-6">
            Customize your PDF audit reports with your company's branding, colors, and logo.
            Upgrade to Starter or higher to access this feature.
          </p>
          <Button variant="accent">
            <ArrowUpRight className="w-4 h-4 mr-1.5" />
            Upgrade Plan
          </Button>
        </div>
      </div>
    );
  }

  const verifiedSites = sites.filter(s => s.verified && s.permission === 'owner');

  return (
    <>
      <Helmet><title>Branding | PagePulser</title></Helmet>
      <div className="p-6 space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">PDF Report Branding</h2>
        <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
          Customize how your exported PDF audit reports look
          {isAgencyPlus && ' — set organization-wide defaults or customize per site'}
        </p>
      </div>

      {/* Organization Branding (Agency+ only — always shown) */}
      {isAgencyPlus && (
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-indigo-50 to-slate-50 dark:from-indigo-950/30 dark:to-slate-800/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="text-base font-medium text-slate-900 dark:text-white">
                  Organization Branding
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-500">
                  Default branding applied to all sites unless overridden
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Company Name & Logo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-500 mb-1.5">
                  <Type className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                  Company Name
                </label>
                <input
                  type="text"
                  value={orgForm.companyName}
                  onChange={e => setOrgForm(f => ({ ...f, companyName: e.target.value }))}
                  placeholder="Your Company"
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-500 mb-1.5">
                  <Image className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                  Logo URL
                </label>
                <input
                  type="url"
                  value={orgForm.logoUrl}
                  onChange={e => setOrgForm(f => ({ ...f, logoUrl: e.target.value }))}
                  placeholder="https://example.com/logo.png"
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            {/* Logo Preview */}
            {orgForm.logoUrl && (
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <img
                  src={orgForm.logoUrl}
                  alt="Logo preview"
                  className="h-8 max-w-[120px] object-contain"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <span className="text-xs text-slate-500 dark:text-slate-500">Logo preview — appears in PDF header</span>
              </div>
            )}

            {/* Footer Text */}
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-500 mb-1.5">
                PDF Footer Text
              </label>
              <input
                type="text"
                value={orgForm.footerText}
                onChange={e => setOrgForm(f => ({ ...f, footerText: e.target.value }))}
                placeholder="Prepared by Your Agency"
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-500 mt-1">
                Shown at the bottom of every PDF page. Leave blank to use "Generated by PagePulser".
              </p>
            </div>

            {/* Colors */}
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-500 mb-2">
                Brand Colors
              </label>
              <div className="grid grid-cols-3 gap-3">
                <ColorInput label="Primary" value={orgForm.primaryColor} onChange={v => setOrgForm(f => ({ ...f, primaryColor: v }))} />
                <ColorInput label="Secondary" value={orgForm.secondaryColor} onChange={v => setOrgForm(f => ({ ...f, secondaryColor: v }))} />
                <ColorInput label="Accent" value={orgForm.accentColor} onChange={v => setOrgForm(f => ({ ...f, accentColor: v }))} />
              </div>
            </div>

            {/* Preview */}
            <BrandingPreview form={orgForm} label="Your Organization" />

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setOrgForm(DEFAULT_BRANDING)}
                className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
              >
                Reset to defaults
              </button>
              <Button
                onClick={handleSaveOrgBranding}
                isLoading={savingOrg}
              >
                Save Organization Branding
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Site Branding */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg flex items-center justify-center">
              <Globe className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-medium text-slate-900 dark:text-white">
                Site Branding
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-500">
                {isAgencyPlus
                  ? 'Toggle each site between organization branding or custom site branding'
                  : 'Customize PDF branding for each verified site'}
              </p>
            </div>
          </div>
        </div>

        {verifiedSites.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-7 h-7 text-slate-500" />
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-500 mb-1">
              No verified sites
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-500">
              Verify a domain in{' '}
              <a href="/settings/sites" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                My Sites
              </a>{' '}
              to enable branding
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-slate-700">
            {verifiedSites.map(site => {
              const isEditing = editingSiteId === site.id;
              const useOrg = siteUseOrg[site.id] ?? true;
              const hasSiteBranding = site.settings?.branding?.companyName || site.settings?.branding?.logoUrl;

              return (
                <li key={site.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <span className="font-medium text-sm text-slate-900 dark:text-white">
                          {site.domain}
                        </span>
                        {hasSiteBranding && !isAgencyPlus && (
                          <span className="ml-2 px-1.5 py-0.5 text-[10px] font-medium bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 rounded">
                            Branded
                          </span>
                        )}
                        {isAgencyPlus && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-500 mt-0.5">
                            {useOrg ? 'Using organization branding' : 'Using site-specific branding'}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Agency+ toggle: org vs site */}
                      {isAgencyPlus && (
                        <button
                          type="button"
                          onClick={() => handleToggleSiteOrg(site.id, !useOrg)}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
                            useOrg
                              ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-500'
                          }`}
                          title={useOrg ? 'Switch to site-specific branding' : 'Switch to organization branding'}
                        >
                          {useOrg ? (
                            <ToggleRight className="w-4 h-4" />
                          ) : (
                            <ToggleLeft className="w-4 h-4" />
                          )}
                          {useOrg ? 'Org' : 'Site'}
                        </button>
                      )}

                      {/* Edit site branding button (non-agency, or agency with site toggle) */}
                      {(!isAgencyPlus || !useOrg) && (
                        <button
                          onClick={() => isEditing ? setEditingSiteId(null) : handleEditSite(site)}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
                            isEditing
                              ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400'
                              : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 dark:hover:text-indigo-400'
                          }`}
                        >
                          <Palette className="w-3.5 h-3.5" />
                          {isEditing ? 'Close' : 'Customize'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Site Branding Editor */}
                  {isEditing && (
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-medium text-slate-900 dark:text-white">
                          Customize {site.domain}
                        </h4>
                        <button
                          type="button"
                          onClick={handleScanSite}
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
                        {/* Company Name & Logo */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-500 mb-1">
                              Company Name
                            </label>
                            <input
                              type="text"
                              value={siteForm.companyName}
                              onChange={e => setSiteForm(f => ({ ...f, companyName: e.target.value }))}
                              placeholder="Your Company"
                              className="w-full px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-500 mb-1">
                              Logo URL
                            </label>
                            <input
                              type="url"
                              value={siteForm.logoUrl}
                              onChange={e => setSiteForm(f => ({ ...f, logoUrl: e.target.value }))}
                              placeholder="https://..."
                              className="w-full px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                          </div>
                        </div>

                        {/* Logo Preview */}
                        {siteForm.logoUrl && (
                          <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                            <img
                              src={siteForm.logoUrl}
                              alt="Logo preview"
                              className="h-7 max-w-[100px] object-contain"
                              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                            <span className="text-xs text-slate-500 dark:text-slate-500">Logo preview</span>
                          </div>
                        )}

                        {/* Footer Text (agency+ only) */}
                        {isAgencyPlus && (
                          <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-500 mb-1">
                              PDF Footer Text
                            </label>
                            <input
                              type="text"
                              value={siteForm.footerText}
                              onChange={e => setSiteForm(f => ({ ...f, footerText: e.target.value }))}
                              placeholder="Prepared by Your Agency"
                              className="w-full px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                          </div>
                        )}

                        {/* Colors */}
                        <div className="grid grid-cols-3 gap-3">
                          <ColorInput label="Primary" value={siteForm.primaryColor} onChange={v => setSiteForm(f => ({ ...f, primaryColor: v }))} />
                          <ColorInput label="Secondary" value={siteForm.secondaryColor} onChange={v => setSiteForm(f => ({ ...f, secondaryColor: v }))} />
                          <ColorInput label="Accent" value={siteForm.accentColor} onChange={v => setSiteForm(f => ({ ...f, accentColor: v }))} />
                        </div>

                        {/* Extracted Colors */}
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
                                      if (siteForm.primaryColor !== color) {
                                        setSiteForm(f => ({ ...f, primaryColor: color }));
                                      } else if (siteForm.secondaryColor !== color) {
                                        setSiteForm(f => ({ ...f, secondaryColor: color }));
                                      } else {
                                        setSiteForm(f => ({ ...f, accentColor: color }));
                                      }
                                    }}
                                    className="w-7 h-7 rounded border-2 border-white dark:border-slate-700 shadow-sm hover:scale-110 transition-transform"
                                    style={{ backgroundColor: color }}
                                    title={`${color} — Click to apply`}
                                  />
                                  <span className="text-[9px] font-mono text-slate-500">{color.slice(1, 4)}</span>
                                </div>
                              ))}
                            </div>
                            <p className="text-[10px] text-slate-500 mt-1.5">
                              Click multiple times to cycle: Primary, Secondary, Accent
                            </p>
                          </div>
                        )}

                        {/* Preview */}
                        <BrandingPreview form={siteForm} label={site.domain} />

                        {/* Actions */}
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => {
                              setSiteForm(DEFAULT_BRANDING);
                              setExtractedColors([]);
                            }}
                            className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300"
                          >
                            Reset to defaults
                          </button>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingSiteId(null)}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={handleSaveSiteBranding}
                              isLoading={savingSite}
                            >
                              Save
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Info box */}
      <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4">
        <h4 className="text-sm font-medium text-indigo-900 dark:text-indigo-300 mb-2 flex items-center gap-1.5">
          <Palette className="w-4 h-4" />
          How PDF Branding Works
        </h4>
        <ul className="text-sm text-indigo-700 dark:text-indigo-400 space-y-1.5">
          <li className="flex items-start gap-2">
            <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>Your company name and colors appear on the PDF cover page and headers</span>
          </li>
          {isAgencyPlus && (
            <>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Your logo is rendered in the PDF header (Agency/Enterprise)</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Custom footer text replaces "Generated by PagePulser" (Agency/Enterprise)</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Toggle each site between org branding and custom site branding</span>
              </li>
            </>
          )}
          <li className="flex items-start gap-2">
            <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>Only verified domains can have custom branding</span>
          </li>
          {!isAgencyPlus && (
            <li className="flex items-start gap-2">
              <ArrowUpRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>Upgrade to Agency for logo, custom footer, and org-wide branding</span>
            </li>
          )}
        </ul>
      </div>
    </div>
    </>
  );
}

// ---- Sub-components ----

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 dark:text-slate-500 mb-1">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-8 h-8 p-0.5 rounded border border-slate-300 dark:border-slate-600 cursor-pointer"
        />
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="flex-1 px-2 py-1 text-xs border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
        />
      </div>
    </div>
  );
}

function BrandingPreview({ form, label }: { form: BrandingForm; label: string }) {
  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
      <div className="px-4 py-3 text-white flex items-center justify-between" style={{ backgroundColor: form.primaryColor }}>
        <div className="flex items-center gap-2">
          {form.logoUrl && (
            <img
              src={form.logoUrl}
              alt=""
              className="h-5 max-w-[60px] object-contain"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          )}
          <span className="text-xs font-medium">
            {form.companyName || label}
          </span>
        </div>
        <span className="text-[10px] opacity-75">Report Preview</span>
      </div>
      <div className="p-3 bg-slate-50 dark:bg-slate-900">
        <div className="text-xs font-medium mb-1.5" style={{ color: form.secondaryColor }}>
          Section Header
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-500">
          <span className="px-1.5 py-0.5 rounded text-white" style={{ backgroundColor: form.accentColor }}>
            Tag
          </span>
          <span>Sample audit content</span>
        </div>
      </div>
      {form.footerText && (
        <div className="px-3 py-1.5 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <span className="text-[10px] text-slate-500">{form.footerText}</span>
        </div>
      )}
    </div>
  );
}
