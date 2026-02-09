"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils/helpers'; // তোর নতুন cn utility

interface TooltipProps {
    text: string;
    children: React.ReactNode;
    position?: 'top' | 'bottom' | 'left' | 'right';
    className?: string;
}

export const Tooltip = ({ text, children, position = 'top', className }: TooltipProps) => {
    const [isVisible, setIsVisible] = useState(false);

    // যদি টেক্সট না থাকে, তবে শুধু চিলড্রেন রেন্ডার করবে
    if (!text) return <>{children}</>;

    // পজিশন অনুযায়ী ডাইনামিক ক্লাস (Pill Logic)
    const positionClasses = {
        top: "bottom-full left-1/2 -translate-x-1/2 mb-3",
        bottom: "top-full left-1/2 -translate-x-1/2 mt-3",
        left: "right-full top-1/2 -translate-y-1/2 mr-3",
        right: "left-full top-1/2 -translate-y-1/2 ml-3",
    };

    // অ্যারো (Arrow) পজিশন লজিক
    const arrowClasses = {
        top: "-bottom-1 left-1/2 -translate-x-1/2 border-r border-b",
        bottom: "-top-1 left-1/2 -translate-x-1/2 border-l border-t",
        left: "-right-1 top-1/2 -translate-y-1/2 border-r border-t",
        right: "-left-1 top-1/2 -translate-y-1/2 border-l border-b",
    };

    return (
        <div 
            className={cn("relative inline-flex items-center justify-center", className)}
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
            onClick={() => setIsVisible(false)}
        >
            {children}
            
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: position === 'top' ? 10 : -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className={cn("absolute z-[9999] pointer-events-none", positionClasses[position])}
                    >
                        <div className={cn(
                            "relative bg-black/90 text-white backdrop-blur-xl",
                            "px-4 py-2 rounded-full border border-white/10 shadow-2xl",
                            "whitespace-nowrap flex items-center justify-center"
                        )}>
                            <span className="text-[10px] font-black uppercase tracking-[2px] leading-none">
                                {text}
                            </span>

                            {/* Apple Style Tiny Arrow */}
                            <div className={cn(
                                "absolute w-2.5 h-2.5 bg-black/90 border-white/10 rotate-45",
                                arrowClasses[position]
                            )} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};