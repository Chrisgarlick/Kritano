import { describe, it, expect, vi, beforeEach } from 'vitest';
import supertest from 'supertest';
import express from 'express';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockPool = {
  query: vi.fn().mockResolvedValue({ rows: [] }),
};

const mockConstructWebhookEvent = vi.fn();
const mockGetTierForPriceId = vi.fn();

vi.mock('../services/stripe.service.js', () => ({
  constructWebhookEvent: (...args: unknown[]) => mockConstructWebhookEvent(...args),
  getTierForPriceId: (...args: unknown[]) => mockGetTierForPriceId(...args),
}));

vi.mock('../services/email.service.js', () => ({
  emailService: {
    sendPaymentFailedEmail: vi.fn().mockResolvedValue(undefined),
    sendSubscriptionCancelledEmail: vi.fn().mockResolvedValue(undefined),
  },
}));

import { initializeStripeWebhooks } from '../routes/webhooks/stripe.js';

function createApp() {
  const app = express();
  // Stripe webhooks need raw body
  app.use('/webhooks/stripe', express.raw({ type: 'application/json' }));
  app.use('/webhooks/stripe', initializeStripeWebhooks(mockPool as never));
  return app;
}

describe('Stripe Webhook Handler', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createApp();
  });

  describe('Signature verification', () => {
    it('rejects requests without stripe-signature header', async () => {
      const res = await supertest(app)
        .post('/webhooks/stripe')
        .set('Content-Type', 'application/json')
        .send('{}');

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Missing stripe-signature header');
    });

    it('rejects requests with invalid signature', async () => {
      mockConstructWebhookEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      const res = await supertest(app)
        .post('/webhooks/stripe')
        .set('Content-Type', 'application/json')
        .set('stripe-signature', 'invalid_sig')
        .send('{}');

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid signature');
    });
  });

  describe('checkout.session.completed', () => {
    it('links Stripe customer to user subscription', async () => {
      mockConstructWebhookEvent.mockReturnValue({
        type: 'checkout.session.completed',
        data: {
          object: {
            metadata: { user_id: 'user-123' },
            customer: 'cus_abc',
            subscription: 'sub_xyz',
          },
        },
      });

      const res = await supertest(app)
        .post('/webhooks/stripe')
        .set('Content-Type', 'application/json')
        .set('stripe-signature', 'valid_sig')
        .send('{}');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ received: true });
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE subscriptions'),
        ['cus_abc', 'sub_xyz', 'user-123']
      );
    });

    it('skips when no user_id in metadata', async () => {
      mockConstructWebhookEvent.mockReturnValue({
        type: 'checkout.session.completed',
        data: { object: { metadata: {}, customer: 'cus_abc', subscription: 'sub_xyz' } },
      });

      const res = await supertest(app)
        .post('/webhooks/stripe')
        .set('Content-Type', 'application/json')
        .set('stripe-signature', 'valid_sig')
        .send('{}');

      expect(res.status).toBe(200);
      expect(mockPool.query).not.toHaveBeenCalled();
    });
  });

  describe('customer.subscription.updated', () => {
    it('syncs tier and status from subscription', async () => {
      mockGetTierForPriceId.mockReturnValue('pro');
      mockConstructWebhookEvent.mockReturnValue({
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_xyz',
            customer: 'cus_abc',
            metadata: { user_id: 'user-123' },
            items: { data: [{ price: { id: 'price_pro_monthly' } }] },
            status: 'active',
            current_period_start: 1700000000,
            current_period_end: 1702592000,
            cancel_at_period_end: false,
          },
        },
      });

      const res = await supertest(app)
        .post('/webhooks/stripe')
        .set('Content-Type', 'application/json')
        .set('stripe-signature', 'valid_sig')
        .send('{}');

      expect(res.status).toBe(200);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE subscriptions'),
        expect.arrayContaining(['sub_xyz', 'cus_abc', 'active'])
      );
    });
  });

  describe('customer.subscription.deleted', () => {
    it('downgrades user to free tier', async () => {
      mockConstructWebhookEvent.mockReturnValue({
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: 'sub_xyz',
            metadata: { user_id: 'user-123' },
          },
        },
      });

      const res = await supertest(app)
        .post('/webhooks/stripe')
        .set('Content-Type', 'application/json')
        .set('stripe-signature', 'valid_sig')
        .send('{}');

      expect(res.status).toBe(200);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("tier = 'free'"),
        ['user-123', 'sub_xyz']
      );
    });
  });

  describe('invoice.payment_failed', () => {
    it('sets subscription to past_due', async () => {
      mockConstructWebhookEvent.mockReturnValue({
        type: 'invoice.payment_failed',
        data: {
          object: {
            subscription: 'sub_xyz',
          },
        },
      });

      const res = await supertest(app)
        .post('/webhooks/stripe')
        .set('Content-Type', 'application/json')
        .set('stripe-signature', 'valid_sig')
        .send('{}');

      expect(res.status).toBe(200);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('past_due'),
        expect.arrayContaining(['sub_xyz'])
      );
    });
  });

  describe('Unhandled event types', () => {
    it('acknowledges unknown events gracefully', async () => {
      mockConstructWebhookEvent.mockReturnValue({
        type: 'some.unknown.event',
        data: { object: {} },
      });

      const res = await supertest(app)
        .post('/webhooks/stripe')
        .set('Content-Type', 'application/json')
        .set('stripe-signature', 'valid_sig')
        .send('{}');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ received: true });
      expect(mockPool.query).not.toHaveBeenCalled();
    });
  });

  describe('Error resilience', () => {
    it('returns 200 even when handler throws to prevent Stripe retries', async () => {
      mockConstructWebhookEvent.mockReturnValue({
        type: 'checkout.session.completed',
        data: {
          object: {
            metadata: { user_id: 'user-123' },
            customer: 'cus_abc',
            subscription: 'sub_xyz',
          },
        },
      });
      mockPool.query.mockRejectedValueOnce(new Error('DB connection lost'));

      const res = await supertest(app)
        .post('/webhooks/stripe')
        .set('Content-Type', 'application/json')
        .set('stripe-signature', 'valid_sig')
        .send('{}');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ received: true });
    });
  });
});
