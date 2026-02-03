"use client";
import React from 'react';
import { HardDrive, Upload, Download, Loader2, Database } from 'lucide-react';

export const DataSovereignty = ({ exportMasterData, importMasterData, importInputRef, isExporting }: any) => {
    return (
        <div className="app-card p-8 border-dashed border-2 border-[var(--border-color)] bg-[var(--bg-app)]/30 flex flex-col md:flex-row justify-between items-center gap-8 group">
            <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-[var(--bg-card)] rounded-[24px] border border-[var(--border-color)] flex items-center justify-center text-orange-500 shadow-xl group-hover:rotate-6 transition-transform">
                    <Database size={28} strokeWidth={2.5} />
                </div>
                <div className="text-center md:text-left">
                    <h4 className="text-sm font-black text-[var(--text-main)] uppercase tracking-[2px]">Data Sovereignty</h4>
                    <p className="text-[10px] font-bold text-[var(--text-muted)] mt-1.5 uppercase tracking-[1px] opacity-60 leading-relaxed">Backup your protocol archives locally.</p>
                </div>
            </div>
            
            <div className="flex gap-4 w-full md:w-auto">
                <button 
                    onClick={() => importInputRef.current?.click()} 
                    disabled={isExporting} 
                    className="flex-1 md:flex-none px-8 py-4 rounded-2xl border-2 border-[var(--border-color)] hover:border-blue-500 hover:text-blue-500 text-[var(--text-muted)] font-black text-[9px] uppercase tracking-[2px] transition-all flex items-center justify-center gap-3 active:scale-95"
                >
                    <Upload size={16} /> Restore
                </button>
                <input type="file" ref={importInputRef} onChange={importMasterData} accept=".json" className="hidden" />

                <button 
                    onClick={exportMasterData} 
                    disabled={isExporting} 
                    className="flex-1 md:flex-none px-8 py-4 rounded-2xl bg-[var(--text-main)] text-[var(--bg-app)] font-black text-[9px] uppercase tracking-[2px] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 shadow-xl"
                >
                    {isExporting ? <Loader2 size={16} className="animate-spin" /> : <><Download size={16} /> Backup</>}
                </button>
            </div>
        </div>
    );
};