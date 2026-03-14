/**
 * Admin CMS Routes
 *
 * Blog posts CRUD, publish/unpublish, revisions, media library,
 * stats, audit advice templates, announcements, and success stories.
 */

import { Router } from 'express';
import type { Response } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { logAdminActivity, type AdminRequest } from '../../middleware/admin.middleware.js';
import {
  listPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  publishPost,
  unpublishPost,
  listRevisions,
  restoreRevision,
  getCmsStats,
} from '../../services/blog.service.js';
import {
  uploadMedia,
  deleteMedia,
  listMedia,
  updateMediaAltText,
} from '../../services/blog-media.service.js';
import {
  listAdvice,
  getAdviceByRuleId,
  upsertAdvice,
  updateAdvice,
  deleteAdvice,
  listAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  listSuccessStories,
  getSuccessStoryById,
  createSuccessStory,
  updateSuccessStory,
  deleteSuccessStory,
} from '../../services/cms.service.js';
import { CreatePostSchema, UpdatePostSchema } from '../../validators/blog.validators.js';
import type { PostCategory, PostStatus } from '../../types/blog.types.js';

const router = Router();

// Multer for media uploads — 10MB limit, memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// ── Posts ──

// GET /api/admin/cms/posts
router.get('/posts', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const status = req.query.status as PostStatus | undefined;
    const category = req.query.category as PostCategory | undefined;
    const search = req.query.search as string | undefined;

    const result = await listPosts({ status, category, search, page, limit });

    res.json({
      posts: result.posts,
      pagination: { page, limit, total: result.total, pages: Math.ceil(result.total / limit) },
    });
  } catch (error) {
    console.error('List posts error:', error);
    res.status(500).json({ error: 'Failed to list posts', code: 'LIST_POSTS_ERROR' });
  }
});

// GET /api/admin/cms/posts/:id
router.get('/posts/:id', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const post = await getPostById(req.params.id);
    if (!post) {
      res.status(404).json({ error: 'Post not found', code: 'POST_NOT_FOUND' });
      return;
    }
    res.json({ post });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ error: 'Failed to get post', code: 'GET_POST_ERROR' });
  }
});

// POST /api/admin/cms/posts
router.post('/posts', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const input = CreatePostSchema.parse(req.body);
    const authorName = `${req.admin!.first_name} ${req.admin!.last_name}`.trim();
    const post = await createPost(input, req.admin!.id, authorName);

    await logAdminActivity(req.admin!.id, 'create_post', 'blog_post', post.id, { title: post.title }, req);

    res.status(201).json({ post });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
      return;
    }
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Failed to create post', code: 'CREATE_POST_ERROR' });
  }
});

// PUT /api/admin/cms/posts/:id
router.put('/posts/:id', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const input = UpdatePostSchema.parse(req.body);
    const revisionNote = req.body.revision_note as string | undefined;
    const post = await updatePost(req.params.id, input, req.admin!.id, revisionNote);

    if (!post) {
      res.status(404).json({ error: 'Post not found', code: 'POST_NOT_FOUND' });
      return;
    }

    res.json({ post });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
      return;
    }
    console.error('Update post error:', error);
    res.status(500).json({ error: 'Failed to update post', code: 'UPDATE_POST_ERROR' });
  }
});

// DELETE /api/admin/cms/posts/:id (soft delete → archived)
router.delete('/posts/:id', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const success = await deletePost(req.params.id);
    if (!success) {
      res.status(404).json({ error: 'Post not found', code: 'POST_NOT_FOUND' });
      return;
    }

    await logAdminActivity(req.admin!.id, 'archive_post', 'blog_post', req.params.id, {}, req);

    res.json({ success: true });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ error: 'Failed to delete post', code: 'DELETE_POST_ERROR' });
  }
});

// POST /api/admin/cms/posts/:id/publish
router.post('/posts/:id/publish', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const post = await publishPost(req.params.id);
    if (!post) {
      res.status(404).json({ error: 'Post not found', code: 'POST_NOT_FOUND' });
      return;
    }

    await logAdminActivity(req.admin!.id, 'publish_post', 'blog_post', post.id, { title: post.title }, req);

    res.json({ post });
  } catch (error) {
    console.error('Publish post error:', error);
    res.status(500).json({ error: 'Failed to publish post', code: 'PUBLISH_POST_ERROR' });
  }
});

