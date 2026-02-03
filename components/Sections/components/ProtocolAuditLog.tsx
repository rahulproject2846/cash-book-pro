"use client";
import React from 'react';
import { History, Shield, Clock, HardDrive } from 'lucide-react';

export const ProtocolAuditLog = () => {
    // Mock data for Security Audit
    const logs = [
        { event: 'Identity Hash Updated', time: 'Just Now', icon: Shield, color: 'text-blue-500' },
        { event: 'Master Backup Exported', time: '2 hours ago', icon: HardDrive, color: 'text-orange-500' },
        { event: 'Security Session Verified', time: 'Yesterday', icon: Clock, color: 'text-green-500' },
    ];

    return (
        <div className="app-card p-8 bg-[var(--bg-card)] shadow-2xl border-[var(--border-color)]">
            <h4 className="text-xs font-black text-[var(--text-main)] uppercase tracking-[3px] italic mb-8 flex items-center gap-3">
                <History size={18} className="text-orange-500" /> Security Audit Log
            </h4>

            <div className="space-y-6">
                {logs.map((log, i) => (
                    <div key={i} className="flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl bg-[var(--bg-app)] border border-[var(--border-color)] flex items-center justify-center ${log.color} shadow-inner`}>
                                <log.icon size={16} />
                            </div>
                            <div>
                                <p className="text-[11px] font-black text-[var(--text-main)] uppercase tracking-widest">{log.event}</p>
                                <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase mt-1 opacity-50">{log.time}</p>
                            </div>
                        </div>
                        <div className="h-1 w-1 rounded-full bg-orange-500 opacity-20 group-hover:opacity-100 transition-opacity" />
                    </div>
                ))}
            </div>
            
            <div className="mt-8 pt-6 border-t border-[var(--border-color)]/30 text-center">
                <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-[2px]">Only visible on this device node</p>
            </div>
        </div>
    );
};