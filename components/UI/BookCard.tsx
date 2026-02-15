"use client";

import React from 'react';
import { 
    Layers, BookOpen, Calendar, Edit3, 
    MoreHorizontal, Settings, Plus, Trash2,
    X, CheckCircle2, AlertTriangle, Clock
} from 'lucide-react';

import { cn } from '@/lib/utils/helpers';
import { useTranslation } from '@/hooks/useTranslation';
import { useModal } from '@/context/ModalContext';
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
    
    // 🎯 STABLE PROPS: Memoize based on stable identifiers
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

    // � CONFLICT RESOLUTION: Handle conflict modal opening
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

    // �📊 ENTRY COUNT: Memoized calculation
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
        <div 
            className={cn(
                "bg-[#1A1A1B] p-6 rounded-[24px] border border-[#2D2D2D] shadow-sm flex flex-col gap-5",
                "hover:shadow-md hover:shadow-lg transition-all duration-200",
                bookColorClass.backgroundColor,
                bookColorClass.borderColor,
                stableProps.bookConflicted ? "cursor-pointer ring-2 ring-red-500/20" : ""
            )}
            style={bookColorClass}
            onClick={stableProps.bookConflicted ? handleConflictResolution : undefined}
        >
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div className="space-y-2">
                    {/* Book Name and Status */}
                    <div className="flex justify-between items-start">
                        <h3 className="text-lg font-bold text-slate-900 truncate">
                            {stableProps.bookName || t('unnamed_book')}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <button 
                                onClick={stableProps.bookConflicted ? handleConflictResolution : undefined}
                                className={cn(
                                    "flex items-center gap-2 transition-colors",
                                    stableProps.bookConflicted ? "cursor-pointer hover:text-red-600" : "cursor-default"
                                )}
                            >
                                {statusIcon}
                            </button>
                            <span className="ml-2">
                                {stableProps.bookIsDeleted ? t('book_deleted') : 
                                 stableProps.bookConflicted ? t('book_conflicted') : 
                                 stableProps.bookSynced ? t('book_synced') : t('book_pending')}
                            </span>
                        </div>
                    </div>
                    
                    {/* Entry Count */}
                    <div className="text-sm text-slate-500">
                        {entryCountText}
                    </div>
                </div>
                
                {/* Book Color */}
                <div className="flex items-center gap-2">
                    <div 
                        className="w-8 h-8 rounded-lg border-2 border-white shadow-inner"
                        style={bookColorClass}
                    >
                        <BookIcon />
                    </div>
                    <span className="text-sm font-medium text-slate-700">
                        {stableProps.bookName || t('unnamed_book')}
                    </span>
                </div>
            </div>

            {/* Description */}
            {stableProps.bookDescription && (
                <div className="mt-4 p-4 bg-[#2D2D2D] rounded-lg border border-[#2D2D2D]">
                    <p className="text-sm text-slate-600 line-clamp-2">
                        {stableProps.bookDescription}
                    </p>
                </div>
            )}

            {/* Actions */}
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-[#2D2D2D]">
                <button
                    onClick={handleOpen}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
                >
                    <Calendar className="w-4 h-4" />
                    <span>{t('btn_open')}</span>
                </button>
                
                <button
                    onClick={handleEdit}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 font-medium"
                >
                    <Edit3 className="w-4 h-4" />
                    <span>{t('btn_edit')}</span>
                </button>
                
                <button
                    onClick={handleDelete}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium"
                >
                    <Trash2 className="w-4 h-4" />
                    <span>{t('btn_delete')}</span>
                </button>
            </div>
        </div>
    );
});
