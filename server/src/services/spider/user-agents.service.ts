/**
 * User Agent Rotation Service
 *
 * Provides realistic, rotating user agents to avoid fingerprinting
 * and make requests appear to come from different browsers.
 */

export interface UserAgentConfig {
  userAgent: string;
  platform: string;
  mobile: boolean;
  brands: Array<{ brand: string; version: string }>;
}

/**
 * Modern desktop user agents (updated for 2024/2025)
 */
const DESKTOP_USER_AGENTS: UserAgentConfig[] = [
  // Chrome on Windows (most common)
  {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    platform: 'Win32',
    mobile: false,
    brands: [
      { brand: 'Chromium', version: '122' },
      { brand: 'Not(A:Brand', version: '24' },
      { brand: 'Google Chrome', version: '122' },
    ],
  },
  {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    platform: 'Win32',
    mobile: false,
    brands: [
      { brand: 'Chromium', version: '121' },
      { brand: 'Not A(Brand', version: '99' },
      { brand: 'Google Chrome', version: '121' },
    ],
  },
  {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    platform: 'Win32',
    mobile: false,
    brands: [
      { brand: 'Chromium', version: '120' },
      { brand: 'Not_A Brand', version: '8' },
      { brand: 'Google Chrome', version: '120' },
    ],
  },

  // Chrome on macOS
  {
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    platform: 'MacIntel',
    mobile: false,
    brands: [
      { brand: 'Chromium', version: '122' },
      { brand: 'Not(A:Brand', version: '24' },
      { brand: 'Google Chrome', version: '122' },
    ],
  },
  {
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    platform: 'MacIntel',
    mobile: false,
    brands: [
      { brand: 'Chromium', version: '121' },
      { brand: 'Not A(Brand', version: '99' },
      { brand: 'Google Chrome', version: '121' },
    ],
  },

  // Firefox on Windows
  {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
    platform: 'Win32',
    mobile: false,
    brands: [], // Firefox doesn't use brands
  },
  {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
    platform: 'Win32',
    mobile: false,
    brands: [],
  },

  // Firefox on macOS
  {
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:123.0) Gecko/20100101 Firefox/123.0',
    platform: 'MacIntel',
    mobile: false,
    brands: [],
  },

  // Edge on Windows
  {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0',
    platform: 'Win32',
    mobile: false,
    brands: [
      { brand: 'Chromium', version: '122' },
      { brand: 'Not(A:Brand', version: '24' },
      { brand: 'Microsoft Edge', version: '122' },
    ],
  },

  // Safari on macOS
  {
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
    platform: 'MacIntel',
    mobile: false,
    brands: [],
  },

  // Chrome on Linux
  {
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    platform: 'Linux x86_64',
    mobile: false,
    brands: [
      { brand: 'Chromium', version: '122' },
      { brand: 'Not(A:Brand', version: '24' },
      { brand: 'Google Chrome', version: '122' },
    ],
  },
];

/**
 * Mobile user agents
 */
const MOBILE_USER_AGENTS: UserAgentConfig[] = [
  // iPhone Safari
  {
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    platform: 'iPhone',
    mobile: true,
    brands: [],
  },
  {
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    platform: 'iPhone',
    mobile: true,
    brands: [],
  },

  // Android Chrome
  {
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36',
    platform: 'Linux armv81',
    mobile: true,
    brands: [
      { brand: 'Chromium', version: '122' },
      { brand: 'Not(A:Brand', version: '24' },
      { brand: 'Google Chrome', version: '122' },
    ],
  },
  {
    userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36',
    platform: 'Linux armv81',
    mobile: true,
    brands: [
      { brand: 'Chromium', version: '122' },
      { brand: 'Not(A:Brand', version: '24' },
      { brand: 'Google Chrome', version: '122' },
    ],
  },
];

/**
 * Common viewport sizes for different device types
 */
