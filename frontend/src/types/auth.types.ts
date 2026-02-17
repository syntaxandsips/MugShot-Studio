export interface User {
    id: string;
    email: string;
    username: string;
    fullName?: string;
    avatarUrl?: string;
    roles?: string[];
    isEmailVerified: boolean;
}

export interface AuthResponse {
    user: User;
    access_token: string;
    refresh_token: string;
}

export interface CheckUsernameResponse {
    available: boolean;
}

export interface SignupRequest {
    email: string;
    password?: string;
    confirmPassword?: string;
    username: string;
    fullName: string;
    dob: string;
    newsletterOptIn: boolean;
    referralCode?: string;
    redirectTo?: string;
}

export interface LoginRequest {
    email: string;
    password?: string;
    otp?: string;
}

export interface VerifyOtpRequest {
    email: string;
    token: string;
    type: 'email_verification' | 'login' | 'password_reset';
}

export interface RefreshTokenRequest {
    refresh_token: string;
}

export interface GoogleAuthRequest {
    idToken: string;
    accessToken: string;
    nonce?: string; // Optional
}
