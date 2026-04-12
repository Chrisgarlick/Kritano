export type FeatureRequestImpact = 'nice_to_have' | 'would_be_helpful' | 'important' | 'critical_for_workflow';
export type FeatureRequestCategory = 'accessibility' | 'reporting' | 'ui_ux' | 'integrations' | 'performance' | 'other';
export type FeatureRequestStatus = 'submitted' | 'under_review' | 'planned' | 'in_progress' | 'completed' | 'declined';
export type FeatureRequestPriority = 'urgent' | 'high' | 'medium' | 'low';
export interface BrowserInfo {
    name: string;
    version: string;
    os: string;
}
export interface FeatureRequest {
    id: string;
    user_id: string;
    title: string;
    description: string;
    impact: FeatureRequestImpact;
    category: FeatureRequestCategory;
    page_url: string | null;
    user_agent: string | null;
    screen_size: string | null;
    browser_info: BrowserInfo | null;
    status: FeatureRequestStatus;
    priority: FeatureRequestPriority | null;
    assigned_to: string | null;
    admin_notes: string | null;
    resolution_notes: string | null;
    created_at: string;
    updated_at: string;
    completed_at: string | null;
    deleted_at: string | null;
    reporter_email?: string;
    reporter_first_name?: string;
    reporter_last_name?: string;
}
export interface FeatureRequestComment {
    id: string;
    feature_request_id: string;
    user_id: string;
    is_admin_comment: boolean;
    content: string;
    created_at: string;
    email?: string;
    first_name?: string;
    last_name?: string;
}
export interface FeatureRequestWithComments extends FeatureRequest {
    comments: FeatureRequestComment[];
}
export interface CreateFeatureRequestData {
    userId: string;
    title: string;
    description: string;
    impact: FeatureRequestImpact;
    category: FeatureRequestCategory;
    pageUrl?: string;
    userAgent?: string;
    screenSize?: string;
    browserInfo?: BrowserInfo;
}
export interface UpdateFeatureRequestData {
    status?: FeatureRequestStatus;
    priority?: FeatureRequestPriority | null;
    adminNotes?: string;
    resolutionNotes?: string;
    assignedTo?: string | null;
}
export interface AddCommentData {
    requestId: string;
    userId: string;
    content: string;
    isAdmin: boolean;
}
export interface ListOptions {
    page: number;
    limit: number;
    status?: string;
}
export interface AdminListOptions extends ListOptions {
    impact?: string;
    category?: string;
    search?: string;
}
export interface PaginatedResult<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
}
export interface FeatureRequestStats {
    total: number;
    submitted: number;
    under_review: number;
    planned: number;
    in_progress: number;
    completed: number;
    last_7_days: number;
    last_24_hours: number;
}
//# sourceMappingURL=feature-request.types.d.ts.map