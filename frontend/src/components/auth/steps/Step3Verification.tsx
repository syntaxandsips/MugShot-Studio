
import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import { Checkbox } from '@/src/components/ui/checkbox';
import { useState } from 'react';
import { useAuthStore } from '@/src/store/useAuthStore';
import { toast } from 'sonner';
import { Loader2, ArrowLeft } from 'lucide-react';

interface Step3Props {
    form: UseFormReturn<any>;
    onComplete: () => void;
    onBack: () => void;
}

export function Step3Verification({ form, onComplete, onBack }: Step3Props) {
    const { register, formState: { errors }, getValues, watch, setValue } = form;
    const [isSubmitting, setIsSubmitting] = useState(false);
    const signup = useAuthStore((state) => state.signup);

    const handleSignup = async () => {
        setIsSubmitting(true);
        try {
            const formData = getValues();
            await signup(formData);
            toast.success('Account created! Please verify your email.');
            onComplete();
        } catch (error: any) {
            toast.error(error.message || 'Signup failed. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Referral code (optional)</label>
                <Input
                    placeholder="FRIEND123"
                    className="h-12 border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500/20"
                    {...register('referralCode')}
                />
            </div>

            <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-xl">
                <Checkbox
                    id="newsletterOptIn"
                    checked={watch('newsletterOptIn')}
                    onCheckedChange={(checked) => setValue('newsletterOptIn', checked as boolean)}
                    className="mt-0.5"
                />
                <label htmlFor="newsletterOptIn" className="text-sm text-gray-600 leading-relaxed cursor-pointer">
                    Subscribe to our newsletter for tips, updates, and exclusive content.
                </label>
            </div>

            {/* Summary */}
            <div className="p-4 bg-indigo-50 rounded-xl space-y-2">
                <h4 className="text-sm font-semibold text-gray-800">Account Summary</h4>
                <div className="text-xs text-gray-600 space-y-1">
                    <p><span className="font-medium">Email:</span> {getValues('email')}</p>
                    <p><span className="font-medium">Username:</span> @{getValues('username')}</p>
                    <p><span className="font-medium">Name:</span> {getValues('fullName')}</p>
                </div>
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
                    onClick={handleSignup}
                    disabled={isSubmitting}
                    className="flex-1 h-12 bg-[#4f46e5] hover:bg-[#4338ca] text-white rounded-xl text-base font-semibold shadow-lg shadow-indigo-200 transition-all transform hover:scale-[1.01]"
                >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
                </Button>
            </div>
        </div>
    );
}
