
'use client';

import { AuthLayoutShell } from '@/src/components/auth/AuthLayoutShell';
import { SignupWizard } from '@/src/components/auth/SignupWizard';

export default function SignupPage() {
    return (
        <AuthLayoutShell quoteIndex={1}>
            <SignupWizard />
        </AuthLayoutShell>
    );
}
