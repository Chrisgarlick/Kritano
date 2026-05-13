import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
} from 'vitest';
import supertest from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';

// ── Mocks (must come before importing the router) ─────────────────────

// Rate limiter: passthrough middleware so tests aren't coupled to redis state.
vi.mock('../middleware/rateLimit.middleware', () => ({
  createRateLimiter: () => (_req: unknown, _res: unknown, next: () => void) =>
    next(),
}));

// optionalAuthenticate: controlled per-test via the global below.
let injectedUser: { id: string; email: string; role: string } | null = null;
vi.mock('../middleware/auth.middleware', () => ({
  optionalAuthenticate: (
    req: { user?: unknown },
    _res: unknown,
    next: () => void
  ) => {
    if (injectedUser) req.user = injectedUser;
    next();
  },
}));

// Gated resource service: each function is a vi.fn we can stub per test.
const mockCaptureEmailAndIssueToken = vi.fn();
const mockIssueTokenForUser = vi.fn();
const mockGetResourceBySlug = vi.fn();
const mockRecordDownload = vi.fn();
const mockValidateToken = vi.fn();
vi.mock('../services/gated-resource.service', () => ({
  captureEmailAndIssueToken: (...args: unknown[]) =>
    mockCaptureEmailAndIssueToken(...args),
  issueTokenForUser: (...args: unknown[]) => mockIssueTokenForUser(...args),
  getResourceBySlug: (...args: unknown[]) => mockGetResourceBySlug(...args),
  recordDownload: (...args: unknown[]) => mockRecordDownload(...args),
  validateToken: (...args: unknown[]) => mockValidateToken(...args),
  extractRequestContext: () => ({
    ip: '127.0.0.1',
    userAgent: 'test',
    referer: null,
  }),
}));

// Delivery service: same pattern.
const mockDeliverFormat = vi.fn();
vi.mock('../services/resource-delivery.service', () => ({
  deliverFormat: (...args: unknown[]) => mockDeliverFormat(...args),
}));

// Side-effect services on the download path. Mocked to no-op so the
// post-response fire-and-forget calls don't try to hit a real DB.
const mockCheckTriggers = vi.fn().mockResolvedValue([]);
const mockRecalculateScore = vi.fn().mockResolvedValue({ score: 0, status: 'new' });
vi.mock('../services/crm-trigger.service', () => ({
  checkTriggers: (...args: unknown[]) => mockCheckTriggers(...args),
}));
vi.mock('../services/lead-scoring.service', () => ({
  recalculateScore: (...args: unknown[]) => mockRecalculateScore(...args),
}));

// Email service is invoked from sendDeliveryEmail; mock the only method we call.
vi.mock('../services/email.service', () => ({
  emailService: {
    sendGatedResourceDeliveryEmail: vi.fn().mockResolvedValue(undefined),
  },
}));

// Now import the router and types AFTER the mocks are wired.
import { resourcesRouter } from '../routes/resources/index.js';
import {
  TypesetNotConfiguredError,
  UnsupportedFormatError,
} from '../types/gated-resource.types.js';

// ── App factory ───────────────────────────────────────────────────────

function buildApp(): express.Express {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/resources', resourcesRouter);
  return app;
}

const SLUG = 'website-health-checklist';

function makeResource(over: Record<string, unknown> = {}) {
  return {
    id: 'res-id',
    slug: SLUG,
    title: 'The Website Health Checklist',
    subtitle: null,
    hook: 'hook',
    category: 'guides',
    audience: null,
    description: 'desc',
    preview_md: 'preview',
    source_md_path: 'resources/website-health-checklist/source.md',
    formats: ['md', 'pdf'],
    content_hash: 'a'.repeat(64),
    page_count: 6,
    published: true,
    download_count: 0,
    created_at: '2026-05-12T00:00:00Z',
    updated_at: '2026-05-12T00:00:00Z',
    ...over,
  };
}

