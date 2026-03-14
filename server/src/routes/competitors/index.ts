import { Router, Request, Response } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import {
  loadOrganization,
  requireFeature,
  requirePermission,
  type OrganizationRequest,
} from '../../middleware/organization.middleware.js';
import {
  createCompetitor,
  getCompetitors,
  getCompetitorById,
  updateCompetitor,
  deleteCompetitor,
  getCompetitorAudits,
  checkCompetitorLimit,
  getCompetitorUsage,
  createComparison,
  getComparisons,
  getComparisonById,
  deleteComparison,
  getScoresDiff,
  getFindingsDiff,
  getRecommendations,
} from '../../services/competitor.service.js';

const router = Router({ mergeParams: true });

// All routes require authentication and organization context
router.use(authenticate);
router.use(loadOrganization);

// =============================================
// COMPETITOR FEATURE DISABLED
// This feature is temporarily disabled for liability reasons.
// Users can still scan any URL (including competitors) using the
// standard audit flow, which now includes consent and limitations
// for unverified domains.
// =============================================
router.use((_req: Request, res: Response): void => {
  res.status(403).json({
    error: 'Competitor comparison feature is currently unavailable',
    code: 'FEATURE_DISABLED',
    message: 'You can still scan any website using the standard audit feature. Unverified domains will require consent and have scan limitations.',
  });
});

// NOTE: The code below is kept for reference but will not execute due to the middleware above
router.use(requireFeature('competitor_comparison'));

// =============================================
// COMPETITOR PROFILES
// =============================================

/**
 * GET /api/organizations/:organizationId/competitors
 * List all competitors for the organization
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const orgReq = req as OrganizationRequest;
    const organizationId = orgReq.organizationId!;

    const competitors = await getCompetitors(organizationId);

    // Transform to camelCase for API
    const transformed = competitors.map(c => ({
      id: c.id,
      domain: c.domain,
      name: c.name,
      notes: c.notes,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
      latestAudit: c.latest_audit_id ? {
        id: c.latest_audit_id,
        completedAt: c.latest_audit_completed_at,
        seoScore: c.latest_seo_score,
        accessibilityScore: c.latest_accessibility_score,
        securityScore: c.latest_security_score,
        performanceScore: c.latest_performance_score,
      } : undefined,
    }));

    res.json({ competitors: transformed });
  } catch (error: any) {
    console.error('Get competitors error:', error);
    res.status(500).json({ error: 'Failed to get competitors' });
  }
});

/**
 * POST /api/organizations/:organizationId/competitors
 * Create a new competitor profile
 */
router.post(
  '/',
  requirePermission('audit:create'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const orgReq = req as OrganizationRequest;
      const organizationId = orgReq.organizationId!;
      const userId = orgReq.user!.id;
      const { domain, name, notes } = req.body;

      if (!domain) {
        res.status(400).json({ error: 'Domain is required' });
        return;
      }

      const competitor = await createCompetitor(organizationId, userId, { domain, name, notes });

      res.status(201).json({
        competitor: {
          id: competitor.id,
          domain: competitor.domain,
          name: competitor.name,
          notes: competitor.notes,
          createdAt: competitor.created_at,
          updatedAt: competitor.updated_at,
        },
      });
    } catch (error: any) {
      console.error('Create competitor error:', error);
      res.status(400).json({ error: error.message || 'Failed to create competitor' });
    }
  }
);

/**
 * GET /api/organizations/:organizationId/competitors/usage
 * Get competitor domain usage for the current period
 */
router.get('/usage', async (req: Request, res: Response): Promise<void> => {
  try {
    const orgReq = req as OrganizationRequest;
    const organizationId = orgReq.organizationId!;

    const usage = await getCompetitorUsage(organizationId);
    const limitCheck = await checkCompetitorLimit(organizationId);

    res.json({
      competitorDomains: usage.domains,
      competitorDomainsUsed: usage.domainsUsed,
      maxCompetitorDomains: usage.max,
      canAddMore: limitCheck.allowed,
    });
  } catch (error: any) {
    console.error('Get competitor usage error:', error);
    res.status(500).json({ error: 'Failed to get competitor usage' });
  }
});

/**
 * GET /api/organizations/:organizationId/competitors/:competitorId
 * Get a single competitor with their audits
 */
