import * as cheerio from 'cheerio';
import type { Page } from 'playwright';
import type { PerformanceFinding, Severity } from '../../types/finding.types';
import type { CrawlResult, ResourceInfo } from '../../types/spider.types';

// Performance rule definition
interface PerformanceRule {
  id: string;
  name: string;
  description: string;
  severity: Severity;
  helpUrl?: string;
  check: (ctx: PerformanceContext) => PerformanceFinding | PerformanceFinding[] | null;
}

// Context passed to rule checks
interface PerformanceContext {
  url: string;
  $: ReturnType<typeof cheerio.load>;
  html: string;
  headers: Record<string, string>;
  responseTimeMs: number;
  pageSizeBytes: number;
  resources: ResourceInfo[];
  deviceType?: 'desktop' | 'mobile';
}

// Thresholds (based on Web Vitals recommendations)
const THRESHOLDS = {
  // Page load
  RESPONSE_TIME_GOOD: 1500,      // ms
  RESPONSE_TIME_POOR: 3000,      // ms

  // Page size
  PAGE_SIZE_GOOD: 500 * 1024,    // 500KB
  PAGE_SIZE_POOR: 2 * 1024 * 1024, // 2MB

  // HTML size
  HTML_SIZE_GOOD: 100 * 1024,    // 100KB
  HTML_SIZE_POOR: 500 * 1024,    // 500KB

  // Images
  IMAGE_SIZE_GOOD: 100 * 1024,   // 100KB
  IMAGE_SIZE_POOR: 500 * 1024,   // 500KB
  TOTAL_IMAGES_SIZE: 2 * 1024 * 1024, // 2MB

  // Scripts
  SCRIPT_SIZE_GOOD: 100 * 1024,  // 100KB
  TOTAL_SCRIPTS_SIZE: 1 * 1024 * 1024, // 1MB

  // Styles
  STYLE_SIZE_GOOD: 50 * 1024,    // 50KB
  TOTAL_STYLES_SIZE: 500 * 1024, // 500KB

  // Resource counts
  MAX_REQUESTS: 100,
  MAX_SCRIPTS: 20,
  MAX_STYLESHEETS: 10,
  MAX_FONTS: 5,

  // DOM
  MAX_DOM_ELEMENTS: 1500,
  DOM_ELEMENTS_POOR: 3000,
};

