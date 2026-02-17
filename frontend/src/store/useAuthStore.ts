
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, authApi } from '@/src/lib/auth';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;

    setUser: (user: User | null) => void;
    checkUsername: (username: string) => Promise<boolean>;
    signup: (data: any) => Promise<void>;
    login: (email: string, password: string) => Promise<void>;
    loginWithOtp: (email: string) => Promise<void>;
    verifyOtp: (data: { email: string; token: string; type: string }) => Promise<void>;
    logout: () => Promise<void>;
    startAuth: (email: string) => Promise<{ exists: boolean; next: 'password' | 'social_login' | 'create_account' }>;

    // Sessions
    getSessions: () => Promise<any[]>;
    revokeSession: (sessionId: string) => Promise<void>;
    revokeAllSessions: () => Promise<void>;

    // Security
    changePassword: (passwordData: any) => Promise<void>;
    changeEmail: (emailData: any) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,

            setUser: (user) => set({ user, isAuthenticated: !!user }),

            checkUsername: async (username) => {
                const res = await authApi.checkUsernameAvailability(username);
                return res.available;
            },

            signup: async (data) => {
                set({ isLoading: true, error: null });
                try {
                    await authApi.signup(data);
                    // Usually signup might return a token or require verification. 
                    // Based on the flow, we might need to verify OTP next.
                } catch (error: any) {
                    set({ error: error.message });
                    throw error;
                } finally {
                    set({ isLoading: false });
                }
            },

            login: async (email, password) => {
                set({ isLoading: true, error: null });
                try {
                    const res = await authApi.signin({ email, password });
                    localStorage.setItem('access_token', res.access_token);
                    set({ user: res.user, isAuthenticated: true });
                } catch (error: any) {
                    set({ error: error.message });
                    throw error;
                } finally {
                    set({ isLoading: false });
                }
            },

            loginWithOtp: async (email) => {
                set({ isLoading: true, error: null });
                try {
                    await authApi.signinOtp(email);
                } catch (error: any) {
                    set({ error: error.message });
                    throw error;
                } finally {
                    set({ isLoading: false });
                }
            },

            verifyOtp: async (data) => {
                set({ isLoading: true, error: null });
                try {
                    const res = await authApi.verifyOtp(data.email, data.token, data.type);
                    localStorage.setItem('access_token', res.access_token);
                    set({ user: res.user, isAuthenticated: true });
                } catch (error: any) {
                    set({ error: error.message });
                    throw error;
                } finally {
                    set({ isLoading: false });
                }
            },

            logout: async () => {
                set({ isLoading: true });
                try {
                    const token = localStorage.getItem('access_token');
                    if (token) {
                        await authApi.logout(token);
                    }
                } catch (error) {
                    console.error('Logout failed', error);
                } finally {
                    localStorage.removeItem('access_token');
                    set({ user: null, isAuthenticated: false, isLoading: false });
                }
            },

            startAuth: async (email) => {
                set({ isLoading: true, error: null });
                try {
                    return await authApi.start(email);
                } catch (error: any) {
                    set({ error: error.message });
                    throw error;
                } finally {
                    set({ isLoading: false });
                }
            },

            getSessions: async () => {
                const token = localStorage.getItem('access_token');
                if (!token) return [];
                return await authApi.getSessions(token);
            },

            revokeSession: async (sessionId) => {
                const token = localStorage.getItem('access_token');
                if (!token) return;
                await authApi.revokeSession(token, sessionId);
            },

            revokeAllSessions: async () => {
                const token = localStorage.getItem('access_token');
                if (!token) return;
                await authApi.revokeAllSessions(token);
            },

            changePassword: async (data) => {
                const token = localStorage.getItem('access_token');
                if (!token) throw new Error("Not authenticated");
                await authApi.changePassword(token, data.currentPassword, data.newPassword, data.confirmPassword);
            },

            changeEmail: async (data) => {
                const token = localStorage.getItem('access_token');
                if (!token) throw new Error("Not authenticated");
                await authApi.changeEmail(token, data.newEmail, data.password);
            }
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
        }
    )
);
