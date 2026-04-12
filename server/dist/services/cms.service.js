"use strict";
/**
 * CMS Extras Service
 *
 * CRUD for audit advice templates, announcements, and success stories.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.listAdvice = listAdvice;
exports.getAdviceByRuleId = getAdviceByRuleId;
exports.upsertAdvice = upsertAdvice;
exports.updateAdvice = updateAdvice;
exports.deleteAdvice = deleteAdvice;
exports.listAnnouncements = listAnnouncements;
exports.getAnnouncementById = getAnnouncementById;
exports.createAnnouncement = createAnnouncement;
exports.updateAnnouncement = updateAnnouncement;
exports.deleteAnnouncement = deleteAnnouncement;
exports.getActiveAnnouncements = getActiveAnnouncements;
exports.dismissAnnouncement = dismissAnnouncement;
exports.listSuccessStories = listSuccessStories;
exports.getSuccessStoryById = getSuccessStoryById;
exports.createSuccessStory = createSuccessStory;
exports.updateSuccessStory = updateSuccessStory;
exports.deleteSuccessStory = deleteSuccessStory;
exports.getPublishedSuccessStories = getPublishedSuccessStories;
const index_js_1 = require("../db/index.js");
// ══════════════════════════════════════════════
// Audit Advice Templates
// ══════════════════════════════════════════════
async function listAdvice(filters = {}) {
    const { category, search, page = 1, limit = 50 } = filters;
    const conditions = [];
    const params = [];
    let paramIdx = 1;
    if (category) {
        conditions.push(`category = $${paramIdx++}`);
        params.push(category);
    }
    if (search) {
        conditions.push(`(rule_id ILIKE $${paramIdx} OR rule_name ILIKE $${paramIdx} OR description ILIKE $${paramIdx})`);
        params.push(`%${search}%`);
        paramIdx++;
    }
    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * limit;
    const [adviceResult, countResult] = await Promise.all([
        index_js_1.pool.query(`SELECT * FROM audit_advice_templates ${where}
       ORDER BY category, rule_name
       LIMIT $${paramIdx++} OFFSET $${paramIdx}`, [...params, limit, offset]),
        index_js_1.pool.query(`SELECT COUNT(*)::int AS total FROM audit_advice_templates ${where}`, params),
    ]);
    return {
        advice: adviceResult.rows,
        total: countResult.rows[0].total,
    };
}
async function getAdviceByRuleId(ruleId) {
    const result = await index_js_1.pool.query('SELECT * FROM audit_advice_templates WHERE rule_id = $1', [ruleId]);
    return result.rows[0] || null;
}
async function upsertAdvice(input, updatedBy) {
    const result = await index_js_1.pool.query(`INSERT INTO audit_advice_templates (rule_id, rule_name, category, severity, description, recommendation, learn_more_url, is_custom, updated_by, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8, NOW())
     ON CONFLICT (rule_id) DO UPDATE SET
       rule_name = EXCLUDED.rule_name,
       category = EXCLUDED.category,
       severity = EXCLUDED.severity,
       description = EXCLUDED.description,
       recommendation = EXCLUDED.recommendation,
       learn_more_url = EXCLUDED.learn_more_url,
       is_custom = true,
       updated_by = EXCLUDED.updated_by,
       updated_at = NOW()
     RETURNING *`, [
        input.rule_id,
        input.rule_name,
        input.category,
        input.severity,
        input.description,
        input.recommendation,
        input.learn_more_url || null,
        updatedBy,
    ]);
    return result.rows[0];
}
async function updateAdvice(ruleId, input, updatedBy) {
    const fields = [];
    const params = [];
    let paramIdx = 1;
    if (input.rule_name !== undefined) {
        fields.push(`rule_name = $${paramIdx++}`);
        params.push(input.rule_name);
    }
    if (input.category !== undefined) {
        fields.push(`category = $${paramIdx++}`);
        params.push(input.category);
    }
    if (input.severity !== undefined) {
        fields.push(`severity = $${paramIdx++}`);
        params.push(input.severity);
    }
    if (input.description !== undefined) {
        fields.push(`description = $${paramIdx++}`);
        params.push(input.description);
    }
    if (input.recommendation !== undefined) {
        fields.push(`recommendation = $${paramIdx++}`);
        params.push(input.recommendation);
    }
    if (input.learn_more_url !== undefined) {
        fields.push(`learn_more_url = $${paramIdx++}`);
        params.push(input.learn_more_url);
    }
    if (fields.length === 0)
        return getAdviceByRuleId(ruleId);
    fields.push(`is_custom = true`);
    fields.push(`updated_by = $${paramIdx++}`);
    params.push(updatedBy);
    fields.push(`updated_at = NOW()`);
    params.push(ruleId);
    const result = await index_js_1.pool.query(`UPDATE audit_advice_templates SET ${fields.join(', ')} WHERE rule_id = $${paramIdx} RETURNING *`, params);
    return result.rows[0] || null;
}
async function deleteAdvice(ruleId) {
    const result = await index_js_1.pool.query('DELETE FROM audit_advice_templates WHERE rule_id = $1', [ruleId]);
    return (result.rowCount ?? 0) > 0;
}
// ══════════════════════════════════════════════
// Announcements
// ══════════════════════════════════════════════
async function listAnnouncements(filters = {}) {
    const { active, page = 1, limit = 20 } = filters;
    const conditions = [];
    const params = [];
    let paramIdx = 1;
    if (active !== undefined) {
        conditions.push(`is_active = $${paramIdx++}`);
        params.push(active);
    }
    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * limit;
    const [result, countResult] = await Promise.all([
        index_js_1.pool.query(`SELECT * FROM announcements ${where}
       ORDER BY created_at DESC
       LIMIT $${paramIdx++} OFFSET $${paramIdx}`, [...params, limit, offset]),
        index_js_1.pool.query(`SELECT COUNT(*)::int AS total FROM announcements ${where}`, params),
    ]);
    return {
        announcements: result.rows,
        total: countResult.rows[0].total,
    };
}
async function getAnnouncementById(id) {
    const result = await index_js_1.pool.query('SELECT * FROM announcements WHERE id = $1', [id]);
    return result.rows[0] || null;
}
async function createAnnouncement(input, createdBy) {
    const result = await index_js_1.pool.query(`INSERT INTO announcements (title, body, type, target_tiers, cta_label, cta_url, starts_at, ends_at, is_dismissible, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`, [
        input.title,
        input.body,
        input.type || 'info',
        input.target_tiers || null,
        input.cta_label || null,
        input.cta_url || null,
        input.starts_at || new Date().toISOString(),
        input.ends_at || null,
        input.is_dismissible !== false,
        createdBy,
    ]);
    return result.rows[0];
}
async function updateAnnouncement(id, input) {
    const fields = [];
    const params = [];
    let paramIdx = 1;
    if (input.title !== undefined) {
        fields.push(`title = $${paramIdx++}`);
        params.push(input.title);
    }
    if (input.body !== undefined) {
        fields.push(`body = $${paramIdx++}`);
        params.push(input.body);
    }
    if (input.type !== undefined) {
        fields.push(`type = $${paramIdx++}`);
        params.push(input.type);
    }
    if (input.target_tiers !== undefined) {
        fields.push(`target_tiers = $${paramIdx++}`);
        params.push(input.target_tiers);
    }
    if (input.cta_label !== undefined) {
        fields.push(`cta_label = $${paramIdx++}`);
        params.push(input.cta_label);
    }
    if (input.cta_url !== undefined) {
        fields.push(`cta_url = $${paramIdx++}`);
        params.push(input.cta_url);
    }
    if (input.starts_at !== undefined) {
        fields.push(`starts_at = $${paramIdx++}`);
        params.push(input.starts_at);
    }
    if (input.ends_at !== undefined) {
        fields.push(`ends_at = $${paramIdx++}`);
        params.push(input.ends_at);
    }
    if (input.is_dismissible !== undefined) {
        fields.push(`is_dismissible = $${paramIdx++}`);
        params.push(input.is_dismissible);
    }
    if (input.is_active !== undefined) {
        fields.push(`is_active = $${paramIdx++}`);
        params.push(input.is_active);
    }
    if (fields.length === 0)
        return getAnnouncementById(id);
    params.push(id);
    const result = await index_js_1.pool.query(`UPDATE announcements SET ${fields.join(', ')} WHERE id = $${paramIdx} RETURNING *`, params);
    return result.rows[0] || null;
}
async function deleteAnnouncement(id) {
    const result = await index_js_1.pool.query('DELETE FROM announcements WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
}
async function getActiveAnnouncements(userTier, userId) {
    const result = await index_js_1.pool.query(`SELECT a.* FROM announcements a
     WHERE a.is_active = true
       AND a.starts_at <= NOW()
       AND (a.ends_at IS NULL OR a.ends_at > NOW())
       AND (a.target_tiers IS NULL OR $1 = ANY(a.target_tiers))
       AND NOT EXISTS (
         SELECT 1 FROM announcement_dismissals ad
         WHERE ad.announcement_id = a.id AND ad.user_id = $2
       )
     ORDER BY a.created_at DESC`, [userTier, userId]);
    return result.rows;
}
async function dismissAnnouncement(announcementId, userId) {
    try {
        await index_js_1.pool.query(`INSERT INTO announcement_dismissals (announcement_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT (announcement_id, user_id) DO NOTHING`, [announcementId, userId]);
        return true;
    }
    catch {
        return false;
    }
}
// ══════════════════════════════════════════════
// Success Stories
// ══════════════════════════════════════════════
async function listSuccessStories(filters = {}) {
    const { page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;
    const [result, countResult] = await Promise.all([
        index_js_1.pool.query(`SELECT * FROM success_stories
       ORDER BY display_order ASC, created_at DESC
       LIMIT $1 OFFSET $2`, [limit, offset]),
        index_js_1.pool.query('SELECT COUNT(*)::int AS total FROM success_stories'),
    ]);
    return {
        stories: result.rows,
        total: countResult.rows[0].total,
    };
}
async function getSuccessStoryById(id) {
    const result = await index_js_1.pool.query('SELECT * FROM success_stories WHERE id = $1', [id]);
    return result.rows[0] || null;
}
async function createSuccessStory(input, createdBy) {
    const result = await index_js_1.pool.query(`INSERT INTO success_stories (site_id, domain, category, score_before, score_after, headline, is_published, display_order, published_at, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`, [
        input.site_id || null,
        input.domain,
        input.category,
        input.score_before,
        input.score_after,
        input.headline,
        input.is_published || false,
        input.display_order || 0,
        input.is_published ? new Date().toISOString() : null,
        createdBy,
    ]);
    return result.rows[0];
}
async function updateSuccessStory(id, input) {
    const fields = [];
    const params = [];
    let paramIdx = 1;
    if (input.domain !== undefined) {
        fields.push(`domain = $${paramIdx++}`);
        params.push(input.domain);
    }
    if (input.category !== undefined) {
        fields.push(`category = $${paramIdx++}`);
        params.push(input.category);
    }
    if (input.score_before !== undefined) {
        fields.push(`score_before = $${paramIdx++}`);
        params.push(input.score_before);
    }
    if (input.score_after !== undefined) {
        fields.push(`score_after = $${paramIdx++}`);
        params.push(input.score_after);
    }
    if (input.headline !== undefined) {
        fields.push(`headline = $${paramIdx++}`);
        params.push(input.headline);
    }
    if (input.is_published !== undefined) {
        fields.push(`is_published = $${paramIdx++}`);
        params.push(input.is_published);
        if (input.is_published) {
            fields.push(`published_at = COALESCE(published_at, NOW())`);
        }
    }
    if (input.display_order !== undefined) {
        fields.push(`display_order = $${paramIdx++}`);
        params.push(input.display_order);
    }
    if (fields.length === 0)
        return getSuccessStoryById(id);
    params.push(id);
    const result = await index_js_1.pool.query(`UPDATE success_stories SET ${fields.join(', ')} WHERE id = $${paramIdx} RETURNING *`, params);
    return result.rows[0] || null;
}
async function deleteSuccessStory(id) {
    const result = await index_js_1.pool.query('DELETE FROM success_stories WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
}
async function getPublishedSuccessStories(limit = 6) {
    const result = await index_js_1.pool.query(`SELECT * FROM success_stories
     WHERE is_published = true
     ORDER BY display_order ASC, published_at DESC
     LIMIT $1`, [limit]);
    return result.rows;
}
//# sourceMappingURL=cms.service.js.map