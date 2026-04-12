/**
 * Behavior Service - Human-Like Interaction Simulation
 *
 * Simulates human-like browser interactions to avoid behavioral
 * analysis bot detection.
 */
import type { Page } from 'playwright';
/**
 * Move mouse in a human-like curved path
 */
export declare function humanMouseMove(page: Page, targetX: number, targetY: number, options?: {
    startX?: number;
    startY?: number;
    steps?: number;
}): Promise<void>;
/**
 * Perform a human-like scroll
 */
export declare function humanScroll(page: Page, options?: {
    direction?: 'down' | 'up';
    amount?: number;
    smooth?: boolean;
}): Promise<void>;
/**
 * Scroll to reveal an element, like a human would
 */
export declare function scrollToElement(page: Page, selector: string, options?: {
    behavior?: 'smooth' | 'auto';
    block?: 'start' | 'center' | 'end';
}): Promise<boolean>;
/**
 * Perform random scrolling to simulate reading
 */
export declare function simulateReading(page: Page, options?: {
    scrollCount?: number;
    pauseBetweenScrolls?: boolean;
}): Promise<void>;
/**
 * Move mouse to random positions (simulates looking around)
 */
export declare function randomMouseMovements(page: Page, options?: {
    movements?: number;
    avoidEdges?: boolean;
}): Promise<void>;
/**
 * Hover over an element
 */
export declare function humanHover(page: Page, selector: string): Promise<boolean>;
/**
 * Click an element in a human-like way
 */
export declare function humanClick(page: Page, selector: string, options?: {
    doubleClick?: boolean;
    button?: 'left' | 'right' | 'middle';
}): Promise<boolean>;
/**
 * Type text in a human-like way
 */
export declare function humanType(page: Page, selector: string, text: string, options?: {
    clearFirst?: boolean;
    delayBetweenChars?: () => number;
}): Promise<boolean>;
/**
 * Simulate general human behavior on a page
 */
export declare function simulateHumanBehavior(page: Page, options?: {
    moveCount?: number;
    scrollCount?: number;
    pauseToRead?: boolean;
}): Promise<void>;
/**
 * Behavior intensity levels
 */
export type BehaviorIntensity = 'none' | 'minimal' | 'moderate' | 'full';
/**
 * Get behavior settings based on intensity
 */
export declare function getBehaviorSettings(intensity: BehaviorIntensity): {
    moveCount: number;
    scrollCount: number;
    pauseToRead: boolean;
    enabled: boolean;
};
//# sourceMappingURL=behavior.service.d.ts.map