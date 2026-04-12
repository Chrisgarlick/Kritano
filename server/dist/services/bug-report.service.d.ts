/**
 * Bug Report Service
 *
 * Handles all bug report related operations including
 * creation, listing, updates, and comments.
 */
import type { BugReport, BugReportComment, BugReportWithComments, CreateBugReportData, UpdateBugReportData, AddCommentData, ListOptions, AdminListOptions, PaginatedResult, BugReportStats } from '../types/bug-report.types.js';
export declare const bugReportService: {
    /**
     * Create a new bug report
     */
    create(data: CreateBugReportData): Promise<BugReport>;
    /**
     * List bug reports by user (for "My Bug Reports" page)
     */
    listByUser(userId: string, options: ListOptions): Promise<PaginatedResult<BugReport>>;
    /**
     * Get a single bug report by ID
     * If userId is provided, only return if user owns the report
     */
    getById(id: string, userId?: string): Promise<BugReport | null>;
    /**
     * Get bug report with all comments (for detail view)
     */
    getWithComments(id: string): Promise<BugReportWithComments | null>;
    /**
     * Add a comment to a bug report
     */
    addComment(data: AddCommentData): Promise<BugReportComment>;
    /**
     * List all bug reports (admin only)
     */
    listAll(options: AdminListOptions): Promise<PaginatedResult<BugReport>>;
    /**
     * Update a bug report (admin only)
     */
    update(id: string, data: UpdateBugReportData): Promise<BugReport | null>;
    /**
     * Get bug report statistics (admin dashboard)
     */
    getStats(): Promise<BugReportStats>;
    /**
     * Soft delete a bug report
     */
    softDelete(id: string): Promise<void>;
};
//# sourceMappingURL=bug-report.service.d.ts.map