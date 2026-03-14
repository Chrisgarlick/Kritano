import { Router } from 'express';
import type { Request, Response } from 'express';
import { Pool } from 'pg';
import { authRouter } from './auth/index.js';
import { auditsRouter, setPool as setAuditsPool } from './audits/index.js';
import { apiKeysRouter } from './api-keys/index.js';
import { v1Router, setPool as setV1Pool } from './v1/index.js';
import { docsRouter } from './docs/index.js';
import { adminRouter } from './admin/index.js';
import bugReportsRouter from './bug-reports/index.js';
import featureRequestsRouter from './feature-requests/index.js';
import { organizationsRouter } from './organizations/index.js';
import sitesRouter from './sites/index.js';
import siteInvitationsRouter from './site-invitations/index.js';
import analyticsRouter, { setPool as setAnalyticsPool } from './analytics/index.js';
import emailRouter from './email/index.js';
import { blogRouter } from './blog.js';
import { referralsRouter } from './referrals/index.js';
import { cookieConsentRouter } from './consent/cookie-consent.js';
import { seoRouter } from './seo.js';
import { setPool as setSiteServicePool, getUserTierLimits, getUserSiteUsage } from '../services/site.service.js';
import { startTrial } from '../services/trial.service.js';
import { pool } from '../db/index.js';
import { setPool as setSiteSharingServicePool } from '../services/site-sharing.service.js';
import { setPool as setSiteMiddlewarePool } from '../middleware/site.middleware.js';
import { setPool as setDomainVerificationPool } from '../services/domain-verification.service.js';
import { setPool as setConsentServicePool } from '../services/consent.service.js';
import { setPool as setOrganizationServicePool } from '../services/organization.service.js';
import { setPool as setDomainServicePool } from '../services/domain.service.js';
import { setPool as setReferralServicePool } from '../services/referral.service.js';
import { setPool as setSystemSettingsPool, getSetting, isComingSoonEnabled } from '../services/system-settings.service.js';
import { getEarlyAccessStatus as getEAStatus } from '../services/early-access.service.js';
import { setPool as setSeoServicePool } from '../services/seo.service.js';
import { initializeAdminMiddleware } from '../middleware/admin.middleware.js';
import { initializeAdminService } from '../services/admin.service.js';
import { initializeAdminAnalyticsService } from '../services/admin-analytics.service.js';
import { setPool as setScheduleServicePool } from '../services/schedule.service.js';
import { setPool as setNrdFeedPool } from '../services/cold-prospect/nrd-feed.service.js';
import { setPool as setColdProspectAdminPool } from '../services/cold-prospect/cold-prospect-admin.service.js';
import { setPool as setDomainCheckerPool } from '../services/cold-prospect/domain-checker.service.js';
import { setPool as setEmailExtractorPool } from '../services/cold-prospect/email-extractor.service.js';
import {
  setPool as setOutreachServicePool,
  verifyUnsubscribeToken,
  processUnsubscribe,
} from '../services/cold-prospect/outreach.service.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { createCheckoutSession, createPortalSession } from '../services/stripe.service.js';
import { z } from 'zod';
import {
  getActiveAnnouncements,
  dismissAnnouncement,
  getPublishedSuccessStories,
} from '../services/cms.service.js';

const router = Router();

// Auth routes
router.use('/auth', authRouter);

// Sites routes (user-centric, no org prefix)
router.use('/sites', sitesRouter);

// Site invitations (public token-based)
router.use('/site-invitations', siteInvitationsRouter);

// Audits routes
router.use('/audits', auditsRouter);

// Analytics routes
router.use('/analytics', analyticsRouter);

// API key management routes
router.use('/api-keys', apiKeysRouter);

// Public API v1 routes (API key authenticated)
router.use('/v1', v1Router);

// API documentation
router.use('/docs', docsRouter);

// Super admin routes
router.use('/admin', adminRouter);

// Organizations
router.use('/organizations', organizationsRouter);

// Bug reports (user-facing)
router.use('/bug-reports', bugReportsRouter);

// Feature requests (user-facing)
router.use('/feature-requests', featureRequestsRouter);

// Public email routes (unsubscribe, preferences)
router.use('/email', emailRouter);

// Public blog routes (no auth)
router.use('/blog', blogRouter);

// Referrals (authenticated)
router.use('/referrals', referralsRouter);

// Cookie consent (public, no auth)
router.use('/consent/cookies', cookieConsentRouter);

// Public SEO entries (no auth, cached)
router.use('/seo', seoRouter);

// Public success stories (no auth)
router.get('/public/success-stories', async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 6, 20);
    const stories = await getPublishedSuccessStories(limit);
    res.json({ stories });
  } catch (error) {
    console.error('Public success stories error:', error);
    res.status(500).json({ error: 'Failed to load success stories' });
  }
});

