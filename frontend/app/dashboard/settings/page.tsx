'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/src/context/auth-context';
import { authApi } from '@/src/lib/auth';
import { notificationsApi, sessionsApi } from '@/src/lib/api';
import {
    User,
    Bell,
    Shield,
    Palette,
    Key,
    Smartphone,
    LogOut,
    Camera,
    Loader2,
    Check,
    X,
    AlertTriangle,
    Eye,
    EyeOff,
    Mail,
    Globe
} from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { toast } from '../../../src/hooks/use-toast';

type Tab = 'profile' | 'notifications' | 'security' | 'sessions';

interface NotificationSettings {
    email_marketing: boolean;
    email_updates: boolean;
    email_community: boolean;
    push_enabled: boolean;
}

interface Session {
    id: string;
    device: string;
    ip_address: string;
    last_active: string;
    is_current: boolean;
}

export default function SettingsPage() {
    const { user, refreshProfile, logout } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab>('profile');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Profile state
    const [profile, setProfile] = useState({
        full_name: '',
        username: '',
        bio: '',
        website: '',
    });

    // Password state
    const [passwords, setPasswords] = useState({
        current: '',
        new: '',
        confirm: '',
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false,
    });

    // Notification settings
    const [notifications, setNotifications] = useState<NotificationSettings>({
        email_marketing: true,
        email_updates: true,
        email_community: true,
        push_enabled: false,
    });

    // Sessions
    const [sessions, setSessions] = useState<Session[]>([]);

    useEffect(() => {
        if (user) {
            setProfile({
                full_name: user.full_name || '',
                username: user.username || '',
                bio: user.bio || '',
                website: user.website || '',
            });
        }
    }, [user]);

    useEffect(() => {
        if (activeTab === 'notifications') {
            fetchNotificationSettings();
        } else if (activeTab === 'sessions') {
            fetchSessions();
        }
    }, [activeTab]);

    const fetchNotificationSettings = async () => {
        try {
            const settings = await notificationsApi.getSettings();
            setNotifications(settings);
        } catch (error) {
            console.error('Failed to fetch notification settings:', error);
        }
    };

    const fetchSessions = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            if (!token) return;
            const data = await authApi.getSessions(token);
            setSessions(data);
        } catch (error) {
            console.error('Failed to fetch sessions:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleProfileUpdate = async () => {
        setIsSaving(true);
        try {
            const token = localStorage.getItem('access_token');
            if (!token) return;
            await authApi.updateProfile(token, profile);
            await refreshProfile();
            toast({ title: 'Profile updated', description: 'Your changes have been saved.' });
        } catch (error) {
            console.error('Failed to update profile:', error);
            toast({ title: 'Update failed', description: 'Unable to save changes.', variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsSaving(true);
        try {
            const token = localStorage.getItem('access_token');
            if (!token) return;
            await authApi.updateProfilePhoto(token, file);
            await refreshProfile();
            toast({ title: 'Photo updated' });
        } catch (error) {
            console.error('Failed to upload photo:', error);
            toast({ title: 'Upload failed', variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };

    const handlePasswordChange = async () => {
        if (passwords.new !== passwords.confirm) {
            toast({ title: 'Passwords do not match', variant: 'destructive' });
            return;
        }

        if (passwords.new.length < 8) {
            toast({ title: 'Password must be at least 8 characters', variant: 'destructive' });
            return;
        }

        setIsSaving(true);
        try {
            const token = localStorage.getItem('access_token');
            if (!token) return;
            await authApi.changePassword(token, passwords.current, passwords.new, passwords.confirm);
            setPasswords({ current: '', new: '', confirm: '' });
            toast({ title: 'Password changed', description: 'Your password has been updated.' });
        } catch (error) {
            console.error('Failed to change password:', error);
            toast({ title: 'Password change failed', variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleNotificationUpdate = async (key: keyof NotificationSettings, value: boolean) => {
        const newSettings = { ...notifications, [key]: value };
        setNotifications(newSettings);

        try {
            await notificationsApi.updateSettings(newSettings);
        } catch (error) {
            console.error('Failed to update notification settings:', error);
            setNotifications(notifications); // Revert on error
        }
    };

    const handleRevokeSession = async (sessionId: string) => {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) return;
            await authApi.revokeSession(token, sessionId);
            setSessions(sessions.filter(s => s.id !== sessionId));
            toast({ title: 'Session revoked' });
        } catch (error) {
            console.error('Failed to revoke session:', error);
        }
    };

    const handleRevokeAllSessions = async () => {
        if (!confirm('This will sign you out of all devices except this one. Continue?')) return;

        try {
            const token = localStorage.getItem('access_token');
            if (!token) return;
            await authApi.revokeAllSessions(token);
            fetchSessions();
            toast({ title: 'All sessions revoked' });
        } catch (error) {
            console.error('Failed to revoke sessions:', error);
        }
    };

    const handleDeleteAccount = async () => {
        if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) return;
        if (!confirm('All your data will be permanently deleted. Type "DELETE" to confirm.')) return;

        try {
            const token = localStorage.getItem('access_token');
            if (!token) return;
            await authApi.deleteAccount(token);
            logout();
        } catch (error) {
            console.error('Failed to delete account:', error);
            toast({ title: 'Failed to delete account', variant: 'destructive' });
        }
    };

    const tabs = [
        { id: 'profile' as Tab, label: 'Profile', icon: User },
        { id: 'notifications' as Tab, label: 'Notifications', icon: Bell },
        { id: 'security' as Tab, label: 'Security', icon: Shield },
        { id: 'sessions' as Tab, label: 'Sessions', icon: Smartphone },
    ];

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                    <p className="text-gray-600 mt-1">Manage your account preferences and security</p>
                </div>

                <div className="flex flex-col md:flex-row gap-8">
                    {/* Sidebar */}
                    <div className="md:w-56 flex-shrink-0">
                        <nav className="bg-white rounded-xl border border-gray-100 p-2">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${activeTab === tab.id
                                            ? 'bg-[#0f7d70]/10 text-[#0f7d70]'
                                            : 'text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        <Icon className="w-5 h-5" />
                                        <span className="font-medium">{tab.label}</span>
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                        {/* Profile Tab */}
                        {activeTab === 'profile' && (
                            <div className="bg-white rounded-xl border border-gray-100 p-6">
                                <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Information</h2>

                                {/* Profile Photo */}
                                <div className="flex items-center gap-6 mb-8">
                                    <div className="relative">
                                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#0f7d70] to-[#0a5a52] overflow-hidden">
                                            {user?.profile_photo_url ? (
                                                <img
                                                    src={user.profile_photo_url}
                                                    alt={user.full_name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold">
                                                    {user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
                                                </div>
                                            )}
                                        </div>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handlePhotoUpload}
                                            className="hidden"
                                        />
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={isSaving}
                                            className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                                        >
                                            <Camera className="w-4 h-4 text-gray-600" />
                                        </button>
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-gray-900">{user?.full_name || user?.username}</h3>
                                        <p className="text-sm text-gray-500">{user?.email}</p>
                                    </div>
                                </div>

                                {/* Form Fields */}
                                <div className="space-y-5">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                                            <Input
                                                value={profile.full_name}
                                                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                                                placeholder="Your name"
                                                className="border-gray-200"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">@</span>
                                                <Input
                                                    value={profile.username}
                                                    onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                                                    placeholder="username"
                                                    className="pl-8 border-gray-200"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Bio</label>
                                        <textarea
                                            value={profile.bio}
                                            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                                            placeholder="Tell us about yourself..."
                                            rows={3}
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f7d70]/20 focus:border-[#0f7d70] resize-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Website</label>
                                        <div className="relative">
                                            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <Input
                                                value={profile.website}
                                                onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                                                placeholder="https://yourwebsite.com"
                                                className="pl-10 border-gray-200"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end mt-6">
                                    <Button
                                        onClick={handleProfileUpdate}
                                        disabled={isSaving}
                                        className="bg-[#0f7d70] hover:bg-[#0c6a61] text-white"
                                    >
                                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                        Save Changes
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Notifications Tab */}
                        {activeTab === 'notifications' && (
                            <div className="bg-white rounded-xl border border-gray-100 p-6">
                                <h2 className="text-xl font-semibold text-gray-900 mb-6">Notification Preferences</h2>

                                <div className="space-y-6">
                                    {/* Email Notifications */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-4">
                                            <Mail className="w-5 h-5 text-gray-400" />
                                            <h3 className="font-medium text-gray-900">Email Notifications</h3>
                                        </div>

                                        <div className="space-y-4 pl-7">
                                            <label className="flex items-center justify-between cursor-pointer">
                                                <div>
                                                    <p className="font-medium text-gray-700">Product Updates</p>
                                                    <p className="text-sm text-gray-500">New features and improvements</p>
                                                </div>
                                                <button
                                                    onClick={() => handleNotificationUpdate('email_updates', !notifications.email_updates)}
                                                    className={`w-12 h-6 rounded-full transition-colors ${notifications.email_updates ? 'bg-[#0f7d70]' : 'bg-gray-200'
                                                        }`}
                                                >
                                                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${notifications.email_updates ? 'translate-x-6' : 'translate-x-0.5'
                                                        }`} />
                                                </button>
                                            </label>

                                            <label className="flex items-center justify-between cursor-pointer">
                                                <div>
                                                    <p className="font-medium text-gray-700">Community Activity</p>
                                                    <p className="text-sm text-gray-500">Comments, likes, and follows</p>
                                                </div>
                                                <button
                                                    onClick={() => handleNotificationUpdate('email_community', !notifications.email_community)}
                                                    className={`w-12 h-6 rounded-full transition-colors ${notifications.email_community ? 'bg-[#0f7d70]' : 'bg-gray-200'
                                                        }`}
                                                >
                                                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${notifications.email_community ? 'translate-x-6' : 'translate-x-0.5'
                                                        }`} />
                                                </button>
                                            </label>

                                            <label className="flex items-center justify-between cursor-pointer">
                                                <div>
                                                    <p className="font-medium text-gray-700">Marketing Emails</p>
                                                    <p className="text-sm text-gray-500">Promotions and special offers</p>
                                                </div>
                                                <button
                                                    onClick={() => handleNotificationUpdate('email_marketing', !notifications.email_marketing)}
                                                    className={`w-12 h-6 rounded-full transition-colors ${notifications.email_marketing ? 'bg-[#0f7d70]' : 'bg-gray-200'
                                                        }`}
                                                >
                                                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${notifications.email_marketing ? 'translate-x-6' : 'translate-x-0.5'
                                                        }`} />
                                                </button>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Push Notifications */}
                                    <div className="pt-4 border-t border-gray-100">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Bell className="w-5 h-5 text-gray-400" />
                                            <h3 className="font-medium text-gray-900">Push Notifications</h3>
                                        </div>

                                        <div className="pl-7">
                                            <label className="flex items-center justify-between cursor-pointer">
                                                <div>
                                                    <p className="font-medium text-gray-700">Browser Notifications</p>
                                                    <p className="text-sm text-gray-500">Receive notifications in your browser</p>
                                                </div>
                                                <button
                                                    onClick={() => handleNotificationUpdate('push_enabled', !notifications.push_enabled)}
                                                    className={`w-12 h-6 rounded-full transition-colors ${notifications.push_enabled ? 'bg-[#0f7d70]' : 'bg-gray-200'
                                                        }`}
                                                >
                                                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${notifications.push_enabled ? 'translate-x-6' : 'translate-x-0.5'
                                                        }`} />
                                                </button>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Security Tab */}
                        {activeTab === 'security' && (
                            <div className="space-y-6">
                                {/* Change Password */}
                                <div className="bg-white rounded-xl border border-gray-100 p-6">
                                    <div className="flex items-center gap-2 mb-6">
                                        <Key className="w-5 h-5 text-gray-400" />
                                        <h2 className="text-xl font-semibold text-gray-900">Change Password</h2>
                                    </div>

                                    <div className="space-y-4 max-w-md">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Password</label>
                                            <div className="relative">
                                                <Input
                                                    type={showPasswords.current ? 'text' : 'password'}
                                                    value={passwords.current}
                                                    onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                                                    placeholder="Enter current password"
                                                    className="pr-10 border-gray-200"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                >
                                                    {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                                            <div className="relative">
                                                <Input
                                                    type={showPasswords.new ? 'text' : 'password'}
                                                    value={passwords.new}
                                                    onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                                                    placeholder="Enter new password"
                                                    className="pr-10 border-gray-200"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                >
                                                    {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm New Password</label>
                                            <div className="relative">
                                                <Input
                                                    type={showPasswords.confirm ? 'text' : 'password'}
                                                    value={passwords.confirm}
                                                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                                                    placeholder="Confirm new password"
                                                    className="pr-10 border-gray-200"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                >
                                                    {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>

                                        <Button
                                            onClick={handlePasswordChange}
                                            disabled={isSaving || !passwords.current || !passwords.new || !passwords.confirm}
                                            className="bg-[#0f7d70] hover:bg-[#0c6a61] text-white mt-2"
                                        >
                                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                            Update Password
                                        </Button>
                                    </div>
                                </div>

                                {/* Danger Zone */}
                                <div className="bg-white rounded-xl border border-red-100 p-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <AlertTriangle className="w-5 h-5 text-red-500" />
                                        <h2 className="text-xl font-semibold text-red-600">Danger Zone</h2>
                                    </div>
                                    <p className="text-gray-600 mb-4">
                                        Once you delete your account, there is no going back. Please be certain.
                                    </p>
                                    <Button
                                        variant="outline"
                                        className="border-red-200 text-red-600 hover:bg-red-50"
                                        onClick={handleDeleteAccount}
                                    >
                                        Delete Account
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Sessions Tab */}
                        {activeTab === 'sessions' && (
                            <div className="bg-white rounded-xl border border-gray-100 p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-semibold text-gray-900">Active Sessions</h2>
                                    {sessions.length > 1 && (
                                        <Button
                                            variant="outline"
                                            className="text-red-600 border-red-200 hover:bg-red-50"
                                            onClick={handleRevokeAllSessions}
                                        >
                                            <LogOut className="w-4 h-4 mr-2" />
                                            Sign Out All
                                        </Button>
                                    )}
                                </div>

                                {isLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="w-6 h-6 animate-spin text-[#0f7d70]" />
                                    </div>
                                ) : sessions.length === 0 ? (
                                    <p className="text-gray-500 text-center py-8">No active sessions found</p>
                                ) : (
                                    <div className="space-y-4">
                                        {sessions.map((session) => (
                                            <div
                                                key={session.id}
                                                className={`flex items-center justify-between p-4 rounded-lg border ${session.is_current ? 'border-[#0f7d70] bg-[#0f7d70]/5' : 'border-gray-100'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="p-2 bg-gray-100 rounded-lg">
                                                        <Smartphone className="w-5 h-5 text-gray-600" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-medium text-gray-900">{session.device}</p>
                                                            {session.is_current && (
                                                                <span className="bg-[#0f7d70] text-white text-xs px-2 py-0.5 rounded-full">
                                                                    Current
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-gray-500">
                                                            {session.ip_address} • Last active {formatDate(session.last_active)}
                                                        </p>
                                                    </div>
                                                </div>
                                                {!session.is_current && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-red-600 border-red-200 hover:bg-red-50"
                                                        onClick={() => handleRevokeSession(session.id)}
                                                    >
                                                        Revoke
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
