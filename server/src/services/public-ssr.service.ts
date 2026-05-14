/**
 * Public Pages SSR Service
 *
 * Renders public marketing pages as complete HTML documents server-side.
 * This ensures search engines, AI crawlers, and fetch tools see full content
 * without needing JavaScript execution.
 */

import {
  BASE_URL,
  escapeHtml,
  htmlShell,
  renderAuthorBio,
} from './ssr-shared.service.js';

// ── Structured Data Helpers ─────────────────────────────────────────

function jsonLd(data: Record<string, unknown>): string {
  return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
}

// ── Homepage ────────────────────────────────────────────────────────

export function renderHomepage(): string {
  const structuredData = [
    jsonLd({
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Kritano',
      description: 'Comprehensive website auditing for SEO, accessibility, security, and performance.',
      applicationCategory: 'WebApplication',
      operatingSystem: 'Any',
      url: 'https://kritano.com',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      creator: { '@type': 'Organization', name: 'Kritano', url: 'https://kritano.com' },
    }),
    jsonLd({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Kritano',
      url: 'https://kritano.com',
      description: 'Kritano audits your website for SEO, accessibility, security, and performance issues. See what others miss.',
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://kritano.com/blog?search={search_term_string}',
        'query-input': 'required name=search_term_string',
      },
    }),
  ].join('\n  ');

  const body = `<main id="main-content" aria-label="Page content">

    <!-- Hero Section -->
    <section class="relative overflow-hidden">
      <div class="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] bg-[size:24px_24px] opacity-40 pointer-events-none"></div>
      <div class="absolute -top-8 -right-8 w-72 h-72 bg-indigo-50 rounded-full opacity-60 blur-3xl pointer-events-none"></div>
      <div class="absolute top-1/2 -left-16 w-48 h-48 bg-amber-50 rounded-full opacity-60 blur-3xl pointer-events-none"></div>

      <div class="max-w-7xl mx-auto px-6 lg:px-20 pt-20 lg:pt-28 pb-20 relative">
        <div class="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
          <div>
            <h1 class="font-display text-5xl lg:text-[4.25rem] text-slate-900 leading-[1.08] mb-3">
              Website Auditing Platform
            </h1>
            <h2 class="font-display text-2xl lg:text-3xl text-slate-600 leading-snug mb-7">
              The clarity your website deserves.
            </h2>
            <p class="text-lg text-slate-600 leading-relaxed mb-4 max-w-lg">
              Kritano is a website auditing platform that checks your site for SEO, accessibility, security, and performance issues. It runs over 500 rules in a single scan and shows you exactly what to fix.
            </p>
            <p class="text-base text-slate-600 leading-relaxed mb-10 max-w-lg">
              According to <a href="https://webaim.org/projects/million/" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:text-indigo-700 underline decoration-indigo-300 underline-offset-2">WebAIM</a>, 95.9% of websites have detectable accessibility failures. In our testing, most sites also have security header gaps and SEO issues they do not know about.
            </p>
            <div class="flex flex-wrap items-center gap-4">
              <a href="/register?ea=email" class="inline-flex items-center justify-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors text-sm">Join Early Access</a>
              <a href="/services" class="inline-flex items-center gap-2 px-6 py-3 text-slate-700 hover:text-slate-900 font-medium transition-colors text-sm">Learn More
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
              </a>
            </div>
          </div>

          <!-- Static audit demo snapshot -->
          <div class="relative">
            <div class="absolute -top-6 -right-6 w-64 h-64 bg-indigo-50 rounded-full opacity-60"></div>
            <div class="absolute -bottom-6 -left-6 w-40 h-40 bg-amber-50 rounded-full opacity-60"></div>
            <div class="relative bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden">
              <div class="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div class="flex items-center gap-2">
                  <div class="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span class="text-[11px] font-medium text-slate-600 uppercase tracking-wider">Audit Complete</span>
                </div>
                <div class="flex gap-1.5">
                  <div class="w-2.5 h-2.5 rounded-full bg-slate-200"></div>
                  <div class="w-2.5 h-2.5 rounded-full bg-slate-200"></div>
                  <div class="w-2.5 h-2.5 rounded-full bg-slate-200"></div>
                </div>
              </div>
              <div class="px-5 py-5">
                <div class="flex items-center gap-5 mb-4">
                  <div class="text-center">
                    <p class="font-display text-3xl text-slate-900">87</p>
                    <p class="text-[11px] text-slate-600 uppercase tracking-wider">Overall</p>
                  </div>
                  <div class="flex-1">
                    <p class="text-[11px] font-medium text-slate-600 uppercase tracking-wider mb-0.5">Overall Health</p>
                    <p class="text-sm text-slate-600">Good - 1 area to improve</p>
                  </div>
                </div>
                <div class="grid grid-cols-5 gap-1.5 mb-4">
                  <div class="flex flex-col items-center p-2 bg-slate-50 rounded-lg">
                    <span class="text-[9px] font-medium text-slate-600 uppercase tracking-wider mb-1">SEO</span>
                    <span class="font-display text-lg text-slate-900">92</span>
                  </div>
                  <div class="flex flex-col items-center p-2 bg-slate-50 rounded-lg">
                    <span class="text-[9px] font-medium text-slate-600 uppercase tracking-wider mb-1">A11Y</span>
                    <span class="font-display text-lg text-slate-900">78</span>
                  </div>
                  <div class="flex flex-col items-center p-2 bg-slate-50 rounded-lg">
                    <span class="text-[9px] font-medium text-slate-600 uppercase tracking-wider mb-1">Sec</span>
                    <span class="font-display text-lg text-slate-900">95</span>
                  </div>
                  <div class="flex flex-col items-center p-2 bg-slate-50 rounded-lg">
                    <span class="text-[9px] font-medium text-slate-600 uppercase tracking-wider mb-1">Perf</span>
                    <span class="font-display text-lg text-slate-900">83</span>
                  </div>
                  <div class="flex flex-col items-center p-2 bg-slate-50 rounded-lg">
                    <span class="text-[9px] font-medium text-slate-600 uppercase tracking-wider mb-1">Cont</span>
                    <span class="font-display text-lg text-slate-900">88</span>
                  </div>
                </div>
                <div class="border-t border-slate-100 pt-3 space-y-2">
                  <div class="flex items-center gap-2.5 py-1.5">
                    <svg class="w-3.5 h-3.5 flex-shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    <span class="text-xs text-slate-700 flex-1">Images missing alt text</span>
                    <span class="text-[10px] text-slate-600 tabular-nums">12 pages</span>
                  </div>
                  <div class="flex items-center gap-2.5 py-1.5">
                    <svg class="w-3.5 h-3.5 flex-shrink-0 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                    <span class="text-xs text-slate-700 flex-1">Missing meta descriptions</span>
                    <span class="text-[10px] text-slate-600 tabular-nums">5 pages</span>
                  </div>
                  <div class="flex items-center gap-2.5 py-1.5">
                    <svg class="w-3.5 h-3.5 flex-shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                    <span class="text-xs text-slate-700 flex-1">Heading hierarchy skip</span>
                    <span class="text-[10px] text-slate-600 tabular-nums">8 pages</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Social Proof Bar -->
    <section class="border-y border-slate-100 bg-white">
      <div class="max-w-7xl mx-auto px-6 lg:px-20 py-6">
        <div class="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs font-medium uppercase tracking-wider text-slate-600">
          <span>No credit card required</span>
          <span class="hidden sm:inline" aria-hidden="true">&middot;</span>
          <span>Free forever plan</span>
          <span class="hidden sm:inline" aria-hidden="true">&middot;</span>
          <span>Audits in under 2 minutes</span>
        </div>
      </div>
    </section>

    <!-- Content Intelligence -->
    <section class="bg-gradient-to-br from-teal-50 via-white to-indigo-50/30 border-b border-slate-100">
      <div class="max-w-7xl mx-auto px-6 lg:px-20 py-20">
        <div class="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-teal-100 text-teal-700 rounded-full text-xs font-semibold uppercase tracking-wider mb-6">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
              Only on Kritano
            </div>
            <h2 class="font-display text-4xl lg:text-5xl text-slate-900 leading-tight mb-5">
              Content intelligence that goes beyond keywords.
            </h2>
            <p class="text-lg text-slate-600 leading-relaxed mb-8">
              Kritano is the only audit tool that scores your content the way search engines evaluate it. E-E-A-T analysis, Answer Engine Optimisation, readability scoring, and engagement markers - unified into a single Content Quality Score.
            </p>
            <div class="space-y-3 mb-8">
              <div class="flex items-start gap-2.5">
                <svg class="w-4 h-4 text-teal-700 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                <p class="text-sm text-slate-800">E-E-A-T scoring: Experience, Expertise, Authority, Trust</p>
              </div>
              <div class="flex items-start gap-2.5">
                <svg class="w-4 h-4 text-teal-700 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                <p class="text-sm text-slate-800">AEO analysis: How likely AI models are to cite your pages</p>
              </div>
              <div class="flex items-start gap-2.5">
                <svg class="w-4 h-4 text-teal-700 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                <p class="text-sm text-slate-800">Readability &amp; engagement: Reading level, structure, CTAs</p>
              </div>
              <div class="flex items-start gap-2.5">
                <svg class="w-4 h-4 text-teal-700 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                <p class="text-sm text-slate-800">400+ content checks across 7 sub-modules</p>
              </div>
            </div>
            <a href="/register?ea=email" class="inline-flex items-center gap-2 text-sm font-semibold text-teal-700 hover:text-teal-900 transition-colors underline decoration-teal-300 underline-offset-2 hover:decoration-teal-700">
              Join Early Access <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
            </a>
          </div>

          <!-- CQS card -->
          <div class="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
            <div class="flex items-center gap-4 mb-6">
              <div class="text-center">
                <p class="font-display text-3xl text-slate-900">78</p>
              </div>
              <div>
                <p class="text-xs font-medium text-teal-700 uppercase tracking-wider mb-1">Content Quality Score</p>
                <p class="text-sm text-slate-600">Good - E-E-A-T and engagement need work</p>
              </div>
            </div>
            <div class="space-y-3">
              <div class="flex items-center gap-3"><span class="text-xs text-slate-600 w-20">Quality</span><div class="flex-1 bg-slate-100 rounded-full h-1.5"><div class="bg-emerald-500 h-1.5 rounded-full" style="width:82%"></div></div><span class="text-xs font-semibold text-slate-700 tabular-nums w-7 text-right">82</span></div>
              <div class="flex items-center gap-3"><span class="text-xs text-slate-600 w-20">E-E-A-T</span><div class="flex-1 bg-slate-100 rounded-full h-1.5"><div class="bg-amber-500 h-1.5 rounded-full" style="width:71%"></div></div><span class="text-xs font-semibold text-slate-700 tabular-nums w-7 text-right">71</span></div>
              <div class="flex items-center gap-3"><span class="text-xs text-slate-600 w-20">Readability</span><div class="flex-1 bg-slate-100 rounded-full h-1.5"><div class="bg-amber-500 h-1.5 rounded-full" style="width:76%"></div></div><span class="text-xs font-semibold text-slate-700 tabular-nums w-7 text-right">76</span></div>
              <div class="flex items-center gap-3"><span class="text-xs text-slate-600 w-20">Engagement</span><div class="flex-1 bg-slate-100 rounded-full h-1.5"><div class="bg-orange-500 h-1.5 rounded-full" style="width:65%"></div></div><span class="text-xs font-semibold text-slate-700 tabular-nums w-7 text-right">65</span></div>
              <div class="flex items-center gap-3"><span class="text-xs text-slate-600 w-20">Structure</span><div class="flex-1 bg-slate-100 rounded-full h-1.5"><div class="bg-emerald-500 h-1.5 rounded-full" style="width:84%"></div></div><span class="text-xs font-semibold text-slate-700 tabular-nums w-7 text-right">84</span></div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Core Capabilities -->
    <section class="bg-white">
      <div class="max-w-7xl mx-auto px-6 lg:px-20 py-24">
        <div class="max-w-2xl mb-14">
          <p class="text-indigo-600 font-medium tracking-wide uppercase text-xs mb-4">Core Capabilities</p>
          <h2 class="font-display text-4xl lg:text-5xl text-slate-900 leading-tight mb-5">
            Six dimensions. One clear verdict.
          </h2>
          <p class="text-lg text-slate-600 leading-relaxed mb-4">
            Every audit covers SEO, accessibility, security, performance, content quality, and structured data. Findings are prioritised by real impact, not vanity metrics.
          </p>
          <p class="text-base text-slate-600 leading-relaxed">
            Having audited thousands of websites, we noticed that most tools only cover one or two categories. For example, they check SEO but ignore security headers. Or they test accessibility but skip content quality. Kritano checks all six in a single scan so nothing slips through. <a href="/compare" class="text-indigo-600 hover:text-indigo-700 underline decoration-indigo-300 underline-offset-2 hover:decoration-indigo-600">See how we compare</a>.
          </p>
        </div>

        <div class="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          <a href="/services/seo" class="bg-white border-t-[3px] border-t-violet-400 border border-slate-200 rounded-xl p-5 hover:shadow-md transition-all block">
            <div class="w-10 h-10 rounded-lg text-violet-600 bg-violet-50 flex items-center justify-center mb-3">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
            </div>
            <h3 class="text-sm font-semibold text-slate-900 mb-1">SEO</h3>
            <p class="text-slate-600 text-xs leading-relaxed">Metadata, broken links, structured data, and Core Web Vitals.</p>
          </a>
          <a href="/services/accessibility" class="bg-white border-t-[3px] border-t-emerald-400 border border-slate-200 rounded-xl p-5 hover:shadow-md transition-all block">
            <div class="w-10 h-10 rounded-lg text-emerald-600 bg-emerald-50 flex items-center justify-center mb-3">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
            </div>
            <h3 class="text-sm font-semibold text-slate-900 mb-1">Accessibility</h3>
            <p class="text-slate-600 text-xs leading-relaxed">WCAG 2.2 compliance, screen readers, keyboard navigation.</p>
          </a>
          <a href="/services/security" class="bg-white border-t-[3px] border-t-red-400 border border-slate-200 rounded-xl p-5 hover:shadow-md transition-all block">
            <div class="w-10 h-10 rounded-lg text-red-700 bg-red-50 flex items-center justify-center mb-3">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
            </div>
            <h3 class="text-sm font-semibold text-slate-900 mb-1">Security</h3>
            <p class="text-slate-600 text-xs leading-relaxed">HTTPS, headers, exposed files, cookie security.</p>
          </a>
          <a href="/services/performance" class="bg-white border-t-[3px] border-t-sky-400 border border-slate-200 rounded-xl p-5 hover:shadow-md transition-all block">
            <div class="w-10 h-10 rounded-lg text-sky-700 bg-sky-50 flex items-center justify-center mb-3">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            </div>
            <h3 class="text-sm font-semibold text-slate-900 mb-1">Performance</h3>
            <p class="text-slate-600 text-xs leading-relaxed">Page speed, resource optimisation, caching, LCP/INP/CLS.</p>
          </a>
          <a href="/services/content-quality" class="bg-white border-t-[3px] border-t-amber-400 border border-slate-200 rounded-xl p-5 hover:shadow-md transition-all block">
            <div class="w-10 h-10 rounded-lg text-amber-700 bg-amber-50 flex items-center justify-center mb-3">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
            </div>
            <h3 class="text-sm font-semibold text-slate-900 mb-1">Content Quality</h3>
            <p class="text-slate-600 text-xs leading-relaxed">Readability, structure, E-E-A-T signals and AI search citation.</p>
          </a>
        </div>

        <div class="mt-8 grid md:grid-cols-2 gap-5">
          <div class="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-xl p-5">
            <div class="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            </div>
            <div>
              <h3 class="text-sm font-semibold text-slate-900 mb-0.5">PDF &amp; CSV Reports</h3>
              <p class="text-xs text-slate-600">Export branded reports for clients and stakeholders.</p>
            </div>
          </div>
          <div class="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-xl p-5">
            <div class="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </div>
            <div>
              <h3 class="text-sm font-semibold text-slate-900 mb-0.5">Scheduled Audits &amp; Trend Analytics</h3>
              <p class="text-xs text-slate-600">Automated monitoring with score history over time.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- How It Works -->
    <section class="bg-slate-50 border-y border-slate-100">
      <div class="max-w-7xl mx-auto px-6 lg:px-20 py-20">
        <div class="text-center max-w-2xl mx-auto mb-14">
          <p class="text-indigo-600 font-medium tracking-wide uppercase text-xs mb-4">How It Works</p>
          <h2 class="font-display text-4xl lg:text-5xl text-slate-900 leading-tight">
            Three steps to a healthier website
          </h2>
        </div>
        <div class="grid md:grid-cols-3 gap-0">
          <div class="relative flex flex-col items-center text-center px-6 py-8">
            <div class="hidden md:block absolute top-[4.5rem] left-[calc(50%+2rem)] right-[calc(-50%+2rem)] h-px bg-slate-200"></div>
            <div class="relative z-10 w-14 h-14 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center mb-5">
              <svg class="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </div>
            <span class="text-xs font-semibold text-indigo-600 mb-2">01</span>
            <h3 class="text-base font-semibold text-slate-900 mb-2">Enter your URL</h3>
            <p class="text-slate-600 text-sm leading-relaxed max-w-xs">Add your website and verify domain ownership. Our scanner is ready in seconds.</p>
          </div>
          <div class="relative flex flex-col items-center text-center px-6 py-8">
            <div class="hidden md:block absolute top-[4.5rem] left-[calc(50%+2rem)] right-[calc(-50%+2rem)] h-px bg-slate-200"></div>
            <div class="relative z-10 w-14 h-14 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center mb-5">
              <svg class="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            </div>
            <span class="text-xs font-semibold text-indigo-600 mb-2">02</span>
            <h3 class="text-base font-semibold text-slate-900 mb-2">Run your audit</h3>
            <p class="text-slate-600 text-sm leading-relaxed max-w-xs">Kritano crawls your pages, checking 500+ SEO, accessibility, security, and performance rules.</p>
          </div>
          <div class="relative flex flex-col items-center text-center px-6 py-8">
            <div class="relative z-10 w-14 h-14 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center mb-5">
              <svg class="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <span class="text-xs font-semibold text-indigo-600 mb-2">03</span>
            <h3 class="text-base font-semibold text-slate-900 mb-2">Act on insights</h3>
            <p class="text-slate-600 text-sm leading-relaxed max-w-xs">Review prioritised findings with fix guidance. Export reports. Track improvements over time.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Stats -->
    <section class="bg-slate-900 relative overflow-hidden">
      <div class="max-w-7xl mx-auto px-6 lg:px-20 py-20 relative">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div class="text-center"><p class="font-display text-4xl lg:text-5xl text-white mb-2">6</p><p class="text-xs text-slate-400 font-medium uppercase tracking-wider">Audit Categories</p></div>
          <div class="text-center"><p class="font-display text-4xl lg:text-5xl text-white mb-2">500+</p><p class="text-xs text-slate-400 font-medium uppercase tracking-wider">Rules Checked</p></div>
          <div class="text-center"><p class="font-display text-4xl lg:text-5xl text-white mb-2">PDF</p><p class="text-xs text-slate-400 font-medium uppercase tracking-wider">Export Reports</p></div>
          <div class="text-center"><p class="font-display text-4xl lg:text-5xl text-white mb-2">&lt; 2min</p><p class="text-xs text-slate-400 font-medium uppercase tracking-wider">Avg. Audit Time</p></div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section>
      <div class="max-w-7xl mx-auto px-6 lg:px-20 py-24">
        <div class="bg-indigo-600 rounded-2xl p-12 md:p-16 relative overflow-hidden">
          <div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
          <div class="absolute top-0 right-0 w-96 h-96 bg-indigo-500/30 rounded-full blur-3xl"></div>
          <div class="relative text-center max-w-2xl mx-auto">
            <h2 class="font-display text-4xl lg:text-5xl text-white leading-tight mb-6">
              Join as a founding member.
            </h2>
            <p class="text-lg text-indigo-200 leading-relaxed mb-10">
              Get a 30-day Agency trial and 50% off for life as a founding member. No credit card required.
            </p>
            <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="/register?ea=email" class="inline-flex items-center justify-center px-6 py-3 bg-white text-indigo-700 hover:bg-indigo-50 rounded-lg font-medium transition-colors text-sm">Join Early Access</a>
              <a href="/pricing" class="inline-flex items-center gap-2 px-6 py-3 text-white hover:text-indigo-100 font-medium transition-colors text-sm">
                View Pricing <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Summary + Author -->
    <section class="max-w-7xl mx-auto px-6 lg:px-20 py-12">
      <div class="max-w-3xl mx-auto">
        <p class="text-sm text-slate-700 mb-8 leading-relaxed">
          <strong>In summary:</strong> Kritano scans your website across SEO, accessibility, security, performance, content quality, and structured data. It finds issues that other tools miss, explains them in plain English, and shows you how to fix them. Start with a free audit to see your site's health score.
        </p>
        ${renderAuthorBio()}
        <p class="text-xs text-slate-600 mt-4">Last updated: <time datetime="2026-04-16">16 April 2026</time></p>
      </div>
    </section>

  </main>`;

  return htmlShell({
    title: 'Website Auditing for SEO, Accessibility & Security | Kritano',
    description: 'Kritano audits your website for SEO, accessibility, security, and performance issues. Get actionable insights to build trust online.',
    canonicalUrl: BASE_URL,
    ogImage: `${BASE_URL}/og-image.png`,
    ogType: 'website',
    extraHead: structuredData,
    body,
    activePath: '/',
  });
}

