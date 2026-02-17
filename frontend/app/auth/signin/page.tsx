
'use client';

import { AuthLayoutShell } from '@/src/components/auth/AuthLayoutShell';
import { SigninForm } from '@/src/components/auth/SigninForm';

export default function SigninPage() {
    return (
        <AuthLayoutShell quoteIndex={0}>
            <SigninForm />
        </AuthLayoutShell>
    );
}
