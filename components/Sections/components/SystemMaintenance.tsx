"use client";
import React from 'react';
import { Activity, HardDrive, Database, Zap, Loader2, KeyRound } from 'lucide-react';

export const SystemMaintenance = ({ dbStats, clearLocalCache, isCleaning }: any) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Storage Health */}
            <div className="lg:col-span-1 app-card p-8 bg-[var(--bg-card)] border border-[var(--border-color)]">
                <h4 className="text-xs font-black text-[var(--text-main)] uppercase tracking-[3px] italic flex items-center gap-3 mb-8">
                    <Activity size={18} className="text-green-500" /> Hardware Health
                </h4>
                <div className="space-y-4">
                    <div className="p-4 bg-[var(--bg-app)] rounded-2xl border border-[var(--border-color)] flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <HardDrive size={16} className="text-[var(--text-muted)]" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Data Weight</span>
                        </div>
                        <span className="text-xs font-black text-orange-500 font-mono">{dbStats.storageUsed}</span>
                    </div>
                    <div className="p-4 bg-[var(--bg-app)] rounded-2xl border border-[var(--border-color)] flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <Database size={16} className="text-[var(--text-muted)]" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Local Registry</span>
                        </div>
                        <span className="text-xs font-black text-orange-500 font-mono">{dbStats.totalEntries} UNITs</span>
                    </div>
                </div>
            </div>

            {/* Master Key Recovery (Placeholder for future) */}
            <div className="lg:col-span-1 app-card p-8 bg-[var(--bg-card)] border border-[var(--border-color)]">
                <h4 className="text-xs font-black text-[var(--text-main)] uppercase tracking-[3px] italic flex items-center gap-3 mb-8">
                    <KeyRound size={18} className="text-blue-500" /> Recovery Protocol
                </h4>
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase leading-relaxed mb-6">Generate an offline recovery hash for your local vault.</p>
                <button className="w-full py-4 rounded-xl border-2 border-dashed border-blue-500/30 text-blue-500 text-[10px] font-black uppercase tracking-widest hover:bg-blue-500/5 transition-all">
                    Generate Master Key
                </button>
            </div>

            {/* Purge / Danger Zone */}
            <div className="lg:col-span-1 app-card p-8 bg-red-500/[0.01] border-2 border-dashed border-red-500/20">
                <h4 className="text-xs font-black text-red-500 uppercase tracking-[3px] italic flex items-center gap-3 mb-8">
                    <Zap size={18} /> Hard Reset
                </h4>
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase leading-relaxed mb-6">Purges local cache and forces a fresh cloud re-synchronization.</p>
                <button 
                    onClick={clearLocalCache}
                    disabled={isCleaning}
                    className="w-full py-4 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-[3px] shadow-xl shadow-red-500/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                    {isCleaning ? <Loader2 size={16} className="animate-spin" /> : "Purge Protocol"}
                </button>
            </div>
        </div>
    );
};