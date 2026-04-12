"use strict";
/**
 * Trial Worker Service
 *
 * Polls every 5 minutes to check for expiring and expired trials.
 * Sends warning emails 3 days before expiry and downgrades expired trials to free.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTrialWorker = createTrialWorker;
const trial_service_js_1 = require("../trial.service.js");
const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
function createTrialWorker(_config) {
    let running = false;
    let timer = null;
    async function poll() {
        if (!running)
            return;
        try {
            await (0, trial_service_js_1.checkTrialExpiry)();
        }
        catch (err) {
            console.error('Trial worker poll error:', err);
        }
        if (running) {
            timer = setTimeout(poll, POLL_INTERVAL_MS);
        }
    }
    return {
        async start() {
            running = true;
            console.log('🔔 Trial worker started (polling every 5m)');
            poll();
        },
        async stop() {
            running = false;
            if (timer) {
                clearTimeout(timer);
                timer = null;
            }
            console.log('🔔 Trial worker stopped');
        },
    };
}
//# sourceMappingURL=trial-worker.service.js.map