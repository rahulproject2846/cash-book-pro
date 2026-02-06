"use client";
import React from 'react';
import { Layers, Plus, X, AlertCircle, Globe, ChevronDown, Cpu, Tag, Zap } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';

/**
 * VAULT PRO: GOVERNANCE MODULE (ELITE EDITION)
 * -------------------------------------------
 * Handles Registry Tags, Expense Thresholds, and Global Currency.
 * Fully optimized for Compact Mode & Midnight Theme.
 */
export const GovernanceModule = ({ 
    categories, addCategory, removeCategory, 
    limitBuffer, setLimitBuffer, saveLimit, 
    currency, updateCurrency, newCat, setNewCat 
}: any) => {
    const { T, t } = useTranslation();

    return (
        <div className="relative bg-[var(--bg-card)] rounded-[32px] border border-[var(--border)] p-[var(--card-padding,2rem)] overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 group">
            
            {/* Background Decor (Midnight Aware) */}
            <div className="absolute -right-10 -top-10 opacity-[0.03] rotate-12 pointer-events-none group-hover:opacity-[0.06] transition-opacity">
                <Layers size={300} className="text-[var(--text-main)]" />
            </div>
            
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-[var(--app-gap,3rem)]">
                
                {/* --- ১. REGISTRY TAG MANAGER --- */}
                <div className="space-y-[var(--app-gap,1.5rem)]">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-orange-500/10 rounded-xl text-orange-500 border border-orange-500/20">
                            <Tag size={20} strokeWidth={2.5} />
                        </div>
                        <h4 className="text-sm font-black text-[var(--text-main)] uppercase tracking-[3px] italic">
                            {T('registry_tags')}
                        </h4>
                    </div>
                    
                    <div className="flex gap-3">
                        <div className="relative flex-1 group/input">
                            <input 
                                className="w-full h-14 bg-[var(--bg-app)] border-2 border-[var(--border)] rounded-2xl px-5 text-[11px] font-black uppercase tracking-widest outline-none focus:border-orange-500/50 transition-all placeholder:text-[var(--text-muted)]/30 text-[var(--text-main)]" 
                                placeholder={t('placeholder_new_tag')} 
                                value={newCat}
                                onChange={(e) => setNewCat(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addCategory(newCat)}
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none">
                                <Cpu size={18} />
                            </div>
                        </div>
                        <Tooltip text={t('tt_add_tag_btn')}>
                            <button 
                                onClick={() => addCategory(newCat)} 
                                className="bg-orange-500 text-white w-14 h-14 rounded-2xl flex items-center justify-center hover:bg-orange-600 active:scale-95 transition-all shadow-lg shadow-orange-500/20 border-4 border-[var(--bg-card)]"
                            >
                                <Plus size={24} strokeWidth={3} />
                            </button>
                        </Tooltip>
                    </div>

                    <div className="flex flex-wrap gap-2.5 max-h-40 overflow-y-auto no-scrollbar pt-2">
                        {categories.map((cat: string) => (
                            <div key={cat} className="flex items-center gap-3 bg-[var(--bg-app)] border border-[var(--border)] px-4 py-2.5 rounded-xl group/tag hover:border-orange-500/30 hover:bg-orange-500/5 transition-all cursor-default">
                                <span className="text-[10px] font-black uppercase text-[var(--text-muted)] group-hover/tag:text-orange-500 tracking-wider">
                                    {cat}
                                </span>
                                <button 
                                    onClick={() => removeCategory(cat)} 
                                    className="text-[var(--text-muted)] hover:text-red-500 transition-colors p-0.5 rounded-md hover:bg-red-500/10"
                                >
                                    <X size={14} strokeWidth={3} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* --- ২. THRESHOLD & CURRENCY --- */}
                <div className="space-y-[var(--app-gap,2rem)]">
                    
                    {/* Expense Threshold */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-500/10 rounded-xl text-red-500 border border-red-500/20">
                                <AlertCircle size={20} strokeWidth={2.5} />
                            </div>
                            <h4 className="text-sm font-black text-[var(--text-main)] uppercase tracking-[3px] italic">
                                {T('expense_threshold')}
                            </h4>
                        </div>
                        
                        <div className="relative group/limit">
                            <input 
                                type="number"
                                className="w-full h-14 bg-red-500/[0.03] border-2 border-red-500/20 rounded-2xl pl-5 pr-20 text-[14px] font-mono font-bold text-[var(--text-main)] outline-none focus:border-red-500/50 focus:bg-red-500/[0.05] transition-all" 
                                value={limitBuffer}
                                onChange={(e) => setLimitBuffer(Number(e.target.value))}
                                onBlur={saveLimit}
                            />
                            <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                <div className="h-4 w-px bg-red-500/20" />
                                <span className="text-[9px] font-black text-red-500 uppercase tracking-widest opacity-60">
                                    {T('label_monthly_cap')}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Base Currency */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500 border border-blue-500/20">
                                <Globe size={20} strokeWidth={2.5} />
                            </div>
                            <h4 className="text-sm font-black text-[var(--text-main)] uppercase tracking-[3px] italic">
                                {T('base_currency')}
                            </h4>
                        </div>

                        <div className="relative group/currency">
                            <select 
                                value={currency}
                                onChange={(e) => updateCurrency(e.target.value)}
                                className="w-full h-14 appearance-none bg-[var(--bg-app)] border-2 border-[var(--border)] rounded-2xl pl-5 pr-12 text-[11px] font-black uppercase tracking-widest text-[var(--text-main)] outline-none focus:border-blue-500/50 cursor-pointer transition-all hover:bg-[var(--bg-card)]"
                            >
                                <option value="BDT (৳)">BDT (৳)</option>
                                <option value="USD ($)">USD ($)</option>
                                <option value="EUR (€)">EUR (€)</option>
                                <option value="INR (₹)">INR (₹)</option>
                            </select>
                            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-muted)] group-hover/currency:text-blue-500 transition-colors">
                                <ChevronDown size={18} strokeWidth={2.5} />
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};