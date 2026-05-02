import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useCookieConsent } from '../contexts/CookieConsentContext';

const GTM_ID = 'GTM-NK23K5SR';

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}

/**
 * Loads GTM and pushes virtual pageview events for non-app routes.
 * Only runs in production. Respects cookie consent.
 */
export function GTMRouteTracker() {
  const location = useLocation();
  const { hasConsent } = useCookieConsent();
  const gtmLoaded = useRef(false);

  // Load GTM after page is interactive to avoid blocking initial render
  useEffect(() => {
    if (!import.meta.env.PROD || gtmLoaded.current) return;

    const loadGTM = () => {
      if (gtmLoaded.current) return;

      window.dataLayer = window.dataLayer || [];

      // Set Secure + SameSite flags BEFORE GTM initialises so GA4 picks them up
      window.dataLayer.push({ cookie_flags: 'SameSite=Lax;Secure' });

      window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });

      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`;
      document.head.appendChild(script);

      // Add noscript iframe fallback
      const noscript = document.createElement('noscript');
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.googletagmanager.com/ns.html?id=${GTM_ID}`;
      iframe.height = '0';
      iframe.width = '0';
      iframe.style.display = 'none';
      iframe.style.visibility = 'hidden';
      noscript.appendChild(iframe);
      document.body.insertBefore(noscript, document.body.firstChild);

      gtmLoaded.current = true;
    };

    // Defer GTM until browser is idle, or after 3.5s max
    if ('requestIdleCallback' in window) {
      const id = requestIdleCallback(loadGTM, { timeout: 3500 });
      return () => cancelIdleCallback(id);
    } else {
      const timer = setTimeout(loadGTM, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Push pageview events for non-app routes
  useEffect(() => {
    if (!import.meta.env.PROD) return;

    if (location.pathname.startsWith('/app/') || location.pathname.startsWith('/admin')) {
      return;
    }

    if (!hasConsent('analytics')) {
      return;
    }

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'virtualPageview',
      pagePath: location.pathname + location.search,
      pageTitle: document.title,
    });
  }, [location, hasConsent]);

  return null;
}
