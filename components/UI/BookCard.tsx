"use client";

import React from 'react';
import { 
    Layers, BookOpen, Calendar, Edit3, 
    MoreHorizontal, Settings, Plus 
} from 'lucide-react';

import { cn } from '@/lib/utils/helpers';

interface BookCardProps {
    book: any;
    onEdit: (book: any) => void;
    onDelete: (book: any) => void;
    onOpen: (book: any) => void;
    currentUser: any;
}

// 🚀 OPTIMIZED BOOK CARD: Memoized to prevent unnecessary re-renders
export const BookCard = React.memo(({ book, onEdit, onDelete, onOpen, currentUser }: BookCardProps) => {
    const { T } = useTranslation();
    
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
        bookEntryCount: book.entryCount
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

    // 🔄 EVENT HANDLERS: Memoized to prevent function recreation
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

    // 📅 ENTRY COUNT: Memoized calculation
    const entryCountText = React.useMemo(() => {
        const count = stableProps.bookEntryCount || 0;
        return `${count} ${T(count === 1 ? 'entry' : 'entries')}`;
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
    const BookIcon = React.useMemo(() => {
        const color = stableProps.bookColor || '#3B82F6';
        const iconColors: { [key: string]: string } = {
            '#3B82F6': 'text-blue-600',
            '#EF4444': 'text-green-600',
            '#10B981': 'text-yellow-600',
            '#F59E0B': 'text-red-600',
            '#8B5CF6': 'text-purple-600',
            '#6366F1': 'text-pink-600',
            '#14B8A6': 'text-indigo-600',
            '#F97316': 'text-teal-600'
        };
        
        const IconComponent = iconColors[color] || BookOpen;
        return <IconComponent className="w-5 h-5" />;
    }, [stableProps.bookColor]);

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
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold text-slate-900 truncate">
                            {stableProps.bookName || T('unnamed_book')}
                        </h3>
                        <div className="flex items-center gap-2">
                            {statusIcon}
                            <span className="ml-2 text-sm text-slate-500">
                                {stableProps.bookIsDeleted ? T('book_deleted') : stableProps.bookSynced ? T('book_synced') : T('book_pending')}
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
                        {stableProps.bookName || T('unnamed_book')}
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
                    <span>{T('btn_open')}</span>
                </button>
                
                <button
                    onClick={handleEdit}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 font-medium"
                >
                    <Edit3 className="w-4 h-4" />
                    <span>{T('btn_edit')}</span>
                </button>
                
                <button
                    onClick={handleDelete}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium"
                >
                    <Trash2 className="w-4 h-4" />
                    <span>{T('btn_delete')}</span>
                </button>
            </div>
        </div>
    );
});
