/**
 * Public Layout
 *
 * Shared layout for all public-facing pages (homepage, about, services, etc.).
 * Editorial design: white background, typography-focused, indigo accent bar logo.
 */

import { type ReactNode, useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useAdmin } from '../../contexts/AdminContext';
import { blogApi } from '../../services/api';
import { useCookieConsent } from '../../contexts/CookieConsentContext';
import { useSiteMode, type SiteMode } from '../../contexts/SiteModeContext';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import SkipLink from '../a11y/SkipLink';
import { Helmet } from 'react-helmet-async';
import { ArrowRight, Menu, X, ChevronDown, TrendingUp, Accessibility, Shield, Zap } from 'lucide-react';

const SERVICE_ITEMS = [
  { href: '/services/seo', label: 'SEO Auditing', icon: TrendingUp, description: 'Search engine optimisation analysis', color: 'hover:text-violet-600', iconHover: 'group-hover/item:bg-violet-50 group-hover/item:text-violet-600', activeColor: 'text-violet-600', activeIcon: 'bg-violet-100 text-violet-600' },
  { href: '/services/accessibility', label: 'Accessibility', icon: Accessibility, description: 'WCAG 2.2 compliance testing', color: 'hover:text-emerald-700', iconHover: 'group-hover/item:bg-emerald-50 group-hover/item:text-emerald-700', activeColor: 'text-emerald-700', activeIcon: 'bg-emerald-100 text-emerald-700' },
  { href: '/services/security', label: 'Security Scanning', icon: Shield, description: 'Vulnerability & threat detection', color: 'hover:text-red-700', iconHover: 'group-hover/item:bg-red-50 group-hover/item:text-red-700', activeColor: 'text-red-700', activeIcon: 'bg-red-100 text-red-700' },
  { href: '/services/performance', label: 'Performance', icon: Zap, description: 'Speed & Core Web Vitals', color: 'hover:text-sky-700', iconHover: 'group-hover/item:bg-sky-50 group-hover/item:text-sky-700', activeColor: 'text-sky-700', activeIcon: 'bg-sky-100 text-sky-700' },
];

function getNavLinks(mode: SiteMode) {
  const links = [
    { href: '/about', label: 'About' },
    { href: '/blog', label: 'Blog' },
    { href: '/contact', label: 'Contact' },
  ];
  if (mode !== 'waitlist') {
    links.unshift({ href: '/pricing', label: 'Pricing' });
  }
  if (mode !== 'waitlist') {
    links.push({ href: '/docs', label: 'API Docs' });
  }
  return links;
}

function getFooterLinks(mode: SiteMode, activeCategories: Set<string>) {
  const product = [
    { href: '/services', label: 'Services' },
  ];
  if (mode !== 'waitlist') {
    product.push({ href: '/pricing', label: 'Pricing' });
  }
  if (mode === 'waitlist') {
    product.push({ href: '/waitlist', label: 'Join Waitlist' });
  } else if (mode === 'early_access') {
    product.push({ href: '/register?ea=email', label: 'Join Early Access' });
  } else {
    product.push({ href: '/register', label: 'Get Started' });
  }

  const company = [
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
  ];

  const resources = [
    { href: '/blog', label: 'Blog' },
    { href: '/faq', label: 'FAQ' },
  ];
  if (activeCategories.has('guides')) {
    resources.push({ href: '/blog?category=guides', label: 'Guides' });
  }
  if (activeCategories.has('case-studies')) {
    resources.push({ href: '/blog?category=case-studies', label: 'Case Studies' });
  }
  if (mode !== 'waitlist') {
    resources.unshift({ href: '/docs', label: 'API Docs' });
    if (activeCategories.has('product-updates')) {
      resources.push({ href: '/blog?category=product-updates', label: 'Product Updates' });
    }
  }

  return { product, company, resources };
}

interface Props {
  children: ReactNode;
}

