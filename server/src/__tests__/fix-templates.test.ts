import { describe, it, expect } from 'vitest';
import {
  resolveFixSnippet,
  fixTemplates,
  type ResolvedFixSnippet,
} from '../data/fix-templates';

describe('fix-templates', () => {
  describe('resolveFixSnippet', () => {
    it('returns a valid ResolvedFixSnippet for missing-title', () => {
      const result = resolveFixSnippet('missing-title', {
        message: 'Page has no title',
      });
      expect(result).not.toBeNull();
      expect(result).toHaveProperty('fixType');
      expect(result).toHaveProperty('language');
      expect(result).toHaveProperty('code');
      expect(result).toHaveProperty('explanation');
      expect(result).toHaveProperty('effort');
      expect(result).toHaveProperty('learnMoreUrl');
      expect(result!.fixType).toBe('code');
      expect(result!.language).toBe('html');
      expect(typeof result!.code).toBe('string');
      expect(result!.code.length).toBeGreaterThan(0);
    });

    it('returns null for an unknown rule_id', () => {
      const result = resolveFixSnippet('unknown-rule-id', {});
      expect(result).toBeNull();
    });

    it('resolves variables when context provides values', () => {
      const result = resolveFixSnippet('color-contrast', {
        selector: '.my-img',
        message: 'fg: #000000 bg: #ffffff',
      });
      expect(result).not.toBeNull();
      // The selector variable strips the leading dot
      expect(result!.code).toContain('my-img');
      expect(result!.code).toContain('#000000');
      expect(result!.code).toContain('#ffffff');
    });

    it('uses fallback template when variables cannot be resolved', () => {
      // image-alt requires src and altText; altText always returns null
      const result = resolveFixSnippet('image-alt', {});
      expect(result).not.toBeNull();
      // Should use the fallback since variables can't be resolved
      expect(result!.code).toContain('Describe the image content here');
    });

    it('return type has all required fields', () => {
      const result = resolveFixSnippet('missing-title', {
        message: 'Page has no title',
      });
      expect(result).not.toBeNull();
      const keys: (keyof ResolvedFixSnippet)[] = [
        'fixType',
        'language',
        'code',
        'explanation',
        'effort',
        'learnMoreUrl',
      ];
      for (const key of keys) {
        expect(result).toHaveProperty(key);
      }
    });
  });

  describe('template definitions', () => {
    it('all templates have required fields', () => {
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

      for (const [ruleId, template] of Object.entries(fixTemplates)) {
        for (const field of requiredFields) {
          expect(template, `Template "${ruleId}" missing field "${field}"`).toHaveProperty(field);
        }
      }
    });

    it('fixType is one of the allowed values', () => {
      const allowedTypes = ['code', 'config', 'content', 'manual'];
      for (const [ruleId, template] of Object.entries(fixTemplates)) {
        expect(
          allowedTypes,
          `Template "${ruleId}" has invalid fixType "${template.fixType}"`,
        ).toContain(template.fixType);
      }
    });

    it('effort is one of the allowed values', () => {
      const allowedEfforts = ['small', 'medium', 'large'];
      for (const [ruleId, template] of Object.entries(fixTemplates)) {
        expect(
          allowedEfforts,
          `Template "${ruleId}" has invalid effort "${template.effort}"`,
        ).toContain(template.effort);
      }
    });

    it('variables is an array for every template', () => {
      for (const [ruleId, template] of Object.entries(fixTemplates)) {
        expect(
          Array.isArray(template.variables),
          `Template "${ruleId}" variables is not an array`,
        ).toBe(true);
      }
    });
  });
});
