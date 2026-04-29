"use strict";
/**
 * Admin CMS Routes
 *
 * Blog posts CRUD, publish/unpublish, revisions, media library,
 * stats, audit advice templates, announcements, and success stories.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminCmsRouter = void 0;
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const zod_1 = require("zod");
const admin_middleware_js_1 = require("../../middleware/admin.middleware.js");
const blog_service_js_1 = require("../../services/blog.service.js");
const blog_media_service_js_1 = require("../../services/blog-media.service.js");
const cms_service_js_1 = require("../../services/cms.service.js");
const blog_validators_js_1 = require("../../validators/blog.validators.js");
const router = (0, express_1.Router)();
exports.adminCmsRouter = router;
// Multer for media uploads — 10MB limit, memory storage
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
});
// ── Posts ──
// GET /api/admin/cms/posts
router.get('/posts', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        const status = req.query.status;
        const category = req.query.category;
        const search = req.query.search;
        const result = await (0, blog_service_js_1.listPosts)({ status, category, search, page, limit });
        res.json({
            posts: result.posts,
            pagination: { page, limit, total: result.total, pages: Math.ceil(result.total / limit) },
        });
    }
    catch (error) {
        console.error('List posts error:', error);
        res.status(500).json({ error: 'Failed to list posts', code: 'LIST_POSTS_ERROR' });
    }
});
// GET /api/admin/cms/posts/:id
router.get('/posts/:id', async (req, res) => {
    try {
        const post = await (0, blog_service_js_1.getPostById)(req.params.id);
        if (!post) {
            res.status(404).json({ error: 'Post not found', code: 'POST_NOT_FOUND' });
            return;
        }
        res.json({ post });
    }
    catch (error) {
        console.error('Get post error:', error);
        res.status(500).json({ error: 'Failed to get post', code: 'GET_POST_ERROR' });
    }
});
// POST /api/admin/cms/posts
router.post('/posts', async (req, res) => {
    try {
        const input = blog_validators_js_1.CreatePostSchema.parse(req.body);
        const authorName = `${req.admin.first_name} ${req.admin.last_name}`.trim();
        const post = await (0, blog_service_js_1.createPost)(input, req.admin.id, authorName);
        await (0, admin_middleware_js_1.logAdminActivity)(req.admin.id, 'create_post', 'blog_post', post.id, { title: post.title }, req);
        res.status(201).json({ post });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: 'Validation failed', details: error.errors });
            return;
        }
        console.error('Create post error:', error);
        res.status(500).json({ error: 'Failed to create post', code: 'CREATE_POST_ERROR' });
    }
});
// PUT /api/admin/cms/posts/:id
router.put('/posts/:id', async (req, res) => {
    try {
        const input = blog_validators_js_1.UpdatePostSchema.parse(req.body);
        const revisionNote = req.body.revision_note;
        const post = await (0, blog_service_js_1.updatePost)(req.params.id, input, req.admin.id, revisionNote);
        if (!post) {
            res.status(404).json({ error: 'Post not found', code: 'POST_NOT_FOUND' });
            return;
        }
        res.json({ post });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: 'Validation failed', details: error.errors });
            return;
        }
        console.error('Update post error:', error);
        res.status(500).json({ error: 'Failed to update post', code: 'UPDATE_POST_ERROR' });
    }
});
// DELETE /api/admin/cms/posts/:id (soft delete → archived)
router.delete('/posts/:id', async (req, res) => {
    try {
        const success = await (0, blog_service_js_1.deletePost)(req.params.id);
        if (!success) {
            res.status(404).json({ error: 'Post not found', code: 'POST_NOT_FOUND' });
            return;
        }
        await (0, admin_middleware_js_1.logAdminActivity)(req.admin.id, 'archive_post', 'blog_post', req.params.id, {}, req);
        res.json({ success: true });
    }
    catch (error) {
        console.error('Delete post error:', error);
        res.status(500).json({ error: 'Failed to delete post', code: 'DELETE_POST_ERROR' });
    }
});
// POST /api/admin/cms/posts/:id/publish
router.post('/posts/:id/publish', async (req, res) => {
    try {
        const post = await (0, blog_service_js_1.publishPost)(req.params.id);
        if (!post) {
            res.status(404).json({ error: 'Post not found', code: 'POST_NOT_FOUND' });
            return;
        }
        await (0, admin_middleware_js_1.logAdminActivity)(req.admin.id, 'publish_post', 'blog_post', post.id, { title: post.title }, req);
        res.json({ post });
    }
    catch (error) {
        console.error('Publish post error:', error);
        res.status(500).json({ error: 'Failed to publish post', code: 'PUBLISH_POST_ERROR' });
    }
});
// POST /api/admin/cms/posts/:id/unpublish
router.post('/posts/:id/unpublish', async (req, res) => {
    try {
        const post = await (0, blog_service_js_1.unpublishPost)(req.params.id);
        if (!post) {
            res.status(404).json({ error: 'Post not found', code: 'POST_NOT_FOUND' });
            return;
        }
        await (0, admin_middleware_js_1.logAdminActivity)(req.admin.id, 'unpublish_post', 'blog_post', post.id, { title: post.title }, req);
        res.json({ post });
    }
    catch (error) {
        console.error('Unpublish post error:', error);
        res.status(500).json({ error: 'Failed to unpublish post', code: 'UNPUBLISH_POST_ERROR' });
    }
});
// ── Revisions ──
// GET /api/admin/cms/posts/:id/revisions
router.get('/posts/:id/revisions', async (req, res) => {
    try {
        const revisions = await (0, blog_service_js_1.listRevisions)(req.params.id);
        res.json({ revisions });
    }
    catch (error) {
        console.error('List revisions error:', error);
        res.status(500).json({ error: 'Failed to list revisions', code: 'LIST_REVISIONS_ERROR' });
    }
});
// POST /api/admin/cms/posts/:id/revisions/:revId/restore
router.post('/posts/:id/revisions/:revId/restore', async (req, res) => {
    try {
        const post = await (0, blog_service_js_1.restoreRevision)(req.params.id, req.params.revId, req.admin.id);
        if (!post) {
            res.status(404).json({ error: 'Revision not found', code: 'REVISION_NOT_FOUND' });
            return;
        }
        await (0, admin_middleware_js_1.logAdminActivity)(req.admin.id, 'restore_revision', 'blog_post', post.id, { revisionId: req.params.revId }, req);
        res.json({ post });
    }
    catch (error) {
        console.error('Restore revision error:', error);
        res.status(500).json({ error: 'Failed to restore revision', code: 'RESTORE_REVISION_ERROR' });
    }
});
// ── Media ──
// GET /api/admin/cms/media
router.get('/media', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 24, 100);
        const result = await (0, blog_media_service_js_1.listMedia)(page, limit);
        res.json({
            media: result.media,
            pagination: { page, limit, total: result.total, pages: Math.ceil(result.total / limit) },
        });
    }
    catch (error) {
        console.error('List media error:', error);
        res.status(500).json({ error: 'Failed to list media', code: 'LIST_MEDIA_ERROR' });
    }
});
// POST /api/admin/cms/media (multipart upload)
router.post('/media', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No file provided', code: 'NO_FILE' });
            return;
        }
        const result = await (0, blog_media_service_js_1.uploadMedia)(req.file, req.admin.id);
        await (0, admin_middleware_js_1.logAdminActivity)(req.admin.id, 'upload_media', 'blog_media', result.id, { filename: req.file.originalname }, req);
        res.status(201).json(result);
    }
    catch (error) {
        if (error instanceof Error && error.message.includes('Unsupported file type')) {
            res.status(400).json({ error: error.message, code: 'UNSUPPORTED_FILE_TYPE' });
            return;
        }
        console.error('Upload media error:', error);
        res.status(500).json({ error: 'Failed to upload media', code: 'UPLOAD_MEDIA_ERROR' });
    }
});
// DELETE /api/admin/cms/media/:id
router.delete('/media/:id', async (req, res) => {
    try {
        const success = await (0, blog_media_service_js_1.deleteMedia)(req.params.id);
        if (!success) {
            res.status(404).json({ error: 'Media not found', code: 'MEDIA_NOT_FOUND' });
            return;
        }
        await (0, admin_middleware_js_1.logAdminActivity)(req.admin.id, 'delete_media', 'blog_media', req.params.id, {}, req);
        res.json({ success: true });
    }
    catch (error) {
        console.error('Delete media error:', error);
        res.status(500).json({ error: 'Failed to delete media', code: 'DELETE_MEDIA_ERROR' });
    }
});
// PATCH /api/admin/cms/media/:id (update alt text)
router.patch('/media/:id', async (req, res) => {
    try {
        const { alt_text } = zod_1.z.object({ alt_text: zod_1.z.string().max(300) }).parse(req.body);
        const media = await (0, blog_media_service_js_1.updateMediaAltText)(req.params.id, alt_text);
        if (!media) {
            res.status(404).json({ error: 'Media not found', code: 'MEDIA_NOT_FOUND' });
            return;
        }
        res.json({ media });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: 'Validation failed', details: error.errors });
            return;
        }
        console.error('Update media error:', error);
        res.status(500).json({ error: 'Failed to update media', code: 'UPDATE_MEDIA_ERROR' });
    }
});
// PUT /api/admin/cms/media/:id/rename
router.put('/media/:id/rename', async (req, res) => {
    try {
        const { name } = zod_1.z.object({ name: zod_1.z.string().min(1).max(200) }).parse(req.body);
        const media = await (0, blog_media_service_js_1.renameMedia)(req.params.id, name);
        if (!media) {
            res.status(404).json({ error: 'Media not found', code: 'MEDIA_NOT_FOUND' });
            return;
        }
        await (0, admin_middleware_js_1.logAdminActivity)(req.admin.id, 'rename_media', 'blog_media', req.params.id, { name }, req);
        res.json({ media });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: 'Validation failed', details: error.errors });
            return;
        }
        console.error('Rename media error:', error);
        res.status(500).json({ error: 'Failed to rename media', code: 'RENAME_MEDIA_ERROR' });
    }
});
// ── Stats ──
// GET /api/admin/cms/stats
router.get('/stats', async (_req, res) => {
    try {
        const stats = await (0, blog_service_js_1.getCmsStats)();
        res.json(stats);
    }
    catch (error) {
        console.error('CMS stats error:', error);
        res.status(500).json({ error: 'Failed to get stats', code: 'CMS_STATS_ERROR' });
    }
});
// ── Audit Advice Templates ──
// GET /api/admin/cms/advice
router.get('/advice', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 50, 200);
        const category = req.query.category;
        const search = req.query.search;
        const result = await (0, cms_service_js_1.listAdvice)({ category, search, page, limit });
        res.json({
            advice: result.advice,
            pagination: { page, limit, total: result.total, pages: Math.ceil(result.total / limit) },
        });
    }
    catch (error) {
        console.error('List advice error:', error);
        res.status(500).json({ error: 'Failed to list advice', code: 'LIST_ADVICE_ERROR' });
    }
});
// GET /api/admin/cms/advice/:ruleId
router.get('/advice/:ruleId', async (req, res) => {
    try {
        const advice = await (0, cms_service_js_1.getAdviceByRuleId)(req.params.ruleId);
        if (!advice) {
            res.status(404).json({ error: 'Advice not found', code: 'ADVICE_NOT_FOUND' });
            return;
        }
        res.json({ advice });
    }
    catch (error) {
        console.error('Get advice error:', error);
        res.status(500).json({ error: 'Failed to get advice', code: 'GET_ADVICE_ERROR' });
    }
});
// PUT /api/admin/cms/advice/:ruleId (upsert — create or update custom advice)
router.put('/advice/:ruleId', async (req, res) => {
    try {
        const schema = zod_1.z.object({
            rule_name: zod_1.z.string().min(1).max(200),
            category: zod_1.z.string().min(1).max(30),
            severity: zod_1.z.string().min(1).max(20),
            description: zod_1.z.string().min(1),
            recommendation: zod_1.z.string().min(1),
            learn_more_url: zod_1.z.string().max(500).nullable().optional(),
        });
        const input = schema.parse(req.body);
        const advice = await (0, cms_service_js_1.upsertAdvice)({ ...input, rule_id: req.params.ruleId }, req.admin.id);
        await (0, admin_middleware_js_1.logAdminActivity)(req.admin.id, 'upsert_advice', 'audit_advice_template', advice.id, { rule_id: req.params.ruleId }, req);
        res.json({ advice });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: 'Validation failed', details: error.errors });
            return;
        }
        console.error('Upsert advice error:', error);
        res.status(500).json({ error: 'Failed to save advice', code: 'UPSERT_ADVICE_ERROR' });
    }
});
// DELETE /api/admin/cms/advice/:ruleId (revert to engine default)
router.delete('/advice/:ruleId', async (req, res) => {
    try {
        const success = await (0, cms_service_js_1.deleteAdvice)(req.params.ruleId);
        if (!success) {
            res.status(404).json({ error: 'Advice not found', code: 'ADVICE_NOT_FOUND' });
            return;
        }
        await (0, admin_middleware_js_1.logAdminActivity)(req.admin.id, 'delete_advice', 'audit_advice_template', req.params.ruleId, {}, req);
        res.json({ success: true });
    }
    catch (error) {
        console.error('Delete advice error:', error);
        res.status(500).json({ error: 'Failed to delete advice', code: 'DELETE_ADVICE_ERROR' });
    }
});
// ── Announcements ──
// GET /api/admin/cms/announcements
router.get('/announcements', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        const active = req.query.active === 'true' ? true : req.query.active === 'false' ? false : undefined;
        const result = await (0, cms_service_js_1.listAnnouncements)({ active, page, limit });
        res.json({
            announcements: result.announcements,
            pagination: { page, limit, total: result.total, pages: Math.ceil(result.total / limit) },
        });
    }
    catch (error) {
        console.error('List announcements error:', error);
        res.status(500).json({ error: 'Failed to list announcements', code: 'LIST_ANNOUNCEMENTS_ERROR' });
    }
});
// POST /api/admin/cms/announcements
router.post('/announcements', async (req, res) => {
    try {
        const schema = zod_1.z.object({
            title: zod_1.z.string().min(1).max(200),
            body: zod_1.z.string().min(1),
            type: zod_1.z.enum(['info', 'success', 'warning', 'maintenance']).optional(),
            target_tiers: zod_1.z.array(zod_1.z.string()).nullable().optional(),
            cta_label: zod_1.z.string().max(50).nullable().optional(),
            cta_url: zod_1.z.string().max(500).nullable().optional(),
            starts_at: zod_1.z.string().optional(),
            ends_at: zod_1.z.string().nullable().optional(),
            is_dismissible: zod_1.z.boolean().optional(),
        });
        const input = schema.parse(req.body);
        const announcement = await (0, cms_service_js_1.createAnnouncement)(input, req.admin.id);
        await (0, admin_middleware_js_1.logAdminActivity)(req.admin.id, 'create_announcement', 'announcement', announcement.id, { title: announcement.title }, req);
        res.status(201).json({ announcement });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: 'Validation failed', details: error.errors });
            return;
        }
        console.error('Create announcement error:', error);
        res.status(500).json({ error: 'Failed to create announcement', code: 'CREATE_ANNOUNCEMENT_ERROR' });
    }
});
// PUT /api/admin/cms/announcements/:id
router.put('/announcements/:id', async (req, res) => {
    try {
        const schema = zod_1.z.object({
            title: zod_1.z.string().min(1).max(200).optional(),
            body: zod_1.z.string().min(1).optional(),
            type: zod_1.z.enum(['info', 'success', 'warning', 'maintenance']).optional(),
            target_tiers: zod_1.z.array(zod_1.z.string()).nullable().optional(),
            cta_label: zod_1.z.string().max(50).nullable().optional(),
            cta_url: zod_1.z.string().max(500).nullable().optional(),
            starts_at: zod_1.z.string().optional(),
            ends_at: zod_1.z.string().nullable().optional(),
            is_dismissible: zod_1.z.boolean().optional(),
            is_active: zod_1.z.boolean().optional(),
        });
        const input = schema.parse(req.body);
        const announcement = await (0, cms_service_js_1.updateAnnouncement)(req.params.id, input);
        if (!announcement) {
            res.status(404).json({ error: 'Announcement not found', code: 'ANNOUNCEMENT_NOT_FOUND' });
            return;
        }
        await (0, admin_middleware_js_1.logAdminActivity)(req.admin.id, 'update_announcement', 'announcement', announcement.id, { title: announcement.title }, req);
        res.json({ announcement });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: 'Validation failed', details: error.errors });
            return;
        }
        console.error('Update announcement error:', error);
        res.status(500).json({ error: 'Failed to update announcement', code: 'UPDATE_ANNOUNCEMENT_ERROR' });
    }
});
// DELETE /api/admin/cms/announcements/:id
router.delete('/announcements/:id', async (req, res) => {
    try {
        const success = await (0, cms_service_js_1.deleteAnnouncement)(req.params.id);
        if (!success) {
            res.status(404).json({ error: 'Announcement not found', code: 'ANNOUNCEMENT_NOT_FOUND' });
            return;
        }
        await (0, admin_middleware_js_1.logAdminActivity)(req.admin.id, 'delete_announcement', 'announcement', req.params.id, {}, req);
        res.json({ success: true });
    }
    catch (error) {
        console.error('Delete announcement error:', error);
        res.status(500).json({ error: 'Failed to delete announcement', code: 'DELETE_ANNOUNCEMENT_ERROR' });
    }
});
// ── Success Stories ──
// GET /api/admin/cms/stories
router.get('/stories', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        const result = await (0, cms_service_js_1.listSuccessStories)({ page, limit });
        res.json({
            stories: result.stories,
            pagination: { page, limit, total: result.total, pages: Math.ceil(result.total / limit) },
        });
    }
    catch (error) {
        console.error('List stories error:', error);
        res.status(500).json({ error: 'Failed to list stories', code: 'LIST_STORIES_ERROR' });
    }
});
// POST /api/admin/cms/stories
router.post('/stories', async (req, res) => {
    try {
        const schema = zod_1.z.object({
            site_id: zod_1.z.string().uuid().nullable().optional(),
            domain: zod_1.z.string().min(1).max(255),
            category: zod_1.z.string().min(1).max(30),
            score_before: zod_1.z.number().int().min(0).max(100),
            score_after: zod_1.z.number().int().min(0).max(100),
            headline: zod_1.z.string().min(1).max(200),
            is_published: zod_1.z.boolean().optional(),
            display_order: zod_1.z.number().int().optional(),
        });
        const input = schema.parse(req.body);
        const story = await (0, cms_service_js_1.createSuccessStory)(input, req.admin.id);
        await (0, admin_middleware_js_1.logAdminActivity)(req.admin.id, 'create_story', 'success_story', story.id, { headline: story.headline }, req);
        res.status(201).json({ story });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: 'Validation failed', details: error.errors });
            return;
        }
        console.error('Create story error:', error);
        res.status(500).json({ error: 'Failed to create story', code: 'CREATE_STORY_ERROR' });
    }
});
// PUT /api/admin/cms/stories/:id
router.put('/stories/:id', async (req, res) => {
    try {
        const schema = zod_1.z.object({
            domain: zod_1.z.string().min(1).max(255).optional(),
            category: zod_1.z.string().min(1).max(30).optional(),
            score_before: zod_1.z.number().int().min(0).max(100).optional(),
            score_after: zod_1.z.number().int().min(0).max(100).optional(),
            headline: zod_1.z.string().min(1).max(200).optional(),
            is_published: zod_1.z.boolean().optional(),
            display_order: zod_1.z.number().int().optional(),
        });
        const input = schema.parse(req.body);
        const story = await (0, cms_service_js_1.updateSuccessStory)(req.params.id, input);
        if (!story) {
            res.status(404).json({ error: 'Story not found', code: 'STORY_NOT_FOUND' });
            return;
        }
        await (0, admin_middleware_js_1.logAdminActivity)(req.admin.id, 'update_story', 'success_story', story.id, { headline: story.headline }, req);
        res.json({ story });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: 'Validation failed', details: error.errors });
            return;
        }
        console.error('Update story error:', error);
        res.status(500).json({ error: 'Failed to update story', code: 'UPDATE_STORY_ERROR' });
    }
});
// DELETE /api/admin/cms/stories/:id
router.delete('/stories/:id', async (req, res) => {
    try {
        const success = await (0, cms_service_js_1.deleteSuccessStory)(req.params.id);
        if (!success) {
            res.status(404).json({ error: 'Story not found', code: 'STORY_NOT_FOUND' });
            return;
        }
        await (0, admin_middleware_js_1.logAdminActivity)(req.admin.id, 'delete_story', 'success_story', req.params.id, {}, req);
        res.json({ success: true });
    }
    catch (error) {
        console.error('Delete story error:', error);
        res.status(500).json({ error: 'Failed to delete story', code: 'DELETE_STORY_ERROR' });
    }
});
// ═══════════════════════════════════════
// ── Blog Redirects ──
// ═══════════════════════════════════════
// GET /api/admin/cms/redirects
router.get('/redirects', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 50, 100);
        const search = req.query.search || undefined;
        const result = await (0, blog_service_js_1.listRedirects)({ search, page, limit });
        res.json({
            redirects: result.redirects,
            total: result.total,
            page,
            totalPages: Math.ceil(result.total / limit),
        });
    }
    catch (error) {
        console.error('List redirects error:', error);
        res.status(500).json({ error: 'Failed to load redirects', code: 'LIST_REDIRECTS_ERROR' });
    }
});
// POST /api/admin/cms/redirects
router.post('/redirects', async (req, res) => {
    try {
        const { post_id, old_slug } = req.body;
        if (!post_id || !old_slug) {
            res.status(400).json({ error: 'post_id and old_slug are required' });
            return;
        }
        const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
        if (!slugPattern.test(old_slug)) {
            res.status(400).json({ error: 'Slug must be lowercase alphanumeric with hyphens' });
            return;
        }
        const redirect = await (0, blog_service_js_1.createRedirect)(post_id, old_slug);
        if (!redirect) {
            res.status(400).json({ error: 'Cannot create redirect. The slug may conflict with an existing post or match the current slug.' });
            return;
        }
        await (0, admin_middleware_js_1.logAdminActivity)(req.admin.id, 'create_redirect', 'blog_redirect', redirect.id, { old_slug, post_id }, req);
        res.status(201).json({ redirect });
    }
    catch (error) {
        console.error('Create redirect error:', error);
        res.status(500).json({ error: 'Failed to create redirect', code: 'CREATE_REDIRECT_ERROR' });
    }
});
// DELETE /api/admin/cms/redirects/:id
router.delete('/redirects/:id', async (req, res) => {
    try {
        const deleted = await (0, blog_service_js_1.deleteRedirect)(req.params.id);
        if (!deleted) {
            res.status(404).json({ error: 'Redirect not found' });
            return;
        }
        await (0, admin_middleware_js_1.logAdminActivity)(req.admin.id, 'delete_redirect', 'blog_redirect', req.params.id, {}, req);
        res.json({ success: true });
    }
    catch (error) {
        console.error('Delete redirect error:', error);
        res.status(500).json({ error: 'Failed to delete redirect', code: 'DELETE_REDIRECT_ERROR' });
    }
});
//# sourceMappingURL=cms.js.map