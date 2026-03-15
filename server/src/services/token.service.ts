import jwt, { type SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { pool } from '../db/index.js';
import { JWT_CONFIG, REFRESH_TOKEN_CONFIG } from '../config/auth.config.js';
import type {
  User,
  SafeUser,
  JwtPayload,
  TokenPair,
  DeviceInfo,
  RefreshToken,
} from '../types/auth.types.js';

/**
 * Token service for JWT access tokens and opaque refresh tokens.
 * Implements refresh token rotation with reuse detection.
 */
export class TokenService {
  private readonly jwtSecret: string;

  constructor() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is required');
    }
    if (secret.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters');
    }
    this.jwtSecret = secret;
  }

  /**
   * Generate a JWT access token for a user
   */
  generateAccessToken(user: User | SafeUser): string {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const options: SignOptions = {
      expiresIn: JWT_CONFIG.accessTokenExpiry,
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience,
      algorithm: JWT_CONFIG.algorithm,
    };

    return jwt.sign(payload, this.jwtSecret, options);
  }

  /**
   * Verify and decode a JWT access token
   */
  verifyAccessToken(token: string): JwtPayload {
    return jwt.verify(token, this.jwtSecret, {
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience,
      algorithms: [JWT_CONFIG.algorithm],
    }) as JwtPayload;
  }

  /**
   * Generate a cryptographically secure opaque refresh token
   */
  generateRefreshToken(): string {
    return crypto.randomBytes(REFRESH_TOKEN_CONFIG.tokenLength).toString('base64url');
  }

  /**
   * Hash a token for secure storage (one-way hash)
   */
  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Create and store a new refresh token
   */
  async createRefreshToken(
    userId: string,
    deviceInfo: DeviceInfo,
    familyId?: string
  ): Promise<{ token: string; tokenId: string; familyId: string }> {
    const token = this.generateRefreshToken();
    const tokenHash = this.hashToken(token);
    const newFamilyId = familyId || crypto.randomUUID();

    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_CONFIG.expiryMs);
    const absoluteExpiresAt = new Date(Date.now() + REFRESH_TOKEN_CONFIG.absoluteExpiryMs);

    const result = await pool.query<{ id: string }>(
      `INSERT INTO refresh_tokens
       (user_id, token_hash, family_id, user_agent, ip_address, device_fingerprint, expires_at, absolute_expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        userId,
        tokenHash,
        newFamilyId,
        deviceInfo.userAgent || null,
        deviceInfo.ipAddress || null,
        deviceInfo.fingerprint || null,
        expiresAt,
        absoluteExpiresAt,
      ]
    );

    return {
      token,
      tokenId: result.rows[0].id,
      familyId: newFamilyId,
    };
  }

  /**
   * Rotate a refresh token - creates new token, invalidates old one.
   * Implements reuse detection: if a revoked token is used, entire family is revoked.
   */
  async rotateRefreshToken(
    oldToken: string,
    deviceInfo: DeviceInfo
  ): Promise<{ tokenPair: TokenPair; user: SafeUser } | null> {
    const oldTokenHash = this.hashToken(oldToken);

    // Start transaction for atomic operations
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Find the old token and associated user
      const tokenResult = await client.query<
        RefreshToken & User & { user_created_at: Date }
      >(
        `SELECT
          rt.*,
          u.id as user_id,
          u.email,
          u.email_verified,
          u.first_name,
          u.last_name,
          u.company_name,
          u.status,
          u.role,
          u.created_at as user_created_at
         FROM refresh_tokens rt
         JOIN users u ON rt.user_id = u.id
         WHERE rt.token_hash = $1`,
        [oldTokenHash]
      );

      if (tokenResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return null;
      }

      const oldTokenData = tokenResult.rows[0];

      // SECURITY: Check if token was already revoked (reuse attack detection)
      if (oldTokenData.is_revoked) {
        // Revoke entire token family - possible token theft
        await client.query(
          `UPDATE refresh_tokens
           SET is_revoked = TRUE, revoked_at = NOW(), revoked_reason = 'reuse_detected'
           WHERE family_id = $1 AND is_revoked = FALSE`,
          [oldTokenData.family_id]
        );
        await client.query('COMMIT');

        // Log suspicious activity
        console.warn(
          `SECURITY: Refresh token reuse detected for user ${oldTokenData.user_id}, family ${oldTokenData.family_id}`
        );
        return null;
      }

      // Check if token has expired
      if (new Date(oldTokenData.expires_at) < new Date()) {
        await client.query('ROLLBACK');
        return null;
      }

      // Check absolute expiration (hard limit even with rotation)
      if (new Date(oldTokenData.absolute_expires_at) < new Date()) {
        await client.query('ROLLBACK');
        return null;
      }

      // Check user status
      if (oldTokenData.status !== 'active') {
        await client.query('ROLLBACK');
        return null;
      }

      // Revoke old token
      await client.query(
        `UPDATE refresh_tokens
         SET is_revoked = TRUE, revoked_at = NOW(), revoked_reason = 'rotated'
         WHERE id = $1`,
        [oldTokenData.id]
      );

      // Create new refresh token in same family (preserves absolute expiry)
      const newToken = this.generateRefreshToken();
      const newTokenHash = this.hashToken(newToken);

      // Calculate new expiry, but don't exceed absolute expiry
      const newExpiresAt = new Date(
        Math.min(
          Date.now() + REFRESH_TOKEN_CONFIG.expiryMs,
          new Date(oldTokenData.absolute_expires_at).getTime()
        )
      );

      const newTokenResult = await client.query<{ id: string }>(
        `INSERT INTO refresh_tokens
         (user_id, token_hash, family_id, user_agent, ip_address, device_fingerprint, expires_at, absolute_expires_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [
          oldTokenData.user_id,
          newTokenHash,
          oldTokenData.family_id,
          deviceInfo.userAgent || null,
          deviceInfo.ipAddress || null,
          deviceInfo.fingerprint || null,
          newExpiresAt,
          oldTokenData.absolute_expires_at, // Preserve original absolute expiry
        ]
      );

      // Link old token to new (for audit trail)
      await client.query(
        `UPDATE refresh_tokens SET replaced_by_token_id = $1 WHERE id = $2`,
        [newTokenResult.rows[0].id, oldTokenData.id]
      );

      // Update last used timestamp on old token
      await client.query(
        `UPDATE refresh_tokens SET last_used_at = NOW() WHERE id = $1`,
        [oldTokenData.id]
      );

      await client.query('COMMIT');

      // Build safe user object
      const user: SafeUser = {
        id: oldTokenData.user_id,
        email: oldTokenData.email,
        email_verified: oldTokenData.email_verified,
        first_name: oldTokenData.first_name,
        last_name: oldTokenData.last_name,
        company_name: oldTokenData.company_name,
        status: oldTokenData.status,
        role: oldTokenData.role,
        created_at: oldTokenData.user_created_at,
        deletion_requested_at: oldTokenData.deletion_requested_at ?? null,
        deletion_scheduled_for: oldTokenData.deletion_scheduled_for ?? null,
      };

      // Generate new access token
      const accessToken = this.generateAccessToken(user);

      return {
        tokenPair: {
          accessToken,
          refreshToken: newToken,
          expiresIn: JWT_CONFIG.accessTokenExpiry,
        },
        user,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Revoke a single refresh token
   */
  async revokeToken(tokenHash: string, reason: string): Promise<boolean> {
    const result = await pool.query(
      `UPDATE refresh_tokens
       SET is_revoked = TRUE, revoked_at = NOW(), revoked_reason = $1
       WHERE token_hash = $2 AND is_revoked = FALSE`,
      [reason, tokenHash]
    );

    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Revoke all tokens in a family (for security events)
   */
  async revokeTokenFamily(familyId: string, reason: string): Promise<number> {
    const result = await pool.query(
      `UPDATE refresh_tokens
       SET is_revoked = TRUE, revoked_at = NOW(), revoked_reason = $1
       WHERE family_id = $2 AND is_revoked = FALSE`,
      [reason, familyId]
    );

    return result.rowCount ?? 0;
  }

  /**
   * Revoke all tokens for a user (logout from all devices)
   */
  async revokeAllUserTokens(userId: string, reason: string): Promise<number> {
    const result = await pool.query(
      `UPDATE refresh_tokens
       SET is_revoked = TRUE, revoked_at = NOW(), revoked_reason = $1
       WHERE user_id = $2 AND is_revoked = FALSE`,
      [reason, userId]
    );

    return result.rowCount ?? 0;
  }

  /**
   * Find refresh token by hash (for logout)
   */
  async findRefreshToken(tokenHash: string): Promise<RefreshToken | null> {
    const result = await pool.query<RefreshToken>(
      `SELECT * FROM refresh_tokens WHERE token_hash = $1`,
      [tokenHash]
    );

    return result.rows[0] || null;
  }

  /**
   * Get active sessions for a user
   */
  async getUserSessions(userId: string): Promise<
    Array<{
      id: string;
      user_agent: string | null;
      ip_address: string | null;
      created_at: Date;
      last_used_at: Date | null;
    }>
  > {
    const result = await pool.query(
      `SELECT DISTINCT ON (family_id)
        id, user_agent, ip_address, created_at, last_used_at
       FROM refresh_tokens
       WHERE user_id = $1 AND is_revoked = FALSE AND expires_at > NOW()
       ORDER BY family_id, created_at DESC`,
      [userId]
    );

    return result.rows;
  }
}

// Export singleton instance
export const tokenService = new TokenService();
