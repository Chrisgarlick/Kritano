/**
 * PageSeo - Standardised SEO meta tags for public pages.
 *
 * Wraps react-helmet-async with OG tags, canonical URL, Twitter cards,
 * and optional JSON-LD structured data.
 *
 * When `useOverrides` is true, any admin-defined SEO overrides for this
 * path are automatically merged on top of the props.
 */

import { Helmet } from 'react-helmet-async';
import { useSeoOverride } from '../../hooks/useSeoOverrides';

const SITE_NAME = 'Kritano';
const BASE_URL = 'https://kritano.com';
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-image.png`;

/** Ensure an image URL is absolute (social crawlers require absolute URLs). */
function toAbsoluteUrl(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

interface PageSeoProps {
  /** Page title - " | Kritano" is appended automatically */
  title: string;
  /** Meta description (also used for og:description and twitter:description) */
  description: string;
  /** URL path for canonical (e.g., "/pricing"). Full URL is built from BASE_URL. */
  path: string;
  /** OG image URL (defaults to site-wide social card) */
  ogImage?: string;
  /** OG type - defaults to "website" */
  ogType?: string;
  /** JSON-LD structured data object(s) - single object or array of objects */
  structuredData?: Record<string, unknown> | Record<string, unknown>[];
  /** Set to true for pages that shouldn't be indexed (auth, dashboard) */
  noindex?: boolean;
  /** Keywords meta tag */
  keywords?: string;
  /** Featured image URL for the page (hero/banner) */
  featuredImage?: string;
  /** When true, admin SEO overrides are merged on top of these defaults */
  useOverrides?: boolean;
}

export default function PageSeo({
  title: propTitle,
  description: propDescription,
  path,
  ogImage: propOgImage,
  ogType: propOgType = 'website',
  structuredData: propStructuredData,
  noindex: propNoindex = false,
  keywords: propKeywords,
  featuredImage: propFeaturedImage,
  useOverrides = true,
}: PageSeoProps) {
  // Always call the hook (React rules), but only use the result when enabled
  const seoOverride = useSeoOverride(path);
  const override = useOverrides ? seoOverride : undefined;

  const title = override?.title || propTitle;
  const description = override?.description || propDescription;
  const keywords = override?.keywords || propKeywords;
  const featuredImage = override?.featured_image || propFeaturedImage;
  const ogImage = toAbsoluteUrl(override?.og_image || propOgImage || featuredImage || DEFAULT_OG_IMAGE);
  const ogType = override?.og_type || propOgType;
  const ogTitle = override?.og_title || title;
  const ogDescription = override?.og_description || description;
  const structuredData = override?.structured_data || propStructuredData;
  const noindex = override?.noindex ?? propNoindex;
  const twitterCard = override?.twitter_card || 'summary_large_image';
  const canonicalUrl = override?.canonical_url || `${BASE_URL}${path}`;

  const fullTitle = `${title} | ${SITE_NAME}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />

      {keywords && <meta name="keywords" content={keywords} />}
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:title" content={ogTitle} />
      <meta property="og:description" content={ogDescription} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_GB" />

      {/* Twitter Card */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:site" content="@kritanoapp" />
      <meta name="twitter:creator" content="@chrisgarlick" />
      <meta name="twitter:title" content={ogTitle} />
      <meta name="twitter:description" content={ogDescription} />
      <meta name="twitter:image" content={ogImage} />

      {/* Structured Data */}
      {structuredData && (Array.isArray(structuredData)
        ? structuredData.map((sd, i) => (
            <script key={i} type="application/ld+json">
              {JSON.stringify(sd)}
            </script>
          ))
        : (
            <script type="application/ld+json">
              {JSON.stringify(structuredData)}
            </script>
          )
      )}
    </Helmet>
  );
}
