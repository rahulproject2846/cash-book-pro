"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { 
    Layers, BookOpen, Calendar, Edit3, 
    MoreHorizontal, Settings, Plus, Trash2,
    X, CheckCircle2, AlertTriangle, Clock, ImageIcon, Loader2, CloudOff
} from 'lucide-react';

import { cn } from '@/lib/utils/helpers';
import { useTranslation } from '@/hooks/useTranslation';
import { useModal } from '@/context/ModalContext';
import { useLocalPreview } from '@/hooks/useLocalPreview';
import { useVaultStore } from '@/lib/vault/store';
import { db } from '@/lib/offlineDB';

interface BookCardProps {
    book: any;
    onEdit: (book: any) => void;
    onDelete: (book: any) => void;
    onOpen: (book: any) => void;
    currentUser: any;
}

// 🚀 OPTIMIZED BOOK CARD: Memoized to prevent unnecessary re-renders
export const BookCard = React.memo(({ book, onEdit, onDelete, onOpen, currentUser }: BookCardProps) => {
    const { t } = useTranslation();
    const { openModal } = useModal();
    
    // 🎯 IMAGE STATE MANAGEMENT - URL FIRST PRIORITY
    const isHttpImage = book.image?.startsWith('http');
    const displayImage = isHttpImage ? book.image : (book.image || book.mediaCid);
    const { previewUrl, isLoading, error: previewError } = useLocalPreview(displayImage);
    
    // 🎯 IMAGE STATE LOGIC
    const isCidImage = displayImage && displayImage.startsWith('cid_');
    const isLoaded = (isHttpImage || (isCidImage && previewUrl)) && !isLoading;
    const hasError = previewError && isCidImage;
    
    // 🎯 STABLE PROPS: Memoize based on stable identifiers
    const bookId = book._id || book.localId;
    const stableProps = React.useMemo(() => ({
        bookId: book._id || book.localId,
        bookVKey: book.vKey,
        bookUpdatedAt: book.updatedAt,
        bookName: book.name,
        bookDescription: book.description,
        bookColor: book.color,
        bookIsDeleted: Number(book.isDeleted || 0),
        bookSynced: book.synced,
        bookSyncAttempts: book.syncAttempts,
        bookEntryCount: book.entryCount,
        bookCreatedAt: book.createdAt,
        bookConflicted: book.conflicted,        // 🚨 CONFLICT TRACKING: 0 = no conflict, 1 = conflict detected
        bookConflictReason: book.conflictReason   // 🚨 CONFLICT REASON: "VERSION_CONFLICT", "MERGE_CONFLICT", etc.
    }), [
        book._id || book.localId,
        book.vKey,
        book.updatedAt,
        book.name,
        book.description,
        book.color,
        book.isDeleted,
        book.synced,
        book.syncAttempts,
        book.entryCount,
        book.createdAt,
        book.conflicted,
        book.conflictReason
    ]);

    // 🔄 EVENT HANDLERS: Memoized to prevent function recreation on every render
    const handleEdit = React.useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onEdit(book);
    }, [onEdit, book]);

    const handleDelete = React.useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete(book);
    }, [onDelete, book]);

    const handleOpen = React.useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onOpen(book);
    }, [onOpen, book]);

    // 🛡️ CONFLICT RESOLUTION: Handle conflict modal opening
    const handleConflictResolution = React.useCallback(async () => {
        if (!book.conflicted) return;
        
        openModal('conflictResolver', {
            record: book,
            type: 'book',
            onResolve: async (resolution: 'local' | 'server') => {
                try {
                    if (resolution === 'local') {
                        // Keep My Version: Update Dexie record with conflicted: 0, synced: 0, serverData: null, and vKey = vKey + 1
                        await db.books.update(book.localId!, {
                            conflicted: 0,
                            synced: 0,
                            serverData: null,
                            vKey: (book.vKey || 0) + 1,
                            updatedAt: Date.now()
                        });
                    } else {
                        // Accept Cloud Version: Update Dexie record with all fields from serverData, set conflicted: 0, synced: 1, and serverData: null
                        const serverData = book.serverData || {};
                        await db.books.update(book.localId!, {
                            ...serverData,
                            conflicted: 0,
                            synced: 1,
                            serverData: null,
                            updatedAt: Date.now()
                        });
                    }
                    
                    // Trigger UI refresh
                    window.dispatchEvent(new Event('vault-updated'));
                } catch (error) {
                    console.error('Conflict resolution failed:', error);
                }
            }
        });
    }, [book, openModal]);

    // 📊 ENTRY COUNT: Memoized calculation
    const entryCountText = React.useMemo(() => {
        const count = stableProps.bookEntryCount || 0;
        return `${count} ${count === 1 ? 'entry' : 'entries'}`;
    }, [stableProps.bookEntryCount]);

    // 🎨 STATUS COLORS: Memoized status indicators
    const statusColor = React.useMemo(() => {
        if (stableProps.bookIsDeleted) return 'text-red-600';
        if (stableProps.bookSynced) return 'text-green-600';
        return 'text-gray-500';
    }, [stableProps.bookIsDeleted, stableProps.bookSynced]);

    const statusIcon = React.useMemo(() => {
        // 🚨 PRIORITY: Conflict takes precedence over all other states
        if (stableProps.bookIsDeleted) return <X className="w-4 h-4" />;                                    // ❌ Deleted
        if (stableProps.bookConflicted) return <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />;      // 🚨 Conflict
        if (stableProps.bookSynced) return <CheckCircle2 className="w-4 h-4 text-green-600" />;             // ✅ Synced
        return <Clock className="w-4 h-4 text-yellow-500 animate-spin" />;                               // ⏳ Pending
    }, [stableProps.bookIsDeleted, stableProps.bookConflicted, stableProps.bookSynced]);

    // 🎨 BOOK COLOR: Memoized color display
    const bookColorClass = React.useMemo(() => {
        const color = stableProps.bookColor || '#3B82F6';
        return {
            backgroundColor: color,
            borderColor: color
        };
    }, [stableProps.bookColor]);

    // 📅 BOOK ICON: Memoized icon based on color
    const iconColors: { [key: string]: React.FC<{ className?: string }> } = {
        '#3B82F6': BookOpen,
        '#EF4444': CheckCircle2,
        '#10B981': AlertTriangle,
        '#F59E0B': Edit3,
        '#8B5CF6': Settings,
        '#6366F1': Plus,
        '#14B8A6': MoreHorizontal,
        '#F97316': Calendar
    } as const;
    
    // 🚀 BOOK ICON COMPONENT: Memoized and defined outside return
    const BookIcon: React.FC<{ className?: string }> = React.memo(({ className }) => {
        const color = stableProps.bookColor || '#3B82F6';
        const IconComponent = iconColors[color] || BookOpen;
        return <IconComponent className={className || "w-5 h-5"} />;
    });

    // 🛡️ CRASH PREVENTION: Guard against null/deleted book data
    if (!book || Number(book.isDeleted) === 1) return null;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={() => onOpen(book)}
            className="group relative bg-[#1E1E1E] rounded-xl border border-white/5 hover:border-white/10 p-4 transition-all duration-300 cursor-pointer shadow-xl hover:shadow-2xl flex flex-col gap-4 overflow-hidden"
        >
            {/* 🎨 HEADER SECTION */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <div 
                            className="w-2 h-2 rounded-full shrink-0" 
                            style={{ backgroundColor: book.color || '#3B82F6' }} 
                        />
                        <span className="text-sm font-medium text-slate-100 truncate">
                            {stableProps.bookName || t('unnamed_book')}
                        </span>
                    </div>
                    
                    {/* 📝 DESCRIPTION BLOCK */}
                    {stableProps.bookDescription && (
                        <div className="mt-2">
                            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                                {stableProps.bookDescription}
                            </p>
                        </div>
                    )}
                </div>

                {/* ⚙️ ACTIONS */}
                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit(book); }}
                        className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                    >
                        <Edit3 size={14} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(book); }}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            {/* 🖼️ IMAGE CONTAINER (URL-First Logic) */}
            {displayImage && (
                <div className="relative w-full h-32 rounded-lg overflow-hidden bg-[#2D2D2D] border border-white/5 flex items-center justify-center">
                    {isHttpImage ? (
                        // 🚀 DIRECT URL RENDERING - No loading state, immediate display
                        <img 
                            src={displayImage} 
                            alt="Book cover" 
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                    ) : (
                        // 🔄 CID PROCESSING - Only for non-HTTP sources
                        isLoading ? (
                            <div className="flex flex-col items-center gap-2">
                                <Loader2 size={16} className="text-blue-500 animate-spin" />
                                <span className="text-[10px] text-slate-500">Loading Image...</span>
                            </div>
                        ) : isLoaded && previewUrl ? (
                            <img src={previewUrl} alt="Book cover" className="w-full h-full object-cover" />
                        ) : (
                            <div className="flex flex-col items-center gap-2">
                                <ImageIcon size={16} className="text-slate-600" />
                                <span className="text-[10px] text-slate-600">No Image</span>
                            </div>
                        )
                    )}
                </div>
            )}

            {/* 📊 FOOTER STATS */}
            <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                <span className="text-[10px] text-slate-500 font-mono">
                    CID: {stableProps.bookId?.slice(0, 8)}...
                </span>
                {book.synced === 1 ? (
                    <CheckCircle2 size={12} className="text-emerald-500/50" />
                ) : (
                    <CloudOff size={12} className="text-amber-500/50" />
                )}
            </div>
        </motion.div>
    );
});
