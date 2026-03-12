import { useState } from 'react';
import { Button } from '../ui/Button';

interface ScanLimits {
  maxPages: number;
  minDelayMs: number;
  robotsTxtRequired: boolean;
  sequential: boolean;
}

interface UnverifiedDomainConsentModalProps {
  domain: string;
  scanLimits: ScanLimits;
  isOpen: boolean;
  onAccept: (dontShowAgain: boolean) => void;
  onCancel: () => void;
}

export function UnverifiedDomainConsentModal({
  domain,
  scanLimits,
  isOpen,
  onAccept,
  onCancel,
}: UnverifiedDomainConsentModalProps) {
  const [hasAuthorization, setHasAuthorization] = useState(false);
  const [acceptsLiability, setAcceptsLiability] = useState(false);
  const [understandsPerformance, setUnderstandsPerformance] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const canProceed = hasAuthorization && acceptsLiability && understandsPerformance;

  const handleAccept = () => {
    if (canProceed) {
      onAccept(dontShowAgain);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="consent-modal-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-500 bg-opacity-75 transition-opacity"
        aria-hidden="true"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
          {/* Header */}
          <div className="bg-amber-50 px-4 py-4 sm:px-6 border-b border-amber-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-8 w-8 text-amber-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3
                  className="text-lg font-semibold text-amber-800"
                  id="consent-modal-title"
                >
                  Scanning Unverified Domain
                </h3>
                <p className="text-sm text-amber-700 mt-1">
                  <span className="font-mono bg-amber-100 px-1 rounded">{domain}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="px-4 py-4 sm:px-6">
            <p className="text-sm text-slate-600 mb-4">
              You are about to scan a domain that has not been verified as belonging to your
              organization. Please confirm the following before proceeding:
            </p>

            {/* Checkboxes */}
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasAuthorization}
                  onChange={(e) => setHasAuthorization(e.target.checked)}
                  className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                />
                <span className="text-sm text-slate-700">
                  I have <strong>explicit authorization</strong> from the domain owner to scan this
                  website
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={understandsPerformance}
                  onChange={(e) => setUnderstandsPerformance(e.target.checked)}
                  className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                />
                <span className="text-sm text-slate-700">
                  I understand this scan may <strong>impact the target website&apos;s performance</strong>
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptsLiability}
                  onChange={(e) => setAcceptsLiability(e.target.checked)}
                  className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                />
                <span className="text-sm text-slate-700">
                  I accept <strong>full responsibility</strong> for any consequences of this scan
                </span>
              </label>
            </div>

            {/* Scan Limitations */}
            <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <h4 className="text-sm font-medium text-slate-700 mb-2">
                Scan Limitations (for unverified domains):
              </h4>
              <ul className="text-xs text-slate-600 space-y-1">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                  Maximum {scanLimits.maxPages} pages
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                  Slower crawl speed ({(scanLimits.minDelayMs / 1000).toFixed(1)}+ seconds between requests)
                </li>
                {scanLimits.sequential && (
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                    Sequential crawling (one page at a time)
                  </li>
                )}
                {scanLimits.robotsTxtRequired && (
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                    robots.txt must be respected
                  </li>
                )}
              </ul>
            </div>

            {/* Don't show again */}
            <div className="mt-4 pt-3 border-t border-slate-200">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                  className="h-4 w-4 text-slate-500 focus:ring-slate-400 border-slate-300 rounded"
                />
                <span className="text-xs text-slate-500">
                  Don&apos;t show this warning again (consent is still logged)
                </span>
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-slate-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 border-t border-slate-200">
            <Button
              onClick={handleAccept}
              disabled={!canProceed}
              variant="primary"
              className="w-full sm:w-auto sm:ml-3"
            >
              Accept &amp; Continue
            </Button>
            <Button
              onClick={onCancel}
              variant="outline"
              className="mt-3 w-full sm:mt-0 sm:w-auto"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