// POST /api/admin/cms/posts/:id/unpublish
router.post('/posts/:id/unpublish', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const post = await unpublishPost(req.params.id);
    if (!post) {
      res.status(404).json({ error: 'Post not found', code: 'POST_NOT_FOUND' });
      return;
    }

    await logAdminActivity(req.admin!.id, 'unpublish_post', 'blog_post', post.id, { title: post.title }, req);

    res.json({ post });
  } catch (error) {
    console.error('Unpublish post error:', error);
    res.status(500).json({ error: 'Failed to unpublish post', code: 'UNPUBLISH_POST_ERROR' });
  }
});

// ── Revisions ──

// GET /api/admin/cms/posts/:id/revisions
router.get('/posts/:id/revisions', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const revisions = await listRevisions(req.params.id);
    res.json({ revisions });
  } catch (error) {
    console.error('List revisions error:', error);
    res.status(500).json({ error: 'Failed to list revisions', code: 'LIST_REVISIONS_ERROR' });
  }
});

// POST /api/admin/cms/posts/:id/revisions/:revId/restore
router.post('/posts/:id/revisions/:revId/restore', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const post = await restoreRevision(req.params.id, req.params.revId, req.admin!.id);
    if (!post) {
      res.status(404).json({ error: 'Revision not found', code: 'REVISION_NOT_FOUND' });
      return;
    }

    await logAdminActivity(req.admin!.id, 'restore_revision', 'blog_post', post.id, { revisionId: req.params.revId }, req);

    res.json({ post });
  } catch (error) {
    console.error('Restore revision error:', error);
    res.status(500).json({ error: 'Failed to restore revision', code: 'RESTORE_REVISION_ERROR' });
  }
});

// ── Media ──

// GET /api/admin/cms/media
router.get('/media', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 24, 100);

    const result = await listMedia(page, limit);

    res.json({
      media: result.media,
      pagination: { page, limit, total: result.total, pages: Math.ceil(result.total / limit) },
    });
  } catch (error) {
    console.error('List media error:', error);
    res.status(500).json({ error: 'Failed to list media', code: 'LIST_MEDIA_ERROR' });
  }
});

// POST /api/admin/cms/media (multipart upload)
router.post('/media', upload.single('file'), async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file provided', code: 'NO_FILE' });
      return;
    }

    const result = await uploadMedia(req.file, req.admin!.id);

    await logAdminActivity(req.admin!.id, 'upload_media', 'blog_media', result.id, { filename: req.file.originalname }, req);

    res.status(201).json(result);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unsupported file type')) {
      res.status(400).json({ error: error.message, code: 'UNSUPPORTED_FILE_TYPE' });
      return;
    }
    console.error('Upload media error:', error);
    res.status(500).json({ error: 'Failed to upload media', code: 'UPLOAD_MEDIA_ERROR' });
  }
});

// DELETE /api/admin/cms/media/:id
router.delete('/media/:id', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const success = await deleteMedia(req.params.id);
    if (!success) {
      res.status(404).json({ error: 'Media not found', code: 'MEDIA_NOT_FOUND' });
      return;
    }

    await logAdminActivity(req.admin!.id, 'delete_media', 'blog_media', req.params.id, {}, req);

    res.json({ success: true });
  } catch (error) {
    console.error('Delete media error:', error);
    res.status(500).json({ error: 'Failed to delete media', code: 'DELETE_MEDIA_ERROR' });
  }
});

// PATCH /api/admin/cms/media/:id (update alt text)
router.patch('/media/:id', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { alt_text } = z.object({ alt_text: z.string().max(300) }).parse(req.body);
    const media = await updateMediaAltText(req.params.id, alt_text);

    if (!media) {
      res.status(404).json({ error: 'Media not found', code: 'MEDIA_NOT_FOUND' });
      return;
    }

    res.json({ media });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
      return;
    }
    console.error('Update media error:', error);
    res.status(500).json({ error: 'Failed to update media', code: 'UPDATE_MEDIA_ERROR' });
  }
});

// ── Stats ──

// GET /api/admin/cms/stats
router.get('/stats', async (_req: AdminRequest, res: Response): Promise<void> => {
  try {
    const stats = await getCmsStats();
    res.json(stats);
  } catch (error) {
    console.error('CMS stats error:', error);
    res.status(500).json({ error: 'Failed to get stats', code: 'CMS_STATS_ERROR' });
  }
});

// ── Audit Advice Templates ──

