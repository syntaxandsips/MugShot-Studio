
import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/src/store/useAuthStore';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';

interface Step2Props {
    form: UseFormReturn<any>;
    onNext: () => void;
    onBack: () => void;
}

export function Step2Identity({ form, onNext, onBack }: Step2Props) {
    const { register, formState: { errors }, trigger, getValues, setError, clearErrors, watch } = form;
    const [isChecking, setIsChecking] = useState(false);
    const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
    const [usernameChecking, setUsernameChecking] = useState(false);
    const checkUsername = useAuthStore((state) => state.checkUsername);

    const username = watch('username');

    const checkUsernameAvailability = useCallback(async (u: string) => {
        if (!u || u.length < 3) {
            setUsernameAvailable(null);
            return;
        }
        setUsernameChecking(true);
        try {
            const isAvailable = await checkUsername(u);
            setUsernameAvailable(isAvailable);
            if (!isAvailable) {
                setError('username', { type: 'manual', message: 'Username is already taken' });
            } else {
                clearErrors('username');
            }
        } catch (error) {
            setUsernameAvailable(null);
        } finally {
            setUsernameChecking(false);
        }
    }, [checkUsername, setError, clearErrors]);

    // Debounced username check
    useEffect(() => {
        if (username) {
            const timer = setTimeout(() => checkUsernameAvailability(username), 500);
            return () => clearTimeout(timer);
        } else {
            setUsernameAvailable(null);
        }
    }, [username, checkUsernameAvailability]);

    const handleNext = async () => {
        const isValid = await trigger(['username', 'fullName', 'dob']);
        if (!isValid) return;

        if (usernameAvailable === false) {
            toast.error('Username is not available');
            return;
        }

        setIsChecking(true);
        try {
            onNext();
        } finally {
            setIsChecking(false);
        }
    };

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Username</label>
                    <div className="relative">
                        <Input
                            placeholder="cool_artist"
                            className="h-12 border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500/20 pr-10"
                            {...register('username')}
                        />
                        {username && username.length >= 3 && (
                            <div className="absolute right-3 top-3.5">
                                {usernameChecking ? (
                                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                                ) : usernameAvailable === true ? (
                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                ) : usernameAvailable === false ? (
                                    <XCircle className="w-4 h-4 text-red-500" />
                                ) : null}
                            </div>
                        )}
                    </div>
                    {errors.username && (
                        <p className="text-red-500 text-xs mt-1">{errors.username.message as string}</p>
                    )}
                </div>
                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Full name</label>
                    <Input
                        placeholder="John Doe"
                        className="h-12 border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500/20"
                        {...register('fullName')}
                    />
                    {errors.fullName && (
                        <p className="text-red-500 text-xs mt-1">{errors.fullName.message as string}</p>
                    )}
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Date of birth</label>
                <Input
                    type="date"
                    className="h-12 border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500/20"
                    {...register('dob')}
                />
                {errors.dob && (
                    <p className="text-red-500 text-xs mt-1">{errors.dob.message as string}</p>
                )}
            </div>

            <div className="flex gap-3 pt-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onBack}
                    className="h-12 rounded-xl border-gray-200 text-gray-600 hover:bg-gray-50 px-6"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                </Button>
                <Button
                    type="button"
                    onClick={handleNext}
                    disabled={isChecking || usernameAvailable === false}
                    className="flex-1 h-12 bg-[#4f46e5] hover:bg-[#4338ca] text-white rounded-xl text-base font-semibold shadow-lg shadow-indigo-200 transition-all transform hover:scale-[1.01]"
                >
                    {isChecking ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Continue'}
                </Button>
            </div>
        </div>
    );
}
