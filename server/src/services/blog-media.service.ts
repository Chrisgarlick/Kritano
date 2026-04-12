/**
 * Blog Media Service
 *
 * Upload handling, Sharp image processing (resize, WebP, thumbnail),
 * local file storage, deletion.
 */

import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { JSDOM } from 'jsdom';
import DOMPurify from 'dompurify';
import { pool } from '../db/index.js';
import type { BlogMedia } from '../types/blog.types.js';

const UPLOAD_DIR = path.resolve(__dirname, '..', '..', 'uploads', 'blog');
const MAX_WIDTH = 2400;
const THUMBNAIL_WIDTH = 400;
const THUMBNAIL_HEIGHT = 300;
const WEBP_QUALITY = 80;

const ALLOWED_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/svg+xml',
]);

// Ensure upload directories exist
async function ensureUploadDirs(): Promise<void> {
  await fs.mkdir(path.join(UPLOAD_DIR, 'original'), { recursive: true });
  await fs.mkdir(path.join(UPLOAD_DIR, 'thumbnails'), { recursive: true });
  await fs.mkdir(path.join(UPLOAD_DIR, 'webp'), { recursive: true });
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'image';
}

async function uniqueStorageKey(slug: string, ext: string): Promise<string> {
  let candidate = `${slug}${ext}`;
  let counter = 0;
  while (true) {
    const filePath = path.join(UPLOAD_DIR, 'original', candidate);
    try {
      await fs.access(filePath);
      // File exists, try next suffix
      counter++;
      candidate = `${slug}_${counter}${ext}`;
    } catch {
      // File doesn't exist, we can use this name
      return candidate;
    }
  }
}

function generateStorageKey(originalName: string): Promise<string> {
  const ext = path.extname(originalName).toLowerCase();
  const base = path.basename(originalName, ext);
  const slug = slugify(base);
  return uniqueStorageKey(slug, ext);
}

export interface UploadResult {
  id: string;
  url: string;
  thumbnailUrl: string;
  webpUrl: string;
  width: number;
  height: number;
  fileSizeBytes: number;
}

