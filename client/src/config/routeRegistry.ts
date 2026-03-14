/**
 * Route Registry — Single source of truth for all app routes.
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
  noindex?: boolean;
}

export const routeRegistry: RouteEntry[] = [
  // ── Public ──────────────────────────────────────────────
  {
    path: '/',
    label: 'Home',
    category: 'public',
    defaultTitle: 'Web Accessibility Auditing',
    defaultDescription: 'PagePulser helps you audit and improve your website\'s accessibility, SEO, performance and security.',
  },
  {
    path: '/about',
    label: 'About',
    category: 'public',
    defaultTitle: 'About Us',
    defaultDescription: 'Learn about PagePulser and our mission to make the web more accessible.',
  },
  {
    path: '/services',
    label: 'Services',
    category: 'public',
    defaultTitle: 'Our Services',
    defaultDescription: 'Explore PagePulser\'s web auditing services including accessibility, SEO, performance and security checks.',
  },
  {
    path: '/pricing',
    label: 'Pricing',
    category: 'public',
    defaultTitle: 'Pricing',
    defaultDescription: 'Choose the right PagePulser plan for your needs — from free to enterprise.',
  },
  {
    path: '/contact',
    label: 'Contact',
    category: 'public',
    defaultTitle: 'Contact Us',
    defaultDescription: 'Get in touch with the PagePulser team for questions, support or partnerships.',
  },
  {
    path: '/blog',
    label: 'Blog',
    category: 'public',
    defaultTitle: 'Blog',
    defaultDescription: 'Tips, guides and insights on web accessibility, SEO and performance.',
  },
  {
    path: '/terms',
    label: 'Terms & Conditions',
    category: 'public',
    defaultTitle: 'Terms & Conditions',
    defaultDescription: 'PagePulser terms and conditions of use.',
  },
  {
    path: '/privacy',
    label: 'Privacy Policy',
    category: 'public',
    defaultTitle: 'Privacy Policy',
    defaultDescription: 'PagePulser privacy policy — how we handle your data.',
  },

  // ── API Docs ─────────────────────────────────────────────
  {
    path: '/docs',
    label: 'API Docs',
    category: 'public',
    defaultTitle: 'API Documentation',
    defaultDescription: 'Comprehensive API documentation for PagePulser — automate website audits, retrieve findings, and build custom integrations.',
  },
  {
    path: '/docs/authentication',
    label: 'API Authentication',
    category: 'public',
    defaultTitle: 'Authentication - API Docs',
    defaultDescription: 'Learn how to authenticate your PagePulser API requests using API keys and Bearer tokens.',
  },
  {
    path: '/docs/rate-limits',
    label: 'API Rate Limits',
    category: 'public',
    defaultTitle: 'Rate Limits - API Docs',
    defaultDescription: 'Understand PagePulser API rate limits by plan tier, rate limit headers, and how to handle 429 responses.',
  },
  {
    path: '/docs/errors',
    label: 'API Errors',
    category: 'public',
    defaultTitle: 'Error Handling - API Docs',
    defaultDescription: 'PagePulser API error codes, response format, and troubleshooting guide.',
  },
  {
    path: '/docs/endpoints',
    label: 'API Endpoints',
    category: 'public',
    defaultTitle: 'Endpoints - API Docs',
    defaultDescription: 'Complete reference for all PagePulser API v1 endpoints — create audits, list results, retrieve findings, and more.',
  },
  {
    path: '/docs/objects',
    label: 'API Objects',
    category: 'public',
    defaultTitle: 'Object Reference - API Docs',
    defaultDescription: 'Complete reference for PagePulser API objects — Audit and Finding data structures with field descriptions.',
  },

  // ── Auth ────────────────────────────────────────────────
  {
    path: '/login',
    label: 'Login',
    category: 'auth',
    defaultTitle: 'Log In',
    defaultDescription: 'Sign in to your PagePulser account.',
    noindex: true,
  },
  {
    path: '/register',
    label: 'Register',
    category: 'auth',
    defaultTitle: 'Create Account',
    defaultDescription: 'Create your free PagePulser account and start auditing your website.',
    noindex: true,
  },

  // ── Dashboard (authenticated) ──────────────────────────
  {
    path: '/dashboard',
    label: 'Dashboard',
    category: 'dashboard',
    defaultTitle: 'Dashboard',
    defaultDescription: 'Your PagePulser dashboard.',
    noindex: true,
  },
  {
    path: '/audits',
    label: 'Audits',
    category: 'dashboard',
    defaultTitle: 'Audits',
    defaultDescription: 'View and manage your website audits.',
    noindex: true,
  },
  {
    path: '/sites',
    label: 'Sites',
    category: 'dashboard',
    defaultTitle: 'Sites',
    defaultDescription: 'Manage your registered sites.',
    noindex: true,
  },
  {
    path: '/schedules',
    label: 'Schedules',
    category: 'dashboard',
    defaultTitle: 'Scheduled Audits',
    defaultDescription: 'View and manage your scheduled audits.',
    noindex: true,
  },
  {
    path: '/analytics',
    label: 'Analytics',
    category: 'dashboard',
    defaultTitle: 'Analytics',
    defaultDescription: 'Analyse trends across your audits and sites.',
    noindex: true,
  },
  {
    path: '/referrals',
    label: 'Referrals',
    category: 'dashboard',
    defaultTitle: 'Referrals',
    defaultDescription: 'Invite others and earn rewards with PagePulser referrals.',
    noindex: true,
  },
  {
    path: '/compare',
    label: 'Compare',
    category: 'dashboard',
    defaultTitle: 'Compare',
    defaultDescription: 'Compare audits and sites side by side.',
    noindex: true,
  },
  {
    path: '/settings',
    label: 'Settings',
    category: 'dashboard',
    defaultTitle: 'Settings',
    defaultDescription: 'Manage your account settings.',
    noindex: true,
  },
];
