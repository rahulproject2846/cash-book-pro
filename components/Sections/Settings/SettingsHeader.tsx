"use client";
import React from 'react';
import { RefreshCcw, Zap } from 'lucide-react';

export const SettingsHeader = ({ isLoading }: { isLoading: boolean }) => {
    return (
        <div className="flex flex-col md:flex-row justify-between items-end border-b border-[var(--border-color)] pb-8 mt-6 gap-4">
            <div>
                <div className="flex items-center gap-3 mb-3">
                    {/* Sync Pulse Indicator */}
                    <div className="relative flex h-3 w-3">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75 ${isLoading ? 'opacity-100' : 'hidden'}`}></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[4px] text-orange-500">System Engine Active</span>
                </div>
                <h2 className="text-4xl md:text-6xl font-black text-[var(--text-main)] uppercase tracking-tighter italic leading-none">
                    Configuration<span className="text-orange-500">.</span>
                </h2>
            </div>
            
            <div className="flex items-center gap-4 bg-[var(--bg-card)] px-6 py-3 rounded-2xl border border-[var(--border-color)] shadow-xl">
                <div className="flex flex-col items-end">
                    <span className="text-[8px] font-black uppercase tracking-widest text-[var(--text-muted)]">Core Status</span>
                    <span className="text-[10px] font-black uppercase text-green-500 tracking-widest">Protocol 100% Synced</span>
                </div>
                <Zap size={18} className="text-orange-500" fill="currentColor" />
            </div>
        </div>
    );
};