'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/src/context/auth-context';
import { projectsApi, creditsApi, type Project } from '@/src/lib/api';
import {
    Plus,
    Sparkles,
    TrendingUp,
    Image as ImageIcon,
    Clock,
    ChevronRight,
    Zap,
    LayoutGrid,
    Star
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/src/components/ui/button';

interface DashboardStats {
    credits: number;
    bonusCredits: number;
    recentProjects: Project[];
    trendingTemplates: Project[];
}

export default function DashboardPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState<DashboardStats>({
        credits: 0,
        bonusCredits: 0,
        recentProjects: [],
        trendingTemplates: [],
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [creditsData, recentData, trendingData] = await Promise.allSettled([
                    creditsApi.getBalance(),
                    projectsApi.getRecentGallery(1, 6),
                    projectsApi.getTrendingGallery(1, 4),
                ]);

                setStats({
                    credits: creditsData.status === 'fulfilled' ? creditsData.value.credits : user?.credits || 0,
                    bonusCredits: creditsData.status === 'fulfilled' ? creditsData.value.bonus_credits : 0,
                    recentProjects: recentData.status === 'fulfilled' ? recentData.value.items : [],
                    trendingTemplates: trendingData.status === 'fulfilled' ? trendingData.value.items : [],
                });
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, [user?.credits]);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header Section */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        {getGreeting()}, {user?.full_name?.split(' ')[0] || user?.username || 'Creator'}! 👋
                    </h1>
                    <p className="mt-2 text-gray-600">
                        Ready to create stunning thumbnails? Let&apos;s get started.
                    </p>
                </div>

                {/* Quick Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Credits Card */}
                    <div className="bg-gradient-to-br from-[#0f7d70] to-[#0a5a52] rounded-2xl p-6 text-white shadow-lg shadow-[#0f7d70]/20">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <Zap className="w-6 h-6" />
                            </div>
                            <Link href="/dashboard/billing" className="text-white/80 hover:text-white text-sm flex items-center gap-1 transition-colors">
                                Get more <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                        <p className="text-white/80 text-sm mb-1">Available Credits</p>
                        <p className="text-4xl font-bold">{isLoading ? '...' : stats.credits.toLocaleString()}</p>
                        {stats.bonusCredits > 0 && (
                            <p className="text-white/70 text-sm mt-1">+{stats.bonusCredits} bonus credits</p>
                        )}
                    </div>

                    {/* Quick Actions Card */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Sparkles className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                        <p className="text-gray-600 text-sm mb-1">Quick Generate</p>
                        <p className="text-lg font-semibold text-gray-900 mb-3">Create a new thumbnail</p>
                        <Link href="/chat">
                            <Button className="w-full bg-[#0f7d70] hover:bg-[#0c6a61] text-white">
                                <Plus className="w-4 h-4 mr-2" />
                                Start Creating
                            </Button>
                        </Link>
                    </div>

                    {/* Templates Card */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-amber-100 rounded-lg">
                                <LayoutGrid className="w-6 h-6 text-amber-600" />
                            </div>
                            <Link href="/dashboard/templates" className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1 transition-colors">
                                Browse all <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                        <p className="text-gray-600 text-sm mb-1">Template Library</p>
                        <p className="text-lg font-semibold text-gray-900">Explore trending templates</p>
                    </div>
                </div>

                {/* Recent Projects Section */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-gray-400" />
                            <h2 className="text-xl font-semibold text-gray-900">Recent Creations</h2>
                        </div>
                        <Link href="/dashboard/projects" className="text-[#0f7d70] hover:text-[#0c6a61] text-sm font-medium flex items-center gap-1">
                            View all <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {isLoading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="aspect-video bg-gray-100 rounded-xl animate-pulse" />
                            ))}
                        </div>
                    ) : stats.recentProjects.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            {stats.recentProjects.map((project) => (
                                <Link
                                    key={project.id}
                                    href={`/dashboard/projects/${project.id}`}
                                    className="group relative aspect-video bg-gray-100 rounded-xl overflow-hidden border border-gray-100 hover:border-[#0f7d70] transition-all hover:shadow-lg"
                                >
                                    {project.thumbnail_url ? (
                                        <img
                                            src={project.thumbnail_url}
                                            alt={project.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <ImageIcon className="w-8 h-8 text-gray-300" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="absolute bottom-2 left-2 right-2">
                                            <p className="text-white text-xs font-medium truncate">{project.name}</p>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-gray-50 rounded-2xl p-8 text-center">
                            <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
                            <p className="text-gray-600 mb-4">Start creating your first thumbnail masterpiece!</p>
                            <Link href="/chat">
                                <Button className="bg-[#0f7d70] hover:bg-[#0c6a61] text-white">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Create Your First Project
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>

                {/* Trending Templates Section */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-gray-400" />
                            <h2 className="text-xl font-semibold text-gray-900">Trending in Community</h2>
                        </div>
                        <Link href="/dashboard/templates" className="text-[#0f7d70] hover:text-[#0c6a61] text-sm font-medium flex items-center gap-1">
                            Explore more <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="bg-gray-100 rounded-2xl h-64 animate-pulse" />
                            ))}
                        </div>
                    ) : stats.trendingTemplates.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {stats.trendingTemplates.map((template) => (
                                <Link
                                    key={template.id}
                                    href={`/dashboard/templates/${template.id}`}
                                    className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-[#0f7d70] hover:shadow-lg transition-all"
                                >
                                    <div className="aspect-video bg-gray-100 relative overflow-hidden">
                                        {template.thumbnail_url ? (
                                            <img
                                                src={template.thumbnail_url}
                                                alt={template.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <ImageIcon className="w-12 h-12 text-gray-300" />
                                            </div>
                                        )}
                                        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
                                            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                            <span className="text-xs font-medium text-gray-700">{template.likes_count}</span>
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-medium text-gray-900 truncate group-hover:text-[#0f7d70] transition-colors">
                                            {template.name}
                                        </h3>
                                        <p className="text-sm text-gray-500 mt-1">{template.views_count} views</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-gray-50 rounded-2xl p-8 text-center">
                            <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No trending templates yet</h3>
                            <p className="text-gray-600">Check back soon for community favorites!</p>
                        </div>
                    )}
                </div>

                {/* Quick Actions Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Link href="/dashboard/assets" className="group bg-white rounded-xl p-5 border border-gray-100 hover:border-[#0f7d70] hover:shadow-md transition-all">
                        <div className="p-3 bg-blue-100 rounded-lg w-fit mb-3 group-hover:bg-blue-200 transition-colors">
                            <ImageIcon className="w-5 h-5 text-blue-600" />
                        </div>
                        <h3 className="font-medium text-gray-900">Asset Library</h3>
                        <p className="text-sm text-gray-500 mt-1">Manage your uploads</p>
                    </Link>

                    <Link href="/community" className="group bg-white rounded-xl p-5 border border-gray-100 hover:border-[#0f7d70] hover:shadow-md transition-all">
                        <div className="p-3 bg-green-100 rounded-lg w-fit mb-3 group-hover:bg-green-200 transition-colors">
                            <TrendingUp className="w-5 h-5 text-green-600" />
                        </div>
                        <h3 className="font-medium text-gray-900">Community</h3>
                        <p className="text-sm text-gray-500 mt-1">Discover & connect</p>
                    </Link>

                    <Link href="/dashboard/billing" className="group bg-white rounded-xl p-5 border border-gray-100 hover:border-[#0f7d70] hover:shadow-md transition-all">
                        <div className="p-3 bg-purple-100 rounded-lg w-fit mb-3 group-hover:bg-purple-200 transition-colors">
                            <Zap className="w-5 h-5 text-purple-600" />
                        </div>
                        <h3 className="font-medium text-gray-900">Billing</h3>
                        <p className="text-sm text-gray-500 mt-1">Plans & credits</p>
                    </Link>

                    <Link href="/dashboard/settings" className="group bg-white rounded-xl p-5 border border-gray-100 hover:border-[#0f7d70] hover:shadow-md transition-all">
                        <div className="p-3 bg-orange-100 rounded-lg w-fit mb-3 group-hover:bg-orange-200 transition-colors">
                            <Sparkles className="w-5 h-5 text-orange-600" />
                        </div>
                        <h3 className="font-medium text-gray-900">Settings</h3>
                        <p className="text-sm text-gray-500 mt-1">Customize experience</p>
                    </Link>
                </div>
            </div>
        </div>
    );
}
