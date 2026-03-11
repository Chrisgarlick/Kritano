// @ts-nocheck

import type { SeoFinding, Severity } from '../../types/finding.types';
import type { CrawlResult } from '../../types/spider.types';

// SEO rule definition
interface SeoRule {
  id: string;
  name: string;
  description: string;
  severity: Severity;
  helpUrl?: string;
  check: (ctx: SeoContext) => SeoFinding | SeoFinding[] | null;
}

// Context passed to rule checks
interface SeoContext {
  url: string;
  $: cheerio.Root;
  html: string;
  title: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  h1Text: string | null;
  wordCount: number;
  statusCode: number;
  responseTimeMs: number;
  redirectChainLength: number;
  depth: number;
}

// Thresholds
const TITLE_MIN_LENGTH = 30;
const TITLE_MAX_LENGTH = 60;
const META_DESC_MIN_LENGTH = 70;
const META_DESC_MAX_LENGTH = 160;
const THIN_CONTENT_THRESHOLD = 300; // words
const SLOW_PAGE_THRESHOLD = 3000; // ms

export class SeoEngine {
  private rules: SeoRule[] = [
    // Title rules
    {
      id: 'missing-title',
      name: 'Missing Page Title',
      description: 'Page is missing a title tag',
      severity: 'critical',
      helpUrl: 'https://developers.google.com/search/docs/appearance/title-link',
      check: (ctx) => {
        if (!ctx.title) {
          return this.createFinding('missing-title', 'Missing Page Title', 'critical',
            'Page is missing a <title> tag',
            'Add a unique, descriptive title tag between 30-60 characters',
            'head');
        }
        return null;
      },
    },
    {
      id: 'title-too-short',
      name: 'Title Too Short',
      description: 'Page title is too short for optimal SEO',
      severity: 'moderate',
      check: (ctx) => {
        if (ctx.title && ctx.title.length < TITLE_MIN_LENGTH) {
          return this.createFinding('title-too-short', 'Title Too Short', 'moderate',
            `Title is ${ctx.title.length} characters (recommended: ${TITLE_MIN_LENGTH}-${TITLE_MAX_LENGTH})`,
            'Expand the title to be more descriptive while staying under 60 characters',
            'title',
            `<title>${ctx.title}</title>`);
        }
        return null;
      },
    },
    {
      id: 'title-too-long',
      name: 'Title Too Long',
      description: 'Page title exceeds recommended length',
      severity: 'moderate',
      check: (ctx) => {
        if (ctx.title && ctx.title.length > TITLE_MAX_LENGTH) {
          return this.createFinding('title-too-long', 'Title Too Long', 'moderate',
            `Title is ${ctx.title.length} characters (recommended: max ${TITLE_MAX_LENGTH})`,
            'Shorten the title to prevent truncation in search results',
            'title',
            `<title>${ctx.title.substring(0, 100)}...</title>`);
        }
        return null;
      },
    },

    // Meta description rules
    {
      id: 'missing-meta-description',
      name: 'Missing Meta Description',
      description: 'Page is missing a meta description',
      severity: 'serious',
      check: (ctx) => {
        if (!ctx.metaDescription) {
          return this.createFinding('missing-meta-description', 'Missing Meta Description', 'serious',
            'Page is missing a meta description tag',
            'Add a compelling meta description between 70-160 characters');
        }
        return null;
      },
    },
    {
      id: 'meta-description-too-short',
      name: 'Meta Description Too Short',
      description: 'Meta description is too short',
      severity: 'minor',
      check: (ctx) => {
        if (ctx.metaDescription && ctx.metaDescription.length < META_DESC_MIN_LENGTH) {
          return this.createFinding('meta-description-too-short', 'Meta Description Too Short', 'minor',
            `Meta description is ${ctx.metaDescription.length} characters (recommended: ${META_DESC_MIN_LENGTH}-${META_DESC_MAX_LENGTH})`,
            'Expand the description to better summarize the page content');
        }
        return null;
      },
    },
    {
      id: 'meta-description-too-long',
      name: 'Meta Description Too Long',
      description: 'Meta description exceeds recommended length',
      severity: 'minor',
      check: (ctx) => {
        if (ctx.metaDescription && ctx.metaDescription.length > META_DESC_MAX_LENGTH) {
          return this.createFinding('meta-description-too-long', 'Meta Description Too Long', 'minor',
            `Meta description is ${ctx.metaDescription.length} characters (recommended: max ${META_DESC_MAX_LENGTH})`,
            'Shorten the description to prevent truncation in search results');
        }
        return null;
      },
    },

    // Heading rules
    {
      id: 'missing-h1',
      name: 'Missing H1 Heading',
      description: 'Page is missing an H1 heading',
      severity: 'serious',
      check: (ctx) => {
        const h1Count = ctx.$('h1').length;
        if (h1Count === 0) {
          return this.createFinding('missing-h1', 'Missing H1 Heading', 'serious',
            'Page is missing an H1 heading tag',
            'Add a single, descriptive H1 heading that includes your target keyword');
        }
        return null;
      },
    },
    {
      id: 'multiple-h1',
      name: 'Multiple H1 Headings',
      description: 'Page has more than one H1 heading',
      severity: 'moderate',
      check: (ctx) => {
        const h1s = ctx.$('h1');
        if (h1s.length > 1) {
          return this.createFinding('multiple-h1', 'Multiple H1 Headings', 'moderate',
            `Page has ${h1s.length} H1 headings (recommended: 1)`,
            'Use only one H1 per page; use H2-H6 for subheadings');
        }
        return null;
      },
    },
    {
      id: 'heading-hierarchy',
      name: 'Invalid Heading Hierarchy',
      description: 'Headings skip levels (e.g., H1 to H3)',
      severity: 'minor',
      check: (ctx) => {
        const headings: Array<{ level: number; text: string }> = [];
        ctx.$('h1, h2, h3, h4, h5, h6').each((_, el) => {
          const tag = ctx.$(el).prop('tagName');
          if (tag) {
            headings.push({
              level: parseInt(tag.substring(1), 10),
              text: ctx.$(el).text().trim().substring(0, 50),
            });
          }
        });

        const findings: SeoFinding[] = [];
        for (let i = 1; i < headings.length; i++) {
          const diff = headings[i].level - headings[i - 1].level;
          if (diff > 1) {
            findings.push(this.createFinding('heading-hierarchy', 'Invalid Heading Hierarchy', 'minor',
              `Heading jumps from H${headings[i - 1].level} to H${headings[i].level}`,
              'Maintain proper heading hierarchy (H1 → H2 → H3)',
              `h${headings[i].level}`,
              headings[i].text));
          }
        }
        return findings.length > 0 ? findings : null;
      },
    },

    // Image rules
    {
      id: 'missing-alt-text',
      name: 'Missing Image Alt Text',
      description: 'Image is missing alt attribute',
      severity: 'serious',
      check: (ctx) => {
        const findings: SeoFinding[] = [];
        ctx.$('img').each((_, el) => {
          const alt = ctx.$(el).attr('alt');
          const src = ctx.$(el).attr('src') || '';

          // Skip tracking pixels and data URIs
          if (src.startsWith('data:') || src.includes('tracking') || src.includes('pixel')) {
            return;
          }

          if (alt === undefined) {
            findings.push(this.createFinding('missing-alt-text', 'Missing Image Alt Text', 'serious',
              `Image is missing alt attribute`,
              'Add descriptive alt text for accessibility and SEO',
              `img[src="${src.substring(0, 100)}"]`,
              ctx.$(el).toString().substring(0, 200)));
          }
        });
        return findings.length > 0 ? findings : null;
      },
    },
    {
      id: 'empty-alt-text',
      name: 'Empty Image Alt Text',
      description: 'Image has empty alt attribute',
      severity: 'minor',
      check: (ctx) => {
        const findings: SeoFinding[] = [];
        ctx.$('img').each((_, el) => {
          const alt = ctx.$(el).attr('alt');
          const src = ctx.$(el).attr('src') || '';
          const role = ctx.$(el).attr('role');

          // Empty alt is valid for decorative images (role="presentation")
          if (role === 'presentation' || role === 'none') return;

          if (alt !== undefined && alt.trim() === '') {
            findings.push(this.createFinding('empty-alt-text', 'Empty Image Alt Text', 'minor',
              'Image has empty alt attribute (only valid for decorative images)',
              'Add descriptive alt text, or add role="presentation" for decorative images',
              `img[src="${src.substring(0, 100)}"]`));
          }
        });
        return findings.length > 0 ? findings : null;
      },
    },

    // Alt text quality (#18)
    {
      id: 'low-quality-alt-text',
      name: 'Low Quality Alt Text',
      description: 'Image alt text appears to be a filename or placeholder',
      severity: 'minor',
      check: (ctx) => {
        const findings: SeoFinding[] = [];
        const filenamePatterns = /\.(jpg|jpeg|png|gif|svg|webp|avif|bmp|ico)$/i;
        const placeholderPatterns = /^(image|img|photo|picture|icon|logo|banner|untitled|screenshot|screen shot|dsc_?\d|img_?\d|photo_?\d|image\s?\d)$/i;

        ctx.$('img[alt]').each((_, el) => {
          const alt = (ctx.$(el).attr('alt') || '').trim();
          const src = ctx.$(el).attr('src') || '';

          if (!alt) return; // Empty alt handled by empty-alt-text rule

          // Check if alt text looks like a filename
          if (filenamePatterns.test(alt) || alt.includes('/') || alt.includes('\\')) {
            findings.push(this.createFinding('low-quality-alt-text', 'Alt Text Appears to be Filename', 'minor',
              `Image alt text appears to be a filename: "${alt.substring(0, 60)}"`,
              'Replace with descriptive alt text that conveys the image content',
              `img[src="${src.substring(0, 80)}"]`,
              `alt="${alt.substring(0, 100)}"`));
          }
          // Check for generic placeholder text
          else if (placeholderPatterns.test(alt)) {
            findings.push(this.createFinding('low-quality-alt-text', 'Generic Alt Text', 'minor',
              `Image has generic alt text: "${alt}"`,
              'Use descriptive alt text that explains the image content',
              `img[src="${src.substring(0, 80)}"]`,
              `alt="${alt}"`));
          }
          // Check if alt text is too short (single word, non-decorative)
          else if (alt.length < 5 && !alt.match(/^(ok|go|no|yes|x)$/i)) {
            findings.push(this.createFinding('low-quality-alt-text', 'Very Short Alt Text', 'info',
              `Image alt text is very short: "${alt}"`,
              'Consider using more descriptive alt text',
              `img[src="${src.substring(0, 80)}"]`));
          }
        });

        return findings.length > 0 ? findings.slice(0, 10) : null;
      },
    },

    // Link rules
    {
      id: 'no-internal-links',
      name: 'No Internal Links',
      description: 'Page has no internal links',
      severity: 'moderate',
      check: (ctx) => {
        const internalLinks = ctx.$('a[href]').filter((_, el) => {
          const href = ctx.$(el).attr('href') || '';
          return !href.startsWith('http') && !href.startsWith('//') && !href.startsWith('#');
        });

        if (internalLinks.length === 0) {
          return this.createFinding('no-internal-links', 'No Internal Links', 'moderate',
            'Page has no internal links to other pages',
            'Add relevant internal links to help users and search engines navigate your site');
        }
        return null;
      },
    },
    {
      id: 'broken-anchor-links',
      name: 'Broken Anchor Links',
      description: 'Page has anchor links to non-existent IDs',
      severity: 'minor',
      check: (ctx) => {
        const findings: SeoFinding[] = [];
        const ids = new Set<string>();

        // Collect all IDs
        ctx.$('[id]').each((_, el) => {
          const id = ctx.$(el).attr('id');
          if (id) ids.add(id);
        });

        // Check anchor links
        ctx.$('a[href^="#"]').each((_, el) => {
          const href = ctx.$(el).attr('href') || '';
          const targetId = href.substring(1);

          if (targetId && !ids.has(targetId)) {
            findings.push(this.createFinding('broken-anchor-links', 'Broken Anchor Link', 'minor',
              `Anchor link #${targetId} points to non-existent element`,
              'Fix the anchor link or add an element with the matching ID',
              `a[href="${href}"]`));
          }
        });
        return findings.length > 0 ? findings : null;
      },
    },

    // Canonical rules
    {
      id: 'missing-canonical',
      name: 'Missing Canonical URL',
      description: 'Page is missing a canonical URL',
      severity: 'moderate',
      check: (ctx) => {
        if (!ctx.canonicalUrl) {
          return this.createFinding('missing-canonical', 'Missing Canonical URL', 'moderate',
            'Page is missing a canonical URL tag',
            'Add a canonical tag to prevent duplicate content issues',
            'head');
        }
        return null;
      },
    },
    {
      id: 'self-referencing-canonical',
      name: 'Missing Self-Referencing Canonical',
      description: 'Canonical URL does not match page URL',
      severity: 'info',
      check: (ctx) => {
        if (ctx.canonicalUrl && ctx.canonicalUrl !== ctx.url) {
          // Normalize for comparison
          const normalizedCanonical = ctx.canonicalUrl.replace(/\/$/, '');
          const normalizedUrl = ctx.url.replace(/\/$/, '');

          if (normalizedCanonical !== normalizedUrl) {
            return this.createFinding('self-referencing-canonical', 'Non-Self-Referencing Canonical', 'info',
              `Canonical URL (${ctx.canonicalUrl}) differs from page URL`,
              'Ensure canonical URL is correct; this may be intentional for duplicate pages');
          }
        }
        return null;
      },
    },

    // Open Graph rules
    {
      id: 'missing-og-title',
      name: 'Missing Open Graph Title',
      description: 'Page is missing og:title meta tag',
      severity: 'minor',
      check: (ctx) => {
        const ogTitle = ctx.$('meta[property="og:title"]').attr('content');
        if (!ogTitle) {
          return this.createFinding('missing-og-title', 'Missing Open Graph Title', 'minor',
            'Page is missing og:title meta tag',
            'Add Open Graph tags for better social media sharing');
        }
        return null;
      },
    },
    {
      id: 'missing-og-description',
      name: 'Missing Open Graph Description',
      description: 'Page is missing og:description meta tag',
      severity: 'minor',
      check: (ctx) => {
        const ogDesc = ctx.$('meta[property="og:description"]').attr('content');
        if (!ogDesc) {
          return this.createFinding('missing-og-description', 'Missing Open Graph Description', 'minor',
            'Page is missing og:description meta tag',
            'Add og:description for better social media sharing');
        }
        return null;
      },
    },
    {
      id: 'missing-og-image',
      name: 'Missing Open Graph Image',
      description: 'Page is missing og:image meta tag',
      severity: 'minor',
      check: (ctx) => {
        const ogImage = ctx.$('meta[property="og:image"]').attr('content');
        if (!ogImage) {
          return this.createFinding('missing-og-image', 'Missing Open Graph Image', 'minor',
            'Page is missing og:image meta tag',
            'Add og:image for better social media sharing (recommended: 1200x630px)');
        }
        return null;
      },
    },

    // Content rules
    {
      id: 'thin-content',
      name: 'Thin Content',
      description: 'Page has very little content',
      severity: 'moderate',
      check: (ctx) => {
        if (ctx.wordCount < THIN_CONTENT_THRESHOLD) {
          return this.createFinding('thin-content', 'Thin Content', 'moderate',
            `Page has only ${ctx.wordCount} words (recommended: 300+)`,
            'Add more valuable, relevant content to the page');
        }
        return null;
      },
    },
    {
      id: 'no-language',
      name: 'Missing Language Attribute',
      description: 'HTML element is missing lang attribute',
      severity: 'moderate',
      check: (ctx) => {
        const lang = ctx.$('html').attr('lang');
        if (!lang) {
          return this.createFinding('no-language', 'Missing Language Attribute', 'moderate',
            'HTML element is missing lang attribute',
            'Add lang attribute to help search engines understand the content language',
            'html');
        }
        return null;
      },
    },

    // Performance-related SEO
    {
      id: 'slow-page',
      name: 'Slow Page Load',
      description: 'Page takes too long to load',
      severity: 'moderate',
      check: (ctx) => {
        if (ctx.responseTimeMs > SLOW_PAGE_THRESHOLD) {
          return this.createFinding('slow-page', 'Slow Page Load', 'moderate',
            `Page took ${ctx.responseTimeMs}ms to load (recommended: <3000ms)`,
            'Optimize server response time, reduce page size, and enable caching');
        }
        return null;
      },
    },

    // Mobile rules
    {
      id: 'missing-viewport',
      name: 'Missing Viewport Meta Tag',
      description: 'Page is missing viewport meta tag',
      severity: 'serious',
      check: (ctx) => {
        const viewport = ctx.$('meta[name="viewport"]').attr('content');
        if (!viewport) {
          return this.createFinding('missing-viewport', 'Missing Viewport Meta Tag', 'serious',
            'Page is missing viewport meta tag',
            'Add <meta name="viewport" content="width=device-width, initial-scale=1">',
            'head');
        }
        return null;
      },
    },

    // Structured data check
    {
      id: 'no-structured-data',
      name: 'No Structured Data',
      description: 'Page has no structured data (JSON-LD)',
      severity: 'info',
      check: (ctx) => {
        const jsonLd = ctx.$('script[type="application/ld+json"]');
        if (jsonLd.length === 0) {
          return this.createFinding('no-structured-data', 'No Structured Data', 'info',
            'Page has no structured data (JSON-LD)',
            'Consider adding structured data to enhance search results with rich snippets');
        }
        return null;
      },
    },

    // Twitter Card rules
    {
      id: 'missing-twitter-card',
      name: 'Missing Twitter Card Tags',
      description: 'Page is missing Twitter Card meta tags',
      severity: 'minor',
      check: (ctx) => {
        const twitterCard = ctx.$('meta[name="twitter:card"]').attr('content');
        const twitterTitle = ctx.$('meta[name="twitter:title"]').attr('content');
        if (!twitterCard && !twitterTitle) {
          return this.createFinding('missing-twitter-card', 'Missing Twitter Card Tags', 'minor',
            'Page is missing Twitter Card meta tags',
            'Add twitter:card, twitter:title, and twitter:description for better Twitter sharing');
        }
        return null;
      },
    },

    // URL structure
    {
      id: 'url-too-long',
      name: 'URL Too Long',
      description: 'URL exceeds recommended length',
      severity: 'minor',
      check: (ctx) => {
        if (ctx.url.length > 200) {
          return this.createFinding('url-too-long', 'URL Too Long', 'minor',
            `URL is ${ctx.url.length} characters (recommended: <200)`,
            'Use shorter, more descriptive URLs for better SEO and usability');
        }
        return null;
      },
    },
    {
      id: 'url-has-underscores',
      name: 'URL Contains Underscores',
      description: 'URLs should use hyphens instead of underscores',
      severity: 'minor',
      check: (ctx) => {
        const pathname = new URL(ctx.url).pathname;
        if (pathname.includes('_') && !pathname.includes('__')) {
          return this.createFinding('url-has-underscores', 'URL Contains Underscores', 'minor',
            'URL uses underscores instead of hyphens',
            'Use hyphens (-) instead of underscores (_) in URLs. Google treats hyphens as word separators.');
        }
        return null;
      },
    },
    {
      id: 'url-excessive-params',
      name: 'URL Has Many Parameters',
      description: 'URL has excessive query parameters',
      severity: 'minor',
      check: (ctx) => {
        const params = new URL(ctx.url).searchParams;
        let count = 0;
        params.forEach(() => count++);
        if (count > 3) {
          return this.createFinding('url-excessive-params', 'URL Has Many Parameters', 'minor',
            `URL has ${count} query parameters (recommended: <4)`,
            'Reduce query parameters or use cleaner URL structures for better SEO');
        }
        return null;
      },
    },

    // Redirect chain (SEO impact)
    {
      id: 'redirect-chain',
      name: 'Redirect Chain Detected',
      description: 'Page has a redirect chain before reaching final URL',
      severity: 'moderate',
      check: (ctx) => {
        if (ctx.redirectChainLength > 1) {
          return this.createFinding('redirect-chain', 'Redirect Chain Detected', 'moderate',
            `Page has ${ctx.redirectChainLength} redirects before reaching final URL`,
            'Reduce redirect chains to a single redirect. Each hop loses link equity and slows load time.');
        } else if (ctx.redirectChainLength === 1) {
          return this.createFinding('redirect-chain', 'Redirect Detected', 'info',
            'Page has 1 redirect before reaching final URL',
            'Consider linking directly to the final URL to avoid unnecessary redirects.');
        }
        return null;
      },
    },

    // Deep page depth
    {
      id: 'deep-page-depth',
      name: 'Deep Page Depth',
      description: 'Page is too many clicks from the homepage',
      severity: 'moderate',
      check: (ctx) => {
        if (ctx.depth > 4) {
          return this.createFinding('deep-page-depth', 'Very Deep Page', 'moderate',
            `Page is ${ctx.depth} clicks from homepage (recommended: <4)`,
            'Improve site structure so important pages are within 3 clicks of the homepage');
        } else if (ctx.depth > 3) {
          return this.createFinding('deep-page-depth', 'Deep Page', 'minor',
            `Page is ${ctx.depth} clicks from homepage (recommended: <4)`,
            'Consider linking to this page from a higher-level page');
        }
        return null;
      },
    },

    // Structured data validation
    {
      id: 'invalid-structured-data',
      name: 'Invalid Structured Data',
      description: 'JSON-LD structured data has issues',
      severity: 'moderate',
      check: (ctx) => {
        const findings: SeoFinding[] = [];
        ctx.$('script[type="application/ld+json"]').each((_, el) => {
          const content = ctx.$(el).text().trim();
          try {
            const data = JSON.parse(content);
            if (!data['@type']) {
              findings.push(this.createFinding('invalid-structured-data', 'Structured Data Missing @type', 'moderate',
                'JSON-LD structured data is missing @type property',
                'Add @type to your structured data (e.g., Organization, Article, Product)'));
            }
            if (!data['@context']) {
              findings.push(this.createFinding('invalid-structured-data', 'Structured Data Missing @context', 'moderate',
                'JSON-LD structured data is missing @context property',
                'Add @context: "https://schema.org" to your structured data'));
            }
          } catch {
            findings.push(this.createFinding('invalid-structured-data', 'Invalid JSON-LD', 'serious',
              'JSON-LD structured data contains invalid JSON',
              'Fix the JSON syntax in your structured data'));
          }
        });
        return findings.length > 0 ? findings : null;
      },
    },

    // Hreflang tags (#16)
    {
      id: 'missing-hreflang',
      name: 'Missing Hreflang Tags',
      description: 'Page has multiple languages but no hreflang tags',
      severity: 'minor',
      check: (ctx) => {
        const hreflangLinks = ctx.$('link[rel="alternate"][hreflang]');
        const htmlLang = ctx.$('html').attr('lang');

        // Only flag if the page has a lang attribute (suggesting it's a multilingual site)
        // or if there are links to alternate language versions without hreflang
        if (hreflangLinks.length === 0) {
          // Check for common multilingual indicators
          const hasLangSwitcher = ctx.$('a[href*="/en/"], a[href*="/fr/"], a[href*="/de/"], a[href*="/es/"], a[href*="/it/"], a[href*="/nl/"], a[href*="/pt/"], a[href*="/ja/"], a[href*="/zh/"]').length > 0;
          const hasAlternateLinks = ctx.$('link[rel="alternate"]').filter((_, el) => {
            const href = ctx.$(el).attr('href') || '';
            return href !== ctx.url && !href.includes('feed') && !href.includes('rss');
          }).length > 0;

          if (hasLangSwitcher || hasAlternateLinks) {
            return this.createFinding('missing-hreflang', 'Missing Hreflang Tags', 'minor',
              'Page appears to have multiple language versions but no hreflang tags',
              'Add <link rel="alternate" hreflang="xx"> tags to help search engines serve the correct language version');
          }
        } else {
          // Validate hreflang tags
          const findings: SeoFinding[] = [];
          let hasSelfRef = false;

          hreflangLinks.each((_, el) => {
            const hreflang = ctx.$(el).attr('hreflang') || '';
            const href = ctx.$(el).attr('href') || '';

            if (!href) {
              findings.push(this.createFinding('invalid-hreflang', 'Invalid Hreflang Tag', 'moderate',
                `Hreflang tag for "${hreflang}" is missing href attribute`,
                'Add a valid href to the hreflang link'));
            }

            if (href === ctx.url || href === ctx.url.replace(/\/$/, '')) {
              hasSelfRef = true;
            }
          });

          if (!hasSelfRef && hreflangLinks.length > 0) {
            findings.push(this.createFinding('hreflang-missing-self', 'Hreflang Missing Self-Reference', 'minor',
              'Hreflang tags are present but none reference this page itself',
              'Add a self-referencing hreflang tag for the current page language'));
          }

          return findings.length > 0 ? findings : null;
        }

        return null;
      },
    },

    // Robots directives
    {
      id: 'noindex-page',
      name: 'Page Marked as Noindex',
      description: 'Page has noindex directive',
      severity: 'info',
      check: (ctx) => {
        const robotsMeta = ctx.$('meta[name="robots"]').attr('content') || '';
        const googleMeta = ctx.$('meta[name="googlebot"]').attr('content') || '';

        if (robotsMeta.toLowerCase().includes('noindex') || googleMeta.toLowerCase().includes('noindex')) {
          return this.createFinding('noindex-page', 'Page Marked as Noindex', 'info',
            'Page has noindex directive and will not appear in search results',
            'Remove noindex if you want this page indexed',
            'meta[name="robots"]');
        }
        return null;
      },
    },
  ];

