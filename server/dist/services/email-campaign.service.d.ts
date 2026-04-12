/**
 * Email Campaign Service
 *
 * Campaign CRUD, segment resolution, lifecycle state machine, and analytics.
 */
import type { EmailCampaign, CreateCampaignInput, UpdateCampaignInput, CampaignFilters, CampaignSegment, CampaignStats, EmailAnalyticsSummary, TemplatePerformance } from '../types/email-campaign.types.js';
export declare function listCampaigns(filters?: CampaignFilters): Promise<{
    campaigns: EmailCampaign[];
    total: number;
}>;
export declare function getCampaign(id: string): Promise<EmailCampaign | null>;
export declare function createCampaign(input: CreateCampaignInput, createdBy: string): Promise<EmailCampaign>;
export declare function updateCampaign(id: string, input: UpdateCampaignInput): Promise<EmailCampaign | null>;
export declare function deleteCampaign(id: string): Promise<boolean>;
interface SegmentUser {
    id: string;
    email: string;
    first_name: string;
}
export declare function resolveSegment(segment: CampaignSegment): Promise<SegmentUser[]>;
export declare function getAudienceCount(segment: CampaignSegment): Promise<number>;
export declare function launchCampaign(id: string): Promise<EmailCampaign>;
export declare function scheduleCampaign(id: string, scheduledAt: string): Promise<EmailCampaign>;
export declare function pauseCampaign(id: string): Promise<EmailCampaign>;
export declare function resumeCampaign(id: string): Promise<EmailCampaign>;
export declare function cancelCampaign(id: string): Promise<EmailCampaign>;
export declare function completeCampaign(id: string): Promise<void>;
export declare function incrementCampaignStat(campaignId: string, field: keyof CampaignStats, decrementField?: keyof CampaignStats): Promise<void>;
export declare function getCampaignSends(campaignId: string, filters?: {
    status?: string;
    page?: number;
    limit?: number;
}): Promise<{
    sends: unknown[];
    total: number;
}>;
export declare function getEmailSends(filters?: {
    status?: string;
    campaignId?: string;
    page?: number;
    limit?: number;
}): Promise<{
    sends: unknown[];
    total: number;
}>;
export declare function getEmailAnalytics(days?: number): Promise<EmailAnalyticsSummary[]>;
export declare function getTemplatePerformance(): Promise<TemplatePerformance[]>;
export {};
//# sourceMappingURL=email-campaign.service.d.ts.map