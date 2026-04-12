/**
 * Resend Webhook Handler
 *
 * Processes email delivery events from Resend (via Svix).
 * Verifies signatures, deduplicates events, updates send statuses and campaign stats.
 */
declare const router: import("express-serve-static-core").Router;
export { router as resendWebhookRouter };
//# sourceMappingURL=resend.d.ts.map