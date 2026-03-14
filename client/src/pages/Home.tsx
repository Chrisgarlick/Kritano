/**
 * Homepage
 *
 * Editorial-style landing page matching the brand guidelines.
 * Score card mirrors the actual app's CategoryScore / ProgressRing UI.
 */

import { Link } from 'react-router-dom';
import { PublicLayout } from '../components/layout/PublicLayout';
import PageSeo from '../components/seo/PageSeo';
import {
  TrendingUp,
  Shield,
  Accessibility,
  Zap,
  ArrowRight,
  BarChart3,
  Globe,
} from 'lucide-react';

// Category colors matching the real app's ScoreDisplay.tsx
const CATEGORIES = [
  { label: 'SEO', score: 92, color: '#8b5cf6', bg: 'bg-violet-50', text: 'text-violet-700' },
  { label: 'Accessibility', score: 78, color: '#10b981', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  { label: 'Security', score: 95, color: '#ef4444', bg: 'bg-red-50', text: 'text-red-700' },
  { label: 'Performance', score: 83, color: '#0ea5e9', bg: 'bg-sky-50', text: 'text-sky-700' },
  { label: 'Content', score: 88, color: '#f59e0b', bg: 'bg-amber-50', text: 'text-amber-700' },
];

export default function Home() {
  const overallScore = Math.round(
    CATEGORIES.reduce((sum, c) => sum + c.score, 0) / CATEGORIES.length
  );

  return (
    <PublicLayout>
      <PageSeo
        title="Website Auditing for SEO, Accessibility, Security & Performance"
        description="PagePulser audits your website for SEO, accessibility, security, and performance issues. Get actionable insights to build trust online."
        path="/"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'PagePulser',
          description: 'Comprehensive website auditing for SEO, accessibility, security, and performance.',
          applicationCategory: 'WebApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'GBP' },
        }}
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-72 h-72 bg-indigo-50 rounded-full opacity-60 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -left-16 w-48 h-48 bg-amber-50 rounded-full opacity-60 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 lg:px-20 pt-20 lg:pt-28 pb-20">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-start">
            {/* Left: Copy */}
            <div>
              <p className="text-indigo-600 font-medium tracking-wide uppercase text-xs mb-5">
                Website Intelligence Platform
              </p>
              <h1 className="font-display text-5xl lg:text-[4.25rem] text-slate-900 leading-[1.08] mb-7">
                The clarity your website deserves.
              </h1>
              <p className="text-lg text-slate-500 leading-relaxed mb-10 max-w-lg">
                PagePulser provides deep visibility into your website's health&mdash;surfacing
                critical issues in SEO, accessibility, security, and performance that impact
                your bottom line.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  to="/register"
                  className="px-7 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors text-[15px]"
                >
                  Start Free Analysis
                </Link>
                <Link
                  to="/services"
                  className="px-7 py-3.5 text-slate-600 hover:text-slate-900 font-medium transition-colors flex items-center gap-2 text-[15px]"
                >
                  Learn More
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Right: App-like Score Card */}
            <div className="relative">
              <div className="absolute -top-6 -right-6 w-64 h-64 bg-indigo-50 rounded-full opacity-60" />
              <div className="absolute -bottom-6 -left-6 w-40 h-40 bg-amber-50 rounded-full opacity-60" />

              <div className="relative bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                {/* Card Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Audit Complete</span>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">example.com</span>
                </div>

                {/* Overall Score */}
                <div className="px-6 pt-6 pb-4 flex items-center gap-6">
                  <HeroRing score={overallScore} size={96} strokeWidth={6} label="Overall" />
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Overall Health</p>
                    <p className="text-sm text-slate-600">
                      {overallScore >= 90 ? 'Excellent' : overallScore >= 70 ? 'Good' : 'Fair'} &mdash; {CATEGORIES.filter(c => c.score < 80).length} {CATEGORIES.filter(c => c.score < 80).length === 1 ? 'area' : 'areas'} to improve
                    </p>
                  </div>
                </div>

                {/* Category Scores Grid */}
                <div className="px-6 pb-6">
                  <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                    {CATEGORIES.map((cat) => (
                      <div key={cat.label} className={`${cat.bg} rounded-xl p-1.5 sm:p-3 flex flex-col items-center`}>
                        <span className={`text-[10px] font-medium uppercase tracking-wider ${cat.text} mb-2`}>
                          {cat.label === 'Accessibility' ? 'A11Y' : cat.label === 'Performance' ? 'Perf' : cat.label}
                        </span>
                        <HeroRing score={cat.score} size={48} strokeWidth={3} color={cat.color} label={cat.label} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Issues summary bar */}
                <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      <span className="text-slate-500">3 Critical</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-orange-500" />
                      <span className="text-slate-500">7 Serious</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span className="text-slate-500">12 Moderate</span>
                    </span>
                  </div>
                  <span className="text-xs font-medium text-indigo-600">View All &rarr;</span>
                </div>
              </div>
            </div>
          </div>

          {/* Trusted By */}
          <div className="mt-28 pt-16 border-t border-slate-100">
            <p className="text-center text-slate-500 text-xs font-medium mb-8 uppercase tracking-wider">
              Trusted by forward-thinking teams
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-16 gap-y-6 opacity-25">
              {['Acme Corp', 'Meridian', 'NorthStar', 'Velocity', 'Apex Digital'].map(name => (
                <span key={name} className="text-xl font-semibold text-slate-400 tracking-tight">
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-20 py-24">
          <div className="max-w-2xl mb-16">
            <p className="text-indigo-600 font-medium tracking-wide uppercase text-xs mb-4">
              Capabilities
            </p>
            <h2 className="font-display text-4xl lg:text-5xl text-slate-900 leading-tight mb-5">
              Everything you need to build trust online
            </h2>
            <p className="text-lg text-slate-500 leading-relaxed">
              Comprehensive auditing tools that cover all aspects of website health,
              delivering insights your team can act on immediately.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<TrendingUp className="w-5 h-5" />}
              iconColor="text-violet-600 bg-violet-50"
              title="SEO Analysis"
              description="Core Web Vitals, broken links, metadata optimization, and search engine visibility checks that drive organic growth."
              href="/services/seo"
            />
            <FeatureCard
              icon={<Accessibility className="w-5 h-5" />}
              iconColor="text-emerald-600 bg-emerald-50"
              title="Accessibility (WCAG 2.2)"
              description="Legal compliance audits for screen readers, keyboard navigation, color contrast, and ARIA implementation."
              href="/services/accessibility"
            />
            <FeatureCard
              icon={<Shield className="w-5 h-5" />}
              iconColor="text-red-600 bg-red-50"
              title="Security & Privacy"
              description="Exposed files, mixed content warnings, HTTPS validation, and GDPR compliance checks to protect your users."
              href="/services/security"
            />
            <FeatureCard
              icon={<Zap className="w-5 h-5" />}
              iconColor="text-sky-600 bg-sky-50"
              title="Performance Monitoring"
              description="Page speed analysis, resource optimization recommendations, and Core Web Vitals tracking over time."
              href="/services/performance"
            />
            <FeatureCard
              icon={<Globe className="w-5 h-5" />}
              iconColor="text-amber-600 bg-amber-50"
              title="Multi-Site Management"
              description="Monitor all your websites from a single dashboard. Invite team members and manage permissions."
              href="/pricing"
            />
            <FeatureCard
              icon={<BarChart3 className="w-5 h-5" />}
              iconColor="text-purple-600 bg-purple-50"
              title="Trend Analytics"
              description="Track your website health over time. Compare audits, identify regressions, and prove improvements."
              href="/pricing"
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section>
        <div className="max-w-7xl mx-auto px-6 lg:px-20 py-24">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-indigo-600 font-medium tracking-wide uppercase text-xs mb-4">
              How It Works
            </p>
            <h2 className="font-display text-4xl lg:text-5xl text-slate-900 leading-tight">
              Three steps to a healthier website
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <StepCard
              number="01"
              title="Enter your URL"
              description="Add your website and verify domain ownership. Our scanner is ready in seconds."
            />
            <StepCard
              number="02"
              title="Run your audit"
              description="PagePulser crawls your pages, checking hundreds of SEO, accessibility, security, and performance rules."
            />
            <StepCard
              number="03"
              title="Act on insights"
              description="Review prioritized findings with clear explanations and fix guidance. Track improvements over time."
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-slate-900">
        <div className="max-w-7xl mx-auto px-6 lg:px-20 py-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatItem value="50K+" label="Sites Audited" />
            <StatItem value="2.1M" label="Issues Found" />
            <StatItem value="99.9%" label="Uptime" />
            <StatItem value="< 2min" label="Avg. Audit Time" />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section>
        <div className="max-w-7xl mx-auto px-6 lg:px-20 py-24">
          <div className="bg-indigo-600 rounded-2xl p-12 md:p-16 relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:40px_40px]" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/30 rounded-full blur-3xl" />

            <div className="relative text-center max-w-2xl mx-auto">
              <h2 className="font-display text-4xl lg:text-5xl text-white leading-tight mb-6">
                Ready to check your website's pulse?
              </h2>
              <p className="text-lg text-indigo-200 leading-relaxed mb-10">
                Start your free audit today and discover what's holding your site back.
                No credit card required.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/register"
                  className="px-7 py-3.5 bg-white text-indigo-600 hover:bg-indigo-50 rounded-lg font-medium transition-colors"
                >
                  Get Started Free
                </Link>
                <Link
                  to="/pricing"
                  className="px-7 py-3.5 text-white hover:text-indigo-100 font-medium transition-colors flex items-center gap-2"
                >
                  View Pricing
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

// =============================================
// Hero Score Ring - Mirrors app's ProgressRing
// =============================================

function HeroRing({
  score,
  size,
  strokeWidth,
  color,
  label,
}: {
  score: number;
  size: number;
  strokeWidth: number;
  color?: string;
  label?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  // Auto-color if no explicit color given (matches app's getScoreColor)
  const progressColor = color ?? (
    score >= 90 ? '#10b981' :
    score >= 70 ? '#f59e0b' :
    score >= 50 ? '#f97316' :
    '#ef4444'
  );

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90" role="img" aria-label={label ? `${label} score: ${score} out of 100` : `Score: ${score} out of 100`}>
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-200"
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={progressColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className="font-display tabular-nums text-slate-900"
          style={{ fontSize: size * 0.32 }}
        >
          {score}
        </span>
      </div>
    </div>
  );
}

// =============================================
// Sub-components
// =============================================

function FeatureCard({
  icon,
  iconColor,
  title,
  description,
  href,
}: {
  icon: React.ReactNode;
  iconColor: string;
  title: string;
  description: string;
  href?: string;
}) {
  const content = (
    <>
      <div className={`w-10 h-10 rounded-lg ${iconColor} flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}>
        {icon}
      </div>
      <h3 className="text-base font-semibold text-slate-900 mb-1.5 group-hover:text-indigo-600 transition-colors">{title}</h3>
      <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
    </>
  );

  if (href) {
    return (
      <Link to={href} className="bg-white border border-slate-200 rounded-xl p-6 hover:border-indigo-200 hover:shadow-md transition-all duration-200 group block">
        {content}
      </Link>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 hover:border-indigo-200 hover:shadow-md transition-all duration-200 group">
      {content}
    </div>
  );
}

function StepCard({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 font-display text-xl mb-5">
        {number}
      </div>
      <h3 className="text-base font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <p className="font-display text-4xl lg:text-5xl text-white mb-2">{value}</p>
      <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{label}</p>
    </div>
  );
}
