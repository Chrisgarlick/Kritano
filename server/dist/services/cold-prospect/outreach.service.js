"use strict";
/**
 * Cold Prospect Outreach Service
 *
 * Handles automated email outreach to qualified cold prospects.
 * Separate from user email system since prospects aren't registered users.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setPool = setPool;
exports.isGenericBusinessEmail = isGenericBusinessEmail;
exports.queueOutreachBatch = queueOutreachBatch;
exports.processOutreachQueue = processOutreachQueue;
exports.getOutreachStats = getOutreachStats;
exports.getSendHistory = getSendHistory;
exports.processUnsubscribe = processUnsubscribe;
exports.generateUnsubscribeToken = generateUnsubscribeToken;
exports.verifyUnsubscribeToken = verifyUnsubscribeToken;
exports.purgeStaleProspects = purgeStaleProspects;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
let pool;
function setPool(dbPool) {
    pool = dbPool;
}
const APP_URL = process.env.APP_URL || 'http://localhost:3000';
if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
}
const JWT_SECRET = process.env.JWT_SECRET;
const DEFAULT_DAILY_LIMIT = 20;
const SEND_DELAY_MS = 200; // 200ms between sends
// Outreach mode: 'draft' queues emails for manual review, 'auto' sends automatically.
// Default to 'draft' to align with manual personalisation approach.
const OUTREACH_MODE = process.env.COLD_OUTREACH_MODE || 'draft';
// LIA compliance: Only send to generic/role-based business email addresses.
// Personal named emails (john@, j.smith@) are never contacted.
const ALLOWED_EMAIL_PREFIXES = [
    'info', 'hello', 'support', 'contact', 'admin', 'enquiries', 'enquiry',
    'team', 'sales', 'help', 'office', 'general', 'mail', 'web', 'website',
    'hi', 'hey', 'business', 'reception', 'feedback', 'press', 'media',
    'partnerships', 'marketing',
];
/**
 * Check if an email is a generic/role-based business address.
 * Returns false for personal named emails.
 */
function isGenericBusinessEmail(email) {
    const prefix = email.split('@')[0].toLowerCase().replace(/[.\-_+]/g, '');
    return ALLOWED_EMAIL_PREFIXES.some(allowed => prefix === allowed || prefix === `${allowed}s`);
}
// =============================================
// Queue & Send
// =============================================
/**
 * Queue outreach emails for qualified prospects who haven't been contacted.
 * Respects daily limit and unsubscribe list.
 */
async function queueOutreachBatch(limit) {
    // Get daily limit from settings
    const settingResult = await pool.query(`SELECT value FROM system_settings WHERE key = 'cold_prospect_daily_email_limit'`);
    const dailyLimit = settingResult.rows.length > 0
        ? parseInt(String(settingResult.rows[0].value), 10) || DEFAULT_DAILY_LIMIT
        : DEFAULT_DAILY_LIMIT;
    // Count sends today
    const todayResult = await pool.query(`SELECT COUNT(*) as count FROM cold_prospect_sends
     WHERE created_at >= CURRENT_DATE`);
    const sentToday = parseInt(todayResult.rows[0].count, 10);
    const remaining = Math.max(0, dailyLimit - sentToday);
    const batchSize = Math.min(limit || remaining, remaining);
    if (batchSize === 0)
        return { queued: 0 };
    // Find qualified prospects with generic/role-based email, not yet contacted, not unsubscribed.
    // LIA compliance: Only 1 email per domain, generic addresses only.
    const result = await pool.query(`SELECT cp.id, cp.domain, cp.contact_email, cp.contact_name, cp.quality_score
     FROM cold_prospects cp
     WHERE cp.status = 'qualified'
       AND cp.contact_email IS NOT NULL
       AND cp.email_sent_at IS NULL
       AND NOT EXISTS (
         SELECT 1 FROM cold_prospect_sends cps
         WHERE cps.prospect_id = cp.id
       )
       AND NOT EXISTS (
         SELECT 1 FROM cold_prospect_unsubscribes cu
         WHERE cu.email = cp.contact_email
       )
     ORDER BY cp.quality_score DESC, cp.created_at ASC
     LIMIT $1`, [batchSize]);
    let queued = 0;
    for (const prospect of result.rows) {
        // LIA compliance: Only send to generic/role-based business addresses
        if (!isGenericBusinessEmail(prospect.contact_email)) {
            continue;
        }
        const unsubToken = generateUnsubscribeToken(prospect.contact_email, prospect.id);
        const unsubUrl = `${APP_URL}/api/cold-unsubscribe?token=${unsubToken}`;
        await pool.query(`INSERT INTO cold_prospect_sends (prospect_id, template_slug, to_email, subject, status)
       VALUES ($1, 'cold_outreach_initial', $2, $3, 'queued')`, [
            prospect.id,
            prospect.contact_email,
            `Quick question about ${prospect.domain}`,
        ]);
        queued++;
    }
    return { queued };
}
/**
 * Process queued outreach sends. Claims rows with FOR UPDATE SKIP LOCKED.
 */
