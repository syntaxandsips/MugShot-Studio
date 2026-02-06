'use client';

import { useState, useEffect } from 'react';
import { projectsApi, usersApi, type Project } from '@/src/lib/api';
import {
    Search,
    TrendingUp,
    Clock,
    Heart,
    Star,
    Filter,
    ChevronDown,
    Loader2,
    Image as ImageIcon,
    Eye,
    Users,
    Crown,
    Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu';

type Tab = 'discover' | 'trending' | 'following' | 'creators';
type SortOption = 'recent' | 'popular' | 'trending';

interface Creator {
    id: string;
    username: string;
    full_name: string;
    profile_photo_url: string;
    followers_count: number;
    projects_count: number;
    is_verified: boolean;
    is_following: boolean;
}

export default function CommunityPage() {
    const [activeTab, setActiveTab] = useState<Tab>('discover');
    const [projects, setProjects] = useState<Project[]>([]);
    const [creators, setCreators] = useState<Creator[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<SortOption>('recent');

    useEffect(() => {
        if (activeTab === 'creators') {
            fetchCreators();
        } else {
            fetchProjects();
        }
    }, [activeTab, sortBy]);

    const fetchProjects = async () => {
        setIsLoading(true);
        try {
            let data;
            switch (activeTab) {
                case 'trending':
                    data = await projectsApi.getTrendingGallery(1, 24);
                    break;
                case 'following':
                    data = await projectsApi.getFollowingGallery(1, 24);
                    break;
                default:
                    data = await projectsApi.getRecentGallery(1, 24);
            }
            setProjects(data.items);
        } catch (error) {
            console.error('Failed to fetch projects:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchCreators = async () => {
        setIsLoading(true);
        try {
            const data = await usersApi.getTopCreators();
            setCreators(data);
        } catch (error) {
            console.error('Failed to fetch creators:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLike = async (projectId: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            await projectsApi.like(projectId);
            setProjects(projects.map(p =>
                p.id === projectId
                    ? { ...p, is_liked: true, likes_count: p.likes_count + 1 }
                    : p
            ));
        } catch (error) {
            console.error('Failed to like project:', error);
        }
    };

    const handleUnlike = async (projectId: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            await projectsApi.unlike(projectId);
            setProjects(projects.map(p =>
                p.id === projectId
                    ? { ...p, is_liked: false, likes_count: p.likes_count - 1 }
                    : p
            ));
        } catch (error) {
            console.error('Failed to unlike project:', error);
        }
    };

    const handleFollow = async (userId: string) => {
        try {
            await usersApi.follow(userId);
            setCreators(creators.map(c =>
                c.id === userId
                    ? { ...c, is_following: true, followers_count: c.followers_count + 1 }
                    : c
            ));
        } catch (error) {
            console.error('Failed to follow user:', error);
        }
    };

    const handleUnfollow = async (userId: string) => {
        try {
            await usersApi.unfollow(userId);
            setCreators(creators.map(c =>
                c.id === userId
                    ? { ...c, is_following: false, followers_count: c.followers_count - 1 }
                    : c
            ));
        } catch (error) {
            console.error('Failed to unfollow user:', error);
        }
    };

    const filteredProjects = projects.filter(project => {
        if (searchQuery && !project.name.toLowerCase().includes(searchQuery.toLowerCase())) {
            return false;
        }
        return true;
    });

    const filteredCreators = creators.filter(creator => {
        if (searchQuery &&
            !creator.username.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !creator.full_name.toLowerCase().includes(searchQuery.toLowerCase())
        ) {
            return false;
        }
        return true;
    });

    const tabs = [
        { id: 'discover' as Tab, label: 'Discover', icon: Sparkles },
        { id: 'trending' as Tab, label: 'Trending', icon: TrendingUp },
        { id: 'following' as Tab, label: 'Following', icon: Heart },
        { id: 'creators' as Tab, label: 'Top Creators', icon: Crown },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Community</h1>
                    <p className="text-gray-600 mt-1">Discover amazing creations from talented creators</p>
                </div>

                {/* Tabs */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div className="flex bg-gray-100 rounded-xl p-1">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === tab.id
                                            ? 'bg-white text-[#0f7d70] shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span className="hidden sm:inline">{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Search */}
                        <div className="relative flex-1 sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                placeholder={activeTab === 'creators' ? 'Search creators...' : 'Search projects...'}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 border-gray-200 focus:border-[#0f7d70] focus:ring-[#0f7d70]/20"
                            />
                        </div>

                        {activeTab !== 'creators' && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="border-gray-200">
                                        <Filter className="w-4 h-4 mr-2" />
                                        <ChevronDown className="w-4 h-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="bg-white">
                                    <DropdownMenuItem onClick={() => setSortBy('recent')}>
                                        <Clock className="w-4 h-4 mr-2" /> Most Recent
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setSortBy('popular')}>
                                        <Star className="w-4 h-4 mr-2" /> Most Popular
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setSortBy('trending')}>
                                        <TrendingUp className="w-4 h-4 mr-2" /> Trending
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </div>

                {/* Content */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-[#0f7d70]" />
                    </div>
                ) : activeTab === 'creators' ? (
                    /* Creators Grid */
                    filteredCreators.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">No creators found</h3>
                            <p className="text-gray-600">Try adjusting your search</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredCreators.map((creator, index) => (
                                <Link
                                    key={creator.id}
                                    href={`/profile/${creator.username}`}
                                    className="group bg-white rounded-2xl border border-gray-100 p-6 hover:border-[#0f7d70] hover:shadow-lg transition-all text-center"
                                >
                                    {/* Rank Badge */}
                                    {index < 3 && (
                                        <div className={`absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${index === 0 ? 'bg-amber-500' : index === 1 ? 'bg-gray-400' : 'bg-amber-700'
                                            }`}>
                                            #{index + 1}
                                        </div>
                                    )}

                                    {/* Avatar */}
                                    <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-[#0f7d70] to-[#0a5a52] overflow-hidden mb-4">
                                        {creator.profile_photo_url ? (
                                            <img
                                                src={creator.profile_photo_url}
                                                alt={creator.username}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold">
                                                {creator.full_name?.charAt(0) || creator.username.charAt(0)}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-center gap-1 mb-1">
                                        <h3 className="font-semibold text-gray-900">{creator.full_name || creator.username}</h3>
                                        {creator.is_verified && (
                                            <svg className="w-4 h-4 text-[#0f7d70]" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500 mb-4">@{creator.username}</p>

                                    <div className="flex items-center justify-center gap-6 mb-4 text-sm">
                                        <div>
                                            <p className="font-semibold text-gray-900">{creator.followers_count.toLocaleString()}</p>
                                            <p className="text-gray-500">Followers</p>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900">{creator.projects_count}</p>
                                            <p className="text-gray-500">Projects</p>
                                        </div>
                                    </div>

                                    <Button
                                        className={`w-full ${creator.is_following
                                                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                : 'bg-[#0f7d70] hover:bg-[#0c6a61] text-white'
                                            }`}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            if (creator.is_following) {
                                                handleUnfollow(creator.id);
                                            } else {
                                                handleFollow(creator.id);
                                            }
                                        }}
                                    >
                                        {creator.is_following ? 'Following' : 'Follow'}
                                    </Button>
                                </Link>
                            ))}
                        </div>
                    )
                ) : (
                    /* Projects Grid */
                    filteredProjects.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                            <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                {activeTab === 'following' ? 'No posts from people you follow' : 'No projects found'}
                            </h3>
                            <p className="text-gray-600">
                                {activeTab === 'following'
                                    ? 'Follow more creators to see their work here'
                                    : 'Try adjusting your search or check back later'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredProjects.map((project) => (
                                <Link
                                    key={project.id}
                                    href={`/dashboard/projects/${project.id}`}
                                    className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:border-[#0f7d70] hover:shadow-lg transition-all"
                                >
                                    {/* Thumbnail */}
                                    <div className="relative aspect-video bg-gray-100 overflow-hidden">
                                        {project.thumbnail_url ? (
                                            <img
                                                src={project.thumbnail_url}
                                                alt={project.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <ImageIcon className="w-12 h-12 text-gray-300" />
                                            </div>
                                        )}

                                        {/* Like Button */}
                                        <button
                                            className={`absolute top-2 right-2 p-2 rounded-full transition-colors ${project.is_liked
                                                    ? 'bg-red-500 text-white'
                                                    : 'bg-white/80 text-gray-600 hover:bg-white hover:text-red-500'
                                                }`}
                                            onClick={(e) => project.is_liked ? handleUnlike(project.id, e) : handleLike(project.id, e)}
                                        >
                                            <Heart className={`w-4 h-4 ${project.is_liked ? 'fill-current' : ''}`} />
                                        </button>
                                    </div>

                                    {/* Info */}
                                    <div className="p-4">
                                        <h3 className="font-medium text-gray-900 truncate group-hover:text-[#0f7d70] transition-colors">
                                            {project.name}
                                        </h3>

                                        {project.user && (
                                            <div className="flex items-center gap-2 mt-2">
                                                <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                                                    {project.user.profile_photo_url ? (
                                                        <img
                                                            src={project.user.profile_photo_url}
                                                            alt={project.user.username}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-gradient-to-br from-[#0f7d70] to-[#0a5a52]" />
                                                    )}
                                                </div>
                                                <span className="text-sm text-gray-500 truncate">@{project.user.username}</span>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 text-sm text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <Heart className={`w-4 h-4 ${project.is_liked ? 'text-red-500 fill-red-500' : ''}`} />
                                                {project.likes_count}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Eye className="w-4 h-4" />
                                                {project.views_count}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )
                )}
            </div>
        </div>
    );
}
