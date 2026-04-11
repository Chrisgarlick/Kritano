/**
 * Blog Structured Data Builder
 *
 * Generates JSON-LD structured data arrays for blog posts based on their
 * schema_type. Article + BreadcrumbList are always emitted. Additional
 * schema (HowTo, FAQPage, ClaimReview, VideoObject) is layered on top.
 */

import type { BlogPostDetail, BlogContentBlock } from '../services/api';

const BASE_URL = 'https://kritano.com';

interface SchemaObject {
  [key: string]: unknown;
}

export function buildBlogStructuredData(post: BlogPostDetail): SchemaObject[] {
  const canonicalUrl = `${BASE_URL}/blog/${post.slug}`;
  const schemas: SchemaObject[] = [];

  // 1. Always emit Article
  schemas.push(buildArticleSchema(post, canonicalUrl));

  // 2. Emit additional schema based on type
  switch (post.schema_type) {
    case 'howto':
      schemas.push(buildHowToSchema(post));
      break;
    case 'faq':
      schemas.push(buildFAQSchema(post));
      break;
    case 'claim_review':
      if (post.schema_claim_reviewed) {
        schemas.push(buildClaimReviewSchema(post, canonicalUrl));
      }
      break;
  }

  // 3. Auto-detect VideoObject from embed blocks
  schemas.push(...buildVideoSchemas(post));

  // 4. Always emit BreadcrumbList
  schemas.push(buildBreadcrumbSchema(post, canonicalUrl));

  return schemas;
}

function buildArticleSchema(post: BlogPostDetail, canonicalUrl: string): SchemaObject {
  const CATEGORY_LABELS: Record<string, string> = {
    'seo': 'SEO',
    'accessibility': 'Accessibility',
    'security': 'Security',
    'performance': 'Performance',
    'content-quality': 'Content Quality',
    'structured-data': 'Structured Data',
    'eeat': 'E-E-A-T',
    'aeo': 'AEO',
    'guides': 'Guides',
    'case-studies': 'Case Studies',
    'product-updates': 'Product Updates',
  };

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.seo_description || post.excerpt,
    image: post.featured_image_url || undefined,
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
    author: {
      '@type': 'Person',
      name: post.author_name,
      url: `${BASE_URL}/author/chris-garlick`,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Kritano',
      url: BASE_URL,
      logo: { '@type': 'ImageObject', url: `${BASE_URL}/brand/favicon-32.svg` },
    },
    datePublished: post.published_at || post.created_at,
    dateModified: post.updated_at,
    wordCount: post.reading_time_minutes ? post.reading_time_minutes * 250 : undefined,
    articleSection: CATEGORY_LABELS[post.category] || post.category,
    keywords: post.tags.join(', '),
    inLanguage: 'en-GB',
  };
}

function buildHowToSchema(post: BlogPostDetail): SchemaObject {
  const steps: { name: string; text: string; image?: string }[] = [];
  let currentStep: { name: string; textParts: string[]; image?: string } | null = null;

  for (const block of post.content) {
    if (block.type === 'heading') {
      if (currentStep) {
        steps.push({
          name: currentStep.name,
          text: currentStep.textParts.join('\n'),
          image: currentStep.image,
        });
      }
      currentStep = { name: block.props.text as string, textParts: [] };
    } else if (currentStep) {
      if (block.type === 'text') {
        currentStep.textParts.push(block.props.content as string);
      } else if (block.type === 'image' && !currentStep.image) {
        currentStep.image = block.props.src as string;
      }
    }
  }
  if (currentStep) {
    steps.push({ name: currentStep.name, text: currentStep.textParts.join('\n'), image: currentStep.image });
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: post.title,
    description: post.seo_description || post.excerpt,
    image: post.featured_image_url || undefined,
    step: steps.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: s.name,
      text: s.text,
      ...(s.image ? { image: s.image } : {}),
    })),
  };
}

function buildFAQSchema(post: BlogPostDetail): SchemaObject {
  const pairs: { question: string; answer: string }[] = [];
  let currentQuestion: string | null = null;
  let answerParts: string[] = [];

  for (const block of post.content) {
    if (block.type === 'heading' && (block.props.text as string).trim().endsWith('?')) {
      if (currentQuestion && answerParts.length > 0) {
        pairs.push({ question: currentQuestion, answer: answerParts.join('\n') });
      }
      currentQuestion = block.props.text as string;
      answerParts = [];
    } else if (currentQuestion && block.type === 'text') {
      answerParts.push(block.props.content as string);
    }
  }
  if (currentQuestion && answerParts.length > 0) {
    pairs.push({ question: currentQuestion, answer: answerParts.join('\n') });
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: pairs.map(p => ({
      '@type': 'Question',
      name: p.question,
      acceptedAnswer: { '@type': 'Answer', text: p.answer },
    })),
  };
}

function buildClaimReviewSchema(post: BlogPostDetail, canonicalUrl: string): SchemaObject {
  const ratingMap: Record<string, { value: number; bestRating: number; alternateName: string }> = {
    'True': { value: 5, bestRating: 5, alternateName: 'True' },
    'MostlyTrue': { value: 4, bestRating: 5, alternateName: 'Mostly True' },
    'Mixed': { value: 3, bestRating: 5, alternateName: 'Mixed' },
    'MostlyFalse': { value: 2, bestRating: 5, alternateName: 'Mostly False' },
    'False': { value: 1, bestRating: 5, alternateName: 'False' },
  };

  const rating = ratingMap[post.schema_review_rating || 'Mixed'];

  return {
    '@context': 'https://schema.org',
    '@type': 'ClaimReview',
    url: canonicalUrl,
    claimReviewed: post.schema_claim_reviewed,
    author: { '@type': 'Organization', name: 'Kritano', url: BASE_URL },
    datePublished: post.published_at,
    reviewRating: {
      '@type': 'Rating',
      ratingValue: rating.value,
      bestRating: rating.bestRating,
      worstRating: 1,
      alternateName: rating.alternateName,
    },
  };
}

function buildVideoSchemas(post: BlogPostDetail): SchemaObject[] {
  return post.content
    .filter((b: BlogContentBlock) => b.type === 'embed' && b.props.url)
    .map((b: BlogContentBlock) => ({
      '@context': 'https://schema.org',
      '@type': 'VideoObject',
      name: post.title,
      description: post.seo_description || post.excerpt,
      embedUrl: b.props.url as string,
      uploadDate: post.published_at,
    }));
}

function buildBreadcrumbSchema(post: BlogPostDetail, canonicalUrl: string): SchemaObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${BASE_URL}/blog` },
      { '@type': 'ListItem', position: 3, name: post.title, item: canonicalUrl },
    ],
  };
}
