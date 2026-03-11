// @ts-nocheck
/**
 * Structured Data Engine
 *
 * Analyzes JSON-LD, Microdata, and Open Graph data on web pages.
 * Validates schema.org structured data for completeness and correctness.
 *
 * Scoring:
 * - Presence of structured data: 40 points
 * - Valid JSON-LD syntax: 20 points
 * - Contextual match (right schema for page type): 20 points
 * - Completeness (required/recommended fields): 20 points
 */

import * as cheerio from 'cheerio';
import type { StructuredDataFinding, Severity } from '../../types/finding.types.js';
import type { CrawlResult } from '../../types/spider.types.js';
import type {
  StructuredDataAnalysis,
  StructuredDataContext,
  ParsedJsonLd,
  OpenGraphData,
  TwitterCardData,
  MicrodataItem,
  StructuredDataValidationError,
} from '../../types/structured-data.types.js';
import { SCHEMA_REQUIREMENTS, PAGE_TYPE_EXPECTATIONS } from '../../types/structured-data.types.js';

// Rule interface
interface StructuredDataRule {
  id: string;
  name: string;
  description: string;
  severity: Severity;
  helpUrl?: string;
  check: (ctx: StructuredDataContext) => StructuredDataFinding | StructuredDataFinding[] | null;
}

