import { useEffect, useRef, useCallback } from 'react';

declare global {
  interface Window {
    trends?: {
      embed: {
        renderExploreWidget: (
          type: string,
          config: Record<string, unknown>,
          options: Record<string, unknown>
        ) => void;
      };
    };
  }
}

interface GoogleTrendsEmbedProps {
  keyword: string;
  comparisonKeywords?: string[];
  type: 'TIMESERIES' | 'GEO_MAP' | 'RELATED_QUERIES';
  geo?: string;
  time?: string;
  className?: string;
}

let scriptLoaded = false;
let scriptLoading = false;
const loadCallbacks: Array<() => void> = [];

function loadEmbedScript(): Promise<void> {
  if (scriptLoaded) return Promise.resolve();

  return new Promise((resolve) => {
    if (scriptLoading) {
      loadCallbacks.push(resolve);
      return;
    }

    scriptLoading = true;
    const script = document.createElement('script');
    script.src = 'https://ssl.gstatic.com/trends_nrtr/3728_RC01/embed_loader.js';
    script.async = true;
    script.onload = () => {
      scriptLoaded = true;
      scriptLoading = false;
      resolve();
      loadCallbacks.forEach((cb) => cb());
      loadCallbacks.length = 0;
    };
    script.onerror = () => {
      scriptLoading = false;
      resolve();
    };
    document.head.appendChild(script);
  });
}

export function GoogleTrendsEmbed({
  keyword,
  comparisonKeywords = [],
  type,
  geo = '',
  time = 'today 12-m',
  className = '',
}: GoogleTrendsEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const renderWidget = useCallback(async () => {
    if (!containerRef.current) return;

    // Clear previous content
    containerRef.current.innerHTML = '';

    await loadEmbedScript();

    if (!window.trends) return;

    const allKeywords = [keyword, ...comparisonKeywords].filter(Boolean);
    const comparisonItem = allKeywords.map((kw) => ({
      keyword: kw,
      geo,
      time,
    }));

    const queryParts = allKeywords.map((kw) => encodeURIComponent(kw)).join(',');
    const exploreQuery = `geo=${encodeURIComponent(geo)}&q=${queryParts}&date=${encodeURIComponent(time)}`;

    try {
      window.trends.embed.renderExploreWidget(
        type,
        {
          comparisonItem,
          category: 0,
          property: '',
        },
        {
          exploreQuery,
          guestPath: 'https://trends.google.com:443/trends/embed/',
        }
      );
    } catch {
      // Google Trends embed can throw in some browser environments
    }
  }, [keyword, comparisonKeywords, type, geo, time]);

  useEffect(() => {
    renderWidget();
  }, [renderWidget]);

  return (
    <div
      ref={containerRef}
      className={`google-trends-embed min-h-[300px] ${className}`}
    />
  );
}
