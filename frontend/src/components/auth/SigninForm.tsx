
'use client';

import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';

import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { useAuthStore } from '@/src/store/useAuthStore';
import { authApi } from '@/src/lib/auth';

const SigninSchema = z.object({
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(1, 'Password is required'),
});

const OtpRequestSchema = z.object({
    email: z.string().email('Please enter a valid email'),
});

type SigninData = z.infer<typeof SigninSchema>;

export function SigninForm() {
    const router = useRouter();
    const login = useAuthStore((state) => state.login);
    const verifyOtp = useAuthStore((state) => state.verifyOtp);
    const [isLoading, setIsLoading] = useState(false);
    const [isOtpMode, setIsOtpMode] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState('');
    const [otpEmail, setOtpEmail] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const form = useForm<SigninData>({
        resolver: zodResolver(SigninSchema),
    });

    const otpForm = useForm<{ email: string }>({
        resolver: zodResolver(OtpRequestSchema),
    });

    const handleGoogleLogin = () => {
        toast.info('Google login coming soon!');
    };

    const onPasswordLogin = async (data: SigninData) => {
        setIsLoading(true);
        try {
            await login(data.email, data.password);
            toast.success('Successfully signed in!');
            router.push('/dashboard');
        } catch (error: any) {
            toast.error(error.message || 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    const onRequestOtp = async (data: { email: string }) => {
        setIsLoading(true);
        try {
            await authApi.signinOtp(data.email);
            setOtpEmail(data.email);
            setOtpSent(true);
            toast.success('OTP sent to your email');
        } catch (error: any) {
            toast.error(error.message || 'Failed to send OTP');
        } finally {
            setIsLoading(false);
        }
    };

    const onVerifyOtpLogin = async () => {
        if (otp.length < 6) return;
        setIsLoading(true);
        try {
            await verifyOtp({ email: otpEmail, token: otp, type: 'email' });
            toast.success('Welcome back!');
            router.push('/dashboard');
        } catch (error: any) {
            toast.error(error.message || 'Invalid OTP');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className="space-y-3 mb-8">
                <h2 className="text-3xl font-bold text-gray-900">Welcome back</h2>
                <p className="text-gray-500">
                    {isOtpMode
                        ? 'Sign in with a one-time code sent to your email.'
                        : 'Access your tasks, notes, and projects anytime.'}
                </p>
            </div>

            {/* Mode Toggle */}
            <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-xl w-fit mb-8">
                <button
                    onClick={() => { setIsOtpMode(false); setOtpSent(false); setOtp(''); }}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${!isOtpMode ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Password
                </button>
                <button
                    onClick={() => setIsOtpMode(true)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${isOtpMode ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    One-Time Code
                </button>
            </div>

            <AnimatePresence mode="wait">
                {!isOtpMode ? (
                    <motion.form
                        key="password"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.2 }}
                        onSubmit={form.handleSubmit(onPasswordLogin)}
                        className="space-y-5"
                    >
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">Your email</label>
                                <Input
                                    type="email"
                                    placeholder="you@example.com"
                                    className="h-12 border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-[#0f7d70]/20"
                                    {...form.register('email')}
                                    disabled={isLoading}
                                />
                                {form.formState.errors.email && (
                                    <p className="text-red-500 text-xs mt-1">{form.formState.errors.email.message}</p>
                                )}
                            </div>

                            <div className="space-y-1">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-medium text-gray-700">Password</label>
                                    <Link href="/auth/forgot-password" className="text-xs text-[#4f46e5] hover:underline font-medium">
                                        Forgot password?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <Input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••••••"
                                        className="h-12 border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-[#0f7d70]/20 pr-10"
                                        {...form.register('password')}
                                        disabled={isLoading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                {form.formState.errors.password && (
                                    <p className="text-red-500 text-xs mt-1">{form.formState.errors.password.message}</p>
                                )}
                            </div>
                        </div>

                        <Button
                            className="w-full h-12 bg-[#0f7d70] hover:bg-[#0c6a61] text-white rounded-xl text-base font-semibold shadow-lg shadow-teal-200 transition-all transform hover:scale-[1.01]"
                            type="submit"
                            disabled={isLoading}
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Log In'}
                        </Button>
                    </motion.form>
                ) : (
                    <motion.div
                        key="otp"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-5"
                    >
                        {!otpSent ? (
                            <form onSubmit={otpForm.handleSubmit(onRequestOtp)} className="space-y-5">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Your email</label>
                                    <Input
                                        type="email"
                                        placeholder="you@example.com"
                                        className="h-12 border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-[#0f7d70]/20"
                                        {...otpForm.register('email')}
                                        disabled={isLoading}
                                    />
                                    {otpForm.formState.errors.email && (
                                        <p className="text-red-500 text-xs mt-1">{otpForm.formState.errors.email.message}</p>
                                    )}
                                </div>
                                <Button
                                    className="w-full h-12 bg-[#0f7d70] hover:bg-[#0c6a61] text-white rounded-xl text-base font-semibold shadow-lg shadow-teal-200 transition-all transform hover:scale-[1.01]"
                                    type="submit"
                                    disabled={isLoading}
                                >
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Login Code'}
                                </Button>
                            </form>
                        ) : (
                            <div className="space-y-5">
                                <div className="text-center p-4 bg-teal-50 rounded-xl">
                                    <p className="text-sm text-gray-600">
                                        Enter the 6-digit code sent to <span className="font-semibold text-gray-900">{otpEmail}</span>
                                    </p>
                                </div>
                                <Input
                                    className="h-14 text-center text-2xl tracking-[0.5em] font-mono border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-[#0f7d70]/20"
                                    maxLength={6}
                                    placeholder="000000"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                />
                                <Button
                                    className="w-full h-12 bg-[#0f7d70] hover:bg-[#0c6a61] text-white rounded-xl text-base font-semibold shadow-lg shadow-teal-200 transition-all transform hover:scale-[1.01]"
                                    onClick={onVerifyOtpLogin}
                                    disabled={isLoading || otp.length < 6}
                                >
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Login'}
                                </Button>
                                <button
                                    onClick={() => { setOtpSent(false); setOtp(''); }}
                                    className="w-full text-sm text-gray-500 hover:text-[#0f7d70] transition-colors"
                                >
                                    ← Use a different email
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Divider */}
            <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-gray-50 px-2 text-gray-500">or continue with</span>
                </div>
            </div>

            {/* Social Buttons */}
            <div className="grid grid-cols-2 gap-3">
                {/* Google Button */}
                <button
                    onClick={handleGoogleLogin}
                    className="h-11 bg-white border border-gray-200 hover:bg-gray-50 rounded-full flex items-center justify-center transition-colors shadow-sm"
                >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    <span className="text-sm font-semibold text-gray-700">Google</span>
                </button>

                {/* Apple Button */}
                <button className="h-11 bg-black hover:bg-black/90 rounded-full flex items-center justify-center transition-colors shadow-sm">
                    <svg className="w-5 h-5 mr-2 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.05 20.28c-.96.95-2.06 1.92-3.37 1.92-1.27 0-1.61-.74-3.14-.74-1.55 0-1.94.72-3.14.74-1.25.02-2.32-.94-3.37-1.92-2.14-2-3.77-5.63-3.77-8.81 0-5.18 3.38-7.91 6.57-7.91 1.68 0 3.12 1.05 4.04 1.05.9 0 2.62-1.22 4.54-1.02.82.04 3.1.33 4.56 2.45-.12.07-2.73 1.58-2.73 4.7 0 3.73 3.26 4.95 3.3 4.97-.03.07-.52 1.78-1.72 3.57zM13.71 4.2c-.82 1.02-1.98 1.76-3.08 1.76-.14 0-.27-.01-.39-.03.1-.96.65-2.02 1.34-2.82 1.14-1.32 2.37-2.13 3.33-2.13.14 0 .28.01.41.03-.1.97-.73 2.11-1.61 3.19z" />
                    </svg>
                    <span className="text-sm font-semibold text-white">Apple</span>
                </button>
            </div>

            <div className="text-center text-sm">
                <span className="text-gray-500">Don&apos;t have an account? </span>
                <Link href="/auth/signup" className="font-semibold text-[#0f7d70] hover:underline">
                    Sign up
                </Link>
            </div>
        </>
    );
}
