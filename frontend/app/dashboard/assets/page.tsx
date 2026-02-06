'use client';

import { useState, useEffect, useRef } from 'react';
import { assetsApi, type Asset } from '@/src/lib/api';
import {
    Upload,
    Search,
    Grid3X3,
    List,
    Trash2,
    Download,
    Star,
    StarOff,
    MoreVertical,
    Loader2,
    Image as ImageIcon,
    FileVideo,
    FileAudio,
    File,
    Filter,
    ChevronDown,
    FolderPlus,
    X,
    Copy,
    ExternalLink
} from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu';
import { toast } from '../../../src/hooks/use-toast';

type ViewMode = 'grid' | 'list';
type AssetType = 'all' | 'images' | 'videos' | 'audio' | 'other';

export default function AssetsPage() {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<AssetType>('all');
    const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
    const [showFavorites, setShowFavorites] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchAssets();
    }, [showFavorites]);

    const fetchAssets = async () => {
        try {
            const data = showFavorites
                ? await assetsApi.getFavorites()
                : await assetsApi.getAll();
            setAssets(data.items);
        } catch (error) {
            console.error('Failed to fetch assets:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsUploading(true);
        const uploadPromises = Array.from(files).map(async (file) => {
            try {
                const asset = await assetsApi.upload(file);
                return asset;
            } catch (error) {
                console.error('Failed to upload file:', file.name, error);
                return null;
            }
        });

        const results = await Promise.all(uploadPromises);
        const successfulUploads = results.filter((r): r is Asset => r !== null);

        if (successfulUploads.length > 0) {
            setAssets([...successfulUploads, ...assets]);
            toast({
                title: 'Upload Complete',
                description: `Successfully uploaded ${successfulUploads.length} file(s)`,
            });
        }

        setIsUploading(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleDelete = async (assetId: string) => {
        if (!confirm('Are you sure you want to delete this asset?')) return;

        try {
            await assetsApi.delete(assetId);
            setAssets(assets.filter(a => a.id !== assetId));
            toast({ title: 'Asset deleted' });
        } catch (error) {
            console.error('Failed to delete asset:', error);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedAssets.size === 0) return;
        if (!confirm(`Are you sure you want to delete ${selectedAssets.size} assets?`)) return;

        try {
            await assetsApi.bulkDelete(Array.from(selectedAssets));
            setAssets(assets.filter(a => !selectedAssets.has(a.id)));
            setSelectedAssets(new Set());
            toast({ title: 'Assets deleted', description: `${selectedAssets.size} assets deleted` });
        } catch (error) {
            console.error('Failed to delete assets:', error);
        }
    };

    const handleToggleFavorite = async (asset: Asset) => {
        try {
            if (asset.is_favorite) {
                await assetsApi.unfavorite(asset.id);
            } else {
                await assetsApi.favorite(asset.id);
            }
            setAssets(assets.map(a =>
                a.id === asset.id ? { ...a, is_favorite: !a.is_favorite } : a
            ));
        } catch (error) {
            console.error('Failed to toggle favorite:', error);
        }
    };

    const copyAssetUrl = (url: string) => {
        navigator.clipboard.writeText(url);
        toast({ title: 'URL copied to clipboard' });
    };

    const getAssetIcon = (type: string) => {
        if (type.startsWith('image/')) return <ImageIcon className="w-6 h-6" />;
        if (type.startsWith('video/')) return <FileVideo className="w-6 h-6" />;
        if (type.startsWith('audio/')) return <FileAudio className="w-6 h-6" />;
        return <File className="w-6 h-6" />;
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const filteredAssets = assets.filter(asset => {
        if (searchQuery && !asset.filename.toLowerCase().includes(searchQuery.toLowerCase())) {
            return false;
        }
        if (filterType === 'images' && !asset.mime_type.startsWith('image/')) return false;
        if (filterType === 'videos' && !asset.mime_type.startsWith('video/')) return false;
        if (filterType === 'audio' && !asset.mime_type.startsWith('audio/')) return false;
        if (filterType === 'other' && (
            asset.mime_type.startsWith('image/') ||
            asset.mime_type.startsWith('video/') ||
            asset.mime_type.startsWith('audio/')
        )) return false;
        return true;
    });

    const toggleSelection = (assetId: string) => {
        const newSelected = new Set(selectedAssets);
        if (newSelected.has(assetId)) {
            newSelected.delete(assetId);
        } else {
            newSelected.add(assetId);
        }
        setSelectedAssets(newSelected);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Asset Library</h1>
                        <p className="text-gray-600 mt-1">Manage your uploaded images, videos, and files</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            onChange={handleUpload}
                            className="hidden"
                            accept="image/*,video/*,audio/*"
                        />
                        <Button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="bg-[#0f7d70] hover:bg-[#0c6a61] text-white shadow-lg shadow-[#0f7d70]/20"
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4 mr-2" />
                                    Upload Files
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6 shadow-sm">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                placeholder="Search assets..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 border-gray-200 focus:border-[#0f7d70] focus:ring-[#0f7d70]/20"
                            />
                        </div>

                        {/* Filters */}
                        <div className="flex items-center gap-3">
                            {/* Type Filter */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="border-gray-200">
                                        <Filter className="w-4 h-4 mr-2" />
                                        {filterType === 'all' ? 'All Types' : filterType}
                                        <ChevronDown className="w-4 h-4 ml-2" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="bg-white">
                                    <DropdownMenuItem onClick={() => setFilterType('all')}>All Types</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setFilterType('images')}>
                                        <ImageIcon className="w-4 h-4 mr-2" /> Images
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setFilterType('videos')}>
                                        <FileVideo className="w-4 h-4 mr-2" /> Videos
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setFilterType('audio')}>
                                        <FileAudio className="w-4 h-4 mr-2" /> Audio
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setFilterType('other')}>
                                        <File className="w-4 h-4 mr-2" /> Other
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {/* Favorites Toggle */}
                            <Button
                                variant={showFavorites ? 'default' : 'outline'}
                                className={showFavorites ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'border-gray-200'}
                                onClick={() => setShowFavorites(!showFavorites)}
                            >
                                <Star className={`w-4 h-4 mr-2 ${showFavorites ? 'fill-white' : ''}`} />
                                Favorites
                            </Button>

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
                            {selectedAssets.size > 0 && (
                                <Button
                                    variant="outline"
                                    className="border-red-200 text-red-600 hover:bg-red-50"
                                    onClick={handleBulkDelete}
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete ({selectedAssets.size})
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Assets Grid/List */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-[#0f7d70]" />
                    </div>
                ) : filteredAssets.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                        <Upload className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            {searchQuery || filterType !== 'all' || showFavorites ? 'No assets found' : 'No assets yet'}
                        </h3>
                        <p className="text-gray-600 mb-6">
                            {searchQuery || filterType !== 'all' || showFavorites
                                ? 'Try adjusting your search or filters'
                                : 'Upload your first asset to get started'}
                        </p>
                        {!searchQuery && filterType === 'all' && !showFavorites && (
                            <Button
                                onClick={() => fileInputRef.current?.click()}
                                className="bg-[#0f7d70] hover:bg-[#0c6a61] text-white"
                            >
                                <Upload className="w-4 h-4 mr-2" />
                                Upload Files
                            </Button>
                        )}
                    </div>
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {filteredAssets.map((asset) => (
                            <div
                                key={asset.id}
                                className={`group relative bg-white rounded-xl border overflow-hidden transition-all hover:shadow-lg ${selectedAssets.has(asset.id) ? 'border-[#0f7d70] ring-2 ring-[#0f7d70]/20' : 'border-gray-100 hover:border-[#0f7d70]'
                                    }`}
                            >
                                {/* Thumbnail */}
                                <div className="aspect-square bg-gray-100 relative overflow-hidden">
                                    {asset.mime_type.startsWith('image/') ? (
                                        <img
                                            src={asset.url}
                                            alt={asset.filename}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-50">
                                            {getAssetIcon(asset.mime_type)}
                                        </div>
                                    )}

                                    {/* Selection Checkbox */}
                                    <div
                                        className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => toggleSelection(asset.id)}
                                    >
                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition-colors ${selectedAssets.has(asset.id)
                                                ? 'bg-[#0f7d70] border-[#0f7d70]'
                                                : 'bg-white/80 border-gray-300 hover:border-[#0f7d70]'
                                            }`}>
                                            {selectedAssets.has(asset.id) && (
                                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </div>
                                    </div>

                                    {/* Favorite Button */}
                                    <button
                                        className="absolute top-2 right-2 p-1.5 bg-white/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                                        onClick={() => handleToggleFavorite(asset)}
                                    >
                                        {asset.is_favorite ? (
                                            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                        ) : (
                                            <StarOff className="w-4 h-4 text-gray-400" />
                                        )}
                                    </button>

                                    {/* Actions Overlay */}
                                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="flex items-center justify-center gap-1">
                                            <button
                                                className="p-1.5 text-white hover:bg-white/20 rounded-md transition-colors"
                                                onClick={() => copyAssetUrl(asset.url)}
                                            >
                                                <Copy className="w-4 h-4" />
                                            </button>
                                            <a
                                                href={asset.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-1.5 text-white hover:bg-white/20 rounded-md transition-colors"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </a>
                                            <button
                                                className="p-1.5 text-white hover:bg-red-500/50 rounded-md transition-colors"
                                                onClick={() => handleDelete(asset.id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="p-3">
                                    <p className="text-sm font-medium text-gray-900 truncate">{asset.filename}</p>
                                    <p className="text-xs text-gray-500">{formatFileSize(asset.size)}</p>
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
                                            checked={selectedAssets.size === filteredAssets.length && filteredAssets.length > 0}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedAssets(new Set(filteredAssets.map(a => a.id)));
                                                } else {
                                                    setSelectedAssets(new Set());
                                                }
                                            }}
                                            className="rounded border-gray-300 text-[#0f7d70] focus:ring-[#0f7d70]"
                                        />
                                    </th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">File</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded</th>
                                    <th className="w-12"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredAssets.map((asset) => (
                                    <tr key={asset.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedAssets.has(asset.id)}
                                                onChange={() => toggleSelection(asset.id)}
                                                className="rounded border-gray-300 text-[#0f7d70] focus:ring-[#0f7d70]"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                                                    {asset.mime_type.startsWith('image/') ? (
                                                        <img src={asset.url} alt={asset.filename} className="w-full h-full object-cover" />
                                                    ) : (
                                                        getAssetIcon(asset.mime_type)
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-gray-900 truncate max-w-xs">{asset.filename}</span>
                                                    {asset.is_favorite && <Star className="w-4 h-4 text-amber-500 fill-amber-500 flex-shrink-0" />}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{asset.mime_type.split('/')[1]?.toUpperCase()}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{formatFileSize(asset.size)}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500">
                                            {new Date(asset.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button className="p-1.5 hover:bg-gray-100 rounded-md">
                                                        <MoreVertical className="w-4 h-4 text-gray-500" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-white">
                                                    <DropdownMenuItem onClick={() => copyAssetUrl(asset.url)}>
                                                        <Copy className="w-4 h-4 mr-2" /> Copy URL
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild>
                                                        <a href={asset.url} target="_blank" rel="noopener noreferrer">
                                                            <ExternalLink className="w-4 h-4 mr-2" /> Open
                                                        </a>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleToggleFavorite(asset)}>
                                                        {asset.is_favorite ? (
                                                            <><StarOff className="w-4 h-4 mr-2" /> Unfavorite</>
                                                        ) : (
                                                            <><Star className="w-4 h-4 mr-2" /> Favorite</>
                                                        )}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        className="text-red-600 focus:text-red-600"
                                                        onClick={() => handleDelete(asset.id)}
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
