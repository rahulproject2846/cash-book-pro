"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
    Layers, Globe, Bell, ShieldCheck, Database, 
    CreditCard, RefreshCcw, Plus, X, Download, Loader2, 
    Lock, Cpu, Activity, Layout,ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';

export const SettingsSection = ({ currentUser, setCurrentUser }: any) => {
    // ১. লোকাল স্টেট ম্যানেজমেন্ট (ইনিশিয়াল ডাটা প্রোফাইল থেকে নেওয়া)
    const defaultCats = ['General', 'Salary', 'Food', 'Rent', 'Shopping', 'Loan'];
    
    const [categories, setCategories] = useState<string[]>(currentUser?.categories || defaultCats);
    const [currency, setCurrency] = useState(currentUser?.currency || 'BDT (৳)');
    const [preferences, setPreferences] = useState(currentUser?.preferences || {
        dailyReminder: false,
        weeklyReports: false,
        highExpenseAlert: false
    });

    const [newCat, setNewCat] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // ২. ক্লাউড সিঙ্ক প্রোটোকল (API Call)
    const syncWithVault = async (updatedCats: string[], updatedCurr: string, updatedPref: any) => {
        setIsSaving(true);
        try {
            const res = await fetch('/api/user/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    userId: currentUser._id, 
                    categories: updatedCats, 
                    currency: updatedCurr, 
                    preferences: updatedPref 
                }),
            });
            
            const data = await res.json();
            if (res.ok) {
                // গ্লোবাল স্টেট এবং লোকাল স্টোরেজ আপডেট
                setCurrentUser(data.user);
                localStorage.setItem('cashbookUser', JSON.stringify(data.user));
                toast.success("System Synchronized", { icon: '⚙️' });
            } else {
                throw new Error();
            }
        } catch (error) {
            toast.error("Sync Protocol Failed");
        } finally {
            setIsSaving(false);
        }
    };

    // ৩. অ্যাকশন হ্যান্ডলার্স
    const addCategory = () => {
        const trimmed = newCat.trim().toUpperCase();
        if (!trimmed) return;
        if (categories.includes(trimmed)) return toast.error("Tag already exists");
        const newList = [...categories, trimmed];
        setCategories(newList);
        setNewCat('');
        syncWithVault(newList, currency, preferences);
    };

    const removeCategory = (name: string) => {
        const newList = categories.filter(c => c !== name);
        setCategories(newList);
        syncWithVault(newList, currency, preferences);
    };

    const togglePreference = (key: string) => {
        const newPref = { ...preferences, [key]: !preferences[key as keyof typeof preferences] };
        setPreferences(newPref);
        syncWithVault(categories, currency, newPref);
    };

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto space-y-8 pb-24 px-1">
            
            {/* --- SYSTEM HEADER --- */}
            <div className="flex justify-between items-end border-b border-[var(--border-color)] pb-8">
                <div>
                    <h2 className="text-3xl md:text-5xl font-black text-[var(--text-main)] uppercase tracking-tighter italic leading-none">System Engine</h2>
                    <p className="text-[10px] font-bold text-orange-500 uppercase tracking-[4px] mt-3">Configuration & Core Protocols</p>
                </div>
                {isSaving && (
                    <div className="flex items-center gap-3 text-orange-500 text-[10px] font-black uppercase tracking-widest bg-orange-500/5 px-5 py-2.5 rounded-2xl border border-orange-500/20 shadow-sm animate-pulse">
                        <RefreshCcw size={14} className="animate-spin" /> Syncing...
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                <div className="lg:col-span-2 space-y-8">
                    {/* 1. TRANSACTION TAGS (Category Manager) */}
                    <div className="app-card p-8 border-l-4 border-orange-500 relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                            <Layers size={150} />
                        </div>
                        <h4 className="text-xs font-black text-[var(--text-main)] uppercase tracking-[2px] flex items-center gap-3 mb-8 relative z-10">
                            <Cpu size={18} className="text-orange-500" /> Registry Tags
                        </h4>
                        <div className="space-y-6 relative z-10">
                            <div className="flex gap-3">
                                <input 
                                    className="app-input flex-1 h-14 text-xs font-black uppercase tracking-widest placeholder:opacity-30" 
                                    placeholder="Enter new protocol tag..." 
                                    value={newCat}
                                    onChange={(e) => setNewCat(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                                />
                                <button onClick={addCategory} className="bg-orange-500 text-white px-8 rounded-2xl hover:bg-orange-600 active:scale-90 transition-all shadow-lg shadow-orange-500/20">
                                    <Plus size={24} strokeWidth={3} />
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2.5">
                                {categories.map(cat => (
                                    <div key={cat} className="flex items-center gap-3 bg-[var(--bg-app)] border border-[var(--border-color)] pl-4 pr-2 py-2 rounded-xl group/tag hover:border-orange-500/50 transition-all shadow-sm">
                                        <span className="text-[10px] font-black uppercase text-[var(--text-muted)] group-hover/tag:text-[var(--text-main)]">{cat}</span>
                                        <button onClick={() => removeCategory(cat)} className="p-1 rounded-lg text-slate-500 hover:bg-red-500/10 hover:text-red-500 transition-all">
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 2. REGIONAL SETTINGS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="app-card p-8 relative overflow-hidden group">
                            <h4 className="text-xs font-black text-[var(--text-main)] uppercase tracking-[2px] flex items-center gap-3 mb-6">
                                <Globe size={18} className="text-blue-500" /> Currency Port
                            </h4>
                            <div className="relative">
                                <select 
                                    value={currency}
                                    onChange={(e) => { setCurrency(e.target.value); syncWithVault(categories, e.target.value, preferences); }}
                                    className="app-input h-14 pl-5 pr-10 text-xs font-black uppercase tracking-widest appearance-none cursor-pointer bg-transparent relative z-10"
                                >
                                    <option className="bg-[#1A1A1B]">BDT (৳)</option>
                                    <option className="bg-[#1A1A1B]">USD ($)</option>
                                    <option className="bg-[#1A1A1B]">EUR (€)</option>
                                    <option className="bg-[#1A1A1B]">INR (₹)</option>
                                    <option className="bg-[#1A1A1B]">SAR (SR)</option>
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 opacity-30 pointer-events-none" size={16} />
                            </div>
                        </div>
                        <div className="app-card p-8">
                             <h4 className="text-xs font-black text-[var(--text-main)] uppercase tracking-[2px] flex items-center gap-3 mb-6">
                                <CreditCard size={18} className="text-green-500" /> Default Method
                            </h4>
                            <div className="flex gap-3">
                                <button className="flex-1 h-14 rounded-2xl border-2 border-orange-500 bg-orange-500/5 text-orange-500 text-[10px] font-black uppercase tracking-widest shadow-inner">CASH</button>
                                <button className="flex-1 h-14 rounded-2xl border border-[var(--border-color)] text-[var(--text-muted)] text-[10px] font-black uppercase tracking-widest opacity-30 cursor-not-allowed">BANK</button>
                            </div>
                        </div>
                    </div>

                    {/* 3. SYSTEM PROTOCOLS */}
                    <div className="app-card p-8">
                        <h4 className="text-xs font-black text-[var(--text-main)] uppercase tracking-[2px] flex items-center gap-3 mb-8">
                            <Bell size={18} className="text-yellow-500" /> Notification Logic
                        </h4>
                        <div className="space-y-4">
                            {[
                                { id: 'dailyReminder', label: 'Sync Reminders', desc: 'Protocol for daily ledger maintenance' },
                                { id: 'weeklyReports', label: 'AI Analytics', desc: 'Process automated weekly summaries' },
                                { id: 'highExpenseAlert', label: 'Overhead Alert', desc: 'Notification on high capital outflow' }
                            ].map((item) => (
                                <div key={item.id} className="flex items-center justify-between p-5 bg-[var(--bg-app)] rounded-2xl border border-[var(--border-color)] hover:border-slate-400/30 transition-all group">
                                    <div>
                                        <p className="text-[11px] font-black uppercase text-[var(--text-main)] tracking-wider">{item.label}</p>
                                        <p className="text-[9px] font-bold text-[var(--text-muted)] mt-1 uppercase opacity-60 tracking-tight">{item.desc}</p>
                                    </div>
                                    <button 
                                        onClick={() => togglePreference(item.id)}
                                        className={`w-14 h-7 rounded-full relative transition-all duration-500 shadow-inner ${preferences[item.id as keyof typeof preferences] ? 'bg-green-600' : 'bg-slate-700'}`}
                                    >
                                        <div className={`w-5 h-5 bg-white rounded-full absolute top-1 shadow-2xl transition-all duration-300 ${preferences[item.id as keyof typeof preferences] ? 'right-1' : 'left-1'}`}></div>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* --- RIGHT COLUMN --- */}
                <div className="space-y-8">
                    {/* SECURITY STATUS */}
                    <div className="app-card p-8 relative overflow-hidden group">
                        <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:opacity-10 transition-opacity rotate-12">
                            <Lock size={150} className="text-white" />
                        </div>
                        <h4 className="text-xs font-black text-green-500 uppercase tracking-[2px] flex items-center gap-3 mb-8 relative z-10">
                            <ShieldCheck size={20} className="text-green-500" /> Security Status
                        </h4>
                        <div className="space-y-4 relative z-10">
                            <div className="p-4 border border-white/5 rounded-2xl flex justify-between items-center bg-white/[0.02]">
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Encryption</span>
                                <span className="text-[8px] font-black bg-green-500/20 text-green-400 px-3 py-1 rounded-full border border-green-500/30 animate-pulse">AES-256</span>
                            </div>
                            <div className="p-4 border border-white/5 rounded-2xl flex justify-between items-center bg-white/[0.02]">
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Vault Status</span>
                                <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <Activity size={10} /> Online
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* DATA MANAGEMENT */}
                    <div className="app-card p-8">
                        <h4 className="text-xs font-black text-[var(--text-main)] uppercase tracking-[2px] flex items-center gap-3 mb-8">
                            <Database size={18} className="text-blue-500" /> Maintenance
                        </h4>
                        <div className="space-y-3">
                            <button className="w-full flex items-center justify-between p-5 bg-blue-500/5 border border-blue-500/20 rounded-2xl text-blue-500 hover:bg-blue-500 hover:text-white transition-all group">
                                <span className="text-[10px] font-black uppercase tracking-[2px]">Archive Data</span>
                                <Download size={18} className="group-hover:translate-y-0.5 transition-transform" />
                            </button>
                            <div className="p-4 bg-[var(--bg-app)] rounded-2xl border border-[var(--border-color)]">
                                <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase leading-relaxed text-center">
                                    System automatically optimizes the vault indexing every 24 hours for peak performance.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* FINAL FOOTER */}
            <div className="text-center pt-16 border-t border-[var(--border-color)] opacity-30">
                <p className="text-[11px] font-black uppercase tracking-[10px] text-[var(--text-main)]">Vault Engine v4.8.2</p>
                <p className="text-[8px] font-bold mt-3 uppercase tracking-widest text-[var(--text-muted)] italic">Core Architecture & Design by Rahul Dutta</p>
            </div>
        </motion.div>
    );
};