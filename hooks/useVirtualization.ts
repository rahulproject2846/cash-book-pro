"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

interface VirtualizationConfig {
    itemHeight: number;
    bufferSize: number;
    overscan: number;
}

interface VirtualItem {
    id: string;
    index: number;
    data: any;
}

interface UseVirtualizationReturn<T> {
    visibleItems: T[];
    totalItems: number;
    startIndex: number;
    endIndex: number;
    // ফিক্স: এখানে HTMLDivElement | null করে দেওয়া হয়েছে
    scrollElementRef: React.RefObject<HTMLDivElement | null>;
    scrollToIndex: (index: number) => void;
    loadMore: () => void;
    isNearBottom: boolean;
}

// 🚀 LITE VIRTUALIZATION: Handle 1000+ records with windowing
export const useVirtualization = <T extends any>(
    items: T[],
    config: VirtualizationConfig
): UseVirtualizationReturn<T> => {
    const [scrollTop, setScrollTop] = useState(0);
    const [isNearBottom, setIsNearBottom] = useState(false);
    const scrollElementRef = useRef<HTMLDivElement>(null);
    const [visibleRange, setVisibleRange] = useState({ start: 0, end: 0 });

    // 📊 Calculate visible range based on scroll position
    const calculateVisibleRange = useCallback((scrollTop: number) => {
        const { itemHeight, bufferSize } = config;
        
        const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - bufferSize);
        const endIndex = Math.min(
            items.length - 1,
            Math.ceil((scrollTop + window.innerHeight) / itemHeight) + bufferSize
        );
        
        return { start: startIndex, end: endIndex };
    }, [config.itemHeight, config.bufferSize, items.length]);

    // সর্টিং ফিক্স: যখনই items লিস্ট পরিবর্তন হবে (সর্টিং হবে), রেঞ্জ রিসেট হবে
    useEffect(() => {
        const initialRange = calculateVisibleRange(scrollTop);
        setVisibleRange(initialRange);
    }, [items, calculateVisibleRange]);

    // 🔄 SCROLL HANDLER: Optimized scroll handling
    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const newScrollTop = e.currentTarget.scrollTop;
        setScrollTop(newScrollTop);
        
        // Check if near bottom for loading more
        const { itemHeight } = config;
        const scrollHeight = e.currentTarget.scrollHeight;
        const clientHeight = e.currentTarget.clientHeight;
        const isNearBottom = newScrollTop + clientHeight >= scrollHeight - itemHeight * 2;
        setIsNearBottom(isNearBottom);
        
        // Update visible range
        const newRange = calculateVisibleRange(newScrollTop);
        setVisibleRange(newRange);
    }, [calculateVisibleRange, config.itemHeight, config.bufferSize]);

    // 🎯 VISIBLE ITEMS: Memoized calculation of visible items
    const visibleItems = useMemo(() => {
        const { start, end } = visibleRange;
        return items.slice(start, end + 1);
    }, [items, visibleRange]);

    // 📏 SCROLL TO INDEX: Convert scroll position to item index
    const scrollToIndex = useCallback((index: number) => {
        if (!scrollElementRef.current) return;
        
        const { itemHeight } = config;
        const targetScrollTop = Math.max(0, index * itemHeight - window.innerHeight / 2);
        
        scrollElementRef.current.scrollTo({
            top: targetScrollTop,
            behavior: 'smooth'
        });
        
        setScrollTop(targetScrollTop);
    }, [config.itemHeight]);

    // 🔄 LOAD MORE: Memoized load more function
    const loadMore = useCallback(() => {
        // This will be implemented by the parent component
        // based on the isNearBottom state
    }, []);

    // 📏 AUTO-SCROLL: Auto-scroll to maintain position when items change
    useEffect(() => {
        if (visibleRange.start > 0 && scrollElementRef.current) {
            const { itemHeight } = config;
            const targetScrollTop = visibleRange.start * itemHeight;
            
            // Only scroll if current position is significantly different
            if (Math.abs(scrollTop - targetScrollTop) > itemHeight * 2) {
                scrollElementRef.current.scrollTo({
                    top: targetScrollTop,
                    behavior: 'smooth'
                });
            }
        }
    }, [visibleRange.start, items.length, config.itemHeight]);

    // 🎯 BOTTOM DETECTION: Enhanced bottom detection
    useEffect(() => {
        const scrollElement = scrollElementRef.current;
        if (!scrollElement) return;

        const handleScroll = () => {
            const { itemHeight } = config;
            const scrollHeight = scrollElement.scrollHeight;
            const clientHeight = scrollElement.clientHeight;
            const currentScrollTop = scrollElement.scrollTop;
            
            // Enhanced bottom detection
            const isNearBottom = currentScrollTop + clientHeight >= scrollHeight - itemHeight * 3;
            setIsNearBottom(isNearBottom);
        };

        // Add scroll listener with passive option for better performance
        scrollElement.addEventListener('scroll', handleScroll, { passive: true });
        
        // Add resize listener
        const handleResize = () => {
            handleScroll();
        };
        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            scrollElement.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleResize);
        };
    }, [config.itemHeight]);

    return {
        visibleItems,
        totalItems: items.length,
        startIndex: visibleRange.start,
        endIndex: visibleRange.end,
        scrollElementRef,
        scrollToIndex,
        loadMore,
        isNearBottom
    };
};
