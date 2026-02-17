
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChangePasswordSchema, ChangeEmailSchema } from '@/src/schemas/auth.schema';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { useAuthStore } from '@/src/store/useAuthStore';
import { toast } from 'sonner';

export function SettingsSecurity() {
    const [isPasswordLoading, setIsPasswordLoading] = useState(false);
    const [isEmailLoading, setIsEmailLoading] = useState(false);
    const changePassword = useAuthStore((state) => state.changePassword);
    const changeEmail = useAuthStore((state) => state.changeEmail);

    const formPassword = useForm<z.infer<typeof ChangePasswordSchema>>({
        resolver: zodResolver(ChangePasswordSchema),
    });

    const formEmail = useForm<z.infer<typeof ChangeEmailSchema>>({
        resolver: zodResolver(ChangeEmailSchema),
    });

    const onPasswordSubmit = async (data: z.infer<typeof ChangePasswordSchema>) => {
        setIsPasswordLoading(true);
        try {
            await changePassword(data);
            toast.success('Password updated successfully');
            formPassword.reset();
        } catch (error: any) {
            toast.error(error.message || 'Failed to update password');
        } finally {
            setIsPasswordLoading(false);
        }
    };

    const onEmailSubmit = async (data: z.infer<typeof ChangeEmailSchema>) => {
        setIsEmailLoading(true);
        try {
            await changeEmail(data); // Expects { newEmail, password }
            toast.success('Email update verification sent');
            formEmail.reset();
        } catch (error: any) {
            toast.error(error.message || 'Failed to update email');
        } finally {
            setIsEmailLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Change Password</CardTitle>
                    <CardDescription>
                        Update your password to keep your account secure.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={formPassword.handleSubmit(onPasswordSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="currentPassword">Current Password</Label>
                            <Input
                                id="currentPassword"
                                type="password"
                                {...formPassword.register('currentPassword')}
                            />
                            {formPassword.formState.errors.currentPassword && (
                                <p className="text-red-500 text-sm">{formPassword.formState.errors.currentPassword.message}</p>
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="newPassword">New Password</Label>
                                <Input
                                    id="newPassword"
                                    type="password"
                                    {...formPassword.register('newPassword')}
                                />
                                {formPassword.formState.errors.newPassword && (
                                    <p className="text-red-500 text-sm">{formPassword.formState.errors.newPassword.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    {...formPassword.register('confirmPassword')}
                                />
                                {formPassword.formState.errors.confirmPassword && (
                                    <p className="text-red-500 text-sm">{formPassword.formState.errors.confirmPassword.message}</p>
                                )}
                            </div>
                        </div>
                        <Button type="submit" disabled={isPasswordLoading}>
                            {isPasswordLoading ? 'Updating...' : 'Update Password'}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Change Email</CardTitle>
                    <CardDescription>
                        Update your email address. You will need to verify the new email.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={formEmail.handleSubmit(onEmailSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="newEmail">New Email Address</Label>
                            <Input
                                id="newEmail"
                                type="email"
                                placeholder="new@example.com"
                                {...formEmail.register('newEmail')}
                            />
                            {formEmail.formState.errors.newEmail && (
                                <p className="text-red-500 text-sm">{formEmail.formState.errors.newEmail.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="emailParamPassword">Current Password (for verification)</Label>
                            <Input
                                id="emailParamPassword"
                                type="password"
                                {...formEmail.register('password')}
                            />
                            {formEmail.formState.errors.password && (
                                <p className="text-red-500 text-sm">{formEmail.formState.errors.password.message}</p>
                            )}
                        </div>
                        <Button type="submit" disabled={isEmailLoading}>
                            {isEmailLoading ? 'Updating...' : 'Update Email'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
