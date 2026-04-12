"use strict";
/**
 * Email Campaign Service
 *
 * Campaign CRUD, segment resolution, lifecycle state machine, and analytics.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.listCampaigns = listCampaigns;
exports.getCampaign = getCampaign;
exports.createCampaign = createCampaign;
exports.updateCampaign = updateCampaign;
exports.deleteCampaign = deleteCampaign;
exports.resolveSegment = resolveSegment;
exports.getAudienceCount = getAudienceCount;
exports.launchCampaign = launchCampaign;
exports.scheduleCampaign = scheduleCampaign;
exports.pauseCampaign = pauseCampaign;
exports.resumeCampaign = resumeCampaign;
exports.cancelCampaign = cancelCampaign;
exports.completeCampaign = completeCampaign;
exports.incrementCampaignStat = incrementCampaignStat;
exports.getCampaignSends = getCampaignSends;
exports.getEmailSends = getEmailSends;
exports.getEmailAnalytics = getEmailAnalytics;
exports.getTemplatePerformance = getTemplatePerformance;
const index_js_1 = require("../db/index.js");
const DEFAULT_STATS = {
    total: 0, queued: 0, sent: 0, delivered: 0,
    opened: 0, clicked: 0, bounced: 0, complained: 0, failed: 0,
};
// ========================================
// Campaign CRUD
// ========================================
async function listCampaigns(filters = {}) {
    const conditions = [];
    const values = [];
    let paramIndex = 1;
    if (filters.status) {
        conditions.push(`c.status = $${paramIndex++}`);
        values.push(filters.status);
    }
    if (filters.search) {
        conditions.push(`(c.name ILIKE $${paramIndex} OR c.description ILIKE $${paramIndex})`);
        values.push(`%${filters.search}%`);
        paramIndex++;
    }
    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 50, 100);
    const offset = (page - 1) * limit;
    const [dataResult, countResult] = await Promise.all([
        index_js_1.pool.query(`SELECT c.*, t.name as template_name, t.slug as template_slug
       FROM email_campaigns c
       LEFT JOIN email_templates t ON c.template_id = t.id
       ${where}
       ORDER BY c.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`, [...values, limit, offset]),
        index_js_1.pool.query(`SELECT COUNT(*) FROM email_campaigns c ${where}`, values),
    ]);
    return {
        campaigns: dataResult.rows,
        total: parseInt(countResult.rows[0].count, 10),
    };
}
async function getCampaign(id) {
    const result = await index_js_1.pool.query(`SELECT c.*, t.name as template_name, t.slug as template_slug
     FROM email_campaigns c
     LEFT JOIN email_templates t ON c.template_id = t.id
     WHERE c.id = $1`, [id]);
    return result.rows[0] || null;
}
async function createCampaign(input, createdBy) {
    // Validate template exists
    const templateCheck = await index_js_1.pool.query(`SELECT id FROM email_templates WHERE id = $1 AND is_active = true`, [input.template_id]);
    if (templateCheck.rows.length === 0) {
        throw new Error('Template not found or inactive');
    }
    const result = await index_js_1.pool.query(`INSERT INTO email_campaigns (
      name, description, template_id, segment,
      send_rate_per_second, max_recipients, created_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *`, [
        input.name,
        input.description || null,
        input.template_id,
        JSON.stringify(input.segment || {}),
        input.send_rate_per_second || 5,
        input.max_recipients || 10000,
        createdBy,
    ]);
    return result.rows[0];
}
async function updateCampaign(id, input) {
    const existing = await getCampaign(id);
    if (!existing)
        return null;
    if (existing.status !== 'draft') {
        throw new Error('Can only update draft campaigns');
    }
    if (input.template_id) {
        const templateCheck = await index_js_1.pool.query(`SELECT id FROM email_templates WHERE id = $1 AND is_active = true`, [input.template_id]);
        if (templateCheck.rows.length === 0) {
            throw new Error('Template not found or inactive');
        }
    }
    const sets = [];
    const values = [id];
    let paramIndex = 2;
    if (input.name !== undefined) {
        sets.push(`name = $${paramIndex++}`);
        values.push(input.name);
    }
    if (input.description !== undefined) {
        sets.push(`description = $${paramIndex++}`);
        values.push(input.description);
    }
    if (input.template_id !== undefined) {
        sets.push(`template_id = $${paramIndex++}`);
        values.push(input.template_id);
    }
    if (input.segment !== undefined) {
        sets.push(`segment = $${paramIndex++}`);
        values.push(JSON.stringify(input.segment));
    }
    if (input.send_rate_per_second !== undefined) {
        sets.push(`send_rate_per_second = $${paramIndex++}`);
        values.push(input.send_rate_per_second);
    }
    if (input.max_recipients !== undefined) {
        sets.push(`max_recipients = $${paramIndex++}`);
        values.push(input.max_recipients);
    }
    sets.push(`updated_at = NOW()`);
    if (sets.length === 1)
        return existing;
    const result = await index_js_1.pool.query(`UPDATE email_campaigns SET ${sets.join(', ')} WHERE id = $1 RETURNING *`, values);
    return result.rows[0] || null;
}
async function deleteCampaign(id) {
    const existing = await getCampaign(id);
    if (!existing)
        return false;
    if (existing.status !== 'draft') {
        throw new Error('Can only delete draft campaigns');
    }
    const result = await index_js_1.pool.query(`DELETE FROM email_campaigns WHERE id = $1 AND status = 'draft'`, [id]);
    return (result.rowCount ?? 0) > 0;
}
function buildSegmentQuery(segment, countOnly = false) {
    const conditions = [];
    const values = [];
    let paramIndex = 1;
    // Always exclude globally unsubscribed users
    conditions.push(`ep.unsubscribed_all IS NOT TRUE`);
    // Tier filter
    if (segment.tiers && segment.tiers.length > 0) {
        conditions.push(`COALESCE(sub.tier, 'free') = ANY($${paramIndex++})`);
        values.push(segment.tiers);
    }
    // Lead status filter
    if (segment.leadStatuses && segment.leadStatuses.length > 0) {
        conditions.push(`u.lead_status = ANY($${paramIndex++})`);
        values.push(segment.leadStatuses);
    }
    // Lead score range
    if (segment.minLeadScore !== undefined) {
        conditions.push(`COALESCE(u.lead_score, 0) >= $${paramIndex++}`);
        values.push(segment.minLeadScore);
    }
    if (segment.maxLeadScore !== undefined) {
        conditions.push(`COALESCE(u.lead_score, 0) <= $${paramIndex++}`);
        values.push(segment.maxLeadScore);
    }
    // Verified domain
    if (segment.verifiedDomain === true) {
        conditions.push(`EXISTS (SELECT 1 FROM sites s2 WHERE s2.created_by = u.id AND s2.verified = true)`);
    }
    // Audit count
    if (segment.auditCountMin !== undefined) {
        conditions.push(`COALESCE(audit_ct.cnt, 0) >= $${paramIndex++}`);
        values.push(segment.auditCountMin);
    }
    if (segment.auditCountMax !== undefined) {
        conditions.push(`COALESCE(audit_ct.cnt, 0) <= $${paramIndex++}`);
        values.push(segment.auditCountMax);
    }
    // Last login
    if (segment.lastLoginAfter) {
        conditions.push(`u.last_login_at >= $${paramIndex++}`);
        values.push(segment.lastLoginAfter);
    }
    if (segment.lastLoginBefore) {
        conditions.push(`u.last_login_at <= $${paramIndex++}`);
        values.push(segment.lastLoginBefore);
    }
    // Registration date
    if (segment.registeredAfter) {
        conditions.push(`u.created_at >= $${paramIndex++}`);
        values.push(segment.registeredAfter);
    }
    if (segment.registeredBefore) {
        conditions.push(`u.created_at <= $${paramIndex++}`);
        values.push(segment.registeredBefore);
    }
    // Exclude specific users
    if (segment.excludeUserIds && segment.excludeUserIds.length > 0) {
        conditions.push(`u.id != ALL($${paramIndex++})`);
        values.push(segment.excludeUserIds);
    }
    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const selectClause = countOnly
        ? `SELECT COUNT(DISTINCT u.id) as count`
        : `SELECT DISTINCT u.id, u.email, u.first_name`;
    const sql = `
    ${selectClause}
    FROM users u
    LEFT JOIN LATERAL (
      SELECT sub2.tier FROM subscriptions sub2
      JOIN sites s ON s.organization_id = sub2.organization_id
      WHERE s.created_by = u.id LIMIT 1
    ) sub ON true
    LEFT JOIN LATERAL (
      SELECT COUNT(*) as cnt FROM audit_jobs WHERE user_id = u.id
    ) audit_ct ON true
    LEFT JOIN email_preferences ep ON ep.user_id = u.id
    ${where}`;
    return { sql, values };
}
async function resolveSegment(segment) {
    const { sql, values } = buildSegmentQuery(segment, false);
    const result = await index_js_1.pool.query(sql, values);
    return result.rows;
}
async function getAudienceCount(segment) {
    const { sql, values } = buildSegmentQuery(segment, true);
    const result = await index_js_1.pool.query(sql, values);
    return parseInt(result.rows[0].count, 10);
}
// ========================================
// Lifecycle State Machine
// ========================================
async function launchCampaign(id) {
    const campaign = await getCampaign(id);
    if (!campaign)
        throw new Error('Campaign not found');
    if (campaign.status !== 'draft' && campaign.status !== 'scheduled') {
        throw new Error(`Cannot launch campaign with status: ${campaign.status}`);
    }
    // Resolve segment
    const users = await resolveSegment(campaign.segment);
    if (users.length === 0) {
        throw new Error('No recipients match the segment criteria');
    }
    // Enforce max_recipients
    const recipients = users.slice(0, campaign.max_recipients);
    // Get template for subject line
    const templateResult = await index_js_1.pool.query(`SELECT slug, subject FROM email_templates WHERE id = $1`, [campaign.template_id]);
    if (templateResult.rows.length === 0) {
        throw new Error('Campaign template not found');
    }
    const client = await index_js_1.pool.connect();
    try {
        await client.query('BEGIN');
        // Bulk-insert email_sends with status=queued
        const insertValues = [];
        const insertPlaceholders = [];
        let pIdx = 1;
        for (const user of recipients) {
            insertPlaceholders.push(`($${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, 'queued')`);
            insertValues.push(campaign.template_id, id, user.id, user.email, templateResult.rows[0].subject, JSON.stringify({ firstName: user.first_name || 'there' }));
        }
        await client.query(`INSERT INTO email_sends (template_id, campaign_id, user_id, to_email, subject, variables, status)
       VALUES ${insertPlaceholders.join(', ')}`, insertValues);
        // Update campaign
        const stats = { ...DEFAULT_STATS, total: recipients.length, queued: recipients.length };
        await client.query(`UPDATE email_campaigns
       SET status = 'sending', audience_count = $2, stats = $3,
           started_at = NOW(), updated_at = NOW()
       WHERE id = $1`, [id, recipients.length, JSON.stringify(stats)]);
        await client.query('COMMIT');
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
    return (await getCampaign(id));
}
async function scheduleCampaign(id, scheduledAt) {
    const campaign = await getCampaign(id);
    if (!campaign)
        throw new Error('Campaign not found');
    if (campaign.status !== 'draft') {
        throw new Error('Can only schedule draft campaigns');
    }
    const scheduledDate = new Date(scheduledAt);
    if (scheduledDate <= new Date()) {
        throw new Error('Scheduled time must be in the future');
    }
    await index_js_1.pool.query(`UPDATE email_campaigns
     SET status = 'scheduled', scheduled_at = $2, updated_at = NOW()
     WHERE id = $1`, [id, scheduledAt]);
    return (await getCampaign(id));
}
async function pauseCampaign(id) {
    const campaign = await getCampaign(id);
    if (!campaign)
        throw new Error('Campaign not found');
    if (campaign.status !== 'sending') {
        throw new Error('Can only pause sending campaigns');
    }
    await index_js_1.pool.query(`UPDATE email_campaigns SET status = 'paused', updated_at = NOW() WHERE id = $1`, [id]);
    return (await getCampaign(id));
}
async function resumeCampaign(id) {
    const campaign = await getCampaign(id);
    if (!campaign)
        throw new Error('Campaign not found');
    if (campaign.status !== 'paused') {
        throw new Error('Can only resume paused campaigns');
    }
    await index_js_1.pool.query(`UPDATE email_campaigns SET status = 'sending', updated_at = NOW() WHERE id = $1`, [id]);
    return (await getCampaign(id));
}
async function cancelCampaign(id) {
    const campaign = await getCampaign(id);
    if (!campaign)
        throw new Error('Campaign not found');
    if (campaign.status !== 'sending' && campaign.status !== 'paused' && campaign.status !== 'scheduled') {
        throw new Error('Cannot cancel campaign with status: ' + campaign.status);
    }
    const client = await index_js_1.pool.connect();
    try {
        await client.query('BEGIN');
        // Delete remaining queued sends
        const deleted = await client.query(`DELETE FROM email_sends WHERE campaign_id = $1 AND status = 'queued'`, [id]);
        // Update stats to remove queued count
        const deletedCount = deleted.rowCount ?? 0;
        if (deletedCount > 0) {
            await client.query(`UPDATE email_campaigns
         SET stats = jsonb_set(
           jsonb_set(stats, '{queued}', '0'),
           '{failed}', ((COALESCE((stats->>'failed')::int, 0) + $2)::text)::jsonb
         )
         WHERE id = $1`, [id, deletedCount]);
        }
        await client.query(`UPDATE email_campaigns
       SET status = 'cancelled', cancelled_at = NOW(), updated_at = NOW()
       WHERE id = $1`, [id]);
        await client.query('COMMIT');
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
    return (await getCampaign(id));
}
async function completeCampaign(id) {
    await index_js_1.pool.query(`UPDATE email_campaigns
     SET status = 'sent', completed_at = NOW(), updated_at = NOW()
     WHERE id = $1 AND status = 'sending'`, [id]);
}
// ========================================
// Stats
// ========================================
async function incrementCampaignStat(campaignId, field, decrementField) {
    let query;
    if (decrementField) {
        query = `
      UPDATE email_campaigns
      SET stats = jsonb_set(
        jsonb_set(stats, '{${field}}', ((COALESCE((stats->>'${field}')::int, 0) + 1)::text)::jsonb),
        '{${decrementField}}', (GREATEST(COALESCE((stats->>'${decrementField}')::int, 0) - 1, 0)::text)::jsonb
      ), updated_at = NOW()
      WHERE id = $1`;
    }
    else {
        query = `
      UPDATE email_campaigns
      SET stats = jsonb_set(stats, '{${field}}', ((COALESCE((stats->>'${field}')::int, 0) + 1)::text)::jsonb),
          updated_at = NOW()
      WHERE id = $1`;
    }
    await index_js_1.pool.query(query, [campaignId]);
}
async function getCampaignSends(campaignId, filters = {}) {
    const conditions = ['es.campaign_id = $1'];
    const values = [campaignId];
    let paramIndex = 2;
    if (filters.status) {
        conditions.push(`es.status = $${paramIndex++}`);
        values.push(filters.status);
    }
    const where = `WHERE ${conditions.join(' AND ')}`;
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 50, 100);
    const offset = (page - 1) * limit;
    const [dataResult, countResult] = await Promise.all([
        index_js_1.pool.query(`SELECT es.id, es.to_email, es.status, es.resend_message_id,
              es.sent_at, es.opened_at, es.clicked_at, es.error_message, es.created_at
       FROM email_sends es
       ${where}
       ORDER BY es.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`, [...values, limit, offset]),
        index_js_1.pool.query(`SELECT COUNT(*) FROM email_sends es ${where}`, values),
    ]);
    return {
        sends: dataResult.rows,
        total: parseInt(countResult.rows[0].count, 10),
    };
}
async function getEmailSends(filters = {}) {
    const conditions = [];
    const values = [];
    let paramIndex = 1;
    if (filters.status) {
        conditions.push(`es.status = $${paramIndex++}`);
        values.push(filters.status);
    }
    if (filters.campaignId) {
        conditions.push(`es.campaign_id = $${paramIndex++}`);
        values.push(filters.campaignId);
    }
    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 50, 100);
    const offset = (page - 1) * limit;
    const [dataResult, countResult] = await Promise.all([
        index_js_1.pool.query(`SELECT es.id, es.to_email, es.subject, es.status, es.resend_message_id,
              es.sent_at, es.opened_at, es.clicked_at, es.error_message, es.created_at,
              es.campaign_id, t.name as template_name, t.slug as template_slug
       FROM email_sends es
       LEFT JOIN email_templates t ON es.template_id = t.id
       ${where}
       ORDER BY es.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`, [...values, limit, offset]),
        index_js_1.pool.query(`SELECT COUNT(*) FROM email_sends es ${where}`, values),
    ]);
    return {
        sends: dataResult.rows,
        total: parseInt(countResult.rows[0].count, 10),
    };
}
async function getEmailAnalytics(days = 30) {
    const result = await index_js_1.pool.query(`SELECT
      d.date::text as date,
      COALESCE(s.sent, 0) as sent,
      COALESCE(s.delivered, 0) as delivered,
      COALESCE(s.opened, 0) as opened,
      COALESCE(s.clicked, 0) as clicked,
      COALESCE(s.bounced, 0) as bounced,
      COALESCE(s.complained, 0) as complained
    FROM generate_series(
      CURRENT_DATE - ($1 || ' days')::interval,
      CURRENT_DATE,
      '1 day'::interval
    ) d(date)
    LEFT JOIN LATERAL (
      SELECT
        COUNT(*) FILTER (WHERE status IN ('sent', 'delivered', 'opened', 'clicked')) as sent,
        COUNT(*) FILTER (WHERE status IN ('delivered', 'opened', 'clicked')) as delivered,
        COUNT(*) FILTER (WHERE status IN ('opened', 'clicked')) as opened,
        COUNT(*) FILTER (WHERE status = 'clicked') as clicked,
        COUNT(*) FILTER (WHERE status = 'bounced') as bounced,
        COUNT(*) FILTER (WHERE status = 'complained') as complained
      FROM email_sends
      WHERE sent_at::date = d.date::date
    ) s ON true
    ORDER BY d.date`, [days]);
    return result.rows;
}
async function getTemplatePerformance() {
    const result = await index_js_1.pool.query(`SELECT
      t.id as template_id,
      t.name as template_name,
      t.slug as template_slug,
      COUNT(es.id) as total_sent,
      COUNT(es.id) FILTER (WHERE es.status IN ('delivered', 'opened', 'clicked')) as delivered,
      COUNT(es.id) FILTER (WHERE es.status IN ('opened', 'clicked')) as opened,
      COUNT(es.id) FILTER (WHERE es.status = 'clicked') as clicked,
      COUNT(es.id) FILTER (WHERE es.status = 'bounced') as bounced,
      CASE WHEN COUNT(es.id) > 0
        THEN ROUND(COUNT(es.id) FILTER (WHERE es.status IN ('delivered', 'opened', 'clicked'))::numeric / COUNT(es.id) * 100, 1)
        ELSE 0 END as delivery_rate,
      CASE WHEN COUNT(es.id) > 0
        THEN ROUND(COUNT(es.id) FILTER (WHERE es.status IN ('opened', 'clicked'))::numeric / COUNT(es.id) * 100, 1)
        ELSE 0 END as open_rate,
      CASE WHEN COUNT(es.id) > 0
        THEN ROUND(COUNT(es.id) FILTER (WHERE es.status = 'clicked')::numeric / COUNT(es.id) * 100, 1)
        ELSE 0 END as click_rate
    FROM email_templates t
    INNER JOIN email_sends es ON es.template_id = t.id
    GROUP BY t.id, t.name, t.slug
    ORDER BY total_sent DESC`);
    return result.rows;
}
//# sourceMappingURL=email-campaign.service.js.map