
import { authApi } from '@/src/lib/auth';

export const authService = {
    async startSignup(email: string) {
        return authApi.start(email);
    },

    async checkUsername(username: string) {
        const res = await authApi.checkUsernameAvailability(username);
        return res.available;
    },

    async signup(data: any) {
        const payload = {
            email: data.email,
            password: data.password,
            confirmPassword: data.confirmPassword,
            username: data.username,
            fullName: data.fullName,
            dob: data.dob,
            newsletterOptIn: data.newsletterOptIn || false,
            referralCode: data.referralCode || '',
        };
        return authApi.signup(payload);
    },

    async login(data: { email: string; password?: string; otp?: string }) {
        return authApi.signin(data);
    },

    async signinOtp(email: string) {
        return authApi.signinOtp(email);
    },

    async verifyOtp(email: string, token: string, type: string) {
        return authApi.verifyOtp(email, token, type);
    },

    async forgotPassword(email: string) {
        return authApi.forgotPassword(email);
    },

    async resetPassword(data: { email: string; token: string; newPassword: string; confirmPassword: string }) {
        return authApi.resetPassword(data);
    },

    async resendConfirmation(email: string) {
        return authApi.resendConfirmation(email);
    },

    async logout() {
        const token = localStorage.getItem('access_token');
        if (token) {
            return authApi.logout(token);
        }
    },
};
