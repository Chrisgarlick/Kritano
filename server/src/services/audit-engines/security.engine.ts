import * as cheerio from 'cheerio';
import * as tls from 'tls';
import type { SecurityFinding, Severity } from '../../types/finding.types';
import type { CrawlResult, CookieInfo } from '../../types/spider.types';
import { SCANNER_INFO } from '../../constants/consent.constants.js';

// Security rule definition
interface SecurityRule {
  id: string;
  name: string;
  description: string;
  severity: Severity;
  helpUrl?: string;
  check: (ctx: SecurityContext) => SecurityFinding | SecurityFinding[] | null | Promise<SecurityFinding | SecurityFinding[] | null>;
}

// Context passed to rule checks
interface SecurityContext {
  url: string;
  $: cheerio.Root;
  html: string;
  headers: Record<string, string>;
  statusCode: number;
  cookies: CookieInfo[];
  isHttps: boolean;
}

// Sensitive files to probe
const SENSITIVE_FILES = [
  { path: '/.env', name: 'Environment file', severity: 'critical' as Severity },
  { path: '/.env.local', name: 'Local environment file', severity: 'critical' as Severity },
  { path: '/.env.production', name: 'Production environment file', severity: 'critical' as Severity },
  { path: '/.git/config', name: 'Git configuration', severity: 'critical' as Severity },
  { path: '/.git/HEAD', name: 'Git HEAD file', severity: 'serious' as Severity },
  { path: '/wp-config.php', name: 'WordPress configuration', severity: 'critical' as Severity },
  { path: '/config.php', name: 'PHP configuration', severity: 'critical' as Severity },
  { path: '/config.json', name: 'JSON configuration', severity: 'serious' as Severity },
  { path: '/package.json', name: 'Node.js package file', severity: 'info' as Severity },
  { path: '/.htaccess', name: 'Apache configuration', severity: 'moderate' as Severity },
  { path: '/web.config', name: 'IIS configuration', severity: 'moderate' as Severity },
  { path: '/backup.sql', name: 'Database backup', severity: 'critical' as Severity },
  { path: '/dump.sql', name: 'Database dump', severity: 'critical' as Severity },
  { path: '/database.sql', name: 'Database file', severity: 'critical' as Severity },
  { path: '/.DS_Store', name: 'macOS metadata', severity: 'minor' as Severity },
  { path: '/phpinfo.php', name: 'PHP info page', severity: 'serious' as Severity },
  { path: '/server-status', name: 'Apache server status', severity: 'serious' as Severity },
  { path: '/elmah.axd', name: 'ELMAH error log', severity: 'serious' as Severity },
  { path: '/.svn/entries', name: 'SVN metadata', severity: 'serious' as Severity },
  { path: '/crossdomain.xml', name: 'Flash crossdomain policy', severity: 'moderate' as Severity },
];

// Required security headers
const SECURITY_HEADERS = [
  {
    name: 'Strict-Transport-Security',
    id: 'missing-hsts',
    ruleName: 'Missing HSTS Header',
    severity: 'serious' as Severity,
    recommendation: 'Add Strict-Transport-Security header with max-age of at least 1 year',
  },
  {
    name: 'Content-Security-Policy',
    id: 'missing-csp',
    ruleName: 'Missing Content Security Policy',
    severity: 'moderate' as Severity,
    recommendation: 'Implement a Content Security Policy to prevent XSS and data injection attacks',
  },
  {
    name: 'X-Frame-Options',
    id: 'missing-x-frame-options',
    ruleName: 'Missing X-Frame-Options',
    severity: 'moderate' as Severity,
    recommendation: 'Add X-Frame-Options: DENY or SAMEORIGIN to prevent clickjacking',
  },
  {
    name: 'X-Content-Type-Options',
    id: 'missing-x-content-type-options',
    ruleName: 'Missing X-Content-Type-Options',
    severity: 'moderate' as Severity,
    recommendation: 'Add X-Content-Type-Options: nosniff to prevent MIME type sniffing',
  },
  {
    name: 'Referrer-Policy',
    id: 'missing-referrer-policy',
    ruleName: 'Missing Referrer Policy',
    severity: 'minor' as Severity,
    recommendation: 'Add Referrer-Policy header to control information leakage',
  },
  {
    name: 'Permissions-Policy',
    id: 'missing-permissions-policy',
    ruleName: 'Missing Permissions Policy',
    severity: 'minor' as Severity,
    recommendation: 'Add Permissions-Policy header to control browser features',
  },
];

