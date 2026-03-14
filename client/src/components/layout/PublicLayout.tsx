/**
 * Public Layout
 *
 * Shared layout for all public-facing pages (homepage, about, services, etc.).
 * Editorial design: white background, typography-focused, indigo accent bar logo.
 */

import { type ReactNode, useState, useRef, useCallback, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCookieConsent } from '../../contexts/CookieConsentContext';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import SkipLink from '../a11y/SkipLink';
import { ArrowRight, Menu, X, ChevronDown, TrendingUp, Accessibility, Shield, Zap } from 'lucide-react';

const SERVICE_ITEMS = [
  { href: '/services/seo', label: 'SEO Auditing', icon: TrendingUp, description: 'Search engine optimisation analysis' },
  { href: '/services/accessibility', label: 'Accessibility', icon: Accessibility, description: 'WCAG 2.2 compliance testing' },
  { href: '/services/security', label: 'Security Scanning', icon: Shield, description: 'Vulnerability & threat detection' },
  { href: '/services/performance', label: 'Performance', icon: Zap, description: 'Speed & Core Web Vitals' },
];

const NAV_LINKS = [
  { href: '/pricing', label: 'Pricing' },
  { href: '/about', label: 'About' },
  { href: '/blog', label: 'Blog' },
  { href: '/contact', label: 'Contact' },
  { href: '/docs', label: 'API Docs' },
];

const FOOTER_LINKS = {
  product: [
    { href: '/services', label: 'Services' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/blog', label: 'Blog' },
    { href: '/register', label: 'Get Started' },
  ],
  company: [
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
  ],
  resources: [
    { href: '/docs', label: 'API Docs' },
    { href: '/blog?category=guides', label: 'Guides' },
    { href: '/blog?category=case-studies', label: 'Case Studies' },
    { href: '/blog?category=product-updates', label: 'Product Updates' },
  ],
};

interface Props {
  children: ReactNode;
}

export function PublicLayout({ children }: Props) {
  const { isAuthenticated } = useAuth();
  const { openPreferences: openCookiePreferences } = useCookieConsent();
  const location = useLocation();
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
    <div className="min-h-screen flex flex-col bg-white">
      <SkipLink />

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100" aria-label="Main navigation">
        <div className="max-w-7xl mx-auto px-6 lg:px-20">
          <div className="flex items-center justify-between h-[72px]">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-2 h-8 bg-indigo-600 rounded-sm group-hover:bg-indigo-500 transition-colors" />
              <span className="font-display text-2xl text-slate-900">PagePulser</span>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-10">
              {/* Services dropdown — first item */}
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
                    isServicesActive ? 'text-indigo-600' : 'text-slate-600 hover:text-indigo-600'
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
                    <div className="w-[340px] bg-white rounded-xl border border-slate-200 shadow-lg shadow-slate-200/50 p-2">
                      <Link
                        to="/services"
                        className="block px-3 py-2 mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-indigo-600 transition-colors"
                      >
                        All Services
                      </Link>
                      {SERVICE_ITEMS.map(item => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.href;
                        return (
                          <Link
                            key={item.href}
                            to={item.href}
                            className={`flex items-start gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                              isActive
                                ? 'bg-indigo-50 text-indigo-600'
                                : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <div className={`mt-0.5 p-1.5 rounded-md ${isActive ? 'bg-indigo-100' : 'bg-slate-100'}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-sm font-medium">{item.label}</div>
                              <div className="text-xs text-slate-500">{item.description}</div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Remaining nav links */}
              {NAV_LINKS.map(link => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`text-[15px] font-medium transition-colors ${
                    location.pathname === link.href || location.pathname.startsWith(link.href + '/')
                      ? 'text-indigo-600'
                      : 'text-slate-600 hover:text-indigo-600'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-6">
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium transition-colors text-sm"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-slate-600 hover:text-slate-900 transition-colors font-medium text-sm"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium transition-colors text-sm"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900"
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
            className="md:hidden border-t border-slate-100 bg-white"
          >
            <div className="px-6 py-4 space-y-1">
              {/* Services — first, with expandable sub-links */}
              <div>
                <button
                  onClick={() => setMobileServicesOpen(prev => !prev)}
                  className={`flex items-center justify-between w-full py-3 text-base font-medium transition-colors ${
                    isServicesActive ? 'text-indigo-600' : 'text-slate-600'
                  }`}
                  aria-expanded={mobileServicesOpen}
                >
                  Services
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${mobileServicesOpen ? 'rotate-180' : ''}`} />
                </button>
                {mobileServicesOpen && (
                  <div className="pl-4 pb-2 space-y-1">
                    <Link
                      to="/services"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-2 text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors"
                    >
                      All Services
                    </Link>
                    {SERVICE_ITEMS.map(item => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          to={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-2.5 py-2 text-sm font-medium transition-colors ${
                            location.pathname === item.href
                              ? 'text-indigo-600'
                              : 'text-slate-600 hover:text-slate-900'
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
              {NAV_LINKS.map(link => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block py-3 text-base font-medium transition-colors ${
                    location.pathname === link.href
                      ? 'text-indigo-600'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                {isAuthenticated ? (
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full text-center px-5 py-3 bg-slate-900 text-white rounded-lg font-medium"
                  >
                    Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block text-center py-3 text-slate-600 font-medium"
                    >
                      Sign in
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block w-full text-center px-5 py-3 bg-slate-900 text-white rounded-lg font-medium"
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
      <main id="main-content" className="flex-grow">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200" aria-label="Site footer">
        <div className="max-w-7xl mx-auto px-6 lg:px-20 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-16">
            {/* Brand column */}
            <div className="col-span-2 md:col-span-1">
              <Link to="/" className="flex items-center gap-3 mb-4">
                <div className="w-2 h-7 bg-indigo-600 rounded-sm" />
                <span className="font-display text-xl text-slate-900">PagePulser</span>
              </Link>
              <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
                Comprehensive website auditing for SEO, accessibility, security, and performance.
              </p>
            </div>

            {/* Product links */}
            <div>
              <h4 className="font-semibold text-sm text-slate-900 mb-4 uppercase tracking-wider">
                Product
              </h4>
              <ul className="space-y-3">
                {FOOTER_LINKS.product.map(link => (
                  <li key={link.href}>
                    <Link to={link.href} className="text-sm text-slate-500 hover:text-indigo-600 transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company links */}
            <div>
              <h4 className="font-semibold text-sm text-slate-900 mb-4 uppercase tracking-wider">
                Company
              </h4>
              <ul className="space-y-3">
                {FOOTER_LINKS.company.map(link => (
                  <li key={link.href}>
                    <Link to={link.href} className="text-sm text-slate-500 hover:text-indigo-600 transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources links */}
            <div>
              <h4 className="font-semibold text-sm text-slate-900 mb-4 uppercase tracking-wider">
                Resources
              </h4>
              <ul className="space-y-3">
                {FOOTER_LINKS.resources.map(link => (
                  <li key={link.href}>
                    <Link to={link.href} className="text-sm text-slate-500 hover:text-indigo-600 transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500">
              &copy; {new Date().getFullYear()} PagePulser. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link to="/privacy" className="text-sm text-slate-500 hover:text-slate-700 transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-sm text-slate-500 hover:text-slate-700 transition-colors">
                Terms of Service
              </Link>
              <button
                onClick={openCookiePreferences}
                className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
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
              Ready to check your website's health?
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Start Free Audit
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
