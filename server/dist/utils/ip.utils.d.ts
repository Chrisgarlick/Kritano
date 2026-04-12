import type { Request } from 'express';
/**
 * Check if a hostname/IP is private (for SSRF protection).
 * Returns true if the hostname should be blocked.
 */
export declare function isPrivateIp(hostname: string): boolean;
/**
 * Validate a URL for SSRF safety.
 * Returns an error message if unsafe, null if safe.
 */
export declare function validateUrlForSsrf(urlString: string): string | null;
/**
 * Extract the client IP address from a request.
 * Handles various proxy headers and falls back to socket address.
 *
 * IMPORTANT: In production, ensure your reverse proxy is configured
 * to set these headers correctly and that you trust the proxy.
 */
export declare function getClientIp(req: Request): string;
/**
 * Get user agent from request
 */
export declare function getUserAgent(req: Request): string | undefined;
/**
 * Extract device info from request
 */
export declare function getDeviceInfo(req: Request): {
    ipAddress: string;
    userAgent: string | undefined;
    fingerprint: string | undefined;
};
//# sourceMappingURL=ip.utils.d.ts.map