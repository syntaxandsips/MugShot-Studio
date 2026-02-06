'use client';

import { useState, useEffect } from 'react';
import { templatesApi, type Template } from '@/src/lib/api';
import {
    Search,
    Filter,
    ThumbsUp,
    ThumbsDown,
    Sparkles,
    TrendingUp,
    Clock,
    Star,
    ChevronDown,
    Loader2,
    Image as ImageIcon,
    ArrowUpRight,
    Shuffle
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

type SortOption = 'trending' | 'recent' | 'popular' | 'votes';

export default function TemplatesPage() {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [categories, setCategories] = useState<{ name: string; count: number }[]>([]);
    const [officialTemplates, setOfficialTemplates] = useState<Template[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<SortOption>('trending');

    useEffect(() => {
        fetchData();
    }, [selectedCategory]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [templatesData, categoriesData, officialData] = await Promise.allSettled([
                templatesApi.getAll({ category: selectedCategory || undefined, limit: 50 }),
                templatesApi.getAllCategories(),
                templatesApi.getOfficial(),
            ]);

            if (templatesData.status === 'fulfilled') {
                setTemplates(templatesData.value.items);
            }
            if (categoriesData.status === 'fulfilled') {
                setCategories(categoriesData.value);
            }
            if (officialData.status === 'fulfilled') {
                setOfficialTemplates(officialData.value);
            }
        } catch (error) {
            console.error('Failed to fetch templates:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVote = async (templateId: string, vote: 'up' | 'down', e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            await templatesApi.vote(templateId, vote);
            setTemplates(templates.map(t => {
                if (t.id === templateId) {
                    return {
                        ...t,
                        votes_up: vote === 'up' ? t.votes_up + 1 : t.votes_up,
                        votes_down: vote === 'down' ? t.votes_down + 1 : t.votes_down,
                    };
                }
                return t;
            }));
        } catch (error) {
            console.error('Failed to vote:', error);
        }
    };

    const handleRemix = async (templateId: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            const project = await templatesApi.remix(templateId);
            window.location.href = `/editor/${project.id}`;
        } catch (error) {
            console.error('Failed to remix template:', error);
        }
    };

    const filteredTemplates = templates
        .filter(template => {
            if (searchQuery && !template.name.toLowerCase().includes(searchQuery.toLowerCase())) {
                return false;
            }
            return true;
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'recent':
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                case 'popular':
                    return b.remix_count - a.remix_count;
                case 'votes':
                    return (b.votes_up - b.votes_down) - (a.votes_up - a.votes_down);
                default:
                    return b.remix_count - a.remix_count;
            }
        });

    const getSortIcon = () => {
        switch (sortBy) {
            case 'trending': return <TrendingUp className="w-4 h-4 mr-2" />;
            case 'recent': return <Clock className="w-4 h-4 mr-2" />;
            case 'popular': return <Star className="w-4 h-4 mr-2" />;
            case 'votes': return <ThumbsUp className="w-4 h-4 mr-2" />;
            default: return <TrendingUp className="w-4 h-4 mr-2" />;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Template Marketplace</h1>
                    <p className="text-gray-600 mt-1">Discover stunning templates created by the community</p>
                </div>

                {/* Official Templates Banner */}
                {officialTemplates.length > 0 && (
                    <div className="mb-8">
                        <div className="flex items-center gap-2 mb-4">
                            <Sparkles className="w-5 h-5 text-amber-500" />
                            <h2 className="text-xl font-semibold text-gray-900">Official Templates</h2>
                            <span className="bg-amber-100 text-amber-700 text-xs font-medium px-2 py-0.5 rounded-full">Featured</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {officialTemplates.slice(0, 4).map((template) => (
                                <Link
                                    key={template.id}
                                    href={`/dashboard/templates/${template.id}`}
                                    className="group relative bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200 overflow-hidden hover:shadow-lg transition-all"
                                >
                                    <div className="aspect-video bg-gray-100 overflow-hidden">
                                        {template.thumbnail_url ? (
                                            <img
                                                src={template.thumbnail_url}
                                                alt={template.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <ImageIcon className="w-8 h-8 text-gray-300" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="bg-amber-100 text-amber-700 text-xs font-medium px-1.5 py-0.5 rounded">Official</span>
                                        </div>
                                        <h3 className="font-medium text-gray-900 truncate">{template.name}</h3>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Toolbar */}
                <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6 shadow-sm">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                placeholder="Search templates..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 border-gray-200 focus:border-[#0f7d70] focus:ring-[#0f7d70]/20"
                            />
                        </div>

                        {/* Category Filter */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="border-gray-200">
                                    <Filter className="w-4 h-4 mr-2" />
                                    {selectedCategory || 'All Categories'}
                                    <ChevronDown className="w-4 h-4 ml-2" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-white max-h-64 overflow-y-auto">
                                <DropdownMenuItem onClick={() => setSelectedCategory(null)}>
                                    All Categories
                                </DropdownMenuItem>
                                {categories.map((category) => (
                                    <DropdownMenuItem
                                        key={category.name}
                                        onClick={() => setSelectedCategory(category.name)}
                                    >
                                        {category.name} ({category.count})
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Sort */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="border-gray-200">
                                    {getSortIcon()}
                                    {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
                                    <ChevronDown className="w-4 h-4 ml-2" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-white">
                                <DropdownMenuItem onClick={() => setSortBy('trending')}>
                                    <TrendingUp className="w-4 h-4 mr-2" /> Trending
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setSortBy('recent')}>
                                    <Clock className="w-4 h-4 mr-2" /> Recent
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setSortBy('popular')}>
                                    <Star className="w-4 h-4 mr-2" /> Most Used
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setSortBy('votes')}>
                                    <ThumbsUp className="w-4 h-4 mr-2" /> Top Rated
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Category Pills */}
                {categories.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                        <button
                            onClick={() => setSelectedCategory(null)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${!selectedCategory
                                    ? 'bg-[#0f7d70] text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            All
                        </button>
                        {categories.slice(0, 8).map((category) => (
                            <button
                                key={category.name}
                                onClick={() => setSelectedCategory(category.name)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedCategory === category.name
                                        ? 'bg-[#0f7d70] text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {category.name}
                            </button>
                        ))}
                    </div>
                )}

                {/* Templates Grid */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-[#0f7d70]" />
                    </div>
                ) : filteredTemplates.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                        <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No templates found</h3>
                        <p className="text-gray-600">Try adjusting your search or filters</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredTemplates.map((template) => (
                            <Link
                                key={template.id}
                                href={`/dashboard/templates/${template.id}`}
                                className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:border-[#0f7d70] hover:shadow-lg transition-all"
                            >
                                {/* Thumbnail */}
                                <div className="relative aspect-video bg-gray-100 overflow-hidden">
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

                                    {/* Quick Actions Overlay */}
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <Button
                                            size="sm"
                                            className="bg-white text-gray-900 hover:bg-gray-100"
                                            onClick={(e) => handleRemix(template.id, e)}
                                        >
                                            <Shuffle className="w-4 h-4 mr-1" />
                                            Remix
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="bg-white/10 border-white text-white hover:bg-white/20"
                                        >
                                            <ArrowUpRight className="w-4 h-4" />
                                        </Button>
                                    </div>

                                    {/* Category Badge */}
                                    <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1">
                                        <span className="text-xs font-medium text-gray-700">{template.category}</span>
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="p-4">
                                    <h3 className="font-medium text-gray-900 truncate group-hover:text-[#0f7d70] transition-colors">
                                        {template.name}
                                    </h3>

                                    {template.user && (
                                        <div className="flex items-center gap-2 mt-2">
                                            <div className="w-5 h-5 rounded-full bg-gray-200 overflow-hidden">
                                                {template.user.profile_photo_url ? (
                                                    <img src={template.user.profile_photo_url} alt={template.user.username} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full bg-gradient-to-br from-[#0f7d70] to-[#0a5a52]" />
                                                )}
                                            </div>
                                            <span className="text-sm text-gray-500">@{template.user.username}</span>
                                        </div>
                                    )}

                                    {/* Stats */}
                                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
                                        <button
                                            onClick={(e) => handleVote(template.id, 'up', e)}
                                            className="flex items-center gap-1 text-gray-500 hover:text-green-600 transition-colors"
                                        >
                                            <ThumbsUp className="w-4 h-4" />
                                            <span className="text-sm">{template.votes_up}</span>
                                        </button>
                                        <button
                                            onClick={(e) => handleVote(template.id, 'down', e)}
                                            className="flex items-center gap-1 text-gray-500 hover:text-red-600 transition-colors"
                                        >
                                            <ThumbsDown className="w-4 h-4" />
                                            <span className="text-sm">{template.votes_down}</span>
                                        </button>
                                        <div className="flex items-center gap-1 text-gray-500 ml-auto">
                                            <Shuffle className="w-4 h-4" />
                                            <span className="text-sm">{template.remix_count}</span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
