"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiRouter = void 0;
exports.initializeRoutes = initializeRoutes;
const express_1 = require("express");
const index_js_1 = require("./auth/index.js");
const index_js_2 = require("./audits/index.js");
const index_js_3 = require("./api-keys/index.js");
const index_js_4 = require("./v1/index.js");
const index_js_5 = require("./docs/index.js");
const index_js_6 = require("./admin/index.js");
const index_js_7 = __importDefault(require("./bug-reports/index.js"));
const index_js_8 = __importDefault(require("./feature-requests/index.js"));
const index_js_9 = require("./organizations/index.js");
const index_js_10 = __importDefault(require("./sites/index.js"));
const index_js_11 = __importDefault(require("./site-invitations/index.js"));
const index_js_12 = __importStar(require("./analytics/index.js"));
const index_js_13 = __importDefault(require("./email/index.js"));
const blog_js_1 = require("./blog.js");
const index_js_14 = require("./referrals/index.js");
const cookie_consent_js_1 = require("./consent/cookie-consent.js");
const email_service_js_1 = require("../services/email.service.js");
const seo_js_1 = require("./seo.js");
const index_js_15 = require("./account/index.js");
const user_webhooks_js_1 = require("./webhooks/user-webhooks.js");
const index_js_16 = require("./public-reports/index.js");
const index_js_17 = require("./compliance/index.js");
const index_js_18 = require("./gsc/index.js");
const gsc_service_js_1 = require("../services/gsc.service.js");
const site_service_js_1 = require("../services/site.service.js");
const trial_service_js_1 = require("../services/trial.service.js");
const index_js_19 = require("../db/index.js");
const site_sharing_service_js_1 = require("../services/site-sharing.service.js");
const site_middleware_js_1 = require("../middleware/site.middleware.js");
const domain_verification_service_js_1 = require("../services/domain-verification.service.js");
const consent_service_js_1 = require("../services/consent.service.js");
const organization_service_js_1 = require("../services/organization.service.js");
const domain_service_js_1 = require("../services/domain.service.js");
const referral_service_js_1 = require("../services/referral.service.js");
const system_settings_service_js_1 = require("../services/system-settings.service.js");
const early_access_service_js_1 = require("../services/early-access.service.js");
const seo_service_js_1 = require("../services/seo.service.js");
const admin_middleware_js_1 = require("../middleware/admin.middleware.js");
const admin_service_js_1 = require("../services/admin.service.js");
const admin_analytics_service_js_1 = require("../services/admin-analytics.service.js");
const schedule_service_js_1 = require("../services/schedule.service.js");
const nrd_feed_service_js_1 = require("../services/cold-prospect/nrd-feed.service.js");
const cold_prospect_admin_service_js_1 = require("../services/cold-prospect/cold-prospect-admin.service.js");
const domain_checker_service_js_1 = require("../services/cold-prospect/domain-checker.service.js");
const email_extractor_service_js_1 = require("../services/cold-prospect/email-extractor.service.js");
const outreach_service_js_1 = require("../services/cold-prospect/outreach.service.js");
const auth_middleware_js_1 = require("../middleware/auth.middleware.js");
const stripe_service_js_1 = require("../services/stripe.service.js");
const zod_1 = require("zod");
const cms_service_js_1 = require("../services/cms.service.js");
const router = (0, express_1.Router)();
// Auth routes
router.use('/auth', index_js_1.authRouter);
// Sites routes (user-centric, no org prefix)
router.use('/sites', index_js_10.default);
// Site invitations (public token-based)
router.use('/site-invitations', index_js_11.default);
// Audits routes
router.use('/audits', index_js_2.auditsRouter);
// EAA Compliance (nested under audits path)
router.use('/audits', index_js_17.complianceRouter);
// Analytics routes
router.use('/analytics', index_js_12.default);
// API key management routes
router.use('/api-keys', index_js_3.apiKeysRouter);
// Public API v1 routes (API key authenticated)
router.use('/v1', index_js_4.v1Router);
// API documentation
router.use('/docs', index_js_5.docsRouter);
// Super admin routes
router.use('/admin', index_js_6.adminRouter);
// Organizations
router.use('/organizations', index_js_9.organizationsRouter);
// Bug reports (user-facing)
router.use('/bug-reports', index_js_7.default);
// Feature requests (user-facing)
router.use('/feature-requests', index_js_8.default);
// Public email routes (unsubscribe, preferences)
router.use('/email', index_js_13.default);
// Public blog routes (no auth)
router.use('/blog', blog_js_1.blogRouter);
// Referrals (authenticated)
router.use('/referrals', index_js_14.referralsRouter);
// Cookie consent (public, no auth)
router.use('/consent/cookies', cookie_consent_js_1.cookieConsentRouter);
// Public SEO entries (no auth, cached)
router.use('/seo', seo_js_1.seoRouter);
// Account management (GDPR: data export, deletion)
router.use('/account', index_js_15.accountRouter);
// User webhooks (authenticated)
router.use('/webhooks', user_webhooks_js_1.userWebhooksRouter);
// Google Search Console (authenticated)
router.use('/gsc', index_js_18.gscRouter);
// Public shareable audit reports (mixed auth: share/revoke are authenticated, view is public)
router.use(index_js_16.publicReportsRouter);
// Contact form (public, no auth)
const contactAttempts = new Map();
// Periodic cleanup to prevent unbounded memory growth
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of contactAttempts) {
        if (entry.resetAt <= now)
            contactAttempts.delete(key);
    }
}, 5 * 60 * 1000);
router.post('/contact', async (req, res) => {
    try {
        // Rate limit: 3 per IP per 15 minutes
        const ip = req.ip || req.socket.remoteAddress || 'unknown';
        const now = Date.now();
        const entry = contactAttempts.get(ip);
        if (entry && entry.resetAt > now) {
            if (entry.count >= 3) {
                res.status(429).json({ error: 'Too many contact submissions. Please try again later.' });
                return;
            }
            entry.count++;
        }
        else {
            contactAttempts.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 });
        }
        const schema = zod_1.z.object({
            name: zod_1.z.string().min(1).max(200),
            email: zod_1.z.string().email().max(255),
            subject: zod_1.z.string().max(200).optional(),
            message: zod_1.z.string().min(1).max(5000),
        });
        const { name, email, subject, message } = schema.parse(req.body);
        await index_js_19.pool.query(`INSERT INTO contact_submissions (name, email, subject, message, ip_address)
       VALUES ($1, $2, $3, $4, $5)`, [name, email, subject || null, message, ip]);
        // Email notification to info@kritano.com
        const CONTACT_EMAIL = process.env.CONTACT_EMAIL || 'info@kritano.com';
        try {
            await email_service_js_1.emailService.sendGenericEmail(CONTACT_EMAIL, `Contact Form: ${subject || 'General Enquiry'} — from ${name}`, `<h2>New contact form submission</h2>
         <p><strong>Name:</strong> ${name}</p>
         <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
         <p><strong>Subject:</strong> ${subject || 'Not specified'}</p>
         <hr/>
         <p>${message.replace(/\n/g, '<br/>')}</p>
         <hr/>
         <p style="color: #64748b; font-size: 12px;">Reply directly to <a href="mailto:${email}">${email}</a></p>`);
        }
        catch (emailErr) {
            // Don't fail the submission if email notification fails
            console.error('Failed to send contact notification email:', emailErr);
        }
        res.json({ success: true, message: 'Thank you! We\'ll get back to you within one business day.' });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: 'Please fill in all required fields correctly.' });
            return;
        }
        console.error('Contact form error:', error);
        res.status(500).json({ error: 'Failed to send message. Please try again.' });
    }
});
// Public badge SVG (no auth, cached)
router.get('/public/badges/:siteId.svg', async (req, res) => {
    try {
        const { siteId } = req.params;
        // Validate siteId is a UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(siteId)) {
            res.status(404).setHeader('Content-Type', 'image/svg+xml').send(generateBadgeSvg('Not Found', null));
            return;
        }
        // Check badge_enabled
        const siteResult = await index_js_19.pool.query(`SELECT id, badge_enabled FROM sites WHERE id = $1`, [siteId]);
        if (siteResult.rows.length === 0 || !siteResult.rows[0].badge_enabled) {
            res.status(404).setHeader('Content-Type', 'image/svg+xml').send(generateBadgeSvg('Not Found', null));
            return;
        }
        // Fetch latest completed audit scores
        const auditResult = await index_js_19.pool.query(`SELECT seo_score, accessibility_score, security_score, performance_score, content_score
       FROM audit_jobs
       WHERE site_id = $1 AND status = 'completed'
       ORDER BY completed_at DESC
       LIMIT 1`, [siteId]);
        if (auditResult.rows.length === 0) {
            res.setHeader('Content-Type', 'image/svg+xml');
            res.setHeader('Cache-Control', 'public, max-age=3600');
            res.send(generateBadgeSvg('No data', null));
            return;
        }
        const audit = auditResult.rows[0];
        const scores = [
            audit.seo_score,
            audit.accessibility_score,
            audit.security_score,
            audit.performance_score,
            audit.content_score,
        ].filter((s) => s !== null);
        const overall = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
        res.setHeader('Content-Type', 'image/svg+xml');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.send(generateBadgeSvg(overall !== null ? String(overall) : 'No data', overall));
    }
    catch (error) {
        console.error('Badge SVG error:', error);
        res.status(500).setHeader('Content-Type', 'image/svg+xml').send(generateBadgeSvg('Error', null));
    }
});
function generateBadgeSvg(scoreText, score) {
    // Color based on score
    let scoreColor = '#94a3b8'; // slate-400 default for no data
    if (score !== null) {
        if (score >= 80)
            scoreColor = '#22c55e'; // green
        else if (score >= 60)
            scoreColor = '#f59e0b'; // amber
        else
            scoreColor = '#ef4444'; // red
    }
    const labelText = 'Kritano';
    const labelWidth = 72;
    const scoreWidth = scoreText.length > 4 ? 48 : 36;
    const totalWidth = labelWidth + scoreWidth;
    const height = 28;
    const labelX = labelWidth / 2;
    const scoreX = labelWidth + scoreWidth / 2;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${height}" role="img" aria-label="${labelText}: ${scoreText}">
  <title>${labelText}: ${scoreText}</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#fff" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r">
    <rect width="${totalWidth}" height="${height}" rx="4" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelWidth}" height="${height}" fill="#334155"/>
    <rect x="${labelWidth}" width="${scoreWidth}" height="${height}" fill="${scoreColor}"/>
    <rect width="${totalWidth}" height="${height}" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="11">
    <text x="${labelX}" y="${height / 2 + 4}" fill="#010101" fill-opacity=".3">${labelText}</text>
    <text x="${labelX}" y="${height / 2 + 3}">${labelText}</text>
    <text x="${scoreX}" y="${height / 2 + 4}" fill="#010101" fill-opacity=".3">${scoreText}</text>
    <text x="${scoreX}" y="${height / 2 + 3}">${scoreText}</text>
  </g>
