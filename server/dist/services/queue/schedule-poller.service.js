"use strict";
/**
 * Schedule Poller Service
 *
 * Polls every 60 seconds for due audit schedules and creates audit jobs.
 * Uses FOR UPDATE SKIP LOCKED to prevent duplicate execution across workers.
 * Auto-pauses schedules after 3 consecutive failures.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSchedulePoller = createSchedulePoller;
const schedule_service_js_1 = require("../schedule.service.js");
const POLL_INTERVAL_MS = 60 * 1000; // 60 seconds
const MAX_BATCH_SIZE = 10;
function createSchedulePoller(_config) {
    let running = false;
    let timer = null;
    async function processSchedule(schedule) {
        try {
            // Re-validate tier — auto-pause if user downgraded
            const tierCheck = await (0, schedule_service_js_1.validateScheduleTier)(schedule.user_id, schedule.frequency, schedule.cron_expression);
            if (!tierCheck.allowed) {
                console.log(`📅 Auto-pausing schedule ${schedule.id}: ${tierCheck.reason}`);
                await (0, schedule_service_js_1.pauseSchedule)(schedule.id, `Tier downgrade: ${tierCheck.reason}`);
                return;
            }
            // Create audit job
            const result = await (0, schedule_service_js_1.createAuditFromSchedule)(schedule);
            if ('skipped' in result) {
                // Concurrent limit hit — reschedule without counting as failure
                if (result.reason === 'Concurrent audit limit reached') {
                    console.log(`📅 Schedule ${schedule.id} skipped (concurrent limit), will retry next cycle`);
                    // Push next_run_at forward by 5 minutes so it retries soon
                    const retryAt = new Date(Date.now() + 5 * 60 * 1000);
                    await (0, schedule_service_js_1.markScheduleRun)(schedule.id, 'completed', null, retryAt);
                    return;
                }
                // Other skip reasons count as failures
                console.log(`📅 Schedule ${schedule.id} skipped: ${result.reason}`);
                if (result.reason === 'Tier no longer allows scheduled audits') {
                    await (0, schedule_service_js_1.pauseSchedule)(schedule.id, result.reason);
                    return;
                }
            }
            // Calculate next run
            const nextRunAt = (0, schedule_service_js_1.getNextCronOccurrence)(schedule.cron_expression, schedule.timezone);
            // For biweekly schedules, skip the next weekly occurrence
            let adjustedNextRun = nextRunAt;
            if (schedule.frequency === 'biweekly' && nextRunAt) {
                const secondNext = (0, schedule_service_js_1.getNextCronOccurrence)(schedule.cron_expression, schedule.timezone);
                if (secondNext && secondNext > nextRunAt) {
                    adjustedNextRun = secondNext;
                }
            }
            if ('auditId' in result) {
                console.log(`📅 Schedule ${schedule.id} → audit ${result.auditId} created`);
                await (0, schedule_service_js_1.markScheduleRun)(schedule.id, 'completed', result.auditId, adjustedNextRun);
            }
            else {
                await (0, schedule_service_js_1.markScheduleRun)(schedule.id, 'failed', null, adjustedNextRun);
                // Check consecutive failures for auto-pause
                const maxFail = schedule.max_consecutive_failures || 3;
                if (schedule.consecutive_failures + 1 >= maxFail) {
                    console.log(`📅 Auto-pausing schedule ${schedule.id} after ${maxFail} consecutive failures`);
                    await (0, schedule_service_js_1.pauseSchedule)(schedule.id, `Auto-paused after ${maxFail} consecutive failures`);
                }
            }
        }
        catch (err) {
            console.error(`📅 Error processing schedule ${schedule.id}:`, err);
            // Mark as failed and calculate next run
            const nextRunAt = (0, schedule_service_js_1.getNextCronOccurrence)(schedule.cron_expression, schedule.timezone);
            await (0, schedule_service_js_1.markScheduleRun)(schedule.id, 'failed', null, nextRunAt);
            const maxFail = schedule.max_consecutive_failures || 3;
            if (schedule.consecutive_failures + 1 >= maxFail) {
                await (0, schedule_service_js_1.pauseSchedule)(schedule.id, `Auto-paused after ${maxFail} consecutive failures`);
            }
        }
    }
    async function poll() {
        if (!running)
            return;
        try {
            const dueSchedules = await (0, schedule_service_js_1.getDueSchedules)(MAX_BATCH_SIZE);
            if (dueSchedules.length > 0) {
                console.log(`📅 Processing ${dueSchedules.length} due schedule(s)`);
            }
            for (const schedule of dueSchedules) {
                await processSchedule(schedule);
            }
        }
        catch (err) {
            console.error('📅 Schedule poller error:', err);
        }
        if (running) {
            timer = setTimeout(poll, POLL_INTERVAL_MS);
        }
    }
    return {
        async start() {
            running = true;
            console.log('📅 Schedule poller started (polling every 60s)');
            poll();
        },
        async stop() {
            running = false;
            if (timer) {
                clearTimeout(timer);
                timer = null;
            }
            console.log('📅 Schedule poller stopped');
        },
    };
}
//# sourceMappingURL=schedule-poller.service.js.map