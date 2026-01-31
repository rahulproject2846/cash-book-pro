"use client";
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    Layers, Globe, Bell, ShieldCheck, Database, 
    RefreshCcw, Plus, X, Loader2, Lock, Cpu, 
    Activity, HardDrive, Zap, ChevronDown, 
    AlertCircle, Smartphone, LayoutTemplate
} from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';

export const SettingsSection = ({ currentUser, setCurrentUser }: any) => {
    const {
        categories, currency, preferences, dbStats,
        isLoading, isCleaning,
        addCategory, removeCategory, updatePreference, updateCurrency, clearLocalCache
    } = useSettings(currentUser, setCurrentUser);

    const [newCat, setNewCat] = useState('');
    
    // লোকাল বাফার স্টেট (যাতে টাইপ করার সময় বারবার এপিআই কল না যায়)
    const [limitBuffer, setLimitBuffer] = useState(preferences?.expenseLimit || 0);

    // ইনপুট থেকে বের হলে (onBlur) সেভ হবে
    const saveLimit = () => {
        if (limitBuffer !== preferences.expenseLimit) {
            updatePreference('expenseLimit', Number(limitBuffer));
        }
    };

    const handleAddCat = () => {
        if (newCat) {
            addCategory(newCat);
            setNewCat('');
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto space-y-8 pb-32 px-2">
            
            {/* --- HEADER --- */}
            <div className="flex flex-col md:flex-row justify-between items-end border-b border-[var(--border-color)] pb-8 gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[3px] text-[var(--text-muted)]">Configuration Port</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black text-[var(--text-main)] uppercase tracking-tighter italic leading-none">
                        System Engine<span className="text-orange-500">.</span>
                    </h2>
                </div>
                {isLoading && (
                    <div className="flex items-center gap-3 text-orange-500 text-[10px] font-black uppercase tracking-widest bg-orange-500/5 px-5 py-2.5 rounded-2xl border border-orange-500/20 shadow-sm animate-pulse">
                        <RefreshCcw size={14} className="animate-spin" /> Protocols Syncing...
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* --- LEFT COLUMN: IDENTITY & HEALTH --- */}
                <div className="space-y-8">
                    {/* Identity Snapshot */}
                    <div className="app-card p-1 bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-app)] border-[var(--border-color)] relative group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500 opacity-50" />
                        <div className="p-7">
                            <div className="flex items-center justify-between mb-6">
                                <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500 border border-blue-500/20">
                                    <ShieldCheck size={20} />
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-widest text-green-500 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">Verified Operator</span>
                            </div>
                            <h3 className="text-2xl font-black text-[var(--text-main)] uppercase tracking-tight">{currentUser?.username || "Unknown"}</h3>
                            <p className="text-[10px] font-bold text-[var(--text-muted)] mt-1 tracking-widest">{currentUser?.email}</p>
                            
                            <div className="mt-8 pt-6 border-t border-[var(--border-color)] flex justify-between items-center group-hover:opacity-100 transition-opacity">
                                <span className="text-[9px] font-black uppercase tracking-[3px] text-[var(--text-muted)]">Security Level: High</span>
                                <Lock size={14} className="text-[var(--text-muted)]" />
                            </div>
                        </div>
                    </div>

                    {/* Vault Health Monitor */}
                    <div className="app-card p-8 relative overflow-hidden">
                        <h4 className="text-xs font-black text-[var(--text-main)] uppercase tracking-[2px] flex items-center gap-3 mb-6">
                            <Activity size={18} className="text-green-500" /> Vault Health
                        </h4>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-4 bg-[var(--bg-app)] rounded-2xl border border-[var(--border-color)]">
                                <div className="flex items-center gap-3">
                                    <HardDrive size={16} className="text-[var(--text-muted)]" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Local Storage</span>
                                </div>
                                <span className="text-xs font-black text-[var(--text-main)] font-mono">{dbStats.storageUsed}</span>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-[var(--bg-app)] rounded-2xl border border-[var(--border-color)]">
                                <div className="flex items-center gap-3">
                                    <Database size={16} className="text-[var(--text-muted)]" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Total Records</span>
                                </div>
                                <span className="text-xs font-black text-[var(--text-main)] font-mono">{dbStats.totalEntries}</span>
                            </div>
                        </div>
                        <div className="mt-6 text-center">
                            <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Last Synced: {dbStats.lastSync}</p>
                        </div>
                    </div>
                </div>

                {/* --- RIGHT COLUMN: SETTINGS CONTROLS --- */}
                <div className="lg:col-span-2 space-y-8">
                    
                    {/* 1. FINANCIAL GOVERNANCE (Tags + Limits) */}
                    <div className="app-card p-8 border-l-4 border-orange-500 relative overflow-hidden">
                        <div className="absolute -right-6 -top-6 opacity-[0.03] rotate-12"><Layers size={200} /></div>
                        
                        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Tag Manager */}
                            <div className="space-y-6">
                                <h4 className="text-xs font-black text-[var(--text-main)] uppercase tracking-[2px] flex items-center gap-3">
                                    <Cpu size={18} className="text-orange-500" /> Registry Tags
                                </h4>
                                <div className="flex gap-2">
                                    <input 
                                        className="app-input flex-1 h-12 text-[10px] font-black uppercase tracking-widest" 
                                        placeholder="NEW TAG..." 
                                        value={newCat}
                                        onChange={(e) => setNewCat(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddCat()}
                                    />
                                    <button onClick={handleAddCat} className="bg-orange-500 text-white w-12 rounded-xl flex items-center justify-center hover:bg-orange-600 active:scale-90 transition-all shadow-lg">
                                        <Plus size={20} strokeWidth={3} />
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto no-scrollbar">
                                    {categories.map(cat => (
                                        <div key={cat} className="flex items-center gap-2 bg-[var(--bg-app)] border border-[var(--border-color)] px-3 py-2 rounded-lg group hover:border-orange-500/50 transition-all">
                                            <span className="text-[9px] font-black uppercase text-[var(--text-muted)] group-hover:text-[var(--text-main)]">{cat}</span>
                                            <button onClick={() => removeCategory(cat)} className="text-slate-500 hover:text-red-500"><X size={12} /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Expense & Currency Control */}
                            <div className="space-y-6">
                                {/* Expense Threshold */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-black text-[var(--text-main)] uppercase tracking-[2px] flex items-center gap-3">
                                        <AlertCircle size={18} className="text-red-500" /> Alert Threshold
                                    </h4>
                                    <div className="relative">
                                        <input 
                                            type="number"
                                            className="app-input h-12 pl-4 pr-4 text-xs font-bold text-[var(--text-main)] border-red-500/30 focus:border-red-500 bg-red-500/[0.02]" 
                                            value={limitBuffer}
                                            onChange={(e) => setLimitBuffer(Number(e.target.value))}
                                            onBlur={saveLimit}
                                            placeholder="Set Limit"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-red-500 uppercase tracking-widest opacity-50">Monthly Cap</span>
                                    </div>
                                </div>

                                {/* Currency Dropdown (Fixed) */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-black text-[var(--text-main)] uppercase tracking-[2px] flex items-center gap-3">
                                        <Globe size={18} className="text-blue-500" /> Base Currency
                                    </h4>
                                    <div className="relative">
                                        <select 
                                            value={currency}
                                            onChange={(e) => updateCurrency(e.target.value)}
                                            className="app-input h-12 pl-4 pr-10 text-[10px] font-black uppercase tracking-widest appearance-none cursor-pointer bg-[var(--bg-app)] hover:border-blue-500 transition-all"
                                        >
                                            <option className="bg-[#1A1A1B]">BDT (৳)</option>
                                            <option className="bg-[#1A1A1B]">USD ($)</option>
                                            <option className="bg-[#1A1A1B]">EUR (€)</option>
                                            <option className="bg-[#1A1A1B]">INR (₹)</option>
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 opacity-50 pointer-events-none text-[var(--text-muted)]" size={16} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. EXPERIENCE CUSTOMIZATION (New Section) */}
                    <div className="app-card p-8">
                        <h4 className="text-xs font-black text-[var(--text-main)] uppercase tracking-[2px] flex items-center gap-3 mb-6">
                            <LayoutTemplate size={18} className="text-purple-500" /> Experience Control
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* View Density */}
                            <div className="flex items-center justify-between p-4 bg-[var(--bg-app)] rounded-2xl border border-[var(--border-color)]">
                                <div className="flex items-center gap-3">
                                    <Smartphone size={16} className="text-[var(--text-muted)]" />
                                    <span className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-wider">Compact View</span>
                                </div>
                                <button 
                                    onClick={() => updatePreference('compactMode', !preferences.compactMode)}
                                    className={`w-10 h-5 rounded-full relative transition-all duration-300 ${preferences.compactMode ? 'bg-purple-600' : 'bg-slate-700'}`}
                                >
                                    <div className={`w-3 h-3 bg-white rounded-full absolute top-1 shadow-md transition-all duration-300 ${preferences.compactMode ? 'right-1' : 'left-1'}`}></div>
                                </button>
                            </div>

                            {/* Auto Lock */}
                            <div className="flex items-center justify-between p-4 bg-[var(--bg-app)] rounded-2xl border border-[var(--border-color)]">
                                <div className="flex items-center gap-3">
                                    <Lock size={16} className="text-[var(--text-muted)]" />
                                    <span className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-wider">Auto-Lock Session</span>
                                </div>
                                <button 
                                    onClick={() => updatePreference('autoLock', !preferences.autoLock)}
                                    className={`w-10 h-5 rounded-full relative transition-all duration-300 ${preferences.autoLock ? 'bg-orange-500' : 'bg-slate-700'}`}
                                >
                                    <div className={`w-3 h-3 bg-white rounded-full absolute top-1 shadow-md transition-all duration-300 ${preferences.autoLock ? 'right-1' : 'left-1'}`}></div>
                                </button>
                            </div>

                            {/* Notification Toggles */}
                            <div className="flex items-center justify-between p-4 bg-[var(--bg-app)] rounded-2xl border border-[var(--border-color)]">
                                <div className="flex items-center gap-3">
                                    <Bell size={16} className="text-[var(--text-muted)]" />
                                    <span className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-wider">Daily Briefing</span>
                                </div>
                                <button 
                                    onClick={() => updatePreference('dailyReminder', !preferences.dailyReminder)}
                                    className={`w-10 h-5 rounded-full relative transition-all duration-300 ${preferences.dailyReminder ? 'bg-green-500' : 'bg-slate-700'}`}
                                >
                                    <div className={`w-3 h-3 bg-white rounded-full absolute top-1 shadow-md transition-all duration-300 ${preferences.dailyReminder ? 'right-1' : 'left-1'}`}></div>
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    {/* 3. DANGER ZONE (Clean Cache) */}
                    <div className="app-card p-8 border-dashed border-2 border-red-500/20 bg-red-500/[0.02]">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-red-500/10 rounded-2xl text-red-500">
                                    <Zap size={24} />
                                </div>
                                <div>
                                    <h4 className="text-xs font-black text-red-500 uppercase tracking-[2px]">Hard Reset Protocol</h4>
                                    <p className="text-[9px] font-bold text-[var(--text-muted)] mt-1 uppercase tracking-widest opacity-60">Clears local cache & re-syncs from cloud</p>
                                </div>
                            </div>
                            <button 
                                onClick={clearLocalCache}
                                disabled={isCleaning}
                                className="px-8 py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-500/20 transition-all active:scale-95 flex items-center gap-2"
                            >
                                {isCleaning ? <Loader2 size={14} className="animate-spin" /> : "PURGE CACHE"}
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </motion.div>
    );
};