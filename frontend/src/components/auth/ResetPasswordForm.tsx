
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';

import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { authApi } from '@/src/lib/auth';
import { ResetPasswordSchema } from '@/src/schemas/auth.schema';

type ResetPasswordData = z.infer<typeof ResetPasswordSchema>;

export function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const emailFromParams = searchParams.get('email') || '';

    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<ResetPasswordData>({
        resolver: zodResolver(ResetPasswordSchema),
    });

    const onSubmit = async (data: ResetPasswordData) => {
        setIsLoading(true);
        try {
            await authApi.resetPassword({
                email: emailFromParams,
                token: data.otp,
                newPassword: data.password,
                confirmPassword: data.confirmPassword,
            });
            setIsSuccess(true);
            toast.success('Password reset successfully!');
        } catch (error: any) {
            toast.error(error.message || 'Reset failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <>
                <div className="space-y-2">
                    <h2 className="text-3xl font-bold text-gray-900">Password reset!</h2>
                    <p className="text-gray-500">Your password has been updated successfully.</p>
                </div>

                <div className="flex flex-col items-center space-y-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>

                    <Button
                        className="w-full h-12 bg-[#4f46e5] hover:bg-[#4338ca] text-white rounded-xl text-base font-semibold shadow-lg shadow-indigo-200 transition-all transform hover:scale-[1.01]"
                        onClick={() => router.push('/auth/signin')}
                    >
                        Sign In with New Password
                    </Button>
                </div>
            </>
        );
    }

    return (
        <>
            <div className="space-y-2">
                <h2 className="text-3xl font-bold text-gray-900">Set new password</h2>
                <p className="text-gray-500">
                    Enter the reset code and your new password.
                    {emailFromParams && (
                        <span className="block text-sm mt-1 text-gray-400">
                            Code was sent to <span className="font-medium text-gray-600">{emailFromParams}</span>
                        </span>
                    )}
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Reset code</label>
                    <Input
                        placeholder="000000"
                        maxLength={6}
                        className="h-14 text-center text-2xl tracking-[0.5em] font-mono border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500/20"
                        {...register('otp')}
                    />
                    {errors.otp && (
                        <p className="text-red-500 text-xs mt-1 text-center">{errors.otp.message}</p>
                    )}
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">New password</label>
                    <div className="relative">
                        <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••••••"
                            className="h-12 border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500/20 pr-10"
                            {...register('password')}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                        >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                    {errors.password && (
                        <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
                    )}
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Confirm new password</label>
                    <Input
                        type="password"
                        placeholder="••••••••••••"
                        className="h-12 border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500/20"
                        {...register('confirmPassword')}
                    />
                    {errors.confirmPassword && (
                        <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>
                    )}
                </div>

                <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 bg-[#4f46e5] hover:bg-[#4338ca] text-white rounded-xl text-base font-semibold shadow-lg shadow-indigo-200 transition-all transform hover:scale-[1.01]"
                >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Reset Password'}
                </Button>
            </form>

            <Link
                href="/auth/signin"
                className="flex items-center justify-center text-sm text-gray-500 hover:text-[#4f46e5] transition-colors"
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Sign In
            </Link>
        </>
    );
}