export class SecurityEngine {
  private rules: SecurityRule[] = [
    // HTTPS check
    {
      id: 'no-https',
      name: 'Not Using HTTPS',
      description: 'Page is served over insecure HTTP',
      severity: 'critical',
      check: (ctx) => {
        if (!ctx.isHttps) {
          return this.createFinding('no-https', 'Not Using HTTPS', 'critical',
            'Page is served over insecure HTTP connection',
            'Migrate to HTTPS and redirect all HTTP traffic');
        }
        return null;
      },
    },

    // Mixed content
    {
      id: 'mixed-content',
      name: 'Mixed Content',
      description: 'HTTPS page loads resources over HTTP',
      severity: 'serious',
      check: (ctx) => {
        if (!ctx.isHttps) return null;

        const findings: SecurityFinding[] = [];

        // Check scripts
        ctx.$('script[src^="http://"]').each((_, el) => {
          const src = ctx.$(el).attr('src');
          findings.push(this.createFinding('mixed-content-script', 'Mixed Content (Script)', 'critical',
            `Insecure script loaded over HTTP: ${src}`,
            'Update script URL to use HTTPS',
            `script[src="${src}"]`));
        });

        // Check stylesheets
        ctx.$('link[rel="stylesheet"][href^="http://"]').each((_, el) => {
          const href = ctx.$(el).attr('href');
          findings.push(this.createFinding('mixed-content-css', 'Mixed Content (Stylesheet)', 'serious',
            `Insecure stylesheet loaded over HTTP: ${href}`,
            'Update stylesheet URL to use HTTPS',
            `link[href="${href}"]`));
        });

        // Check images
        ctx.$('img[src^="http://"]').each((_, el) => {
          const src = ctx.$(el).attr('src');
          findings.push(this.createFinding('mixed-content-image', 'Mixed Content (Image)', 'moderate',
            `Insecure image loaded over HTTP: ${src}`,
            'Update image URL to use HTTPS',
            `img[src="${src}"]`));
        });

        // Check iframes
        ctx.$('iframe[src^="http://"]').each((_, el) => {
          const src = ctx.$(el).attr('src');
          findings.push(this.createFinding('mixed-content-iframe', 'Mixed Content (Iframe)', 'serious',
            `Insecure iframe loaded over HTTP: ${src}`,
            'Update iframe URL to use HTTPS',
            `iframe[src="${src}"]`));
        });

        return findings.length > 0 ? findings : null;
      },
    },

    // Security headers check (dynamic)
    ...SECURITY_HEADERS.map(header => ({
      id: header.id,
      name: header.ruleName,
      description: `Missing ${header.name} header`,
      severity: header.severity,
      check: (ctx: SecurityContext) => {
        // Check lowercase header names (HTTP headers are case-insensitive)
        const headerValue = Object.entries(ctx.headers).find(
          ([key]) => key.toLowerCase() === header.name.toLowerCase()
        )?.[1];

        if (!headerValue) {
          return this.createFinding(header.id, header.ruleName, header.severity,
            `Missing ${header.name} security header`,
            header.recommendation);
        }
        return null;
      },
    })),

    // Cookie security
    {
      id: 'insecure-cookie',
      name: 'Insecure Cookie',
      description: 'Cookie missing Secure flag on HTTPS site',
      severity: 'serious',
      check: (ctx) => {
        if (!ctx.isHttps) return null;

        const findings: SecurityFinding[] = [];
        for (const cookie of ctx.cookies) {
          if (!cookie.secure) {
            findings.push(this.createFinding('insecure-cookie', 'Insecure Cookie', 'serious',
              `Cookie "${cookie.name}" is missing the Secure flag`,
              'Add the Secure flag to prevent cookie transmission over HTTP'));
          }
        }
        return findings.length > 0 ? findings : null;
      },
    },
    {
      id: 'cookie-missing-httponly',
      name: 'Cookie Missing HttpOnly',
      description: 'Cookie missing HttpOnly flag',
      severity: 'moderate',
      check: (ctx) => {
        const findings: SecurityFinding[] = [];

        // Only flag cookies that look like session/auth cookies
        const sensitivePatterns = ['session', 'token', 'auth', 'jwt', 'sid', 'csrf'];

        for (const cookie of ctx.cookies) {
          const isLikelySensitive = sensitivePatterns.some(p =>
            cookie.name.toLowerCase().includes(p)
          );

          if (isLikelySensitive && !cookie.httpOnly) {
            findings.push(this.createFinding('cookie-missing-httponly', 'Cookie Missing HttpOnly', 'moderate',
              `Cookie "${cookie.name}" is missing the HttpOnly flag`,
              'Add the HttpOnly flag to prevent JavaScript access'));
          }
        }
        return findings.length > 0 ? findings : null;
      },
    },
    {
      id: 'cookie-missing-samesite',
      name: 'Cookie Missing SameSite',
      description: 'Cookie missing SameSite attribute',
      severity: 'moderate',
      check: (ctx) => {
        const findings: SecurityFinding[] = [];

        for (const cookie of ctx.cookies) {
          if (!cookie.sameSite || cookie.sameSite === 'None') {
            findings.push(this.createFinding('cookie-missing-samesite', 'Cookie Missing SameSite', 'moderate',
              `Cookie "${cookie.name}" has SameSite=${cookie.sameSite || 'None'}`,
              'Set SameSite=Strict or SameSite=Lax to prevent CSRF attacks'));
          }
        }
        return findings.length > 0 ? findings : null;
      },
    },

    // Form security
    {
      id: 'form-action-http',
      name: 'Form Submits to HTTP',
      description: 'Form action URL uses insecure HTTP',
      severity: 'critical',
      check: (ctx) => {
        const findings: SecurityFinding[] = [];

        ctx.$('form[action^="http://"]').each((_, el) => {
          const action = ctx.$(el).attr('action');
          findings.push(this.createFinding('form-action-http', 'Form Submits to HTTP', 'critical',
            `Form submits data to insecure HTTP endpoint: ${action}`,
            'Update form action to use HTTPS',
            'form'));
        });

        return findings.length > 0 ? findings : null;
      },
    },
    {
      id: 'password-autocomplete',
      name: 'Password Autocomplete Enabled',
      description: 'Password field allows autocomplete',
      severity: 'info',
      check: (ctx) => {
        const findings: SecurityFinding[] = [];

        ctx.$('input[type="password"]').each((_, el) => {
          const autocomplete = ctx.$(el).attr('autocomplete');
          // Modern browsers recommend allowing password managers
          // This is informational only
          if (!autocomplete || autocomplete === 'on') {
            findings.push(this.createFinding('password-autocomplete', 'Password Autocomplete', 'info',
              'Password field allows autocomplete (consider if intentional)',
              'Set autocomplete="current-password" or "new-password" for better UX'));
          }
        });

        return findings.length > 0 ? findings : null;
      },
    },

    // Information disclosure
    {
      id: 'server-version-exposed',
      name: 'Server Version Exposed',
      description: 'Server header reveals version information',
      severity: 'minor',
      check: (ctx) => {
        const server = ctx.headers['server'] || ctx.headers['Server'];
        if (server && /\d+\.\d+/.test(server)) {
          return this.createFinding('server-version-exposed', 'Server Version Exposed', 'minor',
            `Server header reveals version: ${server}`,
            'Configure server to hide version information');
        }
        return null;
      },
    },
    {
      id: 'x-powered-by',
      name: 'X-Powered-By Header Present',
      description: 'X-Powered-By header reveals technology stack',
      severity: 'minor',
      check: (ctx) => {
        const poweredBy = ctx.headers['x-powered-by'] || ctx.headers['X-Powered-By'];
        if (poweredBy) {
          return this.createFinding('x-powered-by', 'X-Powered-By Header Present', 'minor',
            `X-Powered-By header reveals: ${poweredBy}`,
            'Remove X-Powered-By header to hide technology stack');
        }
        return null;
      },
    },

    // Dangerous HTML attributes
    {
      id: 'inline-event-handlers',
      name: 'Inline Event Handlers',
      description: 'Page uses inline JavaScript event handlers',
      severity: 'minor',
      check: (ctx) => {
        const inlineEvents = [
          'onclick', 'onmouseover', 'onmouseout', 'onkeydown', 'onkeyup',
          'onload', 'onerror', 'onsubmit', 'onfocus', 'onblur',
        ];

        const findings: SecurityFinding[] = [];
        let count = 0;

        for (const event of inlineEvents) {
          ctx.$(`[${event}]`).each(() => count++);
        }

        if (count > 0) {
          findings.push(this.createFinding('inline-event-handlers', 'Inline Event Handlers', 'minor',
            `Page has ${count} inline event handler(s)`,
            'Move JavaScript to external files for better CSP compliance'));
        }

        return findings.length > 0 ? findings : null;
      },
    },

    // CSP policy analysis (#23)
    {
      id: 'csp-unsafe-inline',
      name: 'CSP Allows unsafe-inline',
      description: 'Content Security Policy allows unsafe inline scripts',
      severity: 'moderate',
      check: (ctx) => {
        const csp = Object.entries(ctx.headers).find(
          ([key]) => key.toLowerCase() === 'content-security-policy'
        )?.[1];
        if (!csp) return null;

        const findings: SecurityFinding[] = [];
        if (csp.includes("'unsafe-inline'") && (csp.includes('script-src') || csp.includes('default-src'))) {
          findings.push(this.createFinding('csp-unsafe-inline', 'CSP Allows unsafe-inline Scripts', 'moderate',
            'Content Security Policy allows unsafe-inline for scripts',
            'Remove unsafe-inline and use nonce or hash-based CSP for inline scripts'));
        }
        if (csp.includes("'unsafe-eval'")) {
          findings.push(this.createFinding('csp-unsafe-eval', 'CSP Allows unsafe-eval', 'serious',
            'Content Security Policy allows unsafe-eval',
            'Remove unsafe-eval to prevent eval-based XSS attacks'));
        }
        if (csp.includes('*') && !csp.includes('*.')) {
          findings.push(this.createFinding('csp-wildcard', 'CSP Uses Wildcard Source', 'serious',
            'Content Security Policy uses wildcard (*) source',
            'Replace wildcard with specific domain allowlist'));
        }
        return findings.length > 0 ? findings : null;
      },
    },

    // CORS misconfiguration (#25)
    {
      id: 'cors-wildcard',
      name: 'CORS Allows All Origins',
      description: 'Access-Control-Allow-Origin is set to wildcard',
      severity: 'moderate',
      check: (ctx) => {
        const acao = Object.entries(ctx.headers).find(
          ([key]) => key.toLowerCase() === 'access-control-allow-origin'
        )?.[1];
        if (acao === '*') {
          const acac = Object.entries(ctx.headers).find(
            ([key]) => key.toLowerCase() === 'access-control-allow-credentials'
          )?.[1];
          if (acac === 'true') {
            return this.createFinding('cors-wildcard-credentials', 'CORS Wildcard with Credentials', 'critical',
              'CORS allows all origins with credentials enabled',
              'Never combine Access-Control-Allow-Origin: * with Allow-Credentials: true');
          }
          return this.createFinding('cors-wildcard', 'CORS Allows All Origins', 'moderate',
            'Access-Control-Allow-Origin is set to * (wildcard)',
            'Restrict CORS to specific trusted origins instead of using wildcard');
        }
        return null;
      },
    },

    // CMS version detection (#27)
    {
      id: 'cms-version-exposed',
      name: 'CMS Version Exposed',
      description: 'CMS version information is exposed in page source',
      severity: 'moderate',
      check: (ctx) => {
        const findings: SecurityFinding[] = [];

        // WordPress
        const wpGenerator = ctx.$('meta[name="generator"]').attr('content') || '';
        if (/wordpress\s+\d/i.test(wpGenerator)) {
          findings.push(this.createFinding('cms-version-exposed', 'WordPress Version Exposed', 'moderate',
            `WordPress version detected: ${wpGenerator}`,
            'Remove the generator meta tag or use a security plugin to hide version info'));
        }

        // Drupal
        if (/drupal\s+\d/i.test(wpGenerator)) {
          findings.push(this.createFinding('cms-version-exposed', 'Drupal Version Exposed', 'moderate',
            `Drupal version detected: ${wpGenerator}`,
            'Remove the generator meta tag to hide CMS version'));
        }

        // Joomla
        if (/joomla/i.test(wpGenerator)) {
          findings.push(this.createFinding('cms-version-exposed', 'Joomla Version Exposed', 'moderate',
            `Joomla version detected: ${wpGenerator}`,
            'Remove the generator meta tag to hide CMS version'));
        }

        return findings.length > 0 ? findings : null;
      },
    },

    // Exposed admin panels (#28)
    {
      id: 'exposed-admin-link',
      name: 'Admin Panel Link Found',
      description: 'Page contains links to admin/login panels',
      severity: 'minor',
      check: (ctx) => {
        const adminPatterns = ['/wp-admin', '/wp-login', '/admin', '/administrator', '/login', '/dashboard'];
        const findings: SecurityFinding[] = [];
        const seen = new Set<string>();

        ctx.$('a[href]').each((_, el) => {
          const href = ctx.$(el).attr('href') || '';
          for (const pattern of adminPatterns) {
            if (href.includes(pattern) && !seen.has(pattern)) {
              seen.add(pattern);
              findings.push(this.createFinding('exposed-admin-link', 'Admin Panel Link Found', 'minor',
                `Page contains link to admin area: ${href.substring(0, 100)}`,
                'Consider removing public links to admin panels or protecting with additional authentication'));
            }
          }
        });

        return findings.length > 0 ? findings.slice(0, 5) : null;
      },
    },

    // Directory listing detection (#22)
    {
      id: 'directory-listing',
      name: 'Directory Listing Detected',
      description: 'Page appears to be an open directory listing',
      severity: 'serious',
      check: (ctx) => {
        const titleText = (ctx.$('title').first().text() || '').toLowerCase();
        const h1Text = (ctx.$('h1').first().text() || '').toLowerCase();

        if (titleText.includes('index of /') || h1Text.includes('index of /') ||
            titleText.includes('directory listing') || ctx.html.includes('<pre><a href="?')) {
          return this.createFinding('directory-listing', 'Directory Listing Detected', 'serious',
            'Page appears to show a directory listing',
            'Disable directory listing in your web server configuration (e.g., Options -Indexes for Apache)');
        }
        return null;
      },
    },

    // External scripts without integrity
    {
      id: 'script-missing-integrity',
      name: 'External Script Missing Integrity',
      description: 'External script lacks subresource integrity',
      severity: 'moderate',
      check: (ctx) => {
        const findings: SecurityFinding[] = [];

        ctx.$('script[src]').each((_, el) => {
          const src = ctx.$(el).attr('src') || '';
          const integrity = ctx.$(el).attr('integrity');

          // Only check external CDN scripts
          if (src.includes('cdn') || src.includes('jsdelivr') ||
              src.includes('unpkg') || src.includes('cdnjs')) {
            if (!integrity) {
              findings.push(this.createFinding('script-missing-integrity', 'External Script Missing Integrity', 'moderate',
                `External script lacks SRI: ${src.substring(0, 100)}`,
                'Add integrity attribute with SHA-256/384/512 hash',
                `script[src="${src.substring(0, 50)}"]`));
            }
          }
        });

        return findings.length > 0 ? findings : null;
      },
    },

    // Target blank without noopener
    {
      id: 'target-blank-no-noopener',
      name: 'External Link Missing noopener',
      description: 'External links with target=_blank lack rel=noopener',
      severity: 'minor',
      check: (ctx) => {
        const findings: SecurityFinding[] = [];

        ctx.$('a[target="_blank"]').each((_, el) => {
          const rel = ctx.$(el).attr('rel') || '';
          const href = ctx.$(el).attr('href') || '';

          // Only flag external links
          if ((href.startsWith('http://') || href.startsWith('https://')) &&
              !href.includes(new URL(ctx.url).hostname)) {
            if (!rel.includes('noopener') && !rel.includes('noreferrer')) {
              findings.push(this.createFinding('target-blank-no-noopener', 'External Link Missing noopener', 'minor',
                'External link with target="_blank" is missing rel="noopener"',
                'Add rel="noopener noreferrer" to prevent reverse tabnabbing',
                `a[href^="${href.substring(0, 50)}"]`));
            }
          }
        });

        // Limit findings
        return findings.length > 0 ? findings.slice(0, 10) : null;
      },
    },
  ];

