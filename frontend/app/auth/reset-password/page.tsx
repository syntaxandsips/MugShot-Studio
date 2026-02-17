
'use client';

import { Suspense } from 'react';
import { AuthLayoutShell } from '@/src/components/auth/AuthLayoutShell';
import { ResetPasswordForm } from '@/src/components/auth/ResetPasswordForm';
import { Loader2 } from 'lucide-react';

function ResetPasswordContent() {
    return (
        <AuthLayoutShell quoteIndex={0}>
            <ResetPasswordForm />
        </AuthLayoutShell>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-[#4f46e5]" />
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    );
}
