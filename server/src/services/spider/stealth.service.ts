/**
 * Stealth Service - Evasion techniques for bot detection bypass
 *
 * This service provides JavaScript injection scripts and browser configuration
 * to make automated browsing less detectable by anti-bot systems.
 */

import type { BrowserContext, Page } from 'playwright';

/**
 * Additional browser launch arguments for stealth mode
 */
export const STEALTH_BROWSER_ARGS = [
  '--disable-blink-features=AutomationControlled',  // Hide webdriver flag
  '--disable-features=IsolateOrigins,site-per-process',
  '--disable-site-isolation-trials',
  '--disable-web-security',
  '--allow-running-insecure-content',
  '--disable-infobars',
  '--window-position=0,0',
  '--ignore-certificate-errors',
  '--ignore-certificate-errors-spki-list',
];

/**
 * Evasion script to mask automation detection
 * This script is injected before any page scripts run
 */
export const STEALTH_EVASION_SCRIPT = `
  // ===========================================
  // 1. Mask navigator.webdriver
  // ===========================================
  Object.defineProperty(navigator, 'webdriver', {
    get: () => undefined,
    configurable: true,
  });

  // Delete webdriver property entirely if possible
  delete Object.getPrototypeOf(navigator).webdriver;

  // ===========================================
  // 2. Add realistic plugins array
  // ===========================================
  Object.defineProperty(navigator, 'plugins', {
    get: () => {
      const plugins = [
        {
          name: 'Chrome PDF Plugin',
          description: 'Portable Document Format',
          filename: 'internal-pdf-viewer',
          length: 1,
        },
        {
          name: 'Chrome PDF Viewer',
          description: 'Portable Document Format',
          filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai',
          length: 1,
        },
        {
          name: 'Native Client',
          description: 'Native Client Executable',
          filename: 'internal-nacl-plugin',
          length: 2,
        },
      ];

      // Make it behave like a PluginArray
      plugins.item = (index) => plugins[index] || null;
      plugins.namedItem = (name) => plugins.find(p => p.name === name) || null;
      plugins.refresh = () => {};

      return plugins;
    },
    configurable: true,
  });

  // ===========================================
  // 3. Add realistic mimeTypes
  // ===========================================
  Object.defineProperty(navigator, 'mimeTypes', {
    get: () => {
      const mimeTypes = [
        { type: 'application/pdf', suffixes: 'pdf', description: 'Portable Document Format' },
        { type: 'text/pdf', suffixes: 'pdf', description: 'Portable Document Format' },
      ];

      mimeTypes.item = (index) => mimeTypes[index] || null;
      mimeTypes.namedItem = (name) => mimeTypes.find(m => m.type === name) || null;

      return mimeTypes;
    },
    configurable: true,
  });

  // ===========================================
  // 4. Add languages array
  // ===========================================
  Object.defineProperty(navigator, 'languages', {
    get: () => ['en-GB', 'en-US', 'en'],
    configurable: true,
  });

  // ===========================================
  // 5. Fix permissions API
  // ===========================================
  if (navigator.permissions) {
    const originalQuery = navigator.permissions.query.bind(navigator.permissions);
    navigator.permissions.query = (parameters) => {
      if (parameters.name === 'notifications') {
        return Promise.resolve({ state: Notification.permission, onchange: null });
      }
      return originalQuery(parameters);
    };
  }

  // ===========================================
  // 6. Add Chrome runtime object
  // ===========================================
  if (!window.chrome) {
    window.chrome = {};
  }

  window.chrome.runtime = {
    connect: () => {},
    sendMessage: () => {},
    onMessage: { addListener: () => {} },
    onConnect: { addListener: () => {} },
    PlatformOs: { MAC: 'mac', WIN: 'win', ANDROID: 'android', CROS: 'cros', LINUX: 'linux', OPENBSD: 'openbsd' },
    PlatformArch: { ARM: 'arm', X86_32: 'x86-32', X86_64: 'x86-64' },
    PlatformNaclArch: { ARM: 'arm', X86_32: 'x86-32', X86_64: 'x86-64' },
    RequestUpdateCheckStatus: { THROTTLED: 'throttled', NO_UPDATE: 'no_update', UPDATE_AVAILABLE: 'update_available' },
    OnInstalledReason: { INSTALL: 'install', UPDATE: 'update', CHROME_UPDATE: 'chrome_update', SHARED_MODULE_UPDATE: 'shared_module_update' },
    OnRestartRequiredReason: { APP_UPDATE: 'app_update', OS_UPDATE: 'os_update', PERIODIC: 'periodic' },
  };

  window.chrome.csi = () => ({});
  window.chrome.loadTimes = () => ({
    commitLoadTime: Date.now() / 1000,
    connectionInfo: 'h2',
    finishDocumentLoadTime: Date.now() / 1000,
    finishLoadTime: Date.now() / 1000,
    firstPaintAfterLoadTime: 0,
    firstPaintTime: Date.now() / 1000,
    navigationType: 'navigate',
    npnNegotiatedProtocol: 'h2',
    requestTime: Date.now() / 1000,
    startLoadTime: Date.now() / 1000,
    wasAlternateProtocolAvailable: false,
    wasFetchedViaSpdy: true,
    wasNpnNegotiated: true,
  });
  window.chrome.app = {
    isInstalled: false,
    InstallState: { DISABLED: 'disabled', INSTALLED: 'installed', NOT_INSTALLED: 'not_installed' },
    RunningState: { CANNOT_RUN: 'cannot_run', READY_TO_RUN: 'ready_to_run', RUNNING: 'running' },
  };

  // ===========================================
  // 7. Remove automation-specific properties
  // ===========================================
  // Remove Playwright/Puppeteer specific properties
  const propsToDelete = [
    'cdc_adoQpoasnfa76pfcZLmcfl_Array',
    'cdc_adoQpoasnfa76pfcZLmcfl_Promise',
    'cdc_adoQpoasnfa76pfcZLmcfl_Symbol',
    '__playwright',
    '__pw_manual',
    '__PW_inspect',
  ];

  for (const prop of propsToDelete) {
    try {
      delete window[prop];
    } catch (e) {}
  }

  // ===========================================
  // 8. Fix iframe contentWindow
  // ===========================================
  // Ensure iframes have proper contentWindow
  const originalAttachShadow = Element.prototype.attachShadow;
  Element.prototype.attachShadow = function(init) {
    return originalAttachShadow.call(this, { ...init, mode: 'open' });
  };

  // ===========================================
  // 9. Spoof screen dimensions
  // ===========================================
  Object.defineProperty(screen, 'availWidth', { get: () => window.innerWidth, configurable: true });
  Object.defineProperty(screen, 'availHeight', { get: () => window.innerHeight, configurable: true });
  Object.defineProperty(screen, 'colorDepth', { get: () => 24, configurable: true });
  Object.defineProperty(screen, 'pixelDepth', { get: () => 24, configurable: true });

  // ===========================================
  // 10. Fix WebGL vendor/renderer
  // ===========================================
  const getParameterProxyHandler = {
    apply: function(target, thisArg, argumentsList) {
      const param = argumentsList[0];
      const gl = thisArg;

      // UNMASKED_VENDOR_WEBGL
      if (param === 37445) {
        return 'Intel Inc.';
      }
      // UNMASKED_RENDERER_WEBGL
      if (param === 37446) {
        return 'Intel Iris OpenGL Engine';
      }

      return Reflect.apply(target, thisArg, argumentsList);
    }
  };

  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl) {
      const originalGetParameter = gl.getParameter.bind(gl);
      WebGLRenderingContext.prototype.getParameter = new Proxy(originalGetParameter, getParameterProxyHandler);
    }

    const gl2 = canvas.getContext('webgl2');
    if (gl2) {
      const originalGetParameter2 = gl2.getParameter.bind(gl2);
      WebGL2RenderingContext.prototype.getParameter = new Proxy(originalGetParameter2, getParameterProxyHandler);
    }
  } catch (e) {}

  // ===========================================
  // 11. Mask automation timing
  // ===========================================
  // Add slight randomness to performance.now() to prevent timing analysis
  const originalNow = performance.now.bind(performance);
  performance.now = () => originalNow() + (Math.random() * 0.1);

  console.log('[Stealth] Evasion scripts loaded');
`;

/**
 * Apply stealth evasion to a browser context
 */
export async function applyStealthToContext(context: BrowserContext): Promise<void> {
  // Add init script that runs before any page scripts
  await context.addInitScript(STEALTH_EVASION_SCRIPT);
}

/**
 * Apply stealth evasion to a specific page
 * Use this for pages created outside of the stealth context
 */
export async function applyStealthToPage(page: Page): Promise<void> {
  await page.addInitScript(STEALTH_EVASION_SCRIPT);
}

/**
 * Verify stealth is working by checking navigator.webdriver
 */
export async function verifyStealthActive(page: Page): Promise<boolean> {
  try {
    const webdriverValue = await page.evaluate(() => navigator.webdriver);
    return webdriverValue === undefined || webdriverValue === false;
  } catch {
    return false;
  }
}
