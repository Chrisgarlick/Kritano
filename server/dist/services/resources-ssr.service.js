"use strict";
/**
 * Resources SSR Service
 *
 * Renders the three pages of the gated resource library as complete HTML
 * documents server-side. Mirrors the pattern of blog-ssr.service.ts and
 * compare-ssr.service.ts so the marketing surface stays consistent.
 *
 * See /docs/gated-resources.md for the feature plan.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderResourcesList = renderResourcesList;
exports.renderResourceDetail = renderResourceDetail;
exports.renderResourceThanks = renderResourceThanks;
exports.renderResourceNotFound = renderResourceNotFound;
exports.renderFormError = renderFormError;
const marked_1 = require("marked");
const ssr_shared_service_js_1 = require("./ssr-shared.service.js");
// ── Constants ───────────────────────────────────────────────────────
const CATEGORY_LABELS = {
    seo: 'SEO',
    accessibility: 'Accessibility',
    security: 'Security',
    performance: 'Performance',
    'content-quality': 'Content Quality',
    'structured-data': 'Structured Data',
    eeat: 'E-E-A-T',
    aeo: 'AEO',
    guides: 'Guides',
    'case-studies': 'Case Studies',
    'product-updates': 'Product Updates',
};
const FORMAT_LABELS = {
    md: 'Markdown',
    pdf: 'PDF',
    html: 'HTML',
    docx: 'Word (DOCX)',
};
const FORMAT_DESCRIPTIONS = {
    md: 'Plain markdown for your team wiki or docs system.',
    pdf: 'Branded, printable PDF for sharing and printing.',
    html: 'Standalone HTML you can view in any browser.',
    docx: 'Editable Word document for tweaks and white-labelling.',
};
// ── Helpers ─────────────────────────────────────────────────────────
function renderMarkdown(md) {
    return marked_1.marked.parse(md, { async: false });
}
function formatDate(iso) {
    return new Date(iso).toLocaleDateString('en-GB', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });
}
function categoryLabel(category) {
    return CATEGORY_LABELS[category] ?? category;
}
function isTypesetEnabled() {
    return process.env.TYPESET_ENABLED === 'true';
}
/** True when this format needs typeset to be rendered. */
function requiresTypeset(format) {
    return format !== 'md';
}
// ── Resource card (used on the list page) ───────────────────────────
function renderResourceCard(r) {
    const formats = r.formats
        .map((f) => `<span class="inline-flex items-center px-2 py-0.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-md uppercase tracking-wider">${(0, ssr_shared_service_js_1.escapeHtml)(f)}</span>`)
        .join('\n        ');
    return `<a href="/resources/${(0, ssr_shared_service_js_1.escapeHtml)(r.slug)}" class="block group bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all">
    <div class="flex items-center gap-2 mb-3 text-xs font-semibold text-indigo-600 uppercase tracking-wider">
      ${(0, ssr_shared_service_js_1.escapeHtml)(categoryLabel(r.category))}
    </div>
    <h2 class="font-display text-2xl text-slate-900 leading-tight mb-3 group-hover:text-indigo-600 transition-colors">${(0, ssr_shared_service_js_1.escapeHtml)(r.title)}</h2>
    <p class="text-sm text-slate-600 leading-relaxed mb-5">${(0, ssr_shared_service_js_1.escapeHtml)(r.hook)}</p>
    <div class="flex items-center gap-2 flex-wrap mb-5">
      ${formats}
    </div>
    <div class="flex items-center justify-between text-sm">
      <span class="text-indigo-600 font-medium inline-flex items-center gap-1">
        Get it free
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
      </span>
      ${r.page_count ? `<span class="text-xs text-slate-500">${r.page_count} pages</span>` : ''}
    </div>
  </a>`;
}
// ── List page ───────────────────────────────────────────────────────
function renderResourcesList(resources) {
    const grouped = new Map();
    for (const r of resources) {
        const arr = grouped.get(r.category) ?? [];
        arr.push(r);
        grouped.set(r.category, arr);
    }
    const groupBlocks = [...grouped.entries()]
        .map(([category, items]) => `<section class="mb-12">
        <h2 class="font-display text-3xl text-slate-900 mb-6">${(0, ssr_shared_service_js_1.escapeHtml)(categoryLabel(category))}</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${items.map(renderResourceCard).join('\n          ')}
        </div>
      </section>`)
        .join('\n      ');
    const emptyState = `<div class="text-center py-20">
        <p class="text-slate-600">No resources are available yet. Check back soon.</p>
      </div>`;
    const itemListJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        itemListElement: resources.map((r, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            url: `${ssr_shared_service_js_1.BASE_URL}/resources/${r.slug}`,
            name: r.title,
        })),
    };
    const body = `<main id="main-content">
    <section class="bg-gradient-to-b from-indigo-50 to-white border-b border-slate-200">
      <div class="max-w-7xl mx-auto px-6 lg:px-12 py-16 lg:py-20 text-center">
        <p class="inline-block px-3 py-1 text-xs font-semibold text-indigo-600 bg-indigo-100 rounded-full uppercase tracking-wider mb-4">Free resource library</p>
        <h1 class="font-display text-5xl lg:text-6xl text-slate-900 leading-tight mb-5">Tools, checklists and references for better websites.</h1>
        <p class="max-w-2xl mx-auto text-lg text-slate-600 leading-relaxed">Practical downloads built from real audit data. Free for everyone, no signup required if you already have a Kritano account.</p>
      </div>
    </section>
    <div class="max-w-7xl mx-auto px-6 lg:px-12 py-16">
      ${resources.length > 0 ? groupBlocks : emptyState}
    </div>
  </main>`;
    const extraHead = `<script type="application/ld+json">${JSON.stringify(itemListJsonLd)}</script>`;
    return (0, ssr_shared_service_js_1.htmlShell)({
        title: 'Free Resources | Kritano',
        description: 'Free checklists, references and guides for SEO, accessibility, security, performance and AI readiness. Download as Markdown or PDF.',
        canonicalUrl: `${ssr_shared_service_js_1.BASE_URL}/resources`,
        ogImage: `${ssr_shared_service_js_1.BASE_URL}/og-image.png`,
        ogType: 'website',
        extraHead,
        body,
        activePath: '/resources',
    });
}
function renderResourceDetail(opts) {
    const { resource, loggedIn } = opts;
    const typesetReady = isTypesetEnabled();
    // Render the preview MD to HTML for the left column.
    const previewHtml = renderMarkdown(resource.preview_md);
    // Right column: form OR direct download buttons depending on auth state.
    const chooserHtml = loggedIn
        ? renderLoggedInChooser(resource, typesetReady)
        : renderGateForm(resource, typesetReady);
    const learningResourceJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'LearningResource',
        name: resource.title,
        description: resource.hook,
        url: `${ssr_shared_service_js_1.BASE_URL}/resources/${resource.slug}`,
        learningResourceType: 'Reference',
        educationalLevel: 'Professional',
        inLanguage: 'en-GB',
        provider: {
            '@type': 'Organization',
            name: 'Kritano',
            url: ssr_shared_service_js_1.BASE_URL,
        },
        about: categoryLabel(resource.category),
        dateModified: resource.updated_at,
    };
    const breadcrumbJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            {
                '@type': 'ListItem',
                position: 1,
                name: 'Resources',
                item: `${ssr_shared_service_js_1.BASE_URL}/resources`,
            },
            {
                '@type': 'ListItem',
                position: 2,
                name: resource.title,
                item: `${ssr_shared_service_js_1.BASE_URL}/resources/${resource.slug}`,
            },
        ],
    };
    const extraHead = `<script type="application/ld+json">${JSON.stringify(learningResourceJsonLd)}</script>\n  ` +
        `<script type="application/ld+json">${JSON.stringify(breadcrumbJsonLd)}</script>`;
    const body = `<main id="main-content">
    <article class="max-w-6xl mx-auto px-6 lg:px-12 py-12 lg:py-16">
      <a href="/resources" class="ssr-touch text-sm text-slate-600 hover:text-indigo-600 mb-8 transition-colors gap-1.5">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        All resources
      </a>
      <header class="mb-10">
        <p class="inline-block px-2.5 py-1 text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-md uppercase tracking-wider mb-4">${(0, ssr_shared_service_js_1.escapeHtml)(categoryLabel(resource.category))}</p>
        <h1 class="font-display text-4xl lg:text-5xl text-slate-900 leading-tight mb-4">${(0, ssr_shared_service_js_1.escapeHtml)(resource.title)}</h1>
        ${resource.subtitle ? `<p class="text-xl text-slate-600 leading-relaxed mb-2">${(0, ssr_shared_service_js_1.escapeHtml)(resource.subtitle)}</p>` : ''}
        <p class="text-lg text-slate-700 leading-relaxed">${(0, ssr_shared_service_js_1.escapeHtml)(resource.hook)}</p>
        ${resource.audience ? `<p class="mt-3 text-sm text-slate-500"><span class="font-semibold text-slate-700">For:</span> ${(0, ssr_shared_service_js_1.escapeHtml)(resource.audience)}</p>` : ''}
      </header>
      <div class="grid grid-cols-1 lg:grid-cols-5 gap-10">
        <div class="lg:col-span-3">
          <div class="prose prose-slate max-w-none prose-headings:font-bold prose-headings:text-slate-900 prose-p:text-slate-700 prose-p:leading-relaxed prose-a:text-indigo-600 prose-a:underline prose-a:decoration-indigo-300 prose-a:underline-offset-2 prose-ul:text-slate-700 prose-li:my-1">
            ${previewHtml}
          </div>
          <div class="mt-10 p-5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 leading-relaxed">
            ${(0, ssr_shared_service_js_1.escapeHtml)(resource.description)}
          </div>
        </div>
        <aside class="lg:col-span-2">
          <div class="lg:sticky lg:top-24">
            ${chooserHtml}
          </div>
        </aside>
      </div>
    </article>
  </main>`;
    return (0, ssr_shared_service_js_1.htmlShell)({
        title: `${resource.title} | Free Resource | Kritano`,
        description: resource.hook,
        canonicalUrl: `${ssr_shared_service_js_1.BASE_URL}/resources/${resource.slug}`,
        ogImage: `${ssr_shared_service_js_1.BASE_URL}/og-image.png`,
        ogType: 'article',
        extraHead,
        body,
        activePath: '/resources',
    });
}
// ── Form (anonymous) ────────────────────────────────────────────────
function renderGateForm(resource, typesetReady) {
    const availableFormats = resource.formats.filter((f) => !requiresTypeset(f) || typesetReady);
    const pendingFormats = resource.formats.filter((f) => requiresTypeset(f) && !typesetReady);
    const formatsListHtml = availableFormats
        .map((f) => `<li class="flex items-center gap-2 text-sm text-slate-700">
          <svg class="w-4 h-4 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
          <span><strong class="font-semibold text-slate-900">${(0, ssr_shared_service_js_1.escapeHtml)(FORMAT_LABELS[f])}</strong> · ${(0, ssr_shared_service_js_1.escapeHtml)(FORMAT_DESCRIPTIONS[f])}</span>
        </li>`)
        .join('\n          ');
    const pendingHtml = pendingFormats.length > 0
        ? `<div class="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-900">
            <strong class="font-semibold">${pendingFormats.map((f) => FORMAT_LABELS[f]).join(' and ')}</strong> ${pendingFormats.length === 1 ? 'is' : 'are'} being prepared. We'll email you the moment ${pendingFormats.length === 1 ? 'it is' : 'they are'} ready.
          </div>`
        : '';
    return `<div class="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
    <h2 class="font-display text-2xl text-slate-900 mb-1">Get this resource</h2>
    <p class="text-sm text-slate-600 mb-5">Enter your email and we'll send the download link.</p>
    <ul class="space-y-2 mb-5">
      ${formatsListHtml}
    </ul>
    ${pendingHtml}
    <form method="POST" action="/resources/${(0, ssr_shared_service_js_1.escapeHtml)(resource.slug)}/request" class="space-y-4 mt-5" novalidate>
      <input type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" class="sr-only" />
      <div>
        <label for="email" class="block text-sm font-medium text-slate-700 mb-1.5">Work email</label>
        <input
          type="email"
          id="email"
          name="email"
          required
          maxlength="255"
          placeholder="you@company.com"
          class="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
      <label class="flex items-start gap-2.5 text-sm text-slate-700 cursor-pointer">
        <input type="checkbox" name="consentNewsletter" value="true" class="mt-0.5 w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500" />
        <span>Also send me Kritano's weekly insights on auditing, SEO and accessibility. Unsubscribe any time.</span>
      </label>
      <button
        type="submit"
        class="w-full px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
      >
        Get the download link
      </button>
      <p class="text-xs text-slate-500 leading-relaxed">
        We use your email only to deliver this resource and, if you opt in, our newsletter.
        <a href="/privacy" class="underline hover:text-slate-700">Read our privacy policy</a>.
      </p>
    </form>
    <p class="mt-5 pt-5 border-t border-slate-100 text-xs text-slate-500 text-center">
      Already have a Kritano account? <a href="/login?next=/resources/${(0, ssr_shared_service_js_1.escapeHtml)(resource.slug)}" class="text-indigo-600 hover:text-indigo-700 font-medium">Sign in</a> to skip this step.
    </p>
  </div>`;
}
// ── Direct download chooser (logged-in) ─────────────────────────────
function renderLoggedInChooser(resource, typesetReady) {
    const buttons = resource.formats
        .map((f) => {
        const ready = !requiresTypeset(f) || typesetReady;
        if (ready) {
            return `<a href="/api/resources/${(0, ssr_shared_service_js_1.escapeHtml)(resource.slug)}/download/${(0, ssr_shared_service_js_1.escapeHtml)(f)}" class="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg hover:border-indigo-300 hover:shadow-sm transition-all group">
          <div>
            <p class="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">${(0, ssr_shared_service_js_1.escapeHtml)(FORMAT_LABELS[f])}</p>
            <p class="text-xs text-slate-500 mt-0.5">${(0, ssr_shared_service_js_1.escapeHtml)(FORMAT_DESCRIPTIONS[f])}</p>
          </div>
          <svg class="w-5 h-5 text-indigo-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12" /></svg>
        </a>`;
        }
        return `<div class="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-lg">
          <div>
            <p class="font-semibold text-slate-500">${(0, ssr_shared_service_js_1.escapeHtml)(FORMAT_LABELS[f])}</p>
            <p class="text-xs text-slate-500 mt-0.5">Preparing. We'll email you when it's ready.</p>
          </div>
          <svg class="w-5 h-5 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>`;
    })
        .join('\n      ');
    return `<div class="bg-indigo-50 border border-indigo-200 rounded-xl shadow-sm p-6">
    <div class="flex items-center gap-2 mb-1">
      <svg class="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      <p class="text-sm font-semibold text-emerald-700">You're signed in. Download instantly.</p>
    </div>
    <p class="text-xs text-slate-600 mb-5">No email gate. Pick a format below.</p>
    <div class="space-y-3">
      ${buttons}
    </div>
  </div>`;
}
function renderResourceThanks(opts) {
    const { resource, token } = opts;
    const typesetReady = isTypesetEnabled();
    const buttons = resource.formats
        .map((f) => {
        const ready = !requiresTypeset(f) || typesetReady;
        if (ready) {
            return `<a href="/api/resources/${(0, ssr_shared_service_js_1.escapeHtml)(resource.slug)}/download/${(0, ssr_shared_service_js_1.escapeHtml)(f)}?token=${encodeURIComponent(token)}" class="flex items-center justify-between p-5 bg-white border-2 border-indigo-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all group">
          <div>
            <p class="font-display text-xl text-slate-900 group-hover:text-indigo-600 transition-colors">${(0, ssr_shared_service_js_1.escapeHtml)(FORMAT_LABELS[f])}</p>
            <p class="text-sm text-slate-600 mt-1">${(0, ssr_shared_service_js_1.escapeHtml)(FORMAT_DESCRIPTIONS[f])}</p>
          </div>
          <svg class="w-6 h-6 text-indigo-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12" /></svg>
        </a>`;
        }
        return `<div class="flex items-center justify-between p-5 bg-slate-50 border-2 border-slate-200 rounded-lg">
          <div>
            <p class="font-display text-xl text-slate-500">${(0, ssr_shared_service_js_1.escapeHtml)(FORMAT_LABELS[f])}</p>
            <p class="text-sm text-slate-500 mt-1">Preparing. We'll email you when it's ready.</p>
          </div>
          <svg class="w-6 h-6 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>`;
    })
        .join('\n        ');
    const body = `<main id="main-content">
    <div class="max-w-3xl mx-auto px-6 py-16 lg:py-24">
      <div class="text-center mb-12">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-6">
          <svg class="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
        </div>
        <h1 class="font-display text-4xl lg:text-5xl text-slate-900 leading-tight mb-4">Your download is ready</h1>
        <p class="text-lg text-slate-600 leading-relaxed">Pick a format below. We've also emailed you the same links so you can come back later.</p>
      </div>
      <div class="mb-8">
        <p class="text-sm font-semibold text-slate-700 mb-3">${(0, ssr_shared_service_js_1.escapeHtml)(resource.title)}</p>
        <div class="space-y-3">
          ${buttons}
        </div>
      </div>
      <p class="text-center text-sm text-slate-600 mt-12">
        <a href="/resources" class="text-indigo-600 hover:text-indigo-700 font-medium">Browse the rest of the library →</a>
      </p>
    </div>
  </main>`;
    return (0, ssr_shared_service_js_1.htmlShell)({
        title: `${resource.title}: your download is ready | Kritano`,
        description: `Download ${resource.title} in your preferred format.`,
        canonicalUrl: `${ssr_shared_service_js_1.BASE_URL}/resources/${resource.slug}/thanks`,
        ogImage: `${ssr_shared_service_js_1.BASE_URL}/og-image.png`,
        ogType: 'website',
        extraHead: '<meta name="robots" content="noindex,follow" />',
        body,
        activePath: '/resources',
    });
}
// ── Not found ───────────────────────────────────────────────────────
function renderResourceNotFound() {
    const body = `<main id="main-content">
    <div class="max-w-2xl mx-auto px-6 py-24 text-center">
      <h1 class="font-display text-5xl text-slate-900 mb-4">Resource not found</h1>
      <p class="text-lg text-slate-600 mb-8">We couldn't find what you were looking for. Browse the full library to find something useful.</p>
      <a href="/resources" class="inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors">All resources</a>
    </div>
  </main>`;
    return (0, ssr_shared_service_js_1.htmlShell)({
        title: 'Resource not found | Kritano',
        description: 'The resource you were looking for is not available.',
        canonicalUrl: `${ssr_shared_service_js_1.BASE_URL}/resources`,
        ogImage: `${ssr_shared_service_js_1.BASE_URL}/og-image.png`,
        ogType: 'website',
        extraHead: '<meta name="robots" content="noindex,nofollow" />',
        body,
        activePath: '/resources',
    });
}
function renderFormError(opts) {
    const { resource, errorMessage } = opts;
    const body = `<main id="main-content">
    <div class="max-w-2xl mx-auto px-6 py-24 text-center">
      <h1 class="font-display text-4xl text-slate-900 mb-4">${(0, ssr_shared_service_js_1.escapeHtml)(errorMessage)}</h1>
      <p class="text-lg text-slate-600 mb-8">Please head back and try again.</p>
      <a href="/resources/${(0, ssr_shared_service_js_1.escapeHtml)(resource.slug)}" class="inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors">Back to ${(0, ssr_shared_service_js_1.escapeHtml)(resource.title)}</a>
    </div>
  </main>`;
    return (0, ssr_shared_service_js_1.htmlShell)({
        title: 'Could not process your request | Kritano',
        description: errorMessage,
        canonicalUrl: `${ssr_shared_service_js_1.BASE_URL}/resources/${resource.slug}`,
        ogImage: `${ssr_shared_service_js_1.BASE_URL}/og-image.png`,
        ogType: 'website',
        extraHead: '<meta name="robots" content="noindex,nofollow" />',
        body,
        activePath: '/resources',
    });
}
//# sourceMappingURL=resources-ssr.service.js.map