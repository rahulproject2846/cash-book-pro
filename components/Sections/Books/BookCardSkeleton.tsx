"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/helpers';

export const BookCardSkeleton = ({ count = 1 }) => {
    const shimmer = {
        initial: { x: '-100%' },
        animate: { x: '100%' },
        transition: { repeat: Infinity, duration: 1.5, ease: "linear" as const }
    };

    const SkeletonCard = () => (
        <div className="group relative bg-[var(--bg-card)] apple-card border border-[var(--border)] p-5 md:p-8 overflow-hidden h-[210px] md:h-[280px] shadow-xl">
            {/* Real Shimmer Effect */}
            <motion.div 
                {...shimmer}
                className="absolute inset-0 z-10 bg-gradient-to-r from-transparent via-white/5 to-transparent"
            />
            <div className="flex justify-between items-start gap-2">
                <div className="space-y-3 flex-1">
                    <div className="w-12 h-4 bg-[var(--bg-app)] rounded-lg animate-pulse" />
                    <div className="w-3/4 h-6 bg-[var(--bg-app)] rounded-lg animate-pulse" />
                </div>
                <div className="w-12 h-12 md:w-16 md:h-16 bg-[var(--bg-app)] rounded-[20px] animate-pulse" />
            </div>
            <div className="mt-auto space-y-2">
                <div className="w-1/2 h-2 bg-[var(--bg-app)] rounded animate-pulse" />
                <div className="w-2/3 h-8 bg-[var(--bg-app)] rounded animate-pulse" />
            </div>
        </div>
    );

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-10 mt-2 md:mt-6 md:px-8 lg:px-10">
            {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
    );
};
