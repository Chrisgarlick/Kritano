import type { User, SafeUser, JwtPayload, TokenPair, DeviceInfo, RefreshToken } from '../types/auth.types.js';
/**
 * Token service for JWT access tokens and opaque refresh tokens.
 * Implements refresh token rotation with reuse detection.
 */
export declare class TokenService {
    private readonly jwtSecret;
    constructor();
    /**
     * Generate a JWT access token for a user
     */
    generateAccessToken(user: User | SafeUser): string;
    /**
     * Verify and decode a JWT access token
     */
    verifyAccessToken(token: string): JwtPayload;
    /**
     * Generate a cryptographically secure opaque refresh token
     */
    generateRefreshToken(): string;
    /**
     * Hash a token for secure storage (one-way hash)
     */
    hashToken(token: string): string;
    /**
     * Create and store a new refresh token
     */
    createRefreshToken(userId: string, deviceInfo: DeviceInfo, familyId?: string): Promise<{
        token: string;
        tokenId: string;
        familyId: string;
    }>;
    /**
     * Rotate a refresh token - creates new token, invalidates old one.
     * Implements reuse detection: if a revoked token is used, entire family is revoked.
     */
    rotateRefreshToken(oldToken: string, deviceInfo: DeviceInfo): Promise<{
        tokenPair: TokenPair;
        user: SafeUser;
    } | null>;
    /**
     * Revoke a single refresh token
     */
    revokeToken(tokenHash: string, reason: string): Promise<boolean>;
    /**
     * Revoke all tokens in a family (for security events)
     */
    revokeTokenFamily(familyId: string, reason: string): Promise<number>;
    /**
     * Revoke all tokens for a user (logout from all devices)
     */
    revokeAllUserTokens(userId: string, reason: string): Promise<number>;
    /**
     * Find refresh token by hash (for logout)
     */
    findRefreshToken(tokenHash: string): Promise<RefreshToken | null>;
    /**
     * Get active sessions for a user
     */
    getUserSessions(userId: string): Promise<Array<{
        id: string;
        user_agent: string | null;
        ip_address: string | null;
        created_at: Date;
        last_used_at: Date | null;
    }>>;
}
export declare const tokenService: TokenService;
//# sourceMappingURL=token.service.d.ts.map