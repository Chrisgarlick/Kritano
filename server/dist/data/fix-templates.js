"use strict";
/**
 * Fix Template Snippets
 *
 * Maps rule_id to actionable code-fix templates for common audit findings.
 * Variables use {{variable}} placeholders. When a variable cannot be resolved
 * from context the fallbackTemplate is used instead.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.fixTemplates = void 0;
exports.resolveFixSnippet = resolveFixSnippet;
// ---------------------------------------------------------------------------
// Accessibility Templates (~15)
// axe-core uses IDs such as "image-alt", "html-has-lang", "label", etc.
// ---------------------------------------------------------------------------
const accessibilityTemplates = {
    'image-alt': {
        ruleId: 'image-alt',
        fixType: 'code',
        language: 'html',
        template: '<img src="{{src}}" alt="{{altText}}">',
        variables: ['src', 'altText'],
        fallbackTemplate: '<img src="example.jpg" alt="Describe the image content here">',
        explanation: 'Add a short, descriptive alt attribute so screen readers can convey what the image shows to people who cannot see it.',
        effort: 'small',
        learnMoreUrl: '/blog/complete-guide-image-alt-text',
    },
    'empty-alt-decorative': {
        ruleId: 'empty-alt-decorative',
        fixType: 'code',
        language: 'html',
        template: '<img src="{{src}}" alt="" role="presentation">',
        variables: ['src'],
        fallbackTemplate: '<img src="decorative-line.svg" alt="" role="presentation">',
        explanation: 'If an image is purely decorative (borders, spacers, background flourishes) use an empty alt attribute and role="presentation" so assistive technology skips it.',
        effort: 'small',
        learnMoreUrl: '/blog/complete-guide-image-alt-text',
    },
    'html-has-lang': {
        ruleId: 'html-has-lang',
        fixType: 'code',
        language: 'html',
        template: '<html lang="{{language}}">',
        variables: ['language'],
        fallbackTemplate: '<html lang="en">',
        explanation: 'Add a lang attribute to the opening <html> tag so browsers and screen readers know which language the page is written in.',
        effort: 'small',
        learnMoreUrl: '/blog/improve-accessibility-score-20-points-2-hours',
    },
    'label': {
        ruleId: 'label',
        fixType: 'code',
        language: 'html',
        template: '<label for="{{inputId}}">{{labelText}}</label>\n<input id="{{inputId}}" type="{{inputType}}" name="{{inputName}}">',
        variables: ['inputId', 'labelText', 'inputType', 'inputName'],
        fallbackTemplate: '<label for="email">Email address</label>\n<input id="email" type="email" name="email">',
        explanation: 'Every form field needs a visible label linked with a matching for/id pair so users know what information to enter.',
        effort: 'small',
        learnMoreUrl: '/blog/improve-accessibility-score-20-points-2-hours',
    },
    'button-name': {
        ruleId: 'button-name',
        fixType: 'code',
        language: 'html',
        template: '<button aria-label="{{buttonLabel}}">{{buttonContent}}</button>',
        variables: ['buttonLabel', 'buttonContent'],
        fallbackTemplate: '<button aria-label="Close dialogue">\n  <svg aria-hidden="true">...</svg>\n</button>',
        explanation: 'Give every button accessible text — either visible text inside the button or an aria-label attribute — so screen reader users know what it does.',
        effort: 'small',
        learnMoreUrl: '/blog/improve-accessibility-score-20-points-2-hours',
    },
    'heading-order': {
        ruleId: 'heading-order',
        fixType: 'code',
        language: 'html',
        template: '<h1>{{h1Text}}</h1>\n  <h2>{{h2Text}}</h2>\n    <h3>{{h3Text}}</h3>',
        variables: ['h1Text', 'h2Text', 'h3Text'],
        fallbackTemplate: '<h1>Page title</h1>\n  <h2>Section heading</h2>\n    <h3>Sub-section heading</h3>',
        explanation: 'Headings should follow a logical order (H1, then H2, then H3) without skipping levels. This helps screen reader users navigate the page structure.',
        effort: 'medium',
        learnMoreUrl: '/blog/improve-accessibility-score-20-points-2-hours',
    },
    'color-contrast': {
        ruleId: 'color-contrast',
        fixType: 'code',
        language: 'css',
        template: '/* Ensure minimum 4.5:1 contrast for normal text, 3:1 for large text */\n.{{selector}} {\n  color: {{fgColor}};\n  background-color: {{bgColor}};\n}',
        variables: ['selector', 'fgColor', 'bgColor'],
        fallbackTemplate: '/* Ensure minimum 4.5:1 contrast for normal text, 3:1 for large text */\n.text-element {\n  color: #1e293b; /* slate-800 */\n  background-color: #ffffff;\n}',
        explanation: 'The text colour does not stand out enough against its background. Increase the contrast ratio to at least 4.5:1 for normal text or 3:1 for large text.',
        effort: 'small',
        learnMoreUrl: '/blog/improve-accessibility-score-20-points-2-hours',
    },
    'bypass': {
        ruleId: 'bypass',
        fixType: 'code',
        language: 'html',
        template: '<a href="#main-content" class="skip-link">Skip to main content</a>\n<!-- place at the very start of <body> -->\n\n<main id="main-content">\n  {{pageContent}}\n</main>',
        variables: ['pageContent'],
        fallbackTemplate: '<a href="#main-content" class="skip-link">Skip to main content</a>\n\n<style>\n  .skip-link {\n    position: absolute;\n    left: -9999px;\n    top: auto;\n    width: 1px;\n    height: 1px;\n    overflow: hidden;\n  }\n  .skip-link:focus {\n    position: fixed;\n    top: 10px;\n    left: 10px;\n    width: auto;\n    height: auto;\n    padding: 0.75rem 1.5rem;\n    background: #4f46e5;\n    color: #fff;\n    z-index: 9999;\n    border-radius: 0.5rem;\n  }\n</style>\n\n<main id="main-content">\n  <!-- your page content -->\n</main>',
        explanation: 'Add a "Skip to main content" link at the top of the page so keyboard users can jump past the navigation without tabbing through every menu item.',
        effort: 'small',
        learnMoreUrl: '/blog/improve-accessibility-score-20-points-2-hours',
    },
    'aria-hidden-focus': {
        ruleId: 'aria-hidden-focus',
        fixType: 'code',
        language: 'html',
        template: '<div aria-hidden="true" tabindex="-1">{{content}}</div>',
        variables: ['content'],
        fallbackTemplate: '<!-- Remove tabindex="0" or interactive elements from aria-hidden containers -->\n<div aria-hidden="true">\n  <!-- Decorative content only — no links, buttons or inputs -->\n</div>',
        explanation: 'Elements hidden from screen readers (aria-hidden="true") must not be focusable. Remove any tabindex or interactive controls from inside the hidden container.',
        effort: 'small',
        learnMoreUrl: '',
    },
    'aria-label': {
        ruleId: 'aria-label',
        fixType: 'code',
        language: 'html',
        template: '<{{element}} aria-label="{{label}}">{{content}}</{{element}}>',
        variables: ['element', 'label', 'content'],
        fallbackTemplate: '<nav aria-label="Main navigation">\n  <!-- navigation links -->\n</nav>',
        explanation: 'Add an aria-label to give the element an accessible name when visible text alone is not sufficient to convey its purpose.',
        effort: 'small',
        learnMoreUrl: '',
    },
    'input-type': {
        ruleId: 'input-type',
        fixType: 'code',
        language: 'html',
        template: '<input type="{{inputType}}" id="{{inputId}}" name="{{inputName}}">',
        variables: ['inputType', 'inputId', 'inputName'],
        fallbackTemplate: '<!-- Use the correct type for better mobile keyboards and validation -->\n<input type="email" id="email" name="email">\n<input type="tel" id="phone" name="phone">\n<input type="url" id="website" name="website">',
        explanation: 'Set the correct input type (email, tel, url, number, etc.) so mobile browsers show the right keyboard and browsers can validate entries automatically.',
        effort: 'small',
        learnMoreUrl: '',
    },
    'tabindex': {
        ruleId: 'tabindex',
        fixType: 'code',
        language: 'html',
        template: '<{{element}} tabindex="0">{{content}}</{{element}}>',
        variables: ['element', 'content'],
        fallbackTemplate: '<!-- Replace positive tabindex values with 0 or remove them -->\n<!-- Bad:  <div tabindex="5"> -->\n<!-- Good: <div tabindex="0"> -->\n\n<!-- Better yet, use naturally focusable elements: -->\n<button>Click me</button>',
        explanation: 'A positive tabindex (1, 2, 3 ...) forces an unnatural tab order. Use tabindex="0" to follow the document order, or remove it entirely and use native interactive elements like <button> and <a>.',
        effort: 'small',
        learnMoreUrl: '',
    },
    'empty-heading': {
        ruleId: 'empty-heading',
        fixType: 'code',
        language: 'html',
        template: '<h{{level}}>{{headingText}}</h{{level}}>',
        variables: ['level', 'headingText'],
        fallbackTemplate: '<!-- Remove empty headings or add meaningful text -->\n<!-- Bad:  <h2></h2> or <h2> </h2> -->\n<!-- Good: <h2>Our services</h2> -->',
        explanation: 'Headings must contain text so screen reader users can understand the page structure. Either add descriptive text or remove the empty heading tag.',
        effort: 'small',
        learnMoreUrl: '',
    },
    'link-name': {
        ruleId: 'link-name',
        fixType: 'code',
        language: 'html',
        template: '<a href="{{href}}" aria-label="{{linkLabel}}">{{linkText}}</a>',
        variables: ['href', 'linkLabel', 'linkText'],
        fallbackTemplate: '<!-- Option 1: Visible link text -->\n<a href="/pricing">View pricing plans</a>\n\n<!-- Option 2: aria-label for icon-only links -->\n<a href="/pricing" aria-label="View pricing plans">\n  <svg aria-hidden="true">...</svg>\n</a>',
        explanation: 'Every link needs descriptive text — either visible words or an aria-label — so users know where the link goes before clicking it.',
        effort: 'small',
        learnMoreUrl: '',
    },
    'duplicate-id': {
        ruleId: 'duplicate-id',
        fixType: 'code',
        language: 'html',
        template: '<{{element}} id="{{uniqueId}}">{{content}}</{{element}}>',
        variables: ['element', 'uniqueId', 'content'],
        fallbackTemplate: '<!-- Every id attribute must be unique on the page -->\n<!-- Bad:  two elements with id="header" -->\n<!-- Good: id="site-header" and id="page-header" -->',
        explanation: 'Each id attribute must appear only once per page. Duplicate IDs break label associations and cause unpredictable behaviour for assistive technology.',
        effort: 'small',
        learnMoreUrl: '',
    },
};
// ---------------------------------------------------------------------------
// SEO Templates (~15)
// ---------------------------------------------------------------------------
const seoTemplates = {
    'missing-title': {
        ruleId: 'missing-title',
        fixType: 'code',
        language: 'html',
        template: '<title>{{pageTitle}}</title>',
        variables: ['pageTitle'],
        fallbackTemplate: '<title>Your Page Title — Your Brand</title>',
        explanation: 'Add a unique, descriptive title tag inside <head>. Aim for 50-60 characters — this is the headline people see in search results.',
        effort: 'small',
        learnMoreUrl: '/blog/website-launch-checklist-25-things',
    },
    'missing-meta-description': {
        ruleId: 'missing-meta-description',
        fixType: 'code',
        language: 'html',
        template: '<meta name="description" content="{{description}}">',
        variables: ['description'],
        fallbackTemplate: '<meta name="description" content="A concise summary of this page in 150-160 characters that encourages people to click through from search results.">',
        explanation: 'Add a meta description tag inside <head>. Keep it between 150-160 characters — it acts as an advert for your page in search results.',
        effort: 'small',
        learnMoreUrl: '/blog/website-launch-checklist-25-things',
    },
    'duplicate-title': {
        ruleId: 'duplicate-title',
        fixType: 'content',
        language: 'html',
        template: '<title>{{uniqueTitle}}</title>',
        variables: ['uniqueTitle'],
        fallbackTemplate: '<!-- Each page needs a unique title -->\n<title>About Us — Your Brand</title>\n<!-- not the same as -->\n<title>Home — Your Brand</title>',
        explanation: 'Multiple pages share the same title tag. Give each page a unique title that accurately describes its content so search engines can tell them apart.',
        effort: 'medium',
        learnMoreUrl: '/blog/website-launch-checklist-25-things',
    },
    'missing-canonical': {
        ruleId: 'missing-canonical',
        fixType: 'code',
        language: 'html',
        template: '<link rel="canonical" href="{{canonicalUrl}}">',
        variables: ['canonicalUrl'],
        fallbackTemplate: '<link rel="canonical" href="https://www.example.com/page">',
        explanation: 'Add a canonical tag inside <head> pointing to the preferred version of the page. This prevents duplicate-content issues when the same page is accessible via multiple URLs.',
        effort: 'small',
        learnMoreUrl: '',
    },
    'missing-h1': {
        ruleId: 'missing-h1',
        fixType: 'code',
        language: 'html',
        template: '<h1>{{headingText}}</h1>',
        variables: ['headingText'],
        fallbackTemplate: '<h1>Your main page heading</h1>',
        explanation: 'Every page should have exactly one H1 heading that clearly describes the page topic. It helps search engines and screen readers understand the page.',
        effort: 'small',
        learnMoreUrl: '',
    },
    'multiple-h1': {
        ruleId: 'multiple-h1',
        fixType: 'code',
        language: 'html',
        template: '<h1>{{primaryHeading}}</h1>\n<!-- Change extra H1s to H2 -->\n<h2>{{secondaryHeading}}</h2>',
        variables: ['primaryHeading', 'secondaryHeading'],
        fallbackTemplate: '<!-- Keep only one H1 per page -->\n<h1>Main page heading</h1>\n\n<!-- Demote other H1s to H2 -->\n<h2>Section heading</h2>',
        explanation: 'There should be only one H1 per page. Change any extra H1 tags to H2 so the page has a clear, single main heading.',
        effort: 'small',
        learnMoreUrl: '',
    },
    'broken-link': {
        ruleId: 'broken-link',
        fixType: 'manual',
        language: 'html',
        template: '<a href="{{correctUrl}}">{{linkText}}</a>',
        variables: ['correctUrl', 'linkText'],
        fallbackTemplate: '<!-- Update the broken link to a working URL or remove it -->\n<a href="https://www.example.com/valid-page">Link text</a>',
        explanation: 'This link points to a page that returns an error. Update the href to a working URL, redirect the broken page, or remove the link entirely.',
        effort: 'small',
        learnMoreUrl: '',
    },
    'no-structured-data': {
        ruleId: 'no-structured-data',
        fixType: 'code',
        language: 'json',
        template: '<script type="application/ld+json">\n{\n  "@context": "https://schema.org",\n  "@type": "{{schemaType}}",\n  "name": "{{name}}",\n  "description": "{{description}}",\n  "url": "{{pageUrl}}"\n}\n</script>',
        variables: ['schemaType', 'name', 'description', 'pageUrl'],
        fallbackTemplate: '<script type="application/ld+json">\n{\n  "@context": "https://schema.org",\n  "@type": "WebPage",\n  "name": "Page Title",\n  "description": "Page description",\n  "url": "https://www.example.com/page"\n}\n</script>',
        explanation: 'Add structured data (JSON-LD) to help search engines understand what the page is about. This can unlock rich results like star ratings, FAQs and breadcrumbs.',
        effort: 'medium',
        learnMoreUrl: '/blog/how-structured-data-feeds-answer-engines',
    },
    'missing-og-title': {
        ruleId: 'missing-og-title',
        fixType: 'code',
        language: 'html',
        template: '<meta property="og:title" content="{{ogTitle}}">\n<meta property="og:description" content="{{ogDescription}}">\n<meta property="og:image" content="{{ogImage}}">\n<meta property="og:url" content="{{pageUrl}}">',
        variables: ['ogTitle', 'ogDescription', 'ogImage', 'pageUrl'],
        fallbackTemplate: '<meta property="og:title" content="Your Page Title">\n<meta property="og:description" content="A short description for social sharing.">\n<meta property="og:image" content="https://www.example.com/image.jpg">\n<meta property="og:url" content="https://www.example.com/page">',
        explanation: 'Add Open Graph meta tags so your page looks great when shared on Facebook, LinkedIn and other social platforms.',
        effort: 'small',
        learnMoreUrl: '',
    },
    'missing-hreflang': {
        ruleId: 'missing-hreflang',
        fixType: 'code',
        language: 'html',
        template: '<link rel="alternate" hreflang="{{lang}}" href="{{url}}">\n<link rel="alternate" hreflang="x-default" href="{{defaultUrl}}">',
        variables: ['lang', 'url', 'defaultUrl'],
        fallbackTemplate: '<link rel="alternate" hreflang="en" href="https://www.example.com/">\n<link rel="alternate" hreflang="fr" href="https://www.example.com/fr/">\n<link rel="alternate" hreflang="x-default" href="https://www.example.com/">',
        explanation: 'If your site is available in multiple languages, add hreflang tags so search engines serve the right version to each audience.',
        effort: 'medium',
        learnMoreUrl: '',
    },
    'noindex-page': {
        ruleId: 'noindex-page',
        fixType: 'code',
        language: 'html',
        template: '<!-- Remove the noindex directive if this page should appear in search results -->\n<!-- Delete this line: <meta name="robots" content="noindex"> -->',
        variables: [],
        fallbackTemplate: '<!-- Remove the noindex tag if the page should be indexed -->\n<!-- Before: <meta name="robots" content="noindex"> -->\n<!-- After:  <meta name="robots" content="index, follow"> -->',
        explanation: 'This page has a noindex tag which tells search engines not to include it in results. Remove it if you want the page to be found via search.',
        effort: 'small',
        learnMoreUrl: '',
    },
    'redirect-chain': {
        ruleId: 'redirect-chain',
        fixType: 'config',
        language: 'config',
        template: '# Update the redirect to point directly to the final URL\n{{originalUrl}} -> {{finalUrl}}',
        variables: ['originalUrl', 'finalUrl'],
        fallbackTemplate: '# Nginx example: point directly to the final destination\nrewrite ^/old-page$ /final-page permanent;\n\n# Apache .htaccess example:\nRedirect 301 /old-page https://www.example.com/final-page',
        explanation: 'This URL redirects through multiple steps before reaching the final page. Update the redirect to go directly to the destination to save load time and preserve link authority.',
        effort: 'medium',
        learnMoreUrl: '',
    },
    'thin-content': {
        ruleId: 'thin-content',
        fixType: 'content',
        language: 'text',
        template: 'This page has very little text content ({{wordCount}} words). Aim for at least 300 words of useful, original content.',
        variables: ['wordCount'],
        fallbackTemplate: 'This page has very little text content. Aim for at least 300 words of useful, original content that answers your visitors\' questions.',
        explanation: 'Pages with very little text are harder for search engines to rank. Add meaningful content that helps visitors — aim for at least 300 words.',
        effort: 'large',
        learnMoreUrl: '',
    },
    'missing-alt-text': {
        ruleId: 'missing-alt-text',
        fixType: 'code',
        language: 'html',
        template: '<img src="{{src}}" alt="{{altText}}">',
        variables: ['src', 'altText'],
        fallbackTemplate: '<img src="photo.jpg" alt="Describe the image content here">',
        explanation: 'Add a descriptive alt attribute to every informational image. This helps visually impaired users and improves SEO image indexing.',
        effort: 'small',
        learnMoreUrl: '/blog/complete-guide-image-alt-text',
    },
    'missing-viewport': {
        ruleId: 'missing-viewport',
        fixType: 'code',
        language: 'html',
        template: '<meta name="viewport" content="width=device-width, initial-scale=1">',
        variables: [],
        fallbackTemplate: '<meta name="viewport" content="width=device-width, initial-scale=1">',
        explanation: 'Add a viewport meta tag so the page scales correctly on mobile devices. Without it, mobile users see a tiny desktop layout.',
        effort: 'small',
        learnMoreUrl: '/blog/website-launch-checklist-25-things',
    },
};
// ---------------------------------------------------------------------------
// Security Templates (~10)
// ---------------------------------------------------------------------------
const securityTemplates = {
    'missing-csp': {
        ruleId: 'missing-csp',
        fixType: 'config',
        language: 'config',
        template: "Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'",
        variables: [],
        fallbackTemplate: "# Add to your server response headers\nContent-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'\n\n# Nginx example:\nadd_header Content-Security-Policy \"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;\" always;",
        explanation: 'A Content Security Policy tells browsers which sources of content are allowed, helping prevent cross-site scripting (XSS) and data injection attacks.',
        effort: 'large',
        learnMoreUrl: '/blog/complete-guide-website-security-headers',
    },
    'missing-x-frame-options': {
        ruleId: 'missing-x-frame-options',
        fixType: 'config',
        language: 'config',
        template: 'X-Frame-Options: {{value}}',
        variables: ['value'],
        fallbackTemplate: '# Add to your server response headers\nX-Frame-Options: DENY\n\n# Or if your site uses iframes from the same origin:\nX-Frame-Options: SAMEORIGIN\n\n# Nginx:\nadd_header X-Frame-Options "DENY" always;\n\n# Apache:\nHeader always set X-Frame-Options "DENY"',
        explanation: 'This header prevents your pages from being loaded inside iframes on other sites, which stops clickjacking attacks where someone overlays your page with a malicious UI.',
        effort: 'small',
        learnMoreUrl: '/blog/complete-guide-website-security-headers',
    },
    'missing-hsts': {
        ruleId: 'missing-hsts',
        fixType: 'config',
        language: 'config',
        template: 'Strict-Transport-Security: max-age={{maxAge}}; includeSubDomains; preload',
        variables: ['maxAge'],
        fallbackTemplate: '# Add to your server response headers (HTTPS only)\nStrict-Transport-Security: max-age=31536000; includeSubDomains; preload\n\n# Nginx:\nadd_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;\n\n# Apache:\nHeader always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"',
        explanation: 'HSTS tells browsers to always use HTTPS when visiting your site, preventing man-in-the-middle attacks and accidental HTTP connections.',
        effort: 'small',
        learnMoreUrl: '/blog/complete-guide-website-security-headers',
    },
    'missing-x-content-type-options': {
        ruleId: 'missing-x-content-type-options',
        fixType: 'config',
        language: 'config',
        template: 'X-Content-Type-Options: nosniff',
        variables: [],
        fallbackTemplate: '# Add to your server response headers\nX-Content-Type-Options: nosniff\n\n# Nginx:\nadd_header X-Content-Type-Options "nosniff" always;\n\n# Apache:\nHeader always set X-Content-Type-Options "nosniff"',
        explanation: 'This one-word header stops browsers from guessing (MIME-sniffing) the content type of a file, which can prevent certain types of attack.',
        effort: 'small',
        learnMoreUrl: '/blog/complete-guide-website-security-headers',
    },
    'form-action-http': {
        ruleId: 'form-action-http',
        fixType: 'code',
        language: 'html',
        template: '<form action="{{secureAction}}" method="post">',
        variables: ['secureAction'],
        fallbackTemplate: '<!-- Change http:// to https:// in form actions -->\n<!-- Before: <form action="http://example.com/submit"> -->\n<form action="https://example.com/submit" method="post">',
        explanation: 'This form sends data over an insecure HTTP connection. Change the action URL to HTTPS so submitted data (passwords, personal details) is encrypted in transit.',
        effort: 'small',
        learnMoreUrl: '/blog/complete-guide-website-security-headers',
    },
    'mixed-content-script': {
        ruleId: 'mixed-content-script',
        fixType: 'code',
        language: 'html',
        template: '<script src="{{secureUrl}}"></script>',
        variables: ['secureUrl'],
        fallbackTemplate: '<!-- Change http:// to https:// -->\n<!-- Before: <script src="http://cdn.example.com/lib.js"></script> -->\n<script src="https://cdn.example.com/lib.js"></script>',
        explanation: 'An HTTPS page is loading a script over insecure HTTP. Change the URL to HTTPS — most CDNs support it. Mixed content can be blocked by browsers and weakens security.',
        effort: 'small',
        learnMoreUrl: '/blog/complete-guide-website-security-headers',
    },
    'missing-referrer-policy': {
        ruleId: 'missing-referrer-policy',
        fixType: 'config',
        language: 'config',
        template: 'Referrer-Policy: {{policy}}',
        variables: ['policy'],
        fallbackTemplate: '# Add to your server response headers\nReferrer-Policy: strict-origin-when-cross-origin\n\n# Nginx:\nadd_header Referrer-Policy "strict-origin-when-cross-origin" always;\n\n# Apache:\nHeader always set Referrer-Policy "strict-origin-when-cross-origin"',
        explanation: 'The Referrer-Policy header controls how much URL information is shared when users click links to other sites. "strict-origin-when-cross-origin" is a good default.',
        effort: 'small',
        learnMoreUrl: '/blog/complete-guide-website-security-headers',
    },
    'missing-permissions-policy': {
        ruleId: 'missing-permissions-policy',
        fixType: 'config',
        language: 'config',
        template: 'Permissions-Policy: {{directives}}',
        variables: ['directives'],
        fallbackTemplate: '# Add to your server response headers\nPermissions-Policy: camera=(), microphone=(), geolocation=(), payment=()\n\n# Nginx:\nadd_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=()" always;\n\n# Apache:\nHeader always set Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=()"',
        explanation: 'The Permissions-Policy header lets you disable browser features (camera, microphone, geolocation) that your site does not use, reducing the attack surface.',
        effort: 'small',
        learnMoreUrl: '/blog/complete-guide-website-security-headers',
    },
    'server-version-exposed': {
        ruleId: 'server-version-exposed',
        fixType: 'config',
        language: 'config',
        template: '# Remove the Server header or hide the version',
        variables: [],
        fallbackTemplate: '# Nginx — hide version:\nserver_tokens off;\n\n# Apache — hide version:\nServerTokens Prod\nServerSignature Off\n\n# Express.js:\napp.disable("x-powered-by");',
        explanation: 'Your server is revealing its software name and version number. Hide this information so attackers cannot easily look up known vulnerabilities for that version.',
        effort: 'small',
        learnMoreUrl: '/blog/complete-guide-website-security-headers',
    },
    'insecure-cookie': {
        ruleId: 'insecure-cookie',
        fixType: 'config',
        language: 'config',
        template: 'Set-Cookie: {{cookieName}}={{cookieValue}}; Secure; HttpOnly; SameSite=Lax; Path=/',
        variables: ['cookieName', 'cookieValue'],
        fallbackTemplate: '# Set all three security flags on cookies\nSet-Cookie: session=abc123; Secure; HttpOnly; SameSite=Lax; Path=/\n\n# Express.js example:\nres.cookie("session", value, {\n  secure: true,\n  httpOnly: true,\n  sameSite: "lax",\n});',
        explanation: 'This cookie is missing security flags. Add Secure (HTTPS only), HttpOnly (no JavaScript access) and SameSite (cross-site protection) to reduce the risk of cookie theft.',
        effort: 'small',
        learnMoreUrl: '/blog/website-security-basics-business-owners',
    },
};
// ---------------------------------------------------------------------------
// Content Templates (~10)
// ---------------------------------------------------------------------------
const contentTemplates = {
    'poor-readability': {
        ruleId: 'poor-readability',
        fixType: 'content',
        language: 'text',
        template: 'Readability score: {{score}}/100. Aim for 60+ by using shorter sentences, simpler words, and breaking up long paragraphs.',
        variables: ['score'],
        fallbackTemplate: 'The readability score is low. Try:\n• Use shorter sentences (under 20 words each)\n• Replace jargon with everyday words\n• Break paragraphs into 2-3 sentences\n• Add subheadings every 300 words\n• Use bullet points for lists',
        explanation: 'The text on this page is harder to read than it needs to be. Simpler writing helps more visitors understand your content and stay on the page.',
        effort: 'large',
        learnMoreUrl: '',
    },
    'no-subheadings': {
        ruleId: 'no-subheadings',
        fixType: 'code',
        language: 'html',
        template: '<h2>{{sectionTitle1}}</h2>\n<p>{{paragraph1}}</p>\n\n<h2>{{sectionTitle2}}</h2>\n<p>{{paragraph2}}</p>',
        variables: ['sectionTitle1', 'paragraph1', 'sectionTitle2', 'paragraph2'],
        fallbackTemplate: '<!-- Break content into sections with descriptive headings -->\n<h2>Why this matters</h2>\n<p>Your first section content...</p>\n\n<h2>How to get started</h2>\n<p>Your second section content...</p>',
        explanation: 'The page has no subheadings, making it difficult for readers to scan. Add H2 and H3 headings every 200-300 words to break the content into clear sections.',
        effort: 'medium',
        learnMoreUrl: '',
    },
    'wall-of-text': {
        ruleId: 'wall-of-text',
        fixType: 'content',
        language: 'text',
        template: 'Break the {{wordCount}}-word block into shorter paragraphs of 2-4 sentences each.',
        variables: ['wordCount'],
        fallbackTemplate: 'This section contains a very long unbroken block of text. To improve readability:\n• Split into paragraphs of 2-4 sentences\n• Add a subheading above each new section\n• Use bullet points where you list items\n• Consider adding an image or diagram to break up the flow',
        explanation: 'Large blocks of text without breaks are hard to read on screen. Split them into shorter paragraphs with headings and lists so visitors can scan the content easily.',
        effort: 'medium',
        learnMoreUrl: '',
    },
    'no-images': {
        ruleId: 'no-images',
        fixType: 'content',
        language: 'text',
        template: 'Add at least one relevant image to improve engagement and break up text.',
        variables: [],
        fallbackTemplate: 'This page contains no images. Consider adding:\n• A hero image at the top\n• Screenshots or diagrams to illustrate key points\n• Photos to build trust and engagement\n\nRemember to include descriptive alt text on every image.',
        explanation: 'Pages without any images tend to feel less engaging. Adding relevant visuals helps visitors stay on the page longer and understand your content better.',
        effort: 'medium',
        learnMoreUrl: '/blog/image-optimisation-biggest-performance-win',
    },
    'no-cta': {
        ruleId: 'no-cta',
        fixType: 'code',
        language: 'html',
        template: '<a href="{{ctaUrl}}" class="cta-button">{{ctaText}}</a>',
        variables: ['ctaUrl', 'ctaText'],
        fallbackTemplate: '<!-- Add a clear call-to-action -->\n<a href="/contact" class="cta-button">Get in touch</a>\n\n<!-- Or for a more prominent CTA: -->\n<section class="cta-section">\n  <h2>Ready to get started?</h2>\n  <p>See how we can help your business grow.</p>\n  <a href="/contact" class="cta-button">Book a free consultation</a>\n</section>',
        explanation: 'This page has no clear call-to-action. Tell visitors what to do next — whether that is signing up, getting in touch, or reading more.',
        effort: 'medium',
        learnMoreUrl: '',
    },
    'no-internal-links': {
        ruleId: 'no-internal-links',
        fixType: 'code',
        language: 'html',
        template: '<a href="{{internalUrl}}">{{linkText}}</a>',
        variables: ['internalUrl', 'linkText'],
        fallbackTemplate: '<!-- Add internal links to related pages -->\n<p>Learn more about <a href="/services">our services</a> or\n<a href="/about">read about our team</a>.</p>',
        explanation: 'This page has no links to other pages on your site. Internal links help visitors discover more content and help search engines understand your site structure.',
        effort: 'small',
        learnMoreUrl: '',
    },
    'outdated-content': {
        ruleId: 'outdated-content',
        fixType: 'content',
        language: 'text',
        template: 'This content appears outdated (last modified {{lastModified}}). Review and update facts, statistics and links.',
        variables: ['lastModified'],
        fallbackTemplate: 'This content appears to be outdated. Review and update:\n• Statistics and data points\n• External links (check for broken ones)\n• Product/service information\n• Dates and time-sensitive references\n• Add a "Last updated" date to build trust',
        explanation: 'Content that references old dates or information can hurt your credibility with both visitors and search engines. Review it regularly to keep it accurate.',
        effort: 'large',
        learnMoreUrl: '',
    },
    'keyword-stuffing': {
        ruleId: 'keyword-stuffing',
        fixType: 'content',
        language: 'text',
        template: 'The keyword "{{keyword}}" appears {{density}}% of the time ({{occurrences}} times). Aim for 1-2% density.',
        variables: ['keyword', 'density', 'occurrences'],
        fallbackTemplate: 'Your target keyword appears too many times on this page. To fix it:\n• Reduce keyword density to 1-2%\n• Use natural synonyms and variations instead\n• Write for people first, search engines second\n• Read the text aloud — if it sounds forced, rewrite it',
        explanation: 'Repeating the same keyword too many times can look spammy to search engines and may lead to a ranking penalty. Use natural language and synonyms instead.',
        effort: 'medium',
        learnMoreUrl: '',
    },
    'short-content': {
        ruleId: 'short-content',
        fixType: 'content',
        language: 'text',
        template: 'This page has only {{wordCount}} words. Consider expanding to at least 300 words with useful, original content.',
        variables: ['wordCount'],
        fallbackTemplate: 'This page has very little content. Consider expanding it with:\n• More detail about the topic\n• Answers to common questions\n• Examples or case studies\n• Related information visitors might find useful',
        explanation: 'Pages with very little text are harder for search engines to rank and less helpful for visitors. Aim for at least 300 words of quality content.',
        effort: 'large',
        learnMoreUrl: '',
    },
    'no-multimedia': {
        ruleId: 'no-multimedia',
        fixType: 'content',
        language: 'text',
        template: 'Add images, videos, or diagrams to make this page more engaging and easier to understand.',
        variables: [],
        fallbackTemplate: 'This page has no multimedia content. Consider adding:\n• Relevant images with descriptive alt text\n• An explanatory video or animation\n• Infographics or diagrams\n• Charts or data visualisations\n\nMultimedia makes content more engaging and easier to understand.',
        explanation: 'Pages without any media (images, video, diagrams) tend to have lower engagement. Adding relevant visuals helps visitors understand and remember your content.',
        effort: 'medium',
        learnMoreUrl: '/blog/image-optimisation-biggest-performance-win',
    },
};
// ---------------------------------------------------------------------------
// Merge all templates into a single record
// ---------------------------------------------------------------------------
exports.fixTemplates = {
    ...accessibilityTemplates,
    ...seoTemplates,
    ...securityTemplates,
    ...contentTemplates,
};
// ---------------------------------------------------------------------------
// Resolution function
// ---------------------------------------------------------------------------
/**
 * Attempt to extract a variable value from the finding context.
 */
