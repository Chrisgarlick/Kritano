/**
 * Services Page
 *
 * Redesigned with:
 * - Category colour top borders on service cards
 * - Stat highlights per service (rules count, checks)
 * - Content Intelligence callout (differentiator)
 * - Visual variety between sections
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PublicLayout } from '../../components/layout/PublicLayout';
import AuthorBio from '../../components/blog/AuthorBio';
import { useSiteMode } from '../../contexts/SiteModeContext';
import PageSeo from '../../components/seo/PageSeo';
import {
  TrendingUp,
  Shield,
  Accessibility,
  Zap,
  ArrowRight,
  CheckCircle,
  FileText,
  BarChart3,
  Search,
  Gauge,
  BookOpen,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const SERVICES = [
  {
    id: 'seo',
    icon: <TrendingUp className="w-6 h-6" />,
    accentColor: 'border-t-violet-500',
    iconColor: 'text-violet-600 bg-violet-50',
    title: 'SEO Auditing',
    subtitle: 'Get found. Get traffic.',
    stat: '100+',
    statLabel: 'ranking factors',
    description:
      'Metadata, structured data, broken links, Core Web Vitals, and mobile-friendliness - with clear fix guidance for every issue.',
    features: [
      'Title tags & meta descriptions',
      'Heading hierarchy & structure',
      'Broken links & redirects',
      'Schema.org validation',
      'Sitemap & robots.txt',
      'Core Web Vitals',
    ],
  },
  {
    id: 'accessibility',
    icon: <Accessibility className="w-6 h-6" />,
    accentColor: 'border-t-emerald-500',
    iconColor: 'text-emerald-700 bg-emerald-50',
    title: 'Accessibility (WCAG 2.2)',
    subtitle: 'Inclusive by design.',
    stat: 'AA',
    statLabel: 'WCAG compliance',
    description:
      'Ensure your site is usable by everyone. Checks against WCAG 2.2 Level AA - colour contrast, keyboard nav, screen readers, ARIA, and more.',
    features: [
      'Colour contrast validation',
      'Alt text & ARIA labels',
      'Keyboard navigation',
      'Screen reader compatibility',
      'Form label & error handling',
      'Semantic HTML structure',
    ],
  },
  {
    id: 'security',
    icon: <Shield className="w-6 h-6" />,
    accentColor: 'border-t-red-500',
    iconColor: 'text-red-700 bg-red-50',
    title: 'Security Scanning',
    subtitle: 'Protect your visitors.',
    stat: '40+',
    statLabel: 'security checks',
    description:
      'Exposed files, missing headers, mixed content, cookie flags, and common misconfigurations that put your users at risk.',
    features: [
      'HTTPS & SSL validation',
      'Security headers (CSP, HSTS)',
      'Exposed .env & backups',
      'Mixed content detection',
      'Cookie security flags',
      'CORS configuration',
    ],
  },
  {
    id: 'performance',
    icon: <Zap className="w-6 h-6" />,
    accentColor: 'border-t-sky-500',
    iconColor: 'text-sky-700 bg-sky-50',
    title: 'Performance Analysis',
    subtitle: 'Speed wins.',
    stat: '3',
    statLabel: 'Core Web Vitals',
    description:
      'Page speed directly impacts rankings and conversions. We identify exactly what slows your pages down, prioritised by impact.',
    features: [
      'LCP, INP & CLS',
      'Image optimisation',
      'JS & CSS analysis',
      'Caching headers',
      'Render-blocking resources',
      'Third-party script impact',
    ],
  },
];

const SERVICE_FAQS = [
  { q: 'What does a website audit check?', a: 'Kritano audits six dimensions: SEO, accessibility (WCAG 2.2), security, performance, content quality, and structured data. Each dimension runs dozens of individual checks across every crawled page.' },
  { q: 'How long does an audit take?', a: 'Most audits complete within 2-5 minutes depending on the number of pages. Kritano crawls up to 1,000 pages per audit and runs all checks in parallel for speed.' },
  { q: 'Do I need to install anything on my website?', a: 'No. Kritano audits your site externally by crawling it like a search engine would. There is nothing to install, no code changes required, and no impact on your live site.' },
  { q: 'What accessibility standards do you test against?', a: 'Kritano tests against WCAG 2.2 Level AA, which is the standard required by the European Accessibility Act (EAA) and most accessibility legislation worldwide.' },
  { q: 'Can I export the audit results?', a: 'Yes. Audit results can be exported as PDF reports, CSV spreadsheets, or Markdown files. PDF reports include visual score breakdowns, issue details, and fix recommendations.' },
  { q: 'How is this different from free audit tools?', a: 'Free tools typically check a single page for basic SEO. Kritano crawls your entire site and checks six categories with 400+ rules, content quality scoring, and actionable fix code for every issue.' },
];

export default function Services() {
  const mode = useSiteMode();
  const ctaHref = mode === 'waitlist' ? '/waitlist' : mode === 'early_access' ? '/register?ea=email' : '/register';
  const ctaLabel = mode === 'waitlist' ? 'Join Waitlist' : mode === 'early_access' ? 'Join Early Access' : 'Try Free';

  return (
    <PublicLayout>
      <PageSeo
        title="Auditing Services - SEO, Accessibility & Security"
        description="Comprehensive website auditing services: SEO, accessibility (WCAG 2.2), security scanning, and performance analysis."
        path="/services"
        ogImage="/brand/og-services.png"
        structuredData={[
          {
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            itemListElement: SERVICES.map((s, i) => ({
              '@type': 'Service',
              position: i + 1,
              name: s.title,
              description: s.description,
              provider: { '@type': 'Organization', name: 'Kritano', url: 'https://kritano.com' },
            })),
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://kritano.com' },
              { '@type': 'ListItem', position: 2, name: 'Services', item: 'https://kritano.com/services' },
            ],
          },
          {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: SERVICE_FAQS.map(faq => ({
              '@type': 'Question',
              name: faq.q,
              acceptedAnswer: { '@type': 'Answer', text: faq.a },
            })),
          },
        ]}
      />

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 lg:px-20 pt-20 lg:pt-28 pb-16">
        <div className="max-w-3xl">
          <h1 className="font-display text-5xl lg:text-6xl text-slate-900 leading-[1.05] mb-4">
            Website Auditing Services
          </h1>
          <h2 className="font-display text-2xl lg:text-3xl text-slate-600 leading-snug mb-8">
            Six dimensions of website health.
          </h2>
          <p className="text-xl text-slate-600 leading-relaxed mb-6">
            A website audit is a systematic review of your site's technical health. It checks for problems that affect search rankings, user experience, and security. Kritano runs over 500 rules across six categories in a single scan.
          </p>
          <p className="text-lg text-slate-600 leading-relaxed">
            In our testing, we found that the average website has issues in every category. For example, research from <a href="https://webaim.org/projects/million/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-700 underline decoration-indigo-300 underline-offset-2 hover:decoration-indigo-600">WebAIM</a> shows that 95.9% of home pages have accessibility failures. Similarly, <a href="https://developer.mozilla.org/en-US/docs/Web/Security/Practical_implementation_guides" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-700 underline decoration-indigo-300 underline-offset-2 hover:decoration-indigo-600">MDN security guidelines</a> recommend headers that fewer than 30% of sites implement. Every finding in Kritano tells you exactly how to fix the problem.
          </p>
        </div>
      </section>

      {/* Service Cards - 2×2 grid with colour accents */}
      <section className="max-w-7xl mx-auto px-6 lg:px-20 pb-16">
        <div className="grid md:grid-cols-2 gap-6">
          {SERVICES.map((service) => (
            <div
              key={service.id}
              className={`bg-white border border-slate-200 border-t-[3px] ${service.accentColor} rounded-xl overflow-hidden hover:shadow-md transition-shadow`}
            >
              <div className="p-8">
                {/* Header */}
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-lg ${service.iconColor} flex items-center justify-center`}>
                      {service.icon}
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">
                        <Link to={`/services/${service.id}`} className="hover:text-indigo-600 transition-colors">
                          {service.title}
                        </Link>
                      </h2>
                      <p className="text-sm text-indigo-600 font-medium">{service.subtitle}</p>
                    </div>
                  </div>
                  {/* Stat highlight */}
                  <div className="text-right flex-shrink-0">
                    <p className="font-display text-2xl text-slate-900">{service.stat}</p>
                    <p className="text-[10px] text-slate-600 uppercase tracking-wider font-medium">{service.statLabel}</p>
                  </div>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed mb-6">
                  {service.description}
                </p>

                {/* Compact feature list - 2 columns */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-6">
                  {service.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                      <span className="text-xs text-slate-600">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4">
                  <Link
                    to={ctaHref}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors text-sm"
                  >
                    {ctaLabel}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    to={`/services/${service.id}`}
                    className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors flex items-center gap-1"
                  >
                    Learn more <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Content Intelligence Callout - Differentiator */}
      <section className="max-w-7xl mx-auto px-6 lg:px-20 pb-16">
        <div className="bg-gradient-to-r from-teal-50 to-indigo-50/30 border border-teal-200/60 rounded-2xl p-8 lg:p-10">
          <div className="flex flex-col lg:flex-row items-start gap-8">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
                <BookOpen className="w-6 h-6" />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-lg font-semibold text-slate-900">Content Intelligence</h2>
                <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-teal-100 text-teal-700 rounded-full">Only on Kritano</span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed mb-4 max-w-2xl">
                The only audit tool that scores your content the way search engines evaluate it.
                E-E-A-T analysis, Answer Engine Optimisation, readability scoring, and engagement
                markers - unified into a Content Quality Score across 400+ checks.
              </p>
              <Link to={ctaHref} className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:text-teal-900 transition-colors">
                {mode === 'live' ? 'Try Content Intelligence free' : ctaLabel} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Beyond Auditing */}
      <section className="bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-20 py-20">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-indigo-600 font-semibold tracking-wide uppercase text-sm mb-4">
              Beyond Auditing
            </p>
            <h2 className="font-display text-4xl text-slate-900 leading-tight">
              Tools that support the whole journey
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <FileText className="w-5 h-5" />, title: 'PDF & CSV Reports', description: 'Branded exports for clients, stakeholders, and compliance.' },
              { icon: <BarChart3 className="w-5 h-5" />, title: 'Trend Analytics', description: 'Track scores over time. Compare audits. Measure real progress.' },
              { icon: <Search className="w-5 h-5" />, title: 'Multi-Page Crawling', description: 'Audit one page or crawl your entire site in one scan.' },
              { icon: <Gauge className="w-5 h-5" />, title: 'Scheduled Audits', description: 'Automated monitoring on your preferred schedule.' },
            ].map((item) => (
              <div key={item.title} className="bg-white border border-slate-200 rounded-xl p-5 text-center hover:shadow-sm transition-shadow">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 mb-3">
                  {item.icon}
                </div>
                <h3 className="font-semibold text-slate-900 mb-1.5 text-sm">{item.title}</h3>
                <p className="text-slate-600 text-xs leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-7xl mx-auto px-6 lg:px-20 py-24">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="font-display text-3xl text-slate-900 mb-3">Frequently Asked Questions</h2>
          <p className="text-slate-600">Common questions about our auditing services.</p>
        </div>
        <div className="max-w-3xl mx-auto space-y-3">
          {SERVICE_FAQS.map((faq) => (
            <ServiceFaqItem key={faq.q} question={faq.q} answer={faq.a} />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 lg:px-20 py-24">
        <div className="bg-indigo-600 rounded-2xl p-10 md:p-14 relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:32px_32px]" />
          <div className="relative text-center max-w-xl mx-auto">
            <h2 className="font-display text-3xl lg:text-4xl text-white leading-tight mb-5">
              See Kritano in action
            </h2>
            <p className="text-indigo-200 leading-relaxed mb-8">
              Run your first audit in under two minutes. No credit card, no commitment.
            </p>
            <Link
              to={ctaHref}
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-indigo-700 rounded-lg font-semibold hover:bg-indigo-50 transition-colors"
            >
              {mode === 'waitlist' ? 'Join the Waitlist' : mode === 'early_access' ? 'Join Early Access' : 'Start Free Audit'}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Author */}
      <section className="max-w-7xl mx-auto px-6 lg:px-20 py-12">
        <div className="max-w-3xl mx-auto">
          <AuthorBio />
        </div>
      </section>
    </PublicLayout>
  );
}

function ServiceFaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors"
      >
        <span className="font-semibold text-slate-900 text-sm pr-4">{question}</span>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
      </button>
      {open && (
        <div className="px-5 pb-4">
          <p className="text-sm text-slate-600 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}
