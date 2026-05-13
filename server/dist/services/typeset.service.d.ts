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
import type { ResourceFormat } from '../types/gated-resource.types.js';
/** Document type enum mirroring typeset's /api/render contract. */
export type TypesetDocumentType = 'proposal' | 'report' | 'brief' | 'sop' | 'invoice' | 'general';
export interface TypesetRenderRequest {
    /** Markdown body. No leading YAML frontmatter — pass that via `frontmatter`. */
    markdown: string;
    /** Output format. `html` is reserved for when typeset adds support. */
    format: Exclude<ResourceFormat, 'md'>;
    /**
     * YAML frontmatter fields. Typeset's parser handles single-line key/value
     * pairs only, so values are flattened to a single line before being sent.
     */
    frontmatter?: Record<string, string | number | null | undefined>;
    /** Defaults to `'report'` — fits Kritano's reference checklists and guides. */
    documentType?: TypesetDocumentType;
    /**
     * Typeset client-profile slug. Defaults to env `TYPESET_CLIENT_SLUG`. If
     * neither is set, typeset uses its built-in default profile.
     */
    clientSlug?: string;
}
export interface TypesetRenderResponse {
    bytes: Uint8Array;
    mimeType: string;
}
/**
 * Combine the markdown body and the frontmatter map into a single `content`
 * string. Typeset's frontmatter parser is intentionally simple: single-line
 * `key: value` pairs, no nesting, no multi-line strings. Empty/nullish
 * values are dropped; newlines in values are collapsed to spaces.
 */
export declare function buildContent(markdown: string, frontmatter?: TypesetRenderRequest['frontmatter']): string;
export declare function renderViaTypeset(req: TypesetRenderRequest): Promise<TypesetRenderResponse>;
//# sourceMappingURL=typeset.service.d.ts.map