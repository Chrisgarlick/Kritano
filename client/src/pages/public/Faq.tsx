import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PublicLayout } from '../../components/layout/PublicLayout';
import PageSeo from '../../components/seo/PageSeo';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface FaqCategory {
  title: string;
  faqs: { q: string; a: string }[];
}

const FAQ_CATEGORIES: FaqCategory[] = [
  {
    title: 'Product',
    faqs: [
      {
        q: 'What does Kritano do?',
        a: 'Kritano is a website auditing platform that scans your site for issues across six pillars: SEO, accessibility, security, performance, content quality, and AI readiness. You get a detailed report with prioritised fixes, scores, and actionable recommendations.',
      },
      {
        q: 'How does Kritano scan my website?',
        a: 'Kritano crawls your website starting from the URL you provide, following internal links up to the depth and page limit set by your plan. Each page is analysed against hundreds of rules covering technical SEO, WCAG 2.2 accessibility standards, security headers, performance metrics, and content quality signals.',
      },
      {
        q: 'What is the Content Quality Score (CQS)?',
        a: 'The Content Quality Score is a weighted average of five sub-scores: content quality (depth, multimedia, freshness), E-E-A-T (expertise, authoritativeness, trustworthiness), readability (Flesch-Kincaid, sentence variety), engagement (CTAs, hooks, power words), and structure (heading hierarchy, paragraph flow). It gives you a single number that represents how well your content performs.',
      },
      {
        q: 'What is AEO (Answer Engine Optimisation)?',
        a: 'AEO measures how likely your content is to be cited by AI systems like ChatGPT, Perplexity, and Google AI Overviews. Kritano analyses your pages for extractable nuggets (definitions, FAQ answers, data tables), factual density, source authority signals, and structured data that AI systems rely on when selecting sources.',
      },
      {
        q: 'What is E-E-A-T analysis?',
        a: 'E-E-A-T stands for Experience, Expertise, Authoritativeness, and Trustworthiness. Kritano checks for author bios, credentials, citations, contact information, privacy policies, and other trust signals that search engines use to evaluate content quality. Pages are classified into tiers: ghost content, standard web, or expert verified.',
      },
      {
        q: 'Can I schedule recurring audits?',
        a: 'Yes. Paid plans can schedule audits to run automatically at intervals you choose (weekly, daily, or hourly depending on your plan). You receive email notifications when audits complete, so you can track improvements over time.',
      },
      {
        q: 'Do you support mobile auditing?',
        a: 'Yes. Starter plans and above include a mobile audit pass that re-visits crawled pages with a mobile viewport and user agent. This catches touch target issues, reflow problems, mobile-specific CLS, and responsive layout bugs that desktop-only audits miss.',
      },
      {
        q: 'Can I export my audit results?',
        a: 'Yes. Depending on your plan, you can export results as PDF (with your branding), CSV, or JSON. Every finding, score, and recommendation that appears in the dashboard is included in exports.',
      },
    ],
  },
  {
    title: 'Technical',
    faqs: [
      {
        q: 'Do I need to install anything on my website?',
        a: 'No. Kritano scans your website externally, just like a search engine crawler would. There is nothing to install, no JavaScript snippets, and no server-side changes required.',
      },
      {
        q: 'Will scanning affect my website performance?',
        a: 'Kritano uses rate-limited crawling with configurable profiles (conservative, moderate, aggressive). The default conservative profile adds negligible load. Verified domains can adjust the crawl speed to suit their server capacity.',
      },
      {
        q: 'What accessibility standards do you test against?',
        a: 'Kritano tests against WCAG 2.2 at levels A and AA using axe-core, the industry-standard accessibility testing engine. The EAA compliance report maps findings to EN 301 549 clauses for European Accessibility Act compliance.',
      },
      {
        q: 'What security checks are performed?',
        a: 'Security checks include HTTP security headers (HSTS, CSP, X-Frame-Options, Permissions-Policy), mixed content detection, exposed sensitive files, SSL/TLS configuration, open redirects, and information leakage. The checks follow OWASP best practices.',
      },
      {
        q: 'Do you have an API?',
        a: 'Yes. Kritano offers a REST API for programmatic access to audits, sites, and results. API documentation is available at kritano.com/docs. Rate limits depend on your plan tier.',
      },
      {
        q: 'How does domain verification work?',
        a: 'You can verify domain ownership via DNS TXT record or by placing a verification file at /.well-known/kritano-verify.txt. Verified domains unlock additional features like custom crawl settings and robots.txt override.',
      },
    ],
  },
  {
    title: 'Security and Privacy',
    faqs: [
      {
        q: 'Is my data secure?',
        a: 'Yes. All data is encrypted in transit (TLS 1.2+) and at rest. Authentication uses Argon2id password hashing (OWASP 2024 recommendations), JWT tokens with 4-hour expiry, and refresh token rotation with reuse detection. We follow security best practices throughout the stack.',
      },
      {
        q: 'Where is my data stored?',
        a: 'Audit data is stored in PostgreSQL databases. Data retention periods depend on your plan tier (30 days for Free, up to unlimited for Enterprise). You can request a full data export or account deletion at any time under GDPR.',
      },
      {
        q: 'Do you comply with GDPR?',
        a: 'Yes. Kritano provides full GDPR compliance including data export (right of access), account deletion (right to erasure), and transparent data processing. Cookie consent is managed with granular preferences.',
      },
      {
        q: 'Do you scan websites I do not own?',
        a: 'You can audit any publicly accessible website. However, advanced features like custom crawl settings, scheduled audits, and robots.txt override require domain verification to prove ownership.',
      },
    ],
  },
  {
    title: 'Billing and Plans',
    faqs: [
      {
        q: 'How does the free plan work?',
        a: 'The free plan lets you audit one website with up to 50 pages per scan and 5 audits per month. You get SEO, security, and content checks with 30-day data retention. No credit card required, no time limit.',
      },
      {
        q: 'Is there a free trial for paid plans?',
        a: 'Every paid plan includes a 14-day free trial with full access. No credit card required to start.',
      },
      {
        q: 'Do you offer annual billing?',
        a: 'Yes. Switch to annual billing and save 2 months. You pay for 10 months and get 12. Annual prices are shown on the pricing page.',
      },
      {
        q: 'Can I upgrade or downgrade at any time?',
        a: 'Yes. You can switch plans whenever you need to. If you upgrade mid-cycle, you are charged a prorated amount. Downgrades take effect at the end of your current billing period.',
      },
      {
        q: 'What happens to my data if I cancel?',
        a: 'Your data is retained for the period specified by your plan. After cancellation, your account is downgraded to the Free tier and data beyond the Free retention window is deleted after 30 days.',
      },
      {
        q: 'Do you offer refunds?',
        a: 'We offer a full refund within 14 days of your first payment if you are not satisfied. Contact us at info@kritano.com.',
      },
    ],
  },
];

