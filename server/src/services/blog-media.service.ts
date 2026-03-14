/**
 * Blog Media Service
 *
 * Upload handling, Sharp image processing (resize, WebP, thumbnail),
 * local file storage, deletion.
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import sharp from 'sharp';
import { pool } from '../db/index.js';
import type { BlogMedia } from '../types/blog.types.js';

const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads', 'blog');
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

function generateStorageKey(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase();
  const hash = crypto.randomBytes(16).toString('hex');
  const timestamp = Date.now();
  return `${timestamp}-${hash}${ext}`;
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

  const storageKey = generateStorageKey(file.originalname);
  const thumbnailKey = `thumb-${storageKey.replace(/\.[^.]+$/, '.jpg')}`;
  const webpKey = `${storageKey.replace(/\.[^.]+$/, '.webp')}`;

  let width: number;
  let height: number;
  let processedBuffer: Buffer;

  if (file.mimetype === 'image/svg+xml') {
    // SVGs don't need processing
    processedBuffer = file.buffer;
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
