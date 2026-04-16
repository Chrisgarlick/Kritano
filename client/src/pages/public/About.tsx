/**
 * About Page
 *
 * Personal founder voice, timeline with milestones, specific value descriptions.
 */

import { Link } from 'react-router-dom';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { useSiteMode } from '../../contexts/SiteModeContext';
import PageSeo from '../../components/seo/PageSeo';
import AuthorBio from '../../components/blog/AuthorBio';
import { ArrowRight, Eye, Sparkles, Heart, Target } from 'lucide-react';

const PILLARS = [
  {
    label: 'SEO',
    color: 'bg-violet-500 border-violet-500',
    description:
      '100+ ranking factors - metadata, structured data, broken links, Core Web Vitals, and mobile-friendliness.',
  },
  {
    label: 'Accessibility',
    color: 'bg-emerald-500 border-emerald-500',
    description:
      'WCAG 2.2 Level AA - colour contrast, keyboard navigation, screen readers, ARIA, and semantic HTML.',
  },
  {
    label: 'Security',
    color: 'bg-red-500 border-red-500',
    description:
      '40+ checks - HTTPS, security headers, exposed files, mixed content, and cookie flags.',
  },
  {
    label: 'Performance',
    color: 'bg-sky-500 border-sky-500',
    description:
      'Core Web Vitals (LCP, INP, CLS), resource optimisation, caching, and render-blocking detection.',
  },
  {
    label: 'Content Intelligence',
    color: 'bg-amber-500 border-amber-500',
    description:
      'E-E-A-T scoring, AEO analysis, readability, engagement markers - 400+ content checks across 7 sub-modules.',
  },
  {
    label: 'Structured Data',
    color: 'bg-teal-500 border-teal-500',
    description:
      'Schema.org validation, rich result eligibility, JSON-LD parsing, and markup completeness.',
  },
];

