export type OrgRole = 'owner' | 'admin' | 'member' | 'viewer';
export type InviteStatus = 'pending' | 'accepted' | 'declined' | 'expired';
export type SubscriptionTier = 'free' | 'starter' | 'pro' | 'agency' | 'enterprise';
export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'trialing' | 'paused';
export type DomainStatus = 'active' | 'pending' | 'locked' | 'pending_change';
export interface Organization {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    owner_id: string;
    settings: OrganizationSettings;
    created_at: Date;
    updated_at: Date;
}
export interface OrgBranding {
    companyName?: string;
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    footerText?: string;
}
export interface OrganizationSettings {
    defaultAuditChecks: string[];
    requireDomainVerification: boolean;
    allowMemberInvites: boolean;
    auditNotifications: boolean;
    branding?: OrgBranding;
}
export interface OrganizationMember {
    id: string;
    organization_id: string;
    user_id: string;
    role: OrgRole;
    invited_by: string | null;
    invited_at: Date;
    joined_at: Date | null;
    created_at: Date;
    updated_at: Date;
}
export interface OrganizationMemberWithUser extends OrganizationMember {
    user_email: string;
    user_first_name: string | null;
    user_last_name: string | null;
}
export interface OrganizationInvitation {
    id: string;
    organization_id: string;
    email: string;
    role: OrgRole;
    invited_by: string;
    token: string;
    status: InviteStatus;
    expires_at: Date;
    created_at: Date;
    responded_at: Date | null;
}
export interface Subscription {
    id: string;
    organization_id: string;
    tier: SubscriptionTier;
    status: SubscriptionStatus;
    stripe_customer_id: string | null;
    stripe_subscription_id: string | null;
    stripe_price_id: string | null;
    current_period_start: Date | null;
    current_period_end: Date | null;
    cancel_at_period_end: boolean;
    canceled_at: Date | null;
    trial_start: Date | null;
    trial_end: Date | null;
    included_seats: number;
    extra_seats: number;
    addons: SubscriptionAddon[];
    created_at: Date;
    updated_at: Date;
}
export interface SubscriptionAddon {
    type: string;
    quantity?: number;
    enabled?: boolean;
}
export interface OrganizationDomain {
    id: string;
    organization_id: string;
    domain: string;
    include_subdomains: boolean;
    verified: boolean;
    verification_token: string | null;
    verification_method: string | null;
    verification_attempts: number;
    last_verification_attempt: Date | null;
    verified_at: Date | null;
    status: DomainStatus;
    locked_until: Date | null;
    pending_domain: string | null;
    added_by: string | null;
    created_at: Date;
    updated_at: Date;
}
export interface UsageRecord {
    id: string;
    organization_id: string;
    period_start: Date;
    period_end: Date;
    audits_count: number;
    pages_crawled: number;
    api_requests: number;
    exports_count: number;
    domains_snapshot: number;
    seats_snapshot: number;
    created_at: Date;
    updated_at: Date;
}
export interface OrganizationAuditLogEntry {
    id: string;
    organization_id: string;
    user_id: string | null;
    action: string;
    resource_type: string | null;
    resource_id: string | null;
    details: Record<string, unknown>;
    ip_address: string | null;
    user_agent: string | null;
    created_at: Date;
}
export interface TierLimits {
    tier: SubscriptionTier;
    max_seats: number | null;
    max_domains: number | null;
    domain_locking: boolean;
    max_audits_per_month: number | null;
    max_pages_per_audit: number;
    max_audit_depth: number;
    available_checks: string[];
    scheduled_audits: boolean;
    min_schedule_interval: string | null;
    data_retention_days: number | null;
    api_requests_per_day: number | null;
    api_requests_per_minute: number;
    concurrent_audits: number;
    export_pdf: boolean;
    export_csv: boolean;
    export_json: boolean;
    white_label: boolean;
    competitor_comparison: boolean;
    max_competitor_domains: number | null;
    max_sites: number | null;
    max_competitors_per_site: number | null;
}
export interface OrganizationWithMembership extends Organization {
    role: OrgRole;
    subscription: Subscription;
    member_count: number;
    domain_count: number;
}
export interface CreateOrganizationInput {
    name: string;
    slug?: string;
}
export interface UpdateOrganizationInput {
    name?: string;
    slug?: string;
    logo_url?: string | null;
    settings?: Partial<OrganizationSettings>;
}
export interface InviteMemberInput {
    email: string;
    role: OrgRole;
}
export interface CreateDomainInput {
    domain: string;
    include_subdomains?: boolean;
}
export type Permission = 'org:read' | 'org:write' | 'org:delete' | 'billing:read' | 'billing:write' | 'team:read' | 'team:invite' | 'team:remove' | 'team:role' | 'domain:read' | 'domain:write' | 'audit:read' | 'audit:create' | 'audit:edit' | 'audit:delete' | 'apikey:read' | 'apikey:write' | 'schedule:read' | 'schedule:write' | 'schedule:delete' | 'export:create';
export declare const ROLE_PERMISSIONS: Record<OrgRole, Permission[]>;
//# sourceMappingURL=organization.types.d.ts.map