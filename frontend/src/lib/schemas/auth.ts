
import { z } from 'zod';

// Username regex: 3-20 chars, alphanumeric, underscore, dot, no consecutive dots/underscores
const usernameRegex = /^[a-zA-Z0-9]([._-](?![._-])|[a-zA-Z0-9]){1,18}[a-zA-Z0-9]$/;

export const signupSchemaValues = {
    email: z.string().email('Invalid email address'),
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
        .regex(/[0-9]/, 'Must contain at least one number')
        .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character'),
    username: z.string()
        .min(3, 'Username must be at least 3 characters')
        .max(20, 'Username must be at most 20 characters')
        .regex(usernameRegex, 'Invalid username format'),
    full_name: z.string().min(2, 'Name is required'),
    dob: z.string().refine((val) => {
        const date = new Date(val);
        const now = new Date();
        // basic check for age > 13
        const age = now.getFullYear() - date.getFullYear();
        return age >= 13;
    }, 'You must be at least 13 years old'),
};

export const step1Schema = z.object({
    email: signupSchemaValues.email,
    password: signupSchemaValues.password,
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

export const step2Schema = z.object({
    username: signupSchemaValues.username,
    full_name: signupSchemaValues.full_name,
    dob: signupSchemaValues.dob,
});

export const step3Schema = z.object({
    otp: z.string().min(6, 'OTP must be 6 digits').max(6, 'OTP must be 6 digits'),
});

export const signinSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
    email: z.string().email(),
});

export const resetPasswordSchema = z.object({
    password: signupSchemaValues.password,
    confirmPassword: z.string(),
    otp: z.string().length(6, 'OTP must be 6 digits')
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: signupSchemaValues.password,
    confirmNewPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords don't match",
    path: ["confirmNewPassword"],
});

export type Step1Data = z.infer<typeof step1Schema>;
export type Step2Data = z.infer<typeof step2Schema>;
export type Step3Data = z.infer<typeof step3Schema>;
export type SigninData = z.infer<typeof signinSchema>;
export type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordData = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordData = z.infer<typeof changePasswordSchema>;