async function processOutreachQueue(batchSize = 10) {
    // In draft mode, leave queued sends for manual review — don't auto-send
    if (OUTREACH_MODE === 'draft') {
        return { sent: 0, failed: 0, drafted: 0 };
    }
    let sent = 0;
    let failed = 0;
    // Claim a batch of queued sends
    const result = await pool.query(`UPDATE cold_prospect_sends
     SET status = 'sending', updated_at = NOW()
     WHERE id IN (
       SELECT id FROM cold_prospect_sends
       WHERE status = 'queued'
       ORDER BY created_at ASC
       FOR UPDATE SKIP LOCKED
       LIMIT $1
     )
     RETURNING id, prospect_id, template_slug, to_email, subject`, [batchSize]);
    for (const send of result.rows) {
        try {
            // Get prospect info for template variables
            const prospectResult = await pool.query(`SELECT domain, contact_name, contact_email, quality_score
         FROM cold_prospects WHERE id = $1`, [send.prospect_id]);
            if (prospectResult.rows.length === 0) {
                await markSendFailed(send.id, 'Prospect not found');
                failed++;
                continue;
            }
            const prospect = prospectResult.rows[0];
            // Load template
            const templateResult = await pool.query(`SELECT id, subject, blocks, branding_mode FROM email_templates
         WHERE slug = $1 AND is_active = true`, [send.template_slug]);
            if (templateResult.rows.length === 0) {
                await markSendFailed(send.id, 'Template not found or inactive');
                failed++;
                continue;
            }
            // Generate unsubscribe URL
            const unsubToken = generateUnsubscribeToken(prospect.contact_email, send.prospect_id);
            const unsubUrl = `${APP_URL}/api/cold-unsubscribe?token=${unsubToken}`;
            // Determine top issue area based on quality score
            const topIssueArea = prospect.quality_score < 40 ? 'SEO and accessibility' : 'performance and content quality';
            // Build variables
            const variables = {
                contactName: prospect.contact_name || '',
                domain: prospect.domain,
                topIssueArea,
                appUrl: APP_URL,
                unsubscribeUrl: unsubUrl,
                currentYear: new Date().getFullYear().toString(),
                businessAddress: process.env.BUSINESS_ADDRESS || '[Business Address]',
            };
            // Compile and send email
            await sendColdEmail(prospect.contact_email, send.subject, send.template_slug, variables);
            // Mark as sent
            await pool.query(`UPDATE cold_prospect_sends SET status = 'sent', sent_at = NOW(), updated_at = NOW()
         WHERE id = $1`, [send.id]);
            // Update prospect status
            await pool.query(`UPDATE cold_prospects SET status = 'contacted', email_sent_at = NOW()
         WHERE id = $1`, [send.prospect_id]);
            sent++;
            // Rate limit between sends
            if (SEND_DELAY_MS > 0) {
                await new Promise(resolve => setTimeout(resolve, SEND_DELAY_MS));
            }
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            await markSendFailed(send.id, message);
            failed++;
        }
    }
    return { sent, failed, drafted: 0 };
}
async function getOutreachStats() {
    const [sendsResult, unsubResult, todayResult] = await Promise.all([
        pool.query(`SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'sent') as sent,
        COUNT(*) FILTER (WHERE status = 'queued') as queued,
        COUNT(*) FILTER (WHERE status = 'failed') as failed,
        COUNT(*) FILTER (WHERE opened_at IS NOT NULL) as opened,
        COUNT(*) FILTER (WHERE clicked_at IS NOT NULL) as clicked
       FROM cold_prospect_sends`),
        pool.query(`SELECT COUNT(*) as count FROM cold_prospect_unsubscribes`),
        pool.query(`SELECT COUNT(*) as count FROM cold_prospect_sends
       WHERE status = 'sent' AND sent_at >= CURRENT_DATE`),
    ]);
    const s = sendsResult.rows[0];
    const total = parseInt(s.total, 10);
    const sentCount = parseInt(s.sent, 10);
    const opened = parseInt(s.opened, 10);
    const clicked = parseInt(s.clicked, 10);
    return {
        totalSends: total,
        sent: sentCount,
        queued: parseInt(s.queued, 10),
        failed: parseInt(s.failed, 10),
        opened,
        clicked,
        unsubscribed: parseInt(unsubResult.rows[0].count, 10),
        sentToday: parseInt(todayResult.rows[0].count, 10),
        openRate: sentCount > 0 ? Math.round((opened / sentCount) * 100) : 0,
        clickRate: sentCount > 0 ? Math.round((clicked / sentCount) * 100) : 0,
    };
}
/**
 * Get paginated send history.
 */
