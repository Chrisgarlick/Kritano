import { Pool } from 'pg';
import { Page } from 'playwright';
import { SeoEngine, createSeoEngine } from './seo.engine';
import { AccessibilityEngine, createAccessibilityEngine, WcagConfig } from './accessibility.engine';
import { SecurityEngine, createSecurityEngine } from './security.engine';
import { PerformanceEngine, createPerformanceEngine } from './performance.engine';
import { ContentEngine, createContentEngine } from './content.engine';
import { StructuredDataEngine, createStructuredDataEngine } from './structured-data.engine';
import type { CrawlResult } from '../../types/spider.types';
import type { Finding, FindingCategory } from '../../types/finding.types';
import type { WcagVersion, WcagLevel } from '../../types/audit.types';
import type { ContentAnalysisResult, ContentFinding } from '../../types/content.types';
import type { StructuredDataAnalysis } from '../../types/structured-data.types';

export { SeoEngine, createSeoEngine } from './seo.engine';
export { AccessibilityEngine, createAccessibilityEngine } from './accessibility.engine';
export { SecurityEngine, createSecurityEngine } from './security.engine';
export { PerformanceEngine, createPerformanceEngine } from './performance.engine';
export { ContentEngine, createContentEngine } from './content.engine';
export { StructuredDataEngine, createStructuredDataEngine } from './structured-data.engine';

// Audit configuration
export interface AuditConfig {
  checkSeo: boolean;
  checkAccessibility: boolean;
  checkSecurity: boolean;
  checkPerformance: boolean;
  checkContent: boolean;
  checkStructuredData: boolean;
  checkEeat: boolean; // E-E-A-T analysis (Pro+ tier)
  checkAeo: boolean;  // AEO citability analysis (Pro+ tier)
  wcagVersion?: WcagVersion;
  wcagLevel?: WcagLevel;
  targetKeyword?: string; // For content keyword analysis
}

// Audit result for a single page
export interface PageAuditResult {
  pageId: string;
  url: string;
  findings: Finding[];
  scores: {
    seo: number | null;
    accessibility: number | null;
    security: number | null;
    performance: number | null;
    content: number | null;
    structuredData: number | null;
  };
  issueCounts: {
    seo: number;
    accessibility: number;
    security: number;
    performance: number;
    content: number;
    structuredData: number;
  };
  contentAnalysis?: ContentAnalysisResult;
  structuredDataAnalysis?: StructuredDataAnalysis;
}

/**
 * Coordinates all audit engines for analyzing pages
 */
