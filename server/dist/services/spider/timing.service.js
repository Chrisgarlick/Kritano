"use strict";
/**
 * Timing Service - Human-Like Request Delays
 *
 * Provides randomized timing to make requests appear more human-like
 * and avoid detection by timing-based bot detection.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimingController = exports.POLITE_TIMING = exports.STEALTH_TIMING = exports.NORMAL_TIMING = exports.AGGRESSIVE_TIMING = void 0;
exports.gaussianRandom = gaussianRandom;
exports.getRandomDelay = getRandomDelay;
exports.getReadingDelay = getReadingDelay;
exports.getPageLoadDelay = getPageLoadDelay;
exports.getScrollDelay = getScrollDelay;
exports.getMouseMoveDelay = getMouseMoveDelay;
exports.getPreClickDelay = getPreClickDelay;
exports.getTypingDelay = getTypingDelay;
exports.getRateLimitBackoff = getRateLimitBackoff;
exports.getRetryDelay = getRetryDelay;
exports.getThinkingDelay = getThinkingDelay;
exports.sleep = sleep;
exports.randomSleep = randomSleep;
exports.createTimingController = createTimingController;
/**
 * Generate a random delay using gaussian (normal) distribution
 * This produces more realistic timing than uniform random
 */
function gaussianRandom(mean, stdDev) {
    // Box-Muller transform for gaussian random numbers
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + z * stdDev;
}
/**
 * Generate a random delay within a range using gaussian distribution
 * Values are clamped to stay within minMs and maxMs
 */
function getRandomDelay(minMs, maxMs) {
    const mean = (minMs + maxMs) / 2;
    const stdDev = (maxMs - minMs) / 6; // 99.7% within range
    let delay;
    do {
        delay = gaussianRandom(mean, stdDev);
    } while (delay < minMs || delay > maxMs);
    return Math.round(delay);
}
/**
 * Generate a delay that simulates human page reading time
 * Based on average reading speed of ~200-300 words per minute
 */
function getReadingDelay(wordCount) {
    if (wordCount <= 0)
        return getPageLoadDelay();
    // Average reading speed: 200-300 WPM
    // We want to simulate a quick skim, not full reading
    const skimSpeed = 500; // words per minute for skimming
    const baseReadTimeMs = (wordCount / skimSpeed) * 60 * 1000;
    // Add some randomness
    const minTime = Math.min(1000, baseReadTimeMs * 0.3);
    const maxTime = Math.min(10000, baseReadTimeMs * 1.5);
    return getRandomDelay(Math.max(500, minTime), Math.max(2000, maxTime));
}
/**
 * Get delay between page navigations
 * Simulates time a human would take to decide to click a link
 */
function getPageLoadDelay() {
    return getRandomDelay(1000, 3000);
}
/**
 * Get delay for scrolling actions
 */
function getScrollDelay() {
    return getRandomDelay(200, 600);
}
/**
 * Get delay between mouse movements
 */
function getMouseMoveDelay() {
    return getRandomDelay(50, 200);
}
/**
 * Get delay before clicking
 * Humans typically pause briefly before clicking
 */
function getPreClickDelay() {
    return getRandomDelay(100, 400);
}
/**
 * Get delay for typing (between keystrokes)
 * Average typing speed: 40-60 WPM = 200-300ms per character
 */
function getTypingDelay() {
    return getRandomDelay(50, 200);
}
/**
 * Get delay for rate limiting backoff
 * Implements exponential backoff with jitter
 */
function getRateLimitBackoff(attempt, baseMs = 1000) {
    // Exponential backoff: baseMs * 2^attempt
    const exponentialDelay = baseMs * Math.pow(2, attempt);
    // Add jitter (0-50% of the delay)
    const jitter = exponentialDelay * Math.random() * 0.5;
    // Cap at 60 seconds
    return Math.min(60000, exponentialDelay + jitter);
}
/**
 * Get delay after an error before retrying
 */
function getRetryDelay(attempt) {
    // Increasing delay with each attempt
    const baseDelay = 2000;
    const maxDelay = 30000;
    const delay = baseDelay * Math.pow(1.5, attempt);
    return Math.min(maxDelay, delay + getRandomDelay(0, 1000));
}
/**
 * Get a "thinking" delay - simulates human decision making
 */
function getThinkingDelay() {
    return getRandomDelay(500, 2000);
}
/**
 * Aggressive timing profile - faster crawling
 */
exports.AGGRESSIVE_TIMING = {
    pageLoadDelay: () => getRandomDelay(300, 800),
    scrollDelay: () => getRandomDelay(100, 300),
    clickDelay: () => getRandomDelay(50, 150),
    betweenRequestsDelay: () => getRandomDelay(200, 500),
};
/**
 * Normal timing profile - balanced
 */
exports.NORMAL_TIMING = {
    pageLoadDelay: () => getRandomDelay(1000, 2500),
    scrollDelay: () => getRandomDelay(200, 500),
    clickDelay: () => getRandomDelay(100, 300),
    betweenRequestsDelay: () => getRandomDelay(500, 1500),
};
/**
 * Stealth timing profile - more human-like
 */
exports.STEALTH_TIMING = {
    pageLoadDelay: () => getRandomDelay(2000, 5000),
    scrollDelay: () => getRandomDelay(300, 800),
    clickDelay: () => getRandomDelay(200, 500),
    betweenRequestsDelay: () => getRandomDelay(1000, 3000),
};
/**
 * Polite timing profile - very slow, respectful crawling
 */
exports.POLITE_TIMING = {
    pageLoadDelay: () => getRandomDelay(3000, 8000),
    scrollDelay: () => getRandomDelay(500, 1200),
    clickDelay: () => getRandomDelay(300, 700),
    betweenRequestsDelay: () => getRandomDelay(2000, 5000),
};
/**
 * Sleep for a specified duration
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/**
 * Sleep for a random duration within a range
 */
async function randomSleep(minMs, maxMs) {
    const delay = getRandomDelay(minMs, maxMs);
    await sleep(delay);
}
/**
 * Create a timing controller for a crawl session
 */
class TimingController {
    profile;
    lastRequestTime = 0;
    constructor(profile = exports.NORMAL_TIMING) {
        this.profile = profile;
    }
    /**
     * Set the timing profile
     */
    setProfile(profile) {
        this.profile = profile;
    }
    /**
     * Wait before making a new request
     */
    async waitBeforeRequest() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        const requiredDelay = this.profile.betweenRequestsDelay();
        if (timeSinceLastRequest < requiredDelay) {
            await sleep(requiredDelay - timeSinceLastRequest);
        }
        this.lastRequestTime = Date.now();
    }
    /**
     * Wait after page load
     */
    async waitAfterPageLoad() {
        await sleep(this.profile.pageLoadDelay());
    }
    /**
     * Wait before scrolling
     */
    async waitBeforeScroll() {
        await sleep(this.profile.scrollDelay());
    }
    /**
     * Wait before clicking
     */
    async waitBeforeClick() {
        await sleep(this.profile.clickDelay());
    }
}
exports.TimingController = TimingController;
/**
 * Create a timing controller
 */
function createTimingController(profile) {
    return new TimingController(profile);
}
//# sourceMappingURL=timing.service.js.map