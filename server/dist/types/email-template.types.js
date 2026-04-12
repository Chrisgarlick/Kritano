"use strict";
/**
 * Email Template Types
 *
 * Block-based email template model, MJML compilation types, and branding resolution.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FONT_SIZE_MAP = exports.EMAIL_BRAND_DEFAULTS = exports.CATEGORY_TO_PREFERENCE = void 0;
// Map template categories to preference columns
exports.CATEGORY_TO_PREFERENCE = {
    transactional: 'transactional',
    onboarding: 'product_updates',
    engagement: 'marketing',
    upgrade: 'marketing',
    security: 'transactional',
    win_back: 'marketing',
    educational: 'educational',
    announcement: 'product_updates',
    digest: 'product_updates',
};
exports.EMAIL_BRAND_DEFAULTS = {
    headerBackground: '#4f46e5',
    headerTextColor: '#ffffff',
    bodyBackground: '#f8fafc',
    bodyTextColor: '#334155',
    buttonColor: '#4f46e5',
    buttonTextColor: '#ffffff',
    footerBackground: '#f1f5f9',
    footerTextColor: '#64748b',
    linkColor: '#4f46e5',
    dividerColor: '#e2e8f0',
    companyName: 'Kritano',
    logoUrl: null,
    footerText: 'This is an automated message from Kritano. Please do not reply to this email. For support, contact info@kritano.com.',
};
// ========================================
// Font Size Mapping
// ========================================
exports.FONT_SIZE_MAP = {
    sm: '14px',
    md: '16px',
    lg: '20px',
    xl: '24px',
};
//# sourceMappingURL=email-template.types.js.map