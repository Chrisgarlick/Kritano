/**
 * Comparison Pages SSR Service
 *
 * Renders comparison landing and detail pages for Kritano vs competitors
 * and "alternatives to X" roundup pages.
 */

import {
  BASE_URL,
  escapeHtml,
  htmlShell,
  renderAuthorBio,
} from './ssr-shared.service.js';

// ── Helpers ──────────────────────────────────────────────────────────

function jsonLd(data: Record<string, unknown>): string {
  return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
}

// ── Data Structures ──────────────────────────────────────────────────

interface ComparisonFeature {
  name: string;
  kritano: string | boolean;
  competitor: string | boolean;
}

interface ComparisonCategory {
  name: string;
  features: ComparisonFeature[];
}

interface ComparisonEntry {
  slug: string;
  type: 'vs' | 'alternatives';
  competitor: string;
  competitorUrl: string;
  seo: { title: string; description: string; keyword: string };
  intro: string;
  tldr: string;
  categories: ComparisonCategory[];
  pricing: { kritano: string; competitor: string; verdict: string };
  bestFor: { kritano: string[]; competitor: string[] };
  verdict: string;
  faqs: { question: string; answer: string }[];
  alternatives?: { name: string; description: string; pricing: string; bestFor: string; url: string }[];
}

// ── Phase 1 Data ─────────────────────────────────────────────────────

