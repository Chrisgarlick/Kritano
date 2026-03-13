/**
 * Billing Routes
 *
 * Subscription management, Stripe checkout/portal, usage, early access, and coming soon.
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { pool } from '../../db/index.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { getUserTierLimits, getUserSiteUsage } from '../../services/site.service.js';
import { startTrial } from '../../services/trial.service.js';
import { createCheckoutSession, createPortalSession } from '../../services/stripe.service.js';
import { getEarlyAccessStatus as getEAStatus } from '../../services/early-access.service.js';
import { getSetting, isComingSoonEnabled } from '../../services/system-settings.service.js';

const router = Router();

// =============================================
// User subscription routes (authenticated)
// =============================================

router.get('/subscription', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const tierLimits = await getUserTierLimits(userId);
    const usage = await getUserSiteUsage(userId);

    const subResult = await pool.query(
      `SELECT id, user_id, tier, status, trial_start, trial_end, stripe_customer_id, created_at, updated_at
       FROM subscriptions
       WHERE user_id = $1 AND status IN ('active', 'trialing', 'past_due')
       ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );
    const sub = subResult.rows[0];

    let daysRemaining: number | null = null;
    if (sub?.status === 'trialing' && sub.trial_end) {
      daysRemaining = Math.max(0, Math.ceil((new Date(sub.trial_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
    }

    const userResult = await pool.query(
      `SELECT has_used_trial FROM users WHERE id = $1`,
      [userId]
    );
    const hasUsedTrial = userResult.rows[0]?.has_used_trial || false;

    res.json({
      subscription: {
        tier: (tierLimits?.tier as string) || 'free',
        status: sub?.status || 'active',
        trialStart: sub?.trial_start || null,
        trialEnd: sub?.trial_end || null,
        daysRemaining,
        hasUsedTrial,
        stripeCustomerId: !!sub?.stripe_customer_id,
      },
      limits: {
        tier: (tierLimits?.tier as string) || 'free',
        maxSites: usage.maxSites,
        maxPagesPerAudit: (tierLimits?.max_pages_per_audit as number) || 100,
        maxAuditDepth: (tierLimits?.max_audit_depth as number) || 5,
        concurrentAudits: (tierLimits?.concurrent_audits as number) || 3,
        availableChecks: (tierLimits?.available_checks as string[]) || ['seo', 'accessibility', 'security', 'performance', 'content'],
      },
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ error: 'Failed to get subscription' });
  }
});

router.post('/subscription/start-trial', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { tier } = req.body;

    if (!['starter', 'pro', 'agency'].includes(tier)) {
      res.status(400).json({ error: 'Invalid tier. Must be starter, pro, or agency.' });
      return;
    }

    const userResult = await pool.query(
      `SELECT email_verified FROM users WHERE id = $1`,
      [userId]
    );
    if (!userResult.rows[0]?.email_verified) {
      res.status(403).json({ error: 'Please verify your email before starting a trial.' });
      return;
    }

    const result = await startTrial(userId, tier);

    const subResult = await pool.query(
      `SELECT id, user_id, tier, status, trial_start, trial_end FROM subscriptions WHERE id = $1`,
      [result.subscriptionId]
    );
    const sub = subResult.rows[0];
    const daysRemaining = Math.max(0, Math.ceil((new Date(sub.trial_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

    res.json({
      subscription: {
        tier: sub.tier,
        status: sub.status,
        trialStart: sub.trial_start,
        trialEnd: sub.trial_end,
        daysRemaining,
      },
    });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    console.error('Start trial error:', error.message);
    res.status(statusCode).json({ error: error.message || 'Failed to start trial' });
  }
});

router.post('/subscription/checkout', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { tier } = req.body;

    if (!['starter', 'pro', 'agency', 'enterprise'].includes(tier)) {
      res.status(400).json({ error: 'Invalid tier. Must be starter, pro, agency, or enterprise.' });
      return;
    }

    const subResult = await pool.query(
      `SELECT stripe_customer_id FROM subscriptions
       WHERE user_id = $1 AND status IN ('active', 'trialing', 'past_due')
       ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );

    const userResult = await pool.query(
      `SELECT email, discount_percent FROM users WHERE id = $1`,
      [userId]
    );
    const user = userResult.rows[0];
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const session = await createCheckoutSession({
      userId,
      tier,
      customerId: subResult.rows[0]?.stripe_customer_id || undefined,
      customerEmail: user.email,
      discountPercent: user.discount_percent || 0,
      successUrl: `${appUrl}/settings/profile?checkout=success`,
      cancelUrl: `${appUrl}/settings/profile?checkout=canceled`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Create checkout session error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

router.post('/subscription/portal', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const subResult = await pool.query(
      `SELECT stripe_customer_id FROM subscriptions
       WHERE user_id = $1 AND stripe_customer_id IS NOT NULL
       ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );

    if (!subResult.rows[0]?.stripe_customer_id) {
      res.status(400).json({ error: 'No billing account found. Please subscribe first.' });
      return;
    }

    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const session = await createPortalSession(
      subResult.rows[0].stripe_customer_id,
      `${appUrl}/settings/profile`
    );

    res.json({ url: session.url });
  } catch (error) {
    console.error('Create portal session error:', error);
    res.status(500).json({ error: 'Failed to create portal session' });
  }
});

router.get('/usage', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const usage = await getUserSiteUsage(userId);
    const tierLimits = await getUserTierLimits(userId);

    res.json({
      usage: {
        sites: usage.sites,
        maxSites: usage.maxSites,
        canAddMore: usage.canAddMore,
      },
      limits: {
        tier: (tierLimits?.tier as string) || 'free',
        maxSites: usage.maxSites,
        maxPagesPerAudit: (tierLimits?.max_pages_per_audit as number) || 100,
        maxAuditDepth: (tierLimits?.max_audit_depth as number) || 5,
        concurrentAudits: (tierLimits?.concurrent_audits as number) || 3,
      },
    });
  } catch (error) {
    console.error('Get usage error:', error);
    res.status(500).json({ error: 'Failed to get usage' });
  }
});

// =============================================
// Early Access Status (public, no auth)
// =============================================

router.get('/early-access/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const status = await getEAStatus();
    res.json({
      enabled: status.enabled,
      spotsRemaining: status.remaining,
      maxSpots: status.maxSpots,
      isFull: status.remaining <= 0,
    });
  } catch (error) {
    console.error('Early access status error:', error);
    res.json({ enabled: false, spotsRemaining: 0, maxSpots: 0, isFull: true });
  }
});

// =============================================
// Coming Soon (public, no auth)
// =============================================

router.get('/coming-soon/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const enabled = await isComingSoonEnabled();
    const headline = await getSetting('coming_soon_headline');
    const description = await getSetting('coming_soon_description');
    res.json({
      enabled,
      headline: headline || 'Something great is on its way.',
      description: description || '',
    });
  } catch (error) {
    console.error('Coming soon status error:', error);
    res.json({ enabled: false, headline: '', description: '' });
  }
});

const signupAttempts = new Map<string, { count: number; resetAt: number }>();

router.post('/coming-soon/signup', async (req: Request, res: Response): Promise<void> => {
  try {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const entry = signupAttempts.get(ip);
    if (entry && entry.resetAt > now) {
      if (entry.count >= 5) {
        res.status(429).json({ error: 'Too many signup attempts. Please try again later.' });
        return;
      }
      entry.count++;
    } else {
      signupAttempts.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 });
    }

    const schema = z.object({
      email: z.string().email().max(255),
      name: z.string().max(200).optional(),
    });
    const { email, name } = schema.parse(req.body);

    await pool.query(
      `INSERT INTO coming_soon_signups (email, name, ip_address)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO NOTHING`,
      [email, name || null, ip]
    );

    res.json({ success: true, message: "Thanks! We'll let you know when we launch." });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Please provide a valid email address.' });
      return;
    }
    console.error('Coming soon signup error:', error);
    res.status(500).json({ error: 'Failed to sign up' });
  }
});

export const billingRouter = router;