router.get('/:competitorId', async (req: Request, res: Response): Promise<void> => {
  try {
    const orgReq = req as OrganizationRequest;
    const organizationId = orgReq.organizationId!;
    const { competitorId } = req.params;

    const competitor = await getCompetitorById(competitorId);

    if (!competitor) {
      res.status(404).json({ error: 'Competitor not found' });
      return;
    }

    if (competitor.organization_id !== organizationId) {
      res.status(403).json({ error: 'Competitor does not belong to this organization' });
      return;
    }

    const audits = await getCompetitorAudits(competitorId);

    res.json({
      competitor: {
        id: competitor.id,
        domain: competitor.domain,
        name: competitor.name,
        notes: competitor.notes,
        createdAt: competitor.created_at,
        updatedAt: competitor.updated_at,
      },
      audits: audits.map(a => ({
        id: a.id,
        targetUrl: a.target_url,
        targetDomain: a.target_domain,
        status: a.status,
        seoScore: a.seo_score,
        accessibilityScore: a.accessibility_score,
        securityScore: a.security_score,
        performanceScore: a.performance_score,
        totalIssues: a.total_issues,
        pagesCrawled: a.pages_crawled,
        startedAt: a.started_at,
        completedAt: a.completed_at,
        createdAt: a.created_at,
      })),
    });
  } catch (error: any) {
    console.error('Get competitor error:', error);
    res.status(500).json({ error: 'Failed to get competitor' });
  }
});

/**
 * PUT /api/organizations/:organizationId/competitors/:competitorId
 * Update a competitor profile
 */
router.put(
  '/:competitorId',
  requirePermission('audit:edit'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const orgReq = req as OrganizationRequest;
      const organizationId = orgReq.organizationId!;
      const { competitorId } = req.params;
      const { name, notes } = req.body;

      const existing = await getCompetitorById(competitorId);
      if (!existing || existing.organization_id !== organizationId) {
        res.status(404).json({ error: 'Competitor not found' });
        return;
      }

      const competitor = await updateCompetitor(competitorId, { name, notes });

      res.json({
        competitor: {
          id: competitor.id,
          domain: competitor.domain,
          name: competitor.name,
          notes: competitor.notes,
          createdAt: competitor.created_at,
          updatedAt: competitor.updated_at,
        },
      });
    } catch (error: any) {
      console.error('Update competitor error:', error);
      res.status(400).json({ error: error.message || 'Failed to update competitor' });
    }
  }
);

/**
 * DELETE /api/organizations/:organizationId/competitors/:competitorId
 * Delete a competitor profile
 */
router.delete(
  '/:competitorId',
  requirePermission('audit:delete'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const orgReq = req as OrganizationRequest;
      const organizationId = orgReq.organizationId!;
      const { competitorId } = req.params;

      const existing = await getCompetitorById(competitorId);
      if (!existing || existing.organization_id !== organizationId) {
        res.status(404).json({ error: 'Competitor not found' });
        return;
      }

      await deleteCompetitor(competitorId);

      res.json({ success: true });
    } catch (error: any) {
      console.error('Delete competitor error:', error);
      res.status(500).json({ error: 'Failed to delete competitor' });
    }
  }
);

// =============================================
// COMPARISONS
// =============================================

/**
 * GET /api/organizations/:organizationId/comparisons
 * List all comparisons for the organization
 */
router.get('/comparisons', async (req: Request, res: Response): Promise<void> => {
  try {
    const orgReq = req as OrganizationRequest;
    const organizationId = orgReq.organizationId!;

    const comparisons = await getComparisons(organizationId);

    res.json({
      comparisons: comparisons.map(c => ({
        id: c.id,
        name: c.name,
        createdAt: c.created_at,
        myAudit: {
          id: c.my_audit.id,
          targetUrl: c.my_audit.target_url,
          targetDomain: c.my_audit.target_domain,
          seoScore: c.my_audit.seo_score,
          accessibilityScore: c.my_audit.accessibility_score,
          securityScore: c.my_audit.security_score,
          performanceScore: c.my_audit.performance_score,
          completedAt: c.my_audit.completed_at,
        },
        competitorAudit: {
          id: c.competitor_audit.id,
          targetUrl: c.competitor_audit.target_url,
          targetDomain: c.competitor_audit.target_domain,
          seoScore: c.competitor_audit.seo_score,
          accessibilityScore: c.competitor_audit.accessibility_score,
          securityScore: c.competitor_audit.security_score,
          performanceScore: c.competitor_audit.performance_score,
          completedAt: c.competitor_audit.completed_at,
        },
      })),
    });
  } catch (error: any) {
    console.error('Get comparisons error:', error);
    res.status(500).json({ error: 'Failed to get comparisons' });
  }
});

/**
 * POST /api/organizations/:organizationId/comparisons
 * Create a new comparison
 */
