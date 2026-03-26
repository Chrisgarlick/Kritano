import { useState, useEffect, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';
import { auditsApi, sitesApi, userApi } from '../../services/api';
import { UnverifiedDomainConsentModal } from '../../components/audits/UnverifiedDomainConsentModal';
import { KnownUrlPicker } from '../../components/audits/KnownUrlPicker';
import { Plus, Lock } from 'lucide-react';

type WcagVersion = '2.1' | '2.2';
type WcagLevel = 'A' | 'AA' | 'AAA';

interface AuditOptions {
  maxPages: number;
  maxDepth: number;
  respectRobotsTxt: boolean;
  includeSubdomains: boolean;
  checkSeo: boolean;
  checkAccessibility: boolean;
  checkSecurity: boolean;
  checkPerformance: boolean;
  checkFileExtraction: boolean;
  wcagVersion: WcagVersion;
  wcagLevel: WcagLevel;
}

export default function NewAuditPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Support both 'url' and 'domain' query params for pre-filling
  const initialUrl = searchParams.get('url') || searchParams.get('domain') || '';
  const siteIdParam = searchParams.get('siteId'); // For navigation back to site
  const [targetUrl, setTargetUrl] = useState(initialUrl);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [options, setOptions] = useState<AuditOptions>({
    maxPages: 50,
    maxDepth: 3,
    respectRobotsTxt: true,
    includeSubdomains: false,
    checkSeo: true,
    checkAccessibility: true,
    checkSecurity: true,
    checkPerformance: true,
    checkFileExtraction: false,
    wcagVersion: '2.2',
    wcagLevel: 'AA',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Consent modal state for unverified domains
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [domainStatus, setDomainStatus] = useState<{
    domain: string;
    isVerified: boolean;
    requiresConsent: boolean;
    userSkipsWarning: boolean;
    scanLimits: {
      maxPages: number;
      minDelayMs: number;
      robotsTxtRequired: boolean;
      sequential: boolean;
    } | null;
  } | null>(null);
  const [pendingSubmit, setPendingSubmit] = useState<string | null>(null); // Stores normalized URL for pending submit

  // #44 URL reachability check
  const [urlStatus, setUrlStatus] = useState<'idle' | 'checking' | 'reachable' | 'unreachable'>('idle');
  const [urlStatusMessage, setUrlStatusMessage] = useState<string>('');
  const checkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // User tier for feature gating
  const [userTier, setUserTier] = useState<string>('free');
  const [tierMaxPages, setTierMaxPages] = useState<number>(500);
  const canUseFileExtraction = userTier !== 'free';

  // Domain verification status for preset restrictions
  const [isVerifiedDomain, setIsVerifiedDomain] = useState<boolean | null>(null);
  const [verificationChecking, setVerificationChecking] = useState(false);
  const verificationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // #45 Recent URLs autocomplete
  const [recentUrls, setRecentUrls] = useState<Array<{ target_url: string; target_domain: string }>>([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const autocompleteRef = useRef<HTMLDivElement>(null);
  const [autocompleteIndex, setAutocompleteIndex] = useState(-1); // R4: keyboard navigation

  // URL picker for known pages (when launched from site)
  const [showUrlPicker, setShowUrlPicker] = useState(false);
  const [knownPagesCount, setKnownPagesCount] = useState<number | null>(null);

  // Fetch known pages count when we have a siteId
  useEffect(() => {
    if (siteIdParam) {
      sitesApi.getUrlsCount(siteIdParam)
        .then(res => setKnownPagesCount(res.data.count))
        .catch(() => setKnownPagesCount(null));
    }
  }, [siteIdParam]);

  // Fetch recent URLs on mount
  useEffect(() => {
    auditsApi.getRecentUrls().then(res => {
      setRecentUrls(res.data.urls);
    }).catch(() => {
      // Ignore errors for autocomplete
    });
  }, []);

  // Fetch user tier for feature gating
  useEffect(() => {
    userApi.getSubscription().then(res => {
      const tier = (res.data?.subscription as any)?.tier || 'free';
      setUserTier(tier);
      const maxPages = (res.data?.limits as any)?.maxPagesPerAudit;
      if (maxPages) setTierMaxPages(maxPages);
    }).catch(() => {
      // Default to free
    });
  }, []);

  // Close autocomplete on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(e.target as Node)) {
        setShowAutocomplete(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // URL validation helper (moved here so it can be used in checkUrlReachability)
  const validateUrl = (url: string): string | null => {
    if (!url.trim()) {
      return 'URL is required';
    }
    try {
      const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return 'URL must use HTTP or HTTPS protocol';
      }
      return null;
    } catch {
      return 'Please enter a valid URL';
    }
  };

  // #44 Check URL reachability with debounce
  const checkUrlReachability = useCallback(async (url: string) => {
    if (!url.trim()) {
      setUrlStatus('idle');
      return;
    }
    const urlError = validateUrl(url);
    if (urlError) {
      setUrlStatus('idle');
      return;
    }
    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
    setUrlStatus('checking');
    try {
      const res = await auditsApi.checkUrl(normalizedUrl);
      if (res.data.reachable) {
        setUrlStatus('reachable');
        setUrlStatusMessage(res.data.finalUrl !== normalizedUrl ? `Redirects to ${res.data.finalUrl}` : 'URL is reachable');
      } else {
        setUrlStatus('unreachable');
        setUrlStatusMessage(res.data.error || 'URL is not reachable');
      }
    } catch {
      setUrlStatus('unreachable');
      setUrlStatusMessage('Failed to check URL');
    }
  }, []);

  // Debounced URL check
  useEffect(() => {
    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
    }
    if (targetUrl.trim()) {
      checkTimeoutRef.current = setTimeout(() => {
        checkUrlReachability(targetUrl);
      }, 800);
    } else {
      setUrlStatus('idle');
    }
    return () => {
      if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current);
    };
  }, [targetUrl, checkUrlReachability]);

  // Check domain verification status (for preset restrictions)
  useEffect(() => {
    if (verificationTimeoutRef.current) {
      clearTimeout(verificationTimeoutRef.current);
    }

    const urlError = validateUrl(targetUrl);
    if (!targetUrl.trim() || urlError) {
      setIsVerifiedDomain(null);
      setVerificationChecking(false);
      return;
    }

    setVerificationChecking(true);
    verificationTimeoutRef.current = setTimeout(async () => {
      try {
        const normalizedUrl = targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`;
        const res = await auditsApi.getDomainStatus(normalizedUrl);
        setIsVerifiedDomain(res.data.isVerified);
        // Also update domainStatus for later use
        setDomainStatus(res.data);
      } catch {
        // On error, assume unverified to be safe
        setIsVerifiedDomain(false);
      } finally {
        setVerificationChecking(false);
      }
    }, 500);

    return () => {
      if (verificationTimeoutRef.current) clearTimeout(verificationTimeoutRef.current);
    };
  }, [targetUrl]);

  // #46 Estimated time calculation
  const estimatedTime = (() => {
    const categoriesEnabled = [options.checkSeo, options.checkAccessibility, options.checkSecurity, options.checkPerformance].filter(Boolean).length;
    // Base: ~1.5s per page for crawl, plus ~0.5s per category per page
    const secondsPerPage = 1.5 + (categoriesEnabled * 0.5);
    const totalSeconds = Math.ceil(options.maxPages * secondsPerPage);
    // Single page audits are faster (no sitemap/crawl overhead)
    if (options.maxPages === 1) return '~10-15 seconds';
    if (totalSeconds < 60) return `~${totalSeconds} seconds`;
    const minutes = Math.ceil(totalSeconds / 60);
    return `~${minutes} minute${minutes > 1 ? 's' : ''}`;
  })();

  // Filter recent URLs for autocomplete
  const filteredUrls = recentUrls.filter(u =>
    u.target_url.toLowerCase().includes(targetUrl.toLowerCase()) ||
    u.target_domain.toLowerCase().includes(targetUrl.toLowerCase())
  ).slice(0, 5);

  // R4: Reset autocomplete index when filtered URLs change
  useEffect(() => {
    setAutocompleteIndex(-1);
  }, [filteredUrls.length]);

  // R4: Handle keyboard navigation in autocomplete
  const handleAutocompleteKeyDown = (e: React.KeyboardEvent) => {
    if (!showAutocomplete || filteredUrls.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setAutocompleteIndex(prev =>
          prev < filteredUrls.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setAutocompleteIndex(prev =>
          prev > 0 ? prev - 1 : filteredUrls.length - 1
        );
        break;
      case 'Enter':
        if (autocompleteIndex >= 0 && autocompleteIndex < filteredUrls.length) {
          e.preventDefault();
          setTargetUrl(filteredUrls[autocompleteIndex].target_url);
          setShowAutocomplete(false);
          setAutocompleteIndex(-1);
        }
        break;
      case 'Escape':
        setShowAutocomplete(false);
        setAutocompleteIndex(-1);
        break;
    }
  };

  const presets: { label: string; description: string; opts: Partial<AuditOptions>; requiresVerification?: boolean }[] = [
    { label: 'Single Page', description: 'Audit this URL only', opts: { maxPages: 1, maxDepth: 1, checkSeo: true, checkAccessibility: true, checkSecurity: true, checkPerformance: true } },
    { label: 'Quick Scan', description: '10 pages, SEO + Security', opts: { maxPages: 10, maxDepth: 2, checkSeo: true, checkAccessibility: false, checkSecurity: true, checkPerformance: false }, requiresVerification: true },
    { label: 'Full Audit', description: 'All categories, 100 pages', opts: { maxPages: 100, maxDepth: 5, checkSeo: true, checkAccessibility: true, checkSecurity: true, checkPerformance: true }, requiresVerification: true },
    { label: 'Accessibility', description: 'WCAG 2.2 AA, 50 pages', opts: { maxPages: 50, maxDepth: 3, checkSeo: false, checkAccessibility: true, checkSecurity: false, checkPerformance: false, wcagVersion: '2.2', wcagLevel: 'AA' }, requiresVerification: true },
  ];

  // Check if a preset is disabled (requires verification but domain is unverified)
  const isPresetDisabled = (preset: typeof presets[0]) => {
    if (!preset.requiresVerification) return false;
    // If we haven't checked yet or domain is verified, allow it
    if (isVerifiedDomain === null || isVerifiedDomain) return false;
    // Domain is explicitly unverified
    return true;
  };

  const applyPreset = (preset: typeof presets[0]) => {
    if (isPresetDisabled(preset)) return;
    setOptions(prev => ({ ...prev, ...preset.opts }));
    setShowAdvanced(true);
  };

  const handleSubmit = async (e: React.FormEvent, consent?: { accepted: boolean; dontShowAgain?: boolean }) => {
    e.preventDefault();

    const urlError = validateUrl(targetUrl);
    if (urlError) {
      setError(urlError);
      return;
    }

    // E4: Warn if URL is unreachable but allow override
    if (urlStatus === 'unreachable') {
      const proceed = confirm(
        `Warning: The URL appears to be unreachable (${urlStatusMessage}).\n\nDo you want to start the audit anyway?`
      );
      if (!proceed) {
        return;
      }
    }

    // Normalize URL
    const normalizedUrl = targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`;

    try {
      setLoading(true);
      setError(null);

      // Check domain status if we don't have consent yet
      if (!consent) {
        const statusResponse = await auditsApi.getDomainStatus(normalizedUrl);
        const status = statusResponse.data;
        setDomainStatus(status);

        // If consent is required and user hasn't opted out of warnings
        if (status.requiresConsent && !status.userSkipsWarning) {
          setPendingSubmit(normalizedUrl);
          setShowConsentModal(true);
          setLoading(false);
          return;
        }

        // If user has opted out but domain is unverified, still need to send consent
        if (status.requiresConsent && status.userSkipsWarning) {
          consent = { accepted: true, dontShowAgain: true };
        }
      }

      // Get competitor ID if present (for linking audit to competitor)
      const competitorProfileId = searchParams.get('competitor') || undefined;

      const response = await auditsApi.start({
        targetUrl: normalizedUrl,
        siteId: siteIdParam || undefined,
        competitorProfileId,
        options,
        consent,
      });

      // Navigate to the audit detail page
      navigate(`/audits/${response.data.audit.id}`);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string; code?: string } } };

      // Handle consent required error
      if (axiosError.response?.data?.code === 'CONSENT_REQUIRED') {
        setDomainStatus(axiosError.response.data as typeof domainStatus);
        setPendingSubmit(normalizedUrl);
        setShowConsentModal(true);
      } else {
        setError(axiosError.response?.data?.error || 'Failed to start audit. Please try again.');
      }
      console.error('Failed to start audit:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle consent acceptance from modal
  const handleConsentAccept = async (dontShowAgain: boolean) => {
    setShowConsentModal(false);
    if (pendingSubmit) {
      // Re-submit with consent
      const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
      await handleSubmit(fakeEvent, { accepted: true, dontShowAgain });
    }
    setPendingSubmit(null);
  };

  // Handle consent cancel
  const handleConsentCancel = () => {
    setShowConsentModal(false);
    setPendingSubmit(null);
    setDomainStatus(null);
  };

  const updateOption = <K extends keyof AuditOptions>(key: K, value: AuditOptions[K]) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  return (
    <DashboardLayout>
      <Helmet><title>New Audit | PagePulser</title></Helmet>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
            <Plus className="w-6 h-6 text-indigo-600" />
            New Audit
          </h1>
          <p className="text-slate-600 mt-1">
            Enter a website URL to scan for SEO, accessibility, security, performance, and content issues.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="error">
              {error}
            </Alert>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="relative" ref={autocompleteRef}>
              <Input
                label="Website URL"
                type="text"
                placeholder="example.com or https://example.com"
                value={targetUrl}
                onChange={(e) => {
                  setTargetUrl(e.target.value);
                  setShowAutocomplete(true);
                  setAutocompleteIndex(-1);
                }}
                onFocus={() => setShowAutocomplete(true)}
                onKeyDown={handleAutocompleteKeyDown}
                disabled={loading}
                aria-autocomplete="list"
                aria-expanded={showAutocomplete && filteredUrls.length > 0}
                aria-controls="url-autocomplete-list"
                aria-activedescendant={autocompleteIndex >= 0 ? `url-option-${autocompleteIndex}` : undefined}
              />
              {/* #45 Recent URLs autocomplete dropdown (R4: with keyboard navigation) */}
              {showAutocomplete && filteredUrls.length > 0 && targetUrl.length > 0 && (
                <div
                  id="url-autocomplete-list"
                  role="listbox"
                  className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
                >
                  {filteredUrls.map((u, idx) => (
                    <button
                      key={idx}
                      id={`url-option-${idx}`}
                      type="button"
                      role="option"
                      aria-selected={idx === autocompleteIndex}
                      className={`w-full text-left px-4 py-2 flex items-center gap-2 ${
                        idx === autocompleteIndex ? 'bg-indigo-50 text-indigo-900' : 'hover:bg-slate-50'
                      }`}
                      onClick={() => {
                        setTargetUrl(u.target_url);
                        setShowAutocomplete(false);
                        setAutocompleteIndex(-1);
                      }}
                      onMouseEnter={() => setAutocompleteIndex(idx)}
                    >
                      <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm text-slate-700 truncate">{u.target_url}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Browse Known URLs button - shown when we have a siteId */}
            {siteIdParam && (
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowUrlPicker(true)}
                  className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                  Browse Known URLs
                  {knownPagesCount !== null && knownPagesCount > 0 && (
                    <span className="text-slate-500">({knownPagesCount})</span>
                  )}
                </button>
                <span className="text-xs text-slate-500">
                  from sitemap and previous audits
                </span>
              </div>
            )}

            {/* #44 URL reachability indicator */}
            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {urlStatus === 'checking' && (
                  <>
                    <svg className="w-4 h-4 text-slate-500 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-sm text-slate-500">Checking URL...</span>
                  </>
                )}
                {urlStatus === 'reachable' && (
                  <>
                    <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-emerald-600">{urlStatusMessage}</span>
                  </>
                )}
                {urlStatus === 'unreachable' && (
                  <>
                    <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="text-sm text-red-600">{urlStatusMessage}</span>
                  </>
                )}
                {urlStatus === 'idle' && (
                  <span className="text-sm text-slate-500">
                    Enter the starting URL for the audit.
                  </span>
                )}
              </div>

              {/* Domain verification status badge */}
              {targetUrl.trim() && !verificationChecking && isVerifiedDomain !== null && (
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
                  isVerifiedDomain
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {isVerifiedDomain ? (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      Verified
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Unverified
                    </>
                  )}
                </div>
              )}
              {targetUrl.trim() && verificationChecking && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  Checking...
                </div>
              )}
            </div>
          </div>

          {/* Preset Configs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {presets.map(p => {
              const disabled = isPresetDisabled(p);
              return (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => applyPreset(p)}
                  disabled={disabled}
                  className={`text-left p-3 border rounded-lg transition-colors relative ${
                    disabled
                      ? 'border-slate-100 bg-slate-50 cursor-not-allowed opacity-60'
                      : 'border-slate-200 hover:border-indigo-400 hover:bg-indigo-50'
                  }`}
                  title={disabled ? 'Verify this domain to enable multi-page audits' : undefined}
                >
                  <div className={`text-sm font-medium ${disabled ? 'text-slate-500' : 'text-slate-900'}`}>
                    {p.label}
                  </div>
                  <div className={`text-xs mt-1 ${disabled ? 'text-slate-500' : 'text-slate-500'}`}>
                    {p.description}
                  </div>
                  {disabled && (
                    <div className="absolute top-1 right-1">
                      <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Verification notice for unverified domains */}
          {isVerifiedDomain === false && targetUrl.trim() && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-amber-800">Unverified domain</p>
                <p className="text-sm text-amber-700 mt-0.5">
                  Multi-page audits require domain verification. You can run a single page audit, or{' '}
                  <a href="/settings/domains" className="underline hover:text-amber-900">verify this domain</a>{' '}
                  to unlock full audits.
                </p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              aria-expanded={showAdvanced}
              aria-controls="advanced-options-panel"
              className="flex items-center justify-between w-full text-left"
            >
              <span className="text-sm font-medium text-slate-700">Advanced Options</span>
              <svg
                className={`w-5 h-5 text-slate-500 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showAdvanced && (
              <div id="advanced-options-panel" className="mt-6 space-y-6">
                {/* Crawl Settings */}
                <div>
                  <h3 className="text-sm font-medium text-slate-900 mb-4">Crawl Settings</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-slate-700 mb-1">Max Pages</label>
                      <input
                        type="number"
                        min={1}
                        max={tierMaxPages}
                        value={options.maxPages}
                        onChange={(e) => updateOption('maxPages', Math.min(parseInt(e.target.value) || 50, tierMaxPages))}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-700 mb-1">Max Depth</label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={options.maxDepth}
                        onChange={(e) => updateOption('maxDepth', parseInt(e.target.value) || 3)}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Crawl Behavior */}
                <div>
                  <h3 className="text-sm font-medium text-slate-900 mb-4">Crawl Behavior</h3>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={options.respectRobotsTxt}
                        onChange={(e) => updateOption('respectRobotsTxt', e.target.checked)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                      />
                      <span className="ml-2 text-sm text-slate-700">Respect robots.txt</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={options.includeSubdomains}
                        onChange={(e) => updateOption('includeSubdomains', e.target.checked)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                      />
                      <span className="ml-2 text-sm text-slate-700">Include subdomains</span>
                    </label>
                  </div>
                </div>

                {/* Audit Types */}
                <div>
                  <h3 className="text-sm font-medium text-slate-900 mb-4">Audit Types</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex items-center p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={options.checkSeo}
                        onChange={(e) => updateOption('checkSeo', e.target.checked)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                      />
                      <div className="ml-3">
                        <span className="text-sm font-medium text-slate-900">SEO</span>
                        <p className="text-xs text-slate-500">Meta tags, headings, links</p>
                      </div>
                    </label>
                    <label className="flex items-center p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={options.checkAccessibility}
                        onChange={(e) => updateOption('checkAccessibility', e.target.checked)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                      />
                      <div className="ml-3">
                        <span className="text-sm font-medium text-slate-900">Accessibility</span>
                        <p className="text-xs text-slate-500">WCAG {options.wcagVersion} Level {options.wcagLevel}</p>
                      </div>
                    </label>
                    <label className="flex items-center p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={options.checkSecurity}
                        onChange={(e) => updateOption('checkSecurity', e.target.checked)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                      />
                      <div className="ml-3">
                        <span className="text-sm font-medium text-slate-900">Security</span>
                        <p className="text-xs text-slate-500">Headers, cookies, HTTPS</p>
                      </div>
                    </label>
                    <label className="flex items-center p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={options.checkPerformance}
                        onChange={(e) => updateOption('checkPerformance', e.target.checked)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                      />
                      <div className="ml-3">
                        <span className="text-sm font-medium text-slate-900">Performance</span>
                        <p className="text-xs text-slate-500">Speed, page size</p>
                      </div>
                    </label>
                    <label className={`flex items-center p-3 border rounded-lg ${
                      canUseFileExtraction
                        ? 'border-slate-200 hover:bg-slate-50 cursor-pointer'
                        : 'border-slate-100 bg-slate-50 cursor-not-allowed opacity-60'
                    }`}>
                      <input
                        type="checkbox"
                        checked={options.checkFileExtraction}
                        onChange={(e) => canUseFileExtraction && updateOption('checkFileExtraction', e.target.checked)}
                        disabled={!canUseFileExtraction}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded disabled:opacity-50"
                      />
                      <div className="ml-3 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium text-slate-900">File Extraction</span>
                          {!canUseFileExtraction && <Lock className="w-3.5 h-3.5 text-slate-500" />}
                        </div>
                        <p className="text-xs text-slate-500">
                          {canUseFileExtraction ? 'Discover all files & assets' : 'Starter plan required'}
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* WCAG Settings (shown when accessibility is enabled) */}
                {options.checkAccessibility && (
                  <div>
                    <h3 className="text-sm font-medium text-slate-900 mb-4">WCAG Settings</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-slate-700 mb-1">WCAG Version</label>
                        <select
                          value={options.wcagVersion}
                          onChange={(e) => updateOption('wcagVersion', e.target.value as WcagVersion)}
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="2.1">WCAG 2.1</option>
                          <option value="2.2">WCAG 2.2</option>
                        </select>
                        <p className="mt-1 text-xs text-slate-500">
                          {options.wcagVersion === '2.2' ? 'Latest standard (2023)' : 'Previous standard (2018)'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm text-slate-700 mb-1">Conformance Level</label>
                        <select
                          value={options.wcagLevel}
                          onChange={(e) => updateOption('wcagLevel', e.target.value as WcagLevel)}
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="A">Level A (Minimum)</option>
                          <option value="AA">Level AA (Recommended)</option>
                          <option value="AAA">Level AAA (Enhanced)</option>
                        </select>
                        <p className="mt-1 text-xs text-slate-500">
                          {options.wcagLevel === 'A' && 'Basic accessibility requirements'}
                          {options.wcagLevel === 'AA' && 'Standard for most legal requirements'}
                          {options.wcagLevel === 'AAA' && 'Highest level of accessibility'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* #46 Estimated time display */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 flex items-center gap-3">
            <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <span className="text-sm font-medium text-indigo-800">Estimated time: {estimatedTime}</span>
              <span className="text-sm text-indigo-600 ml-2">
                ({options.maxPages} pages, {[options.checkSeo, options.checkAccessibility, options.checkSecurity, options.checkPerformance].filter(Boolean).length} categories)
              </span>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                // If we came from a site, go back there; otherwise go to sites list
                if (siteIdParam) {
                  navigate(`/sites/${siteIdParam}`);
                } else {
                  navigate('/sites');
                }
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={loading}>
              Start Audit
            </Button>
          </div>
        </form>
      </div>

      {/* Consent modal for unverified domains */}
      {domainStatus && domainStatus.scanLimits && (
        <UnverifiedDomainConsentModal
          domain={domainStatus.domain}
          scanLimits={domainStatus.scanLimits}
          isOpen={showConsentModal}
          onAccept={handleConsentAccept}
          onCancel={handleConsentCancel}
        />
      )}

      {/* Known URL picker modal */}
      {showUrlPicker && siteIdParam && (
        <KnownUrlPicker
          siteId={siteIdParam}
          onSelect={(url) => {
            setTargetUrl(url);
            setShowUrlPicker(false);
          }}
          onClose={() => setShowUrlPicker(false)}
        />
      )}
    </DashboardLayout>
  );
}
