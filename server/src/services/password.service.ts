import argon2 from 'argon2';
import { ARGON2_CONFIG } from '../config/auth.config.js';
import { passwordSchema } from '../schemas/auth.schemas.js';

/**
 * Password service using Argon2id for secure hashing.
 * Argon2id is the winner of the Password Hashing Competition
 * and is recommended by OWASP for password storage.
 */
export class PasswordService {
  /**
   * Hash a password using Argon2id
   * @param password - Plain text password
   * @returns Hashed password string
   */
  async hash(password: string): Promise<string> {
    return argon2.hash(password, { ...ARGON2_CONFIG, raw: false });
  }

  /**
   * Verify a password against a hash
   * @param password - Plain text password to verify
   * @param hash - Stored hash to verify against
   * @returns True if password matches, false otherwise
   */
  async verify(password: string, hash: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch {
      // Return false on any error (malformed hash, etc.)
      return false;
    }
  }

  /**
   * Check if a hash needs to be rehashed (e.g., after config change)
   * @param hash - Stored hash to check
   * @returns True if hash should be updated
   */
  async needsRehash(hash: string): Promise<boolean> {
    try {
      return argon2.needsRehash(hash, ARGON2_CONFIG);
    } catch {
      return true; // If we can't parse the hash, it needs rehashing
    }
  }

  /**
   * Validate password strength against security requirements
   * @param password - Password to validate
   * @returns Object with validation result and any errors
   */
  validateStrength(password: string): { valid: boolean; errors: string[] } {
    const result = passwordSchema.safeParse(password);

    if (result.success) {
      return { valid: true, errors: [] };
    }

    return {
      valid: false,
      errors: result.error.errors.map((e) => e.message),
    };
  }

  /**
   * Check if password is in common password list
   * This is a basic check - in production, consider using
   * Have I Been Pwned API with k-anonymity
   * @param password - Password to check
   * @returns True if password is common/compromised
   */
  isCommonPassword(password: string): boolean {
    // Top 100 most common passwords (abbreviated list)
    const commonPasswords = new Set([
      'password',
      '123456',
      '12345678',
      'qwerty',
      'abc123',
      'monkey',
      '1234567',
      'letmein',
      'trustno1',
      'dragon',
      'baseball',
      'iloveyou',
      'master',
      'sunshine',
      'ashley',
      'bailey',
      'shadow',
      'passw0rd',
      '123456789',
      '654321',
      'superman',
      'qazwsx',
      'michael',
      'football',
      'password1',
      'password123',
      'welcome',
      'welcome1',
      'admin',
      'login',
    ]);

    return commonPasswords.has(password.toLowerCase());
  }
}

// Export singleton instance
export const passwordService = new PasswordService();
