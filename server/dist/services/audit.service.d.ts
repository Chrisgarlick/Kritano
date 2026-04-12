import type { AuditEventType, AuditEventStatus } from '../types/auth.types.js';
interface AuditLogEntry {
    userId?: string | null;
    eventType: AuditEventType;
    eventStatus: AuditEventStatus;
    ipAddress?: string | null;
    userAgent?: string | null;
    deviceFingerprint?: string | null;
    details?: Record<string, unknown> | null;
    failureReason?: string | null;
}
/**
 * Audit service for logging authentication and security events.
 * All sensitive operations should be logged for security monitoring.
 */
export declare class AuditService {
    /**
     * Log an authentication or security event
     */
    log(entry: AuditLogEntry): Promise<void>;
    /**
     * Log a successful login
     */
    logLoginSuccess(userId: string, ipAddress?: string, userAgent?: string): Promise<void>;
    /**
     * Log a failed login attempt
     */
    logLoginFailure(email: string, reason: string, ipAddress?: string, userAgent?: string, userId?: string): Promise<void>;
    /**
     * Log a blocked login (rate limited or locked)
     */
    logLoginBlocked(email: string, reason: string, ipAddress?: string, userAgent?: string, userId?: string): Promise<void>;
    /**
     * Log a logout event
     */
    logLogout(userId: string, allDevices: boolean, ipAddress?: string, userAgent?: string): Promise<void>;
    /**
     * Log a registration event
     */
    logRegistration(userId: string, email: string, ipAddress?: string, userAgent?: string): Promise<void>;
    /**
     * Log email verification
     */
    logEmailVerified(userId: string, ipAddress?: string, userAgent?: string): Promise<void>;
    /**
     * Log failed email verification
     */
    logEmailVerificationFailed(reason: string, ipAddress?: string, userAgent?: string, userId?: string): Promise<void>;
    /**
     * Log password reset request
     */
    logPasswordResetRequested(email: string, ipAddress?: string, userAgent?: string, userId?: string): Promise<void>;
    /**
     * Log password reset completion
     */
    logPasswordResetCompleted(userId: string, ipAddress?: string, userAgent?: string): Promise<void>;
    /**
     * Log account lockout
     */
    logAccountLocked(userId: string, reason: string, ipAddress?: string, userAgent?: string): Promise<void>;
    /**
     * Log suspicious activity
     */
    logSuspiciousActivity(description: string, details: Record<string, unknown>, ipAddress?: string, userAgent?: string, userId?: string): Promise<void>;
    /**
     * Get recent audit logs for a user
     */
    getUserLogs(userId: string, limit?: number): Promise<Array<{
        id: string;
        event_type: string;
        event_status: string;
        ip_address: string | null;
        created_at: Date;
    }>>;
    /**
     * Get recent failed login attempts by IP
     */
    getFailedAttemptsByIp(ipAddress: string, windowMinutes?: number): Promise<number>;
    /**
     * Log audit job creation
     */
    logAuditCreated(userId: string, auditId: string, targetUrl: string, ipAddress?: string, userAgent?: string): Promise<void>;
    /**
     * Log audit job started processing
     */
    logAuditStarted(auditId: string, targetUrl: string, workerId: string): Promise<void>;
    /**
     * Log audit job completed
     */
    logAuditCompleted(auditId: string, targetUrl: string, stats: {
        pagesAudited: number;
        totalIssues: number;
        criticalIssues: number;
    }): Promise<void>;
    /**
     * Log audit job failed
     */
    logAuditFailed(auditId: string, targetUrl: string, errorMessage: string): Promise<void>;
    /**
     * Log audit job cancelled
     */
    logAuditCancelled(userId: string, auditId: string, ipAddress?: string, userAgent?: string): Promise<void>;
    /**
     * Log audit job deleted
     */
    logAuditDeleted(userId: string, auditId: string, ipAddress?: string, userAgent?: string): Promise<void>;
    /**
     * Log bulk audit deletion
     */
    logAuditBulkDeleted(userId: string, auditIds: string[], ipAddress?: string, userAgent?: string): Promise<void>;
    /**
     * Log finding dismissed
     */
    logFindingDismissed(userId: string, auditId: string, ruleId: string, message: string, affectedCount: number, ipAddress?: string, userAgent?: string): Promise<void>;
    /**
     * Log finding restored
     */
    logFindingRestored(userId: string, auditId: string, ruleId: string, message: string, affectedCount: number, ipAddress?: string, userAgent?: string): Promise<void>;
    /**
     * Log bulk finding dismissal
     */
    logFindingBulkDismissed(userId: string, auditId: string, ruleIds: string[], affectedCount: number, ipAddress?: string, userAgent?: string): Promise<void>;
    /**
     * Log PDF export
     */
    logExportPdf(userId: string, auditId: string, ipAddress?: string, userAgent?: string): Promise<void>;
    /**
     * Log CSV export
     */
    logExportCsv(userId: string, auditId: string, findingsCount: number, ipAddress?: string, userAgent?: string): Promise<void>;
    /**
     * Log API access (for rate limiting and monitoring)
     */
    logApiAccess(userId: string, endpoint: string, method: string, ipAddress?: string, userAgent?: string): Promise<void>;
    /**
     * Get recent audit events for admin dashboard
     */
    getRecentEvents(limit?: number, eventTypes?: string[]): Promise<Array<{
        id: string;
        user_id: string | null;
        event_type: string;
        event_status: string;
        ip_address: string | null;
        details: Record<string, unknown> | null;
        created_at: Date;
    }>>;
    /**
     * Get audit events for a specific audit job
     */
    getAuditJobEvents(auditId: string): Promise<Array<{
        id: string;
        event_type: string;
        event_status: string;
        details: Record<string, unknown> | null;
        failure_reason: string | null;
        created_at: Date;
    }>>;
}
export declare const auditService: AuditService;
export {};
//# sourceMappingURL=audit.service.d.ts.map