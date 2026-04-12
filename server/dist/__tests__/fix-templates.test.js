"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const fix_templates_1 = require("../data/fix-templates");
(0, vitest_1.describe)('fix-templates', () => {
    (0, vitest_1.describe)('resolveFixSnippet', () => {
        (0, vitest_1.it)('returns a valid ResolvedFixSnippet for missing-title', () => {
            const result = (0, fix_templates_1.resolveFixSnippet)('missing-title', {
                message: 'Page has no title',
            });
            (0, vitest_1.expect)(result).not.toBeNull();
            (0, vitest_1.expect)(result).toHaveProperty('fixType');
            (0, vitest_1.expect)(result).toHaveProperty('language');
            (0, vitest_1.expect)(result).toHaveProperty('code');
            (0, vitest_1.expect)(result).toHaveProperty('explanation');
            (0, vitest_1.expect)(result).toHaveProperty('effort');
            (0, vitest_1.expect)(result).toHaveProperty('learnMoreUrl');
            (0, vitest_1.expect)(result.fixType).toBe('code');
            (0, vitest_1.expect)(result.language).toBe('html');
            (0, vitest_1.expect)(typeof result.code).toBe('string');
            (0, vitest_1.expect)(result.code.length).toBeGreaterThan(0);
        });
        (0, vitest_1.it)('returns null for an unknown rule_id', () => {
            const result = (0, fix_templates_1.resolveFixSnippet)('unknown-rule-id', {});
            (0, vitest_1.expect)(result).toBeNull();
        });
        (0, vitest_1.it)('resolves variables when context provides values', () => {
            const result = (0, fix_templates_1.resolveFixSnippet)('color-contrast', {
                selector: '.my-img',
                message: 'fg: #000000 bg: #ffffff',
            });
            (0, vitest_1.expect)(result).not.toBeNull();
            // The selector variable strips the leading dot
            (0, vitest_1.expect)(result.code).toContain('my-img');
            (0, vitest_1.expect)(result.code).toContain('#000000');
            (0, vitest_1.expect)(result.code).toContain('#ffffff');
        });
        (0, vitest_1.it)('uses fallback template when variables cannot be resolved', () => {
            // image-alt requires src and altText; altText always returns null
            const result = (0, fix_templates_1.resolveFixSnippet)('image-alt', {});
            (0, vitest_1.expect)(result).not.toBeNull();
            // Should use the fallback since variables can't be resolved
            (0, vitest_1.expect)(result.code).toContain('Describe the image content here');
        });
        (0, vitest_1.it)('return type has all required fields', () => {
            const result = (0, fix_templates_1.resolveFixSnippet)('missing-title', {
                message: 'Page has no title',
            });
            (0, vitest_1.expect)(result).not.toBeNull();
            const keys = [
                'fixType',
                'language',
                'code',
                'explanation',
                'effort',
                'learnMoreUrl',
            ];
            for (const key of keys) {
                (0, vitest_1.expect)(result).toHaveProperty(key);
            }
        });
    });
    (0, vitest_1.describe)('template definitions', () => {
        (0, vitest_1.it)('all templates have required fields', () => {
            const requiredFields = [
                'fixType',
                'language',
                'template',
                'variables',
                'fallbackTemplate',
                'explanation',
                'effort',
                'learnMoreUrl',
            ];
            for (const [ruleId, template] of Object.entries(fix_templates_1.fixTemplates)) {
                for (const field of requiredFields) {
                    (0, vitest_1.expect)(template, `Template "${ruleId}" missing field "${field}"`).toHaveProperty(field);
                }
            }
        });
        (0, vitest_1.it)('fixType is one of the allowed values', () => {
            const allowedTypes = ['code', 'config', 'content', 'manual'];
            for (const [ruleId, template] of Object.entries(fix_templates_1.fixTemplates)) {
                (0, vitest_1.expect)(allowedTypes, `Template "${ruleId}" has invalid fixType "${template.fixType}"`).toContain(template.fixType);
            }
        });
        (0, vitest_1.it)('effort is one of the allowed values', () => {
            const allowedEfforts = ['small', 'medium', 'large'];
            for (const [ruleId, template] of Object.entries(fix_templates_1.fixTemplates)) {
                (0, vitest_1.expect)(allowedEfforts, `Template "${ruleId}" has invalid effort "${template.effort}"`).toContain(template.effort);
            }
        });
        (0, vitest_1.it)('variables is an array for every template', () => {
            for (const [ruleId, template] of Object.entries(fix_templates_1.fixTemplates)) {
                (0, vitest_1.expect)(Array.isArray(template.variables), `Template "${ruleId}" variables is not an array`).toBe(true);
            }
        });
    });
});
//# sourceMappingURL=fix-templates.test.js.map