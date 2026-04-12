"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccessibilityEngine = void 0;
exports.createAccessibilityEngine = createAccessibilityEngine;
const fs = __importStar(require("fs"));
// Cached axe-core source
let axeSource = null;
class AccessibilityEngine {
    wcagConfig;
    constructor(wcagConfig) {
        this.wcagConfig = wcagConfig || { version: '2.2', level: 'AA' };
    }
    /**
     * Analyze a page for accessibility issues using axe-core
     * Note: This requires a Playwright Page object, not just HTML
     */
    async analyze(page) {
        try {
            // Inject axe-core
            await this.injectAxe(page);
            // Run axe-core analysis
            const results = await this.runAxe(page);
            // Map results to findings
            return this.mapResults(results);
        }
        catch (error) {
            console.error('Accessibility analysis failed:', error);
            return [];
        }
    }
    /**
     * Get WCAG tags based on version and level configuration
     */
    getWcagTags() {
        const tags = [];
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
    async injectAxe(page) {
        if (!axeSource) {
            // Load axe-core source from node_modules
            const axePath = require.resolve('axe-core');
            axeSource = fs.readFileSync(axePath, 'utf8');
        }
        // Check if axe is already injected
        const hasAxe = await page.evaluate(() => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return typeof globalThis.axe !== 'undefined';
        });
        if (!hasAxe) {
            await page.evaluate(axeSource);
        }
    }
    /**
     * Run axe-core analysis on the page
     */
    async runAxe(page) {
        const wcagTags = this.getWcagTags();
        const results = await page.evaluate(async (tags) => {
            // Configure axe-core
            const options = {
                runOnly: {
                    type: 'tag',
                    values: tags,
                },
                resultTypes: ['violations', 'incomplete'],
            };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const axe = globalThis.axe;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const doc = globalThis.document;
            return await axe.run(doc, options);
        }, wcagTags);
        return results;
    }
    /**
     * Map axe-core results to our finding format
     */
    mapResults(results) {
        const findings = [];
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
    createFinding(violation, node, type) {
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
    extractContrastData(node) {
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
    mapSeverity(impact) {
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
    extractWcagCriteria(tags) {
        const wcagCriteria = [];
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
    getRecommendation(ruleId) {
        const recommendations = {
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
    static getStats(findings) {
        const stats = {
            total: findings.length,
            bySeverity: {},
            byWcagLevel: {},
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
exports.AccessibilityEngine = AccessibilityEngine;
/**
 * Create an accessibility engine instance
 */
function createAccessibilityEngine(wcagConfig) {
    return new AccessibilityEngine(wcagConfig);
}
//# sourceMappingURL=accessibility.engine.js.map