export class StructuredDataEngine {
  private rules: StructuredDataRule[] = [
    // Critical: No structured data at all
    {
      id: 'no-structured-data',
      name: 'Missing Structured Data',
      description: 'Page has no JSON-LD, Microdata, or RDFa structured data',
      severity: 'critical',
      helpUrl: 'https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data',
      check: (ctx) => {
        if (!ctx.analysis.jsonLd.found && !ctx.analysis.microdata.found) {
          return this.createFinding(
            'no-structured-data',
            'Missing Structured Data',
            'critical',
            'No structured data (JSON-LD or Microdata) found on this page. You are missing out on Rich Snippets in search results.',
            'Add JSON-LD structured data to help search engines understand your content. Start with Organization schema for your homepage, and Article/Product schemas for content pages.',
            undefined,
            undefined,
            undefined
          );
        }
        return null;
      },
    },

    // Critical: Invalid JSON-LD syntax
    {
      id: 'invalid-json-ld-syntax',
      name: 'Invalid JSON-LD Syntax',
      description: 'JSON-LD contains syntax errors and cannot be parsed',
      severity: 'critical',
      helpUrl: 'https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data#json-ld',
      check: (ctx) => {
        const invalidItems = ctx.analysis.jsonLd.items.filter(item => !item.isValid);
        if (invalidItems.length === 0) return null;

        return invalidItems.map(item => this.createFinding(
          'invalid-json-ld-syntax',
          'Invalid JSON-LD Syntax',
          'critical',
          `JSON-LD contains syntax errors: ${item.parseError}`,
          'Fix the JSON syntax errors in your structured data. Use a JSON validator to identify and correct the issues.',
          'script[type="application/ld+json"]',
          item.raw.substring(0, 200) + (item.raw.length > 200 ? '...' : ''),
          undefined
        ));
      },
    },

    // Serious: Missing @type
    {
      id: 'missing-schema-type',
      name: 'Missing Schema Type',
      description: 'JSON-LD is missing the required @type property',
      severity: 'serious',
      helpUrl: 'https://schema.org/docs/gs.html',
      check: (ctx) => {
        const findings: StructuredDataFinding[] = [];

        for (const item of ctx.analysis.jsonLd.items) {
          if (item.isValid && item.parsed) {
            const items = Array.isArray(item.parsed) ? item.parsed : [item.parsed];
            for (const obj of items) {
              if (obj && typeof obj === 'object' && !obj['@type']) {
                findings.push(this.createFinding(
                  'missing-schema-type',
                  'Missing Schema Type',
                  'serious',
                  'JSON-LD object is missing the required @type property',
                  'Add a @type property to specify the schema type (e.g., "Organization", "Article", "Product")',
                  'script[type="application/ld+json"]',
                  JSON.stringify(obj).substring(0, 150) + '...',
                  undefined
                ));
              }
            }
          }
        }

        return findings.length > 0 ? findings : null;
      },
    },

    // Serious: Homepage missing Organization/WebSite schema
    {
      id: 'homepage-missing-organization',
      name: 'Homepage Missing Organization Schema',
      description: 'Homepage should have Organization or WebSite schema',
      severity: 'serious',
      helpUrl: 'https://developers.google.com/search/docs/appearance/structured-data/organization',
      check: (ctx) => {
        if (!ctx.isHomepage) return null;

        const hasOrgOrWebsite = ctx.analysis.detectedTypes.some(
          t => t === 'Organization' || t === 'WebSite'
        );

        if (!hasOrgOrWebsite && ctx.analysis.jsonLd.found) {
          return this.createFinding(
            'homepage-missing-organization',
            'Homepage Missing Organization Schema',
            'serious',
            'Your homepage has structured data but is missing Organization or WebSite schema',
            'Add Organization schema with your company name, logo, contact information, and social profiles to establish your brand in search results.',
            undefined,
            undefined,
            'Organization'
          );
        }

        return null;
      },
    },

    // Moderate: Missing recommended fields
    {
      id: 'missing-recommended-fields',
      name: 'Missing Recommended Fields',
      description: 'Schema is missing recommended fields that could improve rich snippets',
      severity: 'moderate',
      helpUrl: 'https://schema.org/',
      check: (ctx) => {
        const findings: StructuredDataFinding[] = [];

        for (const item of ctx.analysis.jsonLd.items) {
          if (!item.isValid || !item.parsed) continue;

          const items = Array.isArray(item.parsed) ? item.parsed : [item.parsed];
          for (const obj of items) {
            if (!obj || typeof obj !== 'object' || !obj['@type']) continue;

            const schemaType = obj['@type'];
            const requirements = SCHEMA_REQUIREMENTS[schemaType];
            if (!requirements) continue;

            const missingRecommended = requirements.recommended.filter(
              field => !obj[field]
            );

            if (missingRecommended.length > 0) {
              findings.push(this.createFinding(
                'missing-recommended-fields',
                'Missing Recommended Fields',
                'moderate',
                `${schemaType} schema is missing recommended fields: ${missingRecommended.slice(0, 3).join(', ')}${missingRecommended.length > 3 ? ` and ${missingRecommended.length - 3} more` : ''}`,
                `Add the missing fields to improve your chances of getting rich snippets: ${missingRecommended.join(', ')}`,
                undefined,
                undefined,
                schemaType
              ));
            }
          }
        }

        return findings.length > 0 ? findings.slice(0, 5) : null; // Limit to 5 findings
      },
    },

    // Moderate: Missing required fields
    {
      id: 'missing-required-fields',
      name: 'Missing Required Fields',
      description: 'Schema is missing required fields',
      severity: 'serious',
      helpUrl: 'https://schema.org/',
      check: (ctx) => {
        const findings: StructuredDataFinding[] = [];

        for (const item of ctx.analysis.jsonLd.items) {
          if (!item.isValid || !item.parsed) continue;

          const items = Array.isArray(item.parsed) ? item.parsed : [item.parsed];
          for (const obj of items) {
            if (!obj || typeof obj !== 'object' || !obj['@type']) continue;

            const schemaType = obj['@type'];
            const requirements = SCHEMA_REQUIREMENTS[schemaType];
            if (!requirements) continue;

            const missingRequired = requirements.required.filter(
              field => field !== '@type' && !obj[field]
            );

            if (missingRequired.length > 0) {
              findings.push(this.createFinding(
                'missing-required-fields',
                'Missing Required Fields',
                'serious',
                `${schemaType} schema is missing required fields: ${missingRequired.join(', ')}`,
                `Add the required fields to ensure your structured data is valid: ${missingRequired.join(', ')}`,
                undefined,
                undefined,
                schemaType
              ));
            }
          }
        }

        return findings.length > 0 ? findings.slice(0, 5) : null;
      },
    },

    // Moderate: Missing Open Graph data
    {
      id: 'missing-open-graph',
      name: 'Missing Open Graph Data',
      description: 'Page is missing Open Graph meta tags for social sharing',
      severity: 'moderate',
      helpUrl: 'https://ogp.me/',
      check: (ctx) => {
        if (ctx.analysis.openGraph.found && ctx.analysis.openGraph.completeness >= 50) {
          return null;
        }

        const missingTags: string[] = [];
        if (!ctx.analysis.openGraph.data.title) missingTags.push('og:title');
        if (!ctx.analysis.openGraph.data.description) missingTags.push('og:description');
        if (!ctx.analysis.openGraph.data.image) missingTags.push('og:image');
        if (!ctx.analysis.openGraph.data.url) missingTags.push('og:url');

        if (missingTags.length === 0) return null;

        return this.createFinding(
          'missing-open-graph',
          'Missing Open Graph Data',
          'moderate',
          `Missing Open Graph tags for social sharing: ${missingTags.join(', ')}`,
          'Add Open Graph meta tags to control how your content appears when shared on social media platforms like Facebook and LinkedIn.',
          'head',
          undefined,
          undefined
        );
      },
    },

    // Minor: Missing Twitter Card data
    {
      id: 'missing-twitter-card',
      name: 'Missing Twitter Card Data',
      description: 'Page is missing Twitter Card meta tags',
      severity: 'minor',
      helpUrl: 'https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards',
      check: (ctx) => {
        if (ctx.analysis.twitterCard.found && ctx.analysis.twitterCard.completeness >= 50) {
          return null;
        }

        // If Open Graph is present, Twitter will fall back to that
        if (ctx.analysis.openGraph.found && ctx.analysis.openGraph.completeness >= 75) {
          return null;
        }

        return this.createFinding(
          'missing-twitter-card',
          'Missing Twitter Card Data',
          'minor',
          'Missing Twitter Card meta tags for Twitter/X sharing',
          'Add Twitter Card meta tags (twitter:card, twitter:title, twitter:description, twitter:image) for better Twitter sharing previews.',
          'head',
          undefined,
          undefined
        );
      },
    },

    // Info: Schema type suggestions based on page content
    {
      id: 'schema-suggestion',
      name: 'Schema Type Suggestion',
      description: 'Suggests appropriate schema types based on page content',
      severity: 'info',
      helpUrl: 'https://schema.org/',
      check: (ctx) => {
        if (!ctx.analysis.detectedPageType) return null;
        if (ctx.analysis.missingExpectedTypes.length === 0) return null;

        const missing = ctx.analysis.missingExpectedTypes;

        return this.createFinding(
          'schema-suggestion',
          'Schema Type Suggestion',
          'info',
          `Based on your page content (${ctx.analysis.detectedPageType}), consider adding: ${missing.join(', ')} schema`,
          `Adding ${missing.join(' and ')} schema can help your page qualify for rich snippets specific to this content type.`,
          undefined,
          undefined,
          missing[0]
        );
      },
    },

    // Info: Product page without offers
    {
      id: 'product-missing-offer',
      name: 'Product Missing Offer Schema',
      description: 'Product schema should include Offer for price display in search',
      severity: 'moderate',
      helpUrl: 'https://developers.google.com/search/docs/appearance/structured-data/product',
      check: (ctx) => {
        const hasProduct = ctx.analysis.detectedTypes.includes('Product');
        const hasOffer = ctx.analysis.detectedTypes.includes('Offer');

        if (hasProduct && !hasOffer) {
          // Check if offers is nested in the Product
          for (const item of ctx.analysis.jsonLd.items) {
            if (item.isValid && item.parsed) {
              const items = Array.isArray(item.parsed) ? item.parsed : [item.parsed];
              for (const obj of items) {
                if (obj?.['@type'] === 'Product' && obj?.offers) {
                  return null; // Has nested offers
                }
              }
            }
          }

          return this.createFinding(
            'product-missing-offer',
            'Product Missing Offer Schema',
            'moderate',
            'Product schema found but missing Offer information (price, availability)',
            'Add Offer schema with price, priceCurrency, and availability to display pricing in search results.',
            undefined,
            undefined,
            'Product'
          );
        }

        return null;
      },
    },

    // Info: Article without author
    {
      id: 'article-missing-author',
      name: 'Article Missing Author',
      description: 'Article schema should include author information for E-E-A-T',
      severity: 'moderate',
      helpUrl: 'https://developers.google.com/search/docs/appearance/structured-data/article',
      check: (ctx) => {
        const articleTypes = ['Article', 'NewsArticle', 'BlogPosting'];

        for (const item of ctx.analysis.jsonLd.items) {
          if (!item.isValid || !item.parsed) continue;

          const items = Array.isArray(item.parsed) ? item.parsed : [item.parsed];
          for (const obj of items) {
            if (obj && articleTypes.includes(obj['@type']) && !obj.author) {
              return this.createFinding(
                'article-missing-author',
                'Article Missing Author',
                'moderate',
                'Article schema is missing author information, which is important for E-E-A-T signals',
                'Add author property with name and optionally url to establish content credibility.',
                undefined,
                undefined,
                obj['@type']
              );
            }
          }
        }

        return null;
      },
    },
  ];

