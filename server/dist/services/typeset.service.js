"use strict";
/**
 * Typeset Service
 *
 * Client for typeset.chrisgarlick.com — turns Markdown into branded PDF or
 * DOCX. See /docs/typeset_integration.md for the full API reference and
 * /docs/gated-resources.md for how this fits into the gated resource library.
 *
 * Operational notes
 * - Auth keys follow the format `ts_<uuid>_<random>`. The UUID is the user ID
 *   typeset scopes data to; always reuse the same key for Kritano.
 * - Per-tenant branding lives in a typeset "client profile". Create one with
 *   `scripts/setup-typeset-profile.ts` (or POST /api/clients) and reference
 *   the slug via TYPESET_CLIENT_SLUG (default: `kritano`).
 * - Typeset currently supports PDF and DOCX. HTML output will be added by
 *   typeset later; until then, requesting `html` throws TypesetRenderError.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildContent = buildContent;
exports.renderViaTypeset = renderViaTypeset;
const gated_resource_types_js_1 = require("../types/gated-resource.types.js");
const RENDER_TIMEOUT_MS = 60_000;
const DEFAULT_DOCUMENT_TYPE = 'report';
function isEnabled() {
    return process.env.TYPESET_ENABLED === 'true';
}
/**
 * Combine the markdown body and the frontmatter map into a single `content`
 * string. Typeset's frontmatter parser is intentionally simple: single-line
 * `key: value` pairs, no nesting, no multi-line strings. Empty/nullish
 * values are dropped; newlines in values are collapsed to spaces.
 */
function buildContent(markdown, frontmatter) {
    const entries = Object.entries(frontmatter ?? {})
        .filter(([, v]) => v !== null && v !== undefined && String(v).trim().length > 0)
        .map(([k, v]) => `${k}: ${String(v).replace(/[\r\n]+/g, ' ').trim()}`);
    if (entries.length === 0)
        return markdown;
    return `---\n${entries.join('\n')}\n---\n\n${markdown}`;
}
async function renderViaTypeset(req) {
    if (!isEnabled()) {
        throw new gated_resource_types_js_1.TypesetNotConfiguredError();
    }
    // Base URL defaults to the production host so the API key is the only
    // strictly-required setting in .env. Override TYPESET_BASE_URL only when
    // pointing at a local container or staging instance.
    const baseUrl = process.env.TYPESET_BASE_URL || 'https://typeset.chrisgarlick.com';
    const apiKey = process.env.TYPESET_API_KEY;
    if (!apiKey) {
        throw new gated_resource_types_js_1.TypesetNotConfiguredError();
    }
    if (req.format === 'html') {
        throw new gated_resource_types_js_1.TypesetRenderError('Typeset does not currently support HTML output');
    }
    const clientSlug = req.clientSlug ?? process.env.TYPESET_CLIENT_SLUG;
    const body = {
        content: buildContent(req.markdown, req.frontmatter),
        document_type: req.documentType ?? DEFAULT_DOCUMENT_TYPE,
        format: req.format,
    };
    if (clientSlug)
        body.client = clientSlug;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), RENDER_TIMEOUT_MS);
    let response;
    try {
        response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/render`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify(body),
            signal: controller.signal,
        });
    }
    catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
            throw new gated_resource_types_js_1.TypesetRenderError('Typeset render timed out');
        }
        const message = err instanceof Error ? err.message : String(err);
        throw new gated_resource_types_js_1.TypesetRenderError(`Typeset request failed: ${message}`);
    }
    finally {
        clearTimeout(timer);
    }
    if (!response.ok) {
        let detail = `Typeset render returned ${response.status}`;
        try {
            const text = await response.text();
            if (text)
                detail += `: ${text.slice(0, 500)}`;
        }
        catch {
            /* ignore body-read failure */
        }
        throw new gated_resource_types_js_1.TypesetRenderError(detail, response.status);
    }
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength === 0) {
        throw new gated_resource_types_js_1.TypesetRenderError('Typeset returned an empty body');
    }
    return {
        bytes: new Uint8Array(buffer),
        mimeType: response.headers.get('content-type') ?? 'application/octet-stream',
    };
}
//# sourceMappingURL=typeset.service.js.map