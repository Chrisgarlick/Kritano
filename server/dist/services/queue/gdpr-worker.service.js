"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGdprWorker = createGdprWorker;
const index_js_1 = require("../../db/index.js");
const gdpr_service_js_1 = require("../gdpr.service.js");
const EXPORT_POLL_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours
function createGdprWorker(_config) {
    let running = false;
    let exportTimer = null;
    let cleanupTimer = null;
    async function pollExports() {
        if (!running)
            return;
        try {
            const pending = await index_js_1.pool.query(`SELECT id FROM account_data_exports WHERE status = 'pending' ORDER BY created_at ASC LIMIT 5`);
            for (const row of pending.rows) {
                try {
                    await gdpr_service_js_1.gdprService.processExport(row.id);
                    console.log(`GDPR: Processed export ${row.id}`);
                }
                catch (err) {
                    console.error(`GDPR: Failed to process export ${row.id}:`, err);
                }
            }
        }
        catch (err) {
            console.error('GDPR export poll error:', err);
        }
        if (running) {
            exportTimer = setTimeout(pollExports, EXPORT_POLL_INTERVAL_MS);
        }
    }
    async function pollCleanup() {
        if (!running)
            return;
        try {
            const result = await gdpr_service_js_1.gdprService.runRetentionCleanup();
            if (result.deletionsProcessed > 0 || result.exportsExpired > 0 || result.logsDeleted > 0) {
                console.log(`GDPR cleanup: ${result.deletionsProcessed} deletions, ${result.exportsExpired} exports expired, ${result.logsDeleted} logs purged`);
            }
        }
        catch (err) {
            console.error('GDPR cleanup poll error:', err);
        }
        if (running) {
            cleanupTimer = setTimeout(pollCleanup, CLEANUP_INTERVAL_MS);
        }
    }
    return {
        async start() {
            running = true;
            console.log('GDPR worker started (exports every 1h, cleanup every 24h)');
            // Run first export poll after 2 minutes, cleanup after 5 minutes
            exportTimer = setTimeout(pollExports, 2 * 60 * 1000);
            cleanupTimer = setTimeout(pollCleanup, 5 * 60 * 1000);
        },
        async stop() {
            running = false;
            if (exportTimer) {
                clearTimeout(exportTimer);
                exportTimer = null;
            }
            if (cleanupTimer) {
                clearTimeout(cleanupTimer);
                cleanupTimer = null;
            }
        },
    };
}
//# sourceMappingURL=gdpr-worker.service.js.map