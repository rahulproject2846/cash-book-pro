"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Book, FileText, X, RotateCcw } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/offlineDB';
import { cn, toBn } from '@/lib/utils/helpers';
import { useModal } from '@/context/ModalContext';
import { useConflictStore } from '@/lib/vault/ConflictStore';
import { mapConflictType } from '@/lib/vault/ConflictMapper';

interface ConflictManagementListProps {
    currentUser: any;
}


/**
 * 🚨 CONFLICT MANAGEMENT LIST (V2.0 - Premium Undo & Sync)
 * --------------------------------------------------------
 * Centralized conflict resolution with glassmorphic design
 * 8-second undo countdown and automatic server sync
 */
export const ConflictManagementList: React.FC<ConflictManagementListProps> = ({ currentUser }) => {
    const { openModal, closeModal } = useModal();
    const { 
        conflicts, 
        pendingResolutions, 
        resolveAll, 
        addPendingResolution,
        removePendingResolution 
    } = useConflictStore();
    
    // 📄 PAGINATION STATE
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 7;

    // Use conflicts from store instead of local live queries
    const allConflicts = useMemo(() => {
        return conflicts.sort((a, b) => {
            // Sort by updatedAt descending (most recent first)
            const timeA = new Date(a.record.updatedAt || 0).getTime();
            const timeB = new Date(b.record.updatedAt || 0).getTime();
            return timeB - timeA;
        });
    }, [conflicts]);
    
    // 📄 PAGINATION LOGIC
    const totalPages = Math.ceil(allConflicts.length / ITEMS_PER_PAGE);
    const paginatedConflicts = allConflicts.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );
    
    // 🔄 RESET PAGE WHEN CONFLICT COUNT CHANGES
    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(1);
        }
    }, [totalPages, currentPage]);



    const handleConflictResolution = (item: any) => {
        openModal('conflictResolver', {
            record: item.record,
            type: item.type,
            onResolve: async (resolution: 'local' | 'server') => {
                // Create conflict item using mapper
                const conflictItem = {
                    type: item.type,
                    cid: item.cid,
                    localId: item.localId,
                    record: item.record,
                    conflictType: mapConflictType(item.record.conflictReason),
                    icon: item.icon
                };
                
                // Add to store's pending resolutions
                addPendingResolution(conflictItem, resolution);
                closeModal(); // Close modal immediately
            }
        });
    };

    const handleUndo = (item: any) => {
        const key = `${item.type}:${item.cid}`;
        removePendingResolution(key);
    };

    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return 'Unknown date';
        }
    };

    if (allConflicts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <div className="text-center">
                    <AlertTriangle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">No Conflicts Found</h3>
                    <p className="text-white/60">All your data is in sync!</p>
                </div>
            </div>
        );
    }

return (
        <div className="space-y-4">
            {/* Bulk Resolve Buttons */}
            <div className="flex gap-4 justify-center mb-6">
                <button
                    onClick={() => resolveAll('local')}
                    className="px-6 py-3 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-xl font-black text-[12px] uppercase tracking-wider hover:bg-blue-500/30 hover:border-blue-500/50 transition-all active:scale-95"
                >
                    Resolve All (Keep Local)
                </button>
                <button
                    onClick={() => resolveAll('server')}
                    className="px-6 py-3 bg-green-500/20 border border-green-500/30 text-green-400 rounded-xl font-black text-[12px] uppercase tracking-wider hover:bg-green-500/30 hover:border-green-500/50 transition-all active:scale-95"
                >
                    Resolve All (Accept Server)
                </button>
            </div>

            {/* Header */}
            <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">
                    {allConflicts.length} Conflict{allConflicts.length === 1 ? '' : 's'}
                </h3>
                <p className="text-white/60">Click "Resolve" to resolve each conflict</p>
            </div>

            {/* Conflict List */}
            <div className="space-y-3 max-h-100 overflow-y-auto pr-2 custom-scrollbar">
                {paginatedConflicts.map((item, index) => {
                    const pendingKey = `${item.type}:${item.cid}`;
                    const isPending = pendingKey in pendingResolutions;
                    const pendingResolution = pendingResolutions[pendingKey];
                    
                    // Calculate remaining time using expiresAt from store
                    const remainingTime = isPending 
                        ? Math.max(0, Math.ceil((pendingResolution.expiresAt - Date.now()) / 1000))
                        : 0;
                    
                    return (
                        <motion.div
                            key={`${item.type}-${item.localId}`}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={cn(
                                "bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-all mb-3",
                                isPending && "border-yellow-500/30 bg-yellow-500/5"
                            )}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4 flex-1">
                                    {/* Icon */}
                                    <div className="w-12 h-12 bg-red-500/20 rounded-2xl flex items-center justify-center border border-red-500/30 shrink-0">
                                        {item.type === 'book' ? (
                                            <Book className="w-6 h-6 text-red-400" />
                                        ) : (
                                            <FileText className="w-6 h-6 text-red-400" />
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-black text-red-500 uppercase tracking-wider">
                                                {item.type === 'book' ? 'BOOK' : 'ENTRY'}
                                            </span>
                                            <span className="text-[10px] text-white/40 font-bold">
                                                {formatDate(item.record.updatedAt)}
                                            </span>
                                            {isPending && (
                                                <span className="text-[10px] font-black text-yellow-500 uppercase tracking-wider">
                                                    PENDING
                                                </span>
                                            )}
                                        </div>
                                        <h4 className="text-base font-bold text-white truncate">
                                            {item.record.name || item.record.title || 'Untitled'}
                                        </h4>
                                        <p className="text-xs text-white/60 truncate">
                                            {item.record.description || 'No description'}
                                        </p>
                                    </div>
                                </div>

                                {/* Action Button */}
                                {isPending ? (
                                    <div className="ml-4 flex flex-col gap-2 shrink-0">
                                        {/* Progress Bar */}
                                        <div className="w-24 h-1 bg-yellow-500/20 rounded-full overflow-hidden">
                                            <motion.div 
                                                className="h-full bg-yellow-500 rounded-full"
                                                initial={{ width: "100%" }}
                                                animate={{ width: `${(remainingTime / 8) * 100}%` }}
                                                transition={{ duration: 1, ease: "linear" }}
                                            />
                                        </div>
                                        
                                        {/* Undo Button */}
                                        <button
                                            onClick={() => handleUndo(item)}
                                            className="px-4 py-2 border border-yellow-500/30 text-yellow-400 bg-yellow-500/10 rounded-xl font-black text-[10px] uppercase tracking-wider hover:bg-yellow-500/20 hover:border-yellow-500/50 transition-all active:scale-95 flex items-center gap-2 animate-pulse"
                                        >
                                            <RotateCcw className="w-3 h-3" />
                                            Undo ({remainingTime}s)
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => handleConflictResolution(item)}
                                        className="ml-4 px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl font-black text-[10px] uppercase tracking-wider hover:bg-red-500 hover:text-white transition-all active:scale-95 shrink-0"
                                    >
                                        Resolve
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </div>
            
            {/* 📄 PAGINATION CONTROLS */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-6">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 bg-white/10 border border-white/20 text-white rounded-xl font-black text-[10px] uppercase tracking-wider hover:bg-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Previous
                    </button>
                    
                    <span className="text-white/60 text-[10px] font-bold">
                        Page {currentPage} of {totalPages}
                    </span>
                    
                    <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 bg-white/10 border border-white/20 text-white rounded-xl font-black text-[10px] uppercase tracking-wider hover:bg-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default ConflictManagementList;
