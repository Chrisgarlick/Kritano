"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePasswordSchema = exports.verifyEmailSchema = exports.passwordResetSchema = exports.passwordResetRequestSchema = exports.loginSchema = exports.registerSchema = exports.emailSchema = exports.passwordSchema = void 0;
const zod_1 = require("zod");
const auth_config_js_1 = require("../config/auth.config.js");
// Password validation schema with security requirements
exports.passwordSchema = zod_1.z
    .string()
    .min(auth_config_js_1.PASSWORD_CONFIG.minLength, `Password must be at least ${auth_config_js_1.PASSWORD_CONFIG.minLength} characters`)
    .max(auth_config_js_1.PASSWORD_CONFIG.maxLength, `Password must not exceed ${auth_config_js_1.PASSWORD_CONFIG.maxLength} characters`)
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');
// Email validation with normalization
exports.emailSchema = zod_1.z
    .string()
    .email('Invalid email address')
    .max(255, 'Email must not exceed 255 characters')
    .transform((val) => val.toLowerCase().trim());
// Registration schema
exports.registerSchema = zod_1.z.object({
    email: exports.emailSchema,
    password: exports.passwordSchema,
    firstName: zod_1.z
        .string()
        .min(1, 'First name is required')
        .max(100, 'First name must not exceed 100 characters')
        .trim(),
    lastName: zod_1.z
        .string()
        .min(1, 'Last name is required')
        .max(100, 'Last name must not exceed 100 characters')
        .trim(),
    companyName: zod_1.z
        .string()
        .max(255, 'Company name must not exceed 255 characters')
        .trim()
        .optional(),
    // Terms of Service acceptance (required)
    acceptedTos: zod_1.z
        .boolean()
        .refine((val) => val === true, {
        message: 'You must accept the Terms of Service to register',
    }),
    // Optional referral code from URL param
    referralCode: zod_1.z.string().max(20).optional(),
    // Optional early access flag from URL param
    earlyAccess: zod_1.z.boolean().optional(),
    // Marketing email opt-in (unchecked = false, GDPR compliant)
    marketingOptIn: zod_1.z.boolean().optional(),
    // Optional UTM attribution parameters
    utmSource: zod_1.z.string().max(255).optional(),
    utmMedium: zod_1.z.string().max(255).optional(),
    utmCampaign: zod_1.z.string().max(255).optional(),
});
// Login schema
exports.loginSchema = zod_1.z.object({
    email: exports.emailSchema,
    password: zod_1.z.string().min(1, 'Password is required'),
});
// Password reset request schema
exports.passwordResetRequestSchema = zod_1.z.object({
    email: exports.emailSchema,
});
// Password reset schema (with new password)
exports.passwordResetSchema = zod_1.z.object({
    token: zod_1.z.string().min(1, 'Token is required'),
    password: exports.passwordSchema,
});
// Email verification schema
exports.verifyEmailSchema = zod_1.z.object({
    token: zod_1.z.string().min(1, 'Token is required'),
});
// Change password schema (when logged in)
exports.changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1, 'Current password is required'),
    newPassword: exports.passwordSchema,
});
//# sourceMappingURL=auth.schemas.js.map