export class PerformanceEngine {
  private rules: PerformanceRule[] = [
    // Response time
    {
      id: 'slow-response',
      name: 'Slow Server Response',
      description: 'Server took too long to respond',
      severity: 'serious',
      check: (ctx) => {
        if (ctx.responseTimeMs > THRESHOLDS.RESPONSE_TIME_POOR) {
          return this.createFinding('slow-response', 'Slow Server Response', 'serious',
            `Server response time: ${ctx.responseTimeMs}ms (target: <${THRESHOLDS.RESPONSE_TIME_GOOD}ms)`,
            'Optimize server response time, consider caching and CDN',
            ctx.responseTimeMs, THRESHOLDS.RESPONSE_TIME_GOOD);
        } else if (ctx.responseTimeMs > THRESHOLDS.RESPONSE_TIME_GOOD) {
          return this.createFinding('slow-response', 'Moderate Server Response', 'moderate',
            `Server response time: ${ctx.responseTimeMs}ms (target: <${THRESHOLDS.RESPONSE_TIME_GOOD}ms)`,
            'Consider optimizing server response time',
            ctx.responseTimeMs, THRESHOLDS.RESPONSE_TIME_GOOD);
        }
        return null;
      },
    },

    // Page size
    {
      id: 'large-page',
      name: 'Large Page Size',
      description: 'Total page size is too large',
      severity: 'moderate',
      check: (ctx) => {
        const totalSize = this.calculateTotalSize(ctx);

        if (totalSize > THRESHOLDS.PAGE_SIZE_POOR) {
          return this.createFinding('large-page', 'Very Large Page Size', 'serious',
            `Total page size: ${this.formatBytes(totalSize)} (target: <${this.formatBytes(THRESHOLDS.PAGE_SIZE_GOOD)})`,
            'Reduce page weight by optimizing images, minifying code, and removing unused assets',
            totalSize, THRESHOLDS.PAGE_SIZE_GOOD);
        } else if (totalSize > THRESHOLDS.PAGE_SIZE_GOOD) {
          return this.createFinding('large-page', 'Large Page Size', 'moderate',
            `Total page size: ${this.formatBytes(totalSize)} (target: <${this.formatBytes(THRESHOLDS.PAGE_SIZE_GOOD)})`,
            'Consider reducing page weight',
            totalSize, THRESHOLDS.PAGE_SIZE_GOOD);
        }
        return null;
      },
    },

    // HTML size
    {
      id: 'large-html',
      name: 'Large HTML Document',
      description: 'HTML document is too large',
      severity: 'moderate',
      check: (ctx) => {
        if (ctx.pageSizeBytes > THRESHOLDS.HTML_SIZE_POOR) {
          return this.createFinding('large-html', 'Very Large HTML', 'serious',
            `HTML size: ${this.formatBytes(ctx.pageSizeBytes)} (target: <${this.formatBytes(THRESHOLDS.HTML_SIZE_GOOD)})`,
            'Reduce HTML size by removing inline styles/scripts and unnecessary markup',
            ctx.pageSizeBytes, THRESHOLDS.HTML_SIZE_GOOD);
        } else if (ctx.pageSizeBytes > THRESHOLDS.HTML_SIZE_GOOD) {
          return this.createFinding('large-html', 'Large HTML', 'moderate',
            `HTML size: ${this.formatBytes(ctx.pageSizeBytes)} (target: <${this.formatBytes(THRESHOLDS.HTML_SIZE_GOOD)})`,
            'Consider reducing HTML document size',
            ctx.pageSizeBytes, THRESHOLDS.HTML_SIZE_GOOD);
        }
        return null;
      },
    },

    // Too many requests
    {
      id: 'too-many-requests',
      name: 'Too Many HTTP Requests',
      description: 'Page makes too many HTTP requests',
      severity: 'moderate',
      check: (ctx) => {
        const requestCount = ctx.resources.length;
        if (requestCount > THRESHOLDS.MAX_REQUESTS) {
          return this.createFinding('too-many-requests', 'Too Many HTTP Requests', 'serious',
            `Page makes ${requestCount} requests (target: <${THRESHOLDS.MAX_REQUESTS})`,
            'Reduce HTTP requests by combining files, using sprites, and lazy loading',
            requestCount, THRESHOLDS.MAX_REQUESTS);
        } else if (requestCount > THRESHOLDS.MAX_REQUESTS * 0.7) {
          return this.createFinding('too-many-requests', 'Many HTTP Requests', 'moderate',
            `Page makes ${requestCount} requests (target: <${THRESHOLDS.MAX_REQUESTS})`,
            'Consider reducing the number of HTTP requests',
            requestCount, THRESHOLDS.MAX_REQUESTS);
        }
        return null;
      },
    },

    // Too many scripts
    {
      id: 'too-many-scripts',
      name: 'Too Many JavaScript Files',
      description: 'Page loads too many script files',
      severity: 'moderate',
      check: (ctx) => {
        const scripts = ctx.resources.filter(r => r.type === 'script');
        if (scripts.length > THRESHOLDS.MAX_SCRIPTS) {
          return this.createFinding('too-many-scripts', 'Too Many Scripts', 'moderate',
            `Page loads ${scripts.length} scripts (target: <${THRESHOLDS.MAX_SCRIPTS})`,
            'Bundle JavaScript files to reduce HTTP requests',
            scripts.length, THRESHOLDS.MAX_SCRIPTS);
        }
        return null;
      },
    },

    // Large JavaScript
    {
      id: 'large-javascript',
      name: 'Large JavaScript Payload',
      description: 'Total JavaScript size is too large',
      severity: 'moderate',
      check: (ctx) => {
        const scripts = ctx.resources.filter(r => r.type === 'script');
        const totalSize = scripts.reduce((sum, s) => sum + s.size, 0);

        if (totalSize > THRESHOLDS.TOTAL_SCRIPTS_SIZE) {
          return this.createFinding('large-javascript', 'Large JavaScript Payload', 'serious',
            `Total JS size: ${this.formatBytes(totalSize)} (target: <${this.formatBytes(THRESHOLDS.TOTAL_SCRIPTS_SIZE)})`,
            'Minify JavaScript, implement code splitting, and remove unused code',
            totalSize, THRESHOLDS.TOTAL_SCRIPTS_SIZE);
        }
        return null;
      },
    },

    // Too many stylesheets
    {
      id: 'too-many-stylesheets',
      name: 'Too Many Stylesheets',
      description: 'Page loads too many CSS files',
      severity: 'minor',
      check: (ctx) => {
        const styles = ctx.resources.filter(r => r.type === 'stylesheet');
        if (styles.length > THRESHOLDS.MAX_STYLESHEETS) {
          return this.createFinding('too-many-stylesheets', 'Too Many Stylesheets', 'minor',
            `Page loads ${styles.length} stylesheets (target: <${THRESHOLDS.MAX_STYLESHEETS})`,
            'Combine CSS files to reduce HTTP requests',
            styles.length, THRESHOLDS.MAX_STYLESHEETS);
        }
        return null;
      },
    },

    // Large CSS
    {
      id: 'large-css',
      name: 'Large CSS Payload',
      description: 'Total CSS size is too large',
      severity: 'moderate',
      check: (ctx) => {
        const styles = ctx.resources.filter(r => r.type === 'stylesheet');
        const totalSize = styles.reduce((sum, s) => sum + s.size, 0);

        if (totalSize > THRESHOLDS.TOTAL_STYLES_SIZE) {
          return this.createFinding('large-css', 'Large CSS Payload', 'moderate',
            `Total CSS size: ${this.formatBytes(totalSize)} (target: <${this.formatBytes(THRESHOLDS.TOTAL_STYLES_SIZE)})`,
            'Minify CSS, remove unused styles, and consider critical CSS extraction',
            totalSize, THRESHOLDS.TOTAL_STYLES_SIZE);
        }
        return null;
      },
    },

    // Too many fonts
    {
      id: 'too-many-fonts',
      name: 'Too Many Web Fonts',
      description: 'Page loads too many web fonts',
      severity: 'minor',
      check: (ctx) => {
        const fonts = ctx.resources.filter(r => r.type === 'font');
        if (fonts.length > THRESHOLDS.MAX_FONTS) {
          return this.createFinding('too-many-fonts', 'Too Many Web Fonts', 'minor',
            `Page loads ${fonts.length} fonts (target: <${THRESHOLDS.MAX_FONTS})`,
            'Reduce font variants and consider system fonts',
            fonts.length, THRESHOLDS.MAX_FONTS);
        }
        return null;
      },
    },

    // Images without dimensions
    {
      id: 'images-without-dimensions',
      name: 'Images Without Dimensions',
      description: 'Images missing width/height attributes cause layout shifts',
      severity: 'moderate',
      check: (ctx) => {
        const findings: PerformanceFinding[] = [];

        ctx.$('img').each((_: number, el: any) => {
          const width = ctx.$(el).attr('width');
          const height = ctx.$(el).attr('height');
          const src = ctx.$(el).attr('src') || '';

          // Skip inline SVGs and data URIs
          if (src.startsWith('data:') || !src) return;

          if (!width || !height) {
            findings.push(this.createFinding('images-without-dimensions', 'Image Without Dimensions', 'moderate',
              'Image missing width/height attributes (causes layout shift)',
              'Add explicit width and height attributes to prevent CLS',
              undefined, undefined,
              `img[src="${src.substring(0, 60)}"]`));
          }
        });

        // Limit to avoid spam
        return findings.length > 0 ? findings.slice(0, 5) : null;
      },
    },

    // Render-blocking resources
    {
      id: 'render-blocking-scripts',
      name: 'Render-Blocking Scripts',
      description: 'Scripts in head without async/defer block rendering',
      severity: 'moderate',
      check: (ctx) => {
        const findings: PerformanceFinding[] = [];

        ctx.$('head script[src]').each((_: number, el: any) => {
          const async = ctx.$(el).attr('async');
          const defer = ctx.$(el).attr('defer');
          const src = ctx.$(el).attr('src') || '';

          // Skip inline scripts and module scripts
          if (!src || src.startsWith('data:')) return;

          if (async === undefined && defer === undefined) {
            findings.push(this.createFinding('render-blocking-scripts', 'Render-Blocking Script', 'moderate',
              `Script blocks rendering: ${src.substring(0, 60)}`,
              'Add async or defer attribute to non-critical scripts',
              undefined, undefined,
              `script[src="${src.substring(0, 50)}"]`));
          }
        });

        // Limit to avoid spam
        return findings.length > 0 ? findings.slice(0, 5) : null;
      },
    },

    // Missing lazy loading
    {
      id: 'no-lazy-loading',
      name: 'Images Not Lazy Loaded',
      description: 'Below-fold images should use lazy loading',
      severity: 'minor',
      check: (ctx) => {
        const images = ctx.$('img[src]');
        const totalImages = images.length;
        let lazyLoadedCount = 0;

        images.each((_: number, el: any) => {
          if (ctx.$(el).attr('loading') === 'lazy') {
            lazyLoadedCount++;
          }
        });

        // If more than 5 images and less than half are lazy loaded
        if (totalImages > 5 && lazyLoadedCount < totalImages / 2) {
          return this.createFinding('no-lazy-loading', 'Missing Lazy Loading', 'minor',
            `Only ${lazyLoadedCount}/${totalImages} images use lazy loading`,
            'Add loading="lazy" to below-fold images',
            totalImages - lazyLoadedCount, undefined);
        }
        return null;
      },
    },

    // Missing text compression hint (checked via content-encoding)
    {
      id: 'uncompressed-resources',
      name: 'Uncompressed Resources',
      description: 'Large text resources should be compressed',
      severity: 'moderate',
      check: (ctx) => {
        // Check inline scripts and styles
        let inlineScriptSize = 0;
        let inlineStyleSize = 0;

        ctx.$('script:not([src])').each((_: number, el: any) => {
          inlineScriptSize += ctx.$(el).text().length;
        });

        ctx.$('style').each((_: number, el: any) => {
          inlineStyleSize += ctx.$(el).text().length;
        });

        const findings: PerformanceFinding[] = [];

        if (inlineScriptSize > 50 * 1024) {
          findings.push(this.createFinding('large-inline-scripts', 'Large Inline Scripts', 'moderate',
            `Inline scripts total: ${this.formatBytes(inlineScriptSize)}`,
            'Move large scripts to external files for better caching and compression',
            inlineScriptSize, 50 * 1024));
        }

        if (inlineStyleSize > 20 * 1024) {
          findings.push(this.createFinding('large-inline-styles', 'Large Inline Styles', 'moderate',
            `Inline styles total: ${this.formatBytes(inlineStyleSize)}`,
            'Move large styles to external files for better caching',
            inlineStyleSize, 20 * 1024));
        }

        return findings.length > 0 ? findings : null;
      },
    },

    // Document write usage
    {
      id: 'document-write',
      name: 'Uses document.write()',
      description: 'document.write() can delay page load',
      severity: 'moderate',
      check: (ctx) => {
        if (ctx.html.includes('document.write(') || ctx.html.includes('document.write (')) {
          return this.createFinding('document-write', 'Uses document.write()', 'moderate',
            'Page uses document.write() which can block parsing',
            'Replace document.write() with DOM manipulation methods');
        }
        return null;
      },
    },

    // Missing compression (#30)
    {
      id: 'missing-compression',
      name: 'Missing Response Compression',
      description: 'Response is not compressed with gzip or brotli',
      severity: 'moderate',
      check: (ctx) => {
        const encoding = ctx.headers['content-encoding'] || '';
        if (!encoding && ctx.pageSizeBytes > 1024) {
          return this.createFinding('missing-compression', 'Missing Response Compression', 'moderate',
            `HTML response (${this.formatBytes(ctx.pageSizeBytes)}) is not compressed`,
            'Enable gzip or brotli compression on your server to reduce transfer sizes by 60-80%',
            ctx.pageSizeBytes);
        }
        return null;
      },
    },

    // Image optimisation (#31)
    {
      id: 'unoptimized-images',
      name: 'Unoptimized Images',
      description: 'Large images that could be optimized',
      severity: 'moderate',
      check: (ctx) => {
        const findings: PerformanceFinding[] = [];
        const largeImages = ctx.resources.filter(
          r => r.type === 'image' && r.size > THRESHOLDS.IMAGE_SIZE_POOR
        );

        for (const img of largeImages.slice(0, 5)) {
          findings.push(this.createFinding('unoptimized-images', 'Large Image', 'moderate',
            `Image ${this.formatBytes(img.size)}: ${img.url.substring(0, 80)}`,
            'Compress images using WebP/AVIF format and resize to appropriate dimensions',
            img.size, THRESHOLDS.IMAGE_SIZE_GOOD));
        }

        const totalImageSize = ctx.resources
          .filter(r => r.type === 'image')
          .reduce((sum, r) => sum + r.size, 0);

        if (totalImageSize > THRESHOLDS.TOTAL_IMAGES_SIZE) {
          findings.push(this.createFinding('total-images-too-large', 'Total Image Payload Too Large', 'serious',
            `Total image payload: ${this.formatBytes(totalImageSize)} (target: <${this.formatBytes(THRESHOLDS.TOTAL_IMAGES_SIZE)})`,
            'Optimize images using modern formats (WebP/AVIF), lazy loading, and appropriate sizing',
            totalImageSize, THRESHOLDS.TOTAL_IMAGES_SIZE));
        }

        return findings.length > 0 ? findings : null;
      },
    },

    // Missing responsive images (#32)
    {
      id: 'missing-srcset',
      name: 'Missing Responsive Images',
      description: 'Images lack srcset for responsive delivery',
      severity: 'minor',
      check: (ctx) => {
        let imagesWithoutSrcset = 0;
        let totalContentImages = 0;

        ctx.$('img[src]').each((_: number, el: any) => {
          const src = ctx.$(el).attr('src') || '';
          if (src.startsWith('data:') || src.includes('tracking') || src.includes('pixel')) return;

          totalContentImages++;
          const srcset = ctx.$(el).attr('srcset');
          if (!srcset) {
            imagesWithoutSrcset++;
          }
        });

        if (totalContentImages > 3 && imagesWithoutSrcset > totalContentImages / 2) {
          return this.createFinding('missing-srcset', 'Missing Responsive Images', 'minor',
            `${imagesWithoutSrcset}/${totalContentImages} images lack srcset attribute`,
            'Add srcset and sizes attributes to serve appropriately sized images for different devices',
            imagesWithoutSrcset);
        }
        return null;
      },
    },

    // Render-blocking CSS (#33)
    {
      id: 'render-blocking-css',
      name: 'Render-Blocking CSS',
      description: 'CSS files in head block first paint',
      severity: 'moderate',
      check: (ctx) => {
        const findings: PerformanceFinding[] = [];

        ctx.$('head link[rel="stylesheet"]').each((_: number, el: any) => {
          const href = ctx.$(el).attr('href') || '';
          const media = ctx.$(el).attr('media');

          // Non-render-blocking if media is print or specific condition
          if (media && media !== 'all' && media !== 'screen') return;

          if (href && !href.startsWith('data:')) {
            findings.push(this.createFinding('render-blocking-css', 'Render-Blocking CSS', 'moderate',
              `Stylesheet blocks rendering: ${href.substring(0, 60)}`,
              'Inline critical CSS, defer non-critical CSS, or use media queries to reduce blocking',
              undefined, undefined,
              `link[href="${href.substring(0, 50)}"]`));
          }
        });

        return findings.length > 0 ? findings.slice(0, 5) : null;
      },
    },

    // Large DOM size (#34)
    {
      id: 'large-dom',
      name: 'Large DOM Size',
      description: 'Page has too many DOM elements',
      severity: 'moderate',
      check: (ctx) => {
        const elementCount = ctx.$('*').length;

        if (elementCount > THRESHOLDS.DOM_ELEMENTS_POOR) {
          return this.createFinding('large-dom', 'Very Large DOM', 'serious',
            `Page has ${elementCount} DOM elements (target: <${THRESHOLDS.MAX_DOM_ELEMENTS})`,
            'Reduce DOM size by simplifying markup, using virtualization for long lists, and removing unnecessary wrappers',
            elementCount, THRESHOLDS.MAX_DOM_ELEMENTS);
        } else if (elementCount > THRESHOLDS.MAX_DOM_ELEMENTS) {
          return this.createFinding('large-dom', 'Large DOM', 'moderate',
            `Page has ${elementCount} DOM elements (target: <${THRESHOLDS.MAX_DOM_ELEMENTS})`,
            'Consider simplifying page structure to reduce DOM size',
            elementCount, THRESHOLDS.MAX_DOM_ELEMENTS);
        }
        return null;
      },
    },

    // Missing font-display: swap (#35)
    {
      id: 'missing-font-display',
      name: 'Missing font-display: swap',
      description: 'Web fonts may cause invisible text during loading',
      severity: 'minor',
      check: (ctx) => {
        // Check @font-face in inline styles
        const styleContent: string[] = [];
        ctx.$('style').each((_: number, el: any) => {
          styleContent.push(ctx.$(el).text());
        });

        const allStyles = styleContent.join('\n');
        const fontFaceBlocks = allStyles.match(/@font-face\s*\{[^}]+\}/g) || [];
        let missingSwap = 0;

        for (const block of fontFaceBlocks) {
          if (!block.includes('font-display')) {
            missingSwap++;
          }
        }

        // Also check for Google Fonts without display=swap
        const findings: PerformanceFinding[] = [];
        ctx.$('link[href*="fonts.googleapis.com"]').each((_: number, el: any) => {
          const href = ctx.$(el).attr('href') || '';
          if (!href.includes('display=swap')) {
            findings.push(this.createFinding('missing-font-display', 'Google Fonts Missing display=swap', 'minor',
              'Google Fonts loaded without display=swap parameter',
              'Add &display=swap to your Google Fonts URL to prevent invisible text',
              undefined, undefined,
              `link[href*="fonts.googleapis"]`));
          }
        });

        if (missingSwap > 0) {
          findings.push(this.createFinding('missing-font-display', 'Missing font-display: swap', 'minor',
            `${missingSwap} @font-face declaration(s) missing font-display: swap`,
            'Add font-display: swap to @font-face rules to show fallback text while fonts load',
            missingSwap));
        }

        return findings.length > 0 ? findings : null;
      },
    },

