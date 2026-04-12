/**
 * SEO Overrides Hook & Provider
 *
 * Fetches all SEO entries from the public API on app load and
 * provides a lookup function to merge overrides with defaults.
 */

import { createContext, useContext, useEffect, useState, createElement, type ReactNode } from 'react';
import { api } from '../services/api';

export interface SeoOverride {
  route_path: string;
  title: string | null;
  description: string | null;
  keywords: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image: string | null;
  og_type: string;
  twitter_card: string;
  canonical_url: string | null;
  featured_image: string | null;
  structured_data: Record<string, unknown> | null;
  noindex: boolean;
}

interface SeoContextValue {
  overrides: Map<string, SeoOverride>;
  loaded: boolean;
}

const SeoContext = createContext<SeoContextValue>({
  overrides: new Map(),
  loaded: false,
});

export function SeoProvider({ children }: { children: ReactNode }) {
  const [overrides, setOverrides] = useState<Map<string, SeoOverride>>(new Map());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api
      .get<{ entries: SeoOverride[] }>('/seo')
      .then((res) => {
        const map = new Map<string, SeoOverride>();
        for (const entry of res.data.entries) {
          map.set(entry.route_path, entry);
        }
        setOverrides(map);
      })
      .catch(() => {
        // Silent fail - defaults will be used
      })
      .finally(() => setLoaded(true));
  }, []);

  return createElement(SeoContext.Provider, { value: { overrides, loaded } }, children);
}

/**
 * Returns the SEO override for a given path, or undefined if none exists.
 */
export function useSeoOverride(path: string): SeoOverride | undefined {
  const { overrides } = useContext(SeoContext);
  return overrides.get(path);
}

/**
 * Returns all overrides (for the admin SEO page).
 */
export function useSeoOverrides(): SeoContextValue {
  return useContext(SeoContext);
}