</svg>`;
}
// Public success stories (no auth)
router.get('/public/success-stories', async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 6, 20);
        const stories = await (0, cms_service_js_1.getPublishedSuccessStories)(limit);
        res.json({ stories });
    }
    catch (error) {
        console.error('Public success stories error:', error);
        res.status(500).json({ error: 'Failed to load success stories' });
    }
});
// User-facing announcements (authenticated)
router.get('/announcements/active', auth_middleware_js_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        // Get user tier from their subscription
        const tierResult = await (0, site_service_js_1.getUserTierLimits)(userId);
        const tier = tierResult?.tier || 'free';
        const announcements = await (0, cms_service_js_1.getActiveAnnouncements)(tier, userId);
        res.json({ announcements });
    }
    catch (error) {
        console.error('Active announcements error:', error);
        res.status(500).json({ error: 'Failed to load announcements' });
    }
});
router.post('/announcements/:id/dismiss', auth_middleware_js_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        await (0, cms_service_js_1.dismissAnnouncement)(req.params.id, userId);
        res.json({ success: true });
    }
    catch (error) {
        console.error('Dismiss announcement error:', error);
        res.status(500).json({ error: 'Failed to dismiss announcement' });
    }
});
// User subscription routes
router.get('/subscription', auth_middleware_js_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const tierLimits = await (0, site_service_js_1.getUserTierLimits)(userId);
        const usage = await (0, site_service_js_1.getUserSiteUsage)(userId);
        // Get actual subscription from DB
        const subResult = await index_js_19.pool.query(`SELECT id, user_id, tier, status, trial_start, trial_end, stripe_customer_id, created_at, updated_at
       FROM subscriptions
       WHERE user_id = $1 AND status IN ('active', 'trialing', 'past_due')
       ORDER BY created_at DESC LIMIT 1`, [userId]);
        const sub = subResult.rows[0];
        let daysRemaining = null;
        if (sub?.status === 'trialing' && sub.trial_end) {
            daysRemaining = Math.max(0, Math.ceil((new Date(sub.trial_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
        }
        // Check if user has used trial
        const userResult = await index_js_19.pool.query(`SELECT has_used_trial FROM users WHERE id = $1`, [userId]);
        const hasUsedTrial = userResult.rows[0]?.has_used_trial || false;
        res.json({
            subscription: {
                tier: tierLimits?.tier || 'free',
                status: sub?.status || 'active',
                trialStart: sub?.trial_start || null,
                trialEnd: sub?.trial_end || null,
                daysRemaining,
                hasUsedTrial,
                stripeCustomerId: !!sub?.stripe_customer_id,
            },
            limits: {
                tier: tierLimits?.tier || 'free',
                maxSites: usage.maxSites,
                maxPagesPerAudit: tierLimits?.max_pages_per_audit || 100,
                maxAuditDepth: tierLimits?.max_audit_depth || 5,
                concurrentAudits: tierLimits?.concurrent_audits || 3,
                maxAuditsPerMonth: tierLimits?.max_audits_per_month ?? null,
                availableChecks: tierLimits?.available_checks || ['seo', 'accessibility', 'security', 'performance', 'content'],
            },
        });
    }
    catch (error) {
        console.error('Get subscription error:', error);
        res.status(500).json({ error: 'Failed to get subscription' });
    }
});
// Start free trial
router.post('/subscription/start-trial', auth_middleware_js_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const { tier } = req.body;
        // Validate tier
        if (!['starter', 'pro', 'agency'].includes(tier)) {
            res.status(400).json({ error: 'Invalid tier. Must be starter, pro, or agency.' });
            return;
        }
        // Require verified email
        const userResult = await index_js_19.pool.query(`SELECT email_verified FROM users WHERE id = $1`, [userId]);
        if (!userResult.rows[0]?.email_verified) {
            res.status(403).json({ error: 'Please verify your email before starting a trial.' });
            return;
        }
        const result = await (0, trial_service_js_1.startTrial)(userId, tier);
        // Reload subscription data to return
        const subResult = await index_js_19.pool.query(`SELECT id, user_id, tier, status, trial_start, trial_end FROM subscriptions WHERE id = $1`, [result.subscriptionId]);
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
    }
    catch (error) {
        const statusCode = error.statusCode || 500;
        console.error('Start trial error:', error.message);
        res.status(statusCode).json({ error: error.message || 'Failed to start trial' });
    }
});
// Stripe checkout — create a Checkout Session for a paid tier
router.post('/subscription/checkout', auth_middleware_js_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const { tier } = req.body;
        // Validate tier
        if (!['starter', 'pro', 'agency', 'enterprise'].includes(tier)) {
            res.status(400).json({ error: 'Invalid tier. Must be starter, pro, agency, or enterprise.' });
            return;
        }
        // Get user's current subscription (for existing stripe_customer_id)
        const subResult = await index_js_19.pool.query(`SELECT stripe_customer_id FROM subscriptions
       WHERE user_id = $1 AND status IN ('active', 'trialing', 'past_due')
       ORDER BY created_at DESC LIMIT 1`, [userId]);
        // Get user's discount_percent (early access founding members)
        const userResult = await index_js_19.pool.query(`SELECT email, discount_percent FROM users WHERE id = $1`, [userId]);
        const user = userResult.rows[0];
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        const appUrl = process.env.APP_URL || 'http://localhost:3000';
        const session = await (0, stripe_service_js_1.createCheckoutSession)({
            userId,
            tier,
            customerId: subResult.rows[0]?.stripe_customer_id || undefined,
            customerEmail: user.email,
            discountPercent: user.discount_percent || 0,
            successUrl: `${appUrl}/app/settings/profile?checkout=success`,
            cancelUrl: `${appUrl}/app/settings/profile?checkout=canceled`,
        });
        res.json({ url: session.url });
    }
    catch (error) {
        console.error('Create checkout session error:', error);
        res.status(500).json({ error: 'Failed to create checkout session' });
    }
});
// Stripe portal — manage existing subscription
router.post('/subscription/portal', auth_middleware_js_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const subResult = await index_js_19.pool.query(`SELECT stripe_customer_id FROM subscriptions
       WHERE user_id = $1 AND stripe_customer_id IS NOT NULL
       ORDER BY created_at DESC LIMIT 1`, [userId]);
        if (!subResult.rows[0]?.stripe_customer_id) {
            res.status(400).json({ error: 'No billing account found. Please subscribe first.' });
            return;
        }
        const appUrl = process.env.APP_URL || 'http://localhost:3000';
        const session = await (0, stripe_service_js_1.createPortalSession)(subResult.rows[0].stripe_customer_id, `${appUrl}/app/settings/profile`);
        res.json({ url: session.url });
    }
    catch (error) {
        console.error('Create portal session error:', error);
        res.status(500).json({ error: 'Failed to create portal session' });
    }
});
router.get('/usage', auth_middleware_js_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const usage = await (0, site_service_js_1.getUserSiteUsage)(userId);
        const tierLimits = await (0, site_service_js_1.getUserTierLimits)(userId);
        res.json({
            usage: {
                sites: usage.sites,
                maxSites: usage.maxSites,
                canAddMore: usage.canAddMore,
            },
            limits: {
                tier: tierLimits?.tier || 'free',
                maxSites: usage.maxSites,
                maxPagesPerAudit: tierLimits?.max_pages_per_audit || 100,
                maxAuditDepth: tierLimits?.max_audit_depth || 5,
                concurrentAudits: tierLimits?.concurrent_audits || 3,
            },
        });
    }
    catch (error) {
        console.error('Get usage error:', error);
        res.status(500).json({ error: 'Failed to get usage' });
    }
});
// =============================================
// Cold prospect unsubscribe (public, no auth)
// =============================================
router.get('/cold-unsubscribe', async (req, res) => {
    try {
        const token = req.query.token;
        if (!token) {
            res.status(400).send(unsubscribeHtml('Invalid unsubscribe link.', false));
            return;
        }
        const decoded = (0, outreach_service_js_1.verifyUnsubscribeToken)(token);
        if (!decoded) {
            res.status(400).send(unsubscribeHtml('This unsubscribe link has expired or is invalid.', false));
            return;
        }
        await (0, outreach_service_js_1.processUnsubscribe)(decoded.email, decoded.prospectId);
        res.send(unsubscribeHtml('You have been successfully unsubscribed. You will no longer receive emails from us.', true));
    }
    catch (error) {
        console.error('Cold unsubscribe error:', error);
        res.status(500).send(unsubscribeHtml('Something went wrong. Please try again later.', false));
    }
});
function unsubscribeHtml(message, success) {
    const color = success ? '#059669' : '#dc2626';
    return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Unsubscribe - Kritano</title>
<style>body{font-family:Arial,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#f8fafc;}
.card{background:white;border-radius:12px;padding:40px;max-width:400px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,0.1);}
.icon{font-size:48px;margin-bottom:16px;}
h1{color:${color};font-size:20px;margin:0 0 12px;}
p{color:#64748b;font-size:14px;line-height:1.6;margin:0;}</style>
</head><body><div class="card">
<div class="icon">${success ? '✓' : '✗'}</div>
<h1>${success ? 'Unsubscribed' : 'Error'}</h1>
<p>${message.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')}</p>
</div></body></html>`;
}
// =============================================
// Early Access Status (public, no auth)
// =============================================
router.get('/early-access/status', async (req, res) => {
    try {
        const status = await (0, early_access_service_js_1.getEarlyAccessStatus)();
        res.json({
            enabled: status.enabled,
            spotsRemaining: status.remaining,
            maxSpots: status.maxSpots,
            isFull: status.remaining <= 0,
        });
    }
    catch (error) {
        console.error('Early access status error:', error);
        res.json({ enabled: false, spotsRemaining: 0, maxSpots: 0, isFull: true });
    }
});
// =============================================
// Coming Soon (public, no auth)
// =============================================
router.get('/coming-soon/status', async (req, res) => {
    try {
        const mode = await (0, system_settings_service_js_1.getSiteMode)();
        const headline = await (0, system_settings_service_js_1.getSetting)('coming_soon_headline');
        const description = await (0, system_settings_service_js_1.getSetting)('coming_soon_description');
        res.json({
            enabled: mode !== 'live',
            mode,
            headline: headline || 'Something great is on its way.',
            description: description || '',
        });
    }
    catch (error) {
        console.error('Coming soon status error:', error);
        res.json({ enabled: false, mode: 'live', headline: '', description: '' });
    }
});
// Simple rate limit map for signup endpoint
const signupAttempts = new Map();
// Periodic cleanup to prevent unbounded memory growth
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of signupAttempts) {
        if (entry.resetAt <= now)
            signupAttempts.delete(key);
    }
}, 5 * 60 * 1000);
router.post('/coming-soon/signup', async (req, res) => {
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
        }
        else {
            signupAttempts.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 });
        }
        const schema = zod_1.z.object({
            email: zod_1.z.string().email().max(255),
            name: zod_1.z.string().max(200).optional(),
        });
        const { email, name } = schema.parse(req.body);
        await index_js_19.pool.query(`INSERT INTO coming_soon_signups (email, name, ip_address)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO NOTHING`, [email, name || null, ip]);
        // Notify you at info@
        const CONTACT_EMAIL = process.env.CONTACT_EMAIL || 'info@kritano.com';
        try {
            await email_service_js_1.emailService.sendGenericEmail(CONTACT_EMAIL, `Waitlist signup: ${email}`, `<h2>New waitlist signup</h2>
         <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
         ${name ? `<p><strong>Name:</strong> ${name}</p>` : ''}
         <p style="color: #64748b; font-size: 12px;">Submitted via the Coming Soon page.</p>`);
        }
        catch (emailErr) {
            console.error('Failed to send waitlist notification email:', emailErr);
        }
        res.json({ success: true, message: "Thanks! We'll let you know when we launch." });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: 'Please provide a valid email address.' });
            return;
        }
        console.error('Coming soon signup error:', error);
        res.status(500).json({ error: 'Failed to sign up' });
    }
});
// Initialize route dependencies
function initializeRoutes(pool) {
    (0, index_js_2.setPool)(pool);
    (0, index_js_4.setPool)(pool);
    (0, site_service_js_1.setPool)(pool);
    (0, site_sharing_service_js_1.setPool)(pool);
    (0, site_middleware_js_1.setPool)(pool);
    (0, domain_verification_service_js_1.setPool)(pool);
    (0, consent_service_js_1.setPool)(pool);
    (0, organization_service_js_1.setPool)(pool);
    (0, domain_service_js_1.setPool)(pool);
    (0, index_js_12.setPool)(pool);
    (0, admin_middleware_js_1.initializeAdminMiddleware)(pool);
    (0, admin_service_js_1.initializeAdminService)(pool);
    (0, admin_analytics_service_js_1.initializeAdminAnalyticsService)(pool);
    (0, schedule_service_js_1.setPool)(pool);
    (0, nrd_feed_service_js_1.setPool)(pool);
    (0, cold_prospect_admin_service_js_1.setPool)(pool);
    (0, domain_checker_service_js_1.setPool)(pool);
    (0, email_extractor_service_js_1.setPool)(pool);
    (0, referral_service_js_1.setPool)(pool);
    (0, system_settings_service_js_1.setPool)(pool);
    (0, seo_service_js_1.setPool)(pool);
    (0, outreach_service_js_1.setPool)(pool);
    (0, gsc_service_js_1.setPool)(pool);
}
exports.apiRouter = router;
//# sourceMappingURL=index.js.map