const COMPARISONS: Record<string, ComparisonEntry> = {
  'siteimprove-alternatives': {
    slug: 'siteimprove-alternatives',
    type: 'alternatives',
    competitor: 'Siteimprove',
    competitorUrl: 'https://siteimprove.com',
    seo: {
      title: 'Best Siteimprove Alternatives in 2026',
      description: 'Looking for a Siteimprove alternative? Compare features, pricing, and capabilities of the top website auditing platforms.',
      keyword: 'Siteimprove alternatives',
    },
    intro: 'Siteimprove is a well-established digital accessibility and quality assurance platform used by enterprises and government organisations worldwide. It covers accessibility, SEO, analytics, and content quality in a multi-module platform. However, its enterprise pricing (typically $8,000-$28,000+ per year with onboarding fees of $2,000-$10,000), long contract terms, and complexity make it impractical for small businesses, freelancers, and agencies who need similar capabilities at a fraction of the cost.',
    tldr: 'Kritano offers the same breadth of coverage as Siteimprove - SEO, accessibility, security, performance, content quality, and structured data - at a fraction of the price, starting free.',
    categories: [
      {
        name: 'Accessibility',
        features: [
          { name: 'WCAG 2.2 Level AA testing', kritano: true, competitor: true },
          { name: 'Automated issue detection', kritano: true, competitor: true },
          { name: 'Remediation guidance', kritano: 'Fix code snippets per issue', competitor: 'Workflow-based remediation' },
          { name: 'EAA compliance reporting', kritano: true, competitor: true },
          { name: 'Colour contrast checking', kritano: true, competitor: true },
          { name: 'Screen reader simulation', kritano: true, competitor: false },
        ],
      },
      {
        name: 'SEO',
        features: [
          { name: 'Technical SEO audit', kritano: true, competitor: true },
          { name: 'Metadata analysis', kritano: true, competitor: true },
          { name: 'Broken link detection', kritano: true, competitor: true },
          { name: 'Structured data validation', kritano: true, competitor: false },
          { name: 'Core Web Vitals', kritano: true, competitor: true },
          { name: 'Content Quality Score', kritano: true, competitor: false },
        ],
      },
      {
        name: 'Security',
        features: [
          { name: 'Security header analysis', kritano: true, competitor: false },
          { name: 'HTTPS/SSL checks', kritano: true, competitor: 'Basic' },
          { name: 'Exposed file detection', kritano: true, competitor: false },
          { name: 'Cookie security audit', kritano: true, competitor: false },
        ],
      },
      {
        name: 'Reporting & Exports',
        features: [
          { name: 'PDF reports', kritano: true, competitor: true },
          { name: 'White-label exports', kritano: 'Agency plan', competitor: 'Enterprise only' },
          { name: 'CSV/JSON export', kritano: true, competitor: 'Limited' },
          { name: 'API access', kritano: true, competitor: true },
          { name: 'Shareable report links', kritano: true, competitor: false },
        ],
      },
    ],
    pricing: {
      kritano: 'Free forever plan. Paid plans from $19/mo to $99/mo. No contracts.',
      competitor: 'Custom pricing, typically $8,000-$28,000+/year. Onboarding fees of $2,000-$10,000. Annual contracts required.',
      verdict: 'Kritano is dramatically more affordable. The Agency plan at $99/mo ($1,188/yr) gives you comparable feature coverage to Siteimprove at a fraction of the cost. The free plan lets you evaluate before committing.',
    },
    bestFor: {
      kritano: [
        'Small to mid-sized businesses needing enterprise-grade auditing at SMB pricing',
        'Agencies managing multiple client sites with white-label exports',
        'Teams that want 6-pillar coverage (including security and content quality) in one tool',
        'Anyone who needs to evaluate before committing (free tier available)',
      ],
      competitor: [
        'Large enterprises with dedicated accessibility teams and budget',
        'Organisations that need managed services and dedicated account managers',
        'Government and higher education with existing Siteimprove contracts',
        'Teams that need analytics and content authoring alongside accessibility',
      ],
    },
    verdict: 'Siteimprove is a mature, well-respected platform - particularly strong in enterprise accessibility workflows and analytics. If you have the budget and need managed services, it delivers. But for the majority of businesses, agencies, and freelancers, Kritano provides the same breadth of coverage across more dimensions (especially security, content quality, and structured data) at a price point that is 10-20x lower. The free tier means you can see exactly what you get before spending anything.',
    faqs: [
      {
        question: 'Is Siteimprove worth the price?',
        answer: 'Siteimprove is a strong platform for enterprises with large budgets. However, for small to mid-sized businesses, the typical $8,000-$28,000/year cost plus onboarding fees makes it impractical. Tools like Kritano offer comparable coverage starting free.',
      },
      {
        question: 'What does Siteimprove do that Kritano does not?',
        answer: 'Siteimprove includes built-in analytics, content authoring workflows, and managed professional services. These are valuable for large enterprise teams. Kritano focuses on auditing and reporting rather than analytics or content management.',
      },
      {
        question: 'Can I migrate from Siteimprove to Kritano?',
        answer: 'Yes. Kritano audits the same accessibility standards (WCAG 2.2 Level AA) and covers additional pillars like security and content quality. You can run a free Kritano audit alongside your existing Siteimprove setup to compare results before switching.',
      },
      {
        question: 'Does Kritano check accessibility like Siteimprove?',
        answer: 'Yes. Both tools test against WCAG 2.2 Level AA. Kritano uses the axe-core engine (industry standard) and additionally checks security headers, performance, content quality, and structured data - areas Siteimprove does not cover.',
      },
    ],
    alternatives: [
      {
        name: 'Kritano',
        description: '6-pillar website auditing covering SEO, accessibility, security, performance, content quality, and structured data. The only tool with Content Intelligence (E-E-A-T, AEO, Content Quality Score).',
        pricing: 'Free - $99/mo',
        bestFor: 'Teams wanting comprehensive coverage at accessible pricing',
        url: 'https://kritano.com',
      },
      {
        name: 'Silktide',
        description: 'All-in-one website quality platform with accessibility, SEO, content, and marketing modules. Good mid-market option.',
        pricing: 'Custom, typically $3,000-$10,000/yr',
        bestFor: 'Mid-market teams wanting similar breadth to Siteimprove',
        url: 'https://silktide.com',
      },
      {
        name: 'Pope Tech',
        description: 'Built on the WAVE engine with transparent pricing. Strong in education and government sectors.',
        pricing: '$25-$400/mo',
        bestFor: 'Education institutions and accessibility-focused teams',
        url: 'https://pope.tech',
      },
      {
        name: 'Monsido (Acquia)',
        description: 'Digital quality platform with accessibility, SEO, and content quality modules. PageCorrect lets non-developers fix issues.',
        pricing: 'From $2,000/yr',
        bestFor: 'Non-technical teams wanting a visual editor for fixes',
        url: 'https://monsido.com',
      },
    ],
  },

  'kritano-vs-semrush': {
    slug: 'kritano-vs-semrush',
    type: 'vs',
    competitor: 'Semrush',
    competitorUrl: 'https://semrush.com',
    seo: {
      title: 'Kritano vs Semrush - Website Audit Comparison',
      description: 'How does Kritano compare to Semrush for website auditing? Feature-by-feature comparison of SEO, accessibility, security, and pricing.',
      keyword: 'Semrush site audit alternative',
    },
    intro: 'Semrush is one of the most popular SEO platforms in the world, used by over 10 million marketers. Its Site Audit tool checks 120+ technical SEO issues and is part of a broader suite that includes keyword research, backlink analysis, and rank tracking. Kritano takes a different approach - it focuses exclusively on website auditing across six dimensions: SEO, accessibility, security, performance, content quality, and structured data.',
    tldr: 'Semrush is the better choice for keyword research and backlink analysis. Kritano is the better choice for comprehensive website auditing across SEO, accessibility, security, performance, and content quality.',
    categories: [
      {
        name: 'SEO Auditing',
        features: [
          { name: 'Technical SEO checks', kritano: '100+ rules', competitor: '120+ issues' },
          { name: 'Metadata analysis', kritano: true, competitor: true },
          { name: 'Broken link detection', kritano: true, competitor: true },
          { name: 'Structured data validation', kritano: true, competitor: 'Basic' },
          { name: 'Core Web Vitals', kritano: true, competitor: true },
          { name: 'Internal linking analysis', kritano: true, competitor: true },
        ],
      },
      {
        name: 'Accessibility',
        features: [
          { name: 'WCAG 2.2 testing', kritano: true, competitor: false },
          { name: 'Colour contrast checking', kritano: true, competitor: false },
          { name: 'Screen reader compatibility', kritano: true, competitor: false },
          { name: 'Keyboard navigation audit', kritano: true, competitor: false },
          { name: 'EAA compliance reporting', kritano: true, competitor: false },
        ],
      },
      {
        name: 'Security',
        features: [
          { name: 'Security header analysis', kritano: true, competitor: false },
          { name: 'HTTPS configuration', kritano: 'Full audit', competitor: 'Basic check' },
          { name: 'Exposed file detection', kritano: true, competitor: false },
          { name: 'Cookie security', kritano: true, competitor: false },
        ],
      },
      {
        name: 'Content & AI',
        features: [
          { name: 'Content Quality Score', kritano: true, competitor: false },
          { name: 'E-E-A-T analysis', kritano: true, competitor: false },
          { name: 'AEO (Answer Engine Optimisation)', kritano: true, competitor: false },
          { name: 'Readability scoring', kritano: true, competitor: 'Via SEO Writing Assistant' },
        ],
      },
      {
        name: 'Beyond Auditing',
        features: [
          { name: 'Keyword research', kritano: false, competitor: true },
          { name: 'Backlink analysis', kritano: false, competitor: true },
          { name: 'Rank tracking', kritano: false, competitor: true },
          { name: 'Competitor analysis', kritano: false, competitor: true },
          { name: 'PPC/advertising tools', kritano: false, competitor: true },
        ],
      },
    ],
    pricing: {
      kritano: 'Free forever plan. Starter $19/mo, Pro $49/mo, Agency $99/mo. No contracts.',
      competitor: 'Pro $139.95/mo, Guru $249.95/mo, Business $499.95/mo. Annual billing saves ~17%.',
      verdict: 'Kritano is significantly cheaper for website auditing. However, Semrush includes keyword research, backlink analysis, and rank tracking that Kritano does not offer. If you only need auditing, Kritano is the clear value choice. If you need a full SEO marketing suite, Semrush\'s higher price includes more tools.',
    },
    bestFor: {
      kritano: [
        'Teams that need accessibility, security, and content quality auditing alongside SEO',
        'Agencies wanting affordable multi-site auditing with white-label exports',
        'Businesses focused on website health rather than keyword research',
        'Anyone who wants to audit first before committing (free tier)',
      ],
      competitor: [
        'SEO professionals who need keyword research and rank tracking',
        'Marketing teams running PPC campaigns alongside SEO',
        'Agencies that need backlink analysis and competitor research',
        'Teams already invested in the Semrush ecosystem',
      ],
    },
    verdict: 'These tools serve different primary needs. Semrush is a full SEO marketing platform where site auditing is one feature among many. Kritano is a dedicated website auditing platform that goes deeper across more dimensions - particularly accessibility, security, and content quality, which Semrush does not cover at all. If your main goal is to understand and improve your website\'s overall health, Kritano is the better fit. If you need keyword research, backlink analysis, and rank tracking, Semrush is the better fit. Many teams use both.',
    faqs: [
      {
        question: 'Does Semrush check website accessibility?',
        answer: 'No. Semrush\'s Site Audit focuses on technical SEO issues. It does not test against WCAG 2.2 or check for accessibility issues like colour contrast, keyboard navigation, screen reader compatibility, or ARIA attributes. Kritano covers all of these.',
      },
      {
        question: 'Is Kritano a Semrush replacement?',
        answer: 'Not entirely. Kritano replaces and improves on Semrush\'s site audit functionality, and adds accessibility, security, content quality, and structured data analysis. However, Kritano does not offer keyword research, backlink analysis, or rank tracking. Many users run both tools.',
      },
      {
        question: 'Which is better value for website auditing?',
        answer: 'Kritano. The free plan includes SEO, security, and content checks. The Pro plan at $49/mo covers all six audit dimensions with unlimited audits. Semrush\'s cheapest plan with site audit access is $139.95/mo, and it only covers SEO.',
      },
      {
        question: 'Can Kritano do everything Semrush does?',
        answer: 'No. Kritano focuses exclusively on website auditing and health monitoring. It does not include keyword research, backlink analysis, rank tracking, or PPC tools. Kritano goes deeper on auditing (6 pillars vs 1) while Semrush goes wider across marketing.',
      },
    ],
  },

  'wave-alternative': {
    slug: 'wave-alternative',
    type: 'alternatives',
    competitor: 'WAVE',
    competitorUrl: 'https://wave.webaim.org',
    seo: {
      title: 'Best WAVE Alternatives for Accessibility Testing in 2026',
      description: 'Looking beyond WAVE for accessibility testing? Compare the best alternatives with broader coverage, continuous monitoring, and actionable fix guidance.',
      keyword: 'WAVE alternative',
    },
    intro: 'WAVE (Web Accessibility Evaluation Tool) by WebAIM is one of the most widely used free accessibility testing tools. Its browser extension provides instant visual feedback by injecting icons directly onto the page, making it easy to spot issues in context. However, WAVE only tests one page at a time, provides no ongoing monitoring, and focuses exclusively on accessibility - missing SEO, security, performance, and content quality issues that also affect your site.',
    tldr: 'WAVE is an excellent free tool for quick single-page accessibility checks. For site-wide scanning, continuous monitoring, and coverage beyond accessibility, Kritano is a more complete solution.',
    categories: [
      {
        name: 'Accessibility Testing',
        features: [
          { name: 'WCAG 2.2 Level AA', kritano: true, competitor: true },
          { name: 'Visual inline feedback', kritano: false, competitor: true },
          { name: 'Colour contrast checking', kritano: true, competitor: true },
          { name: 'ARIA validation', kritano: true, competitor: true },
          { name: 'Heading hierarchy', kritano: true, competitor: true },
          { name: 'Tab order visualisation', kritano: false, competitor: true },
        ],
      },
      {
        name: 'Scanning Capabilities',
        features: [
          { name: 'Site-wide crawling', kritano: true, competitor: 'Paid API only' },
          { name: 'Multi-page scanning', kritano: true, competitor: false },
          { name: 'Scheduled monitoring', kritano: true, competitor: false },
          { name: 'Score tracking over time', kritano: true, competitor: false },
          { name: 'Mobile viewport testing', kritano: true, competitor: false },
        ],
      },
      {
        name: 'Beyond Accessibility',
        features: [
          { name: 'SEO auditing', kritano: true, competitor: false },
          { name: 'Security scanning', kritano: true, competitor: false },
          { name: 'Performance analysis', kritano: true, competitor: false },
          { name: 'Content quality scoring', kritano: true, competitor: false },
          { name: 'Structured data validation', kritano: true, competitor: false },
        ],
      },
      {
        name: 'Reporting',
        features: [
          { name: 'PDF reports', kritano: true, competitor: false },
          { name: 'Fix code snippets', kritano: true, competitor: false },
          { name: 'CSV/JSON export', kritano: true, competitor: false },
          { name: 'EAA compliance report', kritano: true, competitor: false },
          { name: 'API access', kritano: true, competitor: true },
        ],
      },
    ],
    pricing: {
      kritano: 'Free plan includes SEO, security, and content checks. Accessibility available from Starter ($19/mo). Full coverage from $49/mo.',
      competitor: 'Browser extension is free. WAVE API starts at $0.04/credit (1 credit per page). No site-wide scanning in the free tool.',
      verdict: 'WAVE\'s free extension is unbeatable for quick, single-page checks and will always have a place in a developer\'s toolkit. For site-wide accessibility scanning plus SEO, security, performance, and content quality, Kritano offers far more value - especially with the free tier for initial evaluation.',
    },
    bestFor: {
      kritano: [
        'Teams that need site-wide accessibility scanning across hundreds of pages',
        'Businesses that want accessibility plus SEO, security, and performance in one tool',
        'Agencies generating client-facing accessibility reports',
        'Anyone who needs continuous monitoring, not just point-in-time checks',
      ],
      competitor: [
        'Developers who want quick, visual, single-page accessibility checks',
        'Teams on zero budget who need a free browser extension',
        'Manual testers who want inline visual feedback on the page',
        'Educators and students learning about web accessibility',
      ],
    },
    verdict: 'WAVE and Kritano serve different use cases. WAVE excels at quick, visual, single-page accessibility inspection - and it is free, which makes it an essential tool in any developer\'s toolkit. Kritano is for when you need to scale beyond one page at a time: site-wide crawling, continuous monitoring, trend tracking, exportable reports, and coverage across all six pillars of website health. Many teams use WAVE for quick spot-checks during development and Kritano for comprehensive audits and ongoing monitoring.',
    faqs: [
      {
        question: 'Is WAVE enough for accessibility compliance?',
        answer: 'WAVE catches many common accessibility issues, but it only tests one page at a time and automated tools (including WAVE) catch roughly 30-50% of WCAG issues. For compliance purposes, you need site-wide scanning plus manual testing. WAVE is a good starting point, not a complete solution.',
      },
      {
        question: 'Does Kritano use the same engine as WAVE?',
        answer: 'Kritano uses the axe-core engine (by Deque), which is the industry standard used by most commercial accessibility tools. WAVE uses its own proprietary engine. Both test against WCAG 2.2, but their detection approaches differ slightly.',
      },
      {
        question: 'Can I use WAVE and Kritano together?',
        answer: 'Absolutely. Many teams use WAVE during development for quick visual spot-checks and Kritano for site-wide audits, ongoing monitoring, and comprehensive reporting across all six pillars. They complement each other well.',
      },
      {
        question: 'Does WAVE check SEO or security?',
        answer: 'No. WAVE is exclusively an accessibility testing tool. It does not check SEO, security headers, performance, content quality, or structured data. Kritano covers all six dimensions in a single scan.',
      },
    ],
    alternatives: [
      {
        name: 'Kritano',
        description: '6-pillar website auditing with accessibility (WCAG 2.2), SEO, security, performance, content quality, and structured data. Site-wide crawling and continuous monitoring.',
        pricing: 'Free - $99/mo',
        bestFor: 'Teams wanting comprehensive coverage beyond accessibility alone',
        url: 'https://kritano.com',
      },
      {
        name: 'axe DevTools',
        description: 'Developer-focused accessibility testing browser extension by Deque. Industry-standard axe-core engine with guided testing flows.',
        pricing: 'Free extension. Pro from $40/mo',
        bestFor: 'Developers wanting detailed WCAG guidance during development',
        url: 'https://www.deque.com/axe/devtools/',
      },
      {
        name: 'Pope Tech',
        description: 'Built on the WAVE engine with site-wide scanning, dashboards, and team management. Popular in education.',
        pricing: '$25-$400/mo',
        bestFor: 'Teams that like WAVE\'s approach but need site-wide scanning',
        url: 'https://pope.tech',
      },
      {
        name: 'Pa11y',
        description: 'Open-source command-line accessibility testing tool. Integrates with CI/CD pipelines for automated testing.',
        pricing: 'Free (open source)',
        bestFor: 'Development teams wanting accessibility checks in their CI/CD pipeline',
        url: 'https://pa11y.org',
      },
    ],
  },

  'best-website-audit-tools': {
    slug: 'best-website-audit-tools',
    type: 'alternatives',
    competitor: 'Multiple',
    competitorUrl: 'https://kritano.com/compare',
    seo: {
      title: 'Best Website Audit Tools in 2026 - Complete Comparison',
      description: 'Compare the best website audit tools of 2026. Features, pricing, and honest recommendations for SEO, accessibility, security, and performance auditing.',
      keyword: 'best website audit tools 2026',
    },
    intro: 'Choosing a website audit tool in 2026 means deciding what you actually need to check. Most tools focus on SEO, some add accessibility, but very few cover security, performance, content quality, and structured data in one scan. We have tested and compared the leading options to help you find the right fit for your team and budget.',
    tldr: 'Kritano is the only tool that covers all six pillars of website health in a single scan, starting free. For pure SEO, Semrush and Ahrefs offer broader marketing suites. For accessibility-only, WAVE and axe DevTools are excellent free options.',
    categories: [
      {
        name: 'Coverage Breadth',
        features: [
          { name: 'SEO auditing', kritano: true, competitor: 'Most tools' },
          { name: 'Accessibility (WCAG 2.2)', kritano: true, competitor: 'Siteimprove, Silktide, Pope Tech' },
          { name: 'Security scanning', kritano: true, competitor: 'Very few tools' },
          { name: 'Performance analysis', kritano: true, competitor: 'Lighthouse, some SEO tools' },
          { name: 'Content quality scoring', kritano: true, competitor: 'No other tool' },
          { name: 'Structured data validation', kritano: true, competitor: 'Some SEO tools (basic)' },
        ],
      },
    ],
    pricing: {
      kritano: 'Free - $99/mo',
      competitor: 'Varies: Free (WAVE, Lighthouse) to $28,000+/yr (Siteimprove)',
      verdict: 'Kritano offers the broadest coverage at the most accessible price point. Free tools like WAVE and Lighthouse cover individual dimensions well but miss the full picture. Premium tools like Semrush and Siteimprove cost significantly more and still cover fewer dimensions.',
    },
    bestFor: {
      kritano: [
        'Teams wanting all-in-one coverage across 6 pillars',
        'Budget-conscious teams and freelancers',
        'Agencies needing multi-site management and white-label exports',
      ],
      competitor: [
        'Semrush: teams needing keyword research + SEO auditing',
        'Ahrefs: teams focused on backlink analysis + SEO',
        'Siteimprove: enterprises with large accessibility budgets',
        'WAVE: quick free accessibility spot-checks',
        'Screaming Frog: technical SEO crawling at scale',
      ],
    },
    verdict: 'The right tool depends on what you need. If you want the broadest coverage in one scan - SEO, accessibility, security, performance, content quality, and structured data - Kritano is the only tool that does all six, starting free. If you need keyword research and backlink data alongside SEO auditing, Semrush or Ahrefs are stronger choices. If you only need accessibility, WAVE and axe DevTools are excellent free options. For large enterprises with dedicated accessibility teams and big budgets, Siteimprove remains the established choice.',
    faqs: [
      {
        question: 'What is a website audit tool?',
        answer: 'A website audit tool crawls your website and checks it against a set of rules covering areas like SEO, accessibility, security, and performance. It identifies issues, ranks them by severity, and provides recommendations for fixing them.',
      },
      {
        question: 'Which website audit tool is best for small businesses?',
        answer: 'Kritano is the best option for small businesses because it covers all six audit dimensions starting free, with paid plans from $19/mo. Most competitors either focus on one dimension or cost significantly more.',
      },
      {
        question: 'Do I need multiple audit tools?',
        answer: 'Not necessarily. If you choose a comprehensive tool like Kritano that covers SEO, accessibility, security, performance, content quality, and structured data, one tool is sufficient for most needs. You might supplement with free tools like WAVE for quick accessibility spot-checks during development.',
      },
      {
        question: 'How often should I audit my website?',
        answer: 'At minimum, quarterly. Monthly is better for active sites. After major changes (redesigns, migrations, large content updates), run an audit immediately. Kritano offers scheduled audits to automate this.',
      },
      {
        question: 'Are free website audit tools good enough?',
        answer: 'Free tools like Lighthouse and WAVE are excellent for individual checks but only cover 1-2 dimensions and test one page at a time. For comprehensive site-wide auditing across multiple dimensions with ongoing monitoring, a dedicated tool like Kritano provides significantly more value.',
      },
    ],
    alternatives: [
      {
        name: 'Kritano',
        description: 'The only tool covering all 6 pillars: SEO, accessibility, security, performance, content quality, and structured data. Content Intelligence with E-E-A-T and AEO scoring.',
        pricing: 'Free - $99/mo',
        bestFor: 'Teams wanting comprehensive website health monitoring',
        url: 'https://kritano.com',
      },
      {
        name: 'Semrush',
        description: 'Industry-leading SEO platform with site audit, keyword research, backlink analysis, rank tracking, and PPC tools. 120+ technical SEO checks.',
        pricing: '$139.95 - $499.95/mo',
        bestFor: 'Marketing teams needing SEO + PPC + competitor research',
        url: 'https://semrush.com',
      },
      {
        name: 'Ahrefs',
        description: 'Powerful SEO toolkit known for its backlink database, site explorer, and site audit features. Strong technical SEO crawling.',
        pricing: '$129 - $449/mo',
        bestFor: 'SEO professionals focused on link building and technical SEO',
        url: 'https://ahrefs.com',
      },
      {
        name: 'Screaming Frog',
        description: 'Desktop-based website crawler for technical SEO auditing. Highly configurable with custom extraction and log file analysis.',
        pricing: 'Free (500 URLs) or $259/yr',
        bestFor: 'Technical SEOs who want full crawl control',
        url: 'https://screamingfrog.co.uk',
      },
      {
        name: 'Google Lighthouse',
        description: 'Free, open-source auditing tool built into Chrome DevTools. Covers performance, accessibility, SEO, and best practices for single pages.',
        pricing: 'Free',
        bestFor: 'Quick single-page performance and accessibility checks',
        url: 'https://developer.chrome.com/docs/lighthouse/',
      },
    ],
  },
};

