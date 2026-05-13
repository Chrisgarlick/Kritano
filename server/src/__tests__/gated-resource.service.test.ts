import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Pool, PoolClient } from 'pg';

import {
  setPool,
  listPublishedResources,
  getResourceBySlug,
  captureEmailAndIssueToken,
  issueTokenForUser,
  validateToken,
  recordDownload,
  linkLeadsToUser,
  extractRequestContext,
  __internal,
  type RequestContext,
} from '../services/gated-resource.service.js';
import type { GatedResource } from '../types/gated-resource.types.js';

// ── Mock pool factory ─────────────────────────────────────────────────

interface MockClient {
  query: ReturnType<typeof vi.fn>;
  release: ReturnType<typeof vi.fn>;
}

interface MockPool {
  query: ReturnType<typeof vi.fn>;
  connect: ReturnType<typeof vi.fn>;
  /** The client returned by connect, exposed so tests can inspect tx queries. */
  client: MockClient;
}

function makeMockPool(): MockPool {
  const client: MockClient = {
    query: vi.fn(),
    release: vi.fn(),
  };
  const pool = {
    query: vi.fn(),
    connect: vi.fn().mockResolvedValue(client),
    client,
  };
  return pool as MockPool;
}

let mockPool: MockPool;

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV };
  process.env.IP_HASH_PEPPER = 'test-pepper';
  mockPool = makeMockPool();
  setPool(mockPool as unknown as Pool);
});

afterEach(() => {
  vi.restoreAllMocks();
  process.env = ORIGINAL_ENV;
});

function makeResource(over: Partial<GatedResource> = {}): GatedResource {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    slug: 'website-health-checklist',
    title: 'The Website Health Checklist',
    subtitle: null,
    hook: 'hook',
    category: 'guides',
    audience: null,
    description: 'desc',
    preview_md: 'preview',
    source_md_path: 'resources/website-health-checklist/source.md',
    formats: ['md', 'pdf', 'html'],
    content_hash: 'a'.repeat(64),
    page_count: 6,
    published: true,
    download_count: 0,
    created_at: '2026-05-12T00:00:00Z',
    updated_at: '2026-05-12T00:00:00Z',
    ...over,
  };
}

// ── hashIp ────────────────────────────────────────────────────────────

describe('hashIp', () => {
  it('returns null for null/empty input', () => {
    expect(__internal.hashIp(null)).toBeNull();
    expect(__internal.hashIp(undefined)).toBeNull();
    expect(__internal.hashIp('')).toBeNull();
  });

  it('returns a 64-char hex hash for a non-empty IP', () => {
    const h = __internal.hashIp('203.0.113.42');
    expect(h).toMatch(/^[a-f0-9]{64}$/);
  });

  it('is deterministic for the same IP + pepper', () => {
    const a = __internal.hashIp('203.0.113.42');
    const b = __internal.hashIp('203.0.113.42');
    expect(a).toBe(b);
  });

  it('changes when the pepper changes', () => {
    const a = __internal.hashIp('203.0.113.42');
    process.env.IP_HASH_PEPPER = 'different-pepper';
    const b = __internal.hashIp('203.0.113.42');
    expect(a).not.toBe(b);
  });
});

// ── normaliseEmail ────────────────────────────────────────────────────

describe('normaliseEmail', () => {
  it('lowercases and trims', () => {
    expect(__internal.normaliseEmail('  Foo@Bar.com  ')).toBe('foo@bar.com');
  });
});

// ── listPublishedResources ────────────────────────────────────────────

describe('listPublishedResources', () => {
  it('queries only published rows, no category filter', async () => {
    mockPool.query.mockResolvedValue({ rows: [] });
    await listPublishedResources();
    const [sql, values] = mockPool.query.mock.calls[0];
    expect(sql).toContain('published = true');
    expect(sql).not.toContain('category =');
    expect(values).toEqual([]);
  });

  it('adds a category filter when provided', async () => {
    mockPool.query.mockResolvedValue({ rows: [] });
    await listPublishedResources({ category: 'seo' });
    const [sql, values] = mockPool.query.mock.calls[0];
    expect(sql).toContain('category = $1');
    expect(values).toEqual(['seo']);
  });
});

// ── getResourceBySlug ─────────────────────────────────────────────────

describe('getResourceBySlug', () => {
  it('returns the row when found', async () => {
    const r = makeResource();
    mockPool.query.mockResolvedValue({ rows: [r] });
    const found = await getResourceBySlug('website-health-checklist');
    expect(found).toEqual(r);
  });

  it('returns null when not found', async () => {
    mockPool.query.mockResolvedValue({ rows: [] });
    const found = await getResourceBySlug('nope');
    expect(found).toBeNull();
  });
});

// ── captureEmailAndIssueToken ─────────────────────────────────────────

