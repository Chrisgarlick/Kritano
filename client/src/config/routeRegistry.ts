/**
 * Route Registry - Single source of truth for all app routes.
 *
 * Used by the admin SEO manager to list all routes with their default
 * SEO metadata. When you add a new route, add it here too so it
 * automatically appears in the admin SEO panel.
 */

export interface RouteEntry {
  path: string;
  label: string;
  category: 'public' | 'auth' | 'dashboard' | 'admin';
  defaultTitle: string;
  defaultDescription: string;
  defaultKeywords?: string;
  defaultOgImage?: string;
  defaultOgType?: string;
  defaultCanonicalUrl?: string;
  noindex?: boolean;
}

export const routeRegistry: RouteEntry[] = [
  // ── Public ──────────────────────────────────────────────
  {
    path: '/',
    label: 'Home',
    category: 'public',
    defaultTitle: 'Website Auditing for SEO, Accessibility & Security',
    defaultDescription: 'Kritano audits your website for SEO, accessibility, security, and performance issues. Get actionable insights to build trust online.',
    defaultKeywords: 'website audit, SEO audit, accessibility audit, security audit, performance audit, WCAG, web auditing tool',
  },
  {
    path: '/about',
    label: 'About',
    category: 'public',
    defaultTitle: 'About Kritano - Our Mission & Story',
    defaultDescription: 'Learn about Kritano\'s mission to make the web more accessible, secure, and performant for everyone.',
    defaultKeywords: 'Kritano, about, web accessibility, website auditing company, mission',
  },
  {
    path: '/services',
    label: 'Services',
    category: 'public',
    defaultTitle: 'Auditing Services - SEO, Accessibility & Security',
    defaultDescription: 'Comprehensive website auditing services: SEO, accessibility (WCAG 2.2), security scanning, and performance analysis.',
    defaultKeywords: 'website auditing services, SEO audit service, accessibility audit, WCAG 2.2, security scanning, performance analysis',
  },
  {
    path: '/pricing',
    label: 'Pricing',
    category: 'public',
    defaultTitle: 'Pricing - Website Audit Plans & Tools',
    defaultDescription: 'Simple, transparent pricing for website auditing. Start free, upgrade as you grow. Plans starting free.',
    defaultKeywords: 'Kritano pricing, website audit pricing, free website audit, audit plans',
  },
  {
    path: '/contact',
    label: 'Contact',
    category: 'public',
    defaultTitle: 'Contact Us - Get in Touch with Kritano',
    defaultDescription: 'Get in touch with the Kritano team. We\'re here to help with questions about our platform, pricing, or partnerships.',
    defaultKeywords: 'contact Kritano, support, partnerships, website audit help',
  },
  {
    path: '/blog',
    label: 'Blog',
    category: 'public',
    defaultTitle: 'Blog - Web Auditing Guides & Insights',
    defaultDescription: 'SEO guides, accessibility tips, security insights, and web performance best practices from Kritano.',
    defaultKeywords: 'web accessibility blog, SEO tips, security insights, performance best practices, WCAG guides',
  },
  {
    path: '/terms',
    label: 'Terms of Service',
    category: 'public',
    defaultTitle: 'Terms of Service - Usage & Subscription Terms',
    defaultDescription: 'Kritano terms of service covering website scanning liability, acceptable use, subscriptions, and data ownership.',
    defaultKeywords: 'terms of service, terms and conditions, Kritano legal',
  },
  {
    path: '/privacy',
    label: 'Privacy Policy',
    category: 'public',
    defaultTitle: 'Privacy Policy - How We Protect Your Data',
    defaultDescription: 'Kritano privacy policy covering data collection, cookies, GDPR rights, and how we protect your information.',
    defaultKeywords: 'privacy policy, GDPR, data protection, cookies, Kritano privacy',
  },
  {
    path: '/faq',
    label: 'FAQ',
    category: 'public',
    defaultTitle: 'Frequently Asked Questions',
    defaultDescription: 'Find answers to common questions about Kritano\'s website auditing platform, including features, pricing, security, and technical details.',
    defaultKeywords: 'website audit FAQ, SEO audit questions, accessibility testing FAQ, Kritano help',
  },
  {
    path: '/waitlist',
    label: 'Waitlist',
    category: 'public',
    defaultTitle: 'Join the Waitlist - Early Access Web Auditing',
    defaultDescription: 'Be the first to audit your website with Kritano. Sign up to get early access to comprehensive SEO, accessibility, security, and performance auditing.',
    defaultKeywords: 'Kritano waitlist, early access, website audit beta',
  },
  {
    path: '/author/chris-garlick',
    label: 'Author - Chris Garlick',
    category: 'public',
    defaultTitle: 'Chris Garlick - Founder & Author',
    defaultDescription: 'Chris Garlick is the founder of Kritano, a website intelligence platform. He writes about SEO, web accessibility, security, and performance.',
    defaultKeywords: 'Chris Garlick, Kritano founder, web accessibility author',
    defaultOgType: 'profile',
  },

  // ── API Docs ─────────────────────────────────────────────
  {
    path: '/docs',
    label: 'API Docs',
    category: 'public',
    defaultTitle: 'API Documentation - Automate Website Audits',
    defaultDescription: 'Comprehensive API documentation for Kritano - automate website audits, retrieve findings, and build custom integrations.',
    defaultKeywords: 'Kritano API, website audit API, REST API documentation, audit automation',
  },
  {
    path: '/docs/authentication',
    label: 'API Authentication',
    category: 'public',
    defaultTitle: 'Authentication - API Docs',
    defaultDescription: 'Learn how to authenticate your Kritano API requests using API keys and Bearer tokens.',
    defaultKeywords: 'API authentication, API keys, Bearer tokens, Kritano API auth',
  },
  {
    path: '/docs/rate-limits',
    label: 'API Rate Limits',
    category: 'public',
    defaultTitle: 'Rate Limits - API Docs',
    defaultDescription: 'Understand Kritano API rate limits by plan tier, rate limit headers, and how to handle 429 responses.',
    defaultKeywords: 'API rate limits, rate limiting, 429 response, Kritano API limits',
  },
  {
    path: '/docs/errors',
    label: 'API Errors',
    category: 'public',
    defaultTitle: 'Error Handling - API Docs',
    defaultDescription: 'Kritano API error codes, response format, and troubleshooting guide.',
    defaultKeywords: 'API error codes, error handling, API troubleshooting, Kritano API errors',
  },
  {
    path: '/docs/endpoints',
    label: 'API Endpoints',
    category: 'public',
    defaultTitle: 'Endpoints - API Docs',
    defaultDescription: 'Complete reference for all Kritano API v1 endpoints - create audits, list results, retrieve findings, and more.',
    defaultKeywords: 'API endpoints, REST endpoints, audit API, findings API, Kritano API reference',
  },
  {
    path: '/docs/objects',
    label: 'API Objects',
    category: 'public',
    defaultTitle: 'Object Reference - API Docs',
    defaultDescription: 'Complete reference for Kritano API objects - Audit and Finding data structures with field descriptions.',
    defaultKeywords: 'API objects, data structures, audit object, finding object, Kritano API schema',
  },

  // ── Auth ────────────────────────────────────────────────
  {
    path: '/login',
    label: 'Login',
    category: 'auth',
    defaultTitle: 'Log In',
    defaultDescription: 'Sign in to your Kritano account.',
    noindex: true,
  },
  {
    path: '/register',
    label: 'Register',
    category: 'auth',
    defaultTitle: 'Create Account',
    defaultDescription: 'Create your free Kritano account and start auditing your website.',
    noindex: true,
  },

  // ── Dashboard (authenticated) ──────────────────────────
  {
    path: '/app/dashboard',
    label: 'Dashboard',
    category: 'dashboard',
    defaultTitle: 'Dashboard',
    defaultDescription: 'Your Kritano dashboard.',
    noindex: true,
  },
  {
    path: '/app/audits',
    label: 'Audits',
    category: 'dashboard',
    defaultTitle: 'Audits',
    defaultDescription: 'View and manage your website audits.',
    noindex: true,
  },
  {
    path: '/app/sites',
    label: 'Sites',
    category: 'dashboard',
    defaultTitle: 'Sites',
    defaultDescription: 'Manage your registered sites.',
    noindex: true,
  },
  {
    path: '/app/schedules',
    label: 'Schedules',
    category: 'dashboard',
    defaultTitle: 'Scheduled Audits',
    defaultDescription: 'View and manage your scheduled audits.',
    noindex: true,
  },
  {
    path: '/app/analytics',
    label: 'Analytics',
    category: 'dashboard',
    defaultTitle: 'Analytics',
    defaultDescription: 'Analyse trends across your audits and sites.',
    noindex: true,
  },
  {
    path: '/app/referrals',
    label: 'Referrals',
    category: 'dashboard',
    defaultTitle: 'Referrals',
    defaultDescription: 'Invite others and earn rewards with Kritano referrals.',
    noindex: true,
  },
  {
    path: '/app/compare',
    label: 'Compare',
    category: 'dashboard',
    defaultTitle: 'Compare',
    defaultDescription: 'Compare audits and sites side by side.',
    noindex: true,
  },
  {
    path: '/app/settings',
    label: 'Settings',
    category: 'dashboard',
    defaultTitle: 'Settings',
    defaultDescription: 'Manage your account settings.',
    noindex: true,
  },
  {
    path: '/app/audits/:id/compliance',
    label: 'Compliance Report',
    category: 'dashboard',
    defaultTitle: 'EAA Compliance Report',
    defaultDescription: 'European Accessibility Act compliance assessment for your website audit.',
    noindex: true,
  },
];
