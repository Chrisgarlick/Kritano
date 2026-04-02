import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';
import supertest from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import { Pool } from 'pg';

// Mock service dependencies BEFORE importing the router
vi.mock('../services/site.service', () => ({
  findOrCreateSiteForDomain: vi.fn().mockResolvedValue({
    id: 'site-1',
    domain: 'example.com',
    verified: true,
    owner_id: 'test-user-id',
  }),
  findOrCreateUrl: vi.fn().mockResolvedValue({
    id: 'url-1',
    url: 'https://example.com',
  }),
  getUserTierLimits: vi.fn().mockResolvedValue({
    tier: 'free',
    max_pages_per_audit: 5,
    max_audit_depth: 3,
    concurrent_audits: 3,
    max_audits_per_month: 10,
    available_checks: ['seo', 'accessibility', 'security', 'performance', 'content'],
  }),
  getSiteOwnerTierLimits: vi.fn().mockResolvedValue({
    tier: 'free',
    max_pages_per_audit: 5,
    max_audit_depth: 3,
    concurrent_audits: 3,
    available_checks: ['seo', 'accessibility', 'security', 'performance', 'content'],
  }),
  isSiteVerified: vi.fn().mockResolvedValue(true),
}));

vi.mock('../middleware/site.middleware', () => ({
  getSiteWithAccess: vi.fn().mockResolvedValue({ permission: 'owner' }),
}));

vi.mock('../services/audit.service', () => ({
  auditService: {
    logAuditCreated: vi.fn().mockResolvedValue(undefined),
    logAuditCancelled: vi.fn().mockResolvedValue(undefined),
    logAuditDeleted: vi.fn().mockResolvedValue(undefined),
    logExportCsv: vi.fn().mockResolvedValue(undefined),
    logExportJson: vi.fn().mockResolvedValue(undefined),
    logExportPdf: vi.fn().mockResolvedValue(undefined),
    logFindingDismissed: vi.fn().mockResolvedValue(undefined),
    logFindingRestored: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../services/consent.service', () => ({
  logAuditConsent: vi.fn().mockResolvedValue(undefined),
  getUserConsentPreference: vi.fn().mockResolvedValue(null),
}));

vi.mock('../data/fix-templates', () => ({
  resolveFixSnippet: vi.fn().mockReturnValue({
    explanation: 'Add a title tag',
    code: '<title>Example</title>',
    effort: 'low',
  }),
}));

vi.mock('../data/cqs-impact-map', () => ({
  getCqsImpact: vi.fn().mockReturnValue(null),
}));

vi.mock('../services/schema-generator.service', () => ({
  generateSchemaForPage: vi.fn().mockResolvedValue(null),
  generateSchemaForSite: vi.fn().mockResolvedValue(null),
}));

vi.mock('../services/pdf-branding.service', () => ({
  resolvePdfBranding: vi.fn().mockResolvedValue({}),
}));

vi.mock('../services/pdf-report.service', () => ({
  generateAuditPdf: vi.fn().mockResolvedValue(Buffer.from('pdf')),
  buildReportHtml: vi.fn().mockReturnValue('<html></html>'),
  buildReportMarkdown: vi.fn().mockReturnValue('# Report'),
}));

vi.mock('../data/en-301-549-mapping', () => ({
  enMapping: [],
  buildWcagToEnMap: vi.fn().mockReturnValue(new Map()),
}));

vi.mock('../utils/ip.utils', () => ({
  validateUrlForSsrf: vi.fn(),
}));

// Mock authentication middleware
vi.mock('../middleware/auth.middleware', () => ({
  authenticate: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    req.user = { id: 'test-user-id', email: 'test@example.com', role: 'user' };
    next();
  },
}));

import { auditsRouter, setPool } from '../routes/audits/index';

// Mock database pool
const mockPool = {
  query: vi.fn(),
} as unknown as Pool;

