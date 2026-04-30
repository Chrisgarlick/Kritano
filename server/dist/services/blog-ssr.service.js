"use strict";
/**
 * Blog SSR Service
 *
 * Renders blog posts and listing pages as complete HTML documents server-side.
 * This ensures search engines see fully rendered content without needing
 * JavaScript execution or Puppeteer pre-rendering.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderBlogPost = renderBlogPost;
exports.renderBlogListing = renderBlogListing;
exports.renderBlogNotFound = renderBlogNotFound;
const marked_1 = require("marked");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// ── Discover Vite-built CSS file ─────────────────────────────────────
// Scan client dist for the hashed CSS file so SSR pages reference
// the same stylesheet nginx serves, instead of the Tailwind CDN.
function discoverCssFile() {
    const candidates = [
        path_1.default.resolve(process.cwd(), 'client', 'dist', 'assets'),
        path_1.default.resolve(process.cwd(), '..', 'client', 'dist', 'assets'),
        '/home/deploy/kritano/client/dist/assets',
    ];
    for (const dir of candidates) {
        try {
            const files = fs_1.default.readdirSync(dir);
            const cssFile = files.find((f) => f.startsWith('index-') && f.endsWith('.css'));
            if (cssFile)
                return `/assets/${cssFile}`;
        }
        catch { /* directory doesn't exist */ }
    }
    return null;
}
const VITE_CSS_PATH = discoverCssFile();
const BASE_URL = process.env.APP_URL?.replace(/^http:\/\//, 'https://') || 'https://kritano.com';
const CATEGORY_LABELS = {
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
// ── Helpers ──────────────────────────────────────────────────────────
function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
function renderMarkdown(md) {
    return marked_1.marked.parse(md, { async: false });
}
function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric',
    });
}
function formatIsoDate(dateStr) {
    return new Date(dateStr).toISOString().split('T')[0];
}
// ── Embed URL extraction ─────────────────────────────────────────────
function getEmbedUrl(raw) {
    try {
        const url = new URL(raw);
        if (url.hostname.includes('youtube.com') || url.hostname.includes('youtu.be')) {
            let videoId = null;
            if (url.hostname.includes('youtu.be')) {
                videoId = url.pathname.slice(1);
            }
            else {
                videoId = url.searchParams.get('v');
            }
            if (videoId)
                return `https://www.youtube-nocookie.com/embed/${videoId}`;
        }
        if (url.hostname.includes('vimeo.com')) {
            const match = url.pathname.match(/\/(\d+)/);
            if (match)
                return `https://player.vimeo.com/video/${match[1]}`;
        }
    }
    catch { /* invalid URL */ }
    return null;
}
// ── Content Block Renderer ───────────────────────────────────────────
function renderBlock(block) {
    const props = block.props;
    switch (block.type) {
        case 'text': {
            const content = props.content || '';
            return `<div class="prose prose-slate max-w-none prose-a:text-indigo-600 prose-a:underline prose-a:underline-offset-2">${renderMarkdown(content)}</div>`;
        }
        case 'heading': {
            const text = escapeHtml(props.text || '');
            const level = props.level || 2;
            const classes = 'font-sans font-semibold text-slate-900';
            if (level === 2)
                return `<h2 class="${classes} text-2xl mt-10 mb-4">${text}</h2>`;
            if (level === 3)
                return `<h3 class="${classes} text-xl mt-8 mb-3">${text}</h3>`;
            return `<h4 class="${classes} text-lg mt-6 mb-2">${text}</h4>`;
        }
        case 'image': {
            const src = props.src || '';
            const alt = escapeHtml(props.alt || '');
            const caption = props.caption || '';
            const width = props.width || 'content';
            const widthClass = width === 'full' ? 'w-full' : width === 'wide' ? 'max-w-4xl mx-auto' : 'max-w-2xl mx-auto';
            const hasVariants = src.includes('/original/');
            const webpUrl = src.replace('/original/', '/webp/').replace(/\.(png|jpe?g|gif)$/i, '.webp');
            const thumbUrl = src.replace('/original/', '/thumbnails/').replace(/\.(png|gif)$/i, '.jpg');
            let imgHtml;
            if (hasVariants) {
                imgHtml = `<picture>
          <source srcset="${escapeHtml(webpUrl)}" type="image/webp" />
          <img src="${escapeHtml(src)}" srcset="${escapeHtml(thumbUrl)} 400w, ${escapeHtml(src)} 800w" sizes="${width === 'full' ? '100vw' : '(max-width: 768px) 100vw, 672px'}" alt="${alt}" loading="lazy" width="800" height="450" class="w-full h-auto rounded-lg shadow-sm" style="aspect-ratio: 800 / 450;" />
        </picture>`;
            }
            else {
                imgHtml = `<img src="${escapeHtml(src)}" alt="${alt}" loading="lazy" width="800" height="450" class="w-full h-auto rounded-lg shadow-sm" style="aspect-ratio: 800 / 450;" />`;
            }
            const captionHtml = caption ? `<figcaption class="mt-2 text-center text-sm text-slate-600">${escapeHtml(caption)}</figcaption>` : '';
            return `<figure class="my-8 ${widthClass}">${imgHtml}${captionHtml}</figure>`;
        }
        case 'callout': {
            const calloutType = props.type || 'info';
            const title = props.title || '';
            const body = props.body || '';
            const colours = {
                tip: { bg: 'bg-emerald-50', border: 'border-emerald-300', titleColor: 'text-emerald-900', label: 'Tip' },
                warning: { bg: 'bg-amber-50', border: 'border-amber-300', titleColor: 'text-amber-900', label: 'Warning' },
                info: { bg: 'bg-blue-50', border: 'border-blue-300', titleColor: 'text-blue-900', label: 'Info' },
                example: { bg: 'bg-purple-50', border: 'border-purple-300', titleColor: 'text-purple-900', label: 'Example' },
            };
            const cfg = colours[calloutType] || colours.info;
            const titleHtml = title ? `<p class="mb-1 font-semibold ${cfg.titleColor}">${escapeHtml(title)}</p>` : '';
            return `<div class="my-6 rounded-lg border-l-4 ${cfg.border} ${cfg.bg} p-5" role="note" aria-label="${cfg.label}">
        <div class="min-w-0">
          ${titleHtml}
          <div class="prose prose-sm max-w-none text-slate-700">${renderMarkdown(body)}</div>
        </div>
      </div>`;
        }
        case 'code': {
            const language = props.language || '';
            const code = escapeHtml(props.code || '');
            const filename = props.filename || '';
            const filenameHtml = filename
                ? `<div class="border-b border-slate-700 bg-slate-800 px-4 py-2 text-xs font-mono text-slate-400">${escapeHtml(filename)}</div>`
                : '';
            return `<div class="my-6 overflow-hidden rounded-lg border border-slate-200 bg-slate-900">
        ${filenameHtml}
        <pre class="overflow-x-auto p-4" tabindex="0" role="region" aria-label="${escapeHtml(language || 'Code')} example"><code class="text-sm font-mono text-slate-100${language ? ` language-${escapeHtml(language)}` : ''}">${code}</code></pre>
      </div>`;
        }
        case 'quote': {
            const text = escapeHtml(props.text || '');
            const attribution = props.attribution || '';
            const attrHtml = attribution
                ? `<cite class="mt-2 block text-sm font-medium not-italic text-slate-600">-- ${escapeHtml(attribution)}</cite>`
                : '';
            return `<blockquote class="my-8 border-l-4 border-indigo-300 bg-indigo-50/50 py-4 pl-6 pr-4">
        <p class="text-lg italic text-slate-700">${text}</p>
        ${attrHtml}
      </blockquote>`;
        }
        case 'divider':
            return '<hr class="my-10 border-t border-slate-200" />';
        case 'embed': {
            const rawUrl = props.url || '';
            const embedUrl = getEmbedUrl(rawUrl);
            if (!embedUrl)
                return '';
            return `<div class="my-8 aspect-video w-full overflow-hidden rounded-lg shadow-sm">
        <iframe src="${escapeHtml(embedUrl)}" class="h-full w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen title="Embedded video"></iframe>
      </div>`;
        }
        case 'cta': {
            const text = escapeHtml(props.text || 'Learn more');
            const url = escapeHtml(props.url || '#');
            const variant = props.variant || 'primary';
            const btnClasses = variant === 'primary'
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50';
            return `<div class="my-8 text-center">
        <a href="${url}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 rounded-md px-6 py-3 text-sm font-semibold transition-colors ${btnClasses}">${text}</a>
      </div>`;
        }
        case 'stat_highlight': {
            const stat = escapeHtml(props.stat || '');
            const description = escapeHtml(props.description || '');
            const source = props.source || '';
            const sourceHtml = source ? `<p class="mt-2 text-xs text-slate-600">Source: ${escapeHtml(source)}</p>` : '';
            return `<div class="my-8 rounded-lg border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-8 text-center">
        <p class="font-display text-5xl font-normal text-indigo-600">${stat}</p>
        <p class="mt-3 text-base text-slate-700">${description}</p>
        ${sourceHtml}
      </div>`;
        }
        case 'audit_link': {
            const ruleId = escapeHtml(props.ruleId || '');
            const customText = escapeHtml(props.customText || `View rule: ${ruleId}`);
            return `<div class="my-6 flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-indigo-100 text-indigo-600">
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
        </div>
        <div class="min-w-0 flex-1">
          <p class="font-medium text-slate-900">${customText}</p>
          <p class="truncate text-sm text-slate-600">${ruleId}</p>
        </div>
      </div>`;
        }
        case 'two_column': {
            const left = props.left || [];
            const right = props.right || [];
            return `<div class="my-8 grid gap-8 md:grid-cols-2">
        <div>${left.map(renderBlock).join('')}</div>
        <div>${right.map(renderBlock).join('')}</div>
      </div>`;
        }
        default:
            return '';
    }
}
// ── Structured Data ──────────────────────────────────────────────────
function buildStructuredData(post) {
    const canonicalUrl = `${BASE_URL}/blog/${post.slug}`;
    const schemas = [];
    // Article
    schemas.push({
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
            sameAs: [
                'https://uk.linkedin.com/in/chris-garlick-59a8bb91',
                'https://x.com/ChrisGarlick123',
            ],
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
        keywords: post.focus_keyword
            ? [post.focus_keyword, ...post.tags].join(', ')
            : post.tags.join(', '),
        inLanguage: 'en-GB',
    });
    // HowTo
    if (post.schema_type === 'howto') {
        const steps = [];
        let currentStep = null;
        for (const block of post.content) {
            const p = block.props;
            if (block.type === 'heading') {
                if (currentStep)
                    steps.push(currentStep);
                currentStep = { name: p.text, textParts: [] };
            }
            else if (currentStep) {
                if (block.type === 'text')
                    currentStep.textParts.push(p.content);
                else if (block.type === 'image' && !currentStep.image)
                    currentStep.image = p.src;
            }
        }
        if (currentStep)
            steps.push(currentStep);
        schemas.push({
            '@context': 'https://schema.org',
            '@type': 'HowTo',
            name: post.title,
            description: post.seo_description || post.excerpt,
            step: steps.map((s, i) => ({
                '@type': 'HowToStep',
                position: i + 1,
                name: s.name,
                text: s.textParts.join('\n'),
                ...(s.image ? { image: s.image } : {}),
            })),
        });
    }
    // FAQ
    if (post.schema_type === 'faq') {
        const pairs = [];
        let currentQ = null;
        let answerParts = [];
        for (const block of post.content) {
            const p = block.props;
            if (block.type === 'heading' && p.text.trim().endsWith('?')) {
                if (currentQ && answerParts.length > 0) {
                    pairs.push({ question: currentQ, answer: answerParts.join('\n') });
                }
                currentQ = p.text;
                answerParts = [];
            }
            else if (currentQ && block.type === 'text') {
                answerParts.push(p.content);
            }
        }
        if (currentQ && answerParts.length > 0) {
            pairs.push({ question: currentQ, answer: answerParts.join('\n') });
        }
        schemas.push({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: pairs.map(p => ({
                '@type': 'Question',
                name: p.question,
                acceptedAnswer: { '@type': 'Answer', text: p.answer },
            })),
        });
    }
    // ClaimReview
    if (post.schema_type === 'claim_review' && post.schema_claim_reviewed) {
        const ratingMap = {
            'True': { value: 5, alternateName: 'True' },
            'MostlyTrue': { value: 4, alternateName: 'Mostly True' },
            'Mixed': { value: 3, alternateName: 'Mixed' },
            'MostlyFalse': { value: 2, alternateName: 'Mostly False' },
            'False': { value: 1, alternateName: 'False' },
        };
        const rating = ratingMap[post.schema_review_rating || 'Mixed'];
        schemas.push({
            '@context': 'https://schema.org',
            '@type': 'ClaimReview',
            url: canonicalUrl,
            claimReviewed: post.schema_claim_reviewed,
            author: { '@type': 'Organization', name: 'Kritano', url: BASE_URL },
            datePublished: post.published_at,
            reviewRating: {
                '@type': 'Rating',
                ratingValue: rating.value,
                bestRating: 5,
                worstRating: 1,
                alternateName: rating.alternateName,
            },
        });
    }
    // VideoObject from embed blocks
    for (const block of post.content) {
        if (block.type === 'embed' && block.props.url) {
            schemas.push({
                '@context': 'https://schema.org',
                '@type': 'VideoObject',
                name: post.title,
                description: post.seo_description || post.excerpt,
                embedUrl: block.props.url,
                uploadDate: post.published_at,
            });
        }
    }
    // BreadcrumbList
    schemas.push({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
            { '@type': 'ListItem', position: 2, name: 'Blog', item: `${BASE_URL}/blog` },
            { '@type': 'ListItem', position: 3, name: post.title, item: canonicalUrl },
        ],
    });
    // Person (author)
    schemas.push({
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: 'Chris Garlick',
        jobTitle: 'Founder of Kritano',
        url: `${BASE_URL}/author/chris-garlick`,
        image: `${BASE_URL}/brand/author-chris-garlick.png`,
        description: 'I built Kritano after years of running audits with fragmented tools. I write about SEO, accessibility, security, and performance based on real auditing data from thousands of scans.',
        sameAs: [
            'https://uk.linkedin.com/in/chris-garlick-59a8bb91',
            'https://x.com/ChrisGarlick123',
        ],
    });
    return schemas;
}
// ── HTML Shell ───────────────────────────────────────────────────────
function htmlShell(opts) {
    return `<!DOCTYPE html>
<html lang="en-GB">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(opts.title)}</title>
  <meta name="description" content="${escapeHtml(opts.description)}" />
  <link rel="canonical" href="${escapeHtml(opts.canonicalUrl)}" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="icon" type="image/svg+xml" sizes="32x32" href="/brand/favicon-32.svg" />
  <link rel="apple-touch-icon" href="/brand/favicon-64.svg" />
  <meta property="og:site_name" content="Kritano" />
  <meta property="og:type" content="${escapeHtml(opts.ogType)}" />
  <meta property="og:title" content="${escapeHtml(opts.title)}" />
  <meta property="og:description" content="${escapeHtml(opts.description)}" />
  <meta property="og:image" content="${escapeHtml(opts.ogImage)}" />
  <meta property="og:url" content="${escapeHtml(opts.canonicalUrl)}" />
  <meta property="og:locale" content="en_GB" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(opts.title)}" />
  <meta name="twitter:description" content="${escapeHtml(opts.description)}" />
  <meta name="twitter:image" content="${escapeHtml(opts.ogImage)}" />
  <link rel="alternate" type="application/atom+xml" title="Kritano Blog" href="${BASE_URL}/api/blog/feed.xml" />
  <link rel="preload" as="font" type="font/woff2" href="/fonts/instrument-serif-regular.woff2" crossorigin />
  <link rel="preload" as="font" type="font/woff2" href="/fonts/outfit-latin.woff2" crossorigin />${VITE_CSS_PATH ? `\n  <link rel="stylesheet" href="${VITE_CSS_PATH}" />` : ''}
  <style>
    @font-face { font-family: 'Instrument Serif'; font-style: normal; font-weight: 400; font-display: swap; src: url('/fonts/instrument-serif-regular.woff2') format('woff2'); }
    @font-face { font-family: 'Outfit'; font-style: normal; font-weight: 300; font-display: swap; src: url('/fonts/outfit-latin.woff2') format('woff2'); }
    @font-face { font-family: 'Outfit'; font-style: normal; font-weight: 400; font-display: swap; src: url('/fonts/outfit-latin.woff2') format('woff2'); }
    @font-face { font-family: 'Outfit'; font-style: normal; font-weight: 500; font-display: swap; src: url('/fonts/outfit-latin.woff2') format('woff2'); }
    @font-face { font-family: 'Outfit'; font-style: normal; font-weight: 600; font-display: swap; src: url('/fonts/outfit-latin.woff2') format('woff2'); }
    @font-face { font-family: 'Outfit'; font-style: normal; font-weight: 700; font-display: swap; src: url('/fonts/outfit-latin.woff2') format('woff2'); }
    @font-face { font-family: 'JetBrains Mono'; font-style: normal; font-weight: 400; font-display: swap; src: url('/fonts/jetbrains-mono-latin.woff2') format('woff2'); }
    body { font-family: 'Outfit', system-ui, sans-serif; }
    .font-display { font-family: 'Instrument Serif', Georgia, serif; }
    .font-mono { font-family: 'JetBrains Mono', monospace; }
    .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border-width: 0; }
    .ssr-touch { display: inline-flex; align-items: center; min-height: 44px; padding: 8px 12px; }
    .ssr-touch-block { display: inline-block; min-height: 44px; padding: 6px 0; }
    .ssr-touch-icon { display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; }
    .ssr-tag { display: inline-block; min-height: 44px; padding: 8px 12px; line-height: 28px; }
    .ssr-skip:focus { position: absolute; top: 1rem; left: 1rem; z-index: 100; background: #4f46e5; color: #fff; padding: 8px 16px; border-radius: 6px; font-size: 14px; font-weight: 600; width: auto; height: auto; clip: auto; white-space: normal; overflow: visible; }

    /* Mobile nav toggle */
    .ssr-mobile-checkbox { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border-width: 0; }
    .ssr-mobile-menu { display: none; }
    .ssr-hamburger { display: none; }
    .ssr-hamburger-close { display: none; }
    .ssr-desktop-nav { display: flex; }

    @media (max-width: 767px) {
      .ssr-desktop-nav { display: none; }
      .ssr-hamburger { display: inline-flex; }
      .ssr-mobile-checkbox:checked ~ nav .ssr-hamburger-open { display: none; }
      .ssr-mobile-checkbox:checked ~ nav .ssr-hamburger-close { display: block; }
      .ssr-mobile-checkbox:checked ~ .ssr-mobile-menu { display: block; }
    }
  </style>
  ${opts.extraHead}
</head>
<body class="bg-white text-slate-900 antialiased">
  <a href="#main-content" class="sr-only ssr-skip">Skip to content</a>
  ${renderNav()}
  ${opts.body}
  ${renderFooter()}
</body>
</html>`;
}
// ── Nav / Footer ─────────────────────────────────────────────────────
function renderNav() {
    return `<header role="banner" class="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
    <input type="checkbox" id="ssr-mobile-toggle" class="ssr-mobile-checkbox" />
    <nav aria-label="Main navigation" class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
      <a href="/" class="flex items-center gap-2" aria-label="Kritano home">
        <img src="/brand/favicon-32.svg" alt="" width="28" height="28" role="presentation" />
        <span class="font-display text-xl text-slate-900">Kritano</span>
      </a>
      <div class="ssr-desktop-nav items-center gap-2 text-sm font-medium text-slate-600">
        <a href="/about" class="ssr-touch hover:text-slate-900 transition-colors rounded-md">About</a>
        <a href="/blog" class="ssr-touch text-indigo-600 font-semibold rounded-md" aria-current="page">Blog</a>
        <a href="/pricing" class="ssr-touch hover:text-slate-900 transition-colors rounded-md">Pricing</a>
        <a href="/docs" class="ssr-touch hover:text-slate-900 transition-colors rounded-md">API Docs</a>
        <a href="/contact" class="ssr-touch hover:text-slate-900 transition-colors rounded-md">Contact</a>
        <a href="/app" class="ssr-touch rounded-md bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">Dashboard</a>
      </div>
      <label for="ssr-mobile-toggle" class="ssr-hamburger ssr-touch-icon cursor-pointer text-slate-600 hover:text-slate-900" aria-label="Toggle menu">
        <svg class="ssr-hamburger-open w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
        <svg class="ssr-hamburger-close w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </label>
    </nav>
    <div class="ssr-mobile-menu border-t border-slate-200 bg-white">
      <div class="px-6 py-4 space-y-1 text-sm font-medium text-slate-600">
        <a href="/about" class="ssr-touch-block hover:text-slate-900 block">About</a>
        <a href="/blog" class="ssr-touch-block text-indigo-600 font-semibold block" aria-current="page">Blog</a>
        <a href="/pricing" class="ssr-touch-block hover:text-slate-900 block">Pricing</a>
        <a href="/docs" class="ssr-touch-block hover:text-slate-900 block">API Docs</a>
        <a href="/contact" class="ssr-touch-block hover:text-slate-900 block">Contact</a>
        <a href="/app" class="ssr-touch block rounded-md bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors text-center mt-2">Dashboard</a>
      </div>
    </div>
  </header>`;
}
function renderFooter() {
    return `<footer role="contentinfo" class="bg-slate-50 border-t border-slate-200 mt-16">
    <div class="max-w-7xl mx-auto px-6 py-12">
      <nav aria-label="Footer navigation" class="grid grid-cols-2 md:grid-cols-4 gap-8">
        <div>
          <a href="/" class="flex items-center gap-2 mb-4">
            <img src="/brand/favicon-32.svg" alt="" width="24" height="24" role="presentation" />
            <span class="font-display text-lg text-slate-900">Kritano</span>
          </a>
          <p class="text-sm text-slate-600">See what others miss.</p>
        </div>
        <div>
          <h2 class="font-semibold text-sm text-slate-900 mb-3">Product</h2>
          <ul class="space-y-1 text-sm text-slate-600">
            <li><a href="/pricing" class="ssr-touch-block hover:text-slate-900">Pricing</a></li>
            <li><a href="/docs" class="ssr-touch-block hover:text-slate-900">API Docs</a></li>
          </ul>
        </div>
        <div>
          <h2 class="font-semibold text-sm text-slate-900 mb-3">Company</h2>
          <ul class="space-y-1 text-sm text-slate-600">
            <li><a href="/about" class="ssr-touch-block hover:text-slate-900">About</a></li>
            <li><a href="/blog" class="ssr-touch-block hover:text-slate-900">Blog</a></li>
            <li><a href="/contact" class="ssr-touch-block hover:text-slate-900">Contact</a></li>
          </ul>
        </div>
        <div>
          <h2 class="font-semibold text-sm text-slate-900 mb-3">Resources</h2>
          <ul class="space-y-1 text-sm text-slate-600">
            <li><a href="/faq" class="ssr-touch-block hover:text-slate-900">FAQ</a></li>
            <li><a href="/author/chris-garlick" class="ssr-touch-block hover:text-slate-900">Author</a></li>
          </ul>
        </div>
      </nav>
      <div class="mt-10 pt-6 border-t border-slate-200 text-center text-xs text-slate-600">
        <p>&copy; ${new Date().getFullYear()} Kritano. All rights reserved.</p>
      </div>
    </div>
  </footer>`;
}
// ── Author Bio ───────────────────────────────────────────────────────
function renderAuthorBio() {
    return `<div class="border border-slate-200 rounded-xl p-6 bg-slate-50" itemprop="author" itemscope itemtype="https://schema.org/Person">
    <div class="flex items-start gap-5">
      <a href="/author/chris-garlick" class="flex-shrink-0">
        <img src="/brand/author-chris-garlick.png" alt="Chris Garlick" itemprop="image" width="72" height="72" class="rounded-full object-cover border-2 border-white shadow-sm" style="width:72px;height:72px" />
      </a>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-3 mb-1">
          <a href="/author/chris-garlick" class="font-semibold text-slate-900 hover:text-indigo-600 transition-colors underline decoration-slate-300 underline-offset-2" itemprop="name">Chris Garlick</a>
          <div class="flex items-center gap-2">
            <a href="https://uk.linkedin.com/in/chris-garlick-59a8bb91" target="_blank" rel="noopener noreferrer nofollow" class="ssr-touch-icon text-slate-400 hover:text-slate-900 transition-colors rounded-md" aria-label="LinkedIn profile">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            </a>
            <a href="https://x.com/ChrisGarlick123" target="_blank" rel="noopener noreferrer nofollow" class="ssr-touch-icon text-slate-400 hover:text-slate-900 transition-colors rounded-md" aria-label="X profile">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
          </div>
        </div>
        <p class="text-sm text-slate-600 mb-1" itemprop="jobTitle">Founder of Kritano</p>
        <p class="text-xs text-slate-600 mb-2" itemprop="qualifications">5 years in web development. I specialise in web auditing, WCAG 2.2 compliance, and search engine optimisation.</p>
        <p class="text-sm text-slate-700 leading-relaxed" itemprop="description">I built Kritano after years of running audits with fragmented tools. I write about SEO, accessibility, security, and performance based on real auditing data from thousands of scans.</p>
        <meta itemprop="url" content="${BASE_URL}/author/chris-garlick" />
        <meta itemprop="sameAs" content="https://uk.linkedin.com/in/chris-garlick-59a8bb91" />
        <meta itemprop="sameAs" content="https://x.com/ChrisGarlick123" />
      </div>
    </div>
  </div>`;
}
// ── Public API ────────────────────────────────────────────────────────
/**
 * Render a single blog post as a complete HTML page.
 */
