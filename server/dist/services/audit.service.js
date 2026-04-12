"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditService = exports.AuditService = void 0;
const index_js_1 = require("../db/index.js");
/**
 * Audit service for logging authentication and security events.
 * All sensitive operations should be logged for security monitoring.
 */
class AuditService {
    /**
     * Log an authentication or security event
     */
    async log(entry) {
        try {
            await index_js_1.pool.query(`INSERT INTO auth_audit_logs
         (user_id, event_type, event_status, ip_address, user_agent, device_fingerprint, details, failure_reason)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, [
                entry.userId || null,
                entry.eventType,
                entry.eventStatus,
                entry.ipAddress || null,
                entry.userAgent || null,
                entry.deviceFingerprint || null,
                entry.details ? JSON.stringify(entry.details) : null,
                entry.failureReason || null,
            ]);
        }
        catch (error) {
            // Don't fail the main operation if logging fails
            console.error('Failed to write audit log:', error);
        }
    }
    /**
     * Log a successful login
     */
    async logLoginSuccess(userId, ipAddress, userAgent) {
        await this.log({
            userId,
            eventType: 'login_success',
            eventStatus: 'success',
            ipAddress,
            userAgent,
        });
    }
    /**
     * Log a failed login attempt
     */
    async logLoginFailure(email, reason, ipAddress, userAgent, userId) {
        await this.log({
            userId,
            eventType: 'login_failure',
            eventStatus: 'failure',
            ipAddress,
            userAgent,
            details: { email },
            failureReason: reason,
        });
    }
    /**
     * Log a blocked login (rate limited or locked)
     */
    async logLoginBlocked(email, reason, ipAddress, userAgent, userId) {
        await this.log({
            userId,
            eventType: 'login_blocked',
            eventStatus: 'blocked',
            ipAddress,
            userAgent,
            details: { email },
            failureReason: reason,
        });
    }
    /**
     * Log a logout event
     */
    async logLogout(userId, allDevices, ipAddress, userAgent) {
        await this.log({
            userId,
            eventType: allDevices ? 'logout_all_devices' : 'logout',
            eventStatus: 'success',
            ipAddress,
            userAgent,
        });
    }
    /**
     * Log a registration event
     */
    async logRegistration(userId, email, ipAddress, userAgent) {
        await this.log({
            userId,
            eventType: 'register',
            eventStatus: 'success',
            ipAddress,
            userAgent,
            details: { email },
        });
    }
    /**
     * Log email verification
     */
    async logEmailVerified(userId, ipAddress, userAgent) {
        await this.log({
            userId,
            eventType: 'email_verified',
            eventStatus: 'success',
            ipAddress,
            userAgent,
        });
    }
    /**
     * Log failed email verification
     */
    async logEmailVerificationFailed(reason, ipAddress, userAgent, userId) {
        await this.log({
            userId,
            eventType: 'email_verification_failed',
            eventStatus: 'failure',
            ipAddress,
            userAgent,
            failureReason: reason,
        });
    }
    /**
     * Log password reset request
     */
    async logPasswordResetRequested(email, ipAddress, userAgent, userId) {
        await this.log({
            userId,
            eventType: 'password_reset_requested',
            eventStatus: 'success',
            ipAddress,
            userAgent,
            details: { email },
        });
    }
    /**
     * Log password reset completion
     */
    async logPasswordResetCompleted(userId, ipAddress, userAgent) {
        await this.log({
            userId,
            eventType: 'password_reset_completed',
            eventStatus: 'success',
            ipAddress,
            userAgent,
        });
    }
    /**
     * Log account lockout
     */
    async logAccountLocked(userId, reason, ipAddress, userAgent) {
        await this.log({
            userId,
            eventType: 'account_locked',
            eventStatus: 'success',
            ipAddress,
            userAgent,
            failureReason: reason,
        });
    }
    /**
     * Log suspicious activity
     */
    async logSuspiciousActivity(description, details, ipAddress, userAgent, userId) {
        await this.log({
            userId,
            eventType: 'suspicious_activity',
            eventStatus: 'blocked',
            ipAddress,
            userAgent,
            details,
            failureReason: description,
        });
    }
    /**
     * Get recent audit logs for a user
     */
    async getUserLogs(userId, limit = 50) {
        const result = await index_js_1.pool.query(`SELECT id, event_type, event_status, ip_address, created_at
       FROM auth_audit_logs
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`, [userId, limit]);
        return result.rows;
    }
    /**
     * Get recent failed login attempts by IP
     */
    async getFailedAttemptsByIp(ipAddress, windowMinutes = 15) {
        const result = await index_js_1.pool.query(`SELECT COUNT(*) as count
       FROM auth_audit_logs
       WHERE ip_address = $1
       AND event_type IN ('login_failure', 'login_blocked')
       AND created_at > NOW() - make_interval(mins => $2)`, [ipAddress, windowMinutes]);
        return parseInt(result.rows[0].count, 10);
    }
    // ==========================================
    // Audit Job Events
    // ==========================================
    /**
     * Log audit job creation
     */
    async logAuditCreated(userId, auditId, targetUrl, ipAddress, userAgent) {
        await this.log({
            userId,
            eventType: 'audit_created',
            eventStatus: 'success',
            ipAddress,
            userAgent,
            details: { auditId, targetUrl },
        });
    }
    /**
     * Log audit job started processing
     */
    async logAuditStarted(auditId, targetUrl, workerId) {
        await this.log({
            eventType: 'audit_started',
            eventStatus: 'success',
            details: { auditId, targetUrl, workerId },
        });
    }
    /**
     * Log audit job completed
     */
    async logAuditCompleted(auditId, targetUrl, stats) {
        await this.log({
            eventType: 'audit_completed',
            eventStatus: 'success',
            details: { auditId, targetUrl, ...stats },
        });
    }
    /**
     * Log audit job failed
     */
    async logAuditFailed(auditId, targetUrl, errorMessage) {
        await this.log({
            eventType: 'audit_failed',
            eventStatus: 'failure',
            details: { auditId, targetUrl },
            failureReason: errorMessage,
        });
    }
    /**
     * Log audit job cancelled
     */
    async logAuditCancelled(userId, auditId, ipAddress, userAgent) {
        await this.log({
            userId,
            eventType: 'audit_cancelled',
            eventStatus: 'success',
            ipAddress,
            userAgent,
            details: { auditId },
        });
    }
    /**
     * Log audit job deleted
     */
    async logAuditDeleted(userId, auditId, ipAddress, userAgent) {
        await this.log({
            userId,
            eventType: 'audit_deleted',
            eventStatus: 'success',
            ipAddress,
            userAgent,
            details: { auditId },
        });
    }
    /**
     * Log bulk audit deletion
     */
    async logAuditBulkDeleted(userId, auditIds, ipAddress, userAgent) {
        await this.log({
            userId,
            eventType: 'audit_bulk_deleted',
            eventStatus: 'success',
            ipAddress,
            userAgent,
            details: { auditIds, count: auditIds.length },
        });
    }
    // ==========================================
    // Finding Events
    // ==========================================
    /**
     * Log finding dismissed
     */
    async logFindingDismissed(userId, auditId, ruleId, message, affectedCount, ipAddress, userAgent) {
        await this.log({
            userId,
            eventType: 'finding_dismissed',
            eventStatus: 'success',
            ipAddress,
            userAgent,
            details: { auditId, ruleId, message, affectedCount },
        });
    }
    /**
     * Log finding restored
     */
    async logFindingRestored(userId, auditId, ruleId, message, affectedCount, ipAddress, userAgent) {
        await this.log({
            userId,
            eventType: 'finding_restored',
            eventStatus: 'success',
            ipAddress,
            userAgent,
            details: { auditId, ruleId, message, affectedCount },
        });
    }
    /**
     * Log bulk finding dismissal
     */
    async logFindingBulkDismissed(userId, auditId, ruleIds, affectedCount, ipAddress, userAgent) {
        await this.log({
            userId,
            eventType: 'finding_bulk_dismissed',
            eventStatus: 'success',
            ipAddress,
            userAgent,
            details: { auditId, ruleIds, affectedCount },
        });
    }
    // ==========================================
    // Export Events
    // ==========================================
    /**
     * Log PDF export
     */
    async logExportPdf(userId, auditId, ipAddress, userAgent) {
        await this.log({
            userId,
            eventType: 'export_pdf',
            eventStatus: 'success',
            ipAddress,
            userAgent,
            details: { auditId },
        });
    }
    /**
     * Log CSV export
     */
    async logExportCsv(userId, auditId, findingsCount, ipAddress, userAgent) {
        await this.log({
            userId,
            eventType: 'export_csv',
            eventStatus: 'success',
            ipAddress,
            userAgent,
            details: { auditId, findingsCount },
        });
    }
    // ==========================================
    // API Events
    // ==========================================
    /**
     * Log API access (for rate limiting and monitoring)
     */
    async logApiAccess(userId, endpoint, method, ipAddress, userAgent) {
        await this.log({
            userId,
            eventType: 'api_access',
            eventStatus: 'success',
            ipAddress,
            userAgent,
            details: { endpoint, method },
        });
    }
    // ==========================================
    // Query Methods
    // ==========================================
    /**
     * Get recent audit events for admin dashboard
     */
    async getRecentEvents(limit = 100, eventTypes) {
        let query = `
      SELECT id, user_id, event_type, event_status, ip_address, details, created_at
      FROM auth_audit_logs
    `;
        const params = [];
        if (eventTypes && eventTypes.length > 0) {
            query += ` WHERE event_type = ANY($1)`;
            params.push(eventTypes);
            query += ` ORDER BY created_at DESC LIMIT $2`;
            params.push(limit);
        }
        else {
            query += ` ORDER BY created_at DESC LIMIT $1`;
            params.push(limit);
        }
        const result = await index_js_1.pool.query(query, params);
        return result.rows;
    }
    /**
     * Get audit events for a specific audit job
     */
    async getAuditJobEvents(auditId) {
        const result = await index_js_1.pool.query(`SELECT id, event_type, event_status, details, failure_reason, created_at
       FROM auth_audit_logs
       WHERE details->>'auditId' = $1
       ORDER BY created_at ASC`, [auditId]);
        return result.rows;
    }
}
exports.AuditService = AuditService;
// Export singleton instance
exports.auditService = new AuditService();
//# sourceMappingURL=audit.service.js.map