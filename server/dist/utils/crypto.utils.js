"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSecureToken = generateSecureToken;
exports.hashToken = hashToken;
exports.timingSafeEqual = timingSafeEqual;
exports.generateUUID = generateUUID;
exports.encryptToken = encryptToken;
exports.decryptToken = decryptToken;
const crypto_1 = __importDefault(require("crypto"));
/**
 * Generate a cryptographically secure random token
 * @param length - Number of bytes (default 32 = 256 bits)
 * @returns Base64url encoded token string
 */
function generateSecureToken(length = 32) {
    return crypto_1.default.randomBytes(length).toString('base64url');
}
/**
 * Hash a token using SHA-256 for secure storage
 * @param token - Plain text token
 * @returns Hex-encoded hash
 */
function hashToken(token) {
    return crypto_1.default.createHash('sha256').update(token).digest('hex');
}
/**
 * Timing-safe string comparison to prevent timing attacks
 * @param a - First string
 * @param b - Second string
 * @returns True if strings are equal
 */
function timingSafeEqual(a, b) {
    const hashA = crypto_1.default.createHash('sha256').update(a).digest();
    const hashB = crypto_1.default.createHash('sha256').update(b).digest();
    return crypto_1.default.timingSafeEqual(hashA, hashB);
}
/**
 * Generate a UUID v4
 * @returns UUID string
 */
function generateUUID() {
    return crypto_1.default.randomUUID();
}
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
function getEncryptionKey() {
    const key = process.env.TOKEN_ENCRYPTION_KEY || process.env.JWT_SECRET;
    if (!key)
        throw new Error('TOKEN_ENCRYPTION_KEY or JWT_SECRET required for encryption');
    return crypto_1.default.createHash('sha256').update(key).digest();
}
/**
 * Encrypt a string using AES-256-GCM
 * @returns Base64 encoded string: iv:authTag:ciphertext
 */
function encryptToken(plaintext) {
    const key = getEncryptionKey();
    const iv = crypto_1.default.randomBytes(IV_LENGTH);
    const cipher = crypto_1.default.createCipheriv(ENCRYPTION_ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return `${iv.toString('base64')}.${authTag.toString('base64')}.${encrypted.toString('base64')}`;
}
/**
 * Decrypt a string encrypted with encryptToken
 */
function decryptToken(encryptedStr) {
    const parts = encryptedStr.split('.');
    if (parts.length !== 3)
        throw new Error('Invalid encrypted token format');
    const [ivB64, authTagB64, ciphertextB64] = parts;
    const key = getEncryptionKey();
    const iv = Buffer.from(ivB64, 'base64');
    const authTag = Buffer.from(authTagB64, 'base64');
    const ciphertext = Buffer.from(ciphertextB64, 'base64');
    const decipher = crypto_1.default.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
    decipher.setAuthTag(authTag);
    return decipher.update(ciphertext) + decipher.final('utf8');
}
//# sourceMappingURL=crypto.utils.js.map