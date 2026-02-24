"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils/helpers';

// 🎯 BOOK CARD SKELETON - Theme-Aware Loading State
interface BookCardSkeletonProps {
    count?: number;
}

export const BookCardSkeleton: React.FC<BookCardSkeletonProps> = ({ count = 1 }) => {
    const { theme } = useTheme();
    
    // 🎨 THEME-AWARE SHIMMER COLORS
    const getShimmerColors = () => {
        switch (theme) {
            case 'light':
                return {
                    bg: 'bg-gray-100',
                    shimmer: 'bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100',
                    border: 'border-gray-200',
                    text: 'text-gray-300'
                };
            case 'dark':
                return {
                    bg: 'bg-gray-800',
                    shimmer: 'bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800',
                    border: 'border-gray-700',
                    text: 'text-gray-600'
                };
            case 'midnight':
                return {
                    bg: 'bg-black',
                    shimmer: 'bg-gradient-to-r from-black via-gray-900 to-black',
                    border: 'border-gray-900',
                    text: 'text-gray-800'
                };
            default:
                return {
                    bg: 'bg-gray-100',
                    shimmer: 'bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100',
                    border: 'border-gray-200',
                    text: 'text-gray-300'
                };
        }
    };

    const colors = getShimmerColors();

    // 🎯 SINGLE SKELETON CARD
    const SkeletonCard = () => (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className={cn(
                "group relative bg-[var(--bg-card)] apple-card border border-[var(--border)]",
                "p-5 md:p-8 cursor-pointer overflow-hidden flex flex-col h-[210px] md:h-[280px]",
                "transition-all duration-500 shadow-xl relative z-30"
            )}
        >
            {/* Background Studio Decor */}
            <div className="absolute -right-4 -top-4 md:-right-6 md:-top-6 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity rotate-12 pointer-events-none">
                <div className="w-[130px] md:w-[160px] h-[130px] md:h-[160px] bg-gray-300 rounded-lg" />
            </div>

            {/* Header: Identity & Icon */}
            <div className="flex justify-between items-start relative z-10 gap-2">
                <div className="flex flex-col gap-1 md:gap-1.5 min-w-0 flex-1">
                    {/* ID Badge Skeleton */}
                    <div className={cn(
                        "w-fit h-[18px] px-2 py-1 rounded-lg border animate-pulse",
                        colors.bg, colors.border
                    )}>
                        <div className="w-8 h-[8px] bg-gray-300 rounded"></div>
                    </div>
                    
                    {/* Title Skeleton */}
                    <div className="space-y-2">
                        <div className={cn(
                            "h-[15px] md:h-[24px] w-3/4 rounded animate-pulse",
                            colors.bg
                        )}></div>
                    </div>
                </div>
                
                {/* Image Container Skeleton */}
                <div className={cn(
                    "w-10 h-10 md:w-16 md:h-16 apple-card shrink-0 shadow-inner",
                    "flex items-center justify-center overflow-hidden",
                    colors.bg, colors.border
                )}>
                    <div className={cn(
                        "w-full h-full rounded animate-pulse",
                        colors.shimmer
                    )}></div>
                </div>
            </div>

            {/* Financial Stats Area */}
            <div className="mt-auto relative z-10 space-y-0.5 md:space-y-1">
                {/* Net Asset Label */}
                <div className={cn(
                    "h-[7px] md:h-[9px] w-1/2 rounded animate-pulse",
                    colors.bg
                )}></div>
                
                {/* Balance Skeleton */}
                <div className="flex items-baseline gap-1">
                    <div className={cn(
                        "h-[22px] md:h-[28px] w-4 rounded animate-pulse",
                        colors.bg
                    )}></div>
                    <div className={cn(
                        "h-[22px] md:h-[28px] w-16 rounded animate-pulse",
                        colors.bg
                    )}></div>
                </div>
            </div>

            {/* Footer Actions & Metadata */}
            <div className="mt-4 md:mt-6 pt-4 md:pt-5 border-t border-[var(--border)]/50 flex justify-between items-center relative z-10">
                <div className="flex flex-col gap-0.5 md:gap-1">
                    {/* Last Updated Label */}
                    <div className={cn(
                        "h-[6px] md:h-[7px] w-3/4 rounded animate-pulse",
                        colors.bg
                    )}></div>
                    
                    {/* Time Skeleton */}
                    <div className="flex items-center gap-1.5">
                        <div className={cn(
                            "w-2.5 h-2.5 md:w-2.5 md:h-2.5 rounded-full animate-pulse",
                            colors.bg
                        )}></div>
                        <div className={cn(
                            "h-[9px] md:h-[11px] w-12 rounded animate-pulse",
                            colors.bg
                        )}></div>
                    </div>
                </div>

                {/* Quick Add Button Skeleton */}
                <div className={cn(
                    "w-9 h-9 md:w-12 md:h-12 apple-card",
                    "flex items-center justify-center animate-pulse",
                    colors.bg, colors.border
                )}>
                    <div className="w-5 h-5 bg-gray-300 rounded"></div>
                </div>
            </div>
        </motion.div>
    );

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-10 mt-2 md:mt-6 md:px-8 lg:px-10">
            {Array.from({ length: count }).map((_, index) => (
                <SkeletonCard key={`skeleton-${index}`} />
            ))}
        </div>
    );
};

BookCardSkeleton.displayName = 'BookCardSkeleton';