const allFaqs = FAQ_CATEGORIES.flatMap(cat => cat.faqs);

export default function FaqPage() {
  return (
    <PublicLayout>
      <PageSeo
        title="Frequently Asked Questions"
        description="Find answers to common questions about Kritano's website auditing platform, including features, pricing, security, and technical details."
        path="/faq"
        keywords="website audit FAQ, SEO audit questions, accessibility testing FAQ, Kritano help"
        structuredData={[
          {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: allFaqs.map(faq => ({
              '@type': 'Question',
              name: faq.q,
              acceptedAnswer: {
                '@type': 'Answer',
                text: faq.a,
              },
            })),
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://kritano.com' },
              { '@type': 'ListItem', position: 2, name: 'FAQ', item: 'https://kritano.com/faq' },
            ],
          },
        ]}
      />

      <section className="max-w-7xl mx-auto px-6 lg:px-20 pt-20 lg:pt-28 pb-16">
        <div className="max-w-3xl">
          {/* Breadcrumb */}
          <nav className="mb-8 text-sm text-slate-500" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-indigo-600 transition-colors">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-slate-900 dark:text-white">FAQ</span>
          </nav>

          <h1 className="font-display text-4xl lg:text-5xl text-slate-900 dark:text-white mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-12 max-w-2xl">
            Everything you need to know about Kritano. Can't find what you're looking for?{' '}
            <Link to="/contact" className="text-indigo-600 hover:text-indigo-700 font-medium">Get in touch</Link>.
          </p>

          {/* Category sections */}
          <div className="space-y-12">
            {FAQ_CATEGORIES.map(category => (
              <div key={category.title}>
                <h2 className="font-display text-2xl text-slate-900 dark:text-white mb-5">
                  {category.title}
                </h2>
                <div className="space-y-3">
                  {category.faqs.map((faq, i) => (
                    <FaqItem key={i} question={faq.q} answer={faq.a} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-16 text-center p-8 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
            <h2 className="font-display text-xl text-slate-900 dark:text-white mb-2">
              Still have questions?
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm">
              We typically respond within one business day.
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="w-full flex items-center justify-between px-6 py-5 text-left"
      >
        <span className="font-semibold text-slate-900 dark:text-white text-sm pr-4">{question}</span>
        {open ? (
          <ChevronUp className="w-5 h-5 text-slate-500 dark:text-slate-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-500 dark:text-slate-400 flex-shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-6 pb-5">
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}
