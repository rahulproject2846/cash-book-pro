"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useThemeTransition } from '@/hooks/useThemeTransition';

export const ThemeOverlay: React.FC = () => {
    const { theme } = useTheme();
    const { isTransitioning, coordinates, transitionDirection, animationDuration } = useThemeTransition();
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);
    if (!mounted || !isTransitioning || !coordinates) return null;

    const { x, y } = coordinates;
    const overlayColor = theme === 'dark' ? '#0a0a0a' : '#ffffff';

    /**
     * 🔮 GRAVITY-DRIVEN LIQUID VARIANTS
     * লজিক: এনিমেশন বড় হওয়ার সময় কেন্দ্রবিন্দু (y) কে নিচের দিকে ঠেলে দেওয়া হচ্ছে।
     * এতে ওপরের ২ কোণা আগে পূর্ণ না হয়ে নিচের দিকে তেল গড়িয়ে যাওয়ার ফিল তৈরি হবে।
     */
    const liquidVariants = {
        initial: {
            clipPath: transitionDirection === 'expand' 
                ? `circle(0% at ${x}px ${y}px)` 
                : `ellipse(250% 250% at ${x}px ${y + 500}px)`, // নিচে থেকে শুরু
            opacity: 0,
        },
        animate: {
            clipPath: transitionDirection === 'expand'
                ? `ellipse(200% 250% at ${x}px ${y + 800}px)` // মাধ্যাকর্ষণ টানে কেন্দ্র নিচে নামছে
                : `circle(0% at ${x}px ${y}px)`,
            opacity: 1,
        },
        exit: {
            opacity: 0,
            transition: { duration: 1 }
        }
    };

    return (
        <AnimatePresence>
            {isTransitioning && (
                <motion.div
                    key="gravity-oil-overlay"
                    variants={liquidVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{
                        duration: animationDuration / 1000,
                        ease: [0.8, 0, 0.1, 1], // Viscous Easing
                    }}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 999999,
                        backgroundColor: overlayColor,
                        pointerEvents: 'none',
                        willChange: 'clip-path',
                        transform: 'translateZ(0)',
                        // 🌑 সলিড বর্ডার শেডো যা তেলের ঘনত্ব বোঝাবে
                        boxShadow: 'inset 0 0 150px rgba(0,0,0,0.8)',
                    }}
                />
            )}
        </AnimatePresence>
    );
};

export default ThemeOverlay;
