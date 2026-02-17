
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Key, Mail, Shield, Smartphone, Globe, Trash2, LogOut } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { authApi } from '@/src/lib/auth';
import { useAuth } from '@/src/context/auth-context';

// --- Schemas ---
const ChangePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
});

const ChangeEmailSchema = z.object({
    newEmail: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required for verification'),
});

// --- Component ---
export function SecuritySettings() {
    const { logout } = useAuth();
    const [sessions, setSessions] = useState<any[]>([]);
    const [isLoadingSessions, setIsLoadingSessions] = useState(false);

    // Password Form
    const passwordForm = useForm<z.infer<typeof ChangePasswordSchema>>({
        resolver: zodResolver(ChangePasswordSchema),
    });

    // Email Form
    const emailForm = useForm<z.infer<typeof ChangeEmailSchema>>({
        resolver: zodResolver(ChangeEmailSchema),
    });

    // Fetch Data
    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        setIsLoadingSessions(true);
        try {
            const token = localStorage.getItem('access_token');
            if (!token) return;
            const data = await authApi.getSessions(token);
            setSessions(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch sessions', error);
        } finally {
            setIsLoadingSessions(false);
        }
    };

    // Actions
    const onChangePassword = async (data: z.infer<typeof ChangePasswordSchema>) => {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) throw new Error('Not authenticated');
            await authApi.changePassword(token, data.currentPassword, data.newPassword, data.confirmPassword);
            toast.success('Password updated successfully');
            passwordForm.reset();
        } catch (error: any) {
            toast.error(error.message || 'Failed to update password');
        }
    };

    const onChangeEmail = async (data: z.infer<typeof ChangeEmailSchema>) => {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) throw new Error('Not authenticated');
            await authApi.changeEmail(token, data.newEmail, data.password);
            toast.success('Confirmation email sent to new address');
            emailForm.reset();
        } catch (error: any) {
            toast.error(error.message || 'Failed to update email');
        }
    };

    const onRevokeSession = async (sessionId: string) => {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) return;
            await authApi.revokeSession(token, sessionId);
            setSessions((prev) => prev.filter((s) => s.id !== sessionId));
            toast.success('Session revoked');
        } catch (error) {
            toast.error('Failed to revoke session');
        }
    };

    const onLogoutAll = async () => {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) return;
            await authApi.revokeAllSessions(token);
            setSessions([]);
            logout();
            toast.success('Logged out of all sessions');
        } catch (error) {
            toast.error('Failed to logout all');
        }
    };

    return (
        <div className="space-y-8 max-w-4xl">

            {/* Change Password */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Key className="h-5 w-5" /> Change Password
                    </CardTitle>
                    <CardDescription>
                        Update your password to keep your account secure.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="currentPassword">Current Password</Label>
                                <Input id="currentPassword" type="password" {...passwordForm.register('currentPassword')} />
                                {passwordForm.formState.errors.currentPassword && <p className="text-destructive text-xs">{passwordForm.formState.errors.currentPassword.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="newPassword">New Password</Label>
                                <Input id="newPassword" type="password" {...passwordForm.register('newPassword')} />
                                {passwordForm.formState.errors.newPassword && <p className="text-destructive text-xs">{passwordForm.formState.errors.newPassword.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <Input id="confirmPassword" type="password" {...passwordForm.register('confirmPassword')} />
                                {passwordForm.formState.errors.confirmPassword && <p className="text-destructive text-xs">{passwordForm.formState.errors.confirmPassword.message}</p>}
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Button type="submit" disabled={passwordForm.formState.isSubmitting}>
                                {passwordForm.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Update Password'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Change Email */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5" /> Change Email
                    </CardTitle>
                    <CardDescription>
                        Update your email address. You will need to verify the new email.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={emailForm.handleSubmit(onChangeEmail)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="newEmail">New Email Address</Label>
                                <Input id="newEmail" type="email" placeholder="new@example.com" {...emailForm.register('newEmail')} />
                                {emailForm.formState.errors.newEmail && <p className="text-destructive text-xs">{emailForm.formState.errors.newEmail.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="emailConfirmPassword">Confirm with Password</Label>
                                <Input id="emailConfirmPassword" type="password" {...emailForm.register('password')} />
                                {emailForm.formState.errors.password && <p className="text-destructive text-xs">{emailForm.formState.errors.password.message}</p>}
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Button type="submit" variant="outline" disabled={emailForm.formState.isSubmitting}>
                                {emailForm.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Update Email'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Active Sessions */}
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Smartphone className="h-5 w-5" /> Active Sessions
                            </CardTitle>
                            <CardDescription>
                                Manage your active sessions across different devices.
                            </CardDescription>
                        </div>
                        {sessions.length > 1 && (
                            <Button variant="destructive" size="sm" onClick={onLogoutAll}>
                                <LogOut className="mr-2 h-4 w-4" /> Log out all devices
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoadingSessions ? (
                        <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
                    ) : sessions.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No active sessions info available.</p>
                    ) : (
                        <div className="space-y-4">
                            {sessions.map((session: any) => (
                                <div key={session.id} className="flex justify-between items-center p-3 border rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-muted rounded-full">
                                            <Globe className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">{session.device || 'Unknown Device'}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {session.ip_address} • {new Date(session.last_active || session.created_at).toLocaleDateString()}
                                                {session.is_current && <span className="ml-2 text-green-500 font-semibold">(Current)</span>}
                                            </p>
                                        </div>
                                    </div>
                                    {!session.is_current && (
                                        <Button variant="ghost" size="icon" onClick={() => onRevokeSession(session.id)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Linked Accounts */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" /> Linked Accounts
                    </CardTitle>
                    <CardDescription>
                        Manage external accounts linked to your profile via OAuth.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">No external accounts linked. Social login support coming soon.</p>
                </CardContent>
            </Card>

        </div>
    );
}
