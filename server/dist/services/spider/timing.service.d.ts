/**
 * Timing Service - Human-Like Request Delays
 *
 * Provides randomized timing to make requests appear more human-like
 * and avoid detection by timing-based bot detection.
 */
/**
 * Generate a random delay using gaussian (normal) distribution
 * This produces more realistic timing than uniform random
 */
export declare function gaussianRandom(mean: number, stdDev: number): number;
/**
 * Generate a random delay within a range using gaussian distribution
 * Values are clamped to stay within minMs and maxMs
 */
export declare function getRandomDelay(minMs: number, maxMs: number): number;
/**
 * Generate a delay that simulates human page reading time
 * Based on average reading speed of ~200-300 words per minute
 */
export declare function getReadingDelay(wordCount: number): number;
/**
 * Get delay between page navigations
 * Simulates time a human would take to decide to click a link
 */
export declare function getPageLoadDelay(): number;
/**
 * Get delay for scrolling actions
 */
export declare function getScrollDelay(): number;
/**
 * Get delay between mouse movements
 */
export declare function getMouseMoveDelay(): number;
/**
 * Get delay before clicking
 * Humans typically pause briefly before clicking
 */
export declare function getPreClickDelay(): number;
/**
 * Get delay for typing (between keystrokes)
 * Average typing speed: 40-60 WPM = 200-300ms per character
 */
export declare function getTypingDelay(): number;
/**
 * Get delay for rate limiting backoff
 * Implements exponential backoff with jitter
 */
export declare function getRateLimitBackoff(attempt: number, baseMs?: number): number;
/**
 * Get delay after an error before retrying
 */
export declare function getRetryDelay(attempt: number): number;
/**
 * Get a "thinking" delay - simulates human decision making
 */
export declare function getThinkingDelay(): number;
/**
 * Timing profile for different crawl behaviors
 */
export interface TimingProfile {
    pageLoadDelay: () => number;
    scrollDelay: () => number;
    clickDelay: () => number;
    betweenRequestsDelay: () => number;
}
/**
 * Aggressive timing profile - faster crawling
 */
export declare const AGGRESSIVE_TIMING: TimingProfile;
/**
 * Normal timing profile - balanced
 */
export declare const NORMAL_TIMING: TimingProfile;
/**
 * Stealth timing profile - more human-like
 */
export declare const STEALTH_TIMING: TimingProfile;
/**
 * Polite timing profile - very slow, respectful crawling
 */
export declare const POLITE_TIMING: TimingProfile;
/**
 * Sleep for a specified duration
 */
export declare function sleep(ms: number): Promise<void>;
/**
 * Sleep for a random duration within a range
 */
export declare function randomSleep(minMs: number, maxMs: number): Promise<void>;
/**
 * Create a timing controller for a crawl session
 */
export declare class TimingController {
    private profile;
    private lastRequestTime;
    constructor(profile?: TimingProfile);
    /**
     * Set the timing profile
     */
    setProfile(profile: TimingProfile): void;
    /**
     * Wait before making a new request
     */
    waitBeforeRequest(): Promise<void>;
    /**
     * Wait after page load
     */
    waitAfterPageLoad(): Promise<void>;
    /**
     * Wait before scrolling
     */
    waitBeforeScroll(): Promise<void>;
    /**
     * Wait before clicking
     */
    waitBeforeClick(): Promise<void>;
}
/**
 * Create a timing controller
 */
export declare function createTimingController(profile?: TimingProfile): TimingController;
//# sourceMappingURL=timing.service.d.ts.map