  /**
   * Analyze a page for security issues
   */
  async analyze(crawlResult: CrawlResult): Promise<SecurityFinding[]> {
    const $ = cheerio.load(crawlResult.html);
    const isHttps = crawlResult.url.startsWith('https://');

    const ctx: SecurityContext = {
      url: crawlResult.url,
      $,
      html: crawlResult.html,
      headers: crawlResult.headers,
      statusCode: crawlResult.statusCode,
      cookies: crawlResult.cookies,
      isHttps,
    };

    const findings: SecurityFinding[] = [];

    // Run all rules
    for (const rule of this.rules) {
      try {
        const result = await rule.check(ctx);
        if (result) {
          if (Array.isArray(result)) {
            findings.push(...result);
          } else {
            findings.push(result);
          }
        }
      } catch (error) {
        console.warn(`Security rule ${rule.id} failed:`, error);
      }
    }

    return findings;
  }

  /**
   * Probe for exposed sensitive files
   * Note: This should be called once per audit, not per page
   */
  async probeExposedFiles(baseUrl: string, timeoutMs: number = 5000): Promise<SecurityFinding[]> {
    const findings: SecurityFinding[] = [];

    // Normalize base URL
    const url = new URL(baseUrl);
    const origin = url.origin;

    // Check security.txt (#21)
    await this.checkSecurityTxt(origin, timeoutMs, findings);

    // Check SSL/TLS certificate (#24)
    if (url.protocol === 'https:') {
      await this.checkSslCertificate(url.hostname, timeoutMs, findings);
    }

    for (const file of SENSITIVE_FILES) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        let response = await fetch(new URL(file.path, origin).toString(), {
          method: 'HEAD',
          redirect: 'manual',
          signal: controller.signal,
          headers: {
            'User-Agent': SCANNER_INFO.USER_AGENT,
          },
        });

        clearTimeout(timeoutId);

        // GET fallback (#26) — some servers reject HEAD
        if (response.status >= 400 && response.status !== 404) {
          try {
            const controller2 = new AbortController();
            const timeoutId2 = setTimeout(() => controller2.abort(), timeoutMs);
            response = await fetch(new URL(file.path, origin).toString(), {
              method: 'GET',
              redirect: 'manual',
              signal: controller2.signal,
              headers: {
                'User-Agent': SCANNER_INFO.USER_AGENT,
              },
            });
            clearTimeout(timeoutId2);
          } catch {
            continue;
          }
        }

        // Check if file is accessible
        if (response.status === 200) {
          findings.push(this.createFinding('exposed-sensitive-file', `Exposed ${file.name}`, file.severity,
            `Sensitive file accessible: ${file.path}`,
            'Remove this file from the public web root or restrict access immediately'));
        }
      } catch {
        // File not accessible or timeout - that's good
      }
    }

    return findings;
  }

  /**
   * Check for security.txt presence (#21)
   */
  private async checkSecurityTxt(origin: string, timeoutMs: number, findings: SecurityFinding[]): Promise<void> {
    const paths = ['/.well-known/security.txt', '/security.txt'];

    for (const path of paths) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        const response = await fetch(new URL(path, origin).toString(), {
          method: 'GET',
          redirect: 'follow',
          signal: controller.signal,
          headers: { 'User-Agent': 'PagePulser/1.0 Security Scanner' },
        });
        clearTimeout(timeoutId);

        if (response.status === 200) {
          const text = await response.text();
          if (text.includes('Contact:')) {
            return; // Valid security.txt found
          }
        }
      } catch {
        // Continue checking
      }
    }

    // No security.txt found
    findings.push(this.createFinding('missing-security-txt', 'Missing security.txt', 'minor',
      'No security.txt file found at /.well-known/security.txt',
      'Add a security.txt file to help security researchers report vulnerabilities. See https://securitytxt.org/'));
  }

  /**
   * Check SSL/TLS certificate (#24)
   */
  private async checkSslCertificate(hostname: string, timeoutMs: number, findings: SecurityFinding[]): Promise<void> {
    return new Promise<void>((resolve) => {
      const timer = setTimeout(() => {
        resolve();
      }, timeoutMs);

      try {
        const socket = tls.connect({
          host: hostname,
          port: 443,
          servername: hostname,
          rejectUnauthorized: false, // We want to inspect even invalid certs
        }, () => {
          try {
            const cert = socket.getPeerCertificate();
            if (cert && cert.valid_to) {
              const expiryDate = new Date(cert.valid_to);
              const now = new Date();
              const daysUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

              if (daysUntilExpiry < 0) {
                findings.push(this.createFinding('ssl-cert-expired', 'SSL Certificate Expired', 'critical',
                  `SSL certificate expired ${Math.abs(daysUntilExpiry)} days ago (${cert.valid_to})`,
                  'Renew the SSL certificate immediately'));
              } else if (daysUntilExpiry < 7) {
                findings.push(this.createFinding('ssl-cert-expiring', 'SSL Certificate Expiring Soon', 'critical',
                  `SSL certificate expires in ${daysUntilExpiry} days (${cert.valid_to})`,
                  'Renew the SSL certificate immediately'));
              } else if (daysUntilExpiry < 30) {
                findings.push(this.createFinding('ssl-cert-expiring', 'SSL Certificate Expiring Soon', 'serious',
                  `SSL certificate expires in ${daysUntilExpiry} days (${cert.valid_to})`,
                  'Renew the SSL certificate before it expires'));
              }

              // Check if cert is authorized (valid chain)
              if (!socket.authorized) {
                const authError = String(socket.authorizationError || '');
                if (authError && authError !== 'DEPTH_ZERO_SELF_SIGNED_CERT') {
                  findings.push(this.createFinding('ssl-cert-invalid', 'SSL Certificate Issue', 'serious',
                    `SSL certificate validation error: ${authError}`,
                    'Fix the SSL certificate chain or replace with a valid certificate'));
                }
                if (authError === 'DEPTH_ZERO_SELF_SIGNED_CERT') {
                  findings.push(this.createFinding('ssl-cert-self-signed', 'Self-Signed SSL Certificate', 'serious',
                    'Site uses a self-signed SSL certificate',
                    'Replace with a certificate from a trusted Certificate Authority (e.g., Let\'s Encrypt)'));
                }
              }
            }
          } catch {
            // Cert parsing error, skip
          }
          socket.destroy();
          clearTimeout(timer);
          resolve();
        });

        socket.on('error', () => {
          clearTimeout(timer);
          resolve();
        });
      } catch {
        clearTimeout(timer);
        resolve();
      }
    });
  }

  /**
   * Create a standardized finding
   */
  private createFinding(
    ruleId: string,
    ruleName: string,
    severity: Severity,
    message: string,
    recommendation: string,
    selector?: string,
    snippet?: string
  ): SecurityFinding {
    const rule = this.rules.find(r => r.id === ruleId);

    return {
      ruleId,
      ruleName,
      category: 'security',
      severity,
      message,
      description: rule?.description,
      recommendation,
      selector,
      snippet,
      helpUrl: rule?.helpUrl,
    };
  }
}

/**
 * Create a security engine instance
 */
export function createSecurityEngine(): SecurityEngine {
  return new SecurityEngine();
}
