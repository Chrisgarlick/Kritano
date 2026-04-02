import { pool } from '../db/index.js';
import { passwordService } from './password.service.js';
import { LOCKOUT_CONFIG } from '../config/auth.config.js';
import type { User, SafeUser, RegisterInput, OAuthProfile } from '../types/auth.types.js';

/**
 * User service for managing user accounts.
 */
export class UserService {
  /**
   * Create a new user account
   */
  async create(input: RegisterInput): Promise<SafeUser> {
    // Hash password
    const passwordHash = await passwordService.hash(input.password);

    const result = await pool.query<User>(
      `INSERT INTO users (email, password_hash, first_name, last_name, company_name)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [input.email, passwordHash, input.firstName, input.lastName, input.companyName || null]
    );

    // Create free subscription for new user
    await pool.query(
      `INSERT INTO subscriptions (user_id, tier, status) VALUES ($1, 'free', 'active')`,
      [result.rows[0].id]
    );

    return this.toSafeUser(result.rows[0]);
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    const result = await pool.query<User>(
      `SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL`,
      [email.toLowerCase()]
    );

    return result.rows[0] || null;
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    const result = await pool.query<User>(
      `SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );

    return result.rows[0] || null;
  }

  /**
   * Find safe user by ID (without sensitive fields)
   */
  async findSafeById(id: string): Promise<SafeUser | null> {
    const user = await this.findById(id);
    return user ? this.toSafeUser(user) : null;
  }

  /**
   * Check if email is already registered
   */
  async emailExists(email: string): Promise<boolean> {
    const result = await pool.query(
      `SELECT 1 FROM users WHERE email = $1`,
      [email.toLowerCase()]
    );

    return result.rows.length > 0;
  }

  /**
   * Update user's email verification status
   */
  async verifyEmail(userId: string): Promise<void> {
    await pool.query(
      `UPDATE users
       SET email_verified = TRUE, email_verified_at = NOW(), status = 'active'
       WHERE id = $1`,
      [userId]
    );
  }

  /**
   * Update user's password
   */
  async updatePassword(userId: string, newPassword: string): Promise<void> {
    const passwordHash = await passwordService.hash(newPassword);

    await pool.query(
      `UPDATE users
       SET password_hash = $1, password_changed_at = NOW()
       WHERE id = $2`,
      [passwordHash, userId]
    );
  }

  /**
   * Record successful login
   */
  async recordLoginSuccess(userId: string, ipAddress: string): Promise<void> {
    await pool.query(
      `UPDATE users
       SET last_login_at = NOW(), last_login_ip = $2, failed_login_attempts = 0, lockout_until = NULL
       WHERE id = $1`,
      [userId, ipAddress]
    );
  }

  /**
   * Record failed login attempt
   * Returns whether the account is now locked
   */
  async recordLoginFailure(userId: string): Promise<{ locked: boolean; lockoutUntil: Date | null }> {
    const result = await pool.query<{ failed_login_attempts: number; lockout_until: Date | null }>(
      `UPDATE users
       SET failed_login_attempts = failed_login_attempts + 1,
           lockout_until = CASE
             WHEN failed_login_attempts + 1 >= $2
             THEN NOW() + make_interval(secs => $3 / 1000.0)
             ELSE lockout_until
           END
       WHERE id = $1
       RETURNING failed_login_attempts, lockout_until`,
      [userId, LOCKOUT_CONFIG.maxFailedAttempts, LOCKOUT_CONFIG.lockoutDurationMs]
    );

    const row = result.rows[0];
    return {
      locked: row.failed_login_attempts >= LOCKOUT_CONFIG.maxFailedAttempts,
      lockoutUntil: row.lockout_until,
    };
  }

  /**
   * Check if user account is locked
   */
  async isLocked(userId: string): Promise<{ locked: boolean; until: Date | null }> {
    const result = await pool.query<{ lockout_until: Date | null }>(
      `SELECT lockout_until FROM users WHERE id = $1`,
      [userId]
    );

    const lockoutUntil = result.rows[0]?.lockout_until;

    if (lockoutUntil && new Date(lockoutUntil) > new Date()) {
      return { locked: true, until: lockoutUntil };
    }

    return { locked: false, until: null };
  }

  /**
   * Unlock user account
   */
  async unlock(userId: string): Promise<void> {
    await pool.query(
      `UPDATE users
       SET failed_login_attempts = 0, lockout_until = NULL
       WHERE id = $1`,
      [userId]
    );
  }

  /**
   * Create a new user from OAuth profile (no password)
   */
  async createOAuthUser(profile: OAuthProfile): Promise<SafeUser> {
    const result = await pool.query<User>(
      `INSERT INTO users (email, password_hash, first_name, last_name, email_verified, email_verified_at, status, avatar_url)
       VALUES ($1, NULL, $2, $3, TRUE, NOW(), 'active', $4)
       RETURNING *`,
      [
        profile.email!.toLowerCase(),
        profile.firstName || '',
        profile.lastName || '',
        profile.avatarUrl,
      ]
    );

    // Create free subscription for new OAuth user
    await pool.query(
      `INSERT INTO subscriptions (user_id, tier, status) VALUES ($1, 'free', 'active')`,
      [result.rows[0].id]
    );

    return this.toSafeUser(result.rows[0]);
  }

  /**
   * Check if user has a password set
   */
  async hasPassword(userId: string): Promise<boolean> {
    const result = await pool.query<{ password_hash: string | null }>(
      `SELECT password_hash FROM users WHERE id = $1`,
      [userId]
    );
    return result.rows[0]?.password_hash != null;
  }

  /**
   * Convert User to SafeUser (remove sensitive fields)
   */
  toSafeUser(user: User): SafeUser {
    return {
      id: user.id,
      email: user.email,
      email_verified: user.email_verified,
      first_name: user.first_name,
      last_name: user.last_name,
      company_name: user.company_name,
      status: user.status,
      role: user.role,
      created_at: user.created_at,
      deletion_requested_at: user.deletion_requested_at,
      deletion_scheduled_for: user.deletion_scheduled_for,
    };
  }
}

// Export singleton instance
export const userService = new UserService();