    // HTTP/2 detection (#36)
    {
      id: 'not-http2',
      name: 'Not Using HTTP/2',
      description: 'Server is not using HTTP/2 protocol',
      severity: 'minor',
      check: (ctx) => {
        // Check for HTTP/2 server push or alt-svc header hints
        const altSvc = ctx.headers['alt-svc'] || '';
        // If resources loaded but no multiplexing benefits visible, flag it
        // Note: We can't directly detect HTTP version from fetch, but alt-svc gives hints
        if (altSvc && (altSvc.includes('h2') || altSvc.includes('h3'))) {
          return null; // HTTP/2+ is available
        }
        // Only flag if many resources suggest HTTP/2 would help
        if (ctx.resources.length > 20) {
          return this.createFinding('not-http2', 'Consider HTTP/2', 'info',
            `Page loads ${ctx.resources.length} resources — HTTP/2 multiplexing would help`,
            'Enable HTTP/2 on your server for better performance with multiple resources');
        }
        return null;
      },
    },

    // Cache header analysis (#37)
    {
      id: 'missing-cache-headers',
      name: 'Missing Cache Headers',
      description: 'Response lacks proper cache control headers',
      severity: 'moderate',
      check: (ctx) => {
        const cacheControl = ctx.headers['cache-control'] || '';
        const expires = ctx.headers['expires'] || '';
        const etag = ctx.headers['etag'] || '';
        const lastModified = ctx.headers['last-modified'] || '';

        if (!cacheControl && !expires) {
          return this.createFinding('missing-cache-headers', 'Missing Cache Headers', 'moderate',
            'Response has no Cache-Control or Expires header',
            'Add Cache-Control headers to enable browser caching and reduce server load');
        }

        if (cacheControl.includes('no-store') || cacheControl.includes('no-cache')) {
          if (!cacheControl.includes('private')) {
            return this.createFinding('cache-disabled', 'Caching Disabled', 'info',
              `Cache-Control: ${cacheControl}`,
              'Consider enabling caching for static content to improve repeat visit performance');
          }
        }

        if (!etag && !lastModified && !cacheControl.includes('immutable')) {
          return this.createFinding('missing-validation-headers', 'Missing Cache Validation', 'minor',
            'Response lacks ETag and Last-Modified headers for cache validation',
            'Add ETag or Last-Modified headers to enable conditional requests (304 responses)');
        }

        return null;
      },
    },
  ];

  /**
   * Analyze a page for performance issues
   */
  async analyze(crawlResult: CrawlResult, page?: Page | null): Promise<PerformanceFinding[]> {
    const $ = cheerio.load(crawlResult.html);

    const ctx: PerformanceContext = {
      url: crawlResult.url,
      $,
      html: crawlResult.html,
      headers: crawlResult.headers,
      responseTimeMs: crawlResult.responseTimeMs,
      pageSizeBytes: crawlResult.pageSizeBytes,
      resources: crawlResult.resources,
      deviceType: crawlResult.deviceType,
    };

    const findings: PerformanceFinding[] = [];

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
        console.warn(`Performance rule ${rule.id} failed:`, error);
      }
    }

    // Core Web Vitals (#29) — requires a live Playwright page
    if (page) {
      try {
        const cwvFindings = await this.measureCoreWebVitals(page);
        findings.push(...cwvFindings);
      } catch (error) {
        console.warn('Core Web Vitals measurement failed:', error);
      }
    }

    return findings;
  }

  /**
   * Calculate total resource size
   */
  private calculateTotalSize(ctx: PerformanceContext): number {
    const resourcesSize = ctx.resources.reduce((sum, r) => sum + r.size, 0);
    return ctx.pageSizeBytes + resourcesSize;
  }

  /**
   * Format bytes to human readable
   */
  private formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  /**
   * Measure Core Web Vitals using Playwright CDP (#29)
   */
  private async measureCoreWebVitals(page: Page): Promise<PerformanceFinding[]> {
    const findings: PerformanceFinding[] = [];

    // Measure LCP and CLS via Performance API
    const metrics = await page.evaluate(() => {
      return new Promise<{ lcp: number | null; cls: number | null }>((resolve) => {
        let lcp: number | null = null;
        let cls: number | null = null;
        let clsValue = 0;

        // LCP observer
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          if (entries.length > 0) {
            lcp = entries[entries.length - 1].startTime;
          }
        });

        // CLS observer
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (!(entry as any).hadRecentInput) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              clsValue += (entry as any).value || 0;
            }
          }
          cls = clsValue;
        });

        try {
          lcpObserver.observe({ type: 'largest-contentful-paint' as any, buffered: true });
        } catch { /* not supported */ }

        try {
          clsObserver.observe({ type: 'layout-shift' as any, buffered: true });
        } catch { /* not supported */ }

        // Wait a moment for buffered entries, then resolve
        setTimeout(() => {
          lcpObserver.disconnect();
          clsObserver.disconnect();
          resolve({ lcp, cls });
        }, 500);
      });
    });

    // LCP thresholds: good < 2500ms, poor > 4000ms
    if (metrics.lcp !== null) {
      if (metrics.lcp > 4000) {
        findings.push(this.createFinding('lcp-poor', 'Poor LCP (Largest Contentful Paint)', 'serious',
          `LCP: ${Math.round(metrics.lcp)}ms (target: <2500ms)`,
          'Optimize the largest content element (hero image, heading). Consider preloading, optimizing images, or reducing server response time.',
          metrics.lcp, 2500));
      } else if (metrics.lcp > 2500) {
        findings.push(this.createFinding('lcp-needs-improvement', 'LCP Needs Improvement', 'moderate',
          `LCP: ${Math.round(metrics.lcp)}ms (target: <2500ms)`,
          'Optimize images, preload key resources, and reduce server response time to improve LCP.',
          metrics.lcp, 2500));
      }
    }

    // CLS thresholds: good < 0.1, poor > 0.25
    if (metrics.cls !== null) {
      if (metrics.cls > 0.25) {
        findings.push(this.createFinding('cls-poor', 'Poor CLS (Cumulative Layout Shift)', 'serious',
          `CLS: ${metrics.cls.toFixed(3)} (target: <0.1)`,
          'Set explicit width/height on images and videos, avoid inserting content above existing content, and use CSS contain.',
          metrics.cls, 0.1));
      } else if (metrics.cls > 0.1) {
        findings.push(this.createFinding('cls-needs-improvement', 'CLS Needs Improvement', 'moderate',
          `CLS: ${metrics.cls.toFixed(3)} (target: <0.1)`,
          'Add width/height to images, avoid dynamic content insertion, and reserve space for async content.',
          metrics.cls, 0.1));
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
    metricValue?: number,
    threshold?: number,
    selector?: string
  ): PerformanceFinding {
    const rule = this.rules.find(r => r.id === ruleId);

    return {
      ruleId,
      ruleName,
      category: 'performance',
      severity,
      message,
      description: rule?.description,
      recommendation,
      selector,
      metricValue,
      threshold,
      helpUrl: rule?.helpUrl,
    };
  }

  // ─── Mobile-specific rules ─────────────────────────────────────────────

  private mobileRules: PerformanceRule[] = [
    // Missing viewport meta tag
    {
      id: 'perf-mobile-viewport',
      name: 'Missing or Malformed Viewport Meta Tag',
      description: 'Pages without a proper viewport meta tag do not render correctly on mobile devices',
      severity: 'critical',
      helpUrl: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Viewport_meta_tag',
      check: (ctx) => {
        const viewportMeta = ctx.$('meta[name="viewport"]');
        if (viewportMeta.length === 0) {
          return this.createFinding('perf-mobile-viewport', 'Missing Viewport Meta Tag', 'critical',
            'No <meta name="viewport"> found. Mobile browsers will render the page at desktop width and scale down.',
            'Add <meta name="viewport" content="width=device-width, initial-scale=1"> to the <head>');
        }
        const content = viewportMeta.attr('content') || '';
        if (!content.includes('width=device-width')) {
          return this.createFinding('perf-mobile-viewport', 'Viewport Meta Missing device-width', 'serious',
            `Viewport meta content is "${content}" but does not include width=device-width.`,
            'Set viewport content to "width=device-width, initial-scale=1"');
        }
        return null;
      },
    },

    // Small font sizes on mobile
    {
      id: 'perf-mobile-font-size',
      name: 'Small Base Font Size for Mobile',
      description: 'Body font size below 16px causes iOS to zoom in on form inputs',
      severity: 'moderate',
      helpUrl: 'https://developer.chrome.com/docs/lighthouse/seo/font-size',
      check: (ctx) => {
        // Check inline styles on body for font-size < 16px
        const bodyStyle = ctx.$('body').attr('style') || '';
        const fontMatch = bodyStyle.match(/font-size:\s*(\d+)px/);
        if (fontMatch && parseInt(fontMatch[1]) < 16) {
          return this.createFinding('perf-mobile-font-size', 'Small Base Font Size', 'moderate',
            `Body font-size is ${fontMatch[1]}px. Font sizes below 16px cause iOS Safari to zoom in on form inputs, hurting usability.`,
            'Set body font-size to at least 16px for mobile, or use a responsive font-size with clamp()');
        }
        // Check for small font in <style> tags targeting body
        const styleContent = ctx.$('style').text();
        const cssMatch = styleContent.match(/body\s*\{[^}]*font-size:\s*(\d+)px/);
        if (cssMatch && parseInt(cssMatch[1]) < 16) {
          return this.createFinding('perf-mobile-font-size', 'Small Base Font Size', 'moderate',
            `Body CSS font-size is ${cssMatch[1]}px. Font sizes below 16px cause iOS Safari to zoom in on form inputs.`,
            'Set body font-size to at least 16px for mobile');
        }
        return null;
      },
    },

    // Horizontal scroll / content wider than viewport
    {
      id: 'perf-mobile-overflow',
      name: 'Content Wider Than Mobile Viewport',
      description: 'Elements with fixed widths can cause horizontal scrolling on mobile',
      severity: 'serious',
      helpUrl: 'https://web.dev/responsive-web-design-basics/',
      check: (ctx) => {
        const findings: PerformanceFinding[] = [];
        // Check for fixed-width tables
        ctx.$('table').each((_: number, el: any) => {
          const style = ctx.$(el).attr('style') || '';
          const width = ctx.$(el).attr('width');
          if ((width && parseInt(width) > 500) || style.includes('width:') && !style.includes('max-width')) {
            findings.push(this.createFinding('perf-mobile-overflow', 'Fixed-Width Table May Overflow', 'moderate',
              'A table has a fixed width that may exceed the mobile viewport, causing horizontal scrolling.',
              'Wrap tables in a scrollable container or use responsive table patterns'));
          }
        });
        // Check for elements with inline fixed widths > 400px
        ctx.$('[style*="width"]').each((_: number, el: any) => {
          const style = ctx.$(el).attr('style') || '';
          const match = style.match(/width:\s*(\d+)px/);
          if (match && parseInt(match[1]) > 500 && !style.includes('max-width')) {
            const tag = (el as { tagName?: string }).tagName || 'element';
            findings.push(this.createFinding('perf-mobile-overflow', 'Fixed-Width Element May Overflow', 'moderate',
              `A <${tag}> has inline width: ${match[1]}px which may exceed mobile viewport width.`,
              'Use max-width instead of fixed width, or use responsive CSS'));
          }
        });
        return findings.length > 0 ? findings : null;
      },
    },

    // Large images without srcset on mobile
    {
      id: 'perf-mobile-images',
      name: 'Large Images Without Mobile Optimization',
      description: 'Images over 200KB without srcset serve desktop-sized images to mobile devices',
      severity: 'moderate',
      helpUrl: 'https://web.dev/serve-responsive-images/',
      check: (ctx) => {
        const findings: PerformanceFinding[] = [];
        const imageResources = ctx.resources.filter(r => r.type === 'image' && r.size > 200 * 1024);

        for (const img of imageResources) {
          // Check if the corresponding <img> has srcset
          const imgEl = ctx.$(`img[src*="${new URL(img.url).pathname.split('/').pop()}"]`);
          if (imgEl.length > 0 && !imgEl.attr('srcset') && !imgEl.attr('sizes')) {
            findings.push(this.createFinding('perf-mobile-images', 'Large Image Without Mobile Variant', 'moderate',
              `Image ${img.url.split('/').pop()} is ${Math.round(img.size / 1024)}KB and lacks srcset — mobile devices download the full desktop image.`,
              'Add srcset and sizes attributes to serve smaller images on mobile',
              img.size, 200 * 1024));
          }
        }
        return findings.length > 0 ? findings : null;
      },
    },

    // 300ms tap delay
    {
      id: 'perf-mobile-tap-delay',
      name: 'Potential 300ms Tap Delay',
      description: 'Without touch-action or proper viewport, touch interactions have a 300ms delay',
      severity: 'minor',
      helpUrl: 'https://developer.chrome.com/blog/300ms-tap-delay-gone-away/',
      check: (ctx) => {
        const viewportMeta = ctx.$('meta[name="viewport"]');
        const content = viewportMeta.attr('content') || '';
        // 300ms delay is eliminated when viewport has width=device-width
        if (content.includes('width=device-width')) {
          return null; // No delay with proper viewport
        }
        // Check for touch-action: manipulation in global styles
        const styles = ctx.$('style').text();
        if (styles.includes('touch-action') && styles.includes('manipulation')) {
          return null;
        }
        return this.createFinding('perf-mobile-tap-delay', 'Potential 300ms Tap Delay', 'minor',
          'Without width=device-width in the viewport meta tag, mobile browsers add a 300ms delay to touch events.',
          'Add <meta name="viewport" content="width=device-width, initial-scale=1"> to eliminate the tap delay');
      },
    },
  ];

  /**
   * Run mobile-specific performance rules only.
   * Called during the mobile audit pass.
   */
  async analyzeMobile(crawlResult: CrawlResult, page?: Page | null): Promise<PerformanceFinding[]> {
    const $ = cheerio.load(crawlResult.html);

    const ctx: PerformanceContext = {
      url: crawlResult.url,
      $,
      html: crawlResult.html,
      headers: crawlResult.headers,
      responseTimeMs: crawlResult.responseTimeMs,
      pageSizeBytes: crawlResult.pageSizeBytes,
      resources: crawlResult.resources,
      deviceType: 'mobile',
    };

    const findings: PerformanceFinding[] = [];

    // Run standard rules too (they apply to mobile as well)
    for (const rule of this.rules) {
      try {
        const result = rule.check(ctx);
        if (result) {
          if (Array.isArray(result)) findings.push(...result);
          else findings.push(result);
        }
      } catch (error) {
        console.warn(`Performance rule ${rule.id} failed (mobile):`, error);
      }
    }

    // Run mobile-specific rules
    for (const rule of this.mobileRules) {
      try {
        const result = rule.check(ctx);
        if (result) {
          if (Array.isArray(result)) findings.push(...result);
          else findings.push(result);
        }
      } catch (error) {
        console.warn(`Mobile performance rule ${rule.id} failed:`, error);
      }
    }

    // Core Web Vitals on mobile viewport
    if (page) {
      try {
        const cwvFindings = await this.measureCoreWebVitals(page);
        findings.push(...cwvFindings);
      } catch (error) {
        console.warn('Mobile Core Web Vitals measurement failed:', error);
      }
    }

    return findings;
  }
}

/**
 * Create a performance engine instance
 */
export function createPerformanceEngine(): PerformanceEngine {
  return new PerformanceEngine();
}
