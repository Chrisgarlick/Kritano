/**
 * Email Branding Service
 *
 * Mirrors the PDF branding resolution chain (pdf-branding.service.ts)
 * to resolve tier-aware colors, logos, and footer text for emails.
 */
import { type EmailBranding } from '../types/email-template.types.js';
/**
 * Resolve email branding based on tier and site/org settings.
 *
 * Resolution chain:
 * 1. Free tier → Kritano defaults
 * 2. Starter/Pro → site colors, still "Powered by Kritano"
 * 3. Agency+ → full white-label with org logo, custom colors, custom footer
 */
export declare function resolveEmailBranding(siteId: string | null, userId: string): Promise<EmailBranding>;
//# sourceMappingURL=email-branding.service.d.ts.map