/**
 * Email Branding Service
 *
 * Mirrors the PDF branding resolution chain (pdf-branding.service.ts)
 * to resolve tier-aware colors, logos, and footer text for emails.
 */

import { pool } from '../db/index.js';
import { getSiteOwnerTierLimits, getUserTierLimits } from './site.service.js';
import type { OrgBranding } from '../types/organization.types.js';
import { EMAIL_BRAND_DEFAULTS, type EmailBranding } from '../types/email-template.types.js';

interface SiteBrandingFields {
  companyName?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  footerText?: string;
}

/**
 * Resolve email branding based on tier and site/org settings.
 *
 * Resolution chain:
 * 1. Free tier → PagePulser defaults
 * 2. Starter/Pro → site colors, still "Powered by PagePulser"
 * 3. Agency+ → full white-label with org logo, custom colors, custom footer
 */
export async function resolveEmailBranding(
  siteId: string | null,
  userId: string
): Promise<EmailBranding> {
  const tierLimits = siteId
    ? await getSiteOwnerTierLimits(siteId)
    : await getUserTierLimits(userId);

  const whiteLabel = tierLimits?.white_label as boolean ?? false;

  // Load site branding if site exists
  let siteBranding: SiteBrandingFields | null = null;
  let siteOrgId: string | null = null;

  if (siteId) {
    const siteResult = await pool.query<{
      verified: boolean;
      organization_id: string | null;
      settings: { branding?: SiteBrandingFields } | null;
    }>(
      `SELECT verified, organization_id, settings FROM sites WHERE id = $1`,
      [siteId]
    );

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
    const primaryColor = siteBranding?.primaryColor || EMAIL_BRAND_DEFAULTS.headerBackground;
    return {
      ...EMAIL_BRAND_DEFAULTS,
      headerBackground: primaryColor,
      buttonColor: primaryColor,
      linkColor: primaryColor,
      companyName: siteBranding?.companyName || EMAIL_BRAND_DEFAULTS.companyName,
    };
  }

  // Agency+ — load org branding, merge with site overrides
  let orgBranding: OrgBranding | null = null;

  if (siteOrgId) {
    const orgResult = await pool.query<{
      settings: { branding?: OrgBranding } | null;
    }>(
      `SELECT settings FROM organizations WHERE id = $1`,
      [siteOrgId]
    );

    if (orgResult.rows.length > 0 && orgResult.rows[0].settings?.branding) {
      orgBranding = orgResult.rows[0].settings.branding;
    }
  }

  const base: OrgBranding = orgBranding || {};
  const override: SiteBrandingFields = siteBranding || {};
  const primaryColor = override.primaryColor || base.primaryColor || EMAIL_BRAND_DEFAULTS.headerBackground;

  return {
    headerBackground: primaryColor,
    headerTextColor: EMAIL_BRAND_DEFAULTS.headerTextColor,
    bodyBackground: EMAIL_BRAND_DEFAULTS.bodyBackground,
    bodyTextColor: EMAIL_BRAND_DEFAULTS.bodyTextColor,
    buttonColor: primaryColor,
    buttonTextColor: EMAIL_BRAND_DEFAULTS.buttonTextColor,
    footerBackground: EMAIL_BRAND_DEFAULTS.footerBackground,
    footerTextColor: EMAIL_BRAND_DEFAULTS.footerTextColor,
    linkColor: primaryColor,
    dividerColor: EMAIL_BRAND_DEFAULTS.dividerColor,
    companyName: override.companyName || base.companyName || EMAIL_BRAND_DEFAULTS.companyName,
    logoUrl: override.logoUrl || base.logoUrl || null,
    footerText: override.footerText || base.footerText || EMAIL_BRAND_DEFAULTS.footerText,
  };
}
