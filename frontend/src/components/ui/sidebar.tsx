"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Home, User, Settings, Bell, Grid, PanelLeftClose, PanelLeftOpen, Search, Edit, Book } from "lucide-react";
import { cn } from "@/src/lib/utils";

const Sidebar = ({ children }: { children?: React.ReactNode }) => {
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

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
                        <SidebarContent isCollapsed={false} />
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
                    {!isCollapsed && <span className="font-bold text-lg truncate" style={{ color: '#0f7d70', fontFamily: 'Silver Garden, sans-serif' }}>MugShot Studio</span>}
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
                <div className="md:hidden flex items-center p-4 border-b border-gray-200 bg-white sticky top-0 z-20">
                    <button onClick={toggleMobileSidebar} className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
                        <PanelLeftOpen size={24} className="text-black" />
                    </button>
                    <span className="ml-2 font-bold" style={{ color: '#0f7d70', fontFamily: 'Silver Garden, sans-serif' }}>MugShot Studio</span>
                </div>
                <main className="flex-1 relative">
                    {children}
                </main>
            </div>
        </div>
    );
};

const SidebarContent = ({ isCollapsed }: { isCollapsed: boolean }) => {
    return (
        <div className="flex flex-col h-full py-4">
            <div className="px-3 mb-6 space-y-1">
                <SidebarItem icon={Edit} label="New chat" isCollapsed={isCollapsed} />
                <SidebarItem icon={Search} label="Search chats" isCollapsed={isCollapsed} />
                <SidebarItem icon={Grid} label="Library" isCollapsed={isCollapsed} />
            </div>

            <div className="flex-1 overflow-y-auto px-3 space-y-1">
                <SidebarItem icon={Home} label="Home" isCollapsed={isCollapsed} active />
                <SidebarItem icon={Grid} label="Templates" isCollapsed={isCollapsed} />
                <SidebarItem icon={Bell} label="Notifications" isCollapsed={isCollapsed} />
                <SidebarItem icon={Settings} label="Settings" isCollapsed={isCollapsed} />
            </div>

            <div className="px-3 mt-auto border-t border-gray-100 pt-4">
                <div className={cn("flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer", isCollapsed && "justify-center")}>
                    <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 shrink-0">
                        <User size={16} />
                    </div>
                    {!isCollapsed && (
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium truncate">User Account</p>
                            <button className="text-xs text-blue-500 hover:text-blue-700 font-medium mt-1">
                                View Profile
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const SidebarItem = ({ icon: Icon, label, isCollapsed, active }: { icon: any, label: string, isCollapsed: boolean, active?: boolean }) => {
    return (
        <button
            className={cn(
                "w-full flex items-center gap-3 p-2 rounded-lg transition-colors group relative",
                active ? "bg-gray-100 text-teal-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
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
        </button>
    );
};

export { Sidebar };
