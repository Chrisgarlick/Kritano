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

import crypto from 'crypto';
import { Pool, PoolClient } from 'pg';
import { generateSecureToken } from '../utils/crypto.utils.js';
import type {
  GatedResource,
  GatedResourceLead,
  GatedResourceToken,
  ResourceFormat,
  ResourceSummary,
} from '../types/gated-resource.types.js';

let pool: Pool;

export function setPool(dbPool: Pool): void {
  pool = dbPool;
}

const TOKEN_TTL_DAYS = 7;

// ── Request context ─────────────────────────────────────────────────

/**
 * The subset of an HTTP request the service needs to record a lead or a
 * download. Routes extract this from Express's Request and pass a plain
 * object so the service stays framework-agnostic and trivially testable.
 */
export interface RequestContext {
  ip?: string | null;
  userAgent?: string | null;
  referer?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
}

function getIpPepper(): string {
  const pepper = process.env.IP_HASH_PEPPER || process.env.JWT_SECRET;
  if (!pepper) {
    throw new Error('IP_HASH_PEPPER or JWT_SECRET must be set to hash IPs');
  }
  return pepper;
}

function hashIp(ip: string | null | undefined): string | null {
  if (!ip) return null;
  return crypto
    .createHash('sha256')
    .update(`${ip}:${getIpPepper()}`)
    .digest('hex');
}

function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