describe('captureEmailAndIssueToken', () => {
  function setUpHappyPath(opts: { wasInserted: boolean }) {
    mockPool.client.query
      // BEGIN
      .mockResolvedValueOnce({ rows: [] })
      // upsert lead
      .mockResolvedValueOnce({
        rows: [
          {
            id: 'lead-id',
            resource_id: 'res-id',
            email: 'Foo@Bar.com',
            email_normalised: 'foo@bar.com',
            consent_newsletter: false,
            referer: null,
            utm_source: null,
            utm_medium: null,
            utm_campaign: null,
            ip_hash: 'iphash',
            user_agent: null,
            user_id: null,
            created_at: '2026-05-12T00:00:00Z',
            _was_inserted: opts.wasInserted,
          },
        ],
      })
      // insert token
      .mockResolvedValueOnce({ rows: [] })
      // COMMIT
      .mockResolvedValueOnce({ rows: [] });
  }

  it('inserts a new lead, issues a token, returns isNewLead=true', async () => {
    setUpHappyPath({ wasInserted: true });

    const resource = makeResource();
    const ctx: RequestContext = { ip: '1.2.3.4', userAgent: 'UA' };
    const result = await captureEmailAndIssueToken({
      resource,
      email: '  Foo@Bar.com  ',
      consentNewsletter: false,
      request: ctx,
    });

    expect(result.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(result.isNewLead).toBe(true);
    expect(result.lead.email_normalised).toBe('foo@bar.com');
    expect('_was_inserted' in result.lead).toBe(false);

    // BEGIN, upsert, insert token, COMMIT
    expect(mockPool.client.query).toHaveBeenCalledTimes(4);
    expect(mockPool.client.query.mock.calls[0][0]).toBe('BEGIN');
    expect(mockPool.client.query.mock.calls[3][0]).toBe('COMMIT');
    expect(mockPool.client.release).toHaveBeenCalled();
  });

  it('returns isNewLead=false on a returning email', async () => {
    setUpHappyPath({ wasInserted: false });
    const result = await captureEmailAndIssueToken({
      resource: makeResource(),
      email: 'foo@bar.com',
      consentNewsletter: false,
      request: {},
    });
    expect(result.isNewLead).toBe(false);
  });

  it('rolls back on a transaction failure and releases the client', async () => {
    mockPool.client.query
      .mockResolvedValueOnce({ rows: [] }) // BEGIN
      .mockRejectedValueOnce(new Error('boom')) // upsert fails
      .mockResolvedValueOnce({ rows: [] }); // ROLLBACK

    await expect(
      captureEmailAndIssueToken({
        resource: makeResource(),
        email: 'foo@bar.com',
        consentNewsletter: false,
        request: {},
      })
    ).rejects.toThrow('boom');

    const calls = mockPool.client.query.mock.calls.map((c) => c[0]);
    expect(calls[0]).toBe('BEGIN');
    expect(calls[calls.length - 1]).toBe('ROLLBACK');
    expect(mockPool.client.release).toHaveBeenCalled();
  });

  it('rejects empty emails', async () => {
    await expect(
      captureEmailAndIssueToken({
        resource: makeResource(),
        email: '   ',
        consentNewsletter: false,
        request: {},
      })
    ).rejects.toThrow();
  });

  it('hashes the IP before storing it', async () => {
    setUpHappyPath({ wasInserted: true });
    await captureEmailAndIssueToken({
      resource: makeResource(),
      email: 'foo@bar.com',
      consentNewsletter: false,
      request: { ip: '203.0.113.42' },
    });
    const upsertCall = mockPool.client.query.mock.calls[1];
    const values = upsertCall[1] as unknown[];
    // ip_hash is the 9th parameter (index 8) in the insert
    expect(values[8]).toMatch(/^[a-f0-9]{64}$/);
    expect(values[8]).not.toBe('203.0.113.42');
  });
});

// ── issueTokenForUser ─────────────────────────────────────────────────

describe('issueTokenForUser', () => {
  it('issues a base64url token and inserts with user_id (no lead_id)', async () => {
    mockPool.query.mockResolvedValue({ rows: [] });
    const token = await issueTokenForUser('res-id', 'user-id');
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    const [sql, values] = mockPool.query.mock.calls[0];
    expect(sql).toContain('gated_resource_tokens');
    expect(values[0]).toBe(token);
    expect(values[1]).toBe('res-id');
    expect(values[2]).toBe('user-id');
  });
});

// ── validateToken ─────────────────────────────────────────────────────

describe('validateToken', () => {
  it('returns null when the token is missing/expired', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [] }); // token lookup
    const result = await validateToken('bad-token', 'website-health-checklist');
    expect(result).toBeNull();
    expect(mockPool.query).toHaveBeenCalledTimes(1);
  });

  it('returns null when token resolves to a different slug', async () => {
    mockPool.query
      .mockResolvedValueOnce({
        rows: [
          {
            token: 't',
            resource_id: 'res-id',
            lead_id: 'l',
            user_id: null,
            expires_at: '2030-01-01T00:00:00Z',
            uses_count: 0,
            last_used_at: null,
            created_at: '2026-05-12T00:00:00Z',
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [] }); // resource lookup returns nothing (wrong slug)
    const result = await validateToken('t', 'wrong-slug');
    expect(result).toBeNull();
  });

  it('returns the pair when the token + slug match', async () => {
    const tokenRow = {
      token: 't',
      resource_id: 'res-id',
      lead_id: 'l',
      user_id: null,
      expires_at: '2030-01-01T00:00:00Z',
      uses_count: 0,
      last_used_at: null,
      created_at: '2026-05-12T00:00:00Z',
    };
    const resourceRow = makeResource({ id: 'res-id' });
    mockPool.query
      .mockResolvedValueOnce({ rows: [tokenRow] })
      .mockResolvedValueOnce({ rows: [resourceRow] });

    const result = await validateToken('t', resourceRow.slug);
    expect(result).not.toBeNull();
    expect(result!.token.token).toBe('t');
    expect(result!.resource.id).toBe('res-id');
  });
});

