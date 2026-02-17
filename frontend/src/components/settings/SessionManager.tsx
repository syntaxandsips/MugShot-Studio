
'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Monitor, Phone, Globe, Trash2, LogOut } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { useToast } from '@/src/hooks/use-toast';
import { authApi } from '@/src/lib/auth';
import { useAuth } from '@/src/context/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';

interface Session {
    id: string;
    device: string;
    ip_address: string;
    last_active: string;
    is_current: boolean;
}

export default function SessionManager() {
    const { logout } = useAuth();
    const { toast } = useToast();
    const [sessions, setSessions] = useState<Session[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadSessions();
    }, []);

    const loadSessions = async () => {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) return;
            const data = await authApi.getSessions(token);
            setSessions(data);
        } catch (error) {
            console.error('Failed to load sessions', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRevokeSession = async (sessionId: string) => {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) return;
            await authApi.revokeSession(token, sessionId);
            setSessions(prev => prev.filter(s => s.id !== sessionId));
            toast({ title: "Session revoked", description: "The session has been terminated." });
        } catch (error) {
            toast({ title: "Error", description: "Failed to revoke session.", variant: "destructive" });
        }
    };

    const handleRevokeAll = async () => {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) return;
            await authApi.revokeAllSessions(token);
            setSessions(prev => prev.filter(s => s.is_current)); // Keep current session? Or does user get logged out? 
            // The API says "Terminate All Sessions ... signs out the user globally". 
            // So we should probably logout locally too or redirect.
            // But usually "Revoke All OTHER sessions" is the feature. 
            // If the API revokes ALL including current, we should logout.
            logout(); // Assuming it revokes current too
            toast({ title: "All sessions revoked", description: "You have been logged out from all devices." });
        } catch (error) {
            toast({ title: "Error", description: "Failed to revoke sessions.", variant: "destructive" });
        }
    };

    const getDeviceIcon = (deviceString: string) => {
        const lower = deviceString.toLowerCase();
        if (lower.includes('mobile') || lower.includes('android') || lower.includes('iphone')) return <Phone className="h-5 w-5" />;
        return <Monitor className="h-5 w-5" />;
    };

    if (isLoading) return <div className="p-4 flex justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Active Sessions</CardTitle>
                <CardDescription>
                    Manage your active sessions on other devices.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4">
                    {sessions.map((session) => (
                        <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center space-x-4">
                                <div className="p-2 bg-gray-100 rounded-full">
                                    {getDeviceIcon(session.device || 'Unknown')}
                                </div>
                                <div>
                                    <p className="font-medium text-sm text-gray-900">
                                        {session.device || 'Unknown Device'}
                                        {session.is_current && <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Current</span>}
                                    </p>
                                    <div className="flex items-center text-xs text-gray-500 mt-1 space-x-2">
                                        <span className="flex items-center"><Globe className="h-3 w-3 mr-1" /> {session.ip_address}</span>
                                        <span>•</span>
                                        <span>Last active: {new Date(session.last_active).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                            {!session.is_current && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => handleRevokeSession(session.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    ))}

                    {sessions.length === 0 && (
                        <div className="text-center py-6 text-gray-500 text-sm">No active sessions found.</div>
                    )}
                </div>

                {sessions.length > 1 && (
                    <Button
                        variant="destructive"
                        className="w-full"
                        onClick={handleRevokeAll}
                    >
                        <LogOut className="mr-2 h-4 w-4" /> Log out of all devices
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