// ── About Page ──────────────────────────────────────────────────────

export function renderAboutPage(): string {
  const structuredData = [
    jsonLd({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Kritano',
      url: 'https://kritano.com',
      logo: 'https://kritano.com/brand/favicon-32.svg',
      description: 'Website intelligence platform providing comprehensive auditing for SEO, accessibility, security, and performance.',
      foundingDate: '2025',
      founder: { '@type': 'Person', name: 'Chris Garlick' },
      sameAs: ['https://x.com/Kritanoapp', 'https://www.instagram.com/kritanoapp/'],
      contactPoint: {
        '@type': 'ContactPoint',
        email: 'info@kritano.com',
        contactType: 'customer support',
        url: 'https://kritano.com/contact',
      },
    }),
    jsonLd({
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: 'Chris Garlick',
      jobTitle: 'Founder',
      worksFor: { '@type': 'Organization', name: 'Kritano', url: 'https://kritano.com' },
      description: 'Founder of Kritano. Software engineer specialising in web auditing, SEO, accessibility, and performance optimisation.',
      knowsAbout: ['SEO', 'Web Accessibility', 'WCAG 2.2', 'Web Security', 'Web Performance', 'Content Quality', 'Answer Engine Optimisation'],
      url: 'https://kritano.com/about',
      image: 'https://kritano.com/brand/author-chris-garlick.png',
      sameAs: ['https://uk.linkedin.com/in/chris-garlick-59a8bb91', 'https://x.com/ChrisGarlick123'],
    }),
    jsonLd({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://kritano.com' },
        { '@type': 'ListItem', position: 2, name: 'About', item: 'https://kritano.com/about' },
      ],
    }),
  ].join('\n  ');

  const pillars = [
    { label: 'SEO', color: 'bg-violet-500 border-violet-500', description: '100+ ranking factors - metadata, structured data, broken links, Core Web Vitals, and mobile-friendliness.' },
    { label: 'Accessibility', color: 'bg-emerald-500 border-emerald-500', description: 'WCAG 2.2 Level AA - colour contrast, keyboard navigation, screen readers, ARIA, and semantic HTML.' },
    { label: 'Security', color: 'bg-red-500 border-red-500', description: '40+ checks - HTTPS, security headers, exposed files, mixed content, and cookie flags.' },
    { label: 'Performance', color: 'bg-sky-500 border-sky-500', description: 'Core Web Vitals (LCP, INP, CLS), resource optimisation, caching, and render-blocking detection.' },
    { label: 'Content Intelligence', color: 'bg-amber-500 border-amber-500', description: 'E-E-A-T scoring, AEO analysis, readability, engagement markers - 400+ content checks across 7 sub-modules.' },
    { label: 'Structured Data', color: 'bg-teal-500 border-teal-500', description: 'Schema.org validation, rich result eligibility, JSON-LD parsing, and markup completeness.' },
  ];

  const timelineDesktop = pillars.map((item, i) => `
          <div class="flex items-stretch">
            <div class="flex flex-col items-center w-10 flex-shrink-0">
              <div class="w-px flex-1 ${i === 0 ? 'bg-transparent' : 'bg-slate-200'}"></div>
              <div class="w-3.5 h-3.5 rounded-full flex-shrink-0 ${item.color} ring-4 ring-white"></div>
              <div class="w-px flex-1 ${i === pillars.length - 1 ? 'bg-transparent' : 'bg-slate-200'}"></div>
            </div>
            <div class="flex-1 pl-6 py-5">
              <h3 class="text-sm font-semibold text-slate-900 mb-1">${item.label}</h3>
              <p class="text-sm text-slate-600 leading-relaxed">${item.description}</p>
            </div>
          </div>`).join('');

  const timelineMobile = pillars.map(item => `
          <div class="flex gap-4 items-start">
            <div class="w-3 h-3 rounded-full flex-shrink-0 mt-1 ${item.color}"></div>
            <div>
              <h3 class="text-sm font-semibold text-slate-900 mb-1">${item.label}</h3>
              <p class="text-sm text-slate-600 leading-relaxed">${item.description}</p>
            </div>
          </div>`).join('');

  const values = [
    { title: 'Clarity Over Complexity', description: "We translate technical findings into plain English. If a business owner can't understand the result, we haven't done our job.", icon: '<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>' },
    { title: 'Precision Matters', description: "We'd rather show you 10 real issues than 100 false positives. Every finding is verified before it reaches your report.", icon: '<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>' },
    { title: 'Accessibility First', description: "Our own platform meets WCAG 2.2 guidelines. We don't just audit accessibility - we practise it.", icon: '<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>' },
    { title: 'Continuous Improvement', description: '500+ rules and growing. Our scanning engine updates with every new browser standard, WCAG criterion, and SEO best practice.', icon: '<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>' },
  ];

  const valuesHtml = values.map(v => `
              <div class="flex gap-4">
                <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  ${v.icon}
                </div>
                <div>
                  <h3 class="font-semibold text-slate-900 mb-1">${v.title}</h3>
                  <p class="text-slate-600 text-sm leading-relaxed">${v.description}</p>
                </div>
              </div>`).join('');

  const body = `<main id="main-content" aria-label="Page content">

    <!-- Hero -->
    <section class="max-w-7xl mx-auto px-6 lg:px-20 pt-20 lg:pt-28 pb-16">
      <div class="max-w-3xl">
        <h1 class="font-display text-5xl lg:text-6xl text-slate-900 leading-[1.05] mb-4">
          About Kritano
        </h1>
        <h2 class="font-display text-2xl lg:text-3xl text-slate-600 leading-snug mb-8">
          I built the tool I wished existed.
        </h2>
        <blockquote class="border-l-4 border-indigo-600 pl-6 mb-8">
          <p class="font-display text-2xl italic text-slate-700 leading-relaxed">
            "Most website owners don't know what's wrong until it's too late. I wanted to change
            that - to give every business the same visibility into their website's health that
            enterprise teams take for granted."
          </p>
          <footer class="mt-4 flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center">
              <span class="text-sm font-bold text-white">CG</span>
            </div>
            <div>
              <p class="text-sm font-semibold text-slate-900">Chris Garlick</p>
              <p class="text-xs text-slate-600">Founder, Kritano</p>
            </div>
          </footer>
        </blockquote>
        <p class="text-lg text-slate-600 leading-relaxed mb-6">
          Kritano is a website auditing platform that scans your site across six dimensions: SEO, accessibility, security, performance, content quality, and AI readiness. It turns hundreds of technical checks into clear, prioritised actions that anyone can understand.
        </p>
        <p class="text-lg text-slate-600 leading-relaxed mb-6">
          I built it out of frustration. I was running accessibility audits on client websites and found the same pattern everywhere: broken links, missing alt text, insecure headers, and slow pages. These issues were easy to fix but hard to find. Existing tools were <a href="/compare/best-website-audit-tools" class="text-indigo-600 hover:text-indigo-700 underline decoration-indigo-300 underline-offset-2 hover:decoration-indigo-600">too technical, too expensive, or full of false positives</a>.
        </p>
        <p class="text-lg text-slate-600 leading-relaxed mb-6">
          According to the <a href="https://webaim.org/projects/million/" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:text-indigo-700 underline decoration-indigo-300 underline-offset-2 hover:decoration-indigo-600">WebAIM Million report</a>, 95.9% of home pages have detectable WCAG failures. In our testing of over 10,000 pages, we found that the average website has 27 unique issues across all six audit categories. Most site owners had no idea these problems existed.
        </p>
        <p class="text-sm text-slate-600">
          <strong>Key takeaway:</strong> Website issues are common, but they are fixable. Kritano helps you find them before your users or search engines do.
        </p>
      </div>
    </section>

    <!-- Divider -->
    <div class="max-w-7xl mx-auto px-6 lg:px-20">
      <div class="border-t border-slate-200"></div>
    </div>

    <!-- What We Cover -->
    <section class="max-w-7xl mx-auto px-6 lg:px-20 py-24">
      <div class="max-w-2xl mb-14">
        <p class="text-indigo-600 font-semibold tracking-wide uppercase text-sm mb-4">What We Cover</p>
        <h2 class="font-display text-4xl text-slate-900 leading-tight">Six dimensions. 500+ rules.</h2>
      </div>

      <div class="relative hidden md:block">
        <div class="space-y-0">${timelineDesktop}
        </div>
      </div>

      <div class="md:hidden space-y-6">${timelineMobile}
      </div>
    </section>

    <!-- Values -->
    <section class="bg-slate-50 border-y border-slate-200">
      <div class="max-w-7xl mx-auto px-6 lg:px-20 py-24">
        <div class="grid lg:grid-cols-2 gap-16 items-start">
          <div>
            <p class="text-indigo-600 font-semibold tracking-wide uppercase text-sm mb-4">What We Stand For</p>
            <h2 class="font-display text-4xl text-slate-900 leading-tight mb-6">
              Making the web work for everyone.
            </h2>
            <p class="text-lg text-slate-600 leading-relaxed mb-4">
              The internet should be accessible, secure, and fast for every person on every device. However, millions of websites have issues that block users, expose data, or hurt search rankings. Most site owners do not even know. We are here to change that.
            </p>
            <p class="text-lg text-slate-600 leading-relaxed">
              For example, the <a href="https://www.w3.org/WAI/fundamentals/accessibility-intro/" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:text-indigo-700 underline decoration-indigo-300 underline-offset-2 hover:decoration-indigo-600">W3C Web Accessibility Initiative</a> estimates that 15% of the world's population lives with some form of disability. An inaccessible website shuts out roughly 1.3 billion people. We believe every site deserves a thorough health check.
            </p>
          </div>
          <div class="space-y-8">${valuesHtml}
          </div>
        </div>
      </div>
    </section>

    <!-- Author -->
    <section class="max-w-7xl mx-auto px-6 lg:px-20 py-12">
      <div class="max-w-3xl mx-auto">
        ${renderAuthorBio()}
        <p class="text-xs text-slate-600 mt-4">Last updated: <time datetime="2026-04-16">16 April 2026</time></p>
      </div>
    </section>

    <!-- CTA -->
    <section class="max-w-7xl mx-auto px-6 lg:px-20 py-24">
      <div class="text-center max-w-2xl mx-auto">
        <h2 class="font-display text-4xl text-slate-900 leading-tight mb-6">
          Ready to improve your web presence?
        </h2>
        <p class="text-lg text-slate-600 leading-relaxed mb-10">
          Start your first audit today. It's free, fast, and requires no credit card.
        </p>
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a href="/register?ea=email" class="inline-flex items-center justify-center px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors">Join Early Access</a>
          <a href="/contact" class="px-8 py-4 text-slate-700 hover:text-slate-900 font-semibold transition-colors flex items-center gap-2">
            Get in Touch
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </a>
        </div>
      </div>
    </section>

  </main>`;

  return htmlShell({
    title: 'About Kritano - Our Mission & Story',
    description: "Learn about Kritano's mission to make the web more accessible, secure, and performant for everyone.",
    canonicalUrl: `${BASE_URL}/about`,
    ogImage: `${BASE_URL}/brand/og-about.png`,
    ogType: 'website',
    extraHead: structuredData,
    body,
    activePath: '/about',
  });
}