  /**
   * Analyze a page for structured data
   * Returns both findings and the analysis result
   */
  async analyze(crawlResult: CrawlResult): Promise<{ findings: StructuredDataFinding[]; analysis: StructuredDataAnalysis }> {
    const $ = cheerio.load(crawlResult.html);

    // Perform the analysis
    const analysis = this.analyzeStructuredData($, crawlResult.url);

    // Determine if this is the homepage
    const urlObj = new URL(crawlResult.url);
    const isHomepage = urlObj.pathname === '/' || urlObj.pathname === '';

    // Create context for rules
    const ctx: StructuredDataContext = {
      url: crawlResult.url,
      html: crawlResult.html,
      $: $ as any, // Type compatibility with StructuredDataContext
      analysis,
      isHomepage,
    };

    // Run all rules
    const findings: StructuredDataFinding[] = [];

    for (const rule of this.rules) {
      try {
        const result = rule.check(ctx);
        if (result) {
          if (Array.isArray(result)) {
            findings.push(...result);
          } else {
            findings.push(result);
          }
        }
      } catch (error) {
        console.warn(`Structured data rule ${rule.id} failed:`, error);
      }
    }

    return { findings, analysis };
  }

  /**
   * Analyze structured data on the page
   */
  private analyzeStructuredData($: ReturnType<typeof cheerio.load>, url: string): StructuredDataAnalysis {
    // Extract JSON-LD
    const jsonLdItems = this.extractJsonLd($);

    // Extract Microdata
    const microdataItems = this.extractMicrodata($);

    // Extract Open Graph
    const openGraphData = this.extractOpenGraph($);

    // Extract Twitter Card
    const twitterCardData = this.extractTwitterCard($);

    // Get all detected types
    const detectedTypes = this.getDetectedTypes(jsonLdItems, microdataItems);

    // Detect page type and expected schemas
    const { pageType, missingTypes } = this.detectPageTypeAndExpectations($, detectedTypes, url);

    // Calculate score
    const score = this.calculateScore(jsonLdItems, openGraphData, detectedTypes, missingTypes);

    // Get validation errors
    const validationErrors = this.getValidationErrors(jsonLdItems);

    return {
      score,
      jsonLd: {
        found: jsonLdItems.length > 0,
        count: jsonLdItems.length,
        items: jsonLdItems,
        validCount: jsonLdItems.filter(i => i.isValid).length,
        invalidCount: jsonLdItems.filter(i => !i.isValid).length,
      },
      microdata: {
        found: microdataItems.length > 0,
        count: microdataItems.length,
        items: microdataItems,
      },
      openGraph: {
        found: !!openGraphData.title || !!openGraphData.image,
        data: openGraphData,
        completeness: this.calculateOpenGraphCompleteness(openGraphData),
      },
      twitterCard: {
        found: !!twitterCardData.card,
        data: twitterCardData,
        completeness: this.calculateTwitterCardCompleteness(twitterCardData),
      },
      detectedTypes,
      missingExpectedTypes: missingTypes,
      detectedPageType: pageType,
      validationErrors,
    };
  }