async function getSendHistory(page = 1, limit = 25) {
    const offset = (page - 1) * limit;
    const [dataResult, countResult] = await Promise.all([
        pool.query(`SELECT cps.*, cp.domain, cp.contact_name
       FROM cold_prospect_sends cps
       JOIN cold_prospects cp ON cps.prospect_id = cp.id
       ORDER BY cps.created_at DESC
       LIMIT $1 OFFSET $2`, [limit, offset]),
        pool.query(`SELECT COUNT(*) as count FROM cold_prospect_sends`),
    ]);
    return {
        sends: dataResult.rows,
        total: parseInt(countResult.rows[0].count, 10),
    };
}
// =============================================
// Unsubscribe
// =============================================
/**
 * Process an unsubscribe request.
 */
async function processUnsubscribe(email, prospectId) {
    await pool.query(`INSERT INTO cold_prospect_unsubscribes (email, prospect_id)
     VALUES ($1, $2)
     ON CONFLICT (email) DO NOTHING`, [email, prospectId || null]);
    // Also update prospect status if we have the ID
    if (prospectId) {
        await pool.query(`UPDATE cold_prospects SET excluded_at = NOW(), exclusion_reason = 'unsubscribed'
       WHERE id = $1 AND excluded_at IS NULL`, [prospectId]);
    }
}
function generateUnsubscribeToken(email, prospectId) {
    return jsonwebtoken_1.default.sign({ email, prospectId }, JWT_SECRET, { expiresIn: '365d' });
}
function verifyUnsubscribeToken(token) {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        return decoded;
    }
    catch {
        return null;
    }
}
// =============================================
// Data Retention (LIA Compliance)
// =============================================
/**
 * Delete cold prospects with no engagement after 6 months.
 * Required by LIA — see /docs/cold-prospects-LIA.md
 */
async function purgeStaleProspects() {
    // Delete prospects that:
    // - Were created more than 6 months ago
    // - Have not converted (no converted_user_id)
    // - Have either never been contacted, or were contacted but never engaged (no opens/clicks)
    const result = await pool.query(`WITH stale AS (
       SELECT cp.id FROM cold_prospects cp
       WHERE cp.created_at < NOW() - INTERVAL '6 months'
         AND cp.converted_user_id IS NULL
         AND NOT EXISTS (
           SELECT 1 FROM cold_prospect_sends cps
           WHERE cps.prospect_id = cp.id
             AND (cps.opened_at IS NOT NULL OR cps.clicked_at IS NOT NULL)
         )
     )
     DELETE FROM cold_prospects WHERE id IN (SELECT id FROM stale)
     RETURNING id`);
    return { deleted: result.rowCount || 0 };
}
// =============================================
// Internal helpers
// =============================================
async function markSendFailed(sendId, error) {
    await pool.query(`UPDATE cold_prospect_sends SET status = 'failed', error_message = $2, updated_at = NOW()
     WHERE id = $1`, [sendId, error]);
}
/**
 * Send an email to a cold prospect via SMTP/Resend/console.
 * Simplified version of email-template.service's send logic for non-users.
 */
