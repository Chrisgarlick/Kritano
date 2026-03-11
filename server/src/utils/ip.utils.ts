import type { Request } from 'express';

/**
 * Private/local IP ranges for SSRF protection
 */
const PRIVATE_IP_PATTERNS = [
  /^127\./,                           // Localhost IPv4
  /^10\./,                            // Class A private
  /^172\.(1[6-9]|2[0-9]|3[01])\./,    // Class B private
  /^192\.168\./,                      // Class C private
  /^0\./,                             // Reserved
  /^169\.254\./,                      // Link-local
  /^224\./,                           // Multicast
  /^240\./,                           // Reserved
  /^::1$/,                            // IPv6 localhost
  /^fe80:/i,                          // IPv6 link-local
  /^fc00:/i,                          // IPv6 unique local
  /^fd00:/i,                          // IPv6 unique local
];

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'localhost.localdomain',
  '0.0.0.0',
  '[::1]',
  'metadata.google.internal',    // GCP metadata
  '169.254.169.254',             // AWS/GCP/Azure metadata
  'metadata.internal',
]);

/**
 * Check if a hostname/IP is private (for SSRF protection).
 * Returns true if the hostname should be blocked.
 */
export function isPrivateIp(hostname: string): boolean {
  const normalized = hostname.toLowerCase().trim();

  // Check blocked hostnames
  if (BLOCKED_HOSTNAMES.has(normalized)) {
    return true;
  }

  // Check IP patterns
  for (const pattern of PRIVATE_IP_PATTERNS) {
    if (pattern.test(normalized)) {
      return true;
    }
  }

  return false;
}

/**
 * Validate a URL for SSRF safety.
 * Returns an error message if unsafe, null if safe.
 */
export function validateUrlForSsrf(urlString: string): string | null {
  let url: URL;
  try {
    url = new URL(urlString.startsWith('http') ? urlString : `https://${urlString}`);
  } catch {
    return 'Invalid URL format';
  }

  // Only allow HTTP/HTTPS
  if (!['http:', 'https:'].includes(url.protocol)) {
    return 'Only HTTP and HTTPS protocols are allowed';
  }

  // Block private/internal IPs
  if (isPrivateIp(url.hostname)) {
    return 'Private or internal URLs are not allowed';
  }

  // Block suspicious ports (only allow 80, 443, or no port)
  const port = url.port;
  if (port && port !== '80' && port !== '443') {
    return 'Non-standard ports are not allowed';
  }

  return null;
}

/**
 * Extract the client IP address from a request.
 * Handles various proxy headers and falls back to socket address.
 *
 * IMPORTANT: In production, ensure your reverse proxy is configured
 * to set these headers correctly and that you trust the proxy.
 */
export function getClientIp(req: Request): string {
  // Check X-Forwarded-For header (set by proxies)
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    // X-Forwarded-For can contain multiple IPs: client, proxy1, proxy2
    // The first one is the original client IP
    const ips = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : forwardedFor.split(',')[0];
    const ip = ips?.trim();
    if (ip && isValidIp(ip)) {
      return ip;
    }
  }

  // Check X-Real-IP header (set by some proxies like nginx)
  const realIp = req.headers['x-real-ip'];
  if (realIp) {
    const ip = Array.isArray(realIp) ? realIp[0] : realIp;
    if (ip && isValidIp(ip)) {
      return ip;
    }
  }

  // Check CF-Connecting-IP header (Cloudflare)
  const cfIp = req.headers['cf-connecting-ip'];
  if (cfIp) {
    const ip = Array.isArray(cfIp) ? cfIp[0] : cfIp;
    if (ip && isValidIp(ip)) {
      return ip;
    }
  }

  // Fall back to socket remote address
  const socketIp = req.socket?.remoteAddress;
  if (socketIp) {
    // Handle IPv4-mapped IPv6 addresses (::ffff:192.168.1.1)
    if (socketIp.startsWith('::ffff:')) {
      return socketIp.substring(7);
    }
    return socketIp;
  }

  // Ultimate fallback
  return '0.0.0.0';
}

/**
 * Basic IP address validation
 */
function isValidIp(ip: string): boolean {
  // IPv4 pattern
  const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Pattern.test(ip)) {
    const parts = ip.split('.').map(Number);
    return parts.every((part) => part >= 0 && part <= 255);
  }

  // IPv6 pattern (simplified)
  const ipv6Pattern = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
  return ipv6Pattern.test(ip);
}

/**
 * Get user agent from request
 */
export function getUserAgent(req: Request): string | undefined {
  return req.headers['user-agent'];
}

/**
 * Extract device info from request
 */
export function getDeviceInfo(req: Request): {
  ipAddress: string;
  userAgent: string | undefined;
  fingerprint: string | undefined;
} {
  return {
    ipAddress: getClientIp(req),
    userAgent: getUserAgent(req),
    fingerprint: undefined, // Can be enhanced with client-side fingerprinting
  };
}
