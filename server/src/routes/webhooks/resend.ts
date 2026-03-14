/**
 * Resend Webhook Handler
 *
 * Processes email delivery events from Resend (via Svix).
 * Verifies signatures, deduplicates events, updates send statuses and campaign stats.
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import crypto from 'crypto';
import { pool } from '../../db/index.js';
import { incrementCampaignStat } from '../../services/email-campaign.service.js';

const router = Router();

const WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET || '';
const TIMESTAMP_TOLERANCE_S = 300; // 5 minutes

// Status progression — never downgrade
const STATUS_ORDER: Record<string, number> = {
  queued: 0,
  sending: 1,
  sent: 2,
  delivered: 3,
  opened: 4,
  clicked: 5,
  bounced: 3, // same level as delivered (terminal)
  complained: 3,
  failed: 1,
};

// Map Resend event types to email_sends status
const EVENT_TO_STATUS: Record<string, string> = {
  'email.sent': 'sent',
  'email.delivered': 'delivered',
  'email.opened': 'opened',
  'email.clicked': 'clicked',
  'email.bounced': 'bounced',
  'email.complained': 'complained',
};

// Map event types to campaign stat fields
const EVENT_TO_STAT: Record<string, string> = {
  'email.delivered': 'delivered',
  'email.opened': 'opened',
  'email.clicked': 'clicked',
  'email.bounced': 'bounced',
  'email.complained': 'complained',
};

/**
 * Verify Svix webhook signature.
 * Resend uses Svix which sends:
 *   svix-id, svix-timestamp, svix-signature headers
 */
function verifyWebhookSignature(
  payload: Buffer,
  headers: Record<string, string | string[] | undefined>
): boolean {
  if (!WEBHOOK_SECRET) {
    // In dev without a secret, skip verification
    console.warn('RESEND_WEBHOOK_SECRET not set — skipping signature verification');
    return true;
  }

  const msgId = headers['svix-id'] as string;
  const timestamp = headers['svix-timestamp'] as string;
  const signatures = headers['svix-signature'] as string;

  if (!msgId || !timestamp || !signatures) return false;

  // Check timestamp tolerance
  const ts = parseInt(timestamp, 10);
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - ts) > TIMESTAMP_TOLERANCE_S) return false;

  // Construct signed content
  const signedContent = `${msgId}.${timestamp}.${payload.toString('utf8')}`;

  // Svix secret is base64-encoded with "whsec_" prefix
  const secret = WEBHOOK_SECRET.startsWith('whsec_')
    ? Buffer.from(WEBHOOK_SECRET.slice(6), 'base64')
    : Buffer.from(WEBHOOK_SECRET, 'base64');

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(signedContent)
    .digest('base64');

  // Signatures may contain multiple, space-separated values with "v1," prefix
  const sigParts = signatures.split(' ');
  for (const sig of sigParts) {
    const sigValue = sig.startsWith('v1,') ? sig.slice(3) : sig;
    try {
      if (crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(sigValue)
      )) {
        return true;
      }
    } catch {
      // Length mismatch — continue to next signature
    }
  }

  return false;
}

/**
 * POST /api/webhooks/resend
 * Receives email events from Resend.
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    // Verify signature
    const rawBody = req.body as Buffer;
    if (!verifyWebhookSignature(rawBody, req.headers)) {
      res.status(401).json({ error: 'Invalid signature' });
      return;
    }

    const event = JSON.parse(rawBody.toString('utf8'));
    const eventType = event.type as string;
    const eventData = event.data || {};
    const resendEventId = event.event_id || event.id;

    // Only process known event types
    if (!EVENT_TO_STATUS[eventType] && eventType !== 'email.delivery_delayed') {
      res.json({ received: true });
      return;
    }

    // Find the email_send by resend_message_id
    const emailId = eventData.email_id;
    if (!emailId) {
      res.json({ received: true });
      return;
    }

    const sendResult = await pool.query(
      `SELECT id, campaign_id, status FROM email_sends WHERE resend_message_id = $1`,
      [emailId]
    );

    if (sendResult.rows.length === 0) {
      // Unknown send — still return 200 to prevent retries
      res.json({ received: true });
      return;
    }

    const send = sendResult.rows[0];

    // Insert event (dedup via resend_event_id unique constraint)
    try {
      await pool.query(
        `INSERT INTO email_events (email_send_id, campaign_id, event_type, payload, resend_event_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [send.id, send.campaign_id, eventType, JSON.stringify(eventData), resendEventId]
      );
    } catch (err) {
      // Duplicate event — skip processing
      if (err instanceof Error && err.message.includes('duplicate key')) {
        res.json({ received: true, deduplicated: true });
        return;
      }
      throw err;
    }

    // Update email_sends status (never downgrade)
    const newStatus = EVENT_TO_STATUS[eventType];
    if (newStatus) {
      const currentOrder = STATUS_ORDER[send.status] || 0;
      const newOrder = STATUS_ORDER[newStatus] || 0;

      if (newOrder > currentOrder) {
        const timestampField = newStatus === 'opened' ? 'opened_at'
          : newStatus === 'clicked' ? 'clicked_at'
          : null;

        if (timestampField) {
          await pool.query(
            `UPDATE email_sends SET status = $2, ${timestampField} = NOW() WHERE id = $1`,
            [send.id, newStatus]
          );
        } else {
          await pool.query(
            `UPDATE email_sends SET status = $2 WHERE id = $1`,
            [send.id, newStatus]
          );
        }
      }
    }

    // Update campaign stats if this is a campaign send
    if (send.campaign_id && EVENT_TO_STAT[eventType]) {
      const statField = EVENT_TO_STAT[eventType] as 'delivered' | 'opened' | 'clicked' | 'bounced' | 'complained';
      await incrementCampaignStat(send.campaign_id, statField);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Resend webhook error:', error);
    // Return 500 so Resend will retry
    res.status(500).json({ error: 'Internal error' });
  }
});

export { router as resendWebhookRouter };
