/**
 * Cold Prospects — Type Definitions
 * Pipeline for discovering newly registered domains and extracting contact info
 */
export type ColdProspectStatus = 'pending' | 'checking' | 'live' | 'extracting' | 'qualified' | 'contacted' | 'converted' | 'dead';
export interface ColdProspect {
    id: string;
    domain: string;
    tld: string;
    registered_at: string | null;
    status: ColdProspectStatus;
    is_live: boolean;
    http_status: number | null;
    has_ssl: boolean;
    title: string | null;
    meta_description: string | null;
    technology_stack: string[];
    page_count_estimate: number | null;
    contact_email: string | null;
    contact_name: string | null;
    contact_role: string | null;
    emails: ProspectEmail[];
    contact_page_url: string | null;
    has_contact_form: boolean;
    social_links: Record<string, string>;
    quality_score: number;
    business_type: string | null;
    country: string | null;
    language: string | null;
    campaign_id: string | null;
    email_sent_at: string | null;
    email_opened_at: string | null;
    email_clicked_at: string | null;
    converted_user_id: string | null;
    batch_date: string;
    source: string;
    is_excluded: boolean;
    exclusion_reason: string | null;
    created_at: string;
    updated_at: string;
}
export interface ProspectEmail {
    email: string;
    name: string | null;
    role: string | null;
    source: 'mailto' | 'page_scrape' | 'pattern_guess' | 'structured_data' | 'meta_tag';
    confidence: 'high' | 'medium' | 'low';
}
export interface DomainCheckResult {
    isLive: boolean;
    httpStatus: number | null;
    hasSsl: boolean;
    title: string | null;
    metaDescription: string | null;
    technologyStack: string[];
    pageCountEstimate: number | null;
    language: string | null;
    isParked: boolean;
}
export interface EmailExtractionResult {
    emails: ProspectEmail[];
    contactPageUrl: string | null;
    hasContactForm: boolean;
    socialLinks: Record<string, string>;
    primaryEmail: string | null;
    primaryName: string | null;
    primaryRole: string | null;
}
export interface ColdProspectFilters {
    status?: ColdProspectStatus;
    tld?: string;
    minScore?: number;
    maxScore?: number;
    batchDate?: string;
    hasEmail?: boolean;
    hasName?: boolean;
    isUnsubscribed?: boolean;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
}
export interface ColdProspectStats {
    total: number;
    byStatus: Record<string, number>;
    todayImported: number;
    todayQualified: number;
    todayContacted: number;
    withEmail: number;
    withName: number;
    conversionRate: number;
    avgQualityScore: number;
}
export interface ColdProspectSettings {
    targetTlds: string[];
    excludedKeywords: string[];
    minQualityScore: number;
    dailyCheckLimit: number;
    dailyEmailLimit: number;
    autoOutreachEnabled: boolean;
    lastFeedDate: string | null;
}
export interface CreateColdProspectInput {
    domain: string;
    tld?: string;
    registered_at?: string;
    batch_date?: string;
    source?: string;
}
//# sourceMappingURL=cold-prospect.types.d.ts.map