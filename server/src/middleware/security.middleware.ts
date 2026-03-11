import helmet from 'helmet';
import type { Express } from 'express';

/**
 * Configure security headers using Helmet.js
 * This provides protection against common web vulnerabilities.
 */
export function configureSecurityMiddleware(app: Express): void {
  app.use(
    helmet({
      // Content Security Policy - strict policy for API server
      // This server only serves JSON responses, not HTML with styles
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'none'"],           // Block everything by default
          scriptSrc: ["'none'"],            // No scripts
          styleSrc: ["'none'"],             // No styles (API-only, no 'unsafe-inline')
          imgSrc: ["'none'"],               // No images
          connectSrc: ["'self'"],           // Allow API calls to self
          fontSrc: ["'none'"],              // No fonts
          objectSrc: ["'none'"],            // No plugins
          mediaSrc: ["'none'"],             // No media
          frameSrc: ["'none'"],             // No frames
          frameAncestors: ["'none'"],       // Can't be embedded
          formAction: ["'self'"],           // Forms submit to self only
          upgradeInsecureRequests: [],
        },
      },

      // Cross-Origin policies
      crossOriginEmbedderPolicy: false, // Disable for API compatibility
      crossOriginOpenerPolicy: { policy: 'same-origin' },
      crossOriginResourcePolicy: { policy: 'same-origin' },

      // DNS Prefetch Control
      dnsPrefetchControl: { allow: false },

      // Frameguard - prevent clickjacking
      frameguard: { action: 'deny' },

      // HTTP Strict Transport Security
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },

      // IE No Open
      ieNoOpen: true,

      // No Sniff - prevent MIME type sniffing
      noSniff: true,

      // Origin Agent Cluster
      originAgentCluster: true,

      // Permitted Cross-Domain Policies
      permittedCrossDomainPolicies: { permittedPolicies: 'none' },

      // Referrer Policy
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },

      // XSS Filter (legacy, but doesn't hurt)
      xssFilter: true,
    })
  );

  // Remove X-Powered-By header
  app.disable('x-powered-by');
}