  /**
   * Extract JSON-LD scripts from the page
   */
  private extractJsonLd($: ReturnType<typeof cheerio.load>): ParsedJsonLd[] {
    const items: ParsedJsonLd[] = [];

    $('script[type="application/ld+json"]').each((_, el) => {
      const raw = $(el).html() || '';

      try {
        const parsed = JSON.parse(raw);
        const types = this.extractTypesFromJsonLd(parsed);

        items.push({
          raw,
          parsed,
          isValid: true,
          types,
        });
      } catch (error) {
        items.push({
          raw,
          parsed: null,
          isValid: false,
          parseError: error instanceof Error ? error.message : 'Invalid JSON',
          types: [],
        });
      }
    });

    return items;
  }

  /**
   * Extract types from parsed JSON-LD
   */
  private extractTypesFromJsonLd(parsed: any): string[] {
    const types: string[] = [];

    const extract = (obj: any) => {
      if (!obj || typeof obj !== 'object') return;

      if (obj['@type']) {
        if (Array.isArray(obj['@type'])) {
          types.push(...obj['@type']);
        } else {
          types.push(obj['@type']);
        }
      }

      // Check @graph
      if (Array.isArray(obj['@graph'])) {
        obj['@graph'].forEach(extract);
      }

      // Check nested objects
      for (const key of Object.keys(obj)) {
        if (typeof obj[key] === 'object') {
          extract(obj[key]);
        }
      }
    };

    if (Array.isArray(parsed)) {
      parsed.forEach(extract);
    } else {
      extract(parsed);
    }

    return [...new Set(types)];
  }