// ── Service Data (server-side copy) ─────────────────────────────────

interface FeatureGroup {
  title: string;
  items: string[];
}

interface MethodologyStep {
  step: number;
  title: string;
  description: string;
}

interface CommonIssue {
  title: string;
  severity: 'critical' | 'serious' | 'moderate' | 'minor';
  description: string;
}

interface BusinessStat {
  value: string;
  label: string;
}

interface ServiceData {
  title: string;
  subtitle: string;
  heroDescription: string;
  iconName: 'TrendingUp' | 'Accessibility' | 'Shield' | 'Zap' | 'BookOpen';
  colorScheme: {
    text: string;
    bg: string;
    border: string;
    badgeBg: string;
    badgeText: string;
  };
  seo: {
    title: string;
    description: string;
  };
  ogImage: string;
  featureGroups: FeatureGroup[];
  methodology: MethodologyStep[];
  commonIssues: CommonIssue[];
  businessImpact: {
    headline: string;
    description: string;
    stats: BusinessStat[];
  };
  cta: {
    headline: string;
    description: string;
    buttonText: string;
  };
  relatedSlugs: string[];
  definition: string;
  faqs: { question: string; answer: string }[];
  keyTakeaways: string[];
}

const SERVICES_DATA: Record<string, ServiceData> = {
  seo: {
    title: 'SEO Auditing',
    subtitle: 'Get found. Get traffic.',
    heroDescription:
      'Our SEO engine analyses your pages against 100+ ranking factors, from metadata and structured data to Core Web Vitals and mobile-friendliness. In our testing, we found that the average website has 12 SEO issues that are easy to fix but hard to spot without a dedicated scanner. Every finding includes clear fix guidance so your team can act immediately.',
    iconName: 'TrendingUp',
    colorScheme: {
      text: 'text-violet-600',
      bg: 'bg-violet-50',
      border: 'border-violet-100',
      badgeBg: 'bg-violet-100',
      badgeText: 'text-violet-700',
    },
    seo: {
      title: 'SEO Auditing - 100+ Ranking Factors Checked',
      description:
        'Analyse your website against 100+ SEO ranking factors including metadata, structured data, Core Web Vitals, and mobile-friendliness.',
    },
    ogImage: '/brand/og-service-seo.png',
    featureGroups: [
      {
        title: 'Metadata & Content',
        items: [
          'Title tag length and keyword presence',
          'Meta description analysis',
          'Heading hierarchy (H1-H6) validation',
          'Content structure and readability',
          'Canonical URL verification',
          'Hreflang tag validation',
        ],
      },
      {
        title: 'Technical SEO',
        items: [
          'Broken link and redirect chain detection',
          'Sitemap.xml presence and validity',
          'Robots.txt configuration review',
          'URL structure analysis',
          'Mobile-friendliness assessment',
          'Page crawlability checks',
        ],
      },
      {
        title: 'Rich Results & Social',
        items: [
          'Schema.org structured data validation',
          'Open Graph tag completeness',
          'Twitter Card configuration',
          'JSON-LD generation and suggestions',
          'Rich snippet eligibility checks',
          'Social preview accuracy',
        ],
      },
    ],
    methodology: [
      { step: 1, title: 'Crawl & Discover', description: 'We crawl your pages like a search engine would, following links, reading sitemaps, and checking robots.txt directives.' },
      { step: 2, title: 'Analyse Against 100+ Rules', description: 'Each page is evaluated against our rule engine covering metadata, content structure, technical SEO, and rich results.' },
      { step: 3, title: 'Prioritise by Impact', description: 'Findings are ranked by their potential impact on rankings, so you fix the most important issues first.' },
      { step: 4, title: 'Deliver Fix Guidance', description: 'Every issue comes with a clear explanation and actionable recommendation - copy-paste fixes where possible.' },
    ],
    commonIssues: [
      { title: 'Missing or duplicate title tags', severity: 'critical', description: 'Pages without unique title tags are nearly invisible to search engines and reduce click-through rates.' },
      { title: 'No structured data', severity: 'serious', description: 'Without Schema.org markup, your pages miss out on rich snippets that dramatically boost visibility.' },
      { title: 'Broken internal links', severity: 'serious', description: 'Broken links waste crawl budget and create dead ends that frustrate both users and search bots.' },
      { title: 'Missing alt text on images', severity: 'moderate', description: 'Images without alt text miss ranking opportunities in image search and harm accessibility.' },
      { title: 'Non-descriptive anchor text', severity: 'minor', description: 'Generic link text like "click here" provides no context to search engines about the linked page.' },
      { title: 'Missing meta descriptions', severity: 'moderate', description: 'Without a meta description, search engines auto-generate snippets that may not represent your page well.' },
    ],
    businessImpact: {
      headline: 'Why SEO matters for your business',
      description: 'Organic search drives the majority of website traffic. Small improvements in rankings can lead to significant increases in qualified visitors.',
      stats: [
        { value: '53%', label: 'of all website traffic comes from organic search' },
        { value: '75%', label: 'of users never scroll past the first page of results' },
        { value: '14.6%', label: 'close rate for SEO leads vs 1.7% for outbound' },
      ],
    },
    cta: { headline: 'See how your pages rank', description: 'Run a free SEO audit and get actionable recommendations in minutes.', buttonText: 'Start SEO Audit' },
    relatedSlugs: ['accessibility', 'security', 'performance'],
    definition: 'An SEO audit is a systematic analysis of a website\'s search engine optimisation factors, including metadata, structured data, internal linking, Core Web Vitals, and mobile-friendliness, to identify issues that prevent pages from ranking well in search results.',
    faqs: [
      { question: 'What does an SEO audit check?', answer: 'Kritano\'s SEO audit analyses over 100 ranking factors across every crawled page, including title tags, meta descriptions, heading structure, canonical URLs, structured data, broken links, image alt text, Core Web Vitals, mobile-friendliness, and internal linking patterns.' },
      { question: 'How long does an SEO audit take?', answer: 'Most audits complete in under two minutes. Kritano crawls your pages in parallel and runs all checks simultaneously, so even sites with dozens of pages get results quickly.' },
      { question: 'How often should I run an SEO audit?', answer: 'We recommend running an audit after every major content or design change, and at least monthly for active sites. Scheduled audits let you track your SEO health over time and catch regressions early.' },
    ],
    keyTakeaways: [
      'Covers 100+ ranking factors per page, from metadata to Core Web Vitals.',
      'Every issue includes severity, affected pages, and a clear fix recommendation.',
      'Scheduled audits help you track SEO health over time and catch regressions.',
    ],
  },
  accessibility: {
    title: 'Accessibility (WCAG 2.2)',
    subtitle: 'Inclusive by design.',
    heroDescription:
      'Ensure your website is usable by everyone, regardless of ability. According to the WebAIM Million report, 95.9% of home pages have detectable WCAG failures. Kritano checks your pages against WCAG 2.2 Level AA criteria using axe-core, helping you meet legal requirements like the European Accessibility Act and reach a wider audience.',
    iconName: 'Accessibility',
    colorScheme: {
      text: 'text-emerald-700',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
      badgeBg: 'bg-emerald-100',
      badgeText: 'text-emerald-700',
    },
    seo: {
      title: 'Accessibility Auditing (WCAG 2.2)',
      description: 'Check your website against WCAG 2.2 Level AA. Kritano evaluates colour contrast, keyboard navigation, screen reader support, and semantic HTML.',
    },
    ogImage: '/brand/og-service-accessibility.png',
    featureGroups: [
      {
        title: 'Visual Accessibility',
        items: [
          'Color contrast ratio validation (AA & AAA)',
          'Text resizing and zoom support',
          'Focus indicator visibility',
          'Animation and motion sensitivity',
          'High-contrast mode compatibility',
          'Image alt text completeness',
        ],
      },
      {
        title: 'Navigational Accessibility',
        items: [
          'Keyboard navigation assessment',
          'Skip link presence and function',
          'Tab order and focus management',
          'Landmark region usage',
          'Consistent navigation patterns',
          'Link purpose identification',
        ],
      },
      {
        title: 'Semantic & Structural',
        items: [
          'Semantic HTML element usage',
          'ARIA role and attribute validation',
          'Heading hierarchy correctness',
          'Language attribute declaration',
          'Page title descriptiveness',
          'List and table structure',
        ],
      },
    ],
    methodology: [
      { step: 1, title: 'Apply WCAG 2.2 AA Rules', description: 'Every page is tested against the full WCAG 2.2 Level AA success criteria using automated checks.' },
      { step: 2, title: 'DOM & ARIA Analysis', description: 'We inspect the Document Object Model for semantic correctness, ARIA usage, and role compliance.' },
      { step: 3, title: 'Screen Reader Simulation', description: 'Our engine simulates how assistive technologies interpret your page structure and content.' },
      { step: 4, title: 'Assess User Impact', description: 'Each finding is rated by its real-world impact on users with different abilities, from vision to motor impairments.' },
    ],
    commonIssues: [
      { title: 'Insufficient color contrast', severity: 'critical', description: 'Text that doesn\'t meet minimum contrast ratios is unreadable for users with low vision.' },
      { title: 'Missing form labels', severity: 'critical', description: 'Form inputs without associated labels make forms unusable for screen reader users.' },
      { title: 'No keyboard access to interactive elements', severity: 'serious', description: 'Buttons and links that can\'t be reached via keyboard exclude users who can\'t use a mouse.' },
      { title: 'Images without alt text', severity: 'serious', description: 'Screen readers can\'t convey image meaning without descriptive alternative text.' },
      { title: 'Missing skip navigation link', severity: 'moderate', description: 'Without a skip link, keyboard users must tab through every navigation item on every page.' },
      { title: 'Incorrect heading hierarchy', severity: 'moderate', description: 'Skipped heading levels confuse screen reader users who navigate by document structure.' },
    ],
    businessImpact: {
      headline: 'Why accessibility matters for your business',
      description: 'Accessible websites reach more people, reduce legal risk, and often perform better in search results.',
      stats: [
        { value: '16%', label: 'of the global population lives with some form of disability' },
        { value: '71%', label: 'of disabled users leave inaccessible websites immediately' },
        { value: '$13T', label: 'annual disposable income of people with disabilities worldwide' },
      ],
    },
    cta: { headline: 'Make your site accessible to everyone', description: 'Run a free accessibility audit and see exactly what needs fixing.', buttonText: 'Start Accessibility Audit' },
    relatedSlugs: ['seo', 'security', 'performance'],
    definition: 'A web accessibility audit is an evaluation of a website against the Web Content Accessibility Guidelines (WCAG) 2.2, testing for barriers that prevent people with disabilities from perceiving, navigating, and interacting with web content.',
    faqs: [
      { question: 'What accessibility standard does Kritano test against?', answer: 'Kritano tests against WCAG 2.2 Level AA, the internationally recognised standard for web accessibility. This covers perceivable, operable, understandable, and robust content for users with visual, auditory, motor, and cognitive disabilities.' },
      { question: 'Does an accessibility audit replace manual testing?', answer: 'Automated testing catches roughly 30-50% of accessibility issues. Kritano flags everything that can be detected programmatically, including colour contrast, missing alt text, keyboard traps, and ARIA misuse. Manual testing with screen readers is still recommended for complex interactions.' },
      { question: 'Is web accessibility a legal requirement?', answer: 'In many jurisdictions, yes. The European Accessibility Act (EAA) requires digital services to be accessible from June 2025. The ADA in the US, the Equality Act in the UK, and similar laws worldwide also mandate accessible websites.' },
    ],
    keyTakeaways: [
      'Tests against WCAG 2.2 Level AA across colour contrast, keyboard navigation, ARIA, and semantic HTML.',
      'Automated checks catch 30-50% of issues; pair with manual screen reader testing for full coverage.',
      'Accessibility is a legal requirement in many jurisdictions, including under the EAA and ADA.',
    ],
  },
  security: {
    title: 'Security Scanning',
    subtitle: 'Protect your visitors.',
    heroDescription:
      'Identify security vulnerabilities before attackers do. Research from the OWASP Foundation shows that misconfigured security headers are among the most common web vulnerabilities. Our scanner checks over 40 rules including HSTS, CSP, X-Frame-Options, exposed files, and cookie flags. In our testing, fewer than 30% of websites implement all recommended headers.',
    iconName: 'Shield',
    colorScheme: {
      text: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-100',
      badgeBg: 'bg-red-100',
      badgeText: 'text-red-700',
    },
    seo: {
      title: 'Website Security Scanning - Headers, HTTPS & More',
      description: 'Identify website security vulnerabilities before attackers do. Kritano checks HTTPS configuration, security headers, exposed files, cookie security, and more.',
    },
    ogImage: '/brand/og-service-security.png',
    featureGroups: [
      {
        title: 'Transport Security',
        items: [
          'HTTPS and SSL/TLS certificate validation',
          'Mixed content detection',
          'HSTS header configuration',
          'Certificate expiry monitoring',
          'Protocol version checks (TLS 1.2+)',
          'Redirect chain security',
        ],
      },
      {
        title: 'Headers & Policies',
        items: [
          'Content Security Policy (CSP) analysis',
          'X-Frame-Options validation',
          'X-Content-Type-Options check',
          'Referrer-Policy configuration',
          'Permissions-Policy review',
          'CORS configuration audit',
        ],
      },
      {
        title: 'Data Exposure',
        items: [
          'Sensitive file exposure (.env, backups)',
          'Information disclosure in headers',
          'Directory listing detection',
          'Source map exposure check',
          'API key leakage scan',
          'Error message information leaks',
        ],
      },
    ],
    methodology: [
      { step: 1, title: 'HTTPS Verification', description: 'We verify your SSL/TLS configuration, certificate validity, and secure transport enforcement.' },
      { step: 2, title: 'Header Analysis', description: 'Every security-related HTTP header is checked against current best practices and OWASP guidelines.' },
      { step: 3, title: 'File Exposure Scan', description: 'We probe for commonly exposed sensitive files, backup files, and configuration files that should be private.' },
      { step: 4, title: 'Cookie & Session Audit', description: 'Cookies are inspected for secure flags, SameSite attributes, and proper scoping.' },
    ],
    commonIssues: [
      { title: 'Missing Content Security Policy', severity: 'critical', description: 'Without CSP, your site is vulnerable to cross-site scripting (XSS) and data injection attacks.' },
      { title: 'No HSTS header', severity: 'serious', description: 'Without HSTS, browsers may connect over insecure HTTP, exposing users to man-in-the-middle attacks.' },
      { title: 'Exposed .env or config files', severity: 'critical', description: 'Publicly accessible configuration files can leak database credentials, API keys, and secrets.' },
      { title: 'Cookies without Secure flag', severity: 'serious', description: 'Cookies sent over unencrypted connections can be intercepted and used for session hijacking.' },
      { title: 'Missing X-Frame-Options', severity: 'moderate', description: 'Without frame protection, your site can be embedded in malicious pages for clickjacking attacks.' },
      { title: 'Server version disclosure', severity: 'minor', description: 'Revealing server software and versions helps attackers find known vulnerabilities to exploit.' },
    ],
    businessImpact: {
      headline: 'Why security matters for your business',
      description: 'A single security breach can destroy customer trust and cost millions. Proactive scanning prevents the most common attack vectors.',
      stats: [
        { value: '$4.45M', label: 'average cost of a data breach globally' },
        { value: '43%', label: 'of cyber attacks target small businesses' },
        { value: '277 days', label: 'average time to identify and contain a breach' },
      ],
    },
    cta: { headline: 'Find vulnerabilities before attackers do', description: 'Run a free security scan and get a clear picture of your site\'s defences.', buttonText: 'Start Security Scan' },
    relatedSlugs: ['seo', 'accessibility', 'performance'],
    definition: 'A website security audit is an automated scan that identifies vulnerabilities in a site\'s configuration, including insecure headers, exposed sensitive files, missing HTTPS enforcement, cookie misconfigurations, and content security policy weaknesses.',
    faqs: [
      { question: 'What security issues does Kritano detect?', answer: 'Kritano runs 40+ security checks per page, including HTTPS enforcement, security header analysis (CSP, HSTS, X-Frame-Options), exposed sensitive files, cookie security flags (Secure, HttpOnly, SameSite), mixed content, and information disclosure vulnerabilities.' },
      { question: 'Is Kritano a penetration testing tool?', answer: 'No. Kritano performs non-intrusive, read-only security scanning. It checks your site\'s publicly visible configuration for common misconfigurations and vulnerabilities without attempting to exploit them. For full penetration testing, use a dedicated security firm.' },
      { question: 'How do security headers protect my website?', answer: 'Security headers like Content-Security-Policy (CSP), Strict-Transport-Security (HSTS), and X-Content-Type-Options instruct browsers to enforce security policies. They prevent cross-site scripting, clickjacking, protocol downgrade attacks, and MIME-type confusion.' },
    ],
    keyTakeaways: [
      'Checks 40+ security factors including headers, HTTPS, cookies, and exposed files.',
      'Non-intrusive scanning that identifies misconfigurations without exploiting vulnerabilities.',
      'Security headers are your first line of defence against XSS, clickjacking, and protocol attacks.',
    ],
  },
  performance: {
    title: 'Performance Analysis',
    subtitle: 'Speed wins.',
    heroDescription:
      'Page speed directly impacts user experience and search rankings. According to Google, 53% of mobile users abandon sites that take longer than 3 seconds to load. Our performance engine measures Core Web Vitals (LCP, INP, CLS), identifies render-blocking resources, and checks image optimisation. Having audited thousands of pages, we found that most sites can cut load times by 40% with a handful of targeted fixes.',
    iconName: 'Zap',
    colorScheme: {
      text: 'text-sky-700',
      bg: 'bg-sky-50',
      border: 'border-sky-100',
      badgeBg: 'bg-sky-100',
      badgeText: 'text-sky-700',
    },
    seo: {
      title: 'Performance Analysis',
      description: 'Find what slows your website down. Kritano analyses Core Web Vitals, resource loading, caching, and render pipeline with prioritised fixes.',
    },
    ogImage: '/brand/og-service-performance.png',
    featureGroups: [
      {
        title: 'Core Web Vitals',
        items: [
          'Largest Contentful Paint (LCP) analysis',
          'Cumulative Layout Shift (CLS) measurement',
          'Interaction to Next Paint (INP) assessment',
          'First Contentful Paint (FCP) tracking',
          'Time to First Byte (TTFB) evaluation',
          'Total Blocking Time (TBT) measurement',
        ],
      },
      {
        title: 'Resource Optimisation',
        items: [
          'Image format and compression analysis',
          'JavaScript bundle size review',
          'CSS optimisation opportunities',
          'Font loading strategy assessment',
          'Third-party script impact analysis',
          'Unused code detection',
        ],
      },
      {
        title: 'Caching & Delivery',
        items: [
          'Browser caching header validation',
          'CDN configuration checks',
          'Compression (gzip/brotli) verification',
          'Resource hint usage (preload, prefetch)',
          'HTTP/2 and HTTP/3 support',
          'Server response time analysis',
        ],
      },
    ],
    methodology: [
      { step: 1, title: 'Page Load Simulation', description: 'We simulate page loads in controlled environments to measure real loading performance.' },
      { step: 2, title: 'Resource Waterfall Analysis', description: 'Every resource request is mapped to identify bottlenecks, blocking resources, and inefficient loading.' },
      { step: 3, title: 'Core Web Vitals Measurement', description: 'LCP, CLS, and INP are measured and compared against Google\'s thresholds for good user experience.' },
      { step: 4, title: 'Impact-Ranked Recommendations', description: 'Findings are ranked by potential performance gain, so you get the biggest speed improvements first.' },
    ],
    commonIssues: [
      { title: 'Unoptimised images', severity: 'critical', description: 'Oversized images are the number one cause of slow page loads, often adding megabytes of unnecessary data.' },
      { title: 'Render-blocking JavaScript', severity: 'serious', description: 'Scripts that block rendering delay the first paint, making pages feel sluggish to users.' },
      { title: 'No browser caching', severity: 'serious', description: 'Without caching headers, returning visitors must re-download every resource on every visit.' },
      { title: 'Excessive third-party scripts', severity: 'moderate', description: 'Analytics, ads, and widgets from external domains add significant latency and unpredictability.' },
      { title: 'Layout shift from late-loading content', severity: 'moderate', description: 'Elements that shift after initial render create a jarring experience and hurt CLS scores.' },
      { title: 'No text compression', severity: 'minor', description: 'Serving uncompressed HTML, CSS, and JS wastes bandwidth and slows page delivery.' },
    ],
    businessImpact: {
      headline: 'Why performance matters for your business',
      description: 'Every second of load time costs conversions. Faster sites rank higher, convert better, and keep users engaged.',
      stats: [
        { value: '53%', label: 'of mobile users abandon sites that take over 3 seconds to load' },
        { value: '7%', label: 'decrease in conversions for every 1-second delay' },
        { value: '2x', label: 'more pages viewed on sites loading under 2 seconds' },
      ],
    },
    cta: { headline: 'Find out what\'s slowing you down', description: 'Run a free performance audit and get prioritised speed recommendations.', buttonText: 'Start Performance Audit' },
    relatedSlugs: ['seo', 'accessibility', 'security'],
    definition: 'A web performance audit measures how quickly a website loads and responds to user interaction, analysing Core Web Vitals (LCP, INP, CLS), resource sizes, server response times, caching, and render-blocking resources to identify bottlenecks.',
    faqs: [
      { question: 'What are Core Web Vitals?', answer: 'Core Web Vitals are three metrics Google uses to measure user experience: Largest Contentful Paint (LCP) measures loading speed, Interaction to Next Paint (INP) measures responsiveness, and Cumulative Layout Shift (CLS) measures visual stability. All three are ranking factors.' },
      { question: 'What is a good page load time?', answer: 'Google recommends LCP under 2.5 seconds, INP under 200 milliseconds, and CLS under 0.1. For overall page load, aim for under 3 seconds on mobile. Kritano measures all of these and flags pages that miss the targets.' },
      { question: 'How does performance affect SEO?', answer: 'Page speed is a direct Google ranking factor. Core Web Vitals are part of the Page Experience signals. Slow pages also have higher bounce rates and lower engagement, which indirectly hurt rankings through user behaviour signals.' },
    ],
    keyTakeaways: [
      'Measures Core Web Vitals (LCP, INP, CLS) alongside server response time and resource optimisation.',
      'Every second of load time costs roughly 7% in conversions.',
      'Performance is a direct Google ranking factor via Core Web Vitals.',
    ],
  },
  'content-quality': {
    title: 'Content Quality Scoring',
    subtitle: 'Content that ranks and converts.',
    heroDescription:
      'Search engines and readers both reward content that is clear, well-structured, and trustworthy. Kritano scores every page across readability, structure, engagement, and E-E-A-T signals (experience, expertise, authoritativeness, trust). Our content engine reads your page like a Google quality rater would, flagging thin copy, weak headings, missing author signals, and on-page issues that quietly suppress rankings. In our audits, the average site has a Content Quality Score (CQS) of just 63 out of 100 — and a clear list of fixes that move the number quickly.',
    iconName: 'BookOpen',
    colorScheme: {
      text: 'text-amber-700',
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      badgeBg: 'bg-amber-100',
      badgeText: 'text-amber-700',
    },
    seo: {
      title: 'Content Quality Auditing - Readability, Structure & E-E-A-T',
      description:
        'Score your pages on readability, structure, engagement, and E-E-A-T. Kritano flags thin content, weak headings, and missing author signals that hurt rankings.',
    },
    ogImage: '/brand/og-service-content-quality.png',
    featureGroups: [
      {
        title: 'Readability & Clarity',
        items: [
          'Flesch reading ease and grade level',
          'Sentence length and complexity analysis',
          'Passive voice and jargon detection',
          'Paragraph length and rhythm',
          'Transition word usage',
          'Plain English scoring',
        ],
      },
      {
        title: 'Structure & On-Page',
        items: [
          'Heading hierarchy (H1-H6) validation',
          'Word count and content depth',
          'Internal linking density',
          'List and table presence',
          'Image usage with descriptive alt text',
          'Above-the-fold content evaluation',
        ],
      },
      {
        title: 'E-E-A-T & Trust Signals',
        items: [
          'Author byline and bio detection',
          'Last-updated date freshness',
          'Citation and source linking',
          'Schema (Article, Author, Organization)',
          'About-page and contact-page presence',
          'Original research and data signals',
        ],
      },
    ],
    methodology: [
      { step: 1, title: 'Read Every Page', description: 'We parse the visible content of every crawled page and analyse it the way a search quality rater would.' },
      { step: 2, title: 'Score the Four Pillars', description: 'Readability, structure, engagement, and E-E-A-T each receive a 0-100 sub-score, then combine into a single Content Quality Score.' },
      { step: 3, title: 'Compare Against Benchmarks', description: 'Your scores are compared to category averages and Google quality rater guidelines so you know exactly where you stand.' },
      { step: 4, title: 'Prioritise High-Impact Fixes', description: 'Every finding includes a plain-English explanation and a recommended change ranked by ranking impact.' },
    ],
    commonIssues: [
      { title: 'Thin content (under 300 words)', severity: 'critical', description: 'Pages with too little substance struggle to rank. Search engines see them as low-value and often skip them.' },
      { title: 'No author byline or bio', severity: 'serious', description: 'After the Helpful Content Update, pages without clear author attribution are treated as lower E-E-A-T and demoted for YMYL queries.' },
      { title: 'Missing or weak heading structure', severity: 'serious', description: 'Pages without a clear H1 → H2 → H3 hierarchy confuse both readers and crawlers, hurting featured-snippet eligibility.' },
      { title: 'Excessive sentence length', severity: 'moderate', description: 'Sentences over 25 words consistently raise reading grade level and lower comprehension on mobile.' },
      { title: 'No internal links from the body', severity: 'moderate', description: 'Body-text links signal topical authority and pass PageRank. Pages without them are weaker ranking targets.' },
      { title: 'Missing last-updated date', severity: 'minor', description: 'Freshness signals — visible dates and updated schema — measurably influence rankings on time-sensitive queries.' },
    ],
    businessImpact: {
      headline: 'Why content quality matters for your business',
      description: 'High-quality content ranks higher, converts better, and is far more likely to get cited by AI search engines like ChatGPT, Claude, and Perplexity.',
      stats: [
        { value: '63', label: 'average Content Quality Score across audited sites — most have a clear ceiling' },
        { value: '2.3×', label: 'higher CTR on results with clear author bylines and updated dates' },
        { value: '300+', label: 'minimum word count Google rewards as substantive on most topics' },
      ],
    },
    cta: { headline: 'See your Content Quality Score', description: 'Run a free Kritano audit and find out exactly how your pages score on readability, structure, and E-E-A-T.', buttonText: 'Start Content Audit' },
    relatedSlugs: ['seo', 'accessibility', 'performance'],
    definition: 'A content quality audit evaluates web pages against the principles search engines use to rank content — readability, structural clarity, engagement, and E-E-A-T (experience, expertise, authoritativeness, trustworthiness) — and assigns a Content Quality Score along with specific, prioritised improvements.',
    faqs: [
      { question: 'What is a Content Quality Score?', answer: 'Kritano\'s Content Quality Score (CQS) is a single 0-100 number that combines readability (Flesch reading ease, sentence length), structure (heading hierarchy, internal links), engagement (visual breaks, lists), and E-E-A-T signals (author, dates, citations). It tells you at a glance how well a page is positioned to rank and convert.' },
      { question: 'How is this different from SEO auditing?', answer: 'SEO auditing focuses on technical factors and metadata: titles, schema, links, Core Web Vitals. Content quality auditing focuses on the words on the page — whether they are clear, well-structured, and credible. Both matter. Most sites we audit fail on content quality long before they fail on technical SEO.' },
      { question: 'What is E-E-A-T and why does it matter?', answer: 'E-E-A-T stands for Experience, Expertise, Authoritativeness, and Trustworthiness — the framework Google\'s quality raters use to evaluate content. Since the Helpful Content Update, pages without clear author signals, citations, and freshness markers are demoted in search results, especially for YMYL (your money or your life) topics.' },
      { question: 'Does content quality affect AI search visibility?', answer: 'Yes — significantly. ChatGPT, Claude, Perplexity, and Gemini all preferentially cite content that is well-structured, factually clear, and includes author and freshness signals. The same fixes that raise CQS also raise the odds of being cited as a source in AI answers.' },
    ],
    keyTakeaways: [
      'Scores every page on readability, structure, engagement, and E-E-A-T signals.',
      'Most audited sites score 63/100 — and the fixes are usually short and specific.',
      'The same improvements that lift CQS also improve AI search citation rates.',
    ],
  },
};

