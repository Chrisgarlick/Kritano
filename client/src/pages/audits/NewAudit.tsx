import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';
import { auditsApi } from '../../services/api';
import { Plus } from 'lucide-react';

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
  wcagVersion: WcagVersion;
  wcagLevel: WcagLevel;
}

export default function NewAuditPage() {
  const navigate = useNavigate();
  const [targetUrl, setTargetUrl] = useState('');
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
    wcagVersion: '2.2',
    wcagLevel: 'AA',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateUrl = (url: string): string | null => {
    if (!url.trim()) return 'URL is required';
    try {
      const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
      if (!['http:', 'https:'].includes(parsed.protocol)) return 'URL must use HTTP or HTTPS protocol';
      return null;
    } catch {
      return 'Please enter a valid URL';
    }
  };

  const estimatedTime = (() => {
    const categoriesEnabled = [options.checkSeo, options.checkAccessibility, options.checkSecurity, options.checkPerformance].filter(Boolean).length;
    const secondsPerPage = 1.5 + (categoriesEnabled * 0.5);
    const totalSeconds = Math.ceil(options.maxPages * secondsPerPage);
    if (options.maxPages === 1) return '~10-15 seconds';
    if (totalSeconds < 60) return `~${totalSeconds} seconds`;
    const minutes = Math.ceil(totalSeconds / 60);
    return `~${minutes} minute${minutes > 1 ? 's' : ''}`;
  })();

  const presets: { label: string; description: string; opts: Partial<AuditOptions> }[] = [
    { label: 'Single Page', description: 'Audit this URL only', opts: { maxPages: 1, maxDepth: 0, checkSeo: true, checkAccessibility: true, checkSecurity: true, checkPerformance: true } },
    { label: 'Quick Scan', description: '10 pages, SEO + Security', opts: { maxPages: 10, maxDepth: 2, checkSeo: true, checkAccessibility: false, checkSecurity: true, checkPerformance: false } },
    { label: 'Full Audit', description: 'All categories, 100 pages', opts: { maxPages: 100, maxDepth: 5, checkSeo: true, checkAccessibility: true, checkSecurity: true, checkPerformance: true } },
    { label: 'Accessibility', description: 'WCAG 2.2 AA, 50 pages', opts: { maxPages: 50, maxDepth: 3, checkSeo: false, checkAccessibility: true, checkSecurity: false, checkPerformance: false, wcagVersion: '2.2', wcagLevel: 'AA' } },
  ];

  const applyPreset = (preset: typeof presets[0]) => {
    setOptions(prev => ({ ...prev, ...preset.opts }));
    setShowAdvanced(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const urlError = validateUrl(targetUrl);
    if (urlError) {
      setError(urlError);
      return;
    }

    const normalizedUrl = targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`;

    try {
      setLoading(true);
      setError(null);

      const response = await auditsApi.start({
        targetUrl: normalizedUrl,
        options,
      });

      navigate(`/audits/${response.data.audit.id}`);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } } };
      setError(axiosError.response?.data?.error || 'Failed to start audit. Please try again.');
      console.error('Failed to start audit:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateOption = <K extends keyof AuditOptions>(key: K, value: AuditOptions[K]) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
            <Plus className="w-6 h-6 text-indigo-600" />
            New Audit
          </h1>
          <p className="text-slate-600 mt-1">
            Enter a website URL to scan for SEO, accessibility, security, and performance issues.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="error">
              {error}
            </Alert>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <Input
              label="Website URL"
              type="text"
              placeholder="example.com or https://example.com"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              disabled={loading}
            />
            <p className="mt-2 text-sm text-slate-500">
              Enter the starting URL for the audit.
            </p>
          </div>

          {/* Preset Configs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {presets.map(p => (
              <button
                key={p.label}
                type="button"
                onClick={() => applyPreset(p)}
                className="text-left p-3 border rounded-lg transition-colors border-slate-200 hover:border-indigo-400 hover:bg-indigo-50"
              >
                <div className="text-sm font-medium text-slate-900">{p.label}</div>
                <div className="text-xs mt-1 text-slate-500">{p.description}</div>
              </button>
            ))}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              aria-expanded={showAdvanced}
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
              <div className="mt-6 space-y-6">
                {/* Crawl Settings */}
                <div>
                  <h3 className="text-sm font-medium text-slate-900 mb-4">Crawl Settings</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-slate-700 mb-1">Max Pages</label>
                      <input
                        type="number"
                        min={1}
                        max={500}
                        value={options.maxPages}
                        onChange={(e) => updateOption('maxPages', parseInt(e.target.value) || 50)}
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
                  </div>
                </div>

                {/* WCAG Settings */}
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
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Estimated time */}
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
              onClick={() => navigate('/audits')}
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
    </DashboardLayout>
  );
}