export async function uploadMedia(
  file: { buffer: Buffer; originalname: string; mimetype: string; size: number },
  uploadedBy: string
): Promise<UploadResult> {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    throw new Error(`Unsupported file type: ${file.mimetype}`);
  }

  await ensureUploadDirs();

  const storageKey = await generateStorageKey(file.originalname);
  const baseName = storageKey.replace(/\.[^.]+$/, '');
  const thumbnailKey = `thumb-${baseName}.jpg`;
  const webpKey = `${baseName}.webp`;

  let width: number;
  let height: number;
  let processedBuffer: Buffer;

  if (file.mimetype === 'image/svg+xml') {
    // Sanitize SVG to strip scripts, event handlers, and foreign objects
    const window = new JSDOM('').window;
    const purify = DOMPurify(window as any);
    const cleanSvg = purify.sanitize(file.buffer.toString('utf-8'), {
      USE_PROFILES: { svg: true, svgFilters: true },
      ADD_TAGS: ['use'],
      FORBID_TAGS: ['script', 'foreignObject'],
      FORBID_ATTR: ['onload', 'onerror', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
    });
    processedBuffer = Buffer.from(cleanSvg, 'utf-8');
    width = 0;
    height = 0;

    await fs.writeFile(path.join(UPLOAD_DIR, 'original', storageKey), processedBuffer);
    // No thumbnail/webp for SVGs
    await fs.writeFile(path.join(UPLOAD_DIR, 'thumbnails', thumbnailKey), processedBuffer);
    await fs.writeFile(path.join(UPLOAD_DIR, 'webp', webpKey), processedBuffer);
  } else {
    // Process with Sharp
    const image = sharp(file.buffer);
    const metadata = await image.metadata();
    width = metadata.width || 0;
    height = metadata.height || 0;

    // Strip EXIF and resize if too wide
    const originalPipeline = sharp(file.buffer).rotate(); // auto-rotate based on EXIF
    if (width > MAX_WIDTH) {
      originalPipeline.resize(MAX_WIDTH, undefined, { withoutEnlargement: true });
      const resizedMeta = await originalPipeline.clone().metadata();
      width = resizedMeta.width || MAX_WIDTH;
      height = resizedMeta.height || height;
    }

    processedBuffer = await originalPipeline.toBuffer();
    await fs.writeFile(path.join(UPLOAD_DIR, 'original', storageKey), processedBuffer);

    // Thumbnail (400x300 cover crop)
    const thumbnailBuffer = await sharp(file.buffer)
      .resize(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toBuffer();
    await fs.writeFile(path.join(UPLOAD_DIR, 'thumbnails', thumbnailKey), thumbnailBuffer);

    // WebP variant
    const webpBuffer = await sharp(processedBuffer)
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();
    await fs.writeFile(path.join(UPLOAD_DIR, 'webp', webpKey), webpBuffer);
  }

  // Insert database record
  const result = await pool.query(
    `INSERT INTO blog_media (
      filename, storage_key, mime_type, file_size_bytes,
      width, height, thumbnail_key, webp_key, uploaded_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *`,
    [
      file.originalname,
      storageKey,
      file.mimetype,
      processedBuffer.length,
      width || null,
      height || null,
      thumbnailKey,
      webpKey,
      uploadedBy,
    ]
  );

  const media = result.rows[0];

  return {
    id: media.id,
    url: `/uploads/blog/original/${storageKey}`,
    thumbnailUrl: `/uploads/blog/thumbnails/${thumbnailKey}`,
    webpUrl: `/uploads/blog/webp/${webpKey}`,
    width: width || 0,
    height: height || 0,
    fileSizeBytes: processedBuffer.length,
  };
}

export async function deleteMedia(mediaId: string): Promise<boolean> {
  const result = await pool.query(
    'DELETE FROM blog_media WHERE id = $1 RETURNING storage_key, thumbnail_key, webp_key',
    [mediaId]
  );

  if (result.rows.length === 0) return false;

  const { storage_key, thumbnail_key, webp_key } = result.rows[0];

  // Delete files (ignore errors for missing files)
  const deleteFile = async (dir: string, key: string | null) => {
    if (!key) return;
    try {
      await fs.unlink(path.join(UPLOAD_DIR, dir, key));
    } catch {
      // File may already be deleted
    }
  };

  await Promise.all([
    deleteFile('original', storage_key),
    deleteFile('thumbnails', thumbnail_key),
    deleteFile('webp', webp_key),
  ]);

  return true;
}

export async function listMedia(
  page: number = 1,
  limit: number = 24
): Promise<{ media: (BlogMedia & { url: string; thumbnailUrl: string })[]; total: number }> {
  const offset = (page - 1) * limit;

  const [mediaResult, countResult] = await Promise.all([
    pool.query(
      `SELECT * FROM blog_media ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    ),
    pool.query('SELECT COUNT(*)::int AS total FROM blog_media'),
  ]);

  const media = mediaResult.rows.map((m: BlogMedia) => ({
    ...m,
    url: `/uploads/blog/original/${m.storage_key}`,
    thumbnailUrl: m.thumbnail_key ? `/uploads/blog/thumbnails/${m.thumbnail_key}` : `/uploads/blog/original/${m.storage_key}`,
  }));

  return {
    media,
    total: countResult.rows[0].total,
  };
}

export async function updateMediaAltText(mediaId: string, altText: string): Promise<BlogMedia | null> {
  const result = await pool.query(
    'UPDATE blog_media SET alt_text = $1 WHERE id = $2 RETURNING *',
    [altText, mediaId]
  );
  return result.rows[0] || null;
}

export async function renameMedia(
  mediaId: string,
  newName: string
): Promise<(BlogMedia & { url: string; thumbnailUrl: string; webpUrl: string }) | null> {
  const existing = await pool.query('SELECT * FROM blog_media WHERE id = $1', [mediaId]);
  if (existing.rows.length === 0) return null;

  const media: BlogMedia = existing.rows[0];
  const oldExt = path.extname(media.storage_key).toLowerCase();
  const newSlug = slugify(newName);
  if (!newSlug) throw new Error('Invalid name');

  await ensureUploadDirs();
  const newStorageKey = await uniqueStorageKey(newSlug, oldExt);
  const baseName = newStorageKey.replace(/\.[^.]+$/, '');
  const newThumbnailKey = `thumb-${baseName}.jpg`;
  const newWebpKey = `${baseName}.webp`;
  const newFilename = `${newName}${oldExt}`;

  // Rename files on disk
  const renameFile = async (dir: string, oldKey: string | null, newKey: string) => {
    if (!oldKey) return;
    const oldPath = path.join(UPLOAD_DIR, dir, oldKey);
    const newPath = path.join(UPLOAD_DIR, dir, newKey);
    try {
      await fs.rename(oldPath, newPath);
    } catch {
      // File may not exist (e.g., SVGs without thumbnails)
    }
  };

  await Promise.all([
    renameFile('original', media.storage_key, newStorageKey),
    renameFile('thumbnails', media.thumbnail_key, newThumbnailKey),
    renameFile('webp', media.webp_key, newWebpKey),
  ]);

  const result = await pool.query(
    `UPDATE blog_media
     SET filename = $1, storage_key = $2, thumbnail_key = $3, webp_key = $4
     WHERE id = $5 RETURNING *`,
    [newFilename, newStorageKey, newThumbnailKey, newWebpKey, mediaId]
  );

  const updated = result.rows[0];
  return {
    ...updated,
    url: `/uploads/blog/original/${newStorageKey}`,
    thumbnailUrl: `/uploads/blog/thumbnails/${newThumbnailKey}`,
    webpUrl: `/uploads/blog/webp/${newWebpKey}`,
  };
}