async function sendColdEmail(toEmail, subject, templateSlug, variables) {
    // Load and compile the template
    const templateResult = await pool.query(`SELECT blocks, compiled_html, compiled_at FROM email_templates WHERE slug = $1`, [templateSlug]);
    if (templateResult.rows.length === 0) {
        throw new Error(`Template not found: ${templateSlug}`);
    }
    const template = templateResult.rows[0];
    let html;
    if (template.compiled_html) {
        html = template.compiled_html;
    }
    else {
        // Fallback: Build simple HTML from blocks
        const blocks = typeof template.blocks === 'string' ? JSON.parse(template.blocks) : template.blocks;
        html = buildSimpleHtml(blocks);
    }
    // Substitute variables using Handlebars-style replacement
    for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        html = html.replace(regex, value);
        subject = subject.replace(regex, value);
    }
    // Handle {{#if contactName}} ... {{/if}} blocks
    if (variables.contactName) {
        html = html.replace(/\{\{#if contactName\}\}(.*?)\{\{\/if\}\}/gs, '$1');
    }
    else {
        html = html.replace(/\{\{#if contactName\}\}(.*?)\{\{\/if\}\}/gs, '');
    }
    const fromAddress = process.env.EMAIL_FROM || 'Kritano <noreply@kritano.com>';
    const smtpHost = process.env.SMTP_HOST;
    if (smtpHost) {
        const nodemailer = await import('nodemailer');
        const transport = nodemailer.default.createTransport({
            host: smtpHost,
            port: parseInt(process.env.SMTP_PORT || '1025', 10),
            secure: false,
            auth: process.env.SMTP_USER ? {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS || '',
            } : undefined,
        });
        await transport.sendMail({
            from: fromAddress,
            to: toEmail,
            subject,
            html,
            headers: {
                'List-Unsubscribe': `<${variables.unsubscribeUrl || ''}>`,
                'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
            },
        });
    }
    else {
        const apiKey = process.env.RESEND_API_KEY;
        if (apiKey && apiKey !== 're_your_api_key_here') {
            const { Resend } = await import('resend');
            const resend = new Resend(apiKey);
            const result = await resend.emails.send({
                from: fromAddress,
                to: toEmail,
                subject,
                html,
                headers: {
                    'List-Unsubscribe': `<${variables.unsubscribeUrl || ''}>`,
                    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
                },
            });
            if (result.error)
                throw new Error(result.error.message);
        }
        else {
            // Dev mode — console log
            console.log(`\n📧 COLD EMAIL (Template: ${templateSlug})`);
            console.log(`To: ${toEmail} | Subject: ${subject}`);
            console.log('');
        }
    }
}
/**
 * Build simple HTML from email blocks (fallback when compiled_html isn't cached).
 */
function buildSimpleHtml(blocks) {
    let html = '<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">';
    for (const block of blocks) {
        switch (block.type) {
            case 'header':
                html += `<div style="background:${block.backgroundColor || '#4f46e5'};padding:20px;text-align:center;color:white;border-radius:8px 8px 0 0;"><strong>${block.companyName || 'Kritano'}</strong></div>`;
                break;
            case 'text':
                html += `<div style="padding:15px 0;">${block.content || ''}</div>`;
                break;
            case 'button':
                html += `<div style="text-align:center;padding:15px 0;"><a href="${block.href || '#'}" style="background:#4f46e5;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">${block.label || 'Click here'}</a></div>`;
                break;
            case 'divider':
                html += '<hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;" />';
                break;
        }
    }
    html += '</body></html>';
    return html;
}
//# sourceMappingURL=outreach.service.js.map