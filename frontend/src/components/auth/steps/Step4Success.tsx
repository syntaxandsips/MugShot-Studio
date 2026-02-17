
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Step4OtpSchema } from '@/src/schemas/auth.schema';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import { useState } from 'react';
import { useAuthStore } from '@/src/store/useAuthStore';
import { authApi } from '@/src/lib/auth';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface Step4Props {
    email: string;
}

export function Step4Success({ email }: Step4Props) {
    const [isVerifying, setIsVerifying] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const verifyOtp = useAuthStore((state) => state.verifyOtp);
    const router = useRouter();

    const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof Step4OtpSchema>>({
        resolver: zodResolver(Step4OtpSchema),
    });

    const onVerify = async (data: z.infer<typeof Step4OtpSchema>) => {
        setIsVerifying(true);
        try {
            await verifyOtp({ email, token: data.otp, type: 'email' });
            toast.success('Email verified! Welcome to MugShot Studio.');
            router.push('/dashboard');
        } catch (error: any) {
            toast.error(error.message || 'Verification failed. Please check your code.');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleResend = async () => {
        setIsResending(true);
        try {
            await authApi.resendConfirmation(email);
            toast.success('New verification code sent!');
        } catch (error: any) {
            toast.error(error.message || 'Failed to resend code');
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300 text-center">
            {/* Success Icon */}
            <div className="flex flex-col items-center space-y-3">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900">Check your email</h3>
                <p className="text-sm text-gray-500 max-w-xs">
                    We sent a 6-digit verification code to{' '}
                    <span className="font-semibold text-gray-900">{email}</span>
                </p>
            </div>

            <form onSubmit={handleSubmit(onVerify)} className="space-y-5 text-left">
                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Verification code</label>
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

                <Button
                    type="submit"
                    disabled={isVerifying}
                    className="w-full h-12 bg-[#4f46e5] hover:bg-[#4338ca] text-white rounded-xl text-base font-semibold shadow-lg shadow-indigo-200 transition-all transform hover:scale-[1.01]"
                >
                    {isVerifying ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Continue'}
                </Button>
            </form>

            <p className="text-sm text-gray-400">
                Didn&apos;t receive a code?{' '}
                <button
                    onClick={handleResend}
                    disabled={isResending}
                    className="text-[#4f46e5] hover:underline font-medium disabled:opacity-50"
                >
                    {isResending ? 'Sending...' : 'Resend'}
                </button>
            </p>
        </div>
    );
}
