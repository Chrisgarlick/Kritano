"use strict";
/**
 * Resource Delivery Service
 *
 * Resolves the bytes for a given gated resource and format:
 *   - md   → source Markdown file from server/src/data/resources/<slug>/
 *   - pdf  → rendered via typeset, cached to server/uploads/resources/<slug>/
 *   - html → rendered via typeset, cached to server/uploads/resources/<slug>/
 *   - docx → reserved for when typeset supports it
 *
 * Cache key is the resource's content_hash, so editing the source MD and
 * recomputing the hash invalidates the cache automatically.
 *
 * See /docs/gated-resources.md for the feature plan.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deliverFormat = deliverFormat;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const gated_resource_types_js_1 = require("../types/gated-resource.types.js");
const typeset_service_js_1 = require("./typeset.service.js");
const SOURCE_BASE_DIR = path_1.default.resolve(process.cwd(), 'src', 'data');
const CACHE_BASE_DIR = path_1.default.resolve(process.cwd(), 'uploads', 'resources');
async function deliverFormat(resource, format) {
    if (!gated_resource_types_js_1.ALL_FORMATS.includes(format)) {
        throw new gated_resource_types_js_1.UnsupportedFormatError(format);
    }
    if (!resource.formats.includes(format)) {
        throw new gated_resource_types_js_1.UnsupportedFormatError(format);
    }
    if (format === 'md') {
        return deliverMarkdown(resource);
    }
    return deliverViaTypesetCache(resource, format);
}
async function deliverMarkdown(resource) {
    const sourcePath = resolveWithinBase(SOURCE_BASE_DIR, resource.source_md_path);
    await promises_1.default.access(sourcePath);
    return {
        path: sourcePath,
        mimeType: gated_resource_types_js_1.FORMAT_MIME.md,
        filename: `${resource.slug}.${gated_resource_types_js_1.FORMAT_EXTENSION.md}`,
    };
}
async function deliverViaTypesetCache(resource, format) {
    const cacheDir = path_1.default.resolve(CACHE_BASE_DIR, resource.slug);
    // Cache key must include every input that affects the rendered output:
    // content hash + typeset client slug + document_type. Otherwise swapping
    // the brand profile silently serves the old render (lessons-learned point
    // 8 in /docs/integration-guide.md).
    const documentType = 'report';
    const clientSlug = process.env.TYPESET_CLIENT_SLUG || 'default';
    const cacheKey = `${resource.content_hash}-${slugify(clientSlug)}-${documentType}`;
    const cachePath = resolveWithinBase(CACHE_BASE_DIR, path_1.default.join(resource.slug, `${cacheKey}.${gated_resource_types_js_1.FORMAT_EXTENSION[format]}`));
    if (await fileExists(cachePath)) {
        return {
            path: cachePath,
            mimeType: gated_resource_types_js_1.FORMAT_MIME[format],
            filename: `${resource.slug}.${gated_resource_types_js_1.FORMAT_EXTENSION[format]}`,
        };
    }
    const sourcePath = resolveWithinBase(SOURCE_BASE_DIR, resource.source_md_path);
    const markdown = await promises_1.default.readFile(sourcePath, 'utf-8');
    const rendered = await (0, typeset_service_js_1.renderViaTypeset)({
        markdown,
        format,
        documentType,
        frontmatter: {
            title: resource.title,
            subtitle: resource.subtitle ?? undefined,
            author: 'Kritano',
            date: new Date(resource.updated_at).toISOString().slice(0, 10),
        },
    });
    await promises_1.default.mkdir(cacheDir, { recursive: true });
    await promises_1.default.writeFile(cachePath, rendered.bytes);
    return {
        path: cachePath,
        mimeType: rendered.mimeType || gated_resource_types_js_1.FORMAT_MIME[format],
        filename: `${resource.slug}.${gated_resource_types_js_1.FORMAT_EXTENSION[format]}`,
    };
}
/**
 * Normalise a value into a safe filename fragment. We control all the inputs
 * today (env var, hard-coded enum) but a stray character in the env would
 * otherwise blow up `path.join` or escape the cache dir.
 */
function slugify(v) {
    return v.toLowerCase().replace(/[^a-z0-9-]+/g, '-').slice(0, 64) || 'default';
}
/**
 * Resolve a relative path against a base directory while ensuring the result
 * stays inside that base. Defends against path-traversal even though no user
 * input feeds these paths today.
 */
function resolveWithinBase(base, relative) {
    const resolved = path_1.default.resolve(base, relative);
    const baseWithSep = base.endsWith(path_1.default.sep) ? base : base + path_1.default.sep;
    if (!resolved.startsWith(baseWithSep) && resolved !== base) {
        throw new gated_resource_types_js_1.UnsupportedFormatError('path');
    }
    return resolved;
}
async function fileExists(p) {
    try {
        await promises_1.default.access(p);
        return true;
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=resource-delivery.service.js.map