const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://mugshot-studio-api.onrender.com';

export interface User {
    id: string;
    email: string;
    username: string;
    full_name?: string;
    dob?: string;
    profile_photo_url?: string;
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
    }
};
