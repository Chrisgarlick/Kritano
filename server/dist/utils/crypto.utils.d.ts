/**
 * Generate a cryptographically secure random token
 * @param length - Number of bytes (default 32 = 256 bits)
 * @returns Base64url encoded token string
 */
export declare function generateSecureToken(length?: number): string;
/**
 * Hash a token using SHA-256 for secure storage
 * @param token - Plain text token
 * @returns Hex-encoded hash
 */
export declare function hashToken(token: string): string;
/**
 * Timing-safe string comparison to prevent timing attacks
 * @param a - First string
 * @param b - Second string
 * @returns True if strings are equal
 */
export declare function timingSafeEqual(a: string, b: string): boolean;
/**
 * Generate a UUID v4
 * @returns UUID string
 */
export declare function generateUUID(): string;
/**
 * Encrypt a string using AES-256-GCM
 * @returns Base64 encoded string: iv:authTag:ciphertext
 */
export declare function encryptToken(plaintext: string): string;
/**
 * Decrypt a string encrypted with encryptToken
 */
export declare function decryptToken(encryptedStr: string): string;
//# sourceMappingURL=crypto.utils.d.ts.map