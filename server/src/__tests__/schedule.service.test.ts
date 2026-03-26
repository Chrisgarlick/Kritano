import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks — must be declared before importing the service
// ---------------------------------------------------------------------------

const mockQuery = vi.fn();

vi.mock('../services/site.service.js', () => ({
  findOrCreateSiteForDomain: vi.fn(),
  getUserTierLimits: vi.fn(),
  findOrCreateUrl: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Import service functions AFTER mocks
// ---------------------------------------------------------------------------
import {
  setPool,
  frequencyToCron,
  isValidCron,
  getSchedulesByUser,
  createSchedule,
  toggleSchedule,
  deleteSchedule,
  getScheduleById,
  getScheduleRunHistory,
} from '../services/schedule.service.js';

import {
  findOrCreateSiteForDomain,
  getUserTierLimits,
} from '../services/site.service.js';

// Inject mock pool
beforeEach(() => {
  vi.clearAllMocks();
  setPool({ query: mockQuery } as any);
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Schedule Service', () => {
  // =======================================================================
  // Pure helpers
  // =======================================================================
  describe('frequencyToCron', () => {
    it('should return daily cron at specified hour', () => {
      expect(frequencyToCron('daily', 1, 8)).toBe('0 8 * * *');
    });

    it('should return weekly cron at specified day and hour', () => {
      expect(frequencyToCron('weekly', 3, 10)).toBe('0 10 * * 3');
    });

    it('should return monthly cron on 1st of month', () => {
      expect(frequencyToCron('monthly', 1, 6)).toBe('0 6 1 * *');
    });

    it('should use default day=1 and hour=6', () => {
      expect(frequencyToCron('weekly')).toBe('0 6 * * 1');
    });

    it('should throw for custom frequency (requires explicit cron)', () => {
      expect(() => frequencyToCron('custom')).toThrow('Custom frequency requires an explicit cron expression');
    });
  });

  describe('isValidCron', () => {
    it('should accept valid cron expressions', () => {
      expect(isValidCron('0 6 * * 1')).toBe(true);
      expect(isValidCron('*/15 * * * *')).toBe(true);
    });

    it('should reject invalid cron expressions', () => {
      expect(isValidCron('not a cron')).toBe(false);
      expect(isValidCron('')).toBe(false);
    });
  });

  // =======================================================================
  // getSchedulesByUser
  // =======================================================================
  describe('getSchedulesByUser', () => {
    it('should return schedules for a user', async () => {
      const mockSchedules = [
        { id: 's1', user_id: 'u1', name: 'Weekly SEO', frequency: 'weekly', site_name: 'example.com', site_verified: true },
        { id: 's2', user_id: 'u1', name: 'Daily Audit', frequency: 'daily', site_name: 'test.com', site_verified: true },
      ];
      mockQuery.mockResolvedValueOnce({ rows: mockSchedules });

      const result = await getSchedulesByUser('u1');

      expect(result).toEqual(mockSchedules);
      expect(result).toHaveLength(2);
      expect(mockQuery).toHaveBeenCalledTimes(1);
      // Verify query includes user_id param
      expect(mockQuery.mock.calls[0][1]).toEqual(['u1']);
    });

    it('should filter by siteId when provided', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 's1', site_id: 'site-1' }] });

      await getSchedulesByUser('u1', 'site-1');

      expect(mockQuery.mock.calls[0][1]).toEqual(['u1', 'site-1']);
    });

    it('should return empty array when user has no schedules', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await getSchedulesByUser('u1');

      expect(result).toEqual([]);
    });
  });

  // =======================================================================
  // createSchedule — validation
  // =======================================================================
  describe('createSchedule', () => {
    it('should throw 400 for invalid URL', async () => {
      await expect(
        createSchedule('u1', {
          targetUrl: 'not-a-url',
          frequency: 'weekly',
        } as any)
      ).rejects.toMatchObject({ message: 'Invalid URL', statusCode: 400 });
    });

    it('should throw 403 for unverified domain', async () => {
      (findOrCreateSiteForDomain as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'site-1',
        domain: 'example.com',
        verified: false,
      });

      await expect(
        createSchedule('u1', {
          targetUrl: 'https://example.com',
          frequency: 'weekly',
        } as any)
      ).rejects.toMatchObject({ statusCode: 403 });
    });

    it('should throw 403 when tier does not allow scheduling', async () => {
      (findOrCreateSiteForDomain as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'site-1',
        domain: 'example.com',
        verified: true,
      });
      (getUserTierLimits as ReturnType<typeof vi.fn>).mockResolvedValue({
        tier: 'free',
        scheduled_audits: false,
      });

      await expect(
        createSchedule('u1', {
          targetUrl: 'https://example.com',
          frequency: 'weekly',
        } as any)
      ).rejects.toMatchObject({ statusCode: 403 });
    });

    it('should create schedule successfully for valid input', async () => {
      (findOrCreateSiteForDomain as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'site-1',
        domain: 'example.com',
        verified: true,
      });
      (getUserTierLimits as ReturnType<typeof vi.fn>).mockResolvedValue({
        tier: 'pro',
        scheduled_audits: true,
      });

      const mockSchedule = {
        id: 'sched-1',
        user_id: 'u1',
        site_id: 'site-1',
        name: 'example.com - weekly',
        frequency: 'weekly',
        cron_expression: '0 6 * * 1',
      };
      mockQuery.mockResolvedValueOnce({ rows: [mockSchedule] });

      const result = await createSchedule('u1', {
        targetUrl: 'https://example.com',
        frequency: 'weekly',
      } as any);

      expect(result).toEqual(mockSchedule);
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it('should throw 400 for custom frequency without valid cron', async () => {
      (findOrCreateSiteForDomain as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'site-1',
        domain: 'example.com',
        verified: true,
      });
      (getUserTierLimits as ReturnType<typeof vi.fn>).mockResolvedValue({
        tier: 'enterprise',
        scheduled_audits: true,
      });

      await expect(
        createSchedule('u1', {
          targetUrl: 'https://example.com',
          frequency: 'custom',
          cronExpression: 'invalid',
        } as any)
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  // =======================================================================
  // toggleSchedule
  // =======================================================================
  describe('toggleSchedule', () => {
    it('should disable a schedule', async () => {
      const existing = {
        id: 's1',
        user_id: 'u1',
        frequency: 'weekly',
        cron_expression: '0 6 * * 1',
        timezone: 'UTC',
      };
      // First query: fetch existing
      mockQuery.mockResolvedValueOnce({ rows: [existing] });
      // Second query: update
      mockQuery.mockResolvedValueOnce({
        rows: [{ ...existing, enabled: false }],
      });

      const result = await toggleSchedule('u1', 's1', false);

      expect(result.enabled).toBe(false);
      expect(mockQuery).toHaveBeenCalledTimes(2);
    });

    it('should re-enable a schedule when tier allows it', async () => {
      const existing = {
        id: 's1',
        user_id: 'u1',
        frequency: 'weekly',
        cron_expression: '0 6 * * 1',
        timezone: 'UTC',
        enabled: false,
      };
      // fetch existing
      mockQuery.mockResolvedValueOnce({ rows: [existing] });
      // tier validation
      (getUserTierLimits as ReturnType<typeof vi.fn>).mockResolvedValue({
        tier: 'pro',
        scheduled_audits: true,
      });
      // update query
      mockQuery.mockResolvedValueOnce({
        rows: [{ ...existing, enabled: true }],
      });

      const result = await toggleSchedule('u1', 's1', true);

      expect(result.enabled).toBe(true);
    });

    it('should throw 404 if schedule not found or wrong user', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(
        toggleSchedule('u1', 'nonexistent', true)
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it('should throw 403 when re-enabling but tier no longer allows scheduling', async () => {
      const existing = {
        id: 's1',
        user_id: 'u1',
        frequency: 'weekly',
        cron_expression: '0 6 * * 1',
        timezone: 'UTC',
      };
      mockQuery.mockResolvedValueOnce({ rows: [existing] });
      (getUserTierLimits as ReturnType<typeof vi.fn>).mockResolvedValue({
        tier: 'free',
        scheduled_audits: false,
      });

      await expect(
        toggleSchedule('u1', 's1', true)
      ).rejects.toMatchObject({ statusCode: 403 });
    });
  });

  // =======================================================================
  // deleteSchedule — ownership check
  // =======================================================================
  describe('deleteSchedule', () => {
    it('should delete a schedule owned by the user', async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: 1 });

      await expect(deleteSchedule('u1', 's1')).resolves.toBeUndefined();
      expect(mockQuery.mock.calls[0][1]).toEqual(['s1', 'u1']);
    });

    it('should throw 404 when schedule does not belong to user', async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: 0 });

      await expect(
        deleteSchedule('u1', 's99')
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // =======================================================================
  // getScheduleById
  // =======================================================================
  describe('getScheduleById', () => {
    it('should return schedule with site info', async () => {
      const schedule = { id: 's1', user_id: 'u1', site_name: 'Example', site_verified: true };
      mockQuery.mockResolvedValueOnce({ rows: [schedule] });

      const result = await getScheduleById('u1', 's1');

      expect(result).toEqual(schedule);
    });

    it('should return null when not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await getScheduleById('u1', 'nonexistent');

      expect(result).toBeNull();
    });
  });

  // =======================================================================
  // getScheduleRunHistory — ownership check
  // =======================================================================
  describe('getScheduleRunHistory', () => {
    it('should throw 404 if schedule not owned by user', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(
        getScheduleRunHistory('s1', 'u-wrong')
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it('should return runs and total count', async () => {
      // ownership check
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 's1' }] });
      // runs + count (Promise.all)
      mockQuery.mockResolvedValueOnce({
        rows: [
          { id: 'r1', status: 'completed', seo_score: 85 },
          { id: 'r2', status: 'completed', seo_score: 90 },
        ],
      });
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '2' }] });

      const result = await getScheduleRunHistory('s1', 'u1');

      expect(result.runs).toHaveLength(2);
      expect(result.total).toBe(2);
    });
  });
});
