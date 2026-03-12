import * as cheerio from 'cheerio';
import { createHash } from 'crypto';
import type { ResourceInfo } from '../types/spider.types.js';
import {
  type AssetCategory,
  type DiscoveredAsset,
  EXTENSION_TO_CATEGORY,
  RESOURCE_TYPE_TO_CATEGORY,
  BINARY_LINK_EXTENSIONS,
} from '../types/asset.types.js';

/**
 * Hash a URL for deduplication
 */
function hashUrl(url: string): string {
  return createHash('sha256').update(url).digest('hex').slice(0, 16);
}

/**
 * Extract file extension from a URL path
 */
function getExtension(url: string): string | null {
  try {
    const pathname = new URL(url).pathname;
    const lastSegment = pathname.split('/').pop() || '';
    const dotIndex = lastSegment.lastIndexOf('.');
    if (dotIndex === -1 || dotIndex === lastSegment.length - 1) return null;
    return lastSegment.slice(dotIndex + 1).toLowerCase().split('?')[0];
  } catch {
    return null;
  }
}

/**
 * Extract file name from a URL path
 */
function getFileName(url: string): string | null {
  try {
    const pathname = new URL(url).pathname;
    const lastSegment = pathname.split('/').pop() || '';
    return lastSegment || null;
  } catch {
    return null;
  }
}

/**
 * Determine asset category from extension or mime type
 */
function categorize(ext: string | null, mimeType: string | null): AssetCategory {
  if (ext && EXTENSION_TO_CATEGORY[ext]) return EXTENSION_TO_CATEGORY[ext];
  if (mimeType) {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.startsWith('font/') || mimeType.includes('font')) return 'font';
    if (mimeType === 'text/css') return 'stylesheet';
    if (mimeType.includes('javascript')) return 'script';
    if (mimeType === 'application/pdf') return 'document';
  }
  return 'other';
}

/**
 * Resolve a potentially relative href to an absolute URL.
 * Returns null for data URIs, javascript:, mailto:, empty hrefs, anchors.
 */
function resolveUrl(href: string, baseUrl: string): string | null {
  if (!href) return null;
  const trimmed = href.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('data:')) return null;
  if (trimmed.startsWith('javascript:')) return null;
  if (trimmed.startsWith('mailto:')) return null;
  if (trimmed.startsWith('tel:')) return null;
  if (trimmed === '#' || trimmed.startsWith('#')) return null;

  try {
    return new URL(trimmed, baseUrl).href;
  } catch {
    return null;
  }
}

/**
 * Parse srcset attribute and return all URLs
 */
function parseSrcset(srcset: string, baseUrl: string): string[] {
  return srcset
    .split(',')
    .map(entry => entry.trim().split(/\s+/)[0])
    .map(src => resolveUrl(src, baseUrl))
    .filter((url): url is string => url !== null);
}

/**
 * Extract CSS background-image URLs from inline styles
 */
