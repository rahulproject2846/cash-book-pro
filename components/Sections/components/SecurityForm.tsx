"use client";
import React, { useState } from 'react';
import { KeyRound, Loader2, ShieldCheck, Moon, Sun } from 'lucide-react';

export const SecurityForm = ({ formData, setForm, updateProfile, currentUser, isLoading }: any) => {
    const [isMidnight, setIsMidnight] = useState(false);

    const toggleMidnight = () => {
        setIsMidnight(!isMidnight);
        if (!isMidnight) {
            document.documentElement.style.setProperty('--bg-app', '#000000');
            document.documentElement.style.setProperty('--bg-card', '#080808');
        } else {
            document.documentElement.style.setProperty('--bg-app', '#0F0F0F');
            document.documentElement.style.setProperty('--bg-card', '#1A1A1B');
        }
    };

    return (
        <div className="app-card p-8 bg-[var(--bg-card)] shadow-2xl border-[var(--border-color)]">
            <div className="flex justify-between items-center mb-8">
                <h4 className="text-xs font-black text-[var(--text-main)] uppercase tracking-[3px] italic flex items-center gap-3">
                    <ShieldCheck size={18} className="text-orange-500" /> Security Protocol
                </h4>
                
                {/* AMOLED Midnight Toggle */}
                <button 
                    onClick={toggleMidnight}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${isMidnight ? 'bg-orange-500 border-orange-500 text-white shadow-lg' : 'bg-transparent border-[var(--border)] text-[var(--text-muted)]'}`}
                >
                    {isMidnight ? <Moon size={12} fill="currentColor" /> : <Sun size={12} />}
                    <span className="text-[8px] font-black uppercase tracking-widest">{isMidnight ? 'Midnight ON' : 'Midnight OFF'}</span>
                </button>
            </div>
            
            <form onSubmit={updateProfile} className="space-y-8">
                <div className="space-y-3">
                    <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Identity Name</label>
                    <input type="text" className="app-input h-14 font-black uppercase text-sm tracking-widest bg-[var(--bg-app)] border-2 border-[var(--border-color)] focus:border-orange-500/40" value={formData.name} onChange={(e) => setForm({...formData, name: e.target.value})} />
                </div>

                {currentUser?.authProvider === 'credentials' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-[var(--border-color)]/30">
                        <div className="space-y-3">
                            <label className="text-[9px] font-black text-orange-500 uppercase tracking-widest ml-1 flex items-center gap-2"><KeyRound size={12} /> Current Key</label>
                            <input type="password" placeholder="••••••••" className="app-input h-14 font-mono border-orange-500/20 focus:border-orange-500 bg-[var(--bg-app)]" value={formData.currentPassword} onChange={(e) => setForm({...formData, currentPassword: e.target.value})} />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">New Key (Optional)</label>
                            <input type="password" placeholder="••••••••" className="app-input h-14 font-mono bg-[var(--bg-app)] border-[var(--border-color)]" value={formData.newPassword} onChange={(e) => setForm({...formData, newPassword: e.target.value})} />
                        </div>
                    </div>
                )}

                <button disabled={isLoading} className="app-btn-primary w-full py-5 text-[10px] font-black tracking-[4px] uppercase border-none text-white shadow-2xl">
                    {isLoading ? <Loader2 size={18} className="animate-spin mx-auto" /> : "Save Security Updates"}
                </button>
            </form>
        </div>
    );
};