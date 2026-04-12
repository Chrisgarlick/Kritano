/**
 * Verify a user's password for sensitive operations.
 */
declare function verifyPassword(userId: string, password: string): Promise<boolean>;
/**
 * Request a data export for a user.
 */
declare function requestExport(userId: string): Promise<string>;
/**
 * Process a pending export: gather data, create ZIP, update record.
 */
declare function processExport(exportId: string): Promise<void>;
/**
 * Get export download info. Verifies ownership and expiry.
 */
declare function getExportDownload(userId: string, exportId: string): Promise<{
    filePath: string;
    fileName: string;
}>;
/**
 * Get the latest export status for a user.
 */
declare function getLatestExport(userId: string): Promise<{
    id: string;
    status: string;
    createdAt: Date;
    completedAt: Date | null;
    expiresAt: Date | null;
    fileSizeBytes: number | null;
} | null>;
/**
 * Request account deletion with 30-day grace period.
 */
declare function requestAccountDeletion(userId: string): Promise<{
    scheduledFor: Date;
}>;
/**
 * Cancel a pending account deletion.
 */
declare function cancelAccountDeletion(userId: string): Promise<void>;
/**
 * Execute account deletion (called by worker after grace period).
 */
declare function executeAccountDeletion(userId: string): Promise<void>;
/**
 * Run retention cleanup tasks:
 * - Process scheduled deletions past grace period
 * - Expire old export files
 * - Purge old auth logs
 */
declare function runRetentionCleanup(): Promise<{
    deletionsProcessed: number;
    exportsExpired: number;
    logsDeleted: number;
}>;
export declare const gdprService: {
    verifyPassword: typeof verifyPassword;
    requestExport: typeof requestExport;
    processExport: typeof processExport;
    getExportDownload: typeof getExportDownload;
    getLatestExport: typeof getLatestExport;
    requestAccountDeletion: typeof requestAccountDeletion;
    cancelAccountDeletion: typeof cancelAccountDeletion;
    executeAccountDeletion: typeof executeAccountDeletion;
    runRetentionCleanup: typeof runRetentionCleanup;
};
export {};
//# sourceMappingURL=gdpr.service.d.ts.map