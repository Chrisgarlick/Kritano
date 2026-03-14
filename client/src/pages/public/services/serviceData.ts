/**
 * Service detail page data — keyed by URL slug.
 *
 * Each entry contains all content needed to render a deep-dive service page.
 * Adding or editing a service is a data-only change.
 */

export interface FeatureGroup {
  title: string;
  items: string[];
}

export interface MethodologyStep {
  step: number;
  title: string;
  description: string;
}

export interface CommonIssue {
  title: string;
  severity: 'critical' | 'serious' | 'moderate' | 'minor';
  description: string;
}

export interface BusinessStat {
  value: string;
  label: string;
}

export interface ServiceData {
  title: string;
  subtitle: string;
  heroDescription: string;
  iconName: 'TrendingUp' | 'Accessibility' | 'Shield' | 'Zap';
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
}

export const SERVICES_DATA: Record<string, ServiceData> = {
  seo: {
    title: 'SEO Auditing',
    subtitle: 'Get found. Get traffic.',
    heroDescription:
      'Our SEO engine analyses your pages against 100+ ranking factors, from metadata and structured data to Core Web Vitals and mobile-friendliness. Every finding includes clear fix guidance so your team can act immediately — no guesswork, no wasted effort.',
    iconName: 'TrendingUp',
    colorScheme: {
      text: 'text-indigo-600',
      bg: 'bg-indigo-50',
      border: 'border-indigo-100',
      badgeBg: 'bg-indigo-100',
      badgeText: 'text-indigo-700',
    },
    seo: {
      title: 'SEO Auditing',
      description:
        'Analyse your website against 100+ SEO ranking factors. PagePulser checks metadata, structured data, Core Web Vitals, mobile-friendliness, and more — with clear fix guidance for every issue.',
    },
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
      {
        step: 1,
        title: 'Crawl & Discover',
        description:
          'We crawl your pages like a search engine would, following links, reading sitemaps, and checking robots.txt directives.',
      },
      {
        step: 2,
        title: 'Analyse Against 100+ Rules',
        description:
          'Each page is evaluated against our rule engine covering metadata, content structure, technical SEO, and rich results.',
      },
      {
        step: 3,
        title: 'Prioritise by Impact',
        description:
          'Findings are ranked by their potential impact on rankings, so you fix the most important issues first.',
      },
      {
        step: 4,
        title: 'Deliver Fix Guidance',
        description:
          'Every issue comes with a clear explanation and actionable recommendation — copy-paste fixes where possible.',
      },
    ],
    commonIssues: [
      {
        title: 'Missing or duplicate title tags',
        severity: 'critical',
        description:
          'Pages without unique title tags are nearly invisible to search engines and reduce click-through rates.',
      },
      {
        title: 'No structured data',
        severity: 'serious',
        description:
          'Without Schema.org markup, your pages miss out on rich snippets that dramatically boost visibility.',
      },
      {
        title: 'Broken internal links',
        severity: 'serious',
        description:
          'Broken links waste crawl budget and create dead ends that frustrate both users and search bots.',
      },
      {
        title: 'Missing alt text on images',
        severity: 'moderate',
        description:
          'Images without alt text miss ranking opportunities in image search and harm accessibility.',
      },
      {
        title: 'Non-descriptive anchor text',
        severity: 'minor',
        description:
          'Generic link text like "click here" provides no context to search engines about the linked page.',
      },
      {
        title: 'Missing meta descriptions',
        severity: 'moderate',
        description:
          'Without a meta description, search engines auto-generate snippets that may not represent your page well.',
      },
    ],
    businessImpact: {
      headline: 'Why SEO matters for your business',
      description:
        'Organic search drives the majority of website traffic. Small improvements in rankings can lead to significant increases in qualified visitors.',
      stats: [
        { value: '53%', label: 'of all website traffic comes from organic search' },
        { value: '75%', label: 'of users never scroll past the first page of results' },
        { value: '14.6%', label: 'close rate for SEO leads vs 1.7% for outbound' },
      ],
    },
    cta: {
      headline: 'See how your pages rank',
      description:
        'Run a free SEO audit and get actionable recommendations in minutes.',
      buttonText: 'Start SEO Audit',
    },
    relatedSlugs: ['accessibility', 'security', 'performance'],
  },

  accessibility: {
    title: 'Accessibility (WCAG 2.2)',
    subtitle: 'Inclusive by design.',
    heroDescription:
      'Ensure your website is usable by everyone, regardless of ability. PagePulser checks your pages against WCAG 2.2 Level AA criteria, helping you meet legal requirements and reach a wider audience — because no visitor should be left behind.',
    iconName: 'Accessibility',
    colorScheme: {
      text: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
      badgeBg: 'bg-emerald-100',
      badgeText: 'text-emerald-700',
    },
    seo: {
      title: 'Accessibility Auditing (WCAG 2.2)',
      description:
        'Check your website against WCAG 2.2 Level AA criteria. PagePulser evaluates color contrast, keyboard navigation, screen reader compatibility, semantic HTML, and more.',
    },
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
      {
        step: 1,
        title: 'Apply WCAG 2.2 AA Rules',
        description:
          'Every page is tested against the full WCAG 2.2 Level AA success criteria using automated checks.',
      },
      {
        step: 2,
        title: 'DOM & ARIA Analysis',
        description:
          'We inspect the Document Object Model for semantic correctness, ARIA usage, and role compliance.',
      },
      {
        step: 3,
        title: 'Screen Reader Simulation',
        description:
          'Our engine simulates how assistive technologies interpret your page structure and content.',
      },
      {
        step: 4,
        title: 'Assess User Impact',
        description:
          'Each finding is rated by its real-world impact on users with different abilities, from vision to motor impairments.',
      },
    ],
    commonIssues: [
      {
        title: 'Insufficient color contrast',
        severity: 'critical',
        description:
          'Text that doesn\'t meet minimum contrast ratios is unreadable for users with low vision.',
      },
      {
        title: 'Missing form labels',
        severity: 'critical',
        description:
          'Form inputs without associated labels make forms unusable for screen reader users.',
      },
      {
        title: 'No keyboard access to interactive elements',
        severity: 'serious',
        description:
          'Buttons and links that can\'t be reached via keyboard exclude users who can\'t use a mouse.',
      },
      {
        title: 'Images without alt text',
        severity: 'serious',
        description:
          'Screen readers can\'t convey image meaning without descriptive alternative text.',
      },
      {
        title: 'Missing skip navigation link',
        severity: 'moderate',
        description:
          'Without a skip link, keyboard users must tab through every navigation item on every page.',
      },
      {
        title: 'Incorrect heading hierarchy',
        severity: 'moderate',
        description:
          'Skipped heading levels confuse screen reader users who navigate by document structure.',
      },
    ],
    businessImpact: {
      headline: 'Why accessibility matters for your business',
      description:
        'Accessible websites reach more people, reduce legal risk, and often perform better in search results.',
      stats: [
        { value: '16%', label: 'of the global population lives with some form of disability' },
        { value: '71%', label: 'of disabled users leave inaccessible websites immediately' },
        { value: '$13T', label: 'annual disposable income of people with disabilities worldwide' },
      ],
    },
    cta: {
      headline: 'Make your site accessible to everyone',
      description:
        'Run a free accessibility audit and see exactly what needs fixing.',
      buttonText: 'Start Accessibility Audit',
    },
    relatedSlugs: ['seo', 'security', 'performance'],
  },

  security: {
    title: 'Security Scanning',
    subtitle: 'Protect your visitors.',
    heroDescription:
      'Identify security vulnerabilities before attackers do. Our scanner checks for exposed sensitive files, insecure resources, missing security headers, and common misconfigurations that put your users at risk — giving you a clear security posture in minutes.',
    iconName: 'Shield',
    colorScheme: {
      text: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-100',
      badgeBg: 'bg-red-100',
      badgeText: 'text-red-700',
    },
    seo: {
      title: 'Security Scanning',
      description:
        'Identify website security vulnerabilities before attackers do. PagePulser checks HTTPS configuration, security headers, exposed files, cookie security, and more.',
    },
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
      {
        step: 1,
        title: 'HTTPS Verification',
        description:
          'We verify your SSL/TLS configuration, certificate validity, and secure transport enforcement.',
      },
      {
        step: 2,
        title: 'Header Analysis',
        description:
          'Every security-related HTTP header is checked against current best practices and OWASP guidelines.',
      },
      {
        step: 3,
        title: 'File Exposure Scan',
        description:
          'We probe for commonly exposed sensitive files, backup files, and configuration files that should be private.',
      },
      {
        step: 4,
        title: 'Cookie & Session Audit',
        description:
          'Cookies are inspected for secure flags, SameSite attributes, and proper scoping.',
      },
    ],
    commonIssues: [
      {
        title: 'Missing Content Security Policy',
        severity: 'critical',
        description:
          'Without CSP, your site is vulnerable to cross-site scripting (XSS) and data injection attacks.',
      },
      {
        title: 'No HSTS header',
        severity: 'serious',
        description:
          'Without HSTS, browsers may connect over insecure HTTP, exposing users to man-in-the-middle attacks.',
      },
      {
        title: 'Exposed .env or config files',
        severity: 'critical',
        description:
          'Publicly accessible configuration files can leak database credentials, API keys, and secrets.',
      },
      {
        title: 'Cookies without Secure flag',
        severity: 'serious',
        description:
          'Cookies sent over unencrypted connections can be intercepted and used for session hijacking.',
      },
      {
        title: 'Missing X-Frame-Options',
        severity: 'moderate',
        description:
          'Without frame protection, your site can be embedded in malicious pages for clickjacking attacks.',
      },
      {
        title: 'Server version disclosure',
        severity: 'minor',
        description:
          'Revealing server software and versions helps attackers find known vulnerabilities to exploit.',
      },
    ],
    businessImpact: {
      headline: 'Why security matters for your business',
      description:
        'A single security breach can destroy customer trust and cost millions. Proactive scanning prevents the most common attack vectors.',
      stats: [
        { value: '$4.45M', label: 'average cost of a data breach globally' },
        { value: '43%', label: 'of cyber attacks target small businesses' },
        { value: '277 days', label: 'average time to identify and contain a breach' },
      ],
    },
    cta: {
      headline: 'Find vulnerabilities before attackers do',
      description:
        'Run a free security scan and get a clear picture of your site\'s defences.',
      buttonText: 'Start Security Scan',
    },
    relatedSlugs: ['seo', 'accessibility', 'performance'],
  },

  performance: {
    title: 'Performance Analysis',
    subtitle: 'Speed wins.',
    heroDescription:
      'Page speed directly impacts user experience and search rankings. Our performance engine identifies exactly what\'s slowing your pages down, with prioritised recommendations for maximum impact — so you fix what matters most first.',
    iconName: 'Zap',
    colorScheme: {
      text: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      badgeBg: 'bg-amber-100',
      badgeText: 'text-amber-700',
    },
    seo: {
      title: 'Performance Analysis',
      description:
        'Identify exactly what\'s slowing your website down. PagePulser analyses Core Web Vitals, resource optimisation, caching, render pipeline, and more — with prioritised fix recommendations.',
    },
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
      {
        step: 1,
        title: 'Page Load Simulation',
        description:
          'We simulate page loads in controlled environments to measure real loading performance.',
      },
      {
        step: 2,
        title: 'Resource Waterfall Analysis',
        description:
          'Every resource request is mapped to identify bottlenecks, blocking resources, and inefficient loading.',
      },
      {
        step: 3,
        title: 'Core Web Vitals Measurement',
        description:
          'LCP, CLS, and INP are measured and compared against Google\'s thresholds for good user experience.',
      },
      {
        step: 4,
        title: 'Impact-Ranked Recommendations',
        description:
          'Findings are ranked by potential performance gain, so you get the biggest speed improvements first.',
      },
    ],
    commonIssues: [
      {
        title: 'Unoptimised images',
        severity: 'critical',
        description:
          'Oversized images are the number one cause of slow page loads, often adding megabytes of unnecessary data.',
      },
      {
        title: 'Render-blocking JavaScript',
        severity: 'serious',
        description:
          'Scripts that block rendering delay the first paint, making pages feel sluggish to users.',
      },
      {
        title: 'No browser caching',
        severity: 'serious',
        description:
          'Without caching headers, returning visitors must re-download every resource on every visit.',
      },
      {
        title: 'Excessive third-party scripts',
        severity: 'moderate',
        description:
          'Analytics, ads, and widgets from external domains add significant latency and unpredictability.',
      },
      {
        title: 'Layout shift from late-loading content',
        severity: 'moderate',
        description:
          'Elements that shift after initial render create a jarring experience and hurt CLS scores.',
      },
      {
        title: 'No text compression',
        severity: 'minor',
        description:
          'Serving uncompressed HTML, CSS, and JS wastes bandwidth and slows page delivery.',
      },
    ],
    businessImpact: {
      headline: 'Why performance matters for your business',
      description:
        'Every second of load time costs conversions. Faster sites rank higher, convert better, and keep users engaged.',
      stats: [
        { value: '53%', label: 'of mobile users abandon sites that take over 3 seconds to load' },
        { value: '7%', label: 'decrease in conversions for every 1-second delay' },
        { value: '2x', label: 'more pages viewed on sites loading under 2 seconds' },
      ],
    },
    cta: {
      headline: 'Find out what\'s slowing you down',
      description:
        'Run a free performance audit and get prioritised speed recommendations.',
      buttonText: 'Start Performance Audit',
    },
    relatedSlugs: ['seo', 'accessibility', 'security'],
  },
};

export function getServiceBySlug(slug: string): ServiceData | undefined {
  return SERVICES_DATA[slug];
}

export const SERVICE_SLUGS = Object.keys(SERVICES_DATA);
