"use strict";
/**
 * Blog Media Service
 *
 * Upload handling, Sharp image processing (resize, WebP, thumbnail),
 * local file storage, deletion.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMedia = uploadMedia;
exports.deleteMedia = deleteMedia;
exports.listMedia = listMedia;
exports.updateMediaAltText = updateMediaAltText;
exports.renameMedia = renameMedia;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const sharp_1 = __importDefault(require("sharp"));
const jsdom_1 = require("jsdom");
const dompurify_1 = __importDefault(require("dompurify"));
const index_js_1 = require("../db/index.js");
const UPLOAD_DIR = path_1.default.resolve(__dirname, '..', '..', 'uploads', 'blog');
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
async function ensureUploadDirs() {
    await promises_1.default.mkdir(path_1.default.join(UPLOAD_DIR, 'original'), { recursive: true });
    await promises_1.default.mkdir(path_1.default.join(UPLOAD_DIR, 'thumbnails'), { recursive: true });
    await promises_1.default.mkdir(path_1.default.join(UPLOAD_DIR, 'webp'), { recursive: true });
}
function slugify(name) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80) || 'image';
}
async function uniqueStorageKey(slug, ext) {
    let candidate = `${slug}${ext}`;
    let counter = 0;
    while (true) {
        const filePath = path_1.default.join(UPLOAD_DIR, 'original', candidate);
        try {
            await promises_1.default.access(filePath);
            // File exists, try next suffix
            counter++;
            candidate = `${slug}_${counter}${ext}`;
        }
        catch {
            // File doesn't exist, we can use this name
            return candidate;
        }
    }
}
function generateStorageKey(originalName) {
    const ext = path_1.default.extname(originalName).toLowerCase();
    const base = path_1.default.basename(originalName, ext);
    const slug = slugify(base);
    return uniqueStorageKey(slug, ext);
}
async function uploadMedia(file, uploadedBy) {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
        throw new Error(`Unsupported file type: ${file.mimetype}`);
    }
    await ensureUploadDirs();
    const storageKey = await generateStorageKey(file.originalname);
    const baseName = storageKey.replace(/\.[^.]+$/, '');
    const thumbnailKey = `thumb-${baseName}.jpg`;
    const webpKey = `${baseName}.webp`;
    let width;
    let height;
    let processedBuffer;
    if (file.mimetype === 'image/svg+xml') {
        // Sanitize SVG to strip scripts, event handlers, and foreign objects
        const window = new jsdom_1.JSDOM('').window;
        const purify = (0, dompurify_1.default)(window);
        const cleanSvg = purify.sanitize(file.buffer.toString('utf-8'), {
            USE_PROFILES: { svg: true, svgFilters: true },
            ADD_TAGS: ['use'],
            FORBID_TAGS: ['script', 'foreignObject'],
            FORBID_ATTR: ['onload', 'onerror', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
        });
        processedBuffer = Buffer.from(cleanSvg, 'utf-8');
        width = 0;
        height = 0;
        await promises_1.default.writeFile(path_1.default.join(UPLOAD_DIR, 'original', storageKey), processedBuffer);
        // No thumbnail/webp for SVGs
        await promises_1.default.writeFile(path_1.default.join(UPLOAD_DIR, 'thumbnails', thumbnailKey), processedBuffer);
        await promises_1.default.writeFile(path_1.default.join(UPLOAD_DIR, 'webp', webpKey), processedBuffer);
    }
    else {
        // Process with Sharp
        const image = (0, sharp_1.default)(file.buffer);
        const metadata = await image.metadata();
        width = metadata.width || 0;
        height = metadata.height || 0;
        // Strip EXIF and resize if too wide
        const originalPipeline = (0, sharp_1.default)(file.buffer).rotate(); // auto-rotate based on EXIF
        if (width > MAX_WIDTH) {
            originalPipeline.resize(MAX_WIDTH, undefined, { withoutEnlargement: true });
            const resizedMeta = await originalPipeline.clone().metadata();
            width = resizedMeta.width || MAX_WIDTH;
            height = resizedMeta.height || height;
        }
        processedBuffer = await originalPipeline.toBuffer();
        await promises_1.default.writeFile(path_1.default.join(UPLOAD_DIR, 'original', storageKey), processedBuffer);
        // Thumbnail (400x300 cover crop)
        const thumbnailBuffer = await (0, sharp_1.default)(file.buffer)
            .resize(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT, { fit: 'cover' })
            .jpeg({ quality: 80 })
            .toBuffer();
        await promises_1.default.writeFile(path_1.default.join(UPLOAD_DIR, 'thumbnails', thumbnailKey), thumbnailBuffer);
        // WebP variant
        const webpBuffer = await (0, sharp_1.default)(processedBuffer)
            .webp({ quality: WEBP_QUALITY })
            .toBuffer();
        await promises_1.default.writeFile(path_1.default.join(UPLOAD_DIR, 'webp', webpKey), webpBuffer);
    }
    // Insert database record
    const result = await index_js_1.pool.query(`INSERT INTO blog_media (
      filename, storage_key, mime_type, file_size_bytes,
      width, height, thumbnail_key, webp_key, uploaded_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *`, [
        file.originalname,
        storageKey,
        file.mimetype,
        processedBuffer.length,
        width || null,
        height || null,
        thumbnailKey,
        webpKey,
        uploadedBy,
    ]);
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
async function deleteMedia(mediaId) {
    const result = await index_js_1.pool.query('DELETE FROM blog_media WHERE id = $1 RETURNING storage_key, thumbnail_key, webp_key', [mediaId]);
    if (result.rows.length === 0)
        return false;
    const { storage_key, thumbnail_key, webp_key } = result.rows[0];
    // Delete files (ignore errors for missing files)
    const deleteFile = async (dir, key) => {
        if (!key)
            return;
        try {
            await promises_1.default.unlink(path_1.default.join(UPLOAD_DIR, dir, key));
        }
        catch {
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
async function listMedia(page = 1, limit = 24) {
    const offset = (page - 1) * limit;
    const [mediaResult, countResult] = await Promise.all([
        index_js_1.pool.query(`SELECT * FROM blog_media ORDER BY created_at DESC LIMIT $1 OFFSET $2`, [limit, offset]),
        index_js_1.pool.query('SELECT COUNT(*)::int AS total FROM blog_media'),
    ]);
    const media = mediaResult.rows.map((m) => ({
        ...m,
        url: `/uploads/blog/original/${m.storage_key}`,
        thumbnailUrl: m.thumbnail_key ? `/uploads/blog/thumbnails/${m.thumbnail_key}` : `/uploads/blog/original/${m.storage_key}`,
    }));
    return {
        media,
        total: countResult.rows[0].total,
    };
}
async function updateMediaAltText(mediaId, altText) {
    const result = await index_js_1.pool.query('UPDATE blog_media SET alt_text = $1 WHERE id = $2 RETURNING *', [altText, mediaId]);
    return result.rows[0] || null;
}
async function renameMedia(mediaId, newName) {
    const existing = await index_js_1.pool.query('SELECT * FROM blog_media WHERE id = $1', [mediaId]);
    if (existing.rows.length === 0)
        return null;
    const media = existing.rows[0];
    const oldExt = path_1.default.extname(media.storage_key).toLowerCase();
    const newSlug = slugify(newName);
    if (!newSlug)
        throw new Error('Invalid name');
    await ensureUploadDirs();
    const newStorageKey = await uniqueStorageKey(newSlug, oldExt);
    const baseName = newStorageKey.replace(/\.[^.]+$/, '');
    const newThumbnailKey = `thumb-${baseName}.jpg`;
    const newWebpKey = `${baseName}.webp`;
    const newFilename = `${newName}${oldExt}`;
    // Rename files on disk
    const renameFile = async (dir, oldKey, newKey) => {
        if (!oldKey)
            return;
        const oldPath = path_1.default.join(UPLOAD_DIR, dir, oldKey);
        const newPath = path_1.default.join(UPLOAD_DIR, dir, newKey);
        try {
            await promises_1.default.rename(oldPath, newPath);
        }
        catch {
            // File may not exist (e.g., SVGs without thumbnails)
        }
    };
    await Promise.all([
        renameFile('original', media.storage_key, newStorageKey),
        renameFile('thumbnails', media.thumbnail_key, newThumbnailKey),
        renameFile('webp', media.webp_key, newWebpKey),
    ]);
    const result = await index_js_1.pool.query(`UPDATE blog_media
     SET filename = $1, storage_key = $2, thumbnail_key = $3, webp_key = $4
     WHERE id = $5 RETURNING *`, [newFilename, newStorageKey, newThumbnailKey, newWebpKey, mediaId]);
    const updated = result.rows[0];
    return {
        ...updated,
        url: `/uploads/blog/original/${newStorageKey}`,
        thumbnailUrl: `/uploads/blog/thumbnails/${newThumbnailKey}`,
        webpUrl: `/uploads/blog/webp/${newWebpKey}`,
    };
}
//# sourceMappingURL=blog-media.service.js.map