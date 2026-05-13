"use strict";
/**
 * Gated Resource Service
 *
 * Lifecycle for the gated resource library:
 *   - list / get catalogue entries
 *   - capture an email lead and issue a download token
 *   - issue a download token for a logged-in user (no email gate)
 *   - validate a token against a resource slug
 *   - record each download for analytics, lead scoring, and abuse tracking
 *
 * Downstream side effects (CRM trigger event, lead scoring points, email send)
 * are wired in milestones 6-8 and intentionally live outside this module so
 * the persistence layer stays a single-responsibility primitive.
 *
 * See /docs/gated-resources.md for the full feature plan.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.__internal = void 0;
exports.setPool = setPool;
exports.listPublishedResources = listPublishedResources;
exports.getResourceBySlug = getResourceBySlug;
exports.captureEmailAndIssueToken = captureEmailAndIssueToken;
exports.issueTokenForUser = issueTokenForUser;
exports.validateToken = validateToken;
exports.recordDownload = recordDownload;
exports.linkLeadsToUser = linkLeadsToUser;
exports.adminListResources = adminListResources;
exports.adminUpdateResource = adminUpdateResource;
exports.adminCreateResource = adminCreateResource;
exports.getResourceById = getResourceById;
exports.adminRegenerateContentHash = adminRegenerateContentHash;
exports.adminListLeads = adminListLeads;
exports.adminExportLeads = adminExportLeads;
exports.extractRequestContext = extractRequestContext;
const crypto_1 = __importDefault(require("crypto"));
const crypto_utils_js_1 = require("../utils/crypto.utils.js");
let pool;
function setPool(dbPool) {
    pool = dbPool;
}
const TOKEN_TTL_DAYS = 7;
function getIpPepper() {
    const pepper = process.env.IP_HASH_PEPPER || process.env.JWT_SECRET;
    if (!pepper) {
        throw new Error('IP_HASH_PEPPER or JWT_SECRET must be set to hash IPs');
    }
    return pepper;
}
function hashIp(ip) {
    if (!ip)
        return null;
    return crypto_1.default
        .createHash('sha256')
        .update(`${ip}:${getIpPepper()}`)
        .digest('hex');
}
function normaliseEmail(email) {
    return email.trim().toLowerCase();
}
function expiryDate() {
    return new Date(Date.now() + TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
}
// ── Catalogue reads ─────────────────────────────────────────────────
async function listPublishedResources(filters = {}) {
    const conditions = ['published = true'];
    const values = [];
    if (filters.category) {
        values.push(filters.category);
        conditions.push(`category = $${values.length}`);
    }
    const result = await pool.query(`SELECT id, slug, title, subtitle, hook, category, audience, formats,
            page_count, download_count, updated_at
       FROM gated_resources
      WHERE ${conditions.join(' AND ')}
      ORDER BY download_count DESC, updated_at DESC`, values);
    return result.rows;
}
async function getResourceBySlug(slug) {
    const result = await pool.query(`SELECT * FROM gated_resources WHERE slug = $1`, [slug]);
    return result.rows[0] ?? null;
}
async function captureEmailAndIssueToken(input) {
    const email = input.email.trim();
    const emailNormalised = normaliseEmail(email);
    if (!emailNormalised) {
        throw new Error('email is required');
    }
    const ipHash = hashIp(input.request.ip);
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        // Upsert lead. On a returning email we honour the newer newsletter opt-in
        // (consent grants stay; opt-outs are surfaced via the email-preference
        // unsubscribe flow, not via re-submitting the form).
        const leadResult = await client.query(`INSERT INTO gated_resource_leads (
          resource_id, email, email_normalised, consent_newsletter,
          referer, utm_source, utm_medium, utm_campaign, ip_hash, user_agent
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (resource_id, email_normalised) DO UPDATE
          SET consent_newsletter =
                gated_resource_leads.consent_newsletter OR EXCLUDED.consent_newsletter,
              user_agent = COALESCE(EXCLUDED.user_agent, gated_resource_leads.user_agent),
              referer = COALESCE(EXCLUDED.referer, gated_resource_leads.referer)
        RETURNING *, (xmax = 0) AS _was_inserted`, [
            input.resource.id,
            email,
            emailNormalised,
            input.consentNewsletter,
            input.request.referer ?? null,
            input.request.utmSource ?? null,
            input.request.utmMedium ?? null,
            input.request.utmCampaign ?? null,
            ipHash,
            input.request.userAgent ?? null,
        ]);
        const leadRow = leadResult.rows[0];
        const isNewLead = leadRow._was_inserted === true;
        const token = (0, crypto_utils_js_1.generateSecureToken)();
        await client.query(`INSERT INTO gated_resource_tokens (token, resource_id, lead_id, expires_at)
        VALUES ($1, $2, $3, $4)`, [token, input.resource.id, leadRow.id, expiryDate()]);
        await client.query('COMMIT');
        const { _was_inserted: _drop, ...lead } = leadRow;
        void _drop;
        return { token, lead, isNewLead };
    }
    catch (err) {
        await client.query('ROLLBACK');
        throw err;
    }
    finally {
        client.release();
    }
}
async function issueTokenForUser(resourceId, userId) {
    const token = (0, crypto_utils_js_1.generateSecureToken)();
    await pool.query(`INSERT INTO gated_resource_tokens (token, resource_id, user_id, expires_at)
      VALUES ($1, $2, $3, $4)`, [token, resourceId, userId, expiryDate()]);
    return token;
}
/**
 * Returns the token + resource pair if the token is unexpired AND its
 * resource_id matches the supplied slug. Returns null for invalid, expired,
 * or wrong-resource tokens. The route handler maps null → 401/403 without
 * disclosing which check failed.
 */
