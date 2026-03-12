/**
 * Cookie Consent Context
 *
 * Manages GDPR-compliant cookie consent state.
 * Reads/writes localStorage, logs consent server-side, gates scripts by category.
 */

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { CookieConsent, CookieCategory } from '../types/consent.types';
import { consentApi } from '../services/api';
import CookieBanner from '../components/cookies/CookieBanner';
import CookiePreferencesModal from '../components/cookies/CookiePreferencesModal';

const STORAGE_KEY = 'pp-cookie-consent';
const CONSENT_VERSION = '1.0';

interface CookieConsentContextValue {
  consent: CookieConsent | null;
  showBanner: boolean;
  showPreferences: boolean;
  acceptAll: () => void;
  rejectAll: () => void;
  savePreferences: (categories: { analytics: boolean; marketing: boolean }) => void;
  openPreferences: () => void;
  closePreferences: () => void;
  hasConsent: (category: CookieCategory) => boolean;
}

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

function readStoredConsent(): CookieConsent | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookieConsent;
    if (parsed.version !== CONSENT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

function persistConsent(consent: CookieConsent): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
}

function logToServer(consent: CookieConsent): void {
  consentApi.logCookieConsent({
    consent_version: consent.version,
    categories: consent.categories,
    action: consent.action,
    page_url: window.location.href,
  }).catch(() => {});
}

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<CookieConsent | null>(() => readStoredConsent());
  const [showBanner, setShowBanner] = useState(!consent);
  const [showPreferences, setShowPreferences] = useState(false);

  // Re-check on mount (handles version mismatch)
  useEffect(() => {
    const stored = readStoredConsent();
    if (!stored) {
      setShowBanner(true);
    }
  }, []);

  const applyConsent = useCallback((newConsent: CookieConsent) => {
    setConsent(newConsent);
    persistConsent(newConsent);
    setShowBanner(false);
    setShowPreferences(false);
    logToServer(newConsent);
    window.dispatchEvent(new CustomEvent('cookieConsentChanged', { detail: newConsent }));
  }, []);

  const acceptAll = useCallback(() => {
    applyConsent({
      version: CONSENT_VERSION,
      categories: { necessary: true, analytics: true, marketing: true },
      action: 'accept_all',
      timestamp: new Date().toISOString(),
    });
  }, [applyConsent]);

  const rejectAll = useCallback(() => {
    applyConsent({
      version: CONSENT_VERSION,
      categories: { necessary: true, analytics: false, marketing: false },
      action: 'reject_all',
      timestamp: new Date().toISOString(),
    });
  }, [applyConsent]);

  const savePreferences = useCallback((categories: { analytics: boolean; marketing: boolean }) => {
    applyConsent({
      version: CONSENT_VERSION,
      categories: { necessary: true, ...categories },
      action: 'custom',
      timestamp: new Date().toISOString(),
    });
  }, [applyConsent]);

  const openPreferences = useCallback(() => {
    setShowPreferences(true);
  }, []);

  const closePreferences = useCallback(() => {
    setShowPreferences(false);
  }, []);

  const hasConsent = useCallback((category: CookieCategory): boolean => {
    if (category === 'necessary') return true;
    if (!consent) return false;
    return consent.categories[category] === true;
  }, [consent]);

  return (
    <CookieConsentContext.Provider value={{
      consent,
      showBanner,
      showPreferences,
      acceptAll,
      rejectAll,
      savePreferences,
      openPreferences,
      closePreferences,
      hasConsent,
    }}>
      {children}
      {showBanner && <CookieBanner />}
      {showPreferences && <CookiePreferencesModal />}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent(): CookieConsentContextValue {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) throw new Error('useCookieConsent must be used within CookieConsentProvider');
  return ctx;
}

export function useConsentGate(category: CookieCategory): boolean {
  const { hasConsent } = useCookieConsent();
  return hasConsent(category);
}
