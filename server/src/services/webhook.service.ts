import { Pool } from 'pg';
import crypto from 'crypto';
import { pool } from '../db/index.js';

const SUPPORTED_EVENTS = ['audit.completed', 'audit.failed'];
const MAX_RETRIES = 3;
const DELIVERY_TIMEOUT_MS = 5000;

/**
 * Create a new webhook for a user
 */
export async function createWebhook(
  userId: string,
  siteId: string | null,
  url: string,
  events: string[]
): Promise<{ id: string; secret: string }> {
  // Validate URL
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw Object.assign(new Error('Invalid webhook URL'), { statusCode: 400 });
  }

  if (!['https:', 'http:'].includes(parsed.protocol)) {
    throw Object.assign(new Error('Webhook URL must use HTTP or HTTPS'), { statusCode: 400 });
  }

  // Validate events
  const invalidEvents = events.filter((e) => !SUPPORTED_EVENTS.includes(e));
  if (invalidEvents.length > 0) {
    throw Object.assign(
      new Error(`Unsupported events: ${invalidEvents.join(', ')}. Supported: ${SUPPORTED_EVENTS.join(', ')}`),
      { statusCode: 400 }
    );
  }

  if (events.length === 0) {
    throw Object.assign(new Error('At least one event is required'), { statusCode: 400 });
  }

  // If siteId is provided, verify ownership
  if (siteId) {
    const siteCheck = await pool.query(
      `SELECT id FROM sites WHERE id = $1 AND user_id = $2`,
      [siteId, userId]
    );
    if (siteCheck.rows.length === 0) {
      throw Object.assign(new Error('Site not found or not owned by user'), { statusCode: 404 });
    }
  }

  // Generate a cryptographically secure secret
  const secret = crypto.randomBytes(32).toString('hex');

  const result = await pool.query(
    `INSERT INTO webhooks (user_id, site_id, url, events, secret)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [userId, siteId, url, events, secret]
  );

  return { id: result.rows[0].id, secret };
}

/**
 * List all webhooks for a user
 */
export async function listWebhooks(userId: string) {
  const result = await pool.query(
    `SELECT id, site_id, url, events, is_active, created_at, updated_at
     FROM webhooks
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );
  return result.rows;
}

/**
 * Delete a webhook with ownership check
 */
export async function deleteWebhook(userId: string, webhookId: string): Promise<void> {
  const result = await pool.query(
    `DELETE FROM webhooks WHERE id = $1 AND user_id = $2 RETURNING id`,
    [webhookId, userId]
  );

  if (result.rows.length === 0) {
    throw Object.assign(new Error('Webhook not found'), { statusCode: 404 });
  }
}

/**
 * List recent deliveries for a webhook (with ownership check)
 */
export async function listDeliveries(userId: string, webhookId: string, limit = 20) {
  // Ownership check
  const ownerCheck = await pool.query(
    `SELECT id FROM webhooks WHERE id = $1 AND user_id = $2`,
    [webhookId, userId]
  );
  if (ownerCheck.rows.length === 0) {
    throw Object.assign(new Error('Webhook not found'), { statusCode: 404 });
  }

  const result = await pool.query(
    `SELECT id, event, payload, response_status, response_body, attempts, delivered_at, created_at
     FROM webhook_deliveries
     WHERE webhook_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [webhookId, Math.min(limit, 100)]
  );
  return result.rows;
}

/**
 * Sign a payload with HMAC-SHA256
 */
function signPayload(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

/**
 * Deliver an event to all matching webhooks (non-blocking)
 */
export async function deliverEvent(
  event: string,
  siteId: string,
  payload: object
): Promise<void> {
  try {
    // Find all active webhooks that match this event and site
    const result = await pool.query(
      `SELECT id, url, secret
       FROM webhooks
       WHERE is_active = true
         AND $1 = ANY(events)
         AND (site_id IS NULL OR site_id = $2)
         AND user_id IN (
           SELECT user_id FROM sites WHERE id = $2
           UNION
           SELECT user_id FROM site_shares WHERE site_id = $2
         )`,
      [event, siteId]
    );

    for (const webhook of result.rows) {
      // Fire and forget — each delivery runs independently
      deliverToWebhook(webhook.id, webhook.url, webhook.secret, event, payload).catch((err) => {
        console.error(`Webhook delivery error for ${webhook.id}:`, err.message);
      });
    }
  } catch (error) {
    console.error('deliverEvent error:', error);
  }
}

/**
 * Deliver payload to a single webhook with retries and exponential backoff
 */
async function deliverToWebhook(
  webhookId: string,
  url: string,
  secret: string,
  event: string,
  payload: object
): Promise<void> {
  const body = JSON.stringify(payload);
  const signature = signPayload(body, secret);

  // Create delivery record
  const deliveryResult = await pool.query(
    `INSERT INTO webhook_deliveries (webhook_id, event, payload)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [webhookId, event, payload]
  );
  const deliveryId = deliveryResult.rows[0].id;

  let lastStatus: number | null = null;
  let lastBody: string | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), DELIVERY_TIMEOUT_MS);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Kritano-Signature': signature,
          'X-Kritano-Event': event,
        },
        body,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      lastStatus = response.status;
      lastBody = await response.text().catch(() => '');

      // Update delivery record
      await pool.query(
        `UPDATE webhook_deliveries
         SET response_status = $1, response_body = $2, attempts = $3, delivered_at = NOW()
         WHERE id = $4`,
        [lastStatus, (lastBody || '').substring(0, 2000), attempt, deliveryId]
      );

      // 2xx = success, stop retrying
      if (response.ok) {
        return;
      }

      // 4xx client errors (except 429) — don't retry
      if (lastStatus >= 400 && lastStatus < 500 && lastStatus !== 429) {
        return;
      }
    } catch (err: any) {
      lastBody = err.message || 'Request failed';

      await pool.query(
        `UPDATE webhook_deliveries
         SET response_body = $1, attempts = $2
         WHERE id = $3`,
        [(lastBody || '').substring(0, 2000), attempt, deliveryId]
      );
    }

    // Exponential backoff before next retry
    if (attempt < MAX_RETRIES) {
      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
}
