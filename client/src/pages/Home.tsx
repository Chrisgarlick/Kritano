/**
 * Homepage
 *
 * Redesigned with:
 * - Animated audit demo sequence in the hero
 * - Social proof bar
 * - Content Intelligence hero feature (differentiator)
 * - Distinct visual treatments per section
 */

import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { PublicLayout } from '../components/layout/PublicLayout';
import { Button } from '../components/ui/Button';
import { useSiteMode } from '../contexts/SiteModeContext';
import PageSeo from '../components/seo/PageSeo';
import {
  TrendingUp,
  Shield,
  Accessibility,
  Zap,
  ArrowRight,
  Search,
  FileText,
  BookOpen,
  CheckCircle,
  AlertTriangle,
  XCircle,
} from 'lucide-react';

// =============================================
// Animated Audit Demo - the hero right panel
// =============================================

const DEMO_STEPS = [
  { phase: 'input', duration: 1500 },
  { phase: 'scanning', duration: 2500 },
  { phase: 'results', duration: 6000 },
] as const;

type DemoPhase = typeof DEMO_STEPS[number]['phase'];

const DEMO_URL = 'example.com';

const DEMO_CATEGORIES = [
  { label: 'SEO', short: 'SEO', score: 92, color: '#8b5cf6' },
  { label: 'Accessibility', short: 'A11Y', score: 78, color: '#10b981' },
  { label: 'Security', short: 'Sec', score: 95, color: '#ef4444' },
  { label: 'Performance', short: 'Perf', score: 83, color: '#0ea5e9' },
  { label: 'Content', short: 'Cont', score: 88, color: '#f59e0b' },
];

const DEMO_FINDINGS = [
  { severity: 'critical', label: 'Images missing alt text', count: 12, icon: XCircle, color: 'text-red-500' },
  { severity: 'serious', label: 'Missing meta descriptions', count: 5, icon: AlertTriangle, color: 'text-orange-500' },
  { severity: 'moderate', label: 'Heading hierarchy skip', count: 8, icon: AlertTriangle, color: 'text-amber-500' },
];

function AnimatedAuditDemo() {
  const [phase, setPhase] = useState<DemoPhase>('input');
  const [typedChars, setTypedChars] = useState(0);
  const [scanProgress, setScanProgress] = useState(0);
  const [pagesFound, setPagesFound] = useState(0);
  const [showScores, setShowScores] = useState(false);
  const [showFindings, setShowFindings] = useState(false);
  const timeouts = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => timeouts.current.forEach(clearTimeout);
  }, []);

  // Run the demo loop
  useEffect(() => {
    const schedule = (fn: () => void, ms: number) => {
      const t = setTimeout(fn, ms);
      timeouts.current.push(t);
      return t;
    };

    // Phase: typing the URL
    if (phase === 'input') {
      setTypedChars(0);
      setScanProgress(0);
      setPagesFound(0);
      setShowScores(false);
      setShowFindings(false);

      // Type one char at a time
      for (let i = 0; i <= DEMO_URL.length; i++) {
        schedule(() => setTypedChars(i), i * 100);
      }
      schedule(() => setPhase('scanning'), DEMO_URL.length * 100 + 600);
    }

    if (phase === 'scanning') {
      // Animate progress 0→100 and pages found
      const steps = 20;
      for (let i = 1; i <= steps; i++) {
        schedule(() => {
          setScanProgress(Math.round((i / steps) * 100));
          setPagesFound(Math.round((i / steps) * 47));
        }, i * 100);
      }
      schedule(() => setPhase('results'), steps * 100 + 300);
    }

    if (phase === 'results') {
      schedule(() => setShowScores(true), 200);
      schedule(() => setShowFindings(true), 1000);
      // Loop back
      schedule(() => setPhase('input'), 5500);
    }
  }, [phase]);

  const overallScore = Math.round(
    DEMO_CATEGORIES.reduce((sum, c) => sum + c.score, 0) / DEMO_CATEGORIES.length
  );

  return (
    <div className="relative bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden">
      {/* Card header */}
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${
            phase === 'results' ? 'bg-emerald-500' : phase === 'scanning' ? 'bg-amber-500 animate-pulse' : 'bg-slate-300'
          }`} />
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            {phase === 'input' ? 'New Audit' : phase === 'scanning' ? 'Scanning...' : 'Audit Complete'}
          </span>
        </div>
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
          <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
          <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
        </div>
      </div>

      {/* Fixed-height content area - prevents layout jump between phases */}
      <div className="h-[320px] relative">

        {/* Phase: URL Input */}
        {phase === 'input' && (
          <div className="absolute inset-0 px-5 py-8">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Enter your URL</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg flex items-center">
                <Search className="w-4 h-4 text-slate-500 mr-2 flex-shrink-0" />
                <span className="text-sm text-slate-900 font-mono">
                  {DEMO_URL.slice(0, typedChars)}
                  <span className="inline-block w-px h-4 bg-indigo-600 ml-px align-middle animate-blink-cursor" />
                </span>
              </div>
              <div className={`px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                typedChars >= DEMO_URL.length
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-500'
              }`}>
                Audit
              </div>
            </div>
          </div>
        )}

        {/* Phase: Scanning */}
        {phase === 'scanning' && (
          <div className="absolute inset-0 px-5 py-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Scanning {DEMO_URL}</p>
              <span className="text-xs font-semibold text-indigo-600 tabular-nums">{scanProgress}%</span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-slate-100 rounded-full h-1.5 mb-4">
              <div
                className="bg-indigo-600 h-1.5 rounded-full transition-all duration-100"
                style={{ width: `${scanProgress}%` }}
              />
            </div>
            <div className="flex items-center gap-6 text-xs text-slate-500">
              <span><span className="font-semibold text-slate-700 tabular-nums">{pagesFound}</span> pages found</span>
              <span><span className="font-semibold text-slate-700 tabular-nums">{Math.round(pagesFound * 0.8)}</span> pages audited</span>
            </div>
            {/* Scan line visual */}
            <div className="mt-4 relative h-16 bg-slate-50 rounded-lg border border-slate-100 overflow-hidden">
              <div className="absolute left-0 right-0 h-px bg-indigo-400/60 animate-scan-sweep" />
              <div className="flex items-center justify-center h-full text-[10px] text-slate-500 font-mono">
                Checking SEO, accessibility, security, performance...
              </div>
            </div>
          </div>
        )}

        {/* Phase: Results */}
        {phase === 'results' && (
          <div className="absolute inset-0 px-5 py-5 overflow-hidden">
            {/* Overall score + category rings */}
            {showScores && (
              <div className="animate-demo-fade-in">
                <div className="flex items-center gap-5 mb-4">
                  <DemoRing score={overallScore} size={72} strokeWidth={5} animated />
                  <div className="flex-1">
                    <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-0.5">Overall Health</p>
                    <p className="text-sm text-slate-600">Good &mdash; 1 area to improve</p>
                  </div>
                </div>

                {/* Category mini-rings */}
                <div className="grid grid-cols-5 gap-1.5 mb-4">
                  {DEMO_CATEGORIES.map((cat, i) => (
                    <div
                      key={cat.label}
                      className="flex flex-col items-center p-2 bg-slate-50 rounded-lg animate-demo-fade-in"
                      style={{ animationDelay: `${i * 100 + 200}ms` }}
                    >
                      <span className="text-[9px] font-medium text-slate-500 uppercase tracking-wider mb-1">{cat.short}</span>
                      <DemoRing score={cat.score} size={36} strokeWidth={3} color={cat.color} animated delay={i * 100 + 300} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Findings */}
            {showFindings && (
              <div className="border-t border-slate-100 pt-3 space-y-2">
                {DEMO_FINDINGS.map((finding, i) => {
                  const Icon = finding.icon;
                  return (
                    <div
                      key={finding.label}
                      className="flex items-center gap-2.5 py-1.5 animate-demo-slide-right"
                      style={{ animationDelay: `${i * 150}ms` }}
                    >
                      <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${finding.color}`} />
                      <span className="text-xs text-slate-700 flex-1">{finding.label}</span>
                      <span className="text-[10px] text-slate-500 tabular-nums">{finding.count} pages</span>
                    </div>
                  );
                })}
                <div className="pt-1">
                  <span className="text-[11px] font-medium text-indigo-600">View all 22 findings &rarr;</span>
                </div>
              </div>
            )}
          </div>
        )}

      </div>{/* end fixed-height content area */}
    </div>
  );
}

// Animated score ring for the demo
function DemoRing({ score, size, strokeWidth, color, animated = false, delay = 0 }: {
  score: number; size: number; strokeWidth: number; color?: string; animated?: boolean; delay?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const progressColor = color ?? (score >= 90 ? '#10b981' : score >= 70 ? '#f59e0b' : score >= 50 ? '#f97316' : '#ef4444');

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90" role="img" aria-label={`Score: ${score}`}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={progressColor} strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={animated ? circumference : offset}
          className={animated ? 'animate-demo-ring-fill' : ''}
          style={{
            '--demo-circumference': circumference,
            '--demo-offset': offset,
            animationDelay: `${delay}ms`,
          } as React.CSSProperties}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-display tabular-nums text-slate-900" style={{ fontSize: size * 0.3 }}>
          {score}
        </span>
      </div>
    </div>
  );
}


// =============================================
// Main Homepage
// =============================================

export default function Home() {
  const mode = useSiteMode();
  const ctaHref = mode === 'waitlist' ? '/waitlist' : mode === 'early_access' ? '/register?ea=email' : '/register';
  const ctaLabel = mode === 'waitlist' ? 'Join the Waitlist' : mode === 'early_access' ? 'Join Early Access' : 'Start Free Audit';

  const [auditsCompleted, setAuditsCompleted] = useState<number | null>(null);
  useEffect(() => {
    fetch('/api/stats/public')
      .then(r => r.json())
      .then(d => setAuditsCompleted(d.auditsCompleted))
      .catch(() => {});
  }, []);

  return (
    <PublicLayout>
      <PageSeo
        title="Website Auditing for SEO, Accessibility & Security"
        description="Kritano audits your website for SEO, accessibility, security, and performance issues. Get actionable insights to build trust online."
        path="/"
        structuredData={[
          {
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: 'Kritano',
            description: 'Comprehensive website auditing for SEO, accessibility, security, and performance.',
            applicationCategory: 'WebApplication',
            operatingSystem: 'Any',
            url: 'https://kritano.com',
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
            creator: { '@type': 'Organization', name: 'Kritano', url: 'https://kritano.com' },
          },
          {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'Kritano',
            url: 'https://kritano.com',
            description: 'Kritano audits your website for SEO, accessibility, security, and performance issues. See what others miss.',
            potentialAction: {
              '@type': 'SearchAction',
              target: 'https://kritano.com/blog?search={search_term_string}',
              'query-input': 'required name=search_term_string',
            },
          },
        ]}
      />

      {/* ═══ Hero Section ═══ */}
      <section className="relative overflow-hidden">
        {/* Subtle dot grid background */}
        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] bg-[size:24px_24px] opacity-40 pointer-events-none" />
        <div className="absolute -top-8 -right-8 w-72 h-72 bg-indigo-50 rounded-full opacity-60 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -left-16 w-48 h-48 bg-amber-50 rounded-full opacity-60 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 lg:px-20 pt-20 lg:pt-28 pb-20 relative">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
            {/* Left: Copy */}
            <div>
              <h1 className="font-display text-5xl lg:text-[4.25rem] text-slate-900 leading-[1.08] mb-3">
                Website Auditing Platform
              </h1>
              <h2 className="font-display text-2xl lg:text-3xl text-slate-500 leading-snug mb-7">
                The clarity your website deserves.
              </h2>
              <p className="text-lg text-slate-500 leading-relaxed mb-10 max-w-lg">
                Kritano provides deep visibility into your website's health&mdash;surfacing
                critical issues in SEO, accessibility, security, and performance that impact
                your bottom line.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <Link to={ctaHref}>
                  <Button size="lg">{ctaLabel}</Button>
                </Link>
                <Link to="/services">
                  <Button variant="ghost" size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right: Animated Audit Demo */}
            <div className="relative">
              <div className="absolute -top-6 -right-6 w-64 h-64 bg-indigo-50 rounded-full opacity-60" />
              <div className="absolute -bottom-6 -left-6 w-40 h-40 bg-amber-50 rounded-full opacity-60" />
              <div className="relative">
                <AnimatedAuditDemo />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Social Proof Bar ═══ */}
      <section className="border-y border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-20 py-6">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs font-medium uppercase tracking-wider text-slate-500">
            <span className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-slate-600 normal-case tracking-normal text-sm font-medium">
                <span className="text-slate-900 font-semibold">{auditsCompleted != null ? auditsCompleted.toLocaleString() : '...'}</span> audits completed
              </span>
            </span>
            <span className="hidden sm:inline" aria-hidden="true">&middot;</span>
            <span>No credit card required</span>
            <span className="hidden sm:inline" aria-hidden="true">&middot;</span>
            <span>Free forever plan</span>
            <span className="hidden sm:inline" aria-hidden="true">&middot;</span>
            <span>Audits in under 2 minutes</span>
          </div>
        </div>
      </section>

      {/* ═══ Content Intelligence - Hero Feature (Differentiator) ═══ */}
      <section className="bg-gradient-to-br from-teal-50 via-white to-indigo-50/30 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-20 py-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-teal-100 text-teal-700 rounded-full text-xs font-semibold uppercase tracking-wider mb-6">
                <BookOpen className="w-3.5 h-3.5" />
                Only on Kritano
              </div>
              <h2 className="font-display text-4xl lg:text-5xl text-slate-900 leading-tight mb-5">
                Content intelligence that goes beyond keywords.
              </h2>
              <p className="text-lg text-slate-500 leading-relaxed mb-8">
                Kritano is the only audit tool that scores your content the way search engines evaluate it.
                E-E-A-T analysis, Answer Engine Optimisation, readability scoring, and engagement
                markers&mdash;unified into a single Content Quality Score.
              </p>
              <div className="space-y-3 mb-8">
                {[
                  'E-E-A-T scoring: Experience, Expertise, Authority, Trust',
                  'AEO analysis: How likely AI models are to cite your pages',
                  'Readability & engagement: Reading level, structure, CTAs',
                  '400+ content checks across 7 sub-modules',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2.5">
                    <CheckCircle className="w-4.5 h-4.5 text-teal-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-600">{item}</span>
                  </div>
                ))}
              </div>
              <Link to={ctaHref} className="inline-flex items-center gap-2 text-sm font-semibold text-teal-700 hover:text-teal-900 transition-colors">
                {mode === 'live' ? 'Try Content Intelligence free' : ctaLabel} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Visual: CQS score card mockup */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="relative">
                  <DemoRing score={78} size={80} strokeWidth={5} color="#14b8a6" />
                </div>
                <div>
                  <p className="text-xs font-medium text-teal-600 uppercase tracking-wider mb-1">Content Quality Score</p>
                  <p className="text-sm text-slate-500">Good &mdash; E-E-A-T and engagement need work</p>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Quality', score: 82, color: 'bg-emerald-500' },
                  { label: 'E-E-A-T', score: 71, color: 'bg-amber-500' },
                  { label: 'Readability', score: 76, color: 'bg-amber-500' },
                  { label: 'Engagement', score: 65, color: 'bg-orange-500' },
                  { label: 'Structure', score: 84, color: 'bg-emerald-500' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 w-20">{item.label}</span>
                    <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                      <div className={`${item.color} h-1.5 rounded-full transition-all`} style={{ width: `${item.score}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-slate-700 tabular-nums w-7 text-right">{item.score}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Core Capabilities - 4 compact cards ═══ */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-20 py-24">
          <div className="max-w-2xl mb-14">
            <p className="text-indigo-600 font-medium tracking-wide uppercase text-xs mb-4">
              Core Capabilities
            </p>
            <h2 className="font-display text-4xl lg:text-5xl text-slate-900 leading-tight mb-5">
              Six dimensions. One clear verdict.
            </h2>
            <p className="text-lg text-slate-500 leading-relaxed">
              Every audit covers SEO, accessibility, security, performance, content quality, and structured data.
              Findings are prioritised by real impact, not vanity metrics.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            <CapabilityCard
              icon={<TrendingUp className="w-5 h-5" />}
              accentColor="border-violet-400"
              iconColor="text-violet-600 bg-violet-50"
              title="SEO"
              description="Metadata, broken links, structured data, and Core Web Vitals."
              href="/services/seo"
            />
            <CapabilityCard
              icon={<Accessibility className="w-5 h-5" />}
              accentColor="border-emerald-400"
              iconColor="text-emerald-600 bg-emerald-50"
              title="Accessibility"
              description="WCAG 2.2 compliance, screen readers, keyboard navigation."
              href="/services/accessibility"
            />
            <CapabilityCard
              icon={<Shield className="w-5 h-5" />}
              accentColor="border-red-400"
              iconColor="text-red-600 bg-red-50"
              title="Security"
              description="HTTPS, headers, exposed files, cookie security."
              href="/services/security"
            />
            <CapabilityCard
              icon={<Zap className="w-5 h-5" />}
              accentColor="border-sky-400"
              iconColor="text-sky-700 bg-sky-50"
              title="Performance"
              description="Page speed, resource optimisation, caching, LCP/INP/CLS."
              href="/services/performance"
            />
          </div>

          <div className="mt-8 grid md:grid-cols-2 gap-5">
            <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-xl p-5 group hover:border-indigo-200 hover:shadow-sm transition-all">
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-0.5">PDF & CSV Reports</h3>
                <p className="text-xs text-slate-500">Export branded reports for clients and stakeholders.</p>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-xl p-5 group hover:border-indigo-200 hover:shadow-sm transition-all">
              <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
                <Search className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-0.5">Scheduled Audits & Trend Analytics</h3>
                <p className="text-xs text-slate-500">Automated monitoring with score history over time.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ How It Works - Horizontal stepper ═══ */}
      <section className="bg-slate-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-20 py-20">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-indigo-600 font-medium tracking-wide uppercase text-xs mb-4">
              How It Works
            </p>
            <h2 className="font-display text-4xl lg:text-5xl text-slate-900 leading-tight">
              Three steps to a healthier website
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-0">
            {[
              { number: '01', title: 'Enter your URL', description: 'Add your website and verify domain ownership. Our scanner is ready in seconds.', icon: Search },
              { number: '02', title: 'Run your audit', description: 'Kritano crawls your pages, checking 500+ SEO, accessibility, security, and performance rules.', icon: Zap },
              { number: '03', title: 'Act on insights', description: 'Review prioritised findings with fix guidance. Export reports. Track improvements over time.', icon: CheckCircle },
            ].map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.number} className="relative flex flex-col items-center text-center px-6 py-8">
                  {/* Connector line */}
                  {i < 2 && (
                    <div className="hidden md:block absolute top-[4.5rem] left-[calc(50%+2rem)] right-[calc(-50%+2rem)] h-px bg-slate-200" />
                  )}
                  <div className="relative z-10 w-14 h-14 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center mb-5">
                    <Icon className="w-6 h-6 text-indigo-600" />
                  </div>
                  <span className="text-xs font-semibold text-indigo-600 mb-2">{step.number}</span>
                  <h3 className="text-base font-semibold text-slate-900 mb-2">{step.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed max-w-xs">{step.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ Stats Section - Dark with pulse animation ═══ */}
      <section className="bg-slate-900 relative overflow-hidden">
        {/* Subtle animated glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[200px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none pulse-breathe" />
        <div className="max-w-7xl mx-auto px-6 lg:px-20 py-20 relative">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatItem value="6" label="Audit Categories" />
            <StatItem value="500+" label="Rules Checked" />
            <StatItem value="PDF" label="Export Reports" />
            <StatItem value="< 2min" label="Avg. Audit Time" />
          </div>
        </div>
      </section>

      {/* ═══ CTA Section ═══ */}
      <section>
        <div className="max-w-7xl mx-auto px-6 lg:px-20 py-24">
          <div className="bg-indigo-600 rounded-2xl p-12 md:p-16 relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:40px_40px]" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/30 rounded-full blur-3xl" />

            <div className="relative text-center max-w-2xl mx-auto">
              <h2 className="font-display text-4xl lg:text-5xl text-white leading-tight mb-6">
                {mode === 'waitlist' ? 'Be the first to know.' : mode === 'early_access' ? 'Join as a founding member.' : 'Ready to judge your website?'}
              </h2>
              <p className="text-lg text-indigo-200 leading-relaxed mb-10">
                {mode === 'waitlist'
                  ? 'Kritano is launching soon. Join the waitlist and be the first to audit your website across all six pillars.'
                  : mode === 'early_access'
                  ? 'Get a 30-day Agency trial and 50% off for life as a founding member. No credit card required.'
                  : 'Start your free audit today and discover what\'s holding your site back. No credit card required.'}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to={ctaHref}>
                  <Button variant="secondary" size="lg">
                    {ctaLabel}
                  </Button>
                </Link>
                {mode !== 'waitlist' && (
                  <Link to="/pricing">
                    <Button variant="ghost" size="lg" className="text-white hover:text-indigo-100 hover:bg-transparent">
                      View Pricing
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}


// =============================================
// Sub-components
// =============================================

function CapabilityCard({ icon, accentColor, iconColor, title, description, href }: {
  icon: React.ReactNode; accentColor: string; iconColor: string;
  title: string; description: string; href: string;
}) {
  return (
    <Link
      to={href}
      className={`bg-white border-t-[3px] ${accentColor} border border-slate-200 rounded-xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group block`}
    >
      <div className={`w-10 h-10 rounded-lg ${iconColor} flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}>
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">{title}</h3>
      <p className="text-slate-500 text-xs leading-relaxed">{description}</p>
    </Link>
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
