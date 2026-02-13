"use client";

import React from 'react';
import { 
    Layers, BookOpen, Calendar, Edit3, 
    MoreHorizontal, Settings, Plus, Trash2,
    X, CheckCircle2, AlertTriangle 
} from 'lucide-react';

import { cn } from '@/lib/utils/helpers';
import { useTranslation } from '@/hooks/useTranslation';

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
    
    // 🎯 STABLE PROPS: Memoize based on stable identifiers
    const stableProps = React.useMemo(() => ({
        bookId: book._id || book.localId,
        bookVKey: book.vKey,
        bookUpdatedAt: book.updatedAt,
        bookName: book.name,
        bookDescription: book.description,
        bookColor: book.color,
        bookIsDeleted: book.isDeleted,
        bookSynced: book.synced,
        bookSyncAttempts: book.syncAttempts,
        bookEntryCount: book.entryCount,
        bookCreatedAt: book.createdAt
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
        book.createdAt
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
        if (stableProps.bookIsDeleted) return <X className="w-4 h-4" />;
        if (stableProps.bookSynced) return <CheckCircle2 className="w-4 h-4 text-green-600" />;
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
    }, [stableProps.bookIsDeleted, stableProps.bookSynced]);

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

    return (
        <div 
            className={cn(
                "bg-[#1A1A1B] p-6 rounded-[24px] border border-[#2D2D2D] shadow-sm flex flex-col gap-5",
                "hover:shadow-md hover:shadow-lg transition-all duration-200",
                bookColorClass.backgroundColor,
                bookColorClass.borderColor
            )}
            style={bookColorClass}
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
                            {statusIcon}
                            <span className="ml-2">
                                {stableProps.bookIsDeleted ? t('book_deleted') : stableProps.bookSynced ? t('book_synced') : t('book_pending')}
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
