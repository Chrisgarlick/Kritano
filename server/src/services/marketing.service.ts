/**
 * Marketing Content Service
 *
 * CRUD for marketing campaigns (labels) and marketing content items.
 */

import { pool } from '../db/index.js';

// ══════════════════════════════════════════════
// Campaigns
// ══════════════════════════════════════════════

export async function listCampaigns(): Promise<{ campaigns: MarketingCampaignRow[] }> {
  const result = await pool.query(
    `SELECT mc.*,
            COALESCE(cnt.content_count, 0)::int AS content_count
     FROM marketing_campaigns mc
     LEFT JOIN (
       SELECT campaign_id, COUNT(*)::int AS content_count
       FROM marketing_content
       GROUP BY campaign_id
     ) cnt ON cnt.campaign_id = mc.id
     ORDER BY mc.created_at DESC`
  );
  return { campaigns: result.rows };
}

export async function createCampaign(
  data: { name: string; color?: string; description?: string },
  createdBy: string
): Promise<MarketingCampaignRow> {
  const result = await pool.query(
    `INSERT INTO marketing_campaigns (name, color, description, created_by)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [data.name, data.color || '#6366f1', data.description || null, createdBy]
  );
  return result.rows[0];
}

export async function updateCampaign(
  id: string,
  data: { name?: string; color?: string; description?: string }
): Promise<MarketingCampaignRow | null> {
  const sets: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (data.name !== undefined) { sets.push(`name = $${idx++}`); params.push(data.name); }
  if (data.color !== undefined) { sets.push(`color = $${idx++}`); params.push(data.color); }
  if (data.description !== undefined) { sets.push(`description = $${idx++}`); params.push(data.description); }

  if (sets.length === 0) return null;

  sets.push(`updated_at = NOW()`);
  params.push(id);

  const result = await pool.query(
    `UPDATE marketing_campaigns SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
    params
  );
  return result.rows[0] || null;
}

export async function deleteCampaign(id: string): Promise<void> {
  await pool.query('DELETE FROM marketing_campaigns WHERE id = $1', [id]);
}

// ══════════════════════════════════════════════
// Content
// ══════════════════════════════════════════════

function stripMarkdown(text: string): string {
  return text
    .replace(/[#*_~`>\[\]()!]/g, '')
    .replace(/\n+/g, ' ')
    .trim();
}

function computePreview(body: string): string {
  const plain = stripMarkdown(body);
  return plain.length > 280 ? plain.slice(0, 280) + '...' : plain;
}

export async function listContent(filters: {
  platform?: string;
  campaign_id?: string;
  status?: string;
  search?: string;
  week_number?: number;
  day_of_week?: number;
  page?: number;
  limit?: number;
} = {}): Promise<{ content: MarketingContentRow[]; total: number }> {
  const { platform, campaign_id, status, search, week_number, day_of_week, page = 1, limit = 25 } = filters;
  const conditions: string[] = [];
  const params: unknown[] = [];
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
    pool.query(
      `SELECT mc.*,
              row_to_json(camp.*) AS campaign
       FROM marketing_content mc
       LEFT JOIN marketing_campaigns camp ON camp.id = mc.campaign_id
       ${where}
       ORDER BY mc.week_number ASC NULLS LAST, mc.day_of_week ASC NULLS LAST, mc.created_at DESC
       LIMIT $${paramIdx++} OFFSET $${paramIdx}`,
      [...params, limit, offset]
    ),
    pool.query(`SELECT COUNT(*)::int AS total FROM marketing_content mc ${where}`, params),
  ]);

  return {
    content: contentResult.rows,
    total: countResult.rows[0].total,
  };
}

