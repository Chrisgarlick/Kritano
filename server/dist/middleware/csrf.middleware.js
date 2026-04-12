"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCsrfToken = generateCsrfToken;
exports.setCsrfCookie = setCsrfCookie;
exports.ensureCsrfToken = ensureCsrfToken;
exports.csrfProtection = csrfProtection;
exports.getCsrfToken = getCsrfToken;
const crypto_utils_js_1 = require("../utils/crypto.utils.js");
const auth_config_js_1 = require("../config/auth.config.js");
/**
 * Generate a new CSRF token
 */
function generateCsrfToken() {
    return (0, crypto_utils_js_1.generateSecureToken)(auth_config_js_1.CSRF_CONFIG.tokenLength);
}
/**
 * Set CSRF token cookie on response.
 * The cookie is NOT HttpOnly so JavaScript can read it.
 */
function setCsrfCookie(res, token) {
    res.cookie(auth_config_js_1.CSRF_CONFIG.cookieName, token, {
        httpOnly: false, // JavaScript needs to read this
        secure: auth_config_js_1.COOKIE_CONFIG.secure,
        sameSite: auth_config_js_1.COOKIE_CONFIG.sameSite,
        path: auth_config_js_1.COOKIE_CONFIG.path,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });
}
/**
 * Middleware to ensure CSRF token exists.
 * Creates a new token if one doesn't exist.
 */
function ensureCsrfToken(req, res, next) {
    const existingToken = req.cookies?.[auth_config_js_1.CSRF_CONFIG.cookieName];
    if (!existingToken) {
        const newToken = generateCsrfToken();
        setCsrfCookie(res, newToken);
    }
    next();
}
/**
 * Middleware to validate CSRF token on state-changing requests.
 * Uses double-submit cookie pattern.
 */
function csrfProtection(req, res, next) {
    // Skip CSRF check for safe methods
    const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
    if (safeMethods.includes(req.method)) {
        next();
        return;
    }
    // Skip CSRF for webhook endpoints (authenticated via signature, not cookies)
    if (req.originalUrl.startsWith('/api/webhooks/')) {
        next();
        return;
    }
    // Skip CSRF for API v1 endpoints (authenticated via API key, not cookies)
    if (req.originalUrl.startsWith('/api/v1/')) {
        next();
        return;
    }
    const cookieToken = req.cookies?.[auth_config_js_1.CSRF_CONFIG.cookieName];
    const headerToken = req.headers[auth_config_js_1.CSRF_CONFIG.headerName];
    // Both tokens must be present
    if (!cookieToken || !headerToken) {
        res.status(403).json({
            error: 'CSRF token missing',
            code: 'CSRF_MISSING',
        });
        return;
    }
    // Timing-safe comparison to prevent timing attacks
    if (!(0, crypto_utils_js_1.timingSafeEqual)(cookieToken, headerToken)) {
        res.status(403).json({
            error: 'CSRF token invalid',
            code: 'CSRF_INVALID',
        });
        return;
    }
    next();
}
/**
 * Get CSRF token from request (for including in responses)
 */
function getCsrfToken(req) {
    return req.cookies?.[auth_config_js_1.CSRF_CONFIG.cookieName];
}
//# sourceMappingURL=csrf.middleware.js.map