export function PublicLayout({ children }: Props) {
  const { isAuthenticated } = useAuth();
  const { isAdmin } = useAdmin();
  const { openPreferences: openCookiePreferences } = useCookieConsent();
  const mode = useSiteMode();
  const showDashboard = isAuthenticated && (mode !== 'waitlist' || isAdmin);

  // Force light mode on public pages
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark');
    root.classList.add('light');
    return () => {
      const stored = localStorage.getItem('kritano-theme');
      if (stored === 'dark' || (stored === 'system' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        root.classList.remove('light');
        root.classList.add('dark');
      }
    };
  }, []);
  const location = useLocation();
  const [activeCategories, setActiveCategories] = useState<Set<string>>(new Set());
  useEffect(() => {
    blogApi.getCategories()
      .then(({ data }) => {
        setActiveCategories(new Set(data.categories.map(c => c.category)));
      })
      .catch(() => {});
  }, []);
  const navLinks = useMemo(() => getNavLinks(mode), [mode]);
  const footerLinks = useMemo(() => getFooterLinks(mode, activeCategories), [mode, activeCategories]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const servicesDropdownRef = useRef<HTMLDivElement>(null);
  const servicesTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);
  useFocusTrap(mobileMenuOpen, mobileMenuRef, closeMobileMenu);

  const isServicesActive = location.pathname === '/services' || location.pathname.startsWith('/services/');

  // Close desktop dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (servicesDropdownRef.current && !servicesDropdownRef.current.contains(e.target as Node)) {
        setServicesOpen(false);
      }
    };
    if (servicesOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [servicesOpen]);

  // Close dropdowns and scroll to top on route change
  useEffect(() => {
    setServicesOpen(false);
    setMobileServicesOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="light min-h-screen flex flex-col bg-white" style={{ colorScheme: 'light' }}>
      <Helmet>
        <link rel="alternate" type="application/atom+xml" title="Kritano Blog" href="https://kritano.com/api/blog/feed.xml" />
      </Helmet>
      {location.pathname === '/' && (
        <Helmet>
          <link rel="prefetch" href="/services" />
          <link rel="prefetch" href="/pricing" />
          <link rel="prefetch" href="/blog" />
        </Helmet>
      )}
      <SkipLink />

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-100 dark:border-slate-700/50" aria-label="Main navigation">
        <div className="max-w-7xl mx-auto px-6 lg:px-20">
          <div className="flex items-center justify-between h-[72px]">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <img src="/brand/favicon-32.svg" alt="" role="presentation" width="32" height="32" fetchPriority="high" className="group-hover:scale-105 transition-transform" />
              <span className="font-display text-2xl text-slate-900 dark:text-white">Kritano</span>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden lg:flex items-center gap-10">
              {/* Services dropdown - first item */}
              <div
                ref={servicesDropdownRef}
                className="relative"
                onMouseEnter={() => {
                  clearTimeout(servicesTimeoutRef.current);
                  setServicesOpen(true);
                }}
                onMouseLeave={() => {
                  servicesTimeoutRef.current = setTimeout(() => setServicesOpen(false), 150);
                }}
              >
                <button
                  onClick={() => setServicesOpen(prev => !prev)}
                  className={`flex items-center gap-1 text-[15px] font-medium transition-colors ${
                    isServicesActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                  }`}
                  aria-expanded={servicesOpen}
                  aria-haspopup="true"
                >
                  Services
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${servicesOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown panel */}
                {servicesOpen && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 pt-3">
                    <div role="menu" aria-label="Services" className="w-[340px] bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 p-2">
                      <Link
                        to="/services"
                        role="menuitem"
                        className="flex items-center gap-1.5 px-3 py-2.5 mb-1 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                      >
                        All Services
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                      {SERVICE_ITEMS.map(item => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.href;
                        return (
                          <Link
                            key={item.href}
                            to={item.href}
                            role="menuitem"
                            className={`group/item flex items-start gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                              isActive
                                ? `bg-slate-50 dark:bg-slate-700/50 ${item.activeColor}`
                                : `text-slate-700 dark:text-slate-300 ${item.color} hover:bg-slate-50 dark:hover:bg-slate-700`
                            }`}
                          >
                            <div className={`mt-0.5 p-1.5 rounded-md transition-colors ${isActive ? item.activeIcon : `bg-slate-100 dark:bg-slate-700 ${item.iconHover}`}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-sm font-medium">{item.label}</div>
                              <div className="text-xs text-slate-600 dark:text-slate-400">{item.description}</div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Remaining nav links */}
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`text-[15px] font-medium transition-colors ${
                    location.pathname === link.href || location.pathname.startsWith(link.href + '/')
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-6">
              {showDashboard ? (
                <Link
                  to="/app/dashboard"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors text-sm"
                >
                  Dashboard
                </Link>
              ) : mode === 'waitlist' ? (
                <Link
                  to="/waitlist"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors text-sm"
                >
                  Join the Waitlist
                </Link>
              ) : mode === 'early_access' ? (
                <>
                  <Link
                    to="/login"
                    className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors font-medium text-sm"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register?ea=email"
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors text-sm"
                  >
                    Join Early Access
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors font-medium text-sm"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors text-sm"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div
            id="mobile-menu"
            ref={mobileMenuRef}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            className="md:hidden border-t border-slate-100 dark:border-slate-700/50 bg-white dark:bg-slate-900"
          >
            <div className="px-6 py-4 space-y-1">
              {/* Services - link + expandable sub-links */}
              <div>
                <div className="flex items-center justify-between">
                  <Link
                    to="/services"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex-1 py-3 text-base font-medium transition-colors ${
                      isServicesActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Services
                  </Link>
                  <button
                    onClick={() => setMobileServicesOpen(prev => !prev)}
                    className="p-2 text-slate-600 hover:text-slate-700 transition-colors"
                    aria-expanded={mobileServicesOpen}
                    aria-label="Expand service links"
                  >
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${mobileServicesOpen ? 'rotate-180' : ''}`} />
                  </button>
                </div>
                {mobileServicesOpen && (
                  <div className="pl-4 pb-2 space-y-1">
                    {SERVICE_ITEMS.map(item => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          to={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-2.5 py-2 text-sm font-medium transition-colors ${
                            location.pathname === item.href
                              ? item.activeColor
                              : `text-slate-600 dark:text-slate-400 ${item.color}`
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Remaining nav links */}
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block py-3 text-base font-medium transition-colors ${
                    location.pathname === link.href
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-700/50 space-y-3">
                {showDashboard ? (
                  <Link
                    to="/app/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full text-center px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium"
                  >
                    Dashboard
                  </Link>
                ) : mode === 'waitlist' ? (
                  <Link
                    to="/waitlist"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full text-center px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium"
                  >
                    Join the Waitlist
                  </Link>
                ) : mode === 'early_access' ? (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block text-center py-3 text-slate-600 dark:text-slate-400 font-medium"
                    >
                      Sign in
                    </Link>
                    <Link
                      to="/register?ea=email"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block w-full text-center px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium"
                    >
                      Join Early Access
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block text-center py-3 text-slate-600 dark:text-slate-400 font-medium"
                    >
                      Sign in
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block w-full text-center px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium"
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Page content */}
      <main id="main-content" aria-label="Page content" className="flex-grow">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700" aria-label="Site footer">
        <div className="max-w-7xl mx-auto px-6 lg:px-20 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-16">
            {/* Brand column */}
            <div className="col-span-2 md:col-span-1">
              <Link to="/" className="flex items-center gap-3 mb-4">
                <img src="/brand/favicon-32.svg" alt="" role="presentation" width="28" height="28" />
                <span className="font-display text-xl text-slate-900 dark:text-white">Kritano</span>
              </Link>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-xs mb-4">
                Comprehensive website auditing for SEO, accessibility, security, and performance.
              </p>
              <a href="mailto:info@kritano.com" className="text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors underline decoration-slate-300 underline-offset-2 hover:decoration-indigo-400">
                info@kritano.com
              </a>
            </div>

            {/* Product links */}
            <div>
              <h2 className="font-semibold text-sm text-slate-900 dark:text-white mb-4 uppercase tracking-wider">
                Product
              </h2>
              <ul className="space-y-3">
                {footerLinks.product.map(link => (
                  <li key={link.href}>
                    <Link to={link.href} className="text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors underline decoration-slate-300 dark:decoration-slate-600 underline-offset-2 hover:decoration-indigo-400">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company links */}
            <div>
              <h2 className="font-semibold text-sm text-slate-900 dark:text-white mb-4 uppercase tracking-wider">
                Company
              </h2>
              <ul className="space-y-3">
                {footerLinks.company.map(link => (
                  <li key={link.href}>
                    <Link to={link.href} className="text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors underline decoration-slate-300 dark:decoration-slate-600 underline-offset-2 hover:decoration-indigo-400">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources links */}
            <div>
              <h2 className="font-semibold text-sm text-slate-900 dark:text-white mb-4 uppercase tracking-wider">
                Resources
              </h2>
              <ul className="space-y-3">
                {footerLinks.resources.map(link => (
                  <li key={link.href}>
                    <Link to={link.href} className="text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors underline decoration-slate-300 dark:decoration-slate-600 underline-offset-2 hover:decoration-indigo-400">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-8 border-t border-slate-200 dark:border-slate-700 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              &copy; {new Date().getFullYear()} Kritano. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link to="/privacy" className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors underline decoration-slate-300 dark:decoration-slate-600 underline-offset-2">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors underline decoration-slate-300 dark:decoration-slate-600 underline-offset-2">
                Terms of Service
              </Link>
              <button
                onClick={openCookiePreferences}
                className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors underline decoration-slate-300 dark:decoration-slate-600 underline-offset-2"
              >
                Cookie Settings
              </button>
            </div>
          </div>
        </div>

        {/* CTA Banner */}
        <div className="bg-slate-900">
          <div className="max-w-7xl mx-auto px-6 lg:px-20 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-white font-medium text-sm">
              {mode === 'waitlist'
                ? 'Be the first to audit your website with Kritano.'
                : mode === 'early_access'
                ? 'Join as a founding member. 30-day Agency trial + 50% off for life.'
                : 'Judge your website before others do.'}
            </p>
            <Link
              to={mode === 'waitlist' ? '/waitlist' : mode === 'early_access' ? '/register?ea=email' : '/register'}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {mode === 'waitlist' ? 'Join the Waitlist' : mode === 'early_access' ? 'Join Early Access' : 'Start Free Audit'}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
