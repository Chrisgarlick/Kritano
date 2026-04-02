/**
 * Audit Error Summary Component
 *
 * Displays a summary of crawl errors encountered during an audit,
 * grouped by error type with helpful descriptions.
 */

/** Error type labels for display */
const ERROR_TYPE_LABELS: Record<string, { label: string; description: string }> = {
  TIMEOUT: {
    label: 'Timeout',
    description: 'Pages that took too long to respond',
  },
  CONNECTION_REFUSED: {
    label: 'Connection Refused',
    description: 'Server refused the connection',
  },
  CONNECTION_RESET: {
    label: 'Connection Reset',
    description: 'Connection was terminated unexpectedly',
  },
  DNS_FAILURE: {
    label: 'DNS Failure',
    description: 'Could not resolve the domain name',
  },
  SSL_ERROR: {
    label: 'SSL Error',
    description: 'Security certificate issues',
  },
  CLOUDFLARE_CHALLENGE: {
    label: 'Cloudflare Protection',
    description: 'Blocked by Cloudflare security',
  },
  CAPTCHA_REQUIRED: {
    label: 'CAPTCHA Required',
    description: 'Human verification needed',
  },
  BOT_DETECTED: {
    label: 'Bot Detected',
    description: 'Automated access was blocked',
  },
  ACCESS_DENIED: {
    label: 'Access Denied',
    description: 'HTTP 403 Forbidden response',
  },
  WAF_BLOCKED: {
    label: 'WAF Blocked',
    description: 'Blocked by web application firewall',
  },
  RATE_LIMITED: {
    label: 'Rate Limited',
    description: 'Too many requests (HTTP 429)',
  },
  IP_BLOCKED: {
    label: 'IP Blocked',
    description: 'IP address is blacklisted',
  },
  PAGE_NOT_FOUND: {
    label: 'Not Found',
    description: 'Page does not exist (HTTP 404)',
  },
  SERVER_ERROR: {
    label: 'Server Error',
    description: 'Website server error (5xx)',
  },
  BAD_GATEWAY: {
    label: 'Bad Gateway',
    description: 'Proxy/gateway error (HTTP 502)',
  },
  SERVICE_UNAVAILABLE: {
    label: 'Service Unavailable',
    description: 'Temporarily unavailable (HTTP 503)',
  },
  LOGIN_REQUIRED: {
    label: 'Login Required',
    description: 'Authentication needed to access',
  },
  PAYWALL: {
    label: 'Paywall',
    description: 'Subscription required',
  },
  GEO_BLOCKED: {
    label: 'Geographic Block',
    description: 'Content restricted by location',
  },
  UNKNOWN: {
    label: 'Unknown Error',
    description: 'Unexpected error occurred',
  },
};

/** Error category labels */
const CATEGORY_LABELS: Record<string, string> = {
  security: 'Security/Bot Detection',
  network: 'Network Issues',
  server: 'Server Errors',
  content: 'Content Issues',
  unknown: 'Other',
};

/** Security-related error types */
const SECURITY_ERROR_TYPES = [
  'CLOUDFLARE_CHALLENGE',
  'CAPTCHA_REQUIRED',
  'BOT_DETECTED',
  'ACCESS_DENIED',
  'WAF_BLOCKED',
  'RATE_LIMITED',
  'IP_BLOCKED',
];

interface ErrorSummary {
  byType: Record<string, number>;
  byCategory: Record<string, number>;
}

interface AuditErrorSummaryProps {
  /** Total number of errors */
  totalErrors: number;
  /** Error counts by type */
  errorsByType?: Record<string, number>;
  /** Error counts by category */
  errorsByCategory?: Record<string, number>;
  /** Raw error summary from API */
  errorSummary?: ErrorSummary;
  /** Whether to show the component even with no errors */
  showEmpty?: boolean;
}

export function AuditErrorSummary({
  totalErrors,
  errorsByType,
  errorsByCategory,
  errorSummary,
  showEmpty = false,
}: AuditErrorSummaryProps) {
  // Use errorSummary if provided, otherwise use individual props
  const byType = errorSummary?.byType || errorsByType || {};
  const byCategory = errorSummary?.byCategory || errorsByCategory || {};

  if (totalErrors === 0 && !showEmpty) {
    return null;
  }

  // Check if there are security-related errors
  const hasSecurityErrors = Object.keys(byType).some(
    (type) => SECURITY_ERROR_TYPES.includes(type) && byType[type] > 0
  );

  // Sort error types by count (descending)
  const sortedTypes = Object.entries(byType)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
      <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
        <svg
          className="w-5 h-5 text-slate-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        Crawl Issues
        <span className="text-sm font-normal text-slate-500">
          ({totalErrors} page{totalErrors !== 1 ? 's' : ''} affected)
        </span>
      </h3>

      {sortedTypes.length > 0 ? (
        <div className="space-y-2">
          {sortedTypes.map(([type, count]) => {
            const info = ERROR_TYPE_LABELS[type] || {
              label: type,
              description: 'Unknown error type',
            };
            const isSecurityError = SECURITY_ERROR_TYPES.includes(type);

            return (
              <div
                key={type}
                className={`flex justify-between items-center text-sm p-2 rounded ${
                  isSecurityError ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-slate-50 dark:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  {isSecurityError && (
                    <svg
                      className="w-4 h-4 text-amber-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                  <div>
                    <span className="text-slate-700 dark:text-slate-300 font-medium">{info.label}</span>
                    <span className="text-slate-500 dark:text-slate-400 text-xs ml-2">
                      {info.description}
                    </span>
                  </div>
                </div>
                <span
                  className={`font-medium ${
                    isSecurityError ? 'text-amber-700 dark:text-amber-400' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {count} page{count !== 1 ? 's' : ''}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-slate-500 text-sm">No detailed error information available.</p>
      )}

      {hasSecurityErrors && (
        <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded text-sm text-amber-800 dark:text-amber-300">
          <strong>Note:</strong> Some pages were blocked by security measures.
          The audit results may be incomplete. Consider contacting the website
          owner to whitelist the crawler.
        </div>
      )}

      {Object.keys(byCategory).length > 0 && (
        <details className="mt-4">
          <summary className="text-sm text-slate-500 dark:text-slate-400 cursor-pointer hover:text-slate-700 dark:hover:text-slate-300">
            View by category
          </summary>
          <div className="mt-2 space-y-1">
            {Object.entries(byCategory)
              .filter(([, count]) => count > 0)
              .map(([category, count]) => (
                <div
                  key={category}
                  className="flex justify-between text-sm text-slate-600 dark:text-slate-400"
                >
                  <span>{CATEGORY_LABELS[category] || category}</span>
                  <span>{count}</span>
                </div>
              ))}
          </div>
        </details>
      )}
    </div>
  );
}
