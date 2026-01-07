'use client';

/* eslint-disable @typescript-eslint/no-confusing-non-null-assertion */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Modal, ModalContent } from '@/src/components/ui/modal';
import Link from 'next/link';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { AtSignIcon, LockIcon, UserIcon, CalendarIcon, Loader2, Eye, EyeOff, X, CheckCircle2, XCircle, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Toast } from '@/src/components/ui/toast';
import { authApi } from '@/src/lib/auth';
import { useAuth } from '@/src/context/auth-context';

type AuthModalProps = Omit<React.ComponentProps<typeof Modal>, 'children'>;

type AuthModeTab = 'login' | 'signup';

interface ApiError {
    detail?: string;
    message?: string;
}

type AuthStep = 'email' | 'login' | 'signup' | 'forgot-password' | 'reset-password';

type AuthTab = 'login' | 'signup';

export function AuthModal(props: AuthModalProps) {
    const router = useRouter();
    const { login } = useAuth();
    
    const [activeTab, setActiveTab] = useState<AuthModeTab>('login');
    const [step, setStep] = useState<AuthStep>('email');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [username, setUsername] = useState('');
    const [fullName, setFullName] = useState('');
    const [dob, setDob] = useState('');
    const [otp, setOtp] = useState('');
    
    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState<'success' | 'error'>('success');
    
    const [usernameChecking, setUsernameChecking] = useState(false);
    const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
    
    const emailInputRef = useRef<HTMLInputElement>(null);
    const usernameInputRef = useRef<HTMLInputElement>(null);
    const passwordInputRef = useRef<HTMLInputElement>(null);

    const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
        setToastMessage(msg);
        setToastType(type);
        setToastVisible(true);
    }, []);

    const hideToast = () => {
        setToastVisible(false);
    };

    const resetForm = useCallback(() => {
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setUsername('');
        setFullName('');
        setDob('');
        setOtp('');
        setShowPassword(false);
        setShowConfirmPassword(false);
        setUsernameAvailable(null);
    }, []);

    const handleGoogleLogin = useCallback(async () => {
        showToast('Google login coming soon!', 'error');
    }, [showToast]);

    const handleEmailSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            showToast('Please enter your email', 'error');
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showToast('Please enter a valid email address', 'error');
            return;
        }

        setIsLoading(true);
        try {
            const res = await authApi.start(email);
            if (res.exists) {
                setStep('login');
                showToast('Welcome back! Please enter your password', 'success');
                setTimeout(() => passwordInputRef.current?.focus(), 100);
            } else {
                setStep('signup');
                showToast('New account! Please complete your profile', 'success');
                setTimeout(() => usernameInputRef.current?.focus(), 100);
            }
        } catch (error: unknown) {
            const apiError = error as ApiError;
            showToast(apiError.detail || apiError.message || 'Something went wrong', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [email, showToast]);

    const checkUsernameAvailability = useCallback(async (username: string) => {
        if (username.length < 3 || username.length > 20) {
            setUsernameAvailable(null);
            return;
        }
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            setUsernameAvailable(false);
            return;
        }

        setUsernameChecking(true);
        try {
            const res = await authApi.checkUsernameAvailability(username);
            setUsernameAvailable(res.available);
        } catch (error: any) {
            setUsernameAvailable(null);
        } finally {
            setUsernameChecking(false);
        }
    }, []);

    const debouncedUsernameCheck = useCallback(
        (username: string) => {
            const timer = setTimeout(() => {
                checkUsernameAvailability(username);
            }, 500);
            return () => clearTimeout(timer);
        },
        [checkUsernameAvailability]
    );

    useEffect(() => {
        const debouncer = debouncedUsernameCheck(username);
        debouncer();
        return () => {
            if (typeof debouncer === 'function') {
                debouncer();
            }
        };
    }, [username, debouncedUsernameCheck]);

    const handleSignin = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password) {
            showToast('Please enter your password', 'error');
            return;
        }
        if (password.length < 8) {
            showToast('Password must be at least 8 characters', 'error');
            return;
        }

        setIsLoading(true);
        try {
            const res = await authApi.signin({ email, password });
            login(res.access_token, res.user);
            showToast('Successfully signed in!', 'success');
            setTimeout(() => {
                props.onOpenChange?.(false);
                router.push('/chat');
            }, 1000);
        } catch (error: unknown) {
            const apiError = error as ApiError;
            showToast(apiError.detail || apiError.message || 'Invalid credentials', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [email, password, login, router, props.onOpenChange, showToast]);

    const handleSignup = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username || !fullName || !dob || !password || !confirmPassword) {
            showToast('Please fill in all fields', 'error');
            return;
        }
        if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
            showToast('Username must be 3-20 characters (letters, numbers, underscore only)', 'error');
            return;
        }
        if (!calculateAge(dob) || calculateAge(dob)! < 13) {
            showToast('You must be at least 13 years old', 'error');
            return;
        }
        if (password.length < 8) {
            showToast('Password must be at least 8 characters', 'error');
            return;
        }
        if (password !== confirmPassword) {
            showToast('Passwords do not match', 'error');
            return;
        }
        if (usernameAvailable === false) {
            showToast('Username is already taken', 'error');
            return;
        }

        setIsLoading(true);
        try {
            const res = await authApi.signup({
                email,
                username,
                full_name: fullName,
                dob,
                password,
                confirm_password: confirmPassword,
            });
            login(res.access_token, res.user);
            showToast('Account created successfully!', 'success');
            setTimeout(() => {
                props.onOpenChange?.(false);
                router.push('/chat');
            }, 1000);
        } catch (error: unknown) {
            const apiError = error as ApiError;
            showToast(apiError.detail || apiError.message || 'Signup failed', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [email, username, fullName, dob, password, confirmPassword, usernameAvailable, login, router, props.onOpenChange, showToast]);

    const handleForgotPassword = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            showToast('Please enter your email', 'error');
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showToast('Please enter a valid email address', 'error');
            return;
        }

        setIsLoading(true);
        try {
            await authApi.forgotPassword(email);
            showToast('Password reset email sent! Check your inbox', 'success');
            setStep('reset-password');
        } catch (error: unknown) {
            const apiError = error as ApiError;
            showToast(apiError.detail || apiError.message || 'Failed to send reset email', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [email, showToast]);

    const handleResetPassword = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!otp) {
            showToast('Please enter the OTP code', 'error');
            return;
        }
        if (!password) {
            showToast('Please enter your new password', 'error');
            return;
        }
        if (password.length < 8) {
            showToast('Password must be at least 8 characters', 'error');
            return;
        }
        if (password !== confirmPassword) {
            showToast('Passwords do not match', 'error');
            return;
        }

        setIsLoading(true);
        try {
            await authApi.resetPassword({
                email,
                otp,
                new_password: password,
            });
            showToast('Password reset successfully! Please sign in', 'success');
            setTimeout(() => {
                resetForm();
                setStep('email');
                setActiveTab('login');
            }, 1500);
        } catch (error: unknown) {
            const apiError = error as ApiError;
            showToast(apiError.detail || apiError.message || 'Failed to reset password', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [email, otp, password, confirmPassword, resetForm, showToast]);

    const handleBackToEmail = useCallback(() => {
        resetForm();
        setStep('email');
    }, [resetForm]);

    const handleTabChange = useCallback((tab: AuthTab) => {
        setActiveTab(tab);
        resetForm();
        setStep('email');
    }, [resetForm]);

    const calculateAge = useCallback((dob: string): number | null => {
        if (!dob) return null;
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }, []);

    useEffect(() => {
        if (!props.open) {
            setTimeout(() => {
                resetForm();
                setStep('email');
                setActiveTab('login');
            }, 300);
        }
    }, [props.open, resetForm]);

    useEffect(() => {
        if (props.open && step === 'email') {
            setTimeout(() => emailInputRef.current?.focus(), 100);
        }
    }, [props.open, step]);

    return (
        <Modal {...props}>
            <ModalContent
                popoverProps={{
                    className: "bg-white shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-300 rounded-2xl max-w-[95vw] md:max-w-lg lg:max-w-xl w-full overflow-hidden max-h-[90vh]"
                }}
                drawerProps={{
                    className: "bg-white shadow-xl rounded-t-xl max-h-[90vh] overflow-y-auto"
                }}
            >
                <div className="flex flex-col min-h-[0] max-h-[90vh] overflow-hidden">
                    <div className="p-6 md:p-8 overflow-y-auto min-h-0">
                        <div className="flex justify-between items-center mb-6">
                            <span className="text-xl font-bold tracking-tight font-silver" style={{ color: '#0f7d70' }}>
                                MugShot Studio
                            </span>
                            <button
                                onClick={() => props.onOpenChange?.(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                aria-label="Close modal"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {step !== 'forgot-password' && step !== 'reset-password' && (
                            <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-6">
                                <button
                                    onClick={() => handleTabChange('login')}
                                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                                        activeTab === 'login'
                                            ? 'bg-white text-[#0f7d70] shadow-md'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    Login
                                </button>
                                <button
                                    onClick={() => handleTabChange('signup')}
                                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                                        activeTab === 'signup'
                                            ? 'bg-white text-[#0f7d70] shadow-md'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    Sign Up
                                </button>
                            </div>
                        )}

                        {step === 'email' && (
                            <>
                                <div className="mb-6">
                                    <h1 className="text-2xl font-bold text-gray-900 mb-1">
                                        {activeTab === 'login' ? 'Welcome Back!' : 'Create Account'}
                                    </h1>
                                    <p className="text-gray-600 text-sm">
                                        {activeTab === 'login'
                                            ? 'Enter your email to sign in to MugShot Studio'
                                            : 'Enter your email to get started with MugShot Studio'
                                        }
                                    </p>
                                </div>

                                <button
                                    onClick={handleGoogleLogin}
                                    className="w-full py-3 px-4 border-2 border-gray-200 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-50 transition-all duration-200 mb-6"
                                >
                                    <Mail className="w-5 h-5" />
                                    <span className="font-medium text-gray-700">Continue with Google</span>
                                </button>

                                <div className="relative my-6">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t border-gray-200" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-white text-gray-500 px-4 font-medium">
                                            or continue with email
                                        </span>
                                    </div>
                                </div>

                                <form onSubmit={handleEmailSubmit} className="space-y-4">
                                    <div className="relative">
                                        <Input
                                            ref={emailInputRef}
                                            placeholder="your.email@example.com"
                                            className="peer ps-10 h-12 border-gray-200 focus:border-[#0f7d70] focus:ring-2 focus:ring-[#0f7d70]/20 rounded-xl text-gray-900 bg-white"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            disabled={isLoading}
                                        />
                                        <div className="text-gray-400 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
                                            <AtSignIcon className="size-5" />
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full h-12 rounded-xl font-medium text-base transition-all duration-200 bg-[#0f7d70] hover:bg-[#0c6a61] text-white shadow-lg shadow-[#0f7d70]/20"
                                    >
                                        {isLoading ? <Loader2 className="animate-spin" /> : 'Continue with Email'}
                                    </Button>
                                </form>
                            </>
                        )}

                        {step === 'login' && (
                            <>
                                <div className="mb-6">
                                    <div className="text-sm text-gray-600 mb-3 flex items-center gap-2">
                                        <span>Signing in as</span>
                                        <span className="font-semibold text-[#0f7d70]">{email}</span>
                                        <button
                                            type="button"
                                            onClick={handleBackToEmail}
                                            className="text-xs text-blue-500 hover:underline"
                                        >
                                            Change
                                        </button>
                                    </div>
                                    <h1 className="text-2xl font-bold text-gray-900 mb-1">Enter Your Password</h1>
                                    <p className="text-gray-600 text-sm">Welcome back to MugShot Studio</p>
                                </div>

                                <form onSubmit={handleSignin} className="space-y-4">
                                    <div className="relative">
                                        <Input
                                            ref={passwordInputRef}
                                            placeholder="Password"
                                            className="peer ps-10 h-12 border-gray-200 focus:border-[#0f7d70] focus:ring-2 focus:ring-[#0f7d70]/20 rounded-xl text-gray-900 bg-white"
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            disabled={isLoading}
                                        />
                                        <div className="text-gray-400 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
                                            <LockIcon className="size-5" />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 end-0 flex items-center justify-center pe-3 text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={rememberMe}
                                                onChange={(e) => setRememberMe(e.target.checked)}
                                                className="w-4 h-4 rounded border-gray-300 text-[#0f7d70] focus:ring-[#0f7d70]"
                                            />
                                            <span className="text-sm text-gray-600">Remember me</span>
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setStep('forgot-password')}
                                            className="text-sm text-[#0f7d70] hover:underline font-medium"
                                        >
                                            Forgot password?
                                        </button>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full h-12 rounded-xl font-medium text-base transition-all duration-200 bg-[#0f7d70] hover:bg-[#0c6a61] text-white shadow-lg shadow-[#0f7d70]/20"
                                    >
                                        {isLoading ? <Loader2 className="animate-spin" /> : 'Sign In'}
                                    </Button>
                                </form>
                            </>
                        )}

                        {step === 'signup' && (
                            <>
                                <div className="mb-6">
                                    <div className="text-sm text-gray-600 mb-3 flex items-center gap-2">
                                        <span>Creating account for</span>
                                        <span className="font-semibold text-[#0f7d70]">{email}</span>
                                        <button
                                            type="button"
                                            onClick={handleBackToEmail}
                                            className="text-xs text-blue-500 hover:underline"
                                        >
                                            Change
                                        </button>
                                    </div>
                                    <h1 className="text-2xl font-bold text-gray-900 mb-1">Complete Your Profile</h1>
                                    <p className="text-gray-600 text-sm">Almost there! Just a few more details</p>
                                </div>

                                <form onSubmit={handleSignup} className="space-y-3">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="relative">
                                            <Input
                                                ref={usernameInputRef}
                                                placeholder="Username"
                                                className="peer ps-9 h-10 border-gray-200 focus:border-[#0f7d70] focus:ring-2 focus:ring-[#0f7d70]/20 rounded-lg text-gray-900 bg-white"
                                                value={username}
                                                onChange={(e) => setUsername(e.target.value)}
                                                disabled={isLoading}
                                            />
                                            <div className="text-gray-400 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3">
                                                <UserIcon className="size-4" />
                                            </div>
                                            {username && username.length >= 3 && (
                                                <div className="absolute inset-y-0 end-0 flex items-center pe-3">
                                                    {usernameChecking ? (
                                                        <Loader2 className="size-4 animate-spin text-gray-400" />
                                                    ) : usernameAvailable === true ? (
                                                        <CheckCircle2 className="size-4 text-green-500" />
                                                    ) : usernameAvailable === false ? (
                                                        <XCircle className="size-4 text-red-500" />
                                                    ) : null}
                                                </div>
                                            )}
                                        </div>
                                        <div className="relative">
                                            <Input
                                                placeholder="Full Name"
                                                className="peer ps-9 h-10 border-gray-200 focus:border-[#0f7d70] focus:ring-2 focus:ring-[#0f7d70]/20 rounded-lg text-gray-900 bg-white"
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                disabled={isLoading}
                                            />
                                            <div className="text-gray-400 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3">
                                                <UserIcon className="size-4" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="relative">
                                        <Input
                                            placeholder="Date of Birth"
                                            type="date"
                                            className="peer ps-9 h-10 border-gray-200 focus:border-[#0f7d70] focus:ring-2 focus:ring-[#0f7d70]/20 rounded-lg text-gray-900 bg-white"
                                            value={dob}
                                            onChange={(e) => setDob(e.target.value)}
                                            disabled={isLoading}
                                            max={new Date().toISOString().split('T')[0]}
                                        />
                                        <div className="text-gray-400 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3">
                                            <CalendarIcon className="size-4" />
                                        </div>
                                        {dob && calculateAge(dob) && calculateAge(dob)! < 13 && (
                                            <div className="text-xs text-red-500 mt-1">
                                                You must be at least 13 years old
                                            </div>
                                        )}
                                    </div>

                                    <div className="relative">
                                        <Input
                                            placeholder="Password (min 8 characters)"
                                            type={showPassword ? 'text' : 'password'}
                                            className="peer ps-9 h-10 border-gray-200 focus:border-[#0f7d70] focus:ring-2 focus:ring-[#0f7d70]/20 rounded-lg text-gray-900 bg-white"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            disabled={isLoading}
                                        />
                                        <div className="text-gray-400 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3">
                                            <LockIcon className="size-4" />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 end-0 flex items-center justify-center pe-3 text-gray-400 hover:text-gray-600"
                                        >
                                            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                        </button>
                                    </div>

                                    <div className="relative">
                                        <Input
                                            placeholder="Confirm Password"
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            className="peer ps-9 h-10 border-gray-200 focus:border-[#0f7d70] focus:ring-2 focus:ring-[#0f7d70]/20 rounded-lg text-gray-900 bg-white"
                                            value={confirmPassword}
                                            onChange={(e) => {
                                                setConfirmPassword(e.target.value);
                                                if (password !== e.target.value) {
                                                    setShowConfirmPassword(false);
                                                } else {
                                                    setShowConfirmPassword(showPassword);
                                                }
                                            }}
                                            disabled={isLoading}
                                        />
                                        <div className="text-gray-400 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3">
                                            <LockIcon className="size-4" />
                                        </div>
                                        {confirmPassword && (
                                            <div className="absolute inset-y-0 end-0 flex items-center pe-3">
                                                {password === confirmPassword ? (
                                                    <CheckCircle2 className="size-4 text-green-500" />
                                                ) : (
                                                    <XCircle className="size-4 text-red-500" />
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full h-12 rounded-xl font-medium text-base transition-all duration-200 bg-[#0f7d70] hover:bg-[#0c6a61] text-white shadow-lg shadow-[#0f7d70]/20"
                                    >
                                        {isLoading ? <Loader2 className="animate-spin" /> : 'Create Account'}
                                    </Button>
                                </form>
                            </>
                        )}

                        {step === 'forgot-password' && (
                            <>
                                <div className="mb-6">
                                    <button
                                        type="button"
                                        onClick={handleBackToEmail}
                                        className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 mb-4"
                                    >
                                        <X className="w-4 h-4" />
                                        Back
                                    </button>
                                    <h1 className="text-2xl font-bold text-gray-900 mb-1">Forgot Password?</h1>
                                    <p className="text-gray-600 text-sm">Enter your email to receive a password reset code</p>
                                </div>

                                <form onSubmit={handleForgotPassword} className="space-y-4">
                                    <div className="relative">
                                        <Input
                                            placeholder="your.email@example.com"
                                            className="peer ps-10 h-12 border-gray-200 focus:border-[#0f7d70] focus:ring-2 focus:ring-[#0f7d70]/20 rounded-xl text-gray-900 bg-white"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            disabled={isLoading}
                                        />
                                        <div className="text-gray-400 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
                                            <AtSignIcon className="size-5" />
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full h-12 rounded-xl font-medium text-base transition-all duration-200 bg-[#0f7d70] hover:bg-[#0c6a61] text-white shadow-lg shadow-[#0f7d70]/20"
                                    >
                                        {isLoading ? <Loader2 className="animate-spin" /> : 'Send Reset Email'}
                                    </Button>
                                </form>
                            </>
                        )}

                        {step === 'reset-password' && (
                            <>
                                <div className="mb-6">
                                    <button
                                        type="button"
                                        onClick={handleBackToEmail}
                                        className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 mb-4"
                                    >
                                        <X className="w-4 h-4" />
                                        Back
                                    </button>
                                    <h1 className="text-2xl font-bold text-gray-900 mb-1">Reset Your Password</h1>
                                    <p className="text-gray-600 text-sm">Enter the OTP code from your email and your new password</p>
                                </div>

                                <form onSubmit={handleResetPassword} className="space-y-4">
                                    <div className="relative">
                                        <Input
                                            placeholder="OTP Code"
                                            className="peer ps-10 h-12 border-gray-200 focus:border-[#0f7d70] focus:ring-2 focus:ring-[#0f7d70]/20 rounded-xl text-gray-900 bg-white"
                                            type="text"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                                            maxLength={6}
                                            disabled={isLoading}
                                        />
                                        <div className="text-gray-400 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3">
                                            <Mail className="size-5" />
                                        </div>
                                    </div>

                                    <div className="relative">
                                        <Input
                                            placeholder="New Password (min 8 characters)"
                                            type={showPassword ? 'text' : 'password'}
                                            className="peer ps-10 h-12 border-gray-200 focus:border-[#0f7d70] focus:ring-2 focus:ring-[#0f7d70]/20 rounded-xl text-gray-900 bg-white"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            disabled={isLoading}
                                        />
                                        <div className="text-gray-400 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3">
                                            <LockIcon className="size-5" />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 end-0 flex items-center justify-center pe-3 text-gray-400 hover:text-gray-600"
                                        >
                                            {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                                        </button>
                                    </div>

                                    <div className="relative">
                                        <Input
                                            placeholder="Confirm New Password"
                                            type={showPassword ? 'text' : 'password'}
                                            className="peer ps-10 h-12 border-gray-200 focus:border-[#0f7d70] focus:ring-2 focus:ring-[#0f7d70]/20 rounded-xl text-gray-900 bg-white"
                                            value={confirmPassword}
                                            onChange={(e) => {
                                                setConfirmPassword(e.target.value);
                                                if (password !== e.target.value) {
                                                    setShowConfirmPassword(false);
                                                } else {
                                                    setShowConfirmPassword(showPassword);
                                                }
                                            }}
                                            disabled={isLoading}
                                        />
                                        <div className="text-gray-400 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3">
                                            <LockIcon className="size-5" />
                                        </div>
                                        {confirmPassword && (
                                            <div className="absolute inset-y-0 end-0 flex items-center pe-3">
                                                {password === confirmPassword ? (
                                                    <CheckCircle2 className="size-4 text-green-500" />
                                                ) : (
                                                    <XCircle className="size-4 text-red-500" />
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full h-12 rounded-xl font-medium text-base transition-all duration-200 bg-[#0f7d70] hover:bg-[#0c6a61] text-white shadow-lg shadow-[#0f7d70]/20"
                                    >
                                        {isLoading ? <Loader2 className="animate-spin" /> : 'Reset Password'}
                                    </Button>
                                </form>
                            </>
                        )}

                        {step !== 'forgot-password' && step !== 'reset-password' && (
                            <p className="text-center text-xs text-gray-500 mt-6">
                                By continuing, you agree to our{' '}
                                <Link className="text-[#0f7d70] hover:underline" href="/policy">
                                    Privacy Policy
                                </Link>
                            </p>
                        )}
                    </div>
                </div>
            </ModalContent>
            <Toast
                message={toastMessage}
                isVisible={toastVisible}
                type={toastType}
                onClose={hideToast}
            />
        </Modal>
    );
}

const GoogleIcon = (props: React.ComponentProps<'svg'>) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        {...props}
    >
        <g>
            <path d="M12.479,14.265v-3.279h11.049c0.108,0.571,0.164,1.247,0.164,1.979c0,2.46-0.672,5.502-2.84,7.669   C18.744,22.829,16.051,24,12.483,24C5.869,24,0.308,18.613,0.308,12S5.869,0,12.483,0c3.659,0,6.265,1.436,8.223,3.307L18.392,5.62   c-1.404-1.317-3.307-2.341-5.913-2.341C7.65,3.279,3.873,7.171,3.873,12s3.777,8.721,8.606,8.721c3.132,0,4.916-1.258,6.059-2.401   c0.927-0.927,1.537-2.251,1.777-4.059L12.479,14.265z" />
        </g>
    </svg>
);