// User-facing announcements (authenticated)
router.get('/announcements/active', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    // Get user tier from their subscription
    const tierResult = await getUserTierLimits(userId);
    const tier = (tierResult?.tier as string) || 'free';
    const announcements = await getActiveAnnouncements(tier, userId);
    res.json({ announcements });
  } catch (error) {
    console.error('Active announcements error:', error);
    res.status(500).json({ error: 'Failed to load announcements' });
  }
});

router.post('/announcements/:id/dismiss', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    await dismissAnnouncement(req.params.id, userId);
    res.json({ success: true });
  } catch (error) {
    console.error('Dismiss announcement error:', error);
    res.status(500).json({ error: 'Failed to dismiss announcement' });
  }
});

// User subscription routes
router.get('/subscription', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const tierLimits = await getUserTierLimits(userId);
    const usage = await getUserSiteUsage(userId);

    // Get actual subscription from DB
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

    // Check if user has used trial
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

// Start free trial
router.post('/subscription/start-trial', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { tier } = req.body;

    // Validate tier
    if (!['starter', 'pro', 'agency'].includes(tier)) {
      res.status(400).json({ error: 'Invalid tier. Must be starter, pro, or agency.' });
      return;
    }

    // Require verified email
    const userResult = await pool.query(
      `SELECT email_verified FROM users WHERE id = $1`,
      [userId]
    );
    if (!userResult.rows[0]?.email_verified) {
      res.status(403).json({ error: 'Please verify your email before starting a trial.' });
      return;
    }

    const result = await startTrial(userId, tier);

    // Reload subscription data to return
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

// Stripe checkout — create a Checkout Session for a paid tier
router.post('/subscription/checkout', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { tier } = req.body;

    // Validate tier
    if (!['starter', 'pro', 'agency', 'enterprise'].includes(tier)) {
      res.status(400).json({ error: 'Invalid tier. Must be starter, pro, agency, or enterprise.' });
      return;
    }

    // Get user's current subscription (for existing stripe_customer_id)
    const subResult = await pool.query(
      `SELECT stripe_customer_id FROM subscriptions
       WHERE user_id = $1 AND status IN ('active', 'trialing', 'past_due')
       ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );

    // Get user's discount_percent (early access founding members)
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

// Stripe portal — manage existing subscription
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
// Cold prospect unsubscribe (public, no auth)
// =============================================

router.get('/cold-unsubscribe', async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.query.token as string;
    if (!token) {
      res.status(400).send(unsubscribeHtml('Invalid unsubscribe link.', false));
      return;
    }

    const decoded = verifyUnsubscribeToken(token);
    if (!decoded) {
      res.status(400).send(unsubscribeHtml('This unsubscribe link has expired or is invalid.', false));
      return;
    }

    await processUnsubscribe(decoded.email, decoded.prospectId);

    res.send(unsubscribeHtml(
      'You have been successfully unsubscribed. You will no longer receive emails from us.',
      true
    ));
  } catch (error) {
    console.error('Cold unsubscribe error:', error);
    res.status(500).send(unsubscribeHtml('Something went wrong. Please try again later.', false));
  }
});

function unsubscribeHtml(message: string, success: boolean): string {
  const color = success ? '#059669' : '#dc2626';
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Unsubscribe - PagePulser</title>
<style>body{font-family:Arial,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#f8fafc;}
.card{background:white;border-radius:12px;padding:40px;max-width:400px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,0.1);}
.icon{font-size:48px;margin-bottom:16px;}
h1{color:${color};font-size:20px;margin:0 0 12px;}
p{color:#64748b;font-size:14px;line-height:1.6;margin:0;}</style>
</head><body><div class="card">
<div class="icon">${success ? '✓' : '✗'}</div>
<h1>${success ? 'Unsubscribed' : 'Error'}</h1>
<p>${message}</p>
</div></body></html>`;
}

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

// Simple rate limit map for signup endpoint
const signupAttempts = new Map<string, { count: number; resetAt: number }>();

router.post('/coming-soon/signup', async (req: Request, res: Response): Promise<void> => {
  try {
    // Rate limit: 5 signups per IP per 15 minutes
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

// Initialize route dependencies
export function initializeRoutes(pool: Pool): void {
  setAuditsPool(pool);
  setV1Pool(pool);
  setSiteServicePool(pool);
  setSiteSharingServicePool(pool);
  setSiteMiddlewarePool(pool);
  setDomainVerificationPool(pool);
  setConsentServicePool(pool);
  setOrganizationServicePool(pool);
  setDomainServicePool(pool);
  setAnalyticsPool(pool);
  initializeAdminMiddleware(pool);
  initializeAdminService(pool);
  initializeAdminAnalyticsService(pool);
  setScheduleServicePool(pool);
  setNrdFeedPool(pool);
  setColdProspectAdminPool(pool);
  setDomainCheckerPool(pool);
  setEmailExtractorPool(pool);
  setReferralServicePool(pool);
  setSystemSettingsPool(pool);
  setSeoServicePool(pool);
  setOutreachServicePool(pool);
}

export const apiRouter = router;
