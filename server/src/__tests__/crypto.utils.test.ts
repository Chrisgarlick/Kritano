import { describe, it, expect } from 'vitest';
import { generateSecureToken, hashToken, timingSafeEqual } from '../utils/crypto.utils.js';

describe('Crypto Utils', () => {
  describe('generateSecureToken', () => {
    it('should return a base64url string', () => {
      const token = generateSecureToken();
      // base64url uses only [A-Za-z0-9_-] characters
      expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('should return correct length for default (32 bytes)', () => {
      const token = generateSecureToken();
      // 32 bytes = 43 base64url characters (no padding)
      expect(token.length).toBe(43);
    });

    it('should return correct length for custom byte count', () => {
      const token16 = generateSecureToken(16);
      // 16 bytes = 22 base64url characters
      expect(token16.length).toBe(22);

      const token64 = generateSecureToken(64);
      // 64 bytes = 86 base64url characters
      expect(token64.length).toBe(86);
    });

    it('should generate unique tokens', () => {
      const tokens = new Set(Array.from({ length: 100 }, () => generateSecureToken()));
      expect(tokens.size).toBe(100);
    });
  });

  describe('hashToken', () => {
    it('should return a hex-encoded SHA-256 hash (64 chars)', () => {
      const hash = hashToken('test-token');
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should be deterministic — same input produces same hash', () => {
      const hash1 = hashToken('my-secret-token');
      const hash2 = hashToken('my-secret-token');
      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different inputs', () => {
      const hash1 = hashToken('token-a');
      const hash2 = hashToken('token-b');
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('timingSafeEqual', () => {
    it('should return true for identical strings', () => {
      expect(timingSafeEqual('hello', 'hello')).toBe(true);
    });

    it('should return false for different strings of equal length', () => {
      expect(timingSafeEqual('hello', 'world')).toBe(false);
    });

    it('should return false for strings of different length', () => {
      expect(timingSafeEqual('short', 'a-much-longer-string')).toBe(false);
    });

    it('should return true for empty strings', () => {
      expect(timingSafeEqual('', '')).toBe(true);
    });

    it('should return false when one string is empty', () => {
      expect(timingSafeEqual('', 'notempty')).toBe(false);
    });
  });
});