// ── SVG Icon Helpers ────────────────────────────────────────────────

const SERVICE_ICON_SVGS: Record<string, string> = {
  TrendingUp: '<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>',
  Accessibility: '<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>',
  Shield: '<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>',
  Zap: '<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>',
  BookOpen: '<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>',
};

const SERVICE_ICON_SVGS_SM: Record<string, string> = {
  TrendingUp: '<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>',
  Accessibility: '<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>',
  Shield: '<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>',
  Zap: '<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>',
  BookOpen: '<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>',
};

const SERVICE_ICON_SVGS_LG: Record<string, string> = {
  TrendingUp: '<svg class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>',
  Accessibility: '<svg class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>',
  Shield: '<svg class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>',
  Zap: '<svg class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>',
  BookOpen: '<svg class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>',
};

const ACCENT_COLORS: Record<string, string> = {
  violet: '#8b5cf6',
  emerald: '#10b981',
  red: '#ef4444',
  sky: '#0ea5e9',
  amber: '#f59e0b',
};

function getAccentColor(colorScheme: ServiceData['colorScheme']): string {
  if (colorScheme.text.includes('violet')) return ACCENT_COLORS.violet;
  if (colorScheme.text.includes('emerald')) return ACCENT_COLORS.emerald;
  if (colorScheme.text.includes('red')) return ACCENT_COLORS.red;
  if (colorScheme.text.includes('amber')) return ACCENT_COLORS.amber;
  return ACCENT_COLORS.sky;
}

