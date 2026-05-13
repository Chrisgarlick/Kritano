/**
 * Gated Resources API routes.
 *
 *   POST /api/resources/:slug/request
 *     Anonymous email capture or logged-in user. Returns a download token
 *     scoped to the resource. Honeypot + rate-limited + disposable-email
 *     blocked. The download links are also emailed to the user (TODO: wire
 *     in milestone 6).
 *
 *   GET /api/resources/:slug/download/:format
 *     Streams the requested format. Accepts either a session cookie or
 *     `?token=...`. Records the download in `gated_resource_downloads`.
 *     Returns 503 for typeset-backed formats while typeset is disabled.
 *
 * See /docs/gated-resources.md for the feature plan.
 */
/**
 * Fire-and-forget delivery email. Failures are logged but never block the
 * download path: the user already has the token and the on-page download
 * works without the email landing.
 */
export declare function sendDeliveryEmail(input: {
    email: string;
    resource: {
        slug: string;
        title: string;
        formats: string[];
    };
    token: string;
    userId?: string;
}): void;
export declare const resourcesRouter: import("express-serve-static-core").Router;
//# sourceMappingURL=index.d.ts.map