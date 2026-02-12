"use client";

import React, { useEffect, useRef, useMemo } from 'react';
import { useVirtualization } from '@/hooks/useVirtualization';
import { EntryCard } from './EntryCard';

interface VirtualizedEntryListProps {
    entries: any[];
    onEdit: (entry: any) => void;
    onDelete: (entry: any) => void;
    onStatusToggle: (entry: any) => void;
    currentUser: any;
    currentBook: any;
    itemHeight?: number;
    bufferSize?: number;
}

// 🚀 VIRTUALIZED ENTRY LIST: Handle 1000+ records efficiently
export const VirtualizedEntryList = React.memo(({
    entries,
    onEdit,
    onDelete,
    onStatusToggle,
    currentUser,
    currentBook,
    itemHeight = 60,
    bufferSize = 5
}: VirtualizedEntryListProps) => {
    // 🚀 VIRTUALIZATION CONFIG
    const virtualization = useVirtualization(entries, {
        itemHeight,
        bufferSize
    });

    // 🔄 LOAD MORE: Handle infinite scroll with loading
    const handleLoadMore = () => {
        // This will be called by the parent component
        // based on the isNearBottom state from virtualization
    };

    // 🎯 VIRTUAL LIST RENDERING: Only render visible items
    const renderVirtualList = () => {
        const { visibleItems, scrollElementRef, scrollToIndex, isNearBottom } = virtualization;
        
        return (
            <div className="relative">
                {/* Scroll container */}
                <div
                    ref={scrollElementRef}
                    className="h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100"
                    style={{ height: '600px' }}
                >
                    {/* Virtual list container */}
                    <div
                        className="relative"
                        style={{ height: `${entries.length * itemHeight}px` }}
                    >
                        {/* Visible items with absolute positioning */}
                        {visibleItems.map((entry, index) => {
                            const actualIndex = virtualization.startIndex + index;
                            const top = actualIndex * itemHeight;
                            
                            return (
                                <div
                                    key={entry._id || entry.localId}
                                    className="absolute left-0 right-0"
                                    style={{ top: `${top}px` }}
                                >
                                    <EntryCard
                                        entry={entry}
                                        onEdit={onEdit}
                                        onDelete={onDelete}
                                        onStatusToggle={onStatusToggle}
                                        currentUser={currentUser}
                                        currentBook={currentBook}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Load more indicator */}
                {isNearBottom && (
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center p-4">
                        <div className="bg-blue-600 text-white px-4 py-2 rounded-lg animate-pulse">
                            Loading more...
                        </div>
                    </div>
                )}

                {/* Scroll to top button */}
                <button
                    onClick={() => scrollToIndex(0)}
                    className="fixed bottom-4 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
                >
                    ↑
                </button>
            </div>
        );
    };

    return (
        <div className="space-y-2">
            {/* List info */}
            <div className="mb-4 p-4 bg-gray-100 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">
                        Showing {virtualization.visibleItems.length} of {entries.length} entries
                    </span>
                    <span className="text-sm text-gray-500">
                        (Items {virtualization.startIndex + 1}-{virtualization.endIndex + 1})
                    </span>
                </div>
            </div>

            {/* Virtual list */}
            {renderVirtualList()}
        </div>
    );
});
