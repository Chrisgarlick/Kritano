/**
 * Services Page
 *
 * Detailed breakdown of PagePulser's core audit services.
 */

import { Link } from 'react-router-dom';
import { PublicLayout } from '../../components/layout/PublicLayout';
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
} from 'lucide-react';

const SERVICES = [
  {
    id: 'seo',
    icon: <TrendingUp className="w-7 h-7" />,
    iconColor: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    title: 'SEO Auditing',
    subtitle: 'Get found. Get traffic.',
    description:
      'Our SEO engine analyses your pages against 100+ ranking factors, from metadata and structured data to Core Web Vitals and mobile-friendliness. Every finding includes clear fix guidance so your team can act immediately.',
    features: [
      'Title tag and meta description analysis',
      'Heading hierarchy and content structure',
      'Broken links and redirect chain detection',
      'Open Graph and Twitter Card validation',
      'Structured data (Schema.org) checks',
      'Sitemap and robots.txt validation',
      'Core Web Vitals integration',
      'Mobile-friendliness assessment',
    ],
  },
  {
    id: 'accessibility',
    icon: <Accessibility className="w-7 h-7" />,
    iconColor: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    title: 'Accessibility (WCAG 2.2)',
    subtitle: 'Inclusive by design.',
    description:
      'Ensure your website is usable by everyone, regardless of ability. PagePulser checks your pages against WCAG 2.2 Level AA criteria, helping you meet legal requirements and reach a wider audience.',
    features: [
      'Color contrast ratio validation',
      'Image alt text and ARIA label checks',
      'Keyboard navigation assessment',
      'Screen reader compatibility',
      'Form label and error handling',
      'Focus management and skip links',
      'Language attribute validation',
      'Semantic HTML structure analysis',
    ],
  },
  {
    id: 'security',
    icon: <Shield className="w-7 h-7" />,
    iconColor: 'text-red-600 bg-red-50 border-red-100',
    title: 'Security Scanning',
    subtitle: 'Protect your visitors.',
    description:
      'Identify security vulnerabilities before attackers do. Our scanner checks for exposed sensitive files, insecure resources, missing security headers, and common misconfigurations that put your users at risk.',
    features: [
      'HTTPS and SSL certificate validation',
      'Security header analysis (CSP, HSTS, etc.)',
      'Mixed content detection',
      'Exposed sensitive files (.env, backups)',
      'Cookie security flags',
      'Subresource integrity checks',
      'CORS configuration review',
      'Information disclosure detection',
    ],
  },
  {
    id: 'performance',
    icon: <Zap className="w-7 h-7" />,
    iconColor: 'text-amber-600 bg-amber-50 border-amber-100',
    title: 'Performance Analysis',
    subtitle: 'Speed wins.',
    description:
      "Page speed directly impacts user experience and search rankings. Our performance engine identifies exactly what's slowing your pages down, with prioritized recommendations for maximum impact.",
    features: [
      'Core Web Vitals (LCP, FID, CLS)',
      'Resource size and optimization analysis',
      'Image format and compression checks',
      'JavaScript and CSS optimization',
      'Caching header validation',
      'Render-blocking resource detection',
      'Font loading optimization',
      'Third-party script impact analysis',
    ],
  },
];

