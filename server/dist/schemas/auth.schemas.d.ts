import { z } from 'zod';
export declare const passwordSchema: z.ZodString;
export declare const emailSchema: z.ZodEffects<z.ZodString, string, string>;
export declare const registerSchema: z.ZodObject<{
    email: z.ZodEffects<z.ZodString, string, string>;
    password: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    companyName: z.ZodOptional<z.ZodString>;
    acceptedTos: z.ZodEffects<z.ZodBoolean, boolean, boolean>;
    referralCode: z.ZodOptional<z.ZodString>;
    earlyAccess: z.ZodOptional<z.ZodBoolean>;
    marketingOptIn: z.ZodOptional<z.ZodBoolean>;
    utmSource: z.ZodOptional<z.ZodString>;
    utmMedium: z.ZodOptional<z.ZodString>;
    utmCampaign: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    acceptedTos: boolean;
    companyName?: string | undefined;
    referralCode?: string | undefined;
    earlyAccess?: boolean | undefined;
    marketingOptIn?: boolean | undefined;
    utmSource?: string | undefined;
    utmMedium?: string | undefined;
    utmCampaign?: string | undefined;
}, {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    acceptedTos: boolean;
    companyName?: string | undefined;
    referralCode?: string | undefined;
    earlyAccess?: boolean | undefined;
    marketingOptIn?: boolean | undefined;
    utmSource?: string | undefined;
    utmMedium?: string | undefined;
    utmCampaign?: string | undefined;
}>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodEffects<z.ZodString, string, string>;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const passwordResetRequestSchema: z.ZodObject<{
    email: z.ZodEffects<z.ZodString, string, string>;
}, "strip", z.ZodTypeAny, {
    email: string;
}, {
    email: string;
}>;
export declare const passwordResetSchema: z.ZodObject<{
    token: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    password: string;
    token: string;
}, {
    password: string;
    token: string;
}>;
export declare const verifyEmailSchema: z.ZodObject<{
    token: z.ZodString;
}, "strip", z.ZodTypeAny, {
    token: string;
}, {
    token: string;
}>;
export declare const changePasswordSchema: z.ZodObject<{
    currentPassword: z.ZodString;
    newPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    currentPassword: string;
    newPassword: string;
}, {
    currentPassword: string;
    newPassword: string;
}>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>;
export type PasswordResetInput = z.infer<typeof passwordResetSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
//# sourceMappingURL=auth.schemas.d.ts.map