import type { User, SafeUser, RegisterInput, OAuthProfile } from '../types/auth.types.js';
/**
 * User service for managing user accounts.
 */
export declare class UserService {
    /**
     * Create a new user account
     */
    create(input: RegisterInput): Promise<SafeUser>;
    /**
     * Find user by email
     */
    findByEmail(email: string): Promise<User | null>;
    /**
     * Find user by ID
     */
    findById(id: string): Promise<User | null>;
    /**
     * Find safe user by ID (without sensitive fields)
     */
    findSafeById(id: string): Promise<SafeUser | null>;
    /**
     * Check if email is already registered
     */
    emailExists(email: string): Promise<boolean>;
    /**
     * Update user's email verification status
     */
    verifyEmail(userId: string): Promise<void>;
    /**
     * Update user's password
     */
    updatePassword(userId: string, newPassword: string): Promise<void>;
    /**
     * Record successful login
     */
    recordLoginSuccess(userId: string, ipAddress: string): Promise<void>;
    /**
     * Record failed login attempt
     * Returns whether the account is now locked
     */
    recordLoginFailure(userId: string): Promise<{
        locked: boolean;
        lockoutUntil: Date | null;
    }>;
    /**
     * Check if user account is locked
     */
    isLocked(userId: string): Promise<{
        locked: boolean;
        until: Date | null;
    }>;
    /**
     * Unlock user account
     */
    unlock(userId: string): Promise<void>;
    /**
     * Create a new user from OAuth profile (no password)
     */
    createOAuthUser(profile: OAuthProfile): Promise<SafeUser>;
    /**
     * Check if user has a password set
     */
    hasPassword(userId: string): Promise<boolean>;
    /**
     * Convert User to SafeUser (remove sensitive fields)
     */
    toSafeUser(user: User): SafeUser;
}
export declare const userService: UserService;
//# sourceMappingURL=user.service.d.ts.map