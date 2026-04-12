"use strict";
/**
 * Marketing Content Service
 *
 * CRUD for marketing campaigns (labels) and marketing content items.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.listCampaigns = listCampaigns;
exports.createCampaign = createCampaign;
exports.updateCampaign = updateCampaign;
exports.deleteCampaign = deleteCampaign;
exports.listContent = listContent;
exports.getContentStats = getContentStats;
exports.getContent = getContent;
exports.createContent = createContent;
exports.updateContent = updateContent;
exports.deleteContent = deleteContent;
exports.updateContentStatus = updateContentStatus;
const index_js_1 = require("../db/index.js");
// ══════════════════════════════════════════════
// Campaigns
// ══════════════════════════════════════════════
async function listCampaigns() {
    const result = await index_js_1.pool.query(`SELECT mc.*,
            COALESCE(cnt.content_count, 0)::int AS content_count
     FROM marketing_campaigns mc
     LEFT JOIN (
       SELECT campaign_id, COUNT(*)::int AS content_count
       FROM marketing_content
       GROUP BY campaign_id
     ) cnt ON cnt.campaign_id = mc.id
     ORDER BY mc.created_at DESC`);
    return { campaigns: result.rows };
}
async function createCampaign(data, createdBy) {
    const result = await index_js_1.pool.query(`INSERT INTO marketing_campaigns (name, color, description, created_by)
     VALUES ($1, $2, $3, $4)
     RETURNING *`, [data.name, data.color || '#6366f1', data.description || null, createdBy]);
    return result.rows[0];
}
async function updateCampaign(id, data) {
    const sets = [];
    const params = [];
    let idx = 1;
    if (data.name !== undefined) {
        sets.push(`name = $${idx++}`);
        params.push(data.name);
    }
    if (data.color !== undefined) {
        sets.push(`color = $${idx++}`);
        params.push(data.color);
    }
    if (data.description !== undefined) {
        sets.push(`description = $${idx++}`);
        params.push(data.description);
    }
    if (sets.length === 0)
        return null;
    sets.push(`updated_at = NOW()`);
    params.push(id);
    const result = await index_js_1.pool.query(`UPDATE marketing_campaigns SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`, params);
    return result.rows[0] || null;
}
async function deleteCampaign(id) {
    await index_js_1.pool.query('DELETE FROM marketing_campaigns WHERE id = $1', [id]);
}
// ══════════════════════════════════════════════
// Content
// ══════════════════════════════════════════════
function stripMarkdown(text) {
    return text
        .replace(/[#*_~`>\[\]()!]/g, '')
        .replace(/\n+/g, ' ')
        .trim();
}
function computePreview(body) {
    const plain = stripMarkdown(body);
    return plain.length > 280 ? plain.slice(0, 280) + '...' : plain;
}
async function listContent(filters = {}) {
    const { platform, campaign_id, status, search, week_number, day_of_week, page = 1, limit = 25 } = filters;
    const conditions = [];
    const params = [];
    let paramIdx = 1;
    if (platform) {
        conditions.push(`mc.platform = $${paramIdx++}`);
        params.push(platform);
    }
    if (campaign_id) {
        conditions.push(`mc.campaign_id = $${paramIdx++}`);
        params.push(campaign_id);
    }
    if (status) {
        conditions.push(`mc.status = $${paramIdx++}`);
        params.push(status);
    }
    if (search) {
        conditions.push(`(mc.title ILIKE $${paramIdx} OR mc.body ILIKE $${paramIdx})`);
        params.push(`%${search}%`);
        paramIdx++;
    }
    if (week_number) {
        conditions.push(`mc.week_number = $${paramIdx++}`);
        params.push(week_number);
    }
    if (day_of_week) {
        conditions.push(`mc.day_of_week = $${paramIdx++}`);
        params.push(day_of_week);
    }
    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * limit;
    const [contentResult, countResult] = await Promise.all([
        index_js_1.pool.query(`SELECT mc.*,
              row_to_json(camp.*) AS campaign
       FROM marketing_content mc
       LEFT JOIN marketing_campaigns camp ON camp.id = mc.campaign_id
       ${where}
       ORDER BY mc.week_number ASC NULLS LAST, mc.day_of_week ASC NULLS LAST, mc.created_at DESC
       LIMIT $${paramIdx++} OFFSET $${paramIdx}`, [...params, limit, offset]),
        index_js_1.pool.query(`SELECT COUNT(*)::int AS total FROM marketing_content mc ${where}`, params),
    ]);
    return {
        content: contentResult.rows,
        total: countResult.rows[0].total,
    };
}
async function getContentStats() {
    const [totalResult, platformResult, statusResult, campaignResult] = await Promise.all([
        index_js_1.pool.query('SELECT COUNT(*)::int AS total FROM marketing_content'),
        index_js_1.pool.query(`SELECT platform, COUNT(*)::int AS count
       FROM marketing_content
       GROUP BY platform`),
        index_js_1.pool.query(`SELECT status, COUNT(*)::int AS count
       FROM marketing_content
       GROUP BY status`),
        index_js_1.pool.query(`SELECT mc.id, mc.name, COUNT(con.id)::int AS count
       FROM marketing_campaigns mc
       LEFT JOIN marketing_content con ON con.campaign_id = mc.id
       GROUP BY mc.id, mc.name
       ORDER BY count DESC`),
    ]);
    const by_platform = {};
    for (const row of platformResult.rows) {
        by_platform[row.platform] = row.count;
    }
    const by_status = {};
    for (const row of statusResult.rows) {
        by_status[row.status] = row.count;
    }
    return {
        total: totalResult.rows[0].total,
        by_platform,
        by_status,
        by_campaign: campaignResult.rows,
    };
}
async function getContent(id) {
    const result = await index_js_1.pool.query(`SELECT mc.*,
            row_to_json(camp.*) AS campaign
     FROM marketing_content mc
     LEFT JOIN marketing_campaigns camp ON camp.id = mc.campaign_id
     WHERE mc.id = $1`, [id]);
    return result.rows[0] || null;
}
async function createContent(data, createdBy) {
    const preview = computePreview(data.body);
    const charCount = stripMarkdown(data.body).length;
    const result = await index_js_1.pool.query(`INSERT INTO marketing_content (platform, title, body, preview, media, campaign_id, status, notes, char_count, week_number, day_of_week, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING *`, [
        data.platform,
        data.title || null,
        data.body,
        preview,
        JSON.stringify(data.media || []),
        data.campaign_id || null,
        data.status || 'draft',
        data.notes || null,
        charCount,
        data.week_number || null,
        data.day_of_week || null,
        createdBy,
    ]);
    // Return with campaign joined
    return getContent(result.rows[0].id);
}
async function updateContent(id, data) {
    const sets = [];
    const params = [];
    let idx = 1;
    if (data.platform !== undefined) {
        sets.push(`platform = $${idx++}`);
        params.push(data.platform);
    }
    if (data.title !== undefined) {
        sets.push(`title = $${idx++}`);
        params.push(data.title || null);
    }
    if (data.body !== undefined) {
        sets.push(`body = $${idx++}`);
        params.push(data.body);
        sets.push(`preview = $${idx++}`);
        params.push(computePreview(data.body));
        sets.push(`char_count = $${idx++}`);
        params.push(stripMarkdown(data.body).length);
    }
    if (data.media !== undefined) {
        sets.push(`media = $${idx++}`);
        params.push(JSON.stringify(data.media));
    }
    if (data.campaign_id !== undefined) {
        sets.push(`campaign_id = $${idx++}`);
        params.push(data.campaign_id);
    }
    if (data.status !== undefined) {
        sets.push(`status = $${idx++}`);
        params.push(data.status);
    }
    if (data.notes !== undefined) {
        sets.push(`notes = $${idx++}`);
        params.push(data.notes || null);
    }
    if (data.week_number !== undefined) {
        sets.push(`week_number = $${idx++}`);
        params.push(data.week_number);
    }
    if (data.day_of_week !== undefined) {
        sets.push(`day_of_week = $${idx++}`);
        params.push(data.day_of_week);
    }
    if (sets.length === 0)
        return null;
    sets.push(`updated_at = NOW()`);
    params.push(id);
    await index_js_1.pool.query(`UPDATE marketing_content SET ${sets.join(', ')} WHERE id = $${idx}`, params);
    return getContent(id);
}
async function deleteContent(id) {
    await index_js_1.pool.query('DELETE FROM marketing_content WHERE id = $1', [id]);
}
async function updateContentStatus(id, status) {
    await index_js_1.pool.query('UPDATE marketing_content SET status = $1, updated_at = NOW() WHERE id = $2', [status, id]);
    return getContent(id);
}
//# sourceMappingURL=marketing.service.js.map