export async function getContentStats(): Promise<MarketingContentStats> {
  const [totalResult, platformResult, statusResult, campaignResult] = await Promise.all([
    pool.query('SELECT COUNT(*)::int AS total FROM marketing_content'),
    pool.query(
      `SELECT platform, COUNT(*)::int AS count
       FROM marketing_content
       GROUP BY platform`
    ),
    pool.query(
      `SELECT status, COUNT(*)::int AS count
       FROM marketing_content
       GROUP BY status`
    ),
    pool.query(
      `SELECT mc.id, mc.name, COUNT(con.id)::int AS count
       FROM marketing_campaigns mc
       LEFT JOIN marketing_content con ON con.campaign_id = mc.id
       GROUP BY mc.id, mc.name
       ORDER BY count DESC`
    ),
  ]);

  const by_platform: Record<string, number> = {};
  for (const row of platformResult.rows) {
    by_platform[row.platform] = row.count;
  }

  const by_status: Record<string, number> = {};
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

export async function getContent(id: string): Promise<MarketingContentRow | null> {
  const result = await pool.query(
    `SELECT mc.*,
            row_to_json(camp.*) AS campaign
     FROM marketing_content mc
     LEFT JOIN marketing_campaigns camp ON camp.id = mc.campaign_id
     WHERE mc.id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

export async function createContent(
  data: {
    platform: string;
    title?: string;
    body: string;
    media?: unknown[];
    campaign_id?: string;
    status?: string;
    notes?: string;
    week_number?: number;
    day_of_week?: number;
  },
  createdBy: string
): Promise<MarketingContentRow> {
  const preview = computePreview(data.body);
  const charCount = stripMarkdown(data.body).length;

  const result = await pool.query(
    `INSERT INTO marketing_content (platform, title, body, preview, media, campaign_id, status, notes, char_count, week_number, day_of_week, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING *`,
    [
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
    ]
  );

  // Return with campaign joined
  return getContent(result.rows[0].id) as Promise<MarketingContentRow>;
}

export async function updateContent(
  id: string,
  data: {
    platform?: string;
    title?: string;
    body?: string;
    media?: unknown[];
    campaign_id?: string | null;
    status?: string;
    notes?: string;
    week_number?: number | null;
    day_of_week?: number | null;
  }
): Promise<MarketingContentRow | null> {
  const sets: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (data.platform !== undefined) { sets.push(`platform = $${idx++}`); params.push(data.platform); }
  if (data.title !== undefined) { sets.push(`title = $${idx++}`); params.push(data.title || null); }
  if (data.body !== undefined) {
    sets.push(`body = $${idx++}`); params.push(data.body);
    sets.push(`preview = $${idx++}`); params.push(computePreview(data.body));
    sets.push(`char_count = $${idx++}`); params.push(stripMarkdown(data.body).length);
  }
  if (data.media !== undefined) { sets.push(`media = $${idx++}`); params.push(JSON.stringify(data.media)); }
  if (data.campaign_id !== undefined) { sets.push(`campaign_id = $${idx++}`); params.push(data.campaign_id); }
  if (data.status !== undefined) { sets.push(`status = $${idx++}`); params.push(data.status); }
  if (data.notes !== undefined) { sets.push(`notes = $${idx++}`); params.push(data.notes || null); }
  if (data.week_number !== undefined) { sets.push(`week_number = $${idx++}`); params.push(data.week_number); }
  if (data.day_of_week !== undefined) { sets.push(`day_of_week = $${idx++}`); params.push(data.day_of_week); }

  if (sets.length === 0) return null;

  sets.push(`updated_at = NOW()`);
  params.push(id);

  await pool.query(
    `UPDATE marketing_content SET ${sets.join(', ')} WHERE id = $${idx}`,
    params
  );

  return getContent(id);
}

export async function deleteContent(id: string): Promise<void> {
  await pool.query('DELETE FROM marketing_content WHERE id = $1', [id]);
}

export async function updateContentStatus(id: string, status: string): Promise<MarketingContentRow | null> {
  await pool.query(
    'UPDATE marketing_content SET status = $1, updated_at = NOW() WHERE id = $2',
    [status, id]
  );
  return getContent(id);
}

// ══════════════════════════════════════════════
// Types (internal)
// ══════════════════════════════════════════════

interface MarketingCampaignRow {
  id: string;
  name: string;
  color: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  content_count?: number;
}

interface MarketingContentRow {
  id: string;
  platform: string;
  title: string | null;
  body: string;
  preview: string;
  media: unknown[];
  campaign_id: string | null;
  campaign?: MarketingCampaignRow | null;
  status: string;
  notes: string | null;
  char_count: number;
  week_number: number | null;
  day_of_week: number | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface MarketingContentStats {
  total: number;
  by_platform: Record<string, number>;
  by_status: Record<string, number>;
  by_campaign: { id: string; name: string; count: number }[];
}