  /**
   * Analyze a page for SEO issues
   */
  async analyze(crawlResult: CrawlResult, depth: number = 0): Promise<SeoFinding[]> {
    const $ = cheerio.load(crawlResult.html);

    const ctx: SeoContext = {
      url: crawlResult.url,
      $,
      html: crawlResult.html,
      title: crawlResult.title,
      metaDescription: crawlResult.metaDescription,
      canonicalUrl: crawlResult.canonicalUrl,
      h1Text: crawlResult.h1Text,
      wordCount: crawlResult.wordCount,
      statusCode: crawlResult.statusCode,
      responseTimeMs: crawlResult.responseTimeMs,
      redirectChainLength: crawlResult.redirectChain?.length || 0,
      depth,
    };

    const findings: SeoFinding[] = [];

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
        // Log but don't fail the entire analysis
        console.warn(`SEO rule ${rule.id} failed:`, error);
      }
    }

    return findings;
  }

  /**
   * Create a standardized finding
   */
  private createFinding(
    ruleId: string,
    ruleName: string,
    severity: Severity,
    message: string,
    recommendation: string,
    selector?: string,
    snippet?: string
  ): SeoFinding {
    const rule = this.rules.find(r => r.id === ruleId);

    return {
      ruleId,
      ruleName,
      category: 'seo',
      severity,
      message,
      description: rule?.description,
      recommendation,
      selector,
      snippet,
      helpUrl: rule?.helpUrl,
    };
  }
}

/**
 * Create an SEO engine instance
 */
export function createSeoEngine(): SeoEngine {
  return new SeoEngine();
}