export class AuditEngineCoordinator {
  private seoEngine: SeoEngine;
  private securityEngine: SecurityEngine;
  private performanceEngine: PerformanceEngine;
  private structuredDataEngine: StructuredDataEngine;
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
    this.seoEngine = createSeoEngine();
    this.securityEngine = createSecurityEngine();
    this.performanceEngine = createPerformanceEngine();
    this.structuredDataEngine = createStructuredDataEngine();
  }

  /**
   * Analyze content quality for a page
   */
  async analyzeContent(
    crawlResult: CrawlResult,
    targetKeyword?: string,
    enableEeat: boolean = true,
    enableAeo: boolean = false,
    metaKeywords?: string | null
  ): Promise<ContentAnalysisResult> {
    // Use targetKeyword if provided; otherwise fall back to the first meta keyword
    let keyword = targetKeyword;
    if (!keyword && metaKeywords) {
      keyword = metaKeywords.split(',')[0]?.trim() || undefined;
    }

    const contentEngine = createContentEngine({
      targetKeyword: keyword,
      enableKeywordAnalysis: !!keyword,
      enableEeat,
      enableAeo,
    });
    return contentEngine.analyze(crawlResult);
  }

  /**
   * Convert content findings to standard Finding format
   */
  private convertContentFindings(contentFindings: ContentFinding[]): Finding[] {
    return contentFindings.map(cf => ({
      ruleId: cf.ruleId,
      ruleName: cf.ruleName,
      // Preserve sub-categories (content-aeo, content-eeat) for dedicated UI sections
      category: (cf.category === 'content-aeo' || cf.category === 'content-eeat'
        ? cf.category
        : 'content') as FindingCategory,
      severity: cf.severity,
      message: cf.message,
      description: cf.description,
      recommendation: cf.recommendation,
      selector: cf.location?.selector,
      snippet: cf.location?.excerpt,
    }));
  }

  /**
   * Analyze a single page with all configured engines
   * Note: For accessibility, we need the Playwright Page object
   */
  async analyzePage(
    crawlResult: CrawlResult,
    page: Page | null,
    config: AuditConfig,
    depth: number = 0
  ): Promise<{ findings: Finding[]; contentAnalysis?: ContentAnalysisResult; structuredDataAnalysis?: StructuredDataAnalysis }> {
    const findings: Finding[] = [];
    let contentAnalysis: ContentAnalysisResult | undefined;
    let structuredDataAnalysis: StructuredDataAnalysis | undefined;

    // Run audits in parallel where possible
    const auditPromises: Promise<Finding[]>[] = [];

    if (config.checkSeo) {
      auditPromises.push(this.seoEngine.analyze(crawlResult, depth));
    }

    if (config.checkAccessibility && page) {
      // Create accessibility engine with WCAG config
      const wcagConfig: WcagConfig = {
        version: config.wcagVersion || '2.2',
        level: config.wcagLevel || 'AA',
      };
      const accessibilityEngine = createAccessibilityEngine(wcagConfig);
      auditPromises.push(accessibilityEngine.analyze(page));
    }

    if (config.checkSecurity) {
      auditPromises.push(this.securityEngine.analyze(crawlResult));
    }

    if (config.checkPerformance) {
      auditPromises.push(this.performanceEngine.analyze(crawlResult, page));
    }

    const results = await Promise.all(auditPromises);
    for (const result of results) {
      findings.push(...result);
    }

    // Run content analysis (separate from other audits for cleaner result handling)
    if (config.checkContent) {
      try {
        contentAnalysis = await this.analyzeContent(crawlResult, config.targetKeyword, config.checkEeat, config.checkAeo, crawlResult.metaKeywords);
        // Convert content findings to standard format
        const contentFindings = this.convertContentFindings(contentAnalysis.findings);
        findings.push(...contentFindings);
      } catch (error) {
        console.warn('Content analysis failed:', error);
      }
    }

    // Run structured data analysis
    if (config.checkStructuredData) {
      try {
        const { findings: sdFindings, analysis } = await this.structuredDataEngine.analyze(crawlResult);
        structuredDataAnalysis = analysis;
        findings.push(...sdFindings);
      } catch (error) {
        console.warn('Structured data analysis failed:', error);
      }
    }

    return { findings, contentAnalysis, structuredDataAnalysis };
  }

  /**
   * Analyze a single page with mobile-only engines (accessibility + performance).
   * Called during the mobile audit pass — does not run SEO, security, content, or structured data.
   */
  async analyzeMobilePage(
    crawlResult: CrawlResult,
    page: Page | null,
    config: AuditConfig
  ): Promise<{ findings: Finding[] }> {
    const findings: Finding[] = [];
    const auditPromises: Promise<Finding[]>[] = [];

    // Accessibility on mobile viewport (axe-core adapts automatically)
    if (config.checkAccessibility && page) {
      const wcagConfig: WcagConfig = {
        version: config.wcagVersion || '2.2',
        level: config.wcagLevel || 'AA',
      };
      const accessibilityEngine = createAccessibilityEngine(wcagConfig);
      auditPromises.push(accessibilityEngine.analyze(page));
    }

    // Performance with mobile-specific rules
    if (config.checkPerformance) {
      auditPromises.push(this.performanceEngine.analyzeMobile(crawlResult, page));
    }

    const results = await Promise.all(auditPromises);
    for (const result of results) {
      findings.push(...result);
    }

    // Tag all findings as mobile
    for (const finding of findings) {
      finding.deviceType = 'mobile';
    }

    return { findings };
  }

  /**
   * Deduplicate findings that appear on both desktop and mobile passes.
   * Identical findings (same rule_id + page + selector) get merged to device_type='both',
   * and the mobile duplicate is removed.
   */
  async deduplicateFindings(auditJobId: string): Promise<number> {
    const result = await this.pool.query(`
      WITH duplicates AS (
        SELECT f1.id as desktop_id, f2.id as mobile_id
        FROM audit_findings f1
        JOIN audit_findings f2
          ON f1.audit_job_id = f2.audit_job_id
          AND f1.audit_page_id IS NOT DISTINCT FROM f2.audit_page_id
          AND f1.rule_id = f2.rule_id
          AND COALESCE(f1.selector, '') = COALESCE(f2.selector, '')
        WHERE f1.device_type = 'desktop'
          AND f2.device_type = 'mobile'
          AND f1.audit_job_id = $1
      ),
      updated AS (
        UPDATE audit_findings SET device_type = 'both'
        WHERE id IN (SELECT desktop_id FROM duplicates)
        RETURNING id
      ),
      deleted AS (
        DELETE FROM audit_findings
        WHERE id IN (SELECT mobile_id FROM duplicates)
        RETURNING id
      )
      SELECT (SELECT COUNT(*) FROM deleted) as deduped_count
    `, [auditJobId]);

    return parseInt(result.rows[0]?.deduped_count || '0');
  }

  /**
   * Probe for exposed sensitive files (run once per audit)
   */
  async probeExposedFiles(baseUrl: string): Promise<Finding[]> {
    return this.securityEngine.probeExposedFiles(baseUrl);
  }

  /**
   * Store findings in the database
   */
  async storeFindings(
    auditJobId: string,
    pageId: string | null,
    findings: Finding[],
    deviceType: 'desktop' | 'mobile' = 'desktop'
  ): Promise<void> {
    if (findings.length === 0) return;

    // Batch insert findings
    const values: any[] = [];
    const placeholders: string[] = [];
    let paramIndex = 1;

    for (const finding of findings) {
      const params = [
        auditJobId,
        pageId,
        finding.category,
        finding.ruleId,
        finding.ruleName,
        finding.severity,
        finding.message,
        finding.description || null,
        finding.recommendation || null,
        finding.selector || null,
        null, // line_number
        null, // column_number
        finding.snippet?.substring(0, 500) || null,
        'impact' in finding ? finding.impact : null,
        'wcagCriteria' in finding ? finding.wcagCriteria : null,
        finding.helpUrl || null,
        finding.deviceType || deviceType,
      ];

      values.push(...params);
      placeholders.push(
        `($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5}, $${paramIndex + 6}, $${paramIndex + 7}, $${paramIndex + 8}, $${paramIndex + 9}, $${paramIndex + 10}, $${paramIndex + 11}, $${paramIndex + 12}, $${paramIndex + 13}, $${paramIndex + 14}, $${paramIndex + 15}, $${paramIndex + 16})`
      );
      paramIndex += 17;
    }

    const query = `
      INSERT INTO audit_findings (
        audit_job_id, audit_page_id, category, rule_id, rule_name,
        severity, message, description, recommendation, selector,
        line_number, column_number, snippet, impact, wcag_criteria, help_url,
        device_type
      ) VALUES ${placeholders.join(', ')}
      ON CONFLICT DO NOTHING
    `;

    await this.pool.query(query, values);
  }

  /**
   * Calculate score for a category based on findings
   */
  calculateScore(findings: Finding[], category: FindingCategory): number {
    const categoryFindings = findings.filter(f => f.category === category);

    if (categoryFindings.length === 0) {
      return 100; // Perfect score if no issues
    }

    let score = 100;

    // Deductions by severity
    const deductions: Record<string, number> = {
      critical: 20,
      serious: 12,
      moderate: 6,
      minor: 2,
      info: 0,
    };

    for (const finding of categoryFindings) {
      score -= deductions[finding.severity] || 0;
    }

    // Cap at 0
    return Math.max(0, score);
  }

  /**
   * Count issues by category
   */
  countByCategory(findings: Finding[]): Record<FindingCategory, number> {
    const counts: Record<FindingCategory, number> = {
      seo: 0,
      accessibility: 0,
      security: 0,
      performance: 0,
      content: 0,
      'structured-data': 0,
    };

    for (const finding of findings) {
      counts[finding.category]++;
    }

    return counts;
  }

  /**
   * Update page record with audit results
   */
  async updatePageAuditResults(
    pageId: string,
    findings: Finding[],
    config: AuditConfig,
    contentAnalysis?: ContentAnalysisResult,
    structuredDataAnalysis?: StructuredDataAnalysis
  ): Promise<void> {
    const counts = this.countByCategory(findings);

    const scores = {
      seo: config.checkSeo ? this.calculateScore(findings, 'seo') : null,
      accessibility: config.checkAccessibility ? this.calculateScore(findings, 'accessibility') : null,
      security: config.checkSecurity ? this.calculateScore(findings, 'security') : null,
      performance: config.checkPerformance ? this.calculateScore(findings, 'performance') : null,
      content: contentAnalysis?.score ?? null,
      structuredData: structuredDataAnalysis?.score ?? null,
    };

    // Build update query with all available data
    const setClauses: string[] = [
      'seo_score = $2',
      'accessibility_score = $3',
      'security_score = $4',
      'performance_score = $5',
      'seo_issues = $6',
      'accessibility_issues = $7',
      'security_issues = $8',
      'performance_issues = $9',
    ];
    const params: any[] = [
      pageId,
      scores.seo,
      scores.accessibility,
      scores.security,
      scores.performance,
      counts.seo,
      counts.accessibility,
      counts.security,
      counts.performance,
    ];
    let paramIndex = 10;

    // Add content analysis fields if available
    if (contentAnalysis) {
      setClauses.push(
        `content_score = $${paramIndex}`,
        `content_issues = $${paramIndex + 1}`,
        `content_quality_score = $${paramIndex + 2}`,
        `content_readability_score = $${paramIndex + 3}`,
        `content_structure_score = $${paramIndex + 4}`,
        `content_engagement_score = $${paramIndex + 5}`,
        `flesch_kincaid_grade = $${paramIndex + 6}`,
        `flesch_reading_ease = $${paramIndex + 7}`,
        `reading_time_minutes = $${paramIndex + 8}`,
        `content_type = $${paramIndex + 9}`,
        `eeat_score = $${paramIndex + 10}`,
        `eeat_experience_score = $${paramIndex + 11}`,
        `eeat_expertise_score = $${paramIndex + 12}`,
        `eeat_authoritativeness_score = $${paramIndex + 13}`,
        `eeat_trustworthiness_score = $${paramIndex + 14}`,
        `has_author_bio = $${paramIndex + 15}`,
        `has_author_credentials = $${paramIndex + 16}`,
        `citation_count = $${paramIndex + 17}`,
        `has_contact_info = $${paramIndex + 18}`,
        `has_privacy_policy = $${paramIndex + 19}`,
        `has_terms_of_service = $${paramIndex + 20}`,
        `eeat_tier = $${paramIndex + 21}`,
        `eeat_evidence = $${paramIndex + 22}`
      );
      params.push(
        scores.content,
        counts.content,
        contentAnalysis.subscores.quality,
        contentAnalysis.subscores.readability,
        contentAnalysis.subscores.structure,
        contentAnalysis.subscores.engagement,
        contentAnalysis.metrics.fleschKincaidGrade,
        contentAnalysis.metrics.fleschReadingEase,
        contentAnalysis.readingTimeMinutes,
        contentAnalysis.contentType,
        contentAnalysis.subscores.eeat,
        contentAnalysis.metrics.eeatExperienceScore ?? null,
        contentAnalysis.metrics.eeatExpertiseScore ?? null,
        contentAnalysis.metrics.eeatAuthoritativenessScore ?? null,
        contentAnalysis.metrics.eeatTrustworthinessScore ?? null,
        contentAnalysis.metrics.hasAuthorBio ?? null,
        contentAnalysis.metrics.hasAuthorCredentials ?? null,
        contentAnalysis.metrics.citationCount ?? null,
        contentAnalysis.metrics.hasContactInfo ?? null,
        contentAnalysis.metrics.hasPrivacyPolicy ?? null,
        contentAnalysis.metrics.hasTermsOfService ?? null,
        contentAnalysis.metrics.eeatTier ?? null,
        contentAnalysis.metrics.eeatEvidence ? JSON.stringify(contentAnalysis.metrics.eeatEvidence) : null
      );
      paramIndex += 23;

      // Keyword data (when available)
      if (contentAnalysis.keywordMetrics) {
        setClauses.push(`keyword_data = $${paramIndex}`);
        params.push(JSON.stringify(contentAnalysis.keywordMetrics));
        paramIndex += 1;
      }

      // AEO metrics (when available)
      if (contentAnalysis.subscores.aeo != null) {
        setClauses.push(
          `aeo_score = $${paramIndex}`,
          `aeo_nugget_score = $${paramIndex + 1}`,
          `aeo_factual_density_score = $${paramIndex + 2}`,
          `aeo_source_authority_score = $${paramIndex + 3}`,
          `aeo_tier = $${paramIndex + 4}`,
          `aeo_nuggets = $${paramIndex + 5}`,
          `aeo_content_frontloaded = $${paramIndex + 6}`,
          `aeo_content_frontloading_ratio = $${paramIndex + 7}`
        );
        params.push(
          contentAnalysis.subscores.aeo,
          contentAnalysis.metrics.aeoNuggetScore ?? null,
          contentAnalysis.metrics.aeoFactualDensityScore ?? null,
          contentAnalysis.metrics.aeoSourceAuthorityScore ?? null,
          contentAnalysis.metrics.aeoTier ?? null,
          contentAnalysis.metrics.aeoNuggets ? JSON.stringify(contentAnalysis.metrics.aeoNuggets) : null,
          contentAnalysis.metrics.aeoContentFrontloaded ?? null,
          contentAnalysis.metrics.aeoContentFrontloadingRatio ?? null
        );
        paramIndex += 8;
      }
    }

    // Add structured data analysis fields if available
    if (structuredDataAnalysis) {
      // Extract compact JSON-LD summaries (type + key fields only, no raw HTML)
      const jsonLdSummaries = structuredDataAnalysis.jsonLd.items
        .filter(item => item.isValid && item.parsed)
        .map(item => {
          const p = item.parsed;
          const summary: Record<string, any> = { '@type': p['@type'] };
          // Copy key fields that are useful for preview
          for (const key of ['name', 'headline', 'description', 'image', 'url', 'author',
            'price', 'priceCurrency', 'availability', 'ratingValue', 'reviewCount',
            'bestRating', 'worstRating', 'datePublished', 'dateModified',
            'startDate', 'endDate', 'location', 'address', 'telephone',
            'openingHours', 'priceRange', 'mainEntity', 'publisher',
            'aggregateRating', 'offers', 'brand', 'sku']) {
            if (p[key] !== undefined) summary[key] = p[key];
          }
          return summary;
        });

      setClauses.push(
        `structured_data_score = $${paramIndex}`,
        `structured_data_issues = $${paramIndex + 1}`,
        `json_ld_count = $${paramIndex + 2}`,
        `has_open_graph = $${paramIndex + 3}`,
        `has_twitter_card = $${paramIndex + 4}`,
        `detected_schema_types = $${paramIndex + 5}`,
        `detected_page_type = $${paramIndex + 6}`,
        `open_graph_data = $${paramIndex + 7}`,
        `twitter_card_data = $${paramIndex + 8}`,
        `json_ld_items = $${paramIndex + 9}`
      );
      params.push(
        scores.structuredData,
        counts['structured-data'],
        structuredDataAnalysis.jsonLd.count,
        structuredDataAnalysis.openGraph.found,
        structuredDataAnalysis.twitterCard.found,
        structuredDataAnalysis.detectedTypes,
        structuredDataAnalysis.detectedPageType,
        structuredDataAnalysis.openGraph.found ? JSON.stringify(structuredDataAnalysis.openGraph.data) : null,
        structuredDataAnalysis.twitterCard.found ? JSON.stringify(structuredDataAnalysis.twitterCard.data) : null,
        jsonLdSummaries.length > 0 ? JSON.stringify(jsonLdSummaries) : null
      );
    }

    const query = `
      UPDATE audit_pages SET
        ${setClauses.join(',\n        ')}
      WHERE id = $1
    `;

    await this.pool.query(query, params);
  }

  /**
   * Get summary of findings for an audit job
   */
  async getFindingsSummary(auditJobId: string): Promise<{
    total: number;
    bySeverity: Record<string, number>;
    byCategory: Record<string, number>;
  }> {
    const result = await this.pool.query<{ category: string; severity: string; count: string }>(`
      SELECT category, severity, COUNT(*) as count
      FROM audit_findings
      WHERE audit_job_id = $1
      GROUP BY category, severity
    `, [auditJobId]);

    const summary = {
      total: 0,
      bySeverity: {} as Record<string, number>,
      byCategory: {} as Record<string, number>,
    };

    for (const row of result.rows) {
      const count = parseInt(row.count, 10);
      summary.total += count;
      summary.bySeverity[row.severity] = (summary.bySeverity[row.severity] || 0) + count;
      summary.byCategory[row.category] = (summary.byCategory[row.category] || 0) + count;
    }

    return summary;
  }
}

/**
 * Create an audit engine coordinator
 */
export function createAuditEngineCoordinator(pool: Pool): AuditEngineCoordinator {
  return new AuditEngineCoordinator(pool);
}
