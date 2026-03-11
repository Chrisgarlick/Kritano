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
export function gaussianRandom(mean: number, stdDev: number): number {
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
export function getRandomDelay(minMs: number, maxMs: number): number {
  const mean = (minMs + maxMs) / 2;
  const stdDev = (maxMs - minMs) / 6; // 99.7% within range

  let delay: number;
  do {
    delay = gaussianRandom(mean, stdDev);
  } while (delay < minMs || delay > maxMs);

  return Math.round(delay);
}

/**
 * Generate a delay that simulates human page reading time
 * Based on average reading speed of ~200-300 words per minute
 */
export function getReadingDelay(wordCount: number): number {
  if (wordCount <= 0) return getPageLoadDelay();

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
export function getPageLoadDelay(): number {
  return getRandomDelay(1000, 3000);
}

/**
 * Get delay for scrolling actions
 */
export function getScrollDelay(): number {
  return getRandomDelay(200, 600);
}

/**
 * Get delay between mouse movements
 */
export function getMouseMoveDelay(): number {
  return getRandomDelay(50, 200);
}

/**
 * Get delay before clicking
 * Humans typically pause briefly before clicking
 */
export function getPreClickDelay(): number {
  return getRandomDelay(100, 400);
}

/**
 * Get delay for typing (between keystrokes)
 * Average typing speed: 40-60 WPM = 200-300ms per character
 */
export function getTypingDelay(): number {
  return getRandomDelay(50, 200);
}

/**
 * Get delay for rate limiting backoff
 * Implements exponential backoff with jitter
 */
export function getRateLimitBackoff(attempt: number, baseMs: number = 1000): number {
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
export function getRetryDelay(attempt: number): number {
  // Increasing delay with each attempt
  const baseDelay = 2000;
  const maxDelay = 30000;

  const delay = baseDelay * Math.pow(1.5, attempt);
  return Math.min(maxDelay, delay + getRandomDelay(0, 1000));
}

/**
 * Get a "thinking" delay - simulates human decision making
 */
export function getThinkingDelay(): number {
  return getRandomDelay(500, 2000);
}

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
export const AGGRESSIVE_TIMING: TimingProfile = {
  pageLoadDelay: () => getRandomDelay(300, 800),
  scrollDelay: () => getRandomDelay(100, 300),
  clickDelay: () => getRandomDelay(50, 150),
  betweenRequestsDelay: () => getRandomDelay(200, 500),
};

/**
 * Normal timing profile - balanced
 */
export const NORMAL_TIMING: TimingProfile = {
  pageLoadDelay: () => getRandomDelay(1000, 2500),
  scrollDelay: () => getRandomDelay(200, 500),
  clickDelay: () => getRandomDelay(100, 300),
  betweenRequestsDelay: () => getRandomDelay(500, 1500),
};

/**
 * Stealth timing profile - more human-like
 */
export const STEALTH_TIMING: TimingProfile = {
  pageLoadDelay: () => getRandomDelay(2000, 5000),
  scrollDelay: () => getRandomDelay(300, 800),
  clickDelay: () => getRandomDelay(200, 500),
  betweenRequestsDelay: () => getRandomDelay(1000, 3000),
};

/**
 * Polite timing profile - very slow, respectful crawling
 */
export const POLITE_TIMING: TimingProfile = {
  pageLoadDelay: () => getRandomDelay(3000, 8000),
  scrollDelay: () => getRandomDelay(500, 1200),
  clickDelay: () => getRandomDelay(300, 700),
  betweenRequestsDelay: () => getRandomDelay(2000, 5000),
};

/**
 * Sleep for a specified duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Sleep for a random duration within a range
 */
export async function randomSleep(minMs: number, maxMs: number): Promise<void> {
  const delay = getRandomDelay(minMs, maxMs);
  await sleep(delay);
}

/**
 * Create a timing controller for a crawl session
 */
export class TimingController {
  private profile: TimingProfile;
  private lastRequestTime: number = 0;

  constructor(profile: TimingProfile = NORMAL_TIMING) {
    this.profile = profile;
  }

  /**
   * Set the timing profile
   */
  setProfile(profile: TimingProfile): void {
    this.profile = profile;
  }

  /**
   * Wait before making a new request
   */
  async waitBeforeRequest(): Promise<void> {
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
  async waitAfterPageLoad(): Promise<void> {
    await sleep(this.profile.pageLoadDelay());
  }

  /**
   * Wait before scrolling
   */
  async waitBeforeScroll(): Promise<void> {
    await sleep(this.profile.scrollDelay());
  }

  /**
   * Wait before clicking
   */
  async waitBeforeClick(): Promise<void> {
    await sleep(this.profile.clickDelay());
  }
}

/**
 * Create a timing controller
 */
export function createTimingController(profile?: TimingProfile): TimingController {
  return new TimingController(profile);
}
