/**
 * Schedule Routes
 *
 * CRUD for audit schedules, mounted at /api/audits/schedules
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import {
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getScheduleById,
  getSchedulesByUser,
  toggleSchedule,
  getScheduleRunHistory,
} from '../../services/schedule.service.js';
import type { CreateScheduleInput, UpdateScheduleInput } from '../../types/schedule.types.js';

const router = Router();

// List schedules for authenticated user
router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const siteId = req.query.siteId as string | undefined;
    const schedules = await getSchedulesByUser(userId, siteId);
    res.json({ schedules });
  } catch (error) {
    console.error('List schedules error:', error);
    res.status(500).json({ error: 'Failed to list schedules' });
  }
});

// Get single schedule
router.get('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const schedule = await getScheduleById(userId, req.params.id);
    if (!schedule) {
      res.status(404).json({ error: 'Schedule not found' });
      return;
    }
    const { runs, total } = await getScheduleRunHistory(req.params.id, userId);
    res.json({ schedule, recentRuns: runs, totalRuns: total });
  } catch (error) {
    console.error('Get schedule error:', error);
    res.status(500).json({ error: 'Failed to get schedule' });
  }
});

// Create schedule
router.post('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const input: CreateScheduleInput = req.body;
    const schedule = await createSchedule(userId, input);
    res.status(201).json({ schedule });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    console.error('Create schedule error:', error.message);
    res.status(statusCode).json({ error: error.message || 'Failed to create schedule' });
  }
});

// Update schedule
router.patch('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const input: UpdateScheduleInput = req.body;
    const schedule = await updateSchedule(userId, req.params.id, input);
    res.json({ schedule });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    console.error('Update schedule error:', error.message);
    res.status(statusCode).json({ error: error.message || 'Failed to update schedule' });
  }
});

// Delete schedule
router.delete('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    await deleteSchedule(userId, req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    console.error('Delete schedule error:', error.message);
    res.status(statusCode).json({ error: error.message || 'Failed to delete schedule' });
  }
});

// Toggle schedule enabled/disabled
router.post('/:id/toggle', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { enabled } = req.body;
    if (typeof enabled !== 'boolean') {
      res.status(400).json({ error: 'enabled must be a boolean' });
      return;
    }
    const schedule = await toggleSchedule(userId, req.params.id, enabled);
    res.json({ schedule });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    console.error('Toggle schedule error:', error.message);
    res.status(statusCode).json({ error: error.message || 'Failed to toggle schedule' });
  }
});

// Get run history for a schedule
router.get('/:id/runs', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    const result = await getScheduleRunHistory(req.params.id, userId, limit, offset);
    res.json(result);
  } catch (error) {
    console.error('Get schedule runs error:', error);
    res.status(500).json({ error: 'Failed to get schedule runs' });
  }
});

export const schedulesRouter = router;