// ── recordDownload ────────────────────────────────────────────────────

describe('recordDownload', () => {
  it('writes the audit row, bumps the resource counter, and ticks token usage when a token is supplied', async () => {
    // 5 queries: BEGIN, insert, update resource, update token, COMMIT
    mockPool.client.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    await recordDownload({
      resourceId: 'res-id',
      format: 'pdf',
      leadId: 'lead-id',
      token: 'tkn',
      request: { ip: '203.0.113.42', referer: 'https://example.com' },
    });

    const calls = mockPool.client.query.mock.calls.map((c) => c[0]);
    expect(calls[0]).toBe('BEGIN');
    expect(calls[1]).toContain('INSERT INTO gated_resource_downloads');
    expect(calls[2]).toContain('UPDATE gated_resources');
    expect(calls[3]).toContain('UPDATE gated_resource_tokens');
    expect(calls[4]).toBe('COMMIT');
  });

  it('skips the token update when no token is supplied (logged-in user path)', async () => {
    // 4 queries: BEGIN, insert, update resource, COMMIT
    mockPool.client.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    await recordDownload({
      resourceId: 'res-id',
      format: 'md',
      userId: 'user-id',
      request: {},
    });

    expect(mockPool.client.query).toHaveBeenCalledTimes(4);
    const calls = mockPool.client.query.mock.calls.map((c) => c[0]);
    expect(calls.some((q) => q.includes('UPDATE gated_resource_tokens'))).toBe(
      false
    );
  });

  it('rolls back on failure and releases the client', async () => {
    mockPool.client.query
      .mockResolvedValueOnce({ rows: [] }) // BEGIN
      .mockRejectedValueOnce(new Error('insert failed'))
      .mockResolvedValueOnce({ rows: [] }); // ROLLBACK

    await expect(
      recordDownload({
        resourceId: 'res-id',
        format: 'md',
        request: {},
      })
    ).rejects.toThrow('insert failed');

    const calls = mockPool.client.query.mock.calls.map((c) => c[0]);
    expect(calls[calls.length - 1]).toBe('ROLLBACK');
    expect(mockPool.client.release).toHaveBeenCalled();
  });
});

// ── linkLeadsToUser ───────────────────────────────────────────────────

describe('linkLeadsToUser', () => {
  it('normalises the email and returns the row count', async () => {
    mockPool.query.mockResolvedValue({ rowCount: 3 });
    const n = await linkLeadsToUser('  Foo@Bar.com  ', 'user-id');
    expect(n).toBe(3);
    const [sql, values] = mockPool.query.mock.calls[0];
    expect(sql).toContain('gated_resource_leads');
    expect(values).toEqual(['user-id', 'foo@bar.com']);
  });

  it('returns 0 when no rows match', async () => {
    mockPool.query.mockResolvedValue({ rowCount: 0 });
    const n = await linkLeadsToUser('nobody@nowhere.com', 'user-id');
    expect(n).toBe(0);
  });
});

// ── extractRequestContext ─────────────────────────────────────────────

describe('extractRequestContext', () => {
  it('pulls ip, UA, referer, and UTM params from an Express request', () => {
    const fakeReq = {
      ip: '203.0.113.42',
      headers: {
        'user-agent': 'Mozilla',
        referer: 'https://example.com',
      },
      query: {
        utm_source: 'twitter',
        utm_medium: 'social',
        utm_campaign: 'launch',
      },
    } as unknown as import('express').Request;

    const ctx = extractRequestContext(fakeReq);
    expect(ctx).toEqual({
      ip: '203.0.113.42',
      userAgent: 'Mozilla',
      referer: 'https://example.com',
      utmSource: 'twitter',
      utmMedium: 'social',
      utmCampaign: 'launch',
    });
  });

  it('returns nulls when headers/query are absent', () => {
    const fakeReq = {
      ip: undefined,
      headers: {},
      query: {},
    } as unknown as import('express').Request;

    const ctx = extractRequestContext(fakeReq);
    expect(ctx).toEqual({
      ip: null,
      userAgent: null,
      referer: null,
      utmSource: null,
      utmMedium: null,
      utmCampaign: null,
    });
  });
});
