/**
 * Password service using Argon2id for secure hashing.
 * Argon2id is the winner of the Password Hashing Competition
 * and is recommended by OWASP for password storage.
 */
export declare class PasswordService {
    /**
     * Hash a password using Argon2id
     * @param password - Plain text password
     * @returns Hashed password string
     */
    hash(password: string): Promise<string>;
    /**
     * Verify a password against a hash
     * @param password - Plain text password to verify
     * @param hash - Stored hash to verify against
     * @returns True if password matches, false otherwise
     */
    verify(password: string, hash: string): Promise<boolean>;
    /**
     * Check if a hash needs to be rehashed (e.g., after config change)
     * @param hash - Stored hash to check
     * @returns True if hash should be updated
     */
    needsRehash(hash: string): Promise<boolean>;
    /**
     * Validate password strength against security requirements
     * @param password - Password to validate
     * @returns Object with validation result and any errors
     */
    validateStrength(password: string): {
        valid: boolean;
        errors: string[];
    };
    /**
     * Check if password is in common password list
     * This is a basic check - in production, consider using
     * Have I Been Pwned API with k-anonymity
     * @param password - Password to check
     * @returns True if password is common/compromised
     */
    isCommonPassword(password: string): boolean;
}
export declare const passwordService: PasswordService;
//# sourceMappingURL=password.service.d.ts.map