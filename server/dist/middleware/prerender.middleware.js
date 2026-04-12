"use strict";
/**
 * Pre-rendering middleware for bot/crawler detection.
 *
 * Detects bot user agents and serves pre-rendered HTML instead of the
 * SPA shell. This ensures crawlers see fully rendered content with
 * structured data, meta tags, and semantic HTML.
 *
 * Skips pre-rendering for:
 * - API requests (/api/*)
 * - Static assets (.js, .css, .png, etc.)
 * - Authenticated app routes (/dashboard, /admin, etc.)
 * - Non-GET requests
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.prerenderMiddleware = prerenderMiddleware;
const prerender_service_js_1 = require("../services/prerender.service.js");
// Bot user agents that should receive pre-rendered HTML
const BOT_USER_AGENTS = [
    // Search engines
    'googlebot',
    'bingbot',
    'slurp', // Yahoo
    'duckduckbot',
    'baiduspider',
    'yandexbot',
    'sogou',
    // AI crawlers
    'gptbot',
    'chatgpt-user',
    'claude-web',
    'anthropic-ai',
    'perplexitybot',
    'cohere-ai',
    'meta-externalagent',
    // Social media / link previews
    'facebookexternalhit',
    'twitterbot',
    'linkedinbot',
    'slackbot',
    'discordbot',
    'whatsapp',
    'telegrambot',
    // SEO tools
    'semrushbot',
    'ahrefsbot',
    'mj12bot', // Majestic
    'dotbot',
    'rogerbot', // Moz
    // Other
    'embedly',
    'quora link preview',
    'outbrain',
    'w3c_validator',
];
// File extensions that are never pre-rendered
const STATIC_EXTENSIONS = /\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|map|json|xml|txt|webmanifest|pdf)$/i;
function isBot(userAgent) {
    const ua = userAgent.toLowerCase();
    return BOT_USER_AGENTS.some(bot => ua.includes(bot));
}
function prerenderMiddleware(req, res, next) {
    // Only intercept GET requests
    if (req.method !== 'GET') {
        next();
        return;
    }
    // Skip API routes
    if (req.path.startsWith('/api')) {
        next();
        return;
    }
    // Skip static assets
    if (STATIC_EXTENSIONS.test(req.path)) {
        next();
        return;
    }
    // Skip if not a bot
    const userAgent = req.headers['user-agent'] || '';
    if (!isBot(userAgent)) {
        next();
        return;
    }
    // Skip blocked paths (authenticated routes)
    if (!(0, prerender_service_js_1.shouldPrerender)(req.path)) {
        next();
        return;
    }
    // Render the page for the bot
    (0, prerender_service_js_1.renderPage)(req.path)
        .then(html => {
        if (html) {
            res.set('Content-Type', 'text/html');
            res.set('X-Prerendered', 'true');
            res.send(html);
        }
        else {
            // Fallback to normal SPA if render fails
            next();
        }
    })
        .catch(() => {
        next();
    });
}
//# sourceMappingURL=prerender.middleware.js.map