function renderBlogPost(post) {
    const canonicalUrl = `${BASE_URL}/blog/${post.slug}`;
    const ogImage = post.featured_image_url
        ? (post.featured_image_url.startsWith('http') ? post.featured_image_url : `${BASE_URL}${post.featured_image_url}`)
        : `${BASE_URL}/og-image.png`;
    const structuredData = buildStructuredData(post);
    const structuredDataHtml = structuredData
        .map(sd => `<script type="application/ld+json">${JSON.stringify(sd)}</script>`)
        .join('\n  ');
    // Article-specific meta tags
    let extraHead = structuredDataHtml;
    extraHead += `\n  <meta property="article:author" content="${BASE_URL}/author/chris-garlick" />`;
    if (post.published_at)
        extraHead += `\n  <meta property="article:published_time" content="${post.published_at}" />`;
    if (post.updated_at)
        extraHead += `\n  <meta property="article:modified_time" content="${post.updated_at}" />`;
    if (post.category)
        extraHead += `\n  <meta property="article:section" content="${escapeHtml(CATEGORY_LABELS[post.category] || post.category)}" />`;
    for (const tag of post.tags) {
        extraHead += `\n  <meta property="article:tag" content="${escapeHtml(tag)}" />`;
    }
    if (post.focus_keyword) {
        extraHead += `\n  <meta name="keywords" content="${escapeHtml([post.focus_keyword, ...(post.secondary_keywords || []), ...post.tags].join(', '))}" />`;
    }
    // Featured image
    let featuredImageHtml = '';
    if (post.featured_image_url) {
        const webpUrl = post.featured_image_url.replace('/original/', '/webp/').replace(/\.(png|jpe?g|gif)$/i, '.webp');
        const thumbUrl = post.featured_image_url.replace('/original/', '/thumbnails/').replace(/\.(png|gif)$/i, '.jpg');
        featuredImageHtml = `<figure class="mb-10 -mx-4 sm:mx-0">
      <picture>
        <source srcset="${escapeHtml(webpUrl)}" type="image/webp" />
        <img src="${escapeHtml(post.featured_image_url)}" srcset="${escapeHtml(thumbUrl)} 400w, ${escapeHtml(post.featured_image_url)} 1200w" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 768px" alt="${escapeHtml(post.featured_image_alt || `Featured image for ${post.title}`)}" class="w-full h-auto rounded-xl" style="aspect-ratio: 1200 / 630;" loading="eager" fetchpriority="high" width="1200" height="630" />
      </picture>
    </figure>`;
        extraHead += `\n  <link rel="preload" as="image" href="${escapeHtml(webpUrl)}" type="image/webp" />`;
    }
    // Render content blocks
    const contentHtml = post.content.map(renderBlock).join('\n');
    // Tags
    let tagsHtml = '';
    if (post.tags.length > 0) {
        tagsHtml = `<div class="mt-12 pt-8 border-t border-slate-200">
      <div class="flex items-center gap-2 flex-wrap">
        <svg class="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
        ${post.tags.map(tag => `<a href="/blog?tag=${encodeURIComponent(tag)}" class="ssr-tag text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors">#${escapeHtml(tag)}</a>`).join('\n        ')}
      </div>
    </div>`;
    }
    const body = `<main id="main-content">
    <article class="max-w-3xl mx-auto px-6 lg:px-20 py-12 lg:py-20">
      <a href="/blog" class="ssr-touch text-sm text-slate-600 hover:text-indigo-600 mb-10 transition-colors gap-1.5">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        Back to blog
      </a>
      <header class="mb-10">
        <div class="flex items-center gap-3 mb-5">
          <a href="/blog?category=${encodeURIComponent(post.category)}" class="ssr-touch text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100 transition-colors uppercase tracking-wider">${escapeHtml(CATEGORY_LABELS[post.category] || post.category)}</a>
          <span class="flex items-center gap-1 text-sm text-slate-600">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            ${post.reading_time_minutes} min read
          </span>
        </div>
        <h1 class="font-display text-4xl lg:text-5xl text-slate-900 leading-tight mb-4">${escapeHtml(post.title)}</h1>
        ${post.subtitle ? `<p class="text-xl text-slate-600 leading-relaxed">${escapeHtml(post.subtitle)}</p>` : ''}
        <div class="mt-6 flex items-center gap-4 text-sm text-slate-600">
          <a href="/author/chris-garlick" class="font-medium text-slate-600 hover:text-indigo-600 transition-colors">${escapeHtml(post.author_name)}</a>
          ${post.published_at ? `<time datetime="${formatIsoDate(post.published_at)}" class="flex items-center gap-1">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            ${formatDate(post.published_at)}
          </time>` : ''}
        </div>
      </header>
      ${featuredImageHtml}
      <div class="prose prose-lg prose-slate max-w-none prose-headings:font-bold prose-headings:text-slate-900 prose-p:text-slate-600 prose-p:leading-relaxed prose-a:text-indigo-600 prose-a:underline prose-a:decoration-indigo-300 prose-a:underline-offset-2 prose-img:rounded-lg prose-pre:bg-slate-900">
        ${contentHtml}
      </div>
      ${tagsHtml}
      <div class="mt-12 pt-8 border-t border-slate-200">
        ${renderAuthorBio()}
      </div>
    </article>
  </main>`;
    return htmlShell({
        title: `${post.seo_title || post.title} | Kritano`,
        description: post.seo_description || post.excerpt,
        canonicalUrl,
        ogImage,
        ogType: 'article',
        extraHead,
        body,
    });
}
/**
 * Render the blog listing page as a complete HTML page.
 */
function renderBlogListing(posts, total, page, totalPages, category, tag) {
    let title = 'Blog';
    let description = 'Insights on SEO, accessibility, security, and web performance from the Kritano team.';
    if (category) {
        title = `${CATEGORY_LABELS[category] || category} - Blog`;
        description = `${CATEGORY_LABELS[category] || category} articles from the Kritano blog.`;
    }
    if (tag) {
        title = `#${tag} - Blog`;
        description = `Articles tagged with "${tag}" from the Kritano blog.`;
    }
    const canonicalPath = category ? `/blog?category=${encodeURIComponent(category)}` : tag ? `/blog?tag=${encodeURIComponent(tag)}` : '/blog';
    const canonicalUrl = `${BASE_URL}${canonicalPath}`;
    // Pagination link tags
    let extraHead = '';
    if (page > 1)
        extraHead += `<link rel="prev" href="${BASE_URL}/blog?page=${page - 1}${category ? `&category=${encodeURIComponent(category)}` : ''}${tag ? `&tag=${encodeURIComponent(tag)}` : ''}" />`;
    if (page < totalPages)
        extraHead += `\n  <link rel="next" href="${BASE_URL}/blog?page=${page + 1}${category ? `&category=${encodeURIComponent(category)}` : ''}${tag ? `&tag=${encodeURIComponent(tag)}` : ''}" />`;
    // Blog listing structured data
    extraHead += `\n  <script type="application/ld+json">${JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Blog',
        name: 'Kritano Blog',
        description,
        url: `${BASE_URL}/blog`,
        publisher: { '@type': 'Organization', name: 'Kritano', url: BASE_URL },
    })}</script>`;
    extraHead += `\n  <script type="application/ld+json">${JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
            { '@type': 'ListItem', position: 2, name: 'Blog', item: `${BASE_URL}/blog` },
        ],
    })}</script>`;
    // Post cards
    const postsHtml = posts.map(post => {
        const webpUrl = post.featured_image_url
            ? post.featured_image_url.replace('/original/', '/webp/').replace(/\.(png|jpe?g|gif)$/i, '.webp')
            : '';
        const thumbUrl = post.featured_image_url
            ? post.featured_image_url.replace('/original/', '/thumbnails/').replace(/\.(png|gif)$/i, '.jpg')
            : '';
        const imageHtml = post.featured_image_url
            ? `<picture>
          <source srcset="${escapeHtml(webpUrl)}" type="image/webp" />
          <img src="${escapeHtml(post.featured_image_url)}" srcset="${escapeHtml(thumbUrl)} 400w, ${escapeHtml(post.featured_image_url)} 640w" sizes="(max-width: 768px) 100vw, 33vw" alt="" role="presentation" class="w-full h-48 object-cover" loading="lazy" width="400" height="192" />
        </picture>`
            : '';
        return `<a href="/blog/${escapeHtml(post.slug)}" class="group bg-white border border-slate-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      ${imageHtml}
      <div class="p-5">
        <span class="text-xs font-semibold text-indigo-600 uppercase tracking-wider">${escapeHtml(CATEGORY_LABELS[post.category] || post.category)}</span>
        <h2 class="mt-2 font-semibold text-lg text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">${escapeHtml(post.title)}</h2>
        <p class="mt-2 text-sm text-slate-600 line-clamp-3">${escapeHtml(post.excerpt)}</p>
        <div class="mt-3 flex items-center gap-3 text-xs text-slate-600">
          ${post.published_at ? `<time datetime="${formatIsoDate(post.published_at)}">${formatDate(post.published_at)}</time>` : ''}
          <span>${post.reading_time_minutes} min read</span>
        </div>
      </div>
    </a>`;
    }).join('\n');
    // Pagination
    let paginationHtml = '';
    if (totalPages > 1) {
        const params = new URLSearchParams();
        if (category)
            params.set('category', category);
        if (tag)
            params.set('tag', tag);
        const links = [];
        if (page > 1) {
            params.set('page', String(page - 1));
            links.push(`<a href="/blog?${params}" class="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50">Previous</a>`);
        }
        links.push(`<span class="px-4 py-2 text-sm text-slate-600">Page ${page} of ${totalPages}</span>`);
        if (page < totalPages) {
            params.set('page', String(page + 1));
            links.push(`<a href="/blog?${params}" class="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50">Next</a>`);
        }
        paginationHtml = `<nav class="mt-12 flex items-center justify-center gap-4" aria-label="Pagination">${links.join('\n')}</nav>`;
    }
    const body = `<main id="main-content" class="max-w-7xl mx-auto px-6 py-12 lg:py-20">
    <header class="mb-10">
      <h1 class="font-display text-4xl text-slate-900 mb-3">${escapeHtml(title)}</h1>
      <p class="text-lg text-slate-600">${escapeHtml(description)}</p>
    </header>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      ${postsHtml}
    </div>
    ${paginationHtml}
  </main>`;
    return htmlShell({
        title: `${title} | Kritano`,
        description,
        canonicalUrl,
        ogImage: `${BASE_URL}/brand/og-blog.png`,
        ogType: 'website',
        extraHead,
        body,
    });
}
/**
 * Render a 404 page for missing blog posts.
 */
function renderBlogNotFound() {
    return htmlShell({
        title: 'Post Not Found | Kritano',
        description: 'The article you are looking for does not exist or has been removed.',
        canonicalUrl: `${BASE_URL}/blog`,
        ogImage: `${BASE_URL}/og-image.png`,
        ogType: 'website',
        extraHead: '<meta name="robots" content="noindex" />',
        body: `<main id="main-content" class="flex items-center justify-center py-32">
      <div class="text-center">
        <h1 class="font-display text-3xl text-slate-900 mb-3">Post not found</h1>
        <p class="text-slate-600 mb-6">The article you are looking for does not exist or has been removed.</p>
        <a href="/blog" class="text-indigo-600 hover:text-indigo-700 font-medium">&larr; Back to blog</a>
      </div>
    </main>`,
    });
}
//# sourceMappingURL=blog-ssr.service.js.map