async function validateToken(token, resourceSlug) {
    const tokenResult = await pool.query(`SELECT * FROM gated_resource_tokens
      WHERE token = $1 AND expires_at > NOW()`, [token]);
    const tokenRow = tokenResult.rows[0];
    if (!tokenRow)
        return null;
    const resourceResult = await pool.query(`SELECT * FROM gated_resources WHERE id = $1 AND slug = $2`, [tokenRow.resource_id, resourceSlug]);
    const resource = resourceResult.rows[0];
    if (!resource)
        return null;
    return { token: tokenRow, resource };
}
/**
 * Persist a download row, bump the resource counter, and (if applicable)
 * tick the token's use counter. Wrapped in a single transaction so the
 * counters stay consistent with the audit-log table.
 */
async function recordDownload(input) {
    const ipHash = hashIp(input.request.ip);
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query(`INSERT INTO gated_resource_downloads (
          resource_id, format, lead_id, user_id, token_id, ip_hash, referer
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`, [
            input.resourceId,
            input.format,
            input.leadId ?? null,
            input.userId ?? null,
            input.token ?? null,
            ipHash,
            input.request.referer ?? null,
        ]);
        await client.query(`UPDATE gated_resources
          SET download_count = download_count + 1,
              updated_at = NOW()
        WHERE id = $1`, [input.resourceId]);
        if (input.token) {
            await client.query(`UPDATE gated_resource_tokens
            SET uses_count = uses_count + 1,
                last_used_at = NOW()
          WHERE token = $1`, [input.token]);
        }
        await client.query('COMMIT');
    }
    catch (err) {
        await client.query('ROLLBACK');
        throw err;
    }
    finally {
        client.release();
    }
}
// ── Lead-to-user linking (called from auth/register) ────────────────
/**
 * Link any prior anonymous lead rows for this email to the new user_id.
 * Idempotent: only updates rows where user_id is currently NULL.
 * Returns the number of rows linked.
 */
async function linkLeadsToUser(email, userId) {
    const emailNormalised = normaliseEmail(email);
    const result = await pool.query(`UPDATE gated_resource_leads
        SET user_id = $1
      WHERE email_normalised = $2
        AND user_id IS NULL`, [userId, emailNormalised]);
    return result.rowCount ?? 0;
}
// ── Admin lifecycle (super-admin CMS) ───────────────────────────────
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const SOURCE_BASE_DIR = path_1.default.resolve(process.cwd(), 'src', 'data');
async function adminListResources() {
    const result = await pool.query(`SELECT
        r.id, r.slug, r.title, r.category, r.formats, r.published,
        r.page_count, r.download_count, r.created_at, r.updated_at,
        COALESCE((SELECT COUNT(*) FROM gated_resource_leads WHERE resource_id = r.id), 0)::int AS lead_count,
        COALESCE((SELECT COUNT(*) FROM gated_resource_downloads
                   WHERE resource_id = r.id
                     AND downloaded_at >= NOW() - INTERVAL '30 days'), 0)::int AS downloads_30d
       FROM gated_resources r
      ORDER BY r.updated_at DESC`);
    return result.rows;
}
async function adminUpdateResource(id, patch) {
    const fields = [];
    const values = [];
    for (const [key, value] of Object.entries(patch)) {
        if (value === undefined)
            continue;
        values.push(value);
        fields.push(`${key} = $${values.length}`);
    }
    if (fields.length === 0) {
        return getResourceById(id);
    }
    values.push(id);
    const result = await pool.query(`UPDATE gated_resources
       SET ${fields.join(', ')}, updated_at = NOW()
     WHERE id = $${values.length}
     RETURNING *`, values);
    return result.rows[0] ?? null;
}
async function adminCreateResource(input) {
    const hash = await computeContentHashFromPath(input.source_md_path).catch(() => 'pending');
    const result = await pool.query(`INSERT INTO gated_resources (
        slug, title, subtitle, hook, category, audience, description,
        preview_md, source_md_path, formats, content_hash, page_count, published,
        focus_keyword, secondary_keywords, seo_title, seo_description, tags
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, false,
              $13, $14, $15, $16, $17)
      RETURNING *`, [
        input.slug,
        input.title,
        input.subtitle ?? null,
        input.hook,
        input.category,
        input.audience ?? null,
        input.description,
        input.preview_md,
        input.source_md_path,
        input.formats ?? ['md', 'pdf'],
        hash,
        input.page_count ?? null,
        input.focus_keyword ?? null,
        input.secondary_keywords ?? [],
        input.seo_title ?? null,
        input.seo_description ?? null,
        input.tags ?? [],
    ]);
    return result.rows[0];
}
async function getResourceById(id) {
    const result = await pool.query(`SELECT * FROM gated_resources WHERE id = $1`, [id]);
    return result.rows[0] ?? null;
}
/**
 * Recompute the sha256 of a resource's source MD on disk and update the
 * row. Use this after editing the source file outside the admin UI.
 */
