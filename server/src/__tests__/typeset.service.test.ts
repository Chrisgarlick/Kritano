import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  renderViaTypeset,
  buildContent,
} from '../services/typeset.service.js';
import {
  TypesetNotConfiguredError,
  TypesetRenderError,
} from '../types/gated-resource.types.js';

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV };
  delete process.env.TYPESET_ENABLED;
  delete process.env.TYPESET_BASE_URL;
  delete process.env.TYPESET_API_KEY;
  delete process.env.TYPESET_CLIENT_SLUG;
});

afterEach(() => {
  vi.restoreAllMocks();
  process.env = ORIGINAL_ENV;
});

// ── buildContent (pure) ────────────────────────────────────────────────

describe('buildContent', () => {
  it('returns markdown unchanged when frontmatter is empty/absent', () => {
    expect(buildContent('# Hi')).toBe('# Hi');
    expect(buildContent('# Hi', {})).toBe('# Hi');
    expect(buildContent('# Hi', { title: '' })).toBe('# Hi');
    expect(buildContent('# Hi', { title: null, subtitle: undefined })).toBe(
      '# Hi'
    );
  });

  it('prepends a YAML frontmatter block with single-line key/value pairs', () => {
    const content = buildContent('# Body', {
      title: 'My Title',
      subtitle: 'A subtitle',
      date: '2026-05-12',
    });
    expect(content).toBe(
      '---\ntitle: My Title\nsubtitle: A subtitle\ndate: 2026-05-12\n---\n\n# Body'
    );
  });

  it('flattens embedded newlines in values to single spaces', () => {
    const content = buildContent('# Body', {
      title: 'Line one\nLine two',
    });
    expect(content).toContain('title: Line one Line two');
    // no raw newline within the YAML key
    expect(content.split('---\n')[1]).not.toMatch(/title:[^\n]*\n[^-]/);
  });

  it('coerces numeric values to strings', () => {
    const content = buildContent('# Body', { page_count: 12 });
    expect(content).toContain('page_count: 12');
  });
});

// ── renderViaTypeset — feature flag ────────────────────────────────────

describe('renderViaTypeset — feature flag', () => {
  it('throws TypesetNotConfiguredError when TYPESET_ENABLED is unset', async () => {
    await expect(
      renderViaTypeset({ markdown: '# Hi', format: 'pdf' })
    ).rejects.toBeInstanceOf(TypesetNotConfiguredError);
  });

  it('defaults base URL to the production typeset host when not explicitly set', async () => {
    process.env.TYPESET_ENABLED = 'true';
    process.env.TYPESET_API_KEY = 'ts_x_y';
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(new Uint8Array([1]), { status: 200 })
    );
    await renderViaTypeset({ markdown: '# Hi', format: 'pdf' });
    expect(fetchSpy.mock.calls[0][0]).toBe(
      'https://typeset.chrisgarlick.com/api/render'
    );
  });

  it('throws TypesetNotConfiguredError when enabled but API key missing', async () => {
    process.env.TYPESET_ENABLED = 'true';
    process.env.TYPESET_BASE_URL = 'https://typeset.example.com';
    await expect(
      renderViaTypeset({ markdown: '# Hi', format: 'pdf' })
    ).rejects.toBeInstanceOf(TypesetNotConfiguredError);
  });

  it('throws TypesetRenderError for the not-yet-supported html format', async () => {
    process.env.TYPESET_ENABLED = 'true';
    process.env.TYPESET_BASE_URL = 'https://typeset.example.com';
    process.env.TYPESET_API_KEY = 'ts_x_y';
    await expect(
      renderViaTypeset({ markdown: '# Hi', format: 'html' })
    ).rejects.toBeInstanceOf(TypesetRenderError);
  });
});

// ── renderViaTypeset — happy path ──────────────────────────────────────

