/**
 * Create a new webhook for a user
 */
export declare function createWebhook(userId: string, siteId: string | null, url: string, events: string[]): Promise<{
    id: string;
    secret: string;
}>;
/**
 * List all webhooks for a user
 */
export declare function listWebhooks(userId: string): Promise<any[]>;
/**
 * Delete a webhook with ownership check
 */
export declare function deleteWebhook(userId: string, webhookId: string): Promise<void>;
/**
 * List recent deliveries for a webhook (with ownership check)
 */
export declare function listDeliveries(userId: string, webhookId: string, limit?: number): Promise<any[]>;
/**
 * Deliver an event to all matching webhooks (non-blocking)
 */
export declare function deliverEvent(event: string, siteId: string, payload: object): Promise<void>;
//# sourceMappingURL=webhook.service.d.ts.map