router.post(
  '/comparisons',
  requirePermission('audit:create'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const orgReq = req as OrganizationRequest;
      const organizationId = orgReq.organizationId!;
      const userId = orgReq.user!.id;
      const { myAuditId, competitorAuditId, name } = req.body;

      if (!myAuditId || !competitorAuditId) {
        res.status(400).json({ error: 'Both myAuditId and competitorAuditId are required' });
        return;
      }

      const comparison = await createComparison(organizationId, userId, {
        myAuditId,
        competitorAuditId,
        name,
      });

      res.status(201).json({
        comparison: {
          id: comparison.id,
          name: comparison.name,
          myAuditId: comparison.my_audit_id,
          competitorAuditId: comparison.competitor_audit_id,
          createdAt: comparison.created_at,
        },
      });
    } catch (error: any) {
      console.error('Create comparison error:', error);
      res.status(400).json({ error: error.message || 'Failed to create comparison' });
    }
  }
);

/**
 * GET /api/organizations/:organizationId/comparisons/:comparisonId
 * Get a single comparison with full analysis
 */
router.get('/comparisons/:comparisonId', async (req: Request, res: Response): Promise<void> => {
  try {
    const orgReq = req as OrganizationRequest;
    const organizationId = orgReq.organizationId!;
    const { comparisonId } = req.params;

    const comparison = await getComparisonById(comparisonId);

    if (!comparison) {
      res.status(404).json({ error: 'Comparison not found' });
      return;
    }

    if (comparison.organization_id !== organizationId) {
      res.status(403).json({ error: 'Comparison does not belong to this organization' });
      return;
    }

    // Get full analysis
    const [scoresDiff, findingsDiff] = await Promise.all([
      getScoresDiff(comparison.my_audit_id, comparison.competitor_audit_id),
      getFindingsDiff(comparison.my_audit_id, comparison.competitor_audit_id),
    ]);

    const recommendations = getRecommendations(scoresDiff);

    res.json({
      comparison: {
        id: comparison.id,
        name: comparison.name,
        createdAt: comparison.created_at,
        myAudit: {
          id: comparison.my_audit.id,
          targetUrl: comparison.my_audit.target_url,
          targetDomain: comparison.my_audit.target_domain,
          seoScore: comparison.my_audit.seo_score,
          accessibilityScore: comparison.my_audit.accessibility_score,
          securityScore: comparison.my_audit.security_score,
          performanceScore: comparison.my_audit.performance_score,
          completedAt: comparison.my_audit.completed_at,
        },
        competitorAudit: {
          id: comparison.competitor_audit.id,
          targetUrl: comparison.competitor_audit.target_url,
          targetDomain: comparison.competitor_audit.target_domain,
          seoScore: comparison.competitor_audit.seo_score,
          accessibilityScore: comparison.competitor_audit.accessibility_score,
          securityScore: comparison.competitor_audit.security_score,
          performanceScore: comparison.competitor_audit.performance_score,
          completedAt: comparison.competitor_audit.completed_at,
        },
      },
      scoresDiff,
      findingsDiff: {
        onlyInMine: findingsDiff.onlyInMine.map(f => ({
          ruleId: f.rule_id,
          ruleName: f.rule_name,
          category: f.category,
          severity: f.severity,
          count: f.count,
        })),
        onlyInCompetitor: findingsDiff.onlyInCompetitor.map(f => ({
          ruleId: f.rule_id,
          ruleName: f.rule_name,
          category: f.category,
          severity: f.severity,
          count: f.count,
        })),
        inBoth: findingsDiff.inBoth.map(f => ({
          ruleId: f.rule_id,
          ruleName: f.rule_name,
          category: f.category,
          severity: f.severity,
          count: f.count,
        })),
      },
      recommendations,
    });
  } catch (error: any) {
    console.error('Get comparison error:', error);
    res.status(500).json({ error: 'Failed to get comparison' });
  }
});

/**
 * DELETE /api/organizations/:organizationId/comparisons/:comparisonId
 * Delete a comparison
 */
router.delete(
  '/comparisons/:comparisonId',
  requirePermission('audit:delete'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const orgReq = req as OrganizationRequest;
      const organizationId = orgReq.organizationId!;
      const { comparisonId } = req.params;

      const existing = await getComparisonById(comparisonId);
      if (!existing || existing.organization_id !== organizationId) {
        res.status(404).json({ error: 'Comparison not found' });
        return;
      }

      await deleteComparison(comparisonId);

      res.json({ success: true });
    } catch (error: any) {
      console.error('Delete comparison error:', error);
      res.status(500).json({ error: 'Failed to delete comparison' });
    }
  }
);

export default router;
