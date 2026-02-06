const API_URL = process.env.NODE_ENV === 'development' ? '' : (process.env.NEXT_PUBLIC_API_URL || 'https://mugshot-studio-api.onrender.com');

export interface User {
    id: string;
    email: string;
    username: string;
    full_name?: string;
    dob?: string;
    profile_photo_url?: string;
    bio?: string;
    website?: string;
    plan: string;
    credits: number;
    created_at: string;
}

export interface AuthResponse {
    access_token: string;
    token_type: string;
    user: User;
}

export interface AuthStartResponse {
    exists: boolean;
    next: 'password' | 'social_login' | 'create_account';
}

export const authApi = {
    async start(email: string): Promise<AuthStartResponse> {
        const res = await fetch(`${API_URL}/api/v1/auth/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });
        if (!res.ok) throw new Error('Failed to check user');
        return res.json();
    },

    async signup(data: any): Promise<AuthResponse> {
        const res = await fetch(`${API_URL}/api/v1/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.detail || 'Signup failed');
        }
        return res.json();
    },

    async signin(data: any): Promise<AuthResponse> {
        const res = await fetch(`${API_URL}/api/v1/auth/signin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.detail || 'Signin failed');
        }
        return res.json();
    },

    async getProfile(token: string): Promise<User> {
        const res = await fetch(`${API_URL}/api/v1/profile/`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
        });
        if (!res.ok) throw new Error('Failed to fetch profile');
        return res.json();
    },

    async updateProfile(token: string, data: Partial<User>): Promise<User> {
        const res = await fetch(`${API_URL}/api/v1/profile/`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data),
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.detail || 'Failed to update profile');
        }
        return res.json();
    },

    async uploadAvatar(token: string, file: File): Promise<{ message: string, url: string }> {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch(`${API_URL}/api/v1/profile/avatar`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData,
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.detail || 'Failed to upload avatar');
        }
        return res.json();
    },

    async deleteAvatar(token: string): Promise<{ message: string }> {
        const res = await fetch(`${API_URL}/api/v1/profile/avatar`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.detail || 'Failed to delete avatar');
        }
        return res.json();
    },

    async deleteAccount(token: string): Promise<void> {
        const res = await fetch(`${API_URL}/api/v1/profile/`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.detail || 'Failed to delete account');
        }
    },

    async forgotPassword(email: string): Promise<{ message: string }> {
        const res = await fetch(`${API_URL}/api/v1/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.detail || 'Failed to send reset email');
        }
        return res.json();
    },

    async resetPassword(data: { email: string; otp: string; new_password: string }): Promise<void> {
        const res = await fetch(`${API_URL}/api/v1/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.detail || 'Failed to reset password');
        }
    },

    async checkUsernameAvailability(username: string): Promise<{ available: boolean }> {
        const res = await fetch(`${API_URL}/api/v1/auth/check-username/${username}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.detail || 'Failed to check username');
        }
        return res.json();
    },

    async logout(token: string): Promise<void> {
        const res = await fetch(`${API_URL}/api/v1/auth/logout`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
        });
        if (!res.ok) throw new Error('Failed to logout');
    },

    async getSessions(token: string): Promise<{ id: string; device: string; ip_address: string; last_active: string; is_current: boolean }[]> {
        const res = await fetch(`${API_URL}/api/v1/auth/sessions`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
        });
        if (!res.ok) throw new Error('Failed to fetch sessions');
        return res.json();
    },

    async updateProfilePhoto(token: string, file: File): Promise<{ message: string; url: string }> {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch(`${API_URL}/api/v1/profile/avatar`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData,
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.detail || 'Failed to upload profile photo');
        }
        return res.json();
    },

    async changePassword(token: string, currentPassword: string, newPassword: string): Promise<void> {
        const res = await fetch(`${API_URL}/api/v1/auth/change-password`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.detail || 'Failed to change password');
        }
    },

    async revokeSession(token: string, sessionId: string): Promise<void> {
        const res = await fetch(`${API_URL}/api/v1/auth/sessions/${sessionId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
        });
        if (!res.ok) throw new Error('Failed to revoke session');
    },

    async revokeAllSessions(token: string): Promise<void> {
        const res = await fetch(`${API_URL}/api/v1/auth/sessions`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
        });
        if (!res.ok) throw new Error('Failed to revoke all sessions');
    },

    async signinOtp(email: string, redirectTo?: string): Promise<{ message: string }> {
        const res = await fetch(`${API_URL}/api/v1/auth/signin-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, redirectTo }),
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.detail || 'Failed to send OTP');
        }
        return res.json();
    },

    async verifyOtp(email: string, token: string, type: string = 'email'): Promise<AuthResponse> {
        const res = await fetch(`${API_URL}/api/v1/auth/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, token, type }),
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.detail || 'Failed to verify OTP');
        }
        return res.json();
    },

    async resendConfirmation(email: string, redirectTo?: string): Promise<{ message: string }> {
        const res = await fetch(`${API_URL}/api/v1/auth/resend-confirmation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, redirectTo }),
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.detail || 'Failed to resend confirmation');
        }
        return res.json();
    },

    async changeEmail(token: string, newEmail: string): Promise<{ message: string }> {
        const res = await fetch(`${API_URL}/api/v1/auth/change-email`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ new_email: newEmail }),
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.detail || 'Failed to change email');
        }
        return res.json();
    },

    async registerPushToken(token: string, pushToken: string, platform: 'ios' | 'android' | 'web'): Promise<void> {
        const res = await fetch(`${API_URL}/api/v1/users/push-token`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ push_token: pushToken, platform }),
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.detail || 'Failed to register push token');
        }
    },
};
