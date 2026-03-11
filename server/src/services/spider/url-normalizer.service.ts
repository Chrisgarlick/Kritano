import crypto from 'crypto';
import type { UrlValidation } from '../../types/spider.types';

// File extensions to skip (binary files, documents, etc.)
const SKIP_EXTENSIONS = new Set([
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.zip', '.tar', '.gz', '.rar', '.7z',
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico', '.bmp',
  '.mp3', '.mp4', '.wav', '.avi', '.mov', '.webm',
  '.exe', '.dmg', '.pkg', '.deb', '.rpm',
  '.woff', '.woff2', '.ttf', '.eot',
]);

// Protocols to skip
const SKIP_PROTOCOLS = new Set(['mailto:', 'tel:', 'javascript:', 'data:', 'ftp:']);

// Private/local IP ranges (for SSRF protection)
const PRIVATE_IP_PATTERNS = [
  /^127\./,                     // Localhost
  /^10\./,                      // Class A private
  /^172\.(1[6-9]|2[0-9]|3[01])\./, // Class B private
  /^192\.168\./,                // Class C private
  /^169\.254\./,                // Link-local
  /^0\./,                       // Zero network
  /^fc00:/i,                    // IPv6 unique local
  /^fe80:/i,                    // IPv6 link-local
  /^::1$/,                      // IPv6 localhost
];

export class UrlNormalizerService {
  private targetDomain: string;
  private includeSubdomains: boolean;

  constructor(targetDomain: string, includeSubdomains: boolean = false) {
    this.targetDomain = this.extractDomain(targetDomain);
    this.includeSubdomains = includeSubdomains;
  }

  /**
   * Normalize a URL for consistent comparison and storage
   */
  normalize(urlString: string, baseUrl?: string): UrlValidation {
    try {
      // Handle relative URLs
      let url: URL;
      if (baseUrl) {
        url = new URL(urlString, baseUrl);
      } else {
        url = new URL(urlString);
      }

      // Check protocol
      if (!['http:', 'https:'].includes(url.protocol)) {
        return { isValid: false, normalizedUrl: null, error: 'Invalid protocol' };
      }

      // SSRF protection: check for private IPs
      if (this.isPrivateIp(url.hostname)) {
        return { isValid: false, normalizedUrl: null, error: 'Private IP not allowed' };
      }

      // Normalize the URL
      const normalized = this.normalizeUrl(url);

      // Check if in scope
      const isInScope = this.isInScope(url);

      return {
        isValid: true,
        normalizedUrl: normalized,
        isInScope,
      };
    } catch {
      return { isValid: false, normalizedUrl: null, error: 'Invalid URL format' };
    }
  }

  /**
   * Check if a URL should be skipped (non-HTML resources)
   */
  shouldSkip(urlString: string): { skip: boolean; reason?: string } {
    try {
      const url = new URL(urlString);

      // Check for skip protocols
      for (const protocol of SKIP_PROTOCOLS) {
        if (url.href.toLowerCase().startsWith(protocol)) {
          return { skip: true, reason: `Skip protocol: ${protocol}` };
        }
      }

      // Check file extension
      const pathname = url.pathname.toLowerCase();
      for (const ext of SKIP_EXTENSIONS) {
        if (pathname.endsWith(ext)) {
          return { skip: true, reason: `Skip extension: ${ext}` };
        }
      }

      // Skip common non-page paths
      if (pathname.startsWith('/cdn-cgi/')) {
        return { skip: true, reason: 'CDN path' };
      }

      return { skip: false };
    } catch {
      return { skip: true, reason: 'Invalid URL' };
    }
  }

  /**
   * Generate a hash for URL deduplication
   */
  hashUrl(normalizedUrl: string): string {
    return crypto.createHash('sha256').update(normalizedUrl).digest('hex');
  }

  /**
   * Check if URL is within crawl scope
   */
  isInScope(url: URL | string): boolean {
    try {
      const urlObj = typeof url === 'string' ? new URL(url) : url;
      const domain = this.extractDomain(urlObj.hostname);

      if (this.includeSubdomains) {
        // Check if it's the target domain or a subdomain
        return domain === this.targetDomain ||
               domain.endsWith('.' + this.targetDomain);
      } else {
        // Exact domain match only
        return domain === this.targetDomain;
      }
    } catch {
      return false;
    }
  }

  /**
   * Get the target domain
   */
  getTargetDomain(): string {
    return this.targetDomain;
  }

  /**
   * Resolve a relative URL against a base URL
   */
  resolveUrl(href: string, baseUrl: string): string | null {
    try {
      const resolved = new URL(href, baseUrl);
      return resolved.href;
    } catch {
      return null;
    }
  }

  /**
   * Extract clean domain from hostname (removes www.)
   */
  private extractDomain(hostname: string): string {
    // Remove protocol if present
    let domain = hostname.replace(/^https?:\/\//, '');

    // Remove path if present
    domain = domain.split('/')[0];

    // Remove www. prefix
    domain = domain.replace(/^www\./, '');

    // Remove port if present
    domain = domain.split(':')[0];

    return domain.toLowerCase();
  }

  /**
   * Normalize URL for consistent comparison
   */
  private normalizeUrl(url: URL): string {
    // Lowercase hostname
    const hostname = url.hostname.toLowerCase();

    // Remove default ports
    let port = url.port;
    if ((url.protocol === 'http:' && port === '80') ||
        (url.protocol === 'https:' && port === '443')) {
      port = '';
    }

    // Normalize path
    let path = url.pathname;

    // Remove trailing slash from path (except for root)
    if (path !== '/' && path.endsWith('/')) {
      path = path.slice(0, -1);
    }

    // Remove common index files
    path = path.replace(/\/(index|default)\.(html?|php|asp|aspx|jsp)$/i, '/');

    // Decode and re-encode path for consistency
    try {
      path = encodeURI(decodeURI(path));
    } catch {
      // Keep original if decoding fails
    }

    // Sort query parameters for consistency
    const params = new URLSearchParams(url.search);
    const sortedParams = new URLSearchParams([...params.entries()].sort());
    const search = sortedParams.toString() ? '?' + sortedParams.toString() : '';

    // Remove fragment (anchor)
    // Fragments are client-side only and shouldn't affect crawling

    // Reconstruct URL
    const portPart = port ? ':' + port : '';
    return `${url.protocol}//${hostname}${portPart}${path}${search}`;
  }

  /**
   * Check if hostname is a private/local IP (SSRF protection)
   */
  private isPrivateIp(hostname: string): boolean {
    // Check for localhost
    if (hostname === 'localhost' || hostname === 'localhost.localdomain') {
      return true;
    }

    // Check IP patterns
    for (const pattern of PRIVATE_IP_PATTERNS) {
      if (pattern.test(hostname)) {
        return true;
      }
    }

    return false;
  }
}

/**
 * Create a URL normalizer for a specific target
 */
export function createUrlNormalizer(targetUrl: string, includeSubdomains: boolean = false): UrlNormalizerService {
  return new UrlNormalizerService(targetUrl, includeSubdomains);
}