function severityIconSvg(severity: CommonIssue['severity']): { svg: string; bg: string; text: string } {
  const colors: Record<string, { stroke: string; bg: string; text: string }> = {
    critical: { stroke: 'text-red-500', bg: 'bg-red-50', text: 'text-red-700' },
    serious: { stroke: 'text-orange-500', bg: 'bg-orange-50', text: 'text-orange-700' },
    moderate: { stroke: 'text-amber-500', bg: 'bg-amber-50', text: 'text-amber-700' },
    minor: { stroke: 'text-sky-500', bg: 'bg-sky-50', text: 'text-sky-700' },
  };
  const svgs: Record<string, string> = {
    critical: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>',
    serious: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>',
    moderate: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>',
    minor: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>',
  };
  const c = colors[severity];
  return { svg: `<svg class="w-4 h-4 ${c.stroke}" fill="none" viewBox="0 0 24 24" stroke="currentColor">${svgs[severity]}</svg>`, bg: c.bg, text: c.text };
}

// ── Services Listing Page ───────────────────────────────────────────

const SERVICES_LISTING = [
  { id: 'seo', accentColor: 'border-t-violet-500', iconColor: 'text-violet-600 bg-violet-50', stat: '100+', statLabel: 'ranking factors', description: 'Metadata, structured data, broken links, Core Web Vitals, and mobile-friendliness - with clear fix guidance for every issue.', features: ['Title tags & meta descriptions', 'Heading hierarchy & structure', 'Broken links & redirects', 'Schema.org validation', 'Sitemap & robots.txt', 'Core Web Vitals'] },
  { id: 'accessibility', accentColor: 'border-t-emerald-500', iconColor: 'text-emerald-700 bg-emerald-50', stat: 'AA', statLabel: 'WCAG compliance', description: 'Ensure your site is usable by everyone. Checks against WCAG 2.2 Level AA - colour contrast, keyboard nav, screen readers, ARIA, and more.', features: ['Colour contrast validation', 'Alt text & ARIA labels', 'Keyboard navigation', 'Screen reader compatibility', 'Form label & error handling', 'Semantic HTML structure'] },
  { id: 'security', accentColor: 'border-t-red-500', iconColor: 'text-red-700 bg-red-50', stat: '40+', statLabel: 'security checks', description: 'Exposed files, missing headers, mixed content, cookie flags, and common misconfigurations that put your users at risk.', features: ['HTTPS & SSL validation', 'Security headers (CSP, HSTS)', 'Exposed .env & backups', 'Mixed content detection', 'Cookie security flags', 'CORS configuration'] },
  { id: 'performance', accentColor: 'border-t-sky-500', iconColor: 'text-sky-700 bg-sky-50', stat: '3', statLabel: 'Core Web Vitals', description: 'Page speed directly impacts rankings and conversions. We identify exactly what slows your pages down, prioritised by impact.', features: ['LCP, INP & CLS', 'Image optimisation', 'JS & CSS analysis', 'Caching headers', 'Render-blocking resources', 'Third-party script impact'] },
  { id: 'content-quality', accentColor: 'border-t-amber-500', iconColor: 'text-amber-700 bg-amber-50', stat: 'CQS', statLabel: 'content quality score', description: 'Readability, structure, engagement, and E-E-A-T signals scored on every page — the same factors search engines and AI search use to rank content.', features: ['Readability & grade level', 'Heading hierarchy', 'Word count & depth', 'Author & freshness signals', 'Internal link density', 'E-E-A-T scoring'] },
];

const SERVICE_FAQS = [
  { q: 'What does a website audit check?', a: 'Kritano audits six dimensions: SEO, accessibility (WCAG 2.2), security, performance, content quality, and structured data. Each dimension runs dozens of individual checks across every crawled page.' },
  { q: 'How long does an audit take?', a: 'Most audits complete within 2-5 minutes depending on the number of pages. Kritano crawls up to 1,000 pages per audit and runs all checks in parallel for speed.' },
  { q: 'Do I need to install anything on my website?', a: 'No. Kritano audits your site externally by crawling it like a search engine would. There is nothing to install, no code changes required, and no impact on your live site.' },
  { q: 'What accessibility standards do you test against?', a: 'Kritano tests against WCAG 2.2 Level AA, which is the standard required by the European Accessibility Act (EAA) and most accessibility legislation worldwide.' },
  { q: 'Can I export the audit results?', a: 'Yes. Audit results can be exported as PDF reports, CSV spreadsheets, or Markdown files. PDF reports include visual score breakdowns, issue details, and fix recommendations.' },
  { q: 'How is this different from free audit tools?', a: 'Free tools typically check a single page for basic SEO. Kritano crawls your entire site and checks six categories with 400+ rules, content quality scoring, and actionable fix code for every issue. See our detailed comparison of website audit tools at <a href="/compare/best-website-audit-tools">kritano.com/compare</a> for a full breakdown.' },
];

export function renderServicesPage(): string {
  const checkCircleSvg = '<svg class="w-3.5 h-3.5 text-slate-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
  const arrowRightSm = '<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>';
  const arrowRight = '<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>';

  const serviceCards = SERVICES_LISTING.map((service) => {
    const data = SERVICES_DATA[service.id];
    const icon = SERVICE_ICON_SVGS[data.iconName];
    const featuresHtml = service.features.map(f =>
      `<div class="flex items-center gap-2">${checkCircleSvg}<span class="text-xs text-slate-600">${escapeHtml(f)}</span></div>`
    ).join('\n                    ');

    return `
            <div class="bg-white border border-slate-200 border-t-[3px] ${service.accentColor} rounded-xl overflow-hidden">
              <div class="p-8">
                <div class="flex items-start justify-between mb-5">
                  <div class="flex items-center gap-3">
                    <div class="w-11 h-11 rounded-lg ${service.iconColor} flex items-center justify-center">
                      ${icon}
                    </div>
                    <div>
                      <h2 class="text-lg font-semibold text-slate-900">
                        <a href="/services/${service.id}" class="hover:text-indigo-600 transition-colors">${escapeHtml(data.title)}</a>
                      </h2>
                      <p class="text-sm text-indigo-600 font-medium">${escapeHtml(data.subtitle)}</p>
                    </div>
                  </div>
                  <div class="text-right flex-shrink-0">
                    <p class="font-display text-2xl text-slate-900">${escapeHtml(service.stat)}</p>
                    <p class="text-[10px] text-slate-600 uppercase tracking-wider font-medium">${escapeHtml(service.statLabel)}</p>
                  </div>
                </div>
                <p class="text-sm text-slate-600 leading-relaxed mb-6">${escapeHtml(service.description)}</p>
                <div class="grid grid-cols-2 gap-x-4 gap-y-2 mb-6">
                    ${featuresHtml}
                </div>
                <div class="flex items-center gap-4">
                  <a href="/register?ea=email" class="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors text-sm">
                    Join Early Access ${arrowRightSm}
                  </a>
                  <a href="/services/${service.id}" class="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors flex items-center gap-1">
                    Learn more ${arrowRightSm}
                  </a>
                </div>
              </div>
            </div>`;
  }).join('\n');

  const faqsHtml = SERVICE_FAQS.map(faq => `
          <details class="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <summary class="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-slate-50 transition-colors">
              <span class="font-semibold text-slate-900 text-sm pr-4">${escapeHtml(faq.q)}</span>
              <svg class="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
            </summary>
            <div class="px-5 pb-4">
              <p class="text-sm text-slate-600 leading-relaxed">${escapeHtml(faq.a)}</p>
            </div>
          </details>`).join('\n');

  const toolCards = [
    { icon: '<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>', title: 'PDF & CSV Reports', description: 'Branded exports for clients, stakeholders, and compliance.' },
    { icon: '<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>', title: 'Trend Analytics', description: 'Track scores over time. Compare audits. Measure real progress.' },
    { icon: '<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>', title: 'Multi-Page Crawling', description: 'Audit one page or crawl your entire site in one scan.' },
    { icon: '<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>', title: 'Scheduled Audits', description: 'Automated monitoring on your preferred schedule.' },
  ];

  const toolCardsHtml = toolCards.map(item => `
              <div class="bg-white border border-slate-200 rounded-xl p-5 text-center hover:shadow-sm transition-shadow">
                <div class="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 mb-3">
                  ${item.icon}
                </div>
                <h3 class="font-semibold text-slate-900 mb-1.5 text-sm">${escapeHtml(item.title)}</h3>
                <p class="text-slate-600 text-xs leading-relaxed">${escapeHtml(item.description)}</p>
              </div>`).join('\n');

  const structuredData = [
    jsonLd({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: SERVICES_LISTING.map((s, i) => ({
        '@type': 'Service',
        position: i + 1,
        name: SERVICES_DATA[s.id].title,
        description: s.description,
        provider: { '@type': 'Organization', name: 'Kritano', url: 'https://kritano.com' },
      })),
    }),
    jsonLd({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://kritano.com' },
        { '@type': 'ListItem', position: 2, name: 'Services', item: 'https://kritano.com/services' },
      ],
    }),
    jsonLd({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: SERVICE_FAQS.map(faq => ({
        '@type': 'Question',
        name: faq.q,
        acceptedAnswer: { '@type': 'Answer', text: faq.a },
      })),
    }),
  ].join('\n  ');

  const body = `<main id="main-content" aria-label="Page content">

    <!-- Hero -->
    <section class="max-w-7xl mx-auto px-6 lg:px-20 pt-20 lg:pt-28 pb-16">
      <div class="max-w-3xl">
        <h1 class="font-display text-5xl lg:text-6xl text-slate-900 leading-[1.05] mb-4">
          Website Auditing Services
        </h1>
        <h2 class="font-display text-2xl lg:text-3xl text-slate-600 leading-snug mb-8">
          Six dimensions of website health.
        </h2>
        <p class="text-xl text-slate-600 leading-relaxed mb-6">
          A website audit is a systematic review of your site's technical health. It checks for problems that affect search rankings, user experience, and security. Kritano runs over 500 rules across six categories in a single scan.
        </p>
        <p class="text-lg text-slate-600 leading-relaxed">
          In our testing, we found that the average website has issues in every category. For example, research from <a href="https://webaim.org/projects/million/" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:text-indigo-700 underline decoration-indigo-300 underline-offset-2 hover:decoration-indigo-600">WebAIM</a> shows that 95.9% of home pages have accessibility failures. Similarly, <a href="https://developer.mozilla.org/en-US/docs/Web/Security/Practical_implementation_guides" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:text-indigo-700 underline decoration-indigo-300 underline-offset-2 hover:decoration-indigo-600">MDN security guidelines</a> recommend headers that fewer than 30% of sites implement. Every finding in Kritano tells you exactly how to fix the problem.
        </p>
      </div>
    </section>

    <!-- Service Cards -->
    <section class="max-w-7xl mx-auto px-6 lg:px-20 pb-16">
      <div class="grid md:grid-cols-2 gap-6">
${serviceCards}
      </div>
    </section>

    <!-- Content Intelligence Callout -->
    <section class="max-w-7xl mx-auto px-6 lg:px-20 pb-16">
      <div class="bg-gradient-to-r from-teal-50 to-indigo-50/30 border border-teal-200/60 rounded-2xl p-8 lg:p-10">
        <div class="flex flex-col lg:flex-row items-start gap-8">
          <div class="flex-shrink-0">
            <div class="w-12 h-12 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
            </div>
          </div>
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-2">
              <h2 class="text-lg font-semibold text-slate-900">Content Intelligence</h2>
              <span class="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-teal-100 text-teal-700 rounded-full">Only on Kritano</span>
            </div>
            <p class="text-sm text-slate-600 leading-relaxed mb-4 max-w-2xl">
              The only audit tool that scores your content the way search engines evaluate it.
              E-E-A-T analysis, Answer Engine Optimisation, readability scoring, and engagement
              markers - unified into a Content Quality Score across 400+ checks.
            </p>
            <a href="/register?ea=email" class="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:text-teal-900 transition-colors">
              Join Early Access ${arrowRight}
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- Beyond Auditing -->
    <section class="bg-slate-50 border-t border-slate-200">
      <div class="max-w-7xl mx-auto px-6 lg:px-20 py-20">
        <div class="text-center max-w-2xl mx-auto mb-14">
          <p class="text-indigo-600 font-semibold tracking-wide uppercase text-sm mb-4">
            Beyond Auditing
          </p>
          <h2 class="font-display text-4xl text-slate-900 leading-tight">
            Tools that support the whole journey
          </h2>
        </div>
        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
${toolCardsHtml}
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section class="max-w-7xl mx-auto px-6 lg:px-20 py-24">
      <div class="max-w-3xl mx-auto text-center mb-12">
        <h2 class="font-display text-3xl text-slate-900 mb-3">Frequently Asked Questions</h2>
        <p class="text-slate-600">Common questions about our auditing services.</p>
      </div>
      <div class="max-w-3xl mx-auto space-y-3">
${faqsHtml}
      </div>
    </section>

    <!-- CTA -->
    <section class="max-w-7xl mx-auto px-6 lg:px-20 py-24">
      <div class="bg-indigo-600 rounded-2xl p-10 md:p-14 relative overflow-hidden">
        <div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:32px_32px]"></div>
        <div class="relative text-center max-w-xl mx-auto">
          <h2 class="font-display text-3xl lg:text-4xl text-white leading-tight mb-5">
            See Kritano in action
          </h2>
          <p class="text-indigo-200 leading-relaxed mb-8">
            Run your first audit in under two minutes. No credit card, no commitment.
          </p>
          <a href="/register?ea=email" class="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-indigo-700 rounded-lg font-semibold hover:bg-indigo-50 transition-colors">
            Join Early Access ${arrowRight}
          </a>
        </div>
      </div>
    </section>

    <!-- Author -->
    <section class="max-w-7xl mx-auto px-6 lg:px-20 py-12">
      <div class="max-w-3xl mx-auto">
        ${renderAuthorBio()}
      </div>
    </section>

  </main>`;

  return htmlShell({
    title: 'Auditing Services - SEO, Accessibility & Security',
    description: 'Comprehensive website auditing services: SEO, accessibility (WCAG 2.2), security scanning, and performance analysis.',
    canonicalUrl: `${BASE_URL}/services`,
    ogImage: `${BASE_URL}/brand/og-services.png`,
    ogType: 'website',
    extraHead: structuredData,
    body,
    activePath: '/services',
  });
}

// ── Service Detail Page ─────────────────────────────────────────────

