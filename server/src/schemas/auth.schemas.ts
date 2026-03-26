import { z } from 'zod';
import { PASSWORD_CONFIG } from '../config/auth.config.js';

// Password validation schema with security requirements
export const passwordSchema = z
  .string()
  .min(PASSWORD_CONFIG.minLength, `Password must be at least ${PASSWORD_CONFIG.minLength} characters`)
  .max(PASSWORD_CONFIG.maxLength, `Password must not exceed ${PASSWORD_CONFIG.maxLength} characters`)
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

// Email validation with normalization
export const emailSchema = z
  .string()
  .email('Invalid email address')
  .max(255, 'Email must not exceed 255 characters')
  .transform((val) => val.toLowerCase().trim());

// Registration schema
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(100, 'First name must not exceed 100 characters')
    .trim(),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(100, 'Last name must not exceed 100 characters')
    .trim(),
  companyName: z
    .string()
    .max(255, 'Company name must not exceed 255 characters')
    .trim()
    .optional(),
  // Terms of Service acceptance (required)
  acceptedTos: z
    .boolean()
    .refine((val) => val === true, {
      message: 'You must accept the Terms of Service to register',
    }),
  // Optional referral code from URL param
  referralCode: z.string().max(20).optional(),
  // Optional early access flag from URL param
  earlyAccess: z.boolean().optional(),
  // Marketing email opt-in (unchecked = false, GDPR compliant)
  marketingOptIn: z.boolean().optional(),
  // Optional UTM attribution parameters
  utmSource: z.string().max(255).optional(),
  utmMedium: z.string().max(255).optional(),
  utmCampaign: z.string().max(255).optional(),
});

// Login schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

// Password reset request schema
export const passwordResetRequestSchema = z.object({
  email: emailSchema,
});

// Password reset schema (with new password)
export const passwordResetSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: passwordSchema,
});

// Email verification schema
export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

// Change password schema (when logged in)
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
});

// Export inferred types
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>;
export type PasswordResetInput = z.infer<typeof passwordResetSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
