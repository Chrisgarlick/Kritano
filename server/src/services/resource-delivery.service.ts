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

import fs from 'fs/promises';
import path from 'path';
import type {
  GatedResource,
  ResourceFormat,
  DeliveredFormat,
} from '../types/gated-resource.types.js';
import {
  FORMAT_MIME,
  FORMAT_EXTENSION,
  UnsupportedFormatError,
  ALL_FORMATS,
} from '../types/gated-resource.types.js';
import { renderViaTypeset } from './typeset.service.js';

const SOURCE_BASE_DIR = path.resolve(process.cwd(), 'src', 'data');
const CACHE_BASE_DIR = path.resolve(process.cwd(), 'uploads', 'resources');

export async function deliverFormat(
  resource: GatedResource,
  format: ResourceFormat
): Promise<DeliveredFormat> {
  if (!ALL_FORMATS.includes(format)) {
    throw new UnsupportedFormatError(format);
  }
  if (!resource.formats.includes(format)) {
    throw new UnsupportedFormatError(format);
  }

  if (format === 'md') {
    return deliverMarkdown(resource);
  }

  return deliverViaTypesetCache(resource, format);
}

async function deliverMarkdown(
  resource: GatedResource
): Promise<DeliveredFormat> {
  const sourcePath = resolveWithinBase(
    SOURCE_BASE_DIR,
    resource.source_md_path
  );
  await fs.access(sourcePath);
  return {
    path: sourcePath,
    mimeType: FORMAT_MIME.md,
    filename: `${resource.slug}.${FORMAT_EXTENSION.md}`,
  };
}

async function deliverViaTypesetCache(
  resource: GatedResource,
  format: Exclude<ResourceFormat, 'md'>
): Promise<DeliveredFormat> {
  const cacheDir = path.resolve(CACHE_BASE_DIR, resource.slug);

  // Cache key must include every input that affects the rendered output:
  // content hash + typeset client slug + document_type. Otherwise swapping
  // the brand profile silently serves the old render (lessons-learned point
  // 8 in /docs/integration-guide.md).
  const documentType = 'report';
  const clientSlug = process.env.TYPESET_CLIENT_SLUG || 'default';
  const cacheKey = `${resource.content_hash}-${slugify(clientSlug)}-${documentType}`;
  const cachePath = resolveWithinBase(
    CACHE_BASE_DIR,
    path.join(
      resource.slug,
      `${cacheKey}.${FORMAT_EXTENSION[format]}`
    )
  );

  if (await fileExists(cachePath)) {
    return {
      path: cachePath,
      mimeType: FORMAT_MIME[format],
      filename: `${resource.slug}.${FORMAT_EXTENSION[format]}`,
    };
  }

  const sourcePath = resolveWithinBase(SOURCE_BASE_DIR, resource.source_md_path);
  const markdown = await fs.readFile(sourcePath, 'utf-8');

  const rendered = await renderViaTypeset({
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

  await fs.mkdir(cacheDir, { recursive: true });
  await fs.writeFile(cachePath, rendered.bytes);

  return {
    path: cachePath,
    mimeType: rendered.mimeType || FORMAT_MIME[format],
    filename: `${resource.slug}.${FORMAT_EXTENSION[format]}`,
  };
}

/**
 * Normalise a value into a safe filename fragment. We control all the inputs
 * today (env var, hard-coded enum) but a stray character in the env would
 * otherwise blow up `path.join` or escape the cache dir.
 */
function slugify(v: string): string {
  return v.toLowerCase().replace(/[^a-z0-9-]+/g, '-').slice(0, 64) || 'default';
}

/**
 * Resolve a relative path against a base directory while ensuring the result
 * stays inside that base. Defends against path-traversal even though no user
 * input feeds these paths today.
 */
function resolveWithinBase(base: string, relative: string): string {
  const resolved = path.resolve(base, relative);
  const baseWithSep = base.endsWith(path.sep) ? base : base + path.sep;
  if (!resolved.startsWith(baseWithSep) && resolved !== base) {
    throw new UnsupportedFormatError('path');
  }
  return resolved;
}

async function fileExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}