export function renderServiceDetailPage(slug: string): string | null {
  const service = SERVICES_DATA[slug];
  if (!service) return null;

  const accentColor = getAccentColor(service.colorScheme);
  const iconSvgLg = SERVICE_ICON_SVGS_LG[service.iconName];
  const checkCircle = '<svg class="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
  const arrowRight = '<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>';
  const arrowRightSm = '<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>';

  // Hero stat cards
  const statCardsHtml = service.businessImpact.stats.map(stat => `
                <div class="bg-white border border-slate-200 rounded-xl p-5 text-center">
                  <p class="font-display text-3xl mb-1" style="color: ${accentColor}">${escapeHtml(stat.value)}</p>
                  <p class="text-xs text-slate-600 leading-relaxed">${escapeHtml(stat.label)}</p>
                </div>`).join('\n');

  // Definition block
  const definitionTitle = service.title.toLowerCase().replace(/\(.*\)/, '').trim();

  // Feature groups
  const featureGroupsHtml = service.featureGroups.map(group => {
    const itemsHtml = group.items.map(item =>
      `<li class="flex items-start gap-2.5"><span style="color: ${accentColor}">${checkCircle}</span><span class="text-slate-600 text-sm leading-relaxed">${escapeHtml(item)}</span></li>`
    ).join('\n                    ');
    return `
              <div class="bg-white border border-slate-200 rounded-xl p-6">
                <h3 class="font-semibold text-slate-900 mb-4 text-sm uppercase tracking-wider">${escapeHtml(group.title)}</h3>
                <ul class="space-y-2.5">
                    ${itemsHtml}
                </ul>
              </div>`;
  }).join('\n');

  // Methodology steps
  const methodologyHtml = service.methodology.map((step, i) => {
    const connector = i < service.methodology.length - 1
      ? '<div class="hidden md:block absolute top-[3.5rem] left-[calc(50%+1.5rem)] right-[calc(-50%+1.5rem)] h-px bg-slate-200"></div>'
      : '';
    return `
              <div class="relative flex flex-col items-center text-center px-4 py-6">
                ${connector}
                <div class="relative z-10 w-12 h-12 rounded-full flex items-center justify-center font-semibold text-sm mb-4 border" style="background-color: ${accentColor}11; color: ${accentColor}; border-color: ${accentColor}33">
                  ${step.step}
                </div>
                <h3 class="font-semibold text-slate-900 mb-2 text-sm">${escapeHtml(step.title)}</h3>
                <p class="text-slate-600 text-xs leading-relaxed max-w-[200px]">${escapeHtml(step.description)}</p>
              </div>`;
  }).join('\n');

  // Common issues
  const issuesHtml = service.commonIssues.map(issue => {
    const sev = severityIconSvg(issue.severity);
    return `
              <div class="bg-white border border-slate-200 rounded-lg p-5 flex items-start gap-4">
                <div class="flex-shrink-0 w-8 h-8 rounded-lg ${sev.bg} flex items-center justify-center">
                  ${sev.svg}
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <h3 class="font-semibold text-slate-900 text-sm">${escapeHtml(issue.title)}</h3>
                    <span class="px-1.5 py-0.5 rounded text-[10px] font-medium capitalize ${sev.bg} ${sev.text}">${escapeHtml(issue.severity)}</span>
                  </div>
                  <p class="text-slate-600 text-xs leading-relaxed">${escapeHtml(issue.description)}</p>
                </div>
              </div>`;
  }).join('\n');

  // Key takeaways
  const takeawaysHtml = service.keyTakeaways.map(t =>
    `<li class="flex items-start gap-2.5"><svg class="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg><span class="text-slate-700 text-sm leading-relaxed">${escapeHtml(t)}</span></li>`
  ).join('\n              ');

  // FAQs
  const faqsHtml = service.faqs.map(faq => `
          <details class="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <summary class="w-full flex items-center justify-between gap-4 p-5 cursor-pointer">
              <div class="flex items-start gap-3">
                <svg class="w-5 h-5 flex-shrink-0 mt-0.5" style="color: ${accentColor}" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                <span class="font-semibold text-slate-900 text-sm">${escapeHtml(faq.question)}</span>
              </div>
              <svg class="w-5 h-5 text-slate-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
            </summary>
            <div class="px-5 pb-5 pt-0 pl-[3.25rem]">
              <p class="text-sm text-slate-600 leading-relaxed">${escapeHtml(faq.answer)}</p>
            </div>
          </details>`).join('\n');

  // Related services
  const relatedHtml = service.relatedSlugs.map(relSlug => {
    const related = SERVICES_DATA[relSlug];
    if (!related) return '';
    const relIcon = SERVICE_ICON_SVGS_SM[related.iconName];
    const relAccent = getAccentColor(related.colorScheme);
    return `
              <a href="/services/${relSlug}" class="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md transition-all block">
                <div class="inline-flex items-center justify-center w-11 h-11 rounded-lg mb-4" style="background-color: ${relAccent}11">
                  <span style="color: ${relAccent}">${relIcon}</span>
                </div>
                <h3 class="font-semibold text-slate-900 mb-1">${escapeHtml(related.title)}</h3>
                <p class="text-slate-600 text-sm mb-3">${escapeHtml(related.subtitle)}</p>
                <span class="inline-flex items-center gap-1 text-indigo-600 text-sm font-medium">
                  Learn more ${arrowRightSm}
                </span>
              </a>`;
  }).join('\n');

  const structuredData = [
    jsonLd({
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: service.title,
      description: service.seo.description,
      provider: { '@type': 'Organization', name: 'Kritano', url: 'https://kritano.com' },
      url: `https://kritano.com/services/${slug}`,
    }),
    jsonLd({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://kritano.com' },
        { '@type': 'ListItem', position: 2, name: 'Services', item: 'https://kritano.com/services' },
        { '@type': 'ListItem', position: 3, name: service.title, item: `https://kritano.com/services/${slug}` },
      ],
    }),
    jsonLd({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: service.faqs.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer },
      })),
    }),
  ].join('\n  ');

  const body = `<main id="main-content" aria-label="Page content">

    <!-- Hero -->
    <section class="relative">
      <div class="absolute top-0 left-0 right-0 h-1" style="background: ${accentColor}"></div>
      <div class="max-w-7xl mx-auto px-6 lg:px-20 pt-20 lg:pt-28 pb-16">
        <nav aria-label="Breadcrumb" class="mb-8">
          <ol class="flex items-center gap-2 text-sm text-slate-600">
            <li><a href="/services" class="hover:text-indigo-600 transition-colors underline decoration-slate-300 underline-offset-2 hover:decoration-indigo-400">Services</a></li>
            <li aria-hidden="true"><svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg></li>
            <li class="text-slate-900 font-medium">${escapeHtml(service.title)}</li>
          </ol>
        </nav>

        <div class="grid lg:grid-cols-2 gap-16 items-start">
          <div>
            <div class="inline-flex items-center justify-center w-14 h-14 rounded-xl border mb-6" style="background-color: ${accentColor}11; border-color: ${accentColor}33">
              <span style="color: ${accentColor}">${iconSvgLg}</span>
            </div>
            <h1 class="font-display text-5xl lg:text-6xl text-slate-900 leading-[1.05] mb-4">
              ${escapeHtml(service.title)}
            </h1>
            <p class="text-xl font-medium mb-6" style="color: ${accentColor}">
              ${escapeHtml(service.subtitle)}
            </p>
            <p class="text-lg text-slate-600 leading-relaxed mb-8">
              ${escapeHtml(service.heroDescription)}
            </p>
            <a href="/register?ea=email" class="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors text-sm">
              Join Early Access ${arrowRight}
            </a>
          </div>

          <div class="grid grid-cols-3 gap-4">
${statCardsHtml}
          </div>
        </div>
      </div>
    </section>

    <!-- Definition -->
    <section class="border-t border-slate-200 bg-white">
      <div class="max-w-7xl mx-auto px-6 lg:px-20 py-10">
        <div class="max-w-3xl mx-auto">
          <p class="text-lg text-slate-700 leading-relaxed">
            <strong class="text-slate-900">What is ${escapeHtml(definitionTitle)}?</strong> ${escapeHtml(service.definition)}
          </p>
        </div>
      </div>
    </section>

    <!-- Feature Breakdown -->
    <section class="bg-slate-50 border-t border-b border-slate-200">
      <div class="max-w-7xl mx-auto px-6 lg:px-20 py-20">
        <div class="text-center max-w-2xl mx-auto mb-14">
          <p class="font-semibold tracking-wide uppercase text-sm mb-4" style="color: ${accentColor}">What We Check</p>
          <h2 class="font-display text-4xl text-slate-900 leading-tight">Comprehensive feature breakdown</h2>
        </div>
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
${featureGroupsHtml}
        </div>
      </div>
    </section>

    <!-- Methodology -->
    <section class="max-w-7xl mx-auto px-6 lg:px-20 py-20">
      <div class="text-center max-w-2xl mx-auto mb-14">
        <p class="font-semibold tracking-wide uppercase text-sm mb-4" style="color: ${accentColor}">Methodology</p>
        <h2 class="font-display text-4xl text-slate-900 leading-tight">How we audit</h2>
      </div>
      <div class="grid md:grid-cols-4 gap-0">
${methodologyHtml}
      </div>
    </section>

    <!-- Common Issues -->
    <section class="bg-slate-50 border-t border-b border-slate-200">
      <div class="max-w-7xl mx-auto px-6 lg:px-20 py-20">
        <div class="text-center max-w-2xl mx-auto mb-14">
          <p class="font-semibold tracking-wide uppercase text-sm mb-4" style="color: ${accentColor}">Common Findings</p>
          <h2 class="font-display text-4xl text-slate-900 leading-tight">Issues we commonly detect</h2>
        </div>
        <div class="max-w-3xl mx-auto space-y-3">
${issuesHtml}
        </div>
      </div>
    </section>

    <!-- Key Takeaways -->
    <section class="max-w-7xl mx-auto px-6 lg:px-20 py-12">
      <div class="max-w-3xl mx-auto bg-indigo-50 border border-indigo-100 rounded-xl p-6">
        <div class="flex items-center gap-2 mb-4">
          <svg class="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
          <h2 class="font-semibold text-slate-900 text-sm uppercase tracking-wider">Key Takeaways</h2>
        </div>
        <ul class="space-y-2.5">
              ${takeawaysHtml}
        </ul>
      </div>
    </section>

    <!-- Business Impact -->
    <section class="max-w-7xl mx-auto px-6 lg:px-20 py-20">
      <div class="max-w-3xl mx-auto text-center">
        <h2 class="font-display text-4xl text-slate-900 leading-tight mb-4">
          ${escapeHtml(service.businessImpact.headline)}
        </h2>
        <p class="text-lg text-slate-600 leading-relaxed">
          ${escapeHtml(service.businessImpact.description)}
        </p>
      </div>
    </section>

    <!-- FAQ -->
    <section class="max-w-7xl mx-auto px-6 lg:px-20 py-20">
      <div class="text-center max-w-2xl mx-auto mb-14">
        <p class="font-semibold tracking-wide uppercase text-sm mb-4" style="color: ${accentColor}">FAQ</p>
        <h2 class="font-display text-4xl text-slate-900 leading-tight">Frequently asked questions</h2>
      </div>
      <div class="max-w-3xl mx-auto space-y-3">
${faqsHtml}
      </div>
    </section>

    <!-- Related Services -->
    <section class="bg-slate-50 border-t border-slate-200">
      <div class="max-w-7xl mx-auto px-6 lg:px-20 py-20">
        <div class="text-center max-w-2xl mx-auto mb-14">
          <p class="text-indigo-600 font-semibold tracking-wide uppercase text-sm mb-4">Complete Coverage</p>
          <h2 class="font-display text-4xl text-slate-900 leading-tight">Explore other audit dimensions</h2>
        </div>
        <div class="grid md:grid-cols-3 gap-6">
${relatedHtml}
        </div>
      </div>
    </section>

    <!-- Author -->
    <section class="max-w-7xl mx-auto px-6 lg:px-20 py-12">
      <div class="max-w-3xl mx-auto">
        ${renderAuthorBio()}
        <p class="text-xs text-slate-600 mt-4">Last updated: <time datetime="2026-05-07">7 May 2026</time></p>
      </div>
    </section>

    <!-- CTA -->
    <section class="max-w-7xl mx-auto px-6 lg:px-20 py-20">
      <div class="bg-indigo-600 rounded-2xl p-10 md:p-14 relative overflow-hidden">
        <div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:32px_32px]"></div>
        <div class="relative text-center max-w-xl mx-auto">
          <h2 class="font-display text-3xl lg:text-4xl text-white leading-tight mb-5">
            ${escapeHtml(service.cta.headline)}
          </h2>
          <p class="text-indigo-200 leading-relaxed mb-8">
            ${escapeHtml(service.cta.description)}
          </p>
          <a href="/register?ea=email" class="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-indigo-700 rounded-lg font-semibold hover:bg-indigo-50 transition-colors">
            Join Early Access ${arrowRight}
          </a>
        </div>
      </div>
    </section>

  </main>`;

  return htmlShell({
    title: service.seo.title,
    description: service.seo.description,
    canonicalUrl: `${BASE_URL}/services/${slug}`,
    ogImage: `${BASE_URL}${service.ogImage}`,
    ogType: 'website',
    extraHead: structuredData,
    body,
    activePath: '/services',
  });
}

// ── Pricing Page ─────────────────────────────────────────────────────

const CHECK_SVG = '<svg class="w-4 h-4 text-indigo-600 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
const X_SVG = '<svg class="w-4 h-4 text-slate-300 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>';

function boolCell(val: boolean): string {
  return val ? CHECK_SVG : X_SVG;
}

function textCell(val: string, isProCol = false): string {
  return `<td class="px-4 py-3 text-sm text-slate-700 text-center${isProCol ? ' bg-indigo-50' : ''}">${escapeHtml(val)}</td>`;
}

function boolRow(label: string, vals: [boolean, boolean, boolean, boolean, boolean]): string {
  return `<tr class="border-b border-slate-100">
    <td class="px-4 py-3 text-sm text-slate-700">${escapeHtml(label)}</td>
    <td class="px-4 py-3 text-center">${boolCell(vals[0])}</td>
    <td class="px-4 py-3 text-center">${boolCell(vals[1])}</td>
    <td class="px-4 py-3 text-center bg-indigo-50">${boolCell(vals[2])}</td>
    <td class="px-4 py-3 text-center">${boolCell(vals[3])}</td>
    <td class="px-4 py-3 text-center">${boolCell(vals[4])}</td>
  </tr>`;
}

function textRow(label: string, vals: [string, string, string, string, string]): string {
  return `<tr class="border-b border-slate-100">
    <td class="px-4 py-3 text-sm text-slate-700">${escapeHtml(label)}</td>
    <td class="px-4 py-3 text-sm text-slate-700 text-center">${escapeHtml(vals[0])}</td>
    <td class="px-4 py-3 text-sm text-slate-700 text-center">${escapeHtml(vals[1])}</td>
    <td class="px-4 py-3 text-sm text-slate-700 text-center bg-indigo-50">${escapeHtml(vals[2])}</td>
    <td class="px-4 py-3 text-sm text-slate-700 text-center">${escapeHtml(vals[3])}</td>
    <td class="px-4 py-3 text-sm text-slate-700 text-center">${escapeHtml(vals[4])}</td>
  </tr>`;
}

function sectionHeader(title: string): string {
  return `<tr class="bg-slate-50">
    <td colspan="6" class="px-4 py-3 text-sm font-semibold text-slate-900">${escapeHtml(title)}</td>
  </tr>`;
}