export default function About() {
  const mode = useSiteMode();
  const ctaHref =
    mode === 'waitlist'
      ? '/waitlist'
      : mode === 'early_access'
        ? '/register?ea=email'
        : '/register';
  const ctaLabel =
    mode === 'waitlist'
      ? 'Join the Waitlist'
      : mode === 'early_access'
        ? 'Join Early Access'
        : 'Start Free Audit';
  return (
    <PublicLayout>
      <PageSeo
        title="About Kritano - Our Mission & Story"
        description="Learn about Kritano's mission to make the web more accessible, secure, and performant for everyone."
        path="/about"
        structuredData={[
          {
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'Kritano',
            url: 'https://kritano.com',
            logo: 'https://kritano.com/brand/favicon-32.svg',
            description:
              'Website intelligence platform providing comprehensive auditing for SEO, accessibility, security, and performance.',
            foundingDate: '2025',
            founder: { '@type': 'Person', name: 'Chris Garlick' },
            sameAs: ['https://x.com/Kritanoapp', 'https://www.instagram.com/kritanoapp/'],
            contactPoint: {
              '@type': 'ContactPoint',
              email: 'info@kritano.com',
              contactType: 'customer support',
              url: 'https://kritano.com/contact',
            },
          },
          {
            '@context': 'https://schema.org',
            '@type': 'Person',
            name: 'Chris Garlick',
            jobTitle: 'Founder',
            worksFor: { '@type': 'Organization', name: 'Kritano', url: 'https://kritano.com' },
            description:
              'Founder of Kritano. Software engineer specialising in web auditing, SEO, accessibility, and performance optimisation.',
            knowsAbout: [
              'SEO',
              'Web Accessibility',
              'WCAG 2.2',
              'Web Security',
              'Web Performance',
              'Content Quality',
              'Answer Engine Optimisation',
            ],
            url: 'https://kritano.com/about',
            image: 'https://kritano.com/brand/author-chris-garlick.png',
            sameAs: [
              'https://uk.linkedin.com/in/chris-garlick-59a8bb91',
              'https://x.com/ChrisGarlick123',
            ],
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://kritano.com' },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'About',
                item: 'https://kritano.com/about',
              },
            ],
          },
        ]}
      />

      {/* Hero - Founder voice */}
      <section className="max-w-7xl mx-auto px-6 lg:px-20 pt-20 lg:pt-28 pb-16">
        <div className="max-w-3xl">
          <h1 className="font-display text-5xl lg:text-6xl text-slate-900 leading-[1.05] mb-4">
            About Kritano
          </h1>
          <h2 className="font-display text-2xl lg:text-3xl text-slate-600 leading-snug mb-8">
            I built the tool I wished existed.
          </h2>
          <blockquote className="border-l-4 border-indigo-600 pl-6 mb-8">
            <p className="font-display text-2xl italic text-slate-700 leading-relaxed">
              "Most website owners don't know what's wrong until it's too late. I wanted to change
              that - to give every business the same visibility into their website's health that
              enterprise teams take for granted."
            </p>
            <footer className="mt-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center">
                <span className="text-sm font-bold text-white">CG</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Chris Garlick</p>
                <p className="text-xs text-slate-600">Founder, Kritano</p>
              </div>
            </footer>
          </blockquote>
          <p className="text-lg text-slate-600 leading-relaxed mb-6">
            Kritano is a website auditing platform that scans your site across six dimensions: SEO, accessibility, security, performance, content quality, and AI readiness. It turns hundreds of technical checks into clear, prioritised actions that anyone can understand.
          </p>
          <p className="text-lg text-slate-600 leading-relaxed mb-6">
            I built it out of frustration. I was running accessibility audits on client websites and found the same pattern everywhere: broken links, missing alt text, insecure headers, and slow pages. These issues were easy to fix but hard to find. Existing tools were too technical, too expensive, or full of false positives.
          </p>
          <p className="text-lg text-slate-600 leading-relaxed mb-6">
            According to the <a href="https://webaim.org/projects/million/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-700 underline decoration-indigo-300 underline-offset-2 hover:decoration-indigo-600">WebAIM Million report</a>, 95.9% of home pages have detectable WCAG failures. In our testing of over 10,000 pages, we found that the average website has 27 unique issues across all six audit categories. Most site owners had no idea these problems existed.
          </p>
          <p className="text-sm text-slate-600">
            <strong>Key takeaway:</strong> Website issues are common, but they are fixable. Kritano helps you find them before your users or search engines do.
          </p>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-7xl mx-auto px-6 lg:px-20">
        <div className="border-t border-slate-200" />
      </div>

      {/* What We Cover */}
      <section className="max-w-7xl mx-auto px-6 lg:px-20 py-24">
        <div className="max-w-2xl mb-14">
          <p className="text-indigo-600 font-semibold tracking-wide uppercase text-sm mb-4">
            What We Cover
          </p>
          <h2 className="font-display text-4xl text-slate-900 leading-tight">
            Six dimensions. 500+ rules.
          </h2>
        </div>

        <div className="relative hidden md:block">
          <div className="space-y-0">
            {PILLARS.map((item, i) => (
              <div key={i} className="flex items-stretch">
                {/* Dot column with connecting line segments */}
                <div className="flex flex-col items-center w-10 flex-shrink-0">
                  {/* Line above dot (hidden for first item) */}
                  <div className={`w-px flex-1 ${i === 0 ? 'bg-transparent' : 'bg-slate-200'}`} />
                  {/* Dot */}
                  <div
                    className={`w-3.5 h-3.5 rounded-full flex-shrink-0 ${item.color} ring-4 ring-white`}
                  />
                  {/* Line below dot (hidden for last item) */}
                  <div
                    className={`w-px flex-1 ${i === PILLARS.length - 1 ? 'bg-transparent' : 'bg-slate-200'}`}
                  />
                </div>
                {/* Content */}
                <div className="flex-1 pl-6 py-5">
                  <h3 className="text-sm font-semibold text-slate-900 mb-1">{item.label}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile fallback (no line) */}
        <div className="md:hidden space-y-6">
          {PILLARS.map((item, i) => (
            <div key={i} className="flex gap-4 items-start">
              <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-1 ${item.color}`} />
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-1">{item.label}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Values Section */}
      <section className="bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-20 py-24">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <p className="text-indigo-600 font-semibold tracking-wide uppercase text-sm mb-4">
                What We Stand For
              </p>
              <h2 className="font-display text-4xl text-slate-900 leading-tight mb-6">
                Making the web work for everyone.
              </h2>
              <p className="text-lg text-slate-600 leading-relaxed mb-4">
                The internet should be accessible, secure, and fast for every person on every device. However, millions of websites have issues that block users, expose data, or hurt search rankings. Most site owners do not even know. We are here to change that.
              </p>
              <p className="text-lg text-slate-600 leading-relaxed">
                For example, the <a href="https://www.w3.org/WAI/fundamentals/accessibility-intro/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-700 underline decoration-indigo-300 underline-offset-2 hover:decoration-indigo-600">W3C Web Accessibility Initiative</a> estimates that 15% of the world's population lives with some form of disability. An inaccessible website shuts out roughly 1.3 billion people. We believe every site deserves a thorough health check.
              </p>
            </div>

            {/* Values */}
            <div className="space-y-8">
              <ValueCard
                icon={<Eye className="w-5 h-5" />}
                title="Clarity Over Complexity"
                description="We translate technical findings into plain English. If a business owner can't understand the result, we haven't done our job."
              />
              <ValueCard
                icon={<Target className="w-5 h-5" />}
                title="Precision Matters"
                description="We'd rather show you 10 real issues than 100 false positives. Every finding is verified before it reaches your report."
              />
              <ValueCard
                icon={<Heart className="w-5 h-5" />}
                title="Accessibility First"
                description="Our own platform meets WCAG 2.2 guidelines. We don't just audit accessibility - we practise it."
              />
              <ValueCard
                icon={<Sparkles className="w-5 h-5" />}
                title="Continuous Improvement"
                description="500+ rules and growing. Our scanning engine updates with every new browser standard, WCAG criterion, and SEO best practice."
              />
            </div>
          </div>
        </div>
      </section>

      {/* Author */}
      <section className="max-w-7xl mx-auto px-6 lg:px-20 py-12">
        <div className="max-w-3xl mx-auto">
          <AuthorBio />
          <p className="text-xs text-slate-600 mt-4">Last updated: <time dateTime="2026-04-16">16 April 2026</time></p>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 lg:px-20 py-24">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="font-display text-4xl text-slate-900 leading-tight mb-6">
            Ready to improve your web presence?
          </h2>
          <p className="text-lg text-slate-600 leading-relaxed mb-10">
            Start your first audit today. It's free, fast, and requires no credit card.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to={ctaHref}
              className="inline-flex items-center justify-center px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:ring-offset-2"
            >
              {ctaLabel}
            </Link>
            <Link
              to="/contact"
              className="px-8 py-4 text-slate-700 hover:text-slate-900 font-semibold transition-colors flex items-center gap-2"
            >
              Get in Touch
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

function ValueCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-slate-900 mb-1">{title}</h3>
        <p className="text-slate-600 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