function extractBackgroundUrls(style: string, baseUrl: string): string[] {
  const urls: string[] = [];
  const regex = /url\(\s*(['"]?)(.*?)\1\s*\)/gi;
  let match;
  while ((match = regex.exec(style)) !== null) {
    const resolved = resolveUrl(match[2], baseUrl);
    if (resolved) urls.push(resolved);
  }
  return urls;
}

interface HtmlAsset {
  url: string;
  element: string;
  attribute: string;
  category: AssetCategory | null; // null means "determine from extension"
}

/**
 * Extract all asset references from HTML
 */
function extractFromHtml(html: string, baseUrl: string): HtmlAsset[] {
  const $ = cheerio.load(html);
  const assets: HtmlAsset[] = [];

  const addAsset = (url: string | null, element: string, attribute: string, category: AssetCategory | null) => {
    if (url) assets.push({ url, element, attribute, category });
  };

  // img[src], img[data-src], img[data-lazy-src]
  $('img').each((_, el) => {
    const $el = $(el);
    addAsset(resolveUrl($el.attr('src') || '', baseUrl), 'img', 'src', 'image');
    addAsset(resolveUrl($el.attr('data-src') || '', baseUrl), 'img', 'data-src', 'image');
    addAsset(resolveUrl($el.attr('data-lazy-src') || '', baseUrl), 'img', 'data-lazy-src', 'image');
    const srcset = $el.attr('srcset');
    if (srcset) {
      for (const url of parseSrcset(srcset, baseUrl)) {
        addAsset(url, 'img', 'srcset', 'image');
      }
    }
  });

  // picture > source[srcset]
  $('picture source').each((_, el) => {
    const srcset = $(el).attr('srcset');
    if (srcset) {
      for (const url of parseSrcset(srcset, baseUrl)) {
        addAsset(url, 'source', 'srcset', 'image');
      }
    }
  });

  // video[src], video[poster], audio[src], source[src] (inside video/audio)
  $('video').each((_, el) => {
    const $el = $(el);
    addAsset(resolveUrl($el.attr('src') || '', baseUrl), 'video', 'src', 'video');
    addAsset(resolveUrl($el.attr('poster') || '', baseUrl), 'video', 'poster', 'image');
  });

  $('audio').each((_, el) => {
    addAsset(resolveUrl($(el).attr('src') || '', baseUrl), 'audio', 'src', 'audio');
  });

  $('video source, audio source').each((_, el) => {
    const $el = $(el);
    const src = resolveUrl($el.attr('src') || '', baseUrl);
    if (src) {
      const parent = $el.parent();
      const parentTag = parent.length > 0 ? (parent[0] as any).tagName || (parent[0] as any).name || '' : '';
      addAsset(src, 'source', 'src', parentTag === 'video' ? 'video' : 'audio');
    }
  });

  // link[rel=stylesheet]
  $('link[rel="stylesheet"]').each((_, el) => {
    addAsset(resolveUrl($(el).attr('href') || '', baseUrl), 'link', 'href', 'stylesheet');
  });

  // link[rel=icon], link[rel=apple-touch-icon]
  $('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]').each((_, el) => {
    addAsset(resolveUrl($(el).attr('href') || '', baseUrl), 'link', 'href', 'image');
  });

  // a[href] with binary file extensions
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const resolved = resolveUrl(href, baseUrl);
    if (resolved) {
      const ext = getExtension(resolved);
      if (ext && BINARY_LINK_EXTENSIONS.has(ext)) {
        addAsset(resolved, 'a', 'href', null); // category from extension
      }
    }
  });

  // object[data], embed[src]
  $('object[data]').each((_, el) => {
    addAsset(resolveUrl($(el).attr('data') || '', baseUrl), 'object', 'data', null);
  });

  $('embed[src]').each((_, el) => {
    addAsset(resolveUrl($(el).attr('src') || '', baseUrl), 'embed', 'src', null);
  });

  // Inline style background-image
  $('[style]').each((_, el) => {
    const style = $(el).attr('style') || '';
    if (style.includes('url(')) {
      const tag = (el as any).name || (el as any).tagName || 'div';
      for (const url of extractBackgroundUrls(style, baseUrl)) {
        addAsset(url, tag, 'style', 'image');
      }
    }
  });

  return assets;
}

/**
 * Extract and merge assets from HTML content and network resources.
 * Returns deduplicated asset list.
 */
export function extractAssets(
  html: string,
  baseUrl: string,
  networkResources: ResourceInfo[]
): DiscoveredAsset[] {
  const assetMap = new Map<string, DiscoveredAsset>();

  // 1. Extract from HTML
  const htmlAssets = extractFromHtml(html, baseUrl);
  for (const asset of htmlAssets) {
    const hash = hashUrl(asset.url);
    const ext = getExtension(asset.url);
    const type = asset.category ?? categorize(ext, null);

    if (!assetMap.has(hash)) {
      assetMap.set(hash, {
        url: asset.url,
        urlHash: hash,
        assetType: type,
        mimeType: null,
        fileExtension: ext,
        fileName: getFileName(asset.url),
        fileSizeBytes: null,
        source: 'html',
        httpStatus: null,
        htmlElement: asset.element,
        htmlAttribute: asset.attribute,
      });
    }
  }

  // 2. Merge network resources
  for (const resource of networkResources) {
    if (!resource.url || resource.url.startsWith('data:')) continue;

    const hash = hashUrl(resource.url);
    const ext = getExtension(resource.url);
    const type = RESOURCE_TYPE_TO_CATEGORY[resource.type] ?? categorize(ext, resource.mimeType);

    const existing = assetMap.get(hash);
    if (existing) {
      // Merge: upgrade source to 'both', add network data
      existing.source = 'both';
      existing.mimeType = resource.mimeType || existing.mimeType;
      existing.fileSizeBytes = resource.size || existing.fileSizeBytes;
      existing.httpStatus = resource.status || existing.httpStatus;
      // If HTML said "other" but network knows better, update type
      if (existing.assetType === 'other' && type !== 'other') {
        existing.assetType = type;
      }
    } else {
      assetMap.set(hash, {
        url: resource.url,
        urlHash: hash,
        assetType: type,
        mimeType: resource.mimeType || null,
        fileExtension: ext,
        fileName: getFileName(resource.url),
        fileSizeBytes: resource.size || null,
        source: 'network',
        httpStatus: resource.status || null,
        htmlElement: null,
        htmlAttribute: null,
      });
    }
  }

  return Array.from(assetMap.values());
}