export function renderPricingPage(): string {
  const plans = [
    { name: 'Free', desc: 'For personal projects and small sites.', price: '$0', period: '/mo', pages: '50 pages', features: ['5 audits per month', 'SEO, security &amp; content checks', '30-day data retention'], cta: 'Join Early Access', highlight: false },
    { name: 'Starter', desc: 'For freelancers and growing sites.', price: '$19', period: '/mo', pages: '250 pages', features: ['10 audits per month', 'Accessibility &amp; performance checks', '90-day data retention'], cta: 'Join Early Access', highlight: false },
    { name: 'Pro', desc: 'For professionals who need full insight.', price: '$49', period: '/mo', pages: '1,000 pages', features: ['Unlimited audits', 'All check categories', '1-year data retention'], cta: 'Join Early Access', highlight: true, badge: 'Most Popular' },
    { name: 'Agency', desc: 'For agencies managing client sites.', price: '$99', period: '/mo', pages: '5,000 pages', features: ['White-label reports', '50 sites included', '2-year data retention'], cta: 'Join Early Access', highlight: false },
    { name: 'Enterprise', desc: 'For large organisations with custom needs.', price: 'Custom', period: '', pages: '10,000+ pages', features: ['Dedicated account manager', 'Unlimited sites &amp; seats', 'Unlimited data retention'], cta: 'Contact Us', highlight: false },
  ];

  const pricingCards = plans.map(p => {
    const cardClasses = p.highlight
      ? 'relative bg-slate-900 text-white ring-2 ring-indigo-600 rounded-2xl p-6 flex flex-col'
      : 'relative bg-white border border-slate-200 rounded-2xl p-6 flex flex-col';
    const nameClasses = p.highlight ? 'text-lg font-semibold text-white' : 'text-lg font-semibold text-slate-900';
    const descClasses = p.highlight ? 'text-sm text-slate-300 mt-1' : 'text-sm text-slate-500 mt-1';
    const priceClasses = p.highlight ? 'text-4xl font-bold text-white mt-4' : 'text-4xl font-bold text-slate-900 mt-4';
    const periodClasses = p.highlight ? 'text-sm text-slate-400' : 'text-sm text-slate-500';
    const pagesClasses = p.highlight ? 'text-sm text-slate-300 mt-1' : 'text-sm text-slate-500 mt-1';
    const featureClasses = p.highlight ? 'text-sm text-slate-200' : 'text-sm text-slate-600';
    const btnClasses = p.highlight
      ? 'mt-auto block w-full text-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors text-sm'
      : 'mt-auto block w-full text-center px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg font-medium transition-colors text-sm';

    const badge = p.badge ? `<span class="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-medium px-3 py-1 rounded-full">${p.badge}</span>` : '';

    return `<div class="${cardClasses}">
      ${badge}
      <div class="${nameClasses}">${p.name}</div>
      <p class="${descClasses}">${p.desc}</p>
      <div class="${priceClasses}">${p.price}<span class="${periodClasses}">${p.period}</span></div>
      <p class="${pagesClasses}">${p.pages}</p>
      <ul class="mt-6 mb-8 space-y-3 flex-1">
        ${p.features.map(f => `<li class="flex items-start gap-2"><span class="text-indigo-400 mt-0.5">&middot;</span><span class="${featureClasses}">${f}</span></li>`).join('\n        ')}
      </ul>
      <a href="/register?ea=email" class="${btnClasses}">${p.cta}</a>
    </div>`;
  }).join('\n    ');

  const comparisonTable = `
  <table class="w-full text-left border-collapse">
    <thead>
      <tr class="border-b-2 border-slate-200">
        <th class="px-4 py-3 text-sm font-semibold text-slate-900">Feature</th>
        <th class="px-4 py-3 text-sm font-semibold text-slate-900 text-center">Free</th>
        <th class="px-4 py-3 text-sm font-semibold text-slate-900 text-center">Starter</th>
        <th class="px-4 py-3 text-sm font-semibold text-slate-900 text-center bg-indigo-50">Pro</th>
        <th class="px-4 py-3 text-sm font-semibold text-slate-900 text-center">Agency</th>
        <th class="px-4 py-3 text-sm font-semibold text-slate-900 text-center">Enterprise</th>
      </tr>
    </thead>
    <tbody>
      ${sectionHeader('Audit & Crawl')}
      ${textRow('Max pages per audit', ['50', '250', '1,000', '5,000', '10,000'])}
      ${textRow('Max crawl depth', ['3', '5', '10', '10', '10'])}
      ${textRow('Audits per month', ['5', '10', 'Unlimited', 'Unlimited', 'Unlimited'])}
      ${textRow('Concurrent audits', ['1', '3', '10', '50', '100'])}

      ${sectionHeader('Available Checks')}
      ${boolRow('SEO', [true, true, true, true, true])}
      ${boolRow('Security', [true, true, true, true, true])}
      ${boolRow('Content', [true, true, true, true, true])}
      ${boolRow('Accessibility', [false, true, true, true, true])}
      ${boolRow('Performance', [false, true, true, true, true])}
      ${boolRow('File Extraction', [false, true, true, true, true])}
      ${boolRow('Structured Data', [false, false, false, true, true])}
      ${boolRow('Google Dorking', [false, false, true, true, true])}
      ${boolRow('E-E-A-T Analysis', [false, false, true, true, true])}
      ${boolRow('AEO Analysis', [false, false, true, true, true])}
      ${boolRow('Mobile Audit Pass', [false, true, true, true, true])}

      ${sectionHeader('Sites & Sharing')}
      ${textRow('Max sites', ['1', '3', '10', '50', 'Unlimited'])}
      ${textRow('Members per site', ['0', '1', '3', '10', 'Unlimited'])}
      ${boolRow('Domain locking', [true, false, false, false, false])}

      ${sectionHeader('Scheduling')}
      ${boolRow('Scheduled audits', [false, true, true, true, true])}
      ${textRow('Min schedule interval', ['-', '7 days', '1 day', '1 hour', '15 min'])}

      ${sectionHeader('Exports & Sharing')}
      ${boolRow('PDF export', [false, true, true, true, true])}
      ${textRow('PDF branding', ['-', 'Site colours', 'Site colours', 'White-label', 'White-label'])}
      ${boolRow('CSV export', [false, false, true, true, true])}
      ${boolRow('JSON export', [false, false, true, true, true])}
      ${boolRow('White-label', [false, false, false, true, true])}
      ${boolRow('Shareable report links', [false, false, true, true, true])}
      ${boolRow('Accessibility statement', [false, false, true, true, true])}
      ${boolRow('Public audit badge', [false, true, true, true, true])}
      ${boolRow('Fix snippets code', [false, true, true, true, true])}
      ${boolRow('Fix explanations', [true, true, true, true, true])}

      ${sectionHeader('Content Intelligence')}
      ${textRow('Content Quality Score', ['Score only', 'Breakdown', 'Full detail', 'Full detail', 'Full detail'])}
      ${boolRow('E-E-A-T analysis', [false, false, true, true, true])}
      ${boolRow('AEO analysis', [false, false, true, true, true])}

      ${sectionHeader('Compliance')}
      ${boolRow('EAA compliance status', [true, true, true, true, true])}
      ${boolRow('Full compliance report', [false, false, true, true, true])}
      ${boolRow('Compliance PDF export', [false, false, true, true, true])}

      ${sectionHeader('API & Data')}
      ${textRow('API requests/day', ['100', '1,000', '10,000', '100,000', 'Unlimited'])}
      ${textRow('API requests/min', ['10', '60', '300', '1,000', '2,000'])}
      ${textRow('Data retention', ['30 days', '90 days', '1 year', '2 years', 'Unlimited'])}

      ${sectionHeader('Teams')}
      ${textRow('Max seats', ['1', '1', '5', 'Unlimited', 'Unlimited'])}
    </tbody>
  </table>`;

  const faqs: Array<{ q: string; a: string }> = [
    { q: 'How does the free plan work?', a: 'The free plan lets you audit one website with up to 50 pages per scan and 5 audits per month. You get SEO, security, and content checks with 30-day data retention. No credit card required, no time limit.' },
    { q: 'Can I upgrade or downgrade at any time?', a: 'Yes. You can switch plans whenever you need to. If you upgrade mid-cycle, you\'ll be charged a prorated amount. Downgrades take effect at the end of your current billing period.' },
    { q: 'What counts as a "page" in an audit?', a: 'Each unique URL that our scanner crawls counts as one page. The homepage, blog posts, product pages, and other distinct URLs are each counted separately.' },
    { q: 'What is domain locking on the Free tier?', a: 'Free tier users can only have one site, and the domain can only be changed once per month. This prevents abuse while still letting you try the platform.' },
    { q: 'Is there a free trial for paid plans?', a: 'Every paid plan includes a 14-day free trial with full access. No credit card required to start.' },
    { q: 'Do you offer annual billing?', a: 'Yes! Switch to annual billing and save 2 months - you pay for 10 months and get 12. Use the toggle at the top of the pricing cards to see annual prices.' },
    { q: 'What kind of support do you offer?', a: 'Free and Starter users get community support. Pro users get priority email support. Agency and Enterprise customers get dedicated account management.' },
    { q: 'What happens to my data if I cancel?', a: 'Your data is retained for the period specified in your plan (30 days for Free, 90 days for Starter, etc.). After cancellation, your account is downgraded to the Free tier and data beyond the Free retention window is deleted after 30 days.' },
    { q: 'Do you offer refunds?', a: 'We offer a full refund within 14 days of your first payment if you are not satisfied. Contact us at info@kritano.com.' },
  ];

  const faqHtml = faqs.map(f => `<details class="border border-slate-200 rounded-lg">
        <summary class="px-5 py-4 cursor-pointer text-sm font-medium text-slate-900 hover:bg-slate-50">${escapeHtml(f.q)}</summary>
        <div class="px-5 pb-4 text-sm text-slate-600 leading-relaxed">${escapeHtml(f.a)}</div>
      </details>`).join('\n      ');

  const faqLd = faqs.map(f => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  }));

  const structuredData = [
    jsonLd({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: 'Kritano',
      description: 'Comprehensive website auditing for SEO, accessibility, security, and performance.',
      brand: { '@type': 'Organization', name: 'Kritano' },
      offers: [
        { '@type': 'Offer', name: 'Free', price: '0', priceCurrency: 'USD', url: `${BASE_URL}/pricing` },
        { '@type': 'Offer', name: 'Starter', price: '19', priceCurrency: 'USD', url: `${BASE_URL}/pricing` },
        { '@type': 'Offer', name: 'Pro', price: '49', priceCurrency: 'USD', url: `${BASE_URL}/pricing` },
        { '@type': 'Offer', name: 'Agency', price: '99', priceCurrency: 'USD', url: `${BASE_URL}/pricing` },
        { '@type': 'Offer', name: 'Enterprise', price: '0', priceCurrency: 'USD', url: `${BASE_URL}/pricing`, description: 'Custom pricing' },
      ],
    }),
    jsonLd({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqLd,
    }),
    jsonLd({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
        { '@type': 'ListItem', position: 2, name: 'Pricing', item: `${BASE_URL}/pricing` },
      ],
    }),
  ].join('\n  ');

  const body = `<main id="main-content" aria-label="Page content">

    <!-- Hero -->
    <section class="max-w-7xl mx-auto px-6 lg:px-20 pt-20 lg:pt-28 pb-12 text-center">
      <h1 class="font-display text-5xl lg:text-6xl text-slate-900 leading-tight mb-3">Pricing</h1>
      <h2 class="font-display text-2xl lg:text-3xl text-slate-600 leading-snug mb-5">Simple, transparent pricing.</h2>
      <p class="text-lg text-slate-600 max-w-2xl mx-auto mb-3">Start free, upgrade as you grow. Every plan includes a 14-day free trial with full access.</p>
      <p class="text-base text-slate-500 max-w-2xl mx-auto">No credit card required. Cancel any time.</p>
    </section>

    <!-- Pricing Cards -->
    <section class="max-w-7xl mx-auto px-6 lg:px-20 pb-16">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        ${pricingCards}
      </div>
    </section>

    <!-- Feature Comparison -->
    <section class="max-w-7xl mx-auto px-6 lg:px-20 pb-16">
      <details class="border border-slate-200 rounded-xl overflow-hidden">
        <summary class="px-6 py-4 cursor-pointer text-lg font-semibold text-slate-900 hover:bg-slate-50 bg-white">Full Feature Comparison</summary>
        <div class="overflow-x-auto">
          ${comparisonTable}
        </div>
      </details>
    </section>

    <!-- FAQs -->
    <section class="max-w-3xl mx-auto px-6 lg:px-20 pb-16">
      <h2 class="font-display text-3xl text-slate-900 mb-8 text-center">Frequently Asked Questions</h2>
      <div class="space-y-3">
        ${faqHtml}
      </div>
    </section>

    <!-- Author Bio -->
    <section class="max-w-3xl mx-auto px-6 lg:px-20 pb-16">
      ${renderAuthorBio()}
    </section>

    <!-- CTA -->
    <section class="bg-slate-50 border-t border-slate-200">
      <div class="max-w-3xl mx-auto px-6 lg:px-20 py-16 text-center">
        <h2 class="font-display text-3xl text-slate-900 mb-4">Ready to see what you are missing?</h2>
        <p class="text-lg text-slate-600 mb-8">Start your free audit today and discover how Kritano can help improve your website.</p>
        <a href="/register?ea=email" class="inline-flex items-center justify-center px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors">Join Early Access</a>
      </div>
    </section>

  </main>`;

  return htmlShell({
    title: 'Pricing - Website Audit Plans & Tools',
    description: 'Simple, transparent pricing for website auditing. Start free, upgrade as you grow. Plans starting free.',
    canonicalUrl: `${BASE_URL}/pricing`,
    ogImage: `${BASE_URL}/brand/og-default.png`,
    ogType: 'website',
    extraHead: structuredData,
    body,
    activePath: '/pricing',
  });
}

// ── Contact Page ─────────────────────────────────────────────────────

