import { Pool } from 'pg';
export declare function initializeAdminService(dbPool: Pool): void;
export interface DashboardStats {
    users: {
        total: number;
        verified: number;
        newToday: number;
        newThisWeek: number;
        newThisMonth: number;
    };
    organizations: {
        total: number;
        newToday: number;
        newThisWeek: number;
    };
    subscriptions: {
        free: number;
        starter: number;
        pro: number;
        agency: number;
        enterprise: number;
    };
    audits: {
        total: number;
        today: number;
        thisWeek: number;
        thisMonth: number;
        pagesCrawledToday: number;
    };
}
export interface UserListItem {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    email_verified: boolean;
    is_super_admin: boolean;
    created_at: string;
    last_login_at: string | null;
    organization_count: number;
    unsubscribed_all: boolean;
}
export interface OrganizationListItem {
    id: string;
    name: string;
    slug: string;
    owner_email: string;
    owner_name: string;
    tier: string;
    status: string;
    member_count: number;
    domain_count: number;
    audit_count: number;
    created_at: string;
}
export interface AdminActivityItem {
    id: string;
    admin_email: string;
    action: string;
    target_type: string;
    target_id: string | null;
    details: Record<string, unknown>;
    ip_address: string | null;
    created_at: string;
}
export interface AnalyticsData {
    date: string;
    total_users: number;
    new_users: number;
    active_users: number;
    total_audits: number;
    audits_today: number;
    pages_crawled_today: number;
}
export declare function getDashboardStats(): Promise<DashboardStats>;
export declare function getAnalyticsHistory(days?: number): Promise<AnalyticsData[]>;
export declare function listUsers(page?: number, limit?: number, search?: string, sortBy?: string, sortOrder?: string): Promise<{
    users: UserListItem[];
    total: number;
}>;
export declare function getUserDetails(userId: string): Promise<UserListItem | null>;
export declare function updateUserSuperAdmin(userId: string, isSuperAdmin: boolean): Promise<void>;
export declare function updateUserTier(userId: string, tier: string): Promise<void>;
export declare function deleteUser(userId: string): Promise<void>;
export declare function listOrganizations(page?: number, limit?: number, search?: string, tier?: string, sortBy?: string, sortOrder?: string): Promise<{
    organizations: OrganizationListItem[];
    total: number;
}>;
export declare function getOrganizationDetails(orgId: string): Promise<OrganizationListItem | null>;
export declare function updateOrganizationTier(orgId: string, tier: 'free' | 'starter' | 'pro' | 'agency' | 'enterprise'): Promise<void>;
export declare function updateSubscriptionStatus(orgId: string, status: 'active' | 'past_due' | 'canceled' | 'trialing' | 'paused'): Promise<void>;
export declare function getAdminActivityLog(page?: number, limit?: number, adminId?: string): Promise<{
    activities: AdminActivityItem[];
    total: number;
}>;
export declare function getSystemHealth(): Promise<{
    database: boolean;
    queueSize: number;
    activeAudits: number;
    failedAuditsToday: number;
}>;
//# sourceMappingURL=admin.service.d.ts.map