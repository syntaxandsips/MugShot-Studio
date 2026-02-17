
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';

import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { authApi } from '@/src/lib/auth';

const ForgotPasswordSchema = z.object({
    email: z.string().email('Please enter a valid email'),
});

type ForgotPasswordData = z.infer<typeof ForgotPasswordSchema>;

export function ForgotPasswordForm() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);

    const { register, handleSubmit, formState: { errors }, getValues } = useForm<ForgotPasswordData>({
        resolver: zodResolver(ForgotPasswordSchema),
    });

    const onSubmit = async (data: ForgotPasswordData) => {
        setIsLoading(true);
        try {
            await authApi.forgotPassword(data.email);
            setIsSent(true);
            toast.success('Password reset code sent to your email');
        } catch (error: any) {
            toast.error(error.message || 'Request failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className="space-y-2">
                <h2 className="text-3xl font-bold text-gray-900">Reset your password</h2>
                <p className="text-gray-500">
                    {isSent
                        ? 'Check your inbox for the reset code.'
                        : 'Enter your email and we\'ll send you a reset code.'}
                </p>
            </div>

            {!isSent ? (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Your email</label>
                        <Input
                            type="email"
                            placeholder="you@example.com"
                            className="h-12 border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500/20"
                            {...register('email')}
                            disabled={isLoading}
                        />
                        {errors.email && (
                            <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                        )}
                    </div>

                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-12 bg-[#4f46e5] hover:bg-[#4338ca] text-white rounded-xl text-base font-semibold shadow-lg shadow-indigo-200 transition-all transform hover:scale-[1.01]"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Reset Code'}
                    </Button>
                </form>
            ) : (
                <div className="space-y-5">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-center">
                        <div className="flex justify-center mb-2">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        </div>
                        <p className="text-sm text-green-800 font-medium">
                            Reset code sent to {getValues('email')}
                        </p>
                    </div>

                    <Button
                        className="w-full h-12 bg-[#4f46e5] hover:bg-[#4338ca] text-white rounded-xl text-base font-semibold shadow-lg shadow-indigo-200 transition-all transform hover:scale-[1.01]"
                        onClick={() => router.push(`/auth/reset-password?email=${encodeURIComponent(getValues('email'))}`)}
                    >
                        Enter Reset Code
                    </Button>
                </div>
            )}

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
