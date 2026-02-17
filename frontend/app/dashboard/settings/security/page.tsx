'use client';

import { SecuritySettings } from '@/src/components/settings/SecuritySettings';

export default function SecurityPage() {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Security & Privacy</h3>
                <p className="text-sm text-muted-foreground">
                    Manage your password, email, and session security.
                </p>
            </div>
            <div className="separator" />
            <SecuritySettings />
        </div>
    );
}
