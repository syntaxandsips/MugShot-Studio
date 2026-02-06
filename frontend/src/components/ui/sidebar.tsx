"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
    Home,
    User,
    Settings,
    PanelLeftClose,
    PanelLeftOpen,
    Edit,
    LogOut,
    LayoutDashboard,
    FolderKanban,
    LayoutGrid,
    Image,
    Users,
    CreditCard,
    Sparkles,
    Zap
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { useAuth } from "@/src/context/auth-context";
import { ProfileModal } from "@/src/components/ui/profile-modal";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";

const Sidebar = ({ children }: { children?: React.ReactNode }) => {
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(true);

    const toggleMobileSidebar = () => setIsMobileOpen(!isMobileOpen);
    const toggleCollapse = () => setIsCollapsed(!isCollapsed);

    const sidebarWidth = isCollapsed ? "w-16" : "w-64";
    const mainContentMargin = isCollapsed ? "md:ml-16" : "md:ml-64";

    return (
        <div className="flex min-h-screen bg-white">
            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isMobileOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={toggleMobileSidebar}
                        className="md:hidden fixed inset-0 z-40 bg-black/50"
                    />
                )}
            </AnimatePresence>

            {/* Mobile Sidebar */}
            <AnimatePresence>
                {isMobileOpen && (
                    <motion.div
                        initial={{ x: "-100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "-100%" }}
                        transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                        className="md:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200"
                    >
                        <SidebarContent isCollapsed={false} onNavigate={() => setIsMobileOpen(false)} />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Desktop Sidebar */}
            <motion.div
                className={cn(
                    "hidden md:flex flex-col fixed inset-y-0 left-0 z-30 bg-white border-r border-gray-200 transition-all duration-300 ease-in-out",
                    sidebarWidth
                )}
            >
                <div className="flex items-center justify-between p-4 h-16 border-b border-gray-100">
                    {!isCollapsed && (
                        <Link href="/dashboard" className="font-bold text-lg truncate" style={{ color: '#0f7d70', fontFamily: 'Silver Garden, sans-serif' }}>
                            MugShot Studio
                        </Link>
                    )}
                    <button
                        onClick={toggleCollapse}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors ml-auto"
                        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        {isCollapsed ? <PanelLeftOpen size={20} className="text-black" /> : <PanelLeftClose size={20} className="text-black" />}
                    </button>
                </div>

                <SidebarContent isCollapsed={isCollapsed} />
            </motion.div>

            {/* Main Content */}
            <div className={cn("flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out", mainContentMargin)}>
                {/* Mobile Header */}
                <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-200 bg-white sticky top-0 z-20">
                    <div className="flex items-center">
                        <button onClick={toggleMobileSidebar} className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
                            <PanelLeftOpen size={24} className="text-black" />
                        </button>
                        <span className="ml-2 font-bold" style={{ color: '#0f7d70', fontFamily: 'Silver Garden, sans-serif' }}>MugShot Studio</span>
                    </div>
                </div>
                <main className="flex-1 relative">
                    {children}
                </main>
            </div>
        </div>
    );
};

const SidebarContent = ({ isCollapsed, onNavigate }: { isCollapsed: boolean; onNavigate?: () => void }) => {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const [profileModalOpen, setProfileModalOpen] = useState(false);

    const mainNavItems = [
        { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
        { icon: Edit, label: "Create", href: "/chat", highlight: true },
    ];

    const manageNavItems = [
        { icon: FolderKanban, label: "My Projects", href: "/dashboard/projects" },
        { icon: LayoutGrid, label: "Templates", href: "/dashboard/templates" },
        { icon: Image, label: "Assets", href: "/dashboard/assets" },
    ];

    const socialNavItems = [
        { icon: Users, label: "Community", href: "/community" },
    ];

    const accountNavItems = [
        { icon: CreditCard, label: "Billing", href: "/dashboard/billing" },
        { icon: Settings, label: "Settings", href: "/dashboard/settings" },
    ];

    const isActive = (href: string) => {
        if (href === "/dashboard") {
            return pathname === "/dashboard";
        }
        return pathname.startsWith(href);
    };

    const NavSection = ({ items, title }: { items: typeof mainNavItems; title?: string }) => (
        <div className="space-y-1">
            {!isCollapsed && title && (
                <p className="px-3 text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">{title}</p>
            )}
            {items.map((item) => (
                <SidebarItem
                    key={item.href}
                    icon={item.icon}
                    label={item.label}
                    href={item.href}
                    isCollapsed={isCollapsed}
                    active={isActive(item.href)}
                    highlight={item.highlight}
                    onClick={onNavigate}
                />
            ))}
        </div>
    );

    return (
        <div className="flex flex-col h-full py-4">
            {/* Main Navigation */}
            <div className="px-3 space-y-6">
                <NavSection items={mainNavItems} />

                {!isCollapsed && <div className="border-t border-gray-100" />}

                <NavSection items={manageNavItems} title={!isCollapsed ? "Manage" : undefined} />

                {!isCollapsed && <div className="border-t border-gray-100" />}

                <NavSection items={socialNavItems} title={!isCollapsed ? "Social" : undefined} />

                {!isCollapsed && <div className="border-t border-gray-100" />}

                <NavSection items={accountNavItems} title={!isCollapsed ? "Account" : undefined} />
            </div>

            {/* Credits Display */}
            {!isCollapsed && user && (
                <div className="px-3 mt-6">
                    <Link
                        href="/dashboard/billing"
                        className="flex items-center gap-3 p-3 bg-gradient-to-r from-[#0f7d70]/10 to-[#0f7d70]/5 rounded-xl hover:from-[#0f7d70]/15 hover:to-[#0f7d70]/10 transition-colors"
                    >
                        <div className="p-2 bg-[#0f7d70] rounded-lg">
                            <Zap size={16} className="text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500">Credits</p>
                            <p className="text-sm font-semibold text-[#0f7d70]">{user.credits?.toLocaleString() || 0}</p>
                        </div>
                    </Link>
                </div>
            )}

            <div className="flex-1" />

            {/* User Profile */}
            <div className="px-3 mt-auto border-t border-gray-100 pt-4">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <div className={cn("flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer", isCollapsed && "justify-center")}>
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0f7d70] to-[#0a5a52] flex items-center justify-center text-white shrink-0 overflow-hidden">
                                {user?.profile_photo_url ? (
                                    <img src={user.profile_photo_url} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-sm font-medium">{user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'U'}</span>
                                )}
                            </div>
                            {!isCollapsed && (
                                <div className="overflow-hidden text-left">
                                    <p className="text-sm font-medium truncate text-gray-900">{user?.full_name || 'User Account'}</p>
                                    <p className="text-xs text-gray-500 truncate">@{user?.username || 'username'}</p>
                                </div>
                            )}
                        </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-white border border-gray-200 text-gray-900" side="top">
                        <DropdownMenuLabel className="text-gray-900">My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-gray-200" />
                        <DropdownMenuItem onClick={() => setProfileModalOpen(true)} className="text-gray-700 focus:bg-gray-100 focus:text-gray-900">
                            <User className="mr-2 h-4 w-4" />
                            <span>Profile</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="text-gray-700 focus:bg-gray-100 focus:text-gray-900">
                            <Link href="/dashboard/settings">
                                <Settings className="mr-2 h-4 w-4" />
                                <span>Settings</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="text-gray-700 focus:bg-gray-100 focus:text-gray-900">
                            <Link href="/dashboard/billing">
                                <CreditCard className="mr-2 h-4 w-4" />
                                <span>Billing</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-gray-200" />
                        <DropdownMenuItem onClick={logout} className="text-red-600 focus:text-red-600 focus:bg-gray-100">
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Log out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <ProfileModal open={profileModalOpen} onOpenChange={setProfileModalOpen} />
        </div>
    );
};

interface SidebarItemProps {
    icon: any;
    label: string;
    href: string;
    isCollapsed: boolean;
    active?: boolean;
    highlight?: boolean;
    onClick?: () => void;
}

const SidebarItem = ({ icon: Icon, label, href, isCollapsed, active, highlight, onClick }: SidebarItemProps) => {
    return (
        <Link
            href={href}
            onClick={onClick}
            className={cn(
                "w-full flex items-center gap-3 p-2.5 rounded-lg transition-all group relative",
                active
                    ? "bg-[#0f7d70]/10 text-[#0f7d70]"
                    : highlight
                        ? "bg-[#0f7d70] text-white hover:bg-[#0c6a61] shadow-lg shadow-[#0f7d70]/20"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                isCollapsed && "justify-center"
            )}
            title={isCollapsed ? label : undefined}
        >
            <Icon size={20} className="shrink-0" />
            {!isCollapsed && (
                <span className="text-sm font-medium truncate">{label}</span>
            )}

            {/* Tooltip for collapsed state */}
            {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                    {label}
                </div>
            )}
        </Link>
    );
};

export { Sidebar };
