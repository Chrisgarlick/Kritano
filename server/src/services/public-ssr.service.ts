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
            Having audited thousands of websites, we noticed that most tools only cover one or two categories. For example, they check SEO but ignore security headers. Or they test accessibility but skip content quality. Kritano checks all six in a single scan so nothing slips through.
          </p>
        </div>

        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
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
