"use strict";
/**
 * Behavior Service - Human-Like Interaction Simulation
 *
 * Simulates human-like browser interactions to avoid behavioral
 * analysis bot detection.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.humanMouseMove = humanMouseMove;
exports.humanScroll = humanScroll;
exports.scrollToElement = scrollToElement;
exports.simulateReading = simulateReading;
exports.randomMouseMovements = randomMouseMovements;
exports.humanHover = humanHover;
exports.humanClick = humanClick;
exports.humanType = humanType;
exports.simulateHumanBehavior = simulateHumanBehavior;
exports.getBehaviorSettings = getBehaviorSettings;
const timing_service_1 = require("./timing.service");
/**
 * Generate a random point within viewport
 */
function getRandomViewportPoint(viewport) {
    // Avoid edges - humans rarely click at the very edge
    const margin = 50;
    return {
        x: margin + Math.random() * (viewport.width - 2 * margin),
        y: margin + Math.random() * (viewport.height - 2 * margin),
    };
}
/**
 * Generate bezier curve control points for natural mouse movement
 */
function generateBezierPath(start, end, steps = 20) {
    const path = [];
    // Generate random control points for bezier curve
    const distance = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
    const variance = distance * 0.3;
    const cp1 = {
        x: start.x + (end.x - start.x) * 0.25 + (Math.random() - 0.5) * variance,
        y: start.y + (end.y - start.y) * 0.25 + (Math.random() - 0.5) * variance,
    };
    const cp2 = {
        x: start.x + (end.x - start.x) * 0.75 + (Math.random() - 0.5) * variance,
        y: start.y + (end.y - start.y) * 0.75 + (Math.random() - 0.5) * variance,
    };
    // Generate points along cubic bezier curve
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const t2 = t * t;
        const t3 = t2 * t;
        const mt = 1 - t;
        const mt2 = mt * mt;
        const mt3 = mt2 * mt;
        path.push({
            x: mt3 * start.x + 3 * mt2 * t * cp1.x + 3 * mt * t2 * cp2.x + t3 * end.x,
            y: mt3 * start.y + 3 * mt2 * t * cp1.y + 3 * mt * t2 * cp2.y + t3 * end.y,
        });
    }
    return path;
}
/**
 * Move mouse in a human-like curved path
 */
async function humanMouseMove(page, targetX, targetY, options = {}) {
    const viewport = page.viewportSize();
    if (!viewport)
        return;
    // Get current mouse position or random start
    const start = {
        x: options.startX ?? Math.random() * viewport.width,
        y: options.startY ?? Math.random() * viewport.height,
    };
    const end = { x: targetX, y: targetY };
    const steps = options.steps ?? Math.max(10, Math.floor(Math.random() * 20) + 10);
    // Generate bezier path
    const path = generateBezierPath(start, end, steps);
    // Move along path with random delays
    for (const point of path) {
        await page.mouse.move(point.x, point.y);
        await (0, timing_service_1.sleep)((0, timing_service_1.getMouseMoveDelay)());
    }
}
/**
 * Perform a human-like scroll
 */
async function humanScroll(page, options = {}) {
    const { direction = 'down', amount = (0, timing_service_1.getRandomDelay)(200, 600), smooth = true, } = options;
    const scrollAmount = direction === 'down' ? amount : -amount;
    if (smooth) {
        // Smooth scroll in steps
        const steps = Math.max(5, Math.floor(Math.abs(scrollAmount) / 50));
        const stepAmount = scrollAmount / steps;
        for (let i = 0; i < steps; i++) {
            await page.evaluate((delta) => {
                window.scrollBy({ top: delta, behavior: 'auto' });
            }, stepAmount);
            await (0, timing_service_1.sleep)((0, timing_service_1.getRandomDelay)(10, 30));
        }
    }
    else {
        await page.evaluate((delta) => {
            window.scrollBy(0, delta);
        }, scrollAmount);
    }
    await (0, timing_service_1.sleep)((0, timing_service_1.getScrollDelay)());
}
/**
 * Scroll to reveal an element, like a human would
 */
