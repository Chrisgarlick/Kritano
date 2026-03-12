/**
 * Schema Generator Service
 * Template-based JSON-LD generation using page data.
 * No AI API calls — uses detected page type and metadata to produce valid JSON-LD.
 *
 * Site-aware: sub-pages include isPartOf / publisher references back to the main site.
 */

interface PageData {
  url: string;
  title: string | null;
  metaDescription: string | null;
  detectedPageType: string | null;
}

interface SiteContext {
  siteUrl: string;       // homepage / origin URL
  siteName: string | null; // homepage title or site name
}

interface GeneratedSchema {
  jsonLd: string;
  pageType: string;
}

interface GeneratedSiteSchema {
  pages: Array<{
    pageId: string;
    url: string;
    title: string | null;
    pageType: string;
    jsonLd: string;
  }>;
  combined: string; // All pages' schema in one copyable block
}

// Helpers to create shared references
function makeWebSiteRef(ctx: SiteContext): object {
  return {
    '@type': 'WebSite',
    name: ctx.siteName || '<!-- Your Website Name -->',
    url: ctx.siteUrl,
  };
}

function makePublisherRef(ctx: SiteContext): object {
  return {
    '@type': 'Organization',
    name: ctx.siteName || '<!-- Publisher Name -->',
    logo: {
      '@type': 'ImageObject',
      url: '<!-- Publisher Logo URL -->',
    },
  };
}

// Map detected page type to Schema.org @type for hasPart references
const PAGE_TYPE_TO_SCHEMA: Record<string, string> = {
  article: 'Article',
  blog: 'Article',
  news: 'NewsArticle',
  product: 'Product',
  faq: 'FAQPage',
  homepage: 'WebPage',
  default: 'WebPage',
};

// ---- Page type generators ----

