"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OAUTH_CONFIG = void 0;
exports.OAUTH_CONFIG = {
    google: {
        clientId: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirectUri: `${process.env.APP_URL}/auth/callback/google`,
        scopes: ['openid', 'email', 'profile'],
    },
    facebook: {
        appId: process.env.FACEBOOK_APP_ID || '',
        appSecret: process.env.FACEBOOK_APP_SECRET || '',
        redirectUri: `${process.env.APP_URL}/auth/callback/facebook`,
        scopes: ['email', 'public_profile'],
        graphApiVersion: 'v19.0',
    },
    state: {
        cookieName: 'oauth_state',
        maxAgeMs: 10 * 60 * 1000, // 10 minutes
    },
};
//# sourceMappingURL=oauth.config.js.map