export default function Services() {
  return (
    <PublicLayout>
      <PageSeo
        title="Services"
        description="Comprehensive website auditing services: SEO, accessibility (WCAG 2.2), security scanning, and performance analysis."
        path="/services"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          itemListElement: SERVICES.map((s, i) => ({
            '@type': 'Service',
            position: i + 1,
            name: s.title,
            description: s.description,
          })),
        }}
      />

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 lg:px-20 pt-20 lg:pt-28 pb-16">
        <div className="max-w-3xl">
          <p className="text-indigo-600 font-semibold tracking-wide uppercase text-sm mb-6">
            Services
          </p>
          <h1 className="font-display text-5xl lg:text-6xl text-slate-900 leading-[1.05] mb-8">
            Four pillars of website health.
          </h1>
          <p className="text-xl text-slate-600 leading-relaxed">
            Every PagePulser audit covers SEO, accessibility, security, and performance.
            Each pillar is powered by a dedicated scanning engine with hundreds of
            rules maintained by domain experts.
          </p>
        </div>
      </section>

      {/* Services - zig-zag layout */}
      <div className="max-w-7xl mx-auto px-6 lg:px-20 pb-8">
        {SERVICES.map((service, index) => {
          const isEven = index % 2 === 0;
          return (
            <section
              key={service.id}
              className={`py-20 ${index < SERVICES.length - 1 ? 'border-b border-slate-200' : ''}`}
            >
              <div className={`grid lg:grid-cols-2 gap-16 items-start ${!isEven ? 'lg:direction-rtl' : ''}`}>
                {/* Info - appears first on even rows, second on odd rows */}
                <div className={!isEven ? 'lg:order-2' : ''}>
                  <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl border ${service.iconColor} mb-6`}>
                    {service.icon}
                  </div>
                  <h2 className="font-display text-3xl lg:text-4xl text-slate-900 leading-tight mb-3">
                    <Link to={`/services/${service.id}`} className="hover:text-indigo-600 transition-colors">
                      {service.title}
                    </Link>
                  </h2>
                  <p className="text-lg text-indigo-600 font-medium mb-6">{service.subtitle}</p>
                  <p className="text-lg text-slate-600 leading-relaxed mb-8">
                    {service.description}
                  </p>
                  <div className="flex items-center gap-4 flex-wrap">
                    <Link
                      to="/register"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors text-sm"
                    >
                      Try {service.title} Free
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                      to={`/services/${service.id}`}
                      aria-label={`Learn more about ${service.title}`}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
                    >
                      Learn more
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                {/* Features list - appears second on even rows, first on odd rows */}
                <div className={`bg-slate-50 border border-slate-200 rounded-xl p-8 ${!isEven ? 'lg:order-1' : ''}`}>
                  <h3 className="font-semibold text-slate-900 mb-6 text-sm uppercase tracking-wider">
                    What We Check
                  </h3>
                  <ul className="space-y-4">
                    {service.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                        <span className="text-slate-700 text-sm leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {/* Additional Features */}
      <section className="bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-20 py-24">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-indigo-600 font-semibold tracking-wide uppercase text-sm mb-4">
              Beyond Auditing
            </p>
            <h2 className="font-display text-4xl text-slate-900 leading-tight">
              Tools that support the whole journey
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <MiniFeature
              icon={<FileText className="w-5 h-5" />}
              title="PDF & CSV Reports"
              description="Export detailed reports for stakeholders, clients, or compliance audits."
            />
            <MiniFeature
              icon={<BarChart3 className="w-5 h-5" />}
              title="Trend Analytics"
              description="Track scores over time and compare audits to measure real progress."
            />
            <MiniFeature
              icon={<Search className="w-5 h-5" />}
              title="Multi-Page Crawling"
              description="Audit individual pages or crawl your entire site in one scan."
            />
            <MiniFeature
              icon={<Gauge className="w-5 h-5" />}
              title="Scheduled Audits"
              description="Set it and forget it. Run automated audits on your preferred schedule."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 lg:px-20 py-24">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="font-display text-4xl text-slate-900 leading-tight mb-6">
            See PagePulser in action
          </h2>
          <p className="text-lg text-slate-600 leading-relaxed mb-10">
            Run your first audit in under two minutes. No credit card, no commitment.
          </p>
          <Link
            to="/register"
            className="inline-flex px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors"
          >
            Start Free Analysis
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}

function MiniFeature({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 mb-4">
        {icon}
      </div>
      <h3 className="font-semibold text-slate-900 mb-2 text-sm">{title}</h3>
      <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
    </div>
  );
}
