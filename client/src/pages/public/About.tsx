/**
 * About Page
 *
 * Company story, mission, and values for PagePulser.
 */

import { Link } from 'react-router-dom';
import { PublicLayout } from '../../components/layout/PublicLayout';
import PageSeo from '../../components/seo/PageSeo';
import { ArrowRight, Eye, Sparkles, Heart, Target } from 'lucide-react';

export default function About() {
  return (
    <PublicLayout>
      <PageSeo
        title="About PagePulser"
        description="Learn about PagePulser's mission to make the web more accessible, secure, and performant for everyone."
        path="/about"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'PagePulser',
          description: 'Website intelligence platform providing comprehensive auditing for SEO, accessibility, security, and performance.',
          url: 'https://pagepulser.com',
        }}
      />

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 lg:px-20 pt-20 lg:pt-28 pb-16">
        <div className="max-w-3xl">
          <p className="text-indigo-600 font-semibold tracking-wide uppercase text-sm mb-6">
            About PagePulser
          </p>
          <h1 className="font-display text-5xl lg:text-6xl text-slate-900 leading-[1.05] mb-8">
            We believe every website deserves a health check.
          </h1>
          <p className="text-xl text-slate-600 leading-relaxed">
            PagePulser was born from a simple observation: most website owners don't know what's
            wrong until it's too late. We built the tool we wished existed&mdash;one that gives
            you complete visibility into your site's SEO, accessibility, security, and performance
            in minutes, not weeks.
          </p>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-7xl mx-auto px-6 lg:px-20">
        <div className="border-t border-slate-200" />
      </div>

      {/* Mission Section */}
      <section className="max-w-7xl mx-auto px-6 lg:px-20 py-24">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          <div>
            <p className="text-indigo-600 font-semibold tracking-wide uppercase text-sm mb-4">
              Our Mission
            </p>
            <h2 className="font-display text-4xl text-slate-900 leading-tight mb-6">
              Making the web work for everyone.
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed mb-6">
              The internet should be accessible, secure, and fast for every person on every device.
              Yet millions of websites have critical issues that block users, expose data, or
              hurt search rankings&mdash;often without the site owner even knowing.
            </p>
            <p className="text-lg text-slate-600 leading-relaxed">
              We're here to change that. PagePulser gives businesses of all sizes the same
              level of website intelligence that was previously only available to large
              enterprises with dedicated technical teams.
            </p>
          </div>

          {/* Values */}
          <div className="space-y-8">
            <ValueCard
              icon={<Eye className="w-5 h-5" />}
              title="Clarity Over Complexity"
              description="We translate technical findings into plain language with clear next steps. No jargon, no confusion."
            />
            <ValueCard
              icon={<Target className="w-5 h-5" />}
              title="Precision Matters"
              description="Every finding is accurate. We'd rather show you 10 real issues than 100 false positives."
            />
            <ValueCard
              icon={<Heart className="w-5 h-5" />}
              title="Accessibility First"
              description="We practice what we preach. Our own platform meets WCAG 2.2 guidelines, and we help you do the same."
            />
            <ValueCard
              icon={<Sparkles className="w-5 h-5" />}
              title="Continuous Improvement"
              description="The web evolves, and so do we. Our scanning engine updates with the latest standards and best practices."
            />
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-20 py-24">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-indigo-600 font-semibold tracking-wide uppercase text-sm mb-4">
              The Story
            </p>
            <h2 className="font-display text-4xl text-slate-900 leading-tight mb-8">
              From frustration to solution
            </h2>
            <div className="text-left space-y-6 text-lg text-slate-600 leading-relaxed">
              <p>
                PagePulser started when our founder ran accessibility audits on client websites
                and discovered the same pattern everywhere: broken links, missing alt text,
                insecure resources, and poor performance&mdash;issues that were easy to fix
                but hard to find.
              </p>
              <p>
                Existing tools were either too technical, too expensive, or too slow. They
                generated massive reports filled with false positives and lacked the guidance
                needed to actually resolve issues. We knew there had to be a better way.
              </p>
              <p>
                So we built PagePulser: a platform that runs comprehensive audits in under
                two minutes, prioritizes findings by real impact, and explains exactly how
                to fix each issue. No PhD required.
              </p>
            </div>
          </div>
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
              to="/register"
              className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors"
            >
              Start Free Audit
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