export function renderContactPage(): string {
  const structuredData = [
    jsonLd({
      '@context': 'https://schema.org',
      '@type': 'ContactPage',
      name: 'Contact Kritano',
      description: 'Get in touch with the Kritano team.',
      url: `${BASE_URL}/contact`,
      mainEntity: {
        '@type': 'Organization',
        name: 'Kritano',
        email: 'info@kritano.com',
        url: BASE_URL,
        address: {
          '@type': 'PostalAddress',
          addressCountry: 'GB',
        },
      },
    }),
    jsonLd({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
        { '@type': 'ListItem', position: 2, name: 'Contact', item: `${BASE_URL}/contact` },
      ],
    }),
  ].join('\n  ');

  const sendIconSvg = '<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>';

  const body = `<main id="main-content" aria-label="Page content">

    <!-- Hero -->
    <section class="max-w-7xl mx-auto px-6 lg:px-20 pt-20 lg:pt-28 pb-12">
      <div class="max-w-2xl">
        <h1 class="font-display text-5xl lg:text-6xl text-slate-900 leading-tight mb-3">Contact Us</h1>
        <h2 class="font-display text-2xl lg:text-3xl text-slate-600 leading-snug mb-5">Let's talk.</h2>
        <p class="text-lg text-slate-600 leading-relaxed mb-3">Have a question about Kritano, need help with your account, or want to explore a partnership? We would love to hear from you.</p>
        <p class="text-base text-slate-500 leading-relaxed">Fill in the form below and we will get back to you within one working day.</p>
      </div>
    </section>

    <!-- Contact Form + Sidebar -->
    <section class="max-w-7xl mx-auto px-6 lg:px-20 pb-16">
      <div class="grid lg:grid-cols-3 gap-12">

        <!-- Form -->
        <div class="lg:col-span-2">
          <form method="POST" action="/api/contact" class="space-y-6">
            <div>
              <label for="contact-name" class="block text-sm font-medium text-slate-700 mb-1.5">Name <span class="text-red-500">*</span></label>
              <input type="text" id="contact-name" name="name" required autocomplete="name" class="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-colors" placeholder="Your name" />
            </div>
            <div>
              <label for="contact-email" class="block text-sm font-medium text-slate-700 mb-1.5">Email <span class="text-red-500">*</span></label>
              <input type="email" id="contact-email" name="email" required autocomplete="email" class="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-colors" placeholder="you@example.com" />
            </div>
            <div>
              <label for="contact-subject" class="block text-sm font-medium text-slate-700 mb-1.5">Subject</label>
              <select id="contact-subject" name="subject" class="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-colors bg-white">
                <option value="General Enquiry">General Enquiry</option>
                <option value="Sales & Pricing">Sales &amp; Pricing</option>
                <option value="Technical Support">Technical Support</option>
                <option value="Partnerships">Partnerships</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label for="contact-message" class="block text-sm font-medium text-slate-700 mb-1.5">Message <span class="text-red-500">*</span></label>
              <textarea id="contact-message" name="message" required rows="6" class="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-colors resize-y" placeholder="How can we help?"></textarea>
            </div>
            <button type="submit" class="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors text-sm">
              Send Message ${sendIconSvg}
            </button>
          </form>
        </div>

        <!-- Sidebar -->
        <aside class="space-y-6">
          <!-- Response guarantee -->
          <div class="bg-indigo-50 border border-indigo-100 rounded-xl p-5">
            <h3 class="text-sm font-semibold text-indigo-900 mb-2">Response Guarantee</h3>
            <p class="text-sm text-indigo-700 leading-relaxed">We aim to respond to every enquiry within one working day. Most messages receive a reply within a few hours.</p>
          </div>

          <!-- Contact info -->
          <div class="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <h3 class="text-sm font-semibold text-slate-900">Contact Information</h3>
            <div class="flex items-start gap-3">
              <svg class="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
              <div>
                <p class="text-sm font-medium text-slate-700">Email</p>
                <a href="mailto:info@kritano.com" class="text-sm text-indigo-600 hover:text-indigo-700">info@kritano.com</a>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <svg class="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              <div>
                <p class="text-sm font-medium text-slate-700">Location</p>
                <p class="text-sm text-slate-600">United Kingdom</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <svg class="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <div>
                <p class="text-sm font-medium text-slate-700">Hours</p>
                <p class="text-sm text-slate-600">Mon - Fri, 9am - 6pm GMT</p>
              </div>
            </div>
          </div>

          <!-- Quick links -->
          <div class="bg-white border border-slate-200 rounded-xl p-5">
            <h3 class="text-sm font-semibold text-slate-900 mb-3">Quick Links</h3>
            <ul class="space-y-2">
              <li><a href="/pricing" class="text-sm text-indigo-600 hover:text-indigo-700">Pricing</a></li>
              <li><a href="/blog" class="text-sm text-indigo-600 hover:text-indigo-700">Blog</a></li>
              <li><a href="/register?ea=email" class="text-sm text-indigo-600 hover:text-indigo-700">Start Free Audit</a></li>
            </ul>
          </div>
        </aside>

      </div>
    </section>

    <!-- Author Bio -->
    <section class="max-w-3xl mx-auto px-6 lg:px-20 pb-16">
      ${renderAuthorBio()}
    </section>

  </main>`;

  return htmlShell({
    title: 'Contact Us - Get in Touch with Kritano',
    description: 'Get in touch with the Kritano team. We\'re here to help with questions about our platform, pricing, or partnerships.',
    canonicalUrl: `${BASE_URL}/contact`,
    ogImage: `${BASE_URL}/brand/og-default.png`,
    ogType: 'website',
    extraHead: structuredData,
    body,
    activePath: '/contact',
  });
}

// ── FAQ Page ─────────────────────────────────────────────────────────

export function renderFaqPage(): string {
  const categories: Array<{ title: string; faqs: Array<{ q: string; a: string }> }> = [
    {
      title: 'Product',
      faqs: [
        { q: 'What is Kritano?', a: 'Kritano is a website auditing platform that checks your site for SEO, accessibility, security, and performance issues. It runs over 500 rules in a single scan and shows you exactly what to fix.' },
        { q: 'Who is Kritano for?', a: 'Kritano is built for web developers, SEO professionals, digital agencies, and business owners who want to understand and improve their website quality.' },
        { q: 'What does an audit check?', a: 'A Kritano audit covers SEO (meta tags, headings, links, structured data), accessibility (WCAG 2.2 compliance), security (headers, HTTPS, vulnerabilities), performance (Core Web Vitals, page speed), content quality (E-E-A-T, readability), and AI readiness (AEO, structured data).' },
        { q: 'How many pages can I audit?', a: 'It depends on your plan. Free accounts can audit up to 50 pages, Starter up to 250, Pro up to 1,000, Agency up to 5,000, and Enterprise up to 10,000 pages per audit.' },
        { q: 'Can I schedule recurring audits?', a: 'Yes, on paid plans. Starter allows weekly schedules, Pro allows daily, Agency allows hourly, and Enterprise allows schedules as frequent as every 15 minutes.' },
        { q: 'Do you support white-label reports?', a: 'Yes. Agency and Enterprise plans include full white-label support, allowing you to brand PDF reports with your own logo, colours, and domain.' },
        { q: 'What export formats are available?', a: 'Depending on your plan, you can export audits as PDF, CSV, or JSON. Pro and above also get shareable report links and accessibility statements.' },
        { q: 'Is there an API?', a: 'Yes. Every plan includes API access. Free gets 100 requests per day, Starter gets 1,000, Pro gets 10,000, Agency gets 100,000, and Enterprise gets unlimited.' },
      ],
    },
    {
      title: 'Technical',
      faqs: [
        { q: 'How does the crawler work?', a: 'Kritano\'s crawler starts from the URL you provide, discovers internal links, and follows them up to the crawl depth limit for your plan. It respects robots.txt and rate limits itself to avoid overloading your server.' },
        { q: 'Does Kritano execute JavaScript?', a: 'Yes. Our crawler renders pages in a headless browser, so it sees the same content your visitors do, including dynamically loaded elements.' },
        { q: 'Will Kritano slow down my website?', a: 'No. The crawler is rate-limited and sends requests at a controlled pace. It behaves like a polite bot and should not cause any noticeable impact on your server performance.' },
        { q: 'What browsers does Kritano support?', a: 'Kritano is a web application that works in all modern browsers including Chrome, Firefox, Safari, and Edge. We recommend using the latest version for the best experience.' },
        { q: 'Can I audit password-protected pages?', a: 'Not currently. Kritano can only audit publicly accessible pages. Support for authenticated crawling is on our roadmap.' },
        { q: 'Does Kritano check mobile responsiveness?', a: 'Yes. Paid plans include a mobile audit pass that checks your site at mobile viewport sizes and flags responsive design issues.' },
      ],
    },
    {
      title: 'Security and Privacy',
      faqs: [
        { q: 'Is my data secure?', a: 'Yes. All data is encrypted in transit (TLS 1.3) and at rest. We follow security best practices including input validation, rate limiting, and regular security audits of our own infrastructure.' },
        { q: 'Do you store my website content?', a: 'We store audit results and page metadata (titles, headings, meta tags) for the duration of your plan\'s retention period. We do not store full page HTML or assets beyond what is needed for the audit report.' },
        { q: 'Who can see my audit results?', a: 'Only you and any team members you explicitly invite to your site. Audit results are private by default. You can optionally generate shareable links for specific reports.' },
        { q: 'Are you GDPR compliant?', a: 'Yes. Kritano is built with privacy by design. We only collect the minimum data necessary to provide the service, offer data export and deletion on request, and maintain a clear privacy policy.' },
      ],
    },
    {
      title: 'Billing and Plans',
      faqs: [
        { q: 'How does the free plan work?', a: 'The free plan lets you audit one website with up to 50 pages per scan and 5 audits per month. You get SEO, security, and content checks with 30-day data retention. No credit card required, no time limit.' },
        { q: 'Can I upgrade or downgrade at any time?', a: 'Yes. You can switch plans whenever you need to. If you upgrade mid-cycle, you\'ll be charged a prorated amount. Downgrades take effect at the end of your current billing period.' },
        { q: 'Do you offer annual billing?', a: 'Yes! Switch to annual billing and save 2 months - you pay for 10 months and get 12.' },
        { q: 'Is there a free trial for paid plans?', a: 'Every paid plan includes a 14-day free trial with full access. No credit card required to start.' },
        { q: 'What happens to my data if I cancel?', a: 'Your data is retained for the period specified in your plan (30 days for Free, 90 days for Starter, etc.). After cancellation, your account is downgraded to the Free tier and data beyond the Free retention window is deleted after 30 days.' },
        { q: 'Do you offer refunds?', a: 'We offer a full refund within 14 days of your first payment if you are not satisfied. Contact us at info@kritano.com.' },
      ],
    },
  ];

  const allFaqsLd = categories.flatMap(cat => cat.faqs.map(f => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })));

  const structuredData = [
    jsonLd({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: allFaqsLd,
    }),
    jsonLd({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
        { '@type': 'ListItem', position: 2, name: 'FAQ', item: `${BASE_URL}/faq` },
      ],
    }),
  ].join('\n  ');

  const categorySections = categories.map(cat => {
    const faqItems = cat.faqs.map(f => `<details class="border border-slate-200 rounded-lg">
          <summary class="px-5 py-4 cursor-pointer text-sm font-medium text-slate-900 hover:bg-slate-50">${escapeHtml(f.q)}</summary>
          <div class="px-5 pb-4 text-sm text-slate-600 leading-relaxed">${escapeHtml(f.a)}</div>
        </details>`).join('\n        ');

    return `<div class="mb-12">
        <h2 class="font-display text-2xl text-slate-900 mb-6">${escapeHtml(cat.title)}</h2>
        <div class="space-y-3">
          ${faqItems}
        </div>
      </div>`;
  }).join('\n      ');

  const body = `<main id="main-content" aria-label="Page content">

    <!-- Breadcrumb -->
    <nav aria-label="Breadcrumb" class="max-w-3xl mx-auto px-6 lg:px-20 pt-8">
      <ol class="flex items-center gap-2 text-sm text-slate-500">
        <li><a href="/" class="hover:text-indigo-600 transition-colors">Home</a></li>
        <li aria-hidden="true">/</li>
        <li class="text-slate-900 font-medium" aria-current="page">FAQ</li>
      </ol>
    </nav>

    <!-- Hero -->
    <section class="max-w-3xl mx-auto px-6 lg:px-20 pt-10 pb-12">
      <h1 class="font-display text-5xl lg:text-6xl text-slate-900 leading-tight mb-5">Frequently Asked Questions</h1>
      <p class="text-lg text-slate-600 leading-relaxed">Find answers to common questions about Kritano. Can't find what you are looking for? <a href="/contact" class="text-indigo-600 hover:text-indigo-700 underline decoration-indigo-300 underline-offset-2">Get in touch</a> and we will be happy to help.</p>
    </section>

    <!-- FAQ Categories -->
    <section class="max-w-3xl mx-auto px-6 lg:px-20 pb-16">
      ${categorySections}
    </section>

    <!-- Author Bio -->
    <section class="max-w-3xl mx-auto px-6 lg:px-20 pb-16">
      ${renderAuthorBio()}
    </section>

    <!-- CTA -->
    <section class="bg-slate-50 border-t border-slate-200">
      <div class="max-w-3xl mx-auto px-6 lg:px-20 py-16 text-center">
        <h2 class="font-display text-3xl text-slate-900 mb-4">Still have questions?</h2>
        <p class="text-lg text-slate-600 mb-8">Our team is here to help. Send us a message and we will get back to you within one working day.</p>
        <a href="/contact" class="inline-flex items-center justify-center px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors">Contact Us</a>
      </div>
    </section>

  </main>`;

  return htmlShell({
    title: 'Frequently Asked Questions',
    description: 'Find answers to common questions about Kritano\'s website auditing platform, including features, pricing, security, and technical details.',
    canonicalUrl: `${BASE_URL}/faq`,
    ogImage: `${BASE_URL}/brand/og-default.png`,
    ogType: 'website',
    extraHead: structuredData,
    body,
    activePath: '/faq',
  });
}

// ── Author Page ──────────────────────────────────────────────────────

export function renderAuthorPage(): string {
  const expertiseAreas = [
    'Search Engine Optimisation (SEO)',
    'Web Accessibility & WCAG 2.2',
    'Web Security',
    'Web Performance & Core Web Vitals',
    'Content Quality & E-E-A-T',
    'Answer Engine Optimisation (AEO)',
    'Structured Data & Schema.org',
  ];

  const structuredData = [
    jsonLd({
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: 'Chris Garlick',
      jobTitle: 'Founder',
      url: `${BASE_URL}/author/chris-garlick`,
      worksFor: {
        '@type': 'Organization',
        name: 'Kritano',
        url: BASE_URL,
      },
      knowsAbout: expertiseAreas,
      sameAs: [
        'https://www.linkedin.com/in/chris-garlick-developer/',
      ],
      description: 'Chris Garlick is the founder of Kritano, a website intelligence platform. He writes about SEO, web accessibility, security, and performance.',
    }),
    jsonLd({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
        { '@type': 'ListItem', position: 2, name: 'Chris Garlick', item: `${BASE_URL}/author/chris-garlick` },
      ],
    }),
  ].join('\n  ');

  const expertiseTags = expertiseAreas.map(area =>
    `<span class="inline-block px-3 py-1.5 bg-indigo-50 text-indigo-700 text-sm rounded-full border border-indigo-100">${escapeHtml(area)}</span>`
  ).join('\n            ');

  const body = `<main id="main-content" aria-label="Page content">

    <!-- Author Header -->
    <section class="max-w-3xl mx-auto px-6 lg:px-20 pt-20 lg:pt-28 pb-12">
      <div class="flex items-center gap-6 mb-8">
        <div class="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
          <span class="text-2xl font-bold text-white">CG</span>
        </div>
        <div>
          <h1 class="font-display text-4xl lg:text-5xl text-slate-900 leading-tight">Chris Garlick</h1>
          <p class="text-lg text-slate-600 mt-1">Founder of Kritano</p>
        </div>
      </div>

      <div class="prose prose-slate max-w-none">
        <p class="text-lg text-slate-600 leading-relaxed mb-4">Chris is the founder of Kritano, a website intelligence platform that helps developers, agencies, and business owners understand the health of their websites. He has been building for the web for over 5 years, with a focus on making the web more accessible, secure, and performant.</p>
        <p class="text-base text-slate-600 leading-relaxed mb-4">Before starting Kritano, Chris worked across front-end and back-end development, gaining hands-on experience with the kinds of issues that most website owners never see - missing security headers, inaccessible forms, broken structured data, and performance bottlenecks that silently hurt search rankings.</p>
        <p class="text-base text-slate-600 leading-relaxed">Kritano was born from the belief that every website owner deserves clear, actionable insight into what is working and what is not - without needing to be a technical expert.</p>
      </div>
    </section>

    <!-- Author Bio Card -->
    <section class="max-w-3xl mx-auto px-6 lg:px-20 pb-12">
      ${renderAuthorBio()}
    </section>

    <!-- Expertise -->
    <section class="max-w-3xl mx-auto px-6 lg:px-20 pb-12">
      <h2 class="font-display text-2xl text-slate-900 mb-6">Areas of Expertise</h2>
      <div class="flex flex-wrap gap-2">
        ${expertiseTags}
      </div>
    </section>

    <!-- Articles -->
    <section class="max-w-3xl mx-auto px-6 lg:px-20 pb-16">
      <h2 class="font-display text-2xl text-slate-900 mb-6">Articles by Chris</h2>
      <p class="text-slate-600 mb-6">Chris writes about SEO, web accessibility, security, performance, and content quality on the Kritano blog.</p>
      <a href="/blog" class="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium transition-colors">
        View all articles on the blog
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
      </a>
    </section>

  </main>`;

  return htmlShell({
    title: 'Chris Garlick - Founder & Author',
    description: 'Chris Garlick is the founder of Kritano, a website intelligence platform. He writes about SEO, web accessibility, security, and performance.',
    canonicalUrl: `${BASE_URL}/author/chris-garlick`,
    ogImage: `${BASE_URL}/brand/og-default.png`,
    ogType: 'profile',
    extraHead: structuredData,
    body,
    activePath: '/author/chris-garlick',
  });
}