  /**
   * Extract Microdata from the page
   */
  private extractMicrodata($: ReturnType<typeof cheerio.load>): MicrodataItem[] {
    const items: MicrodataItem[] = [];

    $('[itemscope]').each((_, el) => {
      const $el = $(el);
      const itemtype = $el.attr('itemtype');

      if (itemtype) {
        const type = itemtype.replace('https://schema.org/', '').replace('http://schema.org/', '');
        const properties: Record<string, any> = {};

        $el.find('[itemprop]').each((_, propEl) => {
          const $prop = $(propEl);
          const propName = $prop.attr('itemprop');
          if (propName) {
            properties[propName] = $prop.attr('content') || $prop.text().trim();
          }
        });

        items.push({ type, properties });
      }
    });

    return items;
  }

  /**
   * Extract Open Graph data
   */
  private extractOpenGraph($: ReturnType<typeof cheerio.load>): OpenGraphData {
    return {
      title: $('meta[property="og:title"]').attr('content'),
      description: $('meta[property="og:description"]').attr('content'),
      image: $('meta[property="og:image"]').attr('content'),
      url: $('meta[property="og:url"]').attr('content'),
      type: $('meta[property="og:type"]').attr('content'),
      siteName: $('meta[property="og:site_name"]').attr('content'),
      locale: $('meta[property="og:locale"]').attr('content'),
    };
  }

  /**
   * Extract Twitter Card data
   */
  private extractTwitterCard($: ReturnType<typeof cheerio.load>): TwitterCardData {
    return {
      card: $('meta[name="twitter:card"]').attr('content'),
      title: $('meta[name="twitter:title"]').attr('content'),
      description: $('meta[name="twitter:description"]').attr('content'),
      image: $('meta[name="twitter:image"]').attr('content'),
      site: $('meta[name="twitter:site"]').attr('content'),
      creator: $('meta[name="twitter:creator"]').attr('content'),
    };
  }

  /**
   * Get all detected schema types
   */
  private getDetectedTypes(jsonLdItems: ParsedJsonLd[], microdataItems: MicrodataItem[]): string[] {
    const types = new Set<string>();

    for (const item of jsonLdItems) {
      item.types.forEach(t => types.add(t));
    }

    for (const item of microdataItems) {
      types.add(item.type);
    }

    return Array.from(types);
  }

  /**
   * Detect page type and expected schemas
   */
  private detectPageTypeAndExpectations(
    $: ReturnType<typeof cheerio.load>,
    detectedTypes: string[],
    url: string
  ): { pageType: string | null; missingTypes: string[] } {
    const urlObj = new URL(url);
    const isHomepage = urlObj.pathname === '/' || urlObj.pathname === '';

    // Check for homepage
    if (isHomepage) {
      const expected = ['Organization', 'WebSite'];
      const missing = expected.filter(t => !detectedTypes.includes(t));
      return { pageType: 'homepage', missingTypes: missing };
    }

    // Check for article indicators
    if ($('article').length > 0 || $('[class*="article"]').length > 0 || $('[class*="post"]').length > 0) {
      const expected = ['Article', 'BreadcrumbList'];
      const missing = expected.filter(t =>
        !detectedTypes.includes(t) &&
        !detectedTypes.includes('BlogPosting') &&
        !detectedTypes.includes('NewsArticle')
      );
      return { pageType: 'article', missingTypes: missing };
    }

    // Check for product indicators
    if ($('[class*="add-to-cart"]').length > 0 ||
        $('[class*="product"]').length > 0 ||
        $('button:contains("Buy")').length > 0 ||
        $('[class*="price"]').length > 0) {
      const expected = ['Product'];
      const missing = expected.filter(t => !detectedTypes.includes(t));
      return { pageType: 'product', missingTypes: missing };
    }

    // Check for FAQ indicators
    if ($('[class*="faq"]').length > 0 ||
        $('details').length >= 3 ||
        $('[class*="accordion"]').length > 0) {
      const expected = ['FAQPage'];
      const missing = expected.filter(t => !detectedTypes.includes(t));
      return { pageType: 'faq', missingTypes: missing };
    }

    return { pageType: null, missingTypes: [] };
  }

