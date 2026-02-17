"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Cloud, Save } from 'lucide-react';
import { cn, toBn } from '@/lib/utils/helpers';
import { useConflictStore } from '@/lib/vault/ConflictStore';
import { mapConflictType } from '@/lib/vault/ConflictMapper';

interface ConflictResolverModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: any; // Book or Entry record with serverData
  type: 'book' | 'entry';
  conflictType?: 'version' | 'parent_deleted'; // 🛡️ NEW: Conflict type discriminator
  pendingChildrenCount?: number; // 🛡️ NEW: Child count for display
  onResolve: (resolution: 'local' | 'server') => void;
}

/**
 * 🚨 CONFLICT RESOLUTION ENGINE (V1.0)
 * ----------------------------------------
 * Industrial-grade conflict resolution with side-by-side comparison
 * Glassmorphism design with Red/White accents
 */
export const ConflictResolverModal: React.FC<ConflictResolverModalProps> = ({
  isOpen,
  onClose,
  record,
  type,
  conflictType, // 🛡️ NEW: Conflict type discriminator
  pendingChildrenCount, // 🛡️ NEW: Child count for display
  onResolve
}) => {
  const [isResolving, setIsResolving] = useState(false);
  const { addPendingResolution } = useConflictStore();

  if (!isOpen || !record) return null;

  const localData = {
    name: record.name || record.title || 'Untitled',
    description: record.description || '',
    amount: record.amount || 0,
    type: record.type || 'expense',
    phone: record.phone || '',
    status: record.status || 'unknown',
    updatedAt: record.updatedAt || new Date().toISOString(),
    vKey: record.vKey || 0
  };

  const serverData = record.serverData || {};
  const serverDisplay = {
    name: serverData.name || serverData.title || 'Untitled',
    description: serverData.description || '',
    amount: serverData.amount || 0,
    type: serverData.type || 'expense',
    phone: serverData.phone || '',
    status: serverData.status || 'unknown',
    updatedAt: serverData.updatedAt || new Date().toISOString(),
    vKey: serverData.vKey || 0
  };

  const handleResolution = async (resolution: 'local' | 'server') => {
    setIsResolving(true);
    try {
      // Create conflict item using mapper
      const conflictItem = {
        type: type,
        cid: record.cid,
        localId: record.localId,
        record: record,
        conflictType: mapConflictType(record.conflictReason)
      };
      
      // Add to store's pending resolutions
      addPendingResolution(conflictItem, resolution);
      onClose(); // Close modal immediately
    } catch (error) {
      console.error('Failed to queue resolution:', error);
    } finally {
      setIsResolving(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Unknown date';
    }
  };

  const formatAmount = (amount: number) => {
    if (type === 'entry') {
      return toBn(Math.abs(amount), 'en');
    }
    return amount;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-6xl max-h-[90vh] bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl shadow-red-500/20 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10 bg-linear-to-r from-red-500/10 to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-500/20 rounded-2xl flex items-center justify-center border border-red-500/30">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  {/* PARENT-DELETED SPECIFIC WARNING */}
                  {conflictType === 'parent_deleted' ? (
                    <>
                      <h2 className="text-xl font-bold text-white">Ledger Deleted Remotely</h2>
                      <p className="text-sm text-white/60">
                        You have {pendingChildrenCount || 0} pending local entries. Choose your resolution:
                      </p>
                    </>
                  ) : (
                    <>
                      <h2 className="text-xl font-bold text-white">Data Conflict Detected</h2>
                      <p className="text-sm text-white/60">
                        {type === 'book' ? 'Book' : 'Entry'} version mismatch requires manual resolution
                      </p>
                    </>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white/60 hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Side - Local Version */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                      <Save className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">Your Version</h3>
                      <p className="text-sm text-white/60">Local changes</p>
                    </div>
                  </div>

                  <div className="space-y-3 p-4 bg-white/5 border border-white/10 rounded-2xl">
                    {/* Common Fields */}
                    <div className="space-y-2">
                      <div>
                        <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Name</label>
                        <p className="text-white font-medium">{localData.name}</p>
                      </div>

                      {type === 'book' && (
                        <div>
                          <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Phone</label>
                          <p className="text-white font-medium">{localData.phone || 'Not set'}</p>
                        </div>
                      )}

                      {type === 'entry' && (
                        <>
                          <div>
                            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Type</label>
                            <p className="text-white font-medium capitalize">{localData.type}</p>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Amount</label>
                            <p className="text-white font-medium">
                              {localData.amount < 0 ? '-' : '+'}
                              {formatAmount(localData.amount)}
                            </p>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Status</label>
                            <p className="text-white font-medium capitalize">
                              {localData.status || 'unknown'}
                            </p>
                          </div>
                        </>
                      )}

                      <div>
                        <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Description</label>
                        <p className="text-white/80 text-sm">
                          {localData.description || 'No description'}
                        </p>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Last Modified</label>
                        <p className="text-white/60 text-sm">
                          {formatDate(localData.updatedAt)}
                        </p>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Version</label>
                        <p className="text-white/60 text-sm font-mono">v{localData.vKey}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side - Server Version */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl">
                    <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                      <Cloud className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">Server Version</h3>
                      <p className="text-sm text-white/60">Cloud data</p>
                    </div>
                  </div>

                  <div className="space-y-3 p-4 bg-white/5 border border-white/10 rounded-2xl">
                    {/* Common Fields */}
                    <div className="space-y-2">
                      <div>
                        <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Name</label>
                        <p className="text-white font-medium">{serverDisplay.name}</p>
                      </div>

                      {type === 'book' && (
                        <div>
                          <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Phone</label>
                          <p className="text-white font-medium">{serverDisplay.phone || 'Not set'}</p>
                        </div>
                      )}

                      {type === 'entry' && (
                        <>
                          <div>
                            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Type</label>
                            <p className="text-white font-medium capitalize">{serverDisplay.type}</p>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Amount</label>
                            <p className="text-white font-medium">
                              {serverDisplay.amount < 0 ? '-' : '+'}
                              {formatAmount(serverDisplay.amount)}
                            </p>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Status</label>
                            <p className="text-white font-medium capitalize">
                              {serverDisplay.status || 'unknown'}
                            </p>
                          </div>
                        </>
                      )}

                      <div>
                        <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Description</label>
                        <p className="text-white/80 text-sm">
                          {serverDisplay.description || 'No description'}
                        </p>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Last Modified</label>
                        <p className="text-white/60 text-sm">
                          {formatDate(serverDisplay.updatedAt)}
                        </p>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Version</label>
                        <p className="text-white/60 text-sm font-mono">v{serverDisplay.vKey}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between p-6 border-t border-white/10 bg-linear-to-r from-transparent to-red-500/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Choose Resolution</p>
                  <p className="text-xs text-white/60">This action cannot be undone</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* PARENT-DELETED SPECIFIC ACTIONS */}
                {conflictType === 'parent_deleted' ? (
                  <>
                    {/* PARENT-DELETED SPECIFIC ACTIONS */}
                    <button
                      onClick={() => handleResolution('local')}
                      disabled={isResolving}
                      className="flex items-center gap-2 px-6 py-3 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-xl font-semibold hover:bg-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="w-4 h-4" />
                      Keep Local & Restore
                    </button>

                    {/* Option B: Confirm Remote Deletion */}
                    <button
                      onClick={() => handleResolution('server')}
                      disabled={isResolving}
                      className="flex items-center gap-2 px-6 py-3 bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl font-semibold hover:bg-red-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      Confirm Remote Deletion
                    </button>
                  </>
                ) : (
                  <>
                    {/* Default Version Conflict Actions */}
                    <button
                      onClick={() => handleResolution('local')}
                      disabled={isResolving}
                      className="flex items-center gap-2 px-6 py-3 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-xl font-semibold hover:bg-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="w-4 h-4" />
                      Keep My Version
                    </button>

                    <button
                      onClick={() => handleResolution('server')}
                      disabled={isResolving}
                      className="flex items-center gap-2 px-6 py-3 bg-green-500/20 border border-green-500/30 text-green-400 rounded-xl font-semibold hover:bg-green-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Cloud className="w-4 h-4" />
                      Accept Cloud Version
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConflictResolverModal;
