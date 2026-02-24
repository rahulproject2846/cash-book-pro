"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Book, BarChart2, Settings, LogOut, ChevronLeft, ChevronRight, 
    History
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';
import { cn } from '@/lib/utils/helpers';
import { useVaultStore } from '@/lib/vault/store';

// --- Types ---
interface SidebarProps {
    collapsed: boolean;
    setCollapsed: (collapsed: boolean) => void;
    activeSection: string;
    setActiveSection: (section: string) => void;
    isMobile: boolean;
    isDrawerOpen: boolean;
    setIsDrawerOpen: (open: boolean) => void;
    isCompact?: boolean;
}

const NAV_ITEMS = [
    { id: 'books', name: 'nav_dashboard', icon: Book },
    { id: 'reports', name: 'nav_analytics', icon: BarChart2 },
    { id: 'timeline', name: 'nav_timeline', icon: History },
    { id: 'settings', name: 'nav_system', icon: Settings },
] as const;

// --- Sidebar Component (Native Apple Standard) ---
export const Sidebar = ({ 
    collapsed, 
    setCollapsed, 
    activeSection, 
    setActiveSection, 
    isMobile, 
    isDrawerOpen, 
    setIsDrawerOpen,
    isCompact 
}: SidebarProps) => {
    const { t } = useTranslation();
    const { activeBook, clearActiveBook } = useVaultStore();
    const router = useRouter();
    
    const handleLogout = () => {
        const { orchestrator } = require('@/lib/vault/core/SyncOrchestrator');
        orchestrator.logout();
    };
    
    const handleNavClick = (section: string) => {
        setActiveSection(section); // Keep existing state sync
        router.push(`?tab=${section}`); // 🆕 Sync URL with active section
        if (activeBook) clearActiveBook(); // Keep existing cleanup
        if (isMobile) setIsDrawerOpen(false); // Close drawer on mobile nav
        
        // 🆕 DECOUPLED NAVIGATION: No store refresh triggers
        // Let the persistent component architecture handle data persistence
    };

    // 🎯 Apple Spring Variants
    const sidebarVariants = {
        expanded: { width: 280 },
        collapsed: { width: 90 },
        mobileOpen: { x: 0 },
        mobileClosed: { x: -320 }
    };

    const contentVariants = {
        expanded: {
            opacity: 1,
            x: 0,
            transition: {
                opacity: { delay: 0.1, duration: 0.2 },
                x: { delay: 0.1, duration: 0.3 }
            }
        },
        collapsed: {
            opacity: 0,
            x: -20,
            transition: {
                opacity: { duration: 0.1 },
                x: { duration: 0.2 }
            }
        }
    };

    const iconVariants = {
        expanded: {
            scale: 1,
            transition: { duration: 0.2 }
        },
        collapsed: {
            scale: 0.85,
            transition: { duration: 0.2 }
        }
    };

    // 🎯 Animation State
    const getAnimationState = () => {
        if (isMobile) {
            return isDrawerOpen ? "mobileOpen" : "mobileClosed";
        }
        return collapsed ? "collapsed" : "expanded";
    };

    return (
        <>
            {/* Mobile Backdrop */}
            <AnimatePresence>
                {isMobile && isDrawerOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-[699]"
                        onClick={() => setIsDrawerOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar Container */}
            <motion.div 
                variants={sidebarVariants}
                animate={getAnimationState()}
                className={cn(
                    "flex flex-col h-screen sidebar-mask",
                    "border-r border-(--border) bg-(--bg-card)/95 backdrop-blur-md",
                    // 🎯 GRID FIX: Desktop sidebar is NOT fixed, mobile drawer IS fixed
                    isMobile 
                        ? "fixed left-0 top-0 z-[200] w-[var(--sidebar-mobile)]" 
                        : "relative z-[200]"
                )}
                style={{
                    width: isMobile ? 'var(--sidebar-mobile)' : undefined
                }}
            >
                {/* Header - Fixed Logo Container */}
                <div className="h-28 flex items-center border-b border-(--border) relative">
                    {/* 🎯 RESTORED COLLAPSE BUTTON */}
                    {!isMobile && (
                        <button
                            onClick={() => setCollapsed(!collapsed)}
                            className={cn(
                                "absolute top-4 right-4 z-[110] transition-all duration-200",
                                "text-white shadow-xl hover:scale-110 active:scale-90",
                                "w-8 h-8 apple-card bg-orange-500 flex items-center justify-center"
                            )}
                        >
                            {collapsed ? <ChevronRight size={14} strokeWidth={3} /> : <ChevronLeft size={14} strokeWidth={3} />}
                        </button>
                    )}
                    
                    {/* Logo - Always Centered, Never Moves */}
                    <div className="absolute left-1/2 -translate-x-1/2">
                        <motion.div variants={iconVariants}>
                            <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-orange-600 apple-card flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-orange-500/30">
                                V
                            </div>
                        </motion.div>
                    </div>
                    
                    {/* Text - Animate Presence */}
                    <AnimatePresence>
                        {(!collapsed || isMobile) && (
                            <motion.div
                                variants={contentVariants}
                                initial="collapsed"
                                animate="expanded"
                                exit="collapsed"
                                className={cn("pl-8", isMobile && "pl-8")}
                            >
                                <h1 className="text-xl font-black uppercase italic text-(--text-main) tracking-tighter">
                                    {t('vault_pro_split_1')}<span className="text-orange-500">{t('vault_pro_split_2')}</span>
                                </h1>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Navigation Items */}
                <div className="flex-1 py-10 px-4 space-y-2 overflow-y-auto no-scrollbar">
                    {NAV_ITEMS.map((item) => {
                        const isActive = activeSection === item.id;
                        const navBtn = (
                            <button 
                                key={item.id} 
                                onClick={() => handleNavClick(item.id)} 
                                className={cn(
                                    "w-full flex items-center h-14 transition-all duration-200 group relative",
                                    collapsed 
                                        ? "justify-center apple-card px-0" 
                                        : "px-5 apple-card gap-4 justify-start",
                                    isActive 
                                        ? "bg-orange-500 text-white shadow-md shadow-orange-500/20" 
                                        : "text-(--text-muted) hover:bg-(--bg-app) hover:text-(--text-main)"
                                )}
                            >
                                <motion.div variants={iconVariants}>
                                    <item.icon size={isCompact ? 18 : 22} strokeWidth={isActive ? 2.5 : 2} />
                                </motion.div>
                                <AnimatePresence>
                                    {(!collapsed || isMobile) && (
                                        <motion.span
                                            variants={contentVariants}
                                            initial="collapsed"
                                            animate="expanded"
                                            exit="collapsed"
                                            className="text-[11px] font-black uppercase tracking-[3px]"
                                        >
                                            {t(item.name)}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                                {isActive && collapsed && <div className="absolute left-2 w-1 h-6 bg-white rounded-full opacity-50" />}
                            </button>
                        );
                        return collapsed ? <Tooltip key={item.id} text={t(item.name)} position="right">{navBtn}</Tooltip> : navBtn;
                    })}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-(--border)">
                    <button onClick={handleLogout} className={cn("flex items-center h-12 text-red-500 hover:bg-red-500/10 apple-card transition-all", collapsed ? "justify-center" : "px-4 gap-4 w-full")}>
                        <motion.div variants={iconVariants}>
                            <LogOut size={20} strokeWidth={2.5} /> 
                        </motion.div>
                        <AnimatePresence>
                            {(!collapsed || isMobile) && (
                                <motion.span
                                    variants={contentVariants}
                                    initial="collapsed"
                                    animate="expanded"
                                    exit="collapsed"
                                    className="text-[10px] font-black uppercase tracking-widest"
                                >
                                    {t('nav_signout')}
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </button>
                </div>
            </motion.div>
        </>
    );
};
