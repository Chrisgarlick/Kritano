/**
 * Marketing Content Service
 *
 * CRUD for marketing campaigns (labels) and marketing content items.
 */
export declare function listCampaigns(): Promise<{
    campaigns: MarketingCampaignRow[];
}>;
export declare function createCampaign(data: {
    name: string;
    color?: string;
    description?: string;
}, createdBy: string): Promise<MarketingCampaignRow>;
export declare function updateCampaign(id: string, data: {
    name?: string;
    color?: string;
    description?: string;
}): Promise<MarketingCampaignRow | null>;
export declare function deleteCampaign(id: string): Promise<void>;
export declare function listContent(filters?: {
    platform?: string;
    campaign_id?: string;
    status?: string;
    search?: string;
    week_number?: number;
    day_of_week?: number;
    page?: number;
    limit?: number;
}): Promise<{
    content: MarketingContentRow[];
    total: number;
}>;
export declare function getContentStats(): Promise<MarketingContentStats>;
export declare function getContent(id: string): Promise<MarketingContentRow | null>;
export declare function createContent(data: {
    platform: string;
    title?: string;
    body: string;
    media?: unknown[];
    campaign_id?: string;
    status?: string;
    notes?: string;
    week_number?: number;
    day_of_week?: number;
}, createdBy: string): Promise<MarketingContentRow>;
export declare function updateContent(id: string, data: {
    platform?: string;
    title?: string;
    body?: string;
    media?: unknown[];
    campaign_id?: string | null;
    status?: string;
    notes?: string;
    week_number?: number | null;
    day_of_week?: number | null;
}): Promise<MarketingContentRow | null>;
export declare function deleteContent(id: string): Promise<void>;
export declare function updateContentStatus(id: string, status: string): Promise<MarketingContentRow | null>;
interface MarketingCampaignRow {
    id: string;
    name: string;
    color: string;
    description: string | null;
    created_by: string;
    created_at: string;
    updated_at: string;
    content_count?: number;
}
interface MarketingContentRow {
    id: string;
    platform: string;
    title: string | null;
    body: string;
    preview: string;
    media: unknown[];
    campaign_id: string | null;
    campaign?: MarketingCampaignRow | null;
    status: string;
    notes: string | null;
    char_count: number;
    week_number: number | null;
    day_of_week: number | null;
    created_by: string;
    created_at: string;
    updated_at: string;
}
interface MarketingContentStats {
    total: number;
    by_platform: Record<string, number>;
    by_status: Record<string, number>;
    by_campaign: {
        id: string;
        name: string;
        count: number;
    }[];
}
export {};
//# sourceMappingURL=marketing.service.d.ts.map