  /**
   * Calculate structured data score
   */
  private calculateScore(
    jsonLdItems: ParsedJsonLd[],
    openGraph: OpenGraphData,
    detectedTypes: string[],
    missingTypes: string[]
  ): number {
    let score = 0;

    // Presence (40 points)
    if (jsonLdItems.length > 0) {
      score += 40;
    } else if (openGraph.title) {
      score += 15; // Partial credit for Open Graph
    }

    // Validity (20 points)
    if (jsonLdItems.length > 0) {
      const validRatio = jsonLdItems.filter(i => i.isValid).length / jsonLdItems.length;
      score += Math.round(validRatio * 20);
    }

    // Contextual match (20 points)
    if (detectedTypes.length > 0) {
      const contextScore = missingTypes.length === 0 ? 20 : Math.max(0, 20 - (missingTypes.length * 5));
      score += contextScore;
    }

    // Completeness (20 points) - based on having multiple schema types and Open Graph
    let completenessScore = 0;
    if (detectedTypes.length >= 2) completenessScore += 10;
    if (openGraph.title && openGraph.description && openGraph.image) completenessScore += 10;
    score += completenessScore;

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Calculate Open Graph completeness
   */
  private calculateOpenGraphCompleteness(og: OpenGraphData): number {
    const fields = ['title', 'description', 'image', 'url', 'type', 'siteName'];
    const present = fields.filter(f => !!(og as any)[f]).length;
    return Math.round((present / fields.length) * 100);
  }

  /**
   * Calculate Twitter Card completeness
   */
  private calculateTwitterCardCompleteness(tc: TwitterCardData): number {
    const fields = ['card', 'title', 'description', 'image'];
    const present = fields.filter(f => !!(tc as any)[f]).length;
    return Math.round((present / fields.length) * 100);
  }

  /**
   * Get validation errors from JSON-LD
   */
  private getValidationErrors(jsonLdItems: ParsedJsonLd[]): StructuredDataValidationError[] {
    const errors: StructuredDataValidationError[] = [];

    for (const item of jsonLdItems) {
      if (!item.isValid) {
        errors.push({
          type: 'syntax_error',
          message: item.parseError || 'Invalid JSON syntax',
          severity: 'critical',
        });
        continue;
      }

      if (!item.parsed) continue;

      const items = Array.isArray(item.parsed) ? item.parsed : [item.parsed];
      for (const obj of items) {
        if (!obj || typeof obj !== 'object') continue;

        const schemaType = obj['@type'];
        if (!schemaType) {
          errors.push({
            type: 'missing_required',
            field: '@type',
            message: 'Missing @type property',
            severity: 'critical',
          });
          continue;
        }

        const requirements = SCHEMA_REQUIREMENTS[schemaType];
        if (!requirements) continue;

        for (const field of requirements.required) {
          if (field !== '@type' && !obj[field]) {
            errors.push({
              type: 'missing_required',
              schemaType,
              field,
              message: `${schemaType} is missing required field: ${field}`,
              severity: 'warning',
            });
          }
        }
      }
    }

    return errors;
  }

  /**
   * Create a structured data finding
   */
  private createFinding(
    ruleId: string,
    ruleName: string,
    severity: Severity,
    message: string,
    recommendation: string,
    selector?: string,
    snippet?: string,
    schemaType?: string
  ): StructuredDataFinding {
    const rule = this.rules.find(r => r.id === ruleId);
    return {
      ruleId,
      ruleName,
      category: 'structured-data',
      severity,
      message,
      description: rule?.description,
      recommendation,
      selector,
      snippet,
      helpUrl: rule?.helpUrl,
      schemaType,
    };
  }

  /**
   * Get the full analysis (for detailed reporting)
   */
  getAnalysis(crawlResult: CrawlResult): StructuredDataAnalysis {
    const $ = cheerio.load(crawlResult.html);
    return this.analyzeStructuredData($, crawlResult.url);
  }
}

/**
 * Factory function to create the engine
 */
export function createStructuredDataEngine(): StructuredDataEngine {
  return new StructuredDataEngine();
}
