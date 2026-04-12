/**
 * Service Detail Page
 *
 * Redesigned with:
 * - Coloured accent bar on hero
 * - Methodology stepper with connectors
 * - Common issues as a compact severity-sorted list (not identical cards)
 * - Business impact stats with category colour
 * - Varied section backgrounds
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
  AlertTriangle,
  XCircle,
  Info,
} from 'lucide-react';

const ICON_MAP = {
  TrendingUp,
  Accessibility,
  Shield,
  Zap,
} as const;

const SEVERITY_CONFIG: Record<CommonIssue['severity'], { icon: typeof XCircle; color: string; bg: string; text: string }> = {
  critical: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', text: 'text-red-700' },
  serious: { icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-50', text: 'text-orange-700' },
  moderate: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50', text: 'text-amber-700' },
  minor: { icon: Info, color: 'text-sky-500', bg: 'bg-sky-50', text: 'text-sky-700' },
};

export default function ServiceDetailPage() {
  const { serviceSlug } = useParams<{ serviceSlug: string }>();
  const service = serviceSlug ? getServiceBySlug(serviceSlug) : undefined;

  if (!service) {
    return <Navigate to="/services" replace />;
  }

  const Icon = ICON_MAP[service.iconName];

  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: service.title,
      description: service.seo.description,
      provider: {
        '@type': 'Organization',
        name: 'Kritano',
        url: 'https://kritano.com',
      },
      url: `https://kritano.com/services/${serviceSlug}`,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://kritano.com' },
        { '@type': 'ListItem', position: 2, name: 'Services', item: 'https://kritano.com/services' },
        { '@type': 'ListItem', position: 3, name: service.title, item: `https://kritano.com/services/${serviceSlug}` },
      ],
    },
  ];

  return (
    <PublicLayout>
      <PageSeo
        title={service.seo.title}
        description={service.seo.description}
        path={`/services/${serviceSlug}`}
        structuredData={structuredData}
      />

      {/* Hero - with coloured top accent */}
      <section className="relative">
        <div className={`absolute top-0 left-0 right-0 h-1 ${service.colorScheme.bg.replace('bg-', 'bg-').replace('-50', '-500')}`} style={{
          background: service.colorScheme.text.includes('violet') ? '#8b5cf6'
            : service.colorScheme.text.includes('emerald') ? '#10b981'
            : service.colorScheme.text.includes('red') ? '#ef4444'
            : '#0ea5e9'
        }} />
        <div className="max-w-7xl mx-auto px-6 lg:px-20 pt-20 lg:pt-28 pb-16">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex items-center gap-2 text-sm text-slate-500">
              <li>
                <Link to="/services" className="hover:text-indigo-600 transition-colors">Services</Link>
              </li>
              <li aria-hidden="true"><ChevronRight className="w-4 h-4" /></li>
              <li className="text-slate-900 font-medium">{service.title}</li>
            </ol>
          </nav>

          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl border ${service.colorScheme.bg} ${service.colorScheme.border} mb-6`}>
                <Icon className={`w-7 h-7 ${service.colorScheme.text}`} />
              </div>
              <h1 className="font-display text-5xl lg:text-6xl text-slate-900 leading-[1.05] mb-4">
                {service.title}
              </h1>
              <p className={`text-xl font-medium mb-6 ${service.colorScheme.text}`}>
                {service.subtitle}
              </p>
              <p className="text-lg text-slate-600 leading-relaxed mb-8">
                {service.heroDescription}
              </p>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors text-sm"
              >
                Try {service.title} Free
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-4">
              {service.businessImpact.stats.map((stat) => (
                <div key={stat.label} className="bg-white border border-slate-200 rounded-xl p-5 text-center">
                  <p className={`font-display text-3xl mb-1 ${service.colorScheme.text}`}>
                    {stat.value}
                  </p>
                  <p className="text-xs text-slate-500 leading-relaxed">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Feature Breakdown */}
      <section className="bg-slate-50 border-t border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-20 py-20">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className={`font-semibold tracking-wide uppercase text-sm mb-4 ${service.colorScheme.text}`}>
              What We Check
            </p>
            <h2 className="font-display text-4xl text-slate-900 leading-tight">
              Comprehensive feature breakdown
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {service.featureGroups.map((group) => (
              <div key={group.title} className="bg-white border border-slate-200 rounded-xl p-6">
                <h3 className="font-semibold text-slate-900 mb-4 text-sm uppercase tracking-wider">
                  {group.title}
                </h3>
                <ul className="space-y-2.5">
                  {group.items.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <CheckCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${service.colorScheme.text}`} />
                      <span className="text-slate-600 text-sm leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Methodology - Stepper with connectors */}
      <section className="max-w-7xl mx-auto px-6 lg:px-20 py-20">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className={`font-semibold tracking-wide uppercase text-sm mb-4 ${service.colorScheme.text}`}>
            Methodology
          </p>
          <h2 className="font-display text-4xl text-slate-900 leading-tight">
            How we audit
          </h2>
        </div>

        <div className="grid md:grid-cols-4 gap-0">
          {service.methodology.map((step, i) => (
            <div key={step.step} className="relative flex flex-col items-center text-center px-4 py-6">
              {/* Connector line */}
              {i < service.methodology.length - 1 && (
                <div className="hidden md:block absolute top-[3.5rem] left-[calc(50%+1.5rem)] right-[calc(-50%+1.5rem)] h-px bg-slate-200" />
              )}
              <div className={`relative z-10 w-12 h-12 rounded-full ${service.colorScheme.bg} ${service.colorScheme.text} flex items-center justify-center font-semibold text-sm mb-4 border ${service.colorScheme.border}`}>
                {step.step}
              </div>
              <h3 className="font-semibold text-slate-900 mb-2 text-sm">{step.title}</h3>
              <p className="text-slate-500 text-xs leading-relaxed max-w-[200px]">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Common Issues - Severity-sorted list */}
      <section className="bg-slate-50 border-t border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-20 py-20">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className={`font-semibold tracking-wide uppercase text-sm mb-4 ${service.colorScheme.text}`}>
              Common Findings
            </p>
            <h2 className="font-display text-4xl text-slate-900 leading-tight">
              Issues we commonly detect
            </h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-3">
            {service.commonIssues.map((issue) => {
              const config = SEVERITY_CONFIG[issue.severity];
              const SevIcon = config.icon;
              return (
                <div key={issue.title} className="bg-white border border-slate-200 rounded-lg p-5 flex items-start gap-4">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center`}>
                    <SevIcon className={`w-4 h-4 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900 text-sm">{issue.title}</h3>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium capitalize ${config.bg} ${config.text}`}>
                        {issue.severity}
                      </span>
                    </div>
                    <p className="text-slate-500 text-xs leading-relaxed">{issue.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Business Impact */}
      <section className="max-w-7xl mx-auto px-6 lg:px-20 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-4xl text-slate-900 leading-tight mb-4">
            {service.businessImpact.headline}
          </h2>
          <p className="text-lg text-slate-600 leading-relaxed">
            {service.businessImpact.description}
          </p>
        </div>
      </section>

      {/* Related Services */}
      <section className="bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-20 py-20">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-indigo-600 font-semibold tracking-wide uppercase text-sm mb-4">
              Complete Coverage
            </p>
            <h2 className="font-display text-4xl text-slate-900 leading-tight">
              Explore other audit dimensions
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {service.relatedSlugs.map((slug) => {
              const related = SERVICES_DATA[slug];
              if (!related) return null;
              const RelatedIcon = ICON_MAP[related.iconName];
              return (
                <Link
                  key={slug}
                  to={`/services/${slug}`}
                  className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md hover:-translate-y-0.5 transition-all group"
                >
                  <div className={`inline-flex items-center justify-center w-11 h-11 rounded-lg ${related.colorScheme.bg} mb-4`}>
                    <RelatedIcon className={`w-5 h-5 ${related.colorScheme.text}`} />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">
                    {related.title}
                  </h3>
                  <p className="text-slate-500 text-sm mb-3">{related.subtitle}</p>
                  <span className="inline-flex items-center gap-1 text-indigo-600 text-sm font-medium">
                    Learn more <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 lg:px-20 py-20">
        <div className="bg-indigo-600 rounded-2xl p-10 md:p-14 relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:32px_32px]" />
          <div className="relative text-center max-w-xl mx-auto">
            <h2 className="font-display text-3xl lg:text-4xl text-white leading-tight mb-5">
              {service.cta.headline}
            </h2>
            <p className="text-indigo-200 leading-relaxed mb-8">
              {service.cta.description}
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-indigo-700 rounded-lg font-semibold hover:bg-indigo-50 transition-colors"
            >
              {service.cta.buttonText}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