// GET /api/admin/cms/advice
router.get('/advice', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const category = req.query.category as string | undefined;
    const search = req.query.search as string | undefined;

    const result = await listAdvice({ category, search, page, limit });

    res.json({
      advice: result.advice,
      pagination: { page, limit, total: result.total, pages: Math.ceil(result.total / limit) },
    });
  } catch (error) {
    console.error('List advice error:', error);
    res.status(500).json({ error: 'Failed to list advice', code: 'LIST_ADVICE_ERROR' });
  }
});

// GET /api/admin/cms/advice/:ruleId
router.get('/advice/:ruleId', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const advice = await getAdviceByRuleId(req.params.ruleId);
    if (!advice) {
      res.status(404).json({ error: 'Advice not found', code: 'ADVICE_NOT_FOUND' });
      return;
    }
    res.json({ advice });
  } catch (error) {
    console.error('Get advice error:', error);
    res.status(500).json({ error: 'Failed to get advice', code: 'GET_ADVICE_ERROR' });
  }
});

// PUT /api/admin/cms/advice/:ruleId (upsert — create or update custom advice)
router.put('/advice/:ruleId', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const schema = z.object({
      rule_name: z.string().min(1).max(200),
      category: z.string().min(1).max(30),
      severity: z.string().min(1).max(20),
      description: z.string().min(1),
      recommendation: z.string().min(1),
      learn_more_url: z.string().max(500).nullable().optional(),
    });
    const input = schema.parse(req.body);

    const advice = await upsertAdvice(
      { ...input, rule_id: req.params.ruleId },
      req.admin!.id
    );

    await logAdminActivity(req.admin!.id, 'upsert_advice', 'audit_advice_template', advice.id, { rule_id: req.params.ruleId }, req);

    res.json({ advice });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
      return;
    }
    console.error('Upsert advice error:', error);
    res.status(500).json({ error: 'Failed to save advice', code: 'UPSERT_ADVICE_ERROR' });
  }
});

// DELETE /api/admin/cms/advice/:ruleId (revert to engine default)
router.delete('/advice/:ruleId', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const success = await deleteAdvice(req.params.ruleId);
    if (!success) {
      res.status(404).json({ error: 'Advice not found', code: 'ADVICE_NOT_FOUND' });
      return;
    }

    await logAdminActivity(req.admin!.id, 'delete_advice', 'audit_advice_template', req.params.ruleId, {}, req);

    res.json({ success: true });
  } catch (error) {
    console.error('Delete advice error:', error);
    res.status(500).json({ error: 'Failed to delete advice', code: 'DELETE_ADVICE_ERROR' });
  }
});

// ── Announcements ──

// GET /api/admin/cms/announcements
router.get('/announcements', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const active = req.query.active === 'true' ? true : req.query.active === 'false' ? false : undefined;

    const result = await listAnnouncements({ active, page, limit });

    res.json({
      announcements: result.announcements,
      pagination: { page, limit, total: result.total, pages: Math.ceil(result.total / limit) },
    });
  } catch (error) {
    console.error('List announcements error:', error);
    res.status(500).json({ error: 'Failed to list announcements', code: 'LIST_ANNOUNCEMENTS_ERROR' });
  }
});

// POST /api/admin/cms/announcements
router.post('/announcements', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const schema = z.object({
      title: z.string().min(1).max(200),
      body: z.string().min(1),
      type: z.enum(['info', 'success', 'warning', 'maintenance']).optional(),
      target_tiers: z.array(z.string()).nullable().optional(),
      cta_label: z.string().max(50).nullable().optional(),
      cta_url: z.string().max(500).nullable().optional(),
      starts_at: z.string().optional(),
      ends_at: z.string().nullable().optional(),
      is_dismissible: z.boolean().optional(),
    });
    const input = schema.parse(req.body);

    const announcement = await createAnnouncement(input, req.admin!.id);

    await logAdminActivity(req.admin!.id, 'create_announcement', 'announcement', announcement.id, { title: announcement.title }, req);

    res.status(201).json({ announcement });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
      return;
    }
    console.error('Create announcement error:', error);
    res.status(500).json({ error: 'Failed to create announcement', code: 'CREATE_ANNOUNCEMENT_ERROR' });
  }
});