// ── Render Helpers ────────────────────────────────────────────────────

const CHECK_SVG = '<svg class="w-4 h-4 text-emerald-600 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>';
const X_SVG = '<svg class="w-4 h-4 text-slate-300 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>';

function renderFeatureCell(value: string | boolean): string {
  if (value === true) return `<td class="px-4 py-3 text-center">${CHECK_SVG}<span class="sr-only">Yes</span></td>`;
  if (value === false) return `<td class="px-4 py-3 text-center">${X_SVG}<span class="sr-only">No</span></td>`;
  return `<td class="px-4 py-3 text-center text-sm text-slate-700">${escapeHtml(value)}</td>`;
}

function renderComparisonTable(entry: ComparisonEntry): string {
  const competitorLabel = entry.competitor;
  let html = '';

  for (const category of entry.categories) {
    html += `
    <div class="mb-8">
      <h3 class="text-lg font-semibold text-slate-900 mb-4">${escapeHtml(category.name)}</h3>
      <div class="overflow-x-auto">
        <table class="w-full border-collapse">
          <thead>
            <tr class="bg-slate-50">
              <th scope="col" class="px-4 py-3 text-left text-sm font-semibold text-slate-700 w-1/2">Feature</th>
              <th scope="col" class="px-4 py-3 text-center text-sm font-semibold text-indigo-700 w-1/4">Kritano</th>
              <th scope="col" class="px-4 py-3 text-center text-sm font-semibold text-slate-700 w-1/4">${escapeHtml(competitorLabel)}</th>
            </tr>
          </thead>
          <tbody>`;

    for (let i = 0; i < category.features.length; i++) {
      const feature = category.features[i];
      const rowClass = i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50';
      html += `
            <tr class="${rowClass} border-t border-slate-100">
              <td class="px-4 py-3 text-sm text-slate-900">${escapeHtml(feature.name)}</td>
              ${renderFeatureCell(feature.kritano)}
              ${renderFeatureCell(feature.competitor)}
            </tr>`;
    }

    html += `
          </tbody>
        </table>
      </div>
    </div>`;
  }

  return html;
}

