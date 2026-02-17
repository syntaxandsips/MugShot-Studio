
'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/src/store/useAuthStore';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { toast } from 'sonner';

interface Session {
    id: string;
    device: string;
    ip_address: string;
    last_active: string;
    is_current: boolean;
}

export function SettingsSessions() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const getSessions = useAuthStore((state) => state.getSessions);
    const revokeSession = useAuthStore((state) => state.revokeSession);
    const revokeAllSessions = useAuthStore((state) => state.revokeAllSessions);

    const fetchSessions = async () => {
        try {
            const data = await getSessions();
            setSessions(data);
        } catch (error) {
            console.error('Failed to fetch sessions', error);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    const handleRevoke = async (sessionId: string) => {
        try {
            await revokeSession(sessionId);
            setSessions(sessions.filter(s => s.id !== sessionId));
            toast.success('Session revoked');
        } catch (error: any) {
            toast.error(error.message || 'Failed to revoke session');
        }
    };

    const handleRevokeAll = async () => {
        if (!confirm('Are you sure you want to log out of all devices?')) return;
        setIsLoading(true);
        try {
            await revokeAllSessions();
            await fetchSessions();
            toast.success('All sessions revoked');
        } catch (error: any) {
            toast.error(error.message || 'Failed to revoke sessions');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Active Sessions</CardTitle>
                <CardDescription>
                    Manage your active sessions on other devices.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {sessions.length === 0 ? (
                    <p className="text-gray-500 text-sm">No active sessions found.</p>
                ) : (
                    <div className="space-y-4">
                        {sessions.map((session) => (
                            <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                                <div>
                                    <div className="font-medium flex items-center gap-2">
                                        {session.device || 'Unknown Device'}
                                        {session.is_current && (
                                            <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                                                Current
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        {session.ip_address} • {new Date(session.last_active).toLocaleString()}
                                    </div>
                                </div>
                                {!session.is_current && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleRevoke(session.id)}
                                    >
                                        Revoke
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {sessions.length > 1 && (
                    <div className="pt-4 border-t">
                        <Button
                            variant="destructive"
                            className="w-full sm:w-auto"
                            onClick={handleRevokeAll}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Processing...' : 'Log Out All Devices'}
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