beforeEach(() => {
  injectedUser = null;
  vi.clearAllMocks();
  // Every mocked service function defaults to a resolved Promise so the
  // route's fire-and-forget `.catch()` calls don't blow up on undefined.
  mockRecordDownload.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ── POST /api/resources/:slug/request ────────────────────────────────

describe('POST /api/resources/:slug/request', () => {
  it('captures an anonymous email and returns a token + formats', async () => {
    mockGetResourceBySlug.mockResolvedValue(makeResource());
    mockCaptureEmailAndIssueToken.mockResolvedValue({
      token: 'tok-abc',
      lead: { id: 'lead-1' },
      isNewLead: true,
    });

    const res = await supertest(buildApp())
      .post(`/api/resources/${SLUG}/request`)
      .send({ email: 'foo@example.com', consentNewsletter: true });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      token: 'tok-abc',
      formats: ['md', 'pdf'],
      slug: SLUG,
      loggedIn: false,
    });
    expect(mockCaptureEmailAndIssueToken).toHaveBeenCalledTimes(1);
    const call = mockCaptureEmailAndIssueToken.mock.calls[0][0];
    expect(call.email).toBe('foo@example.com');
    expect(call.consentNewsletter).toBe(true);
  });

  it('skips lead capture for a logged-in user and returns loggedIn:true', async () => {
    injectedUser = { id: 'user-1', email: 'u@example.com', role: 'user' };
    mockGetResourceBySlug.mockResolvedValue(makeResource());
    mockIssueTokenForUser.mockResolvedValue('tok-user');

    const res = await supertest(buildApp())
      .post(`/api/resources/${SLUG}/request`)
      .send({ email: 'u@example.com' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ token: 'tok-user', loggedIn: true });
    expect(mockIssueTokenForUser).toHaveBeenCalledWith('res-id', 'user-1');
    expect(mockCaptureEmailAndIssueToken).not.toHaveBeenCalled();
  });

  it('silently succeeds when the honeypot field is set, without capturing', async () => {
    const res = await supertest(buildApp())
      .post(`/api/resources/${SLUG}/request`)
      .send({ email: 'foo@example.com', website: 'https://spam.example' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
    expect(mockGetResourceBySlug).not.toHaveBeenCalled();
    expect(mockCaptureEmailAndIssueToken).not.toHaveBeenCalled();
  });

  it('rejects disposable email domains with a friendly 400', async () => {
    const res = await supertest(buildApp())
      .post(`/api/resources/${SLUG}/request`)
      .send({ email: 'throwaway@mailinator.com' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('DISPOSABLE_EMAIL');
    expect(mockCaptureEmailAndIssueToken).not.toHaveBeenCalled();
  });

  it('rejects malformed emails with 400', async () => {
    const res = await supertest(buildApp())
      .post(`/api/resources/${SLUG}/request`)
      .send({ email: 'not-an-email' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_REQUEST');
  });

  it('returns 404 when the resource does not exist', async () => {
    mockGetResourceBySlug.mockResolvedValue(null);

    const res = await supertest(buildApp())
      .post(`/api/resources/${SLUG}/request`)
      .send({ email: 'foo@example.com' });

    expect(res.status).toBe(404);
  });

  it('returns 404 when the resource is unpublished', async () => {
    mockGetResourceBySlug.mockResolvedValue(makeResource({ published: false }));

    const res = await supertest(buildApp())
      .post(`/api/resources/${SLUG}/request`)
      .send({ email: 'foo@example.com' });

    expect(res.status).toBe(404);
  });
});

// ── GET /api/resources/:slug/download/:format ────────────────────────

describe('GET /api/resources/:slug/download/:format', () => {
  it('streams the file and records the download for a valid token', async () => {
    const resource = makeResource();
    mockValidateToken.mockResolvedValue({
      token: { token: 'tok', lead_id: 'lead-1', user_id: null },
      resource,
    });
    mockDeliverFormat.mockResolvedValue({
      path: `${process.cwd()}/src/data/${resource.source_md_path}`,
      mimeType: 'text/markdown; charset=utf-8',
      filename: `${SLUG}.md`,
    });

    const res = await supertest(buildApp()).get(
      `/api/resources/${SLUG}/download/md?token=tok`
    );

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/markdown');
    expect(res.headers['content-disposition']).toContain(
      `filename="${SLUG}.md"`
    );
    // recordDownload runs async; give the microtask queue a tick to flush.
    await new Promise((r) => setImmediate(r));
    expect(mockRecordDownload).toHaveBeenCalledTimes(1);
    const dl = mockRecordDownload.mock.calls[0][0];
    expect(dl.resourceId).toBe('res-id');
    expect(dl.leadId).toBe('lead-1');
    expect(dl.userId).toBeNull();
    expect(dl.token).toBe('tok');
  });

  it('allows a logged-in user without a token', async () => {
    injectedUser = { id: 'user-1', email: 'u@example.com', role: 'user' };
    const resource = makeResource();
    mockGetResourceBySlug.mockResolvedValue(resource);
    mockDeliverFormat.mockResolvedValue({
      path: `${process.cwd()}/src/data/${resource.source_md_path}`,
      mimeType: 'text/markdown; charset=utf-8',
      filename: `${SLUG}.md`,
    });

    const res = await supertest(buildApp()).get(
      `/api/resources/${SLUG}/download/md`
    );

    expect(res.status).toBe(200);
    await new Promise((r) => setImmediate(r));
    expect(mockRecordDownload).toHaveBeenCalledTimes(1);
    expect(mockRecordDownload.mock.calls[0][0].userId).toBe('user-1');
    expect(mockRecordDownload.mock.calls[0][0].token).toBeNull();
  });

  it('returns 401 when neither token nor session is provided', async () => {
    const res = await supertest(buildApp()).get(
      `/api/resources/${SLUG}/download/md`
    );
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('AUTH_REQUIRED');
  });

  it('returns 401 for an invalid or expired token', async () => {
    mockValidateToken.mockResolvedValue(null);
    const res = await supertest(buildApp()).get(
      `/api/resources/${SLUG}/download/md?token=bad`
    );
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('TOKEN_INVALID');
  });

  it('returns 400 for an unknown format string', async () => {
    const res = await supertest(buildApp()).get(
      `/api/resources/${SLUG}/download/rtf?token=tok`
    );
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('UNSUPPORTED_FORMAT');
  });

  it('returns 400 when the format is not in the resource formats array', async () => {
    const resource = makeResource({ formats: ['md'] });
    mockValidateToken.mockResolvedValue({
      token: { token: 'tok', lead_id: 'lead-1', user_id: null },
      resource,
    });

    const res = await supertest(buildApp()).get(
      `/api/resources/${SLUG}/download/pdf?token=tok`
    );

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('UNSUPPORTED_FORMAT');
    expect(mockDeliverFormat).not.toHaveBeenCalled();
  });

  it('returns 503 with a "preparing" affordance when typeset is disabled', async () => {
    const resource = makeResource();
    mockValidateToken.mockResolvedValue({
      token: { token: 'tok', lead_id: 'lead-1', user_id: null },
      resource,
    });
    mockDeliverFormat.mockRejectedValue(new TypesetNotConfiguredError());

    const res = await supertest(buildApp()).get(
      `/api/resources/${SLUG}/download/pdf?token=tok`
    );

    expect(res.status).toBe(503);
    expect(res.body).toMatchObject({
      status: 'preparing',
      code: 'TYPESET_DISABLED',
      emailWhenReady: true,
    });
  });

  it('fires checkTriggers and recalculateScore for a logged-in download', async () => {
    injectedUser = { id: 'user-1', email: 'u@example.com', role: 'user' };
    const resource = makeResource();
    mockGetResourceBySlug.mockResolvedValue(resource);
    mockDeliverFormat.mockResolvedValue({
      path: `${process.cwd()}/src/data/${resource.source_md_path}`,
      mimeType: 'text/markdown; charset=utf-8',
      filename: `${SLUG}.md`,
    });

    await supertest(buildApp()).get(`/api/resources/${SLUG}/download/md`);
    // Both side-effects fire from inside .then() on recordDownload, which
    // resolves on the next microtask. Give it a couple of ticks to flush.
    await new Promise((r) => setImmediate(r));
    await new Promise((r) => setImmediate(r));

    expect(mockCheckTriggers).toHaveBeenCalledTimes(1);
    expect(mockCheckTriggers).toHaveBeenCalledWith(
      'user-1',
      'gated_resource_downloaded',
      expect.objectContaining({
        resource_slug: SLUG,
        format: 'md',
        category: 'guides',
      })
    );
    expect(mockRecalculateScore).toHaveBeenCalledWith('user-1');
  });

  it('does NOT fire checkTriggers for an anonymous (token-only) download', async () => {
    const resource = makeResource();
    mockValidateToken.mockResolvedValue({
      token: { token: 'tok', lead_id: 'lead-1', user_id: null },
      resource,
    });
    mockDeliverFormat.mockResolvedValue({
      path: `${process.cwd()}/src/data/${resource.source_md_path}`,
      mimeType: 'text/markdown; charset=utf-8',
      filename: `${SLUG}.md`,
    });

    await supertest(buildApp()).get(
      `/api/resources/${SLUG}/download/md?token=tok`
    );
    await new Promise((r) => setImmediate(r));
    await new Promise((r) => setImmediate(r));

    expect(mockCheckTriggers).not.toHaveBeenCalled();
    expect(mockRecalculateScore).not.toHaveBeenCalled();
  });

  it('returns 400 when deliverFormat throws UnsupportedFormatError', async () => {
    const resource = makeResource();
    mockValidateToken.mockResolvedValue({
      token: { token: 'tok', lead_id: 'lead-1', user_id: null },
      resource,
    });
    mockDeliverFormat.mockRejectedValue(new UnsupportedFormatError('pdf'));

    const res = await supertest(buildApp()).get(
      `/api/resources/${SLUG}/download/pdf?token=tok`
    );

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('UNSUPPORTED_FORMAT');
  });
});
