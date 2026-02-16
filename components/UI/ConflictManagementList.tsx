"use client";

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Book, FileText, X, RotateCcw } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/offlineDB';
import { cn, toBn } from '@/lib/utils/helpers';
import { useModal } from '@/context/ModalContext';
import { orchestrator } from '@/lib/vault/SyncOrchestrator';
import { generateChecksum } from '@/lib/utils/helpers';

interface ConflictManagementListProps {
    currentUser: any;
}

interface PendingResolution {
    timer: number;
    resolution: 'local' | 'server';
}

/**
 * 🚨 CONFLICT MANAGEMENT LIST (V2.0 - Premium Undo & Sync)
 * --------------------------------------------------------
 * Centralized conflict resolution with glassmorphic design
 * 8-second undo countdown and automatic server sync
 */
export const ConflictManagementList: React.FC<ConflictManagementListProps> = ({ currentUser }) => {
    const { openModal } = useModal();
    const [pendingResolutions, setPendingResolutions] = useState<Record<string, PendingResolution>>({});
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    
    // 📄 PAGINATION STATE
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 7;

    // Query all conflicted books and entries
    const conflictedBooks = useLiveQuery(
        () => db.books.where('conflicted').equals(1).toArray(),
        []
    );

    const conflictedEntries = useLiveQuery(
        () => db.entries.where('conflicted').equals(1).toArray(),
        []
    );

    // Combine and sort all conflicts
    const allConflicts = useMemo(() => {
        const books = (conflictedBooks || []).filter((book: any) => book.isDeleted !== 1).map((book: any) => ({
            ...book,
            type: 'book',
            displayName: book.name || 'Untitled Book',
            displayInfo: `${book.entryCount || 0} entries`,
            icon: Book,
            color: 'text-blue-500'
        }));

        const entries = (conflictedEntries || []).filter((entry: any) => entry.isDeleted !== 1).map((entry: any) => ({
            ...entry,
            type: 'entry',
            displayName: entry.title || 'Untitled Entry',
            displayInfo: `${toBn(Math.abs(entry.amount) || 0, 'en')} ${entry.type === 'income' ? 'income' : 'expense'}`,
            icon: FileText,
            color: entry.type === 'income' ? 'text-green-500' : 'text-red-500'
        }));

        return [...books, ...entries].sort((a, b) => {
            // Sort by updatedAt descending (most recent first)
            const timeA = new Date(a.updatedAt || 0).getTime();
            const timeB = new Date(b.updatedAt || 0).getTime();
            return timeB - timeA;
        });
    }, [conflictedBooks, conflictedEntries]);
    
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

    // Timer countdown effect
    useEffect(() => {
        intervalRef.current = setInterval(() => {
            setPendingResolutions(prev => {
                const updated = { ...prev };
                const toRemove: string[] = [];
                
                Object.keys(updated).forEach(key => {
                    updated[key].timer -= 1;
                    if (updated[key].timer <= 0) {
                        toRemove.push(key);
                    }
                });
                
                // Execute resolutions for timers that reached 0
                toRemove.forEach(async (key) => {
                    const resolution = updated[key];
                    const [type, cid] = key.split(':');
                    const item = allConflicts.find(conflict => 
                        conflict.type === type && conflict.cid === cid
                    );
                    
                    if (item) {
                        await executeResolution(item, resolution.resolution);
                    }
                });
                
                // Remove completed items
                toRemove.forEach(key => delete updated[key]);
                
                return updated;
            });
        }, 1000);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [allConflicts]);

    // Cleanup on unmount - commit any pending resolutions that reached 0
    useEffect(() => {
        return () => {
            // Commit any resolutions that are ready (timer <= 0)
            Object.entries(pendingResolutions).forEach(async ([key, resolution]) => {
                if (resolution.timer <= 0) {
                    const [type, cid] = key.split(':');
                    const item = allConflicts.find(conflict => 
                        conflict.type === type && conflict.cid === cid
                    );
                    
                    if (item) {
                        await executeResolution(item, resolution.resolution);
                    }
                }
            });
        };
    }, [pendingResolutions, allConflicts]);

    const executeResolution = async (item: any, resolution: 'local' | 'server') => {
        try {
            if (resolution === 'local') {
                // Keep My Version: Update Dexie record with conflicted: 0, synced: 0, serverData: null
                // FORCE vKey: Increment by 1 instead of timestamp for proper versioning
                if (item.type === 'book') {
                    const updateData = {
                        conflicted: 0,
                        synced: 0,
                        serverData: null,
                        vKey: (item.vKey || 0) + 1, // � INCREMENTAL: +1 instead of Date.now()
                        updatedAt: Date.now()
                    };
                    
                    await db.books.update(item.localId!, updateData);
                    
                    // 🔄 REGENERATE CHECKSUM: Create fresh checksum for resolved data
                    const freshChecksum = await generateChecksum({
                        amount: 0,
                        date: new Date().toISOString().split('T')[0],
                        title: (item.name || '').toLowerCase()
                    });
                    
                    await db.books.update(item.localId!, { checksum: freshChecksum });
                } else {
                    const updateData = {
                        conflicted: 0,
                        synced: 0,
                        serverData: null,
                        vKey: (item.vKey || 0) + 1, // � INCREMENTAL: +1 instead of Date.now()
                        updatedAt: Date.now()
                    };
                    
                    await db.entries.update(item.localId!, updateData);
                    
                    // 🔄 REGENERATE CHECKSUM: Create fresh checksum for resolved data
                    const freshChecksum = await generateChecksum({
                        amount: Math.abs(item.amount || 0),
                        date: new Date().toISOString().split('T')[0],
                        title: (item.title || '').toLowerCase()
                    });
                    
                    await db.entries.update(item.localId!, { checksum: freshChecksum });
                }
            } else {
                // Accept Cloud Version: Update Dexie record with all fields from serverData
                const serverData = item.serverData || {};
                if (item.type === 'book') {
                    await db.books.update(item.localId!, {
                        ...serverData,
                        conflicted: 0,
                        synced: 1,
                        serverData: null,
                        updatedAt: Date.now()
                    });
                } else {
                    await db.entries.update(item.localId!, {
                        ...serverData,
                        conflicted: 0,
                        synced: 1,
                        serverData: null,
                        updatedAt: Date.now()
                    });
                }
            }
            
            // 🚀 TRIGGER SYNC TO SERVER
            if (currentUser?._id) {
                await orchestrator.triggerSync(currentUser._id);
            }
            
            // 🚨 SERVER FEEDBACK LOOP: Notify other clients of resolution
            // Use orchestrator to broadcast resolution instead of direct Pusher
            try {
                // Broadcast resolution event through existing realtime system
                if (orchestrator && typeof orchestrator.notifyUI === 'function') {
                    orchestrator.notifyUI();
                    console.log('🚨 [RESOLUTION BROADCAST] Conflict resolution broadcasted to other clients');
                }
            } catch (broadcastError) {
                console.warn('🚨 [RESOLUTION BROADCAST] Failed to notify other clients:', broadcastError);
            }
            
            // ��️ SAFETY NET: Log conflict resolution to audit trail
            await db.auditLogs.add({
                cid: item.cid,
                type: item.type,
                decision: resolution, // 'local' or 'server'
                timestamp: Date.now(),
                userId: currentUser._id
            });
            
            // Trigger UI refresh
            window.dispatchEvent(new Event('vault-updated'));
        } catch (error) {
            console.error('Conflict resolution failed:', error);
        }
    };

    const handleConflictResolution = (item: any) => {
        openModal('conflictResolver', {
            record: item,
            type: item.type,
            onResolve: async (resolution: 'local' | 'server') => {
                // Add to pending resolutions with 8-second timer
                const key = `${item.type}:${item.cid}`;
                setPendingResolutions(prev => ({
                    ...prev,
                    [key]: {
                        timer: 8,
                        resolution
                    }
                }));
            }
        });
    };

    const handleUndo = (item: any) => {
        const key = `${item.type}:${item.cid}`;
        setPendingResolutions(prev => {
            const updated = { ...prev };
            delete updated[key];
            return updated;
        });
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
                                        <item.icon className="w-6 h-6 text-red-400" />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-black text-red-500 uppercase tracking-wider">
                                                {item.type === 'book' ? 'BOOK' : 'ENTRY'}
                                            </span>
                                            <span className="text-[10px] text-white/40 font-bold">
                                                {formatDate(item.updatedAt)}
                                            </span>
                                            {isPending && (
                                                <span className="text-[10px] font-black text-yellow-500 uppercase tracking-wider">
                                                    PENDING
                                                </span>
                                            )}
                                        </div>
                                        <h4 className="text-base font-bold text-white truncate">
                                            {item.displayName}
                                        </h4>
                                        <p className="text-xs text-white/60 truncate">
                                            {item.displayInfo}
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
                                                animate={{ width: `${(pendingResolution.timer / 8) * 100}%` }}
                                                transition={{ duration: 1, ease: "linear" }}
                                            />
                                        </div>
                                        
                                        {/* Undo Button */}
                                        <button
                                            onClick={() => handleUndo(item)}
                                            className="px-4 py-2 border border-yellow-500/30 text-yellow-400 bg-yellow-500/10 rounded-xl font-black text-[10px] uppercase tracking-wider hover:bg-yellow-500/20 hover:border-yellow-500/50 transition-all active:scale-95 flex items-center gap-2 animate-pulse"
                                        >
                                            <RotateCcw className="w-3 h-3" />
                                            Undo ({pendingResolution.timer}s)
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