async function scrollToElement(page, selector, options = {}) {
    const { behavior = 'smooth', block = 'center' } = options;
    try {
        await page.evaluate(({ selector, behavior, block }) => {
            const element = document.querySelector(selector);
            if (element) {
                element.scrollIntoView({ behavior, block });
                return true;
            }
            return false;
        }, { selector, behavior, block });
        // Wait for scroll to complete
        await (0, timing_service_1.sleep)((0, timing_service_1.getRandomDelay)(300, 600));
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Perform random scrolling to simulate reading
 */
async function simulateReading(page, options = {}) {
    const { scrollCount = (0, timing_service_1.getRandomDelay)(2, 5), pauseBetweenScrolls = true, } = options;
    for (let i = 0; i < scrollCount; i++) {
        // Random scroll amount
        const amount = (0, timing_service_1.getRandomDelay)(150, 400);
        await humanScroll(page, { direction: 'down', amount });
        // Pause to "read"
        if (pauseBetweenScrolls) {
            await (0, timing_service_1.sleep)((0, timing_service_1.getRandomDelay)(500, 2000));
        }
    }
}
/**
 * Move mouse to random positions (simulates looking around)
 */
async function randomMouseMovements(page, options = {}) {
    const { movements = (0, timing_service_1.getRandomDelay)(1, 3), avoidEdges = true, } = options;
    const viewport = page.viewportSize();
    if (!viewport)
        return;
    for (let i = 0; i < movements; i++) {
        const point = avoidEdges
            ? getRandomViewportPoint(viewport)
            : { x: Math.random() * viewport.width, y: Math.random() * viewport.height };
        await humanMouseMove(page, point.x, point.y);
        await (0, timing_service_1.sleep)((0, timing_service_1.getRandomDelay)(200, 800));
    }
}
/**
 * Hover over an element
 */
async function humanHover(page, selector) {
    try {
        const element = await page.$(selector);
        if (!element)
            return false;
        const box = await element.boundingBox();
        if (!box)
            return false;
        // Move to center of element with some randomness
        const targetX = box.x + box.width * (0.3 + Math.random() * 0.4);
        const targetY = box.y + box.height * (0.3 + Math.random() * 0.4);
        await humanMouseMove(page, targetX, targetY);
        await (0, timing_service_1.sleep)((0, timing_service_1.getRandomDelay)(100, 300));
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Click an element in a human-like way
 */
async function humanClick(page, selector, options = {}) {
    const { doubleClick = false, button = 'left' } = options;
    try {
        // First hover over the element
        const hovered = await humanHover(page, selector);
        if (!hovered)
            return false;
        // Small pause before clicking
        await (0, timing_service_1.sleep)((0, timing_service_1.getRandomDelay)(50, 200));
        // Click
        if (doubleClick) {
            await page.dblclick(selector, { button });
        }
        else {
            await page.click(selector, { button });
        }
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Type text in a human-like way
 */
async function humanType(page, selector, text, options = {}) {
    const { clearFirst = true, delayBetweenChars = () => (0, timing_service_1.getRandomDelay)(50, 150), } = options;
    try {
        // Click on the input first
        await humanClick(page, selector);
        await (0, timing_service_1.sleep)((0, timing_service_1.getRandomDelay)(100, 300));
        // Clear existing content if needed
        if (clearFirst) {
            await page.fill(selector, '');
            await (0, timing_service_1.sleep)((0, timing_service_1.getRandomDelay)(50, 150));
        }
        // Type character by character
        for (const char of text) {
            await page.type(selector, char, { delay: 0 });
            await (0, timing_service_1.sleep)(delayBetweenChars());
            // Occasionally pause longer (simulates thinking)
            if (Math.random() < 0.1) {
                await (0, timing_service_1.sleep)((0, timing_service_1.getRandomDelay)(200, 500));
            }
        }
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Simulate general human behavior on a page
 */
async function simulateHumanBehavior(page, options = {}) {
    const { moveCount = (0, timing_service_1.getRandomDelay)(1, 3), scrollCount = (0, timing_service_1.getRandomDelay)(1, 3), pauseToRead = true, } = options;
    // Random mouse movements
    if (moveCount > 0) {
        await randomMouseMovements(page, { movements: moveCount });
    }
    // Simulate reading with scrolling
    if (scrollCount > 0) {
        await simulateReading(page, {
            scrollCount,
            pauseBetweenScrolls: pauseToRead,
        });
    }
    // Final pause
    await (0, timing_service_1.sleep)((0, timing_service_1.getRandomDelay)(300, 800));
}
/**
 * Get behavior settings based on intensity
 */
function getBehaviorSettings(intensity) {
    switch (intensity) {
        case 'none':
            return { moveCount: 0, scrollCount: 0, pauseToRead: false, enabled: false };
        case 'minimal':
            return { moveCount: 1, scrollCount: 1, pauseToRead: false, enabled: true };
        case 'moderate':
            return { moveCount: 2, scrollCount: 2, pauseToRead: true, enabled: true };
        case 'full':
            return { moveCount: 3, scrollCount: 4, pauseToRead: true, enabled: true };
        default:
            return { moveCount: 1, scrollCount: 1, pauseToRead: false, enabled: true };
    }
}
//# sourceMappingURL=behavior.service.js.map