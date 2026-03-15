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
  price: string;
  priceDetail: string;
  description: string;
  popular?: boolean;
  cta: string;
  ctaLink: string;
  highlights: string[];
}

const PLANS: Plan[] = [
  {
    name: 'Free',
    price: '$0',
    priceDetail: 'forever',
    description: 'For personal projects.',
    cta: 'Get Started',
    ctaLink: '/register',
    highlights: [
      '1 site',
      '50 pages per audit',
      '5 audits/month',
      'SEO & Content checks',
      '30-day retention',
    ],
  },
  {
    name: 'Starter',
    price: '$19',
    priceDetail: '/month',
    description: 'For freelancers & small teams.',
    cta: 'Start Free Trial',
    ctaLink: '/register?trial=starter',
    highlights: [
      '3 sites',
      '250 pages per audit',
      '10 audits/month',
      '+ Accessibility, Security & Perf',
      'Weekly scheduling',
      'PDF exports',
    ],
  },
  {
    name: 'Pro',
    price: '$49',
    priceDetail: '/month',
    description: 'For growing businesses.',
    popular: true,
    cta: 'Start Free Trial',
    ctaLink: '/register?trial=pro',
    highlights: [
      '10 sites',
      '1,000 pages per audit',
      'Unlimited audits',
      '+ E-E-A-T, AEO & Google Dorking',
      'Daily scheduling',
      'PDF, CSV & JSON exports',
      '5 seats',
    ],
  },
  {
    name: 'Agency',
    price: '$99',
    priceDetail: '/month',
    description: 'For agencies & consultants.',
    cta: 'Start Free Trial',
    ctaLink: '/register?trial=agency',
    highlights: [
      '50 sites',
      '5,000 pages per audit',
      'Unlimited audits',
      '+ Structured Data checks',
      'Hourly scheduling',
      'Full white-label exports',
      'Unlimited seats',
    ],
  },
  {
    name: 'Enterprise',
    price: '$199',
    priceDetail: '/month',
    description: 'For large organizations.',
    cta: 'Start Free Trial',
    ctaLink: '/register',
    highlights: [
      'Unlimited sites',
      '10,000 pages per audit',
      'Unlimited audits',
      'All checks included',
      '15-min scheduling',
      'Unlimited data retention',
      'Unlimited API requests',
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
    title: 'Exports',
    rows: [
      { label: 'PDF export', free: false, starter: true, pro: true, agency: true, enterprise: true },
      { label: 'PDF branding', free: '\u2014', starter: 'Site colors', pro: 'Site colors', agency: 'White-label', enterprise: 'White-label' },
      { label: 'CSV export', free: false, starter: false, pro: true, agency: true, enterprise: true },
      { label: 'JSON export', free: false, starter: false, pro: true, agency: true, enterprise: true },
      { label: 'White-label', free: false, starter: false, pro: false, agency: true, enterprise: true },
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
    a: 'The free plan lets you audit one website with up to 50 pages per scan and 5 audits per month. You get SEO and content checks with 30-day data retention. No credit card required, no time limit.',
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
    q: 'What kind of support do you offer?',
    a: 'Free and Starter users get community support. Pro users get priority email support. Agency and Enterprise customers get dedicated account management.',
  },
];

export default function Pricing() {
  const [comparisonOpen, setComparisonOpen] = useState(false);

  return (
    <PublicLayout>
      <PageSeo
        title="Pricing"
        description="Simple, transparent pricing for website auditing. Start free, upgrade as you grow. Plans from $0 to $99/month."
        path="/pricing"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: 'PagePulser',
          description: 'Website auditing platform for SEO, accessibility, security, and performance.',
          offers: PLANS.filter(p => p.price !== 'Free').map(p => ({
            '@type': 'Offer',
            name: p.name,
            price: p.price.replace('$', ''),
            priceCurrency: 'USD',
          })),
        }}
      />

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 lg:px-20 pt-20 lg:pt-28 pb-16 text-center">
        <p className="text-indigo-600 font-medium tracking-wide uppercase text-xs mb-5">
          Pricing
        </p>
        <h1 className="font-display text-5xl lg:text-6xl text-slate-900 leading-[1.05] mb-6">
          Simple, transparent pricing.
        </h1>
        <p className="text-lg text-slate-500 leading-relaxed max-w-2xl mx-auto">
          Start free and upgrade as your needs grow. Every paid plan includes a 14-day
          free trial. No credit card required.
        </p>
      </section>

      {/* All 5 Plans in one row */}
      <section className="max-w-7xl mx-auto px-6 lg:px-20 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-xl p-5 flex flex-col ${
                plan.popular
                  ? 'bg-slate-900 text-white ring-2 ring-indigo-600 relative'
                  : 'bg-white border border-slate-200'
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-indigo-600 text-white text-[10px] font-semibold rounded-full uppercase tracking-wider whitespace-nowrap">
                  Most Popular
                </span>
              )}

              {/* Plan name & description */}
              <div className="mb-4">
                <h3 className={`text-base font-semibold mb-1 ${plan.popular ? 'text-white' : 'text-slate-900'}`}>
                  {plan.name}
                </h3>
                <p className={`text-xs leading-relaxed ${plan.popular ? 'text-slate-500' : 'text-slate-500'}`}>
                  {plan.description}
                </p>
              </div>

              {/* Price */}
              <div className="mb-5">
                <span className={`font-display text-3xl ${plan.popular ? 'text-white' : 'text-slate-900'}`}>
                  {plan.price}
                </span>
                {plan.priceDetail && (
                  <span className={`text-xs ml-0.5 ${plan.popular ? 'text-slate-500' : 'text-slate-500'}`}>
                    {plan.priceDetail}
                  </span>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-2.5 mb-6 flex-grow">
                {plan.highlights.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <CheckCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                      plan.popular ? 'text-indigo-400' : 'text-indigo-600'
                    }`} />
                    <span className={`text-xs leading-relaxed ${plan.popular ? 'text-slate-300' : 'text-slate-600'}`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                to={plan.ctaLink}
                className={`block text-center px-4 py-2.5 rounded-lg font-medium text-sm transition-colors ${
                  plan.popular
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-20 py-16">
          <button
            onClick={() => setComparisonOpen(!comparisonOpen)}
            aria-expanded={comparisonOpen}
            className="w-full flex items-center justify-center gap-2 text-slate-700 font-medium text-sm mb-8"
          >
            {comparisonOpen ? 'Hide' : 'Show'} full feature comparison
            {comparisonOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {comparisonOpen && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-slate-200">
                    <th scope="col" className="text-left py-3 pr-4 text-slate-500 font-medium w-44">&nbsp;</th>
                    <th scope="col" className="text-center py-3 px-2 text-slate-900 font-semibold text-xs">Free</th>
                    <th scope="col" className="text-center py-3 px-2 text-slate-900 font-semibold text-xs">Starter</th>
                    <th scope="col" className="text-center py-3 px-2 text-slate-900 font-semibold text-xs bg-indigo-50 rounded-t-lg">Pro</th>
                    <th scope="col" className="text-center py-3 px-2 text-slate-900 font-semibold text-xs">Agency</th>
                    <th scope="col" className="text-center py-3 px-2 text-slate-900 font-semibold text-xs">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_SECTIONS.map((section) => (
                    <>
                      <tr key={section.title}>
                        <td colSpan={6} className="pt-6 pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          {section.title}
                        </td>
                      </tr>
                      {section.rows.map((row) => (
                        <tr key={row.label} className="border-b border-slate-100">
                          <td className="py-3 pr-4 text-slate-700 text-xs">{row.label}</td>
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
      <section className="border-t border-slate-200">
        <div className="max-w-3xl mx-auto px-6 lg:px-20 py-24">
          <div className="text-center mb-16">
            <p className="text-indigo-600 font-medium tracking-wide uppercase text-xs mb-4">
              FAQ
            </p>
            <h2 className="font-display text-4xl text-slate-900 leading-tight">
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
          <h2 className="font-display text-4xl text-slate-900 leading-tight mb-6">
            Start for free, no strings attached
          </h2>
          <p className="text-lg text-slate-500 leading-relaxed mb-10">
            Your first audit is on us. See the value before you commit.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
          >
            Get Started Free
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}

function ComparisonCell({ value, highlight }: { value: boolean | string; highlight?: boolean }) {
  const bg = highlight ? 'bg-indigo-50' : '';
  if (typeof value === 'boolean') {
    return (
      <td className={`text-center py-3 px-2 ${bg}`}>
        {value ? (
          <>
            <CheckCircle className="w-4 h-4 text-indigo-600 mx-auto" aria-hidden="true" />
            <span className="sr-only">Included</span>
          </>
        ) : (
          <>
            <X className="w-4 h-4 text-slate-300 mx-auto" aria-hidden="true" />
            <span className="sr-only">Not included</span>
          </>
        )}
      </td>
    );
  }
  return (
    <td className={`text-center py-3 px-2 text-slate-700 text-xs ${bg}`}>
      {value}
    </td>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-slate-200 rounded-lg bg-white">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="w-full flex items-center justify-between px-6 py-5 text-left"
      >
        <span className="font-semibold text-slate-900 text-sm pr-4">{question}</span>
        {open ? (
          <ChevronUp className="w-5 h-5 text-slate-500 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-500 flex-shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-6 pb-5">
          <p className="text-sm text-slate-600 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}
