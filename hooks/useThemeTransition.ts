import { useCallback, useRef, useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { getDevicePerformance, getAnimationDuration } from '@/lib/utils/deviceUtils';

export const useThemeTransition = () => {
    const { theme, setTheme } = useTheme();
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [coordinates, setCoordinates] = useState<{x: number, y: number} | null>(null);
    const [transitionDirection, setTransitionDirection] = useState<'expand' | 'contract'>('expand');
    
    const DURATION = 400; // 🕒 ৪০ সেকেন্ডের সলিড লক

    const executeThemeTransition = useCallback((event: React.MouseEvent | MouseEvent) => {
        const target = event.currentTarget as HTMLElement;
        const rect = target.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;

        setCoordinates({ x, y });
        const nextTheme = theme === 'dark' ? 'light' : 'dark';
        
        // 🎯 DIRECTION: ডার্ক মোডে তেল গড়িয়ে পড়বে (Expand), লাইট মোডে ফেরত যাবে (Contract)।
        setTransitionDirection(nextTheme === 'dark' ? 'expand' : 'contract');
        
        setIsTransitioning(true);

        // 🕒 ৪০ সেকেন্ড অপেক্ষা করো (তেল গড়িয়ে পড়ার সময়)
        setTimeout(() => {
            // ৩. তেল যখন পুরো স্ক্রিন ঢেকে ফেলেছে, তখন সাইলেন্টলি থিম বদলে দাও
            setTheme(nextTheme);
            // ৪. এরপর ট্রানজিশন স্টেট বন্ধ করো
            setIsTransitioning(false);
        }, DURATION);
    }, [theme, setTheme]);

    return {
        isTransitioning,
        coordinates,
        transitionDirection,
        animationDuration: DURATION,
        executeThemeTransition
    };
};