// PUT /api/admin/cms/announcements/:id
router.put('/announcements/:id', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const schema = z.object({
      title: z.string().min(1).max(200).optional(),
      body: z.string().min(1).optional(),
      type: z.enum(['info', 'success', 'warning', 'maintenance']).optional(),
      target_tiers: z.array(z.string()).nullable().optional(),
      cta_label: z.string().max(50).nullable().optional(),
      cta_url: z.string().max(500).nullable().optional(),
      starts_at: z.string().optional(),
      ends_at: z.string().nullable().optional(),
      is_dismissible: z.boolean().optional(),
      is_active: z.boolean().optional(),
    });
    const input = schema.parse(req.body);

    const announcement = await updateAnnouncement(req.params.id, input);
    if (!announcement) {
      res.status(404).json({ error: 'Announcement not found', code: 'ANNOUNCEMENT_NOT_FOUND' });
      return;
    }

    await logAdminActivity(req.admin!.id, 'update_announcement', 'announcement', announcement.id, { title: announcement.title }, req);

    res.json({ announcement });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
      return;
    }
    console.error('Update announcement error:', error);
    res.status(500).json({ error: 'Failed to update announcement', code: 'UPDATE_ANNOUNCEMENT_ERROR' });
  }
});

// DELETE /api/admin/cms/announcements/:id
router.delete('/announcements/:id', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const success = await deleteAnnouncement(req.params.id);
    if (!success) {
      res.status(404).json({ error: 'Announcement not found', code: 'ANNOUNCEMENT_NOT_FOUND' });
      return;
    }

    await logAdminActivity(req.admin!.id, 'delete_announcement', 'announcement', req.params.id, {}, req);

    res.json({ success: true });
  } catch (error) {
    console.error('Delete announcement error:', error);
    res.status(500).json({ error: 'Failed to delete announcement', code: 'DELETE_ANNOUNCEMENT_ERROR' });
  }
});

// ── Success Stories ──

// GET /api/admin/cms/stories
router.get('/stories', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    const result = await listSuccessStories({ page, limit });

    res.json({
      stories: result.stories,
      pagination: { page, limit, total: result.total, pages: Math.ceil(result.total / limit) },
    });
  } catch (error) {
    console.error('List stories error:', error);
    res.status(500).json({ error: 'Failed to list stories', code: 'LIST_STORIES_ERROR' });
  }
});

// POST /api/admin/cms/stories
router.post('/stories', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const schema = z.object({
      site_id: z.string().uuid().nullable().optional(),
      domain: z.string().min(1).max(255),
      category: z.string().min(1).max(30),
      score_before: z.number().int().min(0).max(100),
      score_after: z.number().int().min(0).max(100),
      headline: z.string().min(1).max(200),
      is_published: z.boolean().optional(),
      display_order: z.number().int().optional(),
    });
    const input = schema.parse(req.body);

    const story = await createSuccessStory(input, req.admin!.id);

    await logAdminActivity(req.admin!.id, 'create_story', 'success_story', story.id, { headline: story.headline }, req);

    res.status(201).json({ story });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
      return;
    }
    console.error('Create story error:', error);
    res.status(500).json({ error: 'Failed to create story', code: 'CREATE_STORY_ERROR' });
  }
});

// PUT /api/admin/cms/stories/:id
router.put('/stories/:id', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const schema = z.object({
      domain: z.string().min(1).max(255).optional(),
      category: z.string().min(1).max(30).optional(),
      score_before: z.number().int().min(0).max(100).optional(),
      score_after: z.number().int().min(0).max(100).optional(),
      headline: z.string().min(1).max(200).optional(),
      is_published: z.boolean().optional(),
      display_order: z.number().int().optional(),
    });
    const input = schema.parse(req.body);

    const story = await updateSuccessStory(req.params.id, input);
    if (!story) {
      res.status(404).json({ error: 'Story not found', code: 'STORY_NOT_FOUND' });
      return;
    }

    await logAdminActivity(req.admin!.id, 'update_story', 'success_story', story.id, { headline: story.headline }, req);

    res.json({ story });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
      return;
    }
    console.error('Update story error:', error);
    res.status(500).json({ error: 'Failed to update story', code: 'UPDATE_STORY_ERROR' });
  }
});

// DELETE /api/admin/cms/stories/:id
router.delete('/stories/:id', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const success = await deleteSuccessStory(req.params.id);
    if (!success) {
      res.status(404).json({ error: 'Story not found', code: 'STORY_NOT_FOUND' });
      return;
    }

    await logAdminActivity(req.admin!.id, 'delete_story', 'success_story', req.params.id, {}, req);

    res.json({ success: true });
  } catch (error) {
    console.error('Delete story error:', error);
    res.status(500).json({ error: 'Failed to delete story', code: 'DELETE_STORY_ERROR' });
  }
});

export { router as adminCmsRouter };
