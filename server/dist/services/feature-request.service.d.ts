/**
 * Feature Request Service
 *
 * Handles all feature request related operations including
 * creation, listing, updates, and comments.
 */
import type { FeatureRequest, FeatureRequestComment, FeatureRequestWithComments, CreateFeatureRequestData, UpdateFeatureRequestData, AddCommentData, ListOptions, AdminListOptions, PaginatedResult, FeatureRequestStats } from '../types/feature-request.types.js';
export declare const featureRequestService: {
    /**
     * Create a new feature request
     */
    create(data: CreateFeatureRequestData): Promise<FeatureRequest>;
    /**
     * List feature requests by user
     */
    listByUser(userId: string, options: ListOptions): Promise<PaginatedResult<FeatureRequest>>;
    /**
     * Get a single feature request by ID
     * If userId is provided, only return if user owns the request
     */
    getById(id: string, userId?: string): Promise<FeatureRequest | null>;
    /**
     * Get feature request with all comments (for detail view)
     */
    getWithComments(id: string): Promise<FeatureRequestWithComments | null>;
    /**
     * Add a comment to a feature request
     */
    addComment(data: AddCommentData): Promise<FeatureRequestComment>;
    /**
     * List all feature requests (admin only)
     */
    listAll(options: AdminListOptions): Promise<PaginatedResult<FeatureRequest>>;
    /**
     * Update a feature request (admin only)
     */
    update(id: string, data: UpdateFeatureRequestData): Promise<FeatureRequest | null>;
    /**
     * Get feature request statistics (admin dashboard)
     */
    getStats(): Promise<FeatureRequestStats>;
    /**
     * Soft delete a feature request
     */
    softDelete(id: string): Promise<void>;
};
//# sourceMappingURL=feature-request.service.d.ts.map