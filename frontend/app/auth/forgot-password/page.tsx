
'use client';

import { AuthLayoutShell } from '@/src/components/auth/AuthLayoutShell';
import { ForgotPasswordForm } from '@/src/components/auth/ForgotPasswordForm';

export default function ForgotPasswordPage() {
    return (
        <AuthLayoutShell quoteIndex={2}>
            <ForgotPasswordForm />
        </AuthLayoutShell>
    );
}