async function adminRegenerateContentHash(id) {
    const resource = await getResourceById(id);
    if (!resource)
        return null;
    const hash = await computeContentHashFromPath(resource.source_md_path);
    await pool.query(`UPDATE gated_resources SET content_hash = $1, updated_at = NOW() WHERE id = $2`, [hash, id]);
    return { content_hash: hash };
}
async function computeContentHashFromPath(relativePath) {
    const sourcePath = path_1.default.resolve(SOURCE_BASE_DIR, relativePath);
    // Containment check — only allow paths inside server/src/data
    const baseWithSep = SOURCE_BASE_DIR.endsWith(path_1.default.sep)
        ? SOURCE_BASE_DIR
        : SOURCE_BASE_DIR + path_1.default.sep;
    if (!sourcePath.startsWith(baseWithSep) && sourcePath !== SOURCE_BASE_DIR) {
        throw new Error(`source_md_path escapes data directory: ${relativePath}`);
    }
    const contents = await promises_1.default.readFile(sourcePath, 'utf-8');
    return crypto_1.default.createHash('sha256').update(contents).digest('hex');
}
async function adminListLeads(resourceId, filters = {}) {
    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.min(200, Math.max(1, filters.limit ?? 50));
    const offset = (page - 1) * limit;
    const [rowsResult, countResult] = await Promise.all([
        pool.query(`SELECT id, email, consent_newsletter, utm_source, utm_medium,
              utm_campaign, referer, user_id, created_at
         FROM gated_resource_leads
        WHERE resource_id = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3`, [resourceId, limit, offset]),
        pool.query(`SELECT COUNT(*)::text AS count FROM gated_resource_leads WHERE resource_id = $1`, [resourceId]),
    ]);
    return {
        leads: rowsResult.rows,
        total: parseInt(countResult.rows[0].count, 10),
    };
}
/**
 * Returns every lead row for a resource, suitable for CSV export.
 * No pagination; used only by the admin export endpoint.
 */
async function adminExportLeads(resourceId) {
    const result = await pool.query(`SELECT id, email, consent_newsletter, utm_source, utm_medium,
            utm_campaign, referer, user_id, created_at
       FROM gated_resource_leads
      WHERE resource_id = $1
      ORDER BY created_at DESC`, [resourceId]);
    return result.rows;
}
// ── Helpers exposed for tests and the route layer ──────────────────
exports.__internal = {
    hashIp,
    normaliseEmail,
};
// ── Express request → RequestContext extraction ────────────────────
/**
 * Pull the request fields the service needs out of an Express Request.
 * Lives here so callers do not couple to header names; tests use plain
 * RequestContext objects.
 */
function extractRequestContext(req) {
    const ua = req.headers['user-agent'];
    const ref = req.headers['referer'] ?? req.headers['referrer'];
    const utmSource = req.query.utm_source;
    const utmMedium = req.query.utm_medium;
    const utmCampaign = req.query.utm_campaign;
    return {
        ip: req.ip ?? null,
        userAgent: typeof ua === 'string' ? ua : null,
        referer: typeof ref === 'string' ? ref : null,
        utmSource: typeof utmSource === 'string' ? utmSource : null,
        utmMedium: typeof utmMedium === 'string' ? utmMedium : null,
        utmCampaign: typeof utmCampaign === 'string' ? utmCampaign : null,
    };
}
//# sourceMappingURL=gated-resource.service.js.map