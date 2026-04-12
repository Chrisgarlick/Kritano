/**
 * Event Tracking Service
 *
 * Minimal fire-and-forget event tracking for product analytics.
 * Inserts into analytics_events table — never throws on failure.
 */
import { Pool } from 'pg';
export declare function setPool(dbPool: Pool): void;
/**
 * Track a product event. Fire-and-forget — never throws.
 */
export declare function trackEvent(userId: string | null, eventName: string, properties?: Record<string, unknown>): Promise<void>;
/**
 * Get the count of a specific event since a given date.
 */
export declare function getEventCounts(eventName: string, since: Date): Promise<number>;
//# sourceMappingURL=event-tracking.service.d.ts.map