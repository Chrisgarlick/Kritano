/**
 * Structured Data Types
 *
 * Types for Schema.org/JSON-LD/Microdata/Open Graph analysis
 */

// Schema.org types we validate
export type SchemaType =
  | 'Organization'
  | 'WebSite'
  | 'WebPage'
  | 'Article'
  | 'NewsArticle'
  | 'BlogPosting'
  | 'Product'
  | 'Offer'
  | 'AggregateRating'
  | 'Review'
  | 'LocalBusiness'
  | 'BreadcrumbList'
  | 'FAQPage'
  | 'HowTo'
  | 'Event'
  | 'Person'
  | 'VideoObject'
  | 'ImageObject'
  | 'SearchAction'
  | 'ContactPoint'
  | 'PostalAddress'
  | 'OpeningHoursSpecification';

// Required and recommended fields for each schema type
export interface SchemaRequirements {
  required: string[];
  recommended: string[];
}

// Schema requirements dictionary
export const SCHEMA_REQUIREMENTS: Record<string, SchemaRequirements> = {
  Organization: {
    required: ['@type', 'name'],
    recommended: ['url', 'logo', 'contactPoint', 'sameAs', 'description'],
  },
  WebSite: {
    required: ['@type', 'name', 'url'],
    recommended: ['potentialAction', 'description'],
  },
  Article: {
    required: ['@type', 'headline', 'author', 'datePublished'],
    recommended: ['image', 'dateModified', 'publisher', 'description', 'mainEntityOfPage'],
  },
  NewsArticle: {
    required: ['@type', 'headline', 'author', 'datePublished'],
    recommended: ['image', 'dateModified', 'publisher', 'description', 'mainEntityOfPage'],
  },
  BlogPosting: {
    required: ['@type', 'headline', 'author', 'datePublished'],
    recommended: ['image', 'dateModified', 'publisher', 'description', 'mainEntityOfPage'],
  },
  Product: {
    required: ['@type', 'name'],
    recommended: ['image', 'description', 'sku', 'brand', 'offers', 'aggregateRating', 'review'],
  },
  Offer: {
    required: ['@type', 'price', 'priceCurrency'],
    recommended: ['availability', 'priceValidUntil', 'url', 'seller'],
  },
  LocalBusiness: {
    required: ['@type', 'name', 'address'],
    recommended: ['telephone', 'openingHoursSpecification', 'geo', 'url', 'image', 'priceRange'],
  },
  BreadcrumbList: {
    required: ['@type', 'itemListElement'],
    recommended: [],
  },
  FAQPage: {
    required: ['@type', 'mainEntity'],
    recommended: [],
  },
  Person: {
    required: ['@type', 'name'],
    recommended: ['image', 'jobTitle', 'url', 'sameAs'],
  },
  Event: {
    required: ['@type', 'name', 'startDate', 'location'],
    recommended: ['description', 'endDate', 'image', 'performer', 'offers'],
  },
  VideoObject: {
    required: ['@type', 'name', 'description', 'thumbnailUrl', 'uploadDate'],
    recommended: ['duration', 'contentUrl', 'embedUrl', 'interactionCount'],
  },
  Review: {
    required: ['@type', 'reviewRating', 'author'],
    recommended: ['itemReviewed', 'datePublished', 'reviewBody'],
  },
  AggregateRating: {
    required: ['@type', 'ratingValue'],
    recommended: ['reviewCount', 'ratingCount', 'bestRating', 'worstRating'],
  },
};

// Expected schema types based on page type
export interface PageTypeExpectation {
  pageType: string;
  expectedSchemas: string[];
  indicators: string[]; // HTML/content indicators for this page type
}

export const PAGE_TYPE_EXPECTATIONS: PageTypeExpectation[] = [
  {
    pageType: 'homepage',
    expectedSchemas: ['Organization', 'WebSite'],
    indicators: ['is-homepage', 'path-is-root'],
  },
  {
    pageType: 'article',
    expectedSchemas: ['Article', 'BreadcrumbList'],
    indicators: ['article-tag', 'blog-content', 'news-content', 'date-published'],
  },
  {
    pageType: 'product',
    expectedSchemas: ['Product', 'Offer', 'BreadcrumbList'],
    indicators: ['add-to-cart', 'price-element', 'product-details', 'buy-button'],
  },
  {
    pageType: 'local-business',
    expectedSchemas: ['LocalBusiness', 'PostalAddress'],
    indicators: ['address-block', 'phone-number', 'opening-hours', 'map-embed'],
  },
  {
    pageType: 'faq',
    expectedSchemas: ['FAQPage'],
    indicators: ['faq-section', 'question-answer-pairs', 'accordion-qa'],
  },
  {
    pageType: 'event',
    expectedSchemas: ['Event'],
    indicators: ['event-date', 'event-location', 'event-registration'],
  },
];

// Parsed JSON-LD data
export interface ParsedJsonLd {
  raw: string;
  parsed: any;
  isValid: boolean;
  parseError?: string;
  types: string[];
}

// Open Graph data
export interface OpenGraphData {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  siteName?: string;
  locale?: string;
}

// Twitter Card data
export interface TwitterCardData {
  card?: string;
  title?: string;
  description?: string;
  image?: string;
  site?: string;
  creator?: string;
}

// Microdata item
export interface MicrodataItem {
  type: string;
  properties: Record<string, any>;
}

// Structured data analysis result
export interface StructuredDataAnalysis {
  // Overall score (0-100)
  score: number;

  // JSON-LD data
  jsonLd: {
    found: boolean;
    count: number;
    items: ParsedJsonLd[];
    validCount: number;
    invalidCount: number;
  };

  // Microdata
  microdata: {
    found: boolean;
    count: number;
    items: MicrodataItem[];
  };

  // Open Graph
  openGraph: {
    found: boolean;
    data: OpenGraphData;
    completeness: number; // percentage of recommended fields present
  };

  // Twitter Cards
  twitterCard: {
    found: boolean;
    data: TwitterCardData;
    completeness: number;
  };

  // Detected schema types
  detectedTypes: string[];

  // Expected but missing types based on page content
  missingExpectedTypes: string[];

  // Page type detection
  detectedPageType: string | null;

  // Validation errors
  validationErrors: StructuredDataValidationError[];
}

// Validation error details
export interface StructuredDataValidationError {
  type: 'missing_required' | 'missing_recommended' | 'invalid_value' | 'syntax_error' | 'type_mismatch';
  schemaType?: string;
  field?: string;
  message: string;
  severity: 'critical' | 'warning' | 'info';
}

// Context for structured data rules
export interface StructuredDataContext {
  url: string;
  html: string;
  $: any; // Cheerio instance
  analysis: StructuredDataAnalysis;
  isHomepage: boolean;
}
