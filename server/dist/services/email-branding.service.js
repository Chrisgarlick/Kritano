"use strict";
/**
 * Email Branding Service
 *
 * Mirrors the PDF branding resolution chain (pdf-branding.service.ts)
 * to resolve tier-aware colors, logos, and footer text for emails.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveEmailBranding = resolveEmailBranding;
const index_js_1 = require("../db/index.js");
const site_service_js_1 = require("./site.service.js");
const email_template_types_js_1 = require("../types/email-template.types.js");
/**
 * Resolve email branding based on tier and site/org settings.
 *
 * Resolution chain:
 * 1. Free tier → Kritano defaults
 * 2. Starter/Pro → site colors, still "Powered by Kritano"
 * 3. Agency+ → full white-label with org logo, custom colors, custom footer
 */
async function resolveEmailBranding(siteId, userId) {
    const tierLimits = siteId
        ? await (0, site_service_js_1.getSiteOwnerTierLimits)(siteId)
        : await (0, site_service_js_1.getUserTierLimits)(userId);
    const whiteLabel = tierLimits?.white_label ?? false;
    // Load site branding if site exists
    let siteBranding = null;
    let siteOrgId = null;
    if (siteId) {
        const siteResult = await index_js_1.pool.query(`SELECT verified, organization_id, settings FROM sites WHERE id = $1`, [siteId]);
        if (siteResult.rows.length > 0) {
            const site = siteResult.rows[0];
            siteOrgId = site.organization_id;
            if (site.verified && site.settings?.branding) {
                siteBranding = site.settings.branding;
            }
        }
    }
    // Free/Starter/Pro without white-label
    if (!whiteLabel) {
        const primaryColor = siteBranding?.primaryColor || email_template_types_js_1.EMAIL_BRAND_DEFAULTS.headerBackground;
        return {
            ...email_template_types_js_1.EMAIL_BRAND_DEFAULTS,
            headerBackground: primaryColor,
            buttonColor: primaryColor,
            linkColor: primaryColor,
            companyName: siteBranding?.companyName || email_template_types_js_1.EMAIL_BRAND_DEFAULTS.companyName,
        };
    }
    // Agency+ — load org branding, merge with site overrides
    let orgBranding = null;
    if (siteOrgId) {
        const orgResult = await index_js_1.pool.query(`SELECT settings FROM organizations WHERE id = $1`, [siteOrgId]);
        if (orgResult.rows.length > 0 && orgResult.rows[0].settings?.branding) {
            orgBranding = orgResult.rows[0].settings.branding;
        }
    }
    const base = orgBranding || {};
    const override = siteBranding || {};
    const primaryColor = override.primaryColor || base.primaryColor || email_template_types_js_1.EMAIL_BRAND_DEFAULTS.headerBackground;
    return {
        headerBackground: primaryColor,
        headerTextColor: email_template_types_js_1.EMAIL_BRAND_DEFAULTS.headerTextColor,
        bodyBackground: email_template_types_js_1.EMAIL_BRAND_DEFAULTS.bodyBackground,
        bodyTextColor: email_template_types_js_1.EMAIL_BRAND_DEFAULTS.bodyTextColor,
        buttonColor: primaryColor,
        buttonTextColor: email_template_types_js_1.EMAIL_BRAND_DEFAULTS.buttonTextColor,
        footerBackground: email_template_types_js_1.EMAIL_BRAND_DEFAULTS.footerBackground,
        footerTextColor: email_template_types_js_1.EMAIL_BRAND_DEFAULTS.footerTextColor,
        linkColor: primaryColor,
        dividerColor: email_template_types_js_1.EMAIL_BRAND_DEFAULTS.dividerColor,
        companyName: override.companyName || base.companyName || email_template_types_js_1.EMAIL_BRAND_DEFAULTS.companyName,
        logoUrl: override.logoUrl || base.logoUrl || null,
        footerText: override.footerText || base.footerText || email_template_types_js_1.EMAIL_BRAND_DEFAULTS.footerText,
    };
}
//# sourceMappingURL=email-branding.service.js.map