describe('renderViaTypeset — happy path', () => {
  beforeEach(() => {
    process.env.TYPESET_ENABLED = 'true';
    process.env.TYPESET_BASE_URL = 'https://typeset.example.com';
    process.env.TYPESET_API_KEY = 'ts_550e8400-e29b-41d4-a716-446655440000_test';
  });

  it('POSTs to /api/render with the correct shape and bearer auth', async () => {
    const pdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46]);
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(pdfBytes, {
        status: 200,
        headers: { 'content-type': 'application/pdf' },
      })
    );

    const result = await renderViaTypeset({
      markdown: '# Body',
      format: 'pdf',
      frontmatter: { title: 'Demo', author: 'Kritano' },
    });

    expect(result.mimeType).toBe('application/pdf');
    expect(Array.from(result.bytes)).toEqual([0x25, 0x50, 0x44, 0x46]);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe('https://typeset.example.com/api/render');
    expect(init?.method).toBe('POST');
    expect((init?.headers as Record<string, string>).Authorization).toBe(
      'Bearer ts_550e8400-e29b-41d4-a716-446655440000_test'
    );
    const body = JSON.parse(init?.body as string);
    expect(body.document_type).toBe('report');
    expect(body.format).toBe('pdf');
    expect(body.content).toBe(
      '---\ntitle: Demo\nauthor: Kritano\n---\n\n# Body'
    );
    expect(body.client).toBeUndefined();
  });

  it('passes a custom document_type when supplied', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(new Uint8Array([1]), { status: 200 })
    );
    await renderViaTypeset({
      markdown: '# Hi',
      format: 'pdf',
      documentType: 'brief',
    });
    const body = JSON.parse(fetchSpy.mock.calls[0][1]?.body as string);
    expect(body.document_type).toBe('brief');
  });

  it('passes the client slug from the request', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(new Uint8Array([1]), { status: 200 })
    );
    await renderViaTypeset({
      markdown: '# Hi',
      format: 'pdf',
      clientSlug: 'acme',
    });
    const body = JSON.parse(fetchSpy.mock.calls[0][1]?.body as string);
    expect(body.client).toBe('acme');
  });

  it('falls back to TYPESET_CLIENT_SLUG env when no clientSlug is supplied', async () => {
    process.env.TYPESET_CLIENT_SLUG = 'kritano';
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(new Uint8Array([1]), { status: 200 })
    );
    await renderViaTypeset({ markdown: '# Hi', format: 'pdf' });
    const body = JSON.parse(fetchSpy.mock.calls[0][1]?.body as string);
    expect(body.client).toBe('kritano');
  });

  it('strips trailing slash from TYPESET_BASE_URL before appending /api/render', async () => {
    process.env.TYPESET_BASE_URL = 'https://typeset.example.com/';
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(new Uint8Array([1, 2, 3]), { status: 200 })
    );
    await renderViaTypeset({ markdown: '# Hi', format: 'pdf' });
    expect(fetchSpy.mock.calls[0][0]).toBe(
      'https://typeset.example.com/api/render'
    );
  });
});

// ── renderViaTypeset — error mapping ───────────────────────────────────

describe('renderViaTypeset — error mapping', () => {
  beforeEach(() => {
    process.env.TYPESET_ENABLED = 'true';
    process.env.TYPESET_BASE_URL = 'https://typeset.example.com';
    process.env.TYPESET_API_KEY = 'ts_x_y';
  });

  it('maps non-2xx responses to TypesetRenderError with status code and body excerpt', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response('{"error":"Render capacity exceeded","status":500}', {
        status: 500,
      })
    );
    await expect(
      renderViaTypeset({ markdown: '# Hi', format: 'pdf' })
    ).rejects.toMatchObject({
      name: 'TypesetRenderError',
      statusCode: 500,
      message: expect.stringContaining('Render capacity exceeded'),
    });
  });

  it('maps an empty body to TypesetRenderError', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(new Uint8Array(0), { status: 200 })
    );
    await expect(
      renderViaTypeset({ markdown: '# Hi', format: 'pdf' })
    ).rejects.toBeInstanceOf(TypesetRenderError);
  });

  it('maps fetch network failures to TypesetRenderError', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('ECONNREFUSED'));
    await expect(
      renderViaTypeset({ markdown: '# Hi', format: 'pdf' })
    ).rejects.toMatchObject({
      name: 'TypesetRenderError',
      message: expect.stringContaining('ECONNREFUSED'),
    });
  });
});
