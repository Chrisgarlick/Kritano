/**
 * Email Template Service
 *
 * Core template operations: CRUD, MJML compilation, variable substitution, sending.
 * Pipeline: JSON blocks → MJML string → HTML (cached) → variable substitution → Resend
 */
import type { EmailTemplate, EmailBlock, EmailBranding, CreateTemplateInput, UpdateTemplateInput, TemplateFilters, SendTemplateParams } from '../types/email-template.types.js';
export declare function listTemplates(filters?: TemplateFilters): Promise<{
    templates: EmailTemplate[];
    total: number;
}>;
export declare function getTemplate(id: string): Promise<EmailTemplate | null>;
export declare function getTemplateBySlug(slug: string): Promise<EmailTemplate | null>;
export declare function createTemplate(input: CreateTemplateInput): Promise<EmailTemplate>;
export declare function updateTemplate(id: string, input: UpdateTemplateInput): Promise<EmailTemplate | null>;
export declare function deleteTemplate(id: string): Promise<boolean>;
export declare function duplicateTemplate(id: string, newSlug: string, newName: string): Promise<EmailTemplate | null>;
/**
 * Compile JSON blocks to HTML via MJML.
 */
export declare function compileBlocksToHtml(blocks: EmailBlock[], branding: EmailBranding, previewText: string): string;
/**
 * Replace {{variables}} in compiled HTML using Handlebars.
 */
export declare function substituteVariables(html: string, variables: Record<string, string>): string;
/**
 * Render a template preview with sample variables.
 */
export declare function renderPreview(templateId: string, sampleVariables?: Record<string, string>): Promise<string | null>;
/**
 * Send an email using a template. This is the main entry point for sending.
 */
export declare function sendTemplate(params: SendTemplateParams): Promise<string>;
//# sourceMappingURL=email-template.service.d.ts.map