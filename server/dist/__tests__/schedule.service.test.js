"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
// ---------------------------------------------------------------------------
// Mocks — must be declared before importing the service
// ---------------------------------------------------------------------------
const mockQuery = vitest_1.vi.fn();
vitest_1.vi.mock('../services/site.service.js', () => ({
    findOrCreateSiteForDomain: vitest_1.vi.fn(),
    getUserTierLimits: vitest_1.vi.fn(),
    findOrCreateUrl: vitest_1.vi.fn(),
}));
// ---------------------------------------------------------------------------
// Import service functions AFTER mocks
// ---------------------------------------------------------------------------
const schedule_service_js_1 = require("../services/schedule.service.js");
const site_service_js_1 = require("../services/site.service.js");
// Inject mock pool
(0, vitest_1.beforeEach)(() => {
    vitest_1.vi.clearAllMocks();
    (0, schedule_service_js_1.setPool)({ query: mockQuery });
});
// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
(0, vitest_1.describe)('Schedule Service', () => {
    // =======================================================================
    // Pure helpers
    // =======================================================================
    (0, vitest_1.describe)('frequencyToCron', () => {
        (0, vitest_1.it)('should return daily cron at specified hour', () => {
            (0, vitest_1.expect)((0, schedule_service_js_1.frequencyToCron)('daily', 1, 8)).toBe('0 8 * * *');
        });
        (0, vitest_1.it)('should return weekly cron at specified day and hour', () => {
            (0, vitest_1.expect)((0, schedule_service_js_1.frequencyToCron)('weekly', 3, 10)).toBe('0 10 * * 3');
        });
        (0, vitest_1.it)('should return monthly cron on 1st of month', () => {
            (0, vitest_1.expect)((0, schedule_service_js_1.frequencyToCron)('monthly', 1, 6)).toBe('0 6 1 * *');
        });
        (0, vitest_1.it)('should use default day=1 and hour=6', () => {
            (0, vitest_1.expect)((0, schedule_service_js_1.frequencyToCron)('weekly')).toBe('0 6 * * 1');
        });
        (0, vitest_1.it)('should throw for custom frequency (requires explicit cron)', () => {
            (0, vitest_1.expect)(() => (0, schedule_service_js_1.frequencyToCron)('custom')).toThrow('Custom frequency requires an explicit cron expression');
        });
    });
    (0, vitest_1.describe)('isValidCron', () => {
        (0, vitest_1.it)('should accept valid cron expressions', () => {
            (0, vitest_1.expect)((0, schedule_service_js_1.isValidCron)('0 6 * * 1')).toBe(true);
            (0, vitest_1.expect)((0, schedule_service_js_1.isValidCron)('*/15 * * * *')).toBe(true);
        });
        (0, vitest_1.it)('should reject invalid cron expressions', () => {
            (0, vitest_1.expect)((0, schedule_service_js_1.isValidCron)('not a cron')).toBe(false);
            (0, vitest_1.expect)((0, schedule_service_js_1.isValidCron)('')).toBe(false);
        });
    });
    // =======================================================================
    // getSchedulesByUser
    // =======================================================================
    (0, vitest_1.describe)('getSchedulesByUser', () => {
        (0, vitest_1.it)('should return schedules for a user', async () => {
            const mockSchedules = [
                { id: 's1', user_id: 'u1', name: 'Weekly SEO', frequency: 'weekly', site_name: 'example.com', site_verified: true },
                { id: 's2', user_id: 'u1', name: 'Daily Audit', frequency: 'daily', site_name: 'test.com', site_verified: true },
            ];
            mockQuery.mockResolvedValueOnce({ rows: mockSchedules });
            const result = await (0, schedule_service_js_1.getSchedulesByUser)('u1');
            (0, vitest_1.expect)(result).toEqual(mockSchedules);
            (0, vitest_1.expect)(result).toHaveLength(2);
            (0, vitest_1.expect)(mockQuery).toHaveBeenCalledTimes(1);
            // Verify query includes user_id param
            (0, vitest_1.expect)(mockQuery.mock.calls[0][1]).toEqual(['u1']);
        });
        (0, vitest_1.it)('should filter by siteId when provided', async () => {
            mockQuery.mockResolvedValueOnce({ rows: [{ id: 's1', site_id: 'site-1' }] });
            await (0, schedule_service_js_1.getSchedulesByUser)('u1', 'site-1');
            (0, vitest_1.expect)(mockQuery.mock.calls[0][1]).toEqual(['u1', 'site-1']);
        });
        (0, vitest_1.it)('should return empty array when user has no schedules', async () => {
            mockQuery.mockResolvedValueOnce({ rows: [] });
            const result = await (0, schedule_service_js_1.getSchedulesByUser)('u1');
            (0, vitest_1.expect)(result).toEqual([]);
        });
    });
    // =======================================================================
    // createSchedule — validation
    // =======================================================================
    (0, vitest_1.describe)('createSchedule', () => {
        (0, vitest_1.it)('should throw 400 for invalid URL', async () => {
            await (0, vitest_1.expect)((0, schedule_service_js_1.createSchedule)('u1', {
                targetUrl: 'not-a-url',
                frequency: 'weekly',
            })).rejects.toMatchObject({ message: 'Invalid URL', statusCode: 400 });
        });
        (0, vitest_1.it)('should throw 403 for unverified domain', async () => {
            site_service_js_1.findOrCreateSiteForDomain.mockResolvedValue({
                id: 'site-1',
                domain: 'example.com',
                verified: false,
            });
            await (0, vitest_1.expect)((0, schedule_service_js_1.createSchedule)('u1', {
                targetUrl: 'https://example.com',
                frequency: 'weekly',
            })).rejects.toMatchObject({ statusCode: 403 });
        });
        (0, vitest_1.it)('should throw 403 when tier does not allow scheduling', async () => {
            site_service_js_1.findOrCreateSiteForDomain.mockResolvedValue({
                id: 'site-1',
                domain: 'example.com',
                verified: true,
            });
            site_service_js_1.getUserTierLimits.mockResolvedValue({
                tier: 'free',
                scheduled_audits: false,
            });
            await (0, vitest_1.expect)((0, schedule_service_js_1.createSchedule)('u1', {
                targetUrl: 'https://example.com',
                frequency: 'weekly',
            })).rejects.toMatchObject({ statusCode: 403 });
        });
        (0, vitest_1.it)('should create schedule successfully for valid input', async () => {
            site_service_js_1.findOrCreateSiteForDomain.mockResolvedValue({
                id: 'site-1',
                domain: 'example.com',
                verified: true,
            });
            site_service_js_1.getUserTierLimits.mockResolvedValue({
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
            const result = await (0, schedule_service_js_1.createSchedule)('u1', {
                targetUrl: 'https://example.com',
                frequency: 'weekly',
            });
            (0, vitest_1.expect)(result).toEqual(mockSchedule);
            (0, vitest_1.expect)(mockQuery).toHaveBeenCalledTimes(1);
        });
        (0, vitest_1.it)('should throw 400 for custom frequency without valid cron', async () => {
            site_service_js_1.findOrCreateSiteForDomain.mockResolvedValue({
                id: 'site-1',
                domain: 'example.com',
                verified: true,
            });
            site_service_js_1.getUserTierLimits.mockResolvedValue({
                tier: 'enterprise',
                scheduled_audits: true,
            });
            await (0, vitest_1.expect)((0, schedule_service_js_1.createSchedule)('u1', {
                targetUrl: 'https://example.com',
                frequency: 'custom',
                cronExpression: 'invalid',
            })).rejects.toMatchObject({ statusCode: 400 });
        });
    });
    // =======================================================================
    // toggleSchedule
    // =======================================================================
    (0, vitest_1.describe)('toggleSchedule', () => {
        (0, vitest_1.it)('should disable a schedule', async () => {
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
            const result = await (0, schedule_service_js_1.toggleSchedule)('u1', 's1', false);
            (0, vitest_1.expect)(result.enabled).toBe(false);
            (0, vitest_1.expect)(mockQuery).toHaveBeenCalledTimes(2);
        });
        (0, vitest_1.it)('should re-enable a schedule when tier allows it', async () => {
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
            site_service_js_1.getUserTierLimits.mockResolvedValue({
                tier: 'pro',
                scheduled_audits: true,
            });
            // update query
            mockQuery.mockResolvedValueOnce({
                rows: [{ ...existing, enabled: true }],
            });
            const result = await (0, schedule_service_js_1.toggleSchedule)('u1', 's1', true);
            (0, vitest_1.expect)(result.enabled).toBe(true);
        });
        (0, vitest_1.it)('should throw 404 if schedule not found or wrong user', async () => {
            mockQuery.mockResolvedValueOnce({ rows: [] });
            await (0, vitest_1.expect)((0, schedule_service_js_1.toggleSchedule)('u1', 'nonexistent', true)).rejects.toMatchObject({ statusCode: 404 });
        });
        (0, vitest_1.it)('should throw 403 when re-enabling but tier no longer allows scheduling', async () => {
            const existing = {
                id: 's1',
                user_id: 'u1',
                frequency: 'weekly',
                cron_expression: '0 6 * * 1',
                timezone: 'UTC',
            };
            mockQuery.mockResolvedValueOnce({ rows: [existing] });
            site_service_js_1.getUserTierLimits.mockResolvedValue({
                tier: 'free',
                scheduled_audits: false,
            });
            await (0, vitest_1.expect)((0, schedule_service_js_1.toggleSchedule)('u1', 's1', true)).rejects.toMatchObject({ statusCode: 403 });
        });
    });
    // =======================================================================
    // deleteSchedule — ownership check
    // =======================================================================
    (0, vitest_1.describe)('deleteSchedule', () => {
        (0, vitest_1.it)('should delete a schedule owned by the user', async () => {
            mockQuery.mockResolvedValueOnce({ rowCount: 1 });
            await (0, vitest_1.expect)((0, schedule_service_js_1.deleteSchedule)('u1', 's1')).resolves.toBeUndefined();
            (0, vitest_1.expect)(mockQuery.mock.calls[0][1]).toEqual(['s1', 'u1']);
        });
        (0, vitest_1.it)('should throw 404 when schedule does not belong to user', async () => {
            mockQuery.mockResolvedValueOnce({ rowCount: 0 });
            await (0, vitest_1.expect)((0, schedule_service_js_1.deleteSchedule)('u1', 's99')).rejects.toMatchObject({ statusCode: 404 });
        });
    });
    // =======================================================================
    // getScheduleById
    // =======================================================================
    (0, vitest_1.describe)('getScheduleById', () => {
        (0, vitest_1.it)('should return schedule with site info', async () => {
            const schedule = { id: 's1', user_id: 'u1', site_name: 'Example', site_verified: true };
            mockQuery.mockResolvedValueOnce({ rows: [schedule] });
            const result = await (0, schedule_service_js_1.getScheduleById)('u1', 's1');
            (0, vitest_1.expect)(result).toEqual(schedule);
        });
        (0, vitest_1.it)('should return null when not found', async () => {
            mockQuery.mockResolvedValueOnce({ rows: [] });
            const result = await (0, schedule_service_js_1.getScheduleById)('u1', 'nonexistent');
            (0, vitest_1.expect)(result).toBeNull();
        });
    });
    // =======================================================================
    // getScheduleRunHistory — ownership check
    // =======================================================================
    (0, vitest_1.describe)('getScheduleRunHistory', () => {
        (0, vitest_1.it)('should throw 404 if schedule not owned by user', async () => {
            mockQuery.mockResolvedValueOnce({ rows: [] });
            await (0, vitest_1.expect)((0, schedule_service_js_1.getScheduleRunHistory)('s1', 'u-wrong')).rejects.toMatchObject({ statusCode: 404 });
        });
        (0, vitest_1.it)('should return runs and total count', async () => {
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
            const result = await (0, schedule_service_js_1.getScheduleRunHistory)('s1', 'u1');
            (0, vitest_1.expect)(result.runs).toHaveLength(2);
            (0, vitest_1.expect)(result.total).toBe(2);
        });
    });
});
//# sourceMappingURL=schedule.service.test.js.map