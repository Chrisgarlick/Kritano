"use strict";
/**
 * Campaign Worker Service
 *
 * Polls for active campaigns, claims queued email_sends, rate-limits delivery,
 * and transitions campaigns to sent when complete.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCampaignWorker = createCampaignWorker;
const email_template_service_js_1 = require("../email-template.service.js");
const email_campaign_service_js_1 = require("../email-campaign.service.js");
const POLL_INTERVAL_MS = 5000; // 5 seconds
const DEFAULT_BATCH_SIZE = 20;
const DEFAULT_SEND_DELAY_MS = 200; // 5/sec
function createCampaignWorker(config) {
    const { pool, batchSize = DEFAULT_BATCH_SIZE } = config;
    let running = false;
    let timer = null;
    async function checkScheduledCampaigns() {
        // Transition scheduled campaigns past their scheduled_at to sending
        try {
            const result = await pool.query(`UPDATE email_campaigns
         SET status = 'sending', started_at = NOW(), updated_at = NOW()
         WHERE status = 'scheduled' AND scheduled_at <= NOW()
         RETURNING id, name`);
            for (const row of result.rows) {
                console.log(`📬 Campaign "${row.name}" (${row.id}) schedule triggered — launching`);
                // Resolve segment and create sends for this campaign
                await launchScheduledCampaign(row.id);
            }
        }
        catch (err) {
            console.error('Campaign scheduler check failed:', err);
        }
    }
    async function launchScheduledCampaign(campaignId) {
        // Get campaign details
        const campaignResult = await pool.query(`SELECT c.*, t.slug as template_slug, t.subject as template_subject
       FROM email_campaigns c
       JOIN email_templates t ON c.template_id = t.id
       WHERE c.id = $1`, [campaignId]);
        const campaign = campaignResult.rows[0];
        if (!campaign)
            return;
        // Check if sends already exist (in case of restart)
        const existingSends = await pool.query(`SELECT COUNT(*) as cnt FROM email_sends WHERE campaign_id = $1`, [campaignId]);
        if (parseInt(existingSends.rows[0].cnt, 10) > 0)
            return;
        // Resolve segment using inline query (to use the worker's pool)
        const segment = campaign.segment || {};
        const conditions = ['ep.unsubscribed_all IS NOT TRUE'];
        const values = [];
        let paramIndex = 1;
        if (segment.tiers?.length) {
            conditions.push(`COALESCE(sub.tier, 'free') = ANY($${paramIndex++})`);
            values.push(segment.tiers);
        }
        if (segment.leadStatuses?.length) {
            conditions.push(`u.lead_status = ANY($${paramIndex++})`);
            values.push(segment.leadStatuses);
        }
        if (segment.minLeadScore !== undefined) {
            conditions.push(`COALESCE(u.lead_score, 0) >= $${paramIndex++}`);
            values.push(segment.minLeadScore);
        }
        if (segment.maxLeadScore !== undefined) {
            conditions.push(`COALESCE(u.lead_score, 0) <= $${paramIndex++}`);
            values.push(segment.maxLeadScore);
        }
        if (segment.excludeUserIds?.length) {
            conditions.push(`u.id != ALL($${paramIndex++})`);
            values.push(segment.excludeUserIds);
        }
        const where = `WHERE ${conditions.join(' AND ')}`;
        const users = await pool.query(`SELECT DISTINCT u.id, u.email, u.first_name
       FROM users u
       LEFT JOIN LATERAL (
         SELECT sub2.tier FROM subscriptions sub2
         JOIN sites s ON s.organization_id = sub2.organization_id
         WHERE s.created_by = u.id LIMIT 1
       ) sub ON true
       LEFT JOIN email_preferences ep ON ep.user_id = u.id
       ${where}
       LIMIT $${paramIndex}`, [...values, campaign.max_recipients || 10000]);
        if (users.rows.length === 0) {
            await pool.query(`UPDATE email_campaigns SET status = 'failed', updated_at = NOW() WHERE id = $1`, [campaignId]);
            return;
        }
        // Bulk-insert sends
        const insertValues = [];
        const insertPlaceholders = [];
        let pIdx = 1;
        for (const user of users.rows) {
            insertPlaceholders.push(`($${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, 'queued')`);
            insertValues.push(campaign.template_id, campaignId, user.id, user.email, campaign.template_subject, JSON.stringify({ firstName: user.first_name || 'there' }));
        }
        await pool.query(`INSERT INTO email_sends (template_id, campaign_id, user_id, to_email, subject, variables, status)
       VALUES ${insertPlaceholders.join(', ')}`, insertValues);
        const stats = JSON.stringify({
            total: users.rows.length, queued: users.rows.length,
            sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, complained: 0, failed: 0,
        });
        await pool.query(`UPDATE email_campaigns SET audience_count = $2, stats = $3, updated_at = NOW() WHERE id = $1`, [campaignId, users.rows.length, stats]);
    }
    async function processSendingCampaigns() {
        // Get campaigns that are currently sending
        const result = await pool.query(`SELECT id, template_id, send_rate_per_second FROM email_campaigns WHERE status = 'sending'`);
        for (const campaign of result.rows) {
            try {
                await processCampaignBatch(campaign.id, campaign.send_rate_per_second || 5);
            }
            catch (err) {
                console.error(`Campaign ${campaign.id} processing error:`, err);
            }
        }
    }
    async function processCampaignBatch(campaignId, ratePerSecond) {
        const delayMs = Math.max(Math.floor(1000 / ratePerSecond), 50);
        // Claim a batch of queued sends using FOR UPDATE SKIP LOCKED
        const claimed = await pool.query(`UPDATE email_sends
       SET status = 'sending'
       WHERE id IN (
         SELECT id FROM email_sends
         WHERE campaign_id = $1 AND status = 'queued'
         ORDER BY created_at ASC
         LIMIT $2
         FOR UPDATE SKIP LOCKED
       )
       RETURNING id, template_id, user_id, to_email, subject, variables`, [campaignId, batchSize]);
        if (claimed.rows.length === 0) {
            // Check if there are any remaining queued sends
            const remaining = await pool.query(`SELECT COUNT(*) as cnt FROM email_sends WHERE campaign_id = $1 AND status = 'queued'`, [campaignId]);
            if (parseInt(remaining.rows[0].cnt, 10) === 0) {
                // Also check for sends still being processed (status = 'sending')
                const processing = await pool.query(`SELECT COUNT(*) as cnt FROM email_sends WHERE campaign_id = $1 AND status = 'sending'`, [campaignId]);
                if (parseInt(processing.rows[0].cnt, 10) === 0) {
                    await (0, email_campaign_service_js_1.completeCampaign)(campaignId);
                    console.log(`✅ Campaign ${campaignId} completed — all sends processed`);
                }
            }
            return;
        }
        // Get template slug for sending
        const templateResult = await pool.query(`SELECT slug FROM email_templates WHERE id = $1`, [claimed.rows[0].template_id]);
        const templateSlug = templateResult.rows[0]?.slug;
        if (!templateSlug)
            return;
        // Process sends with rate limiting
        for (const send of claimed.rows) {
            try {
                const variables = typeof send.variables === 'string'
                    ? JSON.parse(send.variables)
                    : send.variables || {};
                await (0, email_template_service_js_1.sendTemplate)({
                    templateSlug,
                    to: {
                        userId: send.user_id,
                        email: send.to_email,
                        firstName: variables.firstName || 'there',
                    },
                    variables,
                    campaignId,
                });
                // Update send record — sendTemplate already sets status to 'sent'
                await (0, email_campaign_service_js_1.incrementCampaignStat)(campaignId, 'sent', 'queued');
            }
            catch (err) {
                // Mark individual send as failed
                await pool.query(`UPDATE email_sends SET status = 'failed', error_message = $2 WHERE id = $1`, [send.id, err instanceof Error ? err.message : 'Unknown error']);
                await (0, email_campaign_service_js_1.incrementCampaignStat)(campaignId, 'failed', 'queued');
                console.error(`Campaign send failed (${send.to_email}):`, err instanceof Error ? err.message : err);
            }
            // Rate limit delay between sends
            if (delayMs > 0) {
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }
    }
    async function poll() {
        if (!running)
            return;
        try {
            await checkScheduledCampaigns();
            await processSendingCampaigns();
        }
        catch (err) {
            console.error('Campaign worker poll error:', err);
        }
        if (running) {
            timer = setTimeout(poll, POLL_INTERVAL_MS);
        }
    }
    return {
        async start() {
            running = true;
            console.log('📬 Campaign worker started (polling every 5s)');
            poll();
        },
        async stop() {
            running = false;
            if (timer) {
                clearTimeout(timer);
                timer = null;
            }
            console.log('📬 Campaign worker stopped');
        },
    };
}
//# sourceMappingURL=campaign-worker.service.js.map