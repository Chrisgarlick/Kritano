import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

import { deliverFormat } from '../services/resource-delivery.service.js';
import * as typesetService from '../services/typeset.service.js';
import {
  TypesetNotConfiguredError,
  UnsupportedFormatError,
  FORMAT_MIME,
} from '../types/gated-resource.types.js';
import type {
  GatedResource,
  ResourceFormat,
} from '../types/gated-resource.types.js';

/**
 * deliverFormat resolves source MD against process.cwd() + /src/data, and the
 * disk cache against process.cwd() + /uploads/resources. Tests run from
 * server/ as cwd (vitest's default), so we operate against the real source MD
 * placeholder for happy-path MD delivery, and against a temp-isolated cache
 * dir we wipe before each test.
 */

const SLUG = 'website-health-checklist';
const SOURCE_REL = 'resources/website-health-checklist/source.md';
const CONTENT_HASH =
  'defdccf46613a213be2d036b52c91f5431e2f90781f30f0a2dbcd56443453cfd';
// Mirrors the cache-key construction in resource-delivery.service.ts —
// content_hash + slugified client + document_type. Tests don't set
// TYPESET_CLIENT_SLUG so we expect the 'default' fallback.
const CACHE_KEY = `${CONTENT_HASH}-default-report`;

function makeResource(overrides: Partial<GatedResource> = {}): GatedResource {
  return {
    id: '00000000-0000-0000-0000-000000000001',
    slug: SLUG,
    title: 'The Website Health Checklist',
    subtitle: null,
    hook: 'Pre-launch checklist',
    category: 'guides',
    audience: null,
    description: 'desc',
    preview_md: 'preview',
    source_md_path: SOURCE_REL,
    formats: ['md', 'pdf', 'html'] as ResourceFormat[],
    content_hash: CONTENT_HASH,
    page_count: 6,
    published: false,
    download_count: 0,
    focus_keyword: null,
    secondary_keywords: [],
    seo_title: null,
    seo_description: null,
    tags: [],
    created_at: '2026-05-12T00:00:00Z',
    updated_at: '2026-05-12T00:00:00Z',
    ...overrides,
  };
}

const CACHE_BASE = path.resolve(process.cwd(), 'uploads', 'resources');

beforeEach(async () => {
  // Wipe the cache for our test slug between runs so cache-miss tests start clean.
  await fs.rm(path.join(CACHE_BASE, SLUG), { recursive: true, force: true });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('deliverFormat — md', () => {
  it('returns the source MD file path with the right mime and filename', async () => {
    const result = await deliverFormat(makeResource(), 'md');
    expect(result.mimeType).toBe(FORMAT_MIME.md);
    expect(result.filename).toBe(`${SLUG}.md`);
    expect(result.path).toContain(SOURCE_REL.replace(/\//g, path.sep));

    // The returned path resolves to a real, readable file.
    const stat = await fs.stat(result.path);
    expect(stat.isFile()).toBe(true);
  });

  it('does not call typeset for md delivery', async () => {
    const spy = vi.spyOn(typesetService, 'renderViaTypeset');
    await deliverFormat(makeResource(), 'md');
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('deliverFormat — pdf / html via typeset', () => {
  it('returns a cached file without calling typeset when the cache hit exists', async () => {
    const resource = makeResource();
    const cacheDir = path.join(CACHE_BASE, SLUG);
    const cachePath = path.join(cacheDir, `${CACHE_KEY}.pdf`);
    await fs.mkdir(cacheDir, { recursive: true });
    await fs.writeFile(cachePath, new Uint8Array([0x25, 0x50, 0x44, 0x46]));

    const spy = vi.spyOn(typesetService, 'renderViaTypeset');
    const result = await deliverFormat(resource, 'pdf');

    expect(result.path).toBe(cachePath);
    expect(result.filename).toBe(`${SLUG}.pdf`);
    expect(result.mimeType).toBe(FORMAT_MIME.pdf);
    expect(spy).not.toHaveBeenCalled();
  });

  it('on cache miss, calls typeset and writes the response to the cache', async () => {
    const resource = makeResource();
    const fake = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x99]);
    vi.spyOn(typesetService, 'renderViaTypeset').mockResolvedValue({
      bytes: fake,
      mimeType: 'application/pdf',
    });

    const result = await deliverFormat(resource, 'pdf');

    const expected = path.join(CACHE_BASE, SLUG, `${CACHE_KEY}.pdf`);
    expect(result.path).toBe(expected);
    const written = await fs.readFile(expected);
    expect(Array.from(written)).toEqual(Array.from(fake));
  });

  it('propagates TypesetNotConfiguredError when typeset is disabled', async () => {
    vi.spyOn(typesetService, 'renderViaTypeset').mockRejectedValue(
      new TypesetNotConfiguredError()
    );
    await expect(deliverFormat(makeResource(), 'pdf')).rejects.toBeInstanceOf(
      TypesetNotConfiguredError
    );
  });

  it('re-renders after content_hash changes (cache key bumps)', async () => {
    const original = makeResource();
    const newHash = 'a'.repeat(64);
    const updated = makeResource({ content_hash: newHash });

    vi.spyOn(typesetService, 'renderViaTypeset').mockResolvedValue({
      bytes: new Uint8Array([1, 2, 3]),
      mimeType: 'application/pdf',
    });

    const first = await deliverFormat(original, 'pdf');
    const second = await deliverFormat(updated, 'pdf');

    expect(first.path).toContain(`${CONTENT_HASH}-default-report.pdf`);
    expect(second.path).toContain(`${newHash}-default-report.pdf`);
    expect(first.path).not.toBe(second.path);
  });

  it('re-renders after the typeset client slug changes', async () => {
    const resource = makeResource();
    vi.spyOn(typesetService, 'renderViaTypeset').mockResolvedValue({
      bytes: new Uint8Array([1, 2, 3]),
      mimeType: 'application/pdf',
    });

    const before = await deliverFormat(resource, 'pdf');

    const originalEnv = process.env.TYPESET_CLIENT_SLUG;
    process.env.TYPESET_CLIENT_SLUG = 'acme';
    try {
      const after = await deliverFormat(resource, 'pdf');
      expect(before.path).toContain('-default-report.pdf');
      expect(after.path).toContain('-acme-report.pdf');
      expect(before.path).not.toBe(after.path);
    } finally {
      if (originalEnv === undefined) delete process.env.TYPESET_CLIENT_SLUG;
      else process.env.TYPESET_CLIENT_SLUG = originalEnv;
    }
  });
});

describe('deliverFormat — invalid input', () => {
  it('throws UnsupportedFormatError for an unknown format', async () => {
    await expect(
      // @ts-expect-error: deliberately invalid
      deliverFormat(makeResource(), 'rtf')
    ).rejects.toBeInstanceOf(UnsupportedFormatError);
  });

  it('throws UnsupportedFormatError when the resource does not advertise the format', async () => {
    const mdOnly = makeResource({ formats: ['md'] });
    await expect(deliverFormat(mdOnly, 'pdf')).rejects.toBeInstanceOf(
      UnsupportedFormatError
    );
  });
});
