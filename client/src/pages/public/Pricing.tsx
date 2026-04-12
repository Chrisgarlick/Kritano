/**
 * Pricing Page
 *
 * All 5 tiers (Free, Starter, Pro, Agency, Enterprise) in a single row.
 * Prices match the in-app Profile.tsx pricing.
 * Includes full feature comparison table and FAQ.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PublicLayout } from '../../components/layout/PublicLayout';
import PageSeo from '../../components/seo/PageSeo';
import { CheckCircle, X, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';

interface Plan {
  name: string;
  monthlyPrice: string;
  annualPrice: string;
  priceDetail: string;
  description: string;
  popular?: boolean;
  cta: string;
  ctaLink: string;
  accentColor: string;
  pageCount: string;
  highlights: string[];
}

const PLANS: Plan[] = [
  {
    name: 'Free',
    monthlyPrice: '$0',
    annualPrice: '$0',
    priceDetail: 'forever',
    description: 'For personal projects.',
    cta: 'Get Started',
    ctaLink: '/register',
    accentColor: 'border-t-slate-400',
    pageCount: '50',
    highlights: [
      '1 site &middot; 5 audits/month',
      'SEO, Security & Content checks',
      '30-day data retention',
    ],
  },
  {
    name: 'Starter',
    monthlyPrice: '$19',
    annualPrice: '$190',
    priceDetail: '/month',
    description: 'For freelancers & small teams.',
    cta: 'Start Free Trial',
    ctaLink: '/register?trial=starter',
    accentColor: 'border-t-indigo-500',
    pageCount: '250',
    highlights: [
      '3 sites &middot; 10 audits/month',
      '+ Accessibility & Performance',
      'Weekly scheduling &middot; PDF exports',
    ],
  },
  {
    name: 'Pro',
    monthlyPrice: '$49',
    annualPrice: '$490',
    priceDetail: '/month',
    description: 'For growing businesses.',
    popular: true,
    cta: 'Start Free Trial',
    ctaLink: '/register?trial=pro',
    accentColor: 'border-t-violet-500',
    pageCount: '1,000',
    highlights: [
      '10 sites &middot; Unlimited audits',
      '+ E-E-A-T, AEO & Google Dorking',
      'Daily scheduling &middot; 5 seats',
    ],
  },
  {
    name: 'Agency',
    monthlyPrice: '$99',
    annualPrice: '$990',
    priceDetail: '/month',
    description: 'For agencies & consultants.',
    cta: 'Start Free Trial',
    ctaLink: '/register?trial=agency',
    accentColor: 'border-t-amber-500',
    pageCount: '5,000',
    highlights: [
      '50 sites &middot; Unlimited audits',
      'Full white-label exports',
      'Hourly scheduling &middot; Unlimited seats',
    ],
  },
  {
    name: 'Enterprise',
    monthlyPrice: 'Custom',
    annualPrice: 'Custom',
    priceDetail: '',
    description: 'For large organisations.',
    cta: 'Contact Sales',
    ctaLink: '/contact',
    accentColor: 'border-t-emerald-500',
    pageCount: '10,000',
    highlights: [
      'Unlimited sites &middot; All checks',
      '15-min scheduling &middot; Unlimited API',
      'Unlimited data retention',
    ],
  },
];

const COMPARISON_SECTIONS = [
  {
    title: 'Audit & Crawl',
    rows: [
      { label: 'Max pages per audit', free: '50', starter: '250', pro: '1,000', agency: '5,000', enterprise: '10,000' },
      { label: 'Max crawl depth', free: '3', starter: '5', pro: '10', agency: '10', enterprise: '10' },
      { label: 'Audits per month', free: '5', starter: '10', pro: 'Unlimited', agency: 'Unlimited', enterprise: 'Unlimited' },
      { label: 'Concurrent audits', free: '1', starter: '3', pro: '10', agency: '50', enterprise: '100' },
    ],
  },
  {
    title: 'Available Checks',
    rows: [
      { label: 'SEO', free: true, starter: true, pro: true, agency: true, enterprise: true },
      { label: 'Security', free: true, starter: true, pro: true, agency: true, enterprise: true },
      { label: 'Content', free: true, starter: true, pro: true, agency: true, enterprise: true },
      { label: 'Accessibility', free: false, starter: true, pro: true, agency: true, enterprise: true },
      { label: 'Performance', free: false, starter: true, pro: true, agency: true, enterprise: true },
      { label: 'File Extraction', free: false, starter: true, pro: true, agency: true, enterprise: true },
      { label: 'Structured Data', free: false, starter: false, pro: false, agency: true, enterprise: true },
      { label: 'Google Dorking', free: false, starter: false, pro: true, agency: true, enterprise: true },
      { label: 'E-E-A-T Analysis', free: false, starter: false, pro: true, agency: true, enterprise: true },
      { label: 'AEO Analysis', free: false, starter: false, pro: true, agency: true, enterprise: true },
      { label: 'Mobile Audit Pass', free: false, starter: true, pro: true, agency: true, enterprise: true },
    ],
  },
  {
    title: 'Sites & Sharing',
    rows: [
      { label: 'Max sites', free: '1', starter: '3', pro: '10', agency: '50', enterprise: 'Unlimited' },
      { label: 'Members per site', free: '0', starter: '1', pro: '3', agency: '10', enterprise: 'Unlimited' },
      { label: 'Domain locking', free: true, starter: false, pro: false, agency: false, enterprise: false },
    ],
  },
  {
    title: 'Scheduling',
    rows: [
      { label: 'Scheduled audits', free: false, starter: true, pro: true, agency: true, enterprise: true },
      { label: 'Min schedule interval', free: '\u2014', starter: '7 days', pro: '1 day', agency: '1 hour', enterprise: '15 min' },
    ],
  },
  {
    title: 'Exports & Sharing',
    rows: [
      { label: 'PDF export', free: false, starter: true, pro: true, agency: true, enterprise: true },
      { label: 'PDF branding', free: '\u2014', starter: 'Site colors', pro: 'Site colors', agency: 'White-label', enterprise: 'White-label' },
      { label: 'CSV export', free: false, starter: false, pro: true, agency: true, enterprise: true },
      { label: 'JSON export', free: false, starter: false, pro: true, agency: true, enterprise: true },
      { label: 'White-label', free: false, starter: false, pro: false, agency: true, enterprise: true },
      { label: 'Shareable report links', free: false, starter: false, pro: true, agency: true, enterprise: true },
      { label: 'Accessibility statement', free: false, starter: false, pro: true, agency: true, enterprise: true },
      { label: 'Public audit badge', free: false, starter: true, pro: true, agency: true, enterprise: true },
      { label: 'Fix snippets (code)', free: false, starter: true, pro: true, agency: true, enterprise: true },
      { label: 'Fix explanations', free: true, starter: true, pro: true, agency: true, enterprise: true },
    ],
  },
  {
    title: 'Content Intelligence',
    rows: [
      { label: 'Content Quality Score', free: 'Score only', starter: 'Breakdown', pro: 'Full detail', agency: 'Full detail', enterprise: 'Full detail' },
      { label: 'E-E-A-T analysis', free: false, starter: false, pro: true, agency: true, enterprise: true },
      { label: 'AEO analysis', free: false, starter: false, pro: true, agency: true, enterprise: true },
    ],
  },
  {
    title: 'Compliance',
    rows: [
      { label: 'EAA compliance status', free: true, starter: true, pro: true, agency: true, enterprise: true },
      { label: 'Full compliance report', free: false, starter: false, pro: true, agency: true, enterprise: true },
      { label: 'Compliance PDF export', free: false, starter: false, pro: true, agency: true, enterprise: true },
    ],
  },
  {
    title: 'API & Data',
    rows: [
      { label: 'API requests/day', free: '100', starter: '1,000', pro: '10,000', agency: '100,000', enterprise: 'Unlimited' },
      { label: 'API requests/min', free: '10', starter: '60', pro: '300', agency: '1,000', enterprise: '2,000' },
      { label: 'Data retention', free: '30 days', starter: '90 days', pro: '1 year', agency: '2 years', enterprise: 'Unlimited' },
    ],
  },
  {
    title: 'Teams',
    rows: [
      { label: 'Max seats', free: '1', starter: '1', pro: '5', agency: 'Unlimited', enterprise: 'Unlimited' },
    ],
  },
];

const FAQS = [
  {
    q: 'How does the free plan work?',
    a: 'The free plan lets you audit one website with up to 50 pages per scan and 5 audits per month. You get SEO, security, and content checks with 30-day data retention. No credit card required, no time limit.',
  },
  {
    q: 'Can I upgrade or downgrade at any time?',
    a: "Yes. You can switch plans whenever you need to. If you upgrade mid-cycle, you'll be charged a prorated amount. Downgrades take effect at the end of your current billing period.",
  },
  {
    q: 'What counts as a "page" in an audit?',
    a: 'Each unique URL that our scanner crawls counts as one page. The homepage, blog posts, product pages, and other distinct URLs are each counted separately.',
  },
  {
    q: 'What is domain locking on the Free tier?',
    a: 'Free tier users can only have one site, and the domain can only be changed once per month. This prevents abuse while still letting you try the platform.',
  },
  {
    q: 'Is there a free trial for paid plans?',
    a: 'Every paid plan includes a 14-day free trial with full access. No credit card required to start.',
  },
  {
    q: 'Do you offer annual billing?',
    a: 'Yes! Switch to annual billing and save 2 months - you pay for 10 months and get 12. Use the toggle at the top of the pricing cards to see annual prices.',
  },
  {
    q: 'What kind of support do you offer?',
    a: 'Free and Starter users get community support. Pro users get priority email support. Agency and Enterprise customers get dedicated account management.',
  },
  {
    q: 'What happens to my data if I cancel?',
    a: 'Your data is retained for the period specified in your plan (30 days for Free, 90 days for Starter, etc.). After cancellation, your account is downgraded to the Free tier and data beyond the Free retention window is deleted after 30 days.',
  },
  {
    q: 'Do you offer refunds?',
    a: 'We offer a full refund within 14 days of your first payment if you are not satisfied. Contact us at info@kritano.com.',
  },
];

export default function Pricing() {
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');

  return (
    <PublicLayout>
      <PageSeo
        title="Pricing"
        description="Simple, transparent pricing for website auditing. Start free, upgrade as you grow. Plans starting free."
        path="/pricing"
        structuredData={[
          {
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: 'Kritano',
            description: 'Website auditing platform for SEO, accessibility, security, and performance.',
            offers: PLANS.filter(p => p.name !== 'Free' && p.name !== 'Enterprise').map(p => ({
              '@type': 'Offer',
              name: p.name,
              price: p.monthlyPrice.replace('$', ''),
              priceCurrency: 'USD',
              priceValidUntil: '2026-12-31',
              availability: 'https://schema.org/InStock',
            })),
          },
          {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: FAQS.map(faq => ({
              '@type': 'Question',
              name: faq.q,
              acceptedAnswer: { '@type': 'Answer', text: faq.a },
            })),
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://kritano.com' },
              { '@type': 'ListItem', position: 2, name: 'Pricing', item: 'https://kritano.com/pricing' },
            ],
          },
        ]}
      />

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 lg:px-20 pt-20 lg:pt-28 pb-16 text-center">
        <h1 className="font-display text-5xl lg:text-6xl text-slate-900 dark:text-white leading-[1.05] mb-4">
          Pricing
        </h1>
        <h2 className="font-display text-2xl lg:text-3xl text-slate-500 dark:text-slate-400 leading-snug mb-6">
          Simple, transparent pricing.
        </h2>
        <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto mb-10">
          Start free and upgrade as your needs grow. Every paid plan includes a 14-day
          free trial. No credit card required.
        </p>

        {/* Billing Period Toggle */}
        <div className="flex items-center justify-center gap-3">
          <span className={`text-sm font-medium ${billingPeriod === 'monthly' ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
            Monthly
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={billingPeriod === 'annual'}
            aria-label="Toggle annual billing"
            onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'annual' : 'monthly')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              billingPeriod === 'annual' ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                billingPeriod === 'annual' ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className={`text-sm font-medium ${billingPeriod === 'annual' ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
            Annual
          </span>
          <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
            Save 2 months
          </span>
        </div>
      </section>

      {/* All 5 Plans in one row */}
      <section className="max-w-7xl mx-auto px-6 lg:px-20 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-xl flex flex-col border-t-[3px] ${plan.accentColor} ${
                plan.popular
                  ? 'bg-slate-900 dark:bg-slate-950 text-white ring-2 ring-indigo-600 relative'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <div className="p-5 flex flex-col flex-grow">
                {plan.popular && (
                  <span className="absolute -top-5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-indigo-600 text-white text-[10px] font-semibold rounded-full uppercase tracking-wider whitespace-nowrap">
                    Most Popular
                  </span>
                )}

                {/* Plan name & description */}
                <div className="mb-3">
                  <h3 className={`text-base font-semibold mb-1 ${plan.popular ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                    {plan.name}
                  </h3>
                  <p className={`text-xs leading-relaxed ${plan.popular ? 'text-slate-500' : 'text-slate-500 dark:text-slate-400'}`}>
                    {plan.description}
                  </p>
                </div>

                {/* Price */}
                <div className="mb-4">
                  <span className={`font-display text-3xl ${plan.popular ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                    {billingPeriod === 'annual' ? plan.annualPrice : plan.monthlyPrice}
                  </span>
                  {plan.priceDetail && (
                    <span className={`text-xs ml-0.5 ${plan.popular ? 'text-slate-500' : 'text-slate-500 dark:text-slate-400'}`}>
                      {billingPeriod === 'annual' && plan.monthlyPrice !== '$0' && plan.monthlyPrice !== 'Custom'
                        ? '/year'
                        : plan.priceDetail}
                    </span>
                  )}
                </div>

                {/* Hero metric: pages per audit */}
                <div className={`mb-4 pb-4 border-b ${plan.popular ? 'border-slate-700' : 'border-slate-100 dark:border-slate-700'}`}>
                  <span className={`font-display text-2xl ${plan.popular ? 'text-indigo-400' : 'text-indigo-600'}`}>
                    {plan.pageCount}
                  </span>
                  <span className={`text-xs ml-1 ${plan.popular ? 'text-slate-500' : 'text-slate-500 dark:text-slate-400'}`}>
                    pages / audit
                  </span>
                </div>

                {/* Features - trimmed to 3 key items */}
                <ul className="space-y-2.5 mb-5 flex-grow">
                  {plan.highlights.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <CheckCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                        plan.popular ? 'text-indigo-400' : 'text-indigo-600'
                      }`} />
                      <span
                        className={`text-xs leading-relaxed ${plan.popular ? 'text-slate-300' : 'text-slate-600 dark:text-slate-400'}`}
                        dangerouslySetInnerHTML={{ __html: feature }}
                      />
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link
                  to={plan.ctaLink}
                  className={`block text-center px-4 py-2.5 rounded-lg font-medium text-sm transition-colors ${
                    plan.popular
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                      : 'border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-6 lg:px-20 py-16">
          <button
            onClick={() => setComparisonOpen(!comparisonOpen)}
            aria-expanded={comparisonOpen}
            className="w-full flex items-center justify-center gap-2 text-slate-700 dark:text-slate-300 font-medium text-sm mb-8"
          >
            {comparisonOpen ? 'Hide' : 'Show'} full feature comparison
            {comparisonOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {comparisonOpen && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-slate-200 dark:border-slate-700">
                    <th scope="col" className="text-left py-3 pr-4 text-slate-500 dark:text-slate-400 font-medium w-44">&nbsp;</th>
                    <th scope="col" className="text-center py-3 px-2 text-slate-900 dark:text-white font-semibold text-xs">Free</th>
                    <th scope="col" className="text-center py-3 px-2 text-slate-900 dark:text-white font-semibold text-xs">Starter</th>
                    <th scope="col" className="text-center py-3 px-2 text-slate-900 dark:text-white font-semibold text-xs bg-indigo-50 dark:bg-indigo-900/20 rounded-t-lg">Pro</th>
                    <th scope="col" className="text-center py-3 px-2 text-slate-900 dark:text-white font-semibold text-xs">Agency</th>
                    <th scope="col" className="text-center py-3 px-2 text-slate-900 dark:text-white font-semibold text-xs">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_SECTIONS.map((section) => (
                    <>
                      <tr key={section.title}>
                        <td colSpan={6} className="pt-6 pb-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          {section.title}
                        </td>
                      </tr>
                      {section.rows.map((row) => (
                        <tr key={row.label} className="border-b border-slate-100 dark:border-slate-700/50">
                          <td className="py-3 pr-4 text-slate-700 dark:text-slate-300 text-xs">{row.label}</td>
                          <ComparisonCell value={row.free} />
                          <ComparisonCell value={row.starter} />
                          <ComparisonCell value={row.pro} highlight />
                          <ComparisonCell value={row.agency} />
                          <ComparisonCell value={row.enterprise} />
                        </tr>
                      ))}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-slate-200 dark:border-slate-700">
        <div className="max-w-3xl mx-auto px-6 lg:px-20 py-24">
          <div className="text-center mb-16">
            <p className="text-indigo-600 dark:text-indigo-400 font-medium tracking-wide uppercase text-xs mb-4">
              FAQ
            </p>
            <h2 className="font-display text-4xl text-slate-900 dark:text-white leading-tight">
              Common questions
            </h2>
          </div>

          <div className="space-y-2">
            {FAQS.map((faq, index) => (
              <FAQItem key={index} question={faq.q} answer={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 lg:px-20 py-24">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="font-display text-4xl text-slate-900 dark:text-white leading-tight mb-6">
            Start for free, no strings attached
          </h2>
          <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed mb-10">
            Your first audit is on us. See the value before you commit.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
          >
            Start Free Audit
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}

function ComparisonCell({ value, highlight }: { value: boolean | string; highlight?: boolean }) {
  const bg = highlight ? 'bg-indigo-50 dark:bg-indigo-900/20' : '';
  if (typeof value === 'boolean') {
    return (
      <td className={`text-center py-3 px-2 ${bg}`}>
        {value ? (
          <>
            <CheckCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mx-auto" aria-hidden="true" />
            <span className="sr-only">Included</span>
          </>
        ) : (
          <>
            <X className="w-4 h-4 text-slate-300 dark:text-slate-600 mx-auto" aria-hidden="true" />
            <span className="sr-only">Not included</span>
          </>
        )}
      </td>
    );
  }
  return (
    <td className={`text-center py-3 px-2 text-slate-700 dark:text-slate-300 text-xs ${bg}`}>
      {value}
    </td>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
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
