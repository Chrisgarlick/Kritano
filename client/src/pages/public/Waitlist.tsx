import { useState } from 'react';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { comingSoonApi } from '../../services/api';
import PageSeo from '../../components/seo/PageSeo';

export default function WaitlistPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    try {
      await comingSoonApi.signup({ email, name: name || undefined });
      setStatus('success');
    } catch (err: unknown) {
      setStatus('error');
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
        : undefined;
      setError(msg || 'Something went wrong. Please try again.');
    }
  };

  return (
    <PublicLayout>
      <PageSeo
        title="Join the Waitlist - Early Access to Website Auditing"
        description="Be the first to audit your website with Kritano. Sign up to get early access to comprehensive SEO, accessibility, security, and performance auditing."
        path="/waitlist"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'Kritano Waitlist',
          description: 'Sign up to be notified when Kritano launches.',
          url: 'https://kritano.com/waitlist',
        }}
      />

      <div className="min-h-screen bg-white dark:bg-slate-950">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-amber-50/30 dark:from-indigo-950/20 dark:via-slate-950 dark:to-slate-950" />
          <div className="relative max-w-7xl mx-auto px-6 lg:px-20 pt-20 lg:pt-28 pb-16 text-center">
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-slate-900 dark:text-white leading-tight">
              Join the Waitlist
            </h1>
            <h2 className="font-display text-2xl lg:text-3xl text-slate-500 dark:text-slate-400 leading-snug mt-4 mb-6">
              Be the first to audit your website with Kritano.
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Kritano audits your website across six pillars -- accessibility, SEO, security, performance, content quality, and AI readiness -- all in one scan.
            </p>

            {status === 'success' ? (
              <div className="mt-10 inline-flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-6 py-4 rounded-xl">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-lg font-medium">You're on the list. We'll be in touch.</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-10 max-w-md mx-auto">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    placeholder="Name (optional)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="flex-1 px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                  <input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="flex-1 px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="mt-3 w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {status === 'loading' ? 'Joining...' : 'Join the Waitlist'}
                </button>
                {status === 'error' && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
                )}
              </form>
            )}
          </div>
        </section>

        {/* Feature Preview */}
        <section className="max-w-6xl mx-auto px-6 py-20">
          <h2 className="font-display text-3xl text-slate-900 dark:text-white text-center mb-12">
            Six pillars. One audit.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: 'Accessibility', desc: 'WCAG compliance, screen reader support, keyboard navigation', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
              { name: 'SEO', desc: 'Meta tags, structured data, indexability, Core Web Vitals', color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/20' },
              { name: 'Security', desc: 'HTTPS, headers, mixed content, vulnerability detection', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' },
              { name: 'Performance', desc: 'Page speed, resource optimisation, render-blocking assets', color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-900/20' },
              { name: 'Content Quality', desc: 'Readability, E-E-A-T signals, content structure', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
              { name: 'AI Readiness', desc: 'Schema markup, structured data, AI crawler accessibility', color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
            ].map((pillar) => (
              <div key={pillar.name} className={`${pillar.bg} rounded-xl p-6`}>
                <h3 className={`text-lg font-semibold ${pillar.color}`}>{pillar.name}</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{pillar.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
