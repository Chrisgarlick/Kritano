/**
 * Cookie Consent Routes
 *
 * Public endpoint to log cookie consent for GDPR compliance.
 * No auth required — fires before users authenticate in many cases.
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { pool } from '../../db/index.js';

const router = Router();

// Simple rate limiter: 10 per minute per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const ConsentBodySchema = z.object({
  consent_version: z.string().max(20),
  categories: z.object({
    necessary: z.literal(true),
    analytics: z.boolean(),
    marketing: z.boolean(),
  }),
  action: z.enum(['accept_all', 'reject_all', 'custom', 'withdraw']),
  page_url: z.string().max(2000).optional(),
});

// POST /api/consent/cookies
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const ip = (req.ip || req.socket.remoteAddress || 'unknown') as string;
    const now = Date.now();

    // Rate limit check
    const entry = rateLimitMap.get(ip);
    if (entry && entry.resetAt > now) {
      if (entry.count >= 10) {
        res.status(429).json({ error: 'Too many requests' });
        return;
      }
      entry.count++;
    } else {
      rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    }

    // Periodic cleanup
    if (rateLimitMap.size > 10000) {
      for (const [key, val] of rateLimitMap) {
        if (val.resetAt < now) rateLimitMap.delete(key);
      }
    }

    const body = ConsentBodySchema.parse(req.body);

    // Extract user_id if authenticated (cookie-based auth may have set req.user)
    const userId = (req as any).user?.id || null;

    await pool.query(
      `INSERT INTO cookie_consent_logs (user_id, consent_version, categories, action, ip_address, user_agent, page_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        userId,
        body.consent_version,
        JSON.stringify(body.categories),
        body.action,
        ip !== 'unknown' ? ip : null,
        req.headers['user-agent'] || null,
        body.page_url || null,
      ]
    );

    res.json({ success: true, logged_at: new Date().toISOString() });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid consent data' });
      return;
    }
    console.error('Cookie consent log error:', error);
    res.status(500).json({ error: 'Failed to log consent' });
  }
});

export { router as cookieConsentRouter };
