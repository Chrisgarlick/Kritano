"use strict";
/**
 * Wait Strategies Service
 *
 * Smart waiting logic for different types of pages including
 * SPAs, lazy-loaded content, and JavaScript-heavy sites.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectSPA = detectSPA;
exports.waitForDOMStability = waitForDOMStability;
exports.waitForLoadingIndicators = waitForLoadingIndicators;
exports.waitForImages = waitForImages;
exports.waitForLazyContent = waitForLazyContent;
exports.smartWait = smartWait;
exports.waitForSPAContent = waitForSPAContent;
/**
 * Common loading indicator selectors
 */
const LOADING_SELECTORS = [
    // Generic
    '.loading',
    '.spinner',
    '.loader',
    '.skeleton',
    '.placeholder',
    '#loading',
    '[data-loading]',
    '[aria-busy="true"]',
    // Framework specific
    '.v-skeleton-loader', // Vuetify
    '.ant-skeleton', // Ant Design
    '.MuiSkeleton-root', // Material UI
    '.chakra-skeleton', // Chakra UI
    '.bp3-skeleton', // Blueprint
    '[data-testid="loading"]',
    // Common patterns
    '.page-loading',
    '.content-loading',
    '.lazy-load',
    '.is-loading',
    '.loading-overlay',
];
/**
 * Detect if page is an SPA
 * Note: Uses simple inline checks to avoid esbuild __name helper issues in browser context
 */
async function detectSPA(page) {
    return page.evaluate(() => {
        const w = window;
        const d = document;
        // Check for common SPA frameworks using simple inline checks
        // Next.js
        if (w.__NEXT_DATA__ || d.querySelector('#__next')) {
            return { isSPA: true, framework: 'Next.js', confidence: 'high' };
        }
        // Nuxt.js
        if (w.__NUXT__ || d.querySelector('#__nuxt')) {
            return { isSPA: true, framework: 'Nuxt.js', confidence: 'high' };
        }
        // React
        if (w.React || d.querySelector('[data-reactroot]')) {
            return { isSPA: true, framework: 'React', confidence: 'high' };
        }
        // Vue.js
        if (w.Vue || d.querySelector('[data-v-app]') || d.querySelector('#app[data-server-rendered]')) {
            return { isSPA: true, framework: 'Vue.js', confidence: 'high' };
        }
        // Angular
        if (w.angular || w.ng || d.querySelector('[ng-app]') || d.querySelector('[ng-version]')) {
            return { isSPA: true, framework: 'Angular', confidence: 'high' };
        }
        // Svelte
        if (d.querySelector('[class*="svelte-"]')) {
            return { isSPA: true, framework: 'Svelte', confidence: 'high' };
        }
        // Gatsby
        if (d.querySelector('#___gatsby')) {
            return { isSPA: true, framework: 'Gatsby', confidence: 'high' };
        }
        // Remix
        if (w.__remixContext) {
            return { isSPA: true, framework: 'Remix', confidence: 'high' };
        }
        // Astro
        if (d.querySelector('[data-astro-cid]') || d.querySelector('astro-island')) {
            return { isSPA: true, framework: 'Astro', confidence: 'high' };
        }
        // Check for generic SPA indicators
        const hasPushState = !!(window.history && window.history.pushState);
        const hasHashRouter = window.location.hash.length > 1;
        const hasMinimalHTML = document.body.children.length <= 3;
        const hasRootContainer = !!d.querySelector('#app, #root, #main-app, [data-app]');
        if (hasRootContainer && hasMinimalHTML) {
            return { isSPA: true, framework: null, confidence: 'medium' };
        }
        if (hasPushState && hasHashRouter) {
            return { isSPA: true, framework: null, confidence: 'low' };
        }
        return { isSPA: false, framework: null, confidence: 'high' };
    });
}
/**
 * Wait for DOM to stabilize (content stops changing)
 * Note: Uses string-based function to avoid esbuild __name helper issues
 */
async function waitForDOMStability(page, options = {}) {
    const { checkIntervalMs = 500, stableChecks = 3, maxWaitMs = 10000, } = options;
    // Use addScriptTag with inline script to avoid esbuild function name issues
    await page.evaluate(`
    new Promise((resolve) => {
      var lastHTMLSize = 0;
      var lastHTMLHash = '';
      var stableCount = 0;
      var startTime = Date.now();
      var checkIntervalMs = ${checkIntervalMs};
      var stableChecks = ${stableChecks};
      var maxWaitMs = ${maxWaitMs};

      function getContentHash() {
        var html = document.body.innerHTML;
        var hash = 0;
        for (var i = 0; i < Math.min(html.length, 10000); i++) {
          hash = ((hash << 5) - hash) + html.charCodeAt(i);
          hash = hash & hash;
        }
        return html.length + ':' + hash;
      }

      function checkStability() {
        if (Date.now() - startTime > maxWaitMs) {
          resolve();
          return;
        }

        var currentHash = getContentHash();
        var currentSize = document.body.innerHTML.length;

        if (currentHash === lastHTMLHash && currentSize === lastHTMLSize) {
          stableCount++;
          if (stableCount >= stableChecks) {
            resolve();
            return;
          }
        } else {
          stableCount = 0;
          lastHTMLHash = currentHash;
          lastHTMLSize = currentSize;
        }

        setTimeout(checkStability, checkIntervalMs);
      }

      checkStability();
    })
  `);
}
/**
 * Wait for loading indicators to disappear
 */
