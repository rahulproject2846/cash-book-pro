"use client";
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    Layers, Globe, Bell, ShieldCheck, Database, 
    CreditCard, RefreshCcw, Plus, X, Download, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

export const SettingsSection = ({ currentUser, setCurrentUser }: any) => {
    // ডিফল্ট ভ্যালু সেট করা হয়েছে যাতে ডাটাবেসে ডাটা না থাকলেও খালি না দেখায়
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

    // ডাটাবেস সিঙ্ক ফাংশন
    const syncWithDB = async (updatedCats: string[], updatedCurr: string, updatedPref: any) => {
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
            
            if (res.ok) {
                const updatedUser = await res.json();
                setCurrentUser(updatedUser);
                localStorage.setItem('cashbookUser', JSON.stringify(updatedUser));
                toast.success("Settings Saved to Cloud");
            } else {
                throw new Error();
            }
        } catch (error) {
            toast.error("Sync Failed: Check API Connection");
        } finally {
            setIsSaving(false);
        }
    };

    const addCategory = () => {
        const trimmed = newCat.trim();
        if (!trimmed || categories.includes(trimmed)) return;
        const newList = [...categories, trimmed];
        setCategories(newList);
        setNewCat('');
        syncWithDB(newList, currency, preferences);
    };

    const removeCategory = (name: string) => {
        const newList = categories.filter(c => c !== name);
        setCategories(newList);
        syncWithDB(newList, currency, preferences);
    };

    const togglePreference = (key: string) => {
        const newPref = { ...preferences, [key]: !preferences[key as keyof typeof preferences] };
        setPreferences(newPref);
        syncWithDB(categories, currency, newPref);
    };

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto space-y-8 pb-20 px-4">
            
            {/* Header with Typography Fix */}
            <div className="flex justify-between items-end border-b border-[var(--border-color)] pb-6">
                <div>
                    <h2 className="text-4xl font-black text-[var(--text-main)] uppercase tracking-tighter italic leading-none">System Configuration</h2>
                    <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-[4px] mt-2 opacity-70">Core Engine & Global Preferences</p>
                </div>
                {isSaving && (
                    <div className="flex items-center gap-2 text-orange-500 text-[10px] font-black uppercase tracking-widest bg-orange-500/5 px-4 py-2 rounded-full border border-orange-500/20">
                        <RefreshCcw size={14} className="animate-spin" /> Syncing in progress...
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                <div className="lg:col-span-2 space-y-8">
                    {/* 1. TRANSACTION TAGS */}
                    <div className="app-card p-8 border-l-4 shadow-sm">
                        <h4 className="text-sm font-black text-[var(--text-main)] uppercase tracking-widest flex items-center gap-3 mb-8">
                            <Layers size={20} className="text-orange-500" /> Transaction Tags
                        </h4>
                        <div className="space-y-6">
                            <div className="flex gap-3">
                                <input 
                                    className="app-input flex-1 py-4 text-sm font-bold uppercase placeholder:text-slate-300" 
                                    placeholder="Enter Tag Name (e.g. Health)" 
                                    value={newCat}
                                    onChange={(e) => setNewCat(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                                />
                                <button onClick={addCategory} className="bg-orange-500 text-white px-8 rounded-2xl hover:bg-orange-600 active:scale-95 transition-all shadow-lg shadow-orange-500/20">
                                    <Plus size={24} strokeWidth={3} />
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                {categories.map(cat => (
                                    <div key={cat} className="flex items-center gap-3 bg-[var(--bg-app)] border border-[var(--border-color)] pl-4 pr-2 py-2.5 rounded-xl group hover:border-orange-500/50 transition-all shadow-sm">
                                        <span className="text-[11px] font-black uppercase text-[var(--text-main)]">{cat}</span>
                                        <button onClick={() => removeCategory(cat)} className="p-1 rounded-md text-slate-300 hover:bg-red-500/10 hover:text-red-500 transition-all">
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 2. REGIONAL & PAYMENT */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="app-card p-8 shadow-sm">
                            <h4 className="text-sm font-black text-[var(--text-main)] uppercase tracking-widest flex items-center gap-3 mb-6">
                                <Globe size={20} className="text-blue-500" /> System Currency
                            </h4>
                            <div className="relative">
                                <select 
                                    value={currency}
                                    onChange={(e) => { setCurrency(e.target.value); syncWithDB(categories, e.target.value, preferences); }}
                                    className="app-input w-full py-4 pl-4 pr-10 text-sm font-bold uppercase cursor-pointer appearance-none bg-transparent"
                                >
                                    <option className="bg-white dark:bg-slate-900 text-black dark:text-white">BDT (৳)</option>
                                    <option className="bg-white dark:bg-slate-900 text-black dark:text-white">USD ($)</option>
                                    <option className="bg-white dark:bg-slate-900 text-black dark:text-white">EUR (€)</option>
                                    <option className="bg-white dark:bg-slate-900 text-black dark:text-white">INR (₹)</option>
                                    <option className="bg-white dark:bg-slate-900 text-black dark:text-white">SAR (SR)</option>
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">▼</div>
                            </div>
                        </div>
                        <div className="app-card p-8 shadow-sm">
                             <h4 className="text-sm font-black text-[var(--text-main)] uppercase tracking-widest flex items-center gap-3 mb-6">
                                <CreditCard size={20} className="text-green-500" /> Default Method
                            </h4>
                            <div className="flex gap-3">
                                <button className="flex-1 py-4 rounded-2xl border-2 border-orange-500/20 bg-orange-500/5 text-orange-500 text-[11px] font-black uppercase tracking-widest">CASH</button>
                                <button className="flex-1 py-4 rounded-2xl border border-[var(--border-color)] text-[var(--text-muted)] text-[11px] font-black uppercase tracking-widest opacity-40 cursor-not-allowed">BANK</button>
                            </div>
                        </div>
                    </div>

                    {/* 3. ALERTS */}
                    <div className="app-card p-8 shadow-sm">
                        <h4 className="text-sm font-black text-[var(--text-main)] uppercase tracking-widest flex items-center gap-3 mb-8">
                            <Bell size={20} className="text-yellow-500" /> Engine Protocols
                        </h4>
                        <div className="space-y-4">
                            {[
                                { id: 'dailyReminder', label: 'Sync Reminders', desc: 'Auto-ping for daily ledger updates' },
                                { id: 'weeklyReports', label: 'AI Analytics', desc: 'Process automated performance reports' },
                                { id: 'highExpenseAlert', label: 'Budget Warning', desc: 'Alert when transaction exceeds 10,000' }
                            ].map((item) => (
                                <div key={item.id} className="flex items-center justify-between p-5 bg-[var(--bg-app)] rounded-2xl border border-[var(--border-color)] hover:border-slate-300 transition-colors">
                                    <div>
                                        <p className="text-xs font-black uppercase text-[var(--text-main)] tracking-wider">{item.label}</p>
                                        <p className="text-[10px] font-bold text-[var(--text-muted)] mt-1 uppercase opacity-60">{item.desc}</p>
                                    </div>
                                    <button 
                                        onClick={() => togglePreference(item.id)}
                                        className={`w-14 h-7 rounded-full relative transition-all duration-300 shadow-inner ${preferences[item.id as keyof typeof preferences] ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                                    >
                                        <div className={`w-5 h-5 bg-white rounded-full absolute top-1 shadow-md transition-all duration-300 ${preferences[item.id as keyof typeof preferences] ? 'right-1' : 'left-1'}`}></div>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    {/* 4. SECURITY STATUS */}
                    <div className="app-card p-8 shadow-sm relative overflow-hidden group">
                        <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <ShieldCheck size={120} className="text-white" />
                        </div>
                        <h4 className="text-xs font-black text-green-500 uppercase tracking-widest flex items-center gap-3 mb-8 relative z-10">
                            <ShieldCheck size={20} className="text-green-500" /> Security Status
                        </h4>
                        <div className="p-4 border border-white/10 rounded-2xl flex justify-between items-center bg-white/5 relative z-10">
                             <span className="text-[10px] font-black uppercase text-slate-400">Database Encryption</span>
                             <span className="text-[9px] font-black bg-green-500/20 text-green-400 px-3 py-1 rounded-full border border-green-500/20 animate-pulse">ACTIVE</span>
                        </div>
                    </div>

                    {/* 5. DATA MANAGEMENT */}
                    <div className="app-card p-8 shadow-sm">
                        <h4 className="text-sm font-black text-[var(--text-main)] uppercase tracking-widest flex items-center gap-3 mb-6">
                            <Database size={20} className="text-blue-500" /> Management
                        </h4>
                        <button className="w-full flex items-center justify-between p-5 bg-blue-500/5 border border-blue-500/20 rounded-2xl text-blue-500 hover:bg-blue-500 hover:text-white transition-all group">
                            <span className="text-[11px] font-black uppercase tracking-widest">Backup Database</span>
                            <Download size={18} className="group-hover:translate-y-0.5 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Footer */}
            <div className="text-center pt-16 opacity-30 border-t border-[var(--border-color)]">
                <p className="text-[11px] font-black uppercase tracking-[8px] text-[var(--text-main)]">Vault Engine v4.0.8</p>
                <p className="text-[9px] font-bold mt-2 uppercase tracking-widest text-[var(--text-muted)]">Crafted by Rahul Dutta</p>
            </div>
        </motion.div>
    );
};