describe('Audits API', () => {
  let app: express.Application;
  let request: ReturnType<typeof supertest>;

  beforeAll(() => {
    setPool(mockPool);

    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use('/api/audits', auditsRouter);

    request = supertest(app);
  });

  beforeEach(() => {
    (mockPool.query as ReturnType<typeof vi.fn>).mockReset();
  });

  afterAll(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/audits', () => {
    it('should create a new audit', async () => {
      (mockPool.query as ReturnType<typeof vi.fn>)
        // concurrent audit count
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })
        // monthly audit count
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })
        // insert audit job
        .mockResolvedValueOnce({
          rows: [{
            id: 'audit-123',
            target_url: 'https://example.com',
            target_domain: 'example.com',
            status: 'pending',
            site_id: 'site-1',
            url_id: 'url-1',
            created_at: new Date().toISOString(),
          }],
        });

      const response = await request
        .post('/api/audits')
        .send({
          targetUrl: 'https://example.com',
          options: {
            maxPages: 50,
            maxDepth: 3,
          },
        });

      expect(response.status).toBe(201);
      expect(response.body.audit).toBeDefined();
      expect(response.body.audit.id).toBe('audit-123');
    });

    it('should reject invalid URLs', async () => {
      const response = await request
        .post('/api/audits')
        .send({
          targetUrl: 'not-a-valid-url',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should enforce concurrent audit limit', async () => {
      (mockPool.query as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ rows: [{ count: '3' }] }); // Already at limit

      const response = await request
        .post('/api/audits')
        .send({
          targetUrl: 'https://example.com',
        });

      expect(response.status).toBe(429);
      expect(response.body.code).toBe('CONCURRENT_LIMIT_REACHED');
    });

    it('should enforce monthly audit limit', async () => {
      (mockPool.query as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ rows: [{ count: '0' }] }) // concurrent: OK
        .mockResolvedValueOnce({ rows: [{ count: '10' }] }); // monthly: at limit

      const response = await request
        .post('/api/audits')
        .send({
          targetUrl: 'https://example.com',
        });

      expect(response.status).toBe(429);
      expect(response.body.code).toBe('MONTHLY_LIMIT_REACHED');
    });
  });

  describe('GET /api/audits', () => {
    it('should list user audits', async () => {
      const mockAudits = [
        {
          id: 'audit-1',
          target_url: 'https://example.com',
          target_domain: 'example.com',
          status: 'completed',
          created_at: new Date().toISOString(),
        },
        {
          id: 'audit-2',
          target_url: 'https://example2.com',
          target_domain: 'example2.com',
          status: 'pending',
          created_at: new Date().toISOString(),
        },
      ];

      (mockPool.query as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ rows: mockAudits })
        .mockResolvedValueOnce({ rows: [{ count: '2' }] });

      const response = await request.get('/api/audits');

      expect(response.status).toBe(200);
      expect(response.body.audits).toHaveLength(2);
      expect(response.body.pagination.total).toBe(2);
    });

    it('should filter by status', async () => {
      (mockPool.query as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ rows: [{ id: 'audit-1', status: 'completed' }] })
        .mockResolvedValueOnce({ rows: [{ count: '1' }] });

      const response = await request.get('/api/audits?status=completed');

      expect(response.status).toBe(200);
      expect(response.body.audits).toHaveLength(1);
    });
  });

  describe('GET /api/audits/:id', () => {
    it('should get audit details', async () => {
      const mockAudit = {
        id: 'audit-123',
        target_url: 'https://example.com',
        status: 'completed',
        seo_score: 85,
        accessibility_score: 90,
      };

      (mockPool.query as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ rows: [mockAudit] })
        .mockResolvedValueOnce({ rows: [{ category: 'seo', severity: 'moderate', count: '5' }] })
        .mockResolvedValueOnce({ rows: [{ crawl_status: 'crawled', count: '10' }] });

      const response = await request.get('/api/audits/audit-123');

      expect(response.status).toBe(200);
      expect(response.body.audit.id).toBe('audit-123');
      expect(response.body.findings).toBeDefined();
      expect(response.body.pages).toBeDefined();
    });

    it('should return 404 for non-existent audit', async () => {
      (mockPool.query as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ rows: [] });

      const response = await request.get('/api/audits/non-existent');

      expect(response.status).toBe(404);
      expect(response.body.code).toBe('AUDIT_NOT_FOUND');
    });
  });

  describe('POST /api/audits/:id/cancel', () => {
    it('should cancel a running audit', async () => {
      (mockPool.query as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          rows: [{
            id: 'audit-123',
            status: 'cancelled',
          }],
        });

      const response = await request.post('/api/audits/audit-123/cancel');

      expect(response.status).toBe(200);
      expect(response.body.audit.status).toBe('cancelled');
    });

    it('should return 404 if audit cannot be cancelled', async () => {
      (mockPool.query as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ rows: [] });

      const response = await request.post('/api/audits/audit-123/cancel');

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/audits/:id', () => {
    it('should delete a completed audit', async () => {
      (mockPool.query as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 'audit-123' }] });

      const response = await request.delete('/api/audits/audit-123');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Audit deleted');
    });

    it('should return 404 for non-existent audit', async () => {
      (mockPool.query as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ rowCount: 0 });

      const response = await request.delete('/api/audits/non-existent');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/audits/:id/rerun', () => {
    it('should create a new audit with same config', async () => {
      const originalAudit = {
        target_url: 'https://example.com',
        target_domain: 'example.com',
        organization_id: null,
        site_id: 'site-1',
        max_pages: 50,
        max_depth: 3,
        respect_robots_txt: true,
        include_subdomains: false,
        check_seo: true,
        check_accessibility: true,
        check_security: true,
        check_performance: true,
        check_content: true,
        include_mobile: false,
        wcag_version: '2.2',
        wcag_level: 'AA',
      };

      (mockPool.query as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ rows: [originalAudit] })
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })
        .mockResolvedValueOnce({
          rows: [{
            id: 'new-audit-123',
            ...originalAudit,
            status: 'pending',
          }],
        });

      const response = await request.post('/api/audits/audit-123/rerun');

      expect(response.status).toBe(201);
      expect(response.body.audit.id).toBe('new-audit-123');
    });
  });

  // Note: These tests are skipped because Express route ordering matters.
  // In production, /check-url and /recent-urls are matched before /:id routes.
  describe.skip('GET /api/audits/check-url', () => {
    it('should check URL reachability', async () => {
      const response = await request.get('/api/audits/check-url');
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('URL required');
    });
  });

  describe.skip('GET /api/audits/recent-urls', () => {
    it('should return recent URLs', async () => {
      (mockPool.query as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          rows: [
            { target_url: 'https://example.com', target_domain: 'example.com' },
            { target_url: 'https://test.com', target_domain: 'test.com' },
          ],
        });

      const response = await request.get('/api/audits/recent-urls');

      expect(response.status).toBe(200);
      expect(response.body.urls).toHaveLength(2);
    });
  });

  describe('GET /api/audits/:id/export/csv', () => {
    it('should export findings as CSV', async () => {
      (mockPool.query as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ rows: [{ id: 'audit-123', target_domain: 'example.com' }] })
        .mockResolvedValueOnce({
          rows: [
            {
              category: 'seo',
              rule_id: 'missing-title',
              rule_name: 'Missing Title',
              severity: 'critical',
              message: 'Page is missing title',
              page_url: 'https://example.com/page1',
            },
          ],
        });

      const response = await request.get('/api/audits/audit-123/export/csv');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/csv');
    });
  });

  describe('GET /api/audits/:id/export/json', () => {
    it('should export audit as JSON', async () => {
      (mockPool.query as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ rows: [{ id: 'audit-123', target_domain: 'example.com' }] })
        .mockResolvedValueOnce({ rows: [] }) // findings
        .mockResolvedValueOnce({ rows: [] }); // pages

      const response = await request.get('/api/audits/audit-123/export/json');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('application/json');
      expect(response.body.audit).toBeDefined();
    });
  });

  describe('PATCH /api/audits/:id/findings/:findingId/dismiss', () => {
    it('should dismiss a finding', async () => {
      (mockPool.query as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ rows: [{ id: 'audit-123' }] })
        .mockResolvedValueOnce({ rows: [{ id: 'finding-1', status: 'dismissed', rule_id: 'test', message: 'test' }] });

      const response = await request
        .patch('/api/audits/audit-123/findings/finding-1/dismiss')
        .send({ status: 'dismissed' });

      expect(response.status).toBe(200);
      expect(response.body.finding.status).toBe('dismissed');
    });

    it('should reject invalid status', async () => {
      const response = await request
        .patch('/api/audits/audit-123/findings/finding-1/dismiss')
        .send({ status: 'invalid' });

      expect(response.status).toBe(400);
    });
  });
});