function expiryDate(): Date {
  return new Date(Date.now() + TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
}

// ── Catalogue reads ─────────────────────────────────────────────────

export async function listPublishedResources(
  filters: { category?: string } = {}
): Promise<ResourceSummary[]> {
  const conditions = ['published = true'];
  const values: unknown[] = [];
  if (filters.category) {
    values.push(filters.category);
    conditions.push(`category = $${values.length}`);
  }
  const result = await pool.query<ResourceSummary>(
    `SELECT id, slug, title, subtitle, hook, category, audience, formats,
            page_count, download_count, updated_at
       FROM gated_resources
      WHERE ${conditions.join(' AND ')}
      ORDER BY download_count DESC, updated_at DESC`,
    values
  );
  return result.rows;
}

export async function getResourceBySlug(
  slug: string
): Promise<GatedResource | null> {
  const result = await pool.query<GatedResource>(
    `SELECT * FROM gated_resources WHERE slug = $1`,
    [slug]
  );
  return result.rows[0] ?? null;
}

// ── Lead capture + token issuance ───────────────────────────────────

export interface CaptureEmailInput {
  resource: GatedResource;
  email: string;
  consentNewsletter: boolean;
  request: RequestContext;
}

export interface CaptureEmailResult {
  token: string;
  lead: GatedResourceLead;
  /** True if a brand-new lead row was inserted (vs a returning email). */
  isNewLead: boolean;
}

export async function captureEmailAndIssueToken(
  input: CaptureEmailInput
): Promise<CaptureEmailResult> {
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
    const leadResult = await client.query<
      GatedResourceLead & { _was_inserted: boolean }
    >(
      `INSERT INTO gated_resource_leads (
          resource_id, email, email_normalised, consent_newsletter,
          referer, utm_source, utm_medium, utm_campaign, ip_hash, user_agent
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (resource_id, email_normalised) DO UPDATE
          SET consent_newsletter =
                gated_resource_leads.consent_newsletter OR EXCLUDED.consent_newsletter,
              user_agent = COALESCE(EXCLUDED.user_agent, gated_resource_leads.user_agent),
              referer = COALESCE(EXCLUDED.referer, gated_resource_leads.referer)
        RETURNING *, (xmax = 0) AS _was_inserted`,
      [
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
      ]
    );
    const leadRow = leadResult.rows[0];
    const isNewLead = leadRow._was_inserted === true;

    const token = generateSecureToken();
    await client.query(
      `INSERT INTO gated_resource_tokens (token, resource_id, lead_id, expires_at)
        VALUES ($1, $2, $3, $4)`,
      [token, input.resource.id, leadRow.id, expiryDate()]
    );

    await client.query('COMMIT');

    const { _was_inserted: _drop, ...lead } = leadRow;
    void _drop;
    return { token, lead, isNewLead };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function issueTokenForUser(
  resourceId: string,
  userId: string
): Promise<string> {
  const token = generateSecureToken();
  await pool.query(
    `INSERT INTO gated_resource_tokens (token, resource_id, user_id, expires_at)
      VALUES ($1, $2, $3, $4)`,
    [token, resourceId, userId, expiryDate()]
  );
  return token;
}

// ── Token validation ────────────────────────────────────────────────

export interface ValidatedToken {
  token: GatedResourceToken;
  resource: GatedResource;
}

/**
 * Returns the token + resource pair if the token is unexpired AND its
 * resource_id matches the supplied slug. Returns null for invalid, expired,
 * or wrong-resource tokens. The route handler maps null → 401/403 without
 * disclosing which check failed.
 */
export async function validateToken(
  token: string,
  resourceSlug: string
): Promise<ValidatedToken | null> {
  const tokenResult = await pool.query<GatedResourceToken>(
    `SELECT * FROM gated_resource_tokens
      WHERE token = $1 AND expires_at > NOW()`,
    [token]
  );
  const tokenRow = tokenResult.rows[0];
  if (!tokenRow) return null;

  const resourceResult = await pool.query<GatedResource>(
    `SELECT * FROM gated_resources WHERE id = $1 AND slug = $2`,
    [tokenRow.resource_id, resourceSlug]
  );
  const resource = resourceResult.rows[0];
  if (!resource) return null;

  return { token: tokenRow, resource };
}

// ── Download recording ──────────────────────────────────────────────

export interface RecordDownloadInput {
  resourceId: string;
  format: ResourceFormat;
  userId?: string | null;
  leadId?: string | null;
  token?: string | null;
  request: RequestContext;
}

/**
 * Persist a download row, bump the resource counter, and (if applicable)
 * tick the token's use counter. Wrapped in a single transaction so the
 * counters stay consistent with the audit-log table.
 */
export async function recordDownload(
  input: RecordDownloadInput
): Promise<void> {
  const ipHash = hashIp(input.request.ip);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `INSERT INTO gated_resource_downloads (
          resource_id, format, lead_id, user_id, token_id, ip_hash, referer
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        input.resourceId,
        input.format,
        input.leadId ?? null,
        input.userId ?? null,
        input.token ?? null,
        ipHash,
        input.request.referer ?? null,
      ]
    );

    await client.query(
      `UPDATE gated_resources
          SET download_count = download_count + 1,
              updated_at = NOW()
        WHERE id = $1`,
      [input.resourceId]
    );

    if (input.token) {
      await client.query(
        `UPDATE gated_resource_tokens
            SET uses_count = uses_count + 1,
                last_used_at = NOW()
          WHERE token = $1`,
        [input.token]
      );
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ── Lead-to-user linking (called from auth/register) ────────────────

/**
 * Link any prior anonymous lead rows for this email to the new user_id.
 * Idempotent: only updates rows where user_id is currently NULL.
 * Returns the number of rows linked.
 */
export async function linkLeadsToUser(
  email: string,
  userId: string
): Promise<number> {
  const emailNormalised = normaliseEmail(email);
  const result = await pool.query(
    `UPDATE gated_resource_leads
        SET user_id = $1
      WHERE email_normalised = $2
        AND user_id IS NULL`,
    [userId, emailNormalised]
  );
  return result.rowCount ?? 0;
}

// ── Admin lifecycle (super-admin CMS) ───────────────────────────────

import fs from 'fs/promises';
import path from 'path';

const SOURCE_BASE_DIR = path.resolve(process.cwd(), 'src', 'data');

export interface AdminResourceSummary {
  id: string;
  slug: string;
  title: string;
  category: string;
  formats: ResourceFormat[];
  published: boolean;
  page_count: number | null;
  download_count: number;
  lead_count: number;
  downloads_30d: number;
  updated_at: string;
  created_at: string;
}

export async function adminListResources(): Promise<AdminResourceSummary[]> {
  const result = await pool.query<AdminResourceSummary>(
    `SELECT
        r.id, r.slug, r.title, r.category, r.formats, r.published,
        r.page_count, r.download_count, r.created_at, r.updated_at,
        COALESCE((SELECT COUNT(*) FROM gated_resource_leads WHERE resource_id = r.id), 0)::int AS lead_count,
        COALESCE((SELECT COUNT(*) FROM gated_resource_downloads
                   WHERE resource_id = r.id
                     AND downloaded_at >= NOW() - INTERVAL '30 days'), 0)::int AS downloads_30d
       FROM gated_resources r
      ORDER BY r.updated_at DESC`
  );
  return result.rows;
}

export interface AdminUpdateInput {
  title?: string;
  subtitle?: string | null;
  hook?: string;
  category?: string;
  audience?: string | null;
  description?: string;
  preview_md?: string;
  source_md_path?: string;
  formats?: ResourceFormat[];
  page_count?: number | null;
  published?: boolean;
}

export async function adminUpdateResource(
  id: string,
  patch: AdminUpdateInput
): Promise<GatedResource | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue;
    values.push(value);
    fields.push(`${key} = $${values.length}`);
  }
  if (fields.length === 0) {
    return getResourceById(id);
  }
  values.push(id);
  const result = await pool.query<GatedResource>(
    `UPDATE gated_resources
       SET ${fields.join(', ')}, updated_at = NOW()
     WHERE id = $${values.length}
     RETURNING *`,
    values
  );
  return result.rows[0] ?? null;
}

export interface AdminCreateInput {
  slug: string;
  title: string;
  subtitle?: string | null;
  hook: string;
  category: string;
  audience?: string | null;
  description: string;
  preview_md: string;
  source_md_path: string;
  formats?: ResourceFormat[];
  page_count?: number | null;
}

export async function adminCreateResource(
  input: AdminCreateInput
): Promise<GatedResource> {
  const hash = await computeContentHashFromPath(input.source_md_path).catch(
    () => 'pending'
  );
  const result = await pool.query<GatedResource>(
    `INSERT INTO gated_resources (
        slug, title, subtitle, hook, category, audience, description,
        preview_md, source_md_path, formats, content_hash, page_count, published
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, false)
      RETURNING *`,
    [
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
    ]
  );
  return result.rows[0];
}

export async function getResourceById(
  id: string
): Promise<GatedResource | null> {
  const result = await pool.query<GatedResource>(
    `SELECT * FROM gated_resources WHERE id = $1`,
    [id]
  );
  return result.rows[0] ?? null;
}

/**
 * Recompute the sha256 of a resource's source MD on disk and update the
 * row. Use this after editing the source file outside the admin UI.
 */
export async function adminRegenerateContentHash(
  id: string
): Promise<{ content_hash: string } | null> {
  const resource = await getResourceById(id);
  if (!resource) return null;
  const hash = await computeContentHashFromPath(resource.source_md_path);
  await pool.query(
    `UPDATE gated_resources SET content_hash = $1, updated_at = NOW() WHERE id = $2`,
    [hash, id]
  );
  return { content_hash: hash };
}

async function computeContentHashFromPath(relativePath: string): Promise<string> {
  const sourcePath = path.resolve(SOURCE_BASE_DIR, relativePath);
  // Containment check — only allow paths inside server/src/data
  const baseWithSep = SOURCE_BASE_DIR.endsWith(path.sep)
    ? SOURCE_BASE_DIR
    : SOURCE_BASE_DIR + path.sep;
  if (!sourcePath.startsWith(baseWithSep) && sourcePath !== SOURCE_BASE_DIR) {
    throw new Error(`source_md_path escapes data directory: ${relativePath}`);
  }
  const contents = await fs.readFile(sourcePath, 'utf-8');
  return crypto.createHash('sha256').update(contents).digest('hex');
}

// ── Lead listing for admin ──────────────────────────────────────────

export interface AdminLeadRow {
  id: string;
  email: string;
  consent_newsletter: boolean;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  referer: string | null;
  user_id: string | null;
  created_at: string;
}

export async function adminListLeads(
  resourceId: string,
  filters: { page?: number; limit?: number } = {}
): Promise<{ leads: AdminLeadRow[]; total: number }> {
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(200, Math.max(1, filters.limit ?? 50));
  const offset = (page - 1) * limit;

  const [rowsResult, countResult] = await Promise.all([
    pool.query<AdminLeadRow>(
      `SELECT id, email, consent_newsletter, utm_source, utm_medium,
              utm_campaign, referer, user_id, created_at
         FROM gated_resource_leads
        WHERE resource_id = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3`,
      [resourceId, limit, offset]
    ),
    pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM gated_resource_leads WHERE resource_id = $1`,
      [resourceId]
    ),
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
export async function adminExportLeads(
  resourceId: string
): Promise<AdminLeadRow[]> {
  const result = await pool.query<AdminLeadRow>(
    `SELECT id, email, consent_newsletter, utm_source, utm_medium,
            utm_campaign, referer, user_id, created_at
       FROM gated_resource_leads
      WHERE resource_id = $1
      ORDER BY created_at DESC`,
    [resourceId]
  );
  return result.rows;
}

// ── Helpers exposed for tests and the route layer ──────────────────

export const __internal = {
  hashIp,
  normaliseEmail,
};

// ── Express request → RequestContext extraction ────────────────────

/**
 * Pull the request fields the service needs out of an Express Request.
 * Lives here so callers do not couple to header names; tests use plain
 * RequestContext objects.
 */
export function extractRequestContext(
  req: import('express').Request
): RequestContext {
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
