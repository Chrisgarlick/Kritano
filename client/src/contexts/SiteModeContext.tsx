import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { comingSoonApi } from '../services/api';

export type SiteMode = 'waitlist' | 'early_access' | 'live';

interface SiteModeContextType {
  mode: SiteMode;
  isLoading: boolean;
}

const SiteModeContext = createContext<SiteModeContextType>({ mode: 'live', isLoading: true });

const CACHE_KEY = 'kritano-site-mode';
const CACHE_TTL = 60_000; // 60 seconds

export function SiteModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<SiteMode>('live');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check sessionStorage cache first
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const { mode: cachedMode, ts } = JSON.parse(cached);
        if (Date.now() - ts < CACHE_TTL) {
          setMode(cachedMode);
          setIsLoading(false);
          return;
        }
      }
    } catch {
      // Ignore parse errors
    }

    comingSoonApi.getStatus()
      .then((res) => {
        const m = res.data.mode || (res.data.enabled ? 'waitlist' : 'live');
        setMode(m);
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ mode: m, ts: Date.now() }));
      })
      .catch(() => {
        // Default to live on error so the site isn't broken
        setMode('live');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return (
    <SiteModeContext.Provider value={{ mode, isLoading }}>
      {children}
    </SiteModeContext.Provider>
  );
}

export function useSiteMode(): SiteMode {
  const { mode } = useContext(SiteModeContext);
  return mode;
}

export function useSiteModeLoading(): boolean {
  const { isLoading } = useContext(SiteModeContext);
  return isLoading;
}
