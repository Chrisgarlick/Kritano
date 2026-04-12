"use strict";
/**
 * SEO Service — Manages page SEO metadata overrides
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.setPool = setPool;
exports.getAllSeoEntries = getAllSeoEntries;
exports.getSeoByPath = getSeoByPath;
exports.upsertSeo = upsertSeo;
exports.deleteSeo = deleteSeo;
let pool;
function setPool(dbPool) {
    pool = dbPool;
}
async function getAllSeoEntries() {
    const result = await pool.query('SELECT * FROM page_seo ORDER BY route_path ASC');
    return result.rows;
}
async function getSeoByPath(routePath) {
    const result = await pool.query('SELECT * FROM page_seo WHERE route_path = $1', [routePath]);
    return result.rows[0] || null;
}
async function upsertSeo(routePath, data, adminId) {
    const result = await pool.query(`INSERT INTO page_seo (route_path, title, description, keywords, og_title, og_description, og_image, og_type, twitter_card, canonical_url, featured_image, structured_data, noindex, updated_at, updated_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), $14)
     ON CONFLICT (route_path)
     DO UPDATE SET
       title = $2,
       description = $3,
       keywords = $4,
       og_title = $5,
       og_description = $6,
       og_image = $7,
       og_type = $8,
       twitter_card = $9,
       canonical_url = $10,
       featured_image = $11,
       structured_data = $12,
       noindex = $13,
       updated_at = NOW(),
       updated_by = $14
     RETURNING *`, [
        routePath,
        data.title ?? null,
        data.description ?? null,
        data.keywords ?? null,
        data.og_title ?? null,
        data.og_description ?? null,
        data.og_image ?? null,
        data.og_type ?? 'website',
        data.twitter_card ?? 'summary_large_image',
        data.canonical_url ?? null,
        data.featured_image ?? null,
        data.structured_data ? JSON.stringify(data.structured_data) : null,
        data.noindex ?? false,
        adminId,
    ]);
    return result.rows[0];
}
async function deleteSeo(routePath) {
    await pool.query('DELETE FROM page_seo WHERE route_path = $1', [routePath]);
}
//# sourceMappingURL=seo.service.js.map