function generateHomepage(data: PageData, childPages?: PageData[]): object[] {
  const webSite: Record<string, any> = {
    '@type': 'WebSite',
    name: data.title || '<!-- Your Website Name -->',
    url: data.url,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${new URL(data.url).origin}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  // Add hasPart with child page references
  if (childPages && childPages.length > 0) {
    webSite.hasPart = childPages.map(child => {
      const schemaType = PAGE_TYPE_TO_SCHEMA[child.detectedPageType || 'default'] || 'WebPage';
      return {
        '@type': schemaType,
        name: child.title || child.url,
        url: child.url,
      };
    });
  }

  return [
    {
      '@type': 'Organization',
      name: data.title || '<!-- Your Organization Name -->',
      url: data.url,
      description: data.metaDescription || '<!-- Your organization description -->',
      logo: '<!-- URL to your logo image -->',
      sameAs: [
        '<!-- https://twitter.com/yourhandle -->',
        '<!-- https://www.linkedin.com/company/yourcompany -->',
      ],
    },
    webSite,
  ];
}

function generateArticle(data: PageData, ctx: SiteContext): object[] {
  return [
    {
      '@type': 'Article',
      headline: data.title || '<!-- Article Headline -->',
      description: data.metaDescription || '<!-- Article description -->',
      url: data.url,
      author: {
        '@type': 'Person',
        name: '<!-- Author Name -->',
      },
      publisher: makePublisherRef(ctx),
      datePublished: '<!-- YYYY-MM-DD -->',
      dateModified: '<!-- YYYY-MM-DD -->',
      image: '<!-- Featured Image URL -->',
      isPartOf: makeWebSiteRef(ctx),
    },
  ];
}

function generateProduct(data: PageData, ctx: SiteContext): object[] {
  return [
    {
      '@type': 'Product',
      name: data.title || '<!-- Product Name -->',
      description: data.metaDescription || '<!-- Product description -->',
      url: data.url,
      image: '<!-- Product Image URL -->',
      brand: {
        '@type': 'Brand',
        name: '<!-- Brand Name -->',
      },
      offers: {
        '@type': 'Offer',
        price: '<!-- Price -->',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        url: data.url,
      },
      isPartOf: makeWebSiteRef(ctx),
    },
  ];
}

function generateFaq(data: PageData, ctx: SiteContext): object[] {
  return [
    {
      '@type': 'FAQPage',
      name: data.title || '<!-- FAQ Page Title -->',
      url: data.url,
      mainEntity: [
        {
          '@type': 'Question',
          name: '<!-- Question 1 -->',
          acceptedAnswer: {
            '@type': 'Answer',
            text: '<!-- Answer 1 -->',
          },
        },
        {
          '@type': 'Question',
          name: '<!-- Question 2 -->',
          acceptedAnswer: {
            '@type': 'Answer',
            text: '<!-- Answer 2 -->',
          },
        },
      ],
      isPartOf: makeWebSiteRef(ctx),
    },
  ];
}

function generateWebPage(data: PageData, ctx: SiteContext): object[] {
  return [
    {
      '@type': 'WebPage',
      name: data.title || '<!-- Page Title -->',
      description: data.metaDescription || '<!-- Page description -->',
      url: data.url,
      isPartOf: makeWebSiteRef(ctx),
    },
  ];
}

function buildGraphItems(data: PageData, ctx: SiteContext, childPages?: PageData[]): object[] {
  const pageType = data.detectedPageType || 'default';

  switch (pageType) {
    case 'homepage':
      return generateHomepage(data, childPages);
    case 'article':
    case 'blog':
    case 'news':
      return generateArticle(data, ctx);
    case 'product':
      return generateProduct(data, ctx);
    case 'faq':
      return generateFaq(data, ctx);
    default:
      return generateWebPage(data, ctx);
  }
}

function wrapAsJsonLd(items: object[]): string {
  const jsonLdObj = items.length === 1
    ? { '@context': 'https://schema.org', ...items[0] }
    : { '@context': 'https://schema.org', '@graph': items };

  return `<script type="application/ld+json">\n${JSON.stringify(jsonLdObj, null, 2)}\n</script>`;
}

/**
 * Generate schema for a single page (with site context for cross-references)
 */
export function generateSchemaForPage(data: PageData, ctx?: SiteContext): GeneratedSchema {
  const pageType = data.detectedPageType || 'default';
  const siteCtx: SiteContext = ctx || {
    siteUrl: new URL(data.url).origin,
    siteName: null,
  };

  const items = buildGraphItems(data, siteCtx);
  return { jsonLd: wrapAsJsonLd(items), pageType };
}

/**
 * Generate schema for all pages in an audit at once.
 * Homepage gets Organization + WebSite; sub-pages get their type + isPartOf references.
 */
export function generateSchemaForSite(
  pages: Array<PageData & { id: string }>
): GeneratedSiteSchema {
  // Find or infer homepage
  const homepage = pages.find(p => p.detectedPageType === 'homepage')
    || pages.find(p => {
      try { return new URL(p.url).pathname === '/'; } catch { return false; }
    })
    || pages[0];

  const siteCtx: SiteContext = {
    siteUrl: homepage ? new URL(homepage.url).origin : '',
    siteName: homepage?.title || null,
  };

  // Identify child pages (everything except the homepage)
  const childPages = pages.filter(p => p !== homepage);

  const result: GeneratedSiteSchema['pages'] = [];
  const allGraphItems: object[] = [];

  for (const page of pages) {
    const pageType = page.detectedPageType || 'default';
    const isHomepage = page === homepage;
    const items = buildGraphItems(page, siteCtx, isHomepage ? childPages : undefined);
    allGraphItems.push(...items);

    result.push({
      pageId: page.id,
      url: page.url,
      title: page.title,
      pageType,
      jsonLd: wrapAsJsonLd(items),
    });
  }

  // Deduplicate: if homepage Organization+WebSite appear in the combined @graph,
  // sub-page isPartOf references point to them naturally
  return {
    pages: result,
    combined: wrapAsJsonLd(allGraphItems),
  };
}
