"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils/helpers';

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

    // পজিশন অনুযায়ী ডাইনামিক ক্লাস (Native Floating Logic)
    const positionClasses = {
        top: "bottom-full left-1/2 -translate-x-1/2 mb-3",
        bottom: "top-full left-1/2 -translate-x-1/2 mt-3",
        left: "right-full top-1/2 -translate-y-1/2 mr-3",
        right: "left-full top-1/2 -translate-y-1/2 ml-3",
    };

    // অ্যারো (Arrow) পজিশন লজিক - Apple Style Subtle Arrow
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
                        initial={{ opacity: 0, scale: 0.9, y: position === 'top' ? 8 : -8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: position === 'top' ? 8 : -8 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        className={cn(
                            "absolute z-[var(--z-modal)] px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-white whitespace-nowrap apple-card bg-black/80 backdrop-blur-md pointer-events-none shadow-2xl",
                            positionClasses[position]
                        )}
                    >
                        {text}

                        {/* Apple Style Tiny Arrow */}
                        <div className={cn(
                            "absolute w-2 h-2 bg-black/80 rotate-45 border-[var(--border)]",
                            arrowClasses[position]
                        )} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};