/**
 * CMS Extras Service
 *
 * CRUD for audit advice templates, announcements, and success stories.
 */
import type { AuditAdviceTemplate, CreateAdviceInput, UpdateAdviceInput, Announcement, CreateAnnouncementInput, UpdateAnnouncementInput, SuccessStory, CreateSuccessStoryInput, UpdateSuccessStoryInput } from '../types/blog.types.js';
export declare function listAdvice(filters?: {
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
}): Promise<{
    advice: AuditAdviceTemplate[];
    total: number;
}>;
export declare function getAdviceByRuleId(ruleId: string): Promise<AuditAdviceTemplate | null>;
export declare function upsertAdvice(input: CreateAdviceInput, updatedBy: string): Promise<AuditAdviceTemplate>;
export declare function updateAdvice(ruleId: string, input: UpdateAdviceInput, updatedBy: string): Promise<AuditAdviceTemplate | null>;
export declare function deleteAdvice(ruleId: string): Promise<boolean>;
export declare function listAnnouncements(filters?: {
    active?: boolean;
    page?: number;
    limit?: number;
}): Promise<{
    announcements: Announcement[];
    total: number;
}>;
export declare function getAnnouncementById(id: string): Promise<Announcement | null>;
export declare function createAnnouncement(input: CreateAnnouncementInput, createdBy: string): Promise<Announcement>;
export declare function updateAnnouncement(id: string, input: UpdateAnnouncementInput): Promise<Announcement | null>;
export declare function deleteAnnouncement(id: string): Promise<boolean>;
export declare function getActiveAnnouncements(userTier: string, userId: string): Promise<Announcement[]>;
export declare function dismissAnnouncement(announcementId: string, userId: string): Promise<boolean>;
export declare function listSuccessStories(filters?: {
    page?: number;
    limit?: number;
}): Promise<{
    stories: SuccessStory[];
    total: number;
}>;
export declare function getSuccessStoryById(id: string): Promise<SuccessStory | null>;
export declare function createSuccessStory(input: CreateSuccessStoryInput, createdBy: string): Promise<SuccessStory>;
export declare function updateSuccessStory(id: string, input: UpdateSuccessStoryInput): Promise<SuccessStory | null>;
export declare function deleteSuccessStory(id: string): Promise<boolean>;
export declare function getPublishedSuccessStories(limit?: number): Promise<SuccessStory[]>;
//# sourceMappingURL=cms.service.d.ts.map