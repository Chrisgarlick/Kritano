/**
 * Service Detail Page
 *
 * Deep-dive sub-page for each audit service (SEO, Accessibility, Security, Performance).
 * Reads the slug from URL params and looks up content from serviceData.ts.
 */

import { useParams, Navigate, Link } from 'react-router-dom';
import { PublicLayout } from '../../../components/layout/PublicLayout';
import PageSeo from '../../../components/seo/PageSeo';
import { getServiceBySlug, SERVICES_DATA } from './serviceData';
import type { CommonIssue } from './serviceData';
import {
  TrendingUp,
  Accessibility,
  Shield,
  Zap,
  CheckCircle,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';

const ICON_MAP = {
  TrendingUp,
  Accessibility,
  Shield,
  Zap,
} as const;

const SEVERITY_STYLES: Record<CommonIssue['severity'], { bg: string; text: string; border: string }> = {
  critical: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  serious: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  moderate: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  minor: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
};

export default function ServiceDetailPage() {
  const { serviceSlug } = useParams<{ serviceSlug: string }>();
  const service = serviceSlug ? getServiceBySlug(serviceSlug) : undefined;

  if (!service) {
    return <Navigate to="/services" replace />;
  }

  const Icon = ICON_MAP[service.iconName];

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.title,
    description: service.seo.description,
    provider: {
      '@type': 'Organization',
      name: 'PagePulser',
      url: 'https://pagepulser.com',
    },
    url: `https://pagepulser.com/services/${serviceSlug}`,
  };

  return (
    <PublicLayout>
      <PageSeo
        title={service.seo.title}
        description={service.seo.description}
        path={`/services/${serviceSlug}`}
        structuredData={structuredData}
      />

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 lg:px-20 pt-20 lg:pt-28 pb-16">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex items-center gap-2 text-sm text-slate-500">
            <li>
              <Link to="/services" className="hover:text-indigo-600 transition-colors">
                Services
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronRight className="w-4 h-4" />
            </li>
            <li className="text-slate-900 font-medium">{service.title}</li>
          </ol>
        </nav>

        <div className="max-w-3xl">
          <div
            className={`inline-flex items-center justify-center w-16 h-16 rounded-xl border ${service.colorScheme.bg} ${service.colorScheme.border} mb-6`}
          >
            <Icon className={`w-8 h-8 ${service.colorScheme.text}`} />
          </div>
          <h1 className="font-display text-5xl lg:text-6xl text-slate-900 leading-[1.05] mb-4">
            {service.title}
          </h1>
          <p className={`text-xl font-medium mb-6 ${service.colorScheme.text}`}>
            {service.subtitle}
          </p>
          <p className="text-lg text-slate-600 leading-relaxed">
            {service.heroDescription}
          </p>
        </div>
      </section>

      {/* Feature Breakdown */}
      <section className="bg-slate-50 border-t border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-20 py-24">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p
              className={`font-semibold tracking-wide uppercase text-sm mb-4 ${service.colorScheme.text}`}
            >
              What We Check
            </p>
            <h2 className="font-display text-4xl text-slate-900 leading-tight">
              Comprehensive feature breakdown
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {service.featureGroups.map((group) => (
              <div
                key={group.title}
                className="bg-white border border-slate-200 rounded-lg shadow-sm p-6"
              >
                <h3 className="font-semibold text-slate-900 mb-5 text-sm uppercase tracking-wider">
                  {group.title}
                </h3>
                <ul className="space-y-3">
                  {group.items.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <CheckCircle
                        className={`w-4 h-4 flex-shrink-0 mt-0.5 ${service.colorScheme.text}`}
                      />
                      <span className="text-slate-600 text-sm leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How We Audit */}
      <section className="max-w-7xl mx-auto px-6 lg:px-20 py-24">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p
            className={`font-semibold tracking-wide uppercase text-sm mb-4 ${service.colorScheme.text}`}
          >
            Methodology
          </p>
          <h2 className="font-display text-4xl text-slate-900 leading-tight">
            How we audit
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {service.methodology.map((step) => (
            <div key={step.step} className="relative">
              <div
                className={`inline-flex items-center justify-center w-10 h-10 rounded-full ${service.colorScheme.bg} ${service.colorScheme.text} font-semibold text-sm mb-4`}
              >
                {step.step}
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">{step.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Common Issues */}
      <section className="bg-slate-50 border-t border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-20 py-24">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p
              className={`font-semibold tracking-wide uppercase text-sm mb-4 ${service.colorScheme.text}`}
            >
              Common Findings
            </p>
            <h2 className="font-display text-4xl text-slate-900 leading-tight">
              Issues we commonly detect
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {service.commonIssues.map((issue) => {
              const style = SEVERITY_STYLES[issue.severity];
              return (
                <div
                  key={issue.title}
                  className="bg-white border border-slate-200 rounded-lg shadow-sm p-6"
                >
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded text-xs font-medium capitalize mb-3 ${style.bg} ${style.text} border ${style.border}`}
                  >
                    {issue.severity}
                  </span>
                  <h3 className="font-semibold text-slate-900 mb-2 text-sm">
                    {issue.title}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    {issue.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why It Matters */}
      <section className="max-w-7xl mx-auto px-6 lg:px-20 py-24">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="font-display text-4xl text-slate-900 leading-tight mb-4">
            {service.businessImpact.headline}
          </h2>
          <p className="text-lg text-slate-600 leading-relaxed">
            {service.businessImpact.description}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {service.businessImpact.stats.map((stat) => (
            <div
              key={stat.label}
              className="text-center bg-white border border-slate-200 rounded-lg shadow-sm p-8"
            >
              <p
                className={`font-display text-4xl lg:text-5xl mb-3 ${service.colorScheme.text}`}
              >
                {stat.value}
              </p>
              <p className="text-slate-500 text-sm leading-relaxed">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Related Services */}
      <section className="bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-20 py-24">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-indigo-600 font-semibold tracking-wide uppercase text-sm mb-4">
              Complete Coverage
            </p>
            <h2 className="font-display text-4xl text-slate-900 leading-tight">
              Explore other audit pillars
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {service.relatedSlugs.map((slug) => {
              const related = SERVICES_DATA[slug];
              if (!related) return null;
              const RelatedIcon = ICON_MAP[related.iconName];
              return (
                <Link
                  key={slug}
                  to={`/services/${slug}`}
                  className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 hover:shadow-md hover:-translate-y-0.5 transition-all group"
                >
                  <div
                    className={`inline-flex items-center justify-center w-12 h-12 rounded-xl border ${related.colorScheme.bg} ${related.colorScheme.border} mb-4`}
                  >
                    <RelatedIcon className={`w-6 h-6 ${related.colorScheme.text}`} />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">
                    {related.title}
                  </h3>
                  <p className="text-slate-500 text-sm mb-4">{related.subtitle}</p>
                  <span className="inline-flex items-center gap-1 text-indigo-600 text-sm font-medium">
                    Learn more
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 lg:px-20 py-24">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="font-display text-4xl text-slate-900 leading-tight mb-6">
            {service.cta.headline}
          </h2>
          <p className="text-lg text-slate-600 leading-relaxed mb-10">
            {service.cta.description}
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors"
          >
            {service.cta.buttonText}
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}
