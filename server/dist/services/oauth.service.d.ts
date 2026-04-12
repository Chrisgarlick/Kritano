import type { OAuthProvider, OAuthProfile, OAuthTokens, OAuthProviderRecord, OAuthProviderSummary, SafeUser } from '../types/auth.types.js';
export declare class OAuthService {
    /**
     * Generate authorization URL for a provider
     */
    generateAuthUrl(provider: OAuthProvider, mode?: 'login' | 'link'): {
        url: string;
        state: string;
        codeVerifier: string;
    };
    /**
     * Exchange authorization code for profile + tokens
     */
    exchangeCode(provider: OAuthProvider, code: string, codeVerifier: string): Promise<{
        profile: OAuthProfile;
        tokens: OAuthTokens;
    }>;
    private exchangeGoogleCode;
    private exchangeFacebookCode;
    /**
     * Find existing OAuth link
     */
    findOAuthLink(provider: OAuthProvider, providerUserId: string): Promise<OAuthProviderRecord | null>;
    /**
     * Link a provider to a user
     */
    linkProvider(userId: string, provider: OAuthProvider, profile: OAuthProfile, tokens: OAuthTokens): Promise<void>;
    /**
     * Unlink a provider from a user
     */
    unlinkProvider(userId: string, provider: OAuthProvider): Promise<void>;
    /**
     * Get linked providers for a user
     */
    getLinkedProviders(userId: string): Promise<OAuthProviderSummary[]>;
    /**
     * Count linked providers for a user
     */
    countLinkedProviders(userId: string): Promise<number>;
    /**
     * Main OAuth login/register orchestration
     */
    handleOAuthLogin(profile: OAuthProfile, tokens: OAuthTokens): Promise<{
        user: SafeUser;
        isNewUser: boolean;
    }>;
}
export declare class OAuthError extends Error {
    code: string;
    constructor(code: string, message: string);
}
export declare const oauthService: OAuthService;
//# sourceMappingURL=oauth.service.d.ts.map