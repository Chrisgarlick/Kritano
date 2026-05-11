"use strict";
/**
 * Shared SSR Service
 *
 * Common functions used by all SSR renderers (blog, public pages).
 * Provides the HTML shell, navigation, footer, author bio, and utilities.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BASE_URL = exports.VITE_CSS_PATH = void 0;
exports.escapeHtml = escapeHtml;
exports.setSsrHeaders = setSsrHeaders;
exports.htmlShell = htmlShell;
exports.renderNav = renderNav;
exports.renderFooter = renderFooter;
exports.renderAuthorBio = renderAuthorBio;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// ── Discover Vite-built CSS file ─────────────────────────────────────
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
exports.VITE_CSS_PATH = discoverCssFile();
exports.BASE_URL = process.env.APP_URL?.replace(/^http:\/\//, 'https://') || 'https://kritano.com';
// ── Helpers ──────────────────────────────────────────────────────────
function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
// ── SSR Headers ─────────────────────────────────────────────────────
function setSsrHeaders(res) {
    res.set('Content-Type', 'text/html');
    res.removeHeader('Content-Security-Policy');
    res.set('Content-Security-Policy', "default-src 'self'; " +
        "script-src 'self'; " +
        "style-src 'self' 'unsafe-inline'; " +
        "font-src 'self'; " +
        "img-src 'self' data: https:; " +
        "connect-src 'self'; " +
        "frame-src 'none'; " +
        "frame-ancestors 'self'; " +
        "base-uri 'self'");
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
  <link rel="alternate" type="application/atom+xml" title="Kritano Blog" href="${exports.BASE_URL}/api/blog/feed.xml" />
  <link rel="preload" as="font" type="font/woff2" href="/fonts/instrument-serif-regular.woff2" crossorigin />
  <link rel="preload" as="font" type="font/woff2" href="/fonts/outfit-latin.woff2" crossorigin />${exports.VITE_CSS_PATH ? `\n  <link rel="stylesheet" href="${exports.VITE_CSS_PATH}" />` : ''}
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

    /* Mobile nav toggle (CSS-only, no JS) */
    .ssr-mobile-checkbox { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border-width: 0; }
    .ssr-mobile-menu { display: none; }
    .ssr-hamburger-close { display: none; }
    .ssr-mobile-checkbox:checked ~ nav .ssr-hamburger-open { display: none; }
    .ssr-mobile-checkbox:checked ~ nav .ssr-hamburger-close { display: block; }
    .ssr-mobile-checkbox:checked ~ .ssr-mobile-menu { display: block; }
  </style>
  ${opts.extraHead}
</head>
<body class="bg-white text-slate-900 antialiased">
  <a href="#main-content" class="sr-only ssr-skip">Skip to content</a>
  ${renderNav(opts.activePath)}
  ${opts.body}
  ${renderFooter()}
</body>
</html>`;
}
// ── Nav ──────────────────────────────────────────────────────────────
const NAV_LINKS = [
    { href: '/services', label: 'Services' },
    { href: '/compare', label: 'Compare' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/about', label: 'About' },
    { href: '/blog', label: 'Blog' },
    { href: '/contact', label: 'Contact' },
    { href: '/docs', label: 'API Docs' },
];
function renderNav(activePath) {
    const desktopLinks = NAV_LINKS.map(link => {
        const isActive = activePath === link.href || (link.href === '/blog' && activePath?.startsWith('/blog'));
        return `<a href="${link.href}" class="text-[15px] font-medium ${isActive ? 'text-indigo-600' : 'text-slate-600 hover:text-indigo-600'} transition-colors"${isActive ? ' aria-current="page"' : ''}>${link.label}</a>`;
    }).join('\n        ');
    const mobileLinks = NAV_LINKS.map(link => {
        const isActive = activePath === link.href || (link.href === '/blog' && activePath?.startsWith('/blog'));
        return `<a href="${link.href}" class="block py-3 text-base font-medium ${isActive ? 'text-indigo-600' : 'text-slate-600 hover:text-slate-900'} transition-colors"${isActive ? ' aria-current="page"' : ''}>${link.label}</a>`;
    }).join('\n        ');
    return `<header role="banner" class="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
    <input type="checkbox" id="ssr-mobile-toggle" class="ssr-mobile-checkbox" />
    <nav aria-label="Main navigation" class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
      <a href="/" class="flex items-center gap-2" aria-label="Kritano home">
        <img src="/brand/favicon-32.svg" alt="" width="28" height="28" role="presentation" />
        <span class="font-display text-xl text-slate-900">Kritano</span>
      </a>
      <div class="hidden md:flex items-center gap-6">
        ${desktopLinks}
      </div>
      <div class="hidden md:flex items-center gap-6">
        <a href="/login" class="text-slate-600 hover:text-slate-900 transition-colors font-medium text-sm">Sign in</a>
        <a href="/register?ea=email" class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors text-sm">Join Early Access</a>
      </div>
      <label for="ssr-mobile-toggle" class="md:hidden p-2 text-slate-600 hover:text-slate-900 cursor-pointer" aria-label="Toggle menu">
        <svg class="ssr-hamburger-open w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
        <svg class="ssr-hamburger-close w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </label>
    </nav>
    <div class="ssr-mobile-menu md:hidden border-t border-slate-100 bg-white">
      <div class="px-6 py-4 space-y-1">
        ${mobileLinks}
        <div class="pt-4 border-t border-slate-100 space-y-3">
          <a href="/login" class="block text-center py-3 text-slate-600 font-medium">Sign in</a>
          <a href="/register?ea=email" class="block w-full text-center px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium">Join Early Access</a>
        </div>
      </div>
    </div>
  </header>`;
}
// ── Footer ───────────────────────────────────────────────────────────
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
            <li><a href="/compare" class="ssr-touch-block hover:text-slate-900">Compare</a></li>
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
        <picture><source srcset="/brand/author-chris-garlick-150.webp" type="image/webp" /><img src="/brand/author-chris-garlick-150.png" alt="Chris Garlick" itemprop="image" width="72" height="72" loading="lazy" class="rounded-full object-cover border-2 border-white shadow-sm" style="width:72px;height:72px" /></picture>
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
        <meta itemprop="url" content="${exports.BASE_URL}/author/chris-garlick" />
        <meta itemprop="sameAs" content="https://uk.linkedin.com/in/chris-garlick-59a8bb91" />
        <meta itemprop="sameAs" content="https://x.com/ChrisGarlick123" />
      </div>
    </div>
  </div>`;
}
//# sourceMappingURL=ssr-shared.service.js.map