function renderAlternativesSection(alternatives: NonNullable<ComparisonEntry['alternatives']>): string {
  let html = `
  <section class="mb-12" aria-labelledby="top-alternatives">
    <h2 id="top-alternatives" class="text-2xl font-display text-slate-900 mb-6">Top Alternatives</h2>
    <div class="grid gap-6 md:grid-cols-2">`;

  for (let i = 0; i < alternatives.length; i++) {
    const alt = alternatives[i];
    const isKritano = alt.url === 'https://kritano.com';
    const linkAttrs = isKritano
      ? `href="/pricing"`
      : `href="${escapeHtml(alt.url)}" target="_blank" rel="noopener noreferrer nofollow"`;

    html += `
      <div class="border border-slate-200 rounded-lg p-6 bg-white shadow-sm${isKritano ? ' ring-2 ring-indigo-500/20 border-indigo-200' : ''}">
        <div class="flex items-start gap-3 mb-3">
          <span class="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-sm font-semibold text-slate-700 flex-shrink-0">${i + 1}</span>
          <h3 class="text-lg font-semibold text-slate-900">${escapeHtml(alt.name)}${isKritano ? ' <span class="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full ml-2">Recommended</span>' : ''}</h3>
        </div>
        <p class="text-sm text-slate-600 mb-3">${escapeHtml(alt.description)}</p>
        <dl class="text-sm space-y-1 mb-4">
          <div class="flex gap-2"><dt class="font-medium text-slate-700">Pricing:</dt><dd class="text-slate-600">${escapeHtml(alt.pricing)}</dd></div>
          <div class="flex gap-2"><dt class="font-medium text-slate-700">Best for:</dt><dd class="text-slate-600">${escapeHtml(alt.bestFor)}</dd></div>
        </dl>
        <a ${linkAttrs} class="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors">Visit ${escapeHtml(alt.name)} &rarr;</a>
      </div>`;
  }

  html += `
    </div>
  </section>`;
  return html;
}

function renderPricingSection(entry: ComparisonEntry): string {
  return `
  <section class="mb-12" aria-labelledby="pricing-comparison">
    <h2 id="pricing-comparison" class="text-2xl font-display text-slate-900 mb-6">Pricing Comparison</h2>
    <div class="grid gap-6 md:grid-cols-2 mb-6">
      <div class="border border-indigo-200 rounded-lg p-6 bg-indigo-50/30">
        <h3 class="font-semibold text-indigo-900 mb-2">Kritano</h3>
        <p class="text-sm text-slate-700">${escapeHtml(entry.pricing.kritano)}</p>
      </div>
      <div class="border border-slate-200 rounded-lg p-6 bg-slate-50">
        <h3 class="font-semibold text-slate-900 mb-2">${escapeHtml(entry.competitor)}</h3>
        <p class="text-sm text-slate-700">${escapeHtml(entry.pricing.competitor)}</p>
      </div>
    </div>
    <div class="border border-slate-200 rounded-lg p-6 bg-white">
      <h3 class="font-semibold text-slate-900 mb-2">Verdict</h3>
      <p class="text-sm text-slate-700">${escapeHtml(entry.pricing.verdict)}</p>
    </div>
  </section>`;
}

function renderBestForSection(entry: ComparisonEntry): string {
  return `
  <section class="mb-12" aria-labelledby="best-for">
    <h2 id="best-for" class="text-2xl font-display text-slate-900 mb-6">Who Should Choose What</h2>
    <div class="grid gap-6 md:grid-cols-2">
      <div class="border border-indigo-200 rounded-lg p-6 bg-indigo-50/30">
        <h3 class="font-semibold text-indigo-900 mb-3">Choose Kritano if...</h3>
        <ul class="space-y-2">
          ${entry.bestFor.kritano.map(item => `<li class="flex items-start gap-2 text-sm text-slate-700">${CHECK_SVG}<span>${escapeHtml(item)}</span></li>`).join('\n          ')}
        </ul>
      </div>
      <div class="border border-slate-200 rounded-lg p-6 bg-slate-50">
        <h3 class="font-semibold text-slate-900 mb-3">Choose ${escapeHtml(entry.competitor)} if...</h3>
        <ul class="space-y-2">
          ${entry.bestFor.competitor.map(item => `<li class="flex items-start gap-2 text-sm text-slate-700"><svg class="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg><span>${escapeHtml(item)}</span></li>`).join('\n          ')}
        </ul>
      </div>
    </div>
  </section>`;
}

function renderFaqsSection(faqs: ComparisonEntry['faqs']): string {
  let html = `
  <section class="mb-12" aria-labelledby="faqs">
    <h2 id="faqs" class="text-2xl font-display text-slate-900 mb-6">Frequently Asked Questions</h2>
    <div class="space-y-3">`;

  for (const faq of faqs) {
    html += `
      <details class="border border-slate-200 rounded-lg overflow-hidden group">
        <summary class="px-6 py-4 cursor-pointer text-sm font-medium text-slate-900 hover:bg-slate-50 transition-colors list-none flex items-center justify-between">
          <span>${escapeHtml(faq.question)}</span>
          <svg class="w-5 h-5 text-slate-400 flex-shrink-0 ml-4 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
        </summary>
        <div class="px-6 pb-4 text-sm text-slate-600 leading-relaxed">${escapeHtml(faq.answer)}</div>
      </details>`;
  }

  html += `
    </div>
  </section>`;
  return html;
}

function renderCta(): string {
  return `
  <section class="mb-12 rounded-xl bg-indigo-600 p-8 md:p-12 text-center" aria-labelledby="cta-heading">
    <h2 id="cta-heading" class="text-2xl md:text-3xl font-display text-white mb-4">See What Others Miss</h2>
    <p class="text-indigo-100 mb-6 max-w-2xl mx-auto">Start auditing your website across all six pillars - SEO, accessibility, security, performance, content quality, and structured data. Free forever plan available.</p>
    <a href="/register?ea=email" class="inline-flex items-center px-8 py-3 bg-white text-indigo-700 font-semibold rounded-lg hover:bg-indigo-50 transition-colors">Join Early Access</a>
  </section>`;
}

// ── Landing Page ─────────────────────────────────────────────────────

export function renderCompareLanding(): string {
  const entries = Object.values(COMPARISONS);
  const vsEntries = entries.filter(e => e.type === 'vs');
  const altEntries = entries.filter(e => e.type === 'alternatives');

  const breadcrumbLd = jsonLd({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: 'Compare', item: `${BASE_URL}/compare` },
    ],
  });

  const itemListLd = jsonLd({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Kritano Comparisons',
    itemListElement: entries.map((entry, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: entry.seo.title,
      url: `${BASE_URL}/compare/${entry.slug}`,
    })),
  });

  function renderCard(entry: ComparisonEntry): string {
    const summary = entry.type === 'vs'
      ? `Feature-by-feature comparison of Kritano and ${entry.competitor}.`
      : `The best alternatives to ${entry.competitor} for website auditing.`;
    return `
      <a href="/compare/${escapeHtml(entry.slug)}" class="block border border-slate-200 rounded-lg p-6 bg-white shadow-sm hover:shadow-md hover:border-indigo-200 transition-all">
        <span class="inline-block text-xs font-medium px-2 py-1 rounded-full mb-3 ${entry.type === 'vs' ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-700'}">${entry.type === 'vs' ? 'Comparison' : 'Alternatives'}</span>
        <h2 class="text-lg font-semibold text-slate-900 mb-2">${escapeHtml(entry.seo.title)}</h2>
        <p class="text-sm text-slate-600">${escapeHtml(summary)}</p>
      </a>`;
  }

  let cardsHtml = '';

  if (vsEntries.length > 0) {
    cardsHtml += `<h2 class="text-xl font-display text-slate-900 mb-4 mt-8">Head-to-Head Comparisons</h2>
    <div class="grid gap-6 md:grid-cols-2 mb-8">
      ${vsEntries.map(renderCard).join('\n      ')}
    </div>`;
  }

  if (altEntries.length > 0) {
    cardsHtml += `<h2 class="text-xl font-display text-slate-900 mb-4 mt-8">Alternatives & Roundups</h2>
    <div class="grid gap-6 md:grid-cols-2 mb-8">
      ${altEntries.map(renderCard).join('\n      ')}
    </div>`;
  }

  const body = `
  <main id="main-content" class="max-w-5xl mx-auto px-6 py-12">
    <h1 class="text-3xl md:text-4xl font-display text-slate-900 mb-4">Compare Kritano</h1>
    <p class="text-lg text-slate-600 mb-8 max-w-3xl">See how Kritano compares to other website auditing tools. Honest, feature-by-feature comparisons to help you choose the right tool for your needs.</p>
    ${cardsHtml}
    ${renderCta()}
  </main>`;

  return htmlShell({
    title: 'Compare Kritano - Website Audit Tool Comparisons',
    description: 'Compare Kritano with other website auditing tools. Feature-by-feature comparisons, pricing breakdowns, and honest recommendations.',
    canonicalUrl: `${BASE_URL}/compare`,
    ogImage: `${BASE_URL}/brand/og-default.png`,
    ogType: 'website',
    extraHead: `${breadcrumbLd}\n  ${itemListLd}`,
    body,
    activePath: '/compare',
  });
}

// ── Detail Page ──────────────────────────────────────────────────────

export function renderCompareDetail(slug: string): string | null {
  const entry = COMPARISONS[slug];
  if (!entry) return null;

  const breadcrumbLd = jsonLd({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: 'Compare', item: `${BASE_URL}/compare` },
      { '@type': 'ListItem', position: 3, name: entry.seo.title, item: `${BASE_URL}/compare/${entry.slug}` },
    ],
  });

  const faqLd = jsonLd({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: entry.faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  });

  let bodyContent = `
  <main id="main-content" class="max-w-5xl mx-auto px-6 py-12">
    <!-- Breadcrumb -->
    <nav aria-label="Breadcrumb" class="mb-6">
      <ol class="flex items-center gap-2 text-sm text-slate-500">
        <li><a href="/" class="hover:text-indigo-600 transition-colors">Home</a></li>
        <li aria-hidden="true">/</li>
        <li><a href="/compare" class="hover:text-indigo-600 transition-colors">Compare</a></li>
        <li aria-hidden="true">/</li>
        <li class="text-slate-900 font-medium" aria-current="page">${escapeHtml(entry.seo.title)}</li>
      </ol>
    </nav>

    <!-- Hero -->
    <header class="mb-10">
      <h1 class="text-3xl md:text-4xl font-display text-slate-900 mb-4">${escapeHtml(entry.seo.title)}</h1>
      <div class="bg-indigo-50 border border-indigo-100 rounded-lg p-4 mb-6">
        <p class="text-sm font-medium text-indigo-900"><strong>TL;DR:</strong> ${escapeHtml(entry.tldr)}</p>
      </div>
      <p class="text-slate-600 leading-relaxed">${escapeHtml(entry.intro)}</p>
    </header>`;

  // Alternatives section (for 'alternatives' type pages)
  if (entry.type === 'alternatives' && entry.alternatives) {
    bodyContent += renderAlternativesSection(entry.alternatives);
  }

  // Feature comparison table
  bodyContent += `
    <section class="mb-12" aria-labelledby="feature-comparison">
      <h2 id="feature-comparison" class="text-2xl font-display text-slate-900 mb-6">Feature Comparison</h2>
      ${renderComparisonTable(entry)}
    </section>`;

  // Pricing
  bodyContent += renderPricingSection(entry);

  // Best for
  bodyContent += renderBestForSection(entry);

  // Verdict
  bodyContent += `
    <section class="mb-12" aria-labelledby="verdict">
      <h2 id="verdict" class="text-2xl font-display text-slate-900 mb-4">Our Verdict</h2>
      <p class="text-slate-700 leading-relaxed">${escapeHtml(entry.verdict)}</p>
    </section>`;

  // FAQs
  bodyContent += renderFaqsSection(entry.faqs);

  // Author bio
  bodyContent += `
    <section class="mb-12" aria-label="About the author">
      ${renderAuthorBio()}
    </section>`;

  // CTA
  bodyContent += renderCta();

  bodyContent += `
  </main>`;

  return htmlShell({
    title: entry.seo.title,
    description: entry.seo.description,
    canonicalUrl: `${BASE_URL}/compare/${entry.slug}`,
    ogImage: `${BASE_URL}/brand/og-default.png`,
    ogType: 'article',
    extraHead: `${breadcrumbLd}\n  ${faqLd}`,
    body: bodyContent,
    activePath: '/compare',
  });
}
