"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = exports.UserService = void 0;
const index_js_1 = require("../db/index.js");
const password_service_js_1 = require("./password.service.js");
const auth_config_js_1 = require("../config/auth.config.js");
/**
 * User service for managing user accounts.
 */
class UserService {
    /**
     * Create a new user account
     */
    async create(input) {
        // Hash password
        const passwordHash = await password_service_js_1.passwordService.hash(input.password);
        const result = await index_js_1.pool.query(`INSERT INTO users (email, password_hash, first_name, last_name, company_name)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`, [input.email, passwordHash, input.firstName, input.lastName, input.companyName || null]);
        // Create free subscription for new user
        await index_js_1.pool.query(`INSERT INTO subscriptions (user_id, tier, status) VALUES ($1, 'free', 'active')`, [result.rows[0].id]);
        return this.toSafeUser(result.rows[0]);
    }
    /**
     * Find user by email
     */
    async findByEmail(email) {
        const result = await index_js_1.pool.query(`SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL`, [email.toLowerCase()]);
        return result.rows[0] || null;
    }
    /**
     * Find user by ID
     */
    async findById(id) {
        const result = await index_js_1.pool.query(`SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL`, [id]);
        return result.rows[0] || null;
    }
    /**
     * Find safe user by ID (without sensitive fields)
     */
    async findSafeById(id) {
        const user = await this.findById(id);
        return user ? this.toSafeUser(user) : null;
    }
    /**
     * Check if email is already registered
     */
    async emailExists(email) {
        const result = await index_js_1.pool.query(`SELECT 1 FROM users WHERE email = $1`, [email.toLowerCase()]);
        return result.rows.length > 0;
    }
    /**
     * Update user's email verification status
     */
    async verifyEmail(userId) {
        await index_js_1.pool.query(`UPDATE users
       SET email_verified = TRUE, email_verified_at = NOW(), status = 'active'
       WHERE id = $1`, [userId]);
    }
    /**
     * Update user's password
     */
    async updatePassword(userId, newPassword) {
        const passwordHash = await password_service_js_1.passwordService.hash(newPassword);
        await index_js_1.pool.query(`UPDATE users
       SET password_hash = $1, password_changed_at = NOW()
       WHERE id = $2`, [passwordHash, userId]);
    }
    /**
     * Record successful login
     */
    async recordLoginSuccess(userId, ipAddress) {
        await index_js_1.pool.query(`UPDATE users
       SET last_login_at = NOW(), last_login_ip = $2, failed_login_attempts = 0, lockout_until = NULL
       WHERE id = $1`, [userId, ipAddress]);
    }
    /**
     * Record failed login attempt
     * Returns whether the account is now locked
     */
    async recordLoginFailure(userId) {
        const result = await index_js_1.pool.query(`UPDATE users
       SET failed_login_attempts = failed_login_attempts + 1,
           lockout_until = CASE
             WHEN failed_login_attempts + 1 >= $2
             THEN NOW() + make_interval(secs => $3 / 1000.0)
             ELSE lockout_until
           END
       WHERE id = $1
       RETURNING failed_login_attempts, lockout_until`, [userId, auth_config_js_1.LOCKOUT_CONFIG.maxFailedAttempts, auth_config_js_1.LOCKOUT_CONFIG.lockoutDurationMs]);
        const row = result.rows[0];
        return {
            locked: row.failed_login_attempts >= auth_config_js_1.LOCKOUT_CONFIG.maxFailedAttempts,
            lockoutUntil: row.lockout_until,
        };
    }
    /**
     * Check if user account is locked
     */
    async isLocked(userId) {
        const result = await index_js_1.pool.query(`SELECT lockout_until FROM users WHERE id = $1`, [userId]);
        const lockoutUntil = result.rows[0]?.lockout_until;
        if (lockoutUntil && new Date(lockoutUntil) > new Date()) {
            return { locked: true, until: lockoutUntil };
        }
        return { locked: false, until: null };
    }
    /**
     * Unlock user account
     */
    async unlock(userId) {
        await index_js_1.pool.query(`UPDATE users
       SET failed_login_attempts = 0, lockout_until = NULL
       WHERE id = $1`, [userId]);
    }
    /**
     * Create a new user from OAuth profile (no password)
     */
    async createOAuthUser(profile) {
        const result = await index_js_1.pool.query(`INSERT INTO users (email, password_hash, first_name, last_name, email_verified, email_verified_at, status, avatar_url)
       VALUES ($1, NULL, $2, $3, TRUE, NOW(), 'active', $4)
       RETURNING *`, [
            profile.email.toLowerCase(),
            profile.firstName || '',
            profile.lastName || '',
            profile.avatarUrl,
        ]);
        // Create free subscription for new OAuth user
        await index_js_1.pool.query(`INSERT INTO subscriptions (user_id, tier, status) VALUES ($1, 'free', 'active')`, [result.rows[0].id]);
        return this.toSafeUser(result.rows[0]);
    }
    /**
     * Check if user has a password set
     */
    async hasPassword(userId) {
        const result = await index_js_1.pool.query(`SELECT password_hash FROM users WHERE id = $1`, [userId]);
        return result.rows[0]?.password_hash != null;
    }
    /**
     * Convert User to SafeUser (remove sensitive fields)
     */
    toSafeUser(user) {
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
            beta_access: user.beta_access ?? false,
        };
    }
}
exports.UserService = UserService;
// Export singleton instance
exports.userService = new UserService();
//# sourceMappingURL=user.service.js.map