function extractVariable(varName, context) {
    const { selector, snippet, pageUrl, message } = context;
    switch (varName) {
        // ── Image-related ────────────────────────────────
        case 'src': {
            if (snippet) {
                const m = snippet.match(/src=["']([^"']+)["']/i);
                if (m)
                    return m[1];
            }
            return null;
        }
        case 'altText':
            return null; // Can't auto-generate good alt text
        // ── URL / page ────────────────────────────────────
        case 'pageUrl':
        case 'canonicalUrl':
        case 'defaultUrl':
        case 'url':
            return pageUrl || null;
        // ── SEO meta ──────────────────────────────────────
        case 'pageTitle': {
            if (snippet) {
                const m = snippet.match(/<title[^>]*>([^<]+)<\/title>/i);
                if (m)
                    return m[1];
            }
            return null;
        }
        case 'description': {
            if (snippet) {
                const m = snippet.match(/content=["']([^"']+)["']/i);
                if (m)
                    return m[1];
            }
            return null;
        }
        // ── Heading ────────────────────────────────────────
        case 'headingText':
        case 'h1Text':
        case 'h2Text':
        case 'h3Text':
        case 'primaryHeading':
        case 'secondaryHeading': {
            if (snippet) {
                const m = snippet.match(/<h\d[^>]*>([^<]*)<\/h\d>/i);
                if (m && m[1].trim())
                    return m[1].trim();
            }
            return null;
        }
        case 'level': {
            if (snippet) {
                const m = snippet.match(/<h(\d)/i);
                if (m)
                    return m[1];
            }
            return null;
        }
        // ── Form / input ──────────────────────────────────
        case 'inputId': {
            if (snippet) {
                const m = snippet.match(/id=["']([^"']+)["']/i);
                if (m)
                    return m[1];
            }
            if (selector)
                return selector.replace(/[^a-zA-Z0-9-_]/g, '');
            return null;
        }
        case 'inputType': {
            if (snippet) {
                const m = snippet.match(/type=["']([^"']+)["']/i);
                if (m)
                    return m[1];
            }
            return null;
        }
        case 'inputName': {
            if (snippet) {
                const m = snippet.match(/name=["']([^"']+)["']/i);
                if (m)
                    return m[1];
            }
            return null;
        }
        // ── Link ──────────────────────────────────────────
        case 'href':
        case 'correctUrl':
        case 'secureAction':
        case 'secureUrl':
        case 'internalUrl':
        case 'ctaUrl': {
            if (snippet) {
                const m = snippet.match(/(?:href|src|action)=["']([^"']+)["']/i);
                if (m)
                    return m[1];
            }
            return null;
        }
        case 'linkText':
        case 'linkLabel':
        case 'ctaText': {
            if (snippet) {
                const m = snippet.match(/>([^<]+)</);
                if (m && m[1].trim())
                    return m[1].trim();
            }
            return null;
        }
        // ── Button ────────────────────────────────────────
        case 'buttonLabel':
        case 'buttonContent': {
            if (snippet) {
                const m = snippet.match(/>([^<]*)</);
                if (m && m[1].trim())
                    return m[1].trim();
            }
            return null;
        }
        // ── Language ──────────────────────────────────────
        case 'language':
        case 'lang':
            return 'en';
        // ── Generic element ────────────────────────────────
        case 'element': {
            if (snippet) {
                const m = snippet.match(/<(\w+)/);
                if (m)
                    return m[1];
            }
            return 'div';
        }
        case 'selector': {
            if (selector)
                return selector.replace(/^\./, '');
            return null;
        }
        case 'uniqueId': {
            if (snippet) {
                const m = snippet.match(/id=["']([^"']+)["']/i);
                if (m)
                    return m[1] + '-unique';
            }
            return null;
        }
        // ── Colour ────────────────────────────────────────
        case 'fgColor': {
            if (message) {
                const m = message.match(/fg:\s*(#[0-9a-fA-F]{3,8})/);
                if (m)
                    return m[1];
            }
            return null;
        }
        case 'bgColor': {
            if (message) {
                const m = message.match(/bg:\s*(#[0-9a-fA-F]{3,8})/);
                if (m)
                    return m[1];
            }
            return null;
        }
        // ── Security headers ──────────────────────────────
        case 'maxAge':
            return '31536000';
        case 'value':
            return 'DENY';
        case 'policy':
            return 'strict-origin-when-cross-origin';
        case 'directives':
            return 'camera=(), microphone=(), geolocation=(), payment=()';
        // ── Content / keyword ─────────────────────────────
        case 'wordCount': {
            if (message) {
                const m = message.match(/(\d+)\s*words?/i);
                if (m)
                    return m[1];
            }
            return null;
        }
        case 'keyword': {
            if (message) {
                const m = message.match(/"([^"]+)"/);
                if (m)
                    return m[1];
            }
            return null;
        }
        case 'density': {
            if (message) {
                const m = message.match(/([\d.]+)%/);
                if (m)
                    return m[1];
            }
            return null;
        }
        case 'occurrences': {
            if (message) {
                const m = message.match(/(\d+)\s*(?:times|occurrences)/i);
                if (m)
                    return m[1];
            }
            return null;
        }
        case 'score': {
            if (message) {
                const m = message.match(/score\s*(?:of\s*)?(\d+)/i);
                if (m)
                    return m[1];
            }
            return null;
        }
        case 'lastModified':
            return null;
        // ── Schema / structured data ──────────────────────
        case 'schemaType':
            return 'WebPage';
        case 'name':
        case 'ogTitle':
        case 'uniqueTitle':
            return null;
        case 'ogDescription':
            return null;
        case 'ogImage':
            return null;
        case 'originalUrl':
            return pageUrl || null;
        case 'finalUrl':
            return null;
        // ── Cookie ────────────────────────────────────────
        case 'cookieName': {
            if (message) {
                const m = message.match(/["']([^"']+)["']/);
                if (m)
                    return m[1];
            }
            return 'session';
        }
        case 'cookieValue':
            return '<value>';
        // ── Misc ──────────────────────────────────────────
        case 'content':
        case 'pageContent':
        case 'label':
        case 'labelText':
        case 'sectionTitle1':
        case 'sectionTitle2':
        case 'paragraph1':
        case 'paragraph2':
            return null;
        default:
            return null;
    }
}
/**
 * Resolve a fix snippet for a given finding rule_id.
 *
 * Returns a ready-to-display snippet with variables replaced, or null if no
 * template exists for the rule.
 */
function resolveFixSnippet(ruleId, context) {
    const template = exports.fixTemplates[ruleId];
    if (!template)
        return null;
    // Try to resolve all variables
    let code = template.template;
    let allResolved = true;
    for (const varName of template.variables) {
        const value = extractVariable(varName, context);
        if (value !== null) {
            code = code.replace(new RegExp(`\\{\\{${varName}\\}\\}`, 'g'), value);
        }
        else {
            allResolved = false;
        }
    }
    // If any variable could not be resolved, fall back
    if (!allResolved) {
        code = template.fallbackTemplate;
    }
    return {
        fixType: template.fixType,
        language: template.language,
        code,
        explanation: template.explanation,
        effort: template.effort,
        learnMoreUrl: template.learnMoreUrl,
    };
}
//# sourceMappingURL=fix-templates.js.map