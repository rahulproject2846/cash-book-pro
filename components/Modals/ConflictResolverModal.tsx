"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Clock, Check, X, Zap } from 'lucide-react';

// Global Engine Hooks & Components
import { useTranslation } from '@/hooks/useTranslation';
import { useModal } from '@/context/ModalContext';
import { db } from '@/lib/offlineDB';
import { cn, toBn } from '@/lib/utils/helpers';

interface ConflictData {
    id: string;
    type: 'book' | 'entry';
    localRecord: {
        id: string;
        amount?: number;
        name?: string;
        description?: string;
        createdAt: string;
        updatedAt: string;
        vKey: number;
    };
    remoteRecord: {
        id: string;
        amount?: number;
        name?: string;
        description?: string;
        createdAt: string;
        updatedAt: string;
        vKey: number;
    };
}

export const ConflictResolverModal = () => {
    const { t, language } = useTranslation();
    const { isOpen, data, closeModal } = useModal();
    const [selectedVersion, setSelectedVersion] = useState<'local' | 'remote' | null>(null);
    const [isResolving, setIsResolving] = useState(false);
    const [conflictData, setConflictData] = useState<ConflictData | null>(null);

    // Parse conflict data when modal opens
    useEffect(() => {
        if (isOpen && data?.type === 'conflictResolver') {
            setConflictData(data.conflictData);
            setSelectedVersion(null);
        } else {
            setConflictData(null);
            setSelectedVersion(null);
        }
    }, [isOpen, data]);

    // Listen for global conflict events
    useEffect(() => {
        const handleConflictDetected = (event: CustomEvent) => {
            const conflictData = event.detail;
            // Open modal with conflict data
            // This would be handled by the modal context
            console.log('Conflict detected:', conflictData);
        };

        window.addEventListener('sync-conflict-detected', handleConflictDetected as EventListener);
        return () => {
            window.removeEventListener('sync-conflict-detected', handleConflictDetected as EventListener);
        };
    }, []);

    const handleResolveConflict = async () => {
        if (!selectedVersion || !conflictData || isResolving) return;

        setIsResolving(true);
        try {
            const chosenRecord = selectedVersion === 'local' ? conflictData.localRecord : conflictData.remoteRecord;
            
            // Update the chosen record in Dexie with incremented vKey
            const updatedRecord = {
                ...chosenRecord,
                vKey: Math.max(conflictData.localRecord.vKey, conflictData.remoteRecord.vKey) + 1,
                updatedAt: Date.now(), // Use number timestamp for Dexie
                synced: 0 as const // Mark as unsynced to trigger sync (use literal 0)
            };

            // Remove fields that shouldn't be updated
            const { id, createdAt, ...updateData } = updatedRecord;

            if (conflictData.type === 'book') {
                await db.books.update(conflictData.id, updateData);
            } else if (conflictData.type === 'entry') {
                await db.entries.update(conflictData.id, updateData);
            }

            // Trigger sync event to sync back to server
            window.dispatchEvent(new CustomEvent('vault-updated', {
                detail: { action: 'conflict-resolved', type: conflictData.type, id: conflictData.id }
            }));

            // Close modal after successful resolution
            setTimeout(() => {
                closeModal();
                setIsResolving(false);
            }, 1000);

        } catch (error) {
            console.error('Failed to resolve conflict:', error);
            setIsResolving(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (!isOpen || data?.type !== 'conflictResolver' || !conflictData) return null;

    return (
        <AnimatePresence mode="popLayout">
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4"
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
                    className="bg-[var(--bg-card)] rounded-[32px] border border-[var(--border)] shadow-2xl max-w-2xl w-full p-8 relative"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-orange-500/10 rounded-[20px] text-orange-500 border border-orange-500/20 flex items-center justify-center">
                                <AlertTriangle size={24} strokeWidth={2.5} className="animate-pulse" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-[var(--text-main)] uppercase tracking-tighter leading-none">
                                    {t('conflict_detected') || "SYNC CONFLICT"}
                                </h2>
                                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[3px] mt-1 opacity-60">
                                    {t('conflict_subtitle') || "Choose which version to keep"}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={closeModal}
                            className="w-10 h-10 rounded-[12px] bg-[var(--bg-app)] border border-[var(--border)] flex items-center justify-center hover:bg-[var(--border)]/20 transition-all"
                        >
                            <X size={18} className="text-[var(--text-muted)]" />
                        </button>
                    </div>

                    {/* Conflict Type Info */}
                    <div className="mb-6 p-4 bg-orange-500/5 rounded-[20px] border border-orange-500/10">
                        <div className="flex items-center gap-3">
                            <Zap size={16} className="text-orange-500" />
                            <p className="text-[11px] font-bold text-orange-500 uppercase tracking-[2px]">
                                {conflictData.type === 'book' ? (t('book_conflict') || "BOOK CONFLICT") : (t('entry_conflict') || "ENTRY CONFLICT")}
                            </p>
                            <span className="text-[10px] font-mono text-[var(--text-muted)] opacity-60 ml-auto">
                                vKey: {conflictData.localRecord.vKey} vs {conflictData.remoteRecord.vKey}
                            </span>
                        </div>
                    </div>

                    {/* Version Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        {/* Local Device Card */}
                        <motion.div
                            whileHover={{ scale: 1.02, y: -2 }}
                            onClick={() => setSelectedVersion('local')}
                            className={cn(
                                "relative p-6 rounded-[24px] border-2 cursor-pointer transition-all duration-300",
                                selectedVersion === 'local' 
                                    ? "border-orange-500 bg-orange-500/5 shadow-lg shadow-orange-500/20" 
                                    : "border-[var(--border)] bg-[var(--bg-app)] hover:border-orange-500/30"
                            )}
                        >
                            {selectedVersion === 'local' && (
                                <div className="absolute top-4 right-4 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                                    <Check size={14} className="text-white" />
                                </div>
                            )}
                            
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-blue-500/10 rounded-[16px] text-blue-500 flex items-center justify-center">
                                    <Clock size={18} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-[var(--text-main)] uppercase tracking-tighter">
                                        {t('this_device') || "THIS DEVICE"}
                                    </h3>
                                    <p className="text-[9px] font-bold text-blue-500 uppercase tracking-[2px] mt-0.5">
                                        {t('local_version') || "LOCAL"}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {conflictData.localRecord.name && (
                                    <div>
                                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[2px] mb-1">
                                            {t('name') || "NAME"}
                                        </p>
                                        <p className="text-sm font-black text-[var(--text-main)] truncate">
                                            {conflictData.localRecord.name}
                                        </p>
                                    </div>
                                )}

                                {conflictData.localRecord.amount !== undefined && (
                                    <div>
                                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[2px] mb-1">
                                            {t('amount') || "AMOUNT"}
                                        </p>
                                        <p className="text-lg font-black text-[var(--text-main)]">
                                            {toBn(conflictData.localRecord.amount, language)}
                                        </p>
                                    </div>
                                )}

                                {conflictData.localRecord.description && (
                                    <div>
                                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[2px] mb-1">
                                            {t('description') || "DESCRIPTION"}
                                        </p>
                                        <p className="text-xs text-[var(--text-main)] opacity-80 line-clamp-2">
                                            {conflictData.localRecord.description}
                                        </p>
                                    </div>
                                )}

                                <div className="pt-2 border-t border-[var(--border)]/30">
                                    <p className="text-[9px] font-mono text-[var(--text-muted)]">
                                        {formatDate(conflictData.localRecord.updatedAt)}
                                    </p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Remote Device Card */}
                        <motion.div
                            whileHover={{ scale: 1.02, y: -2 }}
                            onClick={() => setSelectedVersion('remote')}
                            className={cn(
                                "relative p-6 rounded-[24px] border-2 cursor-pointer transition-all duration-300",
                                selectedVersion === 'remote' 
                                    ? "border-orange-500 bg-orange-500/5 shadow-lg shadow-orange-500/20" 
                                    : "border-[var(--border)] bg-[var(--bg-app)] hover:border-orange-500/30"
                            )}
                        >
                            {selectedVersion === 'remote' && (
                                <div className="absolute top-4 right-4 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                                    <Check size={14} className="text-white" />
                                </div>
                            )}
                            
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-purple-500/10 rounded-[16px] text-purple-500 flex items-center justify-center">
                                    <Zap size={18} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-[var(--text-main)] uppercase tracking-tighter">
                                        {t('other_device') || "OTHER DEVICE"}
                                    </h3>
                                    <p className="text-[9px] font-bold text-purple-500 uppercase tracking-[2px] mt-0.5">
                                        {t('remote_version') || "REMOTE"}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {conflictData.remoteRecord.name && (
                                    <div>
                                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[2px] mb-1">
                                            {t('name') || "NAME"}
                                        </p>
                                        <p className="text-sm font-black text-[var(--text-main)] truncate">
                                            {conflictData.remoteRecord.name}
                                        </p>
                                    </div>
                                )}

                                {conflictData.remoteRecord.amount !== undefined && (
                                    <div>
                                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[2px] mb-1">
                                            {t('amount') || "AMOUNT"}
                                        </p>
                                        <p className="text-lg font-black text-[var(--text-main)]">
                                            {toBn(conflictData.remoteRecord.amount, language)}
                                        </p>
                                    </div>
                                )}

                                {conflictData.remoteRecord.description && (
                                    <div>
                                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[2px] mb-1">
                                            {t('description') || "DESCRIPTION"}
                                        </p>
                                        <p className="text-xs text-[var(--text-main)] opacity-80 line-clamp-2">
                                            {conflictData.remoteRecord.description}
                                        </p>
                                    </div>
                                )}

                                <div className="pt-2 border-t border-[var(--border)]/30">
                                    <p className="text-[9px] font-mono text-[var(--text-muted)]">
                                        {formatDate(conflictData.remoteRecord.updatedAt)}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                        <button
                            onClick={closeModal}
                            className="flex-1 px-6 py-3 rounded-[20px] bg-[var(--bg-app)] border border-[var(--border)] text-[var(--text-muted)] font-black uppercase tracking-[2px] hover:bg-[var(--border)]/20 transition-all"
                        >
                            {t('cancel') || "CANCEL"}
                        </button>
                        <button
                            onClick={handleResolveConflict}
                            disabled={!selectedVersion || isResolving}
                            className={cn(
                                "flex-1 px-6 py-3 rounded-[20px] font-black uppercase tracking-[2px] transition-all",
                                selectedVersion && !isResolving
                                    ? "bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-500/30"
                                    : "bg-[var(--bg-app)] border border-[var(--border)] text-[var(--text-muted)] opacity-50 cursor-not-allowed"
                            )}
                        >
                            {isResolving ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    {t('resolving') || "RESOLVING..."}
                                </div>
                            ) : (
                                (t('resolve_conflict') || "RESOLVE CONFLICT")
                            )}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
