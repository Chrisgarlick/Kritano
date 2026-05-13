import { describe, it, expect } from 'vitest';
import {
  anchorSlugForCategory,
  renderResourceAnchor,
} from '../services/blog-ssr.service.js';
import type { GatedResource } from '../types/gated-resource.types.js';

function makeResource(over: Partial<GatedResource> = {}): GatedResource {
  return {
    id: 'res-id',
    slug: 'website-health-checklist',
    title: 'The Website Health Checklist',
    subtitle: null,
    hook: 'A printable, six-pillar audit checklist.',
    category: 'guides',
    audience: null,
    description: 'desc',
    preview_md: 'preview',
    source_md_path: 'resources/website-health-checklist/source.md',
    formats: ['md', 'pdf'],
    content_hash: 'a'.repeat(64),
    page_count: 7,
    published: true,
    download_count: 0,
    created_at: '2026-05-12T00:00:00Z',
    updated_at: '2026-05-12T00:00:00Z',
    ...over,
  };
}

describe('anchorSlugForCategory', () => {
  it('returns the matrix slug for known categories', () => {
    expect(anchorSlugForCategory('seo')).toBe('website-health-checklist');
    expect(anchorSlugForCategory('accessibility')).toBe('wcag-quick-reference-card');
    expect(anchorSlugForCategory('security')).toBe('security-headers-guide');
    expect(anchorSlugForCategory('performance')).toBe('core-web-vitals-fix-guide');
    expect(anchorSlugForCategory('aeo')).toBe('aeo-optimisation-guide');
  });

  it('returns null for product-updates so promo posts skip the CTA', () => {
    expect(anchorSlugForCategory('product-updates')).toBeNull();
  });

  it('falls back to the flagship checklist for unmapped categories', () => {
    expect(anchorSlugForCategory('something-new')).toBe('website-health-checklist');
  });
});

describe('renderResourceAnchor', () => {
  it('returns an empty string when no resource is supplied', () => {
    expect(renderResourceAnchor(null)).toBe('');
  });

  it('returns an empty string for an unpublished resource', () => {
    expect(renderResourceAnchor(makeResource({ published: false }))).toBe('');
  });

  it('renders a link to /resources/<slug> with the title and hook', () => {
    const html = renderResourceAnchor(makeResource());
    expect(html).toContain('href="/resources/website-health-checklist"');
    expect(html).toContain('The Website Health Checklist');
    expect(html).toContain('A printable, six-pillar audit checklist.');
  });

  it('renders a badge per format and the page count', () => {
    const html = renderResourceAnchor(
      makeResource({ formats: ['md', 'pdf'], page_count: 7 })
    );
    expect(html).toContain('>md<');
    expect(html).toContain('>pdf<');
    expect(html).toContain('7 pages');
  });

  it('escapes HTML in title and hook to prevent injection', () => {
    const html = renderResourceAnchor(
      makeResource({
        title: '<script>alert(1)</script>',
        hook: 'Hook with "quotes" & ampersand',
      })
    );
    expect(html).not.toContain('<script>alert');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('&quot;quotes&quot;');
    expect(html).toContain('&amp;');
  });

  it('omits the page-count badge when page_count is null', () => {
    const html = renderResourceAnchor(makeResource({ page_count: null }));
    expect(html).not.toContain('pages');
  });
});
