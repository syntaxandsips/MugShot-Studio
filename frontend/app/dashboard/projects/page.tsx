'use client';

import { useState, useEffect } from 'react';
import { projectsApi, type Project } from '@/src/lib/api';
import {
    Plus,
    Search,
    Grid3X3,
    List,
    Trash2,
    Eye,
    Heart,
    MoreVertical,
    Clock,
    Globe,
    Lock,
    Link as LinkIcon,
    Loader2,
    Filter,
    Image as ImageIcon,
    ChevronDown
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu';

type ViewMode = 'grid' | 'list';
type SortBy = 'created_at' | 'updated_at' | 'name' | 'likes_count';
type FilterVisibility = 'all' | 'public' | 'private' | 'unlisted';

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<SortBy>('created_at');
    const [filterVisibility, setFilterVisibility] = useState<FilterVisibility>('all');
    const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const data = await projectsApi.list({ page: 1, limit: 50 });
            setProjects(data.items);
        } catch (error) {
            console.error('Failed to fetch projects:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteProject = async (projectId: string) => {
        if (!confirm('Are you sure you want to delete this project?')) return;

        try {
            await projectsApi.delete(projectId);
            setProjects(projects.filter(p => p.id !== projectId));
        } catch (error) {
            console.error('Failed to delete project:', error);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedProjects.size === 0) return;
        if (!confirm(`Are you sure you want to delete ${selectedProjects.size} projects?`)) return;

        setIsDeleting(true);
        try {
            await projectsApi.bulkDelete(Array.from(selectedProjects));
            setProjects(projects.filter(p => !selectedProjects.has(p.id)));
            setSelectedProjects(new Set());
        } catch (error) {
            console.error('Failed to delete projects:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    const toggleProjectSelection = (projectId: string) => {
        const newSelected = new Set(selectedProjects);
        if (newSelected.has(projectId)) {
            newSelected.delete(projectId);
        } else {
            newSelected.add(projectId);
        }
        setSelectedProjects(newSelected);
    };

    const filteredProjects = projects
        .filter(project => {
            if (searchQuery && !project.name.toLowerCase().includes(searchQuery.toLowerCase())) {
                return false;
            }
            if (filterVisibility !== 'all' && project.visibility !== filterVisibility) {
                return false;
            }
            return true;
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'likes_count':
                    return b.likes_count - a.likes_count;
                case 'updated_at':
                    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
                default:
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            }
        });

    const getVisibilityIcon = (visibility: string) => {
        switch (visibility) {
            case 'public': return <Globe className="w-4 h-4 text-green-600" />;
            case 'private': return <Lock className="w-4 h-4 text-gray-600" />;
            case 'unlisted': return <LinkIcon className="w-4 h-4 text-blue-600" />;
            default: return null;
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">My Projects</h1>
                        <p className="text-gray-600 mt-1">Manage and organize your thumbnail creations</p>
                    </div>
                    <Link href="/chat">
                        <Button className="bg-[#0f7d70] hover:bg-[#0c6a61] text-white shadow-lg shadow-[#0f7d70]/20">
                            <Plus className="w-4 h-4 mr-2" />
                            New Project
                        </Button>
                    </Link>
                </div>

                {/* Toolbar */}
                <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6 shadow-sm">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                placeholder="Search projects..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 border-gray-200 focus:border-[#0f7d70] focus:ring-[#0f7d70]/20"
                            />
                        </div>

                        {/* Filters */}
                        <div className="flex items-center gap-3">
                            {/* Visibility Filter */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="border-gray-200">
                                        <Filter className="w-4 h-4 mr-2" />
                                        {filterVisibility === 'all' ? 'All' : filterVisibility}
                                        <ChevronDown className="w-4 h-4 ml-2" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="bg-white">
                                    <DropdownMenuItem onClick={() => setFilterVisibility('all')}>All</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setFilterVisibility('public')}>
                                        <Globe className="w-4 h-4 mr-2 text-green-600" /> Public
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setFilterVisibility('private')}>
                                        <Lock className="w-4 h-4 mr-2 text-gray-600" /> Private
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setFilterVisibility('unlisted')}>
                                        <LinkIcon className="w-4 h-4 mr-2 text-blue-600" /> Unlisted
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {/* Sort */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="border-gray-200">
                                        <Clock className="w-4 h-4 mr-2" />
                                        Sort
                                        <ChevronDown className="w-4 h-4 ml-2" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="bg-white">
                                    <DropdownMenuItem onClick={() => setSortBy('created_at')}>Newest first</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setSortBy('updated_at')}>Recently updated</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setSortBy('name')}>Name (A-Z)</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setSortBy('likes_count')}>Most liked</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {/* View Mode Toggle */}
                            <div className="flex bg-gray-100 rounded-lg p-1">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-[#0f7d70]' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    <Grid3X3 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-[#0f7d70]' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    <List className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Bulk Delete */}
                            {selectedProjects.size > 0 && (
                                <Button
                                    variant="outline"
                                    className="border-red-200 text-red-600 hover:bg-red-50"
                                    onClick={handleBulkDelete}
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <Trash2 className="w-4 h-4 mr-2" />
                                    )}
                                    Delete ({selectedProjects.size})
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Projects Grid/List */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-[#0f7d70]" />
                    </div>
                ) : filteredProjects.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                        <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            {searchQuery ? 'No projects found' : 'No projects yet'}
                        </h3>
                        <p className="text-gray-600 mb-6">
                            {searchQuery ? 'Try adjusting your search or filters' : 'Create your first project to get started'}
                        </p>
                        {!searchQuery && (
                            <Link href="/chat">
                                <Button className="bg-[#0f7d70] hover:bg-[#0c6a61] text-white">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Create Project
                                </Button>
                            </Link>
                        )}
                    </div>
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredProjects.map((project) => (
                            <div
                                key={project.id}
                                className={`group bg-white rounded-xl border overflow-hidden transition-all hover:shadow-lg ${selectedProjects.has(project.id) ? 'border-[#0f7d70] ring-2 ring-[#0f7d70]/20' : 'border-gray-100 hover:border-[#0f7d70]'
                                    }`}
                            >
                                {/* Thumbnail */}
                                <Link href={`/dashboard/projects/${project.id}`} className="block relative aspect-video bg-gray-100">
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

                                    {/* Selection Checkbox */}
                                    <div
                                        className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            toggleProjectSelection(project.id);
                                        }}
                                    >
                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition-colors ${selectedProjects.has(project.id)
                                            ? 'bg-[#0f7d70] border-[#0f7d70]'
                                            : 'bg-white/80 border-gray-300 hover:border-[#0f7d70]'
                                            }`}>
                                            {selectedProjects.has(project.id) && (
                                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </div>
                                    </div>

                                    {/* Visibility Badge */}
                                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full p-1.5">
                                        {getVisibilityIcon(project.visibility)}
                                    </div>
                                </Link>

                                {/* Info */}
                                <div className="p-4">
                                    <div className="flex items-start justify-between gap-2">
                                        <Link href={`/dashboard/projects/${project.id}`} className="flex-1 min-w-0">
                                            <h3 className="font-medium text-gray-900 truncate group-hover:text-[#0f7d70] transition-colors">
                                                {project.name}
                                            </h3>
                                        </Link>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button className="p-1 hover:bg-gray-100 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <MoreVertical className="w-4 h-4 text-gray-500" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="bg-white">
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/dashboard/projects/${project.id}`}>
                                                        <Eye className="w-4 h-4 mr-2" /> View
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/editor/${project.id}`}>
                                                        Edit
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-red-600 focus:text-red-600"
                                                    onClick={() => handleDeleteProject(project.id)}
                                                >
                                                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <Eye className="w-3.5 h-3.5" /> {project.views_count}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Heart className="w-3.5 h-3.5" /> {project.likes_count}
                                        </span>
                                        <span className="ml-auto">{formatDate(project.created_at)}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50">
                                    <th className="w-8 px-4 py-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedProjects.size === filteredProjects.length && filteredProjects.length > 0}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedProjects(new Set(filteredProjects.map(p => p.id)));
                                                } else {
                                                    setSelectedProjects(new Set());
                                                }
                                            }}
                                            className="rounded border-gray-300 text-[#0f7d70] focus:ring-[#0f7d70]"
                                        />
                                    </th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Visibility</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Stats</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                                    <th className="w-12"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredProjects.map((project) => (
                                    <tr key={project.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedProjects.has(project.id)}
                                                onChange={() => toggleProjectSelection(project.id)}
                                                className="rounded border-gray-300 text-[#0f7d70] focus:ring-[#0f7d70]"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <Link href={`/dashboard/projects/${project.id}`} className="flex items-center gap-3">
                                                <div className="w-16 h-10 rounded-md bg-gray-100 overflow-hidden flex-shrink-0">
                                                    {project.thumbnail_url ? (
                                                        <img src={project.thumbnail_url} alt={project.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <ImageIcon className="w-4 h-4 text-gray-300" />
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="font-medium text-gray-900 hover:text-[#0f7d70] transition-colors">{project.name}</span>
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1.5">
                                                {getVisibilityIcon(project.visibility)}
                                                <span className="text-sm text-gray-600 capitalize">{project.visibility}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <Eye className="w-3.5 h-3.5" /> {project.views_count}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Heart className="w-3.5 h-3.5" /> {project.likes_count}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500">
                                            {formatDate(project.created_at)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button className="p-1.5 hover:bg-gray-100 rounded-md">
                                                        <MoreVertical className="w-4 h-4 text-gray-500" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-white">
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/dashboard/projects/${project.id}`}>
                                                            <Eye className="w-4 h-4 mr-2" /> View
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/editor/${project.id}`}>
                                                            Edit
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        className="text-red-600 focus:text-red-600"
                                                        onClick={() => handleDeleteProject(project.id)}
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
