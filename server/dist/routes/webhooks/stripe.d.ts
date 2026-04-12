/**
 * Stripe Webhook Handler
 *
 * Processes subscription lifecycle events from Stripe.
 * Signature-verified, returns 200 to Stripe even on app errors.
 */
import { Router } from 'express';
import type { Pool } from 'pg';
export declare function initializeStripeWebhooks(pool: Pool): Router;
//# sourceMappingURL=stripe.d.ts.map