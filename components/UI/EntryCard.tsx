"use client";

import React from 'react';
import { 
    CreditCard, Layers, Info, ArrowDownLeft, ArrowUpRight, 
    Calendar, Clock, X, PlusCircle, Calculator, Trash2,
    SlidersHorizontal, ChevronDown, CheckCircle2, AlertTriangle 
} from 'lucide-react';

import { cn } from '@/lib/utils/helpers';
import { useTranslation } from '@/hooks/useTranslation';
import { useModal } from '@/context/ModalContext';
import { db } from '@/lib/offlineDB';

interface EntryCardProps {
    entry: any;
    onEdit: (entry: any) => void;
    onDelete: (entry: any) => void;
    onStatusToggle: (entry: any) => void;
    currentUser: any;
    currentBook: any;
}

// 🚀 OPTIMIZED ENTRY CARD: Memoized to prevent unnecessary re-renders
export const EntryCard = React.memo(({ entry, onEdit, onDelete, onStatusToggle, currentUser, currentBook }: EntryCardProps) => {
    const { t } = useTranslation();
    const { openModal } = useModal();
    
    // 🎯 STABLE PROPS: Memoize based on stable identifiers
    const stableProps = React.useMemo(() => ({
        entryId: entry._id || entry.localId,
        entryVKey: entry.vKey,
        entryUpdatedAt: entry.updatedAt,
        entryAmount: entry.amount,
        entryTitle: entry.title,
        entryStatus: entry.status,
        entryCategory: entry.category,
        entryDate: entry.date,
        entryTime: entry.time,
        entryNote: entry.note,
        entryIsDeleted: entry.isDeleted,
        entrySynced: entry.synced,
        entrySyncAttempts: entry.syncAttempts,
        entryChecksum: entry.checksum,
        entryConflicted: entry.conflicted     // 🚨 CONFLICT TRACKING: 0 = no conflict, 1 = conflict detected
    }), [
        entry._id || entry.localId,
        entry.vKey,
        entry.updatedAt,
        entry.amount,
        entry.title,
        entry.status,
        entry.category,
        entry.date,
        entry.time,
        entry.note,
        entry.isDeleted,
        entry.synced,
        entry.syncAttempts,
        entry.checksum,
        entry.conflicted
    ]);

    // 🔄 EVENT HANDLERS: Memoized to prevent function recreation on every render
    const handleEdit = React.useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onEdit(entry);
    }, [onEdit, entry]);

    const handleDelete = React.useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete(entry);
    }, [onDelete, entry]);

    const handleStatusToggle = React.useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onStatusToggle(entry);
    }, [onStatusToggle, entry]);

    // 🚨 CONFLICT RESOLUTION: Handle conflict modal opening
    const handleConflictResolution = React.useCallback(async () => {
        if (!entry.conflicted) return;
        
        openModal('conflictResolver', {
            record: entry,
            type: 'entry',
            onResolve: async (resolution: 'local' | 'server') => {
                try {
                    if (resolution === 'local') {
                        // Keep My Version: Update Dexie record with conflicted: 0, synced: 0, serverData: null, and vKey = vKey + 1
                        await db.entries.update(entry.localId!, {
                            conflicted: 0,
                            synced: 0,
                            serverData: null,
                            vKey: (entry.vKey || 0) + 1,
                            updatedAt: Date.now()
                        });
                    } else {
                        // Accept Cloud Version: Update Dexie record with all fields from serverData, set conflicted: 0, synced: 1, and serverData: null
                        const serverData = entry.serverData || {};
                        await db.entries.update(entry.localId!, {
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
    }, [entry, openModal]);

    // 🎨 STATUS COLORS: Memoized status calculations
    const statusColor = React.useMemo(() => {
        if (stableProps.entryStatus === 'pending') return 'text-yellow-600';
        if (stableProps.entryStatus === 'completed') return 'text-green-600';
        return 'text-gray-500';
    }, [stableProps.entryStatus]);

    const statusIcon = React.useMemo(() => {
        // 🚨 PRIORITY: Conflict takes precedence over all other states
        if (stableProps.entryConflicted) return <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />;  // 🚨 Conflict
        if (stableProps.entryStatus === 'pending') return <Clock className="w-4 h-4 animate-spin" />;           // ⏳ Pending
        if (stableProps.entryStatus === 'completed') return <CheckCircle2 className="w-4 h-4 text-green-600" />; // ✅ Completed
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;  // ⚠️ Unknown/Fallback
    }, [stableProps.entryConflicted, stableProps.entryStatus]);

    // 💰 AMOUNT FORMATTING: Memoized amount display
    const formattedAmount = React.useMemo(() => {
        const amount = stableProps.entryAmount || 0;
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0
        }).format(amount);
    }, [stableProps.entryAmount]);

    // 📅 DATE FORMATTING: Memoized date display
    const formattedDate = React.useMemo(() => {
        const date = stableProps.entryDate || '';
        if (!date) return 'No date';
        
        try {
            const dateObj = new Date(date);
            return dateObj.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return 'Invalid date';
        }
    }, [stableProps.entryDate]);

    // 🕒 TIME FORMATTING: Memoized time display
    const formattedTime = React.useMemo(() => {
        const time = stableProps.entryTime || '';
        if (!time) return 'No time';
        
        try {
            const [hours, minutes] = time.split(':');
            const timeObj = new Date();
            timeObj.setHours(parseInt(hours, 10));
            timeObj.setMinutes(parseInt(minutes, 10));
            return timeObj.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        } catch {
            return 'Invalid time';
        }
    }, [stableProps.entryTime]);

    // 🏷️ CATEGORY DISPLAY: Memoized category with fallback
    const displayCategory = React.useMemo(() => {
        const category = stableProps.entryCategory || 'GENERAL';
        const categoryColors: { [key: string]: string } = {
            'GENERAL': 'text-blue-600',
            'FOOD': 'text-green-600',
            'TRANSPORT': 'text-purple-600',
            'SHOPPING': 'text-pink-600',
            'ENTERTAINMENT': 'text-yellow-600',
            'HEALTHCARE': 'text-red-600',
            'EDUCATION': 'text-indigo-600',
            'BUSINESS': 'text-gray-600',
            'PERSONAL': 'text-orange-600',
            'INVESTMENT': 'text-teal-600'
        };
        return (
            <span className={cn('text-xs font-bold uppercase', categoryColors[category] || 'text-gray-500')}>
                {category}
            </span>
        );
    }, [stableProps.entryCategory]);

    return (
        <div 
            className={cn(
                "bg-[#1A1A1B] p-6 rounded-3xl border-2 shadow-sm flex flex-col gap-5 hover:shadow-md hover:shadow-lg transition-all duration-200",
                stableProps.entryConflicted 
                    ? "border-red-500 bg-red-500/5 cursor-pointer ring-2 ring-red-500/20"  // 🚨 Conflict styling + clickable
                    : "border-[#2D2D2D]"
            )}
            onClick={stableProps.entryConflicted ? handleConflictResolution : undefined}
        >
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div className="space-y-1">
                    {/* Title and Date */}
                    <div className="flex justify-between items-start">
                        <h3 className="text-lg font-bold text-slate-900 truncate">
                            {stableProps.entryTitle || t('untitled_entry')}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <button 
                                onClick={stableProps.entryConflicted ? handleConflictResolution : handleStatusToggle}
                                className={cn(
                                    "flex items-center gap-2 transition-colors",
                                    stableProps.entryConflicted ? "cursor-pointer hover:text-red-600" : "cursor-pointer hover:text-green-600"
                                )}
                            >
                                {statusIcon}
                            </button>
                            <Calendar className="w-4 h-4" />
                            <span>{formattedDate}</span>
                            {formattedTime && <span className="ml-2">{formattedTime}</span>}
                        </div>
                    </div>
                    
                    {/* Amount and Status */}
                    <div className="flex items-center gap-4">
                        <span className={cn('text-2xl font-bold', statusColor)}>
                            {formattedAmount}
                        </span>
                        <button
                            onClick={handleStatusToggle}
                            className={cn(
                                'ml-4 p-2 rounded-lg border transition-colors duration-200',
                                statusColor === 'text-green-600' 
                                    ? 'border-green-600 hover:border-green-700 hover:bg-green-50' 
                                    : statusColor === 'text-yellow-600'
                                    ? 'border-yellow-600 hover:border-yellow-700 hover:bg-yellow-50'
                                    : 'border-gray-600 hover:border-gray-700 hover:bg-gray-50'
                            )}
                        >
                            {statusIcon}
                        </button>
                    </div>
                </div>
                
                {/* Category */}
                <div className="flex items-center gap-2">
                    {displayCategory}
                </div>
            </div>

            {/* Note */}
            {stableProps.entryNote && (
                <div className="mt-4 p-4 bg-[#2D2D2D] rounded-lg border border-[#2D2D2D]">
                    <p className="text-sm text-slate-600 mb-2">{t('note')}</p>
                    <p className="text-xs text-slate-500 whitespace-pre-wrap break-words">
                        {stableProps.entryNote}
                    </p>
                </div>
            )}

            {/* Actions */}
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-[#2D2D2D]">
                <button
                    onClick={handleEdit}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
                >
                    <Info className="w-4 h-4" />
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