export const VIEWPORTS = {
  desktop: [
    { width: 1920, height: 1080 },  // Full HD (most common)
    { width: 1366, height: 768 },   // Common laptop
    { width: 1536, height: 864 },   // Scaled laptop
    { width: 1440, height: 900 },   // MacBook Pro
    { width: 1280, height: 720 },   // HD
    { width: 2560, height: 1440 },  // QHD
    { width: 1680, height: 1050 },  // WSXGA+
  ],
  mobile: [
    { width: 390, height: 844 },    // iPhone 14
    { width: 393, height: 873 },    // Pixel 8
    { width: 412, height: 915 },    // Samsung Galaxy S21
    { width: 375, height: 812 },    // iPhone X/11/12 Mini
    { width: 428, height: 926 },    // iPhone 14 Plus
  ],
};

/**
 * Get a random user agent configuration
 */
export function getRandomUserAgent(type: 'desktop' | 'mobile' = 'desktop'): UserAgentConfig {
  const agents = type === 'desktop' ? DESKTOP_USER_AGENTS : MOBILE_USER_AGENTS;
  return agents[Math.floor(Math.random() * agents.length)];
}

/**
 * Get a random viewport size
 */
export function getRandomViewport(type: 'desktop' | 'mobile' = 'desktop'): { width: number; height: number } {
  const viewports = VIEWPORTS[type];
  return viewports[Math.floor(Math.random() * viewports.length)];
}

/**
 * Get random accept-language header
 */
export function getRandomAcceptLanguage(): string {
  const languages = [
    'en-GB,en;q=0.9',
    'en-US,en;q=0.9',
    'en-GB,en-US;q=0.9,en;q=0.8',
    'en-US,en;q=0.9,en-GB;q=0.8',
    'en;q=0.9',
  ];
  return languages[Math.floor(Math.random() * languages.length)];
}

/**
 * Get randomized HTTP headers for a request
 */
export function getRandomHeaders(userAgentConfig: UserAgentConfig): Record<string, string> {
  const headers: Record<string, string> = {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Language': getRandomAcceptLanguage(),
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
  };

  // Add Sec-CH-UA headers for Chromium-based browsers
  if (userAgentConfig.brands.length > 0) {
    const brandString = userAgentConfig.brands
      .map(b => `"${b.brand}";v="${b.version}"`)
      .join(', ');
    headers['Sec-Ch-Ua'] = brandString;
    headers['Sec-Ch-Ua-Mobile'] = userAgentConfig.mobile ? '?1' : '?0';
    headers['Sec-Ch-Ua-Platform'] = userAgentConfig.platform.includes('Win') ? '"Windows"' :
                                     userAgentConfig.platform.includes('Mac') ? '"macOS"' :
                                     userAgentConfig.platform.includes('Linux') ? '"Linux"' : '"Unknown"';
  }

  return headers;
}

/**
 * Generate a complete browser fingerprint for a session
 */
export interface BrowserFingerprint {
  userAgent: UserAgentConfig;
  viewport: { width: number; height: number };
  headers: Record<string, string>;
  locale: string;
  timezone: string;
}

/**
 * Common timezones weighted by population
 */
const TIMEZONES = [
  'Europe/London',
  'America/New_York',
  'America/Los_Angeles',
  'America/Chicago',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Australia/Sydney',
];

/**
 * Generate a complete, consistent browser fingerprint
 */
export function generateFingerprint(type: 'desktop' | 'mobile' = 'desktop'): BrowserFingerprint {
  const userAgent = getRandomUserAgent(type);
  const viewport = getRandomViewport(type);
  const headers = getRandomHeaders(userAgent);

  // Match locale to accept-language
  const locale = headers['Accept-Language'].startsWith('en-GB') ? 'en-GB' : 'en-US';
  const timezone = TIMEZONES[Math.floor(Math.random() * TIMEZONES.length)];

  return {
    userAgent,
    viewport,
    headers,
    locale,
    timezone,
  };
}