async function waitForLoadingIndicators(page, options = {}) {
    const { selectors = LOADING_SELECTORS, timeoutMs = 5000, } = options;
    const startTime = Date.now();
    for (const selector of selectors) {
        // Check if we've exceeded timeout
        if (Date.now() - startTime > timeoutMs) {
            break;
        }
        try {
            // Check if element exists
            const element = await page.$(selector);
            if (element) {
                // Wait for it to be hidden with remaining timeout
                const remainingTimeout = Math.max(1000, timeoutMs - (Date.now() - startTime));
                await page.waitForSelector(selector, {
                    state: 'hidden',
                    timeout: remainingTimeout,
                });
            }
        }
        catch {
            // Element not found or didn't hide in time, continue
        }
    }
}
/**
 * Wait for images to load
 * Note: Uses string-based function to avoid esbuild __name helper issues
 */
async function waitForImages(page, options = {}) {
    const { selector = 'img', timeoutMs = 10000, } = options;
    await page.evaluate(`
    new Promise((resolve) => {
      var selector = ${JSON.stringify(selector)};
      var timeoutMs = ${timeoutMs};
      var images = document.querySelectorAll(selector);
      if (images.length === 0) {
        resolve();
        return;
      }

      var loaded = 0;
      var total = images.length;
      var timeout = setTimeout(resolve, timeoutMs);

      function checkComplete() {
        loaded++;
        if (loaded >= total) {
          clearTimeout(timeout);
          resolve();
        }
      }

      images.forEach(function(img) {
        if (img.complete) {
          checkComplete();
        } else {
          img.addEventListener('load', checkComplete);
          img.addEventListener('error', checkComplete);
        }
      });
    })
  `);
}
/**
 * Wait for lazy-loaded content
 * Note: Uses string-based function to avoid esbuild __name helper issues
 */
async function waitForLazyContent(page) {
    // Scroll to trigger lazy loading
    await page.evaluate(`
    new Promise((resolve) => {
      var scrollStep = window.innerHeight / 2;
      var maxScrolls = 10;
      var scrollCount = 0;

      function scroll() {
        if (scrollCount >= maxScrolls || window.scrollY + window.innerHeight >= document.body.scrollHeight) {
          window.scrollTo(0, 0);
          resolve();
          return;
        }

        window.scrollBy(0, scrollStep);
        scrollCount++;
        setTimeout(scroll, 200);
      }

      scroll();
    })
  `);
    // Wait for any triggered content to load
    await waitForDOMStability(page, { maxWaitMs: 3000 });
}
/**
 * Smart wait - combines multiple strategies
 */
async function smartWait(page, options = {}) {
    const { waitForNetworkIdle: doNetworkWait = true, waitForDOMStability: doDOMWait = true, waitForLoadingIndicators: doLoadingWait = true, waitForImages: doImageWait = false, detectSPA: doSPADetect = true, maxWaitMs = 15000, } = options;
    const startTime = Date.now();
    let spaResult = { isSPA: false, framework: null, confidence: 'high' };
    // Step 1: Wait for network idle (with timeout)
    if (doNetworkWait) {
        try {
            await page.waitForLoadState('networkidle', {
                timeout: Math.min(5000, maxWaitMs),
            });
        }
        catch {
            // Timeout is okay, continue
        }
    }
    // Step 2: Detect SPA
    if (doSPADetect) {
        try {
            spaResult = await detectSPA(page);
            // If SPA, wait longer for hydration
            if (spaResult.isSPA) {
                await page.waitForTimeout(1500);
            }
        }
        catch {
            // Detection failed, continue
        }
    }
    // Check remaining time
    const elapsed = Date.now() - startTime;
    if (elapsed >= maxWaitMs) {
        return {
            isSPA: spaResult.isSPA,
            framework: spaResult.framework,
            waitTimeMs: elapsed,
        };
    }
    // Step 3: Wait for DOM stability
    if (doDOMWait) {
        await waitForDOMStability(page, {
            maxWaitMs: Math.min(5000, maxWaitMs - elapsed),
        });
    }
    // Step 4: Wait for loading indicators
    if (doLoadingWait) {
        await waitForLoadingIndicators(page, {
            timeoutMs: Math.min(3000, maxWaitMs - (Date.now() - startTime)),
        });
    }
    // Step 5: Wait for images (optional)
    if (doImageWait) {
        await waitForImages(page, {
            timeoutMs: Math.min(5000, maxWaitMs - (Date.now() - startTime)),
        });
    }
    return {
        isSPA: spaResult.isSPA,
        framework: spaResult.framework,
        waitTimeMs: Date.now() - startTime,
    };
}
/**
 * Wait specifically for SPA content to render
 */
async function waitForSPAContent(page, options = {}) {
    const { framework, maxWaitMs = 10000 } = options;
    // Framework-specific waits
    if (framework === 'Next.js') {
        try {
            await page.waitForFunction(() => !window.__NEXT_DATA__?.props?.pageProps?.__N_SSG, { timeout: maxWaitMs });
        }
        catch {
            // Continue
        }
    }
    else if (framework === 'Nuxt.js') {
        try {
            await page.waitForFunction(() => window.$nuxt?.$loading?.loading === false, { timeout: maxWaitMs });
        }
        catch {
            // Continue
        }
    }
    // Generic SPA wait
    await waitForDOMStability(page, { maxWaitMs });
    await waitForLoadingIndicators(page);
}
//# sourceMappingURL=wait-strategies.service.js.map