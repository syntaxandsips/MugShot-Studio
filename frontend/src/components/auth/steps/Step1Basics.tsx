
import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import { useState } from 'react';
import { useAuthStore } from '@/src/store/useAuthStore';
import { toast } from 'sonner';
import { Loader2, Eye, EyeOff } from 'lucide-react';

interface Step1Props {
    form: UseFormReturn<any>;
    onNext: () => void;
}

export function Step1Basics({ form, onNext }: Step1Props) {
    const { register, formState: { errors }, trigger, getValues } = form;
    const [isChecking, setIsChecking] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const startAuth = useAuthStore((state) => state.startAuth);

    const handleNext = async () => {
        const isValid = await trigger(['email', 'password', 'confirmPassword']);
        if (!isValid) return;

        setIsChecking(true);
        try {
            const email = getValues('email');
            const res = await startAuth(email);

            if (res.exists) {
                if (res.next === 'password') {
                    toast.error('An account with this email already exists. Please sign in.');
                } else {
                    toast.info('This email is linked to a social login. Please use that method.');
                }
                return;
            }
            onNext();
        } catch (error) {
            toast.error('Unable to verify email. Please try again.');
        } finally {
            setIsChecking(false);
        }
    };

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Email address</label>
                <Input
                    type="email"
                    placeholder="you@example.com"
                    className="h-12 border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500/20"
                    {...register('email')}
                />
                {errors.email && (
                    <p className="text-red-500 text-xs mt-1">{errors.email.message as string}</p>
                )}
            </div>

            <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Password</label>
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
                    <p className="text-red-500 text-xs mt-1">{errors.password.message as string}</p>
                )}
            </div>

            <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Confirm password</label>
                <div className="relative">
                    <Input
                        type={showConfirm ? 'text' : 'password'}
                        placeholder="••••••••••••"
                        className="h-12 border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500/20 pr-10"
                        {...register('confirmPassword')}
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                    >
                        {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                </div>
                {errors.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message as string}</p>
                )}
            </div>

            <Button
                type="button"
                onClick={handleNext}
                disabled={isChecking}
                className="w-full h-12 bg-[#4f46e5] hover:bg-[#4338ca] text-white rounded-xl text-base font-semibold shadow-lg shadow-indigo-200 transition-all transform hover:scale-[1.01]"
            >
                {isChecking ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Continue'}
            </Button>
        </div>
    );
}
