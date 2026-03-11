/**
 * Security Blocked Alert Component
 *
 * Displays a prominent alert when an audit is blocked by
 * website security measures (Cloudflare, CAPTCHA, etc.)
 */

interface SecurityBlockedAlertProps {
  /** The reason why the audit was blocked */
  reason: string;
  /** Suggestion for how to resolve the issue */
  suggestion: string;
  /** Number of pages that were blocked */
  pagesBlocked?: number;
  /** Total pages attempted */
  totalPages?: number;
  /** Whether this is a fatal error that completely blocked the audit */
  isFatal?: boolean;
}

export function SecurityBlockedAlert({
  reason,
  suggestion,
  pagesBlocked,
  totalPages,
  isFatal = false,
}: SecurityBlockedAlertProps) {
  // Use red colors for fatal errors, amber for partial blocking
  const colors = isFatal
    ? {
        bg: 'bg-red-50',
        border: 'border-red-200',
        icon: 'text-red-600',
        title: 'text-red-800',
        text: 'text-red-700',
        subtle: 'text-red-600',
        box: 'bg-red-100',
      }
    : {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        icon: 'text-amber-600',
        title: 'text-amber-800',
        text: 'text-amber-700',
        subtle: 'text-amber-600',
        box: 'bg-amber-100',
      };

  return (
    <div className={`${colors.bg} ${colors.border} border rounded-lg p-4 mb-6`} role="alert">
      <div className="flex items-start gap-3">
        {/* Shield/Warning Icon */}
        <svg
          className={`w-6 h-6 ${colors.icon} flex-shrink-0 mt-0.5`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          {isFatal ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          )}
        </svg>

        <div className="flex-1">
          <h3 className={`font-semibold ${colors.title}`}>
            {isFatal ? 'Audit Blocked by Website Security' : 'Website Security Protection Detected'}
          </h3>

          <p className={`${colors.text} mt-1`}>{reason}</p>

          {pagesBlocked !== undefined && totalPages !== undefined && pagesBlocked > 0 && (
            <p className={`${colors.subtle} text-sm mt-2`}>
              {pagesBlocked} of {totalPages} page{totalPages !== 1 ? 's' : ''} blocked
            </p>
          )}

          <div className={`mt-3 p-3 ${colors.box} rounded text-sm`}>
            <strong className={colors.title}>What you can do:</strong>
            <p className={`mt-1 ${colors.text}`}>{suggestion}</p>
          </div>

          <div className={`mt-3 text-xs ${colors.subtle}`}>
            <details>
              <summary className={`cursor-pointer hover:${colors.title}`}>
                Technical details
              </summary>
              <div className={`mt-2 p-2 ${colors.box} rounded font-mono text-xs`}>
                <p>The website is using one or more of the following protection methods:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Cloudflare Bot Fight Mode / Under Attack Mode</li>
                  <li>CAPTCHA verification (reCAPTCHA, hCaptcha)</li>
                  <li>Web Application Firewall (WAF) rules</li>
                  <li>IP-based rate limiting or blocking</li>
                  <li>JavaScript challenge pages</li>
                </ul>
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}
