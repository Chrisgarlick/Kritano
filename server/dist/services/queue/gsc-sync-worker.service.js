"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGscSyncWorker = createGscSyncWorker;
const gsc_service_js_1 = require("../gsc.service.js");
const SYNC_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours
const DEFAULT_RETENTION_DAYS = 30;
function createGscSyncWorker(config) {
    let running = false;
    let syncTimer = null;
    (0, gsc_service_js_1.setPool)(config.pool);
    function formatDate(d) {
        return d.toISOString().split('T')[0];
    }
    async function pollSync() {
        if (!running)
            return;
        try {
            const connections = await (0, gsc_service_js_1.getAllConnectionsForSync)();
            for (const conn of connections) {
                if (!running)
                    break;
                try {
                    // GSC data has a ~3 day delay, sync last 7 days to catch any backfill
                    const endDate = new Date();
                    endDate.setDate(endDate.getDate() - 3);
                    const startDate = new Date(endDate);
                    startDate.setDate(startDate.getDate() - 7);
                    // For first sync (never synced), backfill 90 days
                    if (!conn.last_sync_at) {
                        startDate.setDate(endDate.getDate() - 90);
                    }
                    const rows = await (0, gsc_service_js_1.syncQueryData)(conn.id, formatDate(startDate), formatDate(endDate));
                    if (rows > 0) {
                        console.log(`GSC sync: ${conn.gsc_property} - ${rows} rows synced`);
                    }
                    // Cleanup old data based on tier retention
                    const retentionDays = conn.gsc_data_retention_days || DEFAULT_RETENTION_DAYS;
                    const cleaned = await (0, gsc_service_js_1.cleanupOldData)(conn.id, retentionDays);
                    if (cleaned > 0) {
                        console.log(`GSC cleanup: ${conn.gsc_property} - ${cleaned} old rows removed`);
                    }
                }
                catch (err) {
                    console.error(`GSC sync failed for ${conn.gsc_property}:`, err.message);
                }
            }
        }
        catch (err) {
            console.error('GSC sync poll error:', err);
        }
        if (running) {
            syncTimer = setTimeout(pollSync, SYNC_INTERVAL_MS);
        }
    }
    return {
        async start() {
            running = true;
            console.log('GSC sync worker started (every 6 hours)');
            // First sync after 3 minutes (let other workers settle)
            syncTimer = setTimeout(pollSync, 3 * 60 * 1000);
        },
        async stop() {
            running = false;
            if (syncTimer) {
                clearTimeout(syncTimer);
                syncTimer = null;
            }
        },
    };
}
//# sourceMappingURL=gsc-sync-worker.service.js.map