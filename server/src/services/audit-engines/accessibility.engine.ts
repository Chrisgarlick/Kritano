import { Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import type { AccessibilityFinding, Severity } from '../../types/finding.types';
import type { WcagVersion, WcagLevel } from '../../types/audit.types';

export interface WcagConfig {
  version: WcagVersion;
  level: WcagLevel;
}

// axe-core result types
interface AxeResult {
  violations: AxeViolation[];
  passes: AxeViolation[];
  incomplete: AxeViolation[];
  inapplicable: AxeViolation[];
}

interface AxeViolation {
  id: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor' | null;
  description: string;
  help: string;
  helpUrl: string;
  tags: string[];
  nodes: AxeNode[];
}

interface AxeCheckData {
  fgColor?: string;
  bgColor?: string;
  contrastRatio?: number;
  expectedContrastRatio?: string;
  fontSize?: string;
  fontWeight?: string;
}

interface AxeCheck {
  id: string;
  data: AxeCheckData | null;
  message: string;
}

interface AxeNode {
  html: string;
  target: string[];
  failureSummary?: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor' | null;
  any?: AxeCheck[];
  all?: AxeCheck[];
  none?: AxeCheck[];
}

// Cached axe-core source
let axeSource: string | null = null;

export class AccessibilityEngine {
  private wcagConfig: WcagConfig;

  constructor(wcagConfig?: WcagConfig) {
    this.wcagConfig = wcagConfig || { version: '2.2', level: 'AA' };
  }

  /**
   * Analyze a page for accessibility issues using axe-core
   * Note: This requires a Playwright Page object, not just HTML
   */
  async analyze(page: Page): Promise<AccessibilityFinding[]> {
    try {
      // Inject axe-core
      await this.injectAxe(page);

      // Run axe-core analysis
      const results = await this.runAxe(page);

      // Map results to findings
      return this.mapResults(results);
    } catch (error) {
      console.error('Accessibility analysis failed:', error);
      return [];
    }
  }

  /**
   * Get WCAG tags based on version and level configuration
   */
  private getWcagTags(): string[] {
    const tags: string[] = [];
    const { version, level } = this.wcagConfig;

    // Always include WCAG 2.0 A and AA (base requirements)
    tags.push('wcag2a');
    if (level === 'AA' || level === 'AAA') {
      tags.push('wcag2aa');
    }
    if (level === 'AAA') {
      tags.push('wcag2aaa');
    }

    // Include WCAG 2.1 if version is 2.1 or higher
    if (version === '2.1' || version === '2.2') {
      tags.push('wcag21a');
      if (level === 'AA' || level === 'AAA') {
        tags.push('wcag21aa');
      }
      if (level === 'AAA') {
        tags.push('wcag21aaa');
      }
    }

    // Include WCAG 2.2 if version is 2.2
    if (version === '2.2') {
      tags.push('wcag22a');
      if (level === 'AA' || level === 'AAA') {
        tags.push('wcag22aa');
      }
      // Note: WCAG 2.2 AAA tags may not be fully supported in axe-core yet
    }

    // Always include best practices
    tags.push('best-practice');

    return tags;
  }

  /**
   * Inject axe-core into the page
   */
  private async injectAxe(page: Page): Promise<void> {
    if (!axeSource) {
      // Load axe-core source from node_modules
      const axePath = require.resolve('axe-core');
      axeSource = fs.readFileSync(axePath, 'utf8');
    }

    // Check if axe is already injected
    const hasAxe = await page.evaluate(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return typeof (globalThis as any).axe !== 'undefined';
    });

    if (!hasAxe) {
      await page.evaluate(axeSource);
    }
  }

  /**
   * Run axe-core analysis on the page
   */
  private async runAxe(page: Page): Promise<AxeResult> {
    const wcagTags = this.getWcagTags();

    const results = await page.evaluate(async (tags: string[]) => {
      // Configure axe-core
      const options = {
        runOnly: {
          type: 'tag',
          values: tags,
        },
        resultTypes: ['violations', 'incomplete'],
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const axe = (globalThis as any).axe;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const doc = (globalThis as any).document;
      return await axe.run(doc, options);
    }, wcagTags);

    return results as AxeResult;
  }

  /**
   * Map axe-core results to our finding format
   */
  private mapResults(results: AxeResult): AccessibilityFinding[] {
    const findings: AccessibilityFinding[] = [];

    // Process violations
    for (const violation of results.violations) {
      for (const node of violation.nodes) {
        findings.push(this.createFinding(violation, node, 'violation'));
      }
    }

    // Process incomplete (needs review)
    for (const incomplete of results.incomplete) {
      for (const node of incomplete.nodes) {
        findings.push(this.createFinding(incomplete, node, 'incomplete'));
      }
    }

    return findings;
  }

  /**
   * Create a finding from an axe-core violation
   */
  private createFinding(
    violation: AxeViolation,
    node: AxeNode,
    type: 'violation' | 'incomplete'
  ): AccessibilityFinding {
    // Map axe impact to our severity — incomplete results are informational (needs manual review)
    const severity = type === 'incomplete' ? 'info' : this.mapSeverity(node.impact || violation.impact);

    // Extract WCAG criteria from tags
    const wcagCriteria = this.extractWcagCriteria(violation.tags);

    // Build the message — enhance with contrast ratio details (#19)
    let message = violation.help;
    if (type === 'incomplete') {
      message = `[Needs Review] ${message}`;
    }

    if (violation.id === 'color-contrast') {
      const contrastData = this.extractContrastData(node);
      if (contrastData) {
        message = `${message} (ratio ${contrastData.ratio}:1, expected ${contrastData.expected}`;
        if (contrastData.fgColor && contrastData.bgColor) {
          message += `, fg: ${contrastData.fgColor}, bg: ${contrastData.bgColor}`;
        }
        message += ')';
      }
    }

    return {
      ruleId: violation.id,
      ruleName: violation.help,
      category: 'accessibility',
      severity,
      message,
      description: violation.description,
      recommendation: node.failureSummary || this.getRecommendation(violation.id),
      selector: node.target.join(' > '),
      snippet: node.html.substring(0, 500),
      impact: node.impact || violation.impact || undefined,
      wcagCriteria,
      helpUrl: violation.helpUrl,
    };
  }

  /**
   * Extract contrast ratio data from axe-core node checks (#19)
   */
  private extractContrastData(node: AxeNode): { ratio: string; expected: string; fgColor?: string; bgColor?: string } | null {
    const checks = [...(node.any || []), ...(node.all || []), ...(node.none || [])];
    for (const check of checks) {
      if (check.id === 'color-contrast' && check.data) {
        const d = check.data;
        if (d.contrastRatio !== undefined) {
          return {
            ratio: d.contrastRatio.toFixed(2),
            expected: d.expectedContrastRatio || '4.5:1',
            fgColor: d.fgColor,
            bgColor: d.bgColor,
          };
        }
      }
    }
    return null;
  }

  /**
   * Map axe-core impact to our severity levels
   */
  private mapSeverity(impact: string | null): Severity {
    switch (impact) {
      case 'critical':
        return 'critical';
      case 'serious':
        return 'serious';
      case 'moderate':
        return 'moderate';
      case 'minor':
        return 'minor';
      default:
        return 'info';
    }
  }

  /**
   * Extract WCAG criteria from axe tags
   */
  private extractWcagCriteria(tags: string[]): string[] {
    const wcagCriteria: string[] = [];

    for (const tag of tags) {
      // Match patterns like "wcag111" -> "1.1.1"
      const match = tag.match(/^wcag(\d)(\d)(\d+)$/);
      if (match) {
        wcagCriteria.push(`${match[1]}.${match[2]}.${match[3]}`);
      }
    }

    return wcagCriteria;
  }

  /**
   * Get human-readable recommendation for common violations
   */
  private getRecommendation(ruleId: string): string {
    const recommendations: Record<string, string> = {
      'color-contrast': 'Ensure text has sufficient color contrast against its background (minimum ratio 4.5:1 for normal text, 3:1 for large text)',
      'image-alt': 'Add descriptive alt text to all images that convey information',
      'label': 'Associate form inputs with labels using the for/id attributes or wrap inputs in label elements',
      'link-name': 'Ensure links have discernible text that describes their purpose',
      'button-name': 'Give all buttons accessible names using text content, aria-label, or aria-labelledby',
      'html-has-lang': 'Add a lang attribute to the <html> element',
      'document-title': 'Add a descriptive <title> element to the page',
      'landmark-one-main': 'Add a <main> element or role="main" to identify the primary content',
      'region': 'Wrap page content in landmark regions (main, nav, header, footer, etc.)',
      'heading-order': 'Structure headings in logical order without skipping levels (H1 → H2 → H3)',
      'list': 'Ensure list items are contained within <ul>, <ol>, or <dl> elements',
      'listitem': 'Ensure <li> elements are direct children of <ul> or <ol>',
      'aria-valid-attr': 'Use only valid ARIA attributes',
      'aria-valid-attr-value': 'Provide valid values for ARIA attributes',
      'aria-roles': 'Use only valid ARIA role values',
      'tabindex': 'Avoid using tabindex values greater than 0',
      'focus-order-semantics': 'Ensure focusable elements have appropriate roles',
      'bypass': 'Add a skip link to bypass repetitive content',
      'frame-title': 'Provide titles for all iframe elements',
      'video-caption': 'Add captions to video content',
      'audio-caption': 'Provide transcripts for audio content',
    };

    return recommendations[ruleId] || 'Review and fix this accessibility issue following WCAG guidelines';
  }

  /**
   * Get statistics about accessibility findings
   */
  static getStats(findings: AccessibilityFinding[]): {
    total: number;
    bySeverity: Record<string, number>;
    byWcagLevel: Record<string, number>;
  } {
    const stats = {
      total: findings.length,
      bySeverity: {} as Record<string, number>,
      byWcagLevel: {} as Record<string, number>,
    };

    for (const finding of findings) {
      // Count by severity
      stats.bySeverity[finding.severity] = (stats.bySeverity[finding.severity] || 0) + 1;

      // Count by WCAG level
      if (finding.wcagCriteria) {
        for (const criterion of finding.wcagCriteria) {
          const level = criterion.split('.')[0]; // Get first digit
          stats.byWcagLevel[`Level ${level}`] = (stats.byWcagLevel[`Level ${level}`] || 0) + 1;
        }
      }
    }

    return stats;
  }
}

/**
 * Create an accessibility engine instance
 */
export function createAccessibilityEngine(wcagConfig?: WcagConfig): AccessibilityEngine {
  return new AccessibilityEngine(wcagConfig);
}
