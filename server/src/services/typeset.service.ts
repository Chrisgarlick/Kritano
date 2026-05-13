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

import {
  TypesetNotConfiguredError,
  TypesetRenderError,
} from '../types/gated-resource.types.js';
import type { ResourceFormat } from '../types/gated-resource.types.js';

/** Document type enum mirroring typeset's /api/render contract. */
export type TypesetDocumentType =
  | 'proposal'
  | 'report'
  | 'brief'
  | 'sop'
  | 'invoice'
  | 'general';

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

const RENDER_TIMEOUT_MS = 60_000;
const DEFAULT_DOCUMENT_TYPE: TypesetDocumentType = 'report';

function isEnabled(): boolean {
  return process.env.TYPESET_ENABLED === 'true';
}

/**
 * Combine the markdown body and the frontmatter map into a single `content`
 * string. Typeset's frontmatter parser is intentionally simple: single-line
 * `key: value` pairs, no nesting, no multi-line strings. Empty/nullish
 * values are dropped; newlines in values are collapsed to spaces.
 */
export function buildContent(
  markdown: string,
  frontmatter?: TypesetRenderRequest['frontmatter']
): string {
  const entries = Object.entries(frontmatter ?? {})
    .filter(([, v]) => v !== null && v !== undefined && String(v).trim().length > 0)
    .map(
      ([k, v]) =>
        `${k}: ${String(v).replace(/[\r\n]+/g, ' ').trim()}`
    );
  if (entries.length === 0) return markdown;
  return `---\n${entries.join('\n')}\n---\n\n${markdown}`;
}

export async function renderViaTypeset(
  req: TypesetRenderRequest
): Promise<TypesetRenderResponse> {
  if (!isEnabled()) {
    throw new TypesetNotConfiguredError();
  }

  // Base URL defaults to the production host so the API key is the only
  // strictly-required setting in .env. Override TYPESET_BASE_URL only when
  // pointing at a local container or staging instance.
  const baseUrl =
    process.env.TYPESET_BASE_URL || 'https://typeset.chrisgarlick.com';
  const apiKey = process.env.TYPESET_API_KEY;
  if (!apiKey) {
    throw new TypesetNotConfiguredError();
  }

  if (req.format === 'html') {
    throw new TypesetRenderError(
      'Typeset does not currently support HTML output'
    );
  }

  const clientSlug = req.clientSlug ?? process.env.TYPESET_CLIENT_SLUG;
  const body: Record<string, unknown> = {
    content: buildContent(req.markdown, req.frontmatter),
    document_type: req.documentType ?? DEFAULT_DOCUMENT_TYPE,
    format: req.format,
  };
  if (clientSlug) body.client = clientSlug;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), RENDER_TIMEOUT_MS);

  let response: Response;
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
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new TypesetRenderError('Typeset render timed out');
    }
    const message = err instanceof Error ? err.message : String(err);
    throw new TypesetRenderError(`Typeset request failed: ${message}`);
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    let detail = `Typeset render returned ${response.status}`;
    try {
      const text = await response.text();
      if (text) detail += `: ${text.slice(0, 500)}`;
    } catch {
      /* ignore body-read failure */
    }
    throw new TypesetRenderError(detail, response.status);
  }

  const buffer = await response.arrayBuffer();
  if (buffer.byteLength === 0) {
    throw new TypesetRenderError('Typeset returned an empty body');
  }

  return {
    bytes: new Uint8Array(buffer),
    mimeType:
      response.headers.get('content-type') ?? 'application/octet-stream',
  };
}
