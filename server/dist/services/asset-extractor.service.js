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
exports.extractAssets = extractAssets;
const cheerio = __importStar(require("cheerio"));
const crypto_1 = require("crypto");
const asset_types_js_1 = require("../types/asset.types.js");
/**
 * Hash a URL for deduplication
 */
function hashUrl(url) {
    return (0, crypto_1.createHash)('sha256').update(url).digest('hex').slice(0, 16);
}
/**
 * Extract file extension from a URL path
 */
function getExtension(url) {
    try {
        const pathname = new URL(url).pathname;
        const lastSegment = pathname.split('/').pop() || '';
        const dotIndex = lastSegment.lastIndexOf('.');
        if (dotIndex === -1 || dotIndex === lastSegment.length - 1)
            return null;
        return lastSegment.slice(dotIndex + 1).toLowerCase().split('?')[0];
    }
    catch {
        return null;
    }
}
/**
 * Extract file name from a URL path
 */
function getFileName(url) {
    try {
        const pathname = new URL(url).pathname;
        const lastSegment = pathname.split('/').pop() || '';
        return lastSegment || null;
    }
    catch {
        return null;
    }
}
/**
 * Determine asset category from extension or mime type
 */
function categorize(ext, mimeType) {
    if (ext && asset_types_js_1.EXTENSION_TO_CATEGORY[ext])
        return asset_types_js_1.EXTENSION_TO_CATEGORY[ext];
    if (mimeType) {
        if (mimeType.startsWith('image/'))
            return 'image';
        if (mimeType.startsWith('video/'))
            return 'video';
        if (mimeType.startsWith('audio/'))
            return 'audio';
        if (mimeType.startsWith('font/') || mimeType.includes('font'))
            return 'font';
        if (mimeType === 'text/css')
            return 'stylesheet';
        if (mimeType.includes('javascript'))
            return 'script';
        if (mimeType === 'application/pdf')
            return 'document';
    }
    return 'other';
}
/**
 * Resolve a potentially relative href to an absolute URL.
 * Returns null for data URIs, javascript:, mailto:, empty hrefs, anchors.
 */
function resolveUrl(href, baseUrl) {
    if (!href)
        return null;
    const trimmed = href.trim();
    if (!trimmed)
        return null;
    if (trimmed.startsWith('data:'))
        return null;
    if (trimmed.startsWith('javascript:'))
        return null;
    if (trimmed.startsWith('mailto:'))
        return null;
    if (trimmed.startsWith('tel:'))
        return null;
    if (trimmed === '#' || trimmed.startsWith('#'))
        return null;
    try {
        return new URL(trimmed, baseUrl).href;
    }
    catch {
        return null;
    }
}
/**
 * Parse srcset attribute and return all URLs
 */
function parseSrcset(srcset, baseUrl) {
    return srcset
        .split(',')
        .map(entry => entry.trim().split(/\s+/)[0])
        .map(src => resolveUrl(src, baseUrl))
        .filter((url) => url !== null);
}
/**
 * Extract CSS background-image URLs from inline styles
 */
function extractBackgroundUrls(style, baseUrl) {
    const urls = [];
    const regex = /url\(\s*(['"]?)(.*?)\1\s*\)/gi;
    let match;
    while ((match = regex.exec(style)) !== null) {
        const resolved = resolveUrl(match[2], baseUrl);
        if (resolved)
            urls.push(resolved);
    }
    return urls;
}
/**
 * Extract all asset references from HTML
 */
function extractFromHtml(html, baseUrl) {
    const $ = cheerio.load(html);
    const assets = [];
    const addAsset = (url, element, attribute, category) => {
        if (url)
            assets.push({ url, element, attribute, category });
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
            const parentTag = parent.length > 0 ? parent[0].tagName || parent[0].name || '' : '';
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
            if (ext && asset_types_js_1.BINARY_LINK_EXTENSIONS.has(ext)) {
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
            const tag = el.name || el.tagName || 'div';
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
function extractAssets(html, baseUrl, networkResources) {
    const assetMap = new Map();
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
        if (!resource.url || resource.url.startsWith('data:'))
            continue;
        const hash = hashUrl(resource.url);
        const ext = getExtension(resource.url);
        const type = asset_types_js_1.RESOURCE_TYPE_TO_CATEGORY[resource.type] ?? categorize(ext, resource.mimeType);
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
        }
        else {
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
//# sourceMappingURL=asset-extractor.service.js.map