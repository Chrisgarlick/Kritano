/**
 * Homepage — Phase 1 (Foundation)
 *
 * Simple landing page showcasing the brand identity.
 * Will be replaced with full editorial landing page in later phases.
 */

import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Nav */}
      <nav className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="font-display text-xl text-slate-900 dark:text-white">PagePulser</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <main className="max-w-7xl mx-auto px-6 py-24 text-center">
        <h1 className="font-display text-display-xl text-slate-900 dark:text-white mb-6">
          See What Others Miss
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10 font-sans">
          PagePulser reveals hidden SEO, accessibility, security, and performance
          issues on your website. Comprehensive audits powered by real browser analysis.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            to="/register"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors shadow-lg shadow-indigo-500/25"
          >
            Start Free Audit
          </Link>
          <Link
            to="/about"
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium px-6 py-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Learn More
          </Link>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-24">
          {[
            { title: 'SEO Analysis', desc: 'Meta tags, sitemaps, internal links, and Core Web Vitals', color: 'indigo' },
            { title: 'Accessibility', desc: 'WCAG 2.1/2.2 compliance with axe-core integration', color: 'emerald' },
            { title: 'Security', desc: 'Headers, mixed content, HTTPS, and exposed files', color: 'amber' },
            { title: 'Performance', desc: 'Page load, image optimization, and compression analysis', color: 'rose' },
          ].map((feature) => (
            <div
              key={feature.title}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 text-left shadow-sm hover:shadow-md transition-shadow"
            >
              <div className={`w-10 h-10 rounded-lg bg-${feature.color}-100 dark:bg-${feature.color}-900/30 flex items-center justify-center mb-4`}>
                <div className={`w-5 h-5 rounded bg-${feature.color}-500`} />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-slate-500 dark:text-slate-400">
          &copy; {new Date